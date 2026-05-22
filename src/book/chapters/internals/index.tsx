import { OverviewSection, UpdateFlowPage } from './overview/OverviewSection'
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
  if (sectionId === 'internals-update-flow')          return <UpdateFlowPage />
  return null
}
