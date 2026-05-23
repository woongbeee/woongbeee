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
  SqlBlock,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'COMMIT과 ROLLBACK',
    subtitle: '트랜잭션을 완료하거나 취소하는 두 가지 핵심 명령어입니다.',
    commitTitle: 'COMMIT — 변경 확정',
    commitDesc: 'COMMIT을 실행하면 Oracle은 아래 7단계를 원자적으로 수행합니다.',
    commitSteps: [
      { num: '①', title: 'SCN 생성', desc: '데이터베이스가 이 COMMIT에 대한 고유한 SCN(System Change Number)을 생성합니다.' },
      { num: '②', title: 'Transaction Table 기록', desc: '내부 트랜잭션 테이블에 해당 트랜잭션이 커밋됨을 SCN과 함께 표시합니다.' },
      { num: '③', title: 'Redo Log 기록 (LGWR)', desc: 'LGWR(Log Writer)가 Redo Log Buffer의 남은 항목을 온라인 리두 로그 파일에 기록하고 트랜잭션 SCN을 씁니다. 이 시점부터 지속성(Durability)이 보장됩니다.' },
      { num: '④', title: '락(Lock) 해제', desc: '트랜잭션이 보유한 모든 행·테이블 락이 해제됩니다. 다른 세션이 해당 행에 접근할 수 있게 됩니다.' },
      { num: '⑤', title: 'SAVEPOINT 삭제', desc: '트랜잭션 내 모든 SAVEPOINT가 삭제됩니다.' },
      { num: '⑥', title: 'Commit Cleanout', desc: '변경된 블록이 아직 SGA에 있다면, ITL(Interested Transaction List) 슬롯에서 락 관련 트랜잭션 정보를 제거합니다. 블록이 이미 디스크에 쓰여졌다면 나중에 읽을 때 처리됩니다.' },
      { num: '⑦', title: '트랜잭션 완료', desc: '트랜잭션이 완료 상태로 표시됩니다.' },
    ],
    commitNote:
      'COMMIT 자체는 데이터 블록을 디스크에 쓰지 않습니다. 변경된 블록(Dirty Buffer)은 DBWn(Database Writer) 프로세스가 나중에 비동기로 씁니다. COMMIT 속도는 변경된 데이터 크기와 무관하며, LGWR의 디스크 I/O가 주된 소요 시간입니다.',
    rollbackTitle: 'ROLLBACK — 변경 취소',
    rollbackDesc:
      'ROLLBACK을 실행하면 Oracle은 Undo Segment에 저장된 이전 이미지(Before Image)를 역순으로 읽어 변경을 복원합니다.',
    rollbackSteps: [
      { num: '①', title: 'Undo 데이터 역순 읽기', desc: 'Undo Segment의 변경 항목을 최신 것부터 역순으로 읽습니다.' },
      { num: '②', title: '각 작업 역전', desc: 'INSERT → DELETE 로 역전 / UPDATE → 원래 값으로 UPDATE / DELETE → INSERT 로 복원' },
      { num: '③', title: '락(Lock) 해제', desc: '트랜잭션이 보유한 모든 행·테이블 락이 해제됩니다.' },
      { num: '④', title: 'SAVEPOINT 삭제', desc: '트랜잭션 내 모든 SAVEPOINT가 삭제됩니다.' },
      { num: '⑤', title: '트랜잭션 종료', desc: '트랜잭션이 종료됩니다.' },
    ],
    rollbackNote:
      'ROLLBACK은 변경 규모에 비례해 시간이 걸립니다. 대량 변경 후 ROLLBACK은 오랜 시간이 소요될 수 있으므로, 작업 단위를 나눠 중간 COMMIT하는 패턴을 쓰기도 합니다.',
    setTxnTitle: 'SET TRANSACTION — 트랜잭션 속성 설정',
    setTxnDesc:
      'SET TRANSACTION 문은 트랜잭션의 첫 번째 문장으로 사용하며, 트랜잭션에 이름을 붙이거나 격리 수준을 설정하는 데 씁니다.\n\n트랜잭션 이름은 V$TRANSACTION 뷰에서 조회되고, LogMiner 검색과 Enterprise Manager 모니터링에 활용됩니다. 장기 실행 트랜잭션이나 분산 트랜잭션 문제 해결 시 특히 유용합니다.',
    autoCommitTitle: '자동 COMMIT이 발생하는 경우',
    autoCommitTable: [
      ['DDL 실행 (CREATE / DROP / ALTER 등)', 'DDL 앞뒤 DML도 함께 확정되므로 주의'],
      ['정상 세션 종료 (EXIT / QUIT)', '미완료 트랜잭션이 있으면 자동 COMMIT'],
      ['비정상 세션 종료 (접속 끊김)', '자동 ROLLBACK — COMMIT되지 않은 변경 취소'],
    ],
    autoCommitNote:
      'Oracle의 자동 커밋 동작은 클라이언트 도구(SQL*Plus, SQL Developer, JDBC 등)의 autocommit 설정에 따라 달라질 수 있습니다. DML 후 명시적 COMMIT을 습관화하는 것이 안전합니다.',
    autoTxnTitle: '자율 트랜잭션 (Autonomous Transaction)',
    autoTxnDesc:
      '자율 트랜잭션(Autonomous Transaction)은 다른 트랜잭션(메인 트랜잭션) 내에서 독립적으로 실행되는 트랜잭션입니다. PL/SQL 서브프로그램에 PRAGMA AUTONOMOUS_TRANSACTION 지시어를 선언해 사용합니다.\n\n자율 트랜잭션은 메인 트랜잭션의 커밋되지 않은 변경을 볼 수 없고, 독립적으로 락을 관리하며, COMMIT해도 메인 트랜잭션에 영향을 주지 않습니다. 자율 트랜잭션이 COMMIT하면 그 변경은 즉시 다른 세션에 보입니다.',
    autoTxnUseCase:
      '대표적인 사용 사례: 에러 로그 기록. 메인 트랜잭션이 롤백되더라도 디버그/감사 로그는 별도로 COMMIT되어 유지되어야 할 때 자율 트랜잭션을 사용합니다.',
    distTitle: '분산 트랜잭션과 2PC',
    distDesc:
      '분산 트랜잭션(Distributed Transaction)은 데이터베이스 링크를 통해 두 개 이상의 별도 데이터베이스 노드의 데이터를 변경하는 트랜잭션입니다. Oracle은 2단계 커밋(2PC — Two-Phase Commit) 프로토콜로 모든 노드가 원자적으로 COMMIT 또는 ROLLBACK되도록 보장합니다.\n\n2PC는 사용자에게 투명하게 동작합니다 — 일반 COMMIT 문장만 실행하면 됩니다.',
    distPhaseRows: [
      ['1단계 (Prepare)', '글로벌 코디네이터가 각 데이터베이스에 "커밋 준비됐나?" 라고 물음. 각 DB가 YES/NO로 응답'],
      ['2단계 (Commit/Rollback)', '모두 YES이면 COMMIT 브로드캐스트, 하나라도 NO이면 ROLLBACK 브로드캐스트'],
      ['In-Doubt 트랜잭션', '2PC 도중 장애 발생 시 해결 대기 상태가 됨. RECO 백그라운드 프로세스가 자동 복구'],
    ],
  },
  en: {
    title: 'COMMIT and ROLLBACK',
    subtitle: 'The two fundamental commands that end a transaction by confirming or cancelling all its changes.',
    commitTitle: 'COMMIT — Confirm Changes',
    commitDesc: 'When you issue COMMIT, Oracle executes the following 7 steps atomically.',
    commitSteps: [
      { num: '①', title: 'Generate SCN', desc: 'The database generates a unique SCN (System Change Number) for this COMMIT.' },
      { num: '②', title: 'Record in Transaction Table', desc: 'The internal transaction table marks this transaction as committed with its SCN.' },
      { num: '③', title: 'Write to Redo Log (LGWR)', desc: 'LGWR (Log Writer) flushes remaining redo entries from the Redo Log Buffer to the online redo log files and records the transaction SCN. Durability is guaranteed from this point.' },
      { num: '④', title: 'Release Locks', desc: 'All row and table locks held by the transaction are released. Other sessions can now access the affected rows.' },
      { num: '⑤', title: 'Delete Savepoints', desc: 'All savepoints within the transaction are erased.' },
      { num: '⑥', title: 'Commit Cleanout', desc: 'If modified blocks are still in the SGA, Oracle removes lock-related transaction information (ITL entry) from each block. If blocks were already written to disk, this cleanup happens when they are next read.' },
      { num: '⑦', title: 'Mark Complete', desc: 'The transaction is marked as complete.' },
    ],
    commitNote:
      'COMMIT does not itself write data blocks to disk. Dirty buffers (modified blocks) are written asynchronously later by the DBWn (Database Writer) process. COMMIT speed is independent of the volume of changed data — LGWR disk I/O is the primary latency.',
    rollbackTitle: 'ROLLBACK — Undo Changes',
    rollbackDesc:
      'When you issue ROLLBACK, Oracle reads the before-images stored in the Undo Segment in reverse order to restore each change.',
    rollbackSteps: [
      { num: '①', title: 'Read Undo Data in Reverse', desc: 'Undo Segment entries are read from newest to oldest.' },
      { num: '②', title: 'Reverse Each Operation', desc: 'INSERT → reversed as DELETE / UPDATE → re-applied with original values / DELETE → reversed as INSERT' },
      { num: '③', title: 'Release Locks', desc: 'All row and table locks held by the transaction are released.' },
      { num: '④', title: 'Delete Savepoints', desc: 'All savepoints within the transaction are erased.' },
      { num: '⑤', title: 'End Transaction', desc: 'The transaction is terminated.' },
    ],
    rollbackNote:
      'Rollback time is proportional to the volume of changes. Rolling back a large transaction can take a long time, so some patterns use intermediate COMMITs on smaller batches.',
    setTxnTitle: 'SET TRANSACTION — Setting Transaction Properties',
    setTxnDesc:
      'SET TRANSACTION must be the first statement in a transaction. It lets you assign a name to the transaction or configure its isolation level.\n\nTransaction names appear in V$TRANSACTION, LogMiner search records, and Enterprise Manager monitoring. They are especially useful for tracking long-running transactions or resolving in-doubt distributed transactions.',
    autoCommitTitle: 'When Implicit COMMIT Occurs',
    autoCommitTable: [
      ['DDL execution (CREATE / DROP / ALTER, etc.)', 'Pending DML before and after the DDL is also committed — beware'],
      ['Normal session exit (EXIT / QUIT)', 'Any uncommitted transaction is automatically committed'],
      ['Abnormal session disconnect (connection drop)', 'Automatic ROLLBACK — uncommitted changes are discarded'],
    ],
    autoCommitNote:
      "Oracle's implicit commit behavior can also be affected by client-tool autocommit settings (SQL*Plus, SQL Developer, JDBC, etc.). Always issue an explicit COMMIT after DML to be safe.",
    autoTxnTitle: 'Autonomous Transactions',
    autoTxnDesc:
      'An autonomous transaction is an independent transaction called from within another transaction (the main transaction). It is declared using the PRAGMA AUTONOMOUS_TRANSACTION directive in a PL/SQL subprogram.\n\nAn autonomous transaction cannot see uncommitted changes from the main transaction, manages its own locks independently, and its COMMIT does not affect the main transaction. When an autonomous transaction commits, its changes become immediately visible to other sessions.',
    autoTxnUseCase:
      'A common use case is error logging: even if the main transaction rolls back, the debug or audit log written by an autonomous transaction is preserved because it commits independently.',
    distTitle: 'Distributed Transactions and Two-Phase Commit',
    distDesc:
      'A distributed transaction updates data on two or more distinct database nodes via database links. Oracle uses the Two-Phase Commit (2PC) protocol to guarantee that all nodes atomically COMMIT or ROLLBACK together.\n\n2PC is transparent to users — simply issuing a COMMIT triggers the protocol automatically.',
    distPhaseRows: [
      ['Phase 1 (Prepare)', 'Global coordinator asks each database: "Ready to commit?" Each responds YES or NO'],
      ['Phase 2 (Commit/Rollback)', 'If all YES: COMMIT broadcast to all; if any NO: ROLLBACK broadcast to all'],
      ['In-Doubt Transactions', 'If failure occurs mid-2PC, the transaction is left in-doubt. RECO background process automatically resolves it when communication is restored'],
    ],
  },
}

