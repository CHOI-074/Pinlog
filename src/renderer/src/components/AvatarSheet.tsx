import { useEffect, useRef, useState } from 'react'
import type { AvatarLook } from '@shared/types'
import {
  HUMAN_ONLY_SLOTS,
  SLOTS,
  XP,
  isShopItem,
  isUnlocked,
  itemOf,
  levelTitle,
  visibleItems,
  withPart,
  type AvatarItem,
  type Progress,
  type SlotId
} from '@/lib/avatar'
import { bridge } from '@/lib/bridge'
import { DAILY_AD_LIMIT, DEFAULT_REWARD, REWARD_NAME, adsLeftToday } from '@/lib/wallet'
import { usePinStore } from '@/store/usePinStore'
import { Icon } from './Icon'
import { PixelAvatar } from './PixelAvatar'

interface Props {
  initialTab?: 'skin' | 'shop'
  look: AvatarLook
  progress: Progress
  onChange: (slot: SlotId, id: string) => void
  onClose: () => void
}

/** '별빛 망토를' / '달 일기장을' — 받침에 따라 을/를 */
const withObjectParticle = (word: string): string => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const batchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return `${word}${batchim ? '을' : '를'}`
}

/** 상점만 모아 보는 탭 — 슬롯이 아니라서 따로 둔다 */
type Tab = SlotId | 'shop'

/** 리워드 표시 — 작은 금화 */
function Coin({ size = 12 }: { size?: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
      <rect x="2" y="0" width="4" height="8" fill="#c99a2e" />
      <rect x="0" y="2" width="8" height="4" fill="#c99a2e" />
      <rect x="1" y="1" width="6" height="6" fill="#c99a2e" />
      <rect x="2" y="1" width="4" height="6" fill="#f2c65a" />
      <rect x="1" y="2" width="6" height="4" fill="#f2c65a" />
      <rect x="3" y="2" width="1" height="4" fill="#fff3c4" />
    </svg>
  )
}

/**
 * 꾸미기 시트.
 *
 * 고르면 바로 입는다 — [적용] 버튼을 두지 않았다. 되돌리는 비용이 한 번 더
 * 누르는 것뿐이라, 확인 단계는 재미만 깎는다.
 *
 * 단, **상점 아이템은 예외다.** 리워드가 빠져나가는 일이라 한 번 확인을 받는다.
 * 대신 누르는 순간 미리보기에는 입혀 보여준다 — 사기 전에 어울리는지 봐야 한다.
 *
 * 칸마다 아이템 그림이 아니라 **그걸 입은 캐릭터**를 그린다. 왕관 그림 하나만
 * 보여주면 내 캐릭터에 얹혔을 때 어떤지 알 수 없다.
 */
