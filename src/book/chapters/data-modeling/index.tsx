import { DataModelOverviewSection } from './DataModelOverviewSection'
import { EntitySection } from './EntitySection'
import { AttributeSection } from './AttributeSection'
import { RelationshipSection } from './RelationshipSection'
import { IdentifierSection } from './IdentifierSection'
import { NormalizationSection } from './sql/NormalizationSection'
import { JoinSection } from './sql/JoinSection'
import { TransactionSection } from './sql/TransactionSection'
import { NullSection } from './sql/NullSection'
import { IdentifierTypeSection } from './sql/IdentifierTypeSection'

export function DataModelingPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'dm-overview') return <DataModelOverviewSection />
  if (sectionId === 'dm-entity') return <EntitySection />
  if (sectionId === 'dm-attribute') return <AttributeSection />
  if (sectionId === 'dm-relationship') return <RelationshipSection />
  if (sectionId === 'dm-identifier') return <IdentifierSection />
  if (sectionId === 'dm-sql-normalization') return <NormalizationSection />
  if (sectionId === 'dm-sql-join') return <JoinSection />
  if (sectionId === 'dm-sql-transaction') return <TransactionSection />
  if (sectionId === 'dm-sql-null') return <NullSection />
  if (sectionId === 'dm-sql-identifier') return <IdentifierTypeSection />

  return <DataModelOverviewSection />
}
