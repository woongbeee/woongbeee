import { IconArrowsShuffle } from '@tabler/icons-react'
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
  AccordionSection,
} from '../../../shared'

const T = {
  ko: {
    title: '실행 계획 비교하기',
    subtitle:
      '계획 비교 도구는 기준 계획(reference plan)과 임의의 테스트 계획 목록을 받아 차이점을 강조 표시합니다. 비교는 라인 단위가 아닌 논리적 비교입니다.',
    purposeTitle: '계획 비교의 목적',
    purposeDesc:
      '계획 비교 보고서는 차이점의 원인을 식별해서 사용자가 계획 재현성 문제를 분류할 수 있게 도와줘요.',
    purposeItems: [
      '성능이 회귀하는 쿼리의 현재 계획을 AWR에 캡처된 이전 계획과 비교하고 싶을 때',
      'SQL 계획 기준선(SQL plan baseline)이 원래 의도한 계획을 재현하는 데 실패했을 때 새 계획과 의도한 계획의 차이를 확인하고 싶을 때',
      '힌트 추가, 파라미터 변경, 인덱스 생성이 계획에 어떤 영향을 미칠지 확인하고 싶을 때',
      'SQL 프로파일이나 SQL Performance Analyzer가 생성한 계획이 원본 계획과 어떻게 다른지 확인하고 싶을 때',
    ],
    reportFormatTitle: '비교 보고서 포맷',
    reportFormatDesc:
      '보고서는 요약으로 시작돼요. COMPARE PLANS REPORT 섹션에는 보고서를 실행한 사용자와 비교된 계획 수 같은 정보가 포함돼요.',
    reportSample: `COMPARE PLANS REPORT
-------------------------------------------------------------------------
  Current user           : SH
  Total number of plans  : 2
  Number of findings     : 1
-------------------------------------------------------------------------

Comparison Results (1):
-----------------------------
 1. Query block SEL$1, Alias PRODUCTS@SEL$1: Some columns (OPERATION,
    OPTIONS, OBJECT_NAME) do not match between the reference
    plan (id: 2) and the current plan (id: 2).`,
    sourcesTitle: '계획 소스 (Table 6-3)',
    sourcesRows: [
      ['Plan Table', 'plan_table_object(owner, plan_table_name, statement_id, plan_id)', 'EXPLAIN PLAN 결과가 저장된 계획 테이블'],
      ['Cursor Cache', 'cursor_cache_object(sql_id, child_number)', '공유 SQL 영역의 커서 캐시'],
      ['AWR', 'awr_object(sql_id, dbid, con_dbid, plan_hash_value)', 'AWR에 저장된 계획 이력'],
      ['SQL Tuning Set', 'sqlset_object(sqlset_owner, sqlset_name, sql_id, plan_hash_value)', 'SQL 튜닝 세트에 저장된 계획'],
      ['SQL Plan Management', 'spm_object(sql_handle, plan_name)', 'SQL plan baseline으로 보호되는 계획'],
      ['SQL Profile', 'sql_profile_object(profile_name)', 'SQL 프로파일 계획'],
      ['Advisor', 'advisor_object(task_name, execution_name, sql_id, plan_id)', 'SQL Tuning Advisor 계획'],
    ],
    functionTitle: 'DBMS_XPLAN.COMPARE_PLANS 함수',
    functionSql: `DBMS_XPLAN.COMPARE_PLANS(
    reference_plan        IN generic_plan_object,
    compare_plan_list     IN plan_object_list,
    type                  IN VARCHAR2 := 'TEXT',   -- TEXT, XML, HTML
    level                 IN VARCHAR2 := 'TYPICAL', -- BASIC, TYPICAL, ALL
    section               IN VARCHAR2 := 'ALL')    -- ALL, SUMMARY
RETURN CLOB;`,
    tutorialTitle: '튜토리얼: Join Elimination 비교 (Example 6-8 ~ 6-11)',
    tutorialDesc:
      '이 튜토리얼에서는 두 개의 서로 다른 쿼리를 비교합니다. 계획 비교 보고서는 옵티마이저가 한 쿼리에서는 Join Elimination 변환을 적용했지만 다른 쿼리에서는 적용하지 않았음을 보여줍니다.',
    tutorialSql: `-- user sh가 실행한 두 쿼리
SELECT count(*)
FROM   products p, sales s
WHERE  p.prod_id = s.prod_id
AND    p.prod_min_price > 200;

SELECT count(*)
FROM   products p, sales s
WHERE  p.prod_id = s.prod_id
AND    s.quantity_sold = 43;

-- 1단계: V$SQL로 SQL ID 확인
SELECT SQL_ID, SQL_TEXT
FROM   V$SQL
WHERE  SQL_TEXT LIKE '%products%'
AND    SQL_TEXT NOT LIKE '%SQL_TEXT%'
ORDER BY SQL_ID;

-- 2단계: 계획 비교 실행
VARIABLE v_rep CLOB

BEGIN
  :v_rep := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => cursor_cache_object('0hxmvnfkasg6q', NULL),
    compare_plan_list => plan_object_list(cursor_cache_object('10dqxjph6bwum', NULL)),
    type              => 'TEXT',
    level             => 'TYPICAL',
    section           => 'ALL');
END;
/

-- 3단계: 보고서 출력
SELECT :v_rep REPORT FROM DUAL;`,
    tutorialOutput: `-- Join Elimination 변환이 기준 계획(quantity_sold 조건)에서만 발생!
Comparison Results (1):
-----------------------------
 1. Query block SEL$1: Transformation JOIN REMOVED FROM QUERY BLOCK occurred
    only in the reference plan (result query block: SEL$A43D1678).`,
    tutorialNote:
      '첫 번째 쿼리(quantity_sold=43)에서는 products 테이블에 대한 Join이 제거되어 SALES 테이블만 스캔했어요. 두 번째 쿼리(prod_min_price>200)에서는 products 테이블도 접근해야 해서 Join이 유지됐어요.',
    ex8Title: 'Example 6-8: 자식 커서 계획 비교',
    ex8Sql: `VAR v_report CLOB;

BEGIN
  :v_report := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 2),
    compare_plan_list => PLAN_OBJECT_LIST(CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 4)));
END;
/

PRINT v_report`,
    ex9Title: 'Example 6-9: 커서 캐시와 SQL Plan Baseline 비교',
    ex9Sql: `VAR v_report CLOB;
BEGIN
  :v_report := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 2),
    compare_plan_list => PLAN_OBJECT_LIST(
      SPM_OBJECT('SQL_024d0f7d21351f5d', 'SQL_PLAN_sdfjkd')));
END;

PRINT v_report`,
    ex10Title: 'Example 6-10: 여러 소스의 계획과 한꺼번에 비교',
    ex10Sql: `VAR v_report CLOB
BEGIN
  :v_report := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 2),
    compare_plan_list => plan_object_list(
         cursor_cache_object('8mkxm7ur07za0'),
         sqlset_object('SH', 'SQLT_WORKLOAD', '6vfqvav0rgyad'),
         awr_object('6vfqvad0rgyad', 5),
         spm_object('SQL_024d0f7d21351f5d', 'SQL_PLAN_sdfjkd')),
    type              => 'XML',
    level             => 'ALL',
    section           => 'SUMMARY');
END;
/

PRINT v_report`,
    ex11Title: 'Example 6-11: EXPLAIN PLAN과 실제 커서 계획 비교',
    ex11Sql: `EXPLAIN PLAN
  SET STATEMENT_ID='TEST' FOR
  SELECT c.cust_city, SUM(s.quantity_sold)
  FROM   customers c, sales s, products p
  WHERE  c.cust_id=s.cust_id
  AND    p.prod_id=s.prod_id
  AND    prod_min_price>100
  GROUP BY c.cust_city;

BEGIN
  :v_rep := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => plan_table_object('SH', 'PLAN_TABLE', 'TEST', NULL),
    compare_plan_list => plan_object_list(cursor_cache_object('9mp7z6qq83k5y')),
    type              => 'TEXT',
    level             => 'TYPICAL',
    section           => 'ALL');
END;
/

PRINT v_rep`,
  },
  en: {
    title: 'Comparing Execution Plans',
    subtitle:
      'The plan comparison tool takes a reference plan and an arbitrary list of test plans and highlights the differences between them. The plan comparison is logical rather than line by line.',
    purposeTitle: 'Purpose of Plan Comparison',
    purposeDesc:
      'The plan comparison report identifies the source of differences, which helps users triage plan reproducibility issues.',
    purposeItems: [
      'You want to compare the current plan of a query whose performance is regressing with an old plan captured in AWR.',
      'A SQL plan baseline fails to reproduce the originally intended plan, and you want to determine the difference between the new plan and the intended plan.',
      'You want to determine how adding a hint, changing a parameter, or creating an index will affect a plan.',
      'You want to determine how a plan generated based on a SQL profile or by SQL Performance Analyzer differs from the original plan.',
    ],
    reportFormatTitle: 'Compare Plans Report Format',
    reportFormatDesc:
      'The report begins with a summary. The COMPARE PLANS REPORT section includes information such as the user who ran the report and the number of plans compared.',
    reportSample: `COMPARE PLANS REPORT
-------------------------------------------------------------------------
  Current user           : SH
  Total number of plans  : 2
  Number of findings     : 1
-------------------------------------------------------------------------

Comparison Results (1):
-----------------------------
 1. Query block SEL$1, Alias PRODUCTS@SEL$1: Some columns (OPERATION,
    OPTIONS, OBJECT_NAME) do not match between the reference
    plan (id: 2) and the current plan (id: 2).`,
    sourcesTitle: 'Plan Sources for PLAN_OBJECT_LIST (Table 6-3)',
    sourcesRows: [
      ['Plan Table', 'plan_table_object(owner, plan_table_name, statement_id, plan_id)', 'Plans stored in a plan table by EXPLAIN PLAN'],
      ['Cursor Cache', 'cursor_cache_object(sql_id, child_number)', 'Plans in the shared SQL area cursor cache'],
      ['AWR', 'awr_object(sql_id, dbid, con_dbid, plan_hash_value)', 'Historical plans stored in AWR'],
      ['SQL Tuning Set', 'sqlset_object(sqlset_owner, sqlset_name, sql_id, plan_hash_value)', 'Plans stored in a SQL tuning set'],
      ['SQL Plan Management', 'spm_object(sql_handle, plan_name)', 'Plans protected by SQL plan management baselines'],
      ['SQL Profile', 'sql_profile_object(profile_name)', 'Plans associated with a SQL profile'],
      ['Advisor', 'advisor_object(task_name, execution_name, sql_id, plan_id)', 'Plans from SQL Tuning Advisor tasks'],
    ],
    functionTitle: 'DBMS_XPLAN.COMPARE_PLANS Function',
    functionSql: `DBMS_XPLAN.COMPARE_PLANS(
    reference_plan        IN generic_plan_object,
    compare_plan_list     IN plan_object_list,
    type                  IN VARCHAR2 := 'TEXT',    -- TEXT, XML, HTML
    level                 IN VARCHAR2 := 'TYPICAL', -- BASIC, TYPICAL, ALL
    section               IN VARCHAR2 := 'ALL')     -- ALL, SUMMARY
RETURN CLOB;`,
    tutorialTitle: 'Comparing Execution Plans: Tutorial (Example 6-8 ~ 6-11)',
    tutorialDesc:
      'In this tutorial, you compare two distinct queries. The compare plans report shows that the optimizer was able to use a join elimination transformation in one query but not the other.',
    tutorialSql: `-- Two queries issued by user sh
SELECT count(*)
FROM   products p, sales s
WHERE  p.prod_id = s.prod_id
AND    p.prod_min_price > 200;

SELECT count(*)
FROM   products p, sales s
WHERE  p.prod_id = s.prod_id
AND    s.quantity_sold = 43;

-- Step 1: Find SQL IDs
SELECT SQL_ID, SQL_TEXT
FROM   V$SQL
WHERE  SQL_TEXT LIKE '%products%'
AND    SQL_TEXT NOT LIKE '%SQL_TEXT%'
ORDER BY SQL_ID;

-- Step 2: Run COMPARE_PLANS
VARIABLE v_rep CLOB

BEGIN
  :v_rep := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => cursor_cache_object('0hxmvnfkasg6q', NULL),
    compare_plan_list => plan_object_list(cursor_cache_object('10dqxjph6bwum', NULL)),
    type              => 'TEXT',
    level             => 'TYPICAL',
    section           => 'ALL');
END;
/

SELECT :v_rep REPORT FROM DUAL;`,
    tutorialOutput: `-- Comparison Results section reveals the difference:
-- Join Elimination occurred only in the reference plan!
Comparison Results (1):
-----------------------------
 1. Query block SEL$1: Transformation JOIN REMOVED FROM QUERY BLOCK occurred
    only in the reference plan (result query block: SEL$A43D1678).`,
    tutorialNote:
      'The first query (quantity_sold=43) had the join to products eliminated — only SALES was scanned. The second query (prod_min_price>200) needed to access products, so the join was retained.',
    ex8Title: 'Example 6-8: Comparing Plans from Child Cursors',
    ex8Sql: `VAR v_report CLOB;

BEGIN
  :v_report := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 2),
    compare_plan_list => PLAN_OBJECT_LIST(CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 4)));
END;
/

PRINT v_report`,
    ex9Title: 'Example 6-9: Comparing a Cursor Plan with a SQL Plan Baseline',
    ex9Sql: `VAR v_report CLOB;
BEGIN
  :v_report := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 2),
    compare_plan_list => PLAN_OBJECT_LIST(
      SPM_OBJECT('SQL_024d0f7d21351f5d', 'SQL_PLAN_sdfjkd')));
END;

PRINT v_report`,
    ex10Title: 'Example 6-10: Comparing a Plan with Plans from Multiple Sources',
    ex10Sql: `VAR v_report CLOB
BEGIN
  :v_report := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => CURSOR_CACHE_OBJECT('8mkxm7ur07za0', 2),
    compare_plan_list => plan_object_list(
         cursor_cache_object('8mkxm7ur07za0'),
         sqlset_object('SH', 'SQLT_WORKLOAD', '6vfqvad0rgyad'),
         awr_object('6vfqvad0rgyad', 5),
         spm_object('SQL_024d0f7d21351f5d', 'SQL_PLAN_sdfjkd')),
    type              => 'XML',
    level             => 'ALL',
    section           => 'SUMMARY');
END;
/

PRINT v_report`,
    ex11Title: 'Example 6-11: Comparing an Explained Plan with a Plan in a Cursor',
    ex11Sql: `EXPLAIN PLAN
  SET STATEMENT_ID='TEST' FOR
  SELECT c.cust_city, SUM(s.quantity_sold)
  FROM   customers c, sales s, products p
  WHERE  c.cust_id=s.cust_id
  AND    p.prod_id=s.prod_id
  AND    prod_min_price>100
  GROUP BY c.cust_city;

BEGIN
  :v_rep := DBMS_XPLAN.COMPARE_PLANS(
    reference_plan    => plan_table_object('SH', 'PLAN_TABLE', 'TEST', NULL),
    compare_plan_list => plan_object_list(cursor_cache_object('9mp7z6qq83k5y')),
    type              => 'TEXT',
    level             => 'TYPICAL',
    section           => 'ALL');
END;
/

PRINT v_rep`,
  },
}

