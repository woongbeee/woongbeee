// ─── ExecutionPlanViewer ────────────────────────────────────────────────────
// Reusable Oracle execution plan viewer.
// Supports three tabs: Plan Tree · Row Source Operations · Statistics (Call / Wait Events)
//
// Usage A — raw data:
//   <ExecutionPlanViewer nodes={nodes} stats={stats} />
//
// Usage B — from OptimizerResult (auto-converts):
//   <ExecutionPlanViewer fromResult={optimizerResult} />

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { OptimizerResult } from '@/lib/optimizer/types'
import {
  IconChevronDown,
  IconChevronRight,
  IconTable,
  IconAlignLeft,
  IconChartBar,
  IconClock,
  IconDatabase,
  IconBolt,
  IconArrowRight,
} from '@tabler/icons-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanNode {
  id: number
  parentId: number | null
  operation: string        // e.g. "HASH JOIN", "TABLE ACCESS FULL"
  options?: string         // e.g. "FULL", "BY INDEX ROWID BATCHED"
  objectName?: string      // table / index name
  objectType?: 'TABLE' | 'INDEX' | 'VIEW' | 'SUBQUERY'
  cost?: number
  estimatedRows?: number
  bytes?: number           // estimated bytes
  cpuCost?: number
  ioCost?: number
  timeSeconds?: number     // Oracle TIME column
  accessPredicates?: string
  filterPredicates?: string
  note?: string
}

export interface CallStat {
  name: 'Parse' | 'Execute' | 'Fetch' | string
  count: number
  cpuMs: number
  elapsedMs: number
  diskReads: number
  queryReads: number     // consistent gets
  currentReads: number   // current mode gets
  rowsProcessed: number
}

export interface WaitEvent {
  event: string
  waits: number
  timeoutCount: number
  totalWaitMs: number
  avgWaitMs: number
  maxWaitMs: number
}

export interface PlanStats {
  sql?: string
  sqlId?: string
  childNumber?: number
  optimizerMode?: 'ALL_ROWS' | 'FIRST_ROWS' | 'RULE' | string
  optimizerCost?: number
  optimizerRows?: number
  parseTime?: string
  callStats?: CallStat[]
  waitEvents?: WaitEvent[]
  predInfo?: string[]
  note?: string[]
}

export interface ExecutionPlanViewerProps {
  nodes?: PlanNode[]
  stats?: PlanStats
  fromResult?: OptimizerResult | null
  sql?: string
  defaultTab?: TabId
  tabs?: TabId[]          // 표시할 탭 목록. 생략 시 전체 표시
  compact?: boolean
  lang?: 'ko' | 'en'
  className?: string
}

type TabId = 'plan' | 'rowsource' | 'statistics'

// ── Convert OptimizerResult → PlanNode[] + PlanStats ─────────────────────────

