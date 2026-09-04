import { OracleMemoryDiagram } from '../../../shared/OracleMemoryDiagram'

// SGA 4개 하위 영역을 표현하는 다이어그램. 실제 구현은 공용
// OracleMemoryDiagram(scope="sga") 으로 이동했고, 여기는 기존 호출부
// (SGA 하위 4개 페이지 · SgaSection · OracleInstanceMap) 호환용 얇은 래퍼.
export type SgaComponentId = 'buffer-cache' | 'shared-pool' | 'redo-log-buffer' | 'large-pool'

interface Props {
  activeId: SgaComponentId | null
}

export function SgaPositionDiagram({ activeId }: Props) {
  return <OracleMemoryDiagram scope="sga" highlight={activeId ? [activeId] : []} />
}
