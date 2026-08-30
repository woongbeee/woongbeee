import { IconGitFork } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Table,
  SqlBlock,
  Divider,
} from '../shared'

const T = {
  ko: {
    title: 'QC와 PX 서버',
    subtitle:
      '병렬 쿼리의 두 주역인 Query Coordinator(QC)와 PX 서버의 역할, 그리고 데이터 재분배 방식을 알아봐요.',

    rolesTitle: '역할 분담',
    rolesDesc:
      'Oracle 병렬 쿼리는 하나의 QC와 여러 PX 서버로 구성돼요. QC는 지휘자, PX 서버는 연주자예요.',
    rolesTable: [
      [
        'Query Coordinator (QC)',
        '사용자 세션 자체가 QC 역할을 해요. SQL 파싱, 실행 계획 생성, PX 서버 할당, 최종 결과 취합까지 총괄해요.',
        '쿼리 실행 내내 유지. 클라이언트와 직접 통신해요.',
      ],
      [
        'PX Server (Producer)',
        '테이블을 스캔하거나 조인의 첫 번째 단계를 수행해요. 처리한 데이터를 Table Queue(TQ)로 Consumer에게 보내요.',
        "실행 계획의 'P→P' 또는 'P→S' 화살표가 이 흐름을 나타내요.",
      ],
      [
        'PX Server (Consumer)',
        'Producer에게 데이터를 받아서 집계, 조인, 정렬 등의 다음 단계를 수행해요.',
        'Consumer가 다시 다른 Consumer의 Producer 역할을 하는 다중 파이프라인도 가능해요.',
      ],
      [
        'Table Queue (TQ)',
        'Producer와 Consumer PX 서버 사이의 데이터 전달 통로예요. 공유 메모리 또는 네트워크(RAC)를 통해 동작해요.',
        'V$PQ_TQSTAT 뷰로 TQ 통계를 확인할 수 있어요.',
      ],
    ],

    distTitle: '데이터 재분배(Distribution) 방식',
    distDesc:
      'Producer가 데이터를 Consumer에게 전달할 때 어떻게 나눌지를 결정하는 방식이에요. 옵티마이저가 자동으로 선택하지만 힌트로 오버라이드할 수 있어요.',
    distTable: [
      [
        'HASH',
        '조인 키 또는 GROUP BY 키를 해시해서 같은 키는 같은 Consumer에게 전달해요.',
        '가장 일반적. 조인·집계에 사용해요.',
      ],
      [
        'BROADCAST',
        '한쪽 테이블 전체를 모든 Consumer PX 서버에 복사해요.',
        '작은 테이블과 큰 테이블의 조인에 사용해요 (작은 쪽이 Broadcast).',
      ],
      [
        'ROUND-ROBIN',
        '행을 순서대로 돌아가며 Consumer에게 배분해요. 부하 균등이 목적이에요.',
        '정렬이 필요 없는 단순 스캔·필터에 사용해요.',
      ],
      [
        'RANGE',
        '정렬 키 범위로 Consumer를 나눠요. 소트 결과를 순서대로 병합할 때 써요.',
        'ORDER BY와 함께 쓰이는 경우에 나타나요.',
      ],
      [
        'PARTITION',
        '파티션 테이블의 경우 같은 파티션 데이터를 같은 PX 서버에 보내요.',
        'Partition-Wise Join 실행 시 사용해요.',
      ],
    ],

    planTitle: '실행 계획에서 병렬 정보 읽기',
    planDesc:
      'EXPLAIN PLAN 또는 DBMS_XPLAN.DISPLAY_CURSOR로 확인하면 병렬 실행 계획을 볼 수 있어요.',
    planSql: `-- 실행 계획 확인 (병렬 쿼리)
EXPLAIN PLAN FOR
SELECT /*+ PARALLEL(s, 4) */ region, SUM(amount)
FROM sales s
GROUP BY region;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- 실제 실행 통계 확인 (실행 후)
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id    => NULL,   -- 가장 최근 SQL
    format    => 'ALLSTATS LAST PARALLEL'
  )
);`,
    planNote:
      "실행 계획에서 'PX SEND' / 'PX RECEIVE' 연산이 Table Queue 통신을 나타내요. ':TQ10000' 같은 표기가 TQ 번호예요. PARALLEL_TO_PARALLEL(P→P), PARALLEL_TO_SERIAL(P→S) 등 Distribution 방식도 함께 표시돼요.",

    monitorTitle: '병렬 실행 모니터링',
    monitorDesc:
      '운영 중인 병렬 쿼리의 현황과 병목 지점을 실시간으로 확인할 수 있어요.',
    monitorTable: [
      ['V$PX_SESSION', '현재 실행 중인 PX 서버 세션 목록', 'QC와 PX 서버의 SID·상태 확인'],
      ['V$PX_PROCESS', '각 PX 프로세스의 현재 상태와 담당 TQ', 'Producer/Consumer 역할 확인'],
      ['V$PQ_TQSTAT', '완료된 병렬 쿼리의 TQ별 행 수·바이트', '데이터 스큐(쏠림) 감지에 유용'],
      ['V$SQL_PLAN_STATISTICS', 'SQL 실행 계획 각 단계의 실제 실행 통계', '예상 행 수 vs 실제 행 수 비교'],
    ],
    monitorWarning:
      '병렬 쿼리에서 특정 PX 서버만 데이터가 몰리는 데이터 스큐(Skew)가 발생하면, 해당 PX 서버가 끝날 때까지 나머지가 대기해요. V$PQ_TQSTAT로 TQ별 행 수를 비교하면 스큐를 감지할 수 있어요.',

    summary:
      'QC는 병렬 쿼리의 지휘자로 작업 분배와 결과 취합을 담당하고, PX 서버들은 Producer/Consumer 역할로 나뉘어 Table Queue를 통해 데이터를 주고받아요. 데이터 재분배 방식(HASH, BROADCAST 등)은 옵티마이저가 자동 선택하지만, 실행 계획을 분석해서 스큐나 비효율적인 분배가 있으면 힌트로 조정할 수 있어요.',
  },

  en: {
    title: 'QC & PX Servers',
    subtitle:
      "Explore the roles of the Query Coordinator (QC) and PX Servers — parallel query's two key actors — and how data is redistributed between them.",

    rolesTitle: 'Role Division',
    rolesDesc:
      "An Oracle parallel query consists of one QC and multiple PX Servers. Think of the QC as the conductor and PX Servers as the musicians.",
    rolesTable: [
      [
        'Query Coordinator (QC)',
        'The user session itself acts as the QC — it handles SQL parsing, execution plan generation, PX Server allocation, and final result assembly.',
        'Present throughout the query lifecycle; communicates directly with the client.',
      ],
      [
        'PX Server (Producer)',
        'Scans the table or performs the first stage of a join. Sends processed data to Consumers via a Table Queue (TQ).',
        "The 'P→P' or 'P→S' arrows in the execution plan represent this flow.",
      ],
      [
        'PX Server (Consumer)',
        'Receives data from Producers and performs the next stage: aggregation, join, or sort.',
        'Consumers can themselves be Producers for another downstream Consumer — multi-level pipelines are possible.',
      ],
      [
        'Table Queue (TQ)',
        'The data channel between Producer and Consumer PX Servers. Operates via shared memory or the network (RAC).',
        'TQ statistics are available in V$PQ_TQSTAT.',
      ],
    ],

    distTitle: 'Data Distribution Methods',
    distDesc:
      'This determines how Producers distribute data to Consumers. The optimizer chooses automatically, but hints can override.',
    distTable: [
      [
        'HASH',
        'Hashes the join key or GROUP BY key so the same key always goes to the same Consumer.',
        'Most common; used for joins and aggregations.',
      ],
      [
        'BROADCAST',
        'Copies an entire small table to every Consumer PX Server.',
        'Used when joining a small table to a large one (small side is broadcast).',
      ],
      [
        'ROUND-ROBIN',
        'Distributes rows in rotation across Consumers for even load balancing.',
        'Used for simple scans and filters where no ordering is needed.',
      ],
      [
        'RANGE',
        'Divides Consumers by sort-key range for in-order merging of sorted results.',
        'Appears with ORDER BY operations.',
      ],
      [
        'PARTITION',
        "Sends each partition's data to the same PX Server for partitioned tables.",
        'Used during Partition-Wise Join execution.',
      ],
    ],

    planTitle: 'Reading Parallel Info in the Execution Plan',
    planDesc:
      'Use EXPLAIN PLAN or DBMS_XPLAN.DISPLAY_CURSOR to view the parallel execution plan.',
    planSql: `-- View execution plan for a parallel query
EXPLAIN PLAN FOR
SELECT /*+ PARALLEL(s, 4) */ region, SUM(amount)
FROM sales s
GROUP BY region;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- View actual runtime statistics (after execution)
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id    => NULL,   -- most recent SQL
    format    => 'ALLSTATS LAST PARALLEL'
  )
);`,
    planNote:
      "In the execution plan, 'PX SEND' / 'PX RECEIVE' operations represent Table Queue communication. Notation like ':TQ10000' is the TQ number. Distribution methods (PARALLEL_TO_PARALLEL P→P, PARALLEL_TO_SERIAL P→S, etc.) are also shown.",

    monitorTitle: 'Monitoring Parallel Execution',
    monitorDesc:
      'You can check the live status and bottlenecks of running parallel queries in real time.',
    monitorTable: [
      ['V$PX_SESSION', 'List of currently active PX Server sessions', 'Check SID and status of QC and PX Servers'],
      ['V$PX_PROCESS', 'Current state and TQ assignment for each PX process', 'Identify Producer/Consumer roles'],
      ['V$PQ_TQSTAT', 'Row counts and bytes per TQ for completed parallel queries', 'Useful for detecting data skew'],
      ['V$SQL_PLAN_STATISTICS', 'Actual runtime stats per execution plan operation', 'Compare estimated vs actual row counts'],
    ],
    monitorWarning:
      'Data skew in a parallel query — where most data flows to one PX Server — causes others to wait until that server finishes. Compare per-TQ row counts in V$PQ_TQSTAT to detect skew.',

    summary:
      'The QC directs the parallel query by distributing work and assembling results; PX Servers split into Producer and Consumer roles and exchange data through Table Queues. The optimizer automatically selects distribution methods (HASH, BROADCAST, etc.), but if you detect skew or inefficient distribution in the execution plan, you can adjust with hints.',
  },
}

