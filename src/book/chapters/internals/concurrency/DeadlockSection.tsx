import { IconAlertTriangle } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
} from '../../shared'

const T = {
  ko: {
    title: '교착상태(Deadlock)',
    subtitle: '두 트랜잭션이 서로가 가진 락을 기다리며 영원히 멈추는 상황과 Oracle의 자동 해결 방식을 알아봅니다.',
    whatTitle: '교착상태란?',
    whatDesc:
      '트랜잭션 A가 행 1을 잠근 채 행 2를 기다리고, 동시에 트랜잭션 B가 행 2를 잠근 채 행 1을 기다리면 서로가 서로를 기다리는 순환 대기가 생깁니다. 이것이 교착상태(Deadlock)입니다.',
    detectionTitle: 'Oracle의 자동 감지 및 해결',
    detectionDesc:
      'Oracle은 교착상태를 자동으로 감지합니다. 교착상태가 감지되면 관여한 트랜잭션 중 하나의 가장 최근 SQL 문만 롤백하고 ORA-00060 오류를 반환합니다. 트랜잭션 전체가 롤백되는 것이 아닙니다.',
    errorNote: 'ORA-00060: deadlock detected while waiting for resource',
    appHandleDesc:
      'ORA-00060을 받으면 애플리케이션은 트랜잭션 전체를 ROLLBACK 하거나, 작업을 재시도하는 로직을 구현해야 합니다.',
    preventTitle: '교착상태 예방',
    preventItems: [
      '여러 트랜잭션이 같은 행 집합을 수정한다면, 항상 동일한 순서로 행에 접근하도록 설계합니다.',
      'LOCK TABLE ... IN EXCLUSIVE MODE 같은 명시적 잠금을 남용하지 않습니다.',
      'Oracle은 락 에스컬레이션이 없고 행 수준 잠금을 사용하므로 교착상태 자체가 드뭅니다.',
      '트랜잭션을 짧게 유지하고 자주 COMMIT하면 락 보유 시간이 줄어 교착상태 가능성이 줄어듭니다.',
    ],
    rareTitle: '교착상태가 드문 이유',
    rareDesc:
      'Oracle은 쿼리에서 읽기 락을 사용하지 않으며(MVCC), 락 에스컬레이션도 없습니다. 페이지 수준이 아닌 행 수준 잠금을 사용하기 때문에 잠금 충돌 자체가 적습니다. 교착상태는 대부분 애플리케이션 코드의 설계 문제에서 비롯됩니다.',
  },
  en: {
    title: 'Deadlocks',
    subtitle: "Understand the situation where two transactions wait for each other's locks forever, and how Oracle resolves it automatically.",
    whatTitle: 'What is a Deadlock?',
    whatDesc:
      'Transaction A holds a lock on Row 1 and waits for Row 2; at the same time, Transaction B holds Row 2 and waits for Row 1. Each is waiting for the other — a circular wait. This is a deadlock.',
    detectionTitle: "Oracle's Automatic Detection & Resolution",
    detectionDesc:
      'Oracle automatically detects deadlocks. When detected, it rolls back only the most recent SQL statement in one of the involved transactions and returns ORA-00060. The entire transaction is NOT rolled back.',
    errorNote: 'ORA-00060: deadlock detected while waiting for resource',
    appHandleDesc:
      'Upon receiving ORA-00060, the application should ROLLBACK the entire transaction or implement retry logic.',
    preventTitle: 'Deadlock Prevention',
    preventItems: [
      'If multiple transactions modify the same set of rows, always access them in the same order.',
      'Avoid overusing explicit locks like LOCK TABLE ... IN EXCLUSIVE MODE.',
      "Oracle's lack of lock escalation and use of row-level locking make deadlocks naturally rare.",
      'Keep transactions short and commit frequently to minimize lock hold time and deadlock potential.',
    ],
    rareTitle: 'Why Deadlocks Are Rare',
    rareDesc:
      'Oracle uses no read locks for queries (MVCC) and never escalates locks. Row-level (not page-level) locking minimizes contention. Most deadlocks trace back to application design issues.',
  },
}

