import { useEffect } from 'react'
import { MainView } from './components/MainView'
import { MiniView } from './components/MiniView'
import { Onboarding } from './components/Onboarding'
import { PinComposer } from './components/PinComposer'
import { usePinStore } from './store/usePinStore'
import { isDesktop } from './lib/bridge'
import {
  clearLaunchParams,
  onServiceWorkerQuickPin,
  readSharedText,
  registerServiceWorker,
  startReminder,
  wantsCompose
} from './lib/pwa'

export default function App(): React.JSX.Element {
  const { kind, loading, onboardingStep } = usePinStore()

  useEffect(() => {
    void usePinStore.getState().init()
  }, [])

  // PWA 진입 경로 처리 — 공유시트로 받은 텍스트, 앱 단축키, 알림 탭
  useEffect(() => {
    if (isDesktop || loading) return
    registerServiceWorker()
    startReminder()

    const { openComposer, patchDraft } = usePinStore.getState()
    const shared = readSharedText()
    if (shared || wantsCompose()) {
      openComposer()
      // 공유시트로 들어온 텍스트는 본문에 미리 채워둔다
      if (shared) patchDraft({ text: shared })
      clearLaunchParams()
    }

    return onServiceWorkerQuickPin(() => usePinStore.getState().openComposer())
  }, [loading])

  /*
   * 앱인토스 시스템 뒤로가기.
   * 입력 시트가 열려 있으면 시트만 닫고, 아니면 미니앱을 나간다.
   * (검수 가이드: 토스 뒤로가기와 자체 뒤로가기를 동시에 쓰지 말 것)
   */
  useEffect(() => {
    if (!__TOSS_BUILD__ || loading) return
    let dispose: (() => void) | undefined
    void import('./lib/toss').then((toss) => {
      if (!toss.isInToss()) return
      dispose = toss.installBackHandler(() => {
        const { draft, closeComposer, onboardingStep, setOnboardingStep, closeOnboarding } =
          usePinStore.getState()
        /*
         * 온보딩 중에는 뒤로가기가 '이전 장'이다. 첫 장에서 누르면 앱을 끄지 않고
         * 온보딩만 닫는다 — '사용법 다시 보기'로 들어온 사람이 뒤로가기 한 번에
         * 앱 밖으로 튕겨 나가면 안 된다. (첫 실행이라면 한 번 더 누르면 나간다)
         */
        if (onboardingStep !== null) {
          if (onboardingStep > 0) setOnboardingStep(onboardingStep - 1)
          else closeOnboarding()
          return true
        }
        if (!draft.open) return false // 처리 안 함 → 미니앱 종료
        closeComposer()
        return true
      })
    })
    return () => dispose?.()
  }, [loading])

  // 미니 창은 배경이 투명해야 하므로 body 에 표시를 남긴다 (index.css 참고)
  useEffect(() => {
    document.body.dataset.window = kind
  }, [kind])

  if (loading) return <div className="h-full w-full" />

  // 입력 전용 창 — 위젯 크기에 묶이지 않도록 분리된 창이라, 입력 UI만 렌더한다
  if (kind === 'composer') {
    return (
      <div className="relative h-full w-full">
        <PinComposer standalone />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {kind === 'mini' ? <MiniView /> : <MainView />}
      {/* 웹/PWA 폴백용 인라인 모달. 데스크탑에서는 위의 독립 창이 대신 뜬다. */}
      <PinComposer />
      {/* 첫 실행 안내 — 입력 시트보다 위에 뜬다 (z-60) */}
      {kind === 'main' && onboardingStep !== null && <Onboarding />}
    </div>
  )
}
