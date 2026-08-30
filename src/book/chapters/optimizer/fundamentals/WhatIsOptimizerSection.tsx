import { IconBolt, IconDatabase, IconLayersIntersect, IconMathFunction, IconSearch } from '@tabler/icons-react'
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
  ConceptGrid,
} from '../../shared'
import { SqlProcessingSection } from './sql-processing/SqlProcessingSection'
import { AdaptiveSection } from './adaptive/AdaptiveSection'
import { ApproxSection } from './approx/ApproxSection'
import { SpmSection } from './spm/SpmSection'

// ── Optimizer 3-component diagram ────────────────────────────────────────

function OptimizerComponentDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const input  = isKo ? 'SQL (파싱 완료)' : 'Parsed SQL'
  const output = isKo ? '최적 실행 계획' : 'Optimal Plan'

  const components = isKo
    ? [
        {
          phase: 'Phase 1',
          name: 'Query Transformer',
          color: 'var(--color-blue)', bg: 'var(--color-rail)', border: 'var(--color-blue)',
          desc: '"더 효율적인 형태로 쓸 수 있을까?" — 의미가 같지만 더 빠른 형태로 변환해요.',
        },
        {
          phase: 'Phase 2',
          name: 'Estimator',
          color: 'var(--color-amber)', bg: 'var(--color-rail)', border: 'var(--color-amber)',
          desc: '통계를 보고 선택도 · 카디널리티 · 비용을 숫자로 추정해요.',
        },
        {
          phase: 'Phase 3',
          name: 'Plan Generator',
          color: 'var(--color-purple)', bg: 'var(--color-paper-sunk)', border: 'var(--color-purple)',
          desc: '가능한 모든 조합(액세스 경로 · 조인 방법 · 조인 순서)을 탐색해 최저 비용 계획을 골라요.',
        },
      ]
    : [
        {
          phase: 'Phase 1',
          name: 'Query Transformer',
          color: 'var(--color-blue)', bg: 'var(--color-rail)', border: 'var(--color-blue)',
          desc: 'Rewrites SQL into a semantically equivalent but lower-cost form.',
        },
        {
          phase: 'Phase 2',
          name: 'Estimator',
          color: 'var(--color-amber)', bg: 'var(--color-rail)', border: 'var(--color-amber)',
          desc: 'Uses statistics to estimate selectivity, cardinality, and cost for each plan.',
        },
        {
          phase: 'Phase 3',
          name: 'Plan Generator',
          color: 'var(--color-purple)', bg: 'var(--color-paper-sunk)', border: 'var(--color-purple)',
          desc: 'Explores all combinations of access paths, join methods, and join orders — picks the lowest-cost plan.',
        },
      ]

  return (
    <div className="my-4 overflow-x-auto">
      <div className="flex min-w-[520px] items-stretch gap-3">
        {/* Input */}
        <div className="flex flex-col items-center justify-center rounded-panel border-2 border-line bg-paper-sunk px-4 py-3 text-center" style={{ minWidth: 100 }}>
          <IconDatabase size={18} className="mb-1 text-ink-2" />
          <span className="font-mono text-[10px] font-bold text-ink-2">{input}</span>
        </div>
        <div className="flex items-center text-lg font-bold text-ink-2/40">→</div>

        {/* Optimizer box */}
        <div className="flex flex-1 flex-col gap-2 rounded-panel border-2 border-amber/30 bg-amber/5 p-3">
          <p className="mb-1 font-mono text-[10px] font-bold text-amber uppercase tracking-wide text-center">
            {isKo ? '쿼리 옵티마이저' : 'Query Optimizer'}
          </p>
          {components.map((c, i) => (
            <div key={c.phase} className="flex items-start gap-3">
              <div
                className="flex min-w-[170px] flex-col rounded-card border-2 px-3 py-2"
                style={{ borderColor: c.border, backgroundColor: c.bg }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[9px] font-bold" style={{ color: c.color }}>{c.phase}</span>
                  <span className="font-mono text-xs font-bold text-ink/80">{c.name}</span>
                </div>
                <span className="font-mono text-[10px] leading-relaxed text-ink-2">{c.desc}</span>
              </div>
              {i < components.length - 1 && (
                <div className="flex items-center self-center text-ink-2/30">↓</div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center text-lg font-bold text-ink-2/40">→</div>
        {/* Output */}
        <div className="flex flex-col items-center justify-center rounded-panel border-2 border-green/30 bg-green/5 px-4 py-3 text-center" style={{ minWidth: 100 }}>
          <IconSearch size={18} className="mb-1 text-green" />
          <span className="font-mono text-[10px] font-bold text-green">{output}</span>
        </div>
      </div>
    </div>
  )
}

// ── Estimator measures diagram ────────────────────────────────────────────

function EstimatorDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const items = isKo
    ? [
        { label: '선택도\nSelectivity', desc: '조건에 맞는 행의 비율\n0.0 (없음) ~ 1.0 (전부)', color: 'var(--color-blue)', bg: 'var(--color-rail)', border: 'var(--color-blue)' },
        { label: '카디널리티\nCardinality', desc: '각 단계에서 예상되는\n반환 행 수 (Rows 컬럼)', color: 'var(--color-amber)', bg: 'var(--color-rail)', border: 'var(--color-amber)' },
        { label: '비용\nCost', desc: 'I/O · CPU · 메모리를\n하나의 숫자로 표현', color: 'var(--color-purple)', bg: 'var(--color-paper-sunk)', border: 'var(--color-purple)' },
      ]
    : [
        { label: 'Selectivity', desc: 'Fraction of rows matching\nthe predicate (0.0 ~ 1.0)', color: 'var(--color-blue)', bg: 'var(--color-rail)', border: 'var(--color-blue)' },
        { label: 'Cardinality', desc: 'Expected number of rows\nreturned per plan step', color: 'var(--color-amber)', bg: 'var(--color-rail)', border: 'var(--color-amber)' },
        { label: 'Cost', desc: 'I/O + CPU + memory\nas a single numeric unit', color: 'var(--color-purple)', bg: 'var(--color-paper-sunk)', border: 'var(--color-purple)' },
      ]

  return (
    <div className="my-4 flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex-1 rounded-panel border-2 p-4 text-center"
          style={{ borderColor: item.border, backgroundColor: item.bg, minWidth: 140 }}
        >
          <p className="font-mono text-xs font-bold whitespace-pre-line leading-snug" style={{ color: item.color }}>{item.label}</p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-2 whitespace-pre-line">{item.desc}</p>
        </div>
      ))}
      <div className="flex w-full items-center justify-center gap-2 rounded-panel border-2 border-green/30 bg-green/5 p-3">
        <span className="font-mono text-xs font-bold text-green">
          {isKo ? '→ 세 척도를 조합해 실행 계획 전체 비용을 산출해요' : '→ Combined to estimate the total cost of each execution plan'}
        </span>
      </div>
    </div>
  )
}

// ── Landing items ─────────────────────────────────────────────────────────

const LANDING_ITEMS = {
  ko: [
    { icon: <IconLayersIntersect size={20} stroke={1.5} />, title: 'SQL 처리 4단계', desc: 'Parsing → Optimization → Row Source Generation → Execution. 각 단계가 무엇을 하는지 이해하면 튜닝 방향이 보여요.' },
    { icon: <IconMathFunction size={20} stroke={1.5} />, title: '옵티마이저 3가지 구성 요소', desc: 'Query Transformer, Estimator, Plan Generator가 협력해 최저 비용 실행 계획을 도출해요.' },
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Adaptive Query Optimization', desc: '실행 중 수집한 통계로 계획을 실시간 조정해요. Adaptive Plans와 Adaptive Statistics로 구성돼요.' },
  ],
  en: [
    { icon: <IconLayersIntersect size={20} stroke={1.5} />, title: 'SQL Processing — 4 Stages', desc: 'Parsing → Optimization → Row Source Generation → Execution. Understanding each stage shows where to focus tuning.' },
    { icon: <IconMathFunction size={20} stroke={1.5} />, title: '3 Optimizer Components', desc: 'Query Transformer, Estimator, and Plan Generator collaborate to derive the lowest-cost execution plan.' },
    { icon: <IconBolt size={20} stroke={1.5} />, title: 'Adaptive Query Optimization', desc: 'Adjusts plans at runtime using statistics collected during execution — Adaptive Plans and Adaptive Statistics.' },
  ],
}

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: '옵티마이저란?',
    subtitle: 'Oracle의 쿼리 옵티마이저(query optimizer)는 SQL이 요청한 데이터에 가장 효율적으로 접근하는 방법을 결정하는 내장 소프트웨어예요. SQL을 실행할 때마다 자동으로 동작하며, 개발자가 따로 신경 쓰지 않아도 돼요.',
    overviewTitle: '옵티마이저가 하는 일',
    overviewDesc: '옵티마이저는 SQL을 실행할 때 가장 좋은 실행 계획(execution plan)을 골라요. 여러 후보 계획 중 비용(cost)이 가장 낮은 걸 선택하는데, 비용은 I/O · CPU · 메모리 같은 자원 사용량을 수치로 표현한 거예요.',
    overviewNote: '예를 들어 "관리자인 직원"을 찾는 쿼리가 있다고 해봐요. 직원의 80%가 관리자라면 Full Table Scan이 더 빠를 수 있어요. 하지만 관리자가 아주 소수라면 인덱스를 타고 rowid로 접근하는 게 훨씬 빠르겠죠. 옵티마이저 통계가 이 판단을 좌우해요.',
    cboTitle: '비용 기반 최적화 (CBO)',
    cboDesc: 'SQL은 "어떤 순서로 실행해라"라고 지시하지 않는 비절차적 언어예요. 그래서 옵티마이저가 Full Table Scan이나 Index Scan, Nested Loop나 Hash Join 같은 다양한 조합을 직접 따져보고, 통계를 바탕으로 가장 낮은 비용의 실행 계획을 골라요.',
    cboNote: 'Oracle 버전이 올라가면 같은 SQL에도 다른 계획이 나올 수 있어요. 더 정확한 통계와 더 많은 변환 기법이 추가되기 때문이에요.',
    componentsTitle: '옵티마이저 3가지 구성 요소',
    componentsDesc: '최적화 단계(Phase 2)는 세 가지 내부 컴포넌트가 순서대로 협력해서 처리해요.',
    qtTitle: 'Query Transformer',
    qtDesc: '"이 SQL, 다르게 써도 결과가 같은데 더 빠른 방법이 있지 않을까?" 하고 따져보는 게 Query Transformer의 역할이에요. 가능한 대안이 있으면 각각의 비용을 비교해서 더 싼 쪽을 선택해요.',
    estimatorTitle: 'Estimator',
    estimatorDesc: 'Estimator는 실행 계획의 전체 비용을 계산해요. 세 가지 척도를 사용해서 비용을 산출해요.',
    estimatorRows: [
      ['선택도 (Selectivity)', '전체 행 중 조건에 맞는 행의 비율이에요. 0이면 "아무 행도 없음", 1이면 "모든 행"을 뜻해요. 0에 가까울수록 필터 효과가 강한 거예요.'],
      ['카디널리티 (Cardinality)', '실행 계획의 각 단계에서 몇 개의 행이 나올지 예상한 수예요. 실행 계획의 Rows 컬럼에 표시돼요.'],
      ['비용 (Cost)', 'I/O, CPU, 메모리 등 자원 사용량을 하나의 숫자로 나타낸 내부 단위예요. 계획들을 서로 비교하는 데만 쓰여요.'],
    ],
    estimatorNote: '비용은 계획끼리 비교하는 내부 숫자예요. 직접 바꾸거나 튜닝할 수 없고, 실제 실행 시간과 1:1로 대응하지도 않아요.',
    selectivityDetails: [
      ['통계 없음', 'OPTIMIZER_DYNAMIC_SAMPLING 설정에 따라 동적으로 통계를 샘플링하거나, 내부 기본값을 사용해요.'],
      ['통계 있음', 'last_name 고유 값이 150개라면, last_name = \'Smith\' 조건의 선택도는 1/150 = 약 0.007이에요.'],
    ],
    cardinalitySql: `-- 카디널리티 추정 예시
SELECT first_name, last_name
FROM   employees
WHERE  salary = '10200';
-- employees 전체 행 = 107개
-- salary 고유 값 수  = 58개
-- 카디널리티 추정    = 107 ÷ 58 ≈ 2행`,
    planGenTitle: 'Plan Generator',
    planGenDesc: 'Plan Generator는 다양한 액세스 경로 · 조인 방법 · 조인 순서의 조합을 탐색하면서 비용이 가장 낮은 계획을 최종 실행 계획으로 골라요.',
    planGenTraceSql: `-- 옵티마이저 트레이스 — 조인 순서 탐색 과정
Join order[1]:  DEPARTMENTS[D]#0  EMPLOYEES[E]#1
  NL Join  Best NL cost: 13.17
  SM Join  SM cost:       6.08
  HA Join  HA cost:       4.57
  Best:: JoinMethod: Hash  Cost: 4.57

Join order[2]:  EMPLOYEES[E]#1  DEPARTMENTS[D]#0
  ...
  HA Join  HA cost: 4.58
  Join order aborted: cost > best plan cost`,
    planGenNote: 'DEPARTMENTS를 외부로 놓고 NL(13.17) · SM(6.08) · Hash(4.57)를 비교해 Hash를 선택한 뒤, 순서를 바꿔봤더니 비용(4.58)이 더 높아서 포기해요.',
    autoTuningTitle: 'Automatic Tuning Optimizer',
    autoTuningDesc: '옵티마이저는 어떻게 호출되느냐에 따라 동작이 달라져요.',
    autoTuningRows: [
      ['일반 최적화', '평소 SQL 실행 시 쓰는 모드예요. 수백 밀리초 이내의 시간 제약 안에서 최적 계획을 빠르게 찾아요.'],
      ['SQL Tuning Advisor', 'Automatic Tuning Optimizer라고도 해요. 시간 제약 없이 더 깊이 분석하고, 개선 권고안을 내줘요.'],
    ],
    conceptsTitle: '이어서 공부할 내용',
  },
  en: {
    title: 'What Is the Optimizer?',
    subtitle: "Oracle's query optimizer is built-in software that determines the most efficient method for a SQL statement to access the requested data. It runs automatically on every SQL execution — you don't need to invoke it manually.",
    overviewTitle: 'What the Optimizer Does',
    overviewDesc: 'The optimizer selects the best execution plan for a SQL statement. Among all candidate plans, it picks the one with the lowest cost — a numeric measure of I/O, CPU, and memory usage.',
    overviewNote: "For example, consider a query that finds employees who are managers. If 80% of employees are managers, a full table scan may be fastest. But if very few employees are managers, an index lookup followed by a rowid access is far cheaper. Optimizer statistics drive this judgment.",
    cboTitle: 'Cost-Based Optimization (CBO)',
    cboDesc: 'SQL is a nonprocedural language — it says what to retrieve, not how to retrieve it. The optimizer is free to evaluate full table scans, index scans, nested loops, hash joins, and every other combination, then pick the plan with the lowest cost based on statistics.',
    cboNote: 'Upgrading Oracle may produce different plans for the same SQL. More accurate statistics and additional transformation techniques become available in later versions.',
    componentsTitle: 'The 3 Optimizer Components',
    componentsDesc: 'The optimization stage (Phase 2) is carried out by three internal components working in sequence.',
    qtTitle: 'Query Transformer',
    qtDesc: 'The Query Transformer asks: "Is there a semantically equivalent form of this SQL that would cost less?" If a viable alternative exists, it calculates the cost of both and picks the cheaper one.',
    estimatorTitle: 'Estimator',
    estimatorDesc: 'The Estimator calculates the overall cost of each execution plan using three measures.',
    estimatorRows: [
      ['Selectivity', "The fraction of rows matching the predicate. 0.0 means no rows match, 1.0 means all rows match. Closer to 0 = stronger filter."],
      ['Cardinality', 'The expected number of rows returned at each step. Shown in the Rows column of the execution plan.'],
      ['Cost', 'A single numeric value representing predicted I/O, CPU, and memory usage. Used only to compare plans for the same query.'],
    ],
    estimatorNote: "Cost is an internal number used to compare plans. You can't tune it directly, and it doesn't map 1:1 to wall-clock time.",
    selectivityDetails: [
      ['No statistics', 'Oracle uses dynamic sampling (controlled by OPTIMIZER_DYNAMIC_SAMPLING) or an internal default.'],
      ['Statistics available', "With 150 distinct last_name values, the selectivity of last_name = 'Smith' is 1/150 ≈ 0.007."],
    ],
    cardinalitySql: `-- Cardinality estimation example
SELECT first_name, last_name
FROM   employees
WHERE  salary = '10200';
-- Total rows in employees = 107
-- Distinct values of salary = 58
-- Cardinality estimate = 107 / 58 ≈ 2 rows`,
    planGenTitle: 'Plan Generator',
    planGenDesc: 'The Plan Generator explores combinations of access paths, join methods, and join orders — then picks the plan with the lowest total cost as the final execution plan.',
    planGenTraceSql: `-- Optimizer trace snippet (join order exploration)
Join order[1]:  DEPARTMENTS[D]#0  EMPLOYEES[E]#1
  NL Join  Best NL cost: 13.17
  SM Join  SM cost:       6.08
  HA Join  HA cost:       4.57
  Best:: JoinMethod: Hash  Cost: 4.57

Join order[2]:  EMPLOYEES[E]#1  DEPARTMENTS[D]#0
  ...
  HA Join  HA cost: 4.58
  Join order aborted: cost > best plan cost`,
    planGenNote: 'With DEPARTMENTS as the outer table, Hash Join wins (4.57). Swapping to EMPLOYEES first costs 4.58 — more expensive, so that order is abandoned.',
    autoTuningTitle: 'Automatic Tuning Optimizer',
    autoTuningDesc: 'The optimizer behaves differently depending on how it is invoked.',
    autoTuningRows: [
      ['Normal Optimization', 'The default mode during SQL execution. Finds a good plan under strict time constraints (a fraction of a second).'],
      ['SQL Tuning Advisor', 'Also called Automatic Tuning Optimizer. Performs deeper analysis without time constraints and produces improvement recommendations.'],
    ],
    conceptsTitle: "What's Next",
  },
}

