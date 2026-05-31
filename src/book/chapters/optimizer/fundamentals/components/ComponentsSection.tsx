import { IconLayersIntersect } from '@tabler/icons-react'
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
  AccordionSection,
} from '../../../shared'

const T = {
  ko: {
    title: '옵티마이저 구성 요소',
    subtitle:
      '쿼리 옵티마이저(query optimizer)는 SQL이 요청한 데이터에 가장 효율적으로 접근하는 방법을 찾아주는 Oracle의 내장 소프트웨어예요.',
    purposeTitle: '옵티마이저가 하는 일',
    purposeDesc:
      '옵티마이저는 SQL을 실행할 때 가장 좋은 실행 계획(execution plan)을 고르려고 해요. 여러 후보 계획 중 비용(cost)이 가장 낮은 걸 선택하는데, 비용은 I/O, CPU, 메모리 같은 자원 사용량을 수치로 표현한 거예요.',
    purposeNote:
      '예를 들어, "관리자인 직원"을 찾는 쿼리가 있다고 해봐요. 직원의 80%가 관리자라면 Full Table Scan이 더 빠를 수 있어요. 하지만 관리자가 아주 소수라면 인덱스를 타고 rowid로 테이블에 접근하는 게 훨씬 빠르겠죠. 통계가 이 판단을 좌우해요.',
    cboTitle: '비용 기반 최적화 (Cost-Based Optimization)',
    cboDesc:
      'SQL은 "어떤 순서로 실행해라"라고 지시하지 않는 비절차적 언어예요. 그래서 옵티마이저가 자유롭게 Full Table Scan이나 Index Scan, Nested Loops나 Hash Join 같은 다양한 조합을 시도해보고, 통계를 바탕으로 가장 낮은 비용의 실행 계획을 골라요.',
    cboNote:
      'Oracle 버전이 올라가면 옵티마이저가 같은 SQL에도 다른 계획을 낼 수 있어요. 더 정확한 통계와 더 많은 변환 기법이 추가되기 때문이에요.',
    optsTitle: '옵티마이저는 3개의 부품으로 이루어져 있어요',
    optsRows: [
      ['Phase 1', 'Query Transformer', '"이 SQL을 다르게 쓰면 더 빠를까?" 하고 의미가 같지만 더 효율적인 형태로 쿼리를 바꿀지 결정해요.'],
      ['Phase 2', 'Estimator', '데이터 딕셔너리의 통계를 보고 각 실행 계획의 비용을 수치로 추정해요.'],
      ['Phase 3', 'Plan Generator', '비용을 비교해서 가장 낮은 비용의 계획(=실행 계획)을 행 소스 생성기에 전달해요.'],
    ],
    qtTitle: 'Query Transformer',
    qtDesc:
      '"이 SQL, 다르게 써도 결과가 같은데 더 빠른 방법이 있지 않을까?" 하고 따져보는 게 Query Transformer의 역할이에요. 가능한 대안이 있으면 각각의 비용을 비교해서 더 싼 쪽을 선택해요.',
    estimatorTitle: 'Estimator',
    estimatorDesc:
      'Estimator는 실행 계획의 전체 비용을 계산하는 역할을 해요. 비용을 계산하기 위해 세 가지 척도를 사용해요.',
    estimatorRows: [
      ['선택도 (Selectivity)', '전체 행 중 쿼리가 골라내는 행의 비율이에요. 0은 "아무 행도 없음", 1은 "모든 행"을 뜻해요. WHERE last_name LIKE \'A%\' 같은 조건에 연결되며, 0에 가까울수록 필터 효과가 강한 거예요. 실행 계획에는 직접 표시되지 않는 내부 계산이에요.'],
      ['카디널리티 (Cardinality)', '실행 계획의 각 단계에서 몇 개의 행이 나올지 예상한 수예요. 실행 계획의 Rows 컬럼에 표시돼요. 이 숫자가 틀리면 최적이 아닌 계획이 선택될 수 있어요.'],
      ['비용 (Cost)', 'I/O, CPU, 메모리 등 자원 사용량을 하나의 숫자로 나타낸 내부 단위예요. 같은 쿼리의 계획들을 비교하는 데만 쓰이고, 실제 실행 시간과 1:1로 대응하진 않아요.'],
    ],
    estimatorNote:
      '비용은 순전히 계획끼리 비교하기 위한 내부 숫자예요. 직접 바꾸거나 튜닝할 수 없고, 비용이 낮다고 무조건 빠르다는 보장도 없어요. 하지만 상대적인 가이드로는 충분히 유용해요.',
    selectivityDesc:
      '선택도는 전체 행 중 조건에 맞는 행의 비율을 0.0~1.0 사이 숫자로 표현해요. 0.0이면 아무 행도 없고, 1.0이면 모든 행이 해당돼요.',
    selectivityStatsRows: [
      ['통계 없음', 'OPTIMIZER_DYNAMIC_SAMPLING 설정에 따라 동적으로 통계를 샘플링하거나, 내부 기본값을 사용해요.'],
      ['통계 있음', '통계가 있으면 Estimator가 이걸 활용해요. 예를 들어 last_name 고유 값이 150개라면, last_name = \'Smith\' 조건의 선택도는 1/150 = 약 0.007이에요.'],
    ],
    cardinalityDesc:
      '카디널리티는 각 실행 단계에서 나올 것으로 예상하는 행의 수예요. 옵티마이저는 테이블/컬럼 통계와 복잡한 수식을 써서 이 값을 추정해요.',
    cardinalitySql: `-- 카디널리티 추정 예시
SELECT first_name, last_name
FROM   employees
WHERE  salary = '10200';

-- employees 테이블 전체 행 = 107개
-- salary 컬럼의 고유 값 수 = 58개
-- 카디널리티 추정 = 107 ÷ 58 = 1.84 → 약 2행`,
    costDesc:
      '비용 모델은 쿼리가 쓸 것으로 예상하는 자원을 하나의 숫자로 표현해요.',
    costItems: [
      '시스템 자원 — I/O, CPU, 메모리 예상 사용량',
      '반환될 것으로 예상하는 행 수 (카디널리티)',
      '처음 다뤄야 하는 데이터 크기',
      '데이터 분포',
      '어떤 인덱스나 구조를 쓸 수 있는지',
    ],
    planGenTitle: 'Plan Generator',
    planGenDesc:
      'Plan Generator는 "이렇게 해보면 어때? 저렇게 해보면 어때?" 하면서 다양한 액세스 경로, 조인 방법, 조인 순서의 조합을 탐색해요. 그중에서 비용이 가장 낮은 계획을 최종 실행 계획으로 골라요.',
    planGenTraceSql: `-- 옵티마이저 트레이스 — 조인 순서 탐색 과정이 보여요
GENERAL PLANS
Considering cardinality-based initial join order.
Join order[1]:  DEPARTMENTS[D]#0  EMPLOYEES[E]#1

Now joining: EMPLOYEES[E]#1
NL Join   Best NL cost: 13.17
SM Join   SM cost: 6.08
HA Join   HA cost: 4.57
Best:: JoinMethod: Hash
       Cost: 4.57  Degree: 1  Card: 106.00

Join order[2]:  EMPLOYEES[E]#1  DEPARTMENTS[D]#0
...
HA Join   HA cost: 4.58
Join order aborted: cost > best plan cost`,
    planGenNote:
      '트레이스를 보면 옵티마이저가 먼저 DEPARTMENTS를 외부(Outer) 테이블로 놓고 Nested Loop(13.17), Sort Merge(6.08), Hash Join(4.57) 세 가지를 비교한 뒤 Hash Join을 선택해요. 그다음엔 순서를 바꿔서 EMPLOYEES를 먼저 놓아봤더니 비용이 더 높아서 포기하는 거예요.',
    execPlanTitle: '실행 계획 (Execution Plans)',
    execPlanDesc:
      '실행 계획은 Oracle이 이 SQL을 어떻게 실행하겠다고 제안하는 로드맵이에요. 어떤 테이블에 어떤 방식으로 접근하고, 어떤 순서로 조인하고, 어디서 필터링할지 등 모든 단계가 담겨 있어요.',
    queryBlockTitle: '쿼리 블록 (Query Blocks)',
    queryBlockDesc:
      'SQL 안의 각 SELECT 블록은 내부적으로 쿼리 블록(query block)이라는 단위로 나뉘어요. 서브쿼리나 병합되지 않은 뷰도 각각 별도의 쿼리 블록이 돼요.',
    queryBlockSql: `-- 이 SQL에는 쿼리 블록이 두 개 있어요
-- 바깥 SELECT = 외부 쿼리 블록
-- 괄호 안 SELECT = 내부(서브쿼리) 블록
SELECT first_name, last_name
FROM   hr.employees
WHERE  department_id
IN     (SELECT department_id
        FROM   hr.departments
        WHERE  location_id = 1800);`,
    subplanTitle: '쿼리 서브플랜 (Query Subplans)',
    subplanDesc:
      '각 쿼리 블록에 대해 옵티마이저가 개별 서브플랜을 만들어요. 안쪽 블록부터 아래→위 순서로 최적화해요.',
    analogyTitle: '옵티마이저를 쉽게 이해하는 비유',
    analogyDesc:
      '자전거로 A에서 B까지 가는 가장 빠른 길을 찾는 앱이 있다고 해봐요. "A에서 B까지 최단 경로를 알려줘"라는 요청이 SQL이고, 앱이 여러 경로의 거리와 경사를 비교해서 최적 경로를 알려주는 게 바로 옵티마이저가 하는 일이에요.',
    autoTuningTitle: 'Automatic Tuning Optimizer',
    autoTuningDesc:
      '옵티마이저는 어떻게 호출되느냐에 따라 동작이 달라져요.',
    autoTuningRows: [
      ['일반 최적화 (Normal Optimization)', '평소에 SQL을 실행할 때 쓰는 모드예요. 수백 밀리초 이내의 빡빡한 시간 제약 안에서 최적 계획을 빠르게 찾아요.'],
      ['SQL Tuning Advisor 최적화', 'SQL Tuning Advisor가 옵티마이저를 부를 때 Automatic Tuning Optimizer라고 해요. 시간 제약 없이 더 깊이 분석하고, 실행 계획 대신 "이렇게 개선하면 얼마나 빨라질 것 같다"는 권고안을 내줘요.'],
    ],
  },
  en: {
    title: 'Optimizer Components',
    subtitle:
      'The query optimizer (called simply the optimizer) is built-in database software that determines the most efficient method for a SQL statement to access requested data.',
    purposeTitle: 'Purpose of the Query Optimizer',
    purposeDesc:
      'The optimizer attempts to generate the most optimal execution plan for a SQL statement. The optimizer chooses the plan with the lowest cost among all considered candidate plans. The optimizer uses available statistics to calculate cost. For a specific query in a given environment, the cost computation accounts for factors of query execution such as I/O, CPU, and communication.',
    purposeNote:
      'For example, a query might request information about employees who are managers. If the optimizer statistics indicate that 80% of employees are managers, then the optimizer may decide that a full table scan is most efficient. However, if statistics indicate that very few employees are managers, then reading an index followed by a table access by rowid may be more efficient than a full table scan.',
    cboTitle: 'Cost-Based Optimization',
    cboDesc:
      'SQL is a nonprocedural language, so the optimizer is free to merge, reorganize, and process in any order. The database optimizes each SQL statement based on statistics collected about the accessed data. The optimizer determines the optimal plan for a SQL statement by examining multiple access methods, such as full table scan or index scans, different join methods such as nested loops and hash joins, different join orders, and possible transformations.',
    cboNote:
      'The optimizer may not make the same decisions from one version of Oracle Database to the next. In recent versions, the optimizer might make different decisions because better information is available and more optimizer transformations are possible.',
    optsTitle: 'The optimizer contains three components',
    optsRows: [
      ['Phase 1', 'Query Transformer', 'Determines whether it is helpful to change the form of the query so that the optimizer can generate a better execution plan.'],
      ['Phase 2', 'Estimator', 'Estimates the cost of each plan based on statistics in the data dictionary.'],
      ['Phase 3', 'Plan Generator', 'Compares the costs of plans and chooses the lowest-cost plan, known as the execution plan, to pass to the row source generator.'],
    ],
    qtTitle: 'Query Transformer',
    qtDesc:
      'For some statements, the query transformer determines whether it is advantageous to rewrite the original SQL statement into a semantically equivalent SQL statement with a lower cost. When a viable alternative exists, the database calculates the cost of the alternatives separately and chooses the lowest-cost alternative.',
    estimatorTitle: 'Estimator',
    estimatorDesc:
      'The estimator is the component of the optimizer that determines the overall cost of a given execution plan. The estimator uses three different measures to determine cost:',
    estimatorRows: [
      ['Selectivity', 'The percentage of rows in the row set that the query selects, with 0 meaning no rows and 1 meaning all rows. Selectivity is tied to a query predicate. A predicate becomes more selective as the selectivity value approaches 0 and less selective as it approaches 1.'],
      ['Cardinality', 'The number of rows returned by each operation in an execution plan. This input is crucial to obtaining an optimal plan. The Rows column in an execution plan shows the estimated cardinality.'],
      ['Cost', 'A measure representing units of work or resource used. The query optimizer uses disk I/O, CPU usage, and memory usage as units of work.'],
    ],
    estimatorNote:
      'The cost is an internal measure that the optimizer uses to compare different plans for the same query. You cannot tune or change cost. The execution time is a function of the cost, but cost does not equate directly to time.',
    selectivityDesc:
      'The selectivity represents a fraction of rows from a row set. Selectivity ranges from 0.0 to 1.0. A selectivity of 0.0 means no rows are selected, whereas 1.0 means all rows are selected.',
    selectivityStatsRows: [
      ['Statistics not available', 'Depending on the value of the OPTIMIZER_DYNAMIC_SAMPLING parameter, the optimizer uses dynamic statistics or an internal default value.'],
      ['Statistics available', 'When statistics are available, the estimator uses them to estimate selectivity. For an equality predicate last_name = \'Smith\' with 150 distinct values, selectivity = 1/150 = .006.'],
    ],
    cardinalityDesc:
      'The cardinality is the number of rows returned by each operation in an execution plan. The optimizer determines cardinality based on a complex set of formulas that use both table and column level statistics, or dynamic statistics, as input.',
    cardinalitySql: `-- Cardinality example
SELECT first_name, last_name
FROM   employees
WHERE  salary='10200';

-- The employees table contains 107 rows
-- The number of distinct values in the salary column is 58
-- Cardinality estimate = 107 / 58 = 1.84 ≈ 2`,
    costDesc:
      'The optimizer cost model accounts for the machine resources that a query is predicted to use. The cost is an internal numeric measure that represents the estimated resource usage for a plan.',
    costItems: [
      'System resources — includes estimated I/O, CPU, and memory',
      'Estimated number of rows returned (cardinality)',
      'Size of the initial data sets',
      'Distribution of the data',
      'Access structures',
    ],
    planGenTitle: 'Plan Generator',
    planGenDesc:
      'The plan generator explores various plans for a query block by trying out different access paths, join methods, and join orders. Many plans are possible because of the various combinations that the database can use to produce the same result. The optimizer picks the plan with the lowest cost.',
    planGenTraceSql: `-- Optimizer trace file snippet (join order exploration)
GENERAL PLANS
Considering cardinality-based initial join order.
Join order[1]:  DEPARTMENTS[D]#0  EMPLOYEES[E]#1

Now joining: EMPLOYEES[E]#1
NL Join   Best NL cost: 13.17
SM Join   SM cost: 6.08
HA Join   HA cost: 4.57
Best:: JoinMethod: Hash
       Cost: 4.57  Degree: 1  Card: 106.00

Join order[2]:  EMPLOYEES[E]#1  DEPARTMENTS[D]#0
...
HA Join   HA cost: 4.58
Join order aborted: cost > best plan cost`,
    planGenNote:
      'The trace file shows the optimizer first trying DEPARTMENTS as the outer table in the join. The optimizer calculates the cost for three different join methods: nested loops join (NL), sort merge (SM), and hash join (HA). The optimizer picks the hash join as the most efficient method. It then tries a different join order using EMPLOYEES as the outer table, but this costs more, so it is abandoned.',
    execPlanTitle: 'Execution Plans',
    execPlanDesc:
      'An execution plan describes a recommended method of execution for a SQL statement. The plan shows the combination of the steps Oracle Database uses to execute a SQL statement.',
    queryBlockTitle: 'Query Blocks',
    queryBlockDesc:
      'The input to the optimizer is a parsed representation of a SQL statement. Each SELECT block in the original SQL statement is represented internally by a query block. A query block can be a top-level statement, subquery, or unmerged view.',
    queryBlockSql: `-- Query Blocks example (Example 4-1)
SELECT first_name, last_name
FROM   hr.employees
WHERE  department_id
IN     (SELECT department_id
        FROM   hr.departments
        WHERE  location_id = 1800);`,
    subplanTitle: 'Query Subplans',
    subplanDesc:
      'For each query block, the optimizer generates a query subplan. The database optimizes query blocks separately from the bottom up. Thus, the database optimizes the innermost query block first and generates a subplan for it, and then generates the outer query block representing the entire query.',
    analogyTitle: 'Analogy for the Optimizer',
    analogyDesc:
      "One analogy for the optimizer is an online trip advisor. A cyclist wants to know the most efficient bicycle route from point A to point B. A query is like the directive 'I need the most efficient route from point A to point B.' The trip advisor uses an internal algorithm to determine the most efficient route.",
    autoTuningTitle: 'About Automatic Tuning Optimizer',
    autoTuningDesc:
      'The optimizer performs different operations depending on how it is invoked. The database provides the following types of optimization:',
    autoTuningRows: [
      ['Normal Optimization', 'The optimizer compiles the SQL and generates an execution plan. The normal mode generates a reasonable plan for most SQL statements. Under normal mode, the optimizer operates with strict time constraints, usually a fraction of a second, during which it must find an optimal plan.'],
      ['SQL Tuning Advisor Optimization', 'When SQL Tuning Advisor invokes the optimizer, the optimizer is known as Automatic Tuning Optimizer. In this case, the optimizer performs additional analysis to further improve the plan produced in normal mode.'],
    ],
  },
}

