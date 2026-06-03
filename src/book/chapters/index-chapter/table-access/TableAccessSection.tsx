import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider,
} from '../../shared'
import { IconRoute } from '@tabler/icons-react'

// ── 텍스트 ────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: '인덱스에서 테이블로 가는 법',
    subtitle: 'ROWID(행 식별자)를 손에 넣었다고 바로 행 데이터가 오는 게 아니에요. Buffer Cache 해시 체인을 탐색하고, Latch를 잡고, Buffer를 Pin하고, 필요하면 디스크 I/O(Input/Output, 디스크 입출력)까지 — 생각보다 훨씬 긴 여정이 기다리고 있어요.',
    overviewTitle: '왜 이렇게 복잡한가요?',
    overviewDesc: 'Oracle은 디스크 I/O(Input/Output, 디스크 입출력)를 줄이기 위해 자주 쓰는 블록을 메모리(Buffer Cache)에 올려둬요. 그런데 수십만 개의 블록이 동시에 Buffer Cache에 올라와 있을 수 있기 때문에, "이 DBA(Data Block Address, 데이터 블록 주소)가 이미 캐시에 있는가?"를 빠르게 찾으려면 해시 테이블 구조가 필요해요. 거기다 여러 프로세스가 동시에 같은 버퍼를 건드릴 수 있어서, 접근 순서를 제어하는 Latch와 Lock도 꼭 필요하답니다.',
    stepsTitle: '단계별 과정',
    walkthrough: [
      {
        step: 1,
        phase: 'ROWID → DBA 변환',
        color: 'violet',
        detail: 'ROWID(행 식별자)에서 File# + Block# 를 꺼내 DBA(Data Block Address, 데이터 블록 주소)를 만들어요. DBA는 "파일 N번의 M번째 블록"을 가리키는 64비트 주소예요.',
        note: null,
      },
      {
        step: 2,
        phase: 'DBA → 해시값 계산',
        color: 'blue',
        detail: 'DBA(Data Block Address, 데이터 블록 주소)에 해시 함수를 적용해서, Buffer Cache의 어느 버킷(해시 체인)에 해당 블록이 있는지 결정해요. Oracle은 DBA를 일정 비트 수로 나눠 해시 버킷 번호를 구해요.',
        note: 'hash_bucket = DBA % num_hash_buckets',
      },
      {
        step: 3,
        phase: 'Cache Buffer Chain Latch 획득',
        color: 'amber',
        detail: '해당 해시 버킷의 연결 리스트(Buffer Chain)를 읽거나 수정하려면, 먼저 Cache Buffers Chain Latch를 잡아야 해요. 다른 프로세스가 같은 Latch를 쥐고 있으면 Spin 대기 → Sleep 대기가 발생해요.',
        note: '대기 이벤트: latch: cache buffers chains',
      },
      {
        step: 4,
        phase: '해시 체인 탐색 (Buffer Lookup)',
        color: 'amber',
        detail: 'Latch를 잡은 채로 해당 버킷의 Buffer Header 연결 리스트를 쭉 훑어봐요. 각 Buffer Header에는 DBA(Data Block Address, 데이터 블록 주소) 값이 있어서, 찾는 DBA와 일치하는지 하나씩 비교해요.',
        note: 'Buffer Header: DBA, state, pin count, dirty flag…',
      },
      {
        step: 5,
        phase: 'Buffer Pin (Buffer Busy 대기)',
        color: 'amber',
        detail: '원하는 Buffer를 찾으면 그 Buffer를 Pin(참조 카운트 증가)해요. 이미 다른 프로세스가 exclusive pin으로 그 버퍼를 수정 중이라면 Buffer Busy 대기가 발생해요.',
        note: '대기 이벤트: buffer busy waits / read by other session',
      },
      {
        step: 6,
        phase: 'Latch 해제',
        color: 'emerald',
        detail: 'Buffer를 Pin한 뒤에는 Cache Buffers Chain Latch를 바로 놔줘요. 이제 Pin이 보호자 역할을 대신해서 버퍼가 교체(evict)되지 않도록 막아줘요.',
        note: null,
      },
      {
        step: 7,
        phase: '[Cache Miss] 디스크 I/O',
        color: 'rose',
        detail: '버킷에 찾는 DBA(Data Block Address, 데이터 블록 주소)가 없으면 Cache Miss예요. 빈 Buffer Frame을 확보하고(LRU 방식으로 오래된 것 교체), 디스크에서 블록을 읽어 Buffer Cache에 올린 뒤 다시 Pin해요.',
        note: '대기 이벤트: db file sequential read (단일 블록)',
      },
      {
        step: 8,
        phase: '행 데이터 반환',
        color: 'slate',
        detail: 'Buffer가 메모리에 올라와 Pin까지 완료되면, ROWID(행 식별자)의 Row# (슬롯 번호)로 블록 안의 Row Directory를 찾아 실제 행 데이터를 읽어 반환해요.',
        note: null,
      },
    ],
    diagramTitle: '전체 흐름 다이어그램',
    hitLabel: 'Cache Hit 경로',
    missLabel: 'Cache Miss 경로',
    waitTitle: '주요 대기 이벤트',
    waits: [
      {
        event: 'latch: cache buffers chains',
        cause: '해시 체인 Latch 경합이에요. 같은 버킷에 핫 블록이 몰리거나, Latch를 오래 잡고 있는 작업이 있을 때 발생해요.',
        fix: 'DB_BLOCK_SIZE 최적화, 핫 블록 분산(파티셔닝), CACHE 절로 자주 쓰는 블록을 Keep Pool에 배치해 보세요.',
      },
      {
        event: 'buffer busy waits',
        cause: '다른 세션이 exclusive pin으로 같은 버퍼를 수정 중이에요. INSERT/UPDATE가 몰리는 구간에서 자주 발생해요.',
        fix: 'Sequence Cache 크기를 늘리거나, Reverse Key Index를 도입하거나, 핫한 테이블을 파티셔닝해서 버퍼를 분산해 보세요.',
      },
      {
        event: 'read by other session',
        cause: '한 세션이 디스크에서 블록을 읽어오는 동안, 같은 블록이 필요한 다른 세션이 기다리는 상황이에요.',
        fix: 'Buffer Cache 크기(DB_CACHE_SIZE)를 늘리거나, 자주 쓰는 테이블에 CACHE 절을 지정해 보세요.',
      },
      {
        event: 'db file sequential read',
        cause: '단일 블록 랜덤 I/O(Input/Output, 디스크 입출력)예요. 인덱스를 타는 쿼리에서 ROWID(행 식별자)마다 발생할 수 있어요.',
        fix: 'Covering Index(필요한 컬럼을 인덱스에 포함)로 테이블 접근 자체를 없애거나, 선택도가 낮은 컬럼 조회는 Full Scan을 고려해 보세요.',
      },
    ],
    costTitle: '왜 인덱스가 항상 빠른 게 아닌가요?',
    costDesc: '위 과정을 보면 ROWID(행 식별자) 한 개당 최소 3~4단계(해시 → Latch → Chain 탐색 → Pin)를 거쳐요. 결과가 1~2건이면 이 비용은 별거 아니지만, 수천~수만 건을 ROWID로 한 건씩 랜덤하게 접근하면 같은 과정이 수만 번 반복되는 거예요. 이럴 때는 테이블 전체를 순서대로 쭉 읽는 Full Table Scan이 훨씬 효율적이에요.',
    coveringTitle: '해결책: Covering Index (Index-Only Scan)',
    coveringDesc: 'SELECT하는 모든 컬럼이 인덱스에 포함되어 있으면 ROWID(행 식별자)로 테이블을 찾아갈 필요가 없어요. 인덱스 Leaf 블록에서 데이터를 바로 반환하기 때문에, Buffer Cache 탐색 비용이 인덱스 블록에 대해서만 발생해요.',
    coveringSql: `-- 인덱스: IDX_EMP_SAL (employee_id, salary)
SELECT employee_id, salary   -- 두 컬럼 모두 인덱스에 있음
FROM   employees
WHERE  employee_id = 145;
-- → TABLE ACCESS BY INDEX ROWID 단계가 사라짐
-- → Buffer Cache 탐색이 인덱스 블록에 대해서만 발생`,
  },
  en: {
    title: 'From Index to Table',
    subtitle: "Getting the ROWID is not the end. Oracle must hash the DBA, search a Buffer Cache hash chain, acquire a Latch, pin the buffer, and possibly read from disk — a much longer journey than it looks.",
    overviewTitle: 'Why so many steps?',
    overviewDesc: 'Oracle keeps frequently used blocks in memory (Buffer Cache) to avoid disk I/O. Because hundreds of thousands of blocks can reside in the cache simultaneously, Oracle uses a hash table to answer "is this DBA already cached?" in constant time. And because multiple processes can touch the same buffer at once, Latches and Locks control access ordering.',
    stepsTitle: 'Step-by-step walkthrough',
    walkthrough: [
      {
        step: 1,
        phase: 'ROWID → DBA',
        color: 'violet',
        detail: 'Extract File# and Block# from the ROWID to form the Data Block Address (DBA) — a 64-bit address pointing to "block M of file N".',
        note: null,
      },
      {
        step: 2,
        phase: 'DBA → Hash value',
        color: 'blue',
        detail: 'Apply a hash function to the DBA to determine which bucket (hash chain) in Buffer Cache might hold the block.',
        note: 'hash_bucket = DBA % num_hash_buckets',
      },
      {
        step: 3,
        phase: 'Acquire Cache Buffers Chain Latch',
        color: 'amber',
        detail: 'To read or modify the linked list of Buffer Headers in that bucket, Oracle must first acquire the Cache Buffers Chains Latch. If another process holds it, the current process spins then sleeps.',
        note: 'Wait event: latch: cache buffers chains',
      },
      {
        step: 4,
        phase: 'Search the hash chain (Buffer Lookup)',
        color: 'amber',
        detail: 'While holding the Latch, linearly scan the Buffer Header list in that bucket. Each header stores a DBA; compare each against the target DBA.',
        note: 'Buffer Header: DBA, state, pin count, dirty flag…',
      },
      {
        step: 5,
        phase: 'Pin the buffer (Buffer Busy wait)',
        color: 'amber',
        detail: 'When the matching Buffer Header is found, increment its pin count. If another process holds an exclusive pin (modifying the buffer), the current process waits.',
        note: 'Wait event: buffer busy waits / read by other session',
      },
      {
        step: 6,
        phase: 'Release the Latch',
        color: 'emerald',
        detail: 'Release the Cache Buffers Chain Latch immediately after pinning. The pin now protects the buffer from being evicted.',
        note: null,
      },
      {
        step: 7,
        phase: '[Cache Miss] Disk I/O',
        color: 'rose',
        detail: "If the DBA is not found in the chain, it's a Cache Miss. Oracle finds a free (or evictable) frame, reads the block from disk, loads it into the cache, and pins it.",
        note: 'Wait event: db file sequential read (single block)',
      },
      {
        step: 8,
        phase: 'Return row data',
        color: 'slate',
        detail: 'With the buffer pinned in memory, Oracle uses the Row# from the ROWID to index into the block\'s Row Directory and read the actual row bytes.',
        note: null,
      },
    ],
    diagramTitle: 'Full flow diagram',
    hitLabel: 'Cache Hit path',
    missLabel: 'Cache Miss path',
    waitTitle: 'Key wait events',
    waits: [
      {
        event: 'latch: cache buffers chains',
        cause: 'Latch contention on a hash bucket. Caused by hot blocks concentrated in one bucket or long Latch hold times.',
        fix: 'Partition hot tables to spread blocks across buckets. Move frequently accessed objects to the KEEP pool.',
      },
      {
        event: 'buffer busy waits',
        cause: 'Another session holds an exclusive pin on the buffer (INSERT/UPDATE in progress). Common on heavily written blocks.',
        fix: 'Increase Sequence cache size, use Reverse Key Index, partition the hot table to distribute blocks.',
      },
      {
        event: 'read by other session',
        cause: 'One session is reading a block from disk while another needs the same block and must wait for it.',
        fix: 'Increase DB_CACHE_SIZE, mark frequently accessed tables with CACHE clause.',
      },
      {
        event: 'db file sequential read',
        cause: 'Single-block random I/O. Can fire once per ROWID when an index scan returns many rows.',
        fix: 'Use a Covering Index to eliminate table access entirely. For low-selectivity queries, Full Table Scan may be faster.',
      },
    ],
    costTitle: 'Why indexes are not always faster',
    costDesc: 'Each ROWID lookup requires at minimum: hash computation → Latch acquire → chain scan → pin. For 1–2 rows this overhead is negligible. But for thousands of rows, those steps repeat thousands of times. At that point, a sequential Full Table Scan — which reads blocks in order with multi-block I/O — is far more efficient.',
    coveringTitle: 'Solution: Covering Index (Index-Only Scan)',
    coveringDesc: "When every column in the SELECT list is stored in the index, Oracle doesn't need to visit the table at all. Data is returned directly from the Leaf block, and Buffer Cache lookups only happen for index blocks — not table blocks.",
    coveringSql: `-- Index: IDX_EMP_SAL (employee_id, salary)
SELECT employee_id, salary   -- both columns are in the index
FROM   employees
WHERE  employee_id = 145;
-- → TABLE ACCESS BY INDEX ROWID step disappears
-- → Buffer Cache lookup only for index blocks`,
  },
}

