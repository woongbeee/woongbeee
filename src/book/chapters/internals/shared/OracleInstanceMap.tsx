import type { ReactNode } from 'react'
import { IconArrowNarrowRight, IconArrowNarrowDown } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

// ─────────────────────────────────────────────────────────────────────────────
// Oracle 인스턴스 전체 구조 다이어그램 — 공용.
//
// Oracle 공식 "Database Instance" 그림을 그대로 옮겨 그린다:
//   Client Process ↔ Server Process (+PGA)  →  Instance { SGA · Background
//   Processes }  →  Database { Data / Redo / Control / Archived files }
//
// 다이어그램에는 이름표만 있다. 자세한 설명은 각 영역을 "클릭"하면 뜬다
// (부모가 data-component-id 를 보고 처리 — OverviewSection 참고).
//
// 폰트: 이름 = font-sans, 약어(PMON·SGA…) = font-mono. 색: --color-viz-* / 토큰.
// ─────────────────────────────────────────────────────────────────────────────

export type InstanceComponentId =
  | 'client'
  | 'server-process'
  | 'pga'
  | 'instance'
  | 'sga'
  | 'shared-pool'
  | 'library-cache'
  | 'dict-cache'
  | 'buffer-cache'
  | 'redo-buffer'
  | 'large-pool'
  | 'java-pool'
  | 'fixed-sga'
  | 'undo'
  | 'bg-processes'
  | 'dbwr'
  | 'lgwr'
  | 'ckpt'
  | 'smon'
  | 'pmon'
  | 'mmon'
  | 'reco'
  | 'arcn'
  | 'database'
  | 'disk'
  | 'redo-log-file'
  | 'control-file'
  | 'archive-log'

interface Props {
  highlightIds: InstanceComponentId[]
  /** 다이어그램 위에 뜨는 한 줄 안내 문구 */
  callout?: string
  /** 넓은 컨테이너에서 pool/process 를 더 여러 열로 편다 */
  horizontal?: boolean
  /** Client / Server Process 행을 숨긴다 */
  hideClient?: boolean
  /** 영역 클릭 콜백 (부모에서 data-component-id 로 잡아도 됨) */
  onSelect?: (id: InstanceComponentId) => void
  className?: string
}

// 그룹 → 소속 id (그룹이 강조되면 소속도 함께 강조)
const GROUP: Partial<Record<InstanceComponentId, InstanceComponentId[]>> = {
  sga: ['shared-pool', 'library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer', 'large-pool', 'java-pool', 'fixed-sga', 'undo'],
  'shared-pool': ['library-cache', 'dict-cache'],
  'bg-processes': ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'mmon', 'reco', 'arcn'],
  dbwr: ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'mmon', 'reco', 'arcn'], // OverviewSection 투어가 'dbwr' 키를 씀
  database: ['disk', 'redo-log-file', 'control-file', 'archive-log'],
  disk: ['disk', 'redo-log-file', 'control-file', 'archive-log'],
}

type Hue = 'blue' | 'amber' | 'green' | 'purple' | 'slate'

const HUE: Record<Hue, { text: string; base: string; lit: string; ring: string; hover: string; accent: string }> = {
  blue:   { text: 'text-viz-blue',   base: 'border-viz-blue/50',   lit: 'border-viz-blue bg-viz-blue/10',     ring: 'ring-viz-blue/40',   hover: 'hover:bg-viz-blue/5',   accent: 'border-l-viz-blue' },
  amber:  { text: 'text-viz-amber',  base: 'border-viz-amber/50',  lit: 'border-viz-amber bg-viz-amber/10',   ring: 'ring-viz-amber/40',  hover: 'hover:bg-viz-amber/5',  accent: 'border-l-viz-amber' },
  green:  { text: 'text-viz-green',  base: 'border-viz-green/50',   lit: 'border-viz-green bg-viz-green/10',   ring: 'ring-viz-green/40',  hover: 'hover:bg-viz-green/5',  accent: 'border-l-viz-green' },
  purple: { text: 'text-viz-purple', base: 'border-viz-purple/50',  lit: 'border-viz-purple bg-viz-purple/10', ring: 'ring-viz-purple/40', hover: 'hover:bg-viz-purple/5', accent: 'border-l-viz-purple' },
  slate:  { text: 'text-ink-2',      base: 'border-line-2',         lit: 'border-ink-3 bg-rail',               ring: 'ring-line-2',        hover: 'hover:bg-ink/[0.03]',   accent: 'border-l-line-2' },
}

