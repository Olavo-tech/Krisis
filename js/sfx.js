// Sons do Eduquack: sintetizados na hora (sem arquivos). O "quack" do Tuck é macio e curto, com reverberação leve.
import { store } from './core.js';

let ctx = null, master = null, verb = null;
let on = store.get('krisis.sound', true);
export const soundOn = () => on;
export function setSound(v) { on = !!v; store.set('krisis.sound', on); if (master) master.gain.value = on ? 0.9 : 0; }
export function haptic(ms = 8) { try { if (store.get('krisis.haptic', true) && navigator.vibrate) navigator.vibrate(ms); } catch (_) { /* sem vibração */ } }

function ac() {
  if (!ctx) {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return null;
    ctx = new A();
    master = ctx.createGain(); master.gain.value = on ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.1);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = buf;
    const vg = ctx.createGain(); vg.gain.value = 0.2; verb.connect(vg); vg.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function voice({ type = 'sine', f = 440, to = null, t = 0, dur = 0.18, g = 0.16, att = 0.008, wet = 0.25, lp = 0 }) {
  if (!on) return;
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const o = c.createOscillator(); const gn = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, now);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + dur * 0.92);
  gn.gain.setValueAtTime(0.0001, now); gn.gain.exponentialRampToValueAtTime(g, now + att); gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(gn);
  let out = gn;
  if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; gn.connect(fl); out = fl; }
  out.connect(master);
  if (wet) { const w = c.createGain(); w.gain.value = wet; out.connect(w); w.connect(verb); }
  o.start(now); o.stop(now + dur + 0.12);
}

function noise({ t = 0, dur = 0.1, g = 0.04, f = 1800, q = 1, to = null }) {
  if (!on) return;
  const c = ac(); if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
  const now = c.currentTime + t;
  bp.frequency.setValueAtTime(f, now); if (to) bp.frequency.exponentialRampToValueAtTime(to, now + dur);
  const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, now); gn.gain.exponentialRampToValueAtTime(g, now + dur * 0.3); gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(bp); bp.connect(gn); gn.connect(master); s.start(now);
}

// Um "quack" macio: serra + quadrada passando por dois formantes (nasal), com envelope curto.
function quackOne(t, f0, f1, dur = 0.14, g = 0.12) {
  if (!on) return;
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const k = 0.96 + Math.random() * 0.1;
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * k, now); o.frequency.exponentialRampToValueAtTime(f1 * k, now + dur);
  const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(f0 * k * 0.5, now); o2.frequency.exponentialRampToValueAtTime(f1 * k * 0.5, now + dur);
  const bp1 = c.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 1100; bp1.Q.value = 2.2;
  const bp2 = c.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 2600; bp2.Q.value = 3;
  const mix = c.createGain(); mix.gain.value = 0.9;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, now); gn.gain.exponentialRampToValueAtTime(g, now + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.05);
  o.connect(bp1); o2.connect(bp1); o.connect(bp2); bp1.connect(mix); bp2.connect(mix); mix.connect(lp); lp.connect(gn); gn.connect(master);
  const w = c.createGain(); w.gain.value = 0.15; gn.connect(w); w.connect(verb);
  o.start(now); o2.start(now); o.stop(now + dur + 0.1); o2.stop(now + dur + 0.1);
}

const bell = (f, t = 0, g = 0.14, dur = 0.9) => {
  voice({ f, t, dur, g, att: 0.004, wet: 0.35 });
  voice({ f: f * 2.01, t, dur: dur * 0.5, g: g * 0.32, att: 0.003, wet: 0.35 });
  voice({ f: f * 3.02, t, dur: dur * 0.3, g: g * 0.14, att: 0.003, wet: 0.3 });
};

let lastTap = 0;
export const sfx = {
  unlock() { ac(); },
  tap() { const n = performance.now(); if (n - lastTap < 45) return; lastTap = n; voice({ type: 'triangle', f: 520, to: 340, dur: 0.07, g: 0.06, wet: 0.1 }); },
  pop() { voice({ f: 380, to: 880, dur: 0.11, g: 0.12, wet: 0.2 }); voice({ f: 1500, t: 0.05, dur: 0.08, g: 0.04 }); },
  done() { bell(659.25, 0, 0.13, 0.7); bell(987.77, 0.09, 0.13, 0.9); },
  xp() { bell(880, 0, 0.08, 0.5); bell(1318.5, 0.07, 0.08, 0.6); },
  level() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(f, i * 0.09, 0.12, 1.1)); },
  mission() { sfx.level(); setTimeout(() => sfx.quack('happy'), 520); },
  magic() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(f, i * 0.07, 0.07, 0.6)); },
  whoosh() { noise({ dur: 0.22, g: 0.022, f: 600, to: 2600, q: 0.6 }); },
  tick() { noise({ dur: 0.03, g: 0.016, f: 2200 + Math.random() * 1200, q: 2 }); },
  oops() { voice({ type: 'triangle', f: 340, to: 260, dur: 0.16, g: 0.1, lp: 1800 }); voice({ type: 'triangle', f: 290, to: 210, t: 0.17, dur: 0.22, g: 0.1, lp: 1800 }); },
  yawn() { voice({ type: 'triangle', f: 420, to: 210, dur: 0.9, g: 0.07, lp: 1400, wet: 0.3 }); },
  hello() { quackOne(0, 520, 340, 0.13, 0.11); quackOne(0.17, 620, 400, 0.15, 0.11); },
  quack(kind = 'happy') {
    if (kind === 'happy') { quackOne(0, 520, 340, 0.13, 0.12); quackOne(0.17, 600, 380, 0.15, 0.12); }
    else if (kind === 'curious') quackOne(0, 360, 540, 0.2, 0.1);
    else if (kind === 'sad') quackOne(0, 330, 200, 0.4, 0.09);
    else if (kind === 'giggle') for (let i = 0; i < 4; i++) quackOne(i * 0.09, 620 + (i % 2) * 90, 440, 0.07, 0.08);
    else quackOne(0, 400, 320, 0.2, 0.08);
  }
};
sfx.chirp = sfx.quack;

export function initSfx() {
  const unlock = () => { ac(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { once: true, passive: true }));
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('button, a, [role=button], .tab');
    if (!t || t.dataset.quiet !== undefined || t.classList.contains('tuck') || t.closest('.tuck') || t.disabled) return;
    sfx.tap(); haptic(8);
  }, true);
  document.addEventListener('change', (e) => { if (e.target && e.target.type === 'checkbox') { sfx.pop(); haptic(12); } }, true);
  document.addEventListener('krisis:stats', () => sfx.xp());
  document.addEventListener('krisis:mission', () => { sfx.mission(); haptic(30); });
  document.addEventListener('krisis:levelup', () => { sfx.level(); haptic(40); });
  window.addEventListener('hashchange', () => sfx.whoosh());
}
