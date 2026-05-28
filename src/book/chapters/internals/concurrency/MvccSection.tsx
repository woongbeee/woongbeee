import { IconHistory } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  AccordionSection,
} from '../../shared'
import { cn } from '@/lib/utils.ts'

const T = {
  ko: {
    title: 'MVCC',
    titleSub: 'Multi-Version Concurrency Control',
    titleDesc: '— 다중 버전 읽기 일관성',
    subtitle:
      'Oracle은 데이터 블록의 여러 버전을 동시에 유지해서, 읽기와 쓰기가 서로를 방해하지 않도록 해요.',
    overviewTitle: '읽기 일관성이 뭐예요?',
    overviewDesc:
      'Oracle은 다중 버전 일관성 모델(multiversion consistency model)을 사용해요. 여러 사람이 동시에 접속해도 각자 특정 시점에 일관된 데이터 뷰를 볼 수 있어요. 같은 블록의 여러 버전이 동시에 존재할 수 있기 때문에, 트랜잭션은 쿼리가 요구하는 시점에 커밋된 버전의 데이터를 읽을 수 있어요.',
    guarantees: '읽기 일관성의 세 가지 보장',
    guaranteeItems: [
      {
        num: '1',
        color: 'bg-blue-500',
        title: '커밋된 데이터만 읽어요',
        text: 'Oracle은 Dirty Read(커밋되지 않은 데이터를 읽는 것)를 절대 허용하지 않아요. 미커밋 데이터를 읽는 일 자체가 불가능해요.',
      },
      {
        num: '2',
        color: 'bg-indigo-500',
        title: '단일 시점 일관성',
        text: '쿼리가 반환하는 데이터는 단 하나의 시점에 커밋된 일관된 데이터예요. 쿼리가 실행되는 중에 다른 트랜잭션이 커밋해도 그 변경은 보이지 않아요.',
      },
      {
        num: '3',
        color: 'bg-violet-500',
        title: '읽기와 쓰기는 서로를 막지 않아요',
        text: 'Oracle의 쿼리는 다른 쿼리나 DML을 절대 기다리게 하지 않아요. 읽기가 쓰기를 막지 않고, 쓰기도 읽기를 막지 않아요.',
      },
    ],
    howTitle: 'MVCC는 어떻게 동작하나요?',
    howDesc:
      '데이터를 수정할 때마다 Oracle은 Undo 항목을 만들어 Undo Segment에 기록해요. Undo Segment에는 커밋되지 않은, 또는 최근에 커밋된 트랜잭션이 바꾼 데이터의 이전 값이 들어 있어요.',
    crCloneTitle: 'CR Clone은 어떻게 만들어지나요?',
    crCloneDesc:
      'SELECT가 SCN 10023 시점에서 시작됐는데, 읽으려는 블록의 SCN이 10024라면 Oracle은 어떻게 할까요? 해당 블록을 새 버퍼에 복사한 다음 Undo 데이터를 적용해서 이전 버전을 재구성해요. 이렇게 다시 만들어진 블록을 CR Clone(Consistent Read Clone, 일관된 읽기 복사본)이라고 해요.',
    statementVsTransaction: '문장 수준 vs 트랜잭션 수준 읽기 일관성',
    statementVsTransactionDesc:
      '읽기 일관성은 문장 수준(Statement-Level)과 트랜잭션 수준(Transaction-Level) 두 가지가 있어요. Oracle은 기본적으로 문장 수준 읽기 일관성을 제공해요.',
    undoTitle: 'ORA-01555: snapshot too old',
    undoDesc:
      'Undo 데이터가 덮어씌워지기 전에 오래된 쿼리의 CR Clone이 필요하면 ORA-01555: snapshot too old 오류가 발생해요. UNDO_RETENTION 파라미터로 Undo 보관 기간을 늘려서 예방할 수 있어요.',
    snapshotTooOldCause:
      '원인: Undo Segment가 재사용될 때 쿼리가 아직 이전 버전을 필요로 하는 상황이에요. 특히 오래 실행되는 배치 쿼리나 SERIALIZABLE 트랜잭션에서 자주 발생해요.',
  },
  en: {
    title: 'MVCC',
    titleSub: 'Multi-Version Concurrency Control',
    titleDesc: '— Multiversion Read Consistency',
    subtitle:
      'Oracle maintains multiple simultaneous versions of data blocks so reads and writes never block each other.',
    overviewTitle: 'What is Read Consistency?',
    overviewDesc:
      "Oracle uses a multiversion consistency model. The database can present a view of data to multiple concurrent users, with each view consistent to a point in time. Because different versions of data blocks can exist simultaneously, transactions can read the version of data committed at the point in time required by a query.",
    guarantees: 'Three Guarantees of Read Consistency',
    guaranteeItems: [
      {
        num: '1',
        color: 'bg-blue-500',
        title: 'Only committed data is read',
        text: 'Oracle never permits a dirty read, which occurs when a transaction reads uncommitted data in another transaction.',
      },
      {
        num: '2',
        color: 'bg-indigo-500',
        title: 'Single point-in-time consistency',
        text: 'Data returned by a query is committed and consistent for a single point in time. Changes committed while the query runs are not visible.',
      },
      {
        num: '3',
        color: 'bg-violet-500',
        title: 'Readers and writers never block each other',
        text: "Oracle's queries never force other queries or DML to wait. Readers don't block writers, and writers don't block readers.",
      },
    ],
    howTitle: 'How does MVCC work?',
    howDesc:
      'Whenever a user modifies data, Oracle creates undo entries, which it writes to undo segments. The undo segments contain the old values of data that have been changed by uncommitted or recently committed transactions.',
    crCloneTitle: 'How CR Clones are Created',
    crCloneDesc:
      "Suppose a SELECT starts at SCN 10023 but the block it needs has SCN 10024. Oracle copies the current block to a new buffer and applies undo data to reconstruct the earlier version. These reconstructed data blocks are called consistent read (CR) clones.",
    statementVsTransaction: 'Statement-Level vs Transaction-Level Consistency',
    statementVsTransactionDesc:
      'Read consistency comes in two forms: statement-level and transaction-level. Oracle provides statement-level read consistency by default.',
    undoTitle: 'ORA-01555: snapshot too old',
    undoDesc:
      "If undo data is overwritten before a long-running query's CR Clone can be constructed, ORA-01555: snapshot too old is raised. Increase UNDO_RETENTION to keep undo data longer.",
    snapshotTooOldCause:
      'Cause: An undo segment is reused while the query still needs the older version. Occurs most often in long-running batch queries or SERIALIZABLE transactions.',
  },
}

