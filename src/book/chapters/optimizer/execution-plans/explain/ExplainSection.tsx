import { IconSearch } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  AccordionSection,
} from '../../../shared'

const T = {
  ko: {
    title: 'EXPLAIN PLAN으로 실행 계획 생성하기',
    subtitle:
      'EXPLAIN PLAN 문장은 SQL 문장에 대해 옵티마이저가 선택한 실행 계획을 확인하게 해줍니다.',
    aboutTitle: 'EXPLAIN PLAN이란?',
    aboutDesc:
      'EXPLAIN PLAN 문장은 SELECT, UPDATE, INSERT, DELETE 문장에 대해 옵티마이저가 선택하는 실행 계획을 표시합니다. EXPLAIN PLAN 출력은 문장이 설명(explain)되었을 때 데이터베이스가 SQL 문장을 어떻게 실행했을지 보여줍니다. 실행 환경과 설명 환경의 차이로 인해 설명된 계획이 실제 실행 계획과 다를 수 있습니다.\n\nEXPLAIN PLAN 문장은 DDL이 아닌 DML 문장입니다. 따라서 Oracle 데이터베이스는 EXPLAIN PLAN 문장이 수행한 변경 사항을 암묵적으로 커밋하지 않습니다.',
    planTableTitle: 'PLAN_TABLE',
    planTableDesc:
      'PLAN_TABLE은 EXPLAIN PLAN 문장이 실행 계획을 설명하는 행을 삽입하는 기본 샘플 출력 테이블입니다. Oracle 데이터베이스는 SYS 스키마에 전역 임시 테이블 PLAN_TABLE$를 자동으로 생성하고, PLAN_TABLE을 동의어(synonym)로 만듭니다. PLAN_TABLE에 대한 모든 필요한 권한은 PUBLIC에 부여됩니다.',
    planTableSql: `-- PLAN_TABLE 수동 생성 (필요한 경우)
@$ORACLE_HOME/rdbms/admin/catplan.sql`,
    restrictionsTitle: 'EXPLAIN PLAN 제한 사항',
    restrictionsItems: [
      'Oracle 데이터베이스는 날짜 바인드 변수의 암묵적 형변환을 수행하는 문장에 대해 EXPLAIN PLAN을 지원하지 않습니다.',
      '바인드 변수가 있는 경우 EXPLAIN PLAN 출력이 실제 실행 계획을 나타내지 않을 수 있습니다.',
      'TKPROF는 SQL 문장의 텍스트에서 바인드 변수의 타입을 결정할 수 없습니다. VARCHAR로 가정하며, 그렇지 않으면 오류 메시지를 출력합니다.',
    ],
    basicStepsTitle: 'EXPLAIN PLAN 기본 사용법',
    basicStepsDesc: 'PLAN_TABLE에 SQL 문장의 계획을 저장하려면 EXPLAIN PLAN을 사용합니다.',
    basicStepsSql: `-- 1단계: EXPLAIN PLAN 실행
EXPLAIN PLAN FOR
  SELECT e.last_name, d.department_name, e.salary
  FROM   employees e, departments d
  WHERE  salary < 3000
  AND    e.department_id = d.department_id
  ORDER BY salary DESC;

-- 2단계: DBMS_XPLAN.DISPLAY 함수로 결과 확인
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'ALL'));`,
    basicStepsOutput: `-- 출력 예시 (Hash Join 선택)
Plan hash value: 3556827125

------------------------------------------------------------------------------
| Id | Operation           | Name        |Rows | Bytes |Cost (%CPU)| Time    |
------------------------------------------------------------------------------
|  0 | SELECT STATEMENT    |             |   4 |   124 |   5  (20)| 00:00:01 |
|  1 |  SORT ORDER BY      |             |   4 |   124 |   5  (20)| 00:00:01 |
|* 2 |   HASH JOIN         |             |   4 |   124 |   4   (0)| 00:00:01 |
|* 3 |    TABLE ACCESS FULL| EMPLOYEES   |   4 |    60 |   2   (0)| 00:00:01 |
|  4 |    TABLE ACCESS FULL| DEPARTMENTS |  27 |   432 |   2   (0)| 00:00:01 |
------------------------------------------------------------------------------

Predicate Information (identified by operation id):
   2 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")
   3 - filter("SALARY"<3000)

Note
-----
   - this is an adaptive plan`,
    stmtIdTitle: 'STATEMENT_ID로 여러 계획 관리하기',
    stmtIdDesc:
      '여러 문장이 있을 때 문장 식별자(STATEMENT_ID)를 지정하면 특정 실행 계획을 식별할 수 있습니다. SET STATEMENT_ID를 사용하기 전에 해당 STATEMENT_ID의 기존 행을 제거하세요.',
    stmtIdSql: `-- Example 6-1: STATEMENT_ID 사용
EXPLAIN PLAN
  SET STATEMENT_ID = 'st1' FOR
  SELECT last_name FROM employees;

-- 다른 테이블 이름 지정 (INTO 절)
EXPLAIN PLAN
  INTO my_plan_table FOR
  SELECT last_name FROM employees;

-- STATEMENT_ID와 INTO 동시 사용
EXPLAIN PLAN
  SET STATEMENT_ID = 'st1'
  INTO my_plan_table FOR
  SELECT last_name FROM employees;`,
    ex1Sql: `-- Example 6-2: EXPLAIN PLAN for Statement ID ex_plan1
EXPLAIN PLAN
  SET statement_id = 'ex_plan1' FOR
  SELECT phone_number
  FROM   employees
  WHERE  phone_number LIKE '650%';

SELECT PLAN_TABLE_OUTPUT
  FROM TABLE(DBMS_XPLAN.DISPLAY(statement_id => 'ex_plan1'));`,
    ex1Output: `-- 출력 (Full Table Scan 선택)
Plan hash value: 1445457117

---------------------------------------------------------------------------
|Id | Operation         | Name      |Rows | Bytes | Cost (%CPU)| Time     |
---------------------------------------------------------------------------
|  0| SELECT STATEMENT  |           |   1 |    15 |     2   (0)| 00:00:01 |
|* 1|  TABLE ACCESS FULL| EMPLOYEES |   1 |    15 |     2   (0)| 00:00:01 |
---------------------------------------------------------------------------

Predicate Information (identified by operation id):
   1 - filter("PHONE_NUMBER" LIKE '650%')`,
    ex2Sql: `-- Example 6-3: EXPLAIN PLAN for Statement ID ex_plan2 (BASIC 포맷)
EXPLAIN PLAN
  SET statement_id = 'ex_plan2' FOR
  SELECT last_name
  FROM   employees
  WHERE  last_name LIKE 'Pe%';

SELECT PLAN_TABLE_OUTPUT
  FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, 'ex_plan2','BASIC'));`,
    ex2Output: `-- BASIC 포맷 출력 (최소 정보만)
----------------------------------------
| Id  | Operation        | Name        |
----------------------------------------
|   0 | SELECT STATEMENT |             |
|   1 |  INDEX RANGE SCAN| EMP_NAME_IX |
----------------------------------------`,
    containersTitle: 'CONTAINERS 쿼리에 대한 EXPLAIN PLAN',
    containersDesc:
      'CONTAINERS 절을 사용하면 사용자 생성 테이블/뷰와 Oracle 제공 테이블/뷰 모두를 모든 컨테이너에 걸쳐 쿼리할 수 있습니다.',
    containersSql: `EXPLAIN PLAN FOR
  SELECT con_id, count(*)
  FROM   containers(sys.dba_tables)
  WHERE  con_id < 10
  GROUP BY con_id
  ORDER BY con_id;

@?/rdbms/admin/utlxpls`,
    containersOutput: `---------------------------------------------------------------------------------------------------------------
Plan hash value: 891225627
---------------------------------------------------------------------------------------------------------------
| Id  | Operation                        | Name       | Rows  | Bytes | Cost (%CPU)| Time     | Pstart| Pstop |
---------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT                 |            |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   1 |  PX COORDINATOR                  |            |       |       |            |          |       |       |
|   2 |   PX SEND QC (ORDER)             | :TQ10001   |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   3 |    SORT GROUP BY                 |            |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   4 |     PX RECEIVE                   |            |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   5 |      PX SEND RANGE               | :TQ10000   |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   6 |       HASH GROUP BY              |            |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   7 |        PX PARTITION LIST ITERATOR|            |   234K|  2970K|   139 (100)| 00:00:01 |     1 |     9 |
|   8 |         CONTAINERS FULL          | DBA_TABLES |   234K|  2970K|   139 (100)| 00:00:01 |       |       |
---------------------------------------------------------------------------------------------------------------`,
    containersNote:
      'CONTAINERS 절을 사용하는 쿼리는 기본적으로 파티셔닝됩니다. 행 7의 PX PARTITION LIST ITERATOR가 이를 나타냅니다. Pstart=1, Pstop=9는 con_id < 10 조건에서 도출됩니다.',
    customQueryTitle: 'PLAN_TABLE 직접 쿼리하기',
    customQueryDesc:
      'STATEMENT_ID를 지정했다면 직접 SQL 스크립트를 작성해 PLAN_TABLE을 쿼리할 수 있습니다.',
    customQuerySql: `-- CONNECT BY로 트리 구조를 따라 계획 조회
SELECT  cardinality "Rows",
        lpad(' ', level-1) || operation || ' ' || options || ' ' || object_name "Plan"
FROM    PLAN_TABLE
CONNECT BY PRIOR id = parent_id
        AND PRIOR statement_id = statement_id
  START WITH id = 0
        AND statement_id = 'st1'
  ORDER BY id;`,
    partitionTitle: '파티션 객체에 대한 EXPLAIN PLAN',
    partitionDesc:
      '프루닝(pruning) 후 접근되는 파티션은 PARTITION_START와 PARTITION_STOP 컬럼에 표시됩니다. Range 파티션의 행 소스 이름은 PARTITION RANGE이고, Hash 파티션은 PARTITION HASH입니다.',
    partitionSql: `-- Range 파티션 테이블 생성
CREATE TABLE emp_range
PARTITION BY RANGE(hire_date)
(
  PARTITION emp_p1 VALUES LESS THAN (TO_DATE('1-JAN-1992','DD-MON-YYYY')),
  PARTITION emp_p2 VALUES LESS THAN (TO_DATE('1-JAN-1994','DD-MON-YYYY')),
  PARTITION emp_p3 VALUES LESS THAN (TO_DATE('1-JAN-1996','DD-MON-YYYY')),
  PARTITION emp_p4 VALUES LESS THAN (TO_DATE('1-JAN-1998','DD-MON-YYYY')),
  PARTITION emp_p5 VALUES LESS THAN (TO_DATE('1-JAN-2001','DD-MON-YYYY'))
)
AS SELECT * FROM employees;

-- 전체 파티션 스캔 (프루닝 없음)
EXPLAIN PLAN FOR SELECT * FROM emp_range;
-- Pstart=1, Pstop=5 → 모든 파티션 접근

-- 조건절로 파티션 프루닝
EXPLAIN PLAN FOR
  SELECT * FROM emp_range
  WHERE  hire_date >= TO_DATE('1-JAN-1996','DD-MON-YYYY');
-- PARTITION RANGE ITERATOR: Pstart=4, Pstop=5 → 파티션 4~5만 접근`,
    partitionNote:
      '파티션 번호를 컴파일 시점에 알 수 없을 때(바인드 변수 사용 등) PARTITION_START와 PARTITION_STOP이 KEY로 표시되며, 런타임에 결정됩니다.',
    parallelTitle: '병렬 쿼리 EXPLAIN PLAN',
    parallelDesc:
      '병렬 쿼리 계획은 직렬 쿼리 계획과 중요한 차이가 있습니다. 병렬 계획에서는 PX 관련 행 소스들이 추가됩니다.',
    parallelSql: `-- 병렬 쿼리 EXPLAIN PLAN 예시 (Example 6-4)
CREATE TABLE emp2 AS SELECT * FROM employees;
ALTER TABLE emp2 PARALLEL 2;

EXPLAIN PLAN FOR
  SELECT SUM(salary)
  FROM   emp2
  GROUP BY department_id;

SELECT PLAN_TABLE_OUTPUT FROM TABLE(DBMS_XPLAN.DISPLAY());`,
    parallelOutput: `-------------------------------------------------------------------------------------
|Id | Operation              | Name   |Rows| Bytes |Cost %CPU| TQ |IN-OUT|PQ Distrib|
-------------------------------------------------------------------------------------
| 0 | SELECT STATEMENT       |        |107 | 2782  | 3 (34)  |    |      |          |
| 1 |  PX COORDINATOR        |        |    |       |         |    |      |          |
| 2 |   PX SEND QC (RANDOM)  |:TQ10001|107 | 2782  | 3 (34)  |Q1,01|P->S |QC (RAND) |
| 3 |    HASH GROUP BY       |        |107 | 2782  | 3 (34)  |Q1,01|PCWP |          |
| 4 |     PX RECEIVE         |        |107 | 2782  | 3 (34)  |Q1,01|PCWP |          |
| 5 |      PX SEND HASH      |:TQ10000|107 | 2782  | 3 (34)  |Q1,00|P->P |HASH      |
| 6 |       HASH GROUP BY    |        |107 | 2782  | 3 (34)  |Q1,00|PCWP |          |
| 7 |        PX BLOCK ITERATOR|       |107 | 2782  | 2  (0)  |Q1,00|PCWP |          |
| 8 |         TABLE ACCESS FULL|EMP2  |107 | 2782  | 2  (0)  |Q1,00|PCWP |          |
-------------------------------------------------------------------------------------`,
    parallelNote:
      'PX BLOCK ITERATOR는 EMP2 테이블을 병렬 실행 서버들이 나눠 스캔하기 위한 분할을 나타냅니다. PX SEND/PX RECEIVE는 두 병렬 서버 집합을 연결하는 파이프입니다.',
    bitmapTitle: 'Bitmap 인덱스 계획 (Example 6-5)',
    bitmapSql: `EXPLAIN PLAN FOR
  SELECT * FROM t
  WHERE  c1 = 2
  AND    c2 <> 6
  OR     c3 BETWEEN 10 AND 20;

SELECT STATEMENT
  TABLE ACCESS T BY INDEX ROWID
    BITMAP CONVERSION TO ROWID
      BITMAP OR
        BITMAP MINUS
          BITMAP MINUS
            BITMAP INDEX C1_IND SINGLE VALUE
            BITMAP INDEX C2_IND SINGLE VALUE
          BITMAP INDEX C2_IND SINGLE VALUE
        BITMAP MERGE
          BITMAP INDEX C3_IND RANGE SCAN`,
    bitmapNote:
      'c1=2 조건에서 비트맵을 얻고, c2=6인 비트를 빼고, c2 IS NULL인 비트를 뺍니다. NULL 제거는 컬럼에 NOT NULL 제약이 없으면 의미적 정확성을 위해 필요합니다.',
    resultCacheTitle: 'Result Cache 계획',
    resultCacheSql: `EXPLAIN PLAN FOR
SELECT /*+ result_cache(TEMP=TRUE) */ department_id, AVG(salary)
FROM   employees
GROUP BY department_id;

SELECT PLAN_TABLE_OUTPUT
FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'ALL'));`,
    resultCacheOutput: `| Id  | Operation           | Name                       | Rows  |Bytes|Cost (%CPU)| Time|
|   0 | SELECT STATEMENT    |                            |  11 |  77 | 4  (25)| 00:00:01 |
|   1 |  RESULT CACHE       | ch5r45jxt05rk0xc1brct197fp |  11 |  77 | 4  (25)| 00:00:01 |
|   2 |   HASH GROUP BY     |                            |  11 |  77 | 4  (25)| 00:00:01 |
|   3 |    TABLE ACCESS FULL| EMPLOYEES                  | 107 | 749 | 3   (0)| 00:00:01 |`,
    resultCacheNote:
      'RESULT CACHE 연산은 캐시 ID(ch5r45jxt05rk0xc1brct197fp)로 식별됩니다. V$RESULT_CACHE_OBJECTS 뷰를 이 CACHE_ID로 조회해 상태를 확인할 수 있습니다.',

    whyChangeTitle: '실행 계획이 변경되는 이유',
    whyChangeDesc:
      'EXPLAIN PLAN이 보여주는 계획은 explain 시점의 계획이에요. 실제 실행 시점과 환경이 다르면 계획이 달라질 수 있습니다. SQL 성능 회귀를 방지하려면 SQL Plan Management 사용을 고려하세요.',
    whyChangeSchemaTitle: '스키마 차이 (Different Schemas)',
    whyChangeSchemaItems: [
      '실행 환경과 EXPLAIN PLAN 환경이 다른 데이터베이스를 사용하는 경우',
      'EXPLAIN하는 사용자와 실행하는 사용자가 다른 경우 — 두 사용자가 같은 데이터베이스의 서로 다른 객체를 참조할 수 있어요',
      '두 연산 사이에 스키마 변경(특히 인덱스 변경)이 발생한 경우',
    ],
    whyCostTitle: '비용 차이 (Different Costs)',
    whyCostItems: [
      '데이터 볼륨과 통계가 달라진 경우',
      '바인드 변수 타입과 값이 다른 경우',
      '전역 또는 세션 수준에서 설정된 초기화 파라미터가 다른 경우',
    ],
  },
  en: {
    title: 'Generating Plans with EXPLAIN PLAN',
    subtitle:
      'The EXPLAIN PLAN statement enables you to examine the execution plan that the optimizer chose for a SQL statement.',
    aboutTitle: 'About the EXPLAIN PLAN Statement',
    aboutDesc:
      'The EXPLAIN PLAN statement displays execution plans that the optimizer chooses for SELECT, UPDATE, INSERT, and DELETE statements. EXPLAIN PLAN output shows how the database would have run the SQL statement when the statement was explained. Because of differences in the execution environment and explain plan environment, the explained plan can differ from the actual plan used during statement execution.\n\nThe EXPLAIN PLAN statement is a DML statement rather than a DDL statement. Therefore, Oracle Database does not implicitly commit the changes made by an EXPLAIN PLAN statement.',
    planTableTitle: 'About PLAN_TABLE',
    planTableDesc:
      'PLAN_TABLE is the default sample output table into which the EXPLAIN PLAN statement inserts rows describing execution plans. Oracle Database automatically creates a global temporary table PLAN_TABLE$ in the SYS schema, and creates PLAN_TABLE as a synonym. All necessary privileges to PLAN_TABLE are granted to PUBLIC.',
    planTableSql: `-- Manually create PLAN_TABLE if needed
@$ORACLE_HOME/rdbms/admin/catplan.sql`,
    restrictionsTitle: 'EXPLAIN PLAN Restrictions',
    restrictionsItems: [
      'Oracle Database does not support EXPLAIN PLAN for statements performing implicit type conversion of date bind variables.',
      'With bind variables in general, the EXPLAIN PLAN output might not represent the real execution plan.',
      'TKPROF cannot determine the types of the bind variables from the text of a SQL statement — it assumes VARCHAR and gives an error message otherwise.',
    ],
    basicStepsTitle: 'Explaining a SQL Statement: Basic Steps',
    basicStepsDesc: 'Use EXPLAIN PLAN to store the plan for a SQL statement in PLAN_TABLE.',
    basicStepsSql: `-- Step 1: Run EXPLAIN PLAN
EXPLAIN PLAN FOR
  SELECT e.last_name, d.department_name, e.salary
  FROM   employees e, departments d
  WHERE  salary < 3000
  AND    e.department_id = d.department_id
  ORDER BY salary DESC;

-- Step 2: Display the plan using DBMS_XPLAN.DISPLAY
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'ALL'));`,
    basicStepsOutput: `-- Sample output (Hash Join chosen)
Plan hash value: 3556827125

------------------------------------------------------------------------------
| Id | Operation           | Name        |Rows | Bytes |Cost (%CPU)| Time    |
------------------------------------------------------------------------------
|  0 | SELECT STATEMENT    |             |   4 |   124 |   5  (20)| 00:00:01 |
|  1 |  SORT ORDER BY      |             |   4 |   124 |   5  (20)| 00:00:01 |
|* 2 |   HASH JOIN         |             |   4 |   124 |   4   (0)| 00:00:01 |
|* 3 |    TABLE ACCESS FULL| EMPLOYEES   |   4 |    60 |   2   (0)| 00:00:01 |
|  4 |    TABLE ACCESS FULL| DEPARTMENTS |  27 |   432 |   2   (0)| 00:00:01 |
------------------------------------------------------------------------------

Note
-----
   - this is an adaptive plan`,
    stmtIdTitle: 'Specifying a Statement ID: Example',
    stmtIdDesc:
      'With multiple statements, you can specify a statement identifier and use that to identify your specific execution plan. Before using SET STATEMENT ID, remove any existing rows for that statement ID.',
    stmtIdSql: `-- Example 6-1: Using EXPLAIN PLAN with the STATEMENT ID Clause
EXPLAIN PLAN
  SET STATEMENT_ID = 'st1' FOR
  SELECT last_name FROM employees;

-- Specifying a different output table (INTO clause)
EXPLAIN PLAN
  INTO my_plan_table FOR
  SELECT last_name FROM employees;

-- Combining STATEMENT_ID and INTO
EXPLAIN PLAN
  SET STATEMENT_ID = 'st1'
  INTO my_plan_table FOR
  SELECT last_name FROM employees;`,
    ex1Sql: `-- Example 6-2: EXPLAIN PLAN for Statement ID ex_plan1
EXPLAIN PLAN
  SET statement_id = 'ex_plan1' FOR
  SELECT phone_number
  FROM   employees
  WHERE  phone_number LIKE '650%';

SELECT PLAN_TABLE_OUTPUT
  FROM TABLE(DBMS_XPLAN.DISPLAY(statement_id => 'ex_plan1'));`,
    ex1Output: `-- Sample output (Full Table Scan chosen)
Plan hash value: 1445457117

---------------------------------------------------------------------------
|Id | Operation         | Name      |Rows | Bytes | Cost (%CPU)| Time     |
---------------------------------------------------------------------------
|  0| SELECT STATEMENT  |           |   1 |    15 |     2   (0)| 00:00:01 |
|* 1|  TABLE ACCESS FULL| EMPLOYEES |   1 |    15 |     2   (0)| 00:00:01 |
---------------------------------------------------------------------------

Predicate Information (identified by operation id):
   1 - filter("PHONE_NUMBER" LIKE '650%')`,
    ex2Sql: `-- Example 6-3: EXPLAIN PLAN for Statement ID ex_plan2 (BASIC format)
EXPLAIN PLAN
  SET statement_id = 'ex_plan2' FOR
  SELECT last_name
  FROM   employees
  WHERE  last_name LIKE 'Pe%';

SELECT PLAN_TABLE_OUTPUT
  FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, 'ex_plan2','BASIC'));`,
    ex2Output: `-- BASIC format output (minimal information)
----------------------------------------
| Id  | Operation        | Name        |
----------------------------------------
|   0 | SELECT STATEMENT |             |
|   1 |  INDEX RANGE SCAN| EMP_NAME_IX |
----------------------------------------`,
    containersTitle: 'EXPLAIN PLAN Output for a CONTAINERS Query',
    containersDesc:
      'The CONTAINERS clause can be used to query both user-created and Oracle-supplied tables and views across all containers.',
    containersSql: `EXPLAIN PLAN FOR
  SELECT con_id, count(*)
  FROM   containers(sys.dba_tables)
  WHERE  con_id < 10
  GROUP BY con_id
  ORDER BY con_id;

@?/rdbms/admin/utlxpls`,
    containersOutput: `| Id  | Operation                        | Name       | Rows  | Bytes | Cost (%CPU)| Time     | Pstart| Pstop |
|   0 | SELECT STATEMENT                 |            |   234K|  2970K|   145 (100)| 00:00:01 |       |       |
|   7 |        PX PARTITION LIST ITERATOR|            |   234K|  2970K|   139 (100)| 00:00:01 |     1 |     9 |
|   8 |         CONTAINERS FULL          | DBA_TABLES |   234K|  2970K|   139 (100)| 00:00:01 |       |       |`,
    containersNote:
      'A query using the CONTAINERS clause is partitioned by default. At Row 7, PX PARTITION LIST ITERATOR indicates that the query is partitioned. Pstart=1 and Pstop=9 are derived from the con_id < 10 predicate.',
    customQueryTitle: 'Customizing PLAN_TABLE Output',
    customQueryDesc:
      'If you have specified a statement identifier, you can write your own script to query PLAN_TABLE.',
    customQuerySql: `-- Walk the tree using CONNECT BY
SELECT  cardinality "Rows",
        lpad(' ', level-1) || operation || ' ' || options || ' ' || object_name "Plan"
FROM    PLAN_TABLE
CONNECT BY PRIOR id = parent_id
        AND PRIOR statement_id = statement_id
  START WITH id = 0
        AND statement_id = 'st1'
  ORDER BY id;`,
    partitionTitle: 'Displaying Plans for Partitioned Objects',
    partitionDesc:
      'Partitions accessed after pruning are shown in the PARTITION_START and PARTITION_STOP columns. The row source name for range partitions is PARTITION RANGE, and for hash partitions is PARTITION HASH.',
    partitionSql: `-- Create range-partitioned table
CREATE TABLE emp_range
PARTITION BY RANGE(hire_date)
(
  PARTITION emp_p1 VALUES LESS THAN (TO_DATE('1-JAN-1992','DD-MON-YYYY')),
  PARTITION emp_p2 VALUES LESS THAN (TO_DATE('1-JAN-1994','DD-MON-YYYY')),
  PARTITION emp_p3 VALUES LESS THAN (TO_DATE('1-JAN-1996','DD-MON-YYYY')),
  PARTITION emp_p4 VALUES LESS THAN (TO_DATE('1-JAN-1998','DD-MON-YYYY')),
  PARTITION emp_p5 VALUES LESS THAN (TO_DATE('1-JAN-2001','DD-MON-YYYY'))
)
AS SELECT * FROM employees;

-- Full scan of all partitions (no pruning)
EXPLAIN PLAN FOR SELECT * FROM emp_range;
-- Pstart=1, Pstop=5 → all partitions accessed

-- Partition pruning with predicate
EXPLAIN PLAN FOR
  SELECT * FROM emp_range
  WHERE  hire_date >= TO_DATE('1-JAN-1996','DD-MON-YYYY');
-- PARTITION RANGE ITERATOR: Pstart=4, Pstop=5 → partitions 4 and 5 only`,
    partitionNote:
      'When partition numbers are unknown at compile time (e.g., with bind variables), PARTITION_START and PARTITION_STOP show KEY, meaning Oracle determines the subpartitions at run time.',
    parallelTitle: 'Displaying Parallel Execution Plans (Example 6-4)',
    parallelDesc:
      'Plans for parallel queries differ in important ways from plans for serial queries. Parallel-specific row sources (PX COORDINATOR, PX SEND, PX RECEIVE, PX BLOCK ITERATOR) appear in the plan.',
    parallelSql: `CREATE TABLE emp2 AS SELECT * FROM employees;
ALTER TABLE emp2 PARALLEL 2;

EXPLAIN PLAN FOR
  SELECT SUM(salary)
  FROM   emp2
  GROUP BY department_id;

SELECT PLAN_TABLE_OUTPUT FROM TABLE(DBMS_XPLAN.DISPLAY());`,
    parallelOutput: `|Id | Operation              | Name   |Rows| Bytes |Cost %CPU| TQ |IN-OUT|PQ Distrib|
| 0 | SELECT STATEMENT       |        |107 | 2782  | 3 (34)  |    |      |          |
| 1 |  PX COORDINATOR        |        |    |       |         |    |      |          |
| 7 |        PX BLOCK ITERATOR|       |107 | 2782  | 2  (0)  |Q1,00|PCWP |          |
| 8 |         TABLE ACCESS FULL|EMP2  |107 | 2782  | 2  (0)  |Q1,00|PCWP |          |`,
    parallelNote:
      'PX BLOCK ITERATOR splits EMP2 into pieces to divide the scan workload between parallel execution servers. PX SEND and PX RECEIVE are the pipe connecting the two sets of parallel servers.',
    bitmapTitle: 'Displaying Bitmap Index Plans (Example 6-5)',
    bitmapSql: `EXPLAIN PLAN FOR
  SELECT * FROM t
  WHERE  c1 = 2
  AND    c2 <> 6
  OR     c3 BETWEEN 10 AND 20;

SELECT STATEMENT
  TABLE ACCESS T BY INDEX ROWID
    BITMAP CONVERSION TO ROWID
      BITMAP OR
        BITMAP MINUS
          BITMAP MINUS
            BITMAP INDEX C1_IND SINGLE VALUE
            BITMAP INDEX C2_IND SINGLE VALUE
          BITMAP INDEX C2_IND SINGLE VALUE
        BITMAP MERGE
          BITMAP INDEX C3_IND RANGE SCAN`,
    bitmapNote:
      'The predicate c1=2 yields a bitmap, then bits for c2=6 and c2 IS NULL are subtracted. The NULL subtraction is necessary for semantic correctness unless the column has a NOT NULL constraint.',
    resultCacheTitle: 'Displaying Result Cache Plans',
    resultCacheSql: `EXPLAIN PLAN FOR
SELECT /*+ result_cache(TEMP=TRUE) */ department_id, AVG(salary)
FROM   employees
GROUP BY department_id;

SELECT PLAN_TABLE_OUTPUT
FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'ALL'));`,
    resultCacheOutput: `|   0 | SELECT STATEMENT    |                            |  11 |  77 | 4  (25)| 00:00:01 |
|   1 |  RESULT CACHE       | ch5r45jxt05rk0xc1brct197fp |  11 |  77 | 4  (25)| 00:00:01 |
|   2 |   HASH GROUP BY     |                            |  11 |  77 | 4  (25)| 00:00:01 |
|   3 |    TABLE ACCESS FULL| EMPLOYEES                  | 107 | 749 | 3   (0)| 00:00:01 |`,
    resultCacheNote:
      "The RESULT CACHE operation is identified by its cache ID (ch5r45jxt05rk0xc1brct197fp). Query V$RESULT_CACHE_OBJECTS with this CACHE_ID to inspect the cache object's status.",

    whyChangeTitle: 'Why Execution Plans Change',
    whyChangeDesc:
      'EXPLAIN PLAN shows the plan as it would be chosen at explain time. When the environment differs between explain and execution, the plans can differ. To prevent SQL performance regressions, consider using SQL Plan Management.',
    whyChangeSchemaTitle: 'Different Schemas',
    whyChangeSchemaItems: [
      'The execution and explain plan occur on different databases.',
      'The user explaining the statement is different from the user running it — two users may reference different objects in the same database.',
      'Schema changes (especially index changes) occur between the two operations.',
    ],
    whyCostTitle: 'Different Costs',
    whyCostItems: [
      'Data volume and statistics have changed.',
      'Bind variable types and values differ.',
      'Initialization parameters differ at the global or session level.',
    ],
  },
}

