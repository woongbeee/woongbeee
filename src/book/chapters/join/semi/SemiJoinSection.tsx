import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  Table,
} from '../../shared'
import { cn } from '@/lib/utils'

// ── Translations ──────────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'Semi Join & Anti Join',
    subtitle: 'EXISTS / IN 서브쿼리를 내부적으로 최적화하는 조인이에요. 매칭 행을 찾으면 Inner 스캔을 즉시 멈춰 불필요한 I/O를 줄여요.',

    whatTitle: 'Semi Join이란?',
    whatDesc:
      'Semi Join은 Outer 테이블의 각 행에 대해 Inner 테이블에 조건을 만족하는 행이 "존재하는지"만 확인해요. 일반 조인과 달리 매칭되는 모든 행을 반환하는 게 아니라, 첫 번째 매칭 행을 찾는 순간 Inner 스캔을 즉시 중단해요.\n\nOracle은 EXISTS / IN 서브쿼리를 실행 계획 단계에서 자동으로 Semi Join으로 변환(Query Transformation)해요. 개발자가 직접 "SEMI JOIN"이라고 쓰는 구문은 없어요.',

    antiTitle: 'Anti Join이란?',
    antiDesc:
      'Anti Join은 Semi Join의 반대예요. Inner 테이블에 조건을 만족하는 행이 "존재하지 않는" Outer 행만 반환해요. NOT EXISTS / NOT IN 서브쿼리가 Anti Join으로 변환돼요.\n\nNULL 처리에 주의해요 — NOT IN에서 Inner 컬럼에 NULL이 하나라도 있으면 결과가 빈 집합이 될 수 있어요. NOT EXISTS는 이 문제가 없어서 일반적으로 더 안전해요.',

    sqlTitle: 'EXISTS vs IN — 실행 계획에서의 차이',
    sqlDesc: '두 쿼리 모두 동일한 Semi Join 실행 계획으로 변환돼요.',
    sqlExists: `-- EXISTS → Semi Join으로 변환
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  EXISTS (
  SELECT 1
  FROM   orders o
  WHERE  o.emp_id = e.emp_id
);`,
    sqlIn: `-- IN → Semi Join으로 변환 (동일한 실행 계획)
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  e.emp_id IN (
  SELECT o.emp_id
  FROM   orders o
);`,
    sqlAntiExists: `-- NOT EXISTS → Anti Join으로 변환
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  NOT EXISTS (
  SELECT 1
  FROM   orders o
  WHERE  o.emp_id = e.emp_id
);`,
    sqlAntiIn: `-- NOT IN → Anti Join (NULL 주의!)
-- inner 컬럼에 NULL이 있으면 결과가 빈 집합이 될 수 있어요
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  e.emp_id NOT IN (
  SELECT o.emp_id
  FROM   orders o
  WHERE  o.emp_id IS NOT NULL  -- NULL 명시적 제외 필요
);`,

    compTitle: 'Semi Join vs 일반 INNER JOIN 비교',
    compDesc: '주문이 여러 건인 직원이 있을 때 차이가 드러나요.',
    compTableHeaders: ['구분', 'Inner Join', 'Semi Join (EXISTS)'],
    compTableRows: [
      ['여러 건 매칭 시', '매칭된 행 수만큼 반환 (중복 발생)', '첫 매칭 즉시 중단, 1행만 반환'],
      ['DISTINCT 필요?', 'DISTINCT 또는 GROUP BY 필요', '불필요 — 구조적으로 중복 없음'],
      ['I/O 효율', '모든 매칭 행 탐색', '첫 매칭 발견 즉시 Inner 스캔 중단'],
      ['반환 컬럼', 'Inner 컬럼 포함 가능', 'Outer 컬럼만 반환'],
    ],

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Semi Join 강제
SELECT /*+ SEMIJOIN(e) */ e.emp_id, e.first_name
FROM   employees e
WHERE  EXISTS (SELECT 1 FROM orders o WHERE o.emp_id = e.emp_id);

