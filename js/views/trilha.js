import { sb, h, store, toast, addXp, openModal, empty } from '../core.js';
import { ic } from '../icons.js';
import { gate, refresh } from '../ui.js';
import { callAI } from '../api.js';
import { loadSubjects, loadTopics, mastery, stars, isDone, progressOf, sourcesText, blocksFrom, insertPage, findOrCreateDeck } from '../data.js';
import { createTuck, burst } from '../tuck.js';
import { runLesson } from './quiz.js';
import { openCreateSubject } from './pastas.js';
import { sfx } from '../sfx.js';

const OFF = [0, 46, 76, 46, 0, -46, -76, -46];

async function startLesson(sub, t) {
  toast('O Tuck está preparando a lição…');
  try {
    const text = await sourcesText(sub.id);
    const r = await callAI({ action: 'lesson', subject: sub.name, topic: t.title, text, weak: t.weak || [] });
    runLesson({ title: t.title, intro: r.intro, questions: r.questions, topic: t, subject: sub, onDone: refresh });
  } catch (e) { toast(e.message, 'err'); sfx.oops(); }
}

async function genCards(sub, t, btn) {
  btn.disabled = true;
  try {
    const text = await sourcesText(sub.id);
    const r = await callAI({ action: 'flashcards', topic: t.title, subject: sub.name, text, count: 10, weak: t.weak || [] });
    const deckId = await findOrCreateDeck('Cartões — ' + t.title, sub.id);
    if (!deckId) throw new Error('Não foi possível criar o baralho.');
    await sb.from('flashcards').insert(r.cards.map((c) => ({ deck_id: deckId, front: c.front, back: c.back })));
    sfx.magic(); toast(r.cards.length + ' cartões criados.', 'ok');
  } catch (e) { toast(e.message, 'err'); }
  btn.disabled = false;
}
async function genSummary(sub, t, btn) {
  btn.disabled = true;
  try {
    const text = await sourcesText(sub.id);
    const r = await callAI({ action: 'page', kind: 'summary', topic: t.title, subject: sub.name, text });
    const id = await insertPage({ title: r.titulo, blocks: blocksFrom(r.titulo, r.blocos), subject_id: sub.id });
    if (id) { sfx.magic(); location.hash = '#/pagina/' + id; }
  } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
}

function openTopic(sub, t) {
  let close = () => {};
  const m = Math.round(mastery(t) * 100), s = stars(t);
  const starRow = h('div', { class: 'tstars', style: 'justify-content:flex-start' }, [1, 2, 3].map((i) => h('span', { class: i <= s ? '' : 'off' }, ic('star', 22))));
  const lesson = gate(h('button', { class: 'btn primary block big', onclick: () => { close(); startLesson(sub, t); } }, ic('target', 18), 'Começar lição'));
  const cards = gate(h('button', { class: 'btn block', onclick: (e) => genCards(sub, t, e.currentTarget) }, ic('cards', 16), 'Gerar cartões deste tópico'));
  const sum = gate(h('button', { class: 'btn block', onclick: (e) => { close(); genSummary(sub, t, e.currentTarget); } }, ic('file', 16), 'Criar resumo'));
  const manual = h('button', { class: 'btn block', onclick: async () => { await sb.from('topics').update({ status: isDone(t) && t.status === 'done' ? 'open' : 'done' }).eq('id', t.id); close(); sfx.pop(); refresh(); } }, t.status === 'done' ? 'Reabrir tópico' : 'Marcar como estudado');
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, t.title), starRow,
    h('div', { class: 'bar' }, h('i', { style: 'width:' + m + '%' })),
    h('p', { class: 'muted' }, t.total ? 'Você acertou ' + t.correct + ' de ' + t.total + ' questões (domínio ' + m + '%).' : 'Ainda sem prática neste tópico.'),
    (t.weak || []).length ? h('div', {}, h('div', { class: 'field' }, 'Para reforçar'), h('div', { class: 'wk', style: 'margin-top:6px' }, t.weak.map((w) => h('span', { class: 'chip rose' }, w)))) : null,
    lesson, cards, sum, manual));
}

