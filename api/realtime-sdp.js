async function rawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const auth = req.headers['authorization'];
  if (!auth) {
    return res.status(401).json({ error: 'missing_ephemeral_bearer' });
  }

  const model = req.query?.model || process.env.REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
  
  try {
    const offerSDP = await rawBody(req);
    console.log('Proxying SDP offer, length:', offerSDP.length);
    
    const response = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: { 
        'Authorization': auth, 
        'Content-Type': 'application/sdp',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: offerSDP
    });
    
    const answer = await response.text();
    console.log('SDP response status:', response.status);
    
    res.status(response.status)
       .setHeader('Content-Type', 'application/sdp')
       .send(answer);
       
  } catch (error) {
    console.error('SDP proxy error:', error);
    res.status(500).json({ 
      error: 'sdp_proxy_failed', 
      detail: error.message || String(error) 
    });
  }
}
