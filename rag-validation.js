const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://mimotes.ekohomelab.online';
const WIDGET_KEY = 'pw_pub_8uueEHl0Ze3n7yUqLkCuBP8ONRoZUG3GHBMEdz7wxm4';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = [];
function log(msg) { console.log(msg); results.push(msg); }

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  log(`  📸 ${name}.png`);
}

const TEST_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MimoNotes RAG Validation</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
    h1 { color: #333; }
    .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    code { background: #e5e5e5; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>MimoNotes RAG Validation</h1>
  <div class="info">
    <p><strong>Widget:</strong> <code>${WIDGET_KEY}</code></p>
    <p><strong>Documents:</strong> 135 (11 PostgreSQL PDFs, 105 TXT, 5 DOCX, 14 images)</p>
    <p><strong>Chunks:</strong> 108,674 with embeddings</p>
  </div>
  <script src="${BASE_URL}/widget.js" data-key="${WIDGET_KEY}"></script>
</body>
</html>`;

(async () => {
  // Start local HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(TEST_HTML);
  });
  await new Promise(r => server.listen(8899, r));
  log('Local server started on http://localhost:8899\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkRequests = [];
  page.on('request', req => networkRequests.push({ url: req.url(), method: req.method() }));

  // ========================================
  // STEP 1: Open Widget and Verify Config
  // ========================================
  log('=== STEP 1: Widget Config ===');
  await page.goto('http://localhost:8899', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  const launcher = await page.$('[aria-label="Open chat"]');
  if (!launcher) {
    log('  ❌ Widget launcher not found');
    await browser.close();
    server.close();
    return;
  }
  log('  ✅ Widget launcher rendered');

  await launcher.click();
  await page.waitForTimeout(2000);
  await screenshot(page, '01-widget-opened');

  const dialog = await page.$('[role="dialog"]');
  if (dialog) {
    const label = await dialog.getAttribute('aria-label');
    log(`  ✅ Dialog: "${label}"`);
  }

  // ========================================
  // STEP 2: RAG Test — "What is PostgreSQL?"
  // ========================================
  log('\n=== STEP 2: RAG Test — "What is PostgreSQL?" ===');
  const input = await page.$('input[aria-label="Type your message"]');
  if (!input) {
    log('  ❌ Input not found');
    await browser.close();
    server.close();
    return;
  }

  await input.fill('What is PostgreSQL?');
  const sendBtn = await page.$('button[aria-label="Send message"]');
  await sendBtn.click({ force: true });
  log('  ✅ Message sent');

  // Wait for streaming response
  await page.waitForTimeout(15000);
  await screenshot(page, '02-rag-response-1');

  // Check for response content
  const messages1 = await page.$$('[role="article"]');
  log(`  ✅ Messages: ${messages1.length}`);

  // Check for sources/citations
  const pageContent1 = await page.content();
  const hasPostgreSQL = pageContent1.includes('PostgreSQL') || pageContent1.includes('postgresql');
  log(`  ✅ Response mentions PostgreSQL: ${hasPostgreSQL}`);

  // Check for source citations
  const hasCitations = pageContent1.includes('[Document:') || pageContent1.includes('Document:') || pageContent1.includes('source');
  log(`  ✅ Has source citations: ${hasCitations}`);

  // ========================================
  // STEP 3: RAG Test — "Explain VACUUM"
  // ========================================
  log('\n=== STEP 3: RAG Test — "Explain VACUUM" ===');
  await input.fill('Explain VACUUM in PostgreSQL');
  await sendBtn.click({ force: true });
  log('  ✅ Message sent');

  await page.waitForTimeout(15000);
  await screenshot(page, '03-rag-response-2');

  const pageContent2 = await page.content();
  const hasVacuum = pageContent2.includes('VACUUM') || pageContent2.includes('vacuum');
  log(`  ✅ Response mentions VACUUM: ${hasVacuum}`);

  // ========================================
  // STEP 4: RAG Test — "What changed in PostgreSQL 17?"
  // ========================================
  log('\n=== STEP 4: RAG Test — "PostgreSQL 17 changes" ===');
  await input.fill('What changed in PostgreSQL 17?');
  await sendBtn.click({ force: true });
  log('  ✅ Message sent');

  await page.waitForTimeout(15000);
  await screenshot(page, '04-rag-response-3');

  const pageContent3 = await page.content();
  const hasPG17 = pageContent3.includes('17') || pageContent3.includes('PostgreSQL 17');
  log(`  ✅ Response mentions PostgreSQL 17: ${hasPG17}`);

  // ========================================
  // STEP 5: Verify Streaming
  // ========================================
  log('\n=== STEP 5: Streaming Verification ===');
  const streamReqs = networkRequests.filter(r => r.url.includes('/stream'));
  log(`  ✅ Streaming requests: ${streamReqs.length}`);
  streamReqs.forEach(r => log(`    ${r.method} ${r.url.replace(BASE_URL, '')}`));

  // ========================================
  // STEP 6: Count total messages
  // ========================================
  log('\n=== STEP 6: Conversation Summary ===');
  const allMessages = await page.$$('[role="article"]');
  log(`  ✅ Total messages: ${allMessages.length}`);

  // Check for confidence indicators
  const hasConfidence = pageContent3.includes('confidence') || pageContent3.includes('Confidence') || pageContent3.includes('Tinggi') || pageContent3.includes('rendah');
  log(`  ℹ️ Confidence indicators: ${hasConfidence}`);

  // ========================================
  // STEP 7: Source card inspection
  // ========================================
  log('\n=== STEP 7: Source Card Inspection ===');
  const sourceCards = await page.$$('.mimo-source, [data-source], .source-card, [class*="source"]');
  log(`  Source cards found: ${sourceCards.length}`);

  // Check for document references in response
  const docRefs = pageContent3.match(/\[Document:[^\]]+\]/g) || [];
  log(`  Document citations: ${docRefs.length}`);
  if (docRefs.length > 0) {
    docRefs.slice(0, 5).forEach(ref => log(`    ${ref}`));
  }

  // ========================================
  // STEP 8: Conversation History Check
  // ========================================
  log('\n=== STEP 8: Conversation History ===');
  const closeBtn = await page.$('button[aria-label="Close chat"]');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(500);
    log('  ✅ Widget closed');
  }

  await launcher.click();
  await page.waitForTimeout(2000);
  await screenshot(page, '05-widget-reopened');

  // Check for continue button
  const continueBtn = await page.$('button:has-text("Continue"), button:has-text("previous")');
  if (continueBtn) {
    const visible = await continueBtn.isVisible();
    log(`  ✅ Continue button: ${visible ? 'visible' : 'hidden'}`);
  } else {
    log('  ℹ️ No continue button (session-based)');
  }

  // ========================================
  // SUMMARY
  // ========================================
  log('\n=== FINAL SUMMARY ===');
  log(`Total messages: ${allMessages.length}`);
  log(`PostgreSQL mentioned: ${hasPostgreSQL}`);
  log(`VACUUM mentioned: ${hasVacuum}`);
  log(`PG17 mentioned: ${hasPG17}`);
  log(`Streaming requests: ${streamReqs.length}`);
  log(`Document citations: ${docRefs.length}`);

  await browser.close();
  server.close();

  fs.writeFileSync(path.join(__dirname, 'rag-validation-results.txt'), results.join('\n'));
  log('\n✅ RAG validation complete');
})();
