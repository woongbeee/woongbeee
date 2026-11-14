// ─── Instance Diagram ─────────────────────────────────────────────────────
// Oracle Database Concepts 의 "Database Instance" 그림을 살아 있는 화면으로 옮긴 것.
// 현재 단계의 스냅숏(InstanceState)을 그대로 그린다 — 커서 목록·버퍼 상태·Redo 양이 모두 실제 상태.
//   Client → Server Process(+PGA) → SGA(Shared Pool · Buffer Cache · Redo Log Buffer)
//   → Background Processes → Database Files

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { selectState, selectStep, useInternalsStore } from '@/store/internalsStore'
import { useLangStore } from '@/store/simulationStore'
import { REDO_BUFFER_BYTES, REDO_LOG_BYTES } from '@/lib/simulator/engine'
import type { Buffer, RedoLogGroup } from '@/lib/simulator/types'
import { cn } from '@/lib/utils'

type Hue = 'blue' | 'amber' | 'green' | 'purple' | 'slate'

const HUE: Record<Hue, { text: string; base: string; lit: string; accent: string; dot: string }> = {
  blue:   { text: 'text-viz-blue',   base: 'border-viz-blue/40',   lit: 'border-viz-blue bg-viz-blue/10 ring-2 ring-viz-blue/30',       accent: 'border-l-viz-blue',   dot: 'bg-viz-blue' },
  amber:  { text: 'text-viz-amber',  base: 'border-viz-amber/40',  lit: 'border-viz-amber bg-viz-amber/10 ring-2 ring-viz-amber/30',    accent: 'border-l-viz-amber',  dot: 'bg-viz-amber' },
  green:  { text: 'text-viz-green',  base: 'border-viz-green/40',  lit: 'border-viz-green bg-viz-green/10 ring-2 ring-viz-green/30',    accent: 'border-l-viz-green',  dot: 'bg-viz-green' },
  purple: { text: 'text-viz-purple', base: 'border-viz-purple/40', lit: 'border-viz-purple bg-viz-purple/10 ring-2 ring-viz-purple/30', accent: 'border-l-viz-purple', dot: 'bg-viz-purple' },
  slate:  { text: 'text-ink-2',      base: 'border-line-2',        lit: 'border-ink-3 bg-rail ring-2 ring-line-2',                      accent: 'border-l-line-2',     dot: 'bg-ink-3' },
}

