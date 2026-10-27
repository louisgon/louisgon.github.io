import { DATA } from '../data';
import { HI, reduce } from '../state';
import { $, nextTask, out, sstep } from '../util';
import { A, base, BOOST, C, cam, clamp, coarse, ctx, D, DV, egg, eio, eout, F, FAC, G, game, GZ0, HOLD, initCore, input, LAND, lerp, MOUSE, PIX, restW, rs, scene, screen, setGame, ship, shipR, shipW, sm, STICK, T, TYPES, V, VP } from './core';
import { initArt, LIT, prepLight, prepLightSoon } from './art';
import { drawOrbit, initBackdrop, keepMoons, prepMoons } from './backdrop';
import { edge, locate, moons, nozzles, type Scan } from './paint';
import PAINT from '../../lib/paint.json';
import { hudTick, measureLane, showBest, updateLabels } from './hud';
import { grab, initInput, STEER } from './input';
import { drawCharge, drawDim, drawEgg, drawRear } from './render';
import { played, store } from './store';

const metas = new Map<string, Scan>(), file = (src: string) => src.slice(src.lastIndexOf('/') + 1);
const shipped = (src: string) => (PAINT.paintings as Record<string, Scan>)[file(src)], shipNoz = (src: string) => (PAINT.ships as Record<string, number[][]>)[file(src)];
let lab: typeof import('./test') | null = null, last = 0, slowFrames = 0, shown = '', flyShown = '0.000', shipAt = 0, flyT = 0, bgOff = false, pic: HTMLImageElement, rested: Promise<unknown> | null = null, loading: Promise<void> | null = null;

export let starVis = 0;

const PACE = { n: 8, slow: 40, wait: 5000 };
const pace = { gap: 0, t: 0, wait: PACE.wait, n: 0, slow: 0, sum: 0, known: false, v: 0 };
export const gpuPace = () => (pace.known ? pace.gap : null);
// a GPU that cannot keep up (SwiftShader without a GPU) makes Chrome block the main thread for a whole frame, so leave it half idle
function measurePace(now: number, iv: number) {
  if ((pace.gap && now - pace.t < pace.wait) || iv > 500) return;
  pace.n++; if (iv > PACE.slow) { pace.slow++; pace.sum += iv; }
  if (pace.n < PACE.n) return;
  const slow = pace.slow >= (pace.gap ? PACE.n / 2 : PACE.n - 2);
  pace.wait = slow && pace.gap ? Math.min(pace.wait * 2, 60000) : PACE.wait;
  if (++pace.v === 1 && !slow) sharpen(2); else if (pace.v === 2 && slow && V.gpuCap > 0.6) sharpen(0.6);
  pace.gap = slow ? clamp(2 * pace.sum / pace.slow, 66, 250) : 0; pace.t = now; pace.known = true; pace.n = pace.slow = pace.sum = 0;
}
function sharpen(cap: number) { if (V.gpuCap !== cap) { V.gpuCap = cap; if (game) game.S.key = ''; size(); } }

export const heroEnd = () => $('hero').offsetHeight * 0.85;

