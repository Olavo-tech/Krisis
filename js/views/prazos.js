import { sb, h, icon, chip, toast, empty } from '../core.js';

const SRC = '(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?';
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function parseDeadlines(editais) {
  const out = [];
  editais.forEach((e) => {
    const lines = String((e.analysis && e.analysis.datas) || '').split(/\r?\n|(?=\s\u2022\s)/).map((s) => s.trim()).filter(Boolean);
    lines.forEach((raw) => {
      const clean = raw.replace(/^[\u2022\-*]\s*/, '');
      const label = clean.replace(new RegExp(SRC, 'g'), '').replace(/\s{2,}/g, ' ').replace(/\b(de|a|até|ate|e|em|no dia)\s*[,.:;-]?\s*$/i, '').replace(/[\s:;,\-–]+$/, '').trim() || clean;
      const re = new RegExp(SRC, 'g');
      const seen = new Set();
      let m;
      while ((m = re.exec(clean))) {
        const d = Number(m[1]), mo = Number(m[2]);
        if (d < 1 || d > 31 || mo < 1 || mo > 12) continue;
        let y = m[3] ? Number(m[3]) : null;
        if (y !== null && y < 100) y += 2000;
        if (y === null) {
          const base = new Date(e.created_at);
          y = base.getFullYear();
          if (new Date(y, mo - 1, d).getTime() < base.getTime() - 30 * 864e5) y += 1;
        }
        const date = new Date(y, mo - 1, d, 12);
        if (isNaN(date.getTime()) || seen.has(date.getTime())) continue;
        seen.add(date.getTime());
        out.push({ date, label, edital: e.titulo, editalId: e.id });
      }
    });
  });
  out.sort((a, b) => a.date - b.date);
  return out;
}

export async function loadDeadlines() {
  const { data } = await sb.from('editais_salvos').select('id,titulo,analysis,created_at').order('created_at', { ascending: false }).limit(60);
  return parseDeadlines(data || []);
}

export function daysLeft(d) {
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 864e5);
}
export function whenLabel(n) {
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  if (n < 0) return 'Há ' + (-n) + (n === -1 ? ' dia' : ' dias');
  return 'Em ' + n + ' dias';
}

export async function renderPrazos(box) {
  const list = await loadDeadlines();
  box.append(h('p', { class: 'lead', style: 'margin-bottom:14px' }, 'O Krisis lê as datas dos editais que você salvou e mostra o que vence primeiro.'));
  if (!list.length) {
    box.append(empty('Nenhum prazo ainda', 'Analise um edital e toque em Salvar edital. As datas aparecem aqui sozinhas.', h('a', { class: 'btn primary', href: '#/analisar' }, 'Analisar edital')));
    return;
  }
  const row = (d) => {
    const n = daysLeft(d.date);
    const tone = n < 0 ? 'past' : n <= 3 ? 'hot' : n <= 14 ? 'warm' : 'cool';
    const add = h('button', { class: 'btn sm' }, icon('plus', 14), 'Tarefa');
    add.addEventListener('click', async () => {
      add.disabled = true;
      const { error } = await sb.from('tasks').insert({ title: (d.label + ' (' + d.edital + ')').slice(0, 300), due_at: d.date.toISOString(), priority: 2 });
      if (error) { toast('Não foi possível criar a tarefa.', 'err'); add.disabled = false; return; }
      toast('Tarefa criada para ' + d.date.toLocaleDateString('pt-BR') + '.', 'ok');
    });
    return h('div', { class: 'dl ' + tone },
      h('div', { class: 'dl-date' }, h('b', {}, String(d.date.getDate())), h('span', {}, MESES[d.date.getMonth()])),
      h('div', { class: 'dl-body' }, h('div', { class: 'dl-t' }, d.label), h('div', { class: 'muted' }, d.edital)),
      chip(whenLabel(n), n < 0 ? '' : n <= 3 ? 'rose' : 'blue'), n >= 0 ? add : null);
  };
  const groups = [['Próximos 7 dias', (d) => { const n = daysLeft(d.date); return n >= 0 && n <= 7; }],
    ['Neste mês', (d) => { const n = daysLeft(d.date); return n > 7 && n <= 30; }],
    ['Mais adiante', (d) => daysLeft(d.date) > 30],
    ['Já passaram', (d) => { const n = daysLeft(d.date); return n < 0 && n >= -30; }]];
  groups.forEach(([name, fn]) => {
    const items = list.filter(fn);
    if (!items.length) return;
    box.append(h('section', { style: 'margin-bottom:18px' }, h('h3', { class: 'panel-title' }, name), h('div', { class: 'list' }, items.map(row))));
  });
}
