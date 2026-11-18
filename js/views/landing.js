import { h, icon } from '../core.js';

const tile = (tone, ic, title, text) => h('div', { class: 'tile ' + tone }, icon(ic, 26), h('h3', {}, title), h('p', {}, text));

export function renderLanding({ onLogin, onSignup }) {
  return h('div', { class: 'landing' },
    h('header', { class: 'land-top glass' },
      h('a', { class: 'brand', href: '#' }, h('span', { class: 'brand-mark' }, 'K'), h('span', { class: 'brand-name' }, 'Krisis')),
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: onLogin }, 'Entrar'), h('button', { class: 'btn sm primary', onclick: onSignup }, 'Criar conta'))),
    h('main', {},
      h('section', { class: 'hero' },
        h('h1', {}, 'Estude para o vestibular sem sair do Krisis.'),
        h('p', { class: 'lead' }, 'Entenda o edital, monte seu plano, faça suas anotações, revise com cartões e mantenha o foco. Tudo no mesmo lugar, de graça para começar.'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary big', onclick: onSignup }, 'Começar grátis'), h('button', { class: 'btn big', onclick: onLogin }, 'Já tenho conta'))),
      h('section', { class: 'land-grid', 'aria-label': 'Recursos' },
        tile('lime', 'scan', 'Leia editais em segundos', 'Cole o link, o texto ou o PDF e receba datas, vagas, requisitos e pontos de atenção.'),
        tile('mint', 'book', 'Páginas como no Notion', 'Planos de estudo, resumos e cadernos de erros com blocos, listas e tarefas.'),
        tile('butter', 'cards', 'Cartões de revisão', 'Revise no momento certo com repetição espaçada e fixe o que cai na prova.'),
        tile('blush', 'timer', 'Foco e constância', 'Pomodoro, tarefas e sequência diária para transformar estudo em hábito.')),
      h('section', { class: 'land-how' }, h('h2', {}, 'Como funciona'),
        h('ol', { class: 'steps' },
          h('li', {}, 'Crie sua conta e envie o edital do vestibular que você quer.'),
          h('li', {}, 'Transforme o resultado em uma página de estudo com checklist.'),
          h('li', {}, 'Organize tarefas, revise cartões e use o timer de foco todos os dias.'))),
      h('section', { class: 'land-faq' }, h('h2', {}, 'Perguntas frequentes'),
        h('details', {}, h('summary', {}, 'O Krisis é gratuito?'), h('p', {}, 'Sim. A leitura de editais, as páginas, as tarefas, os cartões e o timer de foco são gratuitos. Recursos extras de IA ficam no plano Plus, que será lançado em breve.')),
        h('details', {}, h('summary', {}, 'Quais editais posso analisar?'), h('p', {}, 'Vestibulares, Enem, concursos públicos e processos seletivos. Você envia o PDF, o link oficial ou cola o texto.')),
        h('details', {}, h('summary', {}, 'Meus dados ficam seguros?'), h('p', {}, 'Cada conta só acessa os próprios dados, e você pode excluir sua conta quando quiser.')))),
    h('footer', { class: 'muted', style: 'margin-top:48px;font-weight:700' }, 'Krisis · Confira sempre o documento oficial do edital.'));
}
