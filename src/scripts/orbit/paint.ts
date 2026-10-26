import { sstep as sm } from '../util';

export type Scan = { sun: { x: number; y: number }; limb: number; edge: number[]; lit?: { w: number; h: number; runs: number[][] }; moons?: { best: number[] | null; off: number[] }[] };

export const MOONS: Record<string, number[][]> = { '3200x1800': [[2898, 250, 121], [2678, 372, 44]], '1800x3200': [[1441, 876, 96], [1614, 1012, 31]] };
export const SKY = 60;
const luma = (d: Uint8ClampedArray, k: number) => d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11;
const can = (w: number, h = w) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const pixels = (src: CanvasImageSource, w: number, h: number, crop?: number[]) => {
  const x = can(w, h).getContext('2d', { willReadFrequently: true })!;
  if (crop) x.drawImage(src, crop[0], crop[1], crop[2], crop[3], 0, 0, w, h); else x.drawImage(src, 0, 0, w, h);
  return x.getImageData(0, 0, w, h).data;
};

export function locate(img: HTMLImageElement) {
  const w = 96, h = Math.round(96 * img.naturalHeight / img.naturalWidth), d = pixels(img, w, h);
  let bx = 0, by = 0, bl = -1;
  for (let y = 0; y < h * 0.7; y++) for (let i = 0; i < w; i++) { const l = luma(d, (y * w + i) * 4); if (l > bl) { bl = l; bx = i; by = y; } }
  let ly = Math.round(h * 0.3), prev = 0;
  for (let y = 2; y < h * 0.8; y++) { let s = 0; for (let i = Math.floor(w * 0.35); i < w * 0.65; i++) s += luma(d, (y * w + i) * 4); s /= w * 0.3; if (s - prev > 22 && y > h * 0.08) { ly = y; break; } prev = s; }
  return { sun: { x: bx / w, y: by / h }, limb: ly / h };
}

export function edge(img: HTMLImageElement, limb: number) {
  const w = 240, h = Math.round(240 * img.naturalHeight / img.naturalWidth), d = pixels(img, w, h);
  const L = (i: number, y: number) => { let s = 0; for (let j = i - 1; j <= i + 1; j++) s += luma(d, (y * w + j) * 4); return s / 3; };
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
  const w = 200, h = Math.round(200 * img.height / img.width), d = pixels(img, w, h);
  const pts: number[][] = [];
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4; if (d[k + 3] > 200 && d[k + 2] > 190 && d[k + 1] > 160 && d[k] < 150) pts.push([i, y]); }
  if (pts.length < 4) return fb;
  const L = pts.filter((p) => p[0] < w / 2), R = pts.filter((p) => p[0] >= w / 2);
  const avg = (a: number[][]) => (a.length ? [a.reduce((s, p) => s + p[0], 0) / a.length / w, a.reduce((s, p) => s + p[1], 0) / a.length / h] : [0.5, 0.6]);
  return [avg(L), avg(R)];
}

export function moonRef(iw: number, ih: number) {
  const ref = Object.keys(MOONS).find((k) => { const [w, h] = k.split('x').map(Number); return Math.abs(w * ih - h * iw) < w; });
  if (!ref) return null;
  const sk = iw / +ref.split('x')[0];
  return { sk, M: MOONS[ref].map(([x, y, r]) => [x * sk, y * sk, r * sk]) };
}

export const moonR = (r: number, sk: number) => Math.ceil(r + 16 * sk);

