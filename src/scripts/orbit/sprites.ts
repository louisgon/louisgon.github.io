import { nextTask } from '../util';
import { A, CAPH, ctx, FAC, G, mk, ship, TAU, TYPES, V } from './core';
import { ember, glow, SPR } from './art';

export type Spr = { c: HTMLCanvasElement; w: number; h: number; iw: number; ih: number; pad: number };
export const TX = {} as { streak: HTMLCanvasElement[]; pulse: HTMLCanvasElement; miss: HTMLCanvasElement; hive: HTMLCanvasElement; beamG: HTMLCanvasElement; beamC: HTMLCanvasElement; ringA: HTMLCanvasElement; ringG: HTMLCanvasElement; ringH: HTMLCanvasElement; shard: HTMLCanvasElement[]; fx0: HTMLCanvasElement[]; fx1: HTMLCanvasElement[]; dust: HTMLCanvasElement };
export const SK: { t: HTMLCanvasElement; s: boolean; a: number; sh: boolean }[] = [];
export type Pal = { bolt: HTMLCanvasElement; core: HTMLCanvasElement; fx: number; streak: [number, number]; mix: number; ember: number; deb: number; smoke: number; hi: string };
export const PAL: Pal[] = [];
export const DCOL = ['#3a3f47', '#5c626b', '#272b31', '#7e858f', '#6e3020', '#57582e', '#8c7426', '#3c322b', '#4c2c68', '#704494', '#2c1b42', '#2c6c7a'];
type Layer = { pat: CanvasPattern; size: number; k: number };
export const S = {
  key: '', fk: ['', '', ''], n: [[], [], []] as Spr[][], e: [[], [], []] as Spr[][], w: [[], [], []] as Spr[][], g: [[], [], []] as Spr[][], dwf: [[], [], []] as number[][],
  mini: null as HTMLCanvasElement | null, minig: null as HTMLCanvasElement | null, shipT: null as HTMLCanvasElement | null,
  neb: null as Layer | null, stars: [] as Layer[],
};
const jobs: (() => void)[] = [];
let pumping = false;
function pump() {
  if (pumping) return; pumping = true;
  const step = () => { const job = jobs.shift(); if (!job) { pumping = false; return; } job(); nextTask().then(step); };
  nextTask().then(step);
}
export const flushSprites = () => { while (jobs.length) jobs.shift()!(); };
export const dropSprites = () => { jobs.length = 0; Object.assign(S, { key: '', fk: ['', '', ''], n: [[], [], []], e: [[], [], []], w: [[], [], []], g: [[], [], []], dwf: [[], [], []], mini: null, minig: null, shipT: null, neb: null, stars: [] }); };