// ── 클릭 가능한 이름표 박스 ────────────────────────────────────────────────
function Box({
  id, label, mono, hue, state, onSelect, className,
}: {
  id: InstanceComponentId
  label: string
  mono?: boolean
  hue: Hue
  state: 'lit' | 'base' | 'dim'
  onSelect?: (id: InstanceComponentId) => void
  className?: string
}) {
  const h = HUE[hue]
  return (
    <button
      type="button"
      data-component-id={id}
      onClick={() => onSelect?.(id)}
      className={cn(
        'flex min-w-0 items-center justify-center rounded-card border px-2.5 py-2 text-center transition-all',
        state === 'dim'
          ? 'border-line opacity-40'
          : state === 'lit'
            ? h.lit
            : cn('bg-paper', h.base, h.hover),
        className,
      )}
    >
      <span
        className={cn(
          'leading-tight',
          mono ? 'font-mono text-[11px] font-bold tracking-wide' : 'font-sans text-[11.5px] font-semibold',
          state === 'dim' ? 'text-ink-3' : h.text,
        )}
      >
        {label}
      </span>
    </button>
  )
}

// ── 라벨 붙은 외곽 프레임 (SGA / Background Processes / Instance / Database) ─
function Frame({
  id, kicker, hue, state, onSelect, children, className,
}: {
  id?: InstanceComponentId
  kicker: string
  hue: Hue
  state: 'lit' | 'base' | 'dim'
  onSelect?: (id: InstanceComponentId) => void
  children: ReactNode
  className?: string
}) {
  const h = HUE[hue]
  return (
    <div
      data-component-id={id}
      onClick={id && onSelect ? () => onSelect(id) : undefined}
      className={cn(
        'rounded-panel border border-l-[3px] bg-paper p-3 transition-all',
        state === 'dim' ? 'border-line border-l-line opacity-40' : cn('border-line', h.accent),
        state === 'lit' && cn('ring-1 ring-inset', h.ring),
        id && onSelect ? 'cursor-pointer' : '',
        className,
      )}
    >
      <div className={cn('mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em]', state === 'dim' ? 'text-ink-3/60' : 'text-ink-3')}>
        {kicker}
      </div>
      {children}
    </div>
  )
}

