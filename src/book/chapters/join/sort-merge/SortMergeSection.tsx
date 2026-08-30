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
    title: 'Sort Merge Join',
    subtitle: '양쪽 데이터 집합을 조인 키로 정렬한 뒤 순차적으로 병합해요. 비등치(범위) 조인이나 이미 정렬된 데이터에서 특히 유리해요.',

    whatTitle: 'Sort Merge Join이란?',
    whatDesc:
      'Sort Merge Join은 두 데이터 집합을 조인 키로 정렬한 다음, 두 포인터를 앞으로 이동시키며 병합해요.\n\n첫 번째 집합에서 행을 하나 읽고, 두 번째 집합에서 키가 일치하는 시작 행을 찾아요. 키가 같은 행을 모두 반환한 뒤 불일치가 발생하면 첫 번째 집합의 다음 행으로 넘어가요 — Nested Loop처럼 처음부터 다시 스캔하지 않아요.',

    pseudoTitle: '동작 원리 (의사 코드)',
    pseudoDesc: '정렬 후 병합 단계는 다음과 같이 동작해요.',
    pseudoSql: `-- 1. 두 집합을 조인 키로 정렬
SORT dataset1 ON join_key
SORT dataset2 ON join_key

-- 2. 병합
read first row from dataset1 (key1)
read first row from dataset2 (key2)
WHILE NOT eof on both datasets LOOP
  IF key1 = key2 THEN
    output joined row, advance both pointers
  ELSIF key1 < key2 THEN
    read next row from dataset1
  ELSIF key1 > key2 THEN
    read next row from dataset2
  END IF
END LOOP`,

    advantageTitle: 'Nested Loop와의 차이',
    advantageDesc:
      'Nested Loop는 Outer 행마다 Inner를 처음부터 반복 탐색해요. Sort Merge는 병합 시 두 번째 집합에서 탐색을 처음부터 다시 시작하지 않아요 — 일치하지 않는 행을 만나면 그 위치에서 멈추고 첫 번째 집합의 다음 행으로만 이동해요.\n\n이미 정렬된 데이터(예: 인덱스 Range Scan 결과, ORDER BY가 이미 처리된 결과)에서는 정렬 비용 자체가 사라지므로 특히 효율적이에요.',

    simTitle: 'Sort Merge 시뮬레이션',
    simDesc: '두 포인터(▶)가 각각 앞으로만 이동해요. key1 < key2면 왼쪽 포인터 전진, key1 > key2면 오른쪽 포인터 전진, key1 = key2면 결과에 추가 후 양쪽 전진 — 오른쪽 포인터는 절대 뒤로 돌아가지 않아요.',
    labelLeft: '① 정렬됨 (DEPARTMENTS)',
    labelRight: '② 정렬됨 (EMPLOYEES)',
    labelResult: '결과',
    labelPtr: '▶',
    labelCompare: '비교',
    labelAdvLeft: '← 왼쪽 전진 (key1 < key2)',
    labelAdvRight: '오른쪽 전진 (key1 > key2) →',
    labelAdvBoth: '양쪽 전진 + 결과 추가 (key1 = key2)',
    labelSkipped: '건너뜀',
    labelPointer: (side: string) => `${side} 포인터`,
    btnPrev: '← 이전',
    btnNext: '다음 →',
    btnReset: '↺ 리셋',
    btnPlay: '▶ 자동 재생',
    btnPause: '⏸ 일시정지',
    statusDone: '병합 완료',
    labelProgress: (step: number) => `단계 ${step}`,
    noteNoRestart: '※ 오른쪽 포인터는 되돌아가지 않아요',
  },
  en: {
    title: 'Sort Merge Join',
    subtitle: 'Sorts both datasets on the join key and merges them sequentially — especially efficient for non-equijoins or pre-sorted data.',

    whatTitle: 'What Is a Sort Merge Join?',
    whatDesc:
      'A Sort Merge Join sorts both datasets on the join key, then merges them by advancing two pointers forward.\n\nFor each row from the first dataset, it finds the starting row in the second dataset where the key matches, outputs all matching rows, and when a mismatch occurs, advances to the next row in the first dataset — unlike Nested Loop, it does not restart from the beginning of the second dataset.',

    pseudoTitle: 'How It Works (Pseudocode)',
    pseudoDesc: 'The sort and merge steps operate as follows.',
    pseudoSql: `-- 1. Sort both datasets on the join key
SORT dataset1 ON join_key
SORT dataset2 ON join_key

-- 2. Merge
read first row from dataset1 (key1)
read first row from dataset2 (key2)
WHILE NOT eof on both datasets LOOP
  IF key1 = key2 THEN
    output joined row, advance both pointers
  ELSIF key1 < key2 THEN
    read next row from dataset1
  ELSIF key1 > key2 THEN
    read next row from dataset2
  END IF
END LOOP`,

    advantageTitle: 'Difference from Nested Loop',
    advantageDesc:
      "Nested Loop restarts scanning the inner table from scratch for every outer row. Sort Merge does not — when a mismatch occurs, it simply stops at the current position in the second dataset and advances to the next row in the first.\n\nWhen data is already sorted (for example, from an index range scan or a prior ORDER BY), the sort step is eliminated entirely, making Sort Merge highly efficient.",

    simTitle: 'Sort Merge Simulation',
    simDesc: 'Two pointers (▶) each move forward only. If key1 < key2, advance the left pointer; if key1 > key2, advance the right; if key1 = key2, add to result and advance both — the right pointer never goes back.',
    labelLeft: '① Sorted (DEPARTMENTS)',
    labelRight: '② Sorted (EMPLOYEES)',
    labelResult: 'Result',
    labelPtr: '▶',
    labelCompare: 'Compare',
    labelAdvLeft: '← Advance left (key1 < key2)',
    labelAdvRight: 'Advance right (key1 > key2) →',
    labelAdvBoth: 'Advance both + emit row (key1 = key2)',
    labelSkipped: 'skipped',
    labelPointer: (side: string) => `${side} pointer`,
    btnPrev: '← Prev',
    btnNext: 'Next →',
    btnReset: '↺ Reset',
    btnPlay: '▶ Auto Play',
    btnPause: '⏸ Pause',
    statusDone: 'Merge complete',
    labelProgress: (step: number) => `Step ${step}`,
    noteNoRestart: '※ The right pointer never goes back',
  },
}

