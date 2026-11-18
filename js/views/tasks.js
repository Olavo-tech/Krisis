import { sb, h, icon, toast, addXp, isoDay, fmtDate, empty } from '../core.js';

export async function renderTasks(box) {
  let items = [];
  const title = h('input', { class: 'input', placeholder: 'O que você vai estudar ou fazer?', maxlength: '300', 'aria-label': 'Nova tarefa' });
  const due = h('input', { class: 'input', type: 'date', 'aria-label': 'Data' });
  const prio = h('select', { class: 'input', 'aria-label': 'Prioridade' }, h('option', { value: '1' }, 'Normal'), h('option', { value: '2' }, 'Alta'), h('option', { value: '0' }, 'Baixa'));
  const out = h('div', { class: 'stack', style: 'margin-top:16px' });

  async function load() {
    const { data } = await sb.from('tasks').select('*').order('done').order('due_at', { nullsFirst: false }).order('created_at', { ascending: false }).limit(300);
    items = data || [];
    paint();
  }
  async function add() {
    const t = title.value.trim();
    if (!t) { title.focus(); return; }
    const row = { title: t, priority: Number(prio.value) };
    if (due.value) row.due_at = new Date(due.value + 'T12:00:00').toISOString();
    const { error } = await sb.from('tasks').insert(row);
    if (error) { toast('Não foi possível criar a tarefa.', 'err'); return; }
    title.value = '';
    due.value = '';
    load();
  }
  async function toggle(t, done) {
    const { error } = await sb.from('tasks').update({ done }).eq('id', t.id);
    if (error) { toast('Não foi possível atualizar.', 'err'); return; }
    if (done) { addXp(10); toast('Tarefa concluída! +10 XP', 'ok'); }
    load();
  }
  async function remove(t) {
    const { error } = await sb.from('tasks').delete().eq('id', t.id);
    if (error) { toast('Não foi possível excluir.', 'err'); return; }
    load();
  }
  const rowEl = (t) => {
    const overdue = !t.done && t.due_at && isoDay(new Date(t.due_at)) < isoDay();
    return h('div', { class: 'item' + (t.done ? ' done' : '') },
      h('input', { type: 'checkbox', class: 'round', checked: t.done, 'aria-label': 'Concluir', onchange: (e) => toggle(t, e.target.checked) }),
      h('span', { class: 'item-t' }, t.title),
      t.priority === 2 ? h('span', { class: 'chip', style: 'background:var(--rose-soft);color:var(--rose-d)' }, 'Alta') : null,
      t.due_at ? h('span', { class: 'chip', style: overdue ? 'background:var(--rose-soft);color:var(--rose-d)' : '' }, (overdue ? 'Atrasada · ' : '') + fmtDate(t.due_at)) : null,
      h('button', { class: 'icon-btn tiny', 'aria-label': 'Excluir tarefa', onclick: () => remove(t) }, icon('trash', 15)));
  };
  function group(name, arr) {
    return arr.length ? h('section', {}, h('h3', { class: 'panel-title' }, name), h('div', { class: 'list' }, arr.map(rowEl))) : null;
  }
  function paint() {
    const today = isoDay();
    const open = items.filter((t) => !t.done);
    const now = open.filter((t) => t.due_at && isoDay(new Date(t.due_at)) <= today);
    const next = open.filter((t) => t.due_at && isoDay(new Date(t.due_at)) > today);
    const none = open.filter((t) => !t.due_at);
    const done = items.filter((t) => t.done).slice(0, 8);
    out.replaceChildren(...[group('Hoje e atrasadas', now), group('Próximas', next), group('Sem data', none), group('Concluídas', done)].filter(Boolean));
    if (!items.length) out.append(empty('Sem tarefas ainda', 'Escreva a primeira acima. Tarefas pequenas ajudam a começar.'));
  }
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  box.append(h('div', { class: 'tile row', style: 'display:flex' }, h('div', { class: 'grow', style: 'min-width:200px' }, title), h('div', { style: 'width:160px' }, due), h('div', { style: 'width:120px' }, prio), h('button', { class: 'btn green', onclick: add }, icon('plus', 16), 'Adicionar')), out);
  await load();
}
