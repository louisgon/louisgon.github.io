import { reduce } from '../state';
import { $ } from '../util';
import { addShake, cam, CAP, clamp, D, egg, fmtT, G, HIT, input, lerp, reseed, restW, rs, sayT, ship, shipW, STICK, T, T_HV, TURN, TYPES, V, VP, wrapA, type Kind } from './core';
import { AR, BM, BO, DB, EB, EN, fx, MI, NR, QR, query, RB, resetWorld, SH, SP, sparks, TG, TQ, WS } from './world';
import { flushSprites } from './sprites';
import { deathBurst } from './enemies';
import { mkW, needFor } from './weapons';
import { anchor, buzz, live, resetHud, setLast, showBest } from './hud';
import { modal, renderBuild, renderHull, setHull, showCard } from './cards';
import { cancelInput } from './input';
import { P, store } from './store';

let lateT = 0, tipT = 0, toastT = 0;

export function start(kind?: Kind) {
  flushSprites();
  G.run++; reseed(0x0b17 ^ Math.imul(G.run, 0x9e3779b1)); store.set('lg01-played', 1); egg.whisper = -1; egg.over = false; D.hero.style.cursor = '';
  resetWorld();
  Object.assign(G, { on: true, over: false, dead: false, card: false, mode: '', clock: 0, kills: 0, level: 1, xp: 0, need: needFor(1), pend: 0, lvlT: 0, hull: 3, inv: 0, blinkT: 0, vig: 0, shake: 0, stop: 0, slow: 0, W: [], wm: {}, B: [], bm: {}, miss: {}, opts: [], spawnAcc: 2.5, dartT: 26, nextBoss: CAP.first, bossN: 0, calmT: -1e9, boss: null, cache: null, warned: false, regen: 0, killsF: 0, reveal: 0, hitT: 0, arcId: 0, tips: {}, newBest: false, fac: 0, lap: 0, switching: false });
  if (import.meta.env.MODE === 'test') Object.assign(T, { botT: 0, botA: 0, botFlip: 15, botDir: 1, bdx: 0, bdy: 0, hits: [], notes: [] });
  const w = mkW('pulse'); G.W.push(w); G.wm.pulse = w;
  renderHull(); renderBuild(); resetHud();
  D.hero.classList.add('playing'); D.hero.classList.remove('bossing', 'carded', 'late'); D.toast.classList.remove('on'); D.card.classList.remove('on'); modal(false);
  const back = document.activeElement; if (back instanceof HTMLElement && back !== document.body && !D.hud.contains(back)) input.focusBack = back;
  D.copy.inert = D.fly.inert = true;
  if (kind) setLast(kind);
  if (VP.p < 1) {
    if (!VP.p) addShake(0.2);
    VP.dir = 1; VP.rx = rs.x; VP.ry = rs.y; VP.rw = restW(); VP.rv = 0;
    ship.x = ship.y = cam.x = cam.y = 0; ship.vx = ship.vy = ship.cx = ship.cy = 0; ship.h = ship.hv = ship.bank = 0;
  } else boosted();
  input.gx = ship.x; input.gy = ship.y; input.follow = false; input.mlock = true; input.guide = -1;
  buzz(8);
}

export function boosted() {
  D.hero.classList.add('flying'); D.hud.inert = false; anchor();
  if (input.last === 'key') D.hud.focus({ preventScroll: true });
  clearTimeout(lateT); lateT = window.setTimeout(() => D.hero.classList.add('late'), 9000);
  if (input.last === 'touch') { D.hero.classList.add('tip'); clearTimeout(tipT); tipT = window.setTimeout(() => D.hero.classList.remove('tip'), 3200); }
  live('Flight started. Steer to survive, weapons fire on their own.');
}

export function restart() { const sx = ship.x, sy = ship.y; G.on = false; start(input.last); ship.x = sx; ship.y = sy; }

export function land() {
  if (!G.on) return;
  const t = G.clock, wasOver = G.over, flown = VP.p >= 1;
  G.on = false; G.card = false; D.hero.classList.remove('flying', 'bossing', 'carded', 'tip', 'late'); D.card.classList.remove('on'); modal(false);
  D.hud.inert = true;
  for (let i = 0; i < WS.nE; i++) { if (EN[i].mode === -1) EN[i].dead = 1; else EN[i].mode = 9; }
  BO.n = MI.n = EB.n = SH.n = 0; for (const s of TG) s.on = false; for (const s of NR) s.on = false; TQ.length = 0; G.cache = null;
  if (flown && !wasOver && t > P.best) { P.best = t; store.set('lg01-top-best', P.best.toFixed(2)); G.newBest = true; }
  showBest();
  if (t > 1) {
    $('toastB').innerHTML = `${wasOver ? 'Lasted' : 'Survived'} ${fmtT(t)}`; $('toastS').innerHTML = G.newBest ? 'New best' : `Best ${fmtT(P.best)}`;
    D.toast.classList.add('on'); clearTimeout(toastT); toastT = window.setTimeout(() => D.toast.classList.remove('on'), 2600);
  }
  $('bestLine').hidden = false;
  if (G.dead) { G.dead = false; VP.rv = 1; ship.h = ship.hv = 0; }
  if (flown) { VP.rx = V.W * rs.restX; VP.ry = V.H * rs.restY; VP.rw = rs.base; }
  VP.dir = -1; cancelInput();
}

