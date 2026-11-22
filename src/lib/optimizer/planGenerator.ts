// ─── Oracle Optimizer: Query Transformer → Estimator → Plan Generator ─────
// Hard Parse 때만 실행되는 "Optimization" 단계 전체.
// 마지막에 Row Source Generator 가 쓸 Row Source Tree(planNodes)까지 만들어 준다.

import type {
  AccessPath, JoinCondition, JoinMethod, JoinOrderCandidate, JoinStep, L, OptimizerResult,
  ParsedQuery, PlanNode, PlanNodeKind, Predicate, TableAccessPlan, TableEstimate,
} from './types'
import { estimateTable, generateAccessPaths, innerProbePath } from './estimator'
import { getColumnStats, getIndexOn, getTableStats, isUniqueLookup } from './stats'

const round1 = (n: number) => Math.round(n * 10) / 10

// ── Phase 1: Query Transformer ────────────────────────────────────────────

function transform(input: ParsedQuery): { query: ParsedQuery; transformations: L[]; warnings: L[] } {
  const transformations: L[] = []
  const warnings: L[] = [...input.hintNotes]
  const predicates = [...input.predicates]
  let hasDistinct = input.hasDistinct

  // Subquery Unnesting: IN / EXISTS 서브쿼리 → Semi Join (파서가 이미 조인 조건 모양으로 넘겨준다)
  for (const j of input.joins) {
    if (j.type !== 'SEMI') continue
    const sub = input.tables.find((t) => t.alias === j.optionalAlias)
    transformations.push({
      ko: `Subquery Unnesting(서브쿼리 풀어내기): 서브쿼리를 따로 실행하지 않고 ${sub?.name} 과의 Semi Join 으로 바꿨어요 (${j.text}). Semi Join 은 짝을 하나만 찾으면 바로 다음 행으로 넘어가서, 서브쿼리 쪽에 같은 값이 여러 개 있어도 결과가 불어나지 않아요.`,
      en: `Subquery unnesting: instead of running the subquery separately, it is merged into the outer query as a semijoin with ${sub?.name} (${j.text}). A semijoin stops at the first match, so duplicate values on the subquery side never multiply the result.`,
    })
  }

  // Outer Join → Inner Join: NULL 이 채워지는 쪽 테이블에 NULL 을 걸러 내는 조건이 있으면 Outer 의 의미가 없다
  const joins: JoinCondition[] = input.joins.map((j) => {
    if (j.type !== 'LEFT' || !j.optionalAlias) return j
    const rejecting = predicates.find((p) => p.alias === j.optionalAlias && p.operator !== 'IS NULL' && p.orGroup === undefined)
    if (!rejecting) return j
    transformations.push({
      ko: `Outer Join → Inner Join 변환: ${rejecting.text} 조건이 NULL 로 채워진 행을 어차피 걸러 내므로, Outer Join 을 일반 조인으로 바꿔 조인 순서를 자유롭게 정해요.`,
      en: `Outer-to-inner join conversion: ${rejecting.text} rejects the null-extended rows anyway, so the outer join becomes an inner join and the join order is no longer fixed.`,
    })
    return { ...j, type: 'INNER', optionalAlias: undefined }
  })

  // Transitive Closure: A.x = B.x AND A.x = 상수  ⇒  B.x = 상수 도 참
  for (const j of joins) {
    if (j.type !== 'INNER' && j.type !== 'SEMI') continue
    const sides = [
      { from: { a: j.leftAlias, c: j.leftColumn }, to: { a: j.rightAlias, c: j.rightColumn } },
      { from: { a: j.rightAlias, c: j.rightColumn }, to: { a: j.leftAlias, c: j.leftColumn } },
    ]
    for (const { from, to } of sides) {
      for (const p of [...predicates]) {
        if (p.alias !== from.a || p.column !== from.c || p.wrapped || p.orGroup !== undefined || p.generated) continue
        if (!['=', 'IN', '<', '>', '<=', '>=', 'BETWEEN'].includes(p.operator)) continue
        if (predicates.some((q) => q.alias === to.a && q.column === to.c && q.operator === p.operator)) continue
        const text = p.text.replace(new RegExp(`^(\\w+\\.)?${from.c}`), `${to.a}.${to.c}`)
        predicates.push({ ...p, alias: to.a, column: to.c, generated: true, text })
        transformations.push({
          ko: `Transitive Closure(조건 전이): ${j.text} 이고 ${p.text} 이니까 ${text} 도 성립해요. 이 조건을 새로 만들어 반대쪽 테이블도 일찍 걸러 내요.`,
          en: `Transitive closure: since ${j.text} and ${p.text}, ${text} must also hold. The generated predicate filters the other table early.`,
        })
      }
    }
  }

  if (input.tables.length - input.semiAliases.length > 1 && input.predicates.length > 0) {
    transformations.push({
      ko: 'Predicate Pushing: WHERE 조건을 조인하기 전, 각 테이블을 읽는 단계로 내려보내요. 조인에 들어가는 행 수가 줄어요.',
      en: 'Predicate pushing: WHERE filters are applied while each table is read, before the join, so fewer rows enter the join.',
    })
  }

  if (hasDistinct && input.tables.length === 1) {
    const ref = input.tables[0]
    const used = input.usedColumns[ref.alias] ?? []
    const uniqueCol = used.find((c) => { const ix = getIndexOn(ref.name, c); return ix !== null && isUniqueLookup(ix) })
    if (uniqueCol && !input.selectAll) {
      hasDistinct = false
      transformations.push({
        ko: `Distinct Elimination: SELECT 목록에 Unique 컬럼 ${uniqueCol} 이 있어 중복이 생길 수 없어요. DISTINCT 를 없애 정렬·해시 작업을 생략해요.`,
        en: `Distinct elimination: the select list contains unique column ${uniqueCol}, so duplicates are impossible. DISTINCT is removed and no sort/hash is needed.`,
      })
    }
  }

  if (input.hasOr) {
    transformations.push({
      ko: 'OR Expansion 검토: OR 로 묶인 조건을 UNION ALL 가지 여러 개로 쪼개면 가지마다 인덱스를 쓸 수 있어요. 이 시뮬레이터는 쪼개지 않고 하나의 필터로 계산해요.',
      en: 'OR expansion considered: splitting OR branches into UNION ALL branches could let each use an index. This simulator keeps them as one filter.',
    })
  }
  if (input.inexact) {
    warnings.push({
      ko: '등호(=)가 아닌 조인 조건은 이 시뮬레이터가 계산에 넣지 않아요. 결과 행 수는 추정치로 보여 줘요.',
      en: 'Join conditions other than equality are not modelled by the simulator; the row count shown is an estimate.',
    })
  }

  for (const p of input.predicates) {
    if (p.wrapped && p.orGroup === undefined && getIndexOn(input.tables.find((t) => t.alias === p.alias)?.name ?? '', p.column)) {
      warnings.push({
        ko: `${p.text}: 인덱스 컬럼 ${p.column} 을 가공하거나 부정 조건으로 써서 인덱스를 탈 수 없어요. 컬럼은 그대로 두고 비교 값을 바꿔 보세요.`,
        en: `${p.text}: indexed column ${p.column} is wrapped in an expression or negated, so its index cannot be used. Keep the column bare and transform the compared value instead.`,
      })
    }
  }

  if (transformations.length === 0) {
    transformations.push({
      ko: '적용할 변환이 없어요. 문장이 이미 가장 단순한 형태예요.',
      en: 'No transformation applies; the statement is already in its simplest form.',
    })
  }
  return { query: { ...input, predicates, joins, hasDistinct }, transformations, warnings }
}

