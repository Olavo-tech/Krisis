import { sb, h, icon, getStats, getQuests, getHeat, weekDone, countUp, chip, empty } from '../core.js';
import { displayName } from '../auth.js';
import { createKri, bindPoke } from '../mascot.js';
import { cmdBar } from './command.js';
import { parseDeadlines, daysLeft, whenLabel } from './prazos.js';

function rel(d) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return 'há ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'há ' + Math.floor(s / 3600) + ' h';
  return 'há ' + Math.floor(s / 86400) + ' d';
}

const act = (ic, title, desc, href) => h('a', { class: 'act', href }, h('span', { class: 'act-ic' }, icon(ic, 22)), h('b', {}, title), h('span', { class: 'd' }, desc), h('span', { class: 'act-go' }, icon('arrow', 18)));

function sum(tone, title, sub, value, href) {
  const n = h('b', { class: 'sum-n' }, '0');
  const el = h('a', { class: 'sum ' + tone, href }, h('div', { class: 'sum-top' }, h('span', {}, title), h('span', { class: 'sum-go' }, icon('arrow', 16))), h('div', { class: 'sum-bot' }, h('span', { class: 'sum-sub' }, sub), n));
  requestAnimationFrame(() => countUp(n, value));
  return el;
}

function ring(q) {
  const NS = 'http://www.w3.org/2000/svg';
  const C = 2 * Math.PI * 18;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'r'); svg.setAttribute('viewBox', '0 0 44 44');
  const mk = (stroke, w) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '22'); c.setAttribute('cy', '22'); c.setAttribute('r', '18'); c.setAttribute('fill', 'none'); c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', String(w)); c.setAttribute('stroke-linecap', 'round'); return c; };
  const track = mk('var(--line)', 4);
  const arc = mk('currentColor', 4);
  arc.setAttribute('stroke-dasharray', String(C));
  arc.setAttribute('stroke-dashoffset', String(C));
  arc.style.transition = 'stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)';
  svg.append(track, arc);
  requestAnimationFrame(() => requestAnimationFrame(() => arc.setAttribute('stroke-dashoffset', String(C * (1 - q.done / q.n)))));
  return h('span', { class: 'ring-s' }, svg, icon(q.complete ? 'check' : q.ic, 18));
}

const LINK = { tarefas: '#/tarefas', revisao: '#/cartoes', foco: '#/foco', edital: '#/analisar' };

function missionsCard() {
  const qs = getQuests();
  const done = qs.filter((q) => q.complete).length;
  return h('section', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Missões do dia'), chip(done === qs.length ? 'Dia perfeito' : done + ' de ' + qs.length, done === qs.length ? 'green' : '')),
    h('div', { class: 'quests' }, qs.map((q) => h('a', { class: 'quest' + (q.complete ? ' done' : ''), href: LINK[q.k] },
      ring(q), h('div', { class: 'q-b' }, h('b', {}, q.t), h('span', { class: 'muted' }, q.done + ' de ' + q.n)), chip('+' + q.xp + ' XP', q.complete ? 'green' : 'blue')))));
}

function heatCard() {
  const heat = getHeat(15);
  const w = weekDone();
  return h('section', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Constância'), chip(w + ' de 5 dias nesta semana', w >= 5 ? 'green' : '')),
    h('div', { class: 'heat' }, heat.map((c, i) => h('i', { class: 'hc l' + c.l + (c.today ? ' today' : ''), style: '--i:' + i, title: c.date }))),
    h('div', { class: 'heat-leg muted' }, 'menos', [0, 1, 2, 3, 4].map((l) => h('i', { class: 'hc l' + l })), 'mais'));
}

