import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'

const T = {
  ko: {
    title: '조인 방식 선택',
    subtitle:
      'CBO는 조인 조건 유형, 데이터 볼륨, 인덱스 존재 여부, OPTIMIZER_MODE를 종합해서 Nested Loop / Hash / Sort Merge 중 최저 비용 조인 방식을 선택해요.',

    decisionTitle: 'CBO의 조인 방식 결정 요인',
    decisionDesc:
      'CBO는 각 조인 방식의 비용(단일 블록 I/O, 멀티블록 I/O, CPU)을 계산해서 가장 낮은 비용의 방식을 선택해요. 주요 결정 요인은 다음과 같아요.',
    decisionTable: [
      ['조인 조건 유형', '등치(=) → 세 방식 모두 가능\n비등치(<, >, BETWEEN) → Sort Merge만 가능', '조건 타입이 가장 강한 제약'],
      ['예상 결과 행 수', '소량 → Nested Loop 선호\n대량 → Hash Join 선호', 'rows = outer rows × selectivity'],
      ['Inner 인덱스 존재', '선택도 높은 인덱스 있음 → Nested Loop 효율적', 'Index Range/Unique Scan 비용 반영'],
      ['OPTIMIZER_MODE', 'FIRST_ROWS → Nested Loop 선호\nALL_ROWS → Hash Join 선호 가능', '첫 행 빠른 반환 vs 전체 처리량'],
      ['PGA 메모리 충분도', 'PGA 크면 Hash Join 인메모리 처리\nPGA 부족 시 Sort Merge가 유리할 수 있음', 'PGA_AGGREGATE_TARGET 설정 영향'],
    ],

    compTitle: '조인 방식 비교표',
    compHeaders: ['항목', 'Nested Loop', 'Hash Join', 'Sort Merge'],
    compRows: [
      ['등치 조건(=)', '✓', '✓', '✓'],
      ['비등치 조건', '✓', '✗', '✓'],
      ['적합 데이터 규모', '소량', '대량', '중~대량'],
      ['인덱스 의존도', '높음', '낮음', '낮음'],
      ['메모리 사용', 'PGA 낮음', 'PGA 높음 (빌드 테이블)', 'PGA 중간 (정렬)'],
      ['첫 행 응답 속도', '빠름', '느림 (빌드 완료 후)', '느림 (정렬 완료 후)'],
      ['강제 힌트', 'USE_NL', 'USE_HASH', 'USE_MERGE'],
    ],

    orderTitle: '조인 순서 (Join Order)',
    orderDesc:
      'CBO는 어떤 테이블을 먼저 읽을지(driving table)도 결정해요. 일반적으로 조인 후 결과 집합을 가장 많이 줄이는 테이블부터 처리해요.\n\n세 개 이상의 테이블을 조인할 때 CBO는 Left Deep, Right Deep, Bushy 중 하나의 조인 트리 구조를 선택해요. ORDERED 힌트로 FROM 절 순서대로 조인을 강제할 수 있어요.',
    orderSql: `-- 조인 순서 강제 (FROM 절 순서로)
SELECT /*+ ORDERED */ e.last_name, d.department_name, l.city
FROM   employees e, departments d, locations l
WHERE  e.department_id = d.department_id
AND    d.location_id   = l.location_id;

-- 특정 테이블을 Driving으로 강제
SELECT /*+ LEADING(d e) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    noteTitle: '옵티마이저는 행 수 기준으로 비용을 계산해요',
    noteDesc:
      '중요한 점은 CBO가 테이블의 실제 크기가 아니라 조인 결과의 예상 행 수(cardinality)를 기준으로 비용을 계산해요. 통계가 오래됐거나 부정확하면 잘못된 조인 방식이 선택될 수 있어요.',
  },
  en: {
    title: 'Join Method Selection',
    subtitle:
      'The CBO evaluates join condition type, data volume, index availability, and OPTIMIZER_MODE to select the lowest-cost join method among Nested Loop, Hash, and Sort Merge.',

    decisionTitle: 'CBO Decision Factors',
    decisionDesc:
      'The CBO computes the cost (single-block I/O, multiblock I/O, CPU) of each join method and selects the cheapest. The key decision factors are as follows.',
    decisionTable: [
      ['Join condition type', 'Equality (=) → all three methods available\nNon-equality (<, >, BETWEEN) → Sort Merge only', 'Strongest constraint on method choice'],
      ['Expected result rows', 'Small → prefers Nested Loop\nLarge → prefers Hash Join', 'rows = outer rows × selectivity'],
      ['Inner index availability', 'Highly selective index → Nested Loop efficient', 'Reflects Index Range/Unique Scan cost'],
      ['OPTIMIZER_MODE', 'FIRST_ROWS → prefers Nested Loop\nALL_ROWS → may prefer Hash Join', 'Fast first row vs total throughput'],
      ['PGA memory', 'Large PGA → Hash Join stays in memory\nInsufficient PGA → Sort Merge may be cheaper', 'Affected by PGA_AGGREGATE_TARGET'],
    ],

    compTitle: 'Join Method Comparison',
    compHeaders: ['Criterion', 'Nested Loop', 'Hash Join', 'Sort Merge'],
    compRows: [
      ['Equality condition (=)', '✓', '✓', '✓'],
      ['Non-equality condition', '✓', '✗', '✓'],
      ['Data volume', 'Small', 'Large', 'Medium–Large'],
      ['Index dependency', 'High', 'Low', 'Low'],
      ['Memory usage', 'Low PGA', 'High PGA (build table)', 'Medium PGA (sort)'],
      ['First-row latency', 'Fast', 'Slow (after build)', 'Slow (after sort)'],
      ['Force hint', 'USE_NL', 'USE_HASH', 'USE_MERGE'],
    ],

    orderTitle: 'Join Order',
    orderDesc:
      'The CBO also determines which table to read first (the driving table). In general, the table that most reduces the intermediate result set is processed first.\n\nFor three or more tables, the CBO chooses among Left Deep, Right Deep, and Bushy join tree shapes. The ORDERED hint forces the join order to follow the FROM clause sequence.',
    orderSql: `-- Force join order (follows FROM clause)
SELECT /*+ ORDERED */ e.last_name, d.department_name, l.city
FROM   employees e, departments d, locations l
WHERE  e.department_id = d.department_id
AND    d.location_id   = l.location_id;

-- Force a specific driving table
SELECT /*+ LEADING(d e) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    noteTitle: 'The CBO Uses Cardinality, Not Table Size',
    noteDesc:
      'The CBO calculates join cost based on the expected cardinality of the join result — not the underlying table sizes. Stale or missing statistics can cause the optimizer to choose the wrong join method.',
  },
}

export function OptimizerJoinOverviewPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-amber" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.decisionTitle}</SectionTitle>
      <Prose>{t.decisionDesc}</Prose>
      <Table
        headers={[
          isKo ? '결정 요인' : 'Factor',
          isKo ? '영향' : 'Effect',
          isKo ? '비고' : 'Note',
        ]}
        rows={t.decisionTable}
      />

      <Divider />

      <SectionTitle>{t.compTitle}</SectionTitle>
      <Table headers={t.compHeaders} rows={t.compRows} />

      <Divider />

      <SectionTitle>{t.orderTitle}</SectionTitle>
      <Prose>{t.orderDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.orderSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="note">
          <strong>{t.noteTitle}</strong>
          <br />
          {t.noteDesc}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
