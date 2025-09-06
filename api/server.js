// api/server.js (Vercel Serverless Function)
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS مینیمال
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { path, body, headers } = req.body || {};
    // مثال: پروکسی OpenAI
    const resp = await fetch(`https://api.openai.com${path}`, {
      method: req.method === 'GET' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...(headers || {})
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(body || {})
    });
    const data = await resp.text(); // هم JSON هم استریم هندل می‌شود
    res.status(resp.status).send(data);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: e?.message });
  }
}
