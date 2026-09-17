// 광고 리워드 상점 검사.
//
// 토스 번들을 가짜 SDK(scripts/toss-mock)로 빌드해, 광고 보기 → 리워드 적립 → 구매 →
// 다시 열어도 남아 있는지까지 실제 화면으로 돌린다.
//
// 지키려는 사고:
//   - 테스트 중에 운영 광고 ID 를 부른다 (제재 대상)
//   - 끝까지 안 봤는데 리워드를 준다 / 한 광고로 두 번 준다
//   - 지갑을 못 읽었는데 빈 지갑으로 시작해 진짜 잔액을 0 으로 덮어쓴다
//   - 리워드가 모자란데 산다 / 사지 않은 아이템을 입는다
//   - 광고가 없는 웹·데스크탑에 상점이 보인다
//
// 실행: npm run check:rewards
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pinlog-rewards-')))
app.on('window-all-closed', () => {})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TEST_ID = 'ait-ad-test-rewarded-id'
const LIVE_ID = 'ait.v2.live.9684c2e6e5dc4aa1'

const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const PIN = [{ id: 'p0', timestamp: Date.now() - 3600e3, text: '기록', tags: ['work'], isFocusMode: false }]

let win
async function boot(file, { cfg = {}, storage = {}, local = {} } = {}) {
  if (win) win.destroy()
  win = new BrowserWindow({ width: 420, height: 900, show: false, webPreferences: { offscreen: true } })
  await win.loadFile(file)
  await sleep(200)
  const seed = {
    'tossmock:cfg': JSON.stringify(cfg),
    'toss:pinlog:pins': JSON.stringify(PIN),
    'toss:pinlog:onboarding': '1',
    'pinlog:pins': JSON.stringify(PIN),
    'pinlog:onboarding': '1',
    ...Object.fromEntries(Object.entries(storage).map(([k, v]) => ['toss:' + k, v])),
    ...local
  }
  await js(`localStorage.clear(); ${Object.entries(seed)
    .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
    .join('')} true`)
  await win.loadFile(file)
  await sleep(900)
}

/** 같은 저장소를 유지한 채 다시 연다 (앱을 껐다 켠 것) */
async function reopen(file) {
  await win.loadFile(file)
  await sleep(900)
}

