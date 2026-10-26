import { reduce } from '../state';
import { addShake, cam, CAP, capD, clamp, coarse, D, FAC, G, onView, pad2, rand, ringPt, rnd, ship, shipR, srand, srnd, T, T_BS, T_DA, T_HV, T_SW, TAU, TYPES, V, wrapA, type Enemy } from './core';
import { PAL, prepFaction } from './sprites';
import { CAPE, debris, EB, EN, fx, later, QS, query, SH, spark, spawn, TG, WS } from './world';
import { bl, maxHull, regenEvery } from './weapons';
import { hurt } from './flight';
import { live, msg } from './hud';
import { setHull } from './cards';

export function hit(e: Enemy, dmg: number, kx = 0, ky = 0) {
  if (e.dead) return;
  if (e.t === T_HV) dmg *= 1 + 0.1 * bl('damage');
  e.hp -= dmg; if (e.flash < -0.05) e.flash = 0.06;
  const m = TYPES[e.t].mass; e.kx += kx / m; e.ky += ky / m;
  if (e.hp <= 0) kill(e);
}
function kill(e: Enemy) {
  e.dead = 1; G.kills++; G.killsF++;
  if (e.t === T_BS) { bossDown(e); return; }
  const Ty = TYPES[e.t];
  deathBurst(e.x, e.y, e.w, e.t, e.elite, e.f);
  dropShard(e.x, e.y, e.elite ? 12 : Ty.xp);
  addShake(e.t === T_HV ? 0.16 : e.elite ? 0.14 : e.t === T_DA ? 0.03 : 0.035);
  if (e.t === T_HV || e.elite) fx(3, e.x, e.y, e.w * 1.25, 0.08, e.elite ? 1 : 0);
}
export function deathBurst(x: number, y: number, w: number, t: number, elite: number, f: number) {
  const U = V.U, P = PAL[f], many = Math.max(0.3, 1 / (1 + G.killsF * 0.14)) * (reduce ? 0.4 : 1), big = t === T_HV || t === T_BS;
  const ns = Math.round((big ? 30 : t === T_DA ? 10 : 15) * (elite ? 1.6 : 1) * many), v0 = (big ? 380 : 300) * U;
  for (let i = 0; i < ns; i++) { const a = rand() * TAU, v = v0 * rnd(0.25, 1); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.25, 0.6), rnd(5, 11) * U * (big ? 1.25 : 1), elite && i % 2 ? 1 : i % P.mix === 0 ? P.streak[1] : P.streak[0], 3); }
  const ne = Math.round((big ? 8 : 3) * many);
  for (let i = 0; i < ne; i++) { const a = rand() * TAU, v = v0 * rnd(0.1, 0.4); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.6, 1.1), rnd(10, 18) * U, P.ember, 1.6); }
  const nd = Math.round((big ? 14 : 5) * many);
  for (let i = 0; i < nd; i++) { const a = rand() * TAU, v = v0 * rnd(0.2, 0.7); debris(x + rnd(-0.2, 0.2) * w, y + rnd(-0.2, 0.2) * w, Math.cos(a) * v, Math.sin(a) * v, rnd(0.55, 1.1), rnd(2.2, 5.5) * U * (big ? 1.5 : 1), P.deb + ((rand() * 4) | 0)); }
  const nk = Math.round((big ? 7 : 3) * P.smoke * many);
  for (let i = 0; i < nk; i++) { const a = rand() * TAU, v = v0 * rnd(0.05, 0.22); debris(x + rnd(-0.25, 0.25) * w, y + rnd(-0.25, 0.25) * w, Math.cos(a) * v, Math.sin(a) * v, rnd(0.9, 1.6), w * rnd(0.22, 0.34), 12); }
  fx(0, x, y, w * (big ? 1 : 0.85), big ? 0.38 : 0.26, elite ? 1 : P.fx);
  if (big || elite) fx(1, x, y, w * 1.2, 0.36, elite ? 1 : P.fx, 0.7);
}
function dropShard(x: number, y: number, v: number) {
  const P = SH, U = V.U, kind = (n: number) => (n >= 8 ? 2 : n > 1 ? 1 : 0);
  if (P.n > 40) { const r2 = (70 * U) ** 2; for (let i = 0; i < P.n; i++) { if (P.st[i]) continue; const d = (P.x[i] - x) ** 2 + (P.y[i] - y) ** 2; if (d < r2) { P.v[i] += v; P.k[i] = kind(P.v[i]); return; } } }
  if (P.n >= P.cap) { let bi = 0, bd = 1e12; for (let i = 0; i < P.n; i++) { if (P.st[i]) continue; const d = (P.x[i] - x) ** 2 + (P.y[i] - y) ** 2; if (d < bd) { bd = d; bi = i; } } P.v[bi] += v; P.k[bi] = kind(P.v[bi]); return; }
  const i = P.n++; P.x[i] = x + srnd(-4, 4) * U; P.y[i] = y + srnd(-4, 4) * U; P.v[i] = v; P.st[i] = 0; P.sp[i] = 0; P.ph[i] = srand() * TAU; P.k[i] = kind(v); P.a[i] = 0;
}

