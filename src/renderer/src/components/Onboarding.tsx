import { useEffect, useRef, useState } from 'react'
import { DEFAULT_LOOK, DEFAULT_PRESETS, type AvatarLook } from '@shared/types'
import { tagColor } from '@/lib/category'
import { isDesktop } from '@/lib/bridge'
import { usePinStore } from '@/store/usePinStore'
import { Icon } from './Icon'
import { PixelAvatar } from './PixelAvatar'

/**
 * 첫 실행 온보딩 — 세 장.
 *
 * 그림은 스크린샷이 아니라 **실제 컴포넌트와 같은 재료**로 그린다.
 * 프리셋 아이콘, 활동 색(tagColor), 픽셀 캐릭터를 그대로 가져다 쓰므로,
 * 나중에 색이나 캐릭터가 바뀌어도 온보딩이 옛 모습을 소개하는 일이 없다.
 *
 * 문구는 앱인토스 검수 기준("소개한 기능이 실제로 동일하게 동작할 것")에
 * 맞춰 지금 앱에 있는 것만 적는다. 숫자(경험치 10)도 lib/avatar.ts 의 XP 와 같다.
 *
 * 넘기기는 CSS scroll-snap 이다. 손가락 스와이프·트랙패드·키보드가 제스처 코드
 * 없이 다 되고, 관성도 OS 것을 그대로 쓴다.
 */

const PAGES = [
  {
    title: '지금 하는 일을\n한 번에 기록해요',
    body: `업무·회의·휴식·개인공부를 누르면 지금 시각으로 바로 남아요. 길게 적고 싶을 땐 ${
      // 데스크탑 메인 창에는 모바일의 떠 있는 + 버튼이 없다 — 시계를 누르거나 디지털 뷰의 + 를 쓴다
      isDesktop ? '시계나 + 를' : '+ 를'
    } 눌러요.`,
    Visual: QuickRecordVisual
  },
  {
    title: '하루가\n색으로 보여요',
    body: '활동마다 색이 달라서 오늘을 어떻게 보냈는지 한눈에 들어와요. 날짜를 누르면 그날 기록만 모아 봐요.',
    Visual: DayColorsVisual
  },
  {
    title: '기록할수록\n캐릭터가 자라요',
    body: '기록 하나에 경험치 10. 레벨이 오르면 머리·안경·모자, 직장인 컨셉까지 꾸밀 수 있어요.',
    Visual: CharacterVisual
  }
] as const

const LAST = PAGES.length - 1

