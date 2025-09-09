module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body || {})
    });
    
    if (!r.ok) {
      return res.status(r.status).json({ error: 'speech_api_error', detail: await r.text() });
    }
    
    // Set correct headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    
    // Stream the audio response
    const buffer = await r.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
    
  } catch (e) {
    res.status(500).json({ error: 'speech_failed', detail: String(e) });
  }
};
