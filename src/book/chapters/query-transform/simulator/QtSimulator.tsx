import { useState } from 'react'
import { IconTransform } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  InfoBox,
  SqlBlock,
} from '../../shared'
import { ExplainPlanTable } from '../../optimizer/shared/diagrams'
import type { PlanRow } from '../../optimizer/shared/diagrams'

interface Scenario {
  key: string
  nameKo: string
  nameEn: string
  descKo: string
  descEn: string
  beforeSql: string
  afterSql: string
  beforeCost: number
  afterCost: number
  beforePlanKo: PlanRow[]
  beforePlanEn: PlanRow[]
  afterPlanKo: PlanRow[]
  afterPlanEn: PlanRow[]
  whyKo: string
  whyEn: string
}

const SCENARIOS: Scenario[] = [
  {
    key: 'or-expansion',
    nameKo: 'OR Expansion',
    nameEn: 'OR Expansion',
    descKo:
      'OR로 연결된 서로 다른 컬럼 조건을 UNION ALL 브랜치로 나눠서 각각 인덱스를 쓰게 해요.',
    descEn:
      'Splits an OR condition spanning different columns into UNION ALL branches so each can use its own index.',
    beforeSql: `SELECT *
FROM   employees e, departments d
WHERE  (e.email = 'SSTILES' OR d.department_name = 'Treasury')
AND    e.department_id = d.department_id;`,
    afterSql: `SELECT * FROM employees e, departments d
WHERE  e.email = 'SSTILES' AND e.department_id = d.department_id
UNION ALL
SELECT * FROM employees e, departments d
WHERE  d.department_name = 'Treasury' AND e.department_id = d.department_id;`,
    beforeCost: 42,
    afterCost: 8,
    beforePlanKo: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 2,
        cost: 42,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH JOIN',
        rows: 2,
        cost: 42,
        time: '00:00:01',
        note: 'OR 조건 때문에 인덱스를 못 쓰고 FULL SCAN 후 조인해요.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'DEPARTMENTS',
        rows: 27,
        cost: 3,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 107,
        cost: 38,
        time: '00:00:01',
        note: '어느 인덱스도 OR 조건 전체를 커버하지 못해서 Full Scan이 선택돼요.',
      },
    ],
    beforePlanEn: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 2,
        cost: 42,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH JOIN',
        rows: 2,
        cost: 42,
        time: '00:00:01',
        note: 'The OR condition blocks index usage, so a full scan runs before the join.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'DEPARTMENTS',
        rows: 27,
        cost: 3,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 107,
        cost: 38,
        time: '00:00:01',
        note: 'No single index covers the whole OR condition, so Full Scan is chosen.',
      },
    ],
    afterPlanKo: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 2,
        cost: 8,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'UNION-ALL',
        cost: undefined,
        time: undefined,
        note: 'OR Expansion으로 생성된 두 브랜치예요.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'NESTED LOOPS',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 1,
        cost: 2,
        time: '00:00:01',
      },
      {
        id: 4,
        depth: 4,
        operation: 'INDEX RANGE SCAN',
        name: 'EMP_EMAIL_UK',
        rows: 1,
        cost: 1,
        time: '00:00:01',
        note: '첫 브랜치: email 인덱스 사용',
      },
      {
        id: 5,
        depth: 2,
        operation: 'NESTED LOOPS',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 6,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'DEPARTMENTS',
        rows: 1,
        cost: 2,
        time: '00:00:01',
      },
      {
        id: 7,
        depth: 4,
        operation: 'INDEX RANGE SCAN',
        name: 'DEPT_NAME_IX',
        rows: 1,
        cost: 1,
        time: '00:00:01',
        note: '두번째 브랜치: department_name 인덱스 사용',
      },
    ],
    afterPlanEn: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 2,
        cost: 8,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'UNION-ALL',
        cost: undefined,
        time: undefined,
        note: 'The two branches produced by OR Expansion.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'NESTED LOOPS',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 1,
        cost: 2,
        time: '00:00:01',
      },
      {
        id: 4,
        depth: 4,
        operation: 'INDEX RANGE SCAN',
        name: 'EMP_EMAIL_UK',
        rows: 1,
        cost: 1,
        time: '00:00:01',
        note: 'First branch: uses the email index',
      },
      {
        id: 5,
        depth: 2,
        operation: 'NESTED LOOPS',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 6,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'DEPARTMENTS',
        rows: 1,
        cost: 2,
        time: '00:00:01',
      },
      {
        id: 7,
        depth: 4,
        operation: 'INDEX RANGE SCAN',
        name: 'DEPT_NAME_IX',
        rows: 1,
        cost: 1,
        time: '00:00:01',
        note: 'Second branch: uses the department_name index',
      },
    ],
    whyKo:
      '변환 전에는 두 조건이 OR로 묶여서 어느 한쪽 인덱스도 안전하게 쓸 수 없었어요. UNION ALL로 나누면 각 브랜치가 독립된 WHERE 조건을 갖게 되어, 브랜치마다 서로 다른 인덱스를 자유롭게 쓸 수 있어요.',
    whyEn:
      'Before the transform, the two conditions were tied together by OR, so neither index could be used safely. Splitting into UNION ALL branches gives each branch its own independent WHERE condition, letting each one use a different index freely.',
  },
  {
    key: 'view-merging',
    nameKo: 'View Merging',
    nameEn: 'View Merging',
    descKo:
      '인라인 뷰를 바깥 쿼리 블록에 병합해서 조인 순서·액세스 패스를 더 넓은 범위에서 최적화해요.',
    descEn:
      'Merges an inline view into the outer query block so join order and access paths can be optimized across a wider scope.',
    beforeSql: `SELECT e.last_name, dv.total_salary
FROM   employees e,
       (SELECT department_id, SUM(salary) total_salary
        FROM   employees
        GROUP  BY department_id) dv
WHERE  e.department_id = dv.department_id
AND    e.department_id = 90;`,
    afterSql: `-- View Merging 이후: 인라인 뷰가 바깥 쿼리 블록으로 병합돼요
SELECT e.last_name, SUM(e2.salary) total_salary
FROM   employees e, employees e2
WHERE  e.department_id = e2.department_id
AND    e.department_id = 90
GROUP  BY e.last_name;`,
    beforeCost: 15,
    afterCost: 4,
    beforePlanKo: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 1,
        cost: 15,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH JOIN',
        rows: 1,
        cost: 15,
        time: '00:00:01',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 1,
        cost: 1,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 3,
        operation: 'INDEX RANGE SCAN',
        name: 'EMP_DEPT_IX',
        rows: 1,
        cost: 1,
        time: '00:00:01',
      },
      {
        id: 4,
        depth: 2,
        operation: 'VIEW',
        name: 'DV',
        rows: 11,
        cost: 14,
        time: '00:00:01',
        note: '인라인 뷰가 별도로 먼저 실행돼요 — 전체 부서에 대해 SUM을 미리 계산.',
      },
      {
        id: 5,
        depth: 3,
        operation: 'HASH GROUP BY',
        rows: 11,
        cost: 14,
        time: '00:00:01',
      },
      {
        id: 6,
        depth: 4,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 107,
        cost: 3,
        time: '00:00:01',
        note: 'department_id=90 필터 없이 전체 테이블을 스캔·집계해요.',
      },
    ],
    beforePlanEn: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 1,
        cost: 15,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH JOIN',
        rows: 1,
        cost: 15,
        time: '00:00:01',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 1,
        cost: 1,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 3,
        operation: 'INDEX RANGE SCAN',
        name: 'EMP_DEPT_IX',
        rows: 1,
        cost: 1,
        time: '00:00:01',
      },
      {
        id: 4,
        depth: 2,
        operation: 'VIEW',
        name: 'DV',
        rows: 11,
        cost: 14,
        time: '00:00:01',
        note: 'The inline view runs separately first — precomputing SUM for every department.',
      },
      {
        id: 5,
        depth: 3,
        operation: 'HASH GROUP BY',
        rows: 11,
        cost: 14,
        time: '00:00:01',
      },
      {
        id: 6,
        depth: 4,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 107,
        cost: 3,
        time: '00:00:01',
        note: 'Scans and aggregates the whole table with no department_id=90 filter.',
      },
    ],
    afterPlanKo: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH GROUP BY',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 2,
        depth: 2,
        operation: 'NESTED LOOPS',
        rows: 5,
        cost: 3,
        time: '00:00:01',
        note: '병합 후: department_id=90 필터가 양쪽 테이블 접근에 바로 적용돼요.',
      },
      {
        id: 3,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 5,
        cost: 2,
        time: '00:00:01',
      },
      {
        id: 4,
        depth: 4,
        operation: 'INDEX RANGE SCAN',
        name: 'EMP_DEPT_IX',
        rows: 5,
        cost: 1,
        time: '00:00:01',
      },
      {
        id: 5,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 5,
        cost: 1,
        time: '00:00:01',
      },
    ],
    afterPlanEn: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH GROUP BY',
        rows: 1,
        cost: 4,
        time: '00:00:01',
      },
      {
        id: 2,
        depth: 2,
        operation: 'NESTED LOOPS',
        rows: 5,
        cost: 3,
        time: '00:00:01',
        note: 'After merging: the department_id=90 filter applies directly to both table accesses.',
      },
      {
        id: 3,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 5,
        cost: 2,
        time: '00:00:01',
      },
      {
        id: 4,
        depth: 4,
        operation: 'INDEX RANGE SCAN',
        name: 'EMP_DEPT_IX',
        rows: 5,
        cost: 1,
        time: '00:00:01',
      },
      {
        id: 5,
        depth: 3,
        operation: 'TABLE ACCESS BY INDEX ROWID',
        name: 'EMPLOYEES',
        rows: 5,
        cost: 1,
        time: '00:00:01',
      },
    ],
    whyKo:
      '변환 전에는 인라인 뷰가 부서 필터와 무관하게 전체 테이블에 대해 미리 SUM을 계산했어요. View Merging으로 뷰를 바깥 쿼리 블록에 병합하면 department_id=90 필터가 뷰 내부에도 전파돼서, 딱 필요한 5건만 인덱스로 골라 집계해요.',
    whyEn:
      'Before merging, the inline view precomputed SUM over the whole table regardless of the department filter. After View Merging folds the view into the outer query block, the department_id=90 filter propagates inside the view too, so only the 5 needed rows are picked via the index before aggregating.',
  },
  {
    key: 'subquery-unnesting',
    nameKo: 'Subquery Unnesting',
    nameEn: 'Subquery Unnesting',
    descKo:
      'WHERE 절의 서브쿼리를 조인으로 바꿔서, CBO가 조인 순서와 방법을 자유롭게 고르게 해요.',
    descEn:
      'Converts a WHERE-clause subquery into a join, letting the CBO freely choose the join order and method.',
    beforeSql: `SELECT department_name
FROM   departments d
WHERE  d.department_id IN
       (SELECT e.department_id FROM employees e WHERE e.salary > 10000);`,
    afterSql: `-- Unnesting 이후: 세미조인(semi-join)으로 변환
SELECT d.department_name
FROM   departments d, employees e
WHERE  d.department_id = e.department_id
AND    e.salary > 10000
-- 실제로는 중복 제거를 위한 SEMI JOIN 오퍼레이션으로 처리됨`,
    beforeCost: 30,
    afterCost: 6,
    beforePlanKo: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 5,
        cost: 30,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'FILTER',
        rows: 5,
        cost: 30,
        time: '00:00:01',
        note: '변환 전: 바깥 쿼리 각 행마다 서브쿼리를 반복 실행(상관 서브쿼리처럼 동작)해요.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'DEPARTMENTS',
        rows: 27,
        cost: 3,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 40,
        cost: 27,
        time: '00:00:01',
        note: '서브쿼리가 최대 27번(부서 수만큼) 반복 실행될 수 있어요.',
      },
    ],
    beforePlanEn: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 5,
        cost: 30,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'FILTER',
        rows: 5,
        cost: 30,
        time: '00:00:01',
        note: 'Before: the subquery runs repeatedly for each outer row, similar to a correlated subquery.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'DEPARTMENTS',
        rows: 27,
        cost: 3,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 40,
        cost: 27,
        time: '00:00:01',
        note: 'The subquery could re-execute up to 27 times (once per department).',
      },
    ],
    afterPlanKo: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 5,
        cost: 6,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH JOIN SEMI',
        rows: 5,
        cost: 6,
        time: '00:00:01',
        note: 'Unnesting 이후: 조인으로 바뀌면서 SEMI JOIN 한 번으로 처리돼요.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'DEPARTMENTS',
        rows: 27,
        cost: 3,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 40,
        cost: 3,
        time: '00:00:01',
        note: 'EMPLOYEES는 단 한 번만 스캔돼요 — 중복 매칭은 SEMI JOIN이 자동으로 제거해요.',
      },
    ],
    afterPlanEn: [
      {
        id: 0,
        depth: 0,
        operation: 'SELECT STATEMENT',
        rows: 5,
        cost: 6,
        time: '00:00:01',
      },
      {
        id: 1,
        depth: 1,
        operation: 'HASH JOIN SEMI',
        rows: 5,
        cost: 6,
        time: '00:00:01',
        note: 'After unnesting: converted into a join and processed with a single SEMI JOIN.',
      },
      {
        id: 2,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'DEPARTMENTS',
        rows: 27,
        cost: 3,
        time: '00:00:01',
      },
      {
        id: 3,
        depth: 2,
        operation: 'TABLE ACCESS FULL',
        name: 'EMPLOYEES',
        rows: 40,
        cost: 3,
        time: '00:00:01',
        note: 'EMPLOYEES is scanned only once — SEMI JOIN automatically discards duplicate matches.',
      },
    ],
    whyKo:
      '변환 전에는 FILTER 오퍼레이션이 바깥 쿼리의 각 행마다 서브쿼리를 반복 실행할 가능성이 있어요. Subquery Unnesting으로 조인(SEMI JOIN)으로 바꾸면 EMPLOYEES를 한 번만 스캔하면서, 중복된 department_id 매칭은 세미조인이 자동으로 걸러줘요.',
    whyEn:
      'Before the transform, the FILTER operation risks re-executing the subquery once per outer row. Converting to a join (SEMI JOIN) via Subquery Unnesting scans EMPLOYEES only once, while the semi-join automatically discards duplicate department_id matches.',
  },
]

