import { reduce, lf } from './state';
import { $, clamp, lerp, out, visible } from './util';
import { revealAt } from './travel';

type Card = { el: HTMLElement; shine: HTMLElement; h: number; hx: number; hy: number; g: number; ht: number };
let cards: Card[] = [], table: HTMLElement, bus: HTMLCanvasElement, bctx: CanvasRenderingContext2D;

export function initCards() {
  table = $('table');
  cards = [...table.querySelectorAll<HTMLElement>('.card')].map((el) => { const c: Card = { el, shine: el.querySelector<HTMLElement>('.shine')!, h: 0, hx: 0, hy: 0, g: -1, ht: 0 };
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); c.hx = (e.clientX - r.left) / r.width - 0.5; c.hy = (e.clientY - r.top) / r.height - 0.5; el.style.setProperty('--sx', `${(c.hx + 0.5) * 100}%`); el.style.setProperty('--sy', `${(c.hy + 0.5) * 100}%`); });
    el.addEventListener('pointerenter', () => (c.ht = 1)); el.addEventListener('pointerleave', () => { c.ht = 0; c.hx = c.hy = 0; }); return c; });
}

export function initBus() { bus = $<HTMLCanvasElement>('bus'); bctx = bus.getContext('2d')!; }

export function stackTick(now: number) {
  if (!visible($('stack'))) return;
  const r = table.getBoundingClientRect(), base = reduce ? 1 : Math.min(clamp((innerHeight - r.top) / (innerHeight * 0.75)), clamp((now - revealAt - 100) / 900)), rail = innerWidth < 600;
  cards.forEach((c, i) => {
    const el = c.el, k = out(clamp(base * 2 - (rail ? 0 : i * 0.1))), a = 1 - k;
    c.h = lerp(c.h, c.ht && k > 0.98 ? 1 : 0, lf(0.15));
    el.style.transform = `translate3d(0, ${a * 110 - c.h * 10 + (reduce ? 0 : Math.sin(now / 1600 + i * 0.35) * 3 * k * (1 - c.h))}px, ${a * -80 + c.h * 30}px) rotate3d(1, 0, 0, ${a * 16 - c.hy * 12 * c.h}deg) rotate3d(0, 1, 0, ${c.hx * 12 * c.h}deg) rotate3d(0, 0, 1, ${a * (i - 1.5) * 1.5}deg)`;
    el.style.opacity = String(Math.min(1, k * 1.4)); c.shine.style.setProperty('--so', String(c.h));
    const g = Math.round(clamp((k - 0.55) / 0.45) * 100) / 100; if (g !== c.g) { c.g = g; el.style.setProperty('--g', String(g)); }
  });
}

export function busTick(now: number) {
  if (!visible($('stack'))) return;
  const sec = $('stack'), tb = $('table'), sr = sec.getBoundingClientRect(), tr = tb.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
  const top = tr.bottom - sr.top + 34, w = sec.clientWidth, h = 70;
  if (bus.style.top !== `${top}px`) bus.style.top = `${top}px`; bus.style.height = `${h}px`;
  if (bus.width !== Math.round(w * dpr) || bus.height !== Math.round(h * dpr)) { bus.width = Math.round(w * dpr); bus.height = Math.round(h * dpr); }
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, w, h);
  const xs = cards.map((c) => { const r = c.el.getBoundingClientRect(); return [r.left + r.width / 2 - sr.left, c.h || 0]; });
  if (xs.length < 2 || innerWidth < 600) return;
  const y = 40, x0 = xs[0][0], x1 = xs[xs.length - 1][0];
  bctx.lineWidth = 1; bctx.strokeStyle = 'rgba(143,211,255,.22)'; bctx.beginPath(); bctx.moveTo(x0, y); bctx.lineTo(x1, y); xs.forEach(([x]) => { bctx.moveTo(x, 0); bctx.lineTo(x, y); }); bctx.stroke();
  xs.forEach(([x, hv]) => { bctx.fillStyle = `rgba(${hv > 0.3 ? '255,207,138' : '143,211,255'},${0.5 + hv * 0.5})`; bctx.beginPath(); bctx.arc(x, y, 3 + hv * 2, 0, 6.283); bctx.fill(); if (hv > 0.05) { bctx.strokeStyle = `rgba(255,207,138,${hv})`; bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, y); bctx.stroke(); } });
  const t = now / 1000; for (let k = 0; k < 3; k++) { const u = ((t * 0.12 + k / 3) % 1), px = x0 + (x1 - x0) * u; const g = bctx.createLinearGradient(px - 60, 0, px, 0); g.addColorStop(0, 'rgba(143,211,255,0)'); g.addColorStop(1, 'rgba(200,235,255,.9)'); bctx.strokeStyle = g; bctx.lineWidth = 1.5; bctx.beginPath(); bctx.moveTo(Math.max(x0, px - 60), y); bctx.lineTo(px, y); bctx.stroke(); }
  bctx.fillStyle = 'rgba(207,234,255,.55)'; bctx.font = '400 10px "JetBrains Mono", monospace'; bctx.fillText('SYS BUS · 4 NODES ONLINE', x0, y + 22);
}
