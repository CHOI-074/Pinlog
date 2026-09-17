import { useEffect, useMemo, useRef, useState } from 'react'
import { AnalogClock } from './AnalogClock'
import { AvatarCard } from './AvatarCard'
import { AvatarSheet } from './AvatarSheet'
import { DayStrip } from './DayStrip'
import { DigitalClock } from './DigitalClock'
import { Icon } from './Icon'
import { QuickPresets } from './QuickPresets'
import { Timeline } from './Timeline'
import { ThemeToggle } from './ThemeToggle'
import { ViewToggle } from './ViewToggle'
import { WeekCalendar } from './WeekCalendar'
import { usePinStore, selectTodayPins } from '@/store/usePinStore'
import { progressOf, unlockedBetween } from '@/lib/avatar'
import { copyAsMarkdown, exportCsv } from '@/lib/export'
import { bridge, isDesktop } from '@/lib/bridge'

/** 메인 모드 — 타임라인 조회 / 수정 / 통계 / 내보내기 */
export function MainView(): React.JSX.Element {
  const { pins, view, selectedDay, look } = usePinStore()
  const { setView, setMode, openComposer, openEditor, selectDay, setLookPart, openOnboarding } =
    usePinStore.getState()
  const [toast, setToast] = useState<string | null>(null)
  const [dressing, setDressing] = useState(false)

  const today = useMemo(() => selectTodayPins(pins), [pins])

  // 날짜를 고르면 타임라인을 그날로 좁힌다
  const visible = useMemo(() => {
    if (selectedDay === null) return pins
    const end = selectedDay + 24 * 60 * 60 * 1000
    return pins.filter((p) => p.timestamp >= selectedDay && p.timestamp < end)
  }, [pins, selectedDay])

  // 레벨은 기록에서 계산되므로 기록이 늘면 저절로 따라 오른다
  const progress = useMemo(() => progressOf(pins), [pins])

  const flash = (msg: string): void => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  /*
    레벨업 알림.

    직전 레벨을 ref 로 들고 비교한다. 첫 렌더에는 비교 대상이 없으므로 알리지
    않는다 — 앱을 열 때마다 "레벨업!"이 뜨면 그건 축하가 아니라 소음이다.
  */
  const prevLevel = useRef<number | null>(null)
  useEffect(() => {
    const before = prevLevel.current
    prevLevel.current = progress.level
    if (before === null || progress.level <= before) return

    const gained = unlockedBetween(before, progress.level)
    setToast(
      gained.length > 0
        ? `Lv.${progress.level} 달성! '${gained[0].label}' 해금`
        : `Lv.${progress.level} 달성!`
    )
    // 레벨업은 일반 토스트보다 길게 둔다 — 읽고 반응할 시간이 필요하다
    const id = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(id)
  }, [progress.level])

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/*
        배경 앰비언트.
        글래스 카드(QuickPresets)가 흐릴 '대상'이다 — 배경이 단색이면
        backdrop-blur 를 걸어도 보이는 변화가 없어서 유리처럼 읽히지 않는다.
        아주 옅게 깔아 본문 가독성은 건드리지 않는다.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
        <div className="absolute top-40 -right-24 h-64 w-64 rounded-full bg-focus/30 blur-3xl" />
        <div className="absolute top-[28rem] -left-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-56 w-56 rounded-full bg-focus/20 blur-3xl" />
      </div>
      {/*
        커스텀 헤더. titleBarStyle 이 hidden 이라 이 영역이 곧 타이틀바이고,
        drag-region 을 줘야 창을 끌어 옮길 수 있다.
        macOS 는 왼쪽에 신호등 버튼 자리를 비워둬야 한다.
      */}
      <header
        // relative: 배경 앰비언트 위에 올라와야 한다
        // --safe-pad-*: 안전영역이 0인 환경에서도 최소 여백을 지키는 기본값
        style={{ ["--safe-pad-x" as string]: "1rem", ["--safe-pad-top" as string]: "0.75rem" }}
        className={`drag-region safe-top safe-x relative z-10 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line py-3 ${
          bridge.platform === 'darwin' ? 'sm:pl-20' : ''
        }`}
      >
        <h1 className="text-[13px] font-semibold tracking-tight text-ink-100">핀로그</h1>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
          <ViewToggle view={view} onChange={setView} />
          <span className="mx-1 h-4 w-px bg-ink-700" />
          <ThemeToggle />
          <span className="mx-1 h-4 w-px bg-ink-700" />
          <HeaderButton
            icon="copy"
            label="복사"
            onClick={() => void copyAsMarkdown(pins).then(() => flash('클립보드에 복사했어요'))}
          />
          <HeaderButton
            icon="download"
            label="CSV"
            onClick={() => void exportCsv(pins).then((p) => p && flash('CSV 로 내보냈어요'))}
          />
          {isDesktop && (
            <>
              <span className="mx-1 h-4 w-px bg-ink-700" />
              <HeaderButton icon="collapse" label="미니" onClick={() => setMode('mini')} />
            </>
          )}
        </div>
      </header>

      <div
        style={{ ['--safe-pad-x' as string]: '1rem' }}
        className="safe-x relative z-10 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-4 pb-28 sm:flex-row sm:overflow-hidden sm:py-5 sm:pb-5"
      >
        {/*
          좌: 캐릭터 + 시계 + 오늘 요약.

          카드가 다섯 장이라 좁은 데스크탑 창에서는 세로가 모자란다. 예전에는
          부모가 overflow-hidden 이라 넘친 만큼 잘려 나갔다 — 여기서 따로 스크롤한다.
        */}
        {/*
          *:shrink-0 — 카드가 줄어들지 않게 한다.
          flex 자식은 기본값이 '줄어들 수 있음'이라, 열이 창보다 길어지면 스크롤이 생기는
          대신 카드마다 납작해지고, 카드의 overflow-hidden 이 내용을 잘랐다.
          캐릭터 카드를 120px 로 키운 뒤 데스크탑 창·웹 브라우저에서 캐릭터 머리와
          '한 번에 기록' 버튼이 반쯤 잘려 나갔다. (scripts/check-desktop-layout.js)
        */}
        <aside className="flex shrink-0 flex-col gap-2.5 *:shrink-0 sm:w-[264px] sm:min-h-0 sm:gap-3 sm:overflow-y-auto sm:pr-1">
          {/*
            캐릭터 — 기록이 쌓이면 레벨이 오르고 꾸밀 것이 늘어난다.
            맨 위에 두는 이유: 이 카드는 '오늘 뭘 했나'가 아니라 '내가 어디까지 왔나'다.
            앱을 열었을 때 가장 먼저 반겨야 기록할 마음이 생긴다.
          */}
          <AvatarCard look={look} progress={progress} onOpen={() => setDressing(true)} />

          {view === 'analog' ? (
            // 모바일에서는 시계를 줄인다 — 첫 화면의 주인공은 타임라인이어야 한다
            <div className="mx-auto w-full max-w-[184px] px-1 pt-1 sm:max-w-none sm:px-3">
              <AnalogClock
                pins={today}
                onDialClick={() => openComposer()}
                onMarkerClick={openEditor}
              />
              <p className="mt-3 text-center text-[11px] text-ink-500">
                안쪽 링 오전 · 바깥 링 오후
              </p>
            </div>
          ) : (
            // 개수는 바로 아래 하루 띠가 보여준다 — 시계에도 넣으면 같은 숫자가 두 번 나온다
            <DigitalClock glass onAdd={() => openComposer()} />
          )}

          {/*
            하루 띠 — 아날로그 다이얼은 12시간이 겹쳐 보이는데, 이건 0~24시를
            한 줄로 펴서 오전/오후 분포가 바로 읽힌다. 기록이 없어도 현재 시각
            표시가 있어 화면이 비지 않는다.
          */}
          <DayStrip pins={today} onMarkerClick={openEditor} />

          {/* 최근 7일 통계 — 날짜를 누르면 타임라인이 그날만 보여준다 */}
          <WeekCalendar pins={pins} selected={selectedDay} onSelect={selectDay} />

          {/* 자주 쓰는 활동은 입력창을 거치지 않고 한 번에 남긴다 */}
          <QuickPresets onRecorded={(label) => flash(`'${label}' 기록했어요`)} />

          {/*
            온보딩 다시 열기. 헤더에 두지 않은 이유: 모바일 헤더가 이미 한 줄을
            꽉 채우고 있어 아이콘 하나만 늘어도 두 줄로 접힌다. 자주 누를 버튼이
            아니므로 눈에 덜 띄는 '자리'가 맞다.

            단, 눈에 덜 띄는 '색'이면 안 된다. 처음엔 ink-500 이었는데 대비가
            2:1 밖에 안 돼서, 기록이 이미 있는 사람(온보딩이 자동으로 안 뜨는 사람)이
            이 버튼을 못 찾아 온보딩을 볼 방법이 없었다. ink-300 이면 6:1 이상이다.
          */}
          <button
            type="button"
            onClick={openOnboarding}
            className="mx-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-ink-300 transition hover:bg-raise hover:text-ink-100"
          >
            <Icon name="book" size={14} />
            사용법 다시 보기
          </button>

          {/*
            AI 요약이 들어갈 자리 (구독 기능, 개발 예정).

            앱인토스 빌드에서는 숨긴다 — 검수 기준이 "소개한 기능이 실제로 동일하게
            동작할 것"이라, 미구현 기능이 화면에 보이면 반려 사유가 될 수 있다.
            (__TOSS_BUILD__ 가 false 인 데스크탑·PWA 빌드에서는 그대로 보인다)
          */}
          {!__TOSS_BUILD__ && (
          <div className="rounded-xl border border-dashed border-ink-600 px-3 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
              <Icon name="star" size={12} />
              하루 요약
              <span className="ml-auto rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-ink-300">
                준비 중
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
              오늘 기록을 모아 회고를 만들어 줍니다.
            </p>
          </div>
          )}
        </aside>

        {/* 우: 타임라인 */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1 flex shrink-0 items-baseline gap-2">
            <h2 className="text-xs font-medium tracking-wide text-ink-300">
              {selectedDay === null
                ? '타임라인'
                : new Date(selectedDay).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
            </h2>
            <span className="text-[11px] text-ink-500">{visible.length}건</span>
          </div>
          <div className="min-h-0 flex-1 pr-1 sm:overflow-y-auto">
            <Timeline pins={visible} />
          </div>
        </section>
      </div>

      {/*
        모바일 전용 빠른 기록 버튼.
        데스크탑에는 미니 위젯과 전역 단축키가 있지만 모바일엔 없다 —
        손가락이 닿는 곳에 항상 있어야 "빠른 기록"이 성립한다.
      */}
      <button
        type="button"
        onClick={() => openComposer()}
        aria-label="지금 기록하기"
        className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-ink-950 shadow-lg transition active:scale-95 sm:hidden"
      >
        <Icon name="plus" size={26} strokeWidth={2.2} />
      </button>

      {dressing && (
        <AvatarSheet
          look={look}
          progress={progress}
          onChange={setLookPart}
          onClose={() => setDressing(false)}
        />
      )}

      {toast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink-700 px-4 py-2 text-sm shadow-xl ring-1 ring-line">
          {toast}
        </div>
      )}
    </div>
  )
}

function HeaderButton({
  icon,
  label,
  onClick
}: {
  icon: 'copy' | 'download' | 'collapse'
  label: string
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="no-drag flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-300 transition hover:bg-raise hover:text-ink-100 sm:px-2.5"
    >
      <Icon name={icon} size={15} />
      {/* 모바일에서는 아이콘만 — 헤더에 다 넣으면 줄이 넘친다 */}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

