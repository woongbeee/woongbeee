import { useSimulationStore } from '@/store/simulationStore'
import {
  ChapterTitle, SectionTitle, SubTitle, Prose, InfoBox, Divider,
} from '../../../shared'
import { cn } from '@/lib/utils'

// ── Translation strings ────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'UGA',
    subtitle: '세션 상태를 저장하는 메모리 — 서버 모드에 따라 위치가 달라진다',

    whatTitle: 'UGA란?',
    whatP1: 'UGA(User Global Area)는 하나의 데이터베이스 세션에 필요한 정보를 저장하는 메모리 영역입니다. 로그인 정보, 세션 변수, 세션 상태(session state) 등 세션이 살아있는 동안 유지해야 하는 데이터가 모두 UGA에 들어갑니다.',
    whatP2: 'UGA는 PGA와 달리 "세션에 소속된" 메모리입니다. PGA는 서버 프로세스에 소속되지만, UGA는 세션에 소속됩니다. 이 차이가 Shared Server 모드에서 결정적으로 중요합니다.',
    whatP3: '하나의 세션이 여러 서버 프로세스를 번갈아 사용할 수 있는 Shared Server 환경에서는, 어느 프로세스가 요청을 처리하든 세션 상태에 접근할 수 있어야 합니다. 따라서 UGA는 모든 서버 프로세스가 접근 가능한 공유 메모리(SGA)로 이동합니다.',

    contentsTitle: 'UGA에 저장되는 내용',
    contents: [
      { label: '세션 변수',          desc: '세션 NLS 설정, 현재 스키마, 타임존 등 세션 레벨 설정값' },
      { label: '로그인 정보',        desc: '사용자 인증 정보, 연결 속성 등 세션 초기화 데이터' },
      { label: '커서 상태',          desc: '열려 있는 커서의 상태 정보 (Shared Server에서 Private SQL Area 포함)' },
      { label: 'OLAP 풀',            desc: 'OLAP 데이터 페이지(데이터 블록과 동등)를 관리하는 풀' },
      { label: 'PL/SQL 패키지 상태', desc: '세션에서 초기화된 PL/SQL 패키지 변수의 현재 값' },
    ],

    locationTitle: '서버 모드별 UGA 위치',
    locationDesc: 'UGA가 어디에 위치하느냐는 서버 연결 방식(Dedicated vs Shared)에 따라 완전히 달라집니다.',

    dedicatedLabel: 'Dedicated Server',
    dedicatedDesc: '세션당 전용 서버 프로세스가 존재합니다. UGA는 그 프로세스의 PGA 안에 위치합니다. 세션과 프로세스가 1:1로 묶여있으므로 항상 같은 프로세스가 세션 상태에 접근합니다.',
    dedicatedUgaLocation: 'UGA ⊂ PGA (프로세스 메모리)',

    sharedLabel: 'Shared Server',
    sharedDesc: '여러 세션이 소수의 서버 프로세스를 공유합니다. 어떤 프로세스가 요청을 처리할지 미리 알 수 없으므로, UGA는 모든 프로세스가 접근 가능한 SGA로 이동합니다.',
    sharedUgaLocation: 'UGA ⊂ Large Pool (또는 Shared Pool) ⊂ SGA',
    sharedNote: 'Large Pool이 설정되어 있으면 UGA가 Large Pool에 할당됩니다. Large Pool이 없으면 Shared Pool을 사용합니다. Shared Pool의 단편화를 막기 위해 Shared Server 환경에서는 Large Pool 설정을 강력히 권장합니다.',

    pgaInSharedTitle: 'Shared Server에서의 PGA',
    pgaInSharedDesc: 'Shared Server 모드에서 UGA가 SGA로 이동하면, 서버 프로세스의 PGA에는 무엇이 남을까요?',
    pgaInSharedItems: [
      { label: 'SQL Work Area',    desc: '정렬·해시 조인 등 실행 중인 연산에 필요한 임시 메모리. 연산이 끝나면 해제됩니다.' },
      { label: 'Private SQL Area', desc: 'Shared Server에서는 Private SQL Area도 UGA의 일부로 SGA(Large Pool)에 위치합니다.' },
    ],
    pgaInSharedNote: '결과적으로 Shared Server 환경의 개별 PGA는 매우 작아집니다. 세션 상태(UGA)는 SGA에, 실행 중인 연산의 임시 공간(Work Area)만 PGA에 남습니다.',

    vsTitle: 'PGA vs UGA 비교',
    vsRows: [
      { attr: '소속',          pga: '서버 프로세스',                         uga: '세션' },
      { attr: 'Dedicated 위치', pga: '프로세스 메모리 (OS 할당)',              uga: 'PGA 내부' },
      { attr: 'Shared 위치',   pga: '프로세스 메모리 (Work Area만)',           uga: 'SGA — Large Pool 또는 Shared Pool' },
      { attr: '주요 내용',     pga: 'Private SQL Area, Work Area, UGA',        uga: '세션 변수, 로그인 정보, 커서 상태' },
      { attr: '생명 주기',     pga: '서버 프로세스 시작~종료',                 uga: '세션 연결~해제' },
    ],
    vsAttr: '항목',
    vsPga: 'PGA',
    vsUga: 'UGA',

    summaryTitle: 'UGA 핵심 정리',
    summaryItems: [
      '세션에 소속된 메모리 — 로그인 정보·세션 변수·커서 상태 저장',
      'Dedicated Server: UGA ⊂ PGA (프로세스 메모리 안에 위치)',
      'Shared Server: UGA → SGA Large Pool (모든 서버 프로세스 접근 가능)',
      'Shared Server + Large Pool 없음 → UGA가 Shared Pool을 단편화',
      'PGA는 프로세스에, UGA는 세션에 — 수명 주기가 다르다',
    ],
  },

  en: {
    title: 'UGA',
    subtitle: 'Session state memory — its location depends on the server connection mode',

    whatTitle: 'What is the UGA?',
    whatP1: 'The UGA (User Global Area) is the memory region that holds information needed by a single database session. Logon information, session variables, and session state — everything that must persist for the life of the session lives in the UGA.',
    whatP2: "The UGA differs from the PGA in a key way: the PGA belongs to a server process, whereas the UGA belongs to a session. This distinction becomes critical in Shared Server mode.",
    whatP3: 'In a Shared Server environment, a single session may be handled by different server processes across successive calls. Whatever process picks up the next request must be able to read the session state. Therefore, the UGA moves into shared memory (SGA) where any server process can reach it.',

    contentsTitle: 'What the UGA Stores',
    contents: [
      { label: 'Session Variables',  desc: 'Session-level settings: NLS, current schema, timezone, etc.' },
      { label: 'Logon Information',  desc: 'User authentication info and connection properties set during session initialization' },
      { label: 'Cursor State',       desc: 'State of open cursors (includes Private SQL Area in Shared Server mode)' },
      { label: 'OLAP Pool',          desc: 'Pool that manages OLAP data pages (equivalent to data blocks)' },
      { label: 'Package State',      desc: 'Current values of PL/SQL package variables initialized in this session' },
    ],

    locationTitle: 'UGA Location by Server Mode',
    locationDesc: 'Where the UGA resides is entirely determined by the connection mode — Dedicated or Shared Server.',

    dedicatedLabel: 'Dedicated Server',
    dedicatedDesc: "Each session has its own dedicated server process. The UGA lives inside that process's PGA. Because the session and process are 1:1, the same process always accesses the session state.",
    dedicatedUgaLocation: 'UGA ⊂ PGA (process memory)',

    sharedLabel: 'Shared Server',
    sharedDesc: 'Multiple sessions share a pool of server processes. Since it is impossible to know in advance which process will handle the next request, the UGA must move to shared memory — the SGA — where any process can reach it.',
    sharedUgaLocation: 'UGA ⊂ Large Pool (or Shared Pool) ⊂ SGA',
    sharedNote: 'If Large Pool is configured, UGA is allocated there. Otherwise it falls back to the Shared Pool. To prevent Shared Pool fragmentation, configuring Large Pool is strongly recommended in any Shared Server environment.',

    pgaInSharedTitle: 'PGA Contents in Shared Server Mode',
    pgaInSharedDesc: 'When the UGA moves to the SGA, what remains in the server process PGA?',
    pgaInSharedItems: [
      { label: 'SQL Work Area',    desc: 'Temporary memory for in-progress operations (sorts, hash joins). Freed when the operation completes.' },
      { label: 'Private SQL Area', desc: 'In Shared Server mode, the Private SQL Area is also part of the UGA and lives in the SGA (Large Pool).' },
    ],
    pgaInSharedNote: 'As a result, each individual PGA in Shared Server mode is very small. Session state (UGA) is in the SGA; only the temporary work space for the currently executing operation (Work Area) remains in the PGA.',

    vsTitle: 'PGA vs UGA',
    vsRows: [
      { attr: 'Belongs to',      pga: 'Server process',                        uga: 'Session' },
      { attr: 'Dedicated loc.',  pga: 'Process memory (OS-allocated)',          uga: 'Inside PGA' },
      { attr: 'Shared loc.',     pga: 'Process memory (Work Area only)',        uga: 'SGA — Large Pool or Shared Pool' },
      { attr: 'Main contents',   pga: 'Private SQL Area, Work Area, UGA',       uga: 'Session vars, logon info, cursor state' },
      { attr: 'Lifecycle',       pga: 'Server process start → end',            uga: 'Session connect → disconnect' },
    ],
    vsAttr: 'Attribute',
    vsPga: 'PGA',
    vsUga: 'UGA',

    summaryTitle: 'UGA — Key Takeaways',
    summaryItems: [
      'Session memory — logon info, session variables, cursor state',
      'Dedicated Server: UGA ⊂ PGA (inside process memory)',
      'Shared Server: UGA → SGA Large Pool (accessible by all server processes)',
      'Shared Server without Large Pool → UGA fragments the Shared Pool',
      'PGA belongs to a process, UGA to a session — their lifecycles differ',
    ],
  },
}

