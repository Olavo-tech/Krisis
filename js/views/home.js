import { sb, h, icon, getStats, fmtDate, empty } from '../core.js';
import { displayName } from '../auth.js';

function stat(tone, ic, big, label, href) {
  const tag = href ? 'a' : 'div';
  return h(tag, Object.assign({ class: 'tile stat ' + tone }, href ? { href } : {}), icon(ic, 22), h('b', {}, big), h('span', {}, label));
}

export async function renderHome(box) {
  const st = getStats();
  const first = displayName().split(' ')[0];
  box.append(h('div', { class: 'hello' }, h('h2', {}, 'Olá, ' + first + '!'),
    h('p', { class: 'muted' }, st.studiedToday ? 'Você já estudou hoje. Mantenha a sequência!' : 'Comece com uma tarefa pequena. Cinco minutos já contam.')));
  const stats = h('div', { class: 'stat-row' });
  box.append(stats);
  const [t, c, p, e] = await Promise.all([
    sb.from('tasks').select('id,title,due_at').eq('done', false).order('due_at', { nullsFirst: false }).limit(5),
    sb.from('flashcards').select('id', { count: 'exact', head: true }).lte('due_at', new Date().toISOString()),
    sb.from('pages').select('id,title,icon,updated_at').eq('is_archived', false).order('updated_at', { ascending: false }).limit(4),
    sb.from('editais_salvos').select('id', { count: 'exact', head: true })
  ]);
  stats.append(
    stat('sky', 'flame', String(st.streak), st.streak === 1 ? 'dia seguido' : 'dias seguidos'),
    stat('butter', 'bolt', String(st.xp), 'XP · nível ' + st.level),
    stat('mint', 'cards', String(c.count || 0), 'cartões para revisar', '#/cartoes'),
    stat('blush', 'folder', String(e.count || 0), 'editais salvos', '#/editais'));

  const tasks = t.data || [];
  const pages = p.data || [];
  box.append(h('div', { class: 'two' },
    h('section', {}, h('h3', { class: 'panel-title' }, 'Próximas tarefas'),
      tasks.length
        ? h('div', { class: 'list' }, tasks.map((x) => h('a', { class: 'item', href: '#/tarefas' }, h('span', { class: 'item-t' }, x.title), x.due_at ? h('span', { class: 'chip' }, fmtDate(x.due_at)) : null)))
        : empty('Nada pendente', 'Crie uma tarefa para o próximo passo dos estudos.', h('a', { class: 'btn primary', href: '#/tarefas' }, 'Nova tarefa'))),
    h('section', {}, h('h3', { class: 'panel-title' }, 'Continue de onde parou'),
      pages.length
        ? h('div', { class: 'list' }, pages.map((x) => h('a', { class: 'item', href: '#/pagina/' + x.id }, h('span', {}, x.icon || '📄'), h('span', { class: 'item-t' }, x.title || 'Sem título'))))
        : empty('Sem páginas ainda', 'Use um modelo pronto, como o plano semanal.', h('button', { class: 'btn primary', onclick: () => document.querySelector('.side-title .icon-btn') && document.querySelector('.side-title .icon-btn').click() }, 'Criar página')))));
  box.append(h('a', { class: 'tile lime row', style: 'margin-top:14px;display:flex', href: '#/analisar' },
    icon('scan', 26), h('div', { class: 'grow' }, h('b', {}, 'Analisar um edital'), h('div', { class: 'muted' }, 'Cole o link, o texto ou envie o PDF.')), h('span', { class: 'btn sm green' }, 'Abrir')));
}
