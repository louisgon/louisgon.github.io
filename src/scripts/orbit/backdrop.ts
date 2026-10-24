import { reduce } from '../state';
import { A, C, CLOUDT, clamp, ctx, D, DV, F, G, rand, scene, screen, ship, sm, sprite, TAU, TILE, V, VP } from './core';
import { S, SPR, TX } from './art';

type Star = { x: number; y: number; r: number; p: number; s: number };
type Dust = { a: number; d: number; s: number };
type Rock = { x: number; y: number; r: number; v: number; rot: number; vr: number; d: number; img: HTMLCanvasElement };
type Mote = { x: number; y: number; s: number; l: number };
let stars: Star[] = [], dust: Dust[] = [], rocks: Rock[] = [], streaks: Dust[] = [], motes: Mote[] = [];
const sats = [{ p: 0.1, v: 0.012, y: 0.12, warm: false }, { p: 0.62, v: 0.008, y: 0.2, warm: true }];
const PM = new DOMMatrix();
let vg: CanvasGradient | null = null, vgK = '';

export function analyse(img: HTMLImageElement) {
  const c = document.createElement('canvas'), w = 96, h = Math.round(96 * img.height / img.width); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  let bx = 0, by = 0, bl = -1;
  for (let y = 0; y < h * 0.7; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4, l = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; if (l > bl) { bl = l; bx = i; by = y; } }
  let ly = Math.round(h * 0.3), prev = 0;
  for (let y = 2; y < h * 0.8; y++) { let s = 0; for (let i = Math.floor(w * 0.35); i < w * 0.65; i++) { const k = (y * w + i) * 4; s += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; } s /= w * 0.3; if (s - prev > 22 && y > h * 0.08) { ly = y; break; } prev = s; }
  return { sun: { x: bx / w, y: by / h }, limb: ly / h };
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
  streaks = Array.from({ length: 46 }, () => ({ a: rand() * TAU, d: rand(), s: 0.5 + rand() }));
  motes = Array.from({ length: 34 }, () => ({ x: rand(), y: rand(), s: 0.6 + rand() * 0.8, l: 0.6 + rand() * 0.8 }));
}

function cover(img: HTMLImageElement | null, ox: number, oy: number, z: number) {
  const { W, H } = V;
  if (!img) { ctx.fillStyle = '#0a0e1c'; ctx.fillRect(0, 0, W, H); return { s: 1, x: 0, y: 0, w: W, h: H }; }
  const s = Math.max(W / img.width, H / img.height) * z, w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (W - w) / 2 + ox, (H - h) / 2 + oy, w, h);
  return { s, x: (W - w) / 2 + ox, y: (H - h) / 2 + oy, w, h };
}

export function drawOrbit() {
  const { W, H, DPR } = V, { t, rdt, now } = F, px = G.px, py = G.py, scrollOff = F.scroll;
  const k = DV.k, fx0 = VP.rx, fy0 = VP.ry + H * 0.05, ox = fx0 * (1 - k), oy = fy0 * (1 - k) - DV.lift, OZ = DPR * k, fade = 1 - sm(0, 0.35, VP.p);
  ctx.setTransform(OZ, 0, 0, OZ, (ox + C.sx) * DPR, (oy + C.sy) * DPR);
  const B = cover(A.bg, -px * 18 + Math.sin(t * 0.03) * W * 0.012, -py * 10 + scrollOff * 0.42, 1.07 + Math.sin(t * 0.05) * 0.008);
  if (DV.zb > 0.02 && A.bg) {
    for (const [m, al] of [[1.035, 0.24], [1.075, 0.16]]) { const k2 = k * m; ctx.setTransform(DPR * k2, 0, 0, DPR * k2, (fx0 * (1 - k2) + C.sx) * DPR, (fy0 * (1 - k2) - DV.lift + C.sy) * DPR); ctx.globalAlpha = al * DV.zb; ctx.drawImage(A.bg, B.x, B.y, B.w, B.h); }
    ctx.globalAlpha = 1; ctx.setTransform(OZ, 0, 0, OZ, (ox + C.sx) * DPR, (oy + C.sy) * DPR);
  }
  scene.vp.y = B.y + scene.limb * B.h + H * 0.03;

  const sx = B.x + scene.sun.x * B.w, sunY = B.y + scene.sun.y * B.h;
  ctx.globalCompositeOperation = 'lighter';
  const pul = (0.85 + 0.15 * Math.sin(t * 0.7)) * (G.on ? 0.7 : 1) * fade;
  const g = ctx.createRadialGradient(sx, sunY, 0, sx, sunY, Math.max(W, H) * 0.5);
  g.addColorStop(0, `rgba(255,214,150,${0.22 * pul})`); g.addColorStop(0.25, `rgba(255,170,90,${0.07 * pul})`); g.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const limbY = B.y + scene.limb * B.h;
  for (const s of stars) { const yy = s.y * H + scrollOff * 0.42; if (yy > limbY - 10) continue; const a = (reduce ? 0.5 : 0.35 + 0.35 * Math.sin(t * s.s + s.p)) * (1 - clamp(yy / Math.max(limbY, 1) - 0.6) * 1.2) * fade; if (a <= 0) continue; ctx.fillStyle = `rgba(220,235,255,${a})`; ctx.fillRect(s.x * W - s.r, yy - s.r, s.r * 2, s.r * 2); }
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
  ctx.globalAlpha = (G.on ? 0.5 : 1) * fade;
  for (const r of rocks) {
    if (!reduce) { const k = G.card ? 0 : rdt; r.x += r.v * (G.on ? 2.5 : 1) * k; r.rot += r.vr * k; if (r.x > 1.08) { r.x = -0.08; r.y = 0.12 + rand() * 0.8; } }
    const xx = r.x * W - px * 30 * r.d, yy = r.y * H - py * 16 * r.d + scrollOff * (0.42 - r.d * 0.3), s2 = V.tall ? 0.8 : 1;
    ctx.save(); ctx.translate(xx, yy); ctx.rotate(r.rot); ctx.drawImage(r.img, -r.img.width / 2 * s2, -r.img.height / 2 * s2, r.img.width * s2, r.img.height * s2); ctx.restore();
  }
  ctx.globalAlpha = 1;
  screen();
  if (DV.dark > 0.003) { ctx.globalAlpha = DV.dark; ctx.fillStyle = '#04060d'; ctx.fillRect(-20, -20, W + 40, H + 40); ctx.globalAlpha = 1; }
}

