import { useState } from 'react'
import { IconRoute } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'
import {
  AccessPathDiagram,
  CostCompareChart,
  AccessModeButtons,
} from '../shared/diagrams'
import type { AccessMode } from '../shared/diagrams'

const T = {
  ko: {
    title: '액세스 패스',
    subtitle:
      '액세스 패스(Access Path)는 Oracle이 테이블 데이터를 읽어오는 방법이에요. CBO는 선택도, 인덱스 통계, 반환 예상 행 수를 종합해서 비용이 가장 낮은 액세스 패스를 선택해요.',
    pathTable: [
      ['Full Table Scan', '전체 블록 순차 읽기. 인덱스 없거나 대부분 행 반환 시', '멀티블록 I/O로 읽기 효율 극대화'],
      ['Index Unique Scan', '고유 인덱스 + 등치 조건. 정확히 1행 반환', 'B-Tree 루트→브랜치→리프 1회 탐색'],
      ['Index Range Scan', '범위 조건 또는 비고유 인덱스 등치. 연속 리프 스캔', '반환 행 수에 비례해 비용 증가'],
      ['Index Fast Full Scan', '인덱스 전체 블록 읽기. 멀티블록 I/O', 'SELECT 컬럼이 인덱스에 전부 포함될 때'],
      ['Index Skip Scan', '복합 인덱스 선두 컬럼 조건 없을 때 NDV 낮은 선두 컬럼 건너뜀', '선두 컬럼 NDV가 낮을수록 유리'],
      ['Rowid Scan', 'ROWID로 직접 블록 위치 접근', '인덱스 스캔 후 테이블 액세스 시 사용'],
    ],
    vizTitle: '액세스 패스 시각화',
    ftsTitle: 'Full Table Scan이 유리한 경우',
    ftsItems: [
      '테이블이 작아 블록 수가 적을 때',
      '조건에 맞는 행이 전체의 10% 이상일 때 (선택도 높음)',
      '인덱스가 없거나 사용 불가능한 조건일 때',
      'PARALLEL 힌트나 병렬 쿼리로 멀티블록 I/O를 극대화할 때',
    ],
    indexTitle: 'Index Scan이 유리한 경우',
    indexItems: [
      '선택도가 낮아 반환 행이 전체의 1~5% 미만일 때',
      '등치 조건(=)이나 좁은 범위 조건일 때',
      'ORDER BY, GROUP BY 컬럼과 인덱스 컬럼이 일치할 때',
      'SELECT 컬럼이 인덱스에 전부 포함(Covering Index)될 때',
    ],
    compareTitle: '비용 비교 — FTS vs Index Scan',
    compareDesc: '아래는 동일 테이블에서 조건 선택도에 따라 CBO가 추정하는 상대적 비용 변화입니다.',
    sql: `-- 실행 계획 확인 방법\nEXPLAIN PLAN FOR\nSELECT employee_id, department_id\nFROM   hr.employees\nWHERE  department_id > 50;\n\nSELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);\n\n-- FIRST_ROWS 힌트 → Index Range Scan 유도\nSELECT /*+ FIRST_ROWS(25) */ employee_id, department_id\nFROM   hr.employees\nWHERE  department_id > 50;`,
  },
  en: {
    title: 'Access Paths',
    subtitle:
      'An access path is the technique Oracle uses to retrieve rows from a table. The CBO selects the lowest-cost path based on selectivity, index statistics, and estimated row counts.',
    pathTable: [
      ['Full Table Scan', 'Sequential read of all blocks. Used when no usable index or most rows match.', 'Multi-block I/O maximizes read efficiency'],
      ['Index Unique Scan', 'Unique index + equality predicate. Returns exactly 1 row.', 'Single B-Tree traversal: root → branch → leaf'],
      ['Index Range Scan', 'Range predicate or non-unique index equality. Scans consecutive leaf blocks.', 'Cost scales with number of rows returned'],
      ['Index Fast Full Scan', 'Reads all index blocks using multi-block I/O.', 'When all SELECT columns are in the index (covering index)'],
      ['Index Skip Scan', 'No leading column predicate on composite index. Skips low-NDV leading column.', 'Better when leading column has very low NDV'],
      ['Rowid Scan', 'Direct block access using ROWID.', 'Used after an index scan to fetch table rows'],
    ],
    vizTitle: 'Access Path Visualization',
    ftsTitle: 'When Full Table Scan Is Preferred',
    ftsItems: [
      'Table is small (few blocks)',
      'More than ~10% of rows match the predicate (high selectivity)',
      'No usable index exists for the predicate',
      'Parallel query or PARALLEL hint maximizes multi-block I/O throughput',
    ],
    indexTitle: 'When Index Scan Is Preferred',
    indexItems: [
      'Low selectivity — fewer than 1–5% of rows match',
      'Equality or narrow range predicate',
      'ORDER BY or GROUP BY columns match the index',
      'All SELECT columns are contained in the index (covering index)',
    ],
    compareTitle: 'Cost Comparison — FTS vs Index Scan',
    compareDesc: 'Relative estimated cost for the same table at different predicate selectivities.',
    sql: `-- Check execution plan\nEXPLAIN PLAN FOR\nSELECT employee_id, department_id\nFROM   hr.employees\nWHERE  department_id > 50;\n\nSELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);\n\n-- FIRST_ROWS hint → steers optimizer to Index Range Scan\nSELECT /*+ FIRST_ROWS(25) */ employee_id, department_id\nFROM   hr.employees\nWHERE  department_id > 50;`,
  },
}

export function OptimizerAccessPathPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'
  const [activeMode, setActiveMode] = useState<AccessMode>('range')

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconRoute size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="mt-6">
        <Table
          headers={isKo ? ['액세스 패스', '사용 조건', '특징'] : ['Access Path', 'When Used', 'Notes']}
          rows={t.pathTable}
        />
      </div>

      <Divider />

      <div className="mt-2">
        <SectionTitle>{t.vizTitle}</SectionTitle>
        <AccessModeButtons active={activeMode} onChange={setActiveMode} lang={lang} />
        <AccessPathDiagram mode={activeMode} lang={lang} />
      </div>

      <Divider />

      <div className="mt-2">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SubTitle>{t.ftsTitle}</SubTitle>
            <ul className="mt-2 flex flex-col gap-2">
              {t.ftsItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-amber/10 text-amber text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SubTitle>{t.indexTitle}</SubTitle>
            <ul className="mt-2 flex flex-col gap-2">
              {t.indexItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-green/10 text-green text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Divider />

      <div className="mt-2">
        <SectionTitle>{t.compareTitle}</SectionTitle>
        <Prose>{t.compareDesc}</Prose>
        <CostCompareChart lang={lang} />
      </div>

      <div className="mt-6">
        <SqlBlock sql={t.sql} />
      </div>
    </PageContainer>
  )
}
