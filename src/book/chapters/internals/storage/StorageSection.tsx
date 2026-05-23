import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, Prose, SubTitle,
  InfoBox, Table, ConceptGrid, AccordionSection, Divider,
} from '../../shared'
import { cn } from '@/lib/utils'
import { IconCube, IconArrowDown, IconArrowUp } from '@tabler/icons-react'

// ── Intro paragraph ────────────────────────────────────────────────────────

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
)
const Hi = ({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'amber' | 'teal' | 'orange' | 'violet' }) => {
  const cls = {
    blue:   'text-blue-600 font-semibold',
    amber:  'text-amber-600 font-semibold',
    teal:   'text-teal-600 font-semibold',
    orange: 'text-orange-600 font-semibold',
    violet: 'text-violet-600 font-semibold',
  }[color]
  return <span className={cls}>{children}</span>
}

const INTRO_KO = (
  <div className="space-y-3 mb-6 text-sm leading-relaxed text-muted-foreground">
    <p>
      앞 챕터에서 Oracle이 데이터를 읽을 때 <Hi color="blue">블록(Block) 단위</Hi>로 가져온다고 배웠습니다.
      그렇다면 <Hi color="orange">블록 안에는 데이터가 어떤 구조로 들어 있길래</Hi> 원하는 행을 바로 찾을 수 있을까요?
    </p>
    <p>
      단순히 행을 줄줄이 이어 붙인 것이라면 Oracle은 블록 전체를 처음부터 훑어야 하겠지만,
      실제 블록에는 <B>헤더·트랜잭션 슬롯·행 위치 포인터</B>가 정해진 자리에 담겨 있습니다.
      Oracle은 <Hi color="teal">ROWID</Hi> 하나만 알면 <B>어느 파일의 몇 번 블록의 몇 번 슬롯</B>인지 바로 계산해
      원하는 행으로 곧장 점프합니다.
    </p>
    <p>
      블록들이 모여 <Hi color="teal">Extent</Hi>(연속 블록 묶음)가 되고, Extent들이 모여 테이블·인덱스 단위의 <Hi color="violet">Segment</Hi>가 되며,
      Segment들의 논리적 컨테이너가 <Hi color="blue">Tablespace</Hi>입니다.
      이 <B>Block → Extent → Segment → Tablespace</B> 4계층이 Oracle이 저장 공간을 관리하는 방식입니다.
      계층은 <B>논리적 단위</B>(Oracle 내부 개념)이며, 실제 파일 시스템에는 <B>.dbf 데이터 파일</B>로만 존재합니다.
    </p>
    <p className="text-xs text-muted-foreground/70">가장 작은 단위인 Block부터 하나씩 살펴봅니다.</p>
  </div>
)

const INTRO_EN = (
  <div className="space-y-3 mb-6 text-sm leading-relaxed text-muted-foreground">
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
    <p className="text-xs text-muted-foreground/70">Click each section below to explore the tiers one by one.</p>
  </div>
)


// ── Bilingual strings ──────────────────────────────────────────────────────

