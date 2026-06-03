
import { IndexTypesOverview } from './composite/IndexTypesOverview'
import { BTreeSection } from './btree/BTreeSection'
import { RowidSection } from './table-access/RowidSection'
import { TableAccessSection } from './table-access/TableAccessSection'
import { RangeScanSection } from './scan/RangeScanSection'
import { UniqueScanSection } from './scan/UniqueScanSection'
import { FullScanSection } from './scan/FullScanSection'
import { FastFullScanSection } from './scan/FastFullScanSection'
import { SkipScanSection } from './scan/SkipScanSection'
import { IndexUnusableSection } from './unusable/IndexUnusableSection'
import { BitmapSection } from './bitmap/BitmapSection'
import { CompositeSection } from './composite/CompositeSection'
import { IndexUsageSection } from './usage/IndexUsageSection'

// ── Layout wrapper: main content (left, scrollable) + glossary panel (right) ──

function IndexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto">
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function IndexChapterPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'index-overview') {
    return (
      <IndexLayout>
        <IndexTypesOverview />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-btree') {
    return (
      <IndexLayout>
        <BTreeSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-scan')           return <IndexLayout><RangeScanSection /></IndexLayout>
  if (sectionId === 'index-scan-range')     return <IndexLayout><RangeScanSection /></IndexLayout>
  if (sectionId === 'index-scan-unique')    return <IndexLayout><UniqueScanSection /></IndexLayout>
  if (sectionId === 'index-scan-full')      return <IndexLayout><FullScanSection /></IndexLayout>
  if (sectionId === 'index-scan-fast-full') return <IndexLayout><FastFullScanSection /></IndexLayout>
  if (sectionId === 'index-scan-skip')      return <IndexLayout><SkipScanSection /></IndexLayout>

  if (sectionId === 'index-unusable')         return <IndexLayout><IndexUnusableSection /></IndexLayout>

  if (sectionId === 'index-table-access')        return <IndexLayout><RowidSection /></IndexLayout>
  if (sectionId === 'index-table-access-rowid')  return <IndexLayout><RowidSection /></IndexLayout>
  if (sectionId === 'index-table-access-buffer') return <IndexLayout><TableAccessSection /></IndexLayout>

  if (sectionId === 'index-bitmap') {
    return (
      <IndexLayout>
        <BitmapSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-composite') {
    return (
      <IndexLayout>
        <CompositeSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-usage') {
    return (
      <IndexLayout>
        <IndexUsageSection />
      </IndexLayout>
    )
  }

  return null
}
