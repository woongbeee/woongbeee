import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, InfoBox, Divider } from '../../../shared'
import { OracleInstanceMap } from '../../shared/OracleInstanceMap'
import type { InstanceComponentId } from '../../shared/OracleInstanceMap'
import { cn } from '@/lib/utils'
import {
  IconCpu,
  IconDatabase,
  IconServer,
  IconNetwork,
} from '@tabler/icons-react'

// ── Translation strings ────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'SGA — System Global Area',
    subtitle: '모든 서버 프로세스와 백그라운드 프로세스가 함께 읽고 쓰는 공용 메모리 공간입니다. Oracle 인스턴스가 시작될 때 운영체제로부터 한 번에 예약하며, 인스턴스가 살아 있는 동안 유지됩니다.',

    whatTitle: 'SGA란 무엇인가?',
    whatP1: 'Oracle 인스턴스를 시작하면 OS가 메모리의 한 영역을 통째로 Oracle에게 넘깁니다. 이 영역이 SGA(System Global Area)입니다. 서버에 접속한 모든 세션, 모든 백그라운드 프로세스가 이 메모리를 공유합니다.',
    whatP2: 'PGA가 "내 방(세션 전용)"이라면 SGA는 "공용 라운지"입니다. Buffer Cache, Shared Pool, Redo Log Buffer 등 Oracle의 핵심 캐시 구조가 모두 SGA 안에 있습니다. SGA의 크기와 구성 방식은 성능과 직결되며, DBA가 가장 먼저 튜닝하는 영역이기도 합니다.',
    whatP3: 'Oracle 10g부터는 ASMM(Automatic Shared Memory Management)으로 SGA 내부 구성 요소의 크기를 자동으로 조정할 수 있고, 12c부터는 SGA와 PGA를 합친 Memory Target(AMM)도 지원합니다.',

    serverModeTitle: 'Dedicated Server vs RAC — SGA가 달라지는 방식',
    serverModeDesc: '동일한 SGA 개념이 서버 구성 방식에 따라 어떻게 달라지는지 살펴봅니다.',

    dedicatedLabel: 'Dedicated Server',
    racLabel: 'RAC (Real Application Clusters)',

    dedicatedDesc: '가장 일반적인 구성입니다. 서버 한 대 위에서 Oracle 인스턴스 하나가 뜨고, 그 인스턴스의 SGA를 모든 세션이 공유합니다. SGA는 서버 물리 메모리 위에 단 하나 존재합니다.',
    racDesc: '여러 서버(노드)가 동일한 데이터베이스 파일을 공유하는 고가용성 아키텍처입니다. 각 노드는 독립적인 인스턴스와 독립적인 SGA를 가집니다. 노드 간 데이터 일관성은 GCS/GES 레이어(Cache Fusion)가 네트워크를 통해 유지합니다.',

    tableHeaders: ['항목', 'Dedicated Server', 'RAC'],
    tableHeadersEn: ['Item', 'Dedicated Server', 'RAC'],

    componentsTitle: 'SGA 구성 요소',
    componentsDesc: '각 항목을 클릭하면 다이어그램에서 해당 위치가 강조됩니다.',
    clickHint: '항목을 클릭하세요',
  },
  en: {
    title: 'SGA — System Global Area',
    subtitle: 'The shared memory region read and written by every server process and background process. Oracle reserves it from the OS when the instance starts and holds it for the lifetime of the instance.',

    whatTitle: 'What is the SGA?',
    whatP1: 'When Oracle starts an instance, the OS hands over a contiguous region of memory entirely to Oracle. That region is the SGA (System Global Area). Every session connected to the server and every background process share this same memory.',
    whatP2: "If PGA is \"your private room,\" then SGA is the \"shared lounge.\" The Buffer Cache, Shared Pool, Redo Log Buffer, and other core Oracle caches all live inside the SGA. Its size and layout directly impact performance — it is typically the first place a DBA tunes.",
    whatP3: 'Since Oracle 10g, ASMM (Automatic Shared Memory Management) can auto-resize SGA components. From 12c onward, AMM (Automatic Memory Management) can manage the combined SGA + PGA budget automatically.',

    serverModeTitle: 'Dedicated Server vs RAC — How the SGA Differs',
    serverModeDesc: 'The same SGA concept behaves differently depending on how the server is configured.',

    dedicatedLabel: 'Dedicated Server',
    racLabel: 'RAC (Real Application Clusters)',

    dedicatedDesc: 'The most common setup. A single Oracle instance runs on one server, and all sessions share that instance\'s SGA. There is exactly one SGA on the physical machine.',
    racDesc: 'A high-availability architecture where multiple servers (nodes) share the same database files. Each node has its own independent instance and its own SGA. Cross-node data consistency is maintained by the GCS/GES layer (Cache Fusion) over the interconnect network.',

    tableHeaders: ['Item', 'Dedicated Server', 'RAC'],
    tableHeadersEn: ['Item', 'Dedicated Server', 'RAC'],

    componentsTitle: 'SGA Components',
    componentsDesc: 'Click any component to highlight it in the diagram.',
    clickHint: 'Click a component',
  },
}

