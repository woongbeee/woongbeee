// ─── Optimizer Statistics ─────────────────────────────────────────────────
// DBMS_STATS.GATHER_SCHEMA_STATS 를 흉내 낸다 — 손으로 적은 숫자가 아니라
// `@/data` 의 실제 샘플 행에서 NUM_ROWS · NDV · NULL 수 · LOW/HIGH 를 직접 센다.
// 그래서 스키마 데이터를 바꾸면 통계도 저절로 따라간다.
//
// 교육용 가정: 블록 하나에 행이 ROWS_PER_BLOCK 개만 들어가는 아주 작은 블록.
// (실제 8KB 블록이면 샘플 테이블이 전부 1블록이라 Buffer Cache·비용 차이를 볼 수 없다.)

import { SCHEMAS } from '@/data/index'
import type { SchemaTable, RowData } from '@/data/types'
import type { ColumnStats, IndexStats, Partitioning, TableStats } from './types'

export const ROWS_PER_BLOCK = 4
export const KEYS_PER_LEAF = 8

const ABBR: Record<string, string> = {
  REGIONS: 'REG', COUNTRIES: 'CTRY', LOCATIONS: 'LOC', DEPARTMENTS: 'DEPT', JOBS: 'JOB',
  EMPLOYEES: 'EMP', JOB_HISTORY: 'JHIST', CUSTOMERS: 'CUST', STORES: 'STORE',
  PRODUCTS: 'PROD', ORDERS: 'ORD', ORDER_ITEMS: 'ITEM',
}

// PK·FK 말고 추가로 만들어 둔 인덱스 (HR 스키마의 EMP_NAME_IX · EMP_EMAIL_UK 등)
const EXTRA_INDEXES: Record<string, { column: string; unique: boolean }[]> = {
  EMPLOYEES: [{ column: 'LAST_NAME', unique: false }, { column: 'EMAIL', unique: true }],
  CUSTOMERS: [{ column: 'EMAIL_ADDRESS', unique: true }],
}

// 파티션 테이블 (CREATE TABLE … PARTITION BY RANGE). 샘플 데이터는 그대로 두고, 물리 설계만 여기서 정한다.
//   ORDERS: 주문 일시(ORDER_TMS) 기준 월별 Range 파티션 — 상한은 "그 값 미만"
const PARTITIONED: Record<string, { column: string; parts: { name: string; lessThan: string }[] }> = {
  ORDERS: {
    column: 'ORDER_TMS',
    parts: [
      { name: 'P_2021_02', lessThan: '2021-03-01' },
      { name: 'P_2021_03', lessThan: '2021-04-01' },
      { name: 'P_2021_04', lessThan: '2021-05-01' },
      { name: 'P_2021_05', lessThan: '2021-06-01' },
      { name: 'P_2021_06', lessThan: '2021-07-01' },
    ],
  },
}

const ALL_TABLES: SchemaTable[] = SCHEMAS.flatMap((s) => s.tables)

function columnStats(table: SchemaTable, columnName: string): ColumnStats {
  const values = table.rows.map((r) => r[columnName]).filter((v) => v !== null && v !== undefined)
  const distinct = new Set(values)
  const numeric = values.length > 0 && values.every((v) => typeof v === 'number')
  const nums = numeric ? (values as number[]) : []
  return {
    columnName,
    ndv: Math.max(1, distinct.size),
    nullCount: table.rows.length - values.length,
    numeric,
    low: numeric ? Math.min(...nums) : 0,
    high: numeric ? Math.max(...nums) : distinct.size,
  }
}

function buildIndex(table: SchemaTable, abbr: string, columns: string[], unique: boolean, isPk: boolean): IndexStats {
  const keys = new Set(table.rows.map((r) => columns.map((c) => String(r[c])).join('|')))
  const leafBlocks = Math.max(1, Math.ceil(table.rows.length / KEYS_PER_LEAF))
  const numBlocks = Math.max(1, Math.ceil(table.rows.length / ROWS_PER_BLOCK))
  return {
    indexName: isPk ? `${abbr}_PK` : `${abbr}_${columns[0]}_${unique ? 'UK' : 'IX'}`,
    tableName: table.name,
    columns,
    unique,
    blevel: 1,
    leafBlocks,
    distinctKeys: keys.size,
    // PK 순서대로 적재된 테이블이라 PK 인덱스는 잘 모여 있고, 나머지는 흩어져 있다고 본다
    clusteringFactor: isPk ? numBlocks : Math.min(table.rows.length, Math.ceil(numBlocks * 1.5)),
  }
}

