import { $ } from '../util';
import { A, burst, clamp, ctx, D, F, G, lerp, rand, rnd, scene, ship, sprite, SPR, V, type Drone } from './core';
import { dps, fireMul, lv, scoreMul, twist, TWISTS } from './upgrades';
import { bumpScore, live, msg, showCard } from './hud';
import { limX } from './flight';
import { hurt } from './combat';

type Shape = { img: 'drone' | 'dart' | 'heavy'; sz: number; hp: number; sp: number; wob: number; pts: number };
const TYPES: Record<string, Shape> = {
  scout: { img: 'drone', sz: 0.22, hp: 1.5, sp: 1, wob: 1, pts: 100 },
  dart: { img: 'dart', sz: 0.17, hp: 0.5, sp: 1.6, wob: 0.6, pts: 150 },
  heavy: { img: 'heavy', sz: 0.27, hp: 4.5, sp: 0.7, wob: 0.4, pts: 300 },
};
const LESSON = ['Scouts · Lock on and fire', 'Darts · Watch their crossing paths', 'Heavies · They deny a lane'];

export const projS = (z: number) => 0.04 + 0.96 * Math.pow(clamp(z), 2.2);
const proj = (wx: number, wy: number, z: number) => { const s = projS(z); return { x: scene.vp.x + wx * V.W * 0.62 * s, y: scene.vp.y + wy * V.H * 0.7 * s + s * V.H * 0.12, s }; };

function mkDrone(type: 'scout' | 'dart' | 'heavy', wx: number, wy: number, z: number, o: Partial<Drone> = {}): Drone {
  const T = TYPES[type], s = G.sector;
  return Object.assign({
    type, wx, wy, z, sp: (0.17 + rnd(0, 0.03)) * T.sp, ph: rnd(0, 6.28), wob: (0.1 + rnd(0, 0.15)) * T.wob, hp: T.hp * (1 + 0.15 * (s - 1)), pts: T.pts, flash: 0, dead: false, tilt: 0, state: 'approach' as const,
    zh: type === 'heavy' ? rnd(0.44, 0.54) : rnd(0.5, 0.66), holdT: type === 'heavy' ? 8 : 6, shooter: type !== 'dart', next: 0, armour: 0, elite: null, dir: rand() < 0.5 ? -1 : 1,
    interval: 0, cross: false, dive: false, retreat: false, gone: false, fade: 1, on: false, sx: 0, sy: 0, ss: 0, hw: 0, hh: 0, boss: false, max: 0, zt: 0, sz: 0, st: 0, dur: 0, atk: 'volley' as const, nextAtk: 'volley' as const, phase: 1, escT: 0, marks: [],
  }, o);
}

