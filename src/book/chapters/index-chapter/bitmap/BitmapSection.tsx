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
      'Bitmap 인덱스는 저카디널리티 컬럼(성별, 상태 코드 등 고유값이 적은 컬럼)에 최적화된 인덱스입니다. ' +
      '각 고유값마다 0/1 비트 배열을 유지하고, 복수 조건을 비트 연산으로 초고속 병합합니다.',

    structureTitle: 'Bitmap 인덱스란?',
    structureDesc:
      '각 고유 값마다 하나의 비트맵 벡터(0/1 배열)를 유지합니다. 각 비트는 테이블의 한 행에 대응하며, 해당 행의 컬럼 값이 이 키와 일치하면 1, 아니면 0입니다. 비트맵은 내부적으로 B-Tree 구조에 저장되어 키 범위 접근이 가능합니다.',
    structureNote:
      'Bitmap 인덱스는 OLAP / Data Warehouse 환경에 적합합니다. DML(INSERT/UPDATE/DELETE) 시 해당 키의 비트맵 전체에 잠금이 걸리므로 OLTP 환경에서는 사용하지 않는 것이 좋습니다.',

    vsTitle: 'B-Tree vs Bitmap',
    vsHeaders: ['항목', 'B-Tree', 'Bitmap'],
    vsRows: [
      ['카디널리티',        '고카디널리티 (많은 고유값)',          '저카디널리티 (적은 고유값)'],
      ['NULL 인덱싱',      '❌ 모든 키가 NULL인 행 제외',          '✓ NULL도 하나의 키로 인덱싱'],
      ['공간 효율',         '저카디널리티에서 낭비',                '저카디널리티에서 매우 효율적'],
      ['DML 성능',         '행 단위 빠른 갱신',                    '행 수정 시 전체 비트맵 잠금 (OLTP 비권장)'],
      ['복수 조건 AND/OR', '각 인덱스 → 병합 처리',               '비트 연산으로 초고속 병합'],
      ['사용 환경',         'OLTP',                                 'OLAP / DW'],
    ],

    indexCombineTitle: 'Index Combine',
    indexCombineDesc:
      'Oracle 옵티마이저는 여러 B-Tree 인덱스가 존재할 때 각각을 비트맵으로 변환(BITMAP CONVERSION)한 뒤 비트 연산으로 병합(BITMAP AND/OR)하여 조건을 충족하는 행만 선별합니다. 인덱스 하나만 사용할 때보다 훨씬 적은 블록 I/O로 복수 조건을 처리할 수 있습니다.',
    indexCombineSteps: [
      { label: '① B-Tree Index Scan',           desc: '각 조건에 맞는 B-Tree 인덱스를 개별적으로 Range/Unique 스캔합니다.' },
      { label: '② BITMAP CONVERSION',           desc: '스캔 결과 ROWID 목록을 비트맵 벡터로 변환합니다. 각 비트는 테이블 행 한 개에 대응합니다.' },
      { label: '③ BITMAP AND / OR',             desc: '변환된 비트맵들을 비트 연산으로 병합합니다. AND는 교집합, OR은 합집합입니다.' },
      { label: '④ BITMAP CONVERSION TO ROWIDS', desc: '최종 비트맵에서 1인 위치를 ROWID로 역변환하여 테이블 행을 읽습니다.' },
    ],
    indexCombineWhen: 'Index Combine은 언제 선택되나?',
    indexCombineWhenItems: [
      '두 컬럼에 별도 B-Tree 인덱스가 존재하고, 두 조건 모두 WHERE 절에 사용될 때',
      '복합 인덱스(Composite Index)가 없거나, 복합 인덱스보다 Combine 비용이 낮을 때',
      '각 인덱스의 선택도가 낮아 단독 스캔만으로 행 수를 크게 줄일 수 있을 때',
    ],

    simulLabel: '컬럼과 조건을 선택하고 연산을 실행하면 Index Combine이 내부적으로 어떻게 동작하는지 단계별로 확인할 수 있습니다.',
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

    bitmapJoinTitle: 'Bitmap Join Index',
    bitmapJoinDesc:
      '조인 대상 테이블의 컬럼 값으로 비트맵을 생성합니다. 예: ORDERS.STATUS를 기반으로 CUSTOMERS 테이블 행을 비트맵으로 표현 — 조인 없이 빠른 필터링이 가능합니다.',
    compressionTitle: '비트맵 압축 (RLE)',
    compressionDesc:
      'Oracle은 연속된 0 또는 1 구간을 RLE(Run-Length Encoding)로 압축합니다. 실제 데이터에서 비트맵 크기는 이론적 크기보다 훨씬 작습니다.',
  },
  en: {
    pageTitle: 'Bitmap Index',
    pageSubtitle:
      'A bitmap index is optimized for low-cardinality columns (e.g., gender, status code) with few distinct values. ' +
      'It maintains a 0/1 bit array per distinct value and merges multiple predicates ultra-fast with bitwise operations.',

    structureTitle: 'What is a Bitmap Index?',
    structureDesc:
      'For each distinct value, a bitmap vector (array of 0/1) is maintained. Each bit corresponds to one row in the table — 1 if that row matches this key value, 0 otherwise. Bitmaps are internally stored in a B-Tree structure for key-range access.',
    structureNote:
      'Bitmap indexes are suited for OLAP / Data Warehouse workloads. DML (INSERT/UPDATE/DELETE) acquires a lock on the entire bitmap for the affected key, making them unsuitable for OLTP environments.',

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
    bitmapJoinDesc:
      'A bitmap index built on a column from a joined table. E.g., a bitmap on ORDERS.STATUS for rows in the CUSTOMERS table — enables filtering without the join.',
    compressionTitle: 'Bitmap Compression (RLE)',
    compressionDesc:
      'Oracle compresses consecutive runs of 0s or 1s using RLE (Run-Length Encoding). In real data, actual bitmap storage is far smaller than the theoretical size.',
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
      <div className="mt-4 overflow-x-auto rounded-xl border bg-muted/20 p-5">
        <div className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          EMPLOYEES — GENDER Bitmap Index ({DEMO_SIZE} rows)
        </div>
        {/* Row numbers */}
        <div className="mb-1 flex items-center gap-2">
          <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground/50">ROW #</span>
          <div className="flex gap-1">
            {rows.map((_, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center font-mono text-[9px] text-muted-foreground/40">{i + 1}</span>
            ))}
          </div>
        </div>
        {/* Raw data */}
        <div className="mb-3 flex items-center gap-2 border-b pb-3">
          <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">DATA</span>
          <div className="flex gap-1">
            {rows.map((r, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded bg-muted font-mono text-[9px] font-bold text-foreground">
                {String(r['GENDER'])[0]}
              </span>
            ))}
          </div>
        </div>
        {/* Bitmap vectors */}
        {buildVectors(table, 'GENDER').map((vec) => (
          <div key={vec.key} className="mb-1 flex items-center gap-2">
            <span className={cn('w-24 shrink-0 font-mono text-[10px] font-bold', vec.key === 'M' ? 'text-blue-600' : 'text-rose-600')}>
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
                      ? vec.key === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                      : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  {bit}
                </motion.div>
              ))}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
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
            { badge: 'bg-blue-500',    text: 'text-blue-700'    },
            { badge: 'bg-orange-500',  text: 'text-orange-700'  },
            { badge: 'bg-purple-500',  text: 'text-purple-700'  },
            { badge: 'bg-emerald-500', text: 'text-emerald-700' },
          ]
          const c = colors[i]
          return (
            <div key={i} className="relative rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white', c.badge)}>
                  {i + 1}
                </span>
                <span className={cn('font-mono text-[10px] font-bold', c.text)}>{step.label}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{step.desc}</p>
              {i < 3 && (
                <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 font-mono text-sm text-muted-foreground lg:block">→</span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Simulator ── */}
      <div className="mt-6 rounded-xl border bg-card p-5 space-y-5">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t.simulLabel}</p>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-end gap-2">
            <Picker label={t.col1Label} value={col1} options={[...COL_OPTIONS]} onChange={(v) => handleCol1Change(v as ColName)} />
            <span className="mb-[9px] font-mono text-xs text-muted-foreground">=</span>
            <Picker label={t.val1Label} value={val1} options={VAL_OPTIONS[col1]} onChange={(v) => { setVal1(v); setPhase(0) }} />
          </div>

          <div className="flex items-end gap-1 pb-[1px]">
            {(['AND', 'OR'] as MergeOp[]).map((o) => (
              <button
                key={o}
                onClick={() => { setOp(o); setPhase(0) }}
                className={cn(
                  'rounded-lg px-3 py-[7px] font-mono text-xs font-bold transition',
                  op === o
                    ? o === 'AND' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                    : 'border text-muted-foreground hover:text-foreground'
                )}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <Picker label={t.col2Label} value={col2} options={[...COL_OPTIONS]} onChange={(v) => handleCol2Change(v as ColName)} />
            <span className="mb-[9px] font-mono text-xs text-muted-foreground">=</span>
            <Picker label={t.val2Label} value={val2} options={VAL_OPTIONS[col2]} onChange={(v) => { setVal2(v); setPhase(0) }} />
          </div>

          <button
            onClick={runSimulation}
            disabled={phase > 0 && phase < 4}
            className="rounded-lg bg-slate-800 px-4 py-[9px] font-mono text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {t.runBtn}
          </button>
          <button
            onClick={() => setPhase(0)}
            className="rounded-lg border px-4 py-[9px] font-mono text-xs text-muted-foreground transition hover:text-foreground"
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
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition',
                phase >= s ? 'border-blue-300 bg-blue-50' : 'opacity-35'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full transition', phase >= s ? 'bg-blue-500' : 'bg-muted-foreground')} />
              <span className="font-mono text-[10px]">{t.stepLabels[s - 1]}</span>
            </div>
          ))}
        </div>

        {/* Bitmap visualization */}
        <div className="space-y-1 overflow-x-auto">
          {/* Row number header */}
          <BitmapRow label="">
            {Array.from({ length: DEMO_SIZE }).map((_, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center font-mono text-[9px] text-muted-foreground/40">
                {i + 1}
              </span>
            ))}
          </BitmapRow>

          <AnimatePresence>
            {phase >= 1 && vec1 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <BitmapRow label={`${col1} = '${val1}'`} labelColor="text-blue-700">
                  <BitRow bits={vec1.bits} color="blue" />
                </BitmapRow>
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 2 && (
            <BitmapRow label="">
              <span className={cn('font-mono text-sm font-black leading-none', op === 'AND' ? 'text-blue-600' : 'text-purple-600')}>
                {op}
              </span>
            </BitmapRow>
          )}

          <AnimatePresence>
            {phase >= 2 && vec2 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <BitmapRow label={`${col2} = '${val2}'`} labelColor="text-orange-700">
                  <BitRow bits={vec2.bits} color="orange" />
                </BitmapRow>
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 3 && <div className="border-t" />}

          <AnimatePresence>
            {phase >= 3 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <BitmapRow label={t.resultLabel} labelColor="text-emerald-700">
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
                className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"
              >
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  {t.rowidLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedRows.filter((r) => r.match).map((r) => (
                    <span key={r.idx} className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] text-emerald-800">
                      Row {r.idx + 1}
                    </span>
                  ))}
                </div>
                <div className="mt-2 font-mono text-[11px] font-bold text-emerald-700">
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
                <span className="mt-0.5 shrink-0 font-mono text-rose-400">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </InfoBox>
      </div>

      {/* Execution plan */}
      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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

      {/* ── 4. Bitmap Join Index + Compression ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <SectionTitle>{t.bitmapJoinTitle}</SectionTitle>
          <Prose>{t.bitmapJoinDesc}</Prose>
          <div className="mt-3 rounded-lg bg-muted/40 p-3 font-mono text-[10px] text-foreground leading-relaxed whitespace-pre">
            {`CREATE BITMAP INDEX ord_cust_status_bix\n  ON orders(customers.status)\n  FROM orders, customers\n  WHERE orders.customer_id = customers.customer_id;`}
          </div>
        </div>

        <div>
          <SectionTitle>{t.compressionTitle}</SectionTitle>
          <Prose>{t.compressionDesc}</Prose>
          <div className="mt-3 space-y-2">
            <div>
              <div className="mb-1 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '원본 비트맵' : 'Raw bitmap'}</div>
              <div className="flex flex-wrap gap-px">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className={cn('flex h-5 w-5 items-center justify-center rounded-sm font-mono text-[9px]',
                    i < 12 ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
                  )}>{i < 12 ? 0 : 1}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 border-t border-dashed" />
              <span className="font-mono text-[10px] text-muted-foreground">RLE</span>
              <div className="h-px flex-1 border-t border-dashed" />
            </div>
            <div>
              <div className="mb-1 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '압축 결과' : 'Compressed'}</div>
              <div className="flex gap-2">
                <span className="rounded bg-muted px-2 py-1 font-mono text-[10px]">0×12</span>
                <span className="rounded bg-blue-100 px-2 py-1 font-mono text-[10px] text-blue-700">1×8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BIT_COLOR: Record<string, { one: string; zero: string }> = {
  blue:    { one: 'bg-blue-100 text-blue-700',       zero: 'bg-muted/60 text-muted-foreground/50' },
  orange:  { one: 'bg-orange-100 text-orange-700',   zero: 'bg-muted/60 text-muted-foreground/50' },
  emerald: { one: 'bg-emerald-200 text-emerald-800', zero: 'bg-muted/60 text-muted-foreground/30' },
}

// 모든 비트맵 행이 동일한 레이아웃을 공유해 세로 정렬이 맞음
function BitmapRow({ label, labelColor, children }: {
  label: string
  labelColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center">
      <span className={cn('w-44 shrink-0 font-mono text-[10px] font-bold', labelColor ?? 'text-muted-foreground/40')}>
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
            highlight && b === 1 ? 'ring-2 ring-emerald-400' : ''
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
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
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