// ── SVG: UGA location diagram ──────────────────────────────────────────────

function UgaLocationDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const W = 600
  const PAD = 16
  const HALF_W = (W - PAD * 3) / 2

  const DED_X = PAD
  const SHR_X = PAD * 2 + HALF_W

  const HEADER_Y = PAD + 16
  const DED_Y = HEADER_Y + 14

  // Dedicated: session box → PGA → UGA (stacked)
  const DED_BOX_H = 230
  const PGA_INNER_Y = DED_Y + 36
  const PGA_INNER_H = DED_BOX_H - 44
  const UGA_D_Y = PGA_INNER_Y + 32
  const UGA_D_H = PGA_INNER_H - 40

  // Shared: server processes box + SGA box
  const SHR_PROC_Y = DED_Y
  const SHR_PROC_H = 44
  const SGA_Y = SHR_PROC_Y + SHR_PROC_H + 10
  const SGA_H = DED_BOX_H - SHR_PROC_H - 10

  const LEGEND_Y = DED_Y + DED_BOX_H + 16
  const H = LEGEND_Y + 20

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>

        {/* column headers */}
        <text x={DED_X + HALF_W / 2} y={HEADER_Y} fontFamily="monospace" fontSize={11}
          fontWeight="bold" fill="#1d4ed8" textAnchor="middle">
          {isKo ? 'Dedicated Server' : 'Dedicated Server'}
        </text>
        <text x={SHR_X + HALF_W / 2} y={HEADER_Y} fontFamily="monospace" fontSize={11}
          fontWeight="bold" fill="#065f46" textAnchor="middle">
          {isKo ? 'Shared Server' : 'Shared Server'}
        </text>

        {/* divider */}
        <line x1={W / 2} y1={PAD} x2={W / 2} y2={LEGEND_Y - 4}
          stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4 3" />

        {/* ── Dedicated: session → PGA → UGA ── */}
        <rect x={DED_X + 8} y={DED_Y} width={HALF_W - 16} height={DED_BOX_H} rx={8}
          fill="#eff6ff" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3" />
        <text x={DED_X + 20} y={DED_Y + 18} fontFamily="monospace" fontSize={10}
          fontWeight="bold" fill="#1d4ed8">{isKo ? '세션 (Session)' : 'Session'}</text>
        {/* PGA */}
        <rect x={DED_X + 18} y={PGA_INNER_Y} width={HALF_W - 36} height={PGA_INNER_H} rx={6}
          fill="#faf5ff" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5 3" />
        <text x={DED_X + 30} y={PGA_INNER_Y + 18} fontFamily="monospace" fontSize={10}
          fontWeight="bold" fill="#7c3aed">PGA</text>
        {/* UGA inside PGA */}
        <rect x={DED_X + 28} y={UGA_D_Y} width={HALF_W - 56} height={UGA_D_H} rx={5}
          fill="#d1fae5" stroke="#10b981" strokeWidth={2} />
        <text x={DED_X + 28 + (HALF_W - 56) / 2} y={UGA_D_Y + UGA_D_H / 2 - 8}
          fontFamily="monospace" fontSize={13} fontWeight="bold" fill="#065f46" textAnchor="middle">UGA</text>
        <text x={DED_X + 28 + (HALF_W - 56) / 2} y={UGA_D_Y + UGA_D_H / 2 + 10}
          fontFamily="monospace" fontSize={9} fill="#065f46" textAnchor="middle" opacity={0.8}>
          {isKo ? '세션 변수 · 커서 상태' : 'session vars · cursor state'}
        </text>

        {/* ── Shared: server process pool + SGA ── */}
        <rect x={SHR_X + 8} y={SHR_PROC_Y} width={HALF_W - 16} height={SHR_PROC_H} rx={7}
          fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />
        <text x={SHR_X + HALF_W / 2} y={SHR_PROC_Y + 18} fontFamily="monospace" fontSize={9.5}
          fontWeight="bold" fill="#475569" textAnchor="middle">
          {isKo ? '공유 서버 프로세스' : 'Shared Server Processes'}
        </text>
        <text x={SHR_X + HALF_W / 2} y={SHR_PROC_Y + 32} fontFamily="monospace" fontSize={8.5}
          fill="#94a3b8" textAnchor="middle">
          PGA: {isKo ? 'Work Area만' : 'Work Area only'}
        </text>
        {/* SGA */}
        <rect x={SHR_X + 8} y={SGA_Y} width={HALF_W - 16} height={SGA_H} rx={7}
          fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 3" />
        <text x={SHR_X + 20} y={SGA_Y + 18} fontFamily="monospace" fontSize={10}
          fontWeight="bold" fill="#64748b">SGA — Large Pool</text>
        {/* 3 UGA blocks */}
        {[0, 1, 2].map((i) => {
          const uy = SGA_Y + 28 + i * 42
          return (
            <g key={i}>
              <rect x={SHR_X + 18} y={uy} width={HALF_W - 36} height={30} rx={5}
                fill="#d1fae5" stroke="#10b981" strokeWidth={1.5} />
              <text x={SHR_X + 18 + (HALF_W - 36) / 2} y={uy + 19}
                fontFamily="monospace" fontSize={10} fontWeight="bold" fill="#065f46" textAnchor="middle">
                UGA — {isKo ? `세션 ${i + 1}` : `Session ${i + 1}`}
              </text>
            </g>
          )
        })}

        {/* legends */}
        <rect x={PAD + 8} y={LEGEND_Y} width={10} height={8} rx={2} fill="#d1fae5" stroke="#10b981" strokeWidth={1} />
        <text x={PAD + 22} y={LEGEND_Y + 8} fontFamily="monospace" fontSize={8.5} fill="#6b7280">UGA</text>
        <rect x={PAD + 58} y={LEGEND_Y} width={10} height={8} rx={2} fill="#faf5ff" stroke="#7c3aed" strokeWidth={1} />
        <text x={PAD + 72} y={LEGEND_Y + 8} fontFamily="monospace" fontSize={8.5} fill="#6b7280">PGA</text>
        <rect x={PAD + 108} y={LEGEND_Y} width={10} height={8} rx={2} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
        <text x={PAD + 122} y={LEGEND_Y + 8} fontFamily="monospace" fontSize={8.5} fill="#6b7280">SGA</text>
      </svg>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function UgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle title={t.title} subtitle={t.subtitle} />

      {/* ── What is UGA ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <div className="mb-6 space-y-2">
        <Prose>{t.whatP1}</Prose>
        <Prose>{t.whatP2}</Prose>
        <Prose>{t.whatP3}</Prose>
      </div>

      <Divider />

      {/* ── Contents ── */}
      <SectionTitle>{t.contentsTitle}</SectionTitle>
      <div className="mb-6 overflow-hidden rounded-xl border bg-card">
        {t.contents.map((c, i) => (
          <div key={c.label} className={cn('flex items-start gap-4 px-5 py-3', i > 0 && 'border-t')}>
            <code className="mt-0.5 shrink-0 rounded bg-teal-100 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-700">
              {c.label}
            </code>
            <p className="text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── Location by mode ── */}
      <SectionTitle>{t.locationTitle}</SectionTitle>
      <Prose className="mb-4">{t.locationDesc}</Prose>
      <UgaLocationDiagram lang={lang} />

      <div className="mt-4 mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-500">
            {t.dedicatedLabel}
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.dedicatedDesc}</p>
          <code className="rounded bg-blue-100 px-2 py-1 font-mono text-[11px] font-bold text-blue-700">
            {t.dedicatedUgaLocation}
          </code>
        </div>
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50/40 p-4">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-teal-600">
            {t.sharedLabel}
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.sharedDesc}</p>
          <code className="rounded bg-teal-100 px-2 py-1 font-mono text-[11px] font-bold text-teal-700">
            {t.sharedUgaLocation}
          </code>
        </div>
      </div>
      <InfoBox variant="warning">{t.sharedNote}</InfoBox>

      <Divider />

      {/* ── PGA in Shared Server ── */}
      <SectionTitle>{t.pgaInSharedTitle}</SectionTitle>
      <Prose className="mb-4">{t.pgaInSharedDesc}</Prose>
      <div className="mb-4 space-y-2">
        {t.pgaInSharedItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-2.5">
            <code className="mt-0.5 shrink-0 rounded bg-violet-100 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-700">
              {item.label}
            </code>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
      <InfoBox variant="note">{t.pgaInSharedNote}</InfoBox>

      <Divider />

      {/* ── PGA vs UGA table ── */}
      <SectionTitle>{t.vsTitle}</SectionTitle>
      <div className="mb-6 overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-3 border-b bg-muted/40 px-4 py-2">
          {[t.vsAttr, t.vsPga, t.vsUga].map((h) => (
            <div key={h} className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{h}</div>
          ))}
        </div>
        {t.vsRows.map((row, i) => (
          <div key={row.attr} className={cn('grid grid-cols-3 px-4 py-2.5 text-xs', i > 0 && 'border-t')}>
            <div className="font-semibold text-foreground">{row.attr}</div>
            <div className="font-medium text-violet-700">{row.pga}</div>
            <div className="font-medium text-teal-700">{row.uga}</div>
          </div>
        ))}
      </div>

      {/* ── Summary ── */}
      <div className="mt-8 rounded-2xl border bg-gradient-to-br from-slate-50 to-teal-50/30 px-6 py-5">
        <div className="mb-3"><SubTitle>{t.summaryTitle}</SubTitle></div>
        <ul className="space-y-1.5">
          {t.summaryItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
