const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
const app = express();
const config = require('../bot/config.json');

let db;
try { db = new Database(path.join(__dirname, '../db-setup/personnes.db'), { readonly: true }); console.log('✅ DB connectée'); }
catch (e) { console.warn('⚠️ DB non trouvée'); }

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats', (req, res) => {
  let dbCount = 0;
  if (db) try { dbCount = db.prepare('SELECT COUNT(*) as c FROM personnes').get().c; } catch(e){}
  res.json({ dbCount, status: 'online', version: '3.0' });
});

app.post('/api/search', (req, res) => {
  const { query, limit = 20, offset = 0 } = req.body;
  if (!query || query.length < 2) return res.json({ results: [], total: 0 });
  if (!db) return res.json({ results: [], total: 0, error: 'DB non configurée' });
  try {
    const q = `%${query}%`;
    const p = Array(11).fill(q);
    const where = `WHERE fullname LIKE ? OR firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ? OR city LIKE ? OR postal_code LIKE ? OR country LIKE ? OR username LIKE ? OR organisme LIKE ?`;
    const results = db.prepare(`SELECT * FROM personnes ${where} LIMIT ? OFFSET ?`).all(...p, limit, offset);
    const total   = db.prepare(`SELECT COUNT(*) as c FROM personnes ${where}`).get(...p).c;
    res.json({ results, total });
  } catch(e) { res.json({ results: [], total: 0, error: e.message }); }
});

app.post('/api/ai-search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.json({ result: 'Requête vide' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 900,
        system: `Tu es un expert OSINT. Analyse la requête et fournis: 1) Type de cible 2) Outils OSINT adaptés avec URLs 3) Stratégie étape par étape 4) Rappel éthique. Français, structuré, emojis.`,
        messages: [{ role: 'user', content: `Requête OSINT: "${query}"` }],
      }),
    });
    const data = await r.json();
    res.json({ result: data.content?.[0]?.text || 'Erreur API' });
  } catch(e) { res.json({ result: `❌ Erreur: ${e.message}` }); }
});

const PORT = config.dashboardPort || 3000;
app.listen(PORT, () => console.log(`✅ Dashboard: http://localhost:${PORT}`));
