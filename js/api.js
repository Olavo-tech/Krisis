import { sb } from './core.js';

export async function callAI(body) {
  const { data } = await sb.auth.getSession();
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.ok === false) {
    const e = new Error((j && j.message) || 'Não foi possível gerar agora. Tente de novo.');
    e.code = j && j.code;
    throw e;
  }
  return j.result;
}

export const hasVoice = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Ditado por voz (poupa digitação). Retorna o reconhecedor ou null se o navegador não suporta.
export function listen({ onText, onEnd }) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return null;
  const r = new R();
  r.lang = 'pt-BR'; r.interimResults = true; r.continuous = true;
  let final = '';
  r.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) final += res[0].transcript + ' '; else interim += res[0].transcript;
    }
    onText(final + interim);
  };
  r.onend = () => { if (onEnd) onEnd(); };
  r.onerror = () => { if (onEnd) onEnd(); };
  return r;
}

export function say(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = 1.02; u.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (_) { /* sem voz */ }
}

// Extrai o texto de um PDF no navegador (sem enviar o arquivo).
export async function pdfText(file, { maxPages = 40, maxChars = 40000 } = {}) {
  if (!window.pdfjsLib) throw new Error('O leitor de PDF ainda está carregando. Tente de novo.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const c = await (await pdf.getPage(i)).getTextContent();
    text += ' ' + c.items.map((it) => it.str).join(' ');
    if (text.length >= maxChars) break;
  }
  text = text.replace(/\s+/g, ' ').trim().slice(0, maxChars);
  if (text.length < 80) throw new Error('Este PDF parece escaneado e não tem texto selecionável.');
  return { name: file.name, pages: pdf.numPages, text };
}
