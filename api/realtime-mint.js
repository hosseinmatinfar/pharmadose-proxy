export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'server_config_error', detail: 'API key not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const requestBody = {
      model: body.model || 'gpt-4o-realtime-preview-2024-12-17',
      voice: body.voice || 'alloy',
    };

    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
        'User-Agent': 'PharmaDose-Proxy/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).json({ error: 'openai_api_error', detail: text, status: r.status });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ error: 'parse_error', raw_response: text }); }

    if (!data?.client_secret?.value) {
      return res.status(500).json({ error: 'invalid_response_structure', response: data });
    }

    return res.status(200).json({
      value: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
      session_id: data.id,
      model: data.model,
      voice: data.voice,
      debug: { created_at: new Date().toISOString(), proxy_version: '1.0' }
    });
  } catch (err) {
    return res.status(500).json({ error: 'mint_failed', detail: err.message || String(err) });
  }
}
