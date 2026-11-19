import { sb, state, h, toast, addXp, isPlus, uid, openModal, confirmBox } from '../core.js';
import { ic } from '../icons.js';
import { callAI, say } from '../api.js';
import { openPlus } from './plus.js';
import { createPage, loadPages } from './pages.js';
import { createKri, burst, MASCOT } from '../mascot.js';
import { sfx, haptic } from '../sfx.js';

const L = 'ABCD';

async function pageText(id) {
  const { data } = await sb.from('pages').select('title,content').eq('id', id).maybeSingle();
  if (!data) return '';
  return (data.title + '\n' + (Array.isArray(data.content) ? data.content.map((b) => b.x).filter(Boolean).join('\n') : '')).slice(0, 12000);
}

/* ---------- Simulado em tela cheia, estilo lição ---------- */
function lesson(qs, title) {
  let i = 0, right = 0, sel = -1, checked = false;
  const wrongs = [];
  const kri = createKri({ size: 84 });
  kri.locked = true;
  const bar = h('i', {});
  const counter = h('span', { class: 'chip' });
  const body = h('div', { class: 'ls-body' });
  const foot = h('div', { class: 'ls-foot' });
  const xb = h('button', { class: 'icon-btn', 'aria-label': 'Sair', type: 'button' }, ic('x', 22));
  const ov = h('div', { class: 'lesson', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'ls-top' }, xb, h('div', { class: 'bar grow' }, bar), counter), body, foot);
  const exit = () => { kri.destroy(); ov.remove(); };
  xb.addEventListener('click', async () => { if (await confirmBox('Sair do simulado? Seu progresso será perdido.', 'Sair', true)) exit(); });

  function draw() {
    checked = false; sel = -1;
    const q = qs[i];
    bar.style.width = Math.round(i / qs.length * 100) + '%';
    counter.textContent = (i + 1) + ' de ' + qs.length;
    kri.setMood('idle');
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
      if (!ok) { opts[sel].classList.add('wrong'); wrongs.push(q); } else right++;
      if (ok) sfx.done(); else sfx.oops();
      haptic(ok ? 15 : 35);
      kri.setMood(ok ? 'cheer' : 'sad', 1600);
      if (ok) { const r = kri.el.getBoundingClientRect(); burst(r.left + 40, r.top + 20, 14); }
      const cont = h('button', { class: 'btn green block big' }, i === qs.length - 1 ? 'Ver resultado' : 'Continuar');
      cont.addEventListener('click', () => { i++; if (i < qs.length) draw(); else finish(); });
      foot.replaceChildren(h('div', { class: 'fb ' + (ok ? 'ok' : 'no') }, h('b', {}, ok ? 'Isso aí!' : 'Quase! A certa é a ' + L[q.answer] + '.'), h('p', {}, q.explanation)), cont);
    });
    body.replaceChildren(h('div', { class: 'ls-kri' }, kri.el, h('span', { class: 'muted' }, title || 'Simulado')), h('h2', { class: 'ls-q' }, q.q), h('div', { class: 'stack' }, opts));
    foot.replaceChildren(check);
  }

  async function finish() {
    bar.style.width = '100%';
    const pct = Math.round(right / qs.length * 100);
    const xp = right * 5 + 10;
    addXp(xp);
    let saved = 0;
    if (wrongs.length) {
      try {
        let deckId = null;
        const ex = await sb.from('flashcard_decks').select('id').eq('title', 'Caderno de erros').limit(1);
        if (ex.data && ex.data[0]) deckId = ex.data[0].id;
        else { const nd = await sb.from('flashcard_decks').insert({ title: 'Caderno de erros' }).select('id').single(); deckId = nd.data && nd.data.id; }
        if (deckId) {
          const { error } = await sb.from('flashcards').insert(wrongs.map((q) => ({ deck_id: deckId, front: q.q.slice(0, 2000), back: ('Resposta: ' + q.options[q.answer] + '. ' + q.explanation).slice(0, 4000) })));
          if (!error) saved = wrongs.length;
        }
      } catch (_) { /* segue sem salvar */ }
    }
    kri.setMood(pct >= 70 ? 'cheer' : 'happy', 4000);
    if (pct >= 70) { sfx.mission(); const r = kri.el.getBoundingClientRect(); burst(r.left + 40, r.top + 30, 46); } else sfx.done();
    const end = h('button', { class: 'btn green block big' }, 'Concluir');
    end.addEventListener('click', exit);
    body.replaceChildren(h('div', { class: 'ls-kri' }, kri.el),
      h('h2', { class: 'ls-q' }, pct >= 70 ? 'Mandou bem!' : 'Bom treino!'),
      h('div', { class: 'res-big' }, right + ' de ' + qs.length),
      h('div', { class: 'row' }, h('span', { class: 'chip green' }, '+' + xp + ' XP'), h('span', { class: 'chip' }, pct + '% de acerto')),
      saved ? h('p', { class: 'lead' }, saved + (saved === 1 ? ' erro virou cartão' : ' erros viraram cartões') + ' no baralho Caderno de erros. Eles voltam na hora certa para você fixar.') : h('p', { class: 'lead' }, 'Sem erros desta vez. Continue assim!'));
    foot.replaceChildren(end);
  }
  document.body.append(ov);
  draw();
}

