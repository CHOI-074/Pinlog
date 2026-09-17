import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Pin } from '@shared/types'

/**
 * 핀 데이터의 단일 소유자(single source of truth)는 메인 프로세스다.
 * 창이 두 개(메인/미니) 뜨는 앱이라 렌더러의 localStorage 를 쓰면
 * 두 창의 상태가 갈라진다. 메인이 파일을 들고, 변경은 IPC 로 브로드캐스트한다.
 */

const file = (): string => join(app.getPath('userData'), 'pins.json')

let cache: Pin[] | null = null

function load(): Pin[] {
  if (cache) return cache
  try {
    const path = file()
    cache = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf-8')) as Pin[]) : []
  } catch (err) {
    console.error('[store] 읽기 실패, 빈 목록으로 시작합니다:', err)
    cache = []
  }
  return cache
}

/** 원자적 쓰기: temp 에 쓰고 rename. 저장 중 종료돼도 파일이 깨지지 않는다. */
function persist(): void {
  const path = file()
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(cache ?? [], null, 2), 'utf-8')
  renameSync(tmp, path)
}

export function listPins(): Pin[] {
  // 최신순
  return [...load()].sort((a, b) => b.timestamp - a.timestamp)
}

export function addPin(input: Partial<Pin>): Pin {
  const pin: Pin = {
    id: randomUUID(),
    timestamp: input.timestamp ?? Date.now(),
    text: input.text?.trim() ?? '',
    detail: input.detail?.trim() || undefined,
    tags: input.tags ?? [],
    isFocusMode: input.isFocusMode ?? false
  }
  load().push(pin)
  persist()
  return pin
}

export function updatePin(id: string, patch: Partial<Pin>): Pin | null {
  const pins = load()
  const i = pins.findIndex((p) => p.id === id)
  if (i === -1) return null
  pins[i] = { ...pins[i], ...patch, id: pins[i].id }
  persist()
  return pins[i]
}

export function removePin(id: string): boolean {
  const pins = load()
  const i = pins.findIndex((p) => p.id === id)
  if (i === -1) return false
  pins.splice(i, 1)
  persist()
  return true
}
