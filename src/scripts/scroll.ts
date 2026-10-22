import Lenis from 'lenis';
import { HI, reduce, S, TR } from './state';
import { $, ease3 } from './util';
import { setNav } from './nav';

export let lenis: Lenis | null = null;
let keyNav = false;

export function landY(t: HTMLElement) { if (t.id === 'hero') return 0; if (t.id === 'intro') return t.getBoundingClientRect().top + scrollY + Math.max(0, (t.offsetHeight - innerHeight) * 0.5); return t.getBoundingClientRect().top + scrollY; }

export function land(el: HTMLElement, host?: HTMLElement | null) { const t = keyNav || !host ? el : host; if (!t.hasAttribute('tabindex') && !t.matches('a, button, input')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }

export function jumpTo(t: HTMLElement) {
  if (TR.busy) return;
  S.navIntent = t.id; S.navIntentT = performance.now(); S.navIntentY = landY(t); setNav(t.id);
  if (t.id === 'hero' && scrollY < 4) { t.focus({ preventScroll: true }); return; }
  const y = landY(t), dist = Math.abs(y - scrollY);
  lenis ? lenis.scrollTo(y, { duration: Math.min(2.6, 0.9 + dist / 3400), easing: ease3 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
}

export const scrollToY = (y: number) => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y));

export function initScroll() {
  lenis = !reduce ? new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 }) : null;
  addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey) keyNav = true; }, true); addEventListener('pointerdown', () => (keyNav = false), true);
}

export function initWheelHush() {
  let wheelHush = 0;
  addEventListener('wheel', (e) => { const n = performance.now(); if (TR.busy || n < wheelHush) { wheelHush = n + 260; e.preventDefault(); e.stopImmediatePropagation(); } }, { capture: true, passive: false });
}

export function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = document.querySelector<HTMLElement>(a.getAttribute('href')!); if (!t) return; e.preventDefault(); jumpTo(t); }));
  $('top').addEventListener('click', () => jumpTo($('hero')));
}

export function initLanding() {
  HI.t0 = performance.now();
  history.scrollRestoration = 'manual';
  addEventListener('pagehide', () => { try { sessionStorage.setItem('space-y', String(Math.round(scrollY))); } catch {} });
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, () => { HI.moved = true; if (!HI.copy) HI.ff = true; }, { passive: true }));
  let tg: HTMLElement | null = null, y = 0; try { tg = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch {}
  const nav0 = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (tg) y = landY(tg); else if (nav0 && /reload|back_forward/.test(nav0.type)) { try { y = +(sessionStorage.getItem('space-y') ?? 0) || 0; } catch {} }
  const go = (v: number) => { if (lenis) { lenis.resize(); lenis.scrollTo(v, { immediate: true, force: true }); } else scrollTo(0, v); };
  if (y > innerHeight * 0.5) { HI.skip = true; HI.ship = -1; go(Math.min(y, document.documentElement.scrollHeight - innerHeight)); const t = tg; if (t && document.fonts) document.fonts.ready.then(() => { if (!HI.moved) go(landY(t)); }); } else go(0);
}
