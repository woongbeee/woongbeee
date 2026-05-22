import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, WipBanner } from '../../../../shared'
import { SgaPositionDiagram } from '../shared/SgaPositionDiagram'

export function UndoSegmentSection() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        title={lang === 'ko' ? 'Undo Segment' : 'Undo Segment'}
      />
      <SgaPositionDiagram activeId="large-pool" />
      <WipBanner />
    </div>
  )
}