const T = {
  ko: {
    client: 'SQL 을 보내고 결과를 받는 프로그램',
    server: '이 세션 전용. 파싱·실행·블록 읽기를 직접 해요',
    privateSql: '커서마다 하나씩. 바인드 값과 실행 상태',
    persistent: 'Persistent Area — 바인드 값',
    runtime: 'Run-Time Area — 실행 상태',
    noBinds: '바인드 없음',
    workArea: '정렬 · 해시 조인용 작업 공간',
    session: '로그인 정보 · 세션 변수 (UGA)',
    idle: '쉬는 중',
    noCursor: '열린 커서 없음',
    noTxn: '트랜잭션 없음',
    txn: '트랜잭션 진행 중',
    locks: '행 잠금',
    libraryCache: '파싱된 SQL 과 실행 계획을 모든 세션이 함께 써요',
    dictCache: '테이블 · 컬럼 · 권한 정보 (Row Cache)',
    emptyCache: '비어 있음 — 다음 SQL 은 Hard Parse',
    emptyDict: '비어 있음',
    execs: '회 실행',
    bufferCache: 'Data File 블록의 메모리 사본. Touch Count 로 LRU 관리',
    redoBuffer: '변경 기록(Redo Entry)이 디스크로 가기 전 머무는 곳',
    unwritten: '아직 안 쓴 Redo',
    otherPools: '이 시뮬레이션에서는 쓰지 않는 영역',
    alsoInPool: 'Shared Pool 안의 다른 영역',
    free: '빈 버퍼',
    clean: 'Clean',
    dirty: 'Dirty',
    uncommitted: '커밋 전 변경',
    dbw: 'Dirty 버퍼를 Data File 에 써요',
    lgwr: 'Redo Log Buffer 를 Online Redo Log 에 써요',
    ckpt: 'Checkpoint 위치를 Control File·Data File 헤더에 기록하고 DBW 를 깨워요',
    smon: '인스턴스 복구 · 임시 세그먼트 정리',
    pmon: '죽은 프로세스를 찾아내 뒷정리를 맡겨요',
    mmon: 'AWR 성능 통계 수집',
    arc: '다 찬 Online Redo Log 를 보관용으로 복사',
    system: 'Data Dictionary',
    users: '테이블 · 인덱스',
    undo: 'Undo Segment',
    temp: '넘친 정렬 · 해시',
    redoLogs: '모든 변경의 기록. 그룹을 돌려 가며 써요',
    archived: '개 보관됨',
    descOn: '설명 표시',
    descOff: '설명 숨김',
    descTip: '각 영역의 설명 문구를 펼치거나 숨겨요. 숨기면 마우스를 올렸을 때 말풍선으로 보여요.',
    controlFile: 'DB 구조 · Checkpoint SCN',
    archive: 'Online Redo Log 의 보관본',
  },
  en: {
    client: 'The program that sends SQL and receives results',
    server: 'Dedicated to this session: parses, executes and reads blocks itself',
    privateSql: 'One per cursor: bind values and execution state',
    persistent: 'Persistent area — bind values',
    runtime: 'Run-time area — execution state',
    noBinds: 'no binds',
    workArea: 'Workspace for sorts and hash joins',
    session: 'Logon info · session variables (UGA)',
    idle: 'idle',
    noCursor: 'no open cursor',
    noTxn: 'no transaction',
    txn: 'transaction active',
    locks: 'row locks',
    libraryCache: 'Parsed SQL and execution plans shared by all sessions',
    dictCache: 'Table · column · privilege definitions (row cache)',
    emptyCache: 'empty — the next SQL will hard parse',
    emptyDict: 'empty',
    execs: 'exec',
    bufferCache: 'In-memory copies of data file blocks, LRU-managed by touch count',
    redoBuffer: 'Where redo entries wait before going to disk',
    unwritten: 'redo not yet written',
    otherPools: 'Areas not used in this simulation',
    alsoInPool: 'Also inside the shared pool',
    free: 'Unused',
    clean: 'Clean',
    dirty: 'Dirty',
    uncommitted: 'uncommitted change',
    dbw: 'Writes dirty buffers to the data files',
    lgwr: 'Writes the redo log buffer to the online redo log',
    ckpt: 'Records the checkpoint position in the control file and data file headers; signals DBW',
    smon: 'Instance recovery · temporary segment cleanup',
    pmon: 'Detects dead processes and arranges their cleanup',
    mmon: 'Collects AWR performance statistics',
    arc: 'Copies filled online redo logs to archive storage',
    system: 'Data dictionary',
    users: 'Tables · indexes',
    undo: 'Undo segments',
    temp: 'Sort / hash spill',
    redoLogs: 'Record of every change, written group after group',
    archived: 'archived',
    descOn: 'Descriptions on',
    descOff: 'Descriptions off',
    descTip: 'Show or hide the description text of each area. When hidden, hover an area to see it as a tooltip.',
    controlFile: 'DB structure · checkpoint SCN',
    archive: 'Archived copies of the online redo log',
  },
}

function useActive(id: string) {
  return useInternalsStore((s) => selectStep(s)?.active.includes(id) ?? false)
}

// ── Primitives ────────────────────────────────────────────────────────────

/** 설명을 숨긴 상태에서 영역에 마우스를 올리면 뜨는 말풍선. 부모에 `group relative` 가 있어야 한다 */
function Tip({ text, up }: { text: string; up?: boolean }) {
  return (
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute left-0 z-30 hidden w-max max-w-[240px] rounded-card bg-ink px-2 py-1 font-sans text-[10.5px] font-normal leading-snug text-paper shadow-lg group-hover:block',
        up ? 'bottom-full mb-1' : 'top-full mt-1',
      )}
    >
      {text}
    </span>
  )
}

