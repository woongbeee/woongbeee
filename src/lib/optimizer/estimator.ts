// ─── Oracle CBO Estimator ─────────────────────────────────────────────────
// Selectivity → Cardinality → Cost 를 통계로 계산한다.
// 공식은 SQL Tuning Guide "Query Optimizer Concepts" · "Optimizer Access Paths" 의
// 설명을 단순화한 것 (히스토그램·바인드 피킹·동적 통계는 다루지 않는다).

import type { AccessPath, ColumnStats, IndexStats, L, ParsedQuery, Predicate, TableEstimate, TableRef, TableStats } from './types'
import { getColumnStats, getTableStats, isUniqueLookup } from './stats'

// Noworkload System Statistics 기본값에서 나온 값들
const MBRC = 8                  // Multiblock Read Count — Full Scan 이 한 번에 읽는 블록 수
const MREAD_OVER_SREAD = 26 / 12 // Multiblock read time / Single-block read time
const CPU_PER_ROW = 0.02        // 행 하나를 필터링하는 CPU 비용 (I/O 비용 단위로 환산)

const DEFAULT_RANGE_SEL = 0.05  // 값을 모르는 범위·LIKE 조건의 기본 선택도 (5%)
const DEFAULT_OTHER_SEL = 0.05

const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const round1 = (n: number) => Math.round(n * 10) / 10

// ── Selectivity ─────────────────────────────────────────────────────────

export function predicateSelectivity(pred: Predicate, ts: TableStats, cs: ColumnStats | null): { sel: number; note: L } {
  const mk = (sel: number, ko: string, en: string) => ({
    sel: Math.min(1, Math.max(0, sel)),
    note: { ko: `${pred.text} → ${ko} = ${pct(sel)}`, en: `${pred.text} → ${en} = ${pct(sel)}` },
  })
  if (!cs) return mk(DEFAULT_OTHER_SEL, '통계 없음, 기본값', 'no statistics, default')
  const notNull = ts.numRows > 0 ? (ts.numRows - cs.nullCount) / ts.numRows : 1
  if (pred.wrapped) {
    return mk(DEFAULT_OTHER_SEL, '컬럼을 가공한 조건이라 추측값 5%', 'expression on the column, default guess 5%')
  }
  const v = pred.values[0]
  switch (pred.operator) {
    case '=':
      return mk(notNull / cs.ndv, `1 / NDV(${cs.ndv})`, `1 / NDV(${cs.ndv})`)
    case '<>':
      return mk(notNull * (1 - 1 / cs.ndv), `1 − 1/NDV(${cs.ndv})`, `1 − 1/NDV(${cs.ndv})`)
    case 'IN': {
      const n = Math.max(1, pred.values.length)
      return mk(Math.min(1, n / cs.ndv) * notNull, `값 ${n}개 / NDV(${cs.ndv})`, `${n} values / NDV(${cs.ndv})`)
    }
    case 'IS NULL':
      return mk(1 - notNull, `NULL ${cs.nullCount}행 / ${ts.numRows}행`, `${cs.nullCount} nulls / ${ts.numRows} rows`)
    case 'IS NOT NULL':
      return mk(notNull, `NULL 아닌 행 비율`, `non-null fraction`)
    case 'LIKE':
      return mk(DEFAULT_RANGE_SEL, 'LIKE 기본값 5%', 'LIKE default 5%')
    case 'BETWEEN': {
      const [a, b] = pred.values
      if (!cs.numeric || typeof a !== 'number' || typeof b !== 'number' || cs.high <= cs.low) {
        return mk(DEFAULT_RANGE_SEL, '범위를 알 수 없어 기본값 5%', 'unknown range, default 5%')
      }
      const hi = Math.min(b, cs.high)
      const lo = Math.max(a, cs.low)
      const sel = Math.max(0, hi - lo) / (cs.high - cs.low) + 1 / cs.ndv
      const formula = `(${hi} − ${lo}) / (HIGH ${cs.high} − LOW ${cs.low}) + 1/NDV`
      return mk(sel * notNull, formula, formula)
    }
    default: {
      if (pred.isBind || !cs.numeric || typeof v !== 'number' || cs.high <= cs.low) {
        return mk(DEFAULT_RANGE_SEL, '값을 모르는 범위 조건, 기본값 5%', 'range with unknown value, default 5%')
      }
      const range = cs.high - cs.low
      const closed = pred.operator === '>=' || pred.operator === '<=' ? 1 / cs.ndv : 0
      const frac = pred.operator === '>' || pred.operator === '>='
        ? (cs.high - v) / range
        : (v - cs.low) / range
      const sel = Math.min(1, Math.max(0, frac) + closed)
      const formula = pred.operator.startsWith('>')
        ? `(HIGH ${cs.high} − ${v}) / (HIGH ${cs.high} − LOW ${cs.low})`
        : `(${v} − LOW ${cs.low}) / (HIGH ${cs.high} − LOW ${cs.low})`
      return mk(sel * notNull, formula, formula)
    }
  }
}

