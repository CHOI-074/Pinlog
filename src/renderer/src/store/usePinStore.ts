import { create } from 'zustand'
import {
  DEFAULT_LOOK,
  ONBOARDING_VERSION,
  type AvatarLook,
  type ClockView,
  type Pin,
  type ThemeMode,
  type Wallet,
  type WindowKind
} from '@shared/types'
import { itemOf, isShopItem, isUnlocked, sanitizeLook, type SlotId } from '@/lib/avatar'
import { bridge, isDesktop } from '@/lib/bridge'
import type { AdState, ShowOutcome } from '@/lib/rewardAd'
import { adsLeftToday, buy, earn, rewardAmount, type BuyResult } from '@/lib/wallet'

interface Draft {
  open: boolean
  /** 편집 중인 기존 핀 id. null 이면 새 핀 */
  editingId: string | null
  timestamp: number
  text: string
  /** 상세 메모 — 한 줄로 부족할 때 */
  detail: string
  tags: string[]
  isFocusMode: boolean
}

const emptyDraft = (timestamp = Date.now()): Draft => ({
  open: false,
  editingId: null,
  timestamp,
  text: '',
  detail: '',
  tags: [],
  isFocusMode: false
})

interface PinState {
  pins: Pin[]
  loading: boolean
  view: ClockView
  kind: WindowKind
  theme: ThemeMode
  /** 주간 캘린더에서 고른 날(그날 0시). null 이면 전체 기간 */
  selectedDay: number | null
  /** 캐릭터가 입고 있는 것. 레벨·경험치는 pins 에서 계산하므로 여기 없다. */
  look: AvatarLook
  /**
   * 온보딩에서 보고 있는 장 (0부터). null 이면 온보딩이 닫혀 있다.
   * 컴포넌트 안이 아니라 스토어에 두는 이유: 토스 시스템 뒤로가기가
   * App 에서 처리되는데, 거기서 '이전 장으로'를 하려면 현재 장을 알아야 한다.
   */
  onboardingStep: number | null
  /**
   * 광고 리워드 지갑. **null 이면 상점이 없다** — 데스크탑·웹이거나,
   * 저장소를 읽지 못했을 때. 읽기에 실패했는데 빈 지갑으로 시작하면
   * 다음 저장 때 진짜 잔액을 0 으로 덮어쓰게 되므로, 차라리 상점을 숨긴다.
   */
  wallet: Wallet | null
  adState: AdState
  draft: Draft

  init(): Promise<void>
  setView(view: ClockView): void
  setTheme(mode: ThemeMode): void
  selectDay(dayStart: number | null): void
  /** 슬롯 하나만 갈아입힌다 */
  setLookPart(slot: SlotId, id: string): void
  /** 꾸미기 화면에 들어왔다 — 광고를 미리 불러 둔다 (버튼을 누른 뒤 기다리지 않게) */
  prepareAd(): void
  /** 보상형 광고를 보여주고, 끝까지 보면 리워드를 넣는다 */
  watchAd(): Promise<ShowOutcome | 'limit'>
  /** 리워드로 사고, 산 것을 바로 입는다 */
  buyItem(slot: SlotId, id: string): BuyResult
  openOnboarding(): void
  setOnboardingStep(step: number): void
  /** 건너뛰기·시작하기·뒤로가기 모두 여기로 온다 — 어떤 경로로 닫든 '봤다'로 기록한다 */
  closeOnboarding(): void
  setMode(to: WindowKind): void

  /** 입력창 없이 지금 시각으로 바로 기록 (프리셋 원탭) */
  quickAdd(label: string, tag: string): Promise<void>

  /** 핀 찍기 시작 — 시계 클릭 / [+] 버튼 / 전역 단축키의 공통 진입점 */
  openComposer(timestamp?: number): void
  openEditor(pin: Pin): void
  closeComposer(): void
  patchDraft(patch: Partial<Draft>): void
  toggleDraftTag(tag: string): void
  /** 프리셋에 없는 태그를 직접 입력해서 추가 */
  addDraftTag(tag: string): void
  removeDraftTag(tag: string): void
  /** 'HH:MM' 문자열로 기록 시각을 수기 조정 */
  setDraftTime(hhmm: string): void
  commitDraft(): Promise<void>

  removePin(id: string): Promise<void>
  toggleFocus(id: string): Promise<void>
}

/*
 * 지갑 저장은 순서대로 한 줄로 세운다.
 * 광고 보상과 구매가 거의 동시에 일어나면 비동기 저장이 뒤바뀌어
 * 옛 잔액이 나중에 써질 수 있다. 화면(메모리)은 즉시, 저장은 차례대로.
 */
let walletQueue: Promise<void> = Promise.resolve()
function saveWallet(next: Wallet, set: (p: Partial<PinState>) => void): void {
  set({ wallet: next })
  walletQueue = walletQueue
    .then(() => bridge.rewards?.wallet.set(next))
    .catch((err) => console.error('[rewards] 지갑 저장 실패:', err))
}

