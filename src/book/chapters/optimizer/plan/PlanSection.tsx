import { IconListSearch } from '@tabler/icons-react'
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
  AccordionSection,
  SqlBlock,
} from '../../shared'
import { ExplainPlanTable } from '../shared/diagrams'
import type { PlanRow } from '../shared/diagrams'

// ── 예시 실행 계획 데이터 ─────────────────────────────────────────────────────

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 50, cost: 12, note: '최종 SELECT 문. 여기서 실행이 끝나고 결과가 반환됩니다.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 50, cost: 12, note: '두 자식 결과를 해시 테이블로 조인합니다. 먼저 작은 쪽을 메모리에 빌드하고, 큰 쪽으로 프로브합니다.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, note: 'DEPARTMENTS 테이블 전체를 순차 읽기. 블록 수가 적어 FTS가 선택됐습니다.' },
  { id: 3, depth: 2, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 107, cost: 2, note: 'DEPARTMENT_ID 컬럼 인덱스를 범위 스캔. 조건에 맞는 ROWID 목록을 수집합니다.' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 50, cost: 12, note: 'Final SELECT. Execution ends here and results are returned.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 50, cost: 12, note: 'Joins two child results using a hash table. Builds from the smaller side, probes with the larger.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, note: 'Full sequential read of DEPARTMENTS. Few blocks, so FTS was chosen.' },
  { id: 3, depth: 2, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 107, cost: 2, note: 'Range scan on DEPARTMENT_ID index. Collects matching ROWIDs.' },
]

const STATS_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 50, cost: 12, actualRows: 50, cr: 18, pr: 0, pw: 0, elapsed: '00:00:00.02', note: '최종 SELECT — 실제 50행 반환, 논리 읽기 18블록, 물리 읽기 없음(캐시 히트)' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 50, cost: 12, actualRows: 50, cr: 18, pr: 0, pw: 0, elapsed: '00:00:00.02', note: 'CR=18은 이 노드가 처리하면서 발생한 논리 읽기 총합(자식 포함 누적). PR=0이므로 디스크 읽기 없음.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, actualRows: 27, cr: 7, pr: 0, pw: 0, elapsed: '00:00:00.01', note: '실제 27행 읽음. CR=7(논리 읽기 7블록). E-Rows=27과 A-Rows=27이 일치 → 통계 정확.' },
  { id: 3, depth: 2, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 107, cost: 2, actualRows: 107, cr: 3, pr: 0, pw: 0, elapsed: '00:00:00.01', note: '인덱스에서 107개 ROWID 수집. CR=3(루트→브랜치→리프 3블록). 물리 읽기 없음.' },
]

const STATS_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 50, cost: 12, actualRows: 50, cr: 18, pr: 0, pw: 0, elapsed: '00:00:00.02', note: 'Final SELECT — 50 rows returned, 18 logical reads, no physical reads (cache hit).' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 50, cost: 12, actualRows: 50, cr: 18, pr: 0, pw: 0, elapsed: '00:00:00.02', note: 'CR=18 is the cumulative logical reads for this node and all its children. PR=0 means no disk reads.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 27, cost: 3, actualRows: 27, cr: 7, pr: 0, pw: 0, elapsed: '00:00:00.01', note: 'Read 27 rows. CR=7 (7 buffer blocks). E-Rows=A-Rows → statistics are accurate.' },
  { id: 3, depth: 2, operation: 'INDEX RANGE SCAN', name: 'EMP_DEPT_IX', rows: 107, cost: 2, actualRows: 107, cr: 3, pr: 0, pw: 0, elapsed: '00:00:00.01', note: 'Collected 107 ROWIDs from index. CR=3 (root→branch→leaf). No physical reads.' },
]

