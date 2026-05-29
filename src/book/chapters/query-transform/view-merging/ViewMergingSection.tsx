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
import { ExplainPlanTable } from '../../optimizer/shared/diagrams'
import type { PlanRow } from '../../optimizer/shared/diagrams'

const T = {
  ko: {
    title: 'View Merging',
    subtitle: '뷰를 나타내는 쿼리 블록을 바깥 쿼리 블록에 합쳐서, 더 넓은 범위의 조인 순서 최적화와 액세스 경로 선택이 가능하게 해요.',

    whatTitle: 'View Merging이란?',
    whatDesc:
      'View Merging은 뷰를 나타내는 쿼리 블록을 바깥 쿼리 블록(containing query block)에 병합하는 변환이에요. 병합이 이루어지면 뷰가 독립된 쿼리 블록으로 처리되지 않아서, 옵티마이저가 전체 쿼리를 하나의 조인으로 최적화할 수 있어요.\n\nView Merging의 주요 이점:\n• 더 많은 조인 순서를 탐색할 수 있어요\n• 다양한 액세스 방법을 선택할 수 있어요\n• Table Elimination 등 추가 변환이 가능해져요',

    simpleTitle: 'Simple View Merging',
    simpleDesc:
      'Simple View Merging은 SELECT-PROJECT-JOIN 뷰, 즉 GROUP BY, DISTINCT, 외부 조인, MODEL, CONNECT BY, 집합 연산자, 집계 함수가 없는 뷰에 적용해요.',
    simpleExampleDesc: '공식 문서 예시예요. 인라인 뷰 dept_locs_v가 바깥 쿼리와 병합돼요.',
    simpleBefore: `-- 변환 전: 인라인 뷰
SELECT e.first_name, e.last_name,
       dept_locs_v.street_address, dept_locs_v.postal_code
FROM   employees e,
       (SELECT d.department_id, d.department_name,
               l.street_address, l.postal_code
        FROM   departments d, locations l
        WHERE  d.location_id = l.location_id) dept_locs_v
WHERE  dept_locs_v.department_id = e.department_id
AND    e.last_name = 'Smith';`,
    simpleAfter: `-- 변환 후: View Merged
SELECT e.first_name, e.last_name,
       l.street_address, l.postal_code
FROM   employees e, departments d, locations l
WHERE  d.location_id = l.location_id
AND    d.department_id = e.department_id
AND    e.last_name = 'Smith';`,
    simpleNote:
      '병합 전: 옵티마이저가 dept_locs_v를 먼저 실행한 후 결과를 employees와 조인해야 해요.\n병합 후: employees, departments, locations 세 테이블을 자유로운 순서로 조인할 수 있어요.',
    planCaption: 'EXPLAIN PLAN — View Merging 적용 후 (뷰 없이 3-테이블 조인)',

    complexTitle: 'Complex View Merging',
    complexDesc:
      'Complex View Merging은 GROUP BY나 DISTINCT가 있는 뷰에 적용해요. 비용 기반으로 결정되며, 병합 시 GROUP BY나 DISTINCT 연산을 조인 후로 미뤄서 처리 행 수를 줄일 수 있어요.',
    complexNote:
      'Complex View Merging은 모든 경우에 적용되지 않아요. 옵티마이저가 비용을 비교해서 병합이 유리할 때만 적용해요.',

    restrictTitle: '뷰 Merging이 제한되는 경우',
    restrictDesc: '다음 요소가 뷰에 포함되어 있으면 Simple View Merging이 적용되지 않아요.',
    restrictTable: [
      ['GROUP BY', '집계 연산이 있으면 병합 후 결과가 달라질 수 있어요'],
      ['DISTINCT', '중복 제거 연산이 있으면 병합 후 결과가 달라질 수 있어요'],
      ['ROWNUM', '행 번호 필터는 병합 후 순서가 바뀔 수 있어요'],
      ['외부 조인 (Outer Join)', '뷰 내부의 외부 조인은 병합 시 의미가 달라질 수 있어요'],
      ['MODEL / CONNECT BY', '계층 쿼리·모델 절은 독립 블록으로 처리해야 해요'],
      ['집합 연산자 (UNION 등)', 'UNION, INTERSECT 등은 병합 불가 구조예요'],
    ],

    hintTitle: '힌트로 제어하기',
    hintDesc: 'View Merging은 기본적으로 비용 기반으로 결정돼요. 힌트로 강제하거나 방지할 수 있어요.',
    hintSql: `-- 모든 뷰 병합 강제
SELECT /*+ MERGE_ANY_VIEW */ e.first_name, dept_locs_v.street_address
FROM   employees e,
       (SELECT d.department_id, l.street_address
        FROM   departments d, locations l
        WHERE  d.location_id = l.location_id) dept_locs_v
WHERE  dept_locs_v.department_id = e.department_id;

-- 특정 뷰 병합 방지
SELECT /*+ NO_MERGE(dept_locs_v) */ e.first_name, dept_locs_v.street_address
FROM   employees e,
       (SELECT d.department_id, l.street_address
        FROM   departments d, locations l
        WHERE  d.location_id = l.location_id) dept_locs_v
WHERE  dept_locs_v.department_id = e.department_id;`,

    summaryTitle: 'View Merging 핵심 정리',
    summaryItems: [
      'Simple View Merging: GROUP BY·DISTINCT 없는 뷰에 적용, 조인 순서 자유도 증가.',
      'Complex View Merging: GROUP BY·DISTINCT 있는 뷰에 비용 기반으로 적용.',
      'GROUP BY, DISTINCT, ROWNUM, 외부 조인, 집합 연산자가 있으면 Simple Merging 불가.',
      '힌트: MERGE_ANY_VIEW (강제), NO_MERGE(뷰별칭) (방지).',
    ],
  },
  en: {
    title: 'View Merging',
    subtitle: 'Merges the query block representing a view into the containing query block, enabling a wider range of join order optimization and access path selection.',

    whatTitle: 'What is View Merging?',
    whatDesc:
      'View Merging combines the query block of a view with its containing query block. Once merged, the view is no longer treated as an isolated subplan — the optimizer can optimize the entire query as a single join.\n\nKey benefits of View Merging:\n• More join orders become available\n• Broader access method choices\n• Additional transformations such as Table Elimination become possible',

    simpleTitle: 'Simple View Merging',
    simpleDesc:
      'Simple View Merging applies to select-project-join views — views with no GROUP BY, DISTINCT, outer joins, MODEL, CONNECT BY, set operators, or aggregation.',
    simpleExampleDesc: 'This Oracle documentation example shows the inline view dept_locs_v being merged into the outer query.',
    simpleBefore: `-- Before: inline view
SELECT e.first_name, e.last_name,
       dept_locs_v.street_address, dept_locs_v.postal_code
FROM   employees e,
       (SELECT d.department_id, d.department_name,
               l.street_address, l.postal_code
        FROM   departments d, locations l
        WHERE  d.location_id = l.location_id) dept_locs_v
WHERE  dept_locs_v.department_id = e.department_id
AND    e.last_name = 'Smith';`,
    simpleAfter: `-- After: View Merged
SELECT e.first_name, e.last_name,
       l.street_address, l.postal_code
FROM   employees e, departments d, locations l
WHERE  d.location_id = l.location_id
AND    d.department_id = e.department_id
AND    e.last_name = 'Smith';`,
    simpleNote:
      'Before merge: the optimizer must run dept_locs_v first, then join its result to employees.\nAfter merge: all three tables — employees, departments, locations — can be joined in any order.',
    planCaption: 'EXPLAIN PLAN — after View Merging (3-table join, no VIEW node)',

    complexTitle: 'Complex View Merging',
    complexDesc:
      'Complex View Merging applies to views with GROUP BY or DISTINCT operators. It is a cost-based transformation: Oracle considers merging only when it delays the GROUP BY or DISTINCT until after joins, reducing the total rows processed.',
    complexNote:
      'Complex View Merging is not always applied. The optimizer compares costs and merges only when doing so is cheaper.',

    restrictTitle: 'When View Merging Is Restricted',
    restrictDesc: 'Simple View Merging cannot be applied when the view contains any of the following.',
    restrictTable: [
      ['GROUP BY', 'Merging would change aggregate results'],
      ['DISTINCT', 'Merging would change deduplication behavior'],
      ['ROWNUM', 'Row numbering could change after merge'],
      ['Outer Join', 'Outer join semantics inside a view may change after merge'],
      ['MODEL / CONNECT BY', 'Hierarchical and model clauses must be processed as isolated blocks'],
      ['Set operators (UNION, etc.)', 'UNION, INTERSECT, MINUS cannot be merged'],
    ],

    hintTitle: 'Controlling with Hints',
    hintDesc: 'View Merging is cost-based by default. You can force or suppress it with hints.',
    hintSql: `-- Force merging of all views
SELECT /*+ MERGE_ANY_VIEW */ e.first_name, dept_locs_v.street_address
FROM   employees e,
       (SELECT d.department_id, l.street_address
        FROM   departments d, locations l
        WHERE  d.location_id = l.location_id) dept_locs_v
WHERE  dept_locs_v.department_id = e.department_id;

-- Suppress merging of a specific view
SELECT /*+ NO_MERGE(dept_locs_v) */ e.first_name, dept_locs_v.street_address
FROM   employees e,
       (SELECT d.department_id, l.street_address
        FROM   departments d, locations l
        WHERE  d.location_id = l.location_id) dept_locs_v
WHERE  dept_locs_v.department_id = e.department_id;`,

    summaryTitle: 'View Merging Key Takeaways',
    summaryItems: [
      'Simple View Merging: applies to views without GROUP BY or DISTINCT; increases join order flexibility.',
      'Complex View Merging: cost-based; delays GROUP BY/DISTINCT until after joins.',
      'Blocked by: GROUP BY, DISTINCT, ROWNUM, outer joins, set operators.',
      'Hints: MERGE_ANY_VIEW (force), NO_MERGE(alias) (suppress).',
    ],
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 1, cost: 5, time: '00:00:01',
    note: 'VIEW 노드 없이 바로 HASH JOIN이 나타나요 — 뷰가 바깥 쿼리와 병합됐다는 신호예요.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 1, cost: 5, time: '00:00:01',
    note: '3개 테이블이 하나의 조인 트리로 통합됐어요. 병합 전이라면 이 자리에 VIEW 오퍼레이션이 있었을 거예요.' },
  { id: 2, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 3, time: '00:00:01' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_NAME_IX', rows: 1, cost: 1, time: '00:00:01',
    note: 'e.last_name = \'Smith\' 조건으로 인덱스를 사용해요. 병합 덕분에 이 조건이 최상위에서 바로 적용돼요.' },
  { id: 5, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 1, time: '00:00:01' },
  { id: 6, depth: 4, operation: 'INDEX UNIQUE SCAN', name: 'DEPT_ID_PK', rows: 1, cost: 0, time: '00:00:01' },
  { id: 7, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'LOCATIONS', rows: 1, cost: 1, time: '00:00:01' },
  { id: 8, depth: 3, operation: 'INDEX UNIQUE SCAN', name: 'LOC_ID_PK', rows: 1, cost: 0, time: '00:00:01' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 1, cost: 5, time: '00:00:01',
    note: 'No VIEW node appears — the view has been merged into the outer query.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 1, cost: 5, time: '00:00:01',
    note: 'All three tables are combined into a single join tree. Before merging, a VIEW operation would appear here instead.' },
  { id: 2, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 3, time: '00:00:01' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_NAME_IX', rows: 1, cost: 1, time: '00:00:01',
    note: "Uses the name index for e.last_name = 'Smith'. Merging pushed this predicate to the top level, enabling early index access." },
  { id: 5, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 1, time: '00:00:01' },
  { id: 6, depth: 4, operation: 'INDEX UNIQUE SCAN', name: 'DEPT_ID_PK', rows: 1, cost: 0, time: '00:00:01' },
  { id: 7, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'LOCATIONS', rows: 1, cost: 1, time: '00:00:01' },
  { id: 8, depth: 3, operation: 'INDEX UNIQUE SCAN', name: 'LOC_ID_PK', rows: 1, cost: 0, time: '00:00:01' },
]

export function QtViewMergingSection() {
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

      <SectionTitle>{t.simpleTitle}</SectionTitle>
      <Prose>{t.simpleDesc}</Prose>
      <Prose>{t.simpleExampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.simpleBefore} badge={lang === 'ko' ? '변환 전' : 'Before'} badgeColor="rose" />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.simpleAfter} badge={lang === 'ko' ? '변환 후' : 'After'} badgeColor="emerald" />
      </div>
      <InfoBox variant="note">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{t.simpleNote}</pre>
      </InfoBox>
      <ExplainPlanTable rows={planRows} caption={t.planCaption} lang={lang} />

      <Divider />

      <SectionTitle>{t.complexTitle}</SectionTitle>
      <Prose>{t.complexDesc}</Prose>
      <InfoBox variant="tip">{t.complexNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.restrictTitle}</SectionTitle>
      <Prose>{t.restrictDesc}</Prose>
      <Table
        headers={[lang === 'ko' ? '요소' : 'Element', lang === 'ko' ? '이유' : 'Reason']}
        rows={t.restrictTable}
      />

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
