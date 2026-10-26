import { reduce } from '../state';
import { A, clamp, ctx, egg, F, G, heroReady, HOLD, input, restH, restW, rnd, rs, scene, screen, sprite, V, VP } from './core';
import { LIT, SPR } from './art';
import { played, store } from './store';

type Trail = { x: number; y: number; life: number; max: number; r: number; j: number; done?: boolean };
let trail: Trail[] = [];

export function drawRear(x: number, y: number, sw: number, sqy: number, al: number, vx: number, vy: number, boost: number, punch = 0) {
  if (!A.ship) return;
  const { rdt, t } = F, shh = sw * A.aspR;
  screen();
  ctx.globalCompositeOperation = 'lighter';
  if (boost || Math.hypot(vx, vy) > 40) {
    G.trailAcc += rdt * (boost ? 60 : 30);
    while (G.trailAcc >= 1) { G.trailAcc -= 1; const n = rs.noz[(trail.length + F.fc) & 1]; trail.push({ x: x + (n[0] - 0.5) * sw * (1 - Math.abs(rs.bank) * 0.18) + rnd(-2, 2), y: y + (n[1] - 0.5) * shh * sqy, life: 0, max: boost ? rnd(0.22, 0.34) : 0.2, r: sw * 0.026, j: rnd(0.7, 1) }); }
  }
  for (const p of trail) { p.life += rdt; p.y += rdt * V.H * 0.5; if (p.life >= p.max) { p.done = true; continue; } const f = p.life / p.max; sprite(SPR.trail, p.x, p.y, p.r * (1.6 + f * 1.4), 0.75 * (1 - f) * p.j * al); }
  trail = trail.filter((p) => !p.done); if (trail.length > 120) trail.splice(0, trail.length - 120);
  if (al <= 0.004) return;

  const thr = (boost ? 1 : 0.55 + egg.hover * 0.35) + clamp(Math.hypot(vx, vy) / V.W) * 0.6 + punch * 0.9, lit = scene.lit * al;
  if (lit > 0.01) { ctx.save(); ctx.translate(x, y + shh * 0.46); ctx.scale(1, 0.36); sprite(SPR.trail, 0, 0, sw * 0.62, 0.2 * lit * Math.min(thr, 1.2) * (1 + 0.08 * flick(t, 0))); ctx.restore(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rs.bank * 0.55); ctx.scale(1 - Math.abs(rs.bank) * 0.18, sqy);
  if (al < 1) ctx.globalAlpha = al;
  ctx.drawImage(A.ship, -sw / 2, -shh / 2, sw, shh);
  if (lit > 0.01 && LIT.shade && LIT.light) {
    ctx.globalAlpha = lit; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(LIT.shade, -sw / 2, -shh / 2, sw, shh);
    ctx.globalAlpha = lit * Math.min(1, scene.glow); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(LIT.light, -sw / 2, -shh / 2, sw, shh);
  }
  ctx.globalCompositeOperation = 'lighter';
  if (LIT.spill) { ctx.globalAlpha = al * clamp(thr) * (0.62 + 0.06 * flick(t, 0) + 0.06 * flick(t, 1)); ctx.drawImage(LIT.spill, -sw / 2, -shh / 2, sw, shh); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < rs.noz.length; i++) {
    const n = rs.noz[i], nx = (n[0] - 0.5) * sw, ny = (n[1] - 0.5) * shh, f = flick(t, i), th = thr * (1 + 0.05 * f), wv = reduce ? 0 : Math.sin(t * 4.3 + i * 1.9) * 0.6 + Math.sin(t * 7.1 + i * 0.7) * 0.4;
    if (punch > 0.01) sprite(SPR.trail, nx, ny + sw * 0.04, sw * 0.3 * punch, 0.5 * punch * al);
    sprite(SPR.cyan, nx, ny, sw * 0.13 * th, 0.95 * al);
    const pl = sw * (0.1 + 0.16 * th), wd = sw * 0.032;
    plume(nx, ny, wd * 2.2, pl * 1.3, wv * wd * 1.5, th * al, 0.13, 0.05);
    plume(nx, ny, wd, pl * (1 + 0.03 * f), wv * wd * 0.5, th * al, 0.6, 0.25);
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

const flick = (t: number, i: number) => (reduce ? 0 : Math.sin(t * 11.3 + i * 2.1) * 0.5 + Math.sin(t * 17.9 + i * 4.3) * 0.3 + Math.sin(t * 29.7 + i) * 0.2);
function plume(nx: number, ny: number, wd: number, pl: number, sway: number, a: number, a0: number, a1: number) {
  const g = ctx.createLinearGradient(nx, ny, nx + sway, ny + pl); g.addColorStop(0, `rgba(170,232,255,${a0 * a})`); g.addColorStop(0.5, `rgba(110,200,255,${a1 * a})`); g.addColorStop(1, 'rgba(80,170,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(nx - wd, ny); ctx.quadraticCurveTo(nx - wd * 0.7 + sway * 0.4, ny + pl * 0.45, nx + sway, ny + pl); ctx.quadraticCurveTo(nx + wd * 0.7 + sway * 0.4, ny + pl * 0.45, nx + wd, ny); ctx.closePath(); ctx.fill();
}

export function drawDim() {
  ctx.globalCompositeOperation = 'source-over';
  if (F.sy > 0) { ctx.fillStyle = `rgba(4,6,13,${clamp(F.sy * 0.7, 0, 0.75)})`; ctx.fillRect(0, 0, V.W, V.H); }
}

export function drawEgg() {
  const { rdt, sy } = F;
  egg.hover += (((egg.over || egg.focus) && !G.on && !VP.p && sy < 0.05 ? 1 : 0) - egg.hover) * (1 - Math.exp(-rdt / 0.12));
  if (!G.on && !VP.p && heroReady() && !played() && egg.shown < 2 && egg.whisper < 0 && scrollY < 10 && !input.charge) { egg.idleT += rdt; if (egg.idleT > 8) { egg.whisper = 0; egg.shown++; store.set('lg01-whisper', egg.shown); } } else if (scrollY >= 10) egg.idleT = 0;
  if (egg.whisper >= 0 && !G.on) { egg.whisper += rdt; if (egg.whisper > 4.2) { egg.whisper = -1; egg.idleT = -1e9; } }
  const wA = egg.whisper >= 0 ? clamp(egg.whisper / 0.6) * clamp((4.2 - egg.whisper) / 0.6) : 0, hA = egg.hover;
  if (!G.on && !VP.p && (wA > 0.01 || hA > 0.01) && sy < 0.05) {
    const sw = restW(), sh = restH(), bx = sw * 0.62, by = sh * 0.78, c = 14, a = Math.max(hA, wA * 0.6);
    ctx.strokeStyle = `rgba(255,207,138,${0.95 * a})`; ctx.lineWidth = 2; ctx.beginPath();
    for (const [ux, uy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const X = rs.x + ux * bx, Y = rs.y + uy * by; ctx.moveTo(X, Y - uy * c); ctx.lineTo(X, Y); ctx.lineTo(X - ux * c, Y); }
    ctx.stroke();
    ctx.font = `600 ${V.tall ? 11 : 12}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const txt = (hA > wA ? (egg.focus ? 'LG-01 · Press Enter to fly' : 'LG-01 · Hold to fly') : input.last === 'touch' ? 'Hold the ship to fly' : 'Hold the ship or Space to fly').toUpperCase().split('').join(String.fromCharCode(8202));
    const ta = Math.max(hA, wA), tw = ctx.measureText(txt).width + 24, ty = rs.y + by + 26;
    ctx.fillStyle = `rgba(4,6,13,${0.72 * ta})`; ctx.beginPath(); ctx.roundRect(rs.x - tw / 2, ty - 14, tw, 28, 14); ctx.fill();
    ctx.strokeStyle = `rgba(255,207,138,${0.4 * ta})`; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = `rgba(255,214,150,${ta})`; ctx.fillText(txt, rs.x, ty + 1); ctx.textBaseline = 'alphabetic';
  }
}

export function drawCharge() {
  const c = input.charge;
  if (!c || G.on || VP.p) return;
  const k2 = clamp((F.now - c.t0) / HOLD[c.kind]), cx = rs.x, cy = rs.y, r = restW() * 0.55;
  ctx.strokeStyle = 'rgba(255,207,138,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,150,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + k2 * 6.28); ctx.stroke();
}
