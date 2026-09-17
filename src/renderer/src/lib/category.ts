import { DEFAULT_PRESETS, type Pin } from '@shared/types'

/**
 * 활동 색.
 *
 * 예전에는 모든 기록이 같은 파란 점이었다. 타임라인을 훑어도 '무엇을 했는지'가
 * 글자를 읽기 전에는 보이지 않았고, 하루 띠는 파란 막대의 나열이었다.
 * 색을 나누면 하루의 구성(회의만 가득한 날, 업무와 휴식이 번갈아 온 날)이
 * 읽기 전에 보인다.
 *
 * 실제 색값은 index.css 의 --c-cat-* 에 있다. 여기서 hex 를 들고 있으면
 * 다크 모드에서 같은 색을 그대로 써서 탁해진다.
 */

const PRESET_TAGS = new Set(DEFAULT_PRESETS.map((p) => p.tag))

/** 프리셋에 없는 태그들이 나눠 갖는 색 */
const EXTRA = ['a', 'b', 'c', 'd'] as const

/**
 * 태그 → 색.
 *
 * 프리셋은 고정 색이다. 직접 만든 태그는 문자열 해시로 EXTRA 중 하나를 받는다 —
 * 무작위가 아니라 해시인 게 중요하다. 같은 태그는 언제 어디서 봐도 같은 색이어야
 * 색이 정보가 된다. (저장소에 색을 따로 기록할 필요도 없어진다)
 */
export function tagColor(tag: string): string {
  if (PRESET_TAGS.has(tag)) return `var(--c-cat-${tag})`
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return `var(--c-cat-${EXTRA[h % EXTRA.length]})`
}

/**
 * 기록 하나를 대표하는 색.
 *
 * 태그가 여럿이면 프리셋 태그를 먼저 찾는다. '#work #회고' 는 업무 색이어야지
 * 회고가 받은 색이면 안 된다 — 프리셋이 그 기록의 큰 분류이기 때문이다.
 */
export function pinColor(pin: Pin): string {
  const preset = pin.tags.find((t) => PRESET_TAGS.has(t))
  const tag = preset ?? pin.tags[0]
  return tag ? tagColor(tag) : 'var(--c-cat-none)'
}
