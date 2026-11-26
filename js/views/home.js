import { h, icon, state, store, isoDay } from '../core.js';
import { guide } from './guide.js';
import { newRound, practicePool } from './exercises.js';
import { createKri } from '../mascot.js';
import { subjects, tracks } from './curriculum.js';

const button = (label, fn, cls = 'learn-primary') => h('button', { type: 'button', class: cls, onclick: fn }, label);
const link = (label, href, cls = 'learn-primary') => h('a', { class: cls, href }, label);
const levels = ['Fundamentos', 'Em desenvolvimento', 'Aplicação'];

export function renderHome(box, page) {
  const key = 'eduquack.learning.v1.' + state.user.id;
  const data = store.get(key, { exam: '', track: 'geral', minutes: 20, weak: [], answers: [], completed: {}, stage: 'goal' });
  const save = () => store.set(key, data);
  const editalUnits = store.get('eduquack.editalUnits.' + state.user.id, []);
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
    const begin = button('Ver teste de nível', () => guide('nivel', 'Descubra seu nível de conhecimento',
      'Vou usar suas respostas para escolher a matéria e a dificuldade da primeira aula. Se ainda não souber uma resposta, marque “Ainda não sei”. Aqui você não perde corações.',
      () => { data.answers = []; move('quiz'); }));
    paint(step(3, 3), title('Onde você precisa de mais prática?'),
      h('p', {}, 'Marque as matérias que quiser priorizar na prova inicial.'),
      h('div', { class: 'learn-options' }, topics().map(id =>
        h('label', { class: 'learn-option' }, h('input', { type: 'checkbox', checked: data.weak.includes(id),
          onchange: e => { data.weak = data.weak.filter(x => x !== id); if (e.target.checked) data.weak.push(id); save(); } }), subjects[id].name))),
      begin, back('time'));
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

  function itinerary(number = cycle) {
    const ordered = ranked().sort((a, b) => score(a) / totalFor(a) - score(b) / totalFor(b));
    const path = [];
    const review = [];
    for (const id of ordered) {
      subjects[id].lessons.forEach((unit, i) => {
        const baseKey = id + '-' + i;
        const item = { ...unit, id, baseKey, key: baseKey + (number > 1 ? '~' + number : '') };
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
    const roundKey = key + '.round.' + unit.key;
    const recentKey = key + '.recent.' + unit.baseKey;
    let round = store.get(roundKey, null);
    function start() {
      const previous = round?.items.map(q => q.prompt) || store.get(recentKey, []);
      round = { unit: unit.key, items: newRound(practicePool(unit), previous),
        cursor: 0, hearts: 3, selected: null };
      store.set(recentKey, round.items.map(q => q.prompt));
      persist();
    }
    function persist() { store.set(roundKey, round); }
    if (!round || round.unit !== unit.key || round.finished) start();

    function show() {
      if (round.hearts === 0) {
        paint(link('← Trilha', mapHref, 'learn-back'), title('Vamos tentar de novo?'),
          h('p', {}, 'Os três corações acabaram. Você começa com três novos corações e outras questões sobre ' + unit.title + '.'),
          button('Recomeçar atividade', () => { start(); show(); }));
        return;
      }
      const q = round.items[round.cursor];
      const answered = round.selected !== null;
      const choices = q.choices.map((choice, i) => h('button', {
        type: 'button', disabled: answered,
        class: 'learn-option' + (answered && i === q.answer ? ' correct' : answered && i === round.selected ? ' incorrect' : ''),
        onclick: () => {
          if (round.selected !== null) return;
          round.selected = i;
          if (i !== q.answer) round.hearts--;
          persist();
          if (!round.hearts) showLastError(q);
          else show();
        }
      }, choice));
      function advance() {
        if (round.cursor + 1 === round.items.length) {
          round.finished = true;
          persist();
          data.completed[unit.key] ||= isoDay();
          if (cycle === latestCycle && itinerary().every(item => data.completed[item.key])) data.cycle = latestCycle + 1;
          save();
          paint(title('Aula concluída!'), h('p', {}, unit.title), link('Continuar na trilha', '#/hoje'));
        } else {
          round.cursor++; round.selected = null; persist(); show();
        }
      }
      paint(link('← Trilha', mapHref, 'learn-back'),
        h('div', { class: 'round-stats' }, h('span', {}, 'Questão ' + (round.cursor+1) + ' de ' + round.items.length),
          h('span', { class: 'hearts', 'aria-label': round.hearts + ' de 3 corações' }, '♥'.repeat(round.hearts) + '♡'.repeat(3-round.hearts))),
        h('p', { class: 'learn-subject' }, unit.title), title(q.prompt),
        h('details', { class: 'worked-example' }, h('summary', {}, 'Relembrar o tema'), h('p', {}, unit.text), unit.example ? h('p', {}, unit.example) : null),
        h('div', { class: 'learn-options' }, choices),
        answered ? h('div', { class: 'learn-feedback', role: 'status' },
          h('b', {}, round.selected === q.answer ? 'Resposta certa!' : 'Resposta correta: ' + q.choices[q.answer]),
          h('p', {}, q.why), button(round.cursor + 1 === round.items.length ? 'Concluir aula' : 'Próxima questão', advance)) : null);
    }
    function showLastError(q) {
      paint(title('Os três corações acabaram'), h('p', {}, 'Resposta correta: ' + q.choices[q.answer]),
        h('p', {}, q.why), button('Recomeçar com outras questões', () => { start(); show(); }), link('Voltar à trilha', mapHref, 'learn-back'));
    }
    show();
  }

  function map() {
    const units = itinerary();
    const next = units.find(unit => !data.completed[unit.key]);
    const today = Object.values(data.completed).filter(date => date === isoDay()).length;
    const daily = Math.max(1, Math.floor(data.minutes / 10));
    const openUnit = (unit, child, cls) => h('a', { href: '#/hoje/' + unit.key, class: cls,
      onclick: e => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        guide('atividade', 'Quatro questões, três corações',
          'Responda uma vez e leia a explicação antes de avançar. Se os corações acabarem, você poderá tentar outras questões do mesmo tema.',
          () => { location.hash = '#/hoje/' + unit.key; });
      }
    }, child);
    const nodes = [...units, ...editalUnits].map((unit, i) => {
      const done = Boolean(data.completed[unit.key]);
      const active = unit === next;
      const name = unit.name || subjects[unit.id].name;
      return h('li', { class: 'course-stop stop-' + (i % 4), 'aria-current': active ? 'step' : null },
        openUnit(unit, [
          h('span', { class: 'unit-token' }, icon(done ? 'check' : unit.questions ? 'book' : subjects[unit.id].icon, 28)),
          h('span', { class: 'unit-text' }, h('small', {}, done ? 'Concluída' : name), h('b', {}, unit.title))
        ], 'course-unit' + (active ? ' next' : '') + (done ? ' complete' : '')));
    });
    const gate = h('li', { class: 'course-gate' }, h('div', { class: 'work-stripe', 'aria-hidden': 'true' }),
      h('b', {}, editalUnits.length ? 'Mais matérias do edital' : 'Ramo do edital bloqueado'),
      h('p', {}, 'Escolha um edital salvo e toque em “Gerar aula deste edital”.'),
      link(editalUnits.length ? 'Gerar outra aula do edital' : 'Escolher edital para desbloquear', '#/editais'));
    const scroll = h('div', { class: 'course-scroll', tabindex: '0', role: 'region', 'aria-label': 'Trilha de baixo para cima' },
      h('ol', { class: 'course-map' }, nodes, gate));
    paint(h('header', { class: 'course-cover' }, h('div', {},
      h('p', {}, data.exam), title('Minha trilha'), h('p', {}, data.minutes + ' min por dia · ' + Math.min(today, daily) + '/' + daily + ' aulas hoje'),
      next ? openUnit(next, 'Continuar aula ↑', 'learn-primary') : link('Abrir próximo ciclo ↑', '#/hoje/ciclo-' + (cycle+1))),
      createKri({ size: 105 }).el),
      h('h2', { class: 'course-heading' }, 'Ciclo ' + cycle + ' · Suba pela trilha'), scroll,
      cycle > 1 ? link('Ver ciclo anterior', '#/hoje/ciclo-' + (cycle-1), 'learn-back') : null);
    requestAnimationFrame(() => {
      const active = scroll.querySelector('.next') || scroll.querySelector('.course-unit');
      if (active) scroll.scrollTop += active.getBoundingClientRect().bottom - scroll.getBoundingClientRect().bottom + 18;
    });
  }

  function draw() {
    if (data.stage === 'ready') {
      const unit = [...itinerary(), ...editalUnits].find(item => item.key === page);
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
  const currentCycle = data.cycle || 1;
  // Contas anteriores guardavam as conclusões, mas não o número do ciclo.
  if (data.stage === 'ready' && itinerary(currentCycle).every(unit => data.completed[unit.key])) {
    data.cycle = currentCycle + 1;
    save();
  }
  const latestCycle = data.cycle || currentCycle;
  const requestedCycle = Number(page?.match(/(?:^ciclo-|~)([1-9][0-9]*)$/)?.[1] || (page && /^(leitura|numeros|logica|ciencias|cidadania)-[01]$/.test(page) ? 1 : latestCycle));
  const cycle = Math.max(1, Math.min(latestCycle, requestedCycle));
  const mapHref = '#/hoje/ciclo-' + cycle;

  draw();
}
