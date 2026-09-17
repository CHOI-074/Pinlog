/**
 * 캐릭터 그림 데이터를 생성한다.
 *
 *   npm run art
 *
 * → src/renderer/src/lib/avatarArt.ts (자동 생성 — 직접 고치지 말 것)
 *
 * 그림을 바꾸려면 pieces.mjs 를 고치고 다시 돌린다. 생성 파일을 손으로 고치면
 * 다음 생성 때 덮어써져 사라진다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildArt } from './bundle.mjs'
import { W, H } from './draw.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, '../../src/renderer/src/lib/avatarArt.ts')

const art = buildArt()

// 격자 무결성 — 한 줄이라도 폭이 다르면 화면만 조용히 어긋난다
const bad = []
const walk = (node, key) => {
  if (node && Array.isArray(node.rows)) {
    node.rows.forEach((r, i) => r.length !== W && bad.push(`${key} ${i}줄: ${r.length}칸`))
    if (node.top + node.rows.length > H) bad.push(`${key}: 캔버스 아래로 넘침`)
    return
  }
  for (const [k, v] of Object.entries(node)) walk(v, key ? `${key}.${k}` : k)
}
walk(art, '')
if (bad.length) {
  console.error('격자 오류:\n  ' + bad.join('\n  '))
  process.exit(1)
}

const body = `/**
 * 캐릭터 그림 데이터 — 자동 생성 파일. 직접 고치지 마세요.
 *
 * 원본: scripts/avatar-art/pieces.mjs
 * 생성: npm run art
 *
 * ${W}×${H} 격자, 한 글자 = 한 픽셀. 글자의 뜻과 색은 lib/avatar.ts 의 팔레트가 정한다.
 */

export interface Sprite {
  /** 첫 줄이 놓일 y (칸) */
  top: number
  rows: string[]
}

export interface HairArt {
  /** 얼굴 앞에 오는 부분 (앞머리·옆머리) */
  front: Sprite
  /** 몸 뒤에 깔리는 부분 (긴 머리·꽁지). 없으면 앞만 있다 */
  back?: Sprite
}

export const ART_W = ${W}
export const ART_H = ${H}

export const ART = ${JSON.stringify(art, null, 2)} satisfies {
  head: Sprite
  body: {
    stand: { cardigan: Sprite; sweater: Sprite }
    office: Sprite
    desk: { cardigan: Sprite; sweater: Sprite }
    outfit: Record<string, Sprite>
  }
  species: Record<string, { head: Sprite; tail: Sprite }>
  hair: Record<string, HairArt>
  glasses: Record<string, Sprite>
  hat: Record<string, Sprite>
  prop: Record<string, Sprite>
  scene: Record<string, Sprite>
}
`
fs.writeFileSync(out, body)
const count = JSON.stringify(art).length
console.log(`  ${path.relative(process.cwd(), out)}  (${(count / 1024).toFixed(1)} KB)`)
