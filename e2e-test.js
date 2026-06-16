const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3100';
const SS_DIR = path.join(__dirname, 'e2e-screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

let screenshotIndex = 0;
let allConsoleErrors = [];
let allBugs = [];

async function ss(page, name) {
  screenshotIndex++;
  const fname = `${String(screenshotIndex).padStart(2,'0')}-${name}.png`;
  await page.screenshot({ path: path.join(SS_DIR, fname), fullPage: true });
  console.log(`  📸 Screenshot: ${fname}`);
  return fname;
}

async function checkConsole(page, label) {
  // Collect any new console errors since last check
  const errors = page._consoleErrors || [];
  const newErrors = errors.splice(0); // drain
  if (newErrors.length > 0) {
    for (const e of newErrors) {
      allConsoleErrors.push({ label, error: e });
      console.log(`  ❌ Console error: ${e.substring(0, 150)}`);
    }
  }
  return newErrors;
}

function setupConsoleCapture(page) {
  page._consoleErrors = [];
  page._networkErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      page._consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    page._consoleErrors.push(`[pageerror] ${err.message}`);
  });
  page.on('requestfailed', req => {
    page._networkErrors.push(`[NET FAIL] ${req.url()} ${req.failure()?.errorText || ''}`);
    page._consoleErrors.push(`[NET FAIL] ${req.url()} ${req.failure()?.errorText || ''}`);
  });
}

function addBug(severity, journey, step, description) {
  allBugs.push({ severity, journey, step, description });
}

async function safeClick(page, selector, timeout = 5000) {
  try {
    await page.click(selector, { timeout });
    return true;
  } catch (e) {
    console.log(`  ⚠️ Click failed for "${selector}": ${e.message.substring(0, 100)}`);
    return false;
  }
}

async function safeType(page, selector, text, timeout = 5000) {
  try {
    await page.fill(selector, text, { timeout });
    return true;
  } catch (e) {
    console.log(`  ⚠️ Type failed for "${selector}": ${e.message.substring(0, 100)}`);
    return false;
  }
}

