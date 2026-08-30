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
    subtitle: '트랜잭션이 데이터 무결성을 지키려면 반드시 만족해야 하는 네 가지 속성이 있어요.',
    atomicityDetailTitle: '문장 수준 원자성 vs 트랜잭션 수준 원자성',
    acidAtomicityDetail:
      "Oracle에서는 문장 수준 원자성(Statement-Level Atomicity)과 트랜잭션 수준 원자성을 구별해요. 하나의 SQL 문장이 실패하면 그 문장의 변경만 자동으로 롤백되고, 그 앞에 성공한 문장들은 그대로 유지돼요. 단, 파싱(구문 분석) 오류는 문장 수준 롤백을 일으키지 않아요 — 데드락이나 제약 조건 위반일 때만 문장 수준 롤백이 발생해요. COMMIT 전에 장애가 생기면 Oracle이 자동으로 ROLLBACK을 수행해서 모든 변경을 취소해요. 이 역할을 Undo Segment가 담당해요.",
    scnTitle: 'SCN (System Change Number, 시스템 변경 번호)',
    scnDesc:
      'SCN(System Change Number, 시스템 변경 번호)은 데이터베이스에서 일어나는 모든 사건의 순서를 기록하는 논리적 타임스탬프예요. 숫자가 계속 증가하기만 하고, SCN이 낮을수록 더 일찍 일어난 일이에요. 여러 사건이 동시에 발생하면 같은 SCN을 가질 수도 있어요.\n\nOracle은 트랜잭션이 데이터를 바꿀 때 SCN을 Undo Segment에 기록하고, COMMIT 시에는 LGWR(로그 라이터)이 SCN을 온라인 리두 로그에 기록해요. 이 SCN이 인스턴스 복구와 미디어 복구의 기준점이 돼요.',
    summary:
      'ACID는 트랜잭션 시스템의 이론적 토대예요. Oracle은 Undo Segment(원자성·격리성), 제약 조건 검증(일관성), Redo Log(지속성)로 ACID를 구현해요. SCN(System Change Number)은 모든 트랜잭션 이벤트의 논리적 순서를 결정해요.',
    acidItems: [
      {
        letter: 'A',
        name: '원자성 (Atomicity)',
        desc: '트랜잭션 안의 모든 작업은 전부 성공하거나 전부 실패해요. 절반만 성공하는 중간 상태는 없어요.',
        detail:
          'COMMIT 전에 오류가 생기면 Oracle이 자동으로 ROLLBACK을 수행해서 변경을 모두 취소해요. Undo Segment가 이 역할을 맡고 있어요.\n\n문장 수준 원자성(Statement-Level Atomicity): 개별 SQL 문장 하나하나도 원자 단위예요. 하나의 UPDATE가 실패해도 그 이전 UPDATE의 변경은 살아 있고, 실패한 UPDATE의 변경만 자동 롤백돼요.',
        color: 'blue' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
      {
        letter: 'C',
        name: '일관성 (Consistency)',
        desc: '트랜잭션 전후로 데이터베이스는 항상 제약 조건을 만족하는 유효한 상태를 유지해요.',
        detail:
          'PRIMARY KEY, FOREIGN KEY, NOT NULL 같은 제약 조건은 COMMIT 시점에 검증돼요. 위반이 발견되면 트랜잭션 전체가 롤백돼요.',
        color: 'emerald' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
      {
        letter: 'I',
        name: '격리성 (Isolation)',
        desc: '진행 중인 트랜잭션의 중간 결과는 다른 트랜잭션에 보이지 않아요.',
        detail:
          'Oracle은 MVCC(Multi-Version Concurrency Control, 다중 버전 동시성 제어)로 이걸 구현해요. 다른 세션이 아직 커밋되지 않은 변경을 읽으려 하면, Undo Segment에서 이전 버전 데이터를 재구성해서 돌려줘요. SCN(System Change Number)이 각 이벤트의 논리적 순서를 결정해요.',
        color: 'violet' as const,
        collapseLabel: '▼ Oracle의 구현 방식',
        expandLabel: '▲ 접기',
      },
      {
        letter: 'D',
        name: '지속성 (Durability)',
        desc: 'COMMIT된 트랜잭션의 변경은 시스템 장애가 발생해도 사라지지 않아요.',
        detail:
          'LGWR(Log Writer, 로그 라이터) 프로세스가 COMMIT 시점에 Redo Log Buffer를 온라인 리두 로그 파일에 즉시 기록해요. 인스턴스가 충돌해도 이 파일로 변경 내용을 복구할 수 있어요. COMMIT 자체의 속도는 트랜잭션 크기와 관계없고, LGWR의 디스크 I/O 시간이 대부분을 차지해요.',
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
  blue:   { ring: 'ring-blue/50',   bg: 'bg-blue/5',   badge: 'bg-blue',   text: 'text-blue',   detail: 'bg-blue/5 border-blue/30'   },
  emerald:{ ring: 'ring-green/50',bg: 'bg-green/5',badge: 'bg-green',text: 'text-green',detail: 'bg-green/5 border-green/30'},
  violet: { ring: 'ring-purple/50', bg: 'bg-purple/5', badge: 'bg-purple', text: 'text-purple', detail: 'bg-purple/5 border-purple/30' },
  orange: { ring: 'ring-amber/50', bg: 'bg-amber/5', badge: 'bg-amber', text: 'text-amber', detail: 'bg-amber/5 border-amber/30' },
}

type AcidColor = keyof typeof colorMap

function AcidCard({ letter, name, desc, detail, color, collapseLabel, expandLabel }: {
  letter: string; name: string; desc: string; detail: string; color: AcidColor
  collapseLabel: string; expandLabel: string
}) {
  const [open, setOpen] = useState(false)
  const c = colorMap[color]
  return (
    <div className={cn('rounded-panel border-2 p-4 transition-all', c.ring, c.bg)}>
      <div className="flex items-start gap-3">
        <span className={cn('shrink-0 flex h-9 w-9 items-center justify-center rounded-card font-mono text-xl font-black text-paper', c.badge)}>
          {letter}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold mb-1', c.text)}>{name}</p>
          <p className="text-xs leading-relaxed text-ink-2">{desc}</p>
          <button
            onClick={() => setOpen(v => !v)}
            className={cn('mt-2 font-mono text-[10px] font-bold underline-offset-2 hover:underline', c.text)}
          >
            {open ? expandLabel : collapseLabel}
          </button>
          {open && (
            <div className={cn('mt-2 rounded-card border px-3 py-2 text-xs leading-relaxed text-ink-2 whitespace-pre-line', c.detail)}>
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
        icon={<IconShieldCheck size={36} stroke={1.5} className="text-blue" />}
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
