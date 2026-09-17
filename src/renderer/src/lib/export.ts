import type { Pin } from '@shared/types'
import { bridge } from './bridge'
import { hhmm } from './time'

/** RFC4180: 따옴표는 두 번, 구분자/개행 포함 시 전체를 감싼다 */
const cell = (v: string): string =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

/** 스키마 그대로 내보낸다: id, timestamp, text, tags, isFocusMode */
export function toCsv(pins: Pin[]): string {
  const header = ['id', 'timestamp', 'datetime', 'text', 'detail', 'tags', 'isFocusMode']
  const rows = pins.map((p) => [
    p.id,
    String(p.timestamp),
    new Date(p.timestamp).toISOString(),
    p.text,
    p.detail ?? '',
    p.tags.join('|'),
    String(p.isFocusMode)
  ])
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
}

/** 노션/슬랙에 그대로 붙여넣기 좋은 마크다운 체크리스트 */
export function toMarkdown(pins: Pin[]): string {
  return pins
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((p) => {
      const tags = p.tags.map((t) => `#${t}`).join(' ')
      // 내보내기는 일반 텍스트라 SVG 아이콘을 못 쓴다.
      // 앱의 '집중' 표시(별)와 같은 의미가 전달되도록 별 이모지를 쓴다.
      const focus = p.isFocusMode ? ' ⭐' : ''
      const line = `- ${hhmm(p.timestamp)} — ${p.text}${tags ? ` ${tags}` : ''}${focus}`
      // 상세 메모는 들여쓴 하위 줄로 — 노션·슬랙에 붙여도 구조가 유지된다
      return p.detail ? `${line}\n  ${p.detail.replace(/\n/g, '\n  ')}` : line
    })
    .join('\n')
}

export async function copyAsMarkdown(pins: Pin[]): Promise<void> {
  await bridge.export.clipboard(toMarkdown(pins))
}

export async function exportCsv(pins: Pin[]): Promise<string | null> {
  const stamp = new Date().toISOString().slice(0, 10)
  return bridge.export.csv(toCsv(pins), `pinlog-${stamp}.csv`)
}
