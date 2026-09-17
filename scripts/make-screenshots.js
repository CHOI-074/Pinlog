// 앱인토스 콘솔 등록용 앱 스크린샷.
//
// - **토스 빌드(dist/)** 를 찍는다. PWA 빌드와 화면이 다르다('하루 요약' 카드가 없다).
// - **라이트 모드** 로 찍는다. 검수 기준이 라이트라 토스 어댑터 기본값도 라이트다 —
//   실제 사용자가 보는 화면과 스크린샷이 달라지면 안 된다.
// - 폰 레이아웃(390x844)을 zoomFactor 2 로 렌더해 780x1688 로 뽑는다.
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'brand/screenshots')

app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-shot-')))
app.on('window-all-closed', () => {})

// 앱인토스 콘솔 스크린샷 규격
const TARGET = { width: 636, height: 1048 }
// 폰다운 가로폭(390)을 유지하면서 목표 종횡비에 맞춘 뷰포트.
// 390 x 643 = 0.6065, 636 x 1048 = 0.6069 — 차이는 1px 미만이라 리사이즈에서 보이지 않는다.
const CSS = { width: 390, height: Math.round((390 * TARGET.height) / TARGET.width) }
const SCALE = 2

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const at = (h, m) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}
const SAMPLE = [
  { id: "1", timestamp: at(8, 40), text: "출근길에 오늘 할 일 정리", tags: ["work"], isFocusMode: false },
  { id: "2", timestamp: at(9, 10), text: "메일 정리하고 회신", tags: ["work"], isFocusMode: false },
  { id: "3", timestamp: at(10, 0), text: "기획서 초안 작성", tags: ["work"], isFocusMode: true },
  { id: "4", timestamp: at(11, 30), text: "팀 스탠드업", tags: ["meeting"], isFocusMode: false },
  { id: "5", timestamp: at(12, 10), text: "점심", tags: ["break"], isFocusMode: false },
  { id: "6", timestamp: at(13, 20), text: "커피 마시며 산책", tags: ["break"], isFocusMode: false },
  { id: "7", timestamp: at(14, 5), text: "포트폴리오 사이트 레이아웃 잡기", tags: ["study"], isFocusMode: true },
  { id: "8", timestamp: at(15, 40), text: "디자인 피드백 반영", tags: ["work"], isFocusMode: false },
  { id: "9", timestamp: at(16, 40), text: "자소서 3번 문항 다시 씀", tags: ["study"], isFocusMode: true },
  { id: "10", timestamp: at(18, 20), text: "저녁 먹고 산책", tags: ["break"], isFocusMode: false },
  { id: "11", timestamp: at(20, 0), text: "리액트 상태관리 정리", tags: ["study"], isFocusMode: true },
  { id: "12", timestamp: at(21, 30), text: "내일 할 일 적어두기", tags: [], isFocusMode: false }
]

async function shoot(name, { view = 'analog', after, scrollTo = null } = {}) {
  const win = new BrowserWindow({
    width: CSS.width * SCALE,
    height: CSS.height * SCALE,
    show: false,
    backgroundColor: '#f4f6f9',
    webPreferences: { offscreen: true, zoomFactor: SCALE }
  })
  const file = path.join(ROOT, 'dist/index.html')

  await win.loadFile(file)
  await wait(500)
  await win.webContents.executeJavaScript(
    `localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(SAMPLE))});
     localStorage.setItem('pinlog:view', ${JSON.stringify(view)});
     localStorage.setItem('pinlog:theme', 'light'); true`
  )
  await win.loadFile(file)
  await wait(1100)
  // zoomFactor 는 로드마다 초기화될 수 있어 다시 적용한다
  win.webContents.setZoomFactor(SCALE)
  await wait(300)

  if (scrollTo) {
    // 픽셀값 대신 요소를 맨 위로 올린다 — 스크롤 컨테이너가 무엇이든 정확히 맞는다
    const found = await win.webContents.executeJavaScript(
      `(() => {
         const needle = ${JSON.stringify(scrollTo)}
         const el = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes(needle))
         el?.scrollIntoView({ block: 'start' })
         return !!el
       })()`
    )
    if (!found) console.warn(`  (경고) '${scrollTo}' 헤더를 찾지 못해 스크롤하지 않았습니다`)
    await wait(400)
  }
  if (after) {
    await win.webContents.executeJavaScript(after)
    await wait(700)
  }

  /*
   * 스크롤바를 숨긴다.
   * 실제 폰에서는 스크롤 중에만 잠깐 보였다 사라지는데, 캡처에는 막대가 그대로 찍혀
   * 화면이 오른쪽에서 잘린 것처럼 보인다. 스토어 스크린샷에 있으면 안 되는 요소다.
   */
  await win.webContents.insertCSS(
    "::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}"
  )
  await wait(300)

  const img = await win.webContents.capturePage()
  fs.mkdirSync(OUT, { recursive: true })
  const out = path.join(OUT, `${name}.png`)
  // 캡처는 기기 배율까지 곱해져 CSS 크기의 4배로 나온다. 콘솔 규격으로 줄인다.
  const resized = img.resize({ width: TARGET.width, height: TARGET.height, quality: "best" })
  fs.writeFileSync(out, resized.toPNG())
  const size = resized.getSize()
  console.log(`  ${name}.png  ${size.width}x${size.height}  (${(fs.statSync(out).size / 1024).toFixed(0)}KB)`)
  win.destroy()
  await wait(150)
}

app.whenReady().then(async () => {
  // 1) 하루가 어떻게 쪼개졌는지 — 이 앱의 핵심 가치
  await shoot('1-timeline', { scrollTo: '타임라인' })

  // 2) 빠른 기록 — 실제로 쓰는 순간
  await shoot('2-compose', {
    after: `
      (() => {
        document.querySelector('button[aria-label="지금 기록하기"]').click()
        return new Promise(r => setTimeout(() => {
          const ta = document.querySelector('textarea')
          const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set
          set.call(ta, '포트폴리오 사이트 레이아웃 잡기')
          ta.dispatchEvent(new Event('input', { bubbles: true }))
          // 프리셋 '개인공부' 선택 + '선택과 집중' 켜기
          ;[...document.querySelectorAll('button')].find(b => b.textContent.includes('개인공부'))?.click()
          setTimeout(() => {
            ;[...document.querySelectorAll('button[aria-pressed]')]
              .find(b => b.textContent.includes('선택과 집중'))?.click()
            r(true)
          }, 200)
        }, 400))
      })()`
  })

  // 3) 아날로그 시계 — 하루의 밀도를 한눈에
  await shoot('3-clock')

  console.log(`\n저장 위치: ${OUT}`)
  app.exit(0)
})
