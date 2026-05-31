import {
  IconReportAnalytics,
  IconSearch,
  IconLayoutList,
  IconArrowsShuffle,
} from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SectionTitle, ConceptGrid } from '../../shared'
import { ExplainSection } from './explain/ExplainSection'
import { DisplaySection } from './display/DisplaySection'
import { CompareSection } from './compare/CompareSection'

const LANDING_ITEMS = {
  ko: [
    {
      icon: <IconSearch size={20} stroke={1.5} />,
      title: 'EXPLAIN PLAN 사용법',
      desc: 'SQL을 실제로 실행하지 않고 옵티마이저가 선택할 실행 계획을 PLAN_TABLE에 저장합니다. 계획이 변경되는 이유도 다룹니다.',
    },
    {
      icon: <IconLayoutList size={20} stroke={1.5} />,
      title: '실행 계획 확인하기',
      desc: 'DISPLAY, DISPLAY_CURSOR, DISPLAY_AWR 등 DBMS_XPLAN 함수와 V$ 뷰로 계획을 조회합니다.',
    },
    {
      icon: <IconArrowsShuffle size={20} stroke={1.5} />,
      title: '실행 계획 비교하기',
      desc: '기준 계획과 테스트 계획의 차이를 논리적으로 비교해 성능 회귀 원인을 파악합니다.',
    },
  ],
  en: [
    {
      icon: <IconSearch size={20} stroke={1.5} />,
      title: 'Generating Plans with EXPLAIN PLAN',
      desc: "Store the optimizer's chosen plan in PLAN_TABLE without executing SQL. Covers why plans change.",
    },
    {
      icon: <IconLayoutList size={20} stroke={1.5} />,
      title: 'Displaying Execution Plans',
      desc: 'Display plans with DBMS_XPLAN functions (DISPLAY, DISPLAY_CURSOR, DISPLAY_AWR) and V$ views.',
    },
    {
      icon: <IconArrowsShuffle size={20} stroke={1.5} />,
      title: 'Comparing Execution Plans',
      desc: 'Logically compare a reference plan against test plans to identify the source of regressions.',
    },
  ],
}

const LANDING_TEXT = {
  ko: {
    title: 'Query Execution Plans',
    subtitle:
      '쿼리 성능이 좋지 않다면 실행 계획(execution plan)이 문제를 이해하고 해결책을 찾는 핵심 도구입니다. SQL 문장을 설명(explain)하고 실행 계획을 표시하는 방법을 아는 것은 SQL 튜닝의 필수 지식입니다.',
    concepts: '핵심 도구',
  },
  en: {
    title: 'Query Execution Plans',
    subtitle:
      'If a query has suboptimal performance, the execution plan is the key tool for understanding the problem and supplying a solution. Knowledge of how to explain a statement and display its plan is essential to SQL tuning.',
    concepts: 'Key Tools',
  },
}

export function OptimizerExecutionPlansPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)

  if (sectionId === 'optimizer-execution-plans-explain') return <ExplainSection />
  if (sectionId === 'optimizer-execution-plans-display') return <DisplaySection />
  if (sectionId === 'optimizer-execution-plans-compare') return <CompareSection />

  const t = LANDING_TEXT[lang]
  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconReportAnalytics size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />
      <SectionTitle>{t.concepts}</SectionTitle>
      <ConceptGrid items={LANDING_ITEMS[lang]} />
    </PageContainer>
  )
}
