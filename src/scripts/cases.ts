import { moonsHTML } from '../lib/planets';
import type { Project } from '../lib/site';
import { PROJECTS } from './data';
import { pend, reduce, S, TR } from './state';
import { $, bez, ic, nn, wait } from './util';
import { land, lenis, scrollToY } from './scroll';
import { idle, travel } from './travel';
import { io, revealEl, settle } from './reveal';
import { orbit } from './planets';


let caseI = 0, caseRet: HTMLElement | null = null, caseIO: IntersectionObserver;
const bgInert = new Map<Element, boolean>();
const STORY = (s: NonNullable<Project['story']>) => [['The brief', s.brief], ['What I did', s.did], ['The result', s.result]];

function caseHTML(i: number) {
  const p = PROJECTS[i], L = PROJECTS.length, pi = (i + L - 1) % L, ni = (i + 1) % L;
  return `<div class="chd" data-stage><div class="top st" style="--i:0"><button type="button" class="back" data-close>${ic('arrow-left')}Back to the fleet</button><span class="mono k">Destination ${nn(i + 1)} / ${nn(L)} <span class="kh" aria-hidden="true">· Arrow keys to travel</span></span></div>
    <div class="ttl"><div><div class="eyebrow mono k st" style="--i:1">${p.team}</div><h2 class="disp st" style="--i:2">${p.title}</h2></div><span class="vs st" style="--i:3"><a class="btn ghost" href="${p.url}" target="_blank" rel="noopener">Visit site<span class="sr"> (opens in a new tab)</span></a></span></div><p class="lead st" style="--i:4">${p.fact}</p></div>
    <div class="shotw"><div class="hero-shot cr"><img src="${p.shot}" alt="${p.title} website"><div class="hud"></div></div><div class="splanet" aria-hidden="true"><img src="${p.planet}" alt="">${moonsHTML(i)}</div></div>
    ${p.story ? `<div class="story">${STORY(p.story).map(([h, t]) => `<div class="cr"><h4>${h}</h4><p>${t}</p></div>`).join('')}</div>` : ''}
    <div class="cols"><div class="cr"><h4>Systems</h4><div class="stack">${p.stack.map((x) => `<span>${x}</span>`).join('')}</div></div></div>
    <div class="nav2 cr"><button type="button" data-go="${pi}" aria-label="Previous project, ${PROJECTS[pi].title}"><b>${ic('arrow-left')}Previous</b><span>${nn(pi + 1)} · ${PROJECTS[pi].title}</span></button><button type="button" data-go="${ni}" aria-label="Next project, ${PROJECTS[ni].title}"><b>Next${ic('arrow-right')}</b><span>${nn(ni + 1)} · ${PROJECTS[ni].title}</span></button></div>`;
}

