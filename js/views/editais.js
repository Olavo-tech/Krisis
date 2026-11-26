import { sb, h, icon, toast, confirmBox, empty, fmtDate, chip } from '../core.js';
import { renderAnalysis, analysisActions, saveEdital } from './analyzer.js';

export async function renderSaved(box) {
  const { data, error } = await sb.from('editais_salvos').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) { box.append(empty('Não foi possível carregar', 'Tente novamente em instantes.')); return; }
  const items = data || [];

  function list() {
    box.replaceChildren();
    const manual = h('details', { class: 'worked-example' }, h('summary', {}, 'Adicionar conteúdo programático'));
    const title = h('input', { class: 'input', required: true, maxlength: 200 });
    const syllabus = h('textarea', { class: 'input', required: true, rows: 5, maxlength: 10000 });
    const submit = h('button', { class: 'learn-primary', type: 'submit' }, 'Salvar edital');
    manual.append(h('form', { class: 'learn-form', onsubmit: async event => {
      event.preventDefault();
      if (!title.value.trim() || !syllabus.value.trim() || submit.disabled) return;
      submit.disabled = true;
      try {
        const analysis = { titulo: title.value.trim(), provas: syllabus.value.trim() };
        if (await saveEdital(analysis)) {
          box.replaceChildren(h('a', { class: 'btn', href: '#/hoje' }, 'Voltar à trilha'),
            renderAnalysis(analysis), analysisActions(analysis, { saved: true }));
        }
      } finally { submit.disabled = false; }
    } }, h('label', {}, 'Nome do edital', title), h('label', {}, 'Matérias e tópicos indicados no edital', syllabus), submit));
    box.append(manual);
    if (!items.length) {
      box.append(empty('Nenhum edital salvo', 'Analise um edital e toque em Salvar edital para guardá-lo aqui.', h('a', { class: 'btn primary', href: '#/analisar' }, 'Analisar edital')));
      return;
    }
    box.append(h('div', { class: 'deck-grid' }, items.map((e) => h('button', { class: 'tile sky', style: 'text-align:left;display:flex;flex-direction:column;gap:6px', onclick: () => detail(e) },
      icon('folder', 22), h('b', {}, e.titulo), h('div', { class: 'chips' }, e.banca_orgao ? chip(e.banca_orgao) : null, chip(fmtDate(e.created_at)))))));
  }

  function detail(e) {
    box.replaceChildren(
      h('div', { class: 'row', style: 'margin-bottom:10px' },
        h('button', { class: 'btn sm', onclick: list }, 'Voltar'),
        h('button', { class: 'btn sm danger', onclick: async () => {
          if (!(await confirmBox('Excluir este edital salvo?', 'Excluir', true))) return;
          const { error: er } = await sb.from('editais_salvos').delete().eq('id', e.id);
          if (er) { toast('Não foi possível excluir.', 'err'); return; }
          items.splice(items.indexOf(e), 1);
          toast('Edital excluído.');
          list();
        } }, icon('trash', 16), 'Excluir')),
      renderAnalysis(e.analysis), analysisActions(e.analysis, { saved: true }));
  }
  list();
}
