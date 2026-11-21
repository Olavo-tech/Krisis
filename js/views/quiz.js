import { sb, state, h, toast, addXp, isPlus, uid, openModal, confirmBox } from '../core.js';
import { ic } from '../icons.js';
import { callAI, say } from '../api.js';
import { createPage, loadPages } from './pages.js';
import { createTuck, burst, TUCK } from '../tuck.js';
import { sfx, haptic } from '../sfx.js';
import { loadSubjects, loadTopics, recordLesson, findOrCreateDeck, stars, mastery } from '../data.js';
import { openPlus } from './plus.js';

const L = 'ABCD';

async function pageText(id) {
  const { data } = await sb.from('pages').select('title,content').eq('id', id).maybeSingle();
  if (!data) return '';
  return (data.title + '\n' + (Array.isArray(data.content) ? data.content.map((b) => b.x).filter(Boolean).join('\n') : '')).slice(0, 12000);
}

// Lição / simulado em tela cheia (estilo app de idiomas). Se vier um tópico, atualiza domínio e pontos fracos.
export function runLesson({ title, intro, questions, topic, subject, onDone }) {
  let i = 0, right = 0, sel = -1, checked = false;
  const wrongs = [], rights = [];
  const tuck = createTuck({ size: 84 });
  tuck.locked = true;
  const bar = h('i', {});
  const counter = h('span', { class: 'chip' });
  const body = h('div', { class: 'ls-body' });
  const foot = h('div', { class: 'ls-foot' });
  const xb = h('button', { class: 'icon-btn', 'aria-label': 'Sair', type: 'button' }, ic('x', 22));
  const ov = h('div', { class: 'lesson', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'ls-top' }, xb, h('div', { class: 'bar grow' }, bar), counter), body, foot);
  const exit = () => { tuck.destroy(); ov.remove(); };
  xb.addEventListener('click', async () => { if (await confirmBox('Sair? Seu progresso desta lição será perdido.', 'Sair', true)) exit(); });

  function showIntro() {
    tuck.setMood('read');
    const go = h('button', { class: 'btn green block big' }, 'Vamos lá');
    go.addEventListener('click', () => { sfx.quack('happy'); draw(); });
    body.replaceChildren(h('div', { class: 'ls-kri' }, tuck.el), h('h2', { class: 'ls-q' }, title), h('div', { class: 'intro-card' }, intro));
    foot.replaceChildren(go);
    counter.textContent = questions.length + ' questões';
  }

  function draw() {
    checked = false; sel = -1;
    const q = questions[i];
    bar.style.width = Math.round(i / questions.length * 100) + '%';
    counter.textContent = (i + 1) + ' de ' + questions.length;
    tuck.setMood('idle');
    const check = h('button', { class: 'btn green block big', disabled: true }, 'Verificar');
    const opts = q.options.map((o, k) => {
      const b = h('button', { class: 'opt', type: 'button' }, h('b', {}, L[k]), h('span', {}, o));
      b.addEventListener('click', () => { if (checked) return; sel = k; opts.forEach((x, j) => x.classList.toggle('sel', j === k)); check.disabled = false; });
      return b;
    });
    check.addEventListener('click', () => {
      if (checked || sel < 0) return;
      checked = true;
      const ok = sel === q.answer;
      opts[q.answer].classList.add('right');
      if (ok) { right++; rights.push(q); sfx.done(); tuck.setMood('cheer', 1500); tuck.quack(); const r = tuck.el.getBoundingClientRect(); burst(r.left + 40, r.top + 20, 14); }
      else { opts[sel].classList.add('wrong'); wrongs.push(q); sfx.oops(); tuck.setMood('sad', 1500); }
      haptic(ok ? 15 : 35);
      const cont = h('button', { class: 'btn green block big' }, i === questions.length - 1 ? 'Ver resultado' : 'Continuar');
      cont.addEventListener('click', () => { i++; if (i < questions.length) draw(); else finish(); });
      foot.replaceChildren(h('div', { class: 'fb ' + (ok ? 'ok' : 'no') }, h('b', {}, ok ? 'Isso aí!' : 'Quase! A certa é a ' + L[q.answer] + '.'), h('p', {}, q.explanation)), cont);
    });
    body.replaceChildren(h('div', { class: 'ls-kri' }, tuck.el, h('span', { class: 'muted' }, title)), h('h2', { class: 'ls-q' }, q.q), h('div', { class: 'stack' }, opts));
    foot.replaceChildren(check);
  }

  async function finish() {
    bar.style.width = '100%';
    const total = questions.length;
    const pct = Math.round(right / total * 100);
    const xp = right * 5 + 10;
    addXp(xp);
    let t2 = topic, saved = 0;
    if (topic) { try { t2 = await recordLesson(topic, { correct: right, total, wrong: wrongs.map((q) => q.concept || q.q.slice(0, 60)), right: rights.map((q) => q.concept || '') }); } catch (_) { /* segue */ } }
    if (wrongs.length) {
      try {
        const deckId = await findOrCreateDeck(('Revisão \u2014 ' + title).slice(0, 200), subject ? subject.id : null);
        if (deckId) {
          const { error } = await sb.from('flashcards').insert(wrongs.map((q) => ({ deck_id: deckId, front: q.q.slice(0, 2000), back: ('Resposta: ' + q.options[q.answer] + '. ' + q.explanation).slice(0, 4000) })));
          if (!error) saved = wrongs.length;
        }
      } catch (_) { /* segue */ }
    }
    tuck.setMood(pct >= 70 ? 'dance' : 'happy', 4000);
    if (pct >= 70) { sfx.mission(); const r = tuck.el.getBoundingClientRect(); burst(r.left + 40, r.top + 30, 46); } else sfx.done();
    const end = h('button', { class: 'btn green block big' }, 'Continuar');
    end.addEventListener('click', () => { exit(); if (onDone) onDone(t2); });
    const s = t2 ? stars(t2) : 0;
    body.replaceChildren(h('div', { class: 'ls-kri' }, tuck.el),
      h('h2', { class: 'ls-q' }, pct >= 70 ? 'Mandou bem!' : 'Bom treino!'),
      h('div', { class: 'res-big' }, right + ' de ' + total),
      h('div', { class: 'row' }, h('span', { class: 'chip green' }, '+' + xp + ' XP'), h('span', { class: 'chip' }, pct + '% de acerto')),
      t2 ? h('div', { class: 'stack' }, h('div', { class: 'tstars', style: 'justify-content:flex-start' }, [1, 2, 3].map((k) => h('span', { class: k <= s ? '' : 'off' }, ic('star', 26)))),
        h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(mastery(t2) * 100) + '%' })), h('p', { class: 'muted' }, 'Domínio deste tópico: ' + Math.round(mastery(t2) * 100) + '%'),
        (t2.weak || []).length ? h('div', {}, h('div', { class: 'field' }, 'Vamos reforçar'), h('div', { class: 'wk', style: 'margin-top:6px' }, t2.weak.map((w) => h('span', { class: 'chip rose' }, w)))) : null) : null,
      saved ? h('p', { class: 'lead' }, saved + (saved === 1 ? ' erro virou cartão' : ' erros viraram cartões') + ' e voltam na hora certa para você fixar.') : h('p', { class: 'lead' }, 'Sem erros desta vez. Continue assim!'));
    foot.replaceChildren(end);
  }
  document.body.append(ov);
  if (intro) showIntro(); else draw();
}

