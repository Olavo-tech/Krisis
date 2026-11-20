import { h } from '../core.js';
import { ic } from '../icons.js';
import { logoMark } from '../ui.js';
import { createTuck, TUCK } from '../tuck.js';
import { sfx } from '../sfx.js';

const tile = (tone, pat, i, title, text) => h('div', { class: 'tile pat pat-' + pat + ' ' + tone }, ic(i, 26), h('h3', {}, title), h('p', { style: 'font-weight:700' }, text));
const fl = (cls, i, text) => h('div', { class: 'fl ' + cls }, ic(i, 16), text);

export function renderLanding({ onLogin, onSignup }) {
  const tuck = createTuck({ size: 250 });
  const tuck2 = createTuck({ size: 220 });
  const cta = h('button', { class: 'btn primary big', onclick: onSignup }, 'Começar grátis');
  cta.addEventListener('mouseenter', () => { tuck.setMood('happy', 1100); tuck.quack(); sfx.quack('happy'); });
  const brand = () => h('a', { class: 'brand', href: '#' }, logoMark(36), h('span', { class: 'brand-name' }, 'Eduquack'));

  const desktop = h('div', { class: 'land-d' },
    h('header', { class: 'land-top row', style: 'justify-content:space-between;padding:10px 14px;position:sticky;top:10px;z-index:20' },
      brand(), h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: onLogin }, 'Entrar'), h('button', { class: 'btn sm primary', onclick: onSignup }, 'Criar conta'))),
    h('main', {},
      h('section', { class: 'hero-l' },
        h('div', { class: 'stack', style: 'gap:20px;align-items:flex-start' },
          h('span', { class: 'sticker' }, 'oi, eu sou o ' + TUCK + '!'),
          h('h1', {}, 'Estude para o vestibular ', h('span', { class: 'hl' }, 'sem se perder'), '.'),
          h('p', { class: 'lead', style: 'max-width:50ch;font-weight:700' }, 'Uma trilha de aprendizado que foca no que você mais erra, pastas por assunto e uma IA que cria cartões, resumos, quizzes e guias para você só ler, responder e ouvir.'),
          h('div', { class: 'row' }, cta, h('button', { class: 'btn big', onclick: onLogin }, 'Já tenho conta'))),
        h('div', { class: 'stage' }, tuck.el, fl('a', 'trophy', 'Missão cumprida'), fl('b', 'calendar', 'Inscrição fecha em 12 dias'), fl('c', 'flame', 'Sequência de 7 dias'))),
      h('section', { class: 'land-grid', 'aria-label': 'Recursos' },
        tile('butter', 'dots', 'route', 'Trilha que se adapta', 'Cada lição reforça os conceitos em que você errou, como nos melhores apps de idiomas.'),
        tile('sky', 'stripes', 'folder', 'Pastas por assunto', 'Organize o que quer aprender e veja, em barras de progresso, quanto falta.'),
        tile('lime', 'checks', 'cards', 'Cartões e quizzes automáticos', 'No Plus, o Tuck cria o material. Você não precisa digitar nada.'),
        tile('blush', 'waves', 'timer', 'Foco e constância', 'Pomodoro, missões diárias, sequência e lembretes no celular.')),
      h('section', { class: 'land-how' }, h('h2', {}, 'O Tuck faz de tudo dentro do app'),
        h('div', { class: 'diffs' },
          h('div', { class: 'tile butter pat pat-dots' }, ic('chat', 24), h('h3', {}, 'Conversa com o Tuck'), h('p', { style: 'font-weight:700' }, 'Pergunte, anexe um PDF ou link e ele cria cartões, resumos, quizzes, guias e tarefas com um toque.')),
          h('div', { class: 'tile sky pat pat-stripes' }, ic('link', 24), h('h3', {}, 'Fontes do seu jeito'), h('p', { style: 'font-weight:700' }, 'Junte links, textos e PDFs numa pasta. O Tuck ensina com o seu material.')),
          h('div', { class: 'tile lime pat pat-waves' }, ic('target', 24), h('h3', {}, 'Foco nos seus pontos fracos'), h('p', { style: 'font-weight:700' }, 'Os erros viram cartões e voltam na hora certa. Você sempre sabe o que treinar.')),
          h('div', { class: 'tile blush pat pat-checks' }, ic('lock', 24), h('h3', {}, 'Só estudo, sem distração'), h('p', { style: 'font-weight:700' }, 'O Tuck só conversa sobre estudos. Nada de desviar o foco.')))),
      h('section', { class: 'land-faq' }, h('h2', {}, 'Perguntas frequentes'),
        h('details', {}, h('summary', {}, 'O Eduquack é gratuito?'), h('p', {}, 'Sim. Pastas, trilha manual, tarefas, cartões, páginas, radar de prazos e foco são gratuitos. Tudo que usa IA fica no plano Plus, que será lançado em breve.')),
        h('details', {}, h('summary', {}, 'Funciona como app no celular?'), h('p', {}, 'Sim. Abra pelo navegador, toque para entrar em tela cheia e, se quiser, instale na tela inicial.')),
        h('details', {}, h('summary', {}, 'Quem é o ' + TUCK + '?'), h('p', {}, 'O pato mascote do Eduquack. Ele estuda com você, reage às suas conquistas e dorme quando você está em outras telas. Clique nele para ver o que acontece.')),
        h('details', {}, h('summary', {}, 'Meus dados ficam seguros?'), h('p', {}, 'Cada conta só acessa os próprios dados, e você pode excluir sua conta quando quiser.')))),
    h('footer', { class: 'muted', style: 'margin-top:48px;font-weight:700' }, 'Eduquack · Confira sempre o documento oficial do edital.'));

  const mobile = h('div', { class: 'land-m' },
    h('div', { class: 'wm' }, h('i', { class: 'b1' }), h('i', { class: 'b2' }), h('i', { class: 'b3' }),
      h('div', { class: 'wm-mid' },
        h('div', { style: 'margin-bottom:12px' }, logoMark(46)),
        h('h1', {}, 'Bora estudar sem se perder?'),
        h('p', {}, 'Trilha que foca no que você erra, pastas por assunto e o ' + TUCK + ' estudando com você.'),
        h('div', { class: 'wm-btns' }, h('button', { class: 'btn green', onclick: onSignup }, 'Criar conta'), h('button', { class: 'btn', onclick: onLogin }, 'Já tenho conta'))),
      h('div', { class: 'wm-kri' }, tuck2.el)));

  return h('div', { class: 'landing' }, desktop, mobile);
}
