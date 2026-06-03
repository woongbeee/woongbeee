import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { IconPlayerPlay } from '@tabler/icons-react'
import { Divider } from '../../shared'
import type { PlanRow } from '../shared/diagrams'
import { ExplainPlanTable } from '../shared/diagrams'

interface AnnotatedLine {
  line: string
  noteKo?: string
  noteEn?: string
}

interface SimQuery {
  id: number
  labelKo: string
  labelEn: string
  difficulty: 'simple' | 'medium' | 'complex'
  sql: string
  planRows: PlanRow[]
  showStats: boolean
  predicatesKo: string[]
  predicatesEn: string[]
  projectionKo: string[]
  projectionEn: string[]
  statsKo: string[]
  statsEn: string[]
  reasonKo: string
  reasonEn: string
  callStatsKo: string
  callStatsEn: string
  // 영역별 row 설명
  callStatsAnnotations?: AnnotatedLine[]
  predicateAnnotations?: AnnotatedLine[]
  projectionAnnotations?: AnnotatedLine[]
  statsAnnotations?: AnnotatedLine[]
}

// ── 헬퍼: 조건절/프로젝션/통계 블록 렌더러 ───────────────────────────────────

function DarkBlock({ lines, color = '#94a3b8' }: { lines: string[]; color?: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-[#0f172a] px-5 py-4 font-mono text-xs leading-relaxed">
      {lines.map((l, i) => (
        <span key={i} className="block whitespace-pre" style={{ color }}>
          {l || ' '}
        </span>
      ))}
    </pre>
  )
}

function AnnotationPanel({ annotations, lang }: { annotations: AnnotatedLine[]; lang: 'ko' | 'en' }) {
  const rows = annotations.filter((a) => (lang === 'ko' ? a.noteKo : a.noteEn))
  if (rows.length === 0) return null
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/20">
      <div className="border-b border-sky-200 bg-sky-100/60 px-4 py-2 dark:border-sky-900/40 dark:bg-sky-900/20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          {lang === 'ko' ? '라인별 설명' : 'Line-by-line Notes'}
        </span>
      </div>
      <div className="divide-y divide-sky-100 dark:divide-sky-900/30">
        {rows.map((a, i) => (
          <div key={i} className="flex gap-3 px-4 py-2.5">
            <code className="mt-0.5 shrink-0 max-w-[180px] truncate rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              {a.line}
            </code>
            <span className="text-xs leading-relaxed text-foreground/70">
              {lang === 'ko' ? a.noteKo : a.noteEn}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanAreaBlock({
  num,
  labelKo,
  labelEn,
  lang,
  children,
}: {
  num: string
  labelKo: string
  labelEn: string
  lang: 'ko' | 'en'
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
        <span className="text-base font-bold text-slate-700 dark:text-slate-200">{num}</span>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {lang === 'ko' ? labelKo : labelEn}
        </span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// ── 쿼리 데이터 ───────────────────────────────────────────────────────────────

const QUERIES: SimQuery[] = [
  // ── Q1: PK로 단건 조회 ──────────────────────────────────────────────────────
  {
    id: 1,
    labelKo: 'Q1. PK 단건 조회',
    labelEn: 'Q1. PK Single Row Lookup',
    difficulty: 'simple',
    sql: `SELECT employee_id, first_name, last_name, salary
FROM   hr.employees
WHERE  employee_id = 100;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT',            rows: 1,  cost: 1,  time: '00:00:01' },
      { id: 1, depth: 1, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 1, cost: 1, time: '00:00:01',
        actualRows: 1, cr: 2, pr: 0, elapsed: '00:00:00.01',
        note: '가장 먼저 실행. INDEX UNIQUE SCAN 결과 ROWID로 테이블 1블록 접근.' },
      { id: 2, depth: 2, operation: 'INDEX UNIQUE SCAN',           name: 'EMP_EMP_ID_PK', rows: 1, cost: 0, time: '00:00:01',
        actualRows: 1, cr: 1, pr: 0, elapsed: '00:00:00.01',
        note: '가장 먼저 실행. EMPLOYEE_ID=100으로 PK 인덱스를 Unique Scan.' },
    ],
    showStats: true,
    predicatesKo: [
      '   2 - access("EMPLOYEE_ID"=100)',
    ],
    predicatesEn: [
      '   2 - access("EMPLOYEE_ID"=100)',
    ],
    projectionKo: [
      '   1 - output: [EMPLOYEE_ID, FIRST_NAME, LAST_NAME, SALARY]',
      '   2 - output: [ROWID, EMPLOYEE_ID]',
    ],
    projectionEn: [
      '   1 - output: [EMPLOYEE_ID, FIRST_NAME, LAST_NAME, SALARY]',
      '   2 - output: [ROWID, EMPLOYEE_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  2',
      'physical reads       =  0',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  1',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  2',
      'physical reads       =  0',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  1',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     0      2        0     1
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     0      2        0     1`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     0      2        0     1
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     0      2        0     1`,
    reasonKo: `EMPLOYEE_ID는 EMPLOYEES 테이블의 Primary Key예요.
PK 컬럼에는 Oracle이 자동으로 Unique 인덱스(EMP_EMP_ID_PK)를 생성해요.

CBO는 등치 조건(= 100)으로 PK 인덱스를 조회하면
정확히 0 또는 1건만 반환됨을 알기 때문에 INDEX UNIQUE SCAN을 선택해요.
Index Range Scan이 아닌 Unique Scan인 이유는 Unique 인덱스에 = 조건이기 때문이에요.

실행 순서: ② INDEX UNIQUE SCAN → ① TABLE ACCESS BY INDEX ROWID → ⓪ SELECT STATEMENT
  인덱스에서 ROWID 1개를 꺼내 테이블 블록 1개만 접근해요.
  consistent gets = 2 (인덱스 1 + 테이블 1), physical reads = 0 (캐시 히트).

이것이 Oracle에서 가장 효율적인 단건 조회 패턴이에요.`,
    reasonEn: `EMPLOYEE_ID is the Primary Key of the EMPLOYEES table.
Oracle automatically creates a Unique index (EMP_EMP_ID_PK) on every PK column.

Because the predicate is an equality condition (= 100) on a Unique index,
the CBO knows exactly 0 or 1 row will be returned, so it chooses INDEX UNIQUE SCAN —
not Index Range Scan, because the index is Unique and the condition is equality.

Execution order: ② INDEX UNIQUE SCAN → ① TABLE ACCESS BY INDEX ROWID → ⓪ SELECT STATEMENT
  One ROWID is retrieved from the index; one table block is visited.
  consistent gets = 2 (1 index + 1 table), physical reads = 0 (cache hit).

This is the most efficient single-row lookup pattern in Oracle.`,
    callStatsAnnotations: [
      { line: 'Parse  1  0.00  0.00  0  0  0  0', noteKo: 'Parse 1회. CPU·Elapsed 모두 0.00초 → Library Cache에 이미 계획이 있어 Soft Parse가 발생했어요. Disk·Query 모두 0 — 파싱 단계에서는 데이터 블록을 읽지 않아요.', noteEn: 'Parse ran once. Both CPU and Elapsed are 0.00s → the plan was already in the Library Cache (Soft Parse). Disk and Query are 0 — no data blocks are read during parse.' },
      { line: 'Fetch  1  0.00  0.00  0  2  0  1', noteKo: 'Fetch 1회 호출로 1행 반환. Query=2 → 논리 블록 2개 읽음(인덱스 1 + 테이블 1). Disk=0 → 모두 Buffer Cache 히트. 단건 PK 조회에서 이 이상 효율적인 수치는 없어요.', noteEn: '1 Fetch call returned 1 row. Query=2 → 2 logical blocks read (1 index + 1 table). Disk=0 → full Buffer Cache hit. You cannot get more efficient than this for a single-row PK lookup.' },
    ],
    predicateAnnotations: [
      { line: '2 - access("EMPLOYEE_ID"=100)', noteKo: 'Op 2(INDEX UNIQUE SCAN)에서 EMPLOYEE_ID=100이 access 조건이에요. access는 인덱스의 탐색 시작/종료 범위를 결정한다는 뜻으로, 인덱스 블록을 수직으로 내려가 정확히 이 값을 찾아요. filter가 아닌 access인 이유: 인덱스의 선두(유일) 컬럼에 등치 조건이므로 인덱스 구조 자체로 위치를 결정할 수 있기 때문이에요.', noteEn: 'Op 2 (INDEX UNIQUE SCAN) uses EMPLOYEE_ID=100 as an access predicate. access means the predicate determines the index scan range — Oracle traverses the B-tree vertically to locate this exact value. It is access (not filter) because an equality condition on the leading (unique) column lets the index structure pinpoint the entry directly.' },
    ],
    projectionAnnotations: [
      { line: '1 - output: [EMPLOYEE_ID, FIRST_NAME, LAST_NAME, SALARY]', noteKo: 'Op 1(TABLE ACCESS)이 최종적으로 SELECT 절에 필요한 4개 컬럼을 출력해요. Oracle은 필요한 컬럼만 프로젝션하므로 테이블에서 모든 컬럼을 읽지 않아요.', noteEn: 'Op 1 (TABLE ACCESS) projects exactly the 4 columns needed by the SELECT clause. Oracle reads only what is needed — this is column pruning in action.' },
      { line: '2 - output: [ROWID, EMPLOYEE_ID]', noteKo: 'Op 2(INDEX UNIQUE SCAN)는 ROWID(테이블 블록 주소)와 인덱스 키(EMPLOYEE_ID)만 출력합니다. FIRST_NAME, SALARY 등은 인덱스에 없으므로 상위 Op 1이 ROWID로 테이블을 직접 읽어 나머지 컬럼을 가져옵니다.', noteEn: 'Op 2 (INDEX UNIQUE SCAN) outputs only ROWID (block address) and the index key EMPLOYEE_ID. FIRST_NAME, SALARY, etc. are not in the index, so parent Op 1 uses the ROWID to fetch the full row from the table.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      =  2', noteKo: '논리 읽기 2블록. 인덱스 1블록 + 테이블 1블록. PK 단건 조회의 이론적 최솟값이에요.', noteEn: '2 logical block reads: 1 index block + 1 table block. This is the theoretical minimum for a PK single-row lookup.' },
      { line: 'physical reads       =  0', noteKo: '물리 읽기 0. 2개 블록 모두 Buffer Cache에서 즉시 찾았어요. 자주 조회하는 작은 테이블은 이처럼 항상 PR=0을 기대할 수 있어요.', noteEn: 'No physical reads. Both blocks were found in the Buffer Cache immediately. For small frequently-accessed tables, PR=0 is the expected steady-state.' },
      { line: 'rows processed       =  1', noteKo: '최종 반환 행 수 = 1. PK 등치 조건은 항상 0 또는 1행만 반환합니다.', noteEn: '1 row returned to the client. A PK equality predicate always returns 0 or 1 row.' },
    ],
  },

  // ── Q2: 비선두 컬럼 FTS — 인덱스 없는 컬럼 조회 ──────────────────────────
  {
    id: 2,
    labelKo: 'Q2. 인덱스 없는 컬럼 조회 → FTS',
    labelEn: 'Q2. Non-indexed Column → FTS',
    difficulty: 'simple',
    sql: `SELECT employee_id, last_name, salary, department_id
FROM   hr.employees
WHERE  salary > 10000;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 5, cost: 3, time: '00:00:01' },
      { id: 1, depth: 1, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 5, cost: 3, time: '00:00:01',
        actualRows: 6, cr: 8, pr: 3, elapsed: '00:00:00.04',
        note: '가장 먼저 실행. SALARY 인덱스가 없어 전체 테이블을 스캔.' },
    ],
    showStats: true,
    predicatesKo: [
      '   1 - filter("SALARY">10000)',
    ],
    predicatesEn: [
      '   1 - filter("SALARY">10000)',
    ],
    projectionKo: [
      '   1 - output: [EMPLOYEE_ID, LAST_NAME, SALARY, DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [EMPLOYEE_ID, LAST_NAME, SALARY, DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  8',
      'physical reads       =  3',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  6',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  8',
      'physical reads       =  3',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  6',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     3      8        0     6
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     3      8        0     6`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     3      8        0     6
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     3      8        0     6`,
    reasonKo: `SALARY 컬럼에는 인덱스가 없어요.
인덱스 없이 WHERE SALARY > 10000 조건을 적용하려면
테이블의 모든 블록을 읽어야 해요 → TABLE ACCESS FULL.

Predicate Information에서 filter로 표시된 것에 주목하세요.
access가 아닌 filter인 이유: 인덱스 탐색 범위를 결정하는 것이 아니라,
전체 행을 읽어온 후 조건을 적용해서 버리는 방식이기 때문이에요.

설령 SALARY 인덱스가 있더라도, 전체 15행 중 6행(40%)이 조건을 만족하면
CBO는 FTS가 인덱스보다 저렴하다고 판단할 수 있어요(소규모 테이블).
선택도가 낮은(많은 행이 반환되는) 범위 조건에서는 FTS가 정상적인 선택이에요.`,
    reasonEn: `There is no index on the SALARY column.
Without an index, evaluating WHERE SALARY > 10000 requires
reading every block of the table → TABLE ACCESS FULL.

Notice in the Predicate Information that the condition appears as filter, not access.
It is a filter — not access — because it is not used to determine
an index scan range; instead, all rows are read first and then tested.

Even if a SALARY index existed, with 6 of 15 rows (40%) matching,
the CBO might still choose FTS over the index (especially for a small table).
Range predicates with low selectivity (many rows returned) often make FTS the cheaper choice.`,
    callStatsAnnotations: [
      { line: 'Fetch  1  0.00  0.00  3  8  0  6', noteKo: 'Disk=3 → 8개 논리 블록 중 3개가 Buffer Cache에 없어 디스크에서 읽었어요. FTS는 처음 실행 시 PR이 높고, 재실행하면 블록이 캐시에 올라와 PR=0이 되는 것이 정상이에요.', noteEn: 'Disk=3 → 3 of the 8 logical blocks were not in the Buffer Cache and required disk reads. FTS typically has high PR on first run; a second run usually sees PR=0 as all blocks are now cached.' },
    ],
    predicateAnnotations: [
      { line: '1 - filter("SALARY">10000)', noteKo: 'Op 1(TABLE ACCESS FULL)에서 SALARY>10000이 filter예요. filter는 "블록을 이미 읽은 후 행 단위로 조건을 검사한다"는 뜻이에요. access와 달리 스캔 범위를 좁히지 못하므로 전체 블록을 읽은 뒤 해당 조건을 만족하지 않는 행은 버려져요.', noteEn: 'Op 1 (TABLE ACCESS FULL) uses SALARY>10000 as a filter. A filter is applied row-by-row after the block has already been read — it cannot narrow the scan range like access can. All blocks are read first; non-matching rows are discarded afterwards.' },
    ],
    projectionAnnotations: [
      { line: '1 - output: [EMPLOYEE_ID, LAST_NAME, SALARY, DEPARTMENT_ID]', noteKo: 'FTS이므로 인덱스 단계가 없고 TABLE ACCESS 단 하나만 있어요. SELECT 절의 4개 컬럼만 프로젝션하며, 나머지 컬럼(FIRST_NAME, HIRE_DATE 등)은 읽지 않아요.', noteEn: 'No index step — only the TABLE ACCESS operation exists. Oracle projects exactly the 4 columns in the SELECT clause; other columns (FIRST_NAME, HIRE_DATE, etc.) are not read from the row.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      =  8', noteKo: '논리 읽기 8블록. EMPLOYEES 전체 테이블 크기에 해당해요. FTS는 인덱스 없이 모든 블록을 읽으므로 테이블 크기 = CR 값이에요.', noteEn: '8 logical block reads — the total size of the EMPLOYEES table. FTS reads every block, so CR ≈ table block count.' },
      { line: 'physical reads       =  3', noteKo: '3블록은 디스크에서 읽었어요. 재실행하면 이 값이 0으로 줄어드는 것을 볼 수 있어요(Buffer Cache warming).', noteEn: '3 blocks required physical disk reads. Run the query a second time and this will drop to 0 as the blocks are now in the Buffer Cache.' },
      { line: 'rows processed       =  6', noteKo: '15행 중 SALARY>10000인 6행만 최종 반환. 나머지 9행은 읽었지만 filter에서 제거됐어요.', noteEn: '6 of 15 rows passed the SALARY>10000 filter and were returned. The other 9 rows were read from disk but discarded.' },
    ],
  },

  // ── Q3: Index Range Scan — 부서 조회 ──────────────────────────────────────
  {
    id: 3,
    labelKo: 'Q3. 외래키 컬럼 Range Scan',
    labelEn: 'Q3. Foreign Key Column Range Scan',
    difficulty: 'simple',
    sql: `SELECT employee_id, last_name, job_id, salary
FROM   hr.employees
WHERE  department_id = 80;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 2, cost: 2, time: '00:00:01' },
      { id: 1, depth: 1, operation: 'TABLE ACCESS BY INDEX ROWID BATCHED', name: 'EMPLOYEES', rows: 2, cost: 2, time: '00:00:01',
        actualRows: 2, cr: 4, pr: 1, elapsed: '00:00:00.02',
        note: '두 번째 실행. INDEX RANGE SCAN 결과 ROWID 배치로 테이블 접근.' },
      { id: 2, depth: 2, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPARTMENT_IX', rows: 2, cost: 1, time: '00:00:01',
        actualRows: 2, cr: 2, pr: 1, elapsed: '00:00:00.01',
        note: '가장 먼저 실행. DEPARTMENT_ID=80인 ROWID 목록을 인덱스에서 수집.' },
    ],
    showStats: true,
    predicatesKo: [
      '   1 - filter("DEPARTMENT_ID"=80)',
      '   2 - access("DEPARTMENT_ID"=80)',
    ],
    predicatesEn: [
      '   1 - filter("DEPARTMENT_ID"=80)',
      '   2 - access("DEPARTMENT_ID"=80)',
    ],
    projectionKo: [
      '   1 - output: [EMPLOYEE_ID, LAST_NAME, JOB_ID, SALARY]',
      '   2 - output: [ROWID, DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [EMPLOYEE_ID, LAST_NAME, JOB_ID, SALARY]',
      '   2 - output: [ROWID, DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  4',
      'physical reads       =  1',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  2',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  4',
      'physical reads       =  1',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  2',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     1      4        0     2
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     1      4        0     2`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     1      4        0     2
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     1      4        0     2`,
    reasonKo: `DEPARTMENT_ID는 외래키 컬럼이에요.
Oracle은 FK 컬럼에 자동으로 인덱스를 생성하지 않지만,
DBA가 EMP_DEPARTMENT_IX 인덱스를 별도로 생성한 상태예요.

DEPARTMENT_ID = 80 등치 조건이지만 Unique 인덱스가 아니므로
(한 부서에 여러 직원이 있을 수 있음) INDEX RANGE SCAN이 선택돼요.
UNIQUE SCAN은 Unique 인덱스에서만 사용해요.

Predicate Information에서 2번 오퍼레이션에 access와 filter가 모두 있어요:
  access("DEPARTMENT_ID"=80) — 인덱스 탐색 범위를 80으로 고정
  1번의 filter("DEPARTMENT_ID"=80) — 테이블 접근 후 재확인 (안전 장치)

BATCHED 방식: ROWID를 모아 블록 단위로 테이블을 읽어 Random I/O를 줄여요.`,
    reasonEn: `DEPARTMENT_ID is a foreign key column.
Oracle does not automatically create indexes on FK columns,
but a DBA has explicitly created EMP_DEPARTMENT_IX here.

Even though the predicate is an equality (= 80), INDEX RANGE SCAN is used —
not INDEX UNIQUE SCAN — because the index is not Unique
(multiple employees can belong to the same department).
INDEX UNIQUE SCAN is only available on Unique indexes.

Predicate Information shows both access and filter on operation 2:
  access("DEPARTMENT_ID"=80) — pins the index scan range to 80
  filter on op 1 ("DEPARTMENT_ID"=80) — re-checked after table access (safety net)

BATCHED mode: ROWIDs are collected in a batch before hitting the table,
reducing random I/O by reading table blocks more efficiently.`,
    callStatsAnnotations: [
      { line: 'Fetch  1  0.00  0.00  1  4  0  2', noteKo: 'Query=4 → 논리 블록 4개(인덱스 2 + 테이블 2). Disk=1 → 첫 실행이라 인덱스 블록 1개가 캐시에 없었어요. BATCHED 방식으로 ROWID를 모아 처리했으므로 테이블 랜덤 I/O가 최소화돼요.', noteEn: 'Query=4 → 4 logical blocks (2 index + 2 table). Disk=1 → one index block was not cached on first run. BATCHED mode collected ROWIDs before probing the table, minimising random table I/O.' },
    ],
    predicateAnnotations: [
      { line: '2 - access("DEPARTMENT_ID"=80)', noteKo: 'Op 2(INDEX RANGE SCAN)에서 DEPARTMENT_ID=80이 access — 인덱스의 탐색 시작점과 끝점을 모두 80으로 고정해요. B-Tree 인덱스에서 DEPARTMENT_ID=80인 리프 블록 범위만 읽어요.', noteEn: 'Op 2 (INDEX RANGE SCAN): DEPARTMENT_ID=80 is an access predicate — it pins both the start and end of the B-tree scan range to 80. Only leaf blocks containing DEPARTMENT_ID=80 entries are read.' },
      { line: '1 - filter("DEPARTMENT_ID"=80)', noteKo: 'Op 1(TABLE ACCESS)에서 동일 조건이 filter로 다시 나와요. 인덱스 스캔 후 테이블 행을 읽어올 때 Oracle이 한 번 더 값을 확인하는 안전 장치예요. Unique 인덱스가 아닌 경우 이 패턴이 흔해요.', noteEn: 'Op 1 (TABLE ACCESS) re-checks the same condition as a filter. After reading a table row via ROWID, Oracle verifies DEPARTMENT_ID=80 once more as a safety net. This double-check pattern is common with non-unique indexes.' },
    ],
    projectionAnnotations: [
      { line: '1 - output: [EMPLOYEE_ID, LAST_NAME, JOB_ID, SALARY]', noteKo: 'TABLE ACCESS 단계에서 SELECT 절에 필요한 4개 컬럼을 출력해요. DEPARTMENT_ID는 이미 인덱스에서 확인했으므로 여기선 포함되지 않아요.', noteEn: 'TABLE ACCESS projects the 4 columns required by SELECT. DEPARTMENT_ID was already verified by the index and is not passed up again.' },
      { line: '2 - output: [ROWID, DEPARTMENT_ID]', noteKo: 'INDEX RANGE SCAN은 ROWID와 인덱스 키(DEPARTMENT_ID)만 출력합니다. 상위 TABLE ACCESS가 ROWID를 받아 테이블에서 나머지 컬럼을 조회합니다.', noteEn: 'INDEX RANGE SCAN outputs only ROWID and the index key DEPARTMENT_ID. The parent TABLE ACCESS uses ROWID to fetch the remaining columns from the table.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      =  4', noteKo: '논리 블록 4개: 인덱스 2(루트→리프) + 테이블 2(배치된 2개 ROWID). Q1의 2블록보다 많지만 FTS의 8블록보다 훨씬 적어요.', noteEn: '4 logical blocks: 2 index (root→leaf) + 2 table (batched ROWID lookups). More than Q1\'s 2 blocks, but far less than FTS\'s 8 blocks.' },
      { line: 'physical reads       =  1', noteKo: '인덱스 블록 1개가 처음으로 읽혀 디스크 I/O 1회 발생. 재실행하면 0이 됩니다.', noteEn: '1 index block was read from disk on this first run. PR will be 0 on subsequent executions.' },
    ],
  },

  // ── Q4: Nested Loop Join — 두 테이블 PK/FK 조인 ───────────────────────────
  {
    id: 4,
    labelKo: 'Q4. NL Join — 직원 + 부서',
    labelEn: 'Q4. NL Join — Employee + Department',
    difficulty: 'medium',
    sql: `SELECT e.employee_id, e.last_name, d.department_name, e.salary
FROM   hr.employees   e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.employee_id = 103;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT',            rows: 1,  cost: 2,  time: '00:00:01' },
      { id: 1, depth: 1, operation: 'NESTED LOOPS',                rows: 1,  cost: 2,  time: '00:00:01',
        actualRows: 1, cr: 4, pr: 0, elapsed: '00:00:00.01' },
      { id: 2, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES',  rows: 1, cost: 1, time: '00:00:01',
        actualRows: 1, cr: 2, pr: 0, elapsed: '00:00:00.01',
        note: '두 번째 실행. PK 인덱스로 EMPLOYEE_ID=103 단건 조회.' },
      { id: 3, depth: 3, operation: 'INDEX UNIQUE SCAN',           name: 'EMP_EMP_ID_PK', rows: 1, cost: 0, time: '00:00:01',
        actualRows: 1, cr: 1, pr: 0, elapsed: '00:00:00.01',
        note: '가장 먼저 실행. EMPLOYEE_ID=103으로 PK 인덱스 Unique Scan.' },
      { id: 4, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'DEPARTMENTS', rows: 1, cost: 1, time: '00:00:01',
        actualRows: 1, cr: 2, pr: 0, elapsed: '00:00:00.01',
        note: '세 번째 실행. EMPLOYEES의 DEPARTMENT_ID로 DEPARTMENTS PK 조회.' },
      { id: 5, depth: 3, operation: 'INDEX UNIQUE SCAN',           name: 'DEPT_ID_PK',    rows: 1, cost: 0, time: '00:00:01',
        actualRows: 1, cr: 1, pr: 0, elapsed: '00:00:00.01',
        note: '세 번째 실행. DEPARTMENT_ID로 DEPARTMENTS PK Unique Scan.' },
    ],
    showStats: true,
    predicatesKo: [
      '   3 - access("E"."EMPLOYEE_ID"=103)',
      '   5 - access("D"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")',
    ],
    predicatesEn: [
      '   3 - access("E"."EMPLOYEE_ID"=103)',
      '   5 - access("D"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")',
    ],
    projectionKo: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, D.DEPARTMENT_NAME, E.SALARY]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID]',
      '   3 - output: [ROWID, E.EMPLOYEE_ID]',
      '   4 - output: [D.DEPARTMENT_NAME]',
      '   5 - output: [ROWID, D.DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, D.DEPARTMENT_NAME, E.SALARY]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID]',
      '   3 - output: [ROWID, E.EMPLOYEE_ID]',
      '   4 - output: [D.DEPARTMENT_NAME]',
      '   5 - output: [ROWID, D.DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  4',
      'physical reads       =  0',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  1',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  4',
      'physical reads       =  0',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  1',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     0      4        0     1
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     0      4        0     1`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     0      4        0     1
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     0      4        0     1`,
    reasonKo: `WHERE employee_id = 103 은 정확히 1건만 반환하는 PK 조건이에요.
드라이빙 결과가 1건이므로 CBO는 Nested Loop Join을 선택해요.

실행 순서: ③ → ② → ⑤ → ④ → ① → ⓪

  ③ INDEX UNIQUE SCAN (EMP_EMP_ID_PK)
    EMPLOYEE_ID=103으로 PK 인덱스를 찾아 ROWID 획득.

  ② TABLE ACCESS BY INDEX ROWID (EMPLOYEES)
    ROWID로 테이블 1행 접근 → DEPARTMENT_ID(=60) 값을 꺼냄.

  ⑤ INDEX UNIQUE SCAN (DEPT_ID_PK)
    ②에서 얻은 DEPARTMENT_ID=60으로 DEPARTMENTS PK를 탐색.

  ④ TABLE ACCESS BY INDEX ROWID (DEPARTMENTS)
    ROWID로 DEPARTMENTS 1행 접근 → DEPARTMENT_NAME 획득.

Hash Join 대신 Nested Loop를 선택한 이유:
  드라이빙 결과가 1건이므로 DEPARTMENTS를 1번만 탐색하면 돼요.
  Hash Join은 해시 테이블 구성 오버헤드가 있어 소량 조인에 불리해요.
  consistent gets = 4(인덱스 2 + 테이블 2), physical reads = 0.`,
    reasonEn: `WHERE employee_id = 103 returns exactly one row — it's a PK equality condition.
With only one driving row, the CBO chooses Nested Loop Join.

Execution order: ③ → ② → ⑤ → ④ → ① → ⓪

  ③ INDEX UNIQUE SCAN (EMP_EMP_ID_PK)
    Locates ROWID for EMPLOYEE_ID=103 in the PK index.

  ② TABLE ACCESS BY INDEX ROWID (EMPLOYEES)
    Fetches one row using the ROWID → retrieves DEPARTMENT_ID(=60).

  ⑤ INDEX UNIQUE SCAN (DEPT_ID_PK)
    Probes DEPARTMENTS PK index with DEPARTMENT_ID=60 obtained from step ②.

  ④ TABLE ACCESS BY INDEX ROWID (DEPARTMENTS)
    Fetches one DEPARTMENTS row via ROWID → retrieves DEPARTMENT_NAME.

Why Nested Loop instead of Hash Join?
  The driving side returns only 1 row, so DEPARTMENTS is probed just once.
  Hash Join has hash table construction overhead — inefficient for tiny row counts.
  consistent gets = 4 (2 index + 2 table), physical reads = 0.`,
    predicateAnnotations: [
      { line: '3 - access("E"."EMPLOYEE_ID"=103)', noteKo: 'Op 3(INDEX UNIQUE SCAN, EMP_EMP_ID_PK)에서 EMPLOYEE_ID=103으로 PK 인덱스를 수직 탐색해요. Unique 인덱스 + 등치 조건 → UNIQUE SCAN.', noteEn: 'Op 3 (INDEX UNIQUE SCAN on EMP_EMP_ID_PK): traverses the PK index vertically to find EMPLOYEE_ID=103. Unique index + equality = UNIQUE SCAN.' },
      { line: '5 - access("D"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")', noteKo: 'Op 5(INDEX UNIQUE SCAN, DEPT_ID_PK)에서 Op 2가 꺼낸 DEPARTMENT_ID 값을 DEPARTMENTS PK로 탐색해요. 이 값은 쿼리 파싱 시에는 모르고, 런타임에 Op 2 결과로부터 받아요(NL의 핵심: 드라이빙 행마다 이너를 탐색).', noteEn: 'Op 5 (INDEX UNIQUE SCAN on DEPT_ID_PK): probes DEPARTMENTS PK with the DEPARTMENT_ID value fetched by Op 2. This value is not known at parse time — it is supplied at runtime from the driving row (the core of Nested Loop: probe inner once per driving row).' },
    ],
    projectionAnnotations: [
      { line: '2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID]', noteKo: 'EMPLOYEES 테이블에서 4개 컬럼을 꺼내요. 이 중 DEPARTMENT_ID가 다음 단계(Op 5)의 조인 키로 전달돼요.', noteEn: 'Fetches 4 columns from EMPLOYEES. DEPARTMENT_ID among them is passed to Op 5 as the join key for the next probe.' },
      { line: '4 - output: [D.DEPARTMENT_NAME]', noteKo: 'DEPARTMENTS 테이블에서 DEPARTMENT_NAME 하나만 꺼내요. 나머지 컬럼(MANAGER_ID, LOCATION_ID 등)은 SELECT 절에 없으므로 읽지 않아요.', noteEn: 'Only DEPARTMENT_NAME is projected from DEPARTMENTS. Other columns (MANAGER_ID, LOCATION_ID, etc.) are not in the SELECT clause and are not read.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      =  4', noteKo: '논리 블록 4개: 인덱스 1(EMP PK) + 테이블 1(EMPLOYEES) + 인덱스 1(DEPT PK) + 테이블 1(DEPARTMENTS). 2개 테이블 조인 최솟값이에요.', noteEn: '4 logical blocks: 1 index (EMP PK) + 1 table (EMPLOYEES) + 1 index (DEPT PK) + 1 table (DEPARTMENTS). The minimum possible for a two-table join via PK.' },
      { line: 'sorts (memory)       =  0', noteKo: 'Nested Loop Join은 정렬이 필요 없으므로 sorts=0. Hash Join은 해시 테이블 구성, Sort Merge Join은 정렬 단계가 필요해요.', noteEn: 'Nested Loop Join requires no sorting → sorts=0. Hash Join needs to build a hash table; Sort Merge Join needs explicit sort steps.' },
    ],
  },

  // ── Q5: Hash Join — 부서별 급여 집계 ─────────────────────────────────────
  {
    id: 5,
    labelKo: 'Q5. Hash Join + GROUP BY 집계',
    labelEn: 'Q5. Hash Join + GROUP BY Aggregate',
    difficulty: 'medium',
    sql: `SELECT d.department_name,
       COUNT(e.employee_id) AS headcount,
       ROUND(AVG(e.salary), 0) AS avg_salary,
       MAX(e.salary)           AS max_salary
FROM   hr.employees   e
JOIN   hr.departments d ON e.department_id = d.department_id
GROUP BY d.department_name
ORDER BY avg_salary DESC;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT',  rows: 14, cost: 8, time: '00:00:01' },
      { id: 1, depth: 1, operation: 'SORT ORDER BY',     rows: 14, cost: 8, time: '00:00:01',
        actualRows: 14, cr: 18, pr: 5, pw: 0, elapsed: '00:00:00.08' },
      { id: 2, depth: 2, operation: 'HASH GROUP BY',     rows: 14, cost: 7, time: '00:00:01',
        actualRows: 14, cr: 18, pr: 5, pw: 0, elapsed: '00:00:00.07',
        note: '세 번째 실행. HASH JOIN 결과를 department_name으로 그룹 집계.' },
      { id: 3, depth: 3, operation: 'HASH JOIN',         rows: 15, cost: 6, time: '00:00:01',
        actualRows: 15, cr: 18, pr: 5, pw: 0, elapsed: '00:00:00.06',
        note: '두 번째 실행. DEPARTMENTS(소) → 해시 테이블, EMPLOYEES(대) → Probe.' },
      { id: 4, depth: 4, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 20, cost: 3, time: '00:00:01',
        actualRows: 20, cr: 8, pr: 3, pw: 0, elapsed: '00:00:00.03',
        note: '가장 먼저 실행. DEPARTMENTS 전체를 읽어 해시 테이블 구성(Build Input).' },
      { id: 5, depth: 4, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES',   rows: 15, cost: 3, time: '00:00:01',
        actualRows: 15, cr: 10, pr: 2, pw: 0, elapsed: '00:00:00.02',
        note: '두 번째 실행. EMPLOYEES 전체를 읽으며 해시 테이블을 Probe.' },
    ],
    showStats: true,
    predicatesKo: [
      '   3 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")',
    ],
    predicatesEn: [
      '   3 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")',
    ],
    projectionKo: [
      '   1 - output: [D.DEPARTMENT_NAME, COUNT(E.EMPLOYEE_ID), ROUND(AVG(E.SALARY),0), MAX(E.SALARY)]',
      '   2 - output: [D.DEPARTMENT_NAME, COUNT(E.EMPLOYEE_ID), SUM(E.SALARY), COUNT(*), MAX(E.SALARY)]',
      '   3 - output: [D.DEPARTMENT_NAME, E.EMPLOYEE_ID, E.SALARY]',
      '   4 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME]',
      '   5 - output: [E.EMPLOYEE_ID, E.SALARY, E.DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [D.DEPARTMENT_NAME, COUNT(E.EMPLOYEE_ID), ROUND(AVG(E.SALARY),0), MAX(E.SALARY)]',
      '   2 - output: [D.DEPARTMENT_NAME, COUNT(E.EMPLOYEE_ID), SUM(E.SALARY), COUNT(*), MAX(E.SALARY)]',
      '   3 - output: [D.DEPARTMENT_NAME, E.EMPLOYEE_ID, E.SALARY]',
      '   4 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME]',
      '   5 - output: [E.EMPLOYEE_ID, E.SALARY, E.DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 18',
      'physical reads       =  5',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       = 14',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 18',
      'physical reads       =  5',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       = 14',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        2  0.01     0.08     5     18        0    14
------- ------  ----  -------  ----  -----  -------  ----
total        4  0.01     0.08     5     18        0    14`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        2  0.01     0.08     5     18        0    14
------- ------  ----  -------  ----  -----  -------  ----
total        4  0.01     0.08     5     18        0    14`,
    reasonKo: `이 쿼리는 특정 행을 조건으로 추리는 것이 아니라 전체를 읽어 집계해요.
인덱스로 범위를 줄일 수 없으므로 두 테이블 모두 TABLE ACCESS FULL을 선택해요.

실행 순서: ④ → ⑤ → ③ → ② → ① → ⓪

Hash Join — Build Input 선택 이유:
  DEPARTMENTS(20행) < EMPLOYEES(15행)이지만 DEPARTMENTS의 BLOCKS가 더 적어요.
  CBO는 더 작은 테이블을 Build Input(해시 테이블 구성)으로 써요 → ④ DEPARTMENTS.
  EMPLOYEES는 Probe Input으로 한 줄씩 읽으며 해시 테이블을 탐색해요 → ⑤.

③ HASH JOIN: access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")
  조인 조건이 access로 표시돼요 — Hash Join에서 조인 키는 항상 access.

② HASH GROUP BY:
  JOIN 결과(15행)를 department_name으로 그룹화해 COUNT, AVG, MAX 계산.
  GROUP BY를 Sort 없이 해시로 처리하므로 sorts(memory)=0이어야 하지만,
  ORDER BY avg_salary DESC 때문에 ① SORT ORDER BY에서 sorts(memory)=1 발생.

Column Projection에서 ②의 출력에 AVG 대신 SUM + COUNT(*)가 있어요.
  AVG는 나중에 SUM/COUNT로 계산하기 위해 내부적으로 분해돼요.`,
    reasonEn: `This query aggregates all rows rather than filtering to a specific subset.
Since there is no predicate to narrow the scan range, both tables use TABLE ACCESS FULL.

Execution order: ④ → ⑤ → ③ → ② → ① → ⓪

Hash Join — why DEPARTMENTS is the Build Input:
  DEPARTMENTS (20 rows) has fewer blocks than EMPLOYEES (15 rows but more data).
  CBO picks the smaller table as the Build Input → ④ DEPARTMENTS builds the hash table.
  EMPLOYEES is the Probe Input → ⑤ each row probes the hash table.

③ HASH JOIN: access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")
  Hash Join always shows its join key as access — the key determines which hash bucket to probe.

② HASH GROUP BY:
  Groups the 15 join result rows by department_name, computing COUNT, AVG, MAX.
  GROUP BY uses a hash aggregate (no sort needed), but ORDER BY avg_salary DESC
  requires ① SORT ORDER BY → sorts(memory)=1.

Notice in Column Projection that op ② outputs SUM + COUNT(*) instead of AVG.
  Oracle decomposes AVG into SUM/COUNT internally and computes the final ratio at output time.`,
    predicateAnnotations: [
      { line: '3 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', noteKo: 'Op 3(HASH JOIN)의 조인 키가 access예요. Hash Join은 작은 테이블(DEPARTMENTS)로 해시 테이블을 만든 뒤, 큰 테이블(EMPLOYEES)의 각 행을 읽어 DEPARTMENT_ID 해시 값으로 버킷을 탐색해요. 조인 키는 항상 access로 표시돼요.', noteEn: 'Op 3 (HASH JOIN) join key shown as access. Hash Join builds a hash table from DEPARTMENTS, then probes each EMPLOYEES row by hashing DEPARTMENT_ID to find the matching bucket. Join keys in Hash Join are always labeled access.' },
    ],
    projectionAnnotations: [
      { line: '2 - output: [D.DEPARTMENT_NAME, COUNT(E.EMPLOYEE_ID), SUM(E.SALARY), COUNT(*), MAX(E.SALARY)]', noteKo: 'AVG(E.SALARY)가 SUM과 COUNT(*)로 분해되어 있어요. Oracle은 집계 중간 상태를 SUM/COUNT로 유지하다가 최종 출력 시점에 나눗셈을 수행해요. GROUP BY가 완료되기 전까지는 AVG를 직접 계산할 수 없기 때문이에요.', noteEn: 'AVG(E.SALARY) is decomposed into SUM + COUNT(*). Oracle maintains the running aggregate as a sum and count, then divides at the final projection step. A true average cannot be computed until all rows in a group have been seen.' },
      { line: '5 - output: [E.EMPLOYEE_ID, E.SALARY, E.DEPARTMENT_ID]', noteKo: 'EMPLOYEES FTS에서 집계·조인에 필요한 3개 컬럼만 추출해요. LAST_NAME 등 SELECT에 없는 컬럼은 읽지 않아요.', noteEn: 'EMPLOYEES FTS projects only the 3 columns needed for aggregation and the join key. Columns not in the SELECT clause (LAST_NAME, etc.) are not read.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      = 18', noteKo: '논리 블록 18개: DEPARTMENTS 8 + EMPLOYEES 10. 두 테이블 모두 FTS이므로 각 테이블 전체 블록을 읽은 값이에요.', noteEn: '18 logical blocks: 8 (DEPARTMENTS FTS) + 10 (EMPLOYEES FTS). Both tables are fully scanned, so CR equals the sum of each table\'s block count.' },
      { line: 'sorts (memory)       =  1', noteKo: 'ORDER BY avg_salary DESC로 인해 SORT ORDER BY 1회 발생. HASH GROUP BY는 정렬이 필요 없지만, 최종 결과를 정렬해야 하므로 메모리 정렬 1회가 발생해요.', noteEn: 'ORDER BY avg_salary DESC triggers 1 in-memory sort. HASH GROUP BY itself needs no sort, but the final ORDER BY requires SORT ORDER BY to arrange the 14 grouped rows.' },
    ],
  },

  // ── Q6: 복합 조건 + access vs filter 대비 ─────────────────────────────────
  {
    id: 6,
    labelKo: 'Q6. 복합 조건 — access vs filter',
    labelEn: 'Q6. Compound Predicates — access vs filter',
    difficulty: 'medium',
    sql: `SELECT e.employee_id, e.last_name, e.job_id, e.salary
FROM   hr.employees e
WHERE  e.department_id = 80
AND    e.salary        > 8000;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT',                      rows: 1, cost: 2, time: '00:00:01' },
      { id: 1, depth: 1, operation: 'TABLE ACCESS BY INDEX ROWID BATCHED',   name: 'EMPLOYEES', rows: 1, cost: 2, time: '00:00:01',
        actualRows: 2, cr: 4, pr: 0, elapsed: '00:00:00.02',
        note: '두 번째 실행. 인덱스에서 나온 ROWID로 테이블 접근 후 SALARY > 8000 필터.' },
      { id: 2, depth: 2, operation: 'INDEX RANGE SCAN',                      name: 'EMP_DEPARTMENT_IX', rows: 2, cost: 1, time: '00:00:01',
        actualRows: 2, cr: 2, pr: 0, elapsed: '00:00:00.01',
        note: '가장 먼저 실행. DEPARTMENT_ID=80 조건으로 인덱스 탐색 범위 결정.' },
    ],
    showStats: true,
    predicatesKo: [
      '   1 - filter("E"."SALARY">8000)',
      '   2 - access("E"."DEPARTMENT_ID"=80)',
    ],
    predicatesEn: [
      '   1 - filter("E"."SALARY">8000)',
      '   2 - access("E"."DEPARTMENT_ID"=80)',
    ],
    projectionKo: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.JOB_ID, E.SALARY]',
      '   2 - output: [ROWID, E.DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.JOB_ID, E.SALARY]',
      '   2 - output: [ROWID, E.DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  4',
      'physical reads       =  0',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  2',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  4',
      'physical reads       =  0',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  2',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     0      4        0     2
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     0      4        0     2`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     0      4        0     2
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     0      4        0     2`,
    reasonKo: `두 가지 조건이 있지만 Predicate Information을 보면 서로 다르게 처리돼요.

  2번 access("E"."DEPARTMENT_ID"=80)
    EMP_DEPARTMENT_IX 인덱스의 선두 컬럼이 DEPARTMENT_ID예요.
    인덱스가 이 조건으로 탐색 범위를 결정해요 → access.
    인덱스만으로 DEPARTMENT_ID=80인 행을 빠르게 찾아 ROWID를 반환해요.

  1번 filter("E"."SALARY">8000)
    EMP_DEPARTMENT_IX 인덱스에는 SALARY 컬럼이 없어요.
    따라서 테이블을 먼저 읽고(TABLE ACCESS BY INDEX ROWID) 나서야
    SALARY 값을 확인할 수 있어요 → filter.

핵심: 같은 쿼리의 두 조건이 access(인덱스 탐색)와 filter(테이블 후처리)로 나뉘어요.

최적화 힌트:
  (DEPARTMENT_ID, SALARY)로 복합 인덱스를 만들면
  SALARY > 8000도 access 범위로 처리할 수 있어 테이블 접근 횟수가 줄어들어요.`,
    reasonEn: `The query has two predicates, but Predicate Information shows them handled differently.

  Op 2 access("E"."DEPARTMENT_ID"=80)
    EMP_DEPARTMENT_IX has DEPARTMENT_ID as its leading column.
    This condition determines the index scan range → access.
    The index efficiently locates all ROWIDs where DEPARTMENT_ID=80.

  Op 1 filter("E"."SALARY">8000)
    SALARY is not in EMP_DEPARTMENT_IX.
    Oracle must first fetch the table row via ROWID and only then check SALARY → filter.

Key insight: two predicates from the same WHERE clause take different roles —
  access (index scan range) vs filter (post-table check).

Optimization hint:
  A composite index on (DEPARTMENT_ID, SALARY) would make SALARY > 8000
  an access predicate too, reducing the number of table rows visited.`,
    predicateAnnotations: [
      { line: '2 - access("E"."DEPARTMENT_ID"=80)', noteKo: 'DEPARTMENT_ID=80이 인덱스 탐색 범위를 결정해요. INDEX RANGE SCAN은 인덱스 B-Tree에서 이 범위의 리프 블록만 읽어요. SALARY 조건은 이 시점에서 처리할 수 없어요(인덱스에 없으므로).', noteEn: 'DEPARTMENT_ID=80 determines the index scan range. INDEX RANGE SCAN reads only the leaf blocks within this range. The SALARY condition cannot be applied here — it is not in the index.' },
      { line: '1 - filter("E"."SALARY">8000)', noteKo: '테이블 행을 ROWID로 읽어온 후에야 SALARY 컬럼 값을 확인할 수 있어요. DEPARTMENT_ID=80인 행 중 SALARY≤8000인 행은 이 단계에서 버려져요. 인덱스가 SALARY를 포함하지 않으므로 불가피한 테이블 접근이에요.', noteEn: 'SALARY can only be checked after reading the table row via ROWID. Rows with DEPARTMENT_ID=80 but SALARY≤8000 are discarded at this step. This table access is unavoidable because the index does not include SALARY.' },
    ],
    projectionAnnotations: [
      { line: '2 - output: [ROWID, E.DEPARTMENT_ID]', noteKo: 'INDEX RANGE SCAN은 ROWID와 인덱스 키(DEPARTMENT_ID)만 출력해요. SALARY는 인덱스에 없으므로 여기서 나오지 않아요. 만약 (DEPARTMENT_ID, SALARY) 복합 인덱스였다면 여기서 SALARY도 출력해서 테이블 접근을 생략할 수 있어요.', noteEn: 'INDEX RANGE SCAN outputs only ROWID and the index key DEPARTMENT_ID. SALARY is not in the index so it does not appear here. A composite index on (DEPARTMENT_ID, SALARY) would allow SALARY to be output here, potentially avoiding the table access entirely.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      =  4', noteKo: '인덱스 2블록 + 테이블 2블록. SALARY 필터 후 2행만 남았지만 인덱스에서 찾은 ROWID마다 테이블을 읽어야 했어요.', noteEn: '2 index blocks + 2 table blocks. Only 2 rows passed the SALARY filter, but each ROWID from the index required one table block read.' },
    ],
  },

  // ── Q7: JOB_HISTORY 서브쿼리 → EXISTS ────────────────────────────────────
  {
    id: 7,
    labelKo: 'Q7. EXISTS 서브쿼리 — 이직 이력 있는 직원',
    labelEn: 'Q7. EXISTS Subquery — Employees with Job History',
    difficulty: 'medium',
    sql: `SELECT e.employee_id, e.last_name, e.job_id
FROM   hr.employees e
WHERE  EXISTS (
  SELECT 1
  FROM   hr.job_history jh
  WHERE  jh.employee_id = e.employee_id
);`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT',                      rows: 5,  cost: 5,  time: '00:00:01' },
      { id: 1, depth: 1, operation: 'NESTED LOOPS SEMI',                     rows: 5,  cost: 5,  time: '00:00:01',
        actualRows: 5, cr: 14, pr: 2, elapsed: '00:00:00.03' },
      { id: 2, depth: 2, operation: 'TABLE ACCESS FULL',                     name: 'EMPLOYEES',  rows: 15, cost: 3, time: '00:00:01',
        actualRows: 15, cr: 8, pr: 2, elapsed: '00:00:00.02',
        note: '가장 먼저 실행. EMPLOYEES 전체를 드라이빙 테이블로 읽음.' },
      { id: 3, depth: 2, operation: 'INDEX RANGE SCAN',                      name: 'JHIST_EMP_ID_ST_DATE_PK', rows: 1, cost: 1, time: '00:00:01',
        actualRows: 1, cr: 6, pr: 0, elapsed: '00:00:00.01',
        note: '두 번째 실행(최대 15회). 각 직원의 JOB_HISTORY 존재 여부 확인.' },
    ],
    showStats: true,
    predicatesKo: [
      '   3 - access("JH"."EMPLOYEE_ID"="E"."EMPLOYEE_ID")',
    ],
    predicatesEn: [
      '   3 - access("JH"."EMPLOYEE_ID"="E"."EMPLOYEE_ID")',
    ],
    projectionKo: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.JOB_ID]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.JOB_ID]',
      '   3 - output: [JH.EMPLOYEE_ID]',
    ],
    projectionEn: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.JOB_ID]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.JOB_ID]',
      '   3 - output: [JH.EMPLOYEE_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 14',
      'physical reads       =  2',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  5',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 14',
      'physical reads       =  2',
      'redo size            =  0',
      'sorts (memory)       =  0',
      'sorts (disk)         =  0',
      'rows processed       =  5',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     2     14        0     5
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     2     14        0     5`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.00     0.00     2     14        0     5
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.00     0.00     2     14        0     5`,
    reasonKo: `EXISTS 서브쿼리는 CBO에 의해 Semi Join으로 변환됩니다.
"EXISTS (SELECT 1 FROM job_history WHERE ...)" → NESTED LOOPS SEMI.

NESTED LOOPS SEMI의 특징:
  일반 Nested Loop와 달리, 매칭되는 첫 번째 행을 찾으면 즉시 다음 외부 행으로 넘어갑니다.
  즉, JOB_HISTORY에서 같은 employee_id가 여러 번 나와도 첫 번째만 확인합니다.
  이 덕분에 EMPLOYEES 15행 × JOB_HISTORY 전체 스캔을 방지합니다.

실행 순서: ② → ③(최대 15회) → ① → ⓪

  ② TABLE ACCESS FULL (EMPLOYEES): 15행 전체를 드라이빙.
  ③ INDEX RANGE SCAN (JHIST_EMP_ID_ST_DATE_PK):
    각 employee_id로 JOB_HISTORY PK 인덱스를 탐색.
    EMPLOYEE_ID가 JOB_HISTORY PK의 선두 컬럼이므로 access 처리.
    매칭 즉시 반환(SEMI 특성) → 15회 중 이력이 있는 5명만 1회씩 추가 확인.

Column Projection에서 ③의 출력은 JH.EMPLOYEE_ID만 있어요.
  EXISTS는 값이 아닌 존재 여부만 확인하므로 JOB_HISTORY 테이블 본체를 읽지 않아요.
  인덱스만으로 처리 완료 → 효율적.`,
    reasonEn: `Oracle's CBO transforms the EXISTS subquery into a Semi Join.
"EXISTS (SELECT 1 FROM job_history WHERE ...)" → NESTED LOOPS SEMI.

How NESTED LOOPS SEMI differs from a regular Nested Loop:
  As soon as a matching row is found in JOB_HISTORY, Oracle immediately moves
  to the next outer row — it does not continue scanning for additional matches.
  This prevents reading all JOB_HISTORY rows for employees with multiple records.

Execution order: ② → ③ (up to 15 times) → ① → ⓪

  ② TABLE ACCESS FULL (EMPLOYEES): reads all 15 rows as the outer/driving side.
  ③ INDEX RANGE SCAN (JHIST_EMP_ID_ST_DATE_PK):
    Probes the JOB_HISTORY PK index with each employee_id.
    EMPLOYEE_ID is the leading column of the PK → access predicate.
    SEMI semantics: stops after the first match → at most one match per employee.

Column Projection shows op ③ outputs only JH.EMPLOYEE_ID.
  EXISTS only checks for row existence — no column values are needed from JOB_HISTORY.
  The table itself is never visited; the index alone is sufficient → very efficient.`,
    predicateAnnotations: [
      { line: '3 - access("JH"."EMPLOYEE_ID"="E"."EMPLOYEE_ID")', noteKo: 'Op 3(INDEX RANGE SCAN)에서 JOB_HISTORY PK 인덱스를 EMPLOYEE_ID로 탐색해요. 이 값은 외부 루프(EMPLOYEES)에서 하나씩 공급돼요. SEMI Join이므로 첫 번째 매칭 즉시 이 인덱스 탐색을 멈추고 다음 외부 행으로 진행해요.', noteEn: 'Op 3 (INDEX RANGE SCAN) probes the JOB_HISTORY PK index with EMPLOYEE_ID supplied by the outer loop (EMPLOYEES). Because this is a SEMI join, the index scan stops at the first match and moves on to the next outer row immediately.' },
    ],
    projectionAnnotations: [
      { line: '3 - output: [JH.EMPLOYEE_ID]', noteKo: 'EXISTS 서브쿼리는 존재 여부만 확인하므로 JH.EMPLOYEE_ID 하나만 출력해요. SELECT 1이기 때문에 JOB_HISTORY의 다른 컬럼(JOB_ID, START_DATE 등)은 전혀 읽지 않아요. 심지어 JOB_HISTORY 테이블 본체도 접근하지 않아요 — 인덱스만으로 충분해요.', noteEn: 'EXISTS only needs to verify presence, so only JH.EMPLOYEE_ID is output. No other JOB_HISTORY columns (JOB_ID, START_DATE, etc.) are read. The JOB_HISTORY table itself is never accessed — the index alone provides the EMPLOYEE_ID needed for the existence check.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      = 14', noteKo: '논리 블록 14개: EMPLOYEES FTS 8 + JOB_HISTORY 인덱스 탐색 6. 매칭 즉시 중단(SEMI)하므로 15회를 모두 스캔하더라도 인덱스 블록 수는 최소화돼요.', noteEn: '14 logical blocks: 8 (EMPLOYEES FTS) + 6 (JOB_HISTORY index probes). SEMI stop-on-first-match limits the index reads even across all 15 outer rows.' },
      { line: 'rows processed       =  5', noteKo: '최종 반환 5명. JOB_HISTORY에 이력이 있는 직원 수예요. 나머지 10명은 EXISTS 조건을 통과하지 못해 제거돼요.', noteEn: '5 employees returned — those who have at least one JOB_HISTORY record. The remaining 10 employees failed the EXISTS check and were filtered out.' },
    ],
  },

  // ── Q8: 3테이블 조인 — 직원 + 부서 + 위치 ───────────────────────────────
  {
    id: 8,
    labelKo: 'Q8. 3테이블 조인 — 직원·부서·위치',
    labelEn: 'Q8. Three-Table Join — Employee, Dept, Location',
    difficulty: 'complex',
    sql: `SELECT e.last_name, d.department_name,
       l.city, l.state_province
FROM   hr.employees   e
JOIN   hr.departments d ON e.department_id  = d.department_id
JOIN   hr.locations   l ON d.location_id    = l.location_id
WHERE  l.country_id = 'US'
ORDER BY e.last_name;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT',                    rows: 7,  cost: 12, time: '00:00:01' },
      { id: 1, depth: 1, operation: 'SORT ORDER BY',                       rows: 7,  cost: 12, time: '00:00:01',
        actualRows: 7, cr: 28, pr: 8, pw: 0, elapsed: '00:00:00.12' },
      { id: 2, depth: 2, operation: 'HASH JOIN',                           rows: 7,  cost: 11, time: '00:00:01',
        actualRows: 7, cr: 28, pr: 8, pw: 0, elapsed: '00:00:00.11',
        note: '세 번째 실행. DEPARTMENTS+LOCATIONS 결과와 EMPLOYEES를 DEPARTMENT_ID로 조인.' },
      { id: 3, depth: 3, operation: 'HASH JOIN',                           rows: 4,  cost: 7,  time: '00:00:01',
        actualRows: 4, cr: 16, pr: 5, pw: 0, elapsed: '00:00:00.07',
        note: '두 번째 실행. LOCATIONS(미국 4개)를 Build Input, DEPARTMENTS를 Probe로 조인.' },
      { id: 4, depth: 4, operation: 'TABLE ACCESS BY INDEX ROWID BATCHED', name: 'LOCATIONS',  rows: 4, cost: 3, time: '00:00:01',
        actualRows: 4, cr: 6, pr: 3, pw: 0, elapsed: '00:00:00.04',
        note: '가장 먼저 실행. country_id=\'US\' filter 후 4개 미국 위치 반환.' },
      { id: 5, depth: 5, operation: 'INDEX RANGE SCAN',                    name: 'LOC_COUNTRY_IX', rows: 4, cost: 1, time: '00:00:01',
        actualRows: 4, cr: 2, pr: 1, pw: 0, elapsed: '00:00:00.01',
        note: '가장 먼저 실행. COUNTRY_ID=\'US\' 인덱스 탐색.' },
      { id: 6, depth: 4, operation: 'TABLE ACCESS FULL',                   name: 'DEPARTMENTS', rows: 20, cost: 3, time: '00:00:01',
        actualRows: 20, cr: 8, pr: 2, pw: 0, elapsed: '00:00:00.02',
        note: '두 번째 실행. DEPARTMENTS 전체를 읽어 LOCATIONS 결과와 Hash Join.' },
      { id: 7, depth: 3, operation: 'TABLE ACCESS FULL',                   name: 'EMPLOYEES',   rows: 15, cost: 3, time: '00:00:01',
        actualRows: 15, cr: 10, pr: 3, pw: 0, elapsed: '00:00:00.03',
        note: '세 번째 실행. EMPLOYEES 전체를 읽어 앞 조인 결과와 Hash Join.' },
    ],
    showStats: true,
    predicatesKo: [
      '   2 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")',
      '   3 - access("D"."LOCATION_ID"="L"."LOCATION_ID")',
      '   4 - filter("L"."COUNTRY_ID"=\'US\')',
      '   5 - access("L"."COUNTRY_ID"=\'US\')',
    ],
    predicatesEn: [
      '   2 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")',
      '   3 - access("D"."LOCATION_ID"="L"."LOCATION_ID")',
      '   4 - filter("L"."COUNTRY_ID"=\'US\')',
      '   5 - access("L"."COUNTRY_ID"=\'US\')',
    ],
    projectionKo: [
      '   1 - output: [E.LAST_NAME, D.DEPARTMENT_NAME, L.CITY, L.STATE_PROVINCE]',
      '   2 - output: [E.LAST_NAME, D.DEPARTMENT_NAME, L.CITY, L.STATE_PROVINCE]',
      '   3 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME, L.CITY, L.STATE_PROVINCE]',
      '   4 - output: [L.LOCATION_ID, L.CITY, L.STATE_PROVINCE]',
      '   5 - output: [ROWID, L.LOCATION_ID]',
      '   6 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME, D.LOCATION_ID]',
      '   7 - output: [E.LAST_NAME, E.DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [E.LAST_NAME, D.DEPARTMENT_NAME, L.CITY, L.STATE_PROVINCE]',
      '   2 - output: [E.LAST_NAME, D.DEPARTMENT_NAME, L.CITY, L.STATE_PROVINCE]',
      '   3 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME, L.CITY, L.STATE_PROVINCE]',
      '   4 - output: [L.LOCATION_ID, L.CITY, L.STATE_PROVINCE]',
      '   5 - output: [ROWID, L.LOCATION_ID]',
      '   6 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME, D.LOCATION_ID]',
      '   7 - output: [E.LAST_NAME, E.DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 28',
      'physical reads       =  8',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       =  7',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 28',
      'physical reads       =  8',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       =  7',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.01     0.12     8     28        0     7
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.01     0.12     8     28        0     7`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.01     0.12     8     28        0     7
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.01     0.12     8     28        0     7`,
    reasonKo: `3테이블 조인에서 CBO가 조인 순서를 결정하는 방법을 볼 수 있어요.

실행 순서: ⑤ → ④ → ⑥ → ③ → ⑦ → ② → ① → ⓪

조인 순서 선택 이유:
  WHERE l.country_id = 'US' 조건으로 LOCATIONS가 가장 먼저 줄어들어요.
  LOC_COUNTRY_IX 인덱스로 COUNTRY_ID='US'를 access한 뒤 (④⑤),
  4개 미국 위치를 Build Input으로 해시 테이블을 구성해요.

  DEPARTMENTS(20행)를 Probe로 읽어 LOCATION_ID로 조인 → 미국 부서 4개만 남음 (③⑥).
  마지막으로 EMPLOYEES를 읽어 DEPARTMENT_ID로 조인 → 7명의 미국 근무 직원 (②⑦).

4번 Predicate: access와 filter가 동시에 있어요.
  5번 INDEX RANGE SCAN: access("COUNTRY_ID"='US') → 인덱스로 범위 결정
  4번 TABLE ACCESS: filter("COUNTRY_ID"='US') → 테이블에서 재확인 (방어적 검사)

ORDER BY e.last_name → ① SORT ORDER BY: sorts(memory)=1.
  조인 완료 후 7행을 메모리에서 정렬해요.`,
    reasonEn: `This plan shows how the CBO decides join order for a three-table query.

Execution order: ⑤ → ④ → ⑥ → ③ → ⑦ → ② → ① → ⓪

Why this join order?
  WHERE l.country_id = 'US' filters LOCATIONS most aggressively.
  LOC_COUNTRY_IX accesses COUNTRY_ID='US' (ops ④⑤),
  producing 4 US locations as the Build Input for a hash table.

  DEPARTMENTS (20 rows) probes the hash table on LOCATION_ID → only 4 US departments remain (③⑥).
  EMPLOYEES is read last and joins on DEPARTMENT_ID → 7 employees in US offices (②⑦).

Op 4 shows both access and filter for COUNTRY_ID='US':
  Op 5 INDEX RANGE SCAN: access("COUNTRY_ID"='US') — index determines scan range
  Op 4 TABLE ACCESS: filter("COUNTRY_ID"='US') — table re-checks the value (safety net)

ORDER BY e.last_name triggers ① SORT ORDER BY: sorts(memory)=1.
  7 rows sorted entirely in PGA memory — no disk spill.`,
    predicateAnnotations: [
      { line: '5 - access("L"."COUNTRY_ID"=\'US\')', noteKo: 'LOC_COUNTRY_IX 인덱스로 COUNTRY_ID=\'US\' 범위를 결정해요. 22개 위치 중 미국 4개만 ROWID로 반환돼요.', noteEn: 'LOC_COUNTRY_IX determines the scan range for COUNTRY_ID=\'US\'. Of 22 locations, only the 4 US ones are returned as ROWIDs.' },
      { line: '4 - filter("L"."COUNTRY_ID"=\'US\')', noteKo: '테이블 접근 후 같은 조건을 재확인해요. 인덱스 탐색 결과와 테이블 데이터가 일치하는지 방어적으로 검사하는 Oracle의 패턴이에요.', noteEn: 'After reading the table row, the same predicate is re-checked as a defensive safety net. This double-check is a common Oracle pattern when using non-unique indexes.' },
      { line: '3 - access("D"."LOCATION_ID"="L"."LOCATION_ID")', noteKo: 'LOCATIONS 결과(미국 4개)로 해시 테이블을 구성한 뒤, DEPARTMENTS의 LOCATION_ID로 해시 버킷을 탐색해요. Hash Join 조인 키 → access.', noteEn: 'Hash table built from LOCATIONS (4 US rows). DEPARTMENTS rows probe the hash table using LOCATION_ID. Hash Join join key → always access.' },
      { line: '2 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', noteKo: '미국 부서 4개와 EMPLOYEES를 DEPARTMENT_ID로 Hash Join. 결과 7명의 미국 근무 직원이 추출돼요.', noteEn: 'Hash Join between the 4 US departments and EMPLOYEES on DEPARTMENT_ID. Result: 7 employees working in US offices.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      = 28', noteKo: '논리 블록 28개: LOCATIONS 인덱스/테이블 8 + DEPARTMENTS FTS 8 + EMPLOYEES FTS 10 + SORT 2. 3테이블 조인의 누적 CR이에요.', noteEn: '28 logical blocks: ~8 (LOCATIONS index+table) + 8 (DEPARTMENTS FTS) + 10 (EMPLOYEES FTS) + 2 (sort overhead). Cumulative CR for a three-table join.' },
      { line: 'sorts (memory)       =  1', noteKo: 'ORDER BY e.last_name으로 최종 7행을 PGA 메모리에서 정렬. pw=0이므로 TEMP 스필은 없어요.', noteEn: 'ORDER BY e.last_name sorts the final 7 rows in PGA memory. pw=0 confirms no TEMP spill.' },
    ],
  },

  // ── Q9: 윈도우 함수 — 급여 순위 ─────────────────────────────────────────
  {
    id: 9,
    labelKo: 'Q9. 윈도우 함수 — 부서 내 급여 순위',
    labelEn: 'Q9. Window Function — Salary Rank Within Dept',
    difficulty: 'complex',
    sql: `SELECT e.employee_id, e.last_name, e.department_id, e.salary,
       RANK() OVER (
         PARTITION BY e.department_id
         ORDER BY e.salary DESC
       ) AS salary_rank
FROM   hr.employees e
WHERE  e.department_id IS NOT NULL;`,
    planRows: [
      { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 14, cost: 6, time: '00:00:01' },
      { id: 1, depth: 1, operation: 'WINDOW SORT',      rows: 14, cost: 6, time: '00:00:01',
        actualRows: 14, cr: 8, pr: 3, pw: 0, elapsed: '00:00:00.05',
        note: '두 번째 실행. DEPARTMENT_ID, SALARY DESC 기준 정렬 후 RANK() 계산.' },
      { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 14, cost: 3, time: '00:00:01',
        actualRows: 14, cr: 8, pr: 3, elapsed: '00:00:00.03',
        note: '가장 먼저 실행. DEPARTMENT_ID IS NOT NULL 조건으로 14행 반환.' },
    ],
    showStats: true,
    predicatesKo: [
      '   2 - filter("E"."DEPARTMENT_ID" IS NOT NULL)',
    ],
    predicatesEn: [
      '   2 - filter("E"."DEPARTMENT_ID" IS NOT NULL)',
    ],
    projectionKo: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.DEPARTMENT_ID, E.SALARY, RANK() OVER (...)]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.DEPARTMENT_ID, E.SALARY]',
    ],
    projectionEn: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.DEPARTMENT_ID, E.SALARY, RANK() OVER (...)]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.DEPARTMENT_ID, E.SALARY]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  8',
      'physical reads       =  3',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       = 14',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      =  8',
      'physical reads       =  3',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       = 14',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        2  0.00     0.05     3      8        0    14
------- ------  ----  -------  ----  -----  -------  ----
total        4  0.00     0.05     3      8        0    14`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        2  0.00     0.05     3      8        0    14
------- ------  ----  -------  ----  -----  -------  ----
total        4  0.00     0.05     3      8        0    14`,
    reasonKo: `RANK() OVER (PARTITION BY ... ORDER BY ...)는 윈도우 함수예요.
윈도우 함수는 반드시 전체 데이터를 메모리에 올려 정렬 후 계산해야 해요.
이 때문에 WINDOW SORT 오퍼레이션이 항상 등장해요.

실행 순서: ② → ① → ⓪

② TABLE ACCESS FULL (EMPLOYEES):
  DEPARTMENT_ID IS NOT NULL 조건 — filter(인덱스 없음).
  NULL이 아닌 직원 14행을 반환해요.
  DEPARTMENT_ID가 NULL인 직원(manager_id=null인 일부)을 제외해요.

① WINDOW SORT:
  PARTITION BY department_id, ORDER BY salary DESC 기준으로 전체 정렬.
  정렬 후 파티션 경계(DEPARTMENT_ID가 바뀌는 지점)마다 RANK를 1부터 다시 시작.
  sorts(memory)=1 — 14행이 작아 PGA에서 처리, disk 스필 없음.

RANK vs DENSE_RANK:
  같은 급여가 있으면 RANK는 동순위 후 번호를 건너뛰어요 (1,1,3).
  DENSE_RANK는 건너뛰지 않아요 (1,1,2).
  두 함수 모두 WINDOW SORT 오퍼레이션을 사용해요.`,
    reasonEn: `RANK() OVER (PARTITION BY ... ORDER BY ...) is a window function.
Window functions require all data to be sorted in memory before the rank is computed —
this is why WINDOW SORT always appears in the plan.

Execution order: ② → ① → ⓪

② TABLE ACCESS FULL (EMPLOYEES):
  DEPARTMENT_ID IS NOT NULL — a filter (no index on this column for IS NOT NULL).
  Returns 14 rows where DEPARTMENT_ID is not null.
  Excludes the one employee whose department is null.

① WINDOW SORT:
  Sorts all 14 rows by (department_id, salary DESC) in memory.
  RANK is reset to 1 at each partition boundary (where DEPARTMENT_ID changes).
  sorts(memory)=1 — 14 rows fit entirely in PGA, no disk spill.

RANK vs DENSE_RANK:
  If two employees share the same salary, RANK skips the next number (1, 1, 3).
  DENSE_RANK does not skip (1, 1, 2).
  Both functions use the WINDOW SORT operation.`,
    predicateAnnotations: [
      { line: '2 - filter("E"."DEPARTMENT_ID" IS NOT NULL)', noteKo: 'TABLE ACCESS FULL에서 DEPARTMENT_ID IS NOT NULL이 filter예요. IS NOT NULL은 인덱스를 사용할 수 없는 조건 중 하나이며(NULL 값은 B-Tree 인덱스에 저장되지 않음), 전체 테이블을 읽은 후 NULL인 행을 제거해요.', noteEn: 'DEPARTMENT_ID IS NOT NULL is a filter on the TABLE ACCESS FULL. IS NOT NULL cannot use a B-tree index (NULL values are not stored in B-tree indexes), so every row is read and then filtered.' },
    ],
    projectionAnnotations: [
      { line: '1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.DEPARTMENT_ID, E.SALARY, RANK() OVER (...)]', noteKo: 'WINDOW SORT 완료 후 RANK() 계산 결과가 추가되어 최종 5개 컬럼을 출력해요. RANK()는 이 시점(정렬 후)에만 계산 가능해요.', noteEn: 'After WINDOW SORT completes, the RANK() value is computed and appended, producing 5 output columns. RANK() can only be calculated after all rows are sorted.' },
      { line: '2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.DEPARTMENT_ID, E.SALARY]', noteKo: 'TABLE ACCESS FULL은 RANK() 없이 4개 컬럼만 출력해요. RANK() 계산은 상위 WINDOW SORT 단계에서 수행돼요.', noteEn: 'TABLE ACCESS FULL outputs 4 columns without RANK(). The rank computation happens at the parent WINDOW SORT step once all rows are sorted.' },
    ],
    statsAnnotations: [
      { line: 'sorts (memory)       =  1', noteKo: 'WINDOW SORT 1회, 메모리에서 처리. 14행은 충분히 작아 PGA(Work Area)에서 완전히 정렬돼요. 수백만 행이면 sorts(disk)가 증가하고 TEMP 테이블스페이스에 스필이 발생해요.', noteEn: '1 in-memory sort via WINDOW SORT. 14 rows fit comfortably in PGA work area. With millions of rows, sorts(disk) would increase and data would spill to the TEMP tablespace.' },
      { line: 'rows processed       = 14', noteKo: 'DEPARTMENT_ID가 NULL인 직원 1명을 제외한 14명이 반환돼요.', noteEn: '14 employees returned — all except the 1 whose DEPARTMENT_ID is NULL.' },
    ],
  },

  // ── Q10: 인라인 뷰 + 집계 서브쿼리 — 부서 평균 이상 직원 ─────────────────
  {
    id: 10,
    labelKo: 'Q10. 인라인 뷰 — 부서 평균 급여 이상 직원',
    labelEn: 'Q10. Inline View — Employees Above Dept Avg Salary',
    difficulty: 'complex',
    sql: `SELECT e.employee_id, e.last_name, e.salary,
       d.department_name,
       avg_info.avg_sal
FROM   hr.employees   e
JOIN   hr.departments d ON e.department_id = d.department_id
JOIN (
  SELECT department_id,
         ROUND(AVG(salary), 0) AS avg_sal
  FROM   hr.employees
  GROUP BY department_id
) avg_info ON avg_info.department_id = e.department_id
WHERE  e.salary >= avg_info.avg_sal
ORDER BY e.salary DESC;`,
    planRows: [
      { id: 0,  depth: 0, operation: 'SELECT STATEMENT',  rows: 8,  cost: 16, time: '00:00:01' },
      { id: 1,  depth: 1, operation: 'SORT ORDER BY',     rows: 8,  cost: 16, time: '00:00:01',
        actualRows: 8, cr: 30, pr: 7, pw: 0, elapsed: '00:00:00.14' },
      { id: 2,  depth: 2, operation: 'HASH JOIN',         rows: 8,  cost: 15, time: '00:00:01',
        actualRows: 8, cr: 30, pr: 7, pw: 0, elapsed: '00:00:00.13',
        note: '네 번째 실행. avg_info 집계 결과와 EMPLOYEES+DEPARTMENTS 조인 결과를 연결.' },
      { id: 3,  depth: 3, operation: 'VIEW',              rows: 9,  cost: 7,  time: '00:00:01',
        actualRows: 9, cr: 8, pr: 3, pw: 0, elapsed: '00:00:00.05',
        note: '두 번째 실행. 인라인 뷰(avg_info) 집계 결과. HASH GROUP BY 완료.' },
      { id: 4,  depth: 4, operation: 'HASH GROUP BY',     rows: 9,  cost: 7,  time: '00:00:01',
        actualRows: 9, cr: 8, pr: 3, pw: 0, elapsed: '00:00:00.04',
        note: '가장 먼저 실행. EMPLOYEES를 department_id로 그룹화해 AVG 계산.' },
      { id: 5,  depth: 5, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES', rows: 15, cost: 3, time: '00:00:01',
        actualRows: 15, cr: 8, pr: 3, pw: 0, elapsed: '00:00:00.03',
        note: '가장 먼저 실행. 인라인 뷰 내부 EMPLOYEES 전체 스캔.' },
      { id: 6,  depth: 3, operation: 'HASH JOIN',         rows: 15, cost: 7,  time: '00:00:01',
        actualRows: 15, cr: 18, pr: 4, pw: 0, elapsed: '00:00:00.08',
        note: '세 번째 실행. DEPARTMENTS와 EMPLOYEES를 조인.' },
      { id: 7,  depth: 4, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 20, cost: 3, time: '00:00:01',
        actualRows: 20, cr: 8, pr: 2, pw: 0, elapsed: '00:00:00.02',
        note: '두 번째 실행. DEPARTMENTS 전체 스캔(Build Input).' },
      { id: 8,  depth: 4, operation: 'TABLE ACCESS FULL', name: 'EMPLOYEES',   rows: 15, cost: 3, time: '00:00:01',
        actualRows: 15, cr: 8, pr: 2, pw: 0, elapsed: '00:00:00.02',
        note: '세 번째 실행. EMPLOYEES 전체 스캔(메인 쿼리 조회용).' },
    ],
    showStats: true,
    predicatesKo: [
      '   2 - access("AVG_INFO"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")',
      '       filter("E"."SALARY">="AVG_INFO"."AVG_SAL")',
      '   6 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")',
    ],
    predicatesEn: [
      '   2 - access("AVG_INFO"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")',
      '       filter("E"."SALARY">="AVG_INFO"."AVG_SAL")',
      '   6 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")',
    ],
    projectionKo: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, D.DEPARTMENT_NAME, AVG_INFO.AVG_SAL]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, D.DEPARTMENT_NAME, AVG_INFO.AVG_SAL]',
      '   3 - output: [AVG_INFO.DEPARTMENT_ID, AVG_INFO.AVG_SAL]',
      '   4 - output: [DEPARTMENT_ID, ROUND(AVG(SALARY),0)]',
      '   5 - output: [SALARY, DEPARTMENT_ID]',
      '   6 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID, D.DEPARTMENT_NAME]',
      '   7 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME]',
      '   8 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID]',
    ],
    projectionEn: [
      '   1 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, D.DEPARTMENT_NAME, AVG_INFO.AVG_SAL]',
      '   2 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, D.DEPARTMENT_NAME, AVG_INFO.AVG_SAL]',
      '   3 - output: [AVG_INFO.DEPARTMENT_ID, AVG_INFO.AVG_SAL]',
      '   4 - output: [DEPARTMENT_ID, ROUND(AVG(SALARY),0)]',
      '   5 - output: [SALARY, DEPARTMENT_ID]',
      '   6 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID, D.DEPARTMENT_NAME]',
      '   7 - output: [D.DEPARTMENT_ID, D.DEPARTMENT_NAME]',
      '   8 - output: [E.EMPLOYEE_ID, E.LAST_NAME, E.SALARY, E.DEPARTMENT_ID]',
    ],
    statsKo: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 30',
      'physical reads       =  7',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       =  8',
    ],
    statsEn: [
      'recursive calls      =  0',
      'db block gets        =  0',
      'consistent gets      = 30',
      'physical reads       =  7',
      'redo size            =  0',
      'sorts (memory)       =  1',
      'sorts (disk)         =  0',
      'rows processed       =  8',
    ],
    callStatsKo: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.01     0.14     7     30        0     8
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.01     0.14     7     30        0     8`,
    callStatsEn: `CALL     COUNT  CPU   ELAPSED  DISK  QUERY  CURRENT  ROWS
------- ------  ----  -------  ----  -----  -------  ----
Parse        1  0.00     0.00     0      0        0     0
Execute      1  0.00     0.00     0      0        0     0
Fetch        1  0.01     0.14     7     30        0     8
------- ------  ----  -------  ----  -----  -------  ----
total        3  0.01     0.14     7     30        0     8`,
    reasonKo: `인라인 뷰(avg_info)는 별도의 서브쿼리처럼 보이지만,
CBO는 이를 독립적으로 실행한 뒤 결과를 조인에 사용해요.
EMPLOYEES 테이블이 두 번 스캔되는 것을 주목하세요.

실행 순서: ⑤ → ④ → ③(VIEW) → ⑦ → ⑧ → ⑥ → ② → ① → ⓪

인라인 뷰 블록 (③④⑤):
  ⑤ EMPLOYEES FTS → ④ HASH GROUP BY(부서별 AVG 계산) → ③ VIEW 완성.
  9개 부서의 (department_id, avg_sal) 쌍이 결과.

메인 쿼리 블록 (⑥⑦⑧):
  ⑦ DEPARTMENTS FTS(Build Input) + ⑧ EMPLOYEES FTS(Probe) → ⑥ HASH JOIN.
  15명의 (직원정보 + 부서명) 결과.

최종 조인 ②:
  ③의 avg_info(9행)와 ⑥의 조인결과(15행)를 department_id로 Hash Join.
  filter("E"."SALARY">="AVG_INFO"."AVG_SAL")로 평균 이하 급여자 제외.
  → 8명 반환.

2번 Predicate에서 access와 filter가 함께:
  access("AVG_INFO"."DEPARTMENT_ID"="E"."DEPARTMENT_ID") → 조인 키
  filter("E"."SALARY">="AVG_INFO"."AVG_SAL") → 조인 후 추가 필터

EMPLOYEES가 두 번 스캔(⑤, ⑧)되는 이유:
  CBO는 인라인 뷰를 메인 쿼리에 머지(merge)하지 않았어요.
  쿼리 변환(Query Transformation)의 View Merging이 적용되지 않은 케이스예요.
  더 큰 테이블에서는 이 이중 스캔이 병목이 될 수 있어요.`,
    reasonEn: `The inline view (avg_info) looks like a separate subquery, but the CBO
executes it independently and then joins its result with the main query.
Notice that the EMPLOYEES table is scanned twice.

Execution order: ⑤ → ④ → ③(VIEW) → ⑦ → ⑧ → ⑥ → ② → ① → ⓪

Inline view block (③④⑤):
  ⑤ EMPLOYEES FTS → ④ HASH GROUP BY (compute AVG per dept) → ③ VIEW materialized.
  Result: 9 rows of (department_id, avg_sal).

Main query block (⑥⑦⑧):
  ⑦ DEPARTMENTS FTS (Build Input) + ⑧ EMPLOYEES FTS (Probe) → ⑥ HASH JOIN.
  Result: 15 rows with employee info + department name.

Final join ②:
  avg_info (9 rows) joined to the op ⑥ result (15 rows) on department_id.
  filter("E"."SALARY">="AVG_INFO"."AVG_SAL") removes below-average earners.
  → 8 employees returned.

Op 2 Predicate has both access and filter:
  access("AVG_INFO"."DEPARTMENT_ID"="E"."DEPARTMENT_ID") — join key (hash bucket probe)
  filter("E"."SALARY">="AVG_INFO"."AVG_SAL") — post-join row filter

Why EMPLOYEES is scanned twice (⑤ and ⑧):
  The CBO did not merge the inline view into the main query (no View Merging transformation).
  In larger tables this double scan would be a significant bottleneck —
  a WITH clause (CTE) or materialized hint can avoid it.`,
    predicateAnnotations: [
      { line: '2 - access("AVG_INFO"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")', noteKo: 'Op 2(최종 HASH JOIN)의 조인 키예요. avg_info(9행)로 해시 테이블을 구성하고, 외부 EMPLOYEES 결과(15행)의 DEPARTMENT_ID로 해시 버킷을 탐색해요.', noteEn: 'Join key for Op 2 (final HASH JOIN). avg_info (9 rows) builds the hash table; the outer EMPLOYEES result (15 rows) probes using DEPARTMENT_ID.' },
      { line: 'filter("E"."SALARY">="AVG_INFO"."AVG_SAL")', noteKo: '조인 후 추가 필터예요. DEPARTMENT_ID가 같은 쌍 중 SALARY가 부서 평균 미만인 직원을 제거해요. 조인 키와 다른 컬럼 비교이므로 access가 아닌 filter예요.', noteEn: 'Post-join filter applied after matching by department_id. Removes employees whose salary is below their department average. This is a filter (not access) because it compares a different column than the join key.' },
      { line: '6 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', noteKo: 'Op 6(내부 HASH JOIN): DEPARTMENTS와 EMPLOYEES를 DEPARTMENT_ID로 조인해요. 이 조인은 메인 쿼리의 직원정보 + 부서명 결합이에요.', noteEn: 'Op 6 (inner HASH JOIN): joins DEPARTMENTS and EMPLOYEES on DEPARTMENT_ID. This is the main query\'s employee-info + department-name combination.' },
    ],
    projectionAnnotations: [
      { line: '3 - output: [AVG_INFO.DEPARTMENT_ID, AVG_INFO.AVG_SAL]', noteKo: 'VIEW(인라인 뷰 구체화 결과)는 DEPARTMENT_ID와 AVG_SAL 두 컬럼만 출력해요. GROUP BY 집계 결과예요.', noteEn: 'VIEW (materialized inline view) outputs only DEPARTMENT_ID and AVG_SAL — the two columns produced by the GROUP BY aggregation.' },
      { line: '5 - output: [SALARY, DEPARTMENT_ID]', noteKo: '인라인 뷰 내부 EMPLOYEES FTS는 AVG 계산에 필요한 SALARY와 GROUP BY 키인 DEPARTMENT_ID만 꺼내요. EMPLOYEE_ID, LAST_NAME 등은 이 단계에서 필요하지 않아요.', noteEn: 'The inline view\'s internal EMPLOYEES FTS projects only SALARY (for AVG) and DEPARTMENT_ID (for GROUP BY). EMPLOYEE_ID, LAST_NAME, etc. are not needed at this stage.' },
    ],
    statsAnnotations: [
      { line: 'consistent gets      = 30', noteKo: '논리 블록 30개: 인라인 뷰 EMPLOYEES FTS 8 + DEPARTMENTS FTS 8 + 메인쿼리 EMPLOYEES FTS 8 + LOCATIONS 6. EMPLOYEES 이중 스캔이 CR을 높여요.', noteEn: '30 logical blocks: inline view EMPLOYEES FTS (8) + DEPARTMENTS FTS (8) + main query EMPLOYEES FTS (8) + overhead (6). The double EMPLOYEES scan inflates the CR.' },
      { line: 'rows processed       =  8', noteKo: '8명이 자신의 부서 평균 급여 이상을 받는 직원이에요. 나머지 7명은 filter("SALARY">="AVG_SAL")에서 제거돼요.', noteEn: '8 employees earn at or above their department\'s average salary. The remaining 7 are removed by the filter("SALARY">="AVG_SAL") step.' },
    ],
  },
]

