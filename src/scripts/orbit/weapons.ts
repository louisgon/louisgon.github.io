import { reduce } from '../state';
import { addShake, C, clamp, G, LP, onView, rand, rnd, ship, shipH, shipR, shipW, T_HV, TAU, toWorld, TYPES, V, type BoostId, type Enemy, type WeapId, type Weapon } from './core';
import { AR, BM, BO, EB, edist, EN, MI, MT, NK, nearestK, NR, QA, QB, QR, query, rm, SH, sortIn, spark, sparks, SS, sweep, fx, WS } from './world';
import { hit } from './enemies';
import { hurt } from './flight';
import { live, lvlUp, setHull } from './hud';
import { T } from './test';

export const WEAP: Record<WeapId, { name: string; evo: string; pair: BoostId; prio: number }> = {
  pulse: { name: 'Pulse cannon', evo: 'railstorm', pair: 'cooldown', prio: 12 },
  wing: { name: 'Wingmen', evo: 'halo', pair: 'area', prio: 8 },
  arc: { name: 'Arc', evo: 'tempest', pair: 'damage', prio: 6 },
  missile: { name: 'Missiles', evo: 'hive', pair: 'magnet', prio: 7 },
  nova: { name: 'Nova', evo: 'supernova', pair: 'hull', prio: 9 },
};
export const WD: Record<WeapId, string[]> = {
  pulse: ['Auto aims bolts at the nearest enemy', 'Bolt damage up 30%', 'Fires a second bolt', 'Bolt damage up 25%', 'A third bolt and faster fire'],
  wing: ['An escort orbits you and rams enemies', 'A second escort joins', 'Wider orbit and harder hits', 'A third escort joins', 'A fourth escort and a faster orbit'],
  arc: ['Lightning leaps between enemies and cracks armour', 'Chains to two more targets', 'Arc damage up 40%', 'Fires sooner and chains further', 'Two chains strike at once'],
  missile: ['A homing pair that bursts on impact', 'Four missiles per salvo', 'Bigger, harder blasts', 'Six missiles per salvo', 'Faster reload and more damage'],
  nova: ['A ring pulses out and shoves enemies back', 'A wider ring', 'Ring damage up 50%', 'Pulses sooner and wider', 'Every pulse comes twice'],
};
export const EVO: Record<string, { from: WeapId; name: string; d: string }> = {
  railstorm: { from: 'pulse', name: 'Railstorm', d: 'Three piercing rails, each through up to six ships' },
  halo: { from: 'wing', name: 'Halo', d: 'Eight escorts ride a burning ring' },
  tempest: { from: 'arc', name: 'Tempest', d: 'Three storm chains strike twice a second' },
  hive: { from: 'missile', name: 'Hive', d: 'A swarm of twelve seekers every salvo' },
  supernova: { from: 'nova', name: 'Supernova', d: 'Twin rings sweep the field and mend your hull' },
};
export const BOOST: Record<BoostId, { name: string; d: (L: number) => string }> = {
  magnet: { name: 'Magnet', d: () => 'Pickup reach up 35%' },
  damage: { name: 'Damage', d: () => 'All damage up 12%, more on heavies' },
  cooldown: { name: 'Cooldown', d: () => 'Weapons fire 6% faster' },
  area: { name: 'Area', d: () => 'Rings, blasts and orbits 12% larger' },
  thrust: { name: 'Thrusters', d: () => 'Fly 10% faster' },
  hull: { name: 'Hull', d: (L) => (L === 0 ? 'One more hull and slow repairs' : L % 2 ? 'Repairs come faster' : 'One more hull, faster repairs') },
};
const PULSE = { cd: [0.6, 0.56, 0.52, 0.48, 0.42], n: [1, 1, 2, 2, 3], dmg: [6, 7.5, 7.5, 9, 9.5] };
const WING = { n: [1, 2, 2, 3, 4], r: [92, 92, 112, 112, 124], sp: [2.4, 2.4, 2.6, 2.8, 3.2], dmg: [7, 7, 10, 10, 12] };
const ARC = { cd: [1.5, 1.4, 1.3, 1.1, 1.0], jumps: [3, 5, 5, 6, 7], dmg: [8, 8, 11, 11, 13], chains: [1, 1, 1, 1, 2], range: [150, 150, 150, 175, 175] };
const MISS = { cd: [2.3, 2.2, 2.1, 1.9, 1.6], n: [2, 4, 4, 6, 6], dmg: [10, 10, 14, 14, 17], r: [46, 46, 60, 60, 66] };
const NOVA = { cd: [3.4, 3.2, 3.0, 2.6, 2.4], r: [150, 180, 180, 205, 225], dmg: [8, 8, 12, 12, 15], dbl: [0, 0, 0, 0, 1] };

