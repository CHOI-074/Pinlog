/**
 * 아이콘 세트.
 *
 * 제공된 아이콘 시트의 시각 언어를 따라 직접 그렸다:
 *   - 24x24 그리드, 스트로크 기반(면 채움 거의 없음)
 *   - stroke-width 1.8, linecap/linejoin = round
 *   - 기하학적이고 모서리가 살짝 둥근 형태
 *
 * 색은 상속된다(stroke="currentColor"). 크기는 size prop(px).
 *
 * ▸ 원본 SVG 파일로 교체하려면:
 *   여기 PATHS 의 해당 항목만 원본의 <path d="..."> 로 바꾸면 된다.
 *   사용처(IconName)는 그대로 두면 되므로 컴포넌트는 손댈 필요 없다.
 */

export type IconName =
  | 'plus'
  | 'close'
  | 'check'
  | 'pin'
  | 'trash'
  | 'star'
  | 'download'
  | 'copy'
  | 'expand'
  | 'collapse'
  | 'clockAnalog'
  | 'clockDigital'
  | 'briefcase'
  | 'users'
  | 'coffee'
  | 'book'
  | 'edit'

/** 각 아이콘의 그리기 내용. 24x24 viewBox 기준. */
const PATHS: Record<IconName, React.JSX.Element> = {
  plus: <path d="M12 5v14M5 12h14" />,

  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,

  check: <path d="M4.5 12.5l5 5 10-11" />,

  // 기록 = 핀. 앱의 상징이라 다른 아이콘보다 조금 더 또렷하게.
  pin: (
    <>
      <path d="M12 21.5s7.2-6.6 7.2-11.4A7.2 7.2 0 004.8 10.1C4.8 14.9 12 21.5 12 21.5z" />
      <circle cx="12" cy="10" r="2.7" />
    </>
  ),

  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.4A1.4 1.4 0 0110.9 4h2.2a1.4 1.4 0 011.4 1.4V7" />
      <path d="M6.5 7l.9 12.2A1.8 1.8 0 009.2 21h5.6a1.8 1.8 0 001.8-1.8L17.5 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </>
  ),

  // '선택과 집중' 표시. 시트의 별처럼 모서리를 둥글게.
  star: (
    <path d="M12 3.6l2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 10l6-.9L12 3.6z" />
  ),

  download: (
    <>
      <path d="M12 4v10.5" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19.5h14" />
    </>
  ),

  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.6" />
      <path d="M15 9V6.6A2.6 2.6 0 0012.4 4H6.6A2.6 2.6 0 004 6.6v5.8A2.6 2.6 0 006.6 15H9" />
    </>
  ),

  // 미니 → 메인 (펼치기)
  expand: (
    <>
      <path d="M14 4h6v6M10 20H4v-6" />
      <path d="M20 4l-7 7M4 20l7-7" />
    </>
  ),

  // 메인 → 미니 (접기)
  collapse: (
    <>
      <path d="M10 4v6H4M14 20v-6h6" />
      <path d="M4 4l6 6M20 20l-6-6" />
    </>
  ),

  clockAnalog: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),

  clockDigital: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M7.5 10v4M16.5 10v4" />
      <circle cx="12" cy="10.6" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.4" r="0.85" fill="currentColor" stroke="none" />
    </>
  ),

  // 프리셋: 업무
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2.4" />
      <path d="M8.8 7.5V6a2 2 0 012-2h2.4a2 2 0 012 2v1.5" />
      <path d="M3 13h18" />
    </>
  ),

  // 프리셋: 회의
  users: (
    <>
      <circle cx="9.2" cy="8.4" r="3.4" />
      <path d="M3 19.6c0-3.2 2.8-5.2 6.2-5.2s6.2 2 6.2 5.2" />
      <path d="M16.4 5.4a3.2 3.2 0 010 6.2" />
      <path d="M17.6 14.8c2.1.6 3.4 2.3 3.4 4.8" />
    </>
  ),

  // 프리셋: 휴식
  coffee: (
    <>
      <path d="M4 8.8h12.5v5.4a5 5 0 01-5 5H9a5 5 0 01-5-5V8.8z" />
      <path d="M16.5 10.2h1.9a2.6 2.6 0 010 5.2h-1.9" />
      <path d="M8 5.6V4M11.5 5.6V4" />
    </>
  ),

  // 프리셋: 개인공부
  book: (
    <>
      <path d="M5 5.2A2.2 2.2 0 017.2 3H19v14.4H7.2A2.2 2.2 0 005 19.6V5.2z" />
      <path d="M5 19.6A2.2 2.2 0 017.2 17.4H19V21H7.2A2.2 2.2 0 015 18.8" />
      <path d="M9 7.6h6" />
    </>
  ),

  edit: (
    <>
      <path d="M4 20h4.2L19.4 8.8a2.1 2.1 0 00-3-3L5.2 17V20z" />
      <path d="M14.8 6.4l2.8 2.8" />
    </>
  )
}

interface Props {
  name: IconName
  /** px. 기본 18 — 본문 텍스트 옆에 놓았을 때 어울리는 크기 */
  size?: number
  className?: string
  strokeWidth?: number
  /** 색을 CSS 변수로 줄 때 쓴다 (활동 색처럼 유틸리티로 표현할 수 없는 경우) */
  style?: React.CSSProperties
}

export function Icon({
  name,
  size = 18,
  className = '',
  strokeWidth = 1.8,
  style
}: Props): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      // 아이콘은 장식이다. 의미는 옆의 텍스트나 aria-label 이 전달한다.
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      style={style}
    >
      {PATHS[name]}
    </svg>
  )
}