function buildPartitioning(table: SchemaTable): Partitioning | undefined {
  const spec = PARTITIONED[table.name]
  if (!spec) return undefined
  const partitions = spec.parts.map((p, i) => {
    const lower = i === 0 ? '' : spec.parts[i - 1].lessThan
    const rowIdx = table.rows
      .map((r, idx) => ({ idx, v: String(r[spec.column] ?? '') }))
      .filter((e) => e.v >= lower && e.v < p.lessThan)
      .map((e) => e.idx)
    return {
      name: p.name, position: i + 1, highValue: p.lessThan, rowIdx,
      numRows: rowIdx.length, numBlocks: Math.max(1, Math.ceil(rowIdx.length / ROWS_PER_BLOCK)),
    }
  })
  return { method: 'RANGE', column: spec.column, partitions }
}

function buildStats(table: SchemaTable): TableStats {
  const abbr = ABBR[table.name] ?? table.name.slice(0, 5)
  const indexes: IndexStats[] = []
  const pkCols = table.columns.filter((c) => c.isPrimaryKey).map((c) => c.name)
  if (pkCols.length > 0) indexes.push(buildIndex(table, abbr, pkCols, true, true))
  for (const c of table.columns) {
    if (c.isForeignKey && c.name !== pkCols[0]) indexes.push(buildIndex(table, abbr, [c.name], false, false))
  }
  for (const extra of EXTRA_INDEXES[table.name] ?? []) {
    indexes.push(buildIndex(table, abbr, [extra.column], extra.unique, false))
  }
  const partitioning = buildPartitioning(table)
  return {
    tableName: table.name,
    abbr,
    numRows: table.rows.length,
    // 파티션 테이블은 파티션마다 세그먼트가 따로 있다 → 블록 수는 파티션들의 합
    numBlocks: partitioning
      ? partitioning.partitions.reduce((n, p) => n + p.numBlocks, 0)
      : Math.max(1, Math.ceil(table.rows.length / ROWS_PER_BLOCK)),
    avgRowLen: 60,
    columns: table.columns.map((c) => columnStats(table, c.name)),
    indexes,
    partitioning,
  }
}

const TABLE_STATS: Record<string, TableStats> = Object.fromEntries(
  ALL_TABLES.map((t) => [t.name, buildStats(t)]),
)

export function getTableStats(tableName: string): TableStats | null {
  return TABLE_STATS[tableName.toUpperCase()] ?? null
}

export function getColumnStats(tableName: string, columnName: string): ColumnStats | null {
  return getTableStats(tableName)?.columns.find((c) => c.columnName === columnName.toUpperCase()) ?? null
}

/** 선두 컬럼이 일치하는 인덱스 */
export function getIndexOn(tableName: string, columnName: string): IndexStats | null {
  return getTableStats(tableName)?.indexes.find((i) => i.columns[0] === columnName.toUpperCase()) ?? null
}

/** 단일 컬럼 Unique 인덱스인지 (= 조건이면 INDEX UNIQUE SCAN 가능) */
export function isUniqueLookup(index: IndexStats): boolean {
  return index.unique && index.columns.length === 1
}

export function getTableRows(tableName: string): RowData[] {
  return ALL_TABLES.find((t) => t.name === tableName.toUpperCase())?.rows ?? []
}

export function getTableColumns(tableName: string): string[] | null {
  return ALL_TABLES.find((t) => t.name === tableName.toUpperCase())?.columns.map((c) => c.name) ?? null
}

export function getSchemaOf(tableName: string): string {
  return ALL_TABLES.find((t) => t.name === tableName.toUpperCase())?.schema ?? 'HR'
}