function streak(rgb: string) {
  const c = mk(64, 16), x = c.getContext('2d')!; x.translate(32, 8); x.scale(1, 0.24);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.28, `rgba(${rgb},0.9)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 32, 0, TAU); x.fill(); return c;
}
function capsule(rgb: string, core: string) {
  const c = mk(96, 24), x = c.getContext('2d')!;
  x.save(); x.translate(52, 12); x.scale(1, 0.26);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 44); g.addColorStop(0, `rgba(${core},0.9)`); g.addColorStop(0.4, `rgba(${rgb},0.55)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 44, 0, TAU); x.fill(); x.restore();
  const l = x.createLinearGradient(12, 0, 90, 0); l.addColorStop(0, `rgba(${core},0)`); l.addColorStop(0.75, `rgba(${core},1)`); l.addColorStop(1, 'rgba(255,255,255,1)');
  x.strokeStyle = l; x.lineWidth = 3.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(16, 12); x.lineTo(86, 12); x.stroke(); return c;
}
function ringTex(rgb: string, w = 0.13, fill = 0.05) {
  const s = 256, c = mk(s), x = c.getContext('2d')!, r = s / 2, g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},${fill * 0.4})`); g.addColorStop(Math.max(0, 1 - w * 3.2), `rgba(${rgb},${fill})`); g.addColorStop(1 - w * 1.1, `rgba(${rgb},0.5)`);
  g.addColorStop(1 - w * 0.45, 'rgba(255,255,255,0.95)'); g.addColorStop(1 - w * 0.12, `rgba(${rgb},0.45)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, s, s); return c;
}
function beamTex(rgb: string, core: string, mid = '255,255,255') {
  const c = mk(64, 64), x = c.getContext('2d')!, g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.28, `rgba(${rgb},0.3)`); g.addColorStop(0.43, `rgba(${core},0.9)`); g.addColorStop(0.5, `rgba(${mid},1)`); g.addColorStop(0.57, `rgba(${core},0.9)`); g.addColorStop(0.72, `rgba(${rgb},0.3)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const m = x.createLinearGradient(0, 0, 64, 0); m.addColorStop(0, 'rgba(0,0,0,0.5)'); m.addColorStop(0.04, '#000'); m.addColorStop(0.68, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, 64, 64); return c;
}
function shardTex(rgb: string, hi: string) {
  const s = 48, c = mk(s), x = c.getContext('2d')!;
  const g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, `rgba(${rgb},0.85)`); g.addColorStop(0.45, `rgba(${rgb},0.3)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s);
  x.beginPath(); x.moveTo(24, 9); x.lineTo(32.5, 24); x.lineTo(24, 39); x.lineTo(15.5, 24); x.closePath();
  const f = x.createLinearGradient(16, 9, 32, 39); f.addColorStop(0, '#ffffff'); f.addColorStop(0.42, `rgb(${hi})`); f.addColorStop(1, `rgb(${rgb})`);
  x.strokeStyle = 'rgba(2,10,6,0.92)'; x.lineWidth = 3; x.lineJoin = 'round'; x.stroke(); x.fillStyle = f; x.fill();
  x.beginPath(); x.moveTo(24, 9); x.lineTo(24, 39); x.moveTo(15.5, 24); x.lineTo(32.5, 24); x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 0.8; x.stroke();
  return c;
}
function cacheTex() {
  const sz = 112, c = mk(sz), x = c.getContext('2d')!; x.translate(sz / 2, sz / 2);
  const hex = (r: number) => { x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; if (i) x.lineTo(Math.cos(a) * r, Math.sin(a) * r); else x.moveTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); };
  hex(44); x.fillStyle = '#140b04'; x.fill();
  hex(40); const g = x.createLinearGradient(-40, -40, 40, 40); g.addColorStop(0, '#fff0c8'); g.addColorStop(0.4, '#f0b45c'); g.addColorStop(1, '#6e3f16'); x.fillStyle = g; x.fill();
  x.strokeStyle = 'rgba(40,18,4,0.55)'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; x.moveTo(Math.cos(a) * 22, Math.sin(a) * 22); x.lineTo(Math.cos(a) * 40, Math.sin(a) * 40); } x.stroke();
  hex(23); x.fillStyle = '#2a1607'; x.fill();
  hex(15); const h = x.createRadialGradient(0, 0, 0, 0, 0, 15); h.addColorStop(0, '#fffaf0'); h.addColorStop(0.5, '#ffd690'); h.addColorStop(1, '#ff9a3c'); x.fillStyle = h; x.fill();
  return c;
}
function plumeTex() {
  const c = mk(32, 128), x = c.getContext('2d')!, g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, 'rgba(170,232,255,0.6)'); g.addColorStop(0.5, 'rgba(110,200,255,0.25)'); g.addColorStop(1, 'rgba(80,170,255,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(4.8, 57.6, 16, 128); x.quadraticCurveTo(27.2, 57.6, 32, 0); x.closePath(); x.fill(); return c;
}
function boltTex(halo: string, rim: string, mid: string, core: string, outer = '') {
  const s = 64, c = mk(s), x = c.getContext('2d')!, disc = (r: number, f: string) => { x.beginPath(); x.arc(s / 2, s / 2, s * r, 0, TAU); x.fillStyle = f; x.fill(); };
  const g = x.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2); g.addColorStop(0, `rgba(${halo},0.5)`); if (outer) g.addColorStop(0.45, `rgba(${outer},0.2)`); g.addColorStop(1, `rgba(${outer || halo},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s);
  disc(0.315, 'rgba(4,2,6,0.9)'); disc(0.275, rim); disc(0.25, mid); disc(0.11, core); return c;
}
const coreTex = (core: string, rgb: string) => glow([[0, `rgba(${core},0.85)`], [0.35, `rgba(${rgb},0.35)`], [1, `rgba(${rgb},0)`]]);
export function initSprites() {
  Object.assign(SPR, {
    blast: glow([[0, 'rgba(255,246,226,0.9)'], [0.14, 'rgba(255,214,150,0.6)'], [0.42, 'rgba(255,160,80,0.16)'], [1, 'rgba(255,140,60,0)']]),
    hit: glow([[0, 'rgba(230,250,255,0.95)'], [0.45, 'rgba(150,225,255,0.35)'], [1, 'rgba(120,215,255,0)']]),
    gold: glow([[0, 'rgba(255,250,235,1)'], [0.16, 'rgba(255,214,150,0.62)'], [0.45, 'rgba(255,180,90,0.16)'], [1, 'rgba(255,170,80,0)']]),
    smoke: glow([[0, 'rgba(118,108,100,0.5)'], [0.5, 'rgba(92,84,78,0.26)'], [1, 'rgba(70,64,60,0)']], 96),
    cache: cacheTex(), plume: plumeTex(),
  });
  const streaks = [streak('255,186,100'), streak('255,236,205'), streak('130,210,255'), streak('255,120,70'), streak('255,140,52'), streak('255,112,236'), streak('112,236,255')];
  Object.assign(TX, {
    streak: streaks,
    pulse: capsule('110,200,255', '210,245,255'), miss: capsule('255,170,80', '255,236,200'), hive: capsule('255,200,120', '255,250,235'),
    beamG: beamTex('255,170,80', '255,236,200'), beamC: beamTex('255,176,90', '255,214,150', '255,238,205'),
    ringA: ringTex('255,170,90', 0.12, 0.03), ringG: ringTex('255,200,130', 0.1, 0.06), ringH: ringTex('110,200,255', 0.11, 0.06),
    shard: [shardTex('50,235,140', '196,255,222'), shardTex('40,255,180', '214,255,238'), shardTex('180,255,80', '238,255,196')],
    dust: streak('205,225,255'),
  });
  TX.fx0 = [SPR.blast, SPR.gold, SPR.hit, glow([[0, 'rgba(255,240,222,0.9)'], [0.14, 'rgba(255,172,92,0.62)'], [0.42, 'rgba(255,112,40,0.18)'], [1, 'rgba(255,90,30,0)']]), glow([[0, 'rgba(252,236,255,0.9)'], [0.14, 'rgba(255,140,240,0.6)'], [0.42, 'rgba(110,210,255,0.18)'], [1, 'rgba(90,220,255,0)']])];
  TX.fx1 = [TX.ringA, TX.ringG, TX.ringH, ringTex('255,128,60', 0.12, 0.03), ringTex('255,104,232', 0.12, 0.04)];
  const soft = (t: HTMLCanvasElement, a = 1, sh = false) => ({ t, s: false, a, sh });
  SK.push(...[0, 1, 2, 3].map((i) => ({ t: streaks[i], s: true, a: 1, sh: false })), soft(SPR.trail), soft(SPR.amber, 0.7), soft(SPR.star, 1, true), soft(SPR.cyan));
  SK.push(...[4, 5, 6].map((i) => ({ t: streaks[i], s: true, a: 1, sh: false })), soft(ember('255,128,52'), 0.7), soft(ember('110,236,255'), 0.7), soft(ember('255,96,228'), 0.7));
  PAL.push(
    { bolt: boltTex('255,178,74', '#4a2a06', '#ffb64a', '#fff3d6'), core: coreTex('255,232,190', '255,160,60'), fx: 0, streak: [0, 1], mix: 5, ember: 5, deb: 0, smoke: 0, hi: 'rgba(255,200,130,0.6)' },
    { bolt: boltTex('255,110,50', '#4a1206', '#ff6a32', '#fff1e0'), core: coreTex('255,226,170', '255,110,40'), fx: 3, streak: [8, 1], mix: 5, ember: 11, deb: 4, smoke: 1, hi: 'rgba(255,164,84,0.6)' },
    { bolt: boltTex('255,84,226', '#2a0838', '#ff5ae6', '#f2ffff', '96,236,255'), core: coreTex('214,255,255', '255,84,226'), fx: 4, streak: [9, 10], mix: 2, ember: 12, deb: 8, smoke: 0, hi: 'rgba(140,240,255,0.65)' },
  );
}

function silhouette(img: CanvasImageSource, iw: number, ih: number, col: string) { const c = mk(iw, ih), x = c.getContext('2d')!; x.drawImage(img, 0, 0, iw, ih); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, iw, ih); return c; }
function topSprite(img: HTMLImageElement, outW: number, line: string, glowRGB = '', glowA = 0, tint = ''): Spr {
  const iw = Math.round(outW), ih = Math.round(img.height * outW / img.width), o = Math.max(1.4, outW / 80), pad = Math.ceil(glowA ? outW * 0.1 : o) + 3;
  const sil = silhouette(img, iw, ih, line), c = mk(iw + pad * 2, ih + pad * 2), x = c.getContext('2d')!;
  x.imageSmoothingQuality = 'high';
  if (glowA) { x.shadowColor = `rgba(${glowRGB},${glowA})`; x.shadowBlur = pad * 0.8; x.drawImage(sil, pad, pad); x.drawImage(sil, pad, pad); x.shadowColor = 'transparent'; x.shadowBlur = 0; }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.drawImage(sil, pad + Math.cos(a) * o, pad + Math.sin(a) * o); }
  x.drawImage(img, pad, pad, iw, ih);
  if (tint) { const t = silhouette(img, iw, ih, tint); x.globalCompositeOperation = 'lighter'; x.drawImage(t, pad, pad); x.globalCompositeOperation = 'source-over'; }
  return { c, w: c.width, h: c.height, iw, ih, pad };
}
function whiteSprite(img: HTMLImageElement, R: Spr): Spr {
  const c = mk(R.w, R.h), x = c.getContext('2d')!;
  x.drawImage(img, R.pad, R.pad, R.iw, R.ih); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffb27a'; x.fillRect(0, 0, R.w, R.h);
  return { ...R, c };
}
function engineSprite(R: Spr, pts: readonly (readonly [number, number])[], er: number, rgb: string, core: string): Spr {
  const pad = Math.ceil(R.iw * 0.34), c = mk(R.iw + pad * 2, R.ih + pad * 2), x = c.getContext('2d')!, r = R.iw * er;
  x.globalCompositeOperation = 'lighter';
  for (const [u, v] of pts) {
    const cx = pad + u * R.iw, cy = pad + v * R.ih;
    x.save(); x.translate(cx, cy + r * 1.1); x.scale(0.62, 2.4);
    let g = x.createRadialGradient(0, 0, 0, 0, 0, r * 1.5); g.addColorStop(0, `rgba(${rgb},0.42)`); g.addColorStop(0.5, `rgba(${rgb},0.12)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 1.5, 0, TAU); x.fill(); x.restore();
    g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 1.9); g.addColorStop(0, `rgba(${core},0.9)`); g.addColorStop(0.24, `rgba(${rgb},0.5)`); g.addColorStop(0.62, `rgba(${rgb},0.07)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 1.9, 0, TAU); x.fill();
  }
  return { c, w: c.width, h: c.height, iw: R.iw, ih: R.ih, pad };
}

function prepType(f: number, i: number) {
  const { DPR, U } = V, F = FAC[f], T = TYPES[i];
  const img = A.art[f][i], dwf = T.dw || CAPH * img.width / img.height / T.w, outW = Math.min(img.width, Math.ceil(T.w * dwf * Math.max(U, 0.7) * 1.35 * DPR));
  S.dwf[f][i] = dwf;
  S.n[f][i] = topSprite(img, outW, '#05070d');
  S.e[f][i] = topSprite(img, outW, '#ffd08a', '255,190,100', 0.9, 'rgba(255,190,100,0.2)');
  S.w[f][i] = whiteSprite(img, S.n[f][i]);
  S.g[f][i] = engineSprite(S.n[f][i], F.eng[i], T.er, F.glow, F.core);
}
export function prepFaction(f: number) {
  if (!A.ready || S.fk[f] === S.key) return;
  TYPES.forEach((_, i) => prepType(f, i));
  S.fk[f] = S.key;
}
const factionJobs = (f: number, key: string) => [...TYPES.map((_, i) => () => { if (S.fk[f] !== key) prepType(f, i); }), () => { S.fk[f] = key; }];

let starSeed = 0;
const srand = () => { starSeed = (starSeed + 0x6d2b79f5) | 0; let t = Math.imul(starSeed ^ (starSeed >>> 15), 1 | starSeed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pot = (px: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, 2 ** Math.round(Math.log2(px))));
function starLayer(css: number, density: number, r0: number, r1: number, a0: number, a1: number, halo: number, seed: number, k: number): Layer {
  const { DPR } = V, size = pot(css * DPR, 256, 2048), c = mk(size), x = c.getContext('2d')!, side = size / DPR, n = Math.round(side * side * density);
  starSeed = seed;
  for (let i = 0; i < n; i++) {
    const px = srand() * size, py = srand() * size, r = (r0 + (r1 - r0) * srand() ** 2.2) * DPR, a = a0 + (a1 - a0) * srand(), warm = srand(), col = warm < 0.18 ? '255,226,190' : warm < 0.5 ? '214,228,255' : '240,246,255';
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const X = px + ox, Y = py + oy, R = Math.max(r * 8, r * halo); if (X < -R || Y < -R || X > size + R || Y > size + R) continue;
      if (halo && r > DPR * 0.9) { const g = x.createRadialGradient(X, Y, 0, X, Y, r * halo); g.addColorStop(0, `rgba(${col},${a * 0.32})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r * halo, 0, TAU); x.fill(); }
      x.fillStyle = `rgba(${col},${a})`; x.beginPath(); x.arc(X, Y, Math.max(0.5, r), 0, TAU); x.fill();
    }
  }
  return { pat: ctx.createPattern(c, 'repeat')!, size, k };
}
function nebulaLayer(): Layer | null {
  const img = A.nebula; if (!img) return null;
  const { DPR, W, H } = V, size = pot(Math.max(W, H) * 1.1 * DPR, 512, Math.min(2048, img.width)), c = mk(size), x = c.getContext('2d')!;
  x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, size, size);
  x.fillStyle = 'rgba(2,4,10,0.22)'; x.fillRect(0, 0, size, size);
  return { pat: ctx.createPattern(c, 'repeat')!, size, k: 0.3 };
}

