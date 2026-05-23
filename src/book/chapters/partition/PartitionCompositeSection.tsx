import { IconStack2 } from '@tabler/icons-react'
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
    title: 'Composite 파티션',
    subtitle:
      'Composite 파티션은 두 가지 파티셔닝 방식을 계층적으로 결합합니다. 부모 파티션(Range·List·Hash)과 자식 서브파티션(Range·List·Hash)을 조합해 다차원 Pruning과 병렬 처리를 동시에 달성합니다.',

    whatTitle: 'Composite 파티션이란?',
    whatDesc:
      '상위 파티션 키와 하위 서브파티션 키를 각각 정의하여 데이터를 2단계로 분할합니다. 대표적인 조합은 다음과 같습니다:\n\n• Range-Hash: 날짜로 파티션 → 균등 분산을 위해 해시 서브파티션\n• Range-List: 날짜로 파티션 → 지역·코드로 서브파티션\n• List-Hash: 코드로 파티션 → 균등 분산을 위해 해시 서브파티션\n\n두 파티션 키 중 하나라도 WHERE 조건에 포함되면 해당 차원의 Pruning이 발생합니다.',

    rangeHashTitle: 'Range-Hash 파티션',
    rangeHashDesc:
      '날짜(Range)로 1차 분류하고, 각 날짜 파티션 내에서 해시로 균등 분산합니다. 날짜 조건 Pruning과 데이터 스큐 방지를 동시에 달성합니다.',
    rangeHashSql: `-- Range-Hash Composite 파티션
CREATE TABLE sales_rh (
  sale_id    NUMBER,
  sale_date  DATE,
  customer_id NUMBER,
  amount     NUMBER
)
PARTITION BY RANGE (sale_date)
SUBPARTITION BY HASH (customer_id)
SUBPARTITIONS 4                          -- 각 파티션마다 4개 서브파티션
(
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- 특정 파티션의 서브파티션 확인
SELECT partition_name, subpartition_name, num_rows
FROM   user_tab_subpartitions
WHERE  table_name = 'SALES_RH';`,

    rangeListTitle: 'Range-List 파티션',
    rangeListDesc:
      '날짜(Range)로 1차 분류하고, 각 날짜 파티션 내에서 지역 코드(List)로 서브파티션합니다. 날짜+지역 두 조건 모두에서 Pruning이 가능합니다.',
    rangeListSql: `-- Range-List Composite 파티션
CREATE TABLE orders_rl (
  order_id   NUMBER,
  order_date DATE,
  region     VARCHAR2(20),
  amount     NUMBER
)
PARTITION BY RANGE (order_date)
SUBPARTITION BY LIST (region)
SUBPARTITION TEMPLATE (
  SUBPARTITION sp_north  VALUES ('SEOUL', 'INCHEON'),
  SUBPARTITION sp_south  VALUES ('BUSAN', 'DAEGU'),
  SUBPARTITION sp_other  VALUES (DEFAULT)
)
(
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01')
);

-- 날짜 + 지역 동시 Pruning
SELECT * FROM orders_rl
WHERE  order_date >= DATE '2024-01-01'
  AND  region = 'SEOUL';`,

    templateTitle: 'SUBPARTITION TEMPLATE',
    templateDesc:
      'SUBPARTITION TEMPLATE를 사용하면 모든 부모 파티션에 동일한 서브파티션 구조를 자동 적용합니다. 새 부모 파티션이 추가될 때도 템플릿 구조가 자동 적용됩니다.',

    pruningTitle: 'Composite 파티션 Pruning',
    pruningTable: [
      ['부모 키 조건만', '부모 파티션 Pruning. 해당 파티션 내 모든 서브파티션 접근.'],
      ['자식 키 조건만', '서브파티션 Pruning. 모든 부모 파티션에서 해당 서브파티션만 접근.'],
      ['두 키 조건 모두', '부모+자식 동시 Pruning. 가장 효율적.'],
      ['두 키 조건 모두 없음', '전체 파티션·서브파티션 스캔.'],
    ],

    combsTitle: 'Composite 조합 비교',
    combsTable: [
      ['Range-Hash', '날짜(Range) + 균등분산(Hash)', '날짜별 파티션 + 데이터 스큐 방지', '가장 일반적인 Composite'],
      ['Range-List', '날짜(Range) + 이산값(List)', '날짜+지역 두 차원 Pruning', '보고서, 데이터웨어하우스'],
      ['List-Hash', '이산값(List) + 균등분산(Hash)', '코드별 분류 + 균등 분산', '코드별 OLTP 테이블'],
      ['List-List', '이산값(List) + 이산값(List)', '두 코드 차원 동시 관리', '다차원 분류 필요 시'],
    ],

    summary:
      'Composite 파티션은 두 차원의 Pruning과 병렬 처리를 동시에 달성합니다. SUBPARTITION TEMPLATE를 활용하면 파티션 추가 시 서브파티션 구조가 자동 적용됩니다. 두 파티션 키 중 하나라도 WHERE 조건에 포함되어야 Pruning 효과를 얻습니다.',
  },

  en: {
    title: 'Composite Partition',
    subtitle:
      'Composite partitioning hierarchically combines two partitioning methods. The parent partitions (Range, List, or Hash) and child subpartitions (Range, List, or Hash) are combined to achieve multi-dimensional pruning and parallelism simultaneously.',

    whatTitle: 'What is Composite Partitioning?',
    whatDesc:
      "A top-level partition key and a subpartition key are defined separately to divide data in two levels. Common combinations:\n\n• Range-Hash: partition by date → hash subpartitions for even distribution\n• Range-List: partition by date → subpartition by region/code\n• List-Hash: partition by code → hash subpartitions for even distribution\n\nIf at least one of the two partition keys appears in a WHERE clause, pruning occurs on that dimension.",

    rangeHashTitle: 'Range-Hash Partition',
    rangeHashDesc:
      'First-level classification by date (Range); within each date partition, rows are evenly distributed by hash. Achieves both date-condition pruning and data skew prevention.',
    rangeHashSql: `-- Range-Hash Composite Partition
CREATE TABLE sales_rh (
  sale_id     NUMBER,
  sale_date   DATE,
  customer_id NUMBER,
  amount      NUMBER
)
PARTITION BY RANGE (sale_date)
SUBPARTITION BY HASH (customer_id)
SUBPARTITIONS 4                        -- 4 subpartitions per partition
(
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- Check subpartitions for a given partition
SELECT partition_name, subpartition_name, num_rows
FROM   user_tab_subpartitions
WHERE  table_name = 'SALES_RH';`,

    rangeListTitle: 'Range-List Partition',
    rangeListDesc:
      'First-level classification by date (Range); within each date partition, rows are further split by region code (List). Pruning is possible on both date and region conditions.',
    rangeListSql: `-- Range-List Composite Partition
CREATE TABLE orders_rl (
  order_id   NUMBER,
  order_date DATE,
  region     VARCHAR2(20),
  amount     NUMBER
)
PARTITION BY RANGE (order_date)
SUBPARTITION BY LIST (region)
SUBPARTITION TEMPLATE (
  SUBPARTITION sp_west   VALUES ('CA', 'OR', 'WA'),
  SUBPARTITION sp_east   VALUES ('NY', 'NJ', 'MA'),
  SUBPARTITION sp_other  VALUES (DEFAULT)
)
(
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01')
);

-- Pruning on both date and region
SELECT * FROM orders_rl
WHERE  order_date >= DATE '2024-01-01'
  AND  region = 'CA';`,

    templateTitle: 'SUBPARTITION TEMPLATE',
    templateDesc:
      'SUBPARTITION TEMPLATE automatically applies the same subpartition structure to all parent partitions, including any new partitions added later.',

    pruningTitle: 'Composite Partition Pruning',
    pruningTable: [
      ['Parent key condition only', 'Parent partition pruned. All subpartitions within the matched partition are accessed.'],
      ['Child key condition only', 'Subpartition pruned across all parent partitions. Only matching subpartitions accessed.'],
      ['Both key conditions', 'Parent + child pruning simultaneously. Most efficient.'],
      ['Neither key condition', 'Full scan across all partitions and subpartitions.'],
    ],

    combsTitle: 'Composite Combination Comparison',
    combsTable: [
      ['Range-Hash', 'Date (Range) + Even spread (Hash)', 'Date partitions + skew prevention', 'Most common composite'],
      ['Range-List', 'Date (Range) + Discrete value (List)', 'Two-dimensional pruning: date + region', 'Reporting, data warehouses'],
      ['List-Hash', 'Discrete value (List) + Even spread (Hash)', 'Code-based classification + even spread', 'Code-segmented OLTP tables'],
      ['List-List', 'Discrete value (List) + Discrete value (List)', 'Two code dimensions managed together', 'When multi-dimensional classification is needed'],
    ],

    summary:
      'Composite partitioning achieves two-dimensional pruning and parallelism simultaneously. Use SUBPARTITION TEMPLATE to automatically apply subpartition structure to new partitions. At least one partition key must appear in the WHERE clause to gain pruning benefits.',
  },
}

export function PartitionCompositeSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconStack2 size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.rangeHashTitle}</SectionTitle>
      <Prose>{t.rangeHashDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.rangeHashSql} />
      </div>

      <Divider />

      <SectionTitle>{t.rangeListTitle}</SectionTitle>
      <Prose>{t.rangeListDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.rangeListSql} />
      </div>
      <InfoBox variant="note">{t.templateDesc}</InfoBox>

      <Divider />

      <SectionTitle>{t.pruningTitle}</SectionTitle>
      <Table
        headers={isKo ? ['조건 상황', 'Pruning 동작'] : ['Condition', 'Pruning Behavior']}
        rows={t.pruningTable}
      />

      <Divider />

      <SectionTitle>{t.combsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['조합', '파티션 구조', '적합한 상황', '특징'] : ['Combination', 'Structure', 'Best For', 'Notes']}
        rows={t.combsTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
