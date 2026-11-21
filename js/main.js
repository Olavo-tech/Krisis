import { sb, state, h, icon, store, getStats, isPlus } from './core.js';
import { ic } from './icons.js';
import { gate, logoMark } from './ui.js';
import { loadProfile, displayName, openAccount } from './auth.js';
import { openAuthScreen } from './views/login.js';
import { renderLanding } from './views/landing.js';
import { renderHome } from './views/home.js';
import { renderTrilha } from './views/trilha.js';
import { renderPastas, renderPasta } from './views/pastas.js';
import { renderTuck } from './views/chat.js';
import { renderAnalyzer } from './views/analyzer.js';
import { renderSaved } from './views/editais.js';
import { renderPage, flushPage } from './views/pages.js';
import { renderTasks } from './views/tasks.js';
import { renderCards } from './views/cards.js';
import { renderFocus } from './views/focus.js';
import { renderPlus } from './views/plus.js';
import { renderPrazos } from './views/prazos.js';
import { renderPraticar } from './views/praticar.js';
import { renderMagico } from './views/magico.js';
import { renderEu } from './views/eu.js';
import { openPalette } from './views/command.js';
import { initSfx } from './sfx.js';
import { tapToStart } from './native.js';
import { createTuck } from './tuck.js';

const root = document.getElementById('app');
let theme = store.get('krisis.theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
let lastUserId = null;

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', theme === 'dark' ? '#100e2b' : '#f7f5ff');
}
applyTheme();

const ROUTES = {
  hoje: ['Início', renderHome], trilha: ['Trilha', renderTrilha], pastas: ['Pastas', renderPastas], pasta: ['Pasta', renderPasta], tuck: ['Tuck', renderTuck],
  analisar: ['Analisar edital', renderAnalyzer], magico: ['Captura mágica', renderMagico], praticar: ['Ferramentas', renderPraticar],
  editais: ['Meus editais', renderSaved], prazos: ['Radar de prazos', renderPrazos], tarefas: ['Tarefas', renderTasks], cartoes: ['Cartões', renderCards],
  foco: ['Foco', renderFocus], plus: ['Eduquack Plus', renderPlus], eu: ['Eu', renderEu], pagina: ['Página', renderPage], estudar: ['Ferramentas', renderPraticar]
};
const NAV_OF = { pasta: 'pastas', pagina: 'pastas', analisar: 'editais', magico: 'praticar', estudar: 'praticar' };
const TABS = [
  ['#/hoje', 'home', 'Início', ['hoje']],
  ['#/trilha', 'route', 'Trilha', ['trilha']],
  ['#/tuck', 'duck', 'Conversar com o Tuck', ['tuck']],
  ['#/pastas', 'folder', 'Pastas', ['pastas', 'pasta', 'pagina']],
  ['#/eu', 'user', 'Eu', ['eu', 'praticar', 'estudar', 'tarefas', 'cartoes', 'foco', 'prazos', 'editais', 'analisar', 'magico', 'plus']]
];
const LOCKED = {
  analisar: ['Analisar edital com IA', 'O Tuck lê o edital e entrega datas, vagas, requisitos e pontos de atenção.', ['Cole o link, o texto ou o PDF', 'Os prazos entram sozinhos no radar', 'Transforme o resultado em página e tarefas']],
  magico: ['Captura mágica', 'Jogue qualquer material e a IA cria página, cartões e tarefas.', ['Cole, dite por voz ou envie um PDF', 'Você só confere e toca em Criar tudo']],
  tuck: ['Conversa com o Tuck', 'Pergunte, anexe materiais e peça cartões, quizzes, resumos e guias.', ['Ele só conversa sobre estudos', 'Propõe ações de um toque', 'Usa suas pastas, fontes e pontos fracos']]
};

function navLink(href, i, label, ai) {
  const a = h('a', { href, 'data-r': href.split('/')[1] }, ic(i), label);
  return ai ? gate(a) : a;
}

