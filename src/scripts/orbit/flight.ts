import { reduce } from '../state';
import { $ } from '../util';
import { A, addShake, cam, clamp, D, DV, egg, eio, eout, fmtT, G, GZ0, input, lerp, restW, rs, sayT, ship, shipW, sm, STICK, T_HV, TURN, TYPES, V, VP, wrapA, type Kind } from './core';
import { AR, BM, BO, DB, EB, EN, fx, MI, NR, QR, query, RB, resetWorld, SH, SP, sparks, TG, TQ, WS } from './world';
import { deathBurst } from './enemies';
import { mkW, needFor } from './weapons';
import { buzz, live, renderBuild, renderHull, resetHud, setHull, setLast, showBest, showCard } from './hud';
import { P, store } from './store';
import { T } from './test';

let lateT = 0, tipT = 0, toastT = 0;
export const cancelInput = () => { input.charge = null; input.keys.clear(); input.tid = null; input.stick = null; };

export function start(kind?: Kind) {
  G.run++; store.set('lg01-played', 1); egg.whisper = -1; egg.over = false; D.hero.style.cursor = '';
  resetWorld();
  Object.assign(G, { on: true, over: false, dead: false, card: false, mode: '', clock: 0, kills: 0, level: 1, xp: 0, need: needFor(1), pend: 0, lvlT: 0, hull: 3, inv: 0, blinkT: 0, vig: 0, shake: 0, stop: 0, slow: 0, W: [], wm: {}, B: [], bm: {}, miss: {}, opts: [], spawnAcc: 2.5, dartT: 26, nextBoss: 100, bossN: 0, boss: null, cache: null, warned: false, regen: 0, killsF: 0, msgT: -1e9, novaId: 0, arcId: 0, tips: {}, newBest: false, fac: 0, lap: 0, switching: false });
  if (import.meta.env.MODE === 'test') Object.assign(T, { botT: 0, botA: 0, botFlip: 15, botDir: 1, bdx: 0, bdy: 0, hits: [] });
  const w = mkW('pulse'); G.W.push(w); G.wm.pulse = w;
  renderHull(); renderBuild(); resetHud();
  D.hero.classList.add('playing'); D.hero.classList.remove('bossing', 'carded', 'late'); D.toast.classList.remove('on'); D.card.classList.remove('on');
  D.copy.inert = true;
  if (kind) setLast(kind);
  if (kind === 'key') input.focusBack = document.activeElement as HTMLElement | null;
  if (VP.p < 1) {
    if (!VP.p) addShake(0.2);
    VP.dir = 1; VP.rx = rs.x; VP.ry = rs.y; VP.rw = restW(); VP.rv = 0;
    ship.x = ship.y = cam.x = cam.y = 0; ship.vx = ship.vy = ship.cx = ship.cy = 0; ship.h = ship.hv = ship.bank = 0;
  } else boosted();
  input.gx = ship.x; input.gy = ship.y; input.follow = kind === 'mouse'; input.mlock = false;
  buzz(8);
}

export function boosted() {
  D.hero.classList.add('flying'); D.hud.inert = false;
  if (input.last === 'key') D.hud.focus({ preventScroll: true });
  clearTimeout(lateT); lateT = window.setTimeout(() => D.hero.classList.add('late'), 9000);
  if (input.last === 'touch') { D.hero.classList.add('tip'); clearTimeout(tipT); tipT = window.setTimeout(() => D.hero.classList.remove('tip'), 3200); }
  live('Flight started. Steer to survive, weapons fire on their own.');
}

export function restart() { const sx = ship.x, sy = ship.y; G.on = false; start(input.last); ship.x = sx; ship.y = sy; }

export function land() {
  if (!G.on) return;
  const t = G.clock, wasOver = G.over, flown = VP.p >= 1;
  G.on = false; G.card = false; D.hero.classList.remove('flying', 'bossing', 'carded', 'tip', 'late'); D.card.classList.remove('on');
  D.hud.inert = true;
  for (let i = 0; i < WS.nE; i++) { if (EN[i].mode === -1) EN[i].dead = 1; else EN[i].mode = 9; }
  BO.n = MI.n = EB.n = SH.n = 0; for (const s of TG) s.on = false; for (const s of NR) s.on = false; TQ.length = 0; G.cache = null;
  if (flown && !wasOver && t > P.best) { P.best = t; store.set('lg01-top-best', P.best.toFixed(2)); G.newBest = true; }
  showBest();
  if (t > 1) {
    $('toastB').innerHTML = `${wasOver ? 'Lasted' : 'Survived'} ${fmtT(t)}`; $('toastS').innerHTML = G.newBest ? 'New best' : `Best ${fmtT(P.best)}`;
    D.toast.classList.add('on'); clearTimeout(toastT); toastT = window.setTimeout(() => D.toast.classList.remove('on'), 2600);
  }
  if (input.focusBack && input.focusBack.focus) { try { input.focusBack.focus({ preventScroll: true }); } catch {} } input.focusBack = null;
  $('bestLine').hidden = false;
  if (G.dead) { G.dead = false; VP.rv = 1; ship.h = ship.hv = 0; }
  if (flown) { VP.rx = V.W * 0.5; VP.ry = V.H * rs.restY; VP.rw = rs.base; }
  VP.dir = -1; cancelInput();
}