export const bl = (id: BoostId) => G.bm[id] || 0;
export const dmgM = () => 1 + 0.12 * bl('damage'), cdM = () => 1 - 0.06 * bl('cooldown'), areaM = () => 1 + 0.12 * bl('area'), spdM = () => 1 + 0.1 * bl('thrust');
export const magR = () => 135 * V.U * (1 + 0.35 * bl('magnet')) * (G.wm.missile && G.wm.missile.evo ? 1.3 : 1);
export const maxHull = () => 3 + [0, 1, 1, 2, 2, 3][bl('hull')];
export const regenEvery = () => (bl('hull') ? 50 - 6 * bl('hull') : 0);
export const needFor = (L: number) => (L === 1 ? 4 : Math.round(5 + 6 * (L - 1) + 1.8 * Math.pow(L - 1, 1.55) + 4 * Math.pow(Math.max(0, L - 10), 1.7)));
export const mkW = (id: WeapId): Weapon => ({ id, lv: 1, evo: false, t: 0.25, a: 0, n: 0, p: 0, R: 0, px: new Float32Array(8), py: new Float32Array(8) });

export function addBolt(x: number, y: number, vx: number, vy: number, d: number, p: number) { const P = BO; if (P.n >= P.cap) return; const i = P.n++; P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.l[i] = 0; P.d[i] = d; P.p[i] = p; P.h[i] = 0; }
const bossT = () => { const b = G.boss; return b && !b.dead && b.alpha > 0.5 && onView(b.x, b.y, -10) ? b : null; };

