// Electron 드래그 영역 회귀 테스트.
//
// Electron 은 drag/no-drag 요소를 트리 순서대로 훑으며
//   drag    → region.union(rect)
//   no-drag → region.difference(rect)
// 를 순차 적용한다. 따라서 어떤 no-drag 요소보다 '뒤에' 오는 drag 요소가
// 그 요소를 덮으면, no-drag 가 취소되어 클릭이 창 드래그로 먹힌다.
const { app, BrowserWindow } = require('electron')
const path = require('path')

const ROOT = process.argv[2] || process.cwd()

const CHECK = `
  (async () => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms))
    const report = []

    const scan = (label) => {
      const els = [...document.querySelectorAll('.drag-region, .no-drag')]
      const items = els.map((el, i) => ({
        el, i,
        drag: el.classList.contains('drag-region'),
        r: el.getBoundingClientRect(),
        name: (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim().slice(0, 14) || el.className.split(' ')[0])
      })).filter(x => x.r.width > 0 && x.r.height > 0)

      const overlaps = (a, b) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

      const broken = []
      for (const noDrag of items.filter(x => !x.drag)) {
        // 자기 자신을 감싸는 조상 drag 는 항상 앞에 오므로 문제 없음.
        // 문제는 '뒤에 오면서 겹치는' drag 요소다.
        const covering = items.filter(d =>
          d.drag && d.i > noDrag.i && overlaps(noDrag.r, d.r) && !d.el.contains(noDrag.el)
        )
        if (covering.length) {
          broken.push({ noDrag: noDrag.name, coveredBy: covering.map(c => c.name) })
        }
      }
      report.push({ label, total: items.length, broken })
    }

    scan('아날로그 위젯')

    // 디지털 뷰로 전환
    const digital = [...document.querySelectorAll('button')].find(b => b.getAttribute('title') === '디지털')
    if (digital) { digital.click(); await wait(300); scan('디지털 위젯') }

    // 입력 팝업 열린 상태
    const analog = [...document.querySelectorAll('button')].find(b => b.getAttribute('title') === '아날로그')
    if (analog) { analog.click(); await wait(300) }
    const dial = document.querySelector('button[aria-label="지금 이 순간 핀 찍기"]')
    if (dial) { dial.click(); await wait(400); scan('입력 팝업 열림') }

    // --- 음성 대조군 ---
    // 컨트롤 바를 옛 순서(시계보다 앞)로 되돌려 놓고 같은 검사를 돌린다.
    // 여기서 반드시 '실패'해야 이 테스트가 실제로 버그를 잡는다는 뜻이다.
    const clock = document.querySelector('.drag-region')
    const bar = clock && clock.parentElement.querySelector('.z-20')
    if (clock && bar) {
      clock.parentElement.insertBefore(bar, clock)
      await wait(200)
      scan('[음성 대조군] 옛 순서')
      report[report.length - 1].expectBroken = true
    }

    return report
  })()
`

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 340,
    height: 560,
    show: false,
    webPreferences: { offscreen: true }
  })
  await win.loadFile(path.join(ROOT, 'out/renderer/index.html'), { search: '?window=mini' })
  await new Promise((r) => setTimeout(r, 1200))

  const report = await win.webContents.executeJavaScript(CHECK)

  let fail = 0
  for (const r of report) {
    const broken = r.broken.length > 0
    // 음성 대조군은 '깨져야' 정상 — 이 검사가 실제로 버그를 잡는다는 증거다
    const ok = r.expectBroken ? broken : !broken
    if (!ok) fail++
    console.log(
      `${ok ? '  ok' : 'FAIL'}  ${r.label}` +
        (r.expectBroken
          ? ` — 예상대로 ${r.broken.length}개 감지 (검사가 살아있음)`
          : ` — drag/no-drag ${r.total}개, 가려진 버튼 없음`)
    )
    if (broken && !r.expectBroken) {
      for (const b of r.broken) {
        console.log(`        "${b.noDrag}" 가 뒤에 오는 드래그 영역에 덮임 → ${b.coveredBy.join(', ')}`)
      }
    }
  }
  console.log(fail === 0 ? '\n드래그 영역 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
