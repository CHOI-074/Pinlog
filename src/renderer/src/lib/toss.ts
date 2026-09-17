/**
 * 앱인토스(미니앱) 어댑터.
 *
 * 이 파일은 **토스 빌드에서만** 번들에 들어간다 (main.tsx 의 __TOSS_BUILD__ 분기).
 * PWA/Electron 빌드에는 SDK 가 한 줄도 포함되지 않는다.
 *
 * 왜 localStorage 를 안 쓰는가:
 *   미니앱은 토스 앱의 WebView 안에서 돈다. WebView 저장소는 앱이 캐시를 정리하면
 *   같이 날아갈 수 있다 — 일기 앱에서는 치명적이다.
 *   SDK 의 Storage 는 "앱이 종료되어도 유지"되는 네이티브 저장소라 이쪽을 쓴다.
 */

import {
  Environment,
  Screen,
  Storage,
  TossAds,
  graniteEvent,
  loadFullScreenAd,
  showFullScreenAd
} from '@apps-in-toss/web-framework'
import { DEFAULT_LOOK, isAvatarLook, normalizeLook, normalizeWallet, type Pin } from '@shared/types'
import { setBridge, type PinLogBridge } from './bridge'
import { createRewardAd, type RewardAd } from './rewardAd'

const PINS_KEY = 'pinlog:pins'
const THEME_KEY = 'pinlog:theme'
const AVATAR_KEY = 'pinlog:avatar'
const ONBOARDING_KEY = 'pinlog:onboarding'
const WALLET_KEY = 'pinlog:wallet'

/**
 * 보상형 광고 그룹 ID.
 *
 * ⚠️ 개발·테스트 중에 운영 ID 로 광고를 띄우면 **정책 위반으로 제재**를 받을 수 있다
 *    (앱인토스 인앱 광고 문서). 그래서 운영 ID 는 두 조건이 모두 맞을 때만 쓴다:
 *      1. 출시용으로 빌드했다   — npm run build:toss:release (__TOSS_ADS_LIVE__)
 *      2. 진짜 토스 앱 안이다    — 샌드박스 앱이 아니다
 *    그 밖에는 전부 토스가 제공하는 테스트 ID 다. 테스트 ID 일 때는 꾸미기 화면에
 *    '테스트 광고' 표시가 붙는다 — 이게 보이는 번들을 출시하면 수익이 나지 않는다.
 */
const REWARD_AD_GROUP = {
  live: 'ait.v2.live.9684c2e6e5dc4aa1',
  test: 'ait-ad-test-rewarded-id'
}

function createTossRewardAd(): RewardAd {
  const live = __TOSS_ADS_LIVE__ && Environment.environment === 'toss'
  return createRewardAd(
    {
      load: (p) => loadFullScreenAd(p),
      show: (p) => showFullScreenAd(p),
      isSupported: () => loadFullScreenAd.isSupported() && showFullScreenAd.isSupported()
    },
    live ? REWARD_AD_GROUP.live : REWARD_AD_GROUP.test,
    !live
  )
}

/** 토스 앱(또는 샌드박스) 안에서 돌고 있는가 */
export function isInToss(): boolean {
  try {
    return Environment.environment === 'toss' || Environment.environment === 'sandbox'
  } catch {
    // 토스 밖에서는 접근 자체가 실패한다
    return false
  }
}

const readPins = async (): Promise<Pin[]> => {
  try {
    const raw = await Storage.getItem(PINS_KEY)
    return raw ? (JSON.parse(raw) as Pin[]) : []
  } catch (err) {
    console.error('[toss] 기록 읽기 실패:', err)
    return []
  }
}

const writePins = async (pins: Pin[]): Promise<void> => {
  await Storage.setItem(PINS_KEY, JSON.stringify(pins))
}

const sorted = (pins: Pin[]): Pin[] => [...pins].sort((a, b) => b.timestamp - a.timestamp)

/**
 * localStorage 에 남아 있던 기록을 네이티브 Storage 로 한 번 옮긴다.
 * 이전 버전(웹 저장소)을 쓰던 사용자의 기록이 사라지지 않게 하기 위함이다.
 */
async function migrateFromLocalStorage(): Promise<void> {
  try {
    const legacy = localStorage.getItem(PINS_KEY)
    if (!legacy) return
    const existing = await Storage.getItem(PINS_KEY)
    if (existing) return // 이미 옮겼거나 네이티브 쪽이 최신이면 건드리지 않는다
    await Storage.setItem(PINS_KEY, legacy)
    localStorage.removeItem(PINS_KEY)
    console.info('[toss] 웹 저장소의 기록을 네이티브 저장소로 옮겼습니다')
  } catch (err) {
    console.warn('[toss] 마이그레이션 건너뜀:', err)
  }
}

/** 미니앱에서는 창 개념이 없으므로 창 제어는 전부 no-op 이다 */
const noop = async (): Promise<void> => {}

