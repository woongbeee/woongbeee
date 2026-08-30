import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'
import { SgaPositionDiagram } from '../overview/sga/shared/SgaPositionDiagram'
import type { SgaComponentId } from '../overview/sga/shared/SgaPositionDiagram'
import { PgaCompactBlock } from '../overview/pga/PgaSection'

export type InstanceComponentId =
  | 'server-process'
  | 'pga'
  | 'sga'
  | 'library-cache'
  | 'dict-cache'
  | 'buffer-cache'
  | 'redo-buffer'
  | 'undo'
  | 'large-pool'
  | 'shared-pool'
  | 'dbwr'
  | 'lgwr'
  | 'ckpt'
  | 'smon'
  | 'pmon'
  | 'arcn'
  | 'disk'
  | 'redo-log-file'
  | 'control-file'
  | 'archive-log'

interface Props {
  highlightIds: InstanceComponentId[]
  callout?: string
  horizontal?: boolean
  hideClient?: boolean
}

const COMPONENT_COLORS: Record<string, {
  base: string
  highlight: string
  dim: string
  label: string
}> = {
  'server-process': {
    base:      'border-green/30 bg-green/5 text-green',
    highlight: 'border-green bg-green/10 ring-2 ring-green/50  text-green',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Server Process',
  },
  pga: {
    base:      'border-green/30 bg-green/5 text-green',
    highlight: 'border-green bg-green/10 ring-2 ring-green/50  text-green',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'PGA',
  },
  sga: {
    base:      'border-blue/50 bg-blue/5',
    highlight: 'border-blue bg-blue/10 ring-2 ring-blue/50 ',
    dim:       'border-line/20 bg-rail',
    label:     'SGA',
  },
  'shared-pool': {
    base:      'border-blue/30 bg-blue/5',
    highlight: 'border-blue/50 bg-blue/10 ring-2 ring-blue/50 ',
    dim:       'border-line/20 bg-rail',
    label:     'Shared Pool',
  },
  'library-cache': {
    base:      'border-blue/30 bg-blue/5 text-blue',
    highlight: 'border-blue bg-blue/10 ring-2 ring-blue/50  text-blue',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Library Cache',
  },
  'dict-cache': {
    base:      'border-blue/30 bg-blue/5 text-blue',
    highlight: 'border-blue bg-blue/10 ring-2 ring-blue/50  text-blue',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Dict Cache',
  },
  'buffer-cache': {
    base:      'border-blue/30 bg-blue/5 text-blue',
    highlight: 'border-blue bg-blue/10 ring-2 ring-blue/50  text-blue',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Buffer Cache',
  },
  'redo-buffer': {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Log Buffer',
  },
  undo: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Undo Segment',
  },
  dbwr: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'DBWn',
  },
  lgwr: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'LGWR',
  },
  ckpt: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'CKPT',
  },
  smon: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'SMON',
  },
  pmon: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'PMON',
  },
  arcn: {
    base:      'border-amber/30 bg-amber/5 text-amber',
    highlight: 'border-amber bg-amber/10 ring-2 ring-amber/50  text-amber',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'ARCn',
  },
  disk: {
    base:      'border-line bg-paper-sunk text-ink',
    highlight: 'border-line-2 bg-paper-sunk ring-2 ring-line-2  text-ink',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Data Files',
  },
  'redo-log-file': {
    base:      'border-line bg-paper-sunk text-ink',
    highlight: 'border-line-2 bg-paper-sunk ring-2 ring-line-2  text-ink',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Redo Logs',
  },
  'control-file': {
    base:      'border-line bg-paper-sunk text-ink',
    highlight: 'border-line-2 bg-paper-sunk ring-2 ring-line-2  text-ink',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Control File',
  },
  'archive-log': {
    base:      'border-line bg-paper-sunk text-ink',
    highlight: 'border-line-2 bg-paper-sunk ring-2 ring-line-2  text-ink',
    dim:       'border-line/30 bg-rail text-ink-2/30',
    label:     'Archive Logs',
  },
}

function MapBlock({
  id,
  label,
  sublabel,
  highlightIds,
  className,
  pulse = true,
}: {
  id: InstanceComponentId
  label?: string
  sublabel?: string
  highlightIds: InstanceComponentId[]
  className?: string
  pulse?: boolean
}) {
  const isHighlighted = highlightIds.includes(id)
  const hasHighlights = highlightIds.length > 0
  const isDimmed = hasHighlights && !isHighlighted
  const c = COMPONENT_COLORS[id]
  const displayLabel = label ?? c.label

  return (
    <motion.div
      data-component-id={id}
      animate={
        isHighlighted && pulse
          ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 1.2, repeatDelay: 0.3 } }
          : { scale: 1 }
      }
      className={cn(
        'relative cursor-pointer rounded-card border-2 px-2 py-2 transition-all duration-300',
        isHighlighted ? c.highlight : isDimmed ? c.dim : c.base,
        className
      )}
    >
      {isHighlighted && (
        <motion.div
          className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue text-paper"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <span className="text-[8px] font-bold">★</span>
        </motion.div>
      )}
      <div className="font-mono text-[10px] font-bold leading-tight">{displayLabel}</div>
      {sublabel && (
        <div className="font-mono text-[9px] leading-tight opacity-60 mt-0.5">{sublabel}</div>
      )}
    </motion.div>
  )
}

function SectionLabel({ children, dimmed }: { children: React.ReactNode; dimmed?: boolean }) {
  return (
    <div className={cn(
      'mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-opacity duration-300',
      dimmed ? 'opacity-20' : 'opacity-60'
    )}>
      {children}
    </div>
  )
}


