import { IconTable } from '@tabler/icons-react'
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
    title: '파티셔닝된 인덱스',
    subtitle:
      '파티셔닝된 테이블에는 두 종류의 인덱스를 사용할 수 있습니다. Local 인덱스는 테이블 파티션과 1:1로 대응하며, Global 인덱스는 테이블 파티션과 독립적으로 파티셔닝됩니다.',

    localTitle: 'Local 파티셔닝 인덱스',
    localDesc:
      'Local 인덱스는 테이블 파티션과 1:1 대응합니다. 각 인덱스 파티션은 해당 테이블 파티션의 행만 가리킵니다. 테이블 파티션 추가·삭제 시 인덱스 파티션도 자동으로 동기화되어 관리가 용이합니다.',
    localSql: `-- Local 인덱스 생성 (테이블 파티션과 1:1 대응)
CREATE INDEX sales_date_idx ON sales (sale_date) LOCAL;

-- Local 인덱스 + 각 파티션에 테이블스페이스 지정
CREATE INDEX sales_amt_idx ON sales (amount) LOCAL (
  PARTITION p2022 TABLESPACE idx_ts1,
  PARTITION p2023 TABLESPACE idx_ts2,
  PARTITION p2024 TABLESPACE idx_ts3,
  PARTITION p_future TABLESPACE idx_ts4
);`,
    localCols: [
      ['Prefixed Local 인덱스', '인덱스 선두 컬럼이 테이블의 파티션 키와 동일. Partition Pruning이 항상 가능. 권장됨.'],
      ['Non-Prefixed Local 인덱스', '인덱스 선두 컬럼이 파티션 키가 아님. 파티션 키 조건 없이는 모든 인덱스 파티션을 검색해야 함.'],
      ['Bitmap 인덱스', '반드시 Local이어야 함. Global Bitmap 인덱스는 지원되지 않음.'],
    ],

    globalTitle: 'Global 파티셔닝 인덱스',
    globalDesc:
      'Global 인덱스는 테이블 파티션과 독립적으로 파티셔닝됩니다. 하나의 Global 인덱스 파티션이 여러 테이블 파티션의 행을 가리킬 수 있습니다. 또한 비파티셔닝 테이블에 Global 파티셔닝 인덱스를 생성하는 것도 가능합니다.',
    globalSql: `-- Global Range 파티셔닝 인덱스 (테이블 파티션과 독립)
CREATE INDEX orders_channel_idx ON orders (channel_id)
GLOBAL PARTITION BY RANGE (channel_id) (
  PARTITION p_online  VALUES LESS THAN (3),
  PARTITION p_offline VALUES LESS THAN (7),
  PARTITION p_other   VALUES LESS THAN (MAXVALUE)
);

-- 비파티셔닝 Global 인덱스 (Partition 없이 인덱스만 분할)
-- Oracle은 이를 일반 전역 인덱스로 처리함`,

    globalNote:
      '테이블 파티션이 추가·삭제·이동될 때 Global 인덱스는 자동으로 Rebuild되지 않습니다. ALTER TABLE ... UPDATE GLOBAL INDEXES 옵션으로 파티션 연산과 동시에 인덱스를 유효 상태로 유지할 수 있습니다.',

    compTitle: 'Local vs Global 비교',
    compTable: [
      ['파티션과의 관계', '테이블 파티션과 1:1 대응', '테이블 파티션과 독립'],
      ['파티션 유지보수 연동', '파티션 추가/삭제 시 자동 동기화', '수동 Rebuild 필요 (또는 UPDATE GLOBAL INDEXES)'],
      ['Partition Pruning', 'Prefixed이면 자동 Pruning', '인덱스 키 기준으로만 Pruning'],
      ['Bitmap 인덱스', '지원 (Local만 가능)', '지원 안 됨'],
      ['OLTP 적합성', '파티션 유지보수가 많은 경우 유리', '단일 ROWID 조회가 많은 OLTP에 유리'],
      ['데이터 웨어하우스', '대부분의 경우 Local 권장', '채널·코드별 인덱스가 필요한 경우'],
    ],

    partialTitle: 'Partial 인덱스',
    partialDesc:
      'Oracle 12c부터 파티션 단위로 인덱싱을 선택적으로 활성화할 수 있습니다. 최신 파티션만 인덱싱하고 오래된 아카이브 파티션은 인덱스를 제외해 저장소와 인덱스 유지 비용을 줄입니다.',
    partialSql: `-- 파티션별 인덱싱 ON/OFF 설정
-- 테이블 생성 시
CREATE TABLE sales_partial (
  sale_id   NUMBER,
  sale_date DATE,
  amount    NUMBER
)
PARTITION BY RANGE (sale_date) (
  PARTITION p2022 VALUES LESS THAN (DATE '2023-01-01') INDEXING OFF,  -- 인덱스 제외
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01') INDEXING OFF,
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01') INDEXING ON    -- 인덱스 포함
);

-- Partial Local 인덱스 생성
CREATE INDEX sales_partial_date_idx ON sales_partial (sale_date)
LOCAL INDEXING PARTIAL;  -- INDEXING ON 파티션에만 인덱스 생성`,

    summary:
      'Local 인덱스는 파티션 유지보수가 자동 동기화되어 관리 편의성이 높습니다. Global 인덱스는 파티션 키와 무관한 컬럼으로 빠른 단일 행 조회가 필요할 때 사용합니다. 12c 이상에서는 Partial 인덱스로 최신 파티션만 인덱싱해 비용을 절감할 수 있습니다.',
  },

  en: {
    title: 'Partitioned Indexes',
    subtitle:
      'Two types of indexes are available for partitioned tables. Local indexes have a one-to-one correspondence with table partitions; Global indexes are partitioned independently of the table.',

    localTitle: 'Local Partitioned Index',
    localDesc:
      'A Local index maps one-to-one with table partitions. Each index partition points only to rows in its corresponding table partition. When table partitions are added or dropped, index partitions are automatically synchronized — making management straightforward.',
    localSql: `-- Local index (1:1 correspondence with table partitions)
CREATE INDEX sales_date_idx ON sales (sale_date) LOCAL;

-- Local index with per-partition tablespace assignments
CREATE INDEX sales_amt_idx ON sales (amount) LOCAL (
  PARTITION p2022 TABLESPACE idx_ts1,
  PARTITION p2023 TABLESPACE idx_ts2,
  PARTITION p2024 TABLESPACE idx_ts3,
  PARTITION p_future TABLESPACE idx_ts4
);`,
    localCols: [
      ['Prefixed Local Index', 'Leading index column matches the table partition key. Partition Pruning always possible. Recommended.'],
      ['Non-Prefixed Local Index', 'Leading index column is not the partition key. Without a partition key condition, all index partitions must be searched.'],
      ['Bitmap Index', 'Must be Local. Global Bitmap indexes are not supported.'],
    ],

    globalTitle: 'Global Partitioned Index',
    globalDesc:
      "A Global index is partitioned independently of the table. A single Global index partition can point to rows in multiple table partitions. You can also create a Global partitioned index on a non-partitioned table.",
    globalSql: `-- Global Range partitioned index (independent of table partitions)
CREATE INDEX orders_channel_idx ON orders (channel_id)
GLOBAL PARTITION BY RANGE (channel_id) (
  PARTITION p_online  VALUES LESS THAN (3),
  PARTITION p_offline VALUES LESS THAN (7),
  PARTITION p_other   VALUES LESS THAN (MAXVALUE)
);`,

    globalNote:
      'When table partitions are added, dropped, or moved, Global indexes are NOT automatically rebuilt. Use ALTER TABLE ... UPDATE GLOBAL INDEXES to keep global indexes valid during partition maintenance operations.',

    compTitle: 'Local vs Global Comparison',
    compTable: [
      ['Relationship to partitions', '1:1 with table partitions', 'Independent of table partitions'],
      ['Partition maintenance sync', 'Automatically synchronized on add/drop', 'Manual rebuild required (or UPDATE GLOBAL INDEXES)'],
      ['Partition Pruning', 'Automatic when index is Prefixed', 'Pruning based only on index key'],
      ['Bitmap indexes', 'Supported (Local only)', 'Not supported'],
      ['OLTP suitability', 'Better when frequent partition maintenance', 'Better for single ROWID lookups on non-partition-key columns'],
      ['Data warehouse', 'Local recommended in most cases', 'When channel- or code-based indexes are needed'],
    ],

    partialTitle: 'Partial Indexes',
    partialDesc:
      'Since Oracle 12c, indexing can be selectively enabled or disabled per partition. Index only the active recent partitions and exclude archived ones to reduce storage and index maintenance costs.',
    partialSql: `-- Set INDEXING ON/OFF per partition at table creation
CREATE TABLE sales_partial (
  sale_id   NUMBER,
  sale_date DATE,
  amount    NUMBER
)
PARTITION BY RANGE (sale_date) (
  PARTITION p2022 VALUES LESS THAN (DATE '2023-01-01') INDEXING OFF,  -- exclude from index
  PARTITION p2023 VALUES LESS THAN (DATE '2024-01-01') INDEXING OFF,
  PARTITION p2024 VALUES LESS THAN (DATE '2025-01-01') INDEXING ON    -- include in index
);

-- Partial Local index
CREATE INDEX sales_partial_date_idx ON sales_partial (sale_date)
LOCAL INDEXING PARTIAL;  -- index created only on INDEXING ON partitions`,

    summary:
      'Local indexes are preferred for their automatic synchronization with partition maintenance. Use Global indexes when fast single-row lookups on non-partition-key columns are needed. From 12c onward, Partial indexes let you index only active partitions, cutting storage and maintenance costs.',
  },
}

export function PartitionIndexesSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconTable size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.localTitle}</SectionTitle>
      <Prose>{t.localDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.localSql} />
      </div>
      <Table
        headers={isKo ? ['유형', '설명'] : ['Type', 'Description']}
        rows={t.localCols}
      />

      <Divider />

      <SectionTitle>{t.globalTitle}</SectionTitle>
      <Prose>{t.globalDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.globalSql} />
      </div>
      <InfoBox variant="warning">{t.globalNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.compTitle}</SectionTitle>
      <Table
        headers={isKo ? ['항목', 'Local', 'Global'] : ['Item', 'Local', 'Global']}
        rows={t.compTable}
      />

      <Divider />

      <SectionTitle>{t.partialTitle}</SectionTitle>
      <Prose>{t.partialDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.partialSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
