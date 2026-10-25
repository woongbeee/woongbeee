import type { Schema, SchemaTable } from '@/data/types'
import { ResultTable, type ResultColumn } from '@/book/chapters/shared'
import { cn } from '@/lib/utils'

// PK/FK 뱃지 — ResultTable 헤더 뱃지와 같은 색 규칙 (PK=blue, FK=purple)
const KEY_BADGE = 'rounded-[2px] px-1 py-px font-mono text-[8.5px] font-bold'

function ColumnKeyBadge({ isPrimaryKey, isForeignKey }: { isPrimaryKey?: boolean; isForeignKey?: boolean }) {
  if (isPrimaryKey && isForeignKey) return <span className={cn(KEY_BADGE, 'bg-purple/15 text-purple')}>PK/FK</span>
  if (isPrimaryKey) return <span className={cn(KEY_BADGE, 'bg-blue/15 text-blue')}>PK</span>
  if (isForeignKey) return <span className={cn(KEY_BADGE, 'bg-purple/15 text-purple')}>FK</span>
  return null
}

export function SchemaView({ schema }: { schema: Schema }) {
  return (
    <div className="space-y-2.5 p-3">
      {schema.tables.map((table) => (
        <div key={table.name} className="overflow-hidden rounded-card border border-line-2 bg-paper">
          {/* Table header */}
          <div className="flex items-center gap-2 border-b border-line-2 bg-rail px-3 py-2">
            <span className="font-mono text-xs font-bold text-ink">{table.name}</span>
            <span className="ml-auto truncate font-sans text-[10px] text-ink-2">{table.description}</span>
          </div>

          {/* Columns */}
          <div>
            {table.columns.map((col) => (
              <div key={col.name} className="flex items-center gap-2 border-b border-line px-3 py-[4px] last:border-b-0">
                <span className="w-9 shrink-0">
                  <ColumnKeyBadge isPrimaryKey={col.isPrimaryKey} isForeignKey={col.isForeignKey} />
                </span>
                <span className="flex-1 font-mono text-[11px] text-ink">{col.name}</span>
                <span className="font-mono text-[10px] text-ink-3">{col.type}</span>
                {!col.nullable && <span className={cn(KEY_BADGE, 'bg-red/15 text-red')}>NN</span>}
              </div>
            ))}
          </div>

          {/* FK relationships */}
          {table.foreignKeys.length > 0 && (
            <div className="border-t border-line bg-rail px-3 py-1.5">
              {table.foreignKeys.map((fk, i) => (
                <div key={i} className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="text-purple">{fk.column}</span>
                  <span className="text-ink-3">→</span>
                  <span className="text-ink">{fk.refTable}.{fk.refColumn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function TableView({ table }: { table: SchemaTable }) {
  const columns: ResultColumn[] = table.columns.map((col) => ({
    label: col.name,
    badge: col.isPrimaryKey ? 'PK' : col.isForeignKey ? 'FK' : undefined,
    type: col.type,
  }))
  const rows = table.rows.map((row) => table.columns.map((col) => row[col.name] ?? null))

  return (
    <div className="p-3">
      <ResultTable
        title={`${table.schema}.${table.name}`}
        meta={[table.description]}
        columns={columns}
        rows={rows}
        footer={[
          `${table.rows.length} rows · ${table.columns.length} cols${table.foreignKeys.length > 0 ? ` · ${table.foreignKeys.length} FK` : ''}`,
        ]}
      />
    </div>
  )
}