const js = (code) => win.webContents.executeJavaScript(code)
const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true })()`)
const openSheet = async () => {
  await click('button[aria-label="캐릭터 꾸미기"]')
  await sleep(250)
}
const state = () =>
  js(`(() => {
    const ad = document.querySelector('[data-ad]')
    const wallet = document.querySelector('[data-wallet]')
    return {
      wallet: wallet ? Number(wallet.dataset.wallet) : null,
      ad: ad ? ad.dataset.ad : null,
      adText: ad ? ad.textContent : null,
      adDisabled: ad ? ad.disabled : null,
      testBadge: !!document.querySelector('[data-test-ads]'),
      tabs: [...document.querySelectorAll('[data-tab]')].map((t) => t.dataset.tab),
      notice: document.querySelector('[data-notice]')?.textContent ?? null,
      confirm: !!document.querySelector('[data-confirm]'),
      buyDisabled: document.querySelector('[data-buy]')?.disabled ?? null,
      calls: window.__tossCalls ?? [],
      stored: localStorage.getItem('toss:pinlog:wallet'),
      look: localStorage.getItem('toss:pinlog:avatar')
    }
  })()`)
const waitFor = async (pred, ms = 3000) => {
  const end = Date.now() + ms
  let s = await state()
  while (!pred(s) && Date.now() < end) {
    await sleep(60)
    s = await state()
  }
  return s
}
const watchOnce = async () => {
  await waitFor((s) => s.ad === 'ready')
  await click('[data-ad]')
  return waitFor((s) => s.ad === 'ready' || s.ad === 'failed')
}

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, !!ok, extra])
  const TOSS = path.join(ROOT, 'out/toss-mock/index.html')
  const WEB = path.join(ROOT, 'out/renderer/index.html')

  try {
    /* ── 1. 처음 연 사람 · 출시 빌드 · 샌드박스 ─────────────────── */
    await boot(TOSS)
    await openSheet()
    let s = await waitFor((x) => x.ad === 'ready')
    t('지갑이 0 으로 보인다', s.wallet === 0, String(s.wallet))
    t('상점·캐릭터 탭이 있다', s.tabs.includes('shop') && s.tabs.includes('species'), s.tabs.join(','))
    t('시트를 열면 광고를 미리 불러 둔다', s.ad === 'ready', s.ad)
    t('출시 빌드라도 샌드박스에서는 테스트 광고 ID', s.calls.every(([, id]) => id === TEST_ID) && s.calls.length > 0, JSON.stringify(s.calls))
    t('테스트 광고 표시가 보인다', s.testBadge)

    // 모자라면 못 산다
    await click('[data-tab="shop"]')
    await sleep(100)
    const shopCount = await js(`document.querySelectorAll('[data-price]').length`)
    t('상점 탭에 상점 아이템이 모여 있다 (9개)', shopCount === 9, String(shopCount))
    await click('[data-slot="species"][data-item="cat"]')
    await sleep(100)
    s = await state()
    t('파는 물건을 누르면 사기 확인이 뜬다', s.confirm)
    t('리워드가 모자라면 [사기]가 막힌다', s.buyDisabled === true)
    const previewCat = await js(`document.querySelector('[data-confirm]')?.textContent.includes('60 더 필요해요')`)
    t('얼마나 더 필요한지 알려준다', previewCat)

    // 광고 한 편
    s = await watchOnce()
    t('끝까지 보면 리워드 10', s.wallet === 10, String(s.wallet))
    t('받은 즉시 저장된다', JSON.parse(s.stored || '{}').balance === 10, s.stored)
    t('오늘 본 광고 수가 저장된다', JSON.parse(s.stored || '{}').adsToday === 1 && JSON.parse(s.stored).day === today)
    t('받았다고 알려준다', (s.notice || '').includes('받았어요'), s.notice)
    t('보여준 뒤 다음 광고를 다시 불러 둔다 (load → show → load)',
      s.calls.map((c) => c[0]).join(',') === 'load,show,load', s.calls.map((c) => c[0]).join(','))

    // 다섯 편 더 → 60 → 고양이 사기
    for (let i = 0; i < 5; i++) s = await watchOnce()
    t('여섯 편이면 60', s.wallet === 60, String(s.wallet))
    await click('[data-slot="species"][data-item="cat"]')
    await sleep(100)
    s = await state()
    t('충분하면 [사기]가 열린다', s.buyDisabled === false)
    await click('[data-buy]')
    await sleep(200)
    s = await state()
    const stored = JSON.parse(s.stored)
    t('사면 가격만큼 빠진다', s.wallet === 0 && stored.balance === 0, s.stored)
    t('산 것이 지갑에 남는다', stored.owned.includes('species:cat'), s.stored)
    t('산 것을 바로 입는다', JSON.parse(s.look || '{}').species === 'cat', s.look)
    t('샀다고 알려준다 (조사: 고양이를)', (s.notice || '').includes('고양이를 샀어요'), s.notice)

    /* ── 2. 껐다 켜도 남아 있다 ─────────────────────────────── */
    await reopen(TOSS)
    await openSheet()
    s = await waitFor((x) => x.ad === 'ready')
    t('다시 열어도 잔액·오늘 횟수가 그대로', s.wallet === 0 && JSON.parse(s.stored).adsToday === 6)
    await click('[data-tab="species"]')
    await sleep(100)
    const catLocked = await js(`document.querySelector('[data-item="cat"]').dataset.locked`)
    t('산 고양이는 잠겨 있지 않다', catLocked === 'false', catLocked)
    await click('[data-item="human"]')
    await sleep(100)
    await click('[data-item="cat"]')
    await sleep(100)
    s = await state()
    t('산 것은 다시 입을 때 리워드를 또 쓰지 않는다', !s.confirm && JSON.parse(s.look).species === 'cat')
    await click('[data-tab="skin"]')
    await sleep(100)
    const blocked = await js(`document.body.textContent.includes('털색이 정해져 있어요')`)
    t('동물일 때 피부 탭은 안내로 바뀐다', blocked)

    /* ── 3. 중간에 닫으면 안 준다 ─────────────────────────────── */
    await boot(TOSS, { cfg: { show: ['requested', 'show', 'impression', 'dismissed'] } })
    await openSheet()
    s = await watchOnce()
    t('끝까지 안 보고 닫으면 0', s.wallet === 0, String(s.wallet))
    t('끝까지 봐야 한다고 알려준다', (s.notice || '').includes('끝까지'), s.notice)

    /* ── 4. 한 광고에서 보상 이벤트가 두 번 와도 한 번만 ──────────── */
    await boot(TOSS, { cfg: { show: ['show', 'userEarnedReward', 'userEarnedReward', 'dismissed'] } })
    await openSheet()
    s = await watchOnce()
    t('보상 이벤트가 겹쳐도 10 만', s.wallet === 10, String(s.wallet))

    /* ── 5. SDK 가 수량을 비워 보내면 기본값, 콘솔 수량이 있으면 그 값 ─── */
    await boot(TOSS, { cfg: { amount: null } })
    await openSheet()
    s = await watchOnce()
    t('수량이 비면 기본 10', s.wallet === 10, String(s.wallet))
    await boot(TOSS, { cfg: { amount: 5 } })
    await openSheet()
    s = await watchOnce()
    t('콘솔 수량(5)을 그대로 준다', s.wallet === 5, String(s.wallet))

    /* ── 6. 광고를 못 불러오면 다시 시도 ─────────────────────────── */
    await boot(TOSS, { cfg: { load: 'error' } })
    await openSheet()
    s = await waitFor((x) => x.ad === 'failed')
    t('불러오기 실패를 보여준다', s.ad === 'failed' && s.adDisabled === false, s.adText)
    await js(`localStorage.setItem('tossmock:cfg', '{}'); true`)
    await click('[data-ad]')
    s = await waitFor((x) => x.ad === 'ready')
    t('[다시 시도]로 다시 불러온다', s.ad === 'ready', s.ad)

    /* ── 7. 하루 한도 ───────────────────────────────────────── */
    await boot(TOSS, { storage: { 'pinlog:wallet': JSON.stringify({ balance: 30, owned: [], day: today, adsToday: 10, earned: 100 }) } })
    await openSheet()
    await sleep(300)
    s = await state()
    t('하루 10회를 채우면 버튼이 막힌다', s.adDisabled === true && s.adText.includes('다 받았어요'), s.adText)
    t('한도를 채웠으면 광고를 불러오지도 않는다', s.calls.length === 0, JSON.stringify(s.calls))
    await boot(TOSS, { storage: { 'pinlog:wallet': JSON.stringify({ balance: 30, owned: [], day: '2000-01-01', adsToday: 10, earned: 100 }) } })
    await openSheet()
    s = await waitFor((x) => x.ad === 'ready')
    t('날짜가 바뀌면 다시 볼 수 있다 (잔액은 그대로)', s.ad === 'ready' && s.wallet === 30, `${s.ad} ${s.wallet}`)

    /* ── 8. 오래된 토스 앱 ──────────────────────────────────── */
    await boot(TOSS, { cfg: { adSupported: false } })
    await openSheet()
    await sleep(300)
    s = await state()
    t('광고 미지원이면 이유를 적고 막는다', s.ad === 'unsupported' && s.adDisabled, s.adText)

    /* ── 9. 진짜 토스 앱 + 출시 빌드 → 운영 ID ────────────────────── */
    await boot(TOSS, { cfg: { env: 'toss' } })
    await openSheet()
    s = await waitFor((x) => x.ad === 'ready')
    t('출시 빌드 + 토스 앱에서만 운영 광고 ID', s.calls.length > 0 && s.calls.every(([, id]) => id === LIVE_ID), JSON.stringify(s.calls))
    t('운영 광고일 때는 테스트 표시가 없다', !s.testBadge)

    /* ── 10. 지갑을 못 읽으면 상점을 숨긴다 (덮어쓰기 방지) ──────────── */
    const REAL = JSON.stringify({ balance: 120, owned: ['hat:star'], day: today, adsToday: 2, earned: 140 })
    await boot(TOSS, { cfg: { failKeys: ['pinlog:wallet'] }, storage: { 'pinlog:wallet': REAL } })
    await openSheet()
    await sleep(300)
    s = await state()
    t('지갑 읽기 실패 → 상점·광고 버튼이 없다', s.wallet === null && s.ad === null && !s.tabs.includes('shop'), s.tabs.join(','))
    t('지갑 읽기 실패 → 저장된 잔액을 건드리지 않는다', s.stored === REAL, s.stored)

    /* ── 11. 안 산 상점 아이템은 저장값을 고쳐도 입혀지지 않는다 ───────── */
    await boot(TOSS)
    await openSheet()
    await click('[data-tab="hat"]')
    await sleep(100)
    await click('[data-item="star"]')
    await sleep(150)
    s = await state()
    t('안 산 모자를 누르면 입지 않고 확인만 뜬다', s.confirm && !(s.look || '').includes('"hat":"star"'), s.look)

    /* ── 12. 웹·데스크탑에는 상점이 없다 ─────────────────────────── */
    await boot(WEB)
    await openSheet()
    await sleep(200)
    s = await state()
    const webPrices = await js(`document.querySelectorAll('[data-price]').length`)
    t('웹: 상점 탭·캐릭터 탭·광고 버튼이 없다', !s.tabs.includes('shop') && !s.tabs.includes('species') && s.ad === null, s.tabs.join(','))
    await click('[data-tab="hat"]')
    await sleep(100)
    const webHatPrices = await js(`document.querySelectorAll('[data-price]').length`)
    t('웹: 모자 탭에 상점 모자가 섞여 있지 않다', webPrices === 0 && webHatPrices === 0, String(webHatPrices))
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.stack) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra && !ok ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\n리워드 상점 정상' : `\n실패 ${fail}건`)
  app.exit(fail === 0 ? 0 : 1)
})
