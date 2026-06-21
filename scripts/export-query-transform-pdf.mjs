/**
 * export-query-transform-pdf.mjs
 *
 * 쿼리 변환 챕터의 모든 섹션을 하나의 PDF로 내보냅니다.
 * 실행 전 별도 터미널에서 `npm run dev` 로 개발 서버가 켜져 있어야 합니다.
 *
 * 사용법:
 *   node scripts/export-query-transform-pdf.mjs
 */

import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'
import path from 'path'
import os from 'os'
import fs from 'fs'

const BASE_URL = 'http://localhost:5173'
const DESKTOP  = path.join(os.homedir(), 'OneDrive', 'Desktop')
const OUT_PATH = path.join(DESKTOP, '쿼리변환_Oracle.pdf')

const SECTIONS = [
  { id: 'qt-overview',          title: '쿼리 변환 개요' },
  { id: 'qt-or-expansion',      title: 'OR Expansion' },
  { id: 'qt-view-merging',      title: 'View Merging' },
  { id: 'qt-predicate-pushing', title: 'Predicate Pushing' },
  { id: 'qt-subquery-unnesting',title: 'Subquery Unnesting' },
  { id: 'qt-materialized-view', title: 'Query Rewrite with MVs' },
  { id: 'qt-star-transformation', title: 'Star Transformation' },
  { id: 'qt-join-factorization', title: 'Join Factorization' },
]

// 전자책 화면 최적화 CSS
// - 내용 잘림 방지: page-break-inside: avoid
// - 색상 강제 출력
// - 불필요한 스크롤바/여백 제거
const PRINT_CSS = `
  ::-webkit-scrollbar { display: none; }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 잘리면 안 되는 블록 단위 */
  pre, table, code,
  [class*="rounded-xl"], [class*="rounded-lg"],
  .info-box, [class*="InfoBox"] {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* 제목 뒤에서 잘리지 않도록 */
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* SQL 블록 잘림 방지 */
  pre code, pre span {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  body { margin: 0; padding: 0; }

  /* 섹션 사이에 페이지 나누기 — 이 스크립트에서는 섹션별 별도 PDF를 병합하므로 불필요 */
`

async function waitForContent(page) {
  await page.waitForSelector('h1, [class*="PageContainer"], main > div', { timeout: 15000 })
  // 폰트·이미지·애니메이션 완료 대기
  await new Promise(r => setTimeout(r, 1500))
}

async function expandViewportToFullHeight(page) {
  // 1단계: #root 등 height/overflow 제약을 해제해서 실제 콘텐츠 높이 노출
  const fullHeight = await page.evaluate(() => {
    // #root 의 height·overflow 제약 해제 (BookLayout 등이 100vh로 고정하는 경우 대비)
    const root = document.getElementById('root')
    if (root) {
      root.style.height = 'auto'
      root.style.minHeight = 'auto'
      root.style.overflow = 'visible'
    }
    document.body.style.overflow = 'visible'
    document.body.style.height = 'auto'
    document.documentElement.style.overflow = 'visible'
    document.documentElement.style.height = 'auto'

    // overflow:hidden 인 모든 중간 wrapper도 해제
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el)
      if (s.overflow === 'hidden' || s.overflowY === 'hidden') {
        el.style.overflow = 'visible'
      }
    })

    // 강제 레이아웃 재계산
    void document.body.offsetHeight

    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      root ? root.scrollHeight : 0,
    )
  })

  // 2단계: 측정값 + 여유 500px 로 뷰포트 재설정
  const targetHeight = fullHeight + 500
  await page.setViewport({ width: 860, height: targetHeight })

  // 3단계: 레이아웃 안정화 대기
  await new Promise(r => setTimeout(r, 500))

  return fullHeight
}

