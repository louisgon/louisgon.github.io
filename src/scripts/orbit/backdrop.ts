import { reduce } from '../state';
import { A, C, clamp, ctx, DV, F, G, mk, rand, scene, screen, sm, sprite, TAU, V, VP } from './core';
import { SPR } from './art';

type Star = { x: number; y: number; r: number; p: number; s: number };
type Dust = { a: number; d: number; s: number };
type Moon = { x: number; y: number; r: number; R: number; plate: HTMLCanvasElement; disc: HTMLCanvasElement; dx: number; dy: number; hide: boolean; sk: number };
type Mote = { x: number; y: number; s: number; l: number };
type Twinkle = { x: number; y: number; r: number; p: number; s: number };
let stars: Star[] = [], dust: Dust[] = [];
export let streaks: Dust[] = [], motes: Mote[] = [], twinkles: Twinkle[] = [];
const sats = [{ p: 0.1, v: 0.012, y: 0.12, warm: false }, { p: 0.62, v: 0.008, y: 0.2, warm: true }];
const PM = new DOMMatrix();
const MOONS: Record<string, number[][]> = { '3200x1800': [[2898, 250, 121], [2678, 372, 44]], '1800x3200': [[1441, 876, 96], [1614, 1012, 31]] };
let clear: number[][] = [], lum: { d: Uint8ClampedArray; w: number; h: number } | null = null;
const MOONGAP = 34, SKY = 60;
let haze: CanvasPattern | null = null, hzBuf: HTMLCanvasElement | null = null, hzX: CanvasRenderingContext2D | null = null, lifeT0 = 0, flare: HTMLCanvasElement | null = null, moons: Moon[] = [];
const hash = (x: number, y: number) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pnoise = (x: number, y: number, px: number, py: number) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, h = (i: number, j: number) => hash(((i % px) + px) % px, ((j % py) + py) % py), a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv; };
const HZ = { n: 256, k: 150, v: 0.045, wind: 0.012 };

export function analyse(img: HTMLImageElement) {
  const c = document.createElement('canvas'), w = 96, h = Math.round(96 * img.naturalHeight / img.naturalWidth); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  let bx = 0, by = 0, bl = -1;
  for (let y = 0; y < h * 0.7; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4, l = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; if (l > bl) { bl = l; bx = i; by = y; } }
  let ly = Math.round(h * 0.3), prev = 0;
  for (let y = 2; y < h * 0.8; y++) { let s = 0; for (let i = Math.floor(w * 0.35); i < w * 0.65; i++) { const k = (y * w + i) * 4; s += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; } s /= w * 0.3; if (s - prev > 22 && y > h * 0.08) { ly = y; break; } prev = s; }
  return { sun: { x: bx / w, y: by / h }, limb: ly / h, edge: edge(img, ly / h) };
}

function edge(img: HTMLImageElement, limb: number) {
  const c = document.createElement('canvas'), w = 240, h = Math.round(240 * img.naturalHeight / img.naturalWidth); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  const L = (i: number, y: number) => { let s = 0; for (let j = i - 1; j <= i + 1; j++) { const k = (y * w + j) * 4; s += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; } return s / 3; };
  const pts: number[][] = [];
  for (let i = 2; i < w - 2; i += 4) for (let y = 3; y < h * 0.85; y++) if (L(i, y) - L(i, y - 3) > 40 && L(i, y) > 70) { pts.push([i / w, y / h]); break; }
  const fit = (P: number[][]) => {
    const M = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (const [u, v] of P) for (let r = 0; r < 3; r++) { for (let k = 0; k < 3; k++) M[r][k] += u ** (r + k); M[r][3] += v * u ** r; }
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const f = M[j][i] / M[i][i]; for (let k = i; k < 4; k++) M[j][k] -= f * M[i][k]; }
    const e = [0, 0, 0]; for (let i = 2; i >= 0; i--) { let v = M[i][3]; for (let k = i + 1; k < 3; k++) v -= M[i][k] * e[k]; e[i] = v / M[i][i]; } return e;
  };
  let P = pts, e = [limb, 0, 0];
  for (let it = 0; it < 3 && P.length > 8; it++) { e = fit(P); P = pts.filter(([u, v]) => Math.abs(e[0] + e[1] * u + e[2] * u * u - v) < 0.02 / (it + 1)); }
  return e.every(Number.isFinite) ? e : [limb, 0, 0];
}