// ── Phase 3: Plan Generator — join order & method ─────────────────────────

interface JoinEval {
  steps: JoinStep[]
  cost: number
  rows: number
  order: string[]
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]))
}

const sortCost = (n: number) => 1 + n * Math.log2(n + 1) * 0.02

function evaluateOrder(
  order: string[],
  query: ParsedQuery,
  estimates: Record<string, TableEstimate>,
  access: Record<string, TableAccessPlan>,
): JoinEval | null {
  const nameOf = (alias: string) => query.tables.find((t) => t.alias === alias)!
  // Outer Join 은 보존되는 쪽이, Semi Join 은 바깥 질의 쪽이 먼저 와야 한다
  for (const j of query.joins) {
    if ((j.type !== 'LEFT' && j.type !== 'SEMI') || !j.optionalAlias) continue
    const preserved = j.leftAlias === j.optionalAlias ? j.rightAlias : j.leftAlias
    if (order.indexOf(j.optionalAlias) < order.indexOf(preserved)) return null
  }
  const joined = [order[0]]
  let cost = access[order[0]].chosen.cost
  let rows = estimates[order[0]].cardinality
  const steps: JoinStep[] = []

  for (const alias of order.slice(1)) {
    const ref = nameOf(alias)
    const est = estimates[alias]
    const best = access[alias].chosen
    const conds = query.joins.filter(
      (j) => (j.leftAlias === alias && joined.includes(j.rightAlias)) || (j.rightAlias === alias && joined.includes(j.leftAlias)),
    )
    const leftLabel = joined.map((a) => nameOf(a).name).join(' ⋈ ')
    if (conds.length === 0) {
      // 조인 조건이 없는 테이블 → Cartesian Product
      const outRows = rows * est.cardinality
      cost = round1(cost + best.cost + sortCost(est.cardinality) + outRows * 0.02)
      steps.push({
        leftLabel, rightAlias: alias, rightTable: ref.name, method: 'SORT_MERGE_JOIN', type: 'INNER', conditionText: '',
        inputCardinality: { left: rows, right: est.cardinality }, outputCardinality: outRows, cost, candidates: [], inner: best,
        reason: {
          ko: '두 집합을 이어 줄 조인 조건이 없어서 모든 행 조합을 만드는 Cartesian Join 이 돼요.',
          en: 'No join condition links the two sets, so every row combination is produced (Cartesian join).',
        },
      })
      rows = outRows
      joined.push(alias)
      continue
    }

    const type = conds.some((j) => j.type === 'SEMI') ? 'SEMI' : conds.some((j) => j.type === 'FULL') ? 'FULL' : conds.some((j) => j.type === 'LEFT') ? 'LEFT' : 'INNER'
    let joinSel = 1
    let semiSel = 1
    for (const j of conds) {
      const mine = j.leftAlias === alias ? j.leftColumn : j.rightColumn
      const otherAlias = j.leftAlias === alias ? j.rightAlias : j.leftAlias
      const other = j.leftAlias === alias ? j.rightColumn : j.leftColumn
      const mineNdv = getColumnStats(ref.name, mine)?.ndv ?? 1
      const otherNdv = getColumnStats(nameOf(otherAlias).name, other)?.ndv ?? 1
      joinSel *= 1 / Math.max(mineNdv, otherNdv)
      // Semi Join: 서브쿼리 쪽에 남은 키 종류 / 바깥 쪽 키 종류 만큼의 바깥 행이 살아남는다
      semiSel *= Math.min(1, Math.max(1, mineNdv * est.selectivity) / otherNdv)
    }
    let outRows = Math.max(1, Math.round(type === 'SEMI' ? rows * semiSel : rows * est.cardinality * joinSel))
    if (type === 'LEFT') outRows = Math.max(outRows, rows)
    if (type === 'FULL') outRows = Math.max(outRows, rows, est.cardinality)

    const first = conds[0]
    const joinCol = first.leftAlias === alias ? first.leftColumn : first.rightColumn
    const probe = innerProbePath(ref, joinCol, query, est, best)
    const indexed = probe !== best
    const candidates: { method: JoinMethod; cost: number }[] = [
      { method: 'HASH_JOIN', cost: round1(cost + best.cost + 0.5 + rows * 0.03 + est.cardinality * 0.02) },
    ]
    if (type !== 'FULL') {
      candidates.push(
        { method: 'NESTED_LOOPS', cost: round1(cost + rows * probe.cost) },
        { method: 'SORT_MERGE_JOIN', cost: round1(cost + best.cost + sortCost(rows) + sortCost(est.cardinality)) },
      )
    }
    candidates.sort((a, b) => a.cost - b.cost)
    const chosen = candidates[0]
    const reasons: Record<JoinMethod, L> = {
      NESTED_LOOPS: indexed
        ? {
            ko: `바깥(Outer) 쪽이 ${rows}행뿐이고 ${ref.name}.${joinCol} 에 인덱스가 있어요. 행마다 인덱스로 콕 집어 찾는 편이 가장 싸요.`,
            en: `The outer side has only ${rows} rows and ${ref.name}.${joinCol} is indexed, so probing the index once per row is cheapest.`,
          }
        : {
            ko: `바깥(Outer) 쪽이 ${rows}행뿐이라, 행마다 ${ref.name} 을 다시 읽어도 가장 싸요.`,
            en: `The outer side has only ${rows} rows, so re-reading ${ref.name} for each of them is still cheapest.`,
          },
      HASH_JOIN: {
        ko: `먼저 읽은 ${rows}행으로 PGA 에 해시 테이블을 만들고(Build), ${ref.name} 을 한 번만 읽으면서 맞는 짝을 찾아요(Probe). 행이 많을수록 유리해요.`,
        en: `Builds a hash table in the PGA from the first ${rows} rows, then reads ${ref.name} once and probes it. This wins as row counts grow.`,
      },
      SORT_MERGE_JOIN: {
        ko: '양쪽을 조인 키로 정렬한 뒤 지퍼처럼 맞물려 가며 합쳐요.',
        en: 'Sorts both inputs on the join key and merges them like a zipper.',
      },
    }
    cost = chosen.cost
    steps.push({
      leftLabel, rightAlias: alias, rightTable: ref.name, method: chosen.method, type,
      conditionText: conds.map((j) => j.text).join(' AND '),
      inputCardinality: { left: rows, right: est.cardinality }, outputCardinality: outRows, cost, candidates,
      inner: chosen.method === 'NESTED_LOOPS' ? probe : best,
      reason: reasons[chosen.method],
    })
    rows = outRows
    joined.push(alias)
  }
  return { steps, cost, rows, order }
}