// ── Dedicated vs RAC table data ────────────────────────────────────────────

const COMPARISON_ROWS = {
  ko: [
    ['인스턴스 수', '서버 1대 → 인스턴스 1개', '서버 N대 → 인스턴스 N개'],
    ['SGA 수', '전체에 SGA 1개', '노드마다 독립적인 SGA 1개'],
    ['Buffer Cache 공유', '단일 캐시, 모든 세션 공유', '노드별 로컬 캐시 + Cache Fusion으로 동기화'],
    ['Shared Pool 공유', '단일 Library Cache · Dict Cache', '노드별 독립, 커서 공유 불가'],
    ['장애 복구', '인스턴스 다운 → 서비스 중단', '다른 노드가 요청을 이어받아 서비스 지속'],
    ['주 사용 목적', '일반 OLTP · DW 환경', '고가용성(HA) · 스케일아웃 OLTP'],
  ],
  en: [
    ['Instances', '1 server → 1 instance', 'N servers → N instances'],
    ['SGA count', 'One SGA for the whole system', 'One independent SGA per node'],
    ['Buffer Cache sharing', 'Single cache shared by all sessions', 'Per-node local cache + Cache Fusion for sync'],
    ['Shared Pool sharing', 'Single Library Cache & Dict Cache', 'Independent per node — cursors not shared'],
    ['Failure recovery', 'Instance down → service outage', 'Other nodes take over — service continues'],
    ['Typical use case', 'General OLTP & DW', 'High availability (HA) & scale-out OLTP'],
  ],
}

// ── SGA component definitions ──────────────────────────────────────────────

type SgaDetail = { term: string; desc: string; isParam?: boolean }

type SgaComponent = {
  id: string
  highlightIds: InstanceComponentId[]
  labelKo: string
  labelEn: string
  tagColor: string
  descKo: string
  descEn: string
  detailsKo: SgaDetail[]
  detailsEn: SgaDetail[]
}

