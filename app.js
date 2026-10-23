import { createClient } from '/vendor/supabase.js';
import { dkey, pk, addDays, frDate, daysBetween, rid, rel, monday, DAYS, st, defaultState, migrate, proj, theme, curStep, lastLog, pPct, planFor, tasksFor, coranStreak, weekday, remindersOn, nextOccurrence, ALERTS, REPEAT, alertShort } from '/lib/shared.js';

/* ---------- utilitaires ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const today = () => dkey();
function dayLabel(k) { const t = today(); if (k === t) return "Aujourd'hui"; if (k === addDays(t, 1)) return 'Demain'; if (k === addDays(t, -1)) return 'Hier'; return cap(frDate(k, { weekday: 'long', day: 'numeric', month: 'short' })); }
function dueLabel(k) { if (!k) return ''; const t = today(); if (k < t) return 'En retard'; return dayLabel(k); }

const P = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  up: '<path d="M4 17l6-6 4 4 6-7"/><path d="M14 8h6v6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="M15 5l-7 7 7 7"/>', fwd: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/><path d="M7 11h5M7 15h5"/>',
  head: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.4"/>', coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  down: '<path d="M6 9l6 6 6-6"/>', up2: '<path d="M6 15l6-6 6 6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};
const ic = (n, c = 'ico') => `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
function ring(p, col, s, label, fs) { const r = (s - 10) / 2, c = 2 * Math.PI * r, o = c * (1 - Math.max(0, Math.min(1, p))); return `<svg class="ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="${esc(label)}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--${col})" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" transform="rotate(-90 ${s / 2} ${s / 2})"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="var(--fg)" font-size="${fs || s / 4.4}" font-weight="800">${esc(label)}</text></svg>`; }
const TCOL = { pratique: 'green', video: 'orange' };
const chk = (on, act, attrs, col) => `<button class="chk ${on ? 'on' : ''} ${col || ''}" data-act="${act}" ${attrs} aria-label="${on ? 'Fait' : 'Marquer comme fait'}">${on ? ic('check') : ''}</button>`;

/* ---------- état & synchro ---------- */
let S = null, sb = null, session = null, cfg = null, saveT = null, dirty = false, lastSync = 0, saving = false;
let V = { tab: 'today', sub: null }, SH = null; const doneOpen = () => !!LS.get('cap-done-open'); const CAL = { mode: 'week', k: null }; const BUSY = {};
const uid = () => session?.user?.id;
const lsKey = () => 'cap3-' + (uid() || 'local');
const day = (k) => (S.days[k] ??= {});
const findTask = (id) => { for (const p of S.projects) { const t = p.tasks.find((x) => x.id === id); if (t) return { p, t }; } return null; };

function trim() { const t = today(); for (const k of Object.keys(S.days)) if (daysBetween(k, t) > 90) delete S.days[k]; S.themes.forEach((x) => (x.logs = x.logs.slice(0, 200))); S.projects.forEach((p) => { p.tasks = p.tasks.filter((x) => !x.done || !x.doneAt || daysBetween(x.doneAt, t) < 60); }); }
function save() { dirty = true; LS.set(lsKey(), S); clearTimeout(saveT); saveT = setTimeout(flush, 500); }
async function flush() {
  clearTimeout(saveT); trim(); LS.set(lsKey(), S);
  if (!session || !navigator.onLine) return;
  if (saving) { saveT = setTimeout(flush, 800); return; }
  saving = true; const ts = new Date().toISOString();
  const { error } = await sb.from('cap_state').upsert({ user_id: uid(), data: S, updated_at: ts });
  saving = false;
  if (!error) { dirty = false; lastSync = Date.parse(ts); LS.set(lsKey() + '-sync', lastSync); } else console.warn(error);
}
async function pull() {
  if (!session || !navigator.onLine) return;
  if (dirty) return flush();
  const { data, error } = await sb.from('cap_state').select('data,updated_at').eq('user_id', uid()).maybeSingle();
  if (error) return console.warn(error);
  if (!data || (data.data?.v || 0) < 3) return flush();
  const ts = Date.parse(data.updated_at);
  if (ts > lastSync && !dirty) { S = migrate(data.data); lastSync = ts; LS.set(lsKey(), S); LS.set(lsKey() + '-sync', ts); render(); }
}

/* ---------- vue : journée (aujourd'hui ou un autre jour) ---------- */
function routineRow(r, k) { const on = (S.days[k]?.routines || []).includes(r.id); return `<div class="row ${on ? 'done' : ''}">${chk(on, 'routine', `data-id="${r.id}" data-k="${k}"`)}<div class="txt"><span class="t">${esc(r.title)}</span></div>${r.time ? `<span class="time">${r.time}</span>` : ''}</div>`; }
function taskRow(x, k) { const late = !x.done && x.due && x.due < today(); return `<div class="row ${x.done ? 'done' : ''}">${chk(x.done, 'task', `data-id="${x.id}" data-k="${k}"`)}<div class="txt"><span class="t">${esc(x.title)}</span>${late ? `<span class="s" style="color:var(--red)">En retard · prévu ${esc(dayLabel(x.due).toLowerCase())}</span>` : !x.due && !x.done ? '<span class="s">Sans date · reste jusqu’à ce que tu la fasses</span>' : ''}</div>${x.time && !x.done ? `<span class="time">${ic('bell', 'ico-xs')}${x.time}</span>` : ''}</div>`; }
function projBlock(p, k) {
  const t = today(); const rs = S.routines.filter((r) => r.projectId === p.id); const ts = tasksFor(p, k, t).sort((a, b) => a.done - b.done || (a.time || '99').localeCompare(b.time || '99'));
  const items = [...rs.map((r) => ({ time: r.time || '99', html: routineRow(r, k), done: (S.days[k]?.routines || []).includes(r.id) })), ...ts.map((x) => ({ time: x.time || '99', html: taskRow(x, k), done: x.done }))].sort((a, b) => a.time.localeCompare(b.time));
  const dn = items.filter((i) => i.done).length;
  return `<div class="proj" style="--c:var(--${p.color});--cs:var(--${p.color}-soft)">
  <button class="proj-h" data-act="open" data-t="project" data-id="${p.id}"><span class="dotc"></span><div class="txt"><span class="pn">${esc(p.name)}</span><span class="s">${esc(p.sub)}</span></div><span class="count">${dn} / ${items.length}</span>${ic('fwd', 'ico-s')}</button>
  ${items.some((i) => !i.done) ? `<div class="plist">${items.filter((i) => !i.done).map((i) => i.html).join('')}</div>` : items.length ? `<div class="pdone">${ic('check', 'ico-xs')} Tout est fait</div>` : ''}
  <form class="addf qadd" data-form="quickTask" data-id="${p.id}" data-k="${k}"><input class="inp" name="t" id="qa-${p.id}" placeholder="+ Ajouter une tâche" autocomplete="off" enterkeyhint="done"><input class="inp tm" type="time" name="h" id="qh-${p.id}" aria-label="Heure du rappel (optionnel)"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form>
 </div>`;
}
function evolveCard(kind, th, k) {
  if (!th) return `<div class="card empty">Rien de prévu. <button class="link" data-act="open" data-t="week">Modifier la semaine type</button></div>`;
  const D = S.days[k] || {}; const on = !!D.evolve?.[kind]; const c = TCOL[kind]; const time = S.settings[kind];
  const i = th.kind === 'steps' ? curStep(th) : -1;
  const sub = th.kind === 'counter' ? `${th.count} / ${th.total} ${esc(th.unit)}` : th.kind === 'steps' ? (i >= 0 ? 'Étape : ' + esc(th.steps[i].t) : 'Parcours terminé ✓') : (D.evolve?.entry ? '' : 'Note ce que tu as regardé et retenu');
  return `<div class="evo ${on ? 'done' : ''}" style="--c:var(--${c});--cs:var(--${c}-soft)">
  <button class="evo-main" data-act="open" data-t="theme" data-id="${th.id}"><span class="badge">${ic(th.icon || 'route')}</span><div class="txt"><span class="k">${kind === 'pratique' ? 'Pratique' : 'Vidéo'} · ${time}</span><span class="pn">${esc(th.name)}</span><span class="s">${sub}</span></div></button>
  ${chk(on, 'evolve', `data-kind="${kind}" data-id="${th.id}" data-k="${k}"`, 'g')}
 </div>`;
}
function alertsText(r) { return (r.alerts?.length ? r.alerts : [0]).map(alertShort).join(', '); }
function rdvBlock(k) {
  const rs = remindersOn(S, k); if (!rs.length) return '';
  return `<div class="sec"><div class="sec-h"><h2 class="sh">${ic('clock', 'ico-s')} Rendez-vous & rappels</h2><button class="link" data-act="newRem" data-k="${k}">+ Rappel</button></div><div class="list">${rs.map((r) => `<button class="row rrow" data-act="editRem" data-id="${r.id}"><span class="rt">${r.time || '—'}</span><div class="txt"><span class="t">${esc(r.title)}</span><span class="s">${esc([r.note, '🔔 ' + alertsText(r), r.repeat && r.repeat !== 'none' ? REPEAT[r.repeat] : ''].filter(Boolean).join(' · '))}</span></div>${ic('fwd', 'ico-s')}</button>`).join('')}</div></div>`;
}
function doneItems(k) {
  const D = S.days[k] || {}; const t = today(); const plan = planFor(S, k); const out = [];
  if (D.coran) out.push({ label: '1 page de Coran', meta: 'Règle d’or', attrs: `data-act="coran" data-k="${k}"` });
  S.projects.forEach((p) => {
    S.routines.filter((r) => r.projectId === p.id && (D.routines || []).includes(r.id)).forEach((r) => out.push({ label: r.title, meta: p.name + (r.time ? ' · ' + r.time : ''), attrs: `data-act="routine" data-id="${r.id}" data-k="${k}"`, c: p.color }));
    tasksFor(p, k, t).filter((x) => x.done).forEach((x) => out.push({ label: x.title, meta: p.name, attrs: `data-act="task" data-id="${x.id}" data-k="${k}"`, c: p.color }));
  });
  ['pratique', 'video'].forEach((kind) => { if (plan[kind] && D.evolve?.[kind]) out.push({ label: `${kind === 'pratique' ? 'Pratique' : 'Vidéo'} : ${plan[kind].name}`, meta: 'Évoluer', attrs: `data-act="evolve" data-kind="${kind}" data-id="${plan[kind].id}" data-k="${k}"`, c: TCOL[kind] }); });
  return out;
}
function doneBlock(k) {
  const it = doneItems(k); if (!it.length) return '';
  const openD = doneOpen();
  return `<div class="donebox"><button class="done-h" data-act="toggleDone" aria-expanded="${openD}"><span class="dck">${ic('check', 'ico-s')}</span><span class="t">Déjà validé (${it.length})</span>${ic(openD ? 'up2' : 'down', 'ico-s')}</button>
  ${openD ? `<div class="done-l">${it.map((x) => `<div class="row done"><span class="chk g on">${ic('check')}</span><div class="txt"><span class="t">${esc(x.label)}</span><span class="s">${esc(x.meta)}</span></div><button class="undo" ${x.attrs} aria-label="Annuler">${ic('undo', 'ico-s')}</button></div>`).join('')}</div>` : ''}</div>`;
}
function vDayBody(k) {
  const t = today(); const isToday = k === t; const D = S.days[k] || {}; const plan = planFor(S, k); const h = new Date().getHours();
  return `${!navigator.onLine ? `<div class="alert">${ic('warn', 'ico-s')} Hors ligne : tes changements seront envoyés au retour du réseau.</div>` : ''}
 ${D.coran ? '' : `<button class="gold" data-act="coran" data-k="${k}"><span class="gold-ic">${D.coran ? ic('check') : ic('book')}</span><div class="txt"><span class="k">Règle d’or</span><span class="pn">1 page de Coran</span><span class="s">Touche pour valider</span></div></button>`}
 ${rdvBlock(k)}
 <div class="sec"><div class="sec-h"><h2 class="sh">${ic('coin', 'ico-s')} Ce qui rapporte</h2></div>${S.projects.map((p) => projBlock(p, k)).join('')}<button class="btn ghost addproj" data-act="newProject">${ic('plus', 'ico-s')} Ajouter un projet</button></div>
 <div class="sec"><div class="sec-h"><h2 class="sh">${ic('up', 'ico-s')} Ce qui me fait évoluer</h2><button class="link" data-act="open" data-t="week">Semaine type</button></div>${(() => { const left = ['pratique', 'video'].filter((x) => !(plan[x] && D.evolve?.[x])); return left.length ? left.map((x) => evolveCard(x, plan[x], k)).join('') : `<div class="pdone card">${ic('check', 'ico-xs')} Pratique et vidéo faites</div>`; })()}</div>
 ${doneBlock(k)}
 ${isToday ? `<button class="card coach" style="text-align:left;width:100%;${h >= 18 ? '' : 'border-color:var(--line);background:var(--card)'}" data-act="open" data-t="bilan">${ic('moon', 'ico spark')}<div class="coach-body"><span class="coach-msg">Bilan du soir</span><span class="coach-sub">${D.bilan ? 'Journée validée ✓' : 'Fais le point sur ta journée en 1 minute.'}</span></div></button>` : ''}`;
}
function vToday() {
  const k = today(); const h = new Date().getHours(); const sk = coranStreak(S);
  return `<div class="head"><div class="head-l"><span class="eyebrow">${esc(cap(frDate(k)))}</span><h1>${h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour'} 👋</h1></div>${sk ? `<span class="streak">🔥 ${sk} jour${sk > 1 ? 's' : ''}</span>` : ''}</div>${vDayBody(k)}`;
}

