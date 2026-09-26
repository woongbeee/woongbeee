import { ParallelOverviewSection } from './ParallelOverviewSection'
import { ParallelDopSection } from './ParallelDopSection'
import { ParallelCoordinatorSection } from './ParallelCoordinatorSection'
import { ParallelPipelineSection } from './ParallelPipelineSection'
import { ParallelMultiTqSection } from './ParallelMultiTqSection'

export function ParallelPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'parallel-overview') return <ParallelOverviewSection />
  if (sectionId === 'parallel-dop') return <ParallelDopSection />
  if (sectionId === 'parallel-coordinator')
    return <ParallelCoordinatorSection />
  if (sectionId === 'parallel-pipeline') return <ParallelPipelineSection />
  if (sectionId === 'parallel-multi-tq') return <ParallelMultiTqSection />

  return <ParallelOverviewSection />
}
