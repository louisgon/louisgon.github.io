import { reduce } from '../state';
import { A, C, cam, clamp, ctx, D, DV, F, G, rand, scene, screen, ship, sm, sprite, TAU, V, VP } from './core';
import { S, SPR, TX } from './art';

type Star = { x: number; y: number; r: number; p: number; s: number };
type Dust = { a: number; d: number; s: number };
type Rock = { x: number; y: number; r: number; v: number; rot: number; vr: number; d: number; img: HTMLCanvasElement };
type Mote = { x: number; y: number; s: number; l: number };
type Twinkle = { x: number; y: number; r: number; p: number; s: number };
let stars: Star[] = [], dust: Dust[] = [], rocks: Rock[] = [], streaks: Dust[] = [], motes: Mote[] = [], twinkles: Twinkle[] = [];
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
  streaks = Array.from({ length: 54 }, () => ({ a: rand(), d: rand(), s: 0.5 + rand() }));
  motes = Array.from({ length: 34 }, () => ({ x: rand(), y: rand(), s: 0.6 + rand() * 0.8, l: 0.6 + rand() * 0.8 }));
  twinkles = Array.from({ length: 26 }, () => ({ x: rand(), y: rand(), r: 2.2 + rand() * 2.6, p: rand() * TAU, s: 0.5 + rand() * 1.1 }));
}

const FEATHER = 16;
function cover(img: HTMLImageElement | null, ox: number, oy: number, z: number, fk = 0) {
  const { W, H } = V;
  if (!img) { ctx.fillStyle = '#0a0e1c'; ctx.fillRect(0, 0, W, H); return { s: 1, x: 0, y: 0, w: W, h: H }; }
  const s = Math.max(W / img.width, H / img.height) * z, w = img.width * s, h = img.height * s, x = (W - w) / 2 + ox, y = (H - h) / 2 + oy;
  if (fk <= 0) ctx.drawImage(img, x, y, w, h);
  else {
    const a0 = ctx.globalAlpha, band = 0.13, nw = img.naturalWidth, nh = img.naturalHeight, sb = nh * band / FEATHER, db = h * band / FEATHER;
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
  place(0); ctx.globalAlpha = DV.ba;
  const B = cover(A.bg, bx, by, bz, DV.fk);
  if (DV.zb > 0.02 && A.bg) { for (const [m, al] of [[0.035, 0.22], [0.08, 0.12]]) { place(H * m * DV.zb * (VP.dir < 0 ? -1 : 1)); ctx.globalAlpha = al * DV.zb * DV.ba; cover(A.bg, bx, by, bz, DV.fk); } place(0); }
  ctx.globalAlpha = 1;
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
}

export function drawSpace(t: number, a: number) {
  const { W, H, DPR, U, Z } = V, cv = D.cv; if (a <= 0.003 || !S.neb) return;
  const zk = C.wz / Z, lift = (DV.th - 1) * H * 1.75;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pat = (L: { pat: CanvasPattern; size: number; k: number }, dev: number) => {
    const k = L.k, z = 1 + (zk - 1) * k, sc = dev * z / L.size, cx = W / 2 * DPR, cy = H / 2 * DPR;
    PM.a = sc; PM.d = sc; PM.e = cx + (C.sx - cam.x * k * C.wz) * DPR * z; PM.f = cy + (C.sy - cam.y * k * C.wz + lift * (0.55 + 0.45 * k)) * DPR * z;
    L.pat.setTransform(PM); ctx.fillStyle = L.pat; ctx.fillRect(0, 0, cv.width, cv.height);
  };
  ctx.globalAlpha = a;
  pat(S.neb, Math.max(S.neb.size, Math.max(W, H) * 1.1 * DPR));
  for (const L of S.stars) pat(L, L.size);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  const tw = W + 120, th = H + 120;
  for (const s of twinkles) {
    let x = (s.x * tw - cam.x * 0.75 * C.wz) % tw; if (x < 0) x += tw;
    let y = (s.y * th - cam.y * 0.75 * C.wz + lift * 0.89) % th; if (y < 0) y += th;
    const k = reduce ? 0.5 : Math.max(0, Math.sin(t * s.s + s.p)); if (k < 0.04) continue;
    sprite(SPR.star, x - 60 + C.sx, y - 60 + C.sy, s.r * U, a * 0.55 * k * k);
  }
  ctx.globalCompositeOperation = 'source-over';
  const vk = `${cv.width},${cv.height}`;
  if (vk !== vgK || !vg) { vgK = vk; const cx = cv.width / 2, cy = cv.height / 2, r = Math.hypot(cx, cy); vg = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r); vg.addColorStop(0, 'rgba(2,3,8,0)'); vg.addColorStop(0.55, 'rgba(2,3,8,0.22)'); vg.addColorStop(1, 'rgba(2,3,8,0.62)'); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const spx = W + 80, spy = H + 80, par = 1.5 * C.wz, vxs = 18 * U - ship.vx * par, vys = 8 * U - ship.vy * par, vs = Math.hypot(vxs, vys) || 1, nx = vxs / vs, ny = vys / vs;
  ctx.strokeStyle = 'rgb(206,224,255)'; ctx.globalAlpha = a * 0.13; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.beginPath();
  for (const m of motes) {
    let x = (m.x * spx + t * 18 * U * m.s - ship.x * par) % spx; if (x < 0) x += spx;
    let y = (m.y * spy + t * 8 * U * m.s - ship.y * par + lift * 1.3) % spy; if (y < 0) y += spy;
    x -= 40; y -= 40; const L = (1.5 + vs * 0.02) * m.l * U;
    ctx.moveTo(x, y); ctx.lineTo(x - nx * L, y - ny * L);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}

export function drawStreaks(rdt: number) {
  if (reduce || DV.zb < 0.01) return;
  const { W, H, DPR, U } = V, vx = W * 0.5, vy = -H * 1.6, R = Math.hypot(W, H * 2.6), spread = Math.atan(W / (4.2 * H)) * 2.6, sp = rdt * 1.5 * (VP.dir < 0 ? -1 : 1), tex = TX.dust;
  ctx.globalCompositeOperation = 'lighter';
  for (const s of streaks) {
    s.d += s.s * sp * DV.zb; if (s.d > 1) { s.d -= 1; s.a = rand(); } else if (s.d < 0) { s.d += 1; s.a = rand(); }
    const ang = Math.PI / 2 + (s.a - 0.5) * spread, c = Math.cos(ang), sn = Math.sin(ang), r = R * (0.52 + s.d * 0.62), len = (60 + 260 * DV.zb * s.s) * U, th = (1.4 + s.s * 2) * U;
    ctx.globalAlpha = DV.zb * 0.5 * clamp(s.d * 4) * clamp((1 - s.d) * 4);
    ctx.setTransform(c * DPR, sn * DPR, -sn * DPR, c * DPR, (vx + c * r + C.sx) * DPR, (vy + sn * r + C.sy) * DPR);
    ctx.drawImage(tex, -len / 2, -th / 2, len, th);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; screen();
}
