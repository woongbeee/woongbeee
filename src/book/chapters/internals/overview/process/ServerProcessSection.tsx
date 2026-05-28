import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, InfoBox, Divider } from '../../../shared'
import { IconServer } from '@tabler/icons-react'

const T = {
  ko: {
    title: '서버 프로세스',
    subtitle: 'SQL을 파싱·실행·반환하는 DB 서버 측 프로세스',

    whatTitle: '서버 프로세스가 하는 일',
    whatP1:
      '서버 프로세스(Server Process)는 클라이언트가 보낸 SQL을 실제로 처리하는 주체예요. SQL 파싱, 실행 계획 만들기, 데이터 블록 읽기, 결과 돌려주기까지 — "쿼리 실행"과 관련된 모든 일이 여기서 이루어져요.',
    whatP2:
      '서버 프로세스는 항상 SGA(System Global Area)를 공유 메모리로 사용하고, 자기만의 PGA(Program Global Area)를 따로 할당받아요. 처리 방식에 따라 Dedicated(전용) 서버와 Shared(공유) 서버로 나뉘어요.',

    dedicatedTitle: 'Dedicated Server — 전용 서버',
    dedicatedDesc:
      '클라이언트 하나당 서버 프로세스 하나가 1:1로 딱 붙어서 담당해요. 연결이 끊어지기 전까지는 그 서버 프로세스가 다른 클라이언트 요청을 처리하지 않아요. 대부분의 OLTP 환경에서 기본으로 사용하는 방식이에요.',
    dedicatedFeatures: [
      '연결이 살아있는 동안 프로세스가 그 세션만을 위해 전용으로 묶여요.',
      'UGA(User Global Area)가 PGA 안에 들어가요.',
      '세션 수 = 서버 프로세스 수이기 때문에 동시 접속자가 수천 명이면 OS 리소스를 많이 사용해요.',
      '미들티어의 Connection Pool 없이 직접 연결하면 확장성이 떨어질 수 있어요.',
    ],

    sharedTitle: 'Shared Server — 공유 서버',
    sharedDesc:
      '여러 클라이언트가 소수의 서버 프로세스를 함께 나눠 써요. 디스패처(Dispatcher, Dnnn)가 클라이언트 요청을 수신 큐(Request Queue)에 넣으면, 쉬고 있던 서버 프로세스(Snnn)가 꺼내서 처리하고 응답 큐(Response Queue)에 결과를 써요.',
    sharedFeatures: [
      '디스패처(Dnnn)가 클라이언트 연결을 받아 SGA 요청 큐에 넣어줘요.',
      '서버 프로세스(Snnn)들이 큐를 번갈아가며 처리해요.',
      'UGA(User Global Area)가 PGA가 아닌 SGA(Large Pool) 안에 들어가요.',
      '동시 접속자 수 대비 서버 프로세스 수를 훨씬 줄일 수 있어서 메모리를 아껴요.',
      '각 요청을 서로 다른 서버 프로세스가 처리할 수 있기 때문에, 세션 컨텍스트는 SGA에 보관해요.',
    ],

    compTitle: 'Dedicated vs Shared Server 비교',
    compRows: [
      { aspect: '서버 프로세스 수',   dedicated: '세션 수와 동일 (1:1)',  shared: '소수, 여러 세션이 공유' },
      { aspect: 'UGA 위치',           dedicated: 'PGA 내부',              shared: 'SGA (Large Pool)' },
      { aspect: '메모리 사용',         dedicated: '세션마다 PGA 독립 할당', shared: 'PGA 공유로 절약' },
      { aspect: '적합한 환경',         dedicated: 'OLTP, 대부분의 경우',   shared: '동시 접속자가 아주 많은 환경' },
      { aspect: '설정',               dedicated: '기본값 (별도 설정 불필요)', shared: 'DISPATCHERS, SHARED_SERVERS 파라미터 필요' },
    ],

    dispatcherTitle: '디스패처(Dispatcher, Dnnn)',
    dispatcherDesc:
      'Shared Server 모드에서 디스패처가 클라이언트와 직접 통신해요. 여러 클라이언트의 요청을 받아 SGA 안의 요청 큐(Request Queue)에 넣고, 서버 프로세스가 처리를 마치면 응답 큐(Response Queue)에서 결과를 가져다가 클라이언트에게 돌려줘요.',
    dispatcherNote:
      'V$DISPATCHER 뷰로 디스패처의 현재 상태와 부하를 확인할 수 있어요. 디스패처가 병목이면 DISPATCHERS 파라미터로 수를 늘리면 돼요.',

    pgaPosTitle: 'PGA 위치 비교 (세션별 메모리)',
    pgaPosNote:
      'Dedicated Server에서는 서버 프로세스마다 OS로부터 PGA를 독립적으로 받아요. Shared Server에서는 세션 컨텍스트(UGA)를 Large Pool에 저장하기 때문에, Large Pool 크기를 넉넉하게 잡아야 해요.',

    paramsTitle: '관련 파라미터',
    params: [
      { name: 'DISPATCHERS',       desc: "Shared Server의 디스패처 수와 프로토콜을 설정해요. 예: \"(PROTOCOL=TCP)(DISPATCHERS=3)\"" },
      { name: 'SHARED_SERVERS',    desc: '시작 시 만들 서버 프로세스 수예요. Oracle이 부하에 따라 자동으로 늘리거나 줄여요.' },
      { name: 'MAX_SHARED_SERVERS',desc: 'Shared Server 프로세스의 최대 수예요.' },
      { name: 'MAX_DISPATCHERS',   desc: '디스패처 프로세스의 최대 수예요.' },
    ],
  },
  en: {
    title: 'Server Processes',
    subtitle: 'The DB-side processes that parse, execute, and return SQL results',

    whatTitle: 'What is a Server Process?',
    whatP1:
      'A server process is the entity that actually processes SQL sent by a client process. All "query execution" work happens here — SQL parsing, execution plan generation, reading data blocks, and returning results.',
    whatP2:
      "Server processes always reference the SGA as shared memory and each receives its own PGA (Program Global Area). Based on the processing mode, they are classified as either Dedicated servers or Shared servers.",

    dedicatedTitle: 'Dedicated Server',
    dedicatedDesc:
      'One server process corresponds 1:1 to one client process. While the client maintains a connection, that server process does not handle other clients. This is the default for most OLTP environments.',
    dedicatedFeatures: [
      'The process is exclusively tied to the connection for its lifetime.',
      'UGA (User Global Area) resides inside the PGA.',
      'Sessions = server processes, so thousands of simultaneous connections consume significant OS resources.',
      'Without a connection pool (middle-tier), scalability is limited.',
    ],

    sharedTitle: 'Shared Server',
    sharedDesc:
      'Multiple clients share a small pool of server processes. A dispatcher (Dnnn) receives client requests into a Request Queue in the SGA; idle server processes (Snnn) pick them up, process them, and write results to a Response Queue.',
    sharedFeatures: [
      'Dispatchers (Dnnn) accept client connections and place requests in the SGA request queue.',
      'Server processes (Snnn) take turns picking up and processing queue entries.',
      'UGA resides in SGA (Large Pool), not PGA.',
      'Far fewer server processes are needed relative to simultaneous connections, saving memory.',
      'Since different server processes may handle consecutive requests, session context is stored in SGA.',
    ],

    compTitle: 'Comparison: Dedicated vs Shared Server',
    compRows: [
      { aspect: 'Server process count', dedicated: 'Same as sessions (1:1)',      shared: 'Small pool shared across sessions' },
      { aspect: 'UGA location',         dedicated: 'Inside PGA',                  shared: 'SGA (Large Pool)' },
      { aspect: 'Memory usage',         dedicated: 'Independent PGA per session',  shared: 'Reduced via shared PGA' },
      { aspect: 'Suited for',           dedicated: 'OLTP, most environments',      shared: 'Very high concurrent connections' },
      { aspect: 'Configuration',        dedicated: 'Default (no extra setup)',      shared: 'Requires DISPATCHERS, SHARED_SERVERS params' },
    ],

    dispatcherTitle: 'Dispatcher (Dnnn)',
    dispatcherDesc:
      'In Shared Server mode, dispatchers communicate directly with clients. They receive connection requests from multiple clients and place each request into the SGA Request Queue. Once a server process completes processing, it writes the response to the Response Queue, and the dispatcher returns it to the client.',
    dispatcherNote:
      'Monitor dispatcher status and load with the V$DISPATCHER view. If dispatchers are a bottleneck, increase their count using the DISPATCHERS parameter.',

    pgaPosTitle: 'PGA Location Comparison (per-session memory)',
    pgaPosNote:
      'In Dedicated Server, PGA is independently allocated from the OS for each server process. In Shared Server, session context (UGA) is stored in the Large Pool, so the Large Pool must be sized sufficiently.',

    paramsTitle: 'Related Parameters',
    params: [
      { name: 'DISPATCHERS',       desc: 'Sets the number of dispatchers and protocol for Shared Server. E.g., "(PROTOCOL=TCP)(DISPATCHERS=3)"' },
      { name: 'SHARED_SERVERS',    desc: 'Number of server processes to create at startup. Oracle automatically adjusts based on load.' },
      { name: 'MAX_SHARED_SERVERS',desc: 'Maximum number of Shared Server processes.' },
      { name: 'MAX_DISPATCHERS',   desc: 'Maximum number of dispatcher processes.' },
    ],
  },
}

