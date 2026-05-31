import { IconRefresh } from '@tabler/icons-react'
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
    title: 'Adaptive Query Optimization',
    subtitle:
      '옵티마이저가 항상 완벽한 계획을 세울 수는 없어요. 통계가 오래됐거나 쿼리가 복잡하면 카디널리티를 잘못 추정해서 느린 계획을 선택할 수 있거든요. Adaptive Query Optimization(적응형 쿼리 최적화)은 이런 문제를 실행 중에 스스로 감지하고 고치는 기능이에요.',
    adaptivePlansTitle: 'Adaptive Query Plans',
    adaptivePlansDesc:
      'Adaptive query plan(적응형 쿼리 계획)은 실행이 시작된 뒤에도 계획을 바꿀 수 있게 해줘요. 처음엔 기본 계획(default plan)으로 시작하다가, 실제 데이터 흐름을 보면서 더 좋은 방법이 있으면 그쪽으로 전환할 수 있어요.',
    dynamicPlanTitle: '동적 계획 (Dynamic Plans)',
    dynamicPlanDesc:
      '적응형 계획은 내부적으로 여러 서브플랜(subplan) 그룹을 가진 동적 계획(dynamic plan)으로 표현돼요. 예를 들어 처음엔 Nested Loops Join으로 시작했다가 실행 중에 Hash Join으로 전환될 수 있어요.',
    statsCollectorTitle: '옵티마이저 통계 수집기 (Optimizer Statistics Collector)',
    statsCollectorDesc:
      '계획의 핵심 위치에 통계 수집기(statistics collector)라는 행 소스가 삽입돼요. 이 수집기가 실행 중에 실제 카디널리티와 히스토그램 정보를 수집하고, 그 결과를 바탕으로 옵티마이저가 어떤 서브플랜을 쓸지 최종 결정을 내려요.',
    adaptivePlanWorkTitle: '적응형 쿼리 계획이 작동하는 방식',
    adaptivePlanWorkDesc:
      '처음 실행할 때는 기본 계획을 쓰면서 데이터를 관찰해요. 그 결과를 바탕으로 적응형 계획(adaptive plan)을 만들어두고, 이후 실행부터는 이 계획을 활용해요.',
    adaptivePlanSteps: [
      '기본 계획으로 실행을 시작해요.',
      '통계 수집기가 실행 중에 실제 행 수 등을 모니터링하며 일부 행을 버퍼링해요.',
      '수집된 통계를 보고 옵티마이저가 최적의 서브플랜을 골라요.',
      '수집기가 버퍼링을 멈추고 행을 그냥 통과시켜요.',
      '선택된 적응형 계획을 자식 커서(child cursor)에 저장해두고 다음 실행부터 재사용해요.',
    ],
    adaptivePlanNote:
      '이후 실행에서는 저장된 적응형 계획을 계속 써요. 다만 Shared Pool에서 만료되거나, 통계 피드백 같은 다른 기능이 현재 계획을 무효화하면 다시 선택 과정이 일어나요.',
    joinExampleTitle: '조인 방법 전환 예시 (Adaptive Query Plans: Join Method Example)',
    joinExampleDesc:
      '아래 예시에서 옵티마이저가 처음엔 Nested Loops를 선택했다가, 실행 중에 실제 행 수를 보고 Hash Join으로 바꾸는 과정을 볼 수 있어요.',
    joinExampleSql: `SELECT product_name
FROM   order_items o, prod_info p
WHERE  o.unit_price = 15
AND    quantity > 1
AND    p.product_id = o.product_id

-- 적응형 쿼리 계획 (ADAPTIVE 포맷으로 확인)
SELECT * FROM TABLE(DBMS_XPLAN.display_cursor(FORMAT => 'ADAPTIVE'));

-----------------------------------------------------------------------------
| Id | Operation                     | Name     |Rows|Bytes|Cost (%CPU)|Time|
-----------------------------------------------------------------------------
|   0| SELECT STATEMENT              |          |  | |7(100)|        |
| * 1|  HASH JOIN                    |          |4 |128 | 7 (0)|00:00:01|
|-  2|   NESTED LOOPS                |          |4 |128 | 7 (0)|00:00:01|
|-  3|    NESTED LOOPS               |          |4 |128 | 7 (0)|00:00:01|
|-  4|     STATISTICS COLLECTOR      |          |  |    |      |        |
| * 5|      TABLE ACCESS FULL        |ORDER_ITEMS|4 | 48 | 3 (0)|00:00:01|
|-* 6|     INDEX UNIQUE SCAN         |PROD_INFO_PK|1|   | 0 (0)|        |
|-  7|    TABLE ACCESS BY INDEX ROWID|PROD_INFO  |1 | 20 | 1 (0)|00:00:01|
|   8|   TABLE ACCESS FULL           |PROD_INFO  |1 | 20 | 1 (0)|00:00:01|
-----------------------------------------------------------------------------
Note: - this is an adaptive plan (rows marked '-' are inactive)`,
    joinExampleNote:
      'order_items에서 나오는 행이 적으면 Nested Loops가 유리하지만, 많으면 Hash Join이 더 빠를 수 있어요. 통계 수집기가 임계값까지 행을 버퍼링해 보고, 예상보다 많으면 Hash Join으로 전환해요.',
    parallelDistTitle: '병렬 분배 방법 (Adaptive Query Plans: Parallel Distribution Methods)',
    parallelDistDesc:
      '병렬 실행에서는 데이터를 여러 서버로 재분배해야 해요. 하이브리드 해시 분배 기법(hybrid hash distribution)은 최종 분배 방법을 실행 시점까지 결정하지 않는 적응형 방식이에요.',
    bitmapPruningTitle: 'Bitmap Index Pruning',
    bitmapPruningDesc:
      '스타 변환(star transformation) 계획에서 실제로 필터 효과가 없는 bitmap 인덱스를 쓰면 오히려 느려질 수 있어요. 적응형 계획은 그런 인덱스를 자동으로 제외해줘요.',
    adaptivePlanEnabledTitle: '적응형 쿼리 계획이 켜지는 조건',
    adaptivePlanEnabledItems: [
      'OPTIMIZER_ADAPTIVE_PLANS = TRUE (기본값이에요)',
      'OPTIMIZER_FEATURES_ENABLE = 12.1.0.1 이상',
      'OPTIMIZER_ADAPTIVE_REPORTING_ONLY = FALSE (기본값이에요)',
    ],
    adaptivePlanControls: [
      'Nested Loops ↔ Hash Join 전환',
      'Star Transformation Bitmap Index 가지치기',
      '적응형 병렬 분배 방법',
    ],
    adaptiveStatsTitle: 'Adaptive Statistics (적응형 통계)',
    adaptiveStatsDesc:
      '쿼리 조건이 너무 복잡해서 기본 통계만으론 카디널리티를 제대로 추정하기 어려울 때, 적응형 통계(adaptive statistics)를 활성화하면 도움이 돼요. 기본적으로는 꺼져 있어요(OPTIMIZER_ADAPTIVE_STATISTICS = false).',
    dynStatsTitle: '동적 통계 (Dynamic Statistics)',
    dynStatsDesc:
      '동적 통계는 SQL이 컴파일될 때 테이블 블록 일부를 무작위로 샘플링해서 카디널리티를 그 자리에서 추정하는 방법이에요. 기존 통계가 충분하지 않다고 판단할 때 옵티마이저가 자동으로 사용해요.',
    reoptTitle: '자동 재최적화 (Automatic Reoptimization)',
    reoptDesc:
      'SQL이 처음 실행된 후 "내가 예상한 행 수와 실제 행 수가 많이 다르네?" 하고 발견하면, 다음 실행부터 수정된 추정치로 다시 계획을 세워요. 이게 자동 재최적화예요.',
    statsFeedbackTitle: '통계 피드백 (Statistics Feedback)',
    statsFeedbackDesc:
      '통계 피드백(statistics feedback, 예전 이름: cardinality feedback)은 같은 쿼리를 반복 실행할 때 카디널리티 오추정을 자동으로 보정하는 기능이에요.',
    statsFeedbackSteps: [
      '처음 실행할 때 옵티마이저가 실행 계획을 만들어요. 통계가 없거나, 조건이 복잡하거나, 선택도 계산이 어려우면 통계 피드백 모니터링이 켜져요.',
      '실행이 끝나면 예상 카디널리티와 실제 카디널리티를 비교해요. 차이가 크면 수정된 추정치를 저장해둬요.',
      '같은 쿼리가 다시 실행되면 기존 추정 대신 수정된 추정치를 써서 더 좋은 계획을 찾아요.',
    ],
    perfFeedbackTitle: '성능 피드백 (Performance Feedback)',
    perfFeedbackDesc:
      'PARALLEL_DEGREE_POLICY가 ADAPTIVE로 설정된 상태에서 같은 SQL이 반복 실행되면, 실제로 쓰인 병렬 처리 정도(degree of parallelism)를 바탕으로 다음 실행의 병렬도를 자동으로 개선해줘요.',
    sqlPlanDirectiveTitle: 'SQL Plan Directives',
    sqlPlanDirectiveDesc:
      'SQL Plan Directive는 "이 조건절에서 나는 카디널리티를 잘못 추정하고 있어"라고 옵티마이저 스스로 메모해두는 장치예요. 동시에 DBMS_STATS에게 "다음에 통계 수집할 때 이 부분을 더 정확히 봐줘"라고 알려줘요.',
    adaptiveStatsEnabledTitle: '적응형 통계가 켜지는 조건',
    adaptiveStatsEnabledItems: [
      'OPTIMIZER_ADAPTIVE_STATISTICS = TRUE (기본값은 FALSE예요)',
      'OPTIMIZER_FEATURES_ENABLE = 12.1.0.1 이상',
    ],
    adaptiveStatsControls: [
      'SQL Plan Directives',
      '조인 카디널리티 통계 피드백',
      '적응형 동적 샘플링 (Adaptive Dynamic Sampling)',
    ],
    adaptiveStatsNote:
      'OPTIMIZER_ADAPTIVE_STATISTICS를 FALSE로 설정해도, 단일 테이블 카디널리티에 대한 통계 피드백은 계속 작동해요.',
    controlsLabel: '적응형 계획이 관리하는 최적화 목록이에요:',
    statsControlsLabel: '적응형 통계(TRUE)로 켜지는 기능들이에요:',
  },
  en: {
    title: 'Adaptive Query Optimization',
    subtitle:
      'In Oracle Database, adaptive query optimization enables the optimizer to make run-time adjustments to execution plans and discover additional information that can lead to better statistics. Adaptive optimization is helpful when existing statistics are not sufficient to generate an optimal plan.',
    adaptivePlansTitle: 'Adaptive Query Plans',
    adaptivePlansDesc:
      'An adaptive query plan enables the optimizer to make a plan decision for a statement during execution. Adaptive query plans are useful because the optimizer occasionally picks a suboptimal default plan because of a cardinality misestimate. The ability of the optimizer to pick the best plan at run time based on actual execution statistics results in a more optimal final plan.',
    dynamicPlanTitle: 'Dynamic Plans',
    dynamicPlanDesc:
      'To change plans at runtime, adaptive query plans use a dynamic plan, which is represented as a set of subplan groups. A subplan is a portion of a plan that the optimizer can switch to as an alternative at run time. For example, a nested loops join could switch to a hash join during execution.',
    statsCollectorTitle: 'Optimizer Statistics Collector',
    statsCollectorDesc:
      'An optimizer statistics collector is a row source inserted into a plan at key points to collect run-time statistics relating to cardinality and histograms. These statistics help the optimizer make a final decision between multiple subplans. The collector also supports optional buffering up to an internal threshold.',
    adaptivePlanWorkTitle: 'How Adaptive Query Plans Work',
    adaptivePlanWorkDesc:
      'For the first execution of a statement, the optimizer uses the default plan, and then stores an adaptive plan. The database uses the adaptive plan for subsequent executions unless specific conditions are met.',
    adaptivePlanSteps: [
      'The database begins executing the statement using the default plan.',
      'The statistics collector gathers information about the in-progress execution, and buffers some rows received by the subplan.',
      'Based on the statistics gathered by the collector, the optimizer chooses a subplan.',
      'The collector stops collecting statistics and buffering rows, permitting rows to pass through instead.',
      'The database stores the adaptive plan in the child cursor, so that the next execution of the statement can use it.',
    ],
    adaptivePlanNote:
      'On subsequent executions of the child cursor, the optimizer continues to use the same adaptive plan unless the current plan ages out of the shared pool, or a different optimizer feature (for example, adaptive cursor sharing or statistics feedback) invalidates the current plan.',
    joinExampleTitle: 'Adaptive Query Plans: Join Method Example',
    joinExampleDesc:
      'This example shows how the optimizer can choose a different plan based on information collected at runtime.',
    joinExampleSql: `SELECT product_name
FROM   order_items o, prod_info p
WHERE  o.unit_price = 15
AND    quantity > 1
AND    p.product_id = o.product_id

-- Adaptive query plan (viewed with ADAPTIVE format)
SELECT * FROM TABLE(DBMS_XPLAN.display_cursor(FORMAT => 'ADAPTIVE'));

-----------------------------------------------------------------------------
| Id | Operation                     | Name     |Rows|Bytes|Cost (%CPU)|Time|
-----------------------------------------------------------------------------
|   0| SELECT STATEMENT              |          |  | |7(100)|        |
| * 1|  HASH JOIN                    |          |4 |128 | 7 (0)|00:00:01|
|-  2|   NESTED LOOPS                |          |4 |128 | 7 (0)|00:00:01|
|-  3|    NESTED LOOPS               |          |4 |128 | 7 (0)|00:00:01|
|-  4|     STATISTICS COLLECTOR      |          |  |    |      |        |
| * 5|      TABLE ACCESS FULL        |ORDER_ITEMS|4 | 48 | 3 (0)|00:00:01|
|-* 6|     INDEX UNIQUE SCAN         |PROD_INFO_PK|1|   | 0 (0)|        |
|-  7|    TABLE ACCESS BY INDEX ROWID|PROD_INFO  |1 | 20 | 1 (0)|00:00:01|
|   8|   TABLE ACCESS FULL           |PROD_INFO  |1 | 20 | 1 (0)|00:00:01|
-----------------------------------------------------------------------------
Note: - this is an adaptive plan (rows marked '-' are inactive)`,
    joinExampleNote:
      'A nested loops join is preferable if the database can avoid scanning a significant portion of prod_info. If few rows are filtered, however, scanning the right table in a hash join is preferable. The statistics collector buffers enough rows from order_items to determine which join method to use. If the row count is above the threshold, the optimizer chooses a hash join for the final plan.',
    parallelDistTitle: 'Adaptive Query Plans: Parallel Distribution Methods',
    parallelDistDesc:
      'Typically, parallel execution requires data redistribution to perform operations such as parallel sorts, aggregations, and joins. The hybrid hash distribution technique is an adaptive parallel data distribution that does not decide the final data distribution method until execution time.',
    bitmapPruningTitle: 'Adaptive Query Plans: Bitmap Index Pruning',
    bitmapPruningDesc:
      'Adaptive plans prune indexes that do not significantly reduce the number of matched rows. When the optimizer generates a star transformation plan, adaptive plans solve this problem by not using indexes that degrade performance.',
    adaptivePlanEnabledTitle: 'When Adaptive Query Plans Are Enabled',
    adaptivePlanEnabledItems: [
      'OPTIMIZER_ADAPTIVE_PLANS is TRUE (default)',
      'OPTIMIZER_FEATURES_ENABLE is 12.1.0.1 or later',
      'OPTIMIZER_ADAPTIVE_REPORTING_ONLY is FALSE (default)',
    ],
    adaptivePlanControls: [
      'Nested loops and hash join selection',
      'Star transformation bitmap pruning',
      'Adaptive parallel distribution method',
    ],
    adaptiveStatsTitle: 'Adaptive Statistics',
    adaptiveStatsDesc:
      'The optimizer can use adaptive statistics when query predicates are too complex to rely on base table statistics alone. By default, adaptive statistics are disabled (OPTIMIZER_ADAPTIVE_STATISTICS is false).',
    dynStatsTitle: 'Dynamic Statistics',
    dynStatsDesc:
      'Dynamic statistics are an optimization technique in which the database executes a recursive SQL statement to scan a small random sample of a table\'s blocks to estimate predicate cardinalities. During SQL compilation, the optimizer decides whether to use dynamic statistics by considering whether available statistics are sufficient to generate an optimal plan.',
    reoptTitle: 'Automatic Reoptimization',
    reoptDesc:
      'In automatic reoptimization, the optimizer changes a plan on subsequent executions after the initial execution. At the end of the first execution of a SQL statement, the optimizer uses the information gathered during execution to determine whether automatic reoptimization has a cost benefit.',
    statsFeedbackTitle: 'Statistics Feedback (Reoptimization)',
    statsFeedbackDesc:
      'A form of reoptimization known as statistics feedback (formerly known as cardinality feedback) automatically improves plans for repeated queries that have cardinality misestimates.',
    statsFeedbackSteps: [
      'During the first execution of a SQL statement, the optimizer generates an execution plan. The optimizer may enable monitoring for statistics feedback in cases such as: tables with no statistics, multiple conjunctive or disjunctive filter predicates on a table, predicates containing complex operators.',
      'At the end of the first execution, the optimizer compares its initial cardinality estimates to the actual number of rows returned. If estimates differ significantly from actual cardinalities, then the optimizer stores the correct estimates for subsequent use.',
      'If the query executes again, then the optimizer uses the corrected cardinality estimates instead of its usual estimates.',
    ],
    perfFeedbackTitle: 'Performance Feedback (Reoptimization)',
    perfFeedbackDesc:
      'Another form of reoptimization is performance feedback. This reoptimization helps improve the degree of parallelism automatically chosen for repeated SQL statements when PARALLEL_DEGREE_POLICY is set to ADAPTIVE.',
    sqlPlanDirectiveTitle: 'SQL Plan Directives',
    sqlPlanDirectiveDesc:
      'A SQL plan directive is additional information that the optimizer uses to generate a more optimal plan. The directive is a "note to self" by the optimizer that it is misestimating cardinalities of certain types of predicates, and also a reminder to DBMS_STATS to gather statistics needed to correct the misestimates in the future.',
    adaptiveStatsEnabledTitle: 'When Adaptive Statistics Are Enabled',
    adaptiveStatsEnabledItems: [
      'OPTIMIZER_ADAPTIVE_STATISTICS is TRUE (the default is FALSE)',
      'OPTIMIZER_FEATURES_ENABLE is 12.1.0.1 or later',
    ],
    adaptiveStatsControls: [
      'SQL plan directives',
      'Statistics feedback for join cardinality',
      'Adaptive dynamic sampling',
    ],
    adaptiveStatsNote:
      'Setting OPTIMIZER_ADAPTIVE_STATISTICS to FALSE preserves statistics feedback for single-table cardinality misestimates.',
    controlsLabel: 'Adaptive plans control the following optimizations:',
    statsControlsLabel: 'Setting OPTIMIZER_ADAPTIVE_STATISTICS to TRUE enables the following features:',
  },
}