// ── Row Source Tree ───────────────────────────────────────────────────────

interface Tree {
  operation: string
  name?: string
  rows: number
  cost: number
  kind: PlanNodeKind
  alias?: string
  access?: string
  filter?: string
  pstart?: string
  pstop?: string
  tq?: string
  inOut?: string
  distrib?: string
  children: Tree[]
}

// DBMS_XPLAN 의 Predicate Information 처럼 식별자에 큰따옴표를 붙인다 (문자열 리터럴·바인드 변수는 그대로)
const quote = (text: string) =>
  text
    .split(/('[^']*')/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(/(?<!:)\b([A-Z_][A-Z0-9_$#]*)\b(?!\()/g, (m) => (/^(AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|UPPER|LOWER|NVL|TRUNC|SUBSTR|TO_CHAR|TO_DATE)$/.test(m) ? m : `"${m}"`)),
    )
    .join('')

function accessTree(path: AccessPath, rows: number, preds: Predicate[], joinAccess?: string): Tree {
  const rest = preds.filter((p) => p.alias === path.alias && p !== path.accessPredicate)
  // 같은 orGroup 끼리는 (a OR b) 로 묶고, 나머지는 AND 로 잇는다
  const groups = new Map<number, string[]>()
  const parts: string[] = []
  for (const p of rest) {
    if (p.orGroup === undefined) parts.push(p.text)
    else groups.set(p.orGroup, [...(groups.get(p.orGroup) ?? []), p.text])
  }
  for (const g of groups.values()) parts.push(parts.length > 0 || groups.size > 1 ? `(${g.join(' OR ')})` : g.join(' OR '))
  const filter = parts.length > 0 ? quote(parts.join(' AND ')) : undefined
  if (path.type === 'FULL_TABLE_SCAN' || !path.index) {
    const scan: Tree = { operation: 'TABLE ACCESS FULL', name: path.tableName, rows, cost: path.cost, kind: 'table', alias: path.alias, filter, children: [] }
    const pa = path.partitions
    if (!pa) return scan
    // 파티션 테이블: PARTITION RANGE 가 파티션을 하나씩 돌며 그 아래 Full Scan 을 시킨다
    const range = { pstart: pa.pstart, pstop: pa.pstop }
    return { operation: `PARTITION RANGE ${pa.kind}`, rows, cost: path.cost, kind: 'partition', alias: path.alias, ...range, children: [{ ...scan, ...range }] }
  }
  // 파티션 테이블의 일반(Non-partitioned) 인덱스 = Global Index. ROWID 가 어느 파티션인지까지 알려 준다
  const global = getTableStats(path.tableName)?.partitioning ? { word: ' GLOBAL', pstart: 'ROWID', pstop: 'ROWID' } : null
  const access = joinAccess ?? (path.accessPredicate ? quote(path.accessPredicate.text) : undefined)
  if (path.type === 'INDEX_FAST_FULL_SCAN') {
    return { operation: 'INDEX FAST FULL SCAN', name: path.index.indexName, rows, cost: path.cost, kind: 'index', alias: path.alias, filter, children: [] }
  }
  const unique = path.type === 'INDEX_UNIQUE_SCAN'
  const indexNode: Tree = {
    operation: unique ? 'INDEX UNIQUE SCAN' : 'INDEX RANGE SCAN', name: path.index.indexName, rows,
    cost: round1(path.indexOnly ? path.cost : Math.max(1, path.cost - 1)), kind: 'index', alias: path.alias, access,
    filter: path.indexOnly ? filter : undefined, children: [],
  }
  if (path.indexOnly) return indexNode
  return {
    operation: `TABLE ACCESS BY${global?.word ?? ''} INDEX ROWID${unique ? '' : ' BATCHED'}`,
    name: path.tableName, rows, cost: path.cost, kind: 'table', alias: path.alias, filter, children: [indexNode],
    pstart: global?.pstart, pstop: global?.pstop,
  }
}