/* ---------- vue : planning (année / mois / semaine / jour) ---------- */
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ymKey = (k) => k.slice(0, 7);
const firstOfMonth = (k) => k.slice(0, 8) + '01';
function shiftMonth(k, n) { const d = pk(firstOfMonth(k)); d.setMonth(d.getMonth() + n); return dkey(d); }
function dayScore(k) {
  const D = S.days[k] || {}; const plan = planFor(S, k); const t = today();
  let tot = 1 + S.routines.length, dn = (D.coran ? 1 : 0) + (D.routines || []).length;
  S.projects.forEach((p) => { const ts = tasksFor(p, k, t); tot += ts.length; dn += ts.filter((x) => x.done).length; });
  ['pratique', 'video'].forEach((x) => { if (plan[x]) { tot++; if (D.evolve?.[x]) dn++; } });
  return { tot, dn };
}
const rdvOf = (k) => remindersOn(S, k).filter((r) => r.repeat !== 'daily');
function calLabel() {
  const k = CAL.k;
  if (CAL.mode === 'year') return String(pk(k).getFullYear());
  if (CAL.mode === 'month') return cap(MONTHS[pk(k).getMonth()]) + ' ' + pk(k).getFullYear();
  if (CAL.mode === 'week') { const a = monday(k), b = addDays(a, 6); return `${frDate(a, { day: 'numeric', month: 'short' })} – ${frDate(b, { day: 'numeric', month: 'short', year: 'numeric' })}`; }
  return cap(frDate(k, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
}
function calIsNow() {
  const k = CAL.k, t = today();
  return CAL.mode === 'year' ? k.slice(0, 4) === t.slice(0, 4) : CAL.mode === 'month' ? ymKey(k) === ymKey(t) : CAL.mode === 'week' ? monday(k) === monday(t) : k === t;
}
function vPlanning() {
  CAL.k ??= today();
  const modes = [['year', 'Année'], ['month', 'Mois'], ['week', 'Semaine'], ['day', 'Jour']];
  const head = `<div class="head"><div class="head-l"><h1>Planning</h1></div><div class="wnav"><button class="iconbtn" data-act="open" data-t="reminders" aria-label="Mes rappels">${ic('bell')}</button><button class="btn sm" data-act="newRem" data-k="${CAL.mode === 'day' ? CAL.k : today()}">${ic('plus', 'ico-s')} Rappel</button></div></div>
 <div class="seg calseg">${modes.map(([m, l]) => `<button class="${CAL.mode === m ? 'on' : ''}" data-act="calMode" data-v="${m}">${l}</button>`).join('')}</div>
 <div class="calbar"><button class="iconbtn" data-act="calMove" data-n="-1" aria-label="Précédent">${ic('back')}</button><div class="callabel"><span>${esc(calLabel())}</span>${calIsNow() ? '' : `<button class="link" data-act="calToday">Revenir à aujourd’hui</button>`}</div><button class="iconbtn" data-act="calMove" data-n="1" aria-label="Suivant">${ic('fwd')}</button></div>`;
  return head + { year: vYear, month: vMonth, week: vWeekList, day: () => vDayBody(CAL.k) }[CAL.mode]();
}
function vWeekList() {
  const t = today(); const start = monday(CAL.k); const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return `<div class="week">${days.map((k) => {
    const plan = planFor(S, k); const D = S.days[k] || {}; const past = k < t; const isT = k === t; const sc = dayScore(k);
    const rd = remindersOn(S, k).filter((r) => r.time);
    const dated = S.projects.flatMap((p) => p.tasks.filter((x) => x.due === k).map((x) => x.title));
    return `<button class="wday ${isT ? 'today' : ''} ${past ? 'past' : ''}" data-act="calDay" data-k="${k}">
    <div class="wd"><span class="wdn">${DAYS[weekday(k)].slice(0, 3)}</span><span class="wdd">${pk(k).getDate()}</span></div>
    <div class="wbody"><div class="wtags">${plan.pratique ? `<span class="pill p-green">${esc(plan.pratique.name)}</span>` : ''}${plan.video ? `<span class="pill p-orange">${esc(plan.video.name)}</span>` : ''}</div>
     ${rd.length ? `<span class="s rdvline">${ic('clock', 'ico-xs')} ${rd.slice(0, 2).map((r) => esc(r.time + ' ' + r.title)).join(' · ')}${rd.length > 2 ? ` · +${rd.length - 2}` : ''}</span>` : ''}
     ${dated.length ? `<span class="s">${dated.slice(0, 2).map(esc).join(' · ')}${dated.length > 2 ? ` · +${dated.length - 2}` : ''}</span>` : ''}</div>
    <div class="wst">${past || isT ? `<span class="wsc">${sc.dn}/${sc.tot}</span><span class="wcor ${D.coran ? 'on' : ''}">${D.coran ? ic('check', 'ico-xs') : ''}</span>` : ''}</div></button>`;
  }).join('')}</div>
 <button class="btn ghost" data-act="open" data-t="week">${ic('edit', 'ico-s')} Modifier la semaine type</button>`;
}
function vMonth() {
  const t = today(); const first = firstOfMonth(CAL.k); const ym = ymKey(first); const start = monday(first);
  const cells = []; for (let i = 0; i < 42; i++) { const k = addDays(start, i); if (i >= 35 && ymKey(k) !== ym) break; cells.push(k); }
  const list = [];
  for (let k = first; ymKey(k) === ym; k = addDays(k, 1)) rdvOf(k).forEach((r) => list.push({ k, r }));
  return `<div class="mgrid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<span class="mh">${d}</span>`).join('')}
  ${cells.map((k) => { const D = S.days[k] || {}; const inM = ymKey(k) === ym; const rd = rdvOf(k).length; const tk = S.projects.some((p) => p.tasks.some((x) => x.due === k)); const sc = k <= t ? dayScore(k) : null;
    return `<button class="mcell ${inM ? '' : 'out'} ${k === t ? 'today' : ''} ${D.coran ? 'cor' : ''}" data-act="calDay" data-k="${k}"><span class="mn">${pk(k).getDate()}</span><span class="mdots">${rd ? '<i class="dv"></i>' : ''}${tk ? '<i class="db"></i>' : ''}</span>${sc && inM ? `<span class="mbar"><i style="width:${Math.round((sc.dn / sc.tot) * 100)}%"></i></span>` : ''}</button>`; }).join('')}</div>
 <div class="legend"><span><i class="lg cor"></i>Coran validé</span><span><i class="lg dv"></i>Rendez-vous</span><span><i class="lg db"></i>Tâche datée</span></div>
 <div class="sec"><h2>Rendez-vous du mois</h2>${list.length ? `<div class="list">${list.map(({ k, r }) => `<button class="row rrow" data-act="editRem" data-id="${r.id}"><span class="rt">${pk(k).getDate()} ${MONTHS[pk(k).getMonth()].slice(0, 4)}.</span><div class="txt"><span class="t">${esc(r.title)}</span><span class="s">${esc([r.time, r.note].filter(Boolean).join(' · '))}</span></div>${ic('fwd', 'ico-s')}</button>`).join('')}</div>` : `<div class="card empty">Aucun rendez-vous ce mois-ci.</div>`}</div>`;
}
function vYear() {
  const y = pk(CAL.k).getFullYear(); const t = today();
  return `<div class="ygrid">${MONTHS.map((m, i) => {
    const first = `${y}-${String(i + 1).padStart(2, '0')}-01`; const start = monday(first); const ym = ymKey(first);
    const cells = []; for (let j = 0; j < 42; j++) { const k = addDays(start, j); if (j >= 35 && ymKey(k) !== ym) break; cells.push(k); }
    const cor = cells.filter((k) => ymKey(k) === ym && S.days[k]?.coran).length;
    return `<button class="ymonth ${ym === ymKey(t) ? 'now' : ''}" data-act="calMonth" data-k="${first}"><span class="ymn">${cap(m)}</span><span class="ydays">${cells.map((k) => `<i class="${ymKey(k) !== ym ? 'o' : ''} ${S.days[k]?.coran ? 'c' : ''} ${k === t ? 't' : ''} ${ymKey(k) === ym && rdvOf(k).length ? 'r' : ''}"></i>`).join('')}</span><span class="ys">${cor ? `${cor} j. Coran` : '&nbsp;'}</span></button>`;
  }).join('')}</div>
 <div class="legend"><span><i class="lg cor"></i>Coran validé</span><span><i class="lg dv"></i>Rendez-vous</span></div>`;
}
function vReminders() {
  const t = today(); const all = (S.reminders || []).map((r) => ({ r, n: nextOccurrence(r, t) }));
  const up = all.filter((x) => x.n && (x.n > t || (x.n === t && (!x.r.time || x.r.time >= new Date().toTimeString().slice(0, 5)) ) || (x.r.repeat && x.r.repeat !== 'none'))).sort((a, b) => (a.n + (a.r.time || '')).localeCompare(b.n + (b.r.time || '')));
  const past = all.filter((x) => !up.includes(x)).sort((a, b) => b.r.date.localeCompare(a.r.date));
  const row = ({ r, n }) => `<button class="row rrow" data-act="editRem" data-id="${r.id}"><span class="rt">${r.time || '—'}</span><div class="txt"><span class="t">${esc(r.title)}</span><span class="s">${esc([dayLabel(n || r.date), r.repeat && r.repeat !== 'none' ? REPEAT[r.repeat] : '', '🔔 ' + alertsText(r)].filter(Boolean).join(' · '))}</span></div>${ic('fwd', 'ico-s')}</button>`;
  return `<button class="back" data-act="back">${ic('back')} Planning</button>
 <div class="head"><div class="head-l"><h1>Mes rappels</h1><span class="eyebrow">Rendez-vous et rappels programmés</span></div><button class="btn sm" data-act="newRem" data-k="${t}">${ic('plus', 'ico-s')} Rappel</button></div>
 <div class="sec"><h2>À venir</h2>${up.length ? `<div class="list">${up.map(row).join('')}</div>` : `<div class="card empty">Aucun rappel programmé. Touche « + Rappel » pour en créer un.</div>`}</div>
 ${past.length ? `<div class="sec"><h2>Passés</h2><div class="list">${past.slice(0, 50).map(row).join('')}</div></div>` : ''}`;
}
function vWeekType() {
  const pr = S.themes.filter((x) => x.type === 'pratique'), vi = S.themes.filter((x) => x.type === 'video');
  const sel = (d, kind, list) => `<select class="inp" id="wk-${d}-${kind}" data-week="${d}" data-kind="${kind}"><option value="">—</option>${list.map((x) => `<option value="${x.id}" ${S.week[d]?.[kind] === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
  return `<button class="back" data-act="back">${ic('back')} Retour</button>
 <div class="head"><div class="head-l"><h1>Semaine type</h1><span class="eyebrow">1 pratique à ${S.settings.pratique} et 1 vidéo à ${S.settings.video}, chaque jour.</span></div></div>
 <div class="list">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="row wrow"><span class="t wdl">${DAYS[d]}</span><div class="wsel">${sel(d, 'pratique', pr)}${sel(d, 'video', vi)}</div></div>`).join('')}</div>
 <span class="hint">Les changements s’appliquent tout de suite à tous les jours.</span>`;
}

/* ---------- vue : projet ---------- */
function vProject({ id, tab = 'todo', confirm }) {
  const p = proj(S, id); if (!p) return goBack(); const rs = S.routines.filter((r) => r.projectId === id);
  const open = p.tasks.filter((x) => !x.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (a.time || '99').localeCompare(b.time || '99'));
  const done = p.tasks.filter((x) => x.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  const list = tab === 'todo' ? open : done;
  return `<button class="back" data-act="back">${ic('back')} Retour</button>
 <div class="head" style="--c:var(--${p.color})"><div class="head-l"><h1>${esc(p.name)}</h1><span class="eyebrow">${esc(p.sub)}</span></div><button class="iconbtn" data-act="editProject" data-id="${id}" aria-label="Modifier">${ic('edit')}</button></div>
 <div class="sec"><h2>Tous les jours</h2><div class="list">${rs.map((r) => `<div class="row"><div class="txt"><span class="t">${esc(r.title)}</span></div>${r.time ? `<span class="time">${r.time}</span>` : ''}<button class="x" data-act="routineEdit" data-id="${r.id}" aria-label="Modifier">${ic('edit', 'ico-s')}</button></div>`).join('') || '<div class="row"><span class="s">Aucune tâche quotidienne.</span></div>'}
  <form class="row addf" data-form="addRoutine" data-id="${id}"><input class="inp" name="t" id="rout-in" placeholder="Ajouter une tâche quotidienne" autocomplete="off"><input class="inp tm" type="time" name="h" id="rout-h" aria-label="Heure"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form></div></div>
 <div class="sec"><div class="sec-h"><h2>Tâches</h2><div class="tabs"><button class="${tab === 'todo' ? 'on' : ''}" data-act="ptab" data-v="todo">À faire ${open.length}</button><button class="${tab === 'done' ? 'on' : ''}" data-act="ptab" data-v="done">Fait ${done.length}</button></div></div>
  <form class="card sec" data-form="addTask" data-id="${id}" style="gap:8px"><input class="inp" name="t" id="task-in" placeholder="Nouvelle tâche" autocomplete="off"><div class="addf"><input class="inp" type="date" name="d" id="task-d" aria-label="Date"><input class="inp tm" type="time" name="h" id="task-h" aria-label="Heure du rappel"><button class="btn sm" style="flex:1">Ajouter</button></div><span class="hint">Sans date : la tâche reste chaque jour jusqu’à ce que tu la fasses. Avec une heure : tu reçois un rappel.</span></form>
  ${list.length ? `<div class="list">${list.map((x) => `<div class="row ${x.done ? 'done' : ''}">${chk(x.done, 'task', `data-id="${x.id}" data-k="${today()}"`)}<div class="txt"><span class="t">${esc(x.title)}</span><span class="s">${x.done ? 'Fait ' + rel(x.doneAt) : x.due ? `<span style="${x.due < today() ? 'color:var(--red)' : ''}">${esc(dueLabel(x.due))}${x.time ? ' · ' + x.time : ''}</span>` : 'Sans date'}</span></div><button class="x" data-act="taskDel" data-id="${x.id}" aria-label="Supprimer">${ic('x', 'ico-s')}</button></div>`).join('')}</div>` : `<div class="empty">${tab === 'todo' ? 'Rien à faire ici pour l’instant.' : 'Aucune tâche terminée.'}</div>`}</div>
 ${confirm ? `<div class="card confirm"><span>Supprimer « ${esc(p.name)} » et toutes ses tâches ?</span><div class="btn-row"><button class="btn ghost sm" data-act="unconfirm">Annuler</button><button class="btn red sm" data-act="projDel" data-id="${id}">Supprimer</button></div></div>` : `<button class="danger" data-act="confirm">Supprimer le projet</button>`}`;
}

/* ---------- vue : évoluer ---------- */
function themeCard(x) {
  const c = TCOL[x.type]; const pct = Math.round(pPct(x) * 100); const i = x.kind === 'steps' ? curStep(x) : -1;
  const sub = x.kind === 'counter' ? `${x.count} / ${x.total} ${esc(x.unit)}` : x.kind === 'steps' ? (i >= 0 ? esc(x.steps[i].t) : x.steps.length ? 'Parcours terminé ✓' : 'Ajoute tes étapes') : `${x.logs.length} vidéo${x.logs.length > 1 ? 's' : ''} notée${x.logs.length > 1 ? 's' : ''}`;
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => S.week[d]?.[x.type] === x.id).map((d) => DAYS[d].slice(0, 3)).join(' · ');
  return `<button class="pc" style="--c:var(--${c});--cs:var(--${c}-soft)" data-act="open" data-t="theme" data-id="${x.id}">
  <div class="pc-top"><span class="badge">${ic(x.icon || 'route')}</span><div style="flex:1;min-width:0"><div class="pc-name">${esc(x.name)}</div><div class="pc-sub">${sub}</div></div>${x.kind !== 'journal' ? `<span class="pct">${pct} %</span>` : ''}</div>
  ${x.kind !== 'journal' ? `<div class="bar" style="--c:var(--${c})"><i style="width:${pct}%"></i></div>` : ''}
  <div class="pc-meta"><span>${days || 'Pas dans la semaine type'}</span><span>Dernière fois : ${rel(lastLog(x))}</span></div></button>`;
}
function vEvolve() {
  return `<div class="head"><div class="head-l"><h1>Évoluer</h1><span class="eyebrow">Tu apprends sur YouTube, Google… ici tu suis où tu en es.</span></div><button class="iconbtn" data-act="newTheme" aria-label="Nouveau thème">${ic('plus')}</button></div>
 <div class="sec"><h2>Pratique <span class="count">· ${S.settings.pratique}</span></h2>${S.themes.filter((x) => x.type === 'pratique').map(themeCard).join('')}</div>
 <div class="sec"><h2>Vidéo <span class="count">· ${S.settings.video}</span></h2>${S.themes.filter((x) => x.type === 'video').map(themeCard).join('')}</div>`;
}
function vTheme({ id, edit, confirm }) {
  const x = theme(S, id); if (!x) return goBack(); const c = TCOL[x.type], cs = c + '-soft'; const i = x.kind === 'steps' ? curStep(x) : -1; const pct = pPct(x);
  const top = x.kind === 'journal'
    ? `<div class="card goal"><span class="goal-l">Objectif</span><span style="font-weight:600">${esc(x.goal || '—')}</span><span class="pc-sub">${x.logs.length} vidéo${x.logs.length > 1 ? 's' : ''} notée${x.logs.length > 1 ? 's' : ''}</span></div>`
    : `<div class="card ringwrap">${ring(pct, c, 92, Math.round(pct * 100) + ' %')}<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="goal-l">Objectif</span><span style="font-weight:600">${esc(x.goal || '—')}</span><span class="pc-sub">${x.kind === 'counter' ? `${x.count} / ${x.total} ${esc(x.unit)}` : `${x.steps.filter((s) => s.done).length} / ${x.steps.length} étapes`}</span></div></div>`;
  const counter = x.kind === 'counter' ? `<div class="card counter"><span class="goal-l">Où tu en es</span><span class="big">${x.count} <small>/ ${x.total} ${esc(x.unit)}</small></span><div class="cbtns"><button data-act="cnt" data-n="-1">−1</button><button data-act="cnt" data-n="1">+1</button><button data-act="cnt" data-n="5">+5</button><button data-act="cnt" data-n="10">+10</button></div><form class="addf" data-form="setCount"><input class="inp" type="number" inputmode="numeric" min="0" max="${x.total}" name="n" id="cnt-in" placeholder="J’en suis à…"><button class="btn sm">OK</button></form></div>` : '';
  const steps = x.kind !== 'steps' ? '' : edit
    ? `<div class="sec">${x.steps.map((s, k) => `<div class="addf"><input class="inp" id="step-${k}" data-step="${k}" value="${esc(s.t)}"><button class="x" data-act="stepDel" data-i="${k}" aria-label="Retirer">${ic('x', 'ico-s')}</button></div>`).join('')}<form class="addf" data-form="addStep"><input class="inp" name="t" id="step-new" placeholder="Nouvelle étape" autocomplete="off"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form><button class="btn" data-act="editDone">Enregistrer le guide</button></div>`
    : x.steps.length ? `<div class="steps" style="--c:var(--${c});--cs:var(--${cs})">${x.steps.map((s, k) => `<button class="step ${s.done ? 'ok' : ''} ${k === i ? 'cur' : ''}" data-act="stepToggle" data-i="${k}"><span class="dot">${s.done ? ic('check') : ''}</span><span class="st">${esc(s.t)}</span></button>`).join('')}</div>`
      : `<button class="btn ghost" data-act="editSteps">Écrire les étapes</button>`;
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => S.week[d]?.[x.type] === x.id).map((d) => DAYS[d]).join(', ');
  return `<button class="back" data-act="back">${ic('back')} Retour</button>
 <div class="head"><div class="head-l"><span class="eyebrow" style="color:var(--${c})">${x.type === 'pratique' ? 'Pratique' : 'Vidéo'}${days ? ' · ' + esc(days) : ''}</span><h1>${esc(x.name)}</h1></div><button class="iconbtn" data-act="editTheme" data-id="${id}" aria-label="Modifier">${ic('edit')}</button></div>
 ${top}${counter}
 ${x.kind !== 'counter' && i >= 0 && !edit ? `<div class="card cur-card" style="border-color:var(--${c})"><span style="color:var(--${c})">${ic('star')}</span><div style="flex:1;min-width:0"><div class="goal-l">Étape actuelle</div><div style="font-weight:700">${esc(x.steps[i].t)}</div></div></div>` : ''}
 <button class="btn" data-act="log" data-id="${id}">${ic('edit', 'ico-s')} ${x.kind === 'journal' ? 'Ajouter une vidéo' : 'Noter ma session'}</button>
 ${x.kind === 'steps' ? `<div class="sec"><div class="sec-h"><h2>Guide étape par étape</h2>${x.steps.length && !edit ? `<button class="link" data-act="editSteps">Modifier</button>` : ''}</div>${steps}</div>` : ''}
 <div class="sec"><h2>${x.kind === 'journal' ? 'Mes vidéos' : 'Historique'}</h2>${x.logs.length ? `<div class="card">${x.logs.slice(0, 40).map((l, k) => `<div class="log"><div style="display:flex;justify-content:space-between;gap:8px"><span class="d">${esc(cap(rel(l.date)))}${l.step ? ' · ' + esc(l.step) : ''}</span><button class="x" style="width:22px;height:22px" data-act="logDel" data-i="${k}" aria-label="Supprimer">${ic('x', 'ico-s')}</button></div>${l.title ? `<span class="x2" style="font-weight:600">${esc(l.title)}</span>` : ''}${l.url ? `<a class="lnk" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${ic('link', 'ico-xs')}${esc(l.url)}</a>` : ''}${l.text ? `<span class="x2">${esc(l.text)}</span>` : ''}</div>`).join('')}</div>` : `<div class="card empty">${x.kind === 'journal' ? 'Après chaque vidéo : titre, lien et ce que tu as retenu.' : 'Après chaque session, note ce que tu as fait.'}</div>`}</div>
 <div class="sec"><h2>Mes ressources</h2>${x.links.map((l, k) => `<div class="urlbox">${ic('link', 'ico-s')}<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.title || l.url)}</a><button class="x" style="width:24px;height:24px" data-act="linkDel" data-i="${k}" aria-label="Retirer">${ic('x', 'ico-s')}</button></div>`).join('')}
  <form class="card sec" data-form="addLink" style="gap:8px"><input class="inp" name="title" id="link-t" placeholder="Nom (ex : chaîne YouTube)" autocomplete="off"><div class="addf"><input class="inp" name="url" id="link-u" type="url" inputmode="url" placeholder="https://…"><button class="btn sm">Ajouter</button></div></form></div>
 ${confirm ? `<div class="card confirm"><span>Supprimer « ${esc(x.name)} » ?</span><div class="btn-row"><button class="btn ghost sm" data-act="unconfirm">Annuler</button><button class="btn red sm" data-act="themeDel" data-id="${id}">Supprimer</button></div></div>` : `<button class="danger" data-act="confirm">Supprimer ce thème</button>`}`;
}