export function AvatarSheet({ initialTab = 'skin', look, progress, onChange, onClose }: Props): React.JSX.Element {
  const wallet = usePinStore((s) => s.wallet)
  const adState = usePinStore((s) => s.adState)
  const shop = wallet !== null
  const dialog = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id) }, [])

  // 피부부터 연다 — 처음 여는 사람이 가장 먼저 정하고 싶은 것이 '나'다
  const [tab, setTab] = useState<Tab>(initialTab)
  /** 사려고 누른 상점 아이템 (확인 대기) */
  const [pending, setPending] = useState<{ slot: SlotId; item: AvatarItem } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex="0"]') ?? [])
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        e.preventDefault(); last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus() }
  }, [onClose])

  // 상점이나 구매 미리보기에서만 광고를 준비한다. 기본 꾸미기에는 광고가 없다.
  useEffect(() => {
    if (shop && (tab === 'shop' || pending)) usePinStore.getState().prepareAd()
  }, [shop, tab, pending])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(t)
  }, [notice])

  // 상점이 없는 곳에서는 '캐릭터' 탭에 사람 하나뿐이라 뺀다
  const slots = SLOTS.filter((s) => shop || s.id !== 'species')
  const animal = !!itemOf('species', look.species)?.animal

  const owned = wallet?.owned ?? []
  const openOf = (slotId: SlotId, item: AvatarItem): boolean =>
    isUnlocked(slotId, item, progress.level, look[slotId], owned)

  /** 사기 전 미리보기 — 확인 중인 아이템을 입혀 본다 */
  const shown = pending ? withPart(look, pending.slot, pending.item.id) : look

  const pick = (slotId: SlotId, item: AvatarItem): void => {
    if (openOf(slotId, item)) {
      setPending(null)
      onChange(slotId, item.id)
    } else if (isShopItem(item)) {
      setPending({ slot: slotId, item })
    }
  }

  const confirmBuy = (): void => {
    if (!pending) return
    const r = usePinStore.getState().buyItem(pending.slot, pending.item.id)
    if (r.ok) {
      setNotice(`${withObjectParticle(pending.item.label)} 샀어요`)
      setPending(null)
    }
  }

  const watch = async (): Promise<void> => {
    const outcome = await usePinStore.getState().watchAd()
    if (outcome === 'rewarded') setNotice(`${REWARD_NAME}를 받았어요`)
    else if (outcome === 'closed') setNotice(`끝까지 봐야 ${REWARD_NAME}를 받을 수 있어요`)
    else if (outcome === 'failed') setNotice('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요')
  }

  /*
   * 칸 하나만 바꿔 입힌 미리보기.
   *
   * 머리색 칸은 예외다 — 머리를 '없음'으로 두면 색을 아무리 바꿔도 화면이 똑같아서
   * 같은 그림 일곱 개가 늘어선다. 그럴 때만 미리보기에 기본 머리를 씌워 색이
   * 보이게 하고, 아래에 왜 그런지 한 줄 덧붙인다.
   */
  const baldHairColor = tab === 'haircolor' && look.hair === 'none'
  const previewOf = (slotId: SlotId, id: string): AvatarLook => {
    const next = withPart(look, slotId, id)
    return slotId === 'haircolor' && look.hair === 'none' ? { ...next, hair: 'short' } : next
  }

  /** 지금 탭에 늘어놓을 [슬롯, 아이템] */
  const entries: [SlotId, AvatarItem][] =
    tab === 'shop'
      ? SLOTS.flatMap((s) => s.items.filter(isShopItem).map((i): [SlotId, AvatarItem] => [s.id, i]))
      : visibleItems(SLOTS.find((s) => s.id === tab) as (typeof SLOTS)[number], shop).map(
          (i): [SlotId, AvatarItem] => [tab, i]
        )

  const humanOnlyBlocked = animal && tab !== 'shop' && HUMAN_ONLY_SLOTS.includes(tab)
  const leftToday = wallet ? adsLeftToday(wallet, now) : 0

  return (
    <div
      // fixed: 모바일에서는 body 가 스크롤되므로 absolute 면 뷰포트를 못 덮는다
      className="no-drag fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 backdrop-blur-sm sm:items-center sm:p-2"
      onClick={onClose}
    >
      <div
        // relative: 닫기 버튼을 흐름에서 빼내 모서리에 고정한다.
        // 예전에는 버튼이 가로 공간을 먹어서, 좁은 화면에서 칭호와 XP 안내가
        // 세 줄로 접히고 레벨 칭호는 아예 잘려 사라졌다.
        ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="캐릭터 꾸미기"
        className="safe-bottom max-h-[90dvh] overflow-y-auto relative w-full max-w-md rounded-t-2xl bg-ink-850 p-3.5 shadow-[var(--shadow-float)] ring-1 ring-line sm:my-auto sm:rounded-2xl"
        style={{ ['--safe-pad-bottom' as string]: '0.875rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-2.5 right-2.5 rounded-lg p-1.5 text-ink-300 hover:bg-raise hover:text-ink-100"
        >
          <Icon name="close" size={17} />
        </button>

        {/* 미리보기 */}
        <div className="mb-3 flex items-center gap-3 pr-9">
          <div className="flex h-[132px] w-[112px] shrink-0 items-center justify-center rounded-2xl bg-ink-800 ring-1 ring-line">
            <PixelAvatar look={shown} size={120} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[15px] font-semibold text-ink-100">Lv.{progress.level}</span>
              <span className="text-xs text-ink-400">{levelTitle(progress.level)}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.round(progress.ratio * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug tabular-nums text-ink-500">
              {progress.maxed
                ? '최고 레벨이에요'
                : `다음 레벨까지 ${progress.need - progress.intoLevel} XP`}
            </p>
            {wallet && (
              <p
                className="mt-2 flex items-center gap-1 text-[13px] font-semibold tabular-nums text-ink-100"
                data-wallet={wallet.balance}
              >
                <Coin size={13} />
                {REWARD_NAME} {wallet.balance}
              </p>
            )}
          </div>
        </div>

        {/* 광고 보고 리워드 받기 */}
        {wallet && (tab === 'shop' || pending) && (
          <AdButton
            state={adState}
            leftToday={leftToday}
            testMode={bridge.rewards?.ad.testMode ?? false}
            onWatch={() => void watch()}
            onRetry={() => usePinStore.getState().prepareAd()}
          />
        )}

        {/* 슬롯 탭. 한 줄에 넣으면 '머리색' 같은 글자가 깨지므로 두 줄 격자로 둔다 */}
        <div className={`grid gap-1 rounded-xl bg-ink-800 p-1 ${shop ? 'grid-cols-6' : 'grid-cols-5'}`}>
          {slots.map((s) => (
            <TabButton key={s.id} id={s.id} label={s.label} active={tab === s.id} onClick={() => setTab(s.id)} />
          ))}
          {shop && <TabButton id="shop" label="상점" active={tab === 'shop'} onClick={() => setTab('shop')} />}
        </div>

        {humanOnlyBlocked ? (
          <div className="mt-3 rounded-xl bg-ink-800 px-3 py-5 text-center ring-1 ring-line">
            <p className="text-[12px] leading-relaxed break-keep text-ink-300">
              동물 캐릭터는 털색이 정해져 있어요.
              <br />
              캐릭터를 &apos;사람&apos;으로 바꾸면 고를 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => onChange('species', 'human')}
              className="mt-3 rounded-lg bg-ink-700 px-3 py-1.5 text-[12px] text-ink-100 ring-1 ring-line hover:bg-ink-600"
            >
              사람으로 바꾸기
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {entries.map(([slotId, item]) => {
              const equipped = look[slotId] === item.id
              const open = openOf(slotId, item)
              const forSale = !open && isShopItem(item)
              const selected = pending?.slot === slotId && pending.item.id === item.id

              return (
                <button
                  key={`${slotId}:${item.id}`}
                  type="button"
                  // 레벨로 잠긴 건 누를 수 없지만, 파는 물건은 눌러서 살 수 있다
                  disabled={!open && !forSale}
                  onClick={() => pick(slotId, item)}
                  aria-pressed={equipped || selected}
                  aria-label={forSale ? `${item.label}, ${REWARD_NAME} ${item.price}` : item.label}
                  // 검사 스크립트가 잡는 손잡이 (scripts/check-avatar.js, check-rewards.js)
                  data-item={item.id}
                  data-slot={slotId}
                  data-locked={!open}
                  data-price={item.price}
                  className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-xl py-2 ring-1 transition ${
                    equipped || selected
                      ? 'bg-accent-dim ring-accent'
                      : open || forSale
                        ? 'bg-ink-800 ring-line hover:bg-ink-700'
                        : 'bg-ink-800/60 ring-line'
                  }`}
                >
                  {/* 아이템 하나만 바꿔 입힌 모습 */}
                  <PixelAvatar
                    look={previewOf(slotId, item.id)}
                    size={80}
                    className={open || forSale ? '' : 'opacity-25 grayscale'}
                  />
                  <span
                    // 라벨이 두 줄로 접히면 그 칸만 키가 커져 격자가 어긋난다
                    className={`flex items-center gap-0.5 truncate px-1 text-[10px] leading-tight whitespace-nowrap ${
                      equipped ? 'text-accent' : open ? 'text-ink-300' : forSale ? 'text-ink-100' : 'text-ink-500'
                    }`}
                  >
                    {open ? (
                      item.label
                    ) : forSale ? (
                      <>
                        <Coin size={10} />
                        <span className="tabular-nums">{item.price}</span>
                      </>
                    ) : (
                      `Lv.${item.level}`
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* 사기 확인 */}
        {pending && wallet && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-800 p-2.5 ring-1 ring-accent" data-confirm>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink-100">{pending.item.label}</p>
              <p className="flex items-center gap-1 text-[11px] tabular-nums text-ink-400">
                <Coin size={10} />
                {pending.item.price}
                {wallet.balance < (pending.item.price ?? 0) && (
                  <span className="text-ink-300">
                    · {(pending.item.price ?? 0) - wallet.balance} 더 필요해요 (기본 보상 기준 광고 {Math.ceil(((pending.item.price ?? 0) - wallet.balance) / DEFAULT_REWARD)}회)
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-lg px-2.5 py-2 text-[12px] text-ink-300 hover:bg-ink-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmBuy}
              disabled={wallet.balance < (pending.item.price ?? 0)}
              data-buy
              className="rounded-lg bg-accent px-3 py-2 text-[12px] font-semibold text-ink-950 disabled:opacity-40"
            >
              사기
            </button>
          </div>
        )}

        {baldHairColor && !humanOnlyBlocked && (
          <p className="mt-2 text-center text-[11px] text-ink-400">
            지금은 머리가 &apos;없음&apos;이라 색이 보이지 않아요. 머리 모양을 먼저 골라 보세요.
          </p>
        )}

        {notice && (
          <p role="status" className="mt-2 text-center text-[12px] text-ink-100" data-notice>
            {notice}
          </p>
        )}

        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-500">
          기록 1건 +{XP.base} XP · 집중 +{XP.focus} · 자세히 +{XP.detail}
          {shop && (
            <>
              <br />
              광고 1회 {REWARD_NAME} +{DEFAULT_REWARD} · 하루 {DAILY_AD_LIMIT}회까지
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function TabButton({
  id,
  label,
  active,
  onClick
}: {
  id: string
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-tab={id}
      className={`rounded-lg py-2 text-[11px] whitespace-nowrap transition ${
        active ? 'bg-accent font-medium text-ink-950' : 'text-ink-300 hover:text-ink-100'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * 광고 버튼.
 *
 * 광고 정책상 버튼이 '광고'라는 사실과 받는 보상을 분명히 말해야 한다.
 * 광고가 준비되지 않았으면 누를 수 없게 두고, 왜 안 되는지 그대로 적는다.
 */
function AdButton({
  state,
  leftToday,
  testMode,
  onWatch,
  onRetry
}: {
  state: ReturnType<typeof usePinStore.getState>['adState']
  leftToday: number
  testMode: boolean
  onWatch: () => void
  onRetry: () => void
}): React.JSX.Element {
  const done = leftToday === 0
  const label = done
    ? '오늘은 광고 리워드를 다 받았어요'
    : state === 'ready'
      ? `광고 보고 ${REWARD_NAME} ${DEFAULT_REWARD} 받기`
      : state === 'showing'
        ? '광고 보는 중…'
        : state === 'failed'
          ? '광고를 불러오지 못했어요 · 다시 시도'
          : state === 'unsupported'
            ? '이 환경에서는 광고를 이용할 수 없어요'
            : '광고 준비 중…'
  const clickable = !done && (state === 'ready' || state === 'failed')

  return (
    <div className="mb-3 rounded-xl border border-line p-3">
      <p className="mb-2 text-xs text-ink-300">선택형 광고 · 꾸미기 전용 보상</p>
      <button
        type="button"
        disabled={!clickable}
        onClick={state === 'failed' ? onRetry : onWatch}
        data-ad={state}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink-800 px-3 py-2.5 text-[13px] font-medium text-ink-100 ring-1 ring-line transition enabled:hover:bg-ink-700 enabled:active:scale-[0.99] disabled:text-ink-400"
      >
        {!done && state === 'ready' && <Coin size={13} />}
        {label}
      </button>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] tabular-nums text-ink-500">
        오늘 {DAILY_AD_LIMIT - leftToday}/{DAILY_AD_LIMIT}회
        {testMode && (
          <span className="rounded bg-ink-700 px-1 py-px text-[9px] font-medium text-ink-300" data-test-ads>
            테스트 광고
          </span>
        )}
      </p>
    </div>
  )
}
