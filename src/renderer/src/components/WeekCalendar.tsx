import { useMemo } from 'react'
import type { Pin } from '@shared/types'
import { pinColor } from '@/lib/category'

interface Props {
  pins: Pin[]
  /** 선택된 날짜(그날 0시 타임스탬프). null 이면 전체 보기 */
  selected: number | null
  onSelect: (dayStart: number | null) => void
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

const startOfDay = (ts: number): number => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 주간 캘린더 + 통계.
 *
 * 오늘을 포함한 최근 7일을 막대로 보여준다. 막대 높이 = 그날 기록 수,
 * 아래쪽 진한 부분 = 집중 기록. 날짜를 누르면 타임라인이 그날만 보여주고,
 * 다시 누르면 전체로 돌아온다.
 *
 * '이번 주'를 월~일로 고정하지 않고 최근 7일로 잡은 이유:
 *   주 초반에는 칸이 텅 비어 통계가 의미가 없다. 최근 7일은 언제 봐도 꽉 찬다.
 */
export function WeekCalendar({ pins, selected, onSelect }: Props): React.JSX.Element {
  const days = useMemo(() => {
    const today = startOfDay(Date.now())
    return Array.from({ length: 7 }, (_, i) => {
      const start = today - (6 - i) * DAY_MS
      const dayPins = pins.filter((p) => p.timestamp >= start && p.timestamp < start + DAY_MS)

      /*
       * 막대를 활동 색으로 쌓는다.
       *
       * 예전에는 한 가지 색 막대에 집중 기록만 아래쪽에 앰버로 갈라 놓았는데,
       * 그러면 '몇 개 썼나'만 보이고 '뭘 하며 보냈나'는 안 보였다.
       * 집중 개수는 카드 오른쪽 위에 이미 숫자로 있으니, 막대는 구성을 맡는 게 낫다.
       *
       * 많은 활동이 아래로 가도록 정렬한다 — 매일 색 순서가 뒤바뀌면
       * 주간 비교가 불가능해진다.
       */
      const byColor = new Map<string, number>()
      for (const p of dayPins) {
        const c = pinColor(p)
        byColor.set(c, (byColor.get(c) ?? 0) + 1)
      }
      const segments = [...byColor.entries()]
        .map(([color, n]) => ({ color, n }))
        .sort((a, b) => b.n - a.n || a.color.localeCompare(b.color))

      return {
        start,
        date: new Date(start),
        total: dayPins.length,
        focus: dayPins.filter((p) => p.isFocusMode).length,
        segments
      }
    })
  }, [pins])

  const week = useMemo(() => {
    const total = days.reduce((n, d) => n + d.total, 0)
    const focus = days.reduce((n, d) => n + d.focus, 0)
    // 기록이 하나라도 있은 날만 평균에 넣는다 — 안 쓴 날까지 세면 평균이 무의미해진다
    const activeDays = days.filter((d) => d.total > 0).length
    return {
      total,
      focus,
      activeDays,
      perDay: activeDays > 0 ? (total / activeDays).toFixed(1) : '0'
    }
  }, [days])

  // 가장 많은 날을 기준으로 막대 높이를 잡는다 (최소 1로 0 나눗셈 방지)
  const max = Math.max(1, ...days.map((d) => d.total))
  const todayStart = startOfDay(Date.now())

  return (
    <div className="glass glass-sheen relative overflow-hidden rounded-xl px-3 pt-2.5 pb-2">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] text-ink-400">최근 7일</span>
        <span className="text-[11px] tabular-nums text-ink-500">
          {week.total}개
          {week.focus > 0 && <span className="text-focus"> · 집중 {week.focus}</span>}
        </span>
      </div>

      <div className="flex items-end gap-1">
        {days.map((d) => {
          const isToday = d.start === todayStart
          const isSelected = selected === d.start
          const h = (d.total / max) * 100

          return (
            <button
              key={d.start}
              type="button"
              onClick={() => onSelect(isSelected ? null : d.start)}
              aria-pressed={isSelected}
              title={`${d.date.getMonth() + 1}월 ${d.date.getDate()}일 · ${d.total}개`}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1 transition ${
                isSelected ? 'bg-accent-dim' : 'hover:bg-raise'
              }`}
            >
              {/* 막대 — 활동 색으로 쌓는다 */}
              <span className="flex h-12 w-full items-end justify-center">
                <span
                  className="relative flex w-[60%] min-w-[8px] flex-col overflow-hidden rounded-[3px] bg-ink-600/40"
                  style={{ height: d.total > 0 ? `${Math.max(h, 12)}%` : '3px' }}
                >
                  {d.segments.map((seg) => (
                    <span
                      key={seg.color}
                      style={{ background: seg.color, height: `${(seg.n / d.total) * 100}%` }}
                    />
                  ))}
                </span>
              </span>

              <span
                className={`text-[10px] leading-none ${
                  isToday ? 'font-semibold text-ink-100' : 'text-ink-500'
                }`}
              >
                {WEEKDAY[d.date.getDay()]}
              </span>
              <span
                className={`text-[10px] leading-none tabular-nums ${
                  isSelected ? 'text-accent' : 'text-ink-500'
                }`}
              >
                {d.date.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[11px]">
        <span className="text-ink-500">
          기록한 날 <span className="tabular-nums text-ink-300">{week.activeDays}일</span>
        </span>
        <span className="text-ink-500">
          하루 평균 <span className="tabular-nums text-ink-300">{week.perDay}개</span>
        </span>
      </div>

      {selected !== null && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-2 w-full rounded-lg bg-raise py-1.5 text-[11px] text-ink-300 transition hover:text-ink-100"
        >
          전체 기간 보기
        </button>
      )}
    </div>
  )
}
