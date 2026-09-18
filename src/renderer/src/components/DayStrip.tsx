import type { Pin } from '@shared/types'
import { pinColor } from '@/lib/category'
import { hhmm, useNow } from '@/lib/time'

interface Props {
  /** 오늘 찍힌 핀만 넘긴다 */
  pins: Pin[]
  onMarkerClick?: (pin: Pin) => void
}

/** 하루를 0~24시 가로 띠로 펼친다. 분 단위까지 비율로 환산. */
const ratioOf = (ts: number): number => {
  const d = new Date(ts)
  return (d.getHours() * 60 + d.getMinutes()) / (24 * 60)
}

const HOUR_LABELS = [0, 6, 12, 18, 24]

/**
 * 하루 띠 — 오늘 기록이 하루 어디에 찍혔는지 가로로 보여준다.
 *
 * 아날로그 뷰에는 시계 다이얼이 같은 일을 하지만 12시간이 겹쳐 보인다.
 * 이 띠는 0~24시를 한 줄로 펴서 '오전에 몰렸는지, 저녁이 비었는지'가
 * 바로 읽힌다. 기록이 없을 때도 현재 시각 표시가 있어 화면이 죽지 않는다.
 */
export function DayStrip({ pins, onMarkerClick }: Props): React.JSX.Element {
  const now = useNow(30_000)
  const focusCount = pins.filter((p) => p.isFocusMode).length
  const nowRatio = ratioOf(now.getTime())

  return (
    <div className="glass glass-sheen relative overflow-hidden rounded-xl px-3 pt-2.5 pb-2">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] text-ink-400">하루 띠</span>
        <span className="text-[11px] tabular-nums text-ink-500">
          {pins.length === 0 ? (
            '아직 비어 있어요'
          ) : (
            <>
              {pins.length}개
              {focusCount > 0 && <span className="text-focus"> · 집중 {focusCount}</span>}
            </>
          )}
        </span>
      </div>

      <div className="relative h-9">
        {/* 트랙 */}
        <div className="absolute inset-x-0 top-3 h-3 rounded-full bg-ink-700/60" />

        {/* 아직 지나지 않은 시간은 더 흐리게 — '남은 하루'가 보인다 */}
        <div
          className="absolute top-3 left-0 h-3 rounded-full bg-ink-500/45"
          style={{ width: `${nowRatio * 100}%` }}
        />

        {/* 기록 마커 */}
        {pins.map((pin) => {
          const left = `${ratioOf(pin.timestamp) * 100}%`
          const focus = pin.isFocusMode
          return (
            <button
              key={pin.id}
              type="button"
              onClick={onMarkerClick ? () => onMarkerClick(pin) : undefined}
              title={`${hhmm(pin.timestamp)} · ${pin.text}`}
              aria-label={`${hhmm(pin.timestamp)} ${pin.text}`}
              // 터치 타깃을 넉넉히 잡되, 보이는 막대는 가늘게
              className="absolute top-0 h-9 w-5 -translate-x-1/2 focus:outline-none"
              style={{ left }}
            >
              {/*
                색은 활동, 길이는 집중 여부.
                둘 다 색으로 표현하면 서로를 지운다 — 한쪽은 형태로 가야 한다.
              */}
              <span
                className={`absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full ${
                  focus ? 'h-6 w-[3.5px]' : 'h-5 w-[2.5px]'
                }`}
                style={{ background: pinColor(pin) }}
              />
            </button>
          )
        })}

        {/* 지금 */}
        <span
          className="absolute top-1 h-7 w-px -translate-x-1/2 bg-ink-100/50"
          style={{ left: `${nowRatio * 100}%` }}
        />
      </div>

      {/* 시각 눈금 */}
      <div className="relative mt-0.5 h-3">
        {HOUR_LABELS.map((h) => (
          <span
            key={h}
            className={`absolute ${h === 0 || h === 24 ? '' : '-translate-x-1/2'} text-[10px] tabular-nums text-ink-500`}
            // 0시와 24시는 양 끝에 붙어 잘리므로 안쪽으로 당긴다
            style={{
              left: `${(h / 24) * 100}%`,
              transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : undefined
            }}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}
