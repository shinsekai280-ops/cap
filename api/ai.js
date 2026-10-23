import { userFromReq } from './_lib/supa.js';
import { callClaude } from './_lib/claude.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const user = await userFromReq(req);
  if (!user) return res.status(401).json({ error: 'auth' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (JSON.stringify(body).length > 200000) return res.status(413).json({ error: 'too_large' });
  const { kind, input, tier, system } = body;
  try {
    const result = await callClaude({ kind: kind === 'json' ? 'json' : 'text', input, tier: tier === 'quick' ? 'quick' : 'default', system });
    res.status(200).json({ result });
  } catch (e) {
    console.error(e.message);
    res.status(e.code === 'no_key' ? 500 : 502).json({ error: e.code || 'upstream' });
  }
}
