export const runtime = 'nodejs';

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    },
  });
}

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server_config_error', detail: 'API key not configured' }), { status: 500, headers });
  }

  try {
    const body = await request.json().catch(() => ({}));
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
      return new Response(JSON.stringify({ error: 'openai_api_error', detail: text, status: r.status }), { status: r.status, headers });
    }

    const data = JSON.parse(text);
    if (!data?.client_secret?.value) {
      return new Response(JSON.stringify({ error: 'invalid_response_structure', response: data }), { status: 500, headers });
    }

    return new Response(JSON.stringify({
      value: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
      session_id: data.id,
      model: data.model,
      voice: data.voice,
      debug: { created_at: new Date().toISOString(), proxy_version: '1.0' }
    }), { status: 200, headers });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'mint_failed', detail: err?.message || String(err) }), { status: 500, headers });
  }
}
