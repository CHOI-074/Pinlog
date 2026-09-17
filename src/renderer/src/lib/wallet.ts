import type { Wallet } from '@shared/types'

/**
 * 리워드 지갑 계산 — 전부 순수 함수다. 저장·광고 호출은 여기서 하지 않는다.
 *
 * 앱인토스 콘솔에서 보상형 광고 그룹을 만들 때 적은 **보상 이름·수량이
 * 사용자에게 그대로 보인다.** 앱 안의 이름과 수량이 그것과 달라서는 안 된다
 * (광고 정책: 실제로 받는 보상과 같게). 이름은 REWARD_NAME, 수량은 광고 SDK 가
 * 넘겨주는 값(콘솔 설정)을 쓴다.
 */

/** 앱 안에서 부르는 이름 — 콘솔의 '서비스 내 보상 단위'와 같게 둔다 */
export const REWARD_NAME = '리워드'

/**
 * 광고 한 번에 주는 양의 기본값.
 * SDK 가 수량을 비워 보내는 경우가 보고되어 있어(커뮤니티) 그때만 쓴다.
 * 콘솔의 '수량'도 이 값으로 맞춰 두는 것을 권장한다 — 가격표가 이 단위로 짜여 있다.
 */
export const DEFAULT_REWARD = 10

/** 하루에 받을 수 있는 광고 수. 넘기면 버튼이 내일로 미뤄진다. */
export const DAILY_AD_LIMIT = 10

/** 기기 기준 날짜 (자정에 넘어간다) */
export function dayKey(now: number): string {
  const d = new Date(now)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 날짜가 바뀌었으면 오늘 본 광고 수를 0 으로 */
export function rollDay(w: Wallet, now: number): Wallet {
  const today = dayKey(now)
  return w.day === today ? w : { ...w, day: today, adsToday: 0 }
}

export const adsLeftToday = (w: Wallet, now: number): number =>
  Math.max(0, DAILY_AD_LIMIT - rollDay(w, now).adsToday)

/**
 * SDK 가 준 수량을 믿을 수 있는 값으로.
 * 비었거나(0·NaN) 터무니없이 크면 기본값 — 설정 실수 한 번에 상점이 무의미해지지 않게.
 */
export function rewardAmount(unitAmount: unknown): number {
  const n = typeof unitAmount === 'number' ? unitAmount : Number(unitAmount)
  return Number.isInteger(n) && n > 0 && n <= 1000 ? n : DEFAULT_REWARD
}

/** 광고 한 편을 끝까지 봤다 */
export function earn(w: Wallet, amount: number, now: number): Wallet {
  const rolled = rollDay(w, now)
  return {
    ...rolled,
    balance: rolled.balance + amount,
    earned: rolled.earned + amount,
    adsToday: rolled.adsToday + 1
  }
}

export const ownedKey = (slot: string, id: string): string => `${slot}:${id}`

export const owns = (w: Wallet, slot: string, id: string): boolean =>
  w.owned.includes(ownedKey(slot, id))

export type BuyResult =
  | { ok: true; wallet: Wallet }
  | { ok: false; reason: 'owned' | 'short'; short?: number }

/** 산다. 이미 있으면 다시 깎지 않는다 (두 번 눌러도 한 번만). */
export function buy(w: Wallet, slot: string, id: string, price: number): BuyResult {
  if (owns(w, slot, id)) return { ok: false, reason: 'owned' }
  if (w.balance < price) return { ok: false, reason: 'short', short: price - w.balance }
  return {
    ok: true,
    wallet: { ...w, balance: w.balance - price, owned: [...w.owned, ownedKey(slot, id)] }
  }
}
