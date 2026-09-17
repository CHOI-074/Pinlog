/**
 * 그림 확인용 보드 — 앱에 넣기 전에 눈으로 본다.
 *
 *   node scripts/avatar-art/preview.mjs <out.html>
 *
 * 위: 컨셉 01 의 네 사람 / 아래: MAIN 에게 아이템을 하나씩 입혀 본 전체 목록.
 * 팔레트는 앱(lib/avatar.ts)의 라이트 테마 값을 옮겨 적은 것이다.
 */
import fs from 'node:fs'
import { buildArt } from './bundle.mjs'
import { W, H, blank, compose, fromSprite } from './draw.mjs'

const art = buildArt()

const INK = {
  O: '#3a2a26', G: '#dde6f1', E: '#2b2326', I: '#ffffff',
  U: '#fbf5ea', T: '#fbf3e6', t: '#e9ded0', Y: '#f6d67a',
  P: '#3b4566', p: '#2c3452', W: '#f4ead8', w: '#d8c9b1',
  g: '#d4a445', x: '#3b2f2c', z: '#141416',
  A: '#6d97d8', a: '#4f76bd', Q: '#f4a58c', q: '#d9836b', N: '#9cc3a6', n: '#7aa88a',
  V: '#f2c65a', v: '#c99a2e', X: '#e06a6a',
  R: '#8b6446', r: '#6b4a33', L: '#aab3c3', l: '#cbd3df', J: '#3f4a66', j: '#323b53'
}
const SKIN = {
  light:   { S: '#fde9da', s: '#f1cdb6', B: '#f6b5a6', M: '#e08f7e' },
  apricot: { S: '#f8dcc4', s: '#ebbf9f', B: '#f2a896', M: '#d9866f' },
  tan:     { S: '#d9a47a', s: '#c08860', B: '#d98a6e', M: '#a8634b' },
  deep:    { S: '#8a5a3c', s: '#70472f', B: '#a8604a', M: '#5a3222' }
}
const HAIRC = {
  black:  { H: '#2f2a2e', h: '#4b4550', d: '#1d1a1e' },
  brown:  { H: '#5b3e33', h: '#7e5747', d: '#41302a' },
  blonde: { H: '#d6ad5f', h: '#ebc985', d: '#b58b45' },
  red:    { H: '#a9523b', h: '#c56e53', d: '#833e2c' },
  pink:   { H: '#e493c2', h: '#f2b4d8', d: '#c273a2' },
  silver: { H: '#b8c0cd', h: '#d7dde6', d: '#8e97a7' },
  blue:   { H: '#5c8fd6', h: '#84aee6', d: '#4270b5' }
}
const CLOTHES = {
  blue:  { style: 'cardigan', C: '#6d97d8', c: '#91b3e7', K: '#5379c1', k: '#4466ab', i: '#4f73ba' },
  mint:  { style: 'sweater',  C: '#9cc3a6', c: '#b9d8c1', K: '#7fab8b', k: '#6a9877', i: '#76a283' },
  peach: { style: 'cardigan', C: '#f2ab8d', c: '#f7c5ad', K: '#dc8f70', k: '#c7775a', i: '#d68668' },
  grape: { style: 'cardigan', C: '#a88fd6', c: '#c3acea', K: '#8b70bd', k: '#735aa3', i: '#8067b3' },
  // 상점 옷 — 서 있을 때는 전용 몸 그림
  star:   { style: 'cardigan', outfit: 'star', C: '#343f6b', c: '#4a5790', K: '#262f55', k: '#e0b64c', i: '#b9a7dc' },
  garden: { style: 'cardigan', outfit: 'garden', C: '#617f50', c: '#7d9c69', K: '#4c6a3f', k: '#d9ad45', i: '#f3ead6' }
}
// 상점 캐릭터 — 손·목(S s)과 신발(W w)을 털로 덮어쓴다
const SPECIES = {
  cat:   { S: '#eca65a', s: '#d0853f', F: '#eca65a', f: '#c7773a', Z: '#fdf3e2', B: '#f5a3a0', M: '#8a5140', W: '#fdf3e2', w: '#e8d6bd' },
  puppy: { S: '#cf975d', s: '#b17c48', F: '#cf975d', f: '#94603a', Z: '#fcf2e3', B: '#f0a594', M: '#8a5140', W: '#fcf2e3', w: '#e6d3ba' }
}

const MAIN = { species: 'human', skin: 'apricot', hair: 'short', haircolor: 'brown', clothes: 'blue',
  glasses: 'none', hat: 'none', prop: 'none', scene: 'none', concept: 'none' }

const g = (s) => (s ? fromSprite(s) : blank())

