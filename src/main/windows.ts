import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'node:path'
import { COMPOSER_SIZE, MINI_SIZE, type ClockView, type WindowKind } from '@shared/types'

const isDev = !!process.env['ELECTRON_RENDERER_URL']
const preload = join(__dirname, '../preload/index.js')

/** 창 인스턴스 레지스트리. kind → window */
const windows = new Map<WindowKind, BrowserWindow>()

/** 미니 창의 마지막 위치를 기억해서, 껐다 켜도 같은 구석에 뜨게 한다 */
let lastMiniBounds: { x: number; y: number } | null = null

export function getWindow(kind: WindowKind): BrowserWindow | undefined {
  const win = windows.get(kind)
  return win && !win.isDestroyed() ? win : undefined
}

export function allWindows(): BrowserWindow[] {
  return [...windows.values()].filter((w) => !w.isDestroyed())
}

/** 렌더러 진입점 로드. 하나의 번들을 ?window= 로 분기한다. */
function loadRenderer(win: BrowserWindow, kind: WindowKind, extra?: Record<string, string>): void {
  const params = new URLSearchParams({ window: kind, ...extra })
  const query = `?${params.toString()}`
  if (isDev) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html${query}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { search: query })
  }
}

/** 외부 링크는 기본 브라우저로. 앱 창이 웹뷰로 납치되는 것을 막는다. */
function hardenNavigation(win: BrowserWindow): void {
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

/* ------------------------------------------------------------------ */
/* 메인 모드 — 타임라인/통계/내보내기                                    */
/* ------------------------------------------------------------------ */

export function createMainWindow(): BrowserWindow {
  const existing = getWindow('main')
  if (existing) {
    existing.show()
    existing.focus()
    return existing
  }

  const win = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 480,
    minHeight: 420,
    show: false,
    backgroundColor: '#0b0d12',
    // macOS: 신호등 버튼만 남기고 타이틀바를 숨겨 커스텀 헤더를 쓴다.
    // Windows/Linux: titleBarOverlay 로 최소한의 컨트롤을 유지.
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay:
      process.platform === 'darwin'
        ? false
        : { color: '#0b0d12', symbolColor: '#e5e7eb', height: 40 },
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  windows.set('main', win)
  hardenNavigation(win)
  win.once('ready-to-show', () => win.show())
  win.on('closed', () => windows.delete('main'))
  loadRenderer(win, 'main')
  return win
}

/* ------------------------------------------------------------------ */
/* 미니 모드 — 프레임리스 / 투명 / 항상 위 / 드래그 이동                  */
/* ------------------------------------------------------------------ */

export function createMiniWindow(view: ClockView = 'analog'): BrowserWindow {
  const existing = getWindow('mini')
  if (existing) {
    existing.show()
    existing.focus()
    return existing
  }

  const { width, height } = MINI_SIZE[view]
  const workArea = screen.getPrimaryDisplay().workArea
  // 최초 위치: 주 디스플레이 우측 상단에서 24px 안쪽
  const x = lastMiniBounds?.x ?? workArea.x + workArea.width - width - 24
  const y = lastMiniBounds?.y ?? workArea.y + 24

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    show: false,

    // --- 프레임리스 위젯의 핵심 4종 세트 ---
    frame: false, // OS 타이틀바 제거
    transparent: true, // 배경 투명 → 렌더러에서 둥근 시계 모양만 보이게
    hasShadow: false, // 투명 창에 사각 그림자가 남는 것 방지
    resizable: false, // 위젯은 고정 크기 (뷰 전환 시 코드로만 리사이즈)

    alwaysOnTop: true,
    skipTaskbar: true, // 작업표시줄/Dock 목록에서 숨김
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    roundedCorners: true,
    // 투명 창에서 backgroundColor 는 완전 투명이어야 한다
    backgroundColor: '#00000000',
    webPreferences: {
      preload,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 'floating' 보다 위 레벨. 전체화면 앱 위에도 떠 있게 한다.
  win.setAlwaysOnTop(true, 'screen-saver')
  // 다른 데스크탑(Space)으로 이동해도 따라오게
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  windows.set('mini', win)
  hardenNavigation(win)
  win.once('ready-to-show', () => win.show())

  // 드래그로 옮긴 위치를 기억
  const remember = (): void => {
    if (win.isDestroyed()) return
    const b = win.getBounds()
    lastMiniBounds = { x: b.x, y: b.y }
  }
  win.on('moved', remember)
  win.on('close', remember)
  win.on('closed', () => windows.delete('mini'))

  loadRenderer(win, 'mini')
  return win
}

/**
 * 뷰 전환(아날로그↔디지털)으로 위젯 모양이 바뀔 때 창 크기를 맞춘다.
 * 우측 상단을 기준점으로 잡아 화면 구석에 붙여둔 위젯이 튀지 않게 하고,
 * 화면 밖으로 밀려나지 않도록 작업 영역 안으로 클램프한다.
 */
export function resizeMini(view: ClockView): void {
  const win = getWindow('mini')
  if (!win) return

  const { width, height } = MINI_SIZE[view]
  const b = win.getBounds()
  const area = screen.getDisplayMatching(b).workArea

  let x = b.x + b.width - width
  let y = b.y
  x = Math.min(Math.max(x, area.x), area.x + area.width - width)
  y = Math.min(Math.max(y, area.y), area.y + area.height - height)

  // resizable:false 인 창은 플랫폼에 따라 setBounds 가 무시된다. 잠깐 풀어준다.
  win.setResizable(true)
  win.setBounds({ x, y, width, height }, false)
  win.setResizable(false)
}

/* ------------------------------------------------------------------ */
/* 입력 창 — 위젯 크기에 묶이지 않는 독립 창                              */
/* ------------------------------------------------------------------ */

/**
 * 입력 UI 를 미니 창 안에 모달로 그리면 220px 위젯 안에서 잘린다.
 * 그래서 처음부터 제 크기(COMPOSER_SIZE)로 뜨는 별도 창으로 띄운다.
 * 초기값(기록 시각 / 수정할 핀)은 쿼리스트링으로 넘긴다 — 별도 상태 동기화가 필요 없다.
 */
export function createComposerWindow(params: { timestamp: number; editingId?: string }): void {
  // 이미 열려 있으면 새 값으로 다시 띄운다
  getWindow('composer')?.destroy()

  const { width, height } = COMPOSER_SIZE
  // 입력창을 띄운 창이 있는 디스플레이의 중앙에 놓는다
  const anchor = getWindow('mini') ?? getWindow('main')
  const area = anchor
    ? screen.getDisplayMatching(anchor.getBounds()).workArea
    : screen.getPrimaryDisplay().workArea

  const win = new BrowserWindow({
    width,
    height,
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    roundedCorners: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  windows.set('composer', win)
  hardenNavigation(win)

  win.once('ready-to-show', () => {
    win.show()
    // always-on-top 창은 키보드 포커스를 놓치기 쉽다. 바로 타이핑할 수 있게 명시적으로 준다.
    win.focus()
    win.webContents.focus()
  })

  win.on('closed', () => {
    windows.delete('composer')
    // 입력이 끝나면 위젯으로 포커스를 돌려준다
    getWindow('mini')?.focus()
  })

  loadRenderer(win, 'composer', {
    ts: String(params.timestamp),
    ...(params.editingId ? { id: params.editingId } : {})
  })
}

/** 미니 ↔ 메인 전환. 한쪽을 띄우고 다른 쪽을 닫는다. */
export function switchMode(to: WindowKind, view: ClockView = 'analog'): void {
  if (to === 'mini') {
    createMiniWindow(view)
    getWindow('main')?.close()
  } else {
    createMainWindow()
    getWindow('mini')?.close()
  }
}

export function toggleAlwaysOnTop(win: BrowserWindow): boolean {
  const next = !win.isAlwaysOnTop()
  win.setAlwaysOnTop(next, next ? 'screen-saver' : 'normal')
  return next
}
