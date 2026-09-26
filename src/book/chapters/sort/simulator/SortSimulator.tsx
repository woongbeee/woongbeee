import { useState } from 'react'
import { IconArrowsSort } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  InfoBox,
} from '../../shared'

const T = {
  ko: {
    title: 'Sort 시뮬레이터',
    subtitle:
      'PGA 작업 영역(Work Area) 크기를 조절해보면서, 같은 정렬 작업이 Optimal → One-Pass → Multi-Pass 중 어느 모드로 실행되는지, 그리고 Temp 세그먼트로 얼마나 스필되는지 직접 확인해봐요.',

    dataLabel: '정렬할 데이터 크기',
    pgaLabel: 'PGA 작업 영역 크기 (이 정렬에 배정된 몫)',

    modeLabel: '실행 모드',
    modes: {
      optimal: {
        name: 'OPTIMAL',
        desc: '데이터가 작업 영역에 전부 들어가요. 디스크 접근이 전혀 없어요.',
      },
      onepass: {
        name: 'ONE-PASS',
        desc: '작업 영역을 넘는 부분을 디스크에 한 번 썼다가 다시 읽어요.',
      },
      multipass: {
        name: 'MULTI-PASS',
        desc: '여러 번에 걸쳐 디스크를 오가요. 응답 시간이 급격히 느려져요.',
      },
    },

    memBarLabel: 'PGA 작업 영역 (메모리)',
    tempBarLabel: 'Temp 세그먼트 (디스크)',

    statsTitle: '예상 실행 통계',
    passesLabel: '디스크 왕복 횟수',
    ioLabel: '추가 디스크 I/O (추정)',
    responseLabel: '상대 응답 시간',

    presetsTitle: '빠른 시나리오',
    presets: [
      { key: 'good', label: '충분한 PGA', pga: 90 },
      { key: 'tight', label: '빠듯한 PGA', pga: 35 },
      { key: 'bad', label: '부족한 PGA', pga: 8 },
    ],

    tip: 'PGA_AGGREGATE_TARGET을 늘리면 이 슬라이더가 오른쪽으로 이동하는 것과 같은 효과예요 — 실제로는 세션이 아니라 인스턴스 전체 목표치지만, 원리는 동일해요: 작업 영역이 커질수록 Optimal 실행 비율이 올라가요.',

    labelData: (n: number) => `${n} GB`,
    labelPga: (n: number) => `${n} MB`,
  },

  en: {
    title: 'Sort Simulator',
    subtitle:
      'Adjust the PGA Work Area size and watch the same sort operation shift between Optimal, One-Pass, and Multi-Pass execution — and see how much spills to the Temp segment.',

    dataLabel: 'Data Volume to Sort',
    pgaLabel: 'PGA Work Area Size (allotted to this sort)',

    modeLabel: 'Execution Mode',
    modes: {
      optimal: {
        name: 'OPTIMAL',
        desc: 'All the data fits in the work area. No disk access at all.',
      },
      onepass: {
        name: 'ONE-PASS',
        desc: 'The overflow is written to disk once, then read back once.',
      },
      multipass: {
        name: 'MULTI-PASS',
        desc: 'Multiple round trips to disk. Response time degrades sharply.',
      },
    },

    memBarLabel: 'PGA Work Area (memory)',
    tempBarLabel: 'Temp Segment (disk)',

    statsTitle: 'Estimated Execution Stats',
    passesLabel: 'Disk round trips',
    ioLabel: 'Extra disk I/O (estimated)',
    responseLabel: 'Relative response time',

    presetsTitle: 'Quick Scenarios',
    presets: [
      { key: 'good', label: 'Plenty of PGA', pga: 90 },
      { key: 'tight', label: 'Tight PGA', pga: 35 },
      { key: 'bad', label: 'Insufficient PGA', pga: 8 },
    ],

    tip: "Raising PGA_AGGREGATE_TARGET has the same effect as sliding this to the right — in reality it's an instance-wide target rather than a per-session dial, but the principle is identical: a larger work area means a higher share of Optimal executions.",

    labelData: (n: number) => `${n} GB`,
    labelPga: (n: number) => `${n} MB`,
  },
}

