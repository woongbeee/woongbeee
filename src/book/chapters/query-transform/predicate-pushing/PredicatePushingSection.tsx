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
    title: 'Predicate Pushing',
    subtitle: '뷰를 Merge할 수 없을 때, 외부 WHERE 조건을 뷰 내부로 밀어 넣어 처리 행 수를 줄이고 인덱스를 활용하게 해요.',

    whatTitle: 'Predicate Pushing이란?',
    whatDesc:
      'Predicate Pushing은 바깥 쿼리 블록의 조건(predicate)을 병합되지 않은 뷰 쿼리 블록 안으로 밀어 넣는 변환이에요.\n\nView Merging이 불가능한 뷰라도 Predicate Pushing을 통해 뷰 내부에서 더 일찍 행을 필터링할 수 있어요. 결과적으로 뷰가 반환하는 행 수가 줄어들어 성능이 향상돼요.',

    vsTitle: 'View Merging과 Predicate Pushing의 차이',
    vsDesc:
      'View Merging은 뷰 자체를 없애고 테이블을 바깥 쿼리와 합치는 변환이에요. Predicate Pushing은 뷰를 그대로 유지하면서 조건만 안으로 밀어 넣는 변환이에요.\n\nUNION 뷰처럼 뷰를 Merge할 수 없는 경우에 Predicate Pushing이 특히 유용해요.',

    exampleTitle: '변환 예시 (공식 문서 — UNION 뷰)',
    exampleDesc: '공식 문서 예시예요. UNION 뷰는 Merge할 수 없지만, 외부의 department_id = 50 조건을 뷰 안의 각 브랜치로 밀어 넣을 수 있어요.',
    beforeSql: `-- 변환 전: 외부 조건이 뷰 밖에 있음
SELECT last_name
FROM   all_employees_vw
WHERE  department_id = 50;

-- all_employees_vw 정의 (UNION — Merge 불가)
CREATE OR REPLACE VIEW all_employees_vw AS
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   employees
  UNION
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   contract_workers;`,
    afterSql: `-- 변환 후: Predicate Pushed
SELECT last_name
FROM (
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   employees
  WHERE  department_id = 50  -- 조건이 뷰 안으로 이동
  UNION
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   contract_workers
  WHERE  department_id = 50  -- 양쪽 브랜치 모두에 적용
);`,
    exampleNote:
      'Pushing 전: 뷰가 employees와 contract_workers 전체를 UNION한 뒤 결과에서 department_id=50 필터링.\nPushing 후: 각 테이블에서 department_id=50인 행만 읽은 뒤 UNION — 읽는 행 수 대폭 감소.',
    planCaption: 'EXPLAIN PLAN — Predicate Pushing 적용 후 (UNION 뷰 내부에 조건 이동)',

    transitiveTitle: 'Transitive Closure',
    transitiveDesc:
      'Transitive Closure(이행적 폐포)는 조인 조건에서 논리적으로 유도 가능한 새 조건을 자동으로 추가하는 변환이에요.\n\nA = B AND B = 상수값이면 A = 상수값도 성립해요. 이 새 조건을 추가하면 두 테이블 모두에서 인덱스를 사용할 수 있는 기회가 생겨요.',
    transitiveExample:
      '예시: e.department_id = d.department_id AND d.department_id = 90\n→ Oracle이 자동으로 e.department_id = 90 추가\n→ employees.department_id 인덱스도 사용 가능해짐',
    transitiveSql: `-- 원본 쿼리
SELECT e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id
AND    d.department_id = 90;

-- Transitive Closure 적용 후 (옵티마이저 내부)
SELECT e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id
AND    d.department_id = 90
AND    e.department_id = 90;  -- 자동 추가
-- → employees.department_id 인덱스 사용 가능`,

    pushBlockedTitle: 'Predicate Pushing이 제한되는 경우',
    pushBlockedDesc:
      'Predicate Pushing은 뷰를 Merge할 수 없을 때 적용돼요. 단, 다음 경우에는 적용되지 않아요.',
    pushBlockedItems: [
      'ROWNUM을 포함한 뷰 — 조건을 밀어 넣으면 행 번호가 바뀔 수 있어요.',
      'GROUP BY 뷰에서 GROUP BY 컬럼이 아닌 컬럼에 대한 외부 조건 — 집계 후 필터이므로 안으로 밀어 넣을 수 없어요.',
      '집계 함수 결과에 대한 조건 (예: SUM(salary) > 50000) — 집계 전에는 평가할 수 없어요.',
    ],

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Predicate Pushing 강제
SELECT /*+ PUSH_PRED(v) */ e.last_name, v.department_name
FROM   employees e,
       (SELECT department_id, department_name
        FROM   departments
        WHERE  location_id = 1700) v
