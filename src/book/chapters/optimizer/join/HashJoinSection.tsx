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
    title: 'Hash Join — CBO 관점',
    subtitle:
      'CBO가 Hash Join을 선택하는 조건, Build/Probe Phase 비용 계산 방식, PGA 메모리 영향, 실행 계획에서 확인하는 방법을 알아봐요.',

    mechanismTitle: '동작 원리',
    mechanismDesc:
      'Hash Join은 두 단계로 동작해요.\n\nBuild Phase: 더 작은 데이터 집합(빌드 입력)을 스캔하고, 조인 키에 해시 함수를 적용해서 PGA에 해시 테이블을 구축해요.\n\nProbe Phase: 더 큰 데이터 집합(프로브 입력)을 스캔하면서 동일한 해시 함수를 적용해 해시 테이블을 탐색하고 일치하는 행을 반환해요.\n\nHash Join은 반드시 등치(=) 조인 조건이 있어야 해요.',

    selectTitle: 'CBO 선택 조건',
    selectItems: [
      '상대적으로 많은 양의 데이터를 조인할 때 — 대용량 테이블 조인에 효율적이에요.',
      '등치(=) 조인 조건이 있을 때 — Hash Join은 등치 조건에서만 동작해요.',
      '빌드 입력이 PGA 메모리에 들어갈 수 있을 때 — 메모리 내 처리로 디스크 I/O를 피해요.',
      '각 데이터 집합을 한 번씩만 읽어도 되는 경우 — Nested Loop와 달리 반복 스캔이 없어요.',
    ],

    costTitle: '비용 계산 방식',
    costDesc:
      'Hash Join 비용 = 빌드 입력 스캔 비용 + 해시 테이블 구축 비용 + 프로브 입력 스캔 비용\n\n두 데이터 집합을 각각 한 번씩만 읽으므로 전체 비용은 O(N + M)이에요. 빌드 입력이 작을수록 해시 테이블 구축 비용이 낮아지므로, CBO는 더 작은 집합을 빌드 입력으로 선택해요.',

    pgaTitle: 'PGA 메모리 영향',
    pgaDesc:
      '해시 테이블이 PGA에 들어가지 않으면 Oracle은 임시 테이블스페이스로 분할해서 처리해요. 이 경우에도 각 데이터 집합은 최대 두 번만 읽어요.\n\nPGA_AGGREGATE_TARGET 파라미터로 PGA 크기를 충분히 설정하면 Hash Join이 디스크 사용 없이 메모리 내에서만 처리돼요.',
    pgaTable: [
      ['빌드 입력 ≤ PGA', '해시 테이블 전체 메모리 유지 — 디스크 I/O 없음', '가장 효율적'],
      ['빌드 입력 > PGA', '파티션 일부를 임시 테이블스페이스에 기록', '각 집합 최대 2회 읽기'],
    ],

    planTitle: '실행 계획에서 확인하는 방법',
    planDesc:
      'HASH JOIN 오퍼레이션의 첫 번째 자식이 빌드 입력, 두 번째 자식이 프로브 입력이에요.',
    planCaption: 'EXPLAIN PLAN — Hash Join (employees 빌드 → departments 프로브)',
    planOpTable: [
      ['HASH JOIN', '등치 Inner join'],
      ['HASH JOIN OUTER', 'Left/Right Outer join'],
      ['HASH JOIN FULL OUTER', 'Full Outer join (Oracle 11g+)'],
      ['HASH JOIN SEMI', '세미조인 (IN / EXISTS)'],
      ['HASH JOIN ANTI', '안티조인 (NOT IN / NOT EXISTS)'],
    ],

    hintTitle: '힌트',
    hintSql: `-- Hash Join 강제
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 방지
SELECT /*+ NO_USE_HASH(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
  },
  en: {
    title: 'Hash Join — CBO Perspective',
    subtitle:
      'Learn when the CBO chooses Hash Join, how Build/Probe Phase costs are calculated, how PGA memory affects the plan, and how to read the execution plan.',

    mechanismTitle: 'Mechanism',
    mechanismDesc:
      'Hash Join operates in two phases.\n\nBuild Phase: Oracle scans the smaller dataset (build input), applies a hash function to the join key, and constructs a hash table in PGA.\n\nProbe Phase: Oracle scans the larger dataset (probe input), applies the same hash function, and probes the hash table for matches.\n\nHash Join requires an equality (=) join condition.',

    selectTitle: 'When the CBO Chooses Hash Join',
    selectItems: [
      'Joining relatively large amounts of data — efficient for large table joins.',
      'An equality (=) join condition exists — Hash Join only works with equality.',
      'The build input fits in PGA memory — in-memory processing avoids disk I/O.',
      'Each dataset only needs to be read once — unlike Nested Loop, no repeated scanning.',
    ],

    costTitle: 'Cost Calculation',
    costDesc:
      'Hash Join cost = build input scan cost + hash table construction cost + probe input scan cost\n\nBecause each dataset is read only once, the overall complexity is O(N + M). The CBO selects the smaller dataset as the build input to minimize hash table construction cost.',

    pgaTitle: 'PGA Memory Impact',
    pgaDesc:
      "When the hash table doesn't fit in PGA, Oracle partitions it and spills to the temporary tablespace. Even then, each dataset is read at most twice.\n\nSetting PGA_AGGREGATE_TARGET high enough allows Hash Join to run entirely in memory.",
    pgaTable: [
      ['Build input ≤ PGA', 'Entire hash table stays in memory — no disk I/O', 'Most efficient'],
      ['Build input > PGA', 'Some partitions written to temporary tablespace', 'Each dataset read at most twice'],
    ],

    planTitle: 'Verifying in the Execution Plan',
    planDesc:
      'The first child of HASH JOIN is the build input; the second child is the probe input.',
    planCaption: 'EXPLAIN PLAN — Hash Join (employees build → departments probe)',
    planOpTable: [
      ['HASH JOIN', 'Equality inner join'],
      ['HASH JOIN OUTER', 'Left/right outer join'],
      ['HASH JOIN FULL OUTER', 'Full outer join (Oracle 11g+)'],
      ['HASH JOIN SEMI', 'Semijoin (IN / EXISTS)'],
      ['HASH JOIN ANTI', 'Antijoin (NOT IN / NOT EXISTS)'],
    ],

    hintTitle: 'Hints',
    hintSql: `-- Force Hash Join
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress
SELECT /*+ NO_USE_HASH(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 107, cost: 7, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 107, cost: 7, time: '00:00:01',
    note: '첫 번째 자식(EMPLOYEES)이 빌드 입력 — PGA에 해시 테이블 구축. 두 번째(DEPARTMENTS)가 프로브 입력이에요.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 107, cost: 3, time: '00:00:01',
    note: '빌드 입력: 더 작은 집합. 전체 스캔 후 PGA 해시 테이블에 적재돼요.' },
  { id: 3, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, time: '00:00:01',
    note: '프로브 입력: 해시 테이블을 탐색하며 일치하는 행을 찾아요.' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 107, cost: 7, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 107, cost: 7, time: '00:00:01',
    note: 'First child (EMPLOYEES) is the build input — loaded into a PGA hash table. Second child (DEPARTMENTS) is the probe input.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 107, cost: 3, time: '00:00:01',
    note: 'Build input: smaller dataset. Fully scanned then loaded into the PGA hash table.' },
  { id: 3, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, time: '00:00:01',
    note: 'Probe input: scanned while probing the hash table for matches.' },
]

export function OptimizerJoinHashPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const planRows = lang === 'ko' ? PLAN_ROWS_KO : PLAN_ROWS_EN
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-amber" />}
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
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber/10 font-mono text-[10px] font-bold text-amber">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink-2">{item}</p>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.costTitle}</SectionTitle>
      <Prose>{t.costDesc}</Prose>

      <Divider />

      <SectionTitle>{t.pgaTitle}</SectionTitle>
      <Prose>{t.pgaDesc}</Prose>
      <Table
        headers={[
          isKo ? '조건' : 'Condition',
          isKo ? '처리 방식' : 'Behavior',
          isKo ? '효율' : 'Efficiency',
        ]}
        rows={t.pgaTable}
      />

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
