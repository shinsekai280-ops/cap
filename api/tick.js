// Appelé toutes les 5 min par Supabase (pg_cron). Envoie les rappels du jour (sans IA).
import * as C from '../lib/shared.js';
import { admin } from './_lib/supa.js';
import { sendToUser } from './_lib/push.js';

// Date dont les champs "locaux" valent l'heure de Paris
const parisNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
const at = (day, time) => { const d = C.pk(day); const [h, m] = time.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
const WINDOW = 90; // minutes pendant lesquelles un rappel manqué peut encore partir

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers['x-cron-secret'] !== secret && req.query?.secret !== secret)) return res.status(401).json({ error: 'unauthorized' });
  C.setNow(parisNow);
  const sb = admin();
  const { data: rows, error } = await sb.from('cap_state').select('user_id,data');
  if (error) return res.status(500).json({ error: error.message });
  const out = [];
  for (const row of rows || []) {
    try { out.push(await processUser(sb, row)); } catch (e) { console.error(e); out.push({ user: row.user_id, error: e.message }); }
  }
  await sb.from('cap_sent').delete().lt('sent_at', new Date(Date.now() - 8 * 864e5).toISOString());
  res.status(200).json({ ok: true, time: C.hm(), out });
}

export function dueMessages(S, sent) {
  const set = S.settings, N = C.now(), t = C.dkey(), D = S.days[t] || {};
  const inWindow = (time) => { if (!time) return false; const diff = (N - at(t, time)) / 60000; return diff >= 0 && diff < WINDOW; };
  const msgs = [];
  const plan = C.planFor(S, t);

  // 1. Matin : la journée prévue
  if (set.notif.morning && inWindow(set.morning) && !sent.has('morning:' + t)) {
    const n = S.routines.length + S.projects.reduce((a, p) => a + C.tasksFor(p, t, t).filter((x) => !x.done).length, 0);
    const lines = ['Règle d’or : 1 page de Coran'];
    if (plan.pratique) lines.push(`Pratique ${set.pratique} : ${plan.pratique.name}`);
    if (plan.video) lines.push(`Vidéo ${set.video} : ${plan.video.name}`);
    lines.push(`${n} tâche${n > 1 ? 's' : ''} pour tes projets`);
    msgs.push({ key: 'morning:' + t, title: 'Ta journée', body: lines.join('\n'), url: '/' });
  }

  if (set.notif.tasks) {
    // 2. Tâches quotidiennes (posts DYCOM, checks…)
    for (const r of S.routines) {
      if (!r.time || (D.routines || []).includes(r.id)) continue;
      const key = `routine:${r.id}:${t}`;
      if (inWindow(r.time) && !sent.has(key)) msgs.push({ key, title: C.proj(S, r.projectId)?.name || 'Rappel', body: r.title, url: '/' });
    }
    // 3. Tâches datées avec une heure
    for (const { p, t: x } of C.allTasks(S)) {
      if (x.done || x.due !== t || !x.time) continue;
      const key = `task:${x.id}:${t}T${x.time}`;
      if (inWindow(x.time) && !sent.has(key)) msgs.push({ key, title: p.name, body: x.title, url: '/' });
    }
  }

  // 4. Évoluer : pratique et vidéo du jour
  if (set.notif.evolve) {
    for (const kind of ['pratique', 'video']) {
      const th = plan[kind]; if (!th || D.evolve?.[kind]) continue;
      const key = `${kind}:${t}`;
      if (inWindow(set[kind]) && !sent.has(key)) msgs.push({ key, title: kind === 'pratique' ? `Pratique : ${th.name}` : `Vidéo : ${th.name}`, body: kind === 'pratique' ? 'C’est l’heure de ta session.' : 'Regarde ou écoute une vidéo et note ce que tu retiens.', url: '/' });
    }
  }

  // 5. Soir : bilan + règle d'or si pas validée
  if (set.notif.evening && inWindow(set.evening) && !sent.has('evening:' + t) && !D.bilan) {
    msgs.push({ key: 'evening:' + t, title: D.coran ? 'Bilan du soir 🌙' : 'Ta page de Coran 🌙', body: D.coran ? 'Fais le point sur ta journée en 1 minute.' : 'Tu n’as pas encore validé ta règle d’or : 1 page de Coran.', url: '/?v=bilan' });
  }
  return msgs;
}

async function processUser(sb, row) {
  const uid = row.user_id;
  const { count } = await sb.from('cap_push').select('endpoint', { count: 'exact', head: true }).eq('user_id', uid);
  if (!count) return { user: uid, skipped: 'aucun appareil abonné' };
  const S = C.migrate(row.data);
  const { data: sentRows } = await sb.from('cap_sent').select('key').eq('user_id', uid);
  const msgs = dueMessages(S, new Set((sentRows || []).map((r) => r.key)));
  for (const m of msgs) {
    await sendToUser(sb, uid, { title: m.title, body: m.body, url: m.url, tag: m.key });
    await sb.from('cap_sent').upsert({ user_id: uid, key: m.key });
  }
  return { user: uid, sent: msgs.map((m) => m.key) };
}