export function prepSprites() {
  if (!A.ready || !A.shipTop) return;
  const { DPR, U, Z, W, H } = V, key = `${DPR}|${U.toFixed(2)}|${Z.toFixed(3)}|${Math.round(Math.max(W, H))}`; if (key === S.key) return; S.key = key;
  const top = A.shipTop, others = [0, 1, 2].filter((f) => f !== G.fac);
  jobs.length = 0;
  jobs.push(...factionJobs(G.fac, key), () => { S.neb = nebulaLayer(); },
    () => { S.stars = [starLayer(420, 1 / 900, 0.32, 0.72, 0.16, 0.5, 0, 0x51a7, 0.5), starLayer(560, 1 / 4200, 0.55, 1.05, 0.34, 0.62, 3.2, 0x2b9d, 0.75), starLayer(760, 1 / 15000, 0.85, 1.55, 0.47, 0.71, 4.6, 0x7e13, 1)]; },
    () => {
      const tw = Math.min(top.width, Math.ceil(ship.play * DPR * 1.3)), th = Math.round(tw * A.aspT);
      S.shipT = mk(tw, th); const st = S.shipT.getContext('2d')!; st.imageSmoothingQuality = 'high'; st.drawImage(top, 0, 0, tw, th);
      const mw = Math.ceil(56 * Math.max(U, 0.7) * DPR), mh = Math.round(mw * A.aspT);
      S.mini = mk(mw, mh); const m = S.mini.getContext('2d')!; m.imageSmoothingQuality = 'high'; m.drawImage(top, 0, 0, mw, mh);
      S.minig = mk(mw, mh); const g = S.minig.getContext('2d')!; g.drawImage(S.mini, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,186,96,0.42)'; g.fillRect(0, 0, mw, mh);
    },
    ...others.flatMap((f) => factionJobs(f, key)));
  pump();
}

export const prepped = () => !jobs.length;