function createTossBridge(): PinLogBridge {
  return {
    platform: 'toss',

    window: {
      kind: async () => 'main',
      setMode: noop,
      resizeMini: noop,
      toggleAlwaysOnTop: async () => false,
      isAlwaysOnTop: async () => false,
      // '닫기'는 미니앱 종료다
      close: async () => {
        await Screen.close()
      },
      minimize: noop
    },

    theme: {
      get: async () => {
        // 앱인토스 검수 기준이 라이트 모드라 기본값을 라이트로 둔다
        const mode = ((await Storage.getItem(THEME_KEY)) as 'light' | 'dark' | 'system') ?? 'light'
        const dark =
          mode === 'dark' ||
          (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
        return { mode, dark }
      },
      set: async (mode) => {
        await Storage.setItem(THEME_KEY, mode)
        const dark =
          mode === 'dark' ||
          (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
        return { mode, dark }
      },
      onChanged: () => () => {}
    },

    // 기록과 같은 이유로 네이티브 저장소를 쓴다 — 캐시가 정리돼도 꾸민 게 남아야 한다
    avatar: {
      get: async () => {
        try {
          const raw = await Storage.getItem(AVATAR_KEY)
          const parsed: unknown = raw ? JSON.parse(raw) : null
          return isAvatarLook(parsed) ? normalizeLook(parsed) : DEFAULT_LOOK
        } catch (err) {
          console.error('[toss] 캐릭터 설정 읽기 실패:', err)
          return DEFAULT_LOOK
        }
      },
      set: async (look) => {
        await Storage.setItem(AVATAR_KEY, JSON.stringify(look))
        return look
      }
    },

    onboarding: {
      get: async () => {
        try {
          const v = Number(await Storage.getItem(ONBOARDING_KEY))
          return Number.isInteger(v) && v >= 0 ? v : 0
        } catch {
          return 0
        }
      },
      set: async (version) => {
        await Storage.setItem(ONBOARDING_KEY, String(version))
      }
    },

    rewards: {
      wallet: {
        /*
         * 읽기 실패(Storage 호출 자체가 실패)는 삼키지 않고 던진다.
         * 빈 지갑으로 시작하면 다음 저장이 진짜 잔액을 0 으로 덮어쓴다 —
         * 스토어가 받아서 상점을 숨긴다.
         */
        get: async () => {
          const raw = await Storage.getItem(WALLET_KEY)
          if (!raw) return normalizeWallet(null)
          try {
            return normalizeWallet(JSON.parse(raw))
          } catch (err) {
            console.error('[toss] 지갑 데이터가 깨져 있습니다:', err)
            return normalizeWallet(null)
          }
        },
        set: async (w) => {
          await Storage.setItem(WALLET_KEY, JSON.stringify(w))
        }
      },
      ad: createTossRewardAd()
    },

    // 미니앱은 단일 화면이라 입력은 인라인 시트로 뜬다
    composer: { open: noop },

    pins: {
      list: async () => sorted(await readPins()),
      add: async (input) => {
        const pin: Pin = {
          id: crypto.randomUUID(),
          timestamp: input.timestamp ?? Date.now(),
          text: input.text?.trim() ?? '',
          detail: input.detail?.trim() || undefined,
          tags: input.tags ?? [],
          isFocusMode: input.isFocusMode ?? false
        }
        await writePins([...(await readPins()), pin])
        return pin
      },
      update: async (id, patch) => {
        const pins = await readPins()
        const i = pins.findIndex((p) => p.id === id)
        if (i === -1) return null
        pins[i] = { ...pins[i], ...patch, id }
        await writePins(pins)
        return pins[i]
      },
      remove: async (id) => {
        const pins = await readPins()
        const next = pins.filter((p) => p.id !== id)
        await writePins(next)
        return next.length !== pins.length
      },
      // 미니앱은 창이 하나라 외부 변경 알림이 필요 없다
      onChanged: () => () => {}
    },

    export: {
      // WebView 안에서는 파일 다운로드가 막힐 수 있어 클립보드를 기본 경로로 쓴다
      csv: async (csv) => {
        await navigator.clipboard.writeText(csv)
        return null
      },
      clipboard: async (text) => {
        await navigator.clipboard.writeText(text)
      }
    },

    onQuickPin: () => () => {}
  }
}

/**
 * 시스템 뒤로가기 처리.
 *
 * 검수 가이드가 "토스 뒤로가기와 자체 뒤로가기를 동시에 쓰지 말 것"을 요구한다.
 * 입력 시트가 열려 있으면 시트만 닫고, 아니면 미니앱을 나간다.
 */
export function installBackHandler(onBack: () => boolean): () => void {
  return graniteEvent.addEventListener('backEvent', {
    onEvent: () => {
      // onBack 이 true 를 돌려주면 '내가 처리했다'는 뜻이라 앱을 닫지 않는다
      if (onBack()) return
      void Screen.close()
    },
    onError: (err) => console.error('[toss] 뒤로가기 처리 실패:', err)
  })
}

/**
 * 배너 광고를 붙인다. 초기 수익화 경로(사업자등록 없이 가능).
 *
 * `adGroupId` 는 앱인토스 콘솔에서 발급받는다.
 * 광고가 없을 때(onNoFill) 빈 칸을 남기지 않는 게 중요하다 —
 * 검수 가이드가 빈 영역과 오해를 부르는 UI 를 반려 사유로 든다.
 */
export function attachBanner(el: HTMLElement, adGroupId: string): (() => void) | null {
  if (!TossAds.attachBanner.isSupported()) return null
  try {
    TossAds.initialize({
      callbacks: {
        onInitializationFailed: (err) => console.warn('[toss] 광고 초기화 실패:', err)
      }
    })
    const slot = TossAds.attachBanner(adGroupId, el, {
      // 앱 테마를 따라간다
      theme: 'auto',
      variant: 'card',
      callbacks: {
        onNoFill: () => {
          el.style.display = 'none'
        },
        onAdFailedToRender: () => {
          el.style.display = 'none'
        }
      }
    })
    return () => slot.destroy()
  } catch (err) {
    console.warn('[toss] 배너 광고 붙이기 실패:', err)
    return null
  }
}

/** 앱 시작 시 한 번 호출 — 저장소 어댑터를 갈아끼운다 */
export async function installTossPlatform(): Promise<void> {
  if (!isInToss()) return
  await migrateFromLocalStorage()
  setBridge(createTossBridge())
}
