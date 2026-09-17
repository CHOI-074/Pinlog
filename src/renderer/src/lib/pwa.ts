/**
 * PWA 전용 배선. Electron 에서는 아무 것도 하지 않는다.
 *
 * PWA 로 할 수 있는 것과 없는 것을 분명히 해둔다:
 *   ✅ 홈화면 설치, 오프라인 실행, 앱 단축키(길게 눌러 '지금 기록하기')
 *   ✅ 공유시트로 받기 — Android/Chrome 만. iOS 는 Web Share Target 미지원.
 *   ✅ 알림 띄우기 → 탭하면 입력창 열림
 *   ❌ 알림창 안에서 바로 타이핑 (네이티브만 가능)
 *   ❌ 앱이 꺼진 상태에서 정확한 시각에 울리는 예약 알림
 *      (Notification Triggers 는 사실상 미구현. 앱이 열려 있는 동안만 예약된다)
 */

import { isDesktop } from './bridge'

const REMINDER_KEY = 'pinlog:reminderMinutes'

/** 서비스 워커 등록. 실패해도 앱은 그냥 동작해야 한다. */
export function registerServiceWorker(): void {
  if (isDesktop || !('serviceWorker' in navigator)) return
  /*
   * 토스 미니앱에서는 등록하지 않는다. 배포·캐시는 토스가 관리하는데,
   * 워커가 끼면 새 버전을 올려도 옛 화면이 캐시에서 나올 수 있다.
   */
  if (__TOSS_BUILD__) return
  /*
   * http(s) 에서만. file:// 로 연 빌드(검사 스크립트, 디스크에서 직접 연 경우)에서
   * 등록되면, 다음 페이지 이동 때 워커가 file:// 주소를 fetch 하려다 실패하고
   * 캐시에도 없어서 페이지 자체가 안 열린다. 브라우저는 원래 file:// 등록을 거부하지만
   * Electron 은 받아준다.
   */
  if (!/^https?:$/.test(location.protocol)) return

  // base 가 './' 이므로 현재 경로 기준으로 등록한다 (하위 경로 배포 대응)
  const register = (): void => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('[pwa] 서비스 워커 등록 실패 — 오프라인 기능만 빠집니다:', err)
    })
  }

  /*
   * 'load' 를 기다리기만 하면 안 된다.
   *
   * 이 함수는 App 의 effect 에서, 저장소를 비동기로 다 읽은 '뒤에' 불린다.
   * 그때는 load 가 이미 지나간 경우가 대부분이라 리스너가 영영 안 불렸고,
   * 서비스 워커가 한 번도 등록되지 않았다 — 오프라인 실행·홈화면 설치가 조용히 죽어 있었다.
   * 이미 로드가 끝났으면 바로 등록한다.
   */
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}

/**
 * 공유시트로 들어온 텍스트를 꺼낸다 (Android).
 * manifest 의 share_target 이 GET 이라 쿼리로 도착한다.
 */
export function readSharedText(): string | null {
  const q = new URLSearchParams(location.search)
  const parts = [q.get('title'), q.get('text'), q.get('url')].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

/** 앱 단축키/알림에서 '바로 입력창 열기'로 들어왔는가 */
export const wantsCompose = (): boolean =>
  new URLSearchParams(location.search).get('compose') === '1'

/**
 * 주소창에서 공유/컴포즈 파라미터를 지운다.
 * 안 지우면 새로고침할 때마다 같은 내용이 다시 들어온다.
 */
export function clearLaunchParams(): void {
  const url = new URL(location.href)
  for (const k of ['title', 'text', 'url', 'compose']) url.searchParams.delete(k)
  history.replaceState(null, '', url)
}

/** 서비스 워커가 보내는 quick-pin 신호를 구독한다 (알림 탭) */
export function onServiceWorkerQuickPin(cb: () => void): () => void {
  if (isDesktop || !('serviceWorker' in navigator)) return () => {}
  const handler = (e: MessageEvent): void => {
    if (e.data?.type === 'quick-pin') cb()
  }
  navigator.serviceWorker.addEventListener('message', handler)
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}

/* ------------------------------------------------------------------ */
/* 기록 리마인더                                                        */
/* ------------------------------------------------------------------ */

export const getReminderMinutes = (): number => {
  const v = Number(localStorage.getItem(REMINDER_KEY))
  return Number.isFinite(v) && v > 0 ? v : 0
}

export const setReminderMinutes = (m: number): void => {
  if (m > 0) localStorage.setItem(REMINDER_KEY, String(m))
  else localStorage.removeItem(REMINDER_KEY)
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

let timer: ReturnType<typeof setInterval> | null = null

/**
 * "지금 뭐 하고 있나요?" 알림을 주기적으로 띄운다.
 *
 * ⚠️ 앱(탭)이 살아 있는 동안만 동작한다. 브라우저가 완전히 종료되면 멈춘다 —
 * PWA 에서 백그라운드 정시 알림은 신뢰할 수 없다. 이걸 보장하려면 네이티브가 필요하다.
 */
export function startReminder(): void {
  stopReminder()
  const minutes = getReminderMinutes()
  if (isDesktop || minutes <= 0) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  timer = setInterval(
    () => {
      void navigator.serviceWorker?.ready
        .then((reg) =>
          reg.showNotification('핀로그', {
            body: '지금 뭘 하고 있나요? 탭해서 한 줄 남기기',
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            // 같은 tag 로 덮어써서 알림이 쌓이지 않게 한다.
            // renotify 는 표준 타입에 없어(Chrome 확장 속성) 캐스팅으로 넘긴다 —
            // 같은 tag 로 다시 알릴 때 소리/진동을 내려면 필요하다.
            ...({ tag: 'pinlog-reminder', renotify: true } as NotificationOptions)
          })
        )
        .catch(() => {
          /* 알림 실패는 조용히 넘긴다 */
        })
    },
    minutes * 60 * 1000
  )
}

export function stopReminder(): void {
  if (timer) clearInterval(timer)
  timer = null
}