export function nozzles(img: HTMLImageElement, fb: number[][]) {
  const c = document.createElement('canvas'), w = 200, h = Math.round(200 * img.height / img.width); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  const pts: number[][] = [];
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4; if (d[k + 3] > 200 && d[k + 2] > 190 && d[k + 1] > 160 && d[k] < 150) pts.push([i, y]); }
  if (pts.length < 4) return fb;
  const L = pts.filter((p) => p[0] < w / 2), R = pts.filter((p) => p[0] >= w / 2);
  const avg = (a: number[][]) => (a.length ? [a.reduce((s, p) => s + p[0], 0) / a.length / w, a.reduce((s, p) => s + p[1], 0) / a.length / h] : [0.5, 0.6]);
  return [avg(L), avg(R)];
}

export function initBackdrop() {
  stars = Array.from({ length: 150 }, () => ({ x: rand(), y: rand(), r: rand() * 1.1 + 0.3, p: rand() * 6.28, s: 0.6 + rand() * 1.8 }));
  dust = Array.from({ length: 70 }, () => ({ a: rand() * 6.28, d: rand(), s: 0.3 + rand() * 0.7 }));
  streaks = Array.from({ length: 54 }, () => ({ a: rand(), d: rand(), s: 0.5 + rand() }));
  motes = Array.from({ length: 34 }, () => ({ x: rand(), y: rand(), s: 0.6 + rand() * 0.8, l: 0.6 + rand() * 0.8 }));
  twinkles = Array.from({ length: 26 }, () => ({ x: rand(), y: rand(), r: 2.2 + rand() * 2.6, p: rand() * TAU, s: 0.5 + rand() * 1.1 }));
  setTimeout(initLife, 60);
}

function initLife() {
  const n = HZ.n, c = mk(n), x = c.getContext('2d')!, id = x.createImageData(n, n), d = id.data;
  for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
    const u = i / n, v = y / n, a = sm(0.44, 0.78, pnoise(u * 4, v * 3, 4, 3) * 0.58 + pnoise(u * 8, v * 6, 8, 6) * 0.28 + pnoise(u * 16, v * 12, 16, 12) * 0.14), j = (y * n + i) * 4;
    d[j] = 255; d[j + 1] = 176 + 40 * a; d[j + 2] = 96 + 52 * a; d[j + 3] = 255 * a;
  }
  x.putImageData(id, 0, 0); haze = ctx.createPattern(c, 'repeat');
  hzBuf = mk(8, 8); hzX = hzBuf.getContext('2d')!;
  flare = mk(512, 32); const fx = flare.getContext('2d')!; fx.translate(256, 16); fx.scale(1, 0.0625);
  const g = fx.createRadialGradient(0, 0, 0, 0, 0, 256); g.addColorStop(0, 'rgba(255,236,210,1)'); g.addColorStop(0.08, 'rgba(255,200,140,0.5)'); g.addColorStop(0.4, 'rgba(255,170,100,0.1)'); g.addColorStop(1, 'rgba(255,150,80,0)');
  fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, 256, 0, TAU); fx.fill();
  lifeT0 = performance.now();
}

