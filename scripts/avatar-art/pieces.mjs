/**
 * 핀로그 캐릭터 조각들 — 컨셉 01 (MAIN · 파란 가디건) 기준.
 *
 * 격자 32×40. 모든 조각이 같은 좌표계를 쓴다:
 *   머리통    5~19줄 (얼굴 중심 12줄, 눈 12~14줄, 볼 15줄, 입 16줄)
 *   목·옷깃   18~21줄
 *   몸통      20~30줄, 팔 21~30줄 (손 29~30줄)
 *   바지      31~35줄, 신발 36~37줄, 바닥 그림자 38~39줄
 *
 * 글자 → 역할 (색은 avatar.ts 의 팔레트가 정한다)
 *   O 외곽선   G 바닥 그림자
 *   S s 피부·그늘   B 볼   E 눈   M 입
 *   H h d 머리카락 (기본·빛·그늘)
 *   C c K 옷 (기본·빛·그늘)   k 가디건 여밈   i 시보리(밑단·소매)
 *   T t 안의 셔츠   U 셔츠 깃   Y 책갈피 핀
 *   P p 바지   W w 신발
 */
import {
  blank, rect, ellipse, stamp, flip, put, at, outline, remap, compose, inEllipse, W, H
} from './draw.mjs'

/* ── 기준 도형 ─────────────────────────────────────────────── */

export const FACE = { cx: 16, cy: 12.4, rx: 8.6, ry: 7.2 }
const inFace = (x, y) => inEllipse(x, y, FACE.cx, FACE.cy, FACE.rx, FACE.ry)

/* ── 머리통 ─────────────────────────────────────────────────── */

export function head() {
  const g = blank()
  ellipse(g, FACE.cx, FACE.cy, FACE.rx, FACE.ry, 'S')
  // 귀 — 옆머리 사이로 살짝 보인다
  stamp(g, 6, 12, ['SS', 'sS', 'SS'])
  stamp(g, 24, 12, flip(['SS', 'sS', 'SS']))
  // 턱 아래 그늘
  rect(g, 11, 19, 20, 19, 's', ['S'])
  // 이목구비 — 작은 점눈, 간격은 넉넉히 (큰 애니메 눈 금지)
  rect(g, 11, 12, 12, 14, 'E')
  rect(g, 19, 12, 20, 14, 'E')
  rect(g, 9, 15, 10, 15, 'B')
  rect(g, 21, 15, 22, 15, 'B')
  rect(g, 15, 16, 16, 16, 'M')
  outline(g)
  return g
}

/* ── 몸 (서 있는 모습) ─────────────────────────────────────── */

export function bodyStand() {
  const g = blank()

  // 세로 배분: 몸통 20~28 · 바지 29~35 · 신발 36~37 · 그림자 38~39
  // 처음엔 몸통이 30줄까지 내려와 다리가 5줄뿐이었고, 캐릭터가 뭉툭해 보였다.

  // 바닥 그림자
  ellipse(g, 16, 38.9, 10.5, 1.25, 'G')

  // 신발
  rect(g, 9, 36, 14, 37, 'W'); rect(g, 17, 36, 22, 37, 'W')
  rect(g, 9, 37, 14, 37, 'w'); rect(g, 17, 37, 22, 37, 'w')

  // 바지 — 두 다리 사이를 비우면 양쪽 외곽선이 겹쳐 굵은 검은 막대가 된다.
  // 한 덩어리로 칠하고 가운데 주름만 어둡게 넣는다.
  rect(g, 10, 29, 21, 35, 'P')
  rect(g, 15, 32, 16, 35, 'p'); rect(g, 21, 30, 21, 35, 'p')

  // 목
  rect(g, 14, 18, 17, 20, 'S')
  rect(g, 14, 19, 17, 20, 's')

  // 몸통 (살짝 오버핏)
  rect(g, 11, 20, 20, 20, 'C')
  rect(g, 9, 21, 22, 27, 'C')
  rect(g, 9, 28, 22, 28, 'i')

  // 소매·팔 — 어깨는 둥글게
  rect(g, 7, 21, 8, 21, 'C'); rect(g, 23, 21, 24, 21, 'C')
  rect(g, 6, 22, 8, 26, 'C'); rect(g, 23, 22, 25, 26, 'C')
  rect(g, 6, 22, 6, 26, 'K'); rect(g, 25, 22, 25, 26, 'K')      // 소매 바깥 그늘
  rect(g, 9, 23, 9, 27, 'K'); rect(g, 22, 23, 22, 27, 'K')      // 팔과 몸통 경계
  rect(g, 6, 27, 8, 27, 'i'); rect(g, 23, 27, 25, 27, 'i')      // 소매 시보리
  // 손은 골반 높이 — 팔이 짧으면 인형처럼 굳어 보인다
  rect(g, 6, 28, 8, 29, 'S'); rect(g, 23, 28, 25, 29, 'S')
  rect(g, 6, 29, 8, 29, 's'); rect(g, 23, 29, 25, 29, 's')

  // 어깨 빛
  stamp(g, 10, 21, ['cc', 'c.'])
  stamp(g, 7, 22, ['c', 'c'])

  // 안의 셔츠 + 여밈
  rect(g, 14, 21, 17, 28, 'T')
  rect(g, 14, 25, 17, 28, 't')
  rect(g, 13, 21, 13, 28, 'k'); rect(g, 18, 21, 18, 28, 'k')
  rect(g, 10, 25, 11, 25, 'k'); rect(g, 20, 25, 21, 25, 'k')   // 주머니 트임

  // 셔츠 깃
  stamp(g, 12, 20, ['UUU', '.UU'])
  stamp(g, 17, 20, ['UUU', 'UU.'])

  // 책갈피 핀 — 작게. 3칸 폭에 홈을 파면 이빨처럼 보인다
  rect(g, 19, 22, 20, 24, 'Y')

  outline(g)
  return g
}

