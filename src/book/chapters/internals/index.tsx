import { OverviewSection, BufferCachePage, UpdateFlowPage } from './overview/OverviewSection'
import { StorageSection } from './storage/StorageSection'
import { SgaSection } from './overview/sga/SgaSection'
import { SgaBufferCacheSection } from './overview/sga/buffer-cache/BufferCacheSection'
import { RedoLogBufferSection } from './overview/sga/redo-log-buffer/RedoLogBufferSection'
import { SharedPoolSection } from './overview/sga/shared-pool/SharedPoolSection'

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-overview')             return <OverviewSection />
  if (sectionId === 'internals-sga')                  return <SgaSection />
  if (sectionId === 'internals-sga-buffer-cache')     return <SgaBufferCacheSection />
  if (sectionId === 'internals-sga-redo-log-buffer')  return <RedoLogBufferSection />
  if (sectionId === 'internals-sga-shared-pool')      return <SharedPoolSection />
  if (sectionId === 'internals-storage')              return <StorageSection />
  if (sectionId === 'internals-buffer-cache-page')    return <BufferCachePage />
  if (sectionId === 'internals-update-flow')          return <UpdateFlowPage />
  return null
}
