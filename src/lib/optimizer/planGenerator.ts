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
  const warnings: L[] = []
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
    return { operation: 'TABLE ACCESS FULL', name: path.tableName, rows, cost: path.cost, kind: 'table', alias: path.alias, filter, children: [] }
  }
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
    operation: unique ? 'TABLE ACCESS BY INDEX ROWID' : 'TABLE ACCESS BY INDEX ROWID BATCHED',
    name: path.tableName, rows, cost: path.cost, kind: 'table', alias: path.alias, filter, children: [indexNode],
  }
}

function flatten(root: Tree): PlanNode[] {
  const nodes: PlanNode[] = []
  const walk = (t: Tree, depth: number): number => {
    const node: PlanNode = {
      id: nodes.length, depth, operation: t.operation, name: t.name, rows: t.rows, cost: Math.max(1, Math.round(t.cost)),
      kind: t.kind, alias: t.alias, access: t.access, filter: t.filter, children: [],
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
  if (query.type === 'SELECT') {
    const n = query.fetchFirst
    // ROWNUM 은 행이 만들어지는 대로 번호가 붙는다 → 집계·정렬보다 먼저 멈춘다
    if (query.limitKind === 'rownum' && n !== null) {
      wrap('COUNT STOPKEY', 'stopkey', Math.min(rows, n), 0)
      tree.filter = `ROWNUM<=${n}`
    }
    // GROUP BY 와 ORDER BY 의 컬럼이 같으면 정렬 한 번으로 그룹 짓기와 줄 세우기를 함께 끝낸다
    const sameKeys = query.hasGroupBy && query.hasOrderBy && query.orderItems === query.orderBy.length
      && query.orderBy.length === query.groupBy.length
      && query.orderBy.every((o, i) => o.alias === query.groupBy[i].alias && o.column === query.groupBy[i].column)
    if (query.hasGroupBy) {
      const groups = query.groupBy.reduce((g, c) => g * (getColumnStats(query.tables.find((t) => t.alias === c.alias)!.name, c.column)?.ndv ?? 1), 1)
      wrap(sameKeys ? 'SORT GROUP BY' : 'HASH GROUP BY', sameKeys ? 'sort' : 'hash', Math.max(1, Math.min(rows, groups)), 1)
    } else if (query.hasAggregate) {
      wrap('SORT AGGREGATE', 'sort', 1, 0)
    }
    if (query.hasDistinct) wrap('HASH UNIQUE', 'hash', rows, 1)
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
    } else if (query.hasOrderBy && !sameKeys) {
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
  }
}
