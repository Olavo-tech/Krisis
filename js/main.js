import { sb, state, h, icon, store, getStats, isPlus } from './core.js';
import { loadProfile, displayName, openAuth, openAccount } from './auth.js';
import { renderLanding } from './views/landing.js';
import { renderHome } from './views/home.js';
import { renderAnalyzer } from './views/analyzer.js';
import { renderSaved } from './views/editais.js';
import { renderPage, loadPages, renderTree, newPageModal, flushPage } from './views/pages.js';
import { renderTasks } from './views/tasks.js';
import { renderCards } from './views/cards.js';
import { renderFocus } from './views/focus.js';
import { renderPlus } from './views/plus.js';
import { renderPrazos, loadDeadlines, daysLeft, whenLabel } from './views/prazos.js';
import { openPalette } from './views/command.js';
import { startMascot, unmountPet } from './mascot.js';

const root = document.getElementById('app');
let theme = store.get('krisis.theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
let lastUserId = null;
const prevVisit = store.get('krisis.lastVisit', null);
store.set('krisis.lastVisit', new Date().toISOString());

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', theme === 'dark' ? '#080a12' : '#eef2f9');
}
applyTheme();

const ROUTES = {
  hoje: ['Hoje', renderHome],
  analisar: ['Analisar edital', renderAnalyzer],
  editais: ['Meus editais', renderSaved],
  prazos: ['Radar de prazos', renderPrazos],
  tarefas: ['Tarefas', renderTasks],
  cartoes: ['Cartões de revisão', renderCards],
  foco: ['Foco', renderFocus],
  plus: ['Krisis Plus', renderPlus],
  pagina: ['Página', renderPage]
};

const NAV = [
  ['Visão geral', [['#/hoje', 'home', 'Hoje']]],
  ['Estudo', [['#/analisar', 'scan', 'Analisar edital'], ['#/editais', 'folder', 'Meus editais'], ['#/prazos', 'calendar', 'Prazos'], ['#/tarefas', 'check', 'Tarefas'], ['#/cartoes', 'cards', 'Cartões'], ['#/foco', 'timer', 'Foco']]]
];
const TICKER_TIPS = ['Cole um edital na barra de comando para ver os prazos aqui', 'Missões do dia renovam à meia-noite', 'Ctrl+K abre a barra de comando em qualquer tela', 'Arraste o Kri para onde preferir'];

function lastLabel() {
  if (!prevVisit) return 'Primeira vez por aqui';
  try { return 'Último acesso: ' + new Date(prevVisit).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); } catch (_) { return ''; }
}

function navLink(href, ic, label) { return h('a', { href, 'data-r': href.split('/')[1] }, icon(ic), label); }

function statChips() {
  const s = getStats();
  const box = document.getElementById('topStats');
  if (box) {
    const f = icon('flame', 16);
    f.classList.add('flame');
    box.replaceChildren(h('span', { class: 'chip', title: 'Dias seguidos estudando' }, f, String(s.streak)), h('span', { class: 'chip blue', title: 'Pontos de experiência' }, icon('bolt', 16), s.xp + ' XP'));
  }
  const l = document.getElementById('lvlBox');
  if (l) l.replaceChildren(h('span', {}, 'Nível ' + s.level), h('div', { class: 'bar' }, h('i', { style: 'width:' + s.levelXp + '%' })), h('span', { class: 'muted' }, s.levelXp + ' de 100 XP para o próximo nível'));
}