/** 같은 몸에 스웨터 입히기 — 가디건의 여밈·안 셔츠를 옷감으로 덮는다 */
export const sweater = (g) => remap(g, { T: 'C', t: 'C', k: 'C' })

/* ── 머리카락 ──────────────────────────────────────────────── */

/** 얼굴 창을 판다: 얼굴 타원 안이면서 앞머리 선 아래인 칸을 비운다 */
function carveFace(g, fringe, { x0 = 8, x1 = 23 } = {}) {
  for (let y = 0; y < H; y++)
    for (let x = x0; x <= x1; x++) if (inFace(x, y) && y > fringe(x)) g[y][x] = '.'
}

/** 머리 아래쪽 경계에 그늘 한 줄 */
function shadeBottom(g, xs) {
  for (const x of xs)
    for (let y = H - 1; y >= 0; y--)
      if (g[y][x] === 'H') {
        g[y][x] = 'd'
        break
      }
}

const tone = (g, pts, ch) => pts.forEach(([x, y]) => at(g, x, y) === 'H' && put(g, x, y, ch))

/** MAIN — 폭신한 짧은 머리, 한쪽으로 넘긴 앞머리 */
export function hairShort(headG) {
  const g = blank()
  ellipse(g, 16, 8.4, 11.0, 7.4, 'H')
  // 옆머리 — 귀 앞으로 내려오는 뭉치
  stamp(g, 6, 10, ['HHH', 'HHH', '.HH', '.HH', '..H'])
  stamp(g, 23, 10, flip(['HHH', 'HHH', '.HH', '.HH', '..H']))

  // 앞머리: 왼쪽은 눈썹 위까지 덮고, 오른쪽 가르마(19열)에서 이마가 보인다.
  // 눈(11~12열, 12줄~) 바로 위 뭉치는 10줄에서 멈춘다 — 11줄까지 내리면 그 아래
  // 그늘 한 칸이 왼쪽 눈의 모서리를 덮어, 밝은 머리색일 때 눈에 색이 묻는다.
  const F = { 8: 11, 9: 11, 10: 10, 11: 10, 12: 10, 13: 9, 14: 10, 15: 9, 16: 8, 17: 8,
              18: 7, 19: 6, 20: 7, 21: 8, 22: 9, 23: 10 }
  carveFace(g, (x) => F[x] ?? 11)

  // 삐침 — 몇 개만, 방향 있게
  stamp(g, 15, 0, ['.HH', 'HH.'])
  stamp(g, 6, 4, ['HH', 'HH'])
  stamp(g, 24, 4, ['HH', 'HH'])

  // 명암
  tone(g, [[8, 7], [9, 6], [10, 5], [11, 4], [12, 4], [13, 3], [19, 3], [20, 3], [21, 4], [22, 5],
    [14, 6], [15, 5], [23, 7], [24, 8]], 'h')
  shadeBottom(g, [8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23])
  tone(g, [[7, 13], [8, 14], [24, 13], [23, 14], [17, 7], [18, 6]], 'd')

  outline(g, { under: headG })
  return { front: g }
}

/** 단발 — 일자 앞머리, 턱선까지 떨어지는 옆머리 */
export function hairBob(headG) {
  const g = blank()
  ellipse(g, 16, 10.4, 10.4, 8.4, 'H')
  rect(g, 6, 11, 8, 17, 'H'); rect(g, 23, 11, 25, 17, 'H')
  // 끝이 턱선에서 안으로 모인다
  stamp(g, 7, 18, ['HH']); stamp(g, 23, 18, ['HH'])

  const F = { 9: 10, 10: 10, 11: 10, 12: 10, 13: 8, 14: 10, 15: 10, 16: 10, 17: 10, 18: 10,
              19: 8, 20: 10, 21: 10, 22: 10 }
  carveFace(g, (x) => F[x] ?? 10, { x0: 9, x1: 22 })

  // 윤기 띠
  tone(g, [[9, 5], [10, 4], [11, 4], [12, 3], [13, 3], [18, 3], [19, 3], [20, 4], [21, 4], [22, 5],
    [7, 9], [7, 10], [24, 9], [24, 10]], 'h')
  shadeBottom(g, [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22])
  tone(g, [[8, 16], [8, 17], [23, 16], [23, 17], [7, 18], [24, 18]], 'd')

  outline(g, { under: headG })
  return { front: g }
}

/** 곱슬 — 작은 뭉치들이 모여 둥근 실루엣을 만든다 */
export function hairCurly(headG) {
  const g = blank()
  ellipse(g, 16, 8.6, 10.2, 6.6, 'H')
  const curls = [[6.5, 10], [7.5, 6], [10.5, 3.2], [14.5, 2.2], [18.5, 2.4], [22, 3.6], [24.8, 6.5],
    [25.6, 10.4], [6.2, 14], [25.8, 14]]
  for (const [cx, cy] of curls) ellipse(g, cx, cy, 3.1, 2.9, 'H')
  // 이마로 내려오는 작은 컬 셋
  for (const [cx, cy] of [[11, 9.2], [15.5, 8.4], [20.5, 9.0]]) ellipse(g, cx, cy, 2.3, 2.1, 'H')

  carveFace(g, (x) => ({ 9: 9, 10: 10, 11: 10, 12: 10, 13: 9, 14: 9, 15: 9, 16: 9, 17: 9, 18: 8,
    19: 9, 20: 10, 21: 10, 22: 9 })[x] ?? 9, { x0: 9, x1: 22 })

  // 뭉치마다 왼쪽 위 빛, 아래 그늘 — 곱슬의 입체감
  for (const [cx, cy] of curls) {
    tone(g, [[Math.round(cx - 1), Math.round(cy - 2)], [Math.round(cx), Math.round(cy - 2)]], 'h')
    tone(g, [[Math.round(cx), Math.round(cy + 1)], [Math.round(cx + 1), Math.round(cy + 1)]], 'd')
  }
  shadeBottom(g, [10, 11, 12, 15, 16, 20, 21])

  outline(g, { under: headG })
  return { front: g }
}

