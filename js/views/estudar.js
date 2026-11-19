import { h, state } from '../core.js';
import { ic } from '../icons.js';
import { pageIcon } from '../core.js';
import { loadPages, newPageModal } from './pages.js';
import { openTutor } from './tutor.js';
import { MASCOT } from '../mascot.js';

const T = [
  ['orange', 'stripes', 'scan', 'Analisar edital', 'Datas, vagas e requisitos', '#/analisar'],
  ['sky', 'dots', 'folder', 'Meus editais', 'Sua biblioteca', '#/editais'],
  ['butter', 'checks', 'calendar', 'Radar de prazos', 'O que vence primeiro', '#/prazos'],
  ['blush', 'waves', 'check', 'Tarefas', 'Pequenos passos', '#/tarefas'],
  ['lime', 'stripes', 'cards', 'Cartões', 'Revisão inteligente', '#/cartoes'],
  ['mint', 'dots', 'timer', 'Foco', 'Pomodoro com o ' + MASCOT, '#/foco']
];

export async function renderEstudar(box) {
  const tile = ([tone, pat, i, title, desc, href]) => h('a', { class: 'pl pat pat-' + pat + ' ' + tone, href }, h('div', { class: 'pl-top' }, ic(i, 26), h('span', { class: 'pl-go' }, ic('arrow', 16))), h('div', {}, h('b', {}, title), h('small', {}, desc)));
  const act = (tone, pat, i, title, desc, fn) => { const b = h('button', { class: 'pl pat pat-' + pat + ' ' + tone, style: 'text-align:left;width:100%', onclick: fn }, h('div', { class: 'pl-top' }, ic(i, 26), h('span', { class: 'pl-go' }, ic('arrow', 16))), h('div', {}, h('b', {}, title), h('small', {}, desc))); return b; };
  box.append(h('div', { class: 'hub' }, T.map(tile),
    act('sky', 'waves', 'file', 'Nova página', 'Modelos prontos', () => newPageModal(null)),
    act('ink', 'dots', 'chat', 'Pergunte ao ' + MASCOT, 'Tutor com IA', () => openTutor())));
  const list = h('div', { class: 'list' });
  box.append(h('section', { style: 'margin-top:18px' }, h('h3', { class: 'panel-title' }, 'Suas páginas'), list));
  await loadPages();
  if (!state.pages.length) list.append(h('p', { class: 'muted' }, 'Você ainda não tem páginas. Crie uma com um modelo ou use a Captura mágica.'));
  state.pages.forEach((p) => list.append(h('a', { class: 'item', href: '#/pagina/' + p.id }, pageIcon(p.icon, 18), h('span', { class: 'item-t' }, p.title || 'Sem título'))));
}
