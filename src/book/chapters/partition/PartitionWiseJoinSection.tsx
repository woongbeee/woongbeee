import { IconArrowsJoin } from '@tabler/icons-react'
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
    title: 'Partition-Wise Join',
    subtitle:
      'Partition-Wise Join은 동일한 파티션 구조를 가진 두 테이블을 조인할 때, 대응하는 파티션끼리만 조인하여 조인 비용과 메모리 사용을 대폭 줄이는 최적화입니다.',

    whatTitle: 'Partition-Wise Join이란?',
    whatDesc:
      '일반 조인은 두 테이블 전체를 대상으로 조인 연산을 수행합니다. Partition-Wise Join은 두 테이블이 동일한 파티션 키로 파티셔닝되어 있을 때, 대응하는 파티션 1번끼리, 2번끼리만 독립적으로 조인합니다.\n\n예를 들어 orders 테이블과 order_items 테이블이 모두 order_date로 Range 파티셔닝되어 있으면, 2024년 파티션끼리만, 2023년 파티션끼리만 조인합니다. 다른 파티션을 전혀 접근하지 않습니다.\n\nPartition-Wise Join의 가장 큰 장점은 대용량 Hash Join에서 Sort/Merge에 필요한 메모리와 temp 공간을 파티션 크기만큼만 사용한다는 점입니다.',

    typesTitle: 'Full vs Partial Partition-Wise Join',
    typesTable: [
      ['Full PWJ', '두 테이블 모두 동일한 파티션 키와 파티션 수로 파티셔닝', '가장 효율적. 파티션 단위로 독립 조인.'],
      ['Partial PWJ', '한 테이블만 파티셔닝되거나 키가 다른 경우', '파티셔닝된 쪽을 기준으로 드라이빙 조인. Full보다 효율 낮음.'],
    ],

    condTitle: 'Full PWJ 성립 조건',
    condDesc:
      '두 테이블이 Full Partition-Wise Join으로 실행되려면 아래 조건이 모두 충족되어야 합니다.',
    condTable: [
      ['동일 파티션 키', '조인 조건에 사용된 컬럼과 두 테이블의 파티션 키가 일치해야 함'],
      ['동일 파티션 수', '두 테이블의 파티션 개수가 같아야 함 (Hash의 경우 2의 거듭제곱)'],
      ['동일 파티션 방식', '두 테이블 모두 동일한 파티셔닝 방식(Range/Hash 등) 사용'],
      ['파티션 경계 일치', 'Range의 경우 각 파티션의 경계값(VALUES LESS THAN)이 대응해야 함'],
    ],

    exampleTitle: '예시: Full Partition-Wise Join',
    exampleDesc:
      'orders와 order_items를 모두 order_date로 Range 파티셔닝한 뒤 조인하면 Full PWJ가 발생합니다.',
    exampleSql: `-- 두 테이블을 동일한 파티션 구조로 생성
CREATE TABLE orders (
  order_id   NUMBER PRIMARY KEY,
  order_date DATE   NOT NULL,
  customer_id NUMBER,
  total_amount NUMBER
)
PARTITION BY RANGE (order_date) (
  PARTITION p2022 VALUES LESS THAN (DATE '2023-01-01'),
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

CREATE TABLE order_items (
  item_id    NUMBER,
  order_id   NUMBER NOT NULL,
  order_date DATE   NOT NULL,  -- 파티션 키 중복 저장 (Reference 파티션이 아닌 경우)
  product_id NUMBER,
  quantity   NUMBER,
  unit_price NUMBER
)
PARTITION BY RANGE (order_date) (
  PARTITION p2022 VALUES LESS THAN (DATE '2023-01-01'),
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- 조인 쿼리 (Partition-Wise Join 자동 적용)
SELECT o.order_id, o.customer_id, SUM(i.quantity * i.unit_price)
FROM   orders      o
JOIN   order_items i ON o.order_id = o.order_id
                    AND o.order_date = i.order_date  -- 파티션 키 조인 조건 포함
GROUP BY o.order_id, o.customer_id;`,

    refJoinTitle: 'Reference 파티션과 Partition-Wise Join',
    refJoinDesc:
      'Reference 파티션을 사용하면 자식 테이블에 파티션 키 컬럼을 별도 저장하지 않아도 자동으로 동일한 파티션 구조를 가집니다. 조인 조건에 order_date가 없어도 Full PWJ가 발생합니다.',
    refJoinSql: `-- Reference 파티션: 자식 테이블에 order_date 불필요
CREATE TABLE order_items_ref (
  item_id    NUMBER,
  order_id   NUMBER NOT NULL,  -- FK로 파티션 구조 자동 상속
  product_id NUMBER,
  quantity   NUMBER,
  unit_price NUMBER,
  CONSTRAINT fk_items_ref
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
)
PARTITION BY REFERENCE (fk_items_ref);

-- 조인 시 파티션 키 조건 없이도 Full PWJ
SELECT o.order_id, o.customer_id, SUM(i.quantity * i.unit_price)
FROM   orders           o
JOIN   order_items_ref  i ON o.order_id = i.order_id
GROUP BY o.order_id, o.customer_id;`,

    planTitle: '실행 계획에서 PWJ 확인',
    planDesc:
      'Partition-Wise Join은 실행 계획에 PARTITION HASH JOIN 또는 PARTITION RANGE JOIN으로 표시됩니다.',
    planSql: `-- 실행 계획 확인
EXPLAIN PLAN FOR
SELECT o.order_id, SUM(i.quantity * i.unit_price)
FROM   orders o JOIN order_items i
  ON   o.order_id = i.order_id AND o.order_date = i.order_date
GROUP BY o.order_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'BASIC +PARTITION +PARALLEL'));

/*
Plan example (Full Partition-Wise Join):
-----------------------------------------------------------
| Id | Operation                   | Pstart | Pstop |
-----------------------------------------------------------
|  0 | SELECT STATEMENT            |        |       |
|  1 |  HASH GROUP BY              |        |       |
|  2 |   PARTITION RANGE ALL       |      1 |     4 |
|  3 |    HASH JOIN                |        |       |
|  4 |     TABLE ACCESS FULL| ORDERS      | 1 | 4 |
|  5 |     TABLE ACCESS FULL| ORDER_ITEMS | 1 | 4 |
-----------------------------------------------------------
*/`,

    parallelTitle: 'PWJ와 병렬 처리',
    parallelDesc:
      'Partition-Wise Join은 병렬 처리와 결합할 때 극대화됩니다. 각 파티션 쌍을 별도의 병렬 프로세스가 독립적으로 조인하므로, 병렬도를 높일수록 전체 처리 시간이 단축됩니다.',
    parallelSql: `-- 병렬 힌트와 함께 사용
SELECT /*+ PARALLEL(o, 4) PARALLEL(i, 4) */
       o.order_id, SUM(i.quantity * i.unit_price)
FROM   orders      o
JOIN   order_items i ON o.order_id = i.order_id
                    AND o.order_date = i.order_date
GROUP BY o.order_id;`,

    benefitsTitle: 'Partition-Wise Join의 장점',
    benefitsTable: [
      ['메모리 절감', 'Hash Join에서 전체 테이블이 아닌 파티션 크기만큼의 메모리만 필요. Temp 사용 감소.'],
      ['조인 병렬화', '각 파티션 쌍이 독립 조인되므로 자연스럽게 병렬 처리 가능.'],
      ['네트워크 감소 (RAC)', 'RAC 환경에서 같은 파티션 데이터가 같은 노드에 있으면 노드 간 데이터 이동 없음.'],
      ['Pruning 연계', '파티션 키가 WHERE에 있으면 Pruning + PWJ가 동시에 적용됨.'],
    ],

    summary:
      'Partition-Wise Join은 동일한 파티션 구조를 가진 테이블 간 조인에서 자동으로 발생하는 최적화입니다. Reference 파티션을 활용하면 파티션 키 컬럼 중복 저장 없이 자동으로 Full PWJ를 활성화할 수 있습니다. 대용량 조인의 메모리 사용과 병렬 처리 효율을 동시에 개선하는 핵심 파티셔닝 기법입니다.',
  },

  en: {
    title: 'Partition-Wise Join',
    subtitle:
      'Partition-Wise Join is an optimization that, when two tables share the same partitioning structure, joins only corresponding partitions together — dramatically reducing join cost and memory usage.',

    whatTitle: 'What is Partition-Wise Join?',
    whatDesc:
      "A regular join operates across the entirety of both tables. With Partition-Wise Join, when two tables are partitioned on the same key, partition 1 of table A joins only partition 1 of table B, partition 2 joins partition 2, and so on — completely independently.\n\nFor example, if both orders and order_items are Range-partitioned on order_date, the 2024 partitions join each other and the 2023 partitions join each other. No other partitions are touched.\n\nThe greatest benefit of PWJ is that large Hash Joins need memory and temp space only proportional to the partition size, not the full table size.",

    typesTitle: 'Full vs Partial Partition-Wise Join',
    typesTable: [
      ['Full PWJ', 'Both tables have the same partition key and partition count', 'Most efficient. Each partition pair joins independently.'],
      ['Partial PWJ', 'Only one table is partitioned, or partition keys differ', 'The partitioned table drives the join. Less efficient than Full PWJ.'],
    ],

    condTitle: 'Full PWJ Requirements',
    condDesc:
      'All of the following conditions must be satisfied for a Full Partition-Wise Join to occur.',
    condTable: [
      ['Same partition key', 'The join condition column must match the partition key of both tables'],
      ['Same partition count', 'Both tables must have the same number of partitions (for Hash, a power of 2)'],
      ['Same partitioning method', 'Both tables must use the same partitioning method (Range, Hash, etc.)'],
      ['Matching partition boundaries', 'For Range partitions, each partition boundary (VALUES LESS THAN) must correspond between tables'],
    ],

    exampleTitle: 'Example: Full Partition-Wise Join',
    exampleDesc:
      'Partitioning both orders and order_items on order_date with matching Range partitions triggers a Full PWJ.',
    exampleSql: `-- Create both tables with identical partition structure
CREATE TABLE orders (
  order_id      NUMBER PRIMARY KEY,
  order_date    DATE   NOT NULL,
  customer_id   NUMBER,
  total_amount  NUMBER
)
PARTITION BY RANGE (order_date) (
  PARTITION p2022 VALUES LESS THAN (DATE '2023-01-01'),
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

CREATE TABLE order_items (
  item_id    NUMBER,
  order_id   NUMBER NOT NULL,
  order_date DATE   NOT NULL,  -- partition key stored redundantly
  product_id NUMBER,
  quantity   NUMBER,
  unit_price NUMBER
)
PARTITION BY RANGE (order_date) (
  PARTITION p2022 VALUES LESS THAN (DATE '2023-01-01'),
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- Join query (Partition-Wise Join applied automatically)
SELECT o.order_id, o.customer_id, SUM(i.quantity * i.unit_price)
FROM   orders      o
JOIN   order_items i ON o.order_id = i.order_id
                    AND o.order_date = i.order_date  -- partition key in join condition
GROUP BY o.order_id, o.customer_id;`,

    refJoinTitle: 'Reference Partitioning and Partition-Wise Join',
    refJoinDesc:
      "With Reference partitioning, the child table automatically inherits the parent's partition structure through a foreign key — no redundant partition key column needed. Full PWJ occurs even without order_date in the join condition.",
    refJoinSql: `-- Reference partition: child table needs no order_date column
CREATE TABLE order_items_ref (
  item_id    NUMBER,
  order_id   NUMBER NOT NULL,  -- inherits partition structure via FK
  product_id NUMBER,
  quantity   NUMBER,
  unit_price NUMBER,
  CONSTRAINT fk_items_ref
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
)
PARTITION BY REFERENCE (fk_items_ref);

-- Full PWJ without explicit partition key in join condition
SELECT o.order_id, o.customer_id, SUM(i.quantity * i.unit_price)
FROM   orders           o
JOIN   order_items_ref  i ON o.order_id = i.order_id
GROUP BY o.order_id, o.customer_id;`,

    planTitle: 'Verifying PWJ in the Execution Plan',
    planDesc:
      'Partition-Wise Join appears in execution plans as PARTITION HASH JOIN or PARTITION RANGE JOIN.',
    planSql: `-- Check execution plan
EXPLAIN PLAN FOR
SELECT o.order_id, SUM(i.quantity * i.unit_price)
FROM   orders o JOIN order_items i
  ON   o.order_id = i.order_id AND o.order_date = i.order_date
GROUP BY o.order_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'BASIC +PARTITION +PARALLEL'));

/*
Plan example (Full Partition-Wise Join):
-----------------------------------------------------------
| Id | Operation                   | Pstart | Pstop |
-----------------------------------------------------------
|  0 | SELECT STATEMENT            |        |       |
|  1 |  HASH GROUP BY              |        |       |
|  2 |   PARTITION RANGE ALL       |      1 |     4 |
|  3 |    HASH JOIN                |        |       |
|  4 |     TABLE ACCESS FULL| ORDERS      | 1 | 4 |
|  5 |     TABLE ACCESS FULL| ORDER_ITEMS | 1 | 4 |
-----------------------------------------------------------
*/`,

    parallelTitle: 'PWJ with Parallel Execution',
    parallelDesc:
      'Partition-Wise Join delivers maximum benefit when combined with parallel execution. Each partition pair is joined independently by a separate parallel process, so increasing the degree of parallelism directly reduces total elapsed time.',
    parallelSql: `-- Use with parallel hints
SELECT /*+ PARALLEL(o, 4) PARALLEL(i, 4) */
       o.order_id, SUM(i.quantity * i.unit_price)
FROM   orders      o
JOIN   order_items i ON o.order_id = i.order_id
                    AND o.order_date = i.order_date
GROUP BY o.order_id;`,

    benefitsTitle: 'Benefits of Partition-Wise Join',
    benefitsTable: [
      ['Memory reduction', 'Hash Joins need memory proportional to partition size, not the full table. Less temp space used.'],
      ['Join parallelism', 'Each partition pair joins independently, enabling natural parallelism.'],
      ['Reduced network traffic (RAC)', 'In RAC, if matching partitions reside on the same node, no inter-node data movement is needed.'],
      ['Pruning synergy', 'When the partition key appears in WHERE, pruning and PWJ apply simultaneously.'],
    ],

    summary:
      'Partition-Wise Join is an automatic optimization that activates when two tables share the same partitioning structure. Reference partitioning enables Full PWJ without storing a redundant partition key column in the child table. It is a key partitioning technique for simultaneously improving memory efficiency and parallel throughput on large joins.',
  },
}

export function PartitionWiseJoinSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowsJoin size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.typesTitle}</SectionTitle>
      <Table
        headers={isKo ? ['유형', '조건', '특징'] : ['Type', 'Condition', 'Notes']}
        rows={t.typesTable}
      />

      <Divider />

      <SectionTitle>{t.condTitle}</SectionTitle>
      <Prose>{t.condDesc}</Prose>
      <Table
        headers={isKo ? ['조건', '설명'] : ['Condition', 'Description']}
        rows={t.condTable}
      />

      <Divider />

      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <Prose>{t.exampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.exampleSql} />
      </div>

      <Divider />

      <SectionTitle>{t.refJoinTitle}</SectionTitle>
      <Prose>{t.refJoinDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.refJoinSql} />
      </div>

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.planSql} />
      </div>

      <Divider />

      <SectionTitle>{t.parallelTitle}</SectionTitle>
      <Prose>{t.parallelDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.parallelSql} />
      </div>

      <Divider />

      <SectionTitle>{t.benefitsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['장점', '설명'] : ['Benefit', 'Description']}
        rows={t.benefitsTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