/** 긴 웨이브 — 앞머리는 가운데 가르마, 뒷머리는 어깨 뒤로 길게 */
export function hairLong(headG) {
  const front = blank()
  ellipse(front, 16, 9.6, 11.2, 8.2, 'H')
  // 얼굴 양옆으로 흘러내리는 머리 — 어깨 위까지
  for (let y = 10; y <= 23; y++) {
    const wave = Math.round(Math.sin(y / 1.8))
    rect(front, 5 + wave, y, 8 + wave, y, 'H')
    rect(front, 23 - wave, y, 26 - wave, y, 'H')
  }
  carveFace(front, (x) => ({ 9: 12, 10: 11, 11: 10, 12: 9, 13: 8, 14: 7, 15: 6, 16: 6, 17: 7, 18: 8,
    19: 9, 20: 10, 21: 11, 22: 12 })[x] ?? 12, { x0: 9, x1: 22 })
  tone(front, [[9, 5], [10, 4], [11, 3], [20, 3], [21, 4], [22, 5], [6, 14], [6, 18], [25, 15], [25, 19]], 'h')
  tone(front, [[8, 12], [23, 12], [7, 22], [24, 22], [8, 16], [23, 16], [15, 5], [16, 5]], 'd')
  outline(front, { under: headG })

  // 뒷머리 — 몸 뒤에 깔린다. 대부분 몸·머리에 가려지고 가장자리만 보인다
  const back = blank()
  for (let y = 12; y <= 29; y++) {
    const wave = Math.round(Math.sin(y / 2.1))
    const taper = Math.max(0, y - 26)      // 끝으로 갈수록 모인다
    rect(back, 4 + wave + taper, y, 27 - wave - taper, y, 'H')
  }
  tone(back, [[4, 20], [5, 26], [27, 22], [26, 28]], 'h')
  tone(back, [[5, 29], [6, 30], [26, 30], [25, 29]], 'd')
  outline(back)
  return { back, front }
}

/* ── 안경 ──────────────────────────────────────────────────── */

/** 동그란 금테 — 선글라스와 같은 폭(옆머리 위로 다리가 지나간다), 알은 비워 눈이 보인다 */
export function glassesRound() {
  const g = blank()
  const ring = ['.gggg.', 'g....g', 'g....g', 'g....g', '.gggg.']
  stamp(g, 9, 11, ring)
  stamp(g, 17, 11, ring)
  rect(g, 15, 12, 16, 12, 'g')        // 브리지
  rect(g, 6, 12, 8, 12, 'g')          // 다리
  rect(g, 23, 12, 25, 12, 'g')
  return g
}

/** 포니테일 — 앞은 단정히 넘기고, 꽁지는 머리 뒤 오른쪽으로 떨어진다 */
export function hairPonytail(headG) {
  const front = blank()
  ellipse(front, 16, 8.8, 10.6, 7.4, 'H')
  stamp(front, 6, 10, ['HHH', 'HHH', '.HH', '..H'])
  stamp(front, 23, 10, flip(['HHH', 'HHH', '.HH', '..H']))
  const F = { 8: 10, 9: 10, 10: 9, 11: 9, 12: 8, 13: 8, 14: 7, 15: 7, 16: 7, 17: 8, 18: 8, 19: 9,
              20: 9, 21: 10, 22: 10, 23: 10 }
  carveFace(front, (x) => F[x] ?? 10)
  tone(front, [[9, 5], [10, 4], [11, 3], [12, 3], [19, 3], [20, 4], [21, 4], [22, 5]], 'h')
  shadeBottom(front, [9, 10, 11, 12, 13, 18, 19, 20, 21, 22])
  // 머리끈
  rect(front, 24, 7, 25, 8, 'Y')
  outline(front, { under: headG })

  const back = blank()
  // 꽁지 — 끈에서 시작해 오른쪽 아래로 흔들리며 가늘어진다
  const tail = [[26, 7, 3], [27, 9, 3], [28, 11, 3], [28, 13, 3], [28, 15, 2], [27, 17, 2], [27, 19, 1]]
  for (const [cx, cy, r] of tail) ellipse(back, cx, cy, r, 1.6, 'H')
  tone(back, [[27, 9], [28, 12]], 'h')
  tone(back, [[28, 16], [27, 18]], 'd')
  outline(back)
  return { back, front }
}

/** 양갈래 — 가운데 가르마, 귀 아래로 묶은 두 갈래가 어깨 뒤로 내려온다 */
export function hairTwin(headG) {
  const front = blank()
  ellipse(front, 16, 9.0, 10.8, 7.6, 'H')
  stamp(front, 6, 10, ['HHH', 'HHH', 'HHH', '.HH'])
  stamp(front, 23, 10, flip(['HHH', 'HHH', 'HHH', '.HH']))
  const F = { 8: 11, 9: 10, 10: 10, 11: 9, 12: 9, 13: 8, 14: 8, 15: 6, 16: 6, 17: 8, 18: 8, 19: 9,
              20: 9, 21: 10, 22: 10, 23: 11 }
  carveFace(front, (x) => F[x] ?? 11)
  tone(front, [[9, 5], [10, 4], [11, 3], [20, 3], [21, 4], [22, 5]], 'h')
  shadeBottom(front, [9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22])
  rect(front, 5, 13, 6, 14, 'Y'); rect(front, 25, 13, 26, 14, 'Y')   // 머리끈
  outline(front, { under: headG })

  const back = blank()
  for (let y = 14; y <= 27; y++) {
    const w = y < 24 ? 2 : 1
    const sway = Math.round(0.8 * Math.sin(y / 2.4))
    rect(back, 3 - sway, y, 3 - sway + w, y, 'H')
    rect(back, 27 + sway, y, 27 + sway + w, y, 'H')
  }
  tone(back, [[3, 16], [28, 17]], 'h')
  tone(back, [[3, 25], [28, 26]], 'd')
  outline(back)
  return { back, front }
}

