// Experiência de app nativo no celular: tela cheia, instalação, toque inicial e dica para iPhone.
import { h, store } from './core.js';
import { createKri, MASCOT } from './mascot.js';
import { ic } from './icons.js';
import { sfx, haptic } from './sfx.js';

export const isMobile = () => window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches;
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.standalone === true;
export const inFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const canFullscreen = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

let deferred = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
export const canInstall = () => !!deferred;
export async function installApp() {
  if (!deferred) return false;
  deferred.prompt();
  const r = await deferred.userChoice.catch(() => null);
  deferred = null;
  return !!(r && r.outcome === 'accepted');
}

export function enterFullscreen() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn) return Promise.resolve(false);
  return Promise.resolve(fn.call(el, { navigationUI: 'hide' })).then(() => {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {}); } catch (_) { /* ignora */ }
    return true;
  }).catch(() => false);
}

// Se o usuário sair da tela cheia, o próximo toque volta para ela (pode ser desligado em Eu).
function stickyFullscreen() {
  document.addEventListener('pointerdown', () => {
    if (isMobile() && !isStandalone() && !inFullscreen() && store.get('krisis.fs', true)) enterFullscreen();
  }, { passive: true });
}

function iosHint() {
  if (!isIOS() || isStandalone()) return;
  const last = store.get('krisis.iosHint', 0);
  if (Date.now() - last < 3 * 864e5) return;
  store.set('krisis.iosHint', Date.now());
  const card = h('div', { class: 'ios-hint' },
    h('b', {}, 'Quer o Krisis em tela cheia?'),
    h('p', {}, 'Toque em Compartilhar e depois em "Adicionar \u00e0 Tela de In\u00edcio". O app abre sem barras do navegador.'),
    h('button', { class: 'btn sm green', onclick: () => card.remove() }, 'Entendi'));
  document.body.append(card);
}

// Tela "toque para acordar o Krispim": o toque libera tela cheia e som.
export function tapToStart() {
  return new Promise((resolve) => {
    if (!isMobile() || isStandalone() || inFullscreen()) { resolve(false); return; }
    const kri = createKri({ size: 200 });
    kri.setMood('sleep');
    const ov = h('div', { class: 'tts', role: 'button', tabindex: '0', 'aria-label': 'Toque para come\u00e7ar' },
      h('div', { class: 'tts-blob b1' }), h('div', { class: 'tts-blob b2' }), h('div', { class: 'tts-blob b3' }),
      h('div', { class: 'tts-mid' }, kri.el,
        h('h1', {}, 'Toque para acordar o ' + MASCOT),
        h('p', {}, 'O Krisis abre em tela cheia, como um app.')),
      h('span', { class: 'tts-cta' }, ic('expand', 18), 'Toque em qualquer lugar'));
    let busy = false;
    async function go() {
      if (busy) return; busy = true;
      sfx.unlock(); sfx.hello(); haptic(20);
      kri.setMood('cheer', 1200);
      await enterFullscreen();
      stickyFullscreen();
      ov.classList.add('out');
      setTimeout(() => { ov.remove(); resolve(true); iosHint(); }, 560);
    }
    ov.addEventListener('click', go);
    ov.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); });
    document.body.append(ov);
  });
}