/* ---------- vue : bilan ---------- */
function bilanItems(k) {
  const D = S.days[k] || {}; const t = today(); const plan = planFor(S, k); const items = [{ kind: 'coran', text: 'Règle d’or : 1 page de Coran', done: !!D.coran }];
  S.routines.forEach((r) => items.push({ kind: 'routine', id: r.id, text: r.title, done: (D.routines || []).includes(r.id) }));
  S.projects.forEach((p) => tasksFor(p, k, t).forEach((x) => items.push({ kind: 'task', id: x.id, text: x.title, sub: p.name, done: x.done })));
  ['pratique', 'video'].forEach((x) => { if (plan[x]) items.push({ kind: 'evolve', text: `${x === 'pratique' ? 'Pratique' : 'Vidéo'} : ${plan[x].name}`, done: !!D.evolve?.[x] }); });
  return items;
}
function vBilan() {
  const t = today(), D = S.days[t] || {}; const it = bilanItems(t); const dn = it.filter((x) => x.done), nd = it.filter((x) => !x.done);
  return `<button class="back" data-act="back">${ic('back')} Aujourd’hui</button>
 <div class="head"><div class="head-l"><h1>Bilan du soir 🌙</h1><span class="eyebrow">${esc(cap(frDate(t)))}</span></div></div>
 <div class="card bilan-top">${ring(dn.length / it.length, 'amber', 96, `${dn.length}/${it.length}`, 20)}<div style="display:flex;flex-direction:column;gap:4px"><span style="font-weight:700;font-size:17px">${dn.length === it.length ? 'Journée complète' : dn.length / it.length >= 0.6 ? 'Bonne journée' : 'Journée moyenne'}</span><span class="pc-sub" style="color:${D.coran ? 'var(--green)' : 'var(--red)'}">${D.coran ? 'Règle d’or validée ✓' : 'Règle d’or pas encore validée'}</span></div></div>
 ${nd.length ? `<div class="sec"><h2>Pas fait</h2><div class="list">${nd.map((x) => `<div class="row"><span class="chk"></span><div class="txt"><span class="t">${esc(x.text)}</span>${x.sub ? `<span class="s">${esc(x.sub)}</span>` : ''}</div>${x.kind === 'task' ? `<div class="mini-btns"><button class="a" data-act="bTomorrow" data-id="${x.id}">Demain</button><button data-act="taskDel" data-id="${x.id}">Retirer</button></div>` : x.kind === 'coran' ? `<div class="mini-btns"><button class="a" data-act="coran" data-k="${t}">Valider</button></div>` : ''}</div>`).join('')}</div></div>` : ''}
 ${dn.length ? `<div class="sec"><h2>Fait</h2><div class="list">${dn.map((x) => `<div class="row"><span class="chk g on">${ic('check')}</span><div class="txt"><span class="t">${esc(x.text)}</span></div></div>`).join('')}</div></div>` : ''}
 <div class="field"><label class="label" for="bilan-note">Une note sur ta journée ?</label><textarea class="inp" id="bilan-note" placeholder="Ce qui a marché, ce qui a bloqué…">${esc(D.bilan?.note || '')}</textarea></div>
 <button class="btn" data-act="bSave">${D.bilan ? 'Mettre à jour mon bilan' : 'Valider ma journée'}</button>`;
}

