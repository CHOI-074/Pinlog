import type { AvatarLook } from '@shared/types'
import { levelTitle, nextUnlock, type Progress } from '@/lib/avatar'
import { PixelAvatar } from './PixelAvatar'

interface Props {
  look: AvatarLook
  progress: Progress
  onOpen: () => void
}

/**
 * 캐릭터 카드 — 메인 화면에 상주하는 '나'.
 *
 * 카드 전체가 버튼이다. 꾸미기는 이 화면에서 가장 만지고 싶은 것이므로
 * 작은 [꾸미기] 링크를 찾게 만들 이유가 없다.
 *
 * 다음 해금을 같이 보여주는 이유: 진행 바만 있으면 "이게 차면 뭐가 좋은데?"에
 * 답이 없다. 받을 물건의 이름이 보여야 채울 이유가 생긴다.
 */
export function AvatarCard({ look, progress, onOpen }: Props): React.JSX.Element {
  const next = nextUnlock(progress.level)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="캐릭터 꾸미기"
      className="glass glass-sheen relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left transition active:scale-[0.99] hover:brightness-105"
    >
      {/* 40칸 격자의 3배(120px) — 정수배가 아니면 픽셀 폭이 들쭉날쭉해진다 */}
      <PixelAvatar look={look} size={120} />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold text-ink-100">Lv.{progress.level}</span>
          <span className="truncate text-[11px] text-ink-400">{levelTitle(progress.level)}</span>
          {progress.streak > 1 && (
            <span className="ml-auto shrink-0 rounded-full bg-focus-dim px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-focus">
              {progress.streak}일 연속
            </span>
          )}
        </span>

        {/* 진행 바 */}
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${Math.round(progress.ratio * 100)}%` }}
          />
        </span>

        {/* 좁은 폭에서도 두 값이 한 줄에 남도록 줄바꿈을 막고, 밀리면 오른쪽부터 줄인다 */}
        <span className="flex items-baseline justify-between gap-2 text-[10px] whitespace-nowrap">
          <span className="shrink-0 tabular-nums text-ink-500">
            {progress.maxed ? '최고 레벨' : `${progress.intoLevel} / ${progress.need} XP`}
          </span>
          {next ? (
            <span className="truncate text-ink-500">
              다음 <span className="text-ink-300">{next.label}</span> · Lv.{next.level}
            </span>
          ) : (
            <span className="truncate text-ink-500">전부 모았어요</span>
          )}
        </span>
      </span>
    </button>
  )
}
