import { createClient } from '/vendor/supabase.js';
import { z, dkey, pk, addDays, frDate, daysBetween, rid, rel, COL, st, defaultState, migrate, curStep, lastLog, pPct, podStreak, ctx, planPrompt, cleanPlan } from '/lib/shared.js';

/* ---------- utilitaires ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
function dueLabel(k) { if (!k) return ''; const t = dkey(); if (k < t) return 'En retard'; if (k === t) return "Aujourd'hui"; if (k === addDays(t, 1)) return 'Demain'; return frDate(k, { weekday: 'short', day: 'numeric', month: 'short' }); }
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };

const P = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" stroke="none"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/><path d="M7 11h5M7 15h5"/>',
  head: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/>',
  warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.4"/>', send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const ic = (n, c = 'ico') => `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
function ring(p, col, s, label, fs) { const r = (s - 10) / 2, c = 2 * Math.PI * r, o = c * (1 - Math.max(0, Math.min(1, p))); return `<svg class="ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="${esc(label)}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--${col})" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" transform="rotate(-90 ${s / 2} ${s / 2})"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="var(--fg)" font-size="${fs || s / 4.4}" font-weight="800">${esc(label)}</text></svg>`; }

/* ---------- état ---------- */
let S = null, sb = null, session = null, cfg = null, saveT = null, dirty = false, lastSync = 0, saving = false;
let V = { tab: 'today', sub: null }, SH = null; const BUSY = {};
const uid = () => session?.user?.id;
const lsKey = () => 'cap-state-' + (uid() || 'local');
const day = (k = dkey()) => (S.days[k] ??= {});
const proj = (id) => S.projects.find((p) => p.id === id);
const parc = (id) => S.parcours.find((p) => p.id === id);
const allTasks = () => S.projects.flatMap((p) => p.tasks.map((t) => ({ p, t })));
const findTask = (id) => allTasks().find((x) => x.t.id === id);
const touch = (p) => { p.lastAt = dkey(); };

function trim() { const t = dkey(); for (const k of Object.keys(S.days)) if (daysBetween(k, t) > 60) delete S.days[k]; S.chat = S.chat.slice(-30); S.parcours.forEach((p) => (p.logs = p.logs.slice(0, 80))); S.projects.forEach((p) => { p.notes = p.notes.slice(0, 60); p.tasks = p.tasks.filter((x) => !x.done || !x.doneAt || daysBetween(x.doneAt, t) < 45); }); }
function save() { dirty = true; LS.set(lsKey(), S); clearTimeout(saveT); saveT = setTimeout(flush, 500); }
async function flush() {
  clearTimeout(saveT); trim(); LS.set(lsKey(), S);
  if (!session || !navigator.onLine || saving) { if (saving) saveT = setTimeout(flush, 800); return; }
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
  if (!data) return flush();
  const ts = Date.parse(data.updated_at);
  if (ts > lastSync && !dirty) { S = migrate(data.data); lastSync = ts; LS.set(lsKey(), S); LS.set(lsKey() + '-sync', ts); render(); }
}

/* ---------- vues ---------- */
function vLogin() {
  return `<div class="login"><div class="logo">${ic('spark')}</div><h1>CAP</h1><span class="eyebrow">Connecte-toi avec le compte créé dans Supabase.</span>
  <form class="sec" data-form="login" style="width:100%"><input class="inp" type="email" name="email" id="li-e" placeholder="Email" autocomplete="email" required><input class="inp" type="password" name="pw" id="li-p" placeholder="Mot de passe" autocomplete="current-password" required>
  ${BUSY.login ? '<div class="loading"><span class="spin"></span>Connexion…</div>' : '<button class="btn">Se connecter</button>'}
  ${V.loginErr ? `<div class="alert" style="color:var(--red);background:rgba(255,107,107,.12)">${esc(V.loginErr)}</div>` : ''}</form></div>`;
}

function vToday() {
  const t = dkey(), D = S.days[t] || {}, h = new Date().getHours();
  const prios = D.plan?.priorities || []; const pTask = new Set(prios.map((p) => p.taskId).filter(Boolean));
  const due = allTasks().filter(({ t: x }) => !pTask.has(x.id) && ((!x.done && x.due && x.due <= t) || x.doneAt === t)).sort((a, b) => a.t.done - b.t.done || (a.t.due || '').localeCompare(b.t.due || '') || (a.t.time || '99').localeCompare(b.t.time || '99'));
  const rdone = D.routines || []; const carry = D.carry || [];
  const podToday = S.podcasts.find((x) => x.date === t);
  let banner;
  if (BUSY.plan) banner = `<div class="loading"><span class="spin"></span>Le coach regarde tes projets…</div>`;
  else if (D.plan && D.plan.message) banner = `<div class="coach-msg">${esc(D.plan.message)}</div><button class="link" style="align-self:flex-start" data-act="plan">Refaire mon plan</button>`;
  else banner = `<div class="coach-msg">${carry.length ? 'Reporté d’hier : ' + esc(carry.join(', ')) : 'Pas encore de plan pour aujourd’hui.'}</div><button class="btn sm" style="align-self:flex-start" data-act="plan">${ic('spark', 'ico-s')} Faire mon plan du jour</button>`;
  return `
 <div class="head"><div class="head-l"><span class="eyebrow">${esc(cap(frDate(t)))}</span><h1>${h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour'} 👋</h1></div><button class="iconbtn" data-act="open" data-t="settings" aria-label="Réglages">${ic('gear')}</button></div>
 ${!navigator.onLine ? `<div class="alert">${ic('warn', 'ico-s')} Hors ligne : tes changements seront envoyés au retour du réseau.</div>` : ''}
 <div class="card coach">${ic('spark', 'ico spark')}<div class="coach-body">${banner}</div></div>
 <div class="sec"><div class="sec-h"><h2>3 priorités</h2><span class="count">${prios.filter((p) => p.done).length} / ${prios.length}</span></div>
  ${prios.map((p, i) => { const c = COL[p.cat] || 'amber'; const nm = p.projectId ? proj(p.projectId)?.name : p.parcoursId ? parc(p.parcoursId)?.name : ''; return `<div class="prio ${p.done ? 'done' : ''}" style="--c:var(--${c})"><span class="num">${i + 1}</span><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span class="t" style="${p.done ? 'color:var(--dim);text-decoration:line-through' : ''}">${esc(p.text)}</span>${nm ? `<span><span class="pill p-${c}">${esc(nm)}</span></span>` : ''}</div><button class="chk ${p.done ? 'on' : ''}" data-act="prio" data-id="${p.id}" aria-label="Fait">${p.done ? ic('check') : ''}</button></div>`; }).join('')}
  ${prios.length < 3 ? `<form class="addf" data-form="addPrio"><input class="inp" id="prio-in" name="t" placeholder="Ajouter une priorité" autocomplete="off"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form>` : ''}
 </div>
 ${S.routines.length ? `<div class="sec"><div class="sec-h"><h2>Routine du jour</h2><span class="count">${rdone.length} / ${S.routines.length}</span></div><div class="list">${S.routines.map((r) => { const on = rdone.includes(r.id); return `<div class="row ${on ? 'done' : ''}"><button class="chk ${on ? 'on' : ''}" data-act="routine" data-id="${r.id}" aria-label="Fait">${on ? ic('check') : ''}</button><div class="txt"><span class="t">${esc(r.title)}</span></div><span class="pill p-blue">${esc(proj(r.projectId)?.name || '')}</span></div>`; }).join('')}</div></div>` : ''}
 <div class="sec"><div class="sec-h"><h2>À faire aujourd’hui</h2><span class="count">${due.filter((x) => x.t.done).length} / ${due.length}</span></div>
  ${due.length ? `<div class="list">${due.map(({ p, t: x }) => taskRow(x, p.name)).join('')}</div>` : `<div class="card empty">Aucune tâche datée pour aujourd’hui. Touche le micro pour en ajouter.</div>`}</div>
 <div class="sec"><div class="sec-h"><h2>Parcours</h2><button class="link" data-act="tab" data-v="parcours">Tout voir</button></div>
  <div class="grid2">${S.parcours.map((p) => { const c = COL[p.cat]; const today = lastLog(p) === t; return `<button class="mini" data-act="open" data-t="parcours" data-id="${p.id}"><span class="n">${esc(p.name)}</span><div class="bar" style="--c:var(--${c})"><i style="width:${Math.round(pPct(p) * 100)}%"></i></div><span class="s">${today ? '✓ Point fait aujourd’hui' : 'Dernier point : ' + rel(lastLog(p))}</span></button>`; }).join('')}
  <button class="mini" data-act="open" data-t="podcasts"><span class="n">Podcast du jour</span><div class="bar" style="--c:var(--orange)"><i style="width:${podToday ? 100 : 0}%"></i></div><span class="s">${podToday ? '✓ ' + esc(podToday.title) : 'Pas encore écouté'}</span></button></div></div>
 <button class="card coach" style="text-align:left;width:100%;${h >= 18 ? '' : 'border-color:var(--line);background:var(--card)'}" data-act="open" data-t="bilan">${ic('moon', 'ico spark')}<div class="coach-body"><span class="coach-msg">Bilan du soir</span><span class="coach-sub">${D.bilan ? 'Journée validée ✓' : 'Fais le point sur ta journée en 1 minute.'}</span></div></button>`;
}
function taskMeta(x) { if (x.done || !x.due) return ''; const late = x.due < dkey(); return `<span style="${late ? 'color:var(--red)' : ''}">${dueLabel(x.due)}${x.time ? ' · ' + x.time : ''}</span>`; }
function taskRow(x, pname) { return `<div class="row ${x.done ? 'done' : ''}"><button class="chk ${x.done ? 'on' : ''}" data-act="task" data-id="${x.id}" aria-label="Fait">${x.done ? ic('check') : ''}</button><div class="txt"><span class="t">${esc(x.title)}</span><span class="s">${pname ? esc(pname) + (x.due && !x.done ? ' · ' : '') : ''}${taskMeta(x)}</span></div>${x.time && !x.done ? `<span style="color:var(--amber)">${ic('bell', 'ico-s')}</span>` : ''}</div>`; }

