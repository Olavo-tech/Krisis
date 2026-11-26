import { sb, h } from '../core.js';
import { ic } from '../icons.js';
import { createKri, burst, MASCOT } from '../mascot.js';
import { sfx, haptic } from '../sfx.js';

const TR = { 'Invalid login credentials': 'E-mail ou senha incorretos.', 'User already registered': 'Este e-mail já tem conta. Que tal entrar?', 'Email not confirmed': 'Confirme seu e-mail para entrar.' };

// Tela de entrar/criar conta com o Tuck reagindo a cada campo.
export function openAuthScreen(mode = 'signup') {
  let m = mode;
  const kri = createKri({ size: 150 });
  kri.locked = true;
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const setMsg = (t, ok) => { msg.textContent = t; msg.className = 'form-msg ' + (ok ? 'ok' : 'err'); };
  const name = h('input', { class: 'input', placeholder: 'Seu nome', autocomplete: 'name', 'aria-label': 'Nome' });
  const email = h('input', { class: 'input', type: 'email', placeholder: 'E-mail', autocomplete: 'email', inputmode: 'email', 'aria-label': 'E-mail' });
  const pass = h('input', { class: 'input', type: 'password', placeholder: 'Senha (6 ou mais)', 'aria-label': 'Senha' });
  const eye = h('button', { type: 'button', 'aria-label': 'Mostrar senha' }, ic('eye', 20));
  const nameBox = h('div', {}, name);
  const title = h('h2', {});
  const sub = h('p', {});
  const submit = h('button', { class: 'btn green block big', style: 'height:56px' });
  const toggle = h('button', { class: 'link', type: 'button' });
  const x = h('button', { class: 'auth-x', 'aria-label': 'Fechar', type: 'button' }, ic('x', 18));
  const ov = h('div', { class: 'auth-screen', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'auth-card' },
      h('div', { class: 'auth-top pat pat-dots' }, x, kri.el, title, sub),
      h('div', { class: 'auth-form' }, nameBox, email, h('div', { class: 'pw' }, pass, eye), msg, submit, toggle)));

  function paint() {
    const login = m === 'login';
    title.textContent = login ? 'Bem-vindo de volta!' : 'Vamos começar?';
    sub.textContent = login ? 'Eu sou o ' + MASCOT + ' e estava com saudade.' : 'Eu sou o ' + MASCOT + ' e vou estudar com você.';
    submit.textContent = login ? 'Entrar' : 'Criar minha conta';
    toggle.textContent = login ? 'Ainda não tem conta? Criar agora' : 'Já tem conta? Entrar';
    nameBox.style.display = login ? 'none' : '';
    pass.autocomplete = login ? 'current-password' : 'new-password';
    msg.textContent = '';
  }
  const lookAt = (el) => () => { kri.setMood('idle'); kri.lookAt(el, 0); sfx.chirp('curious'); };
  name.addEventListener('focus', lookAt(name));
  email.addEventListener('focus', lookAt(email));
  [name, email].forEach((el) => el.addEventListener('input', () => { kri.nudge(); sfx.tick(); kri.lookAt(el, Math.min(1, el.value.length / 28)); }));
  pass.addEventListener('focus', () => { kri.setMood('hide'); sfx.chirp('hum'); });
  pass.addEventListener('blur', () => { if (pass.type === 'password') { kri.setMood('idle'); } });
  pass.addEventListener('input', () => { sfx.tick(); kri.nudge(); });
  eye.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    kri.setMood(show ? 'peek' : 'hide');
    if (show) sfx.chirp('curious');
  });

  const oops = (t) => { setMsg(t); kri.setMood('sad', 1600); kri.shake(); sfx.oops(); haptic(30); };
  async function go() {
    const em = email.value.trim(), pw = pass.value;
    if (!em.includes('@') || pw.length < 6) { oops('Informe um e-mail válido e uma senha com 6 ou mais caracteres.'); return; }
    submit.disabled = true;
    setMsg(m === 'login' ? 'Entrando…' : 'Criando sua conta…', true);
    kri.setMood('think');
    let res;
    if (m === 'login') res = await sb.auth.signInWithPassword({ email: em, password: pw });
    else res = await sb.auth.signUp({ email: em, password: pw, options: { data: { display_name: name.value.trim() || em.split('@')[0] } } });
    submit.disabled = false;
    if (res.error) { oops(TR[res.error.message] || res.error.message || 'Não foi possível continuar. Tente de novo.'); return; }
    if (!res.data.session) { setMsg('Conta criada! Confirme seu e-mail para entrar.', true); kri.setMood('happy', 1400); sfx.chirp('happy'); return; }
    kri.setMood('cheer');
    const r = kri.el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 44);
    sfx.mission(); haptic(40);
    setTimeout(close, 1000);
  }
  function close() {
    document.removeEventListener('keydown', onKey);
    ov.classList.remove('in');
    setTimeout(() => { kri.destroy(); ov.remove(); }, 400);
  }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  submit.addEventListener('click', go);
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  toggle.addEventListener('click', () => { m = m === 'login' ? 'signup' : 'login'; paint(); sfx.chirp('curious'); });
  x.addEventListener('click', close);
  document.body.append(ov);
  paint();
  requestAnimationFrame(() => requestAnimationFrame(() => { ov.classList.add('in'); setTimeout(() => { kri.setMood('happy', 1000); sfx.chirp('happy'); }, 450); }));
}
