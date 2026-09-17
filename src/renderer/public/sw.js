/*
 * 서비스 워커 — 설치형 PWA 로 만들고 오프라인에서도 열리게 한다.
 *
 * 전략:
 *   - 앱 셸(HTML/JS/CSS/아이콘)은 stale-while-revalidate.
 *     기록 데이터는 localStorage 에 있으므로 네트워크가 없어도 앱이 온전히 돈다.
 *   - 내비게이션 요청은 실패 시 캐시된 index.html 로 폴백한다 (SPA).
 *
 * 주의: 기록 자체는 캐시하지 않는다. 서버가 없고 전부 기기 안에 있다.
 */

const VERSION = 'pinlog-v1'
const SHELL = `${VERSION}-shell`

// 빌드 해시가 붙는 파일은 미리 알 수 없으므로, 여기엔 고정 경로만 넣고
// 나머지는 요청될 때 캐시에 담는다.
const PRECACHE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // 일부 실패해도 설치는 진행
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 페이지 이동: 네트워크 우선, 실패하면 캐시된 셸
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    )
    return
  }

  // 그 외 정적 자원: 캐시 먼저 주고 뒤에서 갱신
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(SHELL).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})

/*
 * 알림을 탭하면 앱을 열되, 이미 떠 있으면 그 창을 재사용하고
 * 입력창을 여는 신호만 보낸다.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = './?window=main&compose=1'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'quick-pin' })
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
