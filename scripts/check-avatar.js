// 캐릭터(레벨·해금·꾸미기) 검사.
//
// 가장 중요한 검사는 '스프라이트 격자'다. 픽셀 그림은 손으로 센 글자 수에 기대는
// 데이터라, 한 줄이 15글자나 17글자여도 타입 검사는 통과하고 화면만 어긋난다.
// 여기서는 실제로 그려진 <rect> 좌표를 읽어 캔버스를 벗어나는 칸이 있는지 본다.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
// src/renderer/src/lib/avatarArt.ts 의 ART_W / ART_H 와 같아야 한다
const PX_W = 32
const PX_H = 40

// 실제 사용자 데이터를 건드리지 않는다 (preload 없이 띄우므로 렌더러는 localStorage 를 쓴다)
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-avatar-')))
app.on('window-all-closed', () => {})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const DAY = 86400000
const at = (dayAgo, h, m) => {
  const d = new Date()
  d.setDate(d.getDate() - dayAgo)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

/** 평범한 기록 10건 = 100 XP = 정확히 레벨 2 (levelCost(1) === 100) */
const TEN_PLAIN = Array.from({ length: 10 }, (_, i) => ({
  id: `p${i}`,
  timestamp: at(0, 9 + i, 0),
  text: `기록 ${i}`,
  tags: [],
  isFocusMode: false
}))

/** 연속 3일 (오늘·어제·그제) */
const STREAK_3 = [
  { id: 's0', timestamp: at(0, 10, 0), text: '오늘', tags: [], isFocusMode: false },
  { id: 's1', timestamp: at(1, 10, 0), text: '어제', tags: [], isFocusMode: false },
  { id: 's2', timestamp: at(2, 10, 0), text: '그제', tags: [], isFocusMode: false }
]

async function open({ pins = [], avatar = null, theme = 'light' } = {}) {
  const win = new BrowserWindow({
    width: 420,
    height: 900,
    show: false,
    webPreferences: { offscreen: true }
  })
  const file = path.join(ROOT, 'out/renderer/index.html')

  await win.loadFile(file, { search: '?window=main' })
  await sleep(400)
  await win.webContents.executeJavaScript(
    `localStorage.setItem('pinlog:pins', ${JSON.stringify(JSON.stringify(pins))});
     localStorage.setItem('pinlog:theme', ${JSON.stringify(theme)});
     ${
       avatar === null
         ? `localStorage.removeItem('pinlog:avatar');`
         : `localStorage.setItem('pinlog:avatar', ${JSON.stringify(JSON.stringify(avatar))});`
     }
     true`
  )
  await win.loadFile(file, { search: '?window=main' })
  await sleep(1000)
  await win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('.journal-nav button')).find(b => b.textContent.trim() === '작은 작업실').click()`)
  await sleep(150)
  return win
}

const js = (win, code) => win.webContents.executeJavaScript(code)

/** 꾸미기 시트를 연다 */
const OPEN_SHEET = `
  (async () => {
    document.querySelector('button[aria-label="캐릭터 꾸미기"]').click()
    await new Promise(r => setTimeout(r, 400))
    return !!document.querySelector('[data-item]')
  })()
`

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    /* ── 1. 레벨 계산 ──────────────────────────────────────── */
    let win = await open({ pins: TEN_PLAIN })

    const card = await js(
      win,
      `(() => {
         const b = document.querySelector('button[aria-label="캐릭터 꾸미기"]')
         if (!b) return null
         const bar = b.querySelector('span > span > span[style]')
         return { text: b.innerText.replace(/\\n/g, ' | '), width: bar && bar.style.width }
       })()`
    )
    t('캐릭터 카드가 메인에 보인다', !!card, card ? card.text : '카드 없음')
    t('기록 10건 = 100XP = Lv.2', !!card && card.text.includes('Lv.2'), card && card.text)
    t(
      '레벨업 직후 진행 바는 0 / 160 XP',
      !!card && card.text.includes('0 / 160 XP'),
      card && card.text
    )
    t('다음 해금 안내가 있다', !!card && card.text.includes('다음'), card && card.text)

    /* ── 2. 스프라이트 격자 ────────────────────────────────── */
    await js(win, OPEN_SHEET)

    // 탭을 하나씩 돌며 모든 아이템 타일의 rect 좌표를 수집한다.
    const geometry = await js(
      win,
      `(async () => {
         const out = []
         for (const tab of [...document.querySelectorAll('[data-tab]')]) {
           tab.click()
           await new Promise(r => setTimeout(r, 250))
           const slot = tab.dataset.tab
           for (const tile of [...document.querySelectorAll('[data-item]')]) {
             const rects = [...tile.querySelectorAll('svg rect')].map(r => ({
               x: +r.getAttribute('x'), y: +r.getAttribute('y'),
               w: +r.getAttribute('width'), h: +r.getAttribute('height'),
               fill: r.getAttribute('fill')
             }))
             out.push({ slot, id: tile.dataset.item, locked: tile.dataset.locked === 'true', rects })
           }
         }
         return out
       })()`
    )

    const outside = geometry.filter((g) =>
      g.rects.some((r) => r.x < 0 || r.y < 0 || r.x + r.w > PX_W || r.y + r.h > PX_H)
    )
    t(
      `모든 아이템이 ${PX_W}x${PX_H} 캔버스 안에 그려진다`,
      outside.length === 0,
      outside.map((g) => `${g.slot}/${g.id}`).join(', ')
    )

    const empty = geometry.filter((g) => g.rects.length === 0)
    t('빈 타일이 없다 (본체는 항상 그려진다)', empty.length === 0,
      empty.map((g) => `${g.slot}/${g.id}`).join(', '))

    // 같은 슬롯 안에서 'none'(또는 기본)과 결과가 똑같은 아이템이 있으면
    // 스프라이트가 실제로는 아무것도 안 그리고 있다는 뜻이다.
    // 색(fill)까지 봐야 한다 — 팔레트는 칸 위치가 아니라 색만 달라지는 슬롯이다.
    const sig = (g) => g.rects.map((r) => `${r.x},${r.y},${r.w},${r.fill}`).join(';')
    const dupes = []
    for (const slot of new Set(geometry.map((g) => g.slot))) {
      const inSlot = geometry.filter((g) => g.slot === slot)
      const seen = new Map()
      for (const g of inSlot) {
        const s = sig(g)
        if (seen.has(s)) dupes.push(`${slot}: ${seen.get(s)} = ${g.id}`)
        else seen.set(s, g.id)
      }
    }
    t('아이템마다 그림이 실제로 달라진다', dupes.length === 0, dupes.join(' / '))

    const itemCount = new Set(geometry.map((g) => `${g.slot}/${g.id}`)).size
    t('아이템 42종 이상', itemCount >= 42, `${itemCount}종`)

    // 피부색은 보상이 아니라 '나'다 — 레벨과 무관하게 전부 열려 있어야 한다
    const skins = geometry.filter((g) => g.slot === 'skin')
    t('피부색은 4종 이상', skins.length >= 4, `${skins.length}종`)
    t('피부색은 레벨과 무관하게 전부 열려 있다', skins.every((g) => !g.locked),
      skins.filter((g) => g.locked).map((g) => g.id).join(', '))

    // 컨셉은 몸을 통째로 갈아끼운다 — 머리는 그대로여야 한다.
    // (머리까지 덮어버리면 고른 피부색·머리모양이 컨셉에 먹힌다)
    const concepts = geometry.filter((g) => g.slot === 'concept')
    const headOf = (g) => g.rects.filter((r) => r.y <= 16)
        .map((r) => `${r.x},${r.y},${r.w},${r.fill}`).join(';')
    const base = concepts.find((g) => g.id === 'none')
    t('컨셉 3종 이상', concepts.length >= 3, `${concepts.length}종`)
    t('컨셉을 바꿔도 머리는 그대로',
      !!base && concepts.every((g) => headOf(g) === headOf(base)),
      concepts.filter((g) => base && headOf(g) !== headOf(base)).map((g) => g.id).join(', '))
    t('컨셉이 몸(11줄 아래)을 실제로 바꾼다',
      !!base && concepts.filter((g) => g.id !== 'none').every((g) => {
        const body = (x) => x.rects.filter((r) => r.y >= 18)
          .map((r) => `${r.x},${r.y},${r.w},${r.fill}`).join(';')
        return body(g) !== body(base)
      }))
    t('컨셉은 전부 후반 해금 (기본 제외)',
      concepts.filter((g) => g.id !== 'none').every((g) => g.locked),
      concepts.filter((g) => g.id !== 'none' && !g.locked).map((g) => g.id).join(', '))

    /*
     * 머리색이 '머리카락에만' 칠해지는지.
     *
     * 색 글자를 h 하나로 빼면서, 다른 슬롯이 쓰던 글자를 잘못 건드리면
     * 머리색을 바꿨는데 왕관이나 눈동자 색까지 같이 변한다. 얼굴(피부·눈)과
     * 옷 픽셀이 머리색과 무관하게 그대로인지 본다.
     */
    const hairColors = geometry.filter((g) => g.slot === 'haircolor')
    const hairBase = hairColors[0]
    const fillsAt = (g, pred) => g.rects.filter(pred)
      .map((r) => `${r.x},${r.y},${r.w},${r.fill}`).join(';')
    // 얼굴 안쪽(눈·볼·입) — 머리카락이 닿지 않는 영역
    const faceOnly = (r) => r.y >= 12 && r.y <= 17 && r.x >= 10 && r.x + r.w <= 22
    const bodyOnly = (r) => r.y >= 20
    t('머리색 5종 이상', hairColors.length >= 5, `${hairColors.length}종`)
    t('머리색을 바꿔도 얼굴은 그대로',
      !!hairBase && hairColors.every((g) => fillsAt(g, faceOnly) === fillsAt(hairBase, faceOnly)))
    t('머리색을 바꿔도 몸은 그대로',
      !!hairBase && hairColors.every((g) => fillsAt(g, bodyOnly) === fillsAt(hairBase, bodyOnly)))
    t('타고나는 머리색(검정·갈색·금발)은 잠겨 있지 않다',
      ['black', 'brown', 'blonde'].every((id) => {
        const g = hairColors.find((x) => x.id === id)
        return g && !g.locked
      }))

    // 안경은 눈(5~6줄)을 덮어야 한다 — 엉뚱한 줄에 그리면 이마나 입에 걸린다
    const glasses = geometry.filter((g) => g.slot === 'glasses' && g.id !== 'none')
    t('안경 3종 이상', glasses.length >= 3, `${glasses.length}종`)
    t('안경이 눈 높이(10~16줄) 안에만 그려진다',
      glasses.every((g) => {
        const none = geometry.find((x) => x.slot === 'glasses' && x.id === 'none')
        const added = g.rects.filter((r) =>
          !none.rects.some((b) => b.x === r.x && b.y === r.y && b.w === r.w && b.fill === r.fill))
        return added.length > 0 && added.every((r) => r.y >= 10 && r.y <= 16)
      }))

    /* ── 3. 해금 ───────────────────────────────────────────── */
    const lockState = await js(
      win,
      `(async () => {
         const hat = document.querySelector('[data-tab="hat"]')
         hat.click()
         await new Promise(r => setTimeout(r, 250))
         const g = {}
         for (const tile of [...document.querySelectorAll('[data-item]')]) {
           g[tile.dataset.item] = { locked: tile.dataset.locked === 'true', disabled: tile.disabled }
         }
         return g
       })()`
    )
    t('Lv.2 에서 캡모자(Lv.2)는 열려 있다', lockState.cap && !lockState.cap.locked)
    t('Lv.2 에서 왕관(Lv.13)은 잠겨 있다', lockState.crown && lockState.crown.locked)
    t('잠긴 아이템은 누를 수 없다', lockState.crown && lockState.crown.disabled)

    /* ── 4. 입히기 + 저장 ──────────────────────────────────── */
    const equipped = await js(
      win,
      `(async () => {
         document.querySelector('[data-item="cap"]').click()
         await new Promise(r => setTimeout(r, 350))
         const tile = document.querySelector('[data-item="cap"]')
         return {
           pressed: tile.getAttribute('aria-pressed') === 'true',
           saved: localStorage.getItem('pinlog:avatar')
         }
       })()`
    )
    t('고르면 바로 입는다', equipped.pressed)
    t('고른 것이 저장된다', !!equipped.saved && JSON.parse(equipped.saved).hat === 'cap',
      equipped.saved || '저장 없음')

    // 잠긴 것을 눌러도 아무 일이 없어야 한다
    const lockedClick = await js(
      win,
      `(async () => {
         document.querySelector('[data-item="crown"]').click()
         await new Promise(r => setTimeout(r, 300))
         return JSON.parse(localStorage.getItem('pinlog:avatar')).hat
       })()`
    )
    t('잠긴 것을 눌러도 입혀지지 않는다', lockedClick === 'cap', `hat=${lockedClick}`)
    win.destroy()
    await sleep(200)

    /* ── 5. 저장한 차림이 다시 뜬다 ────────────────────────── */
    win = await open({
      pins: TEN_PLAIN,
      avatar: { skin: 'deep', hair: 'short', haircolor: 'silver', glasses: 'round', clothes: 'blue', concept: 'none', hat: 'cap', prop: 'none', scene: 'none' }
    })
    const restoredHat = await js(
      win,
      `(async () => {
         document.querySelector('button[aria-label="캐릭터 꾸미기"]').click()
         await new Promise(r => setTimeout(r, 400))
         document.querySelector('[data-tab="hat"]').click()
         await new Promise(r => setTimeout(r, 300))
         const tile = document.querySelector('[data-item="cap"]')
         return tile && tile.getAttribute('aria-pressed') === 'true'
       })()`
    )
    t('다시 열어도 입고 있던 것이 그대로', restoredHat === true)
    win.destroy()
    await sleep(200)

    /* ── 6. 모르는 아이템 id 는 기본값으로 ─────────────────── */
    win = await open({
      pins: TEN_PLAIN,
      avatar: { skin: '없는피부', hair: '없는머리', haircolor: '없는색', glasses: '없는안경', clothes: 'blue', concept: '없는컨셉', hat: '없는모자', prop: 'none', scene: 'none' }
    })
    const recovered = await js(
      win,
      `(() => {
         const b = document.querySelector('button[aria-label="캐릭터 꾸미기"]')
         const rects = b ? b.querySelectorAll('svg rect').length : 0
         return { ok: !!b, rects }
       })()`
    )
    t('모르는 아이템 id 가 있어도 캐릭터가 그려진다', recovered.ok && recovered.rects > 20,
      `rect ${recovered.rects}개`)
    win.destroy()
    await sleep(200)

    /* ── 6-1. 예전 스키마(색 한 칸)에서 넘어오기 ───────────── */
    // 색 칸을 피부+상의로 쪼갰다. 그때 저장돼 있던 값을 통째로 버리면
    // 쓰고 있던 모자·소품까지 같이 날아간다.
    win = await open({
      pins: TEN_PLAIN,
      avatar: { palette: 'mint', hat: 'cap', prop: 'pen', scene: 'stars' }
    })
    const migrated = await js(
      win,
      `(async () => {
         document.querySelector('button[aria-label="캐릭터 꾸미기"]').click()
         await new Promise(r => setTimeout(r, 400))
         const on = (slot, id) => {
           document.querySelector('[data-tab="' + slot + '"]').click()
           return new Promise(r => setTimeout(() => {
             const tile = document.querySelector('[data-item="' + id + '"]')
             r(!!tile && tile.getAttribute('aria-pressed') === 'true')
           }, 250))
         }
         return { hat: await on('hat', 'cap'), skin: await on('skin', 'apricot') }
       })()`
    )
    t('예전 저장값에서도 모자가 살아남는다', migrated.hat === true)
    t('없던 칸(피부)은 기본값으로 채워진다', migrated.skin === true)
    win.destroy()
    await sleep(200)

    /* ── 7. 연속 기록 ──────────────────────────────────────── */
    win = await open({ pins: STREAK_3 })
    const streak = await js(
      win,
      `document.querySelector('button[aria-label="캐릭터 꾸미기"]').innerText.replace(/\\n/g, ' | ')`
    )
    t('연속 3일이 표시된다', streak.includes('3일 연속'), streak)
    win.destroy()
    await sleep(200)

    /* ── 8. 기록 0건 ───────────────────────────────────────── */
    win = await open({ pins: [] })
    const fresh = await js(
      win,
      `(() => {
         const b = document.querySelector('button[aria-label="캐릭터 꾸미기"]')
         return { text: b.innerText.replace(/\\n/g, ' | '), rects: b.querySelectorAll('svg rect').length }
       })()`
    )
    t('기록이 없어도 Lv.1 로 정상 표시', fresh.text.includes('Lv.1'), fresh.text)
    t('기록이 없어도 연속 배지는 안 뜬다', !fresh.text.includes('연속'), fresh.text)
    t('기록이 없어도 캐릭터는 그려진다', fresh.rects > 20, `rect ${fresh.rects}개`)
    win.destroy()
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.stack) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\n캐릭터 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