export function ComponentsSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayersIntersect size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.purposeTitle}</SectionTitle>
      <Prose>{t.purposeDesc}</Prose>
      <div className="mt-4">
        <InfoBox variant="note">{t.purposeNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.cboTitle}</SectionTitle>
      <Prose>{t.cboDesc}</Prose>
      <div className="mt-4">
        <InfoBox variant="tip">{t.cboNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.optsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['단계', '구성 요소', '설명'] : ['Phase', 'Component', 'Description']}
        rows={t.optsRows}
      />

      <SectionTitle>{t.qtTitle}</SectionTitle>
      <Prose>{t.qtDesc}</Prose>

      <SectionTitle>{t.estimatorTitle}</SectionTitle>
      <Prose>{t.estimatorDesc}</Prose>
      <Table
        headers={isKo ? ['척도', '설명'] : ['Measure', 'Description']}
        rows={t.estimatorRows}
      />
      <div className="mt-4">
        <InfoBox variant="note">{t.estimatorNote}</InfoBox>
      </div>

      <AccordionSection title={isKo ? '선택도 상세 (Selectivity)' : 'Selectivity — Details'}>
        <Prose>{t.selectivityDesc}</Prose>
        <Table
          headers={isKo ? ['통계 여부', '선택도 추정 방법'] : ['Statistics', 'How Selectivity Is Estimated']}
          rows={t.selectivityStatsRows}
        />
      </AccordionSection>

      <AccordionSection title={isKo ? '카디널리티 상세 (Cardinality)' : 'Cardinality — Details'}>
        <Prose>{t.cardinalityDesc}</Prose>
        <div className="mt-4">
          <SqlBlock sql={t.cardinalitySql} />
        </div>
      </AccordionSection>

      <AccordionSection title={isKo ? '비용 상세 (Cost)' : 'Cost — Details'}>
        <Prose>{t.costDesc}</Prose>
        <ul className="mt-2 mb-4 space-y-1.5 pl-4">
          {t.costItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
              {item}
            </li>
          ))}
        </ul>
      </AccordionSection>

      <Divider />

      <SectionTitle>{t.planGenTitle}</SectionTitle>
      <Prose>{t.planGenDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.planGenTraceSql} />
      </div>
      <div className="mt-4">
        <InfoBox variant="note">{t.planGenNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.execPlanTitle}</SectionTitle>
      <Prose>{t.execPlanDesc}</Prose>

      <SubTitle>{t.queryBlockTitle}</SubTitle>
      <Prose>{t.queryBlockDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.queryBlockSql} />
      </div>

      <SubTitle>{t.subplanTitle}</SubTitle>
      <Prose>{t.subplanDesc}</Prose>

      <SubTitle>{t.analogyTitle}</SubTitle>
      <Prose>{t.analogyDesc}</Prose>

      <Divider />

      <SectionTitle>{t.autoTuningTitle}</SectionTitle>
      <Prose>{t.autoTuningDesc}</Prose>
      <Table
        headers={isKo ? ['유형', '설명'] : ['Type', 'Description']}
        rows={t.autoTuningRows}
      />
    </PageContainer>
  )
}