/* ---------- vue : réglages & notifications ---------- */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let pushState = 'unknown';
async function checkPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { pushState = isIOS && !standalone() ? 'install' : 'unsupported'; return; }
  if (Notification.permission === 'denied') { pushState = 'denied'; return; }
  try { const reg = await navigator.serviceWorker.ready; pushState = (await reg.pushManager.getSubscription()) ? 'on' : 'off'; } catch { pushState = 'off'; }
}
function b64(s) { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); }
async function enablePush() {
  if (!cfg?.vapidPublicKey) return toast('Clé de notification manquante dans Vercel.');
  BUSY.push = true; render();
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { pushState = perm === 'denied' ? 'denied' : 'off'; throw new Error('perm'); }
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.vapidPublicKey) }));
    const { error } = await sb.from('cap_push').upsert({ endpoint: sub.endpoint, user_id: uid(), subscription: sub.toJSON() });
    if (error) throw error;
    pushState = 'on'; await flush(); toast('Notifications activées ✓');
  } catch (e) { if (e.message !== 'perm') { console.warn(e); toast('Activation impossible. Réessaie.'); } }
  BUSY.push = false; render();
}
async function testPush() {
  try {
    const { data } = await sb.auth.getSession(); const tok = data?.session?.access_token;
    const r = await fetch('/api/push-test', { method: 'POST', headers: { authorization: 'Bearer ' + tok } }); const j = await r.json();
    toast(j.sent ? 'Notif envoyée ✓' : 'Aucun appareil abonné.');
  } catch { toast('Envoi impossible.'); }
}
function vSettings() {
  const s = S.settings; const n = s.notif;
  const pushBox = {
    on: `<div class="alert" style="color:var(--green);background:var(--green-soft)">${ic('check', 'ico-s')} Notifications activées sur ce téléphone</div><button class="btn ghost" data-act="testPush">Envoyer une notif de test</button>`,
    off: `<span class="pc-sub">Reçois ta journée le matin, chaque rappel à l’heure, et le bilan du soir.</span><button class="btn" data-act="enablePush" ${BUSY.push ? 'disabled' : ''}>${BUSY.push ? '<span class="spin"></span>' : ic('bell', 'ico-s')} Activer les notifications</button>`,
    install: `<span class="pc-sub">Sur iPhone, les notifications marchent seulement depuis l’app installée : dans Safari, touche <b>Partager</b> → <b>Sur l’écran d’accueil</b>, puis ouvre CAP depuis l’icône.</span>`,
    denied: `<span class="pc-sub">Les notifications sont bloquées. Va dans <b>Réglages iPhone → Notifications → CAP</b> et autorise-les.</span>`,
    unsupported: `<span class="pc-sub">Ce navigateur ne gère pas les notifications. Installe CAP sur l’écran d’accueil de ton iPhone.</span>`,
    unknown: `<div class="loading"><span class="spin"></span>Vérification…</div>`,
  }[pushState];
  const tog = (k, l, sub) => `<label class="row" for="n-${k}"><div class="txt"><span class="t">${l}</span><span class="s">${sub}</span></div><input type="checkbox" class="sw" id="n-${k}" data-notif="${k}" ${n[k] ? 'checked' : ''}></label>`;
  const tm = (k, l) => `<div class="row"><div class="txt"><span class="t">${l}</span></div><input class="inp tm" type="time" id="set-${k}" data-set="${k}" value="${s[k]}"></div>`;
  return `<div class="head"><div class="head-l"><h1>Réglages</h1></div></div>
 <div class="card sec"><h2>Notifications</h2>${pushBox}</div>
 <div class="sec"><h2>Heures</h2><div class="list">${tm('morning', 'Résumé de la journée')}${tm('pratique', 'Pratique')}${tm('video', 'Vidéo')}${tm('evening', 'Bilan du soir')}</div><span class="hint">Les heures des posts DYCOM se changent dans le projet DYCOM.</span></div>
 <div class="sec"><h2>Rappels</h2><div class="list">
  ${tog('morning', 'Résumé du matin', 'Ta règle d’or, ta pratique, ta vidéo et tes tâches')}
  ${tog('tasks', 'Tâches', 'Posts DYCOM, checks, et tâches avec une heure')}
  ${tog('evolve', 'Pratique et vidéo', 'À l’heure choisie, si ce n’est pas fait')}
  ${tog('rdv', 'Rendez-vous et rappels', 'Selon les alertes choisies pour chaque rappel')}
  ${tog('evening', 'Bilan du soir', 'Et rappel de la page de Coran si pas validée')}
 </div></div>
 <button class="btn ghost" data-act="open" data-t="week">${ic('cal', 'ico-s')} Modifier la semaine type</button>
 <div class="card sec"><h2>Compte</h2><span class="pc-sub">${esc(session?.user?.email || '')}</span><button class="btn ghost" data-act="logout">Se déconnecter</button></div>`;
}
function vLogin() {
  return `<div class="login"><div class="logo">${ic('star')}</div><h1>CAP</h1><span class="eyebrow">Connecte-toi avec le compte créé dans Supabase.</span>
  <form class="sec" data-form="login" style="width:100%"><input class="inp" type="email" name="email" id="li-e" placeholder="Email" autocomplete="email" required><input class="inp" type="password" name="pw" id="li-p" placeholder="Mot de passe" autocomplete="current-password" required>
  ${BUSY.login ? '<div class="loading"><span class="spin"></span>Connexion…</div>' : '<button class="btn">Se connecter</button>'}
  ${V.loginErr ? `<div class="alert" style="color:var(--red);background:rgba(255,107,107,.12)">${esc(V.loginErr)}</div>` : ''}</form></div>`;
}

