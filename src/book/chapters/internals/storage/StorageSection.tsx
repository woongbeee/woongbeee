import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, Prose, SubTitle,
  InfoBox, Table, ConceptGrid, AccordionSection, Divider,
} from '../../shared'
import { cn } from '@/lib/utils'
import { IconCube, IconArrowDown, IconArrowUp, IconArrowsVertical } from '@tabler/icons-react'

// ── Diagram primitives ────────────────────────────────────────────────────
// 통일된 무드: 헤어라인 1px 경계 · 채움 없는 paper 바탕 · 좌측 3px 색선으로 계층 식별.
// 폰트 규칙: 한글·문장 = font-sans, 코드·크기·식별자만 = font-mono.
// SVG 안에서도 동일 — 루트에 var(--font-sans-active), 식별자 text 에만 var(--font-mono).

type TierKey = 'block' | 'extent' | 'segment' | 'tablespace'

const TIER: Record<TierKey, { accent: string; chip: string; fg: string; tint: string; line: string }> = {
  block:      { accent: 'border-l-viz-amber',  chip: 'bg-viz-amber',  fg: 'text-viz-amber',  tint: 'bg-viz-amber/12',  line: 'border-viz-amber/70' },
  extent:     { accent: 'border-l-viz-green',  chip: 'bg-viz-green',  fg: 'text-viz-green',  tint: 'bg-viz-green/12',  line: 'border-viz-green/70' },
  segment:    { accent: 'border-l-viz-purple', chip: 'bg-viz-purple', fg: 'text-viz-purple', tint: 'bg-viz-purple/12', line: 'border-viz-purple/70' },
  tablespace: { accent: 'border-l-viz-blue',   chip: 'bg-viz-blue',   fg: 'text-viz-blue',   tint: 'bg-viz-blue/12',   line: 'border-viz-blue/70' },
}

function DiagramFrame({
  tier, badge, note, children, className,
}: {
  tier: TierKey
  badge: string
  note: string
  children: ReactNode
  className?: string
}) {
  const c = TIER[tier]
  return (
    <figure className={cn('my-5 overflow-x-auto rounded-panel border border-line border-l-4 bg-paper p-4', c.accent, className)}>
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('shrink-0 rounded-chip px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-paper', c.chip)}>
          {badge}
        </span>
        <span className="font-sans text-[12px] leading-tight text-ink-2">{note}</span>
      </figcaption>
      {children}
    </figure>
  )
}

// ── Intro paragraph ────────────────────────────────────────────────────────

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-ink">{children}</strong>
)
const Hi = ({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'amber' | 'teal' | 'orange' | 'violet' }) => {
  const cls = {
    blue:   'text-blue font-semibold',
    amber:  'text-amber font-semibold',
    teal:   'text-green font-semibold',
    orange: 'text-amber font-semibold',
    violet: 'text-purple font-semibold',
  }[color]
  return <span className={cls}>{children}</span>
}

const INTRO_KO = (
  <div className="space-y-3 mb-6 text-[14px] leading-relaxed text-ink-2">
    <p>
      앞 챕터에서 Oracle이 데이터를 읽을 때 <Hi color="blue">블록(Block) 단위</Hi>로 가져온다고 배웠어요.
      그렇다면 <Hi color="orange">블록 안에는 데이터가 어떤 구조로 들어 있길래</Hi> 원하는 행을 바로 찾을 수 있을까요?
    </p>
    <p>
      만약 행들을 그냥 줄줄이 이어 붙여 놓았다면, Oracle은 블록 전체를 처음부터 훑어야 할 거예요.
      하지만 실제 블록에는 <B>헤더·트랜잭션 슬롯·행 위치 포인터</B>가 정해진 자리에 담겨 있어요.
      Oracle은 <Hi color="teal">ROWID</Hi> 하나만 알면 <B>어느 파일의 몇 번 블록의 몇 번 슬롯</B>인지 바로 계산해서
      원하는 행으로 곧장 점프해요.
    </p>
    <p>
      블록들이 모여 <Hi color="teal">Extent</Hi>(연속 블록 묶음)가 되고, Extent들이 모여 테이블·인덱스 단위의 <Hi color="violet">Segment</Hi>가 돼요.
      그리고 Segment들의 논리적 그릇이 <Hi color="blue">Tablespace</Hi>예요.
      이 <B>Block → Extent → Segment → Tablespace</B> 4계층이 Oracle이 저장 공간을 관리하는 방식이에요.
      각 계층은 <B>논리적 단위</B>(Oracle 내부 개념)이고, 실제 파일 시스템에는 <B>.dbf 데이터 파일</B>로만 존재해요.
    </p>
    <p className="text-[14px] text-ink-2/70">가장 작은 단위인 Block부터 하나씩 살펴봐요.</p>
  </div>
)

