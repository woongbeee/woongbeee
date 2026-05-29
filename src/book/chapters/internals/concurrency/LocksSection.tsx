import { IconLock } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'

const T = {
  ko: {
    title: '락(Lock) 메커니즘',
    subtitle:
      'Oracle이 데이터 무결성을 지키기 위해 사용하는 락의 종류와 동작 방식을 알아봐요.',
    fourRules: '락의 4가지 원칙',
    ruleItems: [
      {
        num: '1',
        title: '행(row)만 잠겨요',
        desc: 'DML은 수정된 행에만 Row Lock(TX)을 걸어요. 블록 전체나 테이블 전체를 잠그지 않아요.',
      },
      {
        num: '2',
        title: '쓰기는 쓰기를 막아요',
        desc: '두 트랜잭션이 같은 행을 동시에 수정하려 하면, 나중에 온 트랜잭션은 앞선 트랜잭션이 끝날 때까지 기다려야 해요.',
      },
      {
        num: '3',
        title: '읽기는 쓰기를 막지 않아요',
        desc: 'SELECT는 행을 잠그지 않아요(FOR UPDATE 제외). 수정 중인 행도 MVCC 덕분에 이전 버전을 읽을 수 있어요.',
      },
      {
        num: '4',
        title: '쓰기는 읽기를 막지 않아요',
        desc: 'UPDATE 중인 행도 SELECT로 자유롭게 읽을 수 있어요. Undo가 이전 버전을 제공해 줘요.',
      },
    ],
    lockTypes: '락의 종류',
    dmlLocksTitle: 'DML 락 (Data Locks)',
    dmlLocksDesc:
      'DML 락은 여러 사용자가 동시에 데이터를 변경할 때 데이터 무결성을 지켜줘요.',
    rowLockTitle: 'Row Lock (TX — Transaction Lock)',
    rowLockDesc:
      'INSERT, UPDATE, DELETE, MERGE, SELECT ... FOR UPDATE를 실행하면 수정된 각 행에 독점(Exclusive) 락이 걸려요. Oracle은 락 정보를 별도의 락 관리자에 저장하지 않고 데이터 블록 헤더(ITL — Interested Transaction List)에 저장해요. 트랜잭션이 COMMIT 또는 ROLLBACK될 때 락이 풀려요.',
    tableLockTitle: 'Table Lock (TM)',
    tableLockDesc:
      'DML을 실행하면 해당 테이블 전체에도 TM(Table Lock)이 걸려요. Row Lock이 걸린 동안 DDL이 테이블 구조를 바꾸지 못하도록 막아주는 역할이에요. TM 락 모드에 따라 다른 세션의 DML 허용 여부가 달라져요.',
    tmModes: 'TM 락 모드 (제한 약 → 강)',
    ddlLocksTitle: 'DDL 락 (Dictionary Locks)',
    ddlLocksDesc:
      'DDL 락은 DDL 작업 중에 스키마 객체를 보호해요. Oracle은 수정하거나 참조하는 개별 스키마 객체만 잠그고, 데이터 딕셔너리 전체를 잠그는 일은 없어요.',
    ddlLockTypes: 'DDL 락 종류',
    systemLocksTitle: '시스템 락 (Latches & Mutexes)',
    systemLocksDesc:
      'Latch와 Mutex는 SGA(System Global Area)의 공유 데이터 구조를 보호하는 저수준 직렬화 메커니즘이에요. 일반 Oracle 락과 달리 대기 큐를 지원하지 않고 아주 짧은 시간 동안만 보유해요.',
    latchDesc:
      'Latch는 여러 프로세스가 동시에 공유 데이터 구조를 수정하지 못하도록 막아요. Buffer Cache, Shared Pool 같은 SGA 구성요소 보호에 쓰여요. Latch는 짧게 스핀(spin)하다 대기하고, 풀리는 즉시 다음 요청자가 획득해요.',
    mutexDesc:
      'Mutex(Mutual Exclusion Object, 상호 배타 객체)는 단일 객체를 동시 접근으로부터 보호해요. Latch보다 세밀하게 특정 커서나 라이브러리 캐시 객체를 보호하고, 메모리 사용량도 더 적어요.',
    fkTitle: '외래키(FK) 컬럼에 인덱스를 꼭 만드세요',
    fkDesc:
      '자식 테이블의 외래키 컬럼에 인덱스가 없으면, 부모 테이블의 기본키를 수정/삭제할 때 자식 테이블 전체에 Full Table Lock이 걸려요. 다른 세션이 자식 테이블을 수정할 수 없게 돼요. 외래키 컬럼에는 반드시 인덱스를 만들어 주세요.',
    escalationTitle: '락 에스컬레이션이 없어요',
    escalationDesc:
      'Oracle은 Row Lock이 아무리 많아져도 Table Lock으로 확대(에스컬레이션)하지 않아요. 일부 DB는 행 락이 너무 많아지면 테이블 전체를 잠그는데, 이러면 교착상태(Deadlock)가 생기기 쉬워요. Oracle은 항상 행 수준으로만 잠가요.',
    autoLockTitle: '자동 최소 잠금 원칙',
    autoLockDesc:
      'Oracle은 데이터 동시성을 최대화하는 가장 낮은 수준의 제한을 자동으로 적용해요. 데이터 무결성을 지키면서도 불필요한 잠금은 최소화해요.',
  },
  en: {
    title: 'Lock Mechanisms',
    subtitle:
      'Explore the types of locks Oracle uses to guarantee data integrity and how they interact.',
    fourRules: 'The 4 Locking Rules',
    ruleItems: [
      {
        num: '1',
        title: 'Only rows are locked',
        desc: 'DML places a Row Lock (TX) only on modified rows. Blocks or entire tables are never locked.',
      },
      {
        num: '2',
        title: 'Writer blocks writer',
        desc: 'If two transactions try to modify the same row simultaneously, the later one waits until the first completes.',
      },
      {
        num: '3',
        title: 'Reader never blocks writer',
        desc: 'SELECT does not lock rows (except FOR UPDATE). Even rows being modified are readable via MVCC.',
      },
      {
        num: '4',
        title: 'Writer never blocks reader',
        desc: 'Rows being updated are freely readable by SELECT. Undo provides the previous version.',
      },
    ],
    lockTypes: 'Lock Types',
    dmlLocksTitle: 'DML Locks (Data Locks)',
    dmlLocksDesc:
      'DML locks protect data that is being modified by concurrent users. They guarantee the integrity of data being accessed by multiple transactions simultaneously.',
    rowLockTitle: 'Row Lock (TX — Transaction Lock)',
    rowLockDesc:
      'INSERT, UPDATE, DELETE, MERGE, and SELECT ... FOR UPDATE place an exclusive lock on each modified row. Oracle stores lock information in the data block header (ITL — Interested Transaction List), not in a separate lock manager. Released on COMMIT or ROLLBACK.',
    tableLockTitle: 'Table Lock (TM)',
    tableLockDesc:
      'When DML runs, the entire table also receives a TM (Table Lock). Its purpose is to prevent DDL from altering the table structure while row locks exist. The TM mode determines whether other sessions can perform DML.',
    tmModes: 'TM Lock Modes (least → most restrictive)',
    ddlLocksTitle: 'DDL Locks (Dictionary Locks)',
    ddlLocksDesc:
      'DDL locks protect schema objects during DDL operations. Oracle locks only individual schema objects that are modified or referenced — never the entire data dictionary.',
    ddlLockTypes: 'DDL Lock Types',
    systemLocksTitle: 'System Locks (Latches & Mutexes)',
    systemLocksDesc:
      'Latches and mutexes are low-level serialization mechanisms that protect shared data structures in the SGA. Unlike regular Oracle locks, they do not support queuing and are held for very short durations.',
    latchDesc:
      'A latch prevents multiple processes from simultaneously modifying shared data structures such as the buffer cache or shared pool. Latches spin briefly before waiting, and the next requester acquires the latch as soon as it is released.',
    mutexDesc:
      'A mutex (Mutual Exclusion Object) protects a single object from concurrent access — more granular than a latch. Mutexes protect specific cursors or library cache objects with lower memory overhead and finer concurrency control.',
    fkTitle: 'Foreign Key Index Warning',
    fkDesc:
      "If the child table's foreign key column has no index, modifying or deleting the parent's primary key acquires a Full Table Lock on the child table, preventing other sessions from modifying it. Always create an index on foreign key columns.",
    escalationTitle: 'No Lock Escalation',
    escalationDesc:
      'Oracle never escalates row locks to table locks. Some databases convert many row locks into a single table lock, which increases deadlock risk. Oracle always locks at the row level only.',
    autoLockTitle: 'Automatic Locking Policy',
    autoLockDesc:
      'Oracle automatically uses the lowest applicable level of restrictiveness to provide the highest degree of data concurrency yet also provide fail-safe data integrity.',
  },
}