/** 뿔테 — 동그란 안경과 같은 폭, 두꺼운 어두운 테 */
export function glassesSquare() {
  const g = blank()
  const frame = ['xxxxxx', 'x....x', 'x....x', 'xxxxxx']
  stamp(g, 9, 11, frame)
  stamp(g, 17, 11, frame)
  rect(g, 15, 12, 16, 12, 'x')
  rect(g, 6, 12, 8, 12, 'x')
  rect(g, 23, 12, 25, 12, 'x')
  return g
}

/**
 * 선글라스 — 새까만 렌즈. 얼굴보다 한 칸씩 넓어 옆머리를 덮는다.
 * 렌즈마다 흰 반사 한 칸 — 없으면 눈가리개로 읽힌다.
 * 콧대 자리(아래쪽 가운데)는 비워 알 두 개로 보이게 한다.
 */
export function glassesSun() {
  const g = blank()
  rect(g, 6, 11, 25, 11, 'z')
  const lens = ['zzzzzzz', 'zzzzzzz', '.zzzzz.']
  stamp(g, 8, 12, lens)
  stamp(g, 17, 12, lens)
  rect(g, 6, 12, 7, 12, 'z'); rect(g, 24, 12, 25, 12, 'z')
  put(g, 9, 12, 'I'); put(g, 18, 12, 'I')
  return g
}

/* ── 모자 — 머리카락을 '덮어야' 한다 (위에 얹으면 붕 뜬다) ───────── */

/**
 * 캡모자 — 챙이 오른쪽으로 비껴 나온다.
 * 처음엔 정면에서 본 넓은 챙 띠를 이마에 둘렀는데, 경찰 모자처럼 읽혔다.
 * 챙을 한쪽으로 빼야 '야구모자' 실루엣이 된다.
 */
export function hatCap() {
  const g = blank()
  ellipse(g, 15.5, 7.4, 10.6, 6.6, 'A')
  rect(g, 0, 8, W - 1, H - 1, '.', ['A'])     // 아래는 잘라 이마를 가리지 않는다
  rect(g, 5, 7, 16, 7, 'a')                   // 머리띠 선
  rect(g, 15, 7, 30, 7, 'a')                  // 챙
  rect(g, 18, 8, 29, 8, 'a')
  rect(g, 15, 2, 15, 6, 'a')                  // 이음선
  stamp(g, 9, 3, ['cc', 'c.'])                // 윗면 빛
  put(g, 15, 1, 'Y')                          // 꼭지 단추
  rect(g, 11, 4, 12, 5, 'Y')                  // 책갈피 로고
  outline(g)
  return g
}

export function hatRibbon() {
  const g = blank()
  stamp(g, 18, 1, [
    '.QQ.QQ.',
    'QqQQQqQ',
    'QQQqQQQ',
    '.Q...Q.'
  ])
  outline(g)
  return g
}

export function hatBeanie() {
  const g = blank()
  ellipse(g, 16, 6.6, 10.8, 5.8, 'N')
  rect(g, 5, 7, 26, 9, 'n')                   // 접은 단
  for (let x = 6; x <= 25; x += 2) rect(g, x, 7, x, 9, 'N')   // 골지
  stamp(g, 9, 3, ['..N', '.NN'])
  ellipse(g, 16, 0.9, 2.2, 1.4, 'T')           // 방울
  outline(g)
  return g
}

export function hatCrown() {
  const g = blank()
  stamp(g, 11, 0, [
    'V....V....',
    'VV..VVV..V',
    'VVVVVVVVVV',
    'VXVVVXVVXV',
    'vvvvvvvvvv'
  ])
  outline(g)
  return g
}

/* ── 소품 — 서 있는 자세의 손(28~29줄)에 쥔다 ───────────────── */

/** DAILY — 왼손에 노란 연필, 오른손에 갈색 노트 */
export function propPen() {
  const g = blank()
  // 연필 (위가 뾰족)
  put(g, 6, 19, 'E')
  rect(g, 5, 20, 7, 20, 'T')
  rect(g, 5, 21, 7, 28, 'Y')
  rect(g, 7, 21, 7, 28, 'v')
  rect(g, 5, 29, 7, 29, 'Q')
  // 노트
  rect(g, 22, 23, 28, 30, 'R')
  rect(g, 22, 23, 22, 30, 'r')
  rect(g, 28, 24, 28, 29, 'T')                 // 종이 단면
  rect(g, 25, 22, 25, 25, 'A')                 // 책갈피 끈
  outline(g)
  return g
}

/** BREAK — 오른손에 크림색 머그 */
export function propMug() {
  const g = blank()
  rect(g, 22, 23, 27, 30, 'T')
  rect(g, 22, 29, 27, 30, 't')
  rect(g, 22, 23, 27, 23, 't')                 // 입구 그늘
  stamp(g, 28, 24, ['TT', '.T', '.T', 'TT'])    // 손잡이
  rect(g, 24, 25, 25, 27, 'A')                 // 책갈피 로고
  outline(g)
  return g
}

