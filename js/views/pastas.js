import { sb, state, h, icon, toast, openModal, confirmBox, empty, store } from '../core.js';
import { ic } from '../icons.js';
import { gate, refresh } from '../ui.js';
import { callAI, pdfText } from '../api.js';
import { loadTopics, progressOf, mastery, isDone } from '../data.js';
import { isPlus } from '../core.js';
import { sfx } from '../sfx.js';

const GOALS = ['ENEM', 'Fuvest', 'Unicamp', 'Concurso público', 'Faculdade', 'Outro'];

export async function createSubjectWithTrail({ name, goal, ai }) {
  const { data, error } = await sb.from('subjects').insert({ name: name.slice(0, 120), goal: goal ? goal.slice(0, 200) : null, tone: Math.floor(Math.random() * 5) }).select('*').single();
  if (error) throw new Error('Não foi possível criar a pasta.');
  if (ai && isPlus()) {
    try {
      const r = await callAI({ action: 'syllabus', name, goal });
      await sb.from('topics').insert(r.topics.map((t, i) => ({ subject_id: data.id, title: t.slice(0, 160), position: i })));
    } catch (e) { toast('Pasta criada. A trilha com IA não saiu: ' + e.message, 'err'); }
  }
  return data;
}

export function openCreateSubject(onDone) {
  let close = () => {};
  let goal = '';
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const name = h('input', { class: 'input', placeholder: 'Ex.: Biologia, ENEM 2026, Direito Constitucional', maxlength: '120', 'aria-label': 'Nome da pasta' });
  const chips = h('div', { class: 'ob-chips' }, GOALS.map((g) => {
    const b = h('button', { class: 'ob-chip', type: 'button' }, g);
    b.addEventListener('click', () => { goal = goal === g ? '' : g; chips.querySelectorAll('.ob-chip').forEach((c) => c.classList.toggle('on', c === b && goal === g)); if (!name.value.trim() && goal) name.value = g; });
    return b;
  }));
  let ai = isPlus();
  const sw = h('span', { class: 'sw' + (ai ? ' on' : '') });
  const aiRow = h('button', { class: 'set', type: 'button', style: 'margin:0' }, ic('wand', 20), h('div', { class: 'grow' }, 'Montar a trilha com IA', h('small', {}, 'O Tuck cria os tópicos na ordem certa')), sw);
  aiRow.addEventListener('click', () => { ai = !ai; sw.classList.toggle('on', ai); });
  gate(aiRow);
  const go = h('button', { class: 'btn primary big block' }, 'Criar pasta');
  go.addEventListener('click', async () => {
    const n = name.value.trim();
    if (n.length < 2) { msg.textContent = 'Dê um nome para a pasta.'; msg.className = 'form-msg err'; return; }
    go.disabled = true; msg.textContent = ai ? 'Montando sua trilha…' : 'Criando…'; msg.className = 'form-msg ok';
    try { const s = await createSubjectWithTrail({ name: n, goal, ai }); close(); sfx.pop(); store.set('eduquack.subject', s.id); if (onDone) onDone(s); }
    catch (e) { msg.textContent = e.message; msg.className = 'form-msg err'; go.disabled = false; }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Nova pasta'), h('p', { class: 'muted' }, 'Uma pasta por assunto ou objetivo. Dentro dela ficam a trilha, as fontes e os materiais.'),
    h('label', { class: 'field' }, 'Nome', name), h('div', {}, h('div', { class: 'field' }, 'Objetivo (opcional)'), chips), aiRow, msg, go), { wide: true });
}

export async function renderPastas(box) {
  const [{ data: subs }, topics] = await Promise.all([sb.from('subjects').select('*').order('created_at', { ascending: false }), loadTopics()]);
  const list = subs || [];
  box.append(h('div', { class: 'row', style: 'margin-bottom:12px;justify-content:space-between' },
    h('p', { class: 'lead' }, 'Cada pasta é um assunto. Veja quanto falta para dominar cada um.'),
    h('button', { class: 'btn primary', onclick: () => openCreateSubject((s) => { location.hash = '#/pasta/' + s.id; }) }, ic('plus', 16), 'Nova pasta')));
  if (!list.length) { box.append(empty('Nenhuma pasta ainda', 'Crie a primeira: Biologia, ENEM, Direito... O Tuck organiza o resto.', h('button', { class: 'btn primary', onclick: () => openCreateSubject((s) => { location.hash = '#/pasta/' + s.id; }) }, 'Criar pasta'))); return; }
  box.append(h('div', { class: 'grid3' }, list.map((s) => {
    const tp = topics.filter((t) => t.subject_id === s.id);
    const p = progressOf(tp);
    return h('a', { class: 'subj tone' + (s.tone % 5), href: '#/pasta/' + s.id },
      h('div', { class: 'row', style: 'justify-content:space-between' }, ic('folder', 24), s.goal ? h('span', { class: 'chip' }, s.goal) : null),
      h('h3', {}, s.name),
      h('div', { class: 'bar' }, h('i', { style: 'width:' + p.pct + '%' })),
      h('small', {}, tp.length ? p.pct + '% · ' + p.done + ' de ' + p.total + ' tópicos' : 'Sem tópicos ainda'));
  })));
}

