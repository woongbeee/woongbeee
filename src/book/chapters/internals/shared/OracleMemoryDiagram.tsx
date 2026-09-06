import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

// ─────────────────────────────────────────────────────────────────────────────
// Oracle 인스턴스 메모리 구조 (SGA + PGA) — 공용 다이어그램.
//
// 레이아웃은 Oracle 공식 문서(Concepts, "Memory Architecture" Figure 17-1)를
// 따른다: Instance = SGA ∥ PGA. SGA 안에 Shared Pool(Library/Dict/Result Cache),
// Database Buffer Cache, Redo Log Buffer, Large Pool, Java Pool, Fixed SGA.
// PGA 안에 Private SQL Area(Persistent·Run-time), SQL Work Areas(Sort·Hash·
// Bitmap Merge), Session Memory(UGA).
//
// region id 는 internalsStore 의 activeComponents 값과 겹치므로, 시뮬레이터는
// 그대로 넘기면 된다:  <OracleMemoryDiagram highlight={[...activeComponents]} />
//
// 레이아웃은 순수 flex/grid — 글자가 도형을 벗어나거나 도형끼리 겹칠 일이 없다.
// 폰트: 이름·설명 = font-sans, 식별자·약어 = font-mono. 색: --color-viz-* (선명).
// ─────────────────────────────────────────────────────────────────────────────

export type MemoryRegionId =
  // SGA
  | 'sga'
  | 'shared-pool'
  | 'library-cache'
  | 'dict-cache'
  | 'result-cache'
  | 'buffer-cache'
  | 'redo-buffer'
  | 'redo-log-buffer'   // alias
  | 'large-pool'
  | 'java-pool'
  | 'fixed-sga'
  // PGA
  | 'pga'
  | 'private-sql'
  | 'persistent-area'
  | 'runtime-area'
  | 'sql-work-area'
  | 'sort-area'
  | 'hash-area'
  | 'bitmap-merge-area'
  | 'session-memory'
  | 'uga'               // alias of session-memory

interface Props {
  /** 강조할 region. 비면 전체 기본색, 있으면 해당 영역만 강조하고 나머지는 흐리게. */
  highlight?: MemoryRegionId[]
  /** 'both'(기본) · 'sga' · 'pga' */
  scope?: 'both' | 'sga' | 'pga'
  /** 좁은 컨테이너(OracleInstanceMap 내부 등)용 축소 모드 — 한 열로 스택 */
  compact?: boolean
  className?: string
}

type Hue = 'blue' | 'amber' | 'green' | 'purple' | 'slate'

// 전부 리터럴 — Tailwind 스캐너가 인식하도록 (템플릿 보간 금지).
const HUE: Record<Hue, { text: string; ring: string; line: string; borderL: string; tint: string; bar: string }> = {
  blue:   { text: 'text-viz-blue',   ring: 'ring-viz-blue/50',   line: 'border-viz-blue/55',   borderL: 'border-l-viz-blue',   tint: 'bg-viz-blue/10',   bar: 'bg-viz-blue' },
  amber:  { text: 'text-viz-amber',  ring: 'ring-viz-amber/50',  line: 'border-viz-amber/55',  borderL: 'border-l-viz-amber',  tint: 'bg-viz-amber/10',  bar: 'bg-viz-amber' },
  green:  { text: 'text-viz-green',  ring: 'ring-viz-green/50',  line: 'border-viz-green/55',  borderL: 'border-l-viz-green',  tint: 'bg-viz-green/10',  bar: 'bg-viz-green' },
  purple: { text: 'text-viz-purple', ring: 'ring-viz-purple/50', line: 'border-viz-purple/55', borderL: 'border-l-viz-purple', tint: 'bg-viz-purple/10', bar: 'bg-viz-purple' },
  slate:  { text: 'text-ink-2',      ring: 'ring-line-2',        line: 'border-line-2',        borderL: 'border-l-line-2',     tint: 'bg-rail',          bar: 'bg-ink-3' },
}

// region → 자식 id (부모가 자식 강조 시 함께 켜지도록)
const CHILDREN: Partial<Record<MemoryRegionId, MemoryRegionId[]>> = {
  sga: ['shared-pool', 'library-cache', 'dict-cache', 'result-cache', 'buffer-cache', 'redo-buffer', 'redo-log-buffer', 'large-pool', 'java-pool', 'fixed-sga'],
  'shared-pool': ['library-cache', 'dict-cache', 'result-cache'],
  'redo-buffer': ['redo-log-buffer'],
  pga: ['private-sql', 'persistent-area', 'runtime-area', 'sql-work-area', 'sort-area', 'hash-area', 'bitmap-merge-area', 'session-memory', 'uga'],
  'private-sql': ['persistent-area', 'runtime-area'],
  'sql-work-area': ['sort-area', 'hash-area', 'bitmap-merge-area'],
  'session-memory': ['uga'],
}

