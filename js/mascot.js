// Kri — o mascote do Krisis. Reage às ações do site, segue o cursor, dorme, comemora e pode ser arrastado.
import { h, store, getStats, floatText, confetti } from './core.js';

const SVG = `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<ellipse cx="100" cy="212" rx="52" ry="7" fill="rgba(15,22,40,.18)"/>
<g class="k-all">
<ellipse cx="74" cy="201" rx="17" ry="9" fill="#2449c9"/><ellipse cx="126" cy="201" rx="17" ry="9" fill="#2449c9"/>
<g class="k-arm-l"><ellipse cx="24" cy="146" rx="12" ry="20" transform="rotate(16 24 146)" fill="#2d5bea"/></g>
<g class="k-arm-r"><ellipse cx="176" cy="146" rx="12" ry="20" transform="rotate(-16 176 146)" fill="#2d5bea"/></g>
<g class="k-ant"><path d="M100 56 C100 40 104 32 110 27" stroke="#2449c9" stroke-width="6" stroke-linecap="round" fill="none"/><g class="k-star"><path d="M112 6 L116.5 16 L127 20 L116.5 24 L112 34 L107.5 24 L97 20 L107.5 16 Z" fill="#ffd23f"/></g></g>
<path d="M100 52 C150 52 176 92 176 134 C176 174 144 198 100 198 C56 198 24 174 24 134 C24 92 50 52 100 52 Z" fill="#3b6cff"/>
<ellipse cx="100" cy="160" rx="44" ry="33" fill="#d9e6ff"/>
<ellipse cx="62" cy="86" rx="14" ry="8" transform="rotate(-30 62 86)" fill="#fff" opacity=".38"/>
<g class="k-band"><path d="M28 98 Q100 70 172 98" stroke="#ffd23f" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M172 98 l16 -8 M172 98 l14 12" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"/></g>
<g class="k-eye k-eye-l"><ellipse cx="74" cy="118" rx="17" ry="21" fill="#fff"/><g class="k-pupil"><circle cx="74" cy="120" r="10.5" fill="#101a35"/><circle cx="70" cy="115" r="3.6" fill="#fff"/></g></g>
<g class="k-eye k-eye-r"><ellipse cx="126" cy="118" rx="17" ry="21" fill="#fff"/><g class="k-pupil"><circle cx="126" cy="120" r="10.5" fill="#101a35"/><circle cx="122" cy="115" r="3.6" fill="#fff"/></g></g>
<g class="k-sleepeyes" fill="none" stroke="#101a35" stroke-width="5" stroke-linecap="round"><path d="M58 120 Q74 132 90 120"/><path d="M110 120 Q126 132 142 120"/></g>
<ellipse cx="48" cy="142" rx="9" ry="6" fill="#ff8fa3" opacity=".6"/><ellipse cx="152" cy="142" rx="9" ry="6" fill="#ff8fa3" opacity=".6"/>
<path class="k-m k-m-idle" d="M89 143 Q100 153 111 143" stroke="#101a35" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<g class="k-m k-m-happy"><path d="M86 140 Q100 170 114 140 Z" fill="#101a35"/><ellipse cx="100" cy="153" rx="7" ry="4.5" fill="#ff6b81"/></g>
<path class="k-m k-m-sad" d="M90 152 Q100 141 110 152" stroke="#101a35" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<ellipse class="k-m k-m-o" cx="100" cy="148" rx="5.5" ry="7" fill="#101a35"/>
<path class="k-m k-m-sleep" d="M93 147 Q100 152 107 147" stroke="#101a35" stroke-width="4" stroke-linecap="round" fill="none"/>
<g class="k-zzz"><text class="kz1" x="150" y="78" font-size="20" font-weight="800" fill="#7a86a4">z</text><text class="kz2" x="166" y="56" font-size="26" font-weight="800" fill="#7a86a4">Z</text></g>
</g>
<g class="k-sp"><path class="sp1" d="M26 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffd23f"/><path class="sp2" d="M178 58 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" fill="#14b8a6"/><circle class="sp3" cx="164" cy="22" r="4" fill="#ff6b81"/></g>
</svg>`;

const instances = new Set();
const S = { sleeping: false, focusing: false, lastActive: Date.now(), shown: new Set(), clicks: [], greeted: false };
const base = () => (S.focusing ? 'focus' : S.sleeping ? 'sleep' : 'idle');
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const visible = (i) => i.el.isConnected && i.el.getClientRects().length > 0;
const firstVisible = () => [...instances].find(visible);

