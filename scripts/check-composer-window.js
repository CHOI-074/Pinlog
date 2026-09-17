// 입력 전용 독립 창(COMPOSER_SIZE)이 잘리지 않고, 쿼리스트링 초기값을 제대로 받는지 검사한다.
// 예전 구조는 입력 UI 가 미니 창(220px) 안 모달이라 항상 잘렸다.
const { app, BrowserWindow } = require('electron')
const path = require('path')

const ROOT = process.argv[2] || process.cwd()
const SIZE = { width: 380, height: 620 } // shared/types.ts 의 COMPOSER_SIZE 와 맞출 것

app.on('window-all-closed', () => {})

const load = async (search) => {
  const win = new BrowserWindow({
    ...SIZE,
    show: false,
    webPreferences: { offscreen: true }
  })
  await win.loadFile(path.join(ROOT, 'out/renderer/index.html'), { search })
  await new Promise((r) => setTimeout(r, 1200))
  return win
}

const LAYOUT = `
  (async () => {
    const vis = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), bottom: Math.round(r.bottom),
               fullyVisible: r.top >= -1 && r.bottom <= window.innerHeight + 1 }
    }
    const byText = (t) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t)
    const scroller = document.querySelector('.overflow-y-auto')

    // drag/no-drag 순서 검사 (독립 창은 헤더만 드래그 핸들)
    const items = [...document.querySelectorAll('.drag-region, .no-drag')].map((el, i) => ({
      el, i, drag: el.classList.contains('drag-region'), r: el.getBoundingClientRect(),
      name: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 12) || 'el'
    })).filter(x => x.r.width > 0 && x.r.height > 0)
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    const dragBroken = items.filter(n => !n.drag).filter(n =>
      items.some(d => d.drag && d.i > n.i && overlaps(n.r, d.r) && !d.el.contains(n.el))
    ).map(n => n.name)

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      hasTextarea: !!document.querySelector('textarea'),
      time: document.querySelector('input[type=time]') && document.querySelector('input[type=time]').value,
      editing: !![...document.querySelectorAll('span')].find(s => s.textContent === '수정 중'),
      text: document.querySelector('textarea') && document.querySelector('textarea').value,
      tags: [...document.querySelectorAll('button')].filter(b => b.textContent.startsWith('#')).map(b => b.textContent.replace(' ✕','')),
      needsScroll: scroller ? scroller.scrollHeight > scroller.clientHeight + 1 : null,
      textarea: vis(document.querySelector('textarea')),
      tagInput: vis(document.querySelector('input[placeholder*="태그"]')),
      saveButton: vis(byText('저장')),
      dragBroken
    }
  })()
`

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok) => checks.push([name, ok])

  // --- 새 핀 ---
  const ts = new Date()
  ts.setHours(14, 5, 0, 0)
  let win = await load(`?window=composer&ts=${ts.getTime()}`)
  const a = await win.webContents.executeJavaScript(LAYOUT)
  win.destroy()

  t('입력 창이 바로 입력 상태로 열림', a.hasTextarea)
  t('ts 쿼리로 시각 초기화 (14:05)', a.time === '14:05')
  t('스크롤 없이 전부 보임', a.needsScroll === false)
  t('본문 입력창 완전 노출', !!a.textarea && a.textarea.fullyVisible)
  t('태그 입력창 완전 노출', !!a.tagInput && a.tagInput.fullyVisible)
  t('저장 버튼 완전 노출', !!a.saveButton && a.saveButton.fullyVisible)
  t('드래그 영역에 가려진 버튼 없음', a.dragBroken.length === 0)

  // --- 기존 핀 수정 ---
  const pin = {
    id: 'test-pin-1',
    timestamp: ts.getTime() - 3600_000,
    text: '기존 기록 수정 테스트',
    tags: ['work', '회고'],
    isFocusMode: true
  }
  win = await load('?window=composer')
  await win.webContents.executeJavaScript(
    `localStorage.setItem('pinlog:pins', JSON.stringify([${JSON.stringify(pin)}]))`
  )
  win.destroy()

  win = await load(`?window=composer&ts=${pin.timestamp}&id=${pin.id}`)
  const b = await win.webContents.executeJavaScript(LAYOUT)
  win.destroy()

  t('id 쿼리로 기존 핀 로드', b.text === pin.text)
  t('수정 중 표시', b.editing)
  t('기존 태그 복원', b.tags.length === 2)
  t('수정 모드도 스크롤 없이 보임', b.needsScroll === false)

  let fail = 0
  for (const [name, ok] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}`)
  }
  console.log(`\n창 크기 ${a.viewport.w}x${a.viewport.h}`)
  console.log(fail === 0 ? '입력 창 정상' : `실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
