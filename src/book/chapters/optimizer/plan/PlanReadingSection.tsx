import { IconPencil } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  Divider,
  AccordionSection,
  SqlBlock,
  InfoBox,
} from '../../shared'

const T = {
  ko: {
    title: '실행 계획 읽는 연습하기',
    subtitle: '실제 DBMS_XPLAN 출력을 보고 스스로 해석해 본 뒤, 아코디언을 열어 정답과 비교해 보세요.',
    intro:
      '실행 계획을 잘 읽으려면 반복 연습이 중요합니다. 아래 5개의 예제를 순서대로 풀어보세요. 각 예제마다 실행 계획 출력이 먼저 보이고, "해설 보기"를 누르면 정답을 확인할 수 있습니다.',
    answerLabel: '해설 보기',
  },
  en: {
    title: 'Practice Reading Execution Plans',
    subtitle: 'Study each DBMS_XPLAN output, try to interpret it on your own, then expand the accordion to check your answer.',
    intro:
      'Reading execution plans well takes practice. Work through the five examples below in order. Each one shows the plan output first — expand "Show Answer" when you are ready to check.',
    answerLabel: 'Show Answer',
  },
}

// ── 공통: 다크 터미널 출력 렌더러 ──────────────────────────────────────────────

interface OutputLine {
  text: string
  color?: string
}

function PlanOutput({ lines, caption }: { lines: OutputLine[]; caption?: string }) {
  return (
    <div className="my-4">
      {caption && <p className="mb-1 text-xs font-semibold text-muted-foreground">{caption}</p>}
      <pre className="overflow-x-auto rounded-xl bg-[#0f172a] px-5 py-4 font-mono text-xs leading-relaxed">
        {lines.map((l, i) => (
          <span key={i} className="block whitespace-pre" style={{ color: l.color ?? '#94a3b8' }}>
            {l.text || ' '}
          </span>
        ))}
      </pre>
    </div>
  )
}

const pip = '#475569'
const hdr = '#64748b'
const op  = '#3b82f6'
const idx = '#16a34a'
const fts = '#ea580c'
const joi = '#7c3aed'
const pre = '#fbbf24'

// ── 연습 1: 단순 Index Range Scan ───────────────────────────────────────────────

