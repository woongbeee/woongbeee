// ─── SQL Parser ───────────────────────────────────────────────────────────
// Oracle 의 Parse 단계 중 앞의 두 검사를 흉내 낸다.
//   1) parseSyntax()      — Syntax Check  : 문법이 맞는지 (ORA-009xx)
//   2) resolveSemantics() — Semantic Check: 테이블·컬럼이 실제로 있는지 (ORA-00942 / ORA-00904)
// 세 번째 검사인 Shared Pool Check 는 시뮬레이터 엔진(src/lib/simulator)이 맡는다.
//
// 지원 범위: SELECT (JOIN · WHERE · IN/EXISTS 서브쿼리 · GROUP BY · HAVING · ORDER BY · FETCH FIRST · ROWNUM),
//            INSERT … VALUES, UPDATE, DELETE, COMMIT, ROLLBACK.

import type {
  JoinCondition, JoinType, L, ParsedQuery, Predicate, PredicateOp, SqlError, StatementType, TableRef,
} from './types'
import { getTableColumns } from './stats'

// ── Errors ────────────────────────────────────────────────────────────────

class SqlException extends Error {
  detail: SqlError
  constructor(detail: SqlError) {
    super(detail.code)
    this.detail = detail
  }
}

const ORA: Record<string, L> = {
  'ORA-00900': { en: 'invalid SQL statement', ko: 'SQL 문이 부적합합니다' },
  'ORA-00903': { en: 'invalid table name', ko: '테이블명이 부적합합니다' },
  'ORA-00904': { en: 'invalid identifier', ko: '부적합한 식별자' },
  'ORA-00905': { en: 'missing keyword', ko: '누락된 키워드' },
  'ORA-00907': { en: 'missing right parenthesis', ko: '누락된 우괄호' },
  'ORA-00908': { en: 'missing NULL keyword', ko: 'NULL 키워드가 누락되었습니다' },
  'ORA-00911': { en: 'invalid character', ko: '문자가 부적합합니다' },
  'ORA-00913': { en: 'too many values', ko: '값의 수가 너무 많습니다' },
  'ORA-00918': { en: 'column ambiguously defined', ko: '열의 정의가 애매합니다' },
  'ORA-00920': { en: 'invalid relational operator', ko: '관계 연산자가 부적합합니다' },
  'ORA-00923': { en: 'FROM keyword not found where expected', ko: 'FROM 키워드가 필요한 위치에 없습니다' },
  'ORA-00924': { en: 'missing BY keyword', ko: 'BY 키워드가 누락되었습니다' },
  'ORA-00925': { en: 'missing INTO keyword', ko: 'INTO 키워드가 누락되었습니다' },
  'ORA-00926': { en: 'missing VALUES keyword', ko: 'VALUES 키워드가 누락되었습니다' },
  'ORA-00927': { en: 'missing equal sign', ko: '등호가 누락되었습니다' },
  'ORA-00933': { en: 'SQL command not properly ended', ko: 'SQL 명령어가 올바르게 종료되지 않았습니다' },
  'ORA-00936': { en: 'missing expression', ko: '누락된 표현식' },
  'ORA-00942': { en: 'table or view does not exist', ko: '테이블 또는 뷰가 존재하지 않습니다' },
  'ORA-00947': { en: 'not enough values', ko: '값의 수가 충분하지 않습니다' },
  'ORA-00971': { en: 'missing SET keyword', ko: 'SET 키워드가 없습니다' },
  'ORA-01756': { en: 'quoted string not properly terminated', ko: '단일 인용부를 지정해 주십시오' },
}

function fail(code: string, stage: SqlError['stage'], subject?: string): never {
  const base = ORA[code]
  const prefix = subject ? `${subject}: ` : ''
  throw new SqlException({
    code,
    stage,
    message: { ko: `${code}: ${prefix}${base.ko}`, en: `${code}: ${prefix}${base.en}` },
  })
}

function unsupported(ko: string, en = ko): never {
  throw new SqlException({
    code: 'SIM-UNSUPPORTED',
    stage: 'syntax',
    message: {
      ko: `${ko} — 올바른 Oracle SQL일 수 있지만, 이 시뮬레이터가 아직 다루지 않는 문장이에요. SELECT · INSERT · UPDATE · DELETE · COMMIT · ROLLBACK 을 써 보세요.`,
      en: `${en} — this may be valid Oracle SQL, but the simulator does not model it yet. Try SELECT, INSERT, UPDATE, DELETE, COMMIT or ROLLBACK.`,
    },
  })
}

// ── Tokenizer ─────────────────────────────────────────────────────────────

type TokType = 'id' | 'num' | 'str' | 'bind' | 'sym'
interface Tok { t: TokType; v: string }

const TOKEN_RE = /\s+|--[^\n]*|'(?:[^']|'')*'|'|:[A-Za-z_]\w*|\d+(?:\.\d+)?|"[^"]+"|[A-Za-z_][\w$#]*|<>|!=|\^=|<=|>=|\|\||[(),.*=<>;+\-/]|./gy

