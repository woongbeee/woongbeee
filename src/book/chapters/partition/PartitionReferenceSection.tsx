import { IconLink } from '@tabler/icons-react'
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
    title: 'Reference 파티션',
    subtitle:
      'Reference 파티션은 부모 테이블의 FK(Foreign Key)를 통해 자식 테이블이 부모 테이블의 파티셔닝 전략을 자동으로 상속받습니다. 자식 테이블에 파티션 키 컬럼을 별도로 저장할 필요가 없습니다.',

    whatTitle: 'Reference 파티션이란?',
    whatDesc:
      '주문(orders)과 주문상세(order_items)처럼 부모-자식 관계의 테이블에서, 자식 테이블이 부모 테이블의 파티셔닝 방식을 그대로 따르도록 합니다. 부모 테이블에 새 파티션이 추가되면 자식 테이블에도 자동으로 해당 파티션이 생성됩니다.\n\n기존 방식에서는 자식 테이블에도 order_date 같은 파티션 키 컬럼을 중복 저장해야 했습니다. Reference 파티셔닝은 이 중복을 없애고, 부모-자식 파티션 간 자동 동기화를 보장합니다.',

    setupSql: `-- 1단계: 부모 테이블 (Range 파티션)
CREATE TABLE orders (
  order_id   NUMBER PRIMARY KEY,
  order_date DATE   NOT NULL,
  customer_id NUMBER,
  status     VARCHAR2(20)
)
PARTITION BY RANGE (order_date) (
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- 2단계: 자식 테이블 (FK를 통해 부모 파티션 상속)
CREATE TABLE order_items (
  item_id    NUMBER PRIMARY KEY,
  order_id   NUMBER NOT NULL,
  product_id NUMBER,
  quantity   NUMBER,
  unit_price NUMBER,
  CONSTRAINT fk_order_items
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
)
PARTITION BY REFERENCE (fk_order_items);
-- order_items는 orders와 동일한 3개 파티션으로 자동 분할됨

-- 부모 파티션 추가 시 자식 파티션도 자동 생성
ALTER TABLE orders ADD PARTITION p2025
  VALUES LESS THAN (DATE '2026-01-01');
-- order_items.p2025 파티션도 자동 생성됨`,

    benefitsTitle: 'Reference 파티션의 장점',
    benefitsTable: [
      ['파티션 키 컬럼 불필요', '자식 테이블에 order_date 같은 파티션 키를 중복 저장하지 않아도 됨. 정규화 유지.'],
      ['자동 동기화', '부모에 파티션 추가/삭제 시 자식 파티션도 자동 반영. 수동 관리 불필요.'],
      ['Full Partition-Wise Join', '부모와 자식이 동일한 파티션 구조이므로 조인 시 대응 파티션끼리만 조인. 조인 비용 대폭 절감.'],
      ['데이터 무결성 보장', 'FK 관계를 통해 파티셔닝되므로, 부모-자식 간 데이터 일관성이 자동 보장됨.'],
    ],

    constraintTitle: '제약 사항',
    constraintTable: [
      ['FK NOT NULL', 'Reference 파티션의 FK 컬럼은 NOT NULL이어야 함. NULL 허용 FK는 사용 불가.'],
      ['단일 수준', 'Reference 파티션은 한 단계만 상속 가능. 자식의 자식(손자 테이블)은 직접 조부모를 참조해야 함.'],
      ['FK 비활성화 불가', 'Reference 파티셔닝이 활성화된 동안 FK를 DISABLE 할 수 없음.'],
      ['파티션 키 변경 불가', '부모 테이블의 파티셔닝 전략(키)을 변경하면 자식도 함께 재정의해야 함.'],
    ],

    queryTitle: '파티션 정보 조회',
    querySql: `-- 부모 파티션 목록
SELECT partition_name, high_value
FROM   user_tab_partitions
WHERE  table_name = 'ORDERS'
ORDER BY partition_position;

-- 자식 파티션 목록 (부모와 동일한 구조)
SELECT partition_name
FROM   user_tab_partitions
WHERE  table_name = 'ORDER_ITEMS'
ORDER BY partition_position;

-- 파티션별 행 수 확인 (분석 모드로 통계 갱신 후)
SELECT partition_name, num_rows
FROM   user_tab_partitions
WHERE  table_name = 'ORDER_ITEMS';`,

    summary:
      'Reference 파티션은 마스터-디테일 테이블이 동일한 파티션 전략을 공유해야 할 때 가장 적합합니다. 파티션 키 중복 저장을 없애고, 부모-자식 파티션 구조를 자동으로 동기화하여 관리 오버헤드를 최소화합니다.',
  },

  en: {
    title: 'Reference Partition',
    subtitle:
      "Reference partitioning lets a child table automatically inherit the parent table's partitioning strategy through a foreign key relationship. The child table does not need to store a separate partition key column.",

    whatTitle: 'What is Reference Partitioning?',
    whatDesc:
      "For parent-child table pairs like orders and order_items, the child table follows the parent table's partitioning method exactly. When a new partition is added to the parent, a corresponding partition is automatically created in the child.\n\nTraditionally, you had to store the partition key column (e.g., order_date) in the child table as well. Reference partitioning eliminates this redundancy and guarantees automatic synchronization between parent and child partitions.",

    setupSql: `-- Step 1: Parent table (Range partition)
CREATE TABLE orders (
  order_id    NUMBER PRIMARY KEY,
  order_date  DATE   NOT NULL,
  customer_id NUMBER,
  status      VARCHAR2(20)
)
PARTITION BY RANGE (order_date) (
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- Step 2: Child table (inherits parent partitioning via FK)
CREATE TABLE order_items (
  item_id    NUMBER PRIMARY KEY,
  order_id   NUMBER NOT NULL,
  product_id NUMBER,
  quantity   NUMBER,
  unit_price NUMBER,
  CONSTRAINT fk_order_items
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
)
PARTITION BY REFERENCE (fk_order_items);
-- order_items automatically gets the same 3 partitions as orders

-- Adding a partition to parent auto-creates child partition
ALTER TABLE orders ADD PARTITION p2025
  VALUES LESS THAN (DATE '2026-01-01');
-- order_items.p2025 is automatically created`,

    benefitsTitle: 'Benefits of Reference Partitioning',
    benefitsTable: [
      ['No redundant partition key', 'The child table does not need to store order_date or any other partition key column. Normalization preserved.'],
      ['Automatic synchronization', 'Adding or dropping a partition on the parent automatically propagates to the child. No manual child table maintenance.'],
      ['Full Partition-Wise Join', 'Parent and child share identical partition structure, so joins match corresponding partitions directly — dramatically reducing join cost.'],
      ['Data integrity guaranteed', 'Partitioning through an FK relationship ensures parent-child data consistency is maintained automatically.'],
    ],

    constraintTitle: 'Constraints',
    constraintTable: [
      ['FK must be NOT NULL', 'The FK column used for reference partitioning must be NOT NULL. Nullable FKs are not supported.'],
      ['Single level only', 'Reference partitioning inherits one level only. Grandchild tables must reference the grandparent directly.'],
      ['FK cannot be disabled', 'The FK constraint cannot be DISABLED while reference partitioning is active.'],
      ['Cannot change partition key', "Changing the parent table's partitioning strategy requires redefining the child table as well."],
    ],

    queryTitle: 'Querying Partition Information',
    querySql: `-- Parent partition list
SELECT partition_name, high_value
FROM   user_tab_partitions
WHERE  table_name = 'ORDERS'
ORDER BY partition_position;

-- Child partition list (same structure as parent)
SELECT partition_name
FROM   user_tab_partitions
WHERE  table_name = 'ORDER_ITEMS'
ORDER BY partition_position;

-- Row count per partition (after refreshing statistics)
SELECT partition_name, num_rows
FROM   user_tab_partitions
WHERE  table_name = 'ORDER_ITEMS';`,

    summary:
      'Reference partitioning is ideal when master-detail tables need to share the same partitioning strategy. It eliminates redundant partition key storage and automatically synchronizes parent-child partition structures, minimizing administrative overhead.',
  },
}

export function PartitionReferenceSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLink size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.setupSql} />
      </div>

      <Divider />

      <SectionTitle>{t.benefitsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['장점', '설명'] : ['Benefit', 'Description']}
        rows={t.benefitsTable}
      />

      <Divider />

      <SectionTitle>{t.constraintTitle}</SectionTitle>
      <Table
        headers={isKo ? ['제약', '설명'] : ['Constraint', 'Description']}
        rows={t.constraintTable}
      />

      <Divider />

      <SectionTitle>{t.queryTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.querySql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