function addLink(sub) {
  let close = () => {};
  const url = h('input', { class: 'input', placeholder: 'https://…', 'aria-label': 'Link' });
  const msg = h('div', { class: 'form-msg' });
  const go = h('button', { class: 'btn primary' }, 'Adicionar');
  go.addEventListener('click', async () => {
    go.disabled = true; msg.textContent = 'Lendo a página…'; msg.className = 'form-msg ok';
    try {
      const r = await callAI({ action: 'source', url: url.value.trim() });
      const { error } = await sb.from('sources').insert({ subject_id: sub.id, kind: 'link', title: r.title.slice(0, 200), url: url.value.trim().slice(0, 1000), content: r.text.slice(0, 40000) });
      if (error) throw new Error('Não foi possível salvar a fonte.');
      close(); refresh();
    } catch (e) { msg.textContent = e.message; msg.className = 'form-msg err'; go.disabled = false; }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Adicionar link'), h('p', { class: 'muted' }, 'O Tuck lê a página e passa a usar o conteúdo para ensinar.'), url, msg, h('div', { class: 'row end' }, go)));
}
function addText(sub) {
  let close = () => {};
  const title = h('input', { class: 'input', placeholder: 'Título (ex.: Anotações da aula 3)', maxlength: '200' });
  const text = h('textarea', { class: 'input', rows: '8', placeholder: 'Cole o texto aqui…', maxlength: '40000' });
  const msg = h('div', { class: 'form-msg' });
  const go = h('button', { class: 'btn primary' }, 'Adicionar');
  go.addEventListener('click', async () => {
    if (text.value.trim().length < 80) { msg.textContent = 'Cole pelo menos 80 caracteres.'; msg.className = 'form-msg err'; return; }
    const { error } = await sb.from('sources').insert({ subject_id: sub.id, kind: 'text', title: (title.value.trim() || 'Texto colado').slice(0, 200), content: text.value.trim().slice(0, 40000) });
    if (error) { msg.textContent = 'Não foi possível salvar.'; msg.className = 'form-msg err'; return; }
    close(); refresh();
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Adicionar texto'), title, text, msg, h('div', { class: 'row end' }, go)), { wide: true });
}
function addPdf(sub) {
  const f = h('input', { type: 'file', accept: 'application/pdf', style: 'display:none' });
  f.addEventListener('change', async () => {
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      const r = await pdfText(file);
      const { error } = await sb.from('sources').insert({ subject_id: sub.id, kind: 'pdf', title: r.name.slice(0, 200), content: r.text });
      if (error) throw new Error('Não foi possível salvar o PDF.');
      toast('PDF adicionado.', 'ok'); refresh();
    } catch (e) { toast(e.message, 'err'); }
  });
  document.body.append(f); f.click(); setTimeout(() => f.remove(), 60000);
}

export async function renderPasta(box, id) {
  const [{ data: sub }, topics, srcR, pgR, dkR] = await Promise.all([
    sb.from('subjects').select('*').eq('id', id).maybeSingle(), loadTopics(id),
    sb.from('sources').select('id,kind,title,url').eq('subject_id', id).order('created_at', { ascending: false }),
    sb.from('pages').select('id,title').eq('subject_id', id).eq('is_archived', false),
    sb.from('flashcard_decks').select('id,title').eq('subject_id', id)
  ]);
  if (!sub) { box.append(empty('Pasta não encontrada', 'Ela pode ter sido excluída.', h('a', { class: 'btn primary', href: '#/pastas' }, 'Ver pastas'))); return; }
  store.set('eduquack.subject', id);
  const p = progressOf(topics);
  const chatBtn = gate(h('button', { class: 'btn', onclick: () => { location.hash = '#/tuck'; } }, ic('chat', 16), 'Conversar sobre esta pasta'));
  box.append(h('section', { class: 'subj tone' + (sub.tone % 5), style: 'margin-bottom:14px' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', { style: 'font-size:1.8rem;font-weight:600' }, sub.name), sub.goal ? h('span', { class: 'chip' }, sub.goal) : null),
    h('div', { class: 'bar' }, h('i', { style: 'width:' + p.pct + '%' })),
    h('small', {}, topics.length ? p.pct + '% concluído · faltam ' + (p.total - p.done) + ' de ' + p.total + ' tópicos' : 'Adicione tópicos para montar a trilha'),
    h('div', { class: 'row', style: 'margin-top:6px' }, h('a', { class: 'btn primary', href: '#/trilha/' + id }, ic('route', 16), 'Abrir trilha'), chatBtn,
      h('button', { class: 'btn danger sm', onclick: async () => { if (!(await confirmBox('Excluir a pasta "' + sub.name + '" com tópicos e fontes? Os materiais ficam, sem pasta.', 'Excluir', true))) return; await sb.from('subjects').delete().eq('id', id); location.hash = '#/pastas'; } }, ic('trash', 16), 'Excluir'))));

  const topicIn = h('input', { class: 'input', placeholder: 'Novo tópico (ex.: Fotossíntese)', maxlength: '160', 'aria-label': 'Novo tópico' });
  const addTopic = async () => {
    const t = topicIn.value.trim();
    if (!t) { topicIn.focus(); return; }
    const { error } = await sb.from('topics').insert({ subject_id: id, title: t, position: topics.length });
    if (error) { toast('Não foi possível adicionar.', 'err'); return; }
    refresh();
  };
  topicIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTopic(); });
  const genTopics = gate(h('button', { class: 'btn', onclick: async (e) => {
    e.currentTarget.disabled = true;
    try {
      const r = await callAI({ action: 'syllabus', name: sub.name, goal: sub.goal || '' });
      await sb.from('topics').insert(r.topics.map((t, i) => ({ subject_id: id, title: t.slice(0, 160), position: topics.length + i })));
      sfx.magic(); refresh();
    } catch (err) { toast(err.message, 'err'); e.currentTarget.disabled = false; }
  } }, ic('wand', 16), 'Gerar tópicos com IA'));
  box.append(h('section', { class: 'card', style: 'margin-bottom:14px' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Tópicos da trilha'), genTopics),
    topics.length ? h('div', { class: 'list' }, topics.map((t) => h('div', { class: 'item' }, ic(isDone(t) ? 'check' : 'book', 18), h('div', { class: 'item-t' }, h('b', {}, t.title), h('div', { class: 'bar', style: 'height:8px;margin-top:4px' }, h('i', { style: 'width:' + Math.round(mastery(t) * 100) + '%' }))),
      h('button', { class: 'icon-btn tiny', 'aria-label': 'Remover tópico', onclick: async () => { await sb.from('topics').delete().eq('id', t.id); refresh(); } }, icon('trash', 15))))) : h('p', { class: 'muted' }, 'Nenhum tópico ainda.'),
    h('div', { class: 'row', style: 'margin-top:10px' }, h('div', { class: 'grow' }, topicIn), h('button', { class: 'btn green', onclick: addTopic }, ic('plus', 16), 'Adicionar'))));

  const srcs = srcR.data || [];
  const srcIcon = { link: 'link', text: 'file', pdf: 'attach' };
  box.append(h('section', { class: 'card', style: 'margin-bottom:14px' },
    h('div', { class: 'card-h' }, h('h3', {}, 'Fontes de estudo'), h('div', { class: 'row' },
      gate(h('button', { class: 'btn sm', onclick: () => addLink(sub) }, ic('link', 14), 'Link')),
      gate(h('button', { class: 'btn sm', onclick: () => addText(sub) }, ic('file', 14), 'Texto')),
      gate(h('button', { class: 'btn sm', onclick: () => addPdf(sub) }, ic('attach', 14), 'PDF')))),
    h('p', { class: 'muted', style: 'margin-bottom:8px' }, 'O Tuck usa as suas fontes para ensinar e responder.'),
    srcs.length ? h('div', { class: 'list' }, srcs.map((s) => h('div', { class: 'item' }, ic(srcIcon[s.kind] || 'file', 18), h('span', { class: 'item-t' }, s.title),
      h('button', { class: 'icon-btn tiny', 'aria-label': 'Remover fonte', onclick: async () => { await sb.from('sources').delete().eq('id', s.id); refresh(); } }, icon('trash', 15))))) : h('p', { class: 'muted' }, 'Nenhuma fonte ainda.')));

  const pages = pgR.data || [], decks = dkR.data || [];
  box.append(h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', {}, 'Materiais desta pasta')),
    pages.length || decks.length ? h('div', { class: 'list' }, pages.map((x) => h('a', { class: 'item', href: '#/pagina/' + x.id }, ic('file', 18), h('span', { class: 'item-t' }, x.title))), decks.map((x) => h('a', { class: 'item', href: '#/cartoes' }, ic('cards', 18), h('span', { class: 'item-t' }, x.title)))) : h('p', { class: 'muted' }, 'Resumos, guias e cartões criados para esta pasta aparecem aqui.')));
}
