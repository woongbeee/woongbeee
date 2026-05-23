import { IconLock } from '@tabler/icons-react'
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
    title: '락(Lock) 메커니즘',
    subtitle: 'Oracle이 데이터 무결성을 보장하기 위해 사용하는 다양한 락의 종류와 동작 방식을 살펴봅니다.',
    fourRules: '락의 4가지 원칙',
    ruleItems: [
      { num: '1', title: '행만 잠긴다', desc: 'DML은 수정된 행에만 Row Lock(TX)을 건다. 블록이나 테이블 전체를 잠그지 않는다.' },
      { num: '2', title: '쓰기는 쓰기를 막는다', desc: '두 트랜잭션이 같은 행을 동시에 수정하려 하면 나중에 온 트랜잭션은 앞선 트랜잭션이 완료될 때까지 대기한다.' },
      { num: '3', title: '읽기는 쓰기를 막지 않는다', desc: 'SELECT는 행을 잠그지 않는다(FOR UPDATE 제외). 변경 중인 행도 MVCC로 이전 버전을 읽는다.' },
      { num: '4', title: '쓰기는 읽기를 막지 않는다', desc: 'UPDATE 중인 행도 SELECT로 자유롭게 읽을 수 있다. Undo에서 이전 버전을 제공한다.' },
    ],
    dmlLocksTitle: 'DML 락 종류',
    rowLockTitle: 'Row Lock (TX — Transaction)',
    rowLockDesc:
      'INSERT, UPDATE, DELETE, MERGE, SELECT ... FOR UPDATE 시 수정된 각 행에 독점(Exclusive) 락이 걸립니다. 락 정보는 별도 락 관리자가 아닌 데이터 블록 헤더(ITL)에 저장됩니다. 트랜잭션이 COMMIT 또는 ROLLBACK될 때 해제됩니다.',
    tableLockTitle: 'Table Lock (TM)',
    tableLockDesc:
      'DML 실행 시 해당 테이블 전체에도 TM(Table Lock)이 걸립니다. Row Lock을 보호하기 위해 DDL이 테이블 구조를 변경하지 못하게 막는 역할입니다. TM 락의 모드에 따라 다른 세션의 DML 허용 여부가 달라집니다.',
    tmModes: 'TM 락 모드 (제한 약→강)',
    fkTitle: '외래키(FK) 인덱스 주의사항',
    fkDesc:
      '자식 테이블의 외래키 컬럼에 인덱스가 없으면, 부모 테이블의 기본키를 수정/삭제할 때 자식 테이블 전체에 Full Table Lock이 걸립니다. 다른 세션이 자식 테이블을 수정할 수 없게 됩니다. 외래키 컬럼에는 반드시 인덱스를 생성하세요.',
    escalationTitle: '락 에스컬레이션 없음',
    escalationDesc:
      'Oracle은 Row Lock을 Table Lock으로 에스컬레이션하지 않습니다. 일부 DB는 행 락이 너무 많아지면 테이블 전체를 잠그는데, 이 경우 교착상태 가능성이 커집니다. Oracle은 항상 행 수준으로만 잠급니다.',
  },
  en: {
    title: 'Lock Mechanisms',
    subtitle: 'Explore the types of locks Oracle uses to guarantee data integrity and how they interact.',
    fourRules: 'The 4 Locking Rules',
    ruleItems: [
      { num: '1', title: 'Only rows are locked', desc: 'DML places a Row Lock (TX) only on modified rows. Blocks or entire tables are never locked.' },
      { num: '2', title: 'Writer blocks writer', desc: 'If two transactions try to modify the same row simultaneously, the later one waits until the first completes.' },
      { num: '3', title: 'Reader never blocks writer', desc: 'SELECT does not lock rows (except FOR UPDATE). Even rows being modified are readable via MVCC.' },
      { num: '4', title: 'Writer never blocks reader', desc: 'Rows being updated are freely readable by SELECT. Undo provides the previous version.' },
    ],
    dmlLocksTitle: 'DML Lock Types',
    rowLockTitle: 'Row Lock (TX — Transaction)',
    rowLockDesc:
      'INSERT, UPDATE, DELETE, MERGE, and SELECT ... FOR UPDATE place an exclusive lock on each modified row. Lock information is stored in the data block header (ITL), not in a separate lock manager. Released on COMMIT or ROLLBACK.',
    tableLockTitle: 'Table Lock (TM)',
    tableLockDesc:
      'When DML runs, the entire table also receives a TM (Table Lock). Its purpose is to prevent DDL from altering the table structure while row locks exist. The TM mode determines whether other sessions can perform DML.',
    tmModes: 'TM Lock Modes (least → most restrictive)',
    fkTitle: 'Foreign Key Index Warning',
    fkDesc:
      "If the child table's foreign key column has no index, modifying or deleting the parent's primary key acquires a Full Table Lock on the child table, preventing other sessions from modifying it. Always create an index on foreign key columns.",
    escalationTitle: 'No Lock Escalation',
    escalationDesc:
      'Oracle never escalates row locks to table locks. Some databases convert many row locks into a single table lock, which increases deadlock risk. Oracle always locks at the row level only.',
  },
}

