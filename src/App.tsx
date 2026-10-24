import { lazy, Suspense, useEffect } from 'react'
import { useLangStore } from '@/store/simulationStore'
import { BookLayout } from '@/book/BookLayout'

// 특수 진입점(#simulator, ?print=) 전용 — 일반 진입 시 메인 번들에 포함되지 않도록 지연 로드
const InternalsSimulatorSection = lazy(() => import('@/book/chapters/internals/shared/SimulatorSection').then((m) => ({ default: m.InternalsSimulatorSection })))
const PartitionPage = lazy(() => import('@/book/chapters/partition').then((m) => ({ default: m.PartitionPage })))
const QueryTransformPage = lazy(() => import('@/book/chapters/query-transform').then((m) => ({ default: m.QueryTransformPage })))

export function App() {
  const isSimulatorWindow = window.location.hash === '#simulator'
  const lang = useLangStore((s) => s.lang)
  const theme = useLangStore((s) => s.theme)

  // PDF 인쇄용 모드: ?print=<sectionId> 로 접근 시 해당 섹션만 단독 렌더
  const printSection = new URLSearchParams(window.location.search).get('print')

  useEffect(() => {
    if (isSimulatorWindow) {
      document.title = 'Internals Simulator — Oracle DB'
    }
  }, [isSimulatorWindow])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Theme: single source of truth is tokens.css (:root / [data-theme]).
  // App just reflects the store's choice onto <html data-theme>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  if (isSimulatorWindow) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-paper text-ink">
        <Suspense fallback={null}>
          <InternalsSimulatorSection />
        </Suspense>
      </div>
    )
  }

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

  return <BookLayout />
}

export default App
