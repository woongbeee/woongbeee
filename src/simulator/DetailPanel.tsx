// ─── Detail Panel (오른쪽) ────────────────────────────────────────────────
// 재생 컨트롤 + 세 탭: 단계 해설 · Optimizer · 통계.

import { useEffect, useRef, useState } from 'react'
import {
  IconPlayerPlayFilled, IconPlayerPauseFilled, IconPlayerSkipBackFilled, IconPlayerSkipForwardFilled, IconExternalLink,
} from '@tabler/icons-react'
import { selectState, selectStep, useInternalsStore } from '@/store/internalsStore'
import type { PlaybackSpeed } from '@/store/internalsStore'
import { useLangStore } from '@/store/simulationStore'
import type { Lang } from '@/store/simulationStore'
import { DOCS } from '@/lib/simulator/engine'
import type { SessionStats, SimStep, StepResult, StepStage } from '@/lib/simulator/types'
import { COMPONENT_NAME } from './componentNames'
import { OptimizerPanel } from './OptimizerPanel'
import { cn } from '@/lib/utils'

type Tab = 'step' | 'optimizer' | 'stats'

const T = {
  ko: {
    tabs: { step: '단계 해설', optimizer: 'Optimizer', stats: '통계' },
    prev: '이전 단계', next: '다음 단계', play: '재생', pause: '일시정지', speed: '재생 속도',
    docs: '공식 문서', allSteps: '전체 단계', seeOptimizer: 'Optimizer 탭에서 자세히 보기 →',
    introTitle: 'Oracle 안에서는 무슨 일이 일어날까요?',
    introBody: '아래 입력창에 SQL 을 넣고 실행하면, 문장이 Oracle 인스턴스 안을 지나가는 길을 한 단계씩 따라가 볼 수 있어요. 왼쪽 그림은 그 순간의 실제 메모리 상태예요.',
    tryTitle: '이런 실험을 해 보세요',
    tries: [
      '같은 SELECT 를 두 번 실행해 보세요. 두 번째는 Soft Parse 가 되고 Physical Read 가 0 이 돼요.',
      '대소문자만 바꿔서 다시 실행해 보세요. 뜻은 같은데 Hard Parse 가 일어나요.',
      'WHERE employee_id = 100 과 = 101 을 차례로 실행한 뒤, :id 바인드 변수 버전과 비교해 보세요.',
      'UPDATE 를 실행하고 Buffer Cache 의 Dirty 버퍼와 Redo Log Buffer 를 본 다음 COMMIT 해 보세요. DBW 는 움직이지 않아요.',
      'Checkpoint 를 눌러 Dirty 버퍼가 Data File 로 내려가는 순서(LGWR → DBW → CKPT)를 확인해 보세요.',
      'UPDATE 와 COMMIT 을 여러 번 되풀이해 Online Redo Log 그룹을 가득 채워 보세요. Log Switch 가 일어나고 ARCn 과 Checkpoint 가 뒤따라요.',
      'Buffer Cache 를 비우거나 Shared Pool 을 비운 뒤 같은 SQL 을 다시 실행해 차이를 보세요.',
      '일부러 틀려 보세요: SELECT * FORM employees (문법 오류), SELECT * FROM employee (없는 테이블).',
    ],
    statName: '통계', thisStmt: '이번 문장', total: '누적',
    instance: '인스턴스 상태', hitRatio: 'Buffer Cache Hit Ratio', noReads: '아직 읽은 블록이 없어요',
    stats: {
      parseCalls: ['parse count (total)', 'Parse Call 횟수 (Hard + Soft)'],
      hardParses: ['parse count (hard)', '실행 계획을 새로 만든 횟수. 적을수록 좋아요'],
      softParses: ['parse count (soft)', 'Library Cache 의 계획을 다시 쓴 횟수'],
      executions: ['execute count', '문장을 실행한 횟수'],
      consistentGets: ['consistent gets', '읽기 일관성 모드로 버퍼를 읽은 횟수 (질의)'],
      dbBlockGets: ['db block gets', '현재 모드로 버퍼를 읽은 횟수 (변경)'],
      physicalReads: ['physical reads', 'Data File 에서 실제로 읽어 온 블록 수'],
      physicalWrites: ['physical writes', 'DBW 가 Data File 에 쓴 블록 수'],
      redoSize: ['redo size', '만들어진 Redo 의 양 (bytes)'],
      sorts: ['sorts (memory)', 'PGA 안에서 끝난 정렬 횟수'],
    },
  },
  en: {
    tabs: { step: 'Step', optimizer: 'Optimizer', stats: 'Statistics' },
    prev: 'Previous step', next: 'Next step', play: 'Play', pause: 'Pause', speed: 'Playback speed',
    docs: 'Official docs', allSteps: 'All steps', seeOptimizer: 'See details in the Optimizer tab →',
    introTitle: 'What happens inside Oracle?',
    introBody: 'Type a SQL statement below and run it to follow its path through the Oracle instance one step at a time. The diagram on the left shows the real memory state at that moment.',
    tryTitle: 'Experiments to try',
    tries: [
      'Run the same SELECT twice. The second run is a soft parse with zero physical reads.',
      'Run it again with only the letter case changed. Same meaning, yet a hard parse.',
      'Run WHERE employee_id = 100 and then = 101, and compare with the :id bind variable version.',
      'Run an UPDATE, look at the dirty buffers and the redo log buffer, then COMMIT. DBW does not move.',
      'Press Checkpoint and watch the order in which dirty buffers reach the data files (LGWR → DBW → CKPT).',
      'Repeat UPDATE and COMMIT until an online redo log group fills up. A log switch follows, then ARCn and a checkpoint.',
      'Flush the buffer cache or the shared pool, then rerun the same SQL and see the difference.',
      'Break it on purpose: SELECT * FORM employees (syntax error), SELECT * FROM employee (missing table).',
    ],
    statName: 'Statistic', thisStmt: 'This statement', total: 'Total',
    instance: 'Instance state', hitRatio: 'Buffer cache hit ratio', noReads: 'no blocks read yet',
    stats: {
      parseCalls: ['parse count (total)', 'Parse calls (hard + soft)'],
      hardParses: ['parse count (hard)', 'Times a plan was built from scratch — fewer is better'],
      softParses: ['parse count (soft)', 'Times a plan in the library cache was reused'],
      executions: ['execute count', 'Statement executions'],
      consistentGets: ['consistent gets', 'Buffer gets in consistent mode (queries)'],
      dbBlockGets: ['db block gets', 'Buffer gets in current mode (changes)'],
      physicalReads: ['physical reads', 'Blocks actually read from data files'],
      physicalWrites: ['physical writes', 'Blocks DBW wrote to data files'],
      redoSize: ['redo size', 'Redo generated (bytes)'],
      sorts: ['sorts (memory)', 'Sorts completed inside the PGA'],
    },
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

const RESULT: Record<StepResult, { label: string; cls: string } | null> = {
  info: null,
  ok: { label: 'OK', cls: 'bg-green/10 text-green' },
  hit: { label: 'CACHE HIT', cls: 'bg-green/10 text-green' },
  miss: { label: 'CACHE MISS', cls: 'bg-amber/15 text-amber' },
  error: { label: 'ERROR', cls: 'bg-red/10 text-red' },
}

const CHIP = 'rounded-chip px-1.5 py-0.5 font-mono text-[9.5px] font-bold'
const ICON_BTN = 'grid h-7 w-7 place-items-center rounded-chip border border-line bg-paper text-ink-2 transition-colors hover:bg-rail hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'

// ── Playback controls ─────────────────────────────────────────────────────

function Playback({ lang }: { lang: Lang }) {
  const trace = useInternalsStore((s) => s.trace)
  const cursor = useInternalsStore((s) => s.cursor)
  const playing = useInternalsStore((s) => s.playing)
  const speed = useInternalsStore((s) => s.speed)
  const { play, pause, next, prev, setSpeed } = useInternalsStore.getState()
  const t = T[lang]
  const total = trace?.steps.length ?? 0
  const speeds: PlaybackSpeed[] = [1, 2, 4]

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-line-2 bg-rail px-3 py-1.5">
      <button onClick={prev} disabled={!trace || cursor === 0} title={t.prev} aria-label={t.prev} className={ICON_BTN}>
        <IconPlayerSkipBackFilled size={13} />
      </button>
      <button
        onClick={playing ? pause : play}
        disabled={!trace}
        title={playing ? t.pause : t.play}
        aria-label={playing ? t.pause : t.play}
        className={cn(ICON_BTN, 'w-9 border-ink bg-ink text-paper hover:bg-ink hover:text-paper hover:opacity-85')}
      >
        {playing ? <IconPlayerPauseFilled size={13} /> : <IconPlayerPlayFilled size={13} />}
      </button>
      <button onClick={next} disabled={!trace || cursor >= total - 1} title={t.next} aria-label={t.next} className={ICON_BTN}>
        <IconPlayerSkipForwardFilled size={13} />
      </button>
      <span className="ml-1 font-mono text-[11px] tabular-nums text-ink-2">
        {trace ? `${cursor + 1} / ${total}` : '– / –'}
      </span>
      {/* 진행 막대 */}
      <div className="mx-2 h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-blue transition-all duration-300" style={{ width: total > 0 ? `${((cursor + 1) / total) * 100}%` : 0 }} />
      </div>
      <div className="flex overflow-hidden rounded-chip border border-line" title={t.speed}>
        {speeds.map((sp) => (
          <button
            key={sp}
            onClick={() => setSpeed(sp)}
            className={cn('px-1.5 py-1 font-mono text-[10px] transition-colors', speed === sp ? 'bg-ink text-paper' : 'bg-paper text-ink-2 hover:bg-rail')}
          >
            {sp}×
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step tab ──────────────────────────────────────────────────────────────

function StepCard({ step, lang, onSeeOptimizer }: { step: SimStep; lang: Lang; onSeeOptimizer: () => void }) {
  const t = T[lang]
  const result = RESULT[step.result]
  const doc = DOCS[step.doc]
  return (
    <div className={cn('rounded-card border bg-paper', step.result === 'error' ? 'border-red' : 'border-line-2')}>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-rail px-3 py-1.5">
        <span className={cn(CHIP, 'bg-ink/10 text-ink-2')}>{STAGE_LABEL[step.stage]}</span>
        {result && <span className={cn(CHIP, result.cls)}>{result.label}</span>}
      </div>
      <div className="px-3 py-2.5">
        <h3 className="font-sans text-[14px] font-semibold leading-snug text-ink">{step.title[lang]}</h3>
        <p className={cn('mt-1.5 font-read text-[13px] leading-relaxed', step.result === 'error' ? 'font-mono text-[12px] text-red' : 'text-ink')}>
          {step.body[lang]}
        </p>
        {step.facts.length > 0 && (
          <ul className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
            {step.facts.map((f, i) => (
              <li key={i} className="flex items-start gap-2 font-sans text-[12px] leading-relaxed text-ink-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                <span>{f[lang]}</span>
              </li>
            ))}
          </ul>
        )}
        {step.flows.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {step.flows.map(([from, to], i) => (
              <span key={i} className="rounded-chip border border-line bg-rail px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
                {COMPONENT_NAME[from] ?? from} <span className="text-blue">→</span> {COMPONENT_NAME[to] ?? to}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-[11px] text-blue hover:underline"
          >
            <IconExternalLink size={12} stroke={1.5} />
            {t.docs}: {doc.label}
          </a>
          {step.stage === 'optimize' && (
            <button onClick={onSeeOptimizer} className="font-sans text-[11px] text-blue hover:underline">
              {t.seeOptimizer}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepList({ lang }: { lang: Lang }) {
  const trace = useInternalsStore((s) => s.trace)
  const cursor = useInternalsStore((s) => s.cursor)
  const goTo = useInternalsStore((s) => s.goTo)
  const activeRef = useRef<HTMLButtonElement>(null)
  const t = T[lang]

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  if (!trace) return null
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-2">{t.allSteps}</div>
      <div className="overflow-hidden rounded-card border border-line">
        {trace.steps.map((s, i) => {
          const result = RESULT[s.result]
          const isCurrent = i === cursor
          return (
            <button
              key={s.key}
              ref={isCurrent ? activeRef : undefined}
              onClick={() => goTo(i)}
              className={cn(
                'flex w-full items-center gap-2 border-b border-line px-2.5 py-1.5 text-left transition-colors last:border-b-0',
                isCurrent ? 'bg-blue/[0.08]' : i < cursor ? 'bg-paper hover:bg-rail' : 'bg-paper opacity-55 hover:bg-rail hover:opacity-100',
              )}
            >
              <span className={cn('grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full font-mono text-[9px] font-bold', isCurrent ? 'bg-blue text-white' : 'bg-ink/10 text-ink-2')}>
                {i + 1}
              </span>
              <span className={cn('min-w-0 flex-1 truncate font-sans text-[11.5px]', isCurrent ? 'font-semibold text-ink' : 'text-ink-2')}>
                {s.title[lang]}
              </span>
              {result && s.result !== 'ok' && <span className={cn(CHIP, 'shrink-0', result.cls)}>{result.label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Intro({ lang }: { lang: Lang }) {
  const t = T[lang]
  return (
    <div className="rounded-card border border-line-2 bg-paper px-3.5 py-3">
      <h3 className="font-sans text-[14px] font-semibold text-ink">{t.introTitle}</h3>
      <p className="mt-1.5 font-read text-[13px] leading-relaxed text-ink">{t.introBody}</p>
      <div className="mt-3 border-t border-line pt-2.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-2">{t.tryTitle}</div>
      <ol className="mt-1.5 space-y-1.5">
        {t.tries.map((x, i) => (
          <li key={i} className="flex items-start gap-2 font-sans text-[12px] leading-relaxed text-ink-2">
            <span className="mt-px shrink-0 font-mono text-[10px] font-bold text-ink-3">{i + 1}.</span>
            <span>{x}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Statistics tab ────────────────────────────────────────────────────────

function Stats({ lang }: { lang: Lang }) {
  const state = useInternalsStore(selectState)
  const base = useInternalsStore((s) => s.baseStats)
  const hasTrace = useInternalsStore((s) => s.trace !== null)
  const t = T[lang]
  const keys = Object.keys(t.stats) as (keyof SessionStats)[]
  const logical = state.stats.consistentGets + state.stats.dbBlockGets
  const log = state.redoLog.groups[state.redoLog.current]
  const ratio = logical > 0 ? `${((1 - state.stats.physicalReads / logical) * 100).toFixed(1)}%` : t.noReads
  const facts: [string, string][] = [
    ['Current SCN', state.scn.toLocaleString()],
    ['Checkpoint SCN', state.checkpointScn.toLocaleString()],
    ['Redo Log Buffer', `${state.redoBuffer.bytes.toLocaleString()} B`],
    ['Online Redo Log', `group ${log.group} · seq ${log.sequence} · ${state.redoLog.bytes.toLocaleString()} B`],
    ['Archived Redo Logs', String(state.archivedLogs)],
    ['Dirty buffers', String(state.buffers.filter((b) => b.state === 'dirty').length)],
    ['Library Cache cursors', String(state.cursors.length)],
    [t.hitRatio, ratio],
  ]
  return (
    <div className="space-y-3 p-3">
      <div className="overflow-hidden rounded-card border border-line-2">
        <div className="grid grid-cols-[1fr_72px_72px] border-b border-line-2 bg-rail px-3 py-1.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-2">
          <span>{t.statName}</span>
          <span className="text-right">{t.thisStmt}</span>
          <span className="text-right">{t.total}</span>
        </div>
        {keys.map((k) => {
          const delta = hasTrace ? state.stats[k] - base[k] : 0
          return (
            <div key={k} className="grid grid-cols-[1fr_72px_72px] items-center border-b border-line px-3 py-1.5 last:border-b-0">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-ink">{t.stats[k][0]}</div>
                <div className="font-sans text-[10.5px] leading-snug text-ink-3">{t.stats[k][1]}</div>
              </div>
              <span className={cn('text-right font-mono text-[11.5px] tabular-nums', delta > 0 ? 'font-bold text-blue' : 'text-ink-3')}>
                {delta > 0 ? `+${delta.toLocaleString()}` : '0'}
              </span>
              <span className="text-right font-mono text-[11.5px] tabular-nums text-ink">{state.stats[k].toLocaleString()}</span>
            </div>
          )
        })}
      </div>
      <div className="overflow-hidden rounded-card border border-line-2">
        <div className="border-b border-line-2 bg-rail px-3 py-1.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-2">{t.instance}</div>
        {facts.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-line px-3 py-1.5 last:border-b-0">
            <span className="font-mono text-[11px] text-ink-2">{k}</span>
            <span className="font-mono text-[11.5px] tabular-nums text-ink">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────

export function DetailPanel() {
  const lang = useLangStore((s) => s.lang)
  const step = useInternalsStore(selectStep)
  const trace = useInternalsStore((s) => s.trace)
  const [tab, setTab] = useState<Tab>('step')
  const t = T[lang]
  const tabs: Tab[] = ['step', 'optimizer', 'stats']

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <Playback lang={lang} />
      <div className="flex shrink-0 border-b border-line-2 bg-rail">
        {tabs.map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 border-b-2 py-2 text-xs font-semibold transition-colors',
              id === 'optimizer' ? 'font-mono' : 'font-sans',
              tab === id ? 'border-ink bg-paper text-ink' : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {t.tabs[id]}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'step' && (
          <div className="space-y-3 p-3">
            {step ? <StepCard step={step} lang={lang} onSeeOptimizer={() => setTab('optimizer')} /> : <Intro lang={lang} />}
            <StepList lang={lang} />
          </div>
        )}
        {tab === 'optimizer' && (
          <OptimizerPanel
            result={trace?.optimizer ?? null}
            hasTrace={trace !== null}
            level={step?.optLevel ?? 0}
            reused={trace?.parseType === 'soft'}
            runningNodeId={step?.planNodeId}
            lang={lang}
          />
        )}
        {tab === 'stats' && <Stats lang={lang} />}
      </div>
    </div>
  )
}