function tokenize(sql: string): Tok[] {
  const toks: Tok[] = []
  TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(sql)) !== null) {
    const s = m[0]
    if (/^\s/.test(s) || s.startsWith('--')) continue
    if (s === "'") fail('ORA-01756', 'syntax')
    if (s.startsWith("'")) toks.push({ t: 'str', v: s.slice(1, -1).replace(/''/g, "'") })
    else if (s.startsWith(':')) toks.push({ t: 'bind', v: s.toUpperCase() })
    else if (/^\d/.test(s)) toks.push({ t: 'num', v: s })
    else if (s.startsWith('"')) toks.push({ t: 'id', v: s.slice(1, -1).toUpperCase() })
    else if (/^[A-Za-z_]/.test(s)) toks.push({ t: 'id', v: s.toUpperCase() })
    else if (/^(<>|!=|\^=|<=|>=|\|\||[(),.*=<>;+\-/])$/.test(s)) toks.push({ t: 'sym', v: s === '!=' || s === '^=' ? '<>' : s })
    else fail('ORA-00911', 'syntax')
  }
  while (toks.length > 0 && toks[toks.length - 1].v === ';' && toks[toks.length - 1].t === 'sym') toks.pop()
  return toks
}

const RESERVED = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'BETWEEN', 'AS', 'DISTINCT', 'UNIQUE',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'BY', 'GROUP', 'ORDER', 'HAVING', 'ON', 'JOIN', 'INNER',
  'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'NULLS', 'FIRST', 'LAST', 'SYSDATE', 'SYSTIMESTAMP', 'ROWNUM', 'ROWID',
  'USER', 'DATE', 'TIMESTAMP', 'INTERVAL', 'FETCH', 'NEXT', 'ROWS', 'ROW', 'ONLY', 'SET', 'VALUES', 'INTO', 'EXISTS',
  'UNION', 'INTERSECT', 'MINUS', 'OFFSET', 'UPDATE', 'DELETE', 'INSERT', 'ESCAPE', 'ANY', 'ALL', 'SOME',
])
const AGGREGATES = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'LISTAGG', 'STDDEV', 'VARIANCE', 'MEDIAN'])
const SELECT_STOPS = ['WHERE', 'GROUP', 'HAVING', 'ORDER', 'FETCH', 'OFFSET', 'UNION', 'INTERSECT', 'MINUS']
const JOIN_STARTS = ['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'NATURAL']

const isId = (tok: Tok | undefined, v?: string) => tok?.t === 'id' && (v === undefined || tok.v === v)
const isSym = (tok: Tok | undefined, v: string) => tok?.t === 'sym' && tok.v === v
const isName = (tok: Tok | undefined) => tok?.t === 'id' && !RESERVED.has(tok.v)

function tokText(toks: Tok[]): string {
  let out = ''
  toks.forEach((tok, i) => {
    const s = tok.t === 'str' ? `'${tok.v}'` : tok.v
    const prev = toks[i - 1]
    const tight = !prev || tok.v === '.' || prev.v === '.' || prev.v === '(' || tok.v === ')' || tok.v === ','
      || (tok.v === '(' && prev.t === 'id' && !RESERVED.has(prev.v))
      || ['=', '<>', '<', '>', '<=', '>='].includes(tok.v) || ['=', '<>', '<', '>', '<=', '>='].includes(prev.v)
    out += (tight ? '' : ' ') + s
  })
  return out
}

// ── Raw (syntax-only) representation ──────────────────────────────────────

/** scope = 서브쿼리 안에서 나온 컬럼이면 그 서브쿼리 테이블의 index (이름을 거기서 먼저 찾는다) */
interface RawCol { q?: string; name: string; scope?: number }
interface RawRef { name: string; alias: string; semi?: boolean }
type JoinKind = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'SEMI'

interface RawCond {
  lhs: RawCol | null
  wrapped: boolean
  op: PredicateOp
  rhsCol?: RawCol
  values: (string | number)[]
  isBind: boolean
  orGroup?: number
  joinKind: JoinKind
  joinRef?: number        // JOIN … ON 에서 새로 붙는 테이블의 index
  text: string
}

interface RawQuery {
  type: StatementType
  refs: RawRef[]
  selectAll: boolean
  cols: RawCol[]            // 문장 전체에서 참조한 컬럼 (존재 검사용)
  conds: RawCond[]
  groupCols: RawCol[]
  orderCols: RawCol[]
  orderItems: number
  limitKind: 'fetch' | 'rownum' | null
  inexact: boolean
  hasGroupBy: boolean
  hasOrderBy: boolean
  hasDistinct: boolean
  hasAggregate: boolean
  hasCountStar: boolean
  hasOr: boolean
  fetchFirst: number | null
  setCols: string[]
  insertCols: string[] | null
  insertValueCount: number
  bindNames: string[]
  tokenCount: number
  rawSQL: string
}

// ── Syntax check ──────────────────────────────────────────────────────────

class Parser {
  toks: Tok[]
  i = 0
  orSeq = 0
  scope: number | undefined = undefined   // 지금 파싱 중인 서브쿼리 테이블 (없으면 바깥 질의)
  q: RawQuery

  constructor(toks: Tok[], sql: string) {
    this.toks = toks
    this.q = {
      type: 'SELECT', refs: [], selectAll: false, cols: [], conds: [], groupCols: [], orderCols: [], orderItems: 0,
      limitKind: null, inexact: false,
      hasGroupBy: false, hasOrderBy: false, hasDistinct: false, hasAggregate: false, hasCountStar: false,
      hasOr: false, fetchFirst: null, setCols: [], insertCols: null, insertValueCount: 0,
      bindNames: [...new Set(toks.filter((t) => t.t === 'bind').map((t) => t.v))],
      tokenCount: toks.length, rawSQL: sql,
    }
  }

  peek(o = 0) { return this.toks[this.i + o] }
  done() { return this.i >= this.toks.length }
  eatId(v: string) { if (isId(this.peek(), v)) { this.i++; return true } return false }
  eatSym(v: string) { if (isSym(this.peek(), v)) { this.i++; return true } return false }

  /** 괄호 깊이 0 에서 stop 키워드를 만날 때까지의 토큰 */
  sliceUntil(stops: string[]): Tok[] {
    const out: Tok[] = []
    let depth = 0
    while (!this.done()) {
      const tok = this.peek()
      if (isSym(tok, '(')) depth++
      else if (isSym(tok, ')')) { depth--; if (depth < 0) fail('ORA-00933', 'syntax') }
      else if (depth === 0 && tok.t === 'id' && stops.includes(tok.v)) break
      out.push(tok)
      this.i++
    }
    if (depth > 0) fail('ORA-00907', 'syntax')
    return out
  }

  end() {
    if (!this.done()) {
      const tok = this.peek()
      if (isId(tok) && ['UNION', 'INTERSECT', 'MINUS', 'OFFSET'].includes(tok.v)) unsupported(tok.v)
      fail('ORA-00933', 'syntax')
    }
  }

  // ── column references inside an expression ──
  collectCols(toks: Tok[]): RawCol[] {
    const cols: RawCol[] = []
    for (let k = 0; k < toks.length; k++) {
      const tok = toks[k]
      if (isId(tok, 'SELECT')) unsupported('Scalar Subquery (식 안에 들어간 서브쿼리)', 'Scalar subquery (a subquery inside an expression)')
      if (!isName(tok)) continue
      const next = toks[k + 1]
      const prev = toks[k - 1]
      if (isSym(next, '(')) {
        if (AGGREGATES.has(tok.v)) {
          this.q.hasAggregate = true
          if (tok.v === 'COUNT' && isSym(toks[k + 2], '*')) this.q.hasCountStar = true
        }
        continue
      }
      if (isSym(next, '.')) {
        const third = toks[k + 2]
        if (isSym(third, '*')) this.q.selectAll = true
        else if (third?.t === 'id') cols.push({ q: tok.v, name: third.v, scope: this.scope })
        k += 2
        continue
      }
      // "expr alias" · "expr AS alias" 의 alias 는 컬럼이 아니다
      const afterValue = prev && (isName(prev) || prev.t === 'num' || prev.t === 'str' || isSym(prev, ')') || isId(prev, 'AS') || isId(prev, 'END'))
      if (afterValue) continue
      cols.push({ name: tok.v, scope: this.scope })
    }
    return cols
  }

  splitCommas(toks: Tok[]): Tok[][] {
    const parts: Tok[][] = [[]]
    let depth = 0
    for (const tok of toks) {
      if (isSym(tok, '(')) depth++
      if (isSym(tok, ')')) depth--
      if (depth === 0 && isSym(tok, ',')) parts.push([])
      else parts[parts.length - 1].push(tok)
    }
    if (parts.some((p) => p.length === 0)) fail('ORA-00936', 'syntax')
    return parts
  }

  // ── conditions ──
  splitTop(toks: Tok[], kw: 'AND' | 'OR'): Tok[][] {
    const parts: Tok[][] = [[]]
    let depth = 0
    let between = false
    for (const tok of toks) {
      if (isSym(tok, '(')) depth++
      if (isSym(tok, ')')) depth--
      if (depth === 0 && isId(tok, 'BETWEEN')) between = true
      if (depth === 0 && isId(tok, kw)) {
        if (kw === 'AND' && between) between = false
        else { parts.push([]); continue }
      }
      parts[parts.length - 1].push(tok)
    }
    if (parts.some((p) => p.length === 0)) fail('ORA-00936', 'syntax')
    return parts
  }

  parseConds(toks: Tok[], joinKind: JoinKind, joinRef: number | undefined, orGroup?: number) {
    if (toks.length === 0) fail('ORA-00936', 'syntax')
    const disjuncts = this.splitTop(toks, 'OR')
    let group = orGroup
    if (disjuncts.length > 1) {
      this.q.hasOr = true
      group = group ?? ++this.orSeq
    }
    for (const d of disjuncts) {
      for (const atom of this.splitTop(d, 'AND')) {
        if (this.isParenWrapped(atom) && !isId(atom[1], 'SELECT')) {
          this.parseConds(atom.slice(1, -1), joinKind, joinRef, group)
        } else {
          this.parseAtom(atom, joinKind, joinRef, group)
        }
      }
    }
  }

  isParenWrapped(toks: Tok[]): boolean {
    if (!isSym(toks[0], '(') || !isSym(toks[toks.length - 1], ')')) return false
    let depth = 0
    for (let k = 0; k < toks.length; k++) {
      if (isSym(toks[k], '(')) depth++
      if (isSym(toks[k], ')')) depth--
      if (depth === 0 && k < toks.length - 1) return false
    }
    return true
  }

  colExpr(toks: Tok[]): { col: RawCol | null; wrapped: boolean } {
    if (toks.length === 1 && isName(toks[0])) return { col: { name: toks[0].v, scope: this.scope }, wrapped: false }
    if (toks.length === 3 && isName(toks[0]) && isSym(toks[1], '.') && toks[2].t === 'id') {
      return { col: { q: toks[0].v, name: toks[2].v, scope: this.scope }, wrapped: false }
    }
    const cols = this.collectCols(toks)
    this.q.cols.push(...cols.slice(1))
    return { col: cols[0] ?? null, wrapped: true }
  }

  literals(toks: Tok[]): { values: (string | number)[]; isBind: boolean } {
    const values: (string | number)[] = []
    let isBind = false
    toks.forEach((tok, k) => {
      if (tok.t === 'num') values.push(Number(tok.v) * (isSym(toks[k - 1], '-') ? -1 : 1))
      else if (tok.t === 'str') values.push(tok.v)
      else if (tok.t === 'bind') isBind = true
    })
    return { values, isBind }
  }

  parseAtom(toks: Tok[], joinKind: JoinKind, joinRef: number | undefined, orGroup: number | undefined) {
    const text = tokText(toks)
    if (toks.some((t) => isId(t, 'SELECT'))) return this.subquery(toks, orGroup)
    if (this.rownumLimit(toks, orGroup)) return
    const negatedWhole = isId(toks[0], 'NOT')
    const body = negatedWhole ? toks.slice(1) : toks
    if (body.length === 0) fail('ORA-00936', 'syntax')

    // 깊이 0 의 연산자 찾기
    let depth = 0
    let at = -1
    let width = 1
    let op: PredicateOp | null = null
    let negated = negatedWhole
    for (let k = 0; k < body.length && at < 0; k++) {
      const tok = body[k]
      if (isSym(tok, '(')) depth++
      else if (isSym(tok, ')')) depth--
      else if (depth === 0) {
        if (tok.t === 'sym' && ['=', '<>', '<', '>', '<=', '>='].includes(tok.v)) { at = k; op = tok.v as PredicateOp }
        else if (tok.t === 'id' && ['LIKE', 'IN', 'BETWEEN', 'IS'].includes(tok.v)) {
          at = k
          op = tok.v === 'IS' ? 'IS NULL' : (tok.v as PredicateOp)
          if (isId(body[k - 1], 'NOT')) { at = k - 1; width = 2; negated = true }
        }
      }
    }
    if (at < 0 || op === null) fail('ORA-00920', 'syntax')
    const lhsToks = body.slice(0, at)
    let rhsToks = body.slice(at + width)
    if (lhsToks.length === 0) fail('ORA-00936', 'syntax')

    const cond: RawCond = { lhs: null, wrapped: false, op, values: [], isBind: false, orGroup, joinKind, joinRef, text }
    const lhs = this.colExpr(lhsToks)
    cond.lhs = lhs.col
    cond.wrapped = lhs.wrapped

    if (op === 'IS NULL') {
      if (isId(rhsToks[0], 'NOT')) { cond.op = 'IS NOT NULL'; rhsToks = rhsToks.slice(1) }
      if (rhsToks.length !== 1 || !isId(rhsToks[0], 'NULL')) fail('ORA-00908', 'syntax')
    } else {
      if (rhsToks.length === 0) fail('ORA-00936', 'syntax')
      if (op === 'IN' && !isSym(rhsToks[0], '(')) fail('ORA-00936', 'syntax')
      const rhs = ['IN', 'BETWEEN', 'LIKE'].includes(op) ? { col: null, wrapped: true } : this.colExpr(rhsToks)
      if (rhs.col && !rhs.wrapped && cond.lhs && !cond.wrapped) {
        cond.rhsCol = rhs.col
      } else if (rhs.col && !rhs.wrapped && !cond.lhs) {
        // 10 = COL  →  COL = 10
        const flip: Partial<Record<PredicateOp, PredicateOp>> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }
        cond.lhs = rhs.col
        cond.wrapped = false
        cond.op = flip[op] ?? op
        Object.assign(cond, this.literals(lhsToks))
      } else {
        if (rhs.col) this.q.cols.push(rhs.col)
        Object.assign(cond, this.literals(rhsToks))
      }
      if (negated) {
        // NOT IN · NOT LIKE · NOT BETWEEN · NOT (…) 은 인덱스로 좁힐 수 없는 일반 필터로 취급
        cond.op = '<>'
        cond.wrapped = true
      }
    }
    if (cond.lhs) this.q.cols.push(cond.lhs)
    if (cond.rhsCol) this.q.cols.push(cond.rhsCol)
    this.q.conds.push(cond)
  }

  /** WHERE ROWNUM <= n — 걸러 내는 조건이 아니라 "n행에서 멈춰라" 는 표시(COUNT STOPKEY)로 다룬다 */
  rownumLimit(toks: Tok[], orGroup: number | undefined): boolean {
    if (!toks.some((t) => isId(t, 'ROWNUM'))) return false
    const [lhs, op, rhs] = toks
    if (toks.length !== 3 || !isId(lhs, 'ROWNUM') || op.t !== 'sym' || rhs.t !== 'num' || orGroup !== undefined || this.scope !== undefined) {
      unsupported('이 형태의 ROWNUM 조건 (ROWNUM <= n 만 지원)', 'This form of ROWNUM condition (only ROWNUM <= n is supported)')
    }
    const n = Number(rhs.v)
    if (op.v === '<=') this.q.fetchFirst = n
    else if (op.v === '<') this.q.fetchFirst = Math.max(0, n - 1)
    else if (op.v === '=' && n === 1) this.q.fetchFirst = 1
    else unsupported('ROWNUM > n · ROWNUM = n (항상 0행이 되는 조건)', 'ROWNUM > n or ROWNUM = n (a condition that never returns rows)')
    this.q.limitKind = 'rownum'
    return true
  }

  /**
   * WHERE 절의 서브쿼리. 조인으로 풀 수 있는 두 형태만 받는다 (Subquery Unnesting → Semi Join):
   *   col IN (SELECT col FROM t [WHERE …])     ·     EXISTS (SELECT … FROM t WHERE t.x = outer.x …)
   */
  subquery(toks: Tok[], orGroup: number | undefined) {
    const open = toks.findIndex((t) => isSym(t, '('))
    const head = toks.slice(0, Math.max(0, open))
    if (head.some((t) => isId(t, 'NOT'))) unsupported('NOT IN / NOT EXISTS 서브쿼리 (Anti Join)', 'NOT IN / NOT EXISTS subquery (antijoin)')
    const isIn = head.length >= 2 && isId(head[head.length - 1], 'IN')
    const isExists = head.length === 1 && isId(head[0], 'EXISTS')
    if ((!isIn && !isExists) || open < 0 || !isSym(toks[toks.length - 1], ')') || !isId(toks[open + 1], 'SELECT')) {
      unsupported('이 형태의 서브쿼리 (col IN (SELECT …) 과 EXISTS (SELECT …) 만 지원)', 'This form of subquery (only col IN (SELECT …) and EXISTS (SELECT …) are supported)')
    }
    if (orGroup !== undefined) unsupported('OR 안에 들어간 서브쿼리', 'A subquery inside an OR')
    if (this.scope !== undefined) unsupported('서브쿼리 안의 서브쿼리', 'A subquery nested inside a subquery')
    if (this.q.type !== 'SELECT') unsupported('DML 문의 서브쿼리', 'A subquery in a DML statement')
    const outer = isIn ? this.colExpr(head.slice(0, -1)) : null
    if (outer && (!outer.col || outer.wrapped)) unsupported('IN 앞에 식이 오는 서브쿼리', 'A subquery whose IN operand is an expression')

    // 같은 Parser 로 안쪽 SELECT 를 읽는다
    const saved = { toks: this.toks, i: this.i }
    this.toks = toks.slice(open + 1, -1)
    this.i = 1 // SELECT
    if (!this.eatId('DISTINCT')) this.eatId('UNIQUE') // IN · EXISTS 안에서는 있으나 없으나 같다
    const list = this.sliceUntil(['FROM'])
    if (list.length === 0) fail('ORA-00936', 'syntax')
    if (this.done()) fail('ORA-00923', 'syntax')
    this.i++ // FROM
    const ref = this.tableRef(true, true)
    this.q.refs[ref].semi = true
    this.scope = ref
    const after = this.peek()
    if (isSym(after, ',') || (isId(after) && JOIN_STARTS.includes(after.v))) unsupported('서브쿼리 안의 조인', 'A join inside a subquery')
    if (outer?.col) {
      const items = this.splitCommas(list)
      if (items.length > 1) fail('ORA-00913', 'syntax')
      const inner = this.colExpr(items[0])
      if (!inner.col || inner.wrapped) unsupported('서브쿼리 SELECT 목록의 식', 'An expression in the select list of a subquery')
      const text = `${tokText(head.slice(0, -1))}=${this.q.refs[ref].alias}.${inner.col.name}`
      this.q.cols.push(outer.col, inner.col)
      this.q.conds.push({ lhs: outer.col, wrapped: false, op: '=', rhsCol: inner.col, values: [], isBind: false, joinKind: 'SEMI', joinRef: ref, text })
    }
    if (this.eatId('WHERE')) {
      const where = this.sliceUntil(SELECT_STOPS)
      if (where.length === 0) fail('ORA-00936', 'syntax')
      this.parseConds(where, 'SEMI', ref)
    }
    if (!this.done()) unsupported('GROUP BY · ORDER BY 가 있는 서브쿼리', 'A subquery with GROUP BY or ORDER BY')
    this.scope = undefined
    this.toks = saved.toks
    this.i = saved.i
  }

  // ── table reference ──
  tableRef(allowAlias = true, inSubquery = false): number {
    if (isSym(this.peek(), '(')) unsupported('Inline View (FROM 절의 서브쿼리)', 'Inline view (a subquery in the FROM clause)')
    if (!isName(this.peek())) fail('ORA-00903', 'syntax')
    let name = this.toks[this.i++].v
    if (this.eatSym('.')) {
      if (!isName(this.peek())) fail('ORA-00903', 'syntax')
      name = this.toks[this.i++].v // 스키마 접두사(HR.·CO.)는 떼어 낸다
    }
    let alias = name
    this.eatId('AS')
    const tok = this.peek()
    if (allowAlias && isName(tok) && !SELECT_STOPS.includes(tok.v) && !JOIN_STARTS.includes(tok.v)) {
      alias = tok.v
      this.i++
    }
    // 서브쿼리가 바깥과 같은 이름을 쓰면 구분할 수 있게 접미사를 붙여 준다
    if (inSubquery && this.q.refs.some((r) => r.alias === alias)) alias = `${alias}_SQ`
    this.q.refs.push({ name, alias })
    return this.q.refs.length - 1
  }

  whereClause() {
    if (this.eatId('WHERE')) {
      const toks = this.sliceUntil(SELECT_STOPS)
      if (toks.length === 0) fail('ORA-00936', 'syntax')
      this.parseConds(toks, 'INNER', undefined)
    }
  }

  // ── statements ──
  select() {
    this.i++
    if (this.eatId('DISTINCT') || this.eatId('UNIQUE')) this.q.hasDistinct = true
    else this.eatId('ALL')
    const list = this.sliceUntil(['FROM'])
    if (list.length === 0) fail('ORA-00936', 'syntax')
    if (this.done()) fail('ORA-00923', 'syntax')
    for (const item of this.splitCommas(list)) {
      if (item.length === 1 && isSym(item[0], '*')) this.q.selectAll = true
      else this.q.cols.push(...this.collectCols(item))
    }
    this.i++ // FROM

    this.tableRef()
    for (;;) {
      if (this.eatSym(',')) { this.tableRef(); continue }
      const tok = this.peek()
      if (!isId(tok) || !JOIN_STARTS.includes(tok.v)) break
      if (tok.v === 'NATURAL') unsupported('NATURAL JOIN')
      let kind: JoinKind = 'INNER'
      let cross = false
      if (tok.v !== 'JOIN') {
        if (tok.v === 'CROSS') cross = true
        else if (tok.v !== 'INNER') kind = tok.v as JoinKind
        this.i++
        this.eatId('OUTER')
      }
      if (!this.eatId('JOIN')) fail('ORA-00905', 'syntax')
      const ref = this.tableRef()
      if (cross) continue
      if (isId(this.peek(), 'USING')) unsupported('JOIN … USING')
      if (!this.eatId('ON')) fail('ORA-00905', 'syntax')
      const cond = this.sliceUntil([...SELECT_STOPS, ...JOIN_STARTS])
      this.parseConds(cond, kind, ref)
    }

    this.whereClause()
    if (this.eatId('GROUP')) {
      if (!this.eatId('BY')) fail('ORA-00924', 'syntax')
      const toks = this.sliceUntil(SELECT_STOPS)
      this.q.hasGroupBy = true
      for (const part of this.splitCommas(toks)) this.q.groupCols.push(...this.collectCols(part))
      this.q.cols.push(...this.q.groupCols)
    }
    if (this.eatId('HAVING')) {
      const toks = this.sliceUntil(SELECT_STOPS)
      if (toks.length === 0) fail('ORA-00936', 'syntax')
      this.collectCols(toks)
    }
    if (this.eatId('ORDER')) {
      if (!this.eatId('BY')) fail('ORA-00924', 'syntax')
      const parts = this.splitCommas(this.sliceUntil(SELECT_STOPS))
      for (const part of parts) this.q.orderCols.push(...this.collectCols(part))
      this.q.orderItems = parts.length
      this.q.hasOrderBy = true
    }
    if (this.eatId('FETCH')) {
      if (!this.eatId('FIRST') && !this.eatId('NEXT')) fail('ORA-00933', 'syntax')
      const n = this.peek()
      if (n?.t === 'num') { this.q.fetchFirst = Number(n.v); this.i++ } else this.q.fetchFirst = 1
      if (!this.eatId('ROWS') && !this.eatId('ROW')) fail('ORA-00933', 'syntax')
      if (!this.eatId('ONLY')) fail('ORA-00933', 'syntax')
      if (this.q.limitKind === 'rownum') unsupported('ROWNUM 과 FETCH FIRST 를 함께 쓰는 문장', 'ROWNUM combined with FETCH FIRST')
      this.q.limitKind = 'fetch'
    }
    this.end()
  }

  update() {
    this.i++
    this.q.type = 'UPDATE'
    this.tableRef()
    if (!this.eatId('SET')) fail('ORA-00971', 'syntax')
    const toks = this.sliceUntil(['WHERE'])
    if (toks.length === 0) fail('ORA-00936', 'syntax')
    for (const part of this.splitCommas(toks)) {
      const eq = part.findIndex((t) => isSym(t, '='))
      if (eq < 0) fail('ORA-00927', 'syntax')
      const target = part.slice(0, eq)
      const col = target[target.length - 1]
      if (!isName(col)) fail('ORA-00904', 'syntax')
      if (eq === part.length - 1) fail('ORA-00936', 'syntax')
      this.q.setCols.push(col.v)
      this.q.cols.push({ name: col.v }, ...this.collectCols(part.slice(eq + 1)))
    }
    this.whereClause()
    this.end()
  }

  delete() {
    this.i++
    this.q.type = 'DELETE'
    this.eatId('FROM')
    this.tableRef()
    this.whereClause()
    this.end()
  }

  insert() {
    this.i++
    this.q.type = 'INSERT'
    if (!this.eatId('INTO')) fail('ORA-00925', 'syntax')
    this.tableRef(false)
    if (isSym(this.peek(), '(')) {
      this.i++
      const cols = this.sliceUntilParenClose()
      this.q.insertCols = this.splitCommas(cols).map((p) => {
        if (p.length !== 1 || !isName(p[0])) fail('ORA-00904', 'syntax')
        return p[0].v
      })
    }
    if (isId(this.peek(), 'SELECT')) unsupported('INSERT … SELECT')
    if (!this.eatId('VALUES')) fail('ORA-00926', 'syntax')
    if (!this.eatSym('(')) fail('ORA-00936', 'syntax')
    this.q.insertValueCount = this.splitCommas(this.sliceUntilParenClose()).length
    this.end()
  }

  sliceUntilParenClose(): Tok[] {
    const out: Tok[] = []
    let depth = 0
    while (!this.done()) {
      const tok = this.toks[this.i++]
      if (isSym(tok, '(')) depth++
      if (isSym(tok, ')')) {
        if (depth === 0) return out
        depth--
      }
      out.push(tok)
    }
    return fail('ORA-00907', 'syntax')
  }

  transactionControl(type: 'COMMIT' | 'ROLLBACK') {
    this.i++
    this.q.type = type
    this.eatId('WORK')
    if (type === 'ROLLBACK' && isId(this.peek(), 'TO')) unsupported('ROLLBACK TO SAVEPOINT')
    this.end()
  }
}

