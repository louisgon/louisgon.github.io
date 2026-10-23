import { reduce } from '../state';
import { addPart, burst, clamp, ctx, D, F, G, lerp, rand, rnd, scene, ship, sprite, SPR, V, type Bolt, type Drone, type Hit } from './core';
import { dmgMul, fireGap, lockRange, lv, maxLives, scoreMul } from './upgrades';
import { bumpScore, buzz, live, msg, setLives, showCard } from './hud';

const god = () => import.meta.env.MODE === 'test' && !!(window as unknown as { __god?: boolean }).__god;

export function acquire(x: number, range: number) {
  let tgt: Drone | null = null, bestD = range;
  for (const d of G.drones) {
    if (d.dead || d.gone || d.retreat || !d.on || d.state === 'arrive' || (!d.boss && (d.z < 0.24 || d.z > 0.97))) continue;
    const dx = Math.abs(d.sx - x) - (d.boss ? d.hw : 0);
    if (dx < bestD && d.sy < ship.y) { bestD = dx; tgt = d; }
  }
  return tgt;
}

export function bolt(x0: number, y0: number, tgt: Drone | null, spread = 0, dmg = 1) {
  const ox = tgt && tgt.boss ? rnd(-0.4, 0.4) * tgt.hw : 0, oy = tgt && tgt.boss ? rnd(-0.45, 0.45) * tgt.hh : 0;
  G.bolts.push({ x0, y0, t: 0, tgt, ox, oy, dmg: 0.5 * dmgMul() * dmg, ax: tgt ? tgt.sx + ox : scene.vp.x + (x0 - V.W / 2) * 0.35 + spread * V.W * 0.2, ay: tgt ? tgt.sy + oy : scene.vp.y + V.H * 0.04, dur: tgt ? 0.2 + (1 - tgt.z) * 0.22 : 0.5 });
}

function fireVolley() {
  ship.kick = 1; ship.muzzle = 1;
  const sw = ship.base * ship.sc, off = sw * 0.21, y0 = ship.y - sw * 0.1, range = lockRange();
  const tgt = acquire(ship.x, range); G.lock = tgt;
  for (const sgn of [-1, 1]) bolt(ship.x + sgn * off * (1 - Math.abs(ship.bank)), y0, tgt);
  if (lv('triple') >= 1) bolt(ship.x, y0 - sw * 0.06, tgt);
  if (lv('triple') >= 2) for (const sgn of [-1, 1]) bolt(ship.x + sgn * off * 1.4, y0, acquire(ship.x + sgn * V.W * 0.16, range * 0.8), sgn, 0.5);
}

