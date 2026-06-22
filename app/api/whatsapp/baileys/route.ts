const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.BAILEYS_PORT || 3002;
const BAILEYS_URL = process.env.BAILEYS_URL || 'http://localhost:3002';
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || 'baileys-secret-key';

// ============================================================
// Proxy to Baileys service
// ============================================================

// Health check
app.get('/api/whatsapp/baileys/health', async (req, res) => {
  try {
    const response = await fetch(`${BAILEYS_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Baileys service unavailable' });
  }
});

// Get QR code
app.get('/api/whatsapp/baileys/qr', async (req, res) => {
  try {
    const response = await fetch(`${BAILEYS_URL}/qr`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Baileys service unavailable' });
  }
});

// Get status
app.get('/api/whatsapp/baileys/status', async (req, res) => {
  try {
    const response = await fetch(`${BAILEYS_URL}/status`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Baileys service unavailable' });
  }
});

// Send message
app.post('/api/whatsapp/baileys/send', async (req, res) => {
  try {
    const response = await fetch(`${BAILEYS_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': BAILEYS_API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Baileys service unavailable' });
  }
});

// Get messages
app.get('/api/whatsapp/baileys/messages', async (req, res) => {
  try {
    const response = await fetch(`${BAILEYS_URL}/messages?limit=${req.query.limit || 50}`, {
      headers: { 'apiKey': BAILEYS_API_KEY },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Baileys service unavailable' });
  }
});

// Logout
app.post('/api/whatsapp/baileys/logout', async (req, res) => {
  try {
    const response = await fetch(`${BAILEYS_URL}/logout`, {
      method: 'POST',
      headers: { 'apiKey': BAILEYS_API_KEY },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Baileys service unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`[Baileys API] Proxy running on port ${PORT}`);
});
