// 모바일(PWA) 화면을 실제 폰 크기로 렌더해 PNG 로 저장한다.
// 웹 빌드(dist-web)를 그대로 띄우므로 데스크탑 번들이 아니라 진짜 PWA 코드를 본다.
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
const OUT = process.argv[3] || path.join(os.tmpdir(), 'pinlog-mobile')
const THEME = process.argv[4] || 'dark'

app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-mob-')))
app.on('window-all-closed', () => {})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const at = (h, m) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}
const SAMPLE = [
  { id: '1', timestamp: at(9, 10), text: '메일 정리하고 오늘 할 일 추리기', tags: ['work'], isFocusMode: false },
  { id: '2', timestamp: at(10, 0), text: '핀로그 미니모드 드래그 버그 수정', tags: ['work'], isFocusMode: true },
  { id: '3', timestamp: at(11, 30), text: '팀 스탠드업', tags: ['meeting'], isFocusMode: false },
  { id: '4', timestamp: at(13, 20), text: '커피 마시며 산책', tags: ['break'], isFocusMode: false },
  { id: '5', timestamp: at(14, 5), text: '포트폴리오 사이트 레이아웃 잡기', tags: ['study'], isFocusMode: true },
  { id: '6', timestamp: at(16, 40), text: '자소서 3번 문항 다시 씀', tags: ['study'], isFocusMode: false }
]

// iPhone 14 / 갤럭시 S 계열에 가까운 논리 해상도
const DEVICE = { width: 390, height: 844 }

async function shoot(name, { view = 'analog', after } = {}) {
  const win = new BrowserWindow({
    ...DEVICE,
    show: false,
    backgroundColor: THEME === 'light' ? '#f4f6f9' : '#0c1016',
    webPreferences: { offscreen: true }
  })
  const file = path.join(ROOT, 'dist-web/index.html')

  await win.loadFile(file, { search: '?window=main' })
  await wait(500)
  await win.webContents.executeJavaScript(
    `localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(SAMPLE))});
     localStorage.setItem('pinlog:view', ${JSON.stringify(view)});
     localStorage.setItem('pinlog:theme', ${JSON.stringify(THEME)}); true`
  )
  await win.loadFile(file, { search: '?window=main' })
  await wait(1000)
  if (after) await win.webContents.executeJavaScript(after)
  await wait(700)

  // 세로로 긴 화면이라 스크롤 전체가 아니라 첫 화면만 찍는다
  const img = await win.webContents.capturePage()
  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG())

  const info = await win.webContents.executeJavaScript(`
    (() => {
      const doc = document.documentElement
      return {
        // 가로 스크롤이 생기면 레이아웃이 화면을 넘친 것이다
        overflowX: doc.scrollWidth > doc.clientWidth,
        scrollW: doc.scrollWidth, clientW: doc.clientWidth,
        fab: !!document.querySelector('button[aria-label="지금 기록하기"]'),
        // 안전영역 유틸리티(.safe-x)가 Tailwind 의 px-* 를 덮어써 좌우 여백이
        // 0이 된 적이 있다. 안전영역이 0인 환경에서도 최소 여백은 지켜져야 한다.
        pad: (() => {
          const h = document.querySelector('header')
          const b = h && h.nextElementSibling
          const g = (el, p) => el ? parseFloat(getComputedStyle(el)[p]) : 0
          return {
            headerX: Math.min(g(h,'paddingLeft'), g(h,'paddingRight')),
            bodyX: Math.min(g(b,'paddingLeft'), g(b,'paddingRight'))
          }
        })()
      }
    })()
  `)
  console.log(
    `  ${name}.png  ${DEVICE.width}x${DEVICE.height}` +
      `  가로넘침=${info.overflowX ? `예 (${info.scrollW}>${info.clientW})` : '아니오'}` +
      `  FAB=${info.fab ? '있음' : '없음'}  여백=${info.pad.headerX}/${info.pad.bodyX}px`
  )
  win.destroy()
  await wait(150)
  return info
}

app.whenReady().then(async () => {
  const a = await shoot('m1-main-analog')
  const b = await shoot('m2-main-digital', { view: 'digital' })
  const c = await shoot('m3-composer', {
    after: `document.querySelector('button[aria-label="지금 기록하기"]').click(); true`
  })

  // 가로 넘침 + 여백 0 을 모두 실패로 본다
  const bad = [a, b, c].filter((r) => r.overflowX || r.pad.headerX < 12 || r.pad.bodyX < 12).length
  console.log(`\n저장 위치: ${OUT}`)
  console.log(bad === 0 ? '모바일 레이아웃 정상 (가로 넘침 없음, 좌우 여백 확보)' : `레이아웃 문제 ${bad}건`)
  app.exit(bad === 0 ? 0 : 1)
})
