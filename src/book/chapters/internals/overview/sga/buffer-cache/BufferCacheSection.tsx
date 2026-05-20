import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SubTitle } from '../../../../shared'
import { cn } from '@/lib/utils'
import {
  IconDatabase,
  IconLayersLinked,
  IconBolt,
  IconRefresh,
} from '@tabler/icons-react'

type IoMode = 'random' | 'append'

// ── Translation strings ────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'Buffer Cache',
    subtitle: 'SGA에서 가장 큰 비중을 차지하는 메모리 영역. 디스크의 데이터 블록을 메모리로 끌어올려 I/O를 줄입니다.',

    whatTitle: 'Buffer Cache란?',
    whatP1: 'Oracle이 디스크에서 데이터 블록을 읽을 때마다 그 블록을 메모리에 보관해 두는 공간이 Buffer Cache입니다. 동일한 블록을 다시 요청하면 디스크를 거치지 않고 메모리에서 즉시 꺼내줍니다.',
    whatP2: '현대 스토리지에서도 메모리와 디스크의 속도 차이는 수천~수만 배에 달합니다. Buffer Cache의 Hit Ratio(캐시 적중률)가 높을수록 Oracle은 빠르게 동작합니다. DBA가 가장 먼저 살피는 성능 지표 중 하나입니다.',
    whatP3: 'Buffer Cache 안의 각 단위 블록을 "버퍼(buffer)"라고 부릅니다. 하나의 버퍼는 디스크의 한 데이터 블록(기본 8KB)과 1:1로 대응됩니다. 버퍼에는 블록 내용 외에도 상태 정보·주소·LRU 리스트 포인터 같은 메타데이터가 함께 담긴 헤더가 붙어 있습니다.',

    whyTitle: '왜 Buffer Cache가 필요할까? — 디스크와 메모리의 속도 차이',
    whyDiskTitle: '디스크는 물리적인 장치입니다.',
    whyDiskDesc: '회전하는 동그란 원판 위로 긴 팔(arm)이 이동해 데이터의 위치를 찾아야 합니다. 전기 신호만으로 동작하는 메모리에 비하면 수백 ~ 수천배는 느립니다.',
    whyMemTitle: '메모리(RAM)는 전기 신호만으로 동작합니다.',
    whyMemDesc: '움직이는 부품이 없고 어느 주소나 즉시 접근할 수 있어 디스크보다 훨씬 빠릅니다. 그래서 Oracle은 디스크에서 블록을 읽으면 Buffer Cache에 올려 두고, 같은 블록이 다시 필요할 때는 디스크 대신 메모리에서 꺼내 씁니다. 이런 이유로 대부분의 DBMS는 Buffer Cache 시스템으로 동작합니다.',

    walTitle: 'Write-Ahead Logging — 로그 먼저, 데이터 나중',
    walDesc: 'Buffer Cache가 데이터를 수정할 때 Oracle은 반드시 정해진 순서를 지킵니다.',
    walStep1: 'Redo Log Buffer에 먼저 기록',
    walStep1Desc: '"이 블록의 이 값을 저 값으로 바꾼다"는 변경 내역을 메모리의 로그 버퍼에 씁니다.',
    walStep2: '그 다음 Buffer Cache의 블록을 수정',
    walStep2Desc: '실제 데이터 블록을 변경합니다.',
    walConclusion: 'Redo Log File이 먼저, Data File은 그 다음입니다. 이 원칙을 Write-Ahead Logging(WAL)이라 합니다. 서버가 갑자기 꺼져도 Redo Log만 온전하면 데이터 파일을 복구할 수 있기 때문입니다.',
    walMemOrder: '메모리 쓰기 순서',
    walDiskOrder: '디스크 쓰기 순서 (COMMIT 시)',
    walLgwr: 'LGWR · COMMIT 즉시',
    walDbwn: 'DBWn · 나중에 일괄',

    ioTitle: '왜 Redo Log 쓰기가 Data File 쓰기보다 빠를까?',
    ioSubTitle: '두 가지 I/O 방식의 차이에 있습니다.',
    ioRandomLabel: 'Random I/O',
    ioAppendLabel: 'Append (Sequential) I/O',
    ioRandomBadge: 'Data File 쓰기',
    ioAppendBadge: 'Redo Log 쓰기',
    ioRandomTitle: 'Random I/O — 원하는 위치를 직접 찾아가는 방식',
    ioAppendTitle: 'Append I/O — 끝에 순서대로 이어 붙이는 방식',
    ioRandomDesc: '데이터 파일에 블록을 쓸 때 Oracle은 해당 블록이 디스크의 어느 위치에 있는지 계산한 뒤, 그 위치로 바로 이동해서 씁니다. HDD라면 ARM이 물리적으로 그 위치로 이동해야 하고, SSD라면 해당 셀 주소를 찾아야 합니다.\n\n문제는 UPDATE할 행이 테이블 전체에 흩어져 있을 때입니다. 블록 A → 블록 Z → 블록 C → 블록 M... 순서 없이 여기저기 이동하다 보면 이동 횟수가 늘고 느려집니다. 이것이 Random I/O입니다.\n\nRandom I/O는 앞으로 인덱스, 조인, 파티셔닝을 배울 때 계속 등장합니다. 여기서는 "디스크의 임의 위치에 쓰는 건 비싸다"는 개념만 기억해두세요.',
    ioAppendDesc: 'Redo Log File은 다릅니다. 어디서부터 어디까지 바꿨는지 추적할 필요가 없고, 그냥 파일 끝에 "다음으로 일어난 일"을 차례대로 이어 씁니다. ARM이 이동할 일이 없습니다. 디스크가 돌아가면서 자연스럽게 다음 위치가 헤드 아래로 옵니다.\n\n이 방식을 Sequential I/O 또는 Append Write라고 합니다. Random I/O에 비해 훨씬 빠르기 때문에, Oracle은 COMMIT 시 Redo Log를 디스크에 먼저 쓰더라도 빠르게 처리할 수 있습니다.\n\n정리하면: "느린 디스크에 써야 한다면, Append 방식으로 써라"가 Oracle의 전략입니다.',
    ioRandomVisualLabel: '순서 없이 블록 A → F → C 이동',
    ioAppendVisualLabel: '1 → 2 → 3 → 4 → 5 → 다음 칸에 이어 쓰기',
    ioFootnote: 'Random I/O는 인덱스·조인·파티셔닝 챕터에서 계속 등장합니다. 지금은 "임의 위치 쓰기는 비싸다"는 개념만 기억하세요.',

    searchTitle: '버퍼를 찾는 순서',
    searchDesc: 'Server Process가 특정 블록을 필요로 할 때 Oracle은 아래 순서로 탐색합니다. 캐시에서 찾으면 디스크까지 가지 않습니다.',
    searchStep1: 'In-Memory Buffer Cache 탐색',
    searchStep1Desc: 'Hash 버킷을 이용해 SGA Buffer Cache에서 해당 블록을 검색합니다. Cache Hit이면 바로 반환.',
    searchStep2: 'Flash Cache 탐색 (해당 시)',
    searchStep2Desc: 'Smart Flash Cache가 구성된 경우, 디스크 탐색 전에 Flash Cache LRU 목록을 탐색합니다.',
    searchStep3: 'Magnetic Disk에서 읽기',
    searchStep3Desc: '1·2 단계에서 찾지 못하면(Cache Miss) 데이터 파일에서 직접 블록을 읽어 Buffer Cache에 올립니다.',
    cacheHit: '캐시 적중 (Cache Hit)',
    cacheMiss: '캐시 미스 (Cache Miss)',

    statesTitle: '버퍼 상태',
    statesDesc: '각 버퍼는 세 가지 상태 중 하나를 가집니다.',
    stateUnused: 'Unused (미사용)',
    stateUnusedDesc: '아직 한 번도 사용되지 않은 버퍼. 인스턴스 시작 직후 Buffer Cache는 Unused 버퍼로 가득 차 있습니다.',
    stateClean: 'Clean (정합)',
    stateCleanDesc: '디스크 내용과 동일한 버퍼. 수정되지 않았거나, 수정 후 DBWn이 디스크에 기록을 완료한 상태입니다. 재사용 대상입니다.',
    stateDirty: 'Dirty (변경됨)',
    stateDirtyDesc: '메모리에서 수정됐지만 아직 디스크에 반영되지 않은 버퍼. DBWn이 Checkpoint 신호를 받거나 Dirty 리스트가 길어지면 디스크에 씁니다.',

    modesTitle: '버퍼 액세스 모드',
    modesDesc: 'Oracle은 두 가지 방식으로 버퍼에 접근합니다.',
    modeCurrent: 'Current Mode (db block get)',
    modeCurrentDesc: 'Buffer Cache에 올라온 블록의 가장 최신 상태를 그대로 읽습니다. 커밋 여부와 관계없이 현재 메모리에 있는 값 그대로입니다. DML이 블록을 수정할 때 사용합니다.',
    modeCurrentExample: 'A가 같은 블록의 Row 2개를 수정하고 아직 COMMIT하지 않은 상태입니다. B가 같은 블록에 UPDATE를 실행하면 Current Mode로 블록을 가져옵니다. A의 미커밋 변경이 포함된 최신 버퍼 블록을 직접 수정합니다.',
    modeCurrentScenario: [
      'A: Row 1 → "Alice" (미커밋)',
      'A: Row 2 → "Bob"   (미커밋)',
      'B: UPDATE → Current Mode로 블록 획득 → Row 3 수정',
    ],
    modeConsistent: 'Consistent Mode (consistent get)',
    modeConsistentDesc: '쿼리가 시작된 시점의 SCN을 기준으로 일관된 스냅샷을 읽습니다. 다른 트랜잭션이 블록을 수정 중이면 Oracle이 Undo로 이전 버전을 재구성합니다. SELECT에서 사용합니다.',
    modeConsistentExample: '같은 상황에서 C가 SELECT를 실행합니다. 쿼리 시작 시점의 SCN이 A의 수정 이전이므로, Oracle은 A의 Undo 데이터를 이용해 수정 전 값으로 블록을 재구성해 돌려줍니다.',
    modeConsistentScenario: [
      'A: Row 1, 2 수정 중 (미커밋, SCN 1005)',
      'C: SELECT 시작 (SCN 1000 기준)',
      'Oracle: Undo 적용 → Row 1, 2를 수정 전 값으로 재구성',
      'C: 깨끗한 스냅샷 수신 (A의 변경 안 보임)',
    ],

    lruTitle: 'LRU 알고리즘과 Touch Count',
    lruP1: 'Buffer Cache는 LRU(Least Recently Used) 알고리즘으로 관리됩니다. 새 블록을 올릴 공간이 없으면 "가장 오래 사용되지 않은" 버퍼를 밀어냅니다.',
    lruP2: 'LRU 리스트는 Hot End(최근 접근)와 Cold End(오래된 접근) 두 쪽으로 나뉩니다. 새로 올라온 블록은 Cold End쪽 중간(midpoint)에 위치합니다.',
    lruP3: '블록이 접근될 때마다 Touch Count가 증가하며, 3초 이내 재접근은 카운트하지 않습니다. Touch Count가 임계값(기본 2)을 넘으면 블록이 Hot End로 이동합니다. 전체 테이블 스캔 시에는 Cold End 중간에 삽입해 중요 블록이 밀려나지 않도록 합니다.',
    touchTitle: 'Touch Count 규칙',
    touchRule1: '동일 블록 접근 시 Touch Count +1',
    touchRule2: '단, 3초 이내 재접근은 카운트 안 함 (Pin 상태)',
    touchRule3: 'Touch Count ≥ 임계값 → Hot End로 이동',
    touchRule4: 'Full Table Scan → Cold End 중간 삽입 (중요 블록 보호)',

    poolsTitle: 'Buffer Pool 구성',
    poolsDesc: 'Database Buffer Cache는 하나 이상의 Buffer Pool로 구성됩니다. 각 Pool은 독립된 LRU 리스트를 가집니다.',
    poolDefault: 'Default Pool',
    poolDefaultDesc: '모든 버퍼가 기본으로 올라오는 Pool. DB_CACHE_SIZE 파라미터로 크기를 설정합니다.',
    poolKeep: 'Keep Pool',
    poolKeepDesc: '자주 접근하는 작은 테이블·인덱스를 상주시키는 Pool. LRU에 의해 밀려나지 않게 보호합니다. DB_KEEP_CACHE_SIZE로 설정.',
    poolRecycle: 'Recycle Pool',
    poolRecycleDesc: '크고 거의 재사용되지 않는 세그먼트를 위한 Pool. 빠르게 재활용해 Default Pool을 보호합니다. DB_RECYCLE_CACHE_SIZE로 설정.',
    poolNonStd: '비표준 블록 크기 Pool',
    poolNonStdDesc: 'Oracle의 기본 블록 크기는 8KB입니다. 그런데 특정 테이블스페이스를 2K·4K·16K·32K 블록으로 만들면, 그 블록은 기본 Default Pool에 올라오지 않습니다. 블록 크기가 다른 버퍼들이 같은 Pool을 공유하면 관리가 복잡해지기 때문입니다. 대신 Oracle은 해당 크기에 맞는 별도의 Pool을 SGA 안에 따로 만들어 거기에 보관합니다. 예를 들어 16K 블록 테이블스페이스가 있다면 DB_16K_CACHE_SIZE 파라미터로 16K 전용 Pool 크기를 설정해야 해당 블록이 메모리에 올라올 수 있습니다.',

    fullScanTitle: 'Full Table Scan과 Direct Path Read',
    fullScanP1: '작은 테이블의 Full Scan: Cold End 중간에 삽입. 빠르게 재접근할 가능성이 있어 Cache에 올려둡니다.',
    fullScanP2: '큰 테이블의 Full Scan: Oracle이 임계값(DB_FILE_MULTIBLOCK_READ_COUNT × Block size)을 초과하는 세그먼트에 대해 Direct Path Read를 수행합니다. Buffer Cache를 완전히 건너뛰고 PGA로 직접 읽어 캐시를 오염시키지 않습니다.',
    fullScanNote: 'Direct Path Read는 11g부터 직렬 Full Scan에도 자동 적용됩니다. V$SQL_PLAN의 access 항목에서 direct path read 이벤트를 확인할 수 있습니다.',

    paramsTitle: '주요 파라미터',
    param1: 'DB_CACHE_SIZE',
    param1Desc: 'Default Pool 크기. ASMM(SGA_TARGET 설정) 시 자동 조정됩니다.',
    param2: 'DB_KEEP_CACHE_SIZE',
    param2Desc: 'Keep Pool 크기. 0이면 Keep Pool 없음.',
    param3: 'DB_RECYCLE_CACHE_SIZE',
    param3Desc: 'Recycle Pool 크기. 0이면 Recycle Pool 없음.',
    param4: 'DB_nK_CACHE_SIZE',
    param4Desc: '비표준 블록 크기(2K/4K/16K/32K) Pool 크기. 해당 블록 크기의 테이블스페이스가 있을 때만 설정합니다.',

    summaryTitle: 'Buffer Cache 핵심 정리',
    summaryItems: [
      'Buffer Cache는 SGA의 가장 큰 구성요소로, 디스크 데이터 블록을 메모리에 캐시합니다.',
      '탐색 순서: In-Memory Buffer Cache → Flash Cache → Magnetic Disk',
      '버퍼 상태: Unused → Clean / Dirty (DBWn이 Dirty를 디스크에 씁니다)',
      'Current Mode = 최신 블록 (DML용), Consistent Mode = SCN 기준 일관 읽기 (SELECT용)',
      'LRU + Touch Count: Hot End ↔ Cold End, 3초 규칙, Full Scan은 Cold End 중간 삽입',
      'Buffer Pool: Default / Keep / Recycle + 비표준 블록 크기 Pool',
    ],
  },
  en: {
    title: 'Buffer Cache',
    subtitle: 'The largest component in the SGA. Pulls data blocks from disk into memory to reduce I/O.',

    whatTitle: 'What is the Buffer Cache?',
    whatP1: "Every time Oracle reads a data block from disk, it stores that block in the Buffer Cache. When the same block is requested again, Oracle serves it straight from memory — no disk access needed.",
    whatP2: 'Even with modern storage, memory is thousands to tens of thousands of times faster than disk. The higher the Buffer Cache Hit Ratio, the faster Oracle runs. It is one of the first performance metrics a DBA examines.',
    whatP3: 'Each unit inside the Buffer Cache is called a "buffer." One buffer maps 1:1 to one data block on disk (8 KB by default). Each buffer has a header containing metadata: state flags, block address, and LRU list pointers.',

    whyTitle: 'Why Buffer Cache Exists — The Speed Gap Between Disk and Memory',
    whyDiskTitle: 'Disk is a physical device.',
    whyDiskDesc: 'A long arm moves across a spinning circular platter to locate the data. Compared to memory, which runs purely on electrical signals, disk is hundreds to thousands of times slower.',
    whyMemTitle: 'Memory (RAM) runs on pure electrical signals.',
    whyMemDesc: 'No moving parts, instant access to any address — far faster than disk. So Oracle loads a block into the Buffer Cache the first time it reads it from disk, and serves every subsequent access from memory instead. This is why virtually every DBMS operates with a Buffer Cache system.',

    walTitle: 'Write-Ahead Logging — Log first, data second',
    walDesc: 'When Oracle modifies data in the Buffer Cache, it always follows a strict order.',
    walStep1: 'Write to the Redo Log Buffer first',
    walStep1Desc: 'Record "change this value in this block to that value" in the in-memory log buffer.',
    walStep2: 'Then modify the block in the Buffer Cache',
    walStep2Desc: 'Apply the actual change to the data block.',
    walConclusion: 'Redo Log File first, Data File second. This principle is called Write-Ahead Logging (WAL). As long as the Redo Log survives, Oracle can always reconstruct the data files — even after a crash.',
    walMemOrder: 'In-memory write order',
    walDiskOrder: 'Disk write order (at COMMIT)',
    walLgwr: 'LGWR · at COMMIT',
    walDbwn: 'DBWn · batched later',

    ioTitle: 'Why is writing to the Redo Log faster than writing to the Data File?',
    ioSubTitle: 'The answer lies in the two different I/O patterns.',
    ioRandomLabel: 'Random I/O',
    ioAppendLabel: 'Append (Sequential) I/O',
    ioRandomBadge: 'Data File write',
    ioAppendBadge: 'Redo Log write',
    ioRandomTitle: 'Random I/O — Seeking the exact location each time',
    ioAppendTitle: 'Append I/O — Writing sequentially to the end',
    ioRandomDesc: "When Oracle writes a block to a data file, it calculates exactly where on disk that block lives, then seeks directly to that location. On an HDD, the ARM physically moves there. On an SSD, it resolves the target cell address.\n\nThe problem appears when rows being updated are scattered across the table. Block A → Block Z → Block C → Block M... hopping around in no particular order means more seeks, more latency. That is Random I/O.\n\nRandom I/O will come up again when we cover indexes, joins, and partitioning. For now, just remember: writing to arbitrary disk locations is expensive.",
    ioAppendDesc: "Redo Log Files work differently. Oracle doesn't need to find where a specific block lives — it just appends \"the next thing that happened\" to the end of the file in sequence. The ARM never needs to seek. As the disk spins, the next position naturally arrives under the head.\n\nThis is called Sequential I/O or Append Write. It is far faster than Random I/O, which is why Oracle can afford to flush the Redo Log to disk synchronously at COMMIT without making commits slow.\n\nThe takeaway: \"if you must write to slow disk, write sequentially\" is Oracle's core strategy.",
    ioRandomVisualLabel: 'Seeks A → F → C out of order',
    ioAppendVisualLabel: 'Written 1 → 2 → 3 → 4 → 5, next appended here',
    ioFootnote: 'Random I/O will reappear throughout the indexes, joins, and partitioning chapters. For now, just remember: writing to arbitrary locations is expensive.',

    searchTitle: 'Buffer Search Order',
    searchDesc: 'When a Server Process needs a specific block, Oracle searches in this order. If found in cache, the disk is never touched.',
    searchStep1: 'Search In-Memory Buffer Cache',
    searchStep1Desc: 'Looks up the block in the SGA Buffer Cache using a hash bucket. Returns immediately on a Cache Hit.',
    searchStep2: 'Search Flash Cache (if configured)',
    searchStep2Desc: 'If Smart Flash Cache is configured, Oracle searches its LRU list before going to disk.',
    searchStep3: 'Read from Magnetic Disk',
    searchStep3Desc: 'If steps 1 and 2 miss (Cache Miss), Oracle reads the block directly from the data file and loads it into the Buffer Cache.',
    cacheHit: 'Cache Hit',
    cacheMiss: 'Cache Miss',

    statesTitle: 'Buffer States',
    statesDesc: 'Each buffer is in exactly one of three states.',
    stateUnused: 'Unused',
    stateUnusedDesc: 'A buffer that has never been used. Right after instance startup, the Buffer Cache is full of Unused buffers.',
    stateClean: 'Clean',
    stateCleanDesc: 'The buffer matches its on-disk version — either it was never modified, or DBWn has already written it to disk. A candidate for reuse.',
    stateDirty: 'Dirty',
    stateDirtyDesc: 'Modified in memory but not yet written to disk. DBWn flushes Dirty buffers when triggered by a Checkpoint signal or when the Dirty list grows too long.',

    modesTitle: 'Buffer Access Modes',
    modesDesc: 'Oracle accesses buffers in two distinct modes.',
    modeCurrent: 'Current Mode (db block get)',
    modeCurrentDesc: 'Reads the block exactly as it exists in the Buffer Cache right now — including any uncommitted changes. Used by DML when it needs to modify the block in place.',
    modeCurrentExample: "A has modified 2 rows in a block and has not yet committed. B issues an UPDATE on the same block. Oracle fetches the block in Current Mode — it gets the latest in-memory version, complete with A's uncommitted changes, and writes its own modification on top.",
    modeCurrentScenario: [
      'A: Row 1 → "Alice" (uncommitted)',
      'A: Row 2 → "Bob"   (uncommitted)',
      'B: UPDATE → acquires block in Current Mode → modifies Row 3',
    ],
    modeConsistent: 'Consistent Mode (consistent get)',
    modeConsistentDesc: 'Reads a snapshot of the block consistent with the SCN at which the query started. If another transaction has modified the block, Oracle reconstructs the older version using Undo data. Used by SELECT.',
    modeConsistentExample: "In the same situation, C runs a SELECT. Its query-start SCN predates A's changes. Oracle applies A's Undo records to reconstruct the block as it looked before the modifications, and returns that clean snapshot to C.",
    modeConsistentScenario: [
      'A: modifying Row 1, 2 (uncommitted, SCN 1005)',
      'C: SELECT starts (reads as of SCN 1000)',
      'Oracle: applies Undo → reconstructs Row 1, 2 to pre-change values',
      "C: receives clean snapshot (A's changes invisible)",
    ],

    lruTitle: 'LRU Algorithm and Touch Count',
    lruP1: 'The Buffer Cache is managed with the LRU (Least Recently Used) algorithm. When there is no room for a new block, the "least recently used" buffer is evicted.',
    lruP2: 'The LRU list is split into a Hot End (recently accessed) and a Cold End (stale). Newly loaded blocks are placed at the midpoint of the Cold End.',
    lruP3: 'Each time a block is accessed, its Touch Count increments — but re-access within 3 seconds while the block is pinned does not count. When Touch Count exceeds the threshold (default: 2), the block moves to the Hot End. Full Table Scans insert blocks at the Cold End midpoint to protect important cached blocks from being evicted.',
    touchTitle: 'Touch Count Rules',
    touchRule1: 'Access to a block → Touch Count +1',
    touchRule2: 'Re-access within 3 seconds (while pinned) → does not increment',
    touchRule3: 'Touch Count ≥ threshold → promote to Hot End',
    touchRule4: 'Full Table Scan → insert at Cold End midpoint (protects hot blocks)',

    poolsTitle: 'Buffer Pool Structure',
    poolsDesc: 'The Database Buffer Cache can consist of one or more Buffer Pools, each with its own independent LRU list.',
    poolDefault: 'Default Pool',
    poolDefaultDesc: 'The pool where all buffers land by default. Sized with DB_CACHE_SIZE. Auto-managed under ASMM.',
    poolKeep: 'Keep Pool',
    poolKeepDesc: 'Keeps frequently accessed small tables and indexes in memory, protecting them from LRU eviction. Sized with DB_KEEP_CACHE_SIZE.',
    poolRecycle: 'Recycle Pool',
    poolRecycleDesc: 'For large segments that are rarely reused. Recycles quickly to protect the Default Pool. Sized with DB_RECYCLE_CACHE_SIZE.',
    poolNonStd: 'Non-Standard Block Size Pools',
    poolNonStdDesc: "Oracle's default block size is 8KB. If you create a tablespace with a different block size — 2K, 4K, 16K, or 32K — those blocks cannot go into the Default Pool. Mixing different block sizes in a single pool would make buffer management far too complicated. Instead, Oracle maintains a separate pool in the SGA for each non-standard block size. For example, if you have a 16K-block tablespace, you must set DB_16K_CACHE_SIZE to give that pool some memory — otherwise Oracle has nowhere to cache those blocks.",

    fullScanTitle: 'Full Table Scan and Direct Path Read',
    fullScanP1: 'Small table full scan: blocks are inserted at the Cold End midpoint — they may be accessed again soon, so they stay in cache.',
    fullScanP2: 'Large table full scan: for segments exceeding a threshold (DB_FILE_MULTIBLOCK_READ_COUNT × block size), Oracle performs a Direct Path Read. It reads directly into the PGA, bypassing the Buffer Cache entirely — no cache pollution.',
    fullScanNote: 'Since 11g, Direct Path Read can be applied automatically to serial full scans. Check V$SQL_PLAN for "direct path read" wait events.',

    paramsTitle: 'Key Parameters',
    param1: 'DB_CACHE_SIZE',
    param1Desc: 'Default Pool size. Auto-managed when ASMM is active (SGA_TARGET set).',
    param2: 'DB_KEEP_CACHE_SIZE',
    param2Desc: 'Keep Pool size. 0 means no Keep Pool.',
    param3: 'DB_RECYCLE_CACHE_SIZE',
    param3Desc: 'Recycle Pool size. 0 means no Recycle Pool.',
    param4: 'DB_nK_CACHE_SIZE',
    param4Desc: 'Pool size for non-standard block sizes (2K/4K/16K/32K). Only set if a tablespace with that block size exists.',

    summaryTitle: 'Buffer Cache Key Takeaways',
    summaryItems: [
      "Buffer Cache is the SGA's largest component, caching disk data blocks in memory.",
      'Search order: In-Memory Buffer Cache → Flash Cache → Magnetic Disk',
      'Buffer states: Unused → Clean / Dirty (DBWn writes Dirty buffers to disk)',
      'Current Mode = latest block (for DML), Consistent Mode = SCN-consistent read (for SELECT)',
      'LRU + Touch Count: Hot End ↔ Cold End, 3-second rule, Full Scan inserts at Cold End midpoint',
      'Buffer Pools: Default / Keep / Recycle + non-standard block size pools',
    ],
  },
}

