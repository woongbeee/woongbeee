import { IconWand, IconTransform, IconArrowsSort } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  ConceptGrid,
  InfoBox,
  Divider,
} from '../shared'

const T = {
  ko: {
    title: 'SQL 튜닝',
    subtitle:
      'Oracle이 SQL을 더 빠르게 실행하려고 쿼리 구조를 바꾸는 방법(쿼리 변환)과, 정렬 연산의 비용을 줄이는 방법(소트 튜닝)을 다뤄요.',

    whatTitle: '이 챕터에서 배우는 것',
    whatDesc:
      'SQL 튜닝은 옵티마이저가 "무엇을" 선택하는지(액세스 패스, 조인 방식 — 8장에서 다뤘어요)를 넘어서, "어떻게 더 효율적인 형태로 바꾸는지", 그리고 "정렬처럼 비용이 큰 연산을 어떻게 줄이는지"를 다루는 심화 영역이에요.',

    areasTitle: '두 가지 영역',
    areas: [
      {
        icon: <IconTransform size={20} stroke={1.5} />,
        title: '쿼리 변환 (Query Transformation)',
        desc: 'Query Transformer가 원본 SQL을 더 효율적인 동의 형태로 재작성해요. OR Expansion, View Merging, Subquery Unnesting 등 7가지 기법을 다뤄요.',
        color: 'green',
      },
      {
        icon: <IconArrowsSort size={20} stroke={1.5} />,
        title: '소트 튜닝 (Sort Tuning)',
        desc: 'ORDER BY·GROUP BY 등에서 발생하는 정렬이 메모리(PGA)에서 끝나는지 디스크로 넘치는지, 그리고 어떻게 이를 회피하는지 다뤄요.',
        color: 'rose',
      },
    ],

    noteTitle: '8장(옵티마이저)과 이어져요',
    noteDesc:
      '8장에서 배운 CBO(Cost-Based Optimizer)의 3단계 — Query Transformer → Estimator → Plan Generator — 를 기억하나요? 이 챕터의 "쿼리 변환"은 바로 그 1단계를 자세히 파고드는 내용이에요.',
  },
  en: {
    title: 'SQL Tuning',
    subtitle:
      'Covers how Oracle rewrites query structure to run faster (query transformation) and how to reduce the cost of sort operations (sort tuning).',

    whatTitle: 'What This Chapter Covers',
    whatDesc:
      'SQL Tuning goes beyond what the optimizer chooses (access paths, join methods — covered in Chapter 8) into how it rewrites queries into more efficient forms, and how to reduce the cost of expensive operations like sorting.',

    areasTitle: 'Two Areas',
    areas: [
      {
        icon: <IconTransform size={20} stroke={1.5} />,
        title: 'Query Transformation',
        desc: 'The Query Transformer rewrites the original SQL into a semantically equivalent, more efficient form. Covers 7 techniques: OR Expansion, View Merging, Subquery Unnesting, and more.',
        color: 'green',
      },
      {
        icon: <IconArrowsSort size={20} stroke={1.5} />,
        title: 'Sort Tuning',
        desc: 'Covers whether sorts from ORDER BY, GROUP BY, etc. finish in the PGA (memory) or spill to disk, and how to avoid them.',
        color: 'rose',
      },
    ],

    noteTitle: 'Connects to Chapter 8 (Optimizer)',
    noteDesc:
      'Remember the CBO\'s (Cost-Based Optimizer) three phases from Chapter 8 — Query Transformer → Estimator → Plan Generator? This chapter\'s "Query Transformation" section is a deep dive into that first phase.',
  },
}

export function SqlTuningOverviewPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconWand size={36} stroke={1.5} className="text-rose" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.areasTitle}</SectionTitle>
      <ConceptGrid items={t.areas} />

      <div className="mt-8">
        <InfoBox variant="note">
          <strong>{t.noteTitle}</strong>
          <br />
          {t.noteDesc}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
