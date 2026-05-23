import {
  IconBolt,
  IconLayersIntersect,
  IconMathFunction,
  IconRoute,
} from '@tabler/icons-react'
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
  ConceptGrid,
  SqlBlock,
} from '../../shared'
import { SqlPipelineDiagram, CboArchDiagram } from '../shared/diagrams'

const T = {
  ko: {
    title: 'CBO 개요',
    subtitle:
      'Oracle CBO(Cost-Based Optimizer)는 SQL을 실행하는 가장 효율적인 방법을 결정하는 엔진입니다. 가능한 모든 실행 계획을 탐색하고 비용이 가장 낮은 계획을 선택합니다.',
    concepts: 'CBO의 세 가지 내부 컴포넌트',
    items: [
      {
        icon: <IconLayersIntersect size={20} stroke={1.5} />,
        title: 'Query Transformer',
        desc: '의미는 같지만 더 효율적인 형태로 쿼리를 변환합니다. 서브쿼리 Unnesting, 뷰 Merging, Predicate Pushdown 등을 수행합니다.',
      },
      {
        icon: <IconMathFunction size={20} stroke={1.5} />,
        title: 'Estimator',
        desc: '통계를 기반으로 각 연산의 선택도(Selectivity), 카디널리티(Cardinality), 비용(Cost)을 수치로 추정합니다.',
      },
      {
        icon: <IconRoute size={20} stroke={1.5} />,
        title: 'Plan Generator',
        desc: '가능한 액세스 패스·조인 순서·조인 방법의 조합을 탐색하고, 비용이 가장 낮은 실행 계획을 선택합니다.',
      },
    ],
    pipelineTitle: 'SQL 처리 4단계',
    pipelineDesc:
      'Oracle이 SQL 문장 하나를 받아서 결과를 돌려주기까지 내부적으로 4단계를 거칩니다. 이 중 최적화 단계가 CBO의 영역이며, DML에서만 의무적으로 수행됩니다. DDL은 최적화 대상이 아닙니다.',
    pipelineRows: [
      ['① 파싱 (Parsing)', '구문 검사 → 의미 검사 → Shared Pool에 동일 문장 존재 확인(소프트/하드 파싱 분기)'],
      ['② 최적화 (Optimization)', 'CBO가 Query Transformer → Estimator → Plan Generator 순서로 최적 계획 도출'],
      ['③ 행 소스 생성 (Row Source Generation)', '최적 계획을 반복 처리 가능한 쿼리 계획(행 소스 트리)으로 변환'],
      ['④ 실행 (Execution)', '행 소스 트리 실행 — 디스크 읽기, 락/래치 획득, 변경 로깅. DML의 유일한 필수 단계'],
    ],
    hardSoftTitle: '하드 파싱 vs 소프트 파싱',
    hardSoftRows: [
      ['하드 파싱', 'Shared Pool에 없는 새 문장. 파싱 + 최적화 + 행 소스 생성 전체 수행. CPU 비용 높음'],
      ['소프트 파싱', 'Shared Pool에 동일 문장 존재. 기존 커서 재사용. 최적화 단계 생략. CPU 절감'],
    ],
    hardSoftNote:
      '바인드 변수(Bind Variable)를 사용하면 같은 SQL이 리터럴 값이 달라도 Shared Pool에서 재사용 가능합니다. 불필요한 하드 파싱을 줄여 성능을 높이는 핵심 패턴입니다.',
    archTitle: 'CBO 내부 구조',
    qtNote: 'Query Transformer가 수행하는 서브쿼리 Unnesting, 뷰 Merging, Predicate Pushdown, 쿼리 재작성 등의 기법은 Chapter 6 쿼리 변환에서 자세히 다룹니다.',
    note: 'CBO는 통계가 정확할 때 최적의 계획을 생성합니다. 통계가 오래됐거나 없으면 잘못된 계획이 선택될 수 있으므로, DBMS_STATS로 최신 통계를 유지하는 것이 중요합니다.',
    hardSoftSqlKo: `-- 하드 파싱 유발 (리터럴 사용)\nSELECT * FROM employees WHERE employee_id = 100;\nSELECT * FROM employees WHERE employee_id = 101; -- 별도 문장으로 파싱\n\n-- 소프트 파싱 유도 (바인드 변수 사용)\nSELECT * FROM employees WHERE employee_id = :emp_id;\n-- :emp_id 값이 달라도 동일 커서 재사용 → 하드 파싱 없음`,
    hardSoftSqlEn: '',
  },
  en: {
    title: 'CBO Overview',
    subtitle:
      "Oracle's Cost-Based Optimizer (CBO) is the engine that determines the most efficient method to execute a SQL statement. It explores all valid execution plans and selects the one with the lowest estimated cost.",
    concepts: 'The Three CBO Components',
    items: [
      {
        icon: <IconLayersIntersect size={20} stroke={1.5} />,
        title: 'Query Transformer',
        desc: 'Transforms the query into a semantically equivalent but more efficient form — subquery unnesting, view merging, predicate pushdown, and more.',
      },
      {
        icon: <IconMathFunction size={20} stroke={1.5} />,
        title: 'Estimator',
        desc: 'Computes numeric estimates for each operation: selectivity, cardinality, and cost (disk I/O + CPU + memory) based on optimizer statistics.',
      },
      {
        icon: <IconRoute size={20} stroke={1.5} />,
        title: 'Plan Generator',
        desc: 'Explores combinations of access paths, join orders, and join methods, then picks the plan with the minimum total cost.',
      },
    ],
    pipelineTitle: 'SQL Processing — 4 Stages',
    pipelineDesc:
      "Oracle internally processes every SQL statement through four stages. Optimization is the CBO's domain and is mandatory for DML. DDL statements are not subject to optimization.",
    pipelineRows: [
      ['① Parsing', 'Syntax check → Semantic check → Shared Pool lookup (hard parse vs soft parse)'],
      ['② Optimization', 'CBO pipeline: Query Transformer → Estimator → Plan Generator'],
      ['③ Row Source Generation', 'Converts the optimal plan into an iterative row-source tree'],
      ['④ Execution', 'Runs the row-source tree — disk reads, locks/latches, change logging. The only mandatory DML step'],
    ],
    hardSoftTitle: 'Hard Parse vs Soft Parse',
    hardSoftRows: [
      ['Hard Parse', 'New statement not in Shared Pool. Full parse + optimization + row-source generation. High CPU cost.'],
      ['Soft Parse', 'Identical statement found in Shared Pool. Reuses existing cursor; skips optimization. Saves CPU.'],
    ],
    hardSoftNote:
      'Using bind variables lets Oracle reuse the same cursor even when literal values differ, preventing repeated hard parses and significantly improving throughput.',
    archTitle: 'CBO Internal Architecture',
    qtNote: 'The techniques Query Transformer uses — Subquery Unnesting, View Merging, Predicate Pushdown, and Query Rewriting — will be covered in detail in Chapter 6: Query Transformation.',
    note: 'CBO produces optimal plans only when statistics are accurate. Stale or missing statistics lead to poor plan choices. Keep statistics current with DBMS_STATS.',
    hardSoftSqlKo: '',
    hardSoftSqlEn: `-- Hard parse (literal values)\nSELECT * FROM employees WHERE employee_id = 100;\nSELECT * FROM employees WHERE employee_id = 101; -- treated as different statements\n\n-- Soft parse (bind variables)\nSELECT * FROM employees WHERE employee_id = :emp_id;\n-- Same cursor reused regardless of :emp_id value → no hard parse`,
  },
}

