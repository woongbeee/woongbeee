import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInternalsStore } from '@/store/internalsStore'
import type { StepSummary, SimulationStep } from '@/store/internalsStore'
import { useLangStore } from '@/store/simulationStore'
import { SAMPLE_QUERIES } from '@/data/index'
import { StepList } from '@/book/chapters/shared'
import { cn } from '@/lib/utils'

// ── SQL Syntax Highlighter ─────────────────────────────────────────────────

const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|AS|DISTINCT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|CONSTRAINT|VIEW|UNION|ALL|CASE|WHEN|THEN|ELSE|END|WITH|ASC|DESC|COUNT|SUM|AVG|MIN|MAX|COALESCE|NVL|DECODE|ROWNUM|ROWID)\b/gi
const SQL_NUMBERS  = /\b\d+(\.\d+)?\b/g

function highlightSQL(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.split(/('[^']*')/g).map((part, i) => {
    if (i % 2 === 1) return `<span class="text-sy-str">${part}</span>`
    return part
      .replace(SQL_NUMBERS,  (m) => `<span class="text-sy-num">${m}</span>`)
      .replace(SQL_KEYWORDS, (m) => `<span class="text-sy-kw font-bold">${m.toUpperCase()}</span>`)
  }).join('')
}

// ── Live log ───────────────────────────────────────────────────────────────

export function LiveLog() {
  const stepLog = useInternalsStore((s) => s.stepLog)
  const lang    = useLangStore((s) => s.lang)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stepLog.length])

  return (
    <div className="flex h-full flex-col justify-end gap-0.5">
      {stepLog.length === 0 ? (
        <p className="font-sans text-xs text-ink-3">
          {lang === 'ko'
            ? '쿼리를 실행하면 Oracle 안에서 일어나는 처리 과정이 여기에 나타나요.'
            : 'Run a query to see Oracle internal processing steps here.'}
        </p>
      ) : (
        stepLog.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 font-mono text-xs"
          >
            <span className="whitespace-nowrap text-ink-3">
              {new Date(log.timestamp).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', { hour12: false })}
            </span>
            <span className="text-amber">›</span>
            <span className="text-ink">{log.message}</span>
          </motion.div>
        ))
      )}
      <div ref={endRef} />
    </div>
  )
}

// ── Summary timeline ───────────────────────────────────────────────────────

const RESULT_LABEL: Record<StepSummary['result'], string> = {
  hit: 'HIT',
  miss: 'MISS',
  ok: 'OK',
  info: 'INFO',
}

export function SummaryTimeline({ selectedStep, onSelect }: {
  selectedStep: SimulationStep | null
  onSelect: (step: SimulationStep | null) => void
}) {
  const stepSummary = useInternalsStore((s) => s.stepSummary)
  const lang        = useLangStore((s) => s.lang)
  const items       = stepSummary.filter((s) => s.step !== 'complete')
  const activeIndex = items.findIndex((s) => s.step === selectedStep)

  return (
    <div>
      {selectedStep && (
        <div className="flex justify-end">
          <button
            onClick={() => onSelect(null)}
            className="font-mono text-[10px] text-ink-3 transition-colors hover:text-ink"
          >
            {lang === 'ko' ? '고정 해제 ✕' : 'Unpin ✕'}
          </button>
        </div>
      )}
      <StepList
        steps={items.map((s) => ({ title: `${s.label} · ${RESULT_LABEL[s.result]}`, desc: s.message }))}
        activeIndex={activeIndex >= 0 ? activeIndex : undefined}
        onStepClick={(i) => onSelect(items[i].step === selectedStep ? null : items[i].step)}
      />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

// join-sim 컨트롤 버튼과 같은 모양
const BTN = 'self-end rounded-card border px-3 py-1.5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export function QueryInput() {
  const [input, setInput] = useState('')
  const startSimulation    = useInternalsStore((s) => s.startSimulation)
  const resetSimulation    = useInternalsStore((s) => s.resetSimulation)
  const isRunning          = useInternalsStore((s) => s.isRunning)
  const setHighlightedStep = useInternalsStore((s) => s.setHighlightedStep)
  const flushBuffers       = useInternalsStore((s) => s.flushBuffers)
  const lang               = useLangStore((s) => s.lang)

  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop  = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const handleRun = () => {
    const q = input.trim()
    if (!q || isRunning) return
    resetSimulation()
    setHighlightedStep(null)
    startSimulation(q)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun()
  }

  const handleReset = () => {
    resetSimulation()
    setHighlightedStep(null)
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto bg-paper p-3">

      {/* Sample queries */}
      <div className="flex flex-wrap gap-1">
        {SAMPLE_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => { setInput(q); textareaRef.current?.focus() }}
            className="rounded-chip border border-line bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-2 transition-colors hover:border-line-2 hover:bg-rail hover:text-ink"
          >
            {q.length > 35 ? q.slice(0, 35) + '…' : q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 z-10 font-mono text-sm font-bold text-amber">
            SQL&gt;
          </span>
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-card border border-transparent bg-code-bg py-2 pl-14 pr-3 font-mono text-sm leading-[1.5rem] text-ink"
            dangerouslySetInnerHTML={{ __html: highlightSQL(input) || '' }}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder="SELECT * FROM EMPLOYEES"
            rows={2}
            disabled={isRunning}
            className="relative w-full resize-none rounded-card border border-code-border bg-transparent py-2 pl-14 pr-3 font-mono text-sm leading-[1.5rem] text-transparent caret-ink outline-none transition-all placeholder:text-ink-3 focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleRun}
          disabled={!input.trim() || isRunning}
          className={cn(BTN, 'border-amber/40 bg-amber/8 font-bold text-amber hover:bg-amber/15')}
        >
          {isRunning ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              {lang === 'ko' ? '실행 중…' : 'Running…'}
            </motion.span>
          ) : 'RUN ⏎'}
        </button>

        <button
          onClick={flushBuffers}
          disabled={isRunning}
          title={lang === 'ko'
            ? 'Buffer Cache의 Dirty Buffer를 DBWn이 Data File로 씁니다 (Checkpoint)'
            : 'DBWn writes Dirty Buffers from Buffer Cache to Data Files (Checkpoint)'}
          className={cn(BTN, 'border-line bg-paper text-ink-2 hover:bg-rail hover:text-ink')}
        >
          Buffer Flush
        </button>

        <button
          onClick={handleReset}
          disabled={isRunning}
          className={cn(BTN, 'border-transparent text-ink-2 hover:bg-rail hover:text-ink')}
        >
          {lang === 'ko' ? '초기화' : 'Reset'}
        </button>
      </div>
    </div>
  )
}
