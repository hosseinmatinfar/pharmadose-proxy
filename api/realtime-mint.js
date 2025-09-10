export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Check if API key exists
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found in environment variables');
    return res.status(500).json({ 
      error: 'server_config_error', 
      detail: 'API key not configured' 
    });
  }

  try {
    console.log('Creating ephemeral session...');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const requestBody = {
      model: req.body?.model || 'gpt-4o-realtime-preview-2024-12-17',
      voice: req.body?.voice || 'alloy',
    };
    
    // اضافه کردن modalities و session config
    if (req.body?.modalities) {
      requestBody.modalities = req.body.modalities;
    }
    
    console.log('Request body to OpenAI:', JSON.stringify(requestBody));

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
        'User-Agent': 'PharmaDose-Proxy/1.0'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('OpenAI response body:', responseText);

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, responseText);
      return res.status(response.status).json({
        error: 'openai_api_error',
        detail: responseText,
        status: response.status,
        openai_headers: Object.fromEntries(response.headers.entries())
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return res.status(500).json({
        error: 'parse_error',
        detail: 'Failed to parse OpenAI response',
        raw_response: responseText
      });
    }
    
    // Validate response structure
    if (!data.client_secret?.value) {
      console.error('Invalid response structure:', data);
      return res.status(500).json({
        error: 'invalid_response_structure',
        detail: 'Missing client_secret.value in response',
        response: data
      });
    }

    console.log('Session created successfully, expires:', data.client_secret.expires_at);
    
    // Response موفق
    res.status(200).json({
      value: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
      session_id: data.id,
      model: data.model,
      voice: data.voice,
      // اضافه کردن اطلاعات اضافی برای debug
      debug: {
        created_at: new Date().toISOString(),
        proxy_version: '1.0'
      }
    });

  } catch (error) {
    console.error('Error creating ephemeral session:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'mint_failed', 
      detail: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}