-- Semi Join 방지 (일반 조인으로 처리)
SELECT /*+ NO_SEMIJOIN(e) */ e.emp_id, e.first_name
FROM   employees e
WHERE  EXISTS (SELECT 1 FROM orders o WHERE o.emp_id = e.emp_id);

-- Anti Join 강제
SELECT /*+ ANTIJOIN(e) */ e.emp_id, e.first_name
FROM   employees e
WHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.emp_id = e.emp_id);`,

    simTitle: 'Semi Join 시뮬레이션',
    simDesc: 'DEPARTMENTS 테이블의 각 부서마다 EMPLOYEES에 "해당 부서 소속 직원이 존재하는지"를 확인해요. 첫 번째 매칭 직원을 찾는 순간 해당 부서의 Inner 스캔을 즉시 중단해요.',
    simAntiDesc: 'Anti Join 모드에서는 "소속 직원이 없는 부서"만 결과에 포함해요. Inner 전체를 스캔해서 매칭이 없음을 확인한 뒤에야 결과에 추가해요.',
    labelOuter: 'OUTER (DEPARTMENTS)',
    labelInner: 'INNER (EMPLOYEES)',
    labelResult: '결과',
    labelSemiMode: 'Semi Join (EXISTS)',
    labelAntiMode: 'Anti Join (NOT EXISTS)',
    labelScanStop: '⏹ 즉시 중단',
    labelScanAll: '전체 스캔',
    labelFound: '✓ 존재함 → 포함',
    labelNotFound: '✗ 없음 → 제외',
    labelAntiFound: '✗ 존재함 → 제외',
    labelAntiNotFound: '✓ 없음 → 포함',
    labelInnerProgress: (cur: number, total: number) => `스캔 ${cur} / ${total}`,
    labelEarlyStop: '첫 매칭 발견 → 스캔 중단',
    btnPlay: '▶ 자동 재생',
    btnPause: '⏸ 일시정지',
    btnPrev: '← 이전',
    btnNext: '다음 →',
    btnReset: '↺ 리셋',
    statusDone: '완료',

    nullTitle: 'NULL 처리 주의사항',
    nullDesc: 'NOT IN을 사용할 때 서브쿼리 결과에 NULL이 포함되면 전체 결과가 빈 집합이 될 수 있어요. SQL의 3값 논리(TRUE / FALSE / UNKNOWN)에서 x NOT IN (..., NULL)은 항상 UNKNOWN이 되기 때문이에요.\n\n안전하게 사용하려면 NOT EXISTS를 사용하거나, NOT IN 서브쿼리에 IS NOT NULL 조건을 추가하세요.',

    summaryTitle: '핵심 정리',
    summaryItems: [
      'Semi Join: EXISTS / IN 서브쿼리를 자동 변환. 첫 매칭 즉시 Inner 스캔 중단 — 불필요한 I/O 없음.',
      'Anti Join: NOT EXISTS / NOT IN 서브쿼리를 변환. 매칭 행이 없는 Outer 행만 반환.',
      'INNER JOIN + DISTINCT보다 Semi Join이 구조적으로 더 효율적이에요.',
      'NOT IN은 NULL 포함 시 결과가 비어 버릴 수 있어 NOT EXISTS를 권장해요.',
      '힌트: SEMIJOIN, NO_SEMIJOIN, ANTIJOIN.',
    ],
  },
  en: {
    title: 'Semi Join & Anti Join',
    subtitle: 'The join type Oracle uses internally to optimize EXISTS / IN subqueries — it stops scanning the inner table as soon as a match is found.',

    whatTitle: 'What Is a Semi Join?',
    whatDesc:
      'A Semi Join checks whether a matching row "exists" in the inner table for each outer row — it does not return all matching rows. As soon as the first match is found, Oracle stops scanning the inner table immediately.\n\nOracle automatically transforms EXISTS / IN subqueries into Semi Joins during query transformation. There is no explicit "SEMI JOIN" syntax you write yourself.',

    antiTitle: 'What Is an Anti Join?',
    antiDesc:
      'An Anti Join is the inverse of a Semi Join. It returns only the outer rows for which no matching row exists in the inner table. NOT EXISTS / NOT IN subqueries are transformed into Anti Joins.\n\nBe careful with NULL — if any row in the NOT IN subquery result contains NULL, the entire result may be empty. NOT EXISTS does not have this issue and is generally safer.',

    sqlTitle: 'EXISTS vs IN — Execution Plan Difference',
    sqlDesc: 'Both queries are transformed into the same Semi Join execution plan.',
    sqlExists: `-- EXISTS → transformed into Semi Join
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  EXISTS (
  SELECT 1
  FROM   orders o
  WHERE  o.emp_id = e.emp_id
);`,
    sqlIn: `-- IN → transformed into Semi Join (same plan)
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  e.emp_id IN (
  SELECT o.emp_id
  FROM   orders o
);`,
    sqlAntiExists: `-- NOT EXISTS → transformed into Anti Join
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  NOT EXISTS (
  SELECT 1
  FROM   orders o
  WHERE  o.emp_id = e.emp_id
);`,
    sqlAntiIn: `-- NOT IN → Anti Join (watch for NULLs!)