function Box({ id, label, desc, hue, className, tipUp, children }: {
  id: string; label: string; desc?: string; hue: Hue; className?: string; tipUp?: boolean; children?: ReactNode
}) {
  const active = useActive(id)
  const showDesc = useInternalsStore((s) => s.showDesc)
  const h = HUE[hue]
  return (
    <div className={cn('group relative flex min-w-0 flex-col rounded-card border px-2 py-1.5 transition-all duration-300 hover:z-30', active ? h.lit : cn('bg-paper', h.base), className)}>
      {desc && !showDesc && <Tip text={desc} up={tipUp} />}
      <div className="flex items-center gap-1.5">
        {active && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', h.dot)}
          />
        )}
        <span className={cn('truncate font-sans text-[11.5px] font-semibold', h.text)}>{label}</span>
      </div>
      {desc && showDesc && <div className="mt-0.5 font-sans text-[10px] leading-snug text-ink-3">{desc}</div>}
      {children && <div className="mt-1.5 min-h-0">{children}</div>}
    </div>
  )
}

function Frame({ kicker, note, hue, className, children }: { kicker: string; note?: string; hue: Hue; className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-panel border border-l-[3px] border-line bg-paper p-2', HUE[hue].accent, className)}>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-2">{kicker}</span>
        {note && <span className="truncate font-sans text-[10px] text-ink-3">{note}</span>}
      </div>
      {children}
    </div>
  )
}

function Process({ id, label, desc }: { id: string; label: string; desc: string }) {
  const active = useActive(id)
  const showDesc = useInternalsStore((s) => s.showDesc)
  return (
    <div
      className={cn(
        'group relative flex min-w-0 flex-col rounded-card border px-2 py-1 transition-all duration-300 hover:z-30',
        active ? HUE.amber.lit : 'border-viz-amber/40 bg-paper',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-bold text-viz-amber">{label}</span>
        {active && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="font-mono text-[8px] font-bold text-viz-amber"
          >
            ● ACTIVE
          </motion.span>
        )}
      </div>
      {showDesc ? <span className="line-clamp-2 font-sans text-[9.5px] leading-snug text-ink-3">{desc}</span> : <Tip text={desc} />}
    </div>
  )
}

const Mono = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('font-mono text-[9.5px] text-ink-2', className)}>{children}</span>
)

// ── Buffer Cache ──────────────────────────────────────────────────────────

const BUFFER_CLS: Record<Buffer['state'], string> = {
  free: 'border-dashed border-line-2 bg-rail text-ink-3',
  clean: 'border-viz-blue/40 bg-viz-blue/10 text-viz-blue',
  dirty: 'border-viz-amber bg-viz-amber/15 text-viz-amber',
}

function BufferCell({ buffer, touched, label }: { buffer: Buffer; touched: boolean; label: string }) {
  const b = buffer.block
  return (
    <motion.div
      animate={touched ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.5 }}
      title={b ? `${b.object} · block ${b.sub} · ${label} · touch count ${buffer.touch}` : label}
      className={cn(
        'relative flex h-[30px] flex-col items-center justify-center rounded-chip border font-mono leading-none transition-colors duration-300',
        BUFFER_CLS[buffer.state],
        touched && 'ring-2 ring-ink/50',
      )}
    >
      {b ? (
        <>
          <span className={cn('text-[8.5px] font-bold', b.kind === 'undo' && 'text-viz-purple')}>{b.abbr}</span>
          <span className="mt-0.5 text-[7.5px] opacity-80">{b.kind === 'index' ? `ix ${b.sub}` : `#${b.sub}`}</span>
        </>
      ) : (
        <span className="text-[8px]">·</span>
      )}
      {buffer.state === 'dirty' && buffer.uncommitted && (
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-viz-red" />
      )}
    </motion.div>
  )
}

