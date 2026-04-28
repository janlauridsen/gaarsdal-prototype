// pages/api/hit.js
// Logs a page hit to Upstash Redis
// Called from public/sommerhus/index.html on page load
//
// Required env vars (set in Vercel dashboard):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return res.status(500).json({ error: 'Redis not configured' });
    }

    const hit = {
      ts:        new Date().toISOString(),
      ip:        req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
      ref:       req.headers['referer'] || '',
      ua:        req.headers['user-agent'] || '',
      page:      req.query.page || 'sommerhus',
    };

    const r = (cmd) => fetch(`${url}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    }).then(r => r.json());

    await Promise.all([
      r(['INCR', 'sommerhus:hits:total']),
      r(['LPUSH', 'sommerhus:hits:log', JSON.stringify(hit)]),
      r(['LTRIM', 'sommerhus:hits:log', 0, 499]),   // keep last 500
      r(['INCR', `sommerhus:hits:day:${hit.ts.slice(0,10)}`]),
    ]);

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