-- If the inner column contains NULL, the result may be empty
SELECT e.emp_id, e.first_name
FROM   employees e
WHERE  e.emp_id NOT IN (
  SELECT o.emp_id
  FROM   orders o
  WHERE  o.emp_id IS NOT NULL  -- explicit NULL exclusion needed
);`,

    compTitle: 'Semi Join vs Regular INNER JOIN',
    compDesc: 'The difference becomes clear when an employee has multiple matching orders.',
    compTableHeaders: ['', 'Inner Join', 'Semi Join (EXISTS)'],
    compTableRows: [
      ['Multiple matches', 'Returns one row per match (duplicates possible)', 'Stops at first match, returns 1 row per outer row'],
      ['DISTINCT needed?', 'Requires DISTINCT or GROUP BY', 'Not needed — structurally no duplicates'],
      ['I/O efficiency', 'Scans all matching rows', 'Stops inner scan at first match'],
      ['Returned columns', 'Can include inner columns', 'Outer columns only'],
    ],

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Semi Join
SELECT /*+ SEMIJOIN(e) */ e.emp_id, e.first_name
FROM   employees e
WHERE  EXISTS (SELECT 1 FROM orders o WHERE o.emp_id = e.emp_id);

-- Suppress Semi Join (process as regular join)
SELECT /*+ NO_SEMIJOIN(e) */ e.emp_id, e.first_name
FROM   employees e
WHERE  EXISTS (SELECT 1 FROM orders o WHERE o.emp_id = e.emp_id);

-- Force Anti Join
SELECT /*+ ANTIJOIN(e) */ e.emp_id, e.first_name
FROM   employees e
WHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.emp_id = e.emp_id);`,

    simTitle: 'Semi Join Simulation',
    simDesc: 'For each department in DEPARTMENTS, check whether "an employee in that department exists" in EMPLOYEES. As soon as the first matching employee is found, the inner scan for that department stops immediately.',
    simAntiDesc: 'In Anti Join mode, only departments with no employees are included in the result. The entire inner table must be scanned to confirm no match exists before adding a row to the result.',
    labelOuter: 'OUTER (DEPARTMENTS)',
    labelInner: 'INNER (EMPLOYEES)',
    labelResult: 'Result',
    labelSemiMode: 'Semi Join (EXISTS)',
    labelAntiMode: 'Anti Join (NOT EXISTS)',
    labelScanStop: '⏹ Stop immediately',
    labelScanAll: 'Full scan',
    labelFound: '✓ Found → include',
    labelNotFound: '✗ Not found → exclude',
    labelAntiFound: '✗ Found → exclude',
    labelAntiNotFound: '✓ Not found → include',
    labelInnerProgress: (cur: number, total: number) => `Scan ${cur} / ${total}`,
    labelEarlyStop: 'First match → stop scan',
    btnPlay: '▶ Auto Play',
    btnPause: '⏸ Pause',
    btnPrev: '← Prev',
    btnNext: 'Next →',
    btnReset: '↺ Reset',
    statusDone: 'Done',

    nullTitle: 'NULL Handling Caveat',
    nullDesc: "With NOT IN, if the subquery result contains any NULL, the entire result may be empty. This is because x NOT IN (..., NULL) always evaluates to UNKNOWN in SQL's three-valued logic (TRUE / FALSE / UNKNOWN).\n\nTo be safe, use NOT EXISTS, or add an IS NOT NULL condition to the NOT IN subquery.",

    summaryTitle: 'Key Takeaways',
    summaryItems: [
      'Semi Join: auto-transforms EXISTS / IN subqueries. Stops inner scan at first match — no unnecessary I/O.',
      'Anti Join: auto-transforms NOT EXISTS / NOT IN. Returns only outer rows with no match.',
      'Structurally more efficient than INNER JOIN + DISTINCT.',
      'NOT IN can return empty results when the subquery includes NULLs — prefer NOT EXISTS.',
      'Hints: SEMIJOIN, NO_SEMIJOIN, ANTIJOIN.',
    ],
  },
}

