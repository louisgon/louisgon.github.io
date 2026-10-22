import { pend, TR } from './state';
import { $ } from './util';
import { decode } from './scramble';

export let io: IntersectionObserver;

export function revealEl(el: Element) { if (el.classList.contains('cr')) { el.classList.add('shown'); return; } if (el.classList.contains('in')) return; el.classList.add('in'); if (el.classList.contains('chd')) { decode(el.querySelector('h2')!, 260); io.unobserve(el); } if (el.classList.contains('h2')) decode(el as HTMLElement, 150); if (el.classList.contains('proj')) { el.querySelectorAll('.rv').forEach((c) => c.classList.add('in')); decode(el.querySelector('h3')!, 350); } if (el.matches('#pilot .pt')) { $('pilot').querySelector('.holo-wrap')!.classList.add('in'); setTimeout(() => revealEl($('pilot').querySelector('.h2')!), 60); } }

export const settle = (el: Element) => { if (el.classList.contains('in')) return; const ns = [el, ...el.querySelectorAll('img')] as HTMLElement[]; ns.forEach((n) => (n.style.transition = 'none')); revealEl(el); void (el as HTMLElement).offsetWidth; ns.forEach((n) => (n.style.transition = '')); };

export function initDividers() {
  const sdIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('go'); sdIO.unobserve(e.target); } }), { threshold: 1 });
  document.querySelectorAll('.sdiv').forEach((d) => sdIO.observe(d));
}

export function initReveal() {
  io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; if (TR.busy) pend.add(e.target); else revealEl(e.target); }), { threshold: 0.15 });
  document.querySelectorAll('.rv:not(.proj .rv):not(#pilot .holo-wrap), .h2:not(#pilot .h2), .proj').forEach((el) => io.observe(el));
  new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const pt = $('pilot').querySelector('.pt')!; if (TR.busy) pend.add(pt); else revealEl(pt); }), { threshold: 0.2 }).observe($('pilot'));
  ['#stack .hd', '#work .hd', '#clients', '#pilot .pt', '#contact .sg'].forEach((c) => io.observe(document.querySelector(c)!));
}
