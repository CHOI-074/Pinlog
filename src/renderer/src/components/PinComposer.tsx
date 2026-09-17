import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PRESETS } from '@shared/types'
import { tagColor } from '@/lib/category'
import { usePinStore } from '@/store/usePinStore'
import { Icon } from './Icon'

/**
 * 핀을 찍으면 즉시 뜨는 입력 팝업.
 *
 * 입력 수단이 세 가지다 — 어느 하나만 써도 되고 섞어 써도 된다:
 *   1) 직접 입력  — 자유 텍스트 (일기처럼 길게 써도 됨)
 *   2) 빠른 입력  — 프리셋 원클릭
 *   3) 태그 직접 추가 — 프리셋에 없는 태그를 손으로
 * 여기에 기록 시각도 수기로 고칠 수 있다.
 *
 * 단축키: Enter 저장 / Shift+Enter 줄바꿈 / Esc 취소
 */
interface Props {
  /**
   * true = 입력 전용 독립 창을 꽉 채운다 (데스크탑).
   * false = 메인/미니 창 위에 뜨는 인라인 모달 (웹·PWA).
   */
  standalone?: boolean
}

export function PinComposer({ standalone = false }: Props): React.JSX.Element | null {
  const draft = usePinStore((s) => s.draft)
  const {
    patchDraft,
    toggleDraftTag,
    addDraftTag,
    removeDraftTag,
    setDraftTime,
    commitDraft,
    closeComposer
  } = usePinStore.getState()

  const textRef = useRef<HTMLTextAreaElement>(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!draft.open) return
    setTagInput('')
    // 창이 뜨고 포커스를 받은 뒤에 줘야 확실히 먹는다
    const id = setTimeout(() => textRef.current?.focus(), 60)
    return () => clearTimeout(id)
  }, [draft.open])

  // 독립 창에서는 어디에 포커스가 있든 Esc 로 닫을 수 있어야 한다
  useEffect(() => {
    if (!standalone || !draft.open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeComposer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [standalone, draft.open, closeComposer])

  if (!draft.open) return null

  const save = (): void => void commitDraft()

  const onTextKeyDown = (e: React.KeyboardEvent): void => {
    // isComposing: 한글 조합 중 Enter 는 글자 확정이므로 저장하면 안 된다
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeComposer()
    }
  }

  const commitTagInput = (): void => {
    tagInput
      .split(/[,\s]+/)
      .filter(Boolean)
      .forEach(addDraftTag)
    setTagInput('')
  }

  const timeValue = new Date(draft.timestamp).toTimeString().slice(0, 5)

  return (
    <div
      className={
        standalone
          ? // 독립 창: 창 전체를 카드가 채운다. 배경 딤 없음(창 자체가 모달)
            'absolute inset-0 z-50 flex p-2'
          : // 인라인 모달 (웹/PWA 전용 — 데스크탑은 독립 창을 쓴다).
            // 모바일에서는 아래에서 올라오는 시트로, 큰 화면에서는 가운데 모달로.
            // fixed: 모바일은 body 가 스크롤되므로 absolute 면 뷰포트를 못 덮는다.
            'no-drag fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-2'
      }
      // 딤 영역을 탭하면 닫는다. 카드 안쪽 클릭은 아래 stopPropagation 으로 막는다.
      onClick={standalone ? undefined : closeComposer}
    >
      <div
        className={`bg-ink-850 p-3.5 shadow-[var(--shadow-float)] ring-1 ring-line ${
          standalone
            ? 'flex h-full w-full flex-col overflow-y-auto rounded-2xl'
            : // 모바일: 하단 시트(위쪽만 둥글게) + 홈 인디케이터 여백
              'safe-bottom w-full max-w-md rounded-t-2xl sm:my-auto sm:rounded-2xl'
        }`}
        // 홈 인디케이터가 없는 환경에서도 카드 자체 여백(p-3.5)은 지킨다
        style={standalone ? undefined : { ['--safe-pad-bottom' as string]: '0.875rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/*
          시각 — 수기로 고칠 수 있다.
          독립 창은 프레임리스라 이 헤더가 창을 옮기는 유일한 손잡이다.
          (drag-region 안의 입력·버튼은 반드시 no-drag)
        */}
        <div
          className={`mb-3 flex shrink-0 items-center justify-between gap-2 ${
            standalone ? 'drag-region -mx-3.5 -mt-3.5 px-3.5 pt-3.5 pb-1' : ''
          }`}
        >
          <label
            className={`flex items-center gap-2 text-sm text-ink-300 ${
              standalone ? 'no-drag' : ''
            }`}
          >
            <Icon name="pin" size={16} className="text-accent" />
            {/*
              OS 기본 time 위젯(달력 아이콘·스피너)은 index.css 에서 걷어냈다.
              남은 숫자만 우리 타이포로 보이게 해서 나머지 UI 와 붙인다.
            */}
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setDraftTime(e.target.value)}
              // 한국어 로케일에서는 '오후 05:17' 처럼 오전/오후가 붙어 폭이 더 필요하다
              className="w-[7rem] rounded-md bg-transparent px-1 py-0.5 text-[15px] font-medium tabular-nums text-ink-100 outline-none hover:bg-raise focus:bg-raise focus:ring-1 focus:ring-accent"
            />
            {draft.editingId && (
              <span className="rounded bg-accent-dim px-1.5 py-0.5 text-[11px] text-accent">
                수정 중
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={closeComposer}
            aria-label="닫기"
            className={`rounded-lg p-1.5 text-ink-300 hover:bg-raise hover:text-ink-100 ${
              standalone ? 'no-drag' : ''
            }`}
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        {/*
          1) 직접 입력 — 이 팝업의 주인공.
          라벨을 붙이면 '폼'처럼 보인다. 플레이스홀더만으로 충분하고,
          빠른 기록 도구라는 인상이 산다.
        */}
        <textarea
          ref={textRef}
          value={draft.text}
          onChange={(e) => patchDraft({ text: e.target.value })}
          onKeyDown={onTextKeyDown}
          rows={3}
          placeholder="무엇을 하고 있었나요?"
          // 대부분 한두 줄이라 세로를 다 먹지 않게 상한을 둔다. 길게 쓰면 안에서 스크롤된다.
          // (max-h 에 md: 브레이크포인트를 걸면 380px 입력창에서는 적용되지 않는다 — 상한은 무조건)
          className={`w-full resize-none rounded-xl bg-ink-800 px-3.5 py-3 text-[15px] leading-relaxed outline-none ring-1 ring-line placeholder:text-ink-500 focus:ring-1 focus:ring-accent ${
            standalone ? 'min-h-[5.5rem] max-h-44 flex-1' : ''
          }`}
        />
        {/* 키보드 안내는 물리 키보드가 있을 때만 — 모바일엔 Esc 키가 없다 */}
        <p className="mt-1.5 hidden text-[11px] text-ink-500 sm:block">
          <kbd className="font-sans text-[11px] text-ink-400">Enter</kbd> 저장 ·{' '}
          <kbd className="font-sans text-[11px] text-ink-400">Shift+Enter</kbd> 줄바꿈 ·{' '}
          <kbd className="font-sans text-[11px] text-ink-400">Esc</kbd> 취소
        </p>

        {/*
          자세히 — 한 줄 요약으로 부족할 때 쓰는 칸.
          위 본문과 역할이 다르므로 라벨을 붙여 구분한다 (본문은 '무엇', 여기는 '어떻게/왜').
          Enter 로 저장되지 않게 두어 여러 줄을 편히 쓸 수 있다.
        */}
        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-medium text-ink-400">
            자세히 <span className="font-normal text-ink-500">(선택)</span>
          </label>
          <textarea
            value={draft.detail}
            onChange={(e) => patchDraft({ detail: e.target.value })}
            onKeyDown={(e) => {
              // 본문과 달리 Enter 는 줄바꿈. Esc 만 취소로 받는다.
              if (e.key === 'Escape') {
                e.preventDefault()
                closeComposer()
              }
            }}
            rows={2}
            placeholder="무엇을 했는지, 어땠는지 자유롭게"
            className="max-h-32 w-full resize-none rounded-xl bg-ink-800 px-3.5 py-2.5 text-[14px] leading-relaxed outline-none ring-1 ring-line placeholder:text-ink-500 focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* 2) 빠른 입력 — 프리셋. 칩 모양만으로 용도가 읽히므로 라벨을 뺀다 */}
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_PRESETS.map((preset) => {
              const active = draft.tags.includes(preset.tag)
              return (
                <button
                  key={preset.tag}
                  type="button"
                  onClick={() => {
                    toggleDraftTag(preset.tag)
                    // 아직 아무것도 안 썼거나, 다른 프리셋 라벨만 들어있으면 갈아끼운다.
                    // 사용자가 직접 쓴 글은 절대 덮어쓰지 않는다.
                    const typed = draft.text.trim()
                    const isPresetLabel = DEFAULT_PRESETS.some((p) => p.label === typed)
                    if (!active && (!typed || isPresetLabel)) {
                      patchDraft({ text: preset.label })
                    }
                  }}
                  // 고르면 그 활동 색으로 채워진다 — 저장 후 타임라인에 찍힐 색과 같다
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                    active ? 'text-white' : 'bg-ink-800 ring-1 ring-line hover:bg-ink-700'
                  }`}
                  style={
                    active
                      ? { background: tagColor(preset.tag) }
                      : { color: tagColor(preset.tag) }
                  }
                >
                  <Icon name={preset.icon} size={16} />
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3) 태그 직접 추가 — 플레이스홀더가 곧 설명이다 */}
        <div className="mt-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ',') && !e.nativeEvent.isComposing) {
                e.preventDefault()
                commitTagInput()
              }
              if (e.key === 'Backspace' && !tagInput && draft.tags.length > 0) {
                removeDraftTag(draft.tags[draft.tags.length - 1])
              }
            }}
            onBlur={commitTagInput}
            placeholder="# 태그 추가 (Enter)"
            className="w-full rounded-lg bg-ink-800 px-3 py-2 text-[13px] outline-none ring-1 ring-line placeholder:text-ink-500 focus:ring-1 focus:ring-accent"
          />
          {draft.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeDraftTag(tag)}
                  title="클릭해서 제거"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    color: tagColor(tag),
                    background: `color-mix(in srgb, ${tagColor(tag)} 14%, transparent)`
                  }}
                >
                  #{tag}
                  <Icon name="close" size={12} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* '선택과 집중' 토글 */}
        <button
          type="button"
          onClick={() => patchDraft({ isFocusMode: !draft.isFocusMode })}
          aria-pressed={draft.isFocusMode}
          className={`mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ring-1 transition ${
            draft.isFocusMode
              ? 'bg-focus-dim ring-focus/30'
              : 'bg-ink-800 ring-line hover:bg-ink-700'
          }`}
        >
          <span className="flex items-center gap-2 text-[13px]">
            <Icon
              name="star"
              size={15}
              className={draft.isFocusMode ? 'text-focus' : 'text-ink-400'}
            />
            <span className={draft.isFocusMode ? 'text-focus' : 'text-ink-300'}>선택과 집중</span>
          </span>
          <span
            className={`relative h-[22px] w-10 shrink-0 rounded-full transition ${
              draft.isFocusMode ? 'bg-focus' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
                draft.isFocusMode ? 'left-[20px]' : 'left-0.5'
              }`}
            />
          </span>
        </button>

        {/*
          sticky: 창이 아무리 작아도(미니 모드, 좁은 모바일) 저장 버튼이
          스크롤 아래로 밀려 사라지지 않게 카드 하단에 붙여둔다.
        */}
        <div className="sticky bottom-0 -mx-3.5 -mb-3.5 mt-3 rounded-b-2xl bg-ink-850 px-3.5 pt-2.5 pb-3.5">
          <button
            type="button"
            onClick={save}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-[14px] font-medium text-ink-950 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Icon name="check" size={16} strokeWidth={2.4} />
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