function flatten(root: Tree): PlanNode[] {
  const nodes: PlanNode[] = []
  const walk = (t: Tree, depth: number): number => {
    const node: PlanNode = {
      id: nodes.length, depth, operation: t.operation, name: t.name, rows: t.rows, cost: Math.max(1, Math.round(t.cost)),
      kind: t.kind, alias: t.alias, access: t.access, filter: t.filter,
      pstart: t.pstart, pstop: t.pstop, tq: t.tq, inOut: t.inOut, distrib: t.distrib, children: [],
    }
    nodes.push(node)
    node.children = t.children.map((c) => walk(c, depth + 1))
    return node.id
  }
  walk(root, 0)
  return nodes
}

function hashPlan(nodes: PlanNode[]): number {
  let h = 2166136261
  for (const ch of nodes.map((n) => `${n.depth}${n.operation}${n.name ?? ''}`).join('|')) {
    h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  }
  return h >>> 0
}

// ── Parallel Execution: 직렬 Row Source Tree → PX 계획 ──────────────────────
// Oracle 의 병렬 계획은 DFO(Data Flow Operation) 단위로 나뉜다. 한 DFO 는 한 PX 서버 집합이 맡고,
// DFO 사이는 Table Queue(:TQ10000 …)로 행을 주고받는다. 마지막엔 PX SEND QC 로 Query Coordinator 에게 보낸다.
//   IN-OUT:  PCWP = 같은 서버 집합 안에서 이어서 처리 · PCWC = 자식과 같은 서버가 처리
//            P->P = 다른 서버 집합으로 재분배 · P->S = 병렬 → 직렬(QC)

