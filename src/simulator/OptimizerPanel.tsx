// ─── Optimizer Panel ──────────────────────────────────────────────────────
// Hard Parse 의 Optimization 단계를 세 부품 순서대로 펼쳐 보여 준다:
//   ① Query Transformer → ② Estimator → ③ Plan Generator → Row Source Tree(Execution Plan)
// `level` 만큼만 공개해서, 재생 중에는 단계가 진행되는 만큼 내용이 채워진다.

import type { ReactNode } from 'react'
import type { AccessPath, JoinStep, OptimizerResult, TableEstimate } from '@/lib/optimizer/types'
import type { Lang } from '@/store/simulationStore'
import { ExplainPlanTable, type PlanRow } from '@/book/chapters/ExplainPlanTable'
import { InfoBox } from '@/book/chapters/shared'
import { cn } from '@/lib/utils'

const CARD = 'overflow-hidden rounded-card border border-line-2 bg-paper'
const CARD_HEAD = 'flex items-center gap-2 border-b border-line-2 bg-rail px-3 py-1.5'
const CHIP = 'shrink-0 rounded-chip px-1.5 py-px font-mono text-[9px] font-bold'

const T = {
  ko: {
    empty: 'SQL 을 실행하면 옵티마이저가 계획을 고르는 과정이 여기에 나타나요.',
    waiting: '아직 Optimization 단계에 도착하지 않았어요.',
    none: '이 문장은 옵티마이저를 거치지 않아요.',
    reused: 'Soft Parse — 아래는 Library Cache 에 저장돼 있던 계획이에요. 이번에는 옵티마이저가 일하지 않았어요.',
    transformer: '문장을 뜻이 같은 더 싼 모양으로 고쳐 써요',
    estimator: '통계로 Selectivity → Cardinality → Cost 계산',
    generator: '후보를 비교해 가장 싼 계획 선택',
    rows: '행', blocks: '블록', selectivity: '선택도', expected: '예상', noPredicate: '조건이 없어서 모든 행이 대상이에요.',
    accessPaths: 'Access Path 후보', joinOrders: '조인 순서 후보', joinMethods: '조인 방법',
    chosen: 'CHOSEN', considered: '따져 본 조합', totalCost: '총 비용', estRows: '예상 결과 행',
    plan: 'Execution Plan (Row Source Tree)', predicates: 'Predicate Information', running: '실행 중인 Row Source',
    indexOnly: '테이블 접근 없음',
  },
  en: {
    empty: 'Run a SQL statement to watch the optimizer choose a plan.',
    waiting: 'The optimization stage has not been reached yet.',
    none: 'This statement does not go through the optimizer.',
    reused: 'Soft parse — this is the plan already stored in the library cache. The optimizer did no work this time.',
    transformer: 'Rewrites the statement into an equivalent, cheaper form',
    estimator: 'Statistics → selectivity → cardinality → cost',
    generator: 'Compares candidates and picks the cheapest plan',
    rows: 'rows', blocks: 'blocks', selectivity: 'selectivity', expected: 'expected', noPredicate: 'No predicate, so every row qualifies.',
    accessPaths: 'Access path candidates', joinOrders: 'Join order candidates', joinMethods: 'Join methods',
    chosen: 'CHOSEN', considered: 'alternatives costed', totalCost: 'total cost', estRows: 'estimated rows',
    plan: 'Execution Plan (Row Source Tree)', predicates: 'Predicate Information', running: 'Row source running now',
    indexOnly: 'no table access',
  },
}

const ACCESS_LABEL: Record<string, string> = {
  FULL_TABLE_SCAN: 'TABLE ACCESS FULL',
  INDEX_UNIQUE_SCAN: 'INDEX UNIQUE SCAN',
  INDEX_RANGE_SCAN: 'INDEX RANGE SCAN',
  INDEX_FAST_FULL_SCAN: 'INDEX FAST FULL SCAN',
}

function Phase({ n, name, desc, tone, children }: { n: number; name: string; desc: string; tone: 'amber' | 'blue' | 'green'; children: ReactNode }) {
  const cls = { amber: ['bg-amber', 'text-amber'], blue: ['bg-blue', 'text-blue'], green: ['bg-green', 'text-green'] }[tone]
  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white', cls[0])}>{n}</span>
        <span className={cn('font-mono text-xs font-bold', cls[1])}>{name}</span>
        <span className="ml-auto truncate font-sans text-[10.5px] text-ink-3">{desc}</span>
      </div>
      <div className="space-y-2 p-2.5">{children}</div>
    </div>
  )
}

function SubLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-2">{children}</div>
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((d, i) => (
        <li key={i} className="flex items-start gap-1.5 font-sans text-[11.5px] leading-relaxed text-ink">
          <span className="mt-px shrink-0 text-ink-3">›</span>
          <span>{d}</span>
        </li>
      ))}
    </ul>
  )
}

function EstimateCard({ e, lang }: { e: TableEstimate; lang: Lang }) {
  const t = T[lang]
  return (
    <div className="rounded-card border border-line bg-rail px-2.5 py-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-[11px] font-bold text-ink">{e.tableName}</span>
        <span className="font-mono text-[10px] text-ink-2">
          {e.numRows} {t.rows} · {e.numBlocks} {t.blocks}
        </span>
        <span className="ml-auto font-mono text-[10px] font-bold text-blue">
          {t.selectivity} {(e.selectivity * 100).toFixed(1)}% → {t.expected} {e.cardinality} {t.rows}
        </span>
      </div>
      <div className="mt-1 space-y-0.5">
        {e.notes.length === 0 && <div className="font-sans text-[10.5px] text-ink-3">{t.noPredicate}</div>}
        {e.notes.map((n, i) => (
          <div key={i} className="font-mono text-[10px] leading-snug text-ink-2">{n[lang]}</div>
        ))}
      </div>
    </div>
  )
}

function AccessPathRow({ path, maxCost, lang }: { path: AccessPath; maxCost: number; lang: Lang }) {
  const t = T[lang]
  const pct = maxCost > 0 ? Math.min(100, (path.cost / maxCost) * 100) : 0
  return (
    <div className={cn('rounded-card border px-2.5 py-1.5', path.chosen ? 'border-blue bg-blue/[0.06]' : 'border-line bg-rail opacity-70')}>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={cn(CHIP, path.chosen ? 'bg-blue/15 text-blue' : 'bg-ink/10 text-ink-3')}>{ACCESS_LABEL[path.type]}</span>
        {path.index && <span className="font-mono text-[10px] text-ink-2">{path.index.indexName}</span>}
        {path.index && path.indexOnly && <span className="font-sans text-[10px] text-ink-3">({t.indexOnly})</span>}
        <span className={cn('ml-auto font-mono text-[10px] font-bold', path.chosen ? 'text-blue' : 'text-ink-3')}>
          cost {path.cost} <span className="font-normal">(io {path.ioCost} + cpu {path.cpuCost})</span>
        </span>
        {path.chosen && <span className={cn(CHIP, 'bg-blue text-white')}>{t.chosen}</span>}
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-line">
        <div className={cn('h-full rounded-full', path.chosen ? 'bg-blue' : 'bg-ink-3/40')} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 font-sans text-[10.5px] leading-snug text-ink-2">{path.reason[lang]}</div>
    </div>
  )
}

const JOIN_CLS: Record<string, string> = {
  NESTED_LOOPS: 'bg-blue/15 text-blue',
  HASH_JOIN: 'bg-purple/15 text-purple',
  SORT_MERGE_JOIN: 'bg-amber/15 text-amber',
}

function JoinCard({ step, lang }: { step: JoinStep; lang: Lang }) {
  return (
    <div className="rounded-card border border-line bg-rail px-2.5 py-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="font-mono text-[11px] font-bold text-ink">{step.leftLabel} ⋈ {step.rightTable}</span>
        <span className={cn(CHIP, JOIN_CLS[step.method])}>{step.method.replace(/_/g, ' ')}{step.type === 'SEMI' ? ' SEMI' : step.type !== 'INNER' ? ` ${step.type} OUTER` : ''}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-2">
          {step.inputCardinality.left} × {step.inputCardinality.right} → {step.outputCardinality} rows
        </span>
      </div>
      {step.conditionText && <div className="mt-0.5 font-mono text-[10px] text-ink-2">on {step.conditionText}</div>}
      {step.candidates.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {step.candidates.map((c) => (
            <span
              key={c.method}
              className={cn('rounded-chip border px-1.5 py-px font-mono text-[9.5px]', c.method === step.method ? 'border-blue font-bold text-blue' : 'border-line text-ink-3')}
            >
              {c.method.replace(/_/g, ' ')} {c.cost}
            </span>
          ))}
        </div>
      )}
      <div className="mt-1 font-sans text-[10.5px] leading-snug text-ink-2">{step.reason[lang]}</div>
    </div>
  )
}

function toPlanRows(result: OptimizerResult): PlanRow[] {
  return result.planNodes.map((n) => ({
    id: n.id, depth: n.depth, operation: n.operation, name: n.name, rows: n.rows || undefined, cost: n.cost,
    pstart: n.pstart, pstop: n.pstop, tq: n.tq, inOut: n.inOut, distrib: n.distrib,
  }))
}

