import { sb, state, h, store, toast, openModal } from '../core.js';
import { ic } from '../icons.js';
import { gate, refresh } from '../ui.js';
import { callAI, listen, hasVoice, say, pdfText } from '../api.js';
import { loadSubjects, loadTopics, mastery, blocksFrom, insertPage, findOrCreateDeck } from '../data.js';
import { createTuck, TUCK } from '../tuck.js';
import { runLesson } from './quiz.js';
import { createSubjectWithTrail } from './pastas.js';
import { sfx } from '../sfx.js';

const SUG_SUBJECT = ['O que devo estudar hoje nesta pasta?', 'Quais são os meus pontos fracos?', 'Crie cartões do próximo tópico', 'Monte um guia de estudos de 2 semanas', 'Faça um quiz rápido sobre o que errei'];
const SUG_FREE = ['O que devo estudar hoje?', 'Crie uma pasta e uma trilha para o ENEM', 'Explique um conceito para mim', 'Faça um quiz sobre um assunto', 'Transforme um edital em plano (anexe o PDF)'];

// Conversa com o Tuck: ele responde e propõe ações de um toque (cartões, quiz, resumo, guia, tarefa, pasta).
export async function renderTuck(box) {
  const KEY = 'eduquack.chat.' + state.user.id;
  let msgs = store.get(KEY, []);
  let att = null, busy = false, rec = null;
  const subs = await loadSubjects();
  let cur = subs.find((s) => s.id === store.get('eduquack.subject', null)) || null;
  let topics = [], srcs = [];
  async function loadCtx() {
    topics = cur ? await loadTopics(cur.id) : [];
    if (cur) { const { data } = await sb.from('sources').select('title,content').eq('subject_id', cur.id).order('created_at', { ascending: false }).limit(4); srcs = (data || []).map((s) => ({ title: s.title, excerpt: s.content.slice(0, 700) })); } else srcs = [];
  }
  await loadCtx();

  const tuck = createTuck({ size: 64 });
  const sel = h('select', { 'aria-label': 'Pasta' }, h('option', { value: '' }, 'Sem pasta'), subs.map((s) => h('option', Object.assign({ value: s.id }, cur && cur.id === s.id ? { selected: true } : {}), s.name)));
  const chat = h('div', { class: 'chat', 'aria-live': 'polite' });
  const sugg = h('div', { class: 'sugg' });
  const attBox = h('div', { class: 'row' });
  const input = h('input', { class: 'input', placeholder: 'Escreva, dite ou anexe um material…', maxlength: '800', 'aria-label': 'Mensagem' });
  const sendBtn = h('button', { class: 'btn primary', 'aria-label': 'Enviar', type: 'button' }, ic('send', 18));
  const micBtn = h('button', { class: 'btn', 'aria-label': 'Ditar', type: 'button' }, ic('mic', 18));
  const attBtn = h('button', { class: 'btn', 'aria-label': 'Anexar', type: 'button' }, ic('attach', 18));

  const save = () => store.set(KEY, msgs.slice(-30).map((m) => ({ role: m.role, text: m.text, actions: m.actions || [] })));
  const needTuckName = TUCK;

  function paintSugg() {
    sugg.replaceChildren();
    if (msgs.length > 1) return;
    (cur ? SUG_SUBJECT : SUG_FREE).forEach((t) => { const b = h('button', { class: 'cmd-chip', type: 'button' }, t); b.addEventListener('click', () => send(t)); sugg.append(b); });
  }
  function paintAtt() {
    attBox.replaceChildren();
    if (!att) return;
    attBox.append(h('span', { class: 'chip blue' }, ic('attach', 14), att.name), cur ? h('button', { class: 'btn sm', onclick: async () => { const { error } = await sb.from('sources').insert({ subject_id: cur.id, kind: att.kind, title: att.name.slice(0, 200), url: att.url || null, content: att.text.slice(0, 40000) }); if (error) { toast('Não foi possível salvar.', 'err'); return; } toast('Salvo nas fontes da pasta.', 'ok'); await loadCtx(); } }, 'Salvar nas fontes') : null, h('button', { class: 'btn sm', onclick: () => { att = null; paintAtt(); } }, 'Remover'));
  }

  async function run(a, btn) {
    btn.disabled = true;
    const p = a.params || {};
    const weak = (topics.find((t) => String(t.title).toLowerCase() === String(p.topic || '').toLowerCase()) || {}).weak || [];
    try {
      if (a.type === 'flashcards') {
        const r = await callAI({ action: 'flashcards', topic: p.topic, subject: cur ? cur.name : '', count: p.count, text: att ? att.text : '', weak });
        const deckId = await findOrCreateDeck('Cartões \u2014 ' + (p.topic || 'Tuck'), cur ? cur.id : null);
        if (!deckId) throw new Error('Não foi possível criar o baralho.');
        await sb.from('flashcards').insert(r.cards.map((c) => ({ deck_id: deckId, front: c.front, back: c.back })));
        sfx.magic(); toast(r.cards.length + ' cartões criados.', 'ok');
      } else if (a.type === 'quiz') {
        const r = await callAI({ action: 'quiz', topic: p.topic, subject: cur ? cur.name : '', count: p.count, text: att ? att.text : '', weak });
        const tp = topics.find((t) => String(t.title).toLowerCase() === String(p.topic || '').toLowerCase());
        runLesson({ title: p.topic || 'Quiz', questions: r.questions, topic: tp, subject: cur });
      } else if (a.type === 'page') {
        const r = await callAI({ action: 'page', kind: p.kind, topic: p.topic, subject: cur ? cur.name : '', text: att ? att.text : '', days: p.days });
        const id = await insertPage({ title: r.titulo, blocks: blocksFrom(r.titulo, r.blocos), subject_id: cur ? cur.id : null });
        if (!id) throw new Error('Não foi possível criar a página.');
        sfx.magic(); location.hash = '#/pagina/' + id; return;
      } else if (a.type === 'task') {
        const row = { title: String(p.title).slice(0, 300) };
        if (p.quando) row.due_at = new Date(p.quando + 'T12:00:00').toISOString();
        const { error } = await sb.from('tasks').insert(row);
        if (error) throw new Error('Não foi possível criar a tarefa.');
        sfx.pop(); toast('Tarefa criada.', 'ok');
      } else if (a.type === 'subject') {
        const s = await createSubjectWithTrail({ name: p.name, goal: p.goal, ai: true });
        store.set('eduquack.subject', s.id); sfx.magic(); location.hash = '#/trilha/' + s.id; return;
      } else if (a.type === 'trail') { location.hash = '#/trilha'; return; }
      else if (a.type === 'open') { location.hash = '#/' + p.route; return; }
      btn.classList.add('done');
    } catch (e) { toast(e.message, 'err'); sfx.oops(); }
    btn.disabled = false;
  }

  function paint() {
    chat.replaceChildren(...msgs.map((m) => {
      const el = h('div', { class: 'msg ' + (m.role === 'user' ? 'me' : 'bot') }, m.text);
      if (m.role !== 'user') {
        el.append(h('div', { style: 'margin-top:8px' }, h('button', { class: 'btn sm', onclick: () => say(m.text) }, ic('volume', 14), 'Ouvir')));
        if ((m.actions || []).length) el.append(h('div', { class: 'acts' }, m.actions.map((a) => { const b = h('button', { class: 'act-card', type: 'button' }, ic('wand', 16), a.label); b.addEventListener('click', () => run(a, b)); return b; })));
      }
      return el;
    }));
    chat.scrollTop = chat.scrollHeight;
    paintSugg();
  }

  async function send(text) {
    text = (text || input.value).trim();
    if (!text || busy) return;
    busy = true; input.value = '';
    msgs.push({ role: 'user', text });
    paint();
    const typing = h('div', { class: 'msg bot' }, h('span', { class: 'typing' }, h('i'), h('i'), h('i')));
    chat.append(typing); chat.scrollTop = chat.scrollHeight;
    tuck.setMood('think');
    try {
      const hist = msgs.slice(-7, -1).map((m) => ({ role: m.role, text: m.text }));
      const r = await callAI({ action: 'tuck', message: text, history: hist, subject: cur ? { name: cur.name, goal: cur.goal, topics: topics.map((t) => ({ title: t.title, mastery: Math.round(mastery(t) * 100), weak: t.weak || [] })) } : null, sources: srcs, attachment: att ? att.text : '' });
      msgs.push({ role: 'assistant', text: r.reply, actions: r.actions || [] });
      if (r.refused) { tuck.setMood('sad', 1500); sfx.oops(); } else { tuck.setMood('happy', 1400); tuck.quack(); sfx.quack('happy'); }
    } catch (e) { msgs.push({ role: 'assistant', text: e.message, actions: [] }); tuck.setMood('sad', 1500); sfx.oops(); }
    save(); busy = false; paint(); input.focus();
  }

  sel.addEventListener('change', async () => { cur = subs.find((s) => s.id === sel.value) || null; store.set('eduquack.subject', cur ? cur.id : null); await loadCtx(); paintSugg(); });
  sendBtn.addEventListener('click', () => send());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  micBtn.addEventListener('click', () => {
    if (rec) { rec.stop(); return; }
    rec = listen({ onText: (t) => { input.value = t; }, onEnd: () => { rec = null; micBtn.classList.remove('rec'); } });
    if (!rec) { toast('Seu navegador não suporta ditado por voz. Use o Chrome.', 'err'); return; }
    micBtn.classList.add('rec'); sfx.quack('curious'); rec.start();
  });
  attBtn.addEventListener('click', () => {
    let close = () => {};
    const f = h('input', { type: 'file', accept: 'application/pdf', style: 'display:none' });
    f.addEventListener('change', async () => { const file = f.files && f.files[0]; if (!file) return; close(); try { const r = await pdfText(file, { maxChars: 12000 }); att = { name: r.name, text: r.text, kind: 'pdf' }; paintAtt(); sfx.pop(); } catch (e) { toast(e.message, 'err'); } });
    const url = h('input', { class: 'input', placeholder: 'Cole um link (https://…)' });
    const go = h('button', { class: 'btn primary' }, 'Ler link');
    go.addEventListener('click', async () => { go.disabled = true; try { const r = await callAI({ action: 'source', url: url.value.trim() }); att = { name: r.title, text: r.text.slice(0, 12000), kind: 'link', url: url.value.trim() }; paintAtt(); sfx.pop(); close(); } catch (e) { toast(e.message, 'err'); go.disabled = false; } });
    close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Anexar material'), h('button', { class: 'btn block', onclick: () => f.click() }, ic('attach', 16), 'Escolher um PDF'), f, h('div', { class: 'field' }, 'ou um link'), url, h('div', { class: 'row end' }, go)));
  });

  const clear = h('button', { class: 'btn sm', type: 'button', onclick: () => { msgs = []; save(); paint(); } }, 'Nova conversa');
  if (!msgs.length) msgs.push({ role: 'assistant', text: 'Oi! Eu sou o ' + needTuckName + '. Posso explicar conteúdos, montar sua trilha e criar cartões, resumos, quizzes e guias. Como quer começar?', actions: [] });

  box.append(h('div', { class: 'chatwrap' },
    h('div', { class: 'chat-head' }, tuck.el, h('div', { class: 'grow' }, h('h2', {}, needTuckName), h('small', { style: 'font-weight:700' }, 'Só converso sobre estudos')), sel, clear),
    chat, sugg, attBox,
    h('div', { class: 'chat-bar' }, attBtn, hasVoice() ? micBtn : null, input, sendBtn)));
  paint();
}
