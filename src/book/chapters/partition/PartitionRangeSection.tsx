import { IconCalendar } from '@tabler/icons-react'
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
    title: 'Range / Interval 파티션',
    subtitle:
      'Range 파티션은 파티션 키의 값 범위를 기준으로 행을 분할해요. Interval 파티션은 Range의 확장으로, 지정한 간격마다 파티션을 자동 생성해요.',

    rangeTitle: 'Range 파티션',
    rangeDesc:
      '각 파티션은 VALUES LESS THAN 절로 상한값을 정의해요. 마지막 파티션에는 MAXVALUE를 지정해서 상한을 벗어나는 행을 수용해요. 날짜 컬럼을 파티션 키로 쓰는 것이 가장 일반적이에요.',
    rangeSql: `-- 연도별 Range 파티션
CREATE TABLE sales (
  sale_id    NUMBER,
  sale_date  DATE,
  amount     NUMBER(10,2)
)
PARTITION BY RANGE (sale_date) (
  PARTITION sales_2022 VALUES LESS THAN (DATE '2023-01-01'),
  PARTITION sales_2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION sales_2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION sales_future VALUES LESS THAN (MAXVALUE)
);

-- 특정 파티션만 조회 (Partition Pruning)
SELECT * FROM sales PARTITION (sales_2023)
WHERE amount > 10000;

-- 파티션 추가
ALTER TABLE sales ADD PARTITION sales_2025
  VALUES LESS THAN (DATE '2026-01-01');

-- 파티션 삭제 (데이터도 함께 삭제)
ALTER TABLE sales DROP PARTITION sales_2022;`,

    rangeCols: [
      ['VALUES LESS THAN (val)', '상한값 미만의 행이 이 파티션에 저장됨. 경계값 자체는 다음 파티션에 속함.'],
      ['MAXVALUE', '정의된 모든 상한을 초과하는 행을 수용하는 마지막 파티션. 생략 시 범위 외 INSERT에서 오류 발생.'],
      ['PARTITION BY RANGE (col)', '파티션 키 컬럼 지정. 복수 컬럼도 가능 (복합 Range).'],
    ],

    intervalTitle: 'Interval 파티션',
    intervalDesc:
      'Oracle 11g에서 도입된 Interval 파티션은 Range의 확장이에요. 전환점(Transition Point) 이후로 데이터가 들어오면 지정된 간격(Interval)마다 파티션을 자동으로 생성해요. 이미 정의된 파티션 범위를 벗어나는 데이터가 INSERT될 때 새 파티션이 자동으로 추가돼요.',
    intervalSql: `-- 월별 Interval 파티션
CREATE TABLE orders (
  order_id    NUMBER,
  order_date  DATE,
  customer_id NUMBER
)
PARTITION BY RANGE (order_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))  -- 1개월 간격
(
  -- 전환점: 이 파티션 이후는 자동 생성
  PARTITION p_before_2024 VALUES LESS THAN (DATE '2024-01-01')
);

-- 2024-02-15 INSERT 시 자동으로 2024년 2월 파티션이 생성됨
INSERT INTO orders VALUES (1, DATE '2024-02-15', 100);

-- 일별 Interval
PARTITION BY RANGE (log_date)
INTERVAL (NUMTODSINTERVAL(1, 'DAY'))
(PARTITION p0 VALUES LESS THAN (DATE '2024-01-01'));`,
    intervalCols: [
      ['INTERVAL(n)', '새 파티션 생성 간격. NUMTOYMINTERVAL(n, \'MONTH\'/\'YEAR\') 또는 NUMTODSINTERVAL(n, \'DAY\'/\'HOUR\') 사용.'],
      ['Transition Point', 'INTERVAL 절 전에 정의한 마지막 VALUES LESS THAN 파티션의 상한값. 이 지점 이후 데이터부터 자동 파티션 생성.'],
    ],

    compTitle: 'Range vs Interval 비교',
    compTable: [
      ['파티션 생성', '수동 (ALTER TABLE ADD PARTITION)', '자동 (INSERT 시)'],
      ['파티션 수 예측', '가능', '불가 (데이터 도달 시 생성)'],
      ['MAXVALUE 파티션', '필요 (없으면 INSERT 오류)', '불필요'],
      ['관리 오버헤드', '높음 (수동 추가 필요)', '낮음 (자동 생성)'],
      ['Oracle 버전', '모든 버전', '11g 이상'],
    ],

    pruningTitle: 'Partition Pruning 예시',
    pruningDesc:
      'Range 파티션에서 Pruning이 동작하려면 WHERE 절에 파티션 키가 포함되어야 해요. 실행 계획의 Pstart/Pstop 컬럼에서 접근하는 파티션 번호를 확인할 수 있어요.',
    pruningTable: [
      ["WHERE sale_date = DATE '2023-06-15'", 'PARTITION RANGE SINGLE', 'sales_2023 파티션 1개만 접근'],
      ["WHERE sale_date >= DATE '2023-01-01' AND sale_date < DATE '2024-01-01'", 'PARTITION RANGE SINGLE', '단일 파티션'],
      ["WHERE sale_date >= DATE '2022-06-01'", 'PARTITION RANGE ITERATOR', '범위 내 여러 파티션'],
      ['WHERE amount > 10000', 'PARTITION RANGE ALL', '모든 파티션 스캔 (Pruning 없음)'],
    ],

    summary:
      'Range 파티션은 날짜·숫자 범위 데이터에 가장 적합해요. 파티션 수가 예측 가능하면 Range를, 날짜 데이터가 지속적으로 유입되는 경우에는 관리 부담이 적은 Interval 파티션을 선택해요.',
  },

  en: {
    title: 'Range / Interval Partition',
    subtitle:
      'Range partitioning maps rows to partitions based on ranges of the partition key value. Interval partitioning extends Range by automatically creating new partitions at a specified interval.',

    rangeTitle: 'Range Partition',
    rangeDesc:
      'Each partition defines its upper bound with a VALUES LESS THAN clause. The last partition uses MAXVALUE to accommodate any row that exceeds all defined bounds. Date columns are the most common partition key.',
    rangeSql: `-- Yearly Range Partition
CREATE TABLE sales (
  sale_id    NUMBER,
  sale_date  DATE,
  amount     NUMBER(10,2)
)
PARTITION BY RANGE (sale_date) (
  PARTITION sales_2022 VALUES LESS THAN (DATE '2023-01-01'),
  PARTITION sales_2023 VALUES LESS THAN (DATE '2024-01-01'),
  PARTITION sales_2024 VALUES LESS THAN (DATE '2025-01-01'),
  PARTITION sales_future VALUES LESS THAN (MAXVALUE)
);

-- Query a specific partition (Partition Pruning)
SELECT * FROM sales PARTITION (sales_2023)
WHERE amount > 10000;

-- Add a new partition
ALTER TABLE sales ADD PARTITION sales_2025
  VALUES LESS THAN (DATE '2026-01-01');

-- Drop a partition (data is also deleted)
ALTER TABLE sales DROP PARTITION sales_2022;`,

    rangeCols: [
      ['VALUES LESS THAN (val)', 'Rows with a key value strictly less than val are stored in this partition. The boundary value itself belongs to the next partition.'],
      ['MAXVALUE', 'Last partition that accepts rows exceeding all defined bounds. Omitting it causes an ORA error when out-of-range rows are inserted.'],
      ['PARTITION BY RANGE (col)', 'Specifies the partition key column. Multiple columns (composite range) are also supported.'],
    ],

    intervalTitle: 'Interval Partition',
    intervalDesc:
      "Introduced in Oracle 11g, Interval partitioning extends Range. When data arrives beyond the transition point (the last manually defined partition), Oracle automatically creates a new partition for each interval. New partitions are created on-demand as INSERT statements reach previously undefined ranges.",
    intervalSql: `-- Monthly Interval Partition
CREATE TABLE orders (
  order_id    NUMBER,
  order_date  DATE,
  customer_id NUMBER
)
PARTITION BY RANGE (order_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))  -- 1-month interval
(
  -- Transition point: partitions beyond this are auto-created
  PARTITION p_before_2024 VALUES LESS THAN (DATE '2024-01-01')
);

-- Inserting 2024-02-15 automatically creates a February 2024 partition
INSERT INTO orders VALUES (1, DATE '2024-02-15', 100);

-- Daily interval
PARTITION BY RANGE (log_date)
INTERVAL (NUMTODSINTERVAL(1, 'DAY'))
(PARTITION p0 VALUES LESS THAN (DATE '2024-01-01'));`,
    intervalCols: [
      ["INTERVAL(n)", "New partition creation interval. Use NUMTOYMINTERVAL(n, 'MONTH'/'YEAR') or NUMTODSINTERVAL(n, 'DAY'/'HOUR')."],
      ['Transition Point', 'The upper bound of the last manually defined VALUES LESS THAN partition. Rows beyond this point trigger automatic partition creation.'],
    ],

    compTitle: 'Range vs Interval Comparison',
    compTable: [
      ['Partition Creation', 'Manual (ALTER TABLE ADD PARTITION)', 'Automatic (on INSERT)'],
      ['Predictable Count', 'Yes', 'No (created on demand)'],
      ['MAXVALUE Partition', 'Required (else INSERT error)', 'Not needed'],
      ['Admin Overhead', 'High (must add manually)', 'Low (auto-created)'],
      ['Oracle Version', 'All versions', '11g and above'],
    ],

    pruningTitle: 'Partition Pruning Examples',
    pruningDesc:
      'For Range partitions, the WHERE clause must include the partition key for Pruning to work. Check the Pstart/Pstop columns in the execution plan to see which partition numbers are accessed.',
    pruningTable: [
      ["WHERE sale_date = DATE '2023-06-15'", 'PARTITION RANGE SINGLE', 'Accesses only the sales_2023 partition'],
      ["WHERE sale_date >= DATE '2023-01-01' AND sale_date < DATE '2024-01-01'", 'PARTITION RANGE SINGLE', 'Single partition'],
      ["WHERE sale_date >= DATE '2022-06-01'", 'PARTITION RANGE ITERATOR', 'Iterates over partitions in range'],
      ['WHERE amount > 10000', 'PARTITION RANGE ALL', 'All partitions scanned (no pruning)'],
    ],

    summary:
      'Range partitioning is best for date or numeric range data. Choose Range when partition count is predictable; choose Interval when date data streams in continuously and you want minimal manual administration.',
  },
}

export function PartitionRangeSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconCalendar size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.rangeTitle}</SectionTitle>
      <Prose>{t.rangeDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.rangeSql} />
      </div>
      <Table
        headers={isKo ? ['구문', '설명'] : ['Syntax', 'Description']}
        rows={t.rangeCols}
      />

      <Divider />

      <SectionTitle>{t.intervalTitle}</SectionTitle>
      <Prose>{t.intervalDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.intervalSql} />
      </div>
      <Table
        headers={isKo ? ['개념', '설명'] : ['Concept', 'Description']}
        rows={t.intervalCols}
      />

      <Divider />

      <SectionTitle>{t.compTitle}</SectionTitle>
      <Table
        headers={isKo ? ['항목', 'Range', 'Interval'] : ['Item', 'Range', 'Interval']}
        rows={t.compTable}
      />

      <Divider />

      <SectionTitle>{t.pruningTitle}</SectionTitle>
      <Prose>{t.pruningDesc}</Prose>
      <Table
        headers={isKo ? ['WHERE 조건', 'Pruning 유형', '결과'] : ['WHERE Clause', 'Pruning Type', 'Result']}
        rows={t.pruningTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