// ── Data ──────────────────────────────────────────────────────────────────

const OUTER_ROWS = [
  { dept_id: 10, dept_name: 'Engineering' },
  { dept_id: 20, dept_name: 'Analytics'   },
  { dept_id: 30, dept_name: 'Support'     },
  { dept_id: 40, dept_name: 'Marketing'   }, // no employees
]

const INNER_ROWS = [
  { emp_id: 103, first_name: 'Carol',  dept_id: 10 },
  { emp_id: 101, first_name: 'Alice',  dept_id: 10 },
  { emp_id: 107, first_name: 'Grace',  dept_id: 10 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20 },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20 },
  { emp_id: 104, first_name: 'David',  dept_id: 30 },
  { emp_id: 106, first_name: 'Frank',  dept_id: 30 },
]

// ── Step sequence builder ─────────────────────────────────────────────────

type ScanMode = 'semi' | 'anti'

interface SemiStep {
  outerIdx: number
  innerIdx: number     // -1 = outer 선택만 한 상태, 스캔 미시작
  stopped: boolean     // 이 스텝에서 스캔이 중단됐는지
  matched: boolean     // 이 inner 행이 매칭됐는지
}

function buildSteps(mode: ScanMode): SemiStep[] {
  const steps: SemiStep[] = []
  for (let o = 0; o < OUTER_ROWS.length; o++) {
    const outer = OUTER_ROWS[o]
    for (let i = 0; i < INNER_ROWS.length; i++) {
      const inner = INNER_ROWS[i]
      const matched = inner.dept_id === outer.dept_id
      steps.push({ outerIdx: o, innerIdx: i, stopped: false, matched })
      if (matched && mode === 'semi') {
        // 매칭 즉시 중단 표시 스텝
        steps.push({ outerIdx: o, innerIdx: i, stopped: true, matched: true })
        break
      }
    }
  }
  return steps
}

// ── Semi Join Simulator ───────────────────────────────────────────────────

