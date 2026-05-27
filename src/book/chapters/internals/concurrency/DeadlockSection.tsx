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
  AccordionSection,
} from '../../shared'

const T = {
  ko: {
    title: '교착상태(Deadlock)',
    subtitle:
      '두 트랜잭션이 서로가 가진 락을 기다리며 영원히 멈추는 상황과 Oracle의 자동 해결 방식을 알아봅니다.',
    whatTitle: '교착상태란?',
    whatDesc:
      '교착상태란 둘 이상의 사용자가 서로가 잠근 데이터를 기다리는 상황입니다. 트랜잭션 A가 행 1을 잠근 채 행 2를 기다리고, 동시에 트랜잭션 B가 행 2를 잠근 채 행 1을 기다리면 서로가 서로를 기다리는 순환 대기가 생깁니다. 이것이 교착상태입니다.',
    officialExampleTitle: '공식 문서 예시 — EMP 100, EMP 200',
    officialExampleDesc:
      'Oracle 공식 문서의 교착상태 예시입니다. 두 트랜잭션이 반대 순서로 행에 접근할 때 교착상태가 발생합니다.',
    exampleSteps: [
      'T1: employees(emp=100) UPDATE → 락 획득',
      'T2: employees(emp=200) UPDATE → 락 획득',
      'T1: employees(emp=200) UPDATE 시도 → T2 완료까지 대기 ⏳',
      'T2: employees(emp=100) UPDATE 시도 → T1 완료까지 대기 ⏳',
      '→ 교착상태 감지! T1의 마지막 문장이 롤백되고 ORA-00060 반환',
      'T2는 이제 T1의 락이 해제되어 정상 진행 가능',
    ],
    detectionTitle: 'Oracle의 자동 감지 및 해결',
    detectionDesc:
      'Oracle은 교착상태를 자동으로 감지합니다. 교착상태가 감지되면 관여한 트랜잭션 중 하나의 가장 최근 SQL 문장만 롤백하고 ORA-00060 오류를 반환합니다. 트랜잭션 전체가 롤백되는 것이 아닙니다 — 오류를 받은 트랜잭션의 나머지 이전 변경사항은 유지됩니다.',
    errorNote: 'ORA-00060: deadlock detected while waiting for resource',
    appHandleDesc:
      'ORA-00060을 받으면 애플리케이션은 반드시 트랜잭션 전체를 ROLLBACK 하거나, 작업을 재시도하는 로직을 구현해야 합니다. ORA-00060이 발생한 단일 문장만 취소되었으므로, ROLLBACK 없이 트랜잭션을 계속하면 일관성 없는 상태가 될 수 있습니다.',
    preventTitle: '교착상태 예방',
    preventItems: [
      '여러 트랜잭션이 같은 행 집합을 수정한다면, 항상 동일한 순서로 행에 접근하도록 설계합니다. (위 예시에서 T1은 100→200, T2는 200→100으로 역순이 문제였습니다.)',
      'LOCK TABLE ... IN EXCLUSIVE MODE 같은 명시적 잠금을 남용하지 않습니다.',
      '트랜잭션을 짧게 유지하고 자주 COMMIT하면 락 보유 시간이 줄어 교착상태 가능성이 줄어듭니다.',
      '필요한 경우 SELECT ... FOR UPDATE NOWAIT 또는 SKIP LOCKED를 사용해 대기 없이 처리합니다.',
    ],
    rareTitle: '교착상태가 드문 이유',
    rareDesc:
      'Oracle은 쿼리에서 읽기 락을 사용하지 않으며(MVCC), 락 에스컬레이션도 없습니다. 페이지 수준이 아닌 행 수준 잠금을 사용하기 때문에 잠금 충돌 자체가 적습니다. 교착상태는 대부분 애플리케이션 코드의 설계 문제(접근 순서 불일치)에서 비롯됩니다.',
    noWaitTitle: 'NOWAIT / SKIP LOCKED 옵션',
    noWaitDesc:
      'SELECT ... FOR UPDATE NOWAIT는 행이 이미 잠겨있으면 대기하지 않고 즉시 ORA-00054를 반환합니다. SKIP LOCKED는 잠긴 행을 건너뛰고 사용 가능한 행만 처리합니다. 큐 처리나 배치 작업에 유용합니다.',
  },
  en: {
    title: 'Deadlocks',
    subtitle:
      "Understand the situation where two transactions wait for each other's locks forever, and how Oracle resolves it automatically.",
    whatTitle: 'What is a Deadlock?',
    whatDesc:
      'A deadlock is a situation in which two or more users are waiting for data locked by each other. Transaction A holds a lock on Row 1 and waits for Row 2; at the same time, Transaction B holds Row 2 and waits for Row 1. Each is waiting for the other — a circular wait. This is a deadlock.',
    officialExampleTitle: 'Oracle Docs Example — EMP 100, EMP 200',
    officialExampleDesc:
      'This is the deadlock example from the Oracle documentation. A deadlock occurs when two transactions access the same rows in opposite order.',
    exampleSteps: [
      'T1: UPDATE employees(emp=100) → acquires lock',
      'T2: UPDATE employees(emp=200) → acquires lock',
      'T1: attempts UPDATE employees(emp=200) → waits for T2 ⏳',
      'T2: attempts UPDATE employees(emp=100) → waits for T1 ⏳',
      '→ Deadlock detected! T1\'s last statement is rolled back; ORA-00060 returned',
      'T2 can now proceed — T1\'s lock on emp=100 is released',
    ],
    detectionTitle: "Oracle's Automatic Detection & Resolution",
    detectionDesc:
      "Oracle automatically detects deadlocks. When detected, it rolls back only the most recent SQL statement in one of the involved transactions and returns ORA-00060. The entire transaction is NOT rolled back — earlier changes within the same transaction remain in effect.",
    errorNote: 'ORA-00060: deadlock detected while waiting for resource',
    appHandleDesc:
      'Upon receiving ORA-00060, the application must ROLLBACK the entire transaction or implement retry logic. Because only the single deadlocked statement was cancelled, continuing the transaction without a ROLLBACK can leave data in an inconsistent state.',
    preventTitle: 'Deadlock Prevention',
    preventItems: [
      'If multiple transactions modify the same set of rows, always access them in the same order. (In the example above, T1 accessed 100→200 while T2 accessed 200→100 — the opposite order caused the deadlock.)',
      'Avoid overusing explicit locks like LOCK TABLE ... IN EXCLUSIVE MODE.',
      'Keep transactions short and commit frequently to minimize lock hold time and deadlock potential.',
      'Consider using SELECT ... FOR UPDATE NOWAIT or SKIP LOCKED to avoid indefinite waiting.',
    ],
    rareTitle: 'Why Deadlocks Are Rare',
    rareDesc:
      "Oracle uses no read locks for queries (MVCC) and never escalates locks. Row-level (not page-level) locking minimizes lock contention. Most deadlocks trace back to application design issues — specifically, accessing the same rows in inconsistent order across transactions.",
    noWaitTitle: 'NOWAIT / SKIP LOCKED Options',
    noWaitDesc:
      'SELECT ... FOR UPDATE NOWAIT returns ORA-00054 immediately if the row is already locked, rather than waiting. SKIP LOCKED skips locked rows and processes only available ones. Both are useful for queue processing or batch jobs.',
  },
}

