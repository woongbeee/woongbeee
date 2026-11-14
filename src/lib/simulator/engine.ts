// ─── Internals Simulator engine ───────────────────────────────────────────
// SQL 한 문장(또는 인스턴스 명령)을 받아, Oracle 이 처리하는 순서대로 단계 목록을 만든다.
// 순서와 용어는 Oracle Database Concepts / SQL Tuning Guide 를 따른다:
//
//   Parse Call ─ Syntax Check → Semantic Check → Shared Pool Check
//     ├─ Library Cache Hit  → Soft Parse  → (Optimization · Row Source Generation 생략)
//     └─ Library Cache Miss → Hard Parse  → Optimization → Row Source Generation
//   Execute ─ Row Source Tree 를 잎부터 실행 (Buffer Cache · PGA Work Area · Redo · Undo)
//   Fetch   ─ 질의일 때만
//
// 순수 함수: (이전 상태, 입력) → Trace. 상태는 store 가 들고 있다.

import { optimize, parseSQL } from '@/lib/optimizer'
import type { L, OptimizerResult, PlanNode } from '@/lib/optimizer/types'
import { getSchemaOf, getTableRows, getTableStats } from '@/lib/optimizer/stats'
import { accessBlocks, actualRowCount, dmlBlocks, keyRows, matchRows, undoBlock } from './execution'
import type { RowMatch } from './execution'
import type {
  BlockRef, CursorEntry, DocKey, InstanceCommand, InstanceState, SessionStats, SimStep, StageId, StepResult, StepStage, Trace,
} from './types'

const BUFFER_COUNT = 24
const CURSOR_MAX = 6
export const REDO_BUFFER_BYTES = 4096
/** Online Redo Log Group 하나의 크기. 다 차면 Log Switch 가 일어난다 (실제로는 수백 MB — 여기서는 금방 차도록 작게 잡았다) */
export const REDO_LOG_BYTES = 6000
const REDO_LOG_GROUPS = 3
const ARRAY_SIZE = 15
const UNDO_RECORDS_PER_BLOCK = 8

const DOC_BASE = 'https://docs.oracle.com/en/database/oracle/oracle-database/19'
export const DOCS: Record<DocKey, { label: string; url: string }> = {
  'sql-processing': { label: 'SQL Tuning Guide — SQL Processing', url: `${DOC_BASE}/tgsql/sql-processing.html` },
  memory: { label: 'Concepts — Memory Architecture', url: `${DOC_BASE}/cncpt/memory-architecture.html` },
  process: { label: 'Concepts — Process Architecture', url: `${DOC_BASE}/cncpt/process-architecture.html` },
  transactions: { label: 'Concepts — Transactions', url: `${DOC_BASE}/cncpt/transactions.html` },
  consistency: { label: 'Concepts — Data Concurrency and Consistency', url: `${DOC_BASE}/cncpt/data-concurrency-and-consistency.html` },
  storage: { label: 'Concepts — Physical Storage Structures', url: `${DOC_BASE}/cncpt/physical-storage-structures.html` },
  optimizer: { label: 'SQL Tuning Guide — Query Optimizer Concepts', url: `${DOC_BASE}/tgsql/query-optimizer-concepts.html` },
  transformations: { label: 'SQL Tuning Guide — Query Transformations', url: `${DOC_BASE}/tgsql/query-transformations.html` },
  'access-paths': { label: 'SQL Tuning Guide — Optimizer Access Paths', url: `${DOC_BASE}/tgsql/optimizer-access-paths.html` },
  joins: { label: 'SQL Tuning Guide — Joins', url: `${DOC_BASE}/tgsql/joins.html` },
  'cursor-sharing': { label: 'SQL Tuning Guide — Cursor Sharing', url: `${DOC_BASE}/tgsql/improving-rwp-cursor-sharing.html` },
}

const t = (ko: string, en: string): L => ({ ko, en })
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T
const blockName = (b: BlockRef) => `${b.abbr}${b.kind === 'index' ? ' idx' : ''}·${b.sub}`

const ZERO_STATS: SessionStats = {
  parseCalls: 0, hardParses: 0, softParses: 0, executions: 0, consistentGets: 0,
  dbBlockGets: 0, physicalReads: 0, physicalWrites: 0, redoSize: 0, sorts: 0,
}

/** 막 STARTUP 한 인스턴스 — 캐시는 전부 비어 있다 */
export function createInstance(): InstanceState {
  return {
    tick: 0,
    scn: 2_415_000,
    checkpointScn: 2_415_000,
    buffers: Array.from({ length: BUFFER_COUNT }, (_, slot) => ({ slot, block: null, state: 'free', touch: 0, lastUsed: 0, uncommitted: false })),
    cursors: [],
    dictCache: [],
    redoBuffer: { bytes: 0, entries: 0 },
    redoLog: {
      current: 0,
      bytes: 0,
      groups: Array.from({ length: REDO_LOG_GROUPS }, (_, i) => ({ group: i + 1, sequence: i === 0 ? 1 : 0, status: i === 0 ? ('CURRENT' as const) : ('UNUSED' as const) })),
    },
    archivedLogs: 0,
    txn: null,
    pga: { cursor: null, binds: [], workArea: null, phase: null },
    stats: { ...ZERO_STATS },
  }
}

// ── SQL ID ────────────────────────────────────────────────────────────────
// 실제 Oracle 은 문장 텍스트의 MD5 로 SQL_ID(13자)와 HASH_VALUE 를 만든다.
// 여기서는 FNV 해시로 흉내만 낸다 — "글자가 하나라도 다르면 다른 ID" 라는 성질은 같다.