/** AND 는 곱하고, 같은 orGroup 끼리는 s1 + s2 − s1·s2 로 합친다 (조건들이 서로 독립이라고 가정) */
function combine(parts: { sel: number; orGroup?: number }[]): number {
  let total = 1
  const groups = new Map<number, number>()
  for (const p of parts) {
    if (p.orGroup === undefined) total *= p.sel
    else groups.set(p.orGroup, 1 - (1 - (groups.get(p.orGroup) ?? 0)) * (1 - p.sel))
  }
  for (const g of groups.values()) total *= g
  return total
}

export function estimateTable(ref: TableRef, predicates: Predicate[]): TableEstimate {
  const ts = getTableStats(ref.name)
  if (!ts) {
    return { alias: ref.alias, tableName: ref.name, numRows: 0, numBlocks: 0, selectivity: 1, cardinality: 1, notes: [] }
  }
  const mine = predicates.filter((p) => p.alias === ref.alias)
  const parts = mine.map((p) => ({ ...predicateSelectivity(p, ts, getColumnStats(ref.name, p.column)), orGroup: p.orGroup }))
  const selectivity = combine(parts)
  return {
    alias: ref.alias,
    tableName: ref.name,
    numRows: ts.numRows,
    numBlocks: ts.numBlocks,
    selectivity,
    cardinality: Math.max(1, Math.round(ts.numRows * selectivity)),
    notes: parts.map((p) => p.note),
  }
}

// ── Access path costing ──────────────────────────────────────────────────

export function fullScanCost(ts: TableStats): { io: number; cpu: number } {
  return { io: 1 + Math.ceil((ts.numBlocks / MBRC) * MREAD_OVER_SREAD), cpu: ts.numRows * CPU_PER_ROW }
}

/** 인덱스로 key 선택도 `sel` 만큼 읽을 때의 비용. tableAccess=false 면 인덱스만 읽는다. */
export function indexScanCost(index: IndexStats, sel: number, tableAccess: boolean): { io: number; cpu: number } {
  const leaf = Math.max(1, Math.ceil(index.leafBlocks * sel))
  const table = tableAccess ? Math.max(1, Math.ceil(index.clusteringFactor * sel)) : 0
  return { io: index.blevel + leaf + table, cpu: Math.max(1, index.distinctKeys * sel) * CPU_PER_ROW }
}

/** 이 테이블에서 꺼내야 하는 컬럼이 인덱스 안에 다 있는지 (있으면 테이블 블록을 안 읽어도 된다) */
function coveredBy(index: IndexStats, ref: TableRef, query: ParsedQuery): boolean {
  // SELECT * 는 바깥 질의의 테이블에만 해당한다 — 서브쿼리 테이블은 쓰인 컬럼만 있으면 된다
  const star = query.selectAll && !query.semiAliases.includes(ref.alias)
  return query.type === 'SELECT' && !star && (query.usedColumns[ref.alias] ?? []).every((c) => index.columns.includes(c))
}

