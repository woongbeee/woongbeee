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
import { cn } from '@/lib/utils.ts'

const T = {
  ko: {
    title: 'MVCC',
    titleSub: 'Multi-Version Concurrency Control',
    titleDesc: '— 다중 버전 읽기 일관성',
    subtitle:
      'Oracle은 데이터 블록의 여러 버전을 동시에 유지해서, 읽기와 쓰기가 서로를 방해하지 않도록 해요.',
    overviewTitle: '읽기 일관성이 뭐예요?',
    overviewDesc:
      'Oracle은 다중 버전 일관성 모델(multiversion consistency model)을 사용해요. 여러 사람이 동시에 접속해도 각자 특정 시점에 일관된 데이터 뷰를 볼 수 있어요. 같은 블록의 여러 버전이 동시에 존재할 수 있기 때문에, 트랜잭션은 쿼리가 요구하는 시점에 커밋된 버전의 데이터를 읽을 수 있어요.',
    guarantees: '읽기 일관성의 세 가지 보장',
    guaranteeItems: [
      {
        num: '1',
        color: 'bg-blue-500',
        title: '커밋된 데이터만 읽어요',
        text: 'Oracle은 Dirty Read(커밋되지 않은 데이터를 읽는 것)를 절대 허용하지 않아요. 미커밋 데이터를 읽는 일 자체가 불가능해요.',
      },
      {
        num: '2',
        color: 'bg-indigo-500',
        title: '단일 시점 일관성',
        text: '쿼리가 반환하는 데이터는 단 하나의 시점에 커밋된 일관된 데이터예요. 쿼리가 실행되는 중에 다른 트랜잭션이 커밋해도 그 변경은 보이지 않아요.',
      },
      {
        num: '3',
        color: 'bg-violet-500',
        title: '읽기와 쓰기는 서로를 막지 않아요',
        text: 'Oracle의 쿼리는 다른 쿼리나 DML을 절대 기다리게 하지 않아요. 읽기가 쓰기를 막지 않고, 쓰기도 읽기를 막지 않아요.',
      },
    ],
    howTitle: 'MVCC는 어떻게 동작하나요?',
    howDesc:
      '데이터를 수정할 때마다 Oracle은 Undo 항목을 만들어 Undo Segment에 기록해요. Undo Segment에는 커밋되지 않은, 또는 최근에 커밋된 트랜잭션이 바꾼 데이터의 이전 값이 들어 있어요.',
    crCloneTitle: 'CR Clone은 어떻게 만들어지나요?',
    crCloneDesc:
      'SELECT가 SCN 10023 시점에서 시작됐는데, 읽으려는 블록의 SCN이 10024라면 Oracle은 어떻게 할까요? 해당 블록을 새 버퍼에 복사한 다음 Undo 데이터를 적용해서 이전 버전을 재구성해요. 이렇게 다시 만들어진 블록을 CR Clone(Consistent Read Clone, 일관된 읽기 복사본)이라고 해요.',
    statementVsTransaction: '문장 수준 vs 트랜잭션 수준 읽기 일관성',
    statementVsTransactionDesc:
      '읽기 일관성은 문장 수준(Statement-Level)과 트랜잭션 수준(Transaction-Level) 두 가지가 있어요. Oracle은 기본적으로 문장 수준 읽기 일관성을 제공해요.',
    undoTitle: 'ORA-01555: snapshot too old',
    undoDesc:
      'Undo 데이터가 덮어씌워지기 전에 오래된 쿼리의 CR Clone이 필요하면 ORA-01555: snapshot too old 오류가 발생해요. UNDO_RETENTION 파라미터로 Undo 보관 기간을 늘려서 예방할 수 있어요.',
    snapshotTooOldCause:
      '원인: Undo Segment가 재사용될 때 쿼리가 아직 이전 버전을 필요로 하는 상황이에요. 특히 오래 실행되는 배치 쿼리나 SERIALIZABLE 트랜잭션에서 자주 발생해요.',
  },
  en: {
    title: 'MVCC',
    titleSub: 'Multi-Version Concurrency Control',
    titleDesc: '— Multiversion Read Consistency',
    subtitle:
      'Oracle maintains multiple simultaneous versions of data blocks so reads and writes never block each other.',
    overviewTitle: 'What is Read Consistency?',
    overviewDesc:
      "Oracle uses a multiversion consistency model. The database can present a view of data to multiple concurrent users, with each view consistent to a point in time. Because different versions of data blocks can exist simultaneously, transactions can read the version of data committed at the point in time required by a query.",
    guarantees: 'Three Guarantees of Read Consistency',
    guaranteeItems: [
      {
        num: '1',
        color: 'bg-blue-500',
        title: 'Only committed data is read',
        text: 'Oracle never permits a dirty read, which occurs when a transaction reads uncommitted data in another transaction.',
      },
      {
        num: '2',
        color: 'bg-indigo-500',
        title: 'Single point-in-time consistency',
        text: 'Data returned by a query is committed and consistent for a single point in time. Changes committed while the query runs are not visible.',
      },
      {
        num: '3',
        color: 'bg-violet-500',
        title: 'Readers and writers never block each other',
        text: "Oracle's queries never force other queries or DML to wait. Readers don't block writers, and writers don't block readers.",
      },
    ],
    howTitle: 'How does MVCC work?',
    howDesc:
      'Whenever a user modifies data, Oracle creates undo entries, which it writes to undo segments. The undo segments contain the old values of data that have been changed by uncommitted or recently committed transactions.',
    crCloneTitle: 'How CR Clones are Created',
    crCloneDesc:
      "Suppose a SELECT starts at SCN 10023 but the block it needs has SCN 10024. Oracle copies the current block to a new buffer and applies undo data to reconstruct the earlier version. These reconstructed data blocks are called consistent read (CR) clones.",
    statementVsTransaction: 'Statement-Level vs Transaction-Level Consistency',
    statementVsTransactionDesc:
      'Read consistency comes in two forms: statement-level and transaction-level. Oracle provides statement-level read consistency by default.',
    undoTitle: 'ORA-01555: snapshot too old',
    undoDesc:
      "If undo data is overwritten before a long-running query's CR Clone can be constructed, ORA-01555: snapshot too old is raised. Increase UNDO_RETENTION to keep undo data longer.",
    snapshotTooOldCause:
      'Cause: An undo segment is reused while the query still needs the older version. Occurs most often in long-running batch queries or SERIALIZABLE transactions.',
  },
}