export async function renderTrilha(box, arg) {
  const subs = await loadSubjects();
  if (!subs.length) {
    box.append(empty('Sua trilha começa numa pasta', 'Crie uma pasta para o que você quer aprender (ENEM, Biologia, Fuvest...).', h('button', { class: 'btn primary', onclick: () => openCreateSubject((s) => { location.hash = '#/trilha/' + s.id; }) }, 'Criar pasta')));
    return;
  }
  const sub = subs.find((s) => s.id === arg) || subs.find((s) => s.id === store.get('eduquack.subject', null)) || subs[0];
  store.set('eduquack.subject', sub.id);
  const topics = await loadTopics(sub.id);
  const p = progressOf(topics);

  box.append(h('div', { class: 'subchips' }, subs.map((s) => h('a', { class: 'cmd-chip' + (s.id === sub.id ? ' on' : ''), href: '#/trilha/' + s.id }, s.name)), h('button', { class: 'cmd-chip', onclick: () => openCreateSubject((s) => { location.hash = '#/trilha/' + s.id; }) }, '+ Nova pasta')));
  box.append(h('section', { class: 'subj tone' + (sub.tone % 5), style: 'margin-bottom:6px' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', { style: 'font-size:1.6rem;font-weight:600' }, sub.name), h('a', { class: 'btn sm', href: '#/pasta/' + sub.id }, 'Ver pasta')),
    h('div', { class: 'bar' }, h('i', { style: 'width:' + p.pct + '%' })),
    h('small', {}, topics.length ? p.pct + '% concluído · faltam ' + (p.total - p.done) + ' de ' + p.total + ' tópicos' : 'Sem tópicos ainda')));
  if (!topics.length) { box.append(empty('Esta trilha está vazia', 'Adicione tópicos na pasta (ou peça ao Tuck no Plus).', h('a', { class: 'btn primary', href: '#/pasta/' + sub.id }, 'Adicionar tópicos'))); return; }

  const cur = topics.findIndex((t) => !isDone(t));
  const trail = h('div', { class: 'trail' });
  let slot = 0;
  const addNode = (el, ox) => { el.style.setProperty('--ox', ox + 'px'); trail.append(el); };
  topics.forEach((t, i) => {
    const ox = OFF[slot % OFF.length]; slot++;
    const state = isDone(t) ? 'done' : i === cur ? 'cur' : 'lock';
    const s = stars(t);
    const btn = h('button', { class: 'tbtn', 'aria-label': t.title, onclick: () => openTopic(sub, t) }, ic(state === 'done' ? 'check' : state === 'cur' ? 'star' : 'lock', 30));
    const node = h('div', { class: 'tnode ' + state }, state === 'cur' ? h('div', { class: 'tring', style: '--p:' + Math.round(mastery(t) * 100) }) : null, state === 'cur' ? h('div', { class: 'tstart' }, 'COMEÇAR') : null, btn,
      h('div', { class: 'tlabel' }, t.title, state === 'done' || t.total ? h('div', { class: 'tstars' }, [1, 2, 3].map((k) => h('span', { class: k <= s ? '' : 'off' }, ic('star', 12)))) : null));
    if (state === 'cur') {
      const tuck = createTuck({ size: 104 });
      tuck.setMood('read');
      node.append(h('div', { class: 'tkri ' + (ox >= 0 ? 'l' : 'r') }, tuck.el));
    }
    addNode(node, ox);
    if ((i + 1) % 4 === 0 && i < topics.length - 1) {
      const key = 'eduquack.chest.' + t.id;
      const ready = topics.slice(i - 3, i + 1).every(isDone);
      const claimed = store.get(key, false);
      const cb = h('button', { class: 'tbtn', 'aria-label': 'Baú de recompensa', onclick: (e) => {
        if (!ready) { toast('Conclua os 4 tópicos anteriores para abrir o baú.'); sfx.oops(); return; }
        if (claimed) { toast('Você já abriu este baú.'); return; }
        store.set(key, true); addXp(20); sfx.mission(); const r = e.currentTarget.getBoundingClientRect(); burst(r.left + 38, r.top + 30, 40); refresh();
      } }, ic('chest', 30));
      const cn = h('div', { class: 'tnode chest' + (claimed ? ' open' : '') }, cb);
      slot++;
      addNode(cn, OFF[slot % OFF.length]);
    }
  });
  box.append(trail);
}