function fromOptimizerResult(result: OptimizerResult): { nodes: PlanNode[]; stats: PlanStats } {
  const { plan, phases } = result
  const nodes: PlanNode[] = []
  let id = 1

  nodes.push({
    id: id++,
    parentId: null,
    operation: 'SELECT STATEMENT',
    cost: plan.totalCost,
    estimatedRows: plan.estimatedRows,
    optimizerMode: 'ALL_ROWS',
  } as PlanNode & { optimizerMode: string })

  if (plan.joinSteps.length > 0) {
    let parentId = 1
    for (let i = plan.joinSteps.length - 1; i >= 0; i--) {
      const j = plan.joinSteps[i]
      nodes.push({
        id: id++,
        parentId,
        operation: j.method.replace(/_/g, ' '),
        cost: j.cost,
        estimatedRows: j.outputCardinality,
        note: j.reason,
      })
      parentId = id - 1
    }
    const joinParentId = nodes[nodes.length - 1].id
    for (const ap of plan.tableAccessPlans) {
      const opParts = ap.chosen.type.replace(/_/g, ' ').split(' ')
      const options = opParts.slice(2).join(' ') || undefined
      const operation = opParts.slice(0, 2).join(' ')
      nodes.push({
        id: id++,
        parentId: joinParentId,
        operation,
        options,
        objectName: ap.tableName,
        objectType: ap.chosen.indexName ? 'INDEX' : 'TABLE',
        cost: ap.chosen.cost,
        estimatedRows: ap.chosen.cardinality,
        ioCost: ap.chosen.ioCost,
        cpuCost: ap.chosen.cpuCost,
        note: ap.chosen.reason,
      })
      if (ap.chosen.indexName) {
        nodes.push({
          id: id++,
          parentId: id - 2,
          operation: 'INDEX',
          options: ap.chosen.type.includes('UNIQUE') ? 'UNIQUE SCAN' : 'RANGE SCAN',
          objectName: ap.chosen.indexName,
          objectType: 'INDEX',
          cost: ap.chosen.ioCost,
          estimatedRows: ap.chosen.cardinality,
        })
      }
    }
  } else {
    for (const ap of plan.tableAccessPlans) {
      const opParts = ap.chosen.type.replace(/_/g, ' ').split(' ')
      const options = opParts.slice(2).join(' ') || undefined
      const operation = opParts.slice(0, 2).join(' ')
      nodes.push({
        id: id++,
        parentId: 1,
        operation,
        options,
        objectName: ap.tableName,
        objectType: ap.chosen.indexName ? 'INDEX' : 'TABLE',
        cost: ap.chosen.cost,
        estimatedRows: ap.chosen.cardinality,
        ioCost: ap.chosen.ioCost,
        cpuCost: ap.chosen.cpuCost,
        note: ap.chosen.reason,
      })
      if (ap.chosen.indexName) {
        nodes.push({
          id: id++,
          parentId: id - 2,
          operation: 'INDEX',
          options: ap.chosen.type.includes('UNIQUE') ? 'UNIQUE SCAN' : 'RANGE SCAN',
          objectName: ap.chosen.indexName,
          objectType: 'INDEX',
          cost: ap.chosen.ioCost,
          estimatedRows: ap.chosen.cardinality,
        })
      }
    }
  }

  const estCost = plan.totalCost
  const stats: PlanStats = {
    sql: plan.query.rawSQL,
    optimizerMode: 'ALL_ROWS',
    optimizerCost: estCost,
    optimizerRows: plan.estimatedRows,
    callStats: [
      { name: 'Parse',   count: 1, cpuMs: Math.round(estCost * 0.02),  elapsedMs: Math.round(estCost * 0.03),  diskReads: 0,  queryReads: 0,  currentReads: 0,  rowsProcessed: 0 },
      { name: 'Execute', count: 1, cpuMs: 0,                            elapsedMs: 0,                           diskReads: 0,  queryReads: 0,  currentReads: 0,  rowsProcessed: 0 },
      { name: 'Fetch',   count: Math.ceil(plan.estimatedRows / 100),    cpuMs: Math.round(estCost * 0.8),  elapsedMs: Math.round(estCost * 1.2),  diskReads: Math.round(estCost * 0.3),  queryReads: Math.round(plan.estimatedRows * 0.1),  currentReads: 0,  rowsProcessed: plan.estimatedRows },
    ],
    waitEvents: [
      { event: 'db file sequential read', waits: Math.round(estCost * 0.2), timeoutCount: 0, totalWaitMs: Math.round(estCost * 0.5), avgWaitMs: 3, maxWaitMs: 12 },
      { event: 'db file scattered read',  waits: Math.round(estCost * 0.1), timeoutCount: 0, totalWaitMs: Math.round(estCost * 0.3), avgWaitMs: 5, maxWaitMs: 18 },
    ],
    note: phases.flatMap((p) => p.details),
    predInfo: plan.query.predicates.map(
      (pred) => `access("${pred.table}"."${pred.column}" ${pred.operator} '${pred.value}')`
    ),
  }

  return { nodes, stats }
}

// ── Tree helpers ──────────────────────────────────────────────────────────────

function buildTree(nodes: PlanNode[]) {
  const map = new Map<number, PlanNode & { children: PlanNode[] }>()
  for (const n of nodes) map.set(n.id, { ...n, children: [] })
  const roots: Array<PlanNode & { children: PlanNode[] }> = []
  for (const n of nodes) {
    const node = map.get(n.id)!
    if (n.parentId === null) {
      roots.push(node)
    } else {
      map.get(n.parentId)?.children.push(node)
    }
  }
  return roots
}

// ── Operation color / icon ────────────────────────────────────────────────────

