// server.js — BotForge Lead Backend
// Run: node server.js
// Requires: npm install express axios cors dotenv

import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Rate-limit map (simple in-memory) ───
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60_000; // 1 min
const MAX_REQUESTS   = 5;

function rateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - record.start > RATE_WINDOW_MS) {
    record.count = 0;
    record.start = now;
  }
  record.count++;
  rateLimitMap.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  }
  next();
}

// ─── Middleware ───
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["POST"],
}));
app.use(express.json({ limit: "10kb" }));

// ─── Health check ───
app.get("/", (_req, res) => res.json({ status: "BotForge backend running ✓" }));

// ─── Lead endpoint ───
app.post("/api/lead", rateLimit, async (req, res) => {
  const { name, contact, message, hp } = req.body;

  // Honeypot check
  if (hp) {
    return res.json({ success: true }); // Silent fail for bots
  }

  // Validation
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Invalid name" });
  }
  if (!contact || typeof contact !== "string" || contact.trim().length < 3) {
    return res.status(400).json({ error: "Invalid contact" });
  }

  const safeMessage = (message || "—").toString().slice(0, 1000);

  const text = `📩 <b>New Lead — BotForge</b>\n\n` +
    `👤 <b>Name:</b> ${escHtml(name.trim())}\n` +
    `📞 <b>Contact:</b> ${escHtml(contact.trim())}\n` +
    `💬 <b>Message:</b> ${escHtml(safeMessage)}\n\n` +
    `🕐 ${new Date().toUTCString()}`;

  const TELEGRAM_TOKEN  = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;

  if (!TELEGRAM_TOKEN || !TELEGRAM_USER_ID) {
    console.error("Missing TELEGRAM_TOKEN or TELEGRAM_USER_ID in .env");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_USER_ID,
        text,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "💬 Reply in Telegram", url: `https://t.me/${contact.trim().replace("@", "")}` }
          ]]
        }
      },
      { timeout: 8000 }
    );

    console.log(`[${new Date().toISOString()}] Lead received: ${name.trim()} / ${contact.trim()}`);
    return res.json({ success: true });

  } catch (err) {
    const telegramErr = err.response?.data?.description || err.message;
    console.error("Telegram API error:", telegramErr);
    return res.status(500).json({ error: "Failed to send notification" });
  }
});

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

app.listen(PORT, () => {
  console.log(`✅ BotForge backend running on http://localhost:${PORT}`);
});
