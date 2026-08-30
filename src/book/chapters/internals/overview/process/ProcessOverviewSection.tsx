import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, InfoBox, Divider } from '../../../shared'
import { IconCpu } from '@tabler/icons-react'

const T = {
  ko: {
    title: '프로세스 개요',
    subtitle: '오라클 인스턴스를 구성하는 세 가지 프로세스 종류',

    whatTitle: '오라클 프로세스가 뭐예요?',
    whatP1:
      '오라클 데이터베이스는 여러 종류의 프로세스가 함께 돌아가면서 작업을 처리해요. 프로세스(process)란 운영 체제가 할당한 실행 단위인데, 각자 맡은 역할을 수행하면서 데이터베이스 전체가 잘 돌아가도록 협력하는 거예요.',
    whatP2:
      '오라클 프로세스는 크게 세 그룹으로 나뉘어요. 클라이언트 프로세스는 사용자 애플리케이션 쪽에서 실행되고, 서버 프로세스는 SQL 파싱·실행·데이터 반환을 맡고, 백그라운드 프로세스는 인스턴스가 켜질 때 자동으로 시작되어 내부 유지 관리 작업을 쉬지 않고 수행해요.',

    typesTitle: '프로세스 세 종류',
    types: [
      {
        label: '클라이언트 프로세스',
        labelEn: 'Client Process',
        color: 'blue' as const,
        desc: '사용자 PC나 중간 서버에서 실행돼요. SQL*Plus, JDBC, OCI 같은 오라클 클라이언트 코드가 이 프로세스 안에서 실행되고, 서버 프로세스와 메모리를 직접 공유하지는 않아요.',
      },
      {
        label: '서버 프로세스',
        labelEn: 'Server Process',
        color: 'violet' as const,
        desc: 'DB 서버 안에서 실행돼요. 클라이언트 요청을 받아 SQL을 파싱·최적화·실행하고 결과를 돌려줘요. Dedicated(전용) 또는 Shared(공유) 모드로 동작해요.',
      },
      {
        label: '백그라운드 프로세스',
        labelEn: 'Background Process',
        color: 'teal' as const,
        desc: '인스턴스가 시작될 때 자동으로 켜져요. DBWn(데이터베이스 라이터), LGWR(로그 라이터), CKPT(체크포인트), SMON(시스템 모니터), PMON(프로세스 모니터) 등이 있고, 버퍼 쓰기·로그 기록·인스턴스 복구·잠금 해제 같은 유지 관리를 담당해요.',
      },
    ],

    architectureTitle: '프로세스 아키텍처 전체 구조',
    architectureDesc:
      '클라이언트 애플리케이션이 SQL을 보내면 Listener(리스너)가 연결을 중간에서 처리하고, 서버 프로세스가 SGA(System Global Area)의 공유 메모리를 읽고 써요. 백그라운드 프로세스들은 독립적으로 실행되면서 각자 맡은 역할을 수행해요.',

    connectionTitle: '연결 방식',
    connections: [
      {
        label: 'Bequeath (BEQ)',
        desc: '클라이언트와 서버가 같은 물리 서버에 있을 때, 네트워크 없이 바로 서버 프로세스를 만들어요. SQL*Plus 로컬 접속이 여기에 해당해요.',
      },
      {
        label: 'Oracle Net Listener',
        desc: '원격에서 접속할 때는 리스너가 먼저 연결을 받아 전용 서버 프로세스나 디스패처(공유 서버)로 넘겨줘요.',
      },
      {
        label: 'Dedicated Broker (LREG)',
        desc: 'Oracle 12c 이후에는 LREG 프로세스가 리스너에 서비스 정보를 자동으로 등록해줘요. 관리자가 직접 등록할 필요가 없어졌어요.',
      },
    ],

    bgOverviewTitle: '주요 백그라운드 프로세스 한눈에 보기',
    bgProcesses: [
      { abbr: 'DBWn', name: 'Database Writer(데이터베이스 라이터)',    desc: '수정된 더티(dirty) 버퍼를 데이터 파일에 써요.' },
      { abbr: 'LGWR', name: 'Log Writer(로그 라이터)',                  desc: 'Redo Log Buffer에 쌓인 내용을 Redo 로그 파일에 기록해요.' },
      { abbr: 'CKPT', name: 'Checkpoint(체크포인트)',                   desc: '체크포인트 SCN을 제어 파일과 데이터 파일 헤더에 기록해요.' },
      { abbr: 'SMON', name: 'System Monitor(시스템 모니터)',             desc: '인스턴스 복구, 임시 세그먼트 정리, 딕셔너리 테이블 병합을 담당해요.' },
      { abbr: 'PMON', name: 'Process Monitor(프로세스 모니터)',          desc: '문제가 생긴 클라이언트 프로세스를 감지해 롤백·잠금 해제·리소스 반환을 처리해요.' },
      { abbr: 'ARCn', name: 'Archiver(아카이버)',                        desc: '아카이브 모드일 때 Redo 로그 그룹을 아카이브 로그로 복사해요.' },
      { abbr: 'MMON', name: 'Manageability Monitor(관리 모니터)',        desc: 'AWR 스냅샷을 주기적으로 캡처하고 임계값 경고를 만들어요.' },
      { abbr: 'RECO', name: 'Recoverer(복구기)',                         desc: '분산 트랜잭션에서 생긴 장애를 자동으로 복구해요.' },
    ],

    noteTitle: '싱글 스레드 vs 멀티스레드',
    noteDesc:
      'Unix/Linux에서는 각 서버 프로세스와 백그라운드 프로세스가 별도의 OS 프로세스로 돌아가요. Windows나 일부 설정에서는 오라클이 하나의 OS 프로세스 안에서 여러 스레드로 실행되기도 해요(멀티스레드 모델). 동작 원리는 같지만 리소스를 사용하는 방식이 달라요.',
  },
  en: {
    title: 'Process Overview',
    subtitle: 'Three types of processes that form an Oracle instance',

    whatTitle: 'What is an Oracle Process?',
    whatP1:
      'Oracle Database runs multiple types of processes together to handle workloads. A process is an execution unit allocated by the operating system; each process has a specific role and they cooperate to keep the database functioning correctly.',
    whatP2:
      "Oracle processes are divided into three groups. Client processes run within the user's application; server processes handle SQL parsing, execution, and result delivery; background processes start automatically when the instance starts and continuously perform maintenance tasks.",

    typesTitle: 'Three Types of Processes',
    types: [
      {
        label: '클라이언트 프로세스',
        labelEn: 'Client Process',
        color: 'blue' as const,
        desc: 'Runs on the user PC or middle-tier server. The process in which Oracle client code (SQL*Plus, JDBC, OCI) executes. Does not share memory directly with server processes.',
      },
      {
        label: '서버 프로세스',
        labelEn: 'Server Process',
        color: 'violet' as const,
        desc: 'Runs on the DB server. Receives client requests, parses, optimizes, and executes SQL, and returns results. Operates in Dedicated or Shared mode.',
      },
      {
        label: '백그라운드 프로세스',
        labelEn: 'Background Process',
        color: 'teal' as const,
        desc: 'Auto-started when the instance starts. DBWn, LGWR, CKPT, SMON, PMON, etc. Handle buffer flushing, log writing, instance recovery, lock release, and other maintenance tasks.',
      },
    ],

    architectureTitle: 'Overall Process Architecture',
    architectureDesc:
      'When a client application sends SQL, the Listener brokers the connection, and server processes read and write the shared SGA memory. Background processes run independently, each fulfilling its specific role.',

    connectionTitle: 'Connection Methods',
    connections: [
      {
        label: 'Bequeath (BEQ)',
        desc: 'When client and server are on the same physical machine, the server process is spawned directly without any network layer. Used in local SQL*Plus connections.',
      },
      {
        label: 'Oracle Net Listener',
        desc: 'For remote client connections, the listener receives the connection first and hands it off to a dedicated server process or dispatcher (shared server).',
      },
      {
        label: 'Dedicated Broker (LREG)',
        desc: 'Since Oracle 12c, the LREG process automatically registers service information with the listener. Administrators no longer need to register services manually.',
      },
    ],

    bgOverviewTitle: 'Key Background Processes at a Glance',
    bgProcesses: [
      { abbr: 'DBWn', name: 'Database Writer',    desc: 'Writes dirty buffers to data files' },
      { abbr: 'LGWR', name: 'Log Writer',          desc: 'Writes the Redo Log Buffer to redo log files' },
      { abbr: 'CKPT', name: 'Checkpoint',          desc: 'Records checkpoint SCN to control file and data file headers' },
      { abbr: 'SMON', name: 'System Monitor',      desc: 'Performs instance recovery, temporary segment cleanup, and dictionary table coalescing' },
      { abbr: 'PMON', name: 'Process Monitor',     desc: 'Detects failed client processes and performs rollback, lock release, and resource return' },
      { abbr: 'ARCn', name: 'Archiver',            desc: 'Copies redo log groups to archive logs (when in archive mode)' },
      { abbr: 'MMON', name: 'Manageability Monitor', desc: 'Periodically captures AWR snapshots and generates threshold alerts' },
      { abbr: 'RECO', name: 'Recoverer',           desc: 'Automatically recovers failures in distributed transactions' },
    ],

    noteTitle: 'Single Thread vs Multi-Thread',
    noteDesc:
      'On Unix/Linux, each server process and background process runs as a separate OS process. On Windows and in some configurations, Oracle may run as threads within a single OS process (multi-threaded model). The behavior is the same, but resource usage differs.',
  },
}