export function landed() {
  VP.p = 0; VP.dir = 0; VP.rv = 0;
  WS.nE = 0; SP.n = DB.n = BO.n = MI.n = EB.n = SH.n = 0; WS.nFX = 0; for (const R of RB) R.n = 0;
  for (const s of BM) s.on = false; for (const s of AR) s.on = false;
  D.hero.classList.remove('playing'); D.copy.inert = D.fly.inert = false;
  const back = input.focusBack; input.focusBack = null;
  if (back && back.isConnected && (document.activeElement === document.body || !document.activeElement)) back.focus({ preventScroll: true });
  rs.x = VP.rx; rs.y = VP.ry; rs.vx = rs.vy = 0; rs.sc = 1; rs.bank = 0;
}

export function hurt(src = '', hx = ship.x, hy = ship.y) {
  if (G.inv > 0 || G.over) return;
  if (import.meta.env.MODE === 'test') { T.hits.push(`${G.clock.toFixed(1)}s ${src}`); if (T.god) { G.inv = 0.6; return; } }
  const U = V.U;
  G.hull--; G.inv = 1.4; G.blinkT = 1.4; G.vig = 1; G.regen = 0;
  if (Math.hypot(hx - ship.x, hy - ship.y) > 1) { G.hitA = Math.atan2(hy - ship.y, hx - ship.x); G.hitT = HIT; G.vig = 0.6; }
  addShake(0.55); buzz(30); setHull(true);
  sparks(ship.x, ship.y, 22, 420 * U, 2, 9); fx(1, ship.x, ship.y, shipW() * 0.9, 0.35, 2); fx(0, ship.x, ship.y, shipW() * 0.6, 0.2, 2);
  const n = query(ship.x, ship.y, 150 * U, QR);
  for (let j = 0; j < n; j++) { const e = EN[QR[j]], dx = e.x - ship.x, dy = e.y - ship.y, d = Math.hypot(dx, dy) || 1, m = TYPES[e.t].mass; e.kx += dx / d * 520 * U / m; e.ky += dy / d * 520 * U / m; }
  if (G.hull <= 0) die();
  else live(`Hit. ${G.hull} hull left.`);
}

function die() {
  const U = V.U;
  G.over = true; G.dead = true; G.inv = 99; if (!reduce) G.slow = 0.7; G.stop = reduce ? 0 : 0.08; addShake(1);
  deathBurst(ship.x, ship.y, shipW() * 1.1, T_HV, 1, 0); sparks(ship.x, ship.y, 30, 520 * U, 2, 11); fx(2, ship.x, ship.y, 340 * U, 0.8, 0);
  ship.vx = ship.vy = ship.cx = ship.cy = 0; ship.hv = 0;
  D.hero.classList.remove('bossing');
  const nb = G.clock > P.best; if (nb) { P.best = G.clock; store.set('lg01-top-best', P.best.toFixed(2)); }
  G.newBest = nb; showBest();
  live(`Hull lost at ${sayT(G.clock)}. ${G.kills} kills, level ${G.level}.`);
  const run = G.run; setTimeout(() => { if (G.run !== run || !G.on || !G.over) return; showCard('over'); }, 1150);
}

export const pause = () => { if (G.on && (VP.p >= 1 || VP.dir > 0) && !G.card && !G.over) { cancelInput(); showCard('pause'); } };

export function steerHead(k: number) {
  if (k <= 0) return;
  const U = V.U, landing = VP.dir < 0, sp = Math.hypot(ship.vx, ship.vy), thumb = !!input.stick && VP.p >= 1;
  let tgt = ship.h;
  if (landing) tgt = 0;
  else if (thumb) { if (Math.hypot(ship.cx, ship.cy) > 90 * U) tgt = Math.atan2(ship.cx, -ship.cy); }
  else if (sp > 60 * U && VP.p >= 1 && Math.hypot(ship.cx, ship.cy) > 90 * U && ship.vx * ship.cx + ship.vy * ship.cy > 0) tgt = Math.atan2(ship.vx, -ship.vy);
  const MX = landing ? TURN * 1.7 : thumb ? TURN * STICK.turn : TURN, AC = MX / (thumb ? STICK.spin : 0.09), df = wrapA(tgt - ship.h);
  const want = Math.sign(df) * Math.min(MX, Math.sqrt(2 * AC * Math.abs(df)), Math.abs(df) / k);
  ship.hv += clamp(want - ship.hv, -AC * k, AC * k);
  ship.h = wrapA(ship.h + ship.hv * k);
  ship.bank = lerp(ship.bank, clamp(ship.hv / TURN, -1, 1), 1 - Math.exp(-k * 12));
}

export function updCam(k: number, mx: number, my: number, rk: number) {
  if (G.card && VP.p >= 1) { const f = 1 - Math.exp(-rk * 5); cam.x += (ship.x - cam.x) * f; cam.y += (ship.y + (reduce ? 0 : G.camY) - cam.y) * f; return; }
  if (VP.dir < 0) { const f = 1 - Math.exp(-k * 7); cam.x += (ship.x - cam.x) * f; cam.y += (ship.y - cam.y) * f; return; }
  if (VP.p < 1) { cam.x = ship.x; cam.y = ship.y; return; }
  if (k <= 0) return;
  const f = 1 - Math.exp(-k * 14);
  cam.x += mx + (ship.x - cam.x) * f; cam.y += my + (ship.y - cam.y) * f;
}
