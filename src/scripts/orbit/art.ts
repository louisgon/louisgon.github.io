import { A, ctx, mk, rand, rnd, ship, TAU, TILE, TYPES, V } from './core';

export type Spr = { c: HTMLCanvasElement; w: number; h: number; iw: number; ih: number; pad: number };
type Sprite = 'cyan' | 'trail' | 'amber' | 'core' | 'blast' | 'hit' | 'gold' | 'bolt' | 'star' | 'cache' | 'plume';
export const SPR = {} as Record<Sprite, HTMLCanvasElement>;
export const TX = {} as { streak: HTMLCanvasElement[]; soft: HTMLCanvasElement[]; pulse: HTMLCanvasElement; miss: HTMLCanvasElement; hive: HTMLCanvasElement; beamG: HTMLCanvasElement; beamC: HTMLCanvasElement; ringA: HTMLCanvasElement; ringG: HTMLCanvasElement; ringH: HTMLCanvasElement; shard: HTMLCanvasElement[]; cloud: HTMLCanvasElement };
export const S = { key: '', n: [] as Spr[], e: [] as Spr[], w: [] as Spr[], s: [] as Spr[], mini: null as HTMLCanvasElement | null, minig: null as HTMLCanvasElement | null, shipT: null as HTMLCanvasElement | null, shipS: null as Spr | null, gpat: null as CanvasPattern | null, cpat: null as CanvasPattern | null, gpot: 1 };

