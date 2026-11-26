import { h, state, store } from '../core.js';
import { createKri } from '../mascot.js';

export function guide(id, title, message, next) {
  const key = 'eduquack.guide.' + state.user.id + '.' + id;
  if (store.get(key, false)) { next(); return; }
  const tuck = createKri({ size: 108 });
  const dialog = h('dialog', { class: 'tuck-guide', 'aria-labelledby': 'guide-title' },
    tuck.el, h('h2', { id: 'guide-title' }, title), h('p', {}, message),
    h('button', { class: 'learn-primary', onclick: finish }, 'Continuar'),
    h('button', { class: 'learn-back', onclick: finish }, 'Pular guia'));
  function cleanup() {
    window.removeEventListener('hashchange', cleanup);
    tuck.destroy();
    dialog.close();
    dialog.remove();
  }
  function finish() {
    cleanup();
    store.set(key, true);
    next();
  }
  dialog.addEventListener('cancel', e => { e.preventDefault(); finish(); });
  window.addEventListener('hashchange', cleanup, { once: true });
  document.body.append(dialog);
  dialog.showModal();
}
