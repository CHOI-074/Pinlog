import { BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import { writeFile } from 'node:fs/promises'
import {
  IPC,
  type AvatarLook,
  type ClockView,
  type Pin,
  type ThemeMode,
  type WindowKind
} from '@shared/types'
import { getLook, setLook } from './avatar'
import { getSetting, setSetting } from './settings'
import { getTheme, isDark, setTheme } from './theme'
import { addPin, listPins, removePin, updatePin } from './store'
import {
  allWindows,
  createComposerWindow,
  resizeMini,
  switchMode,
  toggleAlwaysOnTop
} from './windows'

/** 데이터가 바뀌면 모든 창에 새 목록을 밀어준다 → 메인/미니 실시간 동기화 */
function broadcast(): void {
  const pins = listPins()
  for (const win of allWindows()) {
    win.webContents.send(IPC.pinsChanged, pins)
  }
}

function senderWindow(e: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender)
}

export function registerIpc(): void {
  /* --- 창 제어 --------------------------------------------------- */
  ipcMain.handle(IPC.windowKind, (e): WindowKind => {
    const url = e.sender.getURL()
    if (url.includes('window=composer')) return 'composer'
    if (url.includes('window=mini')) return 'mini'
    return 'main'
  })

  ipcMain.handle(
    IPC.composerOpen,
    (_e, params: { timestamp: number; editingId?: string }) => {
      createComposerWindow(params)
    }
  )

  ipcMain.handle(IPC.windowSetMode, (_e, to: WindowKind, view: ClockView) => {
    switchMode(to, view)
  })

  ipcMain.handle(IPC.windowResizeMini, (_e, view: ClockView) => {
    resizeMini(view)
  })

  ipcMain.handle(IPC.windowToggleTop, (e) => {
    const win = senderWindow(e)
    return win ? toggleAlwaysOnTop(win) : false
  })

  ipcMain.handle(IPC.windowIsTop, (e) => senderWindow(e)?.isAlwaysOnTop() ?? false)
  ipcMain.handle(IPC.windowClose, (e) => senderWindow(e)?.close())
  ipcMain.handle(IPC.windowMinimize, (e) => senderWindow(e)?.minimize())

  /* --- 핀 CRUD --------------------------------------------------- */
  ipcMain.handle(IPC.pinsList, () => listPins())

  ipcMain.handle(IPC.pinsAdd, (_e, input: Partial<Pin>) => {
    const pin = addPin(input)
    broadcast()
    return pin
  })

  ipcMain.handle(IPC.pinsUpdate, (_e, id: string, patch: Partial<Pin>) => {
    const pin = updatePin(id, patch)
    broadcast()
    return pin
  })

  ipcMain.handle(IPC.pinsRemove, (_e, id: string) => {
    const ok = removePin(id)
    broadcast()
    return ok
  })

  /* --- 테마 -------------------------------------------------------- */
  ipcMain.handle(IPC.themeGet, () => ({ mode: getTheme(), dark: isDark() }))
  ipcMain.handle(IPC.themeSet, (_e, mode: ThemeMode) => {
    setTheme(mode)
    return { mode: getTheme(), dark: isDark() }
  })

  /* --- 캐릭터 꾸미기 ---------------------------------------------- */
  ipcMain.handle(IPC.avatarGet, () => getLook())
  ipcMain.handle(IPC.avatarSet, (_e, look: AvatarLook) => setLook(look))

  /* --- 온보딩 (본 버전 번호) ---------------------------------------- */
  ipcMain.handle(IPC.onboardingGet, () => {
    const v = getSetting('onboarding')
    // 손상됐거나 없으면 0 = 아직 아무것도 안 봄
    return Number.isInteger(v) && (v as number) >= 0 ? v : 0
  })
  ipcMain.handle(IPC.onboardingSet, (_e, version: number) => {
    if (Number.isInteger(version) && version >= 0) setSetting('onboarding', version)
  })

  /* --- 내보내기 / 클립보드 ---------------------------------------- */
  ipcMain.handle(IPC.clipboardWrite, (_e, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle(IPC.exportCsv, async (e, csv: string, filename: string) => {
    const win = senderWindow(e)
    const opts = {
      title: 'CSV 내보내기',
      defaultPath: filename,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    }
    const result = win
      ? await dialog.showSaveDialog(win, opts)
      : await dialog.showSaveDialog(opts)
    if (result.canceled || !result.filePath) return null
    // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 을 붙인다
    await writeFile(result.filePath, `﻿${csv}`, 'utf-8')
    return result.filePath
  })
}
