import {
  IconLayersLinked,
  IconEye,
  IconLock,
  IconHistory,
  IconArrowsShuffle,
} from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  ConceptGrid,
  Table,
} from '../../shared'

const T = {
  ko: {
    title: '데이터 동시성과 정합성',
    subtitle:
      '여러 사용자가 동시에 같은 데이터를 읽고 쓸 때, Oracle이 어떻게 충돌을 막고 일관된 결과를 보장하는지 알아봐요.',
    overviewTitle: '동시성과 정합성이 뭐예요?',
    overviewDesc:
      '여러 사람이 동시에 쓰는 데이터베이스에서는, 동시에 실행되는 여러 트랜잭션이 같은 데이터를 수정할 수 있어요. 그럴 때도 결과는 의미 있고 일관되어야 하죠.\n\n데이터 동시성(Concurrency)은 여러 사람이 동시에 데이터에 접근할 수 있는 능력이고, 데이터 정합성(Consistency)은 각 사용자가 데이터를 일관된 시각으로 볼 수 있음을 의미해요. 이 둘을 동시에 만족시키는 게 Oracle 동시성 모델의 핵심 숙제예요.',
    concepts: '핵심 개념',
    conceptItems: [
      {
        icon: <IconEye size={20} stroke={1.5} className="text-blue-500" />,
        title: 'Read Consistency',
        desc: '각 사용자는 커밋된 데이터만 보는 일관된 스냅샷을 봐요. Oracle은 어떤 격리 수준에서도 Dirty Read(미커밋 데이터 읽기)를 허용하지 않아요.',
      },
      {
        icon: <IconHistory size={20} stroke={1.5} className="text-indigo-500" />,
        title: 'MVCC',
        desc: 'Multi-Version Concurrency Control(다중 버전 동시성 제어) — 데이터의 여러 버전을 동시에 유지해서 읽기와 쓰기가 서로를 방해하지 않아요.',
      },
      {
        icon: <IconLock size={20} stroke={1.5} className="text-amber-500" />,
        title: 'Locking',
        desc: 'DML은 수정된 행에만 Row Lock을 걸어 쓰기 충돌을 막아요. 읽기는 절대 쓰기를 막지 않아요.',
      },
      {
        icon: <IconArrowsShuffle size={20} stroke={1.5} className="text-violet-500" />,
        title: 'SCN',
        desc: 'System Change Number(시스템 변경 번호) — Oracle이 시간 순서를 추적하는 계속 증가하는 숫자예요. MVCC에서 "어떤 시점"을 기준 삼는 도구예요.',
      },
    ],
    challengeTitle: '동시성과 정합성, 둘 다 잡을 수 있을까요?',
    challengeDesc:
      '완전한 격리를 보장하면 정합성은 높아지지만 동시성이 떨어져요. 예를 들어 한 트랜잭션이 테이블을 조회하는 동안 다른 트랜잭션이 같은 테이블에 행을 삽입할 수 없다면, 처리 속도가 심각하게 떨어지겠죠. Oracle은 MVCC(다중 버전 동시성 제어)로 이 딜레마를 최소화해요.',
    howTitle: 'Oracle의 접근 방식',
    howItems: [
      {
        label: 'MVCC로 읽기-쓰기 충돌 제거',
        desc: 'SELECT는 Undo에서 이전 버전을 재구성해, 쓰기와 충돌 없이 일관된 데이터를 반환해요.',
      },
      {
        label: '행(row) 수준 잠금',
        desc: '수정된 행에만 락을 걸어 충돌을 최소화해요. 페이지 수준이나 테이블 수준 잠금은 사용하지 않아요.',
      },
      {
        label: '락 에스컬레이션 없음',
        desc: 'Row Lock이 아무리 많아져도 Table Lock으로 확대하지 않아요. 항상 행 수준만 잠가요.',
      },
      {
        label: '자동 최소 잠금 정책',
        desc: 'Oracle이 데이터 무결성을 보장하는 가장 낮은 수준의 제한을 자동으로 적용해, 동시성을 최대한 유지해요.',
      },
    ],
    sectionMapTitle: '이 챕터에서 다루는 내용',
    sectionMapDesc: '데이터 동시성과 정합성 챕터는 아래 4가지 주제로 이루어져 있어요.',
  },
  en: {
    title: 'Data Concurrency & Consistency',
    subtitle:
      'Explore how Oracle prevents conflicts and guarantees consistent results when multiple users read and write the same data simultaneously.',
    overviewTitle: 'What is Concurrency & Consistency?',
    overviewDesc:
      'In a multiuser database, statements within multiple simultaneous transactions may update the same data. Transactions executing simultaneously must produce meaningful and consistent results.\n\nData concurrency means many users can access data at the same time; data consistency means each user sees a consistent view of the data. Achieving both simultaneously is the central challenge of Oracle\'s concurrency model.',
    concepts: 'Key Concepts',
    conceptItems: [
      {
        icon: <IconEye size={20} stroke={1.5} className="text-blue-500" />,
        title: 'Read Consistency',
        desc: 'Each user sees a consistent snapshot of only committed data. Oracle never permits dirty reads at any isolation level.',
      },
      {
        icon: <IconHistory size={20} stroke={1.5} className="text-indigo-500" />,
        title: 'MVCC',
        desc: 'Multiversion Concurrency Control — readers and writers never block each other. Multiple versions of the same block can coexist.',
      },
      {
        icon: <IconLock size={20} stroke={1.5} className="text-amber-500" />,
        title: 'Locking',
        desc: 'DML places Row Locks only on modified rows to prevent write conflicts. Reads never block writes.',
      },
      {
        icon: <IconArrowsShuffle size={20} stroke={1.5} className="text-violet-500" />,
        title: 'SCN',
        desc: "System Change Number — Oracle's monotonically increasing counter for tracking time order. The reference point for MVCC.",
      },
    ],
    challengeTitle: 'The Concurrency vs. Consistency Trade-off',
    challengeDesc:
      "Complete isolation guarantees strong consistency but hurts concurrency. For example, if one transaction querying a table prevents another from inserting rows into it, throughput suffers dramatically. Oracle minimizes this trade-off through MVCC.",
    howTitle: "Oracle's Approach",
    howItems: [
      {
        label: 'MVCC eliminates read-write conflicts',
        desc: 'SELECT reconstructs earlier versions from Undo, returning consistent data without conflicting with writers.',
      },
      {
        label: 'Row-level locking',
        desc: 'Locks are placed only on modified rows, minimizing contention. No page-level or table-level locking for DML.',
      },
      {
        label: 'No lock escalation',
        desc: 'Even with many row locks, Oracle never escalates to table-level locks. Always row-level only.',
      },
      {
        label: 'Automatic minimum-lock policy',
        desc: 'Oracle automatically applies the lowest applicable level of restrictiveness to maximize concurrency while guaranteeing integrity.',
      },
    ],
    sectionMapTitle: 'Chapter Overview',
    sectionMapDesc: 'The Data Concurrency & Consistency chapter covers four topics.',
  },
}

