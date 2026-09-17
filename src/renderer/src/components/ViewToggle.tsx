import type { ClockView } from '@shared/types'
import { Icon, type IconName } from './Icon'

interface Props {
  view: ClockView
  onChange: (view: ClockView) => void
  compact?: boolean
}

/** 듀얼 테마 전환 — 아날로그 ↔ 디지털 */
export function ViewToggle({ view, onChange, compact = false }: Props): React.JSX.Element {
  const items: { key: ClockView; label: string; icon: IconName }[] = [
    { key: 'analog', label: '아날로그', icon: 'clockAnalog' },
    { key: 'digital', label: '디지털', icon: 'clockDigital' }
  ]

  return (
    <div className="no-drag inline-flex rounded-full bg-ink-700/80 p-0.5 ring-1 ring-line">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          aria-pressed={view === item.key}
          title={item.label}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full leading-none transition ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'
          } ${
            view === item.key
              ? 'bg-ink-600 text-ink-100 shadow'
              : 'text-ink-300 hover:text-ink-100'
          }`}
        >
          <Icon name={item.icon} size={compact ? 15 : 16} />
          {/* 좁은 화면에서는 아이콘만 — 라벨까지 넣으면 헤더가 넘친다 */}
          {!compact && <span className="hidden sm:inline">{item.label}</span>}
        </button>
      ))}
    </div>
  )
}
