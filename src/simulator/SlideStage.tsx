// ─── Slide Stage ──────────────────────────────────────────────────────────
// 문장을 실행하는 동안에는 인스턴스 전체 그림 대신, 지금 단계가 쓰는 영역만 크게 확대해서
// 발표 슬라이드처럼 한 장씩 옆으로 넘겨 보여 준다. 실행이 끝나면 전체 그림으로 돌아온다.
//   SimStage    전체 그림(InstanceDiagram) ↔ 슬라이드(SlideStage) 전환
//   SlideStage  머리말(단계 번호 · 제목 · 진행 점) + 확대된 영역들 + 옆으로 넘기는 애니메이션

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconArrowLeft, IconArrowRight, IconCpu, IconLayoutGrid } from '@tabler/icons-react'
import { selectStep, useInternalsStore } from '@/store/internalsStore'
import { useLangStore } from '@/store/simulationStore'
import type { Lang } from '@/store/simulationStore'
import type { SimStep, StepStage, Trace } from '@/lib/simulator/types'
import { cn } from '@/lib/utils'
import { ComponentView, InstanceDiagram } from './InstanceDiagram'

const T = {
  ko: {
    overview: '전체 구조 보기',
    overviewTip: '슬라이드를 멈추고 인스턴스 전체 그림으로 돌아가요 (Esc)',
    keys: '← → 키로 넘겨요',
    step: '단계',
    last: '마지막 단계예요. 한 번 더 넘기면 전체 구조로 돌아가요',
    actor: '일하는 주체 · Process',
    worksHere: '여기서 일해요',
    fetches: '가져와요',
    readWrite: '읽고 써요',
    legendActor: '프로세스 = 일하는 주체',
    legendPlace: '메모리 · 파일 = 일하는 장소',
  },
  en: {
    overview: 'Show whole instance',
    overviewTip: 'Stop the slides and return to the whole instance (Esc)',
    keys: '← → to flip slides',
    step: 'Step',
    last: 'Last step — flip once more to return to the whole instance',
    actor: 'Worker · process',
    worksHere: 'works here',
    fetches: 'brings back',
    readWrite: 'reads & writes',
    legendActor: 'Process = the worker',
    legendPlace: 'Memory · files = where the work happens',
  },
}

const STAGE_LABEL: Record<StepStage, string> = {
  call: 'CALL',
  syntax: 'PARSE · SYNTAX CHECK',
  semantic: 'PARSE · SEMANTIC CHECK',
  'shared-pool': 'PARSE · SHARED POOL CHECK',
  optimize: 'OPTIMIZATION',
  'row-source': 'ROW SOURCE GENERATION',
  execute: 'EXECUTION',
  fetch: 'FETCH',
  maintenance: 'INSTANCE',
}

// ── 주체(Actor)와 장소(Place) ────────────────────────────────────────────────
// 프로세스는 "일하는 주체", 메모리·파일은 "일하는 장소"다. 슬라이드는 이 둘을 위아래 층으로 나눠
// "누가(프로세스) ↓ 어디에 들어가서(메모리·파일) 일하는지"가 보이게 그린다.
//   위층   주체 카드 — 프로세스끼리 일을 넘기면(Client → Server Process, QC → PX) 화살표로 잇는다
//   연결선 ↓ 여기서 일해요 / ↑ 가져와요 / ⇅ 읽고 써요
//   아래층 그 프로세스가 일하는 장소들 — 소속 영역(PGA · Shared Pool · SGA · Files)별로 묶고, 데이터가 흐른 방향을 화살표로

type ActorHue = 'slate' | 'green' | 'amber'

interface Actor {
  id: string
  hue: ActorHue
  /** 이 프로세스가 원래 맡는 장소 — 흐름(flows)에 직접 나오지 않을 때 누구 일인지 정하는 데 쓴다 */
  domain: string[]
}

const ACTORS: Actor[] = [
  { id: 'client', hue: 'slate', domain: [] },
  { id: 'server-process', hue: 'green', domain: [] },
  { id: 'px-servers', hue: 'amber', domain: ['large-pool', 'df-users', 'buffer-cache'] },
  { id: 'lgwr', hue: 'amber', domain: ['redo-buffer', 'redo-logs'] },
  { id: 'dbw', hue: 'amber', domain: ['buffer-cache', 'df-users', 'df-undo', 'df-system', 'df-temp'] },
  { id: 'ckpt', hue: 'amber', domain: ['control-file', 'df-users', 'df-system', 'df-undo'] },
  { id: 'arc', hue: 'amber', domain: ['redo-logs', 'archive-logs'] },
  { id: 'smon', hue: 'amber', domain: ['df-temp', 'df-undo'] },
  { id: 'pmon', hue: 'amber', domain: [] },
  { id: 'mmon', hue: 'amber', domain: ['df-system'] },
]