export function OptimizerOverviewPage() {
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

      <SectionTitle>{t.concepts}</SectionTitle>
      <ConceptGrid items={t.items} />

      <Divider />

      <div className="mt-2">
        <SectionTitle>{t.pipelineTitle}</SectionTitle>
        <Prose>{t.pipelineDesc}</Prose>
        <SqlPipelineDiagram lang={lang} />
        <div className="mt-4">
          <Table
            headers={isKo ? ['단계', '설명'] : ['Stage', 'Description']}
            rows={t.pipelineRows}
          />
        </div>
      </div>

      <Divider />

      <div className="mt-2">
        <SectionTitle>{t.hardSoftTitle}</SectionTitle>
        <Table
          headers={isKo ? ['파싱 유형', '동작'] : ['Parse Type', 'Behaviour']}
          rows={t.hardSoftRows}
        />
        <div className="mt-4">
          <SqlBlock sql={isKo ? t.hardSoftSqlKo : t.hardSoftSqlEn} />
        </div>
        <div className="mt-4">
          <InfoBox variant="tip">{t.hardSoftNote}</InfoBox>
        </div>
      </div>

      <Divider />

      <div className="mt-2">
        <SubTitle>{t.archTitle}</SubTitle>
        <CboArchDiagram lang={lang} />
        <div className="mt-4">
          <InfoBox variant="tip">{t.qtNote}</InfoBox>
        </div>
      </div>

      <div className="mt-6">
        <InfoBox variant="note">{t.note}</InfoBox>
      </div>
    </PageContainer>
  )
}
