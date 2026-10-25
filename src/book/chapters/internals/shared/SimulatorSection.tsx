import { useState, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconSettings, IconSchema } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import { useInternalsStore } from '@/store/internalsStore'
import { OracleDiagram } from '@/components/OracleDiagram'
import { QueryInput, LiveLog, SummaryTimeline } from '@/components/QueryInput'
import { OptimizerPanel } from '@/components/OptimizerPanel'
import { SchemaDiagramView } from '@/components/SchemaDiagram'
import { SchemaView, TableView } from '@/components/DataPanel'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'
import { cn } from '@/lib/utils'

// ── Translation strings ────────────────────────────────────────────────────

const T = {
  ko: {
    simTitle: 'Internals Simulator',
    simDesc: 'SQL을 입력하고 Oracle 인스턴스 내부에서 어떤 컴포넌트가 어떻게 활성화되는지 직접 확인해보세요.',
    execSummary: '처리 요약',
    liveLog: '실시간 로그',
    pickTable: '위에서 테이블을 골라 주세요',
  },
  en: {
    simTitle: 'Internals Simulator',
    simDesc: 'Enter a SQL query and watch which Oracle instance components activate and how.',
    execSummary: 'Execution Summary',
    liveLog: 'Live Log',
    pickTable: 'Select a table above',
  },
}

// ── Shared chrome ──────────────────────────────────────────────────────────
// 패널 헤더·탭은 ResultTable 툴바(bg-rail · border-line-2 · mono 10.5px)와 같은 톤.

function PaneHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line-2 bg-rail px-3 py-1.5 font-mono text-[10.5px] text-ink-2">
      {children}
    </div>
  )
}

const TAB = 'border-b-2 font-mono transition-colors'
const tabCls = (active: boolean) =>
  active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'

// ── ErdPanel ───────────────────────────────────────────────────────────────

type ErdLeftView = 'schema' | 'data'

function ErdPanel() {
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

// ── InternalsSimulatorSection ──────────────────────────────────────────────

type SimTab = 'simulator' | 'erd'

const SIM_TABS: { id: SimTab; label: string; icon: ReactNode }[] = [
  { id: 'simulator', label: 'Simulator',    icon: <IconSettings size={16} stroke={1.5} /> },
  { id: 'erd',       label: 'Schema / ERD', icon: <IconSchema size={16} stroke={1.5} /> },
]

export function InternalsSimulatorSection() {
  const optimizerResult    = useInternalsStore((s) => s.optimizerResult)
  const isComplete         = useInternalsStore((s) => s.isComplete)
  const highlightedStep    = useInternalsStore((s) => s.highlightedStep)
  const setHighlightedStep = useInternalsStore((s) => s.setHighlightedStep)
  const lang               = useLangStore((s) => s.lang)
  const t = T[lang]
  const [activeTab, setActiveTab] = useState<SimTab>('simulator')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 items-stretch border-b border-line-2 bg-rail">
        <div className="px-4 py-2.5">
          <h2 className="font-sans text-sm font-semibold leading-none text-ink">{t.simTitle}</h2>
          <p className="mt-1 font-read text-[12px] text-ink-2">{t.simDesc}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-stretch border-l border-line-2">
          {SIM_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                TAB,
                'flex items-center gap-1.5 px-4 text-xs font-semibold',
                tabCls(activeTab === tab.id),
                activeTab === tab.id && 'bg-paper'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col overflow-hidden"
            >
              {/* Top: OracleDiagram (70%) + Optimizer (right 30%) */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 overflow-hidden" style={{ width: '70%', flexShrink: 0 }}>
                  <OracleDiagram compact />
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l border-line-2 bg-paper">
                  <PaneHeader>
                    <span className="font-medium text-ink">CBO Optimizer</span>
                    {optimizerResult && (
                      <span className="ml-auto">
                        cost {optimizerResult.plan.totalCost.toFixed(1)} · {optimizerResult.plan.estimatedRows} rows
                      </span>
                    )}
                  </PaneHeader>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <OptimizerPanel result={optimizerResult} />
                  </div>
                </div>
              </div>

              {/* Bottom: SQL input (left 70%) + Log/Summary (right 30%) */}
              <div className="flex shrink-0 border-t border-line-2" style={{ height: '220px' }}>
                <div className="flex min-h-0 flex-col overflow-hidden border-r border-line-2" style={{ width: '70%', flexShrink: 0 }}>
                  <PaneHeader>
                    <span className="font-medium text-ink">SQL Input</span>
                  </PaneHeader>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <QueryInput />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-paper">
                  <PaneHeader>
                    <span className={cn('font-medium text-ink', lang === 'ko' && 'font-sans')}>
                      {isComplete ? t.execSummary : t.liveLog}
                    </span>
                  </PaneHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <SummaryTimeline selectedStep={highlightedStep} onSelect={setHighlightedStep} />
                        </motion.div>
                      ) : (
                        <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <LiveLog />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="erd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <ErdPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