/* ---------- feuilles (ajout rapide, journal, édition) ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function micBtn() { return SR ? `<button type="button" class="listen ${SH.listening ? 'on' : ''}" data-act="dictate"><span class="pulse">${ic('mic')}</span><span>${SH.listening ? 'Je t’écoute… touche pour arrêter' : 'Touche pour parler'}</span></button>` : ''; }
function addTabs(cur) { return `<div class="seg"><button class="${cur === 'add' ? 'on' : ''}" data-act="sMode" data-v="add">Tâche</button><button class="${cur === 'rem' ? 'on' : ''}" data-act="sMode" data-v="rem">Rappel / RDV</button></div>`; }
function sheetHtml() {
  if (!SH) return ''; const s = SH; let b = '';
  const close = `<button class="x" data-act="sheetClose" aria-label="Fermer">${ic('x')}</button>`;
  if (s.mode === 'add') {
    const t = today();
    b = `<div class="sheet-h"><h2>Nouvelle tâche</h2>${close}</div>${addTabs('add')}${micBtn()}
   <textarea class="inp" id="cap-text" style="min-height:72px" placeholder="Ce qui te vient en tête…">${esc(s.text || '')}</textarea>
   <div class="field"><span class="label">Projet</span><div class="chips">${S.projects.map((p) => `<button class="${s.pid === p.id ? 'on' : ''}" style="--c:var(--${p.color})" data-act="sPid" data-v="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>
   <div class="field"><span class="label">Quand</span><div class="chips">${[['', 'Sans date'], [t, "Aujourd'hui"], [addDays(t, 1), 'Demain']].map(([v, l]) => `<button class="${(s.due ?? t) === v ? 'on' : ''}" data-act="sDue" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="addf"><input class="inp" type="date" id="s-date" value="${esc(s.due || '')}" aria-label="Autre date"><input class="inp tm" type="time" id="s-time" value="${esc(s.time || '')}" aria-label="Heure du rappel"></div><span class="hint">${ic('bell', 'ico-xs')} Ajoute une heure pour recevoir un rappel.</span></div>
   <button class="btn" data-act="sAdd">Ajouter</button>`;
  } else if (s.mode === 'rem') {
    b = `<div class="sheet-h"><h2>${s.id ? 'Modifier le rappel' : 'Nouveau rappel'}</h2>${close}</div>${s.id ? '' : addTabs('rem')}
   <div class="field"><label class="label" for="rm-t">Titre</label><input class="inp" id="rm-t" value="${esc(s.title || '')}" placeholder="Ex : RDV coiffeur, appel client…"></div>
   <div class="addf"><div class="field" style="flex:1;min-width:0"><label class="label" for="rm-d">Date</label><input class="inp" type="date" id="rm-d" value="${esc(s.date || '')}"></div><div class="field"><label class="label" for="rm-h">Heure</label><input class="inp tm" type="time" id="rm-h" value="${esc(s.time || '')}"></div></div>
   <div class="field"><span class="label">Me prévenir (plusieurs choix possibles)</span><div class="chips">${ALERTS.map(([m, l]) => `<button class="${s.alerts.includes(m) ? 'on' : ''}" data-act="rmAlert" data-v="${m}">${m === 0 ? l : l + ' avant'}</button>`).join('')}</div></div>
   <div class="field"><span class="label">Répéter</span><div class="chips">${Object.entries(REPEAT).map(([k, l]) => `<button class="${(s.repeat || 'none') === k ? 'on' : ''}" data-act="rmRepeat" data-v="${k}">${l}</button>`).join('')}</div></div>
   <div class="field"><label class="label" for="rm-n">Note (optionnel)</label><input class="inp" id="rm-n" value="${esc(s.note || '')}" placeholder="Lieu, numéro, détail…"></div>
   <button class="btn" data-act="rmSave">${s.id ? 'Enregistrer' : 'Programmer le rappel'}</button>
   ${s.id ? (s.confirmDel ? `<div class="btn-row"><button class="btn ghost sm" data-act="rmUndel">Annuler</button><button class="btn red sm" data-act="rmDel">Supprimer</button></div>` : `<button class="danger" data-act="rmAskDel">Supprimer ce rappel</button>`) : ''}`;
  } else if (s.mode === 'log') {
    const x = theme(S, s.id); const i = x.kind === 'steps' ? curStep(x) : -1;
    b = `<div class="sheet-h"><h2>${x.kind === 'journal' ? 'Vidéo' : 'Session'} · ${esc(x.name)}</h2>${close}</div>`;
    if (x.kind === 'journal') b += `<div class="field"><label class="label" for="lg-t">Titre</label><input class="inp" id="lg-t" value="${esc(s.title || '')}" placeholder="Ex : La chute de Rome"></div><div class="field"><label class="label" for="lg-u">Lien (YouTube, Spotify…)</label><input class="inp" id="lg-u" type="url" inputmode="url" value="${esc(s.url || '')}" placeholder="https://…"></div>`;
    b += `<div class="field"><span class="label">${x.kind === 'journal' ? 'Ce que tu as retenu' : 'Ce que tu as fait'}</span>${micBtn()}<textarea class="inp" id="cap-text" placeholder="${x.kind === 'journal' ? 'Les idées que tu veux garder…' : 'Ex : 20 nouveaux mots, révision des phrases de base…'}">${esc(s.text || '')}</textarea></div>`;
    if (x.kind === 'counter') b += `<div class="field"><label class="label" for="lg-n">Nouveaux ${esc(x.unit)} appris</label><input class="inp" id="lg-n" type="number" inputmode="numeric" min="0" value="${s.n || ''}" placeholder="0"></div>`;
    if (x.kind === 'steps' && i >= 0) b += `<div class="field"><span class="label">Étape « ${esc(x.steps[i].t)} » terminée ?</span><div class="seg"><button class="${s.stepDone ? 'on' : ''}" data-act="sStep" data-v="1">Oui</button><button class="${!s.stepDone ? 'on' : ''}" data-act="sStep" data-v="0">Pas encore</button></div></div>`;
    b += `<button class="btn" data-act="sLog">Enregistrer</button>`;
  } else if (s.mode === 'project') {
    const p = s.id ? proj(S, s.id) : { name: '', sub: '', color: 'blue' }; const col = s.color || p.color;
    b = `<div class="sheet-h"><h2>${s.id ? 'Modifier le projet' : 'Nouveau projet'}</h2>${close}</div><form class="sec" data-form="projForm"><div class="field"><label class="label" for="pf-n">Nom</label><input class="inp" id="pf-n" name="name" value="${esc(p.name)}" required></div><div class="field"><label class="label" for="pf-s">Description courte</label><input class="inp" id="pf-s" name="sub" value="${esc(p.sub)}"></div>
   <div class="field"><span class="label">Couleur</span><div class="chips">${['blue', 'pink', 'cyan', 'violet', 'amber'].map((c) => `<button type="button" class="swatch ${col === c ? 'on' : ''}" style="--c:var(--${c})" data-act="sColor" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
   <button class="btn">${s.id ? 'Enregistrer' : 'Créer le projet'}</button></form>`;
  } else if (s.mode === 'routine') {
    const r = S.routines.find((x) => x.id === s.id);
    b = `<div class="sheet-h"><h2>Tâche quotidienne</h2>${close}</div><form class="sec" data-form="routineForm"><input class="inp" name="t" id="rf-t" value="${esc(r.title)}" required><div class="addf"><span class="label" style="flex:1">Heure du rappel</span><input class="inp tm" type="time" name="h" id="rf-h" value="${esc(r.time || '')}"></div><button class="btn">Enregistrer</button><button type="button" class="danger" data-act="routineDel" data-id="${r.id}">Supprimer cette tâche quotidienne</button></form>`;
  } else if (s.mode === 'theme') {
    const x = s.id ? theme(S, s.id) : { name: '', goal: '', type: 'pratique', kind: 'steps', total: 100, unit: 'mots' }; const type = s.type || x.type, kind = s.kind || x.kind;
    b = `<div class="sheet-h"><h2>${s.id ? 'Modifier le thème' : 'Nouveau thème'}</h2>${close}</div><form class="sec" data-form="themeForm"><div class="field"><label class="label" for="tf-n">Nom</label><input class="inp" id="tf-n" name="name" value="${esc(x.name)}" required placeholder="Ex : Espagnol"></div><div class="field"><label class="label" for="tf-g">Objectif</label><input class="inp" id="tf-g" name="goal" value="${esc(x.goal)}"></div>
   <div class="field"><span class="label">Type</span><div class="seg"><button type="button" class="${type === 'pratique' ? 'on' : ''}" data-act="sType" data-v="pratique">Pratique</button><button type="button" class="${type === 'video' ? 'on' : ''}" data-act="sType" data-v="video">Vidéo</button></div></div>
   <div class="field"><span class="label">Suivi</span><div class="seg"><button type="button" class="${kind === 'steps' ? 'on' : ''}" data-act="sKind" data-v="steps">Étapes</button><button type="button" class="${kind === 'counter' ? 'on' : ''}" data-act="sKind" data-v="counter">Compteur</button><button type="button" class="${kind === 'journal' ? 'on' : ''}" data-act="sKind" data-v="journal">Journal</button></div></div>
   ${kind === 'counter' ? `<div class="addf"><input class="inp" id="tf-t" name="total" type="number" min="1" value="${x.total || 100}" aria-label="Total"><input class="inp" id="tf-u" name="unit" value="${esc(x.unit || 'mots')}" aria-label="Unité"></div>` : ''}
   <button class="btn">${s.id ? 'Enregistrer' : 'Créer le thème'}</button></form>`;
  }
  return `<div class="sheet-bg" data-act="bgClose"><div class="sheet" role="dialog" aria-modal="true"><span class="grab"></span>${b}</div></div>`;
}

/* ---------- rendu ---------- */
function goBack() { const t = V.sub?.type; V.sub = V.prev || null; V.prev = null; if (t === 'bilan') V.tab = 'today'; setTimeout(render); return ''; }
function render() {
  if (!session) { $('#app').innerHTML = vLogin(); $('#nav').innerHTML = ''; $('#nav').hidden = true; $('#sheet').innerHTML = ''; return; }
  if (!S) return;
  $('#nav').hidden = false;
  const sub = V.sub;
  const h = sub ? { project: vProject, theme: vTheme, bilan: vBilan, week: vWeekType, reminders: vReminders }[sub.type](sub) : { today: vToday, plan: vPlanning, evolve: vEvolve, settings: vSettings }[V.tab]();
  $('#app').innerHTML = h;
  const tabs = [['today', 'Aujourd’hui', 'home'], ['plan', 'Planning', 'cal'], null, ['evolve', 'Évoluer', 'up'], ['settings', 'Réglages', 'gear']];
  $('#nav').innerHTML = `<div class="nav-in">${tabs.map((x) => (x ? `<button class="tab ${V.tab === x[0] && !sub ? 'on' : ''}" data-act="tab" data-v="${x[0]}">${ic(x[2])}<span>${x[1]}</span></button>` : `<button class="mic" data-act="add" aria-label="Ajouter une tâche">${ic('plus')}</button>`)).join('')}</div>`;
  $('#sheet').innerHTML = sheetHtml();
}
function go(v) { V = v; render(); window.scrollTo(0, 0); }
const open = (type, extra = {}) => { const prev = V.sub; go({ tab: V.tab, sub: { type, ...extra }, prev }); };
const scrollBottom = () => requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }
function readSheet() { const g = (id) => document.getElementById(id)?.value; if (!SH) return; for (const [id, k] of [['cap-text', 'text'], ['lg-t', 'title'], ['lg-u', 'url'], ['lg-n', 'n'], ['s-time', 'time'], ['rm-t', 'title'], ['rm-d', 'date'], ['rm-h', 'time'], ['rm-n', 'note']]) { const v = g(id); if (v !== undefined) SH[k] = v; } }
function openSheet(s) { SH = s; render(); if (s.focus !== 'none') setTimeout(() => document.getElementById(s.focus || 'cap-text')?.focus(), 60); }
function keep() { const o = {}; document.querySelectorAll('.sheet input').forEach((i) => { if (i.id) o[i.id] = i.value; }); return o; }
function restore(o) { for (const [k, v] of Object.entries(o)) { const el = document.getElementById(k); if (el) el.value = v; } }
function rerenderSheet(fn, skip) { const o = keep(); if (skip) delete o[skip]; readSheet(); fn(); render(); restore(o); }