export function ParallelCoordinatorSection() {
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

      <SectionTitle>{t.rolesTitle}</SectionTitle>
      <Prose>{t.rolesDesc}</Prose>
      <Table
        headers={isKo ? ['역할', '설명', '비고'] : ['Role', 'Description', 'Notes']}
        rows={t.rolesTable}
      />

      <ParallelArchDiagram lang={lang} />

      <Divider />

      <SectionTitle>{t.distTitle}</SectionTitle>
      <Prose>{t.distDesc}</Prose>
      <Table
        headers={
          isKo
            ? ['방식', '동작', '사용 상황']
            : ['Method', 'How It Works', 'When Used']
        }
        rows={t.distTable}
      />

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.planSql} />
      </div>
      <InfoBox variant="note">{t.planNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.monitorTitle}</SectionTitle>
      <Prose>{t.monitorDesc}</Prose>
      <Table
        headers={isKo ? ['뷰', '내용', '활용'] : ['View', 'Content', 'Use Case']}
        rows={t.monitorTable}
      />
      <InfoBox variant="warning">{t.monitorWarning}</InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}

function ParallelArchDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  // ── 전체 캔버스 ──────────────────────────────────────────
  const W = 760
  const H = 280

  // ── QC (왼쪽) ────────────────────────────────────────────
  const QC_W = 62
  const QC_H = 100
  const QC_X = 8
  const QC_Y = (H - QC_H) / 2   // 세로 중앙

  // ── Producer 그룹 박스 ───────────────────────────────────
  const GRP_PAD = 10             // 그룹 박스 내부 패딩
  const PX_W = 72
  const PX_H = 28
  const PX_GAP = 10              // PX 박스 간 세로 간격
  const N = 4                    // PX 수

  const PROD_GRP_X = QC_X + QC_W + 22
  const PROD_GRP_W = GRP_PAD * 2 + PX_W
  const PROD_GRP_H = GRP_PAD * 2 + N * PX_H + (N - 1) * PX_GAP
  const PROD_GRP_Y = (H - PROD_GRP_H) / 2

  // PX 박스 y 좌표 (그룹 박스 내 상대 → 절대)
  const pxY = (i: number) => PROD_GRP_Y + GRP_PAD + i * (PX_H + PX_GAP)
  const pxCY = (i: number) => pxY(i) + PX_H / 2   // 수직 중심

  // ── TABLE QUEUE (세로 버스) ──────────────────────────────
  const TQ_W = 68
  const TQ_X = PROD_GRP_X + PROD_GRP_W + 26
  const TQ_Y = PROD_GRP_Y
  const TQ_H = PROD_GRP_H
  const TQ_CX = TQ_X + TQ_W / 2

  // ── Consumer 그룹 박스 ───────────────────────────────────
  const CONS_GRP_X = TQ_X + TQ_W + 26
  const CONS_GRP_W = GRP_PAD * 2 + PX_W
  const CONS_GRP_H = PROD_GRP_H
  const CONS_GRP_Y = PROD_GRP_Y

  // Consumer PX 박스 x 고정 (그룹 박스 왼쪽 패딩 + 절대 좌표)
  const cpxX = CONS_GRP_X + GRP_PAD

  // ── QC (오른쪽, 결과 수집) ───────────────────────────────
  const QC2_X = CONS_GRP_X + CONS_GRP_W + 22
  const QC2_Y = QC_Y

  // ── 연결선 x 좌표 ────────────────────────────────────────
  const prodRightX = PROD_GRP_X + PROD_GRP_W   // Producer 그룹 오른쪽 끝
  const tqLeftX    = TQ_X                       // TQ 왼쪽 벽
  const tqRightX   = TQ_X + TQ_W               // TQ 오른쪽 벽
  const consLeftX  = CONS_GRP_X                 // Consumer 그룹 왼쪽 끝

  return (
    <div className="my-6 overflow-x-auto rounded-panel border bg-rail p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full"
        style={{ fontFamily: 'monospace', minWidth: 480 }}
      >
        <defs>
          <marker id="arr-v" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--color-purple)" />
          </marker>
          <marker id="arr-g" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" />
          </marker>
          <marker id="arr-b" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" />
          </marker>
        </defs>

        {/* ── 왼쪽 QC ─────────────────────────────────────── */}
        <rect x={QC_X} y={QC_Y} width={QC_W} height={QC_H} rx={8}
          fill="var(--color-rail)" stroke="var(--color-purple)" strokeWidth={1.5} />
        <text x={QC_X + QC_W / 2} y={QC_Y + QC_H / 2 - 8}
          textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--color-purple)">QC</text>
        <text x={QC_X + QC_W / 2} y={QC_Y + QC_H / 2 + 6}
          textAnchor="middle" fontSize={7.5} fill="var(--color-purple)">
          {isKo ? '작업' : 'Dispatch'}
        </text>
        <text x={QC_X + QC_W / 2} y={QC_Y + QC_H / 2 + 17}
          textAnchor="middle" fontSize={7.5} fill="var(--color-purple)">
          {isKo ? '분배' : 'work'}
        </text>

        {/* QC → Producer 그룹 화살표 */}
        <line
          x1={QC_X + QC_W} y1={QC_Y + QC_H / 2}
          x2={PROD_GRP_X - 1} y2={QC_Y + QC_H / 2}
          stroke="var(--color-purple)" strokeWidth={1.5} strokeDasharray="5 3"
          markerEnd="url(#arr-v)"
        />

        {/* ── Producer 그룹 박스 ──────────────────────────── */}
        <rect x={PROD_GRP_X} y={PROD_GRP_Y} width={PROD_GRP_W} height={PROD_GRP_H}
          rx={8} fill="var(--color-rail)" stroke="var(--color-green)" strokeWidth={1.5} />
        {/* 그룹 레이블 — 박스 상단 배경 위에 렌더 */}
        <rect x={PROD_GRP_X + 6} y={PROD_GRP_Y - 8} width={78} height={14} rx={3} fill="var(--color-rail)" />
        <text x={PROD_GRP_X + 10} y={PROD_GRP_Y + 2}
          fontSize={8} fontWeight="bold" fill="var(--color-green)">
          Producer PX
        </text>

        {/* Producer PX 박스 4개 */}
        {Array.from({ length: N }, (_, i) => (
          <g key={`prod-${i}`}>
            <rect
              x={PROD_GRP_X + GRP_PAD} y={pxY(i)}
              width={PX_W} height={PX_H} rx={5}
              fill="var(--color-rail)" stroke="var(--color-green)" strokeWidth={1}
            />
            <text x={PROD_GRP_X + GRP_PAD + PX_W / 2} y={pxY(i) + PX_H / 2 + 4}
              textAnchor="middle" fontSize={9} fontWeight="bold" fill="var(--color-green)">
              PX {i + 1}
            </text>
          </g>
        ))}

        {/* Producer → TQ 왼쪽 벽 fan-in 선 */}
        {Array.from({ length: N }, (_, i) => {
          const y = pxCY(i)
          const midX = prodRightX + (tqLeftX - prodRightX) / 2
          return (
            <polyline
              key={`prod-tq-${i}`}
              points={`${prodRightX},${y} ${midX},${y} ${midX},${TQ_Y + TQ_H / 2} ${tqLeftX},${TQ_Y + TQ_H / 2}`}
              fill="none" stroke="var(--color-green)" strokeWidth={1.2}
              markerEnd="url(#arr-g)"
            />
          )
        })}

        {/* ── TABLE QUEUE 세로 버스 ───────────────────────── */}
        <rect x={TQ_X} y={TQ_Y} width={TQ_W} height={TQ_H}
          rx={6} fill="var(--color-amber)" stroke="var(--color-amber)" strokeWidth={1.5} />
        <text x={TQ_CX} y={TQ_Y + TQ_H / 2 - 18}
          textAnchor="middle" fontSize={8} fontWeight="bold" fill="var(--color-amber)">TABLE</text>
        <text x={TQ_CX} y={TQ_Y + TQ_H / 2 - 7}
          textAnchor="middle" fontSize={8} fontWeight="bold" fill="var(--color-amber)">QUEUE</text>
        {/* 구분선 */}
        <line x1={TQ_X + 6} y1={TQ_Y + TQ_H / 2 + 2} x2={TQ_X + TQ_W - 6} y2={TQ_Y + TQ_H / 2 + 2}
          stroke="var(--color-amber)" strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={TQ_CX} y={TQ_Y + TQ_H / 2 + 14}
          textAnchor="middle" fontSize={7} fill="var(--color-amber)">PX SEND</text>
        <text x={TQ_CX} y={TQ_Y + TQ_H / 2 + 24}
          textAnchor="middle" fontSize={7} fill="var(--color-amber)">↕</text>
        <text x={TQ_CX} y={TQ_Y + TQ_H / 2 + 34}
          textAnchor="middle" fontSize={7} fill="var(--color-amber)">PX RECV</text>

        {/* TQ 오른쪽 벽 → Consumer fan-out 선 */}
        {Array.from({ length: N }, (_, i) => {
          const y = pxCY(i)
          const midX = tqRightX + (consLeftX - tqRightX) / 2
          return (
            <polyline
              key={`tq-cons-${i}`}
              points={`${tqRightX},${TQ_Y + TQ_H / 2} ${midX},${TQ_Y + TQ_H / 2} ${midX},${y} ${consLeftX},${y}`}
              fill="none" stroke="var(--color-blue)" strokeWidth={1.2}
              markerEnd="url(#arr-b)"
            />
          )
        })}

        {/* ── Consumer 그룹 박스 ──────────────────────────── */}
        <rect x={CONS_GRP_X} y={CONS_GRP_Y} width={CONS_GRP_W} height={CONS_GRP_H}
          rx={8} fill="var(--color-rail)" stroke="var(--color-blue)" strokeWidth={1.5} />
        <rect x={CONS_GRP_X + 6} y={CONS_GRP_Y - 8} width={80} height={14} rx={3} fill="var(--color-rail)" />
        <text x={CONS_GRP_X + 10} y={CONS_GRP_Y + 2}
          fontSize={8} fontWeight="bold" fill="var(--color-blue)">
          Consumer PX
        </text>

        {/* Consumer PX 박스 4개 */}
        {Array.from({ length: N }, (_, i) => (
          <g key={`cons-${i}`}>
            <rect
              x={cpxX} y={pxY(i)}
              width={PX_W} height={PX_H} rx={5}
              fill="var(--color-rail)" stroke="var(--color-blue)" strokeWidth={1}
            />
            <text x={cpxX + PX_W / 2} y={pxY(i) + PX_H / 2 + 4}
              textAnchor="middle" fontSize={9} fontWeight="bold" fill="var(--color-blue)">
              PX {i + 1}
            </text>
          </g>
        ))}

        {/* Consumer 그룹 → 오른쪽 QC 화살표 */}
        <line
          x1={CONS_GRP_X + CONS_GRP_W} y1={CONS_GRP_Y + CONS_GRP_H / 2}
          x2={QC2_X - 1} y2={QC2_Y + QC_H / 2}
          stroke="var(--color-purple)" strokeWidth={1.5} strokeDasharray="5 3"
          markerEnd="url(#arr-v)"
        />

        {/* ── 오른쪽 QC (결과 수집) ───────────────────────── */}
        <rect x={QC2_X} y={QC2_Y} width={QC_W} height={QC_H} rx={8}
          fill="var(--color-rail)" stroke="var(--color-purple)" strokeWidth={1.5} />
        <text x={QC2_X + QC_W / 2} y={QC2_Y + QC_H / 2 - 8}
          textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--color-purple)">QC</text>
        <text x={QC2_X + QC_W / 2} y={QC2_Y + QC_H / 2 + 6}
          textAnchor="middle" fontSize={7.5} fill="var(--color-purple)">
          {isKo ? '결과' : 'Merge'}
        </text>
        <text x={QC2_X + QC_W / 2} y={QC2_Y + QC_H / 2 + 17}
          textAnchor="middle" fontSize={7.5} fill="var(--color-purple)">
          {isKo ? '수집' : '→ Client'}
        </text>
      </svg>
      <p className="mt-2 text-center font-mono text-[10px] text-ink-2">
        {isKo
          ? 'QC(작업 분배) → Producer PX 집합 → TABLE QUEUE → Consumer PX 집합 → QC(결과 수집)'
          : 'QC (dispatch) → Producer PX set → TABLE QUEUE → Consumer PX set → QC (merge)'}
      </p>
    </div>
  )
}