const ACTOR_CLS: Record<ActorHue, { ring: string; kicker: string }> = {
  slate: { ring: 'border-ink-3 bg-rail', kicker: 'text-ink-2' },
  green: { ring: 'border-viz-green bg-viz-green/10', kicker: 'text-viz-green' },
  amber: { ring: 'border-viz-amber bg-viz-amber/10', kicker: 'text-viz-amber' },
}

interface Region {
  id: string
  path: Record<Lang, string>
  members: string[]
}

const REGIONS: Region[] = [
  { id: 'pga', path: { ko: 'PGA — Server Process 전용 메모리', en: 'PGA — server process private memory' }, members: ['pga-private', 'pga-work', 'pga-session'] },
  { id: 'shared-pool', path: { ko: 'SGA › Shared Pool', en: 'SGA › Shared Pool' }, members: ['library-cache', 'dict-cache'] },
  { id: 'sga', path: { ko: 'SGA — 모든 프로세스가 함께 쓰는 메모리', en: 'SGA — memory shared by every process' }, members: ['buffer-cache', 'redo-buffer', 'large-pool'] },
  {
    id: 'files', path: { ko: 'Database — 디스크의 파일', en: 'Database — files on disk' },
    members: ['df-system', 'df-users', 'df-undo', 'df-temp', 'redo-logs', 'control-file', 'archive-logs'],
  },
]

const regionOf = (id: string) => REGIONS.find((r) => r.members.includes(id))
const touches = (step: SimStep, a: string, b: string) => step.flows.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

interface Lane {
  actor: Actor
  places: string[]
}