/** PARALLEL_MAX_SERVERS — 인스턴스 전체의 PX 서버 수 (다이어그램의 P000~P007) */
export const PX_MAX_SERVERS = 8
/** Build 쪽 예상 행 수가 이 이하면 해시로 나누지 않고 모든 PX 서버에 통째로 복사(BROADCAST)한다 */
const BROADCAST_ROWS = 30

interface Stream { tree: Tree; dfo: number }

class PxComposer {
  private tqSeq = 0
  dfos = 0

  label(dfo: number) { return `Q1,${String(dfo).padStart(2, '0')}` }
  private queue() { return `:TQ1${String(this.tqSeq++).padStart(4, '0')}` }
  get queues() { return this.tqSeq }

  /** 이 DFO 의 서버 집합이 처리한다고 표시 (자식 전체) */
  private mark(t: Tree, dfo: number): Tree {
    return { ...t, tq: this.label(dfo), inOut: t.inOut ?? 'PCWP', children: t.children.map((c) => this.mark(c, dfo)) }
  }

  /** Full Scan 잎 → PX BLOCK ITERATOR: 블록 범위(Granule)를 PX 서버들에게 나눠 준다 */
  scan(t: Tree): Stream | null {
    const isFull = t.operation === 'TABLE ACCESS FULL' || t.operation === 'INDEX FAST FULL SCAN'
    const isPart = t.kind === 'partition' && t.children[0]?.operation === 'TABLE ACCESS FULL'
    if (!isFull && !isPart) return null
    const dfo = this.dfos++
    const leaf = isPart ? t.children[0] : t
    return {
      dfo,
      tree: {
        operation: 'PX BLOCK ITERATOR', rows: t.rows, cost: t.cost, kind: 'px', alias: t.alias,
        pstart: t.pstart, pstop: t.pstop, tq: this.label(dfo), inOut: 'PCWC',
        children: [this.mark(leaf, dfo)],
      },
    }
  }

  /** P->P 재분배: 생산자 DFO 가 PX SEND, 소비자 DFO 가 PX RECEIVE */
  send(s: Stream, distrib: 'HASH' | 'RANGE' | 'BROADCAST', to: number): Tree {
    const sendNode: Tree = {
      operation: `PX SEND ${distrib}`, name: this.queue(), rows: s.tree.rows, cost: s.tree.cost, kind: 'px',
      tq: this.label(s.dfo), inOut: 'P->P', distrib, children: [s.tree],
    }
    return { operation: 'PX RECEIVE', rows: s.tree.rows, cost: s.tree.cost, kind: 'px', tq: this.label(to), inOut: 'PCWP', children: [sendNode] }
  }

  /** P->S: 결과를 Query Coordinator 에게. ORDER = 정렬 순서대로 받아야 할 때 */
  toQC(s: Stream, ordered: boolean): Tree {
    const sendNode: Tree = {
      operation: `PX SEND QC (${ordered ? 'ORDER' : 'RANDOM'})`, name: this.queue(), rows: s.tree.rows, cost: s.tree.cost, kind: 'px',
      tq: this.label(s.dfo), inOut: 'P->S', distrib: ordered ? 'QC (ORDER)' : 'QC (RAND)', children: [s.tree],
    }
    return { operation: 'PX COORDINATOR', rows: s.tree.rows, cost: s.tree.cost, kind: 'px', children: [sendNode] }
  }

  /** 같은 DFO 안에서 연산 하나를 더 얹는다 */
  op(s: Stream, operation: string, kind: PlanNodeKind, rows: number, extra = 0): Stream {
    return { dfo: s.dfo, tree: { operation, rows, cost: round1(s.tree.cost + extra), kind, tq: this.label(s.dfo), inOut: 'PCWP', children: [s.tree] } }
  }

  /** 조인까지 포함한 직렬 트리를 병렬 Stream 으로. 병렬로 못 바꾸는 모양이면 null */
  build(t: Tree, broadcasts: string[]): Stream | null {
    if (t.kind !== 'join') return this.scan(t)
    const [l, r] = t.children
    if (t.operation.startsWith('NESTED LOOPS')) {
      // 바깥쪽만 나눠 읽고, 각 PX 서버가 자기 행마다 안쪽 인덱스를 찾아간다
      const L = this.build(l, broadcasts)
      if (!L) return null
      return { dfo: L.dfo, tree: { ...t, tq: this.label(L.dfo), inOut: 'PCWP', children: [L.tree, this.mark(r, L.dfo)] } }
    }
    if (!t.operation.startsWith('HASH JOIN')) return null
    const L = this.build(l, broadcasts)
    const R = this.build(r, broadcasts)
    if (!L || !R) return null
    // Inner Join 이고 Build 쪽이 작으면 BROADCAST. Outer·Semi 는 복사하면 결과가 틀어지므로 HASH 로 나눈다
    const inner = !/OUTER|SEMI/.test(t.operation)
    if (inner && l.rows <= BROADCAST_ROWS) {
      broadcasts.push(l.name ?? l.children[0]?.name ?? '')
      return { dfo: R.dfo, tree: { ...t, tq: this.label(R.dfo), inOut: 'PCWP', children: [this.send(L, 'BROADCAST', R.dfo), R.tree] } }
    }
    const dfo = this.dfos++
    return {
      dfo,
      tree: {
        ...t, operation: `${t.operation} BUFFERED`, tq: this.label(dfo), inOut: 'PCWP',
        children: [this.send(L, 'HASH', dfo), this.send(R, 'HASH', dfo)],
      },
    }
  }
}