// ── T 문자열 ─────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: '실행 계획',
    subtitle:
      '실행 계획(Execution Plan)은 Oracle이 SQL을 어떤 순서로, 어떤 방법으로 실행할지를 기록한 문서입니다. CBO가 생성한 계획을 직접 들여다보면 성능 문제의 원인을 정확히 진단할 수 있습니다.',

    // ── 실행 계획이란 ──
    whatTitle: '실행 계획이란?',
    whatDesc:
      'SQL을 실행하기 전, CBO(Cost-Based Optimizer)는 가능한 모든 실행 방법을 탐색하고 비용이 가장 낮은 방법을 선택합니다. 이 선택 결과를 트리 형태로 기록한 것이 실행 계획입니다.\n\n실행 계획의 각 줄은 하나의 Row Source Operation입니다. 오퍼레이션들은 트리 구조를 이루며, 하단 자식부터 위쪽 부모 순서로 실행됩니다.',
    readRuleTitle: '읽는 방향',
    readRuleDesc:
      '실행 계획 트리는 들여쓰기가 가장 깊은 자식부터 실행됩니다. 자식이 여럿이면 위에서 아래 순서로 실행하고, 각 자식의 결과를 부모에게 전달합니다.\n\n아래 예시에서 실행 순서는 ③ → ② → ① → ⓪ 입니다.',
    planExCaption: '예시 실행 계획 (클릭하면 오퍼레이션 설명 표시)',

    // ── 조회 방법 ──
    howTitle: '실행 계획 조회 방법',
    howDesc: '실행 계획을 조회하는 방법은 크게 세 가지입니다. 각각 보여주는 정보의 깊이가 다릅니다.',
    howTable: [
      ['EXPLAIN PLAN + DBMS_XPLAN', '실행 없이 예상 계획 조회. 가장 기본적인 방법.', '계획 구조 파악, 인덱스 사용 여부 확인'],
      ['SET AUTOTRACE ON', '실행과 동시에 예상 계획 + 실행 통계 출력.', 'SQL*Plus에서 빠른 성능 확인'],
      ['DBMS_XPLAN.DISPLAY_CURSOR', '실제 실행된 커서의 계획 + 런타임 통계 조회.', '가장 정확한 실제 실행 정보 확인'],
    ],

    // ── EXPLAIN PLAN ──
    explainTitle: '① EXPLAIN PLAN + DBMS_XPLAN',
    explainDesc:
      'SQL을 실제로 실행하지 않고 예상 실행 계획만 확인합니다. PLAN_TABLE에 결과를 저장하고, DBMS_XPLAN.DISPLAY()로 출력합니다.\n\nformat 옵션으로 표시할 컬럼을 조정할 수 있습니다.',
    explainSql: `-- 1단계: 실행 계획 생성 (실제 실행 안 됨)\nEXPLAIN PLAN FOR\nSELECT e.employee_id, d.department_name\nFROM   hr.employees e\nJOIN   hr.departments d ON e.department_id = d.department_id\nWHERE  e.department_id > 50;\n\n-- 2단계: 계획 출력\nSELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(\n  format => 'BASIC +ROWS +COST +BYTES'\n));\n\n-- format 옵션:\n-- BASIC     : Id, Operation, Name\n-- +ROWS     : 예상 반환 행 수 (E-Rows)\n-- +COST     : 예상 비용\n-- +BYTES    : 예상 바이트\n-- +PREDICATE: 조건절 정보\n-- ALL       : 모든 정보 표시\n-- ALLSTATS LAST : 마지막 실행의 런타임 통계 포함`,
    explainColTitle: 'EXPLAIN PLAN 출력 컬럼',
    explainCols: [
      ['Id', '오퍼레이션 식별 번호. *가 붙으면 해당 행에 조건절(Predicate)이 있음.'],
      ['Operation', '실행 방법 (TABLE ACCESS FULL, INDEX RANGE SCAN 등). 들여쓰기가 깊을수록 먼저 실행.'],
      ['Name', '접근 대상 테이블 또는 인덱스 이름.'],
      ['Rows (E-Rows)', 'Estimated Rows. CBO가 이 오퍼레이션에서 반환될 것으로 추정한 행 수. 통계 기반.'],
      ['Bytes', 'CBO가 추정한 반환 데이터 총 바이트. Rows × 평균 행 길이.'],
      ['Cost', 'CBO가 계산한 상대적 비용. I/O + CPU 비용의 합산. 값 자체보다 오퍼레이션 간 상대 크기가 중요.'],
      ['Time', '예상 실행 시간(HH:MM:SS). Cost를 시간으로 환산한 추정값으로, 실제 시간과 다를 수 있음.'],
    ],

    // ── AUTOTRACE ──
    autotraceTitle: '② SET AUTOTRACE ON',
    autotraceDesc:
      'SQL*Plus 또는 SQLcl에서 사용하는 명령어로, SQL 실행과 동시에 실행 계획과 실행 통계를 함께 출력합니다. 별도 쿼리 없이 바로 결과를 볼 수 있어 빠른 확인에 편리합니다.',
    autotraceSql: `-- 실행 계획 + 통계 모두 출력 (결과도 출력)\nSET AUTOTRACE ON\n\n-- 실행 계획 + 통계만 출력 (결과는 숨김 → 대용량 쿼리 확인 시 유용)\nSET AUTOTRACE TRACEONLY\n\n-- 통계만 출력\nSET AUTOTRACE TRACEONLY STATISTICS\n\n-- 실행 계획만 출력 (실제 실행 안 됨)\nSET AUTOTRACE TRACEONLY EXPLAIN\n\n-- 비활성화\nSET AUTOTRACE OFF`,
    autotraceStatTitle: 'AUTOTRACE Statistics 항목',
    autotraceStats: [
      ['recursive calls', '내부적으로 발생한 재귀 SQL 수. 데이터 딕셔너리 조회, 트리거 등.'],
      ['db block gets', 'Current Read. DML이 최신 블록을 직접 읽은 횟수.'],
      ['consistent gets', 'Consistent Read (CR). SELECT가 읽기 일관성을 위해 읽은 논리 블록 수. 낮을수록 인덱스 활용이 잘 된 것.'],
      ['physical reads', 'PR. Buffer Cache에 없어 디스크에서 직접 읽은 블록 수. 0에 가까울수록 좋음.'],
      ['redo size', 'DML로 생성된 Redo 로그 바이트 수. INSERT/UPDATE/DELETE 규모 지표.'],
      ['sorts (memory)', '메모리 내 정렬 횟수. PGA 내 Sort Area에서 처리됨.'],
      ['sorts (disk)', '디스크로 넘친 정렬 횟수. 0이 되도록 PGA 크기를 조정할 것.'],
      ['rows processed', '최종으로 처리(반환)된 행 수.'],
    ],

    // ── DISPLAY_CURSOR ──
    cursorTitle: '③ DBMS_XPLAN.DISPLAY_CURSOR (가장 정확)',
    cursorDesc:
      '실제로 실행된 SQL 커서의 실행 계획과 런타임 통계를 조회합니다. EXPLAIN PLAN은 실행 전 추정값이지만, DISPLAY_CURSOR는 실제 실행 후 측정값을 보여줍니다.\n\n특히 ALLSTATS LAST 옵션을 쓰면 각 오퍼레이션의 실제 처리 행 수(A-Rows)와 논리 읽기(CR) 등을 볼 수 있어 CBO 추정값과 실제값의 차이를 정확히 진단할 수 있습니다.',
    cursorSql: `-- SQL을 실행한 뒤\nSELECT /*+ gather_plan_statistics */\n       e.employee_id, d.department_name\nFROM   hr.employees e\nJOIN   hr.departments d ON e.department_id = d.department_id\nWHERE  e.department_id > 50;\n\n-- 방금 실행한 커서의 실행 계획 + 런타임 통계 조회\nSELECT * FROM TABLE(\n  DBMS_XPLAN.DISPLAY_CURSOR(\n    sql_id  => NULL,      -- NULL이면 가장 마지막 실행 커서\n    format  => 'ALLSTATS LAST'\n  )\n);\n\n-- sql_id를 직접 지정하려면:\n-- SELECT sql_id, sql_text FROM v$sql WHERE sql_text LIKE '%employee_id%';`,
    cursorColTitle: 'ALLSTATS LAST 추가 컬럼 (Row Source Operation)',
    cursorCols: [
      ['Starts', '이 오퍼레이션이 실행된 횟수. Nested Loop 내부 오퍼레이션은 드라이빙 행 수만큼 반복.'],
      ['E-Rows', 'Estimated Rows. CBO가 추정한 반환 행 수.'],
      ['A-Rows', 'Actual Rows. 실제로 이 오퍼레이션이 반환한 행 수. E-Rows와 크게 다르면 통계 문제.'],
      ['A-Time', 'Actual Elapsed Time. 이 오퍼레이션의 실제 경과 시간 (누적).'],
      ['CR', 'Consistent Reads. 이 오퍼레이션이 읽기 일관성을 위해 읽은 논리 블록 수 (누적).'],
      ['PR', 'Physical Reads. 디스크에서 읽은 블록 수. 0이면 Buffer Cache에서 모두 처리.'],
      ['PW', 'Physical Writes. Direct Path Write 등으로 디스크에 쓴 블록 수.'],
    ],
    cursorNote:
      '/*+ gather_plan_statistics */ 힌트를 붙이면 Row Source Statistics가 수집됩니다. 힌트 없이 실행했다면 statistics_level = ALL 세션 파라미터를 먼저 설정하세요.',
    statsExCaption: 'ALLSTATS LAST 출력 예시 — CR/PR/A-Rows 포함 (클릭하면 설명)',

    // ── E-Rows vs A-Rows ──
    diagTitle: 'E-Rows vs A-Rows — 통계 진단',
    diagDesc:
      'E-Rows(추정)와 A-Rows(실제)의 차이가 클수록 CBO가 잘못된 계획을 선택했을 가능성이 높습니다. 이 차이가 발생하는 원인과 대처 방법입니다.',
    diagTable: [
      ['E-Rows ≈ A-Rows', '통계 정확. CBO 추정이 실제와 일치.', '정상'],
      ['E-Rows << A-Rows', 'CBO가 반환 행을 과소 추정. → 인덱스 스캔을 선택했지만 실제로 많은 행이 반환됨.', 'DBMS_STATS 재수집, 히스토그램 확인'],
      ['E-Rows >> A-Rows', 'CBO가 반환 행을 과대 추정. → Full Table Scan을 선택했지만 실제로 적은 행.', 'DBMS_STATS 재수집, 조건절 확인'],
    ],

    // ── CR/PR 해석 ──
    crTitle: 'CR · PR · PW — 블록 I/O 해석',
    crDesc:
      'CR(Consistent Reads)과 PR(Physical Reads)은 실행 계획에서 가장 중요한 성능 지표입니다. 이 값들은 해당 오퍼레이션과 모든 자식 오퍼레이션의 합산(누적)입니다.',
    crTable: [
      ['CR (Consistent Reads)', '논리적 블록 읽기 횟수. Buffer Cache에서 읽은 블록 수. SELECT의 핵심 지표. 낮을수록 좋음.', '인덱스 스캔 → CR 낮음 / FTS → CR 높음'],
      ['PR (Physical Reads)', '디스크에서 실제로 읽은 블록 수. 0이면 모두 Buffer Cache에서 처리(캐시 히트). 높으면 I/O 병목.', '첫 실행은 PR 높음, 반복 실행은 CR만 발생'],
      ['PW (Physical Writes)', '디스크에 직접 쓴 블록 수. Direct Path 로드, 정렬 임시 기록 등.', '일반 SELECT에서는 0이 정상'],
    ],
    crNote:
      'CR 값은 누적(cumulative)입니다. 부모 오퍼레이션의 CR에는 자식의 CR이 포함됩니다. 따라서 루트(SELECT STATEMENT)의 CR이 전체 쿼리의 총 논리 읽기 횟수입니다.',

    // ── 오퍼레이션 ──
    opTitle: '주요 Row Source Operation',
    opTable: [
      ['TABLE ACCESS FULL', '전체 테이블 순차 읽기. 멀티블록 I/O. 인덱스 없거나 대부분 행 반환 시.', 'CR 높음, 선택도 낮을 때 비효율'],
      ['TABLE ACCESS BY INDEX ROWID', '인덱스에서 얻은 ROWID로 테이블 블록 접근. 인덱스 스캔 후 항상 따라옴.', '행마다 블록 접근 → CR 누적'],
      ['INDEX RANGE SCAN', 'B-Tree 인덱스 범위 스캔. 범위 조건(>, <, BETWEEN, LIKE).', 'CR 낮음, 선택도 낮을 때 효율적'],
      ['INDEX UNIQUE SCAN', 'B-Tree 고유 인덱스 단일 탐색. 정확히 1행.', '가장 적은 CR. 루트→브랜치→리프 1회'],
      ['HASH JOIN', '작은 쪽을 해시 테이블로 빌드, 큰 쪽으로 프로브. 대용량 조인.', 'PGA 사용. 메모리 부족 시 PW 발생'],
      ['NESTED LOOPS', '드라이빙 행마다 내부 테이블 반복 탐색. 소규모 선택적 조인.', 'Starts 값이 높으면 반복 횟수 많음'],
      ['SORT ORDER BY', 'ORDER BY 처리를 위한 정렬. PGA Sort Area 사용.', 'sorts(disk) 발생 시 PGA 확장 필요'],
      ['FILTER', '조건 필터링. 서브쿼리 결과를 기반으로 행 걸러냄.', ''],
    ],

    // ── Optimizer Mode ──
    goalTitle: '옵티마이저 목표 (OPTIMIZER_MODE)',
    goalRows: [
      ['ALL_ROWS (기본값)', '전체 결과를 가장 빠르게 처리', '배치, 리포트, 집계 쿼리'],
      ['FIRST_ROWS_n', '처음 n개 행을 가장 빠르게 반환', '사용자 대면 페이지 조회'],
    ],
    goalNote:
      'FIRST_ROWS 목표에서는 Index Range Scan처럼 첫 행을 빨리 반환하는 액세스 패스가 선호됩니다. ALL_ROWS에서는 Hash Join + Fast Full Scan 같이 전체 처리량이 높은 방식이 선택됩니다.',

    // ── Hint ──
    hintTitle: '옵티마이저 힌트 (Hint)',
    hintDesc:
      '힌트는 SQL 주석 안에 작성하는 지시어로, 옵티마이저의 계획 선택을 특정 방향으로 강제합니다. 통계가 부정확하거나 특수한 요구사항이 있을 때 사용합니다.\n\n힌트는 최후의 수단입니다. 먼저 통계를 갱신하고 인덱스 설계를 검토한 뒤에도 계획이 나쁠 때만 사용합니다.',
    hintTable: [
      ['/*+ ALL_ROWS */', '전체 처리량 최소화 (기본값)', '배치 쿼리'],
      ['/*+ FIRST_ROWS(n) */', '처음 n개 행 빠르게', '페이지 조회'],
      ['/*+ INDEX(t idx) */', '특정 인덱스 강제 사용', '옵티마이저가 FTS 선택할 때'],
      ['/*+ FULL(t) */', '전체 테이블 스캔 강제', '인덱스 비효율 시'],
      ['/*+ USE_NL(t) */', 'Nested Loop Join 강제', '소규모 조인'],
      ['/*+ USE_HASH(t) */', 'Hash Join 강제', '대용량 조인'],
      ['/*+ PARALLEL(t, 4) */', '병렬 쿼리 4도로 수행', '대용량 배치'],
      ['/*+ NO_INDEX(t idx) */', '특정 인덱스 사용 금지', '인덱스 오사용 방지'],
      ['/*+ gather_plan_statistics */', 'Row Source Statistics 수집', 'DISPLAY_CURSOR 분석 시'],
    ],
    hintWarning:
      '힌트는 통계 갱신이나 인덱스 재설계로 해결되지 않을 때만 사용합니다. 힌트가 남발되면 유지보수가 어려워지고, 환경 변화에 따라 오히려 성능이 나빠질 수 있습니다.',
    hintSql: `-- 특정 인덱스 강제 사용\nSELECT /*+ INDEX(e EMP_DEPARTMENT_IX) */ employee_id\nFROM   hr.employees e\nWHERE  department_id = 90;\n\n-- Hash Join + 병렬 처리\nSELECT /*+ USE_HASH(d) PARALLEL(e, 4) */\n       e.employee_id, d.department_name\nFROM   hr.employees e\nJOIN   hr.departments d ON e.department_id = d.department_id;`,

    // ── Adaptive ──
    adaptiveTitle: '적응형 쿼리 최적화 (Adaptive Query Optimization)',
    adaptiveDesc:
      'Oracle 12c부터 도입된 기능으로, 실행 계획을 런타임에 조정합니다.\n\n동적 계획(Adaptive Plans): 통계 수집기(Statistics Collector)가 중간 집합 크기를 측정하여, 예측과 크게 다르면 Hash Join↔Nested Loop처럼 서브플랜을 런타임에 교체합니다.\n\n재최적화(Reoptimization): 첫 실행 후 실제 카디널리티를 피드백으로 저장하고, 다음 실행에서 더 나은 계획을 생성합니다.',
    adaptiveNote:
      'V$SQL_PLAN_STATISTICS_ALL 뷰에서 실제 실행 시 카디널리티(A-Rows)와 CBO 추정값(E-Rows)을 비교해 적응형 재최적화 여부를 확인할 수 있습니다.',

    summary: '실행 계획은 성능 진단의 시작점입니다. EXPLAIN PLAN으로 구조를 파악하고, DISPLAY_CURSOR ALLSTATS로 E-Rows↔A-Rows·CR·PR을 비교해 문제 오퍼레이션을 찾으세요. 통계 갱신이 먼저, 힌트는 마지막입니다.',
  },

  en: {
    title: 'Execution Plans',
    subtitle:
      'An execution plan is Oracle\'s record of how it will execute a SQL statement — what operations to perform, in what order, using which access paths. Reading the plan is the starting point for diagnosing any performance problem.',

    whatTitle: 'What is an Execution Plan?',
    whatDesc:
      'Before executing SQL, the CBO explores all valid execution methods and selects the one with the lowest estimated cost. The result of that selection, recorded as a tree of operations, is the execution plan.\n\nEach line in the plan is a Row Source Operation. Operations form a tree; execution runs from the deepest child up to the root.',
    readRuleTitle: 'Reading Order',
    readRuleDesc:
      'Execution starts at the most-indented child. When a node has multiple children they run top-to-bottom, passing their results up to the parent.\n\nIn the example below, the execution order is ③ → ② → ① → ⓪.',
    planExCaption: 'Sample execution plan (click a row to see its description)',

    howTitle: 'How to View an Execution Plan',
    howDesc: 'There are three main ways to view execution plans, each showing a different level of detail.',
    howTable: [
      ['EXPLAIN PLAN + DBMS_XPLAN', 'View estimated plan without running the SQL. The most basic method.', 'Understanding plan structure, checking index usage'],
      ['SET AUTOTRACE ON', 'Runs SQL and prints estimated plan + execution statistics together.', 'Quick checks in SQL*Plus'],
      ['DBMS_XPLAN.DISPLAY_CURSOR', 'View the plan + runtime statistics for an already-executed cursor.', 'Most accurate — shows what actually happened'],
    ],

    explainTitle: '① EXPLAIN PLAN + DBMS_XPLAN',
    explainDesc:
      'Generates the estimated execution plan without actually running the SQL. The plan is stored in PLAN_TABLE and displayed via DBMS_XPLAN.DISPLAY().\n\nThe format option controls which columns are included in the output.',
    explainSql: `-- Step 1: generate the plan (SQL is NOT executed)\nEXPLAIN PLAN FOR\nSELECT e.employee_id, d.department_name\nFROM   hr.employees e\nJOIN   hr.departments d ON e.department_id = d.department_id\nWHERE  e.department_id > 50;\n\n-- Step 2: display the plan\nSELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(\n  format => 'BASIC +ROWS +COST +BYTES'\n));\n\n-- format options:\n-- BASIC       : Id, Operation, Name\n-- +ROWS       : estimated row count (E-Rows)\n-- +COST       : estimated cost\n-- +BYTES      : estimated bytes\n-- +PREDICATE  : predicate info\n-- ALL         : all information\n-- ALLSTATS LAST : runtime stats from the last execution`,
    explainColTitle: 'EXPLAIN PLAN Output Columns',
    explainCols: [
      ['Id', 'Operation identifier. An asterisk (*) means this row has a predicate (filter or access condition).'],
      ['Operation', 'The execution method (TABLE ACCESS FULL, INDEX RANGE SCAN, etc.). More indented = executed first.'],
      ['Name', 'The table or index being accessed.'],
      ['Rows (E-Rows)', 'Estimated Rows. The number of rows CBO expects this operation to return. Based on statistics.'],
      ['Bytes', 'Estimated total bytes returned. Rows × average row length.'],
      ['Cost', 'Relative cost calculated by CBO (I/O + CPU). The absolute value matters less than relative comparisons.'],
      ['Time', 'Estimated wall time (HH:MM:SS). Derived from Cost — may differ significantly from actual time.'],
    ],

    autotraceTitle: '② SET AUTOTRACE ON',
    autotraceDesc:
      'A SQL*Plus / SQLcl command that prints the execution plan and execution statistics immediately after running a SQL statement. No extra queries needed — convenient for quick checks.',
    autotraceSql: `-- Print plan + statistics (also shows results)\nSET AUTOTRACE ON\n\n-- Plan + statistics only (suppress result output — useful for large result sets)\nSET AUTOTRACE TRACEONLY\n\n-- Statistics only\nSET AUTOTRACE TRACEONLY STATISTICS\n\n-- Estimated plan only (SQL is NOT executed)\nSET AUTOTRACE TRACEONLY EXPLAIN\n\n-- Turn off\nSET AUTOTRACE OFF`,
    autotraceStatTitle: 'AUTOTRACE Statistics Columns',
    autotraceStats: [
      ['recursive calls', 'Number of recursive SQL calls internally generated (data dictionary lookups, triggers, etc.).'],
      ['db block gets', 'Current Reads. Number of times a DML operation read the most current version of a block.'],
      ['consistent gets', 'Consistent Reads (CR). Blocks read for read-consistent queries. Lower means better index utilization.'],
      ['physical reads', 'PR. Blocks read directly from disk (not found in Buffer Cache). Lower is better; 0 means full cache hit.'],
      ['redo size', 'Bytes of redo log generated by DML. Indicates the scale of INSERT/UPDATE/DELETE.'],
      ['sorts (memory)', 'In-memory sort operations. Handled in PGA Sort Area.'],
      ['sorts (disk)', 'Sort operations that spilled to disk. Aim for 0 by tuning PGA size.'],
      ['rows processed', 'Final number of rows returned or processed by the statement.'],
    ],

    cursorTitle: '③ DBMS_XPLAN.DISPLAY_CURSOR (Most Accurate)',
    cursorDesc:
      'Queries the execution plan and runtime statistics for an already-executed SQL cursor. Unlike EXPLAIN PLAN (pre-execution estimates), DISPLAY_CURSOR shows measured values from the actual run.\n\nWith the ALLSTATS LAST format, you see actual row counts (A-Rows), logical reads (CR), and physical reads (PR) per operation — letting you pinpoint exactly where CBO estimates diverged from reality.',
    cursorSql: `-- Run the SQL with the gather_plan_statistics hint\nSELECT /*+ gather_plan_statistics */\n       e.employee_id, d.department_name\nFROM   hr.employees e\nJOIN   hr.departments d ON e.department_id = d.department_id\nWHERE  e.department_id > 50;\n\n-- View plan + runtime stats for the last executed cursor\nSELECT * FROM TABLE(\n  DBMS_XPLAN.DISPLAY_CURSOR(\n    sql_id  => NULL,      -- NULL = most recently executed cursor\n    format  => 'ALLSTATS LAST'\n  )\n);\n\n-- To specify a sql_id explicitly:\n-- SELECT sql_id, sql_text FROM v$sql WHERE sql_text LIKE '%employee_id%';`,
    cursorColTitle: 'ALLSTATS LAST Additional Columns (Row Source Statistics)',
    cursorCols: [
      ['Starts', 'Number of times this operation was executed. High values in Nested Loop inner operations are expected.'],
      ['E-Rows', 'Estimated Rows. CBO\'s predicted row count before execution.'],
      ['A-Rows', 'Actual Rows. Real row count produced by this operation. Large gap vs E-Rows → statistics problem.'],
      ['A-Time', 'Actual Elapsed Time for this operation (cumulative).'],
      ['CR', 'Consistent Reads. Logical block reads for read consistency (cumulative, includes children).'],
      ['PR', 'Physical Reads. Blocks read from disk. 0 = all served from Buffer Cache.'],
      ['PW', 'Physical Writes. Blocks written to disk (direct path, temp sort spill, etc.).'],
    ],
    cursorNote:
      'The /*+ gather_plan_statistics */ hint enables Row Source Statistics collection. Without it, set statistics_level = ALL at the session level before running your query.',
    statsExCaption: 'ALLSTATS LAST example — includes CR / PR / A-Rows (click a row for details)',

    diagTitle: 'E-Rows vs A-Rows — Diagnosing Statistics Problems',
    diagDesc:
      'A large gap between E-Rows (estimated) and A-Rows (actual) means CBO made a poor plan decision. Here are the causes and remedies.',
    diagTable: [
      ['E-Rows ≈ A-Rows', 'Statistics are accurate. CBO estimate matches reality.', 'Normal'],
      ['E-Rows << A-Rows', 'CBO underestimated row count → may have chosen an index scan that returns many more rows than expected.', 'Re-gather DBMS_STATS, check histograms'],
      ['E-Rows >> A-Rows', 'CBO overestimated row count → may have chosen Full Table Scan when few rows actually match.', 'Re-gather DBMS_STATS, review predicates'],
    ],

    crTitle: 'CR · PR · PW — Block I/O Metrics',
    crDesc:
      'CR (Consistent Reads) and PR (Physical Reads) are the most important performance metrics in an execution plan. These values are cumulative — each node\'s CR/PR includes all its children.',
    crTable: [
      ['CR (Consistent Reads)', 'Logical block reads for read consistency. Blocks served from Buffer Cache. Core metric for SELECT performance.', 'Index scan → low CR / FTS → high CR'],
      ['PR (Physical Reads)', 'Blocks read directly from disk. 0 means full Buffer Cache hit. High values indicate I/O bottleneck.', 'First run has PR; repeated runs use CR only'],
      ['PW (Physical Writes)', 'Blocks written to disk. Direct Path loads, sort temp spills, etc.', '0 is normal for plain SELECT'],
    ],
    crNote:
      'CR values are cumulative. A parent operation\'s CR includes all its children\'s CR. Therefore, the root (SELECT STATEMENT) CR equals the total logical reads for the entire query.',

    opTitle: 'Key Row Source Operations',
    opTable: [
      ['TABLE ACCESS FULL', 'Full sequential read. Multi-block I/O. Used when no usable index or most rows match.', 'High CR; inefficient when selectivity is low'],
      ['TABLE ACCESS BY INDEX ROWID', 'Fetches a table block using a ROWID from an index. Always follows an index scan.', 'Adds CR per row fetched'],
      ['INDEX RANGE SCAN', 'B-Tree range scan. Used for range predicates (>, <, BETWEEN, LIKE).', 'Low CR; efficient for low-selectivity predicates'],
      ['INDEX UNIQUE SCAN', 'Single B-Tree lookup on a unique index. Returns exactly 1 row.', 'Minimum CR: root→branch→leaf (1 traversal)'],
      ['HASH JOIN', 'Builds hash table from smaller input, probes with larger. Used for large joins.', 'Uses PGA; PW occurs if memory overflows'],
      ['NESTED LOOPS', 'For each driving row, probes the inner table. Used for small, selective joins.', 'High Starts value = many repetitions'],
      ['SORT ORDER BY', 'Sorting for ORDER BY. Uses PGA Sort Area.', 'sorts(disk) > 0 → increase PGA'],
      ['FILTER', 'Row filtering, often with subquery results.', ''],
    ],

    goalTitle: 'Optimizer Mode (OPTIMIZER_MODE)',
    goalRows: [
      ['ALL_ROWS (default)', 'Minimize total throughput — get all rows fast', 'Batch, reporting, aggregation'],
      ['FIRST_ROWS_n', 'Return first n rows as fast as possible', 'Interactive, user-facing queries'],
    ],
    goalNote:
      'Under FIRST_ROWS, the optimizer prefers access paths like Index Range Scan that return the first row quickly. Under ALL_ROWS, it favors high-throughput methods like Hash Join + Fast Full Scan.',

    hintTitle: 'Optimizer Hints',
    hintDesc:
      'A hint is a directive inside a SQL comment that forces the optimizer toward a specific plan. Use them when statistics are inaccurate or special requirements apply.\n\nHints are a last resort. First refresh statistics and review index design. Only use hints when the plan is still wrong after those steps.',
    hintTable: [
      ['/*+ ALL_ROWS */', 'Minimize total throughput (default)', 'Batch queries'],
      ['/*+ FIRST_ROWS(n) */', 'Return first n rows quickly', 'Paginated queries'],
      ['/*+ INDEX(t idx) */', 'Force use of a specific index', 'When optimizer picks FTS wrongly'],
      ['/*+ FULL(t) */', 'Force full table scan', 'When index use is inefficient'],
      ['/*+ USE_NL(t) */', 'Force Nested Loop Join', 'Small, selective joins'],
      ['/*+ USE_HASH(t) */', 'Force Hash Join', 'Large-volume joins'],
      ['/*+ PARALLEL(t, 4) */', 'Execute query with DOP 4', 'Large batch workloads'],
      ['/*+ NO_INDEX(t idx) */', 'Prevent use of a specific index', 'Avoid index misuse'],
      ['/*+ gather_plan_statistics */', 'Enable Row Source Statistics collection', 'Before using DISPLAY_CURSOR'],
    ],
    hintWarning:
      'Use hints only after updating statistics and reviewing index design has failed to fix the plan. Overusing hints makes code hard to maintain and can degrade performance as the environment changes.',
    hintSql: `-- Force a specific index\nSELECT /*+ INDEX(e EMP_DEPARTMENT_IX) */ employee_id\nFROM   hr.employees e\nWHERE  department_id = 90;\n\n-- Force hash join with parallelism\nSELECT /*+ USE_HASH(d) PARALLEL(e, 4) */\n       e.employee_id, d.department_name\nFROM   hr.employees e\nJOIN   hr.departments d ON e.department_id = d.department_id;`,

    adaptiveTitle: 'Adaptive Query Optimization',
    adaptiveDesc:
      'Introduced in Oracle 12c, adaptive optimization adjusts plans at runtime.\n\nAdaptive Plans: A Statistics Collector node monitors intermediate row counts. If actual cardinality differs significantly from estimates, Oracle switches subplans (e.g., Hash Join ↔ Nested Loop) on the fly.\n\nReoptimization: After the first execution, actual cardinality feedback is stored. Subsequent executions generate a better plan using real figures.',
    adaptiveNote:
      'Compare A-Rows against E-Rows in V$SQL_PLAN_STATISTICS_ALL to see when adaptive reoptimization has triggered.',

    summary: 'The execution plan is the starting point for every performance diagnosis. Use EXPLAIN PLAN to understand structure, DISPLAY_CURSOR ALLSTATS to compare E-Rows↔A-Rows and CR/PR, and identify the problem operation. Fix statistics first — hints are the last resort.',
  },
}