/** 불 켜진 장소마다 "누가 거기서 일하는지" 정하고, 프로세스별 칸(Lane)으로 나눈다 */
function lanes(step: SimStep): Lane[] {
  const actors = ACTORS.filter((a) => step.active.includes(a.id))
  const places = step.active.filter((id) => regionOf(id))
  if (actors.length === 0) return places.length > 0 ? [{ actor: ACTORS[1], places }] : []
  const owner = (p: string): Actor =>
    actors.find((a) => touches(step, a.id, p)) // 흐름으로 직접 이어진 프로세스
    ?? actors.find((a) => a.domain.includes(p)) // 원래 그 장소를 맡는 프로세스
    ?? actors.find((a) => a.id === 'server-process')
    ?? actors[0]
  const result = actors.map((actor) => ({ actor, places: places.filter((p) => owner(p) === actor) }))
  // 칸 순서: 흐름에 먼저 등장한 쪽(자신이나 자기 장소가)이 왼쪽 — "LGWR 먼저, 그다음 DBW" 같은 순서가 그대로 보인다
  const firstFlow = (l: Lane) => {
    const ids = [l.actor.id, ...l.places]
    const i = step.flows.findIndex(([x, y]) => ids.includes(x) || ids.includes(y))
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  return result.sort((a, b) => firstFlow(a) - firstFlow(b))
}

/** 한 칸 안의 장소들을 소속 영역별로 묶고, 데이터가 흐른 순서대로 */
function placeGroups(step: SimStep, places: string[]): { region: Region; ids: string[] }[] {
  const order: Region[] = []
  const add = (id: string) => {
    const r = regionOf(id)
    if (r && places.includes(id) && !order.includes(r)) order.push(r)
  }
  step.flows.forEach(([a, b]) => { add(a); add(b) })
  for (const r of REGIONS) if (!order.includes(r) && r.members.some((m) => places.includes(m))) order.push(r)
  return order.map((region) => ({ region, ids: region.members.filter((m) => places.includes(m)) }))
}

/** 두 묶음 사이의 화살표 방향 — 흐름이 없으면 null */
function arrowBetween(step: SimStep, a: string[], b: string[]): 'right' | 'left' | 'both' | null {
  const ab = step.flows.some(([x, y]) => a.includes(x) && b.includes(y))
  const ba = step.flows.some(([x, y]) => b.includes(x) && a.includes(y))
  return ab && ba ? 'both' : ab ? 'right' : ba ? 'left' : null
}

const ARROW_GLYPH = { both: '⇄', left: '←', right: '→' } as const

/** 보여 줄 장소가 적을수록 크게 */
function zoomFor(count: number): number {
  if (count <= 1) return 1.7
  if (count === 2) return 1.5
  if (count === 3) return 1.3
  if (count <= 5) return 1.15
  return 1
}

// ── 한 장의 슬라이드 본문 ─────────────────────────────────────────────────

function ActorCard({ actor, lang }: { actor: Actor; lang: Lang }) {
  const cls = ACTOR_CLS[actor.hue]
  return (
    <div className={cn('flex w-full flex-col rounded-panel border-2 p-1.5', cls.ring)}>
      <span className={cn('mb-1 flex items-center gap-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em]', cls.kicker)}>
        <IconCpu size={11} stroke={2} />
        {T[lang].actor}
      </span>
      <div className="grid">
        <ComponentView id={actor.id} />
      </div>
    </div>
  )
}

function Connector({ step, lane, lang }: { step: SimStep; lane: Lane; lang: Lang }) {
  const t = T[lang]
  const down = step.flows.some(([x, y]) => x === lane.actor.id && lane.places.includes(y))
  const up = step.flows.some(([x, y]) => lane.places.includes(x) && y === lane.actor.id)
  const [glyph, label] = down && up ? ['⇅', t.readWrite] : up ? ['↑', t.fetches] : ['↓', t.worksHere]
  return (
    <div className="flex flex-col items-center py-1">
      <span className="h-3 w-px bg-ink-3" />
      <span className="flex items-center gap-1 rounded-chip border border-line bg-paper px-1.5 py-px font-sans text-[9.5px] font-semibold text-ink-2">
        <span className="font-mono text-[11px] text-blue">{glyph}</span>
        {label}
      </span>
      <span className="h-3 w-px bg-ink-3" />
    </div>
  )
}

function Places({ step, places, lang }: { step: SimStep; places: string[]; lang: Lang }) {
  const groups = placeGroups(step, places)
  return (
    <div className={cn('flex w-full items-stretch gap-1.5', groups.length > 2 && 'flex-wrap')}>
      {groups.map((g, i) => {
        const arrow = i > 0 ? arrowBetween(step, groups[i - 1].region.members, g.region.members) : null
        return (
          <div key={g.region.id} className="flex min-w-0 flex-1 items-stretch gap-1.5">
            {i > 0 && (
              <span className={cn('shrink-0 self-center font-mono text-sm font-bold', arrow ? 'text-blue' : 'text-ink-3/40')}>
                {arrow ? ARROW_GLYPH[arrow] : '·'}
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col rounded-panel border border-dashed border-line-2 bg-paper/60 p-1.5">
              <span className="mb-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-ink-2">{g.region.path[lang]}</span>
              <div className={cn('grid flex-1 gap-1.5', g.ids.length > 1 && g.region.id !== 'sga' ? 'grid-cols-2' : 'grid-cols-1')}>
                {g.ids.map((id) => <ComponentView key={id} id={id} />)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SlideBody({ step, lang }: { step: SimStep; lang: Lang }) {
  const t = T[lang]
  const ls = lanes(step)
  const placeCount = ls.reduce((n, l) => n + l.places.length, 0)
  // 칸 너비는 그 칸의 장소 수에 비례 (장소가 없는 프로세스 칸은 좁게)
  const columns = ls.map((l, i) => `${i > 0 ? 'auto ' : ''}minmax(0, ${Math.max(0.6, l.places.length)}fr)`).join(' ')
  return (
    // zoom 은 레이아웃까지 함께 키운다 — 안쪽은 (가로폭 ÷ zoom) 안에서 배치된 뒤 확대된다
    <div className="flex min-h-full flex-col items-center justify-center gap-3" style={{ zoom: zoomFor(placeCount) }}>
      {/* 범례: 주체와 장소 */}
      <div className="flex items-center gap-3 font-sans text-[9.5px] text-ink-3">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] border-2 border-viz-green bg-viz-green/10" />
          {t.legendActor}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-line-2 bg-paper/60" />
          {t.legendPlace}
        </span>
      </div>
      <div className="grid w-full items-start gap-x-2" style={{ gridTemplateColumns: columns }}>
        {ls.flatMap((l, i) => {
          const handoff = i > 0 ? arrowBetween(step, [ls[i - 1].actor.id], [l.actor.id]) : null
          const cell = (
            <div key={l.actor.id} className="flex min-w-0 flex-col items-center">
              <ActorCard actor={l.actor} lang={lang} />
              {l.places.length > 0 && (
                <>
                  <Connector step={step} lane={l} lang={lang} />
                  <Places step={step} places={l.places} lang={lang} />
                </>
              )}
            </div>
          )
          if (i === 0) return [cell]
          return [
            <span key={`arrow-${l.actor.id}`} className={cn('self-start pt-7 font-mono text-base font-bold', handoff ? 'text-blue' : 'text-transparent')}>
              {handoff ? ARROW_GLYPH[handoff] : '·'}
            </span>,
            cell,
          ]
        })}
      </div>
    </div>
  )
}

// ── 슬라이드 화면 ─────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.3 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.3 }),
}

function SlideStage({ trace }: { trace: Trace }) {
  const cursor = useInternalsStore((s) => s.cursor)
  const step = useInternalsStore(selectStep)
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const { next, prev, goTo, showOverview } = useInternalsStore.getState()

  // 넘기는 방향: 앞으로 가면 오른쪽에서 들어오고, 뒤로 가면 왼쪽에서 들어온다
  const [nav, setNav] = useState({ trace, cursor, dir: 1 })
  if (nav.trace !== trace || nav.cursor !== cursor) {
    setNav({ trace, cursor, dir: nav.trace !== trace || cursor > nav.cursor ? 1 : -1 })
  }

  // 발표 슬라이드처럼 ← → 로 넘기고, Esc 로 전체 그림
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) return
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') showOverview()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, showOverview])

  if (!step) return null
  const total = trace.steps.length
  const isLast = cursor >= total - 1

  return (
    <div className="flex h-full flex-col bg-paper-sunk">
      {/* 머리말: 단계 번호 · 제목 · 진행 점 */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-blue">
            {t.step} {cursor + 1} / {total}
          </span>
          <span className="shrink-0 rounded-chip bg-ink/10 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink-2">{STAGE_LABEL[step.stage]}</span>
          <h2 className="min-w-0 truncate font-sans text-[15px] font-semibold text-ink" title={step.title[lang]}>{step.title[lang]}</h2>
          <span className="ml-auto hidden shrink-0 font-sans text-[10.5px] text-ink-3 xl:inline">{t.keys}</span>
          <button
            onClick={showOverview}
            title={t.overviewTip}
            className="flex shrink-0 items-center gap-1.5 rounded-chip border border-line bg-paper px-2 py-1 font-sans text-[11px] text-ink-2 transition-colors hover:bg-rail hover:text-ink"
          >
            <IconLayoutGrid size={13} stroke={1.5} />
            {t.overview}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {trace.steps.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={`${i + 1}. ${s.title[lang]}`}
              aria-label={`${t.step} ${i + 1}`}
              className={cn(
                'h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-300',
                i === cursor ? (s.result === 'error' ? 'bg-red' : 'bg-blue') : i < cursor ? 'bg-blue/35' : 'bg-line hover:bg-line-2',
              )}
            />
          ))}
        </div>
      </div>

      {/* 슬라이드: 옆으로 밀어 넘기기 */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={nav.dir}>
          <motion.div
            key={`${trace.sql}#${trace.steps.length}#${cursor}`}
            custom={nav.dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.5 }, opacity: { duration: 0.3 } }}
            className="absolute inset-0 overflow-auto px-14 py-5"
          >
            <SlideBody step={step} lang={lang} />
          </motion.div>
        </AnimatePresence>

        {/* 좌우 넘김 버튼 */}
        <button
          onClick={prev}
          disabled={cursor === 0}
          aria-label="prev slide"
          className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/90 text-ink-2 shadow-sm transition-colors hover:text-ink disabled:opacity-0"
        >
          <IconArrowLeft size={16} stroke={1.5} />
        </button>
        <button
          onClick={next}
          title={isLast ? t.last : undefined}
          aria-label="next slide"
          className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/90 text-ink-2 shadow-sm transition-colors hover:text-ink"
        >
          {isLast ? <IconLayoutGrid size={16} stroke={1.5} /> : <IconArrowRight size={16} stroke={1.5} />}
        </button>
      </div>
    </div>
  )
}

// ── 전체 그림 ↔ 슬라이드 전환 ─────────────────────────────────────────────

export function SimStage() {
  const trace = useInternalsStore((s) => s.trace)
  const view = useInternalsStore((s) => s.view)
  const slides = view === 'slides' && trace !== null
  return (
    <AnimatePresence mode="wait" initial={false}>
      {slides ? (
        // 전체 그림에서 한 영역으로 "확대해 들어가는" 느낌
        <motion.div
          key="slides"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <SlideStage trace={trace} />
        </motion.div>
      ) : (
        <motion.div
          key="overview"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-auto"
        >
          <div className="min-w-[860px]">
            <InstanceDiagram />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
