import { sb, h, state, getStats, store, isPlus, toast } from '../core.js';
import { ic } from '../icons.js';
import { displayName, openAccount } from '../auth.js';
import { createTuck, TUCK } from '../tuck.js';
import { sfx, soundOn, setSound, haptic } from '../sfx.js';
import { canInstall, installApp, isIOS, isStandalone, isMobile, enterFullscreen, inFullscreen, canFullscreen } from '../native.js';
import { toolGrid } from './praticar.js';

const b64ToU8 = (s) => { const raw = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))); };
async function pushApi(body) {
  const { data } = await sb.auth.getSession();
  const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false }));
}
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
async function currentSub() { const reg = await navigator.serviceWorker.ready; return reg.pushManager.getSubscription(); }
async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permissão negada. Libere as notificações nas configurações do navegador.');
  const k = await (await fetch('/api/push-key')).json();
  if (!k.key) throw new Error('Não foi possível ativar agora.');
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(k.key) });
  const r = await pushApi({ action: 'subscribe', subscription: sub.toJSON() });
  if (!r.ok) throw new Error(r.message || 'Não foi possível salvar a inscrição.');
}
async function disablePush() {
  const sub = await currentSub();
  if (sub) { await pushApi({ action: 'unsubscribe', endpoint: sub.endpoint }); await sub.unsubscribe(); }
}

export function renderEu(box) {
  const st = getStats();
  const name = displayName();
  box.append(h('section', { class: 'eu-top pat pat-dots' },
    h('span', { class: 'avatar' }, (name[0] || 'E').toUpperCase()),
    h('div', { class: 'grow' }, h('h2', {}, name), h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'chip green' }, 'Nível ' + st.level), h('span', { class: 'chip' }, st.streak + (st.streak === 1 ? ' dia seguido' : ' dias seguidos')), h('span', { class: 'chip' }, st.xp + ' XP')),
      h('div', { class: 'bar', style: 'margin-top:10px' }, h('i', { style: 'width:' + st.levelXp + '%' })))));

  const tuck = createTuck({ size: 130 });
  const play = (label, fn) => h('button', { class: 'btn sm', onclick: fn }, label);
  box.append(h('section', { class: 'card', style: 'display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:12px' }, tuck.el,
    h('div', { class: 'grow', style: 'min-width:180px' }, h('h3', { style: 'font-size:1.3rem' }, TUCK), h('p', { class: 'muted' }, 'Seu companheiro de estudos. Brinque à vontade.'),
      h('div', { class: 'row', style: 'margin-top:8px' },
        play('Animar', () => { tuck.setMood('cheer', 1600); tuck.quack(); sfx.quack('happy'); }),
        play('Dançar', () => { tuck.setMood('dance', 2400); sfx.quack('giggle'); }),
        play('Acenar', () => { tuck.setMood('wave', 1800); tuck.quack(); sfx.quack('happy'); }),
        play('Dormir', () => { tuck.setMood('sleep', 2600); sfx.yawn(); }),
        play('Girar', () => { tuck.anim('spin', 900); tuck.setMood('happy', 1100); sfx.quack('giggle'); })))));

  const sw = (title, desc, get, set) => {
    const s = h('span', { class: 'sw' + (get() ? ' on' : '') });
    return h('button', { class: 'set', onclick: () => { const v = !get(); set(v); s.classList.toggle('on', v); } }, h('div', { class: 'grow' }, title, h('small', {}, desc)), s);
  };
  box.append(
    sw('Sons', 'Quacks e efeitos', soundOn, (v) => { setSound(v); if (v) sfx.quack('happy'); }),
    sw('Vibração', 'Retorno tátil nos toques (celular)', () => store.get('krisis.haptic', true), (v) => { store.set('krisis.haptic', v); if (v) haptic(20); }),
    isMobile() ? sw('Tela cheia automática', 'Volta para tela cheia no próximo toque', () => store.get('krisis.fs', true), (v) => { store.set('krisis.fs', v); if (v) enterFullscreen(); }) : null,
    sw('Tema escuro', 'Fundo índigo escuro', () => document.documentElement.getAttribute('data-theme') === 'dark', () => document.dispatchEvent(new CustomEvent('krisis:theme-toggle'))));

  const pushSw = h('span', { class: 'sw' });
  const pushDesc = h('small', {}, 'Todo dia de manhã, o ' + TUCK + ' avisa das tarefas e cartões');
  const testBtn = h('button', { class: 'btn sm', style: 'display:none;margin-top:8px', type: 'button' }, 'Enviar um teste agora');
  const pushRow = h('button', { class: 'set', type: 'button' }, ic('sparkle', 20), h('div', { class: 'grow' }, 'Lembretes diários', pushDesc, testBtn), pushSw);
  let pushOn = false;
  const paintPush = () => { pushSw.classList.toggle('on', pushOn); testBtn.style.display = pushOn ? '' : 'none'; };
  if (!pushSupported()) pushDesc.textContent = 'Seu navegador não suporta notificações.';
  else if (isIOS() && !isStandalone()) pushDesc.textContent = 'No iPhone, instale o app na Tela de Início para ativar.';
  else {
    currentSub().then((s) => { pushOn = !!s; paintPush(); }).catch(() => {});
    pushRow.addEventListener('click', async (e) => {
      if (e.target === testBtn) return;
      try {
        if (pushOn) { await disablePush(); pushOn = false; }
        else { await enablePush(); pushOn = true; sfx.quack('happy'); }
      } catch (err) { toast(err.message || 'Não foi possível mudar agora.', 'err'); }
      paintPush();
    });
    testBtn.addEventListener('click', async (e) => { e.stopPropagation(); const r = await pushApi({ action: 'test' }); toast(r.ok ? 'Teste enviado! Olhe suas notificações.' : (r.message || 'Não foi possível enviar.'), r.ok ? 'ok' : 'err'); });
  }
  box.append(pushRow);

  if (!isStandalone()) {
    if (canInstall()) box.append(h('button', { class: 'set', onclick: () => installApp() }, ic('download', 20), h('div', { class: 'grow' }, 'Instalar o app', h('small', {}, 'Abre em tela cheia, direto da tela inicial'))));
    else if (isIOS()) box.append(h('div', { class: 'set' }, ic('download', 20), h('div', { class: 'grow' }, 'Instalar no iPhone', h('small', {}, 'Compartilhar › Adicionar à Tela de Início'))));
    else if (isMobile() && canFullscreen() && !inFullscreen()) box.append(h('button', { class: 'set', onclick: () => enterFullscreen() }, ic('expand', 20), h('div', { class: 'grow' }, 'Entrar em tela cheia', h('small', {}, 'Sem barras do navegador'))));
  }
  box.append(
    h('a', { class: 'set', href: '#/plus' }, ic('sparkle', 20), h('div', { class: 'grow' }, isPlus() ? 'Plano Plus ativo' : 'Conhecer o Eduquack Plus', h('small', {}, isPlus() ? 'Obrigado por apoiar!' : 'IA para estudar mais rápido')), ic('arrow', 16)),
    h('button', { class: 'set', onclick: () => openAccount(() => location.reload()) }, ic('user', 20), h('div', { class: 'grow' }, 'Minha conta', h('small', {}, state.user ? state.user.email : '')), ic('arrow', 16)),
    h('h3', { class: 'panel-title', style: 'margin-top:18px' }, 'Ferramentas'), toolGrid());
}
