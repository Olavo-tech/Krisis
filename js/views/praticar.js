import { h, isPlus } from '../core.js';
import { ic } from '../icons.js';
import { gate } from '../ui.js';
import { openQuizSetup, openEssay } from './quiz.js';
import { TUCK } from '../tuck.js';

const T = [
  { tone: 'ink', pat: 'dots', i: 'chat', t: 'Conversar com o ' + TUCK, d: 'Tire dúvidas e peça materiais', href: '#/tuck', ai: true },
  { tone: 'mustard', pat: 'stripes', i: 'scan', t: 'Analisar edital', d: 'Datas, vagas e requisitos', href: '#/analisar', ai: true },
  { tone: 'lilac', pat: 'waves', i: 'wand', t: 'Captura mágica', d: 'Cole e eu organizo tudo', href: '#/magico', ai: true },
  { tone: 'butter', pat: 'checks', i: 'target', t: 'Simulado com IA', d: 'Erros viram cartões', fn: () => openQuizSetup(), ai: true },
  { tone: 'blush', pat: 'dots', i: 'pencil', t: 'Corrigir redação', d: 'Nota por competência do ENEM', fn: () => openEssay(), ai: true },
  { tone: 'sky', pat: 'stripes', i: 'folder', t: 'Meus editais', d: 'Sua biblioteca', href: '#/editais' },
  { tone: 'butter', pat: 'waves', i: 'calendar', t: 'Radar de prazos', d: 'O que vence primeiro', href: '#/prazos' },
  { tone: 'blush', pat: 'checks', i: 'check', t: 'Tarefas', d: 'Pequenos passos', href: '#/tarefas' },
  { tone: 'lime', pat: 'stripes', i: 'cards', t: 'Cartões', d: 'Revisão espaçada', href: '#/cartoes' },
  { tone: 'mint', pat: 'dots', i: 'timer', t: 'Foco', d: 'Pomodoro com o ' + TUCK, href: '#/foco' }
];

export function toolGrid() {
  return h('div', { class: 'grid3' }, T.map((x) => {
    const kids = [h('div', { class: 'pl-top' }, ic(x.i, 26), h('span', { class: 'pl-go' }, ic('arrow', 16))), h('div', {}, h('b', {}, x.t), h('small', {}, x.d))];
    const cls = 'pl pat pat-' + x.pat + ' ' + x.tone;
    const el = x.href ? h('a', { class: cls, href: x.href }, ...kids) : h('button', { class: cls, type: 'button', onclick: x.fn }, ...kids);
    return x.ai ? gate(el) : el;
  }));
}

export function renderPraticar(box) {
  box.append(h('p', { class: 'lead', style: 'margin-bottom:12px;font-weight:700' }, isPlus() ? 'Tudo que a IA faz por você, e as ferramentas do dia a dia.' : 'O que a IA faria por você no plano Plus fica marcado com Upgrade. As ferramentas sem selo já são suas.'), toolGrid());
}
