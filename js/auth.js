import { sb, state, h, openModal, toast, confirmBox, isPlus } from './core.js';

export async function loadProfile() {
  if (!state.user) { state.profile = null; return; }
  const { data } = await sb.from('profiles').select('id,display_name,plan,plan_expires_at').eq('id', state.user.id).maybeSingle();
  state.profile = data || null;
}

export function displayName() {
  const u = state.user;
  if (!u) return '';
  const m = u.user_metadata || {};
  return (state.profile && state.profile.display_name) || m.display_name || (u.email || '').split('@')[0];
}

export function openAuth(mode = 'login') {
  let current = mode;
  let close = () => {};
  const msg = h('div', { class: 'form-msg', role: 'status' });
  const setMsg = (t, ok) => { msg.textContent = t; msg.className = 'form-msg ' + (ok ? 'ok' : 'err'); };
  const name = h('input', { class: 'input', placeholder: 'Como quer ser chamado', autocomplete: 'name' });
  const email = h('input', { class: 'input', type: 'email', placeholder: 'voce@exemplo.com', autocomplete: 'email' });
  const pass = h('input', { class: 'input', type: 'password', placeholder: 'Mínimo de 6 caracteres' });
  const nameField = h('label', { class: 'field' }, 'Nome', name);
  const title = h('h2', { class: 'modal-title' });
  const submit = h('button', { class: 'btn primary block' });
  const toggle = h('button', { class: 'link', type: 'button' });

  function paint() {
    const login = current === 'login';
    title.textContent = login ? 'Bem-vindo de volta' : 'Crie sua conta grátis';
    submit.textContent = login ? 'Entrar' : 'Criar conta';
    toggle.textContent = login ? 'Ainda não tem conta? Criar agora' : 'Já tem conta? Entrar';
    nameField.style.display = login ? 'none' : '';
    pass.autocomplete = login ? 'current-password' : 'new-password';
    msg.textContent = '';
  }

  async function go() {
    const em = email.value.trim();
    const pw = pass.value;
    if (!em.includes('@') || pw.length < 6) { setMsg('Informe um e-mail válido e uma senha com 6 ou mais caracteres.'); return; }
    submit.disabled = true;
    setMsg(current === 'login' ? 'Entrando…' : 'Criando sua conta…', true);
    let res;
    if (current === 'login') res = await sb.auth.signInWithPassword({ email: em, password: pw });
    else res = await sb.auth.signUp({ email: em, password: pw, options: { data: { display_name: name.value.trim() || em.split('@')[0] } } });
    submit.disabled = false;
    if (res.error) { setMsg(res.error.message || 'Não foi possível continuar. Tente de novo.'); return; }
    if (!res.data.session) { setMsg('Conta criada! Confirme seu e-mail para entrar.', true); return; }
    close();
  }

  submit.addEventListener('click', go);
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  toggle.addEventListener('click', () => { current = current === 'login' ? 'signup' : 'login'; paint(); });
  close = openModal(h('div', { class: 'stack' },
    title,
    h('p', { class: 'muted' }, 'Salve editais, monte seu plano e estude sem sair do site.'),
    nameField,
    h('label', { class: 'field' }, 'E-mail', email),
    h('label', { class: 'field' }, 'Senha', pass),
    msg, submit, toggle));
  paint();
}

export function openAccount(onChange) {
  let close = () => {};
  const msg = h('div', { class: 'form-msg' });
  const setMsg = (t, ok) => { msg.textContent = t; msg.className = 'form-msg ' + (ok ? 'ok' : 'err'); };
  const name = h('input', { class: 'input', value: displayName() });
  const pw = h('input', { class: 'input', type: 'password', placeholder: 'Nova senha (6 ou mais)', autocomplete: 'new-password' });

  async function saveName() {
    const v = name.value.trim();
    if (v.length < 2) { setMsg('Use pelo menos 2 caracteres no nome.'); return; }
    const { error } = await sb.auth.updateUser({ data: { display_name: v } });
    if (error) { setMsg(error.message); return; }
    await sb.from('profiles').update({ display_name: v }).eq('id', state.user.id);
    await loadProfile();
    setMsg('Nome atualizado.', true);
    if (onChange) onChange();
  }
  async function savePass() {
    if (pw.value.length < 6) { setMsg('A senha precisa ter 6 ou mais caracteres.'); return; }
    const { error } = await sb.auth.updateUser({ password: pw.value });
    if (error) { setMsg(error.message); return; }
    pw.value = '';
    setMsg('Senha alterada.', true);
  }
  async function logout() { close(); await sb.auth.signOut(); }
  async function del() {
    const ok = await confirmBox('Isso apaga sua conta, páginas, tarefas e cartões. Não dá para desfazer.', 'Excluir conta', true);
    if (!ok) return;
    const { error } = await sb.rpc('delete_own_account');
    if (error) { setMsg('Não foi possível excluir agora. Tente novamente.'); return; }
    close();
    await sb.auth.signOut();
    toast('Conta excluída.');
  }

  close = openModal(h('div', { class: 'stack' },
    h('h2', { class: 'modal-title' }, 'Sua conta'),
    h('div', { class: 'row' }, h('span', { class: 'muted' }, state.user.email), h('span', { class: 'chip ' + (isPlus() ? 'plus' : '') }, isPlus() ? 'Plano Plus' : 'Plano grátis')),
    h('label', { class: 'field' }, 'Nome de exibição', h('div', { class: 'row' }, h('div', { class: 'grow' }, name), h('button', { class: 'btn sm', onclick: saveName }, 'Salvar'))),
    h('label', { class: 'field' }, 'Nova senha', h('div', { class: 'row' }, h('div', { class: 'grow' }, pw), h('button', { class: 'btn sm', onclick: savePass }, 'Alterar'))),
    msg,
    h('div', { class: 'row' }, h('button', { class: 'btn grow', onclick: logout }, 'Sair da conta'), h('button', { class: 'btn danger', onclick: del }, 'Excluir conta'))));
}
