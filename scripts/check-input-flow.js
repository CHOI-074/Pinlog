// 입력 플로우 전체를 실제 클릭/타이핑으로 재현한다.
const { app, BrowserWindow } = require('electron')
const path = require('path')

const ROOT = process.argv[2] || process.cwd()

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 340,
    height: 560,
    show: false,
    webPreferences: { offscreen: true }
  })
  await win.loadFile(path.join(ROOT, 'out/renderer/index.html'), { search: '?window=mini' })
  await new Promise((r) => setTimeout(r, 1200))

  const result = await win.webContents.executeJavaScript(`
    (async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms))
      const steps = []
      const byText = (t) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t)

      // React 제어 컴포넌트에 실제 타이핑처럼 값을 넣는다
      const typeInto = (el, value) => {
        const proto = el.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }

      localStorage.removeItem('pinlog:pins')

      // 1. 시계 안쪽 클릭 → 팝업
      document.querySelector('button[aria-label="지금 이 순간 핀 찍기"]').click()
      await wait(300)
      steps.push(['팝업 열림', !!document.querySelector('textarea')])

      // 2. 프리셋 버튼 클릭
      const preset = [...document.querySelectorAll('button')].find(b => b.textContent.includes('개인공부'))
      preset.click()
      await wait(150)
      const ta = document.querySelector('textarea')
      steps.push(['프리셋 클릭 → 텍스트 자동 채움', ta.value === '개인공부'])
      // 고른 프리셋은 그 활동 색으로 채워진다 (예전에는 bg-accent 클래스였다).
      // 색을 인라인 style 로 칠하므로 클래스가 아니라 '계산된 배경색'을 봐야 한다.
      const other = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '휴식')
      const bg = getComputedStyle(preset).backgroundColor
      const otherBg = getComputedStyle(other).backgroundColor
      steps.push(['프리셋 활성 표시 (활동 색으로 채워짐)',
        bg !== otherBg && bg !== 'rgba(0, 0, 0, 0)'])

      // 3. 수기로 텍스트 덮어쓰기
      typeInto(ta, '핀로그 미니모드 디버깅')
      await wait(150)
      steps.push(['수기 입력 반영', document.querySelector('textarea').value === '핀로그 미니모드 디버깅'])

      // 3-1. 수기 입력 후 프리셋을 눌러도 내가 쓴 글이 지워지지 않아야 한다
      const preset2 = [...document.querySelectorAll('button')].find(b => b.textContent.includes('업무'))
      preset2.click()
      await wait(150)
      steps.push(['프리셋이 수기 입력을 덮어쓰지 않음', document.querySelector('textarea').value === '핀로그 미니모드 디버깅'])

      // 4. 태그 직접 추가
      const tagInput = document.querySelector('input[placeholder*="태그"]')
      typeInto(tagInput, '사이드프로젝트')
      await wait(100)
      tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await wait(200)
      // 태그 칩은 "#태그" 텍스트 + 제거 아이콘(SVG) 구성이라 텍스트만 비교한다
      steps.push(['수기 태그 추가', !!byText('#사이드프로젝트')])

      // 5. 시각 수기 조정
      const timeInput = document.querySelector('input[type="time"]')
      typeInto(timeInput, '09:30')
      await wait(150)
      steps.push(['시각 수기 조정', document.querySelector('input[type=time]').value === '09:30'])

      // 6. 집중 토글 (ViewToggle 도 aria-pressed 를 쓰므로 라벨로 특정한다)
      const focusToggle = () => [...document.querySelectorAll('button[aria-pressed]')]
        .find(b => b.textContent.includes('선택과 집중'))
      focusToggle().click()
      await wait(150)
      steps.push(['집중 토글', focusToggle().getAttribute('aria-pressed') === 'true'])

      // 7. 저장
      byText('저장').click()
      await wait(400)
      steps.push(['저장 후 팝업 닫힘', !document.querySelector('textarea')])

      const saved = JSON.parse(localStorage.getItem('pinlog:pins') || '[]')
      const pin = saved[0]
      steps.push(['핀 1건 저장됨', saved.length === 1])
      steps.push(['본문 저장', pin && pin.text === '핀로그 미니모드 디버깅'])
      steps.push(['태그 3개 저장', pin && pin.tags.length === 3])
      steps.push(['isFocusMode 저장', pin && pin.isFocusMode === true])
      steps.push(['시각 09:30 저장', pin && new Date(pin.timestamp).getHours() === 9 && new Date(pin.timestamp).getMinutes() === 30])
      steps.push(['다이얼에 마커 렌더', document.querySelectorAll('svg circle[opacity]').length >= 1])

      return { steps, pin }
    })()
  `)

  let fail = 0
  for (const [name, ok] of result.steps) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}`)
  }
  console.log('\n저장된 핀:', JSON.stringify(result.pin))
  console.log(fail === 0 ? '\n전부 통과' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
