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
  SqlBlock,
} from '../../shared'
import {
  SqlTraceDisplay,
  RowSourceOperationDisplay,
  PredicateInfoDisplay,
  ColumnProjectionDisplay,
  StatisticsDisplay,
  FullPlanDisplay,
} from '../shared/diagrams'

const T = {
  ko: {
    title: '실행 계획',
    subtitle:
      'Oracle이 SQL을 실제로 어떤 순서와 방법으로 실행할지를 기록한 문서입니다. 실행 계획을 읽으면 성능 문제의 원인을 정확히 진단할 수 있습니다.',

    // ── 실행 계획이란 ──
    whatTitle: '실행 계획이란?',
    whatDesc:
      'SQL을 실행하기 전, CBO(Cost-Based Optimizer)는 가능한 실행 방법을 탐색하고 가장 비용이 낮은 방법을 선택합니다. 이 선택 결과를 트리 형태로 기록한 것이 실행 계획입니다.\n\n실행 계획의 각 줄은 하나의 Row Source Operation입니다. 트리 구조이며, 들여쓰기가 가장 깊은 자식 노드부터 실행되어 결과를 부모에게 전달합니다.',
    readOrderTitle: '읽는 순서',
    readOrderDesc:
      '자식이 여럿이면 위에서 아래 순서로 실행됩니다. 아래 예시의 실행 순서는 ③ → ② → ① → ⓪ 입니다.',
    xplanTitle: 'DBMS_XPLAN 패키지',
    xplanDesc:
      'DBMS_XPLAN은 Oracle이 제공하는 실행 계획 출력 전용 패키지입니다. 단순히 트리 구조만 보여주는 것이 아니라, 조회 방법과 format 옵션에 따라 추정값·실제값·조건절·컬럼 투영 정보까지 한 번에 확인할 수 있습니다.\n\n주요 함수는 두 가지입니다. DISPLAY는 EXPLAIN PLAN이 PLAN_TABLE에 저장해 둔 예상 계획을 출력합니다. SQL을 실제로 실행하지 않기 때문에 빠르게 계획을 확인할 때 사용합니다. DISPLAY_CURSOR는 실제로 실행된 SQL의 커서를 V$SQL_PLAN_STATISTICS_ALL에서 조회해 런타임 통계까지 함께 출력합니다. 이를 통해 CBO의 추정과 실제 실행 결과를 직접 비교할 수 있습니다.',
    xplanTable: [
      ['DISPLAY', 'EXPLAIN PLAN 저장 결과 출력', '실행 전 예상 계획 확인', "format => 'BASIC +ROWS +COST'"],
      ['DISPLAY_CURSOR', 'V$SQL_PLAN_STATISTICS_ALL 조회', '실행 후 런타임 통계 포함', "format => 'ALLSTATS LAST'"],
    ],
    xplanFormatTitle: 'format 옵션 조합',
    xplanFormatDesc:
      "format 문자열로 출력할 정보 영역을 선택합니다. 기본값은 'TYPICAL'이며, 필요한 항목을 + 로 추가하거나 ALL로 전체를 출력할 수 있습니다.",
    xplanFormatTable: [
      ['BASIC', 'Id, Operation, Name만 출력. 가장 간결.', 'DISPLAY'],
      ['TYPICAL', 'BASIC + Rows + Cost + Time. 기본값.', 'DISPLAY'],
      ['ALL', '거의 모든 정보 포함.', 'DISPLAY / DISPLAY_CURSOR'],
      ['+ROWS +COST', '추정 행 수와 비용 추가.', 'DISPLAY'],
      ['ALLSTATS LAST', 'A-Rows, CR, PR, A-Time 등 런타임 통계.', 'DISPLAY_CURSOR'],
      ['+PREDICATE', 'Predicate Information 영역 추가.', 'DISPLAY / DISPLAY_CURSOR'],
      ['+PROJECTION', 'Column Projection 영역 추가.', 'DISPLAY / DISPLAY_CURSOR'],
    ],

    areasTitle: '실행 계획에서 볼 수 있는 정보들',
    areasTable: [
      ['①', 'Call Statistics', 'TKPROF가 raw trace 파일을 포맷팅해 보여주는 단계별 호출 통계. Parse·Execute·Fetch 각각의 CPU, 경과 시간, I/O 횟수를 확인.'],
      ['②', 'Row Source Operation', '실제 실행 후 오퍼레이션별 런타임 통계. 추정값(E-Rows)과 실제값(A-Rows)을 비교해 병목을 찾음.'],
      ['③', 'Predicate Information', '각 오퍼레이션이 사용하는 조건절. 인덱스 탐색 범위(access)와 탐색 후 버려지는 행(filter)을 구분.'],
      ['④', 'Column Projection', '오퍼레이션 간에 전달되는 컬럼 목록. 불필요한 컬럼이 끝까지 따라오는지 확인.'],
      ['⑤', 'Statistics', '쿼리 전체의 누적 실행 통계. 논리 읽기·물리 읽기·정렬 횟수 등을 한눈에 파악.'],
    ],

    // ── ① Call Statistics (TKPROF) ──
    sqlTraceTitle: '① Call Statistics',
    sqlTraceDesc:
      'TKPROF(Transient Kernel Profiler)는 Oracle이 생성하는 raw SQL Trace 파일(.trc)을 사람이 읽기 좋은 형태로 포맷팅해 주는 유틸리티입니다. TKPROF 출력의 핵심은 Call Statistics — SQL 실행의 세 단계(Parse, Execute, Fetch)별로 CPU 시간, 경과 시간, 디스크 I/O, 논리 읽기를 테이블로 정리해 보여줍니다.\n\n이 영역은 ⑤ Statistics(SET AUTOTRACE로 조회하는 세션 전체 누적 통계)와 다릅니다. Statistics가 쿼리 하나의 합계라면, Call Statistics는 Parse·Execute·Fetch 각 단계를 분리해 어느 단계에서 비용이 발생하는지 명확히 보여줍니다.',
    sqlTraceXplanNote: '실행 계획 출력에는 DBMS_XPLAN 패키지를 사용합니다. 이 페이지 가장 아래에서 자세히 설명합니다.',
    sqlTraceSql: `-- 1단계: SQL Trace 활성화
ALTER SESSION SET sql_trace = TRUE;

-- 2단계: SQL 실행
SELECT e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;

-- 3단계: Trace 비활성화
ALTER SESSION SET sql_trace = FALSE;

-- 4단계: OS에서 TKPROF로 .trc 파일 포맷팅
-- tkprof <trace_file>.trc output.txt sys=no`,
    sqlTraceCols: [
      ['call', 'SQL 실행의 세 단계를 나타냅니다.\n\nParse — SQL을 파싱하고 CBO가 실행 계획을 수립하는 단계\nExecute — 계획대로 데이터를 실제로 처리하는 단계\nFetch — 처리 결과를 클라이언트로 인출하는 단계'],
      ['count', '해당 단계가 몇 번 호출되었는지를 나타냅니다.\n\nSoft Parse는 Library Cache에서 기존 계획을 재사용하므로 비용이 낮습니다. Hard Parse(Misses in library cache ≥ 1)는 계획을 새로 수립하므로 비용이 크며, 반복되면 성능에 큰 영향을 줍니다.'],
      ['cpu', '해당 단계에서 실제 CPU를 점유한 시간(초)입니다.\n\nParse cpu가 높다면 바인드 변수를 사용하지 않아 Hard Parse가 반복되고 있을 가능성이 큽니다.'],
      ['elapsed', '해당 단계의 실제 경과 시간(초)입니다.\n\ncpu보다 elapsed가 훨씬 크다면 CPU를 쓰지 않고 무언가를 기다리고 있다는 뜻입니다. Lock 경합·디스크 I/O 대기 등 Wait Event를 확인하세요.'],
      ['disk', 'Buffer Cache에 없어 디스크(데이터 파일)에서 직접 읽어야 했던 블록 수입니다(Physical Reads).\n\n첫 실행 후에도 disk가 높게 유지된다면 Buffer Cache 적중률이 낮거나 인덱스 활용이 부족한 것입니다.'],
      ['query', 'Consistent Read(CR) 수입니다.\n\nOracle은 쿼리 시작 시점의 스냅샷 기준으로 데이터를 읽어 읽기 일관성을 보장합니다. 다른 트랜잭션이 해당 블록을 변경 중이라면 Undo 세그먼트에서 변경 이전 버전을 재구성해 읽으므로, 논리적으로 읽은 블록 수가 더 많아질 수 있습니다.'],
      ['current', 'Current Read 수입니다.\n\n블록의 가장 최신 버전을 직접 읽는 방식으로, INSERT·UPDATE·DELETE 같은 DML이 데이터를 변경할 때 사용합니다. 순수 SELECT에서는 일반적으로 0입니다.'],
      ['rows', '해당 단계에서 처리한 행 수입니다.\n\nFetch rows — 클라이언트에 실제로 반환된 결과 행 수\nExecute rows — DML이 처리한 행 수'],
    ],
    sqlTraceExtraTitle: '부가 정보 항목',
    sqlTraceExtraCols: [
      ['Misses in library cache\nduring parse', 'Parse 단계에서 Library Cache에 실행 계획이 없어 Hard Parse가 발생한 횟수입니다.\n\n1 이상이면 Hard Parse가 발생했음을 의미하며, 바인드 변수 미사용이 주원인입니다.'],
      ['Optimizer mode', 'SQL 실행에 사용된 옵티마이저 모드입니다.\n\nALL_ROWS — 전체 처리량 최적화 (기본값)\nFIRST_ROWS — 첫 번째 결과의 응답속도 최적화'],
      ['Parsing user id', 'SQL을 파싱한 사용자의 내부 ID입니다.\n\n어떤 계정이 이 SQL을 실행했는지 추적할 때 사용합니다.'],
    ],
    sqlTraceAnalysis: 'Call Statistics로 성능 분석하기',
    sqlTraceAnalysisDesc:
      'Parse cpu가 높으면 바인드 변수 미사용으로 Hard Parse가 반복되는 신호입니다. elapsed가 cpu보다 훨씬 크면 Lock 대기나 I/O 대기 등 Wait Event가 발생하고 있음을 의미합니다. Fetch disk가 높으면 Buffer Cache에서 처리되지 못하고 디스크 읽기가 발생한 것이므로 인덱스 활용이나 캐시 크기를 검토합니다.',

    // ── ② Row Source Operation ──
    rsoTitle: '② Row Source Operation',
    rsoDesc:
      '실제 실행 후 각 오퍼레이션의 런타임 정보를 수집한 결과입니다. DBMS_XPLAN.DISPLAY_CURSOR(format => \'ALLSTATS LAST\')로 조회하며, SQL 실행 시 /*+ gather_plan_statistics */ 힌트를 붙여야 합니다.\n\n추정값(E-Rows)과 실제값(A-Rows, CR, PR)을 비교해 CBO 추정 오류와 I/O 병목을 정확히 찾을 수 있습니다.',
    rsoCursorSql: `-- 힌트를 붙여 실행
SELECT /*+ gather_plan_statistics */
       e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;

-- 실제 런타임 통계 조회
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id => NULL,      -- NULL = 가장 마지막 실행 커서
    format => 'ALLSTATS LAST'
  )
);`,
    rsoColHeaders: ['컬럼', '설명'],
    rsoCols: [
      ['Id', '오퍼레이션 고유 번호. * 표시가 붙은 Id는 조건절(Predicate Information)이 있음을 의미.'],
      ['Operation', '실제 수행된 오퍼레이션 이름.\n\n읽는 순서: 들여쓰기가 깊을수록 먼저 실행되어 결과를 부모 오퍼레이션에 전달합니다. 같은 깊이의 형제는 위에서 아래 순서로 실행됩니다. 아래 예시에서는 ④ → ③ → ② → ① → ⓪ 순으로 실행됩니다.'],
      ['Name', '오퍼레이션이 대상으로 한 테이블 또는 인덱스 이름.'],
      ['Rows', 'E-Rows — CBO가 반환될 것으로 추정한 행 수.'],
      ['Cost', 'CBO가 계산한 이 오퍼레이션의 상대적 비용.'],
      ['Time', 'CBO가 추정한 수행 시간 (HH:MM:SS).'],
      ['A-Rows', 'Actual Rows — 실제로 반환된 행 수. Rows(E-Rows)와 크게 차이나면 통계 문제 신호.'],
      ['CR', 'Consistent Reads — 읽기 일관성을 위해 읽은 논리 블록 수 (누적, 자식 포함).'],
      ['PR', 'Physical Reads — 디스크에서 직접 읽은 블록 수. 0이면 Buffer Cache에서 모두 처리.'],
      ['PW', 'Physical Writes — Direct Path나 정렬 임시 기록 등으로 디스크에 쓴 블록 수.'],
      ['A-Time', '이 오퍼레이션의 실제 경과 시간 (누적). 값이 가장 큰 오퍼레이션이 병목.'],
    ],
    rsoAnalysis: 'Row Source Operation으로 성능 분석하기',
    rsoAnalysisTable: [
      ['E-Rows ≈ A-Rows', '통계 정확. CBO 추정이 실제와 일치.', '정상'],
      ['E-Rows << A-Rows', 'CBO가 반환 행을 과소 추정 → 잘못된 인덱스 스캔 선택 가능성.', 'DBMS_STATS 재수집, 히스토그램 확인'],
      ['E-Rows >> A-Rows', 'CBO가 반환 행을 과대 추정 → 불필요한 Full Table Scan 선택 가능성.', 'DBMS_STATS 재수집, 조건절 확인'],
      ['CR 높음', '논리 읽기가 많음. 인덱스 활용이 부족하거나 FTS 선택 중.', '인덱스 추가 또는 쿼리 조건 재검토'],
      ['PR > 0', '물리 읽기 발생. Buffer Cache 미스. 첫 실행 후 사라지지 않으면 캐시 크기 검토.', 'Buffer Cache 히트율 확인'],
    ],

    // ── ③ Predicate Information ──
    predTitle: '③ Predicate Information',
    predDesc:
      '실행 계획에서 Id에 * 표시가 붙은 오퍼레이션이 어떤 조건으로 데이터를 필터링 또는 접근하는지 보여줍니다. access와 filter 두 종류가 있으며, 인덱스 활용 여부를 판단하는 핵심 정보입니다.',
    predSql: `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(
  format => 'BASIC +ROWS +PREDICATE'
));

-- 또는 DISPLAY_CURSOR와 함께:
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(format => 'ALLSTATS LAST +PREDICATE')
);`,
    predTypes: [
      ['access', '인덱스 또는 해시 조인에서 데이터를 탐색하는 기준 조건. 이 조건으로 읽는 범위가 결정됨.', '인덱스 선행 컬럼이 access에 있어야 효율적'],
      ['filter', '읽어온 행을 추가로 걸러내는 조건. 인덱스가 적용되지 않아 읽은 후 버려지는 행이 발생.', 'filter가 많으면 인덱스 재설계 검토'],
    ],
    predAnalysis: 'Predicate Information으로 성능 분석하기',
    predAnalysisDesc:
      'filter 조건이 많을수록 인덱스를 탄 후에도 버려지는 행이 많다는 뜻입니다. 함수 적용(UPPER(col) = ...), 묵시적 형 변환(숫자 컬럼에 문자 비교), LIKE \'%...\' 패턴은 access 조건이 될 수 없으므로 filter로 처리됩니다.',

    // ── ④ Column Projection ──
    projTitle: '④ Column Projection',
    projDesc:
      '각 오퍼레이션이 처리 후 다음 단계로 전달하는 컬럼 목록과 데이터 타입·길이를 보여줍니다. +PROJECTION 포맷을 사용합니다.\n\nSELECT에서 실제로 필요한 컬럼만 전달되는지 확인하는 데 사용합니다. 불필요한 컬럼이 많으면 데이터 전달 비용이 늘어납니다.',
    projSql: `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(
  format => 'BASIC +PROJECTION'
));`,
    projCols: [
      ['#keys=N', '조인 키 컬럼 수. 조인 오퍼레이션에서 표시됨.'],
      ['컬럼명[타입,길이]', '전달되는 컬럼의 이름, 데이터 타입, 최대 길이.'],
    ],
    projAnalysis: 'Column Projection으로 성능 분석하기',
    projAnalysisDesc:
      'SELECT * 사용 시 불필요한 컬럼까지 모두 전달되어 처리 비용이 늘어납니다. 또한 인덱스만으로 결과를 처리할 수 있는 경우(Index-Only Access), ROWID가 Projection에 포함되어 있으면 테이블 접근이 발생하고 있음을 확인할 수 있습니다.',

    // ── ⑤ Statistics ──
    statsTitle: '⑤ Statistics',
    statsDesc:
      'SQL*Plus의 SET AUTOTRACE 또는 V$MYSTAT으로 조회하는 세션 수준 실행 통계입니다. 오퍼레이션별 통계가 아닌 쿼리 전체의 누적 통계를 보여줍니다.',
    statsAutoSql: `-- SQL*Plus / SQLcl에서
SET AUTOTRACE TRACEONLY STATISTICS

SELECT e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;`,
    statsCols: [
      ['recursive calls', '내부적으로 발생한 재귀 SQL 수. 데이터 딕셔너리 조회, 트리거 등.'],
      ['db block gets', 'Current Read. DML이 최신 블록을 직접 읽은 횟수. SELECT에서는 보통 0.'],
      ['consistent gets', 'Consistent Read(CR). 읽기 일관성을 위해 읽은 논리 블록 수. 낮을수록 인덱스 활용이 잘 된 것.'],
      ['physical reads', 'PR. Buffer Cache에 없어 디스크에서 읽은 블록 수. 0에 가까울수록 좋음.'],
      ['redo size', 'DML로 생성된 Redo 로그 바이트 수. INSERT/UPDATE/DELETE 규모 지표.'],
      ['sorts (memory)', '메모리 내 정렬 횟수. PGA Sort Area에서 처리됨.'],
      ['sorts (disk)', '디스크로 넘친 정렬 횟수. 0이 되도록 PGA 크기를 조정할 것.'],
      ['rows processed', '최종으로 처리(반환)된 행 수.'],
    ],
    statsAnalysis: 'Statistics로 성능 분석하기',
    statsAnalysisDesc:
      'consistent gets가 예상보다 매우 높으면 FTS 또는 인덱스 효율이 낮은 상태입니다. physical reads가 지속적으로 높으면 Buffer Cache 크기 증가를 검토합니다. sorts(disk) > 0이면 PGA 크기 조정이 필요합니다.',

    // ── 전체 출력 예시 ──
    fullPlanTitle: '① ~ ⑤ 전체 출력 예시',
    fullPlanDesc:
      '아래는 하나의 SQL에 대해 ① ~ ⑤ 모든 영역이 함께 출력되는 실제 예시입니다. 각 영역이 어디서 시작하고 끝나는지 한눈에 확인할 수 있습니다.',
    fullPlanSql: `-- SQL 실행 (런타임 통계 수집)
SELECT /*+ gather_plan_statistics */
       e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;

-- ① Call Statistics: TKPROF로 .trc 파일 포맷팅
-- tkprof <trace>.trc output.txt sys=no

-- ② ~ ④ Row Source Operation + Predicate + Projection
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id => NULL,
    format => 'ALLSTATS LAST +PREDICATE +PROJECTION'
  )
);

-- ⑤ Statistics: SQL*Plus / SQLcl에서
SET AUTOTRACE TRACEONLY STATISTICS`,

    summary:
      '실행 계획은 5개 정보 영역의 조합입니다. Call Statistics(TKPROF)로 Parse·Execute·Fetch 단계별 비용을 파악하고, Row Source Operation에서 E-Rows↔A-Rows·CR·PR을 비교해 병목을 찾습니다. Predicate Information으로 인덱스 활용 여부를 확인하고, Column Projection으로 불필요한 컬럼 전달을 줄입니다.',
  },

  en: {
    title: 'Execution Plans',
    subtitle:
      "Oracle's execution plan records how it will execute a SQL statement — which operations to run, in what order, using which access paths. Reading the plan is the starting point for any performance diagnosis.",

    whatTitle: 'What is an Execution Plan?',
    whatDesc:
      "Before executing SQL, the CBO explores all valid execution methods and selects the one with the lowest estimated cost. The result — recorded as a tree of operations — is the execution plan.\n\nEach line in the plan is a Row Source Operation. Execution proceeds from the most-indented child node up to the root, with each node passing its result set to its parent.",
    readOrderTitle: 'Reading Order',
    readOrderDesc:
      'When a node has multiple children, they run top-to-bottom. In the example below, the execution order is ③ → ② → ① → ⓪.',
    xplanTitle: 'The DBMS_XPLAN Package',
    xplanDesc:
      "DBMS_XPLAN is Oracle's built-in package for displaying execution plans. Beyond a simple tree view, it can show estimated statistics, actual runtime metrics, predicate details, and column projection — all in one output, depending on how you call it and which format options you choose.\n\nThe two most important functions are DISPLAY and DISPLAY_CURSOR. DISPLAY reads the plan that EXPLAIN PLAN saved into PLAN_TABLE — the SQL is not actually executed, making it a quick way to preview the optimizer's choice. DISPLAY_CURSOR queries V$SQL_PLAN_STATISTICS_ALL for a cursor that was already executed, returning runtime statistics alongside the plan so you can compare what the CBO estimated against what actually happened.",
    xplanTable: [
      ['DISPLAY', 'Reads EXPLAIN PLAN output from PLAN_TABLE', 'Preview estimated plan without running SQL', "format => 'BASIC +ROWS +COST'"],
      ['DISPLAY_CURSOR', 'Queries V$SQL_PLAN_STATISTICS_ALL', 'View runtime stats for an already-executed cursor', "format => 'ALLSTATS LAST'"],
    ],
    xplanFormatTitle: 'Combining format Options',
    xplanFormatDesc:
      "The format string selects which information areas to include. The default is 'TYPICAL'. Add specific areas with + or use ALL to include everything.",
    xplanFormatTable: [
      ['BASIC', 'Id, Operation, Name only. Most concise.', 'DISPLAY'],
      ['TYPICAL', 'BASIC + Rows + Cost + Time. Default.', 'DISPLAY'],
      ['ALL', 'Almost all available information.', 'DISPLAY / DISPLAY_CURSOR'],
      ['+ROWS +COST', 'Add estimated row count and cost.', 'DISPLAY'],
      ['ALLSTATS LAST', 'A-Rows, CR, PR, A-Time and other runtime stats.', 'DISPLAY_CURSOR'],
      ['+PREDICATE', 'Adds the Predicate Information section.', 'DISPLAY / DISPLAY_CURSOR'],
      ['+PROJECTION', 'Adds the Column Projection section.', 'DISPLAY / DISPLAY_CURSOR'],
    ],

    areasTitle: 'Information in an Execution Plan',
    areasTable: [
      ['①', 'Call Statistics', 'Per-phase call stats formatted by TKPROF from a raw trace file. Shows CPU, elapsed time, and I/O counts broken down by Parse, Execute, and Fetch.'],
      ['②', 'Row Source Operation', 'Per-operation runtime stats after actual execution. Compare E-Rows vs A-Rows to find bottlenecks.'],
      ['③', 'Predicate Information', 'Conditions used by each operation. Distinguishes index scan range (access) from rows read then discarded (filter).'],
      ['④', 'Column Projection', 'Columns passed between operations. Reveals whether unnecessary columns are carried through the entire plan.'],
      ['⑤', 'Statistics', 'Aggregate execution stats for the whole query — logical reads, physical reads, sort counts, and more.'],
    ],

    sqlTraceTitle: '① Call Statistics',
    sqlTraceDesc:
      'TKPROF (Transient Kernel Profiler) is an Oracle utility that formats raw SQL Trace files (.trc) into human-readable output. The heart of TKPROF output is Call Statistics — a table that breaks SQL execution into three phases (Parse, Execute, Fetch) and shows CPU time, elapsed time, disk I/O, and logical reads for each phase separately.\n\nThis is different from ⑤ Statistics (the session-level aggregate you get from SET AUTOTRACE). Statistics gives you a single total for the whole statement; Call Statistics splits that total by phase, making it clear exactly where the time and I/O are being spent.',
    sqlTraceXplanNote: 'Displaying the plan requires the DBMS_XPLAN package. See the detailed explanation at the bottom of this page.',
    sqlTraceSql: `-- Step 1: Enable SQL Trace for this session
ALTER SESSION SET sql_trace = TRUE;

-- Step 2: Run the SQL
SELECT e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;

-- Step 3: Disable trace
ALTER SESSION SET sql_trace = FALSE;

-- Step 4: Format the .trc file with TKPROF (OS command)
-- tkprof <trace_file>.trc output.txt sys=no`,
    sqlTraceCols: [
      ['call', 'The three phases of SQL execution.\n\nParse — SQL parsing and CBO plan selection\nExecute — the plan is carried out against the data\nFetch — resulting rows are sent back to the client'],
      ['count', 'How many times this phase was invoked.\n\nSoft Parses reuse a cached plan and are cheap. Hard Parses (Misses in library cache ≥ 1) rebuild the plan from scratch and are expensive — repeated Hard Parses usually mean bind variables are not being used.'],
      ['cpu', 'CPU time actively consumed in this phase (seconds).\n\nHigh Parse cpu typically means Hard Parses are happening repeatedly — usually because bind variables are not being used.'],
      ['elapsed', 'Wall-clock time for this phase (seconds).\n\nWhen elapsed is significantly larger than cpu, the session is waiting rather than working. Common culprits are lock contention and disk I/O waits.'],
      ['disk', 'Physical Reads — blocks read directly from datafiles because they were not in the Buffer Cache.\n\nIf disk remains high after the first execution, Buffer Cache hit rate is low or index usage is insufficient.'],
      ['query', 'Consistent Reads (CR) — logical block reads Oracle performed to guarantee read consistency.\n\nOracle reads data as of the snapshot taken at query start time. If another transaction has since modified a block, Oracle reconstructs the prior version from the Undo segment — so logical reads can exceed the actual data volume.\n\nA high CR count relative to rows returned usually points to a Full Table Scan or poor index efficiency.'],
      ['current', 'Current Reads — blocks read in their most up-to-date form.\n\nUsed by DML (INSERT, UPDATE, DELETE) that needs the latest version of a block. Nearly always 0 for plain SELECT statements.'],
      ['rows', 'Rows processed in this phase.\n\nFetch rows — actual result rows returned to the client\nExecute rows — rows processed by a DML statement'],
    ],
    sqlTraceExtraTitle: 'Supplementary Fields',
    sqlTraceExtraCols: [
      ['Misses in library cache during parse', 'Number of times the execution plan was not found in the Library Cache during parsing. Any value ≥ 1 means a Hard Parse occurred — the most common cause is not using bind variables.'],
      ['Optimizer mode', 'The optimizer mode used for this SQL. ALL_ROWS (throughput-optimized, default) or FIRST_ROWS (response-time optimized).'],
      ['Parsing user id', 'Internal ID of the user who parsed this SQL. Useful for tracing which database account executed the statement.'],
    ],
    sqlTraceAnalysis: 'Performance Analysis with Call Statistics',
    sqlTraceAnalysisDesc:
      'High Parse cpu usually means bind variables are not being used, causing repeated Hard Parses. When elapsed is much larger than cpu, wait events (lock contention, I/O waits) are consuming time. High Fetch disk indicates Buffer Cache misses during result retrieval — review index usage or cache sizing.',

    rsoTitle: '② Row Source Operation',
    rsoDesc:
      "Runtime information collected for each operation after the SQL actually runs. Query with DBMS_XPLAN.DISPLAY_CURSOR(format => 'ALLSTATS LAST'). The /*+ gather_plan_statistics */ hint must be included in the executed SQL.\n\nCompare estimated values (E-Rows) against actuals (A-Rows, CR, PR) to pinpoint where CBO estimates diverged from reality and where I/O bottlenecks occur.",
    rsoCursorSql: `-- Run the SQL with the hint
SELECT /*+ gather_plan_statistics */
       e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;

-- Query runtime statistics
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id => NULL,      -- NULL = most recently executed cursor
    format => 'ALLSTATS LAST'
  )
);`,
    rsoColHeaders: ['Column', 'Description'],
    rsoCols: [
      ['Id', 'Unique operation identifier. An asterisk (*) means a predicate is listed in the Predicate Information section.'],
      ['Operation', 'The operation performed.\n\nHow to read: execution starts at the most-indented (innermost) operation, which passes its result up to its parent. Siblings at the same depth run top-to-bottom. In the example below, the order is ④ → ③ → ② → ① → ⓪.'],
      ['Name', 'The table or index the operation acts on.'],
      ['Rows', 'E-Rows — the CBO\'s estimated row count before execution.'],
      ['Cost', 'Relative cost the CBO assigned to this operation.'],
      ['Time', 'CBO-estimated wall-clock time for this operation (HH:MM:SS).'],
      ['A-Rows', 'Actual Rows — real rows returned. A large gap vs Rows (E-Rows) signals a statistics problem.'],
      ['CR', 'Consistent Reads — logical blocks read for read consistency (cumulative, includes children).'],
      ['PR', 'Physical Reads — blocks read from disk. 0 means all served from Buffer Cache.'],
      ['PW', 'Physical Writes — blocks written to disk (direct path write, temp sort spill, etc.).'],
      ['A-Time', 'Actual elapsed time for this operation (cumulative). The operation with the highest A-Time is the bottleneck.'],
    ],
    rsoAnalysis: 'Performance Analysis with Row Source Operation',
    rsoAnalysisTable: [
      ['E-Rows ≈ A-Rows', 'Statistics are accurate. CBO estimate matches reality.', 'Normal'],
      ['E-Rows << A-Rows', 'CBO underestimated → may have chosen an index scan that returns far more rows than expected.', 'Re-gather DBMS_STATS, check histograms'],
      ['E-Rows >> A-Rows', 'CBO overestimated → may have chosen Full Table Scan when far fewer rows actually match.', 'Re-gather DBMS_STATS, review predicates'],
      ['High CR', 'Many logical reads. Index utilization is poor or FTS is selected.', 'Add index or revisit query predicates'],
      ['PR > 0', 'Physical reads occurring. Buffer Cache miss. If persists after warm-up, review cache sizing.', 'Check Buffer Cache hit ratio'],
    ],

    predTitle: '③ Predicate Information',
    predDesc:
      'Shows what conditions each operation marked with * uses to access or filter rows. There are two types — access and filter — and this section is key to understanding whether indexes are being used effectively.',
    predSql: `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(
  format => 'BASIC +ROWS +PREDICATE'
));

-- Or with DISPLAY_CURSOR:
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(format => 'ALLSTATS LAST +PREDICATE')
);`,
    predTypes: [
      ['access', 'The condition that determines which index entries or hash buckets to read. Defines the scan range.', 'The leading index column must appear in access for efficient use'],
      ['filter', 'A secondary condition applied after reading — rows that pass access but not filter are discarded.', 'Many filter conditions → consider redesigning the index'],
    ],
    predAnalysis: 'Performance Analysis with Predicate Information',
    predAnalysisDesc:
      'A high number of filter conditions means rows are read and then discarded, wasting I/O. Common causes: applying a function to a column (UPPER(col) = ...), implicit type conversion (comparing a number column with a string literal), or LIKE \'%...\' patterns — none of these can become an access predicate.',

    projTitle: '④ Column Projection',
    projDesc:
      "Shows exactly which columns each operation passes to the next step, along with their data types and lengths. Use the +PROJECTION format.\n\nVerify that only the columns your SELECT actually needs are being passed through the plan. Unnecessary columns increase data transfer costs at every step.",
    projSql: `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(
  format => 'BASIC +PROJECTION'
));`,
    projCols: [
      ['#keys=N', 'Number of join key columns. Shown for join operations.'],
      ['column[type,length]', 'The column name, data type, and maximum length being projected.'],
    ],
    projAnalysis: 'Performance Analysis with Column Projection',
    projAnalysisDesc:
      'Using SELECT * forces all columns through every step of the plan, increasing processing cost. If an index could theoretically serve a query on its own (index-only access), but ROWID appears in the projection, Oracle is still hitting the table — a sign that the index is missing a needed column.',

    statsTitle: '⑤ Statistics',
    statsDesc:
      'Session-level execution statistics from SET AUTOTRACE or V$MYSTAT. Unlike Row Source Operation, these are aggregate totals for the entire query, not per-operation breakdowns.',
    statsAutoSql: `-- In SQL*Plus / SQLcl:
SET AUTOTRACE TRACEONLY STATISTICS

SELECT e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;`,
    statsCols: [
      ['recursive calls', 'Internal recursive SQL calls (data dictionary lookups, triggers, etc.).'],
      ['db block gets', 'Current Reads. Blocks read by DML for the most-current version. Usually 0 for SELECT.'],
      ['consistent gets', 'Consistent Reads (CR). Logical block reads for read-consistent queries. Lower = better index use.'],
      ['physical reads', 'PR. Blocks read directly from disk (Buffer Cache miss). Lower is better; 0 = full cache hit.'],
      ['redo size', 'Redo log bytes generated by DML. Indicates scale of INSERT/UPDATE/DELETE.'],
      ['sorts (memory)', 'In-memory sort operations handled in PGA Sort Area.'],
      ['sorts (disk)', 'Sort operations that spilled to disk. Target 0 by tuning PGA size.'],
      ['rows processed', 'Total rows returned or processed by the statement.'],
    ],
    statsAnalysis: 'Performance Analysis with Statistics',
    statsAnalysisDesc:
      'Very high consistent gets relative to rows processed indicates Full Table Scan or poor index efficiency. Persistently high physical reads suggest increasing the Buffer Cache. Any sorts(disk) > 0 is a signal to increase PGA_AGGREGATE_TARGET.',

    fullPlanTitle: 'Full Output Example: ① – ⑤ Together',
    fullPlanDesc:
      'Below is a real example showing all five information areas for a single SQL statement. You can see exactly where each section begins and ends.',
    fullPlanSql: `-- Run the SQL (collect runtime statistics)
SELECT /*+ gather_plan_statistics */
       e.employee_id, d.department_name
FROM   hr.employees e
JOIN   hr.departments d ON e.department_id = d.department_id
WHERE  e.department_id > 50;

-- ① Call Statistics: format .trc file with TKPROF
-- tkprof <trace>.trc output.txt sys=no

-- ② ~ ④ Row Source Operation + Predicate + Projection
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id => NULL,
    format => 'ALLSTATS LAST +PREDICATE +PROJECTION'
  )
);

-- ⑤ Statistics: in SQL*Plus / SQLcl
SET AUTOTRACE TRACEONLY STATISTICS`,

    summary:
      'An execution plan is a combination of five information areas. Use Call Statistics (TKPROF) to see how cost breaks down across the Parse, Execute, and Fetch phases. Use Row Source Operation to compare E-Rows↔A-Rows and locate I/O bottlenecks, Predicate Information to verify index usage, and Column Projection to eliminate unnecessary data transfer.',
  },
}

function MultilineTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-mono font-bold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-b last:border-0 ${ri % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 font-mono text-[11px] text-foreground/80 align-top whitespace-pre-line${ci === 0 ? ' font-semibold text-foreground w-36' : ci === 1 && row.length > 2 ? ' w-36 text-muted-foreground' : ' leading-relaxed'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function OptimizerPlanPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconListSearch size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <Divider />

      {/* ── 5가지 정보 영역 개요 ── */}
      <SectionTitle>{t.areasTitle}</SectionTitle>
      <div className="mb-6 overflow-hidden rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/60">
              {(isKo ? ['번호', '영역', '내용'] : ['#', 'Area', 'Description']).map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-mono font-bold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.areasTable.map((row, ri) => (
              <tr key={ri} className={`border-b last:border-0 ${ri % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                <td className="px-4 py-2 font-mono text-base font-bold text-foreground/80">{row[0]}</td>
                <td className="px-4 py-2 font-mono text-[11px] text-foreground/80">{row[1]}</td>
                <td className="px-4 py-2 font-mono text-[11px] text-foreground/80">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Divider />

      {/* ── ① SQL Trace ── */}
      <SectionTitle>{t.sqlTraceTitle}</SectionTitle>
      <Prose>{t.sqlTraceDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.sqlTraceSql} />
      </div>
      <div className="mt-6">
        <SqlTraceDisplay lang={lang} />
      </div>
      <div className="mt-6">
        <SubTitle>{isKo ? 'Call Statistics 컬럼 설명' : 'Call Statistics Column Reference'}</SubTitle>
        <MultilineTable
          headers={isKo ? ['컬럼', '설명'] : ['Column', 'Description']}
          rows={t.sqlTraceCols}
        />
      </div>
      <div className="mt-6">
        <SubTitle>{t.sqlTraceExtraTitle}</SubTitle>
        <MultilineTable
          headers={isKo ? ['항목', '설명'] : ['Field', 'Description']}
          rows={t.sqlTraceExtraCols}
        />
      </div>
      <InfoBox variant="usage">
        <strong>{t.sqlTraceAnalysis}</strong>
        <br />
        {t.sqlTraceAnalysisDesc}
      </InfoBox>

      <Divider />

      {/* ── ② Row Source Operation ── */}
      <SectionTitle>{t.rsoTitle}</SectionTitle>
      <Prose>{t.rsoDesc}</Prose>
      <p className="mb-4 text-sm text-muted-foreground">
        {t.sqlTraceXplanNote.split('DBMS_XPLAN')[0]}
        <a
          href="#xplan-section"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('xplan-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="font-mono font-semibold text-rose-500 underline underline-offset-2 hover:text-rose-600 cursor-pointer"
        >
          DBMS_XPLAN
        </a>
        {t.sqlTraceXplanNote.split('DBMS_XPLAN')[1]}
      </p>
      <div className="mt-4">
        <SqlBlock sql={t.rsoCursorSql} />
      </div>
      <div className="mt-6">
        <RowSourceOperationDisplay lang={lang} />
      </div>
      <InfoBox variant="tip">
        {isKo
          ? 'Row Source Operation은 트리 구조를 표현합니다. 들여쓰기가 깊을수록 먼저 실행됩니다. 가장 안쪽 오퍼레이션부터 시작해 결과를 부모에게 전달하며 루트(Id 0)까지 올라갑니다. 같은 깊이의 형제는 위에서 아래 순서로 실행됩니다.'
          : 'How to read — the plan is a tree. The most-indented (deepest) operation runs first and passes its result up to its parent, continuing to the root (Id 0). Siblings at the same depth run top-to-bottom.'}
      </InfoBox>
      <div className="mt-6">
        <SubTitle>{isKo ? 'Row Source Operation 컬럼 설명' : 'Row Source Operation Column Reference'}</SubTitle>
        <MultilineTable
          headers={t.rsoColHeaders}
          rows={t.rsoCols}
        />
      </div>
      <InfoBox variant="usage">
        <strong>{t.rsoAnalysis}</strong>
        <br />
        <div className="mt-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr>
                {(isKo ? ['상황', '의미', '대처'] : ['Situation', 'Meaning', 'Action']).map(h => (
                  <th key={h} className="text-left font-bold pb-1 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rsoAnalysisTable.map((row, i) => (
                <tr key={i} className="border-t border-current/10">
                  {row.map((cell, j) => (
                    <td key={j} className="py-1 pr-3 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoBox>
      <InfoBox variant="tip">
        {isKo
          ? '/*+ gather_plan_statistics */ 힌트가 없으면 A-Rows, CR, PR 컬럼이 표시되지 않습니다. 힌트 없이 실행했다면 ALTER SESSION SET statistics_level = ALL을 먼저 설정하세요.'
          : 'Without /*+ gather_plan_statistics */, A-Rows, CR, and PR columns will not appear. If you ran the SQL without the hint, first run: ALTER SESSION SET statistics_level = ALL.'}
      </InfoBox>

      <Divider />

      {/* ── ③ Predicate Information ── */}
      <SectionTitle>{t.predTitle}</SectionTitle>
      <Prose>{t.predDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.predSql} />
      </div>
      <div className="mt-6">
        <PredicateInfoDisplay lang={lang} />
      </div>
      <div className="mt-6">
        <SubTitle>{isKo ? 'access vs filter 차이' : 'access vs filter'}</SubTitle>
        <Table
          headers={isKo ? ['유형', '의미', '성능 관점'] : ['Type', 'Meaning', 'Performance Impact']}
          rows={t.predTypes}
        />
      </div>
      <InfoBox variant="usage">
        <strong>{t.predAnalysis}</strong>
        <br />
        {t.predAnalysisDesc}
      </InfoBox>

      <Divider />

      {/* ── ④ Column Projection ── */}
      <SectionTitle>{t.projTitle}</SectionTitle>
      <Prose>{t.projDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.projSql} />
      </div>
      <div className="mt-6">
        <ColumnProjectionDisplay lang={lang} />
      </div>
      <div className="mt-6">
        <SubTitle>{isKo ? 'Column Projection 항목 설명' : 'Column Projection Reference'}</SubTitle>
        <Table
          headers={isKo ? ['항목', '설명'] : ['Item', 'Description']}
          rows={t.projCols}
        />
      </div>
      <InfoBox variant="usage">
        <strong>{t.projAnalysis}</strong>
        <br />
        {t.projAnalysisDesc}
      </InfoBox>

      <Divider />

      {/* ── ⑤ Statistics ── */}
      <SectionTitle>{t.statsTitle}</SectionTitle>
      <Prose>{t.statsDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.statsAutoSql} />
      </div>
      <div className="mt-6">
        <StatisticsDisplay lang={lang} />
      </div>
      <div className="mt-6">
        <SubTitle>{isKo ? 'Statistics 항목 설명' : 'Statistics Column Reference'}</SubTitle>
        <Table
          headers={isKo ? ['항목', '설명'] : ['Statistic', 'Description']}
          rows={t.statsCols}
        />
      </div>
      <InfoBox variant="usage">
        <strong>{t.statsAnalysis}</strong>
        <br />
        {t.statsAnalysisDesc}
      </InfoBox>

      <Divider />

      {/* ── 전체 출력 예시 ── */}
      <SectionTitle>{t.fullPlanTitle}</SectionTitle>
      <Prose>{t.fullPlanDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.fullPlanSql} />
      </div>
      <div className="mt-6">
        <FullPlanDisplay lang={lang} />
      </div>

      <Divider />

      {/* ── DBMS_XPLAN 패키지 ── */}
      <div id="xplan-section">
        <SectionTitle>{t.xplanTitle}</SectionTitle>
      </div>
      <Prose>{t.xplanDesc}</Prose>
      <Table
        headers={isKo ? ['함수', '데이터 소스', '용도', '대표 format'] : ['Function', 'Data Source', 'Use Case', 'Typical format']}
        rows={t.xplanTable}
      />
      <SubTitle>{t.xplanFormatTitle}</SubTitle>
      <Prose>{t.xplanFormatDesc}</Prose>
      <Table
        headers={isKo ? ['format 옵션', '포함 정보', '주로 사용하는 함수'] : ['format Option', 'Included Information', 'Typical Function']}
        rows={t.xplanFormatTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