function projStats(p) { const tot = p.tasks.length, dn = p.tasks.filter((t) => t.done).length; const open = p.tasks.filter((t) => !t.done).sort((a, b) => (a.due || '9').localeCompare(b.due || '9')); return { tot, dn, open, next: open[0] }; }
function vProjects() {
  return `<div class="head"><div class="head-l"><h1>Projets</h1><span class="eyebrow">${S.projects.length} projets</span></div><button class="iconbtn" data-act="newProject" aria-label="Nouveau projet">${ic('plus')}</button></div>
 ${S.projects.map((p) => { const s = projStats(p); const stale = p.lastAt && daysBetween(p.lastAt, dkey()) >= 3 && s.open.length; const pct = s.tot ? Math.round((s.dn / s.tot) * 100) : 0; const nd = s.open.find((t) => t.due); return `<button class="pc" style="--c:var(--blue);--cs:var(--blue-soft)" data-act="open" data-t="project" data-id="${p.id}">
  <div class="pc-top"><span class="badge">${ic('folder')}</span><div style="flex:1;min-width:0"><div class="pc-name">${esc(p.name)}</div><div class="pc-sub">${esc(p.sub)}</div></div><span class="pct">${pct} %</span></div>
  <div class="bar" style="--c:var(--blue)"><i style="width:${pct}%"></i></div>
  ${s.next ? `<div class="pc-next"><span class="pc-sub">Prochaine action</span><br><b>${esc(s.next.title)}</b></div>` : `<div class="pc-sub">Aucune tâche ouverte</div>`}
  <div class="pc-meta"><span>${s.open.length} tâche${s.open.length > 1 ? 's' : ''}</span>${nd ? `<span>Échéance : ${dueLabel(nd.due)}</span>` : ''}</div>
  ${stale ? `<div class="alert">${ic('warn', 'ico-s')} Aucune avancée depuis ${daysBetween(p.lastAt, dkey())} jours</div>` : ''}</button>`; }).join('')}`;
}

function vProject({ id, tab = 'todo', confirm }) {
  const p = proj(id); if (!p) return goBack(); const s = projStats(p); const rs = S.routines.filter((r) => r.projectId === id);
  const list = tab === 'todo' ? s.open : p.tasks.filter((t) => t.done);
  return `<button class="back" data-act="back">${ic('back')} Projets</button>
 <div class="head"><div class="head-l"><h1>${esc(p.name)}</h1><span class="eyebrow">${esc(p.sub)}</span></div><button class="iconbtn" data-act="editProject" data-id="${id}" aria-label="Modifier">${ic('edit')}</button></div>
 ${p.goal ? `<div class="card goal"><span class="goal-l">Objectif</span><span class="goal-t">${esc(p.goal)}</span><div class="bar" style="--c:var(--blue)"><i style="width:${s.tot ? Math.round((s.dn / s.tot) * 100) : 0}%"></i></div><span class="pc-sub">${s.dn} / ${s.tot} tâches faites</span></div>` : ''}
 <div class="card sec"><div class="sec-h"><h2 style="display:flex;gap:8px;align-items:center"><span style="color:var(--amber)">${ic('spark', 'ico-s')}</span>Mémoire du projet</h2></div>
  ${p.memory.length ? p.memory.map((m, i) => `<div class="bul"><span>${esc(m)}</span><button class="x" data-act="memDel" data-id="${id}" data-i="${i}" aria-label="Retirer">${ic('x', 'ico-s')}</button></div>`).join('') : `<span class="pc-sub">Infos clés du projet (cible, offre, ce qui bloque…). Le coach s’en sert pour te conseiller.</span>`}
  <form class="addf" data-form="addMem" data-id="${id}"><input class="inp" name="t" id="mem-in" placeholder="Ajouter une info clé" autocomplete="off"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form></div>
 ${rs.length || id === 'dycom' ? `<div class="sec"><h2>Routine quotidienne</h2><div class="list">${rs.map((r) => `<div class="row"><div class="txt"><span class="t">${esc(r.title)}</span></div><button class="x" data-act="routineDel" data-id="${r.id}" aria-label="Retirer">${ic('x', 'ico-s')}</button></div>`).join('')}<form class="row addf" data-form="addRoutine" data-id="${id}"><input class="inp" name="t" id="rout-in" placeholder="Ajouter une tâche quotidienne" autocomplete="off"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form></div></div>` : ''}
 <div class="sec"><div class="sec-h"><h2>Tâches</h2><div class="tabs"><button class="${tab === 'todo' ? 'on' : ''}" data-act="ptab" data-v="todo">À faire ${s.open.length}</button><button class="${tab === 'done' ? 'on' : ''}" data-act="ptab" data-v="done">Fait ${s.dn}</button></div></div>
  <form class="card sec" data-form="addTask" data-id="${id}" style="gap:8px"><input class="inp" name="t" id="task-in" placeholder="Nouvelle tâche" autocomplete="off"><div class="addf"><input class="inp" type="date" name="d" id="task-d" aria-label="Date"><input class="inp" type="time" name="h" id="task-h" aria-label="Heure du rappel"><button class="btn sm" style="flex:1">Ajouter</button></div><span class="hint">${ic('bell', 'ico-s')} Mets une date et une heure pour recevoir un rappel.</span></form>
  ${list.length ? `<div class="list">${list.map((x) => `<div class="row ${x.done ? 'done' : ''}"><button class="chk ${x.done ? 'on' : ''}" data-act="task" data-id="${x.id}" aria-label="Fait">${x.done ? ic('check') : ''}</button><div class="txt"><span class="t">${esc(x.title)}</span>${x.due && !x.done ? `<span class="s">${taskMeta(x)}</span>` : ''}</div><button class="x" data-act="taskDel" data-id="${x.id}" aria-label="Supprimer">${ic('x', 'ico-s')}</button></div>`).join('')}</div>` : `<div class="empty">${tab === 'todo' ? 'Rien à faire ici pour l’instant.' : 'Aucune tâche terminée.'}</div>`}</div>
 <div class="sec"><h2>Notes</h2><form class="addf" data-form="addNote" data-id="${id}"><input class="inp" name="t" id="note-in" placeholder="Ajouter une note" autocomplete="off"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form>
  ${p.notes.length ? `<div class="card">${p.notes.map((n, i) => `<div class="log"><div style="display:flex;justify-content:space-between;gap:8px"><span class="d">${esc(cap(rel(n.date)))}</span><button class="x" style="width:22px;height:22px" data-act="noteDel" data-id="${id}" data-i="${i}" aria-label="Supprimer">${ic('x', 'ico-s')}</button></div><span class="x2">${esc(n.text)}</span></div>`).join('')}</div>` : ''}</div>
 ${confirm ? `<div class="card confirm"><span>Supprimer « ${esc(p.name)} » et toutes ses tâches ?</span><div class="btn-row"><button class="btn ghost sm" data-act="unconfirm">Annuler</button><button class="btn red sm" data-act="projDel" data-id="${id}">Supprimer</button></div></div>` : `<button class="danger" data-act="confirm">Supprimer le projet</button>`}`;
}

function vParcoursList() {
  const t = dkey(); const wk = S.podcasts.filter((x) => daysBetween(x.date, t) < 7).length;
  return `<div class="head"><div class="head-l"><h1>Parcours</h1><span class="eyebrow">Tu apprends sur YouTube, Google… ici tu suis où tu en es.</span></div><button class="iconbtn" data-act="newParcours" aria-label="Nouveau parcours">${ic('plus')}</button></div>
 ${S.parcours.map((p) => { const c = COL[p.cat]; const i = curStep(p); const pct = Math.round(pPct(p) * 100); return `<button class="pc" style="--c:var(--${c});--cs:var(--${c}-soft)" data-act="open" data-t="parcours" data-id="${p.id}">
  <div class="pc-top"><span class="badge">${ic(p.icon || 'route')}</span><div style="flex:1;min-width:0"><div class="pc-name">${esc(p.name)}</div><div class="pc-sub">${p.kind === 'counter' ? `${p.count} / ${p.total} ${esc(p.unit)}` : i < 0 ? (p.steps.length ? 'Parcours terminé ✓' : 'Guide à créer') : esc(p.steps[i].t)}</div></div><span class="pct">${pct} %</span></div>
  <div class="bar" style="--c:var(--${c})"><i style="width:${pct}%"></i></div>
  <div class="pc-meta"><span>Dernier point : ${rel(lastLog(p))}</span>${p.kind !== 'counter' && p.steps.length ? `<span>${p.steps.filter((s) => s.done).length} / ${p.steps.length} étapes</span>` : ''}</div></button>`; }).join('')}
 <button class="pc" style="--c:var(--orange);--cs:var(--orange-soft)" data-act="open" data-t="podcasts"><div class="pc-top"><span class="badge">${ic('head')}</span><div style="flex:1;min-width:0"><div class="pc-name">Podcasts</div><div class="pc-sub">Objectif : 1 par jour</div></div><span class="pct">${wk} / 7</span></div><div class="bar" style="--c:var(--orange)"><i style="width:${Math.min(100, (wk / 7) * 100)}%"></i></div><div class="pc-meta"><span>Cette semaine</span><span>${S.podcasts.length} écoutés au total</span></div></button>`;
}

