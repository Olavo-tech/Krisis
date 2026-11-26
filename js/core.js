// Núcleo: cliente Supabase, estado, DOM, ícones, gamificação (XP, missões, constância), efeitos, toasts e modais.
export const SUPABASE_URL = 'https://mrkqfyzbbhuulwstvryt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_PCBfUcUxGgr-aIvy_B9CyA_cY_d8EIT';

export const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
export const state = { session: null, user: null, profile: null, pages: [], quota: null };

export function isPlus() {
  const p = state.profile;
  if (!p || p.plan !== 'plus') return false;
  return !p.plan_expires_at || new Date(p.plan_expires_at) > new Date();
}

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 9h8M8 12h8M8 15h5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-7 0-3-2-5-3-7-1 2-2 2.5-3 2 0-3-1-6-4-8 0 4-4 6-4 12 0 4.2 3 8 7 8z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  attach: '<path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  grip: '<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  arrow: '<path d="M7 17L17 7M8 7h9v9"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  scale: '<path d="M12 4v16M6 20h12M5 8h14M5 8l-3 7a3 3 0 0 0 6 0zM19 8l-3 7a3 3 0 0 0 6 0z"/>',
  pencil: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  command: '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>'
};
export const PAGE_ICONS = ['file', 'book', 'target', 'brain', 'flask', 'globe', 'calc', 'scale', 'pencil', 'flag', 'star', 'heart'];

export function icon(name, size = 20) {
  const s = document.createElement('span');
  s.className = 'ico';
  s.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  return s;
}
// Ícones antigos salvos como emoji viram o ícone padrão de página.
export const pageIcon = (name, size = 18) => icon(PAGE_ICONS.includes(name) ? name : 'file', size);

export const chip = (text, tone) => h('span', { class: 'chip ' + (tone || '') }, text);
export const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
export function empty(title, text, action) {
  return h('div', { class: 'empty tile' }, h('h3', {}, title), h('p', { class: 'muted' }, text), action || null);
}
export function debounce(fn, ms) {
  let t = null, last = [];
  const d = (...a) => { last = a; clearTimeout(t); t = setTimeout(() => { t = null; fn(...last); }, ms); };
  d.flush = () => { if (t) { clearTimeout(t); t = null; fn(...last); } };
  return d;
}
export function isoDay(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
export function fmtDate(s) {
  try { return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); } catch (_) { return ''; }
}
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* ignora */ } }
};