async function waitForText(page, text, timeout = 15000) {
  try {
    await page.waitForFunction(t => document.body.innerText.includes(t), text, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============= USER JOURNEY 1 =============
async function journey1(browser) {
  console.log('\n========== USER JOURNEY 1: Registration → Document Workflow ==========');
  const context = await browser.newContext();
  const page = await context.newPage();
  setupConsoleCapture(page);

  // 1. Navigate to landing page
  console.log('Step 1: Navigate to landing page');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await ss(page, 'j1-landing');
  await checkConsole(page, 'J1-landing');
  
  // 2. Click Get Started or Register
  console.log('Step 2: Find registration link');
  let registerLink = await page.$('a[href*="register"]');
  if (!registerLink) registerLink = await page.$('text=Get Started');
  if (!registerLink) registerLink = await page.$('text=Register');
  if (!registerLink) registerLink = await page.$('text=Sign Up');
  
  if (registerLink) {
    await registerLink.click();
    await page.waitForLoadState('networkidle');
  } else {
    await page.goto(BASE + '/register', { waitUntil: 'networkidle' });
  }
  await ss(page, 'j1-register-page');
  await checkConsole(page, 'J1-register-page');
  
  // 3. Register new user
  console.log('Step 3: Register new user');
  const nameField = await page.$('input[name="name"], input[placeholder*="name" i], input[id="name"]');
  const emailField = await page.$('input[name="email"], input[type="email"], input[placeholder*="email" i]');
  const passField = await page.$('input[name="password"], input[type="password"]');
  
  if (nameField) await nameField.fill('Test User E2E');
  if (emailField) await emailField.fill('e2e-test@qa.local');
  if (passField) await passField.fill('TestPass123!');
  
  await ss(page, 'j1-register-filled');
  
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await delay(3000);
  }
  await ss(page, 'j1-register-result');
  await checkConsole(page, 'J1-register-submit');
  
  // Check if we need to login now
  const currentUrl = page.url();
  console.log(`  Current URL after register: ${currentUrl}`);
  
  // 4. Login with new credentials (if not auto-logged in)
  console.log('Step 4: Login');
  if (currentUrl.includes('login') || currentUrl.includes('register')) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  }
  
  // If we're on login page, fill credentials
  const loginEmail = await page.$('input[name="email"], input[type="email"]');
  const loginPass = await page.$('input[name="password"], input[type="password"]');
  
  if (loginEmail && loginPass) {
    await loginEmail.fill('e2e-test@qa.local');
    await loginPass.fill('TestPass123!');
    await ss(page, 'j1-login-filled');
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
      await delay(3000);
    }
  }
  await ss(page, 'j1-after-login');
  await checkConsole(page, 'J1-login');
  console.log(`  URL after login: ${page.url()}`);
  
  // 5. Create workspace (if UI supports it)
  console.log('Step 5: Create workspace');
  // Look for workspace creation
  const workspaceLink = await page.$('text=Workspace');
  if (workspaceLink) {
    await workspaceLink.click();
    await delay(1000);
  }
  // Try clicking "New Workspace" or similar
  const newWsBtn = await page.$('text=New Workspace, text=Create Workspace, text=Add Workspace');
  if (newWsBtn) {
    await newWsBtn.click();
    await delay(1000);
  }
  await ss(page, 'j1-workspace');
  await checkConsole(page, 'J1-workspace');
  
  // 6. Navigate to Documents → Upload
  console.log('Step 6: Navigate to Documents Upload');
  await page.goto(BASE + '/documents/upload', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j1-documents-upload');
  await checkConsole(page, 'J1-doc-upload');
  
  // 7. Upload a PDF file
  console.log('Step 7: Upload PDF');
  const pdfPath = path.join(__dirname, 'corpus-build', 'pdf', 'postgresql-16-US.pdf');
  if (fs.existsSync(pdfPath)) {
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(pdfPath);
      console.log('  PDF file selected for upload');
      await ss(page, 'j1-pdf-selected');
      
      // Look for upload button
      const uploadBtn = await page.$('button:has-text("Upload"), button:has-text("Submit"), button[type="submit"]');
      if (uploadBtn) {
        await uploadBtn.click();
        console.log('  Upload button clicked');
        await delay(5000);
      }
    } else {
      console.log('  ⚠️ No file input found on upload page');
      addBug('MEDIUM', 'J1', 'Step 7', 'No file input element found on upload page');
    }
  } else {
    console.log('  ⚠️ PDF file not found at:', pdfPath);
  }
  await ss(page, 'j1-upload-result');
  await checkConsole(page, 'J1-upload');
  
  // 8. Wait for document processing
  console.log('Step 8: Wait for document processing');
  await page.goto(BASE + '/documents', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j1-documents-list');
  
  let processingDone = false;
  for (let i = 0; i < 12; i++) {
    const pageText = await page.textContent('body');
    if (pageText.includes('ready') || pageText.includes('Ready') || pageText.includes('complete') || pageText.includes('Complete')) {
      processingDone = true;
      console.log('  Document processing appears complete');
      break;
    }
    if (pageText.includes('failed') || pageText.includes('Failed') || pageText.includes('error')) {
      console.log('  ⚠️ Document processing appears to have failed');
      addBug('HIGH', 'J1', 'Step 8', 'Document processing failed');
      break;
    }
    console.log(`  Polling attempt ${i + 1}/12...`);
    await delay(5000);
    await page.reload({ waitUntil: 'networkidle' });
  }
  await ss(page, 'j1-documents-after-wait');
  await checkConsole(page, 'J1-documents-wait');
  
  // 9. Open the uploaded document
  console.log('Step 9: Open uploaded document');
  const docLink = await page.$('a[href*="/documents/"], a[href*="/knowledge/documents/"]');
  if (docLink) {
    await docLink.click();
    await delay(3000);
  } else {
    // Try clicking first row in a table or list
    const firstRow = await page.$('tr td a, .document-item a, [class*="document"] a');
    if (firstRow) {
      await firstRow.click();
      await delay(3000);
    }
  }
  await ss(page, 'j1-document-detail');
  await checkConsole(page, 'J1-doc-detail');
  
  // 10. Navigate to Chat
  console.log('Step 10: Navigate to Chat');
  await page.goto(BASE + '/chat', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j1-chat-page');
  await checkConsole(page, 'J1-chat');
  
  // 11. Ask a question about the document
  console.log('Step 11: Ask question in chat');
  const chatInput = await page.$('textarea, input[name="message"], input[placeholder*="message" i], input[placeholder*="question" i], input[placeholder*="ask" i]');
  if (chatInput) {
    await chatInput.fill('What is PostgreSQL and what are its main features?');
    await ss(page, 'j1-chat-question');
    
    // Send the message
    const sendBtn = await page.$('button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    console.log('  Question sent, waiting for response...');
    await delay(10000); // Wait for AI response
  } else {
    console.log('  ⚠️ No chat input found');
    addBug('HIGH', 'J1', 'Step 11', 'Chat input field not found');
  }
  await ss(page, 'j1-chat-response');
  await checkConsole(page, 'J1-chat-response');
  
  // 12. Check for source citations
  console.log('Step 12: Check for source citations');
  const chatBody = await page.textContent('body');
  const hasCitations = chatBody.includes('source') || chatBody.includes('Source') || chatBody.includes('citation') || chatBody.includes('reference') || chatBody.includes('document');
  console.log(`  Has source references: ${hasCitations}`);
  
  // 13. Logout
  console.log('Step 13: Logout');
  const logoutBtn = await page.$('text=Logout, text=Sign Out, text=Log Out, button:has-text("Logout"), a:has-text("Logout")');
  if (logoutBtn) {
    await logoutBtn.click();
    await delay(2000);
  } else {
    // Try to find logout in a dropdown menu
    const avatar = await page.$('[class*="avatar"], [class*="user-menu"], [class*="profile"]');
    if (avatar) {
      await avatar.click();
      await delay(500);
      const logoutInMenu = await page.$('text=Logout, text=Sign Out');
      if (logoutInMenu) await logoutInMenu.click();
    }
  }
  await ss(page, 'j1-logout');
  await checkConsole(page, 'J1-logout');
  
  await context.close();
  console.log('✅ Journey 1 complete');
}

// ============= USER JOURNEY 2 =============
async function journey2(browser) {
  console.log('\n========== USER JOURNEY 2: Workspace & Team Management ==========');
  const context = await browser.newContext();
  const page = await context.newPage();
  setupConsoleCapture(page);

  // 1. Login as admin
  console.log('Step 1: Login as admin');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  const emailField = await page.$('input[name="email"], input[type="email"]');
  const passField = await page.$('input[name="password"], input[type="password"]');
  if (emailField) await emailField.fill('admin@mimotes.com');
  if (passField) await passField.fill('admin123');
  await ss(page, 'j2-admin-login');
  
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) await loginBtn.click();
  await delay(3000);
  await ss(page, 'j2-admin-dashboard');
  await checkConsole(page, 'J2-login');
  console.log(`  URL: ${page.url()}`);
  
  // 2. Create workspace "Team Alpha"
  console.log('Step 2: Create workspace');
  // Look for workspace settings or creation
  const workspaceNav = await page.$('a:has-text("Workspace"), a[href*="workspace"]');
  if (workspaceNav) {
    await workspaceNav.click();
    await delay(1000);
  }
  await ss(page, 'j2-workspace-page');
  
  const createWsBtn = await page.$('button:has-text("New"), button:has-text("Create"), button:has-text("Add")');
  if (createWsBtn) {
    await createWsBtn.click();
    await delay(1000);
    const wsNameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
    if (wsNameInput) {
      await wsNameInput.fill('Team Alpha');
      const saveBtn = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      if (saveBtn) await saveBtn.click();
      await delay(2000);
    }
  }
  await ss(page, 'j2-workspace-created');
  await checkConsole(page, 'J2-workspace');
  
  // 3. Navigate to Members
  console.log('Step 3: Navigate to Members');
  const membersTab = await page.$('text=Members, text=Team, a[href*="member"]');
  if (membersTab) {
    await membersTab.click();
    await delay(1000);
  }
  await ss(page, 'j2-members');
  await checkConsole(page, 'J2-members');
  
  // 4. Invite a member
  console.log('Step 4: Invite member');
  const inviteBtn = await page.$('button:has-text("Invite"), button:has-text("Add Member")');
  if (inviteBtn) {
    await inviteBtn.click();
    await delay(1000);
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.fill('member@qa.local');
      const sendInvite = await page.$('button[type="submit"], button:has-text("Send"), button:has-text("Invite")');
      if (sendInvite) await sendInvite.click();
      await delay(2000);
    }
  } else {
    console.log('  ⚠️ No invite button found');
  }
  await ss(page, 'j2-invite-sent');
  await checkConsole(page, 'J2-invite');
  
  // 5. Check for invitation link/token
  console.log('Step 5: Check invitation details');
  const bodyText = await page.textContent('body');
  const hasInvitationLink = bodyText.includes('invitation') || bodyText.includes('token') || bodyText.includes('link');
  console.log(`  Has invitation info visible: ${hasInvitationLink}`);
  
  // 6. Try changing role
  console.log('Step 6: Try changing member role');
  const roleSelect = await page.$('select[name*="role"], select[class*="role"]');
  const roleBtn = await page.$('button:has-text("Role"), button:has-text("Change Role")');
  if (roleSelect) {
    console.log('  Found role select dropdown');
    await ss(page, 'j2-role-select');
  } else if (roleBtn) {
    await roleBtn.click();
    await delay(1000);
    await ss(page, 'j2-role-menu');
  } else {
    console.log('  ⚠️ No role management UI found');
  }
  await checkConsole(page, 'J2-roles');
  
  // 7. Permission enforcement
  console.log('Step 7: Check permission enforcement');
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j2-settings-access');
  await checkConsole(page, 'J2-permissions');
  
  await context.close();
  console.log('✅ Journey 2 complete');
}

// ============= USER JOURNEY 3 =============
async function journey3(browser) {
  console.log('\n========== USER JOURNEY 3: Document Management at Scale ==========');
  const context = await browser.newContext();
  const page = await context.newPage();
  setupConsoleCapture(page);

  // 1. Login as admin
  console.log('Step 1: Login as admin');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  const emailField = await page.$('input[name="email"], input[type="email"]');
  const passField = await page.$('input[name="password"], input[type="password"]');
  if (emailField) await emailField.fill('admin@mimotes.com');
  if (passField) await passField.fill('admin123');
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) await loginBtn.click();
  await delay(3000);
  
  // 2-3. Navigate to upload and upload 5 documents
  console.log('Step 2-3: Upload 5 documents');
  await page.goto(BASE + '/documents/upload', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j3-upload-page');
  
  // Create test text files
  const testFiles = [];
  for (let i = 1; i <= 5; i++) {
    const fpath = path.join(SS_DIR, `test-doc-${i}.txt`);
    fs.writeFileSync(fpath, `Test Document ${i}\n\nThis is test document number ${i} for E2E testing of MimoNotes.\n\nContent about topic ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`);
    testFiles.push(fpath);
  }
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(testFiles);
    console.log('  5 test files selected');
    await ss(page, 'j3-files-selected');
    
    const uploadBtn = await page.$('button:has-text("Upload"), button:has-text("Submit"), button[type="submit"]');
    if (uploadBtn) {
      await uploadBtn.click();
      console.log('  Upload submitted');
      await delay(8000);
    }
  } else {
    console.log('  ⚠️ No file input found');
    addBug('HIGH', 'J3', 'Step 3', 'File input not found on upload page');
  }
  await ss(page, 'j3-upload-result');
  await checkConsole(page, 'J3-upload');
  
  // 4. Wait for processing
  console.log('Step 4: Wait for processing');
  await page.goto(BASE + '/documents', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j3-documents-list');
  
  for (let i = 0; i < 8; i++) {
    await delay(5000);
    await page.reload({ waitUntil: 'networkidle' });
  }
  await ss(page, 'j3-documents-after-wait');
  await checkConsole(page, 'J3-processing');
  
  // 5. Create folder
  console.log('Step 5: Check folder creation');
  const folderBtn = await page.$('button:has-text("Folder"), button:has-text("New Folder"), a:has-text("Folder")');
  if (folderBtn) {
    await folderBtn.click();
    await delay(1000);
    await ss(page, 'j3-folder-created');
    console.log('  Folder creation UI found');
  } else {
    console.log('  ⚠️ No folder creation UI found');
    addBug('LOW', 'J3', 'Step 5', 'No folder creation UI available');
  }
  await checkConsole(page, 'J3-folders');
  
  // 6. Move documents to folder
  console.log('Step 6: Check move-to-folder');
  const moveBtn = await page.$('button:has-text("Move"), [aria-label*="move" i]');
  if (moveBtn) {
    console.log('  Move functionality found');
  } else {
    console.log('  ⚠️ No move functionality found');
  }
  
  // 7. Bulk select & delete
  console.log('Step 7: Check bulk operations');
  const checkboxes = await page.$$('input[type="checkbox"]');
  console.log(`  Found ${checkboxes.length} checkboxes`);
  if (checkboxes.length > 1) {
    for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
      await checkboxes[i].check();
    }
    await ss(page, 'j3-bulk-selected');
    
    const deleteBtn = await page.$('button:has-text("Delete"), button:has-text("Remove")');
    if (deleteBtn) {
      console.log('  Bulk delete button found');
      await deleteBtn.click();
      await delay(1000);
      // Confirm deletion if dialog appears
      const confirmBtn = await page.$('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (confirmBtn) {
        await confirmBtn.click();
        await delay(2000);
      }
      await ss(page, 'j3-after-delete');
    } else {
      console.log('  ⚠️ No bulk delete button found');
    }
  }
  await checkConsole(page, 'J3-bulk');
  
  // 8. Search documents
  console.log('Step 8: Search documents');
  const searchInput = await page.$('input[placeholder*="search" i], input[name="search"], input[type="search"]');
  if (searchInput) {
    await searchInput.fill('test');
    await page.keyboard.press('Enter');
    await delay(2000);
    await ss(page, 'j3-search-results');
    console.log('  Search performed');
  } else {
    console.log('  ⚠️ No search input found');
    addBug('LOW', 'J3', 'Step 8', 'No document search feature available');
  }
  await checkConsole(page, 'J3-search');
  
  await context.close();
  console.log('✅ Journey 3 complete');
}

