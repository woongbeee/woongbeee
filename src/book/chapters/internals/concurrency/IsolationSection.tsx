import { IconShieldCheck } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'
import { TxTimeline } from './TxTimeline'
import type { TxSession, TxStep } from './TxTimeline'

const T = {
  ko: {
    title: '트랜잭션 격리 수준',
    subtitle: 'ANSI/ISO SQL 표준의 격리 수준과 Oracle이 MVCC를 통해 이를 구현하는 방식을 알아봐요.',
    overviewTitle: '격리 수준이 뭐예요?',
    overviewDesc:
      'Oracle은 SQL92 표준의 격리 수준을 지원하고, MVCC(다중 버전 동시성 제어)를 활용해 높은 동시성을 유지하면서도 일관된 데이터를 제공해요. 격리 수준이 높아질수록 일관성은 강해지지만 동시성은 낮아질 수 있어요.',
    phenomena: '동시성 이상 현상 (Concurrency Anomalies)',
    phenomenaDesc:
      '각 격리 수준은 허용하는 이상 현상의 종류로 구분돼요. Oracle은 MVCC 덕분에 Dirty Read(미커밋 데이터 읽기)를 어느 격리 수준에서도 허용하지 않아요.',
    levelsTitle: 'Oracle의 격리 수준',
    readCommittedTitle: 'Read Committed — 기본값',
    readCommittedDesc:
      '트랜잭션이 실행하는 모든 쿼리는 쿼리가 시작되기 전에 커밋된 데이터만 읽어요 — 트랜잭션 시작 시점이 아닌 쿼리 시작 시점을 기준으로 해요. 같은 트랜잭션 안에서도 두 번째 SELECT 사이에 다른 트랜잭션이 커밋되면, 두 번째 SELECT에서 다른 결과가 나올 수 있어요(Non-Repeatable Read).',
    readCommittedConflictTitle: 'Read Committed에서 쓰기 충돌이 발생하면?',
    readCommittedConflictDesc:
      '두 세션이 같은 행을 수정하려 할 때 어떤 일이 벌어지는지 살펴봐요.',
    serializableTitle: 'Serializable',
    serializableDesc:
      '트랜잭션이 실행되는 내내 트랜잭션이 시작된 시점에 커밋된 데이터만 볼 수 있어요 — 마치 혼자 쓰는 것처럼 동작해요. 다른 트랜잭션이 같은 행을 변경·커밋한 뒤에 이 트랜잭션이 그 행을 바꾸려 하면 ORA-08177 오류가 발생해요.',
    serializableExampleTitle: 'Serializable에서 쓰기 충돌이 발생하면?',
    serializableExampleDesc:
      '트랜잭션 3이 Read Committed로 Hintz의 급여를 7100으로 변경하고 커밋해요. 트랜잭션 4는 Serializable로 시작한 뒤 Hintz를 수정하려 하는데, 트랜잭션 3이 트랜잭션 4 시작 이후에 커밋했으므로 ORA-08177이 발생해요.',
    readOnlyTitle: 'Read-Only',
    readOnlyDesc:
      'Serializable과 똑같은 일관성을 보장하지만, SYS를 제외한 데이터 변경이 불가능해요. 오래 걸리는 리포트 쿼리나 일관된 스냅샷이 필요한 조회 작업에 딱 맞아요. ORA-08177 오류의 영향도 받지 않아요.',
    lostUpdateTitle: 'Lost Update(갱신 손실) 문제',
    lostUpdateDesc:
      'Read Committed에서는 두 트랜잭션이 같은 행을 각자 읽고 수정하면 한쪽 변경이 사라질 수 있어요. 예를 들어 Session 1이 Banda의 급여를 7000으로 올렸더라도, Session 2가 나중에 6300으로 덮어쓰면 Session 1의 변경은 흔적도 없이 사라져요.',
    lostUpdateSolution:
      'SELECT ... FOR UPDATE로 먼저 행을 잠그거나, UPDATE의 WHERE 절에 원본 값을 포함해 낙관적 잠금(Optimistic Locking)을 구현하면 예방할 수 있어요.',
    throughputNote:
      '직렬화 격리 수준을 많은 애플리케이션에서 동시에 사용하면 처리량이 크게 떨어질 수 있어요. Oracle은 자동으로 가장 낮은 수준의 제한을 적용해, 동시성을 최대한 유지하면서도 데이터 무결성을 보장해요.',
  },
  en: {
    title: 'Transaction Isolation Levels',
    subtitle:
      'Explore the ANSI/ISO SQL isolation levels and how Oracle implements them through MVCC.',
    overviewTitle: 'What are Isolation Levels?',
    overviewDesc:
      "Oracle supports SQL92 isolation levels, using MVCC to maintain high concurrency while delivering consistent data. Higher isolation levels provide stronger consistency guarantees but may reduce concurrency.",
    phenomena: 'Concurrency Anomalies',
    phenomenaDesc:
      'Isolation levels are defined by the anomalies they permit. Oracle never allows dirty reads at any isolation level — MVCC prevents them entirely.',
    levelsTitle: "Oracle's Isolation Levels",
    readCommittedTitle: 'Read Committed (default)',
    readCommittedDesc:
      "Every query executed by a transaction sees only data committed before the query — not the transaction — began. Even within the same transaction, if another transaction commits between two SELECT statements, the second SELECT may return different results (Non-Repeatable Read).",
    readCommittedConflictTitle: 'Conflicting Writes in Read Committed',
    readCommittedConflictDesc:
      "What happens when two sessions try to modify the same row at the same time.",
    serializableTitle: 'Serializable',
    serializableDesc:
      "A serializable transaction sees only changes committed at the time the transaction — not the query — began. It operates in an environment that makes it appear as if no other users were modifying data in the database. If another transaction modifies and commits the same row after this transaction began, and this transaction then tries to modify that row, ORA-08177 is raised.",
    serializableExampleTitle: 'Conflicting Writes in Serializable',
    serializableExampleDesc:
      "Transaction 3 (READ COMMITTED) updates Hintz's salary to 7100 and commits. Transaction 4 (SERIALIZABLE) then tries to update Hintz — because Transaction 3 committed after Transaction 4 began, ORA-08177 is raised.",
    readOnlyTitle: 'Read-Only',
    readOnlyDesc:
      'Provides the same consistency guarantee as Serializable, but does not permit data modifications in the transaction (unless the user is SYS). Ideal for long-running reports or queries that need a stable snapshot. Not susceptible to ORA-08177.',
    lostUpdateTitle: 'Lost Update Problem',
    lostUpdateDesc:
      "In Read Committed, if two transactions each read and modify the same row, one update can be silently overwritten. In the Oracle docs example, even if Session 1 raises Banda's salary to 7000, Session 2's subsequent update to 6300 overwrites it — Session 1's change is lost.",
    lostUpdateSolution:
      'Use SELECT ... FOR UPDATE to lock the row first, or implement optimistic locking by including the original value in the UPDATE WHERE clause.',
    throughputNote:
      'Running many applications in serializable mode can seriously compromise throughput. Oracle automatically uses the lowest applicable level of restrictiveness to provide the highest degree of data concurrency yet also provide fail-safe data integrity.',
  },
}

function ReadCommittedConflictDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const sessions: TxSession[] = [
    { id: isKo ? 'Session A (READ COMMITTED)' : 'Session A (READ COMMITTED)', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
    { id: isKo ? 'Session B (READ COMMITTED)' : 'Session B (READ COMMITTED)', color: '#7c3aed', bgColor: '#f5f3ff', borderColor: '#ddd6fe' },
  ]
  const sA = sessions[0].id
  const sB = sessions[1].id
  const steps: TxStep[] = [
    { kind: 'banner', label: isKo ? '초기 상태: Banda.salary = 6200' : 'Initial state: Banda.salary = 6200' },
    { kind: 'single', session: sA, label: isKo ? 'UPDATE salary → 7000' : 'UPDATE salary → 7000', sub: isKo ? '(미커밋)' : '(uncommitted)' },
    { kind: 'single', session: sB, label: 'SELECT salary', sub: isKo ? '→ 6200 반환 (읽기 일관성)' : '→ returns 6200 (read consistency)' },
    { kind: 'single', session: sB, label: isKo ? 'UPDATE salary → 6300 시도' : 'UPDATE salary → 6300 (attempt)', sub: isKo ? '→ Session A 완료까지 대기 ⏳' : '→ blocks until Session A finishes ⏳', highlight: 'warn' },
    { kind: 'single', session: sA, label: 'COMMIT', sub: isKo ? '(salary = 7000 확정)' : '(salary = 7000 committed)', highlight: 'success' },
    { kind: 'single', session: sB, label: isKo ? 'UPDATE 재개: salary → 6300' : 'UPDATE resumes: salary → 6300', sub: isKo ? '(커밋된 7000 위에 덮어씀)' : '(overwrites committed 7000)', highlight: 'warn' },
    { kind: 'single', session: sB, label: 'COMMIT', sub: isKo ? '최종 salary = 6300' : 'Final salary = 6300', highlight: 'success' },
  ]
  return (
    <TxTimeline
      sessions={sessions}
      steps={steps}
      resultLabel={isKo ? 'Session A의 변경(7000)이 사라짐 — Lost Update 발생!' : "Session A's change (7000) is gone — Lost Update occurred!"}
    />
  )
}

function SerializableConflictDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const sessions: TxSession[] = [
    { id: isKo ? 'Transaction 3 (READ COMMITTED)' : 'Transaction 3 (READ COMMITTED)', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
    { id: isKo ? 'Transaction 4 (SERIALIZABLE)' : 'Transaction 4 (SERIALIZABLE)', color: '#7c3aed', bgColor: '#f5f3ff', borderColor: '#ddd6fe' },
  ]
  const s3 = sessions[0].id
  const s4 = sessions[1].id
  const steps: TxStep[] = [
    { kind: 'single', session: s4, label: isKo ? 'T4 시작 (SCN 기록)' : 'T4 begins (SCN recorded)' },
    { kind: 'single', session: s3, label: isKo ? 'Hintz.salary → 7100' : 'Hintz.salary → 7100', sub: isKo ? '(T4 시작 이후 커밋)' : '(commits after T4 began)' },
    { kind: 'single', session: s3, label: 'COMMIT', highlight: 'success' },
    { kind: 'single', session: s4, label: isKo ? 'Hintz.salary UPDATE 시도' : 'Attempts Hintz.salary UPDATE', sub: isKo ? '→ ORA-08177 발생!' : '→ ORA-08177 raised!', highlight: 'error' },
  ]
  return (
    <TxTimeline
      sessions={sessions}
      steps={steps}
      resultLabel="ORA-08177: cannot serialize access for this transaction"
    />
  )
}

