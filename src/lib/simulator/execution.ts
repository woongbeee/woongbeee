// ─── Execution helpers ────────────────────────────────────────────────────
// 샘플 데이터 위에서 조건을 실제로 평가해 "어느 행이 걸리는지 → 그 행이 어느 블록에 있는지"를 구한다.
// Buffer Cache 시뮬레이션이 추정치가 아니라 실제 블록 주소로 움직이게 하려는 것.

import type { RowData } from '@/data/types'
import type { AccessPath, IndexStats, OptimizerResult, Predicate, TableRef, TableStats } from '@/lib/optimizer/types'
import { KEYS_PER_LEAF, ROWS_PER_BLOCK, getTableRows, getTableStats } from '@/lib/optimizer/stats'
import type { BlockRef } from './types'

// ── Block addressing ──────────────────────────────────────────────────────

const tableBlock = (ts: TableStats, n: number): BlockRef => ({
  key: `${ts.tableName}#${n}`, object: ts.tableName, abbr: ts.abbr, sub: String(n), kind: 'table',
})

const indexBlock = (ix: IndexStats, abbr: string, sub: string): BlockRef => ({
  key: `${ix.indexName}#${sub}`, object: ix.indexName, abbr, sub, kind: 'index',
})

export const undoBlock = (n: number): BlockRef => ({
  key: `UNDO#${n}`, object: 'Undo Segment', abbr: 'UNDO', sub: String(n), kind: 'undo',
})

const blockOfRow = (rowIdx: number) => Math.floor(rowIdx / ROWS_PER_BLOCK) + 1

/** 인덱스 키 순서로 정렬했을 때 각 행이 몇 번째 Leaf 블록에 들어가는지 */
function leafOfRows(ix: IndexStats, rows: RowData[]): Map<number, number> {
  const col = ix.columns[0]
  const order = rows
    .map((r, i) => ({ i, v: r[col] }))
    .filter((e) => e.v !== null && e.v !== undefined)
    .sort((a, b) => (typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v))))
  return new Map(order.map((e, rank) => [e.i, Math.floor(rank / KEYS_PER_LEAF) + 1]))
}

function dedupe(blocks: BlockRef[]): BlockRef[] {
  const seen = new Set<string>()
  return blocks.filter((b) => !seen.has(b.key) && seen.add(b.key))
}

/**
 * Access Path 하나가 읽게 되는 블록들 — 인덱스 블록과 테이블 블록을 따로 돌려준다
 * (INDEX … SCAN 과 TABLE ACCESS BY INDEX ROWID 는 서로 다른 Row Source 라서).
 * keyRows = 인덱스에서 찾아낸 행 번호
 */
export function accessBlocks(path: AccessPath, keyRows: number[]): { index: BlockRef[]; table: BlockRef[] } {
  const ts = getTableStats(path.tableName)
  if (!ts) return { index: [], table: [] }
  if (path.type === 'FULL_TABLE_SCAN' || !path.index) {
    return { index: [], table: Array.from({ length: ts.numBlocks }, (_, i) => tableBlock(ts, i + 1)) }
  }
  const ix = path.index
  const root = indexBlock(ix, ts.abbr, 'R')
  if (path.type === 'INDEX_FAST_FULL_SCAN') {
    return { index: [root, ...Array.from({ length: ix.leafBlocks }, (_, i) => indexBlock(ix, ts.abbr, `L${i + 1}`))], table: [] }
  }
  const leaves = leafOfRows(ix, getTableRows(path.tableName))
  const index: BlockRef[] = [root]
  for (const r of keyRows) index.push(indexBlock(ix, ts.abbr, `L${leaves.get(r) ?? 1}`))
  if (keyRows.length === 0) index.push(indexBlock(ix, ts.abbr, 'L1')) // 못 찾아도 Leaf 까지는 내려간다
  const table = path.indexOnly ? [] : keyRows.map((r) => tableBlock(ts, blockOfRow(r)))
  return { index: dedupe(index), table: dedupe(table) }
}

/** DML 이 바꾸는 블록들: 행이 있는 테이블 블록 + 손봐야 하는 인덱스 Leaf 블록 */
export function dmlBlocks(tableName: string, rowIdx: number[], changedColumns: string[] | null): { table: BlockRef[]; index: BlockRef[] } {
  const ts = getTableStats(tableName)
  if (!ts) return { table: [], index: [] }
  const rows = getTableRows(tableName)
  const table = dedupe(rowIdx.map((r) => tableBlock(ts, Math.min(ts.numBlocks, blockOfRow(r)))))
  const index: BlockRef[] = []
  for (const ix of ts.indexes) {
    // UPDATE 는 값이 바뀐 컬럼의 인덱스만, INSERT·DELETE 는 모든 인덱스를 고친다
    if (changedColumns && !ix.columns.some((c) => changedColumns.includes(c))) continue
    const leaves = leafOfRows(ix, rows)
    for (const r of rowIdx) index.push(indexBlock(ix, ts.abbr, `L${leaves.get(r) ?? ix.leafBlocks}`))
  }
  return { table, index: dedupe(index) }
}

// ── Predicate evaluation ──────────────────────────────────────────────────

function likeToRegex(pattern: string): RegExp {
  const body = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp(`^${body}$`)
}