const INTRO_EN = (
  <div className="space-y-3 mb-6 text-[14px] leading-relaxed text-ink-2">
    <p>
      In the previous chapter you learned that Oracle always fetches data in <Hi color="blue">Block</Hi> units.
      But <Hi color="orange">what structure lives inside a Block</Hi> that lets Oracle find any row instantly?
    </p>
    <p>
      If rows were simply packed end-to-end, Oracle would have to scan the whole Block from the start.
      Instead, every Block carries a <B>header, transaction slots, and a row-pointer directory</B> in fixed positions.
      With just a <Hi color="teal">ROWID</Hi>, Oracle can compute <B>exactly which file, block, and slot</B> holds
      the target row and jump there directly.
    </p>
    <p>
      Blocks group into <Hi color="teal">Extents</Hi> (contiguous block runs), Extents accumulate into <Hi color="violet">Segments</Hi> (one per table, index, or other object),
      and Segments are organized inside a <Hi color="blue">Tablespace</Hi>.
      This <B>Block → Extent → Segment → Tablespace</B> four-tier hierarchy is how Oracle manages all storage.
      The tiers are <B>logical units</B> (Oracle's internal concept) — on disk they exist only as <B>.dbf data files</B>.
    </p>
    <p className="text-[14px] text-ink-2/70">Click each section below to explore the tiers one by one.</p>
  </div>
)


// ── Bilingual strings ──────────────────────────────────────────────────────

const STORAGE_T = {
  ko: {
    sectionTitle: '데이터 저장 구조',

    blockTitle: 'Block — 최소 I/O 단위',

    rowidTitle: 'ROWID — 행의 물리적 주소',
    rowidDesc: 'ROWID는 Oracle이 테이블의 각 행에 부여하는 고유한 물리적 주소예요. 실제 컬럼 값으로 저장되지 않고, 파일·블록·슬롯 위치로부터 즉석에서 계산돼요.\n\nExtended ROWID는 Base64로 인코딩된 18자리 문자열로, 4개 구성 요소로 이루어져요.',
    rowidFormat: [
      ['OOOOOO (6자)', '데이터 오브젝트 번호 — 이 행이 속한 Segment(테이블/인덱스) 식별자', '예: AAAPec'],
      ['FFF (3자)', 'Tablespace 상대 파일 번호 — 데이터베이스 내 파일 식별자', '예: AAF'],
      ['BBBBBB (6자)', '파일 내 블록 번호 — 파일 기준 블록 위치', '예: AAAABS'],
      ['RRR (3자)', '블록 내 Row Directory 슬롯 번호 — O(1) 접근의 핵심', '예: AAA'],
    ],
    rowidNote: 'ROWID는 행이 블록 내에서 이동해도 변하지 않아요(Row Directory 포인터가 대신 갱신돼요). 단, 파티션 키 업데이트·Flashback Table·Shrink 작업 시에는 변경될 수 있어요.',

    extentTitle: 'Extent — 연속 블록의 묶음',
    extentDesc: 'Block들이 모여 만들어지는 첫 번째 묶음 단위예요. Oracle은 테이블이나 인덱스에 공간이 필요할 때 행 하나씩이 아니라 Extent 단위로 한꺼번에 할당해요. Extent 안의 블록들은 논리적으로 연속된 주소에 놓이지만, RAID 스트라이핑 등으로 물리적으로는 분산될 수도 있어요.\n\n중요한 제약이 하나 있어요. Extent는 반드시 하나의 데이터 파일 안에만 존재해야 해요. 여러 파일에 걸쳐질 수는 없어요. 반면 한 Segment의 Extent들은 같은 Tablespace 안의 여러 파일에 분산될 수 있어요.\n\nOracle의 기본 Extent 크기는 8개 블록(64 KB)이에요. 너무 작으면 공간 할당을 자주 반복해서 오버헤드가 커지고, 너무 크면 작은 테이블도 불필요하게 큰 공간을 차지하게 되는데, 64 KB는 그 사이의 절충점으로 Oracle이 설계한 값이에요.\n\nLMT(Locally Managed Tablespace, 로컬 관리 테이블스페이스)의 AUTOALLOCATE 모드에서는 Segment가 커질수록 Extent 크기를 자동으로 늘려줘요. 이렇게 단계적으로 키우는 이유는 작은 테이블은 공간 낭비 없이 시작하고, 대형 테이블은 Extent 수가 너무 많아지지 않도록 하기 위해서예요.',
    extentSizeDesc: 'Extent 하나에 들어있는 블록 수와 크기는 Tablespace 관리 방식에 따라 달라져요. LMT(Locally Managed Tablespace)에서 AUTOALLOCATE를 쓰면 Oracle이 Segment 크기에 맞게 자동으로 64 KB → 1 MB → 8 MB → 64 MB 순으로 Extent를 키워나가요. UNIFORM SIZE를 지정하면 처음부터 끝까지 같은 크기(예: 1 MB)로 고정돼요.',
    extentSizeTable: [
      ['첫 번째 Extent', '64 KB (블록 8KB 기준 → 8개 블록)', 'AUTOALLOCATE 초기값'],
      ['두 번째~넷째', '64 KB 유지', '1 MB 미만 Segment'],
      ['다섯 번째 이후', '1 MB (128블록)', '1 MB 이상 Segment부터 자동 확장'],
      ['더 커지면', '8 MB, 64 MB 순으로 증가', '대형 테이블 순차 I/O 최적화'],
      ['UNIFORM SIZE 1 MB', '128블록 고정', '수동 지정 시 처음부터 끝까지 동일'],
    ],
    extentParamDesc: 'Extent 동작을 제어하는 주요 스토리지 파라미터예요. CREATE TABLE / CREATE TABLESPACE 구문에서 지정하거나, Locally Managed 방식이면 대부분 Oracle이 자동으로 관리해요.',
    extentParams: [
      ['INITIAL', 'Segment가 처음 생성될 때 할당되는 첫 번째 Extent 크기예요. 기본값은 Tablespace 설정에 따라 64 KB ~ 1 MB예요.'],
      ['NEXT', '두 번째 이후 Extent 크기예요. DMT(Dictionary Managed Tablespace) 방식에서만 의미 있고, LMT(Locally Managed)에서는 Oracle이 무시해요.'],
      ['MINEXTENTS', 'Segment 생성 시 미리 확보할 최소 Extent 수예요. 기본값 1. 큰 테이블을 만들 때 미리 늘려두면 점진적 확장 오버헤드를 줄일 수 있어요.'],
      ['MAXEXTENTS', 'Segment가 가질 수 있는 최대 Extent 수예요. UNLIMITED를 권장해요. 너무 작게 지정하면 "ORA-01628: max # extents reached" 오류가 발생해요.'],
      ['PCTINCREASE', '매 Extent 할당 시 크기를 몇 % 씩 키울지 설정해요. DMT(Dictionary Managed Tablespace) 전용이에요. LMT(Locally Managed)에서는 무시되고 0으로 고정돼요.'],
      ['UNIFORM SIZE', 'CREATE TABLESPACE 시 지정해요. 해당 Tablespace의 모든 Extent를 동일 크기로 강제해요. 예: EXTENT MANAGEMENT LOCAL UNIFORM SIZE 1M.'],
    ],

    segmentTitle: 'Segment — 오브젝트 저장 공간',
    segmentDesc: 'Extent들이 모여 하나의 Segment가 돼요. Segment는 테이블·인덱스처럼 데이터베이스 오브젝트 하나와 1:1로 대응해요. EMPLOYEES 테이블을 만들면 Oracle은 그 테이블 전용 Segment를 하나 만들고, 거기에 Extent를 할당해줘요.\n\n처음엔 작은 Extent 하나로 시작하지만, 데이터가 쌓여서 꽉 차면 Oracle이 자동으로 새 Extent를 붙여서 Segment를 늘려요. 파티션 테이블은 파티션 하나당 Segment 하나가 생겨요.\n\nOracle 11g 이후에는 기본적으로 지연 Segment 생성(Deferred Segment Creation)이 적용돼요. CREATE TABLE 시점에는 메타데이터만 만들고, 첫 번째 INSERT가 일어날 때 실제 Segment(디스크 공간)가 할당돼요. 수천 개의 테이블을 만드는 설치 스크립트가 불필요한 공간을 차지하지 않도록 설계된 동작이에요.',
    segmentGrowthDesc: 'Segment는 데이터가 늘어날수록 자동으로 Extent를 추가하며 성장해요. 아래는 EMPLOYEES 테이블의 Segment가 커지는 과정이에요.',
    hwmTitle: 'HWM — High Water Mark',
    hwmDesc: 'HWM(High Water Mark, 최고 수위 표시)은 Segment 안에서 "한 번이라도 데이터가 쓰인 적 있는 마지막 블록"의 경계선이에요. HWM 위쪽은 한 번도 사용된 적 없는 미포맷 블록이고, HWM 아래쪽은 현재 데이터가 있거나 DELETE로 비워진 블록이에요.\n\nHWM의 핵심은 한 번 올라가면 절대 내려오지 않는다는 거예요. 테이블에서 모든 행을 DELETE해도 HWM은 그대로예요. Full Table Scan(전체 테이블 스캔)은 HWM까지의 모든 블록을 읽기 때문에, 대량 삭제 후에도 스캔 비용이 줄지 않아요.\n\nHWM을 실제로 낮추려면 TRUNCATE TABLE, ALTER TABLE ... SHRINK SPACE, 또는 테이블을 재생성(MOVE)해야 해요.\n\nASSM(Automatic Segment Space Management, 자동 세그먼트 공간 관리)에서는 HWM와 Low HWM 두 개의 경계가 있어요. Low HWM 아래는 포맷이 완전히 끝난 블록이고, Low HWM~HWM 사이는 할당은 됐지만 일부만 포맷된 구간이에요. Full Table Scan은 이 구조를 활용해서 Low HWM까지는 연속으로 읽고, 그 위는 포맷된 블록만 골라 읽어요.',
    segmentTypes: [
      { icon: '🗄', title: 'Table Segment', desc: '일반 테이블의 행 데이터를 저장해요. CREATE TABLE 시 자동 생성돼요. LOB 컬럼이 있으면 LOB 데이터·인덱스 Segment가 별도로 추가돼요.', color: 'blue' },
      { icon: '🔍', title: 'Index Segment', desc: 'B-Tree·Bitmap 인덱스 구조를 저장해요. CREATE INDEX 시 자동 생성돼요. 인덱스 생성 중에는 임시로 Temp Segment가 사용되다가 완성 후 영구 Segment로 전환돼요.', color: 'violet' },
      { icon: '↩', title: 'Undo Segment', desc: 'ROLLBACK과 Read Consistency를 위해 변경 전 이미지(before-image)를 보관해요. Ring 구조로 Extent를 순환 재사용하고, Undo Tablespace가 자동으로 관리해요.', color: 'orange' },
      { icon: '📦', title: 'Temp Segment', desc: '정렬·해시 조인·비트맵 병합 등 임시 작업 공간이에요. 쿼리가 끝나면 자동 반환돼요. Temporary Tablespace에 할당되며 Redo 로그를 생성하지 않아요.', color: 'emerald' },
    ],

    tablespaceTitle: 'Tablespace — 논리적 저장 컨테이너',
    tablespaceDesc: 'Segment들을 담는 논리적 그릇이에요. 물리적으로는 한 개 이상의 .dbf 데이터 파일로 이루어져 있지만, DBA는 파일 경로 대신 Tablespace 이름만으로 공간을 관리해요.\n\n예를 들어 EMPLOYEES 테이블을 USERS Tablespace에 만들면, Oracle은 USERS Tablespace에 속한 .dbf 파일 어딘가에 EMPLOYEES Segment를 배치해요. DBA는 users01.dbf가 어디 있는지 몰라도 되고, 공간이 부족하면 파일을 추가하거나 Autoextend를 켜서 늘리기만 하면 돼요.',
    tablespaceTypeTitle: 'Tablespace의 세 가지 유형',
    tablespaceTypes: [
      { icon: '💾', title: 'Permanent', desc: '테이블·인덱스·LOB 등 영구 스키마 오브젝트를 저장해요. SYSTEM·SYSAUX·USERS가 대표적인 예예요.', color: 'blue' },
      { icon: '⏱', title: 'Temporary', desc: '정렬·해시·비트맵 병합 임시 데이터를 저장해요. Redo 로그는 생성하지 않고, 쿼리가 끝나면 자동으로 해제돼요. Tempfile을 사용해요.', color: 'teal' },
      { icon: '↩', title: 'Undo', desc: 'Undo Segment 전용이에요. 시스템이 자동으로 관리하고, UNDO_TABLESPACE 파라미터로 지정해요. AUTOEXTEND ON을 권장해요.', color: 'orange' },
    ],
    tablespaceFileDesc: 'Tablespace마다 용도가 달라요. Oracle이 기본으로 만드는 주요 Tablespace는 아래와 같아요.',
    tablespaceTable: [
      ['SYSTEM', '데이터 딕셔너리를 저장해요(테이블·인덱스 메타데이터). 항상 온라인 상태예요. 사용자 오브젝트를 저장하면 안 돼요.'],
      ['SYSAUX', 'AWR 통계, Streams 등 Oracle 내부 컴포넌트 데이터를 저장해요. SYSTEM의 보조 공간이에요.'],
      ['UNDO', 'Undo 데이터 전용이에요. UNDO_TABLESPACE 파라미터로 어느 것을 쓸지 지정해요.'],
      ['TEMP', '정렬·해시 조인 임시 데이터를 저장해요. 트랜잭션이 끝나면 공간이 자동으로 해제돼요.'],
      ['USERS', 'DBA가 만드는 사용자 데이터용 공간이에요. 대부분의 애플리케이션 테이블이 여기에 들어가요.'],
    ],
    lmtTitle: 'LMT vs DMT — Tablespace 관리 방식 비교',
    lmtDesc: 'Tablespace가 여유 공간을 추적하는 방식에는 두 가지가 있어요. LMT(Locally Managed Tablespace, 로컬 관리 테이블스페이스)와 DMT(Dictionary Managed Tablespace, 딕셔너리 관리 테이블스페이스)예요. Oracle 10g 이후에는 LMT가 기본이자 표준이에요.',
    lmtTable: [
      ['관리 방식', 'LMT (Locally Managed)', 'DMT (Dictionary Managed)'],
      ['여유 공간 추적', '데이터 파일 헤더의 비트맵', '데이터 딕셔너리 테이블'],
      ['Extent 할당', '비트맵 업데이트 (빠름)', '딕셔너리 SQL 실행 (느림)'],
      ['재귀 SQL', '없음', '있음 (직렬화 병목)'],
      ['인접 공간 병합', '자동 (비트맵 기반)', '수동 COALESCE 필요'],
      ['권장 여부', '✅ 현재 표준', '⚠️ Deprecated — 사용 금지'],
    ],
    assmTitle: 'ASSM vs MSSM — Segment 공간 관리 방식',
    assmDesc: 'Tablespace 안에서 각 블록의 여유 공간을 추적하는 방법도 두 가지예요. ASSM(Automatic Segment Space Management, 자동 세그먼트 공간 관리)과 MSSM(Manual Segment Space Management, 수동 세그먼트 공간 관리)이에요. 현대 Oracle에서는 ASSM이 기본이에요.',
    assmTable: [
      ['관리 방식', 'ASSM (Automatic)', 'MSSM (Manual, Legacy)'],
      ['여유 공간 추적', '비트맵 (블록별)', 'Freelist (연결 리스트)'],
      ['필요 파라미터', 'PCTFREE만 설정', 'PCTFREE + PCTUSED + FREELISTS + FREELIST GROUPS'],
      ['동시성', '높음 (별도 Freelist 검색)', '낮음 (공유 Freelist 경합)'],
      ['RAC 지원', '동적 인스턴스 친화성', '수동 FREELIST GROUPS 설정'],
      ['권장 여부', '✅ 기본값·권장', '⚠️ Legacy — 신규 사용 금지'],
    ],
    tablespaceNote: 'DBA는 Tablespace에 파일을 추가(ALTER TABLESPACE ... ADD DATAFILE)하거나 AUTOEXTEND ON을 설정해서 공간이 자동으로 늘어나게 할 수 있어요. 여러 .dbf 파일에 걸쳐 있어도 Oracle이 하나의 논리적 공간으로 합쳐서 관리해요.',

    infoTitle: '핵심 정리',
    infoBody: 'Block이 I/O의 기본 단위이고, Extent가 할당의 기본 단위이며, Segment가 오브젝트와 1:1로 대응하고, Tablespace가 DBA 관리의 논리 단위예요. ROWID = 오브젝트#+파일#+블록#+슬롯# 4요소로 행 위치를 O(1)에 특정해요.',
  },
  en: {
    sectionTitle: 'Data Storage Structure',

    blockTitle: 'Block — Smallest I/O Unit',

    rowidTitle: 'ROWID — Physical Address of a Row',
    rowidDesc: 'A ROWID is the unique physical address Oracle assigns to every row in a table. It is not stored as a column value — Oracle derives it on-the-fly from the file, block, and slot position of the row.\n\nThe Extended ROWID is an 18-character Base64-encoded string made up of four components.',
    rowidFormat: [
      ['OOOOOO (6 chars)', 'Data object number — identifies the Segment (table/index) that owns this row', 'e.g. AAAPec'],
      ['FFF (3 chars)', 'Tablespace-relative file number — identifies the data file within the database', 'e.g. AAF'],
      ['BBBBBB (6 chars)', 'Block number within the file — relative to the data file, not the tablespace', 'e.g. AAAABS'],
      ['RRR (3 chars)', 'Row Directory slot number within the block — the key to O(1) access', 'e.g. AAA'],
    ],
    rowidNote: 'A ROWID stays constant when a row moves within a block (the Row Directory pointer is updated instead). It can change during partition key updates, Flashback Table operations, or segment shrink.',

    extentTitle: 'Extent — Group of Contiguous Blocks',
    extentDesc: 'An Extent is the first grouping above individual Blocks. When a table or index needs more space, Oracle allocates an entire Extent at once — not row by row. Blocks within an Extent are logically contiguous, though RAID striping may scatter them physically.\n\nOne important constraint: an Extent always resides within a single data file — it cannot span files. A Segment\'s Extents, however, can be spread across multiple data files within the same Tablespace.\n\nOracle\'s default Extent size is 8 blocks (64 KB). This is a deliberate design choice: too small and allocation overhead compounds quickly; too large and even tiny tables waste disk. 64 KB is Oracle\'s practical balance point.\n\nUnder LMT (Locally Managed Tablespace) AUTOALLOCATE, Oracle scales Extent sizes automatically as a Segment grows. The progressive sizing ensures small tables start lean while large tables don\'t accumulate an unmanageable number of tiny Extents.',
    extentSizeDesc: 'The number of blocks and the size of each Extent depend on how the Tablespace is managed. With AUTOALLOCATE (the default for LMT — Locally Managed Tablespaces), Oracle automatically scales Extent sizes from 64 KB → 1 MB → 8 MB → 64 MB as the Segment grows. With UNIFORM SIZE, every Extent in the tablespace stays the same size (e.g. 1 MB) from creation to the end.',
    extentSizeTable: [
      ['1st Extent', '64 KB (8 blocks at 8 KB each)', 'AUTOALLOCATE default'],
      ['2nd–4th Extents', 'Stay at 64 KB', 'Segment under 1 MB'],
      ['5th Extent onward', '1 MB (128 blocks)', 'Auto-promoted once segment exceeds 1 MB'],
      ['Grows further', '8 MB, then 64 MB', 'Optimises sequential I/O for large tables'],
      ['UNIFORM SIZE 1 MB', '128 blocks, fixed', 'Same size from first to last Extent'],
    ],
    extentParamDesc: 'Key storage parameters that control Extent behaviour. Set them in CREATE TABLE / CREATE TABLESPACE, or leave them to Oracle when using Locally Managed Tablespaces.',
    extentParams: [
      ['INITIAL', 'Size of the very first Extent when a Segment is created. Defaults to 64 KB – 1 MB depending on the tablespace setting.'],
      ['NEXT', 'Size of subsequent Extents. Only meaningful for DMT (Dictionary Managed Tablespace); ignored (overridden by Oracle) in LMT (Locally Managed).'],
      ['MINEXTENTS', 'Minimum number of Extents to pre-allocate at Segment creation. Default 1. Setting it higher avoids incremental growth overhead for large tables.'],
      ['MAXEXTENTS', 'Maximum Extents a Segment may hold. UNLIMITED is recommended. Too small a value causes "ORA-01628: max # extents reached".'],
      ['PCTINCREASE', 'Percentage to grow each successive Extent. DMT (Dictionary Managed Tablespace) only. Ignored and fixed at 0 in LMT (Locally Managed) tablespaces.'],
      ['UNIFORM SIZE', 'Specified at CREATE TABLESPACE level. Forces every Extent in the tablespace to the same size. E.g. EXTENT MANAGEMENT LOCAL UNIFORM SIZE 1M.'],
    ],

    segmentTitle: 'Segment — Object Storage Space',
    segmentDesc: 'Extents group together to form a Segment. Each Segment maps one-to-one to a database object — one table, one index, one Segment. When you create an EMPLOYEES table, Oracle allocates a dedicated Segment for it and assigns Extents to hold the rows.\n\nIt starts with a single small Extent. As data fills up, Oracle automatically adds new Extents to grow the Segment. Partitioned tables get one Segment per partition.\n\nSince Oracle 11g, Deferred Segment Creation is enabled by default. CREATE TABLE only creates metadata; the actual Segment (disk space) is allocated on the very first INSERT. This prevents installation scripts that create thousands of tables from wasting disk space.',
    segmentGrowthDesc: 'A Segment grows automatically by adding Extents as data accumulates. Here is how an EMPLOYEES table Segment expands over time.',
    hwmTitle: 'HWM — High Water Mark',
    hwmDesc: 'The HWM (High Water Mark) is the boundary in a Segment beyond which blocks have never been written to. Blocks above the HWM are unformatted and never used; blocks below it are either holding data or are empty from DELETE operations.\n\nThe critical characteristic: the HWM only moves up, never down. Even if you DELETE every row in a table, the HWM stays where it was. A Full Table Scan (FTS) reads every block up to the HWM, so scan cost does not decrease after mass deletes.\n\nTo actually lower the HWM you need TRUNCATE TABLE, ALTER TABLE ... SHRINK SPACE, or a table rebuild (MOVE).\n\nUnder ASSM (Automatic Segment Space Management) there are two boundaries: HWM and Low HWM. Everything below Low HWM is guaranteed formatted; the zone between Low HWM and HWM is allocated but partially formatted. Full Table Scans use this to read contiguously up to Low HWM, then selectively read only formatted blocks up to HWM.',
    segmentTypes: [
      { icon: '🗄', title: 'Table Segment', desc: 'Holds row data for a regular table. Created automatically with CREATE TABLE. LOB columns get their own separate LOB data and LOB index Segments.', color: 'blue' },
      { icon: '🔍', title: 'Index Segment', desc: 'Holds B-Tree or Bitmap index structures. Created automatically with CREATE INDEX. A Temp Segment is used during index build, then converted to a permanent Segment on completion.', color: 'violet' },
      { icon: '↩', title: 'Undo Segment', desc: 'Stores before-images for ROLLBACK and Read Consistency. Uses a ring structure of Extents that are reused cyclically. Managed automatically by the Undo Tablespace.', color: 'orange' },
      { icon: '📦', title: 'Temp Segment', desc: 'Scratch space for sort, hash-join, and bitmap-merge operations. Automatically released when the query ends. Allocated in the Temporary Tablespace; generates no Redo.', color: 'emerald' },
    ],

    tablespaceTitle: 'Tablespace — Logical Storage Container',
    tablespaceDesc: 'A Tablespace is the logical container that holds Segments. Physically it is made up of one or more .dbf data files, but DBAs work entirely with the tablespace name — not the file path.\n\nFor example, if you create the EMPLOYEES table in the USERS Tablespace, Oracle places the EMPLOYEES Segment somewhere inside a .dbf file that belongs to USERS. The DBA never needs to know which file or offset — if space runs low, they just add a datafile or enable Autoextend.',
    tablespaceTypeTitle: 'Three Types of Tablespace',
    tablespaceTypes: [
      { icon: '💾', title: 'Permanent', desc: 'Stores persistent schema objects: tables, indexes, LOBs. SYSTEM, SYSAUX, and USERS are the canonical examples.', color: 'blue' },
      { icon: '⏱', title: 'Temporary', desc: 'Stores temporary data for sorts, hashes, and bitmap merges. No Redo generated. Space released when query ends. Uses Tempfiles.', color: 'teal' },
      { icon: '↩', title: 'Undo', desc: 'Dedicated to Undo Segments. System-managed. Active instance set by UNDO_TABLESPACE parameter. AUTOEXTEND ON strongly recommended.', color: 'orange' },
    ],
    tablespaceFileDesc: 'Each Tablespace has a specific purpose. The major ones Oracle creates by default are:',
    tablespaceTable: [
      ['SYSTEM', 'Stores the data dictionary (table and index metadata). Always online. Never store user objects here.'],
      ['SYSAUX', 'Auxiliary space for Oracle internal components: AWR statistics, Streams, etc.'],
      ['UNDO', 'Dedicated to undo data. Which one is active is set by the UNDO_TABLESPACE parameter.'],
      ['TEMP', 'Temporary data for sorts and hash-joins. Space is automatically released when a transaction ends.'],
      ['USERS', 'The default user tablespace. Most application tables and indexes live here.'],
    ],
    lmtTitle: 'LMT vs DMT — Tablespace Management Modes',
    lmtDesc: 'Oracle tracks free space inside a Tablespace in two ways: LMT (Locally Managed Tablespace) and DMT (Dictionary Managed Tablespace). Since Oracle 10g, LMT is the default and the only recommended approach.',
    lmtTable: [
      ['Mode', 'LMT (Locally Managed)', 'DMT (Dictionary Managed)'],
      ['Free space tracking', 'Bitmap in data file header', 'Data dictionary tables'],
      ['Extent allocation', 'Bitmap update (fast)', 'Dictionary SQL (slow)'],
      ['Recursive SQL', 'None', 'Yes (serialization bottleneck)'],
      ['Adjacent space merge', 'Automatic (bitmap-based)', 'Manual COALESCE required'],
      ['Status', '✅ Current standard', '⚠️ Deprecated — do not use'],
    ],
    assmTitle: 'ASSM vs MSSM — Segment Space Management',
    assmDesc: 'How free space within each block is tracked is also configurable per Tablespace. ASSM (Automatic Segment Space Management) and MSSM (Manual Segment Space Management) are the two options. ASSM is the modern default.',
    assmTable: [
      ['Mode', 'ASSM (Automatic)', 'MSSM (Manual, Legacy)'],
      ['Free block tracking', 'Per-block bitmap', 'Freelist (linked list)'],
      ['Parameters needed', 'PCTFREE only', 'PCTFREE + PCTUSED + FREELISTS + FREELIST GROUPS'],
      ['Concurrency', 'High (separate Freelists per TX)', 'Low (shared Freelist contention)'],
      ['Oracle RAC', 'Dynamic instance affinity', 'Manual FREELIST GROUPS required'],
      ['Status', '✅ Default · recommended', '⚠️ Legacy — do not use in new code'],
    ],
    tablespaceNote: 'A DBA grows a Tablespace by adding a datafile (ALTER TABLESPACE ... ADD DATAFILE) or enabling AUTOEXTEND ON so it expands automatically. Even if a Tablespace spans multiple .dbf files, Oracle presents them as a single logical space.',

    infoTitle: 'Key Takeaway',
    infoBody: 'Block is the I/O unit. Extent is the allocation unit (always within one file). Segment maps 1:1 to a database object and grows via HWM. Tablespace is the DBA\'s logical management unit. ROWID = object# + file# + block# + slot# pinpoints any row in O(1).',
  },
}

// ── RowidDiagram ───────────────────────────────────────────────────────────

function RowidDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  const parts = [
    { chars: 'AAAPec', label: isKo ? '오브젝트 번호' : 'Object #', sublabel: 'OOOOOO', color: 'bg-viz-purple', light: 'bg-viz-purple/12 border-viz-purple text-viz-purple' },
    { chars: 'AAF',    label: isKo ? '파일 번호' : 'File #',   sublabel: 'FFF',    color: 'bg-viz-blue',   light: 'bg-viz-blue/12 border-viz-blue text-viz-blue'   },
    { chars: 'AAAABS', label: isKo ? '블록 번호' : 'Block #',  sublabel: 'BBBBBB', color: 'bg-viz-green',light: 'bg-viz-green/12 border-viz-green text-viz-green'},
    { chars: 'AAA',    label: isKo ? '슬롯 번호' : 'Slot #',   sublabel: 'RRR',    color: 'bg-viz-amber', light: 'bg-viz-amber/12 border-viz-amber text-viz-amber' },
  ]

  return (
    <figure className="my-5 overflow-x-auto rounded-panel border border-line bg-paper p-4">
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="shrink-0 rounded-chip bg-ink-3 px-1.5 py-0.5 font-mono text-[10px] font-bold text-paper">ROWID</span>
        <span className="font-sans text-[12px] leading-tight text-ink-2">
          {isKo ? 'Extended ROWID — 18자리 Base64 문자열' : 'Extended ROWID — 18-character Base64 string'}
        </span>
      </figcaption>

      {/* ROWID 문자열 시각화 */}
      <div className="mb-4 flex min-w-[420px] items-stretch overflow-hidden rounded-card border border-line">
        {parts.map((p) => (
          <div
            key={p.sublabel}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 border-r border-line px-2 py-2.5 last:border-r-0',
              p.light.split(' ')[0], // bg tint
            )}
          >
            <span className={cn('font-mono text-[13px] font-bold tracking-[0.15em]', p.light.split(' ')[2])}>{p.chars}</span>
            <span className="font-mono text-[9px] font-medium text-ink-3">{p.sublabel}</span>
          </div>
        ))}
      </div>

      {/* 설명 행 */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {parts.map((p) => (
          <div key={p.sublabel} className={cn('rounded-card border border-l-4 px-3 py-2', p.light)}>
            <div className="mb-1 flex items-center gap-1.5">
              <span className={cn('shrink-0 rounded-chip px-1.5 py-0.5 font-mono text-[9px] font-bold text-paper', p.color)}>
                {p.sublabel}
              </span>
              <span className="font-sans text-[11px] font-semibold text-ink">{p.label}</span>
            </div>
            <span className="font-mono text-[10px] text-ink-2">{p.chars}</span>
          </div>
        ))}
      </div>

      <figcaption className="mt-3 font-read text-[11.5px] leading-relaxed text-ink-3">
        {isKo
          ? 'Oracle 은 ROWID 하나로 "어느 Segment · 어느 파일 · 몇 번 블록 · 몇 번 슬롯"인지 즉시 계산해 그 행으로 바로 점프해요.'
          : 'From one ROWID, Oracle instantly resolves "which Segment, which file, which block, which slot" and jumps straight to the row.'}
      </figcaption>
    </figure>
  )
}

