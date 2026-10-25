import { useMemo, useState } from 'react'
import type { Node, Edge, NodeProps } from '@xyflow/react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'
import { DIAGRAM } from '@/lib/theme'
import { cn } from '@/lib/utils'

// ─── Custom Table Node ─────────────────────────────────────────────────────
// 색은 토큰만: 노드 = Tailwind 토큰 클래스, React Flow prop(SVG) = @/lib/theme 의 DIAGRAM.
// 스키마 색(SCHEMAS[].color): HR = blue, CO = emerald. PK/FK 뱃지는 ResultTable 규칙(PK=blue, FK=purple).

interface TableNodeData extends Record<string, unknown> {
  table: SchemaTable
  schemaColor: string
}

const SCHEMA_HUE: Record<string, { head: string; border: string; minimap: string }> = {
  blue:  { head: 'bg-viz-blue/10 text-viz-blue',   border: 'border-viz-blue/40',  minimap: 'var(--color-viz-blue)' },
  emerald: { head: 'bg-viz-green/10 text-viz-green', border: 'border-viz-green/40', minimap: 'var(--color-viz-green)' },
}
const schemaHue = (color: string) => SCHEMA_HUE[color] ?? SCHEMA_HUE.blue

const HANDLE_STYLE = { background: DIAGRAM.ink3, borderColor: DIAGRAM.paper, opacity: 0.8 }
const HANDLES = [
  [Position.Left, 'l'], [Position.Right, 'r'], [Position.Top, 't'], [Position.Bottom, 'b'],
] as const

const KEY_BADGE = 'rounded-[2px] px-1 py-px text-[8.5px] font-bold'