const stepColors = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-slate-500',
]

function StepList({ steps }: { steps: { num: string; title: string; desc: string }[] }) {
  return (
    <div className="flex flex-col gap-3 my-4">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className={cn(
            'shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-black text-white',
            stepColors[i % stepColors.length]
          )}>
            {i + 1}
          </span>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 flex-1 shadow-sm">
            <p className="font-mono text-[11px] font-bold text-slate-700">{s.title}</p>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TransactionCommitRollbackSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconHistory size={36} stroke={1.5} className="text-emerald-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.commitTitle}</SectionTitle>
      <Prose>{t.commitDesc}</Prose>
      <StepList steps={t.commitSteps} />
      <SqlBlock
        sql={isKo
          ? `-- 트랜잭션에 이름을 붙인 뒤 COMMIT\nSET TRANSACTION NAME 'sal_update2';\nUPDATE employees SET salary = 7050 WHERE last_name = 'Banda';\nUPDATE employees SET salary = 10950 WHERE last_name = 'Greene';\nCOMMIT; -- 위 7단계가 원자적으로 실행됨`
          : `-- Named transaction COMMIT\nSET TRANSACTION NAME 'sal_update2';\nUPDATE employees SET salary = 7050 WHERE last_name = 'Banda';\nUPDATE employees SET salary = 10950 WHERE last_name = 'Greene';\nCOMMIT; -- all 7 steps execute atomically`}
      />
      <InfoBox variant="note">{t.commitNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.rollbackTitle}</SectionTitle>
      <Prose>{t.rollbackDesc}</Prose>
      <StepList steps={t.rollbackSteps} />
      <SqlBlock
        sql={isKo
          ? `-- 변경 취소\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK; -- 두 UPDATE 모두 취소, SAVEPOINT도 삭제, 락 해제`
          : `-- Undo all changes\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK; -- both UPDATEs reversed, savepoint erased, locks released`}
      />
      <InfoBox variant="warning">{t.rollbackNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.autoCommitTitle}</SectionTitle>
      <Table
        headers={isKo ? ['상황', '동작'] : ['Situation', 'Behaviour']}
        rows={t.autoCommitTable}
      />
      <InfoBox variant="warning">{t.autoCommitNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.setTxnTitle}</SectionTitle>
      <Prose>{t.setTxnDesc}</Prose>
      <div className="mt-4">
        <SqlBlock
          sql={isKo
            ? `-- SET TRANSACTION은 트랜잭션의 첫 번째 문장이어야 함\nSET TRANSACTION NAME 'sal_update';\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK TO SAVEPOINT after_banda;\nUPDATE employees SET salary = 11000 WHERE last_name = 'Greene';\nCOMMIT;\n\n-- V$TRANSACTION 에서 이름으로 조회\nSELECT XID, STATUS FROM V$TRANSACTION WHERE NAME = 'sal_update';`
            : `-- SET TRANSACTION must be the first statement in the transaction\nSET TRANSACTION NAME 'sal_update';\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK TO SAVEPOINT after_banda;\nUPDATE employees SET salary = 11000 WHERE last_name = 'Greene';\nCOMMIT;\n\n-- Find the transaction by name in V$TRANSACTION\nSELECT XID, STATUS FROM V$TRANSACTION WHERE NAME = 'sal_update';`}
        />
      </div>

      <Divider />

      <SectionTitle>{t.autoTxnTitle}</SectionTitle>
      <Prose>{t.autoTxnDesc}</Prose>
      <InfoBox variant="tip">{t.autoTxnUseCase}</InfoBox>
      <div className="mt-4">
        <SqlBlock
          sql={isKo
            ? `-- 자율 트랜잭션 선언 예시 (에러 로그)\nCREATE OR REPLACE PROCEDURE log_error(msg VARCHAR2) AS\n  PRAGMA AUTONOMOUS_TRANSACTION;\nBEGIN\n  INSERT INTO error_log (log_time, message)\n  VALUES (SYSDATE, msg);\n  COMMIT; -- 메인 트랜잭션에 영향 없이 독립적으로 커밋\nEND;\n/\n\n-- 호출 예시: 메인 트랜잭션이 롤백되어도 로그는 유지됨\nBEGIN\n  UPDATE accounts SET balance = balance - 500 WHERE id = 3209;\n  log_error('debit processed');\n  ROLLBACK; -- 메인 작업 취소, 하지만 log_error의 INSERT는 이미 커밋됨\nEND;`
            : `-- Autonomous transaction declaration example (error logging)\nCREATE OR REPLACE PROCEDURE log_error(msg VARCHAR2) AS\n  PRAGMA AUTONOMOUS_TRANSACTION;\nBEGIN\n  INSERT INTO error_log (log_time, message)\n  VALUES (SYSDATE, msg);\n  COMMIT; -- commits independently, not affecting the main transaction\nEND;\n/\n\n-- Usage: even if the main transaction rolls back, the log is preserved\nBEGIN\n  UPDATE accounts SET balance = balance - 500 WHERE id = 3209;\n  log_error('debit processed');\n  ROLLBACK; -- undoes the main work, but log_error's INSERT was already committed\nEND;`}
        />
      </div>

      <Divider />

      <SectionTitle>{t.distTitle}</SectionTitle>
      <Prose>{t.distDesc}</Prose>
      <Table
        headers={isKo ? ['단계', '설명'] : ['Phase', 'Description']}
        rows={t.distPhaseRows}
      />
    </PageContainer>
  )
}
