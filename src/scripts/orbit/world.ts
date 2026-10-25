import { cam, capD, clamp, coarse, G, input, onView, rand, rnd, ship, srand, srnd, T_BS, TAU, TYPES, V, type Enemy } from './core';

type Pool<K extends string> = { n: number; cap: number; keys: readonly K[] } & Record<K, Float32Array>;
function soa<K extends string>(n: number, keys: readonly K[]) { const p = { n: 0, cap: n, keys } as Pool<K>; for (const k of keys) (p as Record<K, Float32Array>)[k] = new Float32Array(n); return p; }
export function rm<K extends string>(p: Pool<K>, i: number) { const j = --p.n; if (i !== j) for (const k of p.keys) { const a = p[k]; a[i] = a[j]; } }

export const MAXE = coarse ? 170 : 340, CAPE = coarse ? 150 : 320;
export const EN: Enemy[] = Array.from({ length: MAXE }, () => ({ t: 0, id: 0, x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, hp: 1, max: 1, w: 1, r: 1, L: 0, sp: 1, flash: -1, elite: 0, ph: 0, mode: 0, st: 0, dx: 0, dy: 0, fire: 0, charge: 0, sum: 0, pass: 0, aim: 0, wingT: 0, ringT: 0, arc: 0, rot: 0, alpha: 0, age: 0, dead: 0, f: 0, peel: 0 }));
export const WS = { nE: 0, serial: 1, nFX: 0, gc: 72, gw: 1, gh: 1, gx0: 0, gy0: 0, maxr: 40, boss: -1 };

export const SP = soa(coarse ? 560 : 1100, ['x', 'y', 'vx', 'vy', 'l', 'm', 's', 'c', 'dr'] as const);
export const DB = soa(coarse ? 140 : 280, ['x', 'y', 'vx', 'vy', 'l', 'm', 's', 'c', 'a', 'va'] as const);
export const SH = soa(coarse ? 260 : 420, ['x', 'y', 'v', 'st', 'sp', 'ph', 'k', 'a'] as const);
export const BO = soa(180, ['x', 'y', 'vx', 'vy', 'l', 'd', 'p', 'h'] as const);
export const MI = soa(90, ['x', 'y', 'vx', 'vy', 'l', 'd', 'r', 'g', 'tid', 'sp'] as const);
export const MT: (Enemy | null)[] = new Array(90).fill(null);
export const EB = soa(10, ['x', 'y', 'vx', 'vy', 'l', 'f'] as const);
export const FX = Array.from({ length: 120 }, () => ({ k: 0, x: 0, y: 0, r: 0, t: 0, d: 1, c: 0, a: 1 }));
export const NR = Array.from({ length: 10 }, () => ({ on: false, x: 0, y: 0, r: 0, t: 0, d: 1, dmg: 0, kb: 0, c: 0, hit: new Set<number>() }));
export const BM = Array.from({ length: 24 }, () => ({ on: false, x0: 0, y0: 0, x1: 0, y1: 0, t: 0, d: 0.16, w: 8 }));
export const AR = Array.from({ length: 14 }, () => ({ on: false, n: 0, t: 0, d: 0.16, g: false, p: new Float32Array(24) }));
export const TG = Array.from({ length: 10 }, () => ({ on: false, x: 0, y: 0, dx: 0, dy: 0, t: 0, d: 1 }));
export const RB = [0, 1].map(() => ({ x: new Float32Array(32), y: new Float32Array(32), vx: new Float32Array(32), vy: new Float32Array(32), t: new Float32Array(32), h: 0, n: 0, last: -1 }));
export const TQ: { t: number; fn: () => void; run: number }[] = [];
export const later = (t: number, fn: () => void) => TQ.push({ t, fn, run: G.run });
export const QB = new Int32Array(MAXE), QS = new Int32Array(MAXE), QA = new Int32Array(MAXE), QR = new Int32Array(MAXE), QBOT = new Int32Array(MAXE), QW = new Int32Array(MAXE), QT = new Float32Array(MAXE);
export const NK = new Int32Array(8), NKd = new Float32Array(8);
const gNext = new Int32Array(MAXE);
let gHead = new Int32Array(1);

export function sizeWorld() {
  const { U } = V;
  WS.gc = Math.max(48, Math.round(72 * U)); WS.maxr = TYPES[2].w * U * 1.3 * TYPES[2].r + 2;
  V.far = Math.max(V.vw, V.vh) * 0.5;
  WS.gw = Math.ceil((V.vw + V.far * 2 + 200) / WS.gc); WS.gh = Math.ceil((V.vh + V.far * 2 + 200) / WS.gc); gHead = new Int32Array(WS.gw * WS.gh);
}

