// ─── Oracle Optimizer Types ────────────────────────────────────────────────
// Oracle Database SQL Tuning Guide 의 용어를 그대로 따른다
// (Query Transformer → Estimator → Plan Generator → Row Source Generator).

/** 이중 언어 문자열. 화면에서 `text[lang]` 으로 꺼내 쓴다. */
export interface L {
  ko: string
  en: string
}

export type StatementType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'COMMIT' | 'ROLLBACK'

type AccessPathType =
  | 'FULL_TABLE_SCAN'
  | 'INDEX_UNIQUE_SCAN'
  | 'INDEX_RANGE_SCAN'
  | 'INDEX_FAST_FULL_SCAN'

export type JoinMethod = 'NESTED_LOOPS' | 'HASH_JOIN' | 'SORT_MERGE_JOIN'

/** SEMI = IN / EXISTS 서브쿼리를 풀어낸(Unnesting) 조인. 짝이 하나라도 있으면 바깥 행을 한 번만 내보낸다 */
export type JoinType = 'INNER' | 'LEFT' | 'FULL' | 'SEMI'

export type PredicateOp =
  | '=' | '<>' | '<' | '>' | '<=' | '>='
  | 'LIKE' | 'IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL'

// ── Statistics (DBMS_STATS 가 모아 두는 값들) ─────────────────────────────

export interface ColumnStats {
  columnName: string
  ndv: number          // Number of Distinct Values
  nullCount: number
  numeric: boolean     // low/high 가 실제 숫자 범위인지
  low: number
  high: number
}

export interface IndexStats {
  indexName: string
  tableName: string
  columns: string[]         // 선두 컬럼이 [0]
  unique: boolean
  blevel: number            // Root → Leaf 까지 내려가는 깊이 (Branch level)
  leafBlocks: number
  distinctKeys: number
  clusteringFactor: number
}

export interface TableStats {
  tableName: string
  abbr: string              // 버퍼 라벨용 짧은 이름
  numRows: number
  numBlocks: number
  avgRowLen: number
  columns: ColumnStats[]
  indexes: IndexStats[]
}

// ── Parsed statement ──────────────────────────────────────────────────────

export interface TableRef {
  name: string    // 실제 테이블 이름 (대문자)
  alias: string   // 별칭 — 없으면 테이블 이름과 같다. 모든 참조의 키.
}

export interface Predicate {
  alias: string
  column: string
  operator: PredicateOp
  values: (string | number)[]
  isBind: boolean          // 바인드 변수(:x) 와 비교
  wrapped: boolean         // 컬럼에 함수/연산이 씌워져 있음 → 인덱스 사용 불가
  orGroup?: number         // 같은 번호끼리는 OR 로 묶인 조건
  generated?: boolean      // Query Transformer 가 만들어 낸 조건
  text: string             // "E.DEPARTMENT_ID=60"
}

export interface JoinCondition {
  leftAlias: string
  leftColumn: string
  rightAlias: string
  rightColumn: string
  type: JoinType
  /** LEFT 조인에서 NULL 이 채워지는 쪽, SEMI 조인에서 서브쿼리 쪽 alias */
  optionalAlias?: string
  text: string
}

export interface ParsedQuery {
  type: StatementType
  tables: TableRef[]
  selectAll: boolean
  /** alias → 문장에서 실제로 쓰인 컬럼들 (SELECT·WHERE·JOIN·GROUP BY) */
  usedColumns: Record<string, string[]>
  predicates: Predicate[]
  joins: JoinCondition[]
  groupBy: { alias: string; column: string }[]
  hasGroupBy: boolean
  hasOrderBy: boolean
  hasDistinct: boolean
  hasAggregate: boolean
  hasCountStar: boolean
  hasOr: boolean
  /** ORDER BY 에 쓰인 컬럼. orderItems 와 길이가 같으면 모든 항목이 단순 컬럼이다 */
  orderBy: { alias: string; column: string }[]
  orderItems: number
  /** IN / EXISTS 서브쿼리에서 온 테이블 alias (Semi Join 대상) */
  semiAliases: string[]
  /** 행 수 제한: FETCH FIRST n ROWS ONLY 또는 ROWNUM <= n */
  fetchFirst: number | null
  limitKind: 'fetch' | 'rownum' | null
  /** 조건 일부를 흉내 내지 못해 실제 행 수를 정확히 셀 수 없음 (비등가 조인 등) */
  inexact: boolean
  setColumns: string[]       // UPDATE … SET 대상
  bindNames: string[]
  tokenCount: number
  rawSQL: string
}

export interface SqlError {
  code: string               // 'ORA-00942' | 'SIM-UNSUPPORTED'
  stage: 'syntax' | 'semantic'
  message: L
}

// ── Optimizer output ──────────────────────────────────────────────────────

export interface AccessPath {
  type: AccessPathType
  alias: string
  tableName: string
  index?: IndexStats
  indexOnly: boolean        // 테이블 블록을 안 읽어도 되는 경우
  selectivity: number
  cardinality: number
  cost: number
  ioCost: number
  cpuCost: number
  chosen: boolean
  accessPredicate?: Predicate   // 인덱스를 타는 데 쓴 조건
  reason: L
}

export interface TableEstimate {
  alias: string
  tableName: string
  numRows: number
  numBlocks: number
  selectivity: number
  cardinality: number
  notes: L[]                // 조건별 선택도 계산 과정
}

export interface TableAccessPlan {
  alias: string
  tableName: string
  accessPaths: AccessPath[]
  chosen: AccessPath
}

export interface JoinStep {
  leftLabel: string           // 지금까지 조인된 집합
  rightAlias: string
  rightTable: string
  method: JoinMethod
  type: JoinType
  conditionText: string
  inputCardinality: { left: number; right: number }
  outputCardinality: number
  cost: number                // 이 조인까지의 누적 비용
  candidates: { method: JoinMethod; cost: number }[]
  inner: AccessPath           // 오른쪽(inner/probe) 테이블 접근 방법
  reason: L
}

export interface JoinOrderCandidate {
  order: string[]
  cost: number
  chosen: boolean
}

export type PlanNodeKind = 'statement' | 'dml' | 'join' | 'table' | 'index' | 'sort' | 'hash' | 'view' | 'stopkey'

/** Row Source Tree 의 한 줄 — DBMS_XPLAN 출력 한 행에 해당 */
export interface PlanNode {
  id: number
  depth: number
  operation: string
  name?: string
  rows: number
  cost: number
  kind: PlanNodeKind
  alias?: string
  access?: string             // Predicate Information: access(...)
  filter?: string             // Predicate Information: filter(...)
  children: number[]          // 자식 노드 id
}

export interface OptimizerResult {
  query: ParsedQuery
  transformations: L[]
  estimates: TableEstimate[]
  tableAccessPlans: TableAccessPlan[]
  joinSteps: JoinStep[]
  joinOrders: JoinOrderCandidate[]
  plansConsidered: number
  planNodes: PlanNode[]
  planHash: number
  totalCost: number
  estimatedRows: number
  warnings: L[]
}