function heavyFire(e: Enemy, dt: number) {
  e.fire -= dt; e.charge = e.fire < 0.7 && e.fire > 0 ? 1 - e.fire / 0.7 : 0;
  if (e.fire > 0) return;
  e.fire = srnd(6.5, 10) * Math.max(0.7, 1 - (G.clock - 120) / 800) / FAC[e.f].fire;
  if (!onView(e.x, e.y, -10) || e.alpha < 1 || EB.n >= EB.cap) return;
  const sp = 190 * V.U, nx = e.x + Math.sin(e.rot) * e.w * 0.55, ny = e.y - Math.cos(e.rot) * e.w * 0.55, tt = Math.hypot(ship.x - nx, ship.y - ny) / sp, a = Math.atan2(ship.y + ship.vy * tt * 0.5 - ny, ship.x + ship.vx * tt * 0.5 - nx);
  const i = EB.n++; EB.x[i] = nx; EB.y[i] = ny; EB.vx[i] = Math.cos(a) * sp; EB.vy[i] = Math.sin(a) * sp; EB.l[i] = 0; EB.f[i] = e.f;
  fx(0, nx, ny, e.w * 0.4, 0.2, PAL[e.f].fx, 0.8);
}
const CAPHP = { base: 0.636, grow: 1.6 };
function brood(e: Enemy, n: number, a0: number) {
  for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU, s = spawn(T_SW, e.x + Math.cos(a) * e.w * 1.2, e.y + Math.sin(a) * e.w * 1.2); if (s) { s.alpha = 0.3; if (import.meta.env.MODE === 'test') T.brood++; } }
  fx(1, e.x, e.y, e.w * 2, 0.4, 0);
}
function aimAt(e: Enemy, first: boolean) { e.mode = 1; e.st = 0; e.aim = (first ? CAP.track : CAP.retrack) + CAP.lock; }
function bossThink(e: Enemy, dt: number) {
  const U = V.U, Fa = FAC[e.f], st0 = e.st; e.st += dt;
  const dx = ship.x - e.x, dy = ship.y - e.y, d = Math.hypot(dx, dy) || 1, near = onView(e.x, e.y, -e.w * 0.4);
  if (e.mode === 0) {
    const sp = TYPES[T_BS].sp * U * (near ? 1 : 2.6) * (1 + 0.15 * (G.bossN - 1)), f = 1 - Math.exp(-dt * 1.5);
    e.vx += (dx / d * sp - e.vx) * f; e.vy += (dy / d * sp - e.vy) * f;
    if (!Fa.brood) { e.sum -= dt; if (e.sum <= 0 && near) { e.sum = 9; brood(e, 8, 0); } }
    if (e.st > 5.5 && near) { e.pass = Fa.passes; if (Fa.brood) { e.mode = 3; e.st = 0; } else aimAt(e, true); }
    e.rot += wrapA(Math.atan2(e.vx, -e.vy) - e.rot) * (1 - Math.exp(-dt * TYPES[T_BS].turn));
  } else if (e.mode === 3) {
    const k = Math.exp(-dt * 4); e.vx *= k; e.vy *= k;
    for (let w = 0; w < 3; w++) { const at = 0.35 + w * 0.5; if (st0 < at && e.st >= at) brood(e, 6, w * 0.5); }
    if (e.st > 1.8) aimAt(e, true);
  } else if (e.mode === 1) {
    const k = Math.exp(-dt * 6); e.vx *= k; e.vy *= k;
    if (e.st < e.aim - CAP.lock) { e.dx = dx / d; e.dy = dy / d; }
    e.rot += wrapA(Math.atan2(e.dx, -e.dy) - e.rot) * (1 - Math.exp(-dt * 9));
    if (e.st > e.aim) { e.mode = 2; e.st = 0; addShake(0.25); fx(0, e.x, e.y, e.w * 1.6, 0.3, 1); }
  } else {
    const sp = 560 * U; e.vx = e.dx * sp; e.vy = e.dy * sp; e.rot = Math.atan2(e.dx, -e.dy);
    if (rand() < 0.6) spark(e.x - e.dx * e.L * 1.3 + rnd(-0.3, 0.3) * e.w * Fa.wide, e.y - e.dy * e.L * 1.3, -e.dx * 200 * U, -e.dy * 200 * U, 0.4, 14 * U, PAL[e.f].streak[0], 2);
    if (e.st > Fa.dash) { if (--e.pass > 0) aimAt(e, false); else { e.mode = 0; e.st = 0; } }
  }
}
const capHp = () => Math.round(TYPES[T_BS].hp * CAPHP.base * CAPHP.grow ** G.bossN);
export function spawnBoss() {
  const P = ringPt(140 * V.U), e = spawn(T_BS, P.x, P.y); if (!e) return false;
  e.hp = e.max = capHp(); e.sum = 3.5; G.boss = e; G.bossN++;
  D.bossName.textContent = G.lap ? `${FAC[G.fac].cap} ${pad2(G.lap + 1)}` : FAC[G.fac].cap; live(`${D.bossName.textContent} engaged.`);
  return true;
}
function bossDown(e: Enemy) {
  G.boss = null; D.hero.classList.remove('bossing');
  const x = e.x, y = e.y, w = e.w, f = e.f, ux = Math.sin(e.rot) * e.L, uy = -Math.cos(e.rot) * e.L;
  G.stop = reduce ? 0 : 0.1; if (!reduce) G.slow = 0.8; addShake(0.6);
  for (let i = 0; i < 8; i++) later(0.05 + i * 0.1, () => { const k = rnd(-1, 1); deathBurst(x + ux * k + rnd(-0.3, 0.3) * w, y + uy * k + rnd(-0.3, 0.3) * w, w * 0.9, T_HV, 0, f); addShake(0.25); });
  later(0.95, () => { deathBurst(x, y, w * 2.6, T_BS, 1, f); fx(2, x, y, w * 4.8, 0.9, 0); addShake(0.9); for (let i = 0; i < SH.n; i++) SH.st[i] = 1; G.cache = { x, y, t: 0, f }; if (import.meta.env.MODE === 'test') T.notes.push('cache'); });
  for (let i = 0; i < 22; i++) { const k = srnd(-1, 1); dropShard(x + ux * k + srnd(-0.6, 0.6) * w, y + uy * k + srnd(-0.6, 0.6) * w, 8); }
  if (G.hull < maxHull()) { G.hull++; setHull(false, true); }
  const name = FAC[f].short;
  msg(`${name} down`, 'Fly over the cache', 2200, true, '', 2); live(`${name} down. Hull repaired. Fly over the gold cache it drops.`);
  G.reveal = CAP.reveal; G.nextBoss = Infinity; G.calmT = G.clock; G.dartT = Math.max(G.dartT, CAP.calm + CAP.ramp * 0.5);
  G.switching = true; later(CAP.calm, nextFaction);
}
export function nextFaction() {
  G.switching = false; if (G.over || !G.on) return;
  G.fac = (G.fac + 1) % FAC.length; if (!G.fac) G.lap++;
  prepFaction(G.fac);
  for (let i = 0; i < WS.nE; i++) { const e = EN[i]; if (!e.dead && e.f !== G.fac && e.t !== T_DA && e.t !== T_BS && e.mode >= 0 && e.mode < 8) e.peel = srnd(0.3, 3.4); }
  const F = FAC[G.fac];
  msg(F.banner, F.sub || `Lap ${pad2(G.lap + 1)}`, 2600, true, F.id, 2, () => !!G.cache || G.reveal > 0); live(`${F.banner}.`);
}
function telegraph(x: number, y: number, dx: number, dy: number, d: number) { const S = TG.find((s) => !s.on); if (!S) return; S.on = true; S.x = x; S.y = y; S.dx = dx; S.dy = dy; S.t = 0; S.d = d; }
export function dartLine() {
  const U = V.U, n = 4 + Math.min(4, Math.floor(G.clock / 60)), P = ringPt(40 * U), x0 = P.x, y0 = P.y;
  let dx = ship.x - x0, dy = ship.y - y0; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  const gap = 46 * U, wait = 0.9;
  for (let i = 0; i < n; i++) { const e = spawn(T_DA, x0 - dx * gap * i, y0 - dy * gap * i); if (!e) break; e.mode = -1; e.st = wait + i * 0.06; e.dx = dx; e.dy = dy; e.alpha = 1; e.rot = Math.atan2(dx, -dy); }
  telegraph(x0, y0, dx, dy, wait + 0.35);
  if (!G.tips.dart) { G.tips.dart = 1; msg('Interceptors', 'Clear the line', 1200, false, '', 0); }
}
function group(c: number) {
  const U = V.U, t = G.clock, P = ringPt(40 * U), x = P.x, y = P.y;
  let nh = 0; for (let i = 0; i < WS.nE; i++) if (EN[i].t === T_HV && !EN[i].dead) nh++;
  const hp = t < 60 ? 0 : Math.min(0.12, 0.04 + (t - 60) / 240 * 0.08), el = t < 45 ? 0 : Math.min(0.03, 0.008 + (t - 45) / 600);
  for (let i = 0; i < c; i++) {
    const type = srand() < hp && nh + 1 <= Math.max(2, (WS.nE + 1) * 0.15) ? T_HV : T_SW, elite = type === T_SW && srand() < el ? 1 : 0;
    if (type === T_HV) nh++;
    if (!spawn(type, x + srnd(-1, 1) * 42 * U, y + srnd(-1, 1) * 42 * U, elite)) return;
  }
}
const popTarget = () => {
  if (import.meta.env.MODE === 'test' && T.stress) return CAPE;
  const t = G.clock, st = Math.floor(t / 30), n = t < 20 ? 4 + t * 0.35 : 10 + st * 16 + Math.max(0, st - 3) * 6 + (t % 30) * 0.2;
  return Math.min(CAPE - 4, n * (coarse || V.tall ? 0.6 : 1));
};
export const calmK = () => { const c = G.clock - G.calmT; return c < CAP.calm ? 0.25 : Math.min(1, 0.25 + 0.75 * (c - CAP.calm) / CAP.ramp); };
export function spawner(dt: number) {
  const t = G.clock, stress = import.meta.env.MODE === 'test' && T.stress, calm = t - G.calmT, k = calmK();
  let target = popTarget() * k; if (G.boss) target *= 0.75;
  const rate = stress ? 400 : t < 20 ? 0.8 + t * 0.03 : 1.3 + t / 22 + Math.pow(Math.max(0, t - 60), 1.5) / 600;
  G.spawnAcc += dt * k * (rate + Math.max(0, target * 0.85 - WS.nE) * 0.6);
  while (G.spawnAcc >= 1 && WS.nE < target) { const c = Math.max(1, Math.min(Math.floor(G.spawnAcc), 1 + Math.floor(srand() * Math.min(5, 1 + t / 35)))); G.spawnAcc -= c; group(c); }
  if (G.spawnAcc > 6) G.spawnAcc = 6;
  G.dartT -= dt; if (G.dartT <= 0 && !stress && calm >= CAP.calm) { dartLine(); G.dartT = Math.max(4.5, 11 - t / 40) + srnd(0, 2.5); }
  const due = !G.boss && !G.cache && !G.switching;
  if (!G.warned && due && t >= G.nextBoss - 3) { const n = FAC[G.fac].short; G.warned = true; msg('Warning', `${n} inbound`, 2400, true, '', 3); live(`Warning. ${n} inbound.`); D.hero.classList.add('bossing'); }
  if (due && t >= G.nextBoss && spawnBoss()) { G.nextBoss = Infinity; G.warned = false; }
  if (t >= 60 && !G.tips.hv) { G.tips.hv = 1; msg('Gunships', 'Slow and armoured', 1200, false, '', 0); }
  if (t >= 120 && !G.tips.arm) { G.tips.arm = 1; msg('Gunships armed', 'Their shots are slow', 1300, false, '', 0); }
  const re = regenEvery();
  if (re && G.hull < maxHull()) { G.regen += dt; if (G.regen >= re) { G.regen = 0; G.hull++; setHull(false, true); live(`Hull repaired. ${G.hull} hull.`); } } else G.regen = 0;
}