// ── 페이지 컴포넌트 ─────────────────────────────────────────────────────────

export function OptimizerPlanPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'
  const planRows = isKo ? PLAN_ROWS_KO : PLAN_ROWS_EN
  const statsRows = isKo ? STATS_ROWS_KO : STATS_ROWS_EN

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconListSearch size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* ── 실행 계획이란 ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>
      <SubTitle>{t.readRuleTitle}</SubTitle>
      <Prose>{t.readRuleDesc}</Prose>
      <ExplainPlanTable rows={planRows} caption={t.planExCaption} />

      <Divider />

      {/* ── 조회 방법 개요 ── */}
      <SectionTitle>{t.howTitle}</SectionTitle>
      <Prose>{t.howDesc}</Prose>
      <Table
        headers={isKo ? ['방법', '특징', '용도'] : ['Method', 'Characteristics', 'Use Case']}
        rows={t.howTable}
      />

      <Divider />

      {/* ── EXPLAIN PLAN ── */}
      <SectionTitle>{t.explainTitle}</SectionTitle>
      <Prose>{t.explainDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.explainSql} />
      </div>
      <SubTitle>{t.explainColTitle}</SubTitle>
      <Table
        headers={isKo ? ['컬럼', '설명'] : ['Column', 'Description']}
        rows={t.explainCols}
      />

      <Divider />

      {/* ── AUTOTRACE ── */}
      <SectionTitle>{t.autotraceTitle}</SectionTitle>
      <Prose>{t.autotraceDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.autotraceSql} />
      </div>
      <SubTitle>{t.autotraceStatTitle}</SubTitle>
      <Table
        headers={isKo ? ['항목', '설명'] : ['Statistic', 'Description']}
        rows={t.autotraceStats}
      />

      <Divider />

      {/* ── DISPLAY_CURSOR ── */}
      <SectionTitle>{t.cursorTitle}</SectionTitle>
      <Prose>{t.cursorDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.cursorSql} />
      </div>
      <SubTitle>{t.cursorColTitle}</SubTitle>
      <Table
        headers={isKo ? ['컬럼', '설명'] : ['Column', 'Description']}
        rows={t.cursorCols}
      />
      <InfoBox variant="tip">{t.cursorNote}</InfoBox>
      <ExplainPlanTable rows={statsRows} showStats caption={t.statsExCaption} />

      <Divider />

      {/* ── E-Rows vs A-Rows ── */}
      <SectionTitle>{t.diagTitle}</SectionTitle>
      <Prose>{t.diagDesc}</Prose>
      <Table
        headers={isKo ? ['상황', '의미', '대처'] : ['Situation', 'Meaning', 'Action']}
        rows={t.diagTable}
      />

      <Divider />

      {/* ── CR / PR / PW ── */}
      <SectionTitle>{t.crTitle}</SectionTitle>
      <Prose>{t.crDesc}</Prose>
      <Table
        headers={isKo ? ['지표', '설명', '패턴'] : ['Metric', 'Description', 'Pattern']}
        rows={t.crTable}
      />
      <InfoBox variant="note">{t.crNote}</InfoBox>

      <Divider />

      {/* ── 주요 오퍼레이션 ── */}
      <SectionTitle>{t.opTitle}</SectionTitle>
      <Table
        headers={isKo ? ['오퍼레이션', '설명', '주의'] : ['Operation', 'Description', 'Notes']}
        rows={t.opTable}
      />

      <Divider />

      {/* ── Optimizer Mode ── */}
      <SectionTitle>{t.goalTitle}</SectionTitle>
      <Table
        headers={isKo ? ['모드', '목표', '적합한 쿼리'] : ['Mode', 'Goal', 'Suitable For']}
        rows={t.goalRows}
      />
      <InfoBox variant="note">{t.goalNote}</InfoBox>

      <Divider />

      {/* ── Hint ── */}
      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintDesc}</Prose>
      <Table
        headers={isKo ? ['힌트', '효과', '사용 예'] : ['Hint', 'Effect', 'Use Case']}
        rows={t.hintTable}
      />
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>
      <InfoBox variant="warning">{t.hintWarning}</InfoBox>

      <Divider />

      {/* ── Adaptive ── */}
      <AccordionSection title={t.adaptiveTitle}>
        <Prose>{t.adaptiveDesc}</Prose>
        <InfoBox variant="note">{t.adaptiveNote}</InfoBox>
      </AccordionSection>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