export function damage(d: Drone, b: Hit) {
  let dmg = b.dmg || 0.5;
  if (d.armour > 0) { const a = Math.min(d.armour, dmg); d.armour -= a; dmg -= a; d.flash = 0.6; sprite(SPR.hit, d.sx, d.sy, 18 * Math.max(d.ss, 0.4), 0.7); if (dmg <= 0) return; }
  d.hp -= dmg; d.flash = 1;
  const hx = d.sx + (b.ox || 0), hy = d.sy + (b.oy || 0);
  sprite(SPR.hit, hx, hy, 16 * Math.max(d.ss, 0.4), 0.9);
  for (let i = 0; i < 5; i++) { const a = rand() * 6.28, v = 80 + rand() * 120; addPart({ x: hx, y: hy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.2, r: 1.6, c: '180,235,255' }); }
  if (!b.chain && G.relic === 'core') {
    const rad = V.W * (G.relicLv > 1 ? 0.11 : 0.08), sd = G.relicLv > 1 ? 0.5 : 0.35;
    addPart({ x: hx, y: hy, vx: 0, vy: 0, life: 0, max: 0.25, r: rad * 0.6, c: '', ring: true });
    for (const o of G.drones) if (o !== d && !o.dead && !o.retreat && o.on && Math.hypot(o.sx - hx, o.sy - hy) < rad) damage(o, { chain: true, dmg: sd });
  }
  if (d.boss && d.phase === 1 && d.hp <= d.max / 2) { d.phase = 2; d.escT = 2; msg('Core exposed', 'It hits faster now', 900); }
  if (d.hp > 0) return;
  d.dead = true;
  if (d.boss) { bossDown(d); return; }
  burst(d.sx, d.sy, Math.max(d.ss, 0.3) * (d.type === 'heavy' ? 1.4 : 1));
  G.combo = G.clock - G.comboT < 1.6 ? Math.min(G.combo + 1, 8) : 1; G.comboT = G.clock;
  const pts = Math.round(d.pts * G.combo * scoreMul()); G.score += pts; bumpScore();
  G.pops.push({ x: d.sx, y: d.sy, txt: G.combo > 1 ? `+${pts} ×${G.combo}` : `+${pts}`, life: 0 }); if (G.pops.length > 3) G.pops.shift();
  G.shake = Math.max(G.shake, d.type === 'heavy' ? 0.3 : 0.12);
  if ((d.type === 'heavy' || d.elite) && !reduce) G.slow = 0.08;
  if (!b.chain && lv('arc')) {
    const near = G.drones.filter((o) => o !== d && !o.dead && !o.retreat && !o.boss && o.on && Math.hypot(o.sx - d.sx, o.sy - d.sy) < V.W * 0.3).sort((a, c) => Math.hypot(a.sx - d.sx, a.sy - d.sy) - Math.hypot(c.sx - d.sx, c.sy - d.sy)).slice(0, lv('arc'));
    near.forEach((o) => { G.arcs.push({ x1: d.sx, y1: d.sy, x2: o.sx, y2: o.sy, life: 0 }); damage(o, { chain: true, dmg: 0.5 }); });
  }
}

function bossDown(d: Drone) {
  D.hero.classList.remove('bossing'); G.bossDownAt = performance.now(); G.score += Math.round(d.pts * scoreMul()); bumpScore();
  const run = G.run, w = Math.min(V.W, V.H) * d.sz * d.ss;
  for (let i = 0; i < 9; i++) setTimeout(() => { if (G.run !== run) return; burst(d.sx + (rand() - 0.5) * w * 0.7, d.sy + (rand() - 0.5) * w * 0.9, 1.2); G.shake = Math.max(G.shake, reduce ? 0 : 0.35); }, i * 120);
  setTimeout(() => { if (G.run !== run) return; burst(d.sx, d.sy, 2.4); if (!reduce) { G.flash = 0.5; G.shake = 0.9; } }, 1100);
  if (!reduce) G.slow = 0.35;
  G.enemyBolts = []; G.tele = []; G.drones.forEach((o) => { if (!o.dead && !o.boss) o.retreat = true; });
  msg('Monolith down', `+${Math.round(d.pts * scoreMul())}`, 1500); live('Monolith down.');
  setTimeout(() => { if (G.run !== run || !G.on || G.over) return; repair(); showCard('relic'); }, 2000);
}

function repair() { if (G.lives >= maxLives()) return false; G.lives++; setLives(false); return true; }

export function hurt() {
  if (god()) { ship.hit = 0.4; return; }
  if (G.shield > 0) { G.shield--; ship.hit = 0.5; addPart({ x: ship.x, y: ship.y, vx: 0, vy: 0, life: 0, max: 0.4, r: ship.base * ship.sc * 0.7, c: '', ring: true }); live('Deflector absorbed the hit.'); return; }
  if (G.relic === 'phase') { G.enemyBolts = []; G.tele = []; }
  ship.hit = G.relic === 'phase' ? (G.relicLv > 1 ? 2 : 1.6) : 0.8;
  G.lives--; G.waveHits++; G.combo = 1; burst(ship.x, ship.y - ship.base * 0.05, 0.8, false);
  if (!reduce) { G.shake = 0.6; G.flash = 0.8; }
  buzz(30); setLives(true);
  if (G.lives <= 0) {
    G.over = true; G.drones.forEach((d) => (d.retreat = true)); G.enemyBolts = []; G.tele = []; D.hero.classList.remove('bossing');
    const run = G.run; setTimeout(() => { if (G.run === run && G.on && G.over) showCard('over'); }, 900);
  } else live(`Hit. ${G.lives} ${G.lives === 1 ? 'life' : 'lives'} left.`);
}

