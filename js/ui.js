import { h, isPlus } from './core.js';

export const BRAND = 'Eduquack';
export const upTag = () => h('span', { class: 'up-tag' }, 'Upgrade');
export const refresh = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

// Logo do Eduquack: o rosto do pato (olhos em pílula e bico laranja).
export function logoMark(size = 34) {
  const s = document.createElement('span');
  s.className = 'logo-mark';
  s.style.cssText = 'display:inline-block;width:' + size + 'px;height:' + size + 'px;border-radius:24%;overflow:hidden;flex-shrink:0;border:2px solid #1b1740';
  s.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" style="width:100%;height:100%;display:block"><rect width="100" height="100" fill="#FDD41E"/><rect x="26" y="22" width="9" height="19" rx="4.5" fill="#111"/><rect x="65" y="22" width="9" height="19" rx="4.5" fill="#111"/><ellipse cx="50" cy="60" rx="22" ry="9.600" fill="#c55a15"/><ellipse cx="50" cy="56.500" rx="23" ry="9" fill="#f47b20"/></svg>';
  return s;
}

// Recurso de IA: no plano grátis fica visível, com selo "Upgrade" e sem clique.
export function gate(el) {
  if (isPlus()) return el;
  el.classList.add('locked');
  el.setAttribute('aria-disabled', 'true');
  el.setAttribute('title', 'Disponível no plano Plus');
  if (el.tagName === 'BUTTON') el.setAttribute('disabled', '');
  if (el.tagName === 'A') el.removeAttribute('href');
  el.append(upTag());
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
  return el;
}