export function spark(x: number, y: number, vx: number, vy: number, life: number, s: number, c: number, dr = 3.2) {
  const P = SP; if (P.n >= P.cap) return; const i = P.n++;
  P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.l[i] = 0; P.m[i] = life; P.s[i] = s; P.c[i] = c; P.dr[i] = dr;
}
export function debris(x: number, y: number, vx: number, vy: number, life: number, s: number, c: number) {
  const P = DB; if (P.n >= P.cap) return; const i = P.n++;
  P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.l[i] = 0; P.m[i] = life; P.s[i] = s; P.c[i] = c; P.a[i] = rand() * TAU; P.va[i] = rnd(-9, 9);
}
export function fx(k: number, x: number, y: number, r: number, d: number, c = 0, a = 1) { if (WS.nFX >= FX.length) return; const f = FX[WS.nFX++]; f.k = k; f.x = x; f.y = y; f.r = r; f.t = 0; f.d = d; f.c = c; f.a = a; }
export function sparks(x: number, y: number, n: number, sp: number, c: number, s = 6) { for (let i = 0; i < n; i++) { const a = rand() * TAU, v = sp * rnd(0.35, 1); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.15, 0.32), s * V.U * rnd(0.7, 1.2), c); } }

export const sizeE = (e: Enemy) => { const T = TYPES[e.t]; e.w = T.w * V.U * (e.elite ? 1.3 : 1); e.r = e.w * T.r; e.L = e.t === T_BS ? e.w * 1.05 : 0; };
export const hpScale = () => { const m = Math.max(0, G.clock - 30) / 60; return 1 + m * 0.62 + m * m * 0.16; };
export function spawn(type: number, x: number, y: number, elite = 0) {
  if (WS.nE >= (type === T_BS ? MAXE : CAPE)) return null;
  const e = EN[WS.nE++], T = TYPES[type];
  e.t = type; e.id = WS.serial++; e.x = x; e.y = y; e.vx = e.vy = e.kx = e.ky = 0;
  e.hp = e.max = T.hp * hpScale() * (elite ? 7 : 1); e.elite = elite; e.sp = srnd(0.88, 1.12) * (elite ? 1.08 : 1);
  e.flash = -1; e.ph = srand() * TAU; e.mode = 0; e.st = 0; e.dx = 0; e.dy = 0; e.fire = srnd(2, 5); e.charge = 0; e.sum = 4; e.pass = 0; e.aim = 0;
  e.wingT = -9; e.ringT = -9; e.arc = 0; e.rot = Math.atan2(ship.x - x, y - ship.y); e.alpha = 0; e.age = 0; e.dead = 0; e.f = G.fac; e.peel = 0;
  sizeE(e); return e;
}