async function main() {
  // 개발 서버 응답 확인
  try {
    const { default: http } = await import('http')
    await new Promise((resolve, reject) => {
      const req = http.get(BASE_URL, res => { res.destroy(); resolve(undefined) })
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

  const tmpDir = path.join(os.tmpdir(), 'qt-pdf-tmp')
  fs.mkdirSync(tmpDir, { recursive: true })

  const pdfPaths = []

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]
    const pageNum = String(i + 1).padStart(2, '0')
    console.log(`  [${pageNum}/${SECTIONS.length}] ${section.title}`)

    const page = await browser.newPage()

    // 초기 뷰포트: 가로만 정하고 세로는 이후 콘텐츠 높이 측정 후 확장
    await page.setViewport({ width: 860, height: 1100 })

    const url = `${BASE_URL}?print=${section.id}`
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 })

    try {
      await waitForContent(page)
    } catch {
      console.warn(`    ⚠️  콘텐츠 로딩 대기 실패, 그냥 진행합니다.`)
    }

    // 인쇄용 CSS 주입
    await page.addStyleTag({ content: PRINT_CSS })

    // print 미디어로 전환 — page.pdf()가 사용하는 렌더링 모드와 동일하게 맞춤
    await page.emulateMediaType('print')
    await new Promise(r => setTimeout(r, 400))

    // ★ 핵심: 뷰포트를 콘텐츠 전체 높이로 확장 → 잘림 방지
    const fullHeight = await expandViewportToFullHeight(page)
    console.log(`         📐  콘텐츠 높이: ${fullHeight}px`)

    const tmpPath = path.join(tmpDir, `${pageNum}_${section.id}.pdf`)

    await page.pdf({
      path: tmpPath,
      format: 'A4',
      // 전자책 여백: 상하 약간 여유, 좌우는 읽기 편하게
      margin: { top: '16mm', bottom: '18mm', left: '18mm', right: '18mm' },
      printBackground: true,
      displayHeaderFooter: true,
      preferCSSPageSize: false,
      headerTemplate: `
        <div style="
          width: 100%; font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
          font-size: 8px; color: #888; padding: 3px 18mm 0;
          display: flex; justify-content: space-between; align-items: center;
        ">
          <span>Oracle DB — 쿼리 변환 (Query Transformation)</span>
          <span>${section.title}</span>
        </div>`,
      footerTemplate: `
        <div style="
          width: 100%; font-family: monospace; font-size: 8px;
          color: #aaa; padding: 0 18mm 3px;
          display: flex; justify-content: flex-end;
        ">
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
    })

    pdfPaths.push(tmpPath)
    const stat = fs.statSync(tmpPath)
    console.log(`         ✅  저장됨 (${path.basename(tmpPath)}, ${Math.round(stat.size / 1024)} KB)`)
    await page.close()
  }

  await browser.close()
  console.log('\n📎  PDF 병합 중...')

  // pdf-lib으로 하나의 PDF로 병합
  const merged = await PDFDocument.create()

  for (const src of pdfPaths) {
    const bytes = fs.readFileSync(src)
    const doc   = await PDFDocument.load(bytes)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach(p => merged.addPage(p))
    console.log(`   ✅  ${path.basename(src)}`)
  }

  const mergedBytes = await merged.save()
  fs.writeFileSync(OUT_PATH, mergedBytes)

  // 임시 디렉토리 정리
  fs.rmSync(tmpDir, { recursive: true, force: true })

  const finalStat = fs.statSync(OUT_PATH)
  console.log(`\n✅  완료!`)
  console.log(`📁  저장 위치: ${OUT_PATH}`)
  console.log(`📄  총 크기: ${Math.round(finalStat.size / 1024)} KB`)
  console.log(`\n섹션 목록:`)
  SECTIONS.forEach((s, i) => {
    console.log(`   ${String(i + 1).padStart(2, '0')}. ${s.title}`)
  })
}

main().catch(err => {
  console.error('\n❌  오류:', err.message)
  process.exit(1)
})