WHERE  e.department_id = v.department_id;

-- Predicate Pushing 방지
SELECT /*+ NO_PUSH_PRED(v) */ e.last_name, v.department_name
FROM   employees e,
       (SELECT department_id, department_name
        FROM   departments
        WHERE  location_id = 1700) v
WHERE  e.department_id = v.department_id;`,

    summaryTitle: 'Predicate Pushing 핵심 정리',
    summaryItems: [
      'View Merging이 불가능한 뷰에서 외부 WHERE 조건을 뷰 내부로 이동시켜 처리 행 수를 줄여요.',
      'UNION 뷰에서 특히 효과적 — 각 브랜치에 조건이 적용돼요.',
      'Transitive Closure: 조인 조건에서 새 조건을 자동으로 유도해서 인덱스 활용 기회를 늘려요.',
      '힌트: PUSH_PRED(뷰별칭) (강제), NO_PUSH_PRED(뷰별칭) (방지).',
    ],
  },
  en: {
    title: 'Predicate Pushing',
    subtitle: "When view merging is not possible, pushes outer WHERE conditions into the view's query block to reduce the rows processed and enable index access.",

    whatTitle: 'What is Predicate Pushing?',
    whatDesc:
      "Predicate Pushing moves predicates from the containing query block into an unmerged view's query block.\n\nEven when View Merging is not possible, Predicate Pushing lets the view filter rows earlier — before returning them to the outer query. This reduces the row count the view passes upward and often enables index access inside the view.",

    vsTitle: 'View Merging vs Predicate Pushing',
    vsDesc:
      "View Merging eliminates the view entirely by merging its tables into the outer query. Predicate Pushing keeps the view intact but moves conditions inside it.\n\nPredicate Pushing is especially useful for views that cannot be merged — such as UNION views.",

    exampleTitle: 'Transformation Example (Oracle Docs — UNION View)',
    exampleDesc: 'This Oracle documentation example shows a UNION view that cannot be merged. The outer predicate department_id = 50 is pushed into each branch of the UNION.',
    beforeSql: `-- Before: outer predicate sits outside the view
SELECT last_name
FROM   all_employees_vw
WHERE  department_id = 50;

-- all_employees_vw definition (UNION — cannot be merged)
CREATE OR REPLACE VIEW all_employees_vw AS
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   employees
  UNION
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   contract_workers;`,
    afterSql: `-- After: Predicate Pushed into each UNION branch
SELECT last_name
FROM (
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   employees
  WHERE  department_id = 50  -- predicate pushed here
  UNION
  SELECT employee_id, last_name, job_id, commission_pct, department_id
  FROM   contract_workers
  WHERE  department_id = 50  -- and here
);`,
    exampleNote:
      'Before pushing: the view reads all rows from both tables, UNIONs them, then filters by department_id=50.\nAfter pushing: each table reads only department_id=50 rows before UNIONing — dramatically fewer rows processed.',
    planCaption: 'EXPLAIN PLAN — after Predicate Pushing (predicate moved inside UNION view)',

    transitiveTitle: 'Transitive Closure',
    transitiveDesc:
      'Transitive Closure automatically derives new predicates from existing join conditions.\n\nIf A = B AND B = constant, then A = constant is also true. Adding this derived predicate gives the optimizer an opportunity to use an index on A as well.',
    transitiveExample:
      'Example: e.department_id = d.department_id AND d.department_id = 90\n→ Oracle automatically adds e.department_id = 90\n→ An index on employees.department_id can now be used',
    transitiveSql: `-- Original query
SELECT e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id
AND    d.department_id = 90;

