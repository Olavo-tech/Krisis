import { h, icon, state, store, isoDay } from '../core.js';
import { openPlus } from './plus.js';
import { createKri } from '../mascot.js';
import { subjects, tracks } from './curriculum.js';

const button = (label, fn, cls = 'learn-primary') => h('button', { type: 'button', class: cls, onclick: fn }, label);
const link = (label, href, cls = 'learn-primary') => h('a', { class: cls, href }, label);
const levels = ['Fundamentos', 'Em desenvolvimento', 'Aplicação'];

export function renderHome(box, page) {
  const key = 'eduquack.learning.v1.' + state.user.id;
  const data = store.get(key, { exam: '', track: 'geral', minutes: 20, weak: [], answers: [], completed: {}, stage: 'goal' });
  const save = () => store.set(key, data);
  const topics = () => tracks[data.track].subjects;
  const ranked = () => [...topics()].sort((a, b) => Number(data.weak.includes(b)) - Number(data.weak.includes(a)));
  const questions = () => ranked().flatMap(id => subjects[id].test.slice(0, data.weak.includes(id) ? 3 : 2).map((q, index) => ({ ...q, id, index })));
  const score = id => questions().reduce((n, q, i) => n + Number(q.id === id && data.answers[i] === q.answer), 0);
  const totalFor = id => questions().filter(q => q.id === id).length;
  const levelFor = id => score(id) === totalFor(id) ? 2 : Number(score(id) > 0);
  const paint = (...children) => {
    box.replaceChildren(h('div', { class: 'learning' }, ...children));
    window.scrollTo(0, 0);
    box.querySelector('h1')?.focus({ preventScroll: true });
  };
  const title = text => h('h1', { tabindex: '-1' }, text);
  const step = (i, total) => h('div', { class: 'learn-progress' }, h('span', {}, 'Etapa ' + i + ' de ' + total),
    h('progress', { max: total, value: i, 'aria-label': 'Configuração da trilha' }));
  const move = stage => { data.stage = stage; save(); draw(); };
  const back = stage => button('Voltar', () => move(stage), 'learn-back');

  function goal() {
    const name = h('input', { class: 'input', maxlength: 120, required: true, value: data.exam, placeholder: 'Ex.: INSS, TJSP ou ENEM' });
    const area = h('select', { class: 'input' }, Object.entries(tracks).map(([id, track]) => h('option', { value: id, selected: id === data.track }, track.name)));
    const update = () => {
      if (!name.value.trim()) { name.focus(); return; }
      data.exam = name.value.trim();
      if (data.track !== area.value) data.weak = [];
      data.track = area.value;
      move('time');
    };
    paint(step(1, 3), title('Qual prova você quer fazer?'),
      h('form', { class: 'learn-form', onsubmit: e => { e.preventDefault(); update(); } },
        h('label', {}, 'Nome da prova', name), h('label', {}, 'Área de preparação', area),
        h('button', { class: 'learn-primary', type: 'submit' }, 'Continuar')));
  }

  function time() {
    paint(step(2, 3), title('Quanto tempo cabe no seu dia?'),
      h('p', {}, 'Escolha uma meta diária para as suas aulas.'),
      h('div', { class: 'learn-options' }, [10, 20, 30, 45, 60].map(n =>
        button(n + ' minutos', () => { data.minutes = n; move('weak'); }, 'learn-option'))), back('goal'));
  }

  function weakness() {
    paint(step(3, 3), title('Onde você precisa de mais prática?'),
      h('p', {}, 'Marque as matérias que quiser priorizar na prova inicial.'),
      h('div', { class: 'learn-options' }, topics().map(id =>
        h('label', { class: 'learn-option' }, h('input', { type: 'checkbox', checked: data.weak.includes(id),
          onchange: e => { data.weak = data.weak.filter(x => x !== id); if (e.target.checked) data.weak.push(id); save(); } }), subjects[id].name))),
      button('Começar prova de ' + questions().length + ' questões', () => { data.answers = []; move('quiz'); }), back('time'));
  }

  function quiz() {
    const qs = questions();
    const index = data.answers.length;
    const q = qs[index];
    if (!q) { move('result'); return; }
    paint(h('div', { class: 'learn-progress' }, h('span', {}, 'Questão ' + (index + 1) + ' de ' + qs.length),
      h('progress', { value: index, max: qs.length, 'aria-label': 'Prova inicial' })),
      h('p', { class: 'learn-subject' }, subjects[q.id].name), title(q.prompt),
      h('div', { class: 'learn-options' }, [...q.choices, 'Ainda não sei'].map((choice, i) =>
        button(choice, () => { data.answers.push(i); save(); quiz(); }, 'learn-option'))));
  }

  function itinerary() {
    const ordered = ranked().sort((a, b) => score(a) / totalFor(a) - score(b) / totalFor(b));
    const path = [];
    const review = [];
    for (const id of ordered) {
      subjects[id].lessons.forEach((unit, i) => {
        const item = { ...unit, id, key: id + '-' + i };
        if (i === 0 && levelFor(id) === 2) review.push(item);
        else path.push(item);
      });
    }
    return [...path, ...review];
  }

  function result() {
    const first = itinerary()[0];
    paint(h('p', { class: 'learn-subject' }, 'Resultado da prova inicial'), title('Seu ponto de partida'),
      h('p', {}, 'Sua primeira aula será “' + first.title + '”. A ordem considera seus acertos e as dificuldades que você marcou.'),
      h('ul', { class: 'level-list' }, topics().map(id => h('li', {}, h('b', {}, subjects[id].name), h('span', {}, levels[levelFor(id)] + ' · ' + score(id) + '/' + totalFor(id))))),
      button('Ver minha trilha', () => { move('ready'); if (page) location.hash = '#/hoje'; }));
  }

  function lesson(unit) {
    const q = unit.practice;
    const feedback = h('div', { class: 'learn-feedback', role: 'status' });
    const choices = h('div', { class: 'learn-options' }, q.choices.map((choice, i) => button(choice, () => {
      if (i !== q.answer) {
        feedback.replaceChildren(h('b', {}, 'Tente outra resposta'), h('p', {}, q.why));
        return;
      }
      if (!data.completed[unit.key]) data.completed[unit.key] = isoDay();
      save();
      choices.querySelectorAll('button').forEach(b => { b.disabled = true; });
      feedback.replaceChildren(h('b', {}, 'Resposta certa!'), h('p', {}, q.why), link('Voltar à trilha', '#/hoje'));
    }, 'learn-option')));
    paint(link('← Trilha', '#/hoje', 'learn-back'), h('p', { class: 'learn-subject' }, subjects[unit.id].name),
      title(unit.title), h('p', {}, unit.text), h('aside', { class: 'worked-example' }, h('b', {}, 'Exemplo'), h('p', {}, unit.example)),
      h('h2', {}, q.prompt), choices, feedback);
  }

  function map() {
    const units = itinerary();
    const next = units.find(unit => !data.completed[unit.key]);
    const today = units.filter(unit => data.completed[unit.key] === isoDay()).length;
    const daily = Math.min(units.length, Math.max(1, Math.floor(data.minutes / 10)));
    const nodes = units.map((unit, i) => {
      const done = Boolean(data.completed[unit.key]);
      const active = unit === next;
      return h('li', { class: 'course-stop stop-' + (i % 4) }, h('a', {
        href: '#/hoje/' + unit.key, class: 'course-unit' + (active ? ' next' : '') + (done ? ' complete' : ''),
        'aria-current': active ? 'step' : null
      }, h('span', { class: 'unit-token' }, icon(done ? 'check' : subjects[unit.id].icon, 28)),
      h('span', { class: 'unit-text' }, h('small', {}, done ? 'Concluída' : subjects[unit.id].name), h('b', {}, unit.title))));
    });
    paint(h('header', { class: 'course-cover' }, h('div', {},
      h('p', {}, data.exam), title('Minha trilha'), h('p', {}, data.minutes + ' min por dia · ' + Math.min(today, daily) + '/' + daily + ' aulas hoje'),
      next ? link('Continuar aula →', '#/hoje/' + next.key) : h('b', {}, 'Percurso inicial concluído')),
      createKri({ size: 105 }).el),
      h('h2', { class: 'course-heading' }, 'Percurso inicial'), h('ol', { class: 'course-map' }, nodes),
      !next ? h('section', { class: 'worked-example' }, h('h2', {}, 'Continue com o seu edital'),
        h('p', {}, 'Abra o edital da sua prova para consultar as disciplinas e montar o próximo plano.'),
        button('Montar plano do edital', () => openPlus('Plano de estudos por edital')),
        link('Abrir meus editais', '#/editais', 'learn-back')) : null);
  }

  function draw() {
    if (data.stage === 'ready') {
      const unit = itinerary().find(item => item.key === page);
      if (page === 'configurar') {
        paint(title('Ajustar minha trilha'), h('p', {}, 'Uma nova prova inicial reorganiza as aulas. As aulas concluídas ficam salvas.'),
          button('Reconfigurar percurso', () => { data.answers = []; move('goal'); }), link('Voltar à trilha', '#/hoje', 'learn-back'));
      } else if (unit) lesson(unit);
      else map();
    } else {
      const screens = { goal, time, weak: weakness, quiz, result };
      (screens[data.stage] || goal)();
    }
  }
  draw();
}