const UNSUPPORTED_STARTS = new Set([
  'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'MERGE', 'WITH', 'BEGIN', 'DECLARE', 'GRANT', 'REVOKE', 'SAVEPOINT',
  'EXPLAIN', 'CALL', 'LOCK', 'RENAME', 'COMMENT', 'ANALYZE', 'SET', 'EXEC', 'EXECUTE',
])

function parseSyntax(sql: string): RawQuery {
  const toks = tokenize(sql)
  if (toks.length === 0) fail('ORA-00900', 'syntax')
  const p = new Parser(toks, sql)
  const first = toks[0]
  if (first.t !== 'id') fail('ORA-00900', 'syntax')
  switch (first.v) {
    case 'SELECT': p.select(); break
    case 'UPDATE': p.update(); break
    case 'DELETE': p.delete(); break
    case 'INSERT': p.insert(); break
    case 'COMMIT': p.transactionControl('COMMIT'); break
    case 'ROLLBACK': p.transactionControl('ROLLBACK'); break
    default:
      if (UNSUPPORTED_STARTS.has(first.v)) unsupported(first.v)
      fail('ORA-00900', 'syntax')
  }
  return p.q
}

// ── Semantic check ────────────────────────────────────────────────────────

function resolveSemantics(raw: RawQuery): ParsedQuery {
  const tables: TableRef[] = []
  const columnsOf: Record<string, string[]> = {}
  for (const ref of raw.refs) {
    const cols = getTableColumns(ref.name)
    if (!cols) fail('ORA-00942', 'semantic')
    tables.push({ name: ref.name, alias: ref.alias })
    columnsOf[ref.alias] = cols
  }
  const semiAliases = raw.refs.filter((r) => r.semi).map((r) => r.alias)

  const used: Record<string, Set<string>> = Object.fromEntries(tables.map((t) => [t.alias, new Set<string>()]))
  const resolve = (col: RawCol): { alias: string; column: string } => {
    // 서브쿼리 테이블은 그 서브쿼리 안에서만 보인다
    const visible = tables.filter((t, i) => !semiAliases.includes(t.alias) || i === col.scope)
    if (col.q) {
      const ref = visible.find((t) => t.alias === col.q) ?? visible.find((t) => t.name === col.q)
      if (!ref || !columnsOf[ref.alias].includes(col.name)) fail('ORA-00904', 'semantic', `"${col.q}"."${col.name}"`)
      used[ref.alias].add(col.name)
      return { alias: ref.alias, column: col.name }
    }
    // 서브쿼리 안의 이름은 서브쿼리 테이블에서 먼저 찾고, 없으면 바깥 질의에서 찾는다 (Correlation)
    const own = col.scope !== undefined && columnsOf[tables[col.scope].alias].includes(col.name) ? [tables[col.scope]] : null
    const owners = own ?? visible.filter((t) => columnsOf[t.alias].includes(col.name))
    if (owners.length === 0) fail('ORA-00904', 'semantic', `"${col.name}"`)
    if (owners.length > 1) fail('ORA-00918', 'semantic')
    used[owners[0].alias].add(col.name)
    return { alias: owners[0].alias, column: col.name }
  }

  raw.cols.forEach(resolve)

  // ORDER BY 는 SELECT 목록의 별칭도 가리킬 수 있어서, 테이블 컬럼으로 풀리는 것만 모은다
  const orderBy: { alias: string; column: string }[] = []
  for (const col of raw.orderCols) {
    const owners = col.q
      ? tables.filter((t) => (t.alias === col.q || t.name === col.q) && columnsOf[t.alias].includes(col.name))
      : tables.filter((t) => !semiAliases.includes(t.alias) && columnsOf[t.alias].includes(col.name))
    if (col.q && owners.length === 0) fail('ORA-00904', 'semantic', `"${col.q}"."${col.name}"`)
    if (owners.length !== 1) continue
    used[owners[0].alias].add(col.name)
    orderBy.push({ alias: owners[0].alias, column: col.name })
  }

  if (raw.type === 'INSERT') {
    const tableCols = columnsOf[tables[0].alias]
    for (const c of raw.insertCols ?? []) {
      if (!tableCols.includes(c)) fail('ORA-00904', 'semantic', `"${c}"`)
    }
    const expected = raw.insertCols?.length ?? tableCols.length
    if (raw.insertValueCount > expected) fail('ORA-00913', 'semantic')
    if (raw.insertValueCount < expected) fail('ORA-00947', 'semantic')
  }

  const predicates: Predicate[] = []
  const joins: JoinCondition[] = []
  let inexact = raw.inexact
  for (const c of raw.conds) {
    if (!c.lhs) continue
    const l = resolve(c.lhs)
    if (c.rhsCol) {
      const r = resolve(c.rhsCol)
      if (l.alias !== r.alias && c.op === '=') {
        const newAlias = c.joinRef !== undefined ? tables[c.joinRef].alias : undefined
        let type: JoinType = 'INNER'
        let optionalAlias: string | undefined
        if (c.joinKind === 'SEMI' && newAlias) { type = 'SEMI'; optionalAlias = newAlias }
        else if (c.joinKind === 'FULL') type = 'FULL'
        else if (c.joinKind === 'LEFT' && newAlias) { type = 'LEFT'; optionalAlias = newAlias }
        else if (c.joinKind === 'RIGHT' && newAlias) { type = 'LEFT'; optionalAlias = l.alias === newAlias ? r.alias : l.alias }
        joins.push({ leftAlias: l.alias, leftColumn: l.column, rightAlias: r.alias, rightColumn: r.column, type, optionalAlias, text: c.text })
        continue
      }
      if (l.alias !== r.alias) {
        // 비등가 조인 조건은 흉내 내지 않는다 → 실제 행 수 대신 추정치를 쓴다
        if (c.joinKind === 'SEMI') unsupported('서브쿼리의 비등가 상관 조건', 'A non-equality correlation condition in a subquery')
        inexact = true
        continue
      }
      predicates.push({ alias: l.alias, column: l.column, operator: c.op, values: [], isBind: false, wrapped: true, orGroup: c.orGroup, text: c.text })
      continue
    }
    predicates.push({
      alias: l.alias, column: l.column, operator: c.op, values: c.values, isBind: c.isBind,
      wrapped: c.wrapped, orGroup: c.orGroup, text: c.text,
    })
  }

  for (const alias of semiAliases) {
    if (!joins.some((j) => j.type === 'SEMI' && j.optionalAlias === alias)) unsupported('바깥 질의와 이어지는 조건이 없는 EXISTS 서브쿼리', 'An EXISTS subquery with no condition linking it to the outer query')
  }

  return {
    type: raw.type,
    tables,
    selectAll: raw.selectAll,
    usedColumns: Object.fromEntries(Object.entries(used).map(([a, s]) => [a, [...s]])),
    predicates,
    joins,
    groupBy: raw.groupCols.map(resolve),
    hasGroupBy: raw.hasGroupBy,
    hasOrderBy: raw.hasOrderBy,
    hasDistinct: raw.hasDistinct,
    hasAggregate: raw.hasAggregate,
    hasCountStar: raw.hasCountStar,
    hasOr: raw.hasOr,
    orderBy,
    orderItems: raw.orderItems,
    semiAliases,
    fetchFirst: raw.fetchFirst,
    limitKind: raw.limitKind,
    inexact,
    setColumns: raw.setCols,
    bindNames: raw.bindNames,
    tokenCount: raw.tokenCount,
    rawSQL: raw.rawSQL,
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export type ParseOutcome =
  | { ok: true; query: ParsedQuery }
  | { ok: false; error: SqlError; statementType: StatementType | null; tokenCount: number }

/** Syntax Check → Semantic Check. 실패하면 어느 검사에서 걸렸는지와 ORA 코드를 돌려준다. */
export function parseSQL(sql: string): ParseOutcome {
  let raw: RawQuery | null = null
  try {
    raw = parseSyntax(sql)
    return { ok: true, query: resolveSemantics(raw) }
  } catch (e) {
    if (e instanceof SqlException) {
      return { ok: false, error: e.detail, statementType: raw?.type ?? null, tokenCount: raw?.tokenCount ?? 0 }
    }
    throw e
  }
}