-- After Transitive Closure (internal optimizer rewrite)
SELECT e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id
AND    d.department_id = 90
AND    e.department_id = 90;  -- automatically added
-- → employees.department_id index is now usable`,

    pushBlockedTitle: 'When Predicate Pushing Is Restricted',
    pushBlockedDesc:
      'Predicate Pushing applies when View Merging is not possible. However, it is also restricted in the following cases.',
    pushBlockedItems: [
      'Views containing ROWNUM — pushing a predicate inside would alter row numbering.',
      'Outer predicates on non-GROUP-BY columns of a GROUP BY view — such conditions can only be evaluated after aggregation.',
      'Predicates on aggregate results (e.g., SUM(salary) > 50000) — cannot be evaluated before the aggregation completes.',
    ],

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Predicate Pushing
SELECT /*+ PUSH_PRED(v) */ e.last_name, v.department_name
FROM   employees e,
       (SELECT department_id, department_name
        FROM   departments
        WHERE  location_id = 1700) v
WHERE  e.department_id = v.department_id;

-- Suppress Predicate Pushing
SELECT /*+ NO_PUSH_PRED(v) */ e.last_name, v.department_name
FROM   employees e,
       (SELECT department_id, department_name
        FROM   departments
        WHERE  location_id = 1700) v
WHERE  e.department_id = v.department_id;`,

    summaryTitle: 'Predicate Pushing Key Takeaways',
    summaryItems: [
      'Moves outer WHERE predicates into unmerged views, reducing rows the view must process.',
      'Especially effective for UNION views — the predicate is applied in each branch.',
      'Transitive Closure: automatically derives new predicates from join conditions to expose more index opportunities.',
      'Hints: PUSH_PRED(alias) (force), NO_PUSH_PRED(alias) (suppress).',
    ],
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 5, cost: 4, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'VIEW', name: 'ALL_EMPLOYEES_VW', rows: 5, cost: 4, time: '00:00:01',
    note: '뷰는 Merge되지 않고 VIEW 노드로 남아 있어요. 하지만 내부에서 조건이 적용돼요.' },
  { id: 2, depth: 2, operation: 'UNION-ALL', rows: undefined, cost: undefined, time: undefined,
    note: 'UNION 뷰는 Merge 불가 — 대신 각 브랜치 내부로 department_id=50 조건이 Push됐어요.' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 5, cost: 2, time: '00:00:01' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 5, cost: 1, time: '00:00:01',
    note: 'department_id=50 조건이 뷰 안으로 Push돼서 인덱스를 사용할 수 있게 됐어요.' },
  { id: 5, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'CONTRACT_WORKERS', rows: 0, cost: 2, time: '00:00:01' },
  { id: 6, depth: 4, operation: 'INDEX RANGE SCAN', name: 'CW_DEPT_IX', rows: 0, cost: 1, time: '00:00:01',
    note: '두 번째 브랜치에도 동일한 조건이 Push돼서 인덱스를 사용해요.' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 5, cost: 4, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'VIEW', name: 'ALL_EMPLOYEES_VW', rows: 5, cost: 4, time: '00:00:01',
    note: 'The view is not merged — it remains as a VIEW node. But the predicate has been pushed inside.' },
  { id: 2, depth: 2, operation: 'UNION-ALL', rows: undefined, cost: undefined, time: undefined,
    note: 'UNION view cannot be merged — instead, department_id=50 has been pushed into each branch.' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 5, cost: 2, time: '00:00:01' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 5, cost: 1, time: '00:00:01',
    note: 'The department_id=50 predicate was pushed inside the view, enabling index access.' },
  { id: 5, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'CONTRACT_WORKERS', rows: 0, cost: 2, time: '00:00:01' },
  { id: 6, depth: 4, operation: 'INDEX RANGE SCAN', name: 'CW_DEPT_IX', rows: 0, cost: 1, time: '00:00:01',
    note: 'The same predicate is pushed into the second branch, also using an index.' },
]

export function QtPredicatePushingSection() {
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

      <SectionTitle>{t.vsTitle}</SectionTitle>
      <Prose>{t.vsDesc}</Prose>

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
      <ExplainPlanTable rows={planRows} caption={t.planCaption} lang={lang} />

      <Divider />

      <SectionTitle>{t.transitiveTitle}</SectionTitle>
      <Prose>{t.transitiveDesc}</Prose>
      <InfoBox variant="tip">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{t.transitiveExample}</pre>
      </InfoBox>
      <div className="mt-4">
        <SqlBlock sql={t.transitiveSql} />
      </div>

      <Divider />

      <SectionTitle>{t.pushBlockedTitle}</SectionTitle>
      <Prose>{t.pushBlockedDesc}</Prose>
      <div className="mt-4 space-y-2">
        {t.pushBlockedItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red/10 font-mono text-[10px] font-bold text-red">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink-2">{item}</p>
          </div>
        ))}
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
