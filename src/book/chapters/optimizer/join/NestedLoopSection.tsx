import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'
import { ExplainPlanTable } from '../shared/diagrams'
import type { PlanRow } from '../shared/diagrams'

const T = {
  ko: {
    title: 'Nested Loop Join — CBO 관점',
    subtitle:
      'CBO가 Nested Loop Join을 선택하는 조건, 비용 계산 방식, 실행 계획에서 확인하는 방법을 알아봐요.',

    mechanismTitle: '동작 원리',
    mechanismDesc:
      'Nested Loop Join은 두 개의 중첩 루프로 동작해요. 외부 루프는 outer table(driving table)에서 행을 하나씩 가져오고, 내부 루프는 그 행의 조인 키를 사용해 inner table에서 일치하는 행을 찾아요.\n\nInner 테이블에 조인 조건을 만족하는 인덱스가 있으면 각 내부 루프 반복이 인덱스 탐색으로 끝나요. 인덱스가 없으면 inner 테이블 전체를 반복 스캔해야 해서 비용이 급증해요.',

    selectTitle: 'CBO 선택 조건',
    selectItems: [
      'Outer 테이블의 결과 행 수가 소량일 때 — 내부 루프 반복 횟수가 적어요.',
      'Inner 테이블에 선택도 높은 인덱스가 있을 때 — 각 반복마다 소수의 블록만 읽어요.',
      'OPTIMIZER_MODE = FIRST_ROWS 또는 FIRST_ROWS_n — 첫 행을 빨리 반환해야 할 때.',
      'Outer 결과의 한쪽이 단일 행(1 row)일 때 — 기본 키 등치 조건 등.',
    ],

    costTitle: '비용 계산 방식',
    costDesc:
      'Nested Loop Join 비용 = outer 탐색 비용 + (outer 반환 행 수 × inner 한 번 탐색 비용)\n\nCBO는 테이블의 실제 크기가 아니라 조인 결과의 예상 행 수(cardinality)를 기준으로 비용을 계산해요. Inner 인덱스의 클러스터링 팩터도 비용에 반영돼요.',

    vectorTitle: 'Oracle 11g+ 벡터 I/O',
    vectorDesc:
      'Oracle 11g부터 Nested Loop Join은 벡터 I/O(vector/array I/O)를 사용해요. 여러 건의 물리 I/O 요청을 묶어서 처리하므로 반복적인 단일 블록 I/O보다 효율적이에요.\n이 때문에 실행 계획에서 NESTED LOOPS 오퍼레이션이 두 개 중첩되어 나타날 수 있어요 — 예전 릴리즈에서 하나로 표시되던 것이 분리된 것이지 알고리즘 변경이 아니에요.',

    planTitle: '실행 계획에서 확인하는 방법',
    planDesc:
      'NESTED LOOPS 오퍼레이션 아래에 outer row source와 inner row source가 자식으로 나타나요. Inner 쪽에 INDEX 오퍼레이션이 있으면 인덱스를 통해 효율적으로 탐색하고 있다는 뜻이에요.',
    planCaption: 'EXPLAIN PLAN — Nested Loop Join',
    planOpTable: [
      ['NESTED LOOPS', 'Inner join'],
      ['NESTED LOOPS SEMI', '세미조인 (IN / EXISTS)'],
      ['NESTED LOOPS ANTI', '안티조인 (NOT IN / NOT EXISTS)'],
      ['NESTED LOOPS ANTI SNA', 'Single Null-Aware 안티조인'],
    ],

    hintTitle: '힌트',
    hintSql: `SELECT /*+ USE_NL(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 특정 인덱스를 사용하는 Nested Loop 강제
SELECT /*+ USE_NL_WITH_INDEX(d dept_id_pk) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 방지
SELECT /*+ NO_USE_NL(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
  },
  en: {
    title: 'Nested Loop Join — CBO Perspective',
    subtitle:
      'Learn when the CBO chooses Nested Loop Join, how it calculates the cost, and how to read the execution plan.',

    mechanismTitle: 'Mechanism',
    mechanismDesc:
      'Nested Loop Join operates as two nested loops. The outer loop fetches rows one by one from the outer (driving) table; the inner loop uses the join key from each fetched row to look up matching rows in the inner table.\n\nWhen the inner table has an index that satisfies the join condition, each inner loop iteration is just an index lookup. Without an index, Oracle must re-scan the entire inner table for every outer row, causing cost to surge.',

    selectTitle: 'When the CBO Chooses Nested Loop',
    selectItems: [
      'The outer row source produces a small number of rows — fewer inner loop iterations.',
      'The inner table has a highly selective index — each iteration reads only a few blocks.',
      'OPTIMIZER_MODE is FIRST_ROWS or FIRST_ROWS_n — Nested Loop returns the first row quickly.',
      'One side of the join produces exactly one row — for example, a primary key equality lookup.',
    ],

    costTitle: 'Cost Calculation',
    costDesc:
      'Nested Loop cost = outer scan cost + (outer cardinality × cost of one inner probe)\n\nThe CBO bases its calculation on the expected join result cardinality — not the underlying table sizes. The clustering factor of the inner index is also factored in.',

    vectorTitle: 'Oracle 11g+ Vector I/O',
    vectorDesc:
      'Starting in Oracle 11g, Nested Loop Joins use vector (array) I/O — multiple physical I/O requests are batched together, making it more efficient than repeated single-block reads.\nAs a result, the execution plan may show two NESTED LOOPS operations nested inside each other where earlier releases showed only one — this is a representation of batched I/O, not a different algorithm.',

    planTitle: 'Verifying in the Execution Plan',
    planDesc:
      'The NESTED LOOPS operation appears with the outer and inner row sources as child operations. An INDEX operation on the inner side means it is probing efficiently via an index.',
    planCaption: 'EXPLAIN PLAN — Nested Loop Join',
    planOpTable: [
      ['NESTED LOOPS', 'Inner join'],
      ['NESTED LOOPS SEMI', 'Semijoin (IN / EXISTS)'],
      ['NESTED LOOPS ANTI', 'Antijoin (NOT IN / NOT EXISTS)'],
      ['NESTED LOOPS ANTI SNA', 'Single null-aware antijoin'],
    ],

    hintTitle: 'Hints',
    hintSql: `SELECT /*+ USE_NL(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Force Nested Loop with a specific index
SELECT /*+ USE_NL_WITH_INDEX(d dept_id_pk) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress
SELECT /*+ NO_USE_NL(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 1, cost: 3, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'NESTED LOOPS', rows: 1, cost: 3, time: '00:00:01',
    note: 'Oracle 11g+ 벡터 I/O — NESTED LOOPS 두 개로 표현. 내부 루프 결과와 테이블 접근이 분리돼요.' },
  { id: 2, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 2, time: '00:00:01' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01',
    note: 'Outer row source. 조건을 만족하는 행을 인덱스로 먼저 찾아요.' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_NAME_IX', rows: 1, cost: 1, time: '00:00:01' },
  { id: 5, depth: 3, operation: 'INDEX UNIQUE SCAN', name: 'DEPT_ID_PK', rows: 1, cost: 0, time: '00:00:01',
    note: 'Outer 행의 department_id로 Inner 인덱스를 탐색해요. 인덱스가 없었다면 FULL SCAN이 반복됐을 거예요.' },
  { id: 6, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 1, time: '00:00:01' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 1, cost: 3, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'NESTED LOOPS', rows: 1, cost: 3, time: '00:00:01',
    note: 'Oracle 11g+ vector I/O — two NESTED LOOPS nodes represent batched I/O, not a different algorithm.' },
  { id: 2, depth: 2, operation: 'NESTED LOOPS', rows: 1, cost: 2, time: '00:00:01' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01',
    note: 'Outer row source. Matching rows are located via index first.' },
  { id: 4, depth: 4, operation: 'INDEX RANGE SCAN', name: 'EMP_NAME_IX', rows: 1, cost: 1, time: '00:00:01' },
  { id: 5, depth: 3, operation: 'INDEX UNIQUE SCAN', name: 'DEPT_ID_PK', rows: 1, cost: 0, time: '00:00:01',
    note: "Probes the inner index using the outer row's department_id. Without this index, a full scan would repeat for every outer row." },
  { id: 6, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 1, time: '00:00:01' },
]

export function OptimizerJoinNestedLoopPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const planRows = lang === 'ko' ? PLAN_ROWS_KO : PLAN_ROWS_EN
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.mechanismTitle}</SectionTitle>
      <Prose>{t.mechanismDesc}</Prose>

      <Divider />

      <SectionTitle>{t.selectTitle}</SectionTitle>
      <div className="mt-4 space-y-2">
        {t.selectItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 font-mono text-[10px] font-bold text-blue-600">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.costTitle}</SectionTitle>
      <Prose>{t.costDesc}</Prose>

      <Divider />

      <SectionTitle>{t.vectorTitle}</SectionTitle>
      <Prose>{t.vectorDesc}</Prose>

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <ExplainPlanTable rows={planRows} caption={t.planCaption} lang={lang} />
      <SubTitle>{isKo ? '실행 계획 오퍼레이션 명' : 'Execution Plan Operation Names'}</SubTitle>
      <Table
        headers={[isKo ? '오퍼레이션' : 'Operation', isKo ? '설명' : 'Description']}
        rows={t.planOpTable}
      />

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>
    </PageContainer>
  )
}
