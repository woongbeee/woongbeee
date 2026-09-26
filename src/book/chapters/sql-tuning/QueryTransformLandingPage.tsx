import { IconTransform } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  ConceptGrid,
} from '../shared'

const LANDING_ITEMS = {
  ko: [
    {
      icon: '🌳',
      title: '쿼리 변환 개요',
      desc: 'Query Transformer가 SQL을 재작성하는 기본 원리와 휴리스틱 vs 비용 기반 결정을 알아봐요.',
    },
    {
      icon: '🔀',
      title: 'OR Expansion',
      desc: 'OR 조건을 UNION ALL 브랜치로 나눠서 각 브랜치마다 다른 인덱스를 쓰게 해요.',
    },
    {
      icon: '🪟',
      title: 'View Merging',
      desc: '인라인 뷰를 바깥 쿼리 블록에 병합해서 더 넓은 범위의 최적화를 가능하게 해요.',
    },
    {
      icon: '⬇️',
      title: 'Predicate Pushing',
      desc: '뷰를 병합할 수 없을 때, 조건을 뷰 내부로 밀어 넣어 처리 행 수를 줄여요.',
    },
    {
      icon: '🔓',
      title: 'Subquery Unnesting',
      desc: 'WHERE의 서브쿼리를 조인으로 바꿔서 조인 순서·방법을 자유롭게 선택하게 해요.',
    },
    {
      icon: '📦',
      title: 'Query Rewrite with MVs',
      desc: '미리 집계된 Materialized View를 활용하도록 쿼리를 자동으로 재작성해요.',
    },
    {
      icon: '⭐',
      title: 'Star Transformation',
      desc: 'Star 스키마에서 팩트 테이블 Full Scan을 피하려고 Bitmap 세미조인을 추가해요.',
    },
    {
      icon: '🧮',
      title: 'Join Factorization',
      desc: 'UNION ALL 브랜치의 공통 테이블 참조를 인수분해해서 반복 스캔을 없애요.',
    },
    {
      icon: '🎮',
      title: 'Query Transform Simulator',
      desc: '변환 종류를 골라서 변환 전/후 쿼리·실행 계획·비용을 직접 비교해봐요.',
    },
  ],
  en: [
    {
      icon: '🌳',
      title: 'Query Transformation Overview',
      desc: 'How the Query Transformer rewrites SQL, and heuristic vs. cost-based decisions.',
    },
    {
      icon: '🔀',
      title: 'OR Expansion',
      desc: 'Splits OR conditions into UNION ALL branches so each branch can use a different index.',
    },
    {
      icon: '🪟',
      title: 'View Merging',
      desc: 'Merges an inline view into the outer query block, exposing a wider scope for optimization.',
    },
    {
      icon: '⬇️',
      title: 'Predicate Pushing',
      desc: 'When merging is not possible, pushes predicates inside the view to reduce the rows it processes.',
    },
    {
      icon: '🔓',
      title: 'Subquery Unnesting',
      desc: 'Converts a WHERE subquery into a join, letting the CBO freely choose join order and method.',
    },
    {
      icon: '📦',
      title: 'Query Rewrite with MVs',
      desc: 'Automatically rewrites a query to use a materialized view with precomputed results.',
    },
    {
      icon: '⭐',
      title: 'Star Transformation',
      desc: 'Avoids fact-table full scans in star schemas by adding bitmap semijoin predicates.',
    },
    {
      icon: '🧮',
      title: 'Join Factorization',
      desc: 'Factors out common table references across UNION ALL branches to eliminate repeated scans.',
    },
    {
      icon: '🎮',
      title: 'Query Transform Simulator',
      desc: 'Pick a transformation type and compare the query, plan, and cost before/after.',
    },
  ],
}

const T = {
  ko: {
    title: '쿼리 변환',
    subtitle:
      'Oracle CBO가 SQL을 실행하기 전, 의미는 동일하지만 더 효율적인 형태로 재작성하는 7가지 핵심 기법을 알아봐요.',
    sectionTitle: '이 섹션에서 배우는 것',
  },
  en: {
    title: 'Query Transformation',
    subtitle:
      "Learn the 7 key techniques Oracle's CBO uses to rewrite SQL into a semantically equivalent, more efficient form before execution.",
    sectionTitle: 'What You’ll Learn',
  },
}

export function QueryTransformLandingPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconTransform size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />
      <SectionTitle>{t.sectionTitle}</SectionTitle>
      <ConceptGrid items={LANDING_ITEMS[lang]} />
    </PageContainer>
  )
}