/** 화분 — 왼손에 든 작은 화분 */
export function propPlant() {
  const g = blank()
  stamp(g, 2, 19, [
    '..N.N.',
    '.NNNNn',
    'NNnNNN',
    '.NNNn.',
    '..nN..'
  ])
  rect(g, 2, 24, 8, 25, 'R')
  rect(g, 3, 26, 7, 30, 'R')
  rect(g, 3, 26, 3, 30, 'r')
  rect(g, 2, 25, 8, 25, 'r')
  outline(g)
  return g
}

/* ── 배경 — 몸 뒤에 깐다. 실루엣(6~25열) 밖을 주로 쓴다 ───────── */

const sparkle = ['.V.', 'VVV', '.V.']

export function sceneStars() {
  const g = blank()
  for (const [x, y] of [[1, 3], [27, 5], [28, 18], [0, 16], [27, 30], [2, 29]]) stamp(g, x, y, sparkle)
  for (const [x, y] of [[5, 1], [30, 11], [3, 23], [29, 25]]) put(g, x, y, 'V')
  return g
}

export function sceneSunrise() {
  const g = blank()
  ellipse(g, 27, 5.5, 4.6, 4.6, 'V')
  ellipse(g, 27, 5.5, 4.6, 4.6, 'v', ['V'])
  ellipse(g, 26.5, 5, 3.6, 3.6, 'V')
  // 구름 두 조각
  stamp(g, 0, 14, ['.ll...', 'llllll'])
  stamp(g, 26, 22, ['..ll..', 'llllll'])
  return g
}

export function sceneParty() {
  const g = blank()
  const bits = [
    [2, 2, 'A'], [7, 1, 'Q'], [27, 2, 'N'], [30, 7, 'V'], [1, 9, 'V'], [29, 14, 'Q'],
    [0, 20, 'N'], [30, 22, 'A'], [3, 27, 'Q'], [28, 29, 'V'], [4, 14, 'A'], [26, 12, 'N']
  ]
  for (const [x, y, c] of bits) rect(g, x, y, x + 1, y, c)
  for (const [x, y, c] of [[12, 0, 'V'], [20, 1, 'A'], [1, 33, 'N'], [30, 34, 'Q']]) put(g, x, y, c)
  return g
}

/* ── 컨셉(자세) ────────────────────────────────────────────── */

/** 직장인 — 서 있는 몸을 정장으로. 넥타이는 고른 상의 색(C)이다 */
export function bodyOffice() {
  const g = remap(bodyStand(), {
    C: 'J', c: 'J', K: 'j', k: 'j', i: 'j', T: 'U', t: 'U', Y: 'J', P: 'J', p: 'j', W: 'R', w: 'r'
  })
  // 재킷 라펠 — 셔츠가 V 로 보인다
  stamp(g, 13, 21, ['jUUUUj', 'jUUUUj', '.jUUj.', '.jUUj.', '..jj..'])
  // 넥타이
  rect(g, 15, 21, 16, 21, 'K')
  rect(g, 15, 22, 16, 25, 'C')
  put(g, 15, 26, 'C'); put(g, 16, 26, 'C')
  return g
}

/**
 * FOCUS — 책상 앞. 얼굴은 가리지 않는다(노트북은 왼쪽에).
 * 머리 위치는 서 있는 자세와 같게 둬서 머리카락·안경·모자를 그대로 쓴다.
 */
export function bodyDesk() {
  const g = blank()
  ellipse(g, 16, 38.9, 14, 1.25, 'G')

  // 의자 등받이 — 몸 뒤, 오른쪽으로 살짝 보인다
  rect(g, 24, 22, 27, 31, 'r')
  rect(g, 25, 23, 26, 30, 'R')

  // 목·몸통 (책상 위로 보이는 만큼)
  rect(g, 14, 18, 17, 20, 'S'); rect(g, 14, 19, 17, 20, 's')
  rect(g, 11, 20, 20, 20, 'C')
  rect(g, 9, 21, 22, 27, 'C')
  rect(g, 6, 22, 8, 25, 'C'); rect(g, 23, 22, 25, 25, 'C')
  rect(g, 7, 21, 8, 21, 'C'); rect(g, 23, 21, 24, 21, 'C')
  rect(g, 6, 22, 6, 25, 'K'); rect(g, 25, 22, 25, 25, 'K')
  // 팔이 앞으로 — 소매가 책상 위로 모인다
  rect(g, 7, 26, 11, 27, 'C'); rect(g, 20, 26, 24, 27, 'C')
  rect(g, 7, 27, 11, 27, 'K'); rect(g, 20, 27, 24, 27, 'K')
  rect(g, 12, 27, 13, 27, 'S'); rect(g, 18, 27, 19, 27, 'S')    // 손
  rect(g, 14, 21, 17, 27, 'T')
  rect(g, 13, 21, 13, 27, 'k'); rect(g, 18, 21, 18, 26, 'k')
  stamp(g, 12, 20, ['UUU', '.UU']); stamp(g, 17, 20, ['UUU', 'UU.'])
  rect(g, 19, 22, 20, 24, 'Y')
  stamp(g, 10, 21, ['cc', 'c.'])

  // 책상 아래로 보이는 다리·신발
  rect(g, 11, 30, 20, 35, 'P'); rect(g, 15, 32, 16, 35, 'p')
  rect(g, 10, 36, 14, 37, 'W'); rect(g, 17, 36, 21, 37, 'W')
  rect(g, 10, 37, 14, 37, 'w'); rect(g, 17, 37, 21, 37, 'w')

  // 책상
  rect(g, 0, 28, 31, 28, 'R')
  rect(g, 0, 29, 31, 29, 'r')
  rect(g, 2, 30, 3, 37, 'r'); rect(g, 28, 30, 29, 37, 'r')

  // 노트북 — 뚜껑 뒷면이 보인다. 왼쪽에 두어 얼굴을 가리지 않는다
  rect(g, 1, 20, 10, 27, 'L')
  rect(g, 1, 20, 10, 20, 'l')
  rect(g, 1, 20, 1, 27, 'l')
  rect(g, 5, 23, 6, 24, 'I')                  // 로고
  rect(g, 0, 27, 12, 27, 'l')                 // 받침

  outline(g)
  return g
}

