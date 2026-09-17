// PWA 아이콘을 생성한다. 별도 디자인 툴 없이 Electron 오프스크린 렌더로 뽑는다.
//
// - any:      배경 여백이 적은 일반 아이콘
// - maskable: OS가 원/둥근사각형 등으로 잘라내므로 안전영역(80%) 안에 도형을 넣는다
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const OUT = path.join(process.cwd(), 'src/renderer/public/icons')
app.on('window-all-closed', () => {})

const BG = '#0c1016'
const PIN = '#7aa2f7'
const FOCUS = '#f5b544'

/** 핀 + 시계 눈금을 합친 마크. Icon.tsx 의 pin 과 같은 조형 언어. */
const mark = (scale) => `
  <svg viewBox="0 0 24 24" width="${scale}" height="${scale}" fill="none"
       stroke="${PIN}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 21.5s7.2-6.6 7.2-11.4A7.2 7.2 0 004.8 10.1C4.8 14.9 12 21.5 12 21.5z"/>
    <circle cx="12" cy="10" r="2.7"/>
    <path d="M12 8.4V10l1.5 1" stroke="${FOCUS}" stroke-width="1.5"/>
  </svg>`

const page = (size, inset) => `
  <style>
    html,body{margin:0;padding:0;background:${BG};width:${size}px;height:${size}px;overflow:hidden}
    .wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  </style>
  <div class="wrap">${mark(Math.round(size * inset))}</div>`

const shots = [
  { name: 'icon-192.png', size: 192, inset: 0.62 },
  { name: 'icon-512.png', size: 512, inset: 0.62 },
  // maskable 은 잘려나갈 가장자리를 감안해 도형을 더 작게
  { name: 'icon-maskable-512.png', size: 512, inset: 0.46 },
  // iOS 홈화면 아이콘 (마스크 없음, 모서리는 OS가 둥글림)
  { name: 'apple-touch-icon.png', size: 180, inset: 0.6 }
]

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  for (const s of shots) {
    const win = new BrowserWindow({
      width: s.size,
      height: s.size,
      show: false,
      webPreferences: { offscreen: true }
    })
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(page(s.size, s.inset)))
    await new Promise((r) => setTimeout(r, 400))
    const img = await win.webContents.capturePage()
    fs.writeFileSync(path.join(OUT, s.name), img.toPNG())
    console.log(`  ${s.name}  ${s.size}x${s.size}`)
    win.destroy()
    await new Promise((r) => setTimeout(r, 100))
  }
  console.log(`저장 위치: ${OUT}`)
  app.exit(0)
})
