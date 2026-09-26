import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconGitFork } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  SqlBlock,
  Divider,
} from '../shared'

const T = {
  ko: {
    title: '파이프라인 데이터 흐름',
    subtitle:
      'Producer PX가 읽은 데이터가 Table Queue를 거쳐 Consumer PX로 흐르면서 조인·정렬·집계가 실제로 어느 단계에서 일어나는지 애니메이션으로 따라가요.',

    introTitle: '왜 "파이프라인"일까?',
    introDesc:
      '병렬 쿼리는 한 덩어리씩 처리하고 넘기는 게 아니라, 물이 파이프를 흐르듯 각 단계가 동시에 돌아가요.\nProducer가 아직 테이블을 다 읽지 않았어도, 이미 읽은 행은 곧바로 Table Queue를 통해 Consumer에게 전달되고, Consumer는 그 행을 받는 즉시 조인·정렬·집계를 시작해요. 그래서 "전체 스캔 완료 → 조인 시작"이 아니라 스캔·전송·조인이 겹쳐서 동시에 진행돼요.',

    exampleTitle: '예시 쿼리로 흐름 보기',
    exampleDesc:
      '아래 쿼리는 SALES를 부서별로 조인해서 부서당 매출 합계를 구해요. 조인 한 번 + 집계 한 번이라 Table Queue가 2개 등장해요.',
    exampleSql: `SELECT /*+ PARALLEL(s, 4) PARALLEL(d, 4) */
       d.dept_name, SUM(s.amount) AS total_amount
FROM   sales s
JOIN   departments d ON s.dept_id = d.dept_id
GROUP BY d.dept_name;`,

    stagesTitle: '단계별로 재생해보기',
    stagesDesc:
      '재생 버튼을 누르면 데이터 조각(●)이 실제 실행 순서대로 파이프라인을 흘러가요. 각 단계에서 무슇 연산이 일어나는지 아래 설명이 함께 바뀌어요.',

    stageLabels: [
      {
        title: '① 두 테이블을 동시에 스캔 + HASH 분배',
        desc: 'SALES를 스캔하는 PX 서버 그룹과 DEPARTMENTS를 스캔하는 PX 서버 그룹이 동시에 움직여요. 두 그룹 모두 조인 키(dept_id)를 해시해서 TQ10000으로 보내요 — 같은 dept_id는 항상 같은 Consumer로 가야 조인이 맞아떨어지기 때문이에요.',
      },
      {
        title: '② TQ10000에서 HASH JOIN 수행',
        desc: '같은 dept_id를 받은 Consumer PX가 그 자리에서 SALES 행과 DEPARTMENTS 행을 해시 조인해요. 조인된 결과 행은 곧바로 다음 단계로 넘어가요 — 조인이 끝나야 다음 단계가 시작되는 게 아니라, 조인된 행이 나오는 즉시 흘러가요.',
      },
      {
        title: '③ GROUP BY 키로 다시 HASH 분배 (TQ10001)',
        desc: '조인된 행을 이번엔 GROUP BY 키(dept_name)로 다시 해시해서 TQ10001로 보내요. 조인 키와 집계 키가 다르기 때문에 데이터를 한 번 더 재분배하는 거예요.',
      },
      {
        title: '④ 최종 HASH GROUP BY + QC로 전송',
        desc: '같은 dept_name을 받은 Consumer PX가 SUM(amount)을 계산해요. 각 Consumer가 자기 몫의 부서들에 대한 합계를 끝내면, QC(RANDOM) 방식으로 결과를 Query Coordinator에 모아 클라이언트로 반환해요.',
      },
    ],

    legendProducer: 'Producer PX (스캔)',
    legendConsumer: 'Consumer PX (조인/집계)',
    legendTq: 'Table Queue',
    legendPacketSales: 'SALES 행',
    legendPacketDept: 'DEPARTMENTS 행',
    legendPacketJoined: '조인된 행',
    legendPacketAgg: '집계 결과',

    play: '▶ 재생',
    playing: '▶ 진행 중...',
    prev: '← 이전 단계',
    next: '다음 단계 →',
    reset: '초기화',
    stepOf: (i: number, n: number) => `${i} / ${n} 단계`,

    summary:
      'Table Queue는 "Producer가 다 끝내야 Consumer가 시작하는" 배치가 아니라, 스캔·조인·집계가 동시에 흐르는 파이프라인이에요. 조인 키로 재분배(TQ10000) → 조인 → 집계 키로 재분배(TQ10001) → 최종 집계, 이렇게 재분배 기준이 바뀔 때마다 새로운 TQ가 하나씩 늘어나요.',
  },

  en: {
    title: 'Pipeline Data Flow',
    subtitle:
      'Follow, step by step, how data scanned by Producer PX Servers flows through Table Queues to Consumer PX Servers — and exactly where joins, sorts, and aggregation actually happen.',

    introTitle: 'Why call it a "pipeline"?',
    introDesc:
      'A parallel query doesn\'t process one whole batch and then hand it off — it flows like water through a pipe, with every stage running concurrently.\nEven before a Producer finishes scanning its share of the table, the rows it has already read are sent straight through the Table Queue to a Consumer, which starts joining, sorting, or aggregating the moment rows arrive. So it isn\'t "finish the scan, then start the join" — scanning, sending, and joining all overlap in time.',

    exampleTitle: 'Following an Example Query',
    exampleDesc:
      'The query below joins SALES to DEPARTMENTS and totals revenue per department. One join plus one aggregation means two Table Queues appear.',
    exampleSql: `SELECT /*+ PARALLEL(s, 4) PARALLEL(d, 4) */
       d.dept_name, SUM(s.amount) AS total_amount
FROM   sales s
JOIN   departments d ON s.dept_id = d.dept_id
GROUP BY d.dept_name;`,

    stagesTitle: 'Play Through the Stages',
    stagesDesc:
      'Press play and watch data particles (●) flow through the pipeline in actual execution order. The explanation below updates to match each stage.',

    stageLabels: [
      {
        title: '① Scan both tables concurrently + HASH distribute',
        desc: 'The PX Server group scanning SALES and the group scanning DEPARTMENTS run at the same time. Both hash the join key (dept_id) and send rows into TQ10000 — the same dept_id must always land on the same Consumer for the join to work out.',
      },
      {
        title: '② HASH JOIN happens at TQ10000',
        desc: "The Consumer PX that receives a given dept_id joins the SALES rows and DEPARTMENTS rows right there. Joined result rows flow onward immediately — the next stage doesn't wait for the join to fully finish; it starts as soon as joined rows appear.",
      },
      {
        title: '③ Re-hash by the GROUP BY key (TQ10001)',
        desc: 'Joined rows are now hashed again — this time by the GROUP BY key (dept_name) — and sent into TQ10001. Because the join key and the aggregation key differ, the data has to be redistributed a second time.',
      },
      {
        title: '④ Final HASH GROUP BY + send to QC',
        desc: 'The Consumer PX that receives a given dept_name computes SUM(amount). Once each Consumer finishes summing its share of departments, results are gathered to the Query Coordinator via QC (RANDOM) and returned to the client.',
      },
    ],

    legendProducer: 'Producer PX (scan)',
    legendConsumer: 'Consumer PX (join/aggregate)',
    legendTq: 'Table Queue',
    legendPacketSales: 'SALES row',
    legendPacketDept: 'DEPARTMENTS row',
    legendPacketJoined: 'Joined row',
    legendPacketAgg: 'Aggregated result',

    play: '▶ Play',
    playing: '▶ Running...',
    prev: '← Prev stage',
    next: 'Next stage →',
    reset: 'Reset',
    stepOf: (i: number, n: number) => `Stage ${i} / ${n}`,

    summary:
      "A Table Queue isn't a batch hand-off where the Producer must finish before the Consumer starts — it's a pipeline where scanning, joining, and aggregating all flow concurrently. Every time the redistribution key changes — hash by join key (TQ10000) → join → hash by aggregation key (TQ10001) → final aggregation — one more Table Queue appears.",
  },
}