/* ══════════════════════════════════════════════════════════════
 * 리워드 상점 — 광고 리워드로 사는 것들
 *
 * 컨셉 05(별빛 기록가) · 06(비밀 정원) · 07(고양이) · 08(강아지) 시안을 옮겼다.
 * 좌표계는 위와 같다. 머리통 위치·손 위치를 바꾸지 않았기 때문에
 * 기존 안경·모자·소품이 동물 캐릭터와 새 옷 위에도 그대로 얹힌다.
 * ══════════════════════════════════════════════════════════════ */

/*
 * 동물 캐릭터 글자
 *   F f  털 · 줄무늬/귀 (종마다 색이 정해져 있다 — 사람 피부색을 따르지 않는다)
 *   Z    주둥이·가슴의 크림색
 * 몸 그림은 사람 것을 그대로 쓴다. 대신 캐릭터가 S s(손·목)와 W w(신발)를
 * 털색·발바닥색으로 덮어쓴다 — 손은 앞발, 신발은 뒷발이 된다.
 */

/** 07 고양이 — 뾰족한 세모 귀, 이마 줄무늬 셋, 크림 주둥이, 수염 */
export function catHead() {
  const g = blank()
  // 귀를 먼저 — 얼굴 타원이 귀 밑동을 덮어 자연스럽게 붙는다
  const ear = [
    'F....',
    'FF...',
    'FBF..',
    'FBBF.',
    'FBBBF'
  ]
  stamp(g, 7, 2, ear)
  stamp(g, 20, 2, flip(ear))
  ellipse(g, 16, 12.6, 9.2, 7.0, 'F')
  // 이마 줄무늬 — 가운데 길게, 양옆 짧게
  rect(g, 15, 6, 16, 8, 'f')
  rect(g, 12, 7, 12, 8, 'f'); rect(g, 19, 7, 19, 8, 'f')
  // 볼 줄무늬
  rect(g, 7, 13, 8, 13, 'f'); rect(g, 23, 13, 24, 13, 'f')
  // 크림 주둥이·턱
  ellipse(g, 16, 16.6, 4.4, 2.6, 'Z')
  rect(g, 11, 19, 20, 19, 'f', ['F'])
  // 이목구비 — 사람과 같은 자리
  rect(g, 11, 12, 12, 14, 'E')
  rect(g, 19, 12, 20, 14, 'E')
  rect(g, 9, 15, 10, 15, 'B'); rect(g, 21, 15, 22, 15, 'B')
  rect(g, 15, 15, 16, 15, 'Q')   // 분홍 코
  put(g, 14, 16, 'M'); put(g, 17, 16, 'M')
  rect(g, 15, 17, 16, 17, 'M')   // ω 입
  outline(g)
  // 수염 — 외곽선 밖으로 뻗는다 (외곽선을 두른 뒤에 그어야 굵어지지 않는다)
  rect(g, 3, 15, 5, 15, 'O'); rect(g, 26, 15, 28, 15, 'O')
  rect(g, 4, 17, 5, 17, 'O'); rect(g, 26, 17, 27, 17, 'O')
  return g
}

/** 고양이 꼬리 — 엉덩이 뒤에서 오른쪽으로 나와 위로 휜다. 몸 뒤에 깐다 */
export function catTail() {
  const g = blank()
  const path = [[21, 33], [23, 33], [24, 32], [25, 31], [26, 30], [27, 28], [27, 26], [27, 24], [26, 22]]
  for (const [x, y] of path) rect(g, x, y, x + 1, y + 1, 'F')
  // 줄무늬
  for (const [x, y] of [[24, 32], [26, 29], [27, 25]]) rect(g, x, y, x + 1, y, 'f')
  outline(g)
  return g
}

/** 08 강아지 — 길게 늘어진 귀, 이마의 크림 줄, 큰 까만 코 */
export function puppyHead() {
  const g = blank()
  ellipse(g, 16, 12.6, 8.8, 7.2, 'F')
  // 정수리 털뭉치
  stamp(g, 12, 4, ['.FF.FF', 'FFFFFF'])
  // 크림 줄 — 이마에서 주둥이로 넓어진다
  rect(g, 15, 6, 16, 12, 'Z')
  ellipse(g, 16, 16.4, 4.0, 2.8, 'Z')
  // 귀 — 얼굴 옆을 덮으며 턱선까지 늘어진다
  ellipse(g, 6.4, 13.2, 2.9, 6.4, 'f')
  ellipse(g, 25.6, 13.2, 2.9, 6.4, 'f')
  rect(g, 4, 17, 4, 19, 'r', ['f']); rect(g, 27, 17, 27, 19, 'r', ['f'])
  rect(g, 11, 12, 12, 14, 'E')
  rect(g, 19, 12, 20, 14, 'E')
  rect(g, 9, 16, 10, 16, 'B'); rect(g, 21, 16, 22, 16, 'B')
  // 단추 코 + 혀
  rect(g, 14, 15, 17, 15, 'E'); rect(g, 15, 16, 16, 16, 'E')
  rect(g, 15, 18, 16, 18, 'Q')
  put(g, 14, 17, 'M'); put(g, 17, 17, 'M')
  outline(g)
  return g
}