function firePulse(w: Weapon) {
  const L = w.lv - 1, n = PULSE.n[L], sw = shipW(), sh = shipH(), U = V.U;
  toWorld(0, -sh * 0.48); const found = nearestK(LP.x, LP.y, Math.max(V.vw, V.vh) * 0.85, n); if (!found) return false;
  const spd = 1000 * U, dmg = PULSE.dmg[L] * dmgM(), bt = bossT(), lock = bt && (n > 1 || (++w.n & 1));
  for (let i = 0; i < n; i++) {
    const e = lock && bt && i >= n - (n > 2 ? 2 : 1) ? bt : EN[NK[Math.min(i, found - 1)]], ox = n === 1 ? 0 : (i - (n - 1) / 2) * sw * 0.2;
    toWorld(ox, -sh * 0.46 + Math.abs(ox) * 1.6 * sh / sw); const x0 = LP.x, y0 = LP.y, tt = Math.hypot(e.x - x0, e.y - y0) / spd;
    let a = Math.atan2(e.y + e.vy * tt - y0, e.x + e.vx * tt - x0); if (i >= found) a += (i % 2 ? 1 : -1) * 0.07;
    addBolt(x0, y0, Math.cos(a) * spd, Math.sin(a) * spd, dmg, 0);
    fx(3, x0, y0, 16 * U, 0.08, 2);
  }
  ship.muzzle = 1; ship.kick = 0.7; return true;
}
export function railHits(x0: number, y0: number, dx: number, dy: number, len: number, bw: number, buf: Int32Array) {
  const x1 = x0 + dx * len, y1 = y0 + dy * len; let n = 0;
  for (let i = 0; i < WS.nE; i++) { const e = EN[i]; if (e.dead || e.mode === -1 || e.alpha < 0.4) continue; if (edist(e, x0, y0, x1, y1) <= e.r + bw) n = sortIn(buf, n, i, SS.t); }
  return Math.min(n, 6);
}
const RT: Enemy[] = [];
function fireRail() {
  const U = V.U; toWorld(0, -shipH() * 0.48); const x0 = LP.x, y0 = LP.y;
  const found = nearestK(x0, y0, Math.max(V.vw, V.vh), 3); if (!found) return false;
  const dmg = 13 * dmgM(), bw = 10 * U * areaM(), bt = bossT();
  for (let b = 0; b < 3; b++) RT[b] = EN[NK[b % found]];
  if (bt) { let o = bt; for (let b = 0; b < found; b++) if (EN[NK[b]] !== bt) { o = EN[NK[b]]; break; } RT[0] = o; RT[1] = RT[2] = bt; }
  for (let b = 0; b < 3; b++) {
    const t = RT[b], rep = (b > 0 && RT[b - 1] === t ? 1 : 0) + (b > 1 && RT[b - 2] === t ? 1 : 0), side = rep ? (rep === 1 ? 1 : -1) : 0;
    let dx = t.x - x0, dy = t.y - y0, d = Math.hypot(dx, dy) || 1;
    const ox = -dy / d * side * t.r * 0.45, oy = dx / d * side * t.r * 0.45; dx += ox; dy += oy; d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let len = Math.hypot(V.vw, V.vh);
    if (dy < -1e-3) len = Math.min(len, (C.y0 - 20 - y0) / dy); if (dx > 1e-3) len = Math.min(len, (C.x1 + 20 - x0) / dx); if (dx < -1e-3) len = Math.min(len, (C.x0 - 20 - x0) / dx); if (dy > 1e-3) len = Math.min(len, (C.y1 + 20 - y0) / dy);
    len = Math.max(len, d);
    const slot = BM.find((s) => !s.on); if (slot) { slot.on = true; slot.x0 = x0; slot.y0 = y0; slot.x1 = x0 + dx * len; slot.y1 = y0 + dy * len; slot.t = 0; slot.d = 0.22; slot.w = bw; }
    const n = railHits(x0, y0, dx, dy, len, bw, QB);
    for (let j = 0; j < n; j++) { const e = EN[QB[j]]; hit(e, dmg, dx * 110 * U, dy * 110 * U); sparks(e.x, e.y, 3, 300 * U, 1, 6); fx(3, e.x, e.y, 20 * U, 0.12, 1, 0.6); }
  }
  ship.muzzle = 0.9; ship.kick = 1; fx(0, x0, y0, 40 * U, 0.14, 1, 0.5); addShake(0.02); return true;
}
export function updWing(w: Weapon, dt: number) {
  const U = V.U, evo = w.evo, L = w.lv - 1, n = evo ? 8 : WING.n[L], R = (evo ? 172 : WING.r[L]) * U * areaM(), sp = evo ? 2.0 : WING.sp[L];
  const dmg = (evo ? 17 : WING.dmg[L]) * dmgM(), hr = (evo ? 22 : 17) * U;
  w.a += sp * dt; w.n = n; w.R = R;
  for (let i = 0; i < n; i++) {
    const a = w.a + i / n * TAU, x = ship.x + Math.cos(a) * R, y = ship.y + Math.sin(a) * R;
    w.px[i] = x; w.py[i] = y;
    if (dt <= 0) continue;
    const c = query(x, y, hr, QB);
    for (let j = 0; j < c; j++) {
      const e = EN[QB[j]]; if (G.clock - e.wingT < 0.3) continue; e.wingT = G.clock;
      const dx = e.x - ship.x, dy = e.y - ship.y, d = Math.hypot(dx, dy) || 1;
      hit(e, dmg, dx / d * 260 * U, dy / d * 260 * U); sparks((x + e.x) / 2, (y + e.y) / 2, 4, 240 * U, evo ? 1 : 2, 6);
    }
  }
  if (evo && dt > 0) {
    const c = query(ship.x, ship.y, R + 30 * U, QR), band = 15 * U;
    for (let j = 0; j < c; j++) {
      const e = EN[QR[j]]; if (G.clock - e.ringT < 0.28) continue;
      const dx = e.x - ship.x, dy = e.y - ship.y, de = Math.hypot(dx, dy);
      if (Math.abs(de - R) < band + e.r * 0.6) { e.ringT = G.clock; const d = de || 1; hit(e, 9 * dmgM(), dx / d * 120 * U, dy / d * 120 * U); if (rand() < 0.4) sparks(e.x, e.y, 2, 180 * U, 1, 5); }
    }
  }
}
function fireArc(w: Weapon) {
  const U = V.U, evo = w.evo, L = w.lv - 1, chains = evo ? 3 : ARC.chains[L], jumps = evo ? 9 : ARC.jumps[L], dmg = (evo ? 17 : ARC.dmg[L]) * dmgM(), range = (evo ? 210 : ARC.range[L]) * U * areaM();
  const found = nearestK(ship.x, ship.y, (evo ? 560 : 420) * U, chains); if (!found) return false;
  toWorld(0, -shipH() * 0.46); const nx = LP.x, ny = LP.y;
  for (let c = 0; c < found; c++) {
    const S = AR.find((s) => !s.on); if (!S) break;
    S.on = true; S.t = 0; S.d = evo ? 0.24 : 0.17; S.g = evo; S.p[0] = nx; S.p[1] = ny; S.n = 1;
    G.arcId++; let e: (typeof EN)[number] | null = EN[NK[c]];
    for (let j = 0; j < jumps && e; j++) {
      e.arc = G.arcId; S.p[S.n * 2] = e.x; S.p[S.n * 2 + 1] = e.y; S.n++;
      const ox = e.x, oy = e.y; hit(e, e.t === T_HV ? dmg * 1.6 : dmg); sparks(ox, oy, evo ? 5 : 3, 260 * U, evo ? 1 : 2, 6);
      const cnt = query(ox, oy, range, QA); let nb: (typeof EN)[number] | null = null, bd = 1e12;
      for (let q = 0; q < cnt; q++) { const o = EN[QA[q]]; if (o.arc === G.arcId || o.mode === -1) continue; const d2 = (o.x - ox) ** 2 + (o.y - oy) ** 2; if (d2 < bd) { bd = d2; nb = o; } }
      e = nb;
    }
  }
  addShake(evo ? 0.05 : 0.02); return true;
}
function addMissile(x: number, y: number, vx: number, vy: number, t: (typeof EN)[number] | null, d: number, r: number, g: number) {
  const P = MI; if (P.n >= P.cap) return; const i = P.n++;
  P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.l[i] = 0; P.d[i] = d; P.r[i] = r; P.g[i] = g; P.tid[i] = t ? t.id : 0; P.sp[i] = Math.hypot(vx, vy); MT[i] = t;
}
function fireMissiles(w: Weapon) {
  const U = V.U, evo = w.evo, L = w.lv - 1, n = evo ? 12 : MISS.n[L], dmg = (evo ? 19 : MISS.dmg[L]) * dmgM(), r = (evo ? 84 : MISS.r[L]) * U * areaM();
  const found = nearestK(ship.x, ship.y, Math.max(V.vw, V.vh), Math.min(8, n)); if (!found) return false;
  const sw = shipW(), sh = shipH(), bt = bossT();
  for (let i = 0; i < n; i++) {
    const t = bt && i % 2 ? bt : EN[NK[i % found]], side = i % 2 ? 1 : -1, row = Math.floor(i / 2) % 3;
    const la = evo ? i / n * TAU + G.clock : side * (1.15 + Math.floor(i / 2) * 0.32), a = ship.h - Math.PI / 2 + la, sp = (evo ? 380 : 280) * U;
    toWorld(side * sw * (0.2 + row * 0.07), sh * (0.06 + row * 0.08));
    addMissile(LP.x, LP.y, Math.cos(a) * sp, Math.sin(a) * sp, t, dmg, r, evo ? 1 : 0);
  }
  return true;
}
function explode(x: number, y: number, r: number, dmg: number, g: number) {
  const U = V.U, c = query(x, y, r, QA);
  for (let j = 0; j < c; j++) { const e = EN[QA[j]], dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1; hit(e, dmg, dx / d * 200 * U, dy / d * 200 * U); }
  fx(0, x, y, r * (g ? 1.15 : 0.9), g ? 0.3 : 0.2, g ? 1 : 0, g ? 0.75 : 0.65); if (g) fx(1, x, y, r * 1.05, 0.34, 1, 0.6);
  const m = Math.max(0.35, 1 / (1 + G.killsF * 0.1));
  for (let i = 0; i < (g ? 12 : 8) * m; i++) { const a = rand() * TAU, v = r * rnd(2, 6); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.2, 0.45), rnd(5, 9) * U, i % 3 ? 0 : 1, 3.5); }
  addShake(g ? 0.03 : 0.022);
}
export function novaRing(x: number, y: number, r: number, dmg: number, kb: number, c: number, d: number) {
  const S = NR.find((s) => !s.on); if (!S) return;
  S.on = true; S.x = x; S.y = y; S.r = r; S.t = 0; S.d = d; S.hit.clear(); S.dmg = dmg; S.kb = kb; S.c = c;
  fx(0, x, y, r * (c ? 0.24 : 0.3), 0.22, c ? 1 : 2, c ? 0.5 : 0.6);
}
function fireNova(w: Weapon) {
  const U = V.U, evo = w.evo, L = w.lv - 1, R = (evo ? 340 : NOVA.r[L]) * U * areaM(), dmg = (evo ? 30 : NOVA.dmg[L]) * dmgM(), kb = (evo ? 520 : 320) * U;
  novaRing(ship.x, ship.y, R, dmg, kb, evo ? 1 : 0, evo ? 0.7 : 0.5);
  if (evo || NOVA.dbl[L]) w.p = 0.2;
  if (evo) {
    w.n++;
    if (w.n % 4 === 0 && G.hull < maxHull()) { G.hull++; setHull(false, true); fx(1, ship.x, ship.y, 120 * U, 0.5, 1); live(`Hull repaired. ${G.hull} hull.`); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; spark(ship.x + Math.cos(a) * 20, ship.y + Math.sin(a) * 20, Math.cos(a) * R * 1.6, Math.sin(a) * R * 1.6, 0.55, 12 * U, i % 3 ? 1 : 0, 2.6); }
  }
  addShake(evo ? 0.14 : 0.05);
}
export function updWeapons(dt: number) {
  const U = V.U;
  for (let i = 0; i < G.W.length; i++) {
    const w = G.W[i];
    if (w.id === 'wing') { updWing(w, dt); continue; }
    if (dt <= 0) continue;
    w.t -= dt;
    if (w.id === 'nova' && w.p > 0) { w.p -= dt; if (w.p <= 0) { const L = w.lv - 1; novaRing(ship.x, ship.y, (w.evo ? 280 : NOVA.r[L]) * U * areaM(), (w.evo ? 22 : NOVA.dmg[L]) * dmgM(), (w.evo ? 380 : 260) * U, w.evo ? 2 : 0, w.evo ? 0.6 : 0.5); } }
    if (w.t > 0) continue;
    const L = w.lv - 1, cd = cdM();
    if (w.id === 'pulse') w.t = w.evo ? (fireRail() ? 0.45 * cd : 0.05) : firePulse(w) ? PULSE.cd[L] * cd : 0.05;
    else if (w.id === 'arc') w.t = fireArc(w) ? (w.evo ? 0.5 : ARC.cd[L]) * cd : 0.1;
    else if (w.id === 'missile') w.t = fireMissiles(w) ? (w.evo ? 1.6 : MISS.cd[L]) * cd : 0.15;
    else if (w.id === 'nova') { fireNova(w); w.t = (w.evo ? 2.8 : NOVA.cd[L]) * cd; }
  }
}

