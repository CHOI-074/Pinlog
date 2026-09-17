import { useState } from 'react'
import { AnalogClock } from './AnalogClock'
import { DigitalClock } from './DigitalClock'
import { Icon } from './Icon'
import { ViewToggle } from './ViewToggle'
import { usePinStore, selectTodayPins } from '@/store/usePinStore'
import { bridge, isDesktop } from '@/lib/bridge'

/**
 * 미니 모드 — 화면 구석에 떠 있는 플로팅 위젯.
 * 창 전체가 투명하고, 여기 그려지는 시계 모양만 화면에 보인다.
 */
export function MiniView(): React.JSX.Element {
  const { pins, view } = usePinStore()
  const { setView, setMode, openComposer, openEditor } = usePinStore.getState()
  const [hovered, setHovered] = useState(false)

  const today = selectTodayPins(pins)

  return (
    // 여백은 사방 균일하게 준다. 컨트롤 바 자리를 위쪽에 따로 비워두면
    // 평소(비호버)에 그만큼 빈 공간이 남아 위젯이 작아 보인다 — 바는 시계 위에 겹친다.
    // 그래도 시계는 '높이 기준'으로 잡는다: 여백이 비대칭이 되는 순간
    // w-full 은 너비 기준 정사각형이 되어 아래가 잘린다 (scripts/check-widget-fit.js)
    <div
      className="relative h-full w-full p-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {view === 'analog' ? (
        <div className="flex h-full w-full items-center justify-center">
          <AnalogClock
            pins={today}
            draggable
            className="h-full w-auto max-w-full"
            onDialClick={() => openComposer()}
            onMarkerClick={openEditor}
          />
        </div>
      ) : (
        <div className="flex h-full items-center">
          <DigitalClock
            draggable
            compact
            onAdd={() => openComposer()}
            summary={{
              total: today.length,
              focus: today.filter((p) => p.isFocusMode).length
            }}
          />
        </div>
      )}

      {/*
        호버할 때만 뜨는 컨트롤 바. 평소엔 시계만 깔끔하게 보인다.

        ⚠️ 순서 주의: 이 블록은 반드시 시계(.drag-region)보다 '뒤에' 와야 한다.
        Electron 은 드래그 영역을 트리 순서대로 훑으며 drag=합집합, no-drag=차집합을
        순차 적용한다. 컨트롤 바가 앞에 오면 시계의 사각 바운딩 박스가 그 영역을
        다시 덮어써서, 버튼 클릭이 창 드래그로 먹혀버린다.
      */}
      <div
        className={`absolute inset-x-0 top-0.5 z-20 flex items-center justify-center gap-1 px-1 transition-opacity duration-150 ${
          hovered ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ViewToggle view={view} onChange={setView} compact />
        <button
          type="button"
          onClick={() => setMode('main')}
          title="메인 모드로 펼치기"
          className="no-drag rounded-full bg-ink-700/90 p-1.5 leading-none ring-1 ring-line hover:bg-ink-600"
        >
          <Icon name="expand" size={15} />
        </button>
        {isDesktop && (
          <button
            type="button"
            onClick={() => void bridge.window.close()}
            title="닫기"
            className="no-drag rounded-full bg-ink-700/90 p-1.5 leading-none ring-1 ring-line hover:bg-red-500/70"
          >
            <Icon name="close" size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