export function createKri({ size = 120, pet = false } = {}) {
  const el = h('div', { class: 'kri m-idle' + (pet ? ' kri-pet' : ''), style: 'width:' + size + 'px;height:' + Math.round(size * 1.1) + 'px', role: 'img', 'aria-label': 'Kri, o mascote do Krisis' });
  el.innerHTML = SVG;
  const bubble = h('div', { class: 'kri-bubble', role: 'status' });
  el.append(bubble);
  const api = {
    el, pet, t: null, bt: null,
    setMood(m, ms) {
      clearTimeout(api.t);
      [...el.classList].filter((c) => c.startsWith('m-')).forEach((c) => el.classList.remove(c));
      el.classList.add('m-' + m);
      if (ms) api.t = setTimeout(() => api.setMood(base()), ms);
    },
    say(text, ms = 4500) {
      bubble.textContent = text;
      if (pet) { const r = el.getBoundingClientRect(); el.classList.toggle('left', r.left + r.width / 2 < window.innerWidth / 2); }
      bubble.classList.add('show');
      clearTimeout(api.bt);
      api.bt = setTimeout(() => bubble.classList.remove('show'), ms);
    },
    destroy() { instances.delete(api); el.remove(); }
  };
  instances.add(api);
  api.setMood(base());
  return api;
}

export function speak(text, ms) { const k = firstVisible(); if (k) k.say(text, ms); }
export function react(mood, ms = 1100) { instances.forEach((i) => { if (visible(i)) i.setMood(mood, ms); }); }

/* Cursor: os olhos acompanham */
let raf = 0, mx = 0, my = 0;
function look() {
  raf = 0;
  instances.forEach((i) => {
    if (!i.el.isConnected) { instances.delete(i); return; }
    if (!visible(i) || S.sleeping) return;
    const r = i.el.getBoundingClientRect();
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * 0.55);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 260);
    i.el.style.setProperty('--px', (dx / d * 6 * k).toFixed(1) + 'px');
    i.el.style.setProperty('--py', (dy / d * 7 * k).toFixed(1) + 'px');
  });
}
window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });

/* Sono e despertar */
function wake() {
  S.lastActive = Date.now();
  if (S.sleeping) { S.sleeping = false; react('happy', 900); speak('Voltei! Onde paramos?', 2600); }
}
['pointermove', 'keydown', 'pointerdown', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
setInterval(() => {
  if (!S.sleeping && !S.focusing && Date.now() - S.lastActive > 60000) {
    S.sleeping = true;
    instances.forEach((i) => { if (visible(i)) i.setMood('sleep'); });
  }
}, 5000);

/* Modo foco: detecta o timer pelo título da aba */
setInterval(() => {
  const f = /^\d\d:\d\d \u00b7 Krisis/.test(document.title);
  if (f === S.focusing) return;
  S.focusing = f;
  react(base(), 0);
  speak(f ? 'Modo foco ligado. Eu fico quietinho.' : 'Boa! Pausa merecida.', 3200);
}, 1000);

/* Reações aos eventos do site */
const centerOf = (k) => { const r = k.el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.4]; };
document.addEventListener('krisis:stats', (e) => {
  const n = e.detail && e.detail.n;
  react('happy', 1000);
  const k = firstVisible();
  if (k && n) { const [x, y] = centerOf(k); floatText(x, y - 20, '+' + n + ' XP'); }
});
document.addEventListener('krisis:mission', (e) => {
  react('cheer', 2400);
  const k = firstVisible();
  if (k) { const [x, y] = centerOf(k); confetti(x, y, 36); }
  speak('Missão cumprida: ' + e.detail.t + ' (+' + e.detail.xp + ' XP)', 5000);
});
document.addEventListener('krisis:levelup', (e) => {
  react('cheer', 2400);
  const k = firstVisible();
  if (k) { const [x, y] = centerOf(k); confetti(x, y, 44); }
  speak('Nível ' + e.detail.level + '! Você está voando.', 4500);
});

