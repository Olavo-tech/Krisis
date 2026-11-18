import { h, state, getStats, store, isPlus } from '../core.js';
import { ic } from '../icons.js';
import { displayName, openAccount } from '../auth.js';
import { createKri, bindPoke, speak, MASCOT } from '../mascot.js';
import { sfx, soundOn, setSound, haptic } from '../sfx.js';
import { canInstall, installApp, isIOS, isStandalone, isMobile, enterFullscreen, inFullscreen, canFullscreen } from '../native.js';

export function renderEu(box) {
  const st = getStats();
  const name = displayName();
  box.append(h('section', { class: 'eu-top pat pat-dots' },
    h('span', { class: 'avatar' }, (name[0] || 'K').toUpperCase()),
    h('div', { class: 'grow' }, h('h2', {}, name), h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'chip green' }, 'Nível ' + st.level), h('span', { class: 'chip' }, st.streak + (st.streak === 1 ? ' dia seguido' : ' dias seguidos')), h('span', { class: 'chip' }, st.xp + ' XP')),
      h('div', { class: 'bar', style: 'margin-top:10px' }, h('i', { style: 'width:' + st.levelXp + '%' })))));

  const kri = createKri({ size: 130 });
  bindPoke(kri);
  const play = (label, fn) => h('button', { class: 'btn sm', onclick: fn }, label);
  box.append(h('section', { class: 'card', style: 'display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:12px' }, kri.el,
    h('div', { class: 'grow', style: 'min-width:180px' }, h('h3', { style: 'font-weight:800;font-size:1.2rem' }, MASCOT), h('p', { class: 'muted' }, 'Seu companheiro de estudos. Brinque à vontade.'),
      h('div', { class: 'row', style: 'margin-top:8px' },
        play('Animar', () => { kri.setMood('cheer', 1600); sfx.chirp('happy'); kri.say('Eba!', 1800); }),
        play('Dormir', () => { kri.setMood('sleep', 2600); sfx.yawn(); }),
        play('Cócegas', () => { kri.anim('spin', 900); kri.setMood('happy', 1100); sfx.chirp('giggle'); kri.say('Hihi!', 1800); }),
        play('Assustar', () => { kri.shake(); kri.setMood('sad', 1200); sfx.oops(); })))));

  const sw = (title, desc, get, set) => {
    const s = h('span', { class: 'sw' + (get() ? ' on' : '') });
    const row = h('button', { class: 'set', onclick: () => { const v = !get(); set(v); s.classList.toggle('on', v); } }, h('div', { class: 'grow' }, title, h('small', {}, desc)), s);
    return row;
  };
  box.append(
    sw('Sons fofos', 'Efeitos e a voz do ' + MASCOT, soundOn, (v) => { setSound(v); if (v) sfx.chirp('happy'); }),
    sw('Vibração', 'Retorno tátil nos toques (celular)', () => store.get('krisis.haptic', true), (v) => { store.set('krisis.haptic', v); if (v) haptic(20); }),
    isMobile() ? sw('Tela cheia automática', 'Volta para tela cheia no próximo toque', () => store.get('krisis.fs', true), (v) => { store.set('krisis.fs', v); if (v) enterFullscreen(); }) : null,
    sw('Tema escuro', 'Preto com laranja', () => document.documentElement.getAttribute('data-theme') === 'dark', () => document.dispatchEvent(new CustomEvent('krisis:theme-toggle'))));

  if (!isStandalone()) {
    if (canInstall()) box.append(h('button', { class: 'set', onclick: async () => { const ok = await installApp(); if (ok) speak('App instalado!', 2500); } }, ic('download', 20), h('div', { class: 'grow' }, 'Instalar o app', h('small', {}, 'Abre em tela cheia, direto da tela inicial'))));
    else if (isIOS()) box.append(h('div', { class: 'set' }, ic('download', 20), h('div', { class: 'grow' }, 'Instalar no iPhone', h('small', {}, 'Compartilhar › Adicionar à Tela de Início'))));
    else if (isMobile() && canFullscreen() && !inFullscreen()) box.append(h('button', { class: 'set', onclick: () => enterFullscreen() }, ic('expand', 20), h('div', { class: 'grow' }, 'Entrar em tela cheia', h('small', {}, 'Sem barras do navegador'))));
  }
  box.append(
    h('a', { class: 'set', href: '#/plus' }, ic('sparkle', 20), h('div', { class: 'grow' }, isPlus() ? 'Plano Plus ativo' : 'Conhecer o Krisis Plus', h('small', {}, isPlus() ? 'Obrigado por apoiar!' : 'IA para estudar mais rápido')), ic('arrow', 16)),
    h('button', { class: 'set', onclick: () => openAccount(() => location.reload()) }, ic('user', 20), h('div', { class: 'grow' }, 'Minha conta', h('small', {}, state.user ? state.user.email : '')), ic('arrow', 16)));
}
