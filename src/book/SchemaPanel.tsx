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

const pickBtn = (active: boolean) =>
  cn(
    'rounded-chip border px-2 py-0.5 font-mono text-[10px] transition-colors',
    active
      ? 'border-ink bg-ink text-paper'
      : 'border-line text-ink-2 hover:border-ink-3 hover:text-ink',
  )

const SchemaTab = memo(function SchemaTab({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <button
      onClick={onToggle}
      title={open ? t.closeTitle : t.openTitle}
      className={cn(
        'flex w-7 shrink-0 flex-col items-center justify-center gap-1.5 border-l border-line transition-colors duration-150',
        open
          ? 'bg-ink/[0.06] text-ink'
          : 'bg-rail text-ink-3 hover:bg-ink/[0.04] hover:text-ink',
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
        className="select-none font-mono text-[9px] font-semibold uppercase tracking-widest"
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
            className="overflow-hidden border-l border-line bg-rail"
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
      {/* Header: schema selector — mono chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-rail px-3 py-2">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink-3">
          Schema
        </span>
        <div className="ml-auto flex gap-1">
          {SCHEMAS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => { setSelectedSchemaIdx(i); setSelectedTable(null); setViewMode('schema') }}
              className={pickBtn(selectedSchemaIdx === i)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex shrink-0 border-b border-line">
        {(['schema', 'table'] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => { setViewMode(v); if (v === 'schema') setSelectedTable(null) }}
            className={cn(
              'flex-1 border-b-2 py-1.5 font-mono text-[10px] font-medium transition-colors',
              viewMode === v
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {v === 'schema' ? 'Schema' : 'Table Data'}
          </button>
        ))}
      </div>

      {/* Table picker (table mode only) */}
      {viewMode === 'table' && (
        <div className="flex shrink-0 flex-wrap gap-1 border-b border-line bg-ink/[0.03] px-3 py-2">
          {schema.tables.map((tbl) => (
            <button
              key={tbl.name}
              onClick={() => setSelectedTable(tbl)}
              className={pickBtn(selectedTable?.name === tbl.name)}
            >
              {tbl.name}
            </button>
          ))}
        </div>
      )}

      {/* Content — pinned light until data views migrate (Phase 3) */}
      <div data-theme="light" className="min-h-0 flex-1 overflow-y-auto bg-paper-sunk text-ink">
        {viewMode === 'schema' && <SchemaView schema={schema} />}
        {viewMode === 'table' && selectedTable && <TableView table={selectedTable} />}
        {viewMode === 'table' && !selectedTable && (
          <div className="flex h-full items-center justify-center font-mono text-[11px] text-ink-3/60">
            {t.noTable}
          </div>
        )}
      </div>
    </div>
  )
}