const STORAGE_T = {
  ko: {
    sectionTitle: '데이터 저장 구조',

    blockTitle: 'Block — 최소 I/O 단위',

    rowidTitle: 'ROWID — 행의 물리적 주소',
    rowidDesc: 'ROWID는 Oracle이 테이블의 각 행에 부여하는 고유한 물리적 주소입니다. 실제로 컬럼 값으로 저장되지 않고, 파일·블록·슬롯 위치로부터 즉석에서 계산됩니다.\n\nExtended ROWID는 Base64로 인코딩된 18자리 문자열로, 4개 구성 요소로 이루어집니다.',
    rowidFormat: [
      ['OOOOOO (6자)', '데이터 오브젝트 번호 — 이 행이 속한 Segment(테이블/인덱스) 식별자', '예: AAAPec'],
      ['FFF (3자)', 'Tablespace 상대 파일 번호 — 데이터베이스 내 파일 식별자', '예: AAF'],
      ['BBBBBB (6자)', '파일 내 블록 번호 — 파일 기준 블록 위치', '예: AAAABS'],
      ['RRR (3자)', '블록 내 Row Directory 슬롯 번호 — O(1) 접근의 핵심', '예: AAA'],
    ],
    rowidNote: 'ROWID는 행이 블록 내에서 이동해도 변하지 않습니다(Row Directory 포인터가 갱신됨). 단, 파티션 키 업데이트·Flashback Table·Shrink 작업 시에는 변경될 수 있습니다.',

    extentTitle: 'Extent — 연속 블록의 묶음',
    extentDesc: 'Block들이 모여 만들어지는 첫 번째 묶음 단위입니다. Oracle은 테이블이나 인덱스에 공간이 필요할 때 행 하나씩이 아니라 Extent 단위로 한꺼번에 할당합니다. Extent 안의 블록들은 논리적으로 연속된 주소에 놓이지만, RAID 스트라이핑 등으로 물리적으로는 분산될 수 있습니다.\n\n중요한 제약: Extent는 반드시 하나의 데이터 파일 안에만 존재합니다. 여러 파일에 걸쳐질 수 없습니다. 반면 한 Segment의 Extent들은 같은 Tablespace 안 여러 파일에 분산될 수 있습니다.\n\nOracle의 기본 Extent 크기는 8개 블록(64 KB)입니다. 이는 너무 작으면 공간 할당을 자주 반복해 오버헤드가 커지고, 너무 크면 작은 테이블도 불필요하게 큰 공간을 차지하는 문제 사이의 절충점으로 Oracle이 설계한 값입니다.\n\nLMT(Locally Managed Tablespace, 로컬 관리 테이블스페이스)의 AUTOALLOCATE 모드에서는 Segment가 커질수록 Extent 크기를 자동으로 늘립니다. 이렇게 단계적으로 키우는 이유는 작은 테이블은 공간 낭비 없이 시작하고, 대형 테이블은 Extent 수가 너무 많아지지 않도록 하기 위해서입니다.',
    extentSizeDesc: 'Extent 하나에 들어있는 블록 수와 크기는 Tablespace 관리 방식에 따라 달라집니다. LMT(Locally Managed Tablespace)에서 AUTOALLOCATE를 쓰면 Oracle이 Segment 크기에 맞게 자동으로 64 KB → 1 MB → 8 MB → 64 MB 순으로 Extent를 키워나갑니다. UNIFORM SIZE를 지정하면 처음부터 끝까지 같은 크기(예: 1 MB)로 고정됩니다.',
    extentSizeTable: [
      ['첫 번째 Extent', '64 KB (블록 8KB 기준 → 8개 블록)', 'AUTOALLOCATE 초기값'],
      ['두 번째~넷째', '64 KB 유지', '1 MB 미만 Segment'],
      ['다섯 번째 이후', '1 MB (128블록)', '1 MB 이상 Segment부터 자동 확장'],
      ['더 커지면', '8 MB, 64 MB 순으로 증가', '대형 테이블 순차 I/O 최적화'],
      ['UNIFORM SIZE 1 MB', '128블록 고정', '수동 지정 시 처음부터 끝까지 동일'],
    ],
    extentParamDesc: 'Extent 동작을 제어하는 주요 스토리지 파라미터입니다. CREATE TABLE / CREATE TABLESPACE 구문에서 지정하거나, Locally Managed 방식이면 대부분 Oracle이 자동으로 관리합니다.',
    extentParams: [
      ['INITIAL', 'Segment가 처음 생성될 때 할당되는 첫 번째 Extent 크기. 기본값은 Tablespace 설정에 따라 64 KB ~ 1 MB.'],
      ['NEXT', '두 번째 이후 Extent 크기. DMT(Dictionary Managed Tablespace) 방식에서만 의미 있음. LMT(Locally Managed)에서는 Oracle이 무시.'],
      ['MINEXTENTS', 'Segment 생성 시 미리 확보할 최소 Extent 수. 기본값 1. 큰 테이블을 만들 때 미리 늘려두면 점진적 확장 오버헤드를 줄일 수 있음.'],
      ['MAXEXTENTS', 'Segment가 가질 수 있는 최대 Extent 수. UNLIMITED 권장. 너무 작게 지정하면 "ORA-01628: max # extents reached" 오류 발생.'],
      ['PCTINCREASE', '매 Extent 할당 시 크기를 몇 % 씩 키울지. DMT(Dictionary Managed Tablespace) 전용. LMT(Locally Managed)에서는 무시되며 0으로 고정.'],
      ['UNIFORM SIZE', 'CREATE TABLESPACE 시 지정. 해당 Tablespace의 모든 Extent를 동일 크기로 강제. 예: EXTENT MANAGEMENT LOCAL UNIFORM SIZE 1M.'],
    ],

    segmentTitle: 'Segment — 오브젝트 저장 공간',
    segmentDesc: 'Extent들이 모여 하나의 Segment가 됩니다. Segment는 테이블·인덱스처럼 데이터베이스 오브젝트 하나와 1:1로 대응합니다. EMPLOYEES 테이블을 만들면 Oracle은 그 테이블 전용 Segment를 하나 만들고, 거기에 Extent를 할당해 줍니다.\n\n처음엔 작은 Extent 하나로 시작하지만, 데이터가 쌓여서 꽉 차면 Oracle이 자동으로 새 Extent를 붙여 Segment를 늘립니다. 파티션 테이블은 파티션 하나당 Segment 하나가 생깁니다.\n\nOracle 11g 이후 기본적으로 지연 Segment 생성(Deferred Segment Creation)이 적용됩니다. CREATE TABLE 시점엔 메타데이터만 만들고, 첫 번째 INSERT가 일어날 때 실제 Segment(디스크 공간)가 할당됩니다. 수천 개의 테이블을 생성하는 설치 스크립트가 불필요한 공간을 차지하지 않도록 설계된 동작입니다.',
    segmentGrowthDesc: 'Segment는 데이터가 늘어날수록 자동으로 Extent를 추가해 성장합니다. 아래는 EMPLOYEES 테이블의 Segment가 커지는 과정입니다.',
    hwmTitle: 'HWM — High Water Mark',
    hwmDesc: 'HWM(High Water Mark, 최고 수위 표시)은 Segment 안에서 "한 번이라도 데이터가 쓰인 적 있는 마지막 블록"의 경계선입니다. HWM 위쪽은 한 번도 사용된 적 없는 미포맷 블록이고, HWM 아래쪽은 현재 데이터가 있거나 DELETE로 비워진 블록입니다.\n\nHWM의 핵심 특성은 한 번 올라가면 내려오지 않는다는 것입니다. 테이블에서 모든 행을 DELETE해도 HWM은 그대로입니다. Full Table Scan(전체 테이블 스캔)은 HWM까지의 모든 블록을 읽기 때문에, 대량 삭제 후에도 스캔 비용이 줄지 않습니다.\n\nHWM을 실제로 낮추려면 TRUNCATE TABLE, ALTER TABLE ... SHRINK SPACE, 또는 테이블을 재생성(MOVE)해야 합니다.\n\nASSM(Automatic Segment Space Management, 자동 세그먼트 공간 관리)에서는 HWM와 Low HWM 두 개의 경계가 있습니다. Low HWM 아래는 포맷이 확실히 완료된 블록, Low HWM~HWM 사이는 할당은 됐지만 일부만 포맷된 구간입니다. Full Table Scan은 이 구조를 이용해 Low HWM까지는 연속으로 읽고, 그 위는 포맷된 블록만 선별해 읽습니다.',
    segmentTypes: [
      { icon: '🗄', title: 'Table Segment', desc: '일반 테이블의 행 데이터 저장. CREATE TABLE 시 자동 생성. LOB 컬럼이 있으면 LOB 데이터·인덱스 Segment가 별도로 추가됨.', color: 'blue' },
      { icon: '🔍', title: 'Index Segment', desc: 'B-Tree·Bitmap 인덱스 구조 저장. CREATE INDEX 시 자동 생성. 인덱스 생성 중 임시로 Temp Segment가 사용되다 완성 후 영구 Segment로 전환됨.', color: 'violet' },
      { icon: '↩', title: 'Undo Segment', desc: 'ROLLBACK과 Read Consistency를 위한 변경 전 이미지(before-image) 보관. Ring 구조로 Extent를 순환 재사용. Undo Tablespace가 자동 관리.', color: 'orange' },
      { icon: '📦', title: 'Temp Segment', desc: '정렬·해시 조인·비트맵 병합 등 임시 작업 공간. 쿼리가 끝나면 자동 반환. Temporary Tablespace에 할당되며 Redo 로그를 생성하지 않음.', color: 'emerald' },
    ],

    tablespaceTitle: 'Tablespace — 논리적 저장 컨테이너',
    tablespaceDesc: 'Segment들을 담는 논리적 그릇입니다. 물리적으로는 한 개 이상의 .dbf 데이터 파일로 이루어져 있지만, DBA는 파일 경로 대신 Tablespace 이름만으로 공간을 관리합니다.\n\n예를 들어 EMPLOYEES 테이블을 USERS Tablespace에 만들면, Oracle은 USERS Tablespace에 속한 .dbf 파일 안 어딘가에 EMPLOYEES Segment를 배치합니다. DBA는 users01.dbf가 어디 있는지 몰라도 되고, 공간이 부족하면 파일을 추가하거나 Autoextend를 켜서 늘리기만 하면 됩니다.',
    tablespaceTypeTitle: 'Tablespace의 세 가지 유형',
    tablespaceTypes: [
      { icon: '💾', title: 'Permanent', desc: '테이블·인덱스·LOB 등 영구 스키마 오브젝트 저장. SYSTEM·SYSAUX·USERS가 대표 예시.', color: 'blue' },
      { icon: '⏱', title: 'Temporary', desc: '정렬·해시·비트맵 병합 임시 데이터 저장. Redo 로그 미생성. 쿼리 종료 시 자동 해제. Tempfile 사용.', color: 'teal' },
      { icon: '↩', title: 'Undo', desc: 'Undo Segment 전용. 시스템이 자동 관리. UNDO_TABLESPACE 파라미터로 지정. AUTOEXTEND ON 권장.', color: 'orange' },
    ],
    tablespaceFileDesc: 'Tablespace마다 용도가 다릅니다. Oracle이 기본으로 만드는 주요 Tablespace는 아래와 같습니다.',
    tablespaceTable: [
      ['SYSTEM', '데이터 딕셔너리 저장 (테이블·인덱스 메타데이터). 항상 온라인. 사용자 오브젝트 저장 금지.'],
      ['SYSAUX', 'AWR 통계, Streams 등 Oracle 내부 컴포넌트 데이터 저장. SYSTEM의 보조 공간.'],
      ['UNDO', 'Undo 데이터 전용. UNDO_TABLESPACE 파라미터로 어느 것을 쓸지 지정.'],
      ['TEMP', '정렬·해시 조인 임시 데이터. 트랜잭션이 끝나면 공간이 자동 해제됨.'],
      ['USERS', 'DBA가 만드는 사용자 데이터용 공간. 대부분의 애플리케이션 테이블이 여기에 들어감.'],
    ],
    lmtTitle: 'LMT vs DMT — Tablespace 관리 방식 비교',
    lmtDesc: 'Tablespace가 여유 공간을 추적하는 방식에는 두 가지가 있습니다. LMT(Locally Managed Tablespace, 로컬 관리 테이블스페이스)와 DMT(Dictionary Managed Tablespace, 딕셔너리 관리 테이블스페이스)입니다. Oracle 10g 이후에는 LMT가 기본이자 표준입니다.',
    lmtTable: [
      ['관리 방식', 'LMT (Locally Managed)', 'DMT (Dictionary Managed)'],
      ['여유 공간 추적', '데이터 파일 헤더의 비트맵', '데이터 딕셔너리 테이블'],
      ['Extent 할당', '비트맵 업데이트 (빠름)', '딕셔너리 SQL 실행 (느림)'],
      ['재귀 SQL', '없음', '있음 (직렬화 병목)'],
      ['인접 공간 병합', '자동 (비트맵 기반)', '수동 COALESCE 필요'],
      ['권장 여부', '✅ 현재 표준', '⚠️ Deprecated — 사용 금지'],
    ],
    assmTitle: 'ASSM vs MSSM — Segment 공간 관리 방식',
    assmDesc: 'Tablespace 안에서 각 블록의 여유 공간을 추적하는 방법도 두 가지입니다. ASSM(Automatic Segment Space Management, 자동 세그먼트 공간 관리)과 MSSM(Manual Segment Space Management, 수동 세그먼트 공간 관리)이며, 현대 Oracle에서는 ASSM이 기본입니다.',
    assmTable: [
      ['관리 방식', 'ASSM (Automatic)', 'MSSM (Manual, Legacy)'],
      ['여유 공간 추적', '비트맵 (블록별)', 'Freelist (연결 리스트)'],
      ['필요 파라미터', 'PCTFREE만 설정', 'PCTFREE + PCTUSED + FREELISTS + FREELIST GROUPS'],
      ['동시성', '높음 (별도 Freelist 검색)', '낮음 (공유 Freelist 경합)'],
      ['RAC 지원', '동적 인스턴스 친화성', '수동 FREELIST GROUPS 설정'],
      ['권장 여부', '✅ 기본값·권장', '⚠️ Legacy — 신규 사용 금지'],
    ],
    tablespaceNote: 'DBA는 Tablespace에 파일을 추가(ALTER TABLESPACE ... ADD DATAFILE)하거나 AUTOEXTEND ON을 설정해 공간이 자동으로 늘어나게 할 수 있습니다. 여러 .dbf 파일에 걸쳐 있어도 Oracle이 하나의 논리적 공간으로 합쳐서 관리합니다.',

    infoTitle: '핵심 정리',
    infoBody: 'Block이 I/O의 기본 단위이고, Extent가 할당의 기본 단위이며, Segment가 오브젝트와 1:1 대응하고, Tablespace가 DBA 관리의 논리 단위입니다. ROWID = 오브젝트#+파일#+블록#+슬롯# 4요소로 행 위치를 O(1)에 특정합니다.',
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
    { chars: 'AAAPec', label: isKo ? '오브젝트 번호' : 'Object #', sublabel: 'OOOOOO', color: 'bg-violet-500', light: 'bg-violet-50 border-violet-300 text-violet-700' },
    { chars: 'AAF',    label: isKo ? '파일 번호' : 'File #',   sublabel: 'FFF',    color: 'bg-blue-500',   light: 'bg-blue-50 border-blue-300 text-blue-700'   },
    { chars: 'AAAABS', label: isKo ? '블록 번호' : 'Block #',  sublabel: 'BBBBBB', color: 'bg-emerald-500',light: 'bg-emerald-50 border-emerald-300 text-emerald-700'},
    { chars: 'AAA',    label: isKo ? '슬롯 번호' : 'Slot #',   sublabel: 'RRR',    color: 'bg-orange-500', light: 'bg-orange-50 border-orange-300 text-orange-700' },
  ]

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-slate-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">ROWID</span>
        <span className="font-mono text-[11px] text-slate-600">
          {isKo ? 'Extended ROWID — 18자리 Base64 인코딩' : 'Extended ROWID — 18-character Base64 encoding'}
        </span>
      </div>

      {/* ROWID 문자열 시각화 */}
      <div className="mb-4 flex items-stretch overflow-hidden rounded-lg border border-slate-300 shadow-sm">
        {parts.map((p) => (
          <div key={p.sublabel} className={cn('flex flex-col items-center justify-center px-2 py-2 flex-1 border-r last:border-r-0 border-slate-200', p.light.replace('border-', 'bg-').split(' ')[0])}>
            <span className="font-mono text-sm font-bold tracking-widest text-slate-800">{p.chars}</span>
            <span className={cn('mt-0.5 font-mono text-[9px] font-bold', p.light.split(' ')[2])}>{p.sublabel}</span>
          </div>
        ))}
      </div>

      {/* 설명 행 */}
      <div className="flex flex-col sm:flex-row gap-2">
        {parts.map((p) => (
          <div key={p.sublabel} className={cn('flex-1 rounded-lg border px-3 py-2', p.light)}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white', p.color)}>{p.sublabel}</span>
              <span className="font-mono text-[10px] font-bold">{p.label}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-600">{p.chars}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-[10px] text-slate-500 leading-relaxed">
        {isKo
          ? '→ Oracle은 ROWID 하나로 "어느 Segment의 어느 파일의 몇 번 블록의 몇 번 슬롯"을 즉시 계산해 해당 행으로 점프합니다.'
          : '→ From one ROWID, Oracle instantly computes "which Segment → which file → which block → which slot" and jumps directly to the row.'}
      </p>
    </div>
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
    badgeColor: 'bg-blue-500',
    zoneBg: 'bg-blue-50',
    activeRing: 'ring-2 ring-blue-400',
    titleKo: 'Common Header (캐시 계층)',
    titleEn: 'Common Header (Cache Layer)',
    descKo: '"캐시 계층"이라 불리는 이유는 이 헤더가 디스크가 아닌 Buffer Cache(메모리) 안에서만 유지되는 정보를 담기 때문입니다. 블록이 디스크에서 메모리로 올라오면 Oracle이 이 영역을 채우고, 블록이 다시 디스크로 내려갈 때는 일부 필드가 제거됩니다.',
    descEn: 'Called the "cache layer" because this header holds fields maintained only while the block lives in the Buffer Cache (memory). Oracle fills it when a block is read from disk and strips some fields when it is written back.',
    rows: [
      { termKo: 'Block Type', termEn: 'Block Type', descKo: '블록 종류 식별자 (데이터·인덱스·언두 등)', descEn: 'Identifies data / index / undo block type' },
      { termKo: 'DBA', termEn: 'DBA', descKo: 'Data Block Address — 이 블록이 디스크의 어느 위치에 있는지 나타내는 주소. 파일 번호 + 블록 번호로 구성됩니다.', descEn: 'Data Block Address — the on-disk location of this block, expressed as file# + block#.' },
      { termKo: 'SCN', termEn: 'SCN', descKo: 'System Change Number. Oracle이 커밋이나 주요 변경마다 전역으로 증가시키는 논리 시계(숫자). 이 블록이 마지막으로 변경된 시점의 SCN이 기록되어, 복구·Read Consistency 판단에 쓰입니다.', descEn: 'System Change Number — a global logical clock Oracle increments on every commit or key change. The SCN recorded here marks when this block was last written, used for recovery and Read Consistency.' },
      { termKo: 'Checksum', termEn: 'Checksum', descKo: '블록 전체 바이트를 특정 알고리즘으로 계산한 검증값. 블록을 디스크에서 읽을 때 다시 계산해 저장된 값과 비교하여, 디스크 오류·비트 손상을 감지합니다. DB_BLOCK_CHECKSUM 파라미터로 활성화합니다.', descEn: 'A value computed over all bytes in the block. On every read from disk, Oracle recomputes and compares it to detect disk errors or bit corruption. Enabled via DB_BLOCK_CHECKSUM.' },
    ],
  },
  {
    id: 'itl',
    labelKo: 'ITL',
    labelEn: 'ITL',
    badgeColor: 'bg-indigo-500',
    zoneBg: 'bg-indigo-50',
    activeRing: 'ring-2 ring-indigo-400',
    titleKo: 'ITL — Interested Transaction List',
    titleEn: 'ITL — Interested Transaction List',
    descKo: '이 블록을 동시에 수정 중인 트랜잭션 슬롯 목록. INITRANS 수만큼 미리 확보하고, 부족하면 Free Space에서 동적 확장합니다.',
    descEn: 'Slots tracking concurrent transactions modifying this block. Pre-allocated by INITRANS; expands into Free Space when needed.',
    rows: [
      { termKo: 'XID', termEn: 'XID', descKo: 'Transaction ID — Undo Seg# · Slot# · Seq# 세 숫자의 조합으로 트랜잭션을 고유하게 식별합니다.', descEn: 'Transaction ID — a three-part key (Undo Seg# · Slot# · Seq#) that uniquely identifies a transaction.' },
      { termKo: 'UBA', termEn: 'UBA', descKo: 'Undo Block Address — 이 트랜잭션이 변경하기 전의 데이터(이전 이미지)가 기록된 Undo 블록의 디스크 주소. 이전 이미지란 UPDATE·DELETE 직전에 Oracle이 Undo Segment에 복사해 둔 원본 값으로, ROLLBACK 시 이 값으로 되돌리고, 다른 세션이 이전 시점의 데이터를 읽을 때(Read Consistency)도 이 값을 참조합니다.', descEn: 'Undo Block Address — the on-disk address of the Undo block that holds the before-image for this transaction. A before-image is the original column value Oracle copies into the Undo Segment just before an UPDATE or DELETE. It is used to revert the row on ROLLBACK, and by other sessions that need to read an older consistent snapshot (Read Consistency).' },
      { termKo: 'Flag', termEn: 'Flag', descKo: 'C = 커밋됨 / U = 행에 잠금 중 / T = 활성 트랜잭션 진행 중', descEn: 'C = committed / U = row locked / T = active transaction in progress' },
      { termKo: 'INITRANS', termEn: 'INITRANS', descKo: '블록 생성 시 ITL 슬롯을 미리 확보하는 수. 기본값은 테이블 1, 인덱스 2. 슬롯이 부족하면 Free Space를 잠식해 동적으로 늘어납니다.', descEn: 'Number of ITL slots pre-allocated when the block is created. Default: 1 for tables, 2 for indexes. If all slots are full, Oracle carves new ones from Free Space.' },
      { termKo: 'MAXTRANS', termEn: 'MAXTRANS', descKo: '한 블록에서 동시에 활성화할 수 있는 ITL 슬롯의 상한. Oracle 10g 이후에는 사실상 255로 고정되어 사용자가 제어할 수 없습니다. INITRANS와 달리 MAXTRANS를 DDL로 지정해도 무시됩니다.', descEn: 'Upper bound on the number of active ITL slots in a block. Since Oracle 10g it is effectively fixed at 255 and cannot be controlled by the user. Unlike INITRANS, any MAXTRANS value set via DDL is silently ignored.' },
    ],
  },
  {
    id: 'directory',
    labelKo: 'Row Directory',
    labelEn: 'Row Directory',
    badgeColor: 'bg-slate-500',
    zoneBg: 'bg-slate-50',
    activeRing: 'ring-2 ring-slate-400',
    titleKo: 'Table / Row Directory',
    titleEn: 'Table / Row Directory',
    descKo: '블록 내 각 행의 위치(바이트 오프셋)를 담은 포인터 배열. ROWID 접근 시 이 배열로 O(1)에 해당 행으로 점프합니다.',
    descEn: 'Pointer array holding the byte offset of each row. ROWID access jumps to the row in O(1) via this directory.',
    rows: [
      { termKo: 'Row #N offset', termEn: 'Row #N offset', descKo: 'N번 행의 블록 내 바이트 오프셋 (ROWID slot# = 배열 인덱스)', descEn: 'Byte offset of row N inside the block (ROWID slot# = array index)' },
      { termKo: 'DELETE 후', termEn: 'After DELETE', descKo: '슬롯은 0xFFFF로 표시 → 재사용될 때까지 유지', descEn: 'Slot is marked 0xFFFF until reused by a new insert' },
    ],
  },
  {
    id: 'free',
    labelKo: 'Free Space',
    labelEn: 'Free Space',
    badgeColor: 'bg-green-500',
    zoneBg: 'bg-green-50',
    activeRing: 'ring-2 ring-green-400',
    titleKo: 'Free Space — PCTFREE 예약 구간',
    titleEn: 'Free Space — PCTFREE Reserved Zone',
    descKo: 'INSERT 상한선(PCTFREE, 기본 10%)을 지키기 위해 비워 두는 구간. UPDATE 시 가변 컬럼이 늘어나는 공간이 됩니다. 위에서 내려오는 Directory와 아래에서 올라오는 Row Data 사이에 위치합니다.',
    descEn: 'Reserved space to honor PCTFREE (default 10%). Used for in-place UPDATE growth. Located between the downward-growing Directory and the upward-growing Row Data.',
    rows: [
      { termKo: 'PCTFREE', termEn: 'PCTFREE', descKo: 'INSERT 상한선 — 여유 공간이 이 비율 이하로 줄면 새 INSERT 금지', descEn: 'INSERT cutoff — new INSERTs blocked once free space drops below this %' },
      { termKo: 'PCTUSED', termEn: 'PCTUSED', descKo: 'Freelist 재진입 하한선 — 이 값 아래로 떨어지면 블록을 Freelist에 재등록', descEn: 'Freelist re-entry floor — block is re-added to Freelist when used% drops below this' },
      { termKo: 'Row Migration', termEn: 'Row Migration', descKo: 'PCTFREE 부족으로 UPDATE 제자리 저장 불가 → 다른 블록으로 이동 + 포인터 남김 → 추가 I/O', descEn: 'UPDATE can\'t fit in place → row moves to another block, forwarding pointer left → extra I/O' },
      { termKo: 'Row Chaining', termEn: 'Row Chaining', descKo: '행 자체가 블록보다 커서 여러 블록에 걸쳐 저장 (LOB 등)', descEn: 'Row larger than one block → stored across multiple blocks (LOB, wide rows)' },
    ],
  },
  {
    id: 'rowdata',
    labelKo: 'Row Data',
    labelEn: 'Row Data',
    badgeColor: 'bg-orange-500',
    zoneBg: 'bg-orange-50',
    activeRing: 'ring-2 ring-orange-400',
    titleKo: 'Row Data',
    titleEn: 'Row Data',
    descKo: '실제 행 데이터가 저장되는 영역. 블록의 끝(높은 주소)에서 위쪽으로 쌓입니다. 새 행이 INSERT 될수록 Free Space를 잠식하며 올라옵니다.',
    descEn: 'Actual row data, growing upward from the bottom (high address) of the block. Each new INSERT consumes Free Space from below.',
    rows: [
      { termKo: 'Row Header', termEn: 'Row Header', descKo: '행 플래그(삭제·마이그레이션 여부), 컬럼 수, 락 바이트 (2~3 bytes)', descEn: 'Row flags (deleted/migrated), column count, lock byte (2–3 bytes)' },
      { termKo: 'Column Data', termEn: 'Column Data', descKo: '컬럼 길이(1 byte) + 실제 데이터. NULL은 0xFF 1바이트', descEn: 'Length byte + column value. NULL stored as 0xFF (1 byte)' },
      { termKo: 'VARCHAR2', termEn: 'VARCHAR2', descKo: '길이 prefix + 문자 데이터 (가변 길이 저장)', descEn: 'Length prefix + character data (variable-length storage)' },
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

  return (
    <div className="flex flex-col gap-6">
      {/* ── 타이틀 — 블록 시각과 정렬 맞춤 ── */}
      <div className="mt-6 mb-2 flex items-center gap-2">
        <IconCube size={16} className="text-slate-500" stroke={1.5} />
        <span className="text-sm font-bold text-foreground/90">
          {isKo ? '오라클의 블록은 이렇게 생겼어요' : 'Anatomy of an Oracle Block'}
        </span>
      </div>

      <div className="flex items-stretch gap-6">
      {/* ── Block visual (left) ── */}
      <div className="flex shrink-0 gap-0">

        {/* 좌측 브라켓 — 블록 왼편, 오른쪽으로 열리는 { 형태: [텍스트][브라켓][블록] */}
        <div className="flex flex-col">
          {/* 데이터 블록 헤더: header(48) + itl(48) = 96px */}
          <div className="relative flex items-center pr-3" style={{ height: ROW_H * 2 }}>
            <span className="font-mono text-[9px] font-bold text-rose-500 leading-tight whitespace-nowrap">
              {isKo ? '데이터 블록 헤더' : 'Block Header'}
            </span>
            <div className="absolute inset-y-2 right-0 w-2 border-l-2 border-t-2 border-b-2 border-rose-400 rounded-l" />
          </div>
          {/* 데이터 헤더: directory(48) */}
          <div className="relative flex items-center pr-3" style={{ height: ROW_H }}>
            <span className="font-mono text-[9px] font-bold text-amber-500 leading-tight whitespace-nowrap">
              {isKo ? '데이터 헤더' : 'Data Header'}
            </span>
            <div className="absolute inset-y-2 right-0 w-2 border-l-2 border-t-2 border-b-2 border-amber-400 rounded-l" />
          </div>
          {/* Free Space — 남은 높이 전부 차지 */}
          <div className="flex-1" />
        </div>

        {/* 블록 본체 */}
        <div className="flex w-52 flex-col overflow-hidden rounded-xl border-2 border-slate-300 shadow-md">
          {/* 상단 3개 행 — 클릭 가능 */}
          {blockRows.map(({ id, labelKo, labelEn }) => {
            const zone = BLOCK_ZONES.find((z) => z.id === id)!
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                style={{ height: ROW_H }}
                className={cn(
                  'flex w-full shrink-0 cursor-pointer items-center gap-3 border-b border-slate-200 px-3 text-left transition-all hover:brightness-95',
                  zone.zoneBg,
                  isActive && zone.activeRing,
                )}
              >
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white', zone.badgeColor)}>
                  {id === 'header' ? 'HDR' : id === 'itl' ? 'ITL' : 'DIR'}
                </span>
                <span className={cn('font-mono text-[11px] leading-tight', isActive ? 'font-bold text-slate-800' : 'text-slate-500')}>
                  {isKo ? labelKo : labelEn}
                </span>
              </button>
            )
          })}

          {/* 사용 가능한 공간 — 남은 높이 전부 차지 */}
          <button
            onClick={() => setActive('free')}
            className={cn(
              'flex min-h-[112px] w-full flex-1 cursor-pointer flex-col items-center justify-center gap-2 transition-all hover:brightness-95',
              BLOCK_ZONES.find((z) => z.id === 'free')!.zoneBg,
              active === 'free' && BLOCK_ZONES.find((z) => z.id === 'free')!.activeRing,
            )}
          >
            <span className="text-xl text-slate-400">↓</span>
            <span className="font-mono text-[12px] font-bold text-slate-500">
              {isKo ? '사용 가능한 공간' : 'Free Space'}
            </span>
            <span className="text-xl text-slate-400">↑</span>
          </button>
        </div>

        {/* 우측 브라켓 — 블록 오른편, 왼쪽으로 열리는 } 형태: [블록][브라켓][텍스트] */}
        <div className="flex flex-col">
          {/* 헤더 3행은 브라켓 없음 */}
          <div style={{ height: ROW_H * 3 }} />
          {/* 데이터 계층 — 남은 높이 전부 */}
          <div className="flex flex-1 items-center gap-1">
            <div className="relative self-stretch w-3 shrink-0">
              <div
                className="absolute inset-y-2 right-0 w-2 border-r-2 border-t-2 border-b-2 border-blue-400 rounded-r"
              />
            </div>
            <span className="font-mono text-[9px] font-bold text-blue-500 leading-tight whitespace-nowrap">
              {isKo ? '데이터 계층' : 'Data Layer'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Detail card (right) ── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className={cn('flex items-center gap-2.5 border-b border-slate-100 px-5 py-3', activeZone.zoneBg)}>
          <span className={cn('rounded px-2.5 py-0.5 font-mono text-xs font-bold text-white', activeZone.badgeColor)}>
            {active.toUpperCase()}
          </span>
          <span className="text-sm font-bold text-foreground/90">
            {isKo ? activeZone.titleKo : activeZone.titleEn}
          </span>
        </div>
        <p className="border-b border-slate-100 px-5 py-3.5 text-xs leading-relaxed text-muted-foreground">
          {isKo ? activeZone.descKo : activeZone.descEn}
        </p>
        <div className="flex flex-col divide-y divide-slate-100">
          {activeZone.rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[160px_1fr] text-xs">
              <div className="flex items-center border-r border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-mono font-bold text-slate-600">{isKo ? row.termKo : row.termEn}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="leading-snug text-muted-foreground">{isKo ? row.descKo : row.descEn}</span>
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
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
    },
    {
      labelKo: 'Row Data (사용 중)',
      labelEn: 'Row Data (used)',
      pct: 60,
      bg: 'bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-700',
    },
    {
      labelKo: '사용 가능한 공간',
      labelEn: 'Free Space',
      pct: 30,
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-400',
    },
  ]

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-sm font-bold text-foreground/90">
          {isKo ? '데이터 블록에 데이터를 어떻게 저장하는 지 더 자세히 알아보기' : 'How Oracle Stores Data Inside a Block'}
        </span>
      </div>

      <div className="flex items-start gap-0">
        {/* ── 블록 본체 (고정 너비) ── */}
        <div
          className="relative shrink-0 flex w-48 flex-col overflow-hidden rounded-xl border-2 border-slate-300 shadow-md"
          style={{ height: BLOCK_H }}
        >
          {sections.map((s) => (
            <div
              key={s.labelKo}
              className={cn('flex items-center justify-center border-b last:border-0', s.bg, s.border)}
              style={{ height: `${s.pct}%` }}
            >
              <span className={cn('font-mono text-[11px] font-bold leading-tight text-center px-2', s.text)}>
                {isKo ? s.labelKo : s.labelEn}
              </span>
            </div>
          ))}
          {/* PCTFREE 라인 — 10% 지점 (PCTFREE 구간 하단) */}
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-green-500" style={{ top: '10%' }} />
          {/* PCTUSED 라인 — 50% 지점 (블록 전체의 40%가 Row Data로 채워진 지점) */}
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-blue-400" style={{ top: '50%' }} />
        </div>

        {/* ── 라인 레이블 (고정 너비 컬럼) ── */}
        <div className="relative shrink-0 w-44" style={{ height: BLOCK_H }}>
          {/* PCTFREE 레이블 — 10% */}
          <div
            className="absolute left-0 flex items-center gap-1.5"
            style={{ top: '10%', transform: 'translateY(-50%)' }}
          >
            <div className="h-px w-3 bg-green-500" />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-green-600 whitespace-nowrap leading-tight">PCTFREE = 10%</span>
              <span className="font-mono text-[9px] text-green-400 whitespace-nowrap leading-tight">
                {isKo ? '블록 전체 크기의 10%' : '10% of total block size'}
              </span>
            </div>
          </div>
          {/* PCTUSED 레이블 — 50% */}
          <div
            className="absolute left-0 flex items-center gap-1.5"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <div className="h-px w-3 bg-blue-400" />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-blue-600 whitespace-nowrap leading-tight">PCTUSED = 40%</span>
              <span className="font-mono text-[9px] text-blue-400 whitespace-nowrap leading-tight">
                {isKo ? '블록 전체 크기의 40%' : '40% of total block size'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 설명 카드 ── */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          {/* PCTFREE */}
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <IconArrowDown size={14} className="text-green-600" stroke={2} />
              <span className="font-mono text-xs font-bold text-green-700">PCTFREE</span>
              <span className="text-xs text-green-600">{isKo ? '= INSERT 상한선' : '= INSERT ceiling'}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isKo
                ? '블록 전체 크기의 10%를 상단에 예약해 둡니다. 여유 공간이 이 비율 아래로 줄면 새 INSERT를 거부하고, 기존 행이 UPDATE로 길어질 때 쓸 공간으로 남겨 둡니다.'
                : 'Reserves 10% of the total block size at the top. Once free space drops below this, new INSERTs are blocked — the space is kept for in-place UPDATE growth on existing rows.'}
            </p>
          </div>

          {/* PCTUSED */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <IconArrowUp size={14} className="text-blue-600" stroke={2} />
              <span className="font-mono text-xs font-bold text-blue-700">PCTUSED</span>
              <span className="text-xs text-blue-600">{isKo ? '= Freelist 재진입 하한선' : '= Freelist re-entry floor'}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isKo
                ? '블록 전체 크기의 40%입니다. DELETE·UPDATE로 실제 Row Data 사용량이 이 비율 아래로 줄면, Oracle이 블록을 Freelist에 재등록해 새 INSERT를 받을 수 있게 합니다.'
                : '40% of the total block size. When DELETE/UPDATE shrinks Row Data usage below this threshold, Oracle re-adds the block to the Freelist so it can accept new INSERTs again.'}
            </p>
          </div>

          {/* 관계 요약 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isKo
                ? 'INSERT → PCTFREE 도달 → INSERT 금지 → DELETE로 Row Data가 PCTUSED 이하 → Freelist 재등록 → INSERT 재개. PCTFREE + PCTUSED의 합이 100을 넘으면 안 됩니다.'
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
    <div className="my-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm">
      {/* Extent 레이블 */}
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-emerald-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">EXTENT</span>
        <span className="font-mono text-[11px] text-emerald-700">
          {isKo ? '8개의 Block이 모여 Extent 1개 = 64 KB' : '8 Blocks form 1 Extent = 64 KB'}
        </span>
      </div>

      {/* 블록들 */}
      <div className="flex items-stretch gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-center rounded-lg border border-orange-300 bg-orange-100 py-3 gap-0.5"
          >
            <span className="font-mono text-[9px] font-bold text-orange-700">Block</span>
            <span className="font-mono text-[8px] text-orange-500">8 KB</span>
          </div>
        ))}
      </div>

      {/* 하단 수식 */}
      <div className="mt-3 flex items-center gap-1.5">
        <div className="h-px flex-1 bg-emerald-300" />
        <span className="font-mono text-[9px] text-emerald-600 whitespace-nowrap">
          {isKo ? '8 Blocks × 8 KB = 64 KB · 물리적으로 연속된 주소 공간' : '8 Blocks × 8 KB = 64 KB · physically contiguous'}
        </span>
        <div className="h-px flex-1 bg-emerald-300" />
      </div>

    </div>
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
    <div className="my-4 rounded-xl border-2 border-violet-300 bg-violet-50 p-4 shadow-sm">
      {/* Segment 레이블 */}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded bg-violet-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">SEGMENT</span>
        <span className="font-mono text-[11px] text-violet-700">
          {isKo ? 'EMPLOYEES 테이블 — 오브젝트 1개 = Segment 1개' : 'EMPLOYEES table — one object = one Segment'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((stage, si) => (
          <div key={si} className="flex items-center gap-3">
            {/* 단계 레이블 */}
            <div className="w-36 shrink-0">
              <div className="font-mono text-[10px] font-bold text-violet-700 leading-tight">{stage.label}</div>
              <div className="font-mono text-[9px] text-violet-400 leading-tight mt-0.5">{stage.note}</div>
            </div>
            {/* Extent 박스들 */}
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: stage.extents }).map((_, ei) => (
                <div
                  key={ei}
                  className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-emerald-300 bg-emerald-50 py-3 gap-0.5"
                >
                  <span className="font-mono text-[10px] font-bold text-emerald-700">Extent {ei + 1}</span>
                  <span className="font-mono text-[9px] text-emerald-500">64 KB · 8 blocks</span>
                </div>
              ))}
              {/* 마지막 단계에 +추가 암시 */}
              {si === stages.length - 1 && (
                <div className="flex w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-violet-300 bg-violet-50">
                  <span className="font-mono text-[11px] font-bold text-violet-300">+</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <div className="h-px flex-1 bg-violet-200" />
        <span className="font-mono text-[9px] text-violet-500 whitespace-nowrap">
          {isKo ? 'Segment = 이 Extent들의 합집합' : 'Segment = the union of all its Extents'}
        </span>
        <div className="h-px flex-1 bg-violet-200" />
      </div>
    </div>
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
    data:    { bg: 'bg-orange-100 border-orange-300', label: isKo ? '데이터' : 'data', text: 'text-orange-600' },
    empty:   { bg: 'bg-slate-100 border-slate-300',  label: isKo ? '빈 블록' : 'empty', text: 'text-slate-400' },
    partial: { bg: 'bg-amber-50 border-amber-200',   label: isKo ? '미포맷' : 'partial', text: 'text-amber-400' },
    unused:  { bg: 'bg-white border-dashed border-slate-200', label: isKo ? '미사용' : 'unused', text: 'text-slate-300' },
  }

  return (
    <div className="my-4 rounded-xl border-2 border-violet-200 bg-violet-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-violet-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">HWM</span>
        <span className="font-mono text-[11px] text-violet-700">
          {isKo ? 'High Water Mark — Segment 성장 경계' : 'High Water Mark — Segment growth boundary'}
        </span>
      </div>

      {/* 블록 행 */}
      <div className="relative flex items-stretch gap-1">
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => {
          const s = blockState(i)
          const style = stateStyle[s]
          return (
            <div
              key={i}
              className={cn('relative flex flex-1 flex-col items-center justify-center rounded-lg border py-3 gap-0.5', style.bg)}
            >
              <span className={cn('font-mono text-[8px] font-bold', style.text)}>{i + 1}</span>
              <span className={cn('font-mono text-[7px]', style.text)}>{style.label}</span>
            </div>
          )
        })}

        {/* Low HWM 표시 선 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-400"
          style={{ left: `${(LOW_HWM / BLOCK_COUNT) * 100}%` }}
        />
        {/* HWM 표시 선 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
          style={{ left: `${(HWM / BLOCK_COUNT) * 100}%` }}
        />
      </div>

      {/* 레이블 */}
      <div className="relative mt-1" style={{ height: 32 }}>
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${(LOW_HWM / BLOCK_COUNT) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span className="font-mono text-[9px] font-bold text-blue-500 whitespace-nowrap">Low HWM</span>
          <span className="font-mono text-[8px] text-blue-400 whitespace-nowrap">
            {isKo ? '포맷 완료 경계' : 'formatted boundary'}
          </span>
        </div>
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${(HWM / BLOCK_COUNT) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span className="font-mono text-[9px] font-bold text-rose-500 whitespace-nowrap">HWM</span>
          <span className="font-mono text-[8px] text-rose-400 whitespace-nowrap">
            {isKo ? '할당 경계' : 'allocation boundary'}
          </span>
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-3">
        {(Object.keys(stateStyle) as (keyof typeof stateStyle)[]).map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-6 rounded border', stateStyle[k].bg)} />
            <span className="font-mono text-[9px] text-slate-500">{stateStyle[k].label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-[10px] text-slate-500 leading-relaxed">
        {isKo
          ? 'Full Table Scan은 Low HWM까지 연속으로, Low HWM~HWM 사이는 포맷된 블록만 선별해 읽습니다. DELETE로 모든 행을 지워도 HWM은 내려가지 않으므로 스캔 범위는 그대로입니다.'
          : 'A Full Table Scan reads all blocks up to Low HWM contiguously, then picks only formatted blocks between Low HWM and HWM. Deleting all rows does NOT lower the HWM — scan range stays the same.'}
      </p>
    </div>
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
      color: 'border-violet-300 bg-violet-50',
      badge: 'bg-violet-500',
      label: isKo ? '테이블 Segment' : 'Table Segment',
      extents: 2,
    },
    {
      name: 'EMP_IDX',
      color: 'border-indigo-300 bg-indigo-50',
      badge: 'bg-indigo-500',
      label: isKo ? '인덱스 Segment' : 'Index Segment',
      extents: 1,
    },
    {
      name: 'DEPARTMENTS',
      color: 'border-teal-300 bg-teal-50',
      badge: 'bg-teal-500',
      label: isKo ? '테이블 Segment' : 'Table Segment',
      extents: 1,
    },
  ]

  return (
    <div className="my-4 flex flex-col gap-3">
      {/* Tablespace 바깥 박스 */}
      <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded bg-blue-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">TABLESPACE</span>
          <span className="font-mono text-[11px] font-bold text-blue-700">USERS</span>
          <span className="font-mono text-[10px] text-blue-500">
            {isKo ? '— 여러 Segment를 담는 논리 공간' : '— logical space containing Segments'}
          </span>
        </div>

        {/* Segment들 */}
        <div className="flex flex-col gap-2 ml-2">
          {segments.map((seg) => (
            <div key={seg.name} className={`rounded-lg border-2 ${seg.color} p-2.5`}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white ${seg.badge}`}>
                  SEGMENT
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-700">{seg.name}</span>
                <span className="font-mono text-[9px] text-slate-400">{seg.label}</span>
              </div>
              {/* Extent들 */}
              <div className="flex gap-1.5 ml-1">
                {Array.from({ length: seg.extents }).map((_, ei) => (
                  <div key={ei} className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-emerald-300 bg-emerald-50 py-2.5 gap-0.5">
                    <span className="font-mono text-[10px] font-bold text-emerald-700">Extent {ei + 1}</span>
                    <span className="font-mono text-[9px] text-emerald-500">64 KB</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 물리 파일 표시 */}
        <div className="mt-4 ml-2 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-blue-300" />
          <span className="font-mono text-[9px] text-blue-500 whitespace-nowrap">
            {isKo ? '실제 디스크 파일' : 'Physical disk files'}
          </span>
          <div className="h-px flex-1 border-t border-dashed border-blue-300" />
        </div>
        <div className="mt-2 ml-2 flex gap-2">
          {['users01.dbf', 'users02.dbf'].map((f) => (
            <div key={f} className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 shadow-sm">
              <span className="font-mono text-[10px]">📄</span>
              <span className="font-mono text-[9px] text-slate-500">{f}</span>
            </div>
          ))}
          <span className="font-mono text-[9px] text-slate-400 self-center">
            {isKo ? '← Tablespace에 묶여 하나의 논리 공간으로 관리' : '← managed as one logical space'}
          </span>
        </div>
      </div>
    </div>
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
          ? 'Block은 Oracle이 디스크에서 데이터를 읽고 쓰는 최소 단위입니다. 행(Row) 하나가 아닌 Block 전체를 한 번에 읽어 메모리(Buffer Cache)에 올립니다.\n\nI/O(Input/Output)란 데이터를 읽거나 쓰는 작업입니다. 디스크에서 데이터를 읽는 것은 메모리에서 읽는 것보다 수백~수만 배 느리기 때문에, Oracle은 Block 단위로 한꺼번에 읽어 재사용함으로써 불필요한 I/O를 줄입니다. Block 크기를 크게 하면 한 번에 더 많은 행을 읽을 수 있지만, 필요한 행이 적을 때는 쓸모없는 데이터를 함께 읽는 낭비가 생깁니다. 기본값 8 KB는 이 두 가지를 절충한 크기입니다.\n\nBlock 크기는 DB_BLOCK_SIZE 초기화 파라미터로 설정하며, 데이터베이스를 재생성하지 않는 한 변경할 수 없습니다. 반드시 OS 블록 크기의 배수여야 합니다. Block 하나의 오버헤드는 Header + ITL(Interested Transaction List) + Directory를 합쳐 평균 84~107 bytes입니다.'
          : 'A Block is the smallest unit Oracle uses to read and write data on disk. Instead of fetching a single row, Oracle always reads an entire Block into memory (the Buffer Cache) at once.\n\nI/O (Input/Output) is any operation that reads or writes data. Disk I/O is hundreds to thousands of times slower than CPU work, so Oracle minimizes unnecessary I/O by loading data in Block-sized chunks and reusing what is already in memory. A larger Block size means more rows per read, but wastes I/O when only a few rows are needed. The default 8 KB is a practical balance between these two.\n\nBlock size is set by the DB_BLOCK_SIZE initialization parameter and cannot be changed without recreating the database. It must be a multiple of the OS block size. Total block overhead (Header + ITL — Interested Transaction List + Directory) averages 84–107 bytes per block.'
        }</Prose>
        <BlockDiagram />

        <div className="mt-8">
          <PctDiagram />
        </div>

        <div className="mt-6">
          <InfoBox variant="note">
            {lang === 'ko'
              ? '슬롯(Slot)이란 블록 안에 미리 잘라 놓은 고정 크기의 자리입니다. ITL(Interested Transaction List) 슬롯은 트랜잭션 1개가 들어갈 칸(~23 bytes), Row Directory 슬롯은 행 1개의 위치 포인터가 들어갈 칸입니다. 배열의 인덱스처럼 번호로 관리되어, Oracle은 슬롯 번호만 알면 해당 데이터를 바로 찾아갑니다. Row Directory 슬롯은 행이 DELETE된 뒤에도 새 INSERT가 그 자리를 재사용할 때까지 해제되지 않습니다.'
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
                ? 'Oracle 10g 이후 LMT(Locally Managed Tablespace)가 기본값입니다. INITIAL·NEXT·PCTINCREASE는 기존 코드 호환성을 위해 문법상 허용되지만 실제로는 Oracle이 무시하고 AUTOALLOCATE 규칙을 따릅니다. 신규 테이블스페이스는 별도 이유가 없다면 AUTOALLOCATE를 그대로 쓰는 게 권장됩니다.'
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
                ? 'LOB 컬럼이 있는 테이블을 만들면 오브젝트 하나에 Segment가 4개까지 생깁니다: 테이블 데이터 Segment, PRIMARY KEY 인덱스 Segment, CLOB 데이터 Segment, CLOB 인덱스 Segment. "테이블 = Segment 1개"는 단순 테이블에만 해당합니다.'
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
    </PageContainer>
  )
}
