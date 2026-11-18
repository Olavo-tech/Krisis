import { sb, state, h, icon, chip, toast, addXp } from '../core.js';
import { openPlus } from './plus.js';
import { createPage } from './pages.js';
import { uid } from '../core.js';

const FOCUS = [
  { k: 'datas', label: 'Datas', tone: 'sky', v: 'datas de inscrição, isenção, provas e resultados' },
  { k: 'vagas', label: 'Vagas', tone: 'mint', v: 'número de vagas, cotas, remuneração e taxa de inscrição' },
  { k: 'req', label: 'Requisitos', tone: 'butter', v: 'requisitos de escolaridade, idade, documentação e etapas' },
  { k: 'provas', label: 'Provas', tone: 'blush', v: 'conteúdo programático, matérias cobradas, pesos e redação' }
];

const lines = (t) => String(t || '').split(/\r?\n|(?=\s•\s)/).map((s) => s.trim().replace(/^[•\-*]\s*/, '')).filter(Boolean);
const list = (t) => { const ls = lines(t); return ls.length ? h('ul', { class: 'alist' }, ls.map((l) => h('li', {}, l))) : h('p', { class: 'muted' }, '—'); };

export function renderAnalysis(a) {
  const sec = (tone, title, t) => (t ? h('section', { class: 'acard ' + tone }, h('h3', {}, title), list(t)) : null);
  return h('div', { class: 'analysis' },
    h('div', { class: 'a-head' }, h('h2', {}, a.titulo || 'Edital'),
      h('div', { class: 'chips' }, a.status ? chip(a.status, 'green') : null, a.bancaOrgao ? chip(a.bancaOrgao) : null, a.escolaridade ? chip(a.escolaridade) : null)),
    a.resumo ? h('p', { class: 'a-sum' }, a.resumo) : null,
    h('div', { class: 'a-grid' }, sec('sky', 'Datas e prazos', a.datas), sec('mint', 'Vagas, salário e taxa', a.vagas), sec('butter', 'Requisitos e etapas', a.requisitos), sec('blush', 'Provas e conteúdo', a.provas)),
    a.armadilhas ? h('section', { class: 'acard warn' }, h('h3', {}, 'Pontos críticos'), list(a.armadilhas)) : null,
    a.checklist ? h('section', { class: 'acard goal' }, h('h3', {}, 'O que fazer agora'), list(a.checklist)) : null);
}

export function analysisToText(a) {
  return [a.titulo, a.bancaOrgao, a.resumo, a.datas && 'Datas e prazos:\n' + a.datas, a.vagas && 'Vagas e remuneração:\n' + a.vagas,
    a.requisitos && 'Requisitos e etapas:\n' + a.requisitos, a.provas && 'Provas e conteúdo:\n' + a.provas,
    a.armadilhas && 'Pontos críticos:\n' + a.armadilhas, a.checklist && 'O que fazer agora:\n' + a.checklist].filter(Boolean).join('\n\n');
}

export function analysisToBlocks(a) {
  const b = (t, x, c) => ({ id: uid(), t, x, c: !!c });
  const out = [b('h1', a.titulo || 'Edital')];
  if (a.bancaOrgao) out.push(b('p', 'Banca/órgão: ' + a.bancaOrgao));
  if (a.resumo) out.push(b('quote', a.resumo));
  [['Datas e prazos', a.datas], ['Vagas, salário e taxa', a.vagas], ['Requisitos e etapas', a.requisitos], ['Provas e conteúdo', a.provas], ['Pontos críticos', a.armadilhas]].forEach(([title, t]) => {
    if (!t) return;
    out.push(b('h2', title));
    lines(t).forEach((l) => out.push(b('bul', l)));
  });
  if (a.checklist) {
    out.push(b('h2', 'Checklist de ação'));
    lines(a.checklist).forEach((l) => out.push(b('todo', l.replace(/^\d+[.)]\s*/, ''))));
  }
  return out;
}

export async function saveEdital(a) {
  const { error } = await sb.from('editais_salvos').insert({ titulo: String(a.titulo || 'Edital').slice(0, 300), banca_orgao: a.bancaOrgao || null, status: a.status || null, analysis: a });
  if (error) { toast('Não foi possível salvar agora.', 'err'); return false; }
  addXp(15);
  toast('Edital salvo em Meus editais.', 'ok');
  return true;
}

export async function analysisToPage(a) {
  const id = await createPage({ title: String(a.titulo || 'Edital').slice(0, 200), icon: '📋', kind: 'edital', content: analysisToBlocks(a) });
  if (id) location.hash = '#/pagina/' + id;
}

export function analysisActions(a, { saved = false } = {}) {
  return h('div', { class: 'actions' },
    saved ? null : h('button', { class: 'btn green', onclick: (e) => { e.currentTarget.disabled = true; saveEdital(a); } }, 'Salvar edital'),
    h('button', { class: 'btn primary', onclick: () => analysisToPage(a) }, 'Transformar em página'),
    h('button', { class: 'btn', onclick: () => { navigator.clipboard.writeText(analysisToText(a)).then(() => toast('Resumo copiado.', 'ok'), () => toast('Não foi possível copiar.', 'err')); } }, 'Copiar resumo'),
    h('button', { class: 'btn', onclick: () => window.print() }, 'Imprimir ou salvar PDF'),
    h('button', { class: 'btn', onclick: () => openPlus('Plano de estudos gerado por IA') }, icon('lock', 16), 'Plano de estudos com IA'));
}

