// ─── Pipeline Bar ─────────────────────────────────────────────────────────
// 공식 문서의 "Stages of SQL Processing" 을 한 줄로 펼친 진행 표시.
//   Parse(Syntax → Semantic → Shared Pool Check) → Optimization → Row Source Generation → Execution → Fetch
// Soft Parse 면 Optimization · Row Source Generation 이 "건너뜀"으로 표시된다.

import { Fragment } from 'react'
import { useInternalsStore } from '@/store/internalsStore'
import { useLangStore } from '@/store/simulationStore'
import type { StageId, Trace } from '@/lib/simulator/types'
import { cn } from '@/lib/utils'

const STAGES: { id: StageId; label: string; group: 'parse' | 'main' }[] = [
  { id: 'syntax', label: 'Syntax Check', group: 'parse' },
  { id: 'semantic', label: 'Semantic Check', group: 'parse' },
  { id: 'shared-pool', label: 'Shared Pool Check', group: 'parse' },
  { id: 'optimize', label: 'Optimization', group: 'main' },
  { id: 'row-source', label: 'Row Source Generation', group: 'main' },
  { id: 'execute', label: 'Execution', group: 'main' },
  { id: 'fetch', label: 'Fetch', group: 'main' },
]

const T = {
  ko: { skipped: '건너뜀', na: '해당 없음', hard: 'HARD PARSE', soft: 'SOFT PARSE', command: '인스턴스 명령', idle: 'SQL 을 실행하면 처리 단계가 여기에 표시돼요' },
  en: { skipped: 'skipped', na: 'n/a', hard: 'HARD PARSE', soft: 'SOFT PARSE', command: 'Instance command', idle: 'Run a SQL statement to see its processing stages here' },
}

type Status = 'pending' | 'active' | 'done' | 'skipped' | 'na' | 'error'

function statusOf(stage: StageId, trace: Trace | null, cursor: number): Status {
  if (!trace) return 'pending'
  if (trace.notApplicable.includes(stage)) return 'na'
  const current = trace.steps[cursor]
  if (current?.stage === stage) return current.result === 'error' ? 'error' : 'active'
  const first = trace.steps.findIndex((s) => s.stage === stage)
  if (first >= 0) return first < cursor ? 'done' : 'pending'
  // 단계가 아예 없는 경우: Soft Parse 로 건너뛴 단계는 Shared Pool Check 를 지난 뒤부터 표시
  const decided = trace.steps.findIndex((s) => s.stage === 'shared-pool')
  if (trace.skipped.includes(stage) && decided >= 0 && cursor >= decided) return 'skipped'
  return 'pending'
}

const STATUS_CLS: Record<Status, string> = {
  pending: 'border-line bg-paper text-ink-3',
  active: 'border-blue bg-blue text-white',
  done: 'border-green/50 bg-green/10 text-green',
  skipped: 'border-dashed border-line-2 bg-rail text-ink-3 line-through',
  na: 'border-dashed border-line bg-transparent text-ink-3 opacity-50',
  error: 'border-red bg-red text-white',
}

export function PipelineBar() {
  const trace = useInternalsStore((s) => s.trace)
  const cursor = useInternalsStore((s) => s.cursor)
  const goTo = useInternalsStore((s) => s.goTo)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]

  const decided = trace ? trace.steps.findIndex((s) => s.stage === 'shared-pool') : -1
  const parseBadge = trace?.parseType && decided >= 0 && cursor >= decided ? trace.parseType : null

  const chip = (stage: (typeof STAGES)[number]) => {
    const status = statusOf(stage.id, trace, cursor)
    const first = trace?.steps.findIndex((s) => s.stage === stage.id) ?? -1
    return (
      <button
        key={stage.id}
        disabled={first < 0}
        onClick={() => goTo(first)}
        title={status === 'skipped' ? t.skipped : status === 'na' ? t.na : undefined}
        className={cn(
          'whitespace-nowrap rounded-chip border px-2 py-1 font-mono text-[10.5px] font-medium transition-colors',
          STATUS_CLS[status],
          first >= 0 && status !== 'active' && 'hover:border-line-2',
          first < 0 && 'cursor-default',
        )}
      >
        {status === 'done' && '✓ '}
        {stage.label}
      </button>
    )
  }

  const arrow = <span className="font-mono text-[10px] text-ink-3">→</span>
  const parse = STAGES.filter((s) => s.group === 'parse')
  const main = STAGES.filter((s) => s.group === 'main')

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line-2 bg-paper px-4 py-2">
      {/* Parse 묶음 */}
      <div className="flex items-center gap-1.5 rounded-card border border-line bg-rail px-2 py-1">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-2">Parse</span>
        {parse.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 && arrow}
            {chip(s)}
          </Fragment>
        ))}
      </div>
      {main.map((s) => (
        <Fragment key={s.id}>
          {arrow}
          {chip(s)}
        </Fragment>
      ))}

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
        {parseBadge && (
          <span
            className={cn(
              'rounded-chip px-2 py-1 font-mono text-[10px] font-bold',
              parseBadge === 'hard' ? 'bg-red/10 text-red' : 'bg-green/10 text-green',
            )}
          >
            {parseBadge === 'hard' ? t.hard : t.soft}
          </span>
        )}
        {trace?.kind === 'command' && (
          <span className="rounded-chip bg-amber/10 px-2 py-1 font-mono text-[10px] font-bold text-amber">
            {t.command}: {trace.sql}
          </span>
        )}
        {!trace && <span className="whitespace-nowrap font-sans text-[11px] text-ink-3">{t.idle}</span>}
      </div>
    </div>
  )
}