/** true/false, 또는 값을 몰라 판단할 수 없으면 null */
function evalPredicate(row: RowData, pred: Predicate): boolean | null {
  const v = row[pred.column]
  if (pred.operator === 'IS NULL' && !pred.wrapped) return v === null || v === undefined
  if (pred.operator === 'IS NOT NULL' && !pred.wrapped) return v !== null && v !== undefined
  if (pred.wrapped || pred.isBind || pred.values.length === 0) return null
  if (v === null || v === undefined) return false
  const same = (a: string | number, b: string | number) => (typeof a === 'number' && typeof b === 'number' ? a === b : String(a) === String(b))
  const cmp = (a: string | number, b: string | number) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)))
  const x = pred.values[0]
  switch (pred.operator) {
    case '=': return same(v, x)
    case '<>': return !same(v, x)
    case '<': return cmp(v, x) < 0
    case '>': return cmp(v, x) > 0
    case '<=': return cmp(v, x) <= 0
    case '>=': return cmp(v, x) >= 0
    case 'IN': return pred.values.some((y) => same(v, y))
    case 'BETWEEN': return pred.values.length >= 2 && cmp(v, x) >= 0 && cmp(v, pred.values[1]) <= 0
    case 'LIKE': return likeToRegex(String(x)).test(String(v))
    default: return null
  }
}

export interface RowMatch {
  rows: number[]     // 조건을 통과한 행 번호
  exact: boolean     // false 면 값을 몰라 추정 행 수만큼만 잘라 낸 결과
}

/** 한 테이블의 단일 테이블 조건을 모두 적용 */
export function matchRows(ref: TableRef, predicates: Predicate[], estimate: number): RowMatch {
  const mine = predicates.filter((p) => p.alias === ref.alias)
  let exact = true
  const rows: number[] = []
  getTableRows(ref.name).forEach((row, i) => {
    let pass = true
    const groups = new Map<number, boolean>()
    for (const p of mine) {
      let r = evalPredicate(row, p)
      if (r === null) { exact = false; r = true }
      if (p.orGroup === undefined) pass = pass && r
      else groups.set(p.orGroup, (groups.get(p.orGroup) ?? false) || r)
    }
    for (const g of groups.values()) pass = pass && g
    if (pass) rows.push(i)
  })
  return exact ? { rows, exact } : { rows: rows.slice(0, Math.max(1, estimate)), exact }
}

/** 인덱스 Access Predicate 하나만 적용했을 때 걸리는 행 (인덱스에서 읽게 되는 키들) */
export function keyRows(path: AccessPath, fallback: number[]): number[] {
  const pred = path.accessPredicate
  if (!pred) return fallback
  const hits: number[] = []
  let unknown = false
  getTableRows(path.tableName).forEach((row, i) => {
    const r = evalPredicate(row, pred)
    if (r === null) unknown = true
    else if (r) hits.push(i)
  })
  return unknown ? fallback : hits
}

/** 조인까지 실제로 수행해서 최종 결과 행 수를 센다. 계산할 수 없으면 null */
export function actualRowCount(opt: OptimizerResult, matches: Record<string, RowMatch>): number | null {
  const q = opt.query
  const order = opt.estimates.map((e) => e.alias)
  if (order.some((a) => !matches[a]?.exact) || q.inexact) return null
  const tableOf = (alias: string) => q.tables.find((t) => t.alias === alias)!.name
  let combos: Record<string, number>[] = matches[order[0]].rows.map((r) => ({ [order[0]]: r }))
  const joined = [order[0]]

  for (const alias of order.slice(1)) {
    const step = opt.joinSteps.find((s) => s.rightAlias === alias)
    if (!step || step.type === 'FULL') return null
    const conds = q.joins.filter((j) => (j.leftAlias === alias && joined.includes(j.rightAlias)) || (j.rightAlias === alias && joined.includes(j.leftAlias)))
    joined.push(alias)
    const innerRows = getTableRows(tableOf(alias))
    const next: Record<string, number>[] = []
    for (const combo of combos) {
      let matched = false
      for (const r of matches[alias].rows) {
        const ok = conds.every((j) => {
          const [mineCol, otherAlias, otherCol] = j.leftAlias === alias ? [j.leftColumn, j.rightAlias, j.rightColumn] : [j.rightColumn, j.leftAlias, j.leftColumn]
          const other = combo[otherAlias]
          if (other === undefined || other < 0) return false
          const a = innerRows[r][mineCol]
          const b = getTableRows(tableOf(otherAlias))[other][otherCol]
          return a !== null && b !== null && a === b
        })
        if (ok) {
          matched = true
          next.push({ ...combo, [alias]: r })
          if (step.type === 'SEMI') break // Semi Join: 짝을 하나 찾으면 그 바깥 행은 끝
        }
      }
      if (!matched && step.type === 'LEFT') next.push({ ...combo, [alias]: -1 })
      if (next.length > 20000) return null
    }
    combos = next
    if (combos.length === 0) break
  }

  // ROWNUM 은 집계·정렬보다 먼저 행을 끊는다
  if (q.limitKind === 'rownum' && q.fetchFirst !== null) combos = combos.slice(0, q.fetchFirst)
  let count = combos.length
  if (q.hasGroupBy) {
    const keys = new Set(combos.map((c) => q.groupBy.map((g) => (c[g.alias] >= 0 ? String(getTableRows(tableOf(g.alias))[c[g.alias]][g.column]) : 'NULL')).join('|')))
    count = keys.size
  } else if (q.hasAggregate) {
    count = 1
  } else if (q.hasDistinct) {
    return null
  }
  return q.limitKind === 'fetch' && q.fetchFirst !== null ? Math.min(count, q.fetchFirst) : count
}
