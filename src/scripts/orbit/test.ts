import { $ } from '../util';
import { A, C, cam, D, DV, FAC, G, input, onView, rnd, rs, ship, shipR, T_DA, T_HV, TAU, TYPES, V, VP, type BoostId, type WeapId } from './core';
import { prepFaction, S } from './art';
import { EB, EN, QBOT, query, SH, spawn, TG, WS, BM, BO, MI, SP } from './world';
import { bl, maxHull, mkW, spdM, WEAP, gainXP } from './weapons';
import { dartLine, hit, nextFaction, spawnBoss } from './enemies';
import { hurt, start } from './flight';
import { renderBuild, renderHull } from './hud';
import { eligible } from './upgrades';

export const T = { god: false, stress: false, auto: false, frozen: false, botT: 0, botA: 0, botFlip: 15, botDir: 1, bdx: 0, bdy: 0, hits: [] as string[], work: new Float32Array(240), wi: 0, mark: 0 };

const TAUS = [0.05, 0.12, 0.24, 0.45], TAUW = [1.8, 1.4, 1, 0.55];
export function bot(rdt: number) {
  const U = V.U, vmax = 640 * U * spdM() * (V.tall ? 1.1 : 1), R = 420 * U, n = query(ship.x, ship.y, R, QBOT), sr = shipR(), Cc = 150 * U;
  T.botFlip -= rdt; if (T.botFlip <= 0) { T.botFlip = rnd(14, 26); T.botDir = -(T.botDir || 1); }
  let tx = 0, ty = 0;
  for (let j = 0; j < n; j++) { const e = EN[QBOT[j]], dx = e.x - ship.x, dy = e.y - ship.y, d = Math.hypot(dx, dy) || 1, w = Math.sqrt(TYPES[e.t].mass) / (d * d + 3600); tx += dx / d * w; ty += dy / d * w; }
  let ox: number, oy: number; const tl = Math.hypot(tx, ty);
  if (tl > 1e-12) { const ax = tx / tl, ay = ty / tl; ox = -ay * T.botDir - ax * 0.6; oy = ax * T.botDir - ay * 0.6; }
  else { T.botA += rdt * 0.35 * T.botDir; ox = Math.cos(T.botA); oy = Math.sin(T.botA); }
  const ol = Math.hypot(ox, oy) || 1; ox /= ol; oy /= ol;
  let sx = 0, sy = 0, sw = 0;
  for (let i = 0; i < SH.n; i++) { const dx = SH.x[i] - ship.x, dy = SH.y[i] - ship.y, d = Math.hypot(dx, dy) || 1; if (d > 720 * U) continue; const w = SH.v[i] / (d * d + 900); sx += dx / d * w; sy += dy / d * w; sw += w; }
  if (sw > 0) { const l = Math.hypot(sx, sy) || 1; sx /= l; sy /= l; }
  let qx = 0, qy = 0; if (G.boss && !G.cache) { const dx = G.boss.x - ship.x, dy = G.boss.y - ship.y, d = Math.hypot(dx, dy) || 1; if (d > 330 * U) { qx = dx / d; qy = dy / d; } }
  let gx = 0, gy = 0; if (G.cache) { const dx = G.cache.x - ship.x, dy = G.cache.y - ship.y, d = Math.hypot(dx, dy) || 1; gx = dx / d; gy = dy / d; }
  const bs = G.boss;
  let best = -1e9, bdx = 0, bdy = 0;
  for (let k = 0; k < 16; k++) {
    const a = k / 16 * TAU, dx = Math.cos(a), dy = Math.sin(a);
    let pen = 0;
    for (let q = 0; q < 4; q++) {
      const tau = TAUS[q], wq = TAUW[q], px = ship.x + dx * vmax * tau, py = ship.y + dy * vmax * tau;
      for (let j = 0; j < n; j++) {
        const e = EN[QBOT[j]], ex = e.x + (e.vx + e.kx) * tau, ey = e.y + (e.vy + e.ky) * tau, d = Math.hypot(px - ex, py - ey) - e.r - sr;
        if (d < Cc) { const f = (Cc - d) / Cc; pen += f * f * (e.t === T_HV ? 2.2 : e.t === T_DA ? 3 : 1) * 3 * wq; }
      }
      if (bs) { const ex = bs.x + bs.vx * tau, ey = bs.y + bs.vy * tau, d = Math.hypot(px - ex, py - ey) - bs.r - bs.L - sr; if (d < Cc * 1.6) { const f = (Cc * 1.6 - d) / (Cc * 1.6); pen += f * f * 8 * wq; }
        if (bs.mode) { const side = Math.abs((px - bs.x) * -bs.dy + (py - bs.y) * bs.dx), along = (px - bs.x) * bs.dx + (py - bs.y) * bs.dy; if (along > 0 && side < bs.w * 0.6 + sr + 30 * U) pen += 9 * wq; } }
      for (let i = 0; i < EB.n; i++) { const d = Math.hypot(px - EB.x[i] - EB.vx[i] * tau, py - EB.y[i] - EB.vy[i] * tau) - sr, BC = 120 * U; if (d < BC) { const f = (BC - d) / BC; pen += f * f * 10 * wq; } }
      for (const S of TG) { if (!S.on) continue; const side = Math.abs((px - S.x) * -S.dy + (py - S.y) * S.dx); if (side < 80 * U) pen += (1 - side / (80 * U)) * 5 * wq; }
    }
    const score = -pen * (G.cache ? 0.4 : 1) + 0.35 * (dx * ox + dy * oy) + (sw > 0 ? 1.1 : 0) * (dx * sx + dy * sy) + 3 * (dx * gx + dy * gy) + 1.4 * (dx * qx + dy * qy) + 0.2 * (dx * T.bdx + dy * T.bdy);
    if (score > best) { best = score; bdx = dx; bdy = dy; }
  }
  T.bdx = bdx; T.bdy = bdy;
  input.gx = ship.x + bdx * 200 * U; input.gy = ship.y + bdy * 200 * U;
}
export function botPick() {
  let bi = 0, bs = -1;
  G.opts.forEach((o, i) => {
    let s = 5;
    if (o.kind === 'e') s = 100;
    else if (o.kind === 'x') s = o.id === 'refit' && G.hull < maxHull() - 1 ? 60 : o.id === 'overdrive' || o.id === 'surge' ? 50 : 30;
    else if (o.kind === 'w') { const id = o.id as WeapId, w = G.wm[id]; s = w ? 60 + WEAP[id].prio + w.lv * 2 + (bl(WEAP[id].pair) ? 6 : 0) : G.W.length < 2 ? 48 + WEAP[id].prio : G.W.length < 3 ? 40 + WEAP[id].prio : 15; }
    else if (o.kind === 'b') { let pw = 0; for (const k of Object.keys(WEAP) as WeapId[]) { const w = G.wm[k]; if (WEAP[k].pair === o.id && w && !w.evo) pw = Math.max(pw, w.lv); } s = pw >= 5 ? 95 : pw >= 3 ? 66 + pw * 2 : pw ? 54 + pw * 2 : o.id === 'hull' && G.hull < 3 ? 50 : 24; }
    if (s > bs) { bs = s; bi = i; }
  });
  return bi;
}