// CR Clone 생성 과정 다이어그램
const CRCloneDiagram = ({ lang }: { lang: 'ko' | 'en' }) => {
  const isKo = lang === 'ko'

  // ── 레이아웃 상수 ──
  const W = 1400
  const TIMELINE_Y = 90
  // SCN 눈금: 10020~10025, 간격 210px, 시작 x=110
  const scnX = (i: number) => 110 + i * 210

  // SELECT 박스: SCN 10023 = index 3  → cx = 740
  const SEL_CX = scnX(3)
  const SEL_BOX_W = 260
  const SEL_BOX_X = SEL_CX - SEL_BOX_W / 2
  const SEL_BOX_Y = 130
  const SEL_BOX_H = 66

  // UPDATE 박스: SCN 10024 = index 4  → cx = 950
  // 두 박스 간격: 950 - (740+130) = 80px → 충분히 분리됨
  const UPD_CX = scnX(4)
  const UPD_BOX_W = 270
  const UPD_BOX_X = UPD_CX - UPD_BOX_W / 2
  const UPD_BOX_Y = 130
  const UPD_BOX_H = 66

  // 하단 블록 행 — 3등분, 패딩 30px, 간격 80px
  const BLOCK_Y = 290
  const BLOCK_H = 116
  const BLK_PAD = 30
  const BLK_GAP = 80
  const BLK_W = (W - BLK_PAD * 2 - BLK_GAP * 2) / 3
  const BLK = [
    { x: BLK_PAD,                         w: BLK_W, fill: '#fee2e2', stroke: '#fca5a5' },
    { x: BLK_PAD + BLK_W + BLK_GAP,       w: BLK_W, fill: '#fef9c3', stroke: '#fde68a' },
    { x: BLK_PAD + (BLK_W + BLK_GAP) * 2, w: BLK_W, fill: '#dcfce7', stroke: '#86efac' },
  ]
  const blkCx = (i: number) => BLK[i].x + BLK[i].w / 2

  // 화살표 y (블록 중간)
  const ARR_Y = BLOCK_Y + BLOCK_H / 2

  // 요약 박스
  const SUM_Y = BLOCK_Y + BLOCK_H + 36
  const SUM_H = 78

  const TOTAL_H = SUM_Y + SUM_H + 20

  return (
    <svg
      viewBox={`0 0 ${W} ${TOTAL_H}`}
      className="w-full mx-auto"
      aria-label="CR Clone creation diagram"
    >
      <defs>
        <marker id="mvcc-arr1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
        </marker>
        <marker id="mvcc-arr2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
        </marker>
      </defs>

      {/* ── SCN 타임라인 ── */}
      <line x1="60" y1={TIMELINE_Y} x2={W - 30} y2={TIMELINE_Y} stroke="#94a3b8" strokeWidth="3" />
      <text x="52" y={TIMELINE_Y - 10} fontSize="18" fill="#64748b" textAnchor="end" fontWeight="bold">SCN</text>
      {[10020, 10021, 10022, 10023, 10024, 10025].map((scn, i) => (
        <g key={scn}>
          <line x1={scnX(i)} y1={TIMELINE_Y - 8} x2={scnX(i)} y2={TIMELINE_Y + 8} stroke="#94a3b8" strokeWidth="2.5" />
          <text x={scnX(i)} y={TIMELINE_Y + 28} fontSize="16" fill="#64748b" textAnchor="middle">{scn}</text>
        </g>
      ))}

      {/* ── SELECT 시작 (SCN 10023) ── */}
      <circle cx={SEL_CX} cy={TIMELINE_Y} r="13" fill="#3b82f6" />
      <line x1={SEL_CX} y1={TIMELINE_Y + 13} x2={SEL_CX} y2={SEL_BOX_Y} stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6,5" />
      <rect x={SEL_BOX_X} y={SEL_BOX_Y} width={SEL_BOX_W} height={SEL_BOX_H} rx="11" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2.5" />
      <text x={SEL_CX} y={SEL_BOX_Y + 26} fontSize="19" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        {isKo ? 'SELECT 시작' : 'SELECT starts'}
      </text>
      <text x={SEL_CX} y={SEL_BOX_Y + 50} fontSize="17" fill="#3b82f6" textAnchor="middle">SCN = 10023</text>

      {/* ── 다른 세션 UPDATE (SCN 10024) ── */}
      <circle cx={UPD_CX} cy={TIMELINE_Y} r="13" fill="#f59e0b" />
      <line x1={UPD_CX} y1={TIMELINE_Y + 13} x2={UPD_CX} y2={UPD_BOX_Y} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6,5" />
      <rect x={UPD_BOX_X} y={UPD_BOX_Y} width={UPD_BOX_W} height={UPD_BOX_H} rx="11" fill="#fffbeb" stroke="#fde68a" strokeWidth="2.5" />
      <text x={UPD_CX} y={UPD_BOX_Y + 26} fontSize="19" fill="#d97706" textAnchor="middle" fontWeight="bold">
        {isKo ? '다른 세션 UPDATE' : 'Another session UPDATE'}
      </text>
      <text x={UPD_CX} y={UPD_BOX_Y + 50} fontSize="17" fill="#d97706" textAnchor="middle">
        {isKo ? '블록 SCN → 10024' : 'Block SCN → 10024'}
      </text>

      {/* ── 현재 블록 ── */}
      <rect x={BLK[0].x} y={BLOCK_Y} width={BLK[0].w} height={BLOCK_H} rx="14" fill={BLK[0].fill} stroke={BLK[0].stroke} strokeWidth="2.5" />
      <text x={blkCx(0)} y={BLOCK_Y + 34} fontSize="19" fill="#dc2626" textAnchor="middle" fontWeight="bold">
        {isKo ? '현재 블록' : 'Current Block'}
      </text>
      <text x={blkCx(0)} y={BLOCK_Y + 60} fontSize="17" fill="#ef4444" textAnchor="middle">SCN 10024</text>
      <text x={blkCx(0)} y={BLOCK_Y + 86} fontSize="17" fill="#ef4444" textAnchor="middle">
        {isKo ? 'sal = 7000 (변경됨)' : 'sal = 7000 (modified)'}
      </text>

      {/* ── Undo Segment ── */}
      <rect x={BLK[1].x} y={BLOCK_Y} width={BLK[1].w} height={BLOCK_H} rx="14" fill={BLK[1].fill} stroke={BLK[1].stroke} strokeWidth="2.5" />
      <text x={blkCx(1)} y={BLOCK_Y + 34} fontSize="19" fill="#92400e" textAnchor="middle" fontWeight="bold">Undo Segment</text>
      <text x={blkCx(1)} y={BLOCK_Y + 60} fontSize="17" fill="#92400e" textAnchor="middle">
        {isKo ? '원본: sal = 6200' : 'Original: sal = 6200'}
      </text>
      <text x={blkCx(1)} y={BLOCK_Y + 86} fontSize="17" fill="#78350f" textAnchor="middle">
        {isKo ? '(SCN 10023 이전 값)' : '(value before SCN 10023)'}
      </text>

      {/* ── CR Clone ── */}
      <rect x={BLK[2].x} y={BLOCK_Y} width={BLK[2].w} height={BLOCK_H} rx="14" fill={BLK[2].fill} stroke={BLK[2].stroke} strokeWidth="2.5" />
      <text x={blkCx(2)} y={BLOCK_Y + 34} fontSize="19" fill="#15803d" textAnchor="middle" fontWeight="bold">CR Clone</text>
      <text x={blkCx(2)} y={BLOCK_Y + 60} fontSize="17" fill="#16a34a" textAnchor="middle">
        {isKo ? 'sal = 6200 (재구성)' : 'sal = 6200 (reconstructed)'}
      </text>
      <text x={blkCx(2)} y={BLOCK_Y + 86} fontSize="17" fill="#15803d" textAnchor="middle">
        {isKo ? '← SELECT에 반환' : '← returned to SELECT'}
      </text>

      {/* ── 화살표: 현재 블록 → Undo ── */}
      <line
        x1={BLK[0].x + BLK[0].w} y1={ARR_Y}
        x2={BLK[1].x - 6} y2={ARR_Y}
        stroke="#f87171" strokeWidth="3" fill="none"
        markerEnd="url(#mvcc-arr1)"
      />
      <text x={(BLK[0].x + BLK[0].w + BLK[1].x) / 2} y={ARR_Y - 10} fontSize="16" fill="#ef4444" textAnchor="middle" fontWeight="bold">
        {isKo ? '복사' : 'copy'}
      </text>

      {/* ── 화살표: Undo → CR Clone ── */}
      <line
        x1={BLK[1].x + BLK[1].w} y1={ARR_Y}
        x2={BLK[2].x - 6} y2={ARR_Y}
        stroke="#fbbf24" strokeWidth="3" fill="none"
        markerEnd="url(#mvcc-arr2)"
      />
      <text x={(BLK[1].x + BLK[1].w + BLK[2].x) / 2} y={ARR_Y - 10} fontSize="16" fill="#d97706" textAnchor="middle" fontWeight="bold">
        {isKo ? 'Undo 적용' : 'apply undo'}
      </text>

      {/* ── 하단 요약 박스 ── */}
      <rect x="24" y={SUM_Y} width={W - 48} height={SUM_H} rx="14" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2.5" />
      <text x={W / 2} y={SUM_Y + 30} fontSize="19" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">
        {isKo
          ? 'SELECT는 SCN 10023 시점의 일관된 데이터를 봐요 — 대기 없음'
          : 'SELECT sees data consistent as of SCN 10023 — no waiting'}
      </text>
      <text x={W / 2} y={SUM_Y + 58} fontSize="17" fill="#3b82f6" textAnchor="middle">
        {isKo
          ? 'UPDATE가 진행 중이어도 SELECT는 즉시 이전 버전을 반환해요'
          : 'Even while UPDATE is in progress, SELECT immediately returns the prior version'}
      </text>
    </svg>
  )
}

