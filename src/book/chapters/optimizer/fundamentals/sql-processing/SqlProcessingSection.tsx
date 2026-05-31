import { IconBolt } from '@tabler/icons-react'
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
  StepList,
} from '../../../shared'

const T = {
  ko: {
    title: 'SQL 처리 과정',
    subtitle:
      '우리가 SQL을 실행하면 Oracle은 그 SQL을 그냥 바로 실행하지 않아요. 파싱(parsing) → 최적화(optimization) → 행 소스 생성(row source generation) → 실행(execution), 이렇게 4단계를 거친답니다.',
    stagesTitle: 'SQL 처리의 4단계',
    stagesDesc:
      '문장 종류에 따라 일부 단계가 생략되기도 하지만, 기본 흐름은 항상 이 순서예요.',
    stageRows: [
      ['① 파싱 (Parsing)', '구문 검사 → 의미 검사 → Shared Pool 확인. 이 SQL을 전에 본 적 있는지 확인해서 하드/소프트 파싱을 결정해요.'],
      ['② 최적화 (Optimization)', '하드 파싱일 때만 수행돼요. DML에만 해당하고, DDL은 최적화 대상이 아니에요.'],
      ['③ 행 소스 생성 (Row Source Generation)', '최적 실행 계획을 SQL 엔진이 실제로 실행할 수 있는 행 소스 트리(row source tree)로 변환해요.'],
      ['④ 실행 (Execution)', 'DML에서 유일하게 반드시 거쳐야 하는 단계예요. SQL 엔진이 트리의 각 노드를 하나씩 실행하죠.'],
    ],
    parsingTitle: 'SQL 파싱 (SQL Parsing)',
    parsingDesc:
      '파싱의 첫 번째 할 일은 SQL 문장을 데이터베이스가 이해할 수 있는 구조로 분리하는 거예요. 애플리케이션이 파싱 호출(parse call)을 보내면, 데이터베이스는 커서(cursor)를 열어요. 커서는 파싱된 SQL과 처리 정보를 담는 전용 공간의 핸들인데, 이 공간은 PGA(Program Global Area) 안에 있어요.',
    syntaxTitle: '구문 검사 (Syntax Check)',
    syntaxDesc:
      'SQL 문법이 맞는지 확인해요. 오타나 잘못된 키워드가 있으면 이 단계에서 바로 걸러진답니다.',
    syntaxSql: `-- 구문 오류 예시: FROM을 FORM으로 오타냄
SQL> SELECT * FORM employees;
SELECT * FORM employees
         *
ERROR at line 1:
ORA-00923: FROM keyword not found where expected`,
    semanticTitle: '의미 검사 (Semantic Check)',
    semanticDesc:
      '문법은 맞아도 의미가 잘못될 수 있어요. 예를 들어 존재하지 않는 테이블 이름을 쓴 경우죠. 이 단계에서 참조한 테이블·컬럼이 실제로 있는지 확인해요.',
    semanticSql: `-- 의미 오류 예시: 없는 테이블을 조회하려 했어요
SQL> SELECT * FROM nonexistent_table;
SELECT * FROM nonexistent_table
              *
ERROR at line 1:
ORA-00942: table or view does not exist`,
    sharedPoolTitle: 'Shared Pool 확인 (Shared Pool Check)',
    sharedPoolDesc:
      '파싱 중에 Oracle은 "이 SQL, 전에 누군가 실행한 적 있어?" 하고 Shared Pool을 뒤져봐요. 있으면 비싼 최적화 작업을 건너뛸 수 있거든요. 모든 SQL에는 해시 알고리즘으로 생성된 고유한 SQL ID가 붙는데, 이게 V$SQL.SQL_ID에 나타나는 그 값이에요.',
    hardSoftTitle: '하드 파싱 vs 소프트 파싱',
    hardSoftRows: [
      ['하드 파싱 (Hard Parse)', 'Shared Pool에 이 SQL이 없어서 처음부터 실행 계획을 새로 만들어야 해요. 이걸 라이브러리 캐시 미스(library cache miss)라고 불러요. 이때 래치(latch)라는 잠금 장치를 써야 해서 동시에 많은 하드 파싱이 일어나면 경합이 생기고 성능이 뚝 떨어질 수 있어요.'],
      ['소프트 파싱 (Soft Parse)', 'Shared Pool에 동일한 SQL이 이미 있어서 기존 실행 계획을 그대로 재사용해요. 이걸 라이브러리 캐시 히트(library cache hit)라고 해요. 최적화와 행 소스 생성을 건너뛰니까 훨씬 빠르죠.'],
    ],
    hardSoftNote:
      '똑같은 SQL이라도 OPTIMIZER_MODE 같은 세션 설정이 다르면 하드 파싱이 강제돼요. 옵티마이저 환경(optimizer environment)이란 실행 계획 생성에 영향을 주는 세션 설정들의 총집합을 말해요.',
    hardSoftSql: `-- 동일한 SELECT인데 옵티마이저 환경이 다르면 각각 하드 파싱이 일어나요
ALTER SESSION SET OPTIMIZER_MODE=ALL_ROWS;
ALTER SYSTEM FLUSH SHARED_POOL;               -- 환경 1
SELECT * FROM sh.sales;

ALTER SESSION SET OPTIMIZER_MODE=FIRST_ROWS;  -- 환경 2
SELECT * FROM sh.sales;

ALTER SESSION SET SQL_TRACE=true;             -- 환경 3
SELECT * FROM sh.sales;`,
    bindVarTitle: '바인드 변수 (Bind Variables)',
    bindVarSql: `-- 하드 파싱 유발 — 값이 달라지면 완전히 다른 SQL로 인식해요
SELECT * FROM employees WHERE employee_id = 100;
SELECT * FROM employees WHERE employee_id = 101;

-- 소프트 파싱 유도 — :emp_id 바인드 변수를 쓰면 같은 커서를 재사용해요
SELECT * FROM employees WHERE employee_id = :emp_id;`,
    bindVarNote:
      '바인드 변수(bind variable)를 쓰면 값이 달라져도 Oracle이 "같은 SQL이네!" 하고 소프트 파싱을 해줘요. 불필요한 하드 파싱을 줄이는 가장 기본적인 튜닝 패턴이에요.',
    rowSourceTitle: '행 소스 생성 (Row Source Generation)',
    rowSourceDesc:
      '행 소스 생성기(row source generator)는 옵티마이저가 고른 최적 실행 계획을 받아서 SQL 엔진이 실제로 실행할 수 있는 형태, 즉 행 소스 트리(row source tree)로 바꿔줘요. 이 트리에는 다음 정보가 담겨요.',
    rowSourceItems: [
      '쿼리에서 참조하는 테이블들의 순서',
      '각 테이블에 어떤 방식(인덱스 스캔인지, 풀 스캔인지)으로 접근할지',
      '테이블끼리 어떤 방식(Nested Loop, Hash Join 등)으로 조인할지',
      '필터, 정렬, 집계 같은 추가 데이터 연산',
    ],
    executionTitle: '실행 (SQL Execution)',
    executionDesc:
      'SQL 엔진이 드디어 행 소스 트리의 각 노드를 실행해요. DML에서 유일하게 반드시 거치는 단계예요. 실행 순서는 계획에 표시된 순서의 역순, 즉 아래에서 위로 올라가요.',
    executionPlanSql: `-- 실행 계획 예시
SELECT e.last_name, j.job_title, d.department_name
FROM   hr.employees e, hr.departments d, hr.jobs j
WHERE  e.department_id = d.department_id
AND    e.job_id = j.job_id
AND    e.last_name LIKE 'A%';

Plan hash value: 975837011
---------------------------------------------------------------------------
| Id| Operation                    | Name      |Rows|Bytes|Cost(%CPU)|Time|
---------------------------------------------------------------------------
| 0| SELECT STATEMENT              |           |  3 | 189|  7 (15)|00:00:01|
|*1|  HASH JOIN                    |           |  3 | 189|  7 (15)|00:00:01|
|*2|   HASH JOIN                   |           |  3 | 141|  5 (20)|00:00:01|
| 3|    TABLE ACCESS BY INDEX ROWID| EMPLOYEES |  3 |  60|  2  (0)|00:00:01|
|*4|     INDEX RANGE SCAN          | EMP_NAME_IX| 3 |   |  1  (0)|00:00:01|
| 5|    TABLE ACCESS FULL          | JOBS       | 19 | 513|  2  (0)|00:00:01|
| 6|   TABLE ACCESS FULL           | DEPARTMENTS| 27 | 432|  2  (0)|00:00:01|
---------------------------------------------------------------------------`,
    executionNote:
      '실행 순서 (아래에서 위로): ① EMP_NAME_IX 인덱스 Range Scan → ② EMPLOYEES 테이블 접근 → ③ JOBS Full Scan → ④ Hash Join → ⑤ DEPARTMENTS Full Scan → ⑥ Hash Join.',
    executionSteps: [
      { title: '① EMP_NAME_IX 인덱스 Range Scan (Id 4)', desc: '이름이 A로 시작하는 인덱스 항목만 쭉 찾아요.' },
      { title: '② EMPLOYEES 테이블 접근 (Id 3)', desc: '인덱스로 찾은 ROWID로 실제 테이블 행을 가져와요.' },
      { title: '③ JOBS Full Scan (Id 5)', desc: 'JOBS 테이블 전체를 읽어요.' },
      { title: '④ Hash Join (Id 2)', desc: 'EMPLOYEES 결과와 JOBS를 해시 조인해요.' },
      { title: '⑤ DEPARTMENTS Full Scan (Id 6)', desc: 'DEPARTMENTS 테이블 전체를 읽어요.' },
      { title: '⑥ Hash Join (Id 1)', desc: '앞 결과와 DEPARTMENTS를 다시 해시 조인하면 끝이에요.' },
    ],
    dmlTitle: 'DML은 어떻게 처리될까요?',
    dmlDesc:
      '대부분의 DML에는 쿼리가 포함돼요. 커서가 실행되면 결과 집합(result set)에 행들이 채워지고, Fetch 단계에서 필요하면 정렬도 해요. Oracle은 읽기 일관성(read consistency) 덕분에 쿼리가 읽는 데이터가 항상 단일 시점(point in time)에 일관되도록 보장해줘요.',
    ddlTitle: 'DDL은 DML과 다르게 처리돼요',
    ddlDesc:
      'CREATE TABLE 같은 DDL은 최적화 과정을 거치지 않아요. 파싱 후 바로 명령을 수행하죠. 그런데 DDL 하나를 실행하려면 내부적으로 수십 개의 재귀 SQL(recursive SQL)이 따라붙어요.',
    ddlSql: `-- DDL 실행 예시
CREATE TABLE mytable (mycolumn INTEGER);

-- 내부에서 자동으로 실행되는 재귀 SQL들:
-- CREATE TABLE 전에 COMMIT 발행
-- 사용자 권한 확인
-- 테이블을 넣을 테이블스페이스 결정
-- 테이블스페이스 할당량 초과 여부 확인
-- 같은 이름의 객체가 없는지 확인
-- 데이터 딕셔너리에 테이블 정의 행 삽입
-- 성공하면 COMMIT, 실패하면 ROLLBACK`,
  },
  en: {
    title: 'SQL Processing',
    subtitle:
      "When you execute SQL, Oracle doesn't run it immediately. It goes through four stages: Parsing → Optimization → Row Source Generation → Execution.",
    stagesTitle: 'The 4 Stages of SQL Processing',
    stagesDesc:
      'Depending on the statement type, some stages may be skipped, but the basic flow always follows this order.',
    stageRows: [
      ['① Parsing', 'Syntax Check → Semantic Check → Shared Pool check. Determines soft vs. hard parse.'],
      ['② Optimization', 'Performed only on hard parse. Applies to DML only — DDL is not optimized.'],
      ['③ Row Source Generation', 'Converts the optimal plan into a row source tree the SQL engine can execute.'],
      ['④ Execution', 'The only mandatory step in DML processing. The SQL engine executes each node in the tree.'],
    ],
    parsingTitle: 'SQL Parsing',
    parsingDesc:
      "Parsing splits a SQL statement into a data structure the database can process. When an app issues a parse call, Oracle opens a cursor — a handle to the session's private SQL area (in PGA) that holds the parsed SQL and processing info.",
    syntaxTitle: 'Syntax Check',
    syntaxDesc:
      'Oracle checks whether the SQL statement is grammatically correct. Any statement that breaks SQL syntax rules fails immediately.',
    syntaxSql: `-- Syntax error: FROM misspelled as FORM
SQL> SELECT * FORM employees;
SELECT * FORM employees
         *
ERROR at line 1:
ORA-00923: FROM keyword not found where expected`,
    semanticTitle: 'Semantic Check',
    semanticDesc:
      'Even syntactically correct SQL can fail if the meaning is wrong — for example, referencing a table or column that does not exist.',
    semanticSql: `-- Semantic error: table does not exist
SQL> SELECT * FROM nonexistent_table;
SELECT * FROM nonexistent_table
              *
ERROR at line 1:
ORA-00942: table or view does not exist`,
    sharedPoolTitle: 'Shared Pool Check',
    sharedPoolDesc:
      "During parsing, Oracle checks the Shared Pool to see if this SQL has been run before. If it has, expensive steps can be skipped. Every SQL gets a unique SQL ID (visible in V$SQL.SQL_ID) from a hash of the statement text.",
    hardSoftTitle: 'Hard Parse vs Soft Parse',
    hardSoftRows: [
      ['Hard Parse', "The SQL isn't in the Shared Pool, so Oracle builds a fresh execution plan from scratch — a library cache miss. It needs a latch (serialization device), and too many concurrent hard parses cause contention and hurt performance."],
      ['Soft Parse', "The SQL is already in the Shared Pool, so Oracle reuses the cached plan — a library cache hit. Optimization and row source generation are skipped, making this much faster."],
    ],
    hardSoftNote:
      "Even identical SQL can trigger a hard parse if the optimizer environment differs. The optimizer environment is all session settings that affect plan generation (e.g., OPTIMIZER_MODE, work area size).",
    hardSoftSql: `-- Same SELECT, three different optimizer environments → three hard parses
ALTER SESSION SET OPTIMIZER_MODE=ALL_ROWS;
ALTER SYSTEM FLUSH SHARED_POOL;               -- environment 1
SELECT * FROM sh.sales;

ALTER SESSION SET OPTIMIZER_MODE=FIRST_ROWS;  -- environment 2
SELECT * FROM sh.sales;

ALTER SESSION SET SQL_TRACE=true;             -- environment 3
SELECT * FROM sh.sales;`,
    bindVarTitle: 'Bind Variables',
    bindVarSql: `-- Hard parse: different literals = different SQL statements
SELECT * FROM employees WHERE employee_id = 100;
SELECT * FROM employees WHERE employee_id = 101;

-- Soft parse: bind variable → same cursor reused for any value
SELECT * FROM employees WHERE employee_id = :emp_id;`,
    bindVarNote:
      'Using bind variables lets Oracle recognize different executions as the same SQL, enabling soft parses. This is the most fundamental SQL tuning pattern.',
    rowSourceTitle: 'Row Source Generation',
    rowSourceDesc:
      'The row source generator receives the optimal plan from the optimizer and converts it into a row source tree the SQL engine can walk. The tree captures:',
    rowSourceItems: [
      'The order in which tables are accessed',
      'The access method for each table (index scan, full scan, etc.)',
      'The join method between tables (Nested Loops, Hash Join, etc.)',
      'Additional operations like filter, sort, or aggregation',
    ],
    executionTitle: 'SQL Execution',
    executionDesc:
      'The SQL engine finally executes each node in the row source tree. This is the only mandatory step in DML processing. Execution proceeds bottom-up — read the plan from the most-indented operation upward.',
    executionPlanSql: `-- Execution plan example
SELECT e.last_name, j.job_title, d.department_name
FROM   hr.employees e, hr.departments d, hr.jobs j
WHERE  e.department_id = d.department_id
AND    e.job_id = j.job_id
AND    e.last_name LIKE 'A%';

Plan hash value: 975837011
---------------------------------------------------------------------------
| Id| Operation                    | Name      |Rows|Bytes|Cost(%CPU)|Time|
---------------------------------------------------------------------------
| 0| SELECT STATEMENT              |           |  3 | 189|  7 (15)|00:00:01|
|*1|  HASH JOIN                    |           |  3 | 189|  7 (15)|00:00:01|
|*2|   HASH JOIN                   |           |  3 | 141|  5 (20)|00:00:01|
| 3|    TABLE ACCESS BY INDEX ROWID| EMPLOYEES |  3 |  60|  2  (0)|00:00:01|
|*4|     INDEX RANGE SCAN          | EMP_NAME_IX| 3 |   |  1  (0)|00:00:01|
| 5|    TABLE ACCESS FULL          | JOBS       | 19 | 513|  2  (0)|00:00:01|
| 6|   TABLE ACCESS FULL           | DEPARTMENTS| 27 | 432|  2  (0)|00:00:01|
---------------------------------------------------------------------------`,
    executionNote:
      'Execution order (bottom-up): ① INDEX RANGE SCAN on EMP_NAME_IX → ② TABLE ACCESS on EMPLOYEES → ③ JOBS Full Scan → ④ Hash Join → ⑤ DEPARTMENTS Full Scan → ⑥ Hash Join.',
    executionSteps: [
      { title: '① INDEX RANGE SCAN on EMP_NAME_IX (Id 4)', desc: 'Scans only index entries where last_name starts with A.' },
      { title: '② TABLE ACCESS BY INDEX ROWID on EMPLOYEES (Id 3)', desc: 'Fetches actual rows using ROWIDs from the index.' },
      { title: '③ TABLE ACCESS FULL on JOBS (Id 5)', desc: 'Reads the entire JOBS table.' },
      { title: '④ Hash Join (Id 2)', desc: 'Joins EMPLOYEES result with JOBS using a hash join.' },
      { title: '⑤ TABLE ACCESS FULL on DEPARTMENTS (Id 6)', desc: 'Reads the entire DEPARTMENTS table.' },
      { title: '⑥ Hash Join (Id 1)', desc: 'Joins the previous result with DEPARTMENTS — done!' },
    ],
    dmlTitle: 'How DML Is Processed',
    dmlDesc:
      'Most DML statements include a query component. The cursor execution places results into a result set; during fetch, rows are returned (and sorted if requested). Oracle\'s read consistency mechanism guarantees all data blocks read by a query are consistent to a single point in time.',
    ddlTitle: 'DDL Is Processed Differently',
    ddlDesc:
      "DDL like CREATE TABLE skips optimization entirely — Oracle parses it and carries out the command directly. Behind the scenes, dozens of recursive SQL statements run automatically to complete a single DDL operation.",
    ddlSql: `-- DDL execution example
CREATE TABLE mytable (mycolumn INTEGER);

-- Recursive SQL that runs internally:
-- Issue COMMIT before executing CREATE TABLE
-- Verify user has sufficient privileges
-- Determine target tablespace
-- Check tablespace quota is not exceeded
-- Confirm no object with the same name exists
-- Insert table definition rows into the data dictionary
-- COMMIT on success, ROLLBACK on failure`,
  },
}