/* ---------- Escolher o material do simulado ---------- */
export async function openQuizSetup() {
  if (!isPlus()) { openPlus('Simulados com IA'); return; }
  await loadPages();
  const [subs, allTopics, edR, dkR] = await Promise.all([
    loadSubjects(), loadTopics(),
    sb.from('editais_salvos').select('id,titulo,analysis').order('created_at', { ascending: false }).limit(30),
    sb.from('flashcard_decks').select('id,title').order('created_at', { ascending: false }).limit(30)
  ]);
  const eds = edR.data || [], decks = dkR.data || [];
  let close = () => {};
  const kinds = [['weak', 'Meus pontos fracos'], ['topic', 'Um tópico das minhas pastas'], ['free', 'Tema livre (eu escolho o assunto)'], ['page', 'Uma das minhas páginas'], ['edital', 'Um edital salvo'], ['deck', 'Um baralho'], ['text', 'Colar um texto']];
  const kind = h('select', { class: 'input' }, kinds.map(([v, l]) => h('option', { value: v }, l)));
  const ta = h('textarea', { class: 'input', rows: '6', placeholder: 'Cole o material de estudo…' });
  const free = h('input', { class: 'input', placeholder: 'Ex.: Leis de Newton', maxlength: '160' });
  const selTopic = h('select', { class: 'input' }, allTopics.map((t) => { const s = subs.find((x) => x.id === t.subject_id); return h('option', { value: t.id }, (s ? s.name + ' \u2014 ' : '') + t.title); }));
  const selPage = h('select', { class: 'input' }, (state.pages || []).map((p) => h('option', { value: p.id }, p.title || 'Sem título')));
  const selEd = h('select', { class: 'input' }, eds.map((e) => h('option', { value: e.id }, e.titulo)));
  const selDeck = h('select', { class: 'input' }, decks.map((d) => h('option', { value: d.id }, d.title)));
  const count = h('select', { class: 'input' }, [5, 8, 10].map((n) => h('option', Object.assign({ value: String(n) }, n === 8 ? { selected: true } : {}), n + ' questões')));
  const holder = h('div', {});
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const paint = () => {
    const k = kind.value;
    holder.replaceChildren(k === 'text' ? ta : k === 'free' ? free : k === 'page' ? selPage : k === 'edital' ? selEd : k === 'deck' ? selDeck : k === 'topic' ? selTopic : h('p', { class: 'muted' }, 'Eu monto perguntas sobre os conceitos que você mais errou nas lições.'));
  };
  kind.addEventListener('change', paint); paint();
  const go = h('button', { class: 'btn primary big' }, ic('target', 18), 'Criar simulado');
  const fail = (t) => { msg.textContent = t; msg.className = 'form-msg err'; sfx.oops(); go.disabled = false; };
  go.addEventListener('click', async () => {
    msg.className = 'form-msg';
    const k = kind.value;
    const body = { action: 'quiz', count: Number(count.value) };
    let title = 'Simulado';
    if (k === 'weak') {
      const lines = allTopics.filter((t) => (t.weak || []).length).map((t) => t.title + ': ' + t.weak.join(', '));
      if (!lines.length) { fail('Você ainda não tem pontos fracos registrados. Faça uma lição na Trilha primeiro.'); return; }
      body.text = 'O aluno errou estes conceitos e precisa reforçá-los:\n' + lines.join('\n'); title = 'Meus pontos fracos';
    } else if (k === 'topic') {
      const t = allTopics.find((x) => x.id === selTopic.value);
      if (!t) { fail('Escolha um tópico.'); return; }
      const s = subs.find((x) => x.id === t.subject_id);
      body.topic = t.title; body.subject = s ? s.name : ''; body.weak = t.weak || []; title = t.title;
    } else if (k === 'free') {
      if (free.value.trim().length < 2) { fail('Escreva o assunto.'); return; }
      body.topic = free.value.trim(); title = free.value.trim();
    } else if (k === 'text') body.text = ta.value.trim();
    else if (k === 'page') { if (selPage.value) { body.text = await pageText(selPage.value); title = selPage.options[selPage.selectedIndex].text; } }
    else if (k === 'edital') { const e = eds.find((x) => x.id === selEd.value); if (e) { const a = e.analysis || {}; body.text = [e.titulo, a.provas, a.requisitos, a.datas, a.resumo].filter(Boolean).join('\n'); title = e.titulo; } }
    else if (k === 'deck') { const { data } = await sb.from('flashcards').select('front,back').eq('deck_id', selDeck.value).limit(60); body.text = (data || []).map((c) => c.front + ': ' + c.back).join('\n').slice(0, 12000); title = selDeck.options[selDeck.selectedIndex].text; }
    go.disabled = true; msg.textContent = 'O ' + TUCK + ' está montando as questões…'; msg.className = 'form-msg ok';
    try {
      const r = await callAI(body);
      sfx.magic(); close(); runLesson({ title, questions: r.questions });
    } catch (e) { fail(e.message); }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Simulado com IA'), h('p', { class: 'muted' }, 'Escolha o foco. Os erros viram cartões sozinhos.'),
    h('label', { class: 'field' }, 'Sobre o quê', kind), holder, h('label', { class: 'field' }, 'Quantidade', count), msg, go), { wide: true });
}