export function AdaptiveSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconRefresh size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.adaptivePlansTitle}</SectionTitle>
      <Prose>{t.adaptivePlansDesc}</Prose>

      <SubTitle>{t.dynamicPlanTitle}</SubTitle>
      <Prose>{t.dynamicPlanDesc}</Prose>

      <SubTitle>{t.statsCollectorTitle}</SubTitle>
      <Prose>{t.statsCollectorDesc}</Prose>

      <Divider />

      <SectionTitle>{t.adaptivePlanWorkTitle}</SectionTitle>
      <Prose>{t.adaptivePlanWorkDesc}</Prose>
      <ol className="mt-3 mb-4 space-y-2 pl-4">
        {t.adaptivePlanSteps.map((step, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80">
            <span className="font-bold text-orange-600 mr-2">{i + 1}.</span>{step}
          </li>
        ))}
      </ol>
      <InfoBox variant="note">{t.adaptivePlanNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.joinExampleTitle}</SectionTitle>
      <Prose>{t.joinExampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.joinExampleSql} />
      </div>
      <div className="mt-4">
        <InfoBox variant="tip">{t.joinExampleNote}</InfoBox>
      </div>

      <AccordionSection title={t.parallelDistTitle}>
        <Prose>{t.parallelDistDesc}</Prose>
      </AccordionSection>

      <AccordionSection title={t.bitmapPruningTitle}>
        <Prose>{t.bitmapPruningDesc}</Prose>
      </AccordionSection>

      <Divider />

      <SectionTitle>{t.adaptivePlanEnabledTitle}</SectionTitle>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.adaptivePlanEnabledItems.map((item, i) => (
          <li key={i} className="font-mono text-sm text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>
      <Prose>{t.controlsLabel}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.adaptivePlanControls.map((item, i) => (
          <li key={i} className="text-sm text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <Divider />

      <SectionTitle>{t.adaptiveStatsTitle}</SectionTitle>
      <Prose>{t.adaptiveStatsDesc}</Prose>

      <SubTitle>{t.dynStatsTitle}</SubTitle>
      <Prose>{t.dynStatsDesc}</Prose>

      <SubTitle>{t.reoptTitle}</SubTitle>
      <Prose>{t.reoptDesc}</Prose>

      <AccordionSection title={t.statsFeedbackTitle}>
        <Prose>{t.statsFeedbackDesc}</Prose>
        <ol className="mt-3 mb-4 space-y-2 pl-4">
          {t.statsFeedbackSteps.map((step, i) => (
            <li key={i} className="text-sm leading-relaxed text-foreground/80">
              <span className="font-bold text-orange-600 mr-2">{i + 1}.</span>{step}
            </li>
          ))}
        </ol>
      </AccordionSection>

      <AccordionSection title={t.perfFeedbackTitle}>
        <Prose>{t.perfFeedbackDesc}</Prose>
      </AccordionSection>

      <AccordionSection title={t.sqlPlanDirectiveTitle}>
        <Prose>{t.sqlPlanDirectiveDesc}</Prose>
      </AccordionSection>

      <Divider />

      <SectionTitle>{t.adaptiveStatsEnabledTitle}</SectionTitle>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.adaptiveStatsEnabledItems.map((item, i) => (
          <li key={i} className="font-mono text-sm text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>
      <Prose>{t.statsControlsLabel}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.adaptiveStatsControls.map((item, i) => (
          <li key={i} className="text-sm text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <InfoBox variant="note">{t.adaptiveStatsNote}</InfoBox>
      </div>
    </PageContainer>
  )
}
