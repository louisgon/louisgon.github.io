import { reduce } from '../state';
import { A, at, base, C, cam, clamp, ctx, D, DV, F, FAC, G, HIT, input, LP, onView, rand, rnd, screen, ship, shipH, shipW, sprite, STICK, T_BS, T_HV, TAU, toWorld, V, VP } from './core';
import { SPR } from './art';
import { DCOL, PAL, prepFaction, S, SK, TX } from './sprites';
import { LANE } from './hud';
import { AR, BM, BO, DB, EB, EN, FX, MI, NR, RB, rm, SH, SP, TG, WS } from './world';
import { motes, streaks, twinkles } from './backdrop';

const PM = new DOMMatrix();
let vg: CanvasGradient | null = null, vgK = '';
let RBc = 0;
const DASH = [7, 9], NODASH: number[] = [], JIT = new Float32Array(256);

export function drawTrail(k: number) {
  const U = V.U, sw = shipW(), sh = shipH(), sqx = 1 - 0.12 * Math.abs(ship.bank), bx = -Math.sin(ship.h) * 90 * U, by = Math.cos(ship.h) * 90 * U;
  RBc += k;
  for (const R of RB) for (let m = 0; m < R.n; m++) { R.x[m] += R.vx[m] * k; R.y[m] += R.vy[m] * k; }
  if (G.on && VP.p > 0.85 && !G.dead && k > 0 && RBc - RB[0].last > 1 / 75) for (let j = 0; j < 2; j++) {
    const n = ship.tnoz[j], R = RB[j]; toWorld((n[0] - 0.5) * sw * sqx, (n[1] - 0.5) * sh + sh * 0.05);
    R.h = (R.h + 1) % 32; R.x[R.h] = LP.x; R.y[R.h] = LP.y; R.vx[R.h] = bx; R.vy[R.h] = by; R.t[R.h] = RBc; R.n = Math.min(32, R.n + 1); R.last = RBc;
  }
  base(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const R of RB) for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? '#e4f8ff' : '#5ec0ff';
    for (let m = 0; m < R.n - 1; m++) {
      const a = (R.h - m + 32) % 32, b = (a + 31) % 32, f = (RBc - R.t[b]) / 0.42; if (f >= 1) break;
      ctx.globalAlpha = (1 - f) * (1 - f) * (pass ? 0.5 : 0.16); ctx.lineWidth = (pass ? 2.4 : 11) * U * (1 - f * 0.55);
      ctx.beginPath(); ctx.moveTo(R.x[a], R.y[a]); ctx.lineTo(R.x[b], R.y[b]); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

export function drawTop(x: number, y: number, sw: number, sqy: number, al: number, t: number) {
  if (!A.shipTop) return;
  const { DPR, U, Z } = V, sh = sw * A.aspT, c = Math.cos(ship.h), s = Math.sin(ship.h), sqx = 1 - 0.12 * Math.abs(ship.bank);
  const ma = c * sqx * DPR, mb = s * sqx * DPR, mc = -s * sqy * DPR, md = c * sqy * DPR, kx = -s * ship.kick * 2 * U * Z, ky = c * ship.kick * 2 * U * Z;
  const blink = G.blinkT > 0 && !reduce && Math.floor(G.blinkT * 16) % 2 === 0;
  ctx.setTransform(ma, mb, mc, md, (x + kx + C.sx) * DPR, (y + ky + C.sy) * DPR);
  ctx.globalCompositeOperation = 'lighter'; sprite(SPR.trail, 0, sh * 0.18, sw * 0.95, 0.2 * al); ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = (blink ? 0.28 : 1) * al;
  ctx.drawImage(S.shipT && sw * DPR <= S.shipT.width * 1.05 ? S.shipT : A.shipTop, -sw / 2, -sh / 2, sw, sh);
  ctx.globalCompositeOperation = 'lighter';
  const spd = Math.hypot(ship.vx, ship.vy), thr = 0.62 + clamp(spd / (640 * U)) * 0.5 + (reduce ? 0 : 0.08 * Math.sin(t * 23)) + (VP.dir ? 0.3 : 0);
  for (const n of ship.tnoz) {
    const nx = (n[0] - 0.5) * sw, ny = (n[1] - 0.5) * sh;
    sprite(SPR.cyan, nx, ny, sw * 0.11 * thr, 0.95 * al);
    const pl = sw * (0.12 + 0.24 * thr), wd = sw * 0.05, fl = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 37 + nx);
    ctx.globalAlpha = clamp(thr) * al; ctx.drawImage(SPR.plume, nx - wd, ny - sh * 0.02, wd * 2, pl * fl);
  }
  if (ship.muzzle > 0) sprite(G.wm.pulse && G.wm.pulse.evo ? SPR.gold : SPR.hit, 0, -sh * 0.5, sw * 0.12 * ship.muzzle, 0.9 * Math.min(1, ship.muzzle) * al);
  if (G.blinkT > 0) { const k2 = Math.min(1, G.blinkT / 0.4); ctx.globalAlpha = 0.65 * k2; ctx.strokeStyle = 'rgb(143,211,255)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, sw * 0.62, 0, TAU); ctx.stroke(); sprite(SPR.trail, 0, 0, sw * 0.7, 0.25 * k2); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

const cull = (e: (typeof EN)[number]) => e.w * (e.t === T_BS ? 2 : 1.6);
let glowK = 1;
export function drawEnemies() {
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < WS.nE; i++) {
    const e = EN[i]; if (e.dead || e.mode === -1 || e.alpha <= 0.01 || (e.t >= T_HV) !== (pass === 0) || !onView(e.x, e.y, cull(e))) continue;
    if (S.fk[e.f] !== S.key) prepFaction(e.f);
    const Sp = e.elite ? S.e[e.f][e.t] : S.n[e.f][e.t]; if (!Sp) continue;
    const sc = e.w * S.dwf[e.f][e.t] / Sp.iw, sw = Sp.w * sc, sh = Sp.h * sc;
    ctx.globalAlpha = e.alpha; at(e.x, e.y, Math.cos(e.rot), Math.sin(e.rot)); ctx.drawImage(Sp.c, -sw / 2, -sh / 2, sw, sh);
    if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, e.flash / 0.04) * (e.t === T_BS ? 0.3 : e.t === T_HV ? 0.45 : 0.55) * e.alpha; ctx.drawImage(S.w[e.f][e.t].c, -sw / 2, -sh / 2, sw, sh); ctx.globalCompositeOperation = 'source-over'; }
  }
  ctx.globalAlpha = 1; base();
}

