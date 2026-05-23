import { IconRefresh } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  ConceptGrid,
  SqlBlock,
} from '../../shared'
import { cn } from '@/lib/utils'
import { IconHistory, IconFlag, IconShieldCheck } from '@tabler/icons-react'

const T = {
  ko: {
    title: '트랜잭션(Transaction)',
    subtitle:
      '트랜잭션은 Oracle이 데이터를 안전하게 변경하는 논리적 작업 단위입니다. 여러 SQL 문장이 모두 성공하거나, 하나라도 실패하면 전부 취소됩니다.',
    concepts: '트랜잭션의 핵심 특성',
    conceptItems: [
      {
        icon: <IconHistory size={20} stroke={1.5} />,
        title: 'COMMIT',
        desc: '트랜잭션의 모든 변경을 영구적으로 확정합니다. COMMIT 이후에는 취소할 수 없습니다.',
      },
      {
        icon: <IconRefresh size={20} stroke={1.5} />,
        title: 'ROLLBACK',
        desc: '트랜잭션의 모든 변경을 취소하고 이전 상태로 되돌립니다.',
      },
      {
        icon: <IconFlag size={20} stroke={1.5} />,
        title: 'SAVEPOINT',
        desc: '트랜잭션 중간에 복원 지점을 설정합니다. ROLLBACK TO SAVEPOINT로 해당 지점까지만 되돌릴 수 있습니다.',
      },
      {
        icon: <IconShieldCheck size={20} stroke={1.5} />,
        title: 'ACID',
        desc: '트랜잭션이 보장해야 하는 네 가지 속성 — 원자성, 일관성, 격리성, 지속성.',
      },
    ],
    overviewDesc:
      'Oracle에서 트랜잭션은 첫 번째 DML(Data Manipulation Language) 문장이 실행되는 순간 자동으로 시작됩니다. COMMIT 또는 ROLLBACK이 실행될 때까지 모든 변경은 임시 상태이며, 다른 세션에서는 보이지 않습니다.\n\nDDL(CREATE, DROP, ALTER 등) 문장은 실행 전후에 자동 COMMIT이 발생합니다. 따라서 DDL 앞뒤의 DML 변경도 함께 확정되므로 주의해야 합니다.',
    lifecycleTitle: '트랜잭션 생명주기',
    lifecycleDesc: '트랜잭션은 첫 DML 실행 시 시작되어 COMMIT/ROLLBACK 또는 DDL 실행 시 종료됩니다.',
    xidTitle: 'XID — 트랜잭션 식별자',
    xidDesc:
      'Oracle은 트랜잭션 시작 시(첫 DML 실행 시점) Undo Segment에 슬롯을 할당하고, 해당 슬롯을 식별하는 XID(Transaction ID)를 부여합니다.\n\nXID는 세 숫자의 조합입니다:  Undo Segment 번호(USN) | 슬롯 번호 | 시퀀스 번호. 이 세 값이 합쳐져 데이터베이스 전체에서 고유한 트랜잭션 ID를 구성합니다.',
    xidNote:
      'XID는 파싱(Parse) 시점이 아니라 첫 번째 DML 실행 시 할당됩니다. V$TRANSACTION 뷰로 현재 활성 트랜잭션의 XID와 상태를 조회할 수 있습니다.',
    activeStateTitle: '트랜잭션 활성 상태에서 Oracle이 유지하는 정보',
    activeStateRows: [
      ['Undo 데이터 생성', 'SGA에 SQL 문장이 변경한 이전 값(Before Image)이 보관됨'],
      ['Redo 생성', 'Redo Log Buffer에 데이터 블록과 Undo 블록의 변경 내역이 기록됨'],
      ['버퍼 수정', 'SGA Buffer Cache의 블록이 변경됨 (디스크 쓰기 시점은 COMMIT와 무관)'],
      ['행 잠금(Lock)', '다른 세션은 잠긴 행을 변경할 수 없으며, 커밋 전 변경 내용도 볼 수 없음'],
    ],
    lifecycleEndTitle: '트랜잭션이 종료되는 경우',
    lifecycleEndRows: [
      ['COMMIT 또는 ROLLBACK 실행', '명시적 종료 — 가장 일반적인 방법'],
      ['DDL 문장 실행 (CREATE / DROP / ALTER)', 'DDL 앞뒤로 암묵적 COMMIT 발생'],
      ['정상 세션 종료 (EXIT / QUIT)', '미완료 트랜잭션 자동 COMMIT'],
      ['비정상 세션 종료 (접속 끊김)', '자동 ROLLBACK — 커밋되지 않은 변경 취소'],
    ],
  },
  en: {
    title: 'Transactions',
    subtitle:
      'A transaction is the logical unit of work Oracle uses to modify data safely. All SQL statements in a transaction either succeed together or are all rolled back on failure.',
    concepts: 'Core Transaction Concepts',
    conceptItems: [
      {
        icon: <IconHistory size={20} stroke={1.5} />,
        title: 'COMMIT',
        desc: 'Makes all changes in the transaction permanent. Cannot be undone after commit.',
      },
      {
        icon: <IconRefresh size={20} stroke={1.5} />,
        title: 'ROLLBACK',
        desc: 'Undoes all changes in the transaction and restores the previous state.',
      },
      {
        icon: <IconFlag size={20} stroke={1.5} />,
        title: 'SAVEPOINT',
        desc: 'Sets an intermediate restore point. ROLLBACK TO SAVEPOINT reverts only changes made after that point.',
      },
      {
        icon: <IconShieldCheck size={20} stroke={1.5} />,
        title: 'ACID',
        desc: 'The four properties every transaction must satisfy — Atomicity, Consistency, Isolation, Durability.',
      },
    ],
    overviewDesc:
      'In Oracle, a transaction starts automatically the moment the first DML (Data Manipulation Language) statement executes. All changes remain temporary and invisible to other sessions until a COMMIT or ROLLBACK is issued.\n\nDDL statements (CREATE, DROP, ALTER, etc.) trigger an implicit COMMIT both before and after execution. This means any uncommitted DML changes made before a DDL statement are also committed automatically.',
    lifecycleTitle: 'Transaction Lifecycle',
    lifecycleDesc: 'A transaction begins on the first DML statement and ends with COMMIT, ROLLBACK, or an implicit DDL commit.',
    xidTitle: 'XID — Transaction Identifier',
    xidDesc:
      'When a transaction begins (on the first DML statement), Oracle allocates a slot in an Undo Segment and assigns an XID (Transaction ID) to identify that slot.\n\nThe XID is a combination of three numbers: Undo Segment Number (USN) | Slot Number | Sequence Number. Together they form a unique transaction identifier across the entire database.',
    xidNote:
      'The XID is assigned at first DML execution, not at parse time. You can query active transaction XIDs and their status from the V$TRANSACTION view.',
    activeStateTitle: 'Information Oracle Maintains During an Active Transaction',
    activeStateRows: [
      ['Undo Data Generated', 'SGA holds old values (before-images) changed by SQL statements'],
      ['Redo Generated', 'Redo Log Buffer records changes to data blocks and undo blocks'],
      ['Buffers Modified', 'Buffer Cache blocks in SGA are modified (disk write timing is independent of commit)'],
      ['Row Locks Held', 'Other sessions cannot modify locked rows; uncommitted changes are not visible to them'],
    ],
    lifecycleEndTitle: 'When a Transaction Ends',
    lifecycleEndRows: [
      ['COMMIT or ROLLBACK issued', 'Explicit termination — the most common method'],
      ['DDL statement executed (CREATE / DROP / ALTER)', 'Implicit COMMIT before and after the DDL'],
      ['Normal session exit (EXIT / QUIT)', 'Any uncommitted transaction is automatically committed'],
      ['Abnormal session disconnect (connection drop)', 'Automatic ROLLBACK — uncommitted changes discarded'],
    ],
  },
}

function LifecycleDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const steps = isKo
    ? [
        { label: '첫 DML 실행', sub: 'INSERT / UPDATE / DELETE', dot: 'bg-blue-500' },
        { label: 'Undo Slot 할당', sub: 'XID 부여 · Undo Segment 바인딩', dot: 'bg-indigo-500' },
        { label: '변경 진행 중', sub: 'Undo 기록 + Redo 기록', dot: 'bg-slate-400' },
        { label: 'COMMIT 또는 ROLLBACK', sub: 'Redo Flush → Lock 해제 / Undo 복원', dot: 'bg-emerald-500' },
      ]
    : [
        { label: 'First DML', sub: 'INSERT / UPDATE / DELETE', dot: 'bg-blue-500' },
        { label: 'Undo Slot Assigned', sub: 'XID assigned · bound to Undo Segment', dot: 'bg-indigo-500' },
        { label: 'Changes in Progress', sub: 'Undo recorded + Redo recorded', dot: 'bg-slate-400' },
        { label: 'COMMIT or ROLLBACK', sub: 'Redo Flush → locks released / Undo restored', dot: 'bg-emerald-500' },
      ]

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={cn('h-3 w-3 rounded-full', s.dot)} />
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm text-center">
                <p className="font-mono text-[11px] font-bold text-slate-700">{s.label}</p>
                <p className="font-mono text-[9px] text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <span className="font-mono text-slate-300 text-lg shrink-0">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TransactionOverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconRefresh size={36} stroke={1.5} className="text-teal-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.concepts}</SectionTitle>
      <ConceptGrid items={t.conceptItems} />

      <Prose>{t.overviewDesc}</Prose>

      <Divider />

      <SectionTitle>{t.lifecycleTitle}</SectionTitle>
      <Prose>{t.lifecycleDesc}</Prose>
      <LifecycleDiagram lang={lang} />

      <Divider />

      <SectionTitle>{t.xidTitle}</SectionTitle>
      <Prose>{t.xidDesc}</Prose>
      <div className="mt-4">
        <SqlBlock
          sql={`-- 현재 활성 트랜잭션의 XID 조회\nSELECT XID          AS "txn id",\n       XIDUSN       AS "undo seg",\n       XIDSLOT      AS "slot",\n       XIDSQN       AS "seq",\n       STATUS        AS "txn status"\nFROM V$TRANSACTION;\n\n-- 예시 출력:\n-- txn id             undo seg   slot   seq   txn status\n-- 0600060037000000          6      6    55   ACTIVE`}
        />
      </div>
      <InfoBox variant="note">{t.xidNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.activeStateTitle}</SectionTitle>
      <Table
        headers={isKo ? ['항목', '설명'] : ['Item', 'Description']}
        rows={t.activeStateRows}
      />

      <Divider />

      <SectionTitle>{t.lifecycleEndTitle}</SectionTitle>
      <Table
        headers={isKo ? ['종료 조건', '동작'] : ['End Condition', 'Behaviour']}
        rows={t.lifecycleEndRows}
      />
    </PageContainer>
  )
}
