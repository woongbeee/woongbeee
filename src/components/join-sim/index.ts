// ============================================================================
// join-sim — 조인 시뮬레이션 공통 컴포넌트
//
//   <JoinSimulator type="left" queryDesc="..." />
//     → employees ⋈ departments 결합 과정을 단계별로 애니메이션.
//
// SQL 코드 블록·벤 다이어그램은 포함하지 않는다. 필요한 화면에서
// JOIN_SQL(아래 export)과 자체 다이어그램 구현을 조합해서 옆에 배치한다
// (예: sql-basics/dml-more/JoinSection.tsx, join/overview/OverviewSection.tsx).
// ============================================================================

export { JoinSimulator } from './JoinSimulator'
export { JOIN_SQL, type JoinType } from './joinData'