// 교착상태 다이어그램 (공식 문서 예시 기반)
const DeadlockDiagram = ({ lang }: { lang: 'ko' | 'en' }) => {
  const isKo = lang === 'ko'
  return (
    <svg
      viewBox="0 0 560 300"
      className="w-full max-w-xl mx-auto"
      aria-label="Deadlock diagram"
    >
      {/* T1 박스 */}
      <rect x="20" y="60" width="160" height="100" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
      <text x="100" y="82" fontSize="11" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        Transaction 1
      </text>
      <text x="100" y="100" fontSize="9" fill="#3b82f6" textAnchor="middle">
        {isKo ? 'EMP 100 락 보유 ✓' : 'Holds lock on EMP 100 ✓'}
      </text>
      <text x="100" y="116" fontSize="9" fill="#dc2626" textAnchor="middle">
        {isKo ? 'EMP 200 대기 중 ⏳' : 'Waiting for EMP 200 ⏳'}
      </text>
      <text x="100" y="132" fontSize="8" fill="#9ca3af" textAnchor="middle">
        {isKo ? '(T2가 보유 중)' : '(held by T2)'}
      </text>
      <text x="100" y="150" fontSize="8" fill="#9ca3af" textAnchor="middle">
        {isKo ? '→ ORA-00060 수신' : '→ receives ORA-00060'}
      </text>

      {/* T2 박스 */}
      <rect x="380" y="60" width="160" height="100" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
      <text x="460" y="82" fontSize="11" fill="#dc2626" textAnchor="middle" fontWeight="bold">
        Transaction 2
      </text>
      <text x="460" y="100" fontSize="9" fill="#ef4444" textAnchor="middle">
        {isKo ? 'EMP 200 락 보유 ✓' : 'Holds lock on EMP 200 ✓'}
      </text>
      <text x="460" y="116" fontSize="9" fill="#3b82f6" textAnchor="middle">
        {isKo ? 'EMP 100 대기 중 ⏳' : 'Waiting for EMP 100 ⏳'}
      </text>
      <text x="460" y="132" fontSize="8" fill="#9ca3af" textAnchor="middle">
        {isKo ? '(T1이 보유 중)' : '(held by T1)'}
      </text>
      <text x="460" y="150" fontSize="8" fill="#059669" textAnchor="middle">
        {isKo ? '→ 정상 진행 가능' : '→ can now proceed'}
      </text>

      {/* 순환 화살표 위 */}
      <path
        d="M180,90 C280,30 300,30 380,90"
        stroke="#f87171"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5,3"
        markerEnd="url(#dead-arr1)"
      />
      <text x="280" y="28" fontSize="8" fill="#dc2626" textAnchor="middle">
        {isKo ? 'T1이 T2의 EMP 200을 기다림' : "T1 waits for T2's EMP 200"}
      </text>

      {/* 순환 화살표 아래 */}
      <path
        d="M380,130 C300,180 280,180 180,130"
        stroke="#60a5fa"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5,3"
        markerEnd="url(#dead-arr2)"
      />
      <text x="280" y="196" fontSize="8" fill="#3b82f6" textAnchor="middle">
        {isKo ? 'T2가 T1의 EMP 100을 기다림' : "T2 waits for T1's EMP 100"}
      </text>

      {/* 해결 설명 박스 */}
      <rect x="140" y="215" width="280" height="70" rx="8" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
      <text x="280" y="234" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="bold">
        {isKo ? 'Oracle 자동 해결' : 'Oracle Auto-Resolution'}
      </text>
      <text x="280" y="250" fontSize="9" fill="#78350f" textAnchor="middle">
        {isKo ? 'T1의 마지막 SQL 문장만 롤백' : "T1's last SQL statement rolled back"}
      </text>
      <text x="280" y="264" fontSize="9" fill="#78350f" textAnchor="middle">
        {isKo ? '→ T1 이전 변경사항은 유지됨' : '→ T1 prior changes remain in effect'}
      </text>
      <text x="280" y="278" fontSize="9" fill="#d97706" textAnchor="middle" fontWeight="bold">
        ORA-00060: deadlock detected while waiting for resource
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
}

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

      <AccordionSection title={t.officialExampleTitle} defaultOpen>
        <Prose>{t.officialExampleDesc}</Prose>
        <div className="mt-4 space-y-2">
          {t.exampleSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  step.includes('ORA-00060') || step.includes('교착상태') || step.includes('Deadlock')
                    ? 'bg-red-100 text-red-600'
                    : step.includes('정상') || step.includes('proceed')
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 w-full max-w-xl mx-auto rounded-xl border border-red-100 bg-red-50/30 p-4">
          <DeadlockDiagram lang={lang} />
        </div>
      </AccordionSection>

      <Divider />

      <SectionTitle>{t.detectionTitle}</SectionTitle>
      <Prose>{t.detectionDesc}</Prose>

      <InfoBox variant="danger">
        <code className="font-mono text-xs">{t.errorNote}</code>
      </InfoBox>

      <Prose>{t.appHandleDesc}</Prose>

      <div className="mt-4">
        <SqlBlock
          sql={
            lang === 'ko'
              ? `-- ORA-00060 처리 예시 (PL/SQL)
BEGIN
  -- T1: EMP 100 먼저 업데이트
  UPDATE employees SET salary = 7000 WHERE employee_id = 100;
  -- T1: EMP 200 업데이트 시도 → T2와 교착상태 가능
  UPDATE employees SET salary = 8000 WHERE employee_id = 200;
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -60 THEN
      -- ORA-00060: 마지막 SQL만 롤백됨 → 전체 트랜잭션 롤백 필요
      ROLLBACK;
      -- 필요 시 재시도 로직 구현
    ELSE
      RAISE;
    END IF;
END;`
              : `-- ORA-00060 handling example (PL/SQL)
BEGIN
  -- T1: update EMP 100 first
  UPDATE employees SET salary = 7000 WHERE employee_id = 100;
  -- T1: attempt to update EMP 200 → possible deadlock with T2
  UPDATE employees SET salary = 8000 WHERE employee_id = 200;
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -60 THEN
      -- ORA-00060: only last SQL rolled back → must rollback entire transaction
      ROLLBACK;
      -- Implement retry logic if needed
    ELSE
      RAISE;
    END IF;
END;`
          }
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

      <AccordionSection title={t.noWaitTitle}>
        <Prose>{t.noWaitDesc}</Prose>
        <div className="mt-4">
          <SqlBlock
            sql={
              lang === 'ko'
                ? `-- NOWAIT: 행이 잠겨있으면 즉시 오류 반환
SELECT * FROM employees WHERE employee_id = 100 FOR UPDATE NOWAIT;
-- ORA-00054: resource busy and acquire with NOWAIT specified

-- SKIP LOCKED: 잠긴 행 건너뛰고 사용 가능한 행만 처리
SELECT * FROM job_queue
WHERE status = 'PENDING'
FOR UPDATE SKIP LOCKED
FETCH FIRST 10 ROWS ONLY;`
                : `-- NOWAIT: return error immediately if row is locked
SELECT * FROM employees WHERE employee_id = 100 FOR UPDATE NOWAIT;
-- ORA-00054: resource busy and acquire with NOWAIT specified

-- SKIP LOCKED: skip locked rows, process only available ones
SELECT * FROM job_queue
WHERE status = 'PENDING'
FOR UPDATE SKIP LOCKED
FETCH FIRST 10 ROWS ONLY;`
            }
          />
        </div>
      </AccordionSection>

      <div className="mt-8">
        <InfoBox variant="tip">
          <strong>{t.rareTitle}</strong>
          <br />
          {t.rareDesc}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
