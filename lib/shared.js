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
export function rel(k) {
  if (!k) return 'jamais';
  const n = daysBetween(k, dkey());
  return n <= 0 ? "aujourd'hui" : n === 1 ? 'hier' : n === 2 ? 'avant-hier' : `il y a ${n} jours`;
}

export const COL = { work: 'blue', learn: 'green', faith: 'violet', podcast: 'orange' };

const SURAHS = [[1, 'Al-Fatiha'], [114, 'An-Nas'], [113, 'Al-Falaq'], [112, 'Al-Ikhlas'], [111, 'Al-Masad'], [110, 'An-Nasr'], [109, 'Al-Kafirun'], [108, 'Al-Kawthar'], [107, "Al-Ma'un"], [106, 'Quraysh'], [105, 'Al-Fil'], [104, 'Al-Humaza'], [103, "Al-'Asr"], [102, 'At-Takathur'], [101, "Al-Qari'a"], [100, "Al-'Adiyat"], [99, 'Az-Zalzala'], [98, 'Al-Bayyina'], [97, 'Al-Qadr'], [96, "Al-'Alaq"], [95, 'At-Tin'], [94, 'Ash-Sharh'], [93, 'Ad-Duha'], [92, 'Al-Layl'], [91, 'Ash-Shams'], [90, 'Al-Balad'], [89, 'Al-Fajr'], [88, 'Al-Ghashiya'], [87, "Al-A'la"], [86, 'At-Tariq'], [85, 'Al-Buruj'], [84, 'Al-Inshiqaq'], [83, 'Al-Mutaffifin'], [82, 'Al-Infitar'], [81, 'At-Takwir'], [80, "'Abasa"], [79, "An-Nazi'at"], [78, 'An-Naba']];
export const st = (a) => a.map((t) => ({ t, done: false }));

export const defaultSettings = () => ({
  morning: '08:00', evening: '21:00',
  notif: { morning: true, evening: true, tasks: true, stale: true },
});

export function defaultState() {
  return {
    v: 2,
    settings: defaultSettings(),
    projects: [
      { id: 'atelier', name: "L'Atelier Agency", sub: 'Agence SMMA', goal: '', memory: [], tasks: [], notes: [], lastAt: null },
      { id: 'dycom', name: 'DYCOM', sub: 'WhatsApp · Discord · SAV · Lives', goal: '', memory: [], tasks: [], notes: [], lastAt: null },
      { id: 'perso', name: 'Perso', sub: 'Tout ce qui n’a pas de projet', goal: '', memory: [], tasks: [], notes: [], lastAt: null },
    ],
    routines: [
      { id: 'r1', title: 'Post sur le WhatsApp', projectId: 'dycom' },
      { id: 'r2', title: 'Gérer le Discord', projectId: 'dycom' },
      { id: 'r3', title: 'Répondre au SAV', projectId: 'dycom' },
    ],
    parcours: [
      { id: 'anglais', name: 'Anglais', cat: 'learn', icon: 'globe', goal: "Parler et comprendre l'anglais comme un expert (C1)", kind: 'steps', steps: st(['Bases de grammaire (présent, questions, négation)', 'Vocabulaire essentiel (1 000 mots)', 'Les temps du passé', 'Futur, conditionnel et modaux', 'Compréhension orale (séries et vidéos en VO)', 'Conversation : parler 10 min sans bloquer', 'Vocabulaire avancé et expressions', 'Anglais business et écrit pro', 'Niveau C1 : tout comprendre, parler couramment']), logs: [], links: [] },
      { id: 'montage', name: 'Montage vidéo', cat: 'learn', icon: 'film', goal: 'Monter des vidéos pro et rythmées pour les réseaux', kind: 'steps', steps: st(['Maîtriser le logiciel et les raccourcis', 'Cuts et rythme', 'Sous-titres dynamiques', 'Musique et sound design', 'B-roll et transitions', 'Hooks : les 3 premières secondes', 'Color grading', 'Textes animés et motion design', 'Storytelling et formats longs', 'Un style perso reconnaissable']), logs: [], links: [] },
      { id: 'coran', name: 'Coran — mémorisation', cat: 'faith', icon: 'book', goal: "Mémoriser le Coran, en commençant par le Juz 'Amma", kind: 'steps', steps: st(SURAHS.map(([n, s]) => `${n} · ${s}`)), logs: [], links: [] },
      { id: 'mots', name: '500 mots du Coran', cat: 'faith', icon: 'cards', goal: 'Connaître les 500 mots les plus fréquents du Coran', kind: 'counter', count: 0, total: 500, unit: 'mots', steps: [], logs: [], links: [] },
      { id: 'religion', name: 'Religion en profondeur', cat: 'faith', icon: 'moon', goal: 'Connaître sa religion en profondeur', kind: 'steps', steps: st(["Le tawhid (l'unicité d'Allah)", 'Les 6 piliers de la foi', "Les 5 piliers de l'islam", 'La purification et la prière', 'Le jeûne et la zakat', 'La vie du Prophète ﷺ (sira)', 'Les histoires des prophètes', 'Le bon comportement (akhlaq)', 'Les bases du tafsir', 'Les 40 hadiths de Nawawi']), logs: [], links: [] },
    ],
    podcasts: [], days: {}, chat: [],
  };
}

export function migrate(s) {
  if (!s || typeof s !== 'object') return defaultState();
  const d = defaultState();
  for (const k of Object.keys(d)) if (s[k] == null) s[k] = d[k];
  const ds = defaultSettings();
  s.settings = { ...ds, ...s.settings, notif: { ...ds.notif, ...(s.settings?.notif || {}) } };
  s.v = 2;
  return s;
}

