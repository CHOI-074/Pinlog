// 미니 위젯이 창 안에 온전히 들어가는지 검사한다.
//
// aspect-square 요소는 기본적으로 '너비' 기준으로 정사각형이 된다.
// 컨테이너에 위/아래 여백이 붙어 세로가 가로보다 좁아지면 아래가 잘리는데,
// 타입체크로도 렌더 에러로도 안 잡히고 캡처를 눈으로 봐야만 보인다.
const { app, BrowserWindow } = require('electron')
const path = require('path')

const ROOT = process.argv[2] || process.cwd()
app.on('window-all-closed', () => {})

// shared/types.ts 의 MINI_SIZE 와 맞출 것
const SIZES = {
  analog: { width: 220, height: 220 },
  digital: { width: 280, height: 132 }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const FIT = `
  (async () => {
    await new Promise(r => setTimeout(r, 400))
    const clock = document.querySelector('.rounded-full.aspect-square')
      || document.querySelector('[class*="aspect-square"]')
    const card = document.querySelector('.rounded-2xl')
    const el = clock || card
    if (!el) return { error: '시계/카드를 찾지 못함' }
    const r = el.getBoundingClientRect()
    const W = window.innerWidth, H = window.innerHeight
    return {
      W, H,
      left: Math.round(r.left), top: Math.round(r.top),
      right: Math.round(r.right), bottom: Math.round(r.bottom),
      w: Math.round(r.width), h: Math.round(r.height),
      // 1px 은 반올림 오차로 본다
      fits: r.left >= -1 && r.top >= -1 && r.right <= W + 1 && r.bottom <= H + 1,
      square: Math.abs(r.width - r.height) <= 1,
      // 창을 지나치게 적게 채우면(60% 미만) 여백 계산이 틀어진 것이다
      fill: Math.round((Math.max(r.width, r.height) / Math.min(W, H)) * 100)
    }
  })()
`

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  for (const [view, size] of Object.entries(SIZES)) {
    const win = new BrowserWindow({
      ...size,
      show: false,
      webPreferences: { offscreen: true }
    })
    const file = path.join(ROOT, 'out/renderer/index.html')
    await win.loadFile(file, { search: '?window=mini' })
    await wait(400)
    await win.webContents.executeJavaScript(
      `localStorage.setItem('pinlog:view', ${JSON.stringify(view)}); true`
    )
    await win.loadFile(file, { search: '?window=mini' })
    await wait(900)

    const r = await win.webContents.executeJavaScript(FIT)
    win.destroy()
    await wait(150)

    if (r.error) {
      t(`${view} 위젯`, false, r.error)
      continue
    }
    const box = `${r.w}x${r.h} in ${r.W}x${r.H}`
    t(`${view} 위젯이 창 안에 온전히 들어감`, r.fits, box)
    t(`${view} 위젯이 창을 충분히 채움`, r.fill >= 60, `${r.fill}%`)
    if (view === 'analog') t('시계가 정사각형으로 렌더', r.square, box)
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '위젯 크기 정상' : `실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