// ── Buffer Cache Anatomy Diagram ─────────────────────────────────────────────
// overviewTitle 섹션 아래 위치하며, 각 용어를 클릭하면 설명이 나옴

const ANATOMY_TERMS = {
  ko: {
    bufferCache: {
      label: 'Buffer Cache',
      desc: 'SGA(System Global Area) 안에 있는 메모리 영역이에요. 디스크에서 읽은 데이터 블록을 여기에 올려두어 반복적인 I/O(Input/Output, 디스크 입출력)를 피해요. DB_CACHE_SIZE 파라미터로 크기를 조정할 수 있어요.',
    },
    hashBucket: {
      label: 'Hash Bucket',
      desc: 'DBA(Data Block Address, 데이터 블록 주소)를 해시 함수에 넣어 나온 버킷 번호예요. "이 블록이 캐시에 있는가?"를 거의 O(1) 속도로 찾을 수 있도록 도와주는 인덱스 역할을 해요. 버킷 수는 내부적으로 자동으로 결정돼요.',
    },
    hashChain: {
      label: 'Hash Chain',
      desc: '같은 버킷에 해시된 Buffer Header들이 연결된 링크드 리스트예요. Latch를 잡고 이 체인을 순서대로 훑으면서 원하는 DBA(Data Block Address, 데이터 블록 주소)의 Buffer Header를 찾아요.',
    },
    bufferHeader: {
      label: 'Buffer Header',
      desc: '각 버퍼 블록의 메타데이터 구조체예요. DBA(Data Block Address, 데이터 블록 주소), 상태(free/clean/dirty), pin count, dirty flag 등을 보관해요. 실제 데이터는 없고, Buffer Block을 가리키는 포인터를 갖고 있어요.',
    },
    bufferBlock: {
      label: 'Buffer Block',
      desc: '실제 데이터 블록이 올라오는 메모리 프레임이에요. 디스크의 8KB(또는 설정값) 블록과 똑같은 크기예요. Buffer Header의 포인터로 연결되어 있어요.',
    },
    latch: {
      label: 'Latch',
      desc: 'Hash Chain을 읽거나 수정하기 전에 반드시 먼저 획득해야 하는 경량 직렬화 메커니즘이에요. Spin(CPU를 잡고 반복 대기) → Sleep(잠시 기다렸다 재시도) 순서로 대기하고, 경합이 심하면 "latch: cache buffers chains" 대기 이벤트가 나타나요.',
    },
    bufferHandle: {
      label: 'Buffer Handle',
      desc: '버퍼를 Pin(참조 카운트 증가)한 뒤 해당 세션이 갖게 되는 핸들이에요. Latch를 놓은 뒤에도 Pin이 유지되어 다른 프로세스가 그 버퍼를 내쫓지(evict) 못하도록 보호해줘요.',
    },
  },
  en: {
    bufferCache: {
      label: 'Buffer Cache',
      desc: 'A region inside the SGA that holds data blocks read from disk, avoiding repeated I/O. Size is controlled by the DB_CACHE_SIZE parameter.',
    },
    hashBucket: {
      label: 'Hash Bucket',
      desc: 'The bucket index computed by hashing the DBA. Allows near-O(1) lookup: "is this block already cached?" The number of buckets is determined automatically.',
    },
    hashChain: {
      label: 'Hash Chain',
      desc: 'A linked list of Buffer Headers that hashed to the same bucket. Oracle holds the Latch and linearly scans this chain to find the target DBA.',
    },
    bufferHeader: {
      label: 'Buffer Header',
      desc: 'Metadata structure for each buffer: DBA, state (free/clean/dirty), pin count, dirty flag, and a pointer to the actual Buffer Block. Contains no data itself.',
    },
    bufferBlock: {
      label: 'Buffer Block',
      desc: 'The memory frame holding the actual data block (same size as the on-disk block, e.g. 8 KB). Pointed to by its Buffer Header.',
    },
    latch: {
      label: 'Latch',
      desc: 'A lightweight serialization mechanism required before reading or modifying a Hash Chain. Waiters spin then sleep. Contention appears as "latch: cache buffers chains" wait events.',
    },
    bufferHandle: {
      label: 'Buffer Handle',
      desc: "A handle acquired when a session pins a buffer (increments pin count). After the Latch is released, the pin keeps the buffer from being evicted until the session is done.",
    },
  },
}

