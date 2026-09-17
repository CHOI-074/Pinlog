import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 모바일/PWA 용 순수 웹 빌드.
 * 같은 렌더러 코드가 window.pinlog 없이 돌면 lib/bridge.ts 의
 * localStorage 폴백이 자동으로 쓰인다. (dev: npx vite --config vite.web.config.ts)
 */
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react(), tailwindcss()],
  // 토스 전용 코드와 SDK 를 통째로 제거한다 (vite.toss.config.ts 만 true)
  define: { __TOSS_BUILD__: "false" },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true
  }
})