export function prepMoons(img: HTMLImageElement | null) {
  moons = []; lum = null; if (!img) return;
  const iw = img.naturalWidth, ih = img.naturalHeight, ref = Object.keys(MOONS).find((k) => { const [w, h] = k.split('x').map(Number); return Math.abs(w * ih - h * iw) < w; });
  if (!ref) return;
  const sk = iw / +ref.split('x')[0], M = MOONS[ref].map(([x, y, r]) => [x * sk, y * sk, r * sk]);
  { const w = 160, h = Math.round(w * ih / iw), c = mk(w, h), x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0, w, h); lum = { d: x.getImageData(0, 0, w, h).data, w, h }; }
  const L = lum!;
  const dark = (cx: number, cy: number, R: number) => { let m = 0; for (let v = cy - R; v <= cy + R; v += R / 4) for (let u = cx - R; u <= cx + R; u += R / 4) { const k = (Math.min(L.h - 1, Math.max(0, Math.round(v / ih * L.h))) * L.w + Math.min(L.w - 1, Math.max(0, Math.round(u / iw * L.w)))) * 4; m = Math.max(m, L.d[k] * 0.3 + L.d[k + 1] * 0.59 + L.d[k + 2] * 0.11); } return m; };
  for (const [mx, my, r] of M) {
    const R = Math.ceil(r + 16 * sk), s = R * 2, c = mk(s), x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, mx - R, my - R, s, s, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data;
    let best: number[] | null = null, bl = Infinity;
    for (const [ox, oy] of [[-2.2, 0], [2.2, 0], [0, -2.2], [-1.6, -1.6], [1.6, -1.6]]) {
      const cx = mx + ox * R, cy = my + oy * R; if (cx - R < 0 || cy - R < 0 || cx + R > iw || cy + R > ih || M.some(([qx, qy, qr]) => Math.hypot(cx - qx, cy - qy) < R + qr + 10 * sk)) continue;
      const l = dark(cx, cy, R); if (l < bl) { bl = l; best = [cx, cy]; }
    }
    const plate = mk(s), p = plate.getContext('2d', { willReadFrequently: true })!;
    if (best) p.drawImage(img, best[0] - R, best[1] - R, s, s, 0, 0, s, s); else p.drawImage(c, 0, 0);
    const out = p.getImageData(0, 0, s, s), o = out.data, sum = [0, 0, 0, 0, 0, 0];
    let n = 0; for (let y = 0; y < s; y++) for (let i = 0; i < s; i++) { const q = Math.hypot(i - R, y - R), k = (y * s + i) * 4; if (q > r + 8 * sk && q < R) { for (let ch = 0; ch < 3; ch++) { sum[ch] += d[k + ch]; sum[ch + 3] += o[k + ch]; } n++; } }
    for (let y = 0; y < s; y++) for (let i = 0; i < s; i++) {
      const q = Math.hypot(i - R, y - R), k = (y * s + i) * 4, a = q < r + 4 * sk ? 1 : 1 - sm(r + 4 * sk, r + 11 * sk, q);
      for (let ch = 0; ch < 3; ch++) o[k + ch] += (sum[ch] - sum[ch + 3]) / Math.max(1, n);
      o[k + 3] = 255 * a;
    }
    p.putImageData(out, 0, 0);
    const disc = mk(s), q = disc.getContext('2d')!; q.drawImage(c, 0, 0); q.globalCompositeOperation = 'destination-in';
    const f = q.createRadialGradient(R, R, r, R, R, r + 4 * sk); f.addColorStop(0, '#000'); f.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = f; q.fillRect(0, 0, s, s);
    moons.push({ x: mx, y: my, r, R, plate, disc, dx: 0, dy: 0, hide: false, sk });
  }
  placeMoons();
}

