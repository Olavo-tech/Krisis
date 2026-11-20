// Compatibilidade: módulos antigos importam daqui. O mascote agora é o Tuck (js/tuck.js), que não fala.
import { createTuck, react, burst, TUCK } from './tuck.js';

export { react, burst };
export const MASCOT = TUCK;
export const createKri = (o = {}) => createTuck(o);
export const speak = () => {};
export const bindPoke = () => {};
export const startMascot = () => {};
export const unmountPet = () => {};
