import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Employee } from '@/data'

// ── Shared bits ──────────────────────────────────────────────────────────────

const ACTIVE_BG =
  'color-mix(in srgb, var(--color-amber) 16%, var(--color-paper))'
const DONE_BG = 'var(--color-rail)'
const IDLE_BG = 'var(--color-paper)'

const T = {
  ko: {
    run: '▶ 재생',
    running: '▶ 재생 중...',
    prev: '이전',
    next: '다음',
    reset: '초기화',
    steps: (n: number) => `총 ${n} 단계`,
    idle: '▶ 재생을 클릭해 시작하세요',
  },
  en: {
    run: '▶ Play',
    running: '▶ Playing...',
    prev: 'Prev',
    next: 'Next',
    reset: 'Reset',
    steps: (n: number) => `${n} steps total`,
    idle: '▶ Press Play to start',
  },
}

// 재생 버튼 · 이전/다음 · 초기화 컨트롤. JoinSimulator 와 동일한 패턴.
function PlaybackControls({
  lang,
  playing,
  visibleCount,
  total,
  onPlay,
  onPrev,
  onNext,
  onReset,
}: {
  lang: 'ko' | 'en'
  playing: boolean
  visibleCount: number
  total: number
  onPlay: () => void
  onPrev: () => void
  onNext: () => void
  onReset: () => void
}) {
  const t = T[lang]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onPlay}
        disabled={playing}
        className={cn(
          'rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all',
          playing
            ? 'border-line bg-rail text-ink-2 cursor-not-allowed'
            : 'border-amber/40 bg-amber/8 text-amber hover:bg-amber/15'
        )}
      >
        {playing ? t.running : t.run}
      </button>

      <button
        onClick={onPrev}
        disabled={playing || visibleCount === 0}
        className="rounded-card border-line bg-paper text-ink-2 hover:bg-rail border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
      >
        ← {t.prev}
      </button>
      <button
        onClick={onNext}
        disabled={playing || visibleCount >= total}
        className="rounded-card border-line bg-paper text-ink-2 hover:bg-rail border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
      >
        {t.next} →
      </button>

      <span className="text-ink-2 font-mono text-[11px]">{t.steps(total)}</span>

      {visibleCount > 0 && !playing && (
        <button
          onClick={onReset}
          className="rounded-card border-line bg-paper text-ink-2 hover:bg-rail ml-auto border px-3 py-1.5 font-mono text-xs transition-colors"
        >
          {t.reset}
        </button>
      )}
    </div>
  )
}

function NullCell() {
  return <span className="text-ink-2/40 italic">NULL</span>
}

/** 재생 중 자동 진행 + 이전/다음/초기화를 관리하는 공통 훅. */
function usePlaybackSteps(total: number, stepMs = 700) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function play() {
    if (playing) return
    setVisibleCount(0)
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    if (visibleCount >= total) {
      const t = setTimeout(() => setPlaying(false), 0)
      return () => clearTimeout(t)
    }
    timerRef.current = setTimeout(() => setVisibleCount((v) => v + 1), stepMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [playing, visibleCount, total, stepMs])

  function prev() {
    setPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisibleCount((v) => Math.max(0, v - 1))
  }
  function next() {
    setPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisibleCount((v) => Math.min(total, v + 1))
  }
  function reset() {
    setPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisibleCount(0)
  }

  return { visibleCount, playing, play, prev, next, reset }
}

// ── PivotAnimator ────────────────────────────────────────────────────────────
// 원본 세로 행(dept_id, job_title, salary)이 하나씩 PIVOT 결과 테이블의
// 정확한 셀(dept_id 행 × job_title 열 교차점)로 이동해 채워지는 과정을 보여준다.

type EmpRow = Pick<Employee, 'first_name' | 'dept_id' | 'job_title' | 'salary'>
type PivotJob = 'IT Prog' | 'Sales Rep' | 'Accountant' | 'Finance Mgr'

