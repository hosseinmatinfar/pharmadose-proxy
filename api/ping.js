export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // چک کردن که OpenAI API key موجود باشه
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    // اختیاری: تست کردن اتصال به OpenAI
    let openaiStatus = 'unknown';
    if (hasApiKey) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        });
        openaiStatus = testResponse.ok ? 'connected' : 'error';
      } catch {
        openaiStatus = 'connection_failed';
      }
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      proxy_version: '1.0',
      has_openai_key: hasApiKey,
      openai_status: openaiStatus,
      endpoints: {
        mint: '/api/realtime-mint',
        sdp: '/api/realtime-sdp',
        ping: '/api/ping'
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
