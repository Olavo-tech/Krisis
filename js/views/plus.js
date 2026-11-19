import { h, icon, openModal, isPlus } from '../core.js';
import { MASCOT } from '../mascot.js';

const FREE = ['Leitura de editais (25 por dia)', 'Radar de prazos com contagem regressiva', 'Páginas com blocos e modelos', 'Tarefas, missões e sequência diária', 'Cartões com repetição espaçada', 'Foco, lembretes e o ' + MASCOT];
const PLUS = ['Tudo do plano grátis', 'Captura mágica: página, cartões e tarefas sozinhos', 'Tutor ' + MASCOT + ' que lê a sua tela', 'Simulados com IA (erros viram cartões)', 'Correção de redação ENEM por competência', 'Plano de estudos e cartões por IA'];

// Plus: executa o recurso de IA. Grátis: mostra o aviso do Plus.
export function openPlus(feature) {
  if (isPlus()) {
    import('./ai.js').then((m) => m.runAi(feature || ''));
    return;
  }
  let close = () => {};
  close = openModal(h('div', { class: 'stack' },
    h('div', { class: 'row' }, icon('lock', 24), h('h2', { class: 'modal-title' }, 'Recurso do Krisis Plus')),
    h('p', { class: 'lead' }, (feature || 'Este recurso') + ' faz parte do Krisis Plus. O lançamento está chegando.'),
    h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Agora não'),
      h('a', { class: 'btn primary', href: '#/plus', onclick: () => close() }, 'Ver o que inclui'))));
}

export function renderPlus(box) {
  box.append(h('p', { class: 'lead', style: 'margin-bottom:14px' }, 'O plano grátis já cobre o essencial. O Plus coloca a IA para trabalhar nos seus estudos.'),
    h('div', { class: 'plans' },
      h('div', { class: 'tile pat pat-dots' }, h('h3', { style: 'font-weight:900' }, 'Grátis'), h('ul', {}, FREE.map((x) => h('li', {}, x)))),
      h('div', { class: 'tile orange pat pat-stripes' }, h('div', { class: 'row' }, h('h3', { style: 'font-weight:900' }, 'Krisis Plus'), h('span', { class: 'chip plus' }, isPlus() ? 'Ativo' : 'Em breve')),
        h('ul', {}, PLUS.map((x) => h('li', {}, x))),
        h('button', { class: 'btn green block', style: 'margin-top:14px', disabled: true }, isPlus() ? 'Você já é Plus' : 'Disponível em breve'))));
}
