// 활동 색 검사.
//
// 지키려는 것:
//   같은 활동은 화면 어디서나 같은 색이어야 한다. 타임라인 점, 하루 띠 막대,
//   프리셋 버튼, 태그 칩이 제각각이면 색은 정보가 아니라 장식이 된다.
//   유틸리티 클래스가 아니라 인라인 style 로 칠하고 있어서 타입 검사로는 안 잡힌다.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-cat-')))
app.on('window-all-closed', () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const at = (h, m) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

/** 프리셋 넷 + 직접 만든 태그 둘 + 태그 없는 기록 하나 */
const PINS = [
  { id: 'a', timestamp: at(9, 0), text: '업무', tags: ['work'], isFocusMode: false },
  { id: 'b', timestamp: at(10, 0), text: '회의', tags: ['meeting'], isFocusMode: false },
  { id: 'c', timestamp: at(11, 0), text: '휴식', tags: ['break'], isFocusMode: false },
  { id: 'd', timestamp: at(12, 0), text: '공부', tags: ['study'], isFocusMode: true },
  { id: 'e', timestamp: at(13, 0), text: '회고', tags: ['회고'], isFocusMode: false },
  { id: 'f', timestamp: at(14, 0), text: '운동', tags: ['운동'], isFocusMode: false },
  { id: 'g', timestamp: at(15, 0), text: '그냥 메모', tags: [], isFocusMode: false },
  // 프리셋 + 직접 태그가 섞인 기록 — 프리셋(업무) 색을 따라야 한다
  { id: 'h', timestamp: at(16, 0), text: '업무 회고', tags: ['work', '회고'], isFocusMode: false }
]

async function open(theme) {
  const win = new BrowserWindow({
    width: 900,
    height: 1100,
    show: false,
    webPreferences: { offscreen: true }
  })
  const file = path.join(ROOT, 'out/renderer/index.html')
  await win.loadFile(file, { search: '?window=main' })
  await sleep(400)
  await win.webContents.executeJavaScript(
    `localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(PINS))});
     localStorage.setItem('pinlog:theme', ${JSON.stringify(theme)});
     localStorage.setItem('pinlog:view', 'analog');
     true`
  )
  await win.loadFile(file, { search: '?window=main' })
  await sleep(1200)
  return win
}

/** 타임라인 점 / 하루 띠 막대 / 프리셋 아이콘의 '실제로 칠해진' 색을 뽑는다 */
const COLLECT = `
  (() => {
   try {
    // 없는 요소에 getComputedStyle 을 부르면 통째로 터져서 원인이 안 보인다
    const rgb = (el, prop) => (el ? getComputedStyle(el)[prop] : null)

    // 타임라인: 각 행의 시각 + 점 색
    const rows = [...document.querySelectorAll('li')].map((li) => {
      const time = li.querySelector('span.tabular-nums')
      const dot = li.querySelector('span.rounded-full[style]')
      const chips = [...li.querySelectorAll('span[style*="color"]')]
        .filter((s) => s.textContent.startsWith('#'))
        .map((s) => ({ tag: s.textContent.slice(1), color: rgb(s, 'color') }))
      return time && dot
        ? { time: time.textContent.trim(), dot: rgb(dot, 'backgroundColor'), chips }
        : null
    }).filter(Boolean)

    // 하루 띠 마커
    const strip = [...document.querySelectorAll('button[aria-label]')]
      .filter((b) => /^\\d{2}:\\d{2} /.test(b.getAttribute('aria-label')))
      .map((b) => ({
        label: b.getAttribute('aria-label'),
        color: rgb(b.querySelector('span'), 'backgroundColor')
      }))

    // 아날로그 시계 마커.
    // fill 속성값은 'var(--c-cat-work)' 라는 '문자열'이다 — 그대로 읽으면
    // 색 비교가 안 된다. 계산된 값을 봐야 실제로 칠해진 색이 나온다.
    const dial = [...document.querySelectorAll('svg circle[fill^="var("]')]
      .map((c) => rgb(c, 'fill'))
      .filter(Boolean)

    // 한 번에 기록 버튼의 아이콘 색
    const presets = [...document.querySelectorAll('button')]
      .filter((b) => ['업무', '회의', '휴식', '개인공부'].includes(b.textContent.trim()))
      .map((b) => ({ label: b.textContent.trim(), color: rgb(b.querySelector('svg'), 'color') }))

    // 주간 막대 세그먼트
    const weekBars = [...document.querySelectorAll('[aria-pressed]')]
      .filter((b) => b.title && b.title.includes('월'))
      .map((b) => [...b.querySelectorAll('span[style*="background"]')].map((s) => rgb(s, 'backgroundColor')))

    return { rows, strip, dial, presets, weekBars }
   } catch (e) { return { error: String((e && e.stack) || e) } }
  })()
`

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    const win = await open('light')
    const d = await win.webContents.executeJavaScript(COLLECT)

    const byTime = Object.fromEntries(d.rows.map((r) => [r.time, r]))
    const color = (time) => byTime[time] && byTime[time].dot

    t('타임라인 행 8개', d.rows.length === 8, `${d.rows.length}개`)

    const work = color('09:00')
    const meeting = color('10:00')
    const brk = color('11:00')
    const study = color('12:00')
    const custom1 = color('13:00')
    const none = color('15:00')
    const mixed = color('16:00')

    const all = [work, meeting, brk, study]
    t('프리셋 네 활동이 서로 다른 색', new Set(all).size === 4, all.join(' / '))
    t('태그 없는 기록은 중립색', !!none && !all.includes(none), String(none))
    t('직접 만든 태그도 색을 받는다', !!custom1 && custom1 !== none, String(custom1))
    t('프리셋+직접태그 섞이면 프리셋 색', mixed === work, `${mixed} vs ${work}`)

    // 같은 기록이 화면 세 곳에서 같은 색인지
    const stripWork = d.strip.find((s) => s.label.startsWith('09:00'))
    t('하루 띠 막대가 타임라인 점과 같은 색', stripWork && stripWork.color === work,
      stripWork ? `${stripWork.color} vs ${work}` : '막대 없음')

    const presetWork = d.presets.find((p) => p.label === '업무')
    t('프리셋 버튼 아이콘도 같은 색', presetWork && presetWork.color === work,
      presetWork ? `${presetWork.color} vs ${work}` : '버튼 없음')

    const chipWork = byTime['09:00'] && byTime['09:00'].chips[0]
    t('태그 칩도 같은 색', chipWork && chipWork.color === work,
      chipWork ? `${chipWork.color} vs ${work}` : '칩 없음')

    t('시계 마커도 색이 갈린다', new Set(d.dial).size >= 4, `${new Set(d.dial).size}색`)

    const todayBar = d.weekBars.find((b) => b.length > 1)
    t('주간 막대가 활동별로 쌓인다', !!todayBar && new Set(todayBar).size >= 4,
      todayBar ? `${new Set(todayBar).size}색` : '세그먼트 없음')

    win.destroy()
    await sleep(200)

    // 다크 모드에서는 같은 색을 그대로 쓰면 탁해진다 — 값이 실제로 바뀌는지 확인
    const dark = await open('dark')
    const dd = await dark.webContents.executeJavaScript(COLLECT)
    const darkWork = (dd.rows.find((r) => r.time === '09:00') || {}).dot
    t('다크 모드에서 활동 색이 따로 정의돼 있다', !!darkWork && darkWork !== work,
      `${darkWork} vs ${work}`)
    const darkAll = ['09:00', '10:00', '11:00', '12:00']
      .map((x) => (dd.rows.find((r) => r.time === x) || {}).dot)
    t('다크에서도 네 활동이 서로 다른 색', new Set(darkAll).size === 4, darkAll.join(' / '))
    dark.destroy()
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.stack) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\n활동 색 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
