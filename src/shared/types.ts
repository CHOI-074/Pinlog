/**
 * 메인 프로세스 / 프리로드 / 렌더러가 공유하는 타입.
 * 이 파일만 웹(PWA) 빌드와 데스크탑 빌드가 함께 참조한다.
 */

/** 기록 1건 = "핀" */
export interface Pin {
  id: string
  /** epoch millis. 아날로그 다이얼 각도 계산의 기준 */
  timestamp: number
  text: string
  tags: string[]
  /** '선택과 집중' 토글 — 몰입 구간 강조 */
  /**
   * 상세 메모. 한 줄 요약(text)으로 부족할 때 길게 적는 칸.
   * 예전 기록에는 없으므로 optional 이다 — 읽을 때 항상 없을 수 있다고 보고 다뤄야 한다.
   */
  detail?: string
  isFocusMode: boolean
}

/**
 * 창 종류. 하나의 렌더러 번들을 쿼리스트링으로 분기한다 (?window=mini)
 * - main:     타임라인/통계/내보내기
 * - mini:     화면 구석의 플로팅 위젯
 * - composer: 입력 전용 독립 창 (위젯 크기에 묶이지 않기 위해 분리)
 */
export type WindowKind = 'main' | 'mini' | 'composer'

/** 듀얼 테마 뷰 */
export type ClockView = 'analog' | 'digital'

/** 프리셋 퀵 버튼 */
export interface Preset {
  label: string
  tag: string
  /** Icon.tsx 의 IconName 중 하나 (이모지 대신 라인 아이콘을 쓴다) */
  icon: 'briefcase' | 'users' | 'coffee' | 'book'
}

export const DEFAULT_PRESETS: Preset[] = [
  { label: '업무', tag: 'work', icon: 'briefcase' },
  { label: '회의', tag: 'meeting', icon: 'users' },
  { label: '휴식', tag: 'break', icon: 'coffee' },
  { label: '개인공부', tag: 'study', icon: 'book' }
]

/** 미니 창은 뷰에 따라 크기가 달라진다 (아날로그=원형, 디지털=가로 바) */
export const MINI_SIZE: Record<ClockView, { width: number; height: number }> = {
  analog: { width: 220, height: 220 },
  digital: { width: 280, height: 132 }
}

/**
 * 입력 창 크기.
 *
 * 입력 UI 를 미니 창 '안'에 모달로 그리면 220px 위젯 안에서 잘린다.
 * 창을 잠깐 키우는 방법은 투명 창 리사이즈에 의존하는데,
 * Electron 문서가 이를 보장하지 않는다("Transparent windows are not resizable").
 * 그래서 입력은 처음부터 이 크기로 뜨는 독립 창으로 분리했다.
 */
export const COMPOSER_SIZE = { width: 380, height: 620 }

/**
 * 캐릭터 꾸미기 상태 — 지금 입고 있는 것들.
 *
 * 여기에는 '입고 있는 것'만 담는다. 레벨·경험치는 저장하지 않는다 —
 * 기록(pins)에서 매번 계산한다. 저장해두면 기록을 지웠을 때 둘이 어긋나고,
 * 저장 파일을 고쳐 레벨을 올리는 것도 가능해진다.
 */
export const LOOK_SLOTS = [
  // 사람 · 고양이 · 강아지. 뒤에 붙인 칸이라 예전 저장값에는 없고, 기본값(사람)으로 채워진다
  'species',
  'skin',
  'hair',
  'haircolor',
  'glasses',
  'clothes',
  'concept',
  'hat',
  'prop',
  'scene'
] as const

export type LookSlot = (typeof LOOK_SLOTS)[number]

/** 각 칸에 무엇을 골랐는지 (아이템 id) */
export type AvatarLook = Record<LookSlot, string>

export const DEFAULT_LOOK: AvatarLook = {
  species: 'human',
  skin: 'apricot',
  hair: 'short',
  haircolor: 'brown',
  glasses: 'none',
  clothes: 'blue',
  concept: 'none',
  hat: 'none',
  prop: 'none',
  scene: 'none'
}

/**
 * 모양만 느슨하게 검사한다.
 *
 * 두 가지를 일부러 안 본다:
 *  1. "그 id 가 실제로 있는 아이템인가" — 아이템 목록(스프라이트 포함)은
 *     렌더러에만 있다. 그 검증은 lib/avatar.ts 의 sanitizeLook() 이 맡는다.
 *  2. "모든 칸이 다 있는가" — 칸이 늘거나 이름이 바뀌었을 때 예전에 저장된
 *     값을 통째로 버리지 않기 위해서다. 실제로 색 칸을 피부/상의로 쪼갠 적이
 *     있는데, 그때 엄격하게 검사했다면 쓰고 있던 모자까지 같이 날아갔다.
 *     빠진 칸은 기본값으로 채우면 된다.
 */
