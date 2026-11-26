import { h, icon } from '../core.js';
import { ic } from '../icons.js';
import { createKri, bindPoke, MASCOT } from '../mascot.js';
import { sfx } from '../sfx.js';

const tile = (tone, pat, i, title, text) => h('div', { class: 'tile pat pat-' + pat + ' ' + tone }, ic(i, 26), h('h3', { style: 'font-weight:800' }, title), h('p', { style: 'font-weight:500' }, text));
const fl = (cls, i, text) => h('div', { class: 'fl ' + cls }, ic(i, 16), text);

export function renderLanding({ onLogin, onSignup }) {
  const kri = createKri({ size: 250 });
  bindPoke(kri);
  const kri2 = createKri({ size: 220 });
  bindPoke(kri2);
  const cta = h('button', { class: 'btn primary big', onclick: onSignup }, 'Começar grátis');
  cta.addEventListener('mouseenter', () => { kri.setMood('happy', 1100); sfx.chirp('happy'); });

  const desktop = h('div', { class: 'land-d' },
    h('header', { class: 'land-top row', style: 'justify-content:space-between;padding:10px 14px;position:sticky;top:10px;z-index:20' },
      h('a', { class: 'brand', href: '#' }, h('span', { class: 'brand-mark' }, 'E'), h('span', { class: 'brand-name' }, 'Eduquack')),
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: onLogin }, 'Entrar'), h('button', { class: 'btn sm primary', onclick: onSignup }, 'Criar conta'))),
    h('main', {},
      h('section', { class: 'hero-l' },
        h('div', { class: 'stack', style: 'gap:20px;align-items:flex-start' },
          h('span', { class: 'sticker' }, 'oi, eu sou o ' + MASCOT + '!'),
          h('h1', {}, 'Estude para o vestibular ', h('span', { class: 'hl' }, 'sem sair'), ' do Eduquack.'),
          h('p', { class: 'lead', style: 'max-width:50ch' }, 'Jogue qualquer material e a IA organiza páginas, cartões e tarefas. Acompanhe prazos, revise e mantenha o foco com o ' + MASCOT + ' ao seu lado.'),
          h('div', { class: 'row' }, cta, h('button', { class: 'btn big', onclick: onLogin }, 'Já tenho conta'))),
        h('div', { class: 'stage' }, kri.el, fl('a', 'trophy', 'Missão cumprida +30 XP'), fl('b', 'calendar', 'Inscrição fecha em 12 dias'), fl('c', 'flame', 'Sequência de 7 dias'))),
      h('section', { class: 'land-grid', 'aria-label': 'Recursos' },
        tile('lime', 'dots', 'scan', 'Leia editais em segundos', 'Cole o link, o texto ou o PDF e receba datas, vagas, requisitos e pontos de atenção.'),
        tile('sky', 'stripes', 'book', 'Páginas como no Notion', 'Planos de estudo, resumos e cadernos de erros com blocos, listas e tarefas.'),
        tile('butter', 'checks', 'cards', 'Cartões de revisão', 'Revise no momento certo com repetição espaçada e fixe o que cai na prova.'),
        tile('blush', 'waves', 'timer', 'Foco e constância', 'Pomodoro, missões diárias e sequência para transformar estudo em hábito.')),
      h('section', { class: 'land-how' }, h('h2', {}, 'O que só o Eduquack tem'),
        h('div', { class: 'diffs' },
          h('div', { class: 'tile orange pat pat-dots' }, ic('wand', 24), h('h3', {}, 'Captura mágica'), h('p', {}, 'Cole, envie um PDF, dite por voz ou compartilhe de outro app. A IA cria página, cartões e tarefas sozinha.')),
          h('div', { class: 'tile pat pat-stripes' }, ic('calendar', 24), h('h3', {}, 'Radar de prazos'), h('p', {}, 'Lê as datas dos editais que você salva, conta os dias e cria a tarefa com um toque.')),
          h('div', { class: 'tile pat pat-waves' }, ic('chat', 24), h('h3', {}, 'Tutor ' + MASCOT), h('p', {}, 'Pergunte qualquer dúvida e receba resposta com base nas suas próprias páginas.')),
          h('div', { class: 'tile pat pat-checks' }, ic('command', 24), h('h3', {}, 'Barra de comando'), h('p', {}, 'Escreva "tarefa: revisar química amanhã" ou busque em tudo. Atalho: Ctrl+K.')),
          h('div', { class: 'tile pat pat-dots' }, ic('cards', 24), h('h3', {}, 'Anotação que vira cartão'), h('p', {}, 'Qualquer bloco das suas páginas vira um cartão de revisão em dois toques.')),
          h('div', { class: 'tile pat pat-stripes' }, ic('trophy', 24), h('h3', {}, 'Missões e sequência'), h('p', {}, 'Metas pequenas por dia, XP, níveis e o ' + MASCOT + ' comemorando cada conquista.')))),
      h('section', { class: 'land-faq' }, h('h2', {}, 'Perguntas frequentes'),
        h('details', {}, h('summary', {}, 'O Eduquack é gratuito?'), h('p', {}, 'Sim. Leitura de editais, radar de prazos, páginas, tarefas, cartões e foco são gratuitos. Os recursos de IA (captura mágica, plano de estudos, cartões por IA e tutor) ficam no plano Plus, que será lançado em breve.')),
        h('details', {}, h('summary', {}, 'Funciona como app no celular?'), h('p', {}, 'Sim. Abra pelo navegador, toque para entrar em tela cheia e, se quiser, instale na tela inicial.')),
        h('details', {}, h('summary', {}, 'Quem é o ' + MASCOT + '?'), h('p', {}, 'O mascote do Eduquack. Ele acompanha seus estudos, comemora suas conquistas e dá dicas. Você pode arrastá-lo pela tela e fazer cócegas.')),
        h('details', {}, h('summary', {}, 'Meus dados ficam seguros?'), h('p', {}, 'Cada conta só acessa os próprios dados, e você pode excluir sua conta quando quiser.')))),
    h('footer', { class: 'muted', style: 'margin-top:48px;font-weight:600' }, 'Eduquack · Confira sempre o documento oficial do edital.'));

  const mobile = h('div', { class: 'land-m' },
    h('div', { class: 'wm' }, h('i', { class: 'b1' }), h('i', { class: 'b2' }), h('i', { class: 'b3' }),
      h('div', { class: 'wm-mid' },
        h('h1', {}, 'Bora estudar sem sair do app?'),
        h('p', {}, 'Edital, prazos, cartões e foco num lugar só. O ' + MASCOT + ' estuda com você.'),
        h('div', { class: 'wm-btns' }, h('button', { class: 'btn green', onclick: onSignup }, 'Criar conta'), h('button', { class: 'btn', onclick: onLogin }, 'Já tenho conta'))),
      h('div', { class: 'wm-kri' }, kri2.el)));

  return h('div', { class: 'landing' }, desktop, mobile);
}