export function drawGround(t: number) {
  const a = DV.ga, { W, H, DPR, U } = V, cv = D.cv; if (a <= 0.003 || !S.gpat || !S.cpat) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pat = (P: CanvasPattern, kk: number, ox: number, oy: number, al: number) => { PM.a = kk; PM.d = kk; PM.e = ox; PM.f = oy; P.setTransform(PM); ctx.globalAlpha = al; ctx.fillStyle = P; ctx.fillRect(0, 0, cv.width, cv.height); };
  const k = TILE * U * C.wz * DPR / S.gpot;
  pat(S.gpat, k, C.ox * DPR, C.oy * DPR, a);
  if (DV.zb > 0.05) for (const m of [1.03, 1.065]) pat(S.gpat, k * m, (DV.tx + C.sx + (C.ox - DV.tx - C.sx) * m) * DPR, (DV.ty + C.sy + (C.oy - DV.ty - C.sy) * m) * DPR, a * 0.22 * DV.zb);
  const q = 1.12, kc = CLOUDT * U * C.wz * DPR / TX.cloud.width;
  pat(S.cpat, kc, (DV.tx - ship.x * C.wz * q + t * 16 * U * C.wz + C.sx) * DPR, (DV.ty - ship.y * C.wz * q + t * 6 * U * C.wz + C.sy) * DPR, a * 0.55);
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(4,6,13,0.22)'; ctx.fillRect(0, 0, cv.width, cv.height);
  const vk = `${cv.width},${cv.height}`;
  if (vk !== vgK || !vg) { vgK = vk; const cx = cv.width / 2, cy = cv.height / 2, r = Math.hypot(cx, cy); vg = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r); vg.addColorStop(0, 'rgba(4,6,13,0)'); vg.addColorStop(0.5, 'rgba(4,6,13,0.26)'); vg.addColorStop(1, 'rgba(4,6,13,0.7)'); }
  ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const spx = W + 80, spy = H + 80, par = 1.5 * C.wz, vxs = 40 * U - ship.vx * par, vys = 14 * U - ship.vy * par, vs = Math.hypot(vxs, vys) || 1, nx = vxs / vs, ny = vys / vs;
  ctx.strokeStyle = 'rgb(255,214,170)'; ctx.globalAlpha = a * 0.16; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.beginPath();
  for (const m of motes) {
    let x = (m.x * spx + t * 40 * U * m.s - ship.x * par) % spx; if (x < 0) x += spx;
    let y = (m.y * spy + t * 14 * U * m.s - ship.y * par) % spy; if (y < 0) y += spy;
    x -= 40; y -= 40; const L = (2 + vs * 0.02) * m.l * U;
    ctx.moveTo(x, y); ctx.lineTo(x - nx * L, y - ny * L);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}

export function drawStreaks(rdt: number) {
  if (reduce || DV.zb < 0.01) return;
  const { W, H, DPR, U } = V, R = Math.hypot(W, H) * 0.72, cx = DV.tx, cy = DV.ty, sp = rdt * 1.4 * (VP.dir < 0 ? -1 : 1), tex = TX.streak[1];
  ctx.globalCompositeOperation = 'lighter';
  for (const s of streaks) {
    s.d += s.s * sp; if (s.d > 1) { s.d -= 1; s.a = rand() * TAU; } else if (s.d < 0) { s.d += 1; s.a = rand() * TAU; }
    const r = (0.16 + s.d * s.d) * R, len = r * (0.22 + 0.3 * DV.zb), th = (2 + s.d * 5) * U, c = Math.cos(s.a), sn = Math.sin(s.a);
    ctx.globalAlpha = DV.zb * 0.42 * clamp(s.d * 3) * (1 - s.d * 0.5);
    ctx.setTransform(c * DPR, sn * DPR, -sn * DPR, c * DPR, (cx + c * r + C.sx) * DPR, (cy + sn * r + C.sy) * DPR);
    ctx.drawImage(tex, -len / 2, -th / 2, len, th);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; screen();
}