// 데이터 크기는 고정 10GB. PGA%(1~100)를 MB로 매핑해서 슬라이더로 조절.
// One-Pass 최소 요구치는 실제 Oracle 문서 예시(10GB 정렬 시 One-Pass ~40MB)를 참고한 근사치.
const DATA_GB = 10
const OPTIMAL_MB = DATA_GB * 1024 // 10GB를 메모리에 그대로 담으려면 필요한 크기
const ONEPASS_MIN_MB = 40 // 공식 문서 예시: 10GB 정렬 시 One-Pass 최소 약 40MB
const PGA_MAX_MB = 1200 // 슬라이더 우측 끝값 (Optimal보다 넉넉하게)

function classify(pgaMb: number): 'optimal' | 'onepass' | 'multipass' {
  if (pgaMb >= OPTIMAL_MB) return 'optimal'
  if (pgaMb >= ONEPASS_MIN_MB) return 'onepass'
  return 'multipass'
}

const MODE_COLOR: Record<'optimal' | 'onepass' | 'multipass', string> = {
  optimal: 'var(--color-green)',
  onepass: 'var(--color-amber)',
  multipass: 'var(--color-red)',
}

export function SortSimulator() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [pgaMb, setPgaMb] = useState(90) // 슬라이더는 %(1~100)로 받고 MB로 환산
  const pgaMbActual = Math.round((pgaMb / 100) * PGA_MAX_MB)
  const mode = classify(pgaMbActual)

  // 스필된 데이터 비율(디스크로 넘어간 몫) — 시각화용 근사치
  const dataInMemoryMb = Math.min(pgaMbActual, OPTIMAL_MB)
  const spillRatio = 1 - dataInMemoryMb / OPTIMAL_MB

  // 실행 통계 추정치 (실제 Oracle 수치가 아닌, 개념 이해를 돕기 위한 근사 모델)
  const passes =
    mode === 'optimal'
      ? 0
      : mode === 'onepass'
        ? 1
        : Math.ceil(2 + spillRatio * 4)
  const extraIoGb =
    mode === 'optimal' ? 0 : Math.round(DATA_GB * passes * 10) / 10
  const relativeTime =
    mode === 'optimal'
      ? 1
      : mode === 'onepass'
        ? 3
        : Math.round(3 + spillRatio * 25)

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowsSort size={36} stroke={1.5} className="text-rose" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.presetsTitle}</SectionTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {t.presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setPgaMb(p.pga)}
            className={cn(
              'rounded-card border px-3.5 py-1.5 font-mono text-xs font-bold transition-all',
              Math.abs(pgaMb - p.pga) < 1
                ? 'border-rose bg-rose/10 text-rose'
                : 'border-line bg-paper text-ink-2 hover:border-line-2'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 컨트롤: 데이터 크기(고정 표시) + PGA 슬라이더 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border-line bg-paper border px-4 py-3">
          <p className="text-ink-2 mb-1 font-mono text-[10px] font-bold tracking-wider uppercase">
            {t.dataLabel}
          </p>
          <p className="text-ink font-mono text-lg font-bold">
            {t.labelData(DATA_GB)}
          </p>
        </div>
        <div className="rounded-card border-line bg-paper border px-4 py-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-ink-2 font-mono text-[10px] font-bold tracking-wider uppercase">
              {t.pgaLabel}
            </p>
            <p className="text-ink font-mono text-sm font-bold">
              {t.labelPga(pgaMbActual)}
            </p>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={pgaMb}
            onChange={(e) => setPgaMb(Number(e.target.value))}
            className="w-full accent-[var(--color-rose)]"
          />
        </div>
      </div>

      {/* 실행 모드 배지 */}
      <div
        className="rounded-card mb-4 flex items-center gap-3 border-l-[3px] px-4 py-3"
        style={{
          borderLeftColor: MODE_COLOR[mode],
          backgroundColor: `color-mix(in srgb, ${MODE_COLOR[mode]} 8%, var(--color-paper))`,
        }}
      >
        <span
          className="rounded-chip px-2.5 py-1 font-mono text-xs font-bold text-white"
          style={{ backgroundColor: MODE_COLOR[mode] }}
        >
          {t.modes[mode].name}
        </span>
        <p className="font-read text-ink text-[13px] leading-relaxed">
          {t.modes[mode].desc}
        </p>
      </div>

      {/* 메모리 vs 디스크 시각화 */}
      <div className="rounded-panel border-line bg-rail mb-6 border p-4">
        <SortMemoryDiagram
          optimalMb={OPTIMAL_MB}
          pgaMb={pgaMbActual}
          spillRatio={Math.max(0, Math.min(1, spillRatio))}
          mode={mode}
          memLabel={t.memBarLabel}
          tempLabel={t.tempBarLabel}
        />
      </div>

      {/* 실행 통계 */}
      <SectionTitle>{t.statsTitle}</SectionTitle>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard
          label={t.passesLabel}
          value={String(passes)}
          color={MODE_COLOR[mode]}
        />
        <StatCard
          label={t.ioLabel}
          value={`${extraIoGb} GB`}
          color={MODE_COLOR[mode]}
        />
        <StatCard
          label={t.responseLabel}
          value={`${relativeTime}x`}
          color={MODE_COLOR[mode]}
        />
      </div>

      <div className="mt-8">
        <InfoBox variant="tip">{t.tip}</InfoBox>
      </div>
    </PageContainer>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-card border-line bg-paper border px-4 py-3 text-center">
      <p className="text-ink-2 mb-1 font-mono text-[9.5px] font-bold tracking-wider uppercase">
        {label}
      </p>
      <p className="font-mono text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

// ── SortMemoryDiagram ────────────────────────────────────────────────────────
// 왼쪽: PGA 작업 영역(고정 폭) 안에 실제 사용 중인 메모리를 채운 바.
// 오른쪽: Temp 세그먼트로 넘친(스필된) 데이터를 표시하는 바 — 스필이 없으면 비어있음.
function SortMemoryDiagram({
  optimalMb,
  pgaMb,
  spillRatio,
  mode,
  memLabel,
  tempLabel,
}: {
  optimalMb: number
  pgaMb: number
  spillRatio: number
  mode: 'optimal' | 'onepass' | 'multipass'
  memLabel: string
  tempLabel: string
}) {
  const W = 720
  const H = 150
  const BAR_H = 40
  const memFillPct = Math.min(100, Math.round((pgaMb / optimalMb) * 100))
  const spillPct = Math.round(spillRatio * 100)
  const color = MODE_COLOR[mode]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ fontFamily: 'var(--font-mono-stack)' }}
    >
      {/* PGA 작업 영역 바 */}
      <text
        x={0}
        y={16}
        fontSize={11}
        fontWeight="bold"
        fill="var(--color-ink-2)"
      >
        {memLabel}
      </text>
      <rect
        x={0}
        y={24}
        width={W}
        height={BAR_H}
        rx={6}
        fill="var(--color-paper)"
        stroke="var(--color-line)"
        strokeWidth={1.5}
      />
      <rect
        x={0}
        y={24}
        width={(memFillPct / 100) * W}
        height={BAR_H}
        rx={6}
        fill={color}
        opacity={0.75}
      />
      <text
        x={W / 2}
        y={24 + BAR_H / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        fill="var(--color-ink)"
      >
        {memFillPct}%
      </text>

      {/* Temp 세그먼트 바 */}
      <text
        x={0}
        y={24 + BAR_H + 30}
        fontSize={11}
        fontWeight="bold"
        fill="var(--color-ink-2)"
      >
        {tempLabel}
      </text>
      <rect
        x={0}
        y={24 + BAR_H + 38}
        width={W}
        height={BAR_H}
        rx={6}
        fill="var(--color-paper)"
        stroke="var(--color-line)"
        strokeWidth={1.5}
        strokeDasharray={spillPct === 0 ? '4 4' : undefined}
      />
      {spillPct > 0 && (
        <rect
          x={0}
          y={24 + BAR_H + 38}
          width={(spillPct / 100) * W}
          height={BAR_H}
          rx={6}
          fill="var(--color-red)"
          opacity={0.6}
        />
      )}
      <text
        x={W / 2}
        y={24 + BAR_H + 38 + BAR_H / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        fill={spillPct === 0 ? 'var(--color-ink-3)' : 'var(--color-ink)'}
      >
        {spillPct}%
      </text>
    </svg>
  )
}