const TIPS = {
  hoje: ['Comece pela missão mais fácil. O primeiro passo pesa mais.', 'Aperte Ctrl+K para anotar, buscar ou criar tarefas de qualquer tela.'],
  analisar: ['Cole o link oficial ou envie o PDF. Eu leio, você decide.', 'Depois de analisar, transforme em página para montar seu checklist.'],
  editais: ['Seus editais salvos alimentam o Radar de prazos.'],
  prazos: ['Crie uma tarefa para cada data importante. Prazo anotado é prazo cumprido.'],
  tarefas: ['Tarefas pequenas ganham de listas gigantes. Que tal uma de 10 minutos?', 'Escreva "amanhã" ou uma data na barra de comando e eu agendo.'],
  cartoes: ['Errou? Normal. O cartão volta mais cedo e você fixa.'],
  foco: ['25 minutos sem celular. Eu fico de olho aqui.'],
  pagina: ['Digite / num bloco vazio para mudar o tipo. No menu do bloco dá para virar cartão.'],
  plus: ['O Plus coloca a IA para montar seu plano e seus cartões.']
};
function routeTip() {
  const seg = (location.hash || '#/hoje').split('/')[1] || 'hoje';
  if (S.shown.has(seg) || !TIPS[seg]) return;
  S.shown.add(seg);
  speak(pick(TIPS[seg]), 5200);
}
window.addEventListener('hashchange', () => setTimeout(routeTip, 900));

/* Interagir: clicar, arrastar, cosquinhas */
const LINES = ['Oi! Bora estudar?', 'Eu cuido da sua sequência.', 'Só mais um cartão?', 'Respire fundo. Um passo de cada vez.', 'Revisar antes de dormir ajuda a fixar.', 'Você está indo bem!'];
function poke(k) {
  const now = Date.now();
  S.clicks = S.clicks.filter((t) => now - t < 3500);
  S.clicks.push(now);
  k.el.classList.remove('poke', 'spin');
  void k.el.offsetWidth;
  if (S.clicks.length >= 5) {
    k.el.classList.add('spin');
    k.setMood('happy', 1200);
    k.say('Hihi, cócegas!', 2600);
    S.clicks = [];
    setTimeout(() => k.el.classList.remove('spin'), 900);
    return;
  }
  k.el.classList.add('poke');
  k.setMood('happy', 1000);
  k.say(pick(LINES), 3600);
  setTimeout(() => k.el.classList.remove('poke'), 600);
}

export function bindPoke(k) {
  let sx = 0, sy = 0, ox = 0, oy = 0, down = false, moved = false;
  const el = k.el;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = true; moved = false; sx = e.clientX; sy = e.clientY;
    const r = el.getBoundingClientRect(); ox = r.left; oy = r.top;
    if (k.pet) el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!down || !k.pet) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) { moved = true; el.classList.add('dragging'); k.setMood('carry'); }
    el.style.left = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, ox + dx)) + 'px';
    el.style.top = Math.max(4, Math.min(window.innerHeight - el.offsetHeight - 4, oy + dy)) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
  });
  el.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    el.classList.remove('dragging');
    if (moved) { store.set('krisis.pet.pos', { x: parseFloat(el.style.left), y: parseFloat(el.style.top) }); k.setMood('happy', 900); k.say('Gostei daqui!', 2200); }
    else poke(k);
  });
}

export function mountPet() {
  if (document.querySelector('.kri-pet')) return;
  const k = createKri({ size: 92, pet: true });
  const pos = store.get('krisis.pet.pos', null);
  if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
    k.el.style.left = Math.max(4, Math.min(window.innerWidth - 96, pos.x)) + 'px';
    k.el.style.top = Math.max(4, Math.min(window.innerHeight - 110, pos.y)) + 'px';
    k.el.style.right = 'auto'; k.el.style.bottom = 'auto';
  }
  document.body.append(k.el);
  bindPoke(k);
}
export function unmountPet() { instances.forEach((i) => { if (i.pet) i.destroy(); }); }

export function startMascot(name) {
  mountPet();
  if (S.greeted) return;
  S.greeted = true;
  setTimeout(() => speak('Oi, ' + name + '! Eu sou o Kri. Vamos estudar?', 4600), 1500);
  const st = getStats();
  if (new Date().getHours() >= 18 && !st.studiedToday && st.streak > 0) {
    setTimeout(() => { react('sad', 3600); speak('Sua sequência de ' + st.streak + (st.streak === 1 ? ' dia' : ' dias') + ' está em risco. Dez minutinhos salvam o dia.', 6000); }, 8000);
  }
}
