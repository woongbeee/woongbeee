import { IconArrowsSort } from '@tabler/icons-react'
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
      icon: '📖',
      title: '소트 연산 개요',
      desc: 'ORDER BY·GROUP BY·UNION 등 어떤 SQL 연산이 정렬을 유발하는지, 실행 계획에 어떻게 나타나는지 알아봐요.',
    },
    {
      icon: '💾',
      title: 'Sort Area와 Temp 세그먼트',
      desc: 'PGA Work Area의 Optimal/One-Pass/Multi-Pass 실행 모드와 PGA_AGGREGATE_TARGET 튜닝을 다뤄요.',
    },
    {
      icon: '🚫',
      title: '소트 회피 전략',
      desc: '인덱스·Hash Aggregate·UNION ALL로 정렬을 완전히 없애는 실전 전략들을 알아봐요.',
    },
    {
      icon: '🎮',
      title: 'Sort Simulator',
      desc: 'PGA 크기를 조절해보면서 정렬이 메모리에서 끝나는지 디스크로 스필되는지 직접 확인해요.',
    },
  ],
  en: [
    {
      icon: '📖',
      title: 'Sort Operations Overview',
      desc: 'Which SQL operations trigger sorting (ORDER BY, GROUP BY, UNION, …) and how they appear in execution plans.',
    },
    {
      icon: '💾',
      title: 'Sort Area & Temp Segment',
      desc: "Covers the PGA Work Area's Optimal/One-Pass/Multi-Pass execution modes and PGA_AGGREGATE_TARGET tuning.",
    },
    {
      icon: '🚫',
      title: 'Sort Avoidance Strategies',
      desc: 'Practical strategies to eliminate sorting entirely using indexes, Hash Aggregate, and UNION ALL.',
    },
    {
      icon: '🎮',
      title: 'Sort Simulator',
      desc: 'Adjust PGA size and see whether a sort finishes in memory or spills to disk.',
    },
  ],
}

const T = {
  ko: {
    title: '소트 튜닝',
    subtitle: 'Oracle의 소트 연산 메커니즘과 성능 튜닝 전략을 학습해요.',
    sectionTitle: '이 섹션에서 배우는 것',
  },
  en: {
    title: 'Sort Tuning',
    subtitle:
      "Learn Oracle's sort operation mechanisms and performance tuning strategies.",
    sectionTitle: 'What You’ll Learn',
  },
}

export function SortLandingPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowsSort size={36} stroke={1.5} className="text-rose" />}
        title={t.title}
        subtitle={t.subtitle}
      />
      <SectionTitle>{t.sectionTitle}</SectionTitle>
      <ConceptGrid items={LANDING_ITEMS[lang]} />
    </PageContainer>
  )
}