const OP_COLOR: Record<string, string> = {
  'SELECT STATEMENT':    'text-orange-600',
  'TABLE ACCESS':        'text-blue-600',
  'INDEX':               'text-violet-600',
  'HASH JOIN':           'text-orange-500',
  'NESTED LOOPS':        'text-sky-600',
  'SORT MERGE JOIN':     'text-amber-600',
  'SORT':                'text-amber-500',
  'HASH':                'text-teal-600',
  'MERGE JOIN':          'text-rose-500',
  'VIEW':                'text-emerald-600',
  'FILTER':              'text-slate-500',
  'UNION-ALL':           'text-indigo-500',
}

function opColor(operation: string) {
  for (const [key, cls] of Object.entries(OP_COLOR)) {
    if (operation.startsWith(key)) return cls
  }
  return 'text-foreground'
}

// ── Tab button ────────────────────────────────────────────────────────────────

function Tab({ id, active, onClick, children }: { id: TabId; active: boolean; onClick: (id: TabId) => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-4 py-2 font-mono text-[11px] font-bold transition-colors',
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

// ── Plan Tree tab ─────────────────────────────────────────────────────────────

type TreeNode = PlanNode & { children: TreeNode[] }

function PlanTreeNode({ node, depth, isLast }: { node: TreeNode; depth: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const colorCls = opColor(node.operation)

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.04 }}
        className={cn(
          'group flex items-start gap-1 rounded px-2 py-[3px] transition-colors hover:bg-muted/40',
        )}
        style={{ marginLeft: depth * 20 }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && setExpanded((v) => !v)}
          className={cn('mt-0.5 shrink-0', hasChildren ? 'cursor-pointer' : 'cursor-default opacity-0 pointer-events-none')}
        >
          {hasChildren
            ? expanded
              ? <IconChevronDown size={13} className="text-muted-foreground" />
              : <IconChevronRight size={13} className="text-muted-foreground" />
            : <span className="inline-block w-[13px]" />}
        </button>

        {/* Tree connector */}
        {depth > 0 && (
          <span className="mt-[5px] shrink-0 font-mono text-[10px] text-muted-foreground/40 select-none">
            {isLast ? '└─' : '├─'}
          </span>
        )}

        {/* Operation */}
        <span className={cn('shrink-0 font-mono text-[11px] font-bold', colorCls)}>
          {node.operation}
        </span>
        {node.options && (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{node.options}</span>
        )}
        {node.objectName && (
          <span className={cn(
            'shrink-0 rounded px-1 font-mono text-[10px] font-semibold',
            node.objectType === 'INDEX'
              ? 'bg-violet-100 text-violet-700'
              : node.objectType === 'VIEW'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-blue-100 text-blue-700'
          )}>
            {node.objectName}
          </span>
        )}

        {/* Metrics */}
        <div className="ml-auto flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
          {node.cost !== undefined && (
            <span className="font-mono text-[10px] text-muted-foreground">
              cost=<span className="font-bold text-orange-600">{node.cost.toFixed(1)}</span>
            </span>
          )}
          {node.estimatedRows !== undefined && (
            <span className="font-mono text-[10px] text-muted-foreground">
              rows=<span className="font-bold text-blue-600">{node.estimatedRows}</span>
            </span>
          )}
          {node.bytes !== undefined && (
            <span className="font-mono text-[10px] text-muted-foreground">
              bytes=<span className="font-bold">{node.bytes}</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* Predicates / note inline */}
      {(node.accessPredicates || node.filterPredicates || node.note) && (
        <div style={{ marginLeft: (depth + 1) * 20 + 14 }} className="mb-0.5 space-y-0.5">
          {node.accessPredicates && (
            <div className="font-mono text-[10px] text-violet-600">
              <span className="font-bold">access</span>({node.accessPredicates})
            </div>
          )}
          {node.filterPredicates && (
            <div className="font-mono text-[10px] text-amber-600">
              <span className="font-bold">filter</span>({node.filterPredicates})
            </div>
          )}
          {node.note && (
            <div className="font-mono text-[10px] text-muted-foreground italic">{node.note}</div>
          )}
        </div>
      )}

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child, i) => (
              <PlanTreeNode
                key={child.id}
                node={child as TreeNode}
                depth={depth + 1}
                isLast={i === node.children.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlanTreeTab({ nodes, stats, compact }: { nodes: PlanNode[]; stats?: PlanStats; compact: boolean }) {
  const roots = buildTree(nodes) as TreeNode[]

  return (
    <div className="space-y-3">
      {/* SQL header */}
      {stats?.sql && (
        <div className="rounded-lg border bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">SQL: </span>{stats.sql}
        </div>
      )}

      {/* Plan header row (mimics DBMS_XPLAN columns) */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        {/* Column headers */}
        <div className="flex items-center border-b bg-muted/50 px-3 py-1.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Execution Plan
          </span>
          {stats?.optimizerMode && (
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              Optimizer: <span className="font-bold text-orange-600">{stats.optimizerMode}</span>
              {stats.optimizerCost !== undefined && (
                <> · Cost=<span className="font-bold text-orange-600">{stats.optimizerCost.toFixed(1)}</span></>
              )}
              {stats.optimizerRows !== undefined && (
                <> · Rows=<span className="font-bold text-blue-600">{stats.optimizerRows}</span></>
              )}
            </span>
          )}
        </div>

        {!compact && (
          <div className="grid grid-cols-[1fr_60px_60px_60px] border-b bg-muted/20 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <div>Operation</div>
            <div className="text-right">Cost</div>
            <div className="text-right">Rows</div>
            <div className="text-right">Bytes</div>
          </div>
        )}

        {/* Tree rows */}
        <div className={cn('py-1', compact ? 'px-2' : 'px-2')}>
          {roots.map((root, i) => (
            <PlanTreeNode key={root.id} node={root} depth={0} isLast={i === roots.length - 1} />
          ))}
        </div>

        {/* Metrics legend (hover hint) */}
        <div className="border-t bg-muted/20 px-3 py-1.5 font-mono text-[9px] text-muted-foreground">
          Hover over a row to see metrics · Click ▾ to collapse children
        </div>
      </div>

      {/* Predicate Information */}
      {stats?.predInfo && stats.predInfo.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b bg-muted/50 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Predicate Information (identified by operation id)
          </div>
          <div className="space-y-0.5 p-3">
            {stats.predInfo.map((line, i) => (
              <div key={i} className="font-mono text-[11px] text-muted-foreground">
                <span className="text-violet-600 font-bold">{i + 1}</span>
                <span className="mx-2 text-muted-foreground/40">-</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {stats?.note && stats.note.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40">
          <div className="border-b border-amber-200 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-700">
            Note
          </div>
          <div className="space-y-0.5 p-3">
            {stats.note.map((n, i) => (
              <div key={i} className="flex items-start gap-1.5 font-mono text-[11px] text-amber-700">
                <span className="mt-0.5 shrink-0">›</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Row Source Operations tab ─────────────────────────────────────────────────

function RowSourceTab({ nodes, stats }: { nodes: PlanNode[]; stats?: PlanStats }) {
  const roots = buildTree(nodes) as TreeNode[]
  const flat: Array<{ node: TreeNode; depth: number }> = []

  function flatten(n: TreeNode, d: number) {
    flat.push({ node: n, depth: d })
    for (const c of n.children) flatten(c as TreeNode, d + 1)
  }
  for (const r of roots) flatten(r, 0)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="border-b bg-muted/50 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Row Source Operations
        </div>
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-3 py-1.5 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-blue-600">Rows</th>
              <th className="px-3 py-1.5 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">ID</th>
              <th className="px-3 py-1.5 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Operation</th>
              <th className="px-3 py-1.5 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Bytes</th>
              <th className="px-3 py-1.5 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Cost (%CPU)</th>
              <th className="px-3 py-1.5 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {flat.map(({ node, depth }, i) => (
              <tr key={node.id} className={cn('border-b border-border/50 transition-colors hover:bg-muted/30', i % 2 === 1 && 'bg-muted/10')}>
                <td className="px-3 py-1.5 text-right font-mono text-[11px] font-bold text-blue-600">
                  {node.estimatedRows?.toLocaleString() ?? '—'}
                </td>
                <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">{node.id}</td>
                <td className="px-3 py-1.5">
                  <span className="font-mono text-[11px]" style={{ paddingLeft: depth * 14 }}>
                    <span className={cn('font-bold', opColor(node.operation))}>{node.operation}</span>
                    {node.options && <span className="text-muted-foreground"> {node.options}</span>}
                    {node.objectName && (
                      <span className={cn(
                        'ml-1.5 rounded px-1 text-[9px] font-semibold',
                        node.objectType === 'INDEX' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      )}>{node.objectName}</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-[11px] text-muted-foreground">
                  {node.bytes ? `${(node.bytes / 1024).toFixed(0)}K` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-[11px] font-bold text-orange-600">
                  {node.cost !== undefined
                    ? <>
                        {node.cost.toFixed(0)}
                        {node.cpuCost !== undefined && node.cost > 0 && (
                          <span className="text-muted-foreground font-normal">
                            {' '}({Math.round((node.cpuCost / node.cost) * 100)}%)
                          </span>
                        )}
                      </>
                    : '—'}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-[11px] text-muted-foreground">
                  {node.timeSeconds !== undefined ? `${node.timeSeconds}s` : '00:00:01'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Access / Filter predicates per node */}
      {flat.some(({ node }) => node.accessPredicates || node.filterPredicates) && (
        <div className="rounded-xl border bg-card">
          <div className="border-b bg-muted/50 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Predicate Information
          </div>
          <div className="space-y-1 p-3">
            {flat.map(({ node }) =>
              (node.accessPredicates || node.filterPredicates) ? (
                <div key={node.id} className="text-[11px]">
                  <span className="font-mono text-muted-foreground">{node.id} -</span>
                  {node.accessPredicates && (
                    <span className="ml-2 font-mono">
                      <span className="font-bold text-violet-600">access</span>
                      <span className="text-muted-foreground">({node.accessPredicates})</span>
                    </span>
                  )}
                  {node.filterPredicates && (
                    <span className="ml-2 font-mono">
                      <span className="font-bold text-amber-600">filter</span>
                      <span className="text-muted-foreground">({node.filterPredicates})</span>
                    </span>
                  )}
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* SQL ID / metadata */}
      {(stats?.sqlId || stats?.childNumber !== undefined) && (
        <div className="rounded-xl border bg-card px-4 py-3 font-mono text-[11px] text-muted-foreground space-y-0.5">
          {stats.sqlId && <div>SQL ID: <span className="font-bold text-foreground">{stats.sqlId}</span></div>}
          {stats.childNumber !== undefined && <div>Child Number: <span className="font-bold text-foreground">{stats.childNumber}</span></div>}
          {stats.parseTime && <div>Parse Time: <span className="font-bold text-foreground">{stats.parseTime}</span></div>}
        </div>
      )}
    </div>
  )
}

// ── Statistics tab ────────────────────────────────────────────────────────────

function StatisticsTab({ stats }: { stats?: PlanStats }) {
  if (!stats?.callStats && !stats?.waitEvents) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground font-mono">
        No statistics data provided
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Call Statistics */}
      {stats.callStats && stats.callStats.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
            <IconClock size={13} className="text-muted-foreground" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Call Statistics
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/20">
                  {['Call', 'Count', 'CPU (ms)', 'Elapsed (ms)', 'Disk Reads', 'Buffer Gets', 'Rows'].map((h) => (
                    <th key={h} className="px-3 py-1.5 text-right first:text-left font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.callStats.map((row, i) => (
                  <tr key={row.name} className={cn('border-b border-border/50 hover:bg-muted/30', i % 2 === 1 && 'bg-muted/10')}>
                    <td className="px-3 py-1.5 font-mono text-[11px] font-bold text-foreground">{row.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px] text-muted-foreground">{row.count}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px] text-sky-600 font-bold">{row.cpuMs.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px] text-blue-600 font-bold">{row.elapsedMs.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px] text-orange-600">{row.diskReads}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px] text-muted-foreground">
                      {row.queryReads + row.currentReads}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px] font-bold text-emerald-600">{row.rowsProcessed}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t-2 bg-muted/30 font-bold">
                  <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground uppercase">Total</td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px]">
                    {stats.callStats.reduce((s, r) => s + r.count, 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px] text-sky-600">
                    {stats.callStats.reduce((s, r) => s + r.cpuMs, 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px] text-blue-600">
                    {stats.callStats.reduce((s, r) => s + r.elapsedMs, 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px] text-orange-600">
                    {stats.callStats.reduce((s, r) => s + r.diskReads, 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px]">
                    {stats.callStats.reduce((s, r) => s + r.queryReads + r.currentReads, 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[11px] text-emerald-600">
                    {stats.callStats.reduce((s, r) => s + r.rowsProcessed, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wait Events */}
      {stats.waitEvents && stats.waitEvents.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
            <IconBolt size={13} className="text-muted-foreground" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Wait Events
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b bg-muted/20">
                  {['Event', 'Waits', 'Timeouts', 'Total (ms)', 'Avg (ms)', 'Max (ms)'].map((h) => (
                    <th key={h} className="px-3 py-1.5 text-right first:text-left font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.waitEvents.map((ev, i) => {
                  const maxTotal = Math.max(...stats.waitEvents!.map((e) => e.totalWaitMs))
                  const pct = maxTotal > 0 ? (ev.totalWaitMs / maxTotal) * 100 : 0
                  return (
                    <tr key={ev.event} className={cn('border-b border-border/50 hover:bg-muted/30', i % 2 === 1 && 'bg-muted/10')}>
                      <td className="px-3 py-2">
                        <div className="font-mono text-[11px] font-semibold text-foreground">{ev.event}</div>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-muted-foreground">{ev.waits}</td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-muted-foreground">{ev.timeoutCount}</td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] font-bold text-orange-600">{ev.totalWaitMs.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-muted-foreground">{ev.avgWaitMs.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-muted-foreground">{ev.maxWaitMs.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Buffer I/O summary cards */}
      {stats.callStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Disk Reads',    value: stats.callStats.reduce((s, r) => s + r.diskReads, 0),    icon: <IconDatabase size={14} />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { label: 'Buffer Gets',   value: stats.callStats.reduce((s, r) => s + r.queryReads + r.currentReads, 0), icon: <IconBolt size={14} />, color: 'text-sky-600 bg-sky-50 border-sky-200' },
            { label: 'Rows Returned', value: stats.callStats.reduce((s, r) => s + r.rowsProcessed, 0), icon: <IconTable size={14} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'Elapsed (ms)',  value: stats.callStats.reduce((s, r) => s + r.elapsedMs, 0).toFixed(2), icon: <IconClock size={14} />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          ].map((card) => (
            <div key={card.label} className={cn('rounded-xl border px-4 py-3', card.color)}>
              <div className="flex items-center gap-1.5 mb-1 opacity-70">{card.icon}
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest">{card.label}</span>
              </div>
              <div className="font-mono text-lg font-black">{card.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TAB_LABELS: Record<TabId, { ko: string; en: string; icon: React.ReactNode }> = {
  plan:       { ko: '실행 계획', en: 'Execution Plan', icon: <IconAlignLeft size={13} /> },
  rowsource:  { ko: 'Row Source',  en: 'Row Source',   icon: <IconArrowRight size={13} /> },
  statistics: { ko: '통계',        en: 'Statistics',   icon: <IconChartBar size={13} /> },
}

export function ExecutionPlanViewer({
  nodes: nodesProp,
  stats: statsProp,
  fromResult,
  sql,
  defaultTab = 'plan',
  tabs,
  compact = false,
  lang = 'ko',
  className,
}: ExecutionPlanViewerProps) {
  const visibleTabs = tabs ?? (Object.keys(TAB_LABELS) as TabId[])
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  const { nodes, stats } = (() => {
    if (fromResult) {
      const converted = fromOptimizerResult(fromResult)
      return {
        nodes: converted.nodes,
        stats: { ...converted.stats, sql: sql ?? converted.stats.sql },
      }
    }
    return { nodes: nodesProp ?? [], stats: sql ? { ...statsProp, sql } : statsProp }
  })()

  if (nodes.length === 0 && !fromResult) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border bg-muted/20 font-mono text-xs text-muted-foreground">
        No execution plan data
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border bg-background', className)}>
      {/* Tab bar */}
      <div className="flex items-center border-b bg-muted/20 px-2">
        {visibleTabs.map((id) => (
          <Tab key={id} id={id} active={activeTab === id} onClick={setActiveTab}>
            {TAB_LABELS[id].icon}
            {lang === 'ko' ? TAB_LABELS[id].ko : TAB_LABELS[id].en}
          </Tab>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <PlanTreeTab nodes={nodes} stats={stats} compact={compact} />
            </motion.div>
          )}
          {activeTab === 'rowsource' && (
            <motion.div key="rs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <RowSourceTab nodes={nodes} stats={stats} />
            </motion.div>
          )}
          {activeTab === 'statistics' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <StatisticsTab stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
