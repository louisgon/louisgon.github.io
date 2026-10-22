import { reduce, RMQ } from './state';
import { $ } from './util';

type Magnetic = HTMLElement & { mx?: number; my?: number };
type Box = { left: number; top: number; width: number; height: number };

export const CUR = { x: 0, y: 0, w: 26, h: 26, vx: 0, vy: 0, vw: 0, vh: 0, px: -100, py: -100, el: null as Magnetic | null, seen: false, kb: false, scan: false, on: false, arm: 0, last: '' };
let ret: HTMLElement, rcs: HTMLElement[], lockLbl: HTMLElement;

export function initMagnetic() {
  document.querySelectorAll<Magnetic>('.btn').forEach((b) => { b.mx = b.my = 0; b.addEventListener('pointermove', (e) => { if (reduce || e.pointerType !== 'mouse') return; const r = b.getBoundingClientRect(); b.mx = (e.clientX - (r.left - b.mx!) - r.width / 2) * 0.25; b.my = (e.clientY - (r.top - b.my!) - r.height / 2) * 0.35; b.style.transform = `translate3d(${b.mx.toFixed(2)}px, ${b.my.toFixed(2)}px, 0)`; }); b.addEventListener('pointerleave', () => { b.mx = b.my = 0; b.style.transform = ''; }); });
}

export function initCursorQuery() {
  const FQ = matchMedia('(pointer: fine)'), setCur = () => document.body.classList.toggle('cur', FQ.matches && !reduce);
  FQ.addEventListener('change', setCur); RMQ.addEventListener('change', setCur); setCur();
}

const pickLock = (t: EventTarget | null) => { const el = t instanceof Element ? t.closest<Magnetic>('a, button, .card, .holo, .hero-shot, input') : null; return el && !el.closest('.rvw') ? el : null; };

export function initCursor() {
  ret = $('reticle'); rcs = [...ret.children] as HTMLElement[]; lockLbl = $('lockLbl');
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; CUR.px = e.clientX; CUR.py = e.clientY; CUR.seen = true; CUR.kb = false; CUR.el = pickLock(e.target); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { CUR.seen = false; if (!CUR.kb) CUR.el = null; });
  addEventListener('scroll', () => (CUR.scan = true), { capture: true, passive: true });
  addEventListener('focusin', (e) => { const t = e.target as HTMLElement; if (t.matches && t.matches(':focus-visible') && !t.closest('.rvw') && t !== document.body && !t.matches('section, [tabindex="-1"]')) { CUR.el = t; CUR.kb = true; } });
  addEventListener('focusout', () => { if (CUR.kb) { CUR.el = null; CUR.kb = false; } });
}

function lockBox(el: Magnetic): Box { const t = el.matches('.card, .holo') ? el.parentElement! : el, r = t.getBoundingClientRect(); if (t !== el || !el.offsetWidth) return r;
  const w = el.offsetWidth, h = el.offsetHeight, cx = r.left + r.width / 2 - (el.mx || 0), cy = r.top + r.height / 2 - (el.my || 0); return { left: cx - w / 2, top: cy - h / 2, width: w, height: h }; }

export function cursorTick(dt: number) {
  if (!document.body.classList.contains('cur')) return;
  if (CUR.scan && CUR.seen && !CUR.kb) CUR.el = pickLock(document.elementFromPoint(CUR.px, CUR.py)); CUR.scan = false;
  let el = CUR.el; if (el && (!el.isConnected || !el.getClientRects().length || el.closest('[inert]'))) el = CUR.el = null;
  const on = !!el && (CUR.seen || CUR.kb); let tx = CUR.px - 13, ty = CUR.py - 13, tw = 26, th = 26, big = false;
  if (on) { const b = lockBox(el!); big = el!.matches('.card, .proj .pic, .holo, .hero-shot') || (b.width > 220 && b.height > 160); const p = big ? 8 : 7, q = big ? 8 : 3; tx = b.left - p; ty = b.top - q; tw = b.width + p * 2; th = b.height + q * 2;
    if (!CUR.on) { const cx = CUR.kb ? b.left + b.width / 2 : CUR.px, cy = CUR.kb ? b.top + b.height / 2 : CUR.py; Object.assign(CUR, { x: cx - 13, y: cy - 13, w: 26, h: 26, vx: 0, vy: 0, vw: 0, vh: 0 }); } }
  CUR.on = on;
  if (!on) Object.assign(CUR, { x: tx, y: ty, w: tw, h: th, vx: 0, vy: 0, vw: 0, vh: 0 });
  else { const w0 = 24, n = Math.ceil(dt * 120), h = dt / n; for (let i = 0; i < n; i++) ([['x', 'vx', tx], ['y', 'vy', ty], ['w', 'vw', tw], ['h', 'vh', th]] as const).forEach(([k, v, g]) => { CUR[v] += (w0 * w0 * (g - CUR[k]) - 2 * w0 * CUR[v]) * h; CUR[k] += CUR[v] * h; }); }
  ret.classList.toggle('lk', on);
  const arm = big ? 14 : 9; if (CUR.arm !== arm) { CUR.arm = arm; rcs.forEach((c) => (c.style.width = c.style.height = `${arm}px`)); }
  const d = devicePixelRatio || 1, R = (v: number) => Math.round(v * d) / d, P = [[CUR.x, CUR.y], [CUR.x + CUR.w - arm, CUR.y], [CUR.x, CUR.y + CUR.h - arm], [CUR.x + CUR.w - arm, CUR.y + CUR.h - arm]].map(([x, y]) => `translate3d(${R(x)}px, ${R(y)}px, 0)`), key = P.join() + big;
  if (key !== CUR.last) { CUR.last = key; rcs.forEach((c, i) => (c.style.transform = P[i])); lockLbl.style.transform = `translate3d(${R(CUR.x + 20)}px, ${R(CUR.y + 9)}px, 0)`; }
  lockLbl.style.opacity = on && big ? '1' : '0';
}
