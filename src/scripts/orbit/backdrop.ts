import { reduce } from '../state';
import { A, clamp, ctx, F, G, rand, scene, sprite, SPR, V } from './core';

type Star = { x: number; y: number; r: number; p: number; s: number };
type Dust = { a: number; d: number; s: number };
type Rock = { x: number; y: number; r: number; v: number; rot: number; vr: number; d: number; img: HTMLCanvasElement };
let stars: Star[] = [], dust: Dust[] = [], rocks: Rock[] = [];
const sats = [{ p: 0.1, v: 0.012, y: 0.12, warm: false }, { p: 0.62, v: 0.008, y: 0.2, warm: true }];

export function analyse(img: HTMLImageElement) {
  const c = document.createElement('canvas'), w = 96, h = Math.round(96 * img.height / img.width); c.width = w; c.height = h;
  const x = c.getContext('2d')!; x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  let bx = 0, by = 0, bl = -1;
  for (let y = 0; y < h * 0.7; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4, l = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; if (l > bl) { bl = l; bx = i; by = y; } }
  let ly = Math.round(h * 0.3), prev = 0;
  for (let y = 2; y < h * 0.8; y++) { let s = 0; for (let i = Math.floor(w * 0.35); i < w * 0.65; i++) { const k = (y * w + i) * 4; s += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; } s /= w * 0.3; if (s - prev > 22 && y > h * 0.08) { ly = y; break; } prev = s; }
  return { sun: { x: bx / w, y: by / h }, limb: ly / h };
}

export function nozzles(img: HTMLImageElement) {
  const c = document.createElement('canvas'), w = 200, h = Math.round(200 * img.height / img.width); c.width = w; c.height = h;
  const x = c.getContext('2d')!; x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  const pts: number[][] = [];
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4; if (d[k + 3] > 200 && d[k + 2] > 190 && d[k + 1] > 160 && d[k] < 150) pts.push([i, y]); }
  if (pts.length < 4) return [[0.33, 0.62], [0.67, 0.62]];
  const L = pts.filter((p) => p[0] < w / 2), R = pts.filter((p) => p[0] >= w / 2);
  const avg = (a: number[][]) => (a.length ? [a.reduce((s, p) => s + p[0], 0) / a.length / w, a.reduce((s, p) => s + p[1], 0) / a.length / h] : [0.5, 0.6]);
  return [avg(L), avg(R)];
}

function rockSprite(r: number, pts: number[]) {
  const s = Math.ceil(r * 2.6), c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d')!; x.translate(s / 2, s / 2);
  const P = pts.map((k, i) => { const a = i / pts.length * 6.28; return [Math.cos(a) * r * k, Math.sin(a) * r * k]; });
  const path = () => { x.beginPath(); P.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); };
  path(); x.fillStyle = '#17120f'; x.fill();
  x.save(); path(); x.clip();
  x.beginPath(); x.moveTo(P[4][0], P[4][1]); x.lineTo(P[5][0], P[5][1]); x.lineTo(P[6][0], P[6][1]); x.lineTo(r * 0.1, -r * 0.1); x.closePath(); x.fillStyle = '#3a2c22'; x.fill();
  x.beginPath(); x.moveTo(P[0][0], P[0][1]); x.lineTo(P[6][0], P[6][1]); x.lineTo(r * 0.1, -r * 0.1); x.closePath(); x.fillStyle = '#5c4330'; x.fill();
  x.restore();
  const g = x.createLinearGradient(r, -r, -r * 0.2, r * 0.3); g.addColorStop(0, 'rgba(255,200,130,0.85)'); g.addColorStop(0.45, 'rgba(255,190,120,0)');
  path(); x.strokeStyle = g; x.lineWidth = 1.3; x.stroke();
  return c;
}

export function initBackdrop() {
  stars = Array.from({ length: 150 }, () => ({ x: rand(), y: rand(), r: rand() * 1.1 + 0.3, p: rand() * 6.28, s: 0.6 + rand() * 1.8 }));
  dust = Array.from({ length: 70 }, () => ({ a: rand() * 6.28, d: rand(), s: 0.3 + rand() * 0.7 }));
  rocks = Array.from({ length: 6 }, () => { const r = 4 + rand() * 9, pts = Array.from({ length: 7 }, () => 0.72 + rand() * 0.4); return { x: rand(), y: 0.12 + rand() * 0.8, r, v: 0.004 + rand() * 0.01, rot: rand() * 6.28, vr: (rand() - 0.5) * 0.4, d: 0.4 + rand() * 0.6, img: rockSprite(r, pts) }; });
}