// ── 난이도 배지 ────────────────────────────────────────────────────────────────

const DIFF_STYLE = {
  simple:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium:  'bg-amber-100   text-amber-700   border-amber-200',
  complex: 'bg-rose-100    text-rose-700    border-rose-200',
}
const DIFF_LABEL = {
  ko: { simple: '기본', medium: '중급', complex: '고급' },
  en: { simple: 'Basic', medium: 'Intermediate', complex: 'Advanced' },
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function OptimizerSimulator() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const [selected, setSelected] = useState<number>(1)

  const q = QUERIES.find((q) => q.id === selected)!

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── 좌측 쿼리 목록 ── */}
      <aside className="flex w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-slate-200 p-3 dark:border-slate-700">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {isKo ? '예제 쿼리' : 'Example Queries'}
        </p>
        {QUERIES.map((qry) => (
          <button
            key={qry.id}
            onClick={() => setSelected(qry.id)}
            className={`flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
              selected === qry.id
                ? 'bg-orange-50 ring-1 ring-orange-300 dark:bg-orange-950/30'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-semibold text-foreground">
              {isKo ? qry.labelKo : qry.labelEn}
            </span>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${DIFF_STYLE[qry.difficulty]}`}>
              {DIFF_LABEL[lang][qry.difficulty]}
            </span>
          </button>
        ))}
      </aside>

      {/* ── 우측 상세 ── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 p-6">

          {/* SQL */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">SQL</p>
            <pre className="overflow-x-auto rounded-xl bg-[#0f172a] px-5 py-4 font-mono text-xs leading-relaxed text-[#94a3b8]">
              {q.sql}
            </pre>
          </div>

          {/* 왜 이런 실행 계획인가 */}
          <div className="rounded-xl border border-orange-200 bg-orange-50/60 px-5 py-4 dark:border-orange-900/40 dark:bg-orange-950/20">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-400">
              <IconPlayerPlay size={13} />
              {isKo ? '왜 이런 실행 계획인가?' : 'Why this execution plan?'}
            </p>
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
              {isKo ? q.reasonKo : q.reasonEn}
            </pre>
          </div>

          <Divider />

          {/* ① Call Statistics */}
          <PlanAreaBlock num="①" labelKo="Call Statistics (TKPROF)" labelEn="Call Statistics (TKPROF)" lang={lang}>
            <DarkBlock lines={(isKo ? q.callStatsKo : q.callStatsEn).split('\n')} color="#94a3b8" />
            {q.callStatsAnnotations && <AnnotationPanel annotations={q.callStatsAnnotations} lang={lang} />}
          </PlanAreaBlock>

          {/* ② Row Source Operation */}
          <PlanAreaBlock num="②" labelKo="Row Source Operation" labelEn="Row Source Operation" lang={lang}>
            <ExplainPlanTable rows={q.planRows} showStats={q.showStats} lang={lang} />
          </PlanAreaBlock>

          {/* ③ Predicate Information */}
          <PlanAreaBlock num="③" labelKo="Predicate Information" labelEn="Predicate Information" lang={lang}>
            <DarkBlock lines={isKo ? q.predicatesKo : q.predicatesEn} color="#fbbf24" />
            {q.predicateAnnotations && <AnnotationPanel annotations={q.predicateAnnotations} lang={lang} />}
          </PlanAreaBlock>

          {/* ④ Column Projection */}
          <PlanAreaBlock num="④" labelKo="Column Projection" labelEn="Column Projection" lang={lang}>
            <DarkBlock lines={isKo ? q.projectionKo : q.projectionEn} color="#86efac" />
            {q.projectionAnnotations && <AnnotationPanel annotations={q.projectionAnnotations} lang={lang} />}
          </PlanAreaBlock>

          {/* ⑤ Statistics */}
          <PlanAreaBlock num="⑤" labelKo="Statistics (AUTOTRACE)" labelEn="Statistics (AUTOTRACE)" lang={lang}>
            <DarkBlock lines={isKo ? q.statsKo : q.statsEn} color="#94a3b8" />
            {q.statsAnnotations && <AnnotationPanel annotations={q.statsAnnotations} lang={lang} />}
          </PlanAreaBlock>

        </div>
      </main>
    </div>
  )
}
