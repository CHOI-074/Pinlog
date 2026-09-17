import { useMemo } from 'react'
import type { Pin } from '@shared/types'
import { pinColor } from '@/lib/category'
import { dialAngle, polar, useNow } from '@/lib/time'

interface Props {
  pins: Pin[]
  /** 다이얼 안쪽을 클릭 → 핀 생성 */
  onDialClick: () => void
  /** 마커 클릭 → 해당 핀 수정 */
  onMarkerClick?: (pin: Pin) => void
  /** 미니 모드에서는 바깥 테두리가 창 드래그 핸들이 된다 */
  draggable?: boolean
  /**
   * 크기는 호출부가 정한다.
   * 기본값 'w-full' 은 너비에 맞춰 정사각형이 되므로, 세로가 좁은 컨테이너에서는
   * 아래가 잘린다. 그런 곳(미니 위젯)에서는 'h-full w-auto' 를 넘겨야 한다.
   */
  className?: string
}

const C = 100 // SVG 중심 (viewBox 200x200)

/**
 * 핀 마커는 오전/오후를 링으로 나눈다.
 * 12시간 다이얼이라 09:10 과 21:10 이 같은 각도에 찍히기 때문에,
 * 안쪽 링 = 오전, 바깥 링 = 오후로 분리해야 하루가 제대로 읽힌다.
 */
const RING = { am: 74, pm: 92 }

export function AnalogClock({
  pins,
  onDialClick,
  onMarkerClick,
  draggable = false,
  className = 'w-full'
}: Props): React.JSX.Element {
  const now = useNow()

  const hourAngle = ((now.getHours() % 12) + now.getMinutes() / 60) * 30
  const minuteAngle = (now.getMinutes() + now.getSeconds() / 60) * 6
  const secondAngle = now.getSeconds() * 6

  // 눈금 60개는 작은 위젯에서 뭉갠다. 시각 눈금 12개만 남기고
  // 분 단위는 아주 옅은 링 하나로 암시한다.
  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])

  const marker = (pin: Pin): { x: number; y: number; r: number } => {
    const pm = new Date(pin.timestamp).getHours() >= 12
    const p = polar(C, C, pm ? RING.pm : RING.am, dialAngle(pin.timestamp))
    return { x: p.x, y: p.y, r: pin.isFocusMode ? 4.2 : 2.8 }
  }

  return (
    <div
      className={`relative aspect-square rounded-full ${
        draggable ? 'drag-region' : ''
      } ${className}`}
    >
      {/*
        시계판. 위가 밝고 아래가 어두운 그라데이션 + 안쪽 하이라이트로
        유리 덮인 다이얼처럼 보이게 한다. 배경(ink-950)보다 확실히 밝아야
        판이 떠 보인다 — 너무 어두우면 배경에 잠긴다.
      */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-ink-700 to-ink-900 shadow-[var(--shadow-dial)] ring-1 ring-line" />
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-ink-850 to-ink-900 shadow-[inset_0_1px_0_var(--dial-gloss)]" />

      <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 h-full w-full">
        {/* 분 단위를 암시하는 옅은 링 */}
        <circle cx={C} cy={C} r={RING.pm} fill="none" className="stroke-line" strokeWidth="0.8" />
        <circle cx={C} cy={C} r={RING.am} fill="none" className="stroke-line" strokeWidth="0.8" />

        {/* 시각 눈금 12개 — 3/6/9/12 만 조금 더 길고 밝게 */}
        {hours.map((i) => {
          const cardinal = i % 3 === 0
          const a = i * 30
          const p1 = polar(C, C, cardinal ? 80 : 84, a)
          const p2 = polar(C, C, 88, a)
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="currentColor"
              className={cardinal ? 'text-ink-300' : 'text-ink-500'}
              strokeWidth={cardinal ? 2.2 : 1.6}
              strokeLinecap="round"
            />
          )
        })}

        {/* 기록된 핀 — 안쪽 링 = 오전, 바깥 링 = 오후 */}
        {pins.map((pin) => {
          const m = marker(pin)
          return (
            <circle
              key={pin.id}
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill={pinColor(pin)}
              opacity={pin.isFocusMode ? 1 : 0.8}
            >
              <title>{`${new Date(pin.timestamp).toLocaleTimeString('ko-KR')} · ${pin.text}`}</title>
            </circle>
          )
        })}

        {/*
          바늘. 두께 차이로만 위계를 준다.
          (끝이 뾰족해지는 다각형도 해봤는데, 이 크기에서는 중심 근처가
           뭉쳐 보이기만 하고 이득이 없었다 — 둥근 끝 직선이 훨씬 또렷하다)
        */}
        <Hand angle={hourAngle} length={44} width={5} className="stroke-ink-100" />
        <Hand angle={minuteAngle} length={68} width={3.2} className="stroke-ink-100" />
        <Hand angle={secondAngle} length={74} width={1.2} className="stroke-focus" />
        <circle cx={C} cy={C} r={4.5} className="fill-ink-900" />
        <circle cx={C} cy={C} r={2.2} className="fill-focus" />
      </svg>

      {/*
        안쪽 원 = 클릭 타깃(핀 찍기). no-drag 로 드래그 영역에서 빼내야
        클릭이 창 이동으로 먹히지 않는다.
      */}
      <button
        type="button"
        onClick={onDialClick}
        aria-label="지금 이 순간 핀 찍기"
        className="no-drag group absolute top-1/2 left-1/2 h-[56%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="pointer-events-none absolute inset-x-0 bottom-[14%] text-center text-[10px] font-medium text-ink-400 opacity-0 transition group-hover:opacity-100">
          클릭해서 핀
        </span>
      </button>

      {/* 마커 클릭으로 수정 — 정확한 히트박스를 위해 별도로 겹쳐둔다 */}
      {onMarkerClick && (
        <div className="pointer-events-none absolute inset-0">
          {pins.map((pin) => {
            const pm = new Date(pin.timestamp).getHours() >= 12
            // % 좌표 (viewBox 200 → 100%)
            const p = polar(50, 50, (pm ? RING.pm : RING.am) / 2, dialAngle(pin.timestamp))
            return (
              <button
                key={pin.id}
                type="button"
                onClick={() => onMarkerClick(pin)}
                title={pin.text}
                className="no-drag pointer-events-auto absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/** 중심 뒤로 살짝 빠져나온 둥근 끝 바늘 */
function Hand({
  angle,
  length,
  width,
  className
}: {
  angle: number
  length: number
  width: number
  className: string
}): React.JSX.Element {
  const tip = polar(C, C, length, angle)
  const tail = polar(C, C, -13, angle)
  return (
    <line
      x1={tail.x}
      y1={tail.y}
      x2={tip.x}
      y2={tip.y}
      strokeWidth={width}
      strokeLinecap="round"
      className={className}
    />
  )
}
