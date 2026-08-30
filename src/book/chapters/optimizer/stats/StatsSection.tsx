import {
  IconChartBar,
  IconListSearch,
  IconZoomQuestion,
  IconAdjustments,
} from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  Divider,
  Table,
  ConceptGrid,
  SqlBlock,
} from '../../shared'
import { SelectivityWidget } from '../shared/diagrams'

const T = {
  ko: {
    title: '통계 정보와 선택도',
    subtitle:
      'CBO는 DBMS_STATS 패키지로 수집된 통계를 바탕으로 비용을 추정해요. 통계가 오래됐거나 없으면 잘못된 실행 계획이 만들어져요.',
    typesTitle: '통계의 종류',
    items: [
      { icon: <IconChartBar size={20} stroke={1.5} />, title: '테이블 통계', desc: '총 행 수(NUM_ROWS), 블록 수(BLOCKS), 평균 행 길이(AVG_ROW_LEN). Full Table Scan 비용 계산의 기반.' },
      { icon: <IconListSearch size={20} stroke={1.5} />, title: '컬럼 통계', desc: 'NDV(고유 값 수), NULL 수, 최솟값/최댓값, 히스토그램. 선택도 계산의 핵심.' },
      { icon: <IconZoomQuestion size={20} stroke={1.5} />, title: '인덱스 통계', desc: '리프 블록 수, 인덱스 레벨(높이), 클러스터링 팩터. Index Scan 비용 계산에 사용.' },
      { icon: <IconAdjustments size={20} stroke={1.5} />, title: '시스템 통계', desc: 'CPU 성능, I/O 속도. 물리적 환경을 반영해 비용 단위를 보정.' },
    ],
    statsColsTitle: '주요 통계 항목',
    statsTable: [
      ['NUM_ROWS', '테이블의 총 행 수', '높음'],
      ['BLOCKS', '테이블이 사용하는 데이터 블록 수', '높음'],
      ['AVG_ROW_LEN', '평균 행 길이 (바이트)', '중간'],
      ['NUM_DISTINCT (NDV)', '컬럼의 고유 값 수', '높음'],
      ['DENSITY', '1/NDV — 선택도 추정에 사용', '높음'],
      ['NUM_NULLS', '컬럼의 NULL 값 수', '중간'],
      ['LOW_VALUE / HIGH_VALUE', '컬럼의 최솟값 / 최댓값', '중간'],
    ],
    selectivityTitle: '선택도(Selectivity)와 카디널리티(Cardinality)',
    selectivityDesc:
      '선택도는 조건절(Predicate)이 걸러내는 행의 비율입니다. 0에 가까울수록 적은 행이 반환되어 인덱스 스캔이 유리하고, 1에 가까울수록 전체 읽기(FTS)가 효율적입니다.\n\n카디널리티 = NUM_ROWS × 선택도. CBO는 이 값을 바탕으로 각 연산의 출력 크기를 추정하고, 이어지는 연산의 비용을 계산합니다.',
    formulasTitle: '선택도 공식 정리',
    selectivityTable: [
      ['등치 (col = val)', '1 / NDV', '0.01 (NDV=100일 때)'],
      ['범위 (col > val)', '(MAX − val) / (MAX − MIN)', '0.5 (중간값 이상 조건)'],
      ["LIKE 'val%'", '1 / NDV × 조정 인수', '0.05 ~ 0.1'],
      ['IS NULL', 'NUM_NULLS / NUM_ROWS', '0.05 (NULL 5%일 때)'],
      ['IN (v1, v2, ...)', '1 − (1 − s)^N (s: 단일 선택도)', '0.0199 (2개 IN, NDV=100)'],
    ],
    histTitle: '히스토그램(Histogram)',
    histDesc:
      '컬럼 값이 균등하지 않게 분포할 때(예: 특정 지역 주문이 90% 집중), 단순 NDV 기반 선택도는 부정확합니다. Oracle은 히스토그램을 수집해 왜곡된 분포를 반영합니다.\n\n히스토그램 종류: Frequency(모든 값 기록), Top-Frequency(상위 N개), Height-Balanced(버킷 균등 분배), Hybrid.',
    dbmsSql: `-- DBMS_STATS로 테이블 통계 수집\nBEGIN\n  DBMS_STATS.GATHER_TABLE_STATS(\n    ownname => 'HR',\n    tabname => 'EMPLOYEES',\n    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,\n    method_opt => 'FOR ALL COLUMNS SIZE AUTO'\n  );\nEND;\n\n-- 현재 통계 확인\nSELECT num_rows, blocks, avg_row_len, last_analyzed\nFROM   all_tables\nWHERE  owner = 'HR' AND table_name = 'EMPLOYEES';`,
    histSql: `-- 히스토그램 수집 (특정 컬럼)\nBEGIN\n  DBMS_STATS.GATHER_TABLE_STATS(\n    ownname => 'HR',\n    tabname => 'ORDERS',\n    method_opt => 'FOR COLUMNS REGION_ID SIZE 254' -- 최대 254 버킷\n  );\nEND;\n\n-- 히스토그램 확인\nSELECT column_name, histogram, num_buckets\nFROM   all_tab_col_statistics\nWHERE  owner = 'HR' AND table_name = 'ORDERS';`,
  },
  en: {
    title: 'Statistics & Selectivity',
    subtitle:
      'The CBO estimates costs using statistics collected by the DBMS_STATS package. Stale or absent statistics result in suboptimal execution plans.',
    typesTitle: 'Types of Statistics',
    items: [
      { icon: <IconChartBar size={20} stroke={1.5} />, title: 'Table Statistics', desc: 'NUM_ROWS, BLOCKS, AVG_ROW_LEN. Foundation for Full Table Scan cost estimation.' },
      { icon: <IconListSearch size={20} stroke={1.5} />, title: 'Column Statistics', desc: 'NDV, NULL count, min/max values, histograms. Core input for selectivity calculation.' },
      { icon: <IconZoomQuestion size={20} stroke={1.5} />, title: 'Index Statistics', desc: 'Leaf block count, index levels (height), clustering factor. Used for Index Scan cost estimation.' },
      { icon: <IconAdjustments size={20} stroke={1.5} />, title: 'System Statistics', desc: 'CPU speed, I/O throughput. Calibrates the cost unit to reflect the physical environment.' },
    ],
    statsColsTitle: 'Key Statistics Columns',
    statsTable: [
      ['NUM_ROWS', 'Total row count in the table', 'High'],
      ['BLOCKS', 'Number of data blocks used by the table', 'High'],
      ['AVG_ROW_LEN', 'Average row length in bytes', 'Medium'],
      ['NUM_DISTINCT (NDV)', 'Number of distinct values in a column', 'High'],
      ['DENSITY', '1/NDV — used for selectivity estimation', 'High'],
      ['NUM_NULLS', 'Number of NULL values in a column', 'Medium'],
      ['LOW_VALUE / HIGH_VALUE', 'Min/max value of a column', 'Medium'],
    ],
    selectivityTitle: 'Selectivity & Cardinality',
    selectivityDesc:
      'Selectivity is the fraction of rows returned by a predicate. Values close to 0 mean few rows are returned — making index scans favorable. Values close to 1 mean most rows match — making a full table scan more efficient.\n\nCardinality = NUM_ROWS × Selectivity. The CBO uses cardinality to estimate the output size at each step and feeds it into the cost calculation for subsequent operations.',
    formulasTitle: 'Selectivity Formulas',
    selectivityTable: [
      ['Equality (col = val)', '1 / NDV', '0.01 (NDV = 100)'],
      ['Range (col > val)', '(MAX − val) / (MAX − MIN)', '0.5 (above median)'],
      ["LIKE 'val%'", '1 / NDV × adjustment factor', '0.05 – 0.1'],
      ['IS NULL', 'NUM_NULLS / NUM_ROWS', '0.05 (5% nulls)'],
      ['IN (v1, v2, ...)', '1 − (1 − s)^N (s: single selectivity)', '0.0199 (2 values, NDV=100)'],
    ],
    histTitle: 'Histograms',
    histDesc:
      'When column values are not uniformly distributed (e.g., 90% of orders come from one region), simple NDV-based selectivity is inaccurate. Oracle collects histograms to account for skewed distributions.\n\nHistogram types: Frequency (records every value), Top-Frequency (top N values), Height-Balanced (equal bucket distribution), Hybrid.',
    dbmsSql: `-- Gather table statistics with DBMS_STATS\nBEGIN\n  DBMS_STATS.GATHER_TABLE_STATS(\n    ownname => 'HR',\n    tabname => 'EMPLOYEES',\n    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,\n    method_opt => 'FOR ALL COLUMNS SIZE AUTO'\n  );\nEND;\n\n-- Check current statistics\nSELECT num_rows, blocks, avg_row_len, last_analyzed\nFROM   all_tables\nWHERE  owner = 'HR' AND table_name = 'EMPLOYEES';`,
    histSql: `-- Collect histogram for a specific column\nBEGIN\n  DBMS_STATS.GATHER_TABLE_STATS(\n    ownname => 'HR',\n    tabname => 'ORDERS',\n    method_opt => 'FOR COLUMNS REGION_ID SIZE 254' -- max 254 buckets\n  );\nEND;\n\n-- Check histogram info\nSELECT column_name, histogram, num_buckets\nFROM   all_tab_col_statistics\nWHERE  owner = 'HR' AND table_name = 'ORDERS';`,
  },
}

