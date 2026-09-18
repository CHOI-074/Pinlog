import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnalogClock } from './AnalogClock'
import { AvatarCard } from './AvatarCard'
import { AvatarSheet } from './AvatarSheet'
import { DayStrip } from './DayStrip'
import { DigitalClock } from './DigitalClock'
import { Icon, type IconName } from './Icon'
import { QuickPresets } from './QuickPresets'
import { Timeline } from './Timeline'
import { ThemeToggle } from './ThemeToggle'
import { ViewToggle } from './ViewToggle'
import { WeekCalendar } from './WeekCalendar'
import { PixelAvatar } from './PixelAvatar'
import { usePinStore } from '@/store/usePinStore'
import { progressOf } from '@/lib/avatar'
import { copyAsMarkdown, exportCsv } from '@/lib/export'
import { bridge, isDesktop } from '@/lib/bridge'
import { DEFAULT_PRESETS } from '@shared/types'
import { tagColor } from '@/lib/category'
import { DAILY_AD_LIMIT, DEFAULT_REWARD } from '@/lib/wallet'

type Page = 'journal' | 'review' | 'studio'
const NAV: { id: Page; label: string; icon: IconName }[] = [
  { id: 'journal', label: '나의 기록', icon: 'book' },
  { id: 'review', label: '돌아보기', icon: 'clockAnalog' },
  { id: 'studio', label: '작은 작업실', icon: 'star' }
]
const dayStart = (): number => { const d = new Date(); d.setHours(0, 0, 0, 0); return +d }
const nextDay = (start: number): number => { const d = new Date(start); d.setDate(d.getDate() + 1); return +d }

