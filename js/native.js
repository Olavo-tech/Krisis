import { store } from './core.js';

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
export function enableFullscreenPreference() {
  document.addEventListener('pointerdown', () => {
    if (isMobile() && !isStandalone() && !inFullscreen() && store.get('krisis.fs', true)) enterFullscreen();
  }, { passive: true });
}