/* ---------- Correção de redação (modelo ENEM) ---------- */
export function openEssay() {
  if (!isPlus()) { openPlus('Correção de redação ENEM com IA'); return; }
  const tema = h('input', { class: 'input', placeholder: 'Tema (opcional)', maxlength: '200', 'aria-label': 'Tema' });
  const ta = h('textarea', { class: 'input', rows: '11', placeholder: 'Cole ou escreva sua redação aqui…', maxlength: '6000', 'aria-label': 'Redação' });
  const cnt = h('span', { class: 'muted' }, '0 caracteres (mínimo 300)');
  ta.addEventListener('input', () => { cnt.textContent = ta.value.length + ' caracteres (mínimo 300)'; });
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const out = h('div', {});
  const go = h('button', { class: 'btn primary' }, ic('wand', 16), 'Corrigir');
  const tuck = createTuck({ size: 70 });
  tuck.locked = true;

  function show(r) {
    const bar = (c) => h('div', { class: 'comp' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', {}, c.nome), h('span', { class: 'chip ' + (c.nota >= 160 ? 'green' : c.nota >= 80 ? 'blue' : 'rose') }, c.nota + '/200')), h('div', { class: 'bar' }, h('i', { style: 'width:' + (c.nota / 2) + '%' })), h('p', { class: 'muted' }, c.comentario));
    const li = (t, a) => a.length ? h('section', {}, h('h3', { class: 'panel-title' }, t), h('ul', { class: 'alist' }, a.map((x) => h('li', {}, x)))) : null;
    const feedback = 'Sua nota estimada é ' + r.nota + ' de 1000. ' + r.competencias.map((c) => c.nome + ': ' + c.nota + '. ' + c.comentario).join(' ');
    const save = h('button', { class: 'btn' }, 'Salvar como página');
    save.addEventListener('click', async () => {
      save.disabled = true;
      const b = (t, x) => ({ id: uid(), t, x, c: false });
      const blocks = [b('h1', 'Correção de redação: ' + r.nota + '/1000'), b('quote', tema.value.trim() || 'Tema não informado')];
      r.competencias.forEach((c) => { blocks.push(b('h2', c.nome + ' (' + c.nota + '/200)'), b('p', c.comentario)); });
      if (r.melhorias.length) { blocks.push(b('h2', 'O que melhorar')); r.melhorias.forEach((m) => blocks.push(b('todo', m))); }
      if (r.trecho_reescrito) blocks.push(b('h2', 'Trecho melhorado'), b('p', r.trecho_reescrito));
      const id = await createPage({ title: 'Correção: ' + (tema.value.trim() || 'redação'), icon: 'pencil', kind: 'page', content: blocks });
      if (id) { toast('Correção salva como página.', 'ok'); location.hash = '#/pagina/' + id; }
    });
    out.replaceChildren(h('div', { class: 'stack', style: 'margin-top:14px' },
      h('div', { class: 'row' }, h('div', { class: 'score' }, String(r.nota)), h('div', { class: 'grow' }, h('h3', { style: 'font-weight:600;font-size:1.3rem' }, r.nota >= 800 ? 'Excelente!' : r.nota >= 600 ? 'Bom caminho!' : 'Vamos evoluir juntos'), h('p', { class: 'muted' }, 'de 1000 pontos (estimativa pela matriz de competências do ENEM)'))),
      r.competencias.map(bar), li('Pontos fortes', r.pontos_fortes), li('O que melhorar', r.melhorias),
      r.trecho_reescrito ? h('section', { class: 'tile butter' }, h('b', {}, 'Trecho reescrito'), h('p', { style: 'font-weight:600;margin-top:4px' }, r.trecho_reescrito)) : null,
      h('div', { class: 'row' }, save, h('button', { class: 'btn', onclick: () => say(feedback) }, ic('volume', 16), 'Ouvir feedback'))));
  }
  go.addEventListener('click', async () => {
    if (ta.value.trim().length < 300) { msg.textContent = 'Escreva pelo menos 300 caracteres.'; msg.className = 'form-msg err'; sfx.oops(); return; }
    go.disabled = true; msg.textContent = 'O ' + TUCK + ' está lendo com atenção…'; msg.className = 'form-msg ok'; tuck.setMood('think');
    try {
      const r = await callAI({ action: 'essay', tema: tema.value, text: ta.value });
      msg.textContent = '';
      show(r);
      tuck.setMood(r.nota >= 600 ? 'cheer' : 'happy', 3000);
      if (r.nota >= 600) { sfx.mission(); const b = tuck.el.getBoundingClientRect(); burst(b.left + 30, b.top + 20, 30); } else sfx.done();
    } catch (e) { msg.textContent = e.message; msg.className = 'form-msg err'; tuck.setMood('sad', 1500); sfx.oops(); }
    go.disabled = false;
  });
  openModal(h('div', { class: 'stack' }, h('div', { class: 'row' }, tuck.el, h('div', { class: 'grow' }, h('h2', { class: 'modal-title' }, 'Corrigir redação'), h('p', { class: 'muted' }, 'Nota pelas 5 competências do ENEM'))),
    tema, ta, h('div', { class: 'row', style: 'justify-content:space-between' }, cnt, go), msg, out), { wide: true, onClose: () => tuck.destroy() });
}
