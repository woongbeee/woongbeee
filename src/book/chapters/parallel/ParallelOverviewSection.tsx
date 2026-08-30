import { IconGitFork } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  ConceptGrid,
  SqlBlock,
  Divider,
  StepList,
} from '../shared'

const T = {
  ko: {
    title: '병렬 처리',
    subtitle:
      'Oracle 병렬 쿼리 실행 모델을 알아봐요. 하나의 SQL을 여러 PX 서버에 나눠 처리해서 대용량 데이터를 빠르게 분석할 수 있어요.',

    whatTitle: '병렬 처리란?',
    whatDesc:
      '하나의 SQL 문을 여러 개의 병렬 실행 서버(PX Server, Parallel eXecution Server)에 나눠서 동시에 처리하는 기법이에요.\n\n예를 들어 DOP(Degree of Parallelism, 병렬도)가 4라면, 테이블을 4조각으로 나눠 4개의 PX 서버가 각자 맡은 조각을 읽고 처리해요. 혼자서 10분 걸리던 집계 쿼리가 4명이 나눠 처리하면 약 2~3분으로 줄어드는 거예요.',

    conceptTitle: '병렬 처리가 빠른 이유',
    concepts: [
      {
        icon: '⚡',
        title: '처리 속도 향상',
        desc: '대용량 집계·조인·정렬을 PX 서버들이 동시에 처리해서 소요 시간이 크게 줄어들어요.',
        color: 'blue',
      },
      {
        icon: '💾',
        title: 'I/O 분산',
        desc: '여러 PX 서버가 서로 다른 디스크 블록을 동시에 읽어서 I/O 병목이 줄어들어요.',
        color: 'teal',
      },
      {
        icon: '🎯',
        title: '적합한 워크로드',
        desc: 'Full Table Scan, 대용량 조인, 집계, 정렬 등 OLAP/DW 쿼리에 효과적이에요.',
        color: 'orange',
      },
      {
        icon: '⚠️',
        title: 'OLTP에서는 주의',
        desc: '짧은 트랜잭션이 많은 OLTP 환경에서는 PX 서버 경쟁으로 오히려 성능이 떨어질 수 있어요.',
        color: 'rose',
      },
    ],

    howTitle: '병렬 쿼리 실행 흐름',
    howDesc:
      '병렬 쿼리는 QC(Query Coordinator)가 지휘하고, PX 서버들이 실제 작업을 나눠서 처리해요.',
    howSteps: [
      {
        title: '① SQL 수신 및 실행 계획 생성',
        desc: 'QC(사용자 세션)가 SQL을 받아서 병렬 실행 계획을 생성해요. DOP를 결정하고 PX 서버 풀에서 필요한 PX 서버를 할당받아요.',
      },
      {
        title: '② 작업 분배',
        desc: 'QC가 테이블(또는 파티션)을 DOP 수만큼의 블록 범위(Granule)로 나눠서 각 PX 서버에 배분해요.',
      },
      {
        title: '③ 병렬 실행',
        desc: 'Producer PX 서버들이 각자 맡은 데이터를 읽고 변환해요. 그 결과를 Consumer PX 서버들에게 Table Queue(TQ)를 통해 전달해요.',
      },
      {
        title: '④ 결과 병합',
        desc: 'QC가 모든 PX 서버의 결과를 받아서 최종 정렬·집계를 수행하고 클라이언트에 반환해요.',
      },
    ],

    hintTitle: '병렬 쿼리 힌트',
    hintDesc: '가장 간단한 방법은 PARALLEL 힌트로 DOP를 직접 지정하는 거예요.',
    hintSql: `-- 테이블 풀스캔을 DOP 4로 병렬 처리
SELECT /*+ PARALLEL(s, 4) */ COUNT(*), SUM(amount)
FROM sales s
WHERE sale_date >= DATE '2024-01-01';

-- 두 테이블 조인을 병렬로 처리
SELECT /*+ PARALLEL(o, 4) PARALLEL(c, 4) */
       c.name, COUNT(o.order_id)
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.name;`,

    whenTitle: '언제 병렬 처리를 쓸까?',
    whenDesc:
      '병렬 처리는 강력하지만 리소스를 많이 써요. DOP가 4이면 CPU, I/O, 메모리 모두 최대 4배까지 사용할 수 있어요.',
    whenTable: [
      ['OLAP / DW 집계', '수백만 건 이상 집계·분석', '✅ 권장'],
      ['대용량 배치 ETL', '야간 대용량 변환·적재 작업', '✅ 권장'],
      ['DDL (인덱스 생성 등)', 'CREATE INDEX, CREATE TABLE AS SELECT', '✅ 권장'],
      ['소규모 OLTP 쿼리', '인덱스로 수십 건 조회', '❌ 불필요 (오히려 느려짐)'],
      ['동시 사용자가 많은 환경', '피크 시간대 OLTP 서버', '⚠️ 신중히 판단'],
    ],

    summary:
      '병렬 처리는 대용량 분석 쿼리의 소요 시간을 획기적으로 줄이는 핵심 기법이에요. QC가 작업을 조율하고 PX 서버들이 나눠서 처리하는 구조를 이해하면, DOP 설정과 튜닝 전략을 훨씬 쉽게 결정할 수 있어요.',
  },

  en: {
    title: 'Parallel Processing',
    subtitle:
      "Learn Oracle's parallel query execution model — splitting a single SQL statement across multiple PX Servers to analyze large data volumes at speed.",

    whatTitle: 'What is Parallel Processing?',
    whatDesc:
      'Parallel query execution divides a single SQL statement among multiple Parallel Execution Servers (PX Servers) that run concurrently.\n\nFor example, with DOP (Degree of Parallelism) = 4, the table is split into 4 pieces, and 4 PX Servers each process their share simultaneously. An aggregation query that takes 10 minutes alone can finish in roughly 2–3 minutes with 4 servers.',

    conceptTitle: 'Why Parallel Queries Are Faster',
    concepts: [
      {
        icon: '⚡',
        title: 'Faster Throughput',
        desc: 'Large aggregations, joins, and sorts run concurrently across PX Servers, dramatically reducing elapsed time.',
        color: 'blue',
      },
      {
        icon: '💾',
        title: 'Distributed I/O',
        desc: 'Multiple PX Servers read different disk blocks simultaneously, reducing I/O bottlenecks.',
        color: 'teal',
      },
      {
        icon: '🎯',
        title: 'Best Workloads',
        desc: 'Most effective for OLAP/DW workloads: Full Table Scans, large joins, aggregations, and sorts.',
        color: 'orange',
      },
      {
        icon: '⚠️',
        title: 'Caution in OLTP',
        desc: 'In OLTP environments with many short transactions, PX Server contention can actually degrade performance.',
        color: 'rose',
      },
    ],

    howTitle: 'Parallel Query Execution Flow',
    howDesc:
      'The QC (Query Coordinator) directs the work, while PX Servers split and process the actual data.',
    howSteps: [
      {
        title: '① Receive SQL & Generate Plan',
        desc: 'The QC (user session) receives the SQL, generates a parallel execution plan, determines DOP, and allocates PX Servers from the pool.',
      },
      {
        title: '② Distribute Work',
        desc: 'The QC partitions the table (or partitions) into block ranges called Granules — one per PX Server — and dispatches them.',
      },
      {
        title: '③ Parallel Execution',
        desc: 'Producer PX Servers each read and transform their assigned data, then pass results to Consumer PX Servers via Table Queues (TQ).',
      },
      {
        title: '④ Merge Results',
        desc: 'The QC collects all PX Server results, performs final sort/aggregation, and returns the result to the client.',
      },
    ],

    hintTitle: 'Parallel Query Hints',
    hintDesc:
      'The simplest way to enable parallelism is to specify the DOP with the PARALLEL hint.',
    hintSql: `-- Parallel full table scan with DOP 4
SELECT /*+ PARALLEL(s, 4) */ COUNT(*), SUM(amount)
FROM sales s
WHERE sale_date >= DATE '2024-01-01';

-- Parallel join on two tables
SELECT /*+ PARALLEL(o, 4) PARALLEL(c, 4) */
       c.name, COUNT(o.order_id)
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.name;`,

    whenTitle: 'When to Use Parallel Processing',
    whenDesc:
      'Parallel processing is powerful but resource-intensive. With DOP = 4, CPU, I/O, and memory usage can each increase up to 4×.',
    whenTable: [
      ['OLAP / DW aggregation', 'Millions of rows, analytic queries', '✅ Recommended'],
      ['Large batch ETL', 'Overnight large-volume transform & load', '✅ Recommended'],
      ['DDL (index creation, etc.)', 'CREATE INDEX, CREATE TABLE AS SELECT', '✅ Recommended'],
      ['Small OLTP queries', 'Index lookups returning a few rows', '❌ Unnecessary (slower)'],
      ['High-concurrency environments', 'Peak-time OLTP servers', '⚠️ Evaluate carefully'],
    ],

    summary:
      'Parallel processing is a key technique for dramatically reducing the elapsed time of large analytic queries. Understanding the QC-orchestrates / PX-Servers-execute model makes DOP configuration and tuning decisions much clearer.',
  },
}