async function extractPdf(file) {
  if (!window.pdfjsLib) throw new Error('O leitor de PDF ainda está carregando. Tente de novo em instantes.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  const max = Math.min(pdf.numPages, 60);
  for (let i = 1; i <= max; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    text += '\n[Pág. ' + i + '] ' + content.items.map((it) => it.str).join(' ');
    if (text.length >= 47500) break;
  }
  text = text.replace(/\s+/g, ' ').trim().slice(0, 47500);
  if (text.length < 40) throw new Error('Este PDF parece escaneado e não tem texto selecionável. Cole o link ou o texto do edital.');
  return { name: file.name, pages: pdf.numPages, text };
}

export function renderAnalyzer(box) {
  let pdf = null;
  let busy = false;
  const selected = new Set(FOCUS.map((f) => f.k));
  const ta = h('textarea', { placeholder: 'Cole o link oficial (https://…), o texto do edital ou anexe o PDF.', 'aria-label': 'Edital' });
  const file = h('input', { type: 'file', accept: 'application/pdf', style: 'display:none' });
  const pdfPill = h('div', { class: 'row', style: 'display:none' });
  const err = h('div', { class: 'err-box', style: 'display:none', role: 'alert' });
  const out = h('div', {});
  const quota = h('span', { class: 'chip' }, 'Plano grátis');
  const send = h('button', { class: 'btn primary' }, icon('send', 18), 'Analisar');

  const showErr = (m) => { err.textContent = m; err.style.display = m ? '' : 'none'; };
  const paintQuota = () => { const q = state.quota; if (q) quota.textContent = q.dailyRemaining + ' de ' + q.dailyLimit + ' análises hoje'; };
  paintQuota();

  function setPdf(p) {
    pdf = p;
    pdfPill.replaceChildren();
    pdfPill.style.display = p ? '' : 'none';
    if (p) pdfPill.append(chip(p.name + ' (' + p.pages + ' págs.)', 'blue'), h('button', { class: 'btn sm', onclick: () => setPdf(null) }, 'Remover'));
  }
  async function takeFile(f) {
    showErr('');
    if (!f || f.type !== 'application/pdf') { showErr('Selecione um arquivo PDF.'); return; }
    try { setPdf(await extractPdf(f)); } catch (e) { showErr(e.message || 'Não foi possível ler este PDF.'); }
  }
  file.addEventListener('change', () => takeFile(file.files && file.files[0]));

  async function run() {
    if (busy) return;
    showErr('');
    let text = ta.value.trim();
    if (!pdf && !text) { ta.focus(); return; }
    if (!pdf && !/\s/.test(text) && /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]\S*)?$/i.test(text)) text = 'https://' + text;
    const isUrl = /^https?:\/\/\S+$/i.test(text);
    if (!pdf && !isUrl && text.length < 120) { showErr('Anexe o PDF, cole o link oficial (https://…) ou cole o texto completo do edital.'); return; }
    const payload = pdf ? (text ? 'Observação do candidato: ' + text + '\n' : '') + 'Arquivo PDF: ' + pdf.name + '\nConteúdo extraído: ' + pdf.text : text;
    busy = true;
    send.disabled = true;
    out.replaceChildren(h('div', { class: 'tile', style: 'margin-top:16px' }, h('b', {}, 'Lendo o edital…'), h('div', { class: 'skeleton' }), h('div', { class: 'skeleton', style: 'width:80%' }), h('div', { class: 'skeleton', style: 'width:92%' })));
    try {
      const { data } = await sb.auth.getSession();
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') },
        body: JSON.stringify({ target: payload.slice(0, 48000), focuses: FOCUS.filter((f) => selected.has(f.k)).map((f) => f.v), isPdf: !!pdf })
      });
      const j = await r.json().catch(() => null);
      if (j && j.quota) { state.quota = j.quota; paintQuota(); }
      if (!r.ok || !j || j.ok === false) {
        out.replaceChildren();
        showErr((j && j.message) || 'Não foi possível analisar agora. Tente de novo.');
      } else {
        out.replaceChildren(h('div', { style: 'margin-top:16px' }, renderAnalysis(j.analysis), analysisActions(j.analysis)));
        addXp(10);
        ta.value = '';
        setPdf(null);
      }
    } catch (_) {
      out.replaceChildren();
      showErr('Falha de conexão. Verifique a internet e tente de novo.');
    }
    busy = false;
    send.disabled = false;
  }
  send.addEventListener('click', run);

  const chipsRow = h('div', { class: 'chips' }, FOCUS.map((f) => {
    const b = h('button', { class: 'focus-chip on ' + f.tone, type: 'button', 'aria-pressed': 'true' }, f.label);
    b.addEventListener('click', () => {
      if (selected.has(f.k)) selected.delete(f.k); else selected.add(f.k);
      b.classList.toggle('on', selected.has(f.k));
      b.setAttribute('aria-pressed', String(selected.has(f.k)));
    });
    return b;
  }));

  const comp = h('div', { class: 'composer glass' }, ta, pdfPill,
    h('div', { class: 'composer-bar' },
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => file.click() }, icon('attach', 16), 'Anexar PDF'), chipsRow),
      h('div', { class: 'row' }, quota, send)), file);
  comp.addEventListener('dragover', (e) => e.preventDefault());
  comp.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files[0]) takeFile(e.dataTransfer.files[0]); });
  box.append(h('p', { class: 'lead', style: 'margin-bottom:12px' }, 'Receba datas, vagas, requisitos e pontos de atenção em segundos.'), comp, err, out);
}