const load = (src: string) => new Promise<HTMLImageElement | null>((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const decoded = (src: string) => load(src).then((i) => i && i.decode().then(() => i, () => i));

// without a GPU a canvas decodes the painting on the main thread, a blob decodes off it
const still = async () => {
  if (!pic.currentSrc || !pic.naturalWidth) return null;
  const i = new Image(); i.src = pic.currentSrc;
  const [bmp] = await Promise.all([fetch(i.src, { cache: 'force-cache' }).then((r) => r.blob()).then((b) => createImageBitmap(b)).catch(() => null), i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })]);
  if (!i.naturalWidth) return null;
  if (bmp && bmp.width === i.naturalWidth && bmp.height === i.naturalHeight) PIX.set(i, bmp);
  return i;
};
async function scanBg(img: HTMLImageElement, step: () => Promise<void>) {
  const has = metas.get(img.src) ?? shipped(img.src); if (has) return has;
  const m = locate(img); await step(); const e = edge(img, m.limb); await step();
  const sc = { ...m, edge: e, ...moons(img) }; metas.set(img.src, sc); return sc;
}
async function useBg(img: HTMLImageElement | null, step = async () => {}, soft = false) {
  if (!img || !img.naturalWidth) { A.bg = null; return; }
  const m = await scanBg(img, step);
  A.bg = img; A.meta = m; scene.sun = m.sun; scene.limb = m.limb; scene.edge = m.edge; await step(); await prepMoons(img, m, soft ? step : undefined); await step(); await light(soft);
}
async function swapBg(img: HTMLImageElement | null) {
  if (!img || !A.bg || img.src === A.bg.src) return;
  const old = A.bg; await scanBg(img, async () => {}); A.bgOld = old; A.bgT = performance.now(); await useBg(img); restLayout();
}
const copyRects = () => {
  const h = D.hero.getBoundingClientRect(), r = document.createRange(), dy = reduce ? 0 : -scrollY * 0.18 + DV.drop * 0.7, out: number[][] = [];
  const add = (q: DOMRect) => { if (q.width && q.height) out.push([q.left - h.left, q.top - h.top - dy, q.right - h.left, q.bottom - h.top - dy]); };
  D.copy.querySelectorAll('.hl .ln > span, .hs').forEach((el) => { r.selectNodeContents(el); for (const q of r.getClientRects()) add(q); });
  D.copy.querySelectorAll('.hc .btn').forEach((el) => add(el.getBoundingClientRect()));
  return out;
};

const SHIP = { w: 0.62, gap: 24, cue: 12 };

function restLayout() {
  const { W, H } = V, lay = getComputedStyle(D.hero).getPropertyValue('--lay').trim(), tall = lay === 'tall', short = lay === 'short', pr = [...D.copy.children].filter((e): e is HTMLElement => e instanceof HTMLElement && e.offsetHeight > 0).pop(), cue = D.hero.querySelector<HTMLElement>('.hint');
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
  rs.restX = x; rs.restY = y; rs.base = Math.max(b, Math.min(W * 0.28, 110)); light(); keepMoons(copyRects());
  const fw = Math.round(rs.base), fh = Math.round(fw * A.aspR); Object.assign(D.fly.style, { left: `${Math.round(W * x - fw / 2)}px`, top: `${Math.round(H * y - fh / 2)}px`, width: `${fw}px`, height: `${fh}px` });
}

function light(soft = false) {
  if (!A.ship) return;
  const { W, H } = V, img = A.bg; let sx = W * scene.sun.x, sy = H * scene.sun.y;
  if (img) { const nw = img.naturalWidth, nh = img.naturalHeight, s = Math.max(W / nw, H / nh) * 1.07, w = nw * s, h = nh * s; sx = (W - w) / 2 + scene.sun.x * w; sy = (H - h) / 2 + scene.sun.y * h; }
  return (soft ? prepLightSoon : prepLight)(sx - W * rs.restX, sy - H * rs.restY, rs.base * V.DPR * 1.15);
}