const DeadlockDiagram = ({ lang }: { lang: 'ko' | 'en' }) => (
  <svg viewBox="0 0 460 200" className="w-full max-w-xl mx-auto" aria-label="Deadlock diagram">
    <rect x="30" y="60" width="130" height="80" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
    <text x="95" y="85" fontSize="11" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">Transaction A</text>
    <text x="95" y="105" fontSize="9" fill="#3b82f6" textAnchor="middle">
      {lang === 'ko' ? '행 1 잠금 보유' : 'Holds lock on Row 1'}
    </text>
    <text x="95" y="120" fontSize="9" fill="#ef4444" textAnchor="middle">
      {lang === 'ko' ? '행 2 대기 중 ⏳' : 'Waiting for Row 2 ⏳'}
    </text>
    <rect x="300" y="60" width="130" height="80" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
    <text x="365" y="85" fontSize="11" fill="#dc2626" textAnchor="middle" fontWeight="bold">Transaction B</text>
    <text x="365" y="105" fontSize="9" fill="#ef4444" textAnchor="middle">
      {lang === 'ko' ? '행 2 잠금 보유' : 'Holds lock on Row 2'}
    </text>
    <text x="365" y="120" fontSize="9" fill="#3b82f6" textAnchor="middle">
      {lang === 'ko' ? '행 1 대기 중 ⏳' : 'Waiting for Row 1 ⏳'}
    </text>
    <path d="M160,90 C220,40 240,40 300,90" stroke="#f87171" strokeWidth="1.5" fill="none" strokeDasharray="5,3"
      markerEnd="url(#dead-arr1)" />
    <path d="M300,130 C240,160 220,160 160,130" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeDasharray="5,3"
      markerEnd="url(#dead-arr2)" />
    <text x="230" y="36" fontSize="9" fill="#dc2626" textAnchor="middle">
      {lang === 'ko' ? 'A가 B의 행 2를 기다림' : "A waits for B's Row 2"}
    </text>
    <text x="230" y="175" fontSize="9" fill="#3b82f6" textAnchor="middle">
      {lang === 'ko' ? 'B가 A의 행 1을 기다림' : "B waits for A's Row 1"}
    </text>
    <rect x="150" y="88" width="160" height="24" rx="6" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
    <text x="230" y="105" fontSize="9" fill="#78350f" textAnchor="middle" fontWeight="bold">
      {lang === 'ko' ? 'ORA-00060 → A의 문장 롤백' : 'ORA-00060 → A\'s stmt rolled back'}
    </text>
    <defs>
      <marker id="dead-arr1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
      </marker>
      <marker id="dead-arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#60a5fa" />
      </marker>
    </defs>
  </svg>
)

export function DeadlockSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconAlertTriangle size={36} stroke={1.5} className="text-red-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <div className="w-full max-w-xl mx-auto my-6 rounded-xl border border-red-100 bg-red-50/30 p-4">
        <DeadlockDiagram lang={lang} />
      </div>

      <Divider />

      <SectionTitle>{t.detectionTitle}</SectionTitle>
      <Prose>{t.detectionDesc}</Prose>

      <InfoBox variant="danger">
        <code className="font-mono text-xs">{t.errorNote}</code>
      </InfoBox>

      <Prose>{t.appHandleDesc}</Prose>

      <div className="mt-4">
        <SqlBlock
          sql={lang === 'ko' ? `-- ORA-00060 처리 예시 (PL/SQL)
BEGIN
  UPDATE employees SET salary = 7000 WHERE employee_id = 101;
  -- ...추가 작업...
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -60 THEN
      -- 교착상태: 전체 트랜잭션 롤백 후 재시도
      ROLLBACK;
    END IF;
END;` : `-- ORA-00060 handling example (PL/SQL)
BEGIN
  UPDATE employees SET salary = 7000 WHERE employee_id = 101;
  -- ...more work...
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -60 THEN
      -- Deadlock: rollback entire transaction and retry
      ROLLBACK;
    END IF;
END;`}
        />
      </div>

      <Divider />

      <SectionTitle>{t.preventTitle}</SectionTitle>
      <div className="space-y-2 mb-6">
        {t.preventItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
              {i + 1}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
          </div>
        ))}
      </div>

      <InfoBox variant="tip">
        <strong>{t.rareTitle}</strong>
        <br />
        {t.rareDesc}
      </InfoBox>
    </PageContainer>
  )
}
