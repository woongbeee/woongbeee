import { IconTransform } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  Table,
} from '../../shared'

const T = {
  ko: {
    title: 'Query Rewrite with Materialized Views',
    subtitle: 'Materialized View에 미리 계산된 결과를 활용하도록 쿼리를 자동으로 재작성해서 수백만 행의 집계를 피해요.',

    whatTitle: 'Materialized View Query Rewrite란?',
    whatDesc:
      'Query Rewrite with Materialized Views는 옵티마이저가 사용자 쿼리를 Materialized View를 사용하도록 자동으로 재작성하는 변환이에요. Materialized View는 미리 집계·조인·계산된 결과를 물리적으로 저장한 테이블이에요.\n\n사용자는 원본 테이블에 대한 쿼리를 그대로 작성해도 돼요. Oracle이 자동으로 더 작은 Materialized View를 사용하는 방향으로 재작성해요.',

    benefitTitle: '왜 Query Rewrite가 필요할까요?',
    benefitDesc:
      '예를 들어 수천만 건의 sales 테이블에서 월별 합계를 구하는 쿼리가 있다고 가정해요. 이 쿼리를 매번 실행하면 수천만 행을 읽어야 해요.\n\nMaterialized View가 월별 합계를 미리 계산해두면 동일한 결과를 수백 행짜리 뷰에서 바로 읽어올 수 있어요. Query Rewrite는 이를 자동으로 처리해요.',

    exampleTitle: '변환 예시 (공식 문서)',
    createMvSql: `-- 1단계: Materialized View 생성 (월별 매출 합계 미리 계산)
CREATE MATERIALIZED VIEW cal_month_sales_mv AS
SELECT t.calendar_month_desc,
       SUM(s.amount_sold) AS dollars
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;`,
    beforeSql: `-- 2단계: 원본 쿼리 (수천만 건 처리)
SELECT t.calendar_month_desc, SUM(s.amount_sold)
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;`,
    afterSql: `-- Query Rewrite 적용 후 (자동 재작성)
SELECT calendar_month_desc, dollars
FROM   cal_month_sales_mv;
-- → sales 테이블 수천만 행 대신 수백 행만 읽음`,

    paramsTitle: '주요 초기화 파라미터',
    paramsDesc: 'Query Rewrite 동작을 제어하는 초기화 파라미터예요.',
    paramsTable: [
      ['QUERY_REWRITE_ENABLED', 'TRUE (기본값)', 'Query Rewrite 활성화. FALSE로 끄거나, FORCE로 무결성 검사 없이 강제 적용.'],
      ['QUERY_REWRITE_INTEGRITY', 'ENFORCED (기본값)', '가장 안전한 수준. 신선한 데이터와 검증된 제약조건을 가진 MV만 사용.'],
      ['OPTIMIZER_MODE', 'ALL_ROWS (기본값)', 'Query Rewrite 여부에 영향. ALL_ROWS, FIRST_ROWS, FIRST_ROWS_n 지원.'],
    ],

    integrityTitle: 'QUERY_REWRITE_INTEGRITY 수준',
    integrityDesc: 'Query Rewrite가 허용하는 데이터 정확도 수준을 세 단계로 설정할 수 있어요.',
    integrityTable: [
      ['ENFORCED', '가장 안전 (기본값)', '신선한 데이터만 사용. Oracle이 직접 무결성을 강제할 수 있는 경우만 적용.'],
      ['TRUSTED', '신뢰 기반', 'RELY 제약조건과 선언된 관계를 신뢰. Oracle이 직접 확인하지 않은 관계도 활용 가능.'],
      ['STALE_TOLERATED', '최대 활용', '데이터가 오래되어도 MV 사용. 정확성보다 성능 우선이 필요한 경우에 사용.'],
    ],

    prereqTitle: '적용 조건',
    prereqDesc: 'Query Rewrite가 적용되려면 다음 조건이 필요해요.',
    prereqItems: [
      'QUERY_REWRITE_ENABLED 파라미터가 TRUE여야 해요.',
      'Materialized View에 ENABLE QUERY REWRITE 옵션이 설정되어 있어야 해요.',
      'MV의 데이터가 신선하거나 STALE_TOLERATED 수준이어야 해요.',
      '사용자에게 QUERY REWRITE 시스템 권한 또는 해당 MV에 대한 QUERY REWRITE 객체 권한이 있어야 해요.',
    ],
    prereqSql: `-- Query Rewrite를 허용하는 MV 생성
CREATE MATERIALIZED VIEW cal_month_sales_mv
BUILD IMMEDIATE
REFRESH FAST ON COMMIT
ENABLE QUERY REWRITE   -- Query Rewrite 허용
AS
SELECT t.calendar_month_desc,
       SUM(s.amount_sold) AS dollars
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;

-- 파라미터 세션 설정
ALTER SESSION SET query_rewrite_enabled = TRUE;
ALTER SESSION SET query_rewrite_integrity = ENFORCED;`,

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Query Rewrite 강제 (특정 MV 지정)
SELECT /*+ REWRITE(cal_month_sales_mv) */
       t.calendar_month_desc, SUM(s.amount_sold)
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;

-- Query Rewrite 방지
SELECT /*+ NO_REWRITE */
       t.calendar_month_desc, SUM(s.amount_sold)
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;`,

    summaryTitle: 'Query Rewrite with MVs 핵심 정리',
    summaryItems: [
      '원본 쿼리를 그대로 작성해도 Oracle이 자동으로 Materialized View를 활용하도록 재작성해요.',
      'QUERY_REWRITE_ENABLED=TRUE, MV에 ENABLE QUERY REWRITE가 필요해요.',
      'QUERY_REWRITE_INTEGRITY: ENFORCED(안전) → TRUSTED(신뢰) → STALE_TOLERATED(최대 활용).',
      '힌트: REWRITE(MV명) (강제), NO_REWRITE (방지).',
    ],
  },
  en: {
    title: 'Query Rewrite with Materialized Views',
    subtitle: 'Automatically rewrites queries to use precomputed results stored in materialized views, avoiding full scans of millions of rows.',

    whatTitle: 'What is Query Rewrite with Materialized Views?',
    whatDesc:
      "Query Rewrite with Materialized Views is an optimizer transformation that automatically rewrites a user query to access a materialized view instead of the underlying base tables. A materialized view physically stores precomputed join, aggregate, or calculation results.\n\nUsers write queries against the original tables as usual — Oracle transparently redirects the query to the smaller materialized view whenever doing so produces the same result.",

    benefitTitle: 'Why Query Rewrite?',
    benefitDesc:
      "Consider a query that computes monthly totals from a sales table with tens of millions of rows. Running it directly means scanning all those rows every time.\n\nIf a materialized view has already computed those monthly totals, the same result can be read from a view with only hundreds of rows. Query Rewrite handles this redirection automatically.",

    exampleTitle: 'Transformation Example (Oracle Docs)',
    createMvSql: `-- Step 1: Create the materialized view (precompute monthly totals)
CREATE MATERIALIZED VIEW cal_month_sales_mv AS
SELECT t.calendar_month_desc,
       SUM(s.amount_sold) AS dollars
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;`,
    beforeSql: `-- Step 2: Original query (must scan millions of rows)
SELECT t.calendar_month_desc, SUM(s.amount_sold)
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;`,
    afterSql: `-- After Query Rewrite (automatic)
SELECT calendar_month_desc, dollars
FROM   cal_month_sales_mv;
-- → reads hundreds of rows instead of millions`,

    paramsTitle: 'Key Initialization Parameters',
    paramsDesc: 'These parameters control Query Rewrite behavior.',
    paramsTable: [
      ['QUERY_REWRITE_ENABLED', 'TRUE (default)', 'Enables Query Rewrite. Set FALSE to disable, or FORCE to bypass integrity checks.'],
      ['QUERY_REWRITE_INTEGRITY', 'ENFORCED (default)', 'Safest level. Only uses fresh data and validated constraints.'],
      ['OPTIMIZER_MODE', 'ALL_ROWS (default)', 'Affects whether Query Rewrite is considered. Supports ALL_ROWS, FIRST_ROWS, FIRST_ROWS_n.'],
    ],

    integrityTitle: 'QUERY_REWRITE_INTEGRITY Levels',
    integrityDesc: 'Three levels control how strictly Oracle validates data freshness and constraint integrity before applying Query Rewrite.',
    integrityTable: [
      ['ENFORCED', 'Safest (default)', 'Only uses views with fresh data that Oracle can directly validate.'],
      ['TRUSTED', 'Trust-based', 'Trusts RELY constraints and declared relationships that Oracle has not directly verified.'],
      ['STALE_TOLERATED', 'Maximum capability', 'Uses materialized views even when their data is stale. Prioritizes performance over accuracy.'],
    ],

    prereqTitle: 'Prerequisites',
    prereqDesc: 'Query Rewrite requires all of the following.',
    prereqItems: [
      'The QUERY_REWRITE_ENABLED initialization parameter must be TRUE.',
      'The materialized view must be created with the ENABLE QUERY REWRITE option.',
      "The view's data must be fresh, or QUERY_REWRITE_INTEGRITY must be STALE_TOLERATED.",
      'The user must have the QUERY REWRITE system privilege, or the QUERY REWRITE object privilege on the specific materialized view.',
    ],
    prereqSql: `-- Create an MV with Query Rewrite enabled
CREATE MATERIALIZED VIEW cal_month_sales_mv
BUILD IMMEDIATE
REFRESH FAST ON COMMIT
ENABLE QUERY REWRITE   -- allow Query Rewrite
AS
SELECT t.calendar_month_desc,
       SUM(s.amount_sold) AS dollars
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;

-- Session-level parameter settings
ALTER SESSION SET query_rewrite_enabled = TRUE;
ALTER SESSION SET query_rewrite_integrity = ENFORCED;`,

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Query Rewrite (name a specific MV)
SELECT /*+ REWRITE(cal_month_sales_mv) */
       t.calendar_month_desc, SUM(s.amount_sold)
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;

-- Suppress Query Rewrite
SELECT /*+ NO_REWRITE */
       t.calendar_month_desc, SUM(s.amount_sold)
FROM   sales s, times t
WHERE  s.time_id = t.time_id
GROUP BY t.calendar_month_desc;`,

    summaryTitle: 'Query Rewrite with MVs Key Takeaways',
    summaryItems: [
      'Write queries against base tables as usual — Oracle automatically rewrites them to use materialized views.',
      'Requires QUERY_REWRITE_ENABLED=TRUE and ENABLE QUERY REWRITE on the materialized view.',
      'QUERY_REWRITE_INTEGRITY: ENFORCED (safest) → TRUSTED (trust-based) → STALE_TOLERATED (maximum capability).',
      'Hints: REWRITE(mv_name) (force), NO_REWRITE (suppress).',
    ],
  },
}

