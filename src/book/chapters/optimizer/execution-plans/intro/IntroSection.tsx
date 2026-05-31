import { IconMap } from '@tabler/icons-react'
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
} from '../../../shared'

const T = {
  ko: {
    title: '실행 계획 개요',
    subtitle:
      '실행 계획(execution plan)은 데이터베이스가 SQL 문장을 실행하기 위해 수행하는 연산의 순서입니다.',
    contentsTitle: '실행 계획의 구성',
    contentsDesc:
      '실행 계획은 단독으로 잘 튜닝된 문장과 성능이 나쁜 문장을 구분하지 못합니다. 계획은 일련의 단계로 구성됩니다. 모든 단계는 데이터베이스에서 물리적으로 데이터 행을 가져오거나, 문장을 발행한 사용자를 위해 행을 준비합니다.',
    examplePlan: `-- employees와 departments 테이블을 조인하는 실행 계획 예시
SQL_ID  g9xaqjktdhbcd, child number 0
-------------------------------------
SELECT employee_id, last_name, first_name, department_name from
employees e, departments d WHERE e.department_id = d.department_id and
last_name like 'T%' ORDER BY last_name

Plan hash value: 1219589317

----------------------------------------------------------------------------------------
| Id | Operation                    | Name        |Rows | Bytes |Cost (%CPU)| Time     |
----------------------------------------------------------------------------------------
|  0 | SELECT STATEMENT             |             |     |       |    5 (100)|          |
|  1 |  NESTED LOOPS                |             |   5 |   190 |    5   (0)| 00:00:01 |
|  2 |   TABLE ACCESS BY INDEX ROWID| EMPLOYEES   |   5 |   110 |    2   (0)| 00:00:01 |
|* 3 |    INDEX RANGE SCAN          | EMP_NAME_IX |   5 |       |    1   (0)| 00:00:01 |
|* 4 |   TABLE ACCESS FULL          | DEPARTMENTS |   1 |    16 |    1   (0)| 00:00:01 |
----------------------------------------------------------------------------------------

Predicate Information (identified by operation id):
---------------------------------------------------
   3 - access("LAST_NAME" LIKE 'T%')
       filter("LAST_NAME" LIKE 'T%')
   4 - filter("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")`,
    rowSourceTreeTitle: '행 소스 트리 (Row Source Tree)',
    rowSourceTreeDesc:
      '행 소스 트리(row source tree)는 실행 계획의 핵심입니다. 트리는 다음 정보를 보여줍니다.',
    rowSourceItems: [
      '문장이 참조하는 테이블의 조인 순서 — 위 계획에서 employees가 외부(outer) 행 소스이고 departments가 내부(inner) 행 소스입니다.',
      '문장에서 언급된 각 테이블의 액세스 경로(access path) — 위 계획에서 employees는 인덱스 스캔, departments는 Full Table Scan을 선택했습니다.',
      '조인 연산의 영향을 받는 테이블들의 조인 방식(join method) — 위 계획에서 Nested Loops Join을 선택했습니다.',
      '필터, 정렬, 집계 같은 데이터 연산 — last_name이 T로 시작하는 조건 필터와 department_id 매칭.',
    ],
    additionalInfoTitle: '실행 계획에 포함되는 추가 정보',
    additionalInfoItems: [
      '최적화 정보 — 각 연산의 비용(cost)과 카디널리티(cardinality)',
      '파티셔닝 정보 — 접근되는 파티션 집합',
      '병렬 실행 정보 — 조인 입력의 분배 방식',
    ],
    execOrderTitle: '실행 순서 읽는 법',
    execOrderDesc:
      '계획의 연산들은 자식에게 데이터를 요청합니다. EXPLAIN PLAN 출력에서 실행 순서는 다음과 같습니다.',
    execOrderSteps: [
      '자식이 없는 첫 번째 연산에서 실행이 시작됩니다 — 위 예시에서는 EMPLOYEES Full Scan (Id 3).',
      'EMPLOYEES가 부모(Id 2)에게 데이터를 반환합니다.',
      '다음으로 Hash Join의 다음 자식 DEPARTMENTS Full Scan (Id 4)이 실행됩니다.',
      'DEPARTMENTS는 자식이 없으므로 부모(Id 2)에게 데이터를 반환합니다.',
      'Hash Join이 두 테이블의 행을 결합하고 SORT ORDER BY (Id 1)로 전달합니다.',
      '최종적으로 SELECT가 클라이언트에 데이터를 반환합니다.',
    ],
    execOrderNote:
      '실행 계획은 일반적으로 아래에서 위로, 가장 깊이 들여쓰여진 연산부터 읽습니다. 들여쓰기가 같은 형제 연산은 위에서 아래 순서로 실행됩니다.',
    whyChangeTitle: '실행 계획이 변경되는 이유',
    whyChangeDesc:
      '실행 계획은 옵티마이저의 입력이 변경됨에 따라 달라질 수 있습니다. SQL 성능 회귀를 방지하려면 SQL plan management 사용을 고려하세요.',
    whyChangeSchemaTitle: '다른 스키마 (Different Schemas)',
    whyChangeSchemaItems: [
      '실행 환경과 EXPLAIN PLAN 환경이 다른 데이터베이스를 사용하는 경우',
      'EXPLAIN하는 사용자와 실행하는 사용자가 다른 경우 — 두 사용자가 같은 데이터베이스의 서로 다른 객체를 참조할 수 있음',
      '두 연산 사이에 스키마 변경(특히 인덱스 변경)이 발생한 경우',
    ],
    whyCostTitle: '다른 비용 (Different Costs)',
    whyCostItems: [
      '데이터 볼륨과 통계',
      '바인드 변수 타입과 값',
      '전역 또는 세션 수준에서 설정된 초기화 파라미터',
    ],
  },
  en: {
    title: 'Introduction to Execution Plans',
    subtitle:
      'An execution plan is the sequence of operations that the database performs to run a SQL statement.',
    contentsTitle: 'Contents of an Execution Plan',
    contentsDesc:
      'The execution plan operation alone cannot differentiate between well-tuned statements and those that perform suboptimally. The plan consists of a series of steps. Every step either retrieves rows of data physically from the database or prepares them for the user issuing the statement.',
    examplePlan: `-- Execution plan example: join of employees and departments
SQL_ID  g9xaqjktdhbcd, child number 0
-------------------------------------
SELECT employee_id, last_name, first_name, department_name from
employees e, departments d WHERE e.department_id = d.department_id and
last_name like 'T%' ORDER BY last_name

Plan hash value: 1219589317

----------------------------------------------------------------------------------------
| Id | Operation                    | Name        |Rows | Bytes |Cost (%CPU)| Time     |
----------------------------------------------------------------------------------------
|  0 | SELECT STATEMENT             |             |     |       |    5 (100)|          |
|  1 |  NESTED LOOPS                |             |   5 |   190 |    5   (0)| 00:00:01 |
|  2 |   TABLE ACCESS BY INDEX ROWID| EMPLOYEES   |   5 |   110 |    2   (0)| 00:00:01 |
|* 3 |    INDEX RANGE SCAN          | EMP_NAME_IX |   5 |       |    1   (0)| 00:00:01 |
|* 4 |   TABLE ACCESS FULL          | DEPARTMENTS |   1 |    16 |    1   (0)| 00:00:01 |
----------------------------------------------------------------------------------------

Predicate Information (identified by operation id):
---------------------------------------------------
   3 - access("LAST_NAME" LIKE 'T%')
       filter("LAST_NAME" LIKE 'T%')
   4 - filter("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")`,
    rowSourceTreeTitle: 'The Row Source Tree',
    rowSourceTreeDesc:
      'The row source tree is the core of the execution plan. The tree shows the following information:',
    rowSourceItems: [
      "The join order of the tables — in the preceding plan, employees is the outer row source and departments is the inner row source.",
      "An access path for each table — the optimizer chooses an index scan for employees and a full scan for departments.",
      "A join method for joined tables — the optimizer chooses a nested loops join.",
      "Data operations like filter, sort, or aggregation — filters on last names beginning with T and matches on department_id.",
    ],
    additionalInfoTitle: 'Additional Information in the Plan Table',
    additionalInfoItems: [
      'Optimization — cost and cardinality of each operation',
      'Partitioning — set of accessed partitions',
      'Parallel execution — distribution method of join inputs',
    ],
    execOrderTitle: 'How to Read Execution Order',
    execOrderDesc:
      'Plan operations request data from their children. The execution order in EXPLAIN PLAN output is as follows:',
    execOrderSteps: [
      'Execution starts at the first operation with no children — in the example above, the full scan of EMPLOYEES (Id 3).',
      'EMPLOYEES returns its data to the parent (Id 2).',
      'Execution then proceeds to next child of the hash join and does a full scan of DEPARTMENTS (Id 4).',
      'DEPARTMENTS has no children and so returns data to the parent (Id 2).',
      'The hash join combines the rows from the two tables and passes them up to the SORT ORDER BY (Id 1).',
      'Finally the SELECT returns the data to the client.',
    ],
    execOrderNote:
      'In general, read the plan from the bottom up, starting with the most-indented (deepest) operation. Siblings at the same indentation level execute top-to-bottom.',
    whyChangeTitle: 'Why Execution Plans Change',
    whyChangeDesc:
      'Execution plans can and do change as the underlying optimizer inputs change. To avoid possible SQL performance regression, consider using SQL plan management.',
    whyChangeSchemaTitle: 'Different Schemas',
    whyChangeSchemaItems: [
      'The execution and explain plan occur on different databases.',
      'The user explaining the statement is different from the user running the statement — two users might point to different objects in the same database.',
      'Schema changes (often changes in indexes) between the two operations.',
    ],
    whyCostTitle: 'Different Costs',
    whyCostItems: [
      'Data volume and statistics',
      'Bind variable types and values',
      'Initialization parameters set globally or at session level',
    ],
  },
}

export function IntroSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconMap size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.contentsTitle}</SectionTitle>
      <Prose>{t.contentsDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.examplePlan} />
      </div>

      <Divider />

      <SectionTitle>{t.rowSourceTreeTitle}</SectionTitle>
      <Prose>{t.rowSourceTreeDesc}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.rowSourceItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <SubTitle>{t.additionalInfoTitle}</SubTitle>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.additionalInfoItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <Divider />

      <SectionTitle>{t.execOrderTitle}</SectionTitle>
      <Prose>{t.execOrderDesc}</Prose>
      <ol className="mt-3 mb-4 space-y-2 pl-4">
        {t.execOrderSteps.map((step, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80">
            <span className="font-bold text-orange-600 mr-2">{i + 1}.</span>{step}
          </li>
        ))}
      </ol>
      <InfoBox variant="note">{t.execOrderNote}</InfoBox>

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
