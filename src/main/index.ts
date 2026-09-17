import { app, BrowserWindow, globalShortcut } from 'electron'
import { registerIpc } from './ipc'
import { applyWindowColors, initTheme } from './theme'
import { createMiniWindow, getWindow, switchMode } from './windows'

/** 빠른 기록 전역 단축키. 다른 앱과 잘 겹치지 않는 Alt 조합을 쓴다. */
const QUICK_PIN_ACCELERATOR = 'CommandOrControl+Alt+P'

// 하나의 인스턴스만 허용. 두 번째 실행은 기존 창을 띄운다.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getWindow('mini') ?? getWindow('main')
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    } else {
      createMiniWindow()
    }
  })
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.pinlog.app')
  registerIpc()
  // 창을 만들기 전에 테마를 적용해야 첫 페인트에 옛 색이 번쩍이지 않는다
  initTheme()

  // 앱은 미니 위젯으로 시작한다 — "화면 구석에 띄워두는" 것이 기본 사용 방식
  createMiniWindow('analog')
  applyWindowColors()

  // 전역 단축키: 어느 앱에 있든 바로 핀을 찍는다.
  //
  // Cmd/Ctrl+Shift+P 는 쓰지 않는다 — VS Code 명령 팔레트, Chrome 개발자도구
  // 명령 메뉴 등이 쓰는 대표적인 조합이라, 전역 등록하면 다른 앱에서 그 키를
  // 누를 때마다 이 위젯의 입력창이 튀어나온다. Alt 조합이 훨씬 덜 겹친다.
  const registered = globalShortcut.register(QUICK_PIN_ACCELERATOR, () => {
    const mini = getWindow('mini')
    if (mini) {
      mini.show()
      mini.focus()
      mini.webContents.send('shortcut:quick-pin')
    } else {
      switchMode('mini')
    }
  })
  if (!registered) {
    console.warn(
      `[shortcut] ${QUICK_PIN_ACCELERATOR} 등록 실패 — 다른 앱이 선점했습니다. 빠른 기록 단축키가 동작하지 않습니다.`
    )
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMiniWindow('analog')
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())

/**
 * 창이 모두 닫히면 앱을 종료한다 — macOS 포함.
 *
 * 예전에는 macOS 관례를 따라 앱을 살려뒀는데, 이 앱에는 트레이 아이콘이 없어서
 * 위젯의 ✕ 를 누르면 '창은 없고 프로세스만 살아있는' 상태가 된다.
 * 이때 단일 인스턴스 락까지 물고 있어서 다시 실행해도 즉시 종료되어,
 * 사용자 눈에는 앱이 아예 안 켜지는 것처럼 보인다.
 *
 * 모드 전환(switchMode)은 새 창을 먼저 만들고 옛 창을 닫으므로
 * 전환 도중에 이 이벤트가 발생하지 않는다.
 */
app.on('window-all-closed', () => app.quit())
