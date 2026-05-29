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
    title: 'Subquery Unnesting',
    subtitle: '중첩된 서브쿼리를 동등한 조인 문장으로 변환해서 옵티마이저가 더 넓은 범위에서 실행 계획을 최적화할 수 있게 해요.',

    whatTitle: 'Subquery Unnesting이란?',
    whatDesc:
      'Subquery Unnesting은 중첩된 쿼리를 동등한 조인 문장으로 변환해요. 변환 후 옵티마이저는 조인 순서와 방법을 자유롭게 선택할 수 있어요.\n\n옵티마이저는 변환된 조인이 원본 문장과 동일한 결과를 반환하도록 보장될 때만 Unnesting을 수행해요.',

    benefitTitle: '왜 Unnesting이 필요할까요?',
    benefitDesc:
      'Unnesting 전: 서브쿼리는 독립된 쿼리 블록으로 처리돼요. 바깥 쿼리가 각 행을 처리할 때마다 서브쿼리가 반복 실행될 수 있어요. 옵티마이저는 두 쿼리 블록을 독립적으로 최적화하므로 전체를 아우르는 최적화가 제한돼요.\n\nUnnesting 후: 단일 조인으로 변환되므로 CBO가 조인 순서·방법·인덱스 선택을 자유롭게 최적화해요.',

    exampleTitle: '변환 예시 (공식 문서)',
    exampleDesc: '공식 문서의 예시예요. IN 서브쿼리가 조인으로 변환돼요.',
    beforeSql: `-- 변환 전: IN 서브쿼리
SELECT *
FROM   sales
WHERE  cust_id IN (SELECT cust_id FROM customers);`,
    afterSql: `-- 변환 후: 조인으로 Unnesting
SELECT sales.*
FROM   sales, customers
WHERE  sales.cust_id = customers.cust_id;`,

    typesTitle: 'Unnesting 대상 서브쿼리 유형',
    typesDesc: '다음 유형의 서브쿼리가 Unnesting 대상이에요.',
    typesSql: `-- 1. IN 서브쿼리
SELECT * FROM employees e
WHERE  e.department_id IN (
  SELECT d.department_id
  FROM   departments d
  WHERE  d.location_id = 1700
);

-- 2. EXISTS 서브쿼리
SELECT * FROM employees e
WHERE  EXISTS (
  SELECT 1
  FROM   departments d
  WHERE  d.department_id = e.department_id
  AND    d.location_id   = 1700
);

-- 3. NOT IN / NOT EXISTS 서브쿼리
SELECT * FROM employees e
WHERE  e.department_id NOT IN (
  SELECT d.department_id
  FROM   departments d
  WHERE  d.location_id = 1700
);`,
    typesNote:
      'NOT IN과 NOT EXISTS는 NULL 처리 방식이 다르므로 Unnesting 시 주의가 필요해요. NOT IN은 서브쿼리 결과에 NULL이 있으면 아무 행도 반환하지 않아요. 옵티마이저는 이 의미를 보존하는 방식으로만 Unnesting을 수행해요.',

    correlatedTitle: '상관 서브쿼리 (Correlated Subquery)',
    correlatedDesc:
      '상관 서브쿼리는 바깥 쿼리의 컬럼을 참조하는 서브쿼리예요. 이론적으로는 바깥 쿼리의 각 행마다 서브쿼리가 실행돼요.\n\nUnnesting이 적용되면 상관 관계도 조인 조건으로 변환돼요.',
    correlatedSql: `-- 변환 전: 상관 서브쿼리
SELECT e.last_name, e.salary
FROM   employees e
WHERE  e.salary > (
  SELECT AVG(e2.salary)
  FROM   employees e2
  WHERE  e2.department_id = e.department_id  -- 바깥 쿼리 참조
);

-- Unnesting 후 (세미조인 또는 조인으로 변환)
SELECT e.last_name, e.salary
FROM   employees e
JOIN  (SELECT department_id, AVG(salary) avg_sal
       FROM   employees
       GROUP BY department_id) dept_avg
  ON  e.department_id = dept_avg.department_id
WHERE e.salary > dept_avg.avg_sal;`,

    planTitle: '실행 계획에서 확인하는 방법',
    planDesc:
      'Unnesting이 적용되면 실행 계획에서 서브쿼리 블록이 사라지고 조인 오퍼레이션이 나타나요. 변환된 서브쿼리의 쿼리 블록 이름에 VW_SQ_ 접두사가 붙어 있어요.',
    planCaption: 'EXPLAIN PLAN — Subquery Unnesting 적용 후 (IN 서브쿼리 → 조인)',

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Unnesting 강제
SELECT /*+ UNNEST */ *
FROM   sales
WHERE  cust_id IN (SELECT cust_id FROM customers);