export function drawEnemyGlows(t: number) {
  let n = 0;
  for (let i = 0; i < WS.nE; i++) {
    const e = EN[i]; if (e.dead || e.mode === -1 || e.alpha <= 0.01 || !onView(e.x, e.y, cull(e))) continue;
    const Gl = S.g[e.f][e.t]; if (!Gl || S.fk[e.f] !== S.key) continue;
    n++;
    const ch = e.t === T_BS ? (e.mode === 1 ? clamp(e.st / e.aim) : e.mode === 2 ? 1 : 0) : 0, c = Math.cos(e.rot), sn = Math.sin(e.rot);
    const sc = e.w * S.dwf[e.f][e.t] / Gl.iw * (1 + ch * 0.25), gw = Gl.w * sc, gh = Gl.h * sc;
    ctx.globalAlpha = Math.min(1, e.alpha * glowK * (reduce ? 0.85 : 0.78 + 0.22 * Math.sin(t * 19 + e.ph * 7)) * (e.mode === 8 ? 1.3 : 1) + ch * 0.5);
    at(e.x, e.y, c, sn); ctx.drawImage(Gl.c, -gw / 2, -gh / 2, gw, gh);
    if (e.t === T_HV && e.charge > 0) { ctx.globalAlpha = e.alpha; base(); sprite(PAL[e.f].core, e.x + sn * e.w * 0.5, e.y - c * e.w * 0.5, e.w * (0.25 + 0.4 * e.charge), e.alpha); }
    else if (e.t === T_BS && ch > 0) { base(); sprite(PAL[e.f].core, e.x + sn * e.L * 1.15, e.y - c * e.L * 1.15, e.w * (0.3 + 0.5 * ch), ch * 0.9 * e.alpha); }
    else if (e.elite) { base(); sprite(SPR.gold, e.x, e.y, e.w * 0.42, (0.16 + 0.1 * Math.sin(t * 6 + e.ph)) * e.alpha); }
  }
  glowK = clamp(1.2 - n / 200, 0.4, 1);
  ctx.globalAlpha = 1; base();
}