function spawnWave() {
  G.wave++; G.waveDone = false; G.leaked = 0; G.waveHits = 0; G.shield = lv('shield'); G.waveT = G.clock;
  const cyc = (G.wave - 1) % 4, s = G.sector, tw = twist();
  $('wave').textContent = `Wave ${String(G.wave).padStart(2, '0')}${G.heat ? ` · Heat ${G.heat}` : ''}`;
  if (cyc === 3) {
    const P = dps() / (1 / 0.13), hp = (140 + 35 * (s - 1)) * (1 + 0.45 * clamp(P - 1, 0, 2));
    G.drones.push(Object.assign(mkDrone('scout', 0, 0, 0), { type: 'boss' as const, boss: true, hp, max: hp, pts: 5000, sp: 0, zt: 0.6, sz: V.tall ? 1.5 : 1.12, state: 'arrive' as const, st: 0, nextAtk: 'volley' as const, phase: 1, escT: 2, shooter: false }));
    G.cap = 12; msg('Warning', 'Monolith inbound', 1800); live('Warning. Monolith inbound.'); D.hero.classList.add('bossing'); return;
  }
  const groups = ([[['scout', 'scout', 'scout'], ['scout', 'scout', 'scout']], [['scout', 'dart', 'scout', 'dart'], ['dart', 'scout', 'dart', 'scout']], [['scout', 'heavy', 'scout'], ['dart', 'heavy', 'dart'], ['scout', 'heavy', 'dart', 'scout']]] as ('scout' | 'dart' | 'heavy')[][][])[cyc].map((g) => g.slice());
  const total = groups.flat().length, extra = Math.round(total * (Math.min(1 + 0.15 * (s - 1), 1.75) * (tw === 'swarm' ? 1.3 : 1) - 1));
  for (let i = 0; i < extra; i++) groups[i % groups.length].push(i % 2 || cyc === 0 ? 'scout' : 'dart');
  if (tw === 'swift') groups.forEach((g) => g.push('dart'));
  const interval = { scout: Math.max(0.9, (cyc === 0 ? 1.9 : cyc === 1 ? 1.5 : 1.3) / fireMul()), heavy: Math.max(1.3, 1.8 / fireMul()), dart: 0 };
  G.warn = cyc === 0 && s === 1 ? 0.6 : 0.55;
  G.travel = (cyc === 0 ? 1.0 : cyc === 1 ? 0.92 : 0.86) * Math.max(0.8, 1 - 0.05 * (s - 1));
  G.cap = [4, 6, 8][cyc] + (s - 1) + G.heat;
  const list: Drone[] = [];
  groups.forEach((g, gi) => {
    const off = rnd(-0.15, 0.15), wy = rnd(-0.08, 0.14);
    g.forEach((type, i) => {
      const f = g.length > 1 ? i / (g.length - 1) : 0.5, wx = (f * 2 - 1) * 0.62 + off;
      const d = mkDrone(type, wx, wy + Math.abs(f * 2 - 1) * 0.08, -gi * 0.42 - i * 0.03, { interval: interval[type] });
      if (type === 'dart') { d.cross = true; d.sp *= tw === 'swift' ? 1.3 : 1; }
      if (cyc === 0 && s === 1) d.shooter = i % 2 === 0;
      if (tw === 'shielded' && type !== 'dart') d.armour = 1;
      list.push(d);
    });
  });
  const elites = s >= 2 ? 1 + G.heat : 0, pool = list.filter((d) => d.type !== 'dart');
  for (let i = 0; i < elites && pool.length; i++) { const d = pool.splice(Math.floor(rand() * pool.length), 1)[0]; d.elite = rand() < 0.5 ? 'armour' : 'commander'; if (d.elite === 'armour') d.armour = Math.max(d.armour, 1.5); d.pts *= 2; }
  G.drones.push(...list);
  msg(`Wave ${String(G.wave).padStart(2, '0')}`, s === 1 ? LESSON[cyc] : `Sector ${s} · ${TWISTS[(s - 2) % TWISTS.length].name}`);
}

function enemyShot(x: number, y: number, tx: number, ty: number, dur: number) {
  if (G.enemyBolts.length >= G.cap) return false;
  G.enemyBolts.push({ x0: x, y0: y, tx: clamp(tx, 0, V.W), ty, t: 0, dur: dur * (lv('stasis') ? 1 / (1 - [0, 0.15, 0.25][lv('stasis')]) : 1), px: x, py: y });
  return true;
}