const SECTION_MAP_KO = [
  ['MVCC', '다중 버전 읽기 일관성 — CR Clone, SCN 기반 일관된 읽기'],
  ['트랜잭션 격리 수준', 'Read Committed / Serializable / Read-Only 비교, Lost Update 방지'],
  ['락 메커니즘', 'Row Lock (TX), Table Lock (TM), DDL Lock, Latch/Mutex'],
  ['교착상태', '순환 대기 감지, ORA-00060 자동 해결, 예방 방법'],
]
const SECTION_MAP_EN = [
  ['MVCC', 'Multiversion read consistency — CR clones, SCN-based consistent reads'],
  ['Isolation Levels', 'Read Committed / Serializable / Read-Only comparison, Lost Update prevention'],
  ['Lock Mechanisms', 'Row Lock (TX), Table Lock (TM), DDL Lock, Latch/Mutex'],
  ['Deadlocks', 'Circular wait detection, ORA-00060 auto-resolution, prevention'],
]

// 개요 다이어그램: 동시성 모델 요약
const ConcurrencyOverviewDiagram = ({ lang }: { lang: 'ko' | 'en' }) => {
  const isKo = lang === 'ko'
  return (
    <svg
      viewBox="0 0 620 220"
      className="w-full max-w-2xl mx-auto"
      aria-label="Oracle concurrency model overview"
    >
      {/* 중앙 Oracle 엔진 */}
      <rect x="230" y="80" width="160" height="60" rx="10" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
      <text x="310" y="105" fontSize="11" fill="white" textAnchor="middle" fontWeight="bold">
        Oracle Database
      </text>
      <text x="310" y="122" fontSize="9" fill="#93c5fd" textAnchor="middle">
        MVCC + Row-Level Locking
      </text>

      {/* Reader */}
      <rect x="20" y="30" width="130" height="50" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
      <text x="85" y="50" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        {isKo ? '읽기 (SELECT)' : 'Reader (SELECT)'}
      </text>
      <text x="85" y="67" fontSize="8" fill="#3b82f6" textAnchor="middle">
        {isKo ? '락 없음, CR Clone 반환' : 'No lock — CR Clone returned'}
      </text>

      {/* Writer */}
      <rect x="20" y="140" width="130" height="50" rx="8" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
      <text x="85" y="160" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="bold">
        {isKo ? '쓰기 (DML)' : 'Writer (DML)'}
      </text>
      <text x="85" y="177" fontSize="8" fill="#d97706" textAnchor="middle">
        {isKo ? '행 락 획득, Undo 생성' : 'Acquires row lock, writes Undo'}
      </text>

      {/* Undo Segment */}
      <rect x="470" y="30" width="130" height="50" rx="8" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
      <text x="535" y="50" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="bold">
        Undo Segment
      </text>
      <text x="535" y="67" fontSize="8" fill="#d97706" textAnchor="middle">
        {isKo ? '이전 버전 보관' : 'Stores prior versions'}
      </text>

      {/* Data Block */}
      <rect x="470" y="140" width="130" height="50" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
      <text x="535" y="160" fontSize="10" fill="#15803d" textAnchor="middle" fontWeight="bold">
        {isKo ? '데이터 블록' : 'Data Block'}
      </text>
      <text x="535" y="177" fontSize="8" fill="#16a34a" textAnchor="middle">
        {isKo ? '현재 버전' : 'Current version'}
      </text>

      {/* 화살표들 */}
      {/* Reader → Oracle */}
      <polyline points="150,55 230,100" stroke="#3b82f6" strokeWidth="1.5" fill="none" markerEnd="url(#ov-arr1)" />
      {/* Writer → Oracle */}
      <polyline points="150,165 230,110" stroke="#d97706" strokeWidth="1.5" fill="none" markerEnd="url(#ov-arr2)" />
      {/* Oracle → Undo */}
      <polyline points="390,95 470,55" stroke="#fbbf24" strokeWidth="1.5" fill="none" markerEnd="url(#ov-arr3)" />
      {/* Oracle → Block */}
      <polyline points="390,115 470,165" stroke="#22c55e" strokeWidth="1.5" fill="none" markerEnd="url(#ov-arr4)" />

      {/* 레이블 */}
      <text x="185" y="70" fontSize="8" fill="#3b82f6" textAnchor="middle">
        {isKo ? '읽기 요청' : 'read request'}
      </text>
      <text x="185" y="148" fontSize="8" fill="#d97706" textAnchor="middle">
        {isKo ? '쓰기 요청' : 'write request'}
      </text>
      <text x="435" y="65" fontSize="8" fill="#d97706" textAnchor="middle">
        {isKo ? 'Undo 저장' : 'save undo'}
      </text>
      <text x="435" y="148" fontSize="8" fill="#16a34a" textAnchor="middle">
        {isKo ? '블록 수정' : 'modify block'}
      </text>

      {/* 하단 설명 */}
      <rect x="140" y="188" width="340" height="24" rx="5" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
      <text x="310" y="204" fontSize="9" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        {isKo
          ? 'Reader는 Writer를 기다리지 않고, Writer는 Reader를 막지 않아요'
          : 'Readers never wait for writers — writers never block readers'}
      </text>

      <defs>
        <marker id="ov-arr1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
        </marker>
        <marker id="ov-arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#d97706" />
        </marker>
        <marker id="ov-arr3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
        </marker>
        <marker id="ov-arr4" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#22c55e" />
        </marker>
      </defs>
    </svg>
  )
}

