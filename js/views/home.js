import { sb, h, icon, getStats, getQuests, getHeat, weekDone, chip, empty, store, isoDay } from '../core.js';
import { ic } from '../icons.js';
import { gate } from '../ui.js';
import { displayName } from '../auth.js';
import { createTuck } from '../tuck.js';
import { loadSubjects, loadTopics, progressOf, weakTopics, mastery, isDone } from '../data.js';
import { parseDeadlines, daysLeft, whenLabel } from './prazos.js';
import { toolGrid } from './praticar.js';

const LINK = { tarefas: '#/tarefas', revisao: '#/cartoes', foco: '#/foco', edital: '#/editais' };

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

function pl(tone, pat, tag, big, small, href, ai) {
  const el = h('a', { class: 'pl pat pat-' + pat + ' ' + tone, href }, h('div', { class: 'pl-top' }, h('span', { class: 'tag' }, tag), h('span', { class: 'pl-go' }, icon('arrow', 16))), h('div', {}, h('b', { class: 'n' }, String(big)), h('small', {}, small)));
  return ai ? gate(el) : el;
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
  const now = new Date().toISOString();
  const [subs, topics, c, t, e] = await Promise.all([
    loadSubjects(), loadTopics(),
    sb.from('flashcards').select('id', { count: 'exact', head: true }).lte('due_at', now),
    sb.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false),
    sb.from('editais_salvos').select('id,titulo,analysis,created_at').order('created_at', { ascending: false }).limit(60)
  ]);
  const due = c.count || 0, open = t.count || 0;
  const dls = parseDeadlines(e.data || []).filter((d) => daysLeft(d.date) >= 0).slice(0, 3);
  const cur = subs.find((s) => s.id === store.get('eduquack.subject', null)) || subs[0];
  const curTopics = cur ? topics.filter((x) => x.subject_id === cur.id) : [];
  const prog = progressOf(curTopics);
  const next = curTopics.find((x) => !isDone(x));
  const tuck = createTuck({ size: 124 });

  box.append(h('section', { class: 'challenge pat pat-dots' },
    h('div', {}, h('span', { class: 'sticker' }, 'oi, ' + first),
      h('h2', { style: 'margin-top:8px' }, cur ? 'Continue em ' + cur.name : 'Vamos começar?'),
      h('p', {}, cur ? (next ? 'Próximo tópico: ' + next.title : curTopics.length ? 'Trilha concluída! Revise os pontos fracos.' : 'Adicione tópicos para montar a trilha.') : 'Crie uma pasta para o que você quer aprender e eu monto o caminho.'),
      cur ? h('div', { class: 'bar' }, h('i', { style: 'width:' + prog.pct + '%' })) : null,
      h('a', { class: 'btn green', href: cur ? '#/trilha/' + cur.id : '#/pastas' }, cur ? 'Continuar trilha' : 'Criar minha primeira pasta')),
    tuck.el));
  box.append(weekStrip());
  box.append(h('div', { class: 'grid4', style: 'margin-bottom:14px' },
    pl('lime', 'dots', 'Revisar', due, due === 1 ? 'cartão pronto' : 'cartões prontos', '#/cartoes'),
    pl('sky', 'stripes', 'Tarefas', open, open === 1 ? 'tarefa aberta' : 'tarefas abertas', '#/tarefas'),
    pl('butter', 'checks', 'Radar', dls.length ? whenLabel(daysLeft(dls[0].date)) : 'Sem prazos', dls.length ? dls[0].label.slice(0, 36) : 'Salve um edital', '#/prazos'),
    pl('ink', 'waves', 'Tuck', 'Conversar', 'Peça cartões, quiz e guias', '#/tuck', true)));

  const weak = weakTopics(topics).slice(0, 4);
  const weakCard = h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', {}, 'Pontos para melhorar')),
    weak.length ? h('div', { class: 'list' }, weak.map((x) => { const s = subs.find((y) => y.id === x.subject_id); return h('a', { class: 'item', href: '#/trilha/' + x.subject_id }, ic('target', 18), h('div', { class: 'item-t' }, h('b', {}, x.title), h('div', { class: 'muted', style: 'font-size:.8rem' }, s ? s.name : ''), h('div', { class: 'bar', style: 'height:8px;margin-top:4px' }, h('i', { style: 'width:' + Math.round(mastery(x) * 100) + '%' }))), chip(Math.round(mastery(x) * 100) + '%', 'rose')); })) : h('p', { class: 'muted' }, 'Faça licões na trilha e eu mostro aqui o que você mais precisa treinar.'));

  const subjCard = h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', {}, 'Suas pastas'), h('a', { class: 'link', href: '#/pastas' }, 'Ver todas')),
    subs.length ? h('div', { class: 'list' }, subs.slice(0, 5).map((s) => { const p = progressOf(topics.filter((x) => x.subject_id === s.id)); return h('a', { class: 'item', href: '#/pasta/' + s.id }, ic('folder', 18), h('div', { class: 'item-t' }, h('b', {}, s.name), h('div', { class: 'bar', style: 'height:8px;margin-top:4px' }, h('i', { style: 'width:' + p.pct + '%' }))), chip(p.pct + '%', 'blue')); })) : empty('Nenhuma pasta', 'Crie a primeira para ver o progresso aqui.', h('a', { class: 'btn primary', href: '#/pastas' }, 'Criar pasta')));

  const dlCard = h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', {}, 'Próximos prazos'), h('a', { class: 'link', href: '#/prazos' }, 'Ver todos')),
    dls.length ? h('div', { class: 'feed' }, dls.map((d) => { const n = daysLeft(d.date); return h('a', { class: 'feed-i', href: '#/prazos' }, h('span', { class: 'feed-ic' }, icon('calendar', 16)), h('div', { class: 'feed-b' }, h('b', {}, d.label), h('span', { class: 'muted' }, d.edital)), chip(whenLabel(n), n <= 3 ? 'rose' : 'blue')); })) : h('p', { class: 'muted' }, 'Salve um edital para ver os prazos aqui.'));

  box.append(h('div', { class: 'home-grid' }, h('div', { class: 'col' }, missionsCard(), weakCard, heatCard()), h('div', { class: 'col' }, subjCard, dlCard)));
  box.append(h('section', { style: 'margin-top:18px' }, h('h3', { class: 'panel-title' }, 'Ferramentas'), toolGrid()));
}