function buildShell() {
  const name = displayName();
  const plan = isPlus()
    ? h('div', { class: 'plus-card' }, h('span', {}, 'Plano Plus ativo'))
    : h('div', { class: 'plus-card' }, h('span', {}, 'Krisis Plus: IA para estudar mais rápido.'), h('a', { class: 'btn sm primary', href: '#/plus' }, 'Conhecer'));
  const side = h('aside', { class: 'side glass', id: 'side' },
    h('a', { class: 'brand', href: '#/hoje' }, h('span', { class: 'brand-mark' }, 'K'), h('span', { class: 'brand-name' }, 'Krisis')),
    h('div', { class: 'greet' }, h('span', { class: 'greet-s' }, 'Bem-vindo de volta,'), h('b', { class: 'greet-n' }, name), h('span', { class: 'greet-l' }, lastLabel()), h('div', { class: 'lvl', id: 'lvlBox' })),
    h('nav', { class: 'nav', id: 'nav', 'aria-label': 'Principal' }, h('i', { class: 'nav-ind', id: 'navInd' }),
      NAV.map(([label, items]) => [h('div', { class: 'side-label' }, label), items.map(([href, ic, l]) => navLink(href, ic, l))])),
    h('div', { class: 'side-section' },
      h('div', { class: 'side-title' }, h('span', {}, 'Páginas'), h('button', { class: 'icon-btn tiny', title: 'Nova página', 'aria-label': 'Nova página', onclick: () => newPageModal(null) }, icon('plus', 16))),
      h('div', { id: 'tree', class: 'tree' })),
    h('div', { class: 'side-foot' }, plan,
      h('button', { class: 'acct', onclick: () => openAccount(() => render()) },
        h('span', { class: 'avatar' }, (name[0] || 'K').toUpperCase()),
        h('span', {}, h('div', { class: 'acct-name' }, name), h('div', { class: 'acct-sub' }, isPlus() ? 'Plus' : 'Plano grátis')))));
  const top = h('header', { class: 'top' },
    h('button', { class: 'icon-btn menu-btn', 'aria-label': 'Abrir menu', onclick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
    h('div', { class: 'crumb' }, icon('home', 18), h('span', { class: 'muted' }, 'Visão geral'), h('span', { class: 'muted' }, '/'), h('b', { id: 'topTitle' })),
    h('button', { class: 'search-pill', onclick: openPalette, 'aria-label': 'Buscar ou criar' }, icon('search', 16), h('span', { class: 't' }, 'Buscar ou criar…'), h('kbd', {}, 'Ctrl K')),
    h('div', { class: 'top-stats', id: 'topStats' }),
    h('button', { class: 'icon-btn', id: 'themeBtn', 'aria-label': 'Alternar tema', onclick: toggleTheme }, icon(theme === 'dark' ? 'sun' : 'moon')));
  return h('div', { class: 'shell' }, side,
    h('div', { class: 'scrim', onclick: () => document.body.classList.remove('nav-open') }),
    h('main', { class: 'main' }, top, h('div', { class: 'ticker', id: 'ticker', 'aria-label': 'Prazos próximos' }), h('div', { id: 'view', class: 'view' })));
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  store.set('krisis.theme', theme);
  applyTheme();
  const b = document.getElementById('themeBtn');
  if (b) b.replaceChildren(icon(theme === 'dark' ? 'sun' : 'moon'));
}

async function refreshTree(activeId) {
  const el = document.getElementById('tree');
  if (!el) return;
  await loadPages();
  renderTree(el, activeId);
}

let dl = { t: 0, list: null };
async function paintTicker(force) {
  const el = document.getElementById('ticker');
  if (!el) return;
  if (force || !dl.list || Date.now() - dl.t > 60000) {
    try { dl.list = await loadDeadlines(); } catch (_) { dl.list = []; }
    dl.t = Date.now();
  }
  const up = (dl.list || []).filter((d) => daysLeft(d.date) >= 0).slice(0, 8);
  const mk = () => h('div', { class: 'tk-set' }, up.length
    ? up.map((d) => { const n = daysLeft(d.date); return h('div', { class: 'tk' }, h('i', { class: 'tk-dot ' + (n <= 3 ? 'hot' : n <= 14 ? 'warm' : '') }), h('span', {}, d.label.length > 48 ? d.label.slice(0, 47) + '…' : d.label), h('span', { class: 'muted' }, d.edital), h('span', { class: 'chip ' + (n <= 3 ? 'rose' : 'blue') }, whenLabel(n))); })
    : TICKER_TIPS.map((t) => h('div', { class: 'tk' }, icon('sparkle', 16), h('span', {}, t))));
  el.replaceChildren(h('div', { class: 'ticker-track' }, mk(), mk()));
}

function moveIndicator() {
  const ind = document.getElementById('navInd');
  const a = document.querySelector('#nav a.active');
  if (!ind) return;
  if (!a) { ind.style.opacity = '0'; return; }
  ind.style.top = a.offsetTop + 'px';
  ind.style.height = a.offsetHeight + 'px';
  ind.style.opacity = '1';
}

let routeSeq = 0;
async function route() {
  if (!state.user) return;
  document.body.classList.remove('nav-open');
  flushPage();
  const parts = (location.hash || '#/hoje').split('/');
  const seg = ROUTES[parts[1]] ? parts[1] : 'hoje';
  const arg = parts[2] || null;
  const [title, fn] = ROUTES[seg];
  const my = ++routeSeq;
  document.body.dataset.route = seg;
  document.getElementById('topTitle').textContent = title;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === seg));
  moveIndicator();
  const box = h('div', { class: 'view-inner' });
  document.getElementById('view').replaceChildren(box);
  window.scrollTo(0, 0);
  statChips();
  paintTicker(seg === 'editais' || seg === 'analisar' || seg === 'prazos');
  refreshTree(seg === 'pagina' ? arg : null);
  try {
    await fn(box, arg);
  } catch (err) {
    if (my === routeSeq) box.replaceChildren(h('div', { class: 'tile' }, h('h3', {}, 'Algo deu errado'), h('p', { class: 'muted' }, 'Recarregue a página e tente de novo.')));
    console.error('[krisis] rota', seg, err);
  }
}

function render() {
  root.replaceChildren();
  if (!state.user) {
    unmountPet();
    delete document.body.dataset.route;
    root.append(renderLanding({ onLogin: () => openAuth('login'), onSignup: () => openAuth('signup') }));
    return;
  }
  root.append(buildShell());
  route();
  startMascot(displayName().split(' ')[0]);
}

async function boot() {
  if (!sb) {
    root.replaceChildren(h('main', { class: 'boot' }, h('h1', {}, 'Krisis'), h('p', {}, 'Não foi possível carregar um recurso necessário. Verifique sua conexão e recarregue a página.')));
    return;
  }
  const { data } = await sb.auth.getSession();
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
window.addEventListener('resize', moveIndicator);
document.addEventListener('krisis:stats', statChips);
document.addEventListener('krisis:pages', () => {
  const m = (location.hash || '').match(/^#\/pagina\/(.+)$/);
  refreshTree(m ? m[1] : null);
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && state.user) { e.preventDefault(); openPalette(); }
});
boot();
