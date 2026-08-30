import { IconLayoutGrid } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  InfoBox,
  Divider,
  Table,
} from '../shared'

const T = {
  ko: {
    title: '파티셔닝 전략',
    subtitle: 'Oracle은 Range, Interval, List, Hash, Composite, Reference의 6가지 파티셔닝 전략을 제공합니다. 데이터 특성과 쿼리 패턴에 따라 전략을 선택합니다.',

    chooseTitle: '전략 선택 기준',
    chooseTable: [
      ['날짜·숫자 범위로 구분되는 데이터', 'Range 또는 Interval'],
      ['이산적인 값(코드, 지역)으로 구분되는 데이터', 'List'],
      ['균등 분산이 필요한 OLTP 데이터', 'Hash'],
      ['두 가지 기준을 동시에 적용해야 하는 경우', 'Composite (Range-Hash, Range-List)'],
      ['부모-자식 테이블이 같은 파티션 전략을 공유해야 하는 경우', 'Reference'],
    ],

    summary:
      '파티셔닝 전략마다 Pruning 방식과 적합한 쿼리 패턴이 다릅니다. 하위 페이지에서 각 전략의 작동 방식과 SQL 예시를 자세히 살펴봅니다.',
  },
  en: {
    title: 'Partitioning Strategies',
    subtitle: 'Oracle offers six partitioning strategies: Range, Interval, List, Hash, Composite, and Reference. Choose based on data characteristics and query patterns.',

    chooseTitle: 'Choosing a Strategy',
    chooseTable: [
      ['Data partitioned by date or numeric ranges', 'Range or Interval'],
      ['Data partitioned by discrete values (codes, regions)', 'List'],
      ['OLTP data requiring even distribution', 'Hash'],
      ['Two criteria needed simultaneously', 'Composite (Range-Hash, Range-List)'],
      ['Parent-child tables should share the same partitioning strategy', 'Reference'],
    ],

    summary:
      'Each strategy has different pruning behavior and suits different query patterns. The sub-pages below cover how each strategy works with SQL examples.',
  },
}

export function PartitionStrategiesSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayoutGrid size={36} stroke={1.5} className="text-amber" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.chooseTitle}</SectionTitle>
      <Table
        headers={isKo ? ['데이터 / 요구사항', '권장 전략'] : ['Data / Requirement', 'Recommended Strategy']}
        rows={t.chooseTable}
      />

      <Divider />

      <InfoBox variant="summary">{t.summary}</InfoBox>
    </PageContainer>
  )
}