/** 강아지 꼬리 — 짧게 위로 말린다 */
export function puppyTail() {
  const g = blank()
  for (const [x, y] of [[21, 31], [23, 31], [24, 30], [25, 29], [26, 28], [26, 26]]) rect(g, x, y, x + 1, y + 1, 'F')
  rect(g, 26, 26, 27, 26, 'Z')
  outline(g)
  return g
}

/**
 * 05 별빛 기록가 — 남색 망토, 아이보리 셔츠, 반바지, 버클 부츠.
 * 옷 글자(C c K k i)의 색은 상점 아이템이 정한다: 남색 · 빛 · 그늘 · 금색 테 · 라일락 안감.
 */
export function bodyStar() {
  const g = blank()
  ellipse(g, 16, 38.9, 10.5, 1.25, 'G')

  // 부츠 — 금 버클
  rect(g, 9, 35, 14, 37, 'j'); rect(g, 17, 35, 22, 37, 'j')
  put(g, 12, 35, 'V'); put(g, 19, 35, 'V')
  // 반바지 + 무릎 아래 짧게 보이는 다리 + 양말 한 줄.
  // 양말을 세 줄로 두껍게 칠하면 흰 치마처럼 읽혔다.
  rect(g, 10, 29, 21, 32, 'P'); rect(g, 15, 30, 16, 32, 'p')
  rect(g, 11, 33, 14, 33, 'S'); rect(g, 17, 33, 20, 33, 'S')
  rect(g, 10, 34, 14, 34, 'T'); rect(g, 17, 34, 21, 34, 'T')

  // 목 · 셔츠 · 높은 깃
  rect(g, 14, 18, 17, 19, 'S'); rect(g, 14, 19, 17, 19, 's')
  rect(g, 12, 20, 19, 28, 'T'); rect(g, 12, 25, 19, 28, 't')
  stamp(g, 12, 19, ['UUUUUUUU'])
  // 셔츠 단추
  put(g, 15, 23, 't'); put(g, 16, 26, 'U')

  // 망토 — 어깨에서 아래로 퍼진다. 앞은 열려 있어 셔츠가 보인다
  const capeRows = [
    [9, 22], [8, 23], [7, 24], [7, 24], [6, 25], [6, 25], [5, 26], [5, 26], [5, 26], [4, 27], [4, 27]
  ]
  capeRows.forEach(([x0, x1], i) => {
    const y = 20 + i
    const open = i < 2 ? 0 : Math.min(2, i - 1)          // 아래로 갈수록 앞이 벌어진다
    rect(g, x0, y, 14 - open, y, 'C')
    rect(g, 17 + open, y, x1, y, 'C')
  })
  // 안감(라일락)이 앞섶과 밑단에서 비친다
  for (let y = 23; y <= 30; y++) {
    const open = Math.min(2, y - 21)
    put(g, 14 - open, y, 'i'); put(g, 17 + open, y, 'i')
  }
  rect(g, 4, 30, 10, 30, 'i', ['C']); rect(g, 21, 30, 27, 30, 'i', ['C'])
  // 금색 테 — 밑단
  rect(g, 4, 31, 11, 31, 'k'); rect(g, 20, 31, 27, 31, 'k')
  // 그늘 · 빛
  rect(g, 5, 25, 5, 29, 'K'); rect(g, 26, 25, 26, 29, 'K')
  stamp(g, 9, 21, ['cc', 'c.'])
  // 망토 밖으로 나온 손
  rect(g, 6, 27, 7, 28, 'S'); rect(g, 24, 27, 25, 28, 'S')
  rect(g, 6, 28, 7, 28, 's'); rect(g, 24, 28, 25, 28, 's')
  // 별 여밈
  stamp(g, 14, 20, ['.kk.', 'kkkk', '.kk.'])
  // 망토의 작은 별 둘
  put(g, 8, 26, 'k'); put(g, 23, 24, 'k')

  outline(g)
  return g
}

/**
 * 06 비밀 정원 — 퍼프 소매 블라우스 위 이끼색 앞치마 원피스, 꽃잎 밑단, 갈색 부츠.
 * 옷 글자: C c K 이끼색 · 빛 · 그늘, k 금 잎 여밈, i 크림 페티코트.
 */
export function bodyGarden() {
  const g = blank()
  ellipse(g, 16, 38.9, 10.5, 1.25, 'G')

  // 부츠 · 다리
  rect(g, 10, 35, 14, 37, 'R'); rect(g, 17, 35, 21, 37, 'R')
  rect(g, 10, 37, 14, 37, 'r'); rect(g, 17, 37, 21, 37, 'r')
  put(g, 12, 35, 'T'); put(g, 19, 35, 'T')              // 끈
  rect(g, 11, 33, 14, 34, 'T'); rect(g, 17, 33, 20, 34, 'T')

  // 목 · 블라우스 깃
  rect(g, 14, 18, 17, 19, 'S'); rect(g, 14, 19, 17, 19, 's')
  stamp(g, 12, 20, ['UUUUUUUU'])

  // 퍼프 소매 — 어깨가 둥글게 부푼다
  ellipse(g, 7.6, 23.2, 2.6, 2.8, 'T'); ellipse(g, 24.4, 23.2, 2.6, 2.8, 'T')
  rect(g, 6, 25, 8, 26, 'T'); rect(g, 23, 25, 25, 26, 'T')
  rect(g, 6, 26, 8, 26, 't'); rect(g, 23, 26, 25, 26, 't')
  rect(g, 6, 27, 8, 28, 'S'); rect(g, 23, 27, 25, 28, 'S')
  rect(g, 6, 28, 8, 28, 's'); rect(g, 23, 28, 25, 28, 's')

  // 블라우스 몸판(앞치마 옆으로 보이는 부분)
  rect(g, 9, 21, 22, 26, 'T')

  // 앞치마 원피스 — 어깨끈 · 몸판 · 퍼지는 치마
  rect(g, 11, 21, 12, 22, 'C'); rect(g, 19, 21, 20, 22, 'C')
  rect(g, 11, 23, 20, 26, 'C')
  const skirt = [[10, 21], [9, 22], [9, 22], [8, 23], [8, 23], [7, 24]]
  skirt.forEach(([x0, x1], i) => rect(g, x0, 27 + i, x1, 27 + i, 'C'))
  // 주름
  for (const x of [11, 16, 20]) rect(g, x, 28, x, 32, 'K')
  stamp(g, 12, 23, ['cc'])
  // 꽃잎 밑단 — 크림 페티코트가 물결로 비친다
  for (let x = 7; x <= 24; x++) put(g, x, 33, x % 3 === 1 ? '.' : 'i')
  for (let x = 7; x <= 24; x += 3) put(g, x, 32, 'i')
  // 금 잎 여밈
  stamp(g, 15, 23, ['kk', '.k'])

  outline(g)
  return g
}