// ── Main entry point ──────────────────────────────────────────────────────

export function optimize(input: ParsedQuery): OptimizerResult {
  const { query, transformations, warnings } = transform(input)

  // INSERT … VALUES 는 고를 Access Path 가 없다
  if (query.type === 'INSERT') {
    const table = query.tables[0].name
    const planNodes = flatten({
      operation: 'INSERT STATEMENT', rows: 1, cost: 1, kind: 'statement',
      children: [{ operation: 'LOAD TABLE CONVENTIONAL', name: table, rows: 1, cost: 1, kind: 'dml', children: [] }],
    })
    return {
      query,
      transformations: [{ ko: 'INSERT … VALUES 는 읽을 대상이 없어서 변환할 것이 없어요.', en: 'INSERT … VALUES reads nothing, so there is nothing to transform.' }],
      estimates: [], tableAccessPlans: [], joinSteps: [], joinOrders: [], plansConsidered: 1,
      planNodes, planHash: hashPlan(planNodes), totalCost: 1, estimatedRows: 1, warnings,
    }
  }

  // ── Phase 2: Estimator ──
  const estimates: Record<string, TableEstimate> = {}
  const access: Record<string, TableAccessPlan> = {}
  let plansConsidered = 0
  for (const ref of query.tables) {
    const est = estimateTable(ref, query.predicates)
    const paths = generateAccessPaths(ref, query, est)
    estimates[ref.alias] = est
    access[ref.alias] = { alias: ref.alias, tableName: ref.name, accessPaths: paths, chosen: paths.find((p) => p.chosen) ?? paths[0] }
    plansConsidered += paths.length
    if (!getTableStats(ref.name)) {
      warnings.push({ ko: `${ref.name}: 통계가 없어요. DBMS_STATS 로 통계를 모아야 해요.`, en: `${ref.name}: no statistics. Gather them with DBMS_STATS.` })
    }
  }

  // ── Phase 3: Plan Generator ──
  const aliases = query.tables.map((t) => t.alias)
  let best: JoinEval = { steps: [], cost: access[aliases[0]].chosen.cost, rows: estimates[aliases[0]].cardinality, order: aliases }
  const joinOrders: JoinOrderCandidate[] = []
  if (aliases.length > 1) {
    const fixed = aliases.length > 5 || query.joins.some((j) => j.type === 'FULL')
    const evals = (fixed ? [aliases] : permutations(aliases))
      .map((order) => evaluateOrder(order, query, estimates, access))
      .filter((e): e is JoinEval => e !== null)
    plansConsidered += evals.reduce((n, e) => n + e.steps.reduce((m, s) => m + Math.max(1, s.candidates.length), 0), 0)
    best = evals.reduce((a, b) => (b.cost < a.cost ? b : a), evals[0])
    const nameOf = (alias: string) => query.tables.find((t) => t.alias === alias)!.name
    joinOrders.push(
      ...[...evals].sort((a, b) => a.cost - b.cost).slice(0, 4)
        .map((e) => ({ order: e.order.map(nameOf), cost: e.cost, chosen: e === best })),
    )
  }

  // ── Row Source Tree ──
  const firstAlias = best.order[0]
  let tree = accessTree(access[firstAlias].chosen, estimates[firstAlias].cardinality, query.predicates)
  for (const step of best.steps) {
    // NL 의 inner 쪽 Rows 는 "바깥 행 하나당" 예상 행 수
    const right = accessTree(
      step.inner,
      step.method === 'NESTED_LOOPS' && step.inner.index ? step.inner.cardinality : estimates[step.rightAlias].cardinality,
      query.predicates,
      step.method === 'NESTED_LOOPS' && step.inner.index ? quote(step.conditionText) : undefined,
    )
    const outer = step.type === 'LEFT' ? ' OUTER' : step.type === 'FULL' ? ' FULL OUTER' : step.type === 'SEMI' ? ' SEMI' : ''
    const common = { rows: step.outputCardinality, cost: step.cost, kind: 'join' as const }
    if (step.conditionText === '') {
      tree = { ...common, operation: 'MERGE JOIN CARTESIAN', children: [tree, { operation: 'BUFFER SORT', rows: right.rows, cost: right.cost, kind: 'sort', children: [right] }] }
    } else if (step.method === 'NESTED_LOOPS') {
      tree = { ...common, operation: `NESTED LOOPS${outer}`, children: [tree, right] }
    } else if (step.method === 'HASH_JOIN') {
      tree = { ...common, operation: `HASH JOIN${outer}`, access: quote(step.conditionText), children: [tree, right] }
    } else {
      tree = {
        ...common, operation: `MERGE JOIN${outer}`, access: quote(step.conditionText),
        children: [
          { operation: 'SORT JOIN', rows: tree.rows, cost: tree.cost + 1, kind: 'sort', children: [tree] },
          { operation: 'SORT JOIN', rows: right.rows, cost: right.cost + 1, kind: 'sort', children: [right] },
        ],
      }
    }
  }

  let rows = best.rows
  let cost = best.cost
  const wrap = (operation: string, kind: PlanNodeKind, outRows: number, extra: number) => {
    rows = outRows
    cost = round1(cost + extra)
    tree = { operation, rows, cost, kind, children: [tree] }
  }
  // GROUP BY 와 ORDER BY 의 컬럼이 같으면 정렬 한 번으로 그룹 짓기와 줄 세우기를 함께 끝낸다
  const sameKeys = query.hasGroupBy && query.hasOrderBy && query.orderItems === query.orderBy.length
    && query.orderBy.length === query.groupBy.length
    && query.orderBy.every((o, i) => o.alias === query.groupBy[i].alias && o.column === query.groupBy[i].column)
  const groups = query.groupBy.reduce((g, c) => g * (getColumnStats(query.tables.find((t) => t.alias === c.alias)!.name, c.column)?.ndv ?? 1), 1)

  // ── Parallel: PARALLEL 힌트가 있고, 계획이 병렬로 나눌 수 있는 모양일 때 ──
  const done = { group: false, distinct: false, order: false }
  let parallel: OptimizerResult['parallel']
  if (query.type !== 'SELECT' && input.parallel) {
    warnings.push({
      ko: `PARALLEL 힌트는 ${query.type} 의 변경 작업에는 적용되지 않았어요. 병렬 DML 은 세션에서 ALTER SESSION ENABLE PARALLEL DML 을 먼저 켜야 해요. 이 시뮬레이터는 질의(SELECT)만 병렬로 실행해요.`,
      en: `The PARALLEL hint was not applied to the ${query.type}. Parallel DML must first be enabled with ALTER SESSION ENABLE PARALLEL DML; this simulator parallelizes queries (SELECT) only.`,
    })
  } else if (query.type === 'SELECT' && query.parallel) {
    const px = new PxComposer()
    const broadcasts: string[] = []
    const stream = px.build(tree, broadcasts)
    if (!stream) {
      warnings.push({
        ko: 'PARALLEL 힌트가 있지만 직렬 계획을 골랐어요. 병렬 실행은 블록을 나눠 읽는 Full Scan 에서 시작하는데, 이 문장은 인덱스로 몇 행만 콕 집어 읽는 쪽을 골랐거든요(Unique 인덱스에 = 조건이면 결과가 많아야 1행이라 그 인덱스를 바로 써요). 힌트는 "병렬로 하면 이 DOP 로 해라"는 뜻이지, 무조건 병렬로 하라는 명령이 아니에요.',
        en: 'The PARALLEL hint is present, but a serial plan was chosen. Parallel execution starts from a full scan whose blocks are shared out, and here the optimizer picks a few rows through an index instead (an equality on a unique index returns at most one row, so that index is used right away). The hint means "if you go parallel, use this DOP", not "always go parallel".',
      })
    } else {
      let s = stream
      let ordered = false
      const n = query.fetchFirst
      if (query.limitKind !== 'rownum') {
        if (query.hasGroupBy) {
          const out = Math.max(1, Math.min(rows, groups))
          if (sameKeys) {
            const d = px.dfos++
            s = px.op({ dfo: d, tree: px.send(s, 'RANGE', d) }, 'SORT GROUP BY', 'sort', out, 1)
            ordered = true
          } else {
            // GROUP BY Pushdown: 생산자 쪽에서 먼저 한 번 묶어 보내면 주고받는 행이 줄어든다
            s = px.op(s, 'HASH GROUP BY', 'hash', out, 0.5)
            const d = px.dfos++
            s = px.op({ dfo: d, tree: px.send(s, 'HASH', d) }, 'HASH GROUP BY', 'hash', out, 0.5)
          }
          rows = out
          done.group = true
        } else if (query.hasAggregate) {
          s = px.op(s, 'SORT AGGREGATE', 'sort', 1)   // PX 서버마다 부분 집계 → QC 가 최종 집계
        }
        if (query.hasDistinct && !query.hasAggregate) {
          s = px.op(s, 'HASH UNIQUE', 'hash', rows, 0.5)
          const d = px.dfos++
          s = px.op({ dfo: d, tree: px.send(s, 'HASH', d) }, 'HASH UNIQUE', 'hash', rows, 0.5)
          done.distinct = true
        }
        if (query.hasOrderBy && !sameKeys && !(query.limitKind === 'fetch' && n !== null)) {
          const d = px.dfos++
          s = px.op({ dfo: d, tree: px.send(s, 'RANGE', d) }, 'SORT ORDER BY', 'sort', rows, 1)
          ordered = true
          done.order = true
        }
      }
      tree = px.toQC(s, ordered)
      cost = round1(s.tree.cost)
      const sets = px.dfos > 1 ? 2 : 1
      const requested = query.parallel
      parallel = {
        requested, dop: Math.min(requested, Math.floor(PX_MAX_SERVERS / sets)), serverSets: sets, queues: px.queues, dfos: px.dfos,
        note: {
        ko: `Parallel Execution: PARALLEL 힌트로 DOP ${requested}${query.parallelDefaulted ? '(숫자를 안 적어서 기본값)' : ''}를 요청했어요. 계획을 DFO ${px.dfos}개로 나누고, DFO 사이는 Table Queue ${px.queues}개로 이어요. ${sets === 2 ? '행을 다시 나눠 보내는(재분배) 단계가 있어서 생산자·소비자 PX 서버 집합 2개가 필요해요.' : '재분배가 없어서 PX 서버 집합 하나로 충분해요.'}${broadcasts.length > 0 ? ` 작은 ${broadcasts.join(', ')} 쪽은 해시로 나누는 대신 모든 PX 서버에 통째로 복사(BROADCAST)해요.` : ''}`,
        en: `Parallel execution: the PARALLEL hint asks for DOP ${requested}${query.parallelDefaulted ? ' (the default, since no number was given)' : ''}. The plan is split into ${px.dfos} DFO${px.dfos === 1 ? '' : 's'} linked by ${px.queues} table queue${px.queues === 1 ? '' : 's'}. ${sets === 2 ? 'Rows are redistributed between steps, so two PX server sets (producers and consumers) are needed.' : 'There is no redistribution, so a single PX server set is enough.'}${broadcasts.length > 0 ? ` The small ${broadcasts.join(', ')} input is copied to every PX server (BROADCAST) instead of being hash-distributed.` : ''}`,
        },
      }
    }
  }

  if (query.type === 'SELECT') {
    const n = query.fetchFirst
    // ROWNUM 은 행이 만들어지는 대로 번호가 붙는다 → 집계·정렬보다 먼저 멈춘다
    if (query.limitKind === 'rownum' && n !== null) {
      wrap('COUNT STOPKEY', 'stopkey', Math.min(rows, n), 0)
      tree.filter = `ROWNUM<=${n}`
    }
    if (done.group) {
      // 병렬 쪽에서 이미 그룹 지었다
    } else if (query.hasGroupBy) {
      wrap(sameKeys ? 'SORT GROUP BY' : 'HASH GROUP BY', sameKeys ? 'sort' : 'hash', Math.max(1, Math.min(rows, groups)), 1)
    } else if (query.hasAggregate) {
      wrap('SORT AGGREGATE', 'sort', 1, 0)
    }
    if (query.hasDistinct && !done.distinct) wrap('HASH UNIQUE', 'hash', rows, 1)
    if (query.limitKind === 'fetch' && n !== null) {
      // FETCH FIRST 는 내부적으로 ROW_NUMBER() 분석 함수 + 바깥 필터로 바뀐다 (12c 의 Row Limiting Clause)
      const limit = Math.min(rows, n)
      if (query.hasOrderBy && !sameKeys) {
        wrap('WINDOW SORT PUSHED RANK', 'sort', rows, 1)
        tree.filter = `ROW_NUMBER() OVER (ORDER BY …)<=${n}`
      } else {
        wrap('WINDOW NOSORT STOPKEY', 'stopkey', limit, 0)
        tree.filter = `ROW_NUMBER() OVER (ORDER BY NULL)<=${n}`
      }
      wrap('VIEW', 'view', limit, 0)
      tree.filter = `"from$_subquery$_002"."rowlimit_$$_rownumber"<=${n}`
    } else if (query.hasOrderBy && !sameKeys && !done.order) {
      wrap('SORT ORDER BY', 'sort', rows, 1)
    }
  } else {
    tree = { operation: query.type, name: query.tables[0].name, rows: 0, cost, kind: 'dml', children: [tree] }
  }
  const planNodes = flatten({ operation: `${query.type} STATEMENT`, rows, cost, kind: 'statement', children: [tree] })

  return {
    query,
    transformations,
    estimates: best.order.map((a) => estimates[a]),
    tableAccessPlans: best.order.map((a) => access[a]),
    joinSteps: best.steps,
    joinOrders,
    plansConsidered,
    planNodes,
    planHash: hashPlan(planNodes),
    totalCost: cost,
    estimatedRows: rows,
    warnings,
    parallel,
  }
}