/* ---------- micro (dictée du navigateur) ---------- */
let rec = null;
function startDictation() {
  if (!SR || rec) return;
  try {
    rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true;
    const base = SH.text ? SH.text.trim() + ' ' : '';
    rec.onresult = (e) => { let s = ''; for (const r of e.results) s += r[0].transcript; if (!SH) return; SH.text = base + s; const ta = document.getElementById('cap-text'); if (ta) ta.value = SH.text; };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Micro refusé : utilise le micro du clavier.'); };
    rec.onend = () => { rec = null; if (SH) { readSheet(); SH.listening = false; render(); } };
    rec.start(); SH.listening = true;
  } catch { rec = null; if (SH) SH.listening = false; }
}
const stopDictation = () => { if (rec) { try { rec.stop(); } catch {} } };

/* ---------- actions ---------- */
function setTask(x, p, done, k) { x.done = done; x.doneAt = done ? k || today() : null; }
const A = {
  tab: (e) => go({ tab: e.dataset.v, sub: null }),
  open: (e) => open(e.dataset.t, { id: e.dataset.id }),
  toggleDone: () => { LS.set('cap-done-open', !doneOpen()); render(); },
  calMode: (e) => { CAL.mode = e.dataset.v; render(); },
  calMove: (e) => { const n = +e.dataset.n; CAL.k = CAL.mode === 'day' ? addDays(CAL.k, n) : CAL.mode === 'week' ? addDays(CAL.k, 7 * n) : CAL.mode === 'month' ? shiftMonth(CAL.k, n) : shiftMonth(CAL.k, 12 * n); render(); window.scrollTo(0, 0); },
  calToday: () => { CAL.k = today(); render(); },
  calDay: (e) => { CAL.mode = 'day'; CAL.k = e.dataset.k; render(); window.scrollTo(0, 0); },
  calMonth: (e) => { CAL.mode = 'month'; CAL.k = e.dataset.k; render(); window.scrollTo(0, 0); },
  newProject: () => openSheet({ mode: 'project', focus: 'pf-n' }),
  newRem: (e) => openSheet({ mode: 'rem', date: e.dataset.k || today(), alerts: [15], repeat: 'none', focus: 'rm-t' }),
  editRem: (e) => { const r = S.reminders.find((x) => x.id === e.dataset.id); if (r) openSheet({ mode: 'rem', id: r.id, title: r.title, date: r.date, time: r.time, note: r.note, alerts: [...(r.alerts || [])], repeat: r.repeat || 'none', focus: 'none' }); },
  rmAlert: (e) => rerenderSheet(() => { const m = +e.dataset.v; const i = SH.alerts.indexOf(m); i < 0 ? SH.alerts.push(m) : SH.alerts.splice(i, 1); SH.alerts.sort((a, b) => a - b); }),
  rmRepeat: (e) => rerenderSheet(() => { SH.repeat = e.dataset.v; }),
  rmAskDel: () => rerenderSheet(() => { SH.confirmDel = true; }), rmUndel: () => rerenderSheet(() => { SH.confirmDel = false; }),
  rmDel: () => { S.reminders = S.reminders.filter((x) => x.id !== SH.id); SH = null; save(); render(); toast('Rappel supprimé'); },
  rmSave: () => {
    readSheet(); const title = (SH.title || '').trim();
    if (!title) return toast('Donne un titre au rappel.'); if (!SH.date) return toast('Choisis une date.'); if (!SH.time) return toast('Choisis une heure.');
    const o = { title, date: SH.date, time: SH.time, note: (SH.note || '').trim(), alerts: SH.alerts.length ? SH.alerts : [0], repeat: SH.repeat || 'none' };
    S.reminders ??= [];
    if (SH.id) Object.assign(S.reminders.find((x) => x.id === SH.id), o); else S.reminders.push({ id: rid(), ...o });
    SH = null; save(); render(); toast(pushState === 'on' || pushState === 'unknown' ? 'Rappel programmé ✓' : 'Rappel programmé ✓ Active les notifications dans Réglages.');
  },
  sMode: (e) => {
    readSheet(); const v = e.dataset.v; if (v === SH.mode) return;
    SH = v === 'rem' ? { mode: 'rem', title: SH.text || '', date: SH.due || today(), time: SH.time || '', alerts: [15], repeat: 'none', focus: 'rm-t' } : { mode: 'add', text: SH.title || '', pid: S.projects[0]?.id, due: SH.date || today(), time: SH.time || '' };
    render();
  },
  back: () => { goBack(); window.scrollTo(0, 0); },
  coran: (e) => { const D = day(e.dataset.k); D.coran = !D.coran; if (D.coran && e.dataset.k === today()) toast('Règle d’or validée ✓'); save(); render(); },
  routine: (e) => { const D = day(e.dataset.k); D.routines ??= []; const i = D.routines.indexOf(e.dataset.id); i < 0 ? D.routines.push(e.dataset.id) : D.routines.splice(i, 1); save(); render(); toast(i < 0 ? 'Fait ✓' : 'Remis à faire'); },
  task: (e) => { const f = findTask(e.dataset.id); if (!f) return; setTask(f.t, f.p, !f.t.done, e.dataset.k); save(); render(); toast(f.t.done ? 'Fait ✓' : 'Remis à faire'); },
  evolve: (e) => {
    const D = day(e.dataset.k); D.evolve ??= {}; const kind = e.dataset.kind;
    if (D.evolve[kind]) { D.evolve[kind] = false; save(); return render(); }
    D.evolve[kind] = true; save(); render();
    const x = theme(S, e.dataset.id); if (x) openSheet({ mode: 'log', id: x.id, k: e.dataset.k, kind, focus: x.kind === 'journal' ? 'lg-t' : 'cap-text' });
  },
  taskDel: (e) => { const f = findTask(e.dataset.id); if (f) { f.p.tasks = f.p.tasks.filter((x) => x !== f.t); save(); render(); } },
  ptab: (e) => { V.sub.tab = e.dataset.v; render(); },
  confirm: () => { V.sub.confirm = true; render(); scrollBottom(); }, unconfirm: () => { V.sub.confirm = false; render(); },
  projDel: (e) => { const id = e.dataset.id; S.projects = S.projects.filter((p) => p.id !== id); S.routines = S.routines.filter((r) => r.projectId !== id); save(); go({ tab: 'today', sub: null }); },
  themeDel: (e) => { const id = e.dataset.id; S.themes = S.themes.filter((x) => x.id !== id); for (const d of Object.keys(S.week)) for (const k of ['pratique', 'video']) if (S.week[d][k] === id) S.week[d][k] = ''; save(); go({ tab: 'evolve', sub: null }); },
  editProject: (e) => openSheet({ mode: 'project', id: e.dataset.id, focus: 'pf-n' }),
  newTheme: () => openSheet({ mode: 'theme', focus: 'tf-n' }), editTheme: (e) => openSheet({ mode: 'theme', id: e.dataset.id }),
  routineEdit: (e) => openSheet({ mode: 'routine', id: e.dataset.id, focus: 'rf-t' }),
  routineDel: (e) => { S.routines = S.routines.filter((r) => r.id !== e.dataset.id); SH = null; save(); render(); },
  stepToggle: (e) => { const x = theme(S, V.sub.id); const s = x.steps[+e.dataset.i]; s.done = !s.done; if (s.done) x.logs.unshift({ date: today(), text: 'Étape terminée : ' + s.t, step: s.t }); save(); render(); },
  editSteps: () => { V.sub.edit = true; render(); },
  editDone: () => { const x = theme(S, V.sub.id); saveSteps(x); V.sub.edit = false; save(); render(); },
  stepDel: (e) => { const x = theme(S, V.sub.id); saveSteps(x); x.steps.splice(+e.dataset.i, 1); save(); render(); },
  cnt: (e) => { const x = theme(S, V.sub.id); const n = +e.dataset.n; x.count = Math.max(0, Math.min(x.total, x.count + n)); save(); render(); },
  linkDel: (e) => { theme(S, V.sub.id).links.splice(+e.dataset.i, 1); save(); render(); },
  logDel: (e) => { theme(S, V.sub.id).logs.splice(+e.dataset.i, 1); save(); render(); },
  log: (e) => { const x = theme(S, e.dataset.id); openSheet({ mode: 'log', id: x.id, k: today(), focus: x.kind === 'journal' ? 'lg-t' : 'cap-text' }); },
  add: () => { const pid = V.sub?.type === 'project' ? V.sub.id : S.projects[0]?.id; openSheet({ mode: 'add', pid, due: V.tab === 'plan' && CAL.mode === 'day' && !V.sub ? CAL.k : today() }); },
  sPid: (e) => rerenderSheet(() => { SH.pid = e.dataset.v; }),
  sDue: (e) => rerenderSheet(() => { SH.due = e.dataset.v; }, 's-date'),
  sAdd: () => {
    readSheet(); stopDictation(); const title = (SH.text || '').trim(); if (!title) return toast('Écris d’abord ta tâche.');
    const p = proj(S, SH.pid) || S.projects[0]; const time = SH.time || null; const due = SH.due === undefined ? today() : SH.due || (time ? today() : null);
    p.tasks.push({ id: rid(), title, due, time, done: false, doneAt: null }); SH = null; save(); render(); toast(`Ajouté dans ${p.name} ✓`);
  },
  sStep: (e) => rerenderSheet(() => { SH.stepDone = e.dataset.v === '1'; }),
  sLog: () => {
    readSheet(); stopDictation(); const x = theme(S, SH.id); const text = (SH.text || '').trim(); const k = SH.k || today();
    if (x.kind === 'journal') { if (!(SH.title || '').trim() && !text) return toast('Donne au moins le titre.'); let url = (SH.url || '').trim(); if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url; x.logs.unshift({ date: k, title: (SH.title || '').trim(), url, text }); }
    else {
      const n = Math.max(0, parseInt(SH.n) || 0); let step = null;
      if (x.kind === 'counter' && n) x.count = Math.min(x.total, x.count + n);
      if (x.kind === 'steps' && SH.stepDone) { const i = curStep(x); if (i >= 0) { x.steps[i].done = true; step = x.steps[i].t; } }
      x.logs.unshift({ date: k, text: [n ? `+${n} ${x.unit}` : '', text].filter(Boolean).join(' · ') || 'Session faite', step });
    }
    // Marque la pratique/vidéo du jour comme faite si c'est le thème prévu
    const plan = planFor(S, k); const D = day(k); D.evolve ??= {}; if (plan[x.type]?.id === x.id) D.evolve[x.type] = true;
    SH = null; save(); render(); toast('Enregistré ✓');
  },
  sColor: (e) => rerenderSheet(() => { SH.color = e.dataset.v; }),
  sType: (e) => rerenderSheet(() => { SH.type = e.dataset.v; }), sKind: (e) => rerenderSheet(() => { SH.kind = e.dataset.v; }),
  bTomorrow: (e) => { const f = findTask(e.dataset.id); if (f) { f.t.due = addDays(today(), 1); toast('Reporté à demain'); save(); render(); } },
  bSave: () => { const it = bilanItems(today()); day(today()).bilan = { score: it.filter((x) => x.done).length, total: it.length, note: $('#bilan-note').value.trim(), at: Date.now() }; save(); toast('Journée validée ✓'); go({ tab: 'today', sub: null }); },
  sheetClose: () => { stopDictation(); SH = null; render(); },
  dictate: () => { readSheet(); if (rec) stopDictation(); else { startDictation(); render(); } },
  enablePush: () => enablePush(), testPush: () => testPush(),
  logout: async () => { await flush(); await sb.auth.signOut(); session = null; S = null; V = { tab: 'today', sub: null }; render(); },
};
function saveSteps(x) { document.querySelectorAll('[data-step]').forEach((inp) => { const k = +inp.dataset.step; if (x.steps[k]) x.steps[k].t = inp.value.trim() || x.steps[k].t; }); }

