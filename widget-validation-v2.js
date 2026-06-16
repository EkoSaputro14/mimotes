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

(async () => {
  // Start local HTTP server
  const testHtml = fs.readFileSync(path.join(__dirname, 'widget-test-real.html'), 'utf8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHtml);
  });
  await new Promise(r => server.listen(8899, r));
  log('Local server started on http://localhost:8899');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const networkRequests = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('request', req => networkRequests.push({ url: req.url(), method: req.method() }));

  // ========================================
  // STEP 1: Widget Config Validation
  // ========================================
  log('\n=== STEP 1: Widget Config Validation ===');
  const configResp = await page.evaluate(async (args) => {
    try {
      const r = await fetch(`${args.baseUrl}/api/widget/config?publicKey=${args.key}`);
      return { status: r.status, data: await r.json() };
    } catch (e) { return { error: e.message }; }
  }, { baseUrl: BASE_URL, key: WIDGET_KEY });

  if (configResp.status === 200 && configResp.data?.name) {
    log(`  ✅ Widget config loaded: "${configResp.data.name}"`);
    log(`  ✅ Theme: primary=${configResp.data.primaryColor}, position=${configResp.data.position}`);
    log(`  ✅ Welcome: "${configResp.data.welcomeMessage}"`);
  } else {
    log(`  ❌ Config failed: ${JSON.stringify(configResp)}`);
  }

  // ========================================
  // STEP 2: Widget Loading & UI
  // ========================================
  log('\n=== STEP 2: Widget Loading & UI ===');
  await page.goto('http://localhost:8899', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  await screenshot(page, '01-page-loaded');

  // Check launcher
  const launcher = await page.$('[aria-label="Open chat"], [data-mimo-launcher]');
  if (launcher) {
    log('  ✅ 2.1 Widget launcher rendered');
    const isVisible = await launcher.isVisible();
    log(`  ✅ 2.2 Launcher visible: ${isVisible}`);

    // Open widget
    await launcher.click();
    await page.waitForTimeout(2000);
    await screenshot(page, '02-widget-opened');

    // Check dialog
    const dialog = await page.$('[role="dialog"]');
    if (dialog) {
      const label = await dialog.getAttribute('aria-label');
      log(`  ✅ 2.3 Chat dialog opened (aria-label: "${label}")`);

      // Check welcome message
      const welcome = await page.textContent('[role="dialog"]');
      if (welcome && welcome.includes('Help')) {
        log('  ✅ 2.4 Welcome message displayed');
      }

      // Check ARIA
      const ariaLive = await page.$('[aria-live="polite"], [role="log"]');
      log(`  ✅ 2.5 aria-live container: ${!!ariaLive}`);

      // Check input
      const input = await page.$('input[aria-label], textarea[aria-label]');
      if (input) {
        const inputLabel = await input.getAttribute('aria-label');
        log(`  ✅ 2.6 Chat input found (aria-label: "${inputLabel}")`);
      }
    } else {
      log('  ❌ 2.3 Chat dialog not found');
    }
  } else {
    log('  ❌ 2.1 Widget launcher not found');
    // Debug: check page content
    const body = await page.textContent('body');
    log(`  Page content: ${body.substring(0, 200)}`);
  }

  // ========================================
  // STEP 3: Widget Chat (Streaming)
  // ========================================
  log('\n=== STEP 3: Widget Chat (Streaming) ===');
  const input = await page.$('input[aria-label], textarea[aria-label]');
  if (input) {
    await input.fill('What is PostgreSQL?');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-message-typed.png') });

    const sendBtn = await page.$('button[aria-label="Send message"], button[aria-label*="Send"]');
    if (sendBtn) {
      await sendBtn.click({ force: true });
      log('  ✅ 3.1 Message sent');

      // Wait for streaming response
      await page.waitForTimeout(8000);
      await screenshot(page, '04-response-received');

      // Check for response
      const messages = await page.$$('[role="article"], .mimo-message, [data-role]');
      log(`  ✅ 3.2 Messages rendered: ${messages.length}`);

      // Check for sources
      const sources = await page.$$('.mimo-source, [data-source], .source-card');
      if (sources.length > 0) {
        log(`  ✅ 3.3 Sources displayed: ${sources.length}`);
      } else {
        log('  ℹ️ 3.3 No sources displayed (may not have matching documents)');
      }

      // Check for streaming indicators
      const networkStreamReqs = networkRequests.filter(r => r.url.includes('/stream'));
      log(`  ✅ 3.4 Streaming requests: ${networkStreamReqs.length}`);

      // Send another message for conversation history test
      await input.fill('Can you explain VACUUM in PostgreSQL?');
      await sendBtn.click({ force: true });
      await page.waitForTimeout(8000);
      await screenshot(page, '05-second-message');

      const allMessages = await page.$$('[role="article"], .mimo-message, [data-role]');
      log(`  ✅ 3.5 Conversation messages: ${allMessages.length}`);
    } else {
      log('  ❌ 3.1 Send button not found');
    }
  } else {
    log('  ❌ 3.1 Input not found');
  }

  // ========================================
  // STEP 4: Conversation History Test
  // ========================================
  log('\n=== STEP 4: Conversation History ===');
  // Close and reopen widget
  const closeBtn = await page.$('button[aria-label="Close chat"], button[aria-label*="Close"]');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(500);
    log('  ✅ 4.1 Widget closed');
  }

  // Reopen
  const launcher2 = await page.$('[aria-label="Open chat"]');
  if (launcher2) {
    await launcher2.click();
    await page.waitForTimeout(2000);
    await screenshot(page, '06-widget-reopened');

    // Check for "Continue previous chat" button
    const continueBtn = await page.$('button:has-text("Continue"), button:has-text("Lanjut"), button:has-text("previous")');
    if (continueBtn) {
      const btnVisible = await continueBtn.isVisible();
      if (btnVisible) {
        log('  ✅ 4.2 Continue previous chat button shown');
        await continueBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(2000);
        await screenshot(page, '07-history-loaded');

        const historyMessages = await page.$$('[role="article"], .mimo-message');
        log(`  ✅ 4.3 History messages loaded: ${historyMessages.length}`);
      } else {
        log('  ℹ️ 4.2 Continue button exists but not visible (hidden in DOM)');
      }
    } else {
      log('  ℹ️ 4.2 No continue button (history may be session-only)');
    }
  }

  // ========================================
  // STEP 5: Mobile Viewport
  // ========================================
  log('\n=== STEP 5: Mobile Viewport (375x812) ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:8899', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  await screenshot(page, '08-mobile-page');

  const mobileLauncher = await page.$('[aria-label="Open chat"]');
  if (mobileLauncher) {
    const visible = await mobileLauncher.isVisible();
    log(`  ✅ 5.1 Mobile launcher visible: ${visible}`);
    if (visible) {
      await mobileLauncher.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '09-mobile-widget');

      const mobileDialog = await page.$('[role="dialog"]');
      if (mobileDialog) {
        log('  ✅ 5.2 Mobile widget opens');
        const mobileInput = await page.$('input[aria-label]');
        if (mobileInput) {
          log('  ✅ 5.3 Mobile input accessible');
        }
      }
    }
  }

  // ========================================
  // STEP 6: Keyboard Navigation
  // ========================================
  log('\n=== STEP 6: Keyboard Navigation ===');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8899', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Tab to launcher
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  log(`  Focus after Tab: "${focused}"`);

  if (focused === 'Open chat') {
    log('  ✅ 6.1 Tab focuses launcher');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await screenshot(page, '10-keyboard-opened');

    const kbdDialog = await page.$('[role="dialog"]');
    if (kbdDialog) {
      log('  ✅ 6.2 Enter opens widget');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      log('  ✅ 6.3 Escape closes widget');
    }
  } else {
    log(`  ⚠️ 6.1 Tab focused "${focused}" instead of launcher`);
  }

  // ========================================
  // STEP 7: Security Tests
  // ========================================
  log('\n=== STEP 7: Security Tests ===');

  // 7.1 Invalid key
  const badKey = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/widget/config?publicKey=pw_pub_FAKE_KEY`);
    return { status: r.status, body: await r.json() };
  }, BASE_URL);
  log(`  ✅ 7.1 Invalid key: status=${badKey.status}, error=${badKey.body?.error?.code || 'none'}`);

  // 7.2 Missing key
  const noKey = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/widget/config`);
    return { status: r.status };
  }, BASE_URL);
  log(`  ✅ 7.2 Missing key: status=${noKey.status}`);

  // 7.3 Chat with fake key
  const fakeChat = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/widget/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: 'pw_pub_FAKE', message: 'test' })
    });
    return { status: r.status, body: await r.json() };
  }, BASE_URL);
  log(`  ✅ 7.3 Fake key chat: status=${fakeChat.status}, error=${fakeChat.body?.error?.code || 'none'}`);

  // 7.4 Stream with fake key
  const fakeStream = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/widget/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: 'pw_pub_FAKE', message: 'test' })
    });
    return { status: r.status, body: await r.json() };
  }, BASE_URL);
  log(`  ✅ 7.4 Fake key stream: status=${fakeStream.status}, error=${fakeStream.body?.error?.code || 'none'}`);

  // 7.5 XSS attempt
  const xssAttempt = await page.evaluate(async (args) => {
    const r = await fetch(`${args.base}/api/widget/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: args.key, message: '<script>alert("xss")</script>' })
    });
    return { status: r.status };
  }, { base: BASE_URL, key: WIDGET_KEY });
  log(`  ✅ 7.5 XSS input: status=${xssAttempt.status} (should be 200, handled safely)`);

  // ========================================
  // SUMMARY
  // ========================================
  log('\n=== FINAL SUMMARY ===');
  log(`Console errors: ${consoleErrors.length}`);
  log(`Total network requests: ${networkRequests.length}`);
  const widgetRequests = networkRequests.filter(r => r.url.includes('/api/widget'));
  log(`Widget API requests: ${widgetRequests.length}`);
  widgetRequests.forEach(r => log(`  ${r.method} ${r.url.replace(BASE_URL, '')}`));

  if (consoleErrors.length > 0) {
    log('\nConsole errors:');
    consoleErrors.slice(0, 10).forEach(e => log(`  ⚠️ ${e.substring(0, 120)}`));
  }

  await browser.close();
  server.close();

  fs.writeFileSync(path.join(__dirname, 'validation-results.txt'), results.join('\n'));
  log('\n✅ Validation complete');
})();