export function drawShards(t: number) {
  const P = SH, U = V.U;
  for (let i = 0; i < P.n; i++) {
    if (!onView(P.x[i], P.y[i], 30)) continue;
    const k = P.k[i], bs = (k === 2 ? 54 : k === 1 ? 44 : 36) * U * (V.tall ? 1.35 : 1) * (P.st[i] ? 1.12 : 1 + Math.sin(t * 5 + P.ph[i] * 6) * 0.1), bob = P.st[i] ? 0 : Math.sin(P.a[i] * 3 + P.ph[i]) * 2.2 * U;
    ctx.globalAlpha = Math.min(1, P.a[i] * 6);
    ctx.drawImage(TX.shard[k], P.x[i] - bs / 2, P.y[i] - bs / 2 + bob, bs, bs);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < P.n; i++) { const tw = Math.sin(t * 2.3 + P.ph[i] * 7); if (tw > 0.92 && onView(P.x[i], P.y[i], 30)) sprite(SPR.star, P.x[i] + 3 * U, P.y[i] - 4 * U, (P.k[i] === 2 ? 16 : 10) * U, (tw - 0.92) * 12); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

export function drawCache(t: number) {
  const c = G.cache; if (!c || !onView(c.x, c.y, 120)) return;
  const U = V.U, r = 30 * U, pu = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 2; k++) { const f = reduce ? 0.2 + k * 0.4 : (c.t * 0.8 + k * 0.5) % 1, rr = r * (1.2 + f * 3.2); ctx.globalAlpha = (1 - f) * 0.5; ctx.drawImage(TX.ringG, c.x - rr, c.y - rr, rr * 2, rr * 2); }
  sprite(SPR.gold, c.x, c.y, r * (2.4 + pu * 0.6), 0.45 + 0.2 * pu);
  ctx.globalCompositeOperation = 'source-over';
  const bob = Math.sin(t * 2.2) * 3 * U, rot = reduce ? 0 : c.t * 0.6;
  ctx.globalAlpha = 1; at(c.x, c.y + bob, Math.cos(rot), Math.sin(rot)); ctx.drawImage(SPR.cache, -r * 1.25, -r * 1.25, r * 2.5, r * 2.5); base();
  ctx.globalAlpha = 1;
}

let ptrTop = 0;
export function drawCachePointer(t: number) {
  const c = G.cache; if (!c || !G.on || VP.p < 1) return;
  const { W, H, DPR } = V, sx = c.x * C.wz + C.ox, sy = c.y * C.wz + C.oy, m = 46, top = (LANE.a > 0.05 ? LANE.msg : LANE.top) + 30;
  ptrTop = ptrTop ? ptrTop + (top - ptrTop) * (1 - Math.exp(-F.rdt * 8)) : top;
  const x0 = m, x1 = W - m, y1 = H - m - 30, y0 = Math.min(ptrTop, y1 - 40);
  if (sx > x0 && sx < x1 && sy > y0 && sy < y1) return;
  const cx = W / 2, cy = clamp(H / 2, y0, y1), dx = sx - cx, dy = sy - cy, ax = dx > 1e-6 ? (x1 - cx) / dx : dx < -1e-6 ? (x0 - cx) / dx : 1e9, ay = dy > 1e-6 ? (y1 - cy) / dy : dy < -1e-6 ? (y0 - cy) / dy : 1e9;
  const k = Math.min(ax, ay), px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx);
  ctx.setTransform(Math.cos(a) * DPR, Math.sin(a) * DPR, -Math.sin(a) * DPR, Math.cos(a) * DPR, px * DPR, py * DPR);
  ctx.globalCompositeOperation = 'lighter'; sprite(SPR.gold, 0, 0, 26, 0.5 + 0.25 * Math.sin(t * 6)); ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.95; ctx.fillStyle = 'rgb(255,207,138)'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-7, -9); ctx.lineTo(-3, 0); ctx.lineTo(-7, 9); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1; screen();
}

