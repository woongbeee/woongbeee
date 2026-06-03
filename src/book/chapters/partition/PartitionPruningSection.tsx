import { IconScissors } from '@tabler/icons-react'
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
    title: 'Partition Pruning',
    subtitle:
      'Partition Pruning은 쿼리 WHERE 조건을 분석해서 무관한 파티션을 건너뛰는 최적화예요. 대용량 테이블에서 I/O를 수십~수백 배 줄일 수 있는 파티셔닝의 핵심 기능이에요.',

    whatTitle: 'Partition Pruning이란?',
    whatDesc:
      'WHERE 절에 파티션 키가 포함되면 Oracle은 관련 없는 파티션의 데이터 블록을 아예 읽지 않아요. 예를 들어 12개 월별 파티션이 있는 테이블에서 특정 월만 조회하면 1/12의 I/O만 발생해요.\n\nPruning은 SQL을 변경하지 않아도 자동으로 발생해요. 단, 파티션 키가 WHERE 조건에 포함되어야 하며, 파티션 키 컬럼에 함수를 적용하거나 형 변환이 발생하면 Pruning이 되지 않아요.',

    staticTitle: 'Static Pruning',
    staticDesc:
      'Static Pruning은 쿼리 파싱(Compile) 시점에 접근 파티션이 결정돼요. 리터럴 값 비교, 날짜 리터럴처럼 쿼리 텍스트에서 파티션을 특정할 수 있을 때 발생해요.',
    staticSql: `-- Static Pruning 예시 (리터럴 값)
SELECT *
FROM   sales
WHERE  sale_date >= DATE '2024-01-01'
  AND  sale_date <  DATE '2025-01-01';
-- → 컴파일 시 p2024 파티션만 접근 결정

-- 실행 계획 확인
EXPLAIN PLAN FOR
SELECT * FROM sales
WHERE sale_date >= DATE '2024-01-01'
  AND sale_date <  DATE '2025-01-01';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'BASIC +PARTITION'));
-- Pstart=p2024, Pstop=p2024 으로 표시됨`,

    dynamicTitle: 'Dynamic Pruning',
    dynamicDesc:
      'Dynamic Pruning은 실행 시점에 접근 파티션이 결정돼요. 바인드 변수, 서브쿼리, 조인 결과처럼 컴파일 시점에 값을 알 수 없을 때 발생해요.',
    dynamicSql: `-- 바인드 변수 Dynamic Pruning
SELECT *
FROM   sales
WHERE  sale_date = :bind_date;  -- 실행 시 파티션 결정
-- 실행 계획: Pstart=KEY, Pstop=KEY

-- 서브쿼리 Dynamic Pruning
SELECT *
FROM   sales s
WHERE  s.sale_date = (SELECT MAX(order_date) FROM orders);
-- 실행 계획: Pstart=KEY(SQ), Pstop=KEY(SQ)

-- 조인 Dynamic Pruning (Partition-Wise Join 연계)
SELECT s.*, c.customer_name
FROM   sales    s
JOIN   customers c ON s.customer_id = c.customer_id
WHERE  c.region = 'NORTH';
-- 조인 결과에 따라 동적으로 파티션 결정`,

    planTitle: '실행 계획에서 Pruning 확인',
    planDesc:
      '실행 계획의 Pstart, Pstop 컬럼이 접근하는 파티션 범위를 나타냅니다. DBMS_XPLAN.DISPLAY(format => \'BASIC +PARTITION\')으로 확인합니다.',
    planTable: [
      ['숫자 (예: 3)', '3', '3', '파티션 번호 3 하나만 접근 (Static Pruning)'],
      ['KEY', 'KEY', 'KEY', '바인드 변수 기반 Dynamic Pruning'],
      ['KEY(SQ)', 'KEY(SQ)', 'KEY(SQ)', '서브쿼리 기반 Dynamic Pruning'],
      ['1 ~ N (전체)', '1', 'N', '모든 파티션 스캔 (Pruning 없음)'],
      ['PARTITION RANGE ALL', '1', 'N', '파티션 키가 WHERE에 없음'],
    ],

    antiTitle: 'Pruning을 방해하는 패턴',
    antiDesc:
      '파티션 키 컬럼에 아래 패턴을 사용하면 Pruning이 발생하지 않아요.',
    antiTable: [
      ["TO_CHAR(sale_date, 'YYYY') = '2024'", '파티션 키에 함수 적용 → Pruning 불가. sale_date BETWEEN 조건으로 변경.'],
      ["TRUNC(sale_date) = TRUNC(SYSDATE)", 'TRUNC 함수 적용 → Pruning 불가. sale_date >= DATE 조건으로 변경.'],
      ['WHERE 1=1 (파티션 키 조건 없음)', '파티션 키가 WHERE에 없으면 전체 파티션 스캔.'],
      ["암묵적 형 변환: sale_date = '2024-01-01'", '문자열과 날짜 비교 시 형 변환 발생 → Pruning 불가. TO_DATE 명시.'],
    ],

    summary:
      'Partition Pruning은 파티셔닝 효과를 직접 체감할 수 있는 핵심 메커니즘이에요. 파티션 키를 WHERE 절에 포함하고, 파티션 키 컬럼에 함수나 형 변환을 피해야 해요. 실행 계획의 Pstart/Pstop 컬럼으로 Pruning 여부를 항상 확인하세요.',
  },

  en: {
    title: 'Partition Pruning',
    subtitle:
      "Partition Pruning analyzes a query's WHERE clause to skip irrelevant partitions entirely. It is the core feature of partitioning that can reduce I/O by orders of magnitude on large tables.",

    whatTitle: 'What is Partition Pruning?',
    whatDesc:
      "When the partition key appears in the WHERE clause, Oracle does not read data blocks from unrelated partitions at all. For example, querying a specific month on a table with 12 monthly partitions generates only 1/12 of the I/O.\n\nPruning happens automatically without any SQL changes. However, the partition key must appear in the WHERE clause, and applying a function to the partition key column or triggering implicit type conversion disables Pruning.",

    staticTitle: 'Static Pruning',
    staticDesc:
      'Static Pruning determines the target partition(s) at parse (compile) time. It occurs when the query text contains literal values that unambiguously identify specific partitions.',
    staticSql: `-- Static Pruning example (literal values)
SELECT *
FROM   sales
WHERE  sale_date >= DATE '2024-01-01'
  AND  sale_date <  DATE '2025-01-01';
-- → p2024 partition determined at compile time

-- Verify in the execution plan
EXPLAIN PLAN FOR
SELECT * FROM sales
WHERE sale_date >= DATE '2024-01-01'
  AND sale_date <  DATE '2025-01-01';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'BASIC +PARTITION'));
-- Shows Pstart=p2024, Pstop=p2024`,

    dynamicTitle: 'Dynamic Pruning',
    dynamicDesc:
      'Dynamic Pruning determines the target partition(s) at runtime. It occurs when the value is not known at compile time — bind variables, subqueries, or join results.',
    dynamicSql: `-- Bind variable Dynamic Pruning
SELECT *
FROM   sales
WHERE  sale_date = :bind_date;  -- partition decided at runtime
-- Execution plan: Pstart=KEY, Pstop=KEY

-- Subquery Dynamic Pruning
SELECT *
FROM   sales s
WHERE  s.sale_date = (SELECT MAX(order_date) FROM orders);
-- Execution plan: Pstart=KEY(SQ), Pstop=KEY(SQ)

-- Join Dynamic Pruning (with Partition-Wise Join)
SELECT s.*, c.customer_name
FROM   sales    s
JOIN   customers c ON s.customer_id = c.customer_id
WHERE  c.region = 'NORTH';
-- Partitions determined dynamically based on join results`,

    planTitle: 'Verifying Pruning in the Execution Plan',
    planDesc:
      "The Pstart and Pstop columns in the execution plan show the range of partitions accessed. Use DBMS_XPLAN.DISPLAY(format => 'BASIC +PARTITION') to view them.",
    planTable: [
      ['Number (e.g., 3)', '3', '3', 'Only partition #3 accessed (Static Pruning)'],
      ['KEY', 'KEY', 'KEY', 'Bind variable Dynamic Pruning'],
      ['KEY(SQ)', 'KEY(SQ)', 'KEY(SQ)', 'Subquery Dynamic Pruning'],
      ['1 to N (full range)', '1', 'N', 'All partitions scanned (no pruning)'],
      ['PARTITION RANGE ALL', '1', 'N', 'Partition key not in WHERE clause'],
    ],

    antiTitle: 'Patterns That Prevent Pruning',
    antiDesc:
      'Using the following patterns on the partition key column disables Pruning.',
    antiTable: [
      ["TO_CHAR(sale_date, 'YYYY') = '2024'", 'Function applied to partition key → no pruning. Use BETWEEN on sale_date instead.'],
      ['TRUNC(sale_date) = TRUNC(SYSDATE)', 'TRUNC applied → no pruning. Use sale_date >= DATE condition instead.'],
      ['No partition key in WHERE', 'Without a partition key condition, all partitions are scanned.'],
      ["Implicit conversion: sale_date = '2024-01-01'", 'String-to-date conversion prevents pruning. Use explicit TO_DATE.'],
    ],

    summary:
      "Partition Pruning is the mechanism that makes partitioning benefits tangible. Always include the partition key in WHERE clauses, and avoid functions or implicit type conversions on the partition key column. Verify pruning using the Pstart/Pstop columns in every execution plan.",
  },
}

export function PartitionPruningSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconScissors size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.staticTitle}</SectionTitle>
      <Prose>{t.staticDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.staticSql} />
      </div>

      <Divider />

      <SectionTitle>{t.dynamicTitle}</SectionTitle>
      <Prose>{t.dynamicDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.dynamicSql} />
      </div>

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <Table
        headers={isKo ? ['표시 형태', 'Pstart', 'Pstop', '의미'] : ['Display', 'Pstart', 'Pstop', 'Meaning']}
        rows={t.planTable}
      />

      <Divider />

      <SectionTitle>{t.antiTitle}</SectionTitle>
      <Prose>{t.antiDesc}</Prose>
      <Table
        headers={isKo ? ['패턴', '문제 및 해결'] : ['Pattern', 'Problem & Fix']}
        rows={t.antiTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