export function gridBuild() {
  WS.gx0 = cam.x - V.vw / 2 - V.far - 100; WS.gy0 = cam.y - V.vh / 2 - V.far - 100;
  gHead.fill(-1); WS.boss = -1;
  for (let i = 0; i < WS.nE; i++) {
    const e = EN[i]; if (e.dead || e.mode === -1) continue;
    if (e.t === T_BS) { WS.boss = i; continue; }
    const cx = clamp(((e.x - WS.gx0) / WS.gc) | 0, 0, WS.gw - 1), cy = clamp(((e.y - WS.gy0) / WS.gc) | 0, 0, WS.gh - 1), c = cy * WS.gw + cx;
    gNext[i] = gHead[c]; gHead[c] = i;
  }
}
export function query(x: number, y: number, r: number, buf: Int32Array) {
  let n = 0; const rr = r + WS.maxr;
  const x0 = clamp(((x - rr - WS.gx0) / WS.gc) | 0, 0, WS.gw - 1), x1 = clamp(((x + rr - WS.gx0) / WS.gc) | 0, 0, WS.gw - 1), y0 = clamp(((y - rr - WS.gy0) / WS.gc) | 0, 0, WS.gh - 1), y1 = clamp(((y + rr - WS.gy0) / WS.gc) | 0, 0, WS.gh - 1);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) for (let i = gHead[cy * WS.gw + cx]; i >= 0; i = gNext[i]) {
    const e = EN[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, q = r + e.r; if (dx * dx + dy * dy < q * q && n < buf.length) buf[n++] = i;
  }
  if (WS.boss >= 0) { const e = EN[WS.boss]; if (!e.dead && capD(e, x, y) < r + e.r && n < buf.length) buf[n++] = WS.boss; }
  return n;
}
export const SS = { t: 0 };
export function segSeg(px: number, py: number, qx: number, qy: number, ax: number, ay: number, bx: number, by: number) {
  const ux = qx - px, uy = qy - py, vx = bx - ax, vy = by - ay, rx = px - ax, ry = py - ay, a = ux * ux + uy * uy, e = vx * vx + vy * vy, f = vx * rx + vy * ry;
  let s = 0, t = 0;
  if (a <= 1e-9) t = e > 1e-9 ? clamp(f / e) : 0;
  else {
    const c = ux * rx + uy * ry;
    if (e <= 1e-9) s = clamp(-c / a);
    else {
      const b = ux * vx + uy * vy, den = a * e - b * b;
      s = den > 1e-9 ? clamp((b * f - c * e) / den) : 0; t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a); } else if (t > 1) { t = 1; s = clamp((b - c) / a); }
    }
  }
  SS.t = s;
  return Math.hypot(px + ux * s - ax - vx * t, py + uy * s - ay - vy * t);
}
export function edist(e: Enemy, x0: number, y0: number, x1: number, y1: number) {
  if (e.L) { const ux = Math.sin(e.rot) * e.L, uy = -Math.cos(e.rot) * e.L; return segSeg(x0, y0, x1, y1, e.x - ux, e.y - uy, e.x + ux, e.y + uy); }
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy, t = l2 > 1e-9 ? clamp(((e.x - x0) * dx + (e.y - y0) * dy) / l2) : 0;
  SS.t = t; return Math.hypot(x0 + dx * t - e.x, y0 + dy * t - e.y);
}
export function sortIn(buf: Int32Array, n: number, i: number, t: number) { let k = n; while (k > 0 && QT[k - 1] > t) { QT[k] = QT[k - 1]; buf[k] = buf[k - 1]; k--; } QT[k] = t; buf[k] = i; return n + 1; }
export function sweep(x0: number, y0: number, x1: number, y1: number, r: number, buf: Int32Array) {
  const dx = x1 - x0, dy = y1 - y0, c = query(x0 + dx / 2, y0 + dy / 2, Math.hypot(dx, dy) / 2 + r, QW); let n = 0;
  for (let j = 0; j < c; j++) { const e = EN[QW[j]]; if (edist(e, x0, y0, x1, y1) <= r + e.r) n = sortIn(buf, n, QW[j], SS.t); }
  return n;
}
export function nearestK(x: number, y: number, range: number, k: number) {
  let n = 0; const r2 = range * range;
  for (let i = 0; i < WS.nE; i++) {
    const e = EN[i]; if (e.dead || e.mode === -1 || e.alpha < 0.5 || !onView(e.x, e.y, -4)) continue;
    const dx = e.x - x, dy = e.y - y, d2 = dx * dx + dy * dy; if (d2 > r2) continue;
    if (n < k) n++; else if (d2 >= NKd[k - 1]) continue;
    let j = n - 1; while (j > 0 && NKd[j - 1] > d2) { NKd[j] = NKd[j - 1]; NK[j] = NK[j - 1]; j--; } NKd[j] = d2; NK[j] = i;
  }
  return n;
}
export function compact() {
  let w = 0;
  for (let i = 0; i < WS.nE; i++) { const e = EN[i]; if (!e.dead) { if (i !== w) { EN[i] = EN[w]; EN[w] = e; } w++; } }
  WS.nE = w;
}
export function rescale(k: number) {
  const sc = <K extends string>(p: Pool<K>, keys: K[]) => { for (const key of keys) { const a = p[key]; for (let i = 0; i < p.n; i++) a[i] *= k; } };
  for (const o of [ship, cam]) { o.x *= k; o.y *= k; }
  ship.vx *= k; ship.vy *= k; ship.cx *= k; ship.cy *= k; input.gx *= k; input.gy *= k;
  for (let i = 0; i < WS.nE; i++) { const e = EN[i]; e.x *= k; e.y *= k; e.vx *= k; e.vy *= k; e.kx *= k; e.ky *= k; sizeE(e); }
  sc(SP, ['x', 'y', 'vx', 'vy', 's']); sc(DB, ['x', 'y', 'vx', 'vy', 's']); sc(SH, ['x', 'y', 'sp']); sc(BO, ['x', 'y', 'vx', 'vy']); sc(MI, ['x', 'y', 'vx', 'vy', 'r', 'sp']); sc(EB, ['x', 'y', 'vx', 'vy']);
  for (let i = 0; i < WS.nFX; i++) { const f = FX[i]; f.x *= k; f.y *= k; f.r *= k; }
  for (const s of NR) { s.x *= k; s.y *= k; s.r *= k; s.kb *= k; }
  for (const s of BM) { s.x0 *= k; s.y0 *= k; s.x1 *= k; s.y1 *= k; s.w *= k; }
  for (const s of AR) for (let i = 0; i < s.n * 2; i++) s.p[i] *= k;
  for (const s of TG) { s.x *= k; s.y *= k; }
  for (const R of RB) for (let i = 0; i < 32; i++) { R.x[i] *= k; R.y[i] *= k; R.vx[i] *= k; R.vy[i] *= k; }
  if (G.cache) { G.cache.x *= k; G.cache.y *= k; }
}
export function resetWorld() {
  WS.nE = 0; SP.n = DB.n = SH.n = BO.n = MI.n = EB.n = 0; WS.nFX = 0; TQ.length = 0; for (const R of RB) R.n = 0;
  for (const s of NR) s.on = false; for (const s of BM) s.on = false; for (const s of AR) s.on = false; for (const s of TG) s.on = false;
}