function vParcours({ id, edit, confirm }) {
  const p = parc(id); if (!p) return goBack(); const c = COL[p.cat], cs = c + '-soft'; const i = curStep(p); const pct = pPct(p);
  const gen = (label) => `<button class="btn ${p.steps.length ? 'ghost' : ''}" data-act="genGuide" ${BUSY.guide ? 'disabled' : ''}>${BUSY.guide ? '<span class="spin"></span> Le coach prépare le guide…' : ic('spark', 'ico-s') + ' ' + label}</button>`;
  const stepsHtml = edit ? `<div class="sec">${p.steps.map((s, k) => `<div class="addf"><input class="inp" id="step-${k}" data-step="${k}" value="${esc(s.t)}"><button class="x" data-act="stepDel" data-i="${k}" aria-label="Retirer">${ic('x', 'ico-s')}</button></div>`).join('')}
   <form class="addf" data-form="addStep"><input class="inp" name="t" id="step-new" placeholder="Nouvelle étape" autocomplete="off"><button class="iconbtn" aria-label="Ajouter">${ic('plus')}</button></form>
   ${gen('Regénérer le guide avec l’IA')}<button class="btn" data-act="editDone">Enregistrer le guide</button></div>`
    : p.steps.length ? `<div class="steps" style="--c:var(--${c});--cs:var(--${cs})">${p.steps.map((s, k) => `<button class="step ${s.done ? 'ok' : ''} ${k === i ? 'cur' : ''}" data-act="stepToggle" data-i="${k}"><span class="dot">${s.done ? ic('check') : ''}</span><span class="st">${esc(s.t)}</span></button>`).join('')}</div>`
      : `<div class="sec"><span class="pc-sub">Pas encore de guide pour ce parcours.</span>${gen('Créer le guide avec l’IA')}<button class="btn ghost" data-act="editSteps">Écrire les étapes moi-même</button></div>`;
  return `<button class="back" data-act="back">${ic('back')} Parcours</button>
 <div class="head"><div class="head-l"><h1>${esc(p.name)}</h1></div><button class="iconbtn" data-act="editParcours" data-id="${id}" aria-label="Modifier">${ic('edit')}</button></div>
 <div class="card ringwrap">${ring(pct, c, 92, Math.round(pct * 100) + ' %')}<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="goal-l">Objectif</span><span style="font-weight:600">${esc(p.goal || '—')}</span><span class="pc-sub">${p.kind === 'counter' ? `${p.count} / ${p.total} ${esc(p.unit)}` : `${p.steps.filter((s) => s.done).length} / ${p.steps.length} étapes`}</span></div></div>
 ${p.kind === 'counter' ? `<div class="card counter"><span class="goal-l">Où tu en es</span><span class="big">${p.count} <small>/ ${p.total} ${esc(p.unit)}</small></span><div class="cbtns"><button data-act="cnt" data-n="-1">−1</button><button data-act="cnt" data-n="1">+1</button><button data-act="cnt" data-n="5">+5</button><button data-act="cnt" data-n="10">+10</button></div><form class="addf" data-form="setCount"><input class="inp" type="number" inputmode="numeric" min="0" max="${p.total}" name="n" id="cnt-in" placeholder="J’en suis à…"><button class="btn sm">OK</button></form></div>` : ''}
 ${p.kind !== 'counter' && i >= 0 && !edit ? `<div class="card cur-card" style="border-color:var(--${c})"><span style="color:var(--${c})">${ic('spark')}</span><div style="flex:1;min-width:0"><div class="goal-l">Étape actuelle</div><div style="font-weight:700">${esc(p.steps[i].t)}</div></div></div>` : ''}
 <button class="btn" data-act="point" data-id="${id}">${ic('mic', 'ico-s')} Faire mon point</button>
 ${p.kind !== 'counter' ? `<div class="sec"><div class="sec-h"><h2>Guide étape par étape</h2>${p.steps.length && !edit ? `<button class="link" data-act="editSteps">Modifier</button>` : ''}</div>${stepsHtml}</div>` : ''}
 <div class="sec"><h2>Historique</h2>${p.logs.length ? `<div class="card">${p.logs.slice(0, 30).map((l) => `<div class="log"><span class="d">${esc(cap(rel(l.date)))}${l.step ? ' · ' + esc(l.step) : ''}</span><span class="x2">${esc(l.summary)}</span></div>`).join('')}</div>` : `<div class="card empty">Après chaque session, touche « Faire mon point » et dis ce que tu as fait.</div>`}</div>
 <div class="sec"><h2>Mes ressources</h2>${p.links.map((l, k) => `<div class="urlbox">${ic('link', 'ico-s')}<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.title || l.url)}</a><button class="x" style="width:24px;height:24px" data-act="linkDel" data-i="${k}" aria-label="Retirer">${ic('x', 'ico-s')}</button></div>`).join('')}
  <form class="card sec" data-form="addLink" style="gap:8px"><input class="inp" name="title" id="link-t" placeholder="Nom (ex : chaîne YouTube)" autocomplete="off"><div class="addf"><input class="inp" name="url" id="link-u" type="url" inputmode="url" placeholder="https://…"><button class="btn sm">Ajouter</button></div></form></div>
 ${confirm ? `<div class="card confirm"><span>Supprimer le parcours « ${esc(p.name)} » ?</span><div class="btn-row"><button class="btn ghost sm" data-act="unconfirm">Annuler</button><button class="btn red sm" data-act="parcDel" data-id="${id}">Supprimer</button></div></div>` : `<button class="danger" data-act="confirm">Supprimer le parcours</button>`}`;
}

function vPodcasts() {
  const t = dkey(); const today = S.podcasts.find((x) => x.date === t); const last = S.podcasts[0]; const sk = podStreak(S);
  return `<button class="back" data-act="back">${ic('back')} Parcours</button>
 <div class="head"><div class="head-l"><h1>Podcasts</h1><span class="eyebrow">Série : ${sk} jour${sk > 1 ? 's' : ''} 🔥</span></div><button class="iconbtn" data-act="podcastAdd" aria-label="Ajouter une écoute">${ic('plus')}</button></div>
 <div class="card ringwrap">${ring(today ? 1 : 0, 'orange', 72, today ? '1/1' : '0/1', 15)}<div style="display:flex;flex-direction:column;gap:4px"><span class="goal-l">Objectif du jour</span><span style="font-weight:700">1 podcast aujourd’hui</span><span class="pc-sub" style="color:${today ? 'var(--green)' : 'var(--mut)'}">${today ? 'Objectif atteint ✓' : 'Pas encore écouté'}</span></div></div>
 ${!today ? `<button class="btn" data-act="podcastAdd">${ic('mic', 'ico-s')} J’ai écouté un podcast</button>` : ''}
 ${last ? `<div class="sec"><h2>Dernière écoute</h2><button class="card sec" style="text-align:left;width:100%" data-act="open" data-t="podcast" data-id="${last.id}"><div class="pod"><span class="thumb">${ic('head')}</span><div style="flex:1;min-width:0"><div style="font-weight:700">${esc(last.title)}</div><div class="pc-sub">${esc(cap(frDate(last.date, { day: 'numeric', month: 'long' })))}</div></div></div><span style="font-size:14px;color:var(--mut)">${esc((last.summary || '').slice(0, 160))}${(last.summary || '').length > 160 ? '…' : ''}</span>${last.url ? `<span class="urlbox">${ic('link', 'ico-s')}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(last.url)}</span></span>` : ''}</button></div>` : ''}
 <div class="sec"><h2>Historique</h2>${S.podcasts.length > 1 ? `<div class="list">${S.podcasts.slice(1).map((x) => `<button class="row" style="width:100%;text-align:left" data-act="open" data-t="podcast" data-id="${x.id}"><span class="thumb" style="width:40px;height:40px">${ic('head', 'ico-s')}</span><div class="txt"><span class="t">${esc(x.title)}</span><span class="s">${esc(frDate(x.date, { day: 'numeric', month: 'short' }))}</span></div></button>`).join('')}</div>` : `<div class="card empty">${last ? 'Tes prochaines écoutes apparaîtront ici.' : 'Après chaque podcast : titre, lien et ce que tu as retenu. Le coach te fait le résumé.'}</div>`}</div>`;
}
function vPodcast({ id, confirm }) {
  const x = S.podcasts.find((q) => q.id === id); if (!x) return goBack();
  return `<button class="back" data-act="back">${ic('back')} Podcasts</button>
 <div class="pod"><span class="thumb" style="width:72px;height:72px">${ic('head')}</span><div style="min-width:0"><h1 style="font-size:24px">${esc(x.title)}</h1><span class="eyebrow">${esc(cap(frDate(x.date)))}</span></div></div>
 ${x.url ? `<div class="urlbox">${ic('link', 'ico-s')}<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.url)}</a>${ic('ext', 'ico-s')}</div>` : ''}
 ${x.summary ? `<div class="card sec"><h2>Résumé</h2><span style="font-size:14.5px">${esc(x.summary)}</span></div>` : ''}
 ${x.keys?.length ? `<div class="card sec"><h2>${x.keys.length} choses à retenir</h2><div class="keys">${x.keys.map((k) => `<div>${esc(k)}</div>`).join('')}</div></div>` : ''}
 ${x.raw ? `<div class="card sec"><h2>Mes notes</h2><span style="font-size:14px;color:var(--mut);white-space:pre-wrap">${esc(x.raw)}</span></div>` : ''}
 ${confirm ? `<div class="card confirm"><span>Supprimer cette écoute ?</span><div class="btn-row"><button class="btn ghost sm" data-act="unconfirm">Annuler</button><button class="btn red sm" data-act="podDel" data-id="${id}">Supprimer</button></div></div>` : `<button class="danger" data-act="confirm">Supprimer</button>`}`;
}

