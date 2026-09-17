/**
 * 보상형 광고 한 칸을 관리한다 — 미리 불러오기 · 보여주기 · 다음 것 불러오기.
 *
 * 토스 SDK 를 직접 import 하지 않는다. 필요한 함수 두 개(load/show)를 받아 쓴다.
 * 그래서 토스 밖(검사 스크립트)에서도 가짜 SDK 를 끼워 똑같이 돌려볼 수 있다.
 *
 * 앱인토스 문서가 요구하는 순서를 그대로 지킨다:
 *   load → (loaded 이벤트) → show → (dismissed) → 다음 load
 *   - 같은 광고 그룹은 한 번에 하나만 미리 불러올 수 있다
 *   - 보상은 userEarnedReward 에서만 준다. dismissed 만으로는 주지 않는다
 */

export interface FullScreenAdSdk {
  load(params: {
    options: { adGroupId: string }
    onEvent: (e: { type: string }) => void
    onError: (err: unknown) => void
  }): () => void
  show(params: {
    options: { adGroupId: string }
    onEvent: (e: { type: string; data?: { unitType?: string; unitAmount?: number } }) => void
    onError: (err: unknown) => void
  }): () => void
  isSupported(): boolean
}

/**
 * unsupported — 이 토스 버전에서는 광고를 못 띄운다
 * idle        — 아직 불러오지 않았다
 * loading     — 불러오는 중
 * ready       — 바로 보여줄 수 있다
 * showing     — 화면에 떠 있다
 * failed      — 불러오기 실패(광고 없음·네트워크). 다시 시도할 수 있다
 */
export type AdState = 'unsupported' | 'idle' | 'loading' | 'ready' | 'showing' | 'failed'

export type ShowOutcome =
  /** 끝까지 봤다 — 보상은 onReward 로 이미 전달됐다 */
  | 'rewarded'
  /** 중간에 닫았다 */
  | 'closed'
  /** 띄우지 못했다 */
  | 'failed'

export interface RewardAd {
  readonly state: AdState
  /** 테스트 광고 ID 로 돌고 있는가 (화면에 표시해 실수로 출시하지 않게) */
  readonly testMode: boolean
  subscribe(cb: (s: AdState) => void): () => void
  /** 미리 불러온다. 이미 불러왔거나 불러오는 중이면 아무것도 안 한다 */
  preload(): void
  /**
   * 보여준다. `onReward` 는 userEarnedReward 가 오는 **즉시** 불린다 —
   * 닫힘 이벤트를 기다렸다 주면, 닫힘이 안 오는 기기에서 보상이 사라진다.
   */
  show(onReward: (amount: unknown, unitType: string | undefined) => void): Promise<ShowOutcome>
}

/** 보상을 받은 뒤 닫힘 이벤트를 기다리는 최대 시간 */
export const SHOW_SETTLE_MS = 60_000

export function createRewardAd(sdk: FullScreenAdSdk, adGroupId: string, testMode: boolean): RewardAd {
  let supported = false
  try {
    supported = sdk.isSupported()
  } catch {
    supported = false
  }

  let state: AdState = supported ? 'idle' : 'unsupported'
  const listeners = new Set<(s: AdState) => void>()
  const setState = (s: AdState): void => {
    state = s
    listeners.forEach((cb) => cb(s))
  }

  let unloadLoad: (() => void) | null = null
  const options = { adGroupId }

  const preload = (): void => {
    if (state !== 'idle' && state !== 'failed') return
    setState('loading')
    try {
      unloadLoad?.()
      unloadLoad = sdk.load({
        options,
        onEvent: (e) => {
          if (e.type === 'loaded') setState('ready')
        },
        onError: (err) => {
          console.warn('[ad] 광고 불러오기 실패:', err)
          setState('failed')
        }
      })
    } catch (err) {
      console.warn('[ad] 광고 불러오기 호출 실패:', err)
      setState('failed')
    }
  }

  const show: RewardAd['show'] = (onReward) =>
    new Promise<ShowOutcome>((resolve) => {
      if (state !== 'ready') {
        resolve('failed')
        return
      }
      setState('showing')

      let rewarded = false
      let settled = false
      let unloadShow: (() => void) | null = null
      const finish = (outcome: ShowOutcome): void => {
        if (settled) return
        settled = true
        unloadShow?.()
        // 한 번 보여준 광고는 다시 못 쓴다 — 다음 것을 불러 둔다
        setState('idle')
        preload()
        resolve(outcome)
      }

      try {
        unloadShow = sdk.show({
          options,
          onEvent: (e) => {
            switch (e.type) {
              case 'userEarnedReward':
                if (rewarded) return // 같은 광고로 두 번 주지 않는다
                rewarded = true
                onReward(e.data?.unitAmount, e.data?.unitType)
                // 닫힘 이벤트가 끝내 안 오는 경우가 보고되어 있다(커뮤니티).
                // 보상은 이미 줬으니, 버튼이 '광고 보는 중'에 영영 묶이지 않게만 한다.
                setTimeout(() => finish('rewarded'), SHOW_SETTLE_MS)
                return
              case 'dismissed':
                finish(rewarded ? 'rewarded' : 'closed')
                return
              case 'failedToShow':
                finish(rewarded ? 'rewarded' : 'failed')
                return
            }
          },
          onError: (err) => {
            console.warn('[ad] 광고 보여주기 실패:', err)
            finish(rewarded ? 'rewarded' : 'failed')
          }
        })
      } catch (err) {
        console.warn('[ad] 광고 보여주기 호출 실패:', err)
        finish('failed')
      }
    })

  return {
    get state() {
      return state
    },
    testMode,
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    preload,
    show
  }
}