/**
 * 아는 칸만 남기고, 빠진 칸은 기본값으로 채운다.
 *
 * 읽을 때도 쓸 때도 이걸 거친다. 칸 구성이 바뀌어도 예전에 저장된 모자·소품이
 * 살아남고, 밖에서 들어온 정체불명의 필드는 저장소에 남지 않는다.
 * (아이템 id 가 실제로 존재하는지는 렌더러의 sanitizeLook 이 본다)
 */
export function normalizeLook(raw: Partial<AvatarLook>): AvatarLook {
  const out = { ...DEFAULT_LOOK }
  for (const slot of LOOK_SLOTS) {
    const v = raw[slot]
    if (typeof v === 'string') out[slot] = v
  }
  return out
}

export const isAvatarLook = (v: unknown): v is Partial<AvatarLook> =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.values(v as Record<string, unknown>).every((x) => typeof x === 'string')

/**
 * 리워드 지갑 — 광고를 보고 받은 리워드와, 그걸로 산 아이템.
 *
 * 레벨과 달리 이건 저장해야 한다. 기록에서 다시 계산할 방법이 없다.
 * 앱인토스 빌드에서만 쓴다(광고가 거기에만 있다). 기기 안에만 저장되므로
 * 앱 데이터를 지우면 함께 사라진다 — 서버 검증이 없는 꾸미기 전용 재화라서 받아들인 한계다.
 */
export interface Wallet {
  /** 지금 가진 리워드 */
  balance: number
  /** 산 아이템 — "슬롯:아이디" (예: "hat:star") */
  owned: string[]
  /** 오늘 본 광고 수를 세는 날짜 (기기 기준 YYYY-MM-DD) */
  day: string
  adsToday: number
  /** 지금까지 받은 리워드 합계 (통계·문의 대응용) */
  earned: number
}

export const EMPTY_WALLET: Wallet = { balance: 0, owned: [], day: '', adsToday: 0, earned: 0 }

const nonNegInt = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0

/** 저장소에서 읽은 값을 믿지 않는다 — 깨진 값은 0/빈 값으로 */
export function normalizeWallet(raw: unknown): Wallet {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY_WALLET }
  const r = raw as Record<string, unknown>
  return {
    balance: nonNegInt(r.balance),
    owned: Array.isArray(r.owned)
      ? [...new Set(r.owned.filter((x): x is string => typeof x === 'string'))]
      : [],
    day: typeof r.day === 'string' ? r.day : '',
    adsToday: nonNegInt(r.adsToday),
    earned: nonNegInt(r.earned)
  }
}

export const IPC = {
  windowKind: 'window:kind',
  windowSetMode: 'window:set-mode',
  windowResizeMini: 'window:resize-mini',
  windowToggleTop: 'window:toggle-always-on-top',
  windowIsTop: 'window:is-always-on-top',
  windowClose: 'window:close',
  windowMinimize: 'window:minimize',
  composerOpen: 'composer:open',
  pinsList: 'pins:list',
  pinsAdd: 'pins:add',
  pinsUpdate: 'pins:update',
  pinsRemove: 'pins:remove',
  pinsChanged: 'pins:changed',
  exportCsv: 'export:csv',
  clipboardWrite: 'clipboard:write',
  themeGet: 'theme:get',
  themeSet: 'theme:set',
  themeChanged: 'theme:changed',
  avatarGet: 'avatar:get',
  avatarSet: 'avatar:set',
  onboardingGet: 'onboarding:get',
  onboardingSet: 'onboarding:set'
} as const

/**
 * 온보딩 버전.
 *
 * "봤다/안 봤다"가 아니라 '몇 번째 온보딩까지 봤는지'를 저장한다.
 * 나중에 큰 기능이 들어와 소개를 새로 만들면 이 숫자만 올리면 되고,
 * 이미 본 사람에게도 새 버전이 한 번 뜬다. true/false 로 저장했다면
 * 그때 저장 형식부터 바꿔야 한다.
 */
export const ONBOARDING_VERSION = 1

/** 테마. 'system' 은 OS 설정을 따라간다. */
export type ThemeMode = 'system' | 'light' | 'dark'

export const THEME_MODES: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
  { key: 'system', label: '시스템' }
]

/** 각 테마에서 창이 깔고 있어야 할 불투명 배경색 (index.css 의 --c-950 과 맞출 것) */
export const WINDOW_BG: Record<'light' | 'dark', string> = {
  light: '#f4f6f9',
  dark: '#070a0f'
}