// ============= USER JOURNEY 4 =============
async function journey4(browser) {
  console.log('\n========== USER JOURNEY 4: Settings & Profile ==========');
  const context = await browser.newContext();
  const page = await context.newPage();
  setupConsoleCapture(page);

  // Login as admin
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  const emailField = await page.$('input[name="email"], input[type="email"]');
  const passField = await page.$('input[name="password"], input[type="password"]');
  if (emailField) await emailField.fill('admin@mimotes.com');
  if (passField) await passField.fill('admin123');
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) await loginBtn.click();
  await delay(3000);
  
  // 1. Navigate to Settings
  console.log('Step 1: Navigate to Settings');
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j4-settings-page');
  await checkConsole(page, 'J4-settings');
  
  // 2. Change profile name
  console.log('Step 2: Change profile name');
  const nameInput = await page.$('input[name="name"], input[id="name"], input[placeholder*="name" i]');
  if (nameInput) {
    await nameInput.fill('Admin Updated');
    await ss(page, 'j4-name-changed');
    const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
    if (saveBtn) {
      await saveBtn.click();
      await delay(2000);
    }
  } else {
    console.log('  ⚠️ No name field found on settings page');
  }
  await ss(page, 'j4-settings-saved');
  await checkConsole(page, 'J4-name-change');
  
  // 3. Try password change
  console.log('Step 3: Look for password change');
  const oldPass = await page.$('input[name="oldPassword"], input[placeholder*="current" i], input[placeholder*="old" i]');
  const newPass = await page.$('input[name="newPassword"], input[placeholder*="new" i]');
  if (oldPass && newPass) {
    console.log('  Password change fields found');
    await ss(page, 'j4-password-fields');
  } else {
    console.log('  ⚠️ No password change UI found');
    addBug('LOW', 'J4', 'Step 3', 'No password change UI available in settings');
  }
  
  // 4. Look for API key generation
  console.log('Step 4: Look for API key generation');
  const bodyText = await page.textContent('body');
  const hasApiKey = bodyText.includes('API Key') || bodyText.includes('api key') || bodyText.includes('API key') || bodyText.includes('token');
  console.log(`  API key section found: ${hasApiKey}`);
  if (!hasApiKey) {
    addBug('LOW', 'J4', 'Step 4', 'No API key generation feature found');
  }
  
  // 5. Look for session management
  console.log('Step 5: Look for session management');
  const hasSessionMgmt = bodyText.includes('session') || bodyText.includes('Session') || bodyText.includes('revoke') || bodyText.includes('active session');
  console.log(`  Session management found: ${hasSessionMgmt}`);
  if (!hasSessionMgmt) {
    addBug('LOW', 'J4', 'Step 5', 'No session management UI found');
  }
  
  // Check other settings pages
  const settingsNav = await page.$$('nav a, [role="tab"]');
  for (const nav of settingsNav) {
    const text = await nav.textContent();
    console.log(`  Settings section: ${text.trim()}`);
  }
  
  await ss(page, 'j4-final-settings');
  await checkConsole(page, 'J4-final');
  
  await context.close();
  console.log('✅ Journey 4 complete');
}

