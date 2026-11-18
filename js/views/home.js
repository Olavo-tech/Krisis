import { sb, h, icon, getStats, getQuests, getHeat, weekDone, countUp, chip, empty, store, isoDay } from '../core.js';
import { displayName } from '../auth.js';
import { createKri, bindPoke } from '../mascot.js';
import { cmdBar } from './command.js';
import { parseDeadlines, daysLeft, whenLabel } from './prazos.js';

const LINK = { tarefas: '#/tarefas', revisao: '#/cartoes', foco: '#/foco', edital: '#/analisar' };

function rel(d) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return 'há ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'há ' + Math.floor(s / 3600) + ' h';
  return 'há ' + Math.floor(s / 86400) + ' d';
}

function ring(q) {
  const NS = 'http://www.w3.org/2000/svg';
  const C = 2 * Math.PI * 18;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'r'); svg.setAttribute('viewBox', '0 0 44 44');
  const mk = (stroke) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '22'); c.setAttribute('cy', '22'); c.setAttribute('r', '18'); c.setAttribute('fill', 'none'); c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', '4'); c.setAttribute('stroke-linecap', 'round'); return c; };
  const arc = mk('currentColor');
  arc.setAttribute('stroke-dasharray', String(C)); arc.setAttribute('stroke-dashoffset', String(C));
  arc.style.transition = 'stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)';
  svg.append(mk('var(--line)'), arc);
  requestAnimationFrame(() => requestAnimationFrame(() => arc.setAttribute('stroke-dashoffset', String(C * (1 - q.done / q.n)))));
  return h('span', { class: 'ring-s' }, svg, icon(q.complete ? 'check' : q.ic, 18));
}

function pl(tone, pat, tag, big, small, href) {
  const n = h('b', { class: 'n' }, typeof big === 'number' ? '0' : big);
  if (typeof big === 'number') requestAnimationFrame(() => countUp(n, big));
  return h('a', { class: 'pl pat pat-' + pat + ' ' + tone, href }, h('div', { class: 'pl-top' }, h('span', { class: 'tag' }, tag), h('span', { class: 'pl-go' }, icon('arrow', 16))), h('div', {}, n, h('small', {}, small)));
}

function weekStrip() {
  const days = new Set(store.get('krisis.days', []));
  const t = new Date();
  const dow = (t.getDay() + 6) % 7;
  const names = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  return h('div', { class: 'week' }, names.map((n, i) => {
    const d = new Date(t); d.setDate(t.getDate() - dow + i);
    return h('div', { class: 'day' + (days.has(isoDay(d)) ? ' on' : '') + (i === dow ? ' today' : '') }, h('i', {}), h('span', {}, n), h('b', {}, String(d.getDate())));
  }));
}

function missionsCard() {
  const qs = getQuests();
  const done = qs.filter((q) => q.complete).length;
  return h('section', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Missões do dia'), chip(done === qs.length ? 'Dia perfeito' : done + ' de ' + qs.length, done === qs.length ? 'green' : '')),
    h('div', { class: 'quests' }, qs.map((q) => h('a', { class: 'quest' + (q.complete ? ' done' : ''), href: LINK[q.k] }, ring(q), h('div', { class: 'q-b' }, h('b', {}, q.t), h('span', { class: 'muted' }, q.done + ' de ' + q.n)), chip('+' + q.xp + ' XP', q.complete ? 'green' : 'blue')))));
}

function heatCard() {
  const w = weekDone();
  return h('section', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Constância'), chip(w + ' de 5 dias nesta semana', w >= 5 ? 'green' : '')),
    h('div', { class: 'heat' }, getHeat(15).map((c, i) => h('i', { class: 'hc l' + c.l + (c.today ? ' today' : ''), style: '--i:' + i, title: c.date }))),
    h('div', { class: 'heat-leg muted' }, 'menos', [0, 1, 2, 3, 4].map((l) => h('i', { class: 'hc l' + l })), 'mais'));
}

export async function renderHome(box) {
  const first = displayName().split(' ')[0];
  const qs = getQuests();
  const done = qs.filter((q) => q.complete).length;
  const xpLeft = qs.filter((q) => !q.complete).reduce((s, q) => s + q.xp, 0);
  const next = qs.find((q) => !q.complete);
  const kri = createKri({ size: 120 });
  bindPoke(kri);
  box.append(
    h('section', { class: 'challenge pat pat-dots' },
      h('div', {}, h('span', { class: 'sticker' }, 'desafio do dia'),
        h('h2', { style: 'margin-top:8px' }, done === qs.length ? 'Dia perfeito!' : 'Faltam ' + (qs.length - done) + (qs.length - done === 1 ? ' missão' : ' missões')),
        h('p', {}, done === qs.length ? 'Você fez tudo hoje. Volte amanhã!' : 'Ganhe até +' + xpLeft + ' XP ainda hoje, ' + first + '.'),
        h('div', { class: 'pbar' }, h('i', { style: 'width:' + Math.round(done / qs.length * 100) + '%' })),
        next ? h('a', { class: 'btn green', href: LINK[next.k] }, next.t) : null),
      kri.el),
    h('div', { class: 'cmd-wrap' }, cmdBar()),
    weekStrip());

  const now = new Date().toISOString();
  const [c, t, p, tk, e] = await Promise.all([
    sb.from('flashcards').select('id', { count: 'exact', head: true }).lte('due_at', now),
    sb.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false),
    sb.from('pages').select('id,title,updated_at').eq('is_archived', false).order('updated_at', { ascending: false }).limit(5),
    sb.from('tasks').select('id,title,done,created_at').order('created_at', { ascending: false }).limit(5),
    sb.from('editais_salvos').select('id,titulo,analysis,created_at').order('created_at', { ascending: false }).limit(60)
  ]);
  const due = c.count || 0, open = t.count || 0, eds = e.data || [];
  const dls = parseDeadlines(eds).filter((d) => daysLeft(d.date) >= 0).slice(0, 3);
  const feedItems = [
    ...(p.data || []).map((x) => ({ t: x.updated_at, ic: 'file', tx: 'Você editou ', b: x.title || 'Sem título', href: '#/pagina/' + x.id })),
    ...(tk.data || []).map((x) => ({ t: x.created_at, ic: 'check', tx: x.done ? 'Tarefa concluída: ' : 'Nova tarefa: ', b: x.title, href: '#/tarefas' })),
    ...eds.slice(0, 5).map((x) => ({ t: x.created_at, ic: 'folder', tx: 'Edital salvo: ', b: x.titulo, href: '#/editais' }))
  ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 7);

  box.append(
    h('div', { class: 'plan' },
      pl('lime', 'dots', 'Revisar', due, due === 1 ? 'cartão pronto' : 'cartões prontos', '#/cartoes'),
      pl('sky', 'stripes', 'Tarefas', open, open === 1 ? 'tarefa aberta' : 'tarefas abertas', '#/tarefas'),
      pl('butter', 'checks', 'Radar', dls.length ? whenLabel(daysLeft(dls[0].date)) : 'Sem prazos', dls.length ? dls[0].label.slice(0, 40) : 'Salve um edital', '#/prazos'),
      pl('ink', 'waves', 'Mágico', 'Jogue aqui', 'Eu organizo seu material', '#/magico')),
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