// CR Clone 생성 과정 다이어그램
const CRCloneDiagram = ({ lang }: { lang: 'ko' | 'en' }) => {
  const isKo = lang === 'ko'
  return (
    <svg
      viewBox="0 0 680 300"
      className="w-full max-w-2xl mx-auto"
      aria-label="CR Clone creation diagram"
    >
      {/* SCN 타임라인 */}
      <line x1="40" y1="50" x2="640" y2="50" stroke="#94a3b8" strokeWidth="2" />
      <text x="30" y="45" fontSize="10" fill="#64748b" textAnchor="end">
        SCN
      </text>
      {[10020, 10021, 10022, 10023, 10024, 10025].map((scn, i) => (
        <g key={scn}>
          <line
            x1={80 + i * 100}
            y1="46"
            x2={80 + i * 100}
            y2="54"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <text
            x={80 + i * 100}
            y="68"
            fontSize="10"
            fill="#64748b"
            textAnchor="middle"
          >
            {scn}
          </text>
        </g>
      ))}

      {/* SELECT 시작 (SCN 10023) */}
      <circle cx="380" cy="50" r="7" fill="#3b82f6" />
      <line x1="380" y1="57" x2="380" y2="90" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" />
      <rect x="300" y="90" width="160" height="36" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
      <text x="380" y="106" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        {isKo ? 'SELECT 시작' : 'SELECT starts'}
      </text>
      <text x="380" y="120" fontSize="9" fill="#3b82f6" textAnchor="middle">
        SCN = 10023
      </text>

      {/* UPDATE (SCN 10024) */}
      <circle cx="480" cy="50" r="7" fill="#f59e0b" />
      <line x1="480" y1="57" x2="480" y2="90" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
      <rect x="410" y="90" width="140" height="36" rx="6" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.5" />
      <text x="480" y="106" fontSize="10" fill="#d97706" textAnchor="middle" fontWeight="bold">
        {isKo ? '다른 세션 UPDATE' : 'Another session UPDATE'}
      </text>
      <text x="480" y="120" fontSize="9" fill="#d97706" textAnchor="middle">
        {isKo ? '블록 SCN → 10024' : 'Block SCN → 10024'}
      </text>

      {/* 현재 블록 */}
      <rect x="60" y="160" width="160" height="60" rx="8" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.5" />
      <text x="140" y="182" fontSize="10" fill="#dc2626" textAnchor="middle" fontWeight="bold">
        {isKo ? '현재 블록 (SCN 10024)' : 'Current Block (SCN 10024)'}
      </text>
      <text x="140" y="198" fontSize="9" fill="#ef4444" textAnchor="middle">
        {isKo ? 'sal = 7000 (변경됨)' : 'sal = 7000 (modified)'}
      </text>
      <text x="140" y="213" fontSize="9" fill="#9ca3af" textAnchor="middle">
        {isKo ? '쿼리 SCN보다 큼 →' : 'Greater than query SCN →'}
      </text>

      {/* Undo Segment */}
      <rect x="260" y="160" width="160" height="60" rx="8" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
      <text x="340" y="182" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="bold">
        Undo Segment
      </text>
      <text x="340" y="198" fontSize="9" fill="#92400e" textAnchor="middle">
        {isKo ? '원본: sal = 6200' : 'Original: sal = 6200'}
      </text>
      <text x="340" y="213" fontSize="9" fill="#78350f" textAnchor="middle">
        {isKo ? '(SCN 10023 이전 값)' : '(value before SCN 10023)'}
      </text>

      {/* CR Clone */}
      <rect x="460" y="160" width="160" height="60" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
      <text x="540" y="182" fontSize="10" fill="#15803d" textAnchor="middle" fontWeight="bold">
        CR Clone
      </text>
      <text x="540" y="198" fontSize="9" fill="#16a34a" textAnchor="middle">
        {isKo ? 'sal = 6200 (재구성)' : 'sal = 6200 (reconstructed)'}
      </text>
      <text x="540" y="213" fontSize="9" fill="#15803d" textAnchor="middle">
        {isKo ? '← SELECT에 반환' : '← returned to SELECT'}
      </text>

      {/* 화살표: 현재 블록 → CR Clone */}
      <polyline
        points="220,190 260,190"
        stroke="#f87171"
        strokeWidth="1.5"
        fill="none"
        markerEnd="url(#mvcc-arr1)"
      />
      {/* 화살표: Undo → CR Clone */}
      <polyline
        points="420,190 460,190"
        stroke="#fbbf24"
        strokeWidth="1.5"
        fill="none"
        markerEnd="url(#mvcc-arr2)"
      />

      {/* 설명 레이블 */}
      <text x="240" y="185" fontSize="8" fill="#ef4444" textAnchor="middle">
        {isKo ? '복사' : 'copy'}
      </text>
      <text x="440" y="185" fontSize="8" fill="#d97706" textAnchor="middle">
        {isKo ? 'Undo 적용' : 'apply undo'}
      </text>

      {/* 하단 요약 박스 */}
      <rect x="60" y="240" width="560" height="44" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
      <text x="340" y="258" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        {isKo
          ? 'SELECT는 SCN 10023 시점의 일관된 데이터를 봅니다 — 대기 없음'
          : 'SELECT sees data consistent as of SCN 10023 — no waiting'}
      </text>
      <text x="340" y="276" fontSize="9" fill="#3b82f6" textAnchor="middle">
        {isKo
          ? 'UPDATE가 진행 중이어도 SELECT는 즉시 이전 버전을 반환해요'
          : 'Even while UPDATE is in progress, SELECT immediately returns the prior version'}
      </text>

      <defs>
        <marker id="mvcc-arr1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
        </marker>
        <marker id="mvcc-arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
        </marker>
      </defs>
    </svg>
  )
}

