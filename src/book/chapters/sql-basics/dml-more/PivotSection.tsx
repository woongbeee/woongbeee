import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PageContainer,
  ChapterTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  IndexedContent,
} from '../../shared'
import { IconLayoutColumns } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import { EMPLOYEES, type Employee } from '@/data'
import { PivotAnimator, UnpivotAnimator } from './PivotAnimator'

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'pivot' | 'unpivot'

// ── Data ───────────────────────────────────────────────────────────────────

type EmpRow = Pick<Employee, 'first_name' | 'dept_id' | 'job_title' | 'salary'>

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

// ── PIVOT computation ──────────────────────────────────────────────────────

type PivotJob = 'IT Prog' | 'Sales Rep' | 'Accountant' | 'Finance Mgr'
interface PivotRow {
  dept_id: number
  'IT Prog': number | null
  'Sales Rep': number | null
  Accountant: number | null
  'Finance Mgr': number | null
}

function computePivot(): PivotRow[] {
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const pivotJobs: PivotJob[] = [
    'IT Prog',
    'Sales Rep',
    'Accountant',
    'Finance Mgr',
  ]
  return depts.map((dept) => {
    const row: PivotRow = {
      dept_id: dept,
      'IT Prog': null,
      'Sales Rep': null,
      Accountant: null,
      'Finance Mgr': null,
    }
    for (const job of pivotJobs) {
      const rows = EMPS.filter((e) => e.dept_id === dept && e.job_title === job)
      row[job] = rows.length > 0 ? rows.reduce((s, r) => s + r.salary, 0) : null
    }
    return row
  })
}

// ── SQL strings ────────────────────────────────────────────────────────────

const PIVOT_SQL = `SELECT *
FROM (
  SELECT dept_id, job_title, salary
  FROM   employees
  WHERE  dept_id IN (60, 80, 100)
)
PIVOT (
  SUM(salary)
  FOR job_title IN (
    'IT Prog'     AS "IT Prog",
    'Sales Rep'   AS "Sales Rep",
    'Accountant'  AS "Accountant",
    'Finance Mgr' AS "Finance Mgr"
  )
)
ORDER BY dept_id`

