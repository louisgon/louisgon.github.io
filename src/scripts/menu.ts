import { TR } from './state';
import { $ } from './util';
import { lenis } from './scroll';

export function initMenu() {
  const mnav = $('mnav'), mbtn = $('mbtn'); mnav.inert = true;
  function setMenu(on: boolean) { mnav.classList.toggle('on', on); mbtn.setAttribute('aria-expanded', String(on)); mbtn.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); mnav.inert = !on; document.documentElement.classList.toggle('tr-lock', on || TR.busy); if (on) { lenis && lenis.stop(); mnav.querySelector('a')!.focus({ preventScroll: true }); } else if (!TR.busy) lenis && lenis.start(); }
  mbtn.addEventListener('click', () => setMenu(!mnav.classList.contains('on')));
  mnav.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) setMenu(false); }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mnav.classList.contains('on')) { setMenu(false); mbtn.focus(); } });
}
