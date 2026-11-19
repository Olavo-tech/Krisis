import { sb, state, h, store, addXp, toast } from '../core.js';
import { createKri, burst, MASCOT } from '../mascot.js';
import { sfx, haptic } from '../sfx.js';

const GOALS = ['ENEM', 'Fuvest', 'Unicamp', 'Outro vestibular', 'Concurso público', 'Só quero me organizar'];
const TIMES = ['30 minutos', '1 hora', '2 horas', '3 horas ou mais'];

// Boas-vindas em 3 toques: objetivo, data da prova e tempo por dia. Cria a tarefa da prova sozinho.
export function startOnboarding(name) {
  if (!state.user) return;
  const key = 'krisis.onb.' + state.user.id;
  if (store.get(key, false)) return;
  const kri = createKri({ size: 130 });
  kri.locked = true;
  const data = { goal: '', date: '', time: '' };
  let step = 0;
  const bar = h('i', {});
  const body = h('div', { class: 'ls-body' });
  const foot = h('div', { class: 'ls-foot' });
  const skip = h('button', { class: 'btn sm', type: 'button' }, 'Pular');
  const ov = h('div', { class: 'lesson', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'ls-top' }, h('div', { class: 'bar grow' }, bar), skip), body, foot);
  const done = () => { store.set(key, true); kri.destroy(); ov.remove(); };
  skip.addEventListener('click', done);

  const chips = (list, onPick, cur) => h('div', { class: 'ob-chips' }, list.map((t) => {
    const b = h('button', { class: 'ob-chip' + (cur === t ? ' on' : ''), type: 'button' }, t);
    b.addEventListener('click', () => { sfx.pop(); haptic(10); kri.setMood('happy', 800); onPick(t); });
    return b;
  }));
  const next = () => { step++; draw(); };

  function draw() {
    bar.style.width = Math.round(step / 3 * 100) + '%';
    foot.replaceChildren();
    if (step === 0) {
      sfx.hello();
      body.replaceChildren(h('div', { class: 'ls-kri' }, kri.el), h('h2', { class: 'ls-q' }, 'Oi, ' + name + '! Eu sou o ' + MASCOT + '.'), h('p', { class: 'lead' }, 'Vou montar seu espaço em 3 toques. Qual é o seu objetivo?'),
        chips(GOALS, (t) => { data.goal = t; setTimeout(next, 350); }, data.goal));
    } else if (step === 1) {
      const date = h('input', { class: 'input', type: 'date', 'aria-label': 'Data da prova' });
      date.value = data.date;
      const go = h('button', { class: 'btn green block big' }, 'Continuar');
      go.addEventListener('click', () => { data.date = date.value; next(); });
      const unk = h('button', { class: 'btn block' }, 'Ainda não sei');
      unk.addEventListener('click', () => { data.date = ''; next(); });
      body.replaceChildren(h('div', { class: 'ls-kri' }, kri.el), h('h2', { class: 'ls-q' }, 'Quando é a prova?'), h('p', { class: 'lead' }, 'Com a data, eu crio a tarefa e o lembrete para você.'), date);
      foot.replaceChildren(go, h('div', { style: 'height:8px' }), unk);
    } else if (step === 2) {
      body.replaceChildren(h('div', { class: 'ls-kri' }, kri.el), h('h2', { class: 'ls-q' }, 'Quanto tempo você estuda por dia?'), h('p', { class: 'lead' }, 'Sem pressão. Dá para mudar depois.'),
        chips(TIMES, (t) => { data.time = t; setTimeout(next, 350); }, data.time));
    } else finish();
  }

  async function finish() {
    bar.style.width = '100%';
    store.set('krisis.goal', data);
    if (data.date) {
      await sb.from('tasks').insert({ title: ('Prova: ' + (data.goal || 'vestibular')).slice(0, 300), due_at: new Date(data.date + 'T12:00:00').toISOString(), priority: 2 });
    }
    addXp(10);
    kri.setMood('cheer', 4000);
    sfx.mission(); haptic(40);
    const r = kri.el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 50);
    const go = h('button', { class: 'btn green block big' }, 'Bora estudar!');
    go.addEventListener('click', () => { done(); toast('Tudo pronto! O ' + MASCOT + ' está com você.', 'ok'); });
    body.replaceChildren(h('div', { class: 'ls-kri' }, kri.el), h('h2', { class: 'ls-q' }, 'Tudo pronto!'),
      h('p', { class: 'lead' }, 'Objetivo: ' + (data.goal || 'organizar') + (data.time ? ' \u00b7 ' + data.time + ' por dia' : '') + (data.date ? '. Criei a tarefa da prova.' : '.') + ' Comece pelas miss\u00f5es do dia.'));
    foot.replaceChildren(go);
  }
  document.body.append(ov);
  draw();
}
