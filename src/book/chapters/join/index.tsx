import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, WipBanner } from '../shared'
import { JoinOverviewSection } from './overview/OverviewSection'
import { JoinNestedLoopSection } from './nested-loop/NestedLoopSection'
import { JoinHashSection } from './hash/HashJoinSection'
import { JoinSortMergeSection } from './sort-merge/SortMergeSection'
import { JoinSimulatorSection } from './simulator/JoinSimulatorSection'

export function JoinPage({ sectionId }: { sectionId: string }) {
  useSimulationStore((s) => s.lang)

  if (sectionId === 'join-overview')    return <JoinOverviewSection />
  if (sectionId === 'join-nested-loop') return <JoinNestedLoopSection />
  if (sectionId === 'join-hash')        return <JoinHashSection />
  if (sectionId === 'join-sort-merge')  return <JoinSortMergeSection />
  if (sectionId === 'join-simulator')   return <JoinSimulatorSection />

  return (
    <PageContainer>
      <WipBanner />
    </PageContainer>
  )
}
