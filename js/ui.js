import { h, isPlus } from './core.js';

export const BRAND = 'Eduquack';
export const upTag = () => h('span', { class: 'up-tag' }, 'Upgrade');
export const refresh = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

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