const UNPIVOT_SQL = `SELECT dept_id, job_title, total_sal
FROM (
  SELECT dept_id,
         SUM(CASE WHEN job_title = 'IT Prog'     THEN salary END) AS "IT Prog",
         SUM(CASE WHEN job_title = 'Sales Rep'   THEN salary END) AS "Sales Rep",
         SUM(CASE WHEN job_title = 'Accountant'  THEN salary END) AS "Accountant",
         SUM(CASE WHEN job_title = 'Finance Mgr' THEN salary END) AS "Finance Mgr"
  FROM   employees
  WHERE  dept_id IN (60, 80, 100)
  GROUP BY dept_id
)
UNPIVOT (
  total_sal
  FOR job_title IN (
    "IT Prog"     AS 'IT Prog',
    "Sales Rep"   AS 'Sales Rep',
    "Accountant"  AS 'Accountant',
    "Finance Mgr" AS 'Finance Mgr'
  )
)
ORDER BY dept_id, job_title`

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: 'PIVOT / UNPIVOT',
    chapterSubtitle:
      '행을 열로, 열을 행으로 변환해서 데이터를 교차 형태로 펼치거나 다시 정규화하는 Oracle 구문이에요.',
    tabPivot: 'PIVOT',
    tabUnpivot: 'UNPIVOT',
    pivotCategoryLabel: '행 → 열 변환',
    unpivotCategoryLabel: '열 → 행 변환',

    pivotTitle: 'PIVOT — 행을 열로 전환',
    pivotDesc:
      'PIVOT은 특정 컬럼의 값을 열 헤더로 바꿔서 가로 방향으로 펼쳐요. 예를 들어 job_title 값(Engineer, Analyst …)을 열로 변환하면 부서별 직무별 급여 합계를 한눈에 볼 수 있어요.',
    pivotInfo:
      'FOR job_title IN (...)에 나열한 값이 열 이름이 됩니다. 목록에 없는 값은 결과에서 제외됩니다.',
    animTitle: '애니메이션으로 보기',

    unpivotTitle: 'UNPIVOT — 열을 행으로 전환',
    unpivotDesc:
      'UNPIVOT은 PIVOT의 반대예요. 여러 열에 흩어진 값을 하나의 컬럼으로 세로로 쌓아요. 가로로 넓게 펼쳐진 피벗 결과를 다시 정규화된 행 구조로 되돌릴 때 사용해요.',
    unpivotInfo:
      'UNPIVOT 절의 total_sal은 값이 담길 컬럼 이름, FOR job_title은 원래 열 이름이 들어갈 컬럼 이름, IN (...)에는 펼칠 열 목록을 나열합니다. NULL 값을 가진 열은 기본적으로 결과에서 제외됩니다.',
    unpivotNullTip:
      'NULL 열은 기본으로 제외돼요. INCLUDE NULLS 옵션을 추가하면 NULL인 행도 포함할 수 있어요.',

    comparisonTitle: 'PIVOT vs UNPIVOT',
  },
  en: {
    chapterTitle: 'PIVOT / UNPIVOT',
    chapterSubtitle:
      'Oracle syntax for rotating rows into columns (PIVOT) and columns back into rows (UNPIVOT).',
    tabPivot: 'PIVOT',
    tabUnpivot: 'UNPIVOT',
    pivotCategoryLabel: 'Rows → Columns',
    unpivotCategoryLabel: 'Columns → Rows',

    pivotTitle: 'PIVOT — Rows to columns',
    pivotDesc:
      'PIVOT turns distinct values of a column into column headers. For example, turning job_title values (Engineer, Analyst …) into columns lets you see salary totals by dept and job side by side.',
    pivotInfo:
      'Values listed in FOR job_title IN (...) become column names. Values not in the list are excluded from the result.',
    animTitle: 'Watch the Animation',

    unpivotTitle: 'UNPIVOT — Columns to rows',
    unpivotDesc:
      'UNPIVOT is the reverse of PIVOT. It folds multiple columns back into a single value column, stacking each as a separate row. Use it to normalize a wide pivoted result back into a row-oriented structure.',
    unpivotInfo:
      'In the UNPIVOT clause: total_sal is the column that receives the values, FOR job_title names the column that stores the original column names, and IN (...) lists the columns to unfold. Columns containing NULL are excluded by default.',
    unpivotNullTip:
      'NULL columns are excluded by default. Add INCLUDE NULLS to keep rows where the value is NULL.',

    comparisonTitle: 'PIVOT vs UNPIVOT',
  },
}

const C = {
  bg: 'bg-rail',
  border: 'border-line',
  text: 'text-ink/80',
  active: 'bg-amber/10 text-amber',
}

