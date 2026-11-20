// Tuck — o pato mascote do Eduquack. Muitas expressões e animações, sem balões de fala.
// Em modo de suspensão (standby) ele dorme e só reage a cliques e a expressões rápidas.
import { h, floatText } from './core.js';
import { sfx } from './sfx.js';

export const TUCK = 'Tuck';

const WING = 'M80 158 C58 128 26 108 8 114 C12 124 6 134 16 140 C12 150 24 156 34 156 C40 170 66 178 88 168 Z';
const SVG = `<svg viewBox="0 0 260 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<ellipse cx="130" cy="262" rx="62" ry="7" fill="rgba(27,23,64,.18)"/>
<g class="t-all">
<g class="t-foot-l"><path d="M96 238 Q84 252 70 254 Q68 262 80 262 Q92 264 102 258 Q108 262 114 256 Q112 244 108 238 Z" fill="#ff8a1f"/></g>
<g class="t-foot-r"><path d="M164 238 Q176 252 190 254 Q192 262 180 262 Q168 264 158 258 Q152 262 146 256 Q148 244 152 238 Z" fill="#ff8a1f"/></g>
<ellipse cx="130" cy="186" rx="76" ry="62" fill="#ffd21f"/>
<ellipse cx="130" cy="202" rx="48" ry="36" fill="#ffe98a"/>
<path d="M62 172 Q58 204 86 224 Q70 202 72 178 Z" fill="#f2b705" opacity=".6"/>
<g class="t-book"><path d="M88 196 L130 208 L172 196 L172 238 L130 250 L88 238 Z" fill="#3b3a8f"/><path d="M130 208 L130 250" stroke="#fff" stroke-width="2" opacity=".5"/><path d="M96 204 L124 212 M96 214 L124 222 M96 224 L124 232 M136 212 L164 204 M136 222 L164 214" stroke="#cfd0ff" stroke-width="3" stroke-linecap="round"/></g>
<g class="t-head">
<circle cx="130" cy="108" r="56" fill="#ffd21f"/>
<path d="M86 86 Q96 68 118 64" stroke="#ffe98a" stroke-width="6" stroke-linecap="round" fill="none" opacity=".8"/>
<g class="t-cap"><path d="M98 70 L98 90 Q130 104 162 90 L162 70 Q130 82 98 70 Z" fill="#2b2b33"/><polygon points="130,36 200,60 130,80 60,60" fill="#1f1f26"/><circle cx="130" cy="58" r="4.5" fill="#3a3a44"/>
<g class="t-tassel"><path d="M64 61 L60 98" stroke="#d6334b" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="103" r="7" fill="#d6334b"/><path d="M55 108 L53 120 M60 109 L60 122 M65 108 L67 120" stroke="#d6334b" stroke-width="3" stroke-linecap="round"/></g></g>
<ellipse cx="96" cy="126" rx="10" ry="6.5" fill="#ff8fa3" opacity=".4"/><ellipse cx="164" cy="126" rx="10" ry="6.5" fill="#ff8fa3" opacity=".4"/>
<path class="t-brow t-brow-l" d="M100 94 Q112 88 124 94" stroke="#2b2b33" stroke-width="4" stroke-linecap="round" fill="none"/><path class="t-brow t-brow-r" d="M136 94 Q148 88 160 94" stroke="#2b2b33" stroke-width="4" stroke-linecap="round" fill="none"/>
<g class="t-eye t-eye-l"><g class="t-ball"><ellipse cx="108" cy="110" rx="8" ry="10.5" fill="#1b1a22"/><circle cx="105" cy="106" r="3" fill="#fff"/></g></g>
<g class="t-eye t-eye-r"><g class="t-ball"><ellipse cx="152" cy="110" rx="8" ry="10.5" fill="#1b1a22"/><circle cx="149" cy="106" r="3" fill="#fff"/></g></g>
<g class="t-sleepeyes" fill="none" stroke="#1b1a22" stroke-width="4" stroke-linecap="round"><path d="M98 112 Q108 120 118 112"/><path d="M142 112 Q152 120 162 112"/></g>
<path d="M102 122 Q130 106 158 122 Q152 140 130 140 Q108 140 102 122 Z" fill="#ff8a1f"/><path d="M112 118 Q130 110 148 118" stroke="#ffb35c" stroke-width="4" stroke-linecap="round" fill="none"/>
<circle cx="121" cy="119" r="1.6" fill="#c2610b"/><circle cx="139" cy="119" r="1.6" fill="#c2610b"/>
<path class="t-m t-m-closed" d="M112 129 Q130 140 148 129" stroke="#c2610b" stroke-width="3.5" stroke-linecap="round" fill="none"/>
<g class="t-m t-m-open"><path d="M108 126 Q130 152 152 126 Z" fill="#b3302a"/><ellipse cx="130" cy="140" rx="10" ry="6" fill="#ff7a8a"/></g>
<path class="t-m t-m-sad" d="M114 136 Q130 126 146 136" stroke="#c2610b" stroke-width="3.5" stroke-linecap="round" fill="none"/>
<ellipse class="t-m t-m-o" cx="130" cy="132" rx="7" ry="8" fill="#b3302a"/>
<path class="t-m t-m-sleep" d="M120 130 Q130 135 140 130" stroke="#c2610b" stroke-width="3.5" stroke-linecap="round" fill="none"/>
</g>
<g class="t-wing-l"><g class="t-flap"><path d="${WING}" fill="#ffc400"/><path d="M36 156 C44 146 56 142 68 146 M24 142 C34 136 46 134 56 138" stroke="#e8a200" stroke-width="3" fill="none" stroke-linecap="round"/></g></g>
<g class="t-wing-r"><g class="t-flap"><g transform="translate(260 0) scale(-1 1)"><path d="${WING}" fill="#ffc400"/><path d="M36 156 C44 146 56 142 68 146 M24 142 C34 136 46 134 56 138" stroke="#e8a200" stroke-width="3" fill="none" stroke-linecap="round"/></g></g></g>
<g class="t-zzz"><text class="tz1" x="186" y="78" font-size="22" font-weight="800" fill="#1b1740">z</text><text class="tz2" x="202" y="54" font-size="28" font-weight="800" fill="#1b1740">Z</text></g>
</g>
<g class="t-sp"><path class="sp1" d="M26 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#f2b705"/><path class="sp2" d="M232 62 l2.500 6 6 2.500 -6 2.500 -2.500 6 -2.500 -6 -6 -2.500 6 -2.500z" fill="#5b4bd6"/><circle class="sp3" cx="214" cy="24" r="4" fill="#ff6b6b"/></g>
</svg>`;

