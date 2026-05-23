import { chromium } from 'playwright';

const CHROME = 'C:/Users/woong/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // Load app
  await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });

  // Click through to Book view - find "시작하기" or similar CTA
  const startBtn = page.locator('button, a').filter({ hasText: /시작|Start|Book|Learn/i }).first();
  if (await startBtn.count()) {
    await startBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: 'verify_01_landing.png', fullPage: false });

  // Navigate to internals-storage section via TOC
  // Look for "데이터 저장 구조" or "Storage" in the sidebar
  const storageLink = page.locator('text=/데이터 저장 구조|Data Storage/i').first();
  if (await storageLink.count()) {
    await storageLink.click();
    await page.waitForTimeout(800);
  } else {
    // Try clicking on "오라클 내부" chapter first to expand it
    const internalsLink = page.locator('text=/오라클 내부|Internals/i').first();
    if (await internalsLink.count()) {
      await internalsLink.click();
      await page.waitForTimeout(500);
    }
    // Now try storage
    const storageLink2 = page.locator('text=/데이터 저장 구조|Data Storage/i').first();
    if (await storageLink2.count()) {
      await storageLink2.click();
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: 'verify_02_storage_top.png', fullPage: false });

  // Open the Block accordion (click it)
  const blockAccordion = page.locator('button').filter({ hasText: /Block.*I\/O|I\/O.*Block/i }).first();
  if (await blockAccordion.count()) {
    await blockAccordion.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: 'verify_03_block_open.png', fullPage: false });

  // Scroll down to see BlockDiagram
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify_04_block_diagram.png', fullPage: false });

  // Scroll more to find ROWID section
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify_05_rowid.png', fullPage: false });

  // Click Extent accordion
  const extentAccordion = page.locator('button').filter({ hasText: /Extent/i }).first();
  if (await extentAccordion.count()) {
    await extentAccordion.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: 'verify_06_extent.png', fullPage: false });

  // Click Segment accordion
  const segmentAccordion = page.locator('button').filter({ hasText: /Segment/i }).first();
  if (await segmentAccordion.count()) {
    await segmentAccordion.click();
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify_07_segment_hwm.png', fullPage: false });

  // Click Tablespace accordion
  const tsAccordion = page.locator('button').filter({ hasText: /Tablespace/i }).first();
  if (await tsAccordion.count()) {
    await tsAccordion.click();
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify_08_tablespace_lmt.png', fullPage: false });

  // Check for any console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.waitForTimeout(500);

  console.log('Console errors:', errors.length ? errors : 'none');
  console.log('Screenshots saved.');

  await browser.close();
})();
