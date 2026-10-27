import { caseHTML, planetHTML } from '../lib/case';
import { pageMeta } from '../lib/pages';
import { caseAt, PROJECTS } from './data';
import { pend, reduce, S, TR } from './state';
import { $, bez, visible, wait } from './util';
import { centerY, land, lenis, scrollToY } from './scroll';
import { idle, travel } from './travel';
import { io, revealEl, settle } from './reveal';
import { orbit } from './planets';

type Step = 'push' | 'replace' | null;

const DOC = performance.timeOrigin;
let caseI = 0, fillI = -1, fillP: Promise<unknown> | null = null, caseRet: HTMLElement | null = null, caseIO: IntersectionObserver, direct = false;
const bgInert = new Map<Element, boolean>();

function route(i: number | null, step: Step) {
  const m = pageMeta(i === null ? undefined : PROJECTS[i]), c = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!;
  if (step === 'push') history.pushState({ doc: DOC }, '', m.path); else if (step === 'replace') history.replaceState(history.state, '', m.path);
  document.title = m.title; document.querySelector('meta[name="description"]')!.setAttribute('content', m.description); c.href = new URL(m.path, c.href).href;
}

function caseLife() {
  const c = $('caseIn'); io.observe(c.querySelector('.chd')!); c.querySelectorAll<HTMLElement>('.cr').forEach((el, i) => { el.style.transitionDelay = `${Math.min(i, 3) * 0.08}s`; caseIO.observe(el); });
  const shot = c.querySelector<HTMLElement>('.hero-shot')!; shot.addEventListener('pointermove', (e) => { if (reduce || e.pointerType !== 'mouse') return; const r = shot.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; shot.style.transform = `perspective(1400px) rotate3d(1, 0, 0, ${-y * 5}deg) rotate3d(0, 1, 0, ${x * 7}deg)`; }); shot.addEventListener('pointerleave', () => (shot.style.transform = ''));
}
const caseReady = () => Promise.all(([...$('case').querySelectorAll('img')].map((m) => m.decode().catch(() => {})) as Promise<unknown>[]).concat(document.fonts ? [document.fonts.ready] : []));
function fillCase(i: number) { caseI = i; if (fillI === i && fillP) return fillP; fillI = i; $('caseIn').innerHTML = caseHTML(PROJECTS, i); $('cpw').innerHTML = planetHTML(PROJECTS, i); return (fillP = caseReady()); }
function setBgInert(on: boolean) { if (on) [...document.body.children].forEach((el) => { if (el.id === 'case' || el.tagName === 'SCRIPT' || el.tagName === 'CANVAS' || bgInert.has(el)) return; bgInert.set(el, (el as HTMLElement).inert); (el as HTMLElement).inert = true; }); else { bgInert.forEach((v, el) => ((el as HTMLElement).inert = v)); bgInert.clear(); } }
const caseReturn = (pic?: HTMLElement) => (caseRet && caseRet.isConnected && caseRet.closest<HTMLElement>('.proj') && caseRet.closest<HTMLElement>('.proj')!.dataset.i === String(caseI) ? caseRet : pic || document.querySelector<HTMLElement>(`.proj[data-i="${caseI}"] .acts [data-case]`));
function showCase(i: number, filled?: boolean) { if (!filled) fillCase(i); fillI = -1; $('case').classList.add('on'); document.body.classList.add('case-open'); $('case').scrollTop = 0; document.documentElement.classList.add('case-lock'); caseLife(); setBgInert(true); $('case').setAttribute('aria-label', `${PROJECTS[i].title} case study`); }
function hideCase() { $('case').classList.remove('on'); document.body.classList.remove('case-open'); document.documentElement.classList.remove('case-lock'); setBgInert(false); }
function openCase(i: number, step: Step) { if (TR.busy) { TR.next = () => openCase(i, step); return; } route(i, step); travel({ fast: $('case').classList.contains('on'), action: () => fillCase(i).then(() => showCase(i, true)) }).then(() => land($('caseIn').querySelector<HTMLElement>('.back')!, $('case'))); }
function closeCase() { if (TR.busy) { TR.next = closeCase; return; } const r = caseReturn(); travel({ focus: r, action: () => { hideCase(); if (r) scrollToY(centerY(r.closest('.proj')!)); } }); }
function ghostAt(r: DOMRect, src: string, rad: number, tag?: Element | null) { const g = document.createElement('div'); g.className = 'flyer'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = `<img src="${src}" alt="">`; if (tag) g.append(tag.cloneNode(true)); Object.assign(g.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: `${rad}px`, visibility: 'hidden' }); document.body.append(g); return (g.firstChild as HTMLImageElement).decode().catch(() => {}).then(() => g); }
const FLYE = bez(0.65, 0, 0.2, 1);
const flyTo = (g: HTMLElement, a: DOMRect, el: HTMLElement, ms: number) => new Promise<void>((res) => { const t0 = performance.now(); (function f(n: number) { const k = Math.min(1, (n - t0) / ms), e = FLYE(k), b = el.getBoundingClientRect(), sc = 1 + (b.width / a.width - 1) * e; g.style.transform = `translate3d(${((b.left - a.left) * e).toFixed(2)}px, ${((b.top - a.top) * e).toFixed(2)}px, 0) scale3d(${sc.toFixed(4)}, ${sc.toFixed(4)}, 1)`; if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
async function flyCase(i: number, pic: HTMLElement, step: Step) {
  if (TR.busy) return; TR.busy = TR.casing = true; route(i, step); lenis && lenis.stop(); document.documentElement.classList.add('tr-lock');
  pic.style.transition = 'none'; pic.style.transform = ''; const a = pic.getBoundingClientRect(), [g] = await Promise.all([ghostAt(a, PROJECTS[i].shot, 14, pic.querySelector('.tag')), fillCase(i)]);
  g.style.visibility = ''; pic.style.visibility = 'hidden'; pic.style.transition = ''; S.boost = Math.max(S.boost, 0.6);
  document.body.classList.add('fly-out'); g.classList.add('go');
  showCase(i, true); const shot = $('caseIn').querySelector<HTMLElement>('.hero-shot')!; shot.classList.add('held', 'shown'); const b = shot.getBoundingClientRect();
  g.style.borderRadius = `${(14 + (16 * a.width) / b.width) / 2}px`;
  await flyTo(g, a, shot, reduce ? 300 : 620); shot.classList.remove('held'); g.remove(); pic.style.visibility = ''; document.body.classList.remove('fly-out');
  revealEl($('caseIn').querySelector('.chd')!); pend.forEach(revealEl); pend.clear(); land($('caseIn').querySelector<HTMLElement>('.back')!, $('case')); TR.casing = false; idle();
}
async function flyBack(step: Step) {
  if (TR.busy) { TR.next = () => flyBack(step); return; } route(null, step); const pic = document.querySelector<HTMLElement>(`.proj[data-i="${caseI}"] .pic`), shot = $('caseIn').querySelector<HTMLElement>('.hero-shot');
  if (shot) { shot.style.transition = 'none'; shot.style.transform = ''; void shot.offsetWidth; } const b = shot && shot.getBoundingClientRect();
  if (reduce || !pic || !b || b.bottom < 60 || b.top > innerHeight - 60) { closeCase(); return; }
  TR.busy = true; const g = await ghostAt(b, PROJECTS[caseI].shot, 16); g.style.visibility = ''; shot!.style.visibility = 'hidden';
  $('case').classList.add('leaving'); document.body.classList.add('fly-back');
  hideCase(); const proj = pic.closest<HTMLElement>('.proj')!; scrollToY(centerY(proj));
  pic.style.transform = ''; proj.querySelectorAll('.rv').forEach(settle);
  const a = pic.getBoundingClientRect(); pic.style.visibility = 'hidden'; g.style.borderRadius = `${(16 + (14 * b.width) / a.width) / 2}px`;
  await flyTo(g, b, pic, 560); pic.style.visibility = ''; g.remove(); document.body.classList.remove('fly-back'); $('case').classList.remove('leaving'); pend.forEach(revealEl); pend.clear();
  document.documentElement.classList.remove('tr-lock'); lenis && lenis.start(); land(caseReturn(pic)!, pic.closest<HTMLElement>('.proj')); idle();
}
async function fadeBack(step: Step) {
  route(null, step); TR.busy = true; direct = false; const proj = document.querySelector<HTMLElement>(`.proj[data-i="${caseI}"]`)!; scrollToY(centerY(proj)); proj.querySelectorAll('.rv').forEach(settle);
  $('case').classList.add('leaving'); document.body.classList.add('fly-out', 'fade-back'); document.body.classList.remove('case-open'); await wait(240);
  hideCase(); scrollToY(centerY(proj)); await wait(80);
  document.body.classList.add('fly-back'); document.body.classList.remove('fly-out'); await wait(380); document.body.classList.remove('fly-back', 'fade-back'); $('case').classList.remove('leaving'); pend.forEach(revealEl); pend.clear();
  document.documentElement.classList.remove('tr-lock'); lenis && lenis.start(); land(caseReturn(proj.querySelector<HTMLElement>('.pic')!)!, proj); idle();
}
const close = (step: Step) => (direct ? fadeBack(step) : flyBack(step));
function leave() { if (TR.busy) { TR.next = leave; return; } if (!$('case').classList.contains('on')) return; const ours = history.state?.doc === DOC; close(ours ? null : 'push'); if (ours) history.back(); }
function sync() {
  if (TR.busy) { TR.next = sync; return; } const i = caseAt(location.pathname), on = $('case').classList.contains('on');
  if (i < 0) { if (on) close(null); else route(null, null); return; }
  if (on) { if (i !== caseI) openCase(i, null); else route(i, null); return; }
  caseRet = null; const pic = document.querySelector<HTMLElement>(`.proj[data-i="${i}"] .pic`)!; if (reduce || !visible(pic)) openCase(i, null); else flyCase(i, pic, null);
}
async function adopt(i: number) {
  caseI = i; direct = true; TR.busy = true; lenis && lenis.stop(); document.documentElement.classList.add('tr-lock');
  await caseReady(); showCase(i, true); pend.forEach(revealEl); pend.clear(); idle(); land($('caseIn').querySelector<HTMLElement>('.back')!, $('case'));
}

export function initCases() {
  caseIO = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; caseIO.unobserve(e.target); if (TR.busy) pend.add(e.target); else revealEl(e.target); }), { root: $('case'), threshold: 0.12 });
  setTimeout(() => (window.requestIdleCallback || setTimeout)(() => { if (!TR.busy && !$('case').classList.contains('on')) { fillCase(0); void $('case').offsetHeight; } }), 4000);
  const warm = (e: Event) => { const p = (e.target as Element).closest<HTMLElement>('.proj'); if (p && !TR.busy && !$('case').classList.contains('on')) fillCase(Number(p.dataset.i)); };
  $('projects').addEventListener('pointerover', warm, { passive: true }); $('projects').addEventListener('focusin', warm);
  $('projects').addEventListener('click', (e) => { const a = (e.target as Element).closest<HTMLElement>('[data-case]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; const i = Number(a.closest<HTMLElement>('.proj')!.dataset.i); e.preventDefault(); caseRet = a; if (reduce) openCase(i, 'push'); else flyCase(i, a.closest('.proj')!.querySelector<HTMLElement>('.pic')!, 'push'); });
  $('case').addEventListener('click', (e) => { if ((e.target as Element).closest('[data-close]')) leave(); const g = (e.target as Element).closest<HTMLElement>('[data-go]'); if (g) openCase(Number(g.dataset.go), 'replace'); });
  addEventListener('keydown', (e) => { if (!$('case').classList.contains('on') && !TR.casing) return; if (e.key === 'Tab') { const f = [...$('case').querySelectorAll<HTMLElement>('a[href], button:not([disabled])')], i = f.indexOf(document.activeElement as HTMLElement); if (f.length && (i < 0 || (e.shiftKey ? i === 0 : i === f.length - 1))) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); } return; } if (e.key === 'Escape') leave(); else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.altKey && !e.metaKey) { e.preventDefault(); if (e.repeat) return; openCase((caseI + (e.key === 'ArrowRight' ? 1 : PROJECTS.length - 1)) % PROJECTS.length, 'replace'); } });
  addEventListener('popstate', sync);
  const i = caseAt(location.pathname); if (i >= 0) adopt(i);
}

export function caseMoonsTick(now: number) { if ($('case').classList.contains('on')) $('case').querySelectorAll<HTMLElement>('.cplanet, .splanet').forEach((pl) => { if (pl.offsetWidth) orbit(pl, caseI, now); }); }