function vCoach() {
  const msgs = S.chat;
  return `<div class="head"><div class="head-l"><h1 style="display:flex;align-items:center;gap:10px"><span style="color:var(--amber)">${ic('spark')}</span>Coach</h1><span class="eyebrow">Il voit tous tes projets, parcours et podcasts.</span></div>${msgs.length ? `<button class="link" data-act="chatClear">Effacer</button>` : ''}</div>
 <button class="lost" data-act="lost" ${BUSY.chat ? 'disabled' : ''}><b>${ic('spark', 'ico-s')} Je suis perdu</b><span>Analyse ma situation et dis-moi quoi faire maintenant</span></button>
 <div class="chat" id="chat">${msgs.map((m) => `<div class="bub ${m.role === 'user' ? 'me' : 'ai'} ${m.err ? 'err' : ''}">${m.role === 'user' ? esc(m.content) : md(m.content)}</div>`).join('')}${BUSY.chat ? `<div class="bub ai"><span class="loading"><span class="spin"></span>Le coach réfléchit…</span></div>` : ''}</div>
 <div class="sugg">${['Je fais quoi maintenant ?', 'Où j’en suis sur mes projets ?', 'Planifie ma semaine', 'Qu’est-ce que je néglige ?'].map((q) => `<button data-act="sugg" data-q="${esc(q)}" ${BUSY.chat ? 'disabled' : ''}>${esc(q)}</button>`).join('')}</div>
 <form class="chatform" data-form="chat"><textarea class="inp" name="m" id="chat-in" rows="1" placeholder="Écris au coach…"></textarea><button class="send" aria-label="Envoyer" ${BUSY.chat ? 'disabled' : ''}>${ic('send')}</button></form>`;
}

function bilanItems() {
  const t = dkey(), D = S.days[t] || {}; const items = []; const prios = D.plan?.priorities || [];
  prios.forEach((p) => items.push({ kind: 'prio', id: p.id, text: p.text, done: p.done, moved: p.moved }));
  const pt = new Set(prios.map((p) => p.taskId).filter(Boolean));
  S.routines.forEach((r) => items.push({ kind: 'routine', id: r.id, text: r.title, done: (D.routines || []).includes(r.id) }));
  allTasks().filter(({ t: x }) => !pt.has(x.id) && ((!x.done && x.due && x.due <= t) || x.doneAt === t)).forEach(({ t: x }) => items.push({ kind: 'task', id: x.id, text: x.title, done: x.done }));
  return items;
}
function vBilan() {
  const t = dkey(), D = S.days[t] || {}; const it = bilanItems(); const dn = it.filter((x) => x.done), nd = it.filter((x) => !x.done);
  return `<button class="back" data-act="back">${ic('back')} Aujourd’hui</button>
 <div class="head"><div class="head-l"><h1>Bilan du soir 🌙</h1><span class="eyebrow">${esc(cap(frDate(t)))}</span></div></div>
 <div class="card bilan-top">${ring(it.length ? dn.length / it.length : 0, 'amber', 96, `${dn.length}/${it.length}`, 20)}<div style="display:flex;flex-direction:column;gap:4px"><span style="font-weight:700;font-size:17px">${!it.length ? 'Rien de prévu aujourd’hui' : dn.length === it.length ? 'Journée complète' : dn.length / it.length >= 0.6 ? 'Bonne journée' : 'Journée moyenne'}</span><span class="pc-sub">${nd.length ? `${nd.length} chose${nd.length > 1 ? 's' : ''} à reporter ou abandonner.` : 'Tout est fait.'}</span></div></div>
 ${dn.length ? `<div class="sec"><h2>Fait</h2><div class="list">${dn.map((x) => `<div class="row"><span class="chk g on">${ic('check')}</span><div class="txt"><span class="t">${esc(x.text)}</span></div></div>`).join('')}</div></div>` : ''}
 ${nd.length ? `<div class="sec"><h2>Pas fait</h2><div class="list">${nd.map((x) => `<div class="row"><span class="chk"></span><div class="txt"><span class="t">${esc(x.text)}</span>${x.moved ? '<span class="s">Reporté à demain</span>' : ''}</div>${x.kind !== 'routine' && !x.moved ? `<div class="mini-btns"><button class="a" data-act="bTomorrow" data-k="${x.kind}" data-id="${x.id}">Demain</button><button data-act="bDrop" data-k="${x.kind}" data-id="${x.id}">Retirer</button></div>` : ''}</div>`).join('')}</div></div>` : ''}
 <div class="field"><label class="label" for="bilan-note">Une note sur ta journée ?</label><textarea class="inp" id="bilan-note" placeholder="Ce qui a marché, ce qui a bloqué…">${esc(D.bilan?.note || '')}</textarea></div>
 <button class="btn" data-act="bSave">${D.bilan ? 'Mettre à jour mon bilan' : 'Valider ma journée'}</button>`;
}

/* ---------- réglages & notifications ---------- */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let pushState = 'unknown';
async function checkPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { pushState = isIOS && !standalone() ? 'install' : 'unsupported'; return; }
  if (Notification.permission === 'denied') { pushState = 'denied'; return; }
  try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); pushState = sub ? 'on' : 'off'; } catch { pushState = 'off'; }
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
    pushState = 'on'; toast('Notifications activées ✓');
  } catch (e) { if (e.message !== 'perm') { console.warn(e); toast('Activation impossible. Réessaie.'); } }
  BUSY.push = false; render();
}
async function testPush() {
  try { const r = await api('/api/push-test', {}); toast(r.sent ? 'Notif envoyée ✓' : 'Aucun appareil abonné.'); } catch { toast('Envoi impossible.'); }
}
function vSettings() {
  const s = S.settings; const n = s.notif;
  const pushBox = {
    on: `<div class="alert" style="color:var(--green);background:var(--green-soft)">${ic('check', 'ico-s')} Notifications activées sur ce téléphone</div><button class="btn ghost" data-act="testPush">Envoyer une notif de test</button>`,
    off: `<span class="pc-sub">Reçois ton plan du matin, le bilan du soir et tes rappels.</span><button class="btn" data-act="enablePush" ${BUSY.push ? 'disabled' : ''}>${BUSY.push ? '<span class="spin"></span>' : ic('bell', 'ico-s')} Activer les notifications</button>`,
    install: `<span class="pc-sub">Sur iPhone, les notifications marchent seulement depuis l’app installée : dans Safari, touche <b>Partager</b> → <b>Sur l’écran d’accueil</b>, puis ouvre CAP depuis l’icône.</span>`,
    denied: `<span class="pc-sub">Les notifications sont bloquées. Va dans <b>Réglages iPhone → Notifications → CAP</b> et autorise-les.</span>`,
    unsupported: `<span class="pc-sub">Ce navigateur ne gère pas les notifications. Installe CAP sur l’écran d’accueil de ton iPhone.</span>`,
    unknown: `<div class="loading"><span class="spin"></span>Vérification…</div>`,
  }[pushState];
  const tog = (k, l, sub) => `<label class="row" for="n-${k}"><div class="txt"><span class="t">${l}</span><span class="s">${sub}</span></div><input type="checkbox" class="sw" id="n-${k}" data-notif="${k}" ${n[k] ? 'checked' : ''}></label>`;
  return `<button class="back" data-act="back">${ic('back')} Aujourd’hui</button>
 <div class="head"><div class="head-l"><h1>Réglages</h1></div></div>
 <div class="card sec"><h2>Notifications</h2>${pushBox}</div>
 <div class="sec"><h2>Quand te prévenir</h2><div class="list">
  ${tog('morning', 'Plan du matin', 'Le coach prépare tes 3 priorités et te les envoie')}
  <div class="row"><div class="txt"><span class="t">Heure du plan</span></div><input class="inp" type="time" id="set-m" data-set="morning" value="${s.morning}" style="width:120px"></div>
  ${tog('evening', 'Bilan du soir', 'Rappel pour valider ta journée')}
  <div class="row"><div class="txt"><span class="t">Heure du bilan</span></div><input class="inp" type="time" id="set-e" data-set="evening" value="${s.evening}" style="width:120px"></div>
  ${tog('tasks', 'Rappels de tâches', 'À l’heure mise sur la tâche')}
  ${tog('stale', 'Relances', 'Quand un projet ou un parcours stagne 3 jours')}
 </div></div>
 <div class="card sec"><h2>Compte</h2><span class="pc-sub">${esc(session?.user?.email || '')}</span><button class="btn ghost" data-act="logout">Se déconnecter</button></div>`;
}