export function OracleInstanceMap({
  highlightIds, callout, horizontal = false, hideClient = false, onSelect, className,
}: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const lbl = (ko: string, en: string) => (isKo ? ko : en)

  // 강조 집합 = 넘어온 id + 각 id 의 그룹 소속까지 펼침
  const hlSet = new Set<InstanceComponentId>(highlightIds)
  for (const id of highlightIds) for (const m of GROUP[id] ?? []) hlSet.add(m)
  const anyHl = highlightIds.length > 0

  const on = (...ids: InstanceComponentId[]) => ids.some((id) => hlSet.has(id) || (GROUP[id] ?? []).some((m) => hlSet.has(m)))
  const st = (hit: boolean): 'lit' | 'base' | 'dim' => (!anyHl ? 'base' : hit ? 'lit' : 'dim')

  const dividerCols = horizontal ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
  const procCols = horizontal ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-4'
  const fileCols = horizontal ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'

  // ── Client / Server Process 행 ──────────────────────────────────────────
  const clientRow = !hideClient && (
    <div className={cn('flex flex-wrap items-center gap-2', horizontal ? 'sm:flex-nowrap' : '')}>
      <Box id="client" label={lbl('클라이언트 프로세스', 'Client Process')} hue="slate" state={st(on('client'))} onSelect={onSelect} className="flex-1 py-2.5" />
      <IconArrowNarrowRight size={18} className="shrink-0 text-ink-3" />
      <Box id="server-process" label="Server Process" hue="green" state={st(on('server-process'))} onSelect={onSelect} className="flex-1 py-2.5" />
      <span className="flex shrink-0 flex-col items-center leading-none">
        <span className="mb-0.5 font-sans text-[8px] text-ink-3">{lbl('전용', 'owns')}</span>
        <IconArrowNarrowRight size={18} className="text-ink-3" />
      </span>
      <Box id="pga" label="PGA" mono hue="purple" state={st(on('pga'))} onSelect={onSelect} className="flex-1 py-2.5" />
    </div>
  )

  // ── SGA ────────────────────────────────────────────────────────────────
  const sga = (
    <Frame id="sga" kicker="SGA — System Global Area" hue="blue" state={st(on('sga'))} onSelect={onSelect}>
      <div className={cn('grid gap-2', dividerCols)}>
        <Box id="shared-pool" label="Shared Pool" hue="blue" state={st(on('shared-pool'))} onSelect={onSelect} />
        <Box id="buffer-cache" label={lbl('Database Buffer Cache', 'Database Buffer Cache')} hue="blue" state={st(on('buffer-cache'))} onSelect={onSelect} />
        <Box id="redo-buffer" label="Redo Log Buffer" hue="amber" state={st(on('redo-buffer'))} onSelect={onSelect} />
        <Box id="large-pool" label="Large Pool" hue="green" state={st(on('large-pool'))} onSelect={onSelect} />
        <Box id="java-pool" label="Java Pool" hue="green" state={st(on('java-pool'))} onSelect={onSelect} />
        <Box id="fixed-sga" label="Fixed SGA" hue="slate" state={st(on('fixed-sga'))} onSelect={onSelect} />
      </div>
    </Frame>
  )

  // ── Background Processes ────────────────────────────────────────────────
  const PROCS: { id: InstanceComponentId; label: string }[] = [
    { id: 'pmon', label: 'PMON' }, { id: 'smon', label: 'SMON' }, { id: 'dbwr', label: 'DBWn' }, { id: 'lgwr', label: 'LGWR' },
    { id: 'ckpt', label: 'CKPT' }, { id: 'mmon', label: 'MMON' }, { id: 'reco', label: 'RECO' }, { id: 'arcn', label: 'ARCn' },
  ]
  const bg = (
    <Frame id="dbwr" kicker={lbl('백그라운드 프로세스', 'Background Processes')} hue="amber" state={st(on('bg-processes', 'dbwr'))} onSelect={onSelect}>
      <div className={cn('grid gap-1.5', procCols)}>
        {PROCS.map((p) => (
          <Box key={p.id} id={p.id} label={p.label} mono hue="amber" state={st(on(p.id))} onSelect={onSelect} className="px-1 py-1.5" />
        ))}
      </div>
    </Frame>
  )

  // ── Database (files) ───────────────────────────────────────────────────
  const FILES: { id: InstanceComponentId; label: string }[] = [
    { id: 'disk', label: lbl('데이터 파일', 'Data Files') },
    { id: 'redo-log-file', label: lbl('온라인 리두 로그', 'Online Redo Log') },
    { id: 'control-file', label: lbl('컨트롤 파일', 'Control Files') },
    { id: 'archive-log', label: lbl('아카이브 로그', 'Archived Redo Log') },
  ]
  const db = (
    <Frame id="disk" kicker="Database" hue="slate" state={st(on('database', 'disk'))} onSelect={onSelect}>
      <div className={cn('grid gap-2', fileCols)}>
        {FILES.map((f) => (
          <Box key={f.id} id={f.id} label={f.label} hue="slate" state={st(on(f.id))} onSelect={onSelect} />
        ))}
      </div>
    </Frame>
  )

  // ── Instance → Database 커넥터 (어느 프로세스가 어느 파일을 쓰는지) ──────
  const connector = (
    <div className="flex items-center justify-center gap-4 py-0.5 text-ink-3">
      {[
        lbl('DBWn → 데이터', 'DBWn → data'),
        lbl('LGWR → 리두', 'LGWR → redo'),
        lbl('CKPT → 컨트롤', 'CKPT → control'),
        lbl('ARCn → 아카이브', 'ARCn → archive'),
      ].map((s) => (
        <span key={s} className="flex items-center gap-1 font-sans text-[8.5px] leading-none">
          {s}
          <IconArrowNarrowDown size={12} />
        </span>
      ))}
    </div>
  )

  return (
    <figure className={cn('flex flex-col gap-2.5 overflow-x-auto', className)}>
      {callout && <figcaption className="font-sans text-[11px] text-ink-2">{callout}</figcaption>}

      {clientRow}
      {!hideClient && (
        <div className="flex items-center gap-1.5 pl-1 text-ink-3">
          <IconArrowNarrowDown size={14} className="shrink-0" />
          <span className="font-sans text-[9px] leading-tight">
            {lbl('Server Process 가 SGA 를 읽기·쓰기 (모든 세션 공유)', 'Server Process reads / writes the SGA — shared by all sessions')}
          </span>
        </div>
      )}

      {/* Instance = SGA + Background Processes */}
      <div className="rounded-panel border border-line-2 bg-paper-sunk p-2.5">
        <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3">
          {lbl('Oracle Instance — 메모리 + 프로세스', 'Oracle Instance — memory + processes')}
        </div>
        <div className="flex flex-col gap-2">
          {sga}
          {bg}
        </div>
      </div>

      {connector}
      {db}
    </figure>
  )
}