const segBox = (x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, hw: number, hh: number) => { for (let i = 0; i <= 4; i++) { const k = i / 4, x = lerp(x1, x2, k), y = lerp(y1, y2, k); if (Math.abs(x - cx) < hw && Math.abs(y - cy) < hh) return true; } return false; };

export function drawArcs() {
  if (!G.arcs.length) return;
  ctx.globalCompositeOperation = 'lighter';
  for (const a of G.arcs) {
    a.life += F.rdt; const f = a.life / 0.18; if (f >= 1) { a.done = true; continue; }
    ctx.strokeStyle = `rgba(170,235,255,${0.9 * (1 - f)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x1, a.y1);
    for (let i = 1; i < 6; i++) { const k = i / 6; ctx.lineTo(lerp(a.x1, a.x2, k) + rnd(-10, 10), lerp(a.y1, a.y2, k) + rnd(-10, 10)); }
    ctx.lineTo(a.x2, a.y2); ctx.stroke();
  }
  G.arcs = G.arcs.filter((a) => !a.done); ctx.globalCompositeOperation = 'source-over';
}

export function drawTele() {
  for (const m of G.tele) {
    m.life += F.dt; const warn = m.life < m.warn, k = clamp(m.life / m.warn), fade = warn ? 1 : 0.45;
    if (m.safe) {
      const h = 70, x0 = m.x - m.w / 2;
      ctx.fillStyle = `rgba(143,211,255,${0.18 * k * fade})`; ctx.fillRect(x0, m.y - h, m.w, h * 2);
      ctx.strokeStyle = `rgba(143,211,255,${0.95 * k * fade})`; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(x0, m.y - h); ctx.lineTo(x0, m.y + h); ctx.moveTo(x0 + m.w, m.y - h); ctx.lineTo(x0 + m.w, m.y + h); ctx.stroke(); ctx.setLineDash([]);
      continue;
    }
    const pulse = warn && !reduce ? 0.7 + 0.3 * Math.sin(m.life * 30) : 1, a = (0.35 + 0.65 * k) * pulse * fade;
    ctx.strokeStyle = `rgba(255,120,79,${0.28 * fade})`; ctx.lineWidth = 1; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.moveTo(m.fx, m.fy); ctx.lineTo(m.x, m.y); ctx.stroke(); ctx.setLineDash([]);
    const r = 14 + 10 * (1 - k); ctx.strokeStyle = `rgba(255,120,79,${a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, 6.28); ctx.moveTo(m.x - r - 6, m.y); ctx.lineTo(m.x - r + 4, m.y); ctx.moveTo(m.x + r - 4, m.y); ctx.lineTo(m.x + r + 6, m.y); ctx.stroke();
  }
  G.tele = G.tele.filter((m) => m.life < m.dur);
}

export function fireTick() {
  G.fireT -= F.dt; let n = 0;
  while (G.fireT <= 0 && n++ < 2) { fireVolley(); G.fireT += fireGap(); }
  if (G.fireT < -0.13) G.fireT = 0;
  G.wingT -= F.dt;
  if (G.wings.length && G.wingT <= 0) { G.wingT = 0.26; G.wings.forEach((w) => bolt(w.x, w.y - 6, acquire(w.x, V.W * 0.12))); }
}

function hits(b: Bolt, x: number, y: number, depth: number) {
  for (const d of G.drones) { if (d.dead || d.retreat || d.state === 'arrive' || !d.on) continue; if (Math.abs(depth - d.z) < 0.14 && Math.abs(x - d.sx) < d.hw && Math.abs(y - d.sy) < d.hh) { b.done = true; b.ox = x - d.sx; b.oy = y - d.sy; damage(d, b); break; } }
  return !!b.done;
}

export function drawBolts() {
  ctx.globalCompositeOperation = 'lighter';
  for (const b of G.bolts) {
    b.t += F.dt / b.dur;
    const liveT = b.tgt && !b.tgt.dead && !b.tgt.gone && !b.tgt.retreat ? b.tgt : null;
    let ax = b.ax, ay = b.ay;
    if (liveT) { const h = Math.min(b.t, 1) * (0.5 + 0.1 * lv('lock')); ax = lerp(b.ax, liveT.sx + b.ox, h); ay = lerp(b.ay, liveT.sy + b.oy, h); b.ax2 = ax; b.ay2 = ay; }
    else if (b.ax2 !== undefined && b.ay2 !== undefined) { ax = b.ax2; ay = b.ay2; }
    if (b.t >= 1) {
      b.done = true;
      if (liveT && Math.abs(ax - liveT.sx) < liveT.hw * 1.05 && Math.abs(ay - liveT.sy) < liveT.hh * 1.1) damage(liveT, b);
      else sprite(SPR.hit, ax, ay, 6, 0.4);
      continue;
    }
    const e = b.tgt ? b.t : 1 - Math.pow(1 - b.t, 2.4);
    const x = lerp(b.x0, ax, e), y = lerp(b.y0, ay, e), e0 = b.tgt ? Math.max(b.t - 0.12, 0) : 1 - Math.pow(1 - Math.max(b.t - 0.08, 0), 2.4), x0 = lerp(b.x0, ax, e0), y0 = lerp(b.y0, ay, e0);
    if (!b.tgt && hits(b, x, y, 1 - e)) continue;
    const wdt = lerp(4.5, 0.8, e) * (b.dmg < 0.4 * dmgMul() ? 0.7 : 1);
    ctx.strokeStyle = 'rgba(120,215,255,0.45)'; ctx.lineWidth = wdt * 2.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,252,255,0.95)'; ctx.lineWidth = wdt * 0.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
  }
  G.bolts = G.bolts.filter((b) => !b.done);
  ctx.globalCompositeOperation = 'source-over';
}