/** 별빛 모자 — 늘어진 남색 나이트캡, 금 띠, 끝에 별 술 */
export function hatStar() {
  const g = blank()
  ellipse(g, 15.5, 7.0, 10.8, 6.2, 'J')
  rect(g, 0, 9, W - 1, H - 1, '.', ['J'])
  // 오른쪽으로 늘어지는 끝
  for (const [x, y, w] of [[22, 3, 3], [24, 4, 3], [25, 5, 3], [26, 6, 2], [27, 7, 2], [27, 8, 2]]) rect(g, x, y, x + w - 1, y, 'J')
  rect(g, 5, 8, 26, 8, 'V'); rect(g, 5, 8, 26, 8, 'v', ['V'])
  rect(g, 6, 8, 25, 8, 'V')
  // 윗면 빛 · 그늘 · 별 무늬
  stamp(g, 9, 2, ['jj.', 'j..'])
  rect(g, 20, 3, 23, 3, 'j', ['J'])
  put(g, 12, 5, 'V'); put(g, 18, 3, 'V'); put(g, 22, 6, 'V')
  // 별 술
  stamp(g, 27, 9, ['.V.', 'VVV', '.V.'])
  put(g, 28, 9, 'v')
  outline(g)
  return g
}

/** 정원 보닛 — 넓은 크림 챙, 세이지 리본, 복숭아색 꽃 셋 */
export function hatBonnet() {
  const g = blank()
  ellipse(g, 16, 6.0, 8.8, 4.8, 'T')
  ellipse(g, 16, 8.4, 13.4, 1.9, 'T')
  rect(g, 3, 9, 28, 9, 't', ['T'])
  rect(g, 7, 6, 25, 7, 'N', ['T'])
  rect(g, 7, 7, 25, 7, 'n', ['N'])
  // 꽃
  for (const [x, y] of [[20, 4], [23, 5], [21, 7]]) stamp(g, x, y, ['.Q.', 'QVQ', '.Q.'])
  stamp(g, 18, 5, ['N']); stamp(g, 25, 7, ['n'])
  // 리본 끝 — 오른쪽 뒤로 늘어진다
  stamp(g, 26, 10, ['NN', '.N', '.n', 'NN'])
  stamp(g, 10, 3, ['tt', 't.'])
  outline(g)
  return g
}

/** 달 일기장 — 오른손에 든 남색 책, 금 초승달 */
export function propMoonBook() {
  const g = blank()
  rect(g, 22, 22, 28, 30, 'J')
  rect(g, 22, 22, 22, 30, 'j')
  rect(g, 28, 23, 28, 29, 'T')
  stamp(g, 24, 24, ['.VV', 'V..', 'V..', '.VV'])
  put(g, 27, 22, 'V'); put(g, 27, 30, 'V')             // 금 모서리
  outline(g)
  return g
}

/** 깃펜 — 왼손에 든 흰 깃털, 금 펜촉 */
export function propQuill() {
  const g = blank()
  // 깃대(L)를 대각선으로 긋고 양옆에 넓은 깃털을 붙인다.
  // 흰 덩어리로만 그리면 주걱, 깃털을 한 칸씩만 붙이면 사다리처럼 읽혔다.
  const shaftX = (y) => 3 + Math.floor(((y - 15) * 4) / 12)
  const left = { 14: 1, 15: 2, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3, 21: 2, 22: 2, 23: 1 }
  const right = { 15: 1, 16: 1, 17: 2, 18: 2, 19: 2, 20: 2, 21: 2, 22: 1, 23: 1 }
  for (let y = 14; y <= 23; y++) {
    const x = shaftX(y)
    for (let k = 1; k <= (left[y] ?? 0); k++) put(g, x - k, y, k === left[y] && y % 2 ? 'l' : 'T')
    for (let k = 1; k <= (right[y] ?? 0); k++) put(g, x + k, y, k === right[y] && y % 2 === 0 ? 'l' : 'T')
  }
  for (let y = 15; y <= 27; y++) put(g, shaftX(y), y, 'L')
  put(g, 7, 30, 'V')
  outline(g)
  return g
}

/** 물뿌리개 — 오른손에 든 황동 물뿌리개, 잎 무늬 */
export function propCan() {
  const g = blank()
  rect(g, 22, 25, 28, 30, 'V')
  rect(g, 22, 29, 28, 30, 'v')
  // 손잡이
  stamp(g, 23, 22, ['.vvv.', 'v...v', 'v...v'])
  // 주둥이 — 오른쪽 위로
  for (const [x, y] of [[29, 26], [30, 25], [31, 24]]) put(g, x, y, 'v')
  rect(g, 30, 23, 31, 23, 'V')
  stamp(g, 24, 26, ['.N', 'Nn'])
  outline(g)
  return g
}