// ── Dedicated Server Diagram ──────────────────────────────────────────────────

function DedicatedDiagram({ isKo }: { isKo: boolean }) {
  const W = 520
  const N = 3
  const CL_W = 112; const CL_H = 44; const CL_GAP = 20
  const TOTAL_CL_W = N * CL_W + (N - 1) * CL_GAP   // 376
  const CL_X0 = (W - TOTAL_CL_W) / 2               // 72
  const CL_Y = 16

  // 화살표: 클라이언트 하단 → 서버 프로세스 상단, 여유 44px
  const ARR_GAP = 44
  const ARR_Y1 = CL_Y + CL_H                        // 60
  const ARR_Y2 = ARR_Y1 + ARR_GAP                   // 104
  // 라벨은 화살표 중간 (ARR_Y1 + ARR_GAP/2 = 82), 오른쪽으로 6px 띄움

  const SP_H = 48
  const SP_Y = ARR_Y2                               // 104

  // PGA: 서버 프로세스 아래, 라벨 공간 확보를 위해 gap 28px
  const PGA_H = 26
  const PGA_GAP = 28
  const PGA_Y = SP_Y + SP_H + PGA_GAP              // 180

  // PGA 섹션 라벨: 서버 프로세스 하단과 PGA 박스 사이 정중앙
  const PGA_LABEL_Y = SP_Y + SP_H + PGA_GAP / 2 + 4  // 168

  // SGA: PGA 아래, gap 20px
  const SGA_GAP = 20
  const SGA_Y = PGA_Y + PGA_H + SGA_GAP            // 226
  const SGA_H = 48
  const H = SGA_Y + SGA_H + 12                     // 266

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <marker id="dedArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#7c3aed" />
        </marker>
        <marker id="dedArrowGray" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#86efac" />
        </marker>
      </defs>

      {/* 클라이언트 3개 */}
      {Array.from({ length: N }, (_, i) => {
        const cx = CL_X0 + i * (CL_W + CL_GAP)
        return (
          <g key={`cl${i}`}>
            <rect x={cx} y={CL_Y} width={CL_W} height={CL_H} rx={7}
              fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} />
            <text x={cx + CL_W / 2} y={CL_Y + 17} textAnchor="middle" fill="#1d4ed8" fontSize={10} fontWeight={700}>
              {isKo ? `클라이언트 ${i + 1}` : `Client ${i + 1}`}
            </text>
            <text x={cx + CL_W / 2} y={CL_Y + 33} textAnchor="middle" fill="#1d4ed8" fontSize={9}>
              JDBC / SQL*Plus
            </text>
          </g>
        )
      })}

      {/* 1:1 화살표 — 중앙 화살표에만 라벨 (양옆 공간 충분) */}
      {Array.from({ length: N }, (_, i) => {
        const cx = CL_X0 + i * (CL_W + CL_GAP) + CL_W / 2
        const labelX = i === 2 ? cx - 38 : cx + 5   // 우측 화살표는 왼쪽에 라벨
        return (
          <g key={`arr${i}`}>
            <line x1={cx} y1={ARR_Y1} x2={cx} y2={ARR_Y2 - 5}
              stroke="#7c3aed" strokeWidth={1.5} markerEnd="url(#dedArrow)" />
            {i === 1 && (
              <text x={labelX} y={ARR_Y1 + ARR_GAP / 2 + 4} fill="#6d28d9" fontSize={8.5} fontWeight={600}>
                {isKo ? '1:1 전용 연결' : '1:1 dedicated'}
              </text>
            )}
          </g>
        )
      })}

      {/* 서버 프로세스 3개 */}
      {Array.from({ length: N }, (_, i) => {
        const sx = CL_X0 + i * (CL_W + CL_GAP)
        return (
          <g key={`sp${i}`}>
            <rect x={sx} y={SP_Y} width={CL_W} height={SP_H} rx={7}
              fill="#ede9fe" stroke="#c4b5fd" strokeWidth={1.5} />
            <text x={sx + CL_W / 2} y={SP_Y + 17} textAnchor="middle" fill="#6d28d9" fontSize={10} fontWeight={700}>
              {isKo ? `서버 프로세스 ${i + 1}` : `Server ${i + 1}`}
            </text>
            <text x={sx + CL_W / 2} y={SP_Y + 33} textAnchor="middle" fill="#6d28d9" fontSize={9}>
              {isKo ? 'SQL 파싱·실행' : 'parse & execute'}
            </text>
          </g>
        )
      })}

      {/* PGA 섹션 라벨 — 박스 위에 충분한 공간 확보 후 렌더 */}
      <text x={W / 2} y={PGA_LABEL_Y} textAnchor="middle" fill="#7e22ce" fontSize={8.5} fontWeight={600}>
        {isKo ? '▼  각 프로세스 전용 메모리' : '▼  private memory per process'}
      </text>

      {/* PGA 박스 3개 */}
      {Array.from({ length: N }, (_, i) => {
        const px = CL_X0 + i * (CL_W + CL_GAP)
        return (
          <g key={`pga${i}`}>
            <rect x={px} y={PGA_Y} width={CL_W} height={PGA_H} rx={5}
              fill="#fdf4ff" stroke="#e9d5ff" strokeWidth={1.2} />
            <text x={px + CL_W / 2} y={PGA_Y + 17} textAnchor="middle" fill="#7e22ce" fontSize={9.5} fontWeight={600}>
              PGA + UGA
            </text>
          </g>
        )
      })}

      {/* PGA → SGA 점선 화살표 (중앙 하나만, 나머지는 선만) */}
      {Array.from({ length: N }, (_, i) => {
        const ax = CL_X0 + i * (CL_W + CL_GAP) + CL_W / 2
        return (
          <line key={`sga_arr${i}`}
            x1={ax} y1={PGA_Y + PGA_H + 2}
            x2={ax} y2={SGA_Y - 2}
            stroke="#86efac" strokeWidth={1.2}
            markerEnd={i === 1 ? 'url(#dedArrowGray)' : undefined}
            strokeDasharray="3 2" />
        )
      })}

      {/* SGA 공유 박스 */}
      <rect x={CL_X0 - 4} y={SGA_Y} width={TOTAL_CL_W + 8} height={SGA_H} rx={8}
        fill="#f0fdf4" stroke="#86efac" strokeWidth={1.5} />
      <text x={W / 2} y={SGA_Y + 17} textAnchor="middle" fill="#15803d" fontSize={10.5} fontWeight={700}>
        SGA
      </text>
      <text x={W / 2} y={SGA_Y + 32} textAnchor="middle" fill="#16a34a" fontSize={9}>
        Buffer Cache · Shared Pool · Redo Log Buffer
      </text>
      <text x={W / 2} y={SGA_Y + 44} textAnchor="middle" fill="#16a34a" fontSize={8.5}>
        {isKo ? '(모든 서버 프로세스가 공유)' : '(shared by all server processes)'}
      </text>
    </svg>
  )
}

