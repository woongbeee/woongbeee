import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react'
import { useLangStore } from '@/store/simulationStore'

// 뷰별로 코드 스플리팅 — 메인(시뮬레이터) 진입 시 학습서 번들을 받지 않고, 그 반대도 마찬가지
const SimulatorPage = lazy(() => import('@/simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage })))
const BookLayout = lazy(() => import('@/book/BookLayout').then((m) => ({ default: m.BookLayout })))
const PartitionPage = lazy(() => import('@/book/chapters/partition').then((m) => ({ default: m.PartitionPage })))
const QueryTransformPage = lazy(() => import('@/book/chapters/query-transform').then((m) => ({ default: m.QueryTransformPage })))

// 최상위 뷰: 메인은 Internals Simulator, `#book` 해시면 학습서.
// 해시를 단일 진실 공급원으로 써서 새로고침·뒤로 가기가 그대로 동작한다.
type AppView = 'simulator' | 'book'

const BOOK_HASH = '#book'

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getView = (): AppView => (window.location.hash === BOOK_HASH ? 'book' : 'simulator')

const openBook = () => {
  window.location.hash = BOOK_HASH
}
const openSimulator = () => {
  window.location.hash = ''
}

export function App() {
  const view = useSyncExternalStore(subscribeHash, getView)
  const lang = useLangStore((s) => s.lang)
  const theme = useLangStore((s) => s.theme)

  // PDF 인쇄용 모드: ?print=<sectionId> 로 접근 시 해당 섹션만 단독 렌더
  const printSection = new URLSearchParams(window.location.search).get('print')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Theme: single source of truth is tokens.css (:root / [data-theme]).
  // App just reflects the store's choice onto <html data-theme>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  if (printSection?.startsWith('partition-') || printSection?.startsWith('qt-')) {
    return (
      <div className="bg-paper text-ink">
        <Suspense fallback={null}>
          {printSection.startsWith('partition-') ? (
            <PartitionPage sectionId={printSection} />
          ) : (
            <QueryTransformPage sectionId={printSection} />
          )}
        </Suspense>
      </div>
    )
  }

  if (view === 'book') {
    return (
      <Suspense fallback={null}>
        <BookLayout onOpenSimulator={openSimulator} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={null}>
      <SimulatorPage onOpenBook={openBook} />
    </Suspense>
  )
}

export default App