-- Unnesting 방지
SELECT /*+ NO_UNNEST */ *
FROM   sales
WHERE  cust_id IN (SELECT cust_id FROM customers);`,

    summaryTitle: 'Subquery Unnesting 핵심 정리',
    summaryItems: [
      '중첩 서브쿼리를 조인으로 변환해서 CBO가 전체적으로 최적화할 수 있게 해요.',
      '결과가 동일하다고 보장될 때만 변환을 수행해요.',
      'IN, EXISTS, NOT IN, NOT EXISTS 서브쿼리가 대상이에요.',
      '변환된 쿼리 블록 이름에 VW_SQ_ 접두사가 붙어요.',
      '힌트: UNNEST (강제), NO_UNNEST (방지).',
    ],
  },
  en: {
    title: 'Subquery Unnesting',
    subtitle: 'Transforms nested queries into equivalent join statements so the optimizer can optimize the entire query as one unit.',

    whatTitle: 'What is Subquery Unnesting?',
    whatDesc:
      'Subquery Unnesting transforms nested queries into equivalent join statements. After the transformation, the CBO can freely choose join order and method across all tables.\n\nThe optimizer performs Unnesting only when the resulting join is guaranteed to return the same rows as the original statement.',

    benefitTitle: 'Why Unnesting?',
    benefitDesc:
      "Before Unnesting: the subquery is treated as an isolated query block. For correlated subqueries, it may be re-executed for each outer row. The optimizer optimizes each block independently, limiting cross-block optimization.\n\nAfter Unnesting: a single join is produced, giving the CBO full freedom to choose join order, join method, and index selection across all tables.",

    exampleTitle: 'Transformation Example (Oracle Docs)',
    exampleDesc: 'This Oracle documentation example shows an IN subquery being unnested into a join.',
    beforeSql: `-- Before: IN subquery
SELECT *
FROM   sales
WHERE  cust_id IN (SELECT cust_id FROM customers);`,
    afterSql: `-- After: Unnested to JOIN
SELECT sales.*
FROM   sales, customers
WHERE  sales.cust_id = customers.cust_id;`,

    typesTitle: 'Subquery Types Eligible for Unnesting',
    typesDesc: 'The following subquery types are candidates for Unnesting.',
    typesSql: `-- 1. IN subquery
SELECT * FROM employees e
WHERE  e.department_id IN (
  SELECT d.department_id
  FROM   departments d
  WHERE  d.location_id = 1700
);

-- 2. EXISTS subquery
SELECT * FROM employees e
WHERE  EXISTS (
  SELECT 1
  FROM   departments d
  WHERE  d.department_id = e.department_id
  AND    d.location_id   = 1700
);

-- 3. NOT IN / NOT EXISTS subquery
SELECT * FROM employees e
WHERE  e.department_id NOT IN (
  SELECT d.department_id
  FROM   departments d
  WHERE  d.location_id = 1700
);`,
    typesNote:
      'NOT IN and NOT EXISTS handle NULLs differently. NOT IN returns no rows if the subquery result contains a NULL. The optimizer preserves this behavior and unnests only when it can guarantee the same NULL semantics.',

    correlatedTitle: 'Correlated Subqueries',
    correlatedDesc:
      "A correlated subquery references a column from the outer query. In theory, it runs once per outer row.\n\nWhen Unnesting is applied, the correlation becomes a join condition.",
    correlatedSql: `-- Before: correlated subquery
SELECT e.last_name, e.salary
FROM   employees e
WHERE  e.salary > (
  SELECT AVG(e2.salary)
  FROM   employees e2
  WHERE  e2.department_id = e.department_id  -- references outer query
);