export function Onboarding(): React.JSX.Element {
  const step = usePinStore((s) => s.onboardingStep) ?? 0
  const { setOnboardingStep, closeOnboarding } = usePinStore.getState()
  const scroller = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  /*
   * 스크롤 → 현재 장.
   *
   * 스크롤이 '멈춘 뒤'에만 반영한다. 스크롤 도중마다 반영하면 [다음] 버튼으로
   * 0→1 로 부드럽게 넘어가는 중간에 반올림이 0 을 내서 장이 0 으로 되돌아가고,
   * 그게 다시 0 으로 스크롤시키는 싸움이 난다. (scrollend 이벤트가 깔끔하지만
   * iOS WebView — 토스 앱 — 에서 믿을 수 없어 타이머로 한다)
   */
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onScroll = (): void => {
    if (settle.current) clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const el = scroller.current
      if (!el || el.clientWidth === 0) return
      const i = Math.min(LAST, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)))
      if (i !== usePinStore.getState().onboardingStep) setOnboardingStep(i)
    }, 90)
  }

  // 현재 장 → 스크롤 ([다음] 버튼, 점, 토스 뒤로가기, 키보드)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const target = step * el.clientWidth
    if (Math.abs(el.scrollLeft - target) > 2) {
      el.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' })
    }
  }, [step, reduced])

  // 창 크기가 바뀌면 장 경계가 어긋난다 (데스크탑 창 리사이즈, 폰 회전)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const s = usePinStore.getState().onboardingStep ?? 0
      el.scrollTo({ left: s * el.clientWidth, behavior: 'auto' })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 키보드 — 데스크탑·블루투스 키보드용
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const s = usePinStore.getState().onboardingStep ?? 0
      if (e.key === 'ArrowRight' && s < LAST) setOnboardingStep(s + 1)
      if (e.key === 'ArrowLeft' && s > 0) setOnboardingStep(s - 1)
      if (e.key === 'Escape') closeOnboarding()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOnboardingStep, closeOnboarding])

  // 모바일에서는 body 가 스크롤된다. 덮개 뒤에서 메인 화면이 딸려 움직이지 않게 잠근다.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const next = (): void => (step < LAST ? setOnboardingStep(step + 1) : closeOnboarding())

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="핀로그 사용법"
      className="no-drag fixed inset-0 z-[60] overflow-hidden bg-ink-950"
    >
      {/* 배경 앰비언트 — 메인 화면과 같은 재료. 유리 카드가 흐릴 대상이 된다 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-focus/25 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
        {/* 건너뛰기 — 마지막 장에서는 [시작하기]와 같은 뜻이라 감춘다(자리는 유지해 흔들리지 않게) */}
        <div
          className="safe-top flex h-14 shrink-0 items-center justify-end px-4"
          style={{ ['--safe-pad-top' as string]: '0.5rem' }}
        >
          <button
            type="button"
            onClick={closeOnboarding}
            className={`rounded-lg px-3 py-2 text-[14px] text-ink-400 transition hover:text-ink-100 ${
              step === LAST ? 'invisible' : ''
            }`}
          >
            건너뛰기
          </button>
        </div>

        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {PAGES.map(({ title, body, Visual }, i) => (
            <section
              key={title}
              aria-hidden={i !== step}
              aria-label={`${i + 1} / ${PAGES.length}`}
              className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-7"
            >
              <div className="glass glass-sheen relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl px-5">
                <Visual active={i === step} reduced={reduced} />
              </div>
              <h2 className="mt-8 text-center text-[24px] leading-[1.3] font-bold tracking-tight break-keep whitespace-pre-line text-ink-100">
                {title}
              </h2>
              {/*
                break-keep: 한글은 기본값이면 단어 한가운데서 줄이 바뀐다
                ("바로" → "바 / 로"). 어절 단위로만 끊기게 한다.
              */}
              <p className="mt-3 max-w-[19rem] text-center text-[15px] leading-relaxed break-keep text-ink-400">
                {body}
              </p>
            </section>
          ))}
        </div>

        <div
          className="safe-bottom shrink-0 px-6 pt-4"
          style={{ ['--safe-pad-bottom' as string]: '1.25rem' }}
        >
          {/* 몇 장 중 몇 번째인지 — 점도 누를 수 있다 */}
          <div className="mb-5 flex justify-center gap-2">
            {PAGES.map((p, i) => (
              <button
                key={p.title}
                type="button"
                onClick={() => setOnboardingStep(i)}
                aria-label={`${i + 1}번째 안내로 이동`}
                aria-current={i === step ? 'step' : undefined}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-accent' : 'w-2 bg-ink-600 hover:bg-ink-500'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="h-13 w-full rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-ink-950 transition hover:brightness-110 active:scale-[0.99]"
          >
            {step < LAST ? '다음' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * 장면들
 * ──────────────────────────────────────────────────────────── */

interface VisualProps {
  /** 지금 보이는 장인가 — 안 보이는 장은 움직임을 멈춘다 */
  active: boolean
  reduced: boolean
}

/** 1장: 프리셋을 누르면 바로 기록된다 */
function QuickRecordVisual({ active, reduced }: VisualProps): React.JSX.Element {
  const i = useCycle(DEFAULT_PRESETS.length, 1500, active && !reduced)
  const preset = DEFAULT_PRESETS[i]
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {DEFAULT_PRESETS.map((p, k) => (
          <div
            key={p.tag}
            className={`glass-soft flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] text-ink-300 transition duration-300 ${
              k === i ? 'scale-105' : 'opacity-70'
            }`}
            // 눌린 버튼은 제 활동 색 테두리로 — 아래 기록 점과 같은 색이라 연결이 읽힌다
            style={k === i ? { boxShadow: `0 0 0 2px ${tagColor(p.tag)}` } : undefined}
          >
            <Icon name={p.icon} size={20} style={{ color: tagColor(p.tag) }} />
            {p.label}
          </div>
        ))}
      </div>

      {/* 방금 남은 기록 한 줄 */}
      <div className="glass-soft flex items-center gap-3 rounded-xl px-3 py-2.5">
        <span className="text-[12px] tabular-nums text-ink-400">{hhmm}</span>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-300"
          style={{ background: tagColor(preset.tag) }}
        />
        <span className="text-[14px] text-ink-100">{preset.label}</span>
        <span className="ml-auto text-[11px] text-ink-400">방금 기록됨</span>
      </div>
    </div>
  )
}

/** 2장: 하루 띠 + 타임라인이 활동 색으로 칠해진다 */
const SAMPLE_DAY = [
  { h: 9.2, tag: 'work', text: '기획서 작성', time: '09:10' },
  { h: 10.5, tag: 'meeting', text: '팀 스탠드업', time: '10:30' },
  { h: 12.4, tag: 'break', text: '점심 산책', time: '12:25' },
  { h: 14.0, tag: 'study', text: '자격증 공부', time: '14:00' },
  // 아래 둘은 띠에만 찍힌다 (타임라인 목록은 세 줄까지만 보여준다)
  { h: 16.2, tag: 'work', text: '', time: '' },
  { h: 17.6, tag: 'meeting', text: '', time: '' }
]

function DayColorsVisual(_: VisualProps): React.JSX.Element {
  return (
    <div className="flex w-full flex-col gap-4">
      {/* 하루 띠 */}
      <div>
        <div className="relative h-7">
          <div className="absolute inset-x-0 top-2 h-3 rounded-full bg-ink-700/60" />
          {SAMPLE_DAY.map((d) => (
            <span
              key={d.h}
              className="absolute top-0.5 h-6 w-[3px] -translate-x-1/2 rounded-full"
              style={{ left: `${(d.h / 24) * 100}%`, background: tagColor(d.tag) }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-ink-500">
          <span>0</span>
          <span>12</span>
          <span>24</span>
        </div>
      </div>

      {/* 타임라인 세 줄 */}
      <ul className="flex flex-col gap-2">
        {SAMPLE_DAY.filter((d) => d.text).slice(0, 3).map((d) => (
          <li key={d.h} className="flex items-center gap-3">
            <span className="w-10 text-right text-[12px] tabular-nums text-ink-400">{d.time}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tagColor(d.tag) }} />
            <span className="text-[14px] text-ink-100">{d.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 3장: 캐릭터가 갈아입는다 */
const LOOKS: AvatarLook[] = [
  DEFAULT_LOOK,
  { ...DEFAULT_LOOK, hat: 'cap' },
  { ...DEFAULT_LOOK, hair: 'long', haircolor: 'black', glasses: 'round', clothes: 'mint' },
  { ...DEFAULT_LOOK, concept: 'office', glasses: 'square', clothes: 'peach' },
  { ...DEFAULT_LOOK, hair: 'curly', haircolor: 'blonde', hat: 'crown', scene: 'stars', clothes: 'grape' }
]

function CharacterVisual({ active, reduced }: VisualProps): React.JSX.Element {
  const i = useCycle(LOOKS.length, 1300, active && !reduced)
  // 레벨 막대는 캐릭터가 바뀔 때마다 조금씩 찬다 — '기록 → 성장'을 보여준다
  const fill = 20 + (i / (LOOKS.length - 1)) * 70

  return (
    <div className="flex w-full items-center gap-5">
      <div className="flex h-40 w-32 shrink-0 items-center justify-center">
        <PixelAvatar look={LOOKS[i]} size={160} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-ink-100">Lv.{1 + i * 3}</div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700"
            style={{ width: `${fill}%` }}
          />
        </div>
        <div className="mt-2 text-[12px] text-ink-400">기록 1건 +10 XP</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * 작은 훅
 * ──────────────────────────────────────────────────────────── */

/** 0..n-1 을 돈다. 멈추면 그 자리에 선다(처음으로 튀지 않게). */
function useCycle(n: number, ms: number, running: boolean): number {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setI((x) => (x + 1) % n), ms)
    return () => clearInterval(id)
  }, [n, ms, running])
  return i
}

/** '동작 줄이기'를 켠 사람에게는 자동으로 움직이는 장면과 부드러운 스크롤을 끈다 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = (): void => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}