const SGA_COMPONENTS: SgaComponent[] = [
  {
    id: 'buffer-cache',
    highlightIds: ['buffer-cache'],
    labelKo: 'Buffer Cache',
    labelEn: 'Buffer Cache',
    tagColor: 'bg-blue-500',
    descKo: '디스크에서 읽어온 데이터 블록(기본 8KB)을 메모리에 보관하는 캐시입니다. 같은 블록이 다시 필요할 때 디스크 접근 없이 메모리에서 바로 꺼내 씁니다. SGA 안에서 가장 큰 비중을 차지하며, Oracle 성능의 핵심 지표인 Buffer Cache Hit Ratio에 직접 영향을 줍니다.',
    descEn: 'A cache that holds data blocks (8 KB by default) read from disk. When the same block is needed again, Oracle serves it from memory instead of hitting disk. It is the largest component in the SGA and directly determines the Buffer Cache Hit Ratio — Oracle\'s most watched performance metric.',
    detailsKo: [
      { term: 'LRU 알고리즘', desc: '가장 오래 사용되지 않은 블록을 밀어내어 새 블록을 올릴 공간을 확보합니다.' },
      { term: 'Dirty Buffer', desc: '메모리에서 수정됐지만 아직 디스크에 쓰이지 않은 블록. DBWn이 플러시합니다.' },
      { term: 'DB_CACHE_SIZE', desc: 'SGA 내 Buffer Cache 크기를 지정하는 파라미터. ASMM 사용 시 자동 조정됩니다.', isParam: true },
    ],
    detailsEn: [
      { term: 'LRU algorithm', desc: 'Evicts the least recently used block to make room for a new one.' },
      { term: 'Dirty Buffer', desc: 'A block modified in memory but not yet written to disk. Flushed by DBWn.' },
      { term: 'DB_CACHE_SIZE', desc: 'Parameter that sets Buffer Cache size within the SGA. Auto-adjusted under ASMM.', isParam: true },
    ],
  },
  {
    id: 'shared-pool',
    highlightIds: ['shared-pool', 'library-cache', 'dict-cache'],
    labelKo: 'Shared Pool',
    labelEn: 'Shared Pool',
    tagColor: 'bg-indigo-500',
    descKo: 'SQL 파싱 결과(실행 계획)와 테이블·컬럼 메타데이터를 캐시하는 영역입니다. Library Cache와 Dictionary Cache(Row Cache)로 구성됩니다. 같은 SQL이 다시 오면 파싱을 건너뛰고 Library Cache의 커서를 재사용(Soft Parse)하여 CPU를 절약합니다.',
    descEn: 'Caches SQL parse results (execution plans) and table/column metadata. Consists of the Library Cache and Dictionary Cache (Row Cache). When the same SQL arrives again, Oracle skips parsing and reuses the cached cursor (Soft Parse), saving CPU.',
    detailsKo: [
      { term: 'Library Cache', desc: 'SQL 커서(파싱 트리 + 실행 계획)를 저장. Hard Parse 비용을 줄이는 핵심 구조.' },
      { term: 'Dictionary Cache', desc: '테이블·컬럼·권한 등 딕셔너리 메타데이터를 행 단위로 캐시. Row Cache라고도 부름.' },
      { term: 'SHARED_POOL_SIZE', desc: 'Shared Pool 크기 파라미터. Library Cache 래치 경합이 심하면 늘려야 합니다.', isParam: true },
    ],
    detailsEn: [
      { term: 'Library Cache', desc: 'Stores SQL cursors (parse tree + execution plan). Core structure for reducing Hard Parse cost.' },
      { term: 'Dictionary Cache', desc: 'Caches dictionary metadata (tables, columns, privileges) row by row. Also called Row Cache.' },
      { term: 'SHARED_POOL_SIZE', desc: 'Parameter for Shared Pool size. Increase if Library Cache latch contention is high.', isParam: true },
    ],
  },
  {
    id: 'redo-buffer',
    highlightIds: ['redo-buffer'],
    labelKo: 'Redo Log Buffer',
    labelEn: 'Redo Log Buffer',
    tagColor: 'bg-orange-500',
    descKo: '데이터 변경 내역("이 블록의 이 값을 저 값으로 바꿨다")을 순서대로 기록하는 메모리 링 버퍼입니다. LGWR가 주기적으로, 그리고 COMMIT 시 즉시 디스크 Redo Log File에 내려씁니다. 크기가 작은 편이며 빠른 순차 쓰기를 위해 설계됐습니다.',
    descEn: 'A circular memory buffer that records data change vectors ("change this value in this block to that value") in sequence. LGWR periodically flushes it to disk, and always flushes it immediately at COMMIT. It is intentionally small and designed for fast sequential writes.',
    detailsKo: [
      { term: 'WAL 원칙', desc: 'Redo Log Buffer가 디스크에 먼저 기록돼야 Buffer Cache의 변경이 유효합니다.' },
      { term: 'Redo Log Buffer Allocation Latch', desc: '버퍼에 항목을 쓸 때 보호하는 래치. 경합 시 log buffer space 대기 이벤트가 발생합니다.' },
      { term: 'LOG_BUFFER', desc: 'Redo Log Buffer 크기 파라미터. 일반적으로 4MB~16MB. 너무 크면 LGWR 지연이 생깁니다.', isParam: true },
    ],
    detailsEn: [
      { term: 'WAL principle', desc: 'The Redo Log Buffer must be flushed to disk before a Buffer Cache change is considered durable.' },
      { term: 'Redo Log Buffer Allocation Latch', desc: 'Protects writes to the buffer. Contention causes the "log buffer space" wait event.' },
      { term: 'LOG_BUFFER', desc: 'Parameter for Redo Log Buffer size. Typically 4–16 MB. Too large delays LGWR flushes.', isParam: true },
    ],
  },
  {
    id: 'undo',
    highlightIds: ['undo'],
    labelKo: 'Undo Segment (UNDO Tablespace)',
    labelEn: 'Undo Segment (UNDO Tablespace)',
    tagColor: 'bg-amber-500',
    descKo: 'UPDATE·DELETE 전 원본 값을 보관하는 영역입니다. 엄밀히는 디스크 UNDO Tablespace에 저장되지만, SGA의 Buffer Cache 안에 Undo 블록이 올라와 관리됩니다. ROLLBACK 시 원본 복원, 읽기 일관성(MVCC) 시 이전 버전 재구성에 사용합니다.',
    descEn: "Stores before-images of rows before UPDATE or DELETE. Strictly speaking it lives on disk in the UNDO Tablespace, but undo blocks are loaded into the Buffer Cache for in-memory management. Used to restore data on ROLLBACK and to reconstruct old row versions for read consistency (MVCC).",
    detailsKo: [
      { term: 'MVCC', desc: '읽는 쪽이 쓰는 쪽을 기다리지 않습니다. Oracle이 Undo로 이전 시점의 데이터를 재구성해 줍니다.' },
      { term: 'Automatic Undo Management', desc: 'Oracle이 UNDO Tablespace를 자동 관리. 수동 Rollback Segment 방식을 대체합니다.' },
      { term: 'UNDO_RETENTION', desc: 'Undo 데이터를 최소 몇 초 보유할지 설정. 긴 쿼리가 ORA-01555를 피하려면 충분히 설정해야 합니다.', isParam: true },
    ],
    detailsEn: [
      { term: 'MVCC', desc: "Readers don't wait for writers. Oracle reconstructs an older version of the data from Undo on demand." },
      { term: 'Automatic Undo Management', desc: 'Oracle manages the UNDO Tablespace automatically, replacing the manual Rollback Segment approach.' },
      { term: 'UNDO_RETENTION', desc: 'Sets the minimum seconds to retain undo data. Must be long enough to prevent ORA-01555 for long queries.', isParam: true },
    ],
  },
]

