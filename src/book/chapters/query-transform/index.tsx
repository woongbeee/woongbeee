import { QtOverviewSection } from './overview/OverviewSection'
import { QtOrExpansionSection } from './or-expansion/OrExpansionSection'
import { QtViewMergingSection } from './view-merging/ViewMergingSection'
import { QtPredicatePushingSection } from './predicate-pushing/PredicatePushingSection'
import { QtSubqueryUnnestingSection } from './subquery-unnesting/SubqueryUnnestingSection'
import { QtMaterializedViewSection } from './materialized-view/MaterializedViewSection'
import { QtStarTransformationSection } from './star-transformation/StarTransformationSection'
import { QtJoinFactorizationSection } from './join-factorization/JoinFactorizationSection'
import { QtSimulator } from './simulator/QtSimulator'

export function QueryTransformPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'qt-overview') return <QtOverviewSection />
  if (sectionId === 'qt-or-expansion') return <QtOrExpansionSection />
  if (sectionId === 'qt-view-merging') return <QtViewMergingSection />
  if (sectionId === 'qt-predicate-pushing') return <QtPredicatePushingSection />
  if (sectionId === 'qt-subquery-unnesting')
    return <QtSubqueryUnnestingSection />
  if (sectionId === 'qt-materialized-view') return <QtMaterializedViewSection />
  if (sectionId === 'qt-star-transformation')
    return <QtStarTransformationSection />
  if (sectionId === 'qt-join-factorization')
    return <QtJoinFactorizationSection />
  if (sectionId === 'qt-simulator') return <QtSimulator />

  return <QtOverviewSection />
}