export async function renderHome(box) {
  const st = getStats();
  const first = displayName().split(' ')[0];
  const kri = createKri({ size: 150 });
  bindPoke(kri);
  box.append(h('section', { class: 'hero-c' }, kri.el,
    h('p', { class: 'hello-sm' }, st.studiedToday ? 'Você já estudou hoje' : 'Bem-vindo de volta'),
    h('h2', { class: 'hero-h' }, 'O que vamos estudar hoje, ' + first + '?'), cmdBar()));

  const now = new Date().toISOString();
  const [c, t, p, tk, e] = await Promise.all([
    sb.from('flashcards').select('id', { count: 'exact', head: true }).lte('due_at', now),
    sb.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false),
    sb.from('pages').select('id,title,updated_at').eq('is_archived', false).order('updated_at', { ascending: false }).limit(5),
    sb.from('tasks').select('id,title,done,created_at').order('created_at', { ascending: false }).limit(5),
    sb.from('editais_salvos').select('id,titulo,analysis,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(60)
  ]);
  const due = c.count || 0, open = t.count || 0, eds = e.data || [];
  const dls = parseDeadlines(eds).filter((d) => daysLeft(d.date) >= 0).slice(0, 3);

  const feedItems = [
    ...(p.data || []).map((x) => ({ t: x.updated_at, ic: 'file', tx: 'Você editou ', b: x.title || 'Sem título', href: '#/pagina/' + x.id })),
    ...(tk.data || []).map((x) => ({ t: x.created_at, ic: 'check', tx: x.done ? 'Tarefa concluída: ' : 'Nova tarefa: ', b: x.title, href: '#/tarefas' })),
    ...eds.slice(0, 5).map((x) => ({ t: x.created_at, ic: 'folder', tx: 'Edital salvo: ', b: x.titulo, href: '#/editais' }))
  ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 7);

  box.append(
    h('div', { class: 'acts' },
      act('scan', 'Analisar edital', 'Datas, vagas e requisitos em segundos.', '#/analisar'),
      act('cards', 'Revisar cartões', due ? due + (due === 1 ? ' cartão espera' : ' cartões esperam') + ' por você.' : 'Tudo em dia por enquanto.', '#/cartoes'),
      act('calendar', 'Radar de prazos', dls.length ? 'Próximo: ' + whenLabel(daysLeft(dls[0].date)).toLowerCase() + '.' : 'Veja o que vence primeiro.', '#/prazos')),
    h('div', { class: 'sums' },
      sum('lime', 'Cartões para revisar', 'prontos agora', due, '#/cartoes'),
      sum('mint', 'Tarefas abertas', 'a fazer', open, '#/tarefas'),
      sum('blush', 'Editais salvos', 'na sua biblioteca', e.count || eds.length, '#/editais')),
    h('div', { class: 'home-grid' },
      h('div', { class: 'col' }, missionsCard(), heatCard()),
      h('div', { class: 'col' },
        h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', {}, 'Próximos prazos'), h('a', { class: 'link', href: '#/prazos' }, 'Ver todos')),
          dls.length
            ? h('div', { class: 'feed' }, dls.map((d) => { const n = daysLeft(d.date); return h('a', { class: 'feed-i', href: '#/prazos' }, h('span', { class: 'feed-ic' }, icon('calendar', 16)), h('div', { class: 'feed-b' }, h('b', {}, d.label), h('span', { class: 'muted' }, d.edital)), chip(whenLabel(n), n <= 3 ? 'rose' : 'blue')); }))
            : h('p', { class: 'muted' }, 'Salve um edital para ver os prazos aqui.')),
        h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', {}, 'Atividade recente')),
          feedItems.length
            ? h('div', { class: 'feed' }, feedItems.map((f) => h('a', { class: 'feed-i', href: f.href }, h('span', { class: 'feed-ic' }, icon(f.ic, 16)), h('div', { class: 'feed-b' }, h('span', {}, f.tx), h('b', {}, f.b)), h('span', { class: 'muted feed-t' }, rel(f.t)))))
            : empty('Nada por aqui ainda', 'Crie uma página ou uma tarefa e ela aparece neste feed.')))));
}
