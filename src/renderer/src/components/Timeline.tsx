import type { Pin } from '@shared/types'
import { pinColor, tagColor } from '@/lib/category'
import { dateLabel, hhmm, isSameDay } from '@/lib/time'
import { usePinStore } from '@/store/usePinStore'
import { Icon } from './Icon'

interface Props {
  pins: Pin[]
}

/** 30분 이상 비어 있으면 '공백'으로 본다 — 그보다 짧으면 노이즈다 */
const GAP_THRESHOLD_MS = 30 * 60 * 1000

const formatGap = (ms: number): string => {
  const mins = Math.round(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

/**
 * 메인 모드 타임라인.
 *
 * 왼쪽에 시간 레일을 세우고 기록을 그 위에 꿴다. 기록 사이가 30분 이상
 * 비면 '공백' 표시를 넣는다 — 이 앱의 요점이 '하루가 어떻게 쪼개졌나'를
 * 보여주는 것이라, 빈 시간이 보이지 않으면 그냥 메모 목록이 되어버린다.
 *
 * 항목 클릭 = 수정, 우측 버튼 = 집중 토글 / 삭제.
 */
export function Timeline({ pins }: Props): React.JSX.Element {
  const { openEditor, removePin, toggleFocus } = usePinStore.getState()

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="rounded-2xl bg-ink-850 p-4 ring-1 ring-line">
          <Icon name="pin" size={28} className="text-ink-500" strokeWidth={1.5} />
        </div>
        <p className="text-sm leading-relaxed text-ink-400">
          아직 기록이 없어요.
          <br />
          위의 <span className="text-ink-300">한 번에 기록</span> 을 누르거나,
          <br />
          직접 적으려면 <kbd className="rounded bg-ink-700 px-1.5 py-0.5 text-xs">+</kbd> 를 누르세요.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {pins.map((pin, i) => {
        const prev = pins[i - 1] // 최신순 정렬이라 prev 가 '더 나중' 기록
        const showDate = i === 0 || !isSameDay(pin.timestamp, prev.timestamp)
        const gap =
          !showDate && prev ? prev.timestamp - pin.timestamp : 0
        const showGap = gap >= GAP_THRESHOLD_MS

        return (
          <li key={pin.id}>
            {showDate && (
              <div className="mt-6 mb-2 flex items-center gap-3 first:mt-0">
                <span className="text-xs font-medium text-ink-300">
                  {dateLabel(pin.timestamp)}
                </span>
                <span className="h-px flex-1 bg-ink-700" />
              </div>
            )}

            {/* 기록 사이의 빈 시간 — 레일은 이어지되 점선으로 */}
            {showGap && (
              <div className="flex items-center gap-3 pl-[3.25rem]">
                <span className="relative flex h-7 w-px justify-center">
                  <span className="h-full w-px border-l border-dashed border-ink-600" />
                </span>
                <span className="text-[11px] text-ink-500">{formatGap(gap)} 비어 있음</span>
              </div>
            )}

            <div className="group relative flex items-start gap-3 rounded-lg py-2 pr-2 transition hover:bg-raise">
              {/* 시각 */}
              <span className="w-11 shrink-0 pt-px text-right text-[13px] tabular-nums text-ink-400">
                {hhmm(pin.timestamp)}
              </span>

              {/*
                시간 레일 + 노드.

                노드 색은 활동 색이다. 예전에는 집중 여부로만 색이 갈렸는데,
                집중은 바로 아래 왼쪽 세로선과 '집중' 라벨이 이미 말해주고 있었다.
                점까지 같은 말을 반복하느니 활동을 말하게 하는 편이 정보가 는다.
              */}
              <span className="relative flex w-3 shrink-0 justify-center self-stretch">
                <span className="absolute inset-y-0 w-px bg-ink-700" />
                <span
                  className="relative mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-ink-950"
                  style={{ background: pinColor(pin) }}
                />
              </span>

              {/*
                '선택과 집중' 강조는 '면'이 아니라 '선'으로 한다.
                행 전체에 앰버 틴트를 깔면 — 20%든 8%든 — 검정 위에서 갈색 띠가 되고,
                가로로 길게 뻗어 본문보다 먼저 눈에 띈다.
                왼쪽 레일 + 앰버 점 + 작은 라벨이면 충분히 구분되고 탁해지지 않는다.
              */}
              <div
                className={`min-w-0 flex-1 ${
                  pin.isFocusMode ? 'border-l-2 border-focus pl-2.5' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => openEditor(pin)}
                  className="block w-full text-left text-[14px] leading-snug text-ink-100"
                >
                  {pin.text || <span className="text-ink-500">(내용 없음)</span>}
                </button>
                {/* 상세 메모 — 있을 때만. 길면 3줄까지만 보이고 나머지는 수정 화면에서 */}
                {pin.detail && (
                  <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed whitespace-pre-line text-ink-400">
                    {pin.detail}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {pin.isFocusMode && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-focus">
                      <Icon name="star" size={11} strokeWidth={2.2} />
                      집중
                    </span>
                  )}
                  {/* 태그 칩도 각자의 활동 색을 입는다 — 점과 같은 색이라 짝이 읽힌다 */}
                  {pin.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{ color: tagColor(tag), background: `color-mix(in srgb, ${tagColor(tag)} 12%, transparent)` }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 데스크탑: hover 시 노출 / 모바일: 항상 노출 */}
              <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
                <button
                  type="button"
                  onClick={() => void toggleFocus(pin.id)}
                  title="선택과 집중 토글"
                  className={`rounded-md p-1.5 hover:bg-raise ${
                    pin.isFocusMode ? 'text-focus' : 'text-ink-500'
                  }`}
                >
                  <Icon name="star" size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => void removePin(pin.id)}
                  title="삭제"
                  className="rounded-md p-1.5 text-ink-500 hover:bg-red-500/15 hover:text-red-300"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
