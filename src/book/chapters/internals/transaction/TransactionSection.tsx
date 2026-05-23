import { useState } from 'react'
import {
  IconRefresh,
  IconShieldCheck,
  IconHistory,
  IconFlag,
} from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  ConceptGrid,
  SqlBlock,
  AccordionSection,
} from '../../shared'
import { cn } from '@/lib/utils'

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    // Overview
    overviewTitle: '트랜잭션(Transaction)',
    overviewSubtitle:
      '트랜잭션은 Oracle이 데이터를 안전하게 변경하는 논리적 작업 단위입니다. 여러 SQL 문장이 모두 성공하거나, 하나라도 실패하면 전부 취소됩니다.',
    overviewConcepts: '트랜잭션의 핵심 특성',
    overviewConceptItems: [
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

    // XID
    xidTitle: 'XID — 트랜잭션 식별자',
    xidDesc:
      'Oracle은 트랜잭션 시작 시(첫 DML 실행 시점) Undo Segment에 슬롯을 할당하고, 해당 슬롯을 식별하는 XID(Transaction ID)를 부여합니다.\n\nXID는 세 숫자의 조합입니다:  Undo Segment 번호(USN) | 슬롯 번호 | 시퀀스 번호. 이 세 값이 합쳐져 데이터베이스 전체에서 고유한 트랜잭션 ID를 구성합니다.',
    xidNote:
      'XID는 파싱(Parse) 시점이 아니라 첫 번째 DML 실행 시 할당됩니다. V$TRANSACTION 뷰로 현재 활성 트랜잭션의 XID와 상태를 조회할 수 있습니다.',

    // Transaction active state table
    activeStateTitle: '트랜잭션 활성 상태에서 Oracle이 유지하는 정보',
    activeStateRows: [
      ['Undo 데이터 생성', 'SGA에 SQL 문장이 변경한 이전 값(Before Image)이 보관됨'],
      ['Redo 생성', 'Redo Log Buffer에 데이터 블록과 Undo 블록의 변경 내역이 기록됨'],
      ['버퍼 수정', 'SGA Buffer Cache의 블록이 변경됨 (디스크 쓰기 시점은 COMMIT와 무관)'],
      ['행 잠금(Lock)', '다른 세션은 잠긴 행을 변경할 수 없으며, 커밋 전 변경 내용도 볼 수 없음'],
    ],

    // lifecycle
    lifecycleTitle: '트랜잭션 생명주기',
    lifecycleDesc: '트랜잭션은 첫 DML 실행 시 시작되어 COMMIT/ROLLBACK 또는 DDL 실행 시 종료됩니다.',

    // Lifecycle end conditions
    lifecycleEndTitle: '트랜잭션이 종료되는 경우',
    lifecycleEndRows: [
      ['COMMIT 또는 ROLLBACK 실행', '명시적 종료 — 가장 일반적인 방법'],
      ['DDL 문장 실행 (CREATE / DROP / ALTER)', 'DDL 앞뒤로 암묵적 COMMIT 발생'],
      ['정상 세션 종료 (EXIT / QUIT)', '미완료 트랜잭션 자동 COMMIT'],
      ['비정상 세션 종료 (접속 끊김)', '자동 ROLLBACK — 커밋되지 않은 변경 취소'],
    ],

    // ACID
    acidTitle: 'ACID 속성',
    acidSubtitle: '트랜잭션이 데이터 무결성을 보장하기 위해 반드시 만족해야 하는 네 가지 속성입니다.',
    acidAtomicityDetail: '문장 수준 원자성(Statement-Level Atomicity)과 트랜잭션 수준 원자성이 구분됩니다. 하나의 SQL 문장이 실패하면 그 문장의 변경만 자동 롤백되며, 그 앞의 문장은 유지됩니다. 단, 파싱(구문 분석) 오류는 문장 수준 롤백을 발생시키지 않습니다 — 데드락이나 제약 조건 위반은 문장 수준 롤백을 발생시킵니다. COMMIT 전 장애 시 Oracle이 자동 ROLLBACK을 수행해 모든 변경을 취소합니다. Undo Segment가 이 역할을 담당합니다.',
    acidItems: [
      {
        letter: 'A',
        name: '원자성 (Atomicity)',
        nameEn: 'Atomicity',
        desc: '트랜잭션 내 모든 작업은 전부 성공하거나 전부 실패합니다. 중간 상태는 존재하지 않습니다.',
        detail:
          'COMMIT 전에 오류가 발생하면 Oracle은 자동으로 ROLLBACK을 수행해 변경을 모두 취소합니다. Undo Segment가 이 역할을 담당합니다.\n\n문장 수준 원자성(Statement-Level Atomicity): 개별 SQL 문장도 원자 단위입니다. 하나의 UPDATE가 실패해도 그 이전 UPDATE의 변경은 유지되며, 실패한 UPDATE의 변경만 자동 롤백됩니다.',
        color: 'blue',
      },
      {
        letter: 'C',
        name: '일관성 (Consistency)',
        nameEn: 'Consistency',
        desc: '트랜잭션 전후로 데이터베이스는 항상 유효한 상태(제약 조건 만족)를 유지합니다.',
        detail:
          'PRIMARY KEY, FOREIGN KEY, NOT NULL 같은 제약 조건은 COMMIT 시점에 검증됩니다. 위반이 있으면 트랜잭션이 롤백됩니다.',
        color: 'emerald',
      },
      {
        letter: 'I',
        name: '격리성 (Isolation)',
        nameEn: 'Isolation',
        desc: '실행 중인 트랜잭션의 중간 결과는 다른 트랜잭션에게 보이지 않습니다.',
        detail:
          'Oracle은 MVCC(Multi Version Concurrency Control)로 이를 구현합니다. 다른 세션이 커밋되지 않은 변경을 읽으려 하면, Undo Segment에서 이전 버전 데이터를 재구성해 반환합니다. SCN(System Change Number)이 각 이벤트의 논리적 순서를 결정합니다.',
        color: 'violet',
      },
      {
        letter: 'D',
        name: '지속성 (Durability)',
        nameEn: 'Durability',
        desc: 'COMMIT된 트랜잭션의 변경은 시스템 장애가 발생해도 유지됩니다.',
        detail:
          'LGWR(Log Writer) 프로세스가 COMMIT 시점에 Redo Log Buffer를 온라인 리두 로그 파일에 즉시 기록합니다. 인스턴스가 충돌해도 이 파일로 변경을 복구할 수 있습니다. COMMIT 자체의 속도는 트랜잭션 크기와 무관하며, LGWR의 디스크 I/O 시간이 주된 소요 시간입니다.',
        color: 'orange',
      },
    ],

    // SCN
    scnTitle: 'SCN (System Change Number)',
    scnDesc:
      'SCN은 데이터베이스 이벤트를 순서화하는 논리적 타임스탬프입니다. 단조 증가하는 숫자로, SCN이 낮을수록 더 이른 사건입니다. 여러 이벤트가 동시에 발생하면 같은 SCN을 공유할 수 있습니다.\n\nOracle은 트랜잭션이 데이터를 변경할 때 SCN을 Undo Segment에 기록하고, COMMIT 시 LGWR이 SCN을 온라인 리두 로그에 기록합니다. 이 SCN이 인스턴스 복구와 미디어 복구의 기준점이 됩니다.',

    // COMMIT / ROLLBACK
    crTitle: 'COMMIT과 ROLLBACK',
    crSubtitle: '트랜잭션을 완료하거나 취소하는 두 가지 핵심 명령어입니다.',
    crCommitTitle: 'COMMIT — 변경 확정',
    crCommitDesc:
      'COMMIT을 실행하면 Oracle은 아래 7단계를 원자적으로 수행합니다.',
    crCommitSteps: [
      { num: '①', title: 'SCN 생성', desc: '데이터베이스가 이 COMMIT에 대한 고유한 SCN(System Change Number)을 생성합니다.' },
      { num: '②', title: 'Transaction Table 기록', desc: '내부 트랜잭션 테이블에 해당 트랜잭션이 커밋됨을 SCN과 함께 표시합니다.' },
      { num: '③', title: 'Redo Log 기록 (LGWR)', desc: 'LGWR(Log Writer)가 Redo Log Buffer의 남은 항목을 온라인 리두 로그 파일에 기록하고 트랜잭션 SCN을 씁니다. 이 시점부터 지속성(Durability)이 보장됩니다.' },
      { num: '④', title: '락(Lock) 해제', desc: '트랜잭션이 보유한 모든 행·테이블 락이 해제됩니다. 다른 세션이 해당 행에 접근할 수 있게 됩니다.' },
      { num: '⑤', title: 'SAVEPOINT 삭제', desc: '트랜잭션 내 모든 SAVEPOINT가 삭제됩니다.' },
      { num: '⑥', title: 'Commit Cleanout', desc: '변경된 블록이 아직 SGA에 있다면, ITL(Interested Transaction List) 슬롯에서 락 관련 트랜잭션 정보를 제거합니다. 블록이 이미 디스크에 쓰여졌다면 나중에 읽을 때 처리됩니다.' },
      { num: '⑦', title: '트랜잭션 완료', desc: '트랜잭션이 완료 상태로 표시됩니다.' },
    ],
    crCommitNote:
      'COMMIT 자체는 데이터 블록을 디스크에 쓰지 않습니다. 변경된 블록(Dirty Buffer)은 DBWn(Database Writer) 프로세스가 나중에 비동기로 씁니다. COMMIT 속도는 변경된 데이터 크기와 무관하며, LGWR의 디스크 I/O가 주된 소요 시간입니다.',
    crRollbackTitle: 'ROLLBACK — 변경 취소',
    crRollbackDesc:
      'ROLLBACK을 실행하면 Oracle은 Undo Segment에 저장된 이전 이미지(Before Image)를 역순으로 읽어 변경을 복원합니다.',
    crRollbackSteps: [
      { num: '①', title: 'Undo 데이터 역순 읽기', desc: 'Undo Segment의 변경 항목을 최신 것부터 역순으로 읽습니다.' },
      { num: '②', title: '각 작업 역전', desc: 'INSERT → DELETE 로 역전 / UPDATE → 원래 값으로 UPDATE / DELETE → INSERT 로 복원' },
      { num: '③', title: '락(Lock) 해제', desc: '트랜잭션이 보유한 모든 행·테이블 락이 해제됩니다.' },
      { num: '④', title: 'SAVEPOINT 삭제', desc: '트랜잭션 내 모든 SAVEPOINT가 삭제됩니다.' },
      { num: '⑤', title: '트랜잭션 종료', desc: '트랜잭션이 종료됩니다.' },
    ],
    crRollbackNote:
      'ROLLBACK은 변경 규모에 비례해 시간이 걸립니다. 대량 변경 후 ROLLBACK은 오랜 시간이 소요될 수 있으므로, 작업 단위를 나눠 중간 COMMIT하는 패턴을 쓰기도 합니다.',
    crAutoCommit: '자동 COMMIT이 발생하는 경우',
    crAutoCommitTable: [
      ['DDL 실행 (CREATE / DROP / ALTER 등)', 'DDL 앞뒤 DML도 함께 확정되므로 주의'],
      ['정상 세션 종료 (EXIT / QUIT)', '미완료 트랜잭션이 있으면 자동 COMMIT'],
      ['비정상 세션 종료 (접속 끊김)', '자동 ROLLBACK — COMMIT되지 않은 변경 취소'],
    ],
    crNote:
      'Oracle의 자동 커밋 동작은 클라이언트 도구(SQL*Plus, SQL Developer, JDBC 등)의 autocommit 설정에 따라 달라질 수 있습니다. DML 후 명시적 COMMIT을 습관화하는 것이 안전합니다.',

    // SET TRANSACTION
    setTxnTitle: 'SET TRANSACTION — 트랜잭션 속성 설정',
    setTxnDesc:
      'SET TRANSACTION 문은 트랜잭션의 첫 번째 문장으로 사용하며, 트랜잭션에 이름을 붙이거나 격리 수준을 설정하는 데 씁니다.\n\n트랜잭션 이름은 V$TRANSACTION 뷰에서 조회되고, LogMiner 검색과 Enterprise Manager 모니터링에 활용됩니다. 장기 실행 트랜잭션이나 분산 트랜잭션 문제 해결 시 특히 유용합니다.',

    // Autonomous transactions
    autoTxnTitle: '자율 트랜잭션 (Autonomous Transaction)',
    autoTxnDesc:
      '자율 트랜잭션(Autonomous Transaction)은 다른 트랜잭션(메인 트랜잭션) 내에서 독립적으로 실행되는 트랜잭션입니다. PL/SQL 서브프로그램에 PRAGMA AUTONOMOUS_TRANSACTION 지시어를 선언해 사용합니다.\n\n자율 트랜잭션은 메인 트랜잭션의 커밋되지 않은 변경을 볼 수 없고, 독립적으로 락을 관리하며, COMMIT해도 메인 트랜잭션에 영향을 주지 않습니다. 자율 트랜잭션이 COMMIT하면 그 변경은 즉시 다른 세션에 보입니다.',
    autoTxnUseCase:
      '대표적인 사용 사례: 에러 로그 기록. 메인 트랜잭션이 롤백되더라도 디버그/감사 로그는 별도로 COMMIT되어 유지되어야 할 때 자율 트랜잭션을 사용합니다.',

    // SAVEPOINT
    spTitle: 'SAVEPOINT — 중간 복원 지점',
    spSubtitle: 'SAVEPOINT를 사용하면 트랜잭션 전체를 롤백하지 않고 특정 지점까지만 되돌릴 수 있습니다.',
    spDesc:
      'SAVEPOINT는 트랜잭션 중간에 이름 있는 복원 지점을 만듭니다. ROLLBACK TO SAVEPOINT 명령으로 그 지점 이후의 변경만 취소하고, 트랜잭션은 계속 유지됩니다.\n\nSAVEPOINT 이전의 변경은 취소되지 않으며, 최종적으로 COMMIT 또는 ROLLBACK으로 트랜잭션을 종료해야 합니다.',
    spLockTitle: 'ROLLBACK TO SAVEPOINT 시 락(Lock) 동작',
    spLockRows: [
      ['지정 SAVEPOINT 이후 문장 롤백', 'SAVEPOINT 이후의 변경만 취소됨'],
      ['지정 SAVEPOINT 보존', 'ROLLBACK TO 한 SAVEPOINT는 계속 유효'],
      ['이후 SAVEPOINT 삭제', 'ROLLBACK TO 한 지점보다 나중의 SAVEPOINT는 모두 삭제됨'],
      ['SAVEPOINT 이후에 획득한 락 해제', 'SAVEPOINT 이전에 획득한 락은 유지됨'],
      ['트랜잭션 활성 유지', 'ROLLBACK TO SAVEPOINT는 트랜잭션을 종료하지 않음'],
    ],
    spLockNote:
      '다른 세션이 ROLLBACK TO SAVEPOINT로 해제된 행 락을 즉시 획득하는 게 아닙니다. 차단된 세션은 메인 트랜잭션(잠금 보유 트랜잭션 자체) 전체가 COMMIT/ROLLBACK될 때까지 기다립니다.',
    spNote:
      'SAVEPOINT는 동일한 이름으로 재정의하면 이전 SAVEPOINT가 덮어씌워집니다. RELEASE SAVEPOINT 명령으로 명시적으로 해제할 수도 있습니다.',

    // Distributed
    distTitle: '분산 트랜잭션과 2PC',
    distDesc:
      '분산 트랜잭션(Distributed Transaction)은 데이터베이스 링크를 통해 두 개 이상의 별도 데이터베이스 노드의 데이터를 변경하는 트랜잭션입니다. Oracle은 2단계 커밋(2PC — Two-Phase Commit) 프로토콜로 모든 노드가 원자적으로 COMMIT 또는 ROLLBACK되도록 보장합니다.\n\n2PC는 사용자에게 투명하게 동작합니다 — 일반 COMMIT 문장만 실행하면 됩니다.',
    distPhaseRows: [
      ['1단계 (Prepare)', '글로벌 코디네이터가 각 데이터베이스에 "커밋 준비됐나?" 라고 물음. 각 DB가 YES/NO로 응답'],
      ['2단계 (Commit/Rollback)', '모두 YES이면 COMMIT 브로드캐스트, 하나라도 NO이면 ROLLBACK 브로드캐스트'],
      ['In-Doubt 트랜잭션', '2PC 도중 장애 발생 시 해결 대기 상태가 됨. RECO 백그라운드 프로세스가 자동 복구'],
    ],

    // lifecycle
    summary: 'COMMIT은 변경을 영구화하고, ROLLBACK은 Undo Segment로 복원하며, SAVEPOINT는 부분 롤백을 가능하게 합니다. ACID 속성은 트랜잭션이 데이터 무결성을 보장하는 방식의 근거입니다.',
  },
  en: {
    // Overview
    overviewTitle: 'Transactions',
    overviewSubtitle:
      'A transaction is the logical unit of work Oracle uses to modify data safely. All SQL statements in a transaction either succeed together or are all rolled back on failure.',
    overviewConcepts: 'Core Transaction Concepts',
    overviewConceptItems: [
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

    // XID
    xidTitle: 'XID — Transaction Identifier',
    xidDesc:
      'When a transaction begins (on the first DML statement), Oracle allocates a slot in an Undo Segment and assigns an XID (Transaction ID) to identify that slot.\n\nThe XID is a combination of three numbers: Undo Segment Number (USN) | Slot Number | Sequence Number. Together they form a unique transaction identifier across the entire database.',
    xidNote:
      'The XID is assigned at first DML execution, not at parse time. You can query active transaction XIDs and their status from the V$TRANSACTION view.',

    // Transaction active state table
    activeStateTitle: 'Information Oracle Maintains During an Active Transaction',
    activeStateRows: [
      ['Undo Data Generated', 'SGA holds old values (before-images) changed by SQL statements'],
      ['Redo Generated', 'Redo Log Buffer records changes to data blocks and undo blocks'],
      ['Buffers Modified', 'Buffer Cache blocks in SGA are modified (disk write timing is independent of commit)'],
      ['Row Locks Held', 'Other sessions cannot modify locked rows; uncommitted changes are not visible to them'],
    ],

    // lifecycle
    lifecycleTitle: 'Transaction Lifecycle',
    lifecycleDesc: 'A transaction begins on the first DML statement and ends with COMMIT, ROLLBACK, or an implicit DDL commit.',

    // Lifecycle end conditions
    lifecycleEndTitle: 'When a Transaction Ends',
    lifecycleEndRows: [
      ['COMMIT or ROLLBACK issued', 'Explicit termination — the most common method'],
      ['DDL statement executed (CREATE / DROP / ALTER)', 'Implicit COMMIT before and after the DDL'],
      ['Normal session exit (EXIT / QUIT)', 'Any uncommitted transaction is automatically committed'],
      ['Abnormal session disconnect (connection drop)', 'Automatic ROLLBACK — uncommitted changes discarded'],
    ],

    // ACID
    acidTitle: 'ACID Properties',
    acidSubtitle: 'The four properties that every transaction must satisfy to guarantee data integrity.',
    acidAtomicityDetail: 'Oracle distinguishes statement-level atomicity from transaction-level atomicity. If a single SQL statement fails, only that statement\'s changes are automatically rolled back — preceding statements in the same transaction are preserved. Note: parse (syntax) errors do NOT trigger a statement-level rollback, but deadlocks and constraint violations do. If a failure occurs before COMMIT, Oracle automatically rolls back the entire transaction via the Undo Segment.',
    acidItems: [
      {
        letter: 'A',
        name: 'Atomicity',
        nameEn: 'Atomicity',
        desc: 'All operations in a transaction succeed together or fail together. There is no partial success.',
        detail:
          'If an error occurs before COMMIT, Oracle automatically performs a ROLLBACK to undo all changes. The Undo Segment makes this possible.\n\nStatement-Level Atomicity: Each SQL statement is itself atomic. If one UPDATE fails, only that UPDATE is rolled back — previous UPDATEs in the same transaction are retained.',
        color: 'blue',
      },
      {
        letter: 'C',
        name: 'Consistency',
        nameEn: 'Consistency',
        desc: 'The database must remain in a valid state (satisfying all constraints) before and after the transaction.',
        detail:
          'Constraints such as PRIMARY KEY, FOREIGN KEY, and NOT NULL are validated at COMMIT time. Any violation causes the transaction to roll back.',
        color: 'emerald',
      },
      {
        letter: 'I',
        name: 'Isolation',
        nameEn: 'Isolation',
        desc: "Intermediate results of a running transaction are not visible to other transactions.",
        detail:
          'Oracle implements this via MVCC (Multi Version Concurrency Control). When another session tries to read uncommitted changes, Oracle reconstructs the previous version of the data from the Undo Segment. SCN (System Change Number) provides the logical ordering of all events.',
        color: 'violet',
      },
      {
        letter: 'D',
        name: 'Durability',
        nameEn: 'Durability',
        desc: 'Committed changes survive system failures.',
        detail:
          'The LGWR (Log Writer) process writes the Redo Log Buffer to the online redo log files at COMMIT time. Even if the instance crashes, these files allow Oracle to recover the committed changes. COMMIT speed is independent of transaction size; the LGWR disk I/O is the primary latency factor.',
        color: 'orange',
      },
    ],

    // SCN
    scnTitle: 'SCN (System Change Number)',
    scnDesc:
      'SCN is a logical, internal timestamp used to order database events. It is a monotonically increasing number — a lower SCN means an earlier event. Multiple simultaneous events may share the same SCN.\n\nOracle writes the SCN to the Undo Segment when a transaction modifies data, and LGWR records the SCN in the online redo log on COMMIT. This SCN serves as the anchor point for instance recovery and media recovery.',

    // COMMIT / ROLLBACK
    crTitle: 'COMMIT and ROLLBACK',
    crSubtitle: 'The two fundamental commands that end a transaction by confirming or cancelling all its changes.',
    crCommitTitle: 'COMMIT — Confirm Changes',
    crCommitDesc:
      'When you issue COMMIT, Oracle executes the following 7 steps atomically.',
    crCommitSteps: [
      { num: '①', title: 'Generate SCN', desc: 'The database generates a unique SCN (System Change Number) for this COMMIT.' },
      { num: '②', title: 'Record in Transaction Table', desc: 'The internal transaction table marks this transaction as committed with its SCN.' },
      { num: '③', title: 'Write to Redo Log (LGWR)', desc: 'LGWR (Log Writer) flushes remaining redo entries from the Redo Log Buffer to the online redo log files and records the transaction SCN. Durability is guaranteed from this point.' },
      { num: '④', title: 'Release Locks', desc: 'All row and table locks held by the transaction are released. Other sessions can now access the affected rows.' },
      { num: '⑤', title: 'Delete Savepoints', desc: 'All savepoints within the transaction are erased.' },
      { num: '⑥', title: 'Commit Cleanout', desc: 'If modified blocks are still in the SGA, Oracle removes lock-related transaction information (ITL entry) from each block. If blocks were already written to disk, this cleanup happens when they are next read.' },
      { num: '⑦', title: 'Mark Complete', desc: 'The transaction is marked as complete.' },
    ],
    crCommitNote:
      'COMMIT does not itself write data blocks to disk. Dirty buffers (modified blocks) are written asynchronously later by the DBWn (Database Writer) process. COMMIT speed is independent of the volume of changed data — LGWR disk I/O is the primary latency.',
    crRollbackTitle: 'ROLLBACK — Undo Changes',
    crRollbackDesc:
      'When you issue ROLLBACK, Oracle reads the before-images stored in the Undo Segment in reverse order to restore each change.',
    crRollbackSteps: [
      { num: '①', title: 'Read Undo Data in Reverse', desc: 'Undo Segment entries are read from newest to oldest.' },
      { num: '②', title: 'Reverse Each Operation', desc: 'INSERT → reversed as DELETE / UPDATE → re-applied with original values / DELETE → reversed as INSERT' },
      { num: '③', title: 'Release Locks', desc: 'All row and table locks held by the transaction are released.' },
      { num: '④', title: 'Delete Savepoints', desc: 'All savepoints within the transaction are erased.' },
      { num: '⑤', title: 'End Transaction', desc: 'The transaction is terminated.' },
    ],
    crRollbackNote:
      'Rollback time is proportional to the volume of changes. Rolling back a large transaction can take a long time, so some patterns use intermediate COMMITs on smaller batches.',
    crAutoCommit: 'When Implicit COMMIT Occurs',
    crAutoCommitTable: [
      ['DDL execution (CREATE / DROP / ALTER, etc.)', 'Pending DML before and after the DDL is also committed — beware'],
      ['Normal session exit (EXIT / QUIT)', 'Any uncommitted transaction is automatically committed'],
      ['Abnormal session disconnect (connection drop)', 'Automatic ROLLBACK — uncommitted changes are discarded'],
    ],
    crNote:
      "Oracle's implicit commit behavior can also be affected by client-tool autocommit settings (SQL*Plus, SQL Developer, JDBC, etc.). Always issue an explicit COMMIT after DML to be safe.",

    // SET TRANSACTION
    setTxnTitle: 'SET TRANSACTION — Setting Transaction Properties',
    setTxnDesc:
      'SET TRANSACTION must be the first statement in a transaction. It lets you assign a name to the transaction or configure its isolation level.\n\nTransaction names appear in V$TRANSACTION, LogMiner search records, and Enterprise Manager monitoring. They are especially useful for tracking long-running transactions or resolving in-doubt distributed transactions.',

    // Autonomous transactions
    autoTxnTitle: 'Autonomous Transactions',
    autoTxnDesc:
      'An autonomous transaction is an independent transaction called from within another transaction (the main transaction). It is declared using the PRAGMA AUTONOMOUS_TRANSACTION directive in a PL/SQL subprogram.\n\nAn autonomous transaction cannot see uncommitted changes from the main transaction, manages its own locks independently, and its COMMIT does not affect the main transaction. When an autonomous transaction commits, its changes become immediately visible to other sessions.',
    autoTxnUseCase:
      'A common use case is error logging: even if the main transaction rolls back, the debug or audit log written by an autonomous transaction is preserved because it commits independently.',

    // SAVEPOINT
    spTitle: 'SAVEPOINT — Intermediate Restore Points',
    spSubtitle: 'SAVEPOINTs let you roll back to a specific point within a transaction without discarding all changes.',
    spDesc:
      'A SAVEPOINT creates a named restore point inside an active transaction. ROLLBACK TO SAVEPOINT undoes only the changes made after that point; the transaction itself stays active and the earlier changes are preserved.\n\nChanges made before the SAVEPOINT are not affected. The transaction must still be ended with a COMMIT or ROLLBACK.',
    spLockTitle: 'Lock Behavior on ROLLBACK TO SAVEPOINT',
    spLockRows: [
      ['Statements after the savepoint rolled back', 'Only changes after the savepoint are undone'],
      ['The specified savepoint preserved', 'The savepoint rolled back to remains valid'],
      ['Subsequent savepoints deleted', 'All savepoints created after the rollback point are erased'],
      ['Locks acquired after savepoint released', 'Locks acquired before the savepoint are retained'],
      ['Transaction remains active', 'ROLLBACK TO SAVEPOINT does not end the transaction'],
    ],
    spLockNote:
      "Sessions blocked by a lock do not immediately proceed when ROLLBACK TO SAVEPOINT releases that specific lock. Blocked sessions wait for the entire blocking transaction (not just a lock) to COMMIT or ROLLBACK.",
    spNote:
      'Redefining a SAVEPOINT with the same name overwrites the previous one. You can also release a savepoint explicitly with RELEASE SAVEPOINT.',

    // Distributed
    distTitle: 'Distributed Transactions and Two-Phase Commit',
    distDesc:
      'A distributed transaction updates data on two or more distinct database nodes via database links. Oracle uses the Two-Phase Commit (2PC) protocol to guarantee that all nodes atomically COMMIT or ROLLBACK together.\n\n2PC is transparent to users — simply issuing a COMMIT triggers the protocol automatically.',
    distPhaseRows: [
      ['Phase 1 (Prepare)', 'Global coordinator asks each database: "Ready to commit?" Each responds YES or NO'],
      ['Phase 2 (Commit/Rollback)', 'If all YES: COMMIT broadcast to all; if any NO: ROLLBACK broadcast to all'],
      ['In-Doubt Transactions', 'If failure occurs mid-2PC, the transaction is left in-doubt. RECO background process automatically resolves it when communication is restored'],
    ],

    // lifecycle
    summary: 'COMMIT makes changes permanent; ROLLBACK uses the Undo Segment to restore the previous state; SAVEPOINT enables partial rollback. The ACID properties are the theoretical foundation for how transactions guarantee data integrity.',
  },
}

