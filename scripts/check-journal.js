// Redesign regression: real renderer, isolated storage, no live ads.
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-journal-')))
app.on('window-all-closed', () => {})
const ROOT = process.cwd()
const OUT = path.join(ROOT, 'design', 'journal-preview')
const wait = ms => new Promise(r => setTimeout(r, ms))
app.whenReady().then(async () => {
  let win
  const checks = []
  const check = (label, ok) => { checks.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`) }
  try {
    fs.mkdirSync(OUT, { recursive: true })
    win = new BrowserWindow({ width: 1440, height: 960, show: false, webPreferences: { offscreen: true } })
    const js = code => win.webContents.executeJavaScript(code)
    const click = text => js(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})?.click()`)
    const file = path.join(ROOT, 'dist-web/index.html')
    await win.loadFile(file); await wait(300)
    const today = new Date(); today.setHours(10, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const seed = [
      { id:'a', timestamp:+today, text:'창가에서 커피 한 잔', detail:'잠깐 멈춰 있으니 마음이 한결 가벼워졌다.', tags:['break'], isFocusMode:false },
      { id:'b', timestamp:+today + 3600000, text:'미뤄두었던 기획안 마무리', tags:['work'], isFocusMode:true },
      { id:'c', timestamp:+today + 7200000, text:'점심 먹고 동네 한 바퀴', tags:['산책'], isFocusMode:false },
      { id:'d', timestamp:+yesterday, text:'어제 읽은 책의 한 문장', tags:['study'], isFocusMode:false }
    ]
    await js(`localStorage.clear(); localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(seed))}); localStorage.setItem('pinlog:onboarding', '1'); localStorage.setItem('pinlog:theme', 'light')`)
    await win.loadFile(file); await wait(500)
    check('기본 화면은 오늘 기록만 표시', await js(`document.querySelectorAll('.timeline-entry').length === 3`))
    check('가로 넘침 없음', await js(`document.documentElement.scrollWidth === innerWidth`))
    fs.writeFileSync(path.join(OUT, 'desktop.png'), (await win.webContents.capturePage()).toPNG())
    await click('전체'); await wait(100)
    check('전체 기간 조회', await js(`document.querySelectorAll('.timeline-entry').length === 4`))
    await js(`(() => { const el=document.querySelector('input[type=search]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'어제'); el.dispatchEvent(new Event('input',{bubbles:true})) })()`); await wait(100)
    check('본문 검색', await js(`document.querySelectorAll('.timeline-entry').length === 1 && document.querySelector('.timeline-entry').textContent.includes('어제 읽은')`))
    await js(`(() => { const el=document.querySelector('input[type=search]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,''); el.dispatchEvent(new Event('input',{bubbles:true})) })()`)
    await click('오늘'); await click('휴식'); await wait(250)
    check('빠른 기록 저장', await js(`JSON.parse(localStorage.getItem('pinlog:pins')).length === 5`))
    await win.loadFile(file); await wait(400)
    check('재시작 후 기록 유지', await js(`document.querySelectorAll('.timeline-entry').length === 4`))
    await click('돌아보기'); await wait(150)
    check('회고는 실제 최근 7일 기록에서 계산', await js(`document.querySelector('.review-stats').textContent.includes('5남긴 순간') && document.querySelector('.review-stats').textContent.includes('2 / 7')`))
    fs.writeFileSync(path.join(OUT, 'review.png'), (await win.webContents.capturePage()).toPNG())
    await click('작은 작업실'); await wait(150)
    check('웹에서는 실제 광고 없는 상점을 표시하지 않음', await js(`!document.querySelector('.reward-rules') && !document.querySelector('[data-ad]')`))
    await click('나의 기록'); await wait(100)
    await js(`document.querySelector('button[aria-label="지금 기록하기"]').click()`); await wait(200)
    check('직접 기록 입력창 열림', await js(`!!document.querySelector('textarea')`))
    await js(`document.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown', {key:'Escape',bubbles:true}))`); await wait(100)
    // Reload clears any open sheet before responsive checks.
    await win.loadFile(file); await wait(300)
    for (const width of [320,390,768,980,1280]) {
      win.setSize(width, 844); await wait(150)
      check(`${width}px 콘텐츠 가로 넘침 없음`, await js(`document.documentElement.scrollWidth === innerWidth && document.querySelector('.journal-scroll').scrollWidth <= document.querySelector('.journal-scroll').clientWidth`))
      if (width === 390) fs.writeFileSync(path.join(OUT,'mobile.png'), (await win.webContents.capturePage()).toPNG())
    }
    win.setSize(390,844)
    await click('다크'); await wait(150)
    fs.writeFileSync(path.join(OUT,'mobile-dark.png'), (await win.webContents.capturePage()).toPNG())
    check('다크 모드 적용', await js(`document.documentElement.dataset.theme === 'dark'`))
    await js(`localStorage.setItem('pinlog:pins','[]'); localStorage.setItem('pinlog:theme','light')`)
    await win.loadFile(file); await wait(250)
    check('빈 화면에서 첫 기록 시작 가능', await js(`!!document.querySelector('.journal-empty button')`))
    fs.writeFileSync(path.join(OUT,'empty.png'), (await win.webContents.capturePage()).toPNG())
  } catch(e) { console.error(e); checks.push(false) }
  win?.destroy()
  app.exit(checks.every(Boolean) ? 0 : 1)
})
