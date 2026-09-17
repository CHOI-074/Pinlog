/**
 * 토스 번들을 가짜 SDK 로 빌드한다 — scripts/check-rewards.js 전용.
 * 출시용 번들(dist/)과 섞이지 않게 out/toss-mock 에 낸다.
 *
 * __TOSS_ADS_LIVE__ 를 일부러 true 로 둔다: '출시 빌드여도 샌드박스에서는 테스트 광고 ID'
 * 라는 안전장치를 검사하려면 출시 빌드 조건이어야 한다.
 */
import { resolve } from 'node:path'
import { mergeConfig } from 'vite'
import tossConfig from '../../vite.toss.config'

const root = resolve(__dirname, '../..')

export default mergeConfig(tossConfig({ mode: 'release', command: 'build' }), {
  resolve: {
    alias: { '@apps-in-toss/web-framework': resolve(__dirname, 'web-framework.ts') }
  },
  build: { outDir: resolve(root, 'out/toss-mock'), emptyOutDir: true }
})
