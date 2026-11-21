import { sb, h, icon, toast, addXp, confirmBox, empty, chip, openModal } from '../core.js';
import { ic } from '../icons.js';
import { gate, refresh } from '../ui.js';
import { callAI } from '../api.js';
import { loadSubjects, findOrCreateDeck } from '../data.js';
import { createTuck } from '../tuck.js';
import { sfx } from '../sfx.js';

const DAY = 86400000;

function schedule(card, grade) {
  let ease = card.ease || 2.5, interval = card.interval_days || 0, due;
  if (grade === 0) { interval = 0; ease = Math.max(1.3, ease - 0.2); due = new Date(Date.now() + 10 * 60000); }
  else {
    if (interval === 0) interval = grade === 1 ? 1 : grade === 2 ? 2 : 4;
    else interval = Math.max(1, Math.round(interval * ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1)));
    if (grade === 3) ease += 0.1;
    if (grade === 1) ease = Math.max(1.3, ease - 0.1);
    due = new Date(Date.now() + interval * DAY);
  }
  return { ease, interval_days: interval, due_at: due.toISOString() };
}

// Gera cartões com IA a partir de um tema (sem digitar o conteúdo).
function openGenerate(subs, defTopic, defSubject) {
  let close = () => {};
  const topic = h('input', { class: 'input', placeholder: 'Ex.: Fotossíntese, Revolução Francesa', maxlength: '160', 'aria-label': 'Tema' });
  topic.value = defTopic || '';
  const sel = h('select', { class: 'input' }, h('option', { value: '' }, 'Sem pasta'), subs.map((s) => h('option', Object.assign({ value: s.id }, defSubject === s.id ? { selected: true } : {}), s.name)));
  const count = h('select', { class: 'input' }, [5, 10, 15].map((n) => h('option', Object.assign({ value: String(n) }, n === 10 ? { selected: true } : {}), n + ' cartões')));
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const go = h('button', { class: 'btn primary' }, ic('wand', 16), 'Gerar cartões');
  go.addEventListener('click', async () => {
    if (topic.value.trim().length < 2) { msg.textContent = 'Escreva o tema.'; msg.className = 'form-msg err'; return; }
    go.disabled = true; msg.textContent = 'O Tuck está criando os cartões…'; msg.className = 'form-msg ok';
    try {
      const s = subs.find((x) => x.id === sel.value);
      const r = await callAI({ action: 'flashcards', topic: topic.value.trim(), subject: s ? s.name : '', count: Number(count.value) });
      const deckId = await findOrCreateDeck('Cartões \u2014 ' + topic.value.trim(), s ? s.id : null);
      if (!deckId) throw new Error('Não foi possível criar o baralho.');
      await sb.from('flashcards').insert(r.cards.map((c) => ({ deck_id: deckId, front: c.front, back: c.back })));
      sfx.magic(); toast(r.cards.length + ' cartões criados.', 'ok'); close(); refresh();
    } catch (e) { msg.textContent = e.message; msg.className = 'form-msg err'; go.disabled = false; }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Gerar cartões com IA'), h('label', { class: 'field' }, 'Tema', topic), h('label', { class: 'field' }, 'Pasta', sel), h('label', { class: 'field' }, 'Quantidade', count), msg, go));
}

export async function renderCards(box) {
  const subs = await loadSubjects();
  async function decks() {
    box.replaceChildren();
    const [d, c] = await Promise.all([
      sb.from('flashcard_decks').select('*').order('created_at', { ascending: false }),
      sb.from('flashcards').select('id,deck_id,due_at').limit(3000)
    ]);
    const ds = d.data || [], cs = c.data || [];
    const now = Date.now();
    const count = (id) => cs.filter((x) => x.deck_id === id).length;
    const due = (id) => cs.filter((x) => x.deck_id === id && new Date(x.due_at).getTime() <= now).length;
    const totalDue = cs.filter((x) => new Date(x.due_at).getTime() <= now).length;
    const name = h('input', { class: 'input', placeholder: 'Nome do baralho', maxlength: '200', 'aria-label': 'Nome do baralho' });
    const sel = h('select', { class: 'input', 'aria-label': 'Pasta' }, h('option', { value: '' }, 'Sem pasta'), subs.map((s) => h('option', { value: s.id }, s.name)));
    const create = async () => {
      const t = name.value.trim();
      if (!t) { name.focus(); return; }
      const { error } = await sb.from('flashcard_decks').insert({ title: t, subject_id: sel.value || null });
      if (error) { toast('Não foi possível criar o baralho.', 'err'); return; }
      decks();
    };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });
    box.append(
      h('div', { class: 'row' }, h('div', { class: 'grow', style: 'min-width:200px' }, name), h('div', { style: 'width:170px' }, sel), h('button', { class: 'btn green', onclick: create }, ic('plus', 16), 'Criar baralho')),
      h('div', { class: 'row', style: 'margin:10px 0' },
        totalDue ? h('button', { class: 'btn primary', onclick: () => review(null) }, 'Revisar tudo (' + totalDue + ')') : h('span', { class: 'chip green' }, 'Tudo em dia'),
        gate(h('button', { class: 'btn', onclick: () => openGenerate(subs, '', '') }, ic('wand', 16), 'Gerar com IA'))),
      ds.length
        ? h('div', { class: 'grid3' }, ds.map((x) => { const s = subs.find((y) => y.id === x.subject_id); return h('button', { class: 'subj tone' + ((x.title.length + 1) % 5), onclick: () => deck(x) }, ic('cards', 22), h('h3', {}, x.title), h('div', { class: 'chips' }, chip(count(x.id) + ' cartões'), s ? chip(s.name) : null, due(x.id) ? chip(due(x.id) + ' para revisar', 'green') : null)); }))
        : empty('Crie seu primeiro baralho', 'Cartões ajudam a lembrar fórmulas, datas e conceitos no tempo certo. No Plus, o Tuck cria para você.'));
  }

  async function deck(dk) {
    box.replaceChildren();
    const { data } = await sb.from('flashcards').select('*').eq('deck_id', dk.id).order('created_at', { ascending: false });
    const cs = data || [];
    const dueN = cs.filter((x) => new Date(x.due_at).getTime() <= Date.now()).length;
    const front = h('textarea', { class: 'input', rows: '2', placeholder: 'Frente (pergunta)', maxlength: '2000', 'aria-label': 'Frente' });
    const back = h('textarea', { class: 'input', rows: '2', placeholder: 'Verso (resposta)', maxlength: '4000', 'aria-label': 'Verso' });
    const add = async () => {
      if (!front.value.trim() || !back.value.trim()) { toast('Preencha frente e verso.', 'err'); return; }
      const { error } = await sb.from('flashcards').insert({ deck_id: dk.id, front: front.value.trim(), back: back.value.trim() });
      if (error) { toast('Não foi possível salvar o cartão.', 'err'); return; }
      deck(dk);
    };
    box.append(
      h('div', { class: 'row', style: 'margin-bottom:12px' }, h('button', { class: 'btn sm', onclick: decks }, 'Voltar'), h('h2', { class: 'grow', style: 'font-size:1.4rem;font-weight:600' }, dk.title),
        dueN ? h('button', { class: 'btn primary', onclick: () => review(dk.id) }, 'Revisar (' + dueN + ')') : h('span', { class: 'chip green' }, 'Em dia'),
        gate(h('button', { class: 'btn sm', onclick: () => openGenerate(subs, dk.title.replace(/^Cartões \u2014 /, ''), dk.subject_id || '') }, ic('wand', 14), 'Gerar mais')),
        h('button', { class: 'btn sm danger', 'aria-label': 'Excluir baralho', onclick: async () => { if (!(await confirmBox('Excluir o baralho e todos os cartões?', 'Excluir', true))) return; await sb.from('flashcard_decks').delete().eq('id', dk.id); decks(); } }, ic('trash', 16))),
      h('div', { class: 'tile stack' }, front, back, h('div', { class: 'row end' }, h('button', { class: 'btn green', onclick: add }, ic('plus', 16), 'Adicionar cartão'))),
      h('div', { class: 'list', style: 'margin-top:14px' }, cs.map((x) => h('div', { class: 'item' }, h('div', { class: 'item-t' }, h('b', {}, x.front), h('div', { class: 'muted' }, x.back)),
        h('button', { class: 'icon-btn tiny', 'aria-label': 'Excluir cartão', onclick: async () => { await sb.from('flashcards').delete().eq('id', x.id); deck(dk); } }, icon('trash', 15))))));
  }

  async function review(deckId) {
    let q = sb.from('flashcards').select('*').lte('due_at', new Date().toISOString()).order('due_at').limit(60);
    if (deckId) q = q.eq('deck_id', deckId);
    const { data } = await q;
    const queue = data || [];
    box.replaceChildren();
    if (!queue.length) { box.append(empty('Tudo revisado!', 'Volte mais tarde para novos cartões.', h('button', { class: 'btn primary', onclick: decks }, 'Voltar'))); return; }
    let i = 0, shown = false, right = 0;
    const tuck = createTuck({ size: 90 });
    const bar = h('i', {});
    const body = h('div', {});
    const draw = () => {
      bar.style.width = Math.round((i / queue.length) * 100) + '%';
      if (i >= queue.length) {
        addXp(5 + right * 2);
        tuck.setMood('cheer', 3000); sfx.mission();
        body.replaceChildren(h('div', { class: 'row', style: 'justify-content:center' }, tuck.el), empty('Sessão concluída!', 'Você acertou ' + right + ' de ' + queue.length + '. +' + (5 + right * 2) + ' XP', h('button', { class: 'btn primary', onclick: decks }, 'Concluir')));
        return;
      }
      const c = queue[i];
      const card = h('div', { class: 'tile fc', tabindex: '0', role: 'button', 'aria-label': 'Mostrar resposta' }, h('div', {}, c.front), shown ? h('div', { class: 'back' }, c.back) : h('span', { class: 'muted', style: 'font-size:.9rem' }, 'Toque para ver a resposta'));
      const flip = () => { if (!shown) { shown = true; draw(); } };
      card.addEventListener('click', flip);
      card.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
      const grade = async (g) => {
        if (g > 0) { right++; tuck.setMood('happy', 900); } else tuck.setMood('sad', 900);
        await sb.from('flashcards').update(schedule(c, g)).eq('id', c.id);
        i++; shown = false; draw();
      };
      body.replaceChildren(card, shown ? h('div', { class: 'grades' },
        h('button', { class: 'btn danger', onclick: () => grade(0) }, 'Errei'), h('button', { class: 'btn', onclick: () => grade(1) }, 'Difícil'),
        h('button', { class: 'btn primary', onclick: () => grade(2) }, 'Bom'), h('button', { class: 'btn green', onclick: () => grade(3) }, 'Fácil')) : null);
    };
    box.append(h('div', { class: 'row', style: 'margin-bottom:12px' }, h('button', { class: 'btn sm', onclick: () => { tuck.destroy(); decks(); } }, 'Sair'), h('div', { class: 'grow bar' }, bar), tuck.el), body);
    draw();
  }

  await decks();
}