export function moons(img: HTMLImageElement) {
  const iw = img.naturalWidth, ih = img.naturalHeight, ref = moonRef(iw, ih); if (!ref) return null;
  const { sk, M } = ref, w = 160, h = Math.round(w * ih / iw), L = pixels(img, w, h);
  const dark = (cx: number, cy: number, R: number) => { let m = 0; for (let v = cy - R; v <= cy + R; v += R / 4) for (let u = cx - R; u <= cx + R; u += R / 4) m = Math.max(m, luma(L, (Math.min(h - 1, Math.max(0, Math.round(v / ih * h))) * w + Math.min(w - 1, Math.max(0, Math.round(u / iw * w)))) * 4)); return m; };
  const runs: number[][] = [];
  for (let y = 0; y < h; y++) { const row: number[] = []; let on = false; for (let i = 0; i <= w; i++) { const s = i < w && luma(L, (y * w + i) * 4) > SKY; if (s !== on) { row.push(i); on = s; } } runs.push(row); }
  const out = M.map(([mx, my, r]) => {
    const R = moonR(r, sk), s = R * 2, d = pixels(img, s, s, [mx - R, my - R, s, s]);
    let best: number[] | null = null, bl = Infinity;
    for (const [ox, oy] of [[-2.2, 0], [2.2, 0], [0, -2.2], [-1.6, -1.6], [1.6, -1.6]]) {
      const cx = mx + ox * R, cy = my + oy * R; if (cx - R < 0 || cy - R < 0 || cx + R > iw || cy + R > ih || M.some(([qx, qy, qr]) => Math.hypot(cx - qx, cy - qy) < R + qr + 10 * sk)) continue;
      const l = dark(cx, cy, R); if (l < bl) { bl = l; best = [cx, cy]; }
    }
    const o = best ? pixels(img, s, s, [best[0] - R, best[1] - R, s, s]) : d, sum = [0, 0, 0, 0, 0, 0];
    let n = 0; for (let y = 0; y < s; y++) for (let i = 0; i < s; i++) { const q = Math.hypot(i - R, y - R), k = (y * s + i) * 4; if (q > r + 8 * sk && q < R) { for (let ch = 0; ch < 3; ch++) { sum[ch] += d[k + ch]; sum[ch + 3] += o[k + ch]; } n++; } }
    return { best, off: [0, 1, 2].map((ch) => (sum[ch] - sum[ch + 3]) / Math.max(1, n)) };
  });
  return { lit: { w, h, runs }, moons: out };
}

export const scan = (img: HTMLImageElement): Scan => { const m = locate(img); return { ...m, edge: edge(img, m.limb), ...moons(img) }; };

export function plate(img: HTMLImageElement, crop: HTMLCanvasElement, best: number[] | null, off: number[], r: number, R: number, sk: number) {
  const s = R * 2, c = can(s), p = c.getContext('2d', { willReadFrequently: true })!;
  if (best) p.drawImage(img, best[0] - R, best[1] - R, s, s, 0, 0, s, s); else p.drawImage(crop, 0, 0);
  const add = off.map((v) => Math.round(v)), up = add.map((v) => Math.max(0, v)), down = add.map((v) => Math.max(0, -v));
  const fill = (op: GlobalCompositeOperation, rgb: number[]) => { p.globalCompositeOperation = op; p.fillStyle = `rgb(${rgb.join(',')})`; p.fillRect(0, 0, s, s); };
  if (up.some(Boolean)) fill('lighter', up);
  if (down.some(Boolean)) { fill('difference', [255, 255, 255]); fill('lighter', down); fill('difference', [255, 255, 255]); }
  const m = can(s), mx = m.getContext('2d')!, id = mx.createImageData(s, s), a = id.data;
  for (let y = 0; y < s; y++) for (let i = 0; i < s; i++) { const q = Math.hypot(i - R, y - R); a[(y * s + i) * 4 + 3] = 255 * (q < r + 4 * sk ? 1 : 1 - sm(r + 4 * sk, r + 11 * sk, q)); }
  mx.putImageData(id, 0, 0); p.globalCompositeOperation = 'destination-in'; p.drawImage(m, 0, 0); p.globalCompositeOperation = 'source-over';
  return c;
}

export const bright = (lit: NonNullable<Scan['lit']>, i: number, y: number) => { const row = lit.runs[y]; let k = 0; while (k < row.length && row[k] <= i) k++; return k % 2 === 1; };
