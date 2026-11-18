import { sb, state, h, icon, pageIcon, PAGE_ICONS, toast, uid, debounce, openModal, confirmBox, addXp, empty } from '../core.js';

const b = (t, x = '', c = false) => ({ id: uid(), t, x, c });

const TEMPLATES = [
  { e: 'file', name: 'Página em branco', desc: 'Comece do zero.', kind: 'page', blocks: () => [b('p', '')] },
  { e: 'calendar', name: 'Plano semanal', desc: 'Metas por dia e revisão no fim de semana.', kind: 'plano', blocks: () => {
    const out = [b('h1', 'Plano semanal'), b('quote', 'Uma meta clara por dia. Marque ao concluir.')];
    ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].forEach((d) => out.push(b('h2', d), b('todo', 'Estudar (45 min)'), b('todo', 'Resolver 10 questões')));
    out.push(b('h2', 'Fim de semana'), b('todo', 'Revisar cartões'), b('todo', 'Simulado curto'), b('h2', 'Como foi a semana?'), b('p', ''));
    return out;
  } },
  { e: 'flag', name: 'Checklist do edital', desc: 'Datas, documentos e etapas sem perder prazo.', kind: 'edital', blocks: () => [
    b('h1', 'Checklist do edital'), b('h2', 'Datas'), b('todo', 'Inscrição até: '), b('todo', 'Isenção da taxa até: '), b('todo', 'Data da prova: '),
    b('h2', 'Documentos'), b('todo', 'Documento de identidade'), b('todo', 'Comprovante de pagamento'), b('h2', 'Anotações'), b('p', '')] },
  { e: 'target', name: 'Caderno de erros', desc: 'Registre a questão, o erro e a correção.', kind: 'caderno', blocks: () => [
    b('h1', 'Caderno de erros'), b('quote', 'Errar aqui custa menos do que errar na prova.'), b('h2', 'Questão'), b('p', ''), b('h2', 'Por que errei'), b('bul', ''), b('h2', 'Como resolver certo'), b('p', '')] },
  { e: 'book', name: 'Resumo de matéria', desc: 'Conceitos, fórmulas e exemplos.', kind: 'page', blocks: () => [
    b('h1', 'Resumo de matéria'), b('h2', 'Conceitos principais'), b('bul', ''), b('h2', 'Fórmulas e regras'), b('bul', ''), b('h2', 'Exemplo resolvido'), b('p', '')] }
];

export async function loadPages() {
  const { data, error } = await sb.from('pages').select('id,parent_id,title,icon,kind,position,updated_at').eq('is_archived', false).order('position').order('created_at');
  state.pages = error ? [] : (data || []);
  return state.pages;
}

export function renderTree(el, activeId) {
  el.replaceChildren();
  const by = new Map();
  state.pages.forEach((p) => { const k = p.parent_id || 'root'; if (!by.has(k)) by.set(k, []); by.get(k).push(p); });
  if (!state.pages.length) el.append(h('p', { class: 'tree-empty' }, 'Crie sua primeira página.'));
  const draw = (parent, depth) => {
    (by.get(parent) || []).forEach((p) => {
      el.append(h('a', { class: 'tree-row' + (p.id === activeId ? ' active' : ''), href: '#/pagina/' + p.id, style: 'padding-left:' + (10 + depth * 14) + 'px' },
        pageIcon(p.icon, 16), h('span', { class: 'tree-name' }, p.title || 'Sem título'),
        h('button', { class: 'icon-btn tiny', title: 'Nova subpágina', 'aria-label': 'Nova subpágina', onclick: (e) => { e.preventDefault(); e.stopPropagation(); newPageModal(p.id); } }, icon('plus', 14))));
      draw(p.id, depth + 1);
    });
  };
  draw('root', 0);
}

export async function createPage({ title = 'Sem título', icon: ic = 'file', kind = 'page', parent_id = null, content = [] } = {}) {
  const safe = PAGE_ICONS.includes(ic) ? ic : 'file';
  const { data, error } = await sb.from('pages').insert({ title, icon: safe, kind, parent_id, content, position: state.pages.length }).select('id').single();
  if (error) { toast('Não foi possível criar a página.', 'err'); return null; }
  document.dispatchEvent(new CustomEvent('krisis:pages'));
  return data.id;
}

export function newPageModal(parentId) {
  let close = () => {};
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, parentId ? 'Nova subpágina' : 'Nova página'),
    h('p', { class: 'muted' }, 'Escolha um modelo para começar.'),
    h('div', { class: 'tpl-grid' }, TEMPLATES.map((t) => h('button', { class: 'tile tpl', onclick: async () => {
      const id = await createPage({ title: t.name === 'Página em branco' ? 'Sem título' : t.name, icon: t.e, kind: t.kind, parent_id: parentId, content: t.blocks() });
      if (id) { close(); location.hash = '#/pagina/' + id; }
    } }, pageIcon(t.e, 26), t.name, h('small', {}, t.desc))))), { wide: true });
}