const instances = new Set();
const S = { lastActive: Date.now(), focusing: false, clicks: [] };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const visible = (i) => i.el.isConnected && i.el.getClientRects().length > 0;
const COLORS = ['#f2b705', '#1b1740', '#5b4bd6', '#b8f0cf', '#ffbdbd', '#cfc8ff'];

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

export function createTuck({ size = 120, standby = false } = {}) {
  const el = h('div', { class: 'tuck m-idle' + (standby ? ' is-standby' : ''), style: 'width:' + size + 'px;height:' + Math.round(size * 1.04) + 'px', role: 'img', 'aria-label': TUCK + ', o mascote do Eduquack' });
  el.innerHTML = SVG;
  const api = { el, standby, t: null, it: null, locked: false, dozing: false };
  api.base = () => (api.standby ? 'sleep' : S.focusing ? 'focus' : 'idle');
  api.setMood = (m, ms) => {
    clearTimeout(api.t);
    [...el.classList].filter((c) => c.startsWith('m-')).forEach((c) => el.classList.remove(c));
    el.classList.add('m-' + m);
    if (ms) api.t = setTimeout(() => api.setMood(api.base()), ms);
  };
  api.look = (dx, dy) => { el.style.setProperty('--px', dx.toFixed(1) + 'px'); el.style.setProperty('--py', dy.toFixed(1) + 'px'); };
  api.lookAt = (target, ratio = 0) => {
    const r = el.getBoundingClientRect(), t = target.getBoundingClientRect();
    const dx = t.left + t.width * (0.2 + 0.6 * ratio) - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height * 0.42);
    const d = Math.hypot(dx, dy) || 1;
    api.look(dx / d * 3.5, dy / d * 3.5);
  };
  api.anim = (cls, ms = 500) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
  api.nudge = () => api.anim('nudge', 200);
  api.shake = () => api.anim('shake', 600);
  api.quack = () => { el.classList.add('q-open'); api.anim('quackhead', 300); setTimeout(() => el.classList.remove('q-open'), 260); };
  api.say = () => {};
  api.setStandby = (v) => { api.standby = v; el.classList.toggle('is-standby', v); api.setMood(api.base()); };
  api.destroy = () => { clearTimeout(api.it); clearTimeout(api.t); instances.delete(api); el.remove(); };
  el.addEventListener('click', () => poke(api));
  instances.add(api);
  api.setMood(api.base());
  idleLoop(api);
  return api;
}

