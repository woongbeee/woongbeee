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

// pad a string to fixed width (right-pad with spaces)
function rpad(s: string, n: number) { return s.padEnd(n) }
function lpad(s: string, n: number) { return s.padStart(n) }

export function ExplainPlanTable({
  rows,
  showStats = false,
  caption,
  lang = 'ko',
}: {
  rows: PlanRow[]
  showStats?: boolean
  caption?: string
  lang?: 'ko' | 'en'
}) {
  // ── 컬럼 너비 계산 ──────────────────────────────────────────────
  const opW   = Math.max(9,  ...rows.map(r => r.depth * 2 + r.operation.length))
  const nameW = Math.max(4,  ...rows.map(r => (r.name ?? '').length))
  const rowsW = Math.max(4,  ...rows.map(r => String(r.rows ?? '').length))
  const costW = Math.max(4,  ...rows.map(r => String(r.cost ?? '').length))
  const timeW = Math.max(8,  ...rows.map(r => (r.time ?? '').length))

  const statCols = showStats ? [
    { key: 'actualRows' as const, hdr: 'A-Rows', w: 6 },
    { key: 'cr'         as const, hdr: 'CR',     w: 4 },
    { key: 'pr'         as const, hdr: 'PR',     w: 4 },
    { key: 'pw'         as const, hdr: 'PW',     w: 4 },
    { key: 'elapsed'    as const, hdr: 'A-Time', w: 12 },
  ] : []

  // ── 구분선 너비 ─────────────────────────────────────────────────
  const statW  = statCols.reduce((s, c) => s + c.w + 3, 0)
  const totalW = 4 + 3 + opW + 3 + nameW + 3 + rowsW + 3 + costW + 3 + timeW + statW + 1
  const sep    = '-'.repeat(totalW)

  // ── 헤더 행 ────────────────────────────────────────────────────
  const hdrId    = rpad('Id',        4)
  const hdrOp    = rpad('Operation', opW)
  const hdrName  = rpad('Name',      nameW)
  const hdrRows  = lpad('Rows',      rowsW)
  const hdrCost  = lpad('Cost',      costW)
  const hdrTime  = rpad('Time',      timeW)
  const hdrStats = statCols.map(c => lpad(c.hdr, c.w)).join(' | ')
  const headerLine = `| ${hdrId} | ${hdrOp} | ${hdrName} | ${hdrRows} | ${hdrCost} | ${hdrTime}${statCols.length ? ' | ' + hdrStats : ''} |`

  // ── 텍스트 색상 (밝은 배경 기준) ────────────────────────────────
  const C = {
    sep:     '#9ca3af', // gray-400
    header:  '#374151', // gray-700
    pipe:    '#6b7280', // gray-500
    id:      '#374151',
    idPred:  '#d97706', // amber-600 — * 있는 행
    op:      '#111827', // gray-900
    name:    '#374151',
    rows:    '#374151',
    cost:    '#374151',
    time:    '#6b7280',
    stat:    '#374151',
  }

  // ── 데이터 행 렌더링 ────────────────────────────────────────────
  function renderRow(row: PlanRow) {
    const hasPred = row.note !== undefined
    const idStr   = hasPred
      ? `*${lpad(String(row.id), 3)}`
      : ` ${lpad(String(row.id), 3)}`
    const indent  = ' '.repeat(row.depth * 2)
    const opStr   = rpad(indent + row.operation, opW)
    const nameStr = rpad(row.name ?? '', nameW)
    const rowsStr = lpad(String(row.rows ?? ''), rowsW)
    const costStr = lpad(String(row.cost ?? ''), costW)
    const timeStr = rpad(row.time ?? '', timeW)

    return (
      <span key={row.id} className="block">
        <span style={{ color: C.pipe }}>|</span>
        <span style={{ color: hasPred ? C.idPred : C.id }}>{idStr}</span>
        <span style={{ color: C.pipe }}> | </span>
        <span style={{ color: C.op }}>{opStr}</span>
        <span style={{ color: C.pipe }}> | </span>
        <span style={{ color: C.name }}>{nameStr}</span>
        <span style={{ color: C.pipe }}> | </span>
        <span style={{ color: C.rows }}>{rowsStr}</span>
        <span style={{ color: C.pipe }}> | </span>
        <span style={{ color: C.cost }}>{costStr}</span>
        <span style={{ color: C.pipe }}> | </span>
        <span style={{ color: C.time }}>{timeStr}</span>
        {statCols.length > 0 && statCols.map((c) => {
          const val = row[c.key]
          const s = lpad(val !== undefined && val !== null ? String(val) : '', c.w)
          return (
            <span key={c.key}>
              <span style={{ color: C.pipe }}> | </span>
              <span style={{ color: C.stat }}>{s}</span>
            </span>
          )
        })}
        <span style={{ color: C.pipe }}> |</span>
      </span>
    )
  }

  const hasNotes = rows.some(r => r.note)

  return (
    <div className="my-4">
      {caption && (
        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">{caption}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3">
        <pre className="font-mono text-[11px] leading-relaxed">
          <span className="block" style={{ color: C.sep }}>{sep}</span>
          <span className="block" style={{ color: C.header }}>{headerLine}</span>
          <span className="block" style={{ color: C.sep }}>{sep}</span>
          {rows.map(row => renderRow(row))}
          <span className="block" style={{ color: C.sep }}>{sep}</span>
        </pre>
      </div>
      {hasNotes && (() => {
        const noteRows = rows.filter(r => r.note)
        const isKo = lang === 'ko'
        return (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="grid grid-cols-[3rem_5rem_1fr] border-b border-slate-200 bg-slate-100">
              <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Id</span>
              <span className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{isKo ? '실행 순서' : 'Exec Order'}</span>
              <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{isKo ? '설명' : 'Description'}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {noteRows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-[3rem_5rem_1fr]">
                  <span className="px-3 py-2.5 font-mono text-xs font-bold text-amber-600 self-start">{row.id}</span>
                  <span className="px-2 py-2.5 font-mono text-[11px] font-semibold text-slate-600 self-start">
                    {isKo ? `${noteRows.length - idx}번째` : `${noteRows.length - idx}${idx === noteRows.length - 1 ? 'st' : idx === noteRows.length - 2 ? 'nd' : idx === noteRows.length - 3 ? 'rd' : 'th'}`}
                  </span>
                  <span className="px-3 py-2.5 text-xs leading-relaxed text-foreground/70">{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
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

// ── SqlTraceDisplay (TKPROF Call Statistics) ──────────────────────────────────

interface CallRow {
  call: string
  count: number
  cpu: string
  elapsed: string
  disk: number
  query: number
  current: number
  rows: number
  isTotal?: boolean
  noteKo?: string
  noteEn?: string
}

const CALL_ROWS: CallRow[] = [
  {
    call: 'Parse', count: 1, cpu: '0.00', elapsed: '0.01', disk: 0, query: 0, current: 0, rows: 0,
    noteKo: 'Parse 단계가 1번 실행되어 0.01초가 걸렸어요. CPU 시간은 0.00초인데 경과 시간이 0.01초이므로, 실제 파싱 외에 대기가 있었음을 알 수 있어요. Misses=1이므로 Hard Parse가 발생했어요 — Library Cache에 기존 실행 계획이 없어 SQL을 처음부터 파싱하고 최적화한 거예요. 바인드 변수를 사용했다면 이후 실행부터 Soft Parse로 처리되어 Parse 비용이 거의 0에 가까워져요.',
    noteEn: 'Parse ran once and took 0.01s elapsed. Since CPU time is 0.00s but elapsed is 0.01s, there was a wait beyond the parse work itself. Misses=1 confirms a Hard Parse — no existing plan was found in the Library Cache, so Oracle had to parse and optimize the SQL from scratch. Using bind variables would allow subsequent executions to Soft Parse at near-zero cost.',
  },
  {
    call: 'Execute', count: 1, cpu: '0.00', elapsed: '0.00', disk: 0, query: 0, current: 0, rows: 0,
    noteKo: 'Execute 단계가 1번 실행되어 CPU·경과 시간 모두 0.00초예요. SELECT 문이므로 실제 데이터 변경은 없고, 실행 엔진을 가동시켜 Fetch 단계로 제어를 넘기는 것만으로 즉시 완료됐어요. DML이었다면 이 단계에서 실제 데이터 처리가 일어나고 cpu·elapsed 값이 높아져요.',
    noteEn: 'Execute ran once with 0.00s for both CPU and elapsed time. Since this is a SELECT, no data modification occurred — Oracle simply started the execution engine and handed control to the Fetch phase. For DML statements, this is the stage where actual data processing happens and you would see meaningful cpu and elapsed values here.',
  },
  {
    call: 'Fetch', count: 2, cpu: '0.01', elapsed: '0.03', disk: 3, query: 14, current: 0, rows: 10,
    noteKo: 'Fetch 단계가 2번 호출되어 총 10행을 클라이언트에 반환했어요. 논리 블록 14개(query=14)를 읽었고, 그 중 3블록(disk=3)은 Buffer Cache에 없어 디스크에서 직접 읽었어요. 경과 시간 0.03초 중 상당 부분이 이 물리 I/O 대기예요. disk 값이 0에 가까울수록 Buffer Cache 활용이 잘 되고 있는 거예요.',
    noteEn: 'Fetch was called twice and returned 10 rows to the client in total. 14 logical blocks were read (query=14), of which 3 (disk=3) were not in the Buffer Cache and required physical disk reads. Most of the 0.03s elapsed time is attributable to that physical I/O wait. The closer disk is to 0, the better the Buffer Cache utilization.',
  },
  {
    call: 'total', count: 4, cpu: '0.01', elapsed: '0.04', disk: 3, query: 14, current: 0, rows: 10, isTotal: true,
  },
]

const CALL_EXTRA_KO = [
  'Misses in library cache during parse: 1',
  'Optimizer mode: ALL_ROWS',
  'Parsing user id: 84  (SYS)',
]

const CALL_EXTRA_EN = [
  'Misses in library cache during parse: 1',
  'Optimizer mode: ALL_ROWS',
  'Parsing user id: 84  (SYS)',
]

export function SqlTraceDisplay({ lang }: { lang: 'ko' | 'en' }) {
  const caption = lang === 'ko'
    ? 'TKPROF Call Statistics 출력 예시'
    : 'TKPROF Call Statistics output example'

  const header  = 'call     count       cpu    elapsed       disk      query    current       rows'
  const divider = '------- ------  -------- ---------- ---------- ---------- ---------- ----------'

  function fmtRow(r: CallRow) {
    // 갭 포함 구조: call(7) 1 count(6) 2 cpu(8) 1 elapsed(10) 1 disk(10) 1 query(10) 1 current(10) 1 rows(10)
    const callStr    = r.call.padEnd(7)
    const countStr   = String(r.count).padStart(6)
    const cpuStr     = r.cpu.padStart(8)
    const elapsedStr = r.elapsed.padStart(10)
    const diskStr    = String(r.disk).padStart(10)
    const queryStr   = String(r.query).padStart(10)
    const currentStr = String(r.current).padStart(10)
    const rowsStr    = String(r.rows).padStart(10)
    return { callStr, countStr, cpuStr, elapsedStr, diskStr, queryStr, currentStr, rowsStr }
  }

  const pipeColor = '#6b7280'
  const labelColor = '#374151'
  const totalColor = '#374151'
  const phaseColors: Record<string, string> = {
    Parse:   '#374151',
    Execute: '#374151',
    Fetch:   '#374151',
  }
  const extraLines = lang === 'ko' ? CALL_EXTRA_KO : CALL_EXTRA_EN

  return (
    <div className="my-4">
      {caption && (
        <p className="mb-1 text-xs font-semibold text-muted-foreground">{caption}</p>
      )}
      <pre className="overflow-x-auto rounded-lg bg-white border border-slate-200 px-5 py-4 font-mono text-xs leading-relaxed text-slate-700">
        <span style={{ color: labelColor }}>{header}</span>{'\n'}
        <span style={{ color: pipeColor }}>{divider}</span>{'\n'}
        {CALL_ROWS.map((r, i) => {
          const isTotal = r.isTotal ?? false
          const f = fmtRow(r)
          const nameColor = isTotal ? totalColor : (phaseColors[f.callStr.trim()] ?? labelColor)
          return (
            <span key={i} className="block">
              {isTotal && <span style={{ color: pipeColor }} className="block">{divider}</span>}
              <span style={{ color: nameColor }} className={isTotal ? 'font-bold' : ''}>{f.callStr}</span>
              <span style={{ color: pipeColor }}>{' '}</span>
              <span style={{ color: '#374151' }}>{f.countStr}</span>
              <span style={{ color: pipeColor }}>{'  '}</span>
              <span style={{ color: '#374151' }}>{f.cpuStr}</span>
              <span style={{ color: pipeColor }}>{' '}</span>
              <span style={{ color: '#374151' }}>{f.elapsedStr}</span>
              <span style={{ color: pipeColor }}>{' '}</span>
              <span style={{ color: '#374151' }}>{f.diskStr}</span>
              <span style={{ color: pipeColor }}>{' '}</span>
              <span style={{ color: '#374151' }}>{f.queryStr}</span>
              <span style={{ color: pipeColor }}>{' '}</span>
              <span style={{ color: '#374151' }}>{f.currentStr}</span>
              <span style={{ color: pipeColor }}>{' '}</span>
              <span style={{ color: '#374151' }}>{f.rowsStr}</span>
            </span>
          )
        })}
        {'\n'}
        {extraLines.map((line, i) => (
          <span key={i} style={{ color: '#64748b' }} className="block">{line}</span>
        ))}
      </pre>
      {/* 단계별 설명 패널 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
          <span className="text-xs font-bold text-slate-500">{lang === 'ko' ? '단계별 설명' : 'Step details'}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {CALL_ROWS.filter(r => !r.isTotal).map(r => {
            const note = lang === 'ko' ? r.noteKo : r.noteEn
            return (
              <div key={r.call} className="flex gap-3 px-4 py-2.5">
                <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-slate-600">{r.call}</span>
                <span className="text-xs leading-relaxed text-foreground/70">{note}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── RowSourceOperationDisplay ─────────────────────────────────────────────────
// Row Source Operation 섹션 예시: ALLSTATS LAST 출력 (A-Rows, CR, PR, PW 포함)

const RSO_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 85, cost: 47, time: '00:00:01', actualRows: 85, cr: 3847, pr: 312, pw: 0, elapsed: '00:00:02.14', note: '마지막으로 실행돼요. 모든 자식 오퍼레이션의 CR·PR이 누적된 최종값을 보여줘요. 쿼리 전체가 2.14초 걸려 85행을 반환했고, PR=312는 Buffer Cache를 벗어나 디스크에서 읽어야 했던 블록 수예요.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 85, cost: 47, time: '00:00:01', actualRows: 85, cr: 3847, pr: 312, pw: 0, elapsed: '00:00:02.13', note: 'Id 2, 4→3의 결과를 받은 후 실행돼요. DEPARTMENTS(11행)로 해시 테이블을 만들고 EMPLOYEES 결과(3,420행)로 Probe해 85행을 조인했어요. E-Rows=85로 추정은 정확하나, 자식들의 CR·PR이 여기에 누적돼요.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 11, cost: 3, time: '00:00:01', actualRows: 11, cr: 8, pr: 0, pw: 0, elapsed: '00:00:00.01', note: 'Id 3보다 먼저, 위에서 아래 순서로 실행돼요. DEPARTMENTS 전체를 스캔해 11행을 읽었어요. E-Rows=11, A-Rows=11로 통계가 정확하고, CR=8로 논리 읽기도 적어요. PR=0이므로 모두 Buffer Cache 히트예요.' },
  { id: 3, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 10, cost: 43, time: '00:00:01', actualRows: 3420, cr: 3839, pr: 312, pw: 0, elapsed: '00:00:02.12', note: '⚠️ Id 4의 결과(ROWID 목록)를 받아 실행돼요. 병목 오퍼레이션. CBO는 10행을 예상(E-Rows=10)했지만 실제 3,420행(A-Rows=3,420)이 반환됐어요. 통계 오류로 선택도를 크게 과소평가한 상태이며, ROWID마다 테이블 블록을 랜덤 읽어 CR=3,839, PR=312의 대규모 I/O가 발생했어요.' },
  { id: 4, depth: 3, operation: 'INDEX RANGE SCAN', name: 'EMP_NAME_IX', rows: 10, cost: 2, time: '00:00:01', actualRows: 3420, cr: 5, pr: 0, pw: 0, elapsed: '00:00:00.01', note: '가장 먼저 실행돼요. 가장 안쪽(깊은 들여쓰기)이기 때문이에요. EMP_NAME_IX를 Range Scan해 3,420개의 ROWID를 수집해 부모(Id 3)에 전달해요. 인덱스 탐색 자체는 CR=5로 효율적이에요.' },
  { id: 5, depth: 1, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 11, cost: 3, time: '00:00:01', actualRows: 11, cr: 8, pr: 0, pw: 0, elapsed: '00:00:00.01' },
]

const RSO_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 85, cost: 47, time: '00:00:01', actualRows: 85, cr: 3847, pr: 312, pw: 0, elapsed: '00:00:02.14', note: 'Runs last — the root. CR and PR here are cumulative totals from all child operations. The query took 2.14s and returned 85 rows. PR=312 means 312 blocks could not be served from the Buffer Cache and required disk reads.' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 85, cost: 47, time: '00:00:01', actualRows: 85, cr: 3847, pr: 312, pw: 0, elapsed: '00:00:02.13', note: 'Runs after receiving results from Id 2 and Id 4→3. Builds a hash table from DEPARTMENTS (11 rows), then probes with EMPLOYEES results (3,420 rows) to produce 85 joined rows. E-Rows=85 is accurate, but CR and PR from children accumulate here.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 11, cost: 3, time: '00:00:01', actualRows: 11, cr: 8, pr: 0, pw: 0, elapsed: '00:00:00.01', note: 'Runs before Id 3 — siblings at the same depth execute top-to-bottom. Full scan of DEPARTMENTS returned 11 rows. E-Rows=11 matches A-Rows=11; statistics are accurate. CR=8 is minimal and PR=0 means a full Buffer Cache hit.' },
  { id: 3, depth: 2, operation: 'TABLE ACCESS BY INDEX ROWID', name: 'EMPLOYEES', rows: 10, cost: 43, time: '00:00:01', actualRows: 3420, cr: 3839, pr: 312, pw: 0, elapsed: '00:00:02.12', note: '⚠️ Runs after receiving the ROWID list from Id 4. This is the bottleneck. The CBO estimated 10 rows (E-Rows=10) but 3,420 rows (A-Rows=3,420) were returned — stale statistics caused a severe selectivity underestimate. Each ROWID triggers a random table block read: CR=3,839 and PR=312.' },
  { id: 4, depth: 3, operation: 'INDEX RANGE SCAN', name: 'EMP_NAME_IX', rows: 10, cost: 2, time: '00:00:01', actualRows: 3420, cr: 5, pr: 0, pw: 0, elapsed: '00:00:00.01', note: 'Runs first — it is the most-indented (deepest) operation. Performs a range scan on EMP_NAME_IX and passes 3,420 ROWIDs up to its parent (Id 3). The index scan itself is efficient: CR=5, PR=0.' },
  { id: 5, depth: 1, operation: 'TABLE ACCESS FULL', name: 'DEPARTMENTS', rows: 11, cost: 3, time: '00:00:01', actualRows: 11, cr: 8, pr: 0, pw: 0, elapsed: '00:00:00.01' },
]

export function RowSourceOperationDisplay({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const caption = isKo
    ? 'DBMS_XPLAN.DISPLAY_CURSOR(format => \'ALLSTATS LAST\') 출력 예시'
    : "DBMS_XPLAN.DISPLAY_CURSOR(format => 'ALLSTATS LAST') output example"
  return (
    <div>
      <ExplainPlanTable rows={isKo ? RSO_ROWS_KO : RSO_ROWS_EN} showStats caption={caption} lang={lang} />
    </div>
  )
}

// ── PredicateInfoDisplay ──────────────────────────────────────────────────────
// Predicate Information 섹션 예시: 조건절 정보 출력 형태 재현

export function PredicateInfoDisplay({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const lines = isKo ? [
    { label: 'Plan hash value: 1234567890', color: '#94a3b8' },
    { label: '', color: '' },
    { label: '-----------------------------------------------------', color: '#475569' },
    { label: '| Id  | Operation             | Name        | Rows |', color: '#94a3b8' },
    { label: '-----------------------------------------------------', color: '#475569' },
    { label: '|   0 | SELECT STATEMENT      |             |   50 |', color: '#3b82f6' },
    { label: '|*  1 |  HASH JOIN            |             |   50 |', color: '#7c3aed' },
    { label: '|   2 |   TABLE ACCESS FULL   | DEPARTMENTS |   27 |', color: '#ea580c' },
    { label: '|*  3 |   INDEX RANGE SCAN    | EMP_DEPT_IX |  107 |', color: '#16a34a' },
    { label: '-----------------------------------------------------', color: '#475569' },
    { label: '', color: '' },
    { label: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
    { label: '---------------------------------------------------', color: '#475569' },
    { label: '   1 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', color: '#fbbf24' },
    { label: '   3 - access("E"."DEPARTMENT_ID">50)', color: '#fbbf24' },
  ] : [
    { label: 'Plan hash value: 1234567890', color: '#94a3b8' },
    { label: '', color: '' },
    { label: '-----------------------------------------------------', color: '#475569' },
    { label: '| Id  | Operation             | Name        | Rows |', color: '#94a3b8' },
    { label: '-----------------------------------------------------', color: '#475569' },
    { label: '|   0 | SELECT STATEMENT      |             |   50 |', color: '#3b82f6' },
    { label: '|*  1 |  HASH JOIN            |             |   50 |', color: '#7c3aed' },
    { label: '|   2 |   TABLE ACCESS FULL   | DEPARTMENTS |   27 |', color: '#ea580c' },
    { label: '|*  3 |   INDEX RANGE SCAN    | EMP_DEPT_IX |  107 |', color: '#16a34a' },
    { label: '-----------------------------------------------------', color: '#475569' },
    { label: '', color: '' },
    { label: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
    { label: '---------------------------------------------------', color: '#475569' },
    { label: '   1 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', color: '#fbbf24' },
    { label: '   3 - access("E"."DEPARTMENT_ID">50)', color: '#fbbf24' },
  ]

  const caption = isKo
    ? 'Predicate Information 출력 예시 (* 표시 = 조건절 있음)'
    : 'Predicate Information output (* = has predicate)'

  return (
    <div className="my-4">
      <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{caption}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3">
        <pre className="font-mono text-[11px] leading-relaxed text-slate-700">
          {lines.map((line, i) =>
            line.label === '' ? (
              <span key={i} className="block">&nbsp;</span>
            ) : (
              <span key={i} className="block">{line.label}</span>
            )
          )}
        </pre>
      </div>
    </div>
  )
}

// ── ColumnProjectionDisplay ───────────────────────────────────────────────────
// Column Projection 섹션 예시: +PROJECTION 포맷 출력 형태 재현

export function ColumnProjectionDisplay({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const lines = isKo ? [
    { label: 'Column Projection Information (identified by operation id):', color: '#f59e0b' },
    { label: '-----------------------------------------------------------', color: '#475569' },
    { label: '   1 - (#keys=1) "E"."EMPLOYEE_ID"[NUMBER,22], "D"."DEPARTMENT_NAME"[VARCHAR2,30]', color: '#86efac' },
    { label: '   2 - "D"."DEPARTMENT_ID"[NUMBER,22], "D"."DEPARTMENT_NAME"[VARCHAR2,30]', color: '#86efac' },
    { label: '   3 - "E"."ROWID"[ROWID,10], "E"."EMPLOYEE_ID"[NUMBER,22]', color: '#86efac' },
    { label: '', color: '' },
    { label: '-- #keys=1: 조인 키 컬럼 수', color: '#64748b' },
    { label: '-- [NUMBER,22]: 데이터 타입과 길이', color: '#64748b' },
  ] : [
    { label: 'Column Projection Information (identified by operation id):', color: '#f59e0b' },
    { label: '-----------------------------------------------------------', color: '#475569' },
    { label: '   1 - (#keys=1) "E"."EMPLOYEE_ID"[NUMBER,22], "D"."DEPARTMENT_NAME"[VARCHAR2,30]', color: '#86efac' },
    { label: '   2 - "D"."DEPARTMENT_ID"[NUMBER,22], "D"."DEPARTMENT_NAME"[VARCHAR2,30]', color: '#86efac' },
    { label: '   3 - "E"."ROWID"[ROWID,10], "E"."EMPLOYEE_ID"[NUMBER,22]', color: '#86efac' },
    { label: '', color: '' },
    { label: '-- #keys=1: number of join key columns', color: '#64748b' },
    { label: '-- [NUMBER,22]: data type and length', color: '#64748b' },
  ]

  const caption = isKo
    ? 'Column Projection Information 출력 예시 (+PROJECTION 포맷)'
    : 'Column Projection Information output (+PROJECTION format)'

  return (
    <div className="my-4">
      <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{caption}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3">
        <pre className="font-mono text-[11px] leading-relaxed text-slate-700">
          {lines.map((line, i) =>
            line.label === '' ? (
              <span key={i} className="block">&nbsp;</span>
            ) : (
              <span key={i} className="block">{line.label}</span>
            )
          )}
        </pre>
      </div>
    </div>
  )
}

// ── StatisticsDisplay ─────────────────────────────────────────────────────────
// Statistics 섹션 예시: SET AUTOTRACE TRACEONLY 통계 출력 형태 재현

export function StatisticsDisplay({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const stats = [
    { name: 'recursive calls',  value: 0,    note: isKo ? '-- 내부 재귀 SQL 없음' : '-- no internal recursive SQL' },
    { name: 'db block gets',    value: 0,    note: isKo ? '-- DML Current Read 없음 (SELECT만)' : '-- no DML current reads (SELECT only)' },
    { name: 'consistent gets',  value: 18,   note: isKo ? '-- 논리 읽기 총 18블록 (CR)' : '-- 18 logical block reads (CR)' },
    { name: 'physical reads',   value: 0,    note: isKo ? '-- 디스크 읽기 없음 (Buffer Cache 히트)' : '-- no disk reads (full Buffer Cache hit)' },
    { name: 'redo size',        value: 0,    note: isKo ? '-- SELECT이므로 Redo 없음' : '-- no redo (SELECT only)' },
    { name: 'sorts (memory)',   value: 0,    note: '' },
    { name: 'sorts (disk)',     value: 0,    note: '' },
    { name: 'rows processed',   value: 50,   note: isKo ? '-- 최종 반환 행 수' : '-- total rows returned' },
  ]

  const caption = isKo
    ? 'SET AUTOTRACE TRACEONLY STATISTICS 출력 예시'
    : 'SET AUTOTRACE TRACEONLY STATISTICS output example'

  return (
    <div className="my-4">
      <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{caption}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3">
        <table className="w-full font-mono text-[11px]">
          <tbody>
            {stats.map((s, i) => (
              <tr key={i}>
                <td className="pr-6 py-0.5 text-right text-slate-700 w-12">{s.value}</td>
                <td className="pr-4 py-0.5 text-slate-700">{s.name}</td>
                <td className="py-0.5 text-slate-400 italic text-[10px]">{s.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── FullPlanDisplay ───────────────────────────────────────────────────────────
// ① ~ ⑤ 전체 출력 예시: 각 영역에 컬러 레이블을 붙여 한 화면에 표시

export function FullPlanDisplay({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const pip = '#475569'
  const dim = '#64748b'

  type Block = { label: string; color: string; lines: { text: string; color: string }[] }

  const blocks: Block[] = [
    {
      label: isKo ? '① Call Statistics  (TKPROF 출력)' : '① Call Statistics  (TKPROF output)',
      color: '#818cf8',
      lines: [
        { text: 'call     count       cpu    elapsed       disk      query    current       rows', color: '#94a3b8' },
        { text: '------- ------  -------- ---------- ---------- ---------- ---------- ----------', color: pip },
        { text: 'Parse        1      0.00       0.01          0          0          0          0', color: '#818cf8' },
        { text: 'Execute      1      0.00       0.00          0          0          0          0', color: '#34d399' },
        { text: 'Fetch        2      0.01       0.03          3         14          0         10', color: '#60a5fa' },
        { text: '------- ------  -------- ---------- ---------- ---------- ---------- ----------', color: pip },
        { text: 'total        4      0.01       0.04          3         14          0         10', color: '#fbbf24' },
        { text: '', color: '' },
        { text: 'Misses in library cache during parse: 1', color: dim },
        { text: 'Optimizer mode: ALL_ROWS', color: dim },
        { text: 'Parsing user id: 84  (SYS)', color: dim },
      ],
    },
    {
      label: isKo ? '② Row Source Operation  (ALLSTATS LAST)' : '② Row Source Operation  (ALLSTATS LAST)',
      color: '#34d399',
      lines: [
        { text: '| Id | Operation          | Name        | Starts | E-Rows | A-Rows |   A-Time   |  CR |  PR |', color: '#94a3b8' },
        { text: '----+--------------------+-------------+--------+--------+--------+------------+-----+-----+', color: pip },
        { text: '|  0 | SELECT STATEMENT   |             |      1 |     50 |     50 | 00:00:00.02|  18 |   0 |', color: '#3b82f6' },
        { text: '|  1 |  HASH JOIN         |             |      1 |     50 |     50 | 00:00:00.02|  18 |   0 |', color: '#7c3aed' },
        { text: '|  2 |   TABLE ACCESS FULL| DEPARTMENTS |      1 |     27 |     27 | 00:00:00.01|   7 |   0 |', color: '#ea580c' },
        { text: '|  3 |   INDEX RANGE SCAN | EMP_DEPT_IX |      1 |    107 |    107 | 00:00:00.01|   3 |   0 |', color: '#16a34a' },
        { text: '----+--------------------+-------------+--------+--------+--------+------------+-----+-----+', color: pip },
      ],
    },
    {
      label: isKo ? '③ Predicate Information' : '③ Predicate Information',
      color: '#f59e0b',
      lines: [
        { text: 'Predicate Information (identified by operation id):', color: '#f59e0b' },
        { text: '---------------------------------------------------', color: pip },
        { text: '   1 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")', color: '#fbbf24' },
        { text: '   3 - access("E"."DEPARTMENT_ID">50)', color: '#fbbf24' },
      ],
    },
    {
      label: isKo ? '④ Column Projection' : '④ Column Projection',
      color: '#a78bfa',
      lines: [
        { text: 'Column Projection Information (identified by operation id):', color: '#a78bfa' },
        { text: '----------------------------------------------------------', color: pip },
        { text: '   1 - (#keys=1) "D"."DEPARTMENT_NAME"[VARCHAR2,30],', color: '#c4b5fd' },
        { text: '       "E"."EMPLOYEE_ID"[NUMBER,22]', color: '#c4b5fd' },
        { text: '   2 - "D"."DEPARTMENT_ID"[NUMBER,22], "D"."DEPARTMENT_NAME"[VARCHAR2,30]', color: '#c4b5fd' },
        { text: '   3 - "E"."DEPARTMENT_ID"[NUMBER,22], "E"."EMPLOYEE_ID"[NUMBER,22]', color: '#c4b5fd' },
      ],
    },
    {
      label: isKo ? '⑤ Statistics  (SET AUTOTRACE)' : '⑤ Statistics  (SET AUTOTRACE)',
      color: '#f87171',
      lines: [
        { text: '         0  recursive calls', color: '#fca5a5' },
        { text: '         0  db block gets', color: '#fca5a5' },
        { text: '        18  consistent gets', color: '#fca5a5' },
        { text: '         0  physical reads', color: '#fca5a5' },
        { text: '         0  redo size', color: '#fca5a5' },
        { text: '        50  rows processed', color: '#fca5a5' },
      ],
    },
  ]

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white px-5 py-4 font-mono text-xs leading-relaxed">
      {blocks.map((block, bi) => (
        <div key={bi} className={bi > 0 ? 'mt-5' : ''}>
          {/* 영역 레이블 */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">{block.label}</span>
          </div>
          {/* 출력 내용 */}
          <div>
            {block.lines.map((line, li) => (
              <div key={li} className="whitespace-pre text-slate-700">
                {line.text || ' '}
              </div>
            ))}
          </div>
        </div>
      ))}
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
