import { useState } from 'react'
import { cn } from '@/lib/utils'

// ── ExplainPlanTable ──────────────────────────────────────────────────────────
// 실행 계획 출력을 시각화하는 공통 컴포넌트.
// operation은 들여쓰기(depth)에 따라 시각적으로 계층 표현.
// 행 클릭 시 해당 오퍼레이션 설명 팝업.

export interface PlanRow {
  id: number
  depth: number          // 들여쓰기 깊이 (0 = 루트)
  operation: string      // 예: 'TABLE ACCESS FULL'
  name?: string          // 예: 'EMPLOYEES'
  rows?: number          // E-Rows (추정 반환 행 수)
  bytes?: number         // 추정 바이트
  cost?: number          // 추정 비용
  time?: string          // 예: '00:00:01'
  // Row Source Statistics (SET AUTOTRACE TRACEONLY / DBMS_XPLAN ALLSTATS)
  actualRows?: number    // A-Rows
  cr?: number            // Consistent Reads (논리 읽기)
  pr?: number            // Physical Reads (물리 읽기)
  pw?: number            // Physical Writes
  elapsed?: string       // 경과 시간
  note?: string          // 행 설명 (ko/en 분리 필요 시 상위에서 처리)
}

const OP_COLOR: Record<string, string> = {
  'SELECT STATEMENT':            '#3b82f6',
  'HASH JOIN':                   '#7c3aed',
  'NESTED LOOPS':                '#7c3aed',
  'SORT MERGE JOIN':             '#7c3aed',
  'MERGE JOIN':                  '#7c3aed',
  'TABLE ACCESS FULL':           '#ea580c',
  'TABLE ACCESS BY INDEX ROWID': '#f59e0b',
  'INDEX RANGE SCAN':            '#16a34a',
  'INDEX UNIQUE SCAN':           '#16a34a',
  'INDEX FULL SCAN':             '#16a34a',
  'INDEX FAST FULL SCAN':        '#16a34a',
  'INDEX SKIP SCAN':             '#16a34a',
  'SORT ORDER BY':               '#0891b2',
  'SORT GROUP BY':               '#0891b2',
  'FILTER':                      '#64748b',
  'VIEW':                        '#8b5cf6',
}

function opColor(op: string): string {
  for (const key of Object.keys(OP_COLOR)) {
    if (op.startsWith(key)) return OP_COLOR[key]
  }
  return '#64748b'
}

