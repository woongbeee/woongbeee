import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'
import { SqlHighlight } from '../../sql-basics/dml-more/SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────
interface JoinRow {
  emp_id:     number | null
  first_name: string | null
  dept_id:    number | null
  dept_name:  string | null
  location:   string | null
  _side: 'both' | 'left' | 'right'
}

export type JoinType = 'inner' | 'left' | 'right' | 'full' | 'cross'

interface JoinAnimRow extends JoinRow {
  empIdx:  number | null
  deptIdx: number | null
}

// ── Data ───────────────────────────────────────────────────────────────────

const EMPLOYEES: Array<{ emp_id: number; first_name: string; dept_id: number | null }> = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10   },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20   },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10   },
  { emp_id: 104, first_name: 'David',  dept_id: 30   },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20   },
  { emp_id: 106, first_name: 'Frank',  dept_id: 30   },
  { emp_id: 107, first_name: 'Grace',  dept_id: 10   },
  { emp_id: 108, first_name: 'Henry',  dept_id: 20   },
  { emp_id: 109, first_name: 'Iris',   dept_id: null },
]

const DEPARTMENTS: Array<{ dept_id: number; dept_name: string; location: string }> = [
  { dept_id: 10, dept_name: 'Engineering', location: 'Seoul'   },
  { dept_id: 20, dept_name: 'Analytics',   location: 'Busan'   },
  { dept_id: 30, dept_name: 'Support',     location: 'Incheon' },
  { dept_id: 40, dept_name: 'Marketing',   location: 'Daegu'   },
]

const JOIN_SQL: Record<JoinType, string> = {
  inner: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nINNER JOIN departments d\n  ON e.dept_id = d.dept_id',
  left:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nLEFT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  right: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nRIGHT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  full:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nFULL OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  cross: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nCROSS JOIN departments d',
}

const C = {
  bg:     'bg-muted/40',
  border: 'border-border',
  text:   'text-foreground/80',
}

// ── JoinVenn ────────────────────────────────────────────────────────────────

export function JoinVenn({ type }: { type: JoinType }) {
  const showLeft  = type === 'left'  || type === 'full'
  const showRight = type === 'right' || type === 'full'
  const showMid   = type !== 'cross'
  const isCross   = type === 'cross'
  return (
    <svg viewBox="0 0 100 52" className="w-20 h-10 shrink-0">
      <circle cx="35" cy="26" r="20" fill={showLeft  ? '#818cf830' : 'none'} stroke="#818cf8" strokeWidth="1.5" />
      <circle cx="65" cy="26" r="20" fill={showRight ? '#fb923c30' : 'none'} stroke="#fb923c" strokeWidth="1.5" />
      {showMid && !isCross && (
        <>
          <clipPath id={`v-${type}`}><circle cx="35" cy="26" r="20" /></clipPath>
          <circle cx="65" cy="26" r="20" fill="#6ee7b750" stroke="none" clipPath={`url(#v-${type})`} />
        </>
      )}
      {isCross && (
        <text x="50" y="30" fontSize="9" fill="#f43f5e" fontWeight="bold" textAnchor="middle">×</text>
      )}
      <text x="26" y="29" fontSize="6" fill="#6d28d9" fontWeight="bold" textAnchor="middle">EMP</text>
      <text x="74" y="29" fontSize="6" fill="#c2410c" fontWeight="bold" textAnchor="middle">DEPT</text>
    </svg>
  )
}

// ── buildAnimRows ───────────────────────────────────────────────────────────

