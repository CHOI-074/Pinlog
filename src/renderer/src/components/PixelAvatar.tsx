import { useMemo } from 'react'
import type { AvatarLook } from '@shared/types'
import { PX_H, PX_W, layersOf } from '@/lib/avatar'

interface Props {
  look: AvatarLook
  /** 세로 픽셀 크기. 가로는 비율대로 따라간다. */
  size?: number
  className?: string
}

/**
 * 픽셀 캐릭터.
 *
 * SVG 로 그리는 이유: 캔버스 한 장을 확대하면 뭉개지고, <img> 로 만들면 색(팔레트)을
 * 바꿀 때마다 파일이 필요하다. 사각형 목록으로 그리면 어떤 크기에서도 선명하고
 * 색은 속성 하나다.
 *
 * shapeRendering="crispEdges" 가 핵심이다. 이게 없으면 브라우저가 칸 경계를
 * 부드럽게 문질러서 픽셀 아트가 흐릿한 그림이 된다.
 */
export function PixelAvatar({ look, size = 72, className = '' }: Props): React.JSX.Element {
  const layers = useMemo(() => layersOf(look), [look])

  return (
    <svg
      viewBox={`0 0 ${PX_W} ${PX_H}`}
      height={size}
      width={(size * PX_W) / PX_H}
      shapeRendering="crispEdges"
      // 장식이다 — 레벨과 아이템 이름은 옆의 텍스트가 말한다
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {layers.map((runs, i) => (
        <g key={i}>
          {runs.map((r) => (
            <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
          ))}
        </g>
      ))}
    </svg>
  )
}
