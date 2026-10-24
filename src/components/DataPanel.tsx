import type { Schema, SchemaTable } from '@/data/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function ColumnKeyBadge({ isPrimaryKey, isForeignKey }: { isPrimaryKey?: boolean; isForeignKey?: boolean }) {
  if (isPrimaryKey && isForeignKey) return <Badge variant="outline" className="h-4 border-purple-300 px-1 text-[8px] text-purple-700">PK/FK</Badge>
  if (isPrimaryKey) return <Badge variant="outline" className="h-4 border-amber-300 px-1 text-[8px] text-amber-700">PK</Badge>
  if (isForeignKey) return <Badge variant="outline" className="h-4 border-blue-300 px-1 text-[8px] text-blue-700">FK</Badge>
  return null
}

export function SchemaView({ schema }: { schema: Schema }) {
  return (
    <div className="space-y-2.5 p-3">
      {schema.tables.map((table) => (
        <div
          key={table.name}
          className="overflow-hidden rounded-lg border bg-card shadow-xs"
        >
          {/* Table header */}
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
            <span className="font-mono text-xs font-bold text-foreground">{table.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{table.description}</span>
          </div>

          {/* Columns */}
          <div>
            {table.columns.map((col) => (
              <div key={col.name} className="flex items-center gap-2 border-b px-3 py-[4px] last:border-b-0">
                <span className="w-9 shrink-0 font-mono text-[9px] font-bold">
                  <ColumnKeyBadge isPrimaryKey={col.isPrimaryKey} isForeignKey={col.isForeignKey} />
                </span>
                <span className="flex-1 font-mono text-[11px] text-foreground">{col.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{col.type}</span>
                {!col.nullable && (
                  <Badge variant="outline" className="h-4 border-red-200 px-1 text-[8px] text-red-600">NN</Badge>
                )}
              </div>
            ))}
          </div>

          {/* FK relationships */}
          {table.foreignKeys.length > 0 && (
            <div className="border-t bg-muted/30 px-3 py-1.5">
              {table.foreignKeys.map((fk, i) => (
                <div key={i} className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="text-blue-600">{fk.column}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground">{fk.refTable}.{fk.refColumn}</span>
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
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">{table.schema}.{table.name}</span>
          <span className="text-[10px] text-muted-foreground">{table.description}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {table.columns.map((col) => (
            <Badge
              key={col.name}
              variant="outline"
              className={cn(
                'h-5 font-mono text-[10px]',
                col.isPrimaryKey ? 'border-amber-300 text-amber-700' :
                col.isForeignKey ? 'border-blue-300 text-blue-700' :
                'text-muted-foreground'
              )}
            >
              {col.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Table data */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-muted/80 shadow-[0_1px_0] shadow-border">
            <tr>
              {table.columns.map((col) => (
                <th
                  key={col.name}
                  className={cn(
                    'whitespace-nowrap border-r px-3 py-2 text-left font-mono font-semibold last:border-r-0',
                    col.isPrimaryKey ? 'text-amber-700' :
                    col.isForeignKey ? 'text-blue-700' :
                    'text-muted-foreground'
                  )}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr
                key={i}
                className="border-b transition-colors hover:bg-muted/40"
              >
                {table.columns.map((col) => (
                  <td key={col.name} className="whitespace-nowrap border-r px-3 py-1.5 font-mono last:border-r-0">
                    {row[col.name] === null ? (
                      <span className="italic text-muted-foreground">NULL</span>
                    ) : (
                      <span className={cn(
                        col.isPrimaryKey ? 'text-amber-700' :
                        col.isForeignKey ? 'text-blue-700' :
                        'text-foreground'
                      )}>
                        {String(row[col.name])}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t bg-muted/50 px-4 py-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          {table.rows.length} rows · {table.columns.length} cols{table.foreignKeys.length > 0 && ` · ${table.foreignKeys.length} FK`}
        </span>
      </div>
    </div>
  )
}
