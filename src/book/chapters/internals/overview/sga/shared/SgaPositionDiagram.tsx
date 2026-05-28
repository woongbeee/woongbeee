import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type SgaComponentId = 'buffer-cache' | 'shared-pool' | 'redo-log-buffer' | 'large-pool'

// Sub-diagrams for each non-highlighted component
function BufferCacheMini() {
  return (
    <div className="mt-3 flex-1 grid grid-cols-6 auto-rows-fr gap-0.5">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-sm border',
            i % 5 === 0
              ? 'border-amber-400 bg-amber-200'
              : i % 7 === 3
                ? 'border-teal-400 bg-teal-100'
                : 'border-blue-300 bg-blue-100',
          )}
        />
      ))}
    </div>
  )
}

function SharedPoolMini() {
  return (
    <div className="mt-3 flex flex-1 flex-col gap-1.5">
      <div className="flex flex-1 items-center rounded-md border border-violet-300 bg-violet-100/70 px-2 py-1">
        <div className="font-mono text-[9px] font-bold text-violet-700">Library Cache</div>
      </div>
      <div className="flex flex-1 items-center rounded-md border border-slate-300 bg-slate-100/70 px-2 py-1">
        <div className="font-mono text-[9px] font-bold text-slate-500">Dictionary Cache</div>
      </div>
    </div>
  )
}

function RedoLogBufferMini() {
  const SLOTS = 10
  const CX = 36
  const CY = 36
  const R = 26
  const SLOT_R = 5
  const HEAD = 3

  return (
    <svg viewBox="0 0 72 72" className="mt-2 mx-auto block w-full max-w-[80px]">
      {Array.from({ length: SLOTS }).map((_, i) => {
        const angle = (2 * Math.PI * i) / SLOTS - Math.PI / 2
        const x = CX + R * Math.cos(angle)
        const y = CY + R * Math.sin(angle)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={SLOT_R}
            className={i < HEAD ? 'fill-orange-300 stroke-orange-500' : 'fill-slate-100 stroke-slate-300'}
            strokeWidth={1}
          />
        )
      })}
      <motion.circle
        cx={CX + R * Math.cos((2 * Math.PI * HEAD) / SLOTS - Math.PI / 2)}
        cy={CY + R * Math.sin((2 * Math.PI * HEAD) / SLOTS - Math.PI / 2)}
        r={SLOT_R + 2}
        fill="none"
        stroke="#f97316"
        strokeWidth={1.5}
        strokeDasharray="4 2"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontFamily="monospace" fill="#94a3b8">
        LGWR
      </text>
    </svg>
  )
}

function LargePoolMini() {
  return (
    <div className="mt-3 flex flex-1 flex-col gap-1.5">
      {['RMAN', 'Parallel', 'UGA'].map((label) => (
        <div key={label} className="flex flex-1 items-center rounded-md border border-teal-200 bg-teal-50 px-2 py-1">
          <div className="font-mono text-[9px] font-bold text-teal-600">{label}</div>
        </div>
      ))}
    </div>
  )
}

const COMPONENTS: {
  id: SgaComponentId
  label: string
  flex: string
  highlight: { border: string; bg: string; ring: string; text: string }
  dim: string
}[] = [
  {
    id: 'buffer-cache',
    label: 'Buffer Cache',
    flex: 'flex-[2]',
    highlight: { border: 'border-blue-500', bg: 'bg-blue-100', ring: 'ring-2 ring-blue-300', text: 'text-blue-800' },
    dim: 'border-border/30 bg-muted/20 text-muted-foreground/40',
  },
  {
    id: 'shared-pool',
    label: 'Shared Pool',
    flex: 'flex-[2]',
    highlight: { border: 'border-violet-500', bg: 'bg-violet-100', ring: 'ring-2 ring-violet-300', text: 'text-violet-800' },
    dim: 'border-border/30 bg-muted/20 text-muted-foreground/40',
  },
  {
    id: 'redo-log-buffer',
    label: 'Redo Log Buffer',
    flex: 'flex-[2]',
    highlight: { border: 'border-orange-500', bg: 'bg-orange-100', ring: 'ring-2 ring-orange-300', text: 'text-orange-800' },
    dim: 'border-border/30 bg-muted/20 text-muted-foreground/40',
  },
  {
    id: 'large-pool',
    label: 'Large Pool',
    flex: 'flex-[2]',
    highlight: { border: 'border-teal-500', bg: 'bg-teal-100', ring: 'ring-2 ring-teal-300', text: 'text-teal-800' },
    dim: 'border-border/30 bg-muted/20 text-muted-foreground/40',
  },
]

interface Props {
  activeId: SgaComponentId | null
}

export function SgaPositionDiagram({ activeId }: Props) {
  return (
    <div className="mb-8 rounded-2xl border-2 border-border bg-muted/20 p-5">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        SGA — System Global Area
      </div>
      <div className="flex h-[140px] gap-2">
        {COMPONENTS.map((c) => {
          const isActive = c.id === activeId
          const colorCls = isActive
            ? `${c.highlight.border} ${c.highlight.bg} ${c.highlight.ring} ${c.highlight.text} shadow-md`
            : activeId === null
              ? `${c.highlight.border} ${c.highlight.bg} ${c.highlight.text}`
              : c.dim
          return (
            <motion.div
              key={c.id}
              animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={isActive ? { repeat: Infinity, duration: 1.4, repeatDelay: 0.4 } : {}}
              className={cn(c.flex, 'relative flex flex-col rounded-xl border-2 px-3 py-3 transition-all', colorCls)}
            >
              <div className="font-mono text-xs font-bold leading-tight">{c.label}</div>
              {c.id === 'buffer-cache' && <BufferCacheMini />}
              {c.id === 'shared-pool' && <SharedPoolMini />}
              {c.id === 'redo-log-buffer' && <RedoLogBufferMini />}
              {c.id === 'large-pool' && <LargePoolMini />}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