export function ParallelPipelineSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconGitFork size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.introTitle}</SectionTitle>
      <Prose>{t.introDesc}</Prose>

      <Divider />

      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <Prose>{t.exampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.exampleSql} />
      </div>

      <Divider />

      <SectionTitle>{t.stagesTitle}</SectionTitle>
      <Prose>{t.stagesDesc}</Prose>
      <PipelineDiagram lang={lang} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}

// ── PipelineDiagram ─────────────────────────────────────────────────────────
// Producer(SALES/DEPARTMENTS) → TQ10000(HASH join key) → Consumer(HASH JOIN)
//   → TQ10001(HASH group key) → Consumer(HASH GROUP BY) → QC
// 4단계로 나눠서 재생하면 각 단계에 해당하는 패킷이 파이프를 흐르는 애니메이션.

// 다이어그램 확대 배수 — 요소 크기·간격·폰트·패킷 반지름에 일괄 적용
const PIPELINE_SCALE = 1.3

type PacketKind = 'sales' | 'dept' | 'joined' | 'agg'

function ParallelPipelineDiagramInner({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const t = T[lang]
  const TOTAL_STAGES = 4

  const [stage, setStage] = useState(0) // 0 = 시작 전, 1~4 = 단계
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!playing) return
    if (stage >= TOTAL_STAGES) {
      const tm = setTimeout(() => setPlaying(false), 0)
      return () => clearTimeout(tm)
    }
    timerRef.current = setTimeout(() => setStage((s) => s + 1), 1600)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [playing, stage])

  function handlePlay() {
    if (playing) return
    setStage(0)
    setPlaying(true)
    // 첫 단계는 살짝 뒤에 시작해서 리셋 애니메이션이 보이게
    setTimeout(() => setStage(1), 250)
  }
  function handlePrev() {
    setPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setStage((s) => Math.max(0, s - 1))
  }
  function handleNext() {
    setPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setStage((s) => Math.min(TOTAL_STAGES, s + 1))
  }
  function handleReset() {
    setPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setStage(0)
  }

  // ── SVG 레이아웃 — 가로 공간을 최대한 활용 + 30% 확대(SCALE) ──
  // (sc = scale 헬퍼. setStage 콜백의 (s) 파라미터와 이름이 겹치지 않도록 sc로 명명)
  const sc = (n: number) => Math.round(n * PIPELINE_SCALE)
  const H = sc(300)

  const PX_W = sc(96)
  const PX_H = sc(28)
  const PX_GAP = sc(10)
  const N = 3 // 시각화에 쓸 PX 서버 수 (실제는 DOP만큼이지만 다이어그램은 3개로 축약)
  const COL_GAP = sc(108) // 컬럼 사이 화살표 길이 — 라벨을 얹을 여유를 준다

  // 컬럼 x 좌표: Producer(Sales+Dept 겹쳐 표기) | TQ10000 | Consumer(Join) | TQ10001 | Consumer(Agg) | QC
  const COL_PROD_X = sc(8)
  const COL_PROD_W = PX_W
  const TQ0_X = COL_PROD_X + COL_PROD_W + COL_GAP
  const TQ0_W = sc(36)
  const COL_JOIN_X = TQ0_X + TQ0_W + COL_GAP
  const COL_JOIN_W = PX_W
  const TQ1_X = COL_JOIN_X + COL_JOIN_W + COL_GAP
  const TQ1_W = sc(36)
  const COL_AGG_X = TQ1_X + TQ1_W + COL_GAP
  const COL_AGG_W = PX_W
  const QC_X = COL_AGG_X + COL_AGG_W + COL_GAP
  const QC_W = sc(52)

  // 전체 캔버스 폭 — 오른쪽 QC 끝 + 여백만큼만. 고정값을 쓰면 남는 빈 공간이
  // viewBox 종횡비 때문에 그대로 가로 스크롤로 이어지므로 콘텐츠 끝에 맞춘다.
  const W = QC_X + QC_W + sc(8)

  const GRP_H = N * PX_H + (N - 1) * PX_GAP
  const GRP_Y = (H - GRP_H) / 2 - sc(6)
  const pxY = (i: number) => GRP_Y + i * (PX_H + PX_GAP)
  const pxCY = (i: number) => pxY(i) + PX_H / 2

  const TQ_Y = GRP_Y
  const TQ_H = GRP_H

  const QC_H = sc(60)
  const QC_Y = (H - QC_H) / 2 - sc(6)

  // Producer 두 그룹(SALES 위쪽 절반, DEPARTMENTS 아래쪽 절반)을 같은 컬럼에 나눠 표기
  const salesRows = [0, 1]
  const deptRows = [2]

  // ── 단계별 활성 여부 ──────────────────────────────────────
  const scanActive = stage === 1
  const joinActive = stage === 2
  const redistActive = stage === 3
  const aggActive = stage === 4
  const doneScan = stage >= 1
  const doneJoin = stage >= 2
  const doneRedist = stage >= 3
  const doneAgg = stage >= 4

  const PACKET_COLOR: Record<PacketKind, string> = {
    sales: 'var(--color-blue)',
    dept: 'var(--color-amber)',
    joined: 'var(--color-green)',
    agg: 'var(--color-purple)',
  }

  return (
    <div className="my-4 flex flex-col gap-3">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handlePlay}
          disabled={playing}
          className={cn(
            'rounded-card border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-line bg-rail text-ink-2 cursor-not-allowed'
              : 'border-amber/40 bg-amber/8 text-amber hover:bg-amber/15'
          )}
        >
          {playing ? t.playing : t.play}
        </button>
        <button
          onClick={handlePrev}
          disabled={playing || stage === 0}
          className="rounded-card border-line bg-paper text-ink-2 hover:bg-rail border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
        >
          {t.prev}
        </button>
        <button
          onClick={handleNext}
          disabled={playing || stage >= TOTAL_STAGES}
          className="rounded-card border-line bg-paper text-ink-2 hover:bg-rail border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
        >
          {t.next}
        </button>
        {stage > 0 && !playing && (
          <button
            onClick={handleReset}
            className="rounded-card border-line bg-paper text-ink-2 hover:bg-rail border px-3 py-1.5 font-mono text-xs transition-colors"
          >
            {t.reset}
          </button>
        )}
        <span className="text-ink-2 ml-auto font-mono text-[11px]">
          {t.stepOf(stage, TOTAL_STAGES)}
        </span>
      </div>

      {/* diagram */}
      <div className="rounded-panel bg-rail -mx-8 overflow-x-auto border p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block w-full"
          style={{ fontFamily: 'var(--font-mono-stack)', minWidth: sc(760) }}
        >
          <defs>
            <marker
              id="pp-arr"
              markerWidth={7}
              markerHeight={7}
              refX={6}
              refY={3.5}
              orient="auto"
            >
              <path d="M0,0 L0,7 L7,3.5 z" fill="var(--color-ink-3)" />
            </marker>
          </defs>

          {/* ── Producer: SALES(위 2줄) + DEPARTMENTS(아래 1줄) ─────── */}
          <rect
            x={COL_PROD_X + sc(6)}
            y={GRP_Y - sc(16)}
            width={sc(80)}
            height={sc(14)}
            rx={sc(3)}
            fill="var(--color-rail)"
          />
          <text
            x={COL_PROD_X + sc(10)}
            y={GRP_Y - sc(5)}
            fontSize={sc(8.5)}
            fontWeight="bold"
            fill="var(--color-ink-2)"
          >
            {t.legendProducer}
          </text>

          {salesRows.map((i) => (
            <g key={`sales-${i}`}>
              <rect
                x={COL_PROD_X}
                y={pxY(i)}
                width={PX_W}
                height={PX_H}
                rx={sc(5)}
                fill="var(--color-paper)"
                stroke="var(--color-blue)"
                strokeWidth={scanActive ? 2.5 : 1.3}
              />
              <text
                x={COL_PROD_X + PX_W / 2}
                y={pxCY(i) + sc(4)}
                textAnchor="middle"
                fontSize={sc(9.5)}
                fontWeight="bold"
                fill="var(--color-blue)"
              >
                SALES PX{i + 1}
              </text>
            </g>
          ))}
          {deptRows.map((i) => (
            <g key={`dept-${i}`}>
              <rect
                x={COL_PROD_X}
                y={pxY(i)}
                width={PX_W}
                height={PX_H}
                rx={sc(5)}
                fill="var(--color-paper)"
                stroke="var(--color-amber)"
                strokeWidth={scanActive ? 2.5 : 1.3}
              />
              <text
                x={COL_PROD_X + PX_W / 2}
                y={pxCY(i) + sc(4)}
                textAnchor="middle"
                fontSize={sc(9)}
                fontWeight="bold"
                fill="var(--color-amber)"
              >
                DEPT PX{i + 1}
              </text>
            </g>
          ))}

          {/* Producer → TQ10000 fan-in */}
          {[0, 1, 2].map((i) => {
            const y = pxCY(i)
            const midX =
              COL_PROD_X + COL_PROD_W + (TQ0_X - (COL_PROD_X + COL_PROD_W)) / 2
            const stroke = i < 2 ? 'var(--color-blue)' : 'var(--color-amber)'
            return (
              <polyline
                key={`prod-tq0-${i}`}
                points={`${COL_PROD_X + COL_PROD_W},${y} ${midX},${y} ${midX},${TQ_Y + TQ_H / 2} ${TQ0_X},${TQ_Y + TQ_H / 2}`}
                fill="none"
                stroke={stroke}
                strokeWidth={1.5}
                strokeOpacity={scanActive || doneScan ? 0.9 : 0.3}
                markerEnd="url(#pp-arr)"
              />
            )
          })}

          {/* ── TQ10000 ──────────────────────────────────────── */}
          <TqBar
            x={TQ0_X}
            y={TQ_Y}
            w={TQ0_W}
            h={TQ_H}
            label=":TQ10000"
            sub="HASH"
            active={scanActive || joinActive}
            scale={PIPELINE_SCALE}
          />

          {/* TQ10000 → Consumer(JOIN) fan-out */}
          {Array.from({ length: N }, (_, i) => {
            const y = pxCY(i)
            const midX = TQ0_X + TQ0_W + (COL_JOIN_X - (TQ0_X + TQ0_W)) / 2
            return (
              <polyline
                key={`tq0-join-${i}`}
                points={`${TQ0_X + TQ0_W},${TQ_Y + TQ_H / 2} ${midX},${TQ_Y + TQ_H / 2} ${midX},${y} ${COL_JOIN_X},${y}`}
                fill="none"
                stroke="var(--color-green)"
                strokeWidth={1.5}
                strokeOpacity={joinActive || doneJoin ? 0.9 : 0.3}
                markerEnd="url(#pp-arr)"
              />
            )
          })}

          {/* ── Consumer: HASH JOIN ─────────────────────────── */}
          <rect
            x={COL_JOIN_X + sc(4)}
            y={GRP_Y - sc(16)}
            width={sc(80)}
            height={sc(14)}
            rx={sc(3)}
            fill="var(--color-rail)"
          />
          <text
            x={COL_JOIN_X + sc(8)}
            y={GRP_Y - sc(5)}
            fontSize={sc(8.5)}
            fontWeight="bold"
            fill="var(--color-green)"
          >
            HASH JOIN
          </text>
          {Array.from({ length: N }, (_, i) => (
            <g key={`join-${i}`}>
              <rect
                x={COL_JOIN_X}
                y={pxY(i)}
                width={PX_W}
                height={PX_H}
                rx={sc(5)}
                fill="var(--color-paper)"
                stroke="var(--color-green)"
                strokeWidth={joinActive ? 2.5 : 1.3}
              />
              <text
                x={COL_JOIN_X + PX_W / 2}
                y={pxCY(i) + sc(4)}
                textAnchor="middle"
                fontSize={sc(9.5)}
                fontWeight="bold"
                fill="var(--color-green)"
              >
                PX{i + 1}
              </text>
            </g>
          ))}

          {/* Consumer(JOIN) → TQ10001 fan-in */}
          {Array.from({ length: N }, (_, i) => {
            const y = pxCY(i)
            const midX =
              COL_JOIN_X + COL_JOIN_W + (TQ1_X - (COL_JOIN_X + COL_JOIN_W)) / 2
            return (
              <polyline
                key={`join-tq1-${i}`}
                points={`${COL_JOIN_X + COL_JOIN_W},${y} ${midX},${y} ${midX},${TQ_Y + TQ_H / 2} ${TQ1_X},${TQ_Y + TQ_H / 2}`}
                fill="none"
                stroke="var(--color-green)"
                strokeWidth={1.5}
                strokeOpacity={redistActive || doneRedist ? 0.9 : 0.3}
                markerEnd="url(#pp-arr)"
              />
            )
          })}

          {/* ── TQ10001 ──────────────────────────────────────── */}
          <TqBar
            x={TQ1_X}
            y={TQ_Y}
            w={TQ1_W}
            h={TQ_H}
            label=":TQ10001"
            sub="HASH"
            active={redistActive || aggActive}
            scale={PIPELINE_SCALE}
          />

          {/* TQ10001 → Consumer(AGG) fan-out */}
          {Array.from({ length: N }, (_, i) => {
            const y = pxCY(i)
            const midX = TQ1_X + TQ1_W + (COL_AGG_X - (TQ1_X + TQ1_W)) / 2
            return (
              <polyline
                key={`tq1-agg-${i}`}
                points={`${TQ1_X + TQ1_W},${TQ_Y + TQ_H / 2} ${midX},${TQ_Y + TQ_H / 2} ${midX},${y} ${COL_AGG_X},${y}`}
                fill="none"
                stroke="var(--color-purple)"
                strokeWidth={1.5}
                strokeOpacity={aggActive || doneAgg ? 0.9 : 0.3}
                markerEnd="url(#pp-arr)"
              />
            )
          })}

          {/* ── Consumer: HASH GROUP BY ─────────────────────── */}
          <rect
            x={COL_AGG_X + sc(2)}
            y={GRP_Y - sc(16)}
            width={sc(92)}
            height={sc(14)}
            rx={sc(3)}
            fill="var(--color-rail)"
          />
          <text
            x={COL_AGG_X + sc(6)}
            y={GRP_Y - sc(5)}
            fontSize={sc(8.5)}
            fontWeight="bold"
            fill="var(--color-purple)"
          >
            HASH GROUP BY
          </text>
          {Array.from({ length: N }, (_, i) => (
            <g key={`agg-${i}`}>
              <rect
                x={COL_AGG_X}
                y={pxY(i)}
                width={PX_W}
                height={PX_H}
                rx={sc(5)}
                fill="var(--color-paper)"
                stroke="var(--color-purple)"
                strokeWidth={aggActive ? 2.5 : 1.3}
              />
              <text
                x={COL_AGG_X + PX_W / 2}
                y={pxCY(i) + sc(4)}
                textAnchor="middle"
                fontSize={sc(9.5)}
                fontWeight="bold"
                fill="var(--color-purple)"
              >
                PX{i + 1}
              </text>
            </g>
          ))}

          {/* Consumer(AGG) → QC fan-in */}
          <polyline
            points={`${COL_AGG_X + COL_AGG_W},${pxCY(1)} ${COL_AGG_X + COL_AGG_W + sc(18)},${pxCY(1)} ${COL_AGG_X + COL_AGG_W + sc(18)},${QC_Y + QC_H / 2} ${QC_X},${QC_Y + QC_H / 2}`}
            fill="none"
            stroke="var(--color-ink-2)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeOpacity={doneAgg ? 0.9 : 0.3}
            markerEnd="url(#pp-arr)"
          />

          {/* ── QC ───────────────────────────────────────────── */}
          <rect
            x={QC_X}
            y={QC_Y}
            width={QC_W}
            height={QC_H}
            rx={sc(8)}
            fill="var(--color-paper)"
            stroke="var(--color-ink-2)"
            strokeWidth={doneAgg ? 2.5 : 1.3}
          />
          <text
            x={QC_X + QC_W / 2}
            y={QC_Y + QC_H / 2 - sc(4)}
            textAnchor="middle"
            fontSize={sc(11)}
            fontWeight="bold"
            fill="var(--color-ink)"
          >
            QC
          </text>
          <text
            x={QC_X + QC_W / 2}
            y={QC_Y + QC_H / 2 + sc(11)}
            textAnchor="middle"
            fontSize={sc(8)}
            fill="var(--color-ink-2)"
          >
            {isKo ? '결과' : 'result'}
          </text>

          {/* ── 흐르는 패킷 애니메이션 ───────────────────────── */}
          <AnimatePresence>
            {scanActive && (
              <>
                <FlowPacket
                  key="pk-sales"
                  kind="sales"
                  fromX={COL_PROD_X + COL_PROD_W}
                  fromY={pxCY(0)}
                  midX={
                    COL_PROD_X +
                    COL_PROD_W +
                    (TQ0_X - (COL_PROD_X + COL_PROD_W)) / 2
                  }
                  toX={TQ0_X}
                  toY={TQ_Y + TQ_H / 2}
                  color={PACKET_COLOR.sales}
                />
                <FlowPacket
                  key="pk-dept"
                  kind="dept"
                  fromX={COL_PROD_X + COL_PROD_W}
                  fromY={pxCY(2)}
                  midX={
                    COL_PROD_X +
                    COL_PROD_W +
                    (TQ0_X - (COL_PROD_X + COL_PROD_W)) / 2
                  }
                  toX={TQ0_X}
                  toY={TQ_Y + TQ_H / 2}
                  color={PACKET_COLOR.dept}
                  delay={0.5}
                />
              </>
            )}
            {joinActive && (
              <FlowPacket
                key="pk-join"
                kind="joined"
                fromX={TQ0_X + TQ0_W}
                fromY={TQ_Y + TQ_H / 2}
                midX={TQ0_X + TQ0_W + (COL_JOIN_X - (TQ0_X + TQ0_W)) / 2}
                toX={COL_JOIN_X}
                toY={pxCY(1)}
                color={PACKET_COLOR.joined}
              />
            )}
            {redistActive && (
              <FlowPacket
                key="pk-redist"
                kind="joined"
                fromX={COL_JOIN_X + COL_JOIN_W}
                fromY={pxCY(1)}
                midX={
                  COL_JOIN_X +
                  COL_JOIN_W +
                  (TQ1_X - (COL_JOIN_X + COL_JOIN_W)) / 2
                }
                toX={TQ1_X}
                toY={TQ_Y + TQ_H / 2}
                color={PACKET_COLOR.joined}
              />
            )}
            {aggActive && (
              <>
                <FlowPacket
                  key="pk-agg-in"
                  kind="joined"
                  fromX={TQ1_X + TQ1_W}
                  fromY={TQ_Y + TQ_H / 2}
                  midX={TQ1_X + TQ1_W + (COL_AGG_X - (TQ1_X + TQ1_W)) / 2}
                  toX={COL_AGG_X}
                  toY={pxCY(1)}
                  color={PACKET_COLOR.joined}
                />
                <FlowPacket
                  key="pk-agg-out"
                  kind="agg"
                  fromX={COL_AGG_X + COL_AGG_W}
                  fromY={pxCY(1)}
                  midX={COL_AGG_X + COL_AGG_W + sc(18)}
                  toX={QC_X}
                  toY={QC_Y + QC_H / 2}
                  color={PACKET_COLOR.agg}
                  delay={0.7}
                />
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* legend */}
      <div className="text-ink-2 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[10px]">
        <LegendDot color="var(--color-blue)" label={t.legendPacketSales} />
        <LegendDot color="var(--color-amber)" label={t.legendPacketDept} />
        <LegendDot color="var(--color-green)" label={t.legendPacketJoined} />
        <LegendDot color="var(--color-purple)" label={t.legendPacketAgg} />
      </div>

      {/* stage explanation */}
      <AnimatePresence mode="wait">
        {stage > 0 ? (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-card border-amber/30 bg-amber/[0.06] border px-4 py-3"
          >
            <p className="text-amber font-sans text-[12.5px] font-semibold">
              {t.stageLabels[stage - 1].title}
            </p>
            <p className="font-read text-ink-2 mt-1 text-[12px] leading-relaxed">
              {t.stageLabels[stage - 1].desc}
            </p>
          </motion.div>
        ) : (
          <div className="rounded-card border-line-2 bg-paper text-ink-3 flex items-center justify-center border py-6 font-mono text-[10px]">
            {isKo ? '▶ 재생을 눌러 시작하세요' : '▶ Press Play to start'}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TqBar({
  x,
  y,
  w,
  h,
  label,
  sub,
  active,
  scale,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  sub: string
  active: boolean
  scale: number
}) {
  const labelOffset = scale * 4
  const subOffset = scale * 16
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={scale * 6}
        fill="var(--color-rail)"
        stroke="var(--color-ink-3)"
        strokeWidth={active ? 2.2 : 1.2}
        strokeOpacity={active ? 1 : 0.5}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - labelOffset}
        textAnchor="middle"
        fontSize={scale * 8}
        fontWeight="bold"
        fill="var(--color-ink-2)"
        transform={`rotate(-90 ${x + w / 2} ${y + h / 2 - labelOffset})`}
      >
        {label}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + subOffset}
        textAnchor="middle"
        fontSize={scale * 7.5}
        fill="var(--color-ink-3)"
        transform={`rotate(-90 ${x + w / 2} ${y + h / 2 + subOffset})`}
      >
        {sub}
      </text>
    </g>
  )
}

function FlowPacket({
  fromX,
  fromY,
  midX,
  toX,
  toY,
  color,
  delay = 0,
}: {
  kind: PacketKind
  fromX: number
  fromY: number
  midX: number
  toX: number
  toY: number
  color: string
  delay?: number
}) {
  return (
    <motion.circle
      r={PIPELINE_SCALE * 5}
      fill={color}
      initial={{ cx: fromX, cy: fromY, opacity: 0 }}
      animate={{
        cx: [fromX, midX, toX],
        cy: [fromY, fromY, toY],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration: 1.3, delay, ease: 'easeInOut' }}
    />
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}

function PipelineDiagram({ lang }: { lang: 'ko' | 'en' }) {
  return <ParallelPipelineDiagramInner lang={lang} />
}
