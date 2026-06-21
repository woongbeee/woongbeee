import { useEffect } from 'react'
import { BookLayout } from '@/book/BookLayout'
import { InternalsSimulatorSection } from '@/book/chapters/internals/shared/SimulatorSection'
import { PartitionPage } from '@/book/chapters/partition'
import { QueryTransformPage } from '@/book/chapters/query-transform'

export function App() {
  const isSimulatorWindow = window.location.hash === '#simulator'

  // PDF 인쇄용 모드: ?print=<sectionId> 로 접근 시 해당 섹션만 단독 렌더
  const printSection = new URLSearchParams(window.location.search).get('print')

  useEffect(() => {
    if (isSimulatorWindow) {
      document.title = 'Internals Simulator — Oracle DB'
    }
  }, [isSimulatorWindow])

  if (isSimulatorWindow) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <InternalsSimulatorSection />
      </div>
    )
  }

  if (printSection?.startsWith('partition-')) {
    return (
      <div className="bg-background text-foreground">
        <PartitionPage sectionId={printSection} />
      </div>
    )
  }

  if (printSection?.startsWith('qt-')) {
    return (
      <div className="bg-background text-foreground">
        <QueryTransformPage sectionId={printSection} />
      </div>
    )
  }

  return <BookLayout />
}

export default App