function glow(stops: [number, string][], size = 128) {
  const c = mk(size), x = c.getContext('2d')!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
}
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
  const g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, `rgba(${rgb},0.6)`); g.addColorStop(0.45, `rgba(${rgb},0.16)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s);
  x.beginPath(); x.moveTo(24, 9); x.lineTo(32.5, 24); x.lineTo(24, 39); x.lineTo(15.5, 24); x.closePath();
  const f = x.createLinearGradient(16, 9, 32, 39); f.addColorStop(0, '#ffffff'); f.addColorStop(0.42, `rgb(${hi})`); f.addColorStop(1, `rgb(${rgb})`);
  x.fillStyle = f; x.fill(); x.strokeStyle = 'rgba(10,6,4,0.55)'; x.lineWidth = 1.2; x.stroke();
  x.beginPath(); x.moveTo(24, 9); x.lineTo(24, 39); x.moveTo(15.5, 24); x.lineTo(32.5, 24); x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 0.8; x.stroke();
  return c;
}
function starTex() {
  const s = 48, c = mk(s), x = c.getContext('2d')!;
  x.drawImage(glow([[0, 'rgba(255,255,255,0.9)'], [0.25, 'rgba(200,240,255,0.35)'], [1, 'rgba(150,220,255,0)']], 48), 0, 0);
  x.globalCompositeOperation = 'lighter';
  for (const [sx, sy] of [[1, 0.09], [0.09, 1]]) { x.save(); x.translate(24, 24); x.scale(sx, sy); const g = x.createRadialGradient(0, 0, 0, 0, 0, 24); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(180,230,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 24, 0, TAU); x.fill(); x.restore(); }
  return c;
}
function cloudTex() {
  const s = 512, c = mk(s), x = c.getContext('2d')!;
  for (let i = 0; i < 9; i++) {
    const cx0 = rand() * s, cy0 = rand() * s, n = 3 + ((rand() * 4) | 0), a = rnd(0.3, 0.55);
    for (let k = 0; k < n; k++) {
      const cx = cx0 + rnd(-70, 70), cy = cy0 + rnd(-40, 40), r = rnd(40, 110);
      for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
        const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, `rgba(24,9,3,${a})`); g.addColorStop(0.55, `rgba(24,9,3,${a * 0.5})`); g.addColorStop(1, 'rgba(24,9,3,0)');
        x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
      }
    }
  }
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
function boltTex() {
  const s = 64, c = mk(s), x = c.getContext('2d')!;
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,120,79,0.6)'); g.addColorStop(1, 'rgba(255,90,50,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s);
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.2, 0, TAU); x.fillStyle = '#4a1206'; x.fill();
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.15, 0, TAU); x.fillStyle = '#ff784f'; x.fill();
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.07, 0, TAU); x.fillStyle = '#fff1e0'; x.fill(); return c;
}

export function initArt() {
  Object.assign(SPR, {
    cyan: glow([[0, 'rgba(235,252,255,0.95)'], [0.3, 'rgba(120,215,255,0.55)'], [1, 'rgba(60,150,255,0)']]),
    trail: glow([[0, 'rgba(140,220,255,0.5)'], [1, 'rgba(80,170,255,0)']]),
    amber: glow([[0, 'rgba(255,170,80,0.5)'], [1, 'rgba(255,150,60,0)']]),
    core: glow([[0, 'rgba(255,205,120,0.85)'], [0.35, 'rgba(255,140,50,0.35)'], [1, 'rgba(255,120,40,0)']]),
    blast: glow([[0, 'rgba(255,246,226,0.9)'], [0.14, 'rgba(255,214,150,0.6)'], [0.42, 'rgba(255,160,80,0.16)'], [1, 'rgba(255,140,60,0)']]),
    hit: glow([[0, 'rgba(230,250,255,0.95)'], [0.45, 'rgba(150,225,255,0.35)'], [1, 'rgba(120,215,255,0)']]),
    gold: glow([[0, 'rgba(255,250,235,1)'], [0.16, 'rgba(255,214,150,0.62)'], [0.45, 'rgba(255,180,90,0.16)'], [1, 'rgba(255,170,80,0)']]),
    bolt: boltTex(), star: starTex(), cache: cacheTex(), plume: plumeTex(),
  });
  Object.assign(TX, {
    streak: [streak('255,186,100'), streak('255,236,205'), streak('130,210,255'), streak('255,120,70')],
    soft: [SPR.trail, SPR.amber, SPR.star, SPR.cyan],
    pulse: capsule('110,200,255', '210,245,255'), miss: capsule('255,170,80', '255,236,200'), hive: capsule('255,200,120', '255,250,235'),
    beamG: beamTex('255,170,80', '255,236,200'), beamC: beamTex('255,176,90', '255,214,150', '255,238,205'),
    ringA: ringTex('255,170,90', 0.12, 0.03), ringG: ringTex('255,200,130', 0.1, 0.06), ringH: ringTex('110,200,255', 0.11, 0.06),
    shard: [shardTex('70,170,255', '190,236,255'), shardTex('90,220,240', '220,255,250'), shardTex('255,160,70', '255,232,180')],
    cloud: cloudTex(),
  });
}

function silhouette(img: CanvasImageSource, iw: number, ih: number, col: string) { const c = mk(iw, ih), x = c.getContext('2d')!; x.drawImage(img, 0, 0, iw, ih); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, iw, ih); return c; }
function topSprite(img: HTMLImageElement, outW: number, line: string, glowRGB = '', glowA = 0, tint = ''): Spr {
  const iw = Math.round(outW), ih = Math.round(img.height * outW / img.width), o = Math.max(1.4, outW / 80), pad = Math.ceil(glowA ? outW * 0.1 : o) + 3;
  const sil = silhouette(img, iw, ih, line), c = mk(iw + pad * 2, ih + pad * 2), x = c.getContext('2d')!;
  if (glowA) { x.shadowColor = `rgba(${glowRGB},${glowA})`; x.shadowBlur = pad * 0.8; x.drawImage(sil, pad, pad); x.drawImage(sil, pad, pad); x.shadowColor = 'transparent'; x.shadowBlur = 0; }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.drawImage(sil, pad + Math.cos(a) * o, pad + Math.sin(a) * o); }
  x.drawImage(img, pad, pad, iw, ih);
  if (tint) { const t = silhouette(img, iw, ih, tint); x.globalCompositeOperation = 'lighter'; x.drawImage(t, pad, pad); x.globalCompositeOperation = 'source-over'; }
  return { c, w: c.width, h: c.height, iw, ih, pad };
}
function shadeSprite(img: HTMLImageElement, outW: number): Spr {
  const s = 0.5, iw = Math.max(2, Math.round(outW * s)), ih = Math.max(2, Math.round(img.height * outW * s / img.width)), b = Math.max(2, iw * 0.05), pad = Math.ceil(b * 2.4), off = 5000;
  const sil = silhouette(img, iw, ih, '#000'), c = mk(iw + pad * 2, ih + pad * 2), x = c.getContext('2d')!;
  x.shadowColor = 'rgba(14,5,0,1)'; x.shadowBlur = b; x.shadowOffsetX = off; x.drawImage(sil, pad - off, pad);
  return { c, w: c.width / s, h: c.height / s, iw: iw / s, ih: ih / s, pad: pad / s };
}
function whiteSprite(img: HTMLImageElement, R: Spr): Spr {
  const c = mk(R.w, R.h), x = c.getContext('2d')!;
  x.drawImage(img, R.pad, R.pad, R.iw, R.ih); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffb27a'; x.fillRect(0, 0, R.w, R.h);
  return { ...R, c };
}

export function prepSprites() {
  if (!A.ready || !A.shipTop || !A.dunes) return;
  const { DPR, U, Z } = V, key = `${DPR}|${U.toFixed(2)}|${Z.toFixed(3)}`; if (key === S.key) return; S.key = key;
  TYPES.forEach((T, i) => {
    const img = A[T.img]!, outW = Math.min(img.width, Math.ceil(T.w * Math.max(U, 0.7) * 1.35 * DPR));
    S.n[i] = topSprite(img, outW, '#0b0603');
    S.e[i] = topSprite(img, outW, '#ffd08a', '255,190,100', 0.9, 'rgba(255,190,100,0.2)');
    S.w[i] = whiteSprite(img, S.n[i]);
    S.s[i] = shadeSprite(img, outW);
  });
  S.gpot = Math.min(2048, 1 << Math.ceil(Math.log2(TILE * U * Z * DPR)));
  const gc = mk(S.gpot), gx = gc.getContext('2d')!; gx.imageSmoothingQuality = 'high'; gx.drawImage(A.dunes, 0, 0, S.gpot, S.gpot); S.gpat = ctx.createPattern(gc, 'repeat');
  const tw = Math.min(A.shipTop.width, Math.ceil(ship.play * DPR * 1.3)), th = Math.round(tw * A.aspT);
  S.shipT = mk(tw, th); const st = S.shipT.getContext('2d')!; st.imageSmoothingQuality = 'high'; st.drawImage(A.shipTop, 0, 0, tw, th);
  S.shipS = shadeSprite(A.shipTop, Math.ceil(ship.play * DPR));
  const mw = Math.ceil(56 * Math.max(U, 0.7) * DPR), mh = Math.round(mw * A.aspT);
  S.mini = mk(mw, mh); const m = S.mini.getContext('2d')!; m.imageSmoothingQuality = 'high'; m.drawImage(A.shipTop, 0, 0, mw, mh);
  S.minig = mk(mw, mh); const g = S.minig.getContext('2d')!; g.drawImage(S.mini, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,186,96,0.42)'; g.fillRect(0, 0, mw, mh);
}
