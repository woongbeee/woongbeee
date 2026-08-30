import { useState } from 'react'
import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, Divider, SqlBlock } from '../../shared'
import { cn } from '@/lib/utils'

// ── 데이터 ────────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  { id: 1, name: 'Alice', deptId: 10, salary: 6000 },
  { id: 2, name: 'Bob',   deptId: 20, salary: 4500 },
  { id: 3, name: 'Carol', deptId: 10, salary: 7200 },
  { id: 4, name: 'Dave',  deptId: 30, salary: 5100 },
  { id: 5, name: 'Eve',   deptId: 20, salary: 8300 },
]

const DEPARTMENTS = [
  { id: 10, name: 'Engineering' },
  { id: 20, name: 'Sales' },
  { id: 30, name: 'HR' },
]

// ── 스텝 타입 ─────────────────────────────────────────────────────────────────

type JoinMethod = 'nl' | 'hash' | 'sm'

interface Step {
  label: { ko: string; en: string }
  highlightEmp: number[]
  highlightDept: number[]
  result: { emp: typeof EMPLOYEES[0]; dept: typeof DEPARTMENTS[0] }[]
  phase?: 'scan' | 'build' | 'probe' | 'sort' | 'merge' | 'match' | 'done'
  hashTable?: { key: number; val: string }[]
  sortedEmp?: typeof EMPLOYEES
  sortedDept?: typeof DEPARTMENTS
}

// ── Nested Loop 스텝 ──────────────────────────────────────────────────────────

