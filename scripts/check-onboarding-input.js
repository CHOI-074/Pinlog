// 온보딩을 '진짜 입력'으로 검사한다.
//
// check-onboarding.js 는 버튼을 코드로 눌렀다(element.click()). 그건 화면에서
// 무엇이 그 버튼 위를 덮고 있든 상관없이 핸들러를 바로 부른다 — 사람 손가락이
// 실제로 닿는지는 확인하지 못한다.
//
// 여기서는 Electron 의 sendInputEvent 로 마우스 다운/업을 좌표에 쏜다. 이 이벤트는
// Chromium 의 입력 파이프라인(히트 테스트 → pointer → mouse → click)을 그대로 탄다.
// 버튼 위에 투명한 무언가가 덮여 있거나, z-index 가 꼬였거나, 스크롤 컨테이너가
// 이벤트를 먹으면 여기서 실패한다.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-onb-input-')))
app.on('window-all-closed', () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 폰 크기. 오프스크린 창은 배율 없이 1:1 이라 좌표가 그대로 맞는다.
const W = 390
const H = 844

async function freshWindow({ pins = [] } = {}) {
  const win = new BrowserWindow({ width: W, height: H, show: false, webPreferences: { offscreen: true } })
  const file = path.join(ROOT, 'out/renderer/index.html')
  await win.loadFile(file, { search: '?window=main' })
  await sleep(300)
  await win.webContents.executeJavaScript(`
    localStorage.clear();
    localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(pins))});
    localStorage.setItem('pinlog:theme', 'light'); true`)
  await win.loadFile(file, { search: '?window=main' })
  await sleep(1200)
  return win
}

const js = (win, code) => win.webContents.executeJavaScript(code)

/** 라벨로 버튼을 찾아 화면 좌표(중심)와, 그 좌표에 실제로 무엇이 있는지 돌려준다 */
const locate = (win, label, scope = '[role="dialog"]') =>
  js(win, `(() => {
    const root = document.querySelector(${JSON.stringify(scope)}) || document
    const b = [...root.querySelectorAll('button')].find((x) => x.textContent.trim() === ${JSON.stringify(label)})
    if (!b) return null
    b.scrollIntoView({ block: 'center' })
    const r = b.getBoundingClientRect()
    const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2)
    const hit = document.elementFromPoint(x, y)
    return { x, y, covered: !(hit === b || b.contains(hit)),
             hit: hit ? hit.tagName + '.' + String(hit.className).slice(0, 60) : null }
  })()`)

/** 좌표에 실제 마우스 클릭(다운 → 업)을 보낸다 */
async function tap(win, x, y) {
  win.webContents.sendInputEvent({ type: 'mouseMove', x, y })
  win.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 })
  await sleep(40)
  win.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 })
  await sleep(400)
}

/** 클릭이 어느 요소에 도착했는지 기록한다 — 실패했을 때 원인을 바로 보려고 */
const recordClicks = (win) =>
  js(win, `window.__clicks = [];
    document.addEventListener('click', (e) => {
      const t = e.target.closest('button') || e.target
      window.__clicks.push((t.textContent || t.tagName).trim().slice(0, 12))
    }, true); true`)

const STATE = `(() => {
  const d = document.querySelector('[role="dialog"][aria-label="핀로그 사용법"]')
  const dots = d ? [...d.querySelectorAll('button[aria-label$="안내로 이동"]')] : []
  return {
    open: !!d,
    step: dots.findIndex((b) => b.getAttribute('aria-current') === 'step'),
    stored: localStorage.getItem('pinlog:onboarding'),
    clicks: window.__clicks || []
  }
})()`

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    /* ── 1. 건너뛰기를 실제로 누른다 ───────────────────────── */
    let win = await freshWindow()
    await recordClicks(win)
    let s = await js(win, STATE)
    t('첫 실행에 온보딩이 뜬다', s.open)

    let at = await locate(win, '건너뛰기')
    t('건너뛰기 버튼 위를 덮는 것이 없다', at && !at.covered, at && at.hit)
    await tap(win, at.x, at.y)
    s = await js(win, STATE)
    t('실제 탭으로 [건너뛰기]가 닫힌다', !s.open, `클릭 도착: ${s.clicks.join(' / ') || '없음'}`)
    t('실제 탭으로 닫아도 봤다로 저장된다', s.stored === '1', String(s.stored))
    win.destroy()
    await sleep(150)

    /* ── 2. 다음 → 다음 → 시작하기 전부 실제 탭 ─────────────── */
    win = await freshWindow()
    await recordClicks(win)
    for (const [expectStep, label] of [[1, '다음'], [2, '다음']]) {
      at = await locate(win, label)
      t(`[${label}] 버튼 위를 덮는 것이 없다 (→ ${expectStep + 1}장)`, at && !at.covered, at && at.hit)
      await tap(win, at.x, at.y)
      await sleep(500) // 스크롤이 멈추고 장이 반영될 시간
      s = await js(win, STATE)
      t(`실제 탭 [${label}] → ${expectStep + 1}장`, s.step === expectStep,
        `step=${s.step} / 클릭 도착: ${s.clicks.slice(-1)}`)
    }
    at = await locate(win, '시작하기')
    t('[시작하기] 버튼 위를 덮는 것이 없다', at && !at.covered, at && at.hit)
    await tap(win, at.x, at.y)
    s = await js(win, STATE)
    t('실제 탭 [시작하기]로 닫힌다', !s.open)
    t('실제 탭 [시작하기] 후 저장된다', s.stored === '1', String(s.stored))

    /* ── 3. 점을 눌러 장 이동 ──────────────────────────────── */
    // 다시 열어서 3번째 점을 누른다
    at = await locate(win, '사용법 다시 보기', 'body')
    t('[사용법 다시 보기] 위를 덮는 것이 없다', at && !at.covered, at && at.hit)
    await tap(win, at.x, at.y)
    s = await js(win, STATE)
    t('실제 탭 [사용법 다시 보기]로 열린다', s.open && s.step === 0, `open=${s.open} step=${s.step}`)

    const dot = await js(win, `(() => {
      const b = document.querySelector('button[aria-label="3번째 안내로 이동"]')
      const r = b.getBoundingClientRect()
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2)
      const hit = document.elementFromPoint(x, y)
      return { x, y, covered: !(hit === b || b.contains(hit)) }
    })()`)
    t('점 버튼 위를 덮는 것이 없다', !dot.covered)
    await tap(win, dot.x, dot.y)
    await sleep(500)
    s = await js(win, STATE)
    t('실제 탭으로 3번째 점 → 3장', s.step === 2, `step=${s.step}`)
    win.destroy()
    await sleep(150)

    /* ── 4. 기록이 있는 사람(테스트하는 사람이 대부분 이 상태) ── */
    win = await freshWindow({
      pins: [{ id: 'a', timestamp: Date.now() - 60000, text: '기존 기록', tags: ['work'], isFocusMode: false }]
    })
    await recordClicks(win)
    s = await js(win, STATE)
    t('기록이 있으면 처음엔 안 뜬다 (설계대로)', !s.open)
    at = await locate(win, '사용법 다시 보기', 'body')
    t('기록 있는 화면에서도 [사용법 다시 보기]가 가려지지 않는다', at && !at.covered, at && at.hit)
    await tap(win, at.x, at.y)
    s = await js(win, STATE)
    t('기록이 있어도 [사용법 다시 보기]로 온보딩을 볼 수 있다', s.open,
      `클릭 도착: ${s.clicks.join(' / ') || '없음'}`)
    win.destroy()
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.stack) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\n실제 입력으로도 온보딩 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
