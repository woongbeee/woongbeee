import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
  InfoBox, Table, ConceptGrid, SimulatorPlaceholder, Divider, WipBanner
} from '../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    chapterTitle: '병렬 처리',
    chapterSubtitle: 'Oracle의 병렬 쿼리 실행 모델과 Degree of Parallelism(병렬도) 설정 전략을 알아봐요.',
    simDesc: '병렬 처리 시뮬레이터 — 병렬 실행 계획을 직접 시뮬레이션해 봐요.',

    overviewTitle: '병렬 처리 개요',
    overviewDesc: '병렬 쿼리 실행은 하나의 SQL 문을 여러 병렬 실행 서버(PX Servers)에 나눠서 처리하는 기법이에요. 주로 대용량 OLAP(온라인 분석 처리)/데이터 웨어하우스 환경에서 사용해요.',
    overviewItems: [
      { icon: '⚡', title: '처리 속도', desc: '대용량 집계·조인·소트를 병렬로 처리해서 속도가 빨라져요.', color: 'blue' },
      { icon: '💾', title: '리소스 사용', desc: '병렬도만큼 CPU, I/O, 메모리 사용량도 늘어나요.', color: 'orange' },
      { icon: '🎯', title: '적합한 쿼리', desc: 'Full Table Scan(전체 테이블 읽기), 대용량 조인, 집계, 정렬에 효과적이에요.', color: 'violet' },
      { icon: '⚠', title: '주의사항', desc: 'OLTP(온라인 트랜잭션 처리) 환경에서는 리소스 경쟁으로 오히려 성능이 떨어질 수 있어요.', color: 'rose' },
    ],

    dopTitle: 'Degree of Parallelism',
    dopDesc: 'DOP(Degree of Parallelism, 병렬도)는 병렬로 실행할 PX 서버의 수예요. 하나의 쿼리에서 최대 DOP×2개의 PX 서버가 사용돼요(프로듀서 + 컨슈머).',
    dopTable: [
      ['PARALLEL 힌트', '/*+ PARALLEL(t, 4) */', 'DOP를 직접 지정해요 (권장)'],
      ['테이블 속성', 'ALTER TABLE t PARALLEL 8', '테이블 레벨 기본 DOP를 설정해요'],
      ['세션 수준', 'ALTER SESSION ENABLE PARALLEL QUERY', '세션의 모든 쿼리에 자동으로 병렬을 적용해요'],
      ['자동 DOP', 'PARALLEL_DEGREE_POLICY=AUTO', 'Oracle이 자동으로 DOP를 결정해줘요 (12c+)'],
    ],
    dopInfo: 'DOP는 CPU 코어 수, I/O 대역폭, 동시 접속 사용자 수를 고려해서 설정해요. 일반적으로 DOP = CPU 코어 수 / 2 ~ CPU 코어 수 범위를 권장해요.',

    coordTitle: 'QC와 PX 서버',
    coordDesc: '병렬 쿼리에서 Query Coordinator(QC)는 PX 서버들을 조율하고 최종 결과를 모아줘요.',
    coordTable: [
      ['Query Coordinator (QC)', '쿼리를 분할하고 PX 서버에 분배해요. 최종 결과를 모아서 클라이언트에 반환해요.'],
      ['PX Server (Producer)', '데이터를 스캔하고 변환한 뒤, Consumer PX 서버에 전달해요.'],
      ['PX Server (Consumer)', 'Producer에게 데이터를 받아서 조인, 집계, 정렬을 수행해요.'],
      ['Distribution Method', '테이블 큐(Table Queue)를 통해 PX 서버 간 데이터를 재분배해요.'],
    ],
  },
  en: {
    chapterTitle: 'Parallel Processing',
    chapterSubtitle: 'Learn Oracle\'s parallel query execution model and Degree of Parallelism configuration strategies.',
    simDesc: 'Parallel Simulator — Simulate parallel execution plans.',

    overviewTitle: 'Parallel Processing Overview',
    overviewDesc: 'Parallel query execution divides a single SQL statement among multiple Parallel Execution Servers (PX Servers). Primarily used in large-scale OLAP/data warehouse environments.',
    overviewItems: [
      { icon: '⚡', title: 'Processing Speed', desc: 'Improves speed for large aggregations, joins, and sorts by parallelizing.', color: 'blue' },
      { icon: '💾', title: 'Resource Usage', desc: 'CPU, I/O, and memory usage increase proportionally with DOP.', color: 'orange' },
      { icon: '🎯', title: 'Best Queries', desc: 'Effective for Full Table Scans, large joins, aggregations, and sorts.', color: 'violet' },
      { icon: '⚠', title: 'Caution', desc: 'In OLTP environments, resource contention can actually degrade performance.', color: 'rose' },
    ],

    dopTitle: 'Degree of Parallelism',
    dopDesc: 'DOP (Degree of Parallelism) is the number of PX servers executing in parallel. A query can use up to DOP×2 PX servers (producers + consumers).',
    dopTable: [
      ['PARALLEL hint', '/*+ PARALLEL(t, 4) */', 'Explicitly sets DOP (recommended)'],
      ['Table attribute', 'ALTER TABLE t PARALLEL 8', 'Sets default DOP at table level'],
      ['Session level', 'ALTER SESSION ENABLE PARALLEL QUERY', 'Applies auto parallelism to all session queries'],
      ['Auto DOP', 'PARALLEL_DEGREE_POLICY=AUTO', 'Oracle automatically determines DOP (12c+)'],
    ],
    dopInfo: 'Set DOP considering CPU core count, I/O bandwidth, and concurrent user load. A general guideline: DOP = CPU cores / 2 to CPU cores.',

    coordTitle: 'QC & PX Servers',
    coordDesc: 'In parallel query, the Query Coordinator (QC) orchestrates PX servers and assembles the final result.',
    coordTable: [
      ['Query Coordinator (QC)', 'Splits and distributes work to PX servers. Assembles the final result and returns it to the client.'],
      ['PX Server (Producer)', 'Scans and transforms data, then sends it to Consumer PX servers.'],
      ['PX Server (Consumer)', 'Receives data from Producers and performs joins, aggregations, and sorts.'],
      ['Distribution Method', 'Redistributes data between PX servers via Table Queues.'],
    ],
  },
}

