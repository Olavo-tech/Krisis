import { h, icon } from '../core.js';
import { createKri, bindPoke } from '../mascot.js';

const tile = (tone, ic, title, text) => h('div', { class: 'tile ' + tone }, icon(ic, 26), h('h3', { style: 'font-weight:800' }, title), h('p', { style: 'font-weight:500' }, text));
const fl = (cls, ic, text) => h('div', { class: 'fl ' + cls }, icon(ic, 16), text);

export function renderLanding({ onLogin, onSignup }) {
  const kri = createKri({ size: 240 });
  bindPoke(kri);
  const cta = h('button', { class: 'btn primary big', onclick: onSignup }, 'Começar grátis');
  cta.addEventListener('mouseenter', () => kri.setMood('happy', 1100));
  return h('div', { class: 'landing' },
    h('header', { class: 'land-top glass' },
      h('a', { class: 'brand', href: '#' }, h('span', { class: 'brand-mark' }, 'K'), h('span', { class: 'brand-name' }, 'Krisis')),
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: onLogin }, 'Entrar'), h('button', { class: 'btn sm primary', onclick: onSignup }, 'Criar conta'))),
    h('main', {},
      h('section', { class: 'hero-l' },
        h('div', { class: 'stack', style: 'gap:20px;align-items:flex-start' },
          h('h1', {}, 'Estude para o vestibular sem sair do Krisis.'),
          h('p', { class: 'lead', style: 'max-width:50ch' }, 'Entenda o edital, acompanhe os prazos, monte seu plano, anote, revise com cartões e mantenha o foco. O Kri estuda com você.'),
          h('div', { class: 'row' }, cta, h('button', { class: 'btn big', onclick: onLogin }, 'Já tenho conta'))),
        h('div', { class: 'stage' }, kri.el, fl('a', 'trophy', 'Missão cumprida +30 XP'), fl('b', 'calendar', 'Inscrição fecha em 12 dias'), fl('c', 'flame', 'Sequência de 7 dias'))),
      h('section', { class: 'land-grid', 'aria-label': 'Recursos' },
        tile('lime', 'scan', 'Leia editais em segundos', 'Cole o link, o texto ou o PDF e receba datas, vagas, requisitos e pontos de atenção.'),
        tile('mint', 'book', 'Páginas como no Notion', 'Planos de estudo, resumos e cadernos de erros com blocos, listas e tarefas.'),
        tile('butter', 'cards', 'Cartões de revisão', 'Revise no momento certo com repetição espaçada e fixe o que cai na prova.'),
        tile('blush', 'timer', 'Foco e constância', 'Pomodoro, missões diárias e sequência para transformar estudo em hábito.')),
      h('section', { class: 'land-how' }, h('h2', {}, 'O que só o Krisis tem'),
        h('div', { class: 'diffs' },
          h('div', { class: 'tile' }, icon('calendar', 24), h('h3', {}, 'Radar de prazos'), h('p', {}, 'O Krisis lê as datas dos editais que você salva, conta os dias e cria a tarefa com um toque.')),
          h('div', { class: 'tile' }, icon('command', 24), h('h3', {}, 'Barra de comando'), h('p', {}, 'Cole um edital, escreva "tarefa: revisar química amanhã" ou busque em tudo. Atalho: Ctrl+K.')),
          h('div', { class: 'tile' }, icon('cards', 24), h('h3', {}, 'Anotação que vira cartão'), h('p', {}, 'Qualquer bloco das suas páginas vira um cartão de revisão em dois cliques.')),
          h('div', { class: 'tile' }, icon('trophy', 24), h('h3', {}, 'Missões e sequência'), h('p', {}, 'Metas pequenas por dia, XP, níveis e o Kri comemorando cada conquista.')))),
      h('section', { class: 'land-how' }, h('h2', {}, 'Como funciona'),
        h('ol', { class: 'steps' },
          h('li', {}, 'Crie sua conta e envie o edital do vestibular que você quer.'),
          h('li', {}, 'Salve o edital: os prazos entram no radar e viram tarefas.'),
          h('li', {}, 'Organize páginas, revise cartões e use o foco todos os dias.'))),
      h('section', { class: 'land-faq' }, h('h2', {}, 'Perguntas frequentes'),
        h('details', {}, h('summary', {}, 'O Krisis é gratuito?'), h('p', {}, 'Sim. Leitura de editais, radar de prazos, páginas, tarefas, cartões e foco são gratuitos. Recursos extras de IA ficam no plano Plus, que será lançado em breve.')),
        h('details', {}, h('summary', {}, 'Quais editais posso analisar?'), h('p', {}, 'Vestibulares, Enem, concursos públicos e processos seletivos. Você envia o PDF, o link oficial ou cola o texto.')),
        h('details', {}, h('summary', {}, 'Quem é o Kri?'), h('p', {}, 'O mascote do Krisis. Ele acompanha seus estudos, comemora suas conquistas e dá dicas. Você pode arrastá-lo pela tela e fazer cócegas.')),
        h('details', {}, h('summary', {}, 'Meus dados ficam seguros?'), h('p', {}, 'Cada conta só acessa os próprios dados, e você pode excluir sua conta quando quiser.')))),
    h('footer', { class: 'muted', style: 'margin-top:48px;font-weight:600' }, 'Krisis · Confira sempre o documento oficial do edital.'));
}