let pendingFlush = null;
export function flushPage() { if (pendingFlush) pendingFlush(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) flushPage(); });

function closeMenu() { const m = document.getElementById('blkMenu'); if (m) m.remove(); }
function placeMenu(menu, anchor) {
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = (r.bottom + window.scrollY + 6) + 'px';
  menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 240)) + 'px';
  setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 0);
}

// Transforma um bloco em cartão de revisão (baralho "Cartões das páginas")
function toCard(frontText, backText) {
  let close = () => {};
  const front = h('textarea', { class: 'input', rows: '2', maxlength: '2000', 'aria-label': 'Frente' });
  const back = h('textarea', { class: 'input', rows: '3', maxlength: '4000', placeholder: 'Resposta (verso do cartão)', 'aria-label': 'Verso' });
  front.value = frontText; back.value = backText;
  const go = h('button', { class: 'btn primary' }, icon('cards', 16), 'Salvar cartão');
  go.addEventListener('click', async () => {
    if (!front.value.trim() || !back.value.trim()) { toast('Preencha frente e verso.', 'err'); return; }
    go.disabled = true;
    let deckId = null;
    const ex = await sb.from('flashcard_decks').select('id').eq('title', 'Cartões das páginas').limit(1);
    if (ex.data && ex.data[0]) deckId = ex.data[0].id;
    else { const nd = await sb.from('flashcard_decks').insert({ title: 'Cartões das páginas' }).select('id').single(); deckId = nd.data && nd.data.id; }
    const { error } = deckId ? await sb.from('flashcards').insert({ deck_id: deckId, front: front.value.trim(), back: back.value.trim() }) : { error: true };
    if (error) { toast('Não foi possível salvar o cartão.', 'err'); go.disabled = false; return; }
    addXp(5);
    toast('Cartão salvo em Cartões das páginas.', 'ok');
    close();
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Virar cartão'), h('label', { class: 'field' }, 'Frente', front), h('label', { class: 'field' }, 'Verso', back), go));
}

export async function renderPage(box, id) {
  const { data: page, error } = await sb.from('pages').select('*').eq('id', id).maybeSingle();
  if (error || !page) { box.append(empty('Página não encontrada', 'Ela pode ter sido excluída.', h('a', { class: 'btn primary', href: '#/hoje' }, 'Voltar ao início'))); return; }
  let blocks = Array.isArray(page.content) && page.content.length ? page.content : [b('p', '')];
  let title = page.title;
  let ic = PAGE_ICONS.includes(page.icon) ? page.icon : 'file';
  let metaDirty = false;
  const status = h('span', { class: 'save-state' }, 'Salvo');

  const save = debounce(async () => {
    status.textContent = 'Salvando…';
    const { error: er } = await sb.from('pages').update({ title, icon: ic, content: blocks }).eq('id', id);
    status.textContent = er ? 'Erro ao salvar' : 'Salvo';
    if (!er && metaDirty) { metaDirty = false; document.dispatchEvent(new CustomEvent('krisis:pages')); }
  }, 800);
  pendingFlush = save.flush;
  const touch = () => { status.textContent = 'Editando…'; save(); };

  const list = h('div', { class: 'blocks' });
  const fit = (t) => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
  function focusAt(i, atStart) {
    const t = list.querySelectorAll('textarea')[i];
    if (!t) return;
    t.focus();
    const n = atStart ? 0 : t.value.length;
    t.setSelectionRange(n, n);
  }
  function paint(focus, atStart) {
    list.replaceChildren(...blocks.map(row));
    requestAnimationFrame(() => { list.querySelectorAll('textarea').forEach(fit); if (focus != null) focusAt(focus, atStart); });
  }
  function typeMenu(i, anchor) {
    closeMenu();
    const types = [['p', 'Texto'], ['h1', 'Título grande'], ['h2', 'Subtítulo'], ['bul', 'Lista'], ['todo', 'Tarefa'], ['quote', 'Citação']];
    const menu = h('div', { class: 'menu glass', id: 'blkMenu' },
      types.map(([t, l]) => h('button', { class: 'menu-item', onclick: () => { if (blocks[i].x === '/') blocks[i].x = ''; blocks[i].t = t; closeMenu(); paint(i); touch(); } }, l)),
      blocks[i].x && blocks[i].x !== '/' ? h('button', { class: 'menu-item', onclick: () => { closeMenu(); toCard(blocks[i].x, blocks[i + 1] ? blocks[i + 1].x : ''); } }, 'Virar cartão') : null,
      h('button', { class: 'menu-item danger', onclick: () => { closeMenu(); if (blocks.length > 1) blocks.splice(i, 1); else blocks[0] = b('p', ''); paint(Math.max(0, i - 1)); touch(); } }, 'Excluir bloco'));
    placeMenu(menu, anchor);
  }
  function row(bl, i) {
    const ph = { h1: 'Título', h2: 'Subtítulo', quote: 'Citação', bul: 'Item da lista', todo: 'Tarefa', p: 'Escreva algo ou digite / para escolher o tipo' }[bl.t] || '';
    const ta = h('textarea', { class: 'blk blk-' + bl.t, rows: '1', placeholder: ph, 'aria-label': 'Bloco ' + (i + 1) });
    ta.value = bl.x;
    ta.addEventListener('input', () => { bl.x = ta.value; fit(ta); touch(); if (ta.value === '/') typeMenu(i, ta); });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const isList = bl.t === 'bul' || bl.t === 'todo';
        if (isList && !bl.x) { bl.t = 'p'; paint(i); touch(); return; }
        const pos = ta.selectionStart;
        const right = bl.x.slice(pos);
        bl.x = bl.x.slice(0, pos);
        blocks.splice(i + 1, 0, b(isList ? bl.t : 'p', right));
        paint(i + 1, true);
        touch();
      } else if (e.key === 'Backspace' && !ta.value) {
        e.preventDefault();
        if (bl.t !== 'p') { bl.t = 'p'; paint(i); touch(); } else if (blocks.length > 1) { blocks.splice(i, 1); paint(Math.max(0, i - 1)); touch(); }
      } else if (e.key === 'ArrowUp' && ta.selectionStart === 0 && i > 0) { e.preventDefault(); focusAt(i - 1); }
      else if (e.key === 'ArrowDown' && ta.selectionEnd === ta.value.length && i < blocks.length - 1) { e.preventDefault(); focusAt(i + 1, true); }
    });
    const handle = h('button', { class: 'handle', title: 'Opções do bloco', 'aria-label': 'Opções do bloco', onclick: (e) => { e.stopPropagation(); typeMenu(i, handle); } }, icon('grip', 16));
    const r = h('div', { class: 'blk-row' + (bl.c ? ' done' : '') }, handle,
      bl.t === 'todo' ? h('input', { type: 'checkbox', class: 'round', checked: bl.c, 'aria-label': 'Concluir', onchange: (e) => { bl.c = e.target.checked; r.classList.toggle('done', bl.c); if (bl.c) addXp(5); touch(); } }) : null,
      bl.t === 'bul' ? h('span', { class: 'bullet' }, '•') : null, ta);
    return r;
  }

  const titleIn = h('input', { class: 'page-title', value: title === 'Sem título' ? '' : title, placeholder: 'Sem título', 'aria-label': 'Título da página', maxlength: '200' });
  titleIn.addEventListener('input', () => { title = titleIn.value.trim() || 'Sem título'; metaDirty = true; touch(); });
  const iconBtn = h('button', { class: 'emoji-btn', title: 'Trocar ícone', 'aria-label': 'Trocar ícone' }, pageIcon(ic, 28));
  iconBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
    const m = h('div', { class: 'menu glass emoji', id: 'blkMenu' }, PAGE_ICONS.map((x) => h('button', { 'aria-label': x, onclick: () => { ic = x; iconBtn.replaceChildren(pageIcon(x, 28)); metaDirty = true; closeMenu(); touch(); } }, pageIcon(x, 22))));
    placeMenu(m, iconBtn);
  });

  const del = async () => {
    if (!(await confirmBox('Excluir esta página e as subpáginas dela?', 'Excluir', true))) return;
    const { error: er } = await sb.from('pages').delete().eq('id', id);
    if (er) { toast('Não foi possível excluir.', 'err'); return; }
    pendingFlush = null;
    document.dispatchEvent(new CustomEvent('krisis:pages'));
    toast('Página excluída.');
    location.hash = '#/hoje';
  };

  box.append(
    h('div', { class: 'page-head' }, iconBtn, h('div', { class: 'grow' }), status,
      h('button', { class: 'btn sm', onclick: () => newPageModal(id) }, icon('plus', 16), 'Subpágina'),
      h('button', { class: 'btn sm', onclick: () => window.print() }, 'Imprimir'),
      h('button', { class: 'icon-btn', title: 'Excluir página', 'aria-label': 'Excluir página', onclick: del }, icon('trash', 18))),
    titleIn, list,
    h('button', { class: 'btn sm', style: 'margin-top:12px', onclick: () => { blocks.push(b('p', '')); paint(blocks.length - 1); touch(); } }, icon('plus', 16), 'Adicionar bloco'));
  paint();
}
