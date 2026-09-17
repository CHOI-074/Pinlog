// 온보딩 검사.
//
// 지키려는 것:
//  1. 첫 실행에만 뜨고, 닫는 경로(시작하기·건너뛰기·Esc)가 전부 '봤다'로 저장된다
//  2. 이미 기록이 있는 사용자(업데이트로 들어온 사람)에게는 뜨지 않는다
//  3. [다음]으로 부드럽게 넘어가는 도중에 장이 되돌아가지 않는다
//     — 스크롤 위치와 현재 장을 양방향으로 맞추다 보면 서로 싸우기 쉽다
//  4. 작은 폰(320x568)에서도 제목·본문·버튼이 잘리지 않는다
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-onb-')))
app.on('window-all-closed', () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ONE_PIN = [{ id: 'x', timestamp: Date.now() - 3600000, text: '예전 기록', tags: ['work'], isFocusMode: false }]

/** 저장소를 원하는 상태로 만들고 메인 화면을 연다 */
async function open({ pins = [], onboarding = null, width = 390, height = 844 } = {}) {
  const win = new BrowserWindow({ width, height, show: false, webPreferences: { offscreen: true } })
  const file = path.join(ROOT, 'out/renderer/index.html')
  await win.loadFile(file, { search: '?window=main' })
  await sleep(300)
  await win.webContents.executeJavaScript(`
    localStorage.clear();
    localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(pins))});
    localStorage.setItem('pinlog:theme', 'light');
    ${onboarding === null ? '' : `localStorage.setItem('pinlog:onboarding', '${onboarding}');`}
    true`)
  await win.loadFile(file, { search: '?window=main' })
  await sleep(1000)
  return win
}

const js = (win, code) => win.webContents.executeJavaScript(code)

const STATE = `(() => {
  const d = document.querySelector('[role="dialog"][aria-label="핀로그 사용법"]')
  if (!d) return { open: false, stored: localStorage.getItem('pinlog:onboarding') }
  const dots = [...d.querySelectorAll('button[aria-label$="안내로 이동"]')]
  const current = dots.findIndex((b) => b.getAttribute('aria-current') === 'step')
  const primary = [...d.querySelectorAll('button')].find((b) => ['다음', '시작하기'].includes(b.textContent.trim()))
  const skip = [...d.querySelectorAll('button')].find((b) => b.textContent.trim() === '건너뛰기')
  const visibleTitle = [...d.querySelectorAll('section')].find((s) => s.getAttribute('aria-hidden') === 'false')
  return {
    open: true,
    step: current,
    primary: primary && primary.textContent.trim(),
    skipVisible: !!skip && getComputedStyle(skip).visibility !== 'hidden',
    title: visibleTitle && visibleTitle.querySelector('h2').textContent,
    stored: localStorage.getItem('pinlog:onboarding')
  }
})()`

const click = (label) => `(() => {
  const d = document.querySelector('[role="dialog"]')
  const b = [...(d || document).querySelectorAll('button')].find((x) => x.textContent.trim() === ${JSON.stringify(label)})
  if (!b) return false
  b.click(); return true
})()`

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    /* ── 1. 첫 실행 ─────────────────────────────────────────── */
    let win = await open()
    let s = await js(win, STATE)
    t('첫 실행에 온보딩이 뜬다', s.open)
    t('첫 장에서 시작한다', s.step === 0, `step=${s.step}`)
    t('첫 장 제목', !!s.title && s.title.includes('한 번에 기록'), s.title)
    t('건너뛰기가 보인다', s.skipVisible)
    t('아직 저장된 값은 없다', s.stored === null, String(s.stored))

    /* ── 2. [다음] 도중에 되돌아가지 않는다 ─────────────────── */
    const trace = await js(win, `(async () => {
      const read = () => {
        const dots = [...document.querySelectorAll('button[aria-label$="안내로 이동"]')]
        return dots.findIndex((b) => b.getAttribute('aria-current') === 'step')
      }
      ${click('다음')}
      const seen = []
      for (let i = 0; i < 30; i++) { seen.push(read()); await new Promise(r => setTimeout(r, 30)) }
      const sc = document.querySelector('.snap-x')
      return { seen, left: sc.scrollLeft, width: sc.clientWidth }
    })()`)
    const bounced = trace.seen.some((v, i) => i > 0 && trace.seen[i - 1] === 1 && v === 0)
    t('[다음] 도중 장이 되돌아가지 않는다', !bounced && trace.seen.at(-1) === 1, trace.seen.join(''))
    t('[다음] 후 스크롤이 두 번째 장에 멈춘다',
      Math.abs(trace.left - trace.width) <= 2, `${trace.left} / ${trace.width}`)

    s = await js(win, STATE)
    t('두 번째 장 제목', !!s.title && s.title.includes('색으로'), s.title)

    /* ── 3. 손가락으로 넘긴 것처럼 스크롤 ───────────────────── */
    await js(win, `(() => { const sc = document.querySelector('.snap-x'); sc.scrollLeft = sc.clientWidth * 2; true })()`)
    await sleep(400)
    s = await js(win, STATE)
    t('스와이프하면 점이 따라온다', s.step === 2, `step=${s.step}`)
    t('마지막 장은 [시작하기]', s.primary === '시작하기', s.primary)
    t('마지막 장에서는 건너뛰기가 숨는다', !s.skipVisible)

    /* ── 4. 시작하기 → 저장 → 다시 열어도 안 뜸 ─────────────── */
    await js(win, click('시작하기'))
    await sleep(300)
    s = await js(win, STATE)
    t('[시작하기]로 닫힌다', !s.open)
    t('본 버전이 저장된다', s.stored === '1', String(s.stored))
    t('닫힌 뒤 메인 화면 스크롤이 풀린다',
      (await js(win, `document.body.style.overflow`)) !== 'hidden')

    await win.loadFile(path.join(ROOT, 'out/renderer/index.html'), { search: '?window=main' })
    await sleep(900)
    s = await js(win, STATE)
    t('다시 켜면 온보딩이 안 뜬다', !s.open)

    /* ── 5. 사용법 다시 보기 ────────────────────────────────── */
    const reopened = await js(win, click('사용법 다시 보기'))
    await sleep(300)
    s = await js(win, STATE)
    t('[사용법 다시 보기]가 있다', reopened)
    t('다시 보기는 첫 장부터', s.open && s.step === 0, `step=${s.step}`)

    /* ── 6. Esc 로 닫기 ─────────────────────────────────────── */
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
    await sleep(300)
    s = await js(win, STATE)
    t('Esc 로 닫힌다', !s.open)
    win.destroy()
    await sleep(150)

    /* ── 7. 건너뛰기도 '봤다'로 저장 ─────────────────────────── */
    win = await open()
    await js(win, click('건너뛰기'))
    await sleep(300)
    s = await js(win, STATE)
    t('[건너뛰기]로 닫힌다', !s.open)
    t('건너뛰어도 봤다로 저장된다', s.stored === '1', String(s.stored))
    win.destroy()
    await sleep(150)

    /* ── 8. 기존 사용자 ─────────────────────────────────────── */
    win = await open({ pins: ONE_PIN })
    s = await js(win, STATE)
    t('기록이 이미 있으면 온보딩을 건너뛴다', !s.open)
    await sleep(200)
    s = await js(win, STATE)
    t('기존 사용자도 봤다로 기록해 둔다 (버전 올리면 그때 뜬다)', s.stored === '1', String(s.stored))
    win.destroy()
    await sleep(150)

    /* ── 9. 버전이 오르면 다시 뜬다 (예전 버전만 본 사람) ───── */
    win = await open({ onboarding: 0 })
    s = await js(win, STATE)
    t('저장값이 현재 버전보다 낮으면 뜬다', s.open)
    win.destroy()
    await sleep(150)

    /* ── 10. 화면 크기별로 잘리지 않는지 ────────────────────── */
    for (const [w, h, name] of [[390, 844, '일반 폰'], [320, 568, '작은 폰(SE)'], [980, 700, '데스크탑 창']]) {
      win = await open({ width: w, height: h })
      for (let page = 0; page < 3; page++) {
        const lay = await js(win, `(async () => {
          // 온보딩 안으로 좁힌다 — 메인 화면(덮개 아래)에도 <section> 이 있다
          const dlg = document.querySelector('[role="dialog"]')
          const sc = dlg.querySelector('.snap-x')
          sc.scrollLeft = sc.clientWidth * ${page}
          await new Promise(r => setTimeout(r, 300))
          const sec = [...dlg.querySelectorAll('section')][${page}]
          const vh = window.innerHeight, vw = window.innerWidth
          const box = (el) => el.getBoundingClientRect()
          const inside = (r) => r.top >= -1 && r.bottom <= vh + 1
          const card = box(sec.querySelector('.glass'))
          const h2 = box(sec.querySelector('h2'))
          const p = box(sec.querySelector('p'))
          const btn = box([...dlg.querySelectorAll('button')].find(b => ['다음','시작하기'].includes(b.textContent.trim())))
          const skip = box([...dlg.querySelectorAll('button')].find(b => b.textContent.trim() === '건너뛰기'))
          return {
            card: inside(card), title: inside(h2), body: inside(p), button: inside(btn),
            // 본문이 아래 점·버튼 영역을 덮으면 안 된다
            bodyAboveButton: p.bottom <= btn.top,
            cardBelowSkip: card.top >= skip.bottom - 1,
            hOverflow: document.documentElement.scrollWidth > vw + 1
          }
        })()`)
        const ok = lay.card && lay.title && lay.body && lay.button && lay.bodyAboveButton && lay.cardBelowSkip && !lay.hOverflow
        t(`${name} ${w}x${h} · ${page + 1}장 잘림 없음`, ok, ok ? '' : JSON.stringify(lay))
      }
      win.destroy()
      await sleep(150)
    }
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.stack) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\n온보딩 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
