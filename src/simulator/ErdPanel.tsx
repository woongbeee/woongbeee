// ─── Schema / ERD 탭 ──────────────────────────────────────────────────────
// 시뮬레이터에서 쓸 수 있는 HR · CO 스키마의 구조와 샘플 데이터를 보여 준다.

import { useState, useRef } from 'react'
import { useLangStore } from '@/store/simulationStore'
import { SchemaDiagramView } from '@/components/SchemaDiagram'
import { SchemaView, TableView } from '@/components/DataPanel'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'
import { cn } from '@/lib/utils'

const T = {
  ko: { pickTable: '위에서 테이블을 골라 주세요' },
  en: { pickTable: 'Select a table above' },
}

const TAB = 'border-b-2 font-mono transition-colors'
const tabCls = (active: boolean) =>
  active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'

// ── ErdPanel ───────────────────────────────────────────────────────────────

type ErdLeftView = 'schema' | 'data'

export function ErdPanel() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const [selectedSchema, setSelectedSchema] = useState(SCHEMAS[0])
  const [leftView, setLeftView] = useState<ErdLeftView>('schema')
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null)
  const [panelWidth, setPanelWidth] = useState(288)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleSchemaChange = (s: typeof SCHEMAS[0]) => {
    setSelectedSchema(s)
    setSelectedTable(null)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setPanelWidth(Math.min(520, Math.max(180, startWidth.current + e.clientX - startX.current)))
    }
    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex shrink-0 flex-col overflow-hidden bg-paper" style={{ width: panelWidth }}>
        {/* Schema tabs */}
        <div className="flex shrink-0 border-b border-line-2 bg-rail">
          {SCHEMAS.map((s) => (
            <button
              key={s.name}
              onClick={() => handleSchemaChange(s)}
              className={cn(TAB, 'flex-1 py-2 text-xs font-semibold', tabCls(selectedSchema.name === s.name))}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* View toggle: Schema / Data */}
        <div className="flex shrink-0 border-b border-line">
          {(['schema', 'data'] as ErdLeftView[]).map((v) => (
            <button
              key={v}
              onClick={() => setLeftView(v)}
              className={cn(TAB, 'flex-1 py-1.5 text-[11px] font-medium', tabCls(leftView === v))}
            >
              {v === 'schema' ? 'Schema' : 'Table Data'}
            </button>
          ))}
        </div>

        {/* Table picker (only in Data view) */}
        {leftView === 'data' && (
          <div className="flex shrink-0 flex-wrap gap-1 border-b border-line bg-rail px-3 py-2">
            {selectedSchema.tables.map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTable(tbl)}
                className={cn(
                  'rounded-chip border px-2 py-0.5 font-mono text-[10px] transition-colors',
                  selectedTable?.name === tbl.name
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-paper text-ink-2 hover:border-line-2 hover:text-ink'
                )}
              >
                {tbl.name}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {leftView === 'schema' && <SchemaView schema={selectedSchema} />}
          {leftView === 'data' && selectedTable && <TableView table={selectedTable} />}
          {leftView === 'data' && !selectedTable && (
            <div className="flex h-full items-center justify-center font-sans text-xs text-ink-3">
              {t.pickTable}
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-line transition-colors hover:bg-blue active:bg-blue"
      >
        <div className="absolute h-8 w-3 rounded-full bg-line-2 transition-colors group-hover:bg-blue" />
      </div>

      {/* ERD diagram */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {/* key: useNodesState 는 초기값만 쓰므로 스키마가 바뀌면 다시 마운트 */}
        <SchemaDiagramView key={selectedSchema.name} lockedSchema={selectedSchema.name} onSchemaChange={handleSchemaChange} />
      </div>
    </div>
  )
}
