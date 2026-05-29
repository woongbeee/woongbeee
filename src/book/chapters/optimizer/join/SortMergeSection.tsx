import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'
import { ExplainPlanTable } from '../shared/diagrams'
import type { PlanRow } from '../shared/diagrams'

const T = {
  ko: {
    title: 'Sort Merge Join — CBO 관점',
    subtitle:
      '비등치 조건과 이미 정렬된 데이터에서 CBO가 Sort Merge Join을 선택하는 이유와 비용 계산 방식을 알아봐요.',

    mechanismTitle: '동작 원리',
    mechanismDesc:
      'Sort Merge Join은 두 단계로 동작해요.\n\nSort Phase: 두 데이터 집합을 각각 조인 키로 정렬해요. 이미 정렬된 데이터(인덱스 Range Scan 결과, 이전 정렬 결과)라면 이 단계를 건너뛰어요.\n\nMerge Phase: 두 포인터를 앞으로 이동시키며 병합해요. 불일치가 발생하면 첫 번째 집합의 다음 행으로만 이동해요 — Nested Loop처럼 처음부터 다시 스캔하지 않아요.',

    selectTitle: 'CBO 선택 조건',
    selectItems: [
      '비등치(non-equijoin) 조건이 있을 때 — <, <=, >, >=, BETWEEN. Hash Join은 등치 조건에서만 동작하므로 비등치 조건에서는 Sort Merge가 사용돼요.',
      '다른 연산 때문에 어차피 정렬이 필요한 경우 — 정렬 비용이 중복되지 않아 효율적이에요.',
      '이미 정렬된 데이터 — 인덱스 Range Scan 결과는 이미 정렬되어 있어서 Sort Phase가 생략돼요.',
      'PGA가 부족해 Hash Join이 디스크로 넘어갈 경우 — Sort Merge는 각 집합을 최대 두 번만 읽어요.',
    ],

    costTitle: '비용 계산 방식',
    costDesc:
      'Sort Merge Join 비용 = 두 집합 정렬 비용 + 병합 비용\n\n정렬 비용이 지배적이에요(O(N log N + M log M)). 하지만 데이터가 이미 정렬된 경우 정렬 비용이 0이 되므로 매우 효율적이에요.\n\nHash Join과 메모리 비교: Hash Join은 메모리 부족 시 해시 테이블과 데이터 양쪽을 디스크에 기록해야 해서 여러 번 읽을 수 있어요. Sort Merge는 각 집합을 두 번 이상 읽지 않아요.',

    bandTitle: 'Band Join (Oracle 12c Release 2+)',
    bandDesc:
      'Band Join은 한 집합의 값이 다른 집합 값의 특정 범위(band) 안에 있는지를 조인하는 비등치 조인이에요.\n\n예: t2.c2 BETWEEN t1.c2 - 10 AND t1.c2 + 10\n\nOracle 12c Release 2부터 Band Join 최적화가 추가되어 범위 바깥의 행은 스캔하지 않아요. 실행 계획에서 SORT JOIN 오퍼레이션으로 확인해요.',

    planTitle: '실행 계획에서 확인하는 방법',
    planDesc:
      'MERGE JOIN 오퍼레이션의 각 자식 아래에 SORT JOIN 오퍼레이션이 나타나요. 이미 정렬된 데이터라면 SORT JOIN 없이 MERGE JOIN만 나타날 수 있어요.',
    planCaption: 'EXPLAIN PLAN — Sort Merge Join (양쪽 SORT JOIN 포함)',
    planOpTable: [
      ['MERGE JOIN', '등치 또는 비등치 Inner join'],
      ['MERGE JOIN OUTER', 'Left/Right Outer join'],
      ['SORT JOIN', '병합을 위한 정렬 오퍼레이션'],
    ],

    hintTitle: '힌트',
    hintSql: `-- Sort Merge Join 강제
SELECT /*+ USE_MERGE(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 방지
SELECT /*+ NO_USE_MERGE(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 비등치 조건 — 자동으로 Sort Merge 선택
SELECT e.last_name, s.grade
FROM   employees e, salary_grades s
WHERE  e.salary BETWEEN s.low_sal AND s.high_sal;`,
  },
  en: {
    title: 'Sort Merge Join — CBO Perspective',
    subtitle:
      'Learn why the CBO chooses Sort Merge Join for non-equijoin conditions and pre-sorted data, and how its cost is calculated.',

    mechanismTitle: 'Mechanism',
    mechanismDesc:
      'Sort Merge Join operates in two phases.\n\nSort Phase: both datasets are sorted on the join key. If data is already sorted (from an index range scan or a previous sort operation), this phase is skipped.\n\nMerge Phase: two pointers advance forward simultaneously. When a mismatch occurs, only the pointer for the first dataset advances — unlike Nested Loop, there is no restart from the beginning.',

    selectTitle: 'When the CBO Chooses Sort Merge',
    selectItems: [
      'A non-equijoin condition exists — <, <=, >, >=, or BETWEEN. Hash Join only handles equality, so Sort Merge is used for range conditions.',
      'Other operations already require a sort — the sort cost is not duplicated.',
      'Data is already sorted — index range scan output is pre-sorted, eliminating the Sort Phase.',
      'Hash Join would spill to disk — Sort Merge reads each dataset at most twice even when spilling.',
    ],

    costTitle: 'Cost Calculation',
    costDesc:
      'Sort Merge cost = sort cost for both datasets + merge cost\n\nThe sort step dominates (O(N log N + M log M)). When data is already sorted, sort cost drops to zero, making Sort Merge highly efficient.\n\nCompared to Hash Join under memory pressure: Hash Join must write both the hash table and data to disk, potentially requiring multiple reads. Sort Merge reads each dataset no more than twice.',

    bandTitle: 'Band Join (Oracle 12c Release 2+)',
    bandDesc:
      "A Band Join is a non-equijoin where values from one dataset fall within a defined range of values from another.\n\nExample: t2.c2 BETWEEN t1.c2 - 10 AND t1.c2 + 10\n\nStarting with Oracle 12c Release 2, Band Join optimization avoids scanning rows outside the defined band. It appears as a SORT JOIN operation in the execution plan.",

    planTitle: 'Verifying in the Execution Plan',
    planDesc:
      'SORT JOIN operations appear as children of MERGE JOIN. When data is already sorted, SORT JOIN may be absent.',
    planCaption: 'EXPLAIN PLAN — Sort Merge Join (with SORT JOIN on both sides)',
    planOpTable: [
      ['MERGE JOIN', 'Equijoin or non-equijoin inner join'],
      ['MERGE JOIN OUTER', 'Left/right outer join'],
      ['SORT JOIN', 'Sort operation for the merge'],
    ],

    hintTitle: 'Hints',
    hintSql: `-- Force Sort Merge Join
SELECT /*+ USE_MERGE(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress
SELECT /*+ NO_USE_MERGE(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Non-equijoin — Sort Merge selected automatically
SELECT e.last_name, s.grade
FROM   employees e, salary_grades s
WHERE  e.salary BETWEEN s.low_sal AND s.high_sal;`,
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 107, cost: 10, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'MERGE JOIN', rows: 107, cost: 10, time: '00:00:01',
    note: '두 SORT JOIN 결과를 병합해요. 비등치 조건에서도 사용 가능해요.' },
  { id: 2, depth: 2, operation: 'SORT JOIN', name: undefined, rows: 107, cost: 5, time: '00:00:01',
    note: 'EMPLOYEES를 department_id로 정렬해요. 인덱스 Range Scan 결과라면 이 단계가 생략될 수 있어요.' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 107, cost: 3, time: '00:00:01' },
  { id: 4, depth: 2, operation: 'SORT JOIN', name: undefined, rows: 27, cost: 4, time: '00:00:01',
    note: 'DEPARTMENTS를 department_id로 정렬해요.' },
  { id: 5, depth: 3, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, time: '00:00:01' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 107, cost: 10, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'MERGE JOIN', rows: 107, cost: 10, time: '00:00:01',
    note: 'Merges the two SORT JOIN results. Works with non-equijoin conditions.' },
  { id: 2, depth: 2, operation: 'SORT JOIN', name: undefined, rows: 107, cost: 5, time: '00:00:01',
    note: 'Sorts EMPLOYEES by department_id. This step can be skipped for index range scan output.' },
  { id: 3, depth: 3, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 107, cost: 3, time: '00:00:01' },
  { id: 4, depth: 2, operation: 'SORT JOIN', name: undefined, rows: 27, cost: 4, time: '00:00:01',
    note: 'Sorts DEPARTMENTS by department_id.' },
  { id: 5, depth: 3, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, time: '00:00:01' },
]

export function OptimizerJoinSortMergePage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const planRows = lang === 'ko' ? PLAN_ROWS_KO : PLAN_ROWS_EN
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-violet-500" />}
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
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 font-mono text-[10px] font-bold text-violet-600">
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

      <SectionTitle>{t.bandTitle}</SectionTitle>
      <Prose>{t.bandDesc}</Prose>
      <InfoBox variant="tip">
        {isKo
          ? 'Band Join 최적화는 Oracle 12c Release 2(12.2)부터 도입됐어요. 실행 계획의 SORT JOIN 오퍼레이션에서 확인할 수 있어요.'
          : 'Band Join optimization was introduced in Oracle 12c Release 2 (12.2). Look for the SORT JOIN operation in the execution plan.'}
      </InfoBox>

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
