// 실제 앱의 메인 프로세스를 그대로 부팅해서
// 위젯 클릭 → preload → IPC → 입력 창 생성 전체 경로를 검증한다.
const { app, BrowserWindow } = require('electron')
const path = require('path')

const ROOT = process.argv[2] || process.cwd()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 실제 기록을 건드리지 않도록 데이터 경로를 임시 디렉토리로 돌린다.
// store.ts 가 app.getPath('userData') 를 지연 호출하므로 부팅 전에 바꾸면 된다.
const sandbox = path.join(require('node:os').tmpdir(), `pinlog-e2e-${Date.now()}`)
require('node:fs').mkdirSync(sandbox, { recursive: true })
app.setPath('userData', sandbox)

// 앱의 진짜 메인 번들을 불러온다 (같은 프로세스이므로 BrowserWindow 를 공유한다)
const T0 = Date.now()
if (process.env.PINLOG_TRACE) {
  app.on('browser-window-created', (_e, win) => {
    console.log(`[trace] +${Date.now() - T0}ms 창 생성`)
    console.log(new Error('생성 지점').stack.split('\n').slice(1, 6).join('\n'))
    win.webContents.on('console-message', (_ev, _lvl, msg) => {
      if (msg.startsWith('[r]')) console.log(`[trace] +${Date.now() - T0}ms ${msg}`)
    })
    win.webContents.on('did-finish-load', () => {
      console.log(`[trace] +${Date.now() - T0}ms 로드 완료: ${win.webContents.getURL().split('?')[1]}`)
      // 렌더러에서 일어나는 클릭을 전부 기록한다.
      // isTrusted=true 면 OS 가 보낸 진짜 마우스 클릭이다.
      win.webContents.executeJavaScript(`
        document.addEventListener('click', (e) => {
          console.log('[r] click trusted=' + e.isTrusted + ' target=' +
            (e.target.getAttribute && (e.target.getAttribute('aria-label') || e.target.tagName)))
        }, true)
        window.addEventListener('focus', () => console.log('[r] window focus'))
      `)
    })
  })
}
require(path.join(ROOT, 'out/main/index.js'))

const url = (w) => {
  try {
    return w.webContents.getURL()
  } catch {
    return ''
  }
}
const find = (kind) => BrowserWindow.getAllWindows().find((w) => url(w).includes(`window=${kind}`))

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    await sleep(2000)

    // 테스트를 밀폐한다: 전역 단축키가 살아 있으면 테스트 도중 사람이 누른 키가
    // 입력 창을 열어버려 결과가 흔들린다. 단축키 경로는 아래에서 따로 검증한다.
    require('electron').globalShortcut.unregisterAll()
    await sleep(1500)

    const mini = find('mini')
    t('앱 기동 — 미니 위젯 창', !!mini)
    const startupWindows = BrowserWindow.getAllWindows().map((w) => url(w) || '(빈 URL)')
    t('시작 시 입력 창은 없음', !find('composer'), startupWindows.join(' | '))
    if (!mini) throw new Error('미니 창 없음')

    const miniBounds = mini.getBounds()
    t('위젯 크기 220x220', miniBounds.width === 220 && miniBounds.height === 220,
      `${miniBounds.width}x${miniBounds.height}`)

    // 위젯 안쪽 원을 실제로 클릭한다
    const clicked = await mini.webContents.executeJavaScript(`
      (() => {
        const b = document.querySelector('button[aria-label="지금 이 순간 핀 찍기"]')
        if (!b) return 'no-button'
        b.click()
        return 'clicked'
      })()
    `)
    t('위젯 다이얼 클릭', clicked === 'clicked', String(clicked))

    await sleep(2000)

    const composer = find('composer')
    t('입력 창이 별도 창으로 열림', !!composer)
    t('위젯 크기는 그대로 (창을 늘리지 않음)',
      mini.getBounds().width === 220 && mini.getBounds().height === 220,
      `${mini.getBounds().width}x${mini.getBounds().height}`)

    if (composer) {
      const cb = composer.getBounds()
      t('입력 창 380x620', cb.width === 380 && cb.height === 620, `${cb.width}x${cb.height}`)

      const disp = require('electron').screen.getDisplayMatching(cb).workArea
      const inside =
        cb.x >= disp.x && cb.y >= disp.y &&
        cb.x + cb.width <= disp.x + disp.width &&
        cb.y + cb.height <= disp.y + disp.height
      t('입력 창이 화면 안에 완전히 들어옴', inside)

      const v = await composer.webContents.executeJavaScript(`
        (async () => {
          await new Promise(r => setTimeout(r, 500))
          const ta = document.querySelector('textarea')
          const sc = document.querySelector('.overflow-y-auto')
          const save = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '저장')
          const r = save && save.getBoundingClientRect()
          return {
            hasTextarea: !!ta,
            focused: document.activeElement === ta,
            needsScroll: sc ? sc.scrollHeight > sc.clientHeight + 1 : null,
            saveVisible: r ? r.bottom <= window.innerHeight + 1 : false
          }
        })()
      `)
      t('본문 입력창 존재', !!v.hasTextarea)
      t('열자마자 본문에 포커스', !!v.focused)
      t('스크롤 없이 전부 보임', v.needsScroll === false)
      t('저장 버튼이 화면 안', !!v.saveVisible)

      // 저장까지
      await composer.webContents.executeJavaScript(`
        (() => {
          const ta = document.querySelector('textarea')
          const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
          set.call(ta, 'E2E 저장 테스트')
          ta.dispatchEvent(new Event('input', { bubbles: true }))
          ;[...document.querySelectorAll('button')].find(b => b.textContent.trim() === '저장').click()
        })()
      `)
      await sleep(1500)
      t('저장 후 입력 창이 닫힘', !find('composer'))

      const inMini = await mini.webContents.executeJavaScript(`
        document.querySelectorAll('svg circle[opacity]').length
      `)
      t('저장된 핀이 위젯 다이얼에 즉시 반영', inMini >= 1, `마커 ${inMini}개`)

      // 전역 단축키 경로: 메인이 보내는 quick-pin 이벤트만으로도 입력 창이 열려야 한다.
      // (이 경로가 예전에 Cmd+Shift+P 로 등록돼 다른 앱의 명령 팔레트와 충돌했다)
      mini.webContents.send('shortcut:quick-pin')
      await sleep(1500)
      t('빠른 기록 단축키 경로로도 입력 창이 열림', !!find('composer'))
      find('composer')?.destroy()
    }
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.message) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\nE2E 통과' : `\n실패 ${fail}건`)

  // 임시 데이터 정리
  try {
    require('node:fs').rmSync(sandbox, { recursive: true, force: true })
  } catch {
    /* 무시 */
  }
  app.exit(fail === 0 ? 0 : 1)
})