function SemiJoinSim({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [mode, setMode] = useState<ScanMode>('semi')
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const steps = buildSteps(mode)
  const done = stepIdx >= steps.length
  const currentStep = stepIdx > 0 ? steps[stepIdx - 1] : null

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  function reset() {
    clearTimer(); setPlaying(false); setStepIdx(0)
  }

  function changeMode(m: ScanMode) {
    clearTimer(); setPlaying(false); setStepIdx(0); setMode(m)
  }

  function togglePlay() {
    if (playing) { clearTimer(); setPlaying(false); return }
    if (done) setStepIdx(0)
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    if (done) { setPlaying(false); return }
    // 중단 스텝은 잠깐 강조 후 빠르게 다음으로
    const isStopStep = !done && steps[stepIdx]?.stopped
    const delay = isStopStep ? 600 : 800
    timerRef.current = setTimeout(() => setStepIdx((s) => s + 1), delay)
    return clearTimer
  }, [playing, done, stepIdx, steps])

  // 현재 스텝에서 시각화할 상태 계산
  const curOuterIdx  = currentStep?.outerIdx ?? null
  const curInnerIdx  = currentStep?.innerIdx ?? null
  const isStopped    = currentStep?.stopped ?? false
  const isMatched    = currentStep?.matched ?? false

  // outer별 최종 결론: 이미 지나간 outer의 결과
  const outerResults = new Map<number, 'included' | 'excluded'>()
  for (let s = 0; s < stepIdx; s++) {
    const step = steps[s]
    if (!step.stopped && s + 1 < steps.length && steps[s + 1]?.outerIdx !== step.outerIdx) {
      // 이 outer의 마지막 스텝 — 매칭 여부로 결과 판단
    }
  }
  // 더 명확하게: outerIdx가 끝난 시점을 직접 파악
  for (let o = 0; o < OUTER_ROWS.length; o++) {
    const outerSteps = steps.filter((s) => s.outerIdx === o)
    const lastStepIdx = steps.findLastIndex((s) => s.outerIdx === o)
    if (lastStepIdx < stepIdx) {
      // 이 outer의 모든 스텝이 지나감
      const hadMatch = outerSteps.some((s) => s.matched)
      if (mode === 'semi') {
        outerResults.set(o, hadMatch ? 'included' : 'excluded')
      } else {
        outerResults.set(o, hadMatch ? 'excluded' : 'included')
      }
    }
  }

  const resultRows = Array.from(outerResults.entries())
    .filter(([, v]) => v === 'included')
    .map(([o]) => OUTER_ROWS[o])

  // inner 행별 상태
  function getInnerState(i: number): 'current' | 'matched-stop' | 'scanned' | 'idle' {
    if (curOuterIdx === null) return 'idle'
    if (curInnerIdx === i) {
      if (isStopped) return 'matched-stop'
      return 'current'
    }
    // 현재 outer에서 이미 지나간 행
    const passedInCurOuter = steps
      .slice(0, stepIdx)
      .filter((s) => s.outerIdx === curOuterIdx && s.innerIdx === i && !s.stopped)
    if (passedInCurOuter.length > 0) return 'scanned'
    return 'idle'
  }

  const PLAY_BTN_COLOR = mode === 'semi'
    ? (playing ? 'border-amber/50 bg-amber/5 text-amber hover:bg-amber/10' : 'border-green/50 bg-green/5 text-green hover:bg-green/10')
    : (playing ? 'border-amber/50 bg-amber/5 text-amber hover:bg-amber/10' : 'border-red/50 bg-red/5 text-red hover:bg-red/10')

  return (
    <div className="rounded-panel border border-line bg-paper-sunk p-5">
      <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2">
        {t.simTitle}
      </p>

      {/* Mode tabs + play button */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([['semi', t.labelSemiMode, 'border-green/50 bg-green/10 text-green'],
           ['anti', t.labelAntiMode, 'border-red/50 bg-red/10 text-red']] as const).map(([key, label, activeClass]) => (
          <button
            key={key}
            onClick={() => changeMode(key)}
            disabled={playing}
            className={cn(
              'rounded-full border px-4 py-1.5 font-mono text-xs font-bold transition-all disabled:opacity-50',
              mode === key ? activeClass : 'border-line text-ink-2 hover:bg-rail',
            )}
          >
            {label}
          </button>
        ))}
        <button
          onClick={togglePlay}
          className={cn('ml-auto rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all', PLAY_BTN_COLOR)}
        >
          {playing ? t.btnPause : t.btnPlay}
        </button>
      </div>

      <p className="mb-4 text-[12px] leading-relaxed text-ink-2">
        {mode === 'semi' ? t.simDesc : t.simAntiDesc}
      </p>

      {/* Current step status banner */}
      {currentStep && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentStep.outerIdx}-${currentStep.innerIdx}-${isStopped}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'mb-4 rounded-card border px-3 py-2 font-mono text-[11px] font-bold',
              isStopped
                ? 'border-amber/50 bg-amber/5 text-amber'
                : isMatched
                  ? mode === 'semi'
                    ? 'border-green/50 bg-green/5 text-green'
                    : 'border-red/50 bg-red/5 text-red'
                  : 'border-line bg-paper text-ink-2',
            )}
          >
            {isStopped
              ? `${t.labelEarlyStop} — dept_id=${OUTER_ROWS[currentStep.outerIdx].dept_id}`
              : isMatched
                ? mode === 'semi' ? t.labelFound : t.labelAntiFound
                : mode === 'semi' ? '→ 스캔 계속...' : '→ 계속 스캔...'}
          </motion.div>
        </AnimatePresence>
      )}
      {done && (
        <div className="mb-4 rounded-card border border-green/50 bg-green/5 px-3 py-2 font-mono text-[11px] font-bold text-green">
          ✓ {t.statusDone}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* OUTER */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-blue">{t.labelOuter}</p>
          <div className="flex flex-col gap-1.5">
            {OUTER_ROWS.map((row, i) => {
              const isActive = curOuterIdx === i
              const result   = outerResults.get(i)
              return (
                <motion.div
                  key={row.dept_id}
                  animate={
                    isActive          ? { backgroundColor: 'var(--color-blue)', scale: 1.02 }
                    : result === 'included' ? { backgroundColor: 'var(--color-line)', scale: 1 }
                    : result === 'excluded' ? { backgroundColor: 'var(--color-rail)', scale: 1 }
                    :                         { backgroundColor: 'var(--color-paper)', scale: 1 }
                  }
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-xs',
                    isActive            ? 'border-blue/50 font-bold text-blue'
                    : result === 'included' ? 'border-green/50 text-green'
                    : result === 'excluded' ? 'border-line text-ink-2'
                    :                         'border-line text-ink-2',
                  )}
                >
                  {isActive && <span className="mr-1 text-blue font-bold">▶</span>}
                  <span className="text-[10px] opacity-60 mr-1">dept_id=</span>
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 text-[10px] opacity-70">{row.dept_name}</span>
                  {result === 'included' && <span className="ml-auto text-[9px] text-green font-bold"> ✓</span>}
                  {result === 'excluded' && <span className="ml-auto text-[9px] text-ink-2"> ✗</span>}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center justify-center pt-6">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl text-ink-2/30">→</span>
            <span className="font-mono text-[9px] text-ink-2">EXISTS?</span>
          </div>
        </div>

        {/* INNER */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold text-amber">{t.labelInner}</p>
          <div className="flex flex-col gap-1.5">
            {INNER_ROWS.map((row, i) => {
              const state = getInnerState(i)
              return (
                <motion.div
                  key={row.emp_id}
                  animate={
                    state === 'matched-stop' ? { backgroundColor: 'var(--color-amber)', scale: 1.03 }
                    : state === 'current'      ? { backgroundColor: 'var(--color-amber)', scale: 1.02 }
                    : state === 'scanned'      ? { backgroundColor: 'var(--color-paper-sunk)', scale: 1 }
                    :                            { backgroundColor: 'var(--color-paper)', scale: 1 }
                  }
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-xs',
                    state === 'matched-stop' ? 'border-amber/50 font-bold text-amber'
                    : state === 'current'      ? 'border-amber/50 font-bold text-amber'
                    : state === 'scanned'      ? 'border-line text-ink-2'
                    :                            'border-line text-ink-2',
                  )}
                >
                  <span className="text-[10px] opacity-60 mr-1">dept_id=</span>
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 text-[10px]">{row.first_name}</span>
                  {state === 'matched-stop' && (
                    <span className="ml-2 rounded bg-amber/15 px-1 text-[9px] font-bold text-amber">
                      {t.labelScanStop}
                    </span>
                  )}
                  {state === 'current' && curOuterIdx !== null && row.dept_id === OUTER_ROWS[curOuterIdx].dept_id && !isStopped && (
                    <span className="ml-2 text-[9px] font-bold text-green">✓</span>
                  )}
                </motion.div>
              )
            })}
          </div>
          {curOuterIdx !== null && currentStep && !isStopped && (
            <p className="mt-1.5 font-mono text-[9px] text-ink-2">
              {t.labelInnerProgress(
                steps.filter((s) => s.outerIdx === curOuterIdx && !s.stopped && steps.indexOf(s) < stepIdx).length,
                INNER_ROWS.length,
              )}
            </p>
          )}
          {isStopped && (
            <p className="mt-1.5 font-mono text-[9px] font-bold text-amber">{t.labelEarlyStop}</p>
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
              {resultRows.map((row) => (
                <motion.div
                  key={row.dept_id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-[10px]',
                    mode === 'semi'
                      ? 'border-green/30 bg-green/5 text-green'
                      : 'border-red/30 bg-red/5 text-red',
                  )}
                >
                  <span className="font-bold">{row.dept_id}</span>
                  <span className="ml-1 opacity-70">{row.dept_name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {resultRows.length === 0 && stepIdx === 0 && (
              <p className="font-mono text-[10px] text-ink-2/40 italic">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => { if (!playing && stepIdx > 0) setStepIdx((s) => s - 1) }}
          disabled={playing || stepIdx === 0}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30"
        >{t.btnPrev}</button>
        <button
          onClick={() => { if (!playing && !done) setStepIdx((s) => s + 1) }}
          disabled={playing || done}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30"
        >{t.btnNext}</button>
        <button onClick={reset}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail"
        >{t.btnReset}</button>
        <span className="ml-auto font-mono text-[10px] text-ink-2">
          {done ? t.statusDone : stepIdx > 0 ? `${stepIdx} / ${steps.length}` : ''}
        </span>
      </div>
    </div>
  )
}

// ── Section export ────────────────────────────────────────────────────────

export function JoinSemiSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.antiTitle}</SectionTitle>
      <Prose>{t.antiDesc}</Prose>

      <Divider />

      <SectionTitle>{t.simTitle}</SectionTitle>
      <SemiJoinSim lang={lang} />

      <Divider />

      <SectionTitle>{t.sqlTitle}</SectionTitle>
      <p className="mb-3 text-sm text-ink-2">{t.sqlDesc}</p>

      <SubTitle>Semi Join — EXISTS / IN</SubTitle>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <SqlBlock sql={t.sqlExists} badge="EXISTS" badgeColor="emerald" />
        <SqlBlock sql={t.sqlIn} badge="IN" badgeColor="blue" />
      </div>

      <SubTitle>Anti Join — NOT EXISTS / NOT IN</SubTitle>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <SqlBlock sql={t.sqlAntiExists} badge="NOT EXISTS" badgeColor="rose" />
        <SqlBlock sql={t.sqlAntiIn} badge="NOT IN" badgeColor="orange" />
      </div>

      <Divider />

      <SectionTitle>{t.compTitle}</SectionTitle>
      <p className="mb-3 text-sm text-ink-2">{t.compDesc}</p>
      <Table headers={t.compTableHeaders} rows={t.compTableRows} />

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <Divider />

      <SectionTitle>{t.nullTitle}</SectionTitle>
      <Prose>{t.nullDesc}</Prose>
      <InfoBox variant="warning">
        {lang === 'ko'
          ? 'NOT IN 서브쿼리에서 Inner 컬럼이 nullable이라면, 반드시 WHERE col IS NOT NULL 조건을 추가하거나 NOT EXISTS로 교체하세요.'
          : 'If the inner column in a NOT IN subquery is nullable, always add WHERE col IS NOT NULL, or replace it with NOT EXISTS.'}
      </InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {t.summaryItems.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