export function keepMoons(rects: number[][]) { clear = rects; placeMoons(); }
export function moonSpots() {
  const img = A.bg; if (!img) return { moons: [], copy: clear };
  const { W, H } = V, nw = img.naturalWidth, nh = img.naturalHeight, s = Math.max(W / nw, H / nh) * 1.07, x0 = (W - nw * s) / 2, y0 = (H - nh * s) / 2;
  return { moons: moons.map((m) => ({ x: Math.round(x0 + (m.x + m.dx) * s), y: Math.round(y0 + (m.y + m.dy) * s), r: Math.round(m.r * s), moved: !!(m.dx || m.dy), hide: m.hide })), copy: clear };
}
function placeMoons() {
  const img = A.bg; if (!img || !moons.length) return;
  const { W, H } = V, nw = img.naturalWidth, nh = img.naturalHeight, s = Math.max(W / nw, H / nh) * 1.07, x0 = (W - nw * s) / 2, y0 = (H - nh * s) / 2;
  const gap = (x: number, y: number, r: number) => clear.reduce((g, [l, t, rr, b]) => Math.min(g, Math.hypot(Math.max(l - x, 0, x - rr), Math.max(t - y, 0, y - b)) - r), Infinity);
  const sky = (x: number, y: number, r: number) => {
    if (!lum) return true; const L = lum;
    for (let a = 0; a < 16; a++) for (const q of [0.5, 1]) {
      const px = x + Math.cos(a / 16 * TAU) * (r + 8) * q, py = y + Math.sin(a / 16 * TAU) * (r + 8) * q, u = (px - x0) / s, v = (py - y0) / s;
      if (moons.some((m) => Math.hypot(u - m.x, v - m.y) < m.r + 10 * m.sk)) continue;
      const k = (Math.min(L.h - 1, Math.max(0, Math.round(v / nh * L.h))) * L.w + Math.min(L.w - 1, Math.max(0, Math.round(u / nw * L.w)))) * 4;
      if (L.d[k] * 0.3 + L.d[k + 1] * 0.59 + L.d[k + 2] * 0.11 > SKY) return false;
    }
    return true;
  };
  const at = moons.map((m) => [x0 + m.x * s, y0 + m.y * s, m.r * s]), placed: number[][] = [];
  for (const m of moons) { m.dx = m.dy = 0; m.hide = false; }
  const bad = moons.map((_, i) => gap(at[i][0], at[i][1], at[i][2]) < MOONGAP);
  moons.forEach((_, i) => { if (!bad[i]) placed.push(at[i]); });
  const ok = (x: number, y: number, r: number) => gap(x, y, r) >= MOONGAP && x + r * 0.2 <= W && x - r >= 0 && y - r >= 64 && placed.every(([px, py, pr]) => Math.hypot(x - px, y - py) >= r + pr + 8) && sky(x, y, r);
  moons.forEach((m, i) => {
    if (!bad[i]) return;
    const [x, y, r] = at[i]; let best: number[] | null = null, bd = Infinity;
    for (let dy = -96; dy <= 96; dy += 3) for (let dx = -96; dx <= 120; dx += 3) { const d = Math.hypot(dx, dy); if (d < bd && ok(x + dx, y + dy, r)) { bd = d; best = [dx, dy]; } }
    if (best) { m.dx = best[0] / s; m.dy = best[1] / s; placed.push([x + best[0], y + best[1], r]); } else m.hide = true;
  });
}