export function MvccSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconHistory size={36} stroke={1.5} className="text-blue-500" />}
        title={
          <span className="flex items-baseline gap-2 flex-wrap">
            {t.title}
            <span className="text-base font-normal text-muted-foreground tracking-normal whitespace-nowrap">
              {t.titleSub}
            </span>
            <span className="text-2xl whitespace-nowrap">{t.titleDesc}</span>
          </span>
        }
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>

      <div className="mt-4 space-y-3 mb-6">
        {t.guaranteeItems.map((item) => (
          <div key={item.num} className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                item.color,
              )}
            >
              {item.num}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <Prose>{t.howDesc}</Prose>

      <Divider />

      <SectionTitle>{t.crCloneTitle}</SectionTitle>
      <Prose>{t.crCloneDesc}</Prose>

      <div className="w-full my-6 rounded-xl border border-blue-100 bg-blue-50/40 p-6">
        <CRCloneDiagram lang={lang} />
      </div>

      <Divider />

      <SectionTitle>{t.statementVsTransaction}</SectionTitle>
      <Prose>{t.statementVsTransactionDesc}</Prose>
      <Table
        headers={[
          lang === 'ko' ? '구분' : 'Level',
          lang === 'ko' ? '일관성 기준 시점' : 'Consistency Point',
          lang === 'ko' ? '설명' : 'Description',
          lang === 'ko' ? '설정 방법' : 'How to Set',
        ]}
        rows={
          lang === 'ko'
            ? [
                [
                  'Statement-Level\n(문장 수준)',
                  '각 SELECT 문 시작 시점',
                  '기본값. 문장이 시작된 SCN 기준. 같은 트랜잭션 내라도 다음 SELECT에서는 새로 커밋된 데이터가 보일 수 있음',
                  '— (기본 동작)',
                ],
                [
                  'Transaction-Level\n(트랜잭션 수준)',
                  '트랜잭션 시작 시점',
                  '트랜잭션 전체가 동일한 SCN 기준. 팬텀 리드 없음. SET TRANSACTION 또는 ALTER SESSION으로 설정',
                  'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE',
                ],
              ]
            : [
                [
                  'Statement-Level',
                  'Each SELECT start time',
                  "Default. Based on SCN when statement opens. Even within the same transaction, the next SELECT may see newly committed data.",
                  '— (default behavior)',
                ],
                [
                  'Transaction-Level',
                  'Transaction start time',
                  'Entire transaction uses one SCN. No phantom reads. Set with SET TRANSACTION or ALTER SESSION.',
                  'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE',
                ],
              ]
        }
      />

      <Divider />

      <div className="mt-8">
        <InfoBox variant="warning">
          <strong>{t.undoTitle}</strong>
          <br />
          {t.undoDesc}
          <br />
          <span className="text-xs mt-1 block opacity-80">{t.snapshotTooOldCause}</span>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