/* ---------- capture (feuille) ---------- */
const HINTS = [['auto', 'Auto'], ['task', 'Tâche'], ['point', 'Point apprentissage'], ['podcast', 'Podcast'], ['note', 'Note projet']];
const KIND = { task: ['Tâche', 'blue'], point: ['Point du jour', 'green'], podcast: ['Podcast', 'orange'], note: ['Note projet', 'blue'] };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function micBlock() {
  if (!SR) return `<div class="hint">${ic('mic', 'ico-s')}<span>Pour parler : touche le micro du clavier de ton iPhone.</span></div>`;
  return SH.listening ? `<button class="listen on" data-act="dictate"><span class="pulse">${ic('mic')}</span><span>Je t’écoute… touche pour arrêter</span></button>`
    : `<button class="listen" data-act="dictate"><span class="pulse">${ic('mic')}</span><span>Touche pour parler</span></button>`;
}
function sheetHtml() {
  if (!SH) return ''; const s = SH; let b = '';
  const close = `<button class="x" data-act="sheetClose" aria-label="Fermer">${ic('x')}</button>`;
  const busy = (t) => `<div class="loading"><span class="spin"></span>${t}</div>`;
  if (s.mode === 'auto') {
    b = `<div class="sheet-h"><h2>Note en vrac</h2>${close}</div>`;
    if (!s.items) {
      b += `${micBlock()}<textarea class="inp" id="cap-text" placeholder="Parle ou écris naturellement. Ex : relancer le client de L’Atelier jeudi à 14h, j’ai révisé les temps du passé en anglais, j’ai écouté un podcast sur Rome…">${esc(s.text || '')}</textarea>
   <div class="chips">${HINTS.map(([k, l]) => `<button class="${(s.hint || 'auto') === k ? 'on' : ''}" data-act="hint" data-v="${k}">${l}</button>`).join('')}</div>
   ${s.busy ? busy('Le coach trie…') : `<button class="btn" data-act="triage">${ic('spark', 'ico-s')} Trier avec le coach</button><button class="btn ghost" data-act="rawTask">Ajouter tel quel comme tâche (Perso)</button>`}`;
    } else {
      b += `<div class="label">Le coach a trié. Touche une carte pour l’exclure.</div>${s.items.length ? s.items.map((x, i) => propHtml(x, i)).join('') : '<div class="empty">Rien à ranger trouvé dans ta note.</div>'}
   <div class="btn-row"><button class="btn ghost" data-act="reEdit">Modifier ma note</button><button class="btn" data-act="apply" ${s.items.some((x) => !x.off) ? '' : 'disabled'}>Tout valider</button></div>`;
    }
  } else if (s.mode === 'point') {
    const p = parc(s.pid); const i = curStep(p);
    b = `<div class="sheet-h"><h2>Point du jour · ${esc(p.name)}</h2>${close}</div>`;
    if (!s.res) {
      b += `<div class="label">Qu’est-ce que tu as fait aujourd’hui ?${p.kind !== 'counter' && i >= 0 ? ' Étape actuelle : ' + esc(p.steps[i].t) : ''}</div>${micBlock()}<textarea class="inp" id="cap-text" placeholder="Ex : j’ai regardé 2 vidéos sur le past perfect, j’ai compris la différence avec le prétérit…">${esc(s.text || '')}</textarea>
   ${s.busy ? busy('Le coach résume…') : `<button class="btn" data-act="pointAI">${ic('spark', 'ico-s')} Résumer avec le coach</button><button class="btn ghost" data-act="pointRaw">Enregistrer sans résumé</button>`}`;
    } else {
      b += `<div class="field"><span class="label">Résumé de ton point</span><textarea class="inp" id="pt-sum" style="min-height:90px">${esc(s.res.summary)}</textarea></div>
   ${p.kind !== 'counter' && i >= 0 ? `<div class="field"><span class="label">Marquer « ${esc(p.steps[i].t)} » comme terminée ?</span><div class="seg"><button class="${s.res.stepDone ? 'on' : ''}" data-act="stepYN" data-v="1">Oui</button><button class="${!s.res.stepDone ? 'on' : ''}" data-act="stepYN" data-v="0">Pas encore</button></div></div>` : ''}
   ${p.kind === 'counter' ? `<div class="field"><label class="label" for="pt-cnt">Nouveaux ${esc(p.unit)} appris aujourd’hui</label><input class="inp" id="pt-cnt" type="number" inputmode="numeric" min="0" value="${Number(s.res.countAdd) || 0}"></div>` : ''}
   <button class="btn" data-act="pointSave">Enregistrer mon point</button>`;
    }
  } else if (s.mode === 'podcast') {
    b = `<div class="sheet-h"><h2>J’ai écouté un podcast</h2>${close}</div>`;
    if (!s.res) {
      b += `<div class="field"><label class="label" for="pod-t">Titre</label><input class="inp" id="pod-t" value="${esc(s.title || '')}" placeholder="Ex : La chute de Rome"></div>
   <div class="field"><label class="label" for="pod-u">Lien (YouTube, Spotify…)</label><input class="inp" id="pod-u" type="url" inputmode="url" value="${esc(s.url || '')}" placeholder="https://…"></div>
   <div class="field"><span class="label">Ce que tu as retenu</span>${micBlock()}<textarea class="inp" id="cap-text" placeholder="Dis en vrac ce que tu as retenu…">${esc(s.text || '')}</textarea></div>
   ${s.busy ? busy('Le coach résume…') : `<button class="btn" data-act="podAI">${ic('spark', 'ico-s')} Résumer avec le coach</button><button class="btn ghost" data-act="podRaw">Enregistrer sans résumé</button>`}`;
    } else {
      b += `<div class="field"><span class="label">Titre</span><input class="inp" id="pod-t2" value="${esc(s.res.title)}"></div><div class="field"><span class="label">Résumé</span><textarea class="inp" id="pod-sum" style="min-height:90px">${esc(s.res.summary)}</textarea></div><div class="card sec" style="background:var(--bg)"><span class="label">3 choses à retenir</span><div class="keys">${s.res.keys.map((k) => `<div>${esc(k)}</div>`).join('')}</div></div><button class="btn" data-act="podSave">Enregistrer</button>`;
    }
  } else if (s.mode === 'project') {
    const p = s.id ? proj(s.id) : { name: '', sub: '', goal: '' };
    b = `<div class="sheet-h"><h2>${s.id ? 'Modifier le projet' : 'Nouveau projet'}</h2>${close}</div><form class="sec" data-form="projForm"><div class="field"><label class="label" for="pf-n">Nom</label><input class="inp" id="pf-n" name="name" value="${esc(p.name)}" required></div><div class="field"><label class="label" for="pf-s">Description courte</label><input class="inp" id="pf-s" name="sub" value="${esc(p.sub)}"></div><div class="field"><label class="label" for="pf-g">Objectif</label><input class="inp" id="pf-g" name="goal" value="${esc(p.goal)}" placeholder="Ex : signer 3 nouveaux clients ce trimestre"></div><button class="btn">${s.id ? 'Enregistrer' : 'Créer le projet'}</button></form>`;
  } else if (s.mode === 'parcours') {
    const p = s.id ? parc(s.id) : { name: '', goal: '', cat: 'learn', kind: 'steps', total: 500, unit: 'mots' }; const kind = s.kind || p.kind, cat = s.cat || p.cat;
    b = `<div class="sheet-h"><h2>${s.id ? 'Modifier le parcours' : 'Nouveau parcours'}</h2>${close}</div><form class="sec" data-form="parcForm"><div class="field"><label class="label" for="cf-n">Nom</label><input class="inp" id="cf-n" name="name" value="${esc(p.name)}" required placeholder="Ex : Espagnol"></div><div class="field"><label class="label" for="cf-g">Objectif</label><input class="inp" id="cf-g" name="goal" value="${esc(p.goal)}"></div>
  <div class="field"><span class="label">Catégorie</span><div class="seg"><button type="button" class="${cat === 'learn' ? 'on' : ''}" data-act="pcat" data-v="learn">Apprentissage</button><button type="button" class="${cat === 'faith' ? 'on' : ''}" data-act="pcat" data-v="faith">Religion</button></div></div>
  <div class="field"><span class="label">Suivi</span><div class="seg"><button type="button" class="${kind === 'steps' ? 'on' : ''}" data-act="pkind" data-v="steps">Étapes</button><button type="button" class="${kind === 'counter' ? 'on' : ''}" data-act="pkind" data-v="counter">Compteur</button></div></div>
  ${kind === 'counter' ? `<div class="addf"><input class="inp" id="cf-t" name="total" type="number" min="1" value="${p.total || 100}" aria-label="Total"><input class="inp" id="cf-u" name="unit" value="${esc(p.unit || 'mots')}" aria-label="Unité"></div>` : ''}
  <button class="btn">${s.id ? 'Enregistrer' : 'Créer le parcours'}</button></form>`;
  }
  return `<div class="sheet-bg" data-act="bgClose"><div class="sheet" role="dialog" aria-modal="true"><span class="grab"></span>${b}</div></div>`;
}
function propHtml(x, i) {
  const [k, c] = KIND[x.type] || ['?', 'amber']; let t = '', s = '';
  if (x.type === 'task') { t = x.title; s = [proj(x.projectId)?.name || 'Perso', x.due ? dueLabel(x.due) : '', x.time ? 'rappel ' + x.time : ''].filter(Boolean).join(' · '); }
  if (x.type === 'point') { const p = parc(x.parcoursId); t = x.summary; s = (p?.name || '') + (x.stepDone && p && curStep(p) >= 0 ? ' · étape terminée : ' + p.steps[curStep(p)].t : '') + (x.countAdd ? ` · +${x.countAdd} ${p?.unit || ''}` : ''); }
  if (x.type === 'podcast') { t = x.title; s = x.summary; }
  if (x.type === 'note') { t = x.text; s = (proj(x.projectId)?.name || 'Perso') + (x.memory ? ' · mémoire du projet' : ''); }
  return `<button class="prop ${x.off ? 'off' : ''}" style="--c:var(--${x.type === 'point' ? COL[parc(x.parcoursId)?.cat] || 'green' : c})" data-act="itemToggle" data-i="${i}"><span class="chk ${x.off ? '' : 'on'}">${x.off ? '' : ic('check')}</span><div class="txt"><span class="k">${k}</span><span class="t">${esc(t)}</span>${s ? `<span class="s">${esc(s)}</span>` : ''}</div></button>`;
}

