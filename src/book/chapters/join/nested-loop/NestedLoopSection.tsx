import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'Nested Loop Join',
    subtitle: 'Outer 테이블의 각 행마다 Inner 테이블을 반복 탐색하는 조인이에요. Inner 테이블에 선택도 높은 인덱스가 있을 때 가장 효율적이에요.',

    whatTitle: 'Nested Loop Join이란?',
    whatDesc:
      'Nested Loop Join은 이중 FOR 루프로 동작해요. 외부 루프는 outer table(driving table)에서 행을 하나씩 가져오고, 내부 루프는 가져온 행의 조인 키를 사용해 inner table에서 일치하는 행을 찾아요.\n\nInner 테이블에 조인 조건을 만족하는 인덱스가 있으면 각 내부 루프 반복에서 인덱스 탐색만으로 끝나므로 매우 효율적이에요. Outer 행 하나당 Inner 테이블을 처음부터 다시 읽는 게 아니라, 인덱스로 바로 접근해요.',

    pseudoTitle: '동작 원리 (의사 코드)',
    pseudoDesc: '다음 의사 코드처럼 동작해요.',
    pseudoSql: `FOR each row erow IN outer_table LOOP
  FOR each row drow IN inner_table
    WHERE inner_table.join_key = erow.join_key LOOP
      output joined row (erow, drow)
  END LOOP
END LOOP`,

    simTitle: 'Nested Loop 시뮬레이션',
    simDesc: 'Outer 행 하나를 고르면, Inner 테이블 전체를 처음부터 끝까지 순환하며 dept_id가 일치하는 행을 찾아요. Outer 행이 바뀌면 Inner 스캔이 처음부터 다시 시작돼요.',
    labelOuter: 'OUTER (DEPARTMENTS)',
    labelInner: 'INNER (EMPLOYEES)',
    labelResult: '결과',
    labelInnerScan: 'Inner 전체 스캔',
    labelMatch: '매칭',
    labelNoMatch: '불일치',
    labelSelectOuter: '← Outer 행 선택',
    labelInnerLoop: (cur: number, total: number) => `Inner 스캔 ${cur} / ${total}`,
    btnPrev: '← 이전',
    btnNext: '다음 →',
    btnReset: '↺ 리셋',
    btnPlay: '▶ 자동 재생',
    btnPause: '⏸ 일시정지',
    statusMatch: '✓ 매칭',
    statusNoMatch: '✗ 불일치',
    statusDone: '완료',
    noteRestart: '⟳ Inner 스캔 재시작',
  },
  en: {
    title: 'Nested Loop Join',
    subtitle: 'For each row in the outer table, Oracle probes the inner table for matching rows — most efficient when the inner table has a highly selective index.',

    whatTitle: 'What Is a Nested Loop Join?',
    whatDesc:
      'A Nested Loop Join operates as two nested FOR loops. The outer loop fetches rows one by one from the outer (driving) table; the inner loop uses the join key from each fetched row to look up matching rows in the inner table.\n\nWhen the inner table has an index that satisfies the join condition, each inner loop iteration is just an index lookup — Oracle does not restart a full scan from the beginning for every outer row.',

    pseudoTitle: 'How It Works (Pseudocode)',
    pseudoDesc: 'The algorithm operates as follows.',
    pseudoSql: `FOR each row erow IN outer_table LOOP
  FOR each row drow IN inner_table
    WHERE inner_table.join_key = erow.join_key LOOP
      output joined row (erow, drow)
  END LOOP
END LOOP`,

    simTitle: 'Nested Loop Simulation',
    simDesc: 'Select an outer row — the inner table is scanned from the beginning every time, checking each row for a dept_id match. When the outer row changes, the inner scan restarts from the top.',
    labelOuter: 'OUTER (DEPARTMENTS)',
    labelInner: 'INNER (EMPLOYEES)',
    labelResult: 'Result',
    labelInnerScan: 'Full Inner Scan',
    labelMatch: 'Match',
    labelNoMatch: 'No match',
    labelSelectOuter: '← Select outer row',
    labelInnerLoop: (cur: number, total: number) => `Inner scan ${cur} / ${total}`,
    btnPrev: '← Prev',
    btnNext: 'Next →',
    btnReset: '↺ Reset',
    btnPlay: '▶ Auto Play',
    btnPause: '⏸ Pause',
    statusMatch: '✓ Match',
    statusNoMatch: '✗ No match',
    statusDone: 'Done',
    noteRestart: '⟳ Inner scan restarts',
  },
}