export function OracleInstanceMap({ highlightIds, callout, horizontal = false, hideClient = false }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const hasHighlights = highlightIds.length > 0

  const clientHighlighted = ['server-process', 'pga'].some(id => highlightIds.includes(id as InstanceComponentId))
  const sgaHighlighted = highlightIds.includes('sga') ||
    ['library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer', 'undo', 'shared-pool'].some(id =>
      highlightIds.includes(id as InstanceComponentId)
    )
  const bgProcessHighlighted = ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn'].some(id =>
    highlightIds.includes(id as InstanceComponentId)
  )
  const diskHighlighted = ['disk', 'redo-log-file', 'control-file', 'archive-log'].some(id =>
    highlightIds.includes(id as InstanceComponentId)
  )

  const clientDimmed = hasHighlights && !clientHighlighted
  const sgaDimmed = hasHighlights && !sgaHighlighted
  const bgDimmed = hasHighlights && !bgProcessHighlighted
  const diskDimmed = hasHighlights && !diskHighlighted

  const legend = callout ? (
    <div className="flex items-center gap-2 mb-2">
      <motion.span
        key={callout}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="font-mono text-[10px] text-ink-2"
      >
        {callout}
      </motion.span>
    </div>
  ) : null

  const spHighlighted  = highlightIds.includes('server-process')
  const pgaHighlighted = highlightIds.includes('pga')

  // Server Process = 외곽 컨테이너 박스 (teal)
  // PGA = 그 안에 내포된 violet 박스 → "SP가 PGA를 소유한다"는 관계를 색상+중첩으로 표현
  const layerClient = (
    <div
      className={cn(
        'rounded-panel border-2 transition-all duration-300',
        spHighlighted
          ? 'border-green bg-green/5 ring-2 ring-green/50 '
          : clientDimmed
          ? 'border-line/20 bg-rail'
          : 'border-green/50 bg-green/5'
      )}
    >
      {/* ── Server Process 헤더 영역 ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-1.5">
          {spHighlighted && (
            <motion.span
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue text-paper"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-[7px] font-bold">★</span>
            </motion.span>
          )}
          <span className={cn(
            'font-mono text-[11px] font-bold leading-tight',
            spHighlighted ? 'text-green' : clientDimmed ? 'text-ink-2/20' : 'text-green'
          )}>
            Server Process
          </span>
        </div>
        <span className={cn(
          'font-mono text-[8px]',
          clientDimmed ? 'text-ink-2/20' : 'text-green'
        )}>
          {lang === 'ko' ? '↔ SGA 공유 접근' : '↔ shared SGA access'}
        </span>
      </div>

      {/* ── PGA 다이어그램 — SP 내부에 내포 ── */}
      <div className="px-3 pb-3">
        <motion.div
          data-component-id="pga"
          animate={
            pgaHighlighted
              ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 1.4, repeatDelay: 0.3 } }
              : { scale: 1 }
          }
          className={cn(
            'relative rounded-panel transition-all duration-300',
            pgaHighlighted ? 'ring-2 ring-purple/50 ' : '',
            clientDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'
          )}
        >
          {pgaHighlighted && (
            <motion.div
              className="absolute -top-2 -right-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue text-paper"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-[8px] font-bold">★</span>
            </motion.div>
          )}
          <PgaCompactBlock lang={lang} />
        </motion.div>
      </div>
    </div>
  )

  const sgaActiveId: SgaComponentId | null = (() => {
    if (!hasHighlights || !sgaHighlighted) return null
    if (highlightIds.includes('buffer-cache')) return 'buffer-cache'
    if (highlightIds.includes('shared-pool') || highlightIds.includes('library-cache') || highlightIds.includes('dict-cache')) return 'shared-pool'
    if (highlightIds.includes('redo-buffer')) return 'redo-log-buffer'
    if (highlightIds.includes('large-pool')) return 'large-pool'
    return null
  })()

  const layerSga = (
    <div className={cn('transition-opacity duration-300', sgaDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100')}>
      <SgaPositionDiagram activeId={sgaActiveId} />
    </div>
  )

  const layerBg = (
    <div
      data-component-id="dbwr"
      className={cn(
        'rounded-panel border-2 p-3 transition-all duration-300',
        bgProcessHighlighted
          ? 'border-amber/50 bg-amber/5 '
          : bgDimmed
          ? 'border-line/20 bg-rail'
          : 'border-amber/30 bg-amber/5'
      )}
    >
      <SectionLabel dimmed={bgDimmed}>Background Processes</SectionLabel>
      <div className={cn('gap-1.5', horizontal ? 'flex' : 'grid grid-cols-3')}>
        {(['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn'] as InstanceComponentId[]).map((id) => (
          <MapBlock key={id} id={id} highlightIds={highlightIds} pulse={false} className={horizontal ? 'flex-1' : ''} />
        ))}
      </div>
    </div>
  )

  const layerDisk = (
    <div
      data-component-id="disk"
      className={cn(
        'rounded-panel border-2 p-3 transition-all duration-300',
        diskHighlighted
          ? 'border-line-2 bg-paper-sunk '
          : diskDimmed
          ? 'border-line/20 bg-rail'
          : 'border-line-2 bg-paper-sunk'
      )}
    >
      <SectionLabel dimmed={diskDimmed}>Disk Storage</SectionLabel>
      <div className={cn('gap-1.5', horizontal ? 'flex' : 'grid grid-cols-2')}>
        {(['disk', 'redo-log-file', 'control-file', 'archive-log'] as InstanceComponentId[]).map((id) => (
          <MapBlock key={id} id={id} highlightIds={highlightIds} pulse={false} className={horizontal ? 'flex-1' : ''} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {legend}
      {!hideClient && layerClient}
      {layerSga}
      {layerBg}
      {layerDisk}
    </div>
  )
}