function PivotTabContent({
  tab,
  lang,
  t,
}: {
  tab: Tab
  lang: 'ko' | 'en'
  t: (typeof T)['ko']
}) {
  switch (tab) {
    case 'pivot':
      return (
        <>
          {/* 헤더 */}
          <div
            className={cn(
              'rounded-panel border px-4 py-3',
              C.bg,
              C.border,
              C.text
            )}
          >
            <div className="mb-1 font-mono text-[10px] font-bold tracking-wider uppercase opacity-60">
              {t.pivotCategoryLabel}
            </div>
            <div className="font-mono text-xl font-black">{t.tabPivot}</div>
          </div>

          <Prose>{t.pivotDesc}</Prose>
          <InfoBox variant="summary">{t.pivotInfo}</InfoBox>

          <Divider />

          <SubTitle>{t.animTitle}</SubTitle>
          <SqlBlock sql={PIVOT_SQL} className="mb-4" />
          <div className="mb-4">
            <PivotAnimator lang={lang} emps={EMPS} />
          </div>
          <InfoBox variant="note">{t.pivotInfo}</InfoBox>
        </>
      )

    case 'unpivot':
      return (
        <>
          {/* 헤더 */}
          <div
            className={cn(
              'rounded-panel border px-4 py-3',
              C.bg,
              C.border,
              C.text
            )}
          >
            <div className="mb-1 font-mono text-[10px] font-bold tracking-wider uppercase opacity-60">
              {t.unpivotCategoryLabel}
            </div>
            <div className="font-mono text-xl font-black">{t.tabUnpivot}</div>
          </div>

          <Prose>{t.unpivotDesc}</Prose>
          <InfoBox variant="summary">{t.unpivotInfo}</InfoBox>

          <Divider />

          <SubTitle>{t.animTitle}</SubTitle>
          <SqlBlock sql={UNPIVOT_SQL} className="mb-4" />
          <div className="mb-4">
            <UnpivotAnimator lang={lang} pivotRows={computePivot()} />
          </div>

          <Divider />

          <SubTitle>{t.comparisonTitle}</SubTitle>
          <div className="rounded-card mb-5 overflow-hidden border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-rail border-b">
                  {['', 'PIVOT', 'UNPIVOT'].map((h, i) => (
                    <th
                      key={i}
                      className="text-ink-2 px-4 py-2 text-left font-mono font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(lang === 'ko'
                  ? [
                      [
                        '방향',
                        '행 → 열 (세로 → 가로)',
                        '열 → 행 (가로 → 세로)',
                      ],
                      ['용도', '요약·크로스탭 보고서', '정규화·ELT 전처리'],
                      [
                        '집계',
                        '필요 (SUM, AVG …)',
                        '불필요 (값을 그대로 세로로)',
                      ],
                      [
                        'NULL 처리',
                        '열 값이 없으면 NULL',
                        '기본 제외, INCLUDE NULLS로 포함',
                      ],
                    ]
                  : [
                      [
                        'Direction',
                        'Rows → Columns (tall → wide)',
                        'Columns → Rows (wide → tall)',
                      ],
                      [
                        'Use case',
                        'Summary / cross-tab reports',
                        'Normalization / ELT pre-processing',
                      ],
                      [
                        'Aggregation',
                        'Required (SUM, AVG …)',
                        'Not needed (values kept as-is)',
                      ],
                      [
                        'NULL handling',
                        'Missing combos become NULL',
                        'Excluded by default; use INCLUDE NULLS',
                      ],
                    ]
                ).map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      'border-b last:border-0',
                      i % 2 === 0 ? 'bg-paper' : 'bg-rail'
                    )}
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="text-ink/80 px-4 py-2 font-mono text-[11px]"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InfoBox variant="tip">{t.unpivotNullTip}</InfoBox>
        </>
      )
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export function PivotSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [tab, setTab] = useState<Tab>('pivot')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pivot', label: t.tabPivot },
    { id: 'unpivot', label: t.tabUnpivot },
  ]

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={
          <IconLayoutColumns
            size={36}
            color="var(--color-green)"
            stroke={1.5}
          />
        }
        title={t.chapterTitle}
        subtitle={t.chapterSubtitle}
      />

      <IndexedContent
        items={tabs}
        activeId={tab}
        onSelect={(id) => setTab(id as Tab)}
        getId={(tb) => tb.id}
        indexWidth="160px"
        renderIndexItem={(tb, isActive) => (
          <span
            className={cn(
              'block px-3 py-2 font-mono text-xs font-bold',
              isActive ? C.active : 'text-ink-2 hover:bg-rail'
            )}
          >
            {tb.label}
          </span>
        )}
        renderContent={(tb) => (
          <PivotTabContent tab={tb.id} lang={lang} t={t} />
        )}
      />
    </PageContainer>
  )
}
