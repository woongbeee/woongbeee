import { SortOverviewSection } from './overview/OverviewSection'
import { SortMemorySection } from './memory/MemorySection'
import { SortAvoidSection } from './avoid/AvoidSection'
import { SortSimulator } from './simulator/SortSimulator'

export function SortPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'sort-overview') return <SortOverviewSection />
  if (sectionId === 'sort-memory') return <SortMemorySection />
  if (sectionId === 'sort-avoid') return <SortAvoidSection />
  if (sectionId === 'sort-simulator') return <SortSimulator />

  return <SortOverviewSection />
}