// ============= USER JOURNEY 5 =============
async function journey5(browser) {
  console.log('\n========== USER JOURNEY 5: Mobile Viewport Testing ==========');
  // iPhone 14: 375x812
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();
  setupConsoleCapture(page);

  // 1. Landing page
  console.log('Step 1: Mobile landing page');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await ss(page, 'j5-mobile-landing');
  await checkConsole(page, 'J5-mobile-landing');
  
  // Check for overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`  Horizontal overflow: ${hasHorizontalOverflow}`);
  if (hasHorizontalOverflow) {
    addBug('MEDIUM', 'J5', 'Landing Page', 'Horizontal overflow detected on mobile viewport');
  }
  
  // 2. Login
  console.log('Step 2: Mobile login');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await ss(page, 'j5-mobile-login');
  
  const emailField = await page.$('input[name="email"], input[type="email"]');
  const passField = await page.$('input[name="password"], input[type="password"]');
  if (emailField) await emailField.fill('admin@mimotes.com');
  if (passField) await passField.fill('admin123');
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) await loginBtn.click();
  await delay(3000);
  await ss(page, 'j5-mobile-after-login');
  await checkConsole(page, 'J5-mobile-login');
  
  // Check for overflow on dashboard
  const dashOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (dashOverflow) {
    addBug('MEDIUM', 'J5', 'Dashboard', 'Horizontal overflow on mobile dashboard');
  }
  
  // 3. Documents
  console.log('Step 3: Mobile documents');
  await page.goto(BASE + '/documents', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j5-mobile-documents');
  await checkConsole(page, 'J5-mobile-documents');
  
  const docOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (docOverflow) {
    addBug('MEDIUM', 'J5', 'Documents', 'Horizontal overflow on mobile documents page');
  }
  
  // 4. Chat
  console.log('Step 4: Mobile chat');
  await page.goto(BASE + '/chat', { waitUntil: 'networkidle', timeout: 10000 });
  await ss(page, 'j5-mobile-chat');
  await checkConsole(page, 'J5-mobile-chat');
  
  const chatOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (chatOverflow) {
    addBug('MEDIUM', 'J5', 'Chat', 'Horizontal overflow on mobile chat page');
  }
  
  // 5. Check touch targets
  console.log('Step 5: Check touch targets');
  const smallTargets = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button, input, select, textarea');
    let smallCount = 0;
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        smallCount++;
      }
    }
    return { total: elements.length, small: smallCount };
  });
  console.log(`  Touch targets: ${smallTargets.total} total, ${smallTargets.small} below 44px minimum`);
  if (smallTargets.small > 0) {
    addBug('LOW', 'J5', 'Touch Targets', `${smallTargets.small} interactive elements below 44px touch target minimum`);
  }
  
  // Check for text readability
  const textSizeIssues = await page.evaluate(() => {
    const elements = document.querySelectorAll('p, span, a, li, td, th, label, div');
    let smallTextCount = 0;
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      if (size > 0 && size < 12 && el.textContent.trim().length > 0) {
        smallTextCount++;
      }
    }
    return smallTextCount;
  });
  console.log(`  Elements with text < 12px: ${textSizeIssues}`);
  if (textSizeIssues > 5) {
    addBug('LOW', 'J5', 'Text Readability', `${textSizeIssues} elements have text smaller than 12px on mobile`);
  }
  
  await context.close();
  console.log('✅ Journey 5 complete');
}

