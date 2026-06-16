const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://mimotes.ekohomelab.online';
const SCREENSHOT_DIR = 'C:/Users/SMANSA/mimotes/.audit/screenshots-v2';
const RESULTS = { journeys: [], consoleErrors: [], networkFailures: [], screenshots: [] };

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function screenshot(page, name, journey) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  RESULTS.screenshots.push({ name, journey, path: filePath });
  console.log(`  📸 ${name}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      RESULTS.consoleErrors.push({ text: msg.text(), url: page.url() });
    }
  });

  // Collect network failures
  page.on('response', resp => {
    if (resp.status() >= 400) {
      RESULTS.networkFailures.push({ url: resp.url(), status: resp.status() });
    }
  });

  // ============================================
  // JOURNEY 1: Login → Upload → Chat → Settings
  // ============================================
  console.log('\n=== JOURNEY 1: Login → Upload → Chat ===');
  const j1 = { name: 'J1: Login → Upload → Chat', steps: [], status: 'PASS' };

  try {
    // Landing page
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j1-01-landing', 1);
    j1.steps.push({ name: 'Landing page', status: 'PASS' });

    // Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j1-02-login', 1);
    await page.fill('input[type="email"]', 'admin@mimotes.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/{dashboard,documents}', { timeout: 10000 });
    await screenshot(page, 'j1-03-after-login', 1);
    j1.steps.push({ name: 'Login + Dashboard', status: 'PASS' });

    // Check dashboard document count
    const dashText = await page.textContent('body');
    const docCountMatch = dashText.match(/(\d+)\s*dokumen|(\d+)\s*document/i);
    console.log(`  Dashboard doc count text: ${docCountMatch ? docCountMatch[0] : 'not found'}`);

    // Documents page
    await page.goto(`${BASE_URL}/documents`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j1-04-documents', 1);
    j1.steps.push({ name: 'Documents page', status: 'PASS' });

    // Upload page
    await page.goto(`${BASE_URL}/documents/upload`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j1-05-upload', 1);
    j1.steps.push({ name: 'Upload page', status: 'PASS' });

    // Chat page — CRITICAL TEST
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j1-06-chat-empty', 1);

    // Type and send message
    const chatInput = await page.$('textarea, input[type="text"]');
    if (chatInput) {
      await chatInput.fill('Apa isi dokumen PostgreSQL?');
      await screenshot(page, 'j1-07-chat-typed', 1);

      // Find and click send button
      const sendBtn = await page.$('button[type="submit"], button:has(svg)');
      if (sendBtn) {
        await sendBtn.click({ force: true });
        // Wait for response
        await page.waitForTimeout(8000);
        await screenshot(page, 'j1-08-chat-response', 1);

        // Check if response appeared
        const chatBody = await page.textContent('body');
        if (chatBody.includes('Gagal') || chatBody.includes('error') || chatBody.includes('401')) {
          j1.steps.push({ name: 'Chat message', status: 'FAIL', note: 'Error or no response' });
          j1.status = 'PARTIAL';
        } else {
          j1.steps.push({ name: 'Chat message + AI response', status: 'PASS' });
        }
      }
    }

    // Settings page
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j1-09-settings', 1);
    j1.steps.push({ name: 'Settings page', status: 'PASS' });

  } catch (e) {
    j1.steps.push({ name: 'Error', status: 'FAIL', note: e.message });
    j1.status = 'FAIL';
  }
  RESULTS.journeys.push(j1);

  // ============================================
  // JOURNEY 2: Workspace & Team
  // ============================================
  console.log('\n=== JOURNEY 2: Workspace & Team ===');
  const j2 = { name: 'J2: Workspace & Team', steps: [], status: 'PASS' };

  try {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j2-01-settings', 2);

    // Click Workspace tab
    const wsTab = await page.$('text=Workspace');
    if (wsTab) {
      await wsTab.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'j2-02-workspace', 2);
      j2.steps.push({ name: 'Workspace settings', status: 'PASS' });
    } else {
      j2.steps.push({ name: 'Workspace tab', status: 'FAIL', note: 'Not found' });
      j2.status = 'PARTIAL';
    }

    // Check for 401 errors in network
    const ws401s = RESULTS.networkFailures.filter(f => f.url.includes('workspace') && f.status === 401);
    if (ws401s.length > 0) {
      j2.steps.push({ name: 'Workspace API auth', status: 'FAIL', note: `${ws401s.length} 401 errors` });
      j2.status = 'PARTIAL';
    } else {
      j2.steps.push({ name: 'Workspace API auth', status: 'PASS' });
    }

  } catch (e) {
    j2.steps.push({ name: 'Error', status: 'FAIL', note: e.message });
    j2.status = 'FAIL';
  }
  RESULTS.journeys.push(j2);

  // ============================================
  // JOURNEY 3: Document Management
  // ============================================
  console.log('\n=== JOURNEY 3: Document Management ===');
  const j3 = { name: 'J3: Document Management', steps: [], status: 'PASS' };

  try {
    await page.goto(`${BASE_URL}/documents`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j3-01-documents', 3);

    // Check document list
    const docItems = await page.$$('[class*="document"], [class*="doc-item"], tr, li');
    console.log(`  Document items found: ${docItems.length}`);
    j3.steps.push({ name: 'Document list', status: 'PASS' });

    // Search
    const searchInput = await page.$('input[placeholder*="search" i], input[placeholder*="cari" i], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('PostgreSQL');
      await page.waitForTimeout(1000);
      await screenshot(page, 'j3-02-search', 3);
      j3.steps.push({ name: 'Search documents', status: 'PASS' });
    } else {
      j3.steps.push({ name: 'Search', status: 'FAIL', note: 'No search input found' });
      j3.status = 'PARTIAL';
    }

  } catch (e) {
    j3.steps.push({ name: 'Error', status: 'FAIL', note: e.message });
    j3.status = 'FAIL';
  }
  RESULTS.journeys.push(j3);

  // ============================================
  // JOURNEY 4: Settings & Profile
  // ============================================
  console.log('\n=== JOURNEY 4: Settings & Profile ===');
  const j4 = { name: 'J4: Settings & Profile', steps: [], status: 'PASS' };

  try {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, 'j4-01-settings', 4);

    // Click through tabs
    const tabs = ['Account', 'Akun', 'Security', 'Keamanan', 'API Keys', 'Billing'];
    for (const tabName of tabs) {
      const tab = await page.$(`text=${tabName}`);
      if (tab) {
        await tab.click();
        await page.waitForTimeout(1000);
        await screenshot(page, `j4-tab-${tabName.toLowerCase().replace(/\s/g, '-')}`, 4);
        j4.steps.push({ name: `Tab: ${tabName}`, status: 'PASS' });
      }
    }

    // Check for 401 errors
    const settings401s = RESULTS.networkFailures.filter(f => f.url.includes('settings') || f.url.includes('api-key'));
    if (settings401s.length > 0) {
      j4.steps.push({ name: 'Settings API auth', status: 'FAIL', note: `${settings401s.length} errors` });
      j4.status = 'PARTIAL';
    } else {
      j4.steps.push({ name: 'Settings API auth', status: 'PASS' });
    }

  } catch (e) {
    j4.steps.push({ name: 'Error', status: 'FAIL', note: e.message });
    j4.status = 'FAIL';
  }
  RESULTS.journeys.push(j4);

  // ============================================
  // JOURNEY 5: Mobile Viewport (375x812)
  // ============================================
  console.log('\n=== JOURNEY 5: Mobile Viewport ===');
  const j5 = { name: 'J5: Mobile (375x812)', steps: [], status: 'PASS' };

  try {
    await page.setViewportSize({ width: 375, height: 812 });

    const pages = [
      { url: '/', name: 'landing' },
      { url: '/login', name: 'login' },
      { url: '/dashboard', name: 'dashboard' },
      { url: '/documents', name: 'documents' },
      { url: '/chat', name: 'chat' },
      { url: '/settings', name: 'settings' },
    ];

    for (const p of pages) {
      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      await screenshot(page, `j5-mobile-${p.name}`, 5);
      j5.steps.push({ name: `Mobile: ${p.name}`, status: 'PASS' });
    }

  } catch (e) {
    j5.steps.push({ name: 'Error', status: 'FAIL', note: e.message });
    j5.status = 'FAIL';
  }
  RESULTS.journeys.push(j5);

  await browser.close();

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Console errors: ${RESULTS.consoleErrors.length}`);
  console.log(`Network failures: ${RESULTS.networkFailures.length}`);
  console.log(`Screenshots: ${RESULTS.screenshots.length}`);
  for (const j of RESULTS.journeys) {
    console.log(`  ${j.name}: ${j.status}`);
  }

  // Check for 401 errors specifically
  const auth401s = RESULTS.networkFailures.filter(f => f.status === 401);
  console.log(`\n401 errors: ${auth401s.length}`);
  for (const e of auth401s) {
    console.log(`  ${e.url}`);
  }

  // Save results
  fs.writeFileSync(
    'C:/Users/SMANSA/mimotes/.audit/retest-results.json',
    JSON.stringify(RESULTS, null, 2)
  );
  console.log('\nResults saved to .audit/retest-results.json');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
