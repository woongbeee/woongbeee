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
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'MVCC — 다중 버전 읽기 일관성',
    subtitle: 'Oracle은 데이터 블록의 여러 버전을 동시에 유지해, 읽기와 쓰기가 서로를 막지 않도록 합니다.',
    howTitle: 'MVCC는 어떻게 동작하나요?',
    howDesc:
      'SELECT 문이 시작되면 Oracle은 그 시점의 SCN(System Change Number)을 기록합니다. 이후 블록이 변경되었더라도 Oracle은 Undo Segment에서 이전 버전을 재구성해 쿼리 시작 시점의 일관된 데이터를 돌려줍니다.',
    steps: [
      { num: '1', color: 'bg-blue-500', text: 'SELECT 시작 시점의 SCN을 기록합니다.' },
      { num: '2', color: 'bg-indigo-500', text: '데이터 블록을 읽을 때 해당 블록의 SCN이 쿼리 SCN보다 크면, Undo에서 이전 버전을 재구성합니다(CR Clone 생성).' },
      { num: '3', color: 'bg-violet-500', text: '쿼리 SCN 이전에 커밋된 데이터만 결과로 반환합니다. 미커밋 변경은 절대 보이지 않습니다.' },
    ],
    statementVsTransaction: '문장 수준 vs 트랜잭션 수준 읽기 일관성',
    undoTitle: 'Undo가 없어지면?',
    undoDesc: 'Undo 데이터가 덮어쓰여지기 전에 오래된 트랜잭션의 CR Clone이 필요하면 ORA-01555: snapshot too old 오류가 발생합니다. UNDO_RETENTION 파라미터로 보관 기간을 늘려 방지할 수 있습니다.',
  },
  en: {
    title: 'MVCC — Multiversion Read Consistency',
    subtitle: 'Oracle maintains multiple simultaneous versions of data blocks so reads and writes never block each other.',
    howTitle: 'How does MVCC work?',
    howDesc:
      "When a SELECT begins, Oracle records the current SCN (System Change Number). Even if blocks are modified later, Oracle reconstructs earlier versions from the Undo Segment to return data consistent with the query's start time.",
    steps: [
      { num: '1', color: 'bg-blue-500', text: 'The SCN at the moment SELECT starts is recorded.' },
      { num: '2', color: 'bg-indigo-500', text: 'When reading a block, if its SCN is higher than the query SCN, Oracle reconstructs the earlier version from Undo (CR Clone).' },
      { num: '3', color: 'bg-violet-500', text: 'Only data committed before the query SCN is returned. Uncommitted changes are never visible.' },
    ],
    statementVsTransaction: 'Statement-Level vs Transaction-Level Consistency',
    undoTitle: 'What if Undo is gone?',
    undoDesc: "If Undo data is overwritten before an old transaction's CR Clone is needed, ORA-01555: snapshot too old is raised. Increase UNDO_RETENTION to prevent this.",
  },
}

const MvccDiagramKo = () => (
  <svg viewBox="0 0 620 220" className="w-full max-w-2xl mx-auto" aria-label="MVCC 동작 다이어그램">
    <line x1="40" y1="40" x2="580" y2="40" stroke="#94a3b8" strokeWidth="2" />
    <text x="40" y="32" fontSize="10" fill="#64748b" textAnchor="middle">SCN</text>
    {[1000, 1010, 1020, 1030, 1040].map((scn, i) => (
      <g key={scn}>
        <line x1={80 + i * 110} y1="36" x2={80 + i * 110} y2="44" stroke="#94a3b8" strokeWidth="1.5" />
        <text x={80 + i * 110} y="56" fontSize="10" fill="#64748b" textAnchor="middle">{scn}</text>
      </g>
    ))}
    <circle cx="80" cy="40" r="6" fill="#3b82f6" />
    <text x="80" y="76" fontSize="9" fill="#3b82f6" textAnchor="middle" fontWeight="bold">Session A</text>
    <text x="80" y="88" fontSize="9" fill="#3b82f6" textAnchor="middle">SELECT 시작</text>
    <circle cx="300" cy="40" r="6" fill="#f59e0b" />
    <text x="300" y="76" fontSize="9" fill="#d97706" textAnchor="middle" fontWeight="bold">Session B</text>
    <text x="300" y="88" fontSize="9" fill="#d97706" textAnchor="middle">UPDATE (미커밋)</text>
    <circle cx="410" cy="40" r="6" fill="#10b981" />
    <text x="410" y="76" fontSize="9" fill="#059669" textAnchor="middle">COMMIT</text>
    <circle cx="520" cy="40" r="6" fill="#3b82f6" />
    <text x="520" y="76" fontSize="9" fill="#3b82f6" textAnchor="middle">Session A</text>
    <text x="520" y="88" fontSize="9" fill="#3b82f6" textAnchor="middle">블록 읽기</text>
    <rect x="40" y="110" width="540" height="50" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
    <text x="310" y="130" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
      Session A가 SCN 1040에서 블록을 읽을 때
    </text>
    <text x="310" y="148" fontSize="10" fill="#3b82f6" textAnchor="middle">
      블록 SCN &gt; 1000 → Undo에서 SCN 1000 시점 버전 재구성(CR Clone) → SCN 1000 시점 데이터 반환
    </text>
    <rect x="200" y="170" width="220" height="40" rx="6" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
    <text x="310" y="186" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="bold">Undo Segment</text>
    <text x="310" y="200" fontSize="10" fill="#92400e" textAnchor="middle">SCN 1000 이전 원본 값 보관</text>
    <line x1="310" y1="160" x2="310" y2="170" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,3" />
  </svg>
)