// ============= MAIN =============
(async () => {
  console.log('🚀 Starting MimoNotes E2E Browser Testing');
  console.log('==========================================\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    await journey1(browser);
  } catch (e) {
    console.log(`❌ Journey 1 error: ${e.message}`);
    allBugs.push({ severity: 'CRITICAL', journey: 'J1', step: 'Runtime', description: `Journey 1 crashed: ${e.message}` });
  }
  
  try {
    await journey2(browser);
  } catch (e) {
    console.log(`❌ Journey 2 error: ${e.message}`);
    allBugs.push({ severity: 'CRITICAL', journey: 'J2', step: 'Runtime', description: `Journey 2 crashed: ${e.message}` });
  }
  
  try {
    await journey3(browser);
  } catch (e) {
    console.log(`❌ Journey 3 error: ${e.message}`);
    allBugs.push({ severity: 'CRITICAL', journey: 'J3', step: 'Runtime', description: `Journey 3 crashed: ${e.message}` });
  }
  
  try {
    await journey4(browser);
  } catch (e) {
    console.log(`❌ Journey 4 error: ${e.message}`);
    allBugs.push({ severity: 'CRITICAL', journey: 'J4', step: 'Runtime', description: `Journey 4 crashed: ${e.message}` });
  }
  
  try {
    await journey5(browser);
  } catch (e) {
    console.log(`❌ Journey 5 error: ${e.message}`);
    allBugs.push({ severity: 'CRITICAL', journey: 'J5', step: 'Runtime', description: `Journey 5 crashed: ${e.message}` });
  }
  
  await browser.close();
  
  // Write results
  console.log('\n========== RESULTS ==========');
  console.log(`Total console errors: ${allConsoleErrors.length}`);
  console.log(`Total bugs found: ${allBugs.length}`);
  
  fs.writeFileSync(path.join(__dirname, 'e2e-console-errors.json'), JSON.stringify(allConsoleErrors, null, 2));
  fs.writeFileSync(path.join(__dirname, 'e2e-bugs.json'), JSON.stringify(allBugs, null, 2));
  fs.writeFileSync(path.join(__dirname, 'e2e-screenshots', 'manifest.json'), JSON.stringify(fs.readdirSync(SS_DIR).filter(f => f.endsWith('.png')), null, 2));
  
  console.log('\n✅ E2E testing complete!');
  console.log('Files written: e2e-console-errors.json, e2e-bugs.json, e2e-screenshots/manifest.json');
})();
