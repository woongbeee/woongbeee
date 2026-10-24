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
    sep:     'var(--color-ink-3)', // gray-400
    header:  'var(--color-ink)', // gray-700
    pipe:    'var(--color-ink-2)', // gray-500
    id:      'var(--color-ink)',
    idPred:  'var(--color-amber)', // amber-600 — * 있는 행
    op:      'var(--color-ink)', // gray-900
    name:    'var(--color-ink)',
    rows:    'var(--color-ink)',
    cost:    'var(--color-ink)',
    time:    'var(--color-ink-2)',
    stat:    'var(--color-ink)',
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
        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">{caption}</p>
      )}
      <div className="overflow-x-auto rounded-panel border border-line bg-paper px-4 py-3">
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
          <div className="mt-4 overflow-hidden rounded-panel border border-line bg-paper-sunk">
            <div className="grid grid-cols-[3rem_5rem_1fr] border-b border-line bg-paper-sunk">
              <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-2">Id</span>
              <span className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-2">{isKo ? '실행 순서' : 'Exec Order'}</span>
              <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-2">{isKo ? '설명' : 'Description'}</span>
            </div>
            <div className="divide-y divide-line">
              {noteRows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-[3rem_5rem_1fr]">
                  <span className="px-3 py-2.5 font-mono text-xs font-bold text-amber self-start">{row.id}</span>
                  <span className="px-2 py-2.5 font-mono text-[11px] font-semibold text-ink self-start">
                    {isKo ? `${noteRows.length - idx}번째` : `${noteRows.length - idx}${idx === noteRows.length - 1 ? 'st' : idx === noteRows.length - 2 ? 'nd' : idx === noteRows.length - 3 ? 'rd' : 'th'}`}
                  </span>
                  <span className="px-3 py-2.5 text-xs leading-relaxed text-ink/70">{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