const MvccDiagramEn = () => (
  <svg viewBox="0 0 620 220" className="w-full max-w-2xl mx-auto" aria-label="MVCC operation diagram">
    <line x1="40" y1="40" x2="580" y2="40" stroke="#94a3b8" strokeWidth="2" />
    <text x="40" y="32" fontSize="10" fill="#64748b" textAnchor="middle">SCN</text>
    {[1000, 1010, 1020, 1030, 1040].map((scn, i) => (
      <g key={scn}>
        <line x1={80 + i * 110} y1="36" x2={80 + i * 110} y2="44" stroke="#94a3b8" strokeWidth="1.5" />
        <text x={80 + i * 110} y="56" fontSize="10" fill="#64748b" textAnchor="middle">{scn}</text>
      </g>
    ))}
    <circle cx="80" cy="40" r="6" fill="#3b82f6" />
    <text x="80" y="76" fontSize="9" fill="#3b82f6" textAnchor="middle" fontWeight="bold">Session A</text>
    <text x="80" y="88" fontSize="9" fill="#3b82f6" textAnchor="middle">SELECT starts</text>
    <circle cx="300" cy="40" r="6" fill="#f59e0b" />
    <text x="300" y="76" fontSize="9" fill="#d97706" textAnchor="middle" fontWeight="bold">Session B</text>
    <text x="300" y="88" fontSize="9" fill="#d97706" textAnchor="middle">UPDATE (uncommitted)</text>
    <circle cx="410" cy="40" r="6" fill="#10b981" />
    <text x="410" y="76" fontSize="9" fill="#059669" textAnchor="middle">COMMIT</text>
    <circle cx="520" cy="40" r="6" fill="#3b82f6" />
    <text x="520" y="76" fontSize="9" fill="#3b82f6" textAnchor="middle">Session A</text>
    <text x="520" y="88" fontSize="9" fill="#3b82f6" textAnchor="middle">reads block</text>
    <rect x="40" y="110" width="540" height="50" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
    <text x="310" y="130" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
      Session A reads the block at SCN 1040
    </text>
    <text x="310" y="148" fontSize="10" fill="#3b82f6" textAnchor="middle">
      Block SCN &gt; 1000 → reconstruct SCN 1000 version from Undo (CR Clone) → return SCN 1000 data
    </text>
    <rect x="200" y="170" width="220" height="40" rx="6" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
    <text x="310" y="186" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="bold">Undo Segment</text>
    <text x="310" y="200" fontSize="10" fill="#92400e" textAnchor="middle">Stores original values before SCN 1000</text>
    <line x1="310" y1="160" x2="310" y2="170" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,3" />
  </svg>
)

export function MvccSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconHistory size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <Prose>{t.howDesc}</Prose>

      <div className="mt-4 space-y-3 mb-6">
        {t.steps.map((step) => (
          <div key={step.num} className="flex items-start gap-3">
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', step.color)}>
              {step.num}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl mx-auto my-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        {lang === 'ko' ? <MvccDiagramKo /> : <MvccDiagramEn />}
      </div>

      <Divider />

      <SectionTitle>{t.statementVsTransaction}</SectionTitle>
      <Table
        headers={['구분 / Level', lang === 'ko' ? '일관성 기준 시점' : 'Consistency Point', lang === 'ko' ? '설명' : 'Description']}
        rows={lang === 'ko' ? [
          ['Read Committed (기본)', '각 SELECT 문 시작 시점', '문장이 시작된 SCN 기준. 다른 트랜잭션의 커밋은 다음 SELECT에서 보일 수 있음'],
          ['Serializable', '트랜잭션 시작 시점', '트랜잭션 전체가 하나의 SCN 기준. 팬텀 리드 없음'],
          ['Read-Only', '트랜잭션 시작 시점', 'Serializable과 동일하나 DML 불가 (SYS 제외)'],
        ] : [
          ['Read Committed (default)', 'Each SELECT start time', "Based on SCN at statement open. Another transaction's commits may appear in the next SELECT"],
          ['Serializable', 'Transaction start time', 'Entire transaction uses one SCN. No phantom reads'],
          ['Read-Only', 'Transaction start time', 'Same as Serializable, but no DML allowed (except SYS)'],
        ]}
      />

      <Divider />

      <InfoBox variant="warning">
        <strong>{t.undoTitle}</strong>
        <br />
        {t.undoDesc}
      </InfoBox>
    </PageContainer>
  )
}
