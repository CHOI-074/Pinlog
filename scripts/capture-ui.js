// 각 화면을 오프스크린으로 렌더해 PNG 로 저장한다.
// 디자인 논의용 — 실제 사용자 데이터는 건드리지 않고 샘플 기록을 주입한다.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
const OUT = process.argv[3] || path.join(os.tmpdir(), 'pinlog-ui')
const THEME = process.argv[4] || 'dark'   // light | dark

app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-shot-')))
app.on('window-all-closed', () => {})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** 오늘 날짜에 붙인 샘플 기록 — 타임라인이 비어 보이지 않게 */
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
  { id: '5', timestamp: at(14, 5), text: '포트폴리오 사이트 레이아웃 잡기', tags: ['study', '사이드프로젝트'], isFocusMode: true },
  { id: '6', timestamp: at(16, 40), text: '자소서 3번 문항 다시 씀', tags: ['study'], isFocusMode: false }
]

async function shoot(
  name,
  { width, height, search, backgroundColor = THEME === 'light' ? '#f4f6f9' : '#070a0f', after, view = 'analog' }
) {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    backgroundColor,
    webPreferences: { offscreen: true }
  })
  const file = path.join(ROOT, 'out/renderer/index.html')

  // 1) 한 번 띄워 localStorage 에 샘플 주입
  await win.loadFile(file, { search })
  await wait(500)
  // 뷰 상태(pinlog:view)도 명시적으로 고정한다 — 안 그러면 직전 샷의 값이 새어 들어온다
  await win.webContents.executeJavaScript(
    `localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(SAMPLE))});
     localStorage.setItem('pinlog:view', ${JSON.stringify(view)});
     localStorage.setItem('pinlog:theme', ${JSON.stringify(THEME)}); true`
  )
  // 2) 주입된 상태로 다시 로드
  await win.loadFile(file, { search })
  await wait(900)

  if (after) await win.webContents.executeJavaScript(after)
  await wait(700)

  const img = await win.webContents.capturePage()
  const out = path.join(OUT, `${name}.png`)
  fs.writeFileSync(out, img.toPNG())
  console.log(`  ${name}.png  ${width}x${height}`)
  win.destroy()
  await wait(150)
}

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })

  // 미니 위젯은 투명 배경이라, 데스크탑처럼 보이게 중간 회색을 깔고 찍는다
  await shoot('1-mini-analog', {
    width: 220, height: 220, search: '?window=mini', backgroundColor: THEME === 'light' ? '#c3c9d4' : '#4a5160'
  })

  await shoot('2-mini-analog-hover', {
    width: 220, height: 220, search: '?window=mini', backgroundColor: '#4a5160',
    // 컨트롤 바는 hover 시에만 뜨므로 강제로 노출
    after: `document.querySelector('.z-20').className =
      document.querySelector('.z-20').className.replace('pointer-events-none opacity-0','opacity-100'); true`
  })

  await shoot('3-mini-digital', {
    width: 280, height: 132, search: '?window=mini', backgroundColor: '#4a5160', view: 'digital'
  })

  await shoot('4-composer', { width: 380, height: 620, search: '?window=composer' })

  await shoot('5-main-analog', { width: 980, height: 700, search: '?window=main' })

  await shoot('6-main-digital', {
    width: 980, height: 700, search: '?window=main', view: 'digital'
  })

  console.log(`\n저장 위치: ${OUT}`)
  app.exit(0)
})
