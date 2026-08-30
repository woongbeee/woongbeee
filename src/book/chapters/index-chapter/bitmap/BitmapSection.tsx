import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { getLargeTable } from '@/data/largeDataGenerator'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Table,
  Divider,
} from '../../shared'
import { ExecutionPlanViewer } from '@/components/ExecutionPlanViewer'
import type { PlanNode, PlanStats } from '@/components/ExecutionPlanViewer'
import { IconLayersLinked } from '@tabler/icons-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BitmapVector {
  key: string
  bits: (0 | 1)[]
}

type MergeOp = 'AND' | 'OR'

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    pageTitle: 'Bitmap 인덱스',
    pageSubtitle:
      'Bitmap 인덱스는 카디널리티(Cardinality, 고유값의 수)가 낮은 컬럼 — 예를 들어 성별이나 상태 코드처럼 종류가 몇 가지 안 되는 컬럼 — 에 딱 맞는 인덱스예요. ' +
      '고유값마다 0과 1로 이루어진 비트 배열을 하나씩 가지고 있고, 여러 조건을 비트 연산으로 아주 빠르게 합칠 수 있어요.',

    structureTitle: 'Bitmap 인덱스가 뭐예요?',
    structureDesc:
      'Bitmap 인덱스는 인덱스 키마다 비트맵(0과 1의 배열)을 저장해요. 일반 B-Tree 인덱스는 엔트리 하나가 행 하나를 가리키지만, Bitmap 인덱스는 키 하나가 여러 행을 한꺼번에 가리킬 수 있어요. 비트맵의 각 비트는 행 번호(ROWID)와 하나씩 대응되는데, 그 비트가 1이면 해당 행이 그 키 값을 가지고 있다는 뜻이에요. 실제로 어떤 행인지는 매핑 함수가 비트 위치를 ROWID(Row Identifier, 행의 물리적 주소)로 변환해서 알려줘요.',
    structureNote:
      'Bitmap 인덱스는 컬럼의 카디널리티(Cardinality)가 낮을 때, 즉 전체 행 수에 비해 고유한 값의 종류가 적을 때 가장 잘 맞아요. 또 테이블이 거의 읽기 전용이거나 DML(Data Manipulation Language, 데이터 삽입·수정·삭제) 작업이 많지 않은 환경이어야 해요. 하나의 행을 수정하더라도 그 키 전체가 잠기기 때문에, 동시에 여러 사람이 데이터를 바꾸는 OLTP(Online Transaction Processing, 실시간 업무 처리) 환경에는 맞지 않아요. OLAP(Online Analytical Processing, 분석용 대용량 조회)이나 데이터 웨어하우스(DW, Data Warehouse) 환경에 딱이에요.',

    vsTitle: 'B-Tree vs Bitmap — 어떻게 달라요?',
    vsHeaders: ['항목', 'B-Tree', 'Bitmap'],
    vsRows: [
      ['카디널리티',        '고카디널리티 (고유값이 많을 때)',          '저카디널리티 (고유값이 적을 때)'],
      ['NULL 처리',         '❌ 모든 키가 NULL인 행은 인덱스에서 빠짐',  '✓ NULL도 하나의 키 값으로 인덱싱돼요'],
      ['저장 공간',         '고유값이 적은 컬럼에서 공간 낭비',          '고유값이 적은 컬럼에서 아주 효율적'],
      ['DML 성능',         '행 단위로 빠르게 수정 가능',                '행을 수정하면 비트맵 전체를 잠금 → OLTP에 비권장'],
      ['AND/OR 복합 조건', '인덱스별로 따로 처리 후 병합',               '비트 연산으로 초고속 병합'],
      ['주 사용 환경',      'OLTP(Online Transaction Processing)',       'OLAP(Online Analytical Processing) / DW(Data Warehouse)'],
    ],

    indexCombineTitle: 'Index Combine — 인덱스를 합치는 마법',
    indexCombineDesc:
      'B-Tree 인덱스가 여러 개 있을 때, Oracle 옵티마이저(Optimizer)는 각 인덱스 스캔 결과를 비트맵으로 변환(BITMAP CONVERSION)한 뒤 비트 연산으로 합쳐요(BITMAP AND/OR). 이렇게 하면 조건에 맞는 행만 쏙 걸러낼 수 있고, 인덱스 하나만 쓸 때보다 훨씬 적은 블록 I/O로 여러 조건을 동시에 처리할 수 있어요.',
    indexCombineSteps: [
      { label: '① B-Tree Index Scan',           desc: '각 조건에 해당하는 B-Tree 인덱스를 따로따로 Range/Unique 스캔해요.' },
      { label: '② BITMAP CONVERSION',           desc: '스캔으로 얻은 ROWID 목록을 비트맵 벡터로 바꿔요. 비트 하나가 테이블 행 하나에 대응해요.' },
      { label: '③ BITMAP AND / OR',             desc: '변환된 비트맵들을 비트 연산으로 합쳐요. AND는 두 조건을 모두 만족하는 행, OR은 둘 중 하나라도 만족하는 행을 골라내요.' },
      { label: '④ BITMAP CONVERSION TO ROWIDs', desc: '최종 비트맵에서 1인 자리를 ROWID(Row Identifier)로 다시 변환해서 실제 테이블 행을 읽어요.' },
    ],
    indexCombineWhen: 'Index Combine은 언제 선택될까요?',
    indexCombineWhenItems: [
      '두 컬럼에 각각 별도의 B-Tree 인덱스가 있고, 두 조건이 모두 WHERE 절에 쓰일 때',
      '두 컬럼을 함께 묶은 복합 인덱스(Composite Index)가 없거나, 복합 인덱스보다 Combine 방식의 비용이 더 낮을 때',
      '각 인덱스의 선택도(Selectivity)가 충분히 낮아서 인덱스 하나만으로도 행 수를 많이 줄일 수 있을 때',
    ],

    simulLabel: '컬럼과 조건을 골라서 연산을 실행해 보세요. Index Combine이 내부에서 어떻게 동작하는지 단계별로 확인할 수 있어요.',
    col1Label: '조건 1',
    col2Label: '조건 2',
    val1Label: '값 1',
    val2Label: '값 2',
    runBtn: '연산 실행',
    resetBtn: '초기화',
    stepLabels: ['① B-Tree Scan 1', '② B-Tree Scan 2', '③ Bitmap 병합', '④ ROWID 변환'],
    resultLabel: '결과',
    rowidLabel: 'ROWID 변환 결과',
    rowCountLabel: '선택된 행 수',
    planLabel: '실행 계획 예시',

    bitmapJoinTitle: 'Bitmap Join Index — 조인을 미리 담아두는 인덱스',
    bitmapJoinWhat:
      'Bitmap Join Index는 두 개 이상의 테이블을 조인한 결과를 미리 인덱스에 담아두는 방식이에요. ' +
      '일반 Bitmap 인덱스는 하나의 테이블 안에서만 동작하지만, Bitmap Join Index는 다른 테이블의 컬럼 값을 기준으로 비트맵을 만들어요. ' +
      '그래서 쿼리를 실행할 때 조인을 직접 하지 않아도 인덱스만 보고 필터링이 끝나요.',
    bitmapJoinHow:
      '예를 들어, EMPLOYEES(직원) 테이블과 JOBS(직책) 테이블이 있을 때 ' +
      '"직책이 Accountant(회계사)인 직원이 몇 명이에요?" 라는 쿼리를 생각해 볼게요.\n\n' +
      '인덱스 없이 조회하면 JOBS 테이블에서 Accountant를 찾고, EMPLOYEES 테이블과 조인해야 해요. ' +
      'Bitmap Join Index가 있으면 이미 EMPLOYEES의 ROWID(행 주소)가 job_title 값으로 분류되어 인덱스에 들어 있어서, ' +
      '테이블 접근 없이 인덱스만으로 답을 바로 낼 수 있어요.',
    bitmapJoinStructLabel: '인덱스 내부 구조 — 어떻게 저장되나요?',
    bitmapJoinStructDesc:
      '인덱스 엔트리 하나는 이렇게 생겼어요:\n' +
      '  [jobs.job_title 값]  →  [employees.rowid 범위 시작]  [employees.rowid 범위 끝]  [비트맵]\n\n' +
      '같은 job_title을 가진 EMPLOYEES 행들의 ROWID(행 주소)가 비트맵으로 압축되어 저장돼요.',
    bitmapJoinVsLabel: 'Materialized View와 비교하면?',
    bitmapJoinVsDesc:
      '조인 결과를 미리 저장한다는 점에서 Materialized View(구체화 뷰)와 비슷해 보이지만, ' +
      'Bitmap Join Index는 저장 공간이 훨씬 작아요. Materialized View는 실제 데이터 행을 통째로 복사해 두지만, ' +
      'Bitmap Join Index는 비트맵만 저장하기 때문이에요.',
    bitmapJoinWhen: '언제 써야 하나요?',
    bitmapJoinWhenItems: [
      '데이터 웨어하우스(DW)의 스타 스키마(Star Schema) — 팩트 테이블과 차원 테이블을 자주 조인할 때',
      '조인 조건이 항상 같고(PK-FK 조인), 조인 컬럼의 카디널리티(Cardinality)가 낮을 때',
      '읽기 위주 환경 — DML(Data Manipulation Language, 데이터 삽입·수정·삭제)이 거의 없을 때',
    ],
    bitmapJoinNote:
      'Bitmap Join Index는 팩트 테이블(fact table)에 만들어요. 차원 테이블(dimension table)의 컬럼을 인덱스 키로 쓰고, 팩트 테이블의 ROWID(행 주소)를 비트맵으로 저장하는 구조예요.',

    compressionTitle: '비트맵 압축 — RLE(Run-Length Encoding)',
    compressionWhat:
      '비트맵을 아무 처리 없이 저장하면 테이블 행 수만큼 비트가 필요해요. 행이 100만 개면 비트도 100만 개가 필요한 셈이죠. ' +
      '그런데 실제 데이터를 보면 같은 값이 연속으로 이어지는 경우가 많아요.\n\n' +
      'Oracle은 이런 연속 구간을 RLE(Run-Length Encoding, 반복 구간 압축)로 묶어서 저장해요. ' +
      '"0이 12번 연속" → `0×12`, "1이 8번 연속" → `1×8` 이런 식이죠. ' +
      '덕분에 실제 디스크에 저장되는 비트맵 크기는 이론적인 크기보다 훨씬 작아요.',
    compressionStorageLabel: '실제 저장 방식 — 범위 + 비트맵',
    compressionStorageDesc:
      '비트맵 인덱스의 Leaf 블록 엔트리 하나는 이렇게 생겼어요:\n\n' +
      '  [키 값]  [시작 ROWID]  [끝 ROWID]  [비트맵]\n\n' +
      '비트맵이 커지면 여러 엔트리로 나눠서 저장해요. 시작 ROWID(행 주소)부터 끝 ROWID까지의 범위를 비트맵 하나가 커버하는 거예요. ' +
      '범위 밖의 행은 그냥 0으로 처리돼요.',
    compressionExampleLabel: '압축 예시',
    compressionNote:
      '카디널리티(Cardinality)가 낮을수록 같은 값이 연속으로 몰리는 경향이 있어서, RLE 압축 효과가 훨씬 커져요. ' +
      '성별(M/F) 같은 컬럼은 M 비트맵에 0과 1이 큰 덩어리로 뭉쳐 나오기 때문에 압축률이 아주 높아요.',
  },
  en: {
    pageTitle: 'Bitmap Index',
    pageSubtitle:
      'A bitmap index is optimized for low-cardinality columns (e.g., gender, status code) with few distinct values. ' +
      'It maintains a 0/1 bit array per distinct value and merges multiple predicates ultra-fast with bitwise operations.',

    structureTitle: 'What is a Bitmap Index?',
    structureDesc:
      'In a bitmap index, the database stores a bitmap for each index key. In a conventional B-tree index, one index entry points to a single row. In a bitmap index, each index key stores pointers to multiple rows. Each bit in the bitmap corresponds to a possible rowid. If the bit is set, then the row with the corresponding rowid contains the key value. A mapping function converts the bit position to an actual rowid.',
    structureNote:
      'Bitmap indexes are best suited when the indexed columns have low cardinality — the number of distinct values is small compared to the number of table rows — and the indexed table is either read-only or not subject to significant DML. If the indexed column in a single row is updated, the database locks the entire key entry (e.g., "M" or "F"), not just the individual bit. Because a key points to many rows, DML typically locks all of those rows. For this reason, bitmap indexes are not appropriate for many OLTP applications.',

    vsTitle: 'B-Tree vs Bitmap',
    vsHeaders: ['Aspect', 'B-Tree', 'Bitmap'],
    vsRows: [
      ['Cardinality',           'High cardinality (many distinct values)',        'Low cardinality (few distinct values)'],
      ['NULL indexing',         '❌ Rows where all keys are NULL are excluded',   '✓ NULL is indexed as a distinct key value'],
      ['Space efficiency',      'Wastes space for low-cardinality columns',       'Very efficient for low-cardinality columns'],
      ['DML performance',       'Fast per-row updates',                           'Full bitmap lock on row change (not for OLTP)'],
      ['Multi-predicate AND/OR','Merge per-index results',                        'Ultra-fast bitwise merge'],
      ['Workload',              'OLTP',                                           'OLAP / Data Warehouse'],
    ],

    indexCombineTitle: 'Index Combine',
    indexCombineDesc:
      'When multiple B-Tree indexes exist, the Oracle optimizer converts each index scan result into a bitmap (BITMAP CONVERSION), then merges them with bitwise operations (BITMAP AND/OR) to isolate matching rows. This processes multiple predicates with far fewer block I/Os than using a single index.',
    indexCombineSteps: [
      { label: '① B-Tree Index Scan',           desc: 'Each predicate is resolved by scanning its corresponding B-Tree index (Range or Unique Scan).' },
      { label: '② BITMAP CONVERSION',           desc: 'The ROWID list from each scan is converted into a bitmap vector — one bit per table row.' },
      { label: '③ BITMAP AND / OR',             desc: 'The bitmaps are merged with bitwise operations. AND = intersection, OR = union.' },
      { label: '④ BITMAP CONVERSION TO ROWIDs', desc: 'Positions with bit=1 in the final bitmap are converted back to ROWIDs to fetch table rows.' },
    ],
    indexCombineWhen: 'When does Index Combine occur?',
    indexCombineWhenItems: [
      'Separate B-Tree indexes exist on two columns and both predicates appear in the WHERE clause.',
      'No composite index covers both columns, or the combine cost is lower than the composite index cost.',
      'Each index has low enough selectivity to significantly reduce the row count on its own.',
    ],

    simulLabel: 'Select columns and predicates, then run the operation to see how Index Combine works step by step.',
    col1Label: 'Condition 1',
    col2Label: 'Condition 2',
    val1Label: 'Value 1',
    val2Label: 'Value 2',
    runBtn: 'Run',
    resetBtn: 'Reset',
    stepLabels: ['① B-Tree Scan 1', '② B-Tree Scan 2', '③ Bitmap Merge', '④ ROWID Convert'],
    resultLabel: 'Result',
    rowidLabel: 'ROWID Conversion',
    rowCountLabel: 'Selected rows',
    planLabel: 'Execution Plan Example',

    bitmapJoinTitle: 'Bitmap Join Index',
    bitmapJoinWhat:
      'A bitmap join index is a bitmap index for the join of two or more tables. ' +
      'Unlike a regular bitmap index built on a single table, a bitmap join index uses a column from a joined table as the index key ' +
      'while storing rowids of the indexed (fact) table. ' +
      'This allows the optimizer to apply the restriction from the joined table before the join is executed.',
    bitmapJoinHow:
      'Consider EMPLOYEES joined to JOBS. The query "How many employees have the job title Accountant?" would normally:\n' +
      '1. Scan JOBS for the Accountant row\n' +
      '2. Join to EMPLOYEES via job_id\n\n' +
      'With a bitmap join index on employees(jobs.job_title), the index already stores which EMPLOYEES rowids correspond to each job_title value. ' +
      'The optimizer can resolve the filter directly from the index without touching either base table.',
    bitmapJoinStructLabel: 'Index Internal Structure',
    bitmapJoinStructDesc:
      'Each leaf entry in the index looks like this:\n' +
      '  [jobs.job_title value]  →  [low employees rowid]  [high employees rowid]  [bitmap]\n\n' +
      'The bitmap encodes which EMPLOYEES rows (within the rowid range) hold that job_title value.',
    bitmapJoinVsLabel: 'Bitmap Join Index vs. Materialized View',
    bitmapJoinVsDesc:
      'Both pre-compute join results, but a bitmap join index is often much more storage-efficient than a materialized join view ' +
      'because it stores only compressed bitmaps rather than full copies of the joined rows.',
    bitmapJoinWhen: 'When to use',
    bitmapJoinWhenItems: [
      'Data warehouse star schemas — frequent equijoins between fact and dimension tables',
      'Consistent join predicate (PK–FK join) with low-cardinality dimension columns',
      'Read-heavy environments — bitmap indexes are not suitable for high-DML workloads',
    ],
    bitmapJoinNote:
      'The index is created on the fact table. The dimension table column is the index key; the fact table rowids are stored in the bitmap.',

    compressionTitle: 'Bitmap Compression — RLE',
    compressionWhat:
      'Storing a raw bitmap requires one bit per table row — a million-row table means a million bits per key value. ' +
      'In practice, low-cardinality data tends to cluster: long runs of 0s broken by clusters of 1s.\n\n' +
      'Oracle compresses these consecutive runs using RLE (Run-Length Encoding): ' +
      '"twelve 0s" → 0×12, "eight 1s" → 1×8. This makes the actual stored bitmap far smaller than the theoretical size.',
    compressionStorageLabel: 'How Leaf Entries Store Bitmaps',
    compressionStorageDesc:
      'A single leaf entry in a bitmap index looks like this:\n\n' +
      '  [key value]  [low rowid]  [high rowid]  [bitmap]\n\n' +
      'The bitmap covers only the rowid range between the low and high values. ' +
      'When a bitmap grows too large, Oracle splits it across multiple entries. ' +
      'Rows outside the range are implicitly 0.',
    compressionExampleLabel: 'Compression Example',
    compressionNote:
      'The lower the cardinality, the more values cluster together and the higher the RLE compression ratio. ' +
      'A GENDER column (M/F) produces long homogeneous runs in each bitmap, compressing extremely well.',
  },
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_SIZE = 16

