import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, InfoBox, Divider } from '../../../shared'
import { IconSettings } from '@tabler/icons-react'

// ── Translation strings ────────────────────────────────────────────────────────

const T = {
  ko: {
    title: '백그라운드 프로세스',
    subtitle: '인스턴스 시작 시 자동 기동되는 유지보수 프로세스들',

    whatTitle: '백그라운드 프로세스란?',
    whatP1:
      '백그라운드 프로세스는 오라클 인스턴스가 시작될 때 자동으로 기동되며, 데이터베이스가 정상 동작하기 위한 필수적인 유지보수 작업을 수행합니다. 사용자 세션과 독립적으로 실행되며, 각자 특정한 역할을 맡고 있습니다.',
    whatP2:
      '일부 프로세스는 필수(mandatory)이고, 일부는 선택적(optional)입니다. DBWn, LGWR, CKPT, SMON, PMON은 항상 실행되는 필수 프로세스이며, ARCn은 아카이브 모드에서만, Pnnn은 병렬 처리 시에만 기동됩니다.',

    selectProcess: '프로세스를 선택하세요',

    processes: [
      {
        id: 'dbwn',
        abbr: 'DBWn',
        name: 'Database Writer',
        color: 'blue' as const,
        mandatory: true,
        summary: '더티 버퍼(수정된 버퍼)를 Buffer Cache에서 데이터 파일로 씁니다.',
        detail: [
          'Buffer Cache에서 변경된(더티) 블록을 데이터 파일(.dbf)에 씁니다.',
          '쓰기 전에 LGWR가 해당 변경사항의 Redo 레코드를 로그 파일에 먼저 기록해야 합니다(Write-Ahead Logging). DBWn은 LGWR가 확인해준 로그만 대상으로 씁니다.',
          'DBW0 ~ DBW9, DBWa ~ DBWj 최대 36개까지 구성 가능 (DB_WRITER_PROCESSES 파라미터).',
          '쓰기 트리거: ① 버퍼 캐시가 꽉 차서 더 이상 새 버퍼를 올릴 수 없을 때 ② 체크포인트 신호 수신 ③ 타임아웃 ④ RAC 핑.',
          '과도한 DBWn 쓰기가 발생하면 I/O 병목을 의심해야 합니다.',
        ],
      },
      {
        id: 'lgwr',
        abbr: 'LGWR',
        name: 'Log Writer',
        color: 'violet' as const,
        mandatory: true,
        summary: 'Redo Log Buffer의 내용을 Online Redo Log 파일에 씁니다.',
        detail: [
          'SGA의 Redo Log Buffer에 쌓인 Redo 항목을 Online Redo Log 파일에 플러시합니다.',
          '플러시 트리거: ① COMMIT 발생 ② Redo Log Buffer가 1/3 이상 찼을 때 ③ DBWn이 더티 버퍼를 쓰기 전 ④ 3초마다 타임아웃 ⑤ Log Switch 발생.',
          'COMMIT 시 LGWR가 로그를 기록하고 완료 확인을 해줘야 트랜잭션이 완료됩니다(Fast Commit). 이 시점 이전에는 실제 데이터 파일 변경이 없어도 됩니다.',
          'Log Switch가 발생하면 ARCn이 이전 로그 그룹을 아카이브 파일로 복사합니다.',
          '여러 커밋을 하나의 I/O로 묶어 처리하는 Group Commit으로 효율을 높입니다.',
        ],
      },
      {
        id: 'ckpt',
        abbr: 'CKPT',
        name: 'Checkpoint Process',
        color: 'emerald' as const,
        mandatory: true,
        summary: '체크포인트 SCN을 제어 파일과 데이터 파일 헤더에 기록합니다.',
        detail: [
          '체크포인트가 발생하면 CKPT는 DBWn에게 더티 버퍼를 디스크에 쓰라고 신호를 보냅니다.',
          'DBWn이 쓰기를 완료하면 CKPT가 현재 SCN(System Change Number)을 제어 파일(Control File)과 데이터 파일 헤더에 기록합니다.',
          '중요: CKPT 자체는 데이터 파일에 직접 데이터를 쓰지 않습니다. 데이터 쓰기는 DBWn이 합니다.',
          '체크포인트 빈도가 높을수록 장애 복구 시간(MTTR)이 짧아지지만, I/O 부하가 커집니다.',
          'FAST_START_MTTR_TARGET 파라미터로 목표 복구 시간을 지정하면 Oracle이 체크포인트 빈도를 자동 조정합니다.',
        ],
      },
      {
        id: 'smon',
        abbr: 'SMON',
        name: 'System Monitor',
        color: 'amber' as const,
        mandatory: true,
        summary: '인스턴스 복구, 임시 세그먼트 정리, 딕셔너리 병합을 수행합니다.',
        detail: [
          '인스턴스 크래시 후 재시작 시 자동 인스턴스 복구(Instance Recovery)를 수행합니다. Redo를 앞으로 적용(Roll Forward)하고 미커밋 트랜잭션을 롤백(Roll Back)합니다.',
          '임시 세그먼트(Temp Segment) 정리: 정렬 등에 사용되다 세션 비정상 종료로 남은 Temp 세그먼트를 회수합니다.',
          '딕셔너리 관리 테이블스페이스(DMT)에서 인접한 빈 Extent를 하나로 병합(Coalesce)합니다.',
          'RAC 환경에서 장애 인스턴스의 블록을 복구하는 Affinity 복구도 담당합니다.',
        ],
      },
      {
        id: 'pmon',
        abbr: 'PMON / CLMN',
        name: 'Process Monitor / Cleanup Main',
        color: 'rose' as const,
        mandatory: true,
        summary: '실패한 프로세스를 감지하고 롤백·잠금 해제·리소스 반환을 합니다.',
        detail: [
          '클라이언트 프로세스나 서버 프로세스가 비정상 종료되면 PMON(Oracle 21c 이하) 또는 CLMN/CLnn(Oracle 21c 이상)이 감지합니다.',
          '해당 세션이 보유한 미커밋 트랜잭션을 롤백합니다.',
          '행 잠금(Row Lock), 테이블 잠금 등을 해제합니다.',
          'SGA 리소스와 PGA 메모리를 반환합니다.',
          'Oracle 21c부터 PMON 역할은 CLMN(Cleanup Main Process)과 CLnn(Cleanup Helper) 프로세스로 분리되어 병렬 처리가 가능해졌습니다.',
        ],
      },
      {
        id: 'arcn',
        abbr: 'ARCn',
        name: 'Archiver',
        color: 'teal' as const,
        mandatory: false,
        summary: '꽉 찬 Redo Log 그룹을 아카이브 로그로 복사합니다 (아카이브 모드 시).',
        detail: [
          '아카이브 모드(ARCHIVELOG MODE)에서만 활성화됩니다.',
          'Log Switch가 발생해 Online Redo Log 그룹이 전환되면, 직전 그룹을 지정된 아카이브 경로에 복사합니다.',
          '여러 ARCn 프로세스가 병렬로 작동 가능 (ARC0~ARC9, ARCa 등).',
          'LOG_ARCHIVE_DEST_n 파라미터로 여러 아카이브 목적지(로컬/원격)를 지정할 수 있습니다.',
          '아카이브 로그가 없으면 미디어 복구(Media Recovery)가 불가능하므로, 프로덕션 환경에서는 반드시 아카이브 모드로 운영합니다.',
        ],
      },
      {
        id: 'mmon',
        abbr: 'MMON / MMNL',
        name: 'Manageability Monitor',
        color: 'slate' as const,
        mandatory: false,
        summary: 'AWR 스냅샷 캡처, 성능 임계값 경고, 통계 플러시를 담당합니다.',
        detail: [
          'MMON(Manageability Monitor)은 AWR(Automatic Workload Repository) 스냅샷을 주기적으로(기본 1시간) 캡처합니다.',
          '성능 임계값 초과 시 경고(Alert)를 생성하고 ADDM(Automatic Database Diagnostic Monitor) 분석을 수행합니다.',
          'MMNL(Manageability Monitor Lite)은 Active Session History(ASH) 버퍼가 꽉 찼을 때 ASH 데이터를 AWR에 플러시합니다.',
          'V$ACTIVE_SESSION_HISTORY, DBA_HIST_ACTIVE_SESS_HISTORY 뷰가 이 데이터를 제공합니다.',
        ],
      },
    ],

    commitFlowTitle: 'COMMIT 처리 흐름',
    commitFlowDesc:
      'COMMIT이 발생했을 때 LGWR, DBWn, CKPT가 어떻게 협력하는지 이해하면 Oracle의 내구성(Durability) 보장 메커니즘을 파악할 수 있습니다.',
    commitSteps: [
      { label: '①', text: '서버 프로세스가 변경 내용을 Redo Log Buffer에 기록' },
      { label: '②', text: 'COMMIT 시 LGWR가 Redo Log Buffer를 Online Redo Log 파일에 기록 (동기)' },
      { label: '③', text: 'LGWR 완료 후 서버 프로세스에 커밋 성공 반환 (Fast Commit)' },
      { label: '④', text: 'DBWn이 나중에 더티 버퍼를 데이터 파일에 씀 (비동기)' },
      { label: '⑤', text: 'CKPT가 체크포인트 발생 시 SCN을 제어 파일에 기록' },
    ],
    commitNote:
      'COMMIT 직후에는 Redo 로그만 기록되고 실제 데이터 파일 변경은 나중에 일어납니다. 장애 발생 시에는 Redo 로그를 재적용(Roll Forward)해 복구합니다.',
  },
  en: {
    title: 'Background Processes',
    subtitle: 'Maintenance processes that start automatically when the instance starts',

    whatTitle: 'What are Background Processes?',
    whatP1:
      'Background processes start automatically when an Oracle instance starts and perform essential maintenance tasks required for the database to function correctly. They run independently of user sessions and each has a specific assigned role.',
    whatP2:
      'Some processes are mandatory and others are optional. DBWn, LGWR, CKPT, SMON, and PMON are mandatory processes that always run; ARCn only runs in archive mode; Pnnn only starts during parallel processing.',

    selectProcess: 'Select a process',

    processes: [
      {
        id: 'dbwn',
        abbr: 'DBWn',
        name: 'Database Writer',
        color: 'blue' as const,
        mandatory: true,
        summary: 'Writes dirty buffers (modified buffers) from the Buffer Cache to data files.',
        detail: [
          'Writes changed (dirty) blocks from the Buffer Cache to data files (.dbf).',
          'Before writing, LGWR must first record the redo records for those changes in the log file (Write-Ahead Logging). DBWn only writes blocks whose redo has been confirmed by LGWR.',
          'Up to 36 DBW processes can be configured: DBW0–DBW9, DBWa–DBWj (DB_WRITER_PROCESSES parameter).',
          'Write triggers: ① Buffer Cache is full and cannot load new buffers ② Checkpoint signal received ③ Timeout ④ RAC ping.',
          'Excessive DBWn writes indicate an I/O bottleneck.',
        ],
      },
      {
        id: 'lgwr',
        abbr: 'LGWR',
        name: 'Log Writer',
        color: 'violet' as const,
        mandatory: true,
        summary: 'Writes the contents of the Redo Log Buffer to Online Redo Log files.',
        detail: [
          'Flushes redo entries accumulated in the SGA Redo Log Buffer to Online Redo Log files.',
          'Flush triggers: ① COMMIT occurs ② Redo Log Buffer is more than 1/3 full ③ Before DBWn writes dirty buffers ④ Every 3-second timeout ⑤ Log Switch occurs.',
          'On COMMIT, LGWR must record the log and confirm completion before the transaction is considered committed (Fast Commit). Actual data file changes are not required at this point.',
          'When a Log Switch occurs, ARCn copies the previous log group to an archive file.',
          'Efficiency is improved through Group Commit, which bundles multiple commits into a single I/O.',
        ],
      },
      {
        id: 'ckpt',
        abbr: 'CKPT',
        name: 'Checkpoint Process',
        color: 'emerald' as const,
        mandatory: true,
        summary: 'Records the checkpoint SCN to the control file and data file headers.',
        detail: [
          'When a checkpoint occurs, CKPT signals DBWn to write dirty buffers to disk.',
          'Once DBWn completes writing, CKPT records the current SCN (System Change Number) to the control file and data file headers.',
          'Important: CKPT itself does not write data directly to data files. Data writing is done by DBWn.',
          'Higher checkpoint frequency shortens recovery time (MTTR) but increases I/O load.',
          'The FAST_START_MTTR_TARGET parameter lets Oracle automatically adjust checkpoint frequency to meet a target recovery time.',
        ],
      },
      {
        id: 'smon',
        abbr: 'SMON',
        name: 'System Monitor',
        color: 'amber' as const,
        mandatory: true,
        summary: 'Performs instance recovery, temporary segment cleanup, and dictionary coalescing.',
        detail: [
          'Automatically performs Instance Recovery on restart after an instance crash. Applies redo forward (Roll Forward) and rolls back uncommitted transactions (Roll Back).',
          'Temporary segment cleanup: reclaims temp segments left by abnormally terminated sessions that used sorting, etc.',
          'Coalesces adjacent free extents in Dictionary-Managed Tablespaces (DMT).',
          'In RAC environments, also handles Affinity recovery for failed instance blocks.',
        ],
      },
      {
        id: 'pmon',
        abbr: 'PMON / CLMN',
        name: 'Process Monitor / Cleanup Main',
        color: 'rose' as const,
        mandatory: true,
        summary: 'Detects failed processes and performs rollback, lock release, and resource return.',
        detail: [
          'When a client process or server process terminates abnormally, PMON (Oracle 21c and below) or CLMN/CLnn (Oracle 21c+) detects it.',
          'Rolls back uncommitted transactions held by that session.',
          'Releases row locks, table locks, etc.',
          'Returns SGA resources and PGA memory.',
          'Starting in Oracle 21c, the PMON role is split into CLMN (Cleanup Main Process) and CLnn (Cleanup Helper) processes for parallel processing.',
        ],
      },
      {
        id: 'arcn',
        abbr: 'ARCn',
        name: 'Archiver',
        color: 'teal' as const,
        mandatory: false,
        summary: 'Copies full redo log groups to archive logs (in archive mode).',
        detail: [
          'Only active in ARCHIVELOG MODE.',
          'When a Log Switch occurs and an Online Redo Log group transitions, copies the previous group to the designated archive path.',
          'Multiple ARCn processes can run in parallel (ARC0–ARC9, ARCa, etc.).',
          'Multiple archive destinations (local/remote) can be specified with the LOG_ARCHIVE_DEST_n parameter.',
          'Without archive logs, media recovery is impossible — production environments must always run in archive mode.',
        ],
      },
      {
        id: 'mmon',
        abbr: 'MMON / MMNL',
        name: 'Manageability Monitor',
        color: 'slate' as const,
        mandatory: false,
        summary: 'Handles AWR snapshot capture, performance threshold alerts, and statistics flushing.',
        detail: [
          'MMON periodically captures AWR (Automatic Workload Repository) snapshots (default every 1 hour).',
          'Generates alerts when performance thresholds are exceeded and performs ADDM (Automatic Database Diagnostic Monitor) analysis.',
          'MMNL (Manageability Monitor Lite) flushes ASH data to AWR when the Active Session History buffer is full.',
          'V$ACTIVE_SESSION_HISTORY and DBA_HIST_ACTIVE_SESS_HISTORY views provide this data.',
        ],
      },
    ],

    commitFlowTitle: 'COMMIT Processing Flow',
    commitFlowDesc:
      'Understanding how LGWR, DBWn, and CKPT cooperate when COMMIT occurs clarifies Oracle\'s durability guarantee mechanism.',
    commitSteps: [
      { label: '①', text: 'Server process writes changes to Redo Log Buffer' },
      { label: '②', text: 'On COMMIT, LGWR writes Redo Log Buffer to Online Redo Log file (synchronous)' },
      { label: '③', text: 'After LGWR completes, returns commit success to server process (Fast Commit)' },
      { label: '④', text: 'DBWn later writes dirty buffers to data files (asynchronous)' },
      { label: '⑤', text: 'CKPT records SCN to control file at checkpoint' },
    ],
    commitNote:
      'Right after COMMIT, only the redo log is written — actual data file changes happen later. In the event of a failure, redo logs are re-applied (Roll Forward) to recover.',
  },
}

