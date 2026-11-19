import { h, state, isPlus, openModal } from '../core.js';
import { ic } from '../icons.js';
import { callAI, listen, hasVoice, say } from '../api.js';
import { createKri, MASCOT, react } from '../mascot.js';
import { openPlus } from './plus.js';
import { sfx } from '../sfx.js';

function gatherContext() {
  const parts = [];
  const blocks = [...document.querySelectorAll('.blocks textarea')].map((t) => t.value).filter(Boolean).join('\n');
  if (blocks) parts.push(blocks);
  const an = document.querySelector('.analysis');
  if (an) parts.push(an.innerText);
  return parts.join('\n\n').slice(0, 6000);
}

// Chat com o Krispim: responde com base no que está aberto na tela.
export function openTutor(initial) {
  if (!isPlus()) { openPlus('O tutor ' + MASCOT + ' com IA'); return; }
  const context = gatherContext();
  const kri = createKri({ size: 60 });
  kri.locked = true;
  const chat = h('div', { class: 'chat' });
  const input = h('input', { class: 'input', placeholder: 'Pergunte qualquer coisa…', maxlength: '800', 'aria-label': 'Pergunta' });
  const send = h('button', { class: 'btn primary', 'aria-label': 'Enviar' }, ic('send', 18));
  let rec = null, busy = false;
  const mic = h('button', { class: 'btn', 'aria-label': 'Ditar', type: 'button' }, ic('mic', 18));
  let close = () => {};

  const add = (cls, text, speakable) => {
    const m = h('div', { class: 'msg ' + cls }, text);
    if (speakable) m.append(h('div', {}, h('button', { class: 'btn sm', style: 'margin-top:8px', onclick: () => say(text) }, ic('volume', 14), 'Ouvir')));
    chat.append(m); chat.scrollTop = chat.scrollHeight;
    return m;
  };
  async function ask(q) {
    q = (q || input.value).trim();
    if (!q || busy) return;
    busy = true; input.value = '';
    add('me', q);
    const typing = h('div', { class: 'msg bot' }, h('span', { class: 'typing' }, h('i'), h('i'), h('i')));
    chat.append(typing); chat.scrollTop = chat.scrollHeight;
    kri.setMood('think'); sfx.chirp('curious');
    try {
      const r = await callAI({ action: 'tutor', question: q, context });
      typing.remove(); add('bot', r.answer, true);
      kri.setMood('happy', 1400); sfx.chirp('happy');
    } catch (e) {
      typing.remove(); add('bot', e.message);
      kri.setMood('sad', 1400); sfx.oops();
    }
    busy = false; input.focus();
  }
  send.addEventListener('click', () => ask());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); });
  mic.addEventListener('click', () => {
    if (rec) { rec.stop(); return; }
    rec = listen({ onText: (t) => { input.value = t; }, onEnd: () => { rec = null; mic.classList.remove('rec'); } });
    if (!rec) { add('bot', 'Seu navegador não suporta ditado por voz. Use o Chrome.'); return; }
    mic.classList.add('rec'); sfx.chirp('curious'); rec.start();
  });
  const chips = ['Resuma isso em 5 linhas', 'Crie 3 perguntas para eu treinar', 'Explique como se eu tivesse 12 anos'].map((t) => h('button', { class: 'cmd-chip', onclick: () => ask(t) }, t));

  close = openModal(h('div', { class: 'stack' },
    h('div', { class: 'row' }, kri.el, h('div', { class: 'grow' }, h('h2', { class: 'modal-title' }, MASCOT), h('p', { class: 'muted' }, context ? 'Estou lendo o que está na sua tela.' : 'Pergunte o que quiser sobre seus estudos.'))),
    chat, h('div', { class: 'cmd-chips' }, chips), h('div', { class: 'chat-in' }, input, hasVoice() ? mic : null, send)), { wide: true, onClose: () => { if (rec) rec.stop(); kri.destroy(); } });
  add('bot', 'Oi! Eu sou o ' + MASCOT + '. Em que posso ajudar?');
  if (initial) ask(initial);
}
