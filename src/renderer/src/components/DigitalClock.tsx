import { useNow } from '@/lib/time'
import { Icon } from './Icon'

interface Props {
  /** [+] 플로팅 액션 버튼 */
  onAdd: () => void
  /** 미니 모드에서 시각 영역이 창 드래그 핸들이 된다 */
  draggable?: boolean
  compact?: boolean
  /** 메인 화면에서는 유리 재질. 미니 위젯은 투명 창이라 불투명 카드가 낫다. */
  glass?: boolean
  /** 오늘 기록 수 / 집중 기록 수 */
  summary?: { total: number; focus: number }
}

export function DigitalClock({
  onAdd,
  draggable = false,
  compact = false,
  glass = false,
  summary
}: Props): React.JSX.Element {
  const now = useNow()
  const time = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const date = now.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })

  return (
    <div
      className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3 ${
        glass
          ? 'glass glass-sheen'
          : 'bg-gradient-to-b from-ink-800 to-ink-900 ring-1 ring-line'
      } ${draggable ? 'drag-region shadow-[var(--shadow-dial)]' : ''}`}
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-semibold tracking-[-0.02em] tabular-nums ${
              compact ? 'text-[30px] leading-none' : 'text-[44px] leading-none'
            }`}
          >
            {time}
          </span>
          <span className="text-[13px] tabular-nums text-ink-500">:{seconds}</span>
        </div>
        <div className="mt-1.5 truncate text-[11px] text-ink-400">
          {date}
          {summary && (
            <>
              {' · '}
              <span className="text-ink-300">{summary.total}건</span>
              {summary.focus > 0 && <span className="text-focus"> · 집중 {summary.focus}</span>}
            </>
          )}
        </div>
      </div>

      {/* FAB — 드래그 영역 안에 있으므로 no-drag 필수 */}
      <button
        type="button"
        onClick={onAdd}
        aria-label="기록 추가"
        className={`no-drag flex shrink-0 items-center justify-center rounded-full bg-accent text-ink-900 shadow-lg transition hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          compact ? 'h-11 w-11' : 'h-14 w-14'
        }`}
      >
        <Icon name="plus" size={compact ? 22 : 28} strokeWidth={2} />
      </button>
    </div>
  )
}