function cover(img: HTMLImageElement | null, ox: number, oy: number, z: number) {
  const { W, H } = V;
  if (!img) { ctx.fillStyle = '#0a0e1c'; ctx.fillRect(0, 0, W, H); return { s: 1, x: 0, y: 0, w: W, h: H }; }
  const s = Math.max(W / img.width, H / img.height) * z, w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (W - w) / 2 + ox, (H - h) / 2 + oy, w, h);
  return { s, x: (W - w) / 2 + ox, y: (H - h) / 2 + oy, w, h };
}

export function drawBackdrop() {
  const { W, H } = V, { t, rdt, dt, px, py, now } = F, scrollOff = F.scroll;
  const par = G.on ? 0.6 : 1;
  const B = cover(A.bg, -px * 18 * par + Math.sin(t * 0.03) * W * 0.012, -py * 10 * par + scrollOff * 0.42, 1.07 + Math.sin(t * 0.05) * 0.008);
  scene.vp.y = B.y + scene.limb * B.h + H * 0.03;

  const sx = B.x + scene.sun.x * B.w, sunY = B.y + scene.sun.y * B.h;
  ctx.globalCompositeOperation = 'lighter';
  const pul = (0.85 + 0.15 * Math.sin(t * 0.7)) * (G.on ? 0.7 : 1);
  const g = ctx.createRadialGradient(sx, sunY, 0, sx, sunY, Math.max(W, H) * 0.5);
  g.addColorStop(0, `rgba(255,214,150,${0.22 * pul})`); g.addColorStop(0.25, `rgba(255,170,90,${0.07 * pul})`); g.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const limbY = B.y + scene.limb * B.h;
  for (const s of stars) { const yy = s.y * H + scrollOff * 0.42; if (yy > limbY - 10) continue; const a = (reduce ? 0.5 : 0.35 + 0.35 * Math.sin(t * s.s + s.p)) * (1 - clamp(yy / Math.max(limbY, 1) - 0.6) * 1.2); if (a <= 0) continue; ctx.fillStyle = `rgba(220,235,255,${a})`; ctx.fillRect(s.x * W - s.r, yy - s.r, s.r * 2, s.r * 2); }
  for (const st of sats) {
    if (!reduce) st.p = (st.p + st.v * rdt) % 1.2;
    const xx = (st.p - 0.1) * W, yy = st.y * H + Math.sin(st.p * 3) * H * 0.03 + scrollOff * 0.42;
    if (yy > limbY - 6) continue;
    const on = reduce || Math.floor(now / (st.warm ? 1150 : 800)) % 4 !== 0 ? 1 : 0.3;
    ctx.fillStyle = st.warm ? `rgba(255,217,168,${0.9 * on})` : `rgba(255,255,255,${0.9 * on})`; ctx.fillRect(xx - 1.2, yy - 1.2, 2.4, 2.4);
    sprite(st.warm ? SPR.amber : SPR.trail, xx, yy, 7, 0.6 * on);
  }
  if (!reduce || G.on) {
    const spd = G.on ? 0.9 * dt : 0.045 * rdt;
    for (const d of dust) {
      d.d += d.s * spd; if (d.d > 1) { d.d = 0; d.a = rand() * 6.28; }
      const e = Math.pow(d.d, 2.2), rx = scene.vp.x + Math.cos(d.a) * W * 0.9 * e, ry = scene.vp.y + Math.abs(Math.sin(d.a)) * H * 0.9 * e + H * 0.05 * e;
      const a = clamp(d.d * 2) * (1 - d.d) * 0.22;
      ctx.strokeStyle = `rgba(255,220,180,${a})`; ctx.lineWidth = 1 + e * (G.on ? 1.2 : 2);
      const tl = G.on ? 0.05 : 0.015, e2 = Math.pow(Math.max(d.d - tl, 0), 2.2);
      ctx.beginPath(); ctx.moveTo(scene.vp.x + Math.cos(d.a) * W * 0.9 * e2, scene.vp.y + Math.abs(Math.sin(d.a)) * H * 0.9 * e2 + H * 0.05 * e2); ctx.lineTo(rx, ry); ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = G.on ? 0.55 : 1;
  for (const r of rocks) {
    if (!reduce) { const k = G.card ? 0 : rdt; r.x += r.v * (G.on ? 2.5 : 1) * k; r.rot += r.vr * k; if (r.x > 1.08) { r.x = -0.08; r.y = 0.12 + rand() * 0.8; } }
    const xx = r.x * W - px * 30 * r.d, yy = r.y * H - py * 16 * r.d + scrollOff * (0.42 - r.d * 0.3), s2 = V.tall ? 0.8 : 1;
    ctx.save(); ctx.translate(xx, yy); ctx.rotate(r.rot); ctx.drawImage(r.img, -r.img.width / 2 * s2, -r.img.height / 2 * s2, r.img.width * s2, r.img.height * s2); ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (G.on) { ctx.fillStyle = 'rgba(4,6,13,0.16)'; ctx.fillRect(0, scene.vp.y - H * 0.1, W, H); }
}
