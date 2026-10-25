import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInternalsStore, STEP_PROCESS_LABEL } from '@/store/internalsStore'
import type { Lang } from '@/store/simulationStore'
import { useLangStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

// ── Color maps (module-level constants, never recreated) ───────────────────
// 영역별 색·상태 규칙은 공용 OracleArchitectureDiagram 의 HUE 와 동일:
// 기본 = bg-paper + 옅은 테두리, 활성 = 틴트 + inset ring. 색은 viz-* 토큰만.

type Hue = 'blue' | 'amber' | 'green' | 'purple' | 'slate'

const HUE: Record<Hue, { text: string; base: string; lit: string; ring: string; accent: string }> = {
  blue:   { text: 'text-viz-blue',   base: 'border-viz-blue/50',   lit: 'border-viz-blue bg-viz-blue/10',     ring: 'ring-viz-blue/40',   accent: 'border-l-viz-blue' },
  amber:  { text: 'text-viz-amber',  base: 'border-viz-amber/50',  lit: 'border-viz-amber bg-viz-amber/10',   ring: 'ring-viz-amber/40',  accent: 'border-l-viz-amber' },
  green:  { text: 'text-viz-green',  base: 'border-viz-green/50',  lit: 'border-viz-green bg-viz-green/10',   ring: 'ring-viz-green/40',  accent: 'border-l-viz-green' },
  purple: { text: 'text-viz-purple', base: 'border-viz-purple/50', lit: 'border-viz-purple bg-viz-purple/10', ring: 'ring-viz-purple/40', accent: 'border-l-viz-purple' },
  slate:  { text: 'text-ink-2',      base: 'border-line-2',        lit: 'border-ink-3 bg-rail',               ring: 'ring-line-2',        accent: 'border-l-line-2' },
}

const boxCls = (hue: Hue, active: boolean) => {
  const h = HUE[hue]
  return active ? cn(h.lit, 'ring-1 ring-inset', h.ring) : cn('bg-paper', h.base)
}

const BLOCK_STATE_CLS: Record<string, string> = {
  cached:   'border-viz-blue/40 bg-viz-blue/10 text-viz-blue',
  hit:      'border-viz-blue bg-viz-blue text-white',
  scanning: 'border-viz-amber bg-viz-amber/15 text-viz-amber',
  free:     'border-line bg-rail text-ink-3',
  loading:  'border-viz-red bg-viz-red/10 text-viz-red',
}

function useIsActive(id: string) {
  return useInternalsStore((s) => s.activeComponents.has(id))
}

// ── Shared primitives ──────────────────────────────────────────────────────

interface BlockProps {
  id: string
  label: string
  sublabel?: string
  description: string
  hue: Hue
  className?: string
  compact?: boolean
  children?: React.ReactNode
}

function Block({ id, label, sublabel, description, hue, className = '', compact = false, children }: BlockProps) {
  const active = useIsActive(id)

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-card border transition-all duration-200',
        compact ? 'p-1.5' : 'p-2.5',
        boxCls(hue, active),
        className
      )}
    >
      <div>
        <div className={cn('font-sans text-[11.5px] font-semibold', HUE[hue].text)}>
          {label}
        </div>
        {sublabel && (
          <div className="font-sans text-[10px] text-ink-3">
            {sublabel}
          </div>
        )}
      </div>
      {!compact && <div className="mt-1 font-sans text-[10px] leading-snug text-ink-2">{description}</div>}
      {children && <div className={compact ? 'mt-1' : 'mt-2'}>{children}</div>}
    </motion.div>
  )
}

function ProcessBadge({ id, label, description, compact = false }: {
  id: string; label: string; description: string; compact?: boolean
}) {
  const active = useIsActive(id)

  return (
    <motion.div
      animate={active ? { y: [0, -3, 0], scale: [1, 1.06, 1] } : { y: 0, scale: 1 }}
      transition={{ duration: 0.45, repeat: active ? Infinity : 0, repeatDelay: 0.2 }}
      className={cn(
        'flex flex-col items-center rounded-card border transition-all duration-200',
        compact ? 'px-1.5 py-1.5' : 'px-2 py-2',
        boxCls('amber', active)
      )}
      title={description}
    >
      <span className="font-mono text-[11px] font-bold tracking-wide text-viz-amber">
        {label}
      </span>
      {active && (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="mt-0.5 font-mono text-[9px] font-bold text-viz-amber"
        >
          ● ACTIVE
        </motion.span>
      )}
    </motion.div>
  )
}