export function MainView(): React.JSX.Element {
  const { pins, view, selectedDay, look, wallet } = usePinStore()
  const { setView, setMode, openComposer, openEditor, selectDay, setLookPart, openOnboarding } = usePinStore.getState()
  const [page, setPage] = useState<Page>('journal')
  const [toast, setToast] = useState<string | null>(null)
  const [dressing, setDressing] = useState<'skin' | 'shop' | null>(null)
  const closeDressing = useCallback(() => setDressing(null), [])
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(Date.now())
  useEffect(() => { selectDay(dayStart()); const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id) }, [selectDay])
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 3200); return () => clearTimeout(id) }, [toast])
  useEffect(() => {
    const back = (event: Event): void => {
      if (dressing) { event.preventDefault(); setDressing(null) }
      else if (page !== 'journal') { event.preventDefault(); setPage('journal') }
    }
    window.addEventListener('pinlog:back', back)
    return () => window.removeEventListener('pinlog:back', back)
  }, [dressing, page])
  const todayStart = dayStart()
  const today = pins.filter(p => p.timestamp >= todayStart && p.timestamp < nextDay(todayStart))
  const progress = useMemo(() => progressOf(pins), [pins, todayStart])
  const visible = useMemo(() => pins.filter(p =>
    (selectedDay === null || (p.timestamp >= selectedDay && p.timestamp < nextDay(selectedDay))) &&
    (!search.trim() || `${p.text} ${p.detail ?? ''} ${p.tags.join(' ')} ${p.tags.map(tag => DEFAULT_PRESETS.find(preset => preset.tag === tag)?.label ?? tag).join(' ')}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  ), [pins, selectedDay, search])
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6)
  const weekPins = pins.filter(p => p.timestamp >= +weekStart && p.timestamp < nextDay(todayStart))
  const activeDays = new Set(weekPins.map(p => new Date(p.timestamp).toDateString())).size
  const categories = DEFAULT_PRESETS.map(preset => ({ ...preset, count: weekPins.filter(p => p.tags.includes(preset.tag)).length }))
  const top = [...categories].sort((a, b) => b.count - a.count)[0]
  const exportRecords = async (format: 'copy' | 'csv'): Promise<void> => {
    try {
      if (format === 'copy') { await copyAsMarkdown(pins); setToast('전체 기록을 복사했어요') }
      else { const path = await exportCsv(pins); setToast(path ? '전체 기록을 내보냈어요' : bridge.platform === 'toss' ? 'CSV를 클립보드에 복사했어요' : '내보내기를 마쳤어요') }
    } catch { setToast('내보내지 못했어요. 다시 시도해 주세요') }
  }
  const date = new Date(now)
  return (
    <div className="journal-app">
      <header className={`journal-header drag-region ${bridge.platform === 'darwin' ? 'desktop-mac' : ''}`}>
        <a className="brand no-drag" href="#" onClick={e => { e.preventDefault(); setPage('journal') }}>
          <span className="brand-mark">
            <Icon name="pin" size={20} />
          </span>핀로그<span className="brand-caption">작은 순간, 선명한 하루</span>
        </a>
        <div className="header-tools no-drag">
          <ThemeToggle />{isDesktop && <button onClick={() => setMode('mini')} aria-label="미니 위젯 열기">
            <Icon name="collapse" size={18} />
          </button>}
        </div>
      </header>
      <div className="journal-body">
        <nav className="journal-nav" aria-label="주 메뉴">
          <p className="nav-label">MY LITTLE DAYS</p>
          {NAV.map(item => <button key={item.id} aria-current={page === item.id ? 'page' : undefined} onClick={() => setPage(item.id)}>
            <Icon name={item.icon} size={19} />
            <span>{item.label}
            </span>{page === item.id && <span className="nav-dot" />}
          </button>)}
          <div className="nav-bottom">
            <p>평범한 하루에도<br />남겨둘 순간은 있으니까.</p>
          </div>
        </nav>
        <main className="journal-scroll">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{date.getFullYear()} · {String(date.getMonth() + 1).padStart(2, '0')} · {String(date.getDate()).padStart(2, '0')} {date.toLocaleDateString('ko-KR', { weekday: 'long' })}
              </p>
              <h1>{page === 'journal' ? '오늘의 조각들' : page === 'review' ? '쌓인 날들을 돌아봐요' : '나를 닮은 작은 작업실'}
              </h1>
              <p className="subheading">{page === 'journal' ? '대단하지 않아도 괜찮아요. 지금의 나를 남겨보세요.' : page === 'review' ? '기록 속에서 발견하는 나만의 일상 리듬.' : '기록으로 자라고, 취향으로 채우는 나만의 공간.'}
              </p>
            </div>
            <span className="streak-badge">
              <Icon name="pin" size={15} />{progress.streak > 0 ? `${progress.streak}일째 기록 중` : '한 줄부터 시작해요'}
            </span>
          </div>
          {page === 'journal' && <div className="journal-columns">
            <div className="journal-primary">
              <section className="write-card">
                <div>
                  <p className="eyebrow">A MOMENT FOR YOURSELF</p>
                  <h2>지금, 어떤 순간인가요?</h2>
                  <p>스쳐 가는 생각도, 잠깐의 휴식도 좋아요.</p>
                  <button className="primary-button" aria-label="지금 기록하기" onClick={() => { selectDay(todayStart); setSearch(''); openComposer() }}>
                    <Icon name="plus" size={18} />지금 기록하기</button>
                </div>
                <div className="paper-art" aria-hidden="true">
                  <div className="paper-back" />
                  <div className="paper-front">
                    <span>dear, today</span>
                    <i />
                    <i />
                    <i />
                    <b>✳</b>
                  </div>
                  <div className="paper-seal">a little<br />moment</div>
                </div>
              </section>
              <QuickPresets onRecorded={setToast} />
              <section className="entries-panel" aria-label="기록 목록">
                <div className="section-title">
                  <h2>나의 타임라인 <span>{visible.length}
                  </span>
                  </h2>
                  <div className="period-switch">
                    <button aria-pressed={selectedDay === todayStart} onClick={() => selectDay(todayStart)}>오늘</button>
                    <button aria-pressed={selectedDay === null} onClick={() => selectDay(null)}>전체</button>
                  </div>
                </div>
                <div className="record-filters">
                  <input aria-label="기록 검색" type="search" placeholder="기억하고 싶은 순간 찾기" value={search} onChange={e => setSearch(e.target.value)} />
                  <input aria-label="기록 날짜 선택" type="date" value={selectedDay === null ? '' : `${new Date(selectedDay).getFullYear()}-${String(new Date(selectedDay).getMonth() + 1).padStart(2, '0')}-${String(new Date(selectedDay).getDate()).padStart(2, '0')}`} onChange={e => selectDay(e.target.value ? +new Date(`${e.target.value}T00:00:00`) : null)} />
                </div>{visible.length ? <Timeline pins={visible} /> : <div className="journal-empty">
                  <Icon name="edit" size={27} />
                  <h3>{search ? '아직 찾는 순간이 없어요' : '이 하루의 첫 조각을 남겨볼까요?'}
                  </h3>
                  <p>{search ? '다른 단어로 검색하거나 전체 기간을 선택해 보세요.' : '한 문장이면 충분해요. 나중의 나에게 작은 기억이 됩니다.'}
                  </p>{!search && <button className="text-button" onClick={() => openComposer(selectedDay === todayStart ? undefined : selectedDay ?? undefined)}>첫 기록 남기기 →</button>}
                </div>}
              </section>
            </div>
            <aside className="journal-aside">
              <section className="side-card">
                <div className="section-title">
                  <h2>오늘의 리듬</h2>
                  <span className="eyebrow">DAILY</span>
                </div>
                <div className="daily-count">
                  <strong>{today.length}
                  </strong>
                  <span>개의 순간을 남겼어요</span>
                </div>
                <DayStrip pins={today} onMarkerClick={openEditor} />
                <div className="small-note">{today.length ? '기록을 누르면 그 순간을 다시 볼 수 있어요.' : '나의 속도로, 하나씩 채워가요.'}
                </div>
              </section>
              <section className="side-card week-card">
                <WeekCalendar pins={pins} selected={selectedDay} onSelect={selectDay} />
              </section>
              <button className="companion-card" aria-label="캐릭터 꾸미기" onClick={() => setDressing('skin')}>
                <PixelAvatar look={look} size={80} />
                <div>
                  <span className="eyebrow">MY COMPANION</span>
                  <h3>함께 쌓아가는 하루</h3>
                  <p>Lv.{progress.level} · 내 캐릭터 꾸미기 →</p>
                </div>
              </button>
              <p className="privacy-note">기록은 이 기기에 보관돼요.<br />소중한 순간은 가끔 내보내 주세요.</p>
            </aside>
          </div>}
          {page === 'review' && <div className="review-layout">
            <section className="review-hero">
              <p className="eyebrow">YOUR LAST 7 DAYS</p>
              <h2>{activeDays ? `지난 7일 중 ${activeDays}일의 기억이 남았어요.` : '나의 일상은 어떤 모습일까요?'}
              </h2>
              <p>{top.count ? `'${top.label}' 기록이 ${top.count}개로 가장 많았어요. 이번 주 나에게 기억에 남는 순간은 무엇인가요?` : '기록이 쌓이면 이곳에서 일상의 흐름을 볼 수 있어요.'}
              </p>
              <div className="review-stats">
                <div>
                  <strong>{weekPins.length}
                  </strong>
                  <span>남긴 순간</span>
                </div>
                <div>
                  <strong>{activeDays}
                    <small> / 7</small>
                  </strong>
                  <span>기록한 날</span>
                </div>
                <div>
                  <strong>{weekPins.filter(p => p.isFocusMode).length}
                  </strong>
                  <span>집중한 기록</span>
                </div>
              </div>
            </section>
            <section className="side-card">
              <h2>이번 주 자주 남긴 활동</h2>
              <div className="activity-bars">{categories.map(c => <div key={c.tag}>
                <span>
                  <Icon name={c.icon} size={16} />{c.label}
                </span>
                <div>
                  <i style={{ width: `${weekPins.length ? c.count / weekPins.length * 100 : 0}%`, background: tagColor(c.tag) }} />
                </div>
                <b>{c.count}개</b>
              </div>)}
              </div>
              <p className="small-note">태그가 붙은 기록 수예요. 한 기록에 여러 활동이 포함될 수 있어요.</p>
            </section>
            <section className="side-card">
              <WeekCalendar pins={pins} selected={selectedDay} onSelect={day => { selectDay(day); setSearch(''); setPage('journal') }} />
            </section>
            <section className="side-card reflection-prompt">
              <p className="eyebrow">ONE SMALL QUESTION</p>
              <h2>오늘, 나를 웃게 한 일은?</h2>
              <p>숫자에 담기지 않는 마음도 남겨두세요.</p>
              <button className="text-button" onClick={() => { openComposer(); if (!isDesktop) usePinStore.getState().patchDraft({ text: '오늘 나를 웃게 한 일', tags: ['회고'] }) }}>한 줄 회고 쓰기 →</button>
            </section>
            <section className="side-card export-card">
              <div>
                <h2>내 기록은 언제나 내 것</h2>
                <p>전체 {pins.length}개의 기록을 가져갈 수 있어요.</p>
              </div>
              <button onClick={() => void exportRecords('copy')}>
                <Icon name="copy" size={16} />복사</button>
              <button onClick={() => void exportRecords('csv')}>
                <Icon name="download" size={16} />CSV 내보내기</button>
            </section>
          </div>}
          {page === 'studio' && <div className="studio-layout">
            <section className="studio-companion">
              <p className="eyebrow">GROW AT YOUR OWN PACE</p>
              <AvatarCard look={look} progress={progress} onOpen={() => setDressing('skin')} />
              <h2>하루 한 줄, 조금씩 자라는 나</h2>
              <p>기록으로 열리는 기본 꾸미기를 만나보세요.<br />구매한 아이템은 계속 간직할 수 있어요.</p>
              <button className="primary-button" onClick={() => setDressing('skin')}>내 캐릭터 꾸미기 <Icon name="edit" size={16} />
              </button>
            </section>
            <section className="side-card reward-intro">
              <span className="eyebrow">{wallet ? 'OPTIONAL REWARDS' : 'MY COLLECTION'}
              </span>
              <h2>{wallet ? '마음에 드는 소품 하나' : '기록이 취향이 되는 곳'}
              </h2>
              <p>{wallet ? '원하는 소품을 먼저 둘러보고, 필요할 때만 광고로 리워드를 모으세요. 기록과 회고는 언제나 무료예요.' : '기록할수록 새로운 옷과 소품이 열려요. 내 캐릭터에 어울리는 조합을 찾아보세요.'}
              </p>{wallet && <>
                <div className="reward-rules">
                  <span>선택형 광고<strong>1회 +{DEFAULT_REWARD} 리워드</strong>
                  </span>
                  <span>하루 이용 한도<strong>최대 {DAILY_AD_LIMIT}회</strong>
                  </span>
                  <span>내가 모은 리워드<strong>{wallet.balance}
                  </strong>
                  </span>
                </div>
                <button className="text-button" onClick={() => setDressing('shop')}>소품 둘러보기 →</button>
                <p className="small-note">광고를 끝까지 시청하면 지급돼요. 현금으로 교환되지 않아요.</p>
              </>}
            </section>
            <section className="side-card studio-clock">
              <div className="section-title">
                <h2>책상 위 작은 시계</h2>
                <ViewToggle view={view} onChange={setView} />
              </div>{view === 'analog' ? <div className="studio-dial">
                <AnalogClock pins={today} onDialClick={() => openComposer()} onMarkerClick={openEditor} />
              </div> : <DigitalClock onAdd={() => openComposer()} />}
            </section>
          </div>}
          <footer className="journal-footer">
            <span>PINLOG · EVERY LITTLE MOMENT</span>
            <button onClick={openOnboarding}>사용법 다시 보기</button>
          </footer>
        </main>
      </div>
      {dressing && <AvatarSheet initialTab={dressing} look={look} progress={progress} onChange={setLookPart} onClose={closeDressing} />}
      {toast && <div role="status" className="journal-toast">{toast}
      </div>}
    </div>
  )
}
