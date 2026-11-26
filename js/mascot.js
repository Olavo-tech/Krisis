// Krispim — o mascote do Krisis. Laranja e preto, olhos enormes, reage ao site, tem voz fofa e animações.
import { h, store, getStats, floatText } from './core.js';
import { ic } from './icons.js';
import { sfx } from './sfx.js';

export const MASCOT = 'Krispim';

const SVG = `<svg viewBox="0 0 220 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<ellipse cx="110" cy="215" rx="63" ry="8" fill="#492616" opacity=".14"/>
<g class="k-all">
<path d="M86 192c-14 0-26 7-27 14-2 9 25 12 39 5 4-2 5-10 1-15zM134 192c14 0 26 7 27 14 2 9-25 12-39 5-4-2-5-10-1-15z" fill="#c75120"/>
<path d="M103 99c-37-6-59 15-61 48-2 36 24 58 68 58 43 0 70-23 68-58-2-36-29-56-75-48Z" fill="#f39342"/>
<path d="M110 140c-25 0-47 13-47 32 0 17 22 27 47 27s47-10 47-27c0-19-22-32-47-32z" fill="#ffe0a2"/>
<g class="k-arm-l"><g class="k-sway"><path d="M66 124c-25 0-42 20-38 42 1 5 6 8 11 7 21-4 34-17 38-37 1-6-5-12-11-12Z" fill="#e57433"/><path d="M39 163c9-3 16-9 21-15" stroke="#bb541f" stroke-width="3" fill="none" stroke-linecap="round"/></g></g>
<g class="k-arm-r"><g class="k-sway k-sway2"><path d="M154 124c25 0 42 20 38 42-1 5-6 8-11 7-21-4-34-17-38-37-1-6 5-12 11-12Z" fill="#e57433"/><path d="M181 163c-9-3-16-9-21-15" stroke="#bb541f" stroke-width="3" fill="none" stroke-linecap="round"/></g></g>
<path d="M107 41c-38 0-65 25-65 59 0 30 26 51 67 51 41 0 69-19 69-51 0-34-30-59-71-59z" fill="#ffbb64"/>
<path d="M56 83c8-15 22-25 40-29" fill="none" stroke="#ffd99b" stroke-width="7" stroke-linecap="round"/>
<g class="k-ant"><path d="M109 47c-3-15 4-26 14-29 3 10 0 19-8 27 8-8 18-9 27-5-5 10-19 15-33 7Z" fill="#ff9d49"/></g>
<path class="k-band" d="M47 88q62-26 126 0" stroke="#462a42" stroke-width="8" stroke-linecap="round" fill="none"/>
<path class="k-brow k-brow-l" d="M70 86q11-8 22-2" stroke="#653019" stroke-width="4" stroke-linecap="round" fill="none"/>
<path class="k-brow k-brow-r" d="M128 84q11-6 22 2" stroke="#653019" stroke-width="4" stroke-linecap="round" fill="none"/>
<g class="k-eye k-eye-l"><ellipse cx="81" cy="108" rx="17" ry="21" fill="#fff8ec"/><g class="k-pupil"><ellipse cx="83" cy="111" rx="8" ry="11" fill="#2e1d1e"/><circle cx="80" cy="106" r="3" fill="#fff"/></g></g>
<g class="k-eye k-eye-r"><ellipse cx="139" cy="108" rx="17" ry="21" fill="#fff8ec"/><g class="k-pupil"><ellipse cx="137" cy="111" rx="8" ry="11" fill="#2e1d1e"/><circle cx="134" cy="106" r="3" fill="#fff"/></g></g>
<g class="k-sleepeyes" fill="none" stroke="#653019" stroke-width="4" stroke-linecap="round"><path d="M70 109q11 10 22 0m36 0q11 10 22 0"/></g>
<ellipse cx="62" cy="129" rx="9" ry="5" fill="#f38359"/><ellipse cx="158" cy="129" rx="9" ry="5" fill="#f38359"/>
<path class="k-m k-m-idle" d="M92 135q18-19 36 0c-1 14-35 14-36 0Z" fill="#d85823"/>
<path class="k-m k-m-happy" d="M90 135q20-20 40 0c-4 20-36 20-40 0Z" fill="#a5341c"/>
<path class="k-m k-m-sad" d="M92 137q18-20 36 0-17-2-36 0Z" fill="#b84420"/>
<ellipse class="k-m k-m-o" cx="110" cy="135" rx="11" ry="10" fill="#a5341c"/>
<path class="k-m k-m-sleep" d="M94 135q16-15 32 0-16 9-32 0Z" fill="#d85823"/>
<path d="M92 132c10-4 11-8 18-8s8 4 18 8c4 9-33 11-36 0Z" fill="#f98939"/>
<path d="M103 131q7-3 14 0" fill="none" stroke="#ffb56a" stroke-width="2" stroke-linecap="round"/>
<g class="k-zzz" fill="#9063ac"><text class="kz1" x="172" y="85" font-size="21" font-weight="800">z</text><text class="kz2" x="186" y="61" font-size="26" font-weight="800">Z</text></g>
</g>
<g class="k-sp"><path class="sp1" d="M30 70l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#f3aa40"/><path class="sp2" d="M186 46l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#a88af8"/><circle class="sp3" cx="172" cy="22" r="4" fill="#f9a86f"/></g>
</svg>`;

