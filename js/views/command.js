import { sb, state, h, icon, toast, openModal, debounce } from '../core.js';

const MODES = [['auto', 'Automático'], ['edital', 'Edital'], ['tarefa', 'Tarefa'], ['cartao', 'Cartão'], ['busca', 'Buscar']];

function parseWhen(text) {
  let title = text, due = null;
  const now = new Date();
  const m = title.match(/\b(hoje|amanh[ãa]|depois de amanh[ãa])\b/i);
  if (m) {
    const d = new Date(now);
    const w = m[1].toLowerCase();
    d.setHours(12, 0, 0, 0);
    if (w.startsWith('amanh')) d.setDate(d.getDate() + 1); else if (w.startsWith('depois')) d.setDate(d.getDate() + 2);
    due = d;
    title = title.replace(m[0], '');
  }
  const dm = title.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dm) {
    let y = dm[3] ? Number(dm[3]) : now.getFullYear();
    if (y < 100) y += 2000;
    const d = new Date(y, Number(dm[2]) - 1, Number(dm[1]), 12);
    if (!isNaN(d.getTime())) {
      if (!dm[3] && d.getTime() < now.getTime() - 864e5) d.setFullYear(y + 1);
      due = d;
      title = title.replace(dm[0], '');
    }
  }
  title = title.replace(/\s{2,}/g, ' ').replace(/[,\-–:]\s*$/, '').trim();
  return { title, due };
}

function goEdital(text) {
  const fill = () => {
    const ta = document.querySelector('.composer textarea');
    if (!ta) return false;
    ta.value = text; ta.focus();
    return true;
  };
  if (location.hash === '#/analisar') { fill(); return; }
  location.hash = '#/analisar';
  let n = 0;
  const iv = setInterval(() => { if (fill() || ++n > 25) clearInterval(iv); }, 100);
}

export function cmdBar({ onDone } = {}) {
  let mode = 'auto';
  const done = () => { if (onDone) onDone(); };
  const input = h('input', { class: 'cmd-in', type: 'text', placeholder: 'Cole um edital, escreva "tarefa: revisar química amanhã" ou busque…', 'aria-label': 'Barra de comando', autocomplete: 'off', maxlength: '4000' });
  const res = h('div', { class: 'cmd-res' });
  const chips = h('div', { class: 'cmd-chips' }, MODES.map(([k, l]) => {
    const b = h('button', { type: 'button', class: 'cmd-chip' + (k === 'auto' ? ' on' : '') }, l);
    b.addEventListener('click', () => { mode = k; chips.querySelectorAll('.cmd-chip').forEach((c) => c.classList.toggle('on', c === b)); input.focus(); });
    return b;
  }));
  const send = h('button', { class: 'cmd-send', type: 'button', 'aria-label': 'Enviar' }, icon('send', 18));

  const detect = (v) => {
    if (mode !== 'auto') return mode;
    if (/^https?:\/\/\S+$/i.test(v) || v.length >= 160) return 'edital';
    if (/^(t|tarefa)\s*:?\s+\S/i.test(v)) return 'tarefa';
    if (/^(c|cart[aã]o)\s*:?\s+\S/i.test(v)) return 'cartao';
    return 'busca';
  };

  async function search(v) {
    const q = v.replace(/[%_,]/g, ' ').trim();
    res.replaceChildren();
    if (q.length < 2) return;
    const low = q.toLowerCase();
    const pages = state.pages.filter((p) => (p.title || '').toLowerCase().includes(low)).slice(0, 5);
    const [ed, tk] = await Promise.all([
      sb.from('editais_salvos').select('id,titulo').ilike('titulo', '%' + q + '%').limit(4),
      sb.from('tasks').select('id,title').ilike('title', '%' + q + '%').limit(4)
    ]);
    const groups = [['Páginas', pages.map((p) => [p.title || 'Sem título', '#/pagina/' + p.id, 'file'])],
      ['Editais', (ed.data || []).map((e) => [e.titulo, '#/editais', 'folder'])],
      ['Tarefas', (tk.data || []).map((t) => [t.title, '#/tarefas', 'check'])]];
    let any = false;
    groups.forEach(([name, items]) => {
      if (!items.length) return;
      any = true;
      res.append(h('div', { class: 'cmd-grp' }, name));
      items.forEach(([t, href, ic]) => res.append(h('a', { class: 'cmd-item', href, onclick: done }, icon(ic, 16), h('span', {}, t))));
    });
    if (!any) res.append(h('div', { class: 'cmd-grp' }, 'Nada encontrado. Dica: comece com "tarefa:" ou "cartão:" para criar.'));
  }
  const live = debounce(() => { const v = input.value.trim(); if (detect(v) === 'busca') search(v); else res.replaceChildren(); }, 250);
  input.addEventListener('input', live);

  async function run() {
    const v = input.value.trim();
    if (!v) return;
    const m = detect(v);
    if (m === 'edital') { goEdital(v); input.value = ''; done(); return; }
    if (m === 'tarefa') {
      const { title, due } = parseWhen(v.replace(/^(t|tarefa)\s*:?\s+/i, ''));
      if (!title) { toast('Escreva o que fazer.', 'err'); return; }
      const row = { title: title.slice(0, 300) };
      if (due) row.due_at = due.toISOString();
      const { error } = await sb.from('tasks').insert(row);
      if (error) { toast('Não foi possível criar a tarefa.', 'err'); return; }
      toast('Tarefa criada' + (due ? ' para ' + due.toLocaleDateString('pt-BR') : '') + '.', 'ok');
      input.value = ''; done(); return;
    }
    if (m === 'cartao') {
      const parts = v.replace(/^(c|cart[aã]o)\s*:?\s+/i, '').split('|');
      const front = (parts.shift() || '').trim();
      const back = parts.join('|').trim();
      if (!front || !back) { toast('Use: cartão: frente | verso', 'err'); return; }
      let deckId = null;
      const ex = await sb.from('flashcard_decks').select('id').eq('title', 'Cartões rápidos').limit(1);
      if (ex.data && ex.data[0]) deckId = ex.data[0].id;
      else { const nd = await sb.from('flashcard_decks').insert({ title: 'Cartões rápidos' }).select('id').single(); deckId = nd.data && nd.data.id; }
      if (!deckId) { toast('Não foi possível criar o baralho.', 'err'); return; }
      const { error } = await sb.from('flashcards').insert({ deck_id: deckId, front: front.slice(0, 2000), back: back.slice(0, 4000) });
      if (error) { toast('Não foi possível salvar o cartão.', 'err'); return; }
      toast('Cartão salvo em Cartões rápidos.', 'ok');
      input.value = ''; done(); return;
    }
    search(v);
  }
  send.addEventListener('click', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });

  return h('div', { class: 'cmd' }, h('div', { class: 'cmd-box glass' }, h('span', { class: 'cmd-ico' }, icon('sparkle', 20)), input, send, chips), res);
}

export function openPalette() {
  let close = () => {};
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'O que você quer fazer?'), cmdBar({ onDone: () => close() })), { wide: true });
}