export function ParallelPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'parallel-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="⫴" title="Parallel Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Parallel Simulator" color="teal" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <WipBanner />
      {sectionId === 'parallel-overview' && (
        <>
          <ChapterTitle icon="⫴" title={t.chapterTitle} subtitle={t.chapterSubtitle} />
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Prose>{t.overviewDesc}</Prose>
          <ConceptGrid items={t.overviewItems} />
          <Divider />
          <ParallelAnimation />
        </>
      )}
      {sectionId === 'parallel-dop' && (
        <>
          <SectionTitle>{t.dopTitle}</SectionTitle>
          <Prose>{t.dopDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '방법' : 'Method', lang === 'ko' ? '구문' : 'Syntax', lang === 'ko' ? '설명' : 'Description']}
            rows={t.dopTable}
          />
          <InfoBox variant="usage">
            {t.dopInfo}
          </InfoBox>
        </>
      )}
      {sectionId === 'parallel-coordinator' && (
        <>
          <SectionTitle>{t.coordTitle}</SectionTitle>
          <Prose>{t.coordDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '역할' : 'Role', lang === 'ko' ? '설명' : 'Description']}
            rows={t.coordTable}
          />
        </>
      )}
    </PageContainer>
  )
}

function ParallelAnimation() {
  const lang = useSimulationStore((s) => s.lang)
  const [dop, setDop] = useState(4)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<number[]>([])

  function runDemo() {
    setRunning(true)
    setProgress(Array(dop).fill(0))

    const intervals = Array.from({ length: dop }, (_, i) =>
      setInterval(() => {
        setProgress((prev) => {
          const next = [...prev]
          next[i] = Math.min(100, next[i] + Math.floor(Math.random() * 15 + 5))
          return next
        })
      }, 100 + i * 30)
    )

    setTimeout(() => {
      intervals.forEach(clearInterval)
      setProgress(Array(dop).fill(100))
      setRunning(false)
    }, 2500)
  }

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {lang === 'ko' ? '병렬 처리 시뮬레이션' : 'Parallel Execution Simulation'}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">DOP:</span>
        {[2, 4, 8].map((d) => (
          <button
            key={d}
            onClick={() => { setDop(d); setProgress([]) }}
            disabled={running}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-xs transition-all disabled:opacity-50',
              dop === d ? 'border-blue-400 bg-blue-100 text-blue-700 font-bold' : 'hover:bg-muted'
            )}
          >
            {d}
          </button>
        ))}
      </div>

      {/* QC */}
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded border border-violet-300 bg-violet-50 px-3 py-1.5 font-mono text-[11px] font-bold text-violet-700">
          QC {lang === 'ko' ? '(조율자)' : '(Coordinator)'}
        </div>
        <div className="font-mono text-muted-foreground/40">↓</div>
      </div>

      {/* PX Servers */}
      <div className="flex flex-col gap-2 mb-4">
        {Array.from({ length: dop }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-20 shrink-0 rounded border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[10px] text-blue-700">
              PX {i + 1}
            </div>
            <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress[i] ?? 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="w-10 font-mono text-[10px] text-muted-foreground text-right">
              {progress[i] ?? 0}%
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={runDemo}
        disabled={running}
        className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 font-mono text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50"
      >
        {running
          ? (lang === 'ko' ? '실행 중...' : 'Running...')
          : (lang === 'ko' ? '▶ 병렬 실행 시작' : '▶ Start Parallel Execution')}
      </button>
    </div>
  )
}