function poke(a) {
  const now = Date.now();
  S.clicks = S.clicks.filter((t) => now - t < 3500);
  S.clicks.push(now);
  a.anim('poke', 500);
  if (S.clicks.length >= 5) { a.anim('spin', 900); a.setMood('happy', 1200); sfx.quack('giggle'); S.clicks = []; return; }
  const m = pick(['happy', 'wave', 'dance', 'cheer', 'think']);
  a.setMood(m, m === 'cheer' ? 1600 : 1500);
  a.quack();
  sfx.quack(m === 'think' ? 'curious' : 'happy');
}

// Pequenas travessuras quando está acordado e parado
function idleLoop(a) {
  clearTimeout(a.it);
  a.it = setTimeout(() => {
    if (a.el.isConnected && !a.standby && visible(a) && !document.hidden && a.el.classList.contains('m-idle')) {
      const act = pick(['flap', 'hop', 'wiggle', 'tilt', 'look', 'preen', 'look']);
      if (act === 'look') { a.look(rand(-3.5, 3.5), rand(-3, 3)); setTimeout(() => a.look(0, 0), 1000); }
      else a.anim('a-' + act, act === 'flap' ? 1100 : act === 'hop' ? 600 : 1000);
    }
    if (a.el.isConnected) idleLoop(a);
  }, 3500 + Math.random() * 4500);
}

// cursor: os olhos dos Tucks acordados acompanham
let raf = 0, mx = 0, my = 0;
function look() {
  raf = 0;
  instances.forEach((i) => {
    if (!i.el.isConnected) { instances.delete(i); return; }
    if (i.standby || i.locked || !visible(i) || i.dozing) return;
    const r = i.el.getBoundingClientRect();
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * 0.42);
    const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
    i.look(dx / d * 3.5 * k, dy / d * 3.5 * k);
  });
}
window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });

function wake() {
  S.lastActive = Date.now();
  instances.forEach((i) => { if (i.dozing) { i.dozing = false; if (visible(i)) i.setMood(i.base()); } });
}
['pointermove', 'keydown', 'pointerdown', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
setInterval(() => {
  if (S.focusing || document.hidden || Date.now() - S.lastActive < 90000) return;
  instances.forEach((i) => { if (!i.standby && visible(i) && !i.dozing) { i.dozing = true; i.setMood('sleep'); } });
}, 5000);

setInterval(() => {
  const f = /^\d\d:\d\d \u00b7 Eduquack/.test(document.title);
  if (f === S.focusing) return;
  S.focusing = f;
  instances.forEach((i) => { if (visible(i) && !i.dozing) i.setMood(i.base()); });
}, 1000);

// Reações do site: só expressões (sem fala)
export function react(mood, ms = 1100) { instances.forEach((i) => { if (visible(i) && !i.dozing) i.setMood(mood, ms); }); }
const awakeOne = () => [...instances].find((i) => !i.standby && visible(i));
document.addEventListener('krisis:stats', (e) => {
  const n = e.detail && e.detail.n;
  instances.forEach((i) => { if (visible(i)) i.setMood('happy', i.standby ? 1200 : 1000); });
  const k = awakeOne();
  if (k && n) { const r = k.el.getBoundingClientRect(); floatText(r.left + r.width / 2, r.top + 10, '+' + n + ' XP'); }
});
document.addEventListener('krisis:mission', () => {
  react('cheer', 2400);
  const k = awakeOne();
  if (k) { const r = k.el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.4, 40); }
});
document.addEventListener('krisis:levelup', () => {
  react('cheer', 2400);
  const k = awakeOne();
  if (k) { const r = k.el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.4, 48); }
});