function boost(p: number) {
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

function size() {
  const r = D.hero.getBoundingClientRect(), oW = V.W, oH = V.H, oU = V.U, oB = rs.base, cv = D.cv;
  V.W = r.width; V.H = r.height; V.DPR = Math.min(devicePixelRatio || 1, coarse ? V.dprCap : 2, V.gpuCap);
  const w = Math.round(V.W * V.DPR), h = Math.round(V.H * V.DPR); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  ctx.setTransform(V.DPR, 0, 0, V.DPR, 0, 0);
  const { W, H } = V, tall = (V.tall = W / H < 0.85);
  if (A.meta) { scene.sun = A.meta.sun; scene.limb = A.meta.limb; scene.edge = A.meta.edge; }
  restLayout();
  V.U = clamp(Math.min(W, H) / 900, 0.55, 1.3); V.Z = clamp(Math.min(W, H) / (V.U * 860), 0.8, 1); V.vw = W / V.Z; V.vh = H / V.Z;
  ship.play = 172 * V.U * (tall ? 1.12 : 1);
  game?.sizeWorld();
  if (oW && rs.x && (oW !== W || oH !== H)) { rs.x *= W / oW; rs.y *= H / oH; }
  if (oW && VP.dir && (oW !== W || oH !== H)) { VP.rx *= W / oW; VP.ry *= H / oH; VP.rw *= rs.base / (oB || rs.base); }
  if (G.on && V.U !== oU) game!.rescale(V.U / oU);
  if (G.on && oW && oW !== W) { input.stick = null; game!.pause(); }
  if (G.on) measureLane();
  game?.prepSprites();
}

export function loadGame() {
  if (loading || !rested) return;
  const sp = DATA.sprites;
  loading = Promise.all([rested, import('./play')]).then(([, m]) => {
    setGame(m); m.initSprites(); m.sizeWorld();
    const art = FAC.flatMap((f) => TYPES.map((T) => sp[`${f.id}-${T.role}`]));
    return Promise.all([sp['ship-top'], sp.nebula, ...art].map(decoded));
  }).then(([st, nb, ...art]) => {
    A.shipTop = st; A.nebula = nb; A.art = FAC.map((_, f) => art.slice(f * TYPES.length, (f + 1) * TYPES.length) as HTMLImageElement[]);
    A.ready = !!(A.base && A.ship && st && nb && art.every(Boolean));
    if (!A.ready || !st) return;
    A.aspT = st.height / st.width; A.tsq0 = A.aspR * 0.5 / A.aspT; ship.tnoz = nozzles(st, ship.tnoz);
    game!.prepSprites();
  });
}
export const ready = () => A.ready && !!game && game.prepped();

export function initOrbit() {
  initCore(); initBackdrop(); initInput();
  egg.shown = store.get('lg01-whisper');
  showBest(); updateLabels(); $('bestLine').hidden = !played();
  size();
  pic = D.hero.querySelector<HTMLImageElement>('.bg img')!;
  const bg = new Promise<void>((r) => { if (pic.complete) r(); else { pic.addEventListener('load', () => r(), { once: true }); pic.addEventListener('error', () => r(), { once: true }); } }).then(still).then(async (b) => {
    await nextTask();
    await useBg(b, nextTask, true); await nextTask(); initArt(); await nextTask(); A.base = true;
    size(); addEventListener('resize', size); new ResizeObserver(() => restLayout()).observe(D.copy); document.fonts.ready.then(() => restLayout());
    pic.addEventListener('load', () => still().then(swapBg));
  });
  const sh = load(DATA.sprites.ship).then(async (s) => {
    A.ship = s; shipAt = performance.now();
    if (!s) return;
    rs.noz = shipNoz(s.src) ?? nozzles(s, rs.noz); A.aspR = s.height / s.width; LIT.key = '';
    if (HI.pt && !HI.skip && !G.on && !VP.p) rs.x = 0;
    await nextTask();
    if (A.base) size();
  });
  rested = Promise.all([bg, sh]);
  const fetchArt = () => { const sp = DATA.sprites; for (const k of ['ship-top', 'nebula', ...FAC.flatMap((f) => TYPES.map((T) => `${f.id}-${T.role}`))]) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = sp[k]; document.head.append(l); } };
  rested.then(() => (document.readyState === 'complete' ? fetchArt() : addEventListener('load', fetchArt, { once: true })));
  new IntersectionObserver((es) => { V.vis = es[0].isIntersecting; if (!V.vis) { input.fly = false; game?.land(); } }).observe(D.hero);
  if (import.meta.env.MODE === 'test') import('./test').then((m) => { lab = m; m.initTest(); });
}

function holdPicture() {
  if (HI.planet >= 1 && A.bg) { pic.parentElement!.classList.add('off'); pic.style.transform = ''; bgOff = true; return; }
  pic.style.transform = `translate3d(${scene.bx.toFixed(2)}px, ${scene.by.toFixed(2)}px, 0) scale3d(${scene.bz.toFixed(4)}, ${scene.bz.toFixed(4)}, 1)`;
}

function intro(now: number) {
  if (HI.done) return; const t = now - HI.t0, b = document.body.classList;
  if (!HI.pt && A.base) HI.pt = now;
  if (HI.skip) { HI.space = HI.cue = clamp(t / 400); HI.planet = HI.pt ? clamp((now - HI.pt) / 400) : 0; if (!HI.copy) { HI.copy = now; b.remove('hi-nav', 'hi-main'); } if (HI.space >= 1 && HI.planet >= 1) HI.done = true; return; }
  HI.space = reduce ? clamp(t / 500) : out(clamp(t / 800));
  HI.planet = HI.pt ? (reduce ? clamp((now - HI.pt) / 600) : out(clamp((now - HI.pt) / 500))) : 0;
  if (!HI.copy) { b.remove('hi-main'); const at = HI.ff ? now : Math.min(HI.pt ? HI.pt + 250 : Infinity, HI.t0 + 3500); if (now >= at - 250) b.remove('hi-nav'); if (now >= at) HI.copy = now; }
  if (HI.copy) HI.cue = reduce ? 1 : out(clamp((now - HI.copy - 900) / 700));
  if (HI.copy && HI.cue >= 1 && HI.planet >= 1 && HI.space >= 1) HI.done = true;
}

