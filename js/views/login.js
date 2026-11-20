import { sb, h, toast } from '../core.js';
import { ic } from '../icons.js';
import { logoMark } from '../ui.js';
import { createTuck, burst, TUCK } from '../tuck.js';
import { sfx, haptic } from '../sfx.js';

const TR = { 'Invalid login credentials': 'E-mail ou senha incorretos.', 'User already registered': 'Este e-mail já tem conta. Que tal entrar?', 'Email not confirmed': 'Confirme seu e-mail para entrar.' };

// Entrar / criar conta, com o Tuck reagindo a cada campo.
export function openAuthScreen(mode = 'signup') {
  let m = mode;
  const tuck = createTuck({ size: 150 });
  tuck.locked = true;
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
      h('div', { class: 'auth-top pat pat-dots' }, x, tuck.el, title, sub),
      h('div', { class: 'auth-form' }, nameBox, email, h('div', { class: 'pw' }, pass, eye), msg, submit, toggle)));

  function paint() {
    const login = m === 'login';
    title.textContent = login ? 'Bem-vindo de volta!' : 'Vamos começar?';
    sub.textContent = login ? 'Eu sou o ' + TUCK + ' e estava com saudade.' : 'Eu sou o ' + TUCK + ' e vou estudar com você.';
    submit.textContent = login ? 'Entrar' : 'Criar minha conta';
    toggle.textContent = login ? 'Ainda não tem conta? Criar agora' : 'Já tem conta? Entrar';
    nameBox.style.display = login ? 'none' : '';
    pass.autocomplete = login ? 'current-password' : 'new-password';
    msg.textContent = '';
  }
  const lookAt = (el) => () => { tuck.setMood('idle'); tuck.lookAt(el, 0); sfx.quack('curious'); };
  name.addEventListener('focus', lookAt(name));
  email.addEventListener('focus', lookAt(email));
  [name, email].forEach((el) => el.addEventListener('input', () => { tuck.nudge(); sfx.tick(); tuck.lookAt(el, Math.min(1, el.value.length / 28)); }));
  pass.addEventListener('focus', () => { tuck.setMood('hide'); });
  pass.addEventListener('blur', () => { if (pass.type === 'password') tuck.setMood('idle'); });
  pass.addEventListener('input', () => { sfx.tick(); tuck.nudge(); });
  eye.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    tuck.setMood(show ? 'peek' : 'hide');
    if (show) sfx.quack('curious');
  });

  const oops = (t) => { setMsg(t); tuck.setMood('sad', 1600); tuck.shake(); sfx.oops(); haptic(30); };
  async function go() {
    const em = email.value.trim(), pw = pass.value;
    if (!em.includes('@') || pw.length < 6) { oops('Informe um e-mail válido e uma senha com 6 ou mais caracteres.'); return; }
    submit.disabled = true;
    setMsg(m === 'login' ? 'Entrando…' : 'Criando sua conta…', true);
    tuck.setMood('think');
    let res;
    if (m === 'login') res = await sb.auth.signInWithPassword({ email: em, password: pw });
    else res = await sb.auth.signUp({ email: em, password: pw, options: { data: { display_name: name.value.trim() || em.split('@')[0] } } });
    submit.disabled = false;
    if (res.error) { oops(TR[res.error.message] || res.error.message || 'Não foi possível continuar. Tente de novo.'); return; }
    if (!res.data.session) { setMsg('Conta criada! Confirme seu e-mail para entrar.', true); tuck.setMood('happy', 1400); sfx.quack('happy'); return; }
    tuck.setMood('cheer'); tuck.quack();
    const r = tuck.el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 44);
    sfx.mission(); haptic(40);
    setTimeout(close, 1000);
  }
  function close() {
    document.removeEventListener('keydown', onKey);
    ov.classList.remove('in');
    setTimeout(() => { tuck.destroy(); ov.remove(); }, 400);
  }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  submit.addEventListener('click', go);
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  toggle.addEventListener('click', () => { m = m === 'login' ? 'signup' : 'login'; paint(); sfx.quack('curious'); });
  x.addEventListener('click', close);
  document.body.append(ov);
  paint();
  requestAnimationFrame(() => requestAnimationFrame(() => { ov.classList.add('in'); setTimeout(() => { tuck.setMood('happy', 1000); tuck.quack(); sfx.quack('happy'); }, 450); }));
}