// ── Landing page (optimizer-fundamentals) ─────────────────────────────────

function WhatIsOptimizerLanding({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconBolt size={36} stroke={1.5} className="text-amber" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* Overview */}
      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>
      <div className="mt-4">
        <InfoBox variant="note">{t.overviewNote}</InfoBox>
      </div>

      <Divider />

      {/* CBO */}
      <SectionTitle>{t.cboTitle}</SectionTitle>
      <Prose>{t.cboDesc}</Prose>
      <div className="mt-4">
        <InfoBox variant="tip">{t.cboNote}</InfoBox>
      </div>

      <Divider />

      {/* Optimizer 3 components */}
      <SectionTitle>{t.componentsTitle}</SectionTitle>
      <Prose>{t.componentsDesc}</Prose>
      <OptimizerComponentDiagram lang={lang} />

      {/* Query Transformer */}
      <div className="mt-6">
        <SubTitle>{t.qtTitle}</SubTitle>
        <Prose>{t.qtDesc}</Prose>
      </div>

      {/* Estimator */}
      <div className="mt-6">
        <SubTitle>{t.estimatorTitle}</SubTitle>
        <Prose>{t.estimatorDesc}</Prose>
        <EstimatorDiagram lang={lang} />
        <Table
          headers={isKo ? ['척도', '설명'] : ['Measure', 'Description']}
          rows={t.estimatorRows}
        />
        <div className="mt-4">
          <InfoBox variant="note">{t.estimatorNote}</InfoBox>
        </div>

        <AccordionSection title={isKo ? '선택도 상세 (Selectivity)' : 'Selectivity — Details'}>
          <Table
            headers={isKo ? ['통계 여부', '선택도 추정 방법'] : ['Statistics', 'How Selectivity Is Estimated']}
            rows={t.selectivityDetails}
          />
        </AccordionSection>

        <AccordionSection title={isKo ? '카디널리티 상세 (Cardinality)' : 'Cardinality — Details'}>
          <div className="mt-2">
            <SqlBlock sql={t.cardinalitySql} />
          </div>
        </AccordionSection>
      </div>

      {/* Plan Generator */}
      <div className="mt-6">
        <SubTitle>{t.planGenTitle}</SubTitle>
        <Prose>{t.planGenDesc}</Prose>
        <div className="mt-4">
          <SqlBlock sql={t.planGenTraceSql} />
        </div>
        <div className="mt-4">
          <InfoBox variant="note">{t.planGenNote}</InfoBox>
        </div>
      </div>

      <Divider />

      {/* Automatic Tuning */}
      <SectionTitle>{t.autoTuningTitle}</SectionTitle>
      <Prose>{t.autoTuningDesc}</Prose>
      <Table
        headers={isKo ? ['유형', '설명'] : ['Type', 'Description']}
        rows={t.autoTuningRows}
      />

      <Divider />

      {/* What's next */}
      <SectionTitle>{t.conceptsTitle}</SectionTitle>
      <ConceptGrid items={LANDING_ITEMS[lang]} />
    </PageContainer>
  )
}

// ── Router ────────────────────────────────────────────────────────────────

export function OptimizerFundamentalsPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)

  if (sectionId === 'optimizer-fundamentals-sql-processing') return <SqlProcessingSection />
  if (sectionId === 'optimizer-fundamentals-adaptive')       return <AdaptiveSection />
  if (sectionId === 'optimizer-fundamentals-approx')         return <ApproxSection />
  if (sectionId === 'optimizer-fundamentals-spm')            return <SpmSection />

  // optimizer-fundamentals (landing) — now the main "What Is the Optimizer?" page
  return <WhatIsOptimizerLanding lang={lang} />
}