// ── Why Buffer Cache / WAL / I/O sections ─────────────────────────────────

function WhyBufferCacheContent({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [activeIo, setActiveIo] = useState<IoMode>('random')

  const ioModes: { id: IoMode; label: string }[] = [
    { id: 'random', label: t.ioRandomLabel },
    { id: 'append', label: t.ioAppendLabel },
  ]

  const ioContent = {
    random: {
      badge: t.ioRandomBadge,
      title: t.ioRandomTitle,
      desc: t.ioRandomDesc,
      visual: (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div className="absolute inset-0 flex items-center justify-center gap-0">
            {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map((label, i) => (
              <div
                key={label}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center border-r border-slate-200 font-mono text-xs font-bold',
                  ['A', 'C', 'F'].includes(label)
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-white text-slate-400',
                  i === 7 && 'border-r-0',
                )}
              >
                {label}
              </div>
            ))}
          </div>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 320 112"
          >
            <defs>
              <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
              </marker>
            </defs>
            <path
              d="M20 56 C 20 20, 200 20, 200 56"
              stroke="#f59e0b"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 2"
              markerEnd="url(#arrowAmber)"
            />
            <path
              d="M200 56 C 200 90, 100 90, 100 56"
              stroke="#f59e0b"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 2"
              markerEnd="url(#arrowAmber)"
            />
          </svg>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-400">
            {t.ioRandomVisualLabel}
          </div>
        </div>
      ),
    },
    append: {
      badge: t.ioAppendBadge,
      title: t.ioAppendTitle,
      desc: t.ioAppendDesc,
      visual: (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-orange-200 bg-orange-50">
          <div className="absolute inset-0 flex items-center justify-center gap-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
              <div
                key={n}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center border-r border-orange-200 font-mono text-xs font-bold',
                  n <= 5
                    ? 'bg-orange-100 text-orange-700'
                    : n === 6
                      ? 'bg-orange-300 text-white ring-2 ring-orange-400'
                      : 'bg-white text-slate-300',
                  i === 7 && 'border-r-0',
                )}
              >
                {n <= 5 ? n : n === 6 ? '→' : ''}
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-orange-500">
            {t.ioAppendVisualLabel}
          </div>
        </div>
      ),
    },
  }

  const active = ioContent[activeIo]

  return (
    <div className="space-y-8">
      {/* 1. 디스크 vs 메모리 */}
      <div>
        <SectionTitle>{t.whyTitle}</SectionTitle>
        <div className="space-y-2">
          <Prose>
            <strong className="font-semibold text-foreground">{t.whyDiskTitle}</strong>{' '}
            {t.whyDiskDesc}
          </Prose>
          <Prose>
            <strong className="font-semibold text-foreground">{t.whyMemTitle}</strong>{' '}
            {t.whyMemDesc}
          </Prose>
        </div>
      </div>


      {/* 3. WAL */}
      <div className="rounded-xl border-2 border-orange-200 bg-orange-50/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">WAL</span>
          <span className="text-sm font-bold text-foreground/90">{t.walTitle}</span>
        </div>
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">{t.walDesc}</p>
          <ol className="list-none space-y-1.5">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                1
              </span>
              <span>
                <strong className="font-semibold text-foreground">{t.walStep1}</strong>{' '}
                — {t.walStep1Desc}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                2
              </span>
              <span>
                <strong className="font-semibold text-foreground">{t.walStep2}</strong>{' '}
                — {t.walStep2Desc}
              </span>
            </li>
          </ol>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">{t.walConclusion}</strong>
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {t.walMemOrder}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
              ① Redo Log Buffer
            </div>
            <span className="text-sm text-muted-foreground">→</span>
            <div className="flex-1 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700">
              ② Buffer Cache
            </div>
          </div>
          <p className="mb-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {t.walDiskOrder}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 text-center text-xs font-bold text-orange-700">
              ① Redo Log File
              <div className="mt-0.5 text-[10px] font-normal opacity-70">{t.walLgwr}</div>
            </div>
            <span className="text-sm text-muted-foreground">→</span>
            <div className="flex-1 rounded-lg border-2 border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700">
              ② Data File
              <div className="mt-0.5 text-[10px] font-normal opacity-70">{t.walDbwn}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Random vs Append I/O */}
      <div>
        <div className="mb-1 text-sm font-bold text-foreground/90">{t.ioTitle}</div>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t.ioSubTitle}</p>
        <div className="mb-4 flex gap-2">
          {ioModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveIo(m.id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-xs font-bold transition-all',
                activeIo === m.id
                  ? m.id === 'random'
                    ? 'border-amber-400 bg-amber-500 text-white shadow-sm'
                    : 'border-orange-400 bg-orange-500 text-white shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-slate-400 hover:text-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div
              className={cn(
                'flex items-center gap-2.5 border-b border-border px-5 py-3',
                activeIo === 'random' ? 'bg-amber-50/60' : 'bg-orange-50/60',
              )}
            >
              <span
                className={cn(
                  'rounded px-2.5 py-0.5 text-xs font-bold text-white',
                  activeIo === 'random' ? 'bg-amber-500' : 'bg-orange-500',
                )}
              >
                {active.badge}
              </span>
              <span className="text-sm font-bold text-foreground">{active.title}</span>
            </div>
            <div className="space-y-4 px-5 py-4">
              {active.visual}
              <Prose>{active.desc}</Prose>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          💡 {t.ioFootnote}
        </div>
      </div>
    </div>
  )
}