const INDEXABLE = new Set(['=', '<', '>', '<=', '>=', 'BETWEEN', 'IN', 'LIKE'])

function indexUsable(pred: Predicate): boolean {
  if (pred.wrapped || pred.orGroup !== undefined || !INDEXABLE.has(pred.operator)) return false
  if (pred.operator === 'LIKE') return typeof pred.values[0] === 'string' && !/^[%_]/.test(pred.values[0])
  return true
}

/** 한 테이블에 대해 가능한 Access Path 를 모두 만들고 가장 싼 것을 고른다 */
export function generateAccessPaths(ref: TableRef, query: ParsedQuery, estimate: TableEstimate): AccessPath[] {
  const ts = getTableStats(ref.name)
  if (!ts) return []
  const preds = query.predicates.filter((p) => p.alias === ref.alias)
  const { cardinality, selectivity } = estimate
  const paths: AccessPath[] = []
  const base = { alias: ref.alias, tableName: ref.name, chosen: false }

  // ── Full Table Scan ──
  const fts = fullScanCost(ts)
  paths.push({
    ...base, type: 'FULL_TABLE_SCAN', indexOnly: false, selectivity, cardinality,
    ioCost: fts.io, cpuCost: round1(fts.cpu), cost: round1(fts.io + fts.cpu),
    reason: {
      ko: `High Water Mark 아래 ${ts.numBlocks}개 블록을 Multiblock Read(한 번에 최대 ${MBRC}블록)로 전부 읽고, ${ts.numRows}행에 조건을 적용해요.`,
      en: `Reads all ${ts.numBlocks} blocks below the high water mark with multiblock reads (up to ${MBRC} blocks per call) and filters ${ts.numRows} rows.`,
    },
  })

  // ── Index paths: 조건의 선두 컬럼과 일치하는 인덱스 ──
  for (const pred of preds) {
    if (!indexUsable(pred)) continue
    const cs = getColumnStats(ref.name, pred.column)
    for (const index of ts.indexes.filter((i) => i.columns[0] === pred.column)) {
      const keySel = predicateSelectivity(pred, ts, cs).sel
      const indexOnly = coveredBy(index, ref, query)
      if (pred.operator === '=' && isUniqueLookup(index)) {
        const io = index.blevel + (indexOnly ? 0 : 1)
        paths.push({
          ...base, type: 'INDEX_UNIQUE_SCAN', index, indexOnly, selectivity: keySel, cardinality: 1,
          ioCost: io, cpuCost: CPU_PER_ROW, cost: round1(io + CPU_PER_ROW), accessPredicate: pred,
          reason: {
            ko: `Unique 인덱스에 = 조건이라 많아야 1행. Root → Leaf 로 ${index.blevel + 1}블록 내려간 뒤 ROWID 로 테이블 블록 1개만 읽어요.`,
            en: `Equality on a unique index returns at most one row: descend root → leaf (${index.blevel + 1} blocks), then one table block by ROWID.`,
          },
        })
      } else {
        const c = indexScanCost(index, keySel, !indexOnly)
        paths.push({
          ...base, type: 'INDEX_RANGE_SCAN', index, indexOnly, selectivity, cardinality,
          ioCost: c.io, cpuCost: round1(c.cpu), cost: round1(c.io + c.cpu), accessPredicate: pred,
          reason: {
            ko: `BLEVEL ${index.blevel} + Leaf ${index.leafBlocks}블록 × ${pct(keySel)} + ${indexOnly ? '테이블 접근 없음(인덱스만으로 충분)' : `Clustering Factor ${index.clusteringFactor} × ${pct(keySel)}`}`,
            en: `BLEVEL ${index.blevel} + ${index.leafBlocks} leaf blocks × ${pct(keySel)} + ${indexOnly ? 'no table access (index alone is enough)' : `clustering factor ${index.clusteringFactor} × ${pct(keySel)}`}`,
          },
        })
      }
    }
  }

  // ── Index Fast Full Scan: 필요한 컬럼이 전부 인덱스 안에 있을 때 ──
  {
    for (const index of ts.indexes) {
      const covers = coveredBy(index, ref, query)
      // B-tree 는 전부 NULL 인 키를 저장하지 않으므로, NULL 이 없는 컬럼의 인덱스만 테이블 대신 쓸 수 있다
      const noNulls = index.columns.some((c) => getColumnStats(ref.name, c)?.nullCount === 0)
      if (!covers || !noNulls || paths.some((p) => p.index === index && p.indexOnly)) continue
      const blocks = index.leafBlocks + 1
      const io = 1 + Math.ceil((blocks / MBRC) * MREAD_OVER_SREAD)
      const cpu = ts.numRows * CPU_PER_ROW * 0.5
      paths.push({
        ...base, type: 'INDEX_FAST_FULL_SCAN', index, indexOnly: true, selectivity, cardinality,
        ioCost: io, cpuCost: round1(cpu), cost: round1(io + cpu),
        reason: {
          ko: `필요한 컬럼이 전부 인덱스에 있어요. 테이블(${ts.numBlocks}블록) 대신 더 작은 인덱스(${blocks}블록)를 Multiblock Read 로 통째로 읽어요.`,
          en: `Every needed column is in the index, so the smaller index (${blocks} blocks) is read with multiblock reads instead of the table (${ts.numBlocks} blocks).`,
        },
      })
    }
  }

  // Fast Full Scan 후보가 여럿이면 가장 싼 인덱스 하나만 남긴다
  const ffs = paths.filter((p) => p.type === 'INDEX_FAST_FULL_SCAN').sort((a, b) => a.cost - b.cost)
  for (const extra of ffs.slice(1)) paths.splice(paths.indexOf(extra), 1)

  // 가장 싼 경로 선택 (동률이면 먼저 만든 쪽 = Full Scan)
  let best = paths[0]
  for (const p of paths) if (p.cost < best.cost) best = p
  best.chosen = true
  return paths.sort((a, b) => a.cost - b.cost)
}

