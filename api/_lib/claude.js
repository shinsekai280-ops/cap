import { parseJSON } from '../../lib/shared.js';

const MODELS = {
  quick: process.env.ANTHROPIC_MODEL_QUICK || 'claude-haiku-5-5',
  default: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
};

// Fusionne les tours consécutifs du même rôle (l'API exige l'alternance)
function normalize(input) {
  const list = typeof input === 'string' ? [{ role: 'user', content: input }] : Array.isArray(input) ? input : [];
  const out = [];
  for (const m of list) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const content = String(m.content || '').trim();
    if (!content) continue;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n\n' + content;
    else out.push({ role, content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

export async function callClaude({ kind = 'text', input, tier = 'default', system }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { const e = new Error('no_key'); e.code = 'no_key'; throw e; }
  const messages = normalize(input);
  if (!messages.length || messages[messages.length - 1].role !== 'user') { const e = new Error('bad_input'); e.code = 'bad_input'; throw e; }
  const sys = [system, kind === 'json' ? 'Réponds uniquement avec du JSON valide, sans aucun texte autour.' : ''].filter(Boolean).join('\n\n') || undefined;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELS[tier] || MODELS.default, max_tokens: kind === 'json' ? 1500 : 900, system: sys, messages }),
  });
  if (!r.ok) {
    const t = await r.text();
    const e = new Error(`anthropic ${r.status}: ${t.slice(0, 300)}`);
    e.code = r.status === 401 ? 'bad_key' : r.status === 429 ? 'rate_limited' : r.status === 400 && /credit/i.test(t) ? 'no_credit' : 'upstream';
    throw e;
  }
  const j = await r.json();
  const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
  if (kind === 'json') { try { return parseJSON(text); } catch { const e = new Error('invalid_json'); e.code = 'invalid_json'; throw e; } }
  return text;
}
