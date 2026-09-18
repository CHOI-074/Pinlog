// 기록 중심 레이아웃: 카드 잘림, 스크롤, 빠른 기록 접근성 검사.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-desk-')))
app.on('window-all-closed', () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const at = (d, h) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, 0, 0, 0); return x.getTime() }
const PINS = Array.from({ length: 12 }, (_, i) => ({
  id: 'p' + i, timestamp: at(i % 4, 9 + (i % 8)), text: '기록 ' + i,
  tags: [['work', 'meeting', 'break', 'study'][i % 4]], isFocusMode: i % 3 === 0
}))

// 각 카드가 제 내용 높이만큼 서 있는지 + 캐릭터 그림이 카드 밖으로 잘리지 않는지
const MEASURE = `(() => {
  const aside = document.querySelector('aside')
  const kids = [...aside.children].filter((el) => el.getBoundingClientRect().height > 0)
  const crushed = kids
    .filter((el) => el.scrollHeight > el.clientHeight + 1)
    .map((el) => (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 10)) +
         ' ' + el.clientHeight + '/' + el.scrollHeight)
  const card = document.querySelector('button[aria-label="캐릭터 꾸미기"]')
  const svg = card.querySelector('svg').getBoundingClientRect()
  const box = card.getBoundingClientRect()
  return {
    crushed,
    avatarClipped: svg.top < box.top - 1 || svg.bottom > box.bottom + 1,
    asideScrolls: document.querySelector('.journal-scroll').scrollHeight > document.querySelector('.journal-scroll').clientHeight,
    presetsReachable: (() => {
      const b = [...document.querySelectorAll('.quick-presets button')].find((x) => x.textContent.trim() === '업무')
      b.scrollIntoView({ block: 'center' })
      const r = b.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return hit === b || b.contains(hit)
    })()
  }
})()`

async function open(width, height) {
  const win = new BrowserWindow({ width, height, show: false, webPreferences: { offscreen: true } })
  const file = path.join(ROOT, 'out/renderer/index.html')
  await win.loadFile(file, { search: '?window=main' })
  await sleep(300)
  await win.webContents.executeJavaScript(`localStorage.clear();
    localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(PINS))});
    localStorage.setItem('pinlog:theme', 'light'); true`)
  await win.loadFile(file, { search: '?window=main' })
  await sleep(1100)
  return win
}

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    // 980x700 = 데스크탑 메인 창 기본 크기, 나머지는 흔한 노트북·모니터 브라우저
    for (const [w, h] of [[980, 700], [1280, 800], [1440, 900]]) {
      const win = await open(w, h)
      const m = await win.webContents.executeJavaScript(MEASURE)
      t(`${w}x${h} 왼쪽 열 카드가 눌리지 않는다`, m.crushed.length === 0, m.crushed.join(', '))
      t(`${w}x${h} 캐릭터가 카드 밖으로 잘리지 않는다`, !m.avatarClipped)
      t(`${w}x${h} '한 번에 기록' 버튼을 누를 수 있다`, m.presetsReachable)

      if (w === 980) {
        t('980x700 에서는 본문이 스크롤된다', m.asideScrolls)
        // 음성 대조군 — 고치기 전처럼 자식이 줄어들게 되돌리면 잡혀야 한다
        const bad = await win.webContents.executeJavaScript(`(() => {
          document.querySelector('.companion-card').style.height = '24px'; document.querySelector('.companion-card').style.overflow = 'hidden'
          return true
        })()`)
        void bad
        await sleep(200)
        const neg = await win.webContents.executeJavaScript(MEASURE)
        t('음성 대조군: 높이가 잘못 고정된 카드는 검사가 잡는다', neg.crushed.length > 0 || neg.avatarClipped,
          neg.crushed.slice(0, 3).join(', ') || '못 잡음')
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
  console.log(fail === 0 ? '\n넓은 화면 레이아웃 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