// ── AcidCard ─────────────────────────────────────────────────────────────

const colorMap = {
  blue:   { ring: 'ring-blue-300',   bg: 'bg-blue-50',   badge: 'bg-blue-500',   text: 'text-blue-700',   detail: 'bg-blue-50 border-blue-200'   },
  emerald:{ ring: 'ring-emerald-300',bg: 'bg-emerald-50',badge: 'bg-emerald-500',text: 'text-emerald-700',detail: 'bg-emerald-50 border-emerald-200'},
  violet: { ring: 'ring-violet-300', bg: 'bg-violet-50', badge: 'bg-violet-500', text: 'text-violet-700', detail: 'bg-violet-50 border-violet-200' },
  orange: { ring: 'ring-orange-300', bg: 'bg-orange-50', badge: 'bg-orange-500', text: 'text-orange-700', detail: 'bg-orange-50 border-orange-200' },
}

type AcidColor = keyof typeof colorMap

function AcidCard({ letter, name, desc, detail, color }: {
  letter: string; name: string; desc: string; detail: string; color: AcidColor
}) {
  const [open, setOpen] = useState(false)
  const c = colorMap[color]
  return (
    <div className={cn('rounded-xl border-2 p-4 transition-all', c.ring, c.bg)}>
      <div className="flex items-start gap-3">
        <span className={cn('shrink-0 flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xl font-black text-white', c.badge)}>
          {letter}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold mb-1', c.text)}>{name}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
          <button
            onClick={() => setOpen(v => !v)}
            className={cn('mt-2 font-mono text-[10px] font-bold underline-offset-2 hover:underline', c.text)}
          >
            {open ? '▲ 접기' : '▼ Oracle의 구현 방식'}
          </button>
          {open && (
            <div className={cn('mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line', c.detail)}>
              {detail}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AcidCardEn({ letter, name, desc, detail, color }: {
  letter: string; name: string; desc: string; detail: string; color: AcidColor
}) {
  const [open, setOpen] = useState(false)
  const c = colorMap[color]
  return (
    <div className={cn('rounded-xl border-2 p-4 transition-all', c.ring, c.bg)}>
      <div className="flex items-start gap-3">
        <span className={cn('shrink-0 flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xl font-black text-white', c.badge)}>
          {letter}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold mb-1', c.text)}>{name}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
          <button
            onClick={() => setOpen(v => !v)}
            className={cn('mt-2 font-mono text-[10px] font-bold underline-offset-2 hover:underline', c.text)}
          >
            {open ? '▲ Collapse' : '▼ How Oracle implements this'}
          </button>
          {open && (
            <div className={cn('mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line', c.detail)}>
              {detail}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CommitStepList ─────────────────────────────────────────────────────────

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

// ── LifecycleDiagram ──────────────────────────────────────────────────────

function LifecycleDiagram() {
  const lang = useSimulationStore((s) => s.lang)
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

// ── SavepointDiagram ──────────────────────────────────────────────────────

function SavepointDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  type StepState = 'commit' | 'rollback' | 'sp' | 'normal'
  const steps: { label: string; state: StepState; note?: string }[] = isKo
    ? [
        { label: 'INSERT A', state: 'normal' },
        { label: 'SAVEPOINT sp1', state: 'sp', note: 'SP1' },
        { label: 'UPDATE B', state: 'normal' },
        { label: 'SAVEPOINT sp2', state: 'sp', note: 'SP2' },
        { label: 'DELETE C', state: 'normal' },
        { label: 'ROLLBACK TO sp2', state: 'rollback', note: 'DELETE C 취소' },
        { label: 'COMMIT', state: 'commit', note: 'A 삽입 + B 수정 확정' },
      ]
    : [
        { label: 'INSERT A', state: 'normal' },
        { label: 'SAVEPOINT sp1', state: 'sp', note: 'SP1' },
        { label: 'UPDATE B', state: 'normal' },
        { label: 'SAVEPOINT sp2', state: 'sp', note: 'SP2' },
        { label: 'DELETE C', state: 'normal' },
        { label: 'ROLLBACK TO sp2', state: 'rollback', note: 'DELETE C undone' },
        { label: 'COMMIT', state: 'commit', note: 'A inserted + B updated' },
      ]

  const stateStyle: Record<StepState, string> = {
    normal:   'border-slate-300 bg-white text-slate-600',
    sp:       'border-amber-400 bg-amber-50 text-amber-700 font-bold',
    rollback: 'border-rose-400 bg-rose-50 text-rose-700',
    commit:   'border-emerald-400 bg-emerald-50 text-emerald-700 font-bold',
  }

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('w-48 shrink-0 rounded-lg border px-3 py-2 font-mono text-[11px]', stateStyle[s.state])}>
              {s.label}
            </div>
            {s.note && (
              <span className="font-mono text-[10px] text-slate-400">{s.note}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section pages ─────────────────────────────────────────────────────────

export function TransactionOverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconRefresh size={36} stroke={1.5} className="text-teal-500" />}
        title={t.overviewTitle}
        subtitle={t.overviewSubtitle}
      />

      <SectionTitle>{t.overviewConcepts}</SectionTitle>
      <ConceptGrid items={t.overviewConceptItems} />

      <div className="mt-6">
        <Prose>{t.overviewDesc}</Prose>
      </div>

      <div className="mt-8">
        <SubTitle>{t.lifecycleTitle}</SubTitle>
        <Prose>{t.lifecycleDesc}</Prose>
        <LifecycleDiagram />
      </div>

      <div className="mt-8">
        <SubTitle>{t.xidTitle}</SubTitle>
        <Prose>{t.xidDesc}</Prose>
        <div className="mt-4">
          <SqlBlock
            sql={`-- 현재 활성 트랜잭션의 XID 조회\nSELECT XID          AS "txn id",\n       XIDUSN       AS "undo seg",\n       XIDSLOT      AS "slot",\n       XIDSQN       AS "seq",\n       STATUS        AS "txn status"\nFROM V$TRANSACTION;\n\n-- 예시 출력:\n-- txn id             undo seg   slot   seq   txn status\n-- 0600060037000000          6      6    55   ACTIVE`}
          />
        </div>
        <div className="mt-4">
          <InfoBox variant="note">{t.xidNote}</InfoBox>
        </div>
      </div>

      <div className="mt-8">
        <SubTitle>{t.activeStateTitle}</SubTitle>
        <Table
          headers={isKo ? ['항목', '설명'] : ['Item', 'Description']}
          rows={t.activeStateRows}
        />
      </div>

      <div className="mt-8">
        <SubTitle>{t.lifecycleEndTitle}</SubTitle>
        <Table
          headers={isKo ? ['종료 조건', '동작'] : ['End Condition', 'Behaviour']}
          rows={t.lifecycleEndRows}
        />
      </div>
    </PageContainer>
  )
}

export function TransactionAcidSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconShieldCheck size={36} stroke={1.5} className="text-blue-500" />}
        title={t.acidTitle}
        subtitle={t.acidSubtitle}
      />

      <div className="mt-6 flex flex-col gap-4">
        {t.acidItems.map((item) =>
          isKo ? (
            <AcidCard key={item.letter} {...item} color={item.color as AcidColor} />
          ) : (
            <AcidCardEn key={item.letter} {...item} color={item.color as AcidColor} />
          )
        )}
      </div>

      <Divider />

      <div className="mt-2">
        <SubTitle>{isKo ? '문장 수준 원자성 vs 트랜잭션 수준 원자성' : 'Statement-Level vs Transaction-Level Atomicity'}</SubTitle>
        <Prose>{t.acidAtomicityDetail}</Prose>
        <div className="mt-4">
          <SqlBlock
            sql={isKo
              ? `-- 문장 수준 원자성 예시\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';  -- 성공\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene'; -- 실패(제약 위반 등)\n-- 첫 번째 UPDATE 변경은 유지됨 — 이 트랜잭션을 COMMIT하거나 ROLLBACK할 수 있음`
              : `-- Statement-level atomicity example\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';  -- succeeds\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene'; -- fails (constraint, etc.)\n-- The first UPDATE's change is preserved — you can still COMMIT or ROLLBACK this transaction`}
          />
        </div>
      </div>

      <Divider />

      <div className="mt-2">
        <SubTitle>{t.scnTitle}</SubTitle>
        <Prose>{t.scnDesc}</Prose>
      </div>

      <div className="mt-6">
        <InfoBox variant="summary">
          {isKo
            ? 'ACID는 트랜잭션 시스템의 이론적 기반입니다. Oracle은 Undo Segment(원자성·격리성), 제약 조건 검증(일관성), Redo Log(지속성)으로 ACID를 구현합니다. SCN은 모든 트랜잭션 이벤트의 논리적 순서를 결정합니다.'
            : 'ACID is the theoretical foundation of transaction systems. Oracle implements it via Undo Segments (Atomicity & Isolation), constraint validation (Consistency), and Redo Logs (Durability). SCN provides the logical ordering of all transaction events.'}
        </InfoBox>
      </div>
    </PageContainer>
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
        title={t.crTitle}
        subtitle={t.crSubtitle}
      />

      {/* COMMIT */}
      <div className="mt-6">
        <SubTitle>{t.crCommitTitle}</SubTitle>
        <Prose>{t.crCommitDesc}</Prose>
        <StepList steps={t.crCommitSteps} />
        <SqlBlock
          sql={isKo
            ? `-- 트랜잭션에 이름을 붙인 뒤 COMMIT\nSET TRANSACTION NAME 'sal_update2';\nUPDATE employees SET salary = 7050 WHERE last_name = 'Banda';\nUPDATE employees SET salary = 10950 WHERE last_name = 'Greene';\nCOMMIT; -- 위 7단계가 원자적으로 실행됨`
            : `-- Named transaction COMMIT\nSET TRANSACTION NAME 'sal_update2';\nUPDATE employees SET salary = 7050 WHERE last_name = 'Banda';\nUPDATE employees SET salary = 10950 WHERE last_name = 'Greene';\nCOMMIT; -- all 7 steps execute atomically`}
        />
        <div className="mt-4">
          <InfoBox variant="note">{t.crCommitNote}</InfoBox>
        </div>
      </div>

      <Divider />

      {/* ROLLBACK */}
      <div className="mt-2">
        <SubTitle>{t.crRollbackTitle}</SubTitle>
        <Prose>{t.crRollbackDesc}</Prose>
        <StepList steps={t.crRollbackSteps} />
        <SqlBlock
          sql={isKo
            ? `-- 변경 취소\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK; -- 두 UPDATE 모두 취소, SAVEPOINT도 삭제, 락 해제`
            : `-- Undo all changes\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK; -- both UPDATEs reversed, savepoint erased, locks released`}
          />
        <div className="mt-4">
          <InfoBox variant="warning">{t.crRollbackNote}</InfoBox>
        </div>
      </div>

      <Divider />

      {/* SET TRANSACTION */}
      <div className="mt-2">
        <AccordionSection title={t.setTxnTitle}>
          <Prose>{t.setTxnDesc}</Prose>
          <div className="mt-4">
            <SqlBlock
              sql={isKo
                ? `-- SET TRANSACTION은 트랜잭션의 첫 번째 문장이어야 함\nSET TRANSACTION NAME 'sal_update';\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK TO SAVEPOINT after_banda;\nUPDATE employees SET salary = 11000 WHERE last_name = 'Greene';\nCOMMIT;\n\n-- V$TRANSACTION 에서 이름으로 조회\nSELECT XID, STATUS FROM V$TRANSACTION WHERE NAME = 'sal_update';`
                : `-- SET TRANSACTION must be the first statement in the transaction\nSET TRANSACTION NAME 'sal_update';\nUPDATE employees SET salary = 7000 WHERE last_name = 'Banda';\nSAVEPOINT after_banda;\nUPDATE employees SET salary = 12000 WHERE last_name = 'Greene';\nROLLBACK TO SAVEPOINT after_banda;\nUPDATE employees SET salary = 11000 WHERE last_name = 'Greene';\nCOMMIT;\n\n-- Find the transaction by name in V$TRANSACTION\nSELECT XID, STATUS FROM V$TRANSACTION WHERE NAME = 'sal_update';`}
            />
          </div>
        </AccordionSection>
      </div>

      <div className="mt-4">
        {/* Implicit COMMIT */}
        <SubTitle>{t.crAutoCommit}</SubTitle>
        <Table
          headers={isKo ? ['상황', '동작'] : ['Situation', 'Behaviour']}
          rows={t.crAutoCommitTable}
        />
        <div className="mt-4">
          <InfoBox variant="warning">{t.crNote}</InfoBox>
        </div>
      </div>

      <Divider />

      {/* Autonomous transactions */}
      <div className="mt-2">
        <AccordionSection title={t.autoTxnTitle}>
          <Prose>{t.autoTxnDesc}</Prose>
          <div className="mt-4">
            <InfoBox variant="tip">{t.autoTxnUseCase}</InfoBox>
          </div>
          <div className="mt-4">
            <SqlBlock
              sql={isKo
                ? `-- 자율 트랜잭션 선언 예시 (에러 로그)\nCREATE OR REPLACE PROCEDURE log_error(msg VARCHAR2) AS\n  PRAGMA AUTONOMOUS_TRANSACTION;\nBEGIN\n  INSERT INTO error_log (log_time, message)\n  VALUES (SYSDATE, msg);\n  COMMIT; -- 메인 트랜잭션에 영향 없이 독립적으로 커밋\nEND;\n/\n\n-- 호출 예시: 메인 트랜잭션이 롤백되어도 로그는 유지됨\nBEGIN\n  UPDATE accounts SET balance = balance - 500 WHERE id = 3209;\n  log_error('debit processed');\n  ROLLBACK; -- 메인 작업 취소, 하지만 log_error의 INSERT는 이미 커밋됨\nEND;`
                : `-- Autonomous transaction declaration example (error logging)\nCREATE OR REPLACE PROCEDURE log_error(msg VARCHAR2) AS\n  PRAGMA AUTONOMOUS_TRANSACTION;\nBEGIN\n  INSERT INTO error_log (log_time, message)\n  VALUES (SYSDATE, msg);\n  COMMIT; -- commits independently, not affecting the main transaction\nEND;\n/\n\n-- Usage: even if the main transaction rolls back, the log is preserved\nBEGIN\n  UPDATE accounts SET balance = balance - 500 WHERE id = 3209;\n  log_error('debit processed');\n  ROLLBACK; -- undoes the main work, but log_error's INSERT was already committed\nEND;`}
            />
          </div>
        </AccordionSection>
      </div>

      <Divider />

      {/* Distributed transactions */}
      <div className="mt-2">
        <AccordionSection title={t.distTitle}>
          <Prose>{t.distDesc}</Prose>
          <div className="mt-4">
            <Table
              headers={isKo ? ['단계', '설명'] : ['Phase', 'Description']}
              rows={t.distPhaseRows}
            />
          </div>
        </AccordionSection>
      </div>
    </PageContainer>
  )
}

export function TransactionSavepointSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconFlag size={36} stroke={1.5} className="text-amber-500" />}
        title={t.spTitle}
        subtitle={t.spSubtitle}
      />

      <div className="mt-4">
        <Prose>{t.spDesc}</Prose>
      </div>

      <div className="mt-6">
        <SubTitle>{isKo ? 'SAVEPOINT 사용 예시' : 'SAVEPOINT Example'}</SubTitle>
        <SavepointDiagram />
        <SqlBlock
          sql={isKo
            ? `INSERT INTO orders VALUES (1, 'A');\nSAVEPOINT sp1;\n\nINSERT INTO orders VALUES (2, 'B');\nSAVEPOINT sp2;\n\nINSERT INTO orders VALUES (3, 'C'); -- 실수!\nROLLBACK TO sp2; -- 3번만 취소, 1·2번은 유지, sp2는 유지, sp2 이후 SP 삭제\n\nCOMMIT; -- 1번, 2번 확정`
            : `INSERT INTO orders VALUES (1, 'A');\nSAVEPOINT sp1;\n\nINSERT INTO orders VALUES (2, 'B');\nSAVEPOINT sp2;\n\nINSERT INTO orders VALUES (3, 'C'); -- mistake!\nROLLBACK TO sp2; -- only row 3 undone; rows 1 & 2 kept; sp2 preserved; later SPs erased\n\nCOMMIT; -- rows 1 and 2 made permanent`}
        />
      </div>

      <Divider />

      <div className="mt-2">
        <SubTitle>{t.spLockTitle}</SubTitle>
        <Table
          headers={isKo ? ['동작', '설명'] : ['Action', 'Description']}
          rows={t.spLockRows}
        />
        <div className="mt-4">
          <InfoBox variant="warning">{t.spLockNote}</InfoBox>
        </div>
      </div>

      <div className="mt-6">
        <InfoBox variant="note">{t.spNote}</InfoBox>
      </div>

      <div className="mt-4">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}

// ── Top-level router component ────────────────────────────────────────────

export function TransactionSection() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconRefresh size={36} stroke={1.5} className="text-teal-500" />}
        title={isKo ? '트랜잭션(Transaction)' : 'Transactions'}
        subtitle={isKo
          ? '트랜잭션은 Oracle이 데이터를 안전하게 변경하는 논리적 작업 단위입니다. 왼쪽 목차에서 하위 섹션을 선택하세요.'
          : 'A transaction is the logical unit of work Oracle uses to modify data safely. Select a subsection from the left table of contents.'}
      />
      <div className="mt-4">
        <ConceptGrid items={T[lang].overviewConceptItems} />
      </div>
      <div className="mt-6">
        <InfoBox variant="note">
          {isKo
            ? '하위 섹션: 트랜잭션이란? · ACID 속성 · COMMIT과 ROLLBACK · SAVEPOINT'
            : 'Subsections: What is a Transaction? · ACID Properties · COMMIT & ROLLBACK · SAVEPOINT'}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
