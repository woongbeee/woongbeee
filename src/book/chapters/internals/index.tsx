import { OverviewSection } from './overview/OverviewSection'
import { StorageSection } from './storage/StorageSection'
import { SgaSection } from './overview/sga/SgaSection'
import { SgaBufferCacheSection } from './overview/sga/buffer-cache/BufferCacheSection'
import { SharedPoolSection } from './overview/sga/shared-pool/SharedPoolSection'
import { RedoLogBufferSection } from './overview/sga/redo-log-buffer/RedoLogBufferSection'
import { LargePoolSection } from './overview/sga/large-pool/LargePoolSection'
import { PgaSection } from './overview/pga/PgaSection'
import { UgaSection } from './overview/uga/UgaSection'
import { ProcessOverviewSection } from './overview/process/ProcessOverviewSection'
import { ServerProcessSection } from './overview/process/ServerProcessSection'
import { BackgroundProcessSection } from './overview/process/BackgroundProcessSection'
import { ConcurrencySection } from './concurrency/ConcurrencySection'
import { MvccSection } from './concurrency/MvccSection'
import { IsolationSection } from './concurrency/IsolationSection'
import { LocksSection } from './concurrency/LocksSection'
import { DeadlockSection } from './concurrency/DeadlockSection'
import {
  TransactionSection,
  TransactionOverviewSection,
  TransactionAcidSection,
  TransactionCommitRollbackSection,
  TransactionSavepointSection,
} from './transaction/TransactionSection'

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-overview')             return <OverviewSection />
  if (sectionId === 'internals-sga')                  return <SgaSection />
  if (sectionId === 'internals-sga-buffer-cache')     return <SgaBufferCacheSection />
  if (sectionId === 'internals-sga-shared-pool')      return <SharedPoolSection />
  if (sectionId === 'internals-sga-redo-log-buffer')  return <RedoLogBufferSection />
  if (sectionId === 'internals-sga-large-pool')       return <LargePoolSection />
  if (sectionId === 'internals-pga')                  return <PgaSection />
  if (sectionId === 'internals-uga')                  return <UgaSection />
  if (sectionId === 'internals-process')              return <ProcessOverviewSection />
  if (sectionId === 'internals-process-overview')     return <ProcessOverviewSection />
  if (sectionId === 'internals-process-server')       return <ServerProcessSection />
  if (sectionId === 'internals-process-background')   return <BackgroundProcessSection />
  if (sectionId === 'internals-storage')              return <StorageSection />
  if (sectionId === 'internals-concurrency')          return <ConcurrencySection />
  if (sectionId === 'internals-concurrency-mvcc')     return <MvccSection />
  if (sectionId === 'internals-concurrency-isolation') return <IsolationSection />
  if (sectionId === 'internals-concurrency-locks')    return <LocksSection />
  if (sectionId === 'internals-concurrency-deadlock') return <DeadlockSection />
  if (sectionId === 'internals-transaction')               return <TransactionSection />
  if (sectionId === 'internals-transaction-overview')      return <TransactionOverviewSection />
  if (sectionId === 'internals-transaction-acid')          return <TransactionAcidSection />
  if (sectionId === 'internals-transaction-commit-rollback') return <TransactionCommitRollbackSection />
  if (sectionId === 'internals-transaction-savepoint')     return <TransactionSavepointSection />
  return null
}
