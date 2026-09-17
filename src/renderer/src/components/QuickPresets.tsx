import { DEFAULT_PRESETS } from '@shared/types'
import { tagColor } from '@/lib/category'
import { usePinStore } from '@/store/usePinStore'
import { Icon } from './Icon'

interface Props {
  /** 저장 직후 알릴 때 쓴다 */
  onRecorded: (label: string) => void
}

/**
 * 원탭 빠른 기록.
 *
 * 입력창을 거치지 않고 지금 시각으로 바로 남긴다. 이 앱의 약속이 '빠른 기록'인데
 * 기존 경로는 [+] → 시트 → 타이핑 → 저장으로 네 번이 걸렸다.
 * 자주 쓰는 활동은 한 번이면 충분하다.
 *
 * 잘못 눌러도 타임라인에서 바로 지울 수 있어 되돌리기 비용이 낮다.
 */
export function QuickPresets({ onRecorded }: Props): React.JSX.Element {
  const { quickAdd } = usePinStore.getState()

  return (
    /*
     * 글래스모피즘.
     *
     * backdrop-blur 는 '뒤에 있는 것'을 흐리는 효과라, 배경이 단색이면 아무 변화가
     * 없다. MainView 가 뒤에 컬러 앰비언트(흐린 원들)를 깔아두기 때문에 여기서
     * 유리처럼 읽힌다 — 둘은 한 세트다.
     *
     * 위쪽 하이라이트(from-glass-edge)는 빛이 유리 윗면에 걸린 느낌을 만든다.
     */
    <div className="glass glass-sheen relative overflow-hidden rounded-xl px-3 py-2.5">
      <div className="mb-2 text-[11px] text-ink-400">한 번에 기록</div>
      <div className="grid grid-cols-4 gap-1.5">
        {DEFAULT_PRESETS.map((preset) => (
          <button
            key={preset.tag}
            type="button"
            onClick={() => {
              void quickAdd(preset.label, preset.tag)
              onRecorded(preset.label)
            }}
            // 아이콘에 활동 색을 입혀 여기서 색-활동 짝을 배우게 한다.
            // 타임라인·하루 띠·시계가 전부 같은 색을 쓰므로 한 번 익히면 계속 통한다.
            className="glass-soft flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] text-ink-300 transition active:scale-95 hover:text-ink-100"
          >
            <Icon name={preset.icon} size={18} style={{ color: tagColor(preset.tag) }} />
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
