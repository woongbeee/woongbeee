import { IconLayoutGrid } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  ConceptGrid,
} from '../shared'

const T = {
  ko: {
    title: '파티셔닝 개요',
    subtitle:
      '파티셔닝은 하나의 대형 테이블이나 인덱스를 여러 개의 작은 물리적 조각(파티션)으로 나누는 기법이에요. SQL 관점에서는 여전히 하나의 테이블처럼 보이지만, 내부적으로는 파티션 단위로 독립 관리돼요.',

    whatTitle: '파티셔닝이란?',
    whatDesc:
      '대용량 테이블을 단일 세그먼트로 관리하면 DML 경합, 백업 시간, 불필요한 I/O 등 여러 문제가 생겨요. 파티셔닝은 이 테이블을 파티션 키(Partition Key)에 따라 여러 세그먼트로 분할해요.\n\n각 파티션은 고유한 이름과 독립적인 물리 저장 속성을 가져요. Oracle은 SQL 수행 시 관련 파티션만 접근(Partition Pruning)하기 때문에 대용량 테이블에서도 효율적인 쿼리가 가능해요.',

    benefitsTitle: '파티셔닝의 이점',
    benefits: [
      {
        icon: <span className="text-xl">⚡</span>,
        title: '쿼리 성능 향상',
        desc: 'Partition Pruning으로 관련 파티션만 스캔해서 I/O를 대폭 절감해요.',
        color: 'blue',
      },
      {
        icon: <span className="text-xl">🔧</span>,
        title: '관리 편의성',
        desc: '파티션 단위로 데이터 로드, 삭제, 이동, 백업이 가능해서 작업 부담이 줄어들어요.',
        color: 'orange',
      },
      {
        icon: <span className="text-xl">🔀</span>,
        title: '병렬 처리',
        desc: '파티션별 병렬 쿼리와 Partition-Wise Join으로 처리 속도를 높여요.',
        color: 'tip',
      },
      {
        icon: <span className="text-xl">📦</span>,
        title: '데이터 아카이빙',
        desc: '오래된 파티션을 DROP 또는 Exchange로 빠르게 아카이빙할 수 있어요.',
        color: 'warning',
      },
    ],

    keyConceptTitle: '핵심 개념',
    partitionKey: '파티션 키(Partition Key)',
    partitionKeyDesc:
      '각 행이 어느 파티션에 저장될지를 결정하는 컬럼 또는 컬럼 집합이에요. 파티션 키는 파티셔닝 방식(Range, List, Hash 등)과 함께 정의돼요.',
    partitionPruning: 'Partition Pruning',
    partitionPruningDesc:
      'WHERE 조건에 파티션 키가 포함되면 Oracle은 조건과 무관한 파티션을 자동으로 제외해요. 실행 계획에서 PARTITION RANGE SINGLE 또는 PARTITION LIST SINGLE 등으로 확인할 수 있어요.',

    strategiesTitle: '파티셔닝 전략 비교',
    strategiesTable: [
      ['Range', '파티션 키의 범위로 분할', '날짜(월별·연별), 금액 구간', '가장 일반적. MAXVALUE로 예외 처리'],
      ['Interval', 'Range의 확장 — 범위 초과 시 자동 파티션 생성', '월별 자동 파티셔닝', '11g 이상. 관리 오버헤드 최소화'],
      ['List', '특정 값 목록으로 분할', '지역 코드, 국가, 부서 코드', '값이 이산적이고 명확할 때'],
      ['Hash', '해시 함수로 균등 분산', '균등 분산이 필요한 OLTP 테이블', '데이터 스큐 방지. 분포 제어 불가'],
      ['Composite', '두 가지 방식 결합(부모+자식)', 'Range-Hash, Range-List', '다차원 Pruning. 복잡한 쿼리 패턴에 유리'],
      ['Reference', '부모 테이블 FK를 통해 파티션 전략 상속', '주문-주문상세 같은 마스터-디테일', '자식 테이블에 파티션 키 컬럼 불필요'],
    ],

    whenTitle: '파티셔닝 적용 기준',
    whenDesc:
      'Oracle은 일반적으로 2GB 이상의 테이블, 또는 이력 데이터를 주기적으로 삭제·아카이빙해야 하는 테이블에 파티셔닝을 권장해요.\n\n파티셔닝은 테이블 크기가 아니라 데이터 관리 방식과 쿼리 패턴에 따라 결정해요. 파티션 키가 쿼리 WHERE 조건에 자주 등장하지 않으면 Pruning 효과를 얻지 못해요.',
    summary:
      '파티셔닝은 대용량 테이블의 성능과 관리성을 동시에 해결하는 핵심 기법이에요. 파티션 키 선택과 파티셔닝 전략이 쿼리 성능에 직결되기 때문에, 데이터 특성과 쿼리 패턴을 먼저 분석한 뒤 전략을 선택해요.',
  },

  en: {
    title: 'Partitioning Overview',
    subtitle:
      'Partitioning divides a large table or index into smaller physical pieces called partitions. From SQL, the object still appears as a single table; internally, each partition is managed independently.',

    whatTitle: 'What is Partitioning?',
    whatDesc:
      'Managing a very large table as a single segment causes problems: DML contention, long backup windows, and unnecessary I/O. Partitioning splits the table into multiple segments according to a partition key.\n\nEach partition has a unique name and independent physical storage attributes. Oracle accesses only the relevant partitions for a given query (Partition Pruning), enabling efficient queries even on very large tables.',

    benefitsTitle: 'Benefits of Partitioning',
    benefits: [
      {
        icon: <span className="text-xl">⚡</span>,
        title: 'Query Performance',
        desc: 'Partition Pruning scans only relevant partitions, dramatically reducing I/O.',
        color: 'blue',
      },
      {
        icon: <span className="text-xl">🔧</span>,
        title: 'Manageability',
        desc: 'Load, delete, move, or back up data at the partition level, reducing administrative overhead.',
        color: 'orange',
      },
      {
        icon: <span className="text-xl">🔀</span>,
        title: 'Parallel Processing',
        desc: 'Per-partition parallel queries and Partition-Wise Joins improve throughput.',
        color: 'tip',
      },
      {
        icon: <span className="text-xl">📦</span>,
        title: 'Data Archiving',
        desc: 'Archive old data instantly by DROPping or EXCHANGing individual partitions.',
        color: 'warning',
      },
    ],

    keyConceptTitle: 'Key Concepts',
    partitionKey: 'Partition Key',
    partitionKeyDesc:
      'The column or set of columns that determines which partition each row is stored in. The partition key is defined together with the partitioning method (Range, List, Hash, etc.).',
    partitionPruning: 'Partition Pruning',
    partitionPruningDesc:
      'When a WHERE clause includes the partition key, Oracle automatically excludes unrelated partitions. Visible in the execution plan as PARTITION RANGE SINGLE, PARTITION LIST SINGLE, etc.',

    strategiesTitle: 'Partitioning Strategies Comparison',
    strategiesTable: [
      ['Range', 'Split by value ranges of the partition key', 'Dates (monthly, yearly), amount ranges', 'Most common. Use MAXVALUE for overflow'],
      ['Interval', 'Range extension — automatically creates partitions when data exceeds existing ranges', 'Monthly auto-partitioning', '11g+. Minimizes administrative overhead'],
      ['List', 'Split by an explicit list of discrete values', 'Region codes, countries, department codes', 'When values are discrete and well-known'],
      ['Hash', 'Even distribution via hash function', 'OLTP tables requiring even spread', 'Prevents data skew; distribution not controllable'],
      ['Composite', 'Combines two methods (parent + subpartition)', 'Range-Hash, Range-List', 'Multi-dimensional pruning; suits complex query patterns'],
      ['Reference', 'Child table inherits parent table partitioning via FK', 'Master-detail: orders + order_items', 'No need to duplicate partition key in child table'],
    ],

    whenTitle: 'When to Apply Partitioning',
    whenDesc:
      'Oracle generally recommends partitioning for tables larger than 2 GB, or tables where historical data is periodically purged or archived.\n\nThe decision is driven by data management needs and query patterns, not just table size. If the partition key rarely appears in query WHERE clauses, Pruning benefits will not be realized.',
    summary:
      'Partitioning simultaneously addresses performance and manageability for large tables. Because partition key selection directly impacts query performance, always analyze data characteristics and query patterns before choosing a strategy.',
  },
}

export function PartitionOverviewSection() {
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

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.benefitsTitle}</SectionTitle>
      <ConceptGrid items={t.benefits} />

      <Divider />

      <SectionTitle>{t.keyConceptTitle}</SectionTitle>
      <Table
        headers={isKo ? ['개념', '설명'] : ['Concept', 'Description']}
        rows={[
          [t.partitionKey, t.partitionKeyDesc],
          [t.partitionPruning, t.partitionPruningDesc],
        ]}
      />

      <Divider />

      <SectionTitle>{t.strategiesTitle}</SectionTitle>
      <Table
        headers={isKo ? ['전략', '분할 기준', '주요 사용처', '특징'] : ['Strategy', 'Split Criteria', 'Use Case', 'Notes']}
        rows={t.strategiesTable}
      />

      <Divider />

      <SectionTitle>{t.whenTitle}</SectionTitle>
      <Prose>{t.whenDesc}</Prose>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