const live = () => EN.slice(0, WS.nE).filter((e) => !e.dead);
const art = (f: number, t: number) => (A.art[f][t].currentSrc || A.art[f][t].src).split('/').pop()!.split('.')[0];
function heavyGap() {
  let worst = 9;
  for (let i = 0; i < WS.nE; i++) for (let j = i + 1; j < WS.nE; j++) { const a = EN[i], b = EN[j]; if (a.dead || b.dead || a.t !== T_HV || b.t !== T_HV) continue; worst = Math.min(worst, Math.hypot(a.x - b.x, a.y - b.y) / (a.r + b.r)); }
  return +worst.toFixed(3);
}

export function initTest() {
  const lg = {
    st: () => ({ ready: A.ready && !!S.key && S.fk[G.fac] === S.key, on: G.on, clock: +G.clock.toFixed(2), enemies: WS.nE, level: G.level, kills: G.kills, hull: G.hull, over: G.over, card: G.card, mode: G.mode, sparks: SP.n, shards: SH.n, W: G.W.map((w) => `${w.id}${w.evo ? '*' : w.lv}`), B: G.B.map((b) => `${b}${bl(b)}`), evos: G.W.filter((w) => w.evo).map((w) => WEAP[w.id].evo), dpr: V.DPR, z: +V.Z.toFixed(3), u: +V.U.toFixed(3), vw: Math.round(V.vw), vh: Math.round(V.vh), boss: G.boss ? +(G.boss.hp / G.boss.max).toFixed(2) : -1, x: Math.round(ship.x), y: Math.round(ship.y), vx: Math.round(ship.vx), vy: Math.round(ship.vy), shots: BO.n + MI.n + BM.filter((b) => b.on).length, vig: +D.vig.style.opacity || 0, shake: +G.shake.toFixed(2), view: +VP.p.toFixed(3), dir: VP.dir, top: G.on && VP.p >= 1, hd: Math.round(((ship.h * 180 / Math.PI) % 360 + 360) % 360), sx: Math.round(V.W / 2 + (ship.x - cam.x) * V.Z), sy: Math.round(V.H / 2 + (ship.y - cam.y) * V.Z), rx: Math.round(rs.x), ry: Math.round(rs.y), onscreen: EN.slice(0, WS.nE).filter((e) => !e.dead && onView(e.x, e.y, 0)).length, bossMode: G.boss ? G.boss.mode : -1, cache: !!G.cache, csx: G.cache ? Math.round(G.cache.x * C.wz + C.ox) : -1, csy: G.cache ? Math.round(G.cache.y * C.wz + C.oy) : -1, eligible: eligible(), nb: G.nextBoss, hv: EN.slice(0, WS.nE).filter((e) => !e.dead && e.t === T_HV).length, gap: heavyGap(), sw: Math.round(ship.play * V.Z), sh: Math.round(ship.play * V.Z * A.aspT),
      fac: G.fac, faction: FAC[G.fac].id, lap: G.lap, switching: G.switching, fe: FAC.map((_, f) => live().filter((e) => e.f === f).length), peel: live().filter((e) => e.mode === 8).length,
      fresh: [...new Set(live().filter((e) => e.id >= T.mark && e.mode !== -1).map((e) => art(e.f, e.t)))].sort(), sprites: S.fk.map((k) => k === S.key),
      banner: $('msgB').textContent ?? '', bannerSub: $('msgS').textContent ?? '', bannerOn: +(D.msg.style.opacity || 0), bossName: D.bossName.textContent ?? '', bsx: G.boss ? Math.round(G.boss.x * C.wz + C.ox) : -1, bsy: G.boss ? Math.round(G.boss.y * C.wz + C.oy) : -1,
      drop: +(DV.drop / V.H).toFixed(3), th: +DV.th.toFixed(3), ba: +DV.ba.toFixed(3), punch: +DV.punch.toFixed(3), ra: +DV.ra.toFixed(3), ta: +DV.ta.toFixed(3), rw: Math.round(DV.rw), tw: Math.round(DV.tw) }),
    work: () => Array.from(T.work).filter((v) => v > 0),
    hits: () => T.hits,
    start: () => start('mouse'),
    give: (id: string, lv = 5, evo = false) => { if (id in WEAP) { const wid = id as WeapId; let w = G.wm[wid]; if (!w) { w = mkW(wid); G.W.push(w); G.wm[wid] = w; } w.lv = lv; w.evo = evo; } else { const bid = id as BoostId; if (!G.B.includes(bid)) G.B.push(bid); G.bm[bid] = lv; } renderBuild(); renderHull(); },
    time: (t: number) => { G.clock = t; G.nextBoss = Math.max(G.nextBoss, t < 100 ? 100 : 100 + 180 * Math.ceil((t + 1 - 100) / 180)); },
    boss: () => spawnBoss(),
    killBoss: () => { if (G.boss) hit(G.boss, 1e9); },
    bossAt: (dx: number, dy: number, rot = 0) => { const b = G.boss; if (!b) return; b.x = ship.x + dx * V.U; b.y = ship.y + dy * V.U; b.rot = rot; b.vx = b.vy = 0; b.mode = 0; b.st = 0; b.alpha = 1; },
    cache: (dx = 150) => { G.cache = { x: ship.x + dx * V.U, y: ship.y, t: 0, f: G.fac }; },
    opts: () => G.opts.map((o) => `${o.kind}:${o.id}`),
    darts: () => dartLine(),
    squad: (t: number, elite = 0, n = 5) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; spawn(t, ship.x + Math.cos(a) * 230 * V.U, ship.y + Math.sin(a) * 230 * V.U, elite); } },
    heavies: (n: number) => { for (let i = 0; i < n; i++) spawn(T_HV, ship.x + 260 * V.U + rnd(-4, 4), ship.y + rnd(-4, 4)); },
    hurt: () => { G.inv = 0; hurt('test'); },
    xp: (v: number) => gainXP(v),
    autopilot: (on: boolean) => { T.auto = on; },
    god: (on: boolean) => { T.god = on; },
    stress: (on: boolean) => { T.stress = on; },
    freeze: (on: boolean) => { T.frozen = on; },
    hold: (p: number) => { VP.dir = 0; VP.p = p; },
    faction: (f: number) => { G.fac = f; prepFaction(f); },
    next: () => nextFaction(),
    mark: () => { T.mark = WS.serial; },
    clear: () => { for (let i = 0; i < WS.nE; i++) EN[i].dead = 1; },
    go: (d: number) => { VP.dir = d; },
  };
  Object.assign(window, { __lg: lg });
}