// ── Shared Server Diagram ─────────────────────────────────────────────────────
// 레이아웃: 상단→하단 수직 흐름
//   클라이언트 3개 (좌)  ─→  디스패처 (중)  ─→  SGA 내부 (우)
//   SGA 내부: Request Queue → 서버 프로세스 풀 → Response Queue → Large Pool

function SharedDiagram({ isKo }: { isKo: boolean }) {
  const W = 540

  // ── 왼쪽 열: 클라이언트 3개 (세로 배치) ──
  const CL_W = 100; const CL_H = 44; const CL_STEP = 80  // 간격 80px로 여유
  const CL_X = 8
  const CL_Y0 = 24
  const clMidY = (cy: number) => cy + CL_H / 2

  // ── 중앙: 디스패처 ──
  const DISP_W = 92; const DISP_H = 66
  const DISP_X = CL_X + CL_W + 28
  const CL_TOTAL_H = 3 * CL_H + 2 * (CL_STEP - CL_H)   // 3×44 + 2×36 = 204
  const DISP_Y = CL_Y0 + (CL_TOTAL_H - DISP_H) / 2      // 세로 중앙 ≈ 93
  const dispMX = DISP_X + DISP_W / 2
  const dispMY = DISP_Y + DISP_H / 2

  // ── 오른쪽: SGA 외곽 박스 ──
  const SGA_X = DISP_X + DISP_W + 32
  const SGA_W = W - SGA_X - 8
  const SGA_PAD = 10
  const INNER_X = SGA_X + SGA_PAD
  const INNER_W = SGA_W - SGA_PAD * 2

  // SGA 내부 요소들 — 박스 높이와 간격 모두 여유있게
  const SGA_Y = 8
  const Q_H = 34              // Queue 박스 높이 (28→34)
  const SP_H = 56             // 서버 프로세스 높이 (46→56)
  const LP_H = 50             // Large Pool 높이 (40→50)
  const ROW_GAP = 26          // 행 사이 간격 — 화살표+라벨이 편하게 들어가는 공간 (14→26)

  const RQ_Y  = SGA_Y + 24
  const SP_Y  = RQ_Y + Q_H + ROW_GAP
  const RSQ_Y = SP_Y + SP_H + ROW_GAP
  const LP_Y  = RSQ_Y + Q_H + ROW_GAP
  const SGA_H = LP_Y + LP_H + SGA_PAD - SGA_Y

  const H = Math.max(CL_Y0 + CL_TOTAL_H + 16, SGA_Y + SGA_H + 12)

  const SP_N = 2
  const SP_W = (INNER_W - (SP_N - 1) * 10) / SP_N
  const spX = (i: number) => INNER_X + i * (SP_W + 10)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <marker id="shdArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#6b7280" />
        </marker>
        <marker id="shdGreen" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#16a34a" />
        </marker>
        <marker id="shdAmber" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#d97706" />
        </marker>
        <marker id="shdViolet" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#7c3aed" />
        </marker>
      </defs>

      {/* ── 클라이언트 3개 ── */}
      {[0, 1, 2].map((i) => {
        const cy = CL_Y0 + i * CL_STEP
        return (
          <g key={`scl${i}`}>
            <rect x={CL_X} y={cy} width={CL_W} height={CL_H} rx={6}
              fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} />
            <text x={CL_X + CL_W / 2} y={cy + 16} textAnchor="middle" fill="#1d4ed8" fontSize={10} fontWeight={700}>
              {isKo ? `클라이언트 ${i + 1}` : `Client ${i + 1}`}
            </text>
            <text x={CL_X + CL_W / 2} y={cy + 30} textAnchor="middle" fill="#1d4ed8" fontSize={8.5}>
              JDBC / SQL*Plus
            </text>
          </g>
        )
      })}

      {/* 클라이언트 → 디스패처 화살표 3개 */}
      {[0, 1, 2].map((i) => {
        const cy = clMidY(CL_Y0 + i * CL_STEP)
        return (
          <line key={`cl_d${i}`}
            x1={CL_X + CL_W + 2} y1={cy}
            x2={DISP_X - 2}      y2={dispMY}
            stroke="#6b7280" strokeWidth={1.2} markerEnd="url(#shdArrow)" />
        )
      })}

      {/* ── 디스패처 박스 ── */}
      <rect x={DISP_X} y={DISP_Y} width={DISP_W} height={DISP_H} rx={8}
        fill="#ccfbf1" stroke="#2dd4bf" strokeWidth={1.8} />
      <text x={dispMX} y={DISP_Y + 19} textAnchor="middle" fill="#0f766e" fontSize={10.5} fontWeight={700}>
        {isKo ? '디스패처' : 'Dispatcher'}
      </text>
      <text x={dispMX} y={DISP_Y + 35} textAnchor="middle" fill="#0f766e" fontSize={9.5}>
        Dnnn
      </text>
      <text x={dispMX} y={DISP_Y + 52} textAnchor="middle" fill="#0f766e" fontSize={9}>
        {isKo ? '요청수신 / 응답반환' : 'recv req / send resp'}
      </text>

      {/* 디스패처 → Request Queue 화살표 (수평, 디스패처 상단 1/3 높이) */}
      {/* 화살표 y: DISP_Y + DISP_H*0.28 ≈ DISP_Y + 17 → RQ 중앙 */}
      {(() => {
        const y1 = DISP_Y + DISP_H * 0.28
        const y2 = RQ_Y + Q_H / 2
        // 꺾인 화살표: 오른쪽으로 → 위/아래로 → RQ 왼쪽 끝
        const midX = DISP_X + DISP_W + 14
        return (
          <>
            <polyline
              points={`${DISP_X + DISP_W},${y1} ${midX},${y1} ${midX},${y2} ${INNER_X - 2},${y2}`}
              fill="none" stroke="#16a34a" strokeWidth={1.5} markerEnd="url(#shdGreen)" />
            {/* 라벨: 꺾인 구간 수평 부분 위 */}
            <text x={midX + 4} y={Math.min(y1, y2) - 4} fill="#15803d" fontSize={8.5} fontWeight={600}>
              {isKo ? '① 요청 전달' : '① enqueue'}
            </text>
          </>
        )
      })()}

      {/* 디스패처 ← Response Queue 화살표 (아래 1/3 높이) */}
      {(() => {
        const y1 = RSQ_Y + Q_H / 2
        const y2 = DISP_Y + DISP_H * 0.72
        const midX = DISP_X + DISP_W + 14
        return (
          <>
            <polyline
              points={`${INNER_X - 2},${y1} ${midX},${y1} ${midX},${y2} ${DISP_X + DISP_W},${y2}`}
              fill="none" stroke="#d97706" strokeWidth={1.5} markerEnd="url(#shdAmber)" />
            {/* 라벨: 꺾인 구간 수평 부분 아래 */}
            <text x={midX + 4} y={Math.max(y1, y2) + 10} fill="#b45309" fontSize={8.5} fontWeight={600}>
              {isKo ? '④ 응답 수신' : '④ dequeue'}
            </text>
          </>
        )
      })()}

      {/* ── SGA 외곽 박스 ── */}
      <rect x={SGA_X} y={SGA_Y} width={SGA_W} height={SGA_H} rx={10}
        fill="#f0fdf4" stroke="#86efac" strokeWidth={1.8} />

      {/* Request Queue */}
      <rect x={INNER_X} y={RQ_Y} width={INNER_W} height={Q_H} rx={5}
        fill="#dcfce7" stroke="#4ade80" strokeWidth={1.2} />
      <text x={INNER_X + INNER_W / 2} y={RQ_Y + 14} textAnchor="middle" fill="#15803d" fontSize={10} fontWeight={700}>
        Request Queue
      </text>
      <text x={INNER_X + INNER_W / 2} y={RQ_Y + 27} textAnchor="middle" fill="#15803d" fontSize={8.5}>
        {isKo ? '(Large Pool)' : '(Large Pool)'}
      </text>

      {/* RQ → 서버 프로세스 화살표 + 라벨 (화살표 사이 중앙에 라벨) */}
      {[0, 1].map((i) => (
        <line key={`rq_sp${i}`}
          x1={spX(i) + SP_W / 2} y1={RQ_Y + Q_H + 2}
          x2={spX(i) + SP_W / 2} y2={SP_Y - 2}
          stroke="#7c3aed" strokeWidth={1.3} markerEnd="url(#shdViolet)" />
      ))}
      {/* 라벨: 두 화살표 사이 중앙, 화살표 중간 y */}
      <text
        x={INNER_X + INNER_W / 2}
        y={RQ_Y + Q_H + (SP_Y - RQ_Y - Q_H) / 2 + 4}
        textAnchor="middle" fill="#7c3aed" fontSize={8} fontWeight={600}>
        {isKo ? '② 유휴 서버가 꺼냄' : '② idle server picks up'}
      </text>

      {/* 서버 프로세스 2개 */}
      {[0, 1].map((i) => (
        <g key={`ssp${i}`}>
          <rect x={spX(i)} y={SP_Y} width={SP_W} height={SP_H} rx={6}
            fill="#ede9fe" stroke="#c4b5fd" strokeWidth={1.5} />
          <text x={spX(i) + SP_W / 2} y={SP_Y + 19} textAnchor="middle" fill="#6d28d9" fontSize={10} fontWeight={700}>
            {isKo ? `서버 프로세스 ${i + 1}` : `Server ${i + 1}`}
          </text>
          <text x={spX(i) + SP_W / 2} y={SP_Y + 34} textAnchor="middle" fill="#6d28d9" fontSize={9.5}>
            Snnn
          </text>
          <text x={spX(i) + SP_W / 2} y={SP_Y + 49} textAnchor="middle" fill="#6d28d9" fontSize={8.5}>
            {isKo ? '여러 세션 처리' : 'multi-session'}
          </text>
        </g>
      ))}

      {/* 서버 프로세스 → Response Queue 화살표 + 라벨 */}
      {[0, 1].map((i) => (
        <line key={`sp_rsq${i}`}
          x1={spX(i) + SP_W / 2} y1={SP_Y + SP_H + 2}
          x2={spX(i) + SP_W / 2} y2={RSQ_Y - 2}
          stroke="#d97706" strokeWidth={1.3} markerEnd="url(#shdAmber)" />
      ))}
      <text
        x={INNER_X + INNER_W / 2}
        y={SP_Y + SP_H + (RSQ_Y - SP_Y - SP_H) / 2 + 4}
        textAnchor="middle" fill="#d97706" fontSize={8} fontWeight={600}>
        {isKo ? '③ 결과를 응답 큐에 씀' : '③ write result to queue'}
      </text>

      {/* Response Queue */}
      <rect x={INNER_X} y={RSQ_Y} width={INNER_W} height={Q_H} rx={5}
        fill="#fef3c7" stroke="#fbbf24" strokeWidth={1.2} />
      <text x={INNER_X + INNER_W / 2} y={RSQ_Y + 14} textAnchor="middle" fill="#92400e" fontSize={10} fontWeight={700}>
        Response Queue
      </text>
      <text x={INNER_X + INNER_W / 2} y={RSQ_Y + 27} textAnchor="middle" fill="#92400e" fontSize={8.5}>
        {isKo ? '(Large Pool)' : '(Large Pool)'}
      </text>

      {/* Large Pool */}
      <rect x={INNER_X} y={LP_Y} width={INNER_W} height={LP_H} rx={6}
        fill="#e0f2fe" stroke="#7dd3fc" strokeWidth={1.2} />
      <text x={INNER_X + INNER_W / 2} y={LP_Y + 17} textAnchor="middle" fill="#0369a1" fontSize={10} fontWeight={700}>
        Large Pool
      </text>
      <text x={INNER_X + INNER_W / 2} y={LP_Y + 31} textAnchor="middle" fill="#0369a1" fontSize={9}>
        {isKo ? 'UGA (세션 수만큼) — 세션 컨텍스트' : 'UGA (per session) — session context'}
      </text>
      <text x={INNER_X + INNER_W / 2} y={LP_Y + 44} textAnchor="middle" fill="#0369a1" fontSize={8.5}>
        {isKo ? '+ Request / Response Queue 포함' : '+ Request / Response Queues'}
      </text>

      {/* SGA 라벨 (z-order 마지막) */}
      <rect x={SGA_X + 4} y={SGA_Y - 8} width={32} height={14} rx={3} fill="#f0fdf4" />
      <text x={SGA_X + 8} y={SGA_Y + 2} fill="#15803d" fontSize={9.5} fontWeight={700}>SGA</text>
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ServerProcessSection() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const t = T[lang]

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <ChapterTitle
        icon={<IconServer size={36} stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* What is a server process */}
      <section>
        <SectionTitle>{t.whatTitle}</SectionTitle>
        <Prose>{t.whatP1}</Prose>
        <Prose>{t.whatP2}</Prose>
      </section>

      <Divider />

      {/* Dedicated */}
      <section>
        <SectionTitle>{t.dedicatedTitle}</SectionTitle>
        <Prose>{t.dedicatedDesc}</Prose>
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
          <DedicatedDiagram isKo={isKo} />
        </div>
        <ul className="mt-4 space-y-1.5">
          {t.dedicatedFeatures.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-violet-500">▸</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Shared */}
      <section>
        <SectionTitle>{t.sharedTitle}</SectionTitle>
        <Prose>{t.sharedDesc}</Prose>
        <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
          <SharedDiagram isKo={isKo} />
        </div>
        <ul className="mt-4 space-y-1.5">
          {t.sharedFeatures.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-teal-500">▸</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Comparison table */}
      <section>
        <SectionTitle>{t.compTitle}</SectionTitle>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-2 text-left font-semibold text-slate-600">
                  {isKo ? '항목' : 'Aspect'}
                </th>
                <th className="px-4 py-2 text-left font-semibold text-violet-600">Dedicated</th>
                <th className="px-4 py-2 text-left font-semibold text-teal-600">Shared</th>
              </tr>
            </thead>
            <tbody>
              {t.compRows.map((row, i) => (
                <tr key={row.aspect} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 text-xs font-semibold text-slate-600">{row.aspect}</td>
                  <td className="px-4 py-2 text-xs text-slate-700">{row.dedicated}</td>
                  <td className="px-4 py-2 text-xs text-slate-700">{row.shared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Divider />

      {/* Dispatcher */}
      <section>
        <SectionTitle>{t.dispatcherTitle}</SectionTitle>
        <Prose>{t.dispatcherDesc}</Prose>
        <InfoBox variant="tip" title="">
          {t.dispatcherNote}
        </InfoBox>
      </section>

      <Divider />

      {/* Parameters */}
      <section>
        <SectionTitle>{t.paramsTitle}</SectionTitle>
        <div className="mt-3 space-y-2">
          {t.params.map((p) => (
            <div key={p.name} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <code className="text-sm font-semibold text-violet-700">{p.name}</code>
              <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
