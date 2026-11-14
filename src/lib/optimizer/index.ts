// Public surface of the CBO simulator.
//   parseSQL()  — Syntax Check + Semantic Check
//   optimize()  — Query Transformer → Estimator → Plan Generator (+ Row Source Tree)
// 소비처는 시뮬레이터 엔진(src/lib/simulator). 타입은 './types' 에서 직접 import.
export { parseSQL } from './parser'
export { optimize } from './planGenerator'