-- After Unnesting (converted to semi-join or join)
SELECT e.last_name, e.salary
FROM   employees e
JOIN  (SELECT department_id, AVG(salary) avg_sal
       FROM   employees
       GROUP BY department_id) dept_avg
  ON  e.department_id = dept_avg.department_id
WHERE e.salary > dept_avg.avg_sal;`,

    planTitle: 'Verifying in the Execution Plan',
    planDesc:
      'When Unnesting is applied, the subquery block disappears from the plan and join operations appear in its place. Query block names derived from unnested subqueries carry the VW_SQ_ prefix.',
    planCaption: 'EXPLAIN PLAN — after Subquery Unnesting (IN subquery → join)',

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Unnesting
SELECT /*+ UNNEST */ *
FROM   sales
WHERE  cust_id IN (SELECT cust_id FROM customers);

-- Suppress Unnesting
SELECT /*+ NO_UNNEST */ *
FROM   sales
WHERE  cust_id IN (SELECT cust_id FROM customers);`,

    summaryTitle: 'Subquery Unnesting Key Takeaways',
    summaryItems: [
      'Converts nested subqueries into joins so the CBO can optimize holistically.',
      'Applied only when the resulting join is guaranteed to return identical rows.',
      'Targets IN, EXISTS, NOT IN, and NOT EXISTS subqueries.',
      'Unnested query blocks are named with the VW_SQ_ prefix.',
      'Hints: UNNEST (force), NO_UNNEST (suppress).',
    ],
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 319, cost: 9, time: '00:00:01',
    note: 'Unnesting 후 서브쿼리가 사라지고 단일 SELECT로 처리돼요.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', name: undefined, rows: 319, cost: 9, time: '00:00:01',
    note: '서브쿼리가 Hash Join으로 변환됐어요. VW_SQ_1이 customers의 unnested 결과예요.' },
  { id: 2, depth: 2, operation: 'VIEW', name: 'VW_SQ_1', rows: 319, cost: 3, time: '00:00:01',
    note: 'VW_SQ_ 접두사: Subquery Unnesting으로 생성된 인라인 뷰예요. 서브쿼리가 이 뷰로 변환됐어요.' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS FULL', name: 'CUSTOMERS', rows: 319, cost: 3, time: '00:00:01' },
  { id: 4, depth: 2, operation: 'TABLE ACCESS FULL', name: 'SALES', rows: 918843, cost: 6, time: '00:00:01' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 319, cost: 9, time: '00:00:01',
    note: 'After Unnesting, the subquery disappears and the query is processed as a single SELECT.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', name: undefined, rows: 319, cost: 9, time: '00:00:01',
    note: 'The subquery has been converted into a Hash Join. VW_SQ_1 holds the unnested customers subquery result.' },
  { id: 2, depth: 2, operation: 'VIEW', name: 'VW_SQ_1', rows: 319, cost: 3, time: '00:00:01',
    note: 'VW_SQ_ prefix: an inline view generated by Subquery Unnesting. The original subquery is now this view.' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS FULL', name: 'CUSTOMERS', rows: 319, cost: 3, time: '00:00:01' },
  { id: 4, depth: 2, operation: 'TABLE ACCESS FULL', name: 'SALES', rows: 918843, cost: 6, time: '00:00:01' },
]

export function QtSubqueryUnnestingSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const planRows = lang === 'ko' ? PLAN_ROWS_KO : PLAN_ROWS_EN

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
      <Prose>{t.exampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.beforeSql} badge={lang === 'ko' ? '변환 전' : 'Before'} badgeColor="rose" />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.afterSql} badge={lang === 'ko' ? '변환 후' : 'After'} badgeColor="emerald" />
      </div>

      <Divider />

      <SectionTitle>{t.typesTitle}</SectionTitle>
      <Prose>{t.typesDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.typesSql} />
      </div>
      <InfoBox variant="warning">{t.typesNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.correlatedTitle}</SectionTitle>
      <Prose>{t.correlatedDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.correlatedSql} />
      </div>

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <ExplainPlanTable rows={planRows} caption={t.planCaption} lang={lang} />

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
