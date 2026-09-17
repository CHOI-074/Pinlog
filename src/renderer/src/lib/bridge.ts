import {
  DEFAULT_LOOK,
  isAvatarLook,
  normalizeLook,
  type AvatarLook,
  type ClockView,
  type Pin,
  type ThemeMode,
  type Wallet,
  type WindowKind
} from '@shared/types'
import type { RewardAd } from './rewardAd'

/**
 * 렌더러가 보는 "플랫폼" 인터페이스.
 * - Electron 에서는 preload 가 window.pinlog 로 주입한 구현이 쓰인다.
 * - 브라우저/PWA(모바일)에서는 아래 webFallback 이 대신 쓰인다.
 * UI 컴포넌트는 이 인터페이스만 알면 되므로, Tauri 로 교체할 때도 여기만 바꾼다.
 */
export interface PinLogBridge {
  platform: string
  window: {
    kind(): Promise<WindowKind>
    setMode(to: WindowKind, view: ClockView): Promise<void>
    resizeMini(view: ClockView): Promise<void>
    toggleAlwaysOnTop(): Promise<boolean>
    isAlwaysOnTop(): Promise<boolean>
    close(): Promise<void>
    minimize(): Promise<void>
  }
  theme: {
    get(): Promise<{ mode: ThemeMode; dark: boolean }>
    set(mode: ThemeMode): Promise<{ mode: ThemeMode; dark: boolean }>
    onChanged(cb: (s: { mode: ThemeMode; dark: boolean }) => void): () => void
  }
  /** 캐릭터가 입고 있는 것. 레벨·경험치는 저장하지 않고 기록에서 계산한다. */
  avatar: {
    get(): Promise<AvatarLook>
    set(look: AvatarLook): Promise<AvatarLook>
  }
  /** 온보딩을 몇 번째 버전까지 봤는지 (0 = 안 봄) */
  onboarding: {
    get(): Promise<number>
    set(version: number): Promise<void>
  }
  /**
   * 광고 리워드 상점. **앱인토스 빌드에만 있다** — 광고를 띄울 수 있는 곳이 거기뿐이다.
   * 없으면(데스크탑·웹) 상점 아이템과 리워드 표시가 화면에서 빠진다.
   */
  rewards?: {
    wallet: {
      get(): Promise<Wallet>
      set(w: Wallet): Promise<void>
    }
    ad: RewardAd
  }
  composer: {
    /** 입력 전용 독립 창을 띄운다 (데스크탑 전용) */
    open(params: { timestamp: number; editingId?: string }): Promise<void>
  }
  pins: {
    list(): Promise<Pin[]>
    add(input: Partial<Pin>): Promise<Pin>
    update(id: string, patch: Partial<Pin>): Promise<Pin | null>
    remove(id: string): Promise<boolean>
    onChanged(cb: (pins: Pin[]) => void): () => void
  }
  export: {
    csv(csv: string, filename: string): Promise<string | null>
    clipboard(text: string): Promise<void>
  }
  onQuickPin(cb: () => void): () => void
}

declare global {
  interface Window {
    pinlog?: PinLogBridge
  }
}

/* ------------------------------------------------------------------ */
/* 웹 / PWA 폴백 — localStorage + storage 이벤트로 탭 간 동기화          */
/* ------------------------------------------------------------------ */

const KEY = 'pinlog:pins'
const THEME_KEY = 'pinlog:theme'
const AVATAR_KEY = 'pinlog:avatar'
const ONBOARDING_KEY = 'pinlog:onboarding'

const resolveDark = (mode: ThemeMode): boolean =>
  mode === "dark" ||
  (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

/** system 이면 속성을 지워 미디어 쿼리에 맡기고, 아니면 명시적으로 박는다 */
const applyWebTheme = (mode: ThemeMode): void => {
  const root = document.documentElement
  if (mode === "system") root.removeAttribute("data-theme")
  else root.setAttribute("data-theme", mode)
}

// 첫 페인트 전에 저장된 테마를 적용한다 (색이 번쩍이지 않도록)
if (!window.pinlog) {
  try {
    applyWebTheme((localStorage.getItem(THEME_KEY) as ThemeMode) ?? "system")
  } catch {
    /* 저장소 접근 불가 — 기본값으로 둔다 */
  }
}

const read = (): Pin[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Pin[]
  } catch {
    return []
  }
}

const write = (pins: Pin[]): void => {
  localStorage.setItem(KEY, JSON.stringify(pins))
}

const sorted = (pins: Pin[]): Pin[] => [...pins].sort((a, b) => b.timestamp - a.timestamp)

const noop = async (): Promise<void> => {}

