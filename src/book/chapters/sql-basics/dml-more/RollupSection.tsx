import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  IndexedContent,
  Table,
} from '../../shared'
import { IconChartTreemap } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import { EMPLOYEES, type Employee } from '@/data'

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'rollup' | 'cube' | 'groupingsets' | 'grouping'

// ── Data ───────────────────────────────────────────────────────────────────

type EmpRow = Pick<Employee, 'first_name' | 'dept_id' | 'job_title' | 'salary'>

// Use employees from 3 representative departments (IT=60, Sales=80, Finance=100)
const EMPS: EmpRow[] = EMPLOYEES.filter((e) =>
  [60, 80, 100].includes(e.dept_id)
)
  .slice(0, 12)
  .map((e) => ({
    first_name: e.first_name,
    dept_id: e.dept_id,
    job_title: e.job_title,
    salary: e.salary,
  }))

// ── ROLLUP computation ─────────────────────────────────────────────────────

interface RollupRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _level: 'detail' | 'subtotal' | 'grand'
}

function computeRollup(): RollupRow[] {
  const result: RollupRow[] = []
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  for (const dept of depts) {
    const deptRows = EMPS.filter((e) => e.dept_id === dept)
    const jobs = [...new Set(deptRows.map((e) => e.job_title))].sort()
    for (const job of jobs) {
      const rows = deptRows.filter((e) => e.job_title === job)
      result.push({
        dept_id: dept,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _level: 'detail',
      })
    }
    result.push({
      dept_id: dept,
      job_title: null,
      total_sal: deptRows.reduce((s, r) => s + r.salary, 0),
      cnt: deptRows.length,
      _level: 'subtotal',
    })
  }
  result.push({
    dept_id: null,
    job_title: null,
    total_sal: EMPS.reduce((s, r) => s + r.salary, 0),
    cnt: EMPS.length,
    _level: 'grand',
  })
  return result
}

// ── CUBE computation ───────────────────────────────────────────────────────

interface CubeRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _grouping: string
}

function computeCube(): CubeRow[] {
  const result: CubeRow[] = []
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const jobs = [...new Set(EMPS.map((e) => e.job_title))].sort()
  for (const dept of depts) {
    for (const job of jobs) {
      const rows = EMPS.filter((e) => e.dept_id === dept && e.job_title === job)
      if (rows.length === 0) continue
      result.push({
        dept_id: dept,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _grouping: 'dept+job',
      })
    }
  }
  for (const dept of depts) {
    const rows = EMPS.filter((e) => e.dept_id === dept)
    result.push({
      dept_id: dept,
      job_title: null,
      total_sal: rows.reduce((s, r) => s + r.salary, 0),
      cnt: rows.length,
      _grouping: 'dept',
    })
  }
  for (const job of jobs) {
    const rows = EMPS.filter((e) => e.job_title === job)
    result.push({
      dept_id: null,
      job_title: job,
      total_sal: rows.reduce((s, r) => s + r.salary, 0),
      cnt: rows.length,
      _grouping: 'job',
    })
  }
  result.push({
    dept_id: null,
    job_title: null,
    total_sal: EMPS.reduce((s, r) => s + r.salary, 0),
    cnt: EMPS.length,
    _grouping: 'grand',
  })
  return result
}

// ── GROUPING SETS computation ──────────────────────────────────────────────

// ── SQL strings ────────────────────────────────────────────────────────────

const ROLLUP_SQL = `SELECT dept_id, job_title,
       SUM(salary) AS total_sal,
       COUNT(*)    AS cnt
FROM   employees
GROUP BY ROLLUP(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const CUBE_SQL = `SELECT dept_id, job_title,
       SUM(salary) AS total_sal,
       COUNT(*)    AS cnt