const enter = (x: number, y: number, dx: number, dy: number, m: number) => {
  let t0 = 0, t1 = 1e9;
  for (const [p, d, lo, hi] of [[x, dx, C.x0 + m, C.x1 - m], [y, dy, C.y0 + m, C.y1 - m]]) {
    if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) return -1; continue; }
    let a = (lo - p) / d, b = (hi - p) / d; if (a > b) { const s = a; a = b; b = s; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
  }
  return t0 <= t1 ? t0 : -1;
};
function band(x: number, y: number, dx: number, dy: number, w: number, len: number) { const px = -dy * w * 0.5, py = dx * w * 0.5; ctx.beginPath(); ctx.moveTo(x + px, y + py); ctx.lineTo(x + dx * len + px, y + dy * len + py); ctx.lineTo(x + dx * len - px, y + dy * len - py); ctx.lineTo(x - px, y - py); ctx.closePath(); }
function chevrons(x: number, y: number, dx: number, dy: number, s: number, n: number, gap: number, ph: number) {
  const px = -dy, py = dx; ctx.beginPath();
  for (let k = 0; k < n; k++) { const o = k * gap + ph, cx = x + dx * o, cy = y + dy * o; ctx.moveTo(cx + dx * s, cy + dy * s); ctx.lineTo(cx - dx * s * 0.4 + px * s, cy - dy * s * 0.4 + py * s); ctx.lineTo(cx - dx * s * 0.1, cy - dy * s * 0.1); ctx.lineTo(cx - dx * s * 0.4 - px * s, cy - dy * s * 0.4 - py * s); ctx.closePath(); }
  ctx.fill();
}
export function drawTele(dt: number, t: number) {
  const U = V.U, len = Math.hypot(C.x1 - C.x0, C.y1 - C.y0) * 1.3;
  for (const Sg of TG) {
    if (!Sg.on) continue;
    Sg.t += dt; const f = Sg.t / Sg.d; if (f >= 1) { Sg.on = false; continue; }
    const a = clamp(f * 4) * (1 - clamp((f - 0.8) / 0.2)) * (reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 28));
    ctx.globalAlpha = a * 0.55; ctx.fillStyle = 'rgba(70,14,4,0.6)'; band(Sg.x, Sg.y, Sg.dx, Sg.dy, 34 * U, len); ctx.fill();
    ctx.globalAlpha = a * 0.7; ctx.strokeStyle = 'rgba(255,120,79,0.8)'; ctx.lineWidth = 1.2; band(Sg.x, Sg.y, Sg.dx, Sg.dy, 34 * U, len); ctx.stroke();
    ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,150,100,0.95)'; ctx.lineWidth = 2; ctx.setLineDash(DASH);
    ctx.beginPath(); ctx.moveTo(Sg.x, Sg.y); ctx.lineTo(Sg.x + Sg.dx * len, Sg.y + Sg.dy * len); ctx.stroke(); ctx.setLineDash(NODASH);
    const te = enter(Sg.x, Sg.y, Sg.dx, Sg.dy, 24 * U);
    if (te >= 0) { ctx.fillStyle = 'rgba(255,130,90,0.95)'; chevrons(Sg.x + Sg.dx * te, Sg.y + Sg.dy * te, Sg.dx, Sg.dy, 8 * U, 3, 22 * U, (Sg.t * 90 * U) % (22 * U)); }
  }
  const b = G.boss;
  if (b && b.mode === 1) {
    const f = clamp(b.st / b.aim), w = b.w * 1.15 * FAC[b.f].wide, x0 = b.x - b.dx * b.L, y0 = b.y - b.dy * b.L;
    ctx.globalAlpha = 0.22 + 0.32 * f; ctx.fillStyle = 'rgba(90,20,6,0.7)'; band(x0, y0, b.dx, b.dy, w, len); ctx.fill();
    ctx.globalAlpha = 0.18 + 0.3 * f; ctx.fillStyle = 'rgba(255,110,60,0.55)'; band(x0, y0, b.dx, b.dy, w * (0.25 + 0.75 * f), len); ctx.fill();
    ctx.globalAlpha = 0.55 + 0.45 * f; ctx.strokeStyle = 'rgba(255,207,138,0.85)'; ctx.lineWidth = 2; band(x0, y0, b.dx, b.dy, w, len); ctx.stroke();
    ctx.setLineDash(DASH); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.dx * len, b.y + b.dy * len); ctx.stroke(); ctx.setLineDash(NODASH);
    ctx.fillStyle = 'rgba(255,190,120,0.9)'; ctx.globalAlpha = 0.4 + 0.5 * f; chevrons(b.x + b.dx * b.L * 1.4, b.y + b.dy * b.L * 1.4, b.dx, b.dy, 14 * U, 5, 46 * U, (b.st * 160 * U) % (46 * U));
  }
  ctx.globalAlpha = 1;
}

export function drawDebris(dt: number) {
  const P = DB, X = P.x, Y = P.y;
  for (let i = P.n - 1; i >= 0; i--) {
    P.l[i] += dt; if (P.l[i] >= P.m[i]) { rm(P, i); continue; }
    const dr = Math.exp(-dt * 2.6); P.vx[i] *= dr; P.vy[i] *= dr; X[i] += P.vx[i] * dt; Y[i] += P.vy[i] * dt; P.a[i] += P.va[i] * dt * dr;
    const f = P.l[i] / P.m[i], s = P.s[i], c = Math.cos(P.a[i]), sn = Math.sin(P.a[i]), k = P.c[i];
    if (k >= DCOL.length) { const r = s * (1 + f * 2.2); ctx.globalAlpha = (1 - f) * Math.min(1, f * 8) * 0.85; at(X[i], Y[i], c, sn); ctx.drawImage(SPR.smoke, -r, -r, r * 2, r * 2); continue; }
    ctx.globalAlpha = 1 - f * f;
    at(X[i], Y[i], c, sn);
    ctx.fillStyle = DCOL[k]; ctx.fillRect(-s, -s * 0.55, s * 2, s * 1.1);
    ctx.fillStyle = PAL[(k / 4) | 0].hi; ctx.fillRect(-s, -s * 0.55, s * 2, Math.max(0.8, s * 0.22));
  }
  ctx.globalAlpha = 1; base();
}