export const usePinStore = create<PinState>((set, get) => ({
  pins: [],
  loading: true,
  view: (localStorage.getItem('pinlog:view') as ClockView) ?? 'analog',
  kind: 'main',
  theme: 'system',
  selectedDay: null,
  look: DEFAULT_LOOK,
  onboardingStep: null,
  wallet: null,
  adState: 'unsupported',
  draft: emptyDraft(),

  async init() {
    const [pins, kind, theme, look, seenOnboarding] = await Promise.all([
      bridge.pins.list(),
      bridge.window.kind(),
      bridge.theme.get(),
      bridge.avatar.get(),
      bridge.onboarding.get()
    ])

    /*
     * 온보딩은 메인 화면에서, 아직 이 버전을 안 본 사람에게만.
     *
     * 단, 기록이 이미 있는 사람은 건너뛴다. 온보딩이 생기기 전부터 쓰던
     * 사용자인데, 업데이트 후 앱을 열자마자 "지금 하는 일을 한 번에
     * 기록해요"를 세 장 넘기게 하면 소개가 아니라 방해다.
     * 대신 '봤다'로 기록해 두어, 다음에 온보딩 버전을 올리면 그때는 뜬다.
     * (다시 보고 싶으면 메인 화면 아래 '사용법 다시 보기')
     */
    let onboardingStep: number | null = null
    if (kind === 'main' && seenOnboarding < ONBOARDING_VERSION) {
      if (pins.length === 0) onboardingStep = 0
      else void bridge.onboarding.set(ONBOARDING_VERSION)
    }

    // 저장된 값에 모르는 아이템 id 가 있으면(예전 버전·손수정) 기본값으로 되돌린다
    set({
      pins,
      kind,
      theme: theme.mode,
      look: sanitizeLook(look),
      onboardingStep,
      loading: false
    })

    // 상점은 토스 빌드에서만. 지갑을 못 읽으면 상점을 닫아 둔다(위 wallet 설명)
    const rewards = bridge.rewards
    if (rewards) {
      try {
        set({ wallet: await rewards.wallet.get(), adState: rewards.ad.state })
        rewards.ad.subscribe((adState) => set({ adState }))
      } catch (err) {
        console.error('[rewards] 지갑을 읽지 못해 상점을 숨깁니다:', err)
      }
    }

    // 다른 창에서 테마를 바꾸거나 OS 설정이 바뀌면 선택 UI 도 같이 갱신한다.
    // 색 자체는 nativeTheme 가 prefers-color-scheme 으로 바꿔주므로 여기서 안 건드린다.
    bridge.theme.onChanged((s) => set({ theme: s.mode }))
    // 다른 창에서의 변경을 구독 (메인 ↔ 미니 ↔ 입력창 실시간 동기화)
    bridge.pins.onChanged((next) => set({ pins: next }))
    bridge.onQuickPin(() => get().openComposer())

    // 입력 전용 창은 쿼리스트링으로 받은 초기값으로 바로 입력 상태를 연다
    if (kind === 'composer') {
      const q = new URLSearchParams(location.search)
      const editingId = q.get('id')
      const timestamp = Number(q.get('ts')) || Date.now()
      const pin = editingId ? pins.find((p) => p.id === editingId) : undefined
      set({
        draft: pin
          ? {
              open: true,
              editingId: pin.id,
              timestamp: pin.timestamp,
              text: pin.text,
              detail: pin.detail ?? '',
              tags: pin.tags,
              isFocusMode: pin.isFocusMode
            }
          : { ...emptyDraft(timestamp), open: true }
      })
    }
  },

  setView(view) {
    localStorage.setItem('pinlog:view', view)
    set({ view })
    // 미니 창은 뷰마다 모양이 달라서 창 크기도 함께 바꾼다
    if (get().kind === 'mini') void bridge.window.resizeMini(view)
  },

  setTheme(mode) {
    set({ theme: mode })
    void bridge.theme.set(mode)
  },

  selectDay(dayStart) {
    set({ selectedDay: dayStart })
  },

  openOnboarding() {
    set({ onboardingStep: 0 })
  },

  setOnboardingStep(step) {
    set({ onboardingStep: step })
  },

  closeOnboarding() {
    set({ onboardingStep: null })
    void bridge.onboarding.set(ONBOARDING_VERSION)
  },

  setLookPart(slot, id) {
    // 사지 않은 상점 아이템은 입지 못한다 (화면이 막지만, 여기서 한 번 더 막는다)
    const item = itemOf(slot, id)
    const { look, wallet } = get()
    if (item && isShopItem(item) && !isUnlocked(slot, item, 1, look[slot], wallet?.owned)) return

    // 화면은 즉시 바꾸고 저장은 뒤따르게 한다 — 고르는 맛이 저장 속도에 묶이면 안 된다
    const next = { ...get().look, [slot]: id }
    set({ look: next })
    void bridge.avatar.set(next)
  },

  prepareAd() {
    const { wallet } = get()
    if (!bridge.rewards || !wallet || adsLeftToday(wallet, Date.now()) === 0) return
    bridge.rewards.ad.preload()
  },

  async watchAd() {
    const rewards = bridge.rewards
    const wallet = get().wallet
    if (!rewards || !wallet) return 'failed'
    if (adsLeftToday(wallet, Date.now()) === 0) return 'limit'

    return rewards.ad.show((unitAmount) => {
      // 보상은 이벤트가 온 그 순간 넣고 바로 저장한다 — 광고를 닫기 전에 앱이 꺼져도 남게
      const current = get().wallet
      if (!current) return
      saveWallet(earn(current, rewardAmount(unitAmount), Date.now()), set)
    })
  },

  buyItem(slot, id) {
    const item = itemOf(slot, id)
    const wallet = get().wallet
    if (!wallet || !item || item.price === undefined) return { ok: false, reason: 'short' }
    const result = buy(wallet, slot, id, item.price)
    if (result.ok) {
      saveWallet(result.wallet, set)
      get().setLookPart(slot, id)
    }
    return result
  },

  setMode(to) {
    void bridge.window.setMode(to, get().view)
  },

  async quickAdd(label, tag) {
    await bridge.pins.add({
      timestamp: Date.now(),
      text: label,
      tags: [tag],
      isFocusMode: false
    })
    set({ pins: await bridge.pins.list() })
  },

  openComposer(timestamp) {
    // 데스크탑에서는 위젯 크기에 묶이지 않도록 독립 창으로 띄운다.
    // (웹/PWA 에는 창이 없으므로 인라인 모달로 폴백)
    if (isDesktop && get().kind !== 'composer') {
      void bridge.composer.open({ timestamp: timestamp ?? Date.now() })
      return
    }
    set({ draft: { ...emptyDraft(timestamp ?? Date.now()), open: true } })
  },

  openEditor(pin) {
    if (isDesktop && get().kind !== 'composer') {
      void bridge.composer.open({ timestamp: pin.timestamp, editingId: pin.id })
      return
    }
    set({
      draft: {
        open: true,
        editingId: pin.id,
        timestamp: pin.timestamp,
        text: pin.text,
        detail: pin.detail ?? '',
        tags: pin.tags,
        isFocusMode: pin.isFocusMode
      }
    })
  },

  closeComposer() {
    // 입력 전용 창에서는 '닫기'가 곧 창 닫기다
    if (get().kind === 'composer') {
      void bridge.window.close()
      return
    }
    set((s) => ({ draft: { ...s.draft, open: false } }))
  },

  patchDraft(patch) {
    set((s) => ({ draft: { ...s.draft, ...patch } }))
  },

  toggleDraftTag(tag) {
    set((s) => ({
      draft: {
        ...s.draft,
        tags: s.draft.tags.includes(tag)
          ? s.draft.tags.filter((t) => t !== tag)
          : [...s.draft.tags, tag]
      }
    }))
  },

  addDraftTag(tag) {
    const clean = tag.trim().replace(/^#/, '')
    if (!clean) return
    set((s) => ({
      draft: {
        ...s.draft,
        tags: s.draft.tags.includes(clean) ? s.draft.tags : [...s.draft.tags, clean]
      }
    }))
  },

  removeDraftTag(tag) {
    set((s) => ({ draft: { ...s.draft, tags: s.draft.tags.filter((t) => t !== tag) } }))
  },

  setDraftTime(hhmm) {
    const [h, m] = hhmm.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return
    set((s) => {
      const d = new Date(s.draft.timestamp)
      d.setHours(h, m, 0, 0)
      return { draft: { ...s.draft, timestamp: d.getTime() } }
    })
  },

  async commitDraft() {
    const { draft } = get()
    // 텍스트도 태그도 없으면 저장할 게 없다
    if (!draft.text.trim() && !draft.detail.trim() && draft.tags.length === 0) {
      set({ draft: emptyDraft() })
      if (get().kind === 'composer') void bridge.window.close()
      return
    }
    const payload = {
      timestamp: draft.timestamp,
      text: draft.text.trim(),
      detail: draft.detail.trim(),
      tags: draft.tags,
      isFocusMode: draft.isFocusMode
    }
    if (draft.editingId) {
      await bridge.pins.update(draft.editingId, payload)
    } else {
      await bridge.pins.add(payload)
    }
    set({ draft: emptyDraft(), pins: await bridge.pins.list() })
    if (get().kind === 'composer') void bridge.window.close()
  },

  async removePin(id) {
    await bridge.pins.remove(id)
    set({ pins: await bridge.pins.list() })
  },

  async toggleFocus(id) {
    const pin = get().pins.find((p) => p.id === id)
    if (!pin) return
    await bridge.pins.update(id, { isFocusMode: !pin.isFocusMode })
    set({ pins: await bridge.pins.list() })
  }
}))

/** 오늘 찍힌 핀만 (아날로그 다이얼 마커용) */
export const selectTodayPins = (pins: Pin[]): Pin[] => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return pins.filter((p) => p.timestamp >= start.getTime())
}