export function QtMaterializedViewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconTransform size={36} stroke={1.5} className="text-cyan-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.benefitTitle}</SectionTitle>
      <Prose>{t.benefitDesc}</Prose>

      <Divider />

      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.createMvSql} />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.beforeSql} badge={lang === 'ko' ? '원본 쿼리' : 'Original Query'} badgeColor="rose" />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.afterSql} badge={lang === 'ko' ? '재작성 후' : 'After Rewrite'} badgeColor="emerald" />
      </div>

      <Divider />

      <SectionTitle>{t.paramsTitle}</SectionTitle>
      <Prose>{t.paramsDesc}</Prose>
      <Table
        headers={[lang === 'ko' ? '파라미터' : 'Parameter', lang === 'ko' ? '기본값' : 'Default', lang === 'ko' ? '설명' : 'Description']}
        rows={t.paramsTable}
      />

      <Divider />

      <SectionTitle>{t.integrityTitle}</SectionTitle>
      <Prose>{t.integrityDesc}</Prose>
      <Table
        headers={[lang === 'ko' ? '수준' : 'Level', lang === 'ko' ? '특성' : 'Characteristic', lang === 'ko' ? '설명' : 'Description']}
        rows={t.integrityTable}
      />

      <Divider />

      <SectionTitle>{t.prereqTitle}</SectionTitle>
      <Prose>{t.prereqDesc}</Prose>
      <div className="mt-4 space-y-2">
        {t.prereqItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 font-mono text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.prereqSql} />
      </div>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {t.summaryItems.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
