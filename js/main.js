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

const root = document.getElementById('app');
let theme = store.get('krisis.theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
let lastUserId = null;

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', theme === 'dark' ? '#0d0f17' : '#f3f5fb');
}
applyTheme();

const ROUTES = {
  hoje: ['Hoje', renderHome],
  analisar: ['Analisar edital', renderAnalyzer],
  editais: ['Meus editais', renderSaved],
  tarefas: ['Tarefas', renderTasks],
  cartoes: ['Cartões de revisão', renderCards],
  foco: ['Foco', renderFocus],
  plus: ['Krisis Plus', renderPlus],
  pagina: ['Página', renderPage]
};

function navLink(href, ic, label) {
  return h('a', { href, 'data-r': href.split('/')[1] }, icon(ic), label);
}

function statChips() {
  const s = getStats();
  const box = document.getElementById('topStats');
  if (!box) return;
  box.replaceChildren(
    h('span', { class: 'chip', title: 'Dias seguidos estudando' }, icon('flame', 16), String(s.streak)),
    h('span', { class: 'chip blue', title: 'Pontos de experiência' }, icon('bolt', 16), s.xp + ' XP')
  );
}

function buildShell() {
  const name = displayName();
  const plan = isPlus()
    ? h('div', { class: 'plus-card' }, h('span', {}, 'Plano Plus ativo ✨'))
    : h('div', { class: 'plus-card' }, h('span', {}, 'Krisis Plus: IA para estudar mais rápido.'), h('a', { class: 'btn sm primary', href: '#/plus' }, 'Conhecer'));
  const side = h('aside', { class: 'side glass', id: 'side' },
    h('a', { class: 'brand', href: '#/hoje' }, h('span', { class: 'brand-mark' }, 'K'), h('span', { class: 'brand-name' }, 'Krisis')),
    h('nav', { class: 'nav', id: 'nav', 'aria-label': 'Principal' },
      navLink('#/hoje', 'home', 'Hoje'), navLink('#/analisar', 'scan', 'Analisar edital'), navLink('#/editais', 'folder', 'Meus editais'),
      navLink('#/tarefas', 'check', 'Tarefas'), navLink('#/cartoes', 'cards', 'Cartões'), navLink('#/foco', 'timer', 'Foco')),
    h('div', { class: 'side-section' },
      h('div', { class: 'side-title' }, h('span', {}, 'Páginas'), h('button', { class: 'icon-btn tiny', title: 'Nova página', 'aria-label': 'Nova página', onclick: () => newPageModal(null) }, icon('plus', 16))),
      h('div', { id: 'tree', class: 'tree' })),
    h('div', { class: 'side-foot' }, plan,
      h('button', { class: 'acct', onclick: () => openAccount(() => { render(); }) },
        h('span', { class: 'avatar' }, (name[0] || 'K').toUpperCase()),
        h('span', {}, h('div', { class: 'acct-name' }, name), h('div', { class: 'acct-sub' }, isPlus() ? 'Plus' : 'Plano grátis')))));
  const top = h('header', { class: 'top' },
    h('button', { class: 'icon-btn menu-btn', 'aria-label': 'Abrir menu', onclick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
    h('h1', { class: 'top-title', id: 'topTitle' }),
    h('div', { class: 'top-stats', id: 'topStats' }),
    h('button', { class: 'icon-btn', id: 'themeBtn', 'aria-label': 'Alternar tema', onclick: toggleTheme }, icon(theme === 'dark' ? 'sun' : 'moon')));
  return h('div', { class: 'shell' }, side,
    h('div', { class: 'scrim', onclick: () => document.body.classList.remove('nav-open') }),
    h('main', { class: 'main' }, top, h('div', { id: 'view', class: 'view' })));
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
  document.getElementById('topTitle').textContent = title;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === seg));
  const box = h('div', { class: 'view-inner' });
  const view = document.getElementById('view');
  view.replaceChildren(box);
  window.scrollTo(0, 0);
  statChips();
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
    root.append(renderLanding({ onLogin: () => openAuth('login'), onSignup: () => openAuth('signup') }));
    return;
  }
  root.append(buildShell());
  route();
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
    if (id === lastUserId) return; // evita redesenhar em refresh de token
    lastUserId = id;
    setTimeout(async () => { await loadProfile(); render(); }, 0);
  });
}

window.addEventListener('hashchange', route);
document.addEventListener('krisis:stats', statChips);
document.addEventListener('krisis:pages', () => {
  const m = (location.hash || '').match(/^#\/pagina\/(.+)$/);
  refreshTree(m ? m[1] : null);
});
boot();
