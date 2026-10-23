// Code partagé entre l'app (navigateur) et le serveur (Vercel).
// Toutes les dates passent par now() : le serveur la règle sur l'heure de Paris.

let nowFn = () => new Date();
export const setNow = (f) => { nowFn = f; };
export const now = () => nowFn();

export const z = (n) => String(n).padStart(2, '0');
export const dkey = (d = now()) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
export const pk = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = pk(k); d.setDate(d.getDate() + n); return dkey(d); };
export const frDate = (k, o = { weekday: 'long', day: 'numeric', month: 'long' }) => pk(k).toLocaleDateString('fr-FR', o);
export const daysBetween = (a, b) => Math.round((pk(b) - pk(a)) / 864e5);
export const rid = () => Math.random().toString(36).slice(2, 9);
export const hm = (d = now()) => `${z(d.getHours())}:${z(d.getMinutes())}`;
export const weekday = (k) => pk(k).getDay(); // 0 = dimanche
export function rel(k) {
  if (!k) return 'jamais';
  const n = daysBetween(k, dkey());
  return n <= 0 ? "aujourd'hui" : n === 1 ? 'hier' : n === 2 ? 'avant-hier' : `il y a ${n} jours`;
}
// Lundi de la semaine d'une date
export const monday = (k) => addDays(k, -((weekday(k) + 6) % 7));

export const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const st = (a) => a.map((t) => ({ t, done: false }));

export const defaultSettings = () => ({
  morning: '08:00', evening: '21:00', pratique: '15:00', video: '19:00',
  notif: { morning: true, tasks: true, evolve: true, evening: true, rdv: true },
});

export function defaultState() {
  return {
    v: 3,
    settings: defaultSettings(),
    projects: [
      { id: 'dycom', name: 'DYCOM Académie', sub: 'WhatsApp · Discord · SAV', color: 'blue', tasks: [] },
      { id: 'shilora', name: 'Shilora', sub: 'Boutique e-commerce · pubs', color: 'pink', tasks: [] },
      { id: 'atelier', name: "L'Atelier Agency", sub: 'Agence SMMA · premiers clients', color: 'cyan',
        tasks: [{ id: 'plan1', title: 'Préparer le plan de lancement', due: null, time: null, done: false, doneAt: null }] },
    ],
    // Tâches qui reviennent chaque jour
    routines: [
      { id: 'd1', projectId: 'dycom', title: 'Post WhatsApp n°1 (SMMA)', time: '10:00' },
      { id: 'd4', projectId: 'dycom', title: 'Check Discord : messages à répondre', time: '12:30' },
      { id: 'd5', projectId: 'dycom', title: 'Check WhatsApp SAV : tout le monde a une réponse', time: '12:30' },
      { id: 'd2', projectId: 'dycom', title: 'Post WhatsApp n°2 (SMMA)', time: '14:30' },
      { id: 'd3', projectId: 'dycom', title: 'Post WhatsApp n°3 (SMMA)', time: '18:00' },
    ],
    themes: [
      { id: 'anglais', name: 'Anglais', type: 'pratique', icon: 'globe', goal: 'Comprendre et utiliser naturellement les mots et phrases du quotidien', kind: 'steps',
        steps: st(['Les 100 mots les plus utilisés', 'Se présenter et parler de soi', 'Les 300 mots du quotidien', 'Phrases pour demander et répondre', 'Les temps : présent, passé, futur', 'Comprendre une vidéo simple sans sous-titres', 'Les 1 000 mots du quotidien', 'Tenir une conversation de 10 min', 'Comprendre naturellement sans traduire']), logs: [], links: [] },
      { id: 'arabe', name: 'Arabe', type: 'pratique', icon: 'cards', goal: 'Connaître les 500 mots les plus utilisés du Coran', kind: 'counter', count: 0, total: 500, unit: 'mots', steps: [], logs: [], links: [] },
      { id: 'montage', name: 'Montage vidéo', type: 'pratique', icon: 'film', goal: 'Monter des vidéos pro et rythmées pour les réseaux', kind: 'steps',
        steps: st(['Maîtriser le logiciel et les raccourcis', 'Cuts et rythme', 'Sous-titres dynamiques', 'Musique et sound design', 'B-roll et transitions', 'Hooks : les 3 premières secondes', 'Color grading', 'Textes animés et motion design', 'Un style perso reconnaissable']), logs: [], links: [] },
      { id: 'religion', name: 'Religion', type: 'video', icon: 'moon', goal: 'Apprendre sa religion en profondeur', kind: 'journal', steps: [], logs: [], links: [] },
      { id: 'podcast', name: 'Podcast', type: 'video', icon: 'head', goal: 'Apprendre quelque chose d’utile chaque jour (histoire, business…)', kind: 'journal', steps: [], logs: [], links: [] },
    ],
    // Semaine type : 0 = dimanche … 6 = samedi
    week: {
      1: { pratique: 'anglais', video: 'religion' },
      2: { pratique: 'arabe', video: 'podcast' },
      3: { pratique: 'montage', video: 'religion' },
      4: { pratique: 'anglais', video: 'podcast' },
      5: { pratique: 'arabe', video: 'religion' },
      6: { pratique: 'montage', video: 'podcast' },
      0: { pratique: 'anglais', video: 'religion' },
    },
    reminders: [],
    days: {},
  };
}