function statChips() {
  const s = getStats();
  const box = document.getElementById('topStats');
  if (box) {
    const f = icon('flame', 16);
    f.classList.add('flame');
    box.replaceChildren(h('span', { class: 'chip', title: 'Dias seguidos estudando' }, f, String(s.streak)), h('span', { class: 'chip blue', title: 'Pontos de experiência' }, icon('bolt', 16), s.xp + ' XP'));
  }
  const l = document.getElementById('lvlBox');
  if (l) l.replaceChildren(h('span', {}, 'Nív. ' + s.level), h('div', { class: 'bar' }, h('i', { style: 'width:' + s.levelXp + '%' })));
}

function buildShell() {
  const name = displayName();
  const plan = isPlus()
    ? h('div', { class: 'plus-card' }, h('span', {}, 'Plano Plus ativo'))
    : h('div', { class: 'plus-card' }, h('span', {}, 'Eduquack Plus'), h('a', { class: 'btn sm green', href: '#/plus' }, 'Conhecer'));
  const tuckLink = gate(h('a', { class: 'nav-b tuck-b', href: '#/tuck', 'data-r': 'tuck' }, ic('duck'), 'Conversar com o Tuck'));
  const dockTuck = createTuck({ size: 78, standby: true });
  const side = h('aside', { class: 'side', id: 'side' },
    h('a', { class: 'brand', href: '#/hoje' }, logoMark(34), h('span', { class: 'brand-name' }, 'Eduquack')),
    h('div', { class: 'greet' }, h('span', { class: 'greet-s' }, 'Olá,'), h('b', { class: 'greet-n' }, name), h('div', { class: 'lvl', id: 'lvlBox' })),
    h('nav', { class: 'nav', id: 'nav', 'aria-label': 'Principal' },
      navLink('#/hoje', 'home', 'Início'), navLink('#/trilha', 'route', 'Trilha'), navLink('#/pastas', 'folder', 'Pastas'),
      h('div', { class: 'side-label' }, 'Com IA'), tuckLink, navLink('#/praticar', 'target', 'Praticar'),
      h('div', { class: 'side-label' }, 'Estudo'),
      navLink('#/editais', 'scan', 'Editais'), navLink('#/prazos', 'calendar', 'Prazos'), navLink('#/tarefas', 'check', 'Tarefas'), navLink('#/cartoes', 'cards', 'Cartões'), navLink('#/foco', 'timer', 'Foco')),
    h('div', { class: 'side-foot' }, h('div', { class: 'dock' }, dockTuck.el), plan,
      h('button', { class: 'acct', onclick: () => openAccount(() => render()) },
        h('span', { class: 'avatar' }, (name[0] || 'E').toUpperCase()),
        h('span', {}, h('div', { class: 'acct-name' }, name), h('div', { class: 'acct-sub' }, isPlus() ? 'Plus' : 'Plano grátis')))));
  const top = h('header', { class: 'top' },
    h('button', { class: 'm-avatar', 'aria-label': 'Meu perfil', onclick: () => { location.hash = '#/eu'; } }, (name[0] || 'E').toUpperCase()),
    h('div', { class: 'crumb' }, h('b', { id: 'topTitle' })),
    h('button', { class: 'search-pill', onclick: openPalette, 'aria-label': 'Buscar ou criar' }, icon('search', 16), h('span', { class: 't' }, 'Buscar ou criar…'), h('kbd', {}, 'Ctrl K')),
    h('div', { class: 'top-stats', id: 'topStats' }),
    h('button', { class: 'icon-btn', id: 'themeBtn', 'aria-label': 'Alternar tema', onclick: toggleTheme }, icon(theme === 'dark' ? 'sun' : 'moon')));
  const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Navegação' }, TABS.map(([href, i, label, grp]) => {
    const a = h('a', { class: 'tab' + (i === 'duck' ? ' chatb' : ''), href, 'data-g': grp.join(','), 'aria-label': label }, ic(i, i === 'duck' ? 30 : 24));
    if (i === 'duck' && !isPlus()) { gate(a); const t = a.querySelector('.up-tag'); if (t) t.style.cssText = 'position:absolute;top:-16px;left:50%;transform:translateX(-50%);margin:0'; a.style.position = 'relative'; }
    return a;
  }));
  return h('div', { class: 'shell' }, side, h('main', { class: 'main' }, top, h('div', { id: 'view', class: 'view' })), tabbar);
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  store.set('krisis.theme', theme);
  applyTheme();
  const b = document.getElementById('themeBtn');
  if (b) b.replaceChildren(icon(theme === 'dark' ? 'sun' : 'moon'));
}

