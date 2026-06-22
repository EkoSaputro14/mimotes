const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { AntiBan } = require('baileys-antiban');
const pino = require('pino');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ============================================================
// Configuration
// ============================================================
const PORT = process.env.BAILEYS_PORT || 3002;
const SESSION_DIR = process.env.BAILEYS_SESSION_DIR || './baileys-session';
const MIMOTES_API_URL = process.env.MIMOTES_API_URL || 'http://mimotes-app-1:3000';
const WORKSPACE_ID = process.env.BAILEYS_WORKSPACE_ID || '';
const API_KEY = process.env.BAILEYS_API_KEY || 'baileys-secret-key';

// ============================================================
// Express App
// ============================================================
const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// Baileys Setup
// ============================================================
let sock = null;
let antiBan = null;
let qrCode = null;
let connectionStatus = 'disconnected';
let messageHistory = [];

// Anti-ban configuration (moderate preset + custom)
const ANTI_BAN_CONFIG = {
  preset: 'moderate',
  // Rate limiting
  minDelay: 2000,      // Minimum delay between messages (2s)
  maxDelay: 8000,      // Maximum delay between messages (8s)
  // Warmup
  warmupDays: 7,       // 7-day warmup period
  warmupMessagesPerDay: 50,  // Start with 50 messages/day
  // Human behavior
  typingSimulation: true,
  readReceiptDelay: [1000, 5000],  // 1-5s delay before read receipt
  presenceInterval: [30000, 120000],  // 30s-2min presence updates
  // Contact safety
  maxNewContactsPerHour: 10,
  minReplyRatio: 0.15,  // At least 15% reply ratio
  strangerDelayMultiplier: 2.5,  // 2.5x delay for new contacts
};

// ============================================================
// Initialize Baileys
// ============================================================
async function initBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  // Initialize anti-ban
  antiBan = new AntiBan(ANTI_BAN_CONFIG.preset);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    // Browser config to look like real device
    browser: ['Mimotes Bot', 'Chrome', '120.0.0.0'],
    // Generate random device ID
    generateHighQualityLinkPreview: false,
  });

  // Wrap with anti-ban
  if (antiBan && antiBan.wrapSocket) {
    antiBan.wrapSocket(sock);
  }

  // ============================================================
  // Event Handlers
  // ============================================================
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = 'waiting_qr';
      console.log('[Baileys] QR Code received - scan with WhatsApp');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[Baileys] Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);
      
      if (statusCode === DisconnectReason.loggedOut) {
        connectionStatus = 'logged_out';
        qrCode = null;
        // Clean session
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true });
        }
      } else if (shouldReconnect) {
        connectionStatus = 'reconnecting';
        setTimeout(initBaileys, 5000);
      }
    }

    if (connection === 'open') {
      connectionStatus = 'connected';
      qrCode = null;
      console.log('[Baileys] Connected to WhatsApp!');
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Skip own messages
      if (msg.key.fromMe) continue;

      // Skip status messages
      if (msg.key.remoteJid === 'status@broadcast') continue;

      const from = msg.key.remoteJid;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

      if (!text) continue;

      console.log(`[Baileys] Message from ${from}: ${text.substring(0, 50)}...`);

      // Store message
      messageHistory.push({
        from,
        text,
        timestamp: new Date().toISOString(),
        type: 'incoming',
      });

      // Forward to Mimotes API
      try {
        const response = await fetch(`${MIMOTES_API_URL}/api/whatsapp/n8n`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            phone: from.replace('@s.whatsapp.net', ''),
            workspaceId: WORKSPACE_ID,
          }),
        });

        const data = await response.json();
        if (data.response) {
          // Send reply with anti-ban delays
          await sendWithDelay(from, data.response);
        }
      } catch (error) {
        console.error('[Baileys] Error processing message:', error.message);
      }
    }
  });
}

// ============================================================
// Send message with anti-ban delay
// ============================================================
async function sendWithDelay(to, text) {
  if (!sock) throw new Error('Not connected');

  // Simulate typing
  if (ANTI_BAN_CONFIG.typingSimulation) {
    await sock.sendPresenceUpdate('composing', to);
    const typingDelay = Math.min(text.length * 50, 5000); // 50ms per char, max 5s
    await sleep(typingDelay);
    await sock.sendPresenceUpdate('paused', to);
  }

  // Send message
  const result = await sock.sendMessage(to, { text });

  // Anti-ban delay before next message
  const delay = ANTI_BAN_CONFIG.minDelay + 
    Math.random() * (ANTI_BAN_CONFIG.maxDelay - ANTI_BAN_CONFIG.minDelay);
  await sleep(delay);

  return result;
}

// ============================================================
// Helper: Sleep
// ============================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// API Routes
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connection: connectionStatus,
    hasQR: !!qrCode,
    uptime: process.uptime(),
  });
});

// Get QR code
app.get('/qr', (req, res) => {
  if (!qrCode) {
    return res.json({ qr: null, status: connectionStatus });
  }
  res.json({ qr: qrCode, status: connectionStatus });
});

// Get connection status
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    hasQR: !!qrCode,
    uptime: process.uptime(),
  });
});

// Send message
app.post('/send', async (req, res) => {
  const { apiKey } = req.headers;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'to and message are required' });
  }

  try {
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    const result = await sendWithDelay(jid, message);
    res.json({ success: true, messageId: result.key.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get message history
app.get('/messages', (req, res) => {
  const { apiKey } = req.headers;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const limit = parseInt(req.query.limit) || 50;
  res.json({
    messages: messageHistory.slice(-limit),
    total: messageHistory.length,
  });
});

// Logout
app.post('/logout', async (req, res) => {
  const { apiKey } = req.headers;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  try {
    if (sock) {
      await sock.logout();
    }
    connectionStatus = 'logged_out';
    qrCode = null;
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Start
// ============================================================
app.listen(PORT, () => {
  console.log(`[Baileys] Server running on port ${PORT}`);
  console.log(`[Baileys] Anti-ban: ${ANTI_BAN_CONFIG.preset} preset`);
  console.log(`[Baileys] Mimotes API: ${MIMOTES_API_URL}`);
  initBaileys().catch(console.error);
});