// ── Process Architecture Diagram ──────────────────────────────────────────────

const COLORS = {
  blue:   { bg: 'var(--color-rail)', border: 'var(--color-blue)', text: 'var(--color-blue)' },
  violet: { bg: 'var(--color-rail)', border: 'var(--color-purple)', text: 'var(--color-purple)' },
  teal:   { bg: 'var(--color-green)', border: 'var(--color-green)', text: 'var(--color-green)' },
  amber:  { bg: 'var(--color-amber)', border: 'var(--color-amber)', text: 'var(--color-amber)' },
  rose:   { bg: 'var(--color-rail)', border: 'var(--color-red)', text: 'var(--color-red)' },
  emerald:{ bg: 'var(--color-line)', border: 'var(--color-green)', text: 'var(--color-green)' },
  slate:  { bg: 'var(--color-rail)', border: 'var(--color-line)', text: 'var(--color-ink-2)' },
}

function ProcessArchDiagram({ isKo }: { isKo: boolean }) {
  const W = 580

  // ── 상단 영역: 클라이언트 / Oracle 서버(SGA+서버프로세스) / 디스크 ──
  const TOP_Y = 16

  // 클라이언트 박스
  const CL_X = 8; const CL_W = 110; const CL_H = 64

  // Oracle 서버 외곽 구역 (SGA + 서버 프로세스를 감싸는 점선 박스)
  const ORA_X = 154; const ORA_W = 276; const ORA_H = CL_H + 24
  // SGA 내부 박스 (Oracle 서버 구역 안)
  const SGA_X = ORA_X + 8; const SGA_W = ORA_W - 16; const SGA_H = ORA_H - 28
  const SGA_Y = TOP_Y + 20
  // 서버 프로세스 박스 (SGA 안)
  const SP_X = SGA_X + 8; const SP_W = SGA_W - 80; const SP_H = SGA_H - 16
  const SP_Y = SGA_Y + 8
  // SGA 메모리 블록 (SGA 안, 서버 프로세스 오른쪽)
  const MEM_X = SP_X + SP_W + 8; const MEM_W = SGA_W - SP_W - 24; const MEM_H = SP_H

  // 디스크 박스
  const DISK_X = ORA_X + ORA_W + 24; const DISK_W = 96; const DISK_H = CL_H

  // 화살표 y 중앙 기준
  const MID_Y = TOP_Y + ORA_H / 2 + 4

  // ── 하단 영역: 백그라운드 프로세스 구역 ──
  const BG_SECTION_Y = TOP_Y + ORA_H + 28
  const BG_LABEL_Y   = BG_SECTION_Y + 14
  const BG_BOX_Y     = BG_LABEL_Y + 6
  const BG_BOX_H     = 48
  const BG_NAMES = ['DBWn', 'LGWR', 'CKPT', 'SMON', 'PMON', 'ARCn'] as const
  const BG_DESCS: Record<string, { ko: string; en: string }> = {
    DBWn: { ko: '버퍼→파일',    en: 'buf→file'     },
    LGWR: { ko: '로그 기록',    en: 'log write'    },
    CKPT: { ko: '체크포인트',   en: 'checkpoint'   },
    SMON: { ko: '인스턴스복구', en: 'inst recovery' },
    PMON: { ko: '프로세스정리', en: 'proc cleanup'  },
    ARCn: { ko: '아카이브',     en: 'archive'      },
  }
  const BG_ITEM_W = (W - 16) / BG_NAMES.length   // ~94
  const BG_OUTER_H = BG_BOX_H + 8
  // 백그라운드 → SGA 화살표
  const BG_ARROW_X = ORA_X + ORA_W / 2
  const BG_ARROW_Y1 = BG_BOX_Y
  const BG_ARROW_Y2 = TOP_Y + ORA_H + 4

  const H = BG_BOX_Y + BG_OUTER_H + 8

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <marker id="povArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-ink-2)" />
        </marker>
        <marker id="povArrowTeal" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-green)" />
        </marker>
      </defs>

      {/* ── 클라이언트 박스 ── */}
      <rect x={CL_X} y={TOP_Y} width={CL_W} height={CL_H} rx={8}
        fill={COLORS.blue.bg} stroke={COLORS.blue.border} strokeWidth={1.5} />
      <text x={CL_X + CL_W / 2} y={TOP_Y + 18} textAnchor="middle" fill={COLORS.blue.text} fontSize={10.5} fontWeight={700}>
        {isKo ? '클라이언트' : 'Client'}
      </text>
      <text x={CL_X + CL_W / 2} y={TOP_Y + 33} textAnchor="middle" fill={COLORS.blue.text} fontSize={9}>
        {isKo ? '프로세스' : 'Process'}
      </text>
      <text x={CL_X + CL_W / 2} y={TOP_Y + 50} textAnchor="middle" fill={COLORS.blue.text} fontSize={8.5}>
        SQL*Plus / JDBC
      </text>

      {/* ── Client → Oracle 서버 화살표 ── */}
      <line
        x1={CL_X + CL_W + 2} y1={MID_Y}
        x2={ORA_X - 4}        y2={MID_Y}
        stroke="var(--color-ink-2)" strokeWidth={1.5} markerEnd="url(#povArrow)" />
      <text x={CL_X + CL_W + (ORA_X - CL_X - CL_W) / 2} y={MID_Y - 5}
        textAnchor="middle" fill="var(--color-ink-3)" fontSize={8.5}>
        Oracle Net
      </text>

      {/* ── Oracle 서버 외곽 (점선) ── */}
      <rect x={ORA_X} y={TOP_Y} width={ORA_W} height={ORA_H} rx={10}
        fill="none" stroke="var(--color-ink-3)" strokeWidth={1.2} strokeDasharray="5 3" />
      <text x={ORA_X + 8} y={TOP_Y + 12} fill="var(--color-ink-2)" fontSize={8.5} fontWeight={600}>
        Oracle Server
      </text>

      {/* ── SGA 박스 (Oracle 서버 안) ── */}
      <rect x={SGA_X} y={SGA_Y} width={SGA_W} height={SGA_H} rx={7}
        fill="var(--color-rail)" stroke="var(--color-green)" strokeWidth={1.5} />
      {/* SGA 라벨 — 박스 상단 외곽에 렌더 (z-order 상 마지막에 그림) */}

      {/* ── 서버 프로세스 박스 (SGA 안) ── */}
      <rect x={SP_X} y={SP_Y} width={SP_W} height={SP_H} rx={6}
        fill={COLORS.violet.bg} stroke={COLORS.violet.border} strokeWidth={1.5} />
      <text x={SP_X + SP_W / 2} y={SP_Y + 16} textAnchor="middle" fill={COLORS.violet.text} fontSize={10} fontWeight={700}>
        {isKo ? '서버 프로세스' : 'Server Process'}
      </text>
      <text x={SP_X + SP_W / 2} y={SP_Y + 30} textAnchor="middle" fill={COLORS.violet.text} fontSize={8.5}>
        {isKo ? 'SQL 파싱·실행·반환' : 'Parse · Execute · Fetch'}
      </text>

      {/* ── 서버 프로세스 → SGA 메모리 화살표 ── */}
      <line
        x1={SP_X + SP_W + 2} y1={SP_Y + SP_H / 2}
        x2={MEM_X - 2}       y2={SP_Y + SP_H / 2}
        stroke="var(--color-ink-2)" strokeWidth={1.2} markerEnd="url(#povArrow)" />

      {/* ── SGA 메모리 블록 ── */}
      <rect x={MEM_X} y={SP_Y} width={MEM_W} height={MEM_H} rx={6}
        fill="var(--color-rail)" stroke="var(--color-blue)" strokeWidth={1.2} />
      <text x={MEM_X + MEM_W / 2} y={SP_Y + 15} textAnchor="middle" fill="var(--color-blue)" fontSize={9.5} fontWeight={700}>
        Buffer Cache
      </text>
      <text x={MEM_X + MEM_W / 2} y={SP_Y + 28} textAnchor="middle" fill="var(--color-blue)" fontSize={8}>
        Shared Pool
      </text>
      <text x={MEM_X + MEM_W / 2} y={SP_Y + 39} textAnchor="middle" fill="var(--color-blue)" fontSize={8}>
        Redo Log Buf
      </text>

      {/* ── SGA 라벨 (z-order 마지막 — 박스 위에 표시) ── */}
      <rect x={SGA_X + 4} y={SGA_Y - 8} width={30} height={14} rx={3} fill="var(--color-rail)" />
      <text x={SGA_X + 8} y={SGA_Y + 2} fill="var(--color-green)" fontSize={9.5} fontWeight={700}>SGA</text>

      {/* ── Oracle 서버 → 디스크 화살표 ── */}
      <line
        x1={ORA_X + ORA_W + 2} y1={MID_Y}
        x2={DISK_X - 4}        y2={MID_Y}
        stroke="var(--color-ink-2)" strokeWidth={1.5} markerEnd="url(#povArrow)" />

      {/* ── 디스크 박스 ── */}
      <rect x={DISK_X} y={TOP_Y} width={DISK_W} height={DISK_H} rx={8}
        fill="var(--color-paper-sunk)" stroke="var(--color-line)" strokeWidth={1.5} />
      <text x={DISK_X + DISK_W / 2} y={TOP_Y + 18} textAnchor="middle" fill="var(--color-ink-2)" fontSize={10} fontWeight={700}>
        {isKo ? '디스크' : 'Disk'}
      </text>
      <text x={DISK_X + DISK_W / 2} y={TOP_Y + 32} textAnchor="middle" fill="var(--color-ink-2)" fontSize={8.5}>
        Data Files
      </text>
      <text x={DISK_X + DISK_W / 2} y={TOP_Y + 45} textAnchor="middle" fill="var(--color-ink-2)" fontSize={8.5}>
        Redo Logs
      </text>
      <text x={DISK_X + DISK_W / 2} y={TOP_Y + 58} textAnchor="middle" fill="var(--color-ink-2)" fontSize={8.5}>
        Control File
      </text>

      {/* ── 구분선 ── */}
      <line x1={8} y1={BG_SECTION_Y - 8} x2={W - 8} y2={BG_SECTION_Y - 8}
        stroke="var(--color-rail)" strokeWidth={1} />

      {/* ── 백그라운드 프로세스 영역 라벨 ── */}
      <text x={W / 2} y={BG_LABEL_Y} textAnchor="middle" fill="var(--color-ink)" fontSize={9.5} fontWeight={700}>
        {isKo ? '백그라운드 프로세스 (인스턴스 시작 시 자동 기동)' : 'Background Processes (auto-started with instance)'}
      </text>

      {/* ── 백그라운드 → Oracle 서버 화살표 ── */}
      <line
        x1={BG_ARROW_X} y1={BG_ARROW_Y1 - 2}
        x2={BG_ARROW_X} y2={BG_ARROW_Y2 + 2}
        stroke="var(--color-green)" strokeWidth={1.5} markerEnd="url(#povArrowTeal)"
        strokeDasharray="4 3" />

      {/* ── 백그라운드 프로세스 박스들 ── */}
      {BG_NAMES.map((name, i) => {
        const bx = 8 + i * BG_ITEM_W
        const bw = BG_ITEM_W - 6
        return (
          <g key={name}>
            <rect x={bx} y={BG_BOX_Y} width={bw} height={BG_BOX_H} rx={6}
              fill={COLORS.teal.bg} stroke={COLORS.teal.border} strokeWidth={1.2} />
            <text x={bx + bw / 2} y={BG_BOX_Y + 18} textAnchor="middle"
              fill={COLORS.teal.text} fontSize={11} fontWeight={700}>
              {name}
            </text>
            <text x={bx + bw / 2} y={BG_BOX_Y + 34} textAnchor="middle"
              fill={COLORS.teal.text} fontSize={8}>
              {isKo ? BG_DESCS[name].ko : BG_DESCS[name].en}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ProcessOverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const t = T[lang]

  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    blue: COLORS.blue, violet: COLORS.violet, teal: COLORS.teal,
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <ChapterTitle
        icon={<IconCpu size={36} stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* What is an Oracle Process */}
      <section>
        <SectionTitle>{t.whatTitle}</SectionTitle>
        <Prose>{t.whatP1}</Prose>
        <Prose>{t.whatP2}</Prose>
      </section>

      <Divider />

      {/* Three types */}
      <section>
        <SectionTitle>{t.typesTitle}</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {t.types.map((type) => {
            const c = typeColors[type.color]
            return (
              <div
                key={type.labelEn}
                className="rounded-panel border p-4"
                style={{ background: c.bg, borderColor: c.border }}
              >
                <div className="mb-1 text-sm font-bold" style={{ color: c.text }}>
                  {type.labelEn}
                </div>
                <div className="mb-2 text-xs font-semibold" style={{ color: c.text }}>
                  {type.label}
                </div>
                <p className="text-xs leading-relaxed text-ink">{type.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <Divider />

      {/* Architecture diagram */}
      <section>
        <SectionTitle>{t.architectureTitle}</SectionTitle>
        <Prose>{t.architectureDesc}</Prose>
        <div className="mt-4 rounded-panel border border-line bg-paper-sunk p-4">
          <ProcessArchDiagram isKo={isKo} />
        </div>
      </section>

      <Divider />

      {/* Connection methods */}
      <section>
        <SectionTitle>{t.connectionTitle}</SectionTitle>
        <div className="mt-3 space-y-3">
          {t.connections.map((conn) => (
            <div key={conn.label} className="rounded-card border border-line bg-paper p-3">
              <span className="text-sm font-semibold text-ink">{conn.label}</span>
              <p className="mt-1 text-sm leading-relaxed text-ink">{conn.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Background processes overview table */}
      <section>
        <SectionTitle>{t.bgOverviewTitle}</SectionTitle>
        <div className="mt-3 overflow-hidden rounded-panel border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper-sunk">
                <th className="w-24 px-4 py-2 text-left font-semibold text-ink">
                  {isKo ? '약자' : 'Abbr'}
                </th>
                <th className="w-40 px-4 py-2 text-left font-semibold text-ink">
                  {isKo ? '이름' : 'Name'}
                </th>
                <th className="px-4 py-2 text-left font-semibold text-ink">
                  {isKo ? '역할' : 'Role'}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.bgProcesses.map((p, i) => (
                <tr key={p.abbr} className={i % 2 === 0 ? 'bg-paper' : 'bg-paper-sunk'}>
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-green">{p.abbr}</td>
                  <td className="px-4 py-2 text-xs text-ink">{p.name}</td>
                  <td className="px-4 py-2 text-xs text-ink">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Divider />

      <InfoBox variant="note" title={t.noteTitle}>
        {t.noteDesc}
      </InfoBox>
    </div>
  )
}