function BufferCache() {
  const buffers = useInternalsStore((s) => selectState(s).buffers)
  const touched = useInternalsStore((s) => selectStep(s)?.touched)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const count = (state: Buffer['state']) => buffers.filter((b) => b.state === state).length
  const legend: { state: Buffer['state']; label: string }[] = [
    { state: 'free', label: t.free },
    { state: 'clean', label: t.clean },
    { state: 'dirty', label: t.dirty },
  ]
  return (
    <Box id="buffer-cache" label="Database Buffer Cache" desc={t.bufferCache} hue="blue">
      <div className="grid grid-cols-8 gap-1">
        {buffers.map((b) => (
          <BufferCell key={b.slot} buffer={b} touched={touched?.includes(b.slot) ?? false} label={t[b.state]} />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {legend.map((l) => (
          <span key={l.state} className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-[2px] border', BUFFER_CLS[l.state])} />
            <Mono>{l.label} {count(l.state)}</Mono>
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-viz-red" />
          <Mono>{t.uncommitted}</Mono>
        </span>
      </div>
    </Box>
  )
}

// ── Shared Pool ───────────────────────────────────────────────────────────

function LibraryCache() {
  const cursors = useInternalsStore((s) => selectState(s).cursors)
  const current = useInternalsStore((s) => selectState(s).pga.cursor)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  return (
    <Box id="library-cache" label="Library Cache" desc={t.libraryCache} hue="blue">
      <div className="overflow-hidden rounded-chip border border-line bg-paper">
        <div className="flex border-b border-line bg-rail px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-ink-3">
          <span className="w-[86px] shrink-0">sql_id</span>
          <span className="flex-1">shared sql area</span>
          <span>exec</span>
        </div>
        {cursors.length === 0 && <div className="px-1.5 py-1 font-sans text-[10px] text-ink-3">{t.emptyCache}</div>}
        {cursors.map((c) => (
          <motion.div
            key={c.sqlId}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            title={`${c.text}\nplan_hash_value ${c.planHash} · parse calls ${c.parseCalls}`}
            className={cn('flex items-center gap-1 px-1.5 py-0.5', c.text === current && 'bg-viz-blue/10')}
          >
            <Mono className={cn('w-[86px] shrink-0', c.text === current && 'font-bold text-viz-blue')}>{c.sqlId}</Mono>
            <Mono className="flex-1 truncate text-ink">{c.text}</Mono>
            <Mono>{c.executions}</Mono>
          </motion.div>
        ))}
      </div>
    </Box>
  )
}

function DictCache() {
  const objects = useInternalsStore((s) => selectState(s).dictCache)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  return (
    <Box id="dict-cache" label="Data Dictionary Cache" desc={t.dictCache} hue="blue">
      <div className="flex flex-wrap gap-1">
        {objects.length === 0 && <span className="font-sans text-[10px] text-ink-3">{t.emptyDict}</span>}
        {objects.map((o) => (
          <motion.span
            key={o}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-chip border border-viz-blue/40 bg-viz-blue/10 px-1 py-px font-mono text-[9px] text-viz-blue"
          >
            {o}
          </motion.span>
        ))}
      </div>
    </Box>
  )
}

// ── Redo Log Buffer ───────────────────────────────────────────────────────

function RedoBuffer() {
  const redo = useInternalsStore((s) => selectState(s).redoBuffer)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const pct = Math.min(100, (redo.bytes / REDO_BUFFER_BYTES) * 100)
  return (
    <Box id="redo-buffer" label="Redo Log Buffer" desc={t.redoBuffer} hue="amber">
      <div className="relative h-2 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full bg-viz-amber" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        {/* 1/3 지점 — 여기를 넘으면 LGWR 가 쓴다 */}
        <span className="absolute left-1/3 top-0 h-full w-px bg-ink-3" />
      </div>
      <div className="mt-1 flex justify-between">
        <Mono>{t.unwritten}: {redo.bytes.toLocaleString()} B</Mono>
        <Mono>{redo.entries} entries</Mono>
      </div>
    </Box>
  )
}

// ── Online Redo Log ───────────────────────────────────────────────────────

const LOG_CLS: Record<RedoLogGroup['status'], string> = {
  UNUSED: 'border-dashed border-line-2 text-ink-3',
  CURRENT: 'border-viz-amber bg-viz-amber/15 text-viz-amber',
  ACTIVE: 'border-viz-blue/50 bg-viz-blue/10 text-viz-blue',
  INACTIVE: 'border-line-2 bg-rail text-ink-2',
}

function RedoLogs() {
  const redoLog = useInternalsStore((s) => selectState(s).redoLog)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const pct = Math.min(100, (redoLog.bytes / REDO_LOG_BYTES) * 100)
  return (
    <Box id="redo-logs" label="Online Redo Log" desc={t.redoLogs} hue="slate" tipUp>
      <div className="grid grid-cols-3 gap-1">
        {redoLog.groups.map((g, i) => (
          <div
            key={g.group}
            title={`Group ${g.group} · log sequence ${g.sequence || '–'} · ${g.status}`}
            className={cn('flex flex-col items-center rounded-chip border px-0.5 py-0.5 font-mono leading-tight transition-colors duration-300', LOG_CLS[g.status])}
          >
            <span className="text-[8.5px] font-bold">G{g.group} · #{g.sequence || '–'}</span>
            <span className="text-[7px]">{g.status}</span>
            <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full bg-viz-amber"
                animate={{ width: i === redoLog.current ? `${pct}%` : g.status === 'UNUSED' ? '0%' : '100%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Box>
  )
}

// ── PGA ───────────────────────────────────────────────────────────────────

function Pga() {
  const pga = useInternalsStore((s) => selectState(s).pga)
  const txn = useInternalsStore((s) => selectState(s).txn)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  return (
    <Frame kicker="PGA — Program Global Area" hue="purple" className="min-w-0 flex-1">
      <div className="grid grid-cols-3 gap-1.5">
        <Box id="pga-private" label="Private SQL Area" desc={t.privateSql} hue="purple">
          {pga.cursor ? (
            <div className="space-y-0.5">
              <div className="truncate font-mono text-[9.5px] text-ink" title={pga.cursor}>{pga.cursor}</div>
              <div className="flex flex-wrap items-center gap-1" title={t.persistent}>
                <span className="font-mono text-[8px] uppercase tracking-wider text-ink-3">persistent</span>
                {pga.binds.length === 0 && <Mono className="text-[8.5px] text-ink-3">{t.noBinds}</Mono>}
                {pga.binds.map((b) => (
                  <span key={b} className="rounded-chip border border-line px-1 font-mono text-[8.5px] text-ink-2">{b}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1" title={t.runtime}>
                <span className="font-mono text-[8px] uppercase tracking-wider text-ink-3">run-time</span>
                {pga.phase && <span className="rounded-chip bg-viz-purple/15 px-1 font-mono text-[8.5px] font-bold text-viz-purple">{pga.phase}</span>}
              </div>
            </div>
          ) : (
            <Mono className="text-ink-3">{t.noCursor}</Mono>
          )}
        </Box>
        <Box id="pga-work" label="SQL Work Area" desc={t.workArea} hue="purple">
          <Mono className={pga.workArea ? 'font-bold text-viz-purple' : 'text-ink-3'}>{pga.workArea ?? t.idle}</Mono>
        </Box>
        <Box id="pga-session" label="Session Memory" desc={t.session} hue="purple">
          {txn ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-viz-red" />
                <Mono className="font-bold text-viz-red">{t.txn}</Mono>
              </div>
              <Mono>XID {txn.xid} · {t.locks} {txn.rowLocks}</Mono>
            </div>
          ) : (
            <Mono className="text-ink-3">{t.noTxn}</Mono>
          )}
        </Box>
      </div>
    </Frame>
  )
}

// ── Diagram ───────────────────────────────────────────────────────────────

function Arrow() {
  return <span className="shrink-0 self-center font-mono text-xs text-ink-3">→</span>
}

export function InstanceDiagram() {
  const lang = useLangStore((s) => s.lang)
  const scn = useInternalsStore((s) => selectState(s).scn)
  const checkpointScn = useInternalsStore((s) => selectState(s).checkpointScn)
  const archivedLogs = useInternalsStore((s) => selectState(s).archivedLogs)
  const showDesc = useInternalsStore((s) => s.showDesc)
  const toggleDesc = useInternalsStore((s) => s.toggleDesc)
  const t = T[lang]

  return (
    <div className="flex min-h-full flex-col gap-2 bg-paper-sunk p-3">
      {/* Client → Server Process + PGA */}
      <div className="flex items-stretch gap-2">
        <Box id="client" label="Client Process" desc={t.client} hue="slate" className="w-[150px] shrink-0" />
        <Arrow />
        <Box id="server-process" label="Server Process" desc={t.server} hue="green" className="w-[170px] shrink-0" />
        <Pga />
      </div>

      {/* Instance = SGA + Background Processes */}
      <div className="rounded-panel border border-dashed border-line-2 p-2">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-viz-green" />
          <span className="font-mono text-[10px] font-bold text-ink">Database Instance</span>
          <Mono className="ml-auto">SCN {scn.toLocaleString()}</Mono>
          <button
            onClick={toggleDesc}
            title={t.descTip}
            aria-pressed={showDesc}
            className="flex items-center gap-1.5 rounded-chip border border-line bg-paper px-1.5 py-0.5 font-sans text-[10px] text-ink-2 transition-colors hover:bg-rail hover:text-ink"
          >
            <span className={cn('relative h-2.5 w-[18px] rounded-full transition-colors', showDesc ? 'bg-viz-green' : 'bg-line-2')}>
              <span className={cn('absolute top-px h-2 w-2 rounded-full bg-paper transition-all', showDesc ? 'left-[9px]' : 'left-px')} />
            </span>
            {showDesc ? t.descOn : t.descOff}
          </button>
        </div>

        <Frame kicker="SGA — System Global Area" hue="blue">
          <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-2">
            <Frame kicker="Shared Pool" hue="blue" className="flex flex-col gap-1.5">
              <LibraryCache />
              <DictCache />
              {/* Server Result Cache 와 Reserved Pool 도 Shared Pool 의 일부다 */}
              <div className="flex flex-wrap items-center gap-1.5" title={t.alsoInPool}>
                {['Server Result Cache', 'Reserved Pool'].map((p) => (
                  <span key={p} className="rounded-chip border border-dashed border-line-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-3">{p}</span>
                ))}
              </div>
            </Frame>
            <div className="flex min-w-0 flex-col gap-2">
              <BufferCache />
              <RedoBuffer />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5" title={t.otherPools}>
            {['Large Pool', 'Java Pool', 'Streams Pool', 'Fixed SGA', 'In-Memory Area'].map((p) => (
              <span key={p} className="rounded-chip border border-dashed border-line-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-3">{p}</span>
            ))}
            <span className="font-sans text-[10px] text-ink-3">— {t.otherPools}</span>
          </div>
        </Frame>

        <Frame kicker="Background Processes" hue="amber" className="mt-2">
          <div className="grid grid-cols-7 gap-1.5">
            <Process id="dbw" label="DBW" desc={t.dbw} />
            <Process id="lgwr" label="LGWR" desc={t.lgwr} />
            <Process id="ckpt" label="CKPT" desc={t.ckpt} />
            <Process id="smon" label="SMON" desc={t.smon} />
            <Process id="pmon" label="PMON" desc={t.pmon} />
            <Process id="mmon" label="MMON" desc={t.mmon} />
            <Process id="arc" label="ARCn" desc={t.arc} />
          </div>
        </Frame>
      </div>

      {/* Database = files on disk */}
      <Frame kicker="Database — Physical Files" hue="slate">
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)] gap-2">
          <Frame kicker="Data Files" hue="slate">
            <div className="grid grid-cols-4 gap-1.5">
              <Box id="df-system" label="SYSTEM" desc={t.system} hue="slate" tipUp />
              <Box id="df-users" label="USERS" desc={t.users} hue="slate" tipUp />
              <Box id="df-undo" label="UNDO" desc={t.undo} hue="slate" tipUp />
              <Box id="df-temp" label="TEMP" desc={t.temp} hue="slate" tipUp />
            </div>
          </Frame>
          <RedoLogs />
          <Box id="control-file" label="Control File" desc={t.controlFile} hue="slate" tipUp>
            <Mono>ckpt SCN {checkpointScn.toLocaleString()}</Mono>
          </Box>
          <Box id="archive-logs" label="Archived Redo Log" desc={t.archive} hue="slate" tipUp>
            <Mono>{lang === 'ko' ? `${archivedLogs}${t.archived}` : `${archivedLogs} ${t.archived}`}</Mono>
          </Box>
        </div>
      </Frame>
    </div>
  )
}
