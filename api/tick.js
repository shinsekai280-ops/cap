// Appelé toutes les 5 min par Supabase (pg_cron). Envoie les notifs du jour.
import * as C from '../lib/shared.js';
import { admin } from './_lib/supa.js';
import { sendToUser } from './_lib/push.js';
import { callClaude } from './_lib/claude.js';

// Date dont les champs "locaux" valent l'heure de Paris
const parisNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
const at = (day, time) => { const d = C.pk(day); const [h, m] = time.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers['x-cron-secret'] !== secret && req.query?.secret !== secret)) return res.status(401).json({ error: 'unauthorized' });
  C.setNow(parisNow);
  const sb = admin();
  const { data: rows, error } = await sb.from('cap_state').select('user_id,data,updated_at');
  if (error) return res.status(500).json({ error: error.message });
  const out = [];
  for (const row of rows || []) {
    try { out.push(await processUser(sb, row)); } catch (e) { console.error(e); out.push({ user: row.user_id, error: e.message }); }
  }
  await sb.from('cap_sent').delete().lt('sent_at', new Date(Date.now() - 8 * 864e5).toISOString());
  res.status(200).json({ ok: true, time: C.hm(), out });
}

export async function processUser(sb, row) {
  const uid = row.user_id;
  const { count } = await sb.from('cap_push').select('endpoint', { count: 'exact', head: true }).eq('user_id', uid);
  if (!count) return { user: uid, skipped: 'aucun appareil abonné' };

  const S = C.migrate(row.data);
  const set = S.settings, N = C.now(), t = C.dkey(), clock = C.hm();
  const { data: sentRows } = await sb.from('cap_sent').select('key').eq('user_id', uid);
  const sent = new Set((sentRows || []).map((r) => r.key));
  const msgs = [];
  let changed = false;
  const D = S.days[t] || {};

  // 1. Plan du matin (entre l'heure choisie et midi)
  if (set.notif.morning && clock >= set.morning && clock < '12:00' && !sent.has('morning:' + t)) {
    if (!D.plan?.priorities?.length && process.env.ANTHROPIC_API_KEY) {
      try {
        const r = await callClaude({ kind: 'json', input: C.planPrompt(S), tier: 'default' });
        S.days[t] = { ...(S.days[t] || {}), plan: C.cleanPlan(r, S) };
        changed = true;
      } catch (e) { console.warn('plan', e.message); }
    }
    const pr = S.days[t]?.plan?.priorities || [];
    msgs.push({ key: 'morning:' + t, title: 'Ton plan du jour', body: pr.length ? pr.map((p, i) => `${i + 1}. ${p.text}`).join('\n') : 'Ouvre CAP et fais ton plan du jour.', url: '/?v=today' });
  }

  // 2. Rappels de tâches (à l'heure choisie, pendant 90 min max)
  if (set.notif.tasks) {
    for (const { p, t: x } of C.allTasks(S)) {
      if (x.done || !x.due || !x.time) continue;
      const diff = (N - at(x.due, x.time)) / 60000;
      const key = `task:${x.id}:${x.due}T${x.time}`;
      if (diff >= 0 && diff < 90 && !sent.has(key)) msgs.push({ key, title: `Rappel · ${p.name}`, body: x.title, url: '/?v=today' });
    }
  }

  // 3. Relance si un projet ou un parcours stagne (vers midi, 1 jour sur 2 max)
  if (set.notif.stale && clock >= '12:30' && clock < '20:00' && !sent.has('stale:' + t) && !sent.has('stale:' + C.addDays(t, -1))) {
    const lines = [];
    S.projects.forEach((p) => { if (p.lastAt && p.tasks.some((x) => !x.done) && C.daysBetween(p.lastAt, t) >= 3) lines.push(`${p.name} : rien depuis ${C.daysBetween(p.lastAt, t)} jours`); });
    S.parcours.forEach((p) => { const l = C.lastLog(p); if (l && C.daysBetween(l, t) >= 3) lines.push(`${p.name} : dernier point ${C.rel(l)}`); });
    if (lines.length) msgs.push({ key: 'stale:' + t, title: 'Ça stagne', body: lines.slice(0, 3).join('\n'), url: '/?v=coach' });
  }

  // 4. Bilan du soir
  if (set.notif.evening && clock >= set.evening && !sent.has('evening:' + t) && !S.days[t]?.bilan) {
    const pod = S.podcasts.some((x) => x.date === t);
    msgs.push({ key: 'evening:' + t, title: 'Bilan du soir 🌙', body: 'Fais le point sur ta journée en 1 minute.' + (pod ? '' : '\nEt ton podcast du jour ?'), url: '/?v=bilan' });
  }

  for (const m of msgs) {
    await sendToUser(sb, uid, { title: m.title, body: m.body, url: m.url, tag: m.key });
    await sb.from('cap_sent').upsert({ user_id: uid, key: m.key });
  }

  // Enregistre le plan généré, sauf si l'app a écrit entre-temps
  if (changed) {
    await sb.from('cap_state').update({ data: S, updated_at: new Date().toISOString() }).eq('user_id', uid).eq('updated_at', row.updated_at);
  }
  return { user: uid, sent: msgs.map((m) => m.key) };
}