function TableNode({ data }: NodeProps) {
  const { table, schemaColor } = data as TableNodeData
  const hue = schemaHue(schemaColor)

  return (
    <div className={cn('min-w-[210px] overflow-hidden rounded-card border bg-paper shadow-sm', hue.border)}>
      {HANDLES.map(([pos, k]) => [
        <Handle key={`${k}-t`} type="target" position={pos} id={`${k}-t`} style={HANDLE_STYLE} />,
        <Handle key={`${k}-s`} type="source" position={pos} id={`${k}-s`} style={HANDLE_STYLE} />,
      ])}

      {/* Table header */}
      <div className={cn('border-b px-3 py-1.5', hue.border, hue.head)}>
        <span className="font-mono text-[11px] font-bold tracking-wide">
          {table.schema}.{table.name}
        </span>
      </div>

      {/* Column rows */}
      <div>
        {table.columns.map((col) => (
          <div key={col.name} className="flex items-center gap-1.5 border-b border-line px-2.5 py-[3px] last:border-b-0">
            <span className="w-9 shrink-0 font-mono">
              {col.isPrimaryKey && col.isForeignKey ? (
                <span className={cn(KEY_BADGE, 'bg-purple/15 text-purple')}>PK·FK</span>
              ) : col.isPrimaryKey ? (
                <span className={cn(KEY_BADGE, 'bg-blue/15 text-blue')}>PK</span>
              ) : col.isForeignKey ? (
                <span className={cn(KEY_BADGE, 'bg-purple/15 text-purple')}>FK</span>
              ) : null}
            </span>
            <span className="flex-1 truncate font-mono text-[11px] text-ink">{col.name}</span>
            <span className="shrink-0 font-mono text-[9px] text-ink-3">{col.type.replace(/\(.+\)/, '')}</span>
            {!col.nullable && <span className="shrink-0 font-mono text-[9px] font-bold text-red">*</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const NODE_TYPES = { tableNode: TableNode }

// ─── Manual layouts per schema ────────────────────────────────────────────
//
// HR dependency chain:
//   REGIONS → COUNTRIES → LOCATIONS → DEPARTMENTS
//                                          ↕
//                              JOBS → EMPLOYEES → JOB_HISTORY
//
// CO dependency chain:
//   STORES ──┐
//   CUSTOMERS─┤→ ORDERS → ORDER_ITEMS
//   PRODUCTS ─┘

const C = 280  // column width
const R = 60   // row gap between nodes

function nodeHeight(colCount: number) {
  return colCount * 22 + 36
}

const MANUAL_LAYOUT: Record<string, Record<string, { x: number; y: number }>> = {
  HR: (() => {
    // Col 0: REGIONS
    // Col 1: COUNTRIES
    // Col 2: LOCATIONS
    // Col 3: DEPARTMENTS (top), JOBS (bottom)
    // Col 4: EMPLOYEES (center)
    // Col 5: JOB_HISTORY (bottom)
    const col = (n: number) => n * C
    return {
      REGIONS:     { x: col(0), y: 80 },
      COUNTRIES:   { x: col(1), y: 80 },
      LOCATIONS:   { x: col(2), y: 0 },
      JOBS:        { x: col(3), y: 420 },
      DEPARTMENTS: { x: col(3), y: 0 },
      EMPLOYEES:   { x: col(4), y: 160 },
      JOB_HISTORY: { x: col(5), y: 300 },
    }
  })(),
  CO: (() => {
    const col = (n: number) => n * C
    return {
      CUSTOMERS:   { x: col(0), y: 0 },
      STORES:      { x: col(0), y: 160 },
      PRODUCTS:    { x: col(0), y: 360 },
      ORDERS:      { x: col(1), y: 80 },
      ORDER_ITEMS: { x: col(2), y: 160 },
    }
  })(),
}

function getLayout(
  tables: SchemaTable[],
  schemaName: string,
): Record<string, { x: number; y: number }> {
  const manual = MANUAL_LAYOUT[schemaName]
  if (manual) return manual

  // Fallback: simple left-to-right by FK depth
  const depth: Record<string, number> = {}
  const visited = new Set<string>()
  const deps: Record<string, string[]> = {}
  for (const t of tables) {
    deps[t.name] = t.foreignKeys
      .filter((fk) => fk.refTable !== t.name)
      .map((fk) => fk.refTable)
  }
  function visit(name: string) {
    if (visited.has(name)) return
    visited.add(name)
    let max = -1
    for (const dep of deps[name] ?? []) {
      visit(dep)
      max = Math.max(max, depth[dep] ?? 0)
    }
    depth[name] = max + 1
  }
  for (const t of tables) visit(t.name)

  const cols: Record<number, string[]> = {}
  for (const [name, d] of Object.entries(depth)) (cols[d] ??= []).push(name)

  const positions: Record<string, { x: number; y: number }> = {}
  for (const [colStr, names] of Object.entries(cols)) {
    const col = Number(colStr)
    let y = 0
    for (const name of names) {
      positions[name] = { x: col * C, y }
      y += nodeHeight(tables.find((t) => t.name === name)?.columns.length ?? 4) + R
    }
  }
  return positions
}

// ─── SchemaDiagramView ────────────────────────────────────────────────────

interface SchemaDiagramViewProps {
  lockedSchema?: string
  onSchemaChange?: (schema: typeof SCHEMAS[0]) => void
}

export function SchemaDiagramView({ lockedSchema, onSchemaChange }: SchemaDiagramViewProps = {}) {
  const [schemaName, setSchemaName] = useState(lockedSchema ?? SCHEMAS[0].name)
  const effectiveName = lockedSchema ?? schemaName
  const schema = SCHEMAS.find((s) => s.name === effectiveName) ?? SCHEMAS[0]

  const handleSchemaChange = (name: string) => {
    setSchemaName(name)
    const s = SCHEMAS.find((s) => s.name === name)
    if (s && onSchemaChange) onSchemaChange(s)
  }

  const initialNodes: Node[] = useMemo(() => {
    const positions = getLayout(schema.tables, schema.name)
    return schema.tables.map((table) => ({
      id: table.name,
      type: 'tableNode',
      position: positions[table.name] ?? { x: 0, y: 0 },
      data: { table, schemaColor: schema.color } satisfies TableNodeData,
    }))
  }, [schema])

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []
    for (const table of schema.tables) {
      for (const fk of table.foreignKeys) {
        if (fk.refTable === table.name) continue // skip self-ref
        edges.push({
          id: `${table.name}.${fk.column}->${fk.refTable}.${fk.refColumn}`,
          source: table.name,
          target: fk.refTable,
          type: 'smoothstep',
          label: `${fk.column}`,
          labelStyle: { fill: DIAGRAM.purple, fontSize: 9, fontFamily: 'var(--font-mono)' },
          labelBgStyle: { fill: DIAGRAM.paper, fillOpacity: 0.95 },
          labelBgPadding: [4, 2] as [number, number],
          style: { stroke: DIAGRAM.purple, strokeWidth: 1.5, opacity: 0.85 },
          markerEnd: { type: 'arrowclosed' as const, color: DIAGRAM.purple, width: 12, height: 12 },
        })
      }
    }
    return edges
  }, [schema])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line-2 bg-rail px-4 py-1.5 font-mono text-[10.5px] text-ink-2">
        <span className="font-medium text-ink">Schema ERD</span>
        {!lockedSchema && (
          <div className="flex gap-1">
            {SCHEMAS.map((s) => {
              const active = schema.name === s.name
              return (
                <button
                  key={s.name}
                  onClick={() => handleSchemaChange(s.name)}
                  className={cn(
                    'rounded-chip border px-3 py-1 font-mono text-xs font-medium transition-all',
                    active
                      ? cn(schemaHue(s.color).border, schemaHue(s.color).head)
                      : 'border-transparent text-ink-3 hover:text-ink'
                  )}
                >
                  {s.name} — {s.label}
                </button>
              )
            })}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span>{schema.tables.length} tables</span>
          <span>{initialEdges.length} FK relations</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-5 bg-purple" />
            <span className="text-purple">FK reference</span>
          </span>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 bg-paper-sunk">
        <ReactFlow
          key={schemaName}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={2}
          colorMode="light"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={DIAGRAM.line2} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => schemaHue((n.data as TableNodeData).schemaColor).minimap}
            maskColor="rgba(128,128,128,0.15)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
