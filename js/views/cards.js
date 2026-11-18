import { sb, h, icon, toast, addXp, confirmBox, empty, chip } from '../core.js';
import { openPlus } from './plus.js';

const DAY = 86400000;

function schedule(card, grade) {
  let ease = card.ease || 2.5;
  let interval = card.interval_days || 0;
  let due;
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

export async function renderCards(box) {
  async function decks() {
    box.replaceChildren();
    const [d, c] = await Promise.all([
      sb.from('flashcard_decks').select('*').order('created_at', { ascending: false }),
      sb.from('flashcards').select('id,deck_id,due_at').limit(3000)
    ]);
    const ds = d.data || [];
    const cs = c.data || [];
    const now = Date.now();
    const count = (id) => cs.filter((x) => x.deck_id === id).length;
    const due = (id) => cs.filter((x) => x.deck_id === id && new Date(x.due_at).getTime() <= now).length;
    const totalDue = cs.filter((x) => new Date(x.due_at).getTime() <= now).length;
    const name = h('input', { class: 'input', placeholder: 'Nome do baralho (ex.: Biologia: citologia)', maxlength: '200', 'aria-label': 'Nome do baralho' });
    const create = async () => {
      const t = name.value.trim();
      if (!t) { name.focus(); return; }
      const { error } = await sb.from('flashcard_decks').insert({ title: t });
      if (error) { toast('Não foi possível criar o baralho.', 'err'); return; }
      decks();
    };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });
    box.append(
      h('div', { class: 'row' },
        h('div', { class: 'grow', style: 'min-width:220px' }, name), h('button', { class: 'btn green', onclick: create }, icon('plus', 16), 'Criar baralho'),
        totalDue ? h('button', { class: 'btn primary', onclick: () => review(null) }, 'Revisar tudo (' + totalDue + ')') : null,
        h('button', { class: 'btn', onclick: () => openPlus('Cartões gerados por IA a partir das suas páginas') }, icon('lock', 16), 'Gerar com IA')),
      ds.length
        ? h('div', { class: 'deck-grid' }, ds.map((x) => h('button', { class: 'tile mint', style: 'text-align:left;display:flex;flex-direction:column;gap:6px', onclick: () => deck(x) },
          icon('cards', 22), h('b', {}, x.title), h('div', { class: 'chips' }, chip(count(x.id) + ' cartões'), due(x.id) ? chip(due(x.id) + ' para revisar', 'green') : null))))
        : h('div', { style: 'margin-top:14px' }, empty('Crie seu primeiro baralho', 'Cartões ajudam a lembrar fórmulas, datas e conceitos no tempo certo.')));
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
      h('div', { class: 'row', style: 'margin-bottom:12px' },
        h('button', { class: 'btn sm', onclick: decks }, 'Voltar'), h('h2', { class: 'grow', style: 'font-weight:900' }, dk.title),
        dueN ? h('button', { class: 'btn primary', onclick: () => review(dk.id) }, 'Revisar (' + dueN + ')') : h('span', { class: 'chip green' }, 'Em dia'),
        h('button', { class: 'btn sm danger', 'aria-label': 'Excluir baralho', onclick: async () => {
          if (!(await confirmBox('Excluir o baralho e todos os cartões?', 'Excluir', true))) return;
          await sb.from('flashcard_decks').delete().eq('id', dk.id);
          decks();
        } }, icon('trash', 16))),
      h('div', { class: 'tile stack' }, front, back, h('div', { class: 'row end' }, h('button', { class: 'btn green', onclick: add }, icon('plus', 16), 'Adicionar cartão'))),
      h('div', { class: 'list', style: 'margin-top:14px' }, cs.map((x) => h('div', { class: 'item' },
        h('div', { class: 'item-t' }, h('b', {}, x.front), h('div', { class: 'muted' }, x.back)),
        h('button', { class: 'icon-btn tiny', 'aria-label': 'Excluir cartão', onclick: async () => { await sb.from('flashcards').delete().eq('id', x.id); deck(dk); } }, icon('trash', 15))))));
  }

  async function review(deckId) {
    let q = sb.from('flashcards').select('*').lte('due_at', new Date().toISOString()).order('due_at').limit(60);
    if (deckId) q = q.eq('deck_id', deckId);
    const { data } = await q;
    const queue = data || [];
    box.replaceChildren();
    if (!queue.length) { box.append(empty('Tudo revisado!', 'Volte mais tarde para novos cartões.', h('button', { class: 'btn primary', onclick: decks }, 'Voltar'))); return; }
    let i = 0;
    let shown = false;
    let right = 0;
    const bar = h('i', {});
    const body = h('div', {});
    const draw = () => {
      bar.style.width = Math.round((i / queue.length) * 100) + '%';
      if (i >= queue.length) {
        addXp(5 + right * 2);
        body.replaceChildren(empty('Sessão concluída!', 'Você acertou ' + right + ' de ' + queue.length + '. +' + (5 + right * 2) + ' XP', h('button', { class: 'btn primary', onclick: decks }, 'Concluir')));
        return;
      }
      const c = queue[i];
      const card = h('div', { class: 'tile fc', tabindex: '0', role: 'button', 'aria-label': 'Mostrar resposta' }, h('div', {}, c.front), shown ? h('div', { class: 'back' }, c.back) : h('span', { class: 'muted', style: 'font-size:.9rem' }, 'Toque para ver a resposta'));
      const flip = () => { if (!shown) { shown = true; draw(); } };
      card.addEventListener('click', flip);
      card.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
      const grade = async (g) => {
        if (g > 0) right++;
        await sb.from('flashcards').update(schedule(c, g)).eq('id', c.id);
        i++;
        shown = false;
        draw();
      };
      body.replaceChildren(card, shown ? h('div', { class: 'grades' },
        h('button', { class: 'btn danger', onclick: () => grade(0) }, 'Errei'), h('button', { class: 'btn', onclick: () => grade(1) }, 'Difícil'),
        h('button', { class: 'btn primary', onclick: () => grade(2) }, 'Bom'), h('button', { class: 'btn green', onclick: () => grade(3) }, 'Fácil')) : null);
    };
    box.append(h('div', { class: 'row', style: 'margin-bottom:12px' }, h('button', { class: 'btn sm', onclick: decks }, 'Sair'), h('div', { class: 'grow bar' }, bar)), body);
    draw();
  }

  await decks();
}