export function OptimizerStatsPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconChartBar size={36} stroke={1.5} className="text-purple" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.typesTitle}</SectionTitle>
      <ConceptGrid items={t.items} />

      <div className="mt-8">
        <SubTitle>{t.statsColsTitle}</SubTitle>
        <Table
          headers={isKo ? ['통계 항목', '설명', '중요도'] : ['Statistic', 'Description', 'Importance']}
          rows={t.statsTable}
        />
      </div>

      <div className="mt-6">
        <SqlBlock sql={t.dbmsSql} />
      </div>

      <Divider />

      <div className="mt-2">
        <SectionTitle>{t.selectivityTitle}</SectionTitle>
        <Prose>{t.selectivityDesc}</Prose>

        <div className="mt-6">
          <SelectivityWidget lang={lang} />
        </div>

        <div className="mt-6">
          <SubTitle>{t.formulasTitle}</SubTitle>
          <Table
            headers={isKo ? ['조건 유형', '선택도 공식', '예시'] : ['Condition Type', 'Selectivity Formula', 'Example']}
            rows={t.selectivityTable}
          />
        </div>
      </div>

      <Divider />

      <SectionTitle>{t.histTitle}</SectionTitle>
      <Prose>{t.histDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.histSql} />
      </div>
    </PageContainer>
  )
}
