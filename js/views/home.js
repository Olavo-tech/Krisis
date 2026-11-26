import { sb, h, icon, getQuests, getHeat, weekDone, countUp, chip, empty, store, isoDay } from '../core.js';
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

const STEPS = [
  { key: 'foco', title: 'Fazer uma sessão de foco', tone: 'peach', offset: 0 },
  { key: 'revisao', title: 'Revisar cartões', tone: 'violet', offset: -1 },
  { key: 'tarefas', title: 'Concluir tarefas', tone: 'mint', offset: 0 },
  { key: 'edital', title: 'Analisar um edital', tone: 'gold', offset: 1 }
];

function trailSteps(due, open) {
  const quests = getQuests();
  const steps = STEPS.map((step) => ({ ...quests.find((q) => q.k === step.key), ...step }));
  const available = { foco: true, revisao: due > 0, tarefas: open > 0, edital: true };
  const next = steps.find((step) => !step.complete && available[step.key]);
  const href = (step) => step.key === 'revisao' && due ? '#/cartoes/revisar' : LINK[step.key];

  return h('ol', { class: 'trail-steps' }, steps.map((step) => {
    const current = step === next;
    const status = step.complete ? 'Concluído' : step.n > 1 ? step.done + ' de ' + step.n : '';
    return h('li', { class: 'trail-step', style: '--offset:' + step.offset },
      h('a', { class: 'trail-link ' + step.tone + (current ? ' current' : ''), href: href(step), title: step.t + ' (+' + step.xp + ' XP)',
        'aria-current': current ? 'step' : null },
        h('span', { class: 'trail-icon' }, icon(step.complete ? 'check' : step.ic, 25)),
        h('span', { class: 'trail-label' }, current ? h('small', {}, 'Próximo passo') : null,
          h('strong', {}, step.title), status ? h('small', {}, status) : null)));
  }));
}

function heatCard() {
  const w = weekDone();
  return h('section', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Constância'), chip(w + ' de 5 dias nesta semana', w >= 5 ? 'green' : '')),
    h('div', { class: 'heat' }, getHeat(15).map((c, i) => h('i', { class: 'hc l' + c.l + (c.today ? ' today' : ''), style: '--i:' + i, title: c.date }))),
    h('div', { class: 'heat-leg muted' }, 'menos', [0, 1, 2, 3, 4].map((l) => h('i', { class: 'hc l' + l })), 'mais'));
}

export async function renderHome(box) {
  const trail = h('section', { class: 'trail', 'aria-labelledby': 'trail-title' });
  const quests = getQuests();
  const done = quests.filter((quest) => quest.complete).length;
  const kri = createKri({ size: 122 });
  bindPoke(kri);
  trail.append(h('div', { class: 'trail-head' },
    h('div', {}, h('h2', { id: 'trail-title' }, 'Sua trilha de hoje'),
      h('p', {}, done === quests.length ? 'Missões de hoje concluídas' : done + ' de ' + quests.length + ' missões concluídas')),
    h('progress', { max: quests.length, value: done, 'aria-label': 'Missões concluídas' })),
    h('div', { class: 'trail-map' }, trailSteps(0, 0), h('div', { class: 'trail-kri' }, kri.el)));
  const more = h('details', { class: 'home-more' },
    h('summary', {}, 'Meu painel'),
    h('div', { class: 'cmd-wrap' }, cmdBar()),
    weekStrip());
  const desktop = window.matchMedia('(min-width: 901px)');
  more.open = desktop.matches;
  box.append(trail, more);

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

  if (due || open) {
    const links = trailSteps(due, open).querySelectorAll('.trail-link');
    // Keep the focused link and the mascot instance while the counts load.
    trail.querySelector('.trail-steps').querySelectorAll('a').forEach((link, i) => {
      const updated = links[i];
      if (link.className === updated.className && link.hash === updated.hash) return;
      link.className = updated.className;
      link.setAttribute('href', updated.getAttribute('href'));
      if (updated.hasAttribute('aria-current')) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
      link.lastElementChild.replaceChildren(...updated.lastElementChild.childNodes);
    });
  }
  more.append(
    h('div', { class: 'plan' },
      pl('lime', 'dots', 'Revisar', due, due === 1 ? 'cartão pronto' : 'cartões prontos', '#/cartoes'),
      pl('sky', 'stripes', 'Tarefas', open, open === 1 ? 'tarefa aberta' : 'tarefas abertas', '#/tarefas'),
      pl('butter', 'checks', 'Radar', dls.length ? whenLabel(daysLeft(dls[0].date)) : 'Sem prazos', dls.length ? dls[0].label.slice(0, 40) : 'Salve um edital', '#/prazos'),
      pl('ink', 'waves', 'Mágico', 'Jogue aqui', 'Eu organizo seu material', '#/magico')),
    h('div', { class: 'home-grid' },
      h('div', { class: 'col' }, heatCard()),
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
