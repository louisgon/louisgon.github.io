export { nn } from '../lib/sections';

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const out = (t: number) => 1 - Math.pow(1 - t, 3);
export const ease3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const mob = () => innerWidth < 860;
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

export function bez(x1: number, y1: number, x2: number, y2: number) { const c = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t; return (x: number) => { let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (c(m, x1, x2) < x) lo = m; else hi = m; } return c((lo + hi) / 2, y1, y2); }; }
