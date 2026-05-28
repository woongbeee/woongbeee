import { IconRefresh, IconHistory, IconFlag, IconShieldCheck } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, InfoBox, ConceptGrid } from '../../shared'

export { TransactionOverviewSection } from './TransactionOverviewSection'
export { TransactionAcidSection } from './TransactionAcidSection'
export { TransactionCommitRollbackSection } from './TransactionCommitRollbackSection'
export { TransactionSavepointSection } from './TransactionSavepointSection'

export function TransactionSection() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  const conceptItems = isKo
    ? [
        { icon: <IconHistory size={20} stroke={1.5} />, title: 'COMMIT', desc: '트랜잭션의 모든 변경을 영구적으로 확정해요.' },
        { icon: <IconRefresh size={20} stroke={1.5} />, title: 'ROLLBACK', desc: '트랜잭션의 모든 변경을 취소하고 이전 상태로 되돌려요.' },
        { icon: <IconFlag size={20} stroke={1.5} />, title: 'SAVEPOINT', desc: '트랜잭션 중간에 복원 지점을 설정해요.' },
        { icon: <IconShieldCheck size={20} stroke={1.5} />, title: 'ACID', desc: '원자성, 일관성, 격리성, 지속성 — 트랜잭션의 네 가지 보장이에요.' },
      ]
    : [
        { icon: <IconHistory size={20} stroke={1.5} />, title: 'COMMIT', desc: 'Makes all changes in the transaction permanent.' },
        { icon: <IconRefresh size={20} stroke={1.5} />, title: 'ROLLBACK', desc: 'Undoes all changes and restores the previous state.' },
        { icon: <IconFlag size={20} stroke={1.5} />, title: 'SAVEPOINT', desc: 'Sets an intermediate restore point within a transaction.' },
        { icon: <IconShieldCheck size={20} stroke={1.5} />, title: 'ACID', desc: 'Atomicity, Consistency, Isolation, Durability — the four guarantees.' },
      ]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconRefresh size={36} stroke={1.5} className="text-teal-500" />}
        title={isKo ? '트랜잭션(Transaction)' : 'Transactions'}
        subtitle={isKo
          ? '트랜잭션은 Oracle이 데이터를 안전하게 변경하는 논리적 작업 단위예요. 왼쪽 목차에서 하위 섹션을 선택하세요.'
          : 'A transaction is the logical unit of work Oracle uses to modify data safely. Select a subsection from the left table of contents.'}
      />
      <ConceptGrid items={conceptItems} />
      <InfoBox variant="note">
        {isKo
          ? '하위 섹션: 트랜잭션이란? · ACID 속성 · COMMIT과 ROLLBACK · SAVEPOINT'
          : 'Subsections: What is a Transaction? · ACID Properties · COMMIT & ROLLBACK · SAVEPOINT'}
      </InfoBox>
    </PageContainer>
  )
}