export function CompareSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowsShuffle size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.purposeTitle}</SectionTitle>
      <Prose>{t.purposeDesc}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.purposeItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <Divider />

      <SectionTitle>{t.reportFormatTitle}</SectionTitle>
      <Prose>{t.reportFormatDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.reportSample} />
      </div>

      <Divider />

      <SectionTitle>{t.sourcesTitle}</SectionTitle>
      <Table
        headers={isKo ? ['계획 소스', '지정 방법', '설명'] : ['Plan Source', 'Specification', 'Description']}
        rows={t.sourcesRows}
      />

      <SectionTitle>{t.functionTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.functionSql} />
      </div>

      <Divider />

      <SectionTitle>{t.tutorialTitle}</SectionTitle>
      <Prose>{t.tutorialDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.tutorialSql} />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.tutorialOutput} />
      </div>
      <div className="mt-4">
        <InfoBox variant="tip">{t.tutorialNote}</InfoBox>
      </div>

      <Divider />

      <AccordionSection title={t.ex8Title}>
        <SqlBlock sql={t.ex8Sql} />
      </AccordionSection>

      <AccordionSection title={t.ex9Title}>
        <SqlBlock sql={t.ex9Sql} />
      </AccordionSection>

      <AccordionSection title={t.ex10Title}>
        <SqlBlock sql={t.ex10Sql} />
      </AccordionSection>

      <AccordionSection title={t.ex11Title}>
        <SqlBlock sql={t.ex11Sql} />
      </AccordionSection>
    </PageContainer>
  )
}
