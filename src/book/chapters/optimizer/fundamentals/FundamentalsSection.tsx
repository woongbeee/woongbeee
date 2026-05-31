import {
  IconDatabase,
  IconLayersIntersect,
  IconMathFunction,
  IconRefresh,
  IconBolt,
} from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SectionTitle, ConceptGrid } from '../../shared'
import { SqlProcessingSection } from './sql-processing/SqlProcessingSection'
import { ComponentsSection } from './components/ComponentsSection'
import { AdaptiveSection } from './adaptive/AdaptiveSection'
import { ApproxSection } from './approx/ApproxSection'
import { SpmSection } from './spm/SpmSection'

const LANDING_ITEMS = {
  ko: [
    {
      icon: <IconLayersIntersect size={20} stroke={1.5} />,
      title: 'SQL 처리 4단계',
      desc: 'Parsing → Optimization → Row Source Generation → Execution. 각 단계가 무엇을 하는지 이해하면 튜닝 방향이 보입니다.',
    },
    {
      icon: <IconMathFunction size={20} stroke={1.5} />,
      title: '옵티마이저 3가지 구성 요소',
      desc: 'Query Transformer, Estimator, Plan Generator가 협력해 최저 비용 실행 계획을 도출합니다.',
    },
    {
      icon: <IconRefresh size={20} stroke={1.5} />,
      title: 'Adaptive Query Optimization',
      desc: '실행 중 수집한 통계로 계획을 실시간 조정합니다. Adaptive Plans와 Adaptive Statistics로 구성됩니다.',
    },
    {
      icon: <IconBolt size={20} stroke={1.5} />,
      title: 'Approximate Query Processing',
      desc: '오차 허용 범위 내에서 대용량 집계 쿼리를 수십 배 빠르게 처리하는 최적화 기법입니다.',
    },
  ],
  en: [
    {
      icon: <IconLayersIntersect size={20} stroke={1.5} />,
      title: 'SQL Processing — 4 Stages',
      desc: 'Parsing → Optimization → Row Source Generation → Execution. Understanding each stage shows you where to focus your tuning efforts.',
    },
    {
      icon: <IconMathFunction size={20} stroke={1.5} />,
      title: '3 Optimizer Components',
      desc: 'Query Transformer, Estimator, and Plan Generator collaborate to derive the lowest-cost execution plan.',
    },
    {
      icon: <IconRefresh size={20} stroke={1.5} />,
      title: 'Adaptive Query Optimization',
      desc: 'Adjusts plans at runtime using statistics collected during execution — Adaptive Plans and Adaptive Statistics.',
    },
    {
      icon: <IconBolt size={20} stroke={1.5} />,
      title: 'Approximate Query Processing',
      desc: 'Speeds up large-scale aggregate queries by orders of magnitude within an acceptable error range.',
    },
  ],
}

const LANDING_TEXT = {
  ko: {
    title: 'Query Optimizer Fundamentals',
    subtitle:
      'Oracle SQL을 튜닝하려면 먼저 쿼리 옵티마이저(query optimizer)를 이해해야 합니다. 옵티마이저는 SQL 문장이 데이터에 접근하는 가장 효율적인 방법을 결정하는 내장 소프트웨어입니다.',
    concepts: '핵심 개념',
  },
  en: {
    title: 'Query Optimizer Fundamentals',
    subtitle:
      'To tune Oracle SQL, you must understand the query optimizer. The optimizer is built-in software that determines the most efficient method for a SQL statement to access data.',
    concepts: 'Key Concepts',
  },
}

export function OptimizerFundamentalsPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)

  if (sectionId === 'optimizer-fundamentals-sql-processing') return <SqlProcessingSection />
  if (sectionId === 'optimizer-fundamentals-components')    return <ComponentsSection />
  if (sectionId === 'optimizer-fundamentals-adaptive')      return <AdaptiveSection />
  if (sectionId === 'optimizer-fundamentals-approx')        return <ApproxSection />
  if (sectionId === 'optimizer-fundamentals-spm')           return <SpmSection />

  const t = LANDING_TEXT[lang]
  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconDatabase size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />
      <SectionTitle>{t.concepts}</SectionTitle>
      <ConceptGrid items={LANDING_ITEMS[lang]} />
    </PageContainer>
  )
}
