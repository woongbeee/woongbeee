import { IconList } from '@tabler/icons-react'
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
    title: 'List 파티션',
    subtitle:
      'List 파티션은 파티션 키의 명시적인 값 목록을 기준으로 행을 분할해요. 지역 코드, 국가, 부서 코드처럼 이산적이고 명확한 값으로 데이터를 구분할 때 사용해요.',

    whatTitle: 'List 파티션이란?',
    whatDesc:
      'Range 파티션이 범위(≤, <)로 행을 분류하는 것과 달리, List 파티션은 파티션 키 값이 특정 목록에 속하는지로 행을 분류해요. 순서가 없는 이산 데이터에 적합해요.\n\n한 파티션에 복수의 값을 지정할 수 있으며, DEFAULT 파티션으로 정의되지 않은 값을 수용할 수 있어요.',

    basicSql: `-- 지역별 List 파티션
CREATE TABLE customers (
  customer_id NUMBER,
  name        VARCHAR2(100),
  region      VARCHAR2(20),
  amount      NUMBER
)
PARTITION BY LIST (region) (
  PARTITION p_north  VALUES ('SEOUL', 'INCHEON', 'GYEONGGI'),
  PARTITION p_south  VALUES ('BUSAN', 'DAEGU', 'GWANGJU'),
  PARTITION p_east   VALUES ('GANGWON', 'ULSAN'),
  PARTITION p_other  VALUES (DEFAULT)  -- 나머지 모든 값
);

-- 파티션 조회
SELECT * FROM customers PARTITION (p_north);

-- 파티션 추가 (DEFAULT가 있으면 특정 값만 추가 가능)
ALTER TABLE customers ADD PARTITION p_jeju VALUES ('JEJU');

-- 파티션 병합 (MERGE)
ALTER TABLE customers MERGE PARTITIONS p_east, p_other
  INTO PARTITION p_etc;`,

    colsTitle: 'List 파티션 구문',
    cols: [
      ['VALUES (v1, v2, ...)', '이 파티션에 속할 파티션 키 값 목록. 복수 값 가능.'],
      ['DEFAULT', '나머지 모든 값을 수용하는 파티션. Range의 MAXVALUE에 해당. DEFAULT 파티션 없이 정의되지 않은 값이 INSERT되면 오류 발생.'],
      ['NULL', 'NULL 값도 명시적으로 특정 파티션에 할당 가능. DEFAULT 파티션이 있으면 NULL도 해당 파티션으로 이동.'],
    ],

    pruningTitle: 'Partition Pruning',
    pruningDesc:
      'List 파티션의 Pruning은 파티션 키에 대한 등치(=) 또는 IN 조건에서 발생해요.',
    pruningTable: [
      ["WHERE region = 'SEOUL'", 'PARTITION LIST SINGLE', 'p_north 1개 파티션만 접근'],
      ["WHERE region IN ('BUSAN', 'DAEGU')", 'PARTITION LIST ITERATOR', 'p_south 파티션 접근'],
      ["WHERE region IN ('SEOUL', 'BUSAN')", 'PARTITION LIST ITERATOR', '각 값에 해당하는 파티션들 접근'],
      ['WHERE amount > 1000', 'PARTITION LIST ALL', '모든 파티션 스캔 (Pruning 없음)'],
    ],

    maintenanceTitle: '파티션 관리 연산',
    maintenanceDesc:
      'List 파티션은 값 목록을 수정하거나, 두 파티션을 병합(MERGE)하거나, 하나의 파티션을 여러 파티션으로 분할(SPLIT)할 수 있어요.',
    maintenanceSql: `-- 파티션 값 목록 수정
ALTER TABLE customers MODIFY PARTITION p_north
  ADD VALUES ('SEJONG');

ALTER TABLE customers MODIFY PARTITION p_north
  DROP VALUES ('INCHEON');

-- 파티션 분할 (SPLIT)
ALTER TABLE customers SPLIT PARTITION p_other
  VALUES ('JEJU')
  INTO (PARTITION p_jeju, PARTITION p_other);`,

    summary:
      'List 파티션은 지역·국가·코드처럼 이산적인 분류 기준이 있을 때 적합해요. DEFAULT 파티션을 정의해서 예상치 못한 값에 대한 INSERT 오류를 방지하고, 필요 시 SPLIT/MERGE로 파티션 구조를 조정해요.',
  },

  en: {
    title: 'List Partition',
    subtitle:
      'List partitioning maps rows to partitions based on an explicit list of partition key values. Use it when data can be cleanly divided by discrete, well-known values such as region codes, countries, or department codes.',

    whatTitle: 'What is List Partitioning?',
    whatDesc:
      "Unlike Range partitioning (which uses ≤, < comparisons), List partitioning classifies rows by whether the partition key value belongs to a specific list. It is ideal for unordered discrete data.\n\nA partition can include multiple values, and a DEFAULT partition can capture any value not explicitly assigned to another partition.",

    basicSql: `-- List partition by region
CREATE TABLE customers (
  customer_id NUMBER,
  name        VARCHAR2(100),
  region      VARCHAR2(20),
  amount      NUMBER
)
PARTITION BY LIST (region) (
  PARTITION p_west   VALUES ('CA', 'OR', 'WA'),
  PARTITION p_east   VALUES ('NY', 'NJ', 'MA'),
  PARTITION p_south  VALUES ('TX', 'FL', 'GA'),
  PARTITION p_other  VALUES (DEFAULT)  -- all other values
);

-- Query a specific partition
SELECT * FROM customers PARTITION (p_west);

-- Add a new partition (DEFAULT must have remaining values)
ALTER TABLE customers ADD PARTITION p_midwest VALUES ('IL', 'OH');

-- Merge two partitions
ALTER TABLE customers MERGE PARTITIONS p_east, p_other
  INTO PARTITION p_etc;`,

    colsTitle: 'List Partition Syntax',
    cols: [
      ['VALUES (v1, v2, ...)', 'The list of partition key values that belong to this partition. Multiple values allowed per partition.'],
      ['DEFAULT', 'Catches all values not assigned to any other partition. Equivalent to Range\'s MAXVALUE. Without it, inserting an unlisted value raises an error.'],
      ['NULL', 'NULL values can be explicitly assigned to a specific partition. With a DEFAULT partition, NULLs go there automatically.'],
    ],

    pruningTitle: 'Partition Pruning',
    pruningDesc:
      'List partitioning pruning occurs on equality (=) or IN conditions against the partition key.',
    pruningTable: [
      ["WHERE region = 'CA'", 'PARTITION LIST SINGLE', 'Accesses only p_west'],
      ["WHERE region IN ('TX', 'FL')", 'PARTITION LIST ITERATOR', 'Accesses p_south'],
      ["WHERE region IN ('CA', 'NY')", 'PARTITION LIST ITERATOR', 'Accesses p_west and p_east'],
      ['WHERE amount > 1000', 'PARTITION LIST ALL', 'All partitions scanned (no pruning)'],
    ],

    maintenanceTitle: 'Partition Maintenance Operations',
    maintenanceDesc:
      'List partitions support modifying value lists, merging two partitions, and splitting one partition into multiple partitions.',
    maintenanceSql: `-- Add/remove values from a partition's list
ALTER TABLE customers MODIFY PARTITION p_west
  ADD VALUES ('NV');

ALTER TABLE customers MODIFY PARTITION p_west
  DROP VALUES ('OR');

-- Split a partition
ALTER TABLE customers SPLIT PARTITION p_other
  VALUES ('HI')
  INTO (PARTITION p_hawaii, PARTITION p_other);`,

    summary:
      'List partitioning suits discrete classification criteria such as regions, countries, or codes. Always define a DEFAULT partition to prevent ORA errors on unrecognized values, and use SPLIT/MERGE to restructure partitions as requirements evolve.',
  },
}

export function PartitionListSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconList size={36} stroke={1.5} className="text-amber" />}
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
        headers={isKo ? ['구문', '설명'] : ['Syntax', 'Description']}
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

      <SectionTitle>{t.maintenanceTitle}</SectionTitle>
      <Prose>{t.maintenanceDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.maintenanceSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
