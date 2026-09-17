import { defineConfig } from '@apps-in-toss/web-framework/config'

/**
 * 앱인토스 미니앱 설정.
 *
 * ⚠️ appName 은 앱인토스 콘솔에서 미니앱을 등록하면 확정되는 식별자다.
 *    콘솔 값과 정확히 일치해야 딥링크(intoss://{appName})와 배포가 연결된다.
 *    아래 TODO 를 콘솔 값으로 바꿔주세요.
 *
 * 표시 이름·로고 이미지는 이 파일이 아니라 **콘솔의 앱 정보**에서 등록한다
 * (로고 600x600 정사각형, 이름은 원칙적으로 국문).
 */
export default defineConfig({
  // TODO: 콘솔에서 등록한 앱 식별자로 교체 (딥링크: intoss://{appName})
  appName: 'pinlog',

  brand: {
    // index.css 의 라이트 모드 강조색(--c-accent)과 맞춘 값
    primaryColor: '#2f6fe0'
  },

  /*
   * 토스가 그려주는 네비게이션 바를 쓴다.
   * 검수 가이드가 "토스 뒤로가기와 자체 뒤로가기를 동시에 쓰지 말 것"을 요구하므로,
   * 앱 안에 별도의 뒤로가기 버튼을 만들지 않는다.
   * 시스템 뒤로가기 처리는 App.tsx 의 installBackHandler 가 맡는다.
   */
  navigationBar: {
    withBackButton: true,
    withTitle: true,
    // 검수 기준이 라이트 모드라 네비게이션 바도 라이트로 고정한다
    theme: 'light'
  },

  /*
   * 요청할 권한.
   * 내보내기에 클립보드 쓰기를 쓴다. 토스 로그인·결제는 사업자등록 후 추가한다.
   */
  permissions: [{ name: 'clipboard', access: 'write' }],

  webView: {
    // 타임라인을 위로 당길 때 새로고침이 걸리면 기록 화면이 튄다
    pullToRefreshEnabled: false,
    // 스와이프 뒤로가기는 쓰지 않는다 — 시스템 뒤로가기 하나로만 처리한다
    allowsBackForwardNavigationGestures: false
  },

  // vite.toss.config.ts 의 build.outDir 과 같아야 한다 (ait build 가 이 폴더를 그대로 포장한다)
  webBundleDir: 'dist'
})
