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
} from '../../shared'
import { ExplainPlanTable } from '../../optimizer/shared/diagrams'
import type { PlanRow } from '../../optimizer/shared/diagrams'

const T = {
  ko: {
    title: 'OR Expansion',
    subtitle: '최상위 OR 조건이 있는 쿼리를 UNION ALL 브랜치로 분리해서 각 브랜치마다 더 효율적인 액세스 경로를 사용할 수 있게 해요.',

    whatTitle: 'OR Expansion이란?',
    whatDesc:
      'OR Expansion은 쿼리 블록의 최상위 OR 조건(disjunction)을 여러 개의 UNION ALL 브랜치로 분리하는 변환이에요. 각 브랜치는 OR의 한 조건만 담당하므로, 브랜치별로 서로 다른 인덱스를 사용할 수 있어요.\n\nOracle 12.2부터는 예전의 CONCATENATION 오퍼레이션 대신 UNION-ALL 오퍼레이터를 사용해요.',

    whyTitle: '왜 OR Expansion이 필요할까요?',
    whyDesc:
      'OR 조건이 여러 컬럼에 걸쳐 있으면 인덱스를 효과적으로 사용하기 어려워요. 예를 들어 WHERE e.email=\'SSTILES\' OR d.department_name=\'Treasury\' 조건에서 email 인덱스와 department_name 인덱스를 동시에 활용하는 것은 불가능해요.\n\nOR Expansion은 이 쿼리를 두 개의 브랜치로 나눠서, 첫 번째 브랜치는 email 인덱스를, 두 번째 브랜치는 department_name 인덱스를 각각 사용할 수 있게 해요.',

    exampleTitle: '변환 예시 (공식 문서)',
    exampleDesc: '공식 문서의 예시예요. email과 department_name 두 조건이 OR로 연결된 쿼리가 UNION ALL로 분리돼요.',
    beforeSql: `-- 변환 전: OR 조건
SELECT *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;`,
    afterSql: `-- 변환 후: UNION ALL로 OR Expansion
SELECT *
FROM   employees e, departments d
WHERE  e.email = 'SSTILES'
AND    e.department_id = d.department_id
UNION ALL
SELECT *
FROM   employees e, departments d
WHERE  d.department_name = 'Treasury'
AND    e.department_id = d.department_id;`,
    exampleNote:
      '첫 번째 브랜치: employees.email 인덱스 사용 가능\n두 번째 브랜치: departments.department_name 인덱스 사용 가능\n\nOR Expansion 전에는 어느 인덱스도 효율적으로 사용할 수 없었어요.',

    planTitle: '실행 계획에서 확인하는 방법',
    planDesc:
      'OR Expansion이 적용되면 실행 계획에 UNION-ALL 오퍼레이션이 나타나고, 각 브랜치에서 인덱스 스캔 오퍼레이션이 보여요. Note 섹션에는 "or expansion" 변환이 적용됐다는 내용이 나올 수 있어요.',
    planCaption: 'EXPLAIN PLAN — OR Expansion 적용 후',
    planSql: `EXPLAIN PLAN FOR
  SELECT *
  FROM   employees e, departments d
  WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
  AND    e.department_id = d.department_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'BASIC'));`,

    hintTitle: '힌트로 제어하기',
    hintDesc:
      'OR Expansion은 비용 기반으로 결정돼요. 옵티마이저가 변환하지 않을 때 강제하려면 USE_CONCAT 힌트를, 변환을 방지하려면 NO_EXPAND 힌트를 사용해요.',
    hintSql: `-- OR Expansion 강제 적용
SELECT /*+ USE_CONCAT */ *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;

-- OR Expansion 방지
SELECT /*+ NO_EXPAND */ *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;`,

    summaryTitle: 'OR Expansion 핵심 정리',
    summaryItems: [
      'OR 조건이 있는 쿼리를 UNION ALL로 분리해서 각 브랜치마다 인덱스 활용 기회를 줘요.',
      '비용 기반 결정 — 옵티마이저가 변환 전후 비용을 비교해서 더 낮은 쪽을 선택해요.',
      'Oracle 12.2+: CONCATENATION 대신 UNION-ALL 오퍼레이터 사용.',
      '힌트: USE_CONCAT (강제), NO_EXPAND (방지).',
    ],
  },
  en: {
    title: 'OR Expansion',
    subtitle: 'Splits queries with top-level OR conditions into UNION ALL branches so each branch can use its own efficient access path.',

    whatTitle: 'What is OR Expansion?',
    whatDesc:
      'OR Expansion transforms a query block that contains a top-level disjunction (OR condition) into a UNION ALL query with multiple branches. Each branch handles one disjunct, allowing the optimizer to choose a different access path per branch.\n\nStarting in Oracle 12.2, Oracle uses the UNION-ALL operator instead of the older CONCATENATION operation.',

    whyTitle: 'Why OR Expansion?',
    whyDesc:
      "When an OR condition spans multiple columns, it is difficult to use any single index efficiently. For example, WHERE e.email='SSTILES' OR d.department_name='Treasury' cannot simultaneously use both the email index and the department_name index.\n\nOR Expansion splits the query into two branches — the first can use the email index and the second can use the department_name index — so both indexes are put to work.",

    exampleTitle: 'Transformation Example (Oracle Docs)',
    exampleDesc: 'This example from the Oracle documentation shows a query with OR conditions being expanded into UNION ALL branches.',
    beforeSql: `-- Before: OR condition
SELECT *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;`,
    afterSql: `-- After: OR Expansion to UNION ALL
SELECT *
FROM   employees e, departments d
WHERE  e.email = 'SSTILES'
AND    e.department_id = d.department_id
UNION ALL
SELECT *
FROM   employees e, departments d
WHERE  d.department_name = 'Treasury'
AND    e.department_id = d.department_id;`,
    exampleNote:
      'First branch: can use the employees.email index\nSecond branch: can use the departments.department_name index\n\nBefore OR Expansion, neither index could be used efficiently.',

    planTitle: 'Verifying in the Execution Plan',
    planDesc:
      'When OR Expansion is applied, the execution plan shows a UNION-ALL operation with index scan operations in each branch. The Note section may indicate that "or expansion" was applied.',
    planCaption: 'EXPLAIN PLAN — after OR Expansion',
    planSql: `EXPLAIN PLAN FOR
  SELECT *
  FROM   employees e, departments d
  WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
  AND    e.department_id = d.department_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'BASIC'));`,

    hintTitle: 'Controlling with Hints',
    hintDesc:
      'OR Expansion is a cost-based decision. Use the USE_CONCAT hint to force the transformation, or NO_EXPAND to suppress it.',
    hintSql: `-- Force OR Expansion
SELECT /*+ USE_CONCAT */ *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;

-- Suppress OR Expansion
SELECT /*+ NO_EXPAND */ *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;`,

    summaryTitle: 'OR Expansion Key Takeaways',
    summaryItems: [
      'Splits OR conditions into UNION ALL branches, giving each branch its own index access opportunity.',
      'Cost-based decision — the optimizer compares costs before and after transformation.',
      'Oracle 12.2+: uses UNION-ALL operator instead of CONCATENATION.',
      'Hints: USE_CONCAT (force), NO_EXPAND (suppress).',
    ],
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 2, cost: 8, time: '00:00:01',
    note: 'UNION-ALL의 두 브랜치 결과를 합쳐 최종 반환해요.' },
  { id: 1, depth: 1, operation: 'UNION-ALL', rows: undefined, cost: undefined, time: undefined,
    note: 'OR Expansion으로 생성된 두 브랜치예요. 각 브랜치가 독립적으로 실행돼요.' },
  { id: 2, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 4, time: '00:00:01' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_EMAIL_UK', rows: 1, cost: 1, time: '00:00:01',
    note: '첫 번째 브랜치: email = \'SSTILES\' 조건으로 인덱스를 사용해요.' },
  { id: 5, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 2, time: '00:00:01' },
  { id: 6, depth: 4, operation: 'INDEX UNIQUE SCAN', name: 'DEPT_ID_PK', rows: 1, cost: 1, time: '00:00:01' },
  { id: 7, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 4, time: '00:00:01' },
  { id: 8, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 2, time: '00:00:01' },
  { id: 9, depth: 4, operation: 'INDEX RANGE SCAN', name: 'DEPT_NAME_IX', rows: 1, cost: 1, time: '00:00:01',
    note: '두 번째 브랜치: department_name = \'Treasury\' 조건으로 별도 인덱스를 사용해요.' },
  { id: 10, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01' },
  { id: 11, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 1, cost: 1, time: '00:00:01' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 2, cost: 8, time: '00:00:01',
    note: 'Merges results from both UNION-ALL branches and returns the final row set.' },
  { id: 1, depth: 1, operation: 'UNION-ALL', rows: undefined, cost: undefined, time: undefined,
    note: 'The two branches produced by OR Expansion. Each branch executes independently.' },
  { id: 2, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 4, time: '00:00:01' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_EMAIL_UK', rows: 1, cost: 1, time: '00:00:01',
    note: "First branch: uses the email index for the email = 'SSTILES' predicate." },
  { id: 5, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 2, time: '00:00:01' },
  { id: 6, depth: 4, operation: 'INDEX UNIQUE SCAN', name: 'DEPT_ID_PK', rows: 1, cost: 1, time: '00:00:01' },
  { id: 7, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 4, time: '00:00:01' },
  { id: 8, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 2, time: '00:00:01' },
  { id: 9, depth: 4, operation: 'INDEX RANGE SCAN', name: 'DEPT_NAME_IX', rows: 1, cost: 1, time: '00:00:01',
    note: "Second branch: uses a separate department_name index for the department_name = 'Treasury' predicate." },
  { id: 10, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01' },
  { id: 11, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 1, cost: 1, time: '00:00:01' },
]

export function QtOrExpansionSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const planRows = lang === 'ko' ? PLAN_ROWS_KO : PLAN_ROWS_EN

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconTransform size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.whyTitle}</SectionTitle>
      <Prose>{t.whyDesc}</Prose>

      <Divider />

      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <Prose>{t.exampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.beforeSql} badge={lang === 'ko' ? '변환 전' : 'Before'} badgeColor="rose" />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.afterSql} badge={lang === 'ko' ? '변환 후' : 'After'} badgeColor="emerald" />
      </div>
      <InfoBox variant="note">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{t.exampleNote}</pre>
      </InfoBox>

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <ExplainPlanTable rows={planRows} caption={t.planCaption} lang={lang} />
      <div className="mt-4">
        <SqlBlock sql={t.planSql} />
      </div>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintDesc}</Prose>
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