function buildAnimRows(type: JoinType): JoinAnimRow[] {
  if (type === 'cross') {
    const rows: JoinAnimRow[] = []
    EMPLOYEES.forEach((e, ei) => {
      DEPARTMENTS.forEach((d, di) => {
        rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di })
      })
    })
    return rows
  }

  if (type === 'right') {
    const rows: JoinAnimRow[] = []
    DEPARTMENTS.forEach((d, di) => {
      const matched = EMPLOYEES.map((e, i) => ({ e, i })).filter(({ e }) => e.dept_id === d.dept_id)
      if (matched.length > 0) {
        matched.forEach(({ e, i: ei }) => rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di }))
      } else {
        rows.push({ emp_id: null, first_name: null, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'right', empIdx: null, deptIdx: di })
      }
    })
    return rows
  }

  const rows: JoinAnimRow[] = []
  const matchedDi = new Set<number>()
  EMPLOYEES.forEach((e, ei) => {
    const di = DEPARTMENTS.findIndex((d) => d.dept_id === e.dept_id)
    if (di !== -1) {
      matchedDi.add(di)
      const d = DEPARTMENTS[di]
      rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di })
    } else if (type === 'left' || type === 'full') {
      rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: null, location: null, _side: 'left', empIdx: ei, deptIdx: null })
    }
  })
  if (type === 'full') {
    DEPARTMENTS.forEach((d, di) => {
      if (!matchedDi.has(di)) {
        rows.push({ emp_id: null, first_name: null, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'right', empIdx: null, deptIdx: di })
      }
    })
  }
  return rows
}

// ── JoinAnimator ────────────────────────────────────────────────────────────

interface JoinAnimatorProps {
  type: JoinType
  joinRowCount: (n: number) => string
  queryDesc: string
}