export function ExplainSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconSearch size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.aboutTitle}</SectionTitle>
      <Prose>{t.aboutDesc}</Prose>

      <SubTitle>{t.planTableTitle}</SubTitle>
      <Prose>{t.planTableDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.planTableSql} />
      </div>

      <SubTitle>{t.restrictionsTitle}</SubTitle>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.restrictionsItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <Divider />

      <SectionTitle>{t.basicStepsTitle}</SectionTitle>
      <Prose>{t.basicStepsDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.basicStepsSql} />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.basicStepsOutput} />
      </div>

      <Divider />

      <SectionTitle>{t.stmtIdTitle}</SectionTitle>
      <Prose>{t.stmtIdDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.stmtIdSql} />
      </div>

      <AccordionSection title={isKo ? 'Example 6-2: STATEMENT_ID ex_plan1' : 'Example 6-2: Statement ID ex_plan1'}>
        <SqlBlock sql={t.ex1Sql} />
        <div className="mt-3">
          <SqlBlock sql={t.ex1Output} />
        </div>
      </AccordionSection>

      <AccordionSection title={isKo ? 'Example 6-3: BASIC 포맷 ex_plan2' : 'Example 6-3: BASIC format ex_plan2'}>
        <SqlBlock sql={t.ex2Sql} />
        <div className="mt-3">
          <SqlBlock sql={t.ex2Output} />
        </div>
      </AccordionSection>

      <Divider />

      <SectionTitle>{t.containersTitle}</SectionTitle>
      <Prose>{t.containersDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.containersSql} />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.containersOutput} />
      </div>
      <div className="mt-4">
        <InfoBox variant="note">{t.containersNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.customQueryTitle}</SectionTitle>
      <Prose>{t.customQueryDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.customQuerySql} />
      </div>

      <Divider />

      <SectionTitle>{t.partitionTitle}</SectionTitle>
      <Prose>{t.partitionDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.partitionSql} />
      </div>
      <div className="mt-4">
        <InfoBox variant="note">{t.partitionNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.parallelTitle}</SectionTitle>
      <Prose>{t.parallelDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.parallelSql} />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.parallelOutput} />
      </div>
      <div className="mt-4">
        <InfoBox variant="note">{t.parallelNote}</InfoBox>
      </div>

      <AccordionSection title={isKo ? t.bitmapTitle : t.bitmapTitle}>
        <SqlBlock sql={t.bitmapSql} />
        <div className="mt-4">
          <InfoBox variant="note">{t.bitmapNote}</InfoBox>
        </div>
      </AccordionSection>

      <AccordionSection title={t.resultCacheTitle}>
        <SqlBlock sql={t.resultCacheSql} />
        <div className="mt-3">
          <SqlBlock sql={t.resultCacheOutput} />
        </div>
        <div className="mt-4">
          <InfoBox variant="note">{t.resultCacheNote}</InfoBox>
        </div>
      </AccordionSection>

      <Divider />

      <SectionTitle>{t.whyChangeTitle}</SectionTitle>
      <Prose>{t.whyChangeDesc}</Prose>

      <SubTitle>{t.whyChangeSchemaTitle}</SubTitle>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.whyChangeSchemaItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <SubTitle>{t.whyCostTitle}</SubTitle>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.whyCostItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