// 라벨 붙은 외곽 프레임 — OracleArchitectureDiagram 의 Frame 과 같은 모양
function Frame({ kicker, hue, className, children }: { kicker: string; hue: Hue; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-panel border border-l-[3px] border-line bg-paper', HUE[hue].accent, className)}>
      <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-3">
        {kicker}
      </div>
      {children}
    </div>
  )
}

// ── Library Cache ──────────────────────────────────────────────────────────

function LibraryCacheBlock({ compact = false }: { compact?: boolean }) {
  const currentStep   = useInternalsStore((s) => s.currentStep)
  const cachedQueries = useInternalsStore((s) => s.cachedQueries)
  const query         = useInternalsStore((s) => s.query)
  const lang          = useLangStore((s) => s.lang)
  const active = useIsActive('library-cache')

  const isSearching = currentStep === 'library-cache-check'
  const isHit       = currentStep === 'library-cache-hit'
  const isMiss      = currentStep === 'library-cache-miss'
  const showList    = active || isSearching || isHit || isMiss
  const normalizedQuery = query.trim().toUpperCase()

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-card border transition-all duration-200',
        compact ? 'p-1.5' : 'p-2.5',
        boxCls('blue', active)
      )}
    >
      <div className="font-sans text-[11.5px] font-semibold text-viz-blue">
        Library Cache
      </div>
      {!compact && (
        <div className="mt-1 font-sans text-[10px] leading-snug text-ink-2">
          {lang === 'ko' ? '파싱된 SQL·실행 계획 캐싱. Soft Parse 활성화' : 'Caches parsed SQL & execution plans. Enables Soft Parse'}
        </div>
      )}

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-card border border-line-2 bg-paper"
          >
            <div className="border-b border-line-2 bg-rail px-2 py-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-3">
                cached cursor pool
              </span>
            </div>
            <div className="space-y-0.5 p-1.5">
              {cachedQueries.map((cq, i) => {
                const isMatch = cq.trim().toUpperCase() === normalizedQuery
                return (
                  <motion.div
                    key={cq}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isSearching ? i * 0.18 : 0, duration: 0.35 }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-chip px-1.5 py-0.5 transition-colors duration-300',
                      isMatch && (isHit || isSearching) && 'bg-viz-blue/10'
                    )}
                  >
                    <span className={cn('shrink-0 font-mono text-[8px] font-bold', isMatch ? 'text-viz-blue' : 'text-ink-3')}>
                      #{i + 1}
                    </span>
                    <span className={cn('flex-1 truncate font-mono text-[9px]', isMatch ? 'font-bold text-ink' : 'text-ink-3')}>
                      {cq}
                    </span>
                    {isMatch && isHit && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="shrink-0 rounded-chip bg-viz-blue px-1 font-mono text-[8px] font-bold text-white"
                      >
                        HIT
                      </motion.span>
                    )}
                  </motion.div>
                )
              })}
              {isMiss && normalizedQuery && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 rounded-chip border border-dashed border-viz-red/50 bg-viz-red/10 px-1.5 py-0.5"
                >
                  <span className="shrink-0 font-mono text-[8px] font-bold text-viz-red">?</span>
                  <span className="flex-1 truncate font-mono text-[9px] text-viz-red">{query}</span>
                  <span className="shrink-0 rounded-chip bg-viz-red px-1 font-mono text-[8px] font-bold text-white">MISS</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Buffer Cache ──────────────────────────────────────────────────────────

function BufferCacheBlock({ compact = false }: { compact?: boolean }) {
  const currentStep = useInternalsStore((s) => s.currentStep)
  const lang        = useLangStore((s) => s.lang)
  const active = useIsActive('buffer-cache')

  const isChecking = currentStep === 'buffer-cache-check'
  const isHit      = currentStep === 'buffer-cache-hit'
  const isMiss     = currentStep === 'buffer-cache-miss'
  const isDiskIo   = currentStep === 'disk-io'
  const showBlocks = active || isChecking || isHit || isMiss || isDiskIo

  const blocks = useMemo(() => [
    { id: 'b1', label: 'EMP#1',  state: 'cached' },
    { id: 'b2', label: 'DEPT#2', state: 'cached' },
    { id: 'b3', label: 'EMP#3',  state: isHit ? 'hit' : isChecking ? 'scanning' : 'cached' },
    { id: 'b4', label: 'FREE',   state: isDiskIo ? 'loading' : 'free' },
    { id: 'b5', label: 'JOB#1',  state: 'cached' },
    { id: 'b6', label: 'FREE',   state: isDiskIo ? 'loading' : 'free' },
  ], [isHit, isChecking, isDiskIo])

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-card border transition-all duration-200',
        compact ? 'p-1.5' : 'p-2.5',
        boxCls('blue', active)
      )}
    >
      <div className="font-sans text-[11.5px] font-semibold text-viz-blue">
        Database Buffer Cache
      </div>
      {!compact && (
        <div className="mt-1 font-sans text-[10px] leading-snug text-ink-2">
          {lang === 'ko' ? '디스크 블록 메모리 캐시. LRU 관리' : 'In-memory disk block cache. LRU managed'}
        </div>
      )}

      <AnimatePresence>
        {showBlocks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 grid grid-cols-3 gap-1 overflow-hidden"
          >
            {blocks.map((blk, i) => (
              <motion.div
                key={blk.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: isChecking ? i * 0.1 : 0 }}
                className={cn(
                  'rounded-chip border px-1 py-0.5 text-center font-mono text-[8px] font-bold',
                  BLOCK_STATE_CLS[blk.state]
                )}
              >
                {blk.label}
              </motion.div>
            ))}
            {(isMiss || isDiskIo) && (
              <div className="col-span-3 mt-0.5 font-mono text-[9px] text-viz-red">
                {isDiskIo
                  ? (lang === 'ko' ? '↑ Disk → Buffer 로드 중…' : '↑ Loading Disk → Buffer…')
                  : (lang === 'ko' ? '블록 없음 → Disk I/O 필요' : 'Block not found → Disk I/O required')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Diagram ──────────────────────────────────────────────────────────

export function OracleDiagram({ compact = false }: { compact?: boolean }) {
  const currentStep     = useInternalsStore((s) => s.currentStep)
  const highlightedStep = useInternalsStore((s) => s.highlightedStep)
  const lang            = useLangStore((s) => s.lang)

  const displayStep = highlightedStep ?? currentStep
  const stepLabel   = STEP_PROCESS_LABEL[lang][displayStep]
  const D           = DIAGRAM_TEXT[lang]

  const gap      = compact ? 'gap-1.5' : 'gap-3'
  const pad      = compact ? 'p-2'     : 'p-4'
  const innerPad = compact ? 'p-1.5'   : 'p-3'
  const innerPadSm = compact ? 'p-1.5' : 'p-2.5'

  return (
    <div className={cn('flex h-full flex-col bg-paper-sunk', gap, pad)}>
      {/* Instance header */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-2 rounded-card border border-line-2 bg-paper px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-viz-blue" />
          <span className="font-mono text-xs font-bold text-ink">Oracle Database Instance</span>
        </div>
        <AnimatePresence mode="wait">
          {currentStep !== 'idle' && (
            <motion.div
              key={displayStep}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="flex items-center gap-2"
            >
              <span className="rounded-chip border border-line bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
                {highlightedStep ? `📌 ${highlightedStep}` : `▶ ${currentStep}`}
              </span>
              {stepLabel && (
                <span className="font-mono text-[10px] text-ink-2">{stepLabel}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Server Process + PGA */}
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Block id="server-process" label="Server Process" description={D.serverProcess} hue="green" compact={compact} />
        <Block id="pga" label="PGA" sublabel="Program Global Area" description={D.pga} hue="purple" compact={compact} />
      </div>

      {/* SGA */}
      <Frame kicker="SGA — System Global Area" hue="blue" className={cn('flex min-h-0 flex-1 flex-col', innerPad)}>

        {/* Shared Pool */}
        <Frame kicker="Shared Pool" hue="blue" className={cn('mb-2 shrink-0', innerPadSm)}>
          <div className="grid grid-cols-2 gap-2">
            <LibraryCacheBlock compact={compact} />
            <Block id="dict-cache" label="Data Dictionary Cache" description={D.dictCache} hue="blue" compact={compact} />
          </div>
        </Frame>

        {/* Buffer Cache + Redo + Undo */}
        <div className="grid flex-1 grid-cols-3 gap-2">
          <BufferCacheBlock compact={compact} />
          <Block id="redo-buffer" label="Redo Log Buffer" description={D.redoBuffer} hue="amber" compact={compact} />
          <Block id="undo" label="Undo Segment" description={D.undo} hue="green" compact={compact} />
        </div>
      </Frame>

      {/* Background Processes */}
      <Frame kicker="Background Processes" hue="amber" className={cn('shrink-0', innerPad)}>
        <div className="grid grid-cols-5 gap-2">
          <ProcessBadge id="dbwr" label="DBWn" description={D.dbwr} compact={compact} />
          <ProcessBadge id="lgwr" label="LGWR" description={D.lgwr} compact={compact} />
          <ProcessBadge id="ckpt" label="CKPT" description={D.ckpt} compact={compact} />
          <ProcessBadge id="smon" label="SMON" description={D.smon} compact={compact} />
          <ProcessBadge id="pmon" label="PMON" description={D.pmon} compact={compact} />
        </div>
      </Frame>

      {/* Disk */}
      <Frame kicker="Disk Storage" hue="slate" className={cn('shrink-0', innerPad)}>
        <div className="grid grid-cols-4 gap-2">
          <Block id="disk"          label="Data Files"       description={D.dataFiles}   hue="slate" compact={compact} />
          <Block id="redo-log-file" label="Online Redo Logs" description={D.redoLogs}    hue="slate" compact={compact} />
          <Block id="control-file"  label="Control File"     description={D.controlFile} hue="slate" compact={compact} />
          <Block id="archive-log"   label="Archive Logs"     description={D.archiveLogs} hue="slate" compact={compact} />
        </div>
      </Frame>
    </div>
  )
}

// ── Diagram text strings ───────────────────────────────────────────────────

const DIAGRAM_TEXT: Record<Lang, Record<string, string>> = {
  ko: {
    serverProcess: '사용자 요청 수신, SQL 파싱 수행',
    pga:           '세션별 독립 메모리. Sort/Hash 작업 영역',
    dictCache:     '테이블·컬럼 메타데이터. Hard Parse 시 조회',
    redoBuffer:    '변경사항 순차 기록. LGWR → 디스크',
    undo:          '롤백 및 읽기 일관성 (Read Consistency)',
    dbwr:          'Dirty Buffer → 데이터 파일 쓰기',
    lgwr:          'Redo Buffer → Redo Log 파일 쓰기',
    ckpt:          '체크포인트 정보 기록',
    smon:          'Instance Recovery, 임시 세그먼트 정리',
    pmon:          '실패한 프로세스 복구, 락 해제',
    dataFiles:     '테이블·인덱스 실제 데이터',
    redoLogs:      '순환 로그. 장애 복구용',
    controlFile:   'DB 구조·상태 메타데이터',
    archiveLogs:   '전체 복구용 아카이브',
  },
  en: {
    serverProcess: 'Receives user requests, performs SQL parsing',
    pga:           'Per-session private memory. Sort/Hash work area',
    dictCache:     'Table/column metadata. Accessed during Hard Parse',
    redoBuffer:    'Sequential change recording. LGWR → disk',
    undo:          'Rollback and Read Consistency support',
    dbwr:          'Dirty Buffer → Data File writes',
    lgwr:          'Redo Buffer → Redo Log file writes',
    ckpt:          'Records checkpoint information',
    smon:          'Instance Recovery, temp segment cleanup',
    pmon:          'Failed process recovery, lock release',
    dataFiles:     'Actual table/index data on disk',
    redoLogs:      'Circular logs for crash recovery',
    controlFile:   'DB structure and state metadata',
    archiveLogs:   'Archive logs for full recovery',
  },
}