function render(look) {
  const c = CLOTHES[look.clothes]
  const animal = art.species[look.species]
  const hair = animal || look.hair === 'none' ? null : art.hair[look.hair]
  const body =
    look.concept === 'office' ? art.body.office
    : look.concept === 'desk' ? art.body.desk[c.style]
    : c.outfit ? art.body.outfit[c.outfit] : art.body.stand[c.style]
  const grid = compose(
    g(look.scene !== 'none' && art.scene[look.scene]),
    g(hair?.back),
    g(animal && look.concept !== 'desk' && animal.tail),
    g(body),
    g(animal ? animal.head : art.head),
    g(hair?.front),
    g(look.glasses !== 'none' && art.glasses[look.glasses]),
    g(look.hat !== 'none' && art.hat[look.hat]),
    // 책상 앞에서는 손이 노트북 위에 있어 들고 있을 수가 없다
    g(look.prop !== 'none' && look.concept !== 'desk' && art.prop[look.prop])
  )
  return { grid, pal: { ...INK, ...SKIN[look.skin], ...HAIRC[look.haircolor], ...c, ...(SPECIES[look.species] ?? {}) } }
}

function svg({ grid, pal }, h) {
  let rects = ''
  grid.forEach((row, y) => {
    let x = 0
    while (x < W) {
      const ch = row[x]
      if (ch === '.') { x++; continue }
      let w = 1
      while (x + w < W && row[x + w] === ch) w++
      if (!pal[ch]) throw new Error(`팔레트에 없는 글자: '${ch}'`)
      rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"/>`
      x += w
    }
  })
  return `<svg viewBox="0 0 ${W} ${H}" height="${h}" width="${(h * W) / H}" shape-rendering="crispEdges">${rects}</svg>`
}

const TOP = [
  { label: 'MAIN', ...MAIN },
  { label: 'VARIANT A', ...MAIN, skin: 'tan', hair: 'curly', clothes: 'mint' },
  { label: 'VARIANT B', ...MAIN, skin: 'light', hair: 'bob', haircolor: 'black', clothes: 'peach' },
  { label: 'VARIANT C', ...MAIN, skin: 'deep', hair: 'long', haircolor: 'black', glasses: 'round' }
]

const SCENES = [
  { label: 'DAILY', ...MAIN, prop: 'pen' },
  { label: 'FOCUS', ...MAIN, concept: 'desk' },
  { label: 'BREAK', ...MAIN, prop: 'mug' }
]

const group = (title, slot, ids, extra = {}) => ({
  title, items: ids.map((id) => ({ label: id, ...MAIN, ...extra, [slot]: id }))
})
const GROUPS = [
  group('머리', 'hair', ['none', 'short', 'bob', 'long', 'curly', 'ponytail', 'twin']),
  group('머리색', 'haircolor', Object.keys(HAIRC)),
  group('피부', 'skin', Object.keys(SKIN)),
  group('상의', 'clothes', Object.keys(CLOTHES)),
  group('안경', 'glasses', ['none', 'round', 'square', 'sun']),
  group('모자', 'hat', ['cap', 'ribbon', 'beanie', 'crown', 'star', 'bonnet']),
  group('소품', 'prop', ['pen', 'mug', 'plant', 'moonbook', 'quill', 'can']),
  group('캐릭터 (상점)', 'species', ['human', 'cat', 'puppy']),
  group('배경', 'scene', ['stars', 'sunrise', 'party']),
  group('컨셉', 'concept', ['none', 'office', 'desk'])
]

const cell = (l, h) => `<div class="c">${svg(render(l), h)}<div>${l.label}</div></div>`

const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#faf8f3;font:600 10px ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#6e7aa0;padding:26px 30px}
  h1{font:800 20px ui-monospace,Menlo,monospace;letter-spacing:.2em;color:#1d2230;margin:0}
  h3{font:700 12px -apple-system,system-ui;letter-spacing:0;color:#1d2230;margin:18px 0 8px}
  .row{display:flex;align-items:flex-end;gap:22px;flex-wrap:wrap}
  .c{display:flex;flex-direction:column;align-items:center;gap:6px}
  hr{border:0;border-top:2px solid #c9d6ea;margin:18px 0}
</style>
<h1>PINLOG</h1><div style="margin:4px 0 16px">PIXEL AVATAR / CONCEPT 01 — ${W}×${H}</div>
<div class="row">${TOP.map((l) => cell(l, 200)).join('')}</div>
<hr>
<div class="row">${SCENES.map((l) => cell(l, 200)).join('')}</div>
<hr>
${GROUPS.map((gr) => `<h3>${gr.title}</h3><div class="row">${gr.items.map((l) => cell(l, 120)).join('')}</div>`).join('')}`

fs.writeFileSync(process.argv[2], html)
console.log('  ' + process.argv[2])
