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
  StepList,
} from '../../shared'
import { TxTimeline } from './TxTimeline'
import type { TxSession, TxStep } from './TxTimeline'

const T = {
  ko: {
    title: '교착상태(Deadlock)',
    subtitle:
      '두 트랜잭션이 서로의 락을 기다리며 꼼짝도 못하는 상황과 Oracle이 이를 어떻게 자동으로 해결하는지 알아봐요.',
    whatTitle: '교착상태가 뭐예요?',
    whatDesc:
      '교착상태(Deadlock)는 둘 이상의 사용자가 서로가 잠근 데이터를 기다리는 상황이에요. 트랜잭션 A가 행 1을 잠근 채 행 2를 기다리고, 동시에 트랜잭션 B가 행 2를 잠근 채 행 1을 기다리면 — 서로가 서로를 무한정 기다리는 순환 대기가 생겨요. 이것이 바로 교착상태예요.',
    officialExampleTitle: '공식 문서 예시 — EMP 100, EMP 200',
    officialExampleDesc:
      'Oracle 공식 문서의 교착상태 예시예요. 두 트랜잭션이 같은 행에 반대 순서로 접근할 때 교착상태가 발생해요.',
    exampleSteps: [
      'T1: employees(emp=100) UPDATE → 락 획득',
      'T2: employees(emp=200) UPDATE → 락 획득',
      'T1: employees(emp=200) UPDATE 시도 → T2가 끝날 때까지 대기 ⏳',
      'T2: employees(emp=100) UPDATE 시도 → T1이 끝날 때까지 대기 ⏳',
      '→ 교착상태 감지! T1의 마지막 문장이 롤백되고 ORA-00060 반환',
      'T2는 이제 T1의 락이 풀려서 정상 진행 가능',
    ],
    detectionTitle: 'Oracle의 자동 감지 및 해결',
    detectionDesc:
      'Oracle은 교착상태를 자동으로 감지해요. 교착상태가 감지되면 관여한 트랜잭션 중 하나의 가장 마지막 SQL 문장만 롤백하고 ORA-00060 오류를 반환해요. 트랜잭션 전체가 롤백되는 게 아니에요 — 오류를 받은 트랜잭션의 이전 변경사항은 그대로 유지돼요.',
    errorNote: 'ORA-00060: deadlock detected while waiting for resource',
    appHandleDesc:
      'ORA-00060을 받으면 애플리케이션은 반드시 트랜잭션 전체를 ROLLBACK 하거나, 작업을 재시도하는 로직을 구현해야 해요. ORA-00060이 발생한 단일 문장만 취소된 것이기 때문에, ROLLBACK 없이 트랜잭션을 계속하면 데이터가 일관성 없는 상태가 될 수 있어요.',
    preventTitle: '교착상태 예방하기',
    preventItems: [
      '여러 트랜잭션이 같은 행 집합을 수정한다면, 항상 동일한 순서로 행에 접근하도록 설계해요. (위 예시에서 T1은 100→200, T2는 200→100 역순으로 접근한 게 문제였어요.)',
      'LOCK TABLE ... IN EXCLUSIVE MODE 같은 명시적 잠금을 남용하지 않아요.',
      '트랜잭션을 짧게 유지하고 자주 COMMIT하면 락 보유 시간이 줄어서 교착상태 가능성이 낮아져요.',
      '필요하면 SELECT ... FOR UPDATE NOWAIT 또는 SKIP LOCKED를 사용해 무한 대기 없이 처리해요.',
    ],
    rareTitle: 'Oracle에서 교착상태가 드문 이유',
    rareDesc:
      'Oracle은 쿼리에서 읽기 락을 사용하지 않고(MVCC 덕분에), 락 에스컬레이션도 없어요. 페이지 수준이 아닌 행 수준으로만 잠그기 때문에 충돌 자체가 적어요. 교착상태는 대부분 애플리케이션 설계 문제(행 접근 순서 불일치)에서 비롯돼요.',
    noWaitTitle: 'NOWAIT / SKIP LOCKED 옵션',
    noWaitDesc:
      'SELECT ... FOR UPDATE NOWAIT는 행이 이미 잠겨있으면 기다리지 않고 즉시 ORA-00054를 반환해요. SKIP LOCKED는 잠긴 행을 건너뛰고 사용 가능한 행만 처리해요. 큐 처리나 배치 작업에 특히 유용해요.',
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

function DeadlockTimeline({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  const sessions: TxSession[] = [
    { id: 'Transaction 1', color: 'var(--color-blue)', bgColor: 'var(--color-rail)', borderColor: 'var(--color-blue)' },
    { id: 'Transaction 2', color: 'var(--color-red)', bgColor: 'var(--color-rail)', borderColor: 'var(--color-red)' },
  ]

  const steps: TxStep[] = [
    {
      kind: 'single', session: 'Transaction 1',
      label: 'UPDATE employees(emp=100)',
      sub: isKo ? '→ EMP 100 락 획득 ✓' : '→ acquires lock on EMP 100 ✓',
    },
    {
      kind: 'single', session: 'Transaction 2',
      label: 'UPDATE employees(emp=200)',
      sub: isKo ? '→ EMP 200 락 획득 ✓' : '→ acquires lock on EMP 200 ✓',
    },
    {
      kind: 'single', session: 'Transaction 1',
      label: isKo ? 'UPDATE employees(emp=200) 시도' : 'Attempts UPDATE employees(emp=200)',
      sub: isKo ? '→ T2가 보유 중 — 대기 ⏳' : '→ held by T2 — waiting ⏳',
      highlight: 'warn',
    },
    {
      kind: 'single', session: 'Transaction 2',
      label: isKo ? 'UPDATE employees(emp=100) 시도' : 'Attempts UPDATE employees(emp=100)',
      sub: isKo ? '→ T1이 보유 중 — 대기 ⏳' : '→ held by T1 — waiting ⏳',
      highlight: 'warn',
    },
    {
      kind: 'single', session: 'Transaction 1',
      label: isKo ? '교착상태 감지 → 마지막 SQL 롤백' : 'Deadlock detected → last SQL rolled back',
      sub: 'ORA-00060',
      highlight: 'error',
    },
    {
      kind: 'single', session: 'Transaction 2',
      label: isKo ? '대기 해제 → 정상 진행 가능' : 'Unblocked → can now proceed',
      sub: isKo ? '(T1의 EMP 100 락 해제됨)' : "(T1's EMP 100 lock released)",
      highlight: 'success',
    },
  ]

  const resultLabel = isKo
    ? 'Oracle 자동 해결: T1의 마지막 SQL만 롤백 — 이전 변경은 유지됨'
    : "Oracle auto-resolves: only T1's last SQL rolled back — prior changes remain"

  return (
    <div className="mt-4">
      <TxTimeline sessions={sessions} steps={steps} resultLabel={resultLabel} />
    </div>
  )
}

export function DeadlockSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconAlertTriangle size={36} stroke={1.5} className="text-red" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.officialExampleTitle}</SectionTitle>
      <Prose>{t.officialExampleDesc}</Prose>
      <DeadlockTimeline lang={lang} />

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
      <StepList steps={t.preventItems.map((item) => ({ title: item, desc: '' }))} />

      <Divider />

      <SectionTitle>{t.noWaitTitle}</SectionTitle>
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