FROM   employees
GROUP BY CUBE(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const GROUPING_SETS_SQL = `SELECT dept_id, job_title,
       SUM(salary) AS total_sal,
       COUNT(*)    AS cnt
FROM   employees
GROUP BY GROUPING SETS (
  (dept_id),
  (job_title)
)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const GROUPING_SETS_EQ_SQL = `-- GROUPING SETS는 여러 GROUP BY를 UNION ALL한 것과 같아요
SELECT dept_id, NULL AS job_title, SUM(salary), COUNT(*) FROM employees GROUP BY dept_id
UNION ALL
SELECT NULL, job_title, SUM(salary), COUNT(*) FROM employees GROUP BY job_title`

const GROUPING_FN_SQL = `SELECT dept_id, job_title,
       SUM(salary)        AS total_sal,
       COUNT(*)           AS cnt,
       GROUPING(dept_id)  AS grp_dept,
       GROUPING(job_title) AS grp_job
FROM   employees
GROUP BY ROLLUP(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const GROUPING_CASE_SQL = `SELECT
  CASE GROUPING(dept_id)
    WHEN 1 THEN '전체'
    ELSE TO_CHAR(dept_id)
  END AS dept_label,
  CASE GROUPING(job_title)
    WHEN 1 THEN '소계'
    ELSE job_title
  END AS job_label,
  SUM(salary) AS total_sal
FROM   employees
GROUP BY ROLLUP(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: 'ROLLUP / CUBE / GROUPING SETS / GROUPING',
    chapterSubtitle:
      'GROUP BY를 확장해서 소계·총계·교차 집계를 한 번에 구하는 Oracle 집계 구문이에요.',
    tabRollup: 'ROLLUP',
    tabCube: 'CUBE',
    tabGroupingSets: 'GROUPING SETS',
    tabGrouping: 'GROUPING()',

    rollupTitle: 'ROLLUP — 계층적 소계',
    rollupDesc:
      'ROLLUP(A, B)는 (A, B) 상세 집계 → (A) 부서 소계 → () 전체 총계 순서로 행을 자동으로 추가해요. 계층이 왼쪽에서 오른쪽으로 하나씩 제거되는 방식이에요.',
    rollupInfo:
      'ROLLUP(dept_id, job_title)이 만드는 3가지 집계 수준: ① dept_id + job_title (상세) ② dept_id만 (부서 소계) ③ 전체 (총계)',
    rollupEtymTitle: 'ROLLUP이란 단어는 어디서 왔을까?',
    rollupEtym:
      '"Roll up"은 영어로 "말아 올리다", "굴려 위로 합치다"는 뜻이에요. 스프레드시트에서 하위 항목들을 접어(roll up) 상위 합계를 보여주는 동작에서 유래했어요. 세부 행들을 위로 말아 올려 소계·총계로 압축한다는 이미지예요.',
    rollupUsageTitle: '실무에서 언제 쓸까?',
    rollupUsages: [
      {
        icon: '📊',
        title: '월별 매출 보고서',
        desc: '지역 → 팀 → 담당자 순으로 드릴다운 가능한 매출 집계표를 단 하나의 쿼리로 만들 때. GROUP BY ROLLUP(region, team, emp_id)',
      },
      {
        icon: '🧾',
        title: '회계 결산',
        desc: '계정과목 → 부서 → 전체 합계를 한 번에 뽑는 결산 쿼리. UNION ALL을 여러 개 작성하는 대신 ROLLUP 하나로 대체.',
      },
      {
        icon: '📦',
        title: '재고 현황',
        desc: '창고 → 카테고리 → 품목 단위의 재고 수량·금액 소계가 필요한 재고 현황 리포트.',
      },
      {
        icon: '⚡',
        title: '성능',
        desc: '테이블을 한 번만 스캔하고 집계 수준별 행을 동시에 만들어내요. 같은 결과를 UNION ALL로 작성하면 테이블을 여러 번 읽어야 해서 훨씬 느려요.',
      },
    ],

    cubeTitle: 'CUBE — 모든 조합의 소계',
    cubeDesc:
      'CUBE(A, B)는 가능한 모든 컬럼 조합의 집계를 한꺼번에 만들어요. (A, B) · (A) · (B) · () 네 가지 집계가 생겨요. ROLLUP보다 더 많은 행이 생기고, BI 리포트처럼 행·열 모두 소계가 필요할 때 써요.',
    cubeInfo:
      'CUBE(dept_id, job_title)이 만드는 4가지 집계: ① dept+job (상세) ② dept만 (부서별 합계) ③ job만 (직무별 합계) ④ 전체 총계',

    groupingSetsTitle: 'GROUPING SETS — 원하는 집계 조합만 선택',
    groupingSetsDesc:
      'GROUPING SETS는 ROLLUP·CUBE처럼 자동으로 생성하는 대신, 원하는 집계 조합을 직접 나열해요. 필요한 집계 수준만 골라 쓸 수 있어서 불필요한 소계 행을 제거할 수 있어요.',
    groupingSetsInfo:
      'GROUPING SETS ((dept_id), (job_title))은 부서별 합계와 직무별 합계만 만들어요. CUBE처럼 상세(dept+job)나 전체 총계는 생성하지 않아요.',
    groupingSetsEqTitle: 'GROUPING SETS = 여러 GROUP BY의 UNION ALL',
    groupingSetsEqDesc:
      'GROUPING SETS는 내부적으로 각 집합을 개별 GROUP BY로 실행한 뒤 결과를 UNION ALL로 합친 것과 동일해요. 단, GROUPING SETS는 테이블을 한 번만 스캔하기 때문에 성능이 더 좋아요.',

    groupingTitle: 'GROUPING() — 소계 행 식별 함수',
    groupingDesc:
      'ROLLUP·CUBE·GROUPING SETS로 생성된 소계/총계 행에서 NULL은 "집계 기준에서 제외된 컬럼"을 나타내요. 하지만 원본 데이터에도 NULL이 있을 수 있어서, NULL만 보고는 소계 행인지 실제 NULL인지 구분할 수 없어요. GROUPING() 함수가 이 문제를 해결해줘요.',
    groupingInfo:
      'GROUPING(col)은 해당 컬럼이 집계에서 제외된(소계/총계) 경우 1, 실제 그룹 기준으로 사용된 경우 0을 반환해요.',
    groupingCaseTitle: 'CASE와 결합해 레이블 표시',
    groupingCaseDesc:
      'GROUPING()을 CASE 식과 함께 쓰면 NULL 대신 "전체"·"소계" 같은 의미 있는 레이블로 바꿀 수 있어요.',

    nullMeaning: 'NULL = 해당 집계 수준에서 "모든 값"을 의미해요',
    comparisonTitle: 'ROLLUP vs CUBE',
  },
  en: {
    chapterTitle: 'ROLLUP / CUBE / GROUPING SETS / GROUPING',
    chapterSubtitle:
      'Oracle aggregation extensions that compute subtotals, grand totals, and cross-tabulations in a single query.',
    tabRollup: 'ROLLUP',
    tabCube: 'CUBE',
    tabGroupingSets: 'GROUPING SETS',
    tabGrouping: 'GROUPING()',

    rollupTitle: 'ROLLUP — Hierarchical subtotals',
    rollupDesc:
      'ROLLUP(A, B) automatically adds rows for (A, B) detail → (A) subtotal → () grand total. Each level removes one column from the right.',
    rollupInfo:
      'ROLLUP(dept_id, job_title) produces 3 aggregation levels: ① dept_id + job_title (detail) ② dept_id only (dept subtotal) ③ grand total',
    rollupEtymTitle: 'Where does the word "ROLLUP" come from?',
    rollupEtym:
      '"Roll up" means to gather or compress something upward. The term comes from spreadsheets, where collapsing child rows into a parent summary is called "rolling up." In SQL, detail rows are rolled up into subtotals and a grand total.',
    rollupUsageTitle: 'When is ROLLUP used in practice?',
    rollupUsages: [
      {
        icon: '📊',
        title: 'Sales reports',
        desc: 'Generate a drill-down sales summary by region → team → employee in a single query. GROUP BY ROLLUP(region, team, emp_id)',
      },
      {
        icon: '🧾',
        title: 'Financial closing',
        desc: 'Pull account → department → company-wide totals in one pass instead of writing multiple UNION ALL blocks.',
      },
      {
        icon: '📦',
        title: 'Inventory reports',
        desc: 'Subtotal quantities and values by warehouse → category → item in a single inventory report query.',
      },
      {
        icon: '⚡',
        title: 'Performance',
        desc: 'ROLLUP scans the table once and produces all aggregation levels simultaneously. An equivalent UNION ALL approach reads the table multiple times and is significantly slower.',
      },
    ],

    cubeTitle: 'CUBE — All combinations',
    cubeDesc:
      'CUBE(A, B) generates aggregates for every possible column combination: (A, B) · (A) · (B) · (). More rows than ROLLUP, useful when you need subtotals in both row and column directions, like a BI report.',
    cubeInfo:
      'CUBE(dept_id, job_title) produces 4 aggregation levels: ① dept+job (detail) ② dept only ③ job only ④ grand total',

    groupingSetsTitle: 'GROUPING SETS — Pick only the groupings you need',
    groupingSetsDesc:
      'Instead of auto-generating all levels like ROLLUP or CUBE, GROUPING SETS lets you list exactly which grouping combinations you want. This eliminates unnecessary subtotal rows.',
    groupingSetsInfo:
      'GROUPING SETS ((dept_id), (job_title)) produces only dept-level and job-level totals — no detail (dept+job) rows and no grand total.',
    groupingSetsEqTitle: 'GROUPING SETS = UNION ALL of GROUP BYs',
    groupingSetsEqDesc:
      'GROUPING SETS is logically equivalent to running each grouping as a separate GROUP BY and combining with UNION ALL. However, GROUPING SETS scans the table only once, making it more efficient.',

    groupingTitle: 'GROUPING() — Identify subtotal rows',
    groupingDesc:
      'In ROLLUP/CUBE/GROUPING SETS results, NULL means "all values at this aggregation level." But source data can also contain real NULLs, making it impossible to tell them apart. The GROUPING() function solves this.',
    groupingInfo:
      'GROUPING(col) returns 1 when the column is excluded from the grouping (subtotal/grand total row), and 0 when it is an actual group key.',
    groupingCaseTitle: 'Combine with CASE for readable labels',
    groupingCaseDesc:
      'Use GROUPING() inside a CASE expression to replace NULL with meaningful labels like "All" or "Subtotal."',

    nullMeaning: 'NULL = "all values" at that aggregation level',
    comparisonTitle: 'ROLLUP vs CUBE',
  },
}

type TShape = (typeof T)['ko']

// ── ROLLUP step animator ───────────────────────────────────────────────────

interface StepRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _level: 'detail' | 'subtotal' | 'grand'
  _key: string
  _new: boolean
}

const ROLLUP_STEPS: { grouping: string[]; rows: StepRow[] }[] = (() => {
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)

  // Step 0: raw individual rows (not yet aggregated)
  const rawRows: StepRow[] = EMPS.map((e, i) => ({
    dept_id: e.dept_id,
    job_title: e.job_title,
    total_sal: e.salary,
    cnt: 1,
    _level: 'detail',
    _key: `raw-${i}`,
    _new: false,
  }))

  // Step 1: (dept_id, job_title) aggregated detail rows
  const detailRows: StepRow[] = []
  for (const dept of depts) {
    const deptRows = EMPS.filter((e) => e.dept_id === dept)
    const jobs = [...new Set(deptRows.map((e) => e.job_title))].sort()
    for (const job of jobs) {
      const rows = deptRows.filter((e) => e.job_title === job)
      detailRows.push({
        dept_id: dept,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _level: 'detail',
        _key: `d-${dept}-${job}`,
        _new: true,
      })
    }
  }

  // Step 2: add (dept_id) subtotal rows after each dept's detail rows
  const withSubtotals: StepRow[] = []
  for (const dept of depts) {
    const dRows = EMPS.filter((e) => e.dept_id === dept)
    withSubtotals.push(
      ...detailRows
        .filter((r) => r.dept_id === dept)
        .map((r) => ({ ...r, _new: false }))
    )
    withSubtotals.push({
      dept_id: dept,
      job_title: null,
      total_sal: dRows.reduce((s, r) => s + r.salary, 0),
      cnt: dRows.length,
      _level: 'subtotal' as const,
      _key: `s-${dept}`,
      _new: true,
    })
  }

  // Step 3: add () grand total
  const withGrand: StepRow[] = [
    ...withSubtotals.map((r) => ({ ...r, _new: false })),
    {
      dept_id: null,
      job_title: null,
      total_sal: EMPS.reduce((s, r) => s + r.salary, 0),
      cnt: EMPS.length,
      _level: 'grand' as const,
      _key: 'grand',
      _new: true,
    },
  ]

  return [
    { grouping: [], rows: rawRows },
    { grouping: ['dept_id', 'job_title'], rows: detailRows },
    { grouping: ['dept_id'], rows: withSubtotals },
    { grouping: [], rows: withGrand },
  ]
})()

const STEP_META = {
  ko: [
    { label: 'Step 0', desc: '원본 데이터', groupKey: '없음 (개별 행)' },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id, job_title)',
      groupKey: '(dept_id, job_title)',
    },
    { label: 'Step 2', desc: 'dept_id 소계 행 추가', groupKey: '(dept_id)' },
    { label: 'Step 3', desc: '전체 총계 행 추가', groupKey: '()' },
  ],
  en: [
    {
      label: 'Step 0',
      desc: 'Raw detail rows',
      groupKey: 'none (individual rows)',
    },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id, job_title)',
      groupKey: '(dept_id, job_title)',
    },
    {
      label: 'Step 2',
      desc: 'dept_id subtotal rows added',
      groupKey: '(dept_id)',
    },
    { label: 'Step 3', desc: 'Grand total row added', groupKey: '()' },
  ],
}

const LEVEL_STYLE: Record<
  string,
  { row: string; badge: string; label: { ko: string; en: string } }
> = {
  detail: {
    row: '',
    badge: 'bg-rail text-ink-2',
    label: { ko: '상세', en: 'Detail' },
  },
  subtotal: {
    row: 'bg-amber/10',
    badge: 'bg-amber/15 text-amber',
    label: { ko: '소계', en: 'Subtotal' },
  },
  grand: {
    row: 'bg-amber/10',
    badge: 'bg-amber/25 text-amber font-semibold',
    label: { ko: '총계', en: 'Grand' },
  },
}

// ── CUBE step data ─────────────────────────────────────────────────────────

interface CubeStepRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _grouping: string
  _key: string
  _new: boolean
}

const CUBE_STEPS: { rows: CubeStepRow[] }[] = (() => {
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const jobs = [...new Set(EMPS.map((e) => e.job_title))].sort()

  const rawRows: CubeStepRow[] = EMPS.map((e, i) => ({
    dept_id: e.dept_id,
    job_title: e.job_title,
    total_sal: e.salary,
    cnt: 1,
    _grouping: 'detail',
    _key: `raw-${i}`,
    _new: false,
  }))

  const detailRows: CubeStepRow[] = []
  for (const dept of depts) {
    for (const job of jobs) {
      const rows = EMPS.filter((e) => e.dept_id === dept && e.job_title === job)
      if (rows.length === 0) continue
      detailRows.push({
        dept_id: dept,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _grouping: 'dept+job',
        _key: `d-${dept}-${job}`,
        _new: true,
      })
    }
  }

  const withDeptSub: CubeStepRow[] = [
    ...detailRows.map((r) => ({ ...r, _new: false })),
    ...depts.map((dept) => {
      const rows = EMPS.filter((e) => e.dept_id === dept)
      return {
        dept_id: dept,
        job_title: null,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _grouping: 'dept',
        _key: `sd-${dept}`,
        _new: true,
      }
    }),
  ]

  const withJobSub: CubeStepRow[] = [
    ...withDeptSub.map((r) => ({ ...r, _new: false })),
    ...jobs.map((job) => {
      const rows = EMPS.filter((e) => e.job_title === job)
      return {
        dept_id: null,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _grouping: 'job',
        _key: `sj-${job}`,
        _new: true,
      }
    }),
  ]

  const withGrand: CubeStepRow[] = [
    ...withJobSub.map((r) => ({ ...r, _new: false })),
    {
      dept_id: null,
      job_title: null,
      total_sal: EMPS.reduce((s, r) => s + r.salary, 0),
      cnt: EMPS.length,
      _grouping: 'grand',
      _key: 'grand',
      _new: true,
    },
  ]

  return [
    { rows: rawRows },
    { rows: detailRows },
    { rows: withDeptSub },
    { rows: withJobSub },
    { rows: withGrand },
  ]
})()

const CUBE_STEP_META = {
  ko: [
    { label: 'Step 0', desc: '원본 데이터', groupKey: '없음 (개별 행)' },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id, job_title) 상세',
      groupKey: '(dept_id, job_title)',
    },
    { label: 'Step 2', desc: 'dept_id 소계 행 추가', groupKey: '(dept_id)' },
    {
      label: 'Step 3',
      desc: 'job_title 소계 행 추가',
      groupKey: '(job_title)',
    },
    { label: 'Step 4', desc: '전체 총계 행 추가', groupKey: '()' },
  ],
  en: [
    {
      label: 'Step 0',
      desc: 'Raw detail rows',
      groupKey: 'none (individual rows)',
    },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id, job_title) detail',
      groupKey: '(dept_id, job_title)',
    },
    {
      label: 'Step 2',
      desc: 'dept_id subtotal rows added',
      groupKey: '(dept_id)',
    },
    {
      label: 'Step 3',
      desc: 'job_title subtotal rows added',
      groupKey: '(job_title)',
    },
    { label: 'Step 4', desc: 'Grand total row added', groupKey: '()' },
  ],
}

const CUBE_GROUPING_STYLE: Record<
  string,
  { row: string; badge: string; label: { ko: string; en: string } }
> = {
  detail: {
    row: '',
    badge: 'bg-rail text-ink-2',
    label: { ko: '원본', en: 'Raw' },
  },
  'dept+job': {
    row: '',
    badge: 'bg-rail text-ink-2',
    label: { ko: '상세', en: 'Detail' },
  },
  dept: {
    row: 'bg-amber/10',
    badge: 'bg-amber/15 text-amber',
    label: { ko: '부서 소계', en: 'Dept sub' },
  },
  job: {
    row: 'bg-green/10',
    badge: 'bg-green/15 text-green',
    label: { ko: '직무 소계', en: 'Job sub' },
  },
  grand: {
    row: 'bg-amber/10',
    badge: 'bg-amber/25 text-amber font-semibold',
    label: { ko: '총계', en: 'Grand' },
  },
}

// ── GROUPING SETS step data ────────────────────────────────────────────────

interface GSStepRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _set: string
  _key: string
  _new: boolean
}

const GS_STEPS: { rows: GSStepRow[] }[] = (() => {
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const jobs = [...new Set(EMPS.map((e) => e.job_title))].sort()

  const rawRows: GSStepRow[] = EMPS.map((e, i) => ({
    dept_id: e.dept_id,
    job_title: e.job_title,
    total_sal: e.salary,
    cnt: 1,
    _set: 'raw',
    _key: `raw-${i}`,
    _new: false,
  }))

  const deptRows: GSStepRow[] = depts.map((dept) => {
    const rows = EMPS.filter((e) => e.dept_id === dept)
    return {
      dept_id: dept,
      job_title: null,
      total_sal: rows.reduce((s, r) => s + r.salary, 0),
      cnt: rows.length,
      _set: 'dept',
      _key: `d-${dept}`,
      _new: true,
    }
  })

  const withJob: GSStepRow[] = [
    ...deptRows.map((r) => ({ ...r, _new: false })),
    ...jobs.map((job) => {
      const rows = EMPS.filter((e) => e.job_title === job)
      return {
        dept_id: null,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        _set: 'job',
        _key: `j-${job}`,
        _new: true,
      }
    }),
  ]

  return [{ rows: rawRows }, { rows: deptRows }, { rows: withJob }]
})()

const GS_STEP_META = {
  ko: [
    { label: 'Step 0', desc: '원본 데이터', groupKey: '없음 (개별 행)' },
    { label: 'Step 1', desc: 'GROUP BY (dept_id) 집계', groupKey: '(dept_id)' },
    {
      label: 'Step 2',
      desc: 'GROUP BY (job_title) 집계 추가',
      groupKey: '(job_title)',
    },
  ],
  en: [
    {
      label: 'Step 0',
      desc: 'Raw detail rows',
      groupKey: 'none (individual rows)',
    },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id) aggregated',
      groupKey: '(dept_id)',
    },
    {
      label: 'Step 2',
      desc: 'GROUP BY (job_title) added',
      groupKey: '(job_title)',
    },
  ],
}

const GS_SET_STYLE: Record<
  string,
  { row: string; badge: string; label: { ko: string; en: string } }
> = {
  raw: {
    row: '',
    badge: 'bg-rail text-ink-2',
    label: { ko: '원본', en: 'Raw' },
  },
  dept: {
    row: 'bg-amber/10',
    badge: 'bg-amber/15 text-amber',
    label: { ko: '부서별', en: 'By dept' },
  },
  job: {
    row: 'bg-green/10',
    badge: 'bg-green/15 text-green',
    label: { ko: '직무별', en: 'By job' },
  },
}

// ── GROUPING() step data ───────────────────────────────────────────────────

interface GrpFnStepRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  grp_dept: number
  grp_job: number
  _level: 'detail' | 'subtotal' | 'grand'
  _key: string
  _new: boolean
}

const GRPFN_STEPS: { rows: GrpFnStepRow[] }[] = (() => {
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)

  const rawRows: GrpFnStepRow[] = EMPS.map((e, i) => ({
    dept_id: e.dept_id,
    job_title: e.job_title,
    total_sal: e.salary,
    cnt: 1,
    grp_dept: 0,
    grp_job: 0,
    _level: 'detail',
    _key: `raw-${i}`,
    _new: false,
  }))

  const detailRows: GrpFnStepRow[] = []
  for (const dept of depts) {
    const deptRows = EMPS.filter((e) => e.dept_id === dept)
    const jobs = [...new Set(deptRows.map((e) => e.job_title))].sort()
    for (const job of jobs) {
      const rows = deptRows.filter((e) => e.job_title === job)
      detailRows.push({
        dept_id: dept,
        job_title: job,
        total_sal: rows.reduce((s, r) => s + r.salary, 0),
        cnt: rows.length,
        grp_dept: 0,
        grp_job: 0,
        _level: 'detail',
        _key: `d-${dept}-${job}`,
        _new: true,
      })
    }
  }

  const withSubtotals: GrpFnStepRow[] = []
  for (const dept of depts) {
    const dRows = EMPS.filter((e) => e.dept_id === dept)
    withSubtotals.push(
      ...detailRows
        .filter((r) => r.dept_id === dept)
        .map((r) => ({ ...r, _new: false }))
    )
    withSubtotals.push({
      dept_id: dept,
      job_title: null,
      total_sal: dRows.reduce((s, r) => s + r.salary, 0),
      cnt: dRows.length,
      grp_dept: 0,
      grp_job: 1,
      _level: 'subtotal' as const,
      _key: `s-${dept}`,
      _new: true,
    })
  }

  const withGrand: GrpFnStepRow[] = [
    ...withSubtotals.map((r) => ({ ...r, _new: false })),
    {
      dept_id: null,
      job_title: null,
      total_sal: EMPS.reduce((s, r) => s + r.salary, 0),
      cnt: EMPS.length,
      grp_dept: 1,
      grp_job: 1,
      _level: 'grand' as const,
      _key: 'grand',
      _new: true,
    },
  ]

  return [
    { rows: rawRows },
    { rows: detailRows },
    { rows: withSubtotals },
    { rows: withGrand },
  ]
})()

const GRPFN_STEP_META = {
  ko: [
    { label: 'Step 0', desc: '원본 데이터', groupKey: '없음 (개별 행)' },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id, job_title) 상세 — GROUPING()=0,0',
      groupKey: '(dept_id, job_title)',
    },
    {
      label: 'Step 2',
      desc: 'dept_id 소계 — grp_job=1',
      groupKey: '(dept_id)',
    },
    {
      label: 'Step 3',
      desc: '전체 총계 — grp_dept=1, grp_job=1',
      groupKey: '()',
    },
  ],
  en: [
    {
      label: 'Step 0',
      desc: 'Raw detail rows',
      groupKey: 'none (individual rows)',
    },
    {
      label: 'Step 1',
      desc: 'GROUP BY (dept_id, job_title) detail — GROUPING()=0,0',
      groupKey: '(dept_id, job_title)',
    },
    {
      label: 'Step 2',
      desc: 'dept_id subtotal — grp_job=1',
      groupKey: '(dept_id)',
    },
    {
      label: 'Step 3',
      desc: 'Grand total — grp_dept=1, grp_job=1',
      groupKey: '()',
    },
  ],
}

function RollupAnimator({ lang }: { lang: 'ko' | 'en' }) {
  const [step, setStep] = useState(0)
  const meta = STEP_META[lang]
  const { rows } = ROLLUP_STEPS[step]
  const isLast = step === ROLLUP_STEPS.length - 1

  const groupingLevels = {
    ko: ['(dept_id, job_title) 상세', '(dept_id) 부서 소계', '() 전체 총계'],
    en: [
      '(dept_id, job_title) detail',
      '(dept_id) dept subtotal',
      '() grand total',
    ],
  }

  return (
    <div className="rounded-panel mb-6 overflow-hidden border">
      {/* Header */}
      <div className="bg-rail flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <span className="text-ink-2 font-mono text-[10px] font-bold tracking-widest uppercase">
            {lang === 'ko'
              ? 'ROLLUP 단계별로 보기'
              : 'ROLLUP Step-by-Step Simulator'}
          </span>
        </div>
        {/* Step pills */}
        <div className="flex shrink-0 gap-1.5">
          {meta.map((m, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold transition-all',
                step === i
                  ? 'bg-amber text-paper'
                  : 'bg-rail text-ink-2 hover:bg-rail'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step description + active levels */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5">
        <span className="rounded-card bg-amber/15 text-amber shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold">
          {meta[step].label}
        </span>
        <span className="text-ink/80 font-mono text-[11px]">
          {meta[step].desc}
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
          {groupingLevels[lang].map((lbl, i) => (
            <span
              key={i}
              className={cn(
                'rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-all duration-300',
                step >= i + 1
                  ? 'bg-amber/15 text-amber'
                  : 'bg-rail text-ink-2/30'
              )}
            >
              {lbl}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto p-4">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              {[
                'dept_id',
                'job_title',
                step === 0 ? 'salary' : 'total_sal',
                ...(step === 0 ? [] : ['cnt', '']),
              ].map((h, i) => (
                <th
                  key={i}
                  className="text-ink-2 pr-6 pb-2 text-left font-mono font-bold whitespace-nowrap last:pr-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row) => {
                const s = LEVEL_STYLE[row._level]
                return (
                  <motion.tr
                    key={row._key}
                    layout
                    initial={
                      row._new
                        ? {
                            opacity: 0,
                            x: -12,
                            backgroundColor: 'var(--color-rail)',
                          }
                        : false
                    }
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: 'transparent',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={cn('border-b last:border-0', s.row)}
                  >
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.dept_id ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.job_title ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.total_sal.toLocaleString()}
                    </td>
                    {step > 0 && (
                      <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                        {row.cnt}
                      </td>
                    )}
                    {step > 0 && (
                      <td className="py-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold',
                            s.badge
                          )}
                        >
                          {s.label[lang]}
                        </span>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Next / Prev buttons */}
      <div className="bg-rail flex items-center justify-between border-t px-4 py-2.5">
        <button
          onClick={() => setStep((p) => Math.max(0, p - 1))}
          disabled={step === 0}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <span className="text-ink-2/50 font-mono text-[10px]">
          {step + 1} / {ROLLUP_STEPS.length}
        </span>
        <button
          onClick={() =>
            setStep((p) => Math.min(ROLLUP_STEPS.length - 1, p + 1))
          }
          disabled={isLast}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>
      </div>
    </div>
  )
}

// ── CubeAnimator ──────────────────────────────────────────────────────────

function CubeAnimator({ lang }: { lang: 'ko' | 'en' }) {
  const [step, setStep] = useState(0)
  const meta = CUBE_STEP_META[lang]
  const { rows } = CUBE_STEPS[step]
  const isLast = step === CUBE_STEPS.length - 1

  const levelBadges = {
    ko: ['dept+job 상세', 'dept 소계', 'job 소계', '전체 총계'],
    en: ['dept+job detail', 'dept subtotal', 'job subtotal', 'grand total'],
  }

  return (
    <div className="rounded-panel mb-6 overflow-hidden border">
      <div className="bg-rail flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <span className="text-ink-2 font-mono text-[10px] font-bold tracking-widest uppercase">
            {lang === 'ko'
              ? 'CUBE 단계별로 보기'
              : 'CUBE Step-by-Step Simulator'}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {meta.map((m, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold transition-all',
                step === i
                  ? 'bg-amber text-paper'
                  : 'bg-rail text-ink-2 hover:bg-rail'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5">
        <span className="rounded-card bg-amber/15 text-amber shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold">
          {meta[step].label}
        </span>
        <span className="text-ink/80 font-mono text-[11px]">
          {meta[step].desc}
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
          {levelBadges[lang].map((lbl, i) => (
            <span
              key={i}
              className={cn(
                'rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-all duration-300',
                step >= i + 1
                  ? i === 2
                    ? 'bg-green/15 text-green'
                    : 'bg-amber/15 text-amber'
                  : 'bg-rail text-ink-2/30'
              )}
            >
              {lbl}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              {[
                'dept_id',
                'job_title',
                step === 0 ? 'salary' : 'total_sal',
                ...(step === 0 ? [] : ['cnt', '']),
              ].map((h, i) => (
                <th
                  key={i}
                  className="text-ink-2 pr-6 pb-2 text-left font-mono font-bold whitespace-nowrap last:pr-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row) => {
                const s = CUBE_GROUPING_STYLE[row._grouping]
                return (
                  <motion.tr
                    key={row._key}
                    layout
                    initial={
                      row._new
                        ? {
                            opacity: 0,
                            x: -12,
                            backgroundColor: 'var(--color-rail)',
                          }
                        : false
                    }
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: 'transparent',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={cn('border-b last:border-0', s.row)}
                  >
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.dept_id ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.job_title ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.total_sal.toLocaleString()}
                    </td>
                    {step > 0 && (
                      <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                        {row.cnt}
                      </td>
                    )}
                    {step > 0 && (
                      <td className="py-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold',
                            s.badge
                          )}
                        >
                          {s.label[lang]}
                        </span>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="bg-rail flex items-center justify-between border-t px-4 py-2.5">
        <button
          onClick={() => setStep((p) => Math.max(0, p - 1))}
          disabled={step === 0}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <span className="text-ink-2/50 font-mono text-[10px]">
          {step + 1} / {CUBE_STEPS.length}
        </span>
        <button
          onClick={() => setStep((p) => Math.min(CUBE_STEPS.length - 1, p + 1))}
          disabled={isLast}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>
      </div>
    </div>
  )
}

// ── GroupingSetsAnimator ───────────────────────────────────────────────────

function GroupingSetsAnimator({ lang }: { lang: 'ko' | 'en' }) {
  const [step, setStep] = useState(0)
  const meta = GS_STEP_META[lang]
  const { rows } = GS_STEPS[step]
  const isLast = step === GS_STEPS.length - 1

  const levelBadges = {
    ko: ['(dept_id) 부서별', '(job_title) 직무별'],
    en: ['(dept_id) by dept', '(job_title) by job'],
  }

  return (
    <div className="rounded-panel mb-6 overflow-hidden border">
      <div className="bg-rail flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <span className="text-ink-2 font-mono text-[10px] font-bold tracking-widest uppercase">
            {lang === 'ko'
              ? 'GROUPING SETS 단계별로 보기'
              : 'GROUPING SETS Step-by-Step Simulator'}
          </span>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {meta.map((m, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold transition-all',
                step === i
                  ? 'bg-amber text-paper'
                  : 'bg-rail text-ink-2 hover:bg-rail'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5">
        <span className="rounded-card bg-amber/15 text-amber shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold">
          {meta[step].label}
        </span>
        <span className="text-ink/80 font-mono text-[11px]">
          {meta[step].desc}
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
          {levelBadges[lang].map((lbl, i) => (
            <span
              key={i}
              className={cn(
                'rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-all duration-300',
                step >= i + 1
                  ? i === 0
                    ? 'bg-amber/15 text-amber'
                    : 'bg-green/15 text-green'
                  : 'bg-rail text-ink-2/30'
              )}
            >
              {lbl}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              {[
                'dept_id',
                'job_title',
                step === 0 ? 'salary' : 'total_sal',
                ...(step === 0 ? [] : ['cnt', '']),
              ].map((h, i) => (
                <th
                  key={i}
                  className="text-ink-2 pr-6 pb-2 text-left font-mono font-bold whitespace-nowrap last:pr-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row) => {
                const s = GS_SET_STYLE[row._set]
                return (
                  <motion.tr
                    key={row._key}
                    layout
                    initial={
                      row._new
                        ? {
                            opacity: 0,
                            x: -12,
                            backgroundColor: 'var(--color-rail)',
                          }
                        : false
                    }
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: 'transparent',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={cn('border-b last:border-0', s.row)}
                  >
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.dept_id ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.job_title ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.total_sal.toLocaleString()}
                    </td>
                    {step > 0 && (
                      <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                        {row.cnt}
                      </td>
                    )}
                    {step > 0 && (
                      <td className="py-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold',
                            s.badge
                          )}
                        >
                          {s.label[lang]}
                        </span>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="bg-rail flex items-center justify-between border-t px-4 py-2.5">
        <button
          onClick={() => setStep((p) => Math.max(0, p - 1))}
          disabled={step === 0}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <span className="text-ink-2/50 font-mono text-[10px]">
          {step + 1} / {GS_STEPS.length}
        </span>
        <button
          onClick={() => setStep((p) => Math.min(GS_STEPS.length - 1, p + 1))}
          disabled={isLast}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>
      </div>
    </div>
  )
}

// ── GroupingFnAnimator ─────────────────────────────────────────────────────

function GroupingFnAnimator({ lang }: { lang: 'ko' | 'en' }) {
  const [step, setStep] = useState(0)
  const meta = GRPFN_STEP_META[lang]
  const { rows } = GRPFN_STEPS[step]
  const isLast = step === GRPFN_STEPS.length - 1

  const levelBadges = {
    ko: ['상세 (grp=0,0)', '소계 (grp_job=1)', '총계 (grp=1,1)'],
    en: ['detail (grp=0,0)', 'subtotal (grp_job=1)', 'grand (grp=1,1)'],
  }

  return (
    <div className="rounded-panel mb-6 overflow-hidden border">
      <div className="bg-rail flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <span className="text-ink-2 font-mono text-[10px] font-bold tracking-widest uppercase">
            {lang === 'ko'
              ? 'GROUPING() 단계별로 보기='
              : 'GROUPING() Step-by-Step Simulator'}
          </span>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {meta.map((m, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold transition-all',
                step === i
                  ? 'bg-amber text-paper'
                  : 'bg-rail text-ink-2 hover:bg-rail'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5">
        <span className="rounded-card bg-amber/15 text-amber shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold">
          {meta[step].label}
        </span>
        <span className="text-ink/80 font-mono text-[11px]">
          {meta[step].desc}
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
          {levelBadges[lang].map((lbl, i) => (
            <span
              key={i}
              className={cn(
                'rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-all duration-300',
                step >= i + 1
                  ? 'bg-amber/15 text-amber'
                  : 'bg-rail text-ink-2/30'
              )}
            >
              {lbl}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              {[
                'dept_id',
                'job_title',
                step === 0 ? 'salary' : 'total_sal',
                ...(step === 0 ? [] : ['cnt', 'grp_dept', 'grp_job']),
              ].map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    'pr-6 pb-2 text-left font-mono font-bold whitespace-nowrap last:pr-0',
                    i >= 4 ? 'text-amber' : 'text-ink-2'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row) => {
                const s = LEVEL_STYLE[row._level]
                return (
                  <motion.tr
                    key={row._key}
                    layout
                    initial={
                      row._new
                        ? {
                            opacity: 0,
                            x: -12,
                            backgroundColor: 'var(--color-rail)',
                          }
                        : false
                    }
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: 'transparent',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={cn('border-b last:border-0', s.row)}
                  >
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.dept_id ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.job_title ?? <NullCell />}
                    </td>
                    <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                      {row.total_sal.toLocaleString()}
                    </td>
                    {step > 0 && (
                      <td className="text-ink/80 py-1.5 pr-6 font-mono text-[11px] whitespace-nowrap">
                        {row.cnt}
                      </td>
                    )}
                    {step > 0 && (
                      <td className="py-1.5 pr-6 text-center">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 font-mono text-[11px] font-bold',
                            row.grp_dept === 1
                              ? 'bg-amber/15 text-amber'
                              : 'bg-rail text-ink-2'
                          )}
                        >
                          {row.grp_dept}
                        </span>
                      </td>
                    )}
                    {step > 0 && (
                      <td className="py-1.5 text-center">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 font-mono text-[11px] font-bold',
                            row.grp_job === 1
                              ? 'bg-amber/15 text-amber'
                              : 'bg-rail text-ink-2'
                          )}
                        >
                          {row.grp_job}
                        </span>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="bg-rail flex items-center justify-between border-t px-4 py-2.5">
        <button
          onClick={() => setStep((p) => Math.max(0, p - 1))}
          disabled={step === 0}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <span className="text-ink-2/50 font-mono text-[10px]">
          {step + 1} / {GRPFN_STEPS.length}
        </span>
        <button
          onClick={() =>
            setStep((p) => Math.min(GRPFN_STEPS.length - 1, p + 1))
          }
          disabled={isLast}
          className="rounded-card text-ink-2 hover:bg-rail border px-3 py-1 font-mono text-[11px] font-bold transition-colors disabled:opacity-30"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function NullCell() {
  return <span className="text-ink-2/50 italic">NULL</span>
}

// ── Main component ─────────────────────────────────────────────────────────

function RollupTabContent({
  tab,
  lang,
  t,
}: {
  tab: Tab
  lang: 'ko' | 'en'
  t: TShape
}) {
  switch (tab) {
    case 'rollup':
      return (
        <>
          <SectionTitle>{t.rollupTitle}</SectionTitle>
          <Prose>{t.rollupDesc}</Prose>
          <InfoBox variant="summary">{t.rollupInfo}</InfoBox>
          <SqlBlock sql={ROLLUP_SQL} className="mb-5" />
          <RollupAnimator lang={lang} />
          <InfoBox variant="note">{t.nullMeaning}</InfoBox>

          <Divider />

          {/* Etymology */}
          <SubTitle>{t.rollupEtymTitle}</SubTitle>
          <Prose>{t.rollupEtym}</Prose>

          <Divider />

          {/* Practical usage */}
          <SubTitle>{t.rollupUsageTitle}</SubTitle>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {t.rollupUsages.map((u) => (
              <div key={u.title} className="rounded-card bg-rail border p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-base">{u.icon}</span>
                  <span className="text-ink/80 font-mono text-[11px] font-bold">
                    {u.title}
                  </span>
                </div>
                <p className="text-ink-2 font-mono text-[11px] leading-relaxed">
                  {u.desc}
                </p>
              </div>
            ))}
          </div>
        </>
      )

    case 'cube':
      return (
        <>
          <SectionTitle>{t.cubeTitle}</SectionTitle>
          <Prose>{t.cubeDesc}</Prose>
          <InfoBox variant="summary">{t.cubeInfo}</InfoBox>

          <Divider />

          <SubTitle>{t.comparisonTitle}</SubTitle>
          <Table
            headers={['', 'ROLLUP(dept, job)', 'CUBE(dept, job)']}
            rows={(lang === 'ko'
                  ? [
                      ['dept + job 상세', '✅', '✅'],
                      ['dept 소계', '✅', '✅'],
                      ['job 소계', '❌', '✅'],
                      ['전체 총계', '✅', '✅'],
                      [
                        '생성 행 수',
                        `${computeRollup().length}행`,
                        `${computeCube().length}행`,
                      ],
                    ]
                  : [
                      ['dept + job detail', '✅', '✅'],
                      ['dept subtotal', '✅', '✅'],
                      ['job subtotal', '❌', '✅'],
                      ['grand total', '✅', '✅'],
                      [
                        'rows generated',
                        `${computeRollup().length} rows`,
                        `${computeCube().length} rows`,
                      ],
                    ]
            )}
          />

          <SqlBlock sql={CUBE_SQL} className="mb-5" />
          <CubeAnimator lang={lang} />
          <InfoBox variant="note">{t.nullMeaning}</InfoBox>
        </>
      )

    case 'groupingsets':
      return (
        <>
          <SectionTitle>{t.groupingSetsTitle}</SectionTitle>
          <Prose>{t.groupingSetsDesc}</Prose>
          <InfoBox variant="summary">{t.groupingSetsInfo}</InfoBox>
          <SqlBlock sql={GROUPING_SETS_SQL} className="mb-5" />
          <GroupingSetsAnimator lang={lang} />

          <Divider />

          <SubTitle>{t.groupingSetsEqTitle}</SubTitle>
          <Prose>{t.groupingSetsEqDesc}</Prose>
          <SqlBlock sql={GROUPING_SETS_EQ_SQL} className="mb-5" />

          <InfoBox variant="note">{t.nullMeaning}</InfoBox>
        </>
      )

    case 'grouping':
      return (
        <>
          <SectionTitle>{t.groupingTitle}</SectionTitle>
          <Prose>{t.groupingDesc}</Prose>
          <InfoBox variant="summary">{t.groupingInfo}</InfoBox>
          <SqlBlock sql={GROUPING_FN_SQL} className="mb-5" />
          <GroupingFnAnimator lang={lang} />

          <Divider />

          <SubTitle>{t.groupingCaseTitle}</SubTitle>
          <Prose>{t.groupingCaseDesc}</Prose>
          <SqlBlock sql={GROUPING_CASE_SQL} className="mb-5" />
        </>
      )
  }
}

export function RollupSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang] as TShape
  const [tab, setTab] = useState<Tab>('rollup')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'rollup', label: t.tabRollup },
    { id: 'cube', label: t.tabCube },
    { id: 'groupingsets', label: t.tabGroupingSets },
    { id: 'grouping', label: t.tabGrouping },
  ]

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={
          <IconChartTreemap size={36} color="var(--color-amber)" stroke={1.5} />
        }
        title={t.chapterTitle}
        subtitle={t.chapterSubtitle}
      />

      <IndexedContent
        items={tabs}
        activeId={tab}
        onSelect={(id) => setTab(id as Tab)}
        getId={(tb) => tb.id}
        indexWidth="220px"
        renderIndexItem={(tb, isActive) => (
          <span
            className={cn(
              'block px-3 py-2 font-mono text-xs font-bold',
              isActive ? 'bg-amber/10 text-amber' : 'text-ink-2 hover:bg-rail'
            )}
          >
            {tb.label}
          </span>
        )}
        renderContent={(tb) => (
          <RollupTabContent tab={tb.id} lang={lang} t={t} />
        )}
      />
    </PageContainer>
  )
}
