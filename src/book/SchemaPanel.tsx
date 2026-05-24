import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'
import { SchemaView, TableView } from '@/components/DataPanel'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onToggle: () => void
}

const T = {
  ko: { tabLabel: '스키마', openTitle: '스키마 패널 열기', closeTitle: '스키마 패널 닫기', noTable: '위에서 테이블을 선택하세요' },
  en: { tabLabel: 'Schema', openTitle: 'Open Schema Panel', closeTitle: 'Close Schema Panel', noTable: 'Select a table above' },
} as const

const SchemaTab = memo(function SchemaTab({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <button
      onClick={onToggle}
      title={open ? t.closeTitle : t.openTitle}
      className={cn(
        'flex w-7 shrink-0 flex-col items-center justify-center gap-1.5 border-l transition-colors duration-150',
        open
          ? 'bg-muted/80 text-foreground'
          : 'bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <motion.span
        animate={{ rotate: open ? 0 : 180 }}
        transition={{ duration: 0.2 }}
        className="text-[11px] leading-none"
      >
        ›
      </motion.span>
      <span
        className="select-none font-mono text-[9px] font-bold uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {t.tabLabel}
      </span>
    </button>
  )
})

export function SchemaPanel({ open, onToggle }: Props) {
  return (
    <div className="flex shrink-0 overflow-hidden">
      <SchemaTab open={open} onToggle={onToggle} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="schema-body"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-l bg-card"
          >
            <SchemaPanelBody />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type ViewMode = 'schema' | 'table'

function SchemaPanelBody() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [selectedSchemaIdx, setSelectedSchemaIdx] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('schema')
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null)

  const schema = SCHEMAS[selectedSchemaIdx]

  return (
    <div className="flex h-full w-[340px] flex-col">
      {/* Header: schema selector */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Schema
        </span>
        <div className="ml-auto flex gap-1">
          {SCHEMAS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => { setSelectedSchemaIdx(i); setSelectedTable(null); setViewMode('schema') }}
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[10px] transition-colors',
                selectedSchemaIdx === i
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex shrink-0 border-b">
        {(['schema', 'table'] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => { setViewMode(v); if (v === 'schema') setSelectedTable(null) }}
            className={cn(
              'flex-1 py-1.5 font-mono text-[10px] font-medium transition-colors',
              viewMode === v
                ? 'border-b-2 border-foreground text-foreground'
                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {v === 'schema' ? 'Schema' : 'Table Data'}
          </button>
        ))}
      </div>

      {/* Table picker (table mode only) */}
      {viewMode === 'table' && (
        <div className="flex shrink-0 flex-wrap gap-1 border-b bg-muted/30 px-3 py-2">
          {schema.tables.map((tbl) => (
            <button
              key={tbl.name}
              onClick={() => setSelectedTable(tbl)}
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[10px] transition-colors',
                selectedTable?.name === tbl.name
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
              )}
            >
              {tbl.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === 'schema' && <SchemaView schema={schema} />}
        {viewMode === 'table' && selectedTable && <TableView table={selectedTable} />}
        {viewMode === 'table' && !selectedTable && (
          <div className="flex h-full items-center justify-center font-mono text-[11px] text-muted-foreground/50">
            {t.noTable}
          </div>
        )}
      </div>
    </div>
  )
}