const instances = new Set();
const S = { sleeping: false, focusing: false, lastActive: Date.now(), shown: new Set(), clicks: [], greeted: false };
const base = () => (S.focusing ? 'focus' : S.sleeping ? 'sleep' : 'idle');
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const visible = (i) => i.el.isConnected && i.el.getClientRects().length > 0;
const firstVisible = () => [...instances].find(visible);
const COLORS = ['#ff6a13', '#0b0b0f', '#ffd34d', '#c9f53a', '#bba5ff', '#ff9fd2'];

export function burst(x, y, n = 32) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 130;
    p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d - 50).toFixed(0) + 'px;--rot:' + (Math.random() * 720 - 360).toFixed(0) + 'deg;background:' + COLORS[i % COLORS.length] + ';animation-delay:' + Math.floor(Math.random() * 90) + 'ms';
    document.body.append(p);
    setTimeout(() => p.remove(), 1500);
  }
}

export function createKri({ size = 120, pet = false } = {}) {
  const el = h('div', { class: 'kri m-idle' + (pet ? ' kri-pet' : ''), style: 'width:' + size + 'px;height:' + Math.round(size * 1.05) + 'px', role: 'img', 'aria-label': MASCOT + ', o mascote do Krisis' });
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
    look(dx, dy) { el.style.setProperty('--px', dx.toFixed(1) + 'px'); el.style.setProperty('--py', dy.toFixed(1) + 'px'); },
    lookAt(target, ratio = 0) {
      const r = el.getBoundingClientRect(), t = target.getBoundingClientRect();
      const dx = t.left + t.width * (0.2 + 0.6 * ratio) - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height * 0.55);
      const d = Math.hypot(dx, dy) || 1;
      api.look(dx / d * 4, dy / d * 5);
    },
    anim(cls, ms = 500) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); },
    nudge() { api.anim('nudge', 200); },
    shake() { api.anim('shake', 600); },
    destroy() { instances.delete(api); el.remove(); }
  };
  if (pet) {
    const chat = h('button', { class: 'kri-chat', 'aria-label': 'Perguntar ao ' + MASCOT, title: 'Perguntar ao ' + MASCOT }, ic('chat', 16));
    chat.addEventListener('pointerdown', (e) => e.stopPropagation());
    chat.addEventListener('click', (e) => { e.stopPropagation(); import('./views/tutor.js').then((m) => m.openTutor()); });
    el.append(chat);
  }
  instances.add(api);
  api.setMood(base());
  return api;
}

export function speak(text, ms) { const k = firstVisible(); if (k) k.say(text, ms); }
export function react(mood, ms = 1100) { instances.forEach((i) => { if (visible(i)) i.setMood(mood, ms); }); }

let raf = 0, mx = 0, my = 0;
function look() {
  raf = 0;
  instances.forEach((i) => {
    if (!i.el.isConnected) { instances.delete(i); return; }
    if (!visible(i) || S.sleeping || i.locked) return;
    const r = i.el.getBoundingClientRect();
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * 0.55);
    const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
    i.look(dx / d * 4 * k, dy / d * 5 * k);
  });
}
window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });

function wake() {
  S.lastActive = Date.now();
  if (S.sleeping) { S.sleeping = false; react('happy', 900); sfx.chirp('curious'); speak('Voltei! Onde paramos?', 2600); }
}
['pointermove', 'keydown', 'pointerdown', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
setInterval(() => {
  if (!S.sleeping && !S.focusing && !document.hidden && Date.now() - S.lastActive > 60000) {
    S.sleeping = true;
    instances.forEach((i) => { if (visible(i)) i.setMood('sleep'); });
    sfx.yawn();
  }
}, 5000);

setInterval(() => {
  const f = /^\d\d:\d\d \u00b7 Krisis/.test(document.title);
  if (f === S.focusing) return;
  S.focusing = f;
  react(base(), 0);
  sfx.chirp(f ? 'curious' : 'happy');
  speak(f ? 'Modo foco ligado. Eu fico quietinho.' : 'Boa! Pausa merecida.', 3200);
}, 1000);

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
  if (k) { const [x, y] = centerOf(k); burst(x, y, 40); }
  speak('Miss\u00e3o cumprida: ' + e.detail.t + ' (+' + e.detail.xp + ' XP)', 5000);
});
document.addEventListener('krisis:levelup', (e) => {
  react('cheer', 2400);
  const k = firstVisible();
  if (k) { const [x, y] = centerOf(k); burst(x, y, 48); }
  speak('N\u00edvel ' + e.detail.level + '! Voc\u00ea est\u00e1 voando.', 4500);
});