// ── Color map ─────────────────────────────────────────────────────────────────

const PROC_COLORS = {
  blue:    { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', badge: '#1e40af' },
  violet:  { bg: '#ede9fe', border: '#c4b5fd', text: '#6d28d9', badge: '#5b21b6' },
  emerald: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', badge: '#064e3b' },
  amber:   { bg: '#fef3c7', border: '#fcd34d', text: '#b45309', badge: '#92400e' },
  rose:    { bg: '#ffe4e6', border: '#fda4af', text: '#be123c', badge: '#9f1239' },
  teal:    { bg: '#ccfbf1', border: '#5eead4', text: '#0f766e', badge: '#115e59' },
  slate:   { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', badge: '#334155' },
}

// ── COMMIT Flow Diagram ───────────────────────────────────────────────────────

function CommitFlowDiagram({ isKo }: { isKo: boolean }) {
  const W = 560
  const H = 180

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      <defs>
        <marker id="cfArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#6b7280" />
        </marker>
        <marker id="cfArrowSync" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#7c3aed" />
        </marker>
        <marker id="cfArrowAsync" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#6b7280" />
        </marker>
      </defs>

      {/* Server Process */}
      <rect x={10} y={60} width={100} height={50} rx={8}
        fill="#ede9fe" stroke="#c4b5fd" strokeWidth={1.5} />
      <text x={60} y={80} textAnchor="middle" fill="#6d28d9" fontSize={10} fontWeight={700}>
        {isKo ? '서버 프로세스' : 'Server Process'}
      </text>
      <text x={60} y={95} textAnchor="middle" fill="#6d28d9" fontSize={8.5}>
        {isKo ? 'COMMIT 요청' : 'COMMIT request'}
      </text>

      {/* Arrow → Redo Buffer */}
      <line x1={110} y1={85} x2={148} y2={85} stroke="#7c3aed" strokeWidth={1.5} markerEnd="url(#cfArrowSync)" />
      <text x={129} y={78} textAnchor="middle" fill="#7c3aed" fontSize={8}>①</text>

      {/* Redo Log Buffer */}
      <rect x={150} y={60} width={110} height={50} rx={8}
        fill="#fdf4ff" stroke="#e9d5ff" strokeWidth={1.5} />
      <text x={205} y={80} textAnchor="middle" fill="#7e22ce" fontSize={9.5} fontWeight={700}>
        Redo Log Buffer
      </text>
      <text x={205} y={95} textAnchor="middle" fill="#7e22ce" fontSize={8}>SGA</text>

      {/* Arrow → LGWR */}
      <line x1={260} y1={85} x2={298} y2={85} stroke="#7c3aed" strokeWidth={1.5} markerEnd="url(#cfArrowSync)" />
      <text x={279} y={78} textAnchor="middle" fill="#7c3aed" fontSize={8}>②</text>

      {/* LGWR */}
      <rect x={300} y={48} width={80} height={34} rx={7}
        fill="#ede9fe" stroke="#c4b5fd" strokeWidth={1.5} />
      <text x={340} y={62} textAnchor="middle" fill="#6d28d9" fontSize={10} fontWeight={700}>LGWR</text>
      <text x={340} y={75} textAnchor="middle" fill="#6d28d9" fontSize={8}>Log Writer</text>

      {/* Arrow LGWR → Redo Log File */}
      <line x1={380} y1={65} x2={430} y2={65} stroke="#7c3aed" strokeWidth={1.5} markerEnd="url(#cfArrowSync)" />

      {/* Redo Log File */}
      <rect x={432} y={48} width={110} height={34} rx={7}
        fill="#fdf4ff" stroke="#e9d5ff" strokeWidth={1.5} />
      <text x={487} y={62} textAnchor="middle" fill="#7e22ce" fontSize={9.5} fontWeight={700}>
        {isKo ? 'Redo 로그 파일' : 'Redo Log File'}
      </text>
      <text x={487} y={75} textAnchor="middle" fill="#7e22ce" fontSize={8}>
        {isKo ? '디스크 (동기)' : 'Disk (sync)'}
      </text>

      {/* Arrow ③ back to server process */}
      <path d="M340,82 Q340,145 60,145 Q60,135 60,110"
        fill="none" stroke="#10b981" strokeWidth={1.5} markerEnd="url(#cfArrow)" strokeDasharray="4 3" />
      <text x={200} y={158} textAnchor="middle" fill="#059669" fontSize={8.5} fontWeight={600}>
        {isKo ? '③ COMMIT 완료 반환 (Fast Commit)' : '③ Commit success returned (Fast Commit)'}
      </text>

      {/* DBWn note */}
      <rect x={300} y={100} width={80} height={30} rx={6}
        fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.2} />
      <text x={340} y={114} textAnchor="middle" fill="#1d4ed8" fontSize={9.5} fontWeight={700}>DBWn</text>
      <text x={340} y={124} textAnchor="middle" fill="#1d4ed8" fontSize={7.5}>
        {isKo ? '④ 나중에 비동기' : '④ async later'}
      </text>
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function BackgroundProcessSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeId, setActiveId] = useState<string>(t.processes[0].id)

  const activeProc = t.processes.find((p) => p.id === activeId) ?? t.processes[0]
  const c = PROC_COLORS[activeProc.color]

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <ChapterTitle
        icon={<IconSettings size={36} stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* What */}
      <section>
        <SectionTitle>{t.whatTitle}</SectionTitle>
        <Prose>{t.whatP1}</Prose>
        <Prose>{t.whatP2}</Prose>
      </section>

      <Divider />

      {/* Process detail interactive selector */}
      <section>
        <SectionTitle>{t.selectProcess}</SectionTitle>

        {/* Process buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {t.processes.map((proc) => {
            const pc = PROC_COLORS[proc.color]
            const isActive = proc.id === activeId
            return (
              <button
                key={proc.id}
                onClick={() => setActiveId(proc.id)}
                className="rounded-full border px-3 py-1 text-sm font-semibold transition-all"
                style={{
                  background: isActive ? pc.badge : pc.bg,
                  borderColor: pc.border,
                  color: isActive ? '#fff' : pc.text,
                }}
              >
                {proc.abbr}
                {proc.mandatory && (
                  <span
                    className="ml-1 rounded px-1 text-xs"
                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : pc.border, color: isActive ? '#fff' : pc.text }}
                  >
                    {lang === 'ko' ? '필수' : 'req'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Detail card */}
        <div
          className="mt-4 rounded-xl border p-5 transition-all"
          style={{ background: c.bg, borderColor: c.border }}
        >
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg px-3 py-1 font-mono text-base font-bold text-white"
              style={{ background: c.badge }}
            >
              {activeProc.abbr}
            </span>
            <span className="text-sm font-semibold" style={{ color: c.text }}>
              {activeProc.name}
            </span>
            {activeProc.mandatory && (
              <span
                className="rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{ borderColor: c.border, color: c.text }}
              >
                {lang === 'ko' ? '필수 프로세스' : 'Mandatory'}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm font-medium" style={{ color: c.text }}>
            {activeProc.summary}
          </p>
          <ul className="space-y-2">
            {activeProc.detail.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-0.5 font-bold" style={{ color: c.badge }}>▸</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Divider />

      {/* Commit flow */}
      <section>
        <SectionTitle>{t.commitFlowTitle}</SectionTitle>
        <Prose>{t.commitFlowDesc}</Prose>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <CommitFlowDiagram isKo={lang === 'ko'} />
        </div>
        <div className="mt-3 space-y-2">
          {t.commitSteps.map((step) => (
            <div key={step.label} className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm font-bold text-violet-600">{step.label}</span>
              <span className="text-sm text-slate-700">{step.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <InfoBox variant="note" title="">
            {t.commitNote}
          </InfoBox>
        </div>
      </section>
    </div>
  )
}