/* ---------- Efeitos ---------- */
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function confetti(x, y, n = 30) {
  if (reduce()) return;
  const colors = ['#3b6cff', '#14b8a6', '#d6f58c', '#ff6b81', '#ffd23f', '#8b6cff'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 130;
    p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d - 50).toFixed(0) + 'px;--rot:' + (Math.random() * 720 - 360).toFixed(0) + 'deg;background:' + colors[i % colors.length] + ';animation-delay:' + Math.floor(Math.random() * 90) + 'ms';
    document.body.append(p);
    setTimeout(() => p.remove(), 1500);
  }
}
export function floatText(x, y, text) {
  const t = document.createElement('div');
  t.className = 'floatxp';
  t.textContent = text;
  t.style.left = x + 'px';
  t.style.top = y + 'px';
  document.body.append(t);
  setTimeout(() => t.remove(), 1200);
}
export function countUp(el, to, ms = 700) {
  if (reduce() || to <= 0) { el.textContent = String(to); return; }
  const t0 = performance.now();
  const f = (t) => { const k = Math.min(1, (t - t0) / ms); el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

/* ---------- Gamificação ---------- */
export const MISSIONS = [
  { k: 'tarefas', t: 'Concluir 3 tarefas', n: 3, xp: 30, ic: 'check' },
  { k: 'revisao', t: 'Fazer uma sessão de revisão', n: 1, xp: 25, ic: 'cards' },
  { k: 'foco', t: 'Completar um ciclo de foco', n: 1, xp: 30, ic: 'timer' },
  { k: 'edital', t: 'Analisar ou salvar um edital', n: 1, xp: 20, ic: 'scan' }
];
const qKey = () => 'krisis.q.' + isoDay();
function routeKind() {
  const s = (location.hash || '').split('/')[1];
  return { tarefas: 'tarefas', cartoes: 'revisao', foco: 'foco', analisar: 'edital', editais: 'edital', pagina: 'pagina' }[s] || null;
}
export function getQuests() {
  const q = store.get(qKey(), {});
  return MISSIONS.map((m) => ({ ...m, done: Math.min(q[m.k] || 0, m.n), complete: (q[m.k] || 0) >= m.n }));
}
function bumpQuest(kind) {
  const m = MISSIONS.find((x) => x.k === kind);
  if (!m) return;
  const q = store.get(qKey(), {});
  const before = q[kind] || 0;
  q[kind] = before + 1;
  store.set(qKey(), q);
  if (before < m.n && q[kind] >= m.n) {
    store.set('krisis.xp', store.get('krisis.xp', 0) + m.xp);
    document.dispatchEvent(new CustomEvent('krisis:mission', { detail: m }));
  }
}
export function markStudyDay() {
  const days = store.get('krisis.days', []);
  const t = isoDay();
  if (!days.includes(t)) { days.push(t); store.set('krisis.days', days.slice(-400)); }
}
export function addXp(n, kind = routeKind()) {
  const before = store.get('krisis.xp', 0);
  const xp = before + n;
  store.set('krisis.xp', xp);
  markStudyDay();
  const m = store.get('krisis.dxp', {});
  const k = isoDay();
  m[k] = (m[k] || 0) + n;
  const keys = Object.keys(m).sort();
  if (keys.length > 140) keys.slice(0, keys.length - 140).forEach((x) => delete m[x]);
  store.set('krisis.dxp', m);
  if (kind) bumpQuest(kind);
  document.dispatchEvent(new CustomEvent('krisis:stats', { detail: { n, kind } }));
  if (Math.floor(xp / 100) > Math.floor(before / 100)) document.dispatchEvent(new CustomEvent('krisis:levelup', { detail: { level: Math.floor(xp / 100) + 1 } }));
}
export function getStats() {
  const xp = store.get('krisis.xp', 0);
  const days = new Set(store.get('krisis.days', []));
  let streak = 0;
  const d = new Date();
  if (!days.has(isoDay(d))) d.setDate(d.getDate() - 1);
  while (days.has(isoDay(d))) { streak++; d.setDate(d.getDate() - 1); }
  return { xp, streak, level: Math.floor(xp / 100) + 1, levelXp: xp % 100, studiedToday: days.has(isoDay()) };
}
export function weekDone() {
  const days = new Set(store.get('krisis.days', []));
  const t = new Date();
  const dow = (t.getDay() + 6) % 7;
  let n = 0;
  for (let i = 0; i <= dow; i++) { const d = new Date(t); d.setDate(t.getDate() - i); if (days.has(isoDay(d))) n++; }
  return n;
}
export function getHeat(weeks = 15) {
  const days = new Set(store.get('krisis.days', []));
  const dxp = store.get('krisis.dxp', {});
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(start.getDate() - dow - (weeks - 1) * 7);
  const out = [];
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const k = isoDay(d);
    const xp = dxp[k] || 0;
    out.push({ date: k, l: xp >= 100 ? 4 : xp >= 50 ? 3 : xp >= 20 ? 2 : (days.has(k) || xp > 0) ? 1 : 0, today: k === isoDay(today) });
  }
  return out;
}

export function toast(msg, kind = 'info') {
  let box = document.getElementById('toasts');
  if (!box) { box = h('div', { id: 'toasts', class: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: 'toast ' + kind }, msg);
  box.append(t);
  setTimeout(() => t.remove(), 3800);
}

export function openModal(content, { wide = false, onClose } = {}) {
  const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) close(); } });
  const card = h('div', { class: 'modal glass' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' }, content);
  back.append(card);
  document.body.append(back);
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  function close() {
    document.removeEventListener('keydown', onKey);
    back.remove();
    if (onClose) onClose();
  }
  const first = card.querySelector('input,textarea');
  if (first) setTimeout(() => first.focus(), 30);
  return close;
}

export function confirmBox(msg, okLabel = 'Confirmar', danger = false) {
  return new Promise((res) => {
    let close;
    const done = (v) => { res(v); close(); };
    close = openModal(h('div', { class: 'stack' },
      h('p', { class: 'lead' }, msg),
      h('div', { class: 'row end' },
        h('button', { class: 'btn', onclick: () => done(false) }, 'Cancelar'),
        h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => done(true) }, okLabel))
    ), { onClose: () => res(false) });
  });
}