export function SqlProcessingSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconBolt size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.stagesTitle}</SectionTitle>
      <Prose>{t.stagesDesc}</Prose>
      <Table
        headers={isKo ? ['단계', '설명'] : ['Stage', 'Description']}
        rows={t.stageRows}
      />

      <Divider />

      <SectionTitle>{t.parsingTitle}</SectionTitle>
      <Prose>{t.parsingDesc}</Prose>

      <SubTitle>{t.syntaxTitle}</SubTitle>
      <Prose>{t.syntaxDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.syntaxSql} />
      </div>

      <SubTitle>{t.semanticTitle}</SubTitle>
      <Prose>{t.semanticDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.semanticSql} />
      </div>

      <SubTitle>{t.sharedPoolTitle}</SubTitle>
      <Prose>{t.sharedPoolDesc}</Prose>

      <SectionTitle>{t.hardSoftTitle}</SectionTitle>
      <Table
        headers={isKo ? ['파싱 유형', '설명'] : ['Parse Type', 'Description']}
        rows={t.hardSoftRows}
      />
      <div className="mt-4">
        <InfoBox variant="note">{t.hardSoftNote}</InfoBox>
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.hardSoftSql} />
      </div>

      <SectionTitle>{t.bindVarTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.bindVarSql} />
      </div>
      <div className="mt-4">
        <InfoBox variant="tip">{t.bindVarNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.rowSourceTitle}</SectionTitle>
      <Prose>{t.rowSourceDesc}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.rowSourceItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <Divider />

      <SectionTitle>{t.executionTitle}</SectionTitle>
      <Prose>{t.executionDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.executionPlanSql} />
      </div>
      <StepList steps={t.executionSteps} />
      <div className="mt-4">
        <InfoBox variant="note">{t.executionNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.dmlTitle}</SectionTitle>
      <Prose>{t.dmlDesc}</Prose>

      <SectionTitle>{t.ddlTitle}</SectionTitle>
      <Prose>{t.ddlDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.ddlSql} />
      </div>
    </PageContainer>
  )
}