const TM_MODES_KO = [
  ['Row Share (RS / SS)', 'SELECT ... FOR UPDATE 또는 행 잠금 예고', '가장 높은 동시성. 다른 세션 DML 모두 허용'],
  ['Row Exclusive (RX / SX)', 'INSERT·UPDATE·DELETE·MERGE 실행 시', '다른 세션 동시 DML 허용. Share 락 불가'],
  ['Share (S)', 'CREATE INDEX (비파티션 테이블)', '다른 세션 조회 허용, 업데이트 불가. 여러 세션 동시 보유 가능'],
  ['Share Row Exclusive (SRX / SSX)', 'Share + Row Exclusive 동시 필요 시', '하나의 트랜잭션만 보유. 조회 허용, 업데이트 불가'],
  ['Exclusive (X)', 'DROP TABLE, ALTER TABLE, LOCK TABLE ... IN EXCLUSIVE MODE', '완전 독점. 다른 DML·락 불가'],
]
const TM_MODES_EN = [
  ['Row Share (RS / SS)', 'SELECT ... FOR UPDATE or lock intent', 'Highest concurrency. All other session DML allowed'],
  ['Row Exclusive (RX / SX)', 'INSERT, UPDATE, DELETE, MERGE', 'Concurrent DML on other rows allowed. Share lock not permitted'],
  ['Share (S)', 'CREATE INDEX (non-partitioned)', 'Queries allowed, updates not. Multiple sessions can hold simultaneously'],
  ['Share Row Exclusive (SRX / SSX)', 'Combined Share + Row Exclusive need', 'Only one transaction at a time. Queries allowed, updates not'],
  ['Exclusive (X)', 'DROP TABLE, ALTER TABLE, LOCK TABLE ... IN EXCLUSIVE MODE', 'Complete monopoly. No other DML or locks'],
]

