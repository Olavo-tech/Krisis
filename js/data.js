// Dados de pastas, tópicos (trilha) e fontes, com a lógica de domínio e pontos fracos.
import { sb, uid } from './core.js';

export async function loadSubjects() {
  const { data } = await sb.from('subjects').select('*').order('created_at', { ascending: false });
  return data || [];
}
export async function loadTopics(subjectId) {
  let q = sb.from('topics').select('*').order('position').order('created_at');
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data } = await q;
  return data || [];
}

// Domínio suavizado: poucos acertos não fecham o tópico.
export const mastery = (t) => (t.total ? (t.correct + 1) / (t.total + 2) : 0);
export function stars(t) {
  if (!t.total || t.total < 5) return 0;
  const m = t.correct / t.total;
  return m >= 0.9 ? 3 : m >= 0.75 ? 2 : m >= 0.5 ? 1 : 0;
}
export const isDone = (t) => t.status === 'done' || stars(t) >= 2;
export function progressOf(topics) {
  if (!topics.length) return { pct: 0, done: 0, total: 0 };
  const done = topics.filter(isDone).length;
  const partial = topics.filter((t) => !isDone(t) && t.total).reduce((s, t) => s + Math.min(0.9, mastery(t)) * 0.5, 0);
  return { pct: Math.min(100, Math.round(((done + partial) / topics.length) * 100)), done, total: topics.length };
}
export const weakTopics = (topics) => topics.filter((t) => t.total && !isDone(t) && mastery(t) < 0.75).sort((a, b) => mastery(a) - mastery(b));

export async function sourcesText(subjectId, max = 6000) {
  const { data } = await sb.from('sources').select('title,content').eq('subject_id', subjectId).order('created_at', { ascending: false }).limit(6);
  let out = '';
  for (const s of data || []) { out += '[' + s.title + '] ' + s.content.slice(0, 1800) + '\n'; if (out.length >= max) break; }
  return out.slice(0, max);
}

// Registra o resultado de uma lição: atualiza domínio e a lista de conceitos a reforçar.
export async function recordLesson(topic, { correct, total, wrong, right }) {
  const weak = new Set(topic.weak || []);
  (wrong || []).forEach((c) => { if (c) weak.add(c); });
  (right || []).forEach((c) => { for (const w of [...weak]) if (String(w).toLowerCase() === String(c).toLowerCase()) weak.delete(w); });
  const upd = { correct: topic.correct + correct, total: topic.total + total, weak: [...weak].slice(-12), last_practiced: new Date().toISOString() };
  const next = { ...topic, ...upd };
  if (stars(next) >= 2) upd.status = 'done';
  await sb.from('topics').update(upd).eq('id', topic.id);
  return { ...topic, ...upd };
}

export function blocksFrom(titulo, blocos) {
  const b = (t, x) => ({ id: uid(), t, x, c: false });
  return [b('h1', titulo), ...blocos.map((x) => b(x.t, x.x))];
}
export async function insertPage({ title, blocks, subject_id = null, icon = 'book', kind = 'page' }) {
  const { data, error } = await sb.from('pages').insert({ title: String(title).slice(0, 200), icon, kind, content: blocks, subject_id }).select('id').single();
  if (error) return null;
  document.dispatchEvent(new CustomEvent('krisis:pages'));
  return data.id;
}
export async function findOrCreateDeck(title, subject_id = null) {
  const ex = await sb.from('flashcard_decks').select('id').eq('title', title).limit(1);
  if (ex.data && ex.data[0]) return ex.data[0].id;
  const nd = await sb.from('flashcard_decks').insert({ title: title.slice(0, 200), subject_id }).select('id').single();
  return nd.data ? nd.data.id : null;
}
