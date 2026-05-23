import { useState } from 'react'
import { IconShieldCheck } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'ACID 속성',
    subtitle: '트랜잭션이 데이터 무결성을 보장하기 위해 반드시 만족해야 하는 네 가지 속성입니다.',
    atomicityDetailTitle: '문장 수준 원자성 vs 트랜잭션 수준 원자성',
    acidAtomicityDetail:
      "문장 수준 원자성(Statement-Level Atomicity)과 트랜잭션 수준 원자성이 구분됩니다. 하나의 SQL 문장이 실패하면 그 문장의 변경만 자동 롤백되며, 그 앞의 문장은 유지됩니다. 단, 파싱(구문 분석) 오류는 문장 수준 롤백을 발생시키지 않습니다 — 데드락이나 제약 조건 위반은 문장 수준 롤백을 발생시킵니다. COMMIT 전 장애 시 Oracle이 자동 ROLLBACK을 수행해 모든 변경을 취소합니다. Undo Segment가 이 역할을 담당합니다.",
    scnTitle: 'SCN (System Change Number)',
    scnDesc:
      'SCN은 데이터베이스 이벤트를 순서화하는 논리적 타임스탬프입니다. 단조 증가하는 숫자로, SCN이 낮을수록 더 이른 사건입니다. 여러 이벤트가 동시에 발생하면 같은 SCN을 공유할 수 있습니다.\n\nOracle은 트랜잭션이 데이터를 변경할 때 SCN을 Undo Segment에 기록하고, COMMIT 시 LGWR이 SCN을 온라인 리두 로그에 기록합니다. 이 SCN이 인스턴스 복구와 미디어 복구의 기준점이 됩니다.',
    summary:
      'ACID는 트랜잭션 시스템의 이론적 기반입니다. Oracle은 Undo Segment(원자성·격리성), 제약 조건 검증(일관성), Redo Log(지속성)으로 ACID를 구현합니다. SCN은 모든 트랜잭션 이벤트의 논리적 순서를 결정합니다.',
    acidItems: [
      {
        letter: 'A',
        name: '원자성 (Atomicity)',
        desc: '트랜잭션 내 모든 작업은 전부 성공하거나 전부 실패합니다. 중간 상태는 존재하지 않습니다.',
        detail:
          'COMMIT 전에 오류가 발생하면 Oracle은 자동으로 ROLLBACK을 수행해 변경을 모두 취소합니다. Undo Segment가 이 역할을 담당합니다.\n\n문장 수준 원자성(Statement-Level Atomicity): 개별 SQL 문장도 원자 단위입니다. 하나의 UPDATE가 실패해도 그 이전 UPDATE의 변경은 유지되며, 실패한 UPDATE의 변경만 자동 롤백됩니다.',
        color: 'blue' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
      {
        letter: 'C',
        name: '일관성 (Consistency)',
        desc: '트랜잭션 전후로 데이터베이스는 항상 유효한 상태(제약 조건 만족)를 유지합니다.',
        detail:
          'PRIMARY KEY, FOREIGN KEY, NOT NULL 같은 제약 조건은 COMMIT 시점에 검증됩니다. 위반이 있으면 트랜잭션이 롤백됩니다.',
        color: 'emerald' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
      {
        letter: 'I',
        name: '격리성 (Isolation)',
        desc: '실행 중인 트랜잭션의 중간 결과는 다른 트랜잭션에게 보이지 않습니다.',
        detail:
          'Oracle은 MVCC(Multi Version Concurrency Control)로 이를 구현합니다. 다른 세션이 커밋되지 않은 변경을 읽으려 하면, Undo Segment에서 이전 버전 데이터를 재구성해 반환합니다. SCN(System Change Number)이 각 이벤트의 논리적 순서를 결정합니다.',
        color: 'violet' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
      {
        letter: 'D',
        name: '지속성 (Durability)',
        desc: 'COMMIT된 트랜잭션의 변경은 시스템 장애가 발생해도 유지됩니다.',
        detail:
          'LGWR(Log Writer) 프로세스가 COMMIT 시점에 Redo Log Buffer를 온라인 리두 로그 파일에 즉시 기록합니다. 인스턴스가 충돌해도 이 파일로 변경을 복구할 수 있습니다. COMMIT 자체의 속도는 트랜잭션 크기와 무관하며, LGWR의 디스크 I/O 시간이 주된 소요 시간입니다.',
        color: 'orange' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
    ],
  },
  en: {
    title: 'ACID Properties',
    subtitle: 'The four properties that every transaction must satisfy to guarantee data integrity.',
    atomicityDetailTitle: 'Statement-Level vs Transaction-Level Atomicity',
    acidAtomicityDetail:
      "Oracle distinguishes statement-level atomicity from transaction-level atomicity. If a single SQL statement fails, only that statement's changes are automatically rolled back — preceding statements in the same transaction are preserved. Note: parse (syntax) errors do NOT trigger a statement-level rollback, but deadlocks and constraint violations do. If a failure occurs before COMMIT, Oracle automatically rolls back the entire transaction via the Undo Segment.",
    scnTitle: 'SCN (System Change Number)',
    scnDesc:
      'SCN is a logical, internal timestamp used to order database events. It is a monotonically increasing number — a lower SCN means an earlier event. Multiple simultaneous events may share the same SCN.\n\nOracle writes the SCN to the Undo Segment when a transaction modifies data, and LGWR records the SCN in the online redo log on COMMIT. This SCN serves as the anchor point for instance recovery and media recovery.',
    summary:
      'ACID is the theoretical foundation of transaction systems. Oracle implements it via Undo Segments (Atomicity & Isolation), constraint validation (Consistency), and Redo Logs (Durability). SCN provides the logical ordering of all transaction events.',
    acidItems: [
      {
        letter: 'A',
        name: 'Atomicity',
        desc: 'All operations in a transaction succeed together or fail together. There is no partial success.',
        detail:
          'If an error occurs before COMMIT, Oracle automatically performs a ROLLBACK to undo all changes. The Undo Segment makes this possible.\n\nStatement-Level Atomicity: Each SQL statement is itself atomic. If one UPDATE fails, only that UPDATE is rolled back — previous UPDATEs in the same transaction are retained.',
        color: 'blue' as const,
        collapseLabel: '▼ How Oracle implements this',
        expandLabel: '▲ Collapse',
      },
      {
        letter: 'C',
        name: 'Consistency',
        desc: 'The database must remain in a valid state (satisfying all constraints) before and after the transaction.',
        detail:
          'Constraints such as PRIMARY KEY, FOREIGN KEY, and NOT NULL are validated at COMMIT time. Any violation causes the transaction to roll back.',
        color: 'emerald' as const,
        collapseLabel: '▼ How Oracle implements this',
        expandLabel: '▲ Collapse',
      },
      {
        letter: 'I',
        name: 'Isolation',
        desc: 'Intermediate results of a running transaction are not visible to other transactions.',
        detail:
          'Oracle implements this via MVCC (Multi Version Concurrency Control). When another session tries to read uncommitted changes, Oracle reconstructs the previous version of the data from the Undo Segment. SCN (System Change Number) provides the logical ordering of all events.',
        color: 'violet' as const,
        collapseLabel: '▼ How Oracle implements this',
        expandLabel: '▲ Collapse',
      },
      {
        letter: 'D',
        name: 'Durability',
        desc: 'Committed changes survive system failures.',
        detail:
          'The LGWR (Log Writer) process writes the Redo Log Buffer to the online redo log files at COMMIT time. Even if the instance crashes, these files allow Oracle to recover the committed changes. COMMIT speed is independent of transaction size; the LGWR disk I/O is the primary latency factor.',
        color: 'orange' as const,
        collapseLabel: '▼ How Oracle implements this',
        expandLabel: '▲ Collapse',
      },
    ],
  },
}

const colorMap = {
  blue:   { ring: 'ring-blue-300',   bg: 'bg-blue-50',   badge: 'bg-blue-500',   text: 'text-blue-700',   detail: 'bg-blue-50 border-blue-200'   },
  emerald:{ ring: 'ring-emerald-300',bg: 'bg-emerald-50',badge: 'bg-emerald-500',text: 'text-emerald-700',detail: 'bg-emerald-50 border-emerald-200'},
  violet: { ring: 'ring-violet-300', bg: 'bg-violet-50', badge: 'bg-violet-500', text: 'text-violet-700', detail: 'bg-violet-50 border-violet-200' },
  orange: { ring: 'ring-orange-300', bg: 'bg-orange-50', badge: 'bg-orange-500', text: 'text-orange-700', detail: 'bg-orange-50 border-orange-200' },
}

type AcidColor = keyof typeof colorMap

function AcidCard({ letter, name, desc, detail, color, collapseLabel, expandLabel }: {
  letter: string; name: string; desc: string; detail: string; color: AcidColor
  collapseLabel: string; expandLabel: string
}) {
  const [open, setOpen] = useState(false)
  const c = colorMap[color]
  return (
    <div className={cn('rounded-xl border-2 p-4 transition-all', c.ring, c.bg)}>
      <div className="flex items-start gap-3">
        <span className={cn('shrink-0 flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xl font-black text-white', c.badge)}>
          {letter}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold mb-1', c.text)}>{name}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
          <button
            onClick={() => setOpen(v => !v)}
            className={cn('mt-2 font-mono text-[10px] font-bold underline-offset-2 hover:underline', c.text)}
          >
            {open ? expandLabel : collapseLabel}
          </button>
          {open && (
            <div className={cn('mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line', c.detail)}>
              {detail}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TransactionAcidSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconShieldCheck size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="mt-6 flex flex-col gap-4">
        {t.acidItems.map((item) => (
          <AcidCard key={item.letter} {...item} color={item.color} />
        ))}
      </div>

      <Divider />

      <SubTitle>{t.atomicityDetailTitle}</SubTitle>
      <Prose>{t.acidAtomicityDetail}</Prose>
      <div className="mt-4">
        <SqlBlock
          sql={isKo
            ? `-- 문장 수준 원자성 예시\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';  -- 성공\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene'; -- 실패(제약 위반 등)\n-- 첫 번째 UPDATE 변경은 유지됨 — 이 트랜잭션을 COMMIT하거나 ROLLBACK할 수 있음`
            : `-- Statement-level atomicity example\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';  -- succeeds\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene'; -- fails (constraint, etc.)\n-- The first UPDATE's change is preserved — you can still COMMIT or ROLLBACK this transaction`}
        />
      </div>

      <Divider />

      <SubTitle>{t.scnTitle}</SubTitle>
      <Prose>{t.scnDesc}</Prose>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
