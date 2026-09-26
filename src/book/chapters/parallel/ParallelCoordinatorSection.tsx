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

    pxAbbrTitle: 'PX는 무슨 뜻일까?',
    pxAbbrDesc:
      'PX는 Parallel Execution(병렬 실행)의 줄임말이에요. 그래서 "PX 서버"는 곧 Parallel Execution Server, 즉 하나의 SQL을 나눠서 실제로 처리하는 병렬 실행 서버를 가리켜요.\n\n실행 계획이나 V$PX_SESSION 같은 뷰에서 보이는 "PX"로 시작하는 이름들도 전부 같은 맥락이에요 — PX SEND(병렬 서버가 데이터를 보냄), PX RECEIVE(병렬 서버가 데이터를 받음), PX COORDINATOR(QC), PX BLOCK ITERATOR(테이블을 블록 단위로 나눠 읽는 반복자) 처럼, "PX"는 "이 연산이 병렬 실행 서버에 의해 수행된다"는 표시예요.',

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
      [
        'V$PX_SESSION',
        '현재 실행 중인 PX 서버 세션 목록',
        'QC와 PX 서버의 SID·상태 확인',
      ],
      [
        'V$PX_PROCESS',
        '각 PX 프로세스의 현재 상태와 담당 TQ',
        'Producer/Consumer 역할 확인',
      ],
      [
        'V$PQ_TQSTAT',
        '완료된 병렬 쿼리의 TQ별 행 수·바이트',
        '데이터 스큐(쏠림) 감지에 유용',
      ],
      [
        'V$SQL_PLAN_STATISTICS',
        'SQL 실행 계획 각 단계의 실제 실행 통계',
        '예상 행 수 vs 실제 행 수 비교',
      ],
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

    pxAbbrTitle: 'What Does "PX" Stand For?',
    pxAbbrDesc:
      'PX is short for Parallel Execution. So a "PX Server" is a Parallel Execution Server — one of the workers that actually processes a slice of a single SQL statement in parallel.\n\nEvery "PX"-prefixed name you see in execution plans or views like V$PX_SESSION follows the same pattern: PX SEND (a parallel server sending data), PX RECEIVE (a parallel server receiving data), PX COORDINATOR (the QC), PX BLOCK ITERATOR (an iterator that splits a table into block ranges for parallel servers to read). The "PX" prefix simply marks that a parallel execution server carries out that operation.',

    rolesTitle: 'Role Division',
    rolesDesc:
      'An Oracle parallel query consists of one QC and multiple PX Servers. Think of the QC as the conductor and PX Servers as the musicians.',
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
      [
        'V$PX_SESSION',
        'List of currently active PX Server sessions',
        'Check SID and status of QC and PX Servers',
      ],
      [
        'V$PX_PROCESS',
        'Current state and TQ assignment for each PX process',
        'Identify Producer/Consumer roles',
      ],
      [
        'V$PQ_TQSTAT',
        'Row counts and bytes per TQ for completed parallel queries',
        'Useful for detecting data skew',
      ],
      [
        'V$SQL_PLAN_STATISTICS',
        'Actual runtime stats per execution plan operation',
        'Compare estimated vs actual row counts',
      ],
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

      <SectionTitle>{t.pxAbbrTitle}</SectionTitle>
      <Prose>{t.pxAbbrDesc}</Prose>

      <Divider />

      <SectionTitle>{t.rolesTitle}</SectionTitle>
      <Prose>{t.rolesDesc}</Prose>
      <Table
        headers={
          isKo ? ['역할', '설명', '비고'] : ['Role', 'Description', 'Notes']
        }
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
        headers={
          isKo ? ['뷰', '내용', '활용'] : ['View', 'Content', 'Use Case']
        }
        rows={t.monitorTable}
      />
      <InfoBox variant="warning">{t.monitorWarning}</InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}

// 전체 다이어그램 확대 배수 — 요소 크기·간격·폰트에 일괄 적용
const SCALE = 1.17

function ParallelArchDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const s = (n: number) => Math.round(n * SCALE)

  // ── 전체 캔버스 — 가로·세로 모두 SCALE배 (부모 폭은 -mx로 카드 밖까지 확장) ──
  // W는 실제 콘텐츠(오른쪽 QC 끝)에 맞춰 아래에서 역산 — 남는 빈 공간이 가로 스크롤을
  // 만들지 않도록 고정값을 쓰지 않는다.
  const H = s(300)

  // ── QC (왼쪽) ────────────────────────────────────────────
  const QC_W = s(74)
  const QC_H = s(108)
  const QC_X = s(4)
  const QC_Y = (H - QC_H) / 2 // 세로 중앙

  // ── Producer 그룹 박스 ───────────────────────────────────
  const GRP_PAD = s(12) // 그룹 박스 내부 패딩
  const PX_W = s(84)
  const PX_H = s(30)
  const PX_GAP = s(12) // PX 박스 간 세로 간격
  const N = 4 // PX 수

  // PX ↔ TQ 사이 화살표 길이를 넉넉히 줘서 중간에 설명 라벨을 얹는다
  const ARROW_GAP = s(96)

  const PROD_GRP_X = QC_X + QC_W + ARROW_GAP
  const PROD_GRP_W = GRP_PAD * 2 + PX_W
  const PROD_GRP_H = GRP_PAD * 2 + N * PX_H + (N - 1) * PX_GAP
  const PROD_GRP_Y = (H - PROD_GRP_H) / 2

  // PX 박스 y 좌표 (그룹 박스 내 상대 → 절대)
  const pxY = (i: number) => PROD_GRP_Y + GRP_PAD + i * (PX_H + PX_GAP)
  const pxCY = (i: number) => pxY(i) + PX_H / 2 // 수직 중심

  // ── TABLE QUEUE — Producer PX 각각을 대응하는 Consumer PX에 직접 잇는
  // "파이프" N개(PX 수와 동일)로 표현. 화살표로 모으고 흩뜨리는 대신,
  // 각 PX 높이(pxCY)에 맞춰 나란히 놓인 원통형 관들이 그대로 이어진다.
  // 파이프는 Producer 그룹 오른쪽 끝에서 시작해 Consumer 그룹 왼쪽 끝까지
  // 틈 없이 꽉 채워야 "연결돼 있다"는 게 보인다 — ARROW_GAP 전체가 파이프 길이. ──
  const TQ_PIPE_H = s(16) // 파이프 하나의 굵기(세로) — PX 박스보다 얇게
  const TQ_X = PROD_GRP_X + PROD_GRP_W // 파이프 시작 = Producer 그룹 오른쪽 벽에 맞닿음
  const TQ_W = ARROW_GAP // 파이프 길이 = Producer~Consumer 사이 간격 전체
  const TQ_CX = TQ_X + TQ_W / 2

  // ── Consumer 그룹 박스 ───────────────────────────────────
  const CONS_GRP_X = TQ_X + TQ_W // 파이프 끝 = Consumer 그룹 왼쪽 벽에 맞닿음
  const CONS_GRP_W = GRP_PAD * 2 + PX_W
  const CONS_GRP_H = PROD_GRP_H
  const CONS_GRP_Y = PROD_GRP_Y

  // Consumer PX 박스 x 고정 (그룹 박스 왼쪽 패딩 + 절대 좌표)
  const cpxX = CONS_GRP_X + GRP_PAD

  // ── QC (오른쪽, 결과 수집) ───────────────────────────────
  const QC2_X = CONS_GRP_X + CONS_GRP_W + ARROW_GAP
  const QC2_Y = QC_Y

  // 전체 캔버스 폭 — 오른쪽 QC 끝 + 여백만큼만. 남는 빈 공간이 생기면
  // viewBox 종횡비 때문에 가로 스크롤이 생기므로 콘텐츠 끝에 딱 맞춘다.
  const W = QC2_X + QC_W + s(4)

  return (
    <div className="rounded-panel bg-rail -mx-8 my-6 overflow-x-auto border p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block w-full"
        style={{ fontFamily: 'var(--font-mono-stack)' }}
      >
        <defs>
          <marker
            id="arr-v"
            markerWidth={7}
            markerHeight={7}
            refX={6}
            refY={3.5}
            orient="auto"
          >
            <path d="M0,0 L0,7 L7,3.5 z" fill="var(--color-purple)" />
          </marker>
        </defs>

        {/* ── 왼쪽 QC ─────────────────────────────────────── */}
        <rect
          x={QC_X}
          y={QC_Y}
          width={QC_W}
          height={QC_H}
          rx={s(8)}
          fill="var(--color-paper)"
          stroke="var(--color-purple)"
          strokeWidth={2}
        />
        <text
          x={QC_X + QC_W / 2}
          y={QC_Y + QC_H / 2 - s(10)}
          textAnchor="middle"
          fontSize={s(13)}
          fontWeight="bold"
          fill="var(--color-purple)"
        >
          QC
        </text>
        <text
          x={QC_X + QC_W / 2}
          y={QC_Y + QC_H / 2 + s(8)}
          textAnchor="middle"
          fontSize={s(8.5)}
          fill="var(--color-purple)"
        >
          {isKo ? '작업' : 'Dispatch'}
        </text>
        <text
          x={QC_X + QC_W / 2}
          y={QC_Y + QC_H / 2 + s(20)}
          textAnchor="middle"
          fontSize={s(8.5)}
          fill="var(--color-purple)"
        >
          {isKo ? '분배' : 'work'}
        </text>

        {/* QC → Producer 그룹 화살표 + 라벨 (라벨 뒤에 배경을 깔아 선과 겹치지 않게) */}
        <line
          x1={QC_X + QC_W}
          y1={QC_Y + QC_H / 2}
          x2={PROD_GRP_X - 1}
          y2={QC_Y + QC_H / 2}
          stroke="var(--color-purple)"
          strokeWidth={2}
          strokeDasharray="6 4"
          markerEnd="url(#arr-v)"
        />
        <rect
          x={QC_X + QC_W + ARROW_GAP / 2 - s(58)}
          y={QC_Y + QC_H / 2 - s(16)}
          width={s(116)}
          height={s(13)}
          fill="var(--color-rail)"
        />
        <text
          x={QC_X + QC_W + ARROW_GAP / 2}
          y={QC_Y + QC_H / 2 - s(8)}
          textAnchor="middle"
          fontSize={s(8)}
          fontWeight="bold"
          fill="var(--color-purple)"
        >
          {isKo ? '실행 계획 · Granule 분배' : 'Plan · Granule dispatch'}
        </text>

        {/* ── Producer 그룹 박스 ──────────────────────────── */}
        <rect
          x={PROD_GRP_X}
          y={PROD_GRP_Y}
          width={PROD_GRP_W}
          height={PROD_GRP_H}
          rx={s(8)}
          fill="var(--color-paper)"
          stroke="var(--color-green)"
          strokeWidth={2}
        />
        {/* 그룹 레이블 — 박스 상단 배경 위에 렌더 */}
        <rect
          x={PROD_GRP_X + s(6)}
          y={PROD_GRP_Y - s(10)}
          width={s(112)}
          height={s(18)}
          rx={s(3)}
          fill="var(--color-rail)"
        />
        <text
          x={PROD_GRP_X + s(10)}
          y={PROD_GRP_Y + s(3)}
          fontSize={s(10)}
          fontWeight="bold"
          fill="var(--color-green)"
        >
          Producer PX
        </text>

        {/* Producer PX 박스 4개 */}
        {Array.from({ length: N }, (_, i) => (
          <g key={`prod-${i}`}>
            <rect
              x={PROD_GRP_X + GRP_PAD}
              y={pxY(i)}
              width={PX_W}
              height={PX_H}
              rx={s(5)}
              fill="var(--color-rail)"
              stroke="var(--color-green)"
              strokeWidth={1.3}
            />
            <text
              x={PROD_GRP_X + GRP_PAD + PX_W / 2}
              y={pxY(i) + PX_H / 2 + s(4)}
              textAnchor="middle"
              fontSize={s(11)}
              fontWeight="bold"
              fill="var(--color-green)"
            >
              PX {i + 1}
            </text>
          </g>
        ))}

        {/* ── TABLE QUEUE — Producer PX 각각을 대응하는 Consumer PX에 직접
            잇는 "파이프" N개. 화살표로 한데 모으지 않고, 각 PX 높이에 원통형
            관을 그대로 이어서 "PX SEND → 파이프 통과 → PX RECEIVE"가 PX
            단위로 대응된다는 것을 보여준다. ── */}
        {Array.from({ length: N }, (_, i) => {
          const y = pxCY(i)
          const pipeY = y - TQ_PIPE_H / 2
          return (
            <g key={`pipe-${i}`}>
              {/* 파이프 몸통 — 양 끝이 완전한 반원인 캡슐 형태 */}
              <rect
                x={TQ_X}
                y={pipeY}
                width={TQ_W}
                height={TQ_PIPE_H}
                rx={TQ_PIPE_H / 2}
                fill="color-mix(in srgb, var(--color-amber) 14%, var(--color-paper))"
                stroke="var(--color-amber)"
                strokeWidth={1.6}
              />
              {/* 안쪽 하이라이트 — 관 속의 입체감 */}
              <rect
                x={TQ_X + TQ_PIPE_H * 0.25}
                y={pipeY + TQ_PIPE_H * 0.14}
                width={TQ_W - TQ_PIPE_H * 0.5}
                height={TQ_PIPE_H * 0.3}
                rx={TQ_PIPE_H * 0.15}
                fill="var(--color-paper)"
                opacity={0.55}
              />
              {/* 파이프 속을 흐르는 데이터 점 — Producer(왼쪽)→Consumer(오른쪽)로
                  갈수록 진해져서 흐름 방향을 표현 */}
              {Array.from({ length: 4 }, (_, di) => {
                const dx =
                  TQ_X +
                  TQ_PIPE_H * 0.6 +
                  (di + 0.5) * ((TQ_W - TQ_PIPE_H * 1.2) / 4)
                return (
                  <circle
                    key={`dot-${i}-${di}`}
                    cx={dx}
                    cy={y}
                    r={s(1.8 + di * 0.35)}
                    fill="var(--color-amber)"
                    opacity={0.35 + di * 0.15}
                  />
                )
              })}
            </g>
          )
        })}

        {/* TABLE QUEUE 묶음 라벨 — 파이프 다발 위 중앙에 한 번만 */}
        <text
          x={TQ_CX}
          y={PROD_GRP_Y - s(14)}
          textAnchor="middle"
          fontSize={s(10)}
          fontWeight="bold"
          fill="var(--color-amber)"
        >
          TABLE QUEUE
        </text>

        {/* PX SEND — Producer 그룹 박스에 거의 닿도록 파이프 입구 쪽으로 바짝
            붙여서, "Producer가 보내는 동작"이라는 소속이 분명하게 보이게 한다.
            세로 위치는 가운데 두 파이프 사이의 빈틈(그룹 중앙 높이)에 둬서
            어느 파이프와도 겹치지 않으면서 그룹에서 뻗어나온 느낌을 준다. */}
        <rect
          x={TQ_X}
          y={PROD_GRP_Y + PROD_GRP_H / 2 - s(6.5)}
          width={s(40)}
          height={s(11)}
          fill="var(--color-rail)"
        />
        <text
          x={TQ_X + s(3)}
          y={PROD_GRP_Y + PROD_GRP_H / 2 + s(1.5)}
          textAnchor="start"
          fontSize={s(7)}
          fontWeight="bold"
          fill="var(--color-green)"
        >
          PX SEND
        </text>

        {/* PX RECEIVE — Consumer 그룹 박스에 거의 닿도록 파이프 출구 쪽으로
            바짝 붙여서, "Consumer가 받는 동작"이라는 소속이 분명하게 보이게 */}
        <rect
          x={TQ_X + TQ_W - s(48)}
          y={PROD_GRP_Y + PROD_GRP_H / 2 - s(6.5)}
          width={s(48)}
          height={s(11)}
          fill="var(--color-rail)"
        />
        <text
          x={TQ_X + TQ_W - s(3)}
          y={PROD_GRP_Y + PROD_GRP_H / 2 + s(1.5)}
          textAnchor="end"
          fontSize={s(7)}
          fontWeight="bold"
          fill="var(--color-blue)"
        >
          PX RECEIVE
        </text>

        {/* :TQ10000 재분배 설명 — 파이프 다발 아래 중앙에 한 번만 */}
        <text
          x={TQ_CX}
          y={PROD_GRP_Y + PROD_GRP_H + s(16)}
          textAnchor="middle"
          fontSize={s(8.5)}
          fill="var(--color-ink-2)"
        >
          {isKo
            ? ':TQ10000 — 같은 키는 같은 파이프로'
            : ':TQ10000 — same key, same pipe'}
        </text>

        {/* ── Consumer 그룹 박스 ──────────────────────────── */}
        <rect
          x={CONS_GRP_X}
          y={CONS_GRP_Y}
          width={CONS_GRP_W}
          height={CONS_GRP_H}
          rx={s(8)}
          fill="var(--color-paper)"
          stroke="var(--color-blue)"
          strokeWidth={2}
        />
        <rect
          x={CONS_GRP_X + s(6)}
          y={CONS_GRP_Y - s(10)}
          width={s(114)}
          height={s(18)}
          rx={s(3)}
          fill="var(--color-rail)"
        />
        <text
          x={CONS_GRP_X + s(10)}
          y={CONS_GRP_Y + s(3)}
          fontSize={s(10)}
          fontWeight="bold"
          fill="var(--color-blue)"
        >
          Consumer PX
        </text>

        {/* Consumer PX 박스 4개 */}
        {Array.from({ length: N }, (_, i) => (
          <g key={`cons-${i}`}>
            <rect
              x={cpxX}
              y={pxY(i)}
              width={PX_W}
              height={PX_H}
              rx={s(5)}
              fill="var(--color-rail)"
              stroke="var(--color-blue)"
              strokeWidth={1.3}
            />
            <text
              x={cpxX + PX_W / 2}
              y={pxY(i) + PX_H / 2 + s(4)}
              textAnchor="middle"
              fontSize={s(11)}
              fontWeight="bold"
              fill="var(--color-blue)"
            >
              PX {i + 1}
            </text>
          </g>
        ))}

        {/* Consumer 그룹 → 오른쪽 QC 화살표 + 라벨 (라벨 뒤에 배경을 깔아 선과 겹치지 않게) */}
        <line
          x1={CONS_GRP_X + CONS_GRP_W}
          y1={CONS_GRP_Y + CONS_GRP_H / 2}
          x2={QC2_X - 1}
          y2={QC2_Y + QC_H / 2}
          stroke="var(--color-purple)"
          strokeWidth={2}
          strokeDasharray="6 4"
          markerEnd="url(#arr-v)"
        />
        <rect
          x={CONS_GRP_X + CONS_GRP_W + ARROW_GAP / 2 - s(40)}
          y={CONS_GRP_Y + CONS_GRP_H / 2 - s(16)}
          width={s(80)}
          height={s(28)}
          fill="var(--color-rail)"
        />
        <text
          x={CONS_GRP_X + CONS_GRP_W + ARROW_GAP / 2}
          y={CONS_GRP_Y + CONS_GRP_H / 2 - s(8)}
          textAnchor="middle"
          fontSize={s(8)}
          fontWeight="bold"
          fill="var(--color-purple)"
        >
          QC (RANDOM)
        </text>
        <text
          x={CONS_GRP_X + CONS_GRP_W + ARROW_GAP / 2}
          y={CONS_GRP_Y + CONS_GRP_H / 2 + s(4)}
          textAnchor="middle"
          fontSize={s(7.5)}
          fill="var(--color-ink-2)"
        >
          {isKo ? 'P→S 직렬화' : 'P->S serialize'}
        </text>

        {/* ── 오른쪽 QC (결과 수집) ───────────────────────── */}
        <rect
          x={QC2_X}
          y={QC2_Y}
          width={QC_W}
          height={QC_H}
          rx={s(8)}
          fill="var(--color-paper)"
          stroke="var(--color-purple)"
          strokeWidth={2}
        />
        <text
          x={QC2_X + QC_W / 2}
          y={QC2_Y + QC_H / 2 - s(10)}
          textAnchor="middle"
          fontSize={s(13)}
          fontWeight="bold"
          fill="var(--color-purple)"
        >
          QC
        </text>
        <text
          x={QC2_X + QC_W / 2}
          y={QC2_Y + QC_H / 2 + s(8)}
          textAnchor="middle"
          fontSize={s(8.5)}
          fill="var(--color-purple)"
        >
          {isKo ? '결과' : 'Merge'}
        </text>
        <text
          x={QC2_X + QC_W / 2}
          y={QC2_Y + QC_H / 2 + s(20)}
          textAnchor="middle"
          fontSize={s(8.5)}
          fill="var(--color-purple)"
        >
          {isKo ? '수집' : '→ Client'}
        </text>
      </svg>
      <p className="text-ink-2 mt-3 text-center font-mono text-[11px]">
        {isKo
          ? 'QC(작업 분배) → Producer PX 집합 → TABLE QUEUE → Consumer PX 집합 → QC(결과 수집)'
          : 'QC (dispatch) → Producer PX set → TABLE QUEUE → Consumer PX set → QC (merge)'}
      </p>
    </div>
  )
}