function bossThink(d: Drone, P: { x: number; y: number }, sz: number, dh: number, dt: number) {
  d.st += dt;
  if (d.state === 'arrive') { if (d.st > 1.3) { d.state = 'gap'; d.st = 0; d.dur = 0.6; } return; }
  const sw = ship.base * ship.sc, hw = sw * 0.16, br = 7, W = V.W;
  if (d.phase === 2 && d.state === 'gap') { d.escT -= dt; if (d.escT <= 0) { d.escT = 4; const z2 = d.z * 0.8, s3 = projS(z2); for (const s2 of [-1, 1]) G.drones.push(mkDrone('dart', (P.x - scene.vp.x) / (W * 0.62 * s3) + s2 * 0.3, (P.y - scene.vp.y - s3 * V.H * 0.12) / (V.H * 0.7 * s3), z2, { cross: true })); } }
  if (d.state === 'gap' && d.st >= d.dur) {
    d.state = 'tele'; d.st = 0; d.atk = d.nextAtk; d.nextAtk = d.atk === 'volley' ? 'sweep' : 'volley';
    d.dur = Math.max(0.75, (d.atk === 'volley' ? 0.8 : 0.95) - 0.03 * (G.sector - 1));
    const fly = d.atk === 'volley' ? 1.0 : 1.15, life = d.dur + fly * 1.1;
    if (d.atk === 'volley') {
      d.marks = [-1, 0, 1].map((i) => ({ x: clamp(ship.x + i * sw * 0.72, sw * 0.3, W - sw * 0.3), y: ship.y }));
      d.marks.forEach((m) => G.tele.push({ x: m.x, y: m.y, fx: P.x, fy: P.y, w: 0, life: 0, warn: d.dur, dur: life }));
    } else {
      const L = limX() * W, Rr = W - L, need = (48 + 2 * (hw + br)) / 3, lanes = clamp(Math.floor((Rr - L) / need) + 1, 4, 9), sp = (Rr - L) / (lanes - 1), gi = 1 + Math.floor(rand() * (lanes - 3));
      d.marks = [];
      for (let i = 0; i < lanes; i++) { const x = L + sp * i; if (i === gi || i === gi + 1) continue; d.marks.push({ x, y: ship.y }); G.tele.push({ x, y: ship.y, fx: P.x, fy: P.y, w: 0, life: 0, warn: d.dur, dur: life }); }
      G.tele.push({ x: L + sp * (gi + 0.5), y: ship.y, fx: 0, fy: 0, w: sp * 3 - 2 * (hw + br), life: 0, warn: d.dur, dur: life, safe: true });
    }
    return;
  }
  if (d.state === 'tele' && d.st >= d.dur) {
    const fly = d.atk === 'volley' ? 1.0 : 1.15, cap = G.cap; G.cap = 99;
    d.marks.forEach((m, i) => enemyShot(P.x + (i - (d.marks.length - 1) / 2) * sz * 0.06, P.y + dh * 0.04, m.x, m.y, fly));
    G.cap = cap; d.state = 'gap'; d.st = 0; d.dur = d.phase === 2 ? 0.55 : 0.85;
  }
}

export function waveTick() {
  const liveN = G.drones.filter((d) => !d.dead && !d.gone && !d.retreat).length;
  if (!liveN && G.wave > 0 && !G.waveDone) {
    G.waveDone = true;
    if (F.now - G.bossDownAt < 4000) G.nextWave = 1e15;
    else {
      const intercept = G.leaked === 0 ? 1000 : 0, clean = G.waveHits === 0 ? 500 : 0, bonus = Math.round((intercept + clean) * scoreMul());
      if (bonus) { G.score += bonus; bumpScore(); }
      msg(intercept && clean ? 'Flawless' : intercept ? 'All intercepted' : clean ? 'Untouched' : 'Wave clear', bonus ? `+${bonus}` : 'Choose an upgrade', 900);
      G.nextWave = 1e15; const run = G.run; setTimeout(() => { if (G.run === run && G.on && !G.over && !G.card) showCard('draft'); }, 950);
    }
  }
  if (G.waveDone && F.now > G.nextWave) spawnWave();
}

