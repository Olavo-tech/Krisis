import { sb, h, toast, addXp, isPlus, uid } from '../core.js';
import { ic } from '../icons.js';
import { callAI, listen, hasVoice, say } from '../api.js';
import { openPlus } from './plus.js';
import { createPage } from './pages.js';
import { react, burst, MASCOT } from '../mascot.js';
import { sfx, haptic } from '../sfx.js';

async function extractPdf(file) {
  if (!window.pdfjsLib) throw new Error('O leitor de PDF ainda está carregando. Tente de novo.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
    const c = await (await pdf.getPage(i)).getTextContent();
    text += ' ' + c.items.map((it) => it.str).join(' ');
    if (text.length >= 13500) break;
  }
  text = text.replace(/\s+/g, ' ').trim().slice(0, 13500);
  if (text.length < 80) throw new Error('Este PDF parece escaneado e não tem texto selecionável.');
  return { name: file.name, pages: pdf.numPages, text };
}

export function renderMagico(box) {
  let pdf = null, rec = null, base = '';
  const ta = h('textarea', { class: 'mg-ta', placeholder: 'Cole um texto, um link ou uma anotação. Ou use os atalhos abaixo.', 'aria-label': 'Material' });
  const file = h('input', { type: 'file', accept: 'application/pdf', style: 'display:none' });
  const pdfPill = h('div', { class: 'row', style: 'display:none;margin-top:6px' });
  const err = h('div', { class: 'err-box', style: 'display:none', role: 'alert' });
  const out = h('div', {});
  const go = h('button', { class: 'btn primary big block' }, ic('wand', 18), 'Organizar com IA');
  const showErr = (m) => { err.textContent = m; err.style.display = m ? '' : 'none'; };

  try {
    const s = JSON.parse(sessionStorage.getItem('krisis.share') || 'null');
    if (s) { ta.value = [s.title, s.text, s.url].filter(Boolean).join('\n'); sessionStorage.removeItem('krisis.share'); }
  } catch (_) { /* sem compartilhamento */ }

  const tool = (cls, i, label, fn) => { const b = h('button', { class: 'mg-tool ' + cls, type: 'button', onclick: fn }, ic(i, 22), label); return b; };
  const mic = tool('d', 'mic', 'Ditar por voz', () => {
    if (rec) { rec.stop(); return; }
    rec = listen({ onText: (t) => { ta.value = base + t; }, onEnd: () => { rec = null; mic.classList.remove('rec'); } });
    if (!rec) { showErr('Seu navegador não suporta ditado por voz. Use o Chrome.'); return; }
    base = ta.value ? ta.value + ' ' : '';
    mic.classList.add('rec'); sfx.chirp('curious'); rec.start();
  });
  const tools = h('div', { class: 'mg-tools' },
    tool('a', 'clipboard', 'Colar da área de transferência', async () => { try { ta.value = await navigator.clipboard.readText(); sfx.pop(); } catch (_) { showErr('Não consegui acessar a área de transferência. Cole no campo.'); } }),
    tool('b', 'attach', 'Anexar PDF', () => file.click()),
    hasVoice() ? mic : null,
    tool('c', 'link', 'Colar um link', async () => { try { const t = await navigator.clipboard.readText(); if (/^https?:\/\//i.test(t.trim())) { ta.value = t.trim(); sfx.pop(); } else showErr('A área de transferência não tem um link.'); } catch (_) { showErr('Cole o link no campo.'); } }));

  function setPdf(p) {
    pdf = p; pdfPill.replaceChildren(); pdfPill.style.display = p ? '' : 'none';
    if (p) pdfPill.append(h('span', { class: 'chip blue' }, p.name + ' (' + p.pages + ' págs.)'), h('button', { class: 'btn sm', onclick: () => setPdf(null) }, 'Remover'));
  }
  file.addEventListener('change', async () => {
    showErr('');
    const f = file.files && file.files[0];
    if (!f) return;
    try { setPdf(await extractPdf(f)); sfx.pop(); } catch (e) { showErr(e.message); }
  });

  function render(r) {
    const pageOn = { on: true };
    const cards = r.cartoes.map((c) => ({ ...c, on: true }));
    const tasks = r.tarefas.map((t) => ({ ...t, on: true }));
    const btn = h('button', { class: 'btn green big block mg-go' });
    const count = () => { const n = (pageOn.on ? 1 : 0) + cards.filter((c) => c.on).length + tasks.filter((t) => t.on).length; btn.textContent = n ? 'Criar tudo (' + n + ')' : 'Nada selecionado'; btn.disabled = !n; };
    const row = (item, body, extra) => h('label', { class: 'mg-row' }, h('input', { type: 'checkbox', class: 'round', checked: true, onchange: (e) => { item.on = e.target.checked; count(); } }), h('span', {}, body), extra || null);
    const speakBtn = h('button', { class: 'btn sm', onclick: () => say(r.resumo) }, ic('volume', 16), 'Ouvir resumo');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      let pageId = null;
      const b = (t, x) => ({ id: uid(), t, x, c: false });
      if (pageOn.on) {
        const blocks = [b('h1', r.titulo)];
        if (r.resumo) blocks.push(b('quote', r.resumo));
        if (r.topicos.length) { blocks.push(b('h2', 'Tópicos')); r.topicos.forEach((t) => blocks.push(b('bul', t))); }
        pageId = await createPage({ title: r.titulo, icon: 'file', kind: 'page', content: blocks });
      }
      const cs = cards.filter((c) => c.on);
      if (cs.length) {
        const { data: dk, error } = await sb.from('flashcard_decks').insert({ title: r.titulo.slice(0, 200) }).select('id').single();
        if (!error) await sb.from('flashcards').insert(cs.map((c) => ({ deck_id: dk.id, front: c.front, back: c.back })));
      }
      const ts = tasks.filter((t) => t.on);
      if (ts.length) await sb.from('tasks').insert(ts.map((t) => ({ title: t.titulo.slice(0, 300), due_at: t.quando ? new Date(t.quando + 'T12:00:00').toISOString() : null, priority: t.quando ? 2 : 1 })));
      addXp(20);
      sfx.mission(); haptic(40);
      burst(window.innerWidth / 2, window.innerHeight / 2, 50);
      react('cheer', 2200);
      toast('Tudo criado! O ' + MASCOT + ' adorou.', 'ok');
      location.hash = pageId ? '#/pagina/' + pageId : '#/hoje';
    });
    count();
    out.replaceChildren(h('div', { class: 'mg-res' },
      h('div', { class: 'tile lime pat pat-dots' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', { style: 'font-size:1.2rem' }, r.titulo), speakBtn), h('p', { style: 'font-weight:500;margin-top:6px' }, r.resumo)),
      h('section', {}, h('h3', { class: 'panel-title' }, 'Página de estudo'), row(pageOn, 'Criar uma página com o resumo e ' + r.topicos.length + ' tópicos')),
      cards.length ? h('section', {}, h('h3', { class: 'panel-title' }, 'Cartões (' + cards.length + ')'), h('div', { class: 'list' }, cards.map((c) => row(c, h('span', {}, h('b', {}, c.front), h('br'), c.back))))) : null,
      tasks.length ? h('section', {}, h('h3', { class: 'panel-title' }, 'Tarefas (' + tasks.length + ')'), h('div', { class: 'list' }, tasks.map((t) => row(t, t.titulo, t.quando ? h('span', { class: 'chip blue' }, t.quando.split('-').reverse().slice(0, 2).join('/')) : null)))) : null,
      btn));
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function run() {
    showErr('');
    if (!isPlus()) { openPlus('A captura mágica com IA'); return; }
    let text = ta.value.trim();
    if (pdf) text = (text ? text + '\n\n' : '') + pdf.text;
    if (!text) { ta.focus(); return; }
    const isUrl = !pdf && /^https?:\/\/\S+$/i.test(text);
    go.disabled = true;
    react('think', 0);
    out.replaceChildren(h('div', { class: 'tile', style: 'margin-top:14px' }, h('b', {}, 'O ' + MASCOT + ' está lendo e organizando…'), h('div', { class: 'skeleton' }), h('div', { class: 'skeleton', style: 'width:80%' }), h('div', { class: 'skeleton', style: 'width:92%' })));
    try {
      const r = await callAI(isUrl ? { action: 'organize', url: text } : { action: 'organize', text });
      render(r);
      sfx.magic(); react('happy', 1400);
    } catch (e) {
      out.replaceChildren();
      showErr(e.message);
      sfx.oops(); react('sad', 1500);
    }
    go.disabled = false;
  }
  go.addEventListener('click', run);

  box.append(
    h('div', { class: 'row', style: 'margin-bottom:10px' }, h('span', { class: 'sticker' }, 'jogue qualquer coisa'), isPlus() ? null : h('span', { class: 'chip plus' }, 'Recurso Plus')),
    h('p', { class: 'lead', style: 'margin-bottom:12px' }, 'Cole, dite ou envie um PDF. Eu transformo em página, cartões e tarefas, sem você digitar nada.'),
    h('div', { class: 'mg-drop' }, ta, pdfPill, file), tools, go, err, out);
}