export function drawSparks(dt: number) {
  const P = SP, X = P.x, Y = P.y, VX = P.vx, VY = P.vy;
  for (let i = P.n - 1; i >= 0; i--) {
    P.l[i] += dt; if (P.l[i] >= P.m[i]) { rm(P, i); continue; }
    const dr = Math.exp(-dt * P.dr[i]); VX[i] *= dr; VY[i] *= dr; X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
    const f = P.l[i] / P.m[i], k = SK[P.c[i]] || SK[6];
    if (k.s) {
      const sp = Math.hypot(VX[i], VY[i]) || 1, len = Math.max(P.s[i] * 0.6, Math.min(sp * 0.045, P.s[i] * 3.2)) * (1 - f * 0.5), cs = VX[i] / sp, sn = VY[i] / sp;
      ctx.globalAlpha = 1 - f;
      at(X[i], Y[i], cs, sn);
      ctx.drawImage(k.t, -len, -len * 0.26, len * 2, len * 0.52);
    } else {
      const r = P.s[i] * (k.sh ? 1 - f * 0.6 : 0.6 + f * 0.6);
      ctx.globalAlpha = (1 - f) * k.a;
      at(X[i], Y[i], 1, 0);
      ctx.drawImage(k.t, -r, -r, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1; base();
}

export function drawFX(dt: number, rt: number) {
  for (let i = WS.nFX - 1; i >= 0; i--) {
    const f = FX[i]; f.t += f.k === 2 ? rt : dt; const p = f.t / f.d;
    if (p >= 1) { const j = --WS.nFX; FX[i] = FX[j]; FX[j] = f; continue; }
    if (f.k === 0) { const r = f.r * (0.55 + 0.55 * p); sprite(TX.fx0[f.c] || SPR.blast, f.x, f.y, r, f.a * Math.pow(1 - p, 1.6)); }
    else if (f.k === 1) { const r = f.r * (0.3 + 0.7 * (1 - Math.pow(1 - p, 3))); ctx.globalAlpha = f.a * (1 - p) * (1 - p); ctx.drawImage(TX.fx1[f.c] || TX.ringA, f.x - r, f.y - r, r * 2, r * 2); }
    else if (f.k === 2) { const e = 1 - Math.pow(1 - p, 3), r = f.r * (0.1 + 0.9 * e), r2 = f.r * 0.8 * (0.1 + 0.9 * (1 - Math.pow(1 - p, 2))); ctx.globalAlpha = (1 - p) * f.a; ctx.drawImage(TX.ringG, f.x - r, f.y - r, r * 2, r * 2); ctx.globalAlpha = (1 - p) * 0.8 * f.a; ctx.drawImage(TX.ringH, f.x - r2, f.y - r2, r2 * 2, r2 * 2); }
    else if (f.k === 3) sprite(f.c === 1 ? SPR.gold : SPR.hit, f.x, f.y, f.r * (1 - p * 0.3), f.a * (1 - p));
  }
  ctx.globalAlpha = 1;
}

export function drawNova() {
  for (const Sg of NR) {
    if (!Sg.on) continue;
    const f = Sg.t / Sg.d, cr = Sg.r * (1 - Math.pow(1 - f, 3)), a = Math.pow(1 - f, 0.8), tex = Sg.c === 1 ? TX.ringG : TX.ringH;
    ctx.globalAlpha = a; ctx.drawImage(tex, Sg.x - cr, Sg.y - cr, cr * 2, cr * 2);
    if (Sg.c === 1) { ctx.drawImage(tex, Sg.x - cr, Sg.y - cr, cr * 2, cr * 2); const r2 = cr * 0.92, r3 = cr * 1.06; ctx.globalAlpha = a * 0.7; ctx.drawImage(TX.ringA, Sg.x - r2, Sg.y - r2, r2 * 2, r2 * 2); ctx.globalAlpha = a * 0.35; ctx.drawImage(TX.ringA, Sg.x - r3, Sg.y - r3, r3 * 2, r3 * 2); }
  }
  ctx.globalAlpha = 1;
}

export function drawBolts() {
  const P = BO, len = 40 * V.U;
  for (let i = 0; i < P.n; i++) {
    const sp = Math.hypot(P.vx[i], P.vy[i]) || 1;
    at(P.x[i], P.y[i], P.vx[i] / sp, P.vy[i] / sp);
    ctx.drawImage(TX.pulse, -len * 1.4, -len * 0.21, len * 1.6, len * 0.42);
  }
  base();
}

export function drawBeams(dt: number) {
  const U = V.U; toWorld(0, -shipH() * 0.48); const nx = LP.x, ny = LP.y, att = G.on && !G.dead;
  let nb = 0; for (const Sg of BM) if (Sg.on) nb++;
  const k = 0.65 / (1 + 0.3 * Math.max(0, nb - 1));
  let flash = 0;
  for (const Sg of BM) {
    if (!Sg.on) continue;
    Sg.t += dt; const f = Sg.t / Sg.d; if (f >= 1) { Sg.on = false; continue; }
    if (att) { const ox = nx - Sg.x0, oy = ny - Sg.y0; Sg.x0 = nx; Sg.y0 = ny; Sg.x1 += ox; Sg.y1 += oy; }
    const dx = Sg.x1 - Sg.x0, dy = Sg.y1 - Sg.y0, l = Math.hypot(dx, dy) || 1, w = Sg.w * (1.6 - f) * 2;
    at(Sg.x0, Sg.y0, dx / l, dy / l);
    ctx.globalAlpha = (1 - f) * k; ctx.drawImage(TX.beamG, 0, -w * 1.1, l, w * 2.2);
    ctx.globalAlpha = (1 - f) * k * 0.9; ctx.drawImage(TX.beamC, 0, -w * 0.4, l, w * 0.8);
    flash = Math.max(flash, (1 - f) * w);
  }
  if (flash > 0) { base(); sprite(SPR.gold, nx, ny, flash * 2.2, 0.55 * Math.min(1, flash / (8 * U))); }
  ctx.globalAlpha = 1; base();
}

export function drawArcs(dt: number) {
  const U = V.U; toWorld(0, -shipH() * 0.46); const nx = LP.x, ny = LP.y, att = G.on && !G.dead;
  for (let si = 0; si < AR.length; si++) {
    const Sg = AR[si]; if (!Sg.on) continue;
    Sg.t += dt; const f = Sg.t / Sg.d; if (f >= 1) { Sg.on = false; continue; }
    if (att) { Sg.p[0] = nx; Sg.p[1] = ny; }
    let m = 0; const amp = (Sg.g ? 20 : 14) * U;
    JIT[m++] = Sg.p[0]; JIT[m++] = Sg.p[1];
    for (let k = 1; k < Sg.n; k++) {
      const x0 = Sg.p[k * 2 - 2], y0 = Sg.p[k * 2 - 1], x1 = Sg.p[k * 2], y1 = Sg.p[k * 2 + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, steps = clamp(Math.round(l / (20 * U)), 2, 9), px = -dy / l, py = dx / l;
      for (let s = 1; s < steps && m < 250; s++) { const q = s / steps, j = (reduce ? Math.sin(si * 12.9 + k * 78.2 + s * 37.7) : rnd(-1, 1)) * Math.min(amp, l * 0.22); JIT[m++] = x0 + dx * q + px * j; JIT[m++] = y0 + dy * q + py * j; }
      if (m < 254) { JIT[m++] = x1; JIT[m++] = y1; }
    }
    const a = (1 - f) * (reduce ? 1 : 0.7 + 0.3 * rand());
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * 0.45; ctx.strokeStyle = '#0b0a12'; ctx.lineWidth = (Sg.g ? 9 : 5) * U;
    ctx.beginPath(); ctx.moveTo(JIT[0], JIT[1]); for (let k = 2; k < m; k += 2) ctx.lineTo(JIT[k], JIT[k + 1]); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 3; pass++) {
      ctx.globalAlpha = a * (pass === 0 ? (Sg.g ? 0.3 : 0.26) : pass === 1 ? 0.7 : 1);
      ctx.strokeStyle = pass === 2 ? (Sg.g ? '#fff6e6' : '#ffffff') : Sg.g ? '#ffb45a' : '#6cc0ff';
      ctx.lineWidth = (pass === 0 ? (Sg.g ? 28 : 13) : pass === 1 ? (Sg.g ? 9 : 4.5) : Sg.g ? 3.2 : 1.7) * U;
      ctx.beginPath(); ctx.moveTo(JIT[0], JIT[1]); for (let k = 2; k < m; k += 2) ctx.lineTo(JIT[k], JIT[k + 1]); ctx.stroke();
    }
    if (Sg.g && !reduce) {
      ctx.globalAlpha = a * 0.85; ctx.strokeStyle = '#ffe1b0'; ctx.lineWidth = 2 * U; ctx.beginPath();
      for (let k = 2; k < m - 2; k += 4) { const bx = JIT[k], by = JIT[k + 1], ang = rand() * TAU, l = rnd(16, 40) * U; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang) * l * 0.5 + rnd(-6, 6) * U, by + Math.sin(ang) * l * 0.5 + rnd(-6, 6) * U); ctx.lineTo(bx + Math.cos(ang) * l, by + Math.sin(ang) * l); }
      ctx.stroke();
    }
    for (let k = 1; k < Sg.n; k++) sprite(Sg.g ? SPR.gold : SPR.hit, Sg.p[k * 2], Sg.p[k * 2 + 1], (Sg.g ? 38 : 18) * U, a);
    if (Sg.g) sprite(SPR.gold, Sg.p[0], Sg.p[1], 46 * U, a);
  }
  ctx.globalAlpha = 1;
}

export function drawMissiles() {
  const P = MI, U = V.U;
  for (let i = 0; i < P.n; i++) {
    const sp = Math.hypot(P.vx[i], P.vy[i]) || 1, len = (P.g[i] ? 26 : 22) * U, tl = Math.min(3.2, 1.2 + sp / (300 * U));
    at(P.x[i], P.y[i], P.vx[i] / sp, P.vy[i] / sp);
    ctx.drawImage(P.g[i] ? TX.hive : TX.miss, -len * tl, -len * 0.22, len * (tl + 0.3), len * 0.44);
  }
  base();
  for (let i = 0; i < P.n; i++) sprite(P.g[i] ? SPR.gold : SPR.blast, P.x[i], P.y[i], (P.g[i] ? 11 : 9) * U, 0.9);
}

export function drawWings() {
  const w = G.wm.wing; if (!w || !S.mini || !S.minig) return;
  const U = V.U, n = w.n, R = w.R, ws = (w.evo ? 54 : 48) * U, wh = ws * A.aspT;
  ctx.globalCompositeOperation = 'lighter';
  if (w.evo) {
    for (let pass = 0; pass < 3; pass++) {
      ctx.globalAlpha = pass === 0 ? 0.13 : pass === 1 ? 0.32 : 0.75; ctx.strokeStyle = pass === 0 ? '#7cc8ff' : pass === 1 ? '#ffb866' : '#fff3dc';
      ctx.lineWidth = (pass === 0 ? 22 : pass === 1 ? 7 : 1.6) * U; ctx.beginPath(); ctx.arc(ship.x, ship.y, R, 0, TAU); ctx.stroke();
    }
    for (let k = 0; k < 3; k++) { const a = -w.a * 1.7 + k / 3 * TAU; sprite(SPR.gold, ship.x + Math.cos(a) * R, ship.y + Math.sin(a) * R, 34 * U, 0.55); }
  } else {
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = w.a + i / n * TAU;
      for (let s = 0; s < 3; s++) { ctx.globalAlpha = 0.34 - s * 0.1; ctx.strokeStyle = '#8fd3ff'; ctx.lineWidth = (5 - s * 1.4) * U; ctx.beginPath(); ctx.arc(ship.x, ship.y, R, a - 0.22 - s * 0.22, a - s * 0.22); ctx.stroke(); }
    }
  }
  for (let i = 0; i < n; i++) sprite(w.evo ? SPR.gold : SPR.cyan, w.px[i], w.py[i], ws * 0.5, 0.25);
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const a = w.a + i / n * TAU, r = Math.atan2(-Math.sin(a), -Math.cos(a)), c = Math.cos(r), s = Math.sin(r);
    ctx.globalAlpha = 1; at(w.px[i], w.py[i], c, s); ctx.drawImage(w.evo ? S.minig : S.mini, -ws / 2, -wh / 2, ws, wh);
    ctx.globalCompositeOperation = 'lighter';
    for (const nz of ship.tnoz) sprite(SPR.cyan, (nz[0] - 0.5) * ws, (nz[1] - 0.5) * wh, ws * 0.14, 0.9);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1; base();
}

