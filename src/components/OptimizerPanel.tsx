// ─── Optimizer Panel ──────────────────────────────────────────────────────
// Visualizes Oracle CBO execution plan: Query Transformer → Estimator → Plan Generator

import { motion } from 'framer-motion'
import type { OptimizerResult, AccessPath, JoinStep, OptimizerPhase } from '@/lib/optimizer/types'
import { useLangStore } from '@/store/simulationStore'
import { InfoBox } from '@/book/chapters/shared'
import { ExplainPlanTable, type PlanRow } from '@/book/chapters/ExplainPlanTable'
import { cn } from '@/lib/utils'

const CARD = 'overflow-hidden rounded-card border border-line-2 bg-paper'
const CARD_HEAD = 'flex items-center gap-2 border-b border-line-2 bg-rail px-3 py-1.5'
const CHIP = 'shrink-0 rounded-chip px-1.5 py-px font-mono text-[9px] font-bold'

// ── Phase Header ──────────────────────────────────────────────────────────

const PHASE_CLS: Record<OptimizerPhase['name'], { dot: string; text: string }> = {
  'Query Transformer': { dot: 'bg-amber', text: 'text-amber' },
  'Estimator':         { dot: 'bg-blue',  text: 'text-blue' },
  'Plan Generator':    { dot: 'bg-green', text: 'text-green' },
}