const COL_OPTIONS = ['GENDER', 'STATUS'] as const
type ColName = typeof COL_OPTIONS[number]

const VAL_OPTIONS: Record<ColName, string[]> = {
  GENDER: ['M', 'F'],
  STATUS: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
}

function buildVectors(table: ReturnType<typeof getLargeTable>, colName: string): BitmapVector[] {
  if (!table) return []
  const rows = table.rows.slice(0, DEMO_SIZE)
  const rawVals = rows.map((r) => String(r[colName]))
  const unique = [...new Set(rawVals)]
  return unique.map((key) => ({
    key,
    bits: rawVals.map((v) => (v === key ? 1 : 0)) as (0 | 1)[],
  }))
}

// ── Main component ────────────────────────────────────────────────────────────

export function BitmapSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const table = getLargeTable('EMPLOYEES')

  const [col1, setCol1] = useState<ColName>('GENDER')
  const [col2, setCol2] = useState<ColName>('STATUS')
  const [val1, setVal1] = useState('M')
  const [val2, setVal2] = useState('ACTIVE')
  const [op, setOp] = useState<MergeOp>('AND')
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0)

  const vec1 = buildVectors(table, col1).find((v) => v.key === val1)
  const vec2 = buildVectors(table, col2).find((v) => v.key === val2)

  const resultBits: (0 | 1)[] = vec1 && vec2
    ? vec1.bits.map((b, i) => (op === 'AND' ? (b & vec2.bits[i]) : (b | vec2.bits[i])) as 0 | 1)
    : []
  const matchedRows = resultBits.map((b, i) => ({ idx: i, match: b === 1 }))
  const matchCount = resultBits.filter((b) => b === 1).length

  function handleCol1Change(v: ColName) { setCol1(v); setVal1(VAL_OPTIONS[v][0]); setPhase(0) }
  function handleCol2Change(v: ColName) { setCol2(v); setVal2(VAL_OPTIONS[v][0]); setPhase(0) }

  async function runSimulation() {
    setPhase(1); await delay(700)
    setPhase(2); await delay(700)
    setPhase(3); await delay(800)
    setPhase(4)
  }

  const rows = table?.rows.slice(0, DEMO_SIZE) ?? []

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayersLinked size={36} stroke={1.5} />}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
      />

      {/* ── 1. 구조 ── */}
      <SectionTitle>{t.structureTitle}</SectionTitle>
      <Prose>{t.structureDesc}</Prose>

      {/* Bitmap vector 시각화 */}
      <div className="mt-4 overflow-x-auto rounded-panel border bg-rail p-5">
        <div className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-ink-2">
          EMPLOYEES — GENDER Bitmap Index ({DEMO_SIZE} rows)
        </div>
        {/* Row numbers */}
        <div className="mb-1 flex items-center gap-2">
          <span className="w-24 shrink-0 font-mono text-[10px] text-ink-2/50">ROW #</span>
          <div className="flex gap-1">
            {rows.map((_, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center font-mono text-[9px] text-ink-2/40">{i + 1}</span>
            ))}
          </div>
        </div>
        {/* Raw data */}
        <div className="mb-3 flex items-center gap-2 border-b pb-3">
          <span className="w-24 shrink-0 font-mono text-[10px] text-ink-2">DATA</span>
          <div className="flex gap-1">
            {rows.map((r, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded bg-rail font-mono text-[9px] font-bold text-ink">
                {String(r['GENDER'])[0]}
              </span>
            ))}
          </div>
        </div>
        {/* Bitmap vectors */}
        {buildVectors(table, 'GENDER').map((vec) => (
          <div key={vec.key} className="mb-1 flex items-center gap-2">
            <span className={cn('w-24 shrink-0 font-mono text-[10px] font-bold', vec.key === 'M' ? 'text-blue' : 'text-red')}>
              {vec.key}
            </span>
            <div className="flex gap-1">
              {vec.bits.map((bit, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded font-mono text-[11px] font-bold',
                    bit === 1
                      ? vec.key === 'M' ? 'bg-blue/10 text-blue' : 'bg-red/10 text-red'
                      : 'bg-rail text-ink-2'
                  )}
                >
                  {bit}
                </motion.div>
              ))}
            </div>
            <span className="font-mono text-[10px] text-ink-2">
              ({vec.bits.filter((b) => b === 1).length} rows)
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <InfoBox variant="warning">{t.structureNote}</InfoBox>
      </div>

      <Divider />

      {/* ── 2. Index Combine ── */}
      <SectionTitle>{t.indexCombineTitle}</SectionTitle>
      <Prose>{t.indexCombineDesc}</Prose>

      {/* 4-step cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.indexCombineSteps.map((step, i) => {
          const colors = [
            { badge: 'bg-blue',    text: 'text-blue'    },
            { badge: 'bg-amber',  text: 'text-amber'  },
            { badge: 'bg-purple',  text: 'text-purple'  },
            { badge: 'bg-green', text: 'text-green' },
          ]
          const c = colors[i]
          return (
            <div key={i} className="relative rounded-panel border bg-paper p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-paper', c.badge)}>
                  {i + 1}
                </span>
                <span className={cn('font-mono text-[10px] font-bold', c.text)}>{step.label}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-2">{step.desc}</p>
              {i < 3 && (
                <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 font-mono text-sm text-ink-2 lg:block">→</span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Simulator ── */}
      <div className="mt-6 rounded-panel border bg-paper p-5 space-y-5">
        <p className="text-[11px] leading-relaxed text-ink-2">{t.simulLabel}</p>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-end gap-2">
            <Picker label={t.col1Label} value={col1} options={[...COL_OPTIONS]} onChange={(v) => handleCol1Change(v as ColName)} />
            <span className="mb-[9px] font-mono text-xs text-ink-2">=</span>
            <Picker label={t.val1Label} value={val1} options={VAL_OPTIONS[col1]} onChange={(v) => { setVal1(v); setPhase(0) }} />
          </div>

          <div className="flex items-end gap-1 pb-[1px]">
            {(['AND', 'OR'] as MergeOp[]).map((o) => (
              <button
                key={o}
                onClick={() => { setOp(o); setPhase(0) }}
                className={cn(
                  'rounded-card px-3 py-[7px] font-mono text-xs font-bold transition',
                  op === o
                    ? o === 'AND' ? 'bg-blue text-paper' : 'bg-purple text-paper'
                    : 'border text-ink-2 hover:text-ink'
                )}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <Picker label={t.col2Label} value={col2} options={[...COL_OPTIONS]} onChange={(v) => handleCol2Change(v as ColName)} />
            <span className="mb-[9px] font-mono text-xs text-ink-2">=</span>
            <Picker label={t.val2Label} value={val2} options={VAL_OPTIONS[col2]} onChange={(v) => { setVal2(v); setPhase(0) }} />
          </div>

          <button
            onClick={runSimulation}
            disabled={phase > 0 && phase < 4}
            className="rounded-card bg-ink px-4 py-[9px] font-mono text-xs font-bold text-paper transition hover:bg-ink disabled:opacity-50"
          >
            {t.runBtn}
          </button>
          <button
            onClick={() => setPhase(0)}
            className="rounded-card border px-4 py-[9px] font-mono text-xs text-ink-2 transition hover:text-ink"
          >
            {t.resetBtn}
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4] as const).map((s) => (
            <div
              key={s}
              className={cn(
                'flex items-center gap-1.5 rounded-card border px-3 py-1.5 transition',
                phase >= s ? 'border-blue/50 bg-blue/5' : 'opacity-35'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full transition', phase >= s ? 'bg-blue' : 'bg-rail-foreground')} />
              <span className="font-mono text-[10px]">{t.stepLabels[s - 1]}</span>
            </div>
          ))}
        </div>

        {/* Bitmap visualization */}
        <div className="space-y-1 overflow-x-auto">
          {/* Row number header */}
          <BitmapRow label="">
            {Array.from({ length: DEMO_SIZE }).map((_, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center font-mono text-[9px] text-ink-2/40">
                {i + 1}
              </span>
            ))}
          </BitmapRow>

          <AnimatePresence>
            {phase >= 1 && vec1 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <BitmapRow label={`${col1} = '${val1}'`} labelColor="text-blue">
                  <BitRow bits={vec1.bits} color="blue" />
                </BitmapRow>
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 2 && (
            <BitmapRow label="">
              <span className={cn('font-mono text-sm font-black leading-none', op === 'AND' ? 'text-blue' : 'text-purple')}>
                {op}
              </span>
            </BitmapRow>
          )}

          <AnimatePresence>
            {phase >= 2 && vec2 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <BitmapRow label={`${col2} = '${val2}'`} labelColor="text-amber">
                  <BitRow bits={vec2.bits} color="orange" />
                </BitmapRow>
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 3 && <div className="border-t" />}

          <AnimatePresence>
            {phase >= 3 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <BitmapRow label={t.resultLabel} labelColor="text-green">
                  <BitRow bits={resultBits} color="emerald" highlight />
                </BitmapRow>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-panel border border-green/30 bg-green/5 p-4"
              >
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-green">
                  {t.rowidLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedRows.filter((r) => r.match).map((r) => (
                    <span key={r.idx} className="rounded bg-green/10 px-2 py-0.5 font-mono text-[10px] text-green">
                      Row {r.idx + 1}
                    </span>
                  ))}
                </div>
                <div className="mt-2 font-mono text-[11px] font-bold text-green">
                  {t.rowCountLabel}: {matchCount}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* When does it occur */}
      <div className="mt-4">
        <InfoBox variant="tip" title={t.indexCombineWhen}>
          <ul className="mt-1 space-y-1">
            {t.indexCombineWhenItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-mono text-red">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </InfoBox>
      </div>

      {/* Execution plan */}
      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
          {t.planLabel}
        </p>
        <ExecutionPlanViewer
          nodes={INDEX_COMBINE_PLAN_NODES}
          stats={INDEX_COMBINE_PLAN_STATS}
          lang={lang}
          defaultTab="plan"
          tabs={['plan', 'rowsource']}
        />
      </div>

      <Divider />

      {/* ── 3. B-Tree vs Bitmap ── */}
      <SectionTitle>{t.vsTitle}</SectionTitle>
      <Table headers={t.vsHeaders} rows={t.vsRows} />

      <Divider />

      {/* ── 4. Bitmap Join Index ── */}
      <SectionTitle>{t.bitmapJoinTitle}</SectionTitle>
      <Prose>{t.bitmapJoinWhat}</Prose>

      {/* 작동 방식 카드 */}
      <div className="mt-4 rounded-panel border bg-paper p-5">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
          {t.bitmapJoinHow.split('\n')[0]}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Without index */}
          <div className="rounded-card border border-red/30 bg-red/5 p-4">
            <div className="mb-2 font-mono text-[10px] font-bold text-red">
              {lang === 'ko' ? '인덱스 없을 때' : 'Without index'}
            </div>
            <ol className="space-y-1.5">
              {(lang === 'ko'
                ? ['JOBS 테이블에서 Accountant 행 찾기', 'EMPLOYEES와 job_id로 조인', '조인된 결과에서 집계']
                : ['Scan JOBS for Accountant rows', 'Join to EMPLOYEES via job_id', 'Aggregate the joined result']
              ).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-ink-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red/15 font-mono text-[9px] font-bold text-red">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          {/* With index */}
          <div className="rounded-card border border-green/30 bg-green/5 p-4">
            <div className="mb-2 font-mono text-[10px] font-bold text-green">
              {lang === 'ko' ? 'Bitmap Join Index 있을 때' : 'With Bitmap Join Index'}
            </div>
            <ol className="space-y-1.5">
              {(lang === 'ko'
                ? ['인덱스에서 job_title = Accountant 비트맵 조회', 'ROWID(행 주소)를 바로 테이블에 적용', '조인 단계 건너뜀']
                : ['Look up job_title = Accountant bitmap in index', 'Apply rowids directly to EMPLOYEES', 'Join step skipped entirely']
              ).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-ink-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green/15 font-mono text-[9px] font-bold text-green">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* CREATE 문 */}
      <div className="mt-4">
        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
          {t.bitmapJoinStructLabel}
        </p>
        <div className="rounded-card bg-rail p-4 font-mono text-[11px] leading-relaxed text-ink whitespace-pre">
          {`-- 인덱스 생성\nCREATE BITMAP INDEX employees_bm_idx\n  ON     employees (jobs.job_title)   -- 키: 다른 테이블 컬럼\n  FROM   employees, jobs              -- 조인 대상\n  WHERE  employees.job_id = jobs.job_id;  -- 조인 조건\n\n-- 이 인덱스가 도움이 되는 쿼리\nSELECT COUNT(*)\nFROM   employees, jobs\nWHERE  employees.job_id = jobs.job_id\nAND    jobs.job_title   = 'Accountant';`}
        </div>
      </div>

      {/* 내부 구조 */}
      <div className="mt-4 rounded-panel border bg-rail p-4">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
          {t.bitmapJoinStructDesc.split('\n')[0]}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[10px]">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-1.5 text-left text-ink-2">jobs.job_title</th>
                <th className="px-3 py-1.5 text-left text-ink-2">low rowid</th>
                <th className="px-3 py-1.5 text-left text-ink-2">high rowid</th>
                <th className="px-3 py-1.5 text-left text-ink-2">bitmap</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Accountant',           'AAAQNK…ABSAAj', 'AAAQNK…ABSAAp', '10110010'],
                ['Accountant',           'AAAQNK…ABSAAq', 'AAAQNK…ABSAAz', '01001100'],
                ['Accounting Manager',   'AAAQNK…ABTAAa', 'AAAQNK…ABTAAh', '10000001'],
                ['Administration Asst.', 'AAAQNK…ABTAAi', 'AAAQNK…ABTAAp', '00100000'],
              ].map(([key, lo, hi, bm], i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-1.5 font-bold text-blue">{key}</td>
                  <td className="px-3 py-1.5 text-ink-2">{lo}</td>
                  <td className="px-3 py-1.5 text-ink-2">{hi}</td>
                  <td className="px-3 py-1.5">
                    <span className="rounded bg-rail px-1.5 py-0.5">{bm}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* vs Materialized View + When to use */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-panel border bg-paper p-4">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
            {t.bitmapJoinVsLabel}
          </p>
          <p className="text-[11px] leading-relaxed text-ink-2">{t.bitmapJoinVsDesc}</p>
        </div>
        <InfoBox variant="tip" title={t.bitmapJoinWhen}>
          <ul className="mt-1 space-y-1">
            {t.bitmapJoinWhenItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 shrink-0 font-mono text-red">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </InfoBox>
      </div>

      <div className="mt-4">
        <InfoBox variant="note">{t.bitmapJoinNote}</InfoBox>
      </div>

      <Divider />

      {/* ── 5. Bitmap Compression ── */}
      <SectionTitle>{t.compressionTitle}</SectionTitle>
      <Prose>{t.compressionWhat}</Prose>

      {/* 압축 시각화 */}
      <div className="mt-4 rounded-panel border bg-paper p-5">
        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
          {t.compressionExampleLabel}
        </p>

        {/* 시나리오: GENDER = 'M' 비트맵 (26행) */}
        <div className="space-y-4">
          {/* Raw */}
          <div>
            <div className="mb-1.5 font-mono text-[10px] text-ink-2">
              {lang === 'ko' ? '원본 비트맵 (26비트, GENDER = \'M\')' : "Raw bitmap (26 bits, GENDER = 'M')"}
            </div>
            <div className="flex flex-wrap gap-px">
              {[0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0].map((b, i) => (
                <div key={i} className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-chip font-mono text-[9px] font-bold',
                  b === 1 ? 'bg-blue/10 text-blue' : 'bg-rail text-ink-2/50'
                )}>{b}</div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
            <div className="flex items-center gap-1.5 rounded-full border bg-rail px-3 py-1 font-mono text-[10px] text-ink-2">
              <span>RLE</span>
            </div>
            <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
          </div>

          {/* Compressed */}
          <div>
            <div className="mb-1.5 font-mono text-[10px] text-ink-2">
              {lang === 'ko' ? '압축 결과 — 26비트 → 5개 청크' : 'Compressed — 26 bits → 5 chunks'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { bits: '0×4', color: 'bg-rail text-ink-2' },
                { bits: '1×2', color: 'bg-blue/10 text-blue' },
                { bits: '0×10', color: 'bg-rail text-ink-2' },
                { bits: '1×4', color: 'bg-blue/10 text-blue' },
                { bits: '0×6', color: 'bg-rail text-ink-2' },
              ].map((chunk, i) => (
                <span key={i} className={cn('rounded px-3 py-1.5 font-mono text-[11px] font-bold', chunk.color)}>
                  {chunk.bits}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 저장 구조 */}
      <div className="mt-4">
        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
          {t.compressionStorageLabel}
        </p>
        <div className="rounded-card bg-rail p-4 font-mono text-[11px] leading-relaxed text-ink whitespace-pre">
          {lang === 'ko'
            ? `-- Leaf 블록 엔트리 구조\n[키 값]  [시작 ROWID]  [끝 ROWID]  [RLE 압축 비트맵]\n\n예)\nShipping Clerk, AAAPzR…ABSABQ, AAAPzR…ABSABZ, 0010000100\nShipping Clerk, AAAPzR…ABSABa, AAAPzR…ABSABh, 010010\nStock Clerk,    AAAPzR…ABSAAa, AAAPzR…ABSAAc, 1001001100\nStock Clerk,    AAAPzR…ABSAAd, AAAPzR…ABSAAt, 0101001001`
            : `-- Leaf block entry structure\n[key value]  [low rowid]  [high rowid]  [RLE-compressed bitmap]\n\ne.g.\nShipping Clerk, AAAPzR…ABSABQ, AAAPzR…ABSABZ, 0010000100\nShipping Clerk, AAAPzR…ABSABa, AAAPzR…ABSABh, 010010\nStock Clerk,    AAAPzR…ABSAAa, AAAPzR…ABSAAc, 1001001100\nStock Clerk,    AAAPzR…ABSAAd, AAAPzR…ABSAAt, 0101001001`}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-2">{t.compressionStorageDesc}</p>
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">{t.compressionNote}</InfoBox>
      </div>
    </PageContainer>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BIT_COLOR: Record<string, { one: string; zero: string }> = {
  blue:    { one: 'bg-blue/10 text-blue',       zero: 'bg-rail text-ink-2/50' },
  orange:  { one: 'bg-amber/10 text-amber',   zero: 'bg-rail text-ink-2/50' },
  emerald: { one: 'bg-green/15 text-green', zero: 'bg-rail text-ink-2/30' },
}

// 모든 비트맵 행이 동일한 레이아웃을 공유해 세로 정렬이 맞음
function BitmapRow({ label, labelColor, children }: {
  label: string
  labelColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center">
      <span className={cn('w-44 shrink-0 font-mono text-[10px] font-bold', labelColor ?? 'text-ink-2/40')}>
        {label}
      </span>
      <div className="flex gap-1">{children}</div>
    </div>
  )
}

function BitRow({ bits, color, highlight }: { bits: (0 | 1)[]; color: string; highlight?: boolean }) {
  const c = BIT_COLOR[color] ?? BIT_COLOR.blue
  return (
    <>
      {bits.map((b, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.025, duration: 0.18 }}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded font-mono text-[11px] font-bold',
            b === 1 ? c.one : c.zero,
            highlight && b === 1 ? 'ring-2 ring-green/50' : ''
          )}
        >
          {b}
        </motion.div>
      ))}
    </>
  )
}

function Picker({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] text-ink-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-card border bg-paper px-3 py-1.5 font-mono text-xs"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

// ── Execution plan data ────────────────────────────────────────────────────────

const INDEX_COMBINE_PLAN_NODES: PlanNode[] = [
  { id: 1, parentId: null, operation: 'SELECT STATEMENT',   cost: 7, estimatedRows: 52 },
  { id: 2, parentId: 1,    operation: 'TABLE ACCESS', options: 'BY INDEX ROWID BATCHED', objectName: 'EMPLOYEES', objectType: 'TABLE', cost: 7, estimatedRows: 52, bytes: 2132 },
  { id: 3, parentId: 2,    operation: 'BITMAP CONVERSION',  options: 'TO ROWIDS',   cost: 3, estimatedRows: 52 },
  { id: 4, parentId: 3,    operation: 'BITMAP AND',                                  cost: 3, estimatedRows: 52 },
  { id: 5, parentId: 4,    operation: 'BITMAP CONVERSION',  options: 'FROM ROWIDS', cost: 1, estimatedRows: 500, accessPredicates: '"GENDER"=\'M\'' },
  { id: 6, parentId: 5,    operation: 'INDEX', options: 'RANGE SCAN', objectName: 'IDX_EMP_GENDER', objectType: 'INDEX', cost: 1, estimatedRows: 500, ioCost: 1, cpuCost: 0 },
  { id: 7, parentId: 4,    operation: 'BITMAP CONVERSION',  options: 'FROM ROWIDS', cost: 1, estimatedRows: 200, accessPredicates: '"STATUS"=\'ACTIVE\'' },
  { id: 8, parentId: 7,    operation: 'INDEX', options: 'RANGE SCAN', objectName: 'IDX_EMP_STATUS', objectType: 'INDEX', cost: 1, estimatedRows: 200, ioCost: 1, cpuCost: 0 },
]

const INDEX_COMBINE_PLAN_STATS: PlanStats = {
  sql: "SELECT * FROM employees WHERE gender = 'M' AND status = 'ACTIVE'",
  sqlId: 'a7k2mfpq4x9w1',
  optimizerMode: 'ALL_ROWS',
  optimizerCost: 7,
  optimizerRows: 52,
  predInfo: [
    "access(\"GENDER\"='M')",
    "access(\"STATUS\"='ACTIVE')",
  ],
  note: [
    'Two separate B-Tree indexes converted to bitmaps and merged via BITMAP AND.',
    'Index Combine chosen over composite index scan — lower I/O cost for this selectivity.',
  ],
}