export const proj = (S, id) => S.projects.find((p) => p.id === id);
export const parc = (S, id) => S.parcours.find((p) => p.id === id);
export const allTasks = (S) => S.projects.flatMap((p) => p.tasks.map((t) => ({ p, t })));
export const findTask = (S, id) => allTasks(S).find((x) => x.t.id === id);
export const curStep = (p) => p.steps.findIndex((s) => !s.done);
export const lastLog = (p) => p.logs[0]?.date || null;
export function pPct(p) {
  if (p.kind === 'counter') return p.total ? p.count / p.total : 0;
  return p.steps.length ? p.steps.filter((s) => s.done).length / p.steps.length : 0;
}
export function podStreak(S) {
  let n = 0, k = dkey();
  if (!S.podcasts.some((x) => x.date === k)) k = addDays(k, -1);
  while (S.podcasts.some((x) => x.date === k)) { n++; k = addDays(k, -1); }
  return n;
}

// Contexte complet envoyé au coach
export function ctx(S) {
  const t = dkey(), D = S.days[t] || {}, n = now();
  const L = [];
  L.push(`Date : ${frDate(t)} ${n.getFullYear()} (${t}), il est ${z(n.getHours())}h${z(n.getMinutes())}.`);
  L.push('PROJETS :');
  S.projects.forEach((p) => {
    const o = p.tasks.filter((x) => !x.done);
    L.push(`- [${p.id}] ${p.name} (${p.sub})${p.goal ? ' — objectif : ' + p.goal : ''} — dernière activité : ${rel(p.lastAt)}`);
    if (p.memory.length) L.push('  mémoire : ' + p.memory.join(' ; '));
    if (o.length) L.push('  tâches ouvertes : ' + o.slice(0, 15).map((x) => `[${x.id}] ${x.title}${x.due ? ` (échéance ${x.due}${x.time ? ' à ' + x.time : ''}${x.due < t ? ', EN RETARD' : ''})` : ''}`).join(' ; '));
    if (p.notes.length) L.push('  notes récentes : ' + p.notes.slice(0, 3).map((x) => x.text).join(' ; '));
  });
  L.push('ROUTINES QUOTIDIENNES : ' + S.routines.map((r) => `${r.title} (${(D.routines || []).includes(r.id) ? 'fait' : 'pas fait'} aujourd’hui)`).join(' ; '));
  L.push('PARCOURS (il apprend seul sur YouTube/Google, l’app suit sa progression) :');
  S.parcours.forEach((p) => {
    const i = curStep(p);
    L.push(`- [${p.id}] ${p.name} (${p.cat === 'faith' ? 'religion' : 'apprentissage'}) — objectif : ${p.goal} — ${p.kind === 'counter' ? `${p.count}/${p.total} ${p.unit}` : `${p.steps.filter((s) => s.done).length}/${p.steps.length} étapes, étape actuelle : ${i >= 0 ? p.steps[i].t : 'terminé'}`} — dernier point : ${rel(lastLog(p))}${p.logs[0] ? ' (' + p.logs[0].summary + ')' : ''}`);
  });
  L.push(`PODCASTS : objectif 1 par jour — aujourd’hui : ${S.podcasts.some((x) => x.date === t) ? 'fait' : 'pas encore'} — série : ${podStreak(S)} jour(s) — derniers : ${S.podcasts.slice(0, 3).map((x) => x.title).join(' ; ') || 'aucun'}`);
  if (D.plan?.priorities?.length) L.push('PRIORITÉS DU JOUR : ' + D.plan.priorities.map((p) => `${p.text} (${p.done ? 'fait' : 'pas fait'})`).join(' ; '));
  if (D.carry?.length) L.push('REPORTÉ À AUJOURD’HUI : ' + D.carry.join(' ; '));
  const y = S.days[addDays(t, -1)];
  if (y?.bilan?.note) L.push('NOTE DU BILAN D’HIER : ' + y.bilan.note);
  return L.join('\n');
}

export function planPrompt(S) {
  return `Tu es le coach d'organisation personnelle de l'utilisateur, un jeune entrepreneur qui a beaucoup de projets et tendance à s'éparpiller. À partir de ses données, choisis ses priorités pour AUJOURD'HUI : 3 maximum, concrètes et faisables aujourd'hui. D'abord ce qui est en retard ou reporté, puis ce qui fait avancer un projet qui stagne, et au plus 1 session d'apprentissage. Les routines quotidiennes ne sont PAS des priorités. Utilise les vrais identifiants entre crochets quand une priorité correspond à une tâche, un projet ou un parcours.

Réponds uniquement avec ce JSON :
{"message":"1 ou 2 phrases courtes, en français, tutoiement, ton direct et motivant","priorities":[{"text":"action courte (max 8 mots)","cat":"work|learn|faith|podcast","projectId":"id ou null","taskId":"id ou null","parcoursId":"id ou null"}]}

DONNÉES :
${ctx(S)}`;
}

export function cleanPlan(r, S) {
  const pr = (Array.isArray(r?.priorities) ? r.priorities : []).slice(0, 3).map((p) => ({
    id: rid(), text: String(p.text || '').trim(), cat: COL[p.cat] ? p.cat : 'work',
    projectId: proj(S, p.projectId) ? p.projectId : null,
    taskId: findTask(S, p.taskId) ? p.taskId : null,
    parcoursId: parc(S, p.parcoursId) ? p.parcoursId : null, done: false,
  })).filter((p) => p.text);
  return { message: String(r?.message || ''), priorities: pr, at: Date.now() };
}

// Lecture tolérante d'une réponse JSON
export function parseJSON(text) {
  const s = String(text || '').trim();
  try { return JSON.parse(s); } catch {}
  const f = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) { try { return JSON.parse(f[1]); } catch {} }
  const a = s.search(/[\[{]/), b = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  throw new Error('invalid_json');
}
