import { h, addXp, toast, store, isoDay } from '../core.js';
import { createTuck } from '../tuck.js';

const MODES = { foco: ['Foco', 25], pausa: ['Pausa', 5], longa: ['Pausa longa', 15] };
const C = 2 * Math.PI * 100;
const T = { mode: 'foco', left: 25 * 60, endAt: 0, running: false, iv: null };
const ui = {};
const TITLE = 'Eduquack \u2014 Seu espa\u00e7o de estudo para vestibulares e editais';

const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const todayKey = () => 'krisis.pomos.' + isoDay();

function paint() {
  if (!ui.time || !ui.time.isConnected) return;
  const total = MODES[T.mode][1] * 60;
  ui.time.textContent = fmt(T.left);
  ui.arc.setAttribute('stroke-dashoffset', String(C * (1 - T.left / total)));
  ui.go.textContent = T.running ? 'Pausar' : (T.left < total ? 'Continuar' : 'Começar');
  ui.count.textContent = store.get(todayKey(), 0) + ' ciclos de foco hoje';
  ui.tabs.forEach((b) => b.classList.toggle('on', b.dataset.m === T.mode));
}

function beep() {
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    const ctx = new A();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.65);
  } catch (_) { /* sem áudio */ }
}

function stop() { clearInterval(T.iv); T.iv = null; T.running = false; document.title = TITLE; }
function setMode(m) { stop(); T.mode = m; T.left = MODES[m][1] * 60; paint(); }

function tick() {
  T.left = Math.max(0, Math.round((T.endAt - Date.now()) / 1000));
  document.title = fmt(T.left) + ' \u00b7 Eduquack';
  paint();
  if (T.left > 0) return;
  const wasFocus = T.mode === 'foco';
  stop();
  beep();
  if (wasFocus) {
    store.set(todayKey(), store.get(todayKey(), 0) + 1);
    addXp(20);
    toast('Ciclo de foco concluído! +20 XP', 'ok');
    setMode('pausa');
  } else {
    toast('A pausa terminou. Hora de voltar!');
    setMode('foco');
  }
}

function toggle() {
  if (T.running) { stop(); paint(); return; }
  if (T.left <= 0) T.left = MODES[T.mode][1] * 60;
  T.endAt = Date.now() + T.left * 1000;
  T.running = true;
  T.iv = setInterval(tick, 500);
  paint();
}

export function renderFocus(box) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '240'); svg.setAttribute('height', '240'); svg.setAttribute('viewBox', '0 0 240 240');
  svg.style.transform = 'rotate(-90deg)';
  const mk = (stroke) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '120'); c.setAttribute('cy', '120'); c.setAttribute('r', '100'); c.setAttribute('fill', 'none');
    c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', '16'); c.setAttribute('stroke-linecap', 'round');
    return c;
  };
  const arc = mk('#f2b705');
  arc.setAttribute('stroke-dasharray', String(C));
  arc.style.transition = 'stroke-dashoffset .5s linear';
  svg.append(mk('var(--surface-2)'), arc);
  ui.arc = arc;
  ui.time = h('div', { class: 't', style: 'position:absolute;inset:0;display:grid;place-items:center;font-family:Fredoka,sans-serif;font-size:3rem;font-weight:600;font-variant-numeric:tabular-nums' });
  ui.go = h('button', { class: 'btn primary big', onclick: toggle });
  ui.count = h('div', { class: 'muted', style: 'font-weight:800' });
  ui.tabs = Object.entries(MODES).map(([k, v]) => h('button', { 'data-m': k, class: 'cmd-chip', onclick: () => setMode(k) }, v[0]));
  const tuck = createTuck({ size: 110 });
  box.append(h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:16px;padding:12px 0' },
    h('div', { class: 'row' }, ui.tabs),
    tuck.el,
    h('div', { style: 'position:relative;width:240px;height:240px' }, svg, ui.time),
    h('div', { class: 'row' }, ui.go, h('button', { class: 'btn big', onclick: () => setMode(T.mode) }, 'Reiniciar')),
    ui.count,
    h('p', { class: 'muted', style: 'max-width:42ch;text-align:center;font-weight:700' }, 'Estude 25 minutos sem distrações e descanse 5. Cada ciclo vale XP e mantém sua sequência. O Tuck fica de faixa enquanto você foca.')));
  paint();
}