export function OptimizerPanel({ result, hasTrace, level, reused, runningNodeId, lang }: {
  result: OptimizerResult | null
  hasTrace: boolean
  level: 0 | 1 | 2 | 3
  reused: boolean
  runningNodeId?: number
  lang: Lang
}) {
  const t = T[lang]
  const message = (text: string) => (
    <div className="flex h-full items-center justify-center px-6">
      <p className="text-center font-sans text-xs leading-relaxed text-ink-3">{text}</p>
    </div>
  )
  if (!result) return message(hasTrace ? t.none : t.empty)
  if (level === 0) return message(t.waiting)

  const predicates = result.planNodes.filter((n) => n.access || n.filter)
  const running = result.planNodes.find((n) => n.id === runningNodeId)

  return (
    <div className="space-y-3 p-3">
      {reused && <InfoBox variant="note">{t.reused}</InfoBox>}

      <Phase n={1} name="Query Transformer" desc={t.transformer} tone="amber">
        <Bullets items={result.transformations.map((x) => x[lang])} />
      </Phase>

      {level >= 2 && (
        <Phase n={2} name="Estimator" desc={t.estimator} tone="blue">
          {result.estimates.map((e) => <EstimateCard key={e.alias} e={e} lang={lang} />)}
          {result.tableAccessPlans.length > 0 && <SubLabel>{t.accessPaths}</SubLabel>}
          {result.tableAccessPlans.map((ap) => {
            const max = Math.max(...ap.accessPaths.map((p) => p.cost))
            return (
              <div key={ap.alias} className="space-y-1">
                <div className="font-mono text-[10.5px] font-bold text-ink">{ap.tableName}{ap.alias !== ap.tableName ? ` (${ap.alias})` : ''}</div>
                {ap.accessPaths.map((p, i) => (
                  <AccessPathRow key={i} path={level >= 3 ? p : { ...p, chosen: false }} maxCost={max} lang={lang} />
                ))}
              </div>
            )
          })}
        </Phase>
      )}

      {level >= 3 && (
        <Phase n={3} name="Plan Generator" desc={t.generator} tone="green">
          {result.joinOrders.length > 0 && (
            <>
              <SubLabel>{t.joinOrders}</SubLabel>
              <div className="space-y-1">
                {result.joinOrders.map((o, i) => (
                  <div key={i} className={cn('flex items-center gap-2 rounded-card border px-2.5 py-1', o.chosen ? 'border-blue bg-blue/[0.06]' : 'border-line bg-rail opacity-70')}>
                    <span className="font-mono text-[10.5px] text-ink">{o.order.join(' → ')}</span>
                    <span className={cn('ml-auto font-mono text-[10px] font-bold', o.chosen ? 'text-blue' : 'text-ink-3')}>cost {o.cost}</span>
                    {o.chosen && <span className={cn(CHIP, 'bg-blue text-white')}>{t.chosen}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
          {result.joinSteps.length > 0 && (
            <>
              <SubLabel>{t.joinMethods}</SubLabel>
              {result.joinSteps.map((j, i) => <JoinCard key={i} step={j} lang={lang} />)}
            </>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-ink-2">
            <span>{t.considered} <b className="text-ink">{result.plansConsidered}</b></span>
            <span>{t.totalCost} <b className="text-ink">{result.totalCost}</b></span>
            <span>{t.estRows} <b className="text-ink">{result.estimatedRows}</b></span>
            <span>plan hash <b className="text-ink">{result.planHash}</b></span>
          </div>
        </Phase>
      )}

      {level >= 3 && (
        <div>
          <ExplainPlanTable rows={toPlanRows(result)} caption={t.plan} lang={lang} />
          {running && (
            <div className="-mt-2 mb-3 rounded-card border border-blue bg-blue/[0.06] px-2.5 py-1 font-mono text-[10.5px] text-blue">
              ▶ {t.running}: Id {running.id} · {running.operation}{running.name ? ` ${running.name}` : ''}
            </div>
          )}
          {predicates.length > 0 && (
            <div className="rounded-card border border-line bg-rail px-3 py-2">
              <SubLabel>{t.predicates}</SubLabel>
              <div className="mt-1 space-y-0.5 font-mono text-[10.5px] text-ink">
                {predicates.map((n) => (
                  <div key={n.id}>
                    <span className="text-amber">{String(n.id).padStart(2)}</span>
                    {' - '}
                    {[n.access && `access(${n.access})`, n.filter && `filter(${n.filter})`].filter(Boolean).join('  ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {level >= 3 && result.warnings.length > 0 && (
        <InfoBox variant="warning">
          {result.warnings.map((w, i) => <div key={i}>› {w[lang]}</div>)}
        </InfoBox>
      )}
    </div>
  )
}
