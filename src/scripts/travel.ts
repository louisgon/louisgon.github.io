import { pend, reduce, S, TR } from './state';
import { $, wait } from './util';
import { land, lenis, scrollToY } from './scroll';
import { revealEl } from './reveal';
import { heroEnd } from './orbit';

export let revealAt = -1e9;

type Travel = { y?: number | null; action?: (() => unknown) | null; focus?: HTMLElement | null; fast?: boolean };

export async function travel({ y = null, action = null, focus = null, fast = false }: Travel) {
  if (TR.busy) return; TR.busy = true;
  const rm = reduce, q = fast ? [260, 300, 120, 450] : [420, 680, 180, 700]; TR.f = fast ? 0.55 : 1;
  lenis && lenis.stop(); document.documentElement.classList.add('tr-lock'); document.body.classList.remove('tr-in'); document.body.classList.toggle('tr-fast', fast);
  if (!rm) { TR.up = performance.now(); TR.down = 0; TR.dim = 1; }
  document.body.classList.add('tr-out'); await wait(rm ? 180 : q[0]);
  if (action) await action();
  if (!rm) document.body.classList.add('tr-low');
  if (y !== null) { scrollToY(y); S.zone = y < heroEnd() ? 'hero' : 'content'; }
  await wait(rm ? 80 : q[1]);
  TR.dim = 0; if (!rm) { TR.down = performance.now(); await wait(q[2]); }
  document.body.classList.add('tr-in'); document.body.classList.remove('tr-out', 'tr-low'); revealAt = performance.now(); pend.forEach(revealEl); pend.clear();
  if (focus) land(focus, focus.closest<HTMLElement>('.proj'));
  await wait(rm ? 160 : q[3]);
  document.body.classList.remove('tr-in', 'tr-fast');
  if (!$('case').classList.contains('on')) { document.documentElement.classList.remove('tr-lock'); lenis && lenis.start(); }
  idle();
}

export function idle() { TR.busy = false; const nx = TR.next; TR.next = null; if (nx) nx(); }