const DDL_LOCK_TYPES_KO = [
  ['Exclusive DDL Lock', 'CREATE·ALTER·DROP 등 대부분의 DDL', '다른 DDL 및 DML 락 방지. DDL 완료까지 보유'],
  ['Share DDL Lock', 'CREATE PROCEDURE, CREATE VIEW 등', '충돌하는 DDL은 방지, 동종 DDL은 허용'],
  ['Breakable Parse Lock', 'SQL 파싱 중 라이브러리 캐시 객체 참조 시', 'DDL 충돌 시 깨질 수 있음(Breakable). 파싱 완료 후 해제'],
]
const DDL_LOCK_TYPES_EN = [
  ['Exclusive DDL Lock', 'Most DDL: CREATE, ALTER, DROP', 'Prevents other DDL and DML locks. Held until DDL completes'],
  ['Share DDL Lock', 'CREATE PROCEDURE, CREATE VIEW, etc.', 'Prevents conflicting DDL, allows similar DDL'],
  ['Breakable Parse Lock', 'Library cache object reference during parse', 'Can be broken if DDL conflicts. Released after parse completes'],
]

const LockDiagram = ({ lang }: { lang: 'ko' | 'en' }) => (
  <svg viewBox="0 0 600 230" className="w-full max-w-2xl mx-auto" aria-label="Row lock diagram">
    {/* 테이블 박스 */}
    <rect x="20" y="20" width="200" height="190" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <text x="120" y="42" fontSize="11" fill="#334155" textAnchor="middle" fontWeight="bold">
      {lang === 'ko' ? 'EMPLOYEES 테이블' : 'EMPLOYEES Table'}
    </text>
    {/* 행들 */}
    {[
      { y: 56, id: 'EMP 100', sal: '5000', color: '#f1f5f9', border: '#e2e8f0', text: '#64748b' },
      { y: 90, id: 'EMP 101', sal: '6000', color: '#fee2e2', border: '#fca5a5', text: '#dc2626' },
      { y: 124, id: 'EMP 102', sal: '7000', color: '#dcfce7', border: '#86efac', text: '#16a34a' },
      { y: 158, id: 'EMP 103', sal: '8000', color: '#f1f5f9', border: '#e2e8f0', text: '#64748b' },
    ].map((row) => (
      <g key={row.y}>
        <rect x="34" y={row.y} width="172" height="26" rx="4" fill={row.color} stroke={row.border} strokeWidth="1" />
        <text x="80" y={row.y + 17} fontSize="9" fill={row.text} textAnchor="middle">
          {row.id}
        </text>
        <text x="160" y={row.y + 17} fontSize="9" fill={row.text} textAnchor="middle">
          SAL={row.sal}{row.id === 'EMP 101' ? ' 🔒' : ''}
        </text>
      </g>
    ))}

    {/* Session A: EMP 101 업데이트 */}
    <rect x="260" y="15" width="155" height="70" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
    <text x="337" y="34" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">Session A</text>
    <text x="337" y="50" fontSize="9" fill="#3b82f6" textAnchor="middle">
      {lang === 'ko' ? 'UPDATE EMP 101' : 'UPDATE EMP 101'}
    </text>
    <text x="337" y="65" fontSize="9" fill="#3b82f6" textAnchor="middle">
      {lang === 'ko' ? '→ 행 락 획득 ✓' : '→ acquires row lock ✓'}
    </text>

    {/* Session B: EMP 101 대기 */}
    <rect x="260" y="100" width="155" height="70" rx="6" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
    <text x="337" y="119" fontSize="10" fill="#dc2626" textAnchor="middle" fontWeight="bold">Session B</text>
    <text x="337" y="135" fontSize="9" fill="#ef4444" textAnchor="middle">
      {lang === 'ko' ? 'UPDATE EMP 101 → 대기 ⏳' : 'UPDATE EMP 101 → waits ⏳'}
    </text>
    <text x="337" y="150" fontSize="9" fill="#9ca3af" textAnchor="middle">
      {lang === 'ko' ? '(Session A 완료까지)' : '(until Session A finishes)'}
    </text>

    {/* Session C: EMP 102 즉시 성공 */}
    <rect x="260" y="185" width="155" height="42" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
    <text x="337" y="203" fontSize="10" fill="#16a34a" textAnchor="middle" fontWeight="bold">Session C</text>
    <text x="337" y="219" fontSize="9" fill="#22c55e" textAnchor="middle">
      {lang === 'ko' ? 'UPDATE EMP 102 → 즉시 성공 ✓' : 'UPDATE EMP 102 → immediate ✓'}
    </text>

    {/* 화살표: A/B → EMP 101 */}
    <polyline points="260,50 220,103" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />
    <polyline points="260,135 220,103" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />
    {/* 화살표: C → EMP 102 */}
    <polyline points="260,206 220,137" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />

    {/* ITL 설명 */}
    <rect x="440" y="60" width="148" height="110" rx="6" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
    <text x="514" y="79" fontSize="9" fill="#92400e" textAnchor="middle" fontWeight="bold">
      {lang === 'ko' ? '블록 헤더 (ITL)' : 'Block Header (ITL)'}
    </text>
    <text x="514" y="96" fontSize="8" fill="#78350f" textAnchor="middle">
      {lang === 'ko' ? '락 정보는 별도' : 'Lock info stored in'}
    </text>
    <text x="514" y="108" fontSize="8" fill="#78350f" textAnchor="middle">
      {lang === 'ko' ? '락 관리자가 아닌' : 'data block header'}
    </text>
    <text x="514" y="120" fontSize="8" fill="#78350f" textAnchor="middle">
      {lang === 'ko' ? '데이터 블록 헤더에' : '(ITL), not in a'}
    </text>
    <text x="514" y="132" fontSize="8" fill="#78350f" textAnchor="middle">
      {lang === 'ko' ? '저장돼요.' : 'separate lock mgr.'}
    </text>
    <text x="514" y="148" fontSize="8" fill="#d97706" textAnchor="middle" fontStyle="italic">
      {lang === 'ko' ? '→ 락 에스컬레이션 없음' : '→ No lock escalation'}
    </text>
    <text x="514" y="162" fontSize="8" fill="#d97706" textAnchor="middle" fontStyle="italic">
      {lang === 'ko' ? '→ 오버헤드 최소화' : '→ Minimal overhead'}
    </text>
  </svg>
)

