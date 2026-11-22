// ─── Partition Pruning ────────────────────────────────────────────────────
// Range 파티션 테이블에서 WHERE 조건을 보고 "읽을 필요가 없는 파티션"을 잘라 낸다.
// 결과는 실행 계획의 PARTITION RANGE SINGLE / ITERATOR / ALL / EMPTY 와 Pstart · Pstop 이 된다.
//   - 리터럴과 비교   → Parse 할 때 파티션 번호가 정해진다 (Static Pruning)
//   - 바인드 변수     → 실행할 때 정해진다 (Dynamic Pruning, Pstart/Pstop = KEY)
//   - Key 를 가공함   → 어느 파티션인지 알 수 없어 전부 읽는다 (PARTITION RANGE ALL)

import type { L, PartitionAccess, PartitionStats, Predicate, TableStats } from './types'

type Val = string | number

const cmp = (a: Val, b: Val) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)))

/** 파티션 i 가 담는 값의 범위 [lower, upper) — 첫 파티션은 아래가 열려 있다 */
function bounds(parts: PartitionStats[], i: number): { lower: Val | null; upper: Val } {
  return { lower: i === 0 ? null : parts[i - 1].highValue, upper: parts[i].highValue }
}

/** 조건 하나를 만족하는 값이 이 파티션에 있을 수 있는지 */
function mayContain(pred: Predicate, lower: Val | null, upper: Val): boolean {
  const geLower = (v: Val) => lower === null || cmp(v, lower) >= 0
  const ltUpper = (v: Val) => cmp(v, upper) < 0
  const [a, b] = pred.values
  switch (pred.operator) {
    case '=': return geLower(a) && ltUpper(a)
    case 'IN': return pred.values.some((v) => geLower(v) && ltUpper(v))
    case '<': return lower === null || cmp(lower, a) < 0
    case '<=': return lower === null || cmp(lower, a) <= 0
    case '>':
    case '>=': return cmp(upper, a) > 0
    case 'BETWEEN': return b !== undefined && (lower === null || cmp(lower, b) <= 0) && cmp(upper, a) > 0
    default: return true
  }
}

const PRUNABLE = new Set(['=', 'IN', '<', '<=', '>', '>=', 'BETWEEN'])

export function prunePartitions(ts: TableStats, alias: string, predicates: Predicate[]): PartitionAccess | undefined {
  const spec = ts.partitioning
  if (!spec) return undefined
  const parts = spec.partitions
  const total = parts.length
  const onKey = predicates.filter((p) => p.alias === alias && p.column === spec.column && p.orGroup === undefined)
  const all = (why: L | null, byKey: string | null = null): PartitionAccess => ({
    kind: 'ALL', pstart: '1', pstop: String(total), positions: parts.map((p) => p.position), names: parts.map((p) => p.name), total, byKey, why,
  })

  const usable = onKey.filter((p) => !p.wrapped && PRUNABLE.has(p.operator))
  if (usable.length === 0) {
    const wrapped = onKey.find((p) => p.wrapped)
    if (wrapped) {
      return all({
        ko: `${wrapped.text}: Partition Key ${spec.column} 을 함수로 감싸거나 가공해서, 어느 파티션에 들어 있는 값인지 알 수 없어요. 그래서 파티션 ${total}개를 전부 읽어요. 컬럼은 그대로 두고 비교할 값 쪽을 바꿔 보세요 (예: ${spec.column} >= DATE '2021-03-01' AND ${spec.column} < DATE '2021-04-01').`,
        en: `${wrapped.text}: the partition key ${spec.column} is wrapped in an expression, so the database cannot tell which partition holds the value and reads all ${total} partitions. Leave the column bare and transform the compared value instead (e.g. ${spec.column} >= DATE '2021-03-01' AND ${spec.column} < DATE '2021-04-01').`,
      })
    }
    return all({
      ko: `Partition Key ${spec.column} 에 대한 조건이 없어서 잘라 낼 파티션이 없어요. 파티션 ${total}개를 전부 읽어요.`,
      en: `There is no predicate on the partition key ${spec.column}, so nothing can be pruned: all ${total} partitions are read.`,
    })
  }

  const byKey = usable.map((p) => p.text).join(' AND ')
  // 바인드 변수 — 값을 실행할 때 알게 되므로 Pstart/Pstop 에는 KEY 라고 적힌다
  if (usable.some((p) => p.isBind)) {
    const single = usable.length === 1 && usable[0].operator === '='
    return {
      kind: single ? 'SINGLE' : 'ITERATOR', pstart: 'KEY', pstop: 'KEY',
      positions: parts.map((p) => p.position), names: parts.map((p) => p.name), total, byKey,
      why: {
        ko: '비교 값이 바인드 변수라서 Parse 하는 지금은 파티션을 정할 수 없어요. 실행할 때 값을 보고 정해요(Dynamic Pruning). 이 시뮬레이터는 값을 모르니 전부 읽는 것으로 그려요.',
        en: 'The compared value is a bind variable, so the partitions cannot be chosen at parse time; they are chosen at execution from the actual value (dynamic pruning). The simulator does not know the value and draws every partition being read.',
      },
    }
  }

  const keep = parts.filter((_, i) => {
    const { lower, upper } = bounds(parts, i)
    return usable.every((p) => mayContain(p, lower, upper))
  })
  if (keep.length === 0) {
    return { kind: 'EMPTY', pstart: 'INVALID', pstop: 'INVALID', positions: [], names: [], total, byKey, why: null }
  }
  if (keep.length === total) return all(null, byKey)
  const first = keep[0].position
  const last = keep[keep.length - 1].position
  return {
    kind: keep.length === 1 ? 'SINGLE' : 'ITERATOR',
    pstart: String(first), pstop: String(last),
    positions: keep.map((p) => p.position), names: keep.map((p) => p.name), total, byKey, why: null,
  }
}

/** 남은 파티션들의 행 수 · 블록 수 합 */
export function prunedSize(ts: TableStats, pa: PartitionAccess): { rows: number; blocks: number } {
  const parts = ts.partitioning?.partitions.filter((p) => pa.positions.includes(p.position)) ?? []
  return { rows: parts.reduce((n, p) => n + p.numRows, 0), blocks: parts.reduce((n, p) => n + p.numBlocks, 0) }
}
