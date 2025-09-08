
// api/realtime-sdp.js
import fetch from 'node-fetch';

export const config = { runtime: 'nodejs20.x' };

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'missing_ephemeral_bearer' });

  const model = (req.query?.model) || process.env.REALTIME_MODEL || 'gpt-realtime';
  const offerSDP = await readRawBody(req); // خام؛ نه JSON

  try {
    const r = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/sdp' },
      body: offerSDP, // ⚠️ خام، بدون JSON
    });

    const answerSDP = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/sdp').send(answerSDP);
  } catch (e) {
    res.status(500).json({ error: 'sdp_proxy_failed', detail: String(e) });
  }
}