function useMatcher(highlight: MemoryRegionId[]) {
  const has = new Set(highlight)
  const active = highlight.length > 0
  const on = (...ids: MemoryRegionId[]) => {
    if (!active) return false
    for (const id of ids) {
      if (has.has(id)) return true
      for (const child of CHILDREN[id] ?? []) if (has.has(child)) return true
    }
    return false
  }
  return { active, on }
}

type State = 'lit' | 'base' | 'dim'

// ── 하위 region 미니 박스 (Library Cache, Persistent Area 등) ────────────────
function Sub({ hue, name, state }: { hue: Hue; name: string; state: State }) {
  const h = HUE[hue]
  return (
    <div
      className={cn(
        'rounded-chip border px-2 py-1 font-sans text-[10.5px] font-medium leading-tight transition-all',
        state === 'dim'
          ? 'border-line text-ink-3'
          : state === 'lit'
            ? cn(h.line, h.tint, h.text)
            : cn('border-line', h.text),
      )}
    >
      {name}
    </div>
  )
}

// ── pool 카드 ──────────────────────────────────────────────────────────────
function Pool({
  hue, name, note, subs, state, className,
}: {
  hue: Hue
  name: string
  note?: string
  subs?: { name: string; state: State }[]
  state: State
  className?: string
}) {
  const h = HUE[hue]
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1.5 rounded-card border border-l-[3px] px-3 py-2.5 transition-all',
        state === 'dim'
          ? 'border-line border-l-line bg-paper opacity-45'
          : cn(h.line, h.borderL, state === 'lit' ? cn(h.tint, 'ring-2', h.ring) : 'bg-paper'),
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('font-sans text-[12px] font-semibold leading-tight', state === 'dim' ? 'text-ink-3' : h.text)}>
          {name}
        </span>
        {note && (
          <span className={cn('font-sans text-[10.5px] leading-snug', state === 'dim' ? 'text-ink-3/70' : 'text-ink-2')}>
            {note}
          </span>
        )}
      </div>
      {subs && subs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {subs.map((s) => (
            <Sub key={s.name} hue={hue} name={s.name} state={s.state} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── region 패널 (SGA / PGA) ───────────────────────────────────────────────
function Panel({
  badge, hue, sub, state, children,
}: {
  badge: string
  hue: Hue
  sub: string
  state: State
  children: ReactNode
}) {
  const h = HUE[hue]
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-panel border border-l-4 bg-paper p-3 transition-all',
        state === 'dim' ? 'border-line border-l-line opacity-45' : cn('border-line', h.borderL),
        state === 'lit' && cn('ring-2', h.ring),
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('shrink-0 rounded-chip px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-paper', h.bar)}>
          {badge}
        </span>
        <span className={cn('font-sans text-[11.5px] leading-tight', state === 'dim' ? 'text-ink-3' : 'text-ink-2')}>{sub}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

export function OracleMemoryDiagram({ highlight = [], scope = 'both', compact = false, className }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const { active, on } = useMatcher(highlight)

  const st = (hit: boolean): State => (!active ? 'base' : hit ? 'lit' : 'dim')

  // ── SGA ──────────────────────────────────────────────────────────────────
  const sga = (
    <Panel
      badge="SGA"
      hue="blue"
      sub={isKo ? 'System Global Area · 모든 세션이 공유하는 메모리' : 'System Global Area · shared by every session'}
      state={st(on('sga'))}
    >
      <div className={cn('grid flex-1 gap-2', compact ? 'grid-cols-1' : 'md:grid-cols-[1.35fr_1fr]')}>
        {/* Shared Pool — 하위 3캐시 포함, 왼쪽 큰 칸 */}
        <Pool
          hue="blue"
          name="Shared Pool"
          note={isKo ? '파싱 결과 · 실행 계획 · 딕셔너리' : 'parse results · plans · dictionary'}
          state={st(on('shared-pool'))}
          subs={[
            { name: 'Library Cache', state: st(on('library-cache')) },
            { name: 'Data Dictionary Cache', state: st(on('dict-cache')) },
            { name: 'Server Result Cache', state: st(on('result-cache')) },
          ]}
        />
        {/* 오른쪽 칸: 나머지 pool 세로 스택 */}
        <div className="flex flex-col gap-2">
          <Pool hue="blue" name="Database Buffer Cache" note={isKo ? '데이터 블록 사본 · LRU' : 'copies of data blocks · LRU'} state={st(on('buffer-cache'))} />
          <Pool hue="amber" name="Redo Log Buffer" note={isKo ? '변경 벡터 · 순환 버퍼' : 'change vectors · circular'} state={st(on('redo-buffer'))} />
          <Pool hue="green" name="Large Pool" note={isKo ? 'RMAN · 병렬 실행 · Shared Server UGA' : 'RMAN · parallel · Shared Server UGA'} state={st(on('large-pool'))} />
          <div className="grid grid-cols-2 gap-2">
            <Pool hue="green" name="Java Pool" note={isKo ? 'JVM 세션 메모리' : 'JVM session memory'} state={st(on('java-pool'))} />
            <Pool hue="slate" name="Fixed SGA" note={isKo ? '내부 부트스트랩 영역' : 'internal bootstrap area'} state={st(on('fixed-sga'))} />
          </div>
        </div>
      </div>
    </Panel>
  )

  // ── PGA ──────────────────────────────────────────────────────────────────
  const pga = (
    <Panel
      badge="PGA"
      hue="purple"
      sub={isKo ? 'Program Global Area · 서버 프로세스 하나만의 전용 메모리' : 'Program Global Area · private to one server process'}
      state={st(on('pga'))}
    >
      <Pool
        hue="purple"
        name="Private SQL Area"
        note={isKo ? '커서 하나의 개인 공간' : 'private space for one cursor'}
        state={st(on('private-sql'))}
        subs={[
          { name: isKo ? 'Persistent Area · 바인드 변수' : 'Persistent Area · bind vars', state: st(on('persistent-area')) },
          { name: isKo ? 'Run-time Area · 실행 상태' : 'Run-time Area · exec state', state: st(on('runtime-area')) },
        ]}
      />
      <Pool
        hue="blue"
        name="SQL Work Areas"
        note={isKo ? '메모리 집약 연산 · 부족하면 Temp 로 스필' : 'memory-intensive ops · spill to Temp'}
        state={st(on('sql-work-area'))}
        subs={[
          { name: 'Sort Area', state: st(on('sort-area')) },
          { name: 'Hash Area', state: st(on('hash-area')) },
          { name: 'Bitmap Merge Area', state: st(on('bitmap-merge-area')) },
        ]}
      />
      <Pool
        hue="green"
        name="Session Memory (UGA)"
        note={isKo ? '세션 변수 · 로그인 정보 · 상태' : 'session variables · logon info · state'}
        state={st(on('session-memory'))}
      />
      <p className={cn('font-sans text-[10px] leading-snug', on('pga') || !active ? 'text-ink-3' : 'text-ink-3/70')}>
        {isKo
          ? 'UGA 위치 — Dedicated Server: PGA 안 · Shared Server: SGA(Large Pool)'
          : 'UGA location — Dedicated Server: inside the PGA · Shared Server: SGA (Large Pool)'}
      </p>
    </Panel>
  )

  // ── 조립 ─────────────────────────────────────────────────────────────────
  if (scope === 'sga') return <figure className={cn('my-4', className)}>{sga}</figure>
  if (scope === 'pga') return <figure className={cn(compact ? 'my-0' : 'my-4', className)}>{pga}</figure>

  return (
    <figure className={cn('my-5 overflow-x-auto', className)}>
      <div className="min-w-[520px] rounded-panel border border-line-2 bg-paper-sunk p-3">
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
          {isKo ? 'Oracle Instance — 메모리' : 'Oracle Instance — memory'}
        </div>
        <div className={cn('flex gap-3', compact ? 'flex-col' : 'flex-col lg:flex-row')}>
          <div className="min-w-0 lg:flex-[2.3]">{sga}</div>
          <div className="min-w-0 lg:flex-1">{pga}</div>
        </div>
        <p className="mt-2 font-sans text-[10.5px] leading-snug text-ink-3">
          {isKo
            ? '서버 프로세스는 자기 PGA 를 전용으로 쓰고, SGA 는 다른 모든 세션과 공유해서 접근해요.'
            : 'A server process owns its PGA privately and shares the SGA with every other session.'}
        </p>
      </div>
    </figure>
  )
}
