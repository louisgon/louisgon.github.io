import { DATA } from '../data';
import { HI, reduce } from '../state';
import { $, out, sstep } from '../util';
import { A, base, BOOST, C, cam, clamp, coarse, ctx, D, DV, egg, F, FAC, G, HOLD, initCore, input, LAND, lerp, restW, rs, scene, screen, ship, shipR, STICK, TYPES, V, VP } from './core';
import { initArt, LIT, prepLight, prepSprites, S } from './art';
import { analyse, drawOrbit, drawSpace, drawStreaks, initBackdrop, nozzles, prepMoons } from './backdrop';
import { compact, EN, gridBuild, rescale, sizeWorld, TQ, WS } from './world';
import { separate, spawner, updEnemies } from './enemies';
import { spdM, updBolts, updBullets, updMissiles, updNova, updShards, updWeapons, updWing } from './weapons';
import { boost, boosted, land, landed, pause, start, steerHead, updCam } from './flight';
import { hudTick, showBest, showCard, updateLabels } from './hud';
import { choose, openCache } from './upgrades';
import { grab, initInput, STEER } from './input';
import { drawArcs, drawBeams, drawBolts, drawBullets, drawCache, drawCachePointer, drawCharge, drawStick, drawDebris, drawDim, drawEgg, drawEnemies, drawEnemyGlows, drawFX, drawMissiles, drawNova, drawRear, drawShards, drawSparks, drawTele, drawTop, drawTrail, drawWings } from './render';
import { played, store } from './store';
import { bot, botPick, initTest, T } from './test';

const metas = new Map<string, ReturnType<typeof analyse>>();
let last = 0, slowFrames = 0, shown = '', flyShown = '0.000';

export let starVis = 0;
export const heroEnd = () => $('hero').offsetHeight * 0.85;