const F = {
  login: async (f, d) => {
    BUSY.login = true; V.loginErr = ''; render();
    const { data, error } = await sb.auth.signInWithPassword({ email: d.get('email').trim(), password: d.get('pw') });
    BUSY.login = false;
    if (error) { V.loginErr = /invalid/i.test(error.message) ? 'Email ou mot de passe incorrect.' : 'Connexion impossible : ' + error.message; return render(); }
    session = data.session; await startSession();
  },
  quickTask: (f, d) => {
    const t = d.get('t').trim(); if (!t) return; const p = proj(S, f.dataset.id); const time = d.get('h') || null; const k = f.dataset.k;
    p.tasks.push({ id: rid(), title: t, due: k === today() && !time ? null : k, time, done: false, doneAt: null }); save(); render(); document.getElementById('qa-' + p.id)?.focus();
  },
  addRoutine: (f, d) => { const t = d.get('t').trim(); if (!t) return; S.routines.push({ id: rid(), title: t, projectId: f.dataset.id, time: d.get('h') || null }); save(); render(); },
  addTask: (f, d) => { const t = d.get('t').trim(); if (!t) return; const p = proj(S, f.dataset.id); const time = d.get('h') || null; p.tasks.push({ id: rid(), title: t, due: d.get('d') || (time ? today() : null), time, done: false, doneAt: null }); save(); render(); document.getElementById('task-in')?.focus(); },
  addLink: (f, d) => { let u = d.get('url').trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; theme(S, V.sub.id).links.push({ title: d.get('title').trim(), url: u }); save(); render(); },
  addStep: (f, d) => { const t = d.get('t').trim(); if (!t) return; const x = theme(S, V.sub.id); saveSteps(x); x.steps.push({ t, done: false }); save(); render(); document.getElementById('step-new')?.focus(); },
  setCount: (f, d) => { const x = theme(S, V.sub.id); const n = parseInt(d.get('n')); if (isNaN(n)) return; x.count = Math.max(0, Math.min(x.total, n)); save(); render(); },
  projForm: (f, d) => {
    const o = { name: d.get('name').trim(), sub: d.get('sub').trim(), color: SH.color || (SH.id ? proj(S, SH.id).color : 'blue') }; if (!o.name) return;
    if (SH.id) Object.assign(proj(S, SH.id), o); else S.projects.push({ id: rid(), ...o, tasks: [] });
    SH = null; save(); render();
  },
  routineForm: (f, d) => { const r = S.routines.find((x) => x.id === SH.id); r.title = d.get('t').trim() || r.title; r.time = d.get('h') || null; SH = null; save(); render(); },
  themeForm: (f, d) => {
    const name = d.get('name').trim(); if (!name) return; const base = SH.id ? theme(S, SH.id) : null; const type = SH.type || base?.type || 'pratique', kind = SH.kind || base?.kind || 'steps';
    const o = { name, goal: d.get('goal').trim(), type, kind, icon: base?.icon || (type === 'video' ? 'head' : 'route') };
    if (kind === 'counter') { o.total = Math.max(1, parseInt(d.get('total')) || 100); o.unit = (d.get('unit') || '').trim() || 'éléments'; o.count = Math.min(base?.count || 0, o.total); }
    if (base) { Object.assign(base, o); SH = null; save(); return render(); }
    const id = rid(); S.themes.push({ id, ...o, steps: [], logs: [], links: [], count: o.count || 0 }); SH = null; save(); open('theme', { id });
  },
};
document.addEventListener('click', (ev) => { const el = ev.target.closest('[data-act]'); if (!el || el.disabled) return; if (el.dataset.act === 'bgClose') { if (ev.target === el) A.sheetClose(); return; } const fn = A[el.dataset.act]; if (!fn) return; ev.preventDefault(); fn(el, ev); });
document.addEventListener('submit', (ev) => { const f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault(); const fn = F[f.dataset.form]; if (fn) fn(f, new FormData(f)); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && SH) A.sheetClose(); });
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.notif) { S.settings.notif[el.dataset.notif] = el.checked; save(); }
  if (el.dataset.set && /^\d{2}:\d{2}$/.test(el.value)) { S.settings[el.dataset.set] = el.value; save(); toast('Enregistré ✓'); }
  if (el.dataset.week) { const d = el.dataset.week; S.week[d] ??= {}; S.week[d][el.dataset.kind] = el.value; save(); toast('Semaine type mise à jour ✓'); }
  if (el.id === 's-date' && SH) { rerenderSheet(() => { SH.due = el.value; }); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { pull(); render(); } else if (dirty) flush(); });