export function orbitTick(now: number, hp: number) {
  intro(now);
  const M = game;
  starVis = HI.space * sstep(0, 0.5, hp);
  const fade = HI.planet.toFixed(3); if (fade !== shown) { shown = fade; D.cv.style.opacity = fade; }
  if (!V.vis || !A.base) { if (VP.dir < 0) M!.landed(); last = now; return; }
  const resting = !G.on && !VP.p && !input.charge;
  if (resting && now - last < Math.max(coarse ? 30 : 0, pace.gap && now - pace.t < pace.wait ? pace.gap : 0)) return;
  F.fc++;
  if (import.meta.env.MODE === 'test') T.draws++;
  const w0 = performance.now(), { W, H } = V, iv = now - last, rdt = Math.min(iv / 1000, 0.05); last = now;
  if (resting && document.readyState === 'complete') measurePace(now, iv); else if (!resting && pace.v < 2) sharpen(2);
  if (coarse && rdt > 0.021 && G.on) { if (++slowFrames > 90 && V.dprCap > 1.01) { V.dprCap = V.dprCap > 1.3 ? 1.25 : 1; slowFrames = 0; M!.S.key = ''; size(); } } else slowFrames = Math.max(0, slowFrames - 1);
  if (VP.dir && !(VP.dir > 0 && G.card)) {
    VP.p = clamp(VP.p + VP.dir * rdt / (reduce ? 0.3 : VP.dir > 0 ? BOOST : LAND));
    if (VP.dir > 0 && VP.p >= 1) { VP.dir = 0; M!.boosted(); }
    else if (VP.dir < 0 && VP.p < 0.28 && D.hero.classList.contains('playing')) D.hero.classList.remove('playing');
    if (VP.dir < 0 && VP.p <= 0) M!.landed();
  }
  const top = G.on && VP.p >= 1, auto = import.meta.env.MODE === 'test' && T.auto;
  if (G.stop > 0) G.stop -= rdt;
  G.slow = Math.max(0, G.slow - rdt);
  const scale = G.stop > 0 || (import.meta.env.MODE === 'test' && T.frozen) ? 0 : G.slow > 0 ? 0.3 : 1, dt = top && !G.card ? rdt * scale : 0;
  if (top && !G.over) G.clock += dt;
  if (top && G.lvlT > 0 && !G.card) { G.lvlT = Math.max(G.reveal > 0 ? 1e-6 : 0, G.lvlT - rdt); if (G.lvlT <= 0 && G.pend > 0 && !G.over) M!.showCard('level'); }
  if (auto && G.card && (G.mode === 'level' || G.mode === 'cache')) { T.botT += rdt; if (T.botT > 0.85) M!.choose(lab!.botPick()); }
  const t = reduce ? 0 : now / 1000, sy = clamp(scrollY / H, 0, 1.2);
  Object.assign(F, { now, rdt, dt, t, sy, scroll: reduce ? 0 : scrollY });
  D.hero.style.setProperty('--ho', (1 - clamp(sy * 4)).toFixed(3));
  const fly = sstep(0, 0.41, VP.p).toFixed(3); if (fly !== flyShown) { flyShown = fly; D.art.style.setProperty('--fly', fly); }

  if (input.charge && !G.on && !VP.p && now - input.charge.t0 > HOLD[input.charge.kind] && ready()) { const c = input.charge; if (c.kind === 'touch') grab(c.id, c.sx, c.sy); input.charge = null; M!.start(c.kind); }
  if (input.fly && !G.on && !VP.p && ready()) { input.fly = false; M!.start('key'); }

  const px = coarse || reduce ? 0 : input.mx - 0.5, py = coarse || reduce ? 0 : input.my - 0.5;
  if (G.on || VP.p) G.ease = 1;
  if (G.ease) { const k = 1 - Math.exp(-rdt * 3); G.px = lerp(G.px, G.on ? 0 : px, k); G.py = lerp(G.py, G.on ? 0 : py, k); if (!G.on && !VP.p && Math.abs(G.px - px) + Math.abs(G.py - py) < 1e-3) G.ease = 0; }
  else { G.px = px; G.py = py; }
  if (!rs.x) { rs.x = W * rs.restX; rs.y = H * (reduce || HI.skip ? rs.restY : rs.restY + 0.16); flyT = now; }
  if (!G.on && !VP.p) {
    rs.tx = rs.restX + G.px * (0.08 + egg.hover * 0.04) + Math.sin(t * 0.37) * 0.008; rs.ty = rs.restY + G.py * 0.03 + Math.sin(t * 0.61) * 0.006 - (reduce ? 0 : sy * 0.35);
    if (reduce) { rs.x = rs.tx * W; rs.y = rs.ty * H; rs.vx = rs.vy = 0; }
    else { const k = now - flyT < 1200 ? 25 : 5, c = now - flyT < 1200 ? 10 : 4.2; rs.vx += ((rs.tx * W - rs.x) * k - rs.vx * c) * rdt; rs.vy += ((rs.ty * H - rs.y) * k - rs.vy * c) * rdt; rs.x += rs.vx * rdt; rs.y += rs.vy * rdt; }
    rs.sc += ((1 - (reduce ? 0 : sy * 0.25)) - rs.sc) * (reduce ? 1 : 1 - Math.exp(-rdt / 0.2));
    rs.bank = lerp(rs.bank, clamp(-rs.vx / (W * 1.6), -0.32, 0.32), 1 - Math.exp(-rdt * 10));
  } else rs.bank = lerp(rs.bank, 0, 1 - Math.exp(-rdt * 6));

  const px0 = ship.x, py0 = ship.y;
  if (top && !G.card && !G.dead) {
    const maxV = 640 * V.U * M!.spdM() * (input.stick ? STICK.speed : V.tall ? 1.1 : 1);
    let dvx = 0, dvy = 0;
    if (input.keys.size && !auto) {
      let kx = 0, ky = 0; input.keys.forEach((k) => { kx += STEER[k][0]; ky += STEER[k][1]; });
      const m = Math.hypot(kx, ky) || 1; dvx = kx / m * maxV; dvy = ky / m * maxV;
      input.gx = ship.x; input.gy = ship.y; input.follow = false;
    } else if (input.stick && !auto) {
      const s = input.stick, dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy);
      if (d > STICK.dz) { const m = Math.min(1, (d - STICK.dz) / (STICK.r - STICK.dz)) ** STICK.curve * maxV; dvx = dx / d * m; dvy = dy / d * m; }
      input.gx = ship.x; input.gy = ship.y;
    } else if (input.follow && !input.mlock && !auto) {
      const dx = input.mx * W - (W / 2 + (ship.x - cam.x) * V.Z), dy = input.my * H - (H / 2 + (ship.y - cam.y) * V.Z), d = Math.hypot(dx, dy), k = clamp((d - MOUSE.dz) / (MOUSE.r - MOUSE.dz));
      if (k > 0) { dvx = dx / d * k * maxV; dvy = dy / d * k * maxV; }
      input.gx = ship.x; input.gy = ship.y;
    } else {
      if (auto && dt > 0) { M!.gridBuild(); lab!.bot(rdt); }
      else if (!auto) { input.gx = ship.x; input.gy = ship.y; }
      const dx = input.gx - ship.x, dy = input.gy - ship.y, d = Math.hypot(dx, dy);
      if (d > 0.5) { const s = Math.min(maxV, d * 9); dvx = dx / d * s; dvy = dy / d * s; }
    }
    const f = 1 - Math.exp(-dt * (input.last === 'touch' ? STICK.ease : 16));
    ship.cx = dvx; ship.cy = dvy;
    ship.vx += (dvx - ship.vx) * f; ship.vy += (dvy - ship.vy) * f;
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
  } else if (top && G.card) { ship.vx *= 0.9; ship.vy *= 0.9; ship.cx = ship.cy = 0; }
  else if (VP.dir < 0) { const k = Math.exp(-rdt * 4); ship.vx *= k; ship.vy *= k; ship.x += ship.vx * rdt; ship.y += ship.vy * rdt; }
  if (VP.p > 0) { const k = top ? dt : rdt; M!.steerHead(k); M!.updCam(k, ship.x - px0, ship.y - py0, rdt); }
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

  if (top && dt > 0 && A.ready && M) {
    G.killsF = 0; G.reveal = Math.max(0, G.reveal - dt);
    if (!G.over) M.spawner(dt);
    M.gridBuild(); M.updEnemies(dt, rdt);
    M.gridBuild(); M.separate(dt);
    M.gridBuild(); if (!G.over) M.updWeapons(dt);
    M.updBolts(dt); M.updMissiles(dt); M.updNova(dt); M.updShards(dt); M.updBullets(dt);
    if (G.cache && !G.over) { G.cache.t += dt; if (!G.card && G.reveal <= 0 && Math.hypot(ship.x - G.cache.x, ship.y - G.cache.y) < shipR() + 46 * V.U) M.openCache(); }
    for (let i = M.TQ.length - 1; i >= 0; i--) { const q = M.TQ[i]; q.t -= dt; if (q.t <= 0) { M.TQ.splice(i, 1); if (q.run === G.run && G.on) q.fn(); } }
    M.compact();
  } else if (top && A.ready && M) {
    for (let i = 0; i < M.WS.nE; i++) M.EN[i].flash -= rdt;
    if (G.wm.wing) M.updWing(G.wm.wing, 0);
  } else if (M && M.WS.nE) { M.updEnemies(rdt, rdt); M.compact(); }

  ctx.save();
  screen();
  const orbit = !VP.p || (VP.p < 1 && (reduce || VP.p < 0.6));
  if (VP.p > 0 && !reduce) M!.drawSpace(t, DV.ga);
  if (orbit) { scene.vp.x = W * 0.5; drawOrbit(); if (!bgOff) holdPicture(); }
  const dfx = G.card ? 0 : rdt * scale;
  if (VP.p > 0) {
    ctx.imageSmoothingQuality = 'medium';
    if (reduce) M!.drawSpace(t, DV.ga);
    base();
    if (G.on || M!.WS.nE) { M!.drawTele(dfx, t); M!.drawShards(t); M!.drawCache(t); if (G.on) { ctx.globalCompositeOperation = 'lighter'; M!.drawNova(); ctx.globalCompositeOperation = 'source-over'; } M!.drawEnemies(); }
    M!.drawDebris(dfx);
    ctx.imageSmoothingQuality = 'low';
  }
  if (A.ship && VP.p < 1) { if (!VP.p) drawRear(rs.x, rs.y, restW(), 1, shipAt <= HI.pt ? 1 : reduce ? clamp((now - shipAt) / 600) : out(clamp((now - shipAt) / 400)), rs.vx, rs.vy, 0); else drawRear(DV.rx, DV.ry, DV.rw, DV.rsq, DV.ra, 0, 0, 1, DV.punch); }
  if (VP.p > 0) {
    ctx.imageSmoothingQuality = 'medium';
    if (A.shipTop && !G.dead) { M!.drawTrail(dfx); M!.drawTop(DV.tx, DV.ty, DV.tw, DV.tsq, DV.ta * (1 - VP.rv), t); }
    base();
    if (top && !G.dead) M!.drawWings();
    ctx.globalCompositeOperation = 'lighter';
    M!.drawEnemyGlows(t);
    M!.drawBeams(dfx); M!.drawBolts(); M!.drawMissiles(); M!.drawArcs(dfx); M!.drawFX(dfx, G.card ? 0 : rdt); M!.drawSparks(dfx);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    M!.drawBullets();
  }
  screen();
  if (M) { M.drawStreaks(G.card ? 0 : rdt); M.drawHurt(rdt); M.drawCachePointer(t); }
  drawDim();
  drawEgg();
  drawCharge();
  if (M) { M.drawStick(); M.drawPointer(); }
  ctx.restore();
  hudTick(rdt, now);
  if (import.meta.env.MODE === 'test') T.work[T.wi++ % T.work.length] = performance.now() - w0;
}
