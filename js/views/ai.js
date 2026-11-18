import { sb, h, icon, toast, uid, openModal, empty } from '../core.js';
import { createPage } from './pages.js';

async function callAI(body) {
  const { data } = await sb.auth.getSession();
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.ok === false) throw new Error((j && j.message) || 'Não foi possível gerar agora. Tente de novo.');
  return j.result;
}

export function runAi(feature) {
  if (/cart/i.test(feature)) return cardsFlow();
  if (/plano/i.test(feature)) return planFlow();
  return null;
}

function cardsFlow() {
  let close = () => {};
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const name = h('input', { class: 'input', value: 'Cartões da IA', maxlength: '200' });
  const text = h('textarea', { class: 'input', rows: '8', placeholder: 'Cole aqui o resumo, a anotação ou o trecho da matéria (mín. 80 caracteres).', maxlength: '12000' });
  const count = h('select', { class: 'input' }, [5, 10, 15, 20].map((n) => h('option', { value: String(n), selected: n === 10 }, n + ' cartões')));
  const go = h('button', { class: 'btn primary' }, icon('sparkle', 16), 'Gerar cartões');
  go.addEventListener('click', async () => {
    go.disabled = true;
    msg.className = 'form-msg ok';
    msg.textContent = 'Gerando… isso leva alguns segundos.';
    try {
      const r = await callAI({ action: 'flashcards', text: text.value, count: Number(count.value) });
      const { data: dk, error: e1 } = await sb.from('flashcard_decks').insert({ title: name.value.trim() || 'Cartões da IA' }).select('id').single();
      if (e1) throw new Error('Não foi possível criar o baralho.');
      const { error: e2 } = await sb.from('flashcards').insert(r.cards.map((c) => ({ deck_id: dk.id, front: c.front, back: c.back })));
      if (e2) throw new Error('Não foi possível salvar os cartões.');
      toast(r.cards.length + ' cartões criados!', 'ok');
      close();
      if (location.hash === '#/cartoes') window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = '#/cartoes';
    } catch (e) {
      msg.className = 'form-msg err';
      msg.textContent = e.message;
      go.disabled = false;
    }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Gerar cartões com IA'),
    h('label', { class: 'field' }, 'Nome do baralho', name), h('label', { class: 'field' }, 'Material de estudo', text), h('label', { class: 'field' }, 'Quantidade', count), msg, go), { wide: true });
}

async function planFlow() {
  const { data } = await sb.from('editais_salvos').select('id,titulo,analysis').order('created_at', { ascending: false }).limit(30);
  const eds = data || [];
  let close = () => {};
  if (!eds.length) {
    close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Plano de estudos com IA'), empty('Salve um edital primeiro', 'O plano é montado a partir de um edital analisado.', h('a', { class: 'btn primary', href: '#/analisar', onclick: () => close() }, 'Analisar edital'))));
    return;
  }
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const sel = h('select', { class: 'input' }, eds.map((e, i) => h('option', { value: String(i) }, e.titulo)));
  const days = h('input', { class: 'input', type: 'number', min: '1', max: '365', value: '30' });
  const hours = h('input', { class: 'input', type: 'number', min: '0.5', max: '12', step: '0.5', value: '2' });
  const go = h('button', { class: 'btn primary' }, icon('sparkle', 16), 'Gerar plano');
  go.addEventListener('click', async () => {
    go.disabled = true;
    msg.className = 'form-msg ok';
    msg.textContent = 'Montando seu plano… isso leva alguns segundos.';
    try {
      const r = await callAI({ action: 'plan', edital: eds[Number(sel.value)].analysis, days: Number(days.value), hours: Number(hours.value) });
      const b = (t, x, c) => ({ id: uid(), t, x, c: !!c });
      const blocks = [b('h1', r.titulo)];
      if (r.resumo) blocks.push(b('quote', r.resumo));
      r.semanas.forEach((s) => {
        blocks.push(b('h2', s.titulo + (s.foco ? ' — ' + s.foco : '')));
        s.tarefas.forEach((t) => blocks.push(b('todo', t)));
      });
      if (r.dicas.length) { blocks.push(b('h2', 'Dicas')); r.dicas.forEach((t) => blocks.push(b('bul', t))); }
      const id = await createPage({ title: r.titulo, icon: '🗓️', kind: 'plano', content: blocks });
      if (!id) throw new Error('Não foi possível criar a página do plano.');
      close();
      location.hash = '#/pagina/' + id;
    } catch (e) {
      msg.className = 'form-msg err';
      msg.textContent = e.message;
      go.disabled = false;
    }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Plano de estudos com IA'),
    h('label', { class: 'field' }, 'Edital', sel),
    h('div', { class: 'row' }, h('label', { class: 'field grow' }, 'Dias até a prova', days), h('label', { class: 'field grow' }, 'Horas por dia', hours)), msg, go));
}
