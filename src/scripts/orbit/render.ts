import { reduce } from '../state';
import { A, clamp, ctx, egg, F, G, HOLD, input, rnd, ship, sprite, SPR, V } from './core';
import { odLen, odOn } from './upgrades';
import { played, store } from './store';

export function drawShip() {
  if (!A.ship) return;
  const { rdt, t } = F, sw = F.sw, shh = F.sh, shipY = ship.y + ship.kick * 2.5;
  if ((G.on && !G.card) || Math.hypot(ship.vx, ship.vy) > 40) {
    G.trailAcc += rdt * (G.on ? 60 : 30);
    while (G.trailAcc >= 1) { G.trailAcc -= 1; const n = ship.noz[(G.trail.length + F.fc) & 1]; G.trail.push({ x: ship.x + (n[0] - 0.5) * sw * (1 - Math.abs(ship.bank) * 0.18) + rnd(-2, 2), y: shipY + (n[1] - 0.5) * shh, life: 0, max: G.on ? rnd(0.25, 0.4) : 0.2, r: sw * 0.026, j: rnd(0.7, 1) }); }
  }
  for (const p of G.trail) { p.life += rdt; p.y += rdt * V.H * 0.5; if (p.life >= p.max) { p.done = true; continue; } const f = p.life / p.max; sprite(SPR.trail, p.x, p.y, p.r * (1.6 + f * 1.4), 0.75 * (1 - f) * p.j); }
  G.trail = G.trail.filter((p) => !p.done); if (G.trail.length > 120) G.trail.splice(0, G.trail.length - 120);

  ctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.translate(ship.x, shipY); ctx.rotate(ship.bank * 0.55); ctx.scale(1 - Math.abs(ship.bank) * 0.18, 1);
  ctx.drawImage(A.ship, -sw / 2, -shh / 2, sw, shh);
  ctx.globalCompositeOperation = 'lighter';
  const thr = (G.on ? 1 : 0.55 + egg.hover * 0.35) + (reduce ? 0 : 0.08 * Math.sin(t * 23)) + clamp(Math.hypot(ship.vx, ship.vy) / V.W) * 0.6;
  for (const n of ship.noz) {
    const nx = (n[0] - 0.5) * sw, ny = (n[1] - 0.5) * shh;
    sprite(SPR.cyan, nx, ny, sw * 0.13 * thr, 0.95);
    const pl = sw * (0.1 + 0.16 * thr), wd = sw * 0.032, fl = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 37 + nx);
    const g = ctx.createLinearGradient(nx, ny, nx, ny + pl * fl); g.addColorStop(0, `rgba(170,232,255,${0.6 * thr})`); g.addColorStop(0.5, `rgba(110,200,255,${0.25 * thr})`); g.addColorStop(1, 'rgba(80,170,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(nx - wd, ny); ctx.quadraticCurveTo(nx - wd * 0.7, ny + pl * 0.45 * fl, nx, ny + pl * fl); ctx.quadraticCurveTo(nx + wd * 0.7, ny + pl * 0.45 * fl, nx + wd, ny); ctx.closePath(); ctx.fill();
  }
  if (ship.muzzle > 0) for (const sgn of [-1, 1]) sprite(SPR.hit, sgn * sw * 0.21, -shh * 0.32, sw * 0.07 * ship.muzzle, 0.9 * ship.muzzle);
  if (G.on && G.shield > 0 && ship.hit <= 0) { ctx.strokeStyle = 'rgba(143,211,255,0.32)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(0, 0, sw * 0.6, shh * 0.92, 0, 0, 6.28); ctx.stroke(); ctx.setLineDash([]); }
  if (G.on && odLen()) { const c = (G.clock % 8) / 8, on = odOn(); ctx.strokeStyle = on ? 'rgba(160,235,255,0.9)' : 'rgba(255,207,138,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, shh * 0.62, sw * 0.08, -Math.PI / 2, -Math.PI / 2 + (on ? 6.28 : c / ((8 - odLen()) / 8) * 6.28)); ctx.stroke(); if (on) sprite(SPR.cyan, 0, -shh * 0.1, sw * 0.5, 0.25); }
  if (ship.hit > 0) { const k = Math.min(1, ship.hit / 0.3); ctx.strokeStyle = `rgba(143,211,255,${0.65 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, sw * 0.62, shh * 0.95, 0, 0, 6.28); ctx.stroke(); sprite(SPR.trail, 0, 0, sw * 0.7, 0.25 * k); }
  ctx.restore();
}

export function drawWings() {
  if (!G.on || !G.wings.length || !A.ship) return;
  const img = A.ship, ws = F.sw * 0.34, wh = ws * img.height / img.width;
  G.wings.forEach((w, i) => {
    const side = i === 0 ? -1 : 1, tx = clamp(ship.x + side * F.sw * 0.78, ws * 0.6, V.W - ws * 0.6), ty = ship.y + F.sh * 0.35, f = 1 - Math.exp(-F.rdt / 0.12);
    w.x += (tx - w.x) * f; w.y += (ty - w.y) * f;
    ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(ship.bank * 0.5); ctx.drawImage(img, -ws / 2, -wh / 2, ws, wh);
    ctx.globalCompositeOperation = 'lighter'; for (const n of ship.noz) sprite(SPR.cyan, (n[0] - 0.5) * ws, (n[1] - 0.5) * wh, ws * 0.16, 0.85); ctx.restore();
  });
}

export function drawPops() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = `600 ${V.tall ? 12 : 14}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
  G.pops.forEach((p, i) => { p.life += F.rdt; if (p.life > 0.9) { p.done = true; return; } const f = p.life / 0.9, yy = p.y - 20 - f * 40 - i * 14; ctx.fillStyle = `rgba(0,0,0,${0.6 * (1 - f * f)})`; ctx.fillText(p.txt, p.x + 1, yy + 1); ctx.fillStyle = `rgba(255,214,150,${1 - f * f})`; ctx.fillText(p.txt, p.x, yy); });
  G.pops = G.pops.filter((p) => !p.done);
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,120,80,${G.flash * 0.22})`; ctx.fillRect(0, 0, V.W, V.H); }
  if (F.sy > 0) { ctx.fillStyle = `rgba(4,6,13,${clamp(F.sy * 0.7, 0, 0.75)})`; ctx.fillRect(0, 0, V.W, V.H); }
}

export function drawEgg() {
  const { rdt, sy } = F;
  egg.hover += ((egg.over && !G.on && sy < 0.05 ? 1 : 0) - egg.hover) * (1 - Math.exp(-rdt / 0.12));
  if (!G.on && A.ready && !played() && egg.shown < 2 && egg.whisper < 0 && scrollY < 10 && !input.charge) { egg.idleT += rdt; if (egg.idleT > 8) { egg.whisper = 0; egg.shown++; store.set('lg01-whisper', egg.shown); } } else if (scrollY >= 10) egg.idleT = 0;
  if (egg.whisper >= 0 && !G.on) { egg.whisper += rdt; if (egg.whisper > 4.2) { egg.whisper = -1; egg.idleT = -1e9; } }
  const wA = egg.whisper >= 0 ? clamp(egg.whisper / 0.6) * clamp((4.2 - egg.whisper) / 0.6) : 0, hA = egg.hover;
  if (!G.on && (wA > 0.01 || hA > 0.01) && sy < 0.05) {
    const sw = F.sw, sh = F.sh, bx = sw * 0.62, by = sh * 0.78, c = 14, a = Math.max(hA, wA * 0.6);
    ctx.strokeStyle = `rgba(255,207,138,${0.95 * a})`; ctx.lineWidth = 2; ctx.beginPath();
    for (const [ux, uy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const X = ship.x + ux * bx, Y = ship.y + uy * by; ctx.moveTo(X, Y - uy * c); ctx.lineTo(X, Y); ctx.lineTo(X - ux * c, Y); }
    ctx.stroke();
    ctx.font = `600 ${V.tall ? 11 : 12}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const txt = (hA > wA ? 'LG-01 · Hold to fly' : input.last === 'touch' ? 'Hold the ship to fly' : 'Hold the ship or Space to fly').toUpperCase().split('').join(String.fromCharCode(8202));
    const ta = Math.max(hA, wA), tw = ctx.measureText(txt).width + 24, ty = ship.y + by + 26;
    ctx.fillStyle = `rgba(4,6,13,${0.72 * ta})`; ctx.beginPath(); ctx.roundRect(ship.x - tw / 2, ty - 14, tw, 28, 14); ctx.fill();
    ctx.strokeStyle = `rgba(255,207,138,${0.4 * ta})`; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = `rgba(255,214,150,${ta})`; ctx.fillText(txt, ship.x, ty + 1); ctx.textBaseline = 'alphabetic';
  }
}

export function drawCharge() {
  const c = input.charge;
  if (!c || G.on) return;
  const k2 = clamp((F.now - c.t0) / HOLD[c.kind]), cx = ship.x, cy = ship.y, r = F.sw * 0.55;
  ctx.strokeStyle = 'rgba(255,207,138,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,150,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + k2 * 6.28); ctx.stroke();
}