export function QtSimulator() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const [selected, setSelected] = useState(SCENARIOS[0].key)
  const scenario = SCENARIOS.find((s) => s.key === selected) ?? SCENARIOS[0]

  const beforePlan = isKo ? scenario.beforePlanKo : scenario.beforePlanEn
  const afterPlan = isKo ? scenario.afterPlanKo : scenario.afterPlanEn
  const savingPct = Math.round(
    (1 - scenario.afterCost / scenario.beforeCost) * 100
  )

  const T = {
    title: 'Query Transform Simulator',
    subtitle: isKo
      ? '변환 종류를 골라서 변환 전/후 쿼리와 실행 계획, 비용이 어떻게 달라지는지 비교해봐요.'
      : 'Pick a transformation type and compare the query, execution plan, and cost before and after.',
    pickLabel: isKo ? '변환 종류 선택' : 'Pick a Transformation',
    beforeLabel: isKo ? '변환 전' : 'Before',
    afterLabel: isKo ? '변환 후' : 'After',
    costLabel: isKo ? '옵티마이저 비용' : 'Optimizer Cost',
    savingLabel: (n: number) => (isKo ? `비용 ${n}% 절감` : `${n}% lower cost`),
    whyTitle: isKo ? '왜 비용이 달라졌을까요?' : 'Why Did the Cost Change?',
  }

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconTransform size={36} stroke={1.5} className="text-green" />}
        title={T.title}
        subtitle={T.subtitle}
      />

      <SectionTitle>{T.pickLabel}</SectionTitle>
      <div className="mb-6 grid gap-2.5 sm:grid-cols-3">
        {SCENARIOS.map((s) => {
          const isActive = s.key === selected
          return (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              className={cn(
                'rounded-card border px-4 py-3 text-left transition-all',
                isActive
                  ? 'border-green bg-green/[0.06]'
                  : 'border-line bg-paper hover:border-line-2'
              )}
            >
              <p
                className={cn(
                  'font-mono text-[12px] font-bold',
                  isActive ? 'text-green' : 'text-ink'
                )}
              >
                {isKo ? s.nameKo : s.nameEn}
              </p>
              <p className="font-read text-ink-2 mt-1 text-[11.5px] leading-relaxed">
                {isKo ? s.descKo : s.descEn}
              </p>
            </button>
          )
        })}
      </div>

      {/* 비용 비교 배지 */}
      <div className="rounded-card border-line bg-rail mb-6 flex items-center gap-4 border px-4 py-3">
        <CostPill
          label={T.beforeLabel}
          cost={scenario.beforeCost}
          tone="rose"
        />
        <span className="text-ink-3 font-mono text-lg">→</span>
        <CostPill
          label={T.afterLabel}
          cost={scenario.afterCost}
          tone="emerald"
        />
        <span className="rounded-chip bg-green/10 text-green ml-auto px-3 py-1 font-mono text-xs font-bold">
          {T.savingLabel(savingPct)}
        </span>
      </div>

      {/* SQL 비교 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-rose mb-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
            {T.beforeLabel}
          </p>
          <SqlBlock sql={scenario.beforeSql} />
        </div>
        <div>
          <p className="text-emerald mb-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
            {T.afterLabel}
          </p>
          <SqlBlock sql={scenario.afterSql} />
        </div>
      </div>

      {/* 실행 계획 비교 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ExplainPlanTable
          rows={beforePlan}
          caption={`${T.beforeLabel} — Cost ${scenario.beforeCost}`}
          lang={lang}
        />
        <ExplainPlanTable
          rows={afterPlan}
          caption={`${T.afterLabel} — Cost ${scenario.afterCost}`}
          lang={lang}
        />
      </div>

      <div className="mt-6">
        <InfoBox variant="note">
          <strong>{T.whyTitle}</strong>
          <br />
          {isKo ? scenario.whyKo : scenario.whyEn}
        </InfoBox>
      </div>
    </PageContainer>
  )
}

function CostPill({
  label,
  cost,
  tone,
}: {
  label: string
  cost: number
  tone: 'rose' | 'emerald'
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-2 font-mono text-[10px] font-bold tracking-wider uppercase">
        {label}
      </span>
      <span
        className={cn(
          'rounded-chip px-2.5 py-1 font-mono text-sm font-bold',
          tone === 'rose'
            ? 'bg-rose/10 text-rose'
            : 'bg-emerald/10 text-emerald'
        )}
      >
        {cost}
      </span>
    </div>
  )
}