function PhaseHeader({ phase, index }: { phase: OptimizerPhase; index: number }) {
  const c = PHASE_CLS[phase.name]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={CARD}
    >
      <div className={CARD_HEAD}>
        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white', c.dot)}>
          {index + 1}
        </span>
        <span className={cn('font-mono text-xs font-bold', c.text)}>{phase.name}</span>
        <span className="ml-auto truncate font-mono text-[10px] text-ink-3">{phase.description}</span>
        {phase.cost !== undefined && (
          <span className={cn(CHIP, 'border border-line bg-paper text-ink-2')}>cost {phase.cost.toFixed(1)}</span>
        )}
      </div>
      <div className="space-y-0.5 px-3 py-2">
        {phase.details.map((d, i) => (
          <div key={i} className="flex items-start gap-1.5 font-mono text-[11px] text-ink-2">
            <span className={cn('mt-0.5 shrink-0', c.text)}>›</span>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Access Path Card ──────────────────────────────────────────────────────

const ACCESS_PATH_LABEL: Record<string, string> = {
  FULL_TABLE_SCAN:       'FTS',
  INDEX_UNIQUE_SCAN:     'IUS',
  INDEX_RANGE_SCAN:      'IRS',
  INDEX_FULL_SCAN:       'IFS',
  INDEX_FAST_FULL_SCAN:  'IFFS',
  INDEX_SKIP_SCAN:       'ISS',
}

function AccessPathRow({ path, maxCost }: { path: AccessPath; maxCost: number }) {
  const pct = maxCost > 0 ? Math.min(100, (path.cost / maxCost) * 100) : 0
  const isChosen = path.chosen

  return (
    <div
      className={cn(
        'rounded-card border px-2.5 py-1.5',
        isChosen ? 'border-blue bg-blue/[0.06]' : 'border-line bg-rail opacity-60'
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={cn(CHIP, isChosen ? 'bg-blue/15 text-blue' : 'bg-ink/10 text-ink-3')}>
          {ACCESS_PATH_LABEL[path.type] ?? path.type}
        </span>
        {path.indexName && (
          <span className="font-mono text-[10px] text-ink-3">{path.indexName}</span>
        )}
        <span className={cn('ml-auto font-mono text-[10px] font-bold', isChosen ? 'text-blue' : 'text-ink-3')}>
          cost {path.cost.toFixed(1)}
        </span>
        {isChosen && <span className={cn(CHIP, 'bg-blue text-white')}>CHOSEN</span>}
      </div>
      {/* Cost bar */}
      <div className="relative h-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn('h-full rounded-full transition-all', isChosen ? 'bg-blue' : 'bg-ink-3/40')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-2">{path.reason}</div>
    </div>
  )
}

function TableAccessCard({ tableName, accessPaths }: { tableName: string; accessPaths: AccessPath[] }) {
  const maxCost = Math.max(...accessPaths.map((p) => p.cost))
  const chosen = accessPaths.find((p) => p.chosen)

  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <span className="font-mono text-xs font-bold text-ink">{tableName}</span>
        <span className="font-mono text-[10px] text-ink-3">
          card {chosen?.cardinality} · sel {((chosen?.selectivity ?? 1) * 100).toFixed(1)}%
        </span>
      </div>
      <div className="space-y-1.5 p-2">
        {accessPaths.map((p, i) => (
          <AccessPathRow key={i} path={p} maxCost={maxCost} />
        ))}
      </div>
    </div>
  )
}

// ── Join Step Card ────────────────────────────────────────────────────────

const JOIN_METHOD_CLS: Record<string, { text: string; chip: string }> = {
  NESTED_LOOPS:    { text: 'text-blue',   chip: 'bg-blue/15 text-blue' },
  HASH_JOIN:       { text: 'text-purple', chip: 'bg-purple/15 text-purple' },
  SORT_MERGE_JOIN: { text: 'text-amber',  chip: 'bg-amber/15 text-amber' },
}

function JoinStepCard({ step, index }: { step: JoinStep; index: number }) {
  const c = JOIN_METHOD_CLS[step.method] ?? JOIN_METHOD_CLS.HASH_JOIN

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="rounded-card border border-line-2 bg-paper p-2.5"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={cn('font-mono text-xs font-bold', c.text)}>
          {step.leftTable} ⋈ {step.rightTable}
        </span>
        <span className={cn(CHIP, c.chip)}>{step.method.replace(/_/g, ' ')}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-3">cost {step.cost.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] text-ink">
        <span>left {step.inputCardinality.left}</span>
        <span className="text-ink-3">×</span>
        <span>right {step.inputCardinality.right}</span>
        <span className="text-ink-3">→</span>
        <span className="font-semibold">out {step.outputCardinality}</span>
        <span className="text-ink-3">on {step.condition.leftColumn}={step.condition.rightColumn}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-2">{step.reason}</div>
    </motion.div>
  )
}

// ── Execution Plan → 공용 ExplainPlanTable 행으로 변환 ─────────────────────

function toPlanRows(result: OptimizerResult): PlanRow[] {
  const { plan } = result
  const rows: PlanRow[] = []
  const push = (depth: number, operation: string, cost: number, card: number, name?: string) =>
    rows.push({ id: rows.length, depth, operation, name, cost: Number(cost.toFixed(1)), rows: card })

  push(0, 'SELECT STATEMENT', plan.totalCost, plan.estimatedRows)
  for (let i = plan.joinSteps.length - 1; i >= 0; i--) {
    const j = plan.joinSteps[i]
    push(1 + (plan.joinSteps.length - 1 - i), j.method.replace(/_/g, ' '), j.cost, j.outputCardinality)
  }

  const depth = plan.joinSteps.length > 0 ? plan.joinSteps.length + 1 : 1
  for (const ap of plan.tableAccessPlans) {
    const name = ap.chosen.indexName ? `${ap.tableName} [${ap.chosen.indexName}]` : ap.tableName
    push(depth, ap.chosen.type.replace(/_/g, ' '), ap.chosen.cost, ap.chosen.cardinality, name)
  }
  return rows
}

// ── Main Panel ────────────────────────────────────────────────────────────

interface OptimizerPanelProps {
  result: OptimizerResult | null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink-2">
        {children}
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

export function OptimizerPanel({ result }: OptimizerPanelProps) {
  const lang = useLangStore((s) => s.lang)
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-center font-sans text-xs text-ink-3">
          {lang === 'ko'
            ? '쿼리를 실행하면 옵티마이저 분석 결과가 여기에 나타나요.'
            : 'Run a query to see the Optimizer analysis.'}
        </p>
      </div>
    )
  }

  const { plan, phases } = result

  return (
    <div className="h-full space-y-3 overflow-auto p-3">

      {/* Optimizer Phases */}
      <div>
        <SectionLabel>Optimizer Phases</SectionLabel>
        <div className="space-y-2">
          {phases.map((phase, i) => (
            <PhaseHeader key={phase.name} phase={phase} index={i} />
          ))}
        </div>
      </div>

      {/* Access Path Candidates */}
      <div>
        <SectionLabel>Access Path Candidates</SectionLabel>
        <div className="space-y-2">
          {plan.tableAccessPlans.map((ap) => (
            <TableAccessCard key={ap.tableName} tableName={ap.tableName} accessPaths={ap.accessPaths} />
          ))}
        </div>
      </div>

      {/* Join Steps */}
      {plan.joinSteps.length > 0 && (
        <div>
          <SectionLabel>Join Methods</SectionLabel>
          <div className="space-y-1.5">
            {plan.joinSteps.map((step, i) => (
              <JoinStepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Execution Plan */}
      <ExplainPlanTable rows={toPlanRows(result)} caption="Execution Plan" lang={lang} />

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <InfoBox variant="warning">
          {plan.warnings.map((w, i) => (
            <div key={i}>› {w}</div>
          ))}
        </InfoBox>
      )}
    </div>
  )
}