const TIPS = {
  hoje: ['Comece pela miss\u00e3o mais f\u00e1cil. O primeiro passo pesa mais.', 'Aperte Ctrl+K para anotar, buscar ou criar tarefas.'],
  magico: ['Joga o material aqui e eu organizo: p\u00e1gina, cart\u00f5es e tarefas.', 'Voc\u00ea tamb\u00e9m pode compartilhar um texto de outro app direto para o Krisis.'],
  analisar: ['Cole o link oficial ou envie o PDF. Eu leio, voc\u00ea decide.'],
  editais: ['Seus editais salvos alimentam o Radar de prazos.'],
  prazos: ['Prazo anotado \u00e9 prazo cumprido. Crie as tarefas com um toque.'],
  tarefas: ['Tarefas pequenas ganham de listas gigantes.', 'Na barra de comando, escreva "amanh\u00e3" e eu agendo.'],
  cartoes: ['Errou? Normal. O cart\u00e3o volta mais cedo e voc\u00ea fixa.'],
  foco: ['25 minutos sem celular. Eu fico de olho aqui.'],
  pagina: ['Digite / num bloco vazio para mudar o tipo. No menu do bloco, d\u00e1 para virar cart\u00e3o.'],
  estudar: ['Escolha uma ferramenta e bora!'],
  eu: ['Aqui voc\u00ea ajusta som, tela cheia e tema.']
};
function routeTip() {
  const seg = (location.hash || '#/hoje').split('/')[1] || 'hoje';
  if (S.shown.has(seg) || !TIPS[seg]) return;
  S.shown.add(seg);
  speak(pick(TIPS[seg]), 5200);
}
window.addEventListener('hashchange', () => setTimeout(routeTip, 900));

const LINES = ['Oi! Bora estudar?', 'Eu cuido da sua sequ\u00eancia.', 'S\u00f3 mais um cart\u00e3o?', 'Respire fundo. Um passo de cada vez.', 'Revisar antes de dormir ajuda a fixar.', 'Voc\u00ea est\u00e1 indo bem!'];
function poke(k) {
  const now = Date.now();
  S.clicks = S.clicks.filter((t) => now - t < 3500);
  S.clicks.push(now);
  k.el.classList.remove('poke', 'spin');
  void k.el.offsetWidth;
  if (S.clicks.length >= 5) {
    k.el.classList.add('spin');
    k.setMood('happy', 1200);
    k.say('Hihi, c\u00f3cegas!', 2600);
    sfx.chirp('giggle');
    S.clicks = [];
    setTimeout(() => k.el.classList.remove('spin'), 900);
    return;
  }
  k.el.classList.add('poke');
  k.setMood('happy', 1000);
  k.say(pick(LINES), 3600);
  sfx.chirp('happy');
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
    if (!moved) { moved = true; el.classList.add('dragging'); k.setMood('carry'); sfx.chirp('curious'); }
    el.style.left = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, ox + dx)) + 'px';
    el.style.top = Math.max(4, Math.min(window.innerHeight - el.offsetHeight - 4, oy + dy)) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
  });
  el.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    el.classList.remove('dragging');
    if (moved) { store.set('krisis.pet.pos', { x: parseFloat(el.style.left), y: parseFloat(el.style.top) }); k.setMood('happy', 900); k.say('Gostei daqui!', 2200); sfx.chirp('happy'); }
    else poke(k);
  });
}

export function mountPet() {
  if (document.querySelector('.kri-pet')) return;
  const k = createKri({ size: 92, pet: true });
  const pos = store.get('krisis.pet.pos', null);
  if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) && window.innerWidth > 900) {
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
  setTimeout(() => { speak('Oi, ' + name + '! Eu sou o ' + MASCOT + '. Vamos estudar?', 4600); sfx.chirp('happy'); }, 1500);
  const st = getStats();
  if (new Date().getHours() >= 18 && !st.studiedToday && st.streak > 0) {
    setTimeout(() => { react('sad', 3600); sfx.chirp('sad'); speak('Sua sequ\u00eancia de ' + st.streak + (st.streak === 1 ? ' dia' : ' dias') + ' est\u00e1 em risco. Dez minutinhos salvam o dia.', 6000); }, 8000);
  }
}