export function migrate(s) {
  if (!s || typeof s !== 'object' || (s.v || 0) < 3) return defaultState();
  const d = defaultState();
  for (const k of Object.keys(d)) if (s[k] == null) s[k] = d[k];
  const ds = defaultSettings();
  s.settings = { ...ds, ...s.settings, notif: { ...ds.notif, ...(s.settings?.notif || {}) } };
  return s;
}

export const proj = (S, id) => S.projects.find((p) => p.id === id);
export const theme = (S, id) => S.themes.find((t) => t.id === id);
export const allTasks = (S) => S.projects.flatMap((p) => p.tasks.map((t) => ({ p, t })));
export const curStep = (t) => t.steps.findIndex((s) => !s.done);
export const lastLog = (t) => t.logs[0]?.date || null;
export function pPct(t) {
  if (t.kind === 'counter') return t.total ? t.count / t.total : 0;
  if (t.kind === 'journal') return 0;
  return t.steps.length ? t.steps.filter((s) => s.done).length / t.steps.length : 0;
}

// Ce qui est prévu un jour donné
export function planFor(S, k) {
  const w = S.week[weekday(k)] || {};
  return { pratique: theme(S, w.pratique) || null, video: theme(S, w.video) || null };
}
// Tâches d'un projet visibles un jour donné : sans date (jusqu'à ce qu'elles soient faites), datées ce jour, en retard, ou faites ce jour
export function tasksFor(p, k, today) {
  return p.tasks.filter((x) => {
    if (x.done) return x.doneAt === k;
    if (!x.due) return k === today;
    return x.due === k || (k === today && x.due < today);
  });
}
// Série de jours consécutifs où la règle d'or est validée
export function coranStreak(S) {
  let n = 0, k = dkey();
  if (!S.days[k]?.coran) k = addDays(k, -1);
  while (S.days[k]?.coran) { n++; k = addDays(k, -1); }
  return n;
}

// ---------- Rappels / rendez-vous ----------
export const ALERTS = [[0, "À l'heure"], [5, '5 min'], [15, '15 min'], [30, '30 min'], [60, '1 h'], [120, '2 h'], [1440, '1 jour'], [2880, '2 jours'], [10080, '1 semaine']];
export const REPEAT = { none: 'Jamais', daily: 'Chaque jour', weekly: 'Chaque semaine', monthly: 'Chaque mois' };
export function occursOn(r, k) {
  if (!r.date || k < r.date) return false;
  switch (r.repeat) {
    case 'daily': return true;
    case 'weekly': return weekday(k) === weekday(r.date);
    case 'monthly': return pk(k).getDate() === pk(r.date).getDate();
    default: return k === r.date;
  }
}
export const remindersOn = (S, k) => (S.reminders || []).filter((r) => occursOn(r, k)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
export function nextOccurrence(r, from) {
  if (!r.repeat || r.repeat === 'none') return r.date;
  let k = r.date > from ? r.date : from;
  for (let i = 0; i < 400; i++, k = addDays(k, 1)) if (occursOn(r, k)) return k;
  return null;
}
export const alertShort = (m) => (ALERTS.find((a) => a[0] === m) || [m, m + ' min'])[1];
export function inLabel(m) {
  if (m === 0) return 'Maintenant';
  if (m < 60) return `Dans ${m} min`;
  if (m < 1440) return `Dans ${m / 60} h`;
  if (m === 1440) return 'Demain';
  if (m < 10080) return `Dans ${m / 1440} jours`;
  return 'Dans 1 semaine';
}
