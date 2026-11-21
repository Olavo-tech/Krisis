import { sb, h, icon, toast, confirmBox, empty, fmtDate, chip } from '../core.js';
import { ic } from '../icons.js';
import { gate } from '../ui.js';
import { renderAnalysis, analysisActions } from './analyzer.js';

export async function renderSaved(box) {
  const { data, error } = await sb.from('editais_salvos').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) { box.append(empty('Não foi possível carregar', 'Tente novamente em instantes.')); return; }
  const items = data || [];
  const analyze = gate(h('a', { class: 'btn primary', href: '#/analisar' }, ic('scan', 16), 'Analisar novo edital'));

  function list() {
    box.replaceChildren(h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:12px' }, h('p', { class: 'lead' }, 'Seus editais analisados alimentam o radar de prazos.'), analyze));
    if (!items.length) {
      box.append(empty('Nenhum edital salvo', 'No plano Plus, o Tuck lê o edital e você só salva. Os prazos aparecem sozinhos no radar.'));
      return;
    }
    box.append(h('div', { class: 'grid3' }, items.map((e, i) => h('button', { class: 'subj tone' + (i % 5), onclick: () => detail(e) },
      icon('folder', 22), h('h3', {}, e.titulo), h('div', { class: 'chips' }, e.banca_orgao ? chip(e.banca_orgao) : null, chip(fmtDate(e.created_at)))))));
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
