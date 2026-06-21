import { ParallelOverviewSection } from './ParallelOverviewSection'
import { ParallelDopSection } from './ParallelDopSection'
import { ParallelCoordinatorSection } from './ParallelCoordinatorSection'

export function ParallelPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'parallel-overview') return <ParallelOverviewSection />
  if (sectionId === 'parallel-dop') return <ParallelDopSection />
  if (sectionId === 'parallel-coordinator') return <ParallelCoordinatorSection />

  return <ParallelOverviewSection />
}