export function drawEnemyBolts() {
  const hw = F.sw * 0.16, hh = F.sh * 0.32;
  for (const b of G.enemyBolts) {
    b.t += F.dt / b.dur;
    const e = b.t <= 1 ? Math.pow(b.t, 1.8) : 1 + (b.t - 1) * 1.8, x = lerp(b.x0, b.tx, e), y = lerp(b.y0, b.ty, e);
    if (G.on && !G.over && ship.hit <= 0 && b.t > 0.7 && segBox(b.px, b.py, x, y, ship.x, ship.y, hw + 6, hh + 6)) { b.done = true; hurt(); continue; }
    b.px = x; b.py = y;
    if (b.t >= 1.35 || y > V.H + 40 || x < -40 || x > V.W + 40) { b.done = true; continue; }
    sprite(SPR.bolt, x, y, Math.max(lerp(4, 12, Math.min(e, 1)), 4) * 2.4, Math.min(1, (1.35 - b.t) * 6));
  }
  G.enemyBolts = G.enemyBolts.filter((b) => !b.done);
}

export function drawParts() {
  ctx.globalCompositeOperation = 'lighter';
  for (const p of G.parts) {
    const k = G.card ? 0 : F.rdt * (G.slow > 0 ? 0.3 : 1);
    p.life += k; if (p.life >= p.max) { p.done = true; continue; }
    const f = p.life / p.max;
    if (p.ring) { ctx.strokeStyle = `rgba(255,214,150,${0.7 * (1 - f)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.3 + f), 0, 6.28); ctx.stroke(); sprite(SPR.blast, p.x, p.y, p.r, 0.9 * (1 - f)); continue; }
    p.x += p.vx * k; p.y += p.vy * k; p.vx *= 1 - k * 2.2; p.vy *= 1 - k * 2.2;
    if (p.debris) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(40,36,34,${1 - f})`; ctx.fillRect(p.x, p.y, p.r * 1.6, p.r); ctx.globalCompositeOperation = 'lighter'; }
    else { ctx.fillStyle = `rgba(${p.c},${1 - f})`; const r2 = p.r * (1 - f * 0.6); ctx.fillRect(p.x - r2, p.y - r2, r2 * 2, r2 * 2); }
  }
  G.parts = G.parts.filter((p) => !p.done);
}