const TM_MODES_KO = [
  ['Row Share (RS)', '행을 잠그고 나중에 업데이트 예정', '가장 높은 동시성'],
  ['Row Exclusive (RX)', '행을 업데이트했거나 FOR UPDATE 사용', '다른 세션 동시 업데이트 허용'],
  ['Share (S)', '다른 세션 조회 허용, 업데이트 불가', '여러 세션이 동시에 보유 가능'],
  ['Share Row Exclusive (SRX)', 'Share보다 제한적, 한 트랜잭션만', '조회 허용, 업데이트 불가'],
  ['Exclusive (X)', '완전 독점', '다른 DML 및 락 불가'],
]
const TM_MODES_EN = [
  ['Row Share (RS)', 'Locked rows, intends to update later', 'Highest concurrency'],
  ['Row Exclusive (RX)', 'Rows updated or FOR UPDATE used', 'Allows concurrent updates on other rows'],
  ['Share (S)', 'Others can query, not update', 'Multiple sessions can hold simultaneously'],
  ['Share Row Exclusive (SRX)', 'More restrictive than Share, one TX only', 'Queries allowed, updates not'],
  ['Exclusive (X)', 'Complete monopoly', 'No other DML or locks allowed'],
]

const LockDiagram = ({ lang }: { lang: 'ko' | 'en' }) => (
  <svg viewBox="0 0 560 200" className="w-full max-w-2xl mx-auto" aria-label="Row lock diagram">
    <rect x="30" y="20" width="200" height="160" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <text x="130" y="40" fontSize="11" fill="#334155" textAnchor="middle" fontWeight="bold">
      {lang === 'ko' ? 'EMPLOYEES 테이블' : 'EMPLOYEES Table'}
    </text>
    {[60, 90, 120, 150].map((y, i) => (
      <rect key={y} x="50" y={y} width="160" height="22" rx="4"
        fill={i === 1 ? '#fee2e2' : i === 2 ? '#dcfce7' : '#f1f5f9'}
        stroke={i === 1 ? '#fca5a5' : i === 2 ? '#86efac' : '#e2e8f0'} strokeWidth="1" />
    ))}
    <text x="130" y="76" fontSize="9" fill="#64748b" textAnchor="middle">EMP_ID=100, SAL=5000</text>
    <text x="130" y="106" fontSize="9" fill="#dc2626" textAnchor="middle" fontWeight="bold">
      EMP_ID=101, SAL=6000 🔒
    </text>
    <text x="130" y="136" fontSize="9" fill="#16a34a" textAnchor="middle">EMP_ID=102, SAL=7000</text>
    <text x="130" y="166" fontSize="9" fill="#64748b" textAnchor="middle">EMP_ID=103, SAL=8000</text>
    <rect x="290" y="15" width="120" height="60" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
    <text x="350" y="33" fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">Session A</text>
    <text x="350" y="50" fontSize="9" fill="#3b82f6" textAnchor="middle">UPDATE EMP 101</text>
    <text x="350" y="65" fontSize="9" fill="#3b82f6" textAnchor="middle">
      {lang === 'ko' ? '→ 행 락 획득' : '→ acquires row lock'}
    </text>
    <rect x="290" y="95" width="120" height="60" rx="6" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
    <text x="350" y="113" fontSize="10" fill="#dc2626" textAnchor="middle" fontWeight="bold">Session B</text>
    <text x="350" y="130" fontSize="9" fill="#ef4444" textAnchor="middle">UPDATE EMP 101</text>
    <text x="350" y="145" fontSize="9" fill="#ef4444" textAnchor="middle">
      {lang === 'ko' ? '→ 대기 (Session A 완료까지)' : '→ waits (until Session A done)'}
    </text>
    <rect x="290" y="155" width="120" height="40" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
    <text x="350" y="173" fontSize="10" fill="#16a34a" textAnchor="middle" fontWeight="bold">Session C</text>
    <text x="350" y="188" fontSize="9" fill="#22c55e" textAnchor="middle">
      {lang === 'ko' ? 'UPDATE EMP 102 → 즉시 성공' : 'UPDATE EMP 102 → succeeds immediately'}
    </text>
    <polyline points="290,40 230,107" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#lock-arr)" fill="none" />
    <polyline points="290,160 230,107" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />
    <polyline points="290,175 230,130" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />
    <defs>
      <marker id="lock-arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
      </marker>
    </defs>
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
          <div key={item.num} className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
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

      <div className="w-full max-w-2xl mx-auto my-6 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
        <LockDiagram lang={lang} />
      </div>

      <Divider />

      <SectionTitle>{t.dmlLocksTitle}</SectionTitle>

      <AccordionSection title={t.rowLockTitle} defaultOpen>
        <Prose>{t.rowLockDesc}</Prose>
      </AccordionSection>

      <AccordionSection title={t.tableLockTitle}>
        <Prose>{t.tableLockDesc}</Prose>
        <p className="mb-2 text-sm font-semibold text-foreground/80">{t.tmModes}</p>
        <Table
          headers={[lang === 'ko' ? '모드' : 'Mode', lang === 'ko' ? '사용 시점' : 'When Used', lang === 'ko' ? '설명' : 'Notes']}
          rows={lang === 'ko' ? TM_MODES_KO : TM_MODES_EN}
        />
      </AccordionSection>

      <Divider />

      <InfoBox variant="warning">
        <strong>{t.fkTitle}</strong>
        <br />
        {t.fkDesc}
      </InfoBox>

      <div className="mt-4">
        <SqlBlock
          sql={lang === 'ko' ? `-- 외래키 인덱스 생성 (권장)
CREATE INDEX idx_emp_dept_id ON employees(department_id);
-- department_id가 departments.department_id를 참조하는 경우
-- 인덱스 없이 부모 행 삭제 시 자식 테이블 전체 락 발생!` : `-- Create index on foreign key (recommended)
CREATE INDEX idx_emp_dept_id ON employees(department_id);
-- department_id references departments.department_id
-- Without index: deleting a parent row locks the entire child table!`}
        />
      </div>

      <Divider />

      <InfoBox variant="note">
        <strong>{t.escalationTitle}</strong>
        <br />
        {t.escalationDesc}
      </InfoBox>
    </PageContainer>
  )
}
