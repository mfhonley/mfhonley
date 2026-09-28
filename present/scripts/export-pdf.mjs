import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { deck } from '../src/deck.mjs';

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  // Reuse the browser tooling already installed beside the reference presentation.
  // In an independent checkout: npm install --no-save playwright.
  const tooling = process.env.PLAYWRIGHT_PACKAGE || fileURLToPath(new URL('../../../mindzan/app/package.json', import.meta.url));
  ({ chromium } = createRequire(tooling)('playwright'));
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(process.env.PRESENT_URL || 'http://127.0.0.1:3008/?slide=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(`[data-slide="${deck.length}"]`, { state: 'attached' });
  await page.evaluate(() => Promise.all(Array.from(document.images, img => img.decode())));
  const path = fileURLToPath(new URL('../zhan-beissikeyev.pdf', import.meta.url));
  // All slides are visible in print, including those inactive during the talk.
  await page.evaluate(() => document.querySelectorAll('.slide-shell').forEach(el => { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }));
  await page.pdf({ path, preferCSSPageSize: true, printBackground: true, tagged: true });
  console.log(path);
} finally { await browser.close(); }