/** NL 조인에서 outer 1행마다 inner 를 찾는 비용 (조인 컬럼 인덱스가 있으면 그걸 탄다) */
export function innerProbePath(ref: TableRef, joinColumn: string, query: ParsedQuery, estimate: TableEstimate, fallback: AccessPath): AccessPath {
  const ts = getTableStats(ref.name)
  const index = ts?.indexes.find((i) => i.columns[0] === joinColumn)
  if (!ts || !index) return fallback
  const cs = getColumnStats(ref.name, joinColumn)
  const keySel = 1 / (cs?.ndv ?? 1)
  const indexOnly = coveredBy(index, ref, query)
  const unique = isUniqueLookup(index)
  const c = unique ? { io: index.blevel + (indexOnly ? 0 : 1), cpu: CPU_PER_ROW } : indexScanCost(index, keySel, !indexOnly)
  return {
    alias: ref.alias, tableName: ref.name, chosen: true,
    type: unique ? 'INDEX_UNIQUE_SCAN' : 'INDEX_RANGE_SCAN', index, indexOnly,
    selectivity: keySel, cardinality: Math.max(1, Math.round(ts.numRows * keySel * estimate.selectivity)),
    ioCost: c.io, cpuCost: round1(c.cpu), cost: round1(c.io + c.cpu),
    reason: { ko: `조인 컬럼 ${joinColumn} 의 인덱스 ${index.indexName} 로 찾아요.`, en: `Probes index ${index.indexName} on join column ${joinColumn}.` },
  }
}