function caseLife() {
  const c = $('caseIn'); io.observe(c.querySelector('.chd')!); c.querySelectorAll<HTMLElement>('.cr').forEach((el, i) => { el.style.transitionDelay = `${Math.min(i, 3) * 0.08}s`; caseIO.observe(el); });
  const shot = c.querySelector<HTMLElement>('.hero-shot')!; shot.addEventListener('pointermove', (e) => { if (reduce || e.pointerType !== 'mouse') return; const r = shot.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; shot.style.transform = `perspective(1400px) rotate3d(1, 0, 0, ${-y * 5}deg) rotate3d(0, 1, 0, ${x * 7}deg)`; }); shot.addEventListener('pointerleave', () => (shot.style.transform = ''));
}
function fillCase(i: number) { caseI = i; $('caseIn').innerHTML = caseHTML(i); $('cpw').innerHTML = `<div class="cplanet"><img src="${PROJECTS[i].planet}" alt="">${moonsHTML(i)}</div>`; return Promise.all(([...$('case').querySelectorAll('img')].map((m) => m.decode().catch(() => {})) as Promise<unknown>[]).concat(document.fonts ? [document.fonts.ready] : [])); }
function setBgInert(on: boolean) { if (on) [...document.body.children].forEach((el) => { if (el.id === 'case' || el.tagName === 'SCRIPT' || el.tagName === 'CANVAS' || bgInert.has(el)) return; bgInert.set(el, (el as HTMLElement).inert); (el as HTMLElement).inert = true; }); else { bgInert.forEach((v, el) => ((el as HTMLElement).inert = v)); bgInert.clear(); } }
const caseReturn = (pic?: HTMLElement) => (caseRet && caseRet.isConnected && caseRet.closest<HTMLElement>('.proj') && caseRet.closest<HTMLElement>('.proj')!.dataset.i === String(caseI) ? caseRet : pic || document.querySelector<HTMLElement>(`.proj[data-i="${caseI}"] .acts [data-case]`));
function showCase(i: number, filled?: boolean) { if (!filled) fillCase(i); $('case').classList.add('on'); document.body.classList.add('case-open'); $('case').scrollTop = 0; document.documentElement.classList.add('case-lock'); caseLife(); setBgInert(true); $('case').setAttribute('aria-label', `${PROJECTS[i].title} case study`); }
function hideCase() { $('case').classList.remove('on'); document.body.classList.remove('case-open'); document.documentElement.classList.remove('case-lock'); setBgInert(false); }
function openCase(i: number) { if (TR.busy) { TR.next = () => openCase(i); return; } travel({ fast: $('case').classList.contains('on'), action: () => fillCase(i).then(() => showCase(i, true)) }).then(() => land($('caseIn').querySelector<HTMLElement>('.back')!, $('case'))); }
function closeCase() { if (TR.busy) { TR.next = closeCase; return; } const r = caseReturn(); travel({ focus: r, action: () => { hideCase(); if (r) { const row = r.closest('.proj')!.getBoundingClientRect(); const y = scrollY + row.top + row.height / 2 - innerHeight / 2; scrollToY(y); } } }); }
function ghostAt(r: DOMRect, src: string, rad: number) { const g = document.createElement('div'); g.className = 'flyer'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = `<img src="${src}" alt="">`; Object.assign(g.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: `${rad}px`, visibility: 'hidden' }); document.body.append(g); return (g.firstChild as HTMLImageElement).decode().catch(() => {}).then(() => g); }
const FLYE = bez(0.65, 0, 0.2, 1);
const flyTo = (g: HTMLElement, a: DOMRect, el: HTMLElement, ms: number) => new Promise<void>((res) => { const t0 = performance.now(); (function f(n: number) { const k = Math.min(1, (n - t0) / ms), e = FLYE(k), b = el.getBoundingClientRect(), sc = 1 + (b.width / a.width - 1) * e; g.style.transform = `translate3d(${((b.left - a.left) * e).toFixed(2)}px, ${((b.top - a.top) * e).toFixed(2)}px, 0) scale3d(${sc.toFixed(4)}, ${sc.toFixed(4)}, 1)`; if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
async function flyCase(i: number, pic: HTMLElement) {
  if (TR.busy) return; TR.busy = TR.casing = true; lenis && lenis.stop(); document.documentElement.classList.add('tr-lock');
  pic.style.transition = 'transform .18s var(--ease-out)'; pic.style.transform = ''; pic.classList.add('lift'); await wait(reduce ? 190 : 330); const a = pic.getBoundingClientRect(), g = await ghostAt(a, PROJECTS[i].shot, 14); g.style.visibility = ''; pic.style.visibility = 'hidden'; pic.style.transition = ''; S.boost = Math.max(S.boost, 0.6);
  document.body.classList.add('fly-out'); await Promise.all([wait(380), fillCase(i)]);
  showCase(i, true); const shot = $('caseIn').querySelector<HTMLElement>('.hero-shot')!; shot.classList.add('held', 'shown'); const b = shot.getBoundingClientRect();
  g.style.borderRadius = `${(14 + (16 * a.width) / b.width) / 2}px`;
  await flyTo(g, a, shot, 950); shot.classList.remove('held'); g.remove(); pic.style.visibility = ''; pic.classList.remove('lift'); document.body.classList.remove('fly-out');
  revealEl($('caseIn').querySelector('.chd')!); pend.forEach(revealEl); pend.clear(); land($('caseIn').querySelector<HTMLElement>('.back')!, $('case')); TR.casing = false; idle();
}
async function flyBack() {
  if (TR.busy) { TR.next = flyBack; return; } const pic = document.querySelector<HTMLElement>(`.proj[data-i="${caseI}"] .pic`), shot = $('caseIn').querySelector<HTMLElement>('.hero-shot');
  if (shot) { shot.style.transition = 'none'; shot.style.transform = ''; void shot.offsetWidth; } const b = shot && shot.getBoundingClientRect();
  if (reduce || !pic || !b || b.bottom < 60 || b.top > innerHeight - 60) { closeCase(); return; }
  TR.busy = true; const g = await ghostAt(b, PROJECTS[caseI].shot, 16); g.style.visibility = ''; shot!.style.visibility = 'hidden';
  $('case').classList.add('leaving'); document.body.classList.add('fly-out'); await wait(340);
  hideCase(); const proj = pic.closest<HTMLElement>('.proj')!, row = proj.getBoundingClientRect(), y = scrollY + row.top + row.height / 2 - innerHeight / 2; scrollToY(y);
  pic.style.transform = ''; pic.classList.add('lift'); proj.querySelectorAll('.rv').forEach(settle);
  const a = pic.getBoundingClientRect(); pic.style.visibility = 'hidden'; g.style.borderRadius = `${(16 + (14 * b.width) / a.width) / 2}px`;
  await flyTo(g, b, pic, 900); pic.style.visibility = ''; document.body.classList.add('fly-back'); document.body.classList.remove('fly-out'); await wait(420); g.remove(); pic.classList.remove('lift'); document.body.classList.remove('fly-back'); $('case').classList.remove('leaving'); pend.forEach(revealEl); pend.clear();
  document.documentElement.classList.remove('tr-lock'); lenis && lenis.start(); land(caseReturn(pic)!, pic.closest<HTMLElement>('.proj')); idle();
}

export function initCases() {
  caseIO = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; caseIO.unobserve(e.target); if (TR.busy) pend.add(e.target); else revealEl(e.target); }), { root: $('case'), threshold: 0.12 });
  setTimeout(() => (window.requestIdleCallback || setTimeout)(() => { if (!TR.busy && !$('case').classList.contains('on')) { fillCase(0); void $('case').offsetHeight; } }), 4000);
  $('projects').addEventListener('click', (e) => { const a = (e.target as Element).closest<HTMLElement>('[data-case]'); if (!a) return; const i = Number(a.closest<HTMLElement>('.proj')!.dataset.i); e.preventDefault(); caseRet = a; if (reduce) openCase(i); else flyCase(i, a.closest('.proj')!.querySelector<HTMLElement>('.pic')!); });
  $('case').addEventListener('click', (e) => { if ((e.target as Element).closest('[data-close]')) flyBack(); const g = (e.target as Element).closest<HTMLElement>('[data-go]'); if (g) openCase(Number(g.dataset.go)); });
  addEventListener('keydown', (e) => { if (!$('case').classList.contains('on') && !TR.casing) return; if (e.key === 'Tab') { const f = [...$('case').querySelectorAll<HTMLElement>('a[href], button:not([disabled])')], i = f.indexOf(document.activeElement as HTMLElement); if (f.length && (i < 0 || (e.shiftKey ? i === 0 : i === f.length - 1))) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); } return; } if (e.key === 'Escape') flyBack(); else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.altKey && !e.metaKey) { e.preventDefault(); if (e.repeat) return; openCase((caseI + (e.key === 'ArrowRight' ? 1 : PROJECTS.length - 1)) % PROJECTS.length); } });
}

export function caseMoonsTick(now: number) { if ($('case').classList.contains('on')) $('case').querySelectorAll<HTMLElement>('.cplanet, .splanet').forEach((pl) => { if (pl.offsetWidth) orbit(pl, caseI, now); }); }
