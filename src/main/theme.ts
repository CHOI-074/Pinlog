import { nativeTheme } from 'electron'
import { WINDOW_BG, type ThemeMode } from '@shared/types'
import { getSetting, setSetting } from './settings'
import { allWindows, getWindow } from './windows'

/**
 * 테마는 nativeTheme.themeSource 로 관리한다.
 *
 * 이걸 쓰면 Chromium 이 모든 창의 prefers-color-scheme 을 한꺼번에 바꿔주므로,
 * 렌더러마다 테마를 브로드캐스트하고 클래스를 토글하는 배선이 통째로 필요 없다.
 * 'system' 을 공짜로 얻는 것도 덤이다.
 */

const isThemeMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark'

export function getTheme(): ThemeMode {
  // 설정 파일이 손상됐거나 손으로 고쳐졌어도 앱이 죽지 않게 검증한다
  const raw = getSetting('theme')
  return isThemeMode(raw) ? raw : 'system'
}

/** 현재 테마가 실제로 어두운가 (system 이면 OS 설정을 따른다) */
export const isDark = (): boolean => nativeTheme.shouldUseDarkColors

/**
 * 창의 불투명 배경색을 현재 테마에 맞춘다.
 *
 * 메인 창은 생성 시 backgroundColor 가 박혀 있어서, 테마를 바꿔도
 * 리사이즈할 때 옛 색이 잠깐 비친다. 미니/입력 창은 투명이라 건드리지 않는다.
 */
export function applyWindowColors(): void {
  const bg = WINDOW_BG[isDark() ? 'dark' : 'light']
  getWindow('main')?.setBackgroundColor(bg)

  if (process.platform !== 'darwin') {
    // Windows/Linux 의 커스텀 타이틀바 오버레이도 같이 맞춘다
    const main = getWindow('main')
    try {
      main?.setTitleBarOverlay?.({
        color: bg,
        symbolColor: isDark() ? '#e8ecf2' : '#171d26',
        height: 40
      })
    } catch {
      /* 오버레이를 안 쓰는 창이면 무시 */
    }
  }
}

export function setTheme(mode: ThemeMode): void {
  nativeTheme.themeSource = mode
  setSetting('theme', mode)
  applyWindowColors()
  broadcastTheme()
}

/** 다른 창의 테마 선택 UI 도 같이 갱신되도록 알린다 */
export function broadcastTheme(): void {
  const payload = { mode: getTheme(), dark: isDark() }
  for (const win of allWindows()) {
    win.webContents.send('theme:changed', payload)
  }
}

/** 앱 시작 시 저장된 테마를 적용한다 */
export function initTheme(): void {
  nativeTheme.themeSource = getTheme()
  // system 모드에서 OS 설정이 바뀌면 따라간다
  nativeTheme.on('updated', () => {
    applyWindowColors()
    broadcastTheme()
  })
}