const load = (src: string) => new Promise<HTMLImageElement | null>((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

function useBg(img: HTMLImageElement | null) {
  A.bg = img && img.naturalWidth ? img : null; if (!A.bg) return;
  let m = metas.get(A.bg.currentSrc); if (!m) metas.set(A.bg.currentSrc, (m = analyse(A.bg)));
  A.meta = m; scene.sun = m.sun; scene.limb = m.limb; scene.edge = m.edge; prepMoons(A.bg); light();
}

const SHIP = { w: 0.62, gap: 24, cue: 12 };

function restLayout() {
  const { W, H, tall } = V, short = !tall && H < 520, pr = [...D.copy.children].filter((e): e is HTMLElement => e instanceof HTMLElement && e.offsetHeight > 0).pop(), cue = D.hero.querySelector<HTMLElement>('.hint');
  let x = 0.5, y = tall ? 0.69 : 0.66, b = tall ? Math.min(W * 0.74, H * 0.42) : Math.min(W * 0.36, H * 0.62);
  if (tall && pr && cue) {
    const top = D.copy.offsetTop + pr.offsetTop + pr.offsetHeight, cy = (top + H) / 2;
    const hMax = Math.min(2 * (cy - top - SHIP.gap), (cue.offsetTop - SHIP.cue - cy) / 0.78);
    b = Math.min(W * SHIP.w, H * 0.32, hMax / A.aspR); y = cy / H;
  } else if (short) {
    const r = document.createRange(), x0 = D.hero.getBoundingClientRect().left; let right = 0;
    for (const el of D.copy.children) { r.selectNodeContents(el); right = Math.max(right, r.getBoundingClientRect().right - x0); }
    b = Math.min(H * 0.6, W - right - 56); x = (right + W) / 2 / W; y = 0.58;
  }
  rs.restX = x; rs.restY = y; rs.base = b; light();
}

function light() {
  if (!A.ship) return;
  const { W, H } = V, img = A.bg; let sx = W * scene.sun.x, sy = H * scene.sun.y;
  if (img) { const s = Math.max(W / img.width, H / img.height) * 1.07, w = img.width * s, h = img.height * s; sx = (W - w) / 2 + scene.sun.x * w; sy = (H - h) / 2 + scene.sun.y * h; }
  prepLight(sx - W * rs.restX, sy - H * rs.restY, rs.base * V.DPR * 1.15);
}

function size() {
  const r = D.hero.getBoundingClientRect(), oW = V.W, oH = V.H, oU = V.U, oB = rs.base, cv = D.cv;
  V.W = r.width; V.H = r.height; V.DPR = Math.min(devicePixelRatio || 1, coarse ? V.dprCap : 2);
  const w = Math.round(V.W * V.DPR), h = Math.round(V.H * V.DPR); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  ctx.setTransform(V.DPR, 0, 0, V.DPR, 0, 0);
  const { W, H } = V, tall = (V.tall = W / H < 0.85);
  if (A.meta) { scene.sun = A.meta.sun; scene.limb = A.meta.limb; scene.edge = A.meta.edge; }
  restLayout();
  V.U = clamp(Math.min(W, H) / 900, 0.55, 1.3); V.Z = clamp(Math.min(W, H) / (V.U * 860), 0.8, 1); V.vw = W / V.Z; V.vh = H / V.Z;
  ship.play = 172 * V.U * (tall ? 1.12 : 1);
  sizeWorld();
  if (oW && rs.x && (oW !== W || oH !== H)) { rs.x *= W / oW; rs.y *= H / oH; }
  if (oW && VP.dir && (oW !== W || oH !== H)) { VP.rx *= W / oW; VP.ry *= H / oH; VP.rw *= rs.base / (oB || rs.base); }
  if (G.on && V.U !== oU) rescale(V.U / oU);
  if (G.on && oW && oW !== W) { input.stick = null; pause(); }
  prepSprites();
}

export function initOrbit() {
  initCore(); initBackdrop(); initArt(); initInput();
  egg.shown = store.get('lg01-whisper');
  showBest(); updateLabels(); $('bestLine').hidden = !played();
  size();
  const pic = D.hero.querySelector<HTMLImageElement>('.bg img')!;
  const bg = new Promise<HTMLImageElement | null>((r) => { if (pic.complete) r(pic.naturalWidth ? pic : null); else { pic.addEventListener('load', () => r(pic), { once: true }); pic.addEventListener('error', () => r(null), { once: true }); } }).then((i) => (i ? i.decode().then(() => i, () => i) : null));
  const sp = DATA.sprites;
  Promise.all([bg, load(sp.ship)]).then(([b, s]) => {
    useBg(b); A.ship = s; A.base = true;
    if (s) { rs.noz = nozzles(s, rs.noz); A.aspR = s.height / s.width; LIT.key = ''; }
    size(); addEventListener('resize', size); new ResizeObserver(() => restLayout()).observe(D.copy); document.fonts.ready.then(() => restLayout());
    pic.addEventListener('load', () => pic.decode().then(() => useBg(pic), () => useBg(pic)));
    const art = FAC.flatMap((f) => TYPES.map((T) => sp[`${f.id}-${T.role}`]));
    return Promise.all([sp['ship-top'], sp.nebula, ...art].map(load));
  }).then(([st, nb, ...art]) => {
    A.shipTop = st; A.nebula = nb; A.art = FAC.map((_, f) => art.slice(f * TYPES.length, (f + 1) * TYPES.length) as HTMLImageElement[]);
    A.ready = !!(A.ship && st && nb && art.every(Boolean));
    if (!A.ready || !st) return;
    A.aspT = st.height / st.width; A.tsq0 = A.aspR * 0.5 / A.aspT; ship.tnoz = nozzles(st, ship.tnoz);
    prepSprites();
  });
  new IntersectionObserver((es) => { V.vis = es[0].isIntersecting; if (!V.vis) land(); }).observe(D.hero);
  if (import.meta.env.MODE === 'test') initTest();
}

function intro(now: number) {
  if (HI.done) return; const t = now - HI.t0, b = document.body.classList;
  if (!HI.pt && A.base) HI.pt = now;
  if (HI.skip) { HI.space = HI.cue = clamp(t / 400); HI.planet = HI.pt ? clamp((now - HI.pt) / 400) : 0; if (!HI.copy) { HI.copy = now; D.hero.classList.add('in'); b.remove('hi-nav', 'hi-main'); } if (HI.space >= 1 && HI.planet >= 1) HI.done = true; return; }
  HI.space = reduce ? clamp(t / 500) : out(clamp(t / 800));
  HI.planet = HI.pt ? (reduce ? clamp((now - HI.pt) / 600) : out(clamp((now - HI.pt) / 1000))) : 0;
  if (!HI.copy) { b.remove('hi-main'); const at = HI.ff ? now : Math.min(HI.pt ? HI.pt + 250 : Infinity, HI.t0 + 3500); if (now >= at - 200) b.remove('hi-nav'); if (now >= at) { HI.copy = now; D.hero.classList.add('in'); } }
  if (HI.copy) HI.cue = reduce ? 1 : out(clamp((now - HI.copy - 900) / 700));
  if (HI.copy && HI.cue >= 1 && HI.planet >= 1 && HI.space >= 1) HI.done = true;
}

export function orbitTick(now: number, hp: number) {
  intro(now);
  starVis = HI.space * sstep(0, 0.5, hp);
  const fade = HI.planet.toFixed(3); if (fade !== shown) { shown = fade; D.cv.style.opacity = fade; }
  if (!V.vis || !A.base) { if (VP.dir < 0) landed(); last = now; return; }
  if (!G.on && !VP.p && coarse && !input.charge && now - last < 30) return;
  F.fc++;
  if (import.meta.env.MODE === 'test') T.draws++;
  const w0 = performance.now(), { W, H } = V, rdt = Math.min((now - last) / 1000, 0.05); last = now;
  if (coarse && rdt > 0.021 && G.on) { if (++slowFrames > 90 && V.dprCap > 1.01) { V.dprCap = V.dprCap > 1.3 ? 1.25 : 1; slowFrames = 0; S.key = ''; size(); } } else slowFrames = Math.max(0, slowFrames - 1);
  if (VP.dir && !(VP.dir > 0 && G.card)) {
    VP.p = clamp(VP.p + VP.dir * rdt / (reduce ? 0.3 : VP.dir > 0 ? BOOST : LAND));
    if (VP.dir > 0 && VP.p >= 1) { VP.dir = 0; boosted(); }
    else if (VP.dir < 0 && VP.p < 0.28 && D.hero.classList.contains('playing')) D.hero.classList.remove('playing');
    if (VP.dir < 0 && VP.p <= 0) landed();
  }
  const top = G.on && VP.p >= 1, auto = import.meta.env.MODE === 'test' && T.auto;
  if (G.stop > 0) G.stop -= rdt;
  G.slow = Math.max(0, G.slow - rdt);
  const scale = G.stop > 0 || (import.meta.env.MODE === 'test' && T.frozen) ? 0 : G.slow > 0 ? 0.3 : 1, dt = top && !G.card ? rdt * scale : 0;
  if (top && !G.over) G.clock += dt;
  if (top && G.lvlT > 0 && !G.card) { G.lvlT -= rdt; if (G.lvlT <= 0 && G.pend > 0 && !G.over) showCard('level'); }
  if (auto && G.card && (G.mode === 'level' || G.mode === 'cache')) { T.botT += rdt; if (T.botT > 0.85) choose(botPick()); }
  const t = reduce ? 0 : now / 1000, sy = clamp(scrollY / H, 0, 1.2);
  Object.assign(F, { now, rdt, dt, t, sy, scroll: reduce ? 0 : scrollY });
  D.hero.style.setProperty('--ho', ((1 - clamp(sy * 4)) * HI.cue).toFixed(3));
  const fly = sstep(0, 0.41, VP.p).toFixed(3); if (fly !== flyShown) { flyShown = fly; D.cv.style.setProperty('--fly', fly); }

  if (input.charge && !G.on && !VP.p && now - input.charge.t0 > HOLD[input.charge.kind]) { const c = input.charge; if (c.kind === 'touch') grab(c.id, c.sx, c.sy); input.charge = null; start(c.kind); }

  const px = coarse || reduce ? 0 : input.mx - 0.5, py = coarse || reduce ? 0 : input.my - 0.5;
  if (G.on || VP.p) G.ease = 1;
  if (G.ease) { const k = 1 - Math.exp(-rdt * 3); G.px = lerp(G.px, G.on ? 0 : px, k); G.py = lerp(G.py, G.on ? 0 : py, k); if (!G.on && !VP.p && Math.abs(G.px - px) + Math.abs(G.py - py) < 1e-3) G.ease = 0; }
  else { G.px = px; G.py = py; }
  if (!rs.x) { rs.x = W * rs.restX; rs.y = H * (reduce || HI.skip ? rs.restY : rs.restY + 0.25); }
  if (!G.on && !VP.p) {
    rs.tx = rs.restX + G.px * (0.08 + egg.hover * 0.04) + Math.sin(t * 0.37) * 0.008; rs.ty = rs.restY + G.py * 0.03 + Math.sin(t * 0.61) * 0.006 - (reduce ? 0 : sy * 0.35);
    if (reduce) { rs.x = rs.tx * W; rs.y = rs.ty * H; rs.vx = rs.vy = 0; }
    else { rs.vx += ((rs.tx * W - rs.x) * 5 - rs.vx * 4.2) * rdt; rs.vy += ((rs.ty * H - rs.y) * 5 - rs.vy * 4.2) * rdt; rs.x += rs.vx * rdt; rs.y += rs.vy * rdt; }
    rs.sc += ((1 - (reduce ? 0 : sy * 0.25)) - rs.sc) * (reduce ? 1 : 1 - Math.exp(-rdt / 0.2));
    rs.bank = lerp(rs.bank, clamp(-rs.vx / (W * 1.6), -0.32, 0.32), 1 - Math.exp(-rdt * 10));
  } else rs.bank = lerp(rs.bank, 0, 1 - Math.exp(-rdt * 6));

  const px0 = ship.x, py0 = ship.y;
  if (top && !G.card && !G.dead) {
    const maxV = 640 * V.U * spdM() * (input.stick ? STICK.speed : V.tall ? 1.1 : 1);
    let dvx = 0, dvy = 0;
    if (input.keys.size && !auto) {
      let kx = 0, ky = 0; input.keys.forEach((k) => { kx += STEER[k][0]; ky += STEER[k][1]; });
      const m = Math.hypot(kx, ky) || 1; dvx = kx / m * maxV; dvy = ky / m * maxV;
      input.gx = ship.x; input.gy = ship.y; input.follow = false;
    } else if (input.stick && !auto) {
      const s = input.stick, dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy);
      if (d > STICK.dz) { const m = Math.min(1, (d - STICK.dz) / (STICK.r - STICK.dz)) ** STICK.curve * maxV; dvx = dx / d * m; dvy = dy / d * m; }
      input.gx = ship.x; input.gy = ship.y;
    } else {
      if (auto && dt > 0) { gridBuild(); bot(rdt); }
      else if (input.follow && !input.mlock) { input.gx = cam.x + (input.mx - 0.5) * V.vw; input.gy = cam.y + (input.my - 0.5) * V.vh; }
      else if (input.last === 'key' || input.last === 'touch') { input.gx = ship.x; input.gy = ship.y; }
      const dx = input.gx - ship.x, dy = input.gy - ship.y, d = Math.hypot(dx, dy);
      if (d > 0.5) { const s = Math.min(maxV, d * 9); dvx = dx / d * s; dvy = dy / d * s; }
    }
    const f = 1 - Math.exp(-dt * (input.last === 'touch' ? STICK.ease : 16));
    ship.cx = dvx; ship.cy = dvy;
    ship.vx += (dvx - ship.vx) * f; ship.vy += (dvy - ship.vy) * f;
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
  } else if (top && G.card) { ship.vx *= 0.9; ship.vy *= 0.9; ship.cx = ship.cy = 0; }
  else if (VP.dir < 0) { const k = Math.exp(-rdt * 4); ship.vx *= k; ship.vy *= k; ship.x += ship.vx * rdt; ship.y += ship.vy * rdt; }
  if (VP.p > 0) { const k = top ? dt : rdt; steerHead(k); updCam(k, ship.x - px0, ship.y - py0, rdt); }
  ship.kick = Math.max(0, ship.kick - rdt * 30); ship.muzzle = Math.max(0, ship.muzzle - rdt * 14);
  G.inv = Math.max(0, G.inv - dt); G.blinkT = Math.max(0, G.blinkT - dt);
  VP.rv = Math.max(0, VP.rv - rdt * 2.5);

  G.shake = Math.max(0, G.shake - rdt * 1.9);
  const amp = reduce ? 0 : G.shake * G.shake * 16 * V.U;
  C.sx = amp * (Math.sin(now * 0.053) * 0.6 + Math.sin(now * 0.031 + 1.3) * 0.4); C.sy = amp * (Math.sin(now * 0.047 + 2.1) * 0.6 + Math.sin(now * 0.029) * 0.4);
  boost(VP.p); scene.lit = 1 - sstep(0, 0.42, VP.p);
  if (!reduce) D.copy.style.setProperty('--cy', `${(-scrollY * 0.18 + DV.drop * 0.7).toFixed(1)}px`);
  C.wz = DV.gz; C.dz = V.DPR * C.wz; C.ox = DV.tx - ship.x * C.wz + C.sx; C.oy = DV.ty - ship.y * C.wz + C.sy;
  C.x0 = (C.sx - C.ox) / C.wz; C.x1 = (W + C.sx - C.ox) / C.wz; C.y0 = (C.sy - C.oy) / C.wz; C.y1 = (H + C.sy - C.oy) / C.wz;

  if (top && dt > 0 && A.ready) {
    G.killsF = 0;
    if (!G.over) spawner(dt);
    gridBuild(); updEnemies(dt, rdt);
    gridBuild(); separate(dt);
    gridBuild(); if (!G.over) updWeapons(dt);
    updBolts(dt); updMissiles(dt); updNova(dt); updShards(dt); updBullets(dt);
    if (G.cache && !G.over) { G.cache.t += dt; if (!G.card && Math.hypot(ship.x - G.cache.x, ship.y - G.cache.y) < shipR() + 46 * V.U) openCache(); }
    for (let i = TQ.length - 1; i >= 0; i--) { const q = TQ[i]; q.t -= dt; if (q.t <= 0) { TQ.splice(i, 1); if (q.run === G.run && G.on) q.fn(); } }
    compact();
  } else if (top && A.ready) {
    for (let i = 0; i < WS.nE; i++) EN[i].flash -= rdt;
    if (G.wm.wing) updWing(G.wm.wing, 0);
  } else if (WS.nE) { updEnemies(rdt, rdt); compact(); }

  ctx.save();
  screen();
  const orbit = !VP.p || (VP.p < 1 && (reduce || VP.p < 0.6));
  if (VP.p > 0 && !reduce) drawSpace(t, DV.ga);
  if (orbit) { scene.vp.x = W * 0.5; drawOrbit(); }
  const dfx = G.card ? 0 : rdt * scale;
  if (VP.p > 0) {
    ctx.imageSmoothingQuality = 'medium';
    if (reduce) drawSpace(t, DV.ga);
    base();
    if (G.on || WS.nE) { drawTele(dfx, t); drawShards(t); drawCache(t); if (G.on) { ctx.globalCompositeOperation = 'lighter'; drawNova(); ctx.globalCompositeOperation = 'source-over'; } drawEnemies(); }
    drawDebris(dfx);
    ctx.imageSmoothingQuality = 'low';
  }
  if (A.ship && VP.p < 1) { if (!VP.p) drawRear(rs.x, rs.y, restW(), 1, 1, rs.vx, rs.vy, 0); else drawRear(DV.rx, DV.ry, DV.rw, DV.rsq, DV.ra, 0, 0, 1, DV.punch); }
  if (VP.p > 0) {
    ctx.imageSmoothingQuality = 'medium';
    if (A.shipTop && !G.dead) { drawTrail(dfx); drawTop(DV.tx, DV.ty, DV.tw, DV.tsq, DV.ta * (1 - VP.rv), t); }
    base();
    if (top && !G.dead) drawWings();
    ctx.globalCompositeOperation = 'lighter';
    drawEnemyGlows(t);
    drawBeams(dfx); drawBolts(); drawMissiles(); drawArcs(dfx); drawFX(dfx, G.card ? 0 : rdt); drawSparks(dfx);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    drawBullets(t);
  }
  screen();
  drawStreaks(G.card ? 0 : rdt);
  drawCachePointer(t);
  drawDim();
  drawEgg();
  drawCharge();
  drawStick();
  ctx.restore();
  hudTick(rdt, now);
  if (import.meta.env.MODE === 'test') T.work[T.wi++ % T.work.length] = performance.now() - w0;
}