// ── SGA Highlight Diagram (Buffer Cache 위치 강조) ────────────────────────

function SgaHighlightDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const components = [
    {
      id: 'buffer-cache',
      labelKo: 'Buffer Cache',
      labelEn: 'Buffer Cache',
      size: 'flex-[3]',
      highlight: true,
      color: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300 text-blue-800 shadow-md',
      subKo: '← 지금 여기',
      subEn: '← you are here',
    },
    {
      id: 'shared-pool',
      labelKo: 'Shared Pool',
      labelEn: 'Shared Pool',
      size: 'flex-[2]',
      highlight: false,
      color: 'border-border/30 bg-muted/20 text-muted-foreground/40',
      sub: null,
    },
    {
      id: 'redo-buffer',
      labelKo: 'Redo Log Buffer',
      labelEn: 'Redo Log Buffer',
      size: 'flex-[2]',
      highlight: false,
      color: 'border-border/30 bg-muted/20 text-muted-foreground/40',
      sub: null,
    },
    {
      id: 'undo',
      labelKo: 'Undo Segment',
      labelEn: 'Undo Segment',
      size: 'flex-[2]',
      highlight: false,
      color: 'border-border/30 bg-muted/20 text-muted-foreground/40',
      sub: null,
    },
  ]

  return (
    <div className="mb-6 rounded-2xl border-2 border-blue-300 bg-blue-50/20 p-5">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-500/70">
        SGA — System Global Area
      </div>
      <div className="flex gap-2">
        {components.map((c) => (
          <motion.div
            key={c.id}
            animate={c.highlight ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={c.highlight ? { repeat: Infinity, duration: 1.4, repeatDelay: 0.4 } : {}}
            className={cn(
              c.size,
              'relative rounded-xl border-2 px-3 py-3 transition-all',
              c.color,
            )}
          >
            {c.highlight && (
              <motion.div
                className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <span className="text-[8px] font-bold">★</span>
              </motion.div>
            )}
            <div className="font-mono text-[11px] font-bold leading-tight">
              {lang === 'ko' ? c.labelKo : c.labelEn}
            </div>
            {c.highlight && (
              <div className="mt-1 font-mono text-[9px] font-semibold text-blue-600">
                {lang === 'ko' ? c.subKo : c.subEn}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Figure 16-6: Buffer Search Diagram ────────────────────────────────────

function BufferSearchDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [hitPath, setHitPath] = useState<'hit1' | 'hit2' | 'miss' | null>(null)

  const steps = [
    {
      key: 'memory' as const,
      step: '1',
      label: 'In-Memory Buffer Cache',
      sublabel: lang === 'ko' ? 'SGA 안 LRU 버퍼 풀' : 'LRU buffer pools in SGA',
      hitKey: 'hit1' as const,
      hitLabel: t.cacheHit,
      color: 'border-blue-300 bg-blue-50/70',
      activeRing: 'ring-blue-300',
      hitColor: 'text-blue-600',
      stepColor: 'bg-blue-500',
    },
    {
      key: 'flash' as const,
      step: '2',
      label: 'Flash Cache',
      sublabel: lang === 'ko' ? 'Smart Flash Cache (선택)' : 'Smart Flash Cache (optional)',
      hitKey: 'hit2' as const,
      hitLabel: t.cacheHit,
      color: 'border-violet-300 bg-violet-50/70',
      activeRing: 'ring-violet-300',
      hitColor: 'text-violet-600',
      stepColor: 'bg-violet-500',
    },
    {
      key: 'disk' as const,
      step: '3',
      label: 'Magnetic Disk',
      sublabel: lang === 'ko' ? '데이터 파일 (.dbf)' : 'Data files (.dbf)',
      hitKey: 'miss' as const,
      hitLabel: t.cacheMiss,
      color: 'border-slate-300 bg-slate-50/70',
      activeRing: 'ring-slate-300',
      hitColor: 'text-slate-600',
      stepColor: 'bg-slate-500',
    },
  ]

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/20 p-5">
      <div className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-500/70">
        {lang === 'ko' ? 'Server Process의 블록 탐색 순서' : 'Block Search Order by Server Process'}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl border-2 border-teal-300 bg-teal-50 px-4 py-2.5 font-mono text-xs font-bold text-teal-700">
          Server Process
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="font-mono text-[10px]">{lang === 'ko' ? '블록 요청' : 'block request'}</span>
          <span className="text-base">→</span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((s, idx) => {
          const isActive = hitPath === s.hitKey
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white', s.stepColor)}>
                  {s.step}
                </div>
                {idx < steps.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-slate-300" />
                )}
              </div>
              <motion.div
                animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={isActive ? { repeat: Infinity, duration: 1.2 } : {}}
                className={cn(
                  'flex-1 rounded-xl border-2 px-4 py-2.5 transition-all',
                  s.color,
                  isActive && 'shadow-md ring-2 ring-offset-1',
                  isActive && s.activeRing,
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold">{s.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{s.sublabel}</div>
                  </div>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn('font-mono text-[11px] font-bold', s.hitColor)}
                    >
                      ✓ {s.hitLabel}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="self-center font-mono text-[10px] text-muted-foreground">
          {lang === 'ko' ? '시나리오:' : 'Scenario:'}
        </span>
        {([
          { key: 'hit1' as const, label: 'Memory Hit', color: 'bg-blue-500' },
          { key: 'hit2' as const, label: 'Flash Hit', color: 'bg-violet-500' },
          { key: 'miss' as const, label: 'Disk Miss', color: 'bg-slate-500' },
        ]).map((btn) => (
          <button
            key={btn.key}
            onClick={() => setHitPath((p) => (p === btn.key ? null : btn.key))}
            className={cn(
              'rounded-lg border px-3 py-1 font-mono text-[11px] font-bold transition-all',
              hitPath === btn.key
                ? `${btn.color} border-transparent text-white shadow-sm`
                : 'border-border bg-card text-muted-foreground hover:border-slate-400',
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Figure 16-7: Buffer Pool Diagram ──────────────────────────────────────

function BufferPoolDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [activePool, setActivePool] = useState<string | null>(null)

  const pools = [
    {
      id: 'default',
      label: 'Default Pool',
      param: 'DB_CACHE_SIZE',
      color: 'border-blue-300 bg-blue-50/80 text-blue-700',
      activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
      desc: t.poolDefaultDesc,
      flex: 'flex-[3]',
    },
    {
      id: 'keep',
      label: 'Keep Pool',
      param: 'DB_KEEP_CACHE_SIZE',
      color: 'border-emerald-300 bg-emerald-50/80 text-emerald-700',
      activeColor: 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300',
      desc: t.poolKeepDesc,
      flex: 'flex-[2]',
    },
    {
      id: 'recycle',
      label: 'Recycle Pool',
      param: 'DB_RECYCLE_CACHE_SIZE',
      color: 'border-rose-300 bg-rose-50/80 text-rose-700',
      activeColor: 'border-rose-500 bg-rose-100 ring-2 ring-rose-300',
      desc: t.poolRecycleDesc,
      flex: 'flex-[2]',
    },
  ]

  const nonStdPools = [
    { label: '2K', param: 'DB_2K_CACHE_SIZE', color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: '4K', param: 'DB_4K_CACHE_SIZE', color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: '8K (default)', param: '—', color: 'border-blue-200 bg-blue-50 text-blue-600' },
    { label: '16K', param: 'DB_16K_CACHE_SIZE', color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: '32K', param: 'DB_32K_CACHE_SIZE', color: 'border-amber-200 bg-amber-50 text-amber-700' },
  ]

  const active = pools.find((p) => p.id === activePool)

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50/30 p-5">
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500/70">
        Database Buffer Cache
      </div>

      <div className="mb-3 flex gap-2">
        {pools.map((p) => {
          const isActive = activePool === p.id
          return (
            <motion.button
              key={p.id}
              onClick={() => setActivePool((prev) => (prev === p.id ? null : p.id))}
              animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={isActive ? { repeat: Infinity, duration: 1.4, repeatDelay: 0.4 } : {}}
              className={cn(
                p.flex,
                'cursor-pointer rounded-xl border-2 px-3 py-3 text-left transition-all',
                isActive ? p.activeColor : p.color,
              )}
            >
              <div className="font-mono text-[11px] font-bold leading-tight">{p.label}</div>
              <div className="mt-1 font-mono text-[9px] opacity-70">{p.param}</div>
            </motion.button>
          )
        })}
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-white/60 px-4 py-3">
        <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {t.poolNonStd}
        </div>
        <p className="mb-2.5 text-[11px] leading-relaxed text-muted-foreground">{t.poolNonStdDesc}</p>
        <div className="flex gap-1.5">
          {nonStdPools.map((p) => (
            <div
              key={p.label}
              className={cn('flex-1 rounded-lg border px-2 py-1.5 text-center', p.color)}
            >
              <div className="font-mono text-[10px] font-bold">{p.label}</div>
              <div className="truncate font-mono text-[8px] opacity-60">{p.param}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-border bg-card px-4 py-3 text-xs"
          >
            <span className="font-mono font-bold text-foreground/80">{active.label}</span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">{active.param}</span>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">{active.desc}</p>
          </motion.div>
        ) : (
          <motion.div
            key="pool-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-10 items-center justify-center rounded-xl border-2 border-dashed border-border"
          >
            <span className="font-mono text-[11px] text-muted-foreground">
              {lang === 'ko' ? '↑ Pool을 클릭해 설명을 확인하세요' : '↑ Click a pool to see details'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── LRU List Visual ────────────────────────────────────────────────────────

function LruDiagram({ lang }: { lang: 'ko' | 'en' }) {
  type BufItem =
    | { id: string; label: string; touch: number; hot: boolean; evict?: boolean; mid?: false }
    | { id: string; mid: true }

  const buffers: BufItem[] = [
    { id: 'h1', label: lang === 'ko' ? '블록 A' : 'Block A', touch: 5, hot: true },
    { id: 'h2', label: lang === 'ko' ? '블록 B' : 'Block B', touch: 4, hot: true },
    { id: 'h3', label: lang === 'ko' ? '블록 C' : 'Block C', touch: 3, hot: true },
    { id: 'mid', mid: true },
    { id: 'c1', label: lang === 'ko' ? '블록 D (신규)' : 'Block D (new)', touch: 1, hot: false },
    { id: 'c2', label: lang === 'ko' ? '블록 E' : 'Block E', touch: 1, hot: false },
    { id: 'c3', label: lang === 'ko' ? '블록 F' : 'Block F', touch: 0, hot: false, evict: true },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          LRU List
        </span>
        <div className="flex gap-3 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
            Hot End
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
            Cold End
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {buffers.map((b) => {
          if (b.mid) {
            return (
              <div key={b.id} className="flex flex-col items-center">
                <div className="h-8 w-px border-l-2 border-dashed border-amber-400" />
                <span className="mt-0.5 whitespace-nowrap font-mono text-[8px] text-amber-500">midpoint</span>
              </div>
            )
          }
          return (
            <div
              key={b.id}
              className={cn(
                'flex-1 rounded-lg border-2 px-2 py-1.5 text-center transition-all',
                b.hot
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : b.evict
                  ? 'border-dashed border-rose-300 bg-rose-50/60 text-rose-500'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              )}
            >
              <div className="truncate font-mono text-[9px] font-bold leading-tight">{b.label}</div>
              <div className={cn('mt-0.5 font-mono text-[8px]', b.hot ? 'text-blue-500' : 'text-slate-400')}>
                touch: {b.touch}
              </div>
              {b.evict && (
                <div className="font-mono text-[8px] text-rose-400">{lang === 'ko' ? '퇴출 대상' : 'evict'}</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground/60">
        <span>← {lang === 'ko' ? 'Hot End (자주 사용)' : 'Hot End (frequently used)'}</span>
        <span>{lang === 'ko' ? 'Cold End (오래됨)' : 'Cold End (stale)'} →</span>
      </div>
    </div>
  )
}

// ── Main Section ───────────────────────────────────────────────────────────

export function SgaBufferCacheSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        icon={<IconDatabase size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* ── 1. What is Buffer Cache ── */}
      <SgaHighlightDiagram lang={lang} />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatP1}</Prose>
      <Prose>{t.whatP2}</Prose>
      <Prose>{t.whatP3}</Prose>

      <Divider />

      {/* ── 2. Why Buffer Cache / WAL / I/O ── */}
      <WhyBufferCacheContent lang={lang} />

      <Divider />

      {/* ── 3. Buffer Search Order ── */}
      <SectionTitle>{t.searchTitle}</SectionTitle>
      <Prose>{t.searchDesc}</Prose>
      <BufferSearchDiagram lang={lang} />

      <Divider />

      {/* ── 3. Buffer States ── */}
      <SectionTitle>{t.statesTitle}</SectionTitle>
      <Prose>{t.statesDesc}</Prose>

      <div className="mb-4 grid sm:grid-cols-3 gap-3">
        {([
          {
            label: t.stateUnused,
            desc: t.stateUnusedDesc,
            color: 'border-slate-300 bg-slate-50',
            dot: 'bg-slate-400',
          },
          {
            label: t.stateClean,
            desc: t.stateCleanDesc,
            color: 'border-teal-300 bg-teal-50/60',
            dot: 'bg-teal-500',
          },
          {
            label: t.stateDirty,
            desc: t.stateDirtyDesc,
            color: 'border-amber-300 bg-amber-50/60',
            dot: 'bg-amber-500',
          },
        ] as const).map((s) => (
          <div key={s.label} className={cn('rounded-xl border-2 p-4', s.color)}>
            <div className="mb-2 flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.dot)} />
              <span className="font-mono text-xs font-bold">{s.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <InfoBox variant="note">
        {lang === 'ko' ? (
          <>버퍼는 <strong>Pinned</strong>(현재 사용 중)와 <strong>Free</strong>(즉시 재사용 가능) 두 가지 액세스 상태도 가집니다. Pinned 버퍼는 다른 프로세스가 수정 중이므로 대기해야 합니다.</>
        ) : (
          <>A buffer also has two access states: <strong>Pinned</strong> (currently in use) and <strong>Free</strong> (available immediately). Pinned buffers must be waited on while another process is modifying them.</>
        )}
      </InfoBox>

      <Divider />

      {/* ── 4. Buffer Access Modes ── */}
      <SectionTitle>{t.modesTitle}</SectionTitle>
      <Prose>{t.modesDesc}</Prose>

      <div className="mb-4 grid sm:grid-cols-2 gap-3">
        {/* Current Mode */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="mb-1.5 flex items-center gap-2">
              <IconBolt size={16} className="text-blue-500" />
              <span className="font-mono text-xs font-bold">{t.modeCurrent}</span>
            </div>
            <div className="mb-2 font-mono text-[10px] text-muted-foreground">db block get</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.modeCurrentDesc}</p>
          </div>
          <div className="border-t border-blue-200 bg-blue-50/80 px-4 py-3">
            <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-blue-500/70">
              {lang === 'ko' ? '예시 시나리오' : 'Example scenario'}
            </div>
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{t.modeCurrentExample}</p>
            <div className="space-y-1">
              {t.modeCurrentScenario.map((line, i) => (
                <div key={i} className="flex items-start gap-2 font-mono text-[10px]">
                  <span className={cn(
                    'mt-0.5 shrink-0 rounded px-1 py-px text-[8px] font-bold',
                    i === 2 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600',
                  )}>
                    {i === 2 ? 'B' : 'A'}
                  </span>
                  <span className="leading-snug text-muted-foreground">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consistent Mode */}
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50/50 overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="mb-1.5 flex items-center gap-2">
              <IconRefresh size={16} className="text-teal-500" />
              <span className="font-mono text-xs font-bold">{t.modeConsistent}</span>
            </div>
            <div className="mb-2 font-mono text-[10px] text-muted-foreground">consistent get</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.modeConsistentDesc}</p>
          </div>
          <div className="border-t border-teal-200 bg-teal-50/80 px-4 py-3">
            <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-teal-500/70">
              {lang === 'ko' ? '예시 시나리오' : 'Example scenario'}
            </div>
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{t.modeConsistentExample}</p>
            <div className="space-y-1">
              {t.modeConsistentScenario.map((line, i) => (
                <div key={i} className="flex items-start gap-2 font-mono text-[10px]">
                  <span className={cn(
                    'mt-0.5 shrink-0 rounded px-1 py-px text-[8px] font-bold',
                    i === 2 ? 'bg-amber-400 text-white' : i === 3 ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600',
                  )}>
                    {i === 0 ? 'A' : i === 1 ? 'C' : i === 2 ? 'Undo' : (lang === 'ko' ? '결과' : 'result')}
                  </span>
                  <span className="leading-snug text-muted-foreground">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── 5. LRU + Touch Count ── */}
      <SectionTitle>{t.lruTitle}</SectionTitle>
      <Prose>{t.lruP1}</Prose>
      <Prose>{t.lruP2}</Prose>
      <Prose>{t.lruP3}</Prose>

      <LruDiagram lang={lang} />

      <div className="mt-4 overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
          <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {t.touchTitle}
          </span>
        </div>
        {([t.touchRule1, t.touchRule2, t.touchRule3, t.touchRule4] as const).map((rule, i) => (
          <div key={i} className={cn('flex items-start gap-3 border-b px-4 py-2.5 text-xs last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 font-mono text-[9px] font-bold text-white">{i + 1}</span>
            <span className="leading-relaxed text-muted-foreground">{rule}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── 6. Buffer Pools ── */}
      <SectionTitle>{t.poolsTitle}</SectionTitle>
      <Prose>{t.poolsDesc}</Prose>
      <BufferPoolDiagram lang={lang} />

      <Divider />

      {/* ── 7. Full Table Scan ── */}
      <SectionTitle>{t.fullScanTitle}</SectionTitle>

      <div className="mb-4 grid sm:grid-cols-2 gap-3">
        {([
          {
            icon: <IconLayersLinked size={16} className="text-teal-500" />,
            label: lang === 'ko' ? '작은 테이블 Full Scan' : 'Small Table Full Scan',
            desc: t.fullScanP1,
            color: 'border-teal-200 bg-teal-50/50',
          },
          {
            icon: <IconDatabase size={16} className="text-slate-500" />,
            label: lang === 'ko' ? '큰 테이블 Full Scan (Direct Path)' : 'Large Table Full Scan (Direct Path)',
            desc: t.fullScanP2,
            color: 'border-slate-200 bg-slate-50/50',
          },
        ] as const).map((item) => (
          <div key={item.label} className={cn('rounded-xl border-2 p-4', item.color)}>
            <div className="mb-1.5 flex items-center gap-2">
              {item.icon}
              <span className="font-mono text-xs font-bold">{item.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <InfoBox variant="tip">{t.fullScanNote}</InfoBox>

      <Divider />

      {/* ── 8. Key Parameters ── */}
      <SectionTitle>{t.paramsTitle}</SectionTitle>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="w-[220px] px-4 py-2.5 text-left font-mono font-bold text-muted-foreground">
                {lang === 'ko' ? '파라미터' : 'Parameter'}
              </th>
              <th className="px-4 py-2.5 text-left font-mono font-bold text-muted-foreground">
                {lang === 'ko' ? '설명' : 'Description'}
              </th>
            </tr>
          </thead>
          <tbody>
            {([
              { p: t.param1, d: t.param1Desc },
              { p: t.param2, d: t.param2Desc },
              { p: t.param3, d: t.param3Desc },
              { p: t.param4, d: t.param4Desc },
            ] as const).map((row, i) => (
              <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                <td className="px-4 py-2.5 font-mono font-bold text-foreground/80">{row.p}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Divider />

      {/* ── Summary ── */}
      <SubTitle>{t.summaryTitle}</SubTitle>
      <InfoBox variant="summary">
        <ul className="list-none space-y-1">
          {t.summaryItems.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      </InfoBox>
    </div>
  )
}