export function IsolationSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconShieldCheck size={36} stroke={1.5} className="text-violet-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>

      <SectionTitle>{t.phenomena}</SectionTitle>
      <Prose>{t.phenomenaDesc}</Prose>
      <Table
        headers={[
          lang === 'ko' ? '현상' : 'Anomaly',
          lang === 'ko' ? '설명' : 'Description',
          'Read Uncommitted',
          'Read Committed',
          'Repeatable Read',
          'Serializable',
        ]}
        rows={
          lang === 'ko'
            ? [
                [
                  'Dirty Read',
                  '미커밋 데이터를 읽음',
                  '발생',
                  '없음 (MVCC)',
                  '없음 (MVCC)',
                  '없음 (MVCC)',
                ],
                [
                  'Non-Repeatable Read',
                  '같은 행을 두 번 읽으면 값이 다름',
                  '발생',
                  '발생',
                  '없음',
                  '없음',
                ],
                [
                  'Phantom Read',
                  '같은 조건으로 두 번 쿼리하면 행 수가 다름',
                  '발생',
                  '발생',
                  '발생',
                  '없음',
                ],
                [
                  'Lost Update',
                  '한 트랜잭션의 변경이 다른 트랜잭션에 덮임',
                  '발생',
                  '발생*',
                  '없음',
                  '없음',
                ],
              ]
            : [
                [
                  'Dirty Read',
                  'Reads uncommitted data',
                  'Possible',
                  'None (MVCC)',
                  'None (MVCC)',
                  'None (MVCC)',
                ],
                [
                  'Non-Repeatable Read',
                  'Same row returns different value on second read',
                  'Possible',
                  'Possible',
                  'None',
                  'None',
                ],
                [
                  'Phantom Read',
                  'Same query returns different row count',
                  'Possible',
                  'Possible',
                  'Possible',
                  'None',
                ],
                [
                  'Lost Update',
                  "One transaction's change is overwritten by another",
                  'Possible',
                  'Possible*',
                  'None',
                  'None',
                ],
              ]
        }
      />

      <Divider />

      <SectionTitle>{t.levelsTitle}</SectionTitle>

      <div className="space-y-4">
        {/* Read Committed */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-sm font-bold">{t.readCommittedTitle}</h3>
          <Prose>{t.readCommittedDesc}</Prose>
          <div className="mt-4">
            <SqlBlock
              sql={
                lang === 'ko'
                  ? `-- 기본값 — 별도 설정 필요 없음
-- 세션 수준으로 명시적 설정:
ALTER SESSION SET ISOLATION_LEVEL = READ COMMITTED;`
                  : `-- Default — no extra setup needed
-- Explicit session-level setting:
ALTER SESSION SET ISOLATION_LEVEL = READ COMMITTED;`
              }
            />
          </div>
          <p className="mt-6 mb-2 text-sm font-semibold text-foreground/80">
            {t.readCommittedConflictTitle}
          </p>
          <Prose>{t.readCommittedConflictDesc}</Prose>
          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/20 p-4">
            <ReadCommittedConflictDiagram lang={lang} />
          </div>
        </div>

        {/* Serializable */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-sm font-bold">{t.serializableTitle}</h3>
          <Prose>{t.serializableDesc}</Prose>
          <div className="mt-4">
            <SqlBlock
              sql={
                lang === 'ko'
                  ? `ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;
-- 또는 트랜잭션 단위로:
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 다른 트랜잭션이 같은 행을 수정·커밋한 뒤
-- 이 트랜잭션이 같은 행을 수정하려 하면:
-- ORA-08177: cannot serialize access for this transaction`
                  : `ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;
-- Or per-transaction:
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- If another transaction modifies and commits the same row
-- after this transaction began, and this transaction
-- then tries to modify it:
-- ORA-08177: cannot serialize access for this transaction`
              }
            />
          </div>
          <p className="mt-6 mb-2 text-sm font-semibold text-foreground/80">
            {t.serializableExampleTitle}
          </p>
          <Prose>{t.serializableExampleDesc}</Prose>
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/20 p-4">
            <SerializableConflictDiagram lang={lang} />
          </div>
        </div>

        {/* Read-Only */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-3 text-sm font-bold">{t.readOnlyTitle}</h3>
          <Prose>{t.readOnlyDesc}</Prose>
          <div className="mt-4">
            <SqlBlock sql="SET TRANSACTION READ ONLY;" />
          </div>
        </div>
      </div>

      <Divider />

      <InfoBox variant="warning">
        <strong>{t.lostUpdateTitle}</strong>
        <br />
        {t.lostUpdateDesc}
        <br />
        <span className="text-xs mt-1 block opacity-90">{t.lostUpdateSolution}</span>
      </InfoBox>

      <div className="mt-4">
        <SqlBlock
          sql={
            lang === 'ko'
              ? `-- Lost Update 방지: SELECT ... FOR UPDATE 사용
SELECT salary FROM employees WHERE employee_id = 100 FOR UPDATE;
-- 위 행이 잠기므로 다른 세션은 UPDATE 전에 대기해야 함
UPDATE employees SET salary = salary + 1000 WHERE employee_id = 100;
COMMIT;`
              : `-- Prevent Lost Update: use SELECT ... FOR UPDATE
SELECT salary FROM employees WHERE employee_id = 100 FOR UPDATE;
-- The row is locked; another session must wait before updating
UPDATE employees SET salary = salary + 1000 WHERE employee_id = 100;
COMMIT;`
          }
        />
      </div>

      <div className="mt-8">
        <InfoBox variant="note">
          {t.throughputNote}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
