import { motion } from 'framer-motion'
import type { InstanceComponentId } from './OracleInstanceMap'
import { SubTitle } from '../../shared'
import { cn } from '@/lib/utils'
import { OracleInstanceMap } from './OracleInstanceMap'
import { useSimulationStore } from '@/store/simulationStore'

// ── TwoColLayout ───────────────────────────────────────────────────────────

export function TwoColLayout({ children, map }: { children: React.ReactNode; map: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">{children}</div>
        <aside className="w-72 shrink-0">
          <div className="sticky top-6">{map}</div>
        </aside>
      </div>
    </div>
  )
}

// ── MapPanel ───────────────────────────────────────────────────────────────

export function MapPanel({ title, highlightIds, callout }: {
  title: string
  highlightIds: InstanceComponentId[]
  callout?: string
}) {
  return (
    <div className="rounded-panel border bg-paper p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue" />
        {/* 한글 라벨이라 mono 금지 — mono 는 한글 글리프가 없어 시스템 폰트로 폴백된다 */}
        <span className="font-sans text-[11px] font-semibold tracking-wide text-ink-2">
          {title}
        </span>
      </div>
      <OracleInstanceMap highlightIds={highlightIds} callout={callout} />
    </div>
  )
}

// ── TourItem type ──────────────────────────────────────────────────────────

export type TourItem = {
  ids: InstanceComponentId[]
  label: string
  desc: { ko: string; en: string }
}

// ── TourPanel ──────────────────────────────────────────────────────────────

export function TourPanel({
  tour,
  activeIdx,
  onSelect,
  accentColor,
  exploreLabel,
  showAllLabel,
}: {
  tour: TourItem[]
  activeIdx: number | null
  onSelect: (i: number | null) => void
  accentColor: 'blue' | 'amber'
  exploreLabel: string
  showAllLabel: string
}) {
  const lang = useSimulationStore((s) => s.lang)
  const active = accentColor === 'blue'
    ? { btn: 'border-blue/50 bg-blue/10 text-blue font-semibold ', hover: 'hover:border-blue/50 hover:bg-blue/5', card: 'border-blue/30 bg-blue/5', title: 'text-blue', badge: 'bg-blue/15 text-blue' }
    : { btn: 'border-amber/50 bg-amber/10 text-amber font-semibold ', hover: 'hover:border-amber/50 hover:bg-amber/5', card: 'border-amber/30 bg-amber/5', title: 'text-amber', badge: 'bg-amber/15 text-amber' }

  return (
    <>
      <SubTitle>{exploreLabel}</SubTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {tour.map((item, i) => (
          <button
            key={item.label}
            onClick={() => onSelect(activeIdx === i ? null : i)}
            className={cn(
              'rounded-full border px-3 py-1 font-sans text-xs transition-all',
              activeIdx === i ? active.btn : `${active.hover} text-ink-2`
            )}
          >
            {item.label}
          </button>
        ))}
        {activeIdx !== null && (
          <button
            onClick={() => onSelect(null)}
            className="rounded-full border border-dashed px-3 py-1 font-sans text-xs text-ink-2 hover:text-ink"
          >
            ✕ {showAllLabel}
          </button>
        )}
      </div>

      {activeIdx !== null && (
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mb-4 rounded-card border p-3', active.card)}
        >
          <div className={cn('mb-1 font-sans text-[12px] font-semibold', active.title)}>
            {tour[activeIdx].label}
          </div>
          <p className="font-read text-xs leading-relaxed text-ink-2">{tour[activeIdx].desc[lang]}</p>
          {accentColor === 'amber' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tour[activeIdx].ids.map((id) => (
                <span key={id} className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold', active.badge)}>
                  {id}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}
