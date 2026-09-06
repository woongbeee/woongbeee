import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLangStore } from '@/store/simulationStore'
import { ResultTable, type ResultCell, type ResultColumn } from '@/book/chapters/shared'
import {
  EMPLOYEES, DEPARTMENTS,
  buildAnimRows, defaultRowCount,
  type JoinType, type JoinAnimRow,
} from './joinData'

// ── JoinSimulator ──────────────────────────────────────────────────────────
// 조인 한 종류의 employees ⋈ departments 결합 과정을 단계별로 애니메이션한다.
// SQL 코드 블록·벤 다이어그램은 포함하지 않는다 — 필요하면 사용처에서 직접
// 구현해서 이 컴포넌트 옆에 배치한다 (예: JoinSection.tsx).
// 보통은 조인 종류별 래퍼 컴포넌트(InnerJoinSim 등)를 통해 쓰지만, 직접
// type 을 넘겨도 된다.

export interface JoinSimulatorProps {
  type: JoinType
  /** 쿼리 설명 문단. 생략 시 joinData 의 기본 문구 사용. */
  queryDesc?: string
  /** "N개 행 반환" 라벨. 생략 시 언어별 기본 포맷. */
  rowCountLabel?: (n: number) => string
}

// 활성 행 강조 — 솔리드 색이 아닌 옅은 틴트 + 좌측 amber 바.
// (이전엔 backgroundColor: var(--color-amber) 솔리드라서 amber 텍스트가 안 보였음)
const ACTIVE_BG = 'color-mix(in srgb, var(--color-amber) 16%, var(--color-paper))'
const DONE_BG   = 'var(--color-rail)'
const IDLE_BG   = 'var(--color-paper)'

// 결과 행 톤 (조인 출처별) — ResultTable 의 ResultCell.tone 에 매핑
const RESULT_TONE: Record<JoinAnimRow['_side'], 'green' | 'blue' | 'amber'> = {
  both:  'green',
  left:  'blue',
  right: 'amber',
}

const RESULT_COLUMNS: ResultColumn[] = [
  { label: 'emp_id' },
  { label: 'first_name' },
  { label: 'dept_id', badge: 'FK' },
  { label: 'dept_name' },
  { label: 'location' },
]

function toResultRow(row: JoinAnimRow): ResultCell[] {
  const tone = RESULT_TONE[row._side]
  return (['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((col) => {
    const val = row[col]
    if (val === null) return null
    return col === 'dept_id' ? { v: val, tone, strong: true } : { v: val, tone }
  })
}

