/**
 * 가짜 앱인토스 SDK — 검사 전용 (scripts/check-rewards.js).
 *
 * 토스 앱 밖에서는 진짜 SDK 가 아무것도 못 하므로, 토스 번들을 이 파일로 바꿔 끼워
 * 저장소·광고 흐름을 끝까지 돌려 본다. 앱 코드는 한 줄도 바꾸지 않는다.
 *
 * 동작은 localStorage 'tossmock:cfg' 로 조절하고, 호출 기록은 window.__tossCalls 에 남긴다.
 */
interface MockCfg {
  env: 'toss' | 'sandbox'
  adSupported: boolean
  load: 'loaded' | 'error'
  show: string[]
  amount: number | undefined
  /** 이 키를 읽으면 Storage 가 예외를 던진다 */
  failKeys: string[]
}

const cfg = (): MockCfg => ({
  env: 'sandbox',
  adSupported: true,
  load: 'loaded',
  show: ['requested', 'show', 'impression', 'userEarnedReward', 'dismissed'],
  amount: 10,
  failKeys: [],
  ...JSON.parse(localStorage.getItem('tossmock:cfg') ?? '{}')
})

const w = window as unknown as { __tossCalls: [string, string][] }
w.__tossCalls ??= []

type Fn<P> = ((p: P) => () => void) & { isSupported: () => boolean }
interface AdParams {
  options: { adGroupId: string }
  onEvent: (e: { type: string; data?: { unitType: string; unitAmount?: number } }) => void
  onError: (err: Error) => void
}

export const Environment = {
  get environment() {
    return cfg().env
  }
}

export const Storage = {
  getItem: async (k: string): Promise<string | null> => {
    if (cfg().failKeys.includes(k)) throw new Error('mock storage failure: ' + k)
    return localStorage.getItem('toss:' + k)
  },
  setItem: async (k: string, v: string): Promise<void> => {
    localStorage.setItem('toss:' + k, v)
  }
}

export const Screen = { close: async (): Promise<void> => {} }

export const TossAds = {
  initialize: (): void => {},
  attachBanner: Object.assign(() => ({ destroy: (): void => {} }), { isSupported: () => false })
}

export const graniteEvent = { addEventListener: () => () => {} }

export const loadFullScreenAd: Fn<AdParams> = Object.assign(
  (p: AdParams) => {
    w.__tossCalls.push(['load', p.options.adGroupId])
    setTimeout(() => {
      if (cfg().load === 'loaded') p.onEvent({ type: 'loaded' })
      else p.onError(new Error('no fill'))
    }, 30)
    return () => {}
  },
  { isSupported: () => cfg().adSupported }
)

export const showFullScreenAd: Fn<AdParams> = Object.assign(
  (p: AdParams) => {
    w.__tossCalls.push(['show', p.options.adGroupId])
    cfg().show.forEach((type, i) => {
      setTimeout(() => {
        if (type === 'userEarnedReward')
          p.onEvent({ type, data: { unitType: '리워드', unitAmount: cfg().amount } })
        else p.onEvent({ type })
      }, 40 * (i + 1))
    })
    return () => {}
  },
  { isSupported: () => cfg().adSupported }
)
