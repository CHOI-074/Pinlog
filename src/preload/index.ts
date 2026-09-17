import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type AvatarLook,
  type ClockView,
  type Pin,
  type ThemeMode,
  type WindowKind
} from '@shared/types'

/**
 * 네이티브 접근은 전부 이 브릿지 한 곳을 통과한다.
 * 나중에 Tauri 로 갈아타거나 웹(PWA)으로 돌릴 때 이 파일의 형태만 맞춰주면 된다.
 * (웹 대체 구현: src/renderer/src/lib/bridge.ts 의 webFallback)
 */
const api = {
  platform: process.platform,

  window: {
    kind: (): Promise<WindowKind> => ipcRenderer.invoke(IPC.windowKind),
    setMode: (to: WindowKind, view: ClockView): Promise<void> =>
      ipcRenderer.invoke(IPC.windowSetMode, to, view),
    resizeMini: (view: ClockView): Promise<void> =>
      ipcRenderer.invoke(IPC.windowResizeMini, view),
    toggleAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke(IPC.windowToggleTop),
    isAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke(IPC.windowIsTop),
    close: (): Promise<void> => ipcRenderer.invoke(IPC.windowClose),
    minimize: (): Promise<void> => ipcRenderer.invoke(IPC.windowMinimize)
  },

  theme: {
    get: (): Promise<{ mode: ThemeMode; dark: boolean }> => ipcRenderer.invoke(IPC.themeGet),
    set: (mode: ThemeMode): Promise<{ mode: ThemeMode; dark: boolean }> =>
      ipcRenderer.invoke(IPC.themeSet, mode),
    /** 다른 창에서 테마가 바뀌거나 OS 설정이 바뀌면 호출된다 */
    onChanged: (cb: (s: { mode: ThemeMode; dark: boolean }) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, s: { mode: ThemeMode; dark: boolean }): void =>
        cb(s)
      ipcRenderer.on(IPC.themeChanged, handler)
      return () => ipcRenderer.off(IPC.themeChanged, handler)
    }
  },

  /** 캐릭터가 입고 있는 것 (레벨·경험치는 기록에서 계산하므로 저장하지 않는다) */
  avatar: {
    get: (): Promise<AvatarLook> => ipcRenderer.invoke(IPC.avatarGet),
    set: (look: AvatarLook): Promise<AvatarLook> => ipcRenderer.invoke(IPC.avatarSet, look)
  },

  /** 온보딩을 몇 번째 버전까지 봤는지 (0 = 안 봄) */
  onboarding: {
    get: (): Promise<number> => ipcRenderer.invoke(IPC.onboardingGet),
    set: (version: number): Promise<void> => ipcRenderer.invoke(IPC.onboardingSet, version)
  },

  composer: {
    /** 입력 전용 독립 창을 띄운다. 초기값은 쿼리스트링으로 전달된다. */
    open: (params: { timestamp: number; editingId?: string }): Promise<void> =>
      ipcRenderer.invoke(IPC.composerOpen, params)
  },

  pins: {
    list: (): Promise<Pin[]> => ipcRenderer.invoke(IPC.pinsList),
    add: (input: Partial<Pin>): Promise<Pin> => ipcRenderer.invoke(IPC.pinsAdd, input),
    update: (id: string, patch: Partial<Pin>): Promise<Pin | null> =>
      ipcRenderer.invoke(IPC.pinsUpdate, id, patch),
    remove: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC.pinsRemove, id),
    /** 다른 창에서 데이터가 바뀌면 호출된다. 해제 함수를 돌려준다. */
    onChanged: (cb: (pins: Pin[]) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, pins: Pin[]): void => cb(pins)
      ipcRenderer.on(IPC.pinsChanged, handler)
      return () => ipcRenderer.off(IPC.pinsChanged, handler)
    }
  },

  export: {
    csv: (csv: string, filename: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.exportCsv, csv, filename),
    clipboard: (text: string): Promise<void> => ipcRenderer.invoke(IPC.clipboardWrite, text)
  },

  /** 전역 단축키(Cmd/Ctrl+Shift+P)로 즉시 입력창 열기 */
  onQuickPin: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('shortcut:quick-pin', handler)
    return () => ipcRenderer.off('shortcut:quick-pin', handler)
  }
}

export type PinLogApi = typeof api

contextBridge.exposeInMainWorld('pinlog', api)
