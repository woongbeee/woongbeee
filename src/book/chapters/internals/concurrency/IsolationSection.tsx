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
  AccordionSection,
  SqlBlock,
} from '../../shared'

const T = {
  ko: {
    title: '트랜잭션 격리 수준',
    subtitle: 'ANSI/ISO SQL 표준의 4가지 격리 수준과 Oracle이 이를 구현하는 방식을 살펴봅니다.',
    phenomena: '동시성 문제 현상',
    phenomenaDesc: '격리 수준마다 허용하는 부작용이 다릅니다.',
    levelsTitle: 'Oracle의 격리 수준',
    readCommittedTitle: 'Read Committed (기본값)',
    readCommittedDesc:
      '모든 쿼리는 쿼리가 시작된 시점에 커밋된 데이터만 봅니다. 같은 트랜잭션 내에서도 두 번의 SELECT 사이에 다른 트랜잭션이 커밋하면, 두 번째 SELECT에서 다른 결과가 나올 수 있습니다(Non-Repeatable Read).',
    serializableTitle: 'Serializable',
    serializableDesc:
      '트랜잭션이 시작된 시점에 커밋된 데이터만 봅니다. 마치 다른 사용자가 없는 것처럼 동작합니다. 다른 트랜잭션이 동일 행을 변경하고 커밋한 후 이 트랜잭션이 같은 행을 변경하려 하면 ORA-08177 오류가 발생합니다.',
    readOnlyTitle: 'Read-Only',
    readOnlyDesc:
      'Serializable과 동일한 일관성 보장을 제공하지만, 데이터 변경이 불가합니다. 장기 리포트 쿼리나 일관된 스냅샷이 필요한 조회 작업에 적합합니다.',
    lostUpdateTitle: 'Lost Update 문제',
    lostUpdateDesc:
      'Read Committed에서는 두 트랜잭션이 같은 행을 각자 읽고 수정하면 한쪽 변경이 사라질 수 있습니다. 애플리케이션에서 SELECT ... FOR UPDATE로 잠금 후 수정하거나, UPDATE 시 WHERE 절에 원본 값을 포함하는 방식으로 방지해야 합니다.',
  },
  en: {
    title: 'Transaction Isolation Levels',
    subtitle: 'Explore the four ANSI/ISO SQL isolation levels and how Oracle implements them.',
    phenomena: 'Concurrency Anomalies',
    phenomenaDesc: 'Each isolation level permits different side effects.',
    levelsTitle: "Oracle's Isolation Levels",
    readCommittedTitle: 'Read Committed (default)',
    readCommittedDesc:
      'Every query sees only data committed before the query started. Even within the same transaction, if another transaction commits between two SELECT statements, the second SELECT may return different results (Non-Repeatable Read).',
    serializableTitle: 'Serializable',
    serializableDesc:
      'Sees only data committed when the transaction began — as if no other users exist. If another transaction modifies and commits the same row, and this transaction then tries to modify it, ORA-08177 is raised.',
    readOnlyTitle: 'Read-Only',
    readOnlyDesc:
      'Provides the same consistency guarantee as Serializable, but data modification is not allowed. Ideal for long-running reports or queries that need a stable snapshot.',
    lostUpdateTitle: 'Lost Update Problem',
    lostUpdateDesc:
      'In Read Committed, if two transactions each read and modify the same row, one update can be silently overwritten. Prevent this by using SELECT ... FOR UPDATE before modifying, or by including the original value in the UPDATE WHERE clause.',
  },
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
        rows={lang === 'ko' ? [
          ['Dirty Read', '미커밋 데이터를 읽음', '발생', '없음', '없음', '없음'],
          ['Non-Repeatable Read', '같은 행을 두 번 읽으면 값이 다름', '발생', '발생', '없음', '없음'],
          ['Phantom Read', '같은 조건으로 두 번 쿼리하면 행 수가 다름', '발생', '발생', '발생', '없음'],
          ['Lost Update', '한 트랜잭션의 변경이 다른 트랜잭션에 덮임', '발생', '발생*', '없음', '없음'],
        ] : [
          ['Dirty Read', 'Reads uncommitted data', 'Possible', 'None', 'None', 'None'],
          ['Non-Repeatable Read', 'Same row returns different value on second read', 'Possible', 'Possible', 'None', 'None'],
          ['Phantom Read', 'Same query returns different row count', 'Possible', 'Possible', 'Possible', 'None'],
          ['Lost Update', "One transaction's change is overwritten by another", 'Possible', 'Possible*', 'None', 'None'],
        ]}
      />

      <Divider />

      <SectionTitle>{t.levelsTitle}</SectionTitle>

      <AccordionSection title={t.readCommittedTitle} defaultOpen>
        <Prose>{t.readCommittedDesc}</Prose>
        <div className="mt-4">
          <SqlBlock
            sql={lang === 'ko' ? `-- 기본값 — 별도 설정 필요 없음
-- 세션 수준으로 변경 시:
ALTER SESSION SET ISOLATION_LEVEL = READ COMMITTED;` : `-- Default — no extra setup needed
-- To set at session level:
ALTER SESSION SET ISOLATION_LEVEL = READ COMMITTED;`}
          />
        </div>
      </AccordionSection>

      <AccordionSection title={t.serializableTitle}>
        <Prose>{t.serializableDesc}</Prose>
        <div className="mt-4">
          <SqlBlock
            sql={lang === 'ko' ? `ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;

-- 다른 트랜잭션이 같은 행을 수정·커밋한 뒤 이 트랜잭션이
-- 같은 행을 수정하려 하면:
-- ORA-08177: cannot serialize access for this transaction` : `ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;

-- If another transaction modifies and commits the same row
-- and this transaction then tries to modify it:
-- ORA-08177: cannot serialize access for this transaction`}
          />
        </div>
      </AccordionSection>

      <AccordionSection title={t.readOnlyTitle}>
        <Prose>{t.readOnlyDesc}</Prose>
        <div className="mt-4">
          <SqlBlock sql="SET TRANSACTION READ ONLY;" />
        </div>
      </AccordionSection>

      <Divider />

      <InfoBox variant="warning">
        <strong>{t.lostUpdateTitle}</strong>
        <br />
        {t.lostUpdateDesc}
      </InfoBox>

      <div className="mt-4">
        <SqlBlock
          sql={lang === 'ko' ? `-- Lost Update 방지: SELECT ... FOR UPDATE 사용
SELECT salary FROM employees WHERE employee_id = 100 FOR UPDATE;
-- 위 행이 잠기므로 다른 세션은 UPDATE 전에 대기해야 함
UPDATE employees SET salary = 7000 WHERE employee_id = 100;
COMMIT;` : `-- Prevent Lost Update: use SELECT ... FOR UPDATE
SELECT salary FROM employees WHERE employee_id = 100 FOR UPDATE;
-- The row is locked; another session must wait before updating
UPDATE employees SET salary = 7000 WHERE employee_id = 100;
COMMIT;`}
        />
      </div>
    </PageContainer>
  )
}