// ── BlockDiagram ───────────────────────────────────────────────────────────

type BlockZoneId = 'header' | 'itl' | 'directory' | 'free' | 'rowdata'

type BlockZoneDef = {
  id: BlockZoneId
  labelKo: string
  labelEn: string
  badgeColor: string   // bg-* for the badge pill
  zoneBg: string       // bg-* for the zone row (unselected)
  activeRing: string   // ring-* for selected zone
  titleKo: string
  titleEn: string
  descKo: string
  descEn: string
  rows: { termKo: string; termEn: string; descKo: string; descEn: string }[]
}

const BLOCK_ZONES: BlockZoneDef[] = [
  {
    id: 'header',
    labelKo: 'Common Header',
    labelEn: 'Common Header',
    badgeColor: 'bg-viz-blue',
    zoneBg: 'bg-viz-blue/12',
    activeRing: 'ring-2 ring-viz-blue/50',
    titleKo: 'Common Header (캐시 계층)',
    titleEn: 'Common Header (Cache Layer)',
    descKo: '"캐시 계층"이라 불리는 이유는 이 헤더가 디스크가 아닌 Buffer Cache(메모리) 안에서만 유지되는 정보를 담기 때문이에요. 블록이 디스크에서 메모리로 올라오면 Oracle이 이 영역을 채우고, 블록이 다시 디스크로 내려갈 때는 일부 필드가 제거돼요.',
    descEn: 'Called the "cache layer" because this header holds fields maintained only while the block lives in the Buffer Cache (memory). Oracle fills it when a block is read from disk and strips some fields when it is written back.',
    rows: [
      { termKo: 'Block Type', termEn: 'Block Type', descKo: '블록 종류 식별자 (데이터·인덱스·언두 등)', descEn: 'Identifies data / index / undo block type' },
      { termKo: 'DBA', termEn: 'DBA', descKo: 'Data Block Address — 이 블록이 디스크의 어느 위치에 있는지 나타내는 주소예요. 파일 번호 + 블록 번호로 구성돼요.', descEn: 'Data Block Address — the on-disk location of this block, expressed as file# + block#.' },
      { termKo: 'SCN', termEn: 'SCN', descKo: 'System Change Number(시스템 변경 번호). Oracle이 커밋이나 주요 변경마다 전역으로 증가시키는 논리 시계(숫자)예요. 이 블록이 마지막으로 변경된 시점의 SCN이 기록되어, 복구·Read Consistency 판단에 써요.', descEn: 'System Change Number — a global logical clock Oracle increments on every commit or key change. The SCN recorded here marks when this block was last written, used for recovery and Read Consistency.' },
      { termKo: 'Checksum', termEn: 'Checksum', descKo: '블록 전체 바이트를 특정 알고리즘으로 계산한 검증값이에요. 블록을 디스크에서 읽을 때 다시 계산해서 저장된 값과 비교하고, 디스크 오류나 비트 손상을 감지해요. DB_BLOCK_CHECKSUM 파라미터로 활성화해요.', descEn: 'A value computed over all bytes in the block. On every read from disk, Oracle recomputes and compares it to detect disk errors or bit corruption. Enabled via DB_BLOCK_CHECKSUM.' },
    ],
  },
  {
    id: 'itl',
    labelKo: 'ITL',
    labelEn: 'ITL',
    badgeColor: 'bg-viz-blue',
    zoneBg: 'bg-viz-blue/12',
    activeRing: 'ring-2 ring-viz-blue/50',
    titleKo: 'ITL — Interested Transaction List',
    titleEn: 'ITL — Interested Transaction List',
    descKo: '이 블록을 동시에 수정 중인 트랜잭션 슬롯 목록이에요. INITRANS 수만큼 미리 확보하고, 부족하면 Free Space에서 동적으로 늘려요.',
    descEn: 'Slots tracking concurrent transactions modifying this block. Pre-allocated by INITRANS; expands into Free Space when needed.',
    rows: [
      { termKo: 'XID', termEn: 'XID', descKo: 'Transaction ID(트랜잭션 ID) — Undo Seg# · Slot# · Seq# 세 숫자의 조합으로 트랜잭션을 고유하게 식별해요.', descEn: 'Transaction ID — a three-part key (Undo Seg# · Slot# · Seq#) that uniquely identifies a transaction.' },
      { termKo: 'UBA', termEn: 'UBA', descKo: 'Undo Block Address — 이 트랜잭션이 변경하기 전 데이터(이전 이미지)가 기록된 Undo 블록의 디스크 주소예요. 이전 이미지란 UPDATE·DELETE 직전에 Oracle이 Undo Segment에 복사해 둔 원본 값으로, ROLLBACK 시 이 값으로 되돌리고, 다른 세션이 이전 시점의 데이터를 읽을 때(Read Consistency)도 이 값을 참조해요.', descEn: 'Undo Block Address — the on-disk address of the Undo block that holds the before-image for this transaction. A before-image is the original column value Oracle copies into the Undo Segment just before an UPDATE or DELETE. It is used to revert the row on ROLLBACK, and by other sessions that need to read an older consistent snapshot (Read Consistency).' },
      { termKo: 'Flag', termEn: 'Flag', descKo: 'C = 커밋됨 / U = 행에 잠금 중 / T = 활성 트랜잭션 진행 중', descEn: 'C = committed / U = row locked / T = active transaction in progress' },
      { termKo: 'INITRANS', termEn: 'INITRANS', descKo: '블록 생성 시 ITL 슬롯을 미리 확보하는 수예요. 기본값은 테이블 1, 인덱스 2예요. 슬롯이 부족하면 Free Space를 잠식하면서 동적으로 늘어나요.', descEn: 'Number of ITL slots pre-allocated when the block is created. Default: 1 for tables, 2 for indexes. If all slots are full, Oracle carves new ones from Free Space.' },
      { termKo: 'MAXTRANS', termEn: 'MAXTRANS', descKo: '한 블록에서 동시에 활성화할 수 있는 ITL 슬롯의 상한이에요. Oracle 10g 이후에는 사실상 255로 고정되어 사용자가 제어할 수 없어요. INITRANS와 달리 MAXTRANS를 DDL로 지정해도 무시돼요.', descEn: 'Upper bound on the number of active ITL slots in a block. Since Oracle 10g it is effectively fixed at 255 and cannot be controlled by the user. Unlike INITRANS, any MAXTRANS value set via DDL is silently ignored.' },
    ],
  },
  {
    id: 'directory',
    labelKo: 'Row Directory',
    labelEn: 'Row Directory',
    badgeColor: 'bg-ink-3',
    zoneBg: 'bg-paper-sunk',
    activeRing: 'ring-2 ring-line-2',
    titleKo: 'Table / Row Directory',
    titleEn: 'Table / Row Directory',
    descKo: '블록 내 각 행의 위치(바이트 오프셋)를 담은 포인터 배열이에요. ROWID 접근 시 이 배열로 O(1)에 해당 행으로 점프해요.',
    descEn: 'Pointer array holding the byte offset of each row. ROWID access jumps to the row in O(1) via this directory.',
    rows: [
      { termKo: 'Row #N offset', termEn: 'Row #N offset', descKo: 'N번 행의 블록 내 바이트 오프셋이에요. (ROWID slot# = 배열 인덱스)', descEn: 'Byte offset of row N inside the block (ROWID slot# = array index)' },
      { termKo: 'DELETE 후', termEn: 'After DELETE', descKo: '슬롯은 0xFFFF로 표시돼요 → 재사용될 때까지 그대로 유지돼요', descEn: 'Slot is marked 0xFFFF until reused by a new insert' },
    ],
  },
  {
    id: 'free',
    labelKo: 'Free Space',
    labelEn: 'Free Space',
    badgeColor: 'bg-viz-green',
    zoneBg: 'bg-viz-green/12',
    activeRing: 'ring-2 ring-viz-green/50',
    titleKo: 'Free Space — PCTFREE 예약 구간',
    titleEn: 'Free Space — PCTFREE Reserved Zone',
    descKo: 'INSERT 상한선(PCTFREE, 기본 10%)을 지키기 위해 비워 두는 구간이에요. UPDATE 시 가변 컬럼이 늘어나는 공간이 돼요. 위에서 내려오는 Directory와 아래에서 올라오는 Row Data 사이에 위치해요.',
    descEn: 'Reserved space to honor PCTFREE (default 10%). Used for in-place UPDATE growth. Located between the downward-growing Directory and the upward-growing Row Data.',
    rows: [
      { termKo: 'PCTFREE', termEn: 'PCTFREE', descKo: 'INSERT 상한선이에요 — 여유 공간이 이 비율 이하로 줄면 새 INSERT를 받지 않아요', descEn: 'INSERT cutoff — new INSERTs blocked once free space drops below this %' },
      { termKo: 'PCTUSED', termEn: 'PCTUSED', descKo: 'Freelist 재진입 하한선이에요 — 이 값 아래로 떨어지면 블록을 Freelist에 재등록해요', descEn: 'Freelist re-entry floor — block is re-added to Freelist when used% drops below this' },
      { termKo: 'Row Migration', termEn: 'Row Migration', descKo: 'PCTFREE 부족으로 UPDATE 제자리 저장이 불가능할 때 → 다른 블록으로 이동하고 포인터를 남겨요 → 추가 I/O 발생', descEn: 'UPDATE can\'t fit in place → row moves to another block, forwarding pointer left → extra I/O' },
      { termKo: 'Row Chaining', termEn: 'Row Chaining', descKo: '행 자체가 블록보다 커서 여러 블록에 걸쳐 저장돼요 (LOB 등)', descEn: 'Row larger than one block → stored across multiple blocks (LOB, wide rows)' },
    ],
  },
  {
    id: 'rowdata',
    labelKo: 'Row Data',
    labelEn: 'Row Data',
    badgeColor: 'bg-viz-amber',
    zoneBg: 'bg-viz-amber/12',
    activeRing: 'ring-2 ring-viz-amber/50',
    titleKo: 'Row Data',
    titleEn: 'Row Data',
    descKo: '실제 행 데이터가 저장되는 영역이에요. 블록의 끝(높은 주소)에서 위쪽으로 쌓여요. 새 행이 INSERT 될수록 Free Space를 잠식하며 올라와요.',
    descEn: 'Actual row data, growing upward from the bottom (high address) of the block. Each new INSERT consumes Free Space from below.',
    rows: [
      { termKo: 'Row Header', termEn: 'Row Header', descKo: '행 플래그(삭제·마이그레이션 여부), 컬럼 수, 락 바이트 (2~3 bytes)예요', descEn: 'Row flags (deleted/migrated), column count, lock byte (2–3 bytes)' },
      { termKo: 'Column Data', termEn: 'Column Data', descKo: '컬럼 길이(1 byte) + 실제 데이터예요. NULL은 0xFF 1바이트로 저장돼요', descEn: 'Length byte + column value. NULL stored as 0xFF (1 byte)' },
      { termKo: 'VARCHAR2', termEn: 'VARCHAR2', descKo: '길이 prefix + 문자 데이터예요 (가변 길이 저장)', descEn: 'Length prefix + character data (variable-length storage)' },
    ],
  },
]

function BlockDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const [active, setActive] = useState<BlockZoneId>('itl')
  const isKo = lang === 'ko'
  const activeZone = BLOCK_ZONES.find((z) => z.id === active)!

  // 이미지 구조:
  // [데이터 블록 헤더{ 캐시 계층(header), 트랜잭션 계층(itl) }]
  // [데이터 헤더{ 테이블 디렉토리, 행 디렉토리(directory) }]
  // [데이터 계층{ 사용 가능한 공간(free) ↕, Row Data(rowdata) }]

  const blockRows: { id: BlockZoneId; labelKo: string; labelEn: string }[] = [
    { id: 'header',    labelKo: '캐시 계층',                      labelEn: 'Cache Layer' },
    { id: 'itl',       labelKo: '트랜잭션 계층',                  labelEn: 'Transaction Layer' },
    { id: 'directory', labelKo: '테이블 / 행 디렉토리',  labelEn: 'Table Dir / Row Dir' },
  ]

  const ROW_H = 48 // header, itl, directory 각각 높이(px)

  const GROUPS: { labelKo: string; labelEn: string; h: number; bar: string; text: string }[] = [
    { labelKo: '데이터 블록 헤더', labelEn: 'Block Header', h: ROW_H * 2, bar: 'bg-viz-red', text: 'text-viz-red' },
    { labelKo: '데이터 헤더', labelEn: 'Data Header', h: ROW_H, bar: 'bg-viz-amber', text: 'text-viz-amber' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* ── 타이틀 ── */}
      <div className="mt-6 flex items-center gap-2">
        <IconCube size={16} className="text-ink-3" stroke={1.5} />
        <span className="font-sans text-sm font-semibold text-ink">
          {isKo ? '오라클의 블록은 이렇게 생겼어요' : 'Anatomy of an Oracle Block'}
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-5 lg:flex-row">
        {/* ── Block visual (left) ── */}
        <div className="flex shrink-0 gap-2">
          {/* 좌측 그룹 라벨 — 색 바 + 세로 중앙 라벨 */}
          <div className="flex flex-col">
            {GROUPS.map((g) => (
              <div key={g.labelEn} className="flex items-center gap-1.5" style={{ height: g.h }}>
                <span className={cn('font-sans text-[9px] font-semibold leading-tight', g.text)} style={{ maxWidth: 56 }}>
                  {isKo ? g.labelKo : g.labelEn}
                </span>
                <span className={cn('w-1 self-stretch rounded-full', g.bar)} style={{ margin: '6px 0' }} />
              </div>
            ))}
            <div className="flex-1" />
          </div>

          {/* 블록 본체 */}
          <div className="flex w-52 flex-col overflow-hidden rounded-card border border-line-2">
            {blockRows.map(({ id, labelKo, labelEn }) => {
              const zone = BLOCK_ZONES.find((z) => z.id === id)!
              const isActive = active === id
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  style={{ height: ROW_H }}
                  className={cn(
                    'flex w-full shrink-0 cursor-pointer items-center gap-2.5 border-b border-line px-3 text-left transition-colors hover:bg-ink/[0.03]',
                    isActive ? zone.zoneBg : 'bg-paper',
                    isActive && zone.activeRing,
                  )}
                >
                  <span className={cn('shrink-0 rounded-chip px-1.5 py-0.5 font-mono text-[9px] font-bold text-paper', zone.badgeColor)}>
                    {id === 'header' ? 'HDR' : id === 'itl' ? 'ITL' : 'DIR'}
                  </span>
                  <span className={cn('font-sans text-[11px] leading-tight', isActive ? 'font-semibold text-ink' : 'text-ink-2')}>
                    {isKo ? labelKo : labelEn}
                  </span>
                </button>
              )
            })}

            {/* 사용 가능한 공간 */}
            <button
              onClick={() => setActive('free')}
              className={cn(
                'flex min-h-[104px] w-full flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 transition-colors hover:bg-ink/[0.03]',
                active === 'free' ? BLOCK_ZONES.find((z) => z.id === 'free')!.zoneBg : 'bg-paper',
                active === 'free' && BLOCK_ZONES.find((z) => z.id === 'free')!.activeRing,
              )}
            >
              <IconArrowsVertical size={16} className="text-ink-3" stroke={1.5} />
              <span className="font-sans text-[11px] font-semibold text-ink-2">
                {isKo ? '사용 가능한 공간' : 'Free Space'}
              </span>
            </button>
          </div>

          {/* 우측 그룹 라벨 — Data Layer */}
          <div className="flex flex-col">
            <div style={{ height: ROW_H * 3 }} />
            <div className="flex flex-1 items-center gap-1.5">
              <span className="w-1 self-stretch rounded-full bg-viz-blue" style={{ margin: '6px 0' }} />
              <span className="font-sans text-[9px] font-semibold leading-tight text-viz-blue" style={{ maxWidth: 48 }}>
                {isKo ? '데이터 계층' : 'Data Layer'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Detail card (right) ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-paper">
          <div className={cn('flex items-center gap-2.5 border-b border-line px-4 py-2.5', activeZone.zoneBg)}>
            <span className={cn('shrink-0 rounded-chip px-2 py-0.5 font-mono text-[11px] font-bold text-paper', activeZone.badgeColor)}>
              {active.toUpperCase()}
            </span>
            <span className="font-sans text-[13px] font-semibold text-ink">
              {isKo ? activeZone.titleKo : activeZone.titleEn}
            </span>
          </div>
          <p className="border-b border-line px-4 py-3 font-read text-[12px] leading-relaxed text-ink-2">
            {isKo ? activeZone.descKo : activeZone.descEn}
          </p>
          <div className="flex flex-col divide-y divide-line">
            {activeZone.rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[128px_1fr]">
                <div className="flex items-center border-r border-line bg-paper-sunk px-3 py-2.5">
                  <span className="font-mono text-[11px] font-bold text-ink">{isKo ? row.termKo : row.termEn}</span>
                </div>
                <div className="flex items-center px-3 py-2.5">
                  <span className="font-read text-[11.5px] leading-snug text-ink-2">{isKo ? row.descKo : row.descEn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PctDiagram ────────────────────────────────────────────────────────────

function PctDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  // 위에서부터: PCTFREE(10%) / Row Data(60%) / Free Space(30%)
  // PCTFREE 라인: 10% 지점
  // PCTUSED 라인: 10% + 40% = 50% 지점 (블록의 40%가 Row Data로 사용된 상태)
  const BLOCK_H = 300

  const sections = [
    {
      labelKo: 'PCTFREE 예약 구간',
      labelEn: 'PCTFREE reserved',
      pct: 10,
      bg: 'bg-viz-green/15',
      border: 'border-viz-green',
      text: 'text-viz-green',
    },
    {
      labelKo: 'Row Data (사용 중)',
      labelEn: 'Row Data (used)',
      pct: 60,
      bg: 'bg-viz-amber/15',
      border: 'border-viz-amber',
      text: 'text-viz-amber',
    },
    {
      labelKo: '사용 가능한 공간',
      labelEn: 'Free Space',
      pct: 30,
      bg: 'bg-paper-sunk',
      border: 'border-line',
      text: 'text-ink-2',
    },
  ]

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* ── 섹션 헤더 ── */}
      <div className="border-b border-line pb-2.5">
        <span className="font-sans text-sm font-semibold text-ink">
          {isKo ? '데이터 블록 안에 데이터가 채워지는 방식' : 'How Oracle Stores Data Inside a Block'}
        </span>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row">
        {/* ── 블록 본체 + 라인 레이블 ── */}
        <div className="flex shrink-0 items-start">
          <div
            className="relative flex w-44 flex-col overflow-hidden rounded-card border border-line-2"
            style={{ height: BLOCK_H }}
          >
            {sections.map((s) => (
              <div
                key={s.labelKo}
                className={cn('flex items-center justify-center border-b border-line px-2 text-center last:border-0', s.bg)}
                style={{ height: `${s.pct}%` }}
              >
                <span className={cn('font-sans text-[11px] font-semibold leading-tight', s.text)}>
                  {isKo ? s.labelKo : s.labelEn}
                </span>
              </div>
            ))}
            <div className="absolute right-0 left-0 border-t border-dashed border-viz-green" style={{ top: '10%' }} />
            <div className="absolute right-0 left-0 border-t border-dashed border-viz-blue/60" style={{ top: '50%' }} />
          </div>

          {/* 라인 레이블 */}
          <div className="relative w-40 shrink-0" style={{ height: BLOCK_H }}>
            <div className="absolute left-0 flex items-center gap-1.5" style={{ top: '10%', transform: 'translateY(-50%)' }}>
              <span className="h-px w-3 bg-viz-green" />
              <span className="flex flex-col leading-tight">
                <span className="font-mono text-[10px] font-bold whitespace-nowrap text-viz-green">PCTFREE = 10%</span>
                <span className="font-sans text-[9px] whitespace-nowrap text-ink-3">
                  {isKo ? '블록 크기의 10%' : '10% of block size'}
                </span>
              </span>
            </div>
            <div className="absolute left-0 flex items-center gap-1.5" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <span className="h-px w-3 bg-viz-blue" />
              <span className="flex flex-col leading-tight">
                <span className="font-mono text-[10px] font-bold whitespace-nowrap text-viz-blue">PCTUSED = 40%</span>
                <span className="font-sans text-[9px] whitespace-nowrap text-ink-3">
                  {isKo ? '블록 크기의 40%' : '40% of block size'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 설명 카드 ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="rounded-card border border-line border-l-4 border-l-viz-green bg-viz-green/12 px-3.5 py-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <IconArrowDown size={13} className="text-viz-green" stroke={1.5} />
              <span className="font-mono text-[11px] font-bold text-viz-green">PCTFREE</span>
              <span className="font-sans text-[11px] text-viz-green">{isKo ? '= INSERT 상한선' : '= INSERT ceiling'}</span>
            </div>
            <p className="font-read text-[11.5px] leading-relaxed text-ink-2">
              {isKo
                ? '블록 크기의 10%를 상단에 예약해요. 여유 공간이 이 아래로 줄면 새 INSERT 를 막고, 기존 행이 UPDATE 로 길어질 때 쓸 공간으로 남겨 둬요.'
                : 'Reserves 10% of the block at the top. Once free space drops below this, new INSERTs are blocked — the space is kept for in-place UPDATE growth.'}
            </p>
          </div>

          <div className="rounded-card border border-line border-l-4 border-l-viz-blue bg-viz-blue/12 px-3.5 py-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <IconArrowUp size={13} className="text-viz-blue" stroke={1.5} />
              <span className="font-mono text-[11px] font-bold text-viz-blue">PCTUSED</span>
              <span className="font-sans text-[11px] text-viz-blue">{isKo ? '= Freelist 재진입 하한선' : '= Freelist re-entry floor'}</span>
            </div>
            <p className="font-read text-[11.5px] leading-relaxed text-ink-2">
              {isKo
                ? '블록 크기의 40%예요. DELETE·UPDATE 로 Row Data 사용량이 이 아래로 줄면 Oracle 이 블록을 Freelist 에 재등록해 다시 INSERT 를 받아요.'
                : '40% of the block. When DELETE/UPDATE shrinks Row Data usage below this, Oracle re-adds the block to the Freelist so it can accept INSERTs again.'}
            </p>
          </div>

          <div className="rounded-card border border-line bg-paper-sunk px-3.5 py-2.5">
            <p className="font-read text-[11.5px] leading-relaxed text-ink-2">
              {isKo
                ? 'INSERT → PCTFREE 도달 → INSERT 금지 → DELETE 로 Row Data 가 PCTUSED 이하 → Freelist 재등록 → INSERT 재개. PCTFREE + PCTUSED 합이 100 을 넘으면 안 돼요.'
                : 'INSERT → hits PCTFREE → blocked → DELETE brings Row Data below PCTUSED → re-added to Freelist → INSERTs resume. PCTFREE + PCTUSED must not exceed 100.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ExtentDiagram ──────────────────────────────────────────────────────────

function ExtentDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  return (
    <DiagramFrame
      tier="extent"
      badge="EXTENT"
      note={isKo ? 'Block 8개가 모여 Extent 1개 = 64 KB' : '8 Blocks form 1 Extent = 64 KB'}
    >
      <div className="flex min-w-[420px] items-stretch gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-card border border-viz-amber/70 bg-viz-amber/12 py-3"
          >
            <span className="font-sans text-[9px] font-semibold text-viz-amber">Block</span>
            <span className="font-mono text-[8px] text-viz-amber/80">8 KB</span>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center font-mono text-[10px] text-ink-3">
        8 × 8 KB = 64 KB
        <span className="font-sans"> · {isKo ? '물리적으로 연속된 주소 공간' : 'physically contiguous'}</span>
      </p>
    </DiagramFrame>
  )
}

// ── SegmentDiagram ─────────────────────────────────────────────────────────

function SegmentDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  const stages = [
    {
      label: isKo ? '① 테이블 생성 직후' : '① Just after CREATE TABLE',
      extents: 1,
      note: isKo ? 'Extent 1개로 시작' : 'Starts with 1 Extent',
    },
    {
      label: isKo ? '② 데이터가 쌓이면' : '② As rows fill up',
      extents: 2,
      note: isKo ? '꽉 차면 Extent 자동 추가' : 'Full → new Extent added automatically',
    },
    {
      label: isKo ? '③ 더 커지면' : '③ Keeps growing',
      extents: 4,
      note: isKo ? 'Extent가 계속 붙으며 성장' : 'More Extents appended as needed',
    },
  ]

  return (
    <DiagramFrame
      tier="segment"
      badge="SEGMENT"
      note={isKo ? 'EMPLOYEES 테이블 — 오브젝트 1개 = Segment 1개' : 'EMPLOYEES table — one object = one Segment'}
    >
      <div className="flex min-w-[440px] flex-col gap-2.5">
        {stages.map((stage, si) => (
          <div key={si} className="flex items-center gap-3">
            <div className="w-32 shrink-0">
              <div className="font-sans text-[10px] font-semibold leading-tight text-ink">{stage.label}</div>
              <div className="mt-0.5 font-sans text-[9px] leading-tight text-ink-3">{stage.note}</div>
            </div>
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: stage.extents }).map((_, ei) => (
                <div
                  key={ei}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-card border border-viz-green/70 bg-viz-green/12 py-2.5"
                >
                  <span className="font-mono text-[10px] font-bold text-viz-green">Extent {ei + 1}</span>
                  <span className="font-mono text-[9px] text-viz-green/80">64 KB</span>
                </div>
              ))}
              {si === stages.length - 1 && (
                <div className="flex w-10 shrink-0 items-center justify-center rounded-card border border-dashed border-viz-purple bg-viz-purple/12">
                  <span className="font-mono text-[12px] font-bold text-viz-purple">+</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center font-sans text-[10px] text-ink-3">
        {isKo ? 'Segment = 이 Extent 들의 합집합' : 'Segment = the union of all its Extents'}
      </p>
    </DiagramFrame>
  )
}

// ── HwmDiagram ─────────────────────────────────────────────────────────────

function HwmDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  const BLOCK_COUNT = 10
  // 0~4: 데이터, 5~6: 삭제된 빈 블록, 7: Low HWM 위 미포맷, 8~9: HWM 위 미사용
  const LOW_HWM = 7
  const HWM = 8

  const blockState = (i: number): 'data' | 'empty' | 'partial' | 'unused' => {
    if (i < 5) return 'data'
    if (i < LOW_HWM) return 'empty'
    if (i < HWM) return 'partial'
    return 'unused'
  }

  const stateStyle = {
    data:    { bg: 'bg-viz-amber/12 border-viz-amber/70', label: isKo ? '데이터' : 'data', text: 'text-viz-amber' },
    empty:   { bg: 'bg-paper-sunk border-line-2', label: isKo ? '빈 블록' : 'empty', text: 'text-ink-2' },
    partial: { bg: 'bg-viz-amber/15 border-viz-amber/55', label: isKo ? '미포맷' : 'partial', text: 'text-viz-amber' },
    unused:  { bg: 'bg-paper border-dashed border-line', label: isKo ? '미사용' : 'unused', text: 'text-ink-3' },
  }

  return (
    <DiagramFrame
      tier="segment"
      badge="HWM"
      note={isKo ? 'High Water Mark — Segment 성장 경계' : 'High Water Mark — Segment growth boundary'}
    >
      <div className="min-w-[440px]">
        {/* 경계 레이블 — 각 선에서 바깥쪽으로만 자라 겹치지 않음 */}
        <div className="relative mb-1 h-7">
          <div
            className="absolute flex flex-col items-end pr-1 text-right"
            style={{ left: `${(LOW_HWM / BLOCK_COUNT) * 100}%`, transform: 'translateX(-100%)' }}
          >
            <span className="font-mono text-[9px] font-bold whitespace-nowrap text-viz-blue">Low HWM</span>
            <span className="font-sans text-[8px] whitespace-nowrap text-ink-3">{isKo ? '포맷 완료 경계' : 'formatted'}</span>
          </div>
          <div
            className="absolute flex flex-col items-start pl-1"
            style={{ left: `${(HWM / BLOCK_COUNT) * 100}%` }}
          >
            <span className="font-mono text-[9px] font-bold whitespace-nowrap text-viz-red">HWM</span>
            <span className="font-sans text-[8px] whitespace-nowrap text-ink-3">{isKo ? '할당 경계' : 'allocation'}</span>
          </div>
        </div>

        {/* 블록 행 */}
        <div className="relative flex items-stretch gap-1">
          {Array.from({ length: BLOCK_COUNT }).map((_, i) => {
            const style = stateStyle[blockState(i)]
            return (
              <div
                key={i}
                className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 rounded-card border py-3', style.bg)}
              >
                <span className={cn('font-mono text-[9px] font-bold', style.text)}>{i + 1}</span>
                <span className={cn('font-sans text-[8px]', style.text)}>{style.label}</span>
              </div>
            )
          })}
          <div className="absolute top-0 bottom-0 w-[3px] bg-viz-blue" style={{ left: `${(LOW_HWM / BLOCK_COUNT) * 100}%` }} />
          <div className="absolute top-0 bottom-0 w-[3px] bg-viz-red" style={{ left: `${(HWM / BLOCK_COUNT) * 100}%` }} />
        </div>

        {/* 범례 */}
        <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5">
          {(Object.keys(stateStyle) as (keyof typeof stateStyle)[]).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-5 shrink-0 rounded-chip border', stateStyle[k].bg)} />
              <span className="font-sans text-[9px] text-ink-2">{stateStyle[k].label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 font-read text-[11px] leading-relaxed text-ink-3">
        {isKo
          ? 'Full Table Scan 은 Low HWM 까지 연속으로, 그 위 HWM 까지는 포맷된 블록만 골라 읽어요. DELETE 로 모든 행을 지워도 HWM 은 내려가지 않아 스캔 범위는 그대로예요.'
          : 'A Full Table Scan reads contiguously up to Low HWM, then only formatted blocks up to HWM. Deleting every row does NOT lower the HWM — scan range stays the same.'}
      </p>
    </DiagramFrame>
  )
}

// ── TablespaceDiagram ──────────────────────────────────────────────────────

function TablespaceDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  // USERS Tablespace 내부 구조: Segment → Extent → Block 관계 시각화
  const segments = [
    {
      name: 'EMPLOYEES',
      color: 'border-viz-purple bg-viz-purple/12',
      badge: 'bg-viz-purple',
      label: isKo ? '테이블 Segment' : 'Table Segment',
      extents: 2,
    },
    {
      name: 'EMP_IDX',
      color: 'border-viz-blue bg-viz-blue/12',
      badge: 'bg-viz-blue',
      label: isKo ? '인덱스 Segment' : 'Index Segment',
      extents: 1,
    },
    {
      name: 'DEPARTMENTS',
      color: 'border-viz-green bg-viz-green/12',
      badge: 'bg-viz-green',
      label: isKo ? '테이블 Segment' : 'Table Segment',
      extents: 1,
    },
  ]

  return (
    <DiagramFrame
      tier="tablespace"
      badge="TABLESPACE"
      note={isKo ? 'USERS — 여러 Segment 를 담는 논리 공간' : 'USERS — logical space containing Segments'}
    >
      <div className="min-w-[440px]">
        <div className="flex flex-col gap-2">
          {segments.map((seg) => (
            <div key={seg.name} className={cn('rounded-card border border-l-4 p-2.5', seg.color)}>
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={cn('shrink-0 rounded-chip px-1.5 py-0.5 font-mono text-[9px] font-bold text-paper', seg.badge)}>
                  SEGMENT
                </span>
                <span className="font-mono text-[10px] font-bold text-ink">{seg.name}</span>
                <span className="font-sans text-[9px] text-ink-3">{seg.label}</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: seg.extents }).map((_, ei) => (
                  <div key={ei} className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-card border border-viz-green/70 bg-viz-green/12 py-2">
                    <span className="font-mono text-[10px] font-bold text-viz-green">Extent {ei + 1}</span>
                    <span className="font-mono text-[9px] text-viz-green/80">64 KB</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 물리 파일 */}
        <div className="mt-3.5 mb-2 flex items-center gap-2">
          <span className="h-px flex-1 border-t border-dashed border-viz-blue/70" />
          <span className="shrink-0 font-sans text-[9px] font-medium text-viz-blue">{isKo ? '실제 디스크 파일' : 'Physical disk files'}</span>
          <span className="h-px flex-1 border-t border-dashed border-viz-blue/70" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['users01.dbf', 'users02.dbf'].map((f) => (
            <div key={f} className="flex items-center gap-1.5 rounded-chip border border-line bg-paper px-2 py-1">
              <IconCube size={11} className="text-ink-3" stroke={1.5} />
              <span className="font-mono text-[9px] text-ink-2">{f}</span>
            </div>
          ))}
          <span className="font-sans text-[9px] text-ink-3">
            {isKo ? '← Tablespace 로 묶여 하나의 논리 공간으로 관리' : '← managed as one logical space'}
          </span>
        </div>
      </div>
    </DiagramFrame>
  )
}

// ── StorageHierarchyDiagram ────────────────────────────────────────────────
// Oracle 문서(docs.oracle.com/cncpt/logical-storage-structures) Figure 15-2 참고:
// Tablespace → Segment → Extent → Block 의 중첩 구조,
// Tablespace ↔ .dbf 데이터 파일 의 논리-물리 관계

function StorageHierarchyDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  const lbl = (ko: string, en: string) => isKo ? ko : en

  // ── 색상 팔레트 ──
  const COL = {
    db:   { fill: 'var(--color-paper)',      stroke: 'var(--color-viz-blue)',   text: 'var(--color-viz-blue)' },
    ts:   { fill: 'var(--color-paper-sunk)', stroke: 'var(--color-viz-purple)', text: 'var(--color-viz-purple)' },
    seg1: { fill: 'var(--color-paper)',      stroke: 'var(--color-viz-green)',  text: 'var(--color-viz-green)' },
    seg2: { fill: 'var(--color-paper)',      stroke: 'var(--color-viz-purple)', text: 'var(--color-viz-purple)' },
    ext:  { fill: 'var(--color-paper-sunk)', stroke: 'var(--color-viz-amber)',  text: 'var(--color-viz-amber)' },
    blk:  { fill: 'var(--color-paper)',      stroke: 'var(--color-viz-amber)',  text: 'var(--color-viz-amber)' },
    dbf:  { fill: 'var(--color-paper-sunk)', stroke: 'var(--color-ink-2)',  text: 'var(--color-ink)' },
    ink2: 'var(--color-ink-2)',
    ink3: 'var(--color-ink-3)',
    arrow: 'var(--color-ink-3)',
  }

  // ── 캔버스 크기 ──
  // 설계 원칙: 각 계층마다 충분한 패딩, 글자가 박스를 벗어나지 않도록 여유 확보
  const W = 860
  const H = 560

  // ── Database 박스 (전체 캔버스 테두리) ──
  // 상단 레이블 영역 32px 확보
  const DB = { x: 12, y: 12, w: W - 24, h: H - 24, r: 14 }

  // ── Tablespace 박스 ──
  // DB 안에서 상단 44px(DB 레이블), 하단 120px(datafile 영역) 여백 확보
  const TS = { x: 32, y: 56, w: W - 64, h: 340, r: 10 }

  // ── Segment 1 (Table): Tablespace 안 왼쪽 절반 ──
  // TS 안에서 상단 28px(TS 레이블), 하단 24px, 좌우 16px 여백
  const S1 = { x: TS.x + 16, y: TS.y + 28, w: (TS.w / 2) - 24, h: TS.h - 52, r: 8 }

  // ── Segment 2 (Index): Tablespace 안 오른쪽 절반 ──
  const S2 = { x: TS.x + (TS.w / 2) + 8, y: TS.y + 28, w: (TS.w / 2) - 24, h: TS.h - 52, r: 8 }

  // ── Segment 공통 내부 레이아웃 ──
  // 각 Segment 안: 상단 28px(Segment 레이블), 하단 28px(주석), 좌우 12px 여백
  const SEG_PAD_TOP = 30
  const SEG_PAD_BOTTOM = 30
  const SEG_PAD_X = 12

  // ── Extent 크기 계산 ──
  // S1: Extent 2개를 가로로 나란히 (gap 10px)
  const EXT_H = S1.h - SEG_PAD_TOP - SEG_PAD_BOTTOM
  const S1_EXT_W = (S1.w - SEG_PAD_X * 2 - 10) / 2

  // E1A (Extent 1 in S1)
  const E1A = {
    x: S1.x + SEG_PAD_X,
    y: S1.y + SEG_PAD_TOP,
    w: S1_EXT_W,
    h: EXT_H,
    r: 6,
  }
  // E1B (Extent 2 in S1)
  const E1B = {
    x: E1A.x + E1A.w + 10,
    y: E1A.y,
    w: S1_EXT_W,
    h: EXT_H,
    r: 6,
  }

  // S2: Extent 1개 (S2 전체 내부)
  const E2A = {
    x: S2.x + SEG_PAD_X,
    y: S2.y + SEG_PAD_TOP,
    w: S2.w - SEG_PAD_X * 2,
    h: EXT_H,
    r: 6,
  }

  // ── Block 크기 ──
  // E1A 안: 2행 × 2열 Block (레이블 22px + 블록들 + 하단 패딩 8px)
  const EXT_LABEL_H = 36   // Extent 상단 레이블 영역
  const EXT_PAD = 8        // Extent 내부 여백
  const BLK_COLS = 2
  const BLK_ROWS = 2
  const BLK_GAP = 6
  const BLK_W = Math.floor((E1A.w - EXT_PAD * 2 - BLK_GAP * (BLK_COLS - 1)) / BLK_COLS)
  const BLK_H = Math.floor((E1A.h - EXT_LABEL_H - EXT_PAD - BLK_GAP * (BLK_ROWS - 1)) / BLK_ROWS)

  const blksE1A = Array.from({ length: 4 }).map((_, i) => ({
    x: E1A.x + EXT_PAD + (i % BLK_COLS) * (BLK_W + BLK_GAP),
    y: E1A.y + EXT_LABEL_H + Math.floor(i / BLK_COLS) * (BLK_H + BLK_GAP),
  }))

  // E2A 안: 1행 × 4열 Block
  const BLK2_COLS = 4
  const BLK2_W = Math.floor((E2A.w - EXT_PAD * 2 - BLK_GAP * (BLK2_COLS - 1)) / BLK2_COLS)
  const BLK2_H = E2A.h - EXT_LABEL_H - EXT_PAD

  const blksE2A = Array.from({ length: 4 }).map((_, i) => ({
    x: E2A.x + EXT_PAD + i * (BLK2_W + BLK_GAP),
    y: E2A.y + EXT_LABEL_H,
  }))

  // ── Datafile 영역 ──
  // Tablespace 하단 끝에서 16px 아래
  const DBF_Y = TS.y + TS.h + 16
  const DBF_H = 52
  const DBF_GAP = 12
  const DBF1 = { x: DB.x + 20, y: DBF_Y, w: (DB.w - 40 - DBF_GAP) / 2, h: DBF_H, r: 6 }
  const DBF2 = { x: DBF1.x + DBF1.w + DBF_GAP, y: DBF_Y, w: DBF1.w, h: DBF_H, r: 6 }

  // ── 화살표 ── Extent → Datafile. TS 하단 모서리에서만 출발해 박스를 가로지르지 않음.
  const TS_BOTTOM = TS.y + TS.h
  const arrowPts = [
    { from: { x: E1A.x + E1A.w / 2, y: TS_BOTTOM }, to: { x: DBF1.x + DBF1.w * 0.35, y: DBF_Y } },
    { from: { x: E1B.x + E1B.w / 2, y: TS_BOTTOM }, to: { x: DBF1.x + DBF1.w * 0.65, y: DBF_Y } },
    { from: { x: E2A.x + E2A.w / 2, y: TS_BOTTOM }, to: { x: DBF2.x + DBF2.w / 2,    y: DBF_Y } },
  ]

  const MONO = 'var(--font-mono)'

  return (
    <figure className="my-6 overflow-x-auto rounded-panel border border-line bg-paper p-4">
      <figcaption className="mb-3 font-sans text-[12px] font-semibold text-ink-2">
        {lbl('논리적 저장 계층 — Database → Tablespace → Segment → Extent → Block', 'Logical Storage Hierarchy — Database → Tablespace → Segment → Extent → Block')}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 640, fontFamily: 'var(--font-sans-active)' }}
      >
        <defs>
          <marker id="harr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill={COL.arrow} />
          </marker>
        </defs>

        {/* ════ Database ════ */}
        <rect x={DB.x} y={DB.y} width={DB.w} height={DB.h} rx={DB.r}
          fill={COL.db.fill} stroke={COL.db.stroke} strokeWidth={1.5} />
        <rect x={DB.x + 12} y={DB.y + 8} width={92} height={22} rx={4} fill={COL.db.stroke} />
        <text x={DB.x + 21} y={DB.y + 23} fontFamily={MONO} fontSize={12} fontWeight="bold" fill="var(--color-paper)">Database</text>
        <text x={DB.x + DB.w - 16} y={DB.y + 24} fontSize={10.5} fill={COL.db.text} textAnchor="end">
          {lbl('논리적 최상위 단위', 'Top-level logical unit')}
        </text>

        {/* ════ Tablespace ════ */}
        <rect x={TS.x} y={TS.y} width={TS.w} height={TS.h} rx={TS.r}
          fill={COL.ts.fill} stroke={COL.ts.stroke} strokeWidth={1.5} />
        <rect x={TS.x + 10} y={TS.y + 8} width={104} height={20} rx={4} fill={COL.ts.stroke} />
        <text x={TS.x + 18} y={TS.y + 22} fontFamily={MONO} fontSize={11} fontWeight="bold" fill="var(--color-paper)">TABLESPACE</text>
        <text x={TS.x + 124} y={TS.y + 22} fontFamily={MONO} fontSize={12} fontWeight="bold" fill={COL.ts.text}>USERS</text>
        <text x={TS.x + TS.w - 12} y={TS.y + 22} fontSize={10.5} fill={COL.ts.text} textAnchor="end">
          {lbl('논리적 컨테이너', 'Logical container')}
        </text>

        {/* ════ Segment 1 (Table) ════ */}
        <rect x={S1.x} y={S1.y} width={S1.w} height={S1.h} rx={S1.r}
          fill={COL.seg1.fill} stroke={COL.seg1.stroke} strokeWidth={1.5} />
        <rect x={S1.x + 8} y={S1.y + 6} width={70} height={20} rx={3} fill={COL.seg1.stroke} />
        <text x={S1.x + 14} y={S1.y + 20} fontFamily={MONO} fontSize={10} fontWeight="bold" fill="var(--color-paper)">SEGMENT</text>
        <text x={S1.x + 86} y={S1.y + 20} fontFamily={MONO} fontSize={11} fontWeight="bold" fill={COL.seg1.text}>EMPLOYEES</text>
        <text x={S1.x + S1.w - 10} y={S1.y + 20} fontSize={9.5} fill={COL.seg1.text} textAnchor="end">
          {lbl('테이블 Segment', 'Table Segment')}
        </text>
        <text x={S1.x + S1.w / 2} y={S1.y + S1.h - 10} fontSize={9.5} fill={COL.seg1.text} textAnchor="middle">
          {lbl('Extent 는 하나의 파일 안에만 존재', 'Each Extent stays within one datafile')}
        </text>

        {/* ════ Segment 2 (Index) ════ */}
        <rect x={S2.x} y={S2.y} width={S2.w} height={S2.h} rx={S2.r}
          fill={COL.seg2.fill} stroke={COL.seg2.stroke} strokeWidth={1.5} />
        <rect x={S2.x + 8} y={S2.y + 6} width={70} height={20} rx={3} fill={COL.seg2.stroke} />
        <text x={S2.x + 14} y={S2.y + 20} fontFamily={MONO} fontSize={10} fontWeight="bold" fill="var(--color-paper)">SEGMENT</text>
        <text x={S2.x + 86} y={S2.y + 20} fontFamily={MONO} fontSize={11} fontWeight="bold" fill={COL.seg2.text}>EMP_IDX</text>
        <text x={S2.x + S2.w - 10} y={S2.y + 20} fontSize={9.5} fill={COL.seg2.text} textAnchor="end">
          {lbl('인덱스 Segment', 'Index Segment')}
        </text>
        <text x={S2.x + S2.w / 2} y={S2.y + S2.h - 10} fontSize={9.5} fill={COL.seg2.text} textAnchor="middle">
          {lbl('Segment 는 여러 파일에 걸쳐질 수 있음', 'A Segment may span multiple datafiles')}
        </text>

        {/* ════ Extent 1A ════ */}
        <rect x={E1A.x} y={E1A.y} width={E1A.w} height={E1A.h} rx={E1A.r}
          fill={COL.ext.fill} stroke={COL.ext.stroke} strokeWidth={1.5} />
        <text x={E1A.x + 8} y={E1A.y + 15} fontFamily={MONO} fontSize={10} fontWeight="bold" fill={COL.ext.text}>Extent 1</text>
        <text x={E1A.x + 8} y={E1A.y + 29} fontFamily={MONO} fontSize={9} fill={COL.blk.text} opacity={0.85}>64 KB · 8 blocks</text>
        {blksE1A.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={BLK_W} height={BLK_H} rx={3}
              fill={COL.blk.fill} stroke={COL.blk.stroke} strokeWidth={1} />
            <text x={b.x + BLK_W / 2} y={b.y + BLK_H / 2 - 3}
              fontFamily={MONO} fontSize={9} fontWeight="bold" fill={COL.blk.text} textAnchor="middle">Block</text>
            <text x={b.x + BLK_W / 2} y={b.y + BLK_H / 2 + 9}
              fontFamily={MONO} fontSize={8} fill={COL.blk.text} opacity={0.85} textAnchor="middle">8 KB</text>
          </g>
        ))}

        {/* ════ Extent 1B ════ */}
        <rect x={E1B.x} y={E1B.y} width={E1B.w} height={E1B.h} rx={E1B.r}
          fill={COL.ext.fill} stroke={COL.ext.stroke} strokeWidth={1.5} />
        <text x={E1B.x + 8} y={E1B.y + 15} fontFamily={MONO} fontSize={10} fontWeight="bold" fill={COL.ext.text}>Extent 2</text>
        <text x={E1B.x + 8} y={E1B.y + 29} fontFamily={MONO} fontSize={9} fill={COL.blk.text} opacity={0.85}>64 KB · 8 blocks</text>
        <text x={E1B.x + E1B.w / 2} y={E1B.y + E1B.h / 2 + 8}
          fontFamily={MONO} fontSize={10} fill={COL.blk.text} opacity={0.85} textAnchor="middle">8 blocks</text>

        {/* ════ Extent 2A ════ */}
        <rect x={E2A.x} y={E2A.y} width={E2A.w} height={E2A.h} rx={E2A.r}
          fill={COL.ext.fill} stroke={COL.ext.stroke} strokeWidth={1.5} />
        <text x={E2A.x + 10} y={E2A.y + 15} fontFamily={MONO} fontSize={10} fontWeight="bold" fill={COL.ext.text}>Extent 1</text>
        <text x={E2A.x + 10} y={E2A.y + 29} fontFamily={MONO} fontSize={9} fill={COL.blk.text} opacity={0.85}>64 KB · 8 blocks</text>
        {blksE2A.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={BLK2_W} height={BLK2_H} rx={3}
              fill={COL.blk.fill} stroke={COL.blk.stroke} strokeWidth={1} />
            <text x={b.x + BLK2_W / 2} y={b.y + BLK2_H / 2 - 3}
              fontFamily={MONO} fontSize={9} fontWeight="bold" fill={COL.blk.text} textAnchor="middle">Block</text>
            <text x={b.x + BLK2_W / 2} y={b.y + BLK2_H / 2 + 9}
              fontFamily={MONO} fontSize={8} fill={COL.blk.text} opacity={0.85} textAnchor="middle">8 KB</text>
          </g>
        ))}

        {/* ════ 화살표: Extent → Datafile ════ */}
        {arrowPts.map((a, i) => (
          <line key={i}
            x1={a.from.x} y1={a.from.y}
            x2={a.to.x} y2={a.to.y}
            stroke={COL.arrow} strokeWidth={1.5} strokeDasharray="5 3"
            markerEnd="url(#harr)" />
        ))}

        {/* ════ DataFile 1 · 2 ════ */}
        {[DBF1, DBF2].map((f, i) => (
          <g key={i}>
            <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r}
              fill={COL.dbf.fill} stroke={COL.dbf.stroke} strokeWidth={1.5} />
            <text x={f.x + 14} y={f.y + 20} fontFamily={MONO} fontSize={11} fontWeight="bold" fill={COL.dbf.text}>
              users0{i + 1}.dbf
            </text>
            <text x={f.x + 14} y={f.y + 38} fontSize={9.5} fill={COL.ink2}>
              {lbl('물리 데이터 파일', 'Physical datafile')}
            </text>
          </g>
        ))}

        <text
          x={(DBF1.x + DBF2.x + DBF2.w) / 2}
          y={DBF_Y + DBF_H + 22}
          fontSize={10} fill={COL.ts.text} textAnchor="middle">
          {lbl('Tablespace = 하나 이상의 .dbf 파일로 구성', 'Tablespace = one or more .dbf files')}
        </text>
      </svg>
    </figure>
  )
}

