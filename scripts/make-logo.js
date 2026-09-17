// 앱인토스 콘솔용 앱 로고(600x600 정사각형)를 만든다.
//
// 마크: 핀(위치) 안에 시계 문자판 — '시간을 핀으로 남긴다'는 앱 이름 그대로의 조형.
// 색은 앱 팔레트를 그대로 쓴다 (index.css 의 다크 토큰).
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const OUT = path.join(process.cwd(), 'brand')
app.on('window-all-closed', () => {})

const BG_TOP = '#161c26'
const BG_BOTTOM = '#0a0e14'
const PIN = '#7aa2f7'
const FOCUS = '#f5b544'

const SIZE = 600
/** 마크가 캔버스에서 차지하는 비율. 너무 꽉 차면 작게 줄였을 때 답답해 보인다. */
const INSET = 0.58

const page = `
<style>
  html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;overflow:hidden}
  body{
    background:linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%);
    display:flex;align-items:center;justify-content:center;
  }
  svg{display:block}
</style>
<svg viewBox="0 0 100 100" width="${Math.round(SIZE * INSET)}" height="${Math.round(SIZE * INSET)}"
     fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- 핀 외곽 -->
  <path d="M50 95C50 95 82 65 82 42A32 32 0 0 0 18 42C18 65 50 95 50 95Z"
        stroke="${PIN}" stroke-width="7"/>
  <!-- 시계 문자판 -->
  <circle cx="50" cy="42" r="17" stroke="${PIN}" stroke-width="5" opacity="0.55"/>
  <!-- 12시 / 3시 / 6시 / 9시 눈금 -->
  <path d="M50 29v4M63 42h-4M50 55v-4M37 42h4" stroke="${PIN}" stroke-width="3.4" opacity="0.75"/>
  <!-- 바늘: 시침(짧고 굵게) + 분침(길게) -->
  <path d="M50 42V33" stroke="${FOCUS}" stroke-width="5.4"/>
  <path d="M50 42h9.5" stroke="${FOCUS}" stroke-width="4"/>
  <circle cx="50" cy="42" r="2.6" fill="${FOCUS}" stroke="none"/>
</svg>`

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const win = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    webPreferences: { offscreen: true }
  })
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(page))
  await new Promise((r) => setTimeout(r, 500))
  const img = await win.webContents.capturePage()
  const file = path.join(OUT, 'app-logo-600.png')
  fs.writeFileSync(file, img.toPNG())
  console.log(`  app-logo-600.png  ${SIZE}x${SIZE}  (${(fs.statSync(file).size / 1024).toFixed(0)}KB)`)
  console.log(`저장 위치: ${OUT}`)
  win.destroy()
  app.exit(0)
})