export function JoinAnimator({ type, joinRowCount, queryDesc }: JoinAnimatorProps) {
  const lang = useSimulationStore((s) => s.lang)
  const animRows = buildAnimRows(type)
  const isCross  = type === 'cross'

  const [visibleCount, setVisibleCount] = useState(0)
  const [playing, setPlaying]           = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const t = setTimeout(() => { setVisibleCount(0); setPlaying(false) }, 0)
    return () => clearTimeout(t)
  }, [type])

  function startPlay() {
    if (playing) return
    setVisibleCount(0)
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    if (visibleCount >= animRows.length) {
      const t = setTimeout(() => setPlaying(false), 0)
      return () => clearTimeout(t)
    }
    timerRef.current = setTimeout(() => setVisibleCount((v) => v + 1), isCross ? 200 : 700)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, visibleCount, animRows.length, isCross])

  const currentRow    = playing && visibleCount < animRows.length ? animRows[visibleCount] : null
  const activeEmpIdx  = currentRow?.empIdx  ?? null
  const activeDeptIdx = currentRow?.deptIdx ?? null

  const doneEmpIdxs  = new Set(animRows.slice(0, visibleCount).map((r) => r.empIdx).filter((x): x is number => x !== null))
  const doneDeptIdxs = new Set(animRows.slice(0, visibleCount).map((r) => r.deptIdx).filter((x): x is number => x !== null))

  const ROW_COL: Record<JoinAnimRow['_side'], string> = {
    both:  'bg-ios-teal-light',
    left:  'bg-ios-blue-light',
    right: 'bg-muted/50',
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-muted/60 px-3 py-2.5">
        <SqlHighlight sql={JOIN_SQL[type]} />
      </div>

      <div className={cn('rounded-lg border px-3 py-2 text-[12px] leading-relaxed', C.border, C.bg, C.text)}>
        {queryDesc}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={startPlay}
          disabled={playing}
          className={cn(
            'rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
              : `${C.border} ${C.bg} ${C.text} hover:brightness-95`,
          )}
        >
          {playing ? (lang === 'ko' ? '▶ 실행 중...' : '▶ Running...') : (lang === 'ko' ? '▶ 조인 시작' : '▶ Start Join')}
        </button>

        <button
          onClick={() => { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount((v) => Math.max(0, v - 1)) }}
          disabled={playing || visibleCount === 0}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <button
          onClick={() => { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount((v) => Math.min(animRows.length, v + 1)) }}
          disabled={playing || visibleCount >= animRows.length}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>

        <span className="font-mono text-[11px] text-muted-foreground">
          {lang === 'ko' ? `총 ${animRows.length} 단계` : `${animRows.length} steps total`}
        </span>

        {visibleCount > 0 && !playing && (
          <button
            onClick={() => setVisibleCount(0)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            {lang === 'ko' ? '초기화' : 'Reset'}
          </button>
        )}
        {visibleCount > 0 && (
          <span className={cn('ml-auto font-mono text-[11px]', C.text)}>
            {joinRowCount(visibleCount)}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* LEFT: EMPLOYEES */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-ios-blue-dark">EMPLOYEES</p>
          <div className="overflow-hidden rounded-lg border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/60">
                  {(['emp_id', 'first_name', 'dept_id'] as const).map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-mono text-[9px] font-bold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map((e, ei) => {
                  const isActive = activeEmpIdx === ei
                  const isDone   = doneEmpIdxs.has(ei) && !isActive
                  return (
                    <motion.tr
                      key={e.emp_id}
                      animate={
                        isActive ? { backgroundColor: '#fef08a', scale: 1.02 }
                        : isDone  ? { backgroundColor: '#f0fdf4', scale: 1 }
                        :           { backgroundColor: '#ffffff', scale: 1 }
                      }
                      transition={{ duration: 0.2 }}
                      className="border-b last:border-0"
                    >
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{e.emp_id}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{e.first_name}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px] font-bold', e.dept_id === null ? 'italic text-muted-foreground/40' : isActive ? 'text-foreground' : 'text-ios-blue-dark')}>
                        {e.dept_id ?? 'NULL'}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTER: arrow + venn */}
        <div className="flex flex-col items-center justify-center gap-1 pt-6">
          <JoinVenn type={type} />
          <div className="flex flex-col items-center gap-0.5">
            <motion.div
              animate={playing ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
              transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
              className={cn('font-mono text-base font-bold', C.text)}
            >
              →
            </motion.div>
            <span className="font-mono text-[9px] text-muted-foreground">ON dept_id</span>
          </div>
        </div>

        {/* RIGHT: DEPARTMENTS */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-muted-foreground">DEPARTMENTS</p>
          <div className="overflow-hidden rounded-lg border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/60">
                  {(['dept_id', 'dept_name', 'location'] as const).map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-mono text-[9px] font-bold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((d, di) => {
                  const isActive = activeDeptIdx === di
                  const isDone   = doneDeptIdxs.has(di) && !isActive
                  return (
                    <motion.tr
                      key={d.dept_id}
                      animate={
                        isActive ? { backgroundColor: '#fef08a', scale: 1.02 }
                        : isDone  ? { backgroundColor: '#fff7ed', scale: 1 }
                        :           { backgroundColor: '#ffffff', scale: 1 }
                      }
                      transition={{ duration: 0.2 }}
                      className="border-b last:border-0"
                    >
                      <td className={cn('px-2 py-1 font-mono text-[10px] font-bold', isActive ? 'text-foreground' : 'text-foreground/70')}>{d.dept_id}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{d.dept_name}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{d.location}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Result rows */}
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-bold text-muted-foreground">
          {lang === 'ko' ? '결과' : 'Result'}
        </p>
        <div className="overflow-x-auto rounded-lg border bg-card text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/60">
                {(['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((h) => (
                  <th key={h} className={cn(
                    'whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold',
                    h === 'dept_id' ? 'text-ios-blue-dark'
                    : h === 'dept_name' || h === 'location' ? 'text-foreground/60'
                    : 'text-muted-foreground',
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {animRows.slice(0, visibleCount).map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: -6, backgroundColor: '#fef08a' }}
                    animate={{ opacity: 1, y: 0,  backgroundColor: row._side === 'both' ? '#e5f5fc' : row._side === 'left' ? '#e8f3ff' : '#f4f4f5' }}
                    transition={{ duration: 0.3 }}
                    className={cn('border-b last:border-0', ROW_COL[row._side])}
                  >
                    {(['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((col) => {
                      const val = row[col]
                      return (
                        <td key={col} className={cn('px-2 py-1 font-mono text-[10px]', val === null ? 'italic text-muted-foreground/40' : 'text-foreground/80')}>
                          {val ?? 'NULL'}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {visibleCount === 0 && (
                <tr><td colSpan={5} className="py-4 text-center font-mono text-[10px] text-muted-foreground/50">
                  {lang === 'ko' ? '▶ 조인 시작을 클릭해 시작하세요' : '▶ Press Run to start'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {visibleCount > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-ios-teal/40" />{lang === 'ko' ? '양쪽 일치' : 'Both match'}</span>
            {(type === 'left' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-ios-blue/30" />{lang === 'ko' ? '왼쪽만' : 'Left only'}</span>}
            {(type === 'right' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/20" />{lang === 'ko' ? '오른쪽만' : 'Right only'}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