window.addEventListener('online', () => { flush(); render(); });
window.addEventListener('offline', () => render());

/* ---------- démarrage ---------- */
function applyDeepLink() {
  const v = new URLSearchParams(location.search).get('v');
  if (v === 'bilan') V = { tab: 'today', sub: { type: 'bilan' } }; else if (v) V = { tab: 'today', sub: null };
  if (v) history.replaceState(null, '', '/');
}
async function startSession() {
  S = migrate(LS.get(lsKey()) || defaultState()); lastSync = LS.get(lsKey() + '-sync') || 0;
  applyDeepLink(); render(); await pull(); checkPush().then(() => { if (V.tab === 'settings') render(); });
}
(async function boot() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn(e));
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'open' && e.data.url) { history.replaceState(null, '', e.data.url); applyDeepLink(); render(); } });
  }
  cfg = LS.get('cap-cfg');
  try { const r = await fetch('/api/config', { cache: 'no-store' }); if (r.ok) { cfg = await r.json(); LS.set('cap-cfg', cfg); } } catch {}
  if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) { $('#app').innerHTML = `<div class="login"><h1>CAP</h1><div class="card empty">Configuration manquante : ajoute les variables Supabase dans Vercel, puis redéploie.</div></div>`; return; }
  sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'cap-auth' } });
  const { data } = await sb.auth.getSession(); session = data.session;
  sb.auth.onAuthStateChange((_e, s) => { if (s) session = s; });
  if (session) await startSession(); else render();
})();
