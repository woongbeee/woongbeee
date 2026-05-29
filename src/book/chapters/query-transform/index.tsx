import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SimulatorPlaceholder, WipBanner } from '../shared'
import { QtOverviewSection } from './overview/OverviewSection'
import { QtOrExpansionSection } from './or-expansion/OrExpansionSection'
import { QtViewMergingSection } from './view-merging/ViewMergingSection'
import { QtPredicatePushingSection } from './predicate-pushing/PredicatePushingSection'
import { QtSubqueryUnnestingSection } from './subquery-unnesting/SubqueryUnnestingSection'
import { QtMaterializedViewSection } from './materialized-view/MaterializedViewSection'
import { QtStarTransformationSection } from './star-transformation/StarTransformationSection'
import { QtJoinFactorizationSection } from './join-factorization/JoinFactorizationSection'

const T = {
  ko: { simDesc: '쿼리 변환 시뮬레이터 — 변환 전후 쿼리를 비교해보세요.' },
  en: { simDesc: 'Query Transform Simulator — Compare queries before and after transformation.' },
}

export function QueryTransformPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'qt-overview') return <QtOverviewSection />
  if (sectionId === 'qt-or-expansion') return <QtOrExpansionSection />
  if (sectionId === 'qt-view-merging') return <QtViewMergingSection />
  if (sectionId === 'qt-predicate-pushing') return <QtPredicatePushingSection />
  if (sectionId === 'qt-subquery-unnesting') return <QtSubqueryUnnestingSection />
  if (sectionId === 'qt-materialized-view') return <QtMaterializedViewSection />
  if (sectionId === 'qt-star-transformation') return <QtStarTransformationSection />
  if (sectionId === 'qt-join-factorization') return <QtJoinFactorizationSection />

  if (sectionId === 'qt-simulator') {
    return (
      <PageContainer>
        <ChapterTitle title="Query Transform Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Query Transform Simulator" color="cyan" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <WipBanner />
    </PageContainer>
  )
}
