import { IconHash } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../shared'

const T = {
  ko: {
    title: 'Hash 파티션',
    subtitle:
      'Hash 파티션은 내부 해시 함수로 파티션 키를 매핑해서 행을 균등하게 분산해요. 데이터 스큐를 방지하고 OLTP 경합을 줄이는 데 효과적이에요.',

    whatTitle: 'Hash 파티션이란?',
    whatDesc:
      'Range나 List와 달리 Hash 파티션은 어떤 행이 어떤 파티션에 저장될지를 제어할 수 없어요. Oracle의 내부 해시 함수가 파티션 키 값을 받아 파티션 번호를 결정해요.\n\n파티션 수를 2의 거듭제곱(2, 4, 8, 16...)으로 설정하면 해시 분포가 가장 균등해져요. 주요 사용 목적은 데이터 스큐 방지, OLTP 세그먼트 경합 감소, Partition-Wise Join 지원이에요.',

    basicSql: `-- Hash 파티션 (파티션 수 지정)
CREATE TABLE products (
  prod_id   NUMBER,
  prod_name VARCHAR2(100),
  category  VARCHAR2(50),
  price     NUMBER
)
PARTITION BY HASH (prod_id)
PARTITIONS 4;  -- 2의 거듭제곱 권장

-- 파티션에 이름과 테이블스페이스 명시
CREATE TABLE orders (
  order_id   NUMBER,
  customer_id NUMBER,
  order_date  DATE
)
PARTITION BY HASH (order_id) (
  PARTITION p1 TABLESPACE ts1,
  PARTITION p2 TABLESPACE ts2,
  PARTITION p3 TABLESPACE ts3,
  PARTITION p4 TABLESPACE ts4
);

-- Hash 파티션 추가 (파티션 전체 재배분 발생)
ALTER TABLE products ADD PARTITIONS 4;  -- 4개 추가하여 8개로

-- 파티션 병합 (COALESCE — 파티션 수 줄이기)
ALTER TABLE products COALESCE PARTITION;`,

    colsTitle: 'Hash 파티션 특성',
    cols: [
      ['파티션 수', '2의 거듭제곱(2, 4, 8, 16...)을 권장. 그렇지 않으면 일부 파티션에 데이터가 편중될 수 있음.'],
      ['행 배치 제어 불가', '특정 행이 어느 파티션에 저장될지 사전에 알 수 없음. 비즈니스 의미 있는 분할이 필요하다면 Range 또는 List 사용.'],
      ['Partition Pruning 제한', 'Range·List와 달리 Hash 파티션에서는 = 조건에서만 Pruning 가능. 범위 조건(>, <)에서는 Pruning이 발생하지 않음.'],
      ['Partition-Wise Join', '두 테이블이 동일한 Hash 파티션 키로 파티셔닝되어 있으면 Full Partition-Wise Join이 가능. 대용량 조인 성능 향상.'],
    ],

    pruningTitle: 'Partition Pruning 동작',
    pruningDesc:
      'Hash 파티션은 범위 조건에서 Pruning이 불가하며, 등치 조건에서만 Oracle이 해시 함수를 적용해서 단일 파티션을 특정할 수 있어요.',
    pruningTable: [
      ['WHERE prod_id = 1234', 'PARTITION HASH SINGLE', '해시 함수로 파티션 1개 특정'],
      ['WHERE prod_id IN (100, 200)', 'PARTITION HASH ITERATOR', '각 값에 해당하는 파티션들'],
      ['WHERE prod_id > 1000', 'PARTITION HASH ALL', '모든 파티션 스캔 (Pruning 없음)'],
      ['WHERE category = \'Electronics\'', 'PARTITION HASH ALL', '파티션 키가 아님 — Pruning 없음'],
    ],

    useCaseTitle: '언제 Hash 파티션을 사용하나요?',
    useCaseTable: [
      ['데이터 스큐 방지', '특정 값에 데이터가 몰리는 상황에서 균등 분산이 필요할 때', '주문 ID, 고객 ID'],
      ['OLTP 경합 감소', '단일 세그먼트에 집중되는 DML 경합을 파티션에 분산', '고빈도 INSERT/UPDATE 테이블'],
      ['Partition-Wise Join', '대용량 테이블 간 조인 비용 절감', '같은 키로 파티셔닝된 팩트+디멘전'],
      ['병렬 처리 극대화', '파티션별 병렬 작업 분산', '대용량 배치 처리'],
    ],

    summary:
      'Hash 파티션은 데이터 스큐 방지와 OLTP 경합 감소에 효과적이에요. 단, 범위 조건에서 Pruning이 되지 않기 때문에 쿼리 패턴이 등치 조건 위주인 경우에 적합해요. 파티션 수는 2의 거듭제곱으로 설정하세요.',
  },

  en: {
    title: 'Hash Partition',
    subtitle:
      "Hash partitioning uses Oracle's internal hash function to map partition key values to partitions, distributing rows evenly. It is effective at preventing data skew and reducing OLTP contention.",

    whatTitle: 'What is Hash Partitioning?',
    whatDesc:
      "Unlike Range or List, you cannot control which row goes to which partition in Hash partitioning — Oracle's internal hash function receives the partition key value and determines the partition number.\n\nSetting the partition count to a power of 2 (2, 4, 8, 16...) yields the most even distribution. Primary use cases: preventing data skew, reducing OLTP segment contention, and enabling Partition-Wise Joins.",

    basicSql: `-- Hash partition (specify number of partitions)
CREATE TABLE products (
  prod_id   NUMBER,
  prod_name VARCHAR2(100),
  category  VARCHAR2(50),
  price     NUMBER
)
PARTITION BY HASH (prod_id)
PARTITIONS 4;  -- power of 2 recommended

-- Name partitions and assign tablespaces
CREATE TABLE orders (
  order_id    NUMBER,
  customer_id NUMBER,
  order_date  DATE
)
PARTITION BY HASH (order_id) (
  PARTITION p1 TABLESPACE ts1,
  PARTITION p2 TABLESPACE ts2,
  PARTITION p3 TABLESPACE ts3,
  PARTITION p4 TABLESPACE ts4
);

-- Add partitions (triggers full redistribution)
ALTER TABLE products ADD PARTITIONS 4;  -- adds 4, total becomes 8

-- Coalesce (reduce partition count)
ALTER TABLE products COALESCE PARTITION;`,

    colsTitle: 'Hash Partition Characteristics',
    cols: [
      ['Partition count', 'Use powers of 2 (2, 4, 8, 16...). Non-power-of-2 counts can cause uneven distribution.'],
      ['No row placement control', "You cannot predict which partition a row will land in. Use Range or List when business-meaningful division is needed."],
      ['Limited Pruning', 'Unlike Range and List, Hash partitions only prune on equality (=). Range conditions (>, <) scan all partitions.'],
      ['Partition-Wise Join', 'When two tables are hash-partitioned on the same key, Oracle can perform a Full Partition-Wise Join, greatly reducing join cost on large tables.'],
    ],

    pruningTitle: 'Partition Pruning Behavior',
    pruningDesc:
      'Hash partitions cannot prune on range conditions. Only equality conditions allow Oracle to apply the hash function to identify the exact target partition.',
    pruningTable: [
      ['WHERE prod_id = 1234', 'PARTITION HASH SINGLE', 'Hash function identifies one partition'],
      ['WHERE prod_id IN (100, 200)', 'PARTITION HASH ITERATOR', 'Partitions for each value'],
      ['WHERE prod_id > 1000', 'PARTITION HASH ALL', 'All partitions scanned (no pruning)'],
      ["WHERE category = 'Electronics'", 'PARTITION HASH ALL', 'Not the partition key — no pruning'],
    ],

    useCaseTitle: 'When to Use Hash Partitioning',
    useCaseTable: [
      ['Prevent data skew', 'When certain values attract disproportionately many rows', 'Order IDs, customer IDs'],
      ['Reduce OLTP contention', 'Spread high-frequency DML across multiple partitions', 'Hot INSERT/UPDATE tables'],
      ['Partition-Wise Join', 'Cut join cost between two large tables', 'Fact + dimension with same partition key'],
      ['Maximize parallelism', 'Distribute parallel work across partitions', 'Large batch processing'],
    ],

    summary:
      'Hash partitioning excels at preventing data skew and reducing OLTP contention. However, it does not prune on range conditions, so it suits workloads dominated by equality lookups. Always set partition count to a power of 2.',
  },
}

export function PartitionHashSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconHash size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.basicSql} />
      </div>

      <Divider />

      <SectionTitle>{t.colsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['특성', '설명'] : ['Characteristic', 'Description']}
        rows={t.cols}
      />

      <Divider />

      <SectionTitle>{t.pruningTitle}</SectionTitle>
      <Prose>{t.pruningDesc}</Prose>
      <Table
        headers={isKo ? ['WHERE 조건', 'Pruning 유형', '결과'] : ['WHERE Clause', 'Pruning Type', 'Result']}
        rows={t.pruningTable}
      />

      <Divider />

      <SectionTitle>{t.useCaseTitle}</SectionTitle>
      <Table
        headers={isKo ? ['목적', '상황', '예시'] : ['Purpose', 'When', 'Example']}
        rows={t.useCaseTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
