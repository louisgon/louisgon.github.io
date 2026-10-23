import { DATA } from '../data';
import { HI, reduce } from '../state';
import { $, out, sstep } from '../util';
import { A, clamp, coarse, ctx, D, egg, F, fmt, G, HOLD, initCore, input, lerp, rand, scene, ship, V } from './core';
import { P, played, store } from './store';
import { analyse, drawBackdrop, initBackdrop, nozzles } from './backdrop';
import { drawArcs, drawBolts, drawEnemyBolts, drawParts, drawTele, fireTick } from './combat';
import { drawDrones, waveTick } from './enemies';
import { gxc, gyc, land, limX, start } from './flight';
import { showRank, updateLabels } from './hud';
import { initInput, STEER } from './input';
import { drawCharge, drawEgg, drawPops, drawShip, drawWings } from './render';

const metas = new Map<string, ReturnType<typeof analyse>>();
let last = 0, slowFrames = 0, shown = '';

export let starVis = 0;
export const heroEnd = () => $('hero').offsetHeight * 0.85;

const load = (src: string) => new Promise<HTMLImageElement | null>((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

function useBg(img: HTMLImageElement | null) {
  A.bg = img && img.naturalWidth ? img : null; if (!A.bg) return;
  let m = metas.get(A.bg.currentSrc); if (!m) metas.set(A.bg.currentSrc, (m = analyse(A.bg)));
  A.meta = m; scene.sun = m.sun; scene.limb = m.limb;
}

function size() {
  const r = D.hero.getBoundingClientRect(), oW = V.W, oH = V.H, cv = D.cv;
  V.W = r.width; V.H = r.height; V.DPR = Math.min(devicePixelRatio || 1, coarse ? V.dprCap : 2);
  const w = Math.round(V.W * V.DPR), h = Math.round(V.H * V.DPR); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  ctx.setTransform(V.DPR, 0, 0, V.DPR, 0, 0);
  const { W, H } = V, tall = (V.tall = W / H < 0.85); V.CAP = coarse ? 200 : 400;
  if (A.meta) { scene.sun = A.meta.sun; scene.limb = A.meta.limb; }
  ship.base = tall ? Math.min(W * 0.74, H * 0.42) : Math.min(W * 0.36, H * 0.62);
  ship.restY = tall ? 0.69 : 0.66;
  ship.play = tall ? Math.min(W * 0.44, H * 0.24) : ship.base * 0.8;
  if (oW && ship.x && (oW !== W || oH !== H)) { ship.x *= W / oW; ship.y *= H / oH; G.bolts = []; G.enemyBolts = []; G.parts = []; G.pops = []; G.trail = []; G.tele = []; }
  V.barBottom = D.bossBar.getBoundingClientRect().bottom - r.top;
}

export function initOrbit() {
  initCore(); initBackdrop(); initInput();
  egg.shown = store.get('lg01-whisper');
  $('best0').textContent = $('best1').textContent = fmt(P.best);
  showRank(); updateLabels(); $('bestLine').hidden = !played();
  size();
  const pic = D.hero.querySelector<HTMLImageElement>('.bg img')!;
  const bg = new Promise<HTMLImageElement | null>((r) => { if (pic.complete) r(pic.naturalWidth ? pic : null); else { pic.addEventListener('load', () => r(pic), { once: true }); pic.addEventListener('error', () => r(null), { once: true }); } }).then((i) => (i ? i.decode().then(() => i, () => i) : null));
  Promise.all([bg, load(DATA.sprites.ship)]).then(([b, s]) => {
    useBg(b); A.ship = s; A.base = true;
    if (s) ship.noz = nozzles(s);
    size(); addEventListener('resize', size);
    pic.addEventListener('load', () => pic.decode().then(() => useBg(pic), () => useBg(pic)));
    return Promise.all([DATA.sprites.drone, DATA.sprites.dart, DATA.sprites.heavy, DATA.sprites.boss].map(load));
  }).then(([d, dt, hv, bs]) => { A.drone = d; A.dart = dt; A.heavy = hv; A.boss = bs; A.ready = !!(A.ship && d && dt && hv && bs); });
  new IntersectionObserver((es) => { V.vis = es[0].isIntersecting; if (!V.vis) land(); }).observe(D.hero);
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
  if (!V.vis || !A.base) { last = now; return; }
  if (!G.on && coarse && !input.charge && (++F.fc & 1)) return;
  F.fc++;
  const { W, H } = V, rdt = Math.min((now - last) / 1000, 0.05); last = now;
  if (coarse && rdt > 0.021 && G.on) { if (++slowFrames > 90 && V.dprCap > 1.01) { V.dprCap = V.dprCap > 1.3 ? 1.25 : 1; slowFrames = 0; size(); } } else slowFrames = Math.max(0, slowFrames - 1);
  G.slow = Math.max(0, G.slow - rdt);
  const dt = G.card ? 0 : rdt * (G.slow > 0 ? 0.3 : 1);
  if (G.on) G.clock += dt;
  const t = reduce ? 0 : now / 1000, sy = clamp(scrollY / H, 0, 1.2);
  Object.assign(F, { now, rdt, dt, t, sy, scroll: reduce ? 0 : scrollY });
  if (!reduce) D.copy.style.setProperty('--cy', `${(-scrollY * 0.18).toFixed(1)}px`);
  D.hero.style.setProperty('--ho', ((1 - clamp(sy * 4)) * HI.cue).toFixed(3));

  if (input.charge && !G.on && now - input.charge.t0 > HOLD[input.charge.kind]) { const c = input.charge; if (c.kind === 'touch') { input.tid = c.id; input.lx = c.sx; input.ly = c.sy; } input.charge = null; start(c.kind); }
  if (G.on && !G.card && input.keys.size) {
    let kx = 0, ky = 0; input.keys.forEach((k) => { kx += STEER[k][0]; ky += STEER[k][1]; });
    const m = Math.hypot(kx, ky) || 1, pw = 1 - limX() * 2;
    input.gx = gxc(input.gx + kx / m * pw * 0.95 * rdt); input.gy = gyc(input.gy + ky / m * 0.46 * 0.75 * rdt);
  }

  const px = coarse || reduce ? 0 : input.mx - 0.5, py = coarse || reduce ? 0 : input.my - 0.5;
  F.px = px; F.py = py;
  if (!ship.x) { ship.x = W * 0.5; ship.y = H * (reduce || HI.skip ? ship.restY : ship.restY + 0.25); }
  const ox = ship.x, oy = ship.y;
  if (G.on) {
    ship.ease = Math.max(0, ship.ease - rdt);
    const f = 1 - Math.exp(-rdt / (ship.ease > 0 ? 0.15 : 0.045));
    if (!G.card) { ship.x += (input.gx * W - ship.x) * f; ship.y += (input.gy * H - ship.y) * f; }
    ship.vx = (ship.x - ox) / Math.max(rdt, 1e-3); ship.vy = (ship.y - oy) / Math.max(rdt, 1e-3);
  } else {
    ship.tx = 0.5 + px * (0.08 + egg.hover * 0.04) + Math.sin(t * 0.37) * 0.008; ship.ty = ship.restY + py * 0.03 + Math.sin(t * 0.61) * 0.006 - (reduce ? 0 : sy * 0.35);
    if (reduce) { ship.x = ship.tx * W; ship.y = ship.ty * H; ship.vx = ship.vy = 0; }
    else { ship.vx += ((ship.tx * W - ship.x) * 5 - ship.vx * 4.2) * rdt; ship.vy += ((ship.ty * H - ship.y) * 5 - ship.vy * 4.2) * rdt; ship.x += ship.vx * rdt; ship.y += ship.vy * rdt; }
  }
  ship.sc += ((G.on ? ship.play / ship.base : 1 - (reduce ? 0 : sy * 0.25)) - ship.sc) * (reduce ? 1 : 1 - Math.exp(-rdt / 0.2));
  ship.bank = lerp(ship.bank, clamp(-ship.vx / (W * 1.6), -0.32, 0.32), 1 - Math.exp(-rdt * 10));
  ship.hit = Math.max(0, ship.hit - dt); ship.kick = Math.max(0, ship.kick - rdt * 30); ship.muzzle = Math.max(0, ship.muzzle - rdt * 14);
  G.shake = Math.max(0, G.shake - rdt * 2.5); G.flash = Math.max(0, G.flash - rdt * 3);
  scene.vp.x = W * 0.5;
  F.sw = ship.base * ship.sc; F.sh = F.sw * (A.ship ? A.ship.height / A.ship.width : 0.4);

  const shk = reduce ? 0 : G.shake * 10;
  ctx.save();
  ctx.translate((rand() - 0.5) * shk, (rand() - 0.5) * shk);
  drawBackdrop();

  if (G.on && !G.over && !G.card && A.ready) waveTick();
  D.msg.style.opacity = (G.on && !G.card ? clamp(1 - (now - G.msgT - G.msgHold) / 400) * clamp((now - G.msgT) / 200) : 0).toFixed(2);
  const cmb = G.on && G.combo > 1 ? clamp(1 - (G.clock - G.comboT) / 1.6) : 0;
  if (cmb <= 0 && G.combo > 1) G.combo = 1;
  D.combo.classList.toggle('on', cmb > 0); if (cmb > 0) { D.comboN.textContent = `Combo ×${G.combo}`; D.comboFill.style.transform = `scale3d(${cmb.toFixed(3)}, 1, 1)`; }

  drawDrones();
  drawArcs();
  drawTele();
  if (G.on && !G.over && !G.card && A.ready) fireTick();
  drawBolts();
  drawEnemyBolts();
  drawParts();
  drawShip();
  drawWings();
  drawPops();
  drawEgg();
  drawCharge();
  ctx.restore();
}