export function landed() {
  VP.p = 0; VP.dir = 0; VP.rv = 0;
  WS.nE = 0; SP.n = DB.n = BO.n = MI.n = EB.n = SH.n = 0; WS.nFX = 0; for (const R of RB) R.n = 0;
  for (const s of BM) s.on = false; for (const s of AR) s.on = false;
  D.hero.classList.remove('playing'); D.copy.inert = false;
  rs.x = VP.rx; rs.y = VP.ry; rs.vx = rs.vy = 0; rs.sc = 1; rs.bank = 0;
}

export function hurt(src = '') {
  if (G.inv > 0 || G.over) return;
  if (import.meta.env.MODE === 'test') { T.hits.push(`${G.clock.toFixed(1)}s ${src}`); if (T.god) { G.inv = 0.6; return; } }
  const U = V.U;
  G.hull--; G.inv = 1.4; G.blinkT = 1.4; G.vig = 1; G.regen = 0;
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

export const pause = () => { if (G.on && VP.p >= 1 && !G.card && !G.over) { cancelInput(); showCard('pause'); } };

export function boost(p: number) {
  const { W, H, Z } = V, sx = W / 2 + (ship.x - cam.x) * Z, sy = H / 2 + (ship.y - cam.y) * Z;
  DV.tx = sx; DV.ty = sy; DV.tw = shipW() * Z; DV.tsq = 1; DV.th = 1; DV.drop = 0; DV.kx = DV.ky = 1; DV.fk = 0; DV.ba = 1; DV.punch = 0; DV.zb = 0; DV.gz = Z; DV.rsq = 1;
  if (!p) { DV.th = 0; DV.ga = 0; DV.ra = 1; DV.ta = 0; DV.rx = rs.x; DV.ry = rs.y; DV.rw = restW(); return; }
  if (reduce) { DV.ga = p; DV.ra = 1 - p; DV.ta = p; DV.rx = VP.rx; DV.ry = VP.ry; DV.rw = VP.rw; return; }
  const up = VP.dir >= 0, th = eio(clamp((p - 0.05) / 0.95)), dk = clamp((p - 0.04) / 0.58), e = eio(clamp((p - 0.03) / 0.9)), es = eio(p);
  DV.th = th; DV.drop = H * 1.3 * dk ** 1.7; DV.kx = 1 - 0.05 * dk; DV.ky = 1 - 0.18 * dk;
  DV.fk = clamp(DV.drop / (H * 0.15)); DV.ba = 1 - sm(0.42, 0.58, p); DV.zb = Math.sin(Math.PI * th);
  DV.punch = up ? sm(0, 0.05, p) * (1 - sm(0.28, 0.62, p)) : 0;
  DV.ga = 1; DV.gz = lerp(GZ0, 1, eio(sm(0.45, 1, p))) * Z;
  DV.rx = DV.tx = lerp(VP.rx, sx, e); DV.ry = DV.ty = lerp(VP.ry, sy, e) + (up ? H * 0.022 * Math.sin(Math.PI * clamp(p / 0.16)) : 0);
  DV.rw = DV.tw = lerp(VP.rw, shipW() * Z, es);
  DV.rsq = 1 - 0.5 * sm(0.12, 0.5, p); DV.ra = 1 - sm(0.42, 0.56, p); DV.ta = sm(0.42, 0.56, p);
  DV.tsq = lerp(A.tsq0, 1, eout(sm(0.44, 0.9, p)));
}

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
  const { W, vw, vh } = V;
  if (G.card && VP.p >= 1) { const f = 1 - Math.exp(-rk * 5); cam.x += (ship.x - cam.x) * f; cam.y += (ship.y + vh * (W < 861 ? 0.12 : -0.13) - cam.y) * f; return; }
  if (VP.dir < 0) { const f = 1 - Math.exp(-k * 7); cam.x += (ship.x - cam.x) * f; cam.y += (ship.y - cam.y) * f; return; }
  if (VP.p < 1) { cam.x = ship.x; cam.y = ship.y; return; }
  if (k <= 0) return;
  const locked = input.last === 'touch', L = locked ? 0 : input.follow && !(import.meta.env.MODE === 'test' && T.auto) && !input.keys.size ? 0.07 : 0.16, cap = Math.min(vw, vh) * 0.16;
  let lx = ship.vx * L, ly = ship.vy * L; const ll = Math.hypot(lx, ly); if (ll > cap) { lx *= cap / ll; ly *= cap / ll; }
  const f = 1 - Math.exp(-k * (locked ? 14 : 3.5));
  cam.x += mx + (ship.x + lx - cam.x) * f; cam.y += my + (ship.y + ly - cam.y) * f;
}
