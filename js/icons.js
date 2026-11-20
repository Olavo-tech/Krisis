import { icon as base } from './core.js';

const EXTRA = {
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  wand: '<path d="M5 19L17 7M14 4l1.5 2.5L18 8l-2.5 1.5L14 12l-1.5-2.5L10 8l2.5-1.5zM19 14l.8 1.4 1.4.8-1.4.8-.8 1.4-.8-1.4-1.4-.8 1.4-.8z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>',
  volume: '<path d="M4 10v4h4l5 4V6l-5 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  clipboard: '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5a3 3 0 0 1 6 0M9 11h6M9 15h4"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  duck: '<circle cx="12" cy="9" r="5.5"/><path d="M9.500 11.500c1.500-1 3.500-1 5 0-.5 1.800-4.500 1.800-5 0z"/><path d="M7 15c-1.500 1.500-2 3-2 5M17 15c1.500 1.500 2 3 2 5M9 21h6"/><path d="M9.500 7.500h.01M14.500 7.500h.01"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.500 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.500"/>',
  chest: '<rect x="3" y="10" width="18" height="10" rx="2"/><path d="M3 14h18M12 14v3M5 10a7 5 0 0 1 14 0"/>',
  dumbbell: '<path d="M6 7v10M3 9.500v5M18 7v10M21 9.500v5M6 12h12"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.500 2.500 4 2.500S16 14 16 14M9 9.500h.01M15 9.500h.01"/>'
};

export function ic(name, size = 20) {
  if (!EXTRA[name]) return base(name, size);
  const s = document.createElement('span');
  s.className = 'ico';
  s.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + EXTRA[name] + '</svg>';
  return s;
}
