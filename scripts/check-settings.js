// settings.json 에 여러 항목이 공존하는지 검사한다.
//
// 지키려는 사고:
//   theme.ts 가 예전에는 이 파일을 `{ theme }` 로 통째 덮어썼다. 캐릭터 꾸미기가
//   같은 파일에 들어온 뒤로는, 테마를 바꾸는 순간 꾸민 것이 통째로 날아간다.
//   타입 검사로는 절대 잡히지 않고, 사용자가 테마를 바꿔봐야 드러난다.
//
// 진짜 메인 프로세스를 부팅해 preload → IPC → 파일까지 전 경로로 확인한다.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const ROOT = process.argv[2] || process.cwd()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const sandbox = path.join(os.tmpdir(), `pinlog-settings-${Date.now()}`)
fs.mkdirSync(sandbox, { recursive: true })
app.setPath('userData', sandbox)

/*
 * 부팅 '전에' 설정 파일을 깨뜨려 둔다.
 *
 * 앱이 뜬 뒤에 파일을 고쳐봐야 소용이 없다 — settings.ts 는 첫 읽기 결과를
 * 메모리에 들고 있어서 디스크를 다시 보지 않는다. 복구 경로를 진짜로 지나가게
 * 하려면 아무도 읽기 전에 깨져 있어야 한다.
 */
fs.writeFileSync(path.join(sandbox, 'settings.json'), '{ 이건 JSON 이 아니다', 'utf-8')

require(path.join(ROOT, 'out/main/index.js'))

const settingsFile = () => path.join(sandbox, 'settings.json')
const readSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf-8'))
  } catch {
    return null
  }
}

app.whenReady().then(async () => {
  const checks = []
  const t = (name, ok, extra = '') => checks.push([name, ok, extra])

  try {
    await sleep(2200)
    require('electron').globalShortcut.unregisterAll()

    const win = BrowserWindow.getAllWindows()[0]
    if (!win) throw new Error('창이 없다')
    const run = (code) => win.webContents.executeJavaScript(code)

    // 깨진 파일로 시작했어도 기본값으로 살아나야 한다
    const recovered = await run(`window.pinlog.avatar.get()`).catch((e) => String(e))
    const recoveredTheme = await run(`window.pinlog.theme.get()`).catch((e) => String(e))
    t('깨진 설정 파일로 시작해도 앱이 뜬다', !!win)
    t('깨진 파일이면 캐릭터는 기본값', recovered && recovered.hat === 'none',
      JSON.stringify(recovered))
    t('깨진 파일이면 테마는 system', recoveredTheme && recoveredTheme.mode === 'system',
      JSON.stringify(recoveredTheme))

    const LOOK = { palette: 'mint', hat: 'crown', prop: 'mug', scene: 'stars' }

    await run(`window.pinlog.theme.set('dark')`)
    await sleep(300)
    await run(`window.pinlog.avatar.set(${JSON.stringify(LOOK)})`)
    await sleep(300)

    let s = readSettings()
    t('테마와 캐릭터가 한 파일에 같이 저장된다', !!s && s.theme === 'dark' && !!s.avatar,
      JSON.stringify(s))

    // 핵심: 테마를 다시 바꿔도 캐릭터가 살아남아야 한다
    await run(`window.pinlog.theme.set('light')`)
    await sleep(400)
    s = readSettings()
    t('테마를 바꿔도 캐릭터가 지워지지 않는다',
      !!s && s.theme === 'light' && !!s.avatar && s.avatar.hat === 'crown',
      JSON.stringify(s))

    // 반대 방향도
    await run(`window.pinlog.avatar.set(${JSON.stringify({ ...LOOK, hat: 'cap' })})`)
    await sleep(400)
    s = readSettings()
    t('캐릭터를 바꿔도 테마가 지워지지 않는다',
      !!s && s.theme === 'light' && s.avatar.hat === 'cap',
      JSON.stringify(s))

    // 읽기 경로
    const readBack = await run(`window.pinlog.avatar.get()`)
    t('저장한 차림을 그대로 돌려준다', readBack && readBack.hat === 'cap',
      JSON.stringify(readBack))
    const themeBack = await run(`window.pinlog.theme.get()`)
    t('저장한 테마를 그대로 돌려준다', themeBack && themeBack.mode === 'light',
      JSON.stringify(themeBack))
  } catch (err) {
    t('예외 없이 완료', false, String((err && err.message) || err))
  }

  let fail = 0
  for (const [name, ok, extra] of checks) {
    if (!ok) fail++
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
  }
  console.log(fail === 0 ? '\n설정 저장 정상' : `\n실패 ${fail}건`)

  try {
    fs.rmSync(sandbox, { recursive: true, force: true })
  } catch {
    /* 무시 */
  }
  app.exit(fail === 0 ? 0 : 1)
})
