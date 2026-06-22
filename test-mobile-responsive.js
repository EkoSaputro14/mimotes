const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Mobile viewport (iPhone 14)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    recordVideo: {
      dir: path.join(__dirname, '..', 'test-videos'),
      size: { width: 390, height: 844 },
    },
  });

  const page = await context.newPage();
  
  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3100/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: path.join(__dirname, '..', 'test-videos', '01-login-mobile.png') });
  
  // Login
  console.log('2. Logging in...');
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  
  if (await emailInput.count() > 0) {
    await emailInput.fill('admin@mimotes.com');
    await passwordInput.fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  
  console.log('3. Dashboard loaded, taking screenshot...');
  await page.screenshot({ path: path.join(__dirname, '..', 'test-videos', '02-dashboard-mobile.png') });
  
  // Navigate to chat
  console.log('4. Navigating to chat...');
  await page.goto('http://localhost:3100/chat', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, '..', 'test-videos', '03-chat-empty-mobile.png') });
  
  // Check header layout
  console.log('5. Checking header...');
  const header = page.locator('h1:has-text("Mimotes AI")');
  if (await header.count() > 0) {
    const box = await header.boundingBox();
    console.log(`   Title bounding box: x=${box?.x}, y=${box?.y}, w=${box?.width}, h=${box?.height}`);
    const viewportWidth = 390;
    if (box && (box.x + box.width) > viewportWidth) {
      console.log('   ⚠️ WARNING: Title overflows viewport!');
    } else {
      console.log('   ✅ Title fits within viewport');
    }
  }
  
  // Check dropdown
  console.log('6. Checking dropdown...');
  const dropdown = page.locator('text=Customer Service');
  if (await dropdown.count() > 0) {
    const dbox = await dropdown.boundingBox();
    console.log(`   Dropdown bounding box: x=${dbox?.x}, y=${dbox?.y}, w=${dbox?.width}`);
    if (dbox && (dbox.x + dbox.width) > 390) {
      console.log('   ⚠️ WARNING: Dropdown overflows viewport!');
    } else {
      console.log('   ✅ Dropdown fits within viewport');
    }
  }
  
  // Check chat input
  console.log('7. Checking chat input...');
  const textarea = page.locator('textarea');
  if (await textarea.count() > 0) {
    const tbox = await textarea.boundingBox();
    console.log(`   Textarea bounding box: x=${tbox?.x}, y=${tbox?.y}, bottom=${tbox ? tbox.y + tbox.height : 'N/A'}`);
    if (tbox && (tbox.y + tbox.height) > 844) {
      console.log('   ⚠️ WARNING: Input cut off by viewport bottom!');
    } else {
      console.log('   ✅ Input visible within viewport');
    }
  }
  
  // Type a message
  console.log('8. Typing a message...');
  await textarea.fill('Apa saja dokumen yang tersedia?');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, '..', 'test-videos', '04-chat-typing-mobile.png') });
  
  // Check if header dropdown row wraps correctly
  console.log('9. Checking menu row layout...');
  const headerContainer = page.locator('.space-y-3').first();
  if (await headerContainer.count() > 0) {
    const hbox = await headerContainer.boundingBox();
    console.log(`   Header container: x=${hbox?.x}, y=${hbox?.y}, w=${hbox?.width}, h=${hbox?.height}`);
    if (hbox && hbox.height > 120) {
      console.log('   ✅ Header wraps to 2 rows (expected on mobile)');
    }
  }
  
  // Tablet view
  console.log('10. Testing tablet viewport...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, '..', 'test-videos', '05-chat-tablet.png') });
  
  // Desktop view
  console.log('11. Testing desktop viewport...');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, '..', 'test-videos', '06-chat-desktop.png') });
  
  console.log('\n✅ All tests complete!');
  
  const videoPath = await page.video().path();
  console.log(`📹 Video saved: ${videoPath}`);
  
  await context.close();
  await browser.close();
})();