const hintT = {
  ko: {
    hintTitle: '힌트로 제어하기',
    hintSql: `-- Nested Loop Join 강제 (d를 inner로)
SELECT /*+ USE_NL(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 특정 인덱스를 사용하는 Nested Loop 강제
SELECT /*+ USE_NL_WITH_INDEX(d dept_id_pk) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Nested Loop 방지
SELECT /*+ NO_USE_NL(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
    summaryTitle: 'Nested Loop Join 핵심 정리',
    summaryItems: [
      'Outer 행마다 Inner 테이블을 처음부터 전체 스캔(또는 인덱스 탐색)해요.',
      'Inner 테이블에 선택도 높은 인덱스가 있을 때 가장 효율적이에요.',
      '힌트: USE_NL(테이블) (강제), USE_NL_WITH_INDEX(테이블 인덱스), NO_USE_NL(테이블) (방지).',
    ],
  },
  en: {
    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Nested Loop Join (d as inner table)
SELECT /*+ USE_NL(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Force Nested Loop with a specific index
SELECT /*+ USE_NL_WITH_INDEX(d dept_id_pk) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress Nested Loop Join
SELECT /*+ NO_USE_NL(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
    summaryTitle: 'Nested Loop Join Key Takeaways',
    summaryItems: [
      'For every outer row, the inner table is fully scanned (or probed via index) from the start.',
      'Most efficient when the inner table has a highly selective index on the join column.',
      'Hints: USE_NL(table) (force), USE_NL_WITH_INDEX(table index), NO_USE_NL(table) (suppress).',
    ],
  },
}

// ── Data ──────────────────────────────────────────────────────────────────

const OUTER_ROWS = [
  { dept_id: 10, dept_name: 'Engineering' },
  { dept_id: 20, dept_name: 'Analytics'   },
  { dept_id: 30, dept_name: 'Support'     },
  { dept_id: 40, dept_name: 'Marketing'   },
]

const INNER_ROWS = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20 },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10 },
  { emp_id: 104, first_name: 'David',  dept_id: 30 },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20 },
  { emp_id: 106, first_name: 'Frank',  dept_id: 30 },
  { emp_id: 107, first_name: 'Grace',  dept_id: 10 },
]

interface NLResult {
  outerDeptId: number
  outerDeptName: string
  innerEmpId: number
  innerName: string
}

// ── Simulator ─────────────────────────────────────────────────────────────

// NL 자동재생: 전체 상태를 (outerIdx, innerStep) 쌍의 시퀀스로 플래튼해서 순서대로 진행
interface NLPlayState { outerIdx: number; innerStep: number }
function buildPlaySequence(): NLPlayState[] {
  const seq: NLPlayState[] = []
  for (let o = 0; o < OUTER_ROWS.length; o++) {
    for (let s = 1; s <= INNER_ROWS.length; s++) {
      seq.push({ outerIdx: o, innerStep: s })
    }
  }
  return seq
}
const NL_PLAY_SEQ = buildPlaySequence()

function NLSimulation({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]

  const [outerIdx, setOuterIdx] = useState<number | null>(null)
  const [innerStep, setInnerStep] = useState(0)
  const [results, setResults] = useState<NLResult[]>([])
  const [prevOuterIdx, setPrevOuterIdx] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimer() { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }

  function selectOuter(idx: number) {
    if (idx === outerIdx) return
    clearTimer(); setPlaying(false)
    setPrevOuterIdx(outerIdx)
    setOuterIdx(idx)
    setInnerStep(0)
  }

  function stepForward() {
    if (outerIdx === null) return
    const next = innerStep + 1
    if (next > INNER_ROWS.length) return
    setInnerStep(next)
    const inner = INNER_ROWS[next - 1]
    const outer = OUTER_ROWS[outerIdx]
    if (inner.dept_id === outer.dept_id) {
      setResults((r) => [...r, { outerDeptId: outer.dept_id, outerDeptName: outer.dept_name, innerEmpId: inner.emp_id, innerName: inner.first_name }])
    }
  }

  function stepBackward() {
    if (innerStep === 0) return
    const prev = innerStep - 1
    if (prev >= 0) {
      const inner = INNER_ROWS[prev]
      const outer = outerIdx !== null ? OUTER_ROWS[outerIdx] : null
      if (outer && inner.dept_id === outer.dept_id) {
        setResults((r) => r.slice(0, -1))
      }
    }
    setInnerStep(prev)
  }

  function reset() {
    clearTimer(); setPlaying(false)
    setOuterIdx(null); setPrevOuterIdx(null)
    setInnerStep(0); setResults([])
  }

  function togglePlay() {
    if (playing) { clearTimer(); setPlaying(false); return }
    // 처음 시작이거나 끝난 후 재시작
    const isFinished = outerIdx === OUTER_ROWS.length - 1 && innerStep >= INNER_ROWS.length
    if (isFinished) reset()
    setPlaying(true)
  }

  // 자동재생 ticker
  useEffect(() => {
    if (!playing) return
    const seqIdx = NL_PLAY_SEQ.findIndex(
      (s) => s.outerIdx === (outerIdx ?? -1) && s.innerStep === innerStep
    )
    const nextSeqIdx = seqIdx + 1
    if (nextSeqIdx >= NL_PLAY_SEQ.length) {
      setPlaying(false); return
    }
    const next = NL_PLAY_SEQ[nextSeqIdx]
    const outerChanged = outerIdx !== next.outerIdx
    const delay = outerChanged ? 1200 : 700
    timerRef.current = setTimeout(() => {
      if (outerChanged) {
        setPrevOuterIdx(outerIdx)
        setOuterIdx(next.outerIdx)
        setInnerStep(0)
        // innerStep을 0으로 먼저 세팅 후 다음 tick에서 1로 진행
        timerRef.current = setTimeout(() => {
          setInnerStep(1)
          const inner = INNER_ROWS[0]
          const outer = OUTER_ROWS[next.outerIdx]
          if (inner.dept_id === outer.dept_id) {
            setResults((r) => [...r, { outerDeptId: outer.dept_id, outerDeptName: outer.dept_name, innerEmpId: inner.emp_id, innerName: inner.first_name }])
          }
        }, 400)
      } else {
        setInnerStep(next.innerStep)
        const inner = INNER_ROWS[next.innerStep - 1]
        const outer = OUTER_ROWS[next.outerIdx]
        if (inner.dept_id === outer.dept_id) {
          setResults((r) => {
            const alreadyHas = r.some((x) => x.outerDeptId === outer.dept_id && x.innerName === inner.first_name)
            return alreadyHas ? r : [...r, { outerDeptId: outer.dept_id, outerDeptName: outer.dept_name, innerEmpId: inner.emp_id, innerName: inner.first_name }]
          })
        }
      }
    }, delay)
    return clearTimer
  }, [playing, outerIdx, innerStep])

  // 재생 시작 시 첫 번째 outer 선택
  useEffect(() => {
    if (playing && outerIdx === null) {
      timerRef.current = setTimeout(() => {
        setPrevOuterIdx(null)
        setOuterIdx(0)
        setInnerStep(0)
      }, 400)
      return clearTimer
    }
  }, [playing, outerIdx])

  const currentInnerRow = innerStep > 0 && innerStep <= INNER_ROWS.length ? INNER_ROWS[innerStep - 1] : null
  const outerRow = outerIdx !== null ? OUTER_ROWS[outerIdx] : null
  const isMatch = currentInnerRow !== null && outerRow !== null && currentInnerRow.dept_id === outerRow.dept_id
  const innerDone = outerIdx !== null && innerStep >= INNER_ROWS.length
  const allDone = outerIdx === OUTER_ROWS.length - 1 && innerDone

  return (
    <div className="rounded-panel border border-line bg-paper-sunk p-5">
      <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2">
        {t.simTitle}
      </p>
      <p className="mb-4 text-[12px] leading-relaxed text-ink-2">{t.simDesc}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* OUTER */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-blue">{t.labelOuter}</p>
          <div className="flex flex-col gap-1.5">
            {OUTER_ROWS.map((row, i) => {
              const isSelected = outerIdx === i
              const wasSelected = prevOuterIdx === i
              return (
                <button
                  key={row.dept_id}
                  onClick={() => selectOuter(i)}
                  className={cn(
                    'rounded-card border px-3 py-2 text-left font-mono text-xs transition-all',
                    isSelected
                      ? 'border-blue/50 bg-blue/10 font-bold text-blue '
                      : wasSelected
                        ? 'border-line-2 bg-paper-sunk text-ink-2 line-through'
                        : 'border-line bg-paper text-ink-2 hover:bg-rail',
                  )}
                >
                  <span className="text-[10px] text-ink-2 mr-1">dept_id=</span>
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 text-[10px] opacity-70">{row.dept_name}</span>
                  {isSelected && innerStep === 0 && (
                    <span className="ml-2 text-[9px] text-blue">{t.labelSelectOuter}</span>
                  )}
                </button>
              )
            })}
          </div>
          {prevOuterIdx !== null && outerIdx !== null && (
            <p className="mt-2 font-mono text-[9px] text-amber">{t.noteRestart}</p>
          )}
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center justify-center pt-6">
          <span className="text-xl text-ink-2/30">→</span>
        </div>

        {/* INNER */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-amber">{t.labelInner}</p>
          <div className="flex flex-col gap-1.5">
            {INNER_ROWS.map((row, i) => {
              const isCurrent = innerStep === i + 1
              const isPassed  = innerStep > i + 1
              const matched   = isPassed && outerRow && row.dept_id === outerRow.dept_id
              return (
                <motion.div
                  key={row.emp_id}
                  animate={
                    isCurrent
                      ? { backgroundColor: 'var(--color-amber)', scale: 1.02 }
                      : matched
                        ? { backgroundColor: 'var(--color-line)', scale: 1 }
                        : isPassed
                          ? { backgroundColor: 'var(--color-paper-sunk)', scale: 1 }
                          : { backgroundColor: 'var(--color-paper)', scale: 1 }
                  }
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-xs',
                    isCurrent
                      ? 'border-amber/50 font-bold text-amber'
                      : matched
                        ? 'border-green/50 text-green'
                        : isPassed
                          ? 'border-line text-ink-2'
                          : 'border-line text-ink-2',
                  )}
                >
                  <span className="text-[10px] opacity-60 mr-1">dept_id=</span>
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 text-[10px]">{row.first_name}</span>
                  {isCurrent && (
                    <span className={cn('ml-1 text-[9px] font-bold', isMatch ? 'text-green' : 'text-red')}>
                      {isMatch ? '✓' : '✗'}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
          {outerIdx !== null && (
            <p className="mt-2 font-mono text-[9px] text-ink-2">
              {innerDone ? t.statusDone : t.labelInnerLoop(innerStep, INNER_ROWS.length)}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center justify-center pt-6">
          <span className="text-xl text-ink-2/30">→</span>
        </div>

        {/* RESULT */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-green">{t.labelResult}</p>
          <div className="flex flex-col gap-1.5 min-h-[40px]">
            <AnimatePresence initial={false}>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-card border border-green/30 bg-green/5 px-3 py-2 font-mono text-[10px] text-green"
                >
                  <span className="font-bold">{r.outerDeptId}</span>
                  <span className="mx-1 opacity-50">·</span>
                  <span className="opacity-70">{r.outerDeptName}</span>
                  <span className="mx-1 opacity-40">↔</span>
                  <span className="font-bold">{r.innerName}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {results.length === 0 && (
              <p className="font-mono text-[10px] text-ink-2/40 italic">
                {outerIdx === null ? t.labelSelectOuter : '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={togglePlay}
          disabled={allDone && !playing}
          className={cn(
            'rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-amber/50 bg-amber/5 text-amber hover:bg-amber/10'
              : 'border-blue/50 bg-blue/5 text-blue hover:bg-blue/10 disabled:opacity-30',
          )}
        >
          {playing ? t.btnPause : t.btnPlay}
        </button>
        <button
          onClick={stepBackward}
          disabled={playing || outerIdx === null || innerStep === 0}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30"
        >
          {t.btnPrev}
        </button>
        <button
          onClick={stepForward}
          disabled={playing || outerIdx === null || innerDone}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30"
        >
          {t.btnNext}
        </button>
        <button
          onClick={reset}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail"
        >
          {t.btnReset}
        </button>
        {currentInnerRow && outerRow && (
          <span className={cn('ml-auto self-center font-mono text-[11px] font-bold', isMatch ? 'text-green' : 'text-red')}>
            {isMatch ? t.statusMatch : t.statusNoMatch}
          </span>
        )}
      </div>
    </div>
  )
}

export function JoinNestedLoopSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const ht = hintT[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-blue" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.pseudoTitle}</SectionTitle>
      <Prose>{t.pseudoDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.pseudoSql} />
      </div>

      <Divider />

      <SectionTitle>{t.simTitle}</SectionTitle>
      <NLSimulation lang={lang} />

      <Divider />

      <SectionTitle>{ht.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={ht.hintSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {ht.summaryItems.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