/* ---------- rendu ---------- */
function goBack() { const t = V.sub?.type; V.sub = t === 'podcast' ? { type: 'podcasts' } : null; if (t === 'podcasts') V.tab = 'parcours'; if (t === 'bilan' || t === 'settings') V.tab = 'today'; setTimeout(render); return ''; }
function render() {
  if (!session) { $('#app').innerHTML = vLogin(); $('#nav').innerHTML = ''; $('#nav').hidden = true; $('#sheet').innerHTML = ''; return; }
  if (!S) return;
  $('#nav').hidden = false;
  const h = V.sub ? { project: vProject, parcours: vParcours, podcasts: vPodcasts, podcast: vPodcast, bilan: vBilan, settings: vSettings }[V.sub.type](V.sub) : { today: vToday, projects: vProjects, parcours: vParcoursList, coach: vCoach }[V.tab]();
  $('#app').innerHTML = h;
  const tabs = [['today', 'Aujourd’hui', 'home'], ['projects', 'Projets', 'folder'], null, ['parcours', 'Parcours', 'route'], ['coach', 'Coach', 'chat']];
  $('#nav').innerHTML = `<div class="nav-in">${tabs.map((x) => (x ? `<button class="tab ${V.tab === x[0] && !V.sub ? 'on' : ''}" data-act="tab" data-v="${x[0]}">${ic(x[2])}<span>${x[1]}</span></button>` : `<button class="mic" data-act="mic" aria-label="Capture rapide">${ic('mic')}</button>`)).join('')}</div>`;
  $('#sheet').innerHTML = sheetHtml();
}
function go(v) { V = v; render(); window.scrollTo(0, 0); }
const scrollBottom = () => requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200); }
function readSheet() { const g = (id) => document.getElementById(id); if (!SH) return; if (g('cap-text')) SH.text = g('cap-text').value; if (g('pod-t')) SH.title = g('pod-t').value; if (g('pod-u')) SH.url = g('pod-u').value; }
function openSheet(s, listen) { SH = s; if (listen && SR) startDictation(); render(); if (!listen || !SR) setTimeout(() => document.getElementById(s.focus || 'cap-text')?.focus(), 60); }

/* ---------- IA (via /api/ai, clé côté serveur) ---------- */
async function api(path, body) {
  const { data } = await sb.auth.getSession(); const tok = data?.session?.access_token;
  if (!tok) throw { code: 'auth' };
  if (!navigator.onLine) throw { code: 'offline' };
  let r; try { r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify(body) }); } catch { throw { code: 'offline' }; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: j.error || 'upstream' };
  return j;
}
const ai = async (body) => (await api('/api/ai', body)).result;
const ask = (prompt, tier = 'default') => ai({ kind: 'json', input: prompt, tier });
const aiErr = (e) => ({ offline: 'Pas de connexion. Réessaie quand tu as du réseau.', no_key: 'Clé API Claude manquante dans Vercel.', bad_key: 'Clé API Claude invalide. Vérifie-la dans Vercel.', no_credit: 'Plus de crédit sur ton compte Anthropic.', rate_limited: 'Trop de demandes d’un coup. Réessaie dans un moment.', invalid_json: 'Le coach a mal répondu. Réessaie.', auth: 'Reconnecte-toi.' })[e?.code] || 'Le coach n’a pas répondu. Réessaie.';

