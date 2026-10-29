import { S, TR, ez } from './state';
import { $, clamp, nn } from './util';
import { lenis } from './scroll';

const NAVN: Record<string, number> = { hero: 0, intro: 1, stack: 2, work: 3, clients: 3, pilot: 4, contact: 5 };
const SECS = ['hero', 'intro', 'stack', 'work', 'clients', 'pilot', 'contact'];
let navLinks: HTMLAnchorElement[], navAll: HTMLAnchorElement[], navMk: HTMLElement;
let navCur = '', navP = 0;
export let secCur = '';

function placeMk() { const a = navLinks.find((l) => l.classList.contains('on')), was = navMk.classList.contains('on'); navMk.classList.toggle('on', !!a); if (!a || !a.offsetWidth) return;
  const cs = getComputedStyle(a), pl = parseFloat(cs.paddingLeft), w = a.offsetWidth - pl - parseFloat(cs.paddingRight) - parseFloat(cs.letterSpacing || '0');
  if (!was) navMk.style.transition = 'none'; navMk.style.transform = `translate3d(${a.offsetLeft + pl}px, ${a.offsetTop + a.offsetHeight - 4}px, 0) scale3d(${w.toFixed(2)}, 1, 1)`;
  if (!was) { void navMk.offsetWidth; navMk.style.transition = ''; } }

export function setNav(cur: string) { navCur = cur; const id = cur === 'clients' ? 'work' : cur; navAll.forEach((a) => { const on = a.getAttribute('href') === `#${id}`; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); placeMk();
  const n = nn(NAVN[cur] ?? 0), el = $('navNum'); if (el.textContent !== n) el.textContent = n; }

export function initNav() {
  navLinks = [...document.querySelectorAll<HTMLAnchorElement>('nav .links a')]; navAll = [...navLinks, ...$('mnav').querySelectorAll('a')]; navMk = $('navMk');
  addEventListener('resize', placeMk); document.fonts && document.fonts.ready.then(placeMk);
}

export function navTick(now: number) {
  let cur = 'hero'; SECS.forEach((id) => { const r = $(id).getBoundingClientRect(); if (r.top < innerHeight * 0.45 && r.bottom > innerHeight * 0.45) cur = id; }); if (S.navIntent) { const age = now - S.navIntentT; if ((age > 300 && !TR.busy && !(lenis && lenis.isScrolling)) || age > 4000) S.navIntent = null; else cur = S.navIntent; } if (cur !== navCur) setNav(cur); if (cur !== secCur) { const first = secCur === ''; secCur = cur; if (!first && NAVN[cur] > 1) S.boost = Math.max(S.boost, 0.4); }
  const pmax = document.documentElement.scrollHeight - innerHeight; navP = ez(navP, clamp((S.navIntent ? S.navIntentY : scrollY) / pmax), 5, 5); $('navProg').style.transform = `scale3d(${navP.toFixed(4)}, 1, 1)`;
}

export const navSolidTick = () => $('nav').classList.toggle('solid', scrollY > 1);