/* ---------- Escolher o material do simulado ---------- */
export async function openQuizSetup() {
  if (!isPlus()) { openPlus('Simulados gerados por IA'); return; }
  await loadPages();
  const [edR, dkR] = await Promise.all([
    sb.from('editais_salvos').select('id,titulo,analysis').order('created_at', { ascending: false }).limit(30),
    sb.from('flashcard_decks').select('id,title').order('created_at', { ascending: false }).limit(30)
  ]);
  const eds = edR.data || [], decks = dkR.data || [];
  let close = () => {};
  const kind = h('select', { class: 'input' }, [['text', 'Colar um texto'], ['page', 'Uma das minhas páginas'], ['edital', 'Um edital salvo'], ['deck', 'Um baralho']].map(([v, l]) => h('option', { value: v }, l)));
  const ta = h('textarea', { class: 'input', rows: '6', placeholder: 'Cole o material de estudo…' });
  const selPage = h('select', { class: 'input' }, state.pages.map((p) => h('option', { value: p.id }, p.title || 'Sem título')));
  const selEd = h('select', { class: 'input' }, eds.map((e) => h('option', { value: e.id }, e.titulo)));
  const selDeck = h('select', { class: 'input' }, decks.map((d) => h('option', { value: d.id }, d.title)));
  const count = h('select', { class: 'input' }, [5, 8, 10].map((n) => h('option', Object.assign({ value: String(n) }, n === 8 ? { selected: true } : {}), n + ' questões')));
  const holder = h('div', {});
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const paint = () => { const k = kind.value; holder.replaceChildren(k === 'text' ? ta : k === 'page' ? selPage : k === 'edital' ? selEd : selDeck); };
  kind.addEventListener('change', paint); paint();
  const go = h('button', { class: 'btn primary big' }, ic('target', 18), 'Criar simulado');
  go.addEventListener('click', async () => {
    msg.className = 'form-msg';
    const k = kind.value;
    let text = '', title = 'Simulado';
    if (k === 'text') text = ta.value.trim();
    else if (k === 'page') { if (selPage.value) { text = await pageText(selPage.value); title = selPage.options[selPage.selectedIndex].text; } }
    else if (k === 'edital') { const e = eds.find((x) => x.id === selEd.value); if (e) { const a = e.analysis || {}; text = [e.titulo, a.provas, a.requisitos, a.datas, a.resumo].filter(Boolean).join('\n'); title = e.titulo; } }
    else if (k === 'deck') { const { data } = await sb.from('flashcards').select('front,back').eq('deck_id', selDeck.value).limit(60); text = (data || []).map((c) => c.front + ': ' + c.back).join('\n').slice(0, 12000); title = selDeck.options[selDeck.selectedIndex].text; }
    if (text.length < 80) { msg.textContent = 'Esse material é curto demais. Escolha outro ou cole mais texto.'; msg.className = 'form-msg err'; sfx.oops(); return; }
    go.disabled = true; msg.textContent = 'O ' + MASCOT + ' está montando as questões…'; msg.className = 'form-msg ok';
    try {
      const r = await callAI({ action: 'quiz', text, count: Number(count.value) });
      sfx.magic(); close(); lesson(r.questions, title);
    } catch (e) { msg.textContent = e.message; msg.className = 'form-msg err'; sfx.oops(); go.disabled = false; }
  });
  close = openModal(h('div', { class: 'stack' }, h('h2', { class: 'modal-title' }, 'Simulado com IA'), h('p', { class: 'muted' }, 'Escolha o material. Os erros viram cartões sozinhos.'),
    h('label', { class: 'field' }, 'Material', kind), holder, h('label', { class: 'field' }, 'Quantidade', count), msg, go), { wide: true });
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
  const kri = createKri({ size: 70 });
  kri.locked = true;

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
      h('div', { class: 'row' }, h('div', { class: 'score' }, String(r.nota)), h('div', { class: 'grow' }, h('h3', { style: 'font-weight:800;font-size:1.3rem' }, r.nota >= 800 ? 'Excelente!' : r.nota >= 600 ? 'Bom caminho!' : 'Vamos evoluir juntos'), h('p', { class: 'muted' }, 'de 1000 pontos (estimativa pela matriz de competências do ENEM)'))),
      r.competencias.map(bar), li('Pontos fortes', r.pontos_fortes), li('O que melhorar', r.melhorias),
      r.trecho_reescrito ? h('section', { class: 'tile butter' }, h('b', {}, 'Trecho reescrito'), h('p', { style: 'font-weight:500;margin-top:4px' }, r.trecho_reescrito)) : null,
      h('div', { class: 'row' }, save, h('button', { class: 'btn', onclick: () => say(feedback) }, ic('volume', 16), 'Ouvir feedback'))));
  }
  go.addEventListener('click', async () => {
    if (ta.value.trim().length < 300) { msg.textContent = 'Escreva pelo menos 300 caracteres.'; msg.className = 'form-msg err'; sfx.oops(); return; }
    go.disabled = true; msg.textContent = 'O ' + MASCOT + ' está lendo com atenção…'; msg.className = 'form-msg ok'; kri.setMood('think');
    try {
      const r = await callAI({ action: 'essay', tema: tema.value, text: ta.value });
      msg.textContent = '';
      show(r);
      kri.setMood(r.nota >= 600 ? 'cheer' : 'happy', 3000);
      if (r.nota >= 600) { sfx.mission(); const b = kri.el.getBoundingClientRect(); burst(b.left + 30, b.top + 20, 30); } else sfx.done();
    } catch (e) { msg.textContent = e.message; msg.className = 'form-msg err'; kri.setMood('sad', 1500); sfx.oops(); }
    go.disabled = false;
  });
  openModal(h('div', { class: 'stack' }, h('div', { class: 'row' }, kri.el, h('div', { class: 'grow' }, h('h2', { class: 'modal-title' }, 'Corrigir redação'), h('p', { class: 'muted' }, 'Nota pelas 5 competências do ENEM'))),
    tema, ta, h('div', { class: 'row', style: 'justify-content:space-between' }, cnt, go), msg, out), { wide: true, onClose: () => kri.destroy() });
}
