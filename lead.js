// api/lead.js — Vercel Serverless Function
// Замінює весь server.js — запускається автоматично на Vercel

const https = require('https');

const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;

// Простий rate-limit через Map (живе між викликами у тому ж інстансі)
const rateMap = new Map();

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id:    TELEGRAM_USER_ID,
      text,
      parse_mode: 'HTML',
    });

    const options = {
      hostname: 'api.telegram.org',
      path:     `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from Telegram')); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 5 req / 60s per IP
  const ip  = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();
  const rec = rateMap.get(ip) || { count: 0, start: now };
  if (now - rec.start > 60_000) { rec.count = 0; rec.start = now; }
  rec.count++;
  rateMap.set(ip, rec);
  if (rec.count > 5) return res.status(429).json({ error: 'Too many requests' });

  const { name, contact, message, hp } = req.body || {};

  // Honeypot
  if (hp) return res.status(200).json({ success: true });

  // Validation
  if (!name?.trim() || name.trim().length < 2)
    return res.status(400).json({ error: 'Invalid name' });
  if (!contact?.trim() || contact.trim().length < 3)
    return res.status(400).json({ error: 'Invalid contact' });

  if (!TELEGRAM_TOKEN || !TELEGRAM_USER_ID) {
    console.error('Missing TELEGRAM_TOKEN or TELEGRAM_USER_ID env vars');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const text =
    `📩 <b>Нова заявка — telegrambot.studio</b>\n\n` +
    `👤 <b>Ім'я:</b> ${escHtml(name.trim())}\n` +
    `📞 <b>Контакт:</b> ${escHtml(contact.trim())}\n` +
    `💬 <b>Повідомлення:</b> ${escHtml((message || '—').slice(0, 1000))}\n\n` +
    `🕐 ${new Date().toUTCString()}`;

  try {
    const result = await sendTelegram(text);
    if (!result.ok) throw new Error(result.description);
    console.log(`Lead: ${name.trim()} / ${contact.trim()}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram error:', err.message);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
};
