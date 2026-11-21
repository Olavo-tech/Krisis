import { h, icon, openModal, isPlus } from '../core.js';
import { TUCK } from '../tuck.js';

const FREE = ['Pastas por assunto e trilha manual', 'Tarefas, missões e sequência diária', 'Cartões com repetição espaçada', 'Páginas com blocos e modelos', 'Radar de prazos e foco', 'Lembretes no celular'];
const PLUS = ['Tudo do plano grátis', 'Conversa com o ' + TUCK + ': ele cria cartões, quizzes, resumos, guias e tarefas', 'Trilha montada por IA, com lições que reforçam o que você erra', 'Fontes: links, textos e PDFs para ele ensinar com o seu material', 'Simulados e correção de redação ENEM', 'Análise de edital e captura mágica'];

// Plus: executa o recurso de IA. Grátis: mostra o aviso do Plus.
export function openPlus(feature) {
  if (isPlus()) {
    import('./ai.js').then((m) => m.runAi(feature || ''));
    return;
  }
  let close = () => {};
  close = openModal(h('div', { class: 'stack' },
    h('div', { class: 'row' }, icon('lock', 24), h('h2', { class: 'modal-title' }, 'Recurso do Eduquack Plus')),
    h('p', { class: 'lead' }, (feature || 'Este recurso') + ' faz parte do Eduquack Plus. O lançamento está chegando.'),
    h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Agora não'),
      h('a', { class: 'btn primary', href: '#/plus', onclick: () => close() }, 'Ver o que inclui'))));
}

export function renderPlus(box) {
  box.append(h('p', { class: 'lead', style: 'margin-bottom:14px;font-weight:700' }, 'O plano grátis organiza seus estudos. O Plus coloca a IA para fazer o trabalho pesado: você só lê, responde, ouve e clica.'),
    h('div', { class: 'grid2' },
      h('div', { class: 'tile pat pat-dots' }, h('h3', { style: 'font-weight:600;font-size:1.3rem' }, 'Grátis'), h('ul', { class: 'alist', style: 'margin-top:8px' }, FREE.map((x) => h('li', {}, x)))),
      h('div', { class: 'tile butter pat pat-stripes' }, h('div', { class: 'row' }, h('h3', { style: 'font-weight:600;font-size:1.3rem' }, 'Eduquack Plus'), h('span', { class: 'chip plus' }, isPlus() ? 'Ativo' : 'Em breve')),
        h('ul', { class: 'alist', style: 'margin-top:8px' }, PLUS.map((x) => h('li', {}, x))),
        h('button', { class: 'btn green block', style: 'margin-top:14px', disabled: true }, isPlus() ? 'Você já é Plus' : 'Disponível em breve'))));
}