function lockedScreen(box, [title, desc, bullets]) {
  box.append(h('section', { class: 'tile butter pat pat-dots', style: 'display:flex;flex-direction:column;gap:10px' },
    h('div', { class: 'row' }, ic('lock', 24), h('h2', { style: 'font-size:1.5rem' }, title), h('span', { class: 'up-tag' }, 'Upgrade')),
    h('p', { style: 'font-weight:700' }, desc), h('ul', { class: 'alist' }, bullets.map((b) => h('li', {}, b))),
    h('div', { class: 'row' }, h('a', { class: 'btn green', href: '#/plus' }, 'Ver o plano Plus'), h('a', { class: 'btn', href: '#/hoje' }, 'Voltar'))));
}

let routeSeq = 0;
async function route() {
  if (!state.user) return;
  flushPage();
  const parts = (location.hash || '#/hoje').split('/');
  const seg = ROUTES[parts[1]] ? parts[1] : 'hoje';
  const arg = parts[2] || null;
  const [title, fn] = ROUTES[seg];
  const my = ++routeSeq;
  document.body.dataset.route = seg;
  document.getElementById('topTitle').textContent = seg === 'hoje' ? 'Olá, ' + displayName().split(' ')[0] + '!' : title;
  const navKey = NAV_OF[seg] || seg;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === navKey));
  document.querySelectorAll('.tab').forEach((a) => a.classList.toggle('active', a.dataset.g.split(',').includes(seg)));
  const box = h('div', { class: 'view-inner' });
  document.getElementById('view').replaceChildren(box);
  window.scrollTo(0, 0);
  statChips();
  try {
    if (LOCKED[seg] && !isPlus()) lockedScreen(box, LOCKED[seg]);
    else await fn(box, arg);
  } catch (err) {
    if (my === routeSeq) box.replaceChildren(h('div', { class: 'tile' }, h('h3', {}, 'Algo deu errado'), h('p', { class: 'muted' }, 'Recarregue a página e tente de novo.')));
    console.error('[eduquack] rota', seg, err);
  }
}

function render() {
  root.replaceChildren();
  if (!state.user) {
    delete document.body.dataset.route;
    root.append(renderLanding({ onLogin: () => openAuthScreen('login'), onSignup: () => openAuthScreen('signup') }));
    return;
  }
  const first = displayName().split(' ')[0];
  root.append(buildShell());
  route();
  if (!store.get('eduquack.onb.' + state.user.id, false) && !store.get('krisis.onb.' + state.user.id, false)) setTimeout(() => import('./views/onboarding.js').then((m) => m.startOnboarding(first)), 1400);
}

function handleShare() {
  try {
    const p = new URLSearchParams(location.search);
    const text = p.get('text') || '', url = p.get('url') || '', title = p.get('title') || '';
    if (text || url || title) {
      sessionStorage.setItem('krisis.share', JSON.stringify({ title, text, url }));
      history.replaceState({}, '', location.pathname + '#/magico');
    }
  } catch (_) { /* sem compartilhamento */ }
}

async function boot() {
  initSfx();
  handleShare();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  if (!sb) {
    root.replaceChildren(h('main', { class: 'boot' }, h('h1', {}, 'Eduquack'), h('p', {}, 'Não foi possível carregar um recurso necessário. Verifique sua conexão e recarregue a página.')));
    return;
  }
  const [{ data }] = await Promise.all([sb.auth.getSession(), tapToStart()]);
  state.session = data.session;
  state.user = data.session ? data.session.user : null;
  lastUserId = state.user ? state.user.id : null;
  await loadProfile();
  render();
  sb.auth.onAuthStateChange((event, session) => {
    state.session = session;
    state.user = session ? session.user : null;
    const id = state.user ? state.user.id : null;
    if (id === lastUserId) return;
    lastUserId = id;
    setTimeout(async () => { await loadProfile(); render(); }, 0);
  });
}

window.addEventListener('hashchange', route);
document.addEventListener('krisis:stats', statChips);
document.addEventListener('krisis:theme-toggle', toggleTheme);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && state.user) { e.preventDefault(); openPalette(); }
});
boot();