export function LocksSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLock size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.fourRules}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {t.ruleItems.map((item) => (
          <div
            key={item.num}
            className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {item.num}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full my-6 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
        <LockDiagram lang={lang} />
      </div>

      <Divider />

      <SectionTitle>{t.lockTypes}</SectionTitle>

      {/* DML 락 */}
      <div className="mb-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-5">
        <p className="mb-1 font-mono text-sm font-bold text-blue-700">{t.dmlLocksTitle}</p>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t.dmlLocksDesc}</p>

        <div className="mb-4 rounded-xl border border-blue-200 bg-white/70 p-4">
          <p className="mb-1 font-mono text-xs font-bold text-blue-600">{t.rowLockTitle}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.rowLockDesc}</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white/70 p-4">
          <p className="mb-1 font-mono text-xs font-bold text-blue-600">{t.tableLockTitle}</p>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.tableLockDesc}</p>
          <p className="mb-2 text-xs font-semibold text-foreground/70">{t.tmModes}</p>
          <Table
            headers={[
              lang === 'ko' ? '모드' : 'Mode',
              lang === 'ko' ? '사용 시점' : 'When Acquired',
              lang === 'ko' ? '설명' : 'Notes',
            ]}
            rows={lang === 'ko' ? TM_MODES_KO : TM_MODES_EN}
          />
        </div>
      </div>

      {/* DDL 락 */}
      <div className="mb-4 rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-5">
        <p className="mb-1 font-mono text-sm font-bold text-violet-700">{t.ddlLocksTitle}</p>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t.ddlLocksDesc}</p>
        <p className="mb-2 text-xs font-semibold text-foreground/70">{t.ddlLockTypes}</p>
        <Table
          headers={[
            lang === 'ko' ? '종류' : 'Type',
            lang === 'ko' ? '사용 시점' : 'When Used',
            lang === 'ko' ? '설명' : 'Description',
          ]}
          rows={lang === 'ko' ? DDL_LOCK_TYPES_KO : DDL_LOCK_TYPES_EN}
        />
      </div>

      {/* 시스템 락 */}
      <div className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-5">
        <p className="mb-1 font-mono text-sm font-bold text-amber-700">{t.systemLocksTitle}</p>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t.systemLocksDesc}</p>
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
            <p className="mb-1 font-mono text-xs font-bold text-amber-700">Latch</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.latchDesc}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
            <p className="mb-1 font-mono text-xs font-bold text-amber-700">Mutex</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.mutexDesc}</p>
          </div>
        </div>
      </div>

      <Divider />

      <InfoBox variant="warning">
        <strong>{t.fkTitle}</strong>
        <br />
        {t.fkDesc}
      </InfoBox>

      <div className="mt-4">
        <SqlBlock
          sql={
            lang === 'ko'
              ? `-- 외래키 인덱스 생성 (권장)
CREATE INDEX idx_emp_dept_id ON employees(department_id);
-- department_id가 departments.department_id를 참조하는 경우
-- 인덱스 없이 부모 행 삭제 시 → 자식 테이블 전체 락 발생!
-- 인덱스 있으면 → 자식 테이블 행 수준 락만 걸림`
              : `-- Create index on foreign key (recommended)
CREATE INDEX idx_emp_dept_id ON employees(department_id);
-- department_id references departments.department_id
-- Without index: deleting a parent row → full table lock on child!
-- With index: only row-level locks on the child table`
          }
        />
      </div>

      <Divider />

      <InfoBox variant="note">
        <strong>{t.autoLockTitle}</strong>
        <br />
        {t.autoLockDesc}
        <br />
        <span className="text-xs mt-1 block opacity-80">{t.escalationTitle}: {t.escalationDesc}</span>
      </InfoBox>
    </PageContainer>
  )
}
