// ============================================================================
// joinData.ts — 조인 시뮬레이션 공통 데이터 / 타입 / 행 생성기
//
// employees ⋈ departments 를 dept_id 로 조인하는 예제. 조인 종류별 컴포넌트
// (InnerJoinSim 등) 와 JoinSimulator 가 공유한다.
// ============================================================================

export type JoinType = 'inner' | 'left' | 'right' | 'full' | 'cross'

interface JoinRow {
  emp_id:     number | null
  first_name: string | null
  dept_id:    number | null
  dept_name:  string | null
  location:   string | null
  /** 행이 어느 쪽에서 왔는지 — 결과 행 배경 색 구분용. */
  _side: 'both' | 'left' | 'right'
}

export interface JoinAnimRow extends JoinRow {
  /** 원본 EMPLOYEES 인덱스 (없으면 null). */
  empIdx:  number | null
  /** 원본 DEPARTMENTS 인덱스 (없으면 null). */
  deptIdx: number | null
}

// ── 예제 데이터 ────────────────────────────────────────────────────────────

export const EMPLOYEES: Array<{ emp_id: number; first_name: string; dept_id: number | null }> = [
  { emp_id: 101, first_name: 'Alice', dept_id: 10 },
  { emp_id: 102, first_name: 'Bob',   dept_id: 20 },
  { emp_id: 103, first_name: 'Carol', dept_id: 10 },
  { emp_id: 104, first_name: 'David', dept_id: 30 },
  { emp_id: 105, first_name: 'Eva',   dept_id: 20 },
  { emp_id: 106, first_name: 'Frank', dept_id: 30 },
  { emp_id: 107, first_name: 'Grace', dept_id: 10 },
  { emp_id: 108, first_name: 'Henry', dept_id: 20 },
  { emp_id: 109, first_name: 'Iris',  dept_id: null },
]

export const DEPARTMENTS: Array<{ dept_id: number; dept_name: string; location: string }> = [
  { dept_id: 10, dept_name: 'Engineering', location: 'Seoul' },
  { dept_id: 20, dept_name: 'Analytics',   location: 'Busan' },
  { dept_id: 30, dept_name: 'Support',     location: 'Incheon' },
  { dept_id: 40, dept_name: 'Marketing',   location: 'Daegu' },
]

export const JOIN_SQL: Record<JoinType, string> = {
  inner: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nINNER JOIN departments d\n  ON e.dept_id = d.dept_id',
  left:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nLEFT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  right: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nRIGHT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  full:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nFULL OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  cross: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nCROSS JOIN departments d',
}

export function defaultRowCount(lang: 'ko' | 'en', n: number): string {
  return lang === 'ko' ? `${n}개 행 반환` : `${n} row${n === 1 ? '' : 's'} returned`
}

// ── buildAnimRows — 조인 결과를 단계 순서대로 생성 ─────────────────────────

export function buildAnimRows(type: JoinType): JoinAnimRow[] {
  if (type === 'cross') {
    const rows: JoinAnimRow[] = []
    EMPLOYEES.forEach((e, ei) => {
      DEPARTMENTS.forEach((d, di) => {
        rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di })
      })
    })
    return rows
  }

  if (type === 'right') {
    const rows: JoinAnimRow[] = []
    DEPARTMENTS.forEach((d, di) => {
      const matched = EMPLOYEES.map((e, i) => ({ e, i })).filter(({ e }) => e.dept_id === d.dept_id)
      if (matched.length > 0) {
        matched.forEach(({ e, i: ei }) => rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di }))
      } else {
        rows.push({ emp_id: null, first_name: null, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'right', empIdx: null, deptIdx: di })
      }
    })
    return rows
  }

  // inner / left / full — employees 를 순회
  const rows: JoinAnimRow[] = []
  const matchedDi = new Set<number>()
  EMPLOYEES.forEach((e, ei) => {
    const di = DEPARTMENTS.findIndex((d) => d.dept_id === e.dept_id)
    if (di !== -1) {
      matchedDi.add(di)
      const d = DEPARTMENTS[di]
      rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di })
    } else if (type === 'left' || type === 'full') {
      rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: null, location: null, _side: 'left', empIdx: ei, deptIdx: null })
    }
  })
  if (type === 'full') {
    DEPARTMENTS.forEach((d, di) => {
      if (!matchedDi.has(di)) {
        rows.push({ emp_id: null, first_name: null, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'right', empIdx: null, deptIdx: di })
      }
    })
  }
  return rows
}