export function JoinSimulator({ type, queryDesc, rowCountLabel }: JoinSimulatorProps) {
  const lang = useLangStore((s) => s.lang)
  const animRows = buildAnimRows(type)
  const isCross  = type === 'cross'

  const desc  = queryDesc ?? ''
  const count = rowCountLabel ?? ((n: number) => defaultRowCount(lang, n))

  const [visibleCount, setVisibleCount] = useState(0)
  const [playing, setPlaying]           = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 조인 종류가 바뀌면 처음으로 되감는다
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

  return (
    <div className="flex flex-col gap-3">
      {desc && (
        <div className="rounded-card border border-line bg-rail px-3 py-2 text-[12px] leading-relaxed text-ink/80">
          {desc}
        </div>
      )}

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={startPlay}
          disabled={playing}
          className={cn(
            'rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'cursor-not-allowed border-line bg-rail text-ink-2'
              : 'border-amber/40 bg-amber/8 text-amber hover:bg-amber/15',
          )}
        >
          {playing
            ? (lang === 'ko' ? '▶ 실행 중...' : '▶ Running...')
            : (lang === 'ko' ? '▶ 조인 시작' : '▶ Start Join')}
        </button>

        <button
          onClick={() => { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount((v) => Math.max(0, v - 1)) }}
          disabled={playing || visibleCount === 0}
          className="rounded-card border border-line bg-paper px-3 py-1.5 font-mono text-xs text-ink-2 transition-colors hover:bg-rail disabled:opacity-40"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <button
          onClick={() => { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount((v) => Math.min(animRows.length, v + 1)) }}
          disabled={playing || visibleCount >= animRows.length}
          className="rounded-card border border-line bg-paper px-3 py-1.5 font-mono text-xs text-ink-2 transition-colors hover:bg-rail disabled:opacity-40"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>

        <span className="font-mono text-[11px] text-ink-2">
          {lang === 'ko' ? `총 ${animRows.length} 단계` : `${animRows.length} steps total`}
        </span>

        {visibleCount > 0 && !playing && (
          <button
            onClick={() => setVisibleCount(0)}
            className="rounded-card border border-line bg-paper px-3 py-1.5 font-mono text-xs text-ink-2 transition-colors hover:bg-rail"
          >
            {lang === 'ko' ? '초기화' : 'Reset'}
          </button>
        )}
        {visibleCount > 0 && (
          <span className="ml-auto font-mono text-[11px] text-amber">
            {count(visibleCount)}
          </span>
        )}
      </div>

      {/* source tables + arrow */}
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* LEFT: EMPLOYEES */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-blue">EMPLOYEES</p>
          <div className="overflow-hidden rounded-card border border-line-2 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-rail">
                  {(['emp_id', 'first_name', 'dept_id'] as const).map((h) => (
                    <th key={h} className="border-b border-r border-line-2 px-2 py-1.5 text-left font-mono text-[9px] font-bold tracking-[0.04em] text-ink-2 last:border-r-0">{h}</th>
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
                      animate={{
                        backgroundColor: isActive ? ACTIVE_BG : isDone ? DONE_BG : IDLE_BG,
                        scale: isActive ? 1.015 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn('border-b border-line last:border-0', isActive && 'shadow-[inset_3px_0_0_0_var(--color-amber)]')}
                    >
                      <td className={cn('border-r border-line px-2 py-1.5 font-mono text-[10px] tabular-nums', isActive ? 'font-bold text-ink' : 'text-ink')}>{e.emp_id}</td>
                      <td className={cn('border-r border-line px-2 py-1.5 font-mono text-[10px]', isActive ? 'font-bold text-ink' : 'text-ink')}>{e.first_name}</td>
                      <td className={cn('px-2 py-1.5 font-mono text-[10px] tabular-nums', e.dept_id === null ? 'italic text-ink-3' : isActive ? 'font-bold text-amber' : 'font-medium text-blue')}>
                        {e.dept_id ?? '(null)'}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTER: arrow */}
        <div className="flex flex-col items-center justify-center gap-0.5 pt-8">
          <motion.div
            animate={playing ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
            transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
            className="font-mono text-base font-bold text-amber"
          >
            →
          </motion.div>
          <span className="font-mono text-[9px] text-ink-2">
            {isCross ? (lang === 'ko' ? '조건 없음' : 'no ON') : 'ON dept_id'}
          </span>
        </div>

        {/* RIGHT: DEPARTMENTS */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-ink-2">DEPARTMENTS</p>
          <div className="overflow-hidden rounded-card border border-line-2 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-rail">
                  {(['dept_id', 'dept_name', 'location'] as const).map((h) => (
                    <th key={h} className="border-b border-r border-line-2 px-2 py-1.5 text-left font-mono text-[9px] font-bold tracking-[0.04em] text-ink-2 last:border-r-0">{h}</th>
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
                      animate={{
                        backgroundColor: isActive ? ACTIVE_BG : isDone ? DONE_BG : IDLE_BG,
                        scale: isActive ? 1.015 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn('border-b border-line last:border-0', isActive && 'shadow-[inset_3px_0_0_0_var(--color-amber)]')}
                    >
                      <td className={cn('border-r border-line px-2 py-1.5 font-mono text-[10px] font-medium tabular-nums', isActive ? 'font-bold text-amber' : 'text-blue')}>{d.dept_id}</td>
                      <td className={cn('border-r border-line px-2 py-1.5 font-mono text-[10px]', isActive ? 'font-bold text-ink' : 'text-ink')}>{d.dept_name}</td>
                      <td className={cn('px-2 py-1.5 font-mono text-[10px]', isActive ? 'font-bold text-ink' : 'text-ink')}>{d.location}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* result rows */}
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-bold text-ink-2">
          {lang === 'ko' ? '결과' : 'Result'}
        </p>

        {visibleCount === 0 ? (
          <div className="flex items-center justify-center rounded-card border border-line-2 bg-paper py-8 font-mono text-[10px] text-ink-3">
            {lang === 'ko' ? '▶ 조인 시작을 클릭해 시작하세요' : '▶ Press Run to start'}
          </div>
        ) : (
          <ResultTable
            columns={RESULT_COLUMNS}
            rows={animRows.slice(0, visibleCount).map(toResultRow)}
            selectedRow={visibleCount - 1}
            footer={[count(visibleCount)]}
          />
        )}

        {visibleCount > 0 && (
          <div className="-mt-[18px] flex flex-wrap gap-3 font-mono text-[10px] text-ink-2">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-chip bg-green/40" />{lang === 'ko' ? '양쪽 일치' : 'Both match'}</span>
            {(type === 'left' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-chip bg-blue/40" />{lang === 'ko' ? '왼쪽만' : 'Left only'}</span>}
            {(type === 'right' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-chip bg-amber/40" />{lang === 'ko' ? '오른쪽만' : 'Right only'}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