// ── StorageSection ─────────────────────────────────────────────────────────

const IO_POPUP_T = {
  ko: { before: 'Block — 최소 ', after: ' 단위' },
  en: { before: 'Block — Smallest ', after: ' Unit' },
}

export function StorageSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = STORAGE_T[lang]
  const io = IO_POPUP_T[lang]

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle title={t.sectionTitle} />
      {lang === 'ko' ? INTRO_KO : INTRO_EN}

      {/* Block */}
      <AccordionSection title={`${io.before}I/O${io.after}`}>
        <Prose>{lang === 'ko'
          ? 'Block은 Oracle이 디스크에서 데이터를 읽고 쓰는 최소 단위예요. 행(Row) 하나가 아닌 Block 전체를 한 번에 읽어서 메모리(Buffer Cache)에 올려요.\n\nI/O(Input/Output)란 데이터를 읽거나 쓰는 작업이에요. 디스크에서 데이터를 읽는 건 메모리에서 읽는 것보다 수백~수만 배 느리기 때문에, Oracle은 Block 단위로 한꺼번에 읽어 재사용하면서 불필요한 I/O를 줄여요. Block 크기를 크게 하면 한 번에 더 많은 행을 읽을 수 있지만, 필요한 행이 적을 때는 쓸모없는 데이터를 함께 읽는 낭비가 생겨요. 기본값 8 KB는 이 두 가지를 절충한 크기예요.\n\nBlock 크기는 DB_BLOCK_SIZE 초기화 파라미터로 설정하며, 데이터베이스를 재생성하지 않는 한 바꿀 수 없어요. 반드시 OS 블록 크기의 배수여야 해요. Block 하나의 오버헤드는 Header + ITL(Interested Transaction List) + Directory를 합쳐 평균 84~107 bytes예요.'
          : 'A Block is the smallest unit Oracle uses to read and write data on disk. Instead of fetching a single row, Oracle always reads an entire Block into memory (the Buffer Cache) at once.\n\nI/O (Input/Output) is any operation that reads or writes data. Disk I/O is hundreds to thousands of times slower than CPU work, so Oracle minimizes unnecessary I/O by loading data in Block-sized chunks and reusing what is already in memory. A larger Block size means more rows per read, but wastes I/O when only a few rows are needed. The default 8 KB is a practical balance between these two.\n\nBlock size is set by the DB_BLOCK_SIZE initialization parameter and cannot be changed without recreating the database. It must be a multiple of the OS block size. Total block overhead (Header + ITL — Interested Transaction List + Directory) averages 84–107 bytes per block.'
        }</Prose>
        <BlockDiagram />

        <div className="mt-8">
          <PctDiagram />
        </div>

        <div className="mt-6">
          <InfoBox variant="note">
            {lang === 'ko'
              ? '슬롯(Slot)이란 블록 안에 미리 잘라 놓은 고정 크기의 자리예요. ITL(Interested Transaction List) 슬롯은 트랜잭션 1개가 들어갈 칸(~23 bytes)이고, Row Directory 슬롯은 행 1개의 위치 포인터가 들어갈 칸이에요. 배열의 인덱스처럼 번호로 관리돼서, Oracle은 슬롯 번호만 알면 해당 데이터를 바로 찾아가요. Row Directory 슬롯은 행이 DELETE된 뒤에도 새 INSERT가 그 자리를 재사용할 때까지 해제되지 않아요.'
              : 'A slot is a pre-carved, fixed-size entry inside the block. An ITL (Interested Transaction List) slot holds one transaction\'s tracking data (~23 bytes each); a Row Directory slot holds the byte-offset pointer for one row. Slots are numbered like array indices — Oracle can locate any entry in O(1) given just the slot number. Row Directory slots are not reclaimed after DELETE; they persist until a new INSERT reuses that position.'}
          </InfoBox>
        </div>

        <Divider />
        <SubTitle>{t.rowidTitle}</SubTitle>
        <Prose>{t.rowidDesc}</Prose>
        <RowidDiagram />
        <div className="mt-4">
          <Table
            headers={lang === 'ko'
              ? ['구성 요소', '의미', '예시']
              : ['Component', 'Meaning', 'Example']}
            rows={t.rowidFormat}
          />
        </div>
        <div className="mt-4">
          <InfoBox variant="note">{t.rowidNote}</InfoBox>
        </div>
      </AccordionSection>

      {/* Extent */}
      <AccordionSection title={t.extentTitle}>
        <Prose>{t.extentDesc}</Prose>
        <ExtentDiagram />

        <div className="mt-8">
          <SubTitle>{lang === 'ko' ? 'Extent 크기 — 블록이 몇 개나 들어갈까?' : 'Extent Size — how many blocks?'}</SubTitle>
          <Prose>{t.extentSizeDesc}</Prose>
          <Table
            headers={lang === 'ko'
              ? ['Extent', '크기 / 블록 수', '조건']
              : ['Extent', 'Size / Block Count', 'Condition']}
            rows={t.extentSizeTable}
          />
        </div>

        <div className="mt-8">
          <SubTitle>{lang === 'ko' ? 'Extent 관련 스토리지 파라미터' : 'Extent Storage Parameters'}</SubTitle>
          <Prose>{t.extentParamDesc}</Prose>
          <Table
            headers={lang === 'ko'
              ? ['파라미터', '설명']
              : ['Parameter', 'Description']}
            rows={t.extentParams}
          />
          <div className="mt-4">
            <InfoBox variant="note">
              {lang === 'ko'
                ? 'Oracle 10g 이후 LMT(Locally Managed Tablespace)가 기본값이에요. INITIAL·NEXT·PCTINCREASE는 기존 코드 호환성을 위해 문법상 허용되지만, 실제로는 Oracle이 무시하고 AUTOALLOCATE 규칙을 따라요. 신규 테이블스페이스는 별도 이유가 없다면 AUTOALLOCATE를 그대로 쓰는 게 권장돼요.'
                : 'Since Oracle 10g, LMT (Locally Managed Tablespaces) are the default. INITIAL, NEXT, and PCTINCREASE are still accepted syntactically for backward compatibility, but Oracle ignores them and follows AUTOALLOCATE rules. For new tablespaces, sticking with AUTOALLOCATE is recommended unless you have a specific reason to use UNIFORM SIZE.'}
            </InfoBox>
          </div>
        </div>
      </AccordionSection>

      {/* Segment */}
      <AccordionSection title={t.segmentTitle}>
        <Prose>{t.segmentDesc}</Prose>
        <SegmentDiagram />

        <div className="mt-8">
          <SubTitle>{t.hwmTitle}</SubTitle>
          <Prose>{t.hwmDesc}</Prose>
          <HwmDiagram />
        </div>

        <Divider />
        <div className="mt-2">
          <SubTitle>{lang === 'ko' ? 'Segment의 종류' : 'Types of Segment'}</SubTitle>
          <ConceptGrid items={t.segmentTypes} />
          <div className="mt-4">
            <InfoBox variant="note">
              {lang === 'ko'
                ? 'LOB 컬럼이 있는 테이블을 만들면 오브젝트 하나에 Segment가 4개까지 생겨요: 테이블 데이터 Segment, PRIMARY KEY 인덱스 Segment, CLOB 데이터 Segment, CLOB 인덱스 Segment. "테이블 = Segment 1개"는 단순 테이블에만 해당해요.'
                : 'A table with a LOB column can create up to 4 Segments for one object: table data, primary key index, LOB data, and LOB index Segments. The "one table = one Segment" rule applies only to simple heap-organized tables.'}
            </InfoBox>
          </div>
        </div>
      </AccordionSection>

      {/* Tablespace */}
      <AccordionSection title={t.tablespaceTitle}>
        <Prose>{t.tablespaceDesc}</Prose>

        <div className="mt-6">
          <SubTitle>{t.tablespaceTypeTitle}</SubTitle>
          <ConceptGrid items={t.tablespaceTypes} />
        </div>

        <TablespaceDiagram />

        <div className="mt-8">
          <SubTitle>{lang === 'ko' ? 'Oracle 기본 Tablespace 목록' : 'Built-in Oracle Tablespaces'}</SubTitle>
          <Prose>{t.tablespaceFileDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? 'Tablespace' : 'Tablespace', lang === 'ko' ? '용도' : 'Purpose']}
            rows={t.tablespaceTable}
          />
        </div>

        <Divider />
        <div className="mt-2">
          <SubTitle>{t.lmtTitle}</SubTitle>
          <Prose>{t.lmtDesc}</Prose>
          <Table
            headers={lang === 'ko'
              ? ['항목', 'LMT (Locally Managed)', 'DMT (Dictionary Managed)']
              : ['Item', 'LMT (Locally Managed)', 'DMT (Dictionary Managed)']}
            rows={t.lmtTable.slice(1)}
          />
        </div>

        <div className="mt-8">
          <SubTitle>{t.assmTitle}</SubTitle>
          <Prose>{t.assmDesc}</Prose>
          <Table
            headers={lang === 'ko'
              ? ['항목', 'ASSM (Automatic)', 'MSSM (Manual)']
              : ['Item', 'ASSM (Automatic)', 'MSSM (Manual)']}
            rows={t.assmTable.slice(1)}
          />
        </div>

        <div className="mt-6">
          <InfoBox variant="tip">{t.tablespaceNote}</InfoBox>
        </div>
      </AccordionSection>

      <div className="mt-8">
        <InfoBox variant="summary">{t.infoBody}</InfoBox>
      </div>

      <StorageHierarchyDiagram />
    </PageContainer>
  )
}