export function drawDrones() {
  const { rdt, dt } = F, W = V.W, H = V.H;
  const order = G.drones.slice().sort((a, b) => a.z - b.z);
  let bossNow: Drone | null = null;
  const commanders = G.drones.filter((d) => d.elite === 'commander' && !d.dead && !d.retreat && d.on);
  for (const d of order) {
    if (d.dead || d.gone) continue;
    const T = TYPES[d.type] || TYPES.scout, img = d.boss ? A.boss : A[T.img];
    if (!img) continue;
    if (d.retreat) { d.z -= rdt * 0.9; d.fade -= rdt * 2.5; if (d.fade <= 0 || d.z < 0) { d.gone = true; continue; } }
    else if (d.boss) d.z += (d.zt - d.z) * (1 - Math.exp(-dt * 2.2));
    else if (d.state === 'approach') {
      d.z += dt * d.sp; if (d.type !== 'dart' && d.z >= d.zh) d.state = 'hold';
      if (d.type === 'dart' && G.on && !G.over && d.z >= 0.62) { const sz3 = projS(d.z), tw2 = (ship.x - scene.vp.x) / (W * 0.62 * sz3); if (!d.dive) { d.dive = true; d.wx += d.cross ? d.dir * Math.sin(G.clock * 1.4 + d.ph) * 0.6 : 0; d.cross = false; } d.wx += (tw2 - d.wx) * (1 - Math.exp(-dt * 2.4)); }
    }
    else if (d.state === 'hold') { d.z += dt * d.sp * 0.06; d.holdT -= dt; if (d.holdT <= 0) d.state = 'leave'; }
    else d.z += dt * d.sp * 1.7;
    const wob = d.boss ? 0 : Math.sin(G.clock * 1.3 + d.ph) * d.wob;
    const drift = d.state === 'hold' ? Math.sin(G.clock * 0.7 + d.ph) * 0.18 : 0;
    const bx = d.boss ? 0 : d.wx + wob * 0.3 + drift + (d.cross ? d.dir * Math.sin(G.clock * 1.4 + d.ph) * 0.6 : 0), by = d.boss ? 0 : d.wy + Math.cos(G.clock + d.ph) * 0.04;
    let P = proj(bx, by, d.z);
    const sz = Math.min(W, H) * (d.boss ? d.sz : T.sz) * P.s, dh = sz * img.height / img.width;
    if (d.boss) {
      const k = clamp(d.z / d.zt), sway = d.phase === 2 ? 0.62 : 0.45;
      const ty2 = Math.max(H * (V.tall ? 0.34 : 0.37), V.barBottom + 28 + dh / 2) + Math.sin(G.clock * 0.7) * H * 0.012;
      P = { x: W / 2 + Math.sin(G.clock * sway) * W * (V.tall ? 0.2 : 0.24) * k, y: lerp(scene.vp.y, ty2, k), s: P.s };
    }
    if (dt > 0) d.tilt = lerp(d.tilt, clamp((P.x - (d.on ? d.sx : P.x)) / dt / W * (d.boss ? 0.15 : 0.6), -0.5, 0.5), 1 - Math.exp(-dt * 6));
    d.on = true; d.sx = P.x; d.sy = P.y; d.ss = P.s; d.flash = Math.max(0, d.flash - rdt * 12); d.hw = sz * 0.45; d.hh = dh * 0.45;
    if (d.z < 0) continue;
    const a = clamp(d.z * 6) * d.fade;
    if (d.dive && !d.retreat && G.on && d.z < 0.95) { ctx.strokeStyle = `rgba(255,120,79,${0.45 * a})`; ctx.lineWidth = 1.5; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(ship.x, ship.y); ctx.stroke(); ctx.setLineDash([]); }
    if (d.cross && !d.retreat && G.on && d.z > 0.2 && d.z < 0.9) {
      const fz = Math.min(d.z + d.sp * 0.7, 1), fb = d.wx + d.dir * Math.sin((G.clock + 0.7) * 1.4 + d.ph) * 0.6, FP = proj(fb, d.wy, fz);
      ctx.strokeStyle = `rgba(255,150,80,${0.35 * a})`; ctx.lineWidth = 1.5; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.quadraticCurveTo(lerp(P.x, FP.x, 0.5), P.y, FP.x, FP.y); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha = a; ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(wob * 0.4 + d.tilt);
    ctx.drawImage(img, -sz / 2, -dh / 2, sz, dh);
    if (d.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = d.flash * (d.boss ? 0.35 : 0.9); ctx.drawImage(img, -sz / 2, -dh / 2, sz, dh); ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore(); ctx.globalAlpha = 1;
    if (d.armour > 0 && !d.boss) { ctx.strokeStyle = `rgba(143,211,255,${0.55 * a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(P.x, P.y, sz * 0.52, dh * 0.62, 0, 0, 6.28); ctx.stroke(); }
    if (d.elite === 'commander') { const r = sz * 0.18 + 4; ctx.fillStyle = `rgba(255,207,138,${0.9 * a})`; ctx.beginPath(); ctx.moveTo(P.x, P.y - dh * 0.6 - r); ctx.lineTo(P.x + r * 0.7, P.y - dh * 0.6); ctx.lineTo(P.x, P.y - dh * 0.6 + r); ctx.lineTo(P.x - r * 0.7, P.y - dh * 0.6); ctx.closePath(); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter';
    if (d.boss) {
      bossNow = d;
      const charge = d.state === 'tele' ? clamp(d.st / d.dur) : 0, beat = (0.75 + 0.25 * Math.sin(G.clock * (d.phase === 2 ? 7 : 4))) * (d.phase === 2 ? 1.25 : 1) + charge * 0.9;
      sprite(SPR.core, P.x, P.y, sz * 0.5 * (1 + charge * 0.3), beat * a);
    } else {
      sprite(SPR.amber, P.x, P.y, sz * 0.5, 0.5 * a);
      if (d.next && G.clock > d.next - G.warn && G.clock < d.next) sprite(SPR.core, P.x, P.y + dh * 0.1, sz * (0.3 + 0.35 * clamp(1 - (d.next - G.clock) / G.warn)), 0.95 * a);
    }
    if (G.on && G.lock === d && !G.card) { const rx = d.boss ? d.hw * 0.9 : Math.max(sz, 28) * 0.62, ry = d.boss ? d.hh * 0.9 : rx, c = 8; ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(255,207,138,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const [ux, uy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(P.x + ux * rx, P.y + uy * ry - uy * c); ctx.lineTo(P.x + ux * rx, P.y + uy * ry); ctx.lineTo(P.x + ux * rx - ux * c, P.y + uy * ry); } ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';

    if (G.on && !G.over && !G.card && !d.retreat) {
      if (d.boss) bossThink(d, P, sz, dh, dt);
      else if (d.shooter && d.state !== 'leave' && d.z >= 0.3) {
        if (!d.next) d.next = G.clock + Math.max(0, 2 - (G.clock - G.waveT)) + rnd(0.4, 1.4);
        if (G.clock >= d.next) {
          const boost = commanders.some((c) => c !== d && Math.hypot(c.sx - d.sx, c.sy - d.sy) < W * 0.3) ? 1.35 : 1;
          let ok: boolean;
          if (d.type === 'heavy') { ok = true; const lane = ship.x; for (const o of [-1, 0, 1]) ok = enemyShot(P.x + o * sz * 0.2, P.y, lane + o * F.sw * 0.7, ship.y, G.travel) && ok; }
          else ok = enemyShot(P.x, P.y, ship.x + ship.vx * 0.45, ship.y, G.travel);
          d.next = ok ? G.clock + d.interval / boost * rnd(0.9, 1.1) : G.clock + 0.4;
        }
      }
    }
    if (!d.boss && G.on && !d.retreat && d.z > 0.92) {
      if (!G.over && Math.abs(P.x - ship.x) < F.sw * 0.3 && Math.abs(P.y - ship.y) < F.sw * 0.22 && ship.hit <= 0) { hurt(); d.dead = true; burst(P.x, P.y, 1); }
      else if (d.z > 1.05) { d.gone = true; G.leaked++; G.combo = Math.max(1, G.combo - 2); }
    } else if (!d.boss && !G.on && d.z > 1.05) d.gone = true;
  }
  G.drones = G.drones.filter((d) => !d.dead && !d.gone);
  if (G.lock && (G.lock.dead || G.lock.gone)) G.lock = null;
  if (bossNow && G.on && !G.over) { D.bossBar.classList.add('on'); D.bossFill.style.transform = `scale3d(${clamp(bossNow.hp / bossNow.max).toFixed(3)}, 1, 1)`; }
  else D.bossBar.classList.remove('on');
}