type AnatomyKey = keyof typeof ANATOMY_TERMS.ko

function BufferCacheAnatomyDiagram({ isKo }: { isKo: boolean }) {
  const [active, setActive] = useState<AnatomyKey | null>(null)
  const terms = isKo ? ANATOMY_TERMS.ko : ANATOMY_TERMS.en

  function toggle(key: AnatomyKey) {
    setActive(prev => prev === key ? null : key)
  }

  const desc = active ? terms[active] : null

  // ── SVG layout constants ──────────────────────────────────────────────────
  // Hash Bucket 열 — 먼저 결정해서 BC 높이를 역산
  const BUCK_R = 13, CHAIN_ROW_H = 50
  // 버킷 4개, 첫 버킷은 BC 상단에서 48px 아래
  const BC_X = 60, BC_Y = 30
  const BUCK_X = BC_X + 26
  const FIRST_BUCK_Y = BC_Y + 48
  const BUCK_ROWS = [
    FIRST_BUCK_Y,
    FIRST_BUCK_Y + CHAIN_ROW_H,
    FIRST_BUCK_Y + CHAIN_ROW_H * 2,
    FIRST_BUCK_Y + CHAIN_ROW_H * 3,
  ]
  // BC 높이: 마지막 버킷 + 반지름 + 하단 여백 16px
  const BC_H = (BUCK_ROWS[3] - BC_Y) + BUCK_R + 16
  const BC_W = 590
  // Buffer Header (체인 노드)
  const BH_W = 78, BH_H = 24, BH_GAP = 8
  const CHAIN_START_X = BUCK_X + BUCK_R * 2 + 8
  // chains: how many BH per bucket row
  const CHAIN_LENS = [2, 3, 3, 2]
  // Buffer Block grid (우측) — BC 안쪽 오른쪽
  const BB_COLS = 5, BB_ROWS = 4, BB_CW = 46, BB_CH = 28
  const BB_X = BC_X + BC_W - BB_COLS * BB_CW - 14
  const BB_LABEL_Y = BC_Y + 18   // "Buffer Blocks" 레이블 y
  const BB_Y = BC_Y + 32         // 그리드 시작 y
  // Latch 태그 (BC 박스 왼쪽 바깥) — 버킷 중간 높이에 배치
  const LATCH_W = 38, LATCH_H = 22
  const LATCH_X = 6
  const LATCH_Y = FIRST_BUCK_Y + CHAIN_ROW_H - LATCH_H / 2  // 2번째 버킷 수평선 중간
  const SVG_W = 680
  const SVG_H = BC_Y + BC_H + 8

  // 클릭 영역별 하이라이트 색
  function hl(key: AnatomyKey) {
    return active === key ? '#fef08a' : 'transparent'
  }
  function hlStroke(key: AnatomyKey) {
    return active === key ? '#ca8a04' : 'transparent'
  }

  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      {/* 용어 뱃지 목록 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(terms) as AnatomyKey[]).map(key => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="rounded-full border px-3 py-1 font-mono text-[10px] font-semibold transition-all duration-150"
            style={{
              background: active === key ? '#fef08a' : '#f8fafc',
              borderColor: active === key ? '#ca8a04' : '#e2e8f0',
              color: active === key ? '#713f12' : '#64748b',
              boxShadow: active === key ? '0 0 0 2px #fde04755' : undefined,
            }}
          >
            {terms[key].label}
          </button>
        ))}
      </div>

      {/* SVG 다이어그램 */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <marker id="ana-arr" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
          </marker>
          <marker id="ana-arr-amber" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#d97706" />
          </marker>
        </defs>

        {/* ── Buffer Cache 외곽 박스 */}
        <rect
          x={BC_X} y={BC_Y} width={BC_W} height={BC_H}
          fill={active === 'bufferCache' ? '#fef9c3' : '#f8fafc'}
          stroke={active === 'bufferCache' ? '#ca8a04' : '#cbd5e1'}
          strokeWidth={active === 'bufferCache' ? 2 : 1.5}
          rx={10}
          style={{ cursor: 'pointer' }}
          onClick={() => toggle('bufferCache')}
        />
        {/* BC 레이블 — 상단 중앙, 충분한 여백 */}
        <text x={BC_X + BC_W / 2} y={BC_Y + 18} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="bold" fill={active === 'bufferCache' ? '#92400e' : '#94a3b8'} style={{ cursor: 'pointer' }} onClick={() => toggle('bufferCache')}>
          Buffer Cache (SGA)
        </text>

        {/* ── Hash Bucket 열 레이블 — 첫 버킷 위, circles와 겹치지 않도록 버킷 루프 이후에 렌더 */}

        {/* ── Buffer Block 그리드 */}
        {/* "Buffer Blocks" 레이블 — 그리드 상단에 여백 확보 */}
        <text x={BB_X + (BB_COLS * BB_CW) / 2} y={BB_LABEL_Y} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" fill={active === 'bufferBlock' ? '#92400e' : '#64748b'} style={{ cursor: 'pointer' }} onClick={() => toggle('bufferBlock')}>
          Buffer Blocks
        </text>
        {/* 배경 박스 — 레이블 아래부터 */}
        <rect
          x={BB_X - 6} y={BB_Y - 4}
          width={BB_COLS * BB_CW + 12} height={BB_ROWS * BB_CH + 8}
          fill={active === 'bufferBlock' ? '#fef9c3' : '#f1f5f9'}
          stroke={active === 'bufferBlock' ? '#ca8a04' : '#e2e8f0'}
          strokeWidth={active === 'bufferBlock' ? 2 : 1}
          rx={6}
          style={{ cursor: 'pointer' }}
          onClick={() => toggle('bufferBlock')}
        />
        {Array.from({ length: BB_ROWS }).map((_, ri) =>
          Array.from({ length: BB_COLS }).map((_, ci) => {
            const bx = BB_X + ci * BB_CW, by = BB_Y + ri * BB_CH
            const isFilled = (ri + ci) % 3 !== 0
            return (
              <rect key={`bb-${ri}-${ci}`}
                x={bx + 2} y={by + 2} width={BB_CW - 4} height={BB_CH - 4}
                fill={isFilled ? '#e0e7ff' : '#f8fafc'}
                stroke={isFilled ? '#a5b4fc' : '#e2e8f0'}
                strokeWidth={1} rx={3}
                style={{ cursor: 'pointer', pointerEvents: 'none' }}
              />
            )
          })
        )}

        {/* ── Dotted pointer lines: BH → BB (sample connections) */}
        {[
          { bx: CHAIN_START_X + BH_W, by: BUCK_ROWS[0], bbci: 2, bbri: 0 },
          { bx: CHAIN_START_X + (BH_W + BH_GAP) + BH_W, by: BUCK_ROWS[0], bbci: 4, bbri: 1 },
          { bx: CHAIN_START_X + BH_W, by: BUCK_ROWS[1], bbci: 1, bbri: 2 },
          { bx: CHAIN_START_X + (BH_W + BH_GAP) + BH_W, by: BUCK_ROWS[1], bbci: 3, bbri: 3 },
          { bx: CHAIN_START_X + (BH_W + BH_GAP) * 2 + BH_W, by: BUCK_ROWS[1], bbci: 0, bbri: 1 },
          { bx: CHAIN_START_X + BH_W, by: BUCK_ROWS[2], bbci: 4, bbri: 2 },
          { bx: CHAIN_START_X + (BH_W + BH_GAP) * 2 + BH_W, by: BUCK_ROWS[2], bbci: 2, bbri: 3 },
        ].map((ln, i) => {
          const tx = BB_X + ln.bbci * BB_CW + BB_CW / 2
          const ty = BB_Y + ln.bbri * BB_CH + BB_CH / 2
          const isHlBH = active === 'bufferHeader'
          const isHlBB = active === 'bufferBlock'
          return (
            <line key={i}
              x1={ln.bx} y1={ln.by} x2={tx} y2={ty}
              stroke={isHlBH || isHlBB ? '#ca8a04' : '#94a3b8'}
              strokeWidth={isHlBH || isHlBB ? 1.5 : 1}
              strokeDasharray="4 3"
              opacity={isHlBH || isHlBB ? 0.8 : 0.3}
            />
          )
        })}

        {/* ── Hash Bucket circles + chains */}
        {BUCK_ROWS.map((by, ri) => {
          const isHlBucket = active === 'hashBucket'
          const isHlChain = active === 'hashChain'
          const isHlBH = active === 'bufferHeader'
          const len = CHAIN_LENS[ri]
          return (
            <g key={`row-${ri}`}>
              {/* Bucket circle */}
              <circle cx={BUCK_X} cy={by} r={BUCK_R}
                fill={isHlBucket ? hl('hashBucket') : '#f1f5f9'}
                stroke={isHlBucket ? hlStroke('hashBucket') : '#94a3b8'}
                strokeWidth={isHlBucket ? 2 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => toggle('hashBucket')}
              />
              <text x={BUCK_X} y={by + 4} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="bold" fill={isHlBucket ? '#713f12' : '#64748b'} style={{ pointerEvents: 'none' }}>
                {ri}
              </text>

              {/* Bucket → first BH */}
              <line
                x1={BUCK_X + BUCK_R} y1={by}
                x2={CHAIN_START_X} y2={by}
                stroke={isHlChain ? '#ca8a04' : '#94a3b8'}
                strokeWidth={isHlChain ? 1.5 : 1}
                markerEnd={isHlChain ? 'url(#ana-arr-amber)' : 'url(#ana-arr)'}
              />

              {/* BH chain */}
              {Array.from({ length: len }).map((_, bi) => {
                const bx = CHAIN_START_X + bi * (BH_W + BH_GAP)
                const bhY = by - BH_H / 2
                const isPinned = ri === 1 && bi === 1
                const isHlHandle = active === 'bufferHandle' && isPinned

                return (
                  <g key={`bh-${ri}-${bi}`}>
                    {/* Buffer Handle 표시 */}
                    {isPinned && (
                      <g style={{ cursor: 'pointer' }} onClick={() => toggle('bufferHandle')}>
                        <rect
                          x={bx + BH_W / 2 - 22} y={bhY - 22} width={44} height={16}
                          fill={active === 'bufferHandle' ? '#fef08a' : '#f0fdf4'}
                          stroke={active === 'bufferHandle' ? '#ca8a04' : '#4ade80'}
                          strokeWidth={active === 'bufferHandle' ? 2 : 1} rx={4}
                        />
                        <text x={bx + BH_W / 2} y={bhY - 10} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" fill={active === 'bufferHandle' ? '#92400e' : '#16a34a'}>
                          Handle
                        </text>
                        <line
                          x1={bx + BH_W / 2} y1={bhY - 6}
                          x2={bx + BH_W / 2} y2={bhY}
                          stroke={active === 'bufferHandle' ? '#ca8a04' : '#4ade80'}
                          strokeWidth={1}
                        />
                      </g>
                    )}

                    {/* BH rect */}
                    <rect
                      x={bx} y={bhY} width={BH_W} height={BH_H}
                      fill={isHlHandle ? '#fef08a' : isHlBH ? hl('bufferHeader') : isPinned ? '#dcfce7' : '#f8fafc'}
                      stroke={isHlHandle ? '#ca8a04' : isHlBH ? hlStroke('bufferHeader') : isPinned ? '#4ade80' : '#cbd5e1'}
                      strokeWidth={isHlBH || isHlHandle ? 2 : 1} rx={4}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggle('bufferHeader')}
                    />
                    <text x={bx + BH_W / 2} y={by + 3} textAnchor="middle" fontSize={8} fontFamily="monospace" fill={isHlBH ? '#92400e' : isPinned ? '#15803d' : '#64748b'} style={{ pointerEvents: 'none' }}>
                      {isPinned ? 'BH·pin=1' : `BH·${ri}${bi}`}
                    </text>

                    {/* Chain arrow */}
                    {bi < len - 1 && (
                      <line
                        x1={bx + BH_W} y1={by}
                        x2={bx + BH_W + BH_GAP} y2={by}
                        stroke={isHlChain ? '#ca8a04' : '#94a3b8'}
                        strokeWidth={isHlChain ? 1.5 : 1}
                        markerEnd={isHlChain ? 'url(#ana-arr-amber)' : 'url(#ana-arr)'}
                      />
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* ── Hash Bucket 열 레이블 — 버킷 루프 이후 렌더해서 circles 위에 표시 */}
        <text x={BUCK_X} y={FIRST_BUCK_Y - 16} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#94a3b8">Buckets</text>

        {/* ── Latch 태그 — BC 왼쪽 바깥, 버킷들 옆에 배치. 루프 바깥에서 최상단 렌더 */}
        {(() => {
          const isHlLatch = active === 'latch'
          // Latch 태그 오른쪽 끝 → BC 왼쪽 테두리 연결선
          const lineX1 = LATCH_X + LATCH_W
          const lineY1 = LATCH_Y + LATCH_H / 2
          const lineX2 = BC_X
          const lineY2 = LATCH_Y + LATCH_H / 2
          return (
            <g style={{ cursor: 'pointer' }} onClick={() => toggle('latch')}>
              {/* Latch → BC 연결 점선 (화살표 없음) */}
              <line
                x1={lineX1} y1={lineY1}
                x2={lineX2} y2={lineY2}
                stroke={isHlLatch ? '#ca8a04' : '#fb923c'}
                strokeWidth={1} strokeDasharray="3 2" opacity={0.7}
              />
              <rect
                x={LATCH_X} y={LATCH_Y} width={LATCH_W} height={LATCH_H}
                fill={isHlLatch ? '#fef08a' : '#fff7ed'}
                stroke={isHlLatch ? '#ca8a04' : '#fb923c'}
                strokeWidth={isHlLatch ? 2 : 1} rx={4}
              />
              <text x={LATCH_X + LATCH_W / 2} y={LATCH_Y + 14} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" fill={isHlLatch ? '#92400e' : '#ea580c'}>
                Latch
              </text>
            </g>
          )
        })()}
      </svg>

      {/* 설명 패널 */}
      <AnimatePresence mode="wait">
        {desc ? (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <p className="mb-1 font-mono text-[11px] font-bold text-amber-800">{desc.label}</p>
            <p className="text-[11px] leading-relaxed text-slate-600">{desc.desc}</p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 flex h-10 items-center justify-center rounded-xl border border-dashed border-slate-200"
          >
            <p className="font-mono text-[10px] text-slate-300">
              {isKo ? '위 뱃지를 클릭하면 용어 설명이 표시됩니다' : 'Click a badge above to see the term explained'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── 색상 매핑 ────────────────────────────────────────────────────────────────

const STEP_COLORS: Record<string, { bg: string; border: string; badge: string; text: string; dot: string }> = {
  violet: { bg: 'bg-violet-50',  border: 'border-violet-200', badge: 'bg-violet-500', text: 'text-violet-700', dot: 'bg-violet-400' },
  blue:   { bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'bg-blue-500',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  amber:  { bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-500',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  emerald:{ bg: 'bg-emerald-50', border: 'border-emerald-200',badge: 'bg-emerald-500',text: 'text-emerald-700',dot: 'bg-emerald-400' },
  rose:   { bg: 'bg-rose-50',    border: 'border-rose-200',   badge: 'bg-rose-500',   text: 'text-rose-700',   dot: 'bg-rose-400' },
  slate:  { bg: 'bg-slate-50',   border: 'border-slate-200',  badge: 'bg-slate-500',  text: 'text-slate-700',  dot: 'bg-slate-400' },
}

// ── Step → diagram highlight mapping ─────────────────────────────────────────
//
// step 번호(1~8)가 FlowDiagram의 어느 노드(0~7)를 켜는지,
// BufferCacheDiagram의 어느 영역을 강조하는지 정의한다.
//
// flowNodes: 켜질 FlowDiagram 노드 인덱스 목록
// bufZone:   'rowid' | 'hash' | 'latch' | 'chain' | 'pin' | 'release' | 'disk' | 'row'
//            BufferCacheDiagram 내에서 시각적으로 강조할 영역 키
type BufZone = 'rowid' | 'hash' | 'latch' | 'chain' | 'pin' | 'release' | 'disk' | 'row'

const STEP_HIGHLIGHT: Record<number, { flowNodes: number[]; bufZone: BufZone }> = {
  1: { flowNodes: [0, 1],    bufZone: 'rowid'   },
  2: { flowNodes: [1, 2],    bufZone: 'hash'    },
  3: { flowNodes: [2, 3],    bufZone: 'latch'   },
  4: { flowNodes: [3, 4],    bufZone: 'chain'   },
  5: { flowNodes: [4, 5],    bufZone: 'pin'     },
  6: { flowNodes: [5, 6],    bufZone: 'release' },
  7: { flowNodes: [4],       bufZone: 'disk'    },
  8: { flowNodes: [6, 7],    bufZone: 'row'     },
}

// ── Buffer Cache Diagram ──────────────────────────────────────────────────────

/*
 * Layout mirrors the bysql.net reference:
 *   [Hash Bucket circle] → [BH]→[BH]→[BH]  (horizontal linked list)
 *                                  ↓ (dotted pointer)
 *                             [Buffer Block grid]
 *
 * 4 chains, target chain is row index 2 (amber highlight).
 * Dotted SVG lines connect each BH to a cell in the block grid.
 */

// Buffer header data per chain: [dba, isTarget]
const CHAINS: { dba: string; target?: boolean }[][] = [
  [{ dba: '0x0A01' }, { dba: '0x0A45' }, { dba: '0x0B12' }],
  [{ dba: '0x1C03' }, { dba: '0x1C7F' }],
  [{ dba: '0x2001' }, { dba: '0x2437', target: true }, { dba: '0x2612' }, { dba: '0x2899' }],
  [{ dba: '0x3B02' }, { dba: '0x3B55' }, { dba: '0x3C10' }],
]

// 8×4 grid of buffer blocks; each cell has a fill style
type CellStyle = 'empty' | 'used' | 'dirty' | 'target'
const GRID_COLS = 8
const GRID_ROWS = 4
const CELL_STYLES: CellStyle[][] = [
  ['used',   'empty',  'dirty',  'used',   'empty',  'used',   'dirty',  'used'  ],
  ['empty',  'used',   'used',   'empty',  'dirty',  'empty',  'used',   'empty' ],
  ['used',   'dirty',  'target', 'used',   'empty',  'used',   'empty',  'dirty' ],
  ['empty',  'used',   'empty',  'dirty',  'used',   'empty',  'used',   'used'  ],
]

// SVG pointer targets: which grid cell (col, row) does each BH point to?
// [chainIdx][bhIdx] → { col, row }
const POINTERS: Record<string, { col: number; row: number }> = {
  '0-0': { col: 5, row: 0 },
  '0-1': { col: 1, row: 1 },
  '0-2': { col: 7, row: 0 },
  '1-0': { col: 0, row: 3 },
  '1-1': { col: 4, row: 1 },
  '2-0': { col: 3, row: 3 },
  '2-1': { col: 2, row: 2 }, // target block
  '2-2': { col: 6, row: 1 },
  '2-3': { col: 1, row: 3 },
  '3-0': { col: 7, row: 2 },
  '3-1': { col: 0, row: 2 },
  '3-2': { col: 4, row: 3 },
}

const CELL_W = 42
const CELL_H = 30
const GRID_X = 390   // x offset where block grid starts (within SVG)
const GRID_Y = 4

const CHAIN_ROW_H = 72  // vertical spacing between chains
const CHAIN_START_Y = 26 // y of first chain center

const BH_W = 74
const BH_H = 26
const BH_GAP = 10
const BUCKET_R = 14
const BUCKET_X = 20

function cellFill(style: CellStyle) {
  if (style === 'target') return '#d1fae5'   // emerald-100
  if (style === 'dirty')  return '#fef3c7'   // amber-100
  if (style === 'used')   return '#e0e7ff'   // indigo-100
  return '#f8fafc'                            // slate-50
}
function cellStroke(style: CellStyle) {
  if (style === 'target') return '#6ee7b7'
  if (style === 'dirty')  return '#fcd34d'
  if (style === 'used')   return '#a5b4fc'
  return '#e2e8f0'
}

const SVG_W = GRID_X + GRID_COLS * CELL_W + 4
const SVG_H = CHAIN_START_Y + (CHAINS.length - 1) * CHAIN_ROW_H + BUCKET_R * 2 + 16

function BufferCacheDiagram({ isKo, activeStep }: { isKo: boolean; activeStep: number | null }) {
  const bufZone = activeStep != null ? STEP_HIGHLIGHT[activeStep]?.bufZone : null
  // Compute BH positions for each chain
  const bhPos = CHAINS.map((chain, ci) => {
    const cy = CHAIN_START_Y + ci * CHAIN_ROW_H + BUCKET_R
    return chain.map((_, bi) => ({
      x: BUCKET_X + BUCKET_R * 2 + 10 + bi * (BH_W + BH_GAP),
      y: cy - BH_H / 2,
    }))
  })

  // Compute block grid cell centers
  function cellCenter(col: number, row: number) {
    return {
      cx: GRID_X + col * CELL_W + CELL_W / 2,
      cy: GRID_Y + row * CELL_H + CELL_H / 2,
    }
  }

  const isTargetChain = (ci: number) => ci === 2

  return (
    <div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H + 14}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Section labels — SVG 안에서 비율 유지 */}
        <text x={GRID_X / 2} y={10} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" fill="#94a3b8" letterSpacing={1}>
          {isKo ? 'HASH BUCKET + BUFFER HEADER' : 'HASH BUCKET + BUFFER HEADER'}
        </text>
        <text x={GRID_X + (GRID_COLS * CELL_W) / 2} y={10} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" fill="#94a3b8" letterSpacing={1}>
          BUFFER BLOCK
        </text>
        <g transform={`translate(0, 14)`}>
          {/* ── Dotted pointer lines (BH → Block), drawn first so nodes appear on top */}
          {CHAINS.map((chain, ci) =>
            chain.map((_, bi) => {
              const key = `${ci}-${bi}`
              const ptr = POINTERS[key]
              if (!ptr) return null
              const bh = bhPos[ci][bi]
              const { cx: bx, cy: by } = cellCenter(ptr.col, ptr.row)
              const isTarget = ci === 2 && bi === 1
              return (
                <line
                  key={key}
                  x1={bh.x + BH_W}
                  y1={bh.y + BH_H / 2}
                  x2={bx}
                  y2={by}
                  stroke={isTarget ? '#10b981' : '#94a3b8'}
                  strokeWidth={isTarget ? 1.5 : 1}
                  strokeDasharray={isTarget ? '4 2' : '3 3'}
                  opacity={isTarget ? 0.9 : 0.45}
                />
              )
            })
          )}

          {/* ── Buffer Block grid */}
          {CELL_STYLES.map((row, ri) =>
            row.map((style, ci) => {
              const x = GRID_X + ci * CELL_W
              const y = GRID_Y + ri * CELL_H
              // step 8(행 반환)일 때 target 블록 강조
              const effectiveStyle: CellStyle =
                bufZone === 'row' && style === 'target' ? 'target'
                : bufZone === 'disk' && style === 'empty' && ri === 1 && ci === 3 ? 'target'
                : style
              return (
                <g key={`cell-${ri}-${ci}`}>
                  <rect
                    x={x} y={y} width={CELL_W} height={CELL_H}
                    fill={cellFill(effectiveStyle)}
                    stroke={cellStroke(effectiveStyle)}
                    strokeWidth={effectiveStyle === 'target' ? 1.5 : 1}
                    rx={2}
                  />
                  {style === 'dirty' && (
                    <>
                      <line x1={x+4}  y1={y}       x2={x}       y2={y+4}  stroke="#fcd34d" strokeWidth={1} opacity={0.6} />
                      <line x1={x+10} y1={y}       x2={x}       y2={y+10} stroke="#fcd34d" strokeWidth={1} opacity={0.6} />
                      <line x1={x+16} y1={y}       x2={x}       y2={y+16} stroke="#fcd34d" strokeWidth={1} opacity={0.6} />
                      <line x1={x+CELL_W} y1={y+4} x2={x+4}    y2={y+CELL_H} stroke="#fcd34d" strokeWidth={1} opacity={0.6} />
                      <line x1={x+CELL_W} y1={y+12} x2={x+12}  y2={y+CELL_H} stroke="#fcd34d" strokeWidth={1} opacity={0.6} />
                    </>
                  )}
                  {effectiveStyle === 'target' && (
                    <text
                      x={x + CELL_W / 2} y={y + CELL_H / 2 + 4}
                      textAnchor="middle"
                      fontSize={9} fontWeight="bold" fill="#065f46" fontFamily="monospace"
                    >
                      {bufZone === 'row' ? 'HIT' : bufZone === 'disk' ? 'I/O' : 'HIT'}
                    </text>
                  )}
                </g>
              )
            })
          )}

          {/* Grid outer border */}
          <rect
            x={GRID_X} y={GRID_Y}
            width={GRID_COLS * CELL_W} height={GRID_ROWS * CELL_H}
            fill="none" stroke="#cbd5e1" strokeWidth={1.5} rx={3}
          />

          {/* ── Hash Bucket chains */}
          {CHAINS.map((chain, ci) => {
            const cy = CHAIN_START_Y + ci * CHAIN_ROW_H + BUCKET_R
            const isTarget = isTargetChain(ci)

            // step별 강조: hash→버킷 색, latch→버킷 링 펄스, chain→체인 BH 강조, pin→target BH 강조
            const bucketGlow = isTarget && (bufZone === 'hash' || bufZone === 'latch' || bufZone === 'chain' || bufZone === 'pin' || bufZone === 'release')
            const bucketPulse = isTarget && bufZone === 'latch'

            return (
              <g key={`chain-${ci}`}>
                {/* Latch pulse ring */}
                {bucketPulse && (
                  <circle
                    cx={BUCKET_X + BUCKET_R} cy={cy} r={BUCKET_R + 5}
                    fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.4}
                    strokeDasharray="4 3"
                  />
                )}
                {/* Bucket circle */}
                <circle
                  cx={BUCKET_X + BUCKET_R} cy={cy} r={BUCKET_R}
                  fill={bucketGlow ? '#fef3c7' : isTarget ? '#fef3c7' : '#f1f5f9'}
                  stroke={bucketGlow ? '#f59e0b' : isTarget ? '#f59e0b' : '#94a3b8'}
                  strokeWidth={bucketGlow ? 2 : isTarget ? 1.5 : 1}
                />
                <text
                  x={BUCKET_X + BUCKET_R} y={cy + 4}
                  textAnchor="middle" fontSize={9} fontFamily="monospace"
                  fontWeight="bold"
                  fill={isTarget ? '#92400e' : '#64748b'}
                >
                  {ci}
                </text>

                {/* Bucket → first BH arrow */}
                {chain.length > 0 && (
                  <line
                    x1={BUCKET_X + BUCKET_R * 2} y1={cy}
                    x2={bhPos[ci][0].x} y2={cy}
                    stroke={isTarget ? '#f59e0b' : '#94a3b8'}
                    strokeWidth={1} markerEnd="url(#arr)"
                  />
                )}

                {/* Buffer Headers */}
                {chain.map((bh, bi) => {
                  const { x, y } = bhPos[ci][bi]
                  const isHit = bh.target === true
                  // chain 탐색 단계: 체인 내 BH 순차 강조
                  const isScanning = isTarget && bufZone === 'chain' && !isHit
                  // pin 단계: target BH만 강조
                  const isPinned = isHit && (bufZone === 'pin' || bufZone === 'release' || bufZone === 'row')
                  return (
                    <g key={`bh-${ci}-${bi}`}>
                      <rect
                        x={x} y={y} width={BH_W} height={BH_H}
                        fill={
                          isPinned ? '#d1fae5'
                          : isScanning ? '#fef9c3'
                          : isHit ? '#d1fae5'
                          : isTarget ? '#fffbeb'
                          : '#f8fafc'
                        }
                        stroke={
                          isPinned ? '#10b981'
                          : isScanning ? '#facc15'
                          : isHit ? '#10b981'
                          : isTarget ? '#fbbf24'
                          : '#cbd5e1'
                        }
                        strokeWidth={isPinned || isHit ? 1.5 : 1}
                        rx={3}
                      />
                      <text
                        x={x + BH_W / 2} y={y + BH_H / 2 + 4}
                        textAnchor="middle" fontSize={9} fontFamily="monospace"
                        fontWeight={isHit || isPinned ? 'bold' : 'normal'}
                        fill={isPinned ? '#065f46' : isHit ? '#065f46' : isTarget ? '#92400e' : '#64748b'}
                      >
                        {bh.dba}
                      </text>

                      {/* Arrow to next BH */}
                      {bi < chain.length - 1 && (
                        <line
                          x1={x + BH_W} y1={y + BH_H / 2}
                          x2={bhPos[ci][bi + 1].x} y2={y + BH_H / 2}
                          stroke={isTarget ? '#f59e0b' : '#94a3b8'}
                          strokeWidth={1} markerEnd="url(#arr)"
                        />
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* ── Disk I/O overlay (step 7) */}
          {bufZone === 'disk' && (
            <g>
              <rect
                x={GRID_X} y={GRID_Y}
                width={GRID_COLS * CELL_W} height={GRID_ROWS * CELL_H}
                fill="#fff1f2" stroke="#fda4af" strokeWidth={2} rx={3} opacity={0.5}
              />
              <text
                x={GRID_X + (GRID_COLS * CELL_W) / 2}
                y={GRID_Y + (GRID_ROWS * CELL_H) / 2 - 6}
                textAnchor="middle" fontSize={12} fontFamily="monospace"
                fontWeight="bold" fill="#e11d48"
              >
                {isKo ? '💾 디스크 I/O' : '💾 Disk I/O'}
              </text>
              <text
                x={GRID_X + (GRID_COLS * CELL_W) / 2}
                y={GRID_Y + (GRID_ROWS * CELL_H) / 2 + 10}
                textAnchor="middle" fontSize={9} fontFamily="monospace"
                fill="#e11d48" opacity={0.8}
              >
                db file sequential read
              </text>
            </g>
          )}

          {/* ── ROWID overlay (step 1) */}
          {bufZone === 'rowid' && (
            <g>
              <rect
                x={BUCKET_X} y={CHAIN_START_Y - 4}
                width={BUCKET_R * 2} height={SVG_H - CHAIN_START_Y}
                fill="#ede9fe" stroke="#a78bfa" strokeWidth={1.5} rx={4} opacity={0.4}
              />
            </g>
          )}

          {/* ── Bucket label brace on left */}
          <text
            x={6} y={SVG_H / 2}
            textAnchor="middle" fontSize={9} fontFamily="monospace"
            fill="#94a3b8"
            transform={`rotate(-90, 6, ${SVG_H / 2})`}
          >
            Hash Bucket
          </text>

          {/* Arrowhead marker */}
          <defs>
            <marker id="arr" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
            </marker>
          </defs>
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3">
        {[
          { color: '#e0e7ff', stroke: '#a5b4fc', label: isKo ? 'Clean' : 'Clean' },
          { color: '#fef3c7', stroke: '#fcd34d', label: isKo ? 'Dirty' : 'Dirty' },
          { color: '#d1fae5', stroke: '#6ee7b7', label: isKo ? 'Target (Hit)' : 'Target (Hit)' },
          { color: '#f8fafc', stroke: '#e2e8f0', label: isKo ? 'Free' : 'Free' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-5 rounded-sm border"
              style={{ background: item.color, borderColor: item.stroke }}
            />
            <span className="font-mono text-[9px] text-slate-500">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <svg width={20} height={10}><line x1={0} y1={5} x2={20} y2={5} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" /></svg>
          <span className="font-mono text-[9px] text-slate-500">{isKo ? 'BH → Block 포인터 (target)' : 'BH → Block ptr (target)'}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width={20} height={10}><line x1={0} y1={5} x2={20} y2={5} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} /></svg>
          <span className="font-mono text-[9px] text-slate-500">{isKo ? 'BH → Block 포인터' : 'BH → Block ptr'}</span>
        </div>
      </div>
    </div>
  )
}

// ── Flow Diagram ──────────────────────────────────────────────────────────────

// FlowDiagram 노드별 색상 정의 (tailwind 클래스 대신 inline style로 처리해 activeStep 강조 가능)
const NODE_BASE_COLORS = [
  { bg: '#ede9fe', border: '#a78bfa', dot: '#7c3aed', text: '#5b21b6', ring: '#a78bfa' }, // 0 ROWID
  { bg: '#ede9fe', border: '#a78bfa', dot: '#7c3aed', text: '#5b21b6', ring: '#a78bfa' }, // 1 DBA
  { bg: '#dbeafe', border: '#93c5fd', dot: '#2563eb', text: '#1e40af', ring: '#93c5fd' }, // 2 Hash
  { bg: '#fef3c7', border: '#fbbf24', dot: '#d97706', text: '#92400e', ring: '#fbbf24' }, // 3 Latch
  { bg: '#fef3c7', border: '#fbbf24', dot: '#d97706', text: '#92400e', ring: '#fbbf24' }, // 4 Chain
  { bg: '#fef3c7', border: '#fbbf24', dot: '#d97706', text: '#92400e', ring: '#fbbf24' }, // 5 Pin
  { bg: '#d1fae5', border: '#6ee7b7', dot: '#059669', text: '#065f46', ring: '#6ee7b7' }, // 6 Latch Rel
  { bg: '#f1f5f9', border: '#cbd5e1', dot: '#64748b', text: '#334155', ring: '#cbd5e1' }, // 7 Row Data
]

const NODE_ACTIVE = { bg: '#fef9c3', border: '#facc15', dot: '#ca8a04', ring: '#fde047' }

function FlowDiagram({
  isKo,
  activeStep,
  onStepClick,
}: {
  isKo: boolean
  activeStep: number | null
  onStepClick: (step: number) => void
}) {
  const activeNodes = activeStep != null ? (STEP_HIGHLIGHT[activeStep]?.flowNodes ?? []) : []
  const isMissStep = activeStep === 7

  // 노드 인덱스 i → step 번호 (1-based)
  // 각 노드가 "주로" 어느 step에 해당하는지 (badge 번호용)
  // 노드 0 → step 1, 1 → step 1/2 경계, 2 → step 2, 3 → step 3, 4 → step 4, 5 → step 5, 6 → step 6, 7 → step 8
  const NODE_STEP = [1, 2, 3, 4, 5, 6, 7, 8] // step 번호 직접 1:1 매핑

  const hitPath = isKo
    ? ['ROWID', 'DBA 변환', '해시 계산', 'Latch 획득', '체인 탐색', 'Buffer Pin', 'Latch 해제', '행 반환']
    : ['ROWID', 'DBA', 'Hash', 'Latch Acq.', 'Chain Scan', 'Pin Buffer', 'Latch Rel.', 'Row Data']

  const missExtra = isKo ? ['빈 Frame 확보', '디스크 읽기', 'Buffer 적재'] : ['Free Frame', 'Disk Read', 'Load Buffer']

  // 선택된 step의 walkthrough 데이터 (설명 패널용)
  // T 객체는 컴포넌트 외부 상수이므로 직접 참조
  const selectedWalk = activeStep != null
    ? (isKo ? T.ko.walkthrough : T.en.walkthrough).find(w => w.step === activeStep) ?? null
    : null
  const selectedColor = selectedWalk ? STEP_COLORS[selectedWalk.color] : null

  return (
    <div className="rounded-2xl border bg-slate-50 px-4 py-4">

      {/* ── 상단: [phase 버튼 목록] + [Buffer Cache 다이어그램] 좌우 배치 */}
      <div className="flex gap-3">

        {/* 왼쪽: phase 버튼 세로 목록 */}
        <div className="flex shrink-0 flex-col" style={{ width: 148 }}>
          {hitPath.map((label, i) => {
            const stepNum = NODE_STEP[i]
            const isActive = activeNodes.includes(i)
            const isSelected = activeStep === stepNum
            const c = NODE_BASE_COLORS[i]
            const isLast = i === hitPath.length - 1
            const connActive = !isLast && activeNodes.includes(i) && activeNodes.includes(i + 1)
            return (
              <div key={i} className="flex flex-col">
                <button
                  onClick={() => onStepClick(stepNum)}
                  className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all duration-200 hover:shadow-sm"
                  style={{
                    background: isActive ? NODE_ACTIVE.bg : c.bg,
                    borderColor: isSelected ? NODE_ACTIVE.ring : isActive ? NODE_ACTIVE.ring : c.border,
                    borderWidth: isSelected || isActive ? 2 : 1,
                    boxShadow: isSelected ? `0 0 0 2px ${NODE_ACTIVE.ring}44` : undefined,
                  }}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white transition-colors duration-200"
                    style={{ background: isActive ? NODE_ACTIVE.dot : c.dot }}
                  >
                    {stepNum}
                  </span>
                  <span
                    className="font-mono text-[10px] font-semibold leading-tight transition-colors duration-200"
                    style={{ color: isActive ? NODE_ACTIVE.dot : c.text }}
                  >
                    {label}
                  </span>
                </button>
                {!isLast && (
                  <div className="ml-[13px] h-2 w-px transition-colors duration-200"
                    style={{ background: connActive ? NODE_ACTIVE.dot : '#e2e8f0' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* 오른쪽: Buffer Cache 다이어그램 */}
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3">
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {isKo ? 'Buffer Cache 해시 구조' : 'Buffer Cache Hash Structure'}
          </p>
          <BufferCacheDiagram isKo={isKo} activeStep={activeStep} />
        </div>
      </div>

      {/* ── 하단: 설명 패널 (버튼 클릭 시) + Cache Miss 분기 */}
      <AnimatePresence mode="wait">
        {selectedWalk && selectedColor ? (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className={`mt-3 rounded-xl border p-3 ${selectedColor.bg} ${selectedColor.border}`}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white ${selectedColor.badge}`}>
                {selectedWalk.step}
              </span>
              <span className={`text-[12px] font-bold ${selectedColor.text}`}>
                {selectedWalk.phase}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {selectedWalk.detail}
            </p>
            {selectedWalk.note && (
              <div className={`mt-2 inline-block rounded border px-2 py-1 font-mono text-[10px] font-semibold ${selectedColor.border} ${selectedColor.text}`}>
                {selectedWalk.note}
              </div>
            )}
            {/* Cache Miss 분기 — step 7일 때 설명 패널 안에 인라인 표시 */}
            {isMissStep && (
              <div className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2">
                <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-rose-400">
                  {isKo ? 'Cache Miss 분기' : 'Cache Miss branch'}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  {missExtra.map((label, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="rounded border border-rose-200 bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-rose-700">
                        {label}
                      </span>
                      {i < missExtra.length - 1 && (
                        <span className="font-mono text-[9px] text-rose-400">→</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-1 font-mono text-[9px] text-rose-500">
                  {isKo ? '대기: db file sequential read' : 'Wait: db file sequential read'}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 flex h-10 items-center justify-center rounded-xl border border-dashed border-slate-200"
          >
            <p className="font-mono text-[10px] text-slate-300">
              {isKo ? '단계를 클릭하면 설명이 표시됩니다' : 'Click a step to see details'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function TableAccessSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  // activeStep: 1~8, null = 선택 없음
  // walkthrough 아코디언 클릭 → activeStep 업데이트 → 다이어그램 강조 연동
  const [activeStep, setActiveStep] = useState<number | null>(null)

  function handleStepClick(stepNum: number) {
    setActiveStep(prev => prev === stepNum ? null : stepNum)
  }

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconRoute size={36} color="#7c3aed" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>
      <div className="mt-4">
        <BufferCacheAnatomyDiagram isKo={isKo} />
      </div>

      <Divider />

      <SectionTitle>{t.diagramTitle}</SectionTitle>
      <FlowDiagram isKo={isKo} activeStep={activeStep} onStepClick={handleStepClick} />

      <Divider />

      <SectionTitle>{t.waitTitle}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {t.waits.map((w, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <p className="mb-2 font-mono text-xs font-bold text-rose-600">{w.event}</p>
            <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{isKo ? '원인: ' : 'Cause: '}</span>
              {w.cause}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-emerald-600">{isKo ? '대응: ' : 'Fix: '}</span>
              {w.fix}
            </p>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.costTitle}</SectionTitle>
      <Prose>{t.costDesc}</Prose>
      <InfoBox variant="warning">
        {isKo
          ? '선택도가 낮은 컬럼(결과 행 수가 전체의 10~20% 이상)에 인덱스를 쓰면 ROWID(행 식별자)마다 위 8단계가 반복돼요. Full Table Scan의 멀티블록 순차 읽기보다 훨씬 느려질 수 있어요.'
          : 'Using an index on a low-selectivity column (returning 10–20%+ of rows) repeats all 8 steps per ROWID. This can be far slower than a sequential multi-block Full Table Scan.'}
      </InfoBox>

      <Divider />

      <SectionTitle>{t.coveringTitle}</SectionTitle>
      <Prose>{t.coveringDesc}</Prose>
      <div className="mt-3 rounded-xl border bg-slate-900 px-4 py-3">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">SQL</p>
        <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-100">{t.coveringSql}</pre>
      </div>
    </PageContainer>
  )
}
