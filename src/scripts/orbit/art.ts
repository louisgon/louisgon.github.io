import { A, mk, rs, TAU } from './core';

type Sprite = 'cyan' | 'trail' | 'amber' | 'blast' | 'hit' | 'gold' | 'star' | 'cache' | 'plume' | 'smoke';
export const SPR = {} as Record<Sprite, HTMLCanvasElement>;

export function glow(stops: [number, string][], size = 128) {
  const c = mk(size), x = c.getContext('2d')!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
}
export function starTex() {
  const s = 48, c = mk(s), x = c.getContext('2d')!;
  x.drawImage(glow([[0, 'rgba(255,255,255,0.9)'], [0.25, 'rgba(200,240,255,0.35)'], [1, 'rgba(150,220,255,0)']], 48), 0, 0);
  x.globalCompositeOperation = 'lighter';
  for (const [sx, sy] of [[1, 0.09], [0.09, 1]]) { x.save(); x.translate(24, 24); x.scale(sx, sy); const g = x.createRadialGradient(0, 0, 0, 0, 0, 24); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(180,230,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 24, 0, TAU); x.fill(); x.restore(); }
  return c;
}
export const ember = (rgb: string) => glow([[0, `rgba(${rgb},0.5)`], [1, `rgba(${rgb},0)`]]);

export function initArt() {
  Object.assign(SPR, {
    cyan: glow([[0, 'rgba(235,252,255,0.95)'], [0.3, 'rgba(120,215,255,0.55)'], [1, 'rgba(60,150,255,0)']]),
    trail: glow([[0, 'rgba(140,220,255,0.5)'], [1, 'rgba(80,170,255,0)']]),
    amber: ember('255,170,80'),
    star: starTex(),
  });
}

export const LIT = { shade: null as HTMLCanvasElement | null, light: null as HTMLCanvasElement | null, spill: null as HTMLCanvasElement | null, key: '' };
export function prepLight(dx: number, dy: number, px: number) {
  const img = A.ship; if (!img) return;
  const w = Math.min(img.naturalWidth, Math.ceil(px)), h = Math.round(w * img.naturalHeight / img.naturalWidth), d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const key = `${w}|${Math.round(Math.atan2(uy, ux) * 20)}`; if (key === LIT.key) return; LIT.key = key;
  const sil = (c: HTMLCanvasElement, x: CanvasRenderingContext2D, ox = 0, oy = 0) => { x.drawImage(img, ox, oy, c.width, c.height); };
  const shade = mk(w, h), s = shade.getContext('2d')!; sil(shade, s);
  const g = s.createLinearGradient(w / 2 + ux * w * 0.22, h / 2 + uy * h * 0.6, w / 2 - ux * w * 0.22, h / 2 - uy * h * 0.6);
  g.addColorStop(0, 'rgb(240,236,230)'); g.addColorStop(0.42, 'rgb(222,224,234)'); g.addColorStop(1, 'rgb(150,166,204)');
  s.globalCompositeOperation = 'source-in'; s.fillStyle = g; s.fillRect(0, 0, w, h);
  const light = mk(w, h), l = light.getContext('2d')!, band = mk(w, h), b = band.getContext('2d')!, k = w / 1000;
  l.globalCompositeOperation = 'lighter';
  for (const [o, a] of [[1.4, 0.85], [3, 0.45], [6, 0.22], [11, 0.1]]) {
    b.globalCompositeOperation = 'copy'; sil(band, b); b.globalCompositeOperation = 'destination-out'; sil(band, b, -ux * o * k, -uy * o * k);
    l.globalAlpha = a; l.drawImage(band, 0, 0);
  }
  l.globalAlpha = 1; l.globalCompositeOperation = 'source-in'; l.fillStyle = 'rgb(255,188,116)'; l.fillRect(0, 0, w, h);
  b.globalCompositeOperation = 'copy'; sil(band, b); b.globalCompositeOperation = 'source-in';
  const wg = b.createLinearGradient(w / 2 + ux * w * 0.22, h / 2 + uy * h * 0.6, w / 2 - ux * w * 0.22, h / 2 - uy * h * 0.6); wg.addColorStop(0, 'rgba(255,176,104,0.2)'); wg.addColorStop(0.4, 'rgba(255,176,104,0)');
  b.fillStyle = wg; b.fillRect(0, 0, w, h); l.globalCompositeOperation = 'lighter'; l.drawImage(band, 0, 0);
  l.globalCompositeOperation = 'destination-over'; b.globalCompositeOperation = 'copy'; sil(band, b); b.globalCompositeOperation = 'source-in'; b.fillStyle = 'rgba(255,170,110,0.07)'; b.fillRect(0, 0, w, h); l.drawImage(band, 0, 0);
  const spill = mk(w, h), p = spill.getContext('2d')!; p.globalCompositeOperation = 'lighter';
  for (const n of rs.noz) { const cx = n[0] * w, cy = n[1] * h, r = w * 0.17, q = p.createRadialGradient(cx, cy, 0, cx, cy, r); q.addColorStop(0, 'rgba(150,225,255,0.9)'); q.addColorStop(0.35, 'rgba(90,190,255,0.35)'); q.addColorStop(1, 'rgba(60,150,255,0)'); p.fillStyle = q; p.fillRect(0, 0, w, h); }
  p.globalCompositeOperation = 'destination-in'; sil(spill, p);
  Object.assign(LIT, { shade, light, spill });
}