export function ConcurrencySection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayersLinked size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>

      <SectionTitle>{t.concepts}</SectionTitle>
      <ConceptGrid items={t.conceptItems} />

      <div className="my-6">
        <ConcurrencyOverviewDiagram lang={lang} />
      </div>

      <Divider />

      <SectionTitle>{t.challengeTitle}</SectionTitle>
      <Prose>{t.challengeDesc}</Prose>

      <SectionTitle>{t.howTitle}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {t.howItems.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground mb-1">{item.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.sectionMapTitle}</SectionTitle>
      <Prose>{t.sectionMapDesc}</Prose>
      <Table
        headers={[
          lang === 'ko' ? '섹션' : 'Section',
          lang === 'ko' ? '주요 내용' : 'Topics Covered',
        ]}
        rows={lang === 'ko' ? SECTION_MAP_KO : SECTION_MAP_EN}
      />

      <div className="mt-8">
        <InfoBox variant="note">
          {lang === 'ko'
            ? 'Oracle은 다중 버전 일관성 모델(multiversion consistency model)을 사용해요. 여러 사람이 동시에 접속해도 각자 특정 시점에 일관된 데이터 뷰를 볼 수 있어요. 같은 블록의 여러 버전이 동시에 존재할 수 있기 때문에, 트랜잭션은 쿼리가 요구하는 시점에 커밋된 버전의 데이터를 읽을 수 있어요.'
            : 'Oracle uses a multiversion consistency model. The database can present a view of data to multiple concurrent users, with each view consistent to a point in time. Because different versions of data blocks can exist simultaneously, transactions can read the version of data committed at the point in time required by a query.'}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
