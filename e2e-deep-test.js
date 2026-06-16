const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3100';
const SS_DIR = path.join(__dirname, 'e2e-screenshots');
let si = 0;

async function ss(page, name) {
  si++;
  const fname = `${String(si).padStart(2,'0')}-deep-${name}.png`;
  await page.screenshot({ path: path.join(SS_DIR, fname), fullPage: true });
  console.log(`  📸 ${fname}`);
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔬 Deep E2E Investigation\n');
  const browser = await chromium.launch({ headless: true });
  
  // === DEEP TEST 1: Registration flow analysis ===
  console.log('=== DEEP TEST 1: Registration Flow ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));
    
    // Go to register
    await page.goto(BASE + '/register', { waitUntil: 'networkidle' });
    const pageTitle = await page.title();
    console.log(`  Page title: ${pageTitle}`);
    
    // Get all form fields
    const fields = await page.$$eval('input, select, textarea', els => els.map(e => ({
      tag: e.tagName, type: e.type, name: e.name, id: e.id, placeholder: e.placeholder, required: e.required
    })));
    console.log('  Form fields:', JSON.stringify(fields, null, 2));
    
    // Get all buttons
    const buttons = await page.$$eval('button', els => els.map(e => ({
      text: e.textContent?.trim(), type: e.type, disabled: e.disabled
    })));
    console.log('  Buttons:', JSON.stringify(buttons, null, 2));
    
    // Fill and submit registration
    const nameEl = await page.$('input[name="name"]');
    const emailEl = await page.$('input[name="email"]');
    const passEl = await page.$('input[name="password"]');
    
    if (nameEl) await nameEl.fill('Test User E2E');
    if (emailEl) await emailEl.fill('e2e-test@qa.local');
    if (passEl) await passEl.fill('TestPass123!');
    
    await ss(page, 'reg-filled');
    
    // Check for any hidden fields
    const allInputs = await page.$$eval('input', els => els.map(e => ({
      name: e.name, type: e.type, value: e.value, hidden: e.type === 'hidden'
    })));
    console.log('  All inputs (incl hidden):', JSON.stringify(allInputs));
    
    // Submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await delay(3000);
    }
    
    console.log(`  URL after submit: ${page.url()}`);
    
    // Check for error messages
    const errorTexts = await page.$$eval('[class*="error"], [class*="alert"], [class*="toast"], [role="alert"]', 
      els => els.map(e => e.textContent?.trim()).filter(Boolean));
    console.log('  Error/alert messages:', errorTexts);
    
    // Check for success indicators
    const bodyText = await page.textContent('body');
    const hasSuccess = bodyText.includes('success') || bodyText.includes('berhasil') || bodyText.includes('created');
    console.log(`  Registration success indicator: ${hasSuccess}`);
    
    await ss(page, 'reg-result');
    console.log(`  Console errors: ${consoleErrors.join('\n  ')}`);
    
    await ctx.close();
  }
  
  // === DEEP TEST 2: Login flow analysis ===
  console.log('\n=== DEEP TEST 2: Login Flow ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    const networkRequests = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));
    page.on('response', resp => {
      if (resp.url().includes('localhost')) {
        networkRequests.push({ url: resp.url(), status: resp.status() });
      }
    });
    
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    
    const fields = await page.$$eval('input', els => els.map(e => ({
      type: e.type, name: e.name, id: e.id
    })));
    console.log('  Login fields:', JSON.stringify(fields));
    
    // Login as admin
    const emailEl = await page.$('input[name="email"], input[type="email"]');
    const passEl = await page.$('input[name="password"], input[type="password"]');
    if (emailEl) await emailEl.fill('admin@mimotes.com');
    if (passEl) await passEl.fill('admin123');
    
    await ss(page, 'login-filled');
    
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await delay(2000);
    
    console.log(`  URL after login: ${page.url()}`);
    
    // Check for auth cookies
    const cookies = await ctx.cookies();
    const authCookies = cookies.filter(c => 
      c.name.includes('token') || c.name.includes('session') || c.name.includes('auth') || c.name.includes('next-auth')
    );
    console.log('  Auth cookies:', authCookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`));
    
    // Check for error messages
    const errorTexts = await page.$$eval('[class*="error"], [class*="alert"], [role="alert"]', 
      els => els.map(e => e.textContent?.trim()).filter(Boolean));
    console.log('  Login errors:', errorTexts);
    
    // Check response codes for login
    const loginResponses = networkRequests.filter(r => r.status >= 400);
    console.log('  Failed requests:', loginResponses.map(r => `${r.status} ${r.url}`));
    
    await ss(page, 'login-result');
    console.log(`  Console errors: ${consoleErrors.join('\n  ')}`);
    
    // Now navigate to dashboard
    await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`  Dashboard URL: ${page.url()}`);
    await ss(page, 'admin-dashboard');
    
    // Get page content summary
    const dashContent = await page.evaluate(() => {
      const headings = [...document.querySelectorAll('h1, h2, h3')].map(h => h.textContent?.trim());
      const cards = [...document.querySelectorAll('[class*="card"], [class*="Card"]')].length;
      return { headings, cards };
    });
    console.log('  Dashboard headings:', dashContent.headings);
    console.log('  Dashboard cards:', dashContent.cards);
    
    await ctx.close();
  }
  
  // === DEEP TEST 3: Upload page analysis ===
  console.log('\n=== DEEP TEST 3: Upload Page Analysis ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    
    // Login first
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    const emailEl = await page.$('input[name="email"], input[type="email"]');
    const passEl = await page.$('input[name="password"], input[type="password"]');
    if (emailEl) await emailEl.fill('admin@mimotes.com');
    if (passEl) await passEl.fill('admin123');
    const btn = await page.$('button[type="submit"]');
    if (btn) await btn.click();
    await delay(3000);
    
    // Go to upload
    await page.goto(BASE + '/documents/upload', { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`  Upload page URL: ${page.url()}`);
    
    // Get all form elements
    const formEls = await page.$$eval('input, button, select, textarea', els => els.map(e => ({
      tag: e.tagName, type: e.type, name: e.name, id: e.id, 
      text: e.textContent?.trim()?.substring(0, 50),
      accept: e.accept, multiple: e.multiple
    })));
    console.log('  Form elements:', JSON.stringify(formEls, null, 2));
    
    // Check for drag-and-drop zone
    const dropZone = await page.$('[class*="drop"], [class*="upload"], [class*="zone"]');
    console.log(`  Drop zone found: ${!!dropZone}`);
    
    await ss(page, 'upload-analysis');
    
    // Try single file upload
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const isMultiple = await fileInput.evaluate(el => el.multiple);
      console.log(`  File input multiple: ${isMultiple}`);
      
      const pdfPath = path.join(__dirname, 'corpus-build', 'pdf', 'postgresql-16-US.pdf');
      if (fs.existsSync(pdfPath)) {
        await fileInput.setInputFiles(pdfPath);
        console.log('  Single PDF file selected');
        await ss(page, 'upload-file-selected');
        
        // Find and click upload
        const uploadBtns = await page.$$eval('button', els => els.map(e => ({
          text: e.textContent?.trim(), type: e.type, disabled: e.disabled
        })));
        console.log('  Available buttons:', JSON.stringify(uploadBtns));
        
        // Try clicking the upload/submit button
        const uploadBtn = await page.$('button:has-text("Upload"), button:has-text("Submit"), button:has-text("Proses"), button:has-text("Mulai")');
        if (uploadBtn) {
          const btnText = await uploadBtn.textContent();
          console.log(`  Clicking upload button: "${btnText}"`);
          await uploadBtn.click();
          await delay(8000);
          console.log(`  URL after upload: ${page.url()}`);
        }
        
        await ss(page, 'upload-after-submit');
      }
    }
    
    console.log(`  Console errors: ${consoleErrors.join('\n  ')}`);
    await ctx.close();
  }
  
  // === DEEP TEST 4: Document list & upload via admin ===
  console.log('\n=== DEEP TEST 4: Documents Page Analysis ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    
    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.$eval('input[name="email"], input[type="email"]', (el) => el.value = '', {});
    await page.fill('input[name="email"], input[type="email"]', 'admin@mimotes.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Go to documents
    await page.goto(BASE + '/documents', { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`  Documents URL: ${page.url()}`);
    
    // Get document list content
    const docContent = await page.evaluate(() => {
      const tables = [...document.querySelectorAll('table')];
      const rows = tables.flatMap(t => [...t.querySelectorAll('tr')].map(r => r.textContent?.trim()?.substring(0, 100)));
      const links = [...document.querySelectorAll('a[href*="document"]')].map(a => ({
        text: a.textContent?.trim(), href: a.href
      }));
      const headings = [...document.querySelectorAll('h1, h2, h3')].map(h => h.textContent?.trim());
      return { rows, links, headings };
    });
    console.log('  Document headings:', docContent.headings);
    console.log('  Document table rows:', docContent.rows.length);
    console.log('  Document links:', JSON.stringify(docContent.links, null, 2));
    
    await ss(page, 'docs-list-analysis');
    console.log(`  Console errors: ${consoleErrors.join('\n  ')}`);
    
    // Try upload with single file
    await page.goto(BASE + '/documents/upload', { waitUntil: 'networkidle', timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      // Upload single file
      const txtPath = path.join(SS_DIR, 'test-upload-single.txt');
      fs.writeFileSync(txtPath, 'PostgreSQL is a powerful, open source object-relational database system with over 35 years of active development. It has earned a strong reputation for reliability, feature robustness, and performance.');
      
      await fileInput.setInputFiles(txtPath);
      await ss(page, 'docs-txt-selected');
      
      const submitBtn = await page.$('button[type="submit"], button:has-text("Upload"), button:has-text("Submit")');
      if (submitBtn) {
        await submitBtn.click();
        console.log('  Single TXT upload submitted');
        await delay(5000);
        await ss(page, 'docs-txt-uploaded');
      }
    }
    
    // Check document list again
    await page.goto(BASE + '/documents', { waitUntil: 'networkidle' });
    const newDocs = await page.evaluate(() => {
      return document.body.innerText.substring(0, 2000);
    });
    console.log('  Documents page content (first 500 chars):', newDocs.substring(0, 500));
    await ss(page, 'docs-after-upload');
    
    await ctx.close();
  }
  
  // === DEEP TEST 5: Settings page deep analysis ===
  console.log('\n=== DEEP TEST 5: Settings Deep Analysis ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    
    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"], input[type="email"]', 'admin@mimotes.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Go to settings
    await page.goto(BASE + '/settings', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Get all settings tabs/sections
    const settingsNav = await page.$$eval('[role="tab"], nav a, [role="tabpanel"]', els => els.map(e => ({
      tag: e.tagName, text: e.textContent?.trim()?.substring(0, 50), href: e.href
    })));
    console.log('  Settings sections:', JSON.stringify(settingsNav, null, 2));
    
    // Click on "Akun" (Account) tab
    const akunTab = await page.$('text=Akun');
    if (akunTab) {
      await akunTab.click();
      await delay(1000);
      await ss(page, 'settings-account');
      
      const accountFields = await page.$$eval('input, select, textarea', els => els.map(e => ({
        type: e.type, name: e.name, id: e.id, placeholder: e.placeholder, value: e.value?.substring(0, 50)
      })));
      console.log('  Account fields:', JSON.stringify(accountFields, null, 2));
    }
    
    // Click on "Keamanan" (Security) tab
    const securityTab = await page.$('text=Keamanan');
    if (securityTab) {
      await securityTab.click();
      await delay(1000);
      await ss(page, 'settings-security');
      
      const secContent = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        return main.innerText.substring(0, 1000);
      });
      console.log('  Security section content:', secContent.substring(0, 500));
    }
    
    // Click on "API Keys" tab
    const apiKeyTab = await page.$('text=API Keys');
    if (apiKeyTab) {
      await apiKeyTab.click();
      await delay(1000);
      await ss(page, 'settings-apikeys');
      
      const apiContent = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        return main.innerText.substring(0, 1000);
      });
      console.log('  API Keys section:', apiContent.substring(0, 500));
    }
    
    await ctx.close();
  }
  
  // === DEEP TEST 6: Chat page analysis ===
  console.log('\n=== DEEP TEST 6: Chat Page Analysis ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    const networkRequests = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('response', resp => {
      networkRequests.push({ url: resp.url(), status: resp.status() });
    });
    
    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"], input[type="email"]', 'admin@mimotes.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Go to chat
    await page.goto(BASE + '/chat', { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`  Chat URL: ${page.url()}`);
    
    // Analyze chat page
    const chatElements = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('textarea, input[type="text"]')].map(e => ({
        tag: e.tagName, name: e.name, id: e.id, placeholder: e.placeholder
      }));
      const buttons = [...document.querySelectorAll('button')].map(e => ({
        text: e.textContent?.trim()?.substring(0, 50), type: e.type
      }));
      return { inputs, buttons };
    });
    console.log('  Chat inputs:', JSON.stringify(chatElements.inputs));
    console.log('  Chat buttons:', JSON.stringify(chatElements.buttons));
    
    await ss(page, 'chat-analysis');
    
    // Try to send a message
    const chatInput = await page.$('textarea, input[type="text"][name="message"], input[placeholder*="ask" i], input[placeholder*="message" i], input[placeholder*="question" i]');
    if (chatInput) {
      await chatInput.fill('What is PostgreSQL?');
      await ss(page, 'chat-message-typed');
      
      // Send
      const sendBtn = await page.$('button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]');
      if (sendBtn) {
        await sendBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await delay(12000); // Wait for AI response
      await ss(page, 'chat-after-send');
      
      // Check for response
      const chatBody = await page.evaluate(() => {
        const msgs = document.querySelectorAll('[class*="message"], [class*="Message"], [class*="bubble"], [class*="chat"]');
        return [...msgs].map(m => m.textContent?.trim()?.substring(0, 200));
      });
      console.log('  Chat messages:', chatBody);
    } else {
      console.log('  ⚠️ No chat input found');
    }
    
    // Check API calls
    const apiCalls = networkRequests.filter(r => r.url.includes('/api/'));
    console.log('  API calls made:', apiCalls.map(r => `${r.status} ${r.url}`));
    
    const failed = networkRequests.filter(r => r.status >= 400);
    console.log('  Failed requests:', failed.map(r => `${r.status} ${r.url}`));
    
    console.log(`  Console errors: ${consoleErrors.join('\n  ')}`);
    await ctx.close();
  }
  
  // === DEEP TEST 7: Accessibility quick audit ===
  console.log('\n=== DEEP TEST 7: Accessibility Audit ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    
    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"], input[type="email"]', 'admin@mimotes.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Audit landing page
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const landingA11y = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      const missingAlt = imgs.filter(i => !i.alt && !i.getAttribute('aria-label'));
      const missingLabels = [...document.querySelectorAll('input:not([type="hidden"])')].filter(i => {
        const id = i.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAria = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby');
        const hasTitle = i.title;
        return !hasLabel && !hasAria && !hasTitle && !i.placeholder;
      });
      const noLang = !document.documentElement.lang;
      return {
        totalImages: imgs.length,
        missingAlt: missingAlt.length,
        inputsWithoutLabels: missingLabels.length,
        noLangAttribute: noLang
      };
    });
    console.log('  Landing page a11y:', JSON.stringify(landingA11y));
    
    // Audit documents page
    await page.goto(BASE + '/documents', { waitUntil: 'networkidle' });
    const docA11y = await page.evaluate(() => {
      const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => `${h.tagName}: ${h.textContent?.trim()?.substring(0, 50)}`);
      const landmarks = [...document.querySelectorAll('main, nav, aside, header, footer, [role="main"], [role="navigation"]')].map(l => l.tagName + (l.getAttribute('role') ? `[role=${l.getAttribute('role')}]` : ''));
      return { headings, landmarks };
    });
    console.log('  Documents a11y:', JSON.stringify(docA11y));
    
    // Test keyboard navigation
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const focused1 = await page.evaluate(() => document.activeElement?.tagName + '#' + document.activeElement?.id);
    await page.keyboard.press('Tab');
    const focused2 = await page.evaluate(() => document.activeElement?.tagName + '#' + document.activeElement?.id);
    console.log(`  Keyboard nav: Tab1→${focused1}, Tab2→${focused2}`);
    
    await ctx.close();
  }
  
  await browser.close();
  console.log('\n✅ Deep investigation complete!');
}

main().catch(e => console.error('Fatal:', e));
