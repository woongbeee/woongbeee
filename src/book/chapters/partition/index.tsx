import { PartitionOverviewSection } from './PartitionOverviewSection'
import { PartitionStrategiesSection } from './PartitionStrategiesSection'
import { PartitionRangeSection } from './PartitionRangeSection'
import { PartitionListSection } from './PartitionListSection'
import { PartitionHashSection } from './PartitionHashSection'
import { PartitionCompositeSection } from './PartitionCompositeSection'
import { PartitionReferenceSection } from './PartitionReferenceSection'
import { PartitionIndexesSection } from './PartitionIndexesSection'
import { PartitionPruningSection } from './PartitionPruningSection'
import { PartitionWiseJoinSection } from './PartitionWiseJoinSection'

export function PartitionPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'partition-overview') return <PartitionOverviewSection />
  if (sectionId === 'partition-strategies') return <PartitionStrategiesSection />
  if (sectionId === 'partition-range') return <PartitionRangeSection />
  if (sectionId === 'partition-list') return <PartitionListSection />
  if (sectionId === 'partition-hash') return <PartitionHashSection />
  if (sectionId === 'partition-composite') return <PartitionCompositeSection />
  if (sectionId === 'partition-reference') return <PartitionReferenceSection />
  if (sectionId === 'partition-indexes') return <PartitionIndexesSection />
  if (sectionId === 'partition-pruning') return <PartitionPruningSection />
  if (sectionId === 'partition-wise-join') return <PartitionWiseJoinSection />

  return <PartitionOverviewSection />
}
