// Sons do Krisis: sintetizados na hora (sem arquivos), com reverberação suave para soar orgânico e fofo.
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
    const len = Math.floor(ctx.sampleRate * 1.2);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = buf;
    const vg = ctx.createGain(); vg.gain.value = 0.22; verb.connect(vg); vg.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function voice({ type = 'sine', f = 440, to = null, t = 0, dur = 0.18, g = 0.16, att = 0.008, vib = 0, vibRate = 6, wet = 0.25, pan = 0, lp = 0 }) {
  if (!on) return;
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const o = c.createOscillator(); const gn = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, now);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + dur * 0.92);
  if (vib) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = vibRate; lg.gain.value = f * vib; l.connect(lg); lg.connect(o.frequency); l.start(now); l.stop(now + dur + 0.1); }
  gn.gain.setValueAtTime(0.0001, now); gn.gain.exponentialRampToValueAtTime(g, now + att); gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(gn);
  let out = gn;
  if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; gn.connect(fl); out = fl; }
  if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; out.connect(p); out = p; }
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

const bell = (f, t = 0, g = 0.15, dur = 0.9) => {
  voice({ f, t, dur, g, att: 0.004, wet: 0.35 });
  voice({ f: f * 2.01, t, dur: dur * 0.5, g: g * 0.32, att: 0.003, wet: 0.35 });
  voice({ f: f * 3.02, t, dur: dur * 0.3, g: g * 0.14, att: 0.003, wet: 0.3 });
};

let lastTap = 0;
export const sfx = {
  unlock() { ac(); },
  tap() { const n = performance.now(); if (n - lastTap < 45) return; lastTap = n; voice({ type: 'triangle', f: 520, to: 340, dur: 0.07, g: 0.07, wet: 0.1 }); },
  pop() { voice({ f: 380, to: 880, dur: 0.11, g: 0.13, wet: 0.2 }); voice({ f: 1500, t: 0.05, dur: 0.08, g: 0.04 }); },
  done() { bell(659.25, 0, 0.14, 0.7); bell(987.77, 0.09, 0.14, 0.9); },
  xp() { bell(880, 0, 0.09, 0.5); bell(1318.5, 0.07, 0.09, 0.6); },
  level() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(f, i * 0.09, 0.13, 1.1)); },
  mission() { sfx.level(); setTimeout(() => sfx.chirp('happy'), 520); },
  magic() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(f, i * 0.07, 0.07, 0.6)); },
  whoosh() { noise({ dur: 0.22, g: 0.025, f: 600, to: 2600, q: 0.6 }); },
  tick() { noise({ dur: 0.03, g: 0.018, f: 2200 + Math.random() * 1200, q: 2 }); },
  oops() { voice({ type: 'triangle', f: 340, to: 260, dur: 0.16, g: 0.11, lp: 1800 }); voice({ type: 'triangle', f: 290, to: 210, t: 0.17, dur: 0.22, g: 0.11, lp: 1800 }); },
  yawn() { voice({ type: 'triangle', f: 420, to: 210, dur: 0.9, g: 0.08, vib: 0.02, vibRate: 4, lp: 1400, wet: 0.3 }); },
  hello() { voice({ f: 600, to: 900, dur: 0.1, g: 0.13 }); voice({ f: 800, to: 1250, t: 0.12, dur: 0.14, g: 0.13 }); },
  chirp(kind = 'happy') {
    if (kind === 'happy') { voice({ f: 720, to: 1180, dur: 0.13, g: 0.13, vib: 0.012 }); voice({ f: 900, to: 1500, t: 0.14, dur: 0.16, g: 0.13, vib: 0.012 }); }
    else if (kind === 'curious') voice({ f: 520, to: 860, dur: 0.2, g: 0.11, vib: 0.01 });
    else if (kind === 'sad') voice({ f: 640, to: 330, dur: 0.5, g: 0.1, vib: 0.03, vibRate: 5, lp: 2200 });
    else if (kind === 'giggle') for (let i = 0; i < 4; i++) voice({ f: 900 + (i % 2) * 180, to: 1250 + (i % 2) * 160, t: i * 0.09, dur: 0.07, g: 0.1, pan: i % 2 ? 0.3 : -0.3 });
    else if (kind === 'hum') voice({ type: 'triangle', f: 330, to: 380, dur: 0.35, g: 0.08, vib: 0.02, lp: 1500 });
  }
};

export function initSfx() {
  const unlock = () => { ac(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { once: true, passive: true }));
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('button, a, [role=button], .tab');
    if (!t || t.dataset.quiet !== undefined) return;
    sfx.tap(); haptic(8);
  }, true);
  document.addEventListener('change', (e) => { if (e.target && e.target.type === 'checkbox') { sfx.pop(); haptic(12); } }, true);
  document.addEventListener('krisis:stats', () => sfx.xp());
  document.addEventListener('krisis:mission', () => { sfx.mission(); haptic(30); });
  document.addEventListener('krisis:levelup', () => { sfx.level(); haptic(40); });
  window.addEventListener('hashchange', () => sfx.whoosh());
}
