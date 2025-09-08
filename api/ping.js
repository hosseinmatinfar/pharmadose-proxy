// api/ping.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({ ok: true, time: Date.now() });
};
