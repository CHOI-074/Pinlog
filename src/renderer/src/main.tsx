import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

const root = createRoot(document.getElementById("root")!)
const render = (): void =>
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )

/*
 * __TOSS_BUILD__ 는 vite.toss.config.ts 에서만 true 로 치환된다.
 * PWA/Electron 빌드에서는 false 상수가 되어 이 블록과 SDK 가 통째로 제거된다.
 */
if (__TOSS_BUILD__) {
  /*
   * 라이트 모드를 '동기적으로' 먼저 박는다.
   *
   * 이게 없으면 다크 모드 폰에서 앱을 열 때 CSS 의 prefers-color-scheme 이 먼저 먹어
   * 어두운 화면이 잠깐 보였다가, Storage 조회가 끝난 뒤 라이트로 바뀌면서 깜빡인다.
   * 앱인토스 검수 기준이 라이트 모드라 기본값은 어차피 라이트다.
   * 사용자가 다크를 저장해 뒀다면 아래 theme.get() 이 곧 덮어쓴다.
   */
  document.documentElement.setAttribute('data-theme', 'light')

  // 저장소 어댑터를 먼저 갈아끼운 뒤 렌더해야 첫 조회가 네이티브 저장소를 본다
  void import('./lib/toss').then(async (toss) => {
    await toss.installTossPlatform()
    render()
  })
} else {
  render()
}
