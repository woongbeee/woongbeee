import { IconBolt } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, ConceptGrid } from '../shared'
import { OptimizerFundamentalsPage } from './fundamentals/WhatIsOptimizerSection'
import { OptimizerExecutionPlansPage } from './execution-plans/ExecutionPlansSection'

import { OptimizerStatsPage } from './stats/StatsSection'
import { OptimizerAccessPathPage } from './access-path/AccessPathSection'
import { OptimizerJoinOverviewPage } from './join/JoinOverviewSection'
import { OptimizerJoinNestedLoopPage } from './join/NestedLoopSection'
import { OptimizerJoinHashPage } from './join/HashJoinSection'
import { OptimizerJoinSortMergePage } from './join/SortMergeSection'
import { OptimizerSimulator } from './simulator/OptimizerSimulator'

const LANDING_ITEMS = {
  ko: [
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Query Transformer', desc: '의미는 같지만 더 효율적인 형태로 쿼리를 변환합니다.' },
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Estimator', desc: '통계 기반으로 선택도·카디널리티·비용을 수치로 추정합니다.' },
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Plan Generator', desc: '가능한 모든 조합을 탐색해 최저 비용 실행 계획을 선택합니다.' },
  ],
  en: [
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Query Transformer', desc: 'Rewrites queries into a semantically equivalent but more efficient form.' },
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Estimator', desc: 'Estimates selectivity, cardinality, and cost from optimizer statistics.' },
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Plan Generator', desc: 'Explores all plan combinations and selects the one with the lowest cost.' },
  ],
}

export function OptimizerChapterPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  if (sectionId === 'optimizer-simulator') return <OptimizerSimulator />

  if (sectionId.startsWith('optimizer-fundamentals'))    return <OptimizerFundamentalsPage sectionId={sectionId} />
  if (sectionId.startsWith('optimizer-execution-plans')) return <OptimizerExecutionPlansPage sectionId={sectionId} />

  if (sectionId === 'optimizer-stats')            return <OptimizerStatsPage />
  if (sectionId === 'optimizer-access-path')      return <OptimizerAccessPathPage />
  if (sectionId === 'optimizer-join')             return <OptimizerJoinOverviewPage />
  if (sectionId === 'optimizer-join-nested-loop') return <OptimizerJoinNestedLoopPage />
  if (sectionId === 'optimizer-join-hash')        return <OptimizerJoinHashPage />
  if (sectionId === 'optimizer-join-sort-merge')  return <OptimizerJoinSortMergePage />

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconBolt size={36} stroke={1.5} className="text-amber" />}
        title={isKo ? '옵티마이저 원리' : 'Optimizer Principles'}
        subtitle={isKo
          ? 'Oracle CBO가 어떻게 통계를 수집하고 최적의 실행 계획을 생성하는지 학습합니다. 왼쪽 목차에서 섹션을 선택하세요.'
          : "Learn how Oracle's CBO collects statistics and generates optimal execution plans. Select a section from the left TOC."}
      />
      <div className="mt-4">
        <ConceptGrid items={LANDING_ITEMS[lang]} />
      </div>
    </PageContainer>
  )
}