const hintT = {
  ko: {
    hintTitle: '힌트로 제어하기',
    hintSql: `-- Sort Merge Join 강제
SELECT /*+ USE_MERGE(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Sort Merge Join 방지
SELECT /*+ NO_USE_MERGE(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 비등치 조건에서 Sort Merge 사용 예시
SELECT e.last_name, s.grade
FROM   employees e, salary_grades s
WHERE  e.salary BETWEEN s.low_sal AND s.high_sal;`,
    summaryTitle: 'Sort Merge Join 핵심 정리',
    summaryItems: [
      '두 집합을 조인 키로 정렬한 뒤 병합해요. 병합 시 처음부터 다시 스캔하지 않아요.',
      '비등치(범위) 조인에서 Hash Join을 대신해요 — <, <=, >, >=, BETWEEN 조건에서 사용 가능해요.',
      '이미 정렬된 데이터에서는 정렬 비용이 없어서 효율적이에요.',
      '힌트: USE_MERGE(테이블) (강제), NO_USE_MERGE(테이블) (방지).',
    ],
  },
  en: {
    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Sort Merge Join
SELECT /*+ USE_MERGE(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress Sort Merge Join
SELECT /*+ NO_USE_MERGE(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Non-equijoin example where Sort Merge is used
SELECT e.last_name, s.grade
FROM   employees e, salary_grades s
WHERE  e.salary BETWEEN s.low_sal AND s.high_sal;`,
    summaryTitle: 'Sort Merge Join Key Takeaways',
    summaryItems: [
      'Sorts both datasets on the join key, then merges — no restart from the beginning during merge.',
      'Handles non-equijoin conditions (<, <=, >, >=, BETWEEN) where Hash Join cannot be used.',
      'No sort cost when data is already sorted — highly efficient in those cases.',
      'Hints: USE_MERGE(table) (force), NO_USE_MERGE(table) (suppress).',
    ],
  },
}

// ── Data (pre-sorted by dept_id) ─────────────────────────────────────────

const LEFT_ROWS = [
  { dept_id: 10, dept_name: 'Engineering' },
  { dept_id: 20, dept_name: 'Analytics'   },
  { dept_id: 30, dept_name: 'Support'     },
  { dept_id: 40, dept_name: 'Marketing'   },
]

const RIGHT_ROWS = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10 },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20 },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20 },
  { emp_id: 104, first_name: 'David',  dept_id: 30 },
  { emp_id: 106, first_name: 'Frank',  dept_id: 30 },
]

// Pre-compute steps: each step records (lPtr, rPtr, action, result?)
type StepAction = 'adv-left' | 'adv-right' | 'match'
interface MergeStep {
  lPtr: number
  rPtr: number
  action: StepAction
  leftKey: number
  rightKey: number
  matchLeft?: string
  matchRight?: string
}

function buildSteps(): MergeStep[] {
  const steps: MergeStep[] = []
  let l = 0, r = 0
  while (l < LEFT_ROWS.length && r < RIGHT_ROWS.length) {
    const lRow = LEFT_ROWS[l]
    const rRow = RIGHT_ROWS[r]
    if (lRow.dept_id === rRow.dept_id) {
      steps.push({ lPtr: l, rPtr: r, action: 'match', leftKey: lRow.dept_id, rightKey: rRow.dept_id, matchLeft: lRow.dept_name, matchRight: rRow.first_name })
      r++
      // if same left key still matches next right, continue — else advance left
      if (r < RIGHT_ROWS.length && RIGHT_ROWS[r].dept_id === lRow.dept_id) {
        // keep going (will match again next iteration)
      } else {
        l++
        // reset r back if there were multiple right matches for this left key
        // For simplicity: r stays where it is (single-pass merge)
      }
    } else if (lRow.dept_id < rRow.dept_id) {
      steps.push({ lPtr: l, rPtr: r, action: 'adv-left', leftKey: lRow.dept_id, rightKey: rRow.dept_id })
      l++
    } else {
      steps.push({ lPtr: l, rPtr: r, action: 'adv-right', leftKey: lRow.dept_id, rightKey: rRow.dept_id })
      r++
    }
  }
  return steps
}

const MERGE_STEPS = buildSteps()

// ── Sort Merge Simulator ──────────────────────────────────────────────────

function SortMergeSim({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [stepIdx, setStepIdx] = useState(0) // 0 = before start

  const done = stepIdx >= MERGE_STEPS.length
  const currentStep = stepIdx > 0 ? MERGE_STEPS[stepIdx - 1] : null
  const nextStep    = !done ? MERGE_STEPS[stepIdx] : null

  // current pointer positions
  const lPtr = nextStep?.lPtr ?? (done ? LEFT_ROWS.length : 0)
  const rPtr = nextStep?.rPtr ?? (done ? RIGHT_ROWS.length : 0)

  // accumulated results
  const results = MERGE_STEPS.slice(0, stepIdx)
    .filter((s) => s.action === 'match')
    .map((s) => ({ leftName: s.matchLeft!, rightName: s.matchRight!, key: s.leftKey }))

  // rows that have been passed (pointer has moved past)
  const lPassed = new Set(MERGE_STEPS.slice(0, stepIdx).filter(s => s.action !== 'match' || true).map(s => s.lPtr))
  const rPassed = new Set(MERGE_STEPS.slice(0, stepIdx).filter(s => s.action !== 'match' || true).map(s => s.rPtr))

  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function clearTimer() { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }

  function stepForward() { if (!done) setStepIdx((s) => s + 1) }
  function stepBackward() { if (stepIdx > 0) setStepIdx((s) => s - 1) }
  function reset() { clearTimer(); setPlaying(false); setStepIdx(0) }

  function togglePlay() {
    if (playing) { clearTimer(); setPlaying(false); return }
    if (done) { setStepIdx(0) }
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    if (done) { setPlaying(false); return }
    timerRef.current = setTimeout(() => setStepIdx((s) => s + 1), 800)
    return clearTimer
  }, [playing, done, stepIdx])

  const ACTION_LABEL: Record<StepAction, string> = {
    'adv-left':  t.labelAdvLeft,
    'adv-right': t.labelAdvRight,
    'match':     t.labelAdvBoth,
  }

  return (
    <div className="rounded-panel border border-line bg-paper-sunk p-5">
      <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2">{t.simTitle}</p>
      <p className="mb-4 text-[12px] leading-relaxed text-ink-2">{t.simDesc}</p>

      {/* Action label */}
      {currentStep && (
        <div className={cn(
          'mb-4 rounded-card border px-3 py-2 font-mono text-[11px] font-bold',
          currentStep.action === 'match'     ? 'border-green/50 bg-green/5 text-green'
          : currentStep.action === 'adv-left'  ? 'border-blue/50 bg-blue/5 text-blue'
          :                                     'border-amber/50 bg-amber/5 text-amber',
        )}>
          key1={currentStep.leftKey} {currentStep.action === 'match' ? '=' : currentStep.action === 'adv-left' ? '<' : '>'} key2={currentStep.rightKey}
          &nbsp;→&nbsp;{ACTION_LABEL[currentStep.action]}
        </div>
      )}
      {done && (
        <div className="mb-4 rounded-card border border-green/50 bg-green/5 px-3 py-2 font-mono text-[11px] font-bold text-green">
          ✓ {t.statusDone}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* LEFT */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-blue">{t.labelLeft}</p>
          <div className="flex flex-col gap-1.5">
            {LEFT_ROWS.map((row, i) => {
              const isActive  = !done && lPtr === i
              const isPassed  = lPassed.has(i) && lPtr > i
              const wasMatched = results.some((r) => r.key === row.dept_id)
              return (
                <motion.div
                  key={row.dept_id}
                  animate={
                    isActive   ? { backgroundColor: 'var(--color-blue)', scale: 1.02 }
                    : wasMatched ? { backgroundColor: 'var(--color-line)', scale: 1 }
                    : isPassed   ? { backgroundColor: 'var(--color-paper-sunk)', scale: 1 }
                    :              { backgroundColor: 'var(--color-paper)', scale: 1 }
                  }
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-xs',
                    isActive    ? 'border-blue/50 font-bold text-blue'
                    : wasMatched  ? 'border-green/30 text-green'
                    : isPassed    ? 'border-line text-ink-2'
                    :               'border-line text-ink-2',
                  )}
                >
                  {isActive && <span className="mr-1 text-blue font-bold">{t.labelPtr}</span>}
                  <span className="text-[10px] opacity-60 mr-1">dept_id=</span>
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 text-[10px] opacity-70">{row.dept_name}</span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Compare arrow */}
        <div className="hidden sm:flex items-center justify-center pt-6">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl text-ink-2/30">↔</span>
            <span className="font-mono text-[9px] text-ink-2">{t.labelCompare}</span>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-amber">{t.labelRight}</p>
          <div className="flex flex-col gap-1.5">
            {RIGHT_ROWS.map((row, i) => {
              const isActive   = !done && rPtr === i
              const isPassed   = rPassed.has(i) && rPtr > i
              const wasMatched = results.some((r) => r.rightName === row.first_name)
              return (
                <motion.div
                  key={row.emp_id}
                  animate={
                    isActive    ? { backgroundColor: 'var(--color-amber)', scale: 1.02 }
                    : wasMatched  ? { backgroundColor: 'var(--color-line)', scale: 1 }
                    : isPassed    ? { backgroundColor: 'var(--color-paper-sunk)', scale: 1 }
                    :               { backgroundColor: 'var(--color-paper)', scale: 1 }
                  }
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-xs',
                    isActive    ? 'border-amber/50 font-bold text-amber'
                    : wasMatched  ? 'border-green/30 text-green'
                    : isPassed    ? 'border-line text-ink-2'
                    :               'border-line text-ink-2',
                  )}
                >
                  {isActive && <span className="mr-1 text-amber font-bold">{t.labelPtr}</span>}
                  <span className="text-[10px] opacity-60 mr-1">dept_id=</span>
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 text-[10px]">{row.first_name}</span>
                </motion.div>
              )
            })}
          </div>
          <p className="mt-2 font-mono text-[9px] text-amber">{t.noteNoRestart}</p>
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center justify-center pt-6">
          <span className="text-xl text-ink-2/30">→</span>
        </div>

        {/* Result */}
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
                  className="rounded-card border border-green/30 bg-green/5 px-3 py-2 font-mono text-[10px] text-green"
                >
                  <span className="font-bold text-[10px] text-green mr-1">{r.key}</span>
                  <span className="opacity-70">{r.leftName.slice(0, 3)}</span>
                  <span className="mx-1 opacity-40">↔</span>
                  <span className="font-bold">{r.rightName}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {results.length === 0 && stepIdx === 0 && (
              <p className="font-mono text-[10px] text-ink-2/40 italic">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={togglePlay}
          className={cn(
            'rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-amber/50 bg-amber/5 text-amber hover:bg-amber/10'
              : 'border-purple/50 bg-purple/5 text-purple hover:bg-purple/10',
          )}
        >
          {playing ? t.btnPause : t.btnPlay}
        </button>
        <button onClick={stepBackward} disabled={playing || stepIdx === 0}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30">{t.btnPrev}</button>
        <button onClick={stepForward} disabled={playing || done}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30">{t.btnNext}</button>
        <button onClick={reset}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail">{t.btnReset}</button>
        <span className="ml-auto font-mono text-[10px] text-ink-2">
          {done ? t.statusDone : t.labelProgress(stepIdx)}
        </span>
      </div>
    </div>
  )
}

export function JoinSortMergeSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const ht = hintT[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-purple" />}
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

      <SectionTitle>{t.advantageTitle}</SectionTitle>
      <Prose>{t.advantageDesc}</Prose>

      <Divider />

      <SectionTitle>{t.simTitle}</SectionTitle>
      <SortMergeSim lang={lang} />

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