export function drawBullets() {
  const P = EB, U = V.U;
  for (let i = 0; i < P.n; i++) sprite(PAL[P.f[i]].bolt, P.x[i], P.y[i], 15 * U, Math.min(1, P.l[i] * 6));
  ctx.globalAlpha = 1;
}

export function drawHurt(rdt: number) {
  if (G.hitT <= 0) return;
  G.hitT = Math.max(0, G.hitT - rdt);
  if (!G.on || VP.p < 1) return;
  const { W, H } = V, k = G.hitT / HIT, c = Math.cos(G.hitA), s = Math.sin(G.hitA), x0 = DV.tx, y0 = DV.ty;
  const d = Math.min(c > 1e-6 ? (W - x0) / c : c < -1e-6 ? -x0 / c : 1e9, s > 1e-6 ? (H - y0) / s : s < -1e-6 ? -y0 / s : 1e9), x = x0 + c * d, y = y0 + s * d, r = Math.min(W, H) * 0.42;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,96,60,${0.72 * k})`); g.addColorStop(0.35, `rgba(220,52,28,${0.3 * k})`); g.addColorStop(1, 'rgba(160,26,12,0)');
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function drawStick() {
  const s = input.stick;
  if (!s || !G.on || VP.p < 1 || G.card || G.dead) return;
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath(); ctx.arc(s.ox, s.oy, STICK.r, 0, TAU);
  ctx.fillStyle = 'rgba(4,6,13,0.22)'; ctx.fill();
  ctx.strokeStyle = 'rgba(234,240,255,0.24)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(s.x, s.y, 20, 0, TAU);
  ctx.fillStyle = 'rgba(234,240,255,0.3)'; ctx.fill();
  ctx.strokeStyle = 'rgba(143,211,255,0.6)'; ctx.stroke();
}

export function drawSpace(t: number, a: number) {
  const { W, H, DPR, U, Z } = V, cv = D.cv; if (a <= 0.003 || !S.neb) return;
  const zk = C.wz / Z, lift = (DV.th - 1) * H * 1.75;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pat = (L: { pat: CanvasPattern; size: number; k: number }, dev: number) => {
    const k = L.k, z = 1 + (zk - 1) * k, sc = dev * z / L.size, cx = W / 2 * DPR, cy = H / 2 * DPR;
    PM.a = sc; PM.d = sc; PM.e = cx + (C.sx - cam.x * k * C.wz) * DPR * z; PM.f = cy + (C.sy - cam.y * k * C.wz + lift * (0.55 + 0.45 * k)) * DPR * z;
    L.pat.setTransform(PM); ctx.fillStyle = L.pat; ctx.fillRect(0, 0, cv.width, cv.height);
  };
  ctx.globalAlpha = a;
  pat(S.neb, Math.max(S.neb.size, Math.max(W, H) * 1.1 * DPR));
  for (const L of S.stars) pat(L, L.size);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  const tw = W + 120, th = H + 120;
  for (const s of twinkles) {
    let x = (s.x * tw - cam.x * 0.75 * C.wz) % tw; if (x < 0) x += tw;
    let y = (s.y * th - cam.y * 0.75 * C.wz + lift * 0.89) % th; if (y < 0) y += th;
    const k = reduce ? 0.5 : Math.max(0, Math.sin(t * s.s + s.p)); if (k < 0.04) continue;
    sprite(SPR.star, x - 60 + C.sx, y - 60 + C.sy, s.r * U, a * 0.41 * k * k);
  }
  ctx.globalCompositeOperation = 'source-over';
  const vk = `${cv.width},${cv.height}`;
  if (vk !== vgK || !vg) { vgK = vk; const cx = cv.width / 2, cy = cv.height / 2, r = Math.hypot(cx, cy); vg = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r); vg.addColorStop(0, 'rgba(2,3,8,0)'); vg.addColorStop(0.55, 'rgba(2,3,8,0.22)'); vg.addColorStop(1, 'rgba(2,3,8,0.62)'); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const spx = W + 80, spy = H + 80, par = 1.5 * C.wz, vxs = 18 * U - ship.vx * par, vys = 8 * U - ship.vy * par, vs = Math.hypot(vxs, vys) || 1, nx = vxs / vs, ny = vys / vs;
  ctx.strokeStyle = 'rgb(206,224,255)'; ctx.globalAlpha = a * 0.13; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.beginPath();
  for (const m of motes) {
    let x = (m.x * spx + t * 18 * U * m.s - ship.x * par) % spx; if (x < 0) x += spx;
    let y = (m.y * spy + t * 8 * U * m.s - ship.y * par + lift * 1.3) % spy; if (y < 0) y += spy;
    x -= 40; y -= 40; const L = (1.5 + vs * 0.02) * m.l * U;
    ctx.moveTo(x, y); ctx.lineTo(x - nx * L, y - ny * L);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}

export function drawStreaks(rdt: number) {
  if (reduce || DV.zb < 0.01) return;
  const { W, H, DPR, U } = V, vx = W * 0.5, vy = -H * 1.6, R = Math.hypot(W, H * 2.6), spread = Math.atan(W / (4.2 * H)) * 2.6, sp = rdt * 1.5 * (VP.dir < 0 ? -1 : 1), tex = TX.dust;
  ctx.globalCompositeOperation = 'lighter';
  for (const s of streaks) {
    s.d += s.s * sp * DV.zb; if (s.d > 1) { s.d -= 1; s.a = rand(); } else if (s.d < 0) { s.d += 1; s.a = rand(); }
    const ang = Math.PI / 2 + (s.a - 0.5) * spread, c = Math.cos(ang), sn = Math.sin(ang), r = R * (0.52 + s.d * 0.62), len = (60 + 260 * DV.zb * s.s) * U, th = (1.4 + s.s * 2) * U;
    ctx.globalAlpha = DV.zb * 0.5 * clamp(s.d * 4) * clamp((1 - s.d) * 4);
    ctx.setTransform(c * DPR, sn * DPR, -sn * DPR, c * DPR, (vx + c * r + C.sx) * DPR, (vy + sn * r + C.sy) * DPR);
    ctx.drawImage(tex, -len / 2, -th / 2, len, th);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; screen();
}
