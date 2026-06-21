import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import os from 'os'

const SRC_DIR = path.join(os.homedir(), 'OneDrive', 'Desktop', 'partition-pdf')
const OUT     = path.join(os.homedir(), 'OneDrive', 'Desktop', '파티셔닝_Oracle.pdf')

const files = fs.readdirSync(SRC_DIR)
  .filter(f => f.endsWith('.pdf'))
  .sort()

console.log(`📎  ${files.length}개 파일 병합 중...`)

const merged = await PDFDocument.create()

for (const file of files) {
  const bytes = fs.readFileSync(path.join(SRC_DIR, file))
  const doc   = await PDFDocument.load(bytes)
  const pages = await merged.copyPages(doc, doc.getPageIndices())
  pages.forEach(p => merged.addPage(p))
  console.log(`   ✅  ${file}`)
}

fs.writeFileSync(OUT, await merged.save())
console.log(`\n✅  완료: ${OUT}`)
