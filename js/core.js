// Núcleo: cliente Supabase, estado, helpers de DOM, gamificação, toasts e modais.
export const SUPABASE_URL = 'https://mrkqfyzbbhuulwstvryt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_PCBfUcUxGgr-aIvy_B9CyA_cY_d8EIT';

export const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
export const state = { session: null, user: null, profile: null, pages: [], quota: null };

export function isPlus() {
  const p = state.profile;
  if (!p || p.plan !== 'plus') return false;
  return !p.plan_expires_at || new Date(p.plan_expires_at) > new Date();
}

// h(tag, props, ...filhos): cria elementos sem innerHTML (seguro contra XSS)
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
  grip: '<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/>'
};

export function icon(name, size = 20) {
  const s = document.createElement('span');
  s.className = 'ico';
  s.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  return s;
}

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

// Armazenamento local (tema, XP, sequência)
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* ignora */ } }
};

export function markStudyDay() {
  const days = store.get('krisis.days', []);
  const t = isoDay();
  if (!days.includes(t)) { days.push(t); store.set('krisis.days', days.slice(-400)); }
}
export function addXp(n) {
  store.set('krisis.xp', store.get('krisis.xp', 0) + n);
  markStudyDay();
  document.dispatchEvent(new CustomEvent('krisis:stats'));
}
export function getStats() {
  const xp = store.get('krisis.xp', 0);
  const days = new Set(store.get('krisis.days', []));
  let streak = 0;
  const d = new Date();
  if (!days.has(isoDay(d))) d.setDate(d.getDate() - 1);
  while (days.has(isoDay(d))) { streak++; d.setDate(d.getDate() - 1); }
  return { xp, streak, level: Math.floor(xp / 100) + 1, studiedToday: days.has(isoDay()) };
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
