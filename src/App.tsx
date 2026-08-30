import { useEffect } from 'react'
import { useLangStore } from '@/store/simulationStore'
import { BookLayout } from '@/book/BookLayout'
import { InternalsSimulatorSection } from '@/book/chapters/internals/shared/SimulatorSection'
import { PartitionPage } from '@/book/chapters/partition'
import { QueryTransformPage } from '@/book/chapters/query-transform'

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
        <InternalsSimulatorSection />
      </div>
    )
  }

  if (printSection?.startsWith('partition-')) {
    return (
      <div className="bg-paper text-ink">
        <PartitionPage sectionId={printSection} />
      </div>
    )
  }

  if (printSection?.startsWith('qt-')) {
    return (
      <div className="bg-paper text-ink">
        <QueryTransformPage sectionId={printSection} />
      </div>
    )
  }

  return <BookLayout />
}

export default App