function relocate(e: Enemy) {
  const U = V.U, P = ringPt(40 * U + e.w * 0.5), vx = ship.vx, vy = ship.vy; let x = P.x - cam.x, y = P.y - cam.y;
  if (x * vx + y * vy < 0 && vx * vx + vy * vy > 900 * U * U) { x = -x; y = -y; }
  e.x = cam.x + x; e.y = cam.y + y; e.kx = e.ky = 0; e.vx *= 0.3; e.vy *= 0.3;
}
export function updEnemies(dt: number, rdt: number) {
  const U = V.U, sx = ship.x, sy = ship.y, sr = shipR(), armed = G.clock >= 120, fx0 = V.vw * 0.5 + V.far, fy0 = V.vh * 0.5 + V.far, tf = G.clock < 20 ? 0.8 : 1 + Math.min(0.3, G.clock / 700);
  for (let i = 0; i < WS.nE; i++) {
    const e = EN[i]; if (e.dead) continue;
    e.flash -= rdt;
    if (e.mode === -1) { e.st -= dt; if (e.st <= 0) e.mode = 1; continue; }
    e.age += dt;
    if (e.mode === 9) { e.alpha -= dt * 2.6; const dx = e.x - sx, dy = e.y - sy, d = Math.hypot(dx, dy) || 1; e.x += dx / d * dt * 160 * U; e.y += dy / d * dt * 160 * U; if (e.alpha <= 0) e.dead = 1; continue; }
    const Ty = TYPES[e.t], Fa = FAC[e.f], far = Math.abs(e.x - cam.x) > fx0 || Math.abs(e.y - cam.y) > fy0;
    if (e.t === T_DA) {
      const sp = Ty.sp * U * e.sp; e.vx = e.dx * sp; e.vy = e.dy * sp;
      if (e.age > 1 && far) { e.dead = 1; continue; }
    } else if (e.t === T_BS) bossThink(e, dt);
    else if (e.mode === 8) {
      if (far || (e.age > 0.5 && !onView(e.x, e.y, e.w * 2))) { e.dead = 1; continue; }
      let dx = e.x - sx, dy = e.y - sy; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const sp = Math.max(Ty.sp * 2.4, 280) * U, f = 1 - Math.exp(-dt * 1.8);
      e.vx += (dx * sp - e.vx) * f; e.vy += (dy * sp - e.vy) * f;
      e.rot += wrapA(Math.atan2(e.vx, -e.vy) - e.rot) * (1 - Math.exp(-dt * Math.max(Ty.turn, 3)));
    } else {
      if (far) { if (e.f !== G.fac) { e.dead = 1; continue; } relocate(e); }
      if (e.peel > 0) { e.peel -= dt; if (e.peel <= 0) { e.mode = 8; e.age = 0; } }
      let dx = sx - e.x, dy = sy - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const sw = e.t === T_SW, weave = sw && Fa.weave, wob = weave ? Math.sin(G.clock * 3.3 + e.ph) * 0.85 : Math.sin(G.clock * 2.1 + e.ph) * 0.35, sp = Ty.sp * U * e.sp * (sw ? Fa.speed : 1) * (onView(e.x, e.y, 0) ? 1 : 1.6) * tf / (weave ? Math.hypot(1, wob) : 1);
      const f = 1 - Math.exp(-dt * (e.t === T_HV ? 1.6 : 3.2));
      e.vx += ((dx - dy * wob) * sp - e.vx) * f; e.vy += ((dy + dx * wob) * sp - e.vy) * f;
      if (sw && Fa.jink) { e.fire -= dt; if (e.fire <= 0) { e.fire = srnd(0.9, 2.1); const s = srand() < 0.5 ? -1 : 1, k = 240 * U; e.kx -= dy * s * k; e.ky += dx * s * k; } }
      const hx = e.vx + (sw && Fa.jink ? e.kx * 0.6 : 0), hy = e.vy + (sw && Fa.jink ? e.ky * 0.6 : 0);
      if (hx * hx + hy * hy > 4) e.rot += wrapA(Math.atan2(hx, -hy) - e.rot) * (1 - Math.exp(-dt * Ty.turn));
      if (e.t === T_HV && armed) heavyFire(e, dt);
    }
    e.x += (e.vx + e.kx) * dt; e.y += (e.vy + e.ky) * dt;
    const kd = Math.exp(-dt * 5); e.kx *= kd; e.ky *= kd;
    if (e.alpha < 1) e.alpha = Math.min(1, e.alpha + dt * 4);
    if (!G.over && G.inv <= 0 && e.alpha > 0.6 && e.mode !== 8) { const q = e.r * (e.t === T_BS && e.mode === 2 ? Fa.wide : 1) + sr; if ((e.L ? capD(e, sx, sy) : Math.hypot(e.x - sx, e.y - sy)) < q) { const ux = Math.sin(e.rot), uy = -Math.cos(e.rot), k = e.L ? clamp((sx - e.x) * ux + (sy - e.y) * uy, -e.L, e.L) : 0; hurt(e.t === T_HV ? 'heavy' : e.t === T_DA ? 'dart' : e.t === T_BS ? 'boss' : 'swarm', e.x + ux * k, e.y + uy * k); } }
  }
}
export function separate(dt: number) {
  const f = Math.min(1, dt * 10), fh = Math.min(1, dt * 14);
  for (let i = 0; i < WS.nE; i++) {
    const e = EN[i]; if (e.dead || e.mode === -1 || e.t === T_DA || e.mode === 9) continue;
    const hv = e.t === T_HV, n = query(e.x, e.y, e.r * (hv ? 1.9 : 0.9), QS), me = TYPES[e.t].mass; let px = 0, py = 0, hx = 0, hy = 0;
    for (let j = 0; j < n; j++) {
      const o = EN[QS[j]]; if (o === e || o.t === T_DA) continue;
      const both = hv && o.t === T_HV, dx = e.x - o.x, dy = e.y - o.y, rr = (e.r + o.r) * (both ? 1.45 : 0.82), d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      if (d2 < 1e-4) { if (both) hx += (e.id < o.id ? -0.05 : 0.05) * rr; continue; }
      const d = Math.sqrt(d2), ov = (rr - d) / d;
      if (both) { hx += dx * ov * 0.5; hy += dy * ov * 0.5; continue; }
      const mo = TYPES[o.t].mass, wg = mo / (mo + me);
      px += dx * ov * wg; py += dy * ov * wg;
    }
    e.x += px * f + hx * fh; e.y += py * f + hy * fh;
  }
}