function drawMoons(B: { s: number; x: number; y: number }, br: number, t: number) {
  const k = 1 - sm(0, 0.12, VP.p); if (!moons.length || k <= 0) return;
  const ox = G.px * 9 + 2.5 * Math.sin(t * 0.05), oy = G.py * 4 + 1.2 * Math.sin(t * 0.037 + 1);
  for (let i = 0; i < moons.length; i++) {
    const m = moons[i], X = B.x + (m.x - m.R) * B.s, Y = B.y + (m.y - m.R) * B.s, S = m.R * 2 * B.s, z = i ? 0.7 : 1, MX = X + m.dx * B.s + ox * z, MY = Y + m.dy * B.s + oy * z;
    ctx.globalAlpha = DV.ba * k; ctx.drawImage(m.plate, X, Y, S, S);
    if (m.hide) continue;
    ctx.drawImage(m.disc, MX, MY, S, S);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = DV.ba * k * 0.16 * clamp((br - 0.82) / 0.34); ctx.drawImage(m.disc, MX, MY, S, S); ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
}

function drawLife(B: { x: number; y: number; w: number; h: number }, t: number, fade: number) {
  const k = clamp((F.now - lifeT0) / 1200) * DV.ba * fade; if (!haze || !hzBuf || !hzX || k <= 0.004) return;
  const { W, H } = V, e = scene.edge, hy = scene.vp.y, Hs = Math.max(H - hy, H * 0.3), cx = B.x + B.w / 2, bw = Math.ceil(W / 4), bh = Math.ceil(H / 4), sc = bw / W, x = hzX;
  if (hzBuf.width !== bw || hzBuf.height !== bh) { hzBuf.width = bw; hzBuf.height = bh; } else x.clearRect(0, 0, bw, bh);
  const v0 = HZ.v * t * HZ.k, u0 = HZ.wind * t * HZ.k;
  x.fillStyle = haze;
  for (let j = Math.max(0, Math.floor((hy + Hs / 5.5) * sc)); j < bh; j++) {
    const ya = j / sc, yb = (j + 1) / sc; if (ya <= hy + 1) continue;
    const za = Hs / (ya - hy), zb = Hs / (yb - hy), zm = (za + zb) / 2, a = sm(5.5, 2.6, zm) * (1 - 0.3 * sm(1.4, 1, zm)); if (a < 0.01) continue;
    const su = Hs / (zm * HZ.k) * sc, va = za * HZ.k + v0, vb = zb * HZ.k + v0;
    PM.a = su; PM.d = 1 / (vb - va); PM.e = cx * sc - u0 * su; PM.f = j - va * PM.d; haze.setTransform(PM);
    x.globalAlpha = a; x.fillRect(0, j, bw, 1);
  }
  ctx.save(); ctx.beginPath();
  for (let i = 0; i <= 16; i++) { const X = i / 16 * W, u = (X - B.x) / B.w, Y = B.y + (e[0] + e[1] * u + e[2] * u * u) * B.h + H * 0.012; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.lineTo(W, H * 2); ctx.lineTo(0, H * 2); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = k * 0.25; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(hzBuf, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  ctx.restore(); ctx.globalAlpha = 1;
}

const FEATHER = 16;
function cover(img: HTMLImageElement | null, ox: number, oy: number, z: number, fk = 0) {
  const { W, H } = V;
  if (!img) { ctx.fillStyle = '#0a0e1c'; ctx.fillRect(0, 0, W, H); return { s: 1, x: 0, y: 0, w: W, h: H }; }
  const nw = img.naturalWidth, nh = img.naturalHeight, s = Math.max(W / nw, H / nh) * z, w = nw * s, h = nh * s, x = (W - w) / 2 + ox, y = (H - h) / 2 + oy;
  if (fk <= 0) ctx.drawImage(img, x, y, w, h);
  else {
    const a0 = ctx.globalAlpha, band = 0.13, sb = nh * band / FEATHER, db = h * band / FEATHER;
    ctx.drawImage(img, 0, nh * band, nw, nh * (1 - band), x, y + h * band, w, h * (1 - band));
    for (let i = 0; i < FEATHER; i++) { const q = (i + 0.5) / FEATHER; ctx.globalAlpha = a0 * (1 - fk * (1 - q * q * (3 - 2 * q))); ctx.drawImage(img, 0, sb * i, nw, sb + 0.5 * nh / h, x, y + db * i, w, db + 0.5); }
    ctx.globalAlpha = a0;
  }
  return { s, x, y, w, h };
}

export function drawOrbit() {
  const { W, H, DPR } = V, { t, rdt, now } = F, px = G.px, py = G.py, scrollOff = F.scroll;
  const kx = DV.kx, ky = DV.ky, fx0 = W * 0.5, fy0 = H * 1.05, fade = 1 - sm(0, 0.35, VP.p);
  const place = (lift: number) => ctx.setTransform(kx * DPR, 0, 0, ky * DPR, (fx0 * (1 - kx) + C.sx) * DPR, (fy0 * (1 - ky) + DV.drop - lift + C.sy) * DPR);
  const bx = -px * 18 + Math.sin(t * 0.03) * W * 0.012, by = -py * 10 + scrollOff * 0.42, bz = 1.07 + Math.sin(t * 0.05) * 0.008;
  scene.bx = bx; scene.by = by; scene.bz = bz;
  place(0); ctx.globalAlpha = DV.ba;
  const B = cover(A.bg, bx, by, bz, DV.fk);
  if (DV.zb > 0.02 && A.bg) { for (const [m, al] of [[0.035, 0.22], [0.08, 0.12]]) { place(H * m * DV.zb * (VP.dir < 0 ? -1 : 1)); ctx.globalAlpha = al * DV.zb * DV.ba; cover(A.bg, bx, by, bz, DV.fk); } place(0); }
  ctx.globalAlpha = 1;
  scene.vp.y = B.y + scene.limb * B.h + H * 0.03;
  const br = reduce ? 1 : 1 + 0.12 * Math.sin(t * 0.31) + 0.04 * Math.sin(t * 0.83 + 1.7); scene.glow = br;
  if (A.bg) { drawMoons(B, br, t); drawLife(B, t, fade); }

  const sx = B.x + scene.sun.x * B.w, sunY = B.y + scene.sun.y * B.h;
  ctx.globalCompositeOperation = 'lighter';
  const pul = 0.85 * br * (G.on ? 0.7 : 1) * fade;
  const g = ctx.createRadialGradient(sx, sunY, 0, sx, sunY, Math.max(W, H) * 0.5);
  g.addColorStop(0, `rgba(255,214,150,${0.22 * pul})`); g.addColorStop(0.25, `rgba(255,170,90,${0.07 * pul})`); g.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (flare) { const fw = Math.max(W, H) * 0.62 * (0.94 + 0.06 * br), fh = 12 * V.U; ctx.globalAlpha = 0.3 * pul; ctx.drawImage(flare, sx - fw / 2, sunY - fh / 2, fw, fh); ctx.globalAlpha = 1; }
  const limbY = B.y + scene.limb * B.h;
  for (const s of stars) { const yy = s.y * H + scrollOff * 0.42; if (yy > limbY - 10) continue; const a = (reduce ? 0.5 : 0.42 + 0.22 * Math.sin(t * s.s * 0.6 + s.p)) * (1 - clamp(yy / Math.max(limbY, 1) - 0.6) * 1.2) * fade; if (a <= 0) continue; ctx.fillStyle = `rgba(220,235,255,${a})`; ctx.fillRect(s.x * W - s.r, yy - s.r, s.r * 2, s.r * 2); }
  if (!reduce) for (let k = 0; k < 2; k++) {
    const q = t / 9 + k * 0.5, n = Math.floor(q), s = stars[Math.floor(hash(n, k + 7) * stars.length)], a = Math.sin(Math.PI * clamp((q - n) / 0.4)) ** 2, yy = s.y * H + scrollOff * 0.42;
    if (a > 0.01 && yy < limbY - 24) sprite(SPR.star, s.x * W, yy, (4 + s.r * 3) * V.U, 0.8 * a * fade);
  }
  for (const st of sats) {
    if (!reduce) st.p = (st.p + st.v * rdt) % 1.2;
    const xx = (st.p - 0.1) * W, yy = st.y * H + Math.sin(st.p * 3) * H * 0.03 + scrollOff * 0.42;
    if (yy > limbY - 6) continue;
    const on = (reduce || Math.floor(now / (st.warm ? 1150 : 800)) % 4 !== 0 ? 1 : 0.3) * fade;
    ctx.fillStyle = st.warm ? `rgba(255,217,168,${0.9 * on})` : `rgba(255,255,255,${0.9 * on})`; ctx.fillRect(xx - 1.2, yy - 1.2, 2.4, 2.4);
    sprite(st.warm ? SPR.amber : SPR.trail, xx, yy, 7, 0.6 * on);
  }
  if (!reduce) {
    const flying = VP.p > 0, spd = flying ? 0.9 * rdt : 0.045 * rdt;
    for (const d of dust) {
      d.d += d.s * spd; if (d.d > 1) { d.d = 0; d.a = rand() * 6.28; }
      const e = Math.pow(d.d, 2.2), rx = scene.vp.x + Math.cos(d.a) * W * 0.9 * e, ry = scene.vp.y + Math.abs(Math.sin(d.a)) * H * 0.9 * e + H * 0.05 * e;
      const a = clamp(d.d * 2) * (1 - d.d) * 0.22 * fade;
      ctx.strokeStyle = `rgba(255,220,180,${a})`; ctx.lineWidth = 1 + e * (flying ? 1.2 : 2);
      const tl = flying ? 0.05 : 0.015, e2 = Math.pow(Math.max(d.d - tl, 0), 2.2);
      ctx.beginPath(); ctx.moveTo(scene.vp.x + Math.cos(d.a) * W * 0.9 * e2, scene.vp.y + Math.abs(Math.sin(d.a)) * H * 0.9 * e2 + H * 0.05 * e2); ctx.lineTo(rx, ry); ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  if (A.bgOld) {
    const f = clamp((F.now - A.bgT) / 260);
    if (f >= 1) A.bgOld = null; else { place(0); ctx.globalAlpha = (1 - f) * DV.ba; cover(A.bgOld, bx, by, bz, DV.fk); ctx.globalAlpha = 1; }
  }
  screen();
}
