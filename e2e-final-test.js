const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3100';
const SS_DIR = path.join(__dirname, 'e2e-screenshots');
let si = 50;
async function ss(page, name) {
  si++;
  const fname = `${si}-final-${name}.png`;
  await page.screenshot({ path: path.join(SS_DIR, fname), fullPage: true });
  console.log(`  📸 ${fname}`);
}
async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🎯 Final Focused E2E Tests\n');
  const browser = await chromium.launch({ headless: true });

  // === TEST A: Registration with confirmPassword ===
  console.log('=== TEST A: Full Registration Flow ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    const networkReqs = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`[pageerror] ${err.message}`));
    page.on('response', resp => {
      if (resp.status() >= 400 && resp.url().includes('localhost')) {
        networkReqs.push({ url: resp.url(), status: resp.status() });
      }
    });

    await page.goto(BASE + '/register', { waitUntil: 'networkidle' });
    
    // Fill ALL fields including confirmPassword
    await page.fill('#name', 'Test User E2E');
    await page.fill('#email', 'e2e-test-new@qa.local');
    await page.fill('#password', 'TestPass123!');
    await page.fill('#confirmPassword', 'TestPass123!');
    
    await ss(page, 'reg-complete-filled');
    
    // Submit
    await page.click('button[type="submit"]');
    await delay(5000);
    
    console.log(`  URL after registration: ${page.url()}`);
    
    // Check for errors on page
    const bodyText = await page.textContent('body');
    const errorEls = await page.$$eval('[class*="error"], [class*="alert"], [class*="toast"], [role="alert"], [class*="destructive"], [class*="red"]', 
      els => els.map(e => e.textContent?.trim()).filter(t => t && t.length > 0));
    console.log('  Error elements:', errorEls);
    
    // Check if redirected to login
    if (page.url().includes('login')) {
      console.log('  ✅ Registration redirected to login');
    } else if (page.url().includes('register')) {
      // Check for specific error messages
      const pageContent = await page.textContent('body');
      if (pageContent.includes('sudah terdaftar') || pageContent.includes('already') || pageContent.includes('exists')) {
        console.log('  ℹ️ Email already registered (expected)');
      } else {
        console.log('  ⚠️ Still on register page, checking for validation errors');
        // Check for form validation
        const validationMessages = await page.$$eval('input:invalid, [aria-invalid="true"]', els => els.map(e => e.validationMessage || e.getAttribute('aria-describedby')));
        console.log('  Validation:', validationMessages);
      }
    }
    
    await ss(page, 'reg-complete-result');
    console.log(`  Console errors: ${consoleErrors.length}`);
    console.log(`  Failed requests: ${networkReqs.map(r => `${r.status} ${r.url}`).join(', ')}`);
    
    await ctx.close();
  }
  
  // === TEST B: Full Upload Flow (correct button) ===
  console.log('\n=== TEST B: Correct Upload Flow ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    const networkReqs = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`[pageerror] ${err.message}`));
    page.on('response', resp => {
      networkReqs.push({ url: resp.url(), status: resp.status() });
    });

    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'admin@mimotes.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    console.log(`  Logged in: ${page.url()}`);

    // Go to upload
    await page.goto(BASE + '/documents/upload', { waitUntil: 'networkidle' });
    
    // Upload PDF using the correct "Upload Dokumen" submit button
    const pdfPath = path.join(__dirname, 'corpus-build', 'pdf', 'postgresql-16-US.pdf');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput && fs.existsSync(pdfPath)) {
      await fileInput.setInputFiles(pdfPath);
      console.log('  PDF selected');
      await ss(page, 'upload-pdf-selected');
      
      // Click "Upload Dokumen" submit button (not "File Upload" tab)
      const uploadSubmit = await page.$('button[type="submit"]:has-text("Upload Dokumen")');
      if (uploadSubmit) {
        await uploadSubmit.click();
        console.log('  Clicked "Upload Dokumen" submit');
        await delay(10000);
      }
      
      console.log(`  URL after upload: ${page.url()}`);
      
      // Check for success/error
      const bodyText = await page.textContent('body');
      const hasSuccess = bodyText.includes('berhasil') || bodyText.includes('success') || bodyText.includes('uploaded');
      const hasError = bodyText.includes('error') || bodyText.includes('gagal') || bodyText.includes('failed');
      console.log(`  Success indicator: ${hasSuccess}, Error indicator: ${hasError}`);
    }
    
    await ss(page, 'upload-pdf-result');
    
    // Check documents list
    await page.goto(BASE + '/documents', { waitUntil: 'networkidle' });
    await delay(2000);
    
    const docCount = await page.$$eval('[class*="document"], [class*="Document"], table tr, [class*="card"]', els => els.length);
    console.log(`  Document items found: ${docCount}`);
    
    // Get body text to see documents
    const docsText = await page.evaluate(() => {
      const headings = [...document.querySelectorAll('h3')].map(h => h.textContent?.trim());
      return headings.slice(0, 10);
    });
    console.log('  First 10 document headings:', docsText);
    
    await ss(page, 'upload-docs-list');
    console.log(`  Console errors: ${consoleErrors.length}`);
    
    // Check API failures
    const apiFailures = networkReqs.filter(r => r.status >= 400);
    console.log(`  API failures: ${apiFailures.map(r => `${r.status} ${r.url}`).join('\n  ')}`);
    
    await ctx.close();
  }
  
  // === TEST C: Chat with authenticated user ===
  console.log('\n=== TEST C: Chat with Auth ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    const networkReqs = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`[pageerror] ${err.message}`));
    page.on('response', resp => {
      networkReqs.push({ url: resp.url(), status: resp.status() });
    });

    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'admin@mimotes.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Go to chat
    await page.goto(BASE + '/chat', { waitUntil: 'networkidle' });
    await ss(page, 'chat-page');
    
    // Type in textarea
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('What are the main features of PostgreSQL?');
      await ss(page, 'chat-typed');
      
      // Press Enter to send
      await textarea.press('Enter');
      console.log('  Message sent via Enter');
      
      // Wait for response
      await delay(15000);
      await ss(page, 'chat-response');
      
      // Check for response content
      const responseText = await page.evaluate(() => {
        // Get all message-like elements
        const all = document.body.innerText;
        return all.substring(0, 3000);
      });
      
      // Check if there's any AI response
      const hasAIResponse = responseText.includes('PostgreSQL') && responseText.length > 500;
      console.log(`  AI response present: ${hasAIResponse}`);
      console.log(`  Response snippet: ${responseText.substring(0, 300)}`);
      
      // Check for source citations
      const hasSources = responseText.includes('source') || responseText.includes('Source') || responseText.includes('sumber') || responseText.includes('document') || responseText.includes('chunk');
      console.log(`  Source citations found: ${hasSources}`);
    }
    
    // Check network for chat API
    const chatAPIs = networkReqs.filter(r => r.url.includes('/api/chat') || r.url.includes('/api/rag'));
    console.log(`  Chat API calls: ${chatAPIs.map(r => `${r.status} ${r.url}`).join('\n  ')}`);
    
    const failures = networkReqs.filter(r => r.status >= 400);
    console.log(`  All failures: ${failures.map(r => `${r.status} ${r.url}`).join('\n  ')}`);
    
    console.log(`  Console errors: ${consoleErrors.join('\n  ')}`);
    await ctx.close();
  }
  
  // === TEST D: Sidebar navigation and RSC errors ===
  console.log('\n=== TEST D: Sidebar Navigation & RSC Errors ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const rscErrors = [];
    page.on('requestfailed', req => {
      if (req.url().includes('_rsc')) {
        rscErrors.push(req.url());
      }
    });

    // Login
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'admin@mimotes.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Navigate through sidebar links
    const sidebarLinks = await page.$$eval('aside a, nav a', els => els.map(e => ({
      text: e.textContent?.trim()?.substring(0, 30),
      href: e.href
    })).filter(l => l.href.includes('localhost')));
    
    console.log(`  Sidebar links: ${sidebarLinks.length}`);
    
    // Visit key pages
    const pages = ['/dashboard', '/documents', '/documents/upload', '/chat', '/settings', '/knowledge/documents', '/analytics/usage'];
    for (const p of pages) {
      rscErrors.length = 0; // reset
      await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await delay(1000);
      if (rscErrors.length > 0) {
        console.log(`  ${p}: ${rscErrors.length} RSC errors`);
      } else {
        console.log(`  ${p}: OK`);
      }
    }
    
    await ss(page, 'nav-final');
    await ctx.close();
  }

  // === TEST E: Mobile viewport deep dive ===
  console.log('\n=== TEST E: Mobile Deep Dive ===');
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
    });
    const page = await ctx.newPage();

    // Login on mobile
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await ss(page, 'mob-login');
    await page.fill('#email', 'admin@mimotes.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Check if mobile nav exists
    const mobileNav = await page.$('[class*="mobile"], [class*="hamburger"], [class*="menu-button"], button[aria-label*="menu"], [class*="sidebar-toggle"]');
    console.log(`  Mobile nav toggle found: ${!!mobileNav}`);
    
    // Dashboard on mobile
    await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
    await ss(page, 'mob-dashboard');
    
    // Check overflow
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`  Dashboard overflow: ${JSON.stringify(overflow)}`);
    
    // Documents on mobile
    await page.goto(BASE + '/documents', { waitUntil: 'networkidle' });
    await ss(page, 'mob-documents');
    
    // Chat on mobile
    await page.goto(BASE + '/chat', { waitUntil: 'networkidle' });
    await ss(page, 'mob-chat');
    
    // Settings on mobile
    await page.goto(BASE + '/settings', { waitUntil: 'networkidle' });
    await ss(page, 'mob-settings');
    
    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ Final focused tests complete!');
}

main().catch(e => console.error('Fatal:', e));