// ── ServerModeCard ─────────────────────────────────────────────────────────

function ServerModeCard({
  icon,
  label,
  desc,
  active,
  onClick,
  accentCls,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  active: boolean
  onClick: () => void
  accentCls: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 rounded-xl border-2 p-4 text-left transition-all',
        active ? accentCls : 'border-border bg-card hover:border-slate-300',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('shrink-0', active ? '' : 'opacity-50')}>{icon}</span>
        <span className={cn('font-mono text-xs font-bold', active ? '' : 'text-muted-foreground')}>{label}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </button>
  )
}

// ── SgaDiagram (simplified inline) ────────────────────────────────────────

function SgaDiagram({
  activeId,
  onSelect,
}: {
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const lang = useSimulationStore((s) => s.lang)

  const components = [
    { id: 'buffer-cache',  labelKo: 'Buffer Cache',     labelEn: 'Buffer Cache',     size: 'flex-[3]', baseColor: 'border-blue-200 bg-blue-50/60 text-blue-700',   activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300 text-blue-800'   },
    { id: 'shared-pool',   labelKo: 'Shared Pool',      labelEn: 'Shared Pool',      size: 'flex-[2]', baseColor: 'border-indigo-200 bg-indigo-50/60 text-indigo-700', activeColor: 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-300 text-indigo-800' },
    { id: 'redo-buffer',   labelKo: 'Redo Log Buffer',  labelEn: 'Redo Log Buffer',  size: 'flex-[2]', baseColor: 'border-orange-200 bg-orange-50/60 text-orange-700', activeColor: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300 text-orange-800' },
    { id: 'undo',          labelKo: 'Undo Segment',     labelEn: 'Undo Segment',     size: 'flex-[2]', baseColor: 'border-amber-200 bg-amber-50/60 text-amber-700',  activeColor: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300 text-amber-800'  },
  ]

  const subComponents: Record<string, Array<{ labelKo: string; labelEn: string }>> = {
    'shared-pool': [
      { labelKo: 'Library Cache', labelEn: 'Library Cache' },
      { labelKo: 'Dict Cache',    labelEn: 'Dict Cache' },
    ],
  }

  return (
    <div className="rounded-2xl border-2 border-blue-300 bg-blue-50/30 p-4">
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
        SGA — System Global Area
      </div>
      <div className="flex gap-2">
        {components.map((c) => {
          const isActive = activeId === c.id
          const sub = subComponents[c.id]
          return (
            <motion.button
              key={c.id}
              onClick={() => onSelect(c.id)}
              animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={isActive ? { repeat: Infinity, duration: 1.4, repeatDelay: 0.4 } : {}}
              className={cn(
                c.size,
                'relative rounded-xl border-2 p-3 text-left transition-all cursor-pointer',
                isActive ? c.activeColor : c.baseColor,
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <span className="text-[8px] font-bold">★</span>
                </motion.div>
              )}
              <div className="font-mono text-[11px] font-bold leading-tight">
                {lang === 'ko' ? c.labelKo : c.labelEn}
              </div>
              {sub && (
                <div className="mt-2 flex flex-col gap-1">
                  {sub.map((s, i) => (
                    <div key={i} className="rounded-md border border-current/20 bg-white/50 px-2 py-1 font-mono text-[9px] font-semibold opacity-80">
                      {lang === 'ko' ? s.labelKo : s.labelEn}
                    </div>
                  ))}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ── SgaSection ─────────────────────────────────────────────────────────────

export function SgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [serverMode, setServerMode] = useState<'dedicated' | 'rac'>('dedicated')
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null)

  const activeComponent = SGA_COMPONENTS.find((c) => c.id === activeComponentId) ?? null
  const highlightIds: InstanceComponentId[] = activeComponent
    ? activeComponent.highlightIds
    : ['sga', 'buffer-cache', 'shared-pool', 'library-cache', 'dict-cache', 'redo-buffer', 'undo']

  function handleComponentSelect(id: string) {
    setActiveComponentId((prev) => (prev === id ? null : id))
  }

  const comparisonRows = COMPARISON_ROWS[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        icon={<IconCpu size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* ── 1. SGA란? ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>

      <div className="grid grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <Prose>{t.whatP1}</Prose>
          <Prose>{t.whatP2}</Prose>
          <Prose>{t.whatP3}</Prose>
        </div>
        <div className="sticky top-6">
          <OracleInstanceMap highlightIds={highlightIds} />
        </div>
      </div>

      <Divider />

      {/* ── 2. Dedicated vs RAC ── */}
      <SectionTitle>{t.serverModeTitle}</SectionTitle>
      <Prose>{t.serverModeDesc}</Prose>

      <div className="flex gap-3 mb-6">
        <ServerModeCard
          icon={<IconServer size={16} className="text-teal-600" />}
          label={t.dedicatedLabel}
          desc={t.dedicatedDesc}
          active={serverMode === 'dedicated'}
          onClick={() => setServerMode('dedicated')}
          accentCls="border-teal-400 bg-teal-50/60"
        />
        <ServerModeCard
          icon={<IconNetwork size={16} className="text-violet-600" />}
          label={t.racLabel}
          desc={t.racDesc}
          active={serverMode === 'rac'}
          onClick={() => setServerMode('rac')}
          accentCls="border-violet-400 bg-violet-50/60"
        />
      </div>

      {/* Dedicated diagram */}
      <AnimatePresence mode="wait">
        {serverMode === 'dedicated' ? (
          <motion.div
            key="dedicated"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mb-6 rounded-xl border border-teal-200 bg-teal-50/40 p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <IconServer size={14} className="text-teal-600" />
              <span className="font-mono text-xs font-bold text-teal-700">
                {lang === 'ko' ? '단일 서버 · 단일 인스턴스' : 'Single Server · Single Instance'}
              </span>
            </div>
            <div className="flex gap-4 items-center">
              {/* Server box */}
              <div className="flex-1 rounded-xl border-2 border-teal-300 bg-white/80 p-4">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase text-teal-600/60">Server</div>
                <div className="rounded-lg border-2 border-blue-300 bg-blue-50/40 p-3">
                  <div className="mb-1.5 font-mono text-[10px] font-bold text-blue-600/70 uppercase">Oracle Instance</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    <div className="rounded-md border border-blue-200 bg-blue-100/60 px-2 py-1.5 font-mono text-[10px] font-bold text-blue-700 text-center">SGA</div>
                    <div className="rounded-md border border-teal-200 bg-teal-100/60 px-2 py-1.5 font-mono text-[10px] font-bold text-teal-700 text-center">PGA × N</div>
                  </div>
                  <div className="flex gap-1.5">
                    {['Session 1', 'Session 2', 'Session 3'].map((s) => (
                      <div key={s} className="flex-1 rounded border border-teal-200 bg-teal-50 px-1.5 py-1 font-mono text-[9px] text-teal-600 text-center">{s}</div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Arrow + DB files */}
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <span className="font-mono text-[10px]">I/O</span>
                <span className="text-lg">⟷</span>
              </div>
              <div className="rounded-xl border-2 border-slate-300 bg-slate-50/60 px-5 py-4 font-mono text-[10px] text-slate-500 text-center">
                <IconDatabase size={20} className="mx-auto mb-1 text-slate-400" />
                {lang === 'ko' ? '공유 DB 파일' : 'DB Files'}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="rac"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mb-6 rounded-xl border border-violet-200 bg-violet-50/40 p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <IconNetwork size={14} className="text-violet-600" />
              <span className="font-mono text-xs font-bold text-violet-700">
                {lang === 'ko' ? '다중 노드 · 각자 독립적인 SGA' : 'Multiple Nodes · Independent SGA per Node'}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              {/* Node 1 */}
              {[
                lang === 'ko' ? '노드 1' : 'Node 1',
                lang === 'ko' ? '노드 2' : 'Node 2',
              ].map((nodeLabel, ni) => (
                <div key={ni} className="flex-1 rounded-xl border-2 border-violet-300 bg-white/80 p-3">
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase text-violet-600/70">{nodeLabel}</div>
                  <div className="rounded-lg border-2 border-blue-300 bg-blue-50/40 p-2">
                    <div className="mb-1 font-mono text-[9px] font-bold text-blue-600/60 uppercase">Instance {ni + 1}</div>
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <div className="rounded border border-blue-200 bg-blue-100/60 px-1.5 py-1 font-mono text-[9px] font-bold text-blue-700 text-center">SGA</div>
                      <div className="rounded border border-teal-200 bg-teal-100/60 px-1.5 py-1 font-mono text-[9px] font-bold text-teal-700 text-center">PGA</div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Interconnect */}
              <div className="flex flex-col items-center gap-0.5 px-1">
                <span className="font-mono text-[9px] text-violet-500">Cache</span>
                <span className="font-mono text-[9px] text-violet-500">Fusion</span>
                <span className="text-violet-400 text-sm">⟷</span>
              </div>
              {/* Arrow + shared DB */}
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <span className="font-mono text-[10px]">I/O</span>
                <span className="text-lg">⟷</span>
              </div>
              <div className="rounded-xl border-2 border-slate-300 bg-slate-50/60 px-4 py-3 font-mono text-[10px] text-slate-500 text-center">
                <IconDatabase size={18} className="mx-auto mb-1 text-slate-400" />
                {lang === 'ko' ? '공유 DB 파일' : 'Shared DB'}
                <div className="mt-0.5 text-[9px] text-violet-500">{lang === 'ko' ? '(모든 노드 공유)' : '(all nodes)'}</div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-violet-600/80">
              {lang === 'ko'
                ? '⚡ Cache Fusion: 노드 1이 수정한 블록을 노드 2가 필요하면 디스크 대신 네트워크 인터커넥트로 직접 전달합니다.'
                : '⚡ Cache Fusion: If Node 2 needs a block modified by Node 1, Oracle sends it over the interconnect directly — no disk involved.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison table */}
      <div className="overflow-hidden rounded-xl border mb-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/60">
              {t.tableHeaders.map((h, i) => (
                <th key={i} className={cn('px-4 py-2.5 text-left font-mono font-bold text-muted-foreground', i === 0 ? 'w-[160px]' : '')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, ri) => (
              <tr key={ri} className={cn('border-b last:border-0', ri % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                {row.map((cell, ci) => (
                  <td key={ci} className={cn('px-4 py-2 font-mono text-[11px]', ci === 0 ? 'font-bold text-foreground/80' : 'text-muted-foreground')}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InfoBox variant="note">
        {lang === 'ko' ? (
          <>RAC는 고가용성과 수평 확장을 제공하지만, Cache Fusion 트래픽으로 인한 <strong>인터커넥트 지연</strong>이 새로운 병목이 될 수 있습니다. 단일 인스턴스보다 복잡한 튜닝이 필요합니다.</>
        ) : (
          <>RAC provides high availability and horizontal scale-out, but <strong>interconnect latency</strong> from Cache Fusion traffic can introduce new bottlenecks. Tuning is significantly more complex than a single-instance setup.</>
        )}
      </InfoBox>

      <Divider />

      {/* ── 3. SGA 구성 요소 ── */}
      <SectionTitle>{t.componentsTitle}</SectionTitle>
      <Prose>{t.componentsDesc}</Prose>

      <div className="space-y-4">
        {/* SGA diagram */}
        <SgaDiagram activeId={activeComponentId} onSelect={handleComponentSelect} />

        {/* Component selector pills */}
        <div className="flex flex-wrap gap-2">
          {SGA_COMPONENTS.map((c) => {
            const isActive = activeComponentId === c.id
            return (
              <button
                key={c.id}
                onClick={() => handleComponentSelect(c.id)}
                className={cn(
                  'rounded-lg border px-4 py-2 font-mono text-xs font-bold transition-all',
                  isActive
                    ? `${c.tagColor} border-transparent text-white shadow-sm`
                    : 'border-border bg-card text-muted-foreground hover:border-slate-400 hover:text-foreground',
                )}
              >
                {lang === 'ko' ? c.labelKo : c.labelEn}
              </button>
            )
          })}
        </div>

        {/* Detail card */}
        <AnimatePresence mode="wait">
          {activeComponent ? (
            <motion.div
              key={activeComponent.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* header */}
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3">
                <span className={cn('rounded px-2.5 py-0.5 font-mono text-xs font-bold text-white', activeComponent.tagColor)}>
                  {lang === 'ko' ? activeComponent.labelKo : activeComponent.labelEn}
                </span>
              </div>
              {/* desc */}
              <div className="px-5 py-4 border-b border-border">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {lang === 'ko' ? activeComponent.descKo : activeComponent.descEn}
                </p>
              </div>
              {/* details table */}
              {(() => {
                const details = lang === 'ko' ? activeComponent.detailsKo : activeComponent.detailsEn
                const normal = details.filter((r) => !r.isParam)
                const params = details.filter((r) => r.isParam)
                return (
                  <div className="flex flex-col divide-y divide-border">
                    {normal.map((row, i) => (
                      <div key={i} className="grid grid-cols-[180px_1fr] text-xs">
                        <div className="flex items-center border-r border-border bg-muted/30 px-4 py-2.5">
                          <span className="font-mono font-bold text-slate-600">{row.term}</span>
                        </div>
                        <div className="flex items-center px-4 py-2.5">
                          <span className="leading-snug text-muted-foreground">{row.desc}</span>
                        </div>
                      </div>
                    ))}
                    {params.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 bg-slate-50/80 px-4 py-1.5 border-t border-border">
                          <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            {lang === 'ko' ? 'PARAMETER' : 'PARAMETER'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lang === 'ko' ? '관련 초기화 파라미터' : 'Initialization parameter'}
                          </span>
                        </div>
                        {params.map((row, i) => (
                          <div key={i} className="grid grid-cols-[180px_1fr] text-xs bg-slate-50/40">
                            <div className="flex items-center border-r border-border bg-slate-100/60 px-4 py-2.5">
                              <span className="font-mono font-bold text-slate-500">{row.term}</span>
                            </div>
                            <div className="flex items-center px-4 py-2.5">
                              <span className="leading-snug text-muted-foreground">{row.desc}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-border"
            >
              <span className="font-mono text-sm text-muted-foreground">↑ {t.clickHint}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InfoBox variant="summary">
        {lang === 'ko' ? (
          <>
            <strong>SGA 핵심 정리</strong>
            <ul className="mt-2 space-y-1 list-none">
              <li>• <strong>Buffer Cache</strong> — 디스크 블록을 메모리에 올려 디스크 I/O를 줄입니다</li>
              <li>• <strong>Shared Pool</strong> — SQL 파싱 결과를 재사용해 CPU를 절약합니다</li>
              <li>• <strong>Redo Log Buffer</strong> — 변경 내역을 메모리에 모아 순차적으로 디스크에 씁니다</li>
              <li>• <strong>Undo Segment</strong> — ROLLBACK과 읽기 일관성(MVCC)을 가능하게 합니다</li>
            </ul>
          </>
        ) : (
          <>
            <strong>SGA Key Takeaways</strong>
            <ul className="mt-2 space-y-1 list-none">
              <li>• <strong>Buffer Cache</strong> — Keeps disk blocks in memory to reduce disk I/O</li>
              <li>• <strong>Shared Pool</strong> — Reuses SQL parse results to save CPU</li>
              <li>• <strong>Redo Log Buffer</strong> — Batches change records in memory for sequential disk writes</li>
              <li>• <strong>Undo Segment</strong> — Enables ROLLBACK and read consistency (MVCC)</li>
            </ul>
          </>
        )}
      </InfoBox>
    </div>
  )
}