export function updBolts(dt: number) {
  const P = BO, U = V.U;
  for (let i = P.n - 1; i >= 0; i--) {
    const x0 = P.x[i], y0 = P.y[i];
    P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt; P.l[i] += dt;
    const x1 = P.x[i], y1 = P.y[i], n = sweep(x0, y0, x1, y1, 5 * U, QB);
    let gone = false;
    for (let j = 0; j < n && !gone; j++) {
      const e = EN[QB[j]]; if (e.id === P.h[i] || e.mode === -1) continue;
      edist(e, x0, y0, x1, y1); const x = x0 + (x1 - x0) * SS.t, y = y0 + (y1 - y0) * SS.t;
      hit(e, P.d[i], P.vx[i] * 0.05, P.vy[i] * 0.05); sparks(x, y, 3, 200 * U, 2, 5); fx(3, x, y, 14 * U, 0.1, 2);
      P.h[i] = e.id; P.p[i]--;
      if (P.p[i] < 0) { rm(P, i); gone = true; }
    }
    if (!gone && (P.l[i] > 1.5 || !onView(x1, y1, 40))) rm(P, i);
  }
}
export function updMissiles(dt: number) {
  const P = MI, U = V.U;
  for (let i = P.n - 1; i >= 0; i--) {
    P.l[i] += dt; let t = MT[i];
    if (!t || t.dead || t.id !== P.tid[i]) { const f = nearestK(P.x[i], P.y[i], 700 * U, 1); t = f ? EN[NK[0]] : null; MT[i] = t; P.tid[i] = t ? t.id : 0; }
    let vx = P.vx[i], vy = P.vy[i];
    const sp = Math.min((P.g[i] ? 820 : 760) * U, P.sp[i] + dt * 1500 * U); P.sp[i] = sp;
    let a = Math.atan2(vy, vx);
    if (t) { const b = Math.atan2(t.y - P.y[i], t.x - P.x[i]); let df = b - a; df -= TAU * Math.round(df / TAU); const turn = (5 + P.l[i] * 10) * dt; a += clamp(df, -turn, turn); }
    vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; P.vx[i] = vx; P.vy[i] = vy;
    const x0 = P.x[i], y0 = P.y[i];
    P.x[i] += vx * dt; P.y[i] += vy * dt;
    const x = P.x[i], y = P.y[i];
    if (rand() < 0.45) spark(x - vx * 0.03, y - vy * 0.03, -vx * 0.05 + rnd(-24, 24), -vy * 0.05 + rnd(-24, 24), rnd(0.25, 0.42), (P.g[i] ? 13 : 11) * U, P.g[i] ? 5 : 4, 3);
    let boom = P.l[i] > 2.8;
    if (!boom && t && edist(t, x0, y0, x, y) < t.r + 6 * U) boom = true;
    if (!boom && P.l[i] > 0.15 && sweep(x0, y0, x, y, 4 * U, QB) > 0) boom = true;
    if (!onView(x, y, 120)) { rm(P, i); MT[i] = MT[P.n]; continue; }
    if (boom) { explode(x, y, P.r[i], P.d[i], P.g[i]); rm(P, i); MT[i] = MT[P.n]; }
  }
}
export function updNova(dt: number) {
  for (const S of NR) {
    if (!S.on) continue;
    S.t += dt; const f = S.t / S.d; if (f >= 1) { S.on = false; continue; }
    const cr = S.r * (1 - Math.pow(1 - f, 3)), c = query(S.x, S.y, cr, QR);
    for (let j = 0; j < c; j++) {
      const e = EN[QR[j]]; if (S.hit.has(e.id)) continue;
      const dx = e.x - S.x, dy = e.y - S.y, de = Math.hypot(dx, dy); if (de > cr + e.r + e.L) continue;
      S.hit.add(e.id); const d = de || 1, k = S.kb * (1 - 0.5 * clamp(de / S.r));
      hit(e, S.dmg, dx / d * k, dy / d * k);
    }
  }
}
export function updShards(dt: number) {
  const P = SH, U = V.U, mr = magR(), mr2 = mr * mr, pick = shipR() + 10 * U;
  for (let i = P.n - 1; i >= 0; i--) {
    P.a[i] += dt;
    const dx = ship.x - P.x[i], dy = ship.y - P.y[i], d2 = dx * dx + dy * dy;
    if (!P.st[i] && d2 < mr2 && !G.over) { P.st[i] = 1; P.sp[i] = -120 * U; }
    if (P.st[i]) {
      const d = Math.sqrt(d2) || 1;
      if (d < pick) { gainXP(P.v[i]); spark(ship.x + rnd(-10, 10) * U, ship.y + rnd(-10, 10) * U, rnd(-50, 50) * U, rnd(-50, 50) * U, 0.32, (P.k[i] === 2 ? 22 : 14) * U, 6, 2); rm(P, i); continue; }
      P.sp[i] = Math.min(1300 * U, P.sp[i] + dt * 2600 * U);
      const m = Math.min(d, P.sp[i] * dt); P.x[i] += dx / d * m; P.y[i] += dy / d * m;
    }
  }
}
export function updBullets(dt: number) {
  const P = EB, sr = shipR() * 0.85;
  for (let i = P.n - 1; i >= 0; i--) {
    P.l[i] += dt; P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
    const x = P.x[i], y = P.y[i];
    if (P.l[i] > 7 || !onView(x, y, 60)) { rm(P, i); continue; }
    const q = sr + 7 * V.U; if (!G.over && G.inv <= 0 && (x - ship.x) ** 2 + (y - ship.y) ** 2 < q * q) { rm(P, i); hurt('bullet'); }
  }
}

export function gainXP(v: number) {
  if (import.meta.env.MODE === 'test' && T.stress) return;
  G.xp += v;
  while (G.xp >= G.need) { G.xp -= G.need; G.level++; G.need = needFor(G.level); G.pend++; }
  if (G.pend && G.lvlT <= 0 && !G.card && !G.over) levelBurst();
}
function levelBurst() {
  const U = V.U;
  G.lvlT = 0.42; if (!reduce) G.slow = Math.max(G.slow, 0.42);
  fx(2, ship.x, ship.y, 300 * U, 0.45, 0); fx(0, ship.x, ship.y, 140 * U, 0.4, 1);
  lvlUp();
  const n = query(ship.x, ship.y, 240 * U, QR);
  for (let j = 0; j < n; j++) { const e = EN[QR[j]], dx = e.x - ship.x, dy = e.y - ship.y, d = Math.hypot(dx, dy) || 1; e.kx += dx / d * 360 * U / TYPES[e.t].mass; e.ky += dy / d * 360 * U / TYPES[e.t].mass; }
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; spark(ship.x, ship.y, Math.cos(a) * 520 * U, Math.sin(a) * 520 * U, 0.45, 9 * U, i % 2 ? 1 : 2, 4); }
}