const ex1Lines: OutputLine[] = [
  { text: '-------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                   | Name        | Rows | Cost (%CPU)|', color: hdr },
  { text: '-------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT            |             |   10 |     3   (0)|', color: op  },
  { text: '|* 1 |  TABLE ACCESS BY INDEX ROWID| EMPLOYEES   |   10 |     3   (0)|', color: fts },
  { text: '|* 2 |   INDEX RANGE SCAN          | EMP_DEPT_IX |   10 |     1   (0)|', color: idx },
  { text: '-------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
  { text: '-------------------------------------------------', color: pip },
  { text: '   1 - filter("E"."JOB_ID"=\'SA_REP\')', color: pre },
  { text: '   2 - access("E"."DEPARTMENT_ID"=80)', color: pre },
]

const ex1Sql = `SELECT employee_id, last_name, job_id
FROM   hr.employees e
WHERE  department_id = 80
AND    job_id = 'SA_REP';`

const ex1AnswerKo = `이 실행 계획은 두 단계로 구성됩니다.

① 2번 오퍼레이션 — INDEX RANGE SCAN (EMP_DEPT_IX)
  Predicate Information을 보면 access("E"."DEPARTMENT_ID"=80)
  EMP_DEPT_IX 인덱스를 Range Scan하여 DEPARTMENT_ID = 80인 ROWID를 수집합니다.
  인덱스 선두 컬럼이 = 조건이므로 효율적인 탐색입니다.

② 1번 오퍼레이션 — TABLE ACCESS BY INDEX ROWID (EMPLOYEES)
  filter("E"."JOB_ID"='SA_REP')
  ROWID로 테이블에 접근한 뒤, JOB_ID = 'SA_REP' 조건을 추가로 필터링합니다.
  JOB_ID는 인덱스에 없으므로 access가 아닌 filter로 처리됩니다.
  테이블을 읽은 후 버려지는 행이 발생할 수 있습니다.

포인트: JOB_ID까지 인덱스에 포함시키면(복합 인덱스) filter를 access로 바꿔 테이블 접근 횟수를 줄일 수 있습니다.`

const ex1AnswerEn = `This plan has two steps.

① Operation 2 — INDEX RANGE SCAN (EMP_DEPT_IX)
  Predicate: access("E"."DEPARTMENT_ID"=80)
  The index is range-scanned to collect ROWIDs where DEPARTMENT_ID = 80.
  An equality condition on the leading index column means this is an efficient lookup.

② Operation 1 — TABLE ACCESS BY INDEX ROWID (EMPLOYEES)
  Predicate: filter("E"."JOB_ID"='SA_REP')
  Each ROWID is used to fetch a table row, then JOB_ID = 'SA_REP' is tested.
  JOB_ID is not in the index, so it can only be a filter — rows are read from the table and then discarded if they don't match.

Tip: Adding JOB_ID to the index (composite index) would convert the filter into an access predicate, reducing table visits.`

// ── 연습 2: Full Table Scan vs Index ───────────────────────────────────────────

const ex2Lines: OutputLine[] = [
  { text: '---------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation         | Name      | Rows | Bytes | Cost (%CPU)|      |', color: hdr },
  { text: '---------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT  |           | 107  |  2996 |     3   (0)|      |', color: op  },
  { text: '|  1 |  TABLE ACCESS FULL| EMPLOYEES | 107  |  2996 |     3   (0)|      |', color: fts },
  { text: '---------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Note', color: '#f59e0b' },
  { text: '-----', color: pip },
  { text: '   - dynamic statistics used: dynamic sampling (level=2)', color: hdr },
]

const ex2Sql = `SELECT employee_id, last_name, salary
FROM   hr.employees
WHERE  salary > 10000;`

const ex2AnswerKo = `전체 107행을 TABLE ACCESS FULL로 읽고 있습니다.

왜 인덱스를 사용하지 않을까요?
  - salary > 10000 조건의 선택도가 낮습니다.
    CBO는 107행(전체 107행 중 107행)을 반환한다고 추정했습니다.
    즉, 거의 모든 행이 조건에 해당한다고 판단해 인덱스보다 FTS가 저렴하다고 결정한 것입니다.
  - 실제 테이블이 작으면 FTS의 블록 읽기 비용(Cost=3)이 인덱스 경유 비용보다 낮습니다.

Note 항목 해석:
  dynamic statistics used: 테이블에 최신 통계가 없어 동적 샘플링(level=2)으로 추정했습니다.
  신뢰도 높은 통계를 위해 DBMS_STATS.GATHER_TABLE_STATS 실행을 권장합니다.

포인트: 대부분의 행이 반환될 때는 FTS가 정상입니다. 인덱스가 없어서가 아니라, CBO가 FTS를 더 싸다고 판단한 것입니다.`

const ex2AnswerEn = `The plan does a TABLE ACCESS FULL to read all 107 rows.

Why no index?
  - The selectivity of salary > 10000 is very low (almost all rows match).
    CBO estimated 107 rows returned out of 107 total — nearly the entire table.
    When most rows qualify, scanning the index and then jumping to the table for each ROWID costs more than reading the table once sequentially.
  - For a small table, FTS Cost=3 is already cheaper than index-based access.

Note section:
  "dynamic statistics used" means there were no up-to-date statistics on this table, so Oracle used dynamic sampling at level 2 to estimate cardinality.
  Run DBMS_STATS.GATHER_TABLE_STATS for reliable statistics.

Key point: FTS on a small or low-selectivity query is correct optimizer behavior, not a problem to fix.`

// ── 연습 3: Nested Loop Join ────────────────────────────────────────────────────

const ex3Lines: OutputLine[] = [
  { text: '-----------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                    | Name        | Starts | E-Rows | A-Rows |', color: hdr },
  { text: '-----------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT             |             |      1 |      1 |      1 |', color: op  },
  { text: '|  1 |  NESTED LOOPS                |             |      1 |      1 |      1 |', color: joi },
  { text: '|  2 |   TABLE ACCESS BY INDEX ROWID| EMPLOYEES   |      1 |      1 |      1 |', color: fts },
  { text: '|* 3 |    INDEX UNIQUE SCAN         | EMP_EMP_ID_PK|     1 |      1 |      1 |', color: idx },
  { text: '|* 4 |   TABLE ACCESS BY INDEX ROWID| DEPARTMENTS |      1 |      1 |      1 |', color: fts },
  { text: '|* 5 |    INDEX UNIQUE SCAN         | DEPT_ID_PK  |      1 |      1 |      1 |', color: idx },
  { text: '-----------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
  { text: '-------------------------------------------------', color: pip },
  { text: '   3 - access("E"."EMPLOYEE_ID"=100)', color: pre },
  { text: '   4 - filter("D"."LOCATION_ID"=1700)', color: pre },
  { text: '   5 - access("D"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")', color: pre },
]

const ex3Sql = `SELECT e.last_name, d.department_name, d.location_id
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.employee_id = 100
AND    d.location_id = 1700;`

const ex3AnswerKo = `Nested Loop Join으로 두 테이블을 조인합니다. 실행 순서는 ③ → ② → ⑤ → ④ → ① → ⓪ 입니다.

드라이빙 테이블: EMPLOYEES
  3번 — INDEX UNIQUE SCAN (EMP_EMP_ID_PK)
    access("E"."EMPLOYEE_ID"=100)
    PK 인덱스를 통해 EMPLOYEE_ID=100인 ROWID 1개를 찾습니다.
  2번 — TABLE ACCESS BY INDEX ROWID (EMPLOYEES)
    해당 ROWID로 테이블 접근, DEPARTMENT_ID 값을 꺼냅니다. A-Rows=1.

Inner 테이블: DEPARTMENTS
  5번 — INDEX UNIQUE SCAN (DEPT_ID_PK)
    access("D"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")
    앞서 꺼낸 DEPARTMENT_ID로 DEPARTMENTS PK를 탐색합니다.
  4번 — TABLE ACCESS BY INDEX ROWID (DEPARTMENTS)
    filter("D"."LOCATION_ID"=1700)
    테이블 접근 후 LOCATION_ID=1700 추가 필터. A-Rows=1.

포인트:
  - E-Rows = A-Rows = 1 — 통계가 정확하고 실행이 예상대로입니다.
  - LOCATION_ID가 filter인 이유: DEPT_ID_PK는 DEPARTMENT_ID만 포함하므로
    LOCATION_ID 조건은 테이블을 읽은 후에야 적용할 수 있습니다.
  - Nested Loop는 드라이빙 결과가 소량일 때 적합합니다. 여기서는 1행이므로 최적입니다.`

const ex3AnswerEn = `A Nested Loop Join connects the two tables. Execution order: ③ → ② → ⑤ → ④ → ① → ⓪.

Driving table: EMPLOYEES
  Step 3 — INDEX UNIQUE SCAN (EMP_EMP_ID_PK)
    access("E"."EMPLOYEE_ID"=100)
    The PK index finds exactly one ROWID for EMPLOYEE_ID=100.
  Step 2 — TABLE ACCESS BY INDEX ROWID (EMPLOYEES)
    Fetches the row via ROWID to retrieve DEPARTMENT_ID. A-Rows=1.

Inner table: DEPARTMENTS
  Step 5 — INDEX UNIQUE SCAN (DEPT_ID_PK)
    access("D"."DEPARTMENT_ID"="E"."DEPARTMENT_ID")
    Uses the DEPARTMENT_ID from the driving row to probe the DEPARTMENTS PK index.
  Step 4 — TABLE ACCESS BY INDEX ROWID (DEPARTMENTS)
    filter("D"."LOCATION_ID"=1700)
    Row is fetched, then tested against LOCATION_ID=1700. A-Rows=1.

Key points:
  - E-Rows = A-Rows = 1 everywhere — statistics are accurate, plan matched reality.
  - LOCATION_ID is a filter (not access) because DEPT_ID_PK only covers DEPARTMENT_ID;
    the extra condition can only be checked after reading the table row.
  - Nested Loop is ideal when the driving result set is tiny — here it is exactly 1 row.`

// ── 연습 4: Hash Join + 통계 오차 ──────────────────────────────────────────────

const ex4Lines: OutputLine[] = [
  { text: '------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation          | Name        | Starts | E-Rows | A-Rows |  CR |  PR |', color: hdr },
  { text: '------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT   |             |      1 |    500 |     12 |  34 |   8 |', color: op  },
  { text: '|* 1 |  HASH JOIN         |             |      1 |    500 |     12 |  34 |   8 |', color: joi },
  { text: '|  2 |   TABLE ACCESS FULL| DEPARTMENTS |      1 |     27 |     27 |   7 |   7 |', color: fts },
  { text: '|* 3 |   TABLE ACCESS FULL| EMPLOYEES   |      1 |    500 |    107 |  27 |   1 |', color: fts },
  { text: '------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
  { text: '-------------------------------------------------', color: pip },
  { text: '   1 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', color: pre },
  { text: '   3 - filter("E"."SALARY">15000)', color: pre },
]

const ex4Sql = `SELECT /*+ gather_plan_statistics */
       e.last_name, d.department_name, e.salary
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.salary > 15000;`

const ex4AnswerKo = `Hash Join으로 두 테이블을 조인하며, 두 가지 문제를 읽어낼 수 있습니다.

실행 순서: ② → ③ → ① → ⓪

2번 — TABLE ACCESS FULL (DEPARTMENTS): E-Rows=27, A-Rows=27 → 정확. CR=7, PR=7(첫 실행으로 디스크에서 읽음).
3번 — TABLE ACCESS FULL (EMPLOYEES): E-Rows=500, A-Rows=107 → 통계 오차 발생!
  filter("E"."SALARY">15000) — SALARY 컬럼에 히스토그램이 없으면 CBO는 균등 분포를 가정합니다.
  실제로는 107행이 조건에 맞는데 CBO는 500행으로 과대 추정했습니다.

문제 ①: E-Rows(500) >> A-Rows(107) — 통계 오차
  CBO가 반환 행 수를 과대 추정 → 더 비싼 Hash Join을 선택했을 가능성.
  실제 107행이라면 Nested Loop도 고려될 수 있었습니다.
  해결: SALARY 컬럼에 히스토그램 수집(DBMS_STATS에서 METHOD_OPT 지정).

문제 ②: PR=8 — 물리 읽기 발생
  DEPARTMENTS(PR=7)와 EMPLOYEES 일부가 Buffer Cache에 없어 디스크에서 읽었습니다.
  두 번째 실행에서 PR이 0이 되면 정상(Buffer Cache 적재). 계속 높으면 캐시 크기 검토.`

const ex4AnswerEn = `A Hash Join connects the two tables. Two issues are visible in this plan.

Execution order: ② → ③ → ① → ⓪

Step 2 — TABLE ACCESS FULL (DEPARTMENTS): E-Rows=27, A-Rows=27 → accurate. PR=7 (cold cache on first run).
Step 3 — TABLE ACCESS FULL (EMPLOYEES): E-Rows=500, A-Rows=107 → statistics mismatch!
  filter("E"."SALARY">15000) — without a histogram on SALARY, CBO assumes a uniform distribution.
  It estimated 500 rows but only 107 actually matched.

Issue ①: E-Rows(500) >> A-Rows(107) — statistics error
  CBO overestimated cardinality → may have chosen Hash Join when Nested Loop could be cheaper for 107 rows.
  Fix: gather a histogram on the SALARY column (METHOD_OPT in DBMS_STATS).

Issue ②: PR=8 — physical reads occurred
  DEPARTMENTS (PR=7) and part of EMPLOYEES were not in Buffer Cache, requiring disk reads.
  If PR drops to 0 on the second execution, the cache is now warm — that is normal.
  If PR stays high across executions, review Buffer Cache sizing.`

// ── 연습 5: 복잡한 서브쿼리 + Sort ─────────────────────────────────────────────

const ex5Lines: OutputLine[] = [
  { text: '--------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                | Name         | Starts | E-Rows | A-Rows |  CR |  PR |', color: hdr },
  { text: '--------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT         |              |      1 |     10 |     10 |  52 |   0 |', color: op  },
  { text: '|  1 |  SORT ORDER BY           |              |      1 |     10 |     10 |  52 |   0 |', color: joi },
  { text: '|* 2 |   HASH JOIN              |              |      1 |     10 |     10 |  52 |   0 |', color: joi },
  { text: '|* 3 |    VIEW                  |              |      1 |     10 |     10 |  25 |   0 |', color: fts },
  { text: '|* 4 |     HASH JOIN            |              |      1 |     10 |     10 |  25 |   0 |', color: joi },
  { text: '|  5 |      TABLE ACCESS FULL   | DEPARTMENTS  |      1 |     27 |     27 |   7 |   0 |', color: fts },
  { text: '|* 6 |      TABLE ACCESS FULL   | EMPLOYEES    |      1 |     10 |     10 |  18 |   0 |', color: fts },
  { text: '|  7 |    INDEX FAST FULL SCAN  | JH_EMAIL_IX  |      1 |    107 |    107 |  27 |   0 |', color: idx },
  { text: '--------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
  { text: '-------------------------------------------------', color: pip },
  { text: '   2 - access("V"."EMAIL"="J"."EMAIL")', color: pre },
  { text: '   3 - filter("V"."AVG_SAL">"V"."SALARY")', color: pre },
  { text: '   4 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', color: pre },
  { text: '   6 - filter("E"."SALARY">5000)', color: pre },
]

const ex5Sql = `-- 부서 평균 급여보다 낮은 급여를 받는 직원 중 이메일이 특정 목록에 있는 직원 조회
SELECT /*+ gather_plan_statistics */
       v.last_name, v.salary, v.department_name, v.avg_sal
FROM (
  SELECT e.last_name, e.salary, e.email,
         d.department_name,
         AVG(e.salary) OVER (PARTITION BY e.department_id) avg_sal
  FROM   hr.employees e
  JOIN   hr.departments d ON e.department_id = d.department_id
  WHERE  e.salary > 5000
) v
JOIN   hr.job_history jh ON v.email = jh.email   -- 이메일 매칭(예시)
WHERE  v.avg_sal > v.salary
ORDER BY v.salary;`

const ex5AnswerKo = `가장 복잡한 예제입니다. 안쪽부터 바깥쪽으로 읽어야 합니다.

실행 순서: ⑤ → ⑥ → ④(inner Hash Join) → ③(VIEW filter) → ⑦ → ②(outer Hash Join) → ① → ⓪

──── 안쪽 블록: 인라인 뷰(3~6번) ────

5번 — TABLE ACCESS FULL (DEPARTMENTS): 전체 27개 부서 읽기. CR=7, PR=0(Buffer Cache 히트).

6번 — TABLE ACCESS FULL (EMPLOYEES): filter("E"."SALARY">5000)
  SALARY > 5000인 직원만 선택. E-Rows=10, A-Rows=10 → 정확.

4번 — HASH JOIN: access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")
  DEPARTMENTS를 Build Input으로 해시 테이블 구성, EMPLOYEES로 Probe.
  여기서 AVG(salary) OVER(PARTITION BY department_id) 윈도우 함수도 계산됩니다.

3번 — VIEW: filter("V"."AVG_SAL">"V"."SALARY")
  인라인 뷰 결과에서 부서 평균보다 급여가 낮은 행만 남깁니다.

──── 바깥 블록: 이메일 조인(2번, 7번) ────

7번 — INDEX FAST FULL SCAN (JH_EMAIL_IX)
  JOB_HISTORY 테이블 대신 인덱스만 읽어 EMAIL 목록을 추출합니다.
  테이블 접근 없이 인덱스 블록만 스캔 → 효율적.

2번 — HASH JOIN: access("V"."EMAIL"="J"."EMAIL")
  인라인 뷰 결과(10행)와 JH_EMAIL_IX 스캔 결과(107행)를 이메일로 조인. A-Rows=10.

1번 — SORT ORDER BY: ORDER BY v.salary 정렬. PR=0이므로 PGA 메모리 정렬.

──── 전체 포인트 ────
  - 모든 PR=0 → Buffer Cache에서 전부 처리, 디스크 읽기 없음.
  - E-Rows = A-Rows 전 구간 일치 → 통계 정확.
  - 7번에서 테이블 대신 인덱스만 읽는 Index Fast Full Scan이 효율적입니다.
  - 만약 A-Rows가 크게 다르다면 인라인 뷰 내 SALARY 히스토그램을 확인하세요.`

const ex5AnswerEn = `This is the most complex example — read from innermost to outermost.

Execution order: ⑤ → ⑥ → ④(inner Hash Join) → ③(VIEW filter) → ⑦ → ②(outer Hash Join) → ① → ⓪

──── Inner block: inline view (steps 3–6) ────

Step 5 — TABLE ACCESS FULL (DEPARTMENTS): all 27 rows. CR=7, PR=0 (Buffer Cache hit).

Step 6 — TABLE ACCESS FULL (EMPLOYEES): filter("E"."SALARY">5000)
  Only employees with SALARY > 5000 pass. E-Rows=10, A-Rows=10 → accurate.

Step 4 — HASH JOIN: access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")
  DEPARTMENTS builds the hash table; EMPLOYEES probes it.
  The AVG(salary) OVER(PARTITION BY department_id) window function is also computed here.

Step 3 — VIEW: filter("V"."AVG_SAL">"V"."SALARY")
  Filters the inline view result to rows where salary is below the department average.

──── Outer block: email join (steps 2 & 7) ────

Step 7 — INDEX FAST FULL SCAN (JH_EMAIL_IX)
  Reads only the index to extract the EMAIL list from JOB_HISTORY without touching the table.
  Very efficient — index blocks only.

Step 2 — HASH JOIN: access("V"."EMAIL"="J"."EMAIL")
  Joins the 10 inline-view rows against the 107 index-scan rows by email. A-Rows=10.

Step 1 — SORT ORDER BY: sorts by v.salary. PR=0, so the sort fits entirely in PGA memory.

──── Overall observations ────
  - All PR=0 → every block served from Buffer Cache; no disk I/O.
  - E-Rows = A-Rows at every step → statistics are accurate throughout.
  - Step 7 uses Index Fast Full Scan instead of a table scan — an efficient pattern when only indexed columns are needed.
  - If A-Rows were to diverge significantly, check the histogram on the SALARY column inside the inline view.`

// ── 렌더 ───────────────────────────────────────────────────────────────────────

interface Exercise {
  num: number
  titleKo: string
  titleEn: string
  sql: string
  captionKo: string
  captionEn: string
  lines: OutputLine[]
  answerKo: string
  answerEn: string
}

const EXERCISES: Exercise[] = [
  {
    num: 1,
    titleKo: '연습 1 — Index Range Scan + filter 조건',
    titleEn: 'Exercise 1 — Index Range Scan with a filter predicate',
    sql: ex1Sql,
    captionKo: 'EXPLAIN PLAN + DBMS_XPLAN.DISPLAY 출력',
    captionEn: 'EXPLAIN PLAN + DBMS_XPLAN.DISPLAY output',
    lines: ex1Lines,
    answerKo: ex1AnswerKo,
    answerEn: ex1AnswerEn,
  },
  {
    num: 2,
    titleKo: '연습 2 — Full Table Scan이 선택된 이유',
    titleEn: 'Exercise 2 — Why the optimizer chose Full Table Scan',
    sql: ex2Sql,
    captionKo: 'EXPLAIN PLAN + DBMS_XPLAN.DISPLAY 출력',
    captionEn: 'EXPLAIN PLAN + DBMS_XPLAN.DISPLAY output',
    lines: ex2Lines,
    answerKo: ex2AnswerKo,
    answerEn: ex2AnswerEn,
  },
  {
    num: 3,
    titleKo: '연습 3 — Nested Loop Join 실행 순서 읽기',
    titleEn: 'Exercise 3 — Reading Nested Loop Join execution order',
    sql: ex3Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) 출력',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) output',
    lines: ex3Lines,
    answerKo: ex3AnswerKo,
    answerEn: ex3AnswerEn,
  },
  {
    num: 4,
    titleKo: '연습 4 — Hash Join + 통계 오차 진단',
    titleEn: 'Exercise 4 — Hash Join with a statistics mismatch',
    sql: ex4Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) 출력',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) output',
    lines: ex4Lines,
    answerKo: ex4AnswerKo,
    answerEn: ex4AnswerEn,
  },
  {
    num: 5,
    titleKo: '연습 5 — 인라인 뷰 + 윈도우 함수 + 복합 조인',
    titleEn: 'Exercise 5 — Inline view, window function, multi-join',
    sql: ex5Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) 출력',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) output',
    lines: ex5Lines,
    answerKo: ex5AnswerKo,
    answerEn: ex5AnswerEn,
  },
]

export function PlanReadingSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconPencil size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <Prose>{t.intro}</Prose>

      {EXERCISES.map((ex, i) => (
        <div key={ex.num}>
          {i > 0 && <Divider />}
          <SectionTitle>{isKo ? ex.titleKo : ex.titleEn}</SectionTitle>
          <div className="mt-4">
            <SqlBlock sql={ex.sql} />
          </div>
          <PlanOutput
            lines={ex.lines}
            caption={isKo ? ex.captionKo : ex.captionEn}
          />
          <AccordionSection title={t.answerLabel}>
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
              {isKo ? ex.answerKo : ex.answerEn}
            </pre>
          </AccordionSection>
        </div>
      ))}

      <div className="mt-8">
        <InfoBox variant="summary">
          {isKo
            ? '실행 계획을 읽는 핵심 순서: ① 가장 깊이 들여쓰인 자식부터 → ② 형제는 위→아래 순 → ③ Predicate Information으로 access/filter 확인 → ④ E-Rows와 A-Rows 비교로 통계 오차 탐지 → ⑤ CR·PR로 I/O 병목 확인.'
            : 'The core reading sequence: ① start from the most-indented child → ② siblings run top-to-bottom → ③ check Predicate Information for access vs filter → ④ compare E-Rows vs A-Rows to detect statistics errors → ⑤ use CR and PR to find I/O bottlenecks.'}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
