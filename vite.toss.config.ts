import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 앱인토스(미니앱) 빌드.
 *
 * PWA 빌드(vite.web.config.ts)와 갈라놓은 이유:
 *   - 미니앱은 번들을 토스 콘솔에 올려 토스 WebView 에서 돈다.
 *     서비스워커·manifest·공유타겟 같은 PWA 자산은 거기서 의미가 없다.
 *   - 토스 SDK 는 토스 빌드에만 들어가야 한다 (__TOSS_BUILD__ 로 갈린다).
 *
 * 출력은 granite.config.ts 의 outdir 과 맞춘 `dist` 이다.
 */
export default defineConfig(({ mode }) => ({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    // 이 상수가 true 여야 main.tsx 가 토스 어댑터를 불러온다
    __TOSS_BUILD__: 'true',
    /*
     * 운영 광고 ID 를 쓸지. `--mode release` 로 빌드할 때만 true.
     * 평소 빌드(npm run build:toss)는 테스트 광고 ID 라, 토스 앱에서 QR 로 테스트해도
     * 운영 광고를 부르지 않는다 — 테스트 중 운영 ID 사용은 제재 대상이다.
     */
    __TOSS_ADS_LIVE__: JSON.stringify(mode === 'release')
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    // 번들 100MB 제한이 있지만 우리는 수백 KB 수준이라 여유가 크다
    chunkSizeWarningLimit: 1500
  },
  // PWA 전용 정적 자산(sw.js, manifest)은 미니앱 번들에 넣지 않는다
  publicDir: false
}))