function fnv(text: string, seed: number): number {
  let h = seed
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

const SQL_ID_ALPHABET = '0123456789abcdfghjkmnpqrstuvwxyz'

function sqlIdentity(text: string): { sqlId: string; hashValue: number } {
  const a = fnv(text, 2166136261)
  const b = fnv(text, 0x9747b28c)
  let sqlId = ''
  for (let i = 0; i < 13; i++) sqlId += SQL_ID_ALPHABET[((i < 6 ? a >>> (i * 5) : b >>> ((i - 6) * 5)) & 31)]
  return { sqlId, hashValue: b }
}

// ── Run: 단계를 쌓아 가는 작업 공간 ───────────────────────────────────────

interface GetResult {
  slots: number[]
  hits: number
  reads: number
  evicted: string[]
  dbwWrites: number
  lgwrBytes: number
}

interface StepInput {
  key: string
  stage: StepStage
  title: L
  body: L
  facts?: (L | null | false | undefined | '')[]
  result?: StepResult
  active: string[]
  flows?: [string, string][]
  touched?: number[]
  planNodeId?: number
  doc: DocKey
}

class Run {
  s: InstanceState
  steps: SimStep[] = []
  switchPending = false
  optLevel: 0 | 1 | 2 | 3 = 0
  before: SessionStats

  constructor(state: InstanceState) {
    this.s = clone(state)
    this.s.pga = { cursor: null, binds: [], workArea: null, phase: null }
    this.before = { ...this.s.stats }
  }

  step(p: StepInput) {
    this.s.tick++
    this.steps.push({
      key: `${p.key}-${this.steps.length}`,
      stage: p.stage,
      title: p.title,
      body: p.body,
      facts: (p.facts ?? []).filter((f): f is L => Boolean(f)),
      result: p.result ?? 'info',
      active: p.active,
      flows: p.flows ?? [],
      touched: p.touched ?? [],
      planNodeId: p.planNodeId,
      optLevel: this.optLevel,
      doc: p.doc,
      state: clone(this.s),
    })
  }

  /** LGWR: Redo Log Buffer → Online Redo Log. 쓴 바이트 수를 돌려준다 */
  lgwrFlush(): number {
    const bytes = this.s.redoBuffer.bytes
    this.s.redoLog.bytes += bytes
    this.s.redoBuffer = { bytes: 0, entries: 0 }
    if (this.s.redoLog.bytes >= REDO_LOG_BYTES) this.switchPending = true
    return bytes
  }

  /** DBW: Dirty 버퍼를 Data File 에 쓰고 Clean 으로 바꾼다 */
  dbwWrite(slots: number[]) {
    for (const slot of slots) this.s.buffers[slot].state = 'clean'
    this.s.stats.physicalWrites += slots.length
  }

  /**
   * Buffer Get. 블록이 캐시에 있으면 Logical Read 로 끝나고(hit),
   * 없으면 Server Process 가 Data File 에서 읽어 온다(Physical Read).
   *   mode 'cr' = Consistent Get (질의), 'cu' = Current Mode Get / DB Block Get (변경)
   */
  get(blocks: BlockRef[], mode: 'cr' | 'cu', opts: { dirty?: boolean; fresh?: boolean } = {}): GetResult {
    const s = this.s
    const res: GetResult = { slots: [], hits: 0, reads: 0, evicted: [], dbwWrites: 0, lgwrBytes: 0 }
    const coldest = (state: 'clean' | 'dirty') =>
      s.buffers
        .filter((b) => b.state === state && !res.slots.includes(b.slot))
        .sort((x, y) => x.touch - y.touch || x.lastUsed - y.lastUsed)
    for (const block of blocks) {
      s.tick++
      let buf = s.buffers.find((b) => b.block?.key === block.key)
      if (buf) {
        res.hits++
      } else {
        buf = s.buffers.find((b) => b.state === 'free')
        if (!buf) {
          buf = coldest('clean')[0]
          if (!buf) {
            // Clean 버퍼가 없다 → DBW 가 차가운 Dirty 버퍼를 먼저 써야 한다 (그 전에 LGWR 가 Redo 를 쓴다)
            res.lgwrBytes += this.lgwrFlush()
            const victims = coldest('dirty').slice(0, 6).map((b) => b.slot)
            this.dbwWrite(victims)
            res.dbwWrites += victims.length
            buf = coldest('clean')[0]
          }
          if (!buf) continue
          if (buf.block) res.evicted.push(blockName(buf.block))
        }
        buf.block = block
        buf.state = 'clean'
        buf.touch = 0
        buf.uncommitted = false
        if (!opts.fresh) {
          res.reads++
          s.stats.physicalReads++
        }
      }
      buf.touch++
      buf.lastUsed = s.tick
      if (opts.dirty) {
        buf.state = 'dirty'
        buf.uncommitted = true
      }
      if (mode === 'cr') s.stats.consistentGets++
      else s.stats.dbBlockGets++
      res.slots.push(buf.slot)
    }
    return res
  }

  finish(sql: string, kind: Trace['kind'], extra: Partial<Trace> & { outcome: L }): Trace {
    // CURRENT Redo Log Group 이 다 찼으면, 문장 처리가 끝난 뒤 Log Switch 가 이어진다
    if (this.switchPending) {
      this.switchPending = false
      logSwitch(this)
    }
    const after = this.s.stats
    const delta = Object.fromEntries(
      (Object.keys(ZERO_STATS) as (keyof SessionStats)[]).map((k) => [k, after[k] - this.before[k]]),
    ) as unknown as SessionStats
    return {
      sql, kind, steps: this.steps, optimizer: null, parseType: null, skipped: [], notApplicable: [],
      error: false, delta, ...extra,
    }
  }
}

function bufferFacts(res: GetResult, mode: 'cr' | 'cu', multiblock: boolean): L[] {
  const total = res.slots.length
  const facts: L[] = [
    t(
      `Buffer Cache 에서 블록 ${total}개를 찾았어요 → 이미 있던 것(Cache Hit) ${res.hits}개, 없던 것(Cache Miss) ${res.reads}개. ${mode === 'cr' ? 'Consistent Get' : 'DB Block Get(Current Mode)'} +${total}`,
      `Looked up ${total} blocks in the buffer cache → ${res.hits} cache hits, ${res.reads} cache misses. ${mode === 'cr' ? 'Consistent gets' : 'DB block gets (current mode)'} +${total}`,
    ),
  ]
  if (res.reads > 0) {
    facts.push(
      multiblock
        ? t(
            `Physical Read ${res.reads}블록: Server Process 가 Data File 에서 직접 읽어 Buffer Cache 에 올려요. Full Scan 이라 이웃한 블록을 한꺼번에 읽는 Multiblock Read 를 써요.`,
            `Physical read of ${res.reads} blocks: the server process itself reads them from the data file into the buffer cache. A full scan uses multiblock reads to grab adjacent blocks together.`,
          )
        : t(
            `Physical Read ${res.reads}블록: Server Process 가 Data File 에서 한 블록씩(Single-block Read) 읽어 Buffer Cache 에 올려요. 읽는 일은 DBW 가 아니라 Server Process 몫이에요.`,
            `Physical read of ${res.reads} blocks: the server process reads them one at a time (single-block reads) into the buffer cache. Reading is the server process's job, not DBW's.`,
          ),
    )
  } else if (total > 0) {
    facts.push(t('디스크를 한 번도 건드리지 않았어요. 메모리에서만 끝난 Logical Read 예요.', 'No disk access at all — pure logical reads from memory.'))
  }
  if (res.evicted.length > 0) {
    facts.push(
      t(
        `빈 버퍼가 없어서 LRU 목록의 차가운 쪽(Touch Count 가 낮은) Clean 버퍼를 내보내고 그 자리를 썼어요: ${res.evicted.join(', ')}`,
        `No unused buffer was left, so clean buffers at the cold end of the LRU list (lowest touch count) were reused: ${res.evicted.join(', ')}`,
      ),
    )
  }
  if (res.dbwWrites > 0) {
    facts.push(
      t(
        `Clean 버퍼가 하나도 없었어요! DBW 가 차가운 Dirty 버퍼 ${res.dbwWrites}개를 Data File 에 쓰고 나서야 자리가 났어요. DBW 가 쓰기 전에 LGWR 가 그 변경의 Redo 를 먼저 기록했어요(Write-Ahead).`,
        `There was no clean buffer at all! DBW had to write ${res.dbwWrites} cold dirty buffers to the data files to make room — after LGWR first wrote their redo (write-ahead protocol).`,
      ),
    )
  }
  return facts
}

function bufferActive(res: GetResult): { active: string[]; flows: [string, string][] } {
  const active = ['server-process', 'buffer-cache']
  const flows: [string, string][] = [['server-process', 'buffer-cache']]
  if (res.reads > 0) { active.push('df-users'); flows.push(['df-users', 'buffer-cache']) }
  if (res.dbwWrites > 0) { active.push('dbw', 'lgwr', 'redo-logs'); flows.push(['buffer-cache', 'df-users']) }
  return { active, flows }
}

// ── Statement ─────────────────────────────────────────────────────────────

const normalizeText = (sql: string) => sql.replace(/\s+/g, ' ').trim().toUpperCase()
const maskLiterals = (sql: string) => normalizeText(sql).replace(/'[^']*'/g, '?').replace(/\b\d+(\.\d+)?\b/g, '?').replace(/:\w+/g, '?')

export function runStatement(state: InstanceState, input: string): Trace {
  const sql = input.trim().replace(/;+\s*$/, '')
  const run = new Run(state)
  const s = run.s
  const outcome = parseSQL(sql)

  // ── ① Parse Call ──
  s.stats.parseCalls++
  s.pga.cursor = sql
  s.pga.phase = 'PARSE'
  run.step({
    key: 'call', stage: 'call', doc: 'process',
    title: t('Client → Server Process: Parse Call', 'Client → Server Process: parse call'),
    body: t(
      '클라이언트 프로세스가 Oracle Net 으로 SQL 문을 보내면, 이 세션을 맡은 전용 Server Process 가 받아요. Server Process 는 자기만의 메모리인 PGA 안에 Private SQL Area 를 만들고(= 커서를 열고) Parse Call 을 시작해요.',
      'The client process sends the SQL statement over Oracle Net to the dedicated server process serving this session. The server process allocates a private SQL area in its own PGA (opens a cursor) and issues a parse call.',
    ),
    facts: [
      t('커서(Cursor)는 PGA 에 있는 Private SQL Area 를 가리키는 이름표예요.', 'A cursor is a name for a private SQL area in the PGA.'),
      t('SQL 을 파싱하고 실행하고 결과를 돌려주는 일은 모두 Server Process 가 해요. 백그라운드 프로세스가 대신 해 주지 않아요.', 'Parsing, running the SQL and returning results are all done by the server process — background processes do not do it for you.'),
    ],
    active: ['client', 'server-process', 'pga-private'],
    flows: [['client', 'server-process']],
  })

  // ── ② Syntax Check ──
  if (!outcome.ok && outcome.error.stage === 'syntax') {
    const unsupported = outcome.error.code === 'SIM-UNSUPPORTED'
    run.step({
      key: 'syntax', stage: 'syntax', doc: 'sql-processing', result: 'error',
      title: unsupported ? t('시뮬레이터가 다루지 않는 문장', 'Statement not modelled by the simulator') : t('Syntax Check 실패', 'Syntax check failed'),
      body: outcome.error.message,
      facts: unsupported
        ? []
        : [
            t('문법이 틀린 문장은 여기서 바로 끝나요. Shared Pool 을 찾아보지도, 블록을 읽지도 않아요.', 'A statement that breaks the grammar stops right here — the shared pool is never searched and no block is read.'),
          ],
      active: ['server-process', 'client'],
      flows: [['server-process', 'client']],
    })
    s.pga = { cursor: null, binds: [], workArea: null, phase: null }
    return run.finish(sql, 'statement', { outcome: outcome.error.message, error: true })
  }
  const stmtType = outcome.ok ? outcome.query.type : outcome.statementType ?? 'SELECT'
  const tokenCount = outcome.ok ? outcome.query.tokenCount : outcome.tokenCount
  run.step({
    key: 'syntax', stage: 'syntax', doc: 'sql-processing', result: 'ok',
    title: t('Syntax Check 통과', 'Syntax check passed'),
    body: t(
      `문장을 토큰 ${tokenCount}개로 쪼개서 Oracle SQL 문법에 맞는지 확인했어요. ${stmtType} 문으로 읽혀요. 아직은 "글자 모양"만 본 것이라, 테이블이 정말 있는지는 몰라요.`,
      `The statement was split into ${tokenCount} tokens and checked against the SQL grammar. It reads as a ${stmtType} statement. Only the shape of the text was checked — whether the table really exists is still unknown.`,
    ),
    facts: [
      t('예: FROM 을 FORM 으로 잘못 쓰면 이 단계에서 ORA-00923 이 나요.', 'Example: typing FORM instead of FROM fails here with ORA-00923.'),
    ],
    active: ['server-process', 'pga-private'],
  })

  // ── COMMIT / ROLLBACK ──
  if (outcome.ok && (outcome.query.type === 'COMMIT' || outcome.query.type === 'ROLLBACK')) {
    return outcome.query.type === 'COMMIT' ? runCommit(run, sql) : runRollback(run, sql)
  }

  // ── ③ Semantic Check ──
  if (!outcome.ok) {
    run.step({
      key: 'semantic', stage: 'semantic', doc: 'sql-processing', result: 'error',
      title: t('Semantic Check 실패', 'Semantic check failed'),
      body: outcome.error.message,
      facts: [
        t(
          '문법은 맞지만 뜻이 통하지 않는 문장이에요. Data Dictionary 에서 그런 테이블이나 컬럼을 찾지 못했어요.',
          'The grammar is fine but the statement is not meaningful: the data dictionary has no such table or column.',
        ),
      ],
      active: ['server-process', 'dict-cache', 'client'],
      flows: [['server-process', 'dict-cache'], ['server-process', 'client']],
    })
    s.pga = { cursor: null, binds: [], workArea: null, phase: null }
    return run.finish(sql, 'statement', { outcome: outcome.error.message, error: true })
  }

  const query = outcome.query
  const objects = [...new Set(query.tables.map((r) => `${getSchemaOf(r.name)}.${r.name}`))]
  const dictMisses = objects.filter((o) => !s.dictCache.includes(o))
  s.dictCache.push(...dictMisses)
  run.step({
    key: 'semantic', stage: 'semantic', doc: 'sql-processing',
    result: dictMisses.length > 0 ? 'miss' : 'hit',
    title: t('Semantic Check 통과', 'Semantic check passed'),
    body: t(
      '문장에 나온 테이블과 컬럼이 실제로 있는지, 볼 권한이 있는지 Data Dictionary 로 확인했어요. Dictionary 정보는 Shared Pool 안의 Data Dictionary Cache(Row Cache)에서 먼저 찾아요.',
      'The tables and columns named in the statement were verified against the data dictionary, along with the privileges to use them. Dictionary data is looked up first in the data dictionary cache (row cache) inside the shared pool.',
    ),
    facts: [
      ...objects.map((o) =>
        dictMisses.includes(o)
          ? t(
              `${o}: Dictionary Cache 에 없어요 → Recursive SQL 로 SYSTEM Tablespace 의 Dictionary 테이블을 읽어 캐시에 올렸어요.`,
              `${o}: not in the dictionary cache → recursive SQL read the dictionary tables in the SYSTEM tablespace and cached the definition.`,
            )
          : t(`${o}: Dictionary Cache 에 이미 있어요 (hit).`, `${o}: already in the dictionary cache (hit).`),
      ),
      t('예: 없는 테이블이면 ORA-00942, 없는 컬럼이면 ORA-00904 가 이 단계에서 나요.', 'Example: a missing table raises ORA-00942 and a missing column ORA-00904 at this step.'),
    ],
    active: ['server-process', 'dict-cache', ...(dictMisses.length > 0 ? ['df-system'] : [])],
    flows: [['server-process', 'dict-cache'], ...(dictMisses.length > 0 ? ([['df-system', 'dict-cache']] as [string, string][]) : [])],
  })

  // ── ④ Shared Pool Check ──
  const { sqlId, hashValue } = sqlIdentity(sql)
  const cached = s.cursors.find((c) => c.sqlId === sqlId)
  const optimizer = optimize(query)
  const idFact = t(
    `SQL_ID = ${sqlId} (HASH_VALUE ${hashValue}) — 문장 글자를 그대로 해시한 값이에요. 대소문자·공백·리터럴 값이 하나만 달라도 완전히 다른 ID 가 나와요.`,
    `SQL_ID = ${sqlId} (HASH_VALUE ${hashValue}) — a hash of the exact statement text. One different letter case, space or literal value produces a completely different ID.`,
  )

  if (cached) {
    cached.parseCalls++
    cached.lastUsed = s.tick
    s.stats.softParses++
    run.optLevel = 3
    run.step({
      key: 'shared-pool', stage: 'shared-pool', doc: 'sql-processing', result: 'hit',
      title: t('Shared Pool Check — Library Cache Hit (Soft Parse)', 'Shared pool check — library cache hit (soft parse)'),
      body: t(
        'Library Cache 의 Shared SQL Area 에 같은 SQL ID 의 커서가 이미 있어요. 저장된 실행 계획을 그대로 다시 쓰면 되니까 Optimization 과 Row Source Generation 을 통째로 건너뛰고 곧장 실행으로 가요. 이것이 Soft Parse 예요.',
        'The shared SQL area in the library cache already holds a cursor with this SQL ID. Its stored execution plan is reused as is, so optimization and row source generation are skipped entirely and processing goes straight to execution. This is a soft parse.',
      ),
      facts: [
        idFact,
        t(
          `저장된 계획: Plan Hash Value ${cached.planHash}, 지금까지 ${cached.executions}번 실행됐어요.`,
          `Stored plan: plan hash value ${cached.planHash}, executed ${cached.executions} times so far.`,
        ),
        t(
          '해시만 같다고 끝이 아니에요. 가리키는 객체가 같은지(Semantic)와 옵티마이저 설정 같은 실행 환경이 같은지(Environment)도 확인한 뒤에 공유해요.',
          'A matching hash is not enough: the database also verifies that the statement refers to the same objects (semantic check) and that the environment, such as optimizer settings, is the same before sharing.',
        ),
      ],
      active: ['server-process', 'library-cache'],
      flows: [['server-process', 'library-cache'], ['library-cache', 'server-process']],
    })
  } else {
    s.stats.hardParses++
    const twin = s.cursors.find((c) => normalizeText(c.text) === normalizeText(sql))
    const cousin = twin ? undefined : s.cursors.find((c) => maskLiterals(c.text) === maskLiterals(sql))
    run.step({
      key: 'shared-pool', stage: 'shared-pool', doc: 'cursor-sharing', result: 'miss',
      title: t('Shared Pool Check — Library Cache Miss (Hard Parse)', 'Shared pool check — library cache miss (hard parse)'),
      body: t(
        'Library Cache 를 찾아봤지만 같은 SQL ID 의 커서가 없어요. 처음 보는 문장이라 실행 계획을 새로 만들어야 해요. 이것이 Hard Parse 예요.',
        'The library cache was searched but holds no cursor with this SQL ID. The statement is new, so an execution plan must be built from scratch. This is a hard parse.',
      ),
      facts: [
        idFact,
        twin && t(
          `글자만 다른 쌍둥이 문장이 캐시에 있어요: "${twin.text}". 뜻은 같지만 대소문자나 공백이 달라서 공유하지 못했어요. SQL 은 늘 같은 모양으로 쓰는 게 좋아요.`,
          `A twin statement is cached: "${twin.text}". It means the same but differs in letter case or whitespace, so it could not be shared. Write SQL in one consistent form.`,
        ),
        cousin && t(
          `리터럴 값만 다른 문장이 캐시에 있어요: "${cousin.text}". 값 자리에 바인드 변수(:id)를 쓰면 문장 글자가 같아져서 커서 하나를 함께 쓸 수 있어요.`,
          `A statement differing only in literal values is cached: "${cousin.text}". With a bind variable (:id) in place of the value the text would be identical and one cursor could be shared.`,
        ),
        t(
          'Hard Parse 동안에는 Library Cache 와 Data Dictionary Cache 를 여러 번 드나들고, 그때마다 Latch 를 잡아요. Hard Parse 가 몰리면 Latch 경합 때문에 동시에 일할 수 있는 양이 줄어요.',
          'During a hard parse the database accesses the library cache and data dictionary cache numerous times, taking a latch each time. Many hard parses mean latch contention and lower concurrency.',
        ),
      ],
      active: ['server-process', 'library-cache'],
      flows: [['server-process', 'library-cache']],
    })

    // ── ⑤ Optimization (Hard Parse 에서만) ──
    runOptimization(run, optimizer)

    // ── ⑥ Row Source Generation ──
    const entry: CursorEntry = { sqlId, hashValue, text: sql, planHash: optimizer.planHash, executions: 0, parseCalls: 1, lastUsed: s.tick }
    s.cursors.unshift(entry)
    let aged: CursorEntry | undefined
    if (s.cursors.length > CURSOR_MAX) {
      aged = [...s.cursors].sort((a, b) => a.lastUsed - b.lastUsed)[0]
      s.cursors = s.cursors.filter((c) => c !== aged)
    }
    run.step({
      key: 'row-source', stage: 'row-source', doc: 'sql-processing', result: 'ok',
      title: t('Row Source Generation', 'Row source generation'),
      body: t(
        'Row Source Generator 가 옵티마이저가 고른 계획을 받아, 실제로 돌릴 수 있는 반복 실행 계획(Row Source Tree)으로 바꿔요. 트리의 한 줄 한 줄이 Row Source — 행을 만들어 위쪽으로 넘겨주는 작은 실행 단위예요. 완성된 커서는 Library Cache 의 Shared SQL Area 에 저장해서 다른 세션도 함께 쓸 수 있게 해요.',
        'The row source generator takes the plan chosen by the optimizer and produces an iterative execution plan (the row source tree) that the rest of the database can run. Each line of the tree is a row source — a small unit that produces rows and hands them upward. The finished cursor is stored in the shared SQL area of the library cache so other sessions can share it.',
      ),
      facts: [
        t(
          `Row Source ${optimizer.planNodes.length}개로 된 트리 · Plan Hash Value ${optimizer.planHash}. 오른쪽 "Optimizer" 탭의 Execution Plan 이 바로 이 트리예요.`,
          `A tree of ${optimizer.planNodes.length} row sources · plan hash value ${optimizer.planHash}. The Execution Plan in the "Optimizer" tab on the right is this tree.`,
        ),
        t(
          '트리에는 테이블을 읽는 순서, 테이블마다의 Access Path, 조인 방법, 필터·정렬·집계 같은 연산이 담겨 있어요.',
          'The tree records the order of the tables, an access method for each table, the join methods, and operations such as filter, sort and aggregation.',
        ),
        t(
          'Library Cache 에는 두 가지가 생겨요. 문장 글자를 담은 Parent Cursor 와, 실행 계획과 실행 환경을 담은 Child Cursor 예요. 글자가 같아도 환경이 다르면(예: 옵티마이저 설정) Child Cursor 가 하나 더 만들어져요.',
          'Two things are created in the library cache: a parent cursor holding the statement text, and a child cursor holding the execution plan and its environment. Identical text under a different environment (optimizer settings, for example) gets an additional child cursor.',
        ),
        aged && t(
          `Shared Pool 에 자리가 모자라서 가장 오래 안 쓴 커서를 내보냈어요(Age Out): "${aged.text}". 그 문장은 다음에 다시 Hard Parse 해야 해요.`,
          `The shared pool was short of space, so the least recently used cursor was aged out: "${aged.text}". That statement will need a hard parse next time.`,
        ),
      ],
      active: ['server-process', 'library-cache'],
      flows: [['server-process', 'library-cache']],
    })
  }

  // ── ⑦ Execution ──
  const rowsAffected = runExecution(run, optimizer)
  const cursor = s.cursors.find((c) => c.sqlId === sqlId)
  if (cursor) cursor.executions++

  const n = rowsAffected
  const isSelect = query.type === 'SELECT'
  const doneText: L =
    query.type === 'SELECT'
      ? n === 0 ? t('선택된 레코드가 없습니다.', 'no rows selected') : t(`${n}개 행이 선택되었습니다.`, `${n} row${n === 1 ? '' : 's'} selected.`)
      : query.type === 'INSERT' ? t('1 개의 행이 만들어졌습니다.', '1 row created.')
      : query.type === 'UPDATE' ? t(`${n} 행이 업데이트되었습니다.`, `${n} row${n === 1 ? '' : 's'} updated.`)
      : t(`${n} 행이 삭제되었습니다.`, `${n} row${n === 1 ? '' : 's'} deleted.`)

  // ── ⑧ Fetch (질의만) ──
  s.pga.workArea = null
  if (isSelect) {
    const calls = Math.max(1, Math.ceil((n + 1) / ARRAY_SIZE))
    s.pga.phase = 'FETCH'
    run.step({
      key: 'fetch', stage: 'fetch', doc: 'sql-processing', result: 'ok',
      title: t(`Fetch — ${n}행을 클라이언트로`, `Fetch — ${n} row${n === 1 ? '' : 's'} to the client`),
      body: t(
        '실행이 끝났다고 결과가 한 번에 날아가는 건 아니에요. 클라이언트가 Fetch Call 을 보낼 때마다 Server Process 가 결과 행을 한 묶음씩 돌려줘요. 어디까지 보냈는지는 Private SQL Area 의 Run-Time Area 가 기억해요.',
        'Finishing execution does not ship the result all at once. Each time the client issues a fetch call, the server process returns one batch of rows. The run-time area of the private SQL area remembers how far it has got.',
      ),
      facts: [
        t(
          `한 번에 ${ARRAY_SIZE}행씩(SQL*Plus 기본 ARRAYSIZE) 가져가면 Fetch Call 은 약 ${calls}번이에요. 묶음이 클수록 네트워크 왕복이 줄어요.`,
          `At ${ARRAY_SIZE} rows per call (the SQL*Plus default ARRAYSIZE) that is about ${calls} fetch call${calls === 1 ? '' : 's'}. Larger batches mean fewer network round trips.`,
        ),
        t('질의(SELECT)만 Fetch 단계가 있어요. DML 은 실행이 끝나면 처리된 행 수만 돌려줘요.', 'Only queries have a fetch stage. DML just returns the number of rows processed once execution ends.'),
      ],
      active: ['server-process', 'pga-private', 'client'],
      flows: [['server-process', 'client']],
    })
  }

  s.pga = { cursor: null, binds: [], workArea: null, phase: null }
  return run.finish(sql, 'statement', {
    optimizer,
    parseType: cached ? 'soft' : 'hard',
    skipped: cached ? ['optimize', 'row-source'] : [],
    notApplicable: isSelect ? [] : ['fetch'],
    outcome: !isSelect && s.txn
      ? t(`${doneText.ko} (트랜잭션 진행 중 — COMMIT 또는 ROLLBACK 을 실행해 보세요)`, `${doneText.en} (transaction open — try COMMIT or ROLLBACK)`)
      : doneText,
  })
}

// ── Optimization ──────────────────────────────────────────────────────────

const ACCESS_NAME: Record<string, string> = {
  FULL_TABLE_SCAN: 'TABLE ACCESS FULL',
  INDEX_UNIQUE_SCAN: 'INDEX UNIQUE SCAN',
  INDEX_RANGE_SCAN: 'INDEX RANGE SCAN',
  INDEX_FAST_FULL_SCAN: 'INDEX FAST FULL SCAN',
}

function runOptimization(run: Run, opt: OptimizerResult) {
  const active = ['server-process', 'library-cache', 'dict-cache']
  run.optLevel = 1
  run.step({
    key: 'transform', stage: 'optimize', doc: 'transformations',
    title: t('Optimization ① Query Transformer', 'Optimization ① Query transformer'),
    body: t(
      '옵티마이저의 첫 일꾼인 Query Transformer 가 문장을 살펴보고, 결과는 똑같지만 더 싸게 실행할 수 있는 모양으로 고쳐 쓸 수 있는지 따져 봐요.',
      'The first optimizer component, the query transformer, checks whether the statement can be rewritten into a semantically equivalent form that is cheaper to run.',
    ),
    facts: opt.transformations,
    active,
  })

  run.optLevel = 2
  run.step({
    key: 'estimate', stage: 'optimize', doc: 'optimizer',
    title: t('Optimization ② Estimator', 'Optimization ② Estimator'),
    body: t(
      'Estimator 가 Data Dictionary 에 저장된 옵티마이저 통계(행 수·블록 수·NDV·최솟값/최댓값)로 세 가지를 차례로 계산해요. Selectivity(조건을 통과하는 비율) → Cardinality(나올 행 수) → Cost(드는 I/O·CPU 양).',
      'The estimator uses optimizer statistics stored in the data dictionary (row counts, block counts, NDV, low/high values) to compute three measures in turn: selectivity (fraction of rows passing a predicate) → cardinality (rows returned) → cost (I/O and CPU needed).',
    ),
    facts: [
      ...opt.estimates.flatMap((e) => [
        t(
          `${e.tableName}: ${e.numRows}행 · ${e.numBlocks}블록, 선택도 ${(e.selectivity * 100).toFixed(1)}% → 예상 ${e.cardinality}행`,
          `${e.tableName}: ${e.numRows} rows · ${e.numBlocks} blocks, selectivity ${(e.selectivity * 100).toFixed(1)}% → ${e.cardinality} rows expected`,
        ),
        ...e.notes,
      ]),
      opt.estimates.length === 0 && t('읽을 테이블이 없어서 계산할 것이 거의 없어요.', 'No table is read, so there is almost nothing to estimate.'),
      opt.query.bindNames.length > 0 && t(
        `바인드 변수 ${opt.query.bindNames.join(', ')}: 실제 Oracle 은 Hard Parse 하는 이 순간에만 바인드 값을 살짝 들여다보고(Bind Peeking) 선택도를 계산해요. 그렇게 만든 계획을 다음 실행에서도 그대로 쓰기 때문에, 값마다 행 수가 크게 다르면 계획이 안 맞을 수 있어요. 이 시뮬레이터는 값을 모른다고 보고 계산해요.`,
        `Bind variable ${opt.query.bindNames.join(', ')}: a real database peeks at the bind value only now, during the hard parse (bind peeking), to compute selectivity. That plan is then reused for later executions, so it may fit badly when different values return very different row counts. This simulator estimates as if the value were unknown.`,
      ),
      t(
        '통계는 DBMS_STATS 가 모아 둔 값이에요. 통계가 낡으면 예상 행 수가 틀어지고, 나쁜 계획이 골라져요.',
        'Statistics are gathered by DBMS_STATS. Stale statistics skew the row estimates and lead to bad plans.',
      ),
    ],
    active,
    flows: [['dict-cache', 'server-process']],
  })

  run.optLevel = 3
  run.step({
    key: 'plan', stage: 'optimize', doc: opt.joinSteps.length > 0 ? 'joins' : 'access-paths', result: 'ok',
    title: t('Optimization ③ Plan Generator', 'Optimization ③ Plan generator'),
    body: t(
      'Plan Generator 가 가능한 Access Path · 조인 방법 · 조인 순서를 이리저리 조합해 보고, Estimator 가 매긴 비용이 가장 낮은 계획 하나를 골라요.',
      'The plan generator tries different combinations of access paths, join methods and join orders, and picks the one plan the estimator costed lowest.',
    ),
    facts: [
      ...opt.tableAccessPlans.map((ap) =>
        t(
          `${ap.tableName}: 후보 ${ap.accessPaths.length}개 중 ${ACCESS_NAME[ap.chosen.type]}${ap.chosen.index ? ` (${ap.chosen.index.indexName})` : ''} 선택 — 비용 ${ap.chosen.cost}. ${ap.chosen.reason.ko}`,
          `${ap.tableName}: of ${ap.accessPaths.length} candidates, ${ACCESS_NAME[ap.chosen.type]}${ap.chosen.index ? ` (${ap.chosen.index.indexName})` : ''} chosen — cost ${ap.chosen.cost}. ${ap.chosen.reason.en}`,
        ),
      ),
      ...opt.joinSteps.map((j) =>
        t(
          `${j.leftLabel} ⋈ ${j.rightTable}: ${j.method.replace(/_/g, ' ')} — ${j.reason.ko}`,
          `${j.leftLabel} ⋈ ${j.rightTable}: ${j.method.replace(/_/g, ' ')} — ${j.reason.en}`,
        ),
      ),
      opt.joinOrders.length > 1 && t(
        `조인 순서 후보 중 "${opt.joinOrders.find((o) => o.chosen)?.order.join(' → ')}" 가 가장 쌌어요.`,
        `Among the join orders, "${opt.joinOrders.find((o) => o.chosen)?.order.join(' → ')}" was cheapest.`,
      ),
      t(
        `따져 본 조합 ${opt.plansConsidered}개 · 고른 계획의 총 비용 ${opt.totalCost} · 예상 결과 ${opt.estimatedRows}행`,
        `${opt.plansConsidered} alternatives costed · chosen plan cost ${opt.totalCost} · ${opt.estimatedRows} rows expected`,
      ),
    ],
    active,
  })
}

// ── Execution ─────────────────────────────────────────────────────────────

function runExecution(run: Run, opt: OptimizerResult): number {
  const s = run.s
  const q = opt.query
  const nodes = opt.planNodes
  const isSelect = q.type === 'SELECT'
  const matches: Record<string, RowMatch> = {}
  for (const e of opt.estimates) {
    matches[e.alias] = matchRows(q.tables.find((r) => r.alias === e.alias)!, q.predicates, e.cardinality)
  }

  s.stats.executions++
  s.pga.phase = 'EXECUTE'
  s.pga.binds = q.bindNames
  run.step({
    key: 'exec-start', stage: 'execute', doc: isSelect ? 'consistency' : 'sql-processing',
    title: t('Execute 시작', 'Execution begins'),
    body: t(
      'SQL 엔진이 Row Source Tree 의 Row Source 를 하나씩 실행해요. 계획을 읽을 때는 위에서 아래로 보이지만, 실제로는 가장 안쪽(아래) 잎에서 먼저 행이 만들어져 위로 올라가요. 실행 상태는 Private SQL Area 의 Run-Time Area 에 담겨요.',
      'The SQL engine executes each row source in the row source tree. A plan reads top-down, but rows are actually produced first at the innermost leaves and flow upward. Execution state lives in the run-time area of the private SQL area.',
    ),
    facts: [
      q.bindNames.length > 0 && t(
        `바인드 변수 ${q.bindNames.join(', ')} 의 값은 Private SQL Area 의 Persistent Area 에 들어 있어요. 문장 글자는 그대로니까 값이 바뀌어도 같은 커서를 써요.`,
        `The values of bind variables ${q.bindNames.join(', ')} sit in the persistent area of the private SQL area. The statement text stays the same, so a different value still uses the same cursor.`,
      ),
      isSelect
        ? t(
            `읽기 기준 시점: SCN ${s.scn}. 질의는 이 시점의 데이터만 봐요. 그 뒤에 바뀐 블록을 만나면 Undo 로 예전 모습을 되살려서 읽어요(Read Consistency). 그래서 읽는 쪽은 쓰는 쪽을 기다리지 않아요.`,
            `Read snapshot: SCN ${s.scn}. The query sees only data as of this point. If it meets a block changed later, it rebuilds the older version from undo (read consistency), so readers never wait for writers.`,
          )
        : q.type === 'INSERT'
          ? t(
              'INSERT … VALUES 는 읽어 올 행이 없어요. 새 행이 들어갈 블록만 정하면 돼요.',
              'INSERT … VALUES has no rows to read — it only needs a block to put the new row in.',
            )
          : t(
              'DML 도 먼저 바꿀 행부터 찾아야 해요. 찾는 동안에는 질의와 똑같이 Read Consistency 로 읽어요.',
              'DML must first find the rows to change. While searching it reads with read consistency, exactly like a query.',
            ),
    ],
    active: ['server-process', 'pga-private'],
  })

  const pathOf = (alias: string) =>
    opt.joinSteps.find((j) => j.rightAlias === alias)?.inner ?? opt.tableAccessPlans.find((p) => p.alias === alias)!.chosen

  // 테이블(또는 인덱스+테이블) 하나를 읽는 단위
  const access = (node: PlanNode, nestedLoop: boolean) => {
    const alias = node.alias!
    const path = pathOf(alias)
    const viaJoinIndex = nestedLoop && path.index !== undefined && path.accessPredicate === undefined && path.type !== 'INDEX_FAST_FULL_SCAN'
    let keys: number[]
    if (viaJoinIndex) {
      const col = path.index!.columns[0]
      const join = q.joins.find((j) => (j.leftAlias === alias && j.leftColumn === col) || (j.rightAlias === alias && j.rightColumn === col))
      const [otherAlias, otherCol] = join ? (join.leftAlias === alias ? [join.rightAlias, join.rightColumn] : [join.leftAlias, join.leftColumn]) : ['', '']
      const otherRows = getTableRows(q.tables.find((r) => r.alias === otherAlias)?.name ?? '')
      const outerValues = new Set((matches[otherAlias]?.rows ?? []).map((r) => otherRows[r]?.[otherCol]))
      keys = getTableRows(path.tableName).map((row, i) => (outerValues.has(row[col]) && row[col] !== null ? i : -1)).filter((i) => i >= 0)
    } else {
      keys = keyRows(path, matches[alias].rows)
    }
    const blocks = accessBlocks(path, keys)
    const full = path.type === 'FULL_TABLE_SCAN' || path.type === 'INDEX_FAST_FULL_SCAN'
    const indexNode = path.index ? (node.kind === 'index' ? node : nodes[node.children[0]]) : undefined
    const repeat = nestedLoop && t(
      '실제 Oracle 에서는 바깥 행 수만큼 이 탐색이 반복돼요. 같은 블록을 다시 찾을 때는 이미 캐시에 있어서 Logical Read 로 끝나요.',
      'In a real database this lookup repeats once per outer row. Revisited blocks are already cached, so the repeats are logical reads.',
    )
    const filterFact = (f: string | undefined) =>
      f && t(`filter(${f}) — 읽은 행을 하나씩 검사해서 걸러 내는 조건이에요.`, `filter(${f}) — checked row by row after the rows are read.`)
    // 옵티마이저의 예상(E-Rows)과 실제(A-Rows) 비교 — 값을 다 알 때만
    const m = matches[alias]
    const actual = !nestedLoop && m.exact ? m.rows.length : null
    const estFact = (est: number) =>
      actual !== null && t(
        `옵티마이저 예상 ${est}행 → 실제 ${actual}행.${Math.abs(est - actual) > Math.max(1, actual * 0.5) ? ' 차이가 꽤 나죠? 값이 고르게 퍼져 있다고 가정했기 때문이에요. 실제 Oracle 은 이런 컬럼에 Histogram 을 만들어 치우친 분포를 알아내요.' : ''}`,
        `Optimizer estimate ${est} rows → actual ${actual} rows.${Math.abs(est - actual) > Math.max(1, actual * 0.5) ? ' Quite a gap: the estimate assumed evenly distributed values. A real database builds a histogram on such a column to learn about the skew.' : ''}`,
      )

    // ① 인덱스 블록
    if (indexNode && blocks.index.length > 0) {
      const res = run.get(blocks.index, 'cr')
      const { active, flows } = bufferActive(res)
      const ix = path.index!
      const lookup = nestedLoop ? t('바깥(Outer) 집합에서 행이 하나 올라올 때마다, 그 조인 키로 ', 'For every row arriving from the outer set, its join key is used to search ') : t('', '')
      const body = path.type === 'INDEX_FAST_FULL_SCAN'
        ? t(
            `필요한 값이 전부 인덱스 ${ix.indexName} 안에 있어서 테이블은 읽지 않아요. 인덱스 세그먼트의 블록을 키 순서와 상관없이 디스크에 놓인 순서대로 통째로 읽어요. 그래서 결과가 정렬돼 나오지 않아요.`,
            `Everything needed is inside index ${ix.indexName}, so the table is not touched. The blocks of the index segment are read wholesale in on-disk order, not key order — so the result does not come out sorted.`,
          )
        : t(
            `${lookup.ko}인덱스 ${ix.indexName} 의 Root 블록에서 출발해 Leaf 블록까지 내려가요(BLEVEL ${ix.blevel}). ${path.type === 'INDEX_UNIQUE_SCAN' ? 'Unique 인덱스라 맞는 키는 많아야 하나예요.' : 'Leaf 블록은 서로 이어져 있어서, 조건을 벗어나는 키를 만날 때까지 옆으로 훑어요.'} Leaf 에는 키 값과 그 행의 주소인 ROWID 가 들어 있어요.${path.indexOnly ? ' 필요한 값이 인덱스에 다 있어서 테이블은 읽지 않아요.' : ''}`,
            `${lookup.en}${nestedLoop ? 'index' : 'Index'} ${ix.indexName}${nestedLoop ? ',' : ' is searched'} from its root block down to a leaf block (BLEVEL ${ix.blevel}). ${path.type === 'INDEX_UNIQUE_SCAN' ? 'The index is unique, so at most one key matches.' : 'Leaf blocks are linked together, so the scan walks sideways until a key falls outside the condition.'} Each leaf entry holds the key value and the ROWID, the address of its row.${path.indexOnly ? ' The index holds everything needed, so the table is not read.' : ''}`,
          )
      run.step({
        key: 'index', stage: 'execute', doc: res.reads > 0 ? 'memory' : 'access-paths',
        result: res.reads > 0 ? 'miss' : 'hit',
        title: t(`${indexNode.operation} — ${indexNode.name}`, `${indexNode.operation} — ${indexNode.name}`),
        body,
        facts: [
          ...bufferFacts(res, 'cr', path.type === 'INDEX_FAST_FULL_SCAN'),
          indexNode.access && t(`access(${indexNode.access}) — 인덱스의 어디부터 어디까지 읽을지 정하는 조건이에요.`, `access(${indexNode.access}) — decides which part of the index is read.`),
          filterFact(indexNode.filter),
          blocks.table.length === 0 && estFact(indexNode.rows),
          blocks.table.length === 0 && repeat,
        ],
        active, flows, touched: res.slots, planNodeId: indexNode.id,
      })
    }

    // ② 테이블 블록
    if (blocks.table.length > 0) {
      const res = run.get(blocks.table, 'cr')
      const { active, flows } = bufferActive(res)
      const batched = node.operation.includes('BATCHED')
      const body = path.type === 'FULL_TABLE_SCAN' || !path.index
        ? t(
            `${path.tableName} 세그먼트의 블록을 처음부터 High Water Mark 까지 빠짐없이 읽어요. 블록마다 먼저 Buffer Cache 에 있는지 보고, 없을 때만 Data File 에서 가져와요.`,
            `Every block of the ${path.tableName} segment is read from the start up to the high water mark. For each block the buffer cache is checked first, and only a miss goes to the data file.`,
          )
        : t(
            `인덱스에서 얻은 ROWID 로 ${path.tableName} 의 행을 곧장 찾아가요. ROWID 에는 Data File 번호 · 블록 번호 · 블록 안의 행 번호가 들어 있어서, 딱 그 블록만 읽으면 돼요.${batched ? ' BATCHED 는 ROWID 를 몇 개 모았다가 블록 순서로 정리해서 읽는다는 뜻이에요. 같은 블록을 여러 번 오가지 않게 돼요.' : ''}`,
            `The ROWIDs obtained from the index lead straight to the rows of ${path.tableName}. A ROWID encodes the data file number, the block number and the row number within the block, so exactly that block is read.${batched ? ' BATCHED means several ROWIDs are collected and visited in block order, so the same block is not revisited back and forth.' : ''}`,
          )
      run.step({
        key: 'access', stage: 'execute', doc: res.reads > 0 ? 'memory' : 'access-paths',
        result: res.reads > 0 ? 'miss' : 'hit',
        title: t(`${node.operation} — ${node.name}`, `${node.operation} — ${node.name}`),
        body,
        facts: [...bufferFacts(res, 'cr', full), filterFact(node.filter), estFact(node.rows), repeat],
        active, flows, touched: res.slots, planNodeId: node.id,
      })
    }
  }

  const workArea = (node: PlanNode, area: 'Sort Area' | 'Hash Area', title: L, body: L, facts: L[] = []) => {
    s.pga.workArea = `${area} — ${node.operation}`
    run.step({
      key: 'work-area', stage: 'execute', doc: 'memory', result: 'ok', title, body,
      facts: [
        ...facts,
        t(
          `${area} 는 SGA 가 아니라 이 Server Process 의 PGA 안 SQL Work Area 에 있어요. 데이터가 Work Area 보다 크면 Temporary Tablespace 로 넘쳐서 디스크를 쓰게 돼요(이 예제는 작아서 메모리로 충분해요).`,
          `The ${area.toLowerCase()} lives in the SQL work area of this server process's PGA, not in the SGA. Data larger than the work area spills to the temporary tablespace on disk (this example is small enough for memory).`,
        ),
      ],
      active: ['server-process', 'pga-work'], planNodeId: node.id,
    })
  }

  const exec = (id: number, nestedLoop = false) => {
    const node = nodes[id]
    if (node.kind === 'table' || node.kind === 'index') return access(node, nestedLoop)
    if (node.kind === 'statement' || node.kind === 'dml' || node.kind === 'view') return node.children.forEach((c) => exec(c))
    if (node.kind === 'join') {
      const [left, right] = node.children
      if (node.operation.startsWith('NESTED LOOPS')) {
        exec(left)
        exec(right, true)
        return
      }
      if (node.operation.startsWith('HASH JOIN')) {
        exec(left)
        workArea(node, 'Hash Area',
          t('HASH JOIN — Build: 해시 테이블 만들기', 'HASH JOIN — build the hash table'),
          t(
            `먼저 읽은 ${nodes[left].rows}행의 조인 키를 해시해서 PGA 에 해시 테이블을 만들어요. 작은 쪽을 Build 입력으로 삼아야 메모리를 덜 써요.`,
            `The join keys of the ${nodes[left].rows} rows read first are hashed into a hash table in the PGA. Using the smaller input as the build side keeps memory use low.`,
          ))
        exec(right)
        workArea(node, 'Hash Area',
          t('HASH JOIN — Probe: 짝 찾기', 'HASH JOIN — probe for matches'),
          t(
            `두 번째 집합의 행을 하나씩 같은 해시 함수에 넣어, 해시 테이블에서 짝을 찾아요. 양쪽을 딱 한 번씩만 읽고 끝나요. 결과 ${node.rows}행.`,
            `Each row of the second input goes through the same hash function to find its match in the hash table. Both inputs are read exactly once. Result: ${node.rows} rows.`,
          ),
          [
            ...(node.access ? [t(`access(${node.access})`, `access(${node.access})`)] : []),
            ...(node.operation.includes('SEMI')
              ? [t('SEMI: 짝을 한 번 찾은 행은 표시해 두고, 같은 값이 또 나와도 다시 내보내지 않아요.', 'SEMI: a row that has found a match is flagged and never returned again, even if the same value turns up once more.')]
              : []),
          ])
        return
      }
      exec(left)
      exec(right)
      s.pga.workArea = `Sort Area — ${node.operation}`
      run.step({
        key: 'merge', stage: 'execute', doc: 'joins', result: 'ok',
        title: t(`${node.operation} — 합치기`, `${node.operation} — merge`),
        body: node.operation.includes('CARTESIAN')
          ? t(`조인 조건이 없어서 양쪽의 모든 행을 서로 짝지어요. 결과 ${node.rows}행.`, `With no join condition, every row pairs with every row of the other side. Result: ${node.rows} rows.`)
          : t(`정렬된 두 집합을 앞에서부터 나란히 훑으며 키가 같은 행을 합쳐요. 결과 ${node.rows}행.`, `The two sorted inputs are scanned side by side, joining rows with equal keys. Result: ${node.rows} rows.`),
        active: ['server-process', 'pga-work'], planNodeId: node.id,
      })
      return
    }
    // sort / hash 연산
    node.children.forEach((c) => exec(c))
    const input = nodes[node.children[0]]?.rows ?? node.rows
    if (node.kind === 'stopkey') {
      const window = node.operation.startsWith('WINDOW')
      run.step({
        key: 'stopkey', stage: 'execute', doc: 'sql-processing', result: 'ok',
        title: t(node.operation, node.operation),
        body: window
          ? t(
              `FETCH FIRST 는 내부에서 ROW_NUMBER() 분석 함수로 바뀌어요. 정렬할 필요가 없어서(NOSORT) 올라오는 행에 차례로 번호만 매기다가, ${node.rows}번째 행이 나오면 아래 Row Source 에게 그만 달라고 해요(STOPKEY).`,
              `FETCH FIRST is rewritten internally with the ROW_NUMBER() analytic function. No sort is needed (NOSORT): arriving rows are simply numbered, and once row ${node.rows} appears the row sources below are told to stop (STOPKEY).`,
            )
          : t(
              `ROWNUM 은 행이 결과로 뽑힐 때마다 1, 2, 3… 차례로 붙는 번호예요. ${node.rows}행이 모이면 아래 Row Source 에게 그만 달라고 해요. 테이블을 끝까지 읽지 않아도 돼요.`,
              `ROWNUM is a number assigned 1, 2, 3… as each row is produced. Once ${node.rows} rows are collected, the row sources below are told to stop — the table need not be read to the end.`,
            ),
        facts: [
          node.filter && t(`filter(${node.filter})`, `filter(${node.filter})`),
          t(
            '이 시뮬레이터는 아래 단계에서 블록을 끝까지 읽은 것으로 그려요. 실제로는 필요한 행이 모이는 순간 읽기를 멈춰요.',
            'The simulator draws the step below as reading every block; a real database stops reading the moment enough rows are collected.',
          ),
        ],
        active: ['server-process', 'pga-private'], planNodeId: node.id,
      })
    } else if (node.operation === 'WINDOW SORT PUSHED RANK') {
      s.stats.sorts++
      workArea(node, 'Sort Area',
        t('WINDOW SORT PUSHED RANK — Top-N 정렬', 'WINDOW SORT PUSHED RANK — top-N sort'),
        t(
          `FETCH FIRST 는 내부에서 ROW_NUMBER() OVER (ORDER BY …) 로 바뀌어요. ${input}행을 전부 정렬해 두지 않고, 지금까지 본 것 중 위에서 ${nodes[id - 1]?.rows ?? node.rows}등 안에 드는 행만 Sort Area 에 남겨 가며 훑어요(PUSHED RANK). 그래서 메모리를 아주 조금만 써요.`,
          `FETCH FIRST is rewritten internally as ROW_NUMBER() OVER (ORDER BY …). Rather than sorting all ${input} rows, only the rows currently ranked in the top ${nodes[id - 1]?.rows ?? node.rows} are kept in the sort area as the input streams by (PUSHED RANK), so very little memory is used.`,
        ),
        [node.filter ? t(`filter(${node.filter})`, `filter(${node.filter})`) : t('', ''), t('sorts (memory) +1', 'sorts (memory) +1')].filter((f) => f.en !== ''))
    } else if (node.operation === 'SORT GROUP BY') {
      s.stats.sorts++
      workArea(node, 'Sort Area',
        t('SORT GROUP BY — 정렬하며 그룹 짓기', 'SORT GROUP BY'),
        t(
          `GROUP BY 와 ORDER BY 의 컬럼이 같아서 일을 한 번에 끝내요. ${input}행을 그룹 키로 정렬하면 같은 값끼리 나란히 모이니까, 그대로 훑으면서 집계하면 ${node.rows}개 그룹이 정렬된 순서로 나와요. 정렬을 따로 한 번 더 하지 않아도 돼요.`,
          `GROUP BY and ORDER BY use the same columns, so one operation does both jobs. Sorting the ${input} rows on the group key puts equal values side by side; aggregating along the way yields ${node.rows} groups already in order, with no separate sort.`,
        ),
        [t('sorts (memory) +1', 'sorts (memory) +1')])
    } else if (node.operation === 'SORT AGGREGATE') {
      workArea(node, 'Sort Area',
        t('SORT AGGREGATE — 집계', 'SORT AGGREGATE'),
        t(
          `아래에서 올라오는 ${input}행을 받으면서 COUNT·SUM 같은 집계 값을 계속 갱신해요. 이름과 달리 실제로 정렬하지는 않고, 결과는 딱 1행이에요.`,
          `As the ${input} rows arrive from below, running aggregates such as COUNT and SUM are updated. Despite its name nothing is sorted, and the result is exactly one row.`,
        ))
    } else if (node.kind === 'hash') {
      workArea(node, 'Hash Area',
        t(`${node.operation}`, `${node.operation}`),
        t(
          `${input}행을 해시 테이블에 넣어 값이 같은 것끼리 모아요. ${node.operation === 'HASH UNIQUE' ? '중복을 없애고' : '그룹마다 집계해서'} ${node.rows}행으로 줄여요.`,
          `The ${input} rows are placed into a hash table so equal values meet. ${node.operation === 'HASH UNIQUE' ? 'Duplicates are removed' : 'Each group is aggregated'}, leaving ${node.rows} rows.`,
        ))
    } else {
      s.stats.sorts++
      workArea(node, 'Sort Area',
        t(`${node.operation} — 정렬`, `${node.operation}`),
        t(
          `${input}행을 PGA 의 Sort Area 에서 정렬해요. 정렬이 다 끝나야 첫 행을 내보낼 수 있어서, 그 전까지 클라이언트는 한 행도 받지 못해요.`,
          `The ${input} rows are sorted in the sort area of the PGA. The first row cannot be returned until the whole sort has finished, so the client receives nothing before then.`,
        ),
        [t('sorts (memory) +1', 'sorts (memory) +1')])
    }
  }
  exec(0)

  if (isSelect) return actualRowCount(opt, matches) ?? opt.estimatedRows
  return runDml(run, opt, matches)
}

// ── DML: Lock → Undo → Redo → Block change ────────────────────────────────

function runDml(run: Run, opt: OptimizerResult, matches: Record<string, RowMatch>): number {
  const s = run.s
  const q = opt.query
  const table = q.tables[0].name
  const ts = getTableStats(table)!
  const dmlNode = opt.planNodes.find((n) => n.kind === 'dml')
  const isInsert = q.type === 'INSERT'
  const rows = isInsert ? [Math.max(0, ts.numRows - 1)] : matches[q.tables[0].alias]?.rows ?? []
  const n = rows.length

  if (n === 0) {
    run.step({
      key: 'dml-none', stage: 'execute', doc: 'sql-processing', result: 'ok',
      title: t('바꿀 행이 없어요', 'No rows to change'),
      body: t('조건에 맞는 행이 하나도 없어서 아무것도 바꾸지 않았어요. Undo 도 Redo 도 만들지 않아요.', 'No row matched the condition, so nothing was changed — no undo and no redo were generated.'),
      active: ['server-process'], planNodeId: dmlNode?.id,
    })
    return 0
  }

  // 1) Transaction + Locks
  const newTxn = s.txn === null
  if (!s.txn) {
    s.txn = { xid: `${3 + (s.scn % 7)}.${12 + (s.scn % 20)}.${1040 + (s.tick % 900)}`, startScn: s.scn, undoRecords: 0, rowLocks: 0, tables: [] }
  }
  const txn = s.txn
  txn.rowLocks += n
  if (!txn.tables.includes(table)) txn.tables.push(table)
  const target = dmlBlocks(table, rows, q.type === 'UPDATE' ? q.setColumns : null)
  const lockRes = run.get(target.table, 'cu')
  run.step({
    key: 'lock', stage: 'execute', doc: 'consistency', result: 'ok',
    title: t(`Lock — ${n}행 잠그기`, `Lock — ${n} row${n === 1 ? '' : 's'}`),
    body: t(
      `${isInsert ? '새 행이 들어갈 블록을' : '찾은 행을 이번에는'} "지금 최신 모습 그대로"(Current Mode) ${isInsert ? '가져와서 행 자리를' : '다시 가져와서'} 잠가요. ${newTxn ? '이 세션의 첫 변경이라 여기서 트랜잭션이 시작되고, Undo Segment 의 트랜잭션 테이블에 자리를 하나 받아요.' : '이미 진행 중인 트랜잭션에 이어서 일해요.'}`,
      `${isInsert ? 'The block that will hold the new row is fetched as it is right now (current mode) and the row slot locked.' : 'The rows found are fetched again, this time as they are right now (current mode), and locked.'} ${newTxn ? 'This is the session\'s first change, so a transaction begins here and gets a slot in the transaction table of an undo segment.' : 'The work continues inside the transaction already in progress.'}`,
    ),
    facts: [
      t(`트랜잭션 ID(XID) ${txn.xid}`, `Transaction ID (XID) ${txn.xid}`),
      t(
        `TX Lock(행 잠금) ${n}개: 따로 잠금 목록을 두지 않고, 행이 들어 있는 데이터 블록 헤더에 "이 트랜잭션이 잡고 있음"이라고 적어 둬요. 그래서 행을 아무리 많이 잠가도 Lock Escalation 이 없어요.`,
        `${n} TX (row) lock${n === 1 ? '' : 's'}: there is no separate lock list — the lock is recorded in the header of the data block holding the row. That is why Oracle never escalates row locks, however many there are.`,
      ),
      t(
        `TM Lock(테이블 잠금) — ${table} 에 Row Exclusive 모드: 내가 고치는 동안 다른 세션이 이 테이블을 DROP·ALTER 하지 못하게 막아요.`,
        `TM (table) lock on ${table} in row exclusive mode: stops other sessions from dropping or altering the table while it is being modified.`,
      ),
      t(`DB Block Get(Current Mode) +${lockRes.slots.length}`, `DB block gets (current mode) +${lockRes.slots.length}`),
    ],
    active: ['server-process', 'buffer-cache', 'df-undo'],
    flows: [['server-process', 'buffer-cache']],
    touched: lockRes.slots, planNodeId: dmlNode?.id,
  })

  // 2) Redo — 버퍼를 고치기 전에 먼저 남긴다
  const perRow = q.type === 'INSERT' ? 320 : q.type === 'DELETE' ? 280 : 240
  const redoBytes = n * perRow + target.index.length * 96
  s.redoBuffer.bytes += redoBytes
  s.redoBuffer.entries += n + target.index.length
  s.stats.redoSize += redoBytes
  const third = s.redoBuffer.bytes > REDO_BUFFER_BYTES / 3
  const flushed = third ? run.lgwrFlush() : 0
  run.step({
    key: 'redo', stage: 'execute', doc: 'memory', result: 'ok',
    title: t('Redo — 변경 내용을 Redo Log Buffer 에', 'Redo — describe the change in the redo log buffer'),
    body: t(
      '블록에 손대기 전에 먼저 기록부터 남겨요. Server Process 가 "어느 블록의 무엇을 무엇으로 바꾼다"는 Redo Entry 를 만들어 SGA 의 Redo Log Buffer 에 복사해요. 데이터 블록의 변경뿐 아니라, 곧 쓰게 될 Undo 블록의 변경도 함께 담겨요. 장애가 나도 Redo 만 있으면 변경을 다시 만들어 낼 수 있어요.',
      'Before any block is touched, the change is recorded. The server process builds a redo entry describing which block changes from what to what and copies it into the redo log buffer in the SGA. It covers not only the data block change but also the change about to be made to the undo block. After a failure, redo alone is enough to reconstruct the changes.',
    ),
    facts: [
      t(`Redo ${redoBytes.toLocaleString()} bytes 생성 (redo size +${redoBytes.toLocaleString()})`, `${redoBytes.toLocaleString()} bytes of redo generated (redo size +${redoBytes.toLocaleString()})`),
      third
        ? t(
            `Redo Log Buffer 가 1/3 넘게 찼어요 → LGWR 가 커밋을 기다리지 않고 ${flushed.toLocaleString()} bytes 를 Online Redo Log 에 미리 썼어요.`,
            `The redo log buffer passed one-third full → LGWR wrote ${flushed.toLocaleString()} bytes to the online redo log without waiting for a commit.`,
          )
        : t(
            'Redo 는 아직 메모리에만 있어요. LGWR 는 ① COMMIT 할 때 ② 3초마다 ③ 버퍼가 1/3 찼을 때 ④ DBW 가 블록을 쓰기 직전에 디스크로 내려요.',
            'The redo is still only in memory. LGWR writes it to disk ① at COMMIT ② every three seconds ③ when the buffer is one-third full ④ just before DBW writes blocks.',
          ),
    ],
    active: ['server-process', 'redo-buffer', ...(third ? ['lgwr', 'redo-logs'] : [])],
    flows: [['server-process', 'redo-buffer'], ...(third ? ([['redo-buffer', 'redo-logs']] as [string, string][]) : [])],
    planNodeId: dmlNode?.id,
  })

  // 3) Undo
  const firstUndo = Math.floor(txn.undoRecords / UNDO_RECORDS_PER_BLOCK) + 1
  txn.undoRecords += n
  const lastUndo = Math.floor((txn.undoRecords - 1) / UNDO_RECORDS_PER_BLOCK) + 1
  const undoBlocks = Array.from({ length: lastUndo - firstUndo + 1 }, (_, i) => undoBlock(firstUndo + i))
  const undoRes = run.get(undoBlocks, 'cu', { dirty: true, fresh: true })
  const beforeImage: Record<string, L> = {
    UPDATE: t('바꾸기 전의 컬럼 값', 'the column values before the change'),
    DELETE: t('지우는 행 전체', 'the entire deleted row'),
    INSERT: t('새 행의 ROWID 만 (되돌릴 때는 그 행을 지우면 되니까요)', 'just the ROWID of the new row (undoing it only needs a delete)'),
  }
  run.step({
    key: 'undo', stage: 'execute', doc: 'transactions', result: 'ok',
    title: t('Undo — 되돌릴 정보 남기기', 'Undo — record how to reverse it'),
    body: t(
      `이제 되돌리는 데 필요한 정보(${beforeImage[q.type].ko})를 Undo 블록에 적어요. Undo 는 SGA 의 별도 방이 아니라 Undo Tablespace 의 Undo Segment 블록이고, 다른 데이터 블록처럼 Buffer Cache 에 올라와서 쓰여요.`,
      `Next, the information needed to reverse the change (${beforeImage[q.type].en}) is written to an undo block. Undo is not a separate SGA structure: it is blocks of an undo segment in the undo tablespace, used through the buffer cache like any other data block.`,
    ),
    facts: [
      t(
        `Undo Record ${n}개 → Undo 블록 ${undoBlocks.map((b) => b.sub).join(', ')}번 (Buffer Cache 에서 Dirty 상태)`,
        `${n} undo record${n === 1 ? '' : 's'} → undo block ${undoBlocks.map((b) => b.sub).join(', ')} (dirty in the buffer cache)`,
      ),
      t(
        'Undo 의 쓰임새 세 가지: ROLLBACK 으로 되돌리기, 다른 세션에게 바뀌기 전 모습 보여 주기(Read Consistency), 장애 뒤 커밋 안 된 변경 되돌리기.',
        'Undo has three uses: rolling back, showing other sessions the pre-change image (read consistency), and reversing uncommitted changes after a failure.',
      ),
    ],
    active: ['server-process', 'buffer-cache', 'df-undo'],
    flows: [['server-process', 'buffer-cache']],
    touched: undoRes.slots, planNodeId: dmlNode?.id,
  })

  // 4) Block change
  const dataRes = run.get(target.table, 'cu', { dirty: true })
  const indexRes = run.get(target.index, 'cu', { dirty: true })
  const reads = dataRes.reads + indexRes.reads
  const verb: Record<string, L> = {
    UPDATE: t('컬럼 값을 새 값으로 고쳐요', 'the column values are overwritten'),
    DELETE: t('행에 "지워짐" 표시를 해요', 'the rows are flagged as deleted'),
    INSERT: t('빈 자리가 있는 블록에 새 행을 넣어요', 'the new row is placed in a block with free space'),
  }
  run.step({
    key: 'change', stage: 'execute', doc: 'memory', result: reads > 0 ? 'miss' : 'ok',
    title: t(`${q.type} — Buffer Cache 의 블록 바꾸기`, `${q.type} — change the blocks in the buffer cache`),
    body: t(
      `마지막으로 Buffer Cache 안의 데이터 블록을 직접 고쳐요: ${verb[q.type].ko}. 바뀐 버퍼는 디스크와 내용이 달라진 Dirty 버퍼가 돼요. Data File 에는 아직 아무것도 쓰지 않아요.`,
      `Finally the data blocks in the buffer cache are modified: ${verb[q.type].en}. The changed buffers become dirty — different from what is on disk. Nothing has been written to the data files yet.`,
    ),
    facts: [
      t(
        `테이블 블록 ${target.table.map(blockName).join(', ')} → Dirty`,
        `Table block${target.table.length === 1 ? '' : 's'} ${target.table.map(blockName).join(', ')} → dirty`,
      ),
      target.index.length > 0
        ? t(
            `인덱스도 같이 고쳐요: ${target.index.map((b) => `${b.object} ${b.sub}`).join(', ')}. ${q.type === 'UPDATE' ? '값이 바뀐 컬럼의 인덱스만 손봐요.' : '이 테이블의 모든 인덱스를 손봐야 해요. 인덱스가 많을수록 DML 이 느려지는 이유예요.'}`,
            `Indexes are maintained too: ${target.index.map((b) => `${b.object} ${b.sub}`).join(', ')}. ${q.type === 'UPDATE' ? 'Only indexes on the changed columns are touched.' : 'Every index on the table must be maintained — which is why more indexes mean slower DML.'}`,
          )
        : q.type === 'UPDATE' && t('바뀐 컬럼에 인덱스가 없어서 인덱스는 건드리지 않아요.', 'No index covers the changed columns, so no index is touched.'),
      reads > 0 && t(`캐시에 없던 블록 ${reads}개는 Server Process 가 Data File 에서 읽어 왔어요.`, `${reads} block${reads === 1 ? '' : 's'} missing from the cache were read from the data files by the server process.`),
      t(
        '다른 세션은 내가 COMMIT 하기 전까지 이 변경을 못 봐요. Undo 로 만든 예전 모습을 읽어요.',
        'Other sessions cannot see this change until COMMIT — they read the older image rebuilt from undo.',
      ),
      t(
        '시뮬레이터 안내: 블록 · Lock · Undo · Redo 의 움직임만 재현해요. 예제 테이블의 행 자체는 바뀌지 않아서, 뒤이어 SELECT 를 해도 값은 그대로 보여요.',
        'Simulator note: only the block, lock, undo and redo activity is reproduced. The rows of the sample tables are not really changed, so a following SELECT still shows the original values.',
      ),
    ],
    active: ['server-process', 'buffer-cache', ...(reads > 0 ? ['df-users'] : [])],
    flows: [['server-process', 'buffer-cache']],
    touched: [...dataRes.slots, ...indexRes.slots], planNodeId: dmlNode?.id,
  })
  return n
}

// ── COMMIT / ROLLBACK ─────────────────────────────────────────────────────

const TCL_NA: StageId[] = ['semantic', 'shared-pool', 'optimize', 'row-source', 'fetch']

function runCommit(run: Run, sql: string): Trace {
  const s = run.s
  const txn = s.txn
  s.stats.executions++
  s.pga.phase = 'EXECUTE'
  if (!txn) {
    run.step({
      key: 'commit-empty', stage: 'execute', doc: 'transactions', result: 'ok',
      title: t('COMMIT — 진행 중인 트랜잭션 없음', 'COMMIT — no transaction in progress'),
      body: t('바꾼 것이 없어서 기록할 것도 없어요. 그래도 COMMIT 은 성공으로 끝나요.', 'Nothing was changed, so there is nothing to record. COMMIT still succeeds.'),
      active: ['server-process', 'client'],
    })
    s.pga = { cursor: null, binds: [], workArea: null, phase: null }
    return run.finish(sql, 'statement', { notApplicable: TCL_NA, outcome: t('커밋이 완료되었습니다.', 'Commit complete.') })
  }

  s.scn += 1 + (s.tick % 5)
  const commitScn = s.scn
  s.redoBuffer.bytes += 120
  s.redoBuffer.entries += 1
  s.stats.redoSize += 120
  run.step({
    key: 'commit-scn', stage: 'execute', doc: 'transactions', result: 'ok',
    title: t('COMMIT ① SCN 받기 · Commit Record 만들기', 'COMMIT ① assign an SCN · create the commit record'),
    body: t(
      '트랜잭션에 고유한 번호 SCN(System Change Number)을 붙이고, Undo Segment 의 트랜잭션 테이블에 "커밋됨"이라고 적어요. 그리고 Commit Record 를 Redo Log Buffer 에 넣어요.',
      'The transaction is given a unique SCN (system change number), and the transaction table of its undo segment is marked committed. A commit record is then placed in the redo log buffer.',
    ),
    facts: [
      t(`트랜잭션 ${txn.xid} → Commit SCN ${commitScn}`, `Transaction ${txn.xid} → commit SCN ${commitScn}`),
      t('SCN 은 데이터베이스 안의 논리적인 시계예요. 모든 변경의 순서가 이 번호로 정해져요.', 'The SCN is the database\'s logical clock — it orders every change.'),
    ],
    active: ['server-process', 'redo-buffer', 'df-undo'],
    flows: [['server-process', 'redo-buffer']],
  })

  const bytes = run.lgwrFlush()
  run.step({
    key: 'commit-lgwr', stage: 'execute', doc: 'process', result: 'ok',
    title: t('COMMIT ② LGWR 가 Redo 를 디스크에', 'COMMIT ② LGWR writes the redo to disk'),
    body: t(
      'LGWR 가 Redo Log Buffer 에 남아 있던 Redo 와 Commit Record 를 Online Redo Log File 에 순서대로 써요. Server Process 는 이 쓰기가 끝날 때까지 기다려요. 이 한 번의 쓰기가 끝나는 순간이 바로 "커밋된" 순간이에요.',
      'LGWR writes the remaining redo and the commit record from the redo log buffer sequentially to the online redo log file. The server process waits until that write completes. The instant this single write finishes is the instant the transaction is committed.',
    ),
    facts: [
      t(`${bytes.toLocaleString()} bytes → Online Redo Log (Group ${currentLog(s).group} · Log Sequence ${currentLog(s).sequence})`, `${bytes.toLocaleString()} bytes → online redo log (group ${currentLog(s).group} · log sequence ${currentLog(s).sequence})`),
      t(
        'Server Process 가 LGWR 를 기다리는 이 시간이 대기 이벤트 "log file sync" 예요. 여러 세션이 동시에 커밋하면 LGWR 가 한 번의 쓰기로 묶어서 처리해요(Group Commit).',
        'The time the server process spends waiting for LGWR here is the "log file sync" wait event. When several sessions commit together, LGWR covers them with a single write (group commit).',
      ),
      t(
        '순서대로 이어 쓰는 작은 쓰기라서 빨라요. 흩어진 데이터 블록을 전부 쓰는 것보다 훨씬 싸요.',
        'It is a small sequential write, so it is fast — far cheaper than writing all the scattered data blocks.',
      ),
    ],
    active: ['lgwr', 'redo-buffer', 'redo-logs', 'server-process'],
    flows: [['redo-buffer', 'redo-logs']],
  })

  const dirty = s.buffers.filter((b) => b.state === 'dirty')
  for (const b of s.buffers) b.uncommitted = false
  const locks = txn.rowLocks
  s.txn = null
  run.step({
    key: 'commit-release', stage: 'execute', doc: 'transactions', result: 'ok',
    title: t('COMMIT ③ Lock 풀기 · 완료', 'COMMIT ③ release locks · done'),
    body: t(
      '행 잠금과 테이블 잠금을 풀고 Savepoint 를 지우고 트랜잭션을 끝내요. 이제 다른 세션도 바뀐 값을 볼 수 있어요.',
      'Row and table locks are released, savepoints erased, and the transaction ends. Other sessions can now see the new values.',
    ),
    facts: [
      t(`TX Lock ${locks}개 · TM Lock ${txn.tables.join(', ')} 해제`, `${locks} TX lock${locks === 1 ? '' : 's'} and the TM lock on ${txn.tables.join(', ')} released`),
      t(
        `중요: Dirty 버퍼 ${dirty.length}개는 아직 Data File 에 안 썼어요! COMMIT 은 DBW 를 깨우지 않아요. Redo 가 디스크에 있으니 지금 정전이 나도 복구할 수 있거든요. 블록은 나중에 DBW 가 한가할 때나 Checkpoint 때 써요.`,
        `Important: ${dirty.length} dirty buffer${dirty.length === 1 ? ' has' : 's have'} still not been written to the data files! COMMIT does not wake DBW. The redo is on disk, so the change survives even a power cut right now. DBW writes the blocks later, lazily or at a checkpoint.`,
      ),
    ],
    active: ['server-process', 'buffer-cache', 'client'],
    flows: [['server-process', 'client']],
    touched: dirty.map((b) => b.slot),
  })
  s.pga = { cursor: null, binds: [], workArea: null, phase: null }
  return run.finish(sql, 'statement', { notApplicable: TCL_NA, outcome: t('커밋이 완료되었습니다.', 'Commit complete.') })
}

function runRollback(run: Run, sql: string): Trace {
  const s = run.s
  const txn = s.txn
  s.stats.executions++
  s.pga.phase = 'EXECUTE'
  if (!txn) {
    run.step({
      key: 'rollback-empty', stage: 'execute', doc: 'transactions', result: 'ok',
      title: t('ROLLBACK — 진행 중인 트랜잭션 없음', 'ROLLBACK — no transaction in progress'),
      body: t('되돌릴 변경이 없어요.', 'There is no change to undo.'),
      active: ['server-process', 'client'],
    })
    s.pga = { cursor: null, binds: [], workArea: null, phase: null }
    return run.finish(sql, 'statement', { notApplicable: TCL_NA, outcome: t('롤백이 완료되었습니다.', 'Rollback complete.') })
  }

  const changed = s.buffers.filter((b) => b.uncommitted && b.block)
  const res = run.get(changed.map((b) => b.block!), 'cu', { dirty: true })
  const redoBytes = txn.undoRecords * 180
  s.redoBuffer.bytes += redoBytes
  s.redoBuffer.entries += txn.undoRecords
  s.stats.redoSize += redoBytes
  run.step({
    key: 'rollback-apply', stage: 'execute', doc: 'transactions', result: 'ok',
    title: t('ROLLBACK ① Undo 를 거꾸로 적용', 'ROLLBACK ① apply the undo in reverse'),
    body: t(
      `Undo Record ${txn.undoRecords}개를 가장 최근 것부터 거꾸로 읽으면서 블록을 예전 모습으로 되돌려요. INSERT 한 행은 지우고, UPDATE 한 값은 옛 값으로 바꾸고, DELETE 한 행은 다시 넣어요.`,
      `The ${txn.undoRecords} undo record${txn.undoRecords === 1 ? ' is' : 's are'} read newest-first and the blocks restored to their earlier image: inserted rows are deleted, updated values put back, deleted rows reinserted.`,
    ),
    facts: [
      t(
        `되돌리는 것도 블록을 "바꾸는" 일이라 Redo 가 또 생겨요 (+${redoBytes.toLocaleString()} bytes). 블록은 여전히 Dirty 예요.`,
        `Undoing is itself a block change, so it generates more redo (+${redoBytes.toLocaleString()} bytes). The blocks stay dirty.`,
      ),
      t('되돌리는 시간은 바꾼 양에 비례해요. 큰 트랜잭션은 ROLLBACK 도 오래 걸려요.', 'Rollback time is proportional to the amount changed — big transactions take long to roll back.'),
    ],
    active: ['server-process', 'buffer-cache', 'redo-buffer', 'df-undo'],
    flows: [['server-process', 'buffer-cache'], ['server-process', 'redo-buffer']],
    touched: res.slots,
  })

  for (const b of s.buffers) b.uncommitted = false
  const locks = txn.rowLocks
  s.txn = null
  run.step({
    key: 'rollback-release', stage: 'execute', doc: 'transactions', result: 'ok',
    title: t('ROLLBACK ② Lock 풀기 · 완료', 'ROLLBACK ② release locks · done'),
    body: t('모든 잠금을 풀고 Savepoint 를 지우고 트랜잭션을 끝내요. 데이터는 트랜잭션을 시작하기 전 모습 그대로예요.', 'All locks are released, savepoints erased, and the transaction ends. The data is exactly as it was before the transaction began.'),
    facts: [t(`TX Lock ${locks}개 · TM Lock ${txn.tables.join(', ')} 해제`, `${locks} TX lock${locks === 1 ? '' : 's'} and the TM lock on ${txn.tables.join(', ')} released`)],
    active: ['server-process', 'client'],
    flows: [['server-process', 'client']],
  })
  s.pga = { cursor: null, binds: [], workArea: null, phase: null }
  return run.finish(sql, 'statement', { notApplicable: TCL_NA, outcome: t('롤백이 완료되었습니다.', 'Rollback complete.') })
}

// ── Instance commands ─────────────────────────────────────────────────────

const ALL_STAGES: StageId[] = ['syntax', 'semantic', 'shared-pool', 'optimize', 'row-source', 'execute', 'fetch']

function checkpoint(run: Run, trigger?: L) {
  const s = run.s
  run.step({
    key: 'ckpt-signal', stage: 'maintenance', doc: 'process',
    title: t('Checkpoint ① CKPT 가 DBW 에게 신호', 'Checkpoint ① CKPT signals DBW'),
    body: t(
      'Checkpoint 는 "여기까지의 변경은 Data File 에 다 들어 있다"는 지점을 만드는 일이에요. CKPT 프로세스가 DBW 에게 Dirty 버퍼를 쓰라고 알려요. CKPT 가 직접 블록을 쓰지는 않아요.',
      'A checkpoint establishes a point up to which every change is in the data files. The CKPT process signals DBW to write the dirty buffers; CKPT itself writes no blocks.',
    ),
    facts: [trigger, t(`현재 SCN ${s.scn} · 직전 Checkpoint SCN ${s.checkpointScn}`, `Current SCN ${s.scn} · previous checkpoint SCN ${s.checkpointScn}`)],
    active: ['ckpt', 'dbw'],
    flows: [['ckpt', 'dbw']],
  })

  const redo = run.lgwrFlush()
  const dirty = s.buffers.filter((b) => b.state === 'dirty')
  const uncommitted = dirty.filter((b) => b.uncommitted).length
  run.dbwWrite(dirty.map((b) => b.slot))
  run.step({
    key: 'ckpt-dbw', stage: 'maintenance', doc: 'process', result: 'ok',
    title: t('Checkpoint ② LGWR 먼저, 그다음 DBW', 'Checkpoint ② LGWR first, then DBW'),
    body: t(
      'DBW 가 Dirty 버퍼를 Data File 에 써요. 단, 그 블록의 변경을 설명하는 Redo 가 먼저 디스크에 있어야 해요(Write-Ahead Logging). 그래서 LGWR 가 먼저 Redo Log Buffer 를 비워요.',
      'DBW writes the dirty buffers to the data files — but only after the redo describing those changes is on disk (write-ahead logging). So LGWR flushes the redo log buffer first.',
    ),
    facts: [
      t(`LGWR: Redo ${redo.toLocaleString()} bytes → Online Redo Log`, `LGWR: ${redo.toLocaleString()} bytes of redo → online redo log`),
      t(`DBW: Dirty 버퍼 ${dirty.length}개 → Data File (physical writes +${dirty.length}). 버퍼는 Clean 이 되어 캐시에 그대로 남아요.`, `DBW: ${dirty.length} dirty buffer${dirty.length === 1 ? '' : 's'} → data files (physical writes +${dirty.length}). The buffers become clean and stay cached.`),
      uncommitted > 0 && t(
        `그중 ${uncommitted}개는 아직 커밋 안 된 변경이에요. DBW 는 커밋 여부를 가리지 않고 써요. 나중에 ROLLBACK 하면 Undo 로 되돌리면 되니까요.`,
        `${uncommitted} of them hold uncommitted changes. DBW writes regardless of commit status — a later ROLLBACK simply reverses them with undo.`,
      ),
    ],
    active: ['lgwr', 'redo-buffer', 'redo-logs', 'dbw', 'buffer-cache', 'df-users', 'df-undo'],
    flows: [['redo-buffer', 'redo-logs'], ['buffer-cache', 'df-users']],
    touched: dirty.map((b) => b.slot),
  })

  s.checkpointScn = s.scn
  const released = s.redoLog.groups.filter((g) => g.status === 'ACTIVE')
  for (const g of released) g.status = 'INACTIVE'
  run.step({
    key: 'ckpt-record', stage: 'maintenance', doc: 'storage', result: 'ok',
    title: t('Checkpoint ③ CKPT 가 위치 기록', 'Checkpoint ③ CKPT records the position'),
    body: t(
      'CKPT 가 Control File 과 모든 Data File 헤더에 Checkpoint SCN 을 적어요. 장애 뒤 Instance Recovery 는 이 지점 뒤의 Redo 만 다시 적용하면 돼요. Checkpoint 가 잦을수록 복구는 빨라지고, 평소의 쓰기는 많아져요.',
      'CKPT writes the checkpoint SCN into the control file and every data file header. Instance recovery after a failure only needs to reapply redo from this point on. More frequent checkpoints mean faster recovery but more routine writing.',
    ),
    facts: [
      t(`Checkpoint SCN → ${s.checkpointScn}`, `Checkpoint SCN → ${s.checkpointScn}`),
      released.length > 0 && t(
        `Redo Log Group ${released.map((g) => g.group).join(', ')} 이(가) ACTIVE → INACTIVE 로 바뀌었어요. 그 안의 변경이 전부 Data File 에 들어갔으니, 이제 LGWR 가 덮어써도 돼요.`,
        `Redo log group ${released.map((g) => g.group).join(', ')} went from ACTIVE to INACTIVE: every change it describes is now in the data files, so LGWR may overwrite it.`,
      ),
    ],
    active: ['ckpt', 'control-file', 'df-users', 'df-system', 'df-undo', ...(released.length > 0 ? ['redo-logs'] : [])],
    flows: [['ckpt', 'control-file']],
  })
}

// ── Log Switch ────────────────────────────────────────────────────────────
// CURRENT 그룹이 다 차면: LGWR 가 다음 그룹으로 넘어가고 → ARCn 이 다 찬 그룹을 보관하고 → Checkpoint 가 걸린다.

const currentLog = (s: InstanceState) => s.redoLog.groups[s.redoLog.current]

function logSwitch(run: Run) {
  const s = run.s
  const old = currentLog(s)
  const nextIndex = (s.redoLog.current + 1) % s.redoLog.groups.length
  const next = s.redoLog.groups[nextIndex]
  const filled = s.redoLog.bytes
  old.status = 'ACTIVE'
  next.status = 'CURRENT'
  next.sequence = old.sequence + 1
  s.redoLog.current = nextIndex
  s.redoLog.bytes = 0
  run.step({
    key: 'log-switch', stage: 'maintenance', doc: 'storage', result: 'ok',
    title: t(`Log Switch — Group ${old.group} → Group ${next.group}`, `Log switch — group ${old.group} → group ${next.group}`),
    body: t(
      `Online Redo Log Group ${old.group} 이(가) 다 찼어요(${filled.toLocaleString()} bytes). LGWR 는 여기서 쓰기를 멈추고 다음 그룹으로 넘어가요. Online Redo Log 는 그룹 여러 개를 돌려 가며 쓰는 원형 구조라서, 마지막 그룹까지 쓰면 다시 첫 그룹으로 돌아와요.`,
      `Online redo log group ${old.group} is full (${filled.toLocaleString()} bytes). LGWR stops writing to it and moves to the next group. The online redo log is used in a circular fashion: after the last group, LGWR returns to the first.`,
    ),
    facts: [
      t(
        `Group ${next.group} 이(가) CURRENT 가 되고 새 Log Sequence Number ${next.sequence} 을(를) 받았어요.`,
        `Group ${next.group} becomes CURRENT and is assigned the new log sequence number ${next.sequence}.`,
      ),
      t(
        `Group ${old.group} 은(는) ACTIVE 상태예요. 그 안에 적힌 변경 중 아직 Data File 에 안 내려간 것이 있어서, 지금 장애가 나면 Instance Recovery 에 이 그룹이 필요해요.`,
        `Group ${old.group} is now ACTIVE: some changes it describes are not in the data files yet, so instance recovery would still need it if the instance failed now.`,
      ),
    ],
    active: ['lgwr', 'redo-logs'],
    flows: [['lgwr', 'redo-logs']],
  })

  s.archivedLogs++
  run.step({
    key: 'archive', stage: 'maintenance', doc: 'process', result: 'ok',
    title: t(`ARCn — Log Sequence ${old.sequence} 보관`, `ARCn — archive log sequence ${old.sequence}`),
    body: t(
      `ARCHIVELOG 모드에서는 Log Switch 가 일어날 때마다 Archiver 프로세스(ARCn)가 다 찬 그룹을 Archived Redo Log File 로 복사해요. 이 복사가 끝나야만 LGWR 가 그 그룹을 다시 덮어쓸 수 있어요.`,
      `In ARCHIVELOG mode, every log switch makes the archiver process (ARCn) copy the filled group to an archived redo log file. Only after this copy completes may LGWR overwrite that group.`,
    ),
    facts: [
      t(
        'Online Redo Log 는 덮어쓰이지만 Archived Redo Log 는 계속 쌓여요. 백업본에 이 로그들을 차례로 적용하면 디스크가 망가져도 원하는 시점까지 되살릴 수 있어요(Media Recovery).',
        'Online redo logs get overwritten, but archived redo logs accumulate. Applying them in order to a backup recovers the database to any point in time even after a disk loss (media recovery).',
      ),
      t(`지금까지 보관된 로그: ${s.archivedLogs}개`, `Archived logs so far: ${s.archivedLogs}`),
    ],
    active: ['arc', 'redo-logs', 'archive-logs'],
    flows: [['redo-logs', 'archive-logs']],
  })

  // Log Switch 는 Checkpoint 를 일으킨다 — 다 찬 그룹을 다시 쓸 수 있게 만들기 위해서
  checkpoint(run, t(
    `Log Switch 가 이 Checkpoint 를 일으켰어요. ACTIVE 상태인 Group ${old.group} 을(를) 다시 쓸 수 있게 하려면, 그 안에 적힌 변경을 전부 Data File 에 내려야 하거든요.`,
    `The log switch triggered this checkpoint: before ACTIVE group ${old.group} can be reused, every change it describes must reach the data files.`,
  ))
}

export function runCommand(state: InstanceState, command: InstanceCommand): Trace {
  const run = new Run(state)
  const s = run.s
  const base = { notApplicable: ALL_STAGES }

  if (command === 'checkpoint') {
    checkpoint(run)
    return run.finish('ALTER SYSTEM CHECKPOINT', 'command', { ...base, outcome: t('시스템이 변경되었습니다.', 'System altered.') })
  }

  if (command === 'flush-buffer-cache') {
    if (s.buffers.some((b) => b.state === 'dirty')) checkpoint(run)
    const used = s.buffers.filter((b) => b.state !== 'free')
    for (const b of s.buffers) Object.assign(b, { block: null, state: 'free', touch: 0, uncommitted: false })
    run.step({
      key: 'flush-bc', stage: 'maintenance', doc: 'memory', result: 'ok',
      title: t('Buffer Cache 비우기', 'Flush the buffer cache'),
      body: t(
        `버퍼 ${used.length}개를 전부 빈(Unused) 버퍼로 돌려놨어요. 다음에 실행하는 SQL 은 모든 블록을 Data File 에서 다시 읽어야 해요(Physical Read). 같은 SQL 을 두 번 실행해서 physical reads 가 어떻게 달라지는지 비교해 보세요.`,
        `All ${used.length} buffers were returned to the unused state. The next SQL must read every block from the data files again (physical reads). Run the same SQL twice and compare its physical reads.`,
      ),
      facts: [t('실험용 명령이에요. 운영 중인 DB 에서 쓰면 한동안 모든 SQL 이 느려져요.', 'This is a testing command — on a production database it slows every statement for a while.')],
      active: ['buffer-cache'],
    })
    return run.finish('ALTER SYSTEM FLUSH BUFFER_CACHE', 'command', { ...base, outcome: t('시스템이 변경되었습니다.', 'System altered.') })
  }

  const cursors = s.cursors.length
  const objects = s.dictCache.length
  s.cursors = []
  s.dictCache = []
  run.step({
    key: 'flush-sp', stage: 'maintenance', doc: 'memory', result: 'ok',
    title: t('Shared Pool 비우기', 'Flush the shared pool'),
    body: t(
      `Library Cache 의 커서 ${cursors}개와 Data Dictionary Cache 의 객체 정보 ${objects}개를 내보냈어요. 다음에 실행하는 SQL 은 전에 실행한 적이 있어도 Hard Parse 부터 다시 해야 해요.`,
      `${cursors} cursor${cursors === 1 ? '' : 's'} in the library cache and ${objects} object definition${objects === 1 ? '' : 's'} in the data dictionary cache were discarded. The next SQL needs a hard parse again, even if it has run before.`,
    ),
    facts: [t('실행 계획이 메모리에만 있다는 걸 보여 주는 실험이에요. 인스턴스를 재시작해도 같은 일이 일어나요.', 'It shows that execution plans live only in memory — restarting the instance has the same effect.')],
    active: ['library-cache', 'dict-cache'],
  })
  return run.finish('ALTER SYSTEM FLUSH SHARED_POOL', 'command', { ...base, outcome: t('시스템이 변경되었습니다.', 'System altered.') })
}
