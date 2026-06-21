/**
 * export-partition-pdf.mjs
 *
 * 파티셔닝 챕터의 모든 섹션을 PDF로 내보냅니다.
 * 실행 전 별도 터미널에서 `npm run dev` 로 개발 서버가 켜져 있어야 합니다.
 *
 * 사용법:
 *   node scripts/export-partition-pdf.mjs
 */

import puppeteer from 'puppeteer'
import path from 'path'
import os from 'os'
import fs from 'fs'

const BASE_URL = 'http://localhost:5173'
const DESKTOP  = path.join(os.homedir(), 'OneDrive', 'Desktop')

// 파티셔닝 챕터 섹션 목록 (TOC 순서와 동일)
const SECTIONS = [
  { id: 'partition-overview',   title: '파티셔닝 개요' },
  { id: 'partition-strategies', title: '파티셔닝 전략' },
  { id: 'partition-range',      title: 'Range / Interval 파티션' },
  { id: 'partition-list',       title: 'List 파티션' },
  { id: 'partition-hash',       title: 'Hash 파티션' },
  { id: 'partition-composite',  title: 'Composite 파티션' },
  { id: 'partition-reference',  title: 'Reference 파티션' },
  { id: 'partition-indexes',    title: '파티셔닝된 인덱스' },
  { id: 'partition-pruning',    title: 'Partition Pruning' },
  { id: 'partition-wise-join',  title: 'Partition-Wise Join' },
]

// 인쇄 시 불필요한 UI 요소를 숨기는 CSS
const PRINT_CSS = `
  /* 스크롤바 제거 */
  ::-webkit-scrollbar { display: none; }

  /* 페이지 안에서 잘리면 안 되는 요소 */
  pre, table, .rounded-xl, .rounded-lg { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }

  /* 색상 강제 출력 (배경색, 테두리 포함) */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 불필요한 여백 제거 */
  body { margin: 0; padding: 0; }
`

async function waitForContent(page) {
  // PageContainer 또는 h1이 렌더될 때까지 대기
  await page.waitForSelector('h1, [class*="PageContainer"], main > div', { timeout: 10000 })
  // 폰트·이미지 로딩 완료 대기
  await new Promise(r => setTimeout(r, 800))
}

async function main() {
  // 개발 서버 응답 확인
  try {
    const { default: http } = await import('http')
    await new Promise((resolve, reject) => {
      const req = http.get(BASE_URL, res => {
        res.destroy()
        resolve(undefined)
      })
      req.on('error', reject)
      req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')) })
    })
  } catch {
    console.error(`❌  개발 서버(${BASE_URL})에 연결할 수 없습니다.`)
    console.error('   먼저 별도 터미널에서 npm run dev 를 실행해 주세요.')
    process.exit(1)
  }

  console.log('🚀  Puppeteer 시작...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  })

  const tmpDir = path.join(os.tmpdir(), 'partition-pdf-tmp')
  fs.mkdirSync(tmpDir, { recursive: true })

  const pdfPaths = []

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]
    const pageNum  = String(i + 1).padStart(2, '0')
    console.log(`  [${pageNum}/${SECTIONS.length}] ${section.title}`)

    const page = await browser.newPage()

    // A4 기준 적절한 뷰포트 (실제 PDF 출력 너비와 맞춤)
    await page.setViewport({ width: 900, height: 1200 })

    // print 모드 URL: ?print=<sectionId>
    const url = `${BASE_URL}?print=${section.id}`
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 })

    try {
      await waitForContent(page)
    } catch {
      console.warn(`    ⚠️  콘텐츠 로딩 대기 실패, 그냥 진행합니다.`)
    }

    // 인쇄용 CSS 주입
    await page.addStyleTag({ content: PRINT_CSS })

    // 섹션 번호와 제목을 담은 임시 PDF 저장
    const tmpPath = path.join(tmpDir, `${pageNum}_${section.id}.pdf`)
    await page.pdf({
      path: tmpPath,
      format: 'A4',
      margin: { top: '18mm', bottom: '16mm', left: '20mm', right: '20mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="
          width: 100%; font-family: monospace; font-size: 8px;
          color: #999; padding: 4px 20mm 0;
          display: flex; justify-content: space-between;
        ">
          <span>Oracle DB — 파티셔닝</span>
          <span>${section.title}</span>
        </div>`,
      footerTemplate: `
        <div style="
          width: 100%; font-family: monospace; font-size: 8px;
          color: #999; padding: 0 20mm 4px;
          display: flex; justify-content: flex-end;
        ">
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
    })

    pdfPaths.push(tmpPath)
    console.log(`         ✅  저장됨 (${path.basename(tmpPath)})`)
    await page.close()
  }

  await browser.close()

  // 개별 PDF를 하나로 합치기
  // Node.js에 내장된 방식으로는 PDF 병합이 불가하므로, 각 파일을 바탕화면에 개별 저장
  const finalDir = path.join(DESKTOP, 'partition-pdf')
  fs.mkdirSync(finalDir, { recursive: true })

  for (const src of pdfPaths) {
    const dest = path.join(finalDir, path.basename(src))
    fs.copyFileSync(src, dest)
  }

  // tmp 정리
  fs.rmSync(tmpDir, { recursive: true, force: true })

  console.log('\n✅  완료!')
  console.log(`\n📁  저장 위치: ${finalDir}`)
  console.log('\n파일 목록:')
  SECTIONS.forEach((s, i) => {
    const num = String(i + 1).padStart(2, '0')
    console.log(`   ${num}. ${num}_${s.id}.pdf  (${s.title})`)
  })
  console.log('\n💡  PDF 병합 방법:')
  console.log('   • Adobe Acrobat: 파일 > PDF 결합')
  console.log('   • 무료 온라인: https://smallpdf.com/merge-pdf 또는 https://ilovepdf.com/merge_pdf')
  console.log('   • PowerShell (PDFtk 설치 시): pdftk *.pdf cat output merged.pdf')
}

main().catch(err => {
  console.error('\n❌  오류:', err.message)
  process.exit(1)
})
