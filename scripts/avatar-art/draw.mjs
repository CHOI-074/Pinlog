/**
 * 픽셀 스프라이트를 '그리는' 작은 도구 모음.
 *
 * 32×40 격자에 글자 하나 = 픽셀 하나. 큰 형태는 타원·사각형으로 잡고,
 * 작은 디테일(책갈피, 리본, 연필 끝)은 stamp 로 손그림 조각을 찍는다.
 * 1,000칸이 넘는 격자를 손으로 치면 형태가 금방 삐뚤어진다.
 */

export const W = 32
export const H = 40

export const blank = () => Array.from({ length: H }, () => Array(W).fill('.'))

export const inBounds = (x, y) => x >= 0 && x < W && y >= 0 && y < H

export function put(g, x, y, ch) {
  if (inBounds(x, y)) g[y][x] = ch
}

export const at = (g, x, y) => (inBounds(x, y) ? g[y][x] : '.')

export function rect(g, x0, y0, x1, y1, ch, only) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (inBounds(x, y) && (!only || only.includes(g[y][x]))) g[y][x] = ch
}

export const inEllipse = (x, y, cx, cy, rx, ry) =>
  ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1

export function ellipse(g, cx, cy, rx, ry, ch, only) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (inEllipse(x, y, cx, cy, rx, ry) && (!only || only.includes(g[y][x]))) g[y][x] = ch
}

/** 손그림 조각을 찍는다. '.' 은 건너뛴다(아래 그림을 지우지 않는다). */
export function stamp(g, x0, y0, lines) {
  lines.forEach((line, dy) => {
    ;[...line].forEach((ch, dx) => {
      if (ch !== '.') put(g, x0 + dx, y0 + dy, ch)
    })
  })
}

/** 가로·세로 대칭 조각 — 왼쪽 것을 그리면 오른쪽은 좌우를 뒤집어 찍는다 */
export const flip = (lines) => lines.map((l) => [...l].reverse().join(''))

/**
 * 실루엣 바깥 1칸에 외곽선을 두른다.
 *
 * `under` 를 주면, 외곽선이 그 격자(아래 레이어)의 칠해진 칸 위에 떨어질 때
 * 대신 `underCh` 를 쓴다. 머리카락이 얼굴 위에 얹히는 경계가 새까만 선이 되면
 * 스티커를 붙인 것처럼 보인다 — 레퍼런스는 그 자리를 머리의 어두운 톤으로 처리한다.
 */
export function outline(g, { ch = 'O', under = null, underCh = 'd', skip = ['G'] } = {}) {
  const src = g.map((r) => r.slice())
  const filled = (x, y) => inBounds(x, y) && src[y][x] !== '.' && !skip.includes(src[y][x])
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (filled(x, y)) continue
      if (!(filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1))) continue
      const onTop = under && under[y][x] !== '.' && under[y][x] !== 'G'
      g[y][x] = onTop ? underCh : ch
    }
}

/** 글자 바꾸기 (예: 가디건 → 스웨터) */
export function remap(g, table) {
  return g.map((r) => r.map((c) => table[c] ?? c))
}

/** 빈 줄을 잘라 { top, rows } 로. 앱의 Sprite 형식과 같다. */
export function toSprite(g) {
  let top = 0
  while (top < H && g[top].every((c) => c === '.')) top++
  let bottom = H - 1
  while (bottom > top && g[bottom].every((c) => c === '.')) bottom--
  if (top >= H) return { top: 0, rows: [] }
  return { top, rows: g.slice(top, bottom + 1).map((r) => r.join('')) }
}

/** 스프라이트를 다시 격자로 (다른 레이어가 '아래에 무엇이 있나'를 알아야 할 때) */
export function fromSprite(s) {
  const g = blank()
  s.rows.forEach((row, i) => [...row].forEach((c, x) => put(g, x, s.top + i, c)))
  return g
}

/** 여러 격자를 겹친다 (뒤 → 앞) */
export function compose(...grids) {
  const g = blank()
  for (const src of grids)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (src[y][x] !== '.') g[y][x] = src[y][x]
  return g
}