const PIVOT_JOBS: PivotJob[] = [
  'IT Prog',
  'Sales Rep',
  'Accountant',
  'Finance Mgr',
]

export function PivotAnimator({
  lang,
  emps,
}: {
  lang: 'ko' | 'en'
  emps: EmpRow[]
}) {
  const t = T[lang]
  const depts = [...new Set(emps.map((e) => e.dept_id))].sort((a, b) => a - b)
  const { visibleCount, playing, play, prev, next, reset } = usePlaybackSteps(
    emps.length
  )

  const activeIdx = playing && visibleCount < emps.length ? visibleCount : null
  const activeRow = activeIdx !== null ? emps[activeIdx] : null
  const doneIdxs = new Set(Array.from({ length: visibleCount }, (_, i) => i))

  // 결과 테이블: 지금까지 처리된 행들만 반영한 누적 합계
  const cellValue = (dept: number, job: PivotJob): number | null => {
    const rows = emps
      .slice(0, visibleCount)
      .filter((e) => e.dept_id === dept && e.job_title === job)
    if (rows.length === 0) return null
    return rows.reduce((s, r) => s + r.salary, 0)
  }
  const isActiveCell = (dept: number, job: PivotJob) =>
    activeRow?.dept_id === dept && activeRow?.job_title === job

  return (
    <div className="flex flex-col gap-3">
      <PlaybackControls
        lang={lang}
        playing={playing}
        visibleCount={visibleCount}
        total={emps.length}
        onPlay={play}
        onPrev={prev}
        onNext={next}
        onReset={reset}
      />

      <div className="mt-1 grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_auto_1fr]">
        {/* LEFT: 원본 세로 데이터 */}
        <div>
          <p className="text-ink-2 mb-1 font-mono text-[10px] font-bold">
            {lang === 'ko' ? '원본 (세로)' : 'Source (rows)'}
          </p>
          <div className="rounded-card border-line-2 overflow-hidden border text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-rail">
                  {['dept_id', 'job_title', 'salary'].map((h) => (
                    <th
                      key={h}
                      className="border-line-2 text-ink-2 border-r border-b px-2 py-1.5 text-left font-mono text-[9px] font-bold tracking-[0.04em] whitespace-nowrap last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emps.map((e, i) => {
                  const isActive = activeIdx === i
                  const isDone = doneIdxs.has(i) && !isActive
                  return (
                    <motion.tr
                      key={i}
                      animate={{
                        backgroundColor: isActive
                          ? ACTIVE_BG
                          : isDone
                            ? DONE_BG
                            : IDLE_BG,
                        scale: isActive ? 1.015 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'border-line border-b last:border-0',
                        isActive &&
                          'shadow-[inset_3px_0_0_0_var(--color-amber)]'
                      )}
                    >
                      <td
                        className={cn(
                          'border-line px-2 py-1.5 font-mono text-[10px] tabular-nums',
                          isActive ? 'text-amber font-bold' : 'text-ink'
                        )}
                      >
                        {e.dept_id}
                      </td>
                      <td
                        className={cn(
                          'border-line px-2 py-1.5 font-mono text-[10px] whitespace-nowrap',
                          isActive ? 'text-amber font-bold' : 'text-ink'
                        )}
                      >
                        {e.job_title}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-1.5 font-mono text-[10px] tabular-nums',
                          isActive ? 'text-amber font-bold' : 'text-ink'
                        )}
                      >
                        {e.salary.toLocaleString()}
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
            className="text-amber rotate-90 font-mono text-base font-bold lg:rotate-0"
          >
            →
          </motion.div>
          <span className="text-ink-2 font-mono text-[9px] whitespace-nowrap">
            PIVOT
          </span>
        </div>

        {/* RIGHT: PIVOT 결과 */}
        <div>
          <p className="text-ink-2 mb-1 font-mono text-[10px] font-bold">
            {lang === 'ko' ? 'PIVOT 결과 (가로)' : 'PIVOT result (columns)'}
          </p>
          <div className="rounded-card border-line-2 overflow-x-auto border text-xs">
            <table className="border-collapse">
              <thead>
                <tr className="bg-rail">
                  <th className="border-line-2 text-ink-2 border-r border-b px-2 py-1.5 text-left font-mono text-[9px] font-bold whitespace-nowrap">
                    dept_id
                  </th>
                  {PIVOT_JOBS.map((job) => (
                    <th
                      key={job}
                      className={cn(
                        'border-line-2 border-r border-b px-2 py-1.5 text-left font-mono text-[9px] font-bold whitespace-nowrap last:border-r-0',
                        activeRow?.job_title === job
                          ? 'text-amber'
                          : 'text-ink-2'
                      )}
                    >
                      {job}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {depts.map((dept) => (
                  <tr key={dept} className="border-line border-b last:border-0">
                    <td
                      className={cn(
                        'border-line border-r px-2 py-1.5 font-mono text-[10px] font-bold tabular-nums',
                        activeRow?.dept_id === dept ? 'text-amber' : 'text-ink'
                      )}
                    >
                      {dept}
                    </td>
                    {PIVOT_JOBS.map((job) => {
                      const val = cellValue(dept, job)
                      const active = isActiveCell(dept, job)
                      return (
                        <motion.td
                          key={job}
                          animate={{
                            backgroundColor: active ? ACTIVE_BG : IDLE_BG,
                          }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'border-line border-r px-2 py-1.5 font-mono text-[10px] tabular-nums last:border-r-0',
                            active ? 'text-amber font-bold' : 'text-ink/80'
                          )}
                        >
                          {val != null ? val.toLocaleString() : <NullCell />}
                        </motion.td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleCount === 0 && (
            <p className="text-ink-3 mt-2 font-mono text-[10px]">{t.idle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── UnpivotAnimator ──────────────────────────────────────────────────────────
// PIVOT 결과(가로)의 셀들을 행 × 열 순서로 하나씩 훑으며, 값이 있는 셀만
// UNPIVOT 결과(세로) 테이블에 새 행으로 쌓이는 과정을 보여준다.

interface PivotResultRow {
  dept_id: number
  'IT Prog': number | null
  'Sales Rep': number | null
  Accountant: number | null
  'Finance Mgr': number | null
}

export function UnpivotAnimator({
  lang,
  pivotRows,
}: {
  lang: 'ko' | 'en'
  pivotRows: PivotResultRow[]
}) {
  const t = T[lang]

  // 훑는 순서: dept 행마다 4개 job 컬럼을 차례로 — NULL 인 조합도 "단계"에는
  // 포함시켜 스킵되는 걸 보여주되, 결과 행 카운트에는 반영하지 않는다.
  const scanOrder = pivotRows.flatMap((row) =>
    PIVOT_JOBS.map((job) => ({
      dept_id: row.dept_id,
      job,
      value: row[job] ?? null,
    }))
  )

  const { visibleCount, playing, play, prev, next, reset } = usePlaybackSteps(
    scanOrder.length
  )

  const activeIdx =
    playing && visibleCount < scanOrder.length ? visibleCount : null
  const active = activeIdx !== null ? scanOrder[activeIdx] : null

  const resultRows = scanOrder
    .slice(0, visibleCount)
    .filter((s) => s.value != null)

  return (
    <div className="flex flex-col gap-3">
      <PlaybackControls
        lang={lang}
        playing={playing}
        visibleCount={visibleCount}
        total={scanOrder.length}
        onPlay={play}
        onPrev={prev}
        onNext={next}
        onReset={reset}
      />

      <div className="mt-1 grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_auto_1fr]">
        {/* LEFT: PIVOT 결과 (가로) */}
        <div>
          <p className="text-ink-2 mb-1 font-mono text-[10px] font-bold">
            {lang === 'ko'
              ? '원본 — PIVOT 결과 (가로)'
              : 'Source — PIVOT result (wide)'}
          </p>
          <div className="rounded-card border-line-2 overflow-x-auto border text-xs">
            <table className="border-collapse">
              <thead>
                <tr className="bg-rail">
                  <th className="border-line-2 text-ink-2 border-r border-b px-2 py-1.5 text-left font-mono text-[9px] font-bold whitespace-nowrap">
                    dept_id
                  </th>
                  {PIVOT_JOBS.map((job) => (
                    <th
                      key={job}
                      className={cn(
                        'border-line-2 border-r border-b px-2 py-1.5 text-left font-mono text-[9px] font-bold whitespace-nowrap last:border-r-0',
                        active?.job === job ? 'text-amber' : 'text-ink-2'
                      )}
                    >
                      {job}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivotRows.map((row) => (
                  <tr
                    key={row.dept_id}
                    className="border-line border-b last:border-0"
                  >
                    <td
                      className={cn(
                        'border-line border-r px-2 py-1.5 font-mono text-[10px] font-bold tabular-nums',
                        active?.dept_id === row.dept_id
                          ? 'text-amber'
                          : 'text-ink'
                      )}
                    >
                      {row.dept_id}
                    </td>
                    {PIVOT_JOBS.map((job) => {
                      const val = row[job] ?? null
                      const isActive =
                        active?.dept_id === row.dept_id && active?.job === job
                      return (
                        <motion.td
                          key={job}
                          animate={{
                            backgroundColor: isActive ? ACTIVE_BG : IDLE_BG,
                          }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'border-line border-r px-2 py-1.5 font-mono text-[10px] tabular-nums last:border-r-0',
                            isActive ? 'text-amber font-bold' : 'text-ink/80'
                          )}
                        >
                          {val != null ? val.toLocaleString() : <NullCell />}
                        </motion.td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTER: arrow */}
        <div className="flex flex-col items-center justify-center gap-0.5 pt-8">
          <motion.div
            animate={playing ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
            transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
            className="text-amber rotate-90 font-mono text-base font-bold lg:rotate-0"
          >
            →
          </motion.div>
          <span className="text-ink-2 font-mono text-[9px] whitespace-nowrap">
            UNPIVOT
          </span>
        </div>

        {/* RIGHT: UNPIVOT 결과 (세로) */}
        <div>
          <p className="text-ink-2 mb-1 font-mono text-[10px] font-bold">
            {lang === 'ko' ? 'UNPIVOT 결과 (세로)' : 'UNPIVOT result (tall)'}
          </p>
          <div className="rounded-card border-line-2 overflow-hidden border text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-rail">
                  {['dept_id', 'job_title', 'total_sal'].map((h) => (
                    <th
                      key={h}
                      className="border-line-2 text-ink-2 border-r border-b px-2 py-1.5 text-left font-mono text-[9px] font-bold whitespace-nowrap last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-ink-3 px-3 py-6 text-center font-mono text-[10px]"
                    >
                      {t.idle}
                    </td>
                  </tr>
                )}
                {resultRows.map((r, i) => {
                  const isNewest = i === resultRows.length - 1
                  return (
                    <motion.tr
                      key={`${r.dept_id}-${r.job}`}
                      layout
                      initial={
                        isNewest
                          ? { opacity: 0, x: -12, backgroundColor: ACTIVE_BG }
                          : false
                      }
                      animate={{
                        opacity: 1,
                        x: 0,
                        backgroundColor: isNewest ? ACTIVE_BG : IDLE_BG,
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="border-line border-b last:border-0"
                    >
                      <td className="text-ink border-line border-r px-2 py-1.5 font-mono text-[10px] font-bold tabular-nums">
                        {r.dept_id}
                      </td>
                      <td className="text-ink border-line border-r px-2 py-1.5 font-mono text-[10px] whitespace-nowrap">
                        {r.job}
                      </td>
                      <td className="text-ink px-2 py-1.5 font-mono text-[10px] tabular-nums">
                        {r.value!.toLocaleString()}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