export function MvccSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconHistory size={36} stroke={1.5} className="text-blue-500" />}
        title={
          <span className="flex items-baseline gap-2 flex-wrap">
            {t.title}
            <span className="text-base font-normal text-muted-foreground tracking-normal whitespace-nowrap">
              {t.titleSub}
            </span>
            <span className="text-2xl whitespace-nowrap">{t.titleDesc}</span>
          </span>
        }
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>

      <div className="mt-4 space-y-3 mb-6">
        {t.guaranteeItems.map((item) => (
          <div key={item.num} className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                item.color,
              )}
            >
              {item.num}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <Prose>{t.howDesc}</Prose>

      <AccordionSection title={t.crCloneTitle} defaultOpen>
        <Prose>{t.crCloneDesc}</Prose>
      </AccordionSection>

      <div className="w-full max-w-2xl mx-auto my-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <CRCloneDiagram lang={lang} />
      </div>

      <Divider />

      <SectionTitle>{t.statementVsTransaction}</SectionTitle>
      <Prose>{t.statementVsTransactionDesc}</Prose>
      <Table
        headers={[
          lang === 'ko' ? '구분' : 'Level',
          lang === 'ko' ? '일관성 기준 시점' : 'Consistency Point',
          lang === 'ko' ? '설명' : 'Description',
          lang === 'ko' ? '설정 방법' : 'How to Set',
        ]}
        rows={
          lang === 'ko'
            ? [
                [
                  'Statement-Level\n(문장 수준)',
                  '각 SELECT 문 시작 시점',
                  '기본값. 문장이 시작된 SCN 기준. 같은 트랜잭션 내라도 다음 SELECT에서는 새로 커밋된 데이터가 보일 수 있음',
                  '— (기본 동작)',
                ],
                [
                  'Transaction-Level\n(트랜잭션 수준)',
                  '트랜잭션 시작 시점',
                  '트랜잭션 전체가 동일한 SCN 기준. 팬텀 리드 없음. SET TRANSACTION 또는 ALTER SESSION으로 설정',
                  'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE',
                ],
              ]
            : [
                [
                  'Statement-Level',
                  'Each SELECT start time',
                  "Default. Based on SCN when statement opens. Even within the same transaction, the next SELECT may see newly committed data.",
                  '— (default behavior)',
                ],
                [
                  'Transaction-Level',
                  'Transaction start time',
                  'Entire transaction uses one SCN. No phantom reads. Set with SET TRANSACTION or ALTER SESSION.',
                  'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE',
                ],
              ]
        }
      />

      <Divider />

      <div className="mt-8">
        <InfoBox variant="warning">
          <strong>{t.undoTitle}</strong>
          <br />
          {t.undoDesc}
          <br />
          <span className="text-xs mt-1 block opacity-80">{t.snapshotTooOldCause}</span>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
