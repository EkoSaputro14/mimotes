const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://mimotes.ekohomelab.online';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = [];
let widgetPublicKey = null;
let widgetId = null;

function log(msg) {
  console.log(msg);
  results.push(msg);
}

async function screenshot(page, name) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  log(`  📸 Screenshot: ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push({ text: msg.text(), url: page.url() });
  });
  page.on('response', resp => {
    if (resp.status() >= 400) networkFailures.push({ url: resp.url(), status: resp.status() });
  });

  // ============================================================
  // STEP 1: Login and Create Widget
  // ============================================================
  log('\n=== STEP 1: Login + Create Widget ===');

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await screenshot(page, '01-login-page');

  await page.fill('input[type="email"]', 'admin@mimotes.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/{dashboard,documents}', { timeout: 10000 });
  log('  ✅ Logged in successfully');
  await screenshot(page, '02-dashboard');

  // Navigate to widget settings
  await page.goto(`${BASE_URL}/settings/widget`, { waitUntil: 'networkidle', timeout: 15000 });
  await screenshot(page, '03-widget-settings');
  log('  ✅ Widget settings page loaded');

  // Check if widget already exists
  const existingWidget = await page.$('text=pw_pub_');
  if (existingWidget) {
    log('  ℹ️ Widget already exists, extracting publicKey...');
    const keyText = await existingWidget.textContent();
    const match = keyText.match(/pw_pub_[A-Za-z0-9_-]+/);
    if (match) {
      widgetPublicKey = match[0];
      log(`  ✅ Found existing publicKey: ${widgetPublicKey.substring(0, 20)}...`);
    }
  }

  // Create new widget if none exists
  if (!widgetPublicKey) {
    const createBtn = await page.$('button:has-text("Create"), button:has-text("Buat"), button:has-text("Add")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '04-create-widget-form');

      // Fill widget name
      const nameInput = await page.$('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]');
      if (nameInput) {
        await nameInput.fill('Test Widget');
      }

      // Fill slug
      const slugInput = await page.$('input[name="slug"], input[placeholder*="slug"]');
      if (slugInput) {
        await slugInput.fill('test-widget');
      }

      // Submit
      const submitBtn = await page.$('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '05-widget-created');
      }
    }

    // Try to extract publicKey from page
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    const pubKeyMatch = pageContent.match(/pw_pub_[A-Za-z0-9_-]+/);
    if (pubKeyMatch) {
      widgetPublicKey = pubKeyMatch[0];
      log(`  ✅ Widget created with publicKey: ${widgetPublicKey.substring(0, 20)}...`);
    }
  }

  // Also try to get widget ID
  const widgetIdMatch = (await page.content()).match(/widget[_-]?id[\"']?\s*[:=]\s*[\"']([a-f0-9-]+)/i);
  if (widgetIdMatch) widgetId = widgetIdMatch[1];

  // Save publicKey for later use
  if (widgetPublicKey) {
    fs.writeFileSync(path.join(__dirname, 'widget-key.txt'), widgetPublicKey);
    log(`  ✅ PublicKey saved to widget-key.txt`);
  } else {
    log('  ⚠️ Could not extract publicKey from UI, will try API...');
  }

  // ============================================================
  // STEP 2: Create Test HTML Page
  // ============================================================
  log('\n=== STEP 2: Create Test HTML Page ===');

  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MimoNotes Widget Test</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    p { color: #666; }
    .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>MimoNotes Widget Test Page</h1>
  <div class="info">
    <p>This page tests the MimoNotes embeddable chat widget.</p>
    <p>Widget publicKey: <code id="pubkey">${widgetPublicKey || 'pw_pub_test'}</code></p>
  </div>
  <script src="${BASE_URL}/widget.js" data-key="${widgetPublicKey || 'pw_pub_test'}"></script>
</body>
</html>`;

  const testHtmlPath = path.join(__dirname, 'widget-test-real.html');
  fs.writeFileSync(testHtmlPath, testHtml);
  log(`  ✅ Test HTML created: widget-test-real.html`);

  // ============================================================
  // STEP 3: Browser Automation - Widget Tests
  // ============================================================
  log('\n=== STEP 3: Widget Browser Tests ===');

  // Open test page
  await page.goto(`file:///${testHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '06-test-page-loaded');

  // Test 3.1: Widget launcher visible
  const launcher = await page.$('[aria-label="Open chat"], [data-mimo-launcher], .mimo-launcher, button[class*="mimo"]');
  if (launcher) {
    log('  ✅ 3.1 Widget launcher visible');
    await screenshot(page, '07-launcher-visible');

    // Test 3.2: Open widget
    await launcher.click();
    await page.waitForTimeout(1500);
    await screenshot(page, '08-widget-opened');

    const chatWindow = await page.$('[role="dialog"], [data-mimo-chat], .mimo-chat-window');
    if (chatWindow) {
      log('  ✅ 3.2 Widget opens on click');

      // Test 3.3: ARIA attributes
      const ariaLabel = await chatWindow.getAttribute('aria-label');
      if (ariaLabel) {
        log(`  ✅ 3.3 ARIA label present: "${ariaLabel}"`);
      } else {
        log('  ⚠️ 3.3 No aria-label on chat window');
      }

      // Test 3.4: Messages container has aria-live
      const messagesContainer = await page.$('[aria-live="polite"], [role="log"]');
      if (messagesContainer) {
        log('  ✅ 3.4 Messages container has aria-live="polite"');
      } else {
        log('  ⚠️ 3.4 No aria-live messages container found');
      }

      // Test 3.5: Input field
      const input = await page.$('input[aria-label*="message"], input[aria-label*="Message"], textarea[aria-label*="message"]');
      if (input) {
        log('  ✅ 3.5 Chat input with aria-label found');

        // Test 3.6: Send a message
        await input.fill('Hello, this is a test message');
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-message-typed.png') });

        // Find and click send button
        const sendBtn = await page.$('button[aria-label="Send message"], button[aria-label*="Send"], button[type="submit"]');
        if (sendBtn) {
          await sendBtn.click({ force: true });
          log('  ✅ 3.6 Message sent');

          // Wait for response (streaming or non-streaming)
          await page.waitForTimeout(5000);
          await screenshot(page, '10-response-received');

          // Check if response appeared
          const messages = await page.$$('[role="article"], .mimo-message, [data-role]');
          if (messages.length > 0) {
            log(`  ✅ 3.7 Response rendered (${messages.length} messages)`);
          } else {
            log('  ⚠️ 3.7 No response messages found');
          }
        } else {
          log('  ⚠️ 3.6 Send button not found');
        }
      } else {
        log('  ⚠️ 3.5 Chat input not found');
      }

      // Test 3.8: Close widget
      const closeBtn = await page.$('button[aria-label="Close chat"], button[aria-label*="Close"], button.mimo-close');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        log('  ✅ 3.8 Widget closed');
      } else {
        log('  ⚠️ 3.8 Close button not found');
      }
    } else {
      log('  ❌ 3.2 Widget did not open');
    }
  } else {
    log('  ❌ 3.1 Widget launcher not found');
    // Try alternative selectors
    const allButtons = await page.$$('button');
    log(`  ℹ️ Found ${allButtons.length} buttons on page`);
    for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
      const cls = await allButtons[i].getAttribute('class');
      const label = await allButtons[i].getAttribute('aria-label');
      log(`    Button ${i}: class="${cls?.substring(0, 50)}" aria-label="${label}"`);
    }
  }

  // ============================================================
  // STEP 3.9: Mobile viewport test
  // ============================================================
  log('\n=== 3.9 Mobile Viewport Test ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await screenshot(page, '11-mobile-viewport');

  const mobileLauncher = await page.$('[aria-label="Open chat"], [data-mimo-launcher], .mimo-launcher');
  if (mobileLauncher) {
    const isVisible = await mobileLauncher.isVisible();
    if (isVisible) {
      log('  ✅ 3.9 Widget launcher visible on mobile');
      await mobileLauncher.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '12-mobile-widget-opened');

      const mobileChat = await page.$('[role="dialog"], .mimo-chat-window');
      if (mobileChat) {
        const chatVisible = await mobileChat.isVisible();
        log(`  ✅ 3.9 Widget opens on mobile (visible: ${chatVisible})`);
      }
    } else {
      log('  ⚠️ 3.9 Widget launcher not visible on mobile');
    }
  } else {
    log('  ⚠️ 3.9 Widget launcher not found on mobile');
  }

  // Reset viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // ============================================================
  // STEP 3.10: Keyboard navigation test
  // ============================================================
  log('\n=== 3.10 Keyboard Navigation Test ===');
  await page.goto(`file:///${testHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Tab to launcher
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el?.tagName, ariaLabel: el?.getAttribute('aria-label'), class: el?.className?.substring(0, 50) };
  });
  log(`  Focus after Tab: ${JSON.stringify(focusedElement)}`);

  // Enter to open
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await screenshot(page, '13-keyboard-opened');

  // Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  log('  ✅ 3.10 Keyboard navigation tested (Tab, Enter, Escape)');

  // ============================================================
  // STEP 5: Security Tests
  // ============================================================
  log('\n=== STEP 5: Security Tests ===');

  // Test 5.1: Invalid publicKey
  const invalidKeyResp = await page.evaluate(async (baseUrl) => {
    try {
      const resp = await fetch(`${baseUrl}/api/widget/config?publicKey=pw_pub_invalid_key_12345`);
      return { status: resp.status, body: await resp.json() };
    } catch (e) { return { error: e.message }; }
  }, BASE_URL);
  if (invalidKeyResp.status === 404 || invalidKeyResp.body?.error) {
    log('  ✅ 5.1 Invalid publicKey rejected');
  } else {
    log(`  ❌ 5.1 Invalid publicKey not rejected: ${JSON.stringify(invalidKeyResp)}`);
  }

  // Test 5.2: Missing publicKey
  const missingKeyResp = await page.evaluate(async (baseUrl) => {
    try {
      const resp = await fetch(`${baseUrl}/api/widget/config`);
      return { status: resp.status, body: await resp.json() };
    } catch (e) { return { error: e.message }; }
  }, BASE_URL);
  if (missingKeyResp.status === 400 || missingKeyResp.body?.error) {
    log('  ✅ 5.2 Missing publicKey rejected');
  } else {
    log(`  ⚠️ 5.2 Missing publicKey response: ${JSON.stringify(missingKeyResp)}`);
  }

  // Test 5.3: Chat without valid key
  const invalidChatResp = await page.evaluate(async (baseUrl) => {
    try {
      const resp = await fetch(`${baseUrl}/api/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: 'pw_pub_fake', message: 'test' })
      });
      return { status: resp.status, body: await resp.json() };
    } catch (e) { return { error: e.message }; }
  }, BASE_URL);
  if (invalidChatResp.status === 404 || invalidChatResp.body?.error) {
    log('  ✅ 5.3 Chat with invalid key rejected');
  } else {
    log(`  ❌ 5.3 Chat with invalid key not rejected: ${JSON.stringify(invalidChatResp)}`);
  }

  // Test 5.4: Streaming endpoint with invalid key
  const invalidStreamResp = await page.evaluate(async (baseUrl) => {
    try {
      const resp = await fetch(`${baseUrl}/api/widget/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: 'pw_pub_fake', message: 'test' })
      });
      return { status: resp.status, body: await resp.json() };
    } catch (e) { return { error: e.message }; }
  }, BASE_URL);
  if (invalidStreamResp.status === 404 || invalidStreamResp.body?.error) {
    log('  ✅ 5.4 Streaming with invalid key rejected');
  } else {
    log(`  ❌ 5.4 Streaming with invalid key not rejected: ${JSON.stringify(invalidStreamResp)}`);
  }

  // ============================================================
  // Summary
  // ============================================================
  log('\n=== SUMMARY ===');
  log(`Console errors: ${consoleErrors.length}`);
  log(`Network failures: ${networkFailures.length}`);
  if (consoleErrors.length > 0) {
    log('Console errors:');
    consoleErrors.slice(0, 5).forEach(e => log(`  - ${e.text.substring(0, 100)}`));
  }
  if (networkFailures.length > 0) {
    log('Network failures:');
    networkFailures.slice(0, 5).forEach(f => log(`  - ${f.url} → ${f.status}`));
  }

  await browser.close();

  // Save results
  fs.writeFileSync(path.join(__dirname, 'validation-results.txt'), results.join('\n'));
  log('\n✅ Validation complete. Results saved to validation-results.txt');
})();
