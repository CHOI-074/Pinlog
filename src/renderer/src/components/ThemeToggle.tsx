import { THEME_MODES } from '@shared/types'
import { usePinStore } from '@/store/usePinStore'

/**
 * 테마 전환 — 라이트 / 다크 / 시스템.
 *
 * 데스크탑에서는 nativeTheme 가 세 창(메인·미니·입력)을 한꺼번에 바꾸므로,
 * 여기서는 선택값만 보내면 된다.
 */
export function ThemeToggle(): React.JSX.Element {
  const theme = usePinStore((s) => s.theme)
  const { setTheme } = usePinStore.getState()

  return (
    <div
      className="no-drag inline-flex rounded-lg bg-ink-800 p-0.5 ring-1 ring-line"
      role="group"
      aria-label="테마"
    >
      {THEME_MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => setTheme(m.key)}
          aria-pressed={theme === m.key}
          title={`${m.label} 테마`}
          className={`whitespace-nowrap rounded-md px-2 py-1 text-[11px] leading-none transition ${
            theme === m.key
              ? 'bg-ink-600 text-ink-100'
              : 'text-ink-400 hover:text-ink-100'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

