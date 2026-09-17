import { app } from 'electron'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * settings.json 의 단일 소유자.
 *
 * 왜 따로 뺐는가:
 *   예전에는 theme.ts 가 이 파일을 `JSON.stringify({ theme })` 로 통째 덮어썼다.
 *   설정이 테마 하나뿐일 때는 문제가 없지만, 두 번째 항목(캐릭터 꾸미기)이
 *   생기는 순간 테마를 바꿀 때마다 그 항목이 날아간다.
 *   읽기–병합–쓰기를 한 곳에 모아 그 사고가 구조적으로 불가능하게 만든다.
 *
 * 값 검증은 하지 않는다. 어떤 값이 유효한지는 항목마다 다르므로 호출하는 쪽이 본다.
 */

type Settings = Record<string, unknown>

const file = (): string => join(app.getPath('userData'), 'settings.json')

let cache: Settings | null = null

function load(): Settings {
  if (cache) return cache
  try {
    const path = file()
    const raw: unknown = existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : {}
    // 손으로 고쳐졌거나 깨졌어도 앱이 죽으면 안 된다
    cache = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Settings) : {}
  } catch (err) {
    console.error('[settings] 읽기 실패, 기본값으로 시작합니다:', err)
    cache = {}
  }
  return cache
}

export function getSetting(key: string): unknown {
  return load()[key]
}

/** 원자적 쓰기: temp 에 쓰고 rename. 저장 중 종료돼도 파일이 깨지지 않는다. */
export function setSetting(key: string, value: unknown): void {
  const next = { ...load(), [key]: value }
  cache = next
  const path = file()
  const tmp = `${path}.tmp`
  try {
    writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf-8')
    renameSync(tmp, path)
  } catch (err) {
    // 디스크가 꽉 찼거나 권한이 없는 경우. 메모리 값은 유지해 이번 세션은 정상 동작시킨다.
    console.error('[settings] 저장 실패:', err)
  }
}
