import { lf, reduce } from './state';
import { $, lerp, visible } from './util';

let osc: HTMLCanvasElement, octx: CanvasRenderingContext2D, oscAmp = 0.35, oscHot = 0, oscOnce = false;

export function initOsc() {
  osc = $<HTMLCanvasElement>('osc'); octx = osc.getContext('2d')!; addEventListener('resize', () => (oscOnce = false));
  $('sgMail').addEventListener('pointerenter', () => (oscHot = 1)); $('sgMail').addEventListener('pointerleave', () => (oscHot = 0));
}

function drawOsc(now: number) {
  const dpr = Math.min(devicePixelRatio, 2), w = osc.clientWidth, h = osc.clientHeight;
  if (osc.width !== Math.round(w * dpr)) { osc.width = Math.round(w * dpr); osc.height = Math.round(h * dpr); }
  octx.setTransform(dpr, 0, 0, dpr, 0, 0); octx.clearRect(0, 0, w, h);
  oscAmp = lerp(oscAmp, oscHot ? 1 : 0.32, lf(0.05)); const t = now / 1000;
  ([['rgba(143,211,255,.85)', 0, 1, 1.5], ['rgba(255,207,138,.45)', 1.7, 0.7, 1], ['rgba(143,211,255,.22)', 3.1, 1.35, 1]] as const).forEach(([c, ph, a, lw]) => {
    octx.beginPath();
    for (let x = 0; x <= w; x += 3) { const u = x / w, env = Math.pow(Math.sin(Math.PI * u), 1.6), y = h / 2 + env * oscAmp * h * 0.36 * a * (0.55 * Math.sin(u * 26 + t * 2.2 + ph) + 0.3 * Math.sin(u * 61 - t * 3.1 + ph * 2) + 0.15 * Math.sin(u * 7 + t * 0.7)); x ? octx.lineTo(x, y) : octx.moveTo(x, y); }
    octx.strokeStyle = c; octx.lineWidth = lw; octx.shadowColor = c; octx.shadowBlur = 10; octx.stroke();
  });
}

export function oscTick(now: number) { if (visible($('contact')) && (!reduce || !oscOnce)) { drawOsc(reduce ? 0 : now); oscOnce = reduce; } }