export function ExplainPlanTable({
  rows,
  showStats = false,
  caption,
}: {
  rows: PlanRow[]
  showStats?: boolean  // A-Rows, CR, PR, PW, Elapsed 컬럼 표시 여부
  caption?: string
}) {
  const [activeId, setActiveId] = useState<number | null>(null)

  const baseHeaders = ['Id', 'Operation', 'Name', 'Rows', 'Cost']
  const statHeaders = ['A-Rows', 'CR', 'PR', 'PW', 'Time']
  const headers = showStats ? [...baseHeaders, ...statHeaders] : baseHeaders

  return (
    <div className="my-4">
      {caption && (
        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{caption}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="border-b border-slate-700">
              {headers.map(h => (
                <th key={h} className="px-3 py-2 text-slate-400 font-bold">{h}</th>
              ))}
              <th className="px-3 py-2 text-slate-400 font-bold">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const color = opColor(row.operation)
              const isActive = activeId === row.id
              return (
                <>
                  <tr
                    key={row.id}
                    onClick={() => setActiveId(isActive ? null : row.id)}
                    className={cn(
                      'cursor-pointer border-b border-slate-800 transition-colors',
                      isActive ? 'bg-slate-700' : 'hover:bg-slate-800',
                    )}
                  >
                    {/* Id */}
                    <td className="px-3 py-1.5 text-slate-400">{row.id}</td>
                    {/* Operation — 들여쓰기 */}
                    <td className="px-3 py-1.5" style={{ paddingLeft: `${12 + row.depth * 16}px` }}>
                      <span className="font-bold" style={{ color }}>{row.operation}</span>
                    </td>
                    {/* Name */}
                    <td className="px-3 py-1.5 text-slate-300">{row.name ?? ''}</td>
                    {/* Rows (E-Rows) */}
                    <td className="px-3 py-1.5 text-amber-300">{row.rows?.toLocaleString() ?? ''}</td>
                    {/* Cost */}
                    <td className="px-3 py-1.5 text-slate-300">{row.cost ?? ''}</td>
                    {showStats && (
                      <>
                        <td className="px-3 py-1.5 text-emerald-300">{row.actualRows?.toLocaleString() ?? ''}</td>
                        <td className="px-3 py-1.5 text-sky-300">{row.cr?.toLocaleString() ?? ''}</td>
                        <td className="px-3 py-1.5 text-rose-300">{row.pr?.toLocaleString() ?? ''}</td>
                        <td className="px-3 py-1.5 text-slate-400">{row.pw?.toLocaleString() ?? ''}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.elapsed ?? ''}</td>
                      </>
                    )}
                    {/* Note */}
                    <td className="px-3 py-1.5 text-slate-500 text-[10px]">{row.note ?? ''}</td>
                  </tr>
                  {isActive && row.note && (
                    <tr key={`${row.id}-desc`} className="bg-slate-800">
                      <td colSpan={headers.length + 1} className="px-4 py-2 text-[11px] text-slate-300 leading-relaxed">
                        <span className="font-bold" style={{ color }}>▶ {row.operation}</span>
                        {row.name && <span className="text-slate-400"> ({row.name})</span>}
                        <span className="ml-2">{row.note}</span>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">클릭하면 해당 오퍼레이션 설명을 볼 수 있습니다.</p>
    </div>
  )
}

// ── SQL Processing Pipeline Diagram ──────────────────────────────────────────

export function SqlPipelineDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const stages = [
    {
      num: '1',
      color: '#3b82f6',
      bg: '#eff6ff',
      border: '#93c5fd',
      label: isKo ? '파싱\n(Parsing)' : 'Parsing',
      subs: isKo
        ? ['구문 검사', '의미 검사', 'Shared Pool 확인']
        : ['Syntax check', 'Semantic check', 'Shared pool check'],
    },
    {
      num: '2',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      border: '#c4b5fd',
      label: isKo ? '최적화\n(Optimization)' : 'Optimization',
      subs: ['Query Transformer', 'Estimator', 'Plan Generator'],
    },
    {
      num: '3',
      color: '#f59e0b',
      bg: '#fffbeb',
      border: '#fcd34d',
      label: isKo ? '행 소스 생성\n(Row Source Gen)' : 'Row Source\nGeneration',
      subs: isKo ? ['반복 쿼리 계획 생성', '행 소스 트리 구성'] : ['Iterative query plan', 'Row source tree'],
    },
    {
      num: '4',
      color: '#10b981',
      bg: '#ecfdf5',
      border: '#6ee7b7',
      label: isKo ? '실행\n(Execution)' : 'Execution',
      subs: isKo
        ? ['디스크→메모리 읽기', '락/래치 획득', '변경 로깅']
        : ['Disk → memory read', 'Locks & latches', 'Change logging'],
    },
  ]

  // Layout: badge(r=13) centered at top of box, then title text, then sub items
  const BOX_W = 150
  const BOX_H = 124
  const GAP = 32
  const BADGE_R = 13
  const BOX_TOP = BADGE_R + 4          // box starts just below badge center
  const TOTAL_W = stages.length * BOX_W + (stages.length - 1) * GAP + 32
  const SVG_H = BOX_TOP + BOX_H + 8   // total height

  return (
    <div className="my-6 overflow-x-auto">
      <svg
        viewBox={`0 0 ${TOTAL_W} ${SVG_H}`}
        width={TOTAL_W}
        height={SVG_H}
        className="mx-auto block"
        style={{ maxWidth: '100%' }}
      >
        {/* Boxes, badges, labels */}
        {stages.map((s, i) => {
          const x = 16 + i * (BOX_W + GAP)
          const cx = x + BOX_W / 2
          const LABEL_Y0 = BOX_TOP + BADGE_R + 14
          const labelLines = s.label.split('\n')
          const SUBS_Y0 = LABEL_Y0 + labelLines.length * 16 + 10

          return (
            <g key={i}>
              {/* Box */}
              <rect x={x} y={BOX_TOP} width={BOX_W} height={BOX_H} rx={10} fill={s.bg} stroke={s.border} strokeWidth={1.5} />

              {/* Step badge — sits on top edge of box */}
              <circle cx={cx} cy={BOX_TOP} r={BADGE_R} fill={s.color} />
              <text x={cx} y={BOX_TOP + 5} textAnchor="middle" fontSize={12} fontWeight="bold" fill="white">{s.num}</text>

              {/* Stage label */}
              {labelLines.map((line, li) => (
                <text key={li} x={cx} y={LABEL_Y0 + li * 16} textAnchor="middle" fontSize={12} fontWeight="600" fill={s.color}>{line}</text>
              ))}

              {/* Sub items */}
              {s.subs.map((sub, si) => (
                <text key={si} x={cx} y={SUBS_Y0 + si * 16} textAnchor="middle" fontSize={10} fill="#64748b">{sub}</text>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── CBO Internal Architecture Diagram ────────────────────────────────────────

export function CboArchDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const BOX_Y = 30, BOX_H = 200, BOX_W = 130, BOX_GAP = 24
  const INPUT_X = 10, INPUT_W = 90, INPUT_H = 60
  const INPUT_Y = BOX_Y + BOX_H / 2 - INPUT_H / 2   // vertically centered with the 3 boxes
  const OUTPUT_W = 90, OUTPUT_H = 60
  const BOX1_X = INPUT_X + INPUT_W + 28
  const BOX2_X = BOX1_X + BOX_W + BOX_GAP
  const BOX3_X = BOX2_X + BOX_W + BOX_GAP
  const OUTPUT_X = BOX3_X + BOX_W + 28
  const OUTPUT_Y = BOX_Y + BOX_H / 2 - OUTPUT_H / 2 // vertically centered with the 3 boxes
  const STATS_X = BOX2_X - 10, STATS_Y = BOX_Y + BOX_H + 20
  const STATS_W = BOX_W + 20, STATS_H = 40
  const SVG_W_CALC = OUTPUT_X + OUTPUT_W + 10
  const SVG_H = STATS_Y + STATS_H + 12

  return (
    <div className="my-6 overflow-x-auto">
      <svg viewBox={`0 0 ${SVG_W_CALC} ${SVG_H}`} width={SVG_W_CALC} height={SVG_H} className="mx-auto block" style={{ maxWidth: '100%' }}>
        <defs>
          <marker id="cbo-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#94a3b8" />
          </marker>
          <marker id="cbo-arrow-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>

        {/* Input */}
        <rect x={INPUT_X} y={INPUT_Y} width={INPUT_W} height={INPUT_H} rx={8} fill="#f0f9ff" stroke="#7dd3fc" strokeWidth={1.5} />
        <text x={INPUT_X + INPUT_W / 2} y={INPUT_Y + 22} textAnchor="middle" fontSize={11} fontWeight="600" fill="#0369a1">{isKo ? '파싱된' : 'Parsed'}</text>
        <text x={INPUT_X + INPUT_W / 2} y={INPUT_Y + 37} textAnchor="middle" fontSize={11} fontWeight="600" fill="#0369a1">{isKo ? '쿼리' : 'Query'}</text>
        <line x1={INPUT_X + INPUT_W} y1={INPUT_Y + INPUT_H / 2} x2={BOX1_X - 4} y2={INPUT_Y + INPUT_H / 2} stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#cbo-arrow)" />

        {/* BOX1: Query Transformer */}
        <rect x={BOX1_X} y={BOX_Y} width={BOX_W} height={BOX_H} rx={10} fill="#eff6ff" stroke="#93c5fd" strokeWidth={1.5} />
        <rect x={BOX1_X} y={BOX_Y} width={BOX_W} height={32} rx={10} fill="#3b82f6" />
        <rect x={BOX1_X} y={BOX_Y + 22} width={BOX_W} height={10} fill="#3b82f6" />
        <text x={BOX1_X + BOX_W / 2} y={BOX_Y + 20} textAnchor="middle" fontSize={11} fontWeight="bold" fill="white">Query Transformer</text>
        {[isKo ? '서브쿼리 Unnesting' : 'Subquery Unnesting', isKo ? '뷰 Merging' : 'View Merging', isKo ? 'Predicate Pushdown' : 'Predicate Pushdown', isKo ? '쿼리 재작성' : 'Query Rewriting'].map((txt, i) => (
          <text key={i} x={BOX1_X + BOX_W / 2} y={BOX_Y + 54 + i * 22} textAnchor="middle" fontSize={10} fill="#1e40af">{txt}</text>
        ))}
        <line x1={BOX1_X + BOX_W} y1={BOX_Y + BOX_H / 2} x2={BOX2_X - 4} y2={BOX_Y + BOX_H / 2} stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#cbo-arrow)" />

        {/* BOX2: Estimator */}
        <rect x={BOX2_X} y={BOX_Y} width={BOX_W} height={BOX_H} rx={10} fill="#f5f3ff" stroke="#c4b5fd" strokeWidth={1.5} />
        <rect x={BOX2_X} y={BOX_Y} width={BOX_W} height={32} rx={10} fill="#7c3aed" />
        <rect x={BOX2_X} y={BOX_Y + 22} width={BOX_W} height={10} fill="#7c3aed" />
        <text x={BOX2_X + BOX_W / 2} y={BOX_Y + 20} textAnchor="middle" fontSize={11} fontWeight="bold" fill="white">Estimator</text>
        {[isKo ? '선택도(Selectivity)' : 'Selectivity', isKo ? '카디널리티(Cardinality)' : 'Cardinality', isKo ? '비용(Cost)' : 'Cost', isKo ? '→ 최소 비용 선택' : '→ Pick lowest cost'].map((txt, i) => (
          <text key={i} x={BOX2_X + BOX_W / 2} y={BOX_Y + 54 + i * 22} textAnchor="middle" fontSize={10} fill="#5b21b6">{txt}</text>
        ))}

        {/* Stats box */}
        <rect x={STATS_X} y={STATS_Y} width={STATS_W} height={STATS_H} rx={6} fill="#fefce8" stroke="#fde68a" strokeWidth={1.5} />
        <text x={STATS_X + STATS_W / 2} y={STATS_Y + 16} textAnchor="middle" fontSize={10} fontWeight="600" fill="#92400e">Optimizer Statistics</text>
        <text x={STATS_X + STATS_W / 2} y={STATS_Y + 30} textAnchor="middle" fontSize={9} fill="#78350f">{isKo ? 'DBMS_STATS / 딕셔너리' : 'DBMS_STATS / dictionary'}</text>
        <line x1={STATS_X + STATS_W / 2} y1={STATS_Y} x2={BOX2_X + BOX_W / 2} y2={BOX_Y + BOX_H + 4} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#cbo-arrow-blue)" />
        <line x1={BOX2_X + BOX_W} y1={BOX_Y + BOX_H / 2} x2={BOX3_X - 4} y2={BOX_Y + BOX_H / 2} stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#cbo-arrow)" />

        {/* BOX3: Plan Generator */}
        <rect x={BOX3_X} y={BOX_Y} width={BOX_W} height={BOX_H} rx={10} fill="#fff7ed" stroke="#fed7aa" strokeWidth={1.5} />
        <rect x={BOX3_X} y={BOX_Y} width={BOX_W} height={32} rx={10} fill="#ea580c" />
        <rect x={BOX3_X} y={BOX_Y + 22} width={BOX_W} height={10} fill="#ea580c" />
        <text x={BOX3_X + BOX_W / 2} y={BOX_Y + 20} textAnchor="middle" fontSize={11} fontWeight="bold" fill="white">Plan Generator</text>
        {[isKo ? '액세스 패스 탐색' : 'Access paths', isKo ? '조인 순서 탐색' : 'Join orders', isKo ? '조인 방법 탐색' : 'Join methods', isKo ? '최저 비용 계획 선택' : 'Select min-cost plan'].map((txt, i) => (
          <text key={i} x={BOX3_X + BOX_W / 2} y={BOX_Y + 54 + i * 22} textAnchor="middle" fontSize={10} fill="#9a3412">{txt}</text>
        ))}
        <line x1={BOX3_X + BOX_W} y1={BOX_Y + BOX_H / 2} x2={OUTPUT_X - 4} y2={OUTPUT_Y + OUTPUT_H / 2} stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#cbo-arrow)" />

        {/* Output */}
        <rect x={OUTPUT_X} y={OUTPUT_Y} width={OUTPUT_W} height={OUTPUT_H} rx={8} fill="#f0fdf4" stroke="#86efac" strokeWidth={1.5} />
        <text x={OUTPUT_X + OUTPUT_W / 2} y={OUTPUT_Y + 22} textAnchor="middle" fontSize={11} fontWeight="600" fill="#166534">{isKo ? '실행 계획' : 'Query Plan'}</text>
        <text x={OUTPUT_X + OUTPUT_W / 2} y={OUTPUT_Y + 38} textAnchor="middle" fontSize={10} fill="#166534">{isKo ? '(최저 비용)' : '(lowest cost)'}</text>
      </svg>
    </div>
  )
}

// ── Access Path Diagram ───────────────────────────────────────────────────────

export type AccessMode = 'fts' | 'unique' | 'range'

export function AccessPathDiagram({ mode, lang }: { mode: AccessMode; lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const SVG_W = 560, SVG_H = 230
  const TBL_X = 370, TBL_Y = 30, TBL_W = 160, BLOCK_H = 28, BLOCK_GAP = 6, BLOCKS = 6
  const IDX_X = 140, IDX_Y = 30, IDX_W = 140
  const LEAF_Y = IDX_Y + 80, LEAF_H = 28, LEAF_W = 36, LEAVES = 4, LEAF_GAP = 8
  const LEAF_TOTAL = LEAVES * LEAF_W + (LEAVES - 1) * LEAF_GAP
  const LEAF_START = IDX_X + (IDX_W - LEAF_TOTAL) / 2
  const rootCx = IDX_X + IDX_W / 2

  const blockFills = Array.from({ length: BLOCKS }, (_, bi) => {
    if (mode === 'fts') return '#bbf7d0'
    if (mode === 'unique') return bi === 2 ? '#fde68a' : '#f1f5f9'
    if (mode === 'range') return bi >= 1 && bi <= 3 ? '#bfdbfe' : '#f1f5f9'
    return '#f1f5f9'
  })

  const leafFills = Array.from({ length: LEAVES }, (_, li) => {
    if (mode === 'fts') return '#f1f5f9'
    if (mode === 'unique') return li === 1 ? '#fde68a' : '#f1f5f9'
    if (mode === 'range') return li >= 0 && li <= 2 ? '#bfdbfe' : '#f1f5f9'
    return '#f1f5f9'
  })

  const legendItems =
    mode === 'fts'
      ? [{ color: '#bbf7d0', label: isKo ? '읽는 블록 (전체)' : 'Read blocks (all)' }]
      : mode === 'unique'
        ? [{ color: '#fde68a', label: isKo ? '매칭 리프/블록 (1개)' : 'Matched leaf/block (1)' }, { color: '#f1f5f9', label: isKo ? '스캔 안 함' : 'Not scanned' }]
        : [{ color: '#bfdbfe', label: isKo ? '범위 내 리프/블록' : 'In-range leaf/blocks' }, { color: '#f1f5f9', label: isKo ? '범위 외' : 'Out of range' }]

  const title =
    mode === 'fts'
      ? isKo ? 'Full Table Scan — 전체 블록 순차 읽기' : 'Full Table Scan — Sequential full read'
      : mode === 'unique'
        ? isKo ? 'Index Unique Scan — 정확히 1행' : 'Index Unique Scan — exactly 1 row'
        : isKo ? 'Index Range Scan — 연속 리프 블록 스캔' : 'Index Range Scan — consecutive leaf blocks'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 my-4">
      <p className="text-center text-xs font-semibold text-slate-600 mb-2">{title}</p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width={SVG_W} height={SVG_H} className="mx-auto block" style={{ maxWidth: '100%' }}>
          <defs>
            <marker id="ap-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>

          {mode !== 'fts' && (
            <>
              <rect x={rootCx - 36} y={IDX_Y} width={72} height={26} rx={6} fill="#e0e7ff" stroke="#818cf8" strokeWidth={1.5} />
              <text x={rootCx} y={IDX_Y + 17} textAnchor="middle" fontSize={11} fontWeight="600" fill="#3730a3">Root</text>
              <rect x={rootCx - 30} y={IDX_Y + 42} width={60} height={24} rx={5} fill="#e0e7ff" stroke="#818cf8" strokeWidth={1.5} />
              <text x={rootCx} y={IDX_Y + 58} textAnchor="middle" fontSize={10} fill="#3730a3">Branch</text>
              <line x1={rootCx} y1={IDX_Y + 26} x2={rootCx} y2={IDX_Y + 42} stroke="#818cf8" strokeWidth={1.5} />
              {Array.from({ length: LEAVES }, (_, li) => {
                const lx = LEAF_START + li * (LEAF_W + LEAF_GAP)
                const cx = lx + LEAF_W / 2
                return (
                  <g key={li}>
                    <line x1={rootCx} y1={IDX_Y + 66} x2={cx} y2={LEAF_Y} stroke="#818cf8" strokeWidth={1} strokeDasharray="3 2" />
                    <rect x={lx} y={LEAF_Y} width={LEAF_W} height={LEAF_H} rx={4} fill={leafFills[li]} stroke="#818cf8" strokeWidth={1.5} />
                    <text x={cx} y={LEAF_Y + 18} textAnchor="middle" fontSize={9} fontWeight="600" fill="#3730a3">L{li + 1}</text>
                  </g>
                )
              })}
              {Array.from({ length: LEAVES - 1 }, (_, li) => {
                const lx1 = LEAF_START + li * (LEAF_W + LEAF_GAP) + LEAF_W
                const lx2 = LEAF_START + (li + 1) * (LEAF_W + LEAF_GAP)
                return <line key={li} x1={lx1} y1={LEAF_Y + LEAF_H / 2} x2={lx2} y2={LEAF_Y + LEAF_H / 2} stroke="#818cf8" strokeWidth={1} strokeDasharray="2 2" />
              })}
              <text x={IDX_X + IDX_W / 2} y={SVG_H - 6} textAnchor="middle" fontSize={10} fill="#64748b">{isKo ? 'B-Tree 인덱스' : 'B-Tree Index'}</text>
              {mode === 'unique' && (
                <line x1={LEAF_START + 1 * (LEAF_W + LEAF_GAP) + LEAF_W / 2} y1={LEAF_Y + LEAF_H} x2={TBL_X} y2={TBL_Y + 2 * (BLOCK_H + BLOCK_GAP) + BLOCK_H / 2} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#ap-arrow)" />
              )}
              {mode === 'range' && (
                <>
                  <line x1={LEAF_START + 1 * (LEAF_W + LEAF_GAP) + LEAF_W} y1={LEAF_Y + LEAF_H / 2} x2={TBL_X} y2={TBL_Y + 1 * (BLOCK_H + BLOCK_GAP) + BLOCK_H / 2} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#ap-arrow)" />
                  <line x1={LEAF_START + 2 * (LEAF_W + LEAF_GAP) + LEAF_W} y1={LEAF_Y + LEAF_H / 2} x2={TBL_X} y2={TBL_Y + 3 * (BLOCK_H + BLOCK_GAP) + BLOCK_H / 2} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#ap-arrow)" />
                </>
              )}
            </>
          )}

          {mode === 'fts' && (
            <>
              <text x={80} y={SVG_H / 2 - 8} textAnchor="middle" fontSize={11} fontWeight="600" fill="#166534">{isKo ? '순차 읽기' : 'Sequential'}</text>
              <text x={80} y={SVG_H / 2 + 8} textAnchor="middle" fontSize={11} fontWeight="600" fill="#166534">{isKo ? '멀티블록 I/O' : 'Multi-block I/O'}</text>
              <line x1={150} y1={SVG_H / 2} x2={TBL_X - 6} y2={SVG_H / 2} stroke="#16a34a" strokeWidth={2} markerEnd="url(#ap-arrow)" />
            </>
          )}

          <text x={TBL_X + TBL_W / 2} y={TBL_Y - 6} textAnchor="middle" fontSize={11} fontWeight="600" fill="#475569">{isKo ? '테이블 블록' : 'Table Blocks'}</text>
          {Array.from({ length: BLOCKS }, (_, bi) => {
            const by = TBL_Y + bi * (BLOCK_H + BLOCK_GAP)
            return (
              <g key={bi}>
                <rect x={TBL_X} y={by} width={TBL_W} height={BLOCK_H} rx={4} fill={blockFills[bi]} stroke="#cbd5e1" strokeWidth={1} />
                <text x={TBL_X + 10} y={by + 18} fontSize={9} fill="#475569">Block #{bi + 1}</text>
              </g>
            )
          })}

          {legendItems.map((item, li) => (
            <g key={li}>
              <rect x={10} y={SVG_H - 30 + li * 16} width={12} height={12} rx={2} fill={item.color} stroke="#94a3b8" strokeWidth={1} />
              <text x={26} y={SVG_H - 20 + li * 16} fontSize={9} fill="#64748b">{item.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ── Cost Compare Chart ────────────────────────────────────────────────────────

export function CostCompareChart({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const bars = [
    { label: isKo ? '전체 테이블 스캔\n(선택도 50%)' : 'Full Table Scan\n(50% selectivity)', cost: 90, color: '#f87171', textColor: '#b91c1c' },
    { label: isKo ? '전체 테이블 스캔\n(선택도 5%)' : 'Full Table Scan\n(5% selectivity)', cost: 90, color: '#fb923c', textColor: '#c2410c' },
    { label: isKo ? 'Index Range Scan\n(선택도 5%)' : 'Index Range Scan\n(5% selectivity)', cost: 28, color: '#4ade80', textColor: '#15803d' },
    { label: isKo ? 'Index Unique Scan\n(= 조건)' : 'Index Unique Scan\n(= predicate)', cost: 4, color: '#34d399', textColor: '#047857' },
  ]

  const SVG_W = 520, BAR_H = 36, BAR_GAP = 18, LABEL_W = 170, MAX_BAR_W = 240, MAX_COST = 100
  const SVG_H = bars.length * (BAR_H + BAR_GAP) + 32

  return (
    <div className="my-4 overflow-x-auto">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width={SVG_W} height={SVG_H} className="mx-auto block" style={{ maxWidth: '100%' }}>
        {bars.map((bar, i) => {
          const y = 16 + i * (BAR_H + BAR_GAP)
          const barW = (bar.cost / MAX_COST) * MAX_BAR_W
          return (
            <g key={i}>
              {bar.label.split('\n').map((line, li) => (
                <text key={li} x={LABEL_W - 8} y={y + 14 + li * 14} textAnchor="end" fontSize={10} fill="#475569">{line}</text>
              ))}
              <rect x={LABEL_W} y={y + 4} width={MAX_BAR_W} height={BAR_H - 8} rx={4} fill="#f1f5f9" />
              <rect x={LABEL_W} y={y + 4} width={barW} height={BAR_H - 8} rx={4} fill={bar.color} />
              <text x={LABEL_W + barW + 6} y={y + 16} fontSize={11} fontWeight="700" fill={bar.textColor}>{isKo ? `비용 ${bar.cost}` : `Cost ${bar.cost}`}</text>
            </g>
          )
        })}
        <text x={LABEL_W} y={SVG_H - 2} fontSize={9} fill="#94a3b8">
          {isKo ? '* 비용은 상대적 단위 (실제 값은 통계·시스템 환경에 따라 다름)' : '* Cost is a relative unit; actual values vary by statistics and system'}
        </text>
      </svg>
    </div>
  )
}

// ── Selectivity Widget ────────────────────────────────────────────────────────

export function SelectivityWidget({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const [ndv, setNdv] = useState(100)
  const numRows = 10000

  const selectivity = +(1 / ndv).toFixed(4)
  const cardinality = Math.round(numRows * selectivity)
  const recFts = selectivity > 0.1
  const indexColor = recFts ? '#f87171' : '#4ade80'
  const indexLabel = recFts
    ? isKo ? 'Full Table Scan 권장' : 'Full Table Scan preferred'
    : isKo ? 'Index Scan 권장' : 'Index Scan preferred'

  return (
    <div className="my-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
      <p className="text-sm font-semibold text-violet-800 mb-3">
        {isKo ? '선택도 계산기 (등치 조건: col = val)' : 'Selectivity Calculator (equality: col = val)'}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs text-violet-700 font-medium block mb-1">
            NDV (NUM_DISTINCT): <span className="font-bold">{ndv}</span>
          </label>
          <input type="range" min={2} max={500} value={ndv} onChange={(e) => setNdv(Number(e.target.value))} className="w-40 accent-violet-600" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="rounded-lg bg-white border border-violet-200 px-4 py-2 text-center">
            <p className="text-[10px] text-slate-500">{isKo ? '선택도' : 'Selectivity'}</p>
            <p className="font-mono text-sm font-bold text-violet-700">{selectivity}</p>
            <p className="text-[10px] text-slate-400">1 / {ndv}</p>
          </div>
          <div className="rounded-lg bg-white border border-violet-200 px-4 py-2 text-center">
            <p className="text-[10px] text-slate-500">{isKo ? '예상 반환 행' : 'Est. Rows'}</p>
            <p className="font-mono text-sm font-bold text-violet-700">{cardinality.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">{numRows.toLocaleString()} × {selectivity}</p>
          </div>
          <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: indexColor, background: `${indexColor}22` }}>
            <p className="text-[10px] text-slate-500">{isKo ? 'CBO 권장' : 'CBO Preference'}</p>
            <p className="text-xs font-bold mt-1" style={{ color: recFts ? '#b91c1c' : '#15803d' }}>{indexLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Plan Tree Diagram ─────────────────────────────────────────────────────────

export function PlanTreeDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  type Node = { id: number; label: string; sub?: string; color: string; x: number; y: number; parentId?: number }
  const nodes: Node[] = [
    { id: 0, label: 'SELECT STATEMENT', sub: isKo ? '최종 결과 반환' : 'Return result', color: '#3b82f6', x: 250, y: 20 },
    { id: 1, label: 'HASH JOIN', sub: isKo ? '두 결과 집합 조인' : 'Join two row sets', color: '#7c3aed', x: 250, y: 90, parentId: 0 },
    { id: 2, label: 'TABLE ACCESS FULL', sub: 'DEPARTMENTS', color: '#ea580c', x: 100, y: 170, parentId: 1 },
    { id: 3, label: 'INDEX RANGE SCAN', sub: 'EMP_DEPT_IX', color: '#16a34a', x: 390, y: 170, parentId: 1 },
  ]
  const NODE_W = 170, NODE_H = 44, SVG_W = 560, SVG_H = 240

  return (
    <div className="my-4 overflow-x-auto">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width={SVG_W} height={SVG_H} className="mx-auto block" style={{ maxWidth: '100%' }}>
        <defs>
          <marker id="pt-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
        {nodes.filter(n => n.parentId !== undefined).map(n => {
          const parent = nodes.find(p => p.id === n.parentId)!
          return <line key={n.id} x1={parent.x + NODE_W / 2} y1={parent.y + NODE_H} x2={n.x + NODE_W / 2} y2={n.y} stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#pt-arrow)" />
        })}
        {nodes.map(n => (
          <g key={n.id}>
            <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={8} fill={`${n.color}18`} stroke={n.color} strokeWidth={1.5} />
            <text x={n.x + NODE_W / 2} y={n.y + 17} textAnchor="middle" fontSize={11} fontWeight="700" fill={n.color}>{n.label}</text>
            {n.sub && <text x={n.x + NODE_W / 2} y={n.y + 32} textAnchor="middle" fontSize={10} fill="#64748b">{n.sub}</text>}
          </g>
        ))}
        <text x={SVG_W / 2} y={SVG_H - 8} textAnchor="middle" fontSize={10} fill="#94a3b8">
          {isKo ? '트리 하단 자식 → 상단 부모 순으로 실행됨' : 'Execution: leaf nodes first → root last'}
        </text>
      </svg>
    </div>
  )
}

// ── Access mode button group (shared UI) ──────────────────────────────────────

export function AccessModeButtons({ active, onChange }: { active: AccessMode; onChange: (m: AccessMode) => void; lang?: 'ko' | 'en' }) {
  const modes: { key: AccessMode; label: string }[] = [
    { key: 'fts', label: 'Full Table Scan' },
    { key: 'unique', label: 'Index Unique Scan' },
    { key: 'range', label: 'Index Range Scan' },
  ]
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {modes.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
            active === m.key
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