const webFallback: PinLogBridge = {
  platform: 'web',
  window: {
    kind: async () => {
      const v = new URLSearchParams(location.search).get('window')
      return v === 'mini' || v === 'composer' ? v : 'main'
    },
    // 웹에는 창 개념이 없으므로 URL 쿼리만 바꾼다 (모바일 반응형 레이아웃 분기용)
    setMode: async (to) => {
      const url = new URL(location.href)
      url.searchParams.set('window', to)
      history.replaceState(null, '', url)
      location.reload()
    },
    resizeMini: noop,
    toggleAlwaysOnTop: async () => false,
    isAlwaysOnTop: async () => false,
    close: noop,
    minimize: noop
  },
  /*
   * 웹에는 nativeTheme 가 없다. 선택값을 localStorage 에 두고
   * <html data-theme> 로 직접 적용한다 (index.css 가 이 속성을 본다).
   */
  theme: {
    get: async () => {
      const mode = (localStorage.getItem(THEME_KEY) as ThemeMode) ?? "system"
      // 값만 돌려주고 끝내면 안 된다 — 다른 코드가 data-theme 을 미리 박아둔 경우
      // (앱인토스 빌드의 부팅 시 라이트 고정) 상태와 화면이 어긋난다.
      applyWebTheme(mode)
      return { mode, dark: resolveDark(mode) }
    },
    set: async (mode) => {
      localStorage.setItem(THEME_KEY, mode)
      applyWebTheme(mode)
      return { mode, dark: resolveDark(mode) }
    },
    onChanged: (cb) => {
      // OS 설정이 바뀌면 system 모드일 때만 따라간다
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (): void => {
        const mode = (localStorage.getItem(THEME_KEY) as ThemeMode) ?? "system"
        if (mode === "system") cb({ mode, dark: resolveDark(mode) })
      }
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  },

  avatar: {
    get: async () => {
      try {
        const raw: unknown = JSON.parse(localStorage.getItem(AVATAR_KEY) ?? 'null')
        return isAvatarLook(raw) ? normalizeLook(raw) : DEFAULT_LOOK
      } catch {
        return DEFAULT_LOOK
      }
    },
    set: async (look) => {
      localStorage.setItem(AVATAR_KEY, JSON.stringify(look))
      return look
    }
  },

  onboarding: {
    get: async () => {
      const v = Number(localStorage.getItem(ONBOARDING_KEY))
      return Number.isInteger(v) && v >= 0 ? v : 0
    },
    set: async (version) => {
      localStorage.setItem(ONBOARDING_KEY, String(version))
    }
  },

  // 웹에는 창이 없으므로 입력은 인라인 모달로 뜬다 (usePinStore 가 분기)
  composer: { open: noop },
  pins: {
    list: async () => sorted(read()),
    add: async (input) => {
      const pin: Pin = {
        id: crypto.randomUUID(),
        timestamp: input.timestamp ?? Date.now(),
        text: input.text?.trim() ?? '',
        detail: input.detail?.trim() || undefined,
        tags: input.tags ?? [],
        isFocusMode: input.isFocusMode ?? false
      }
      write([...read(), pin])
      return pin
    },
    update: async (id, patch) => {
      const pins = read()
      const i = pins.findIndex((p) => p.id === id)
      if (i === -1) return null
      pins[i] = { ...pins[i], ...patch, id }
      write(pins)
      return pins[i]
    },
    remove: async (id) => {
      const pins = read()
      const next = pins.filter((p) => p.id !== id)
      write(next)
      return next.length !== pins.length
    },
    onChanged: (cb) => {
      const handler = (e: StorageEvent): void => {
        if (e.key === KEY) cb(sorted(read()))
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
  },
  export: {
    csv: async (csv, filename) => {
      const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      return filename
    },
    clipboard: async (text) => {
      await navigator.clipboard.writeText(text)
    }
  },
  onQuickPin: () => () => {}
}

/*
 * 기본 구현은 로드 시점에 정해진다 (Electron preload 또는 웹 폴백).
 * 앱인토스 빌드는 부팅 직후 setBridge() 로 토스 어댑터를 끼워넣는다.
 * ES 모듈 live binding 이라 이미 import 해간 쪽에도 교체가 반영된다.
 */
export let bridge: PinLogBridge = window.pinlog ?? webFallback

/** 플랫폼 어댑터 교체 (앱인토스 전용 — 렌더 전에 호출해야 한다) */
export function setBridge(next: PinLogBridge): void {
  bridge = next
}

/** Electron 위에서 돌고 있는가 (드래그 영역, 창 버튼 노출 여부 판단용) */
export const isDesktop = !!window.pinlog