async function makePlan() {
  if (BUSY.plan) return; BUSY.plan = true; render();
  try { const r = await ask(planPrompt(S)); day().plan = cleanPlan(r, S); save(); } catch (e) { toast(aiErr(e)); }
  BUSY.plan = false; render();
}
async function triage() {
  readSheet(); stopDictation(); const text = (SH.text || '').trim(); if (!text) return toast('Parle ou écris d’abord ta note.'); SH.busy = true; render();
  const hint = { auto: '', task: "Il indique que c'est une ou plusieurs TÂCHES.", point: "Il indique que c'est un POINT d'apprentissage.", podcast: "Il indique que c'est un PODCAST écouté.", note: "Il indique que c'est une NOTE sur un projet." }[SH.hint || 'auto'];
  try {
    const r = await ask(`L'utilisateur a dicté une note en vrac dans son app d'organisation. Découpe-la en éléments et range chacun. ${hint}
Types possibles :
- "task" : une chose à faire. Champs : title (court, verbe à l'infinitif), projectId (id d'un projet ci-dessous, "perso" si aucun ne correspond), due (date AAAA-MM-JJ si une date ou un jour est mentionné, calculée à partir d'aujourd'hui ; si seule une heure est donnée, aujourd'hui ; sinon null), time (heure du rappel HH:MM si une heure est mentionnée ; pour un événement comme un live ou un rendez-vous, 30 minutes avant ; sinon null).
- "point" : il dit ce qu'il a appris ou fait sur un parcours. Champs : parcoursId, summary (1-2 phrases à la 2e personne, sans inventer), stepDone (true seulement s'il dit clairement avoir fini/maîtrisé l'étape actuelle), countAdd (pour un parcours compteur : nombre de nouveaux éléments appris s'il le dit, sinon 0).
- "podcast" : un podcast écouté. Champs : title, url (s'il le donne, sinon ""), summary (2-3 phrases basées UNIQUEMENT sur ce qu'il dit), keys (3 choses à retenir, courtes).
- "note" : une info sur un projet. Champs : projectId, text (reformulé court), memory (true si c'est une info durable sur le projet : cible, offre, décision, blocage).

Réponds uniquement avec ce JSON : {"items":[{"type":"task","title":"","projectId":"","due":null,"time":null}]}

NOTE DICTÉE :
"""${text}"""

DONNÉES :
${ctx(S)}`, 'quick');
    SH.items = (Array.isArray(r?.items) ? r.items : []).map(cleanItem).filter(Boolean);
  } catch (e) { toast(aiErr(e)); }
  if (SH) { SH.busy = false; render(); }
}
function cleanItem(x) {
  if (!x || !KIND[x.type]) return null; const o = { type: x.type };
  if (x.type === 'task') { o.title = String(x.title || '').trim(); o.projectId = proj(x.projectId) ? x.projectId : 'perso'; o.due = /^\d{4}-\d{2}-\d{2}$/.test(x.due || '') ? x.due : null; o.time = /^\d{2}:\d{2}$/.test(x.time || '') ? x.time : null; if (o.time && !o.due) o.due = dkey(); if (!o.title) return null; }
  if (x.type === 'point') { if (!parc(x.parcoursId)) return null; o.parcoursId = x.parcoursId; o.summary = String(x.summary || '').trim(); o.stepDone = !!x.stepDone; o.countAdd = Math.max(0, parseInt(x.countAdd) || 0); }
  if (x.type === 'podcast') { o.title = String(x.title || 'Podcast').trim(); o.url = String(x.url || '').trim(); o.summary = String(x.summary || '').trim(); o.keys = (Array.isArray(x.keys) ? x.keys : []).map(String).slice(0, 3); }
  if (x.type === 'note') { o.projectId = proj(x.projectId) ? x.projectId : 'perso'; o.text = String(x.text || '').trim(); o.memory = !!x.memory; if (!o.text) return null; }
  return o;
}
function applyItem(x, raw) {
  const t = dkey();
  if (x.type === 'task') { const p = proj(x.projectId) || proj('perso') || S.projects[0]; p.tasks.push({ id: rid(), title: x.title, due: x.due, time: x.time || null, done: false, doneAt: null }); touch(p); }
  if (x.type === 'point') { const p = parc(x.parcoursId); const i = curStep(p); const step = p.kind !== 'counter' && i >= 0 ? p.steps[i].t : null; if (x.stepDone && i >= 0) p.steps[i].done = true; if (p.kind === 'counter' && x.countAdd) p.count = Math.min(p.total, p.count + x.countAdd); p.logs.unshift({ date: t, summary: x.summary || 'Session faite', step: x.stepDone ? step : null, raw: raw || '' }); }
  if (x.type === 'podcast') S.podcasts.unshift({ id: rid(), date: t, title: x.title, url: x.url, summary: x.summary, keys: x.keys, raw: raw || '' });
  if (x.type === 'note') { const p = proj(x.projectId) || S.projects[0]; if (x.memory) p.memory.push(x.text); else p.notes.unshift({ date: t, text: x.text }); touch(p); }
}
async function pointAI() {
  readSheet(); stopDictation(); const text = (SH.text || '').trim(); if (!text) return toast('Dis d’abord ce que tu as fait.'); const p = parc(SH.pid); const i = curStep(p); SH.busy = true; render();
  try {
    const r = await ask(`L'utilisateur fait le point sur son parcours « ${p.name} » (objectif : ${p.goal}). ${p.kind === 'counter' ? `C'est un compteur : il en est à ${p.count}/${p.total} ${p.unit}.` : `Étapes : ${p.steps.map((s, k) => `${k + 1}. ${s.t}${s.done ? ' (fait)' : ''}`).join(' ; ')}. Étape actuelle : ${i >= 0 ? p.steps[i].t : 'aucune'}.`}
Ce qu'il dit avoir fait aujourd'hui :
"""${text}"""

Résume en 1 ou 2 phrases courtes à la 2e personne, sans rien inventer. stepDone = true seulement s'il dit clairement avoir terminé ou maîtrisé l'étape actuelle. countAdd = nombre de nouveaux ${p.unit || 'éléments'} appris s'il le dit (compteur seulement), sinon 0.
Réponds uniquement avec ce JSON : {"summary":"","stepDone":false,"countAdd":0}`, 'quick');
    SH.res = { summary: String(r?.summary || text), stepDone: !!r?.stepDone, countAdd: Math.max(0, parseInt(r?.countAdd) || 0) };
  } catch (e) { toast(aiErr(e)); }
  if (SH) { SH.busy = false; render(); }
}
async function podAI() {
  readSheet(); stopDictation(); if (!(SH.text || '').trim() && !(SH.title || '').trim()) return toast('Donne au moins le titre ou ce que tu as retenu.'); SH.busy = true; render();
  try {
    const r = await ask(`L'utilisateur a écouté un podcast et dicte ce qu'il en a retenu.
Titre donné : ${SH.title || '(aucun)'}
Lien : ${SH.url || '(aucun)'}
Ce qu'il a retenu (dicté en vrac) :
"""${SH.text || ''}"""

Fais un résumé court (2 à 3 phrases) basé UNIQUEMENT sur ce qu'il dit et le titre : n'ajoute aucun fait qu'il n'a pas mentionné. Puis 3 choses à retenir, courtes. Garde son titre s'il en a donné un (corrige juste l'orthographe), sinon propose un titre court.
Réponds uniquement avec ce JSON : {"title":"","summary":"","keys":["","",""]}`, 'quick');
    SH.res = { title: String(r?.title || SH.title || 'Podcast'), summary: String(r?.summary || ''), keys: (Array.isArray(r?.keys) ? r.keys : []).map(String).filter(Boolean).slice(0, 3) };
  } catch (e) { toast(aiErr(e)); }
  if (SH) { SH.busy = false; render(); }
}
async function genGuide() {
  const p = parc(V.sub.id); if (BUSY.guide) return; BUSY.guide = true; render();
  try {
    const r = await ask(`Crée un guide étape par étape pour ce parcours d'apprentissage : « ${p.name} », objectif : « ${p.goal || p.name} ». L'utilisateur apprend seul sur YouTube, Google, etc. : pas de cours, uniquement les étapes à cocher, de la plus simple à la plus avancée. 6 à 12 étapes, chacune un intitulé court en français (8 mots max).
Réponds uniquement avec ce JSON : {"steps":["",""]}`);
    const steps = (Array.isArray(r?.steps) ? r.steps : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 15);
    if (steps.length) { p.steps = st(steps); if (V.sub) V.sub.edit = false; save(); } else toast('Le coach n’a pas proposé d’étapes. Réessaie.');
  } catch (e) { toast(aiErr(e)); }
  BUSY.guide = false; render();
}
async function coachSend(msg) {
  msg = String(msg || '').trim(); if (!msg || BUSY.chat) return;
  S.chat.push({ role: 'user', content: msg }); BUSY.chat = true; V = { tab: 'coach', sub: null }; render(); scrollBottom();
  const system = `Tu es le coach personnel d'organisation de l'utilisateur, un jeune entrepreneur (agence SMMA L'Atelier, communauté DYCOM) qui veut aussi apprendre beaucoup de choses et qui a tendance à s'éparpiller. Tu vois toutes ses données ci-dessous. Règles : réponds en français, tutoie-le, sois direct et concret, 120 mots maximum. Quand il est perdu ou demande quoi faire : dis-lui quoi faire MAINTENANT (1 à 3 actions numérotées, la plus importante d'abord, avec une durée estimée) et ce qu'il peut ignorer pour l'instant. Appuie-toi sur les retards, les projets qui stagnent et l'heure qu'il est. Pas de longs discours.

DONNÉES ACTUELLES :
${ctx(S)}`;
  try { const text = await ai({ kind: 'text', system, input: S.chat.filter((m) => !m.err).slice(-12).map((m) => ({ role: m.role, content: m.content })) }); S.chat.push({ role: 'assistant', content: text }); }
  catch (e) { S.chat.push({ role: 'assistant', content: aiErr(e), err: true }); }
  BUSY.chat = false; save(); render(); scrollBottom();
}

/* ---------- micro ---------- */
let rec = null;
function startDictation() {
  if (!SR || rec) return;
  try {
    rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true;
    const base = SH.text ? SH.text.trim() + ' ' : '';
    rec.onresult = (e) => { let s = ''; for (const r of e.results) s += r[0].transcript; if (!SH) return; SH.text = base + s; const ta = document.getElementById('cap-text'); if (ta) ta.value = SH.text; };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Micro refusé : autorise-le dans Réglages iPhone, ou utilise le micro du clavier.'); };
    rec.onend = () => { rec = null; if (SH) { readSheet(); SH.listening = false; render(); } };
    rec.start(); SH.listening = true;
  } catch { rec = null; SH.listening = false; }
}
function stopDictation() { if (rec) { try { rec.stop(); } catch {} } }

/* ---------- actions ---------- */
const A = {
  tab: (e) => go({ tab: e.dataset.v, sub: null }),
  open: (e) => { go({ tab: V.tab, sub: { type: e.dataset.t, id: e.dataset.id } }); if (e.dataset.t === 'settings') checkPush().then(render); },
  back: () => { goBack(); window.scrollTo(0, 0); },
  mic: () => openSheet({ mode: 'auto', hint: 'auto' }, true),
  plan: () => makePlan(),
  prio: (e) => { const p = day().plan.priorities.find((x) => x.id === e.dataset.id); p.done = !p.done; if (p.taskId) { const f = findTask(p.taskId); if (f) { f.t.done = p.done; f.t.doneAt = p.done ? dkey() : null; touch(f.p); } } save(); render(); },
  routine: (e) => { const D = day(); D.routines ??= []; const i = D.routines.indexOf(e.dataset.id); i < 0 ? D.routines.push(e.dataset.id) : D.routines.splice(i, 1); save(); render(); },
  task: (e) => { const f = findTask(e.dataset.id); if (!f) return; f.t.done = !f.t.done; f.t.doneAt = f.t.done ? dkey() : null; touch(f.p); const pr = S.days[dkey()]?.plan?.priorities?.find((x) => x.taskId === f.t.id); if (pr) pr.done = f.t.done; save(); render(); },
  taskDel: (e) => { const f = findTask(e.dataset.id); if (f) { f.p.tasks = f.p.tasks.filter((x) => x !== f.t); save(); render(); } },
  ptab: (e) => { V.sub.tab = e.dataset.v; render(); },
  memDel: (e) => { proj(e.dataset.id).memory.splice(+e.dataset.i, 1); save(); render(); },
  noteDel: (e) => { proj(e.dataset.id).notes.splice(+e.dataset.i, 1); save(); render(); },
  routineDel: (e) => { S.routines = S.routines.filter((r) => r.id !== e.dataset.id); save(); render(); },
  confirm: () => { V.sub.confirm = true; render(); scrollBottom(); }, unconfirm: () => { V.sub.confirm = false; render(); },
  projDel: (e) => { const id = e.dataset.id; S.projects = S.projects.filter((p) => p.id !== id); S.routines = S.routines.filter((r) => r.projectId !== id); save(); go({ tab: 'projects', sub: null }); },
  parcDel: (e) => { S.parcours = S.parcours.filter((p) => p.id !== e.dataset.id); save(); go({ tab: 'parcours', sub: null }); },
  podDel: (e) => { S.podcasts = S.podcasts.filter((p) => p.id !== e.dataset.id); save(); go({ tab: 'parcours', sub: { type: 'podcasts' } }); },
  newProject: () => openSheet({ mode: 'project', focus: 'pf-n' }), editProject: (e) => openSheet({ mode: 'project', id: e.dataset.id, focus: 'pf-n' }),
  newParcours: () => openSheet({ mode: 'parcours', focus: 'cf-n' }), editParcours: (e) => openSheet({ mode: 'parcours', id: e.dataset.id }),
  pcat: (e) => { keepForm(); SH.cat = e.dataset.v; render(); restoreForm(); }, pkind: (e) => { keepForm(); SH.kind = e.dataset.v; render(); restoreForm(); },
  stepToggle: (e) => { const p = parc(V.sub.id); const s = p.steps[+e.dataset.i]; s.done = !s.done; if (s.done) p.logs.unshift({ date: dkey(), summary: 'Étape terminée : ' + s.t, step: s.t }); save(); render(); },
  editSteps: () => { V.sub.edit = true; render(); },
  editDone: () => { const p = parc(V.sub.id); saveStepInputs(p); V.sub.edit = false; save(); render(); },
  stepDel: (e) => { const p = parc(V.sub.id); saveStepInputs(p); p.steps.splice(+e.dataset.i, 1); save(); render(); },
  genGuide: () => genGuide(),
  cnt: (e) => { const p = parc(V.sub.id); p.count = Math.max(0, Math.min(p.total, p.count + +e.dataset.n)); if (+e.dataset.n > 0) logCount(p, +e.dataset.n); save(); render(); },
  linkDel: (e) => { parc(V.sub.id).links.splice(+e.dataset.i, 1); save(); render(); },
  point: (e) => openSheet({ mode: 'point', pid: e.dataset.id }, true),
  podcastAdd: () => openSheet({ mode: 'podcast', focus: 'pod-t' }),
  lost: () => coachSend('Je suis perdu, je fais quoi maintenant ?'),
  sugg: (e) => coachSend(e.dataset.q),
  chatClear: () => { S.chat = []; save(); render(); },
  bTomorrow: (e) => {
    const k = e.dataset.k, id = e.dataset.id, t = dkey(), tm = addDays(t, 1);
    if (k === 'prio') { const p = S.days[t].plan.priorities.find((x) => x.id === id); p.moved = true; const T = day(tm); T.carry ??= []; T.carry.push(p.text); if (p.taskId) { const f = findTask(p.taskId); if (f) f.t.due = tm; } }
    if (k === 'task') { const f = findTask(id); if (f) f.t.due = tm; }
    toast('Reporté à demain'); save(); render();
  },
  bDrop: (e) => { const k = e.dataset.k, id = e.dataset.id, t = dkey(); if (k === 'prio') { const D = S.days[t]; D.plan.priorities = D.plan.priorities.filter((x) => x.id !== id); } if (k === 'task') { const f = findTask(id); if (f) { f.t.due = null; f.t.time = null; } } save(); render(); },
  bSave: () => { const it = bilanItems(); day().bilan = { score: it.filter((x) => x.done).length, total: it.length, note: $('#bilan-note').value.trim(), at: Date.now() }; save(); toast('Journée validée ✓'); go({ tab: 'today', sub: null }); },
  sheetClose: () => { stopDictation(); SH = null; render(); },
  hint: (e) => { readSheet(); SH.hint = e.dataset.v; render(); },
  triage: () => triage(),
  reEdit: () => { SH.items = null; render(); },
  itemToggle: (e) => { const x = SH.items[+e.dataset.i]; x.off = !x.off; render(); },
  apply: () => { const n = SH.items.filter((x) => !x.off); n.forEach((x) => applyItem(x, SH.text)); SH = null; save(); render(); toast(`${n.length} élément${n.length > 1 ? 's' : ''} rangé${n.length > 1 ? 's' : ''} ✓`); },
  rawTask: () => { readSheet(); stopDictation(); const t = (SH.text || '').trim(); if (!t) return toast('Écris d’abord ta note.'); applyItem({ type: 'task', title: t, projectId: 'perso', due: null }); SH = null; save(); render(); toast('Ajouté dans Perso ✓'); },
  dictate: () => { readSheet(); if (rec) stopDictation(); else { startDictation(); render(); } },
  pointAI: () => pointAI(),
  pointRaw: () => { readSheet(); stopDictation(); const t = (SH.text || '').trim(); if (!t) return toast('Dis d’abord ce que tu as fait.'); applyItem({ type: 'point', parcoursId: SH.pid, summary: t, stepDone: false, countAdd: 0 }); SH = null; save(); render(); toast('Point enregistré ✓'); },
  stepYN: (e) => { SH.res.summary = $('#pt-sum').value; SH.res.stepDone = e.dataset.v === '1'; render(); },
  pointSave: () => { const r = SH.res; r.summary = $('#pt-sum').value.trim(); const c = $('#pt-cnt'); if (c) r.countAdd = Math.max(0, parseInt(c.value) || 0); applyItem({ type: 'point', parcoursId: SH.pid, ...r }, SH.text); SH = null; save(); render(); toast('Point enregistré ✓'); },
  podAI: () => podAI(),
  podRaw: () => { readSheet(); stopDictation(); if (!(SH.title || SH.text || '').trim()) return toast('Donne au moins le titre.'); applyItem({ type: 'podcast', title: (SH.title || 'Podcast').trim(), url: (SH.url || '').trim(), summary: (SH.text || '').trim(), keys: [] }, SH.text); SH = null; save(); go({ tab: 'parcours', sub: { type: 'podcasts' } }); toast('Écoute enregistrée ✓'); },
  podSave: () => { const r = SH.res; applyItem({ type: 'podcast', title: $('#pod-t2').value.trim() || r.title, url: (SH.url || '').trim(), summary: $('#pod-sum').value.trim(), keys: r.keys }, SH.text); SH = null; save(); go({ tab: 'parcours', sub: { type: 'podcasts' } }); toast('Écoute enregistrée ✓'); },
  enablePush: () => enablePush(),
  testPush: () => testPush(),
  logout: async () => { await flush(); await sb.auth.signOut(); session = null; S = null; V = { tab: 'today', sub: null }; render(); },
};
function saveStepInputs(p) { document.querySelectorAll('[data-step]').forEach((inp) => { const k = +inp.dataset.step; if (p.steps[k]) p.steps[k].t = inp.value.trim() || p.steps[k].t; }); }
function logCount(p, n) { const t = dkey(); const l = p.logs[0]; if (l && l.date === t && l.cnt != null) { l.cnt += n; l.summary = `+${l.cnt} ${p.unit} aujourd’hui (total ${p.count})`; } else p.logs.unshift({ date: t, cnt: n, summary: `+${n} ${p.unit} aujourd’hui (total ${p.count})` }); }
let kept = {}; function keepForm() { kept = {}; document.querySelectorAll('.sheet input').forEach((i) => { if (i.id) kept[i.id] = i.value; }); }
function restoreForm() { for (const [k, v] of Object.entries(kept)) { const el = document.getElementById(k); if (el) el.value = v; } }

const F = {
  login: async (f, d) => {
    BUSY.login = true; V.loginErr = ''; render();
    const { data, error } = await sb.auth.signInWithPassword({ email: d.get('email').trim(), password: d.get('pw') });
    BUSY.login = false;
    if (error) { V.loginErr = /invalid/i.test(error.message) ? 'Email ou mot de passe incorrect.' : 'Connexion impossible : ' + error.message; return render(); }
    session = data.session; await startSession();
  },
  addPrio: (f, d) => { const t = d.get('t').trim(); if (!t) return; const D = day(); D.plan ??= { message: '', priorities: [] }; D.plan.priorities.push({ id: rid(), text: t, cat: 'work', done: false }); save(); render(); },
  addMem: (f, d) => { const t = d.get('t').trim(); if (!t) return; const p = proj(f.dataset.id); p.memory.push(t); touch(p); save(); render(); },
  addRoutine: (f, d) => { const t = d.get('t').trim(); if (!t) return; S.routines.push({ id: rid(), title: t, projectId: f.dataset.id }); save(); render(); },
  addTask: (f, d) => { const t = d.get('t').trim(); if (!t) return; const p = proj(f.dataset.id); const time = d.get('h') || null; p.tasks.push({ id: rid(), title: t, due: d.get('d') || (time ? dkey() : null), time, done: false, doneAt: null }); touch(p); save(); render(); document.getElementById('task-in')?.focus(); },
  addNote: (f, d) => { const t = d.get('t').trim(); if (!t) return; const p = proj(f.dataset.id); p.notes.unshift({ date: dkey(), text: t }); touch(p); save(); render(); },
  addLink: (f, d) => { let u = d.get('url').trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; parc(V.sub.id).links.push({ title: d.get('title').trim(), url: u }); save(); render(); },
  addStep: (f, d) => { const t = d.get('t').trim(); if (!t) return; const p = parc(V.sub.id); saveStepInputs(p); p.steps.push({ t, done: false }); save(); render(); document.getElementById('step-new')?.focus(); },
  setCount: (f, d) => { const p = parc(V.sub.id); const n = parseInt(d.get('n')); if (isNaN(n)) return; const diff = Math.max(0, Math.min(p.total, n)) - p.count; p.count = Math.max(0, Math.min(p.total, n)); if (diff > 0) logCount(p, diff); save(); render(); },
  chat: (f, d) => coachSend(d.get('m')),
  projForm: (f, d) => {
    const o = { name: d.get('name').trim(), sub: d.get('sub').trim(), goal: d.get('goal').trim() }; if (!o.name) return;
    if (SH.id) Object.assign(proj(SH.id), o);
    else { const id = rid(); S.projects.splice(S.projects.length - 1, 0, { id, ...o, memory: [], tasks: [], notes: [], lastAt: dkey() }); SH = null; save(); return go({ tab: 'projects', sub: { type: 'project', id } }); }
    SH = null; save(); render();
  },
  parcForm: (f, d) => {
    const name = d.get('name').trim(); if (!name) return; const base = SH.id ? parc(SH.id) : null; const kind = SH.kind || base?.kind || 'steps', cat = SH.cat || base?.cat || 'learn';
    const o = { name, goal: d.get('goal').trim(), cat, kind, icon: base?.icon || (cat === 'faith' ? 'moon' : 'route') };
    if (kind === 'counter') { o.total = Math.max(1, parseInt(d.get('total')) || 100); o.unit = (d.get('unit') || '').trim() || 'éléments'; o.count = Math.min(base?.count || 0, o.total); }
    if (base) { Object.assign(base, o); SH = null; save(); return render(); }
    const id = rid(); S.parcours.push({ id, ...o, steps: [], logs: [], links: [], count: o.count || 0 }); SH = null; save(); go({ tab: 'parcours', sub: { type: 'parcours', id } });
  },
};
document.addEventListener('click', (ev) => { const el = ev.target.closest('[data-act]'); if (!el || el.disabled) return; if (el.dataset.act === 'bgClose') { if (ev.target === el) A.sheetClose(); return; } const fn = A[el.dataset.act]; if (!fn) return; ev.preventDefault(); fn(el, ev); });
document.addEventListener('submit', (ev) => { const f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault(); const fn = F[f.dataset.form]; if (fn) fn(f, new FormData(f)); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && ev.target.id === 'chat-in') { ev.preventDefault(); ev.target.form.requestSubmit(); } if (ev.key === 'Escape' && SH) A.sheetClose(); });
document.addEventListener('input', (ev) => { if (ev.target.id === 'chat-in') { ev.target.style.height = '46px'; ev.target.style.height = Math.min(140, ev.target.scrollHeight) + 'px'; } });
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.notif) { S.settings.notif[el.dataset.notif] = el.checked; save(); }
  if (el.dataset.set && /^\d{2}:\d{2}$/.test(el.value)) { S.settings[el.dataset.set] = el.value; save(); toast('Enregistré ✓'); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); else if (dirty) flush(); });
window.addEventListener('online', () => { flush(); render(); });
window.addEventListener('offline', () => render());

/* ---------- démarrage ---------- */
function applyDeepLink() {
  const v = new URLSearchParams(location.search).get('v');
  if (v === 'bilan') V = { tab: 'today', sub: { type: 'bilan' } };
  else if (v === 'coach') V = { tab: 'coach', sub: null };
  else if (v === 'today') V = { tab: 'today', sub: null };
  if (v) history.replaceState(null, '', '/');
}
async function startSession() {
  S = migrate(LS.get(lsKey()) || defaultState()); lastSync = LS.get(lsKey() + '-sync') || 0;
  applyDeepLink(); render(); await pull(); checkPush();
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