export function ParallelOverviewSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconGitFork size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.conceptTitle}</SectionTitle>
      <ConceptGrid items={t.concepts} />

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <Prose>{t.howDesc}</Prose>
      <StepList steps={t.howSteps} />

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <Divider />

      <SectionTitle>{t.whenTitle}</SectionTitle>
      <Prose>{t.whenDesc}</Prose>
      <ParallelVsSerialDiagram lang={lang} />
      <table className="mb-6 w-full overflow-hidden rounded-card border text-xs">
        <thead>
          <tr className="border-b bg-rail">
            <th className="px-4 py-2.5 text-left font-mono font-bold text-ink-2">
              {isKo ? '상황' : 'Situation'}
            </th>
            <th className="px-4 py-2.5 text-left font-mono font-bold text-ink-2">
              {isKo ? '예시' : 'Example'}
            </th>
            <th className="px-4 py-2.5 text-left font-mono font-bold text-ink-2">
              {isKo ? '권장' : 'Recommendation'}
            </th>
          </tr>
        </thead>
        <tbody>
          {t.whenTable.map((row, i) => (
            <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-paper' : 'bg-rail'}`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 font-mono text-[11px] text-ink/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}

// DOP별 직렬 vs 병렬 소요 시간 비교 간트 차트
// DOP별 소요 시간 비교 — 버튼 없이 한눈에
function ParallelVsSerialDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  // 전체 작업을 100단위로 고정. 병렬 오버헤드 10% 가산
  const ROWS: { label: string; dop: number; time: number; isSerial: boolean }[] = [
    { label: isKo ? 'DOP 1 (직렬)' : 'DOP 1 (serial)', dop: 1,  time: 100, isSerial: true  },
    { label: 'DOP 2',                                     dop: 2,  time: 60,  isSerial: false },
    { label: 'DOP 4',                                     dop: 4,  time: 35,  isSerial: false },
    { label: 'DOP 8',                                     dop: 8,  time: 23,  isSerial: false },
  ]
  const MAX_TIME = 100

  // SVG 레이아웃
  const W        = 560
  const ROW_H    = 36
  const ROW_GAP  = 14
  const LABEL_W  = 96   // 레이블 열 너비
  const BAR_AREA = W - LABEL_W - 100  // 바 그리는 영역 (오른쪽 100은 시간 레이블 공간)
  const TOP_PAD  = 8
  const rowY     = (i: number) => TOP_PAD + i * (ROW_H + ROW_GAP)
  const H        = TOP_PAD + ROWS.length * (ROW_H + ROW_GAP) + 8

  return (
    <div className="mb-6 overflow-hidden rounded-panel border bg-rail p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'monospace' }}>
        {ROWS.map((row, i) => {
          const y      = rowY(i)
          const barW   = Math.round((row.time / MAX_TIME) * BAR_AREA)
          const saving = Math.round((1 - row.time / MAX_TIME) * 100)
          const barFill   = row.isSerial ? 'var(--color-red)' : 'var(--color-green)'
          const barStroke = row.isSerial ? 'var(--color-red)' : 'var(--color-green)'
          const textFill  = row.isSerial ? 'var(--color-red)' : 'var(--color-green)'
          const midCY  = y + ROW_H / 2

          return (
            <g key={row.label}>
              {/* 행 레이블 */}
              <text
                x={LABEL_W - 8} y={midCY + 4}
                textAnchor="end" fontSize={9} fontWeight="bold"
                fill={row.isSerial ? 'var(--color-ink-2)' : 'var(--color-green)'}
              >
                {row.label}
              </text>

              {/* 배경 트랙 (전체 100% 너비) */}
              <rect
                x={LABEL_W} y={y}
                width={BAR_AREA} height={ROW_H}
                rx={5} fill={row.isSerial ? 'var(--color-rail)' : 'var(--color-rail)'}
                stroke={row.isSerial ? 'var(--color-red)' : 'var(--color-green)'}
                strokeWidth={1}
              />

              {/* 실제 소요 시간 바 */}
              <rect
                x={LABEL_W} y={y}
                width={barW} height={ROW_H}
                rx={5} fill={barFill} stroke={barStroke} strokeWidth={1.5}
              />

              {/* 바 내부 텍스트: 충분히 넓을 때만 */}
              {barW > 48 && (
                <text
                  x={LABEL_W + barW / 2} y={midCY + 4}
                  textAnchor="middle" fontSize={9} fontWeight="bold" fill={textFill}
                >
                  {row.time}{isKo ? '초' : 's'}
                </text>
              )}

              {/* 바 끝 세로선 */}
              <line
                x1={LABEL_W + barW} y1={y + 4}
                x2={LABEL_W + barW} y2={y + ROW_H - 4}
                stroke={barStroke} strokeWidth={1.5}
              />

              {/* 오른쪽 시간 + 절감률 */}
              <text
                x={LABEL_W + barW + 8} y={midCY + 4}
                fontSize={9} fontWeight="bold" fill={textFill}
              >
                {row.isSerial
                  ? (isKo ? '기준' : 'baseline')
                  : `${row.time}${isKo ? '초' : 's'}  (-${saving}%)`}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="mt-2 text-center font-mono text-[10px] text-ink-2">
        {isKo
          ? 'DOP가 높을수록 바가 짧아져요 — 같은 작업을 더 빨리 끝낼 수 있어요'
          : 'Higher DOP = shorter bar — the same work completes faster'}
      </p>
    </div>
  )
}