function makeNLSteps(): Step[] {
  const steps: Step[] = []
  const results: Step['result'] = []

  steps.push({
    label: {
      ko: 'Outer 테이블(employees)의 첫 번째 행을 읽을 준비를 해요.',
      en: 'Ready to read the first row from the outer table (employees).',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'scan',
  })

  for (let ei = 0; ei < EMPLOYEES.length; ei++) {
    const emp = EMPLOYEES[ei]
    const dept = DEPARTMENTS.find(d => d.id === emp.deptId)!
    const deptIdx = DEPARTMENTS.findIndex(d => d.id === emp.deptId)

    steps.push({
      label: {
        ko: `[Outer #${ei + 1}] ${emp.name} (dept_id=${emp.deptId}) 읽음 — Inner 테이블 전체를 탐색해요.`,
        en: `[Outer #${ei + 1}] Read ${emp.name} (dept_id=${emp.deptId}) — scanning inner table.`,
      },
      highlightEmp: [ei], highlightDept: [], result: [...results], phase: 'scan',
    })

    steps.push({
      label: {
        ko: `dept_id=${emp.deptId} → ${dept.name} 매칭 성공 ✓ — 결과 집합에 추가해요.`,
        en: `dept_id=${emp.deptId} → ${dept.name} matched ✓ — adding to result set.`,
      },
      highlightEmp: [ei], highlightDept: [deptIdx], result: [...results], phase: 'match',
    })

    results.push({ emp, dept })
    steps.push({
      label: {
        ko: `결과 추가 완료: ${emp.name} ↔ ${dept.name}. 다음 Outer 행으로 이동해요.`,
        en: `Added: ${emp.name} ↔ ${dept.name}. Moving to next outer row.`,
      },
      highlightEmp: [ei], highlightDept: [deptIdx], result: [...results], phase: 'match',
    })
  }

  steps.push({
    label: {
      ko: '모든 Outer 행 처리 완료. Nested Loop Join 결과: 5행.',
      en: 'All outer rows processed. Nested Loop Join result: 5 rows.',
    },
    highlightEmp: [], highlightDept: [], result: [...results], phase: 'done',
  })

  return steps
}

// ── Hash Join 스텝 ────────────────────────────────────────────────────────────

function makeHashSteps(): Step[] {
  const steps: Step[] = []
  const results: Step['result'] = []

  steps.push({
    label: {
      ko: 'Build Phase 시작 — 더 작은 집합인 departments(3행)를 스캔해서 PGA에 해시 테이블을 구축해요.',
      en: 'Build Phase — scan the smaller dataset departments (3 rows) to build a hash table in PGA.',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'build',
  })

  const hashTable: { key: number; val: string }[] = []
  for (let di = 0; di < DEPARTMENTS.length; di++) {
    const dept = DEPARTMENTS[di]
    hashTable.push({ key: dept.id, val: dept.name })
    steps.push({
      label: {
        ko: `h(dept_id=${dept.id}) → "${dept.name}" — PGA 해시 버킷에 저장했어요.`,
        en: `h(dept_id=${dept.id}) → "${dept.name}" — stored in PGA hash bucket.`,
      },
      highlightEmp: [], highlightDept: [di], result: [], phase: 'build', hashTable: [...hashTable],
    })
  }

  steps.push({
    label: {
      ko: 'Build Phase 완료 — 해시 테이블(3 버킷) 준비됐어요. 이제 Probe Phase를 시작해요.',
      en: 'Build Phase complete — hash table (3 buckets) ready. Starting Probe Phase.',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'build', hashTable: [...hashTable],
  })

  steps.push({
    label: {
      ko: 'Probe Phase 시작 — employees(5행)를 스캔해요. 각 행의 dept_id로 해시 테이블을 탐색해요.',
      en: 'Probe Phase — scan employees (5 rows). For each row, probe the hash table using dept_id.',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'probe', hashTable: [...hashTable],
  })

  for (let ei = 0; ei < EMPLOYEES.length; ei++) {
    const emp = EMPLOYEES[ei]
    const deptIdx = DEPARTMENTS.findIndex(d => d.id === emp.deptId)
    const dept = DEPARTMENTS[deptIdx]

    steps.push({
      label: {
        ko: `${emp.name} (dept_id=${emp.deptId}) → h(${emp.deptId}) 탐색 → "${dept.name}" 매칭 ✓`,
        en: `${emp.name} (dept_id=${emp.deptId}) → probe h(${emp.deptId}) → "${dept.name}" matched ✓`,
      },
      highlightEmp: [ei], highlightDept: [deptIdx], result: [...results], phase: 'probe', hashTable: [...hashTable],
    })

    results.push({ emp, dept })
    steps.push({
      label: {
        ko: `결과 추가: ${emp.name} ↔ ${dept.name}. 다음 행을 프로브해요.`,
        en: `Added: ${emp.name} ↔ ${dept.name}. Probing next row.`,
      },
      highlightEmp: [ei], highlightDept: [deptIdx], result: [...results], phase: 'probe', hashTable: [...hashTable],
    })
  }

  steps.push({
    label: {
      ko: 'Probe Phase 완료. departments를 1번, employees를 1번 읽어서 Hash Join 결과: 5행.',
      en: 'Probe Phase complete. Each dataset read exactly once. Hash Join result: 5 rows.',
    },
    highlightEmp: [], highlightDept: [], result: [...results], phase: 'done', hashTable: [...hashTable],
  })

  return steps
}

// ── Sort Merge 스텝 ───────────────────────────────────────────────────────────

function makeSMSteps(): Step[] {
  const steps: Step[] = []
  const results: Step['result'] = []

  steps.push({
    label: {
      ko: 'Sort Phase 시작 — employees를 dept_id 오름차순으로 정렬해요.',
      en: 'Sort Phase — sorting employees by dept_id ascending.',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'sort',
  })

  const sortedEmp = [...EMPLOYEES].sort((a, b) => a.deptId - b.deptId)
  steps.push({
    label: {
      ko: `employees 정렬 완료: ${sortedEmp.map(e => `${e.name}(${e.deptId})`).join(', ')}`,
      en: `employees sorted: ${sortedEmp.map(e => `${e.name}(${e.deptId})`).join(', ')}`,
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'sort', sortedEmp,
  })

  steps.push({
    label: {
      ko: 'departments를 dept_id 오름차순으로 정렬해요.',
      en: 'Sorting departments by dept_id ascending.',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'sort', sortedEmp,
  })

  const sortedDept = [...DEPARTMENTS].sort((a, b) => a.id - b.id)
  steps.push({
    label: {
      ko: `departments 정렬 완료: ${sortedDept.map(d => `${d.name}(${d.id})`).join(', ')}. 이제 Merge Phase를 시작해요.`,
      en: `departments sorted: ${sortedDept.map(d => `${d.name}(${d.id})`).join(', ')}. Starting Merge Phase.`,
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'sort', sortedEmp, sortedDept,
  })

  steps.push({
    label: {
      ko: 'Merge Phase 시작 — 두 포인터를 각 집합의 첫 행에 놓고 키를 비교하며 앞으로 이동해요.',
      en: 'Merge Phase — place two pointers at the start of each sorted set and advance by comparing keys.',
    },
    highlightEmp: [], highlightDept: [], result: [], phase: 'merge', sortedEmp, sortedDept,
  })

  for (let ei = 0; ei < sortedEmp.length; ei++) {
    const emp = sortedEmp[ei]
    const deptOrigIdx = DEPARTMENTS.findIndex(d => d.id === emp.deptId)
    const dept = DEPARTMENTS[deptOrigIdx]
    const sortedDeptIdx = sortedDept.findIndex(d => d.id === emp.deptId)

    steps.push({
      label: {
        ko: `포인터 비교: ${emp.name}(key=${emp.deptId}) ↔ ${dept.name}(key=${dept.id}) — 키 일치 ✓, 결과 추가해요.`,
        en: `Compare pointers: ${emp.name}(key=${emp.deptId}) ↔ ${dept.name}(key=${dept.id}) — keys match ✓, adding result.`,
      },
      highlightEmp: [EMPLOYEES.findIndex(e => e.id === emp.id)],
      highlightDept: [deptOrigIdx],
      result: [...results], phase: 'merge',
      sortedEmp: sortedEmp.slice(ei),
      sortedDept: sortedDept.slice(sortedDeptIdx),
    })

    results.push({ emp, dept })
    steps.push({
      label: {
        ko: `결과 추가: ${emp.name} ↔ ${dept.name}. employees 포인터를 다음 행으로 이동해요.`,
        en: `Added: ${emp.name} ↔ ${dept.name}. Advancing the employees pointer.`,
      },
      highlightEmp: [EMPLOYEES.findIndex(e => e.id === emp.id)],
      highlightDept: [deptOrigIdx],
      result: [...results], phase: 'merge',
      sortedEmp: sortedEmp.slice(ei + 1),
      sortedDept: sortedDept.slice(sortedDeptIdx),
    })
  }

  steps.push({
    label: {
      ko: 'Merge Phase 완료. 처음부터 다시 스캔 없이 포인터 이동만으로 Sort Merge Join 결과: 5행.',
      en: 'Merge Phase complete. No re-scan from start — pointer advancement only. Sort Merge result: 5 rows.',
    },
    highlightEmp: [], highlightDept: [], result: [...results], phase: 'done',
  })

  return steps
}

// ── 팔레트 ────────────────────────────────────────────────────────────────────

const METHOD_META = {
  nl: {
    label: 'Nested Loop Join',
    headerBg: 'bg-blue',
    activeBorder: 'border-blue/50',
    empHighlight: 'border-blue/50 bg-blue/10 font-bold text-blue',
    deptHighlight: 'border-amber/50 bg-amber/10 font-bold text-amber',
    phaseBg: { scan: 'bg-blue/5 border-blue/30', match: 'bg-green/5 border-green/30', done: 'bg-paper-sunk border-line' } as Record<string, string>,
  },
  hash: {
    label: 'Hash Join',
    headerBg: 'bg-amber',
    activeBorder: 'border-amber/50',
    empHighlight: 'border-blue/50 bg-blue/10 font-bold text-blue',
    deptHighlight: 'border-amber/50 bg-amber/10 font-bold text-amber',
    phaseBg: { build: 'bg-blue/5 border-blue/30', probe: 'bg-amber/5 border-amber/30', done: 'bg-paper-sunk border-line' } as Record<string, string>,
  },
  sm: {
    label: 'Sort Merge Join',
    headerBg: 'bg-purple',
    activeBorder: 'border-purple/50',
    empHighlight: 'border-purple/50 bg-purple/10 font-bold text-purple',
    deptHighlight: 'border-green/50 bg-green/10 font-bold text-green',
    phaseBg: { sort: 'bg-purple/5 border-purple/30', merge: 'bg-green/5 border-green/30', done: 'bg-paper-sunk border-line' } as Record<string, string>,
  },
}

const PHASE_BADGE: Record<string, string> = {
  scan:  'bg-blue/10 text-blue',
  build: 'bg-blue/10 text-blue',
  probe: 'bg-amber/10 text-amber',
  sort:  'bg-purple/10 text-purple',
  merge: 'bg-green/10 text-green',
  match: 'bg-green/10 text-green',
  done:  'bg-paper-sunk text-ink-2',
}

// ── 조인 패널 ─────────────────────────────────────────────────────────────────

function JoinPanel({ method, steps, isKo }: { method: JoinMethod; steps: Step[]; isKo: boolean }) {
  const [stepIdx, setStepIdx] = useState(0)
  const meta = METHOD_META[method]
  const step = steps[stepIdx]
  const phaseBg = step.phase ? (meta.phaseBg[step.phase] ?? 'bg-paper-sunk border-line') : 'bg-paper-sunk border-line'
  const phaseBadge = step.phase ? PHASE_BADGE[step.phase] : ''

  return (
    <div className={cn('rounded-panel border-2 overflow-hidden', meta.activeBorder)}>
      {/* 헤더 바 */}
      <div className={cn('flex items-center justify-between px-5 py-3', meta.headerBg)}>
        <span className="font-mono text-sm font-bold text-paper">{meta.label}</span>
        <div className="flex items-center gap-2">
          {step.phase && (
            <span className={cn('rounded px-2 py-0.5 font-mono text-[10px] font-bold', phaseBadge)}>
              {step.phase.toUpperCase()}
            </span>
          )}
          <span className="font-mono text-[11px] text-paper/70">
            {stepIdx + 1} / {steps.length}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* 현재 스텝 설명 */}
        <div className={cn('mb-4 rounded-panel border px-4 py-3 transition-all', phaseBg)}>
          <p className="text-sm leading-relaxed text-ink/80">
            {isKo ? step.label.ko : step.label.en}
          </p>
        </div>

        {/* 메인 영역: 데이터 테이블 + 결과 */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          {/* EMPLOYEES */}
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-2">
              employees
            </p>
            <div className="space-y-1.5">
              {EMPLOYEES.map((emp, i) => (
                <div
                  key={emp.id}
                  className={cn(
                    'rounded-card border px-3 py-2 font-mono text-xs transition-all',
                    step.highlightEmp.includes(i)
                      ? meta.empHighlight
                      : 'border-line bg-paper-sunk text-ink-2',
                  )}
                >
                  <span className="text-ink-2 text-[10px]">{emp.id}.</span>{' '}
                  <span className="font-semibold">{emp.name}</span>
                  <span className="ml-1.5 text-[10px] opacity-60">dept={emp.deptId}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DEPARTMENTS / HASH TABLE / SORTED */}
          <div>
            {step.hashTable ? (
              <>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-purple">
                  hash table (PGA)
                </p>
                <div className="space-y-1.5">
                  {step.hashTable.map((h) => {
                    const dIdx = DEPARTMENTS.findIndex(d => d.id === h.key)
                    return (
                      <div
                        key={h.key}
                        className={cn(
                          'rounded-card border px-3 py-2 font-mono text-xs transition-all',
                          step.highlightDept.includes(dIdx)
                            ? meta.deptHighlight
                            : 'border-purple/30 bg-purple/5 text-purple',
                        )}
                      >
                        <span className="text-purple">h(</span>{h.key}<span className="text-purple">)</span>
                        <span className="mx-1 text-purple">→</span>
                        <span className="font-semibold">{h.val}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : step.sortedDept ? (
              <>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-purple">
                  {isKo ? 'departments (정렬됨)' : 'departments (sorted)'}
                </p>
                <div className="space-y-1.5">
                  {step.sortedDept.map((dept) => {
                    const origIdx = DEPARTMENTS.findIndex(d => d.id === dept.id)
                    const isFirst = step.sortedDept![0].id === dept.id
                    return (
                      <div
                        key={dept.id}
                        className={cn(
                          'rounded-card border px-3 py-2 font-mono text-xs transition-all',
                          step.highlightDept.includes(origIdx)
                            ? meta.deptHighlight
                            : isFirst
                              ? 'border-purple/50 bg-purple/5 text-purple ring-1 ring-purple/50'
                              : 'border-purple/30 bg-purple/5 text-purple',
                        )}
                      >
                        <span className="text-[10px] opacity-60">{dept.id}</span>
                        <span className="mx-1.5 text-purple">—</span>
                        <span className="font-semibold">{dept.name}</span>
                        {isFirst && step.phase === 'merge' && (
                          <span className="ml-1.5 text-[9px] text-purple">← ptr</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-2">
                  departments
                </p>
                <div className="space-y-1.5">
                  {DEPARTMENTS.map((dept, i) => (
                    <div
                      key={dept.id}
                      className={cn(
                        'rounded-card border px-3 py-2 font-mono text-xs transition-all',
                        step.highlightDept.includes(i)
                          ? meta.deptHighlight
                          : 'border-line bg-paper-sunk text-ink-2',
                      )}
                    >
                      <span className="text-ink-2 text-[10px]">{dept.id}.</span>{' '}
                      <span className="font-semibold">{dept.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 결과 */}
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-green">
              {isKo ? `결과 (${step.result.length} / 5행)` : `result (${step.result.length} / 5)`}
            </p>
            <div className="space-y-1.5 min-h-[32px]">
              {step.result.length === 0 ? (
                <p className="rounded-card border border-dashed border-line px-3 py-2 font-mono text-[11px] text-ink-2/40">
                  {isKo ? '아직 없어요' : 'none yet'}
                </p>
              ) : (
                step.result.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-card border border-green/30 bg-green/5 px-3 py-1.5 font-mono text-xs text-green"
                  >
                    <span className="font-bold">{r.emp.name}</span>
                    <span className="text-green">↔</span>
                    <span>{r.dept.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mb-4 h-1.5 rounded-full bg-paper-sunk">
          <div
            className={cn('h-1.5 rounded-full transition-all', meta.headerBg)}
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* 컨트롤 */}
        <div className="flex gap-2">
          {[
            { label: isKo ? '← 이전' : '← Prev', onClick: () => setStepIdx(s => Math.max(0, s - 1)), disabled: stepIdx === 0 },
            { label: isKo ? '다음 →' : 'Next →', onClick: () => setStepIdx(s => Math.min(steps.length - 1, s + 1)), disabled: stepIdx >= steps.length - 1 },
            { label: isKo ? '↺ 리셋' : '↺ Reset', onClick: () => setStepIdx(0), disabled: false },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className="rounded-card border border-line px-4 py-1.5 font-mono text-xs text-ink-2 transition-colors hover:bg-rail disabled:opacity-30"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 메인 섹션 ─────────────────────────────────────────────────────────────────

const NL_STEPS   = makeNLSteps()
const HASH_STEPS = makeHashSteps()
const SM_STEPS   = makeSMSteps()

const T = {
  ko: {
    title: 'Join Simulator',
    subtitle: '같은 쿼리를 세 가지 조인 방식으로 실행하면 어떻게 다른지 단계별로 비교해봐요.',
    queryLabel: '예시 쿼리',
    query: `SELECT e.name, d.name AS dept
FROM   employees e
JOIN   departments d
  ON   e.dept_id = d.id;`,
    desc: '5명의 직원(employees)과 3개 부서(departments)를 조인하는 쿼리예요. 세 패널이 각각 독립적으로 동작하므로 원하는 속도로 나란히 비교할 수 있어요.',
    tips: [
      '🔵 Nested Loop — Outer 행마다 Inner를 탐색해요. Inner에 인덱스가 있으면 빠르고, 없으면 반복 Full Scan이 발생해요.',
      '🟠 Hash Join — departments를 PGA에 해시 테이블로 올린 뒤(Build), employees를 한 번만 스캔해서 탐색해요(Probe). 두 테이블 각각 1번만 읽어요.',
      '🟣 Sort Merge — 두 집합을 dept_id로 정렬한 뒤 두 포인터를 앞으로만 이동해요. 처음부터 재스캔하지 않아요.',
    ],
  },
  en: {
    title: 'Join Simulator',
    subtitle: 'Compare how the same query executes step by step across all three join methods.',
    queryLabel: 'Example Query',
    query: `SELECT e.name, d.name AS dept
FROM   employees e
JOIN   departments d
  ON   e.dept_id = d.id;`,
    desc: 'Joins 5 employees with 3 departments. Each panel runs independently — step through at your own pace and compare side by side.',
    tips: [
      '🔵 Nested Loop — probes the inner table for every outer row. Fast with a selective index; causes repeated full scans without one.',
      '🟠 Hash Join — loads departments into a PGA hash table (Build), then scans employees once to probe (Probe). Each table is read exactly once.',
      '🟣 Sort Merge — sorts both sets on dept_id, then advances two pointers forward only. No re-scan from the beginning.',
    ],
  },
}

export function JoinSimulatorSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="mt-4">
        <SqlBlock sql={t.query} badge={t.queryLabel} badgeColor="emerald" />
      </div>

      <p className="mt-4 mb-3 text-sm leading-relaxed text-ink-2">{t.desc}</p>

      <div className="mb-6 space-y-1.5 rounded-panel border border-line bg-paper-sunk px-4 py-3">
        {t.tips.map((tip, i) => (
          <p key={i} className="text-sm leading-relaxed text-ink-2">{tip}</p>
        ))}
      </div>

      <Divider />

      <div className="space-y-6">
        <JoinPanel method="nl"   steps={NL_STEPS}   isKo={isKo} />
        <JoinPanel method="hash" steps={HASH_STEPS} isKo={isKo} />
        <JoinPanel method="sm"   steps={SM_STEPS}   isKo={isKo} />
      </div>
    </PageContainer>
  )
}
