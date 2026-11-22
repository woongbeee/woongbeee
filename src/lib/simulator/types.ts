// ─── Internals Simulator types ────────────────────────────────────────────
// 엔진(engine.ts)은 SQL 한 문장을 받아 "단계(SimStep) 목록"을 만든다.
// 각 단계는 그 시점의 인스턴스 상태 스냅숏을 들고 있어서, 화면은 어느 단계로든
// 자유롭게 앞뒤로 이동할 수 있다.

import type { L, OptimizerResult } from '@/lib/optimizer/types'

type BufferState = 'free' | 'clean' | 'dirty'
type BlockKind = 'table' | 'index' | 'undo'

export interface BlockRef {
  key: string        // 고유 키: 'EMPLOYEES#3' · 'EMP_PK#R'
  object: string     // 세그먼트 이름
  abbr: string       // 버퍼 칸에 적을 짧은 이름
  sub: string        // 블록 번호 표시: '3' · 'R' · 'L1'
  kind: BlockKind
}

export interface Buffer {
  slot: number
  block: BlockRef | null
  state: BufferState
  touch: number         // Touch Count — 자주 쓰일수록 LRU 의 뜨거운 쪽에 남는다
  lastUsed: number
  uncommitted: boolean  // 아직 커밋되지 않은 변경이 들어 있음
}

export interface CursorEntry {
  sqlId: string
  hashValue: number
  text: string
  planHash: number
  executions: number
  parseCalls: number
  lastUsed: number
}

interface Transaction {
  xid: string
  startScn: number
  undoRecords: number
  rowLocks: number
  tables: string[]
}

/** Online Redo Log Group. LGWR 는 한 번에 한 그룹(CURRENT)에만 쓴다 */
export interface RedoLogGroup {
  group: number
  sequence: number   // Log Sequence Number — 0 이면 아직 쓴 적 없음
  status: 'UNUSED' | 'CURRENT' | 'ACTIVE' | 'INACTIVE'
}

export interface SessionStats {
  parseCalls: number
  hardParses: number
  softParses: number
  executions: number
  consistentGets: number
  dbBlockGets: number
  physicalReads: number
  physicalWrites: number
  redoSize: number
  sorts: number
}

/** PX 서버(P000 …) 하나. set 0 = 풀에서 쉬는 중, 1·2 = 지금 이 문장의 생산자/소비자 집합 */
export interface PxServer {
  name: string
  set: 0 | 1 | 2
  job: string | null      // 지금 하는 일 ('blocks 1–3' · 'HASH GROUP BY' …)
}

export interface InstanceState {
  tick: number
  scn: number
  checkpointScn: number
  buffers: Buffer[]
  cursors: CursorEntry[]
  dictCache: string[]
  redoBuffer: { bytes: number; entries: number }   // 아직 디스크에 안 쓴 Redo
  redoLog: { current: number; bytes: number; groups: RedoLogGroup[] }   // current = groups 의 index, bytes = CURRENT 그룹에 쓴 양
  archivedLogs: number
  txn: Transaction | null
  pga: { cursor: string | null; binds: string[]; workArea: string | null; phase: string | null }
  /** 병렬 실행 서버 풀 (PARALLEL_MAX_SERVERS 개). 문장이 끝나면 모두 풀로 돌아간다 */
  px: PxServer[]
  stats: SessionStats
}

/** 공식 문서의 "Stages of SQL Processing" */
export type StageId = 'syntax' | 'semantic' | 'shared-pool' | 'optimize' | 'row-source' | 'execute' | 'fetch'
export type StepStage = StageId | 'call' | 'maintenance'
export type StepResult = 'info' | 'ok' | 'hit' | 'miss' | 'error'

export type DocKey =
  | 'sql-processing' | 'memory' | 'process' | 'transactions' | 'consistency' | 'storage'
  | 'optimizer' | 'transformations' | 'access-paths' | 'joins' | 'cursor-sharing'
  | 'partitioning' | 'parallel'

export interface SimStep {
  key: string
  stage: StepStage
  title: L
  body: L
  facts: L[]
  result: StepResult
  active: string[]              // 다이어그램에서 불이 켜질 컴포넌트 id
  flows: [string, string][]     // 데이터가 흐른 방향 (from → to)
  touched: number[]             // 이번 단계에서 건드린 버퍼 slot
  planNodeId?: number           // 실행 중인 Row Source
  optLevel: 0 | 1 | 2 | 3       // Optimizer 패널 공개 범위 (1=Transformer, 2=Estimator, 3=전체)
  doc: DocKey
  state: InstanceState
}

export type InstanceCommand = 'checkpoint' | 'flush-buffer-cache' | 'flush-shared-pool'

export interface Trace {
  sql: string
  kind: 'statement' | 'command'
  steps: SimStep[]
  optimizer: OptimizerResult | null
  parseType: 'hard' | 'soft' | null
  skipped: StageId[]            // Soft Parse 라서 건너뛴 단계
  notApplicable: StageId[]      // 이 문장 종류에는 없는 단계
  outcome: L
  error: boolean
  delta: SessionStats           // 이 문장이 만든 통계 변화
}
