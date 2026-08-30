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
  StepList,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'Hash Join',
    subtitle: '작은 테이블(빌드 입력)을 해시 테이블로 PGA에 적재한 뒤, 큰 테이블(프로브 입력)을 스캔하면서 해시 키로 매칭하는 조인이에요.',

    whatTitle: 'Hash Join이란?',
    whatDesc:
      'Hash Join은 해시 함수를 조인 키에 적용해서 두 데이터 집합을 결합해요. Build Phase와 Probe Phase 두 단계로 동작해요.\n\n빌드 단계에서 Oracle은 더 작은 데이터 집합(빌드 입력)을 스캔하고, 조인 키에 해시 함수를 적용한 후 PGA에 해시 테이블을 구축해요. 프로브 단계에서는 더 큰 데이터 집합(프로브 입력)을 스캔하면서 동일한 해시 함수를 적용해 해시 테이블을 탐색하고 일치하는 행을 반환해요.\n\nHash Join은 반드시 등치(=) 조인 조건이 있어야 해요.',

    buildTitle: 'Build Phase — 해시 테이블 구축',
    buildSteps: [
      { title: '빌드 입력 전체 스캔', desc: '더 작은 테이블(빌드 입력)을 전체 스캔해요.' },
      { title: '해시 함수 적용', desc: '각 행의 조인 키에 해시 함수를 적용해요.' },
      { title: 'PGA 해시 테이블 저장', desc: '결과를 PGA의 해시 테이블에 저장해요. 해시 충돌은 연결 리스트로 처리해요.' },
      { title: '해시 테이블 완성', desc: '빌드 입력 전체를 읽고 나면 해시 테이블이 완성돼요.' },
    ],

    probeTitle: 'Probe Phase — 해시 테이블 탐색',
    probeSteps: [
      { title: '프로브 입력 전체 스캔', desc: '더 큰 테이블(프로브 입력)을 전체 스캔해요.' },
      { title: '동일한 해시 함수 적용', desc: '각 행의 조인 키에 동일한 해시 함수를 적용해요.' },
      { title: '버킷 탐색', desc: '해시 테이블의 해당 버킷을 탐색해서 일치하는 행을 찾아요.' },
      { title: '결과 집합에 추가', desc: '일치하는 행을 결과 집합에 추가해요.' },
    ],

    memoryTitle: 'PGA 메모리가 부족할 때',
    memoryDesc:
      '해시 테이블이 PGA에 들어가지 않으면 Oracle은 임시 테이블스페이스(temporary tablespace)를 사용해요.\n\n① 빌드 입력을 파티션으로 나눠 디스크에 기록해요.\n② 프로브 입력을 스캔할 때, 메모리에 있는 파티션과 매칭되는 행은 즉시 조인하고, 디스크에 있는 파티션과 매칭되는 행은 임시 공간에 기록해요.\n③ 디스크에 있는 각 파티션 쌍을 읽어서 조인해요.\n\n이 경우에도 각 데이터 집합은 최대 두 번(메모리 + 디스크 재읽기)만 읽어요.',

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Hash Join 강제
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Hash Join 방지
SELECT /*+ NO_USE_HASH(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    simTitle: 'Hash Join 시뮬레이션',
    simBuildDesc: 'DEPARTMENTS 테이블(빌드 입력)의 각 행을 읽어 dept_id에 해시 함수를 적용한 뒤 PGA 해시 테이블의 해당 버킷에 넣어요. 모든 행을 다 넣으면 Build Phase가 완료돼요.',
    simProbeDesc: 'EMPLOYEES 테이블(프로브 입력)의 행을 하나씩 읽어 dept_id에 동일한 해시 함수를 적용해요. 해당 버킷으로 바로 점프해서 일치하는 행을 찾아요 — Inner 전체를 다시 스캔하지 않아요.',
    labelBuildInput: '빌드 입력 (DEPARTMENTS)',
    labelHashTable: '해시 테이블 (PGA)',
    labelProbeInput: '프로브 입력 (EMPLOYEES)',
    labelResult: '결과',
    labelBucket: (n: number) => `버킷 ${n}`,
    labelPhase1: '1. Build Phase',
    labelPhase2: '2. Probe Phase',
    labelCurrentRow: '현재 행',
    labelHashArrow: 'h(dept_id)',
    labelBucketJump: '→ 버킷 직접 점프',
    btnNext: '다음 →',
    btnPrev: '← 이전',
    btnReset: '↺ 리셋',
    btnPlay: '▶ 자동 재생',
    btnPause: '⏸ 일시정지',
    statusMatch: '✓ 매칭',
    statusNoMatch: '✗ 없음',
    labelBuildProgress: (n: number, total: number) => `Build ${n} / ${total}`,
    labelProbeProgress: (n: number, total: number) => `Probe ${n} / ${total}`,
    labelBuildDone: 'Build 완료 — Probe Phase로 이동하세요',
    labelProbeDone: '완료',
  },
  en: {
    title: 'Hash Join',
    subtitle: 'Loads the smaller table (build input) into a hash table in PGA, then scans the larger table (probe input) matching by hash key.',

    whatTitle: 'What Is a Hash Join?',
    whatDesc:
      'A Hash Join applies a hash function to the join key to combine two datasets. It operates in two phases: Build Phase and Probe Phase.\n\nIn the build phase, Oracle scans the smaller dataset (build input), applies a hash function to the join key, and constructs a hash table in PGA. In the probe phase, Oracle scans the larger dataset (probe input), applies the same hash function, probes the hash table, and returns matching rows.\n\nHash Joins require an equality (=) join condition.',

    buildTitle: 'Build Phase — Constructing the Hash Table',
    buildSteps: [
      { title: 'Full scan of the build input', desc: 'Scan the smaller table (build input) in full.' },
      { title: 'Apply hash function', desc: "Apply a hash function to each row's join key." },
      { title: 'Store in PGA hash table', desc: 'Store the result in an in-memory hash table in PGA. Collisions are handled with linked lists at each hash bucket.' },
      { title: 'Hash table complete', desc: 'The hash table is complete once the entire build input has been read.' },
    ],

    probeTitle: 'Probe Phase — Probing the Hash Table',
    probeSteps: [
      { title: 'Full scan of the probe input', desc: 'Scan the larger table (probe input) in full.' },
      { title: 'Apply the same hash function', desc: "Apply the same hash function to each row's join key." },
      { title: 'Probe the bucket', desc: 'Probe the corresponding bucket in the hash table for a match.' },
      { title: 'Add to result set', desc: 'Add matching rows to the result set.' },
    ],

    memoryTitle: 'When PGA Memory Is Insufficient',
    memoryDesc:
      'If the hash table does not fit in PGA, Oracle spills to the temporary tablespace.\n\n① The build input is split into partitions and written to disk.\n② While scanning the probe input, rows matching in-memory partitions are joined immediately; rows matching on-disk partitions are written to temporary space.\n③ Each on-disk partition pair is read and joined.\n\nEven with spilling, each dataset is read at most twice — once for the initial scan and once from disk.',

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Hash Join
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress Hash Join
SELECT /*+ NO_USE_HASH(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    simTitle: 'Hash Join Simulation',
    simBuildDesc: 'Read each row from DEPARTMENTS (build input), apply a hash function to dept_id, and insert it into the corresponding PGA bucket. Once all rows are inserted, the Build Phase is complete.',
    simProbeDesc: 'Read each row from EMPLOYEES (probe input) and apply the same hash function to dept_id. Jump directly to that bucket — no need to scan the entire inner table from scratch.',
    labelBuildInput: 'Build Input (DEPARTMENTS)',
    labelHashTable: 'Hash Table (PGA)',
    labelProbeInput: 'Probe Input (EMPLOYEES)',
    labelResult: 'Result',
    labelBucket: (n: number) => `Bucket ${n}`,
    labelPhase1: '1. Build Phase',
    labelPhase2: '2. Probe Phase',
    labelCurrentRow: 'Current row',
    labelHashArrow: 'h(dept_id)',
    labelBucketJump: '→ Jump to bucket',
    btnNext: 'Next →',
    btnPrev: '← Prev',
    btnReset: '↺ Reset',
    btnPlay: '▶ Auto Play',
    btnPause: '⏸ Pause',
    statusMatch: '✓ Match',
    statusNoMatch: '✗ No match',
    labelBuildProgress: (n: number, total: number) => `Build ${n} / ${total}`,
    labelProbeProgress: (n: number, total: number) => `Probe ${n} / ${total}`,
    labelBuildDone: 'Build complete — proceed to Probe Phase',
    labelProbeDone: 'Done',
  },
}

// ── Data ──────────────────────────────────────────────────────────────────

const BUILD_ROWS = [
  { dept_id: 10, dept_name: 'Engineering' },
  { dept_id: 20, dept_name: 'Analytics'   },
  { dept_id: 30, dept_name: 'Support'     },
  { dept_id: 40, dept_name: 'Marketing'   },
]

const PROBE_ROWS = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20 },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10 },
  { emp_id: 104, first_name: 'David',  dept_id: 30 },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20 },
  { emp_id: 109, first_name: 'Iris',   dept_id: 99 }, // no match
]

// 해시 함수: dept_id % 3 → 버킷 번호 0/1/2
function hashFn(deptId: number) { return deptId % 3 }
const BUCKET_COUNT = 3

// ── Hash Join Simulator ────────────────────────────────────────────────────

function HashJoinSim({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]

  type Phase = 'build' | 'probe'
  const [phase, setPhase] = useState<Phase>('build')
  const [buildStep, setBuildStep] = useState(0)   // 0 = 미시작
  const [probeStep, setProbeStep] = useState(0)   // 0 = 미시작
  const [probeResults, setProbeResults] = useState<{ empName: string; deptName: string }[]>([])

  // 현재까지 Build된 버킷 맵
  const builtRows = BUILD_ROWS.slice(0, buildStep)
  const buckets: Record<number, typeof BUILD_ROWS> = {}
  for (let b = 0; b < BUCKET_COUNT; b++) buckets[b] = []
  builtRows.forEach((r) => buckets[hashFn(r.dept_id)].push(r))

  const buildDone = buildStep >= BUILD_ROWS.length

  // Probe 현재 행
  const currentProbeRow = probeStep > 0 && probeStep <= PROBE_ROWS.length ? PROBE_ROWS[probeStep - 1] : null
  const currentBucket   = currentProbeRow !== null ? hashFn(currentProbeRow.dept_id) : null
  const matchedBuildRow = currentProbeRow !== null ? BUILD_ROWS.find((r) => r.dept_id === currentProbeRow.dept_id) : null
  const probeDone = probeStep >= PROBE_ROWS.length

  function stepBuildForward() {
    if (buildStep >= BUILD_ROWS.length) return
    setBuildStep((s) => s + 1)
  }
  function stepBuildBackward() {
    if (buildStep === 0) return
    setBuildStep((s) => s - 1)
  }
  function stepProbeForward() {
    if (probeStep >= PROBE_ROWS.length) return
    const next = probeStep + 1
    const row = PROBE_ROWS[next - 1]
    const match = BUILD_ROWS.find((r) => r.dept_id === row.dept_id)
    if (match) setProbeResults((rs) => [...rs, { empName: row.first_name, deptName: match.dept_name }])
    setProbeStep(next)
  }
  function stepProbeBackward() {
    if (probeStep === 0) return
    const row = PROBE_ROWS[probeStep - 1]
    const match = BUILD_ROWS.find((r) => r.dept_id === row.dept_id)
    if (match) setProbeResults((rs) => rs.slice(0, -1))
    setProbeStep((s) => s - 1)
  }
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function clearTimer() { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }

  function reset() {
    clearTimer(); setPlaying(false)
    setPhase('build'); setBuildStep(0); setProbeStep(0); setProbeResults([])
  }

  function togglePlay() {
    if (playing) { clearTimer(); setPlaying(false); return }
    const allDone = buildDone && probeDone
    if (allDone) reset()
    setPlaying(true)
  }

  // 자동재생 ticker: build 완료 전은 buildStep 증가, 이후 probe phase로 전환 후 probeStep 증가
  useEffect(() => {
    if (!playing) return
    if (!buildDone) {
      timerRef.current = setTimeout(() => setBuildStep((s) => s + 1), 800)
      return clearTimer
    }
    // Build 완료 직후 잠시 멈추고 Probe Phase로 전환
    if (phase === 'build') {
      timerRef.current = setTimeout(() => setPhase('probe'), 1000)
      return clearTimer
    }
    if (probeDone) { setPlaying(false); return }
    timerRef.current = setTimeout(() => {
      const next = probeStep + 1
      const row = PROBE_ROWS[next - 1]
      const match = BUILD_ROWS.find((r) => r.dept_id === row.dept_id)
      if (match) setProbeResults((rs) => [...rs, { empName: row.first_name, deptName: match.dept_name }])
      setProbeStep(next)
    }, 800)
    return clearTimer
  }, [playing, buildDone, phase, probeDone, probeStep])

  return (
    <div className="rounded-panel border border-line bg-paper-sunk p-5">
      <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2">{t.simTitle}</p>

      {/* Phase tabs + play button */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([['build', t.labelPhase1, 'border-blue/50 bg-blue/10 text-blue'], ['probe', t.labelPhase2, 'border-amber/50 bg-amber/10 text-amber']] as const).map(([key, label, activeClass]) => (
          <button
            key={key}
            onClick={() => { if (!playing) { setPhase(key); if (key === 'probe' && !buildDone) setBuildStep(BUILD_ROWS.length) } }}
            disabled={playing}
            className={cn(
              'rounded-full border px-4 py-1.5 font-mono text-xs font-bold transition-all disabled:opacity-50',
              phase === key ? activeClass : 'border-line text-ink-2 hover:bg-rail',
            )}
          >
            {label}
            {key === 'build' && buildDone && <span className="ml-1.5 text-[9px] text-green">✓</span>}
          </button>
        ))}
        <button
          onClick={togglePlay}
          className={cn(
            'ml-auto rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-amber/50 bg-amber/5 text-amber hover:bg-amber/10'
              : 'border-blue/50 bg-blue/5 text-blue hover:bg-blue/10',
          )}
        >
          {playing ? t.btnPause : t.btnPlay}
        </button>
      </div>

      {/* ── BUILD PHASE ── */}
      {phase === 'build' && (
        <div>
          <p className="mb-4 text-[12px] leading-relaxed text-ink-2">{t.simBuildDesc}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
            {/* Build input */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold text-blue">{t.labelBuildInput}</p>
              <div className="flex flex-col gap-1.5">
                {BUILD_ROWS.map((row, i) => {
                  const isActive  = buildStep === i + 1
                  const isBuilt   = buildStep > i + 1
                  const isCurrent = buildStep === i
                  return (
                    <motion.div
                      key={row.dept_id}
                      animate={
                        isActive  ? { backgroundColor: 'var(--color-blue)', scale: 1.02 }
                        : isBuilt ? { backgroundColor: 'var(--color-rail)', scale: 1 }
                        :           { backgroundColor: 'var(--color-paper)', scale: 1 }
                      }
                      transition={{ duration: 0.18 }}
                      className={cn(
                        'rounded-card border px-3 py-2 font-mono text-xs',
                        isActive  ? 'border-blue/50 font-bold text-blue'
                        : isBuilt ? 'border-green/30 text-green'
                        : isCurrent ? 'border-line text-ink-2'
                        : 'border-line text-ink-2',
                      )}
                    >
                      <span className="text-[10px] opacity-60 mr-1">dept_id=</span>
                      <span className="font-bold">{row.dept_id}</span>
                      <span className="ml-1 text-[10px] opacity-70">{row.dept_name}</span>
                      {isActive && (
                        <span className="ml-2 text-[9px] text-blue">
                          h({row.dept_id})=<b>{hashFn(row.dept_id)}</b>
                        </span>
                      )}
                      {isBuilt && <span className="ml-2 text-[9px] text-green">→ bucket {hashFn(row.dept_id)}</span>}
                    </motion.div>
                  )
                })}
              </div>
              <p className="mt-2 font-mono text-[9px] text-ink-2">
                {buildDone ? t.labelBuildDone : t.labelBuildProgress(buildStep, BUILD_ROWS.length)}
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center pt-6">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl text-ink-2/30">→</span>
                <span className="font-mono text-[9px] text-ink-2">{t.labelHashArrow}</span>
              </div>
            </div>

            {/* Hash table (PGA) */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold text-purple">{t.labelHashTable}</p>
              <div className="flex flex-col gap-2">
                {Array.from({ length: BUCKET_COUNT }, (_, b) => {
                  const isHighlighted = buildStep > 0 && buildStep <= BUILD_ROWS.length && hashFn(BUILD_ROWS[buildStep - 1].dept_id) === b
                  return (
                    <div
                      key={b}
                      className={cn(
                        'rounded-card border px-3 py-2 transition-all',
                        isHighlighted ? 'border-purple/50 bg-purple/5' : 'border-line bg-paper',
                      )}
                    >
                      <p className="font-mono text-[9px] font-bold text-purple mb-1">{t.labelBucket(b)}</p>
                      <div className="flex flex-wrap gap-1">
                        {buckets[b].length === 0
                          ? <span className="font-mono text-[9px] text-ink-2/40">—</span>
                          : buckets[b].map((r) => (
                            <motion.span
                              key={r.dept_id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded bg-purple/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-purple"
                            >
                              {r.dept_id}·{r.dept_name.slice(0, 3)}
                            </motion.span>
                          ))
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={stepBuildBackward} disabled={playing || buildStep === 0}
              className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30">{t.btnPrev}</button>
            <button onClick={stepBuildForward} disabled={playing || buildDone}
              className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30">{t.btnNext}</button>
            <button onClick={reset}
              className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail">{t.btnReset}</button>
          </div>
        </div>
      )}

      {/* ── PROBE PHASE ── */}
      {phase === 'probe' && (
        <div>
          <p className="mb-4 text-[12px] leading-relaxed text-ink-2">{t.simProbeDesc}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {/* Probe input */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold text-amber">{t.labelProbeInput}</p>
              <div className="flex flex-col gap-1.5">
                {PROBE_ROWS.map((row, i) => {
                  const isCurrent = probeStep === i + 1
                  const isPassed  = probeStep > i + 1
                  const hasMatch  = BUILD_ROWS.some((r) => r.dept_id === row.dept_id)
                  return (
                    <motion.div
                      key={row.emp_id}
                      animate={
                        isCurrent ? { backgroundColor: 'var(--color-amber)', scale: 1.02 }
                        : isPassed && hasMatch  ? { backgroundColor: 'var(--color-line)', scale: 1 }
                        : isPassed && !hasMatch ? { backgroundColor: 'var(--color-rail)', scale: 1 }
                        :                         { backgroundColor: 'var(--color-paper)', scale: 1 }
                      }
                      transition={{ duration: 0.18 }}
                      className={cn(
                        'rounded-card border px-3 py-2 font-mono text-xs',
                        isCurrent ? 'border-amber/50 font-bold text-amber'
                        : isPassed && hasMatch ? 'border-green/30 text-green'
                        : isPassed ? 'border-red/30 text-red'
                        : 'border-line text-ink-2',
                      )}
                    >
                      <span className="font-bold">{row.first_name}</span>
                      <span className="ml-1 text-[10px] opacity-60">dept_id=</span>
                      <span className="font-bold text-[10px]">{row.dept_id}</span>
                      {isCurrent && (
                        <span className="ml-2 text-[9px] text-amber">
                          h({row.dept_id})=<b>{hashFn(row.dept_id)}</b> {t.labelBucketJump}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              <p className="mt-2 font-mono text-[9px] text-ink-2">
                {probeDone ? t.labelProbeDone : t.labelProbeProgress(probeStep, PROBE_ROWS.length)}
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center pt-6">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl text-ink-2/30">↔</span>
                <span className="font-mono text-[9px] text-ink-2">{t.labelHashArrow}</span>
              </div>
            </div>

            {/* Hash table with highlighted bucket */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold text-purple">{t.labelHashTable}</p>
              <div className="flex flex-col gap-2">
                {Array.from({ length: BUCKET_COUNT }, (_, b) => {
                  const isTargeted = currentBucket === b
                  return (
                    <motion.div
                      key={b}
                      animate={isTargeted ? { scale: 1.03 } : { scale: 1 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        'rounded-card border px-3 py-2 transition-all',
                        isTargeted ? 'border-amber/50 bg-amber/5 ' : 'border-line bg-paper',
                      )}
                    >
                      <p className={cn('font-mono text-[9px] font-bold mb-1', isTargeted ? 'text-amber' : 'text-purple')}>
                        {t.labelBucket(b)} {isTargeted && '← 탐색 중'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {buckets[b].length === 0
                          ? <span className="font-mono text-[9px] text-ink-2/40">—</span>
                          : buckets[b].map((r) => {
                            const isHit = isTargeted && matchedBuildRow?.dept_id === r.dept_id
                            return (
                              <span
                                key={r.dept_id}
                                className={cn(
                                  'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold',
                                  isHit ? 'bg-green/15 text-green ring-1 ring-green/50' : 'bg-purple/10 text-purple',
                                )}
                              >
                                {r.dept_id}·{r.dept_name.slice(0, 3)}
                              </span>
                            )
                          })
                        }
                      </div>
                    </motion.div>
                  )
                })}
              </div>
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
                  {probeResults.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-card border border-green/30 bg-green/5 px-3 py-2 font-mono text-[10px] text-green"
                    >
                      <span className="font-bold">{r.empName}</span>
                      <span className="mx-1 opacity-40">↔</span>
                      <span className="opacity-70">{r.deptName}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {currentProbeRow && (
                  <div className={cn(
                    'rounded-card border px-3 py-2 font-mono text-[11px] font-bold',
                    matchedBuildRow ? 'border-green/50 bg-green/5 text-green' : 'border-red/30 bg-red/5 text-red',
                  )}>
                    {matchedBuildRow ? t.statusMatch : t.statusNoMatch}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={stepProbeBackward} disabled={playing || probeStep === 0}
              className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30">{t.btnPrev}</button>
            <button onClick={stepProbeForward} disabled={playing || probeDone}
              className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail disabled:opacity-30">{t.btnNext}</button>
            <button onClick={reset}
              className="rounded-card border border-line px-3 py-1.5 font-mono text-xs text-ink-2 hover:bg-rail">{t.btnReset}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function JoinHashSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-amber" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.simTitle}</SectionTitle>
      <HashJoinSim lang={lang} />

      <Divider />

      <SectionTitle>{t.buildTitle}</SectionTitle>
      <StepList steps={t.buildSteps} />

      <Divider />

      <SectionTitle>{t.probeTitle}</SectionTitle>
      <StepList steps={t.probeSteps} />

      <Divider />

      <SectionTitle>{t.memoryTitle}</SectionTitle>
      <Prose>{t.memoryDesc}</Prose>
      <InfoBox variant="tip">
        {isKo
          ? 'PGA_AGGREGATE_TARGET을 충분히 설정하면 Hash Join이 디스크 사용 없이 메모리 내에서 처리돼요.'
          : 'Setting PGA_AGGREGATE_TARGET high enough allows Hash Join to process entirely in memory without disk spill.'}
      </InfoBox>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {(isKo
              ? ['Build Phase: 작은 테이블을 PGA 해시 테이블로 적재. Probe Phase: 큰 테이블을 스캔하며 해시 키로 매칭해요.', '등치(=) 조인 조건에서만 사용 가능해요.', '두 데이터 집합을 각각 한 번만 읽으므로 대용량 조인에 효율적이에요.', 'PGA 메모리가 부족하면 임시 테이블스페이스를 사용하지만 각 집합을 최대 두 번만 읽어요.', '힌트: USE_HASH(테이블) (강제), NO_USE_HASH(테이블) (방지).']
              : ['Build Phase: loads the smaller table into a PGA hash table. Probe Phase: scans the larger table matching by hash key.', 'Requires an equality (=) join condition.', 'Reads each dataset only once — efficient for large joins.', 'Spills to temporary tablespace when PGA is insufficient, but still reads each dataset at most twice.', 'Hints: USE_HASH(table) (force), NO_USE_HASH(table) (suppress).']
            ).map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
