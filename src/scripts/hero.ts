import * as THREE from 'three';
import { DATA } from './data';
import { HI, reduce, S, ez } from './state';
import { $, clamp, mob, out, sstep } from './util';
import { LAYF, LAYV, SUNF } from './shaders';
import { dimS } from './stars';
import probe from './avif-probe.txt?raw';

type Uniforms = { uT: { value: number }; uA: { value: number }; uG: { value: number }; uB: { value: number }; uF: { value: number }; uTex?: { value: THREE.Texture } };
type Layer = { k: string; z: number; u: Uniforms; m: THREE.Mesh; sun: boolean };

export let orbK = 0, skyO = 1;
let orbG = 1, caseS = 0, lyLeft = 4;
const HB = { w: 1, h: 1, x: 0 };
export const VH = () => Math.max(innerHeight, $('lvh').offsetHeight);
export const heroEnd = () => $('hero').offsetHeight * 0.85;
let hbox: HTMLElement, STAGE: HTMLElement;

export function layoutHero() { const ar = 16 / 9, w = innerWidth, h = VH(); let bw = Math.max(w, h * ar), bh = bw / ar; if (mob()) { bh = h; bw = h * ar; } HB.x = w < h ? -0.12 * bw : 0; Object.assign(hbox.style, { width: `${bw}px`, height: `${bh}px`, marginLeft: `${-bw / 2 + HB.x}px`, marginTop: `${-bh / 2}px` });
  HB.w = bw; HB.h = bh; }

export function initHero() { hbox = $('hbox'); STAGE = $('hero').querySelector<HTMLElement>('.stage')!; }

export const probeAvif = () => new Promise<boolean>((r) => { const i = new Image(); i.onload = () => r(i.width === 1); i.onerror = () => r(false); i.src = probe.trim(); });

export let lyBack: THREE.Scene, lyFront: THREE.Scene;
const LYR: Layer[] = [], LYB: Record<string, { s: number; x: number; y: number }> = {}, SUNP = [0.8953, 0.1794], SHIP = { c: [2218, 1143], e: [2070, 1226], n: [[1914, 1161], [2225, 1292]] }, PLUME = [-0.902, -0.431];
const HS = { y: 0, g: 0.06, a: 1 }, HLT = { far: [0, 0, 1, 1], ship: [0, 0, 1, 0, 1] };
const PLX = [0.75, 0.04, 0.5, 1], LYX: Record<string, number[]> = { far: PLX, cloud: PLX };
const SPR = { x: 0, y: 0, vx: 0, vy: 0 }; let SHP = { cx: 0, cy: 0, s: 1, th: 0, fade: 0, thr: 1, burn: 0, go: 0 };

export function initLayers(AV: boolean) {
  lyBack = new THREE.Scene(); lyFront = new THREE.Scene();
  const lyTex = (src: string) => { const t = new THREE.Texture(), i = new Image(); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    i.onload = () => { if (mob()) { const c = document.createElement('canvas'); c.width = 2048; c.height = 1152; const x = c.getContext('2d')!; x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, c.width, c.height); t.image = c; } else t.image = i; t.needsUpdate = true; lyLeft--; }; i.src = src; return t; };
  ([['sky', 0.08, { FEATHER: '' }], ['halo', 0.42], ['far', 0.42, { CITY: '', FEATHER: '' }], ['cloud', 0.42, { DRIFT: '', FEATHER: '' }], ['core', 0.42], ['plume0', 1], ['plume1', 1], ['ship', 1, { ENGINE: '' }], ['jet', 1]] as [string, number, Record<string, string>?][]).forEach(([k, z, defs], i) => {
    const sun = !defs, u: Uniforms = { uT: { value: 0 }, uA: { value: 0 }, uG: { value: 0 }, uB: { value: 1 }, uF: { value: 0.06 } }; if (!sun) { const l = DATA.layers[k as keyof typeof DATA.layers]; u.uTex = { value: lyTex(AV ? l.avif : l.webp) }; }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: u, defines: sun ? (k === 'core' ? { CORE: '' } : k === 'jet' ? { JET: '' } : k.startsWith('plume') ? { PLUME: '' } : {}) : defs, vertexShader: LAYV, fragmentShader: sun ? SUNF : LAYF, transparent: true, premultipliedAlpha: !sun, blending: sun ? THREE.AdditiveBlending : THREE.NormalBlending, depthTest: false, depthWrite: false }));
    m.renderOrder = i; m.frustumCulled = false; (i < 2 ? lyBack : lyFront).add(m); LYR.push({ k, z, u, m, sun });
  });
}

function shipState(W: number, H: number, p: number, t: number) {
  const k = innerWidth < innerHeight ? 0.56 : 1, port = k < 1, dt = Math.min(S.DT || 1 / 60, 1 / 30), still = reduce || port, gx = still ? 0 : (S.mx - 0.5) * 46, gy = still ? 0 : (0.5 - S.my) * 26;
  SPR.vx += ((gx - SPR.x) * 26 - SPR.vx * 7.5) * dt; SPR.vy += ((gy - SPR.y) * 26 - SPR.vy * 7.5) * dt; SPR.x += SPR.vx * dt; SPR.y += SPR.vy * dt;
  const a = reduce || HI.ship < 0 ? 1 : HI.ship ? 1 - Math.pow(1 - clamp((performance.now() - HI.ship) / 2200), 3) : 0, ia = 1 - a, go = sstep(0.02, 0.36, p), pre = sstep(0, 0.05, p) * (1 - sstep(0.05, 0.14, p));
  const f = 1 - sstep(0, 0.5, p), tx = (S.smx - 0.5) * -24 * f + Math.sin(t / 9 + 1) * 3 * f, ty = (S.smy - 0.5) * -14 * f + Math.sin(t / 7 + 2) * 1.6 * f;
  const sx = (SHIP.c[0] / 3200 - 0.5) * W, sy = -(SHIP.c[1] / 1800 - 0.5) * H, s = 1.03 * k * (1 + 0.9 * ia) * (1 - 0.85 * go) * (1 + 0.02 * pre);
  const dx = Math.sin(t * 0.37) * 7 + Math.sin(t * 0.83 + 1.3) * 3, dy = Math.sin(t * 0.61) * 6 + Math.sin(t * 1.13 + 0.4) * 2;
  let cx = HB.x + sx * 1.03 + tx * 1.4, cy = sy * 1.03 - ty * 1.4;
  if (port) { cx = innerWidth * 0.01 + tx; cy = -innerHeight * 0.1 - ty; }
  cx += SPR.x + dx * k - ia * W * 0.42 * k;
  cy += SPR.y + dy * k - ia * H * 0.42 * k - pre * 8 + scrollY * PLX[0];
  { const e = Math.pow(go, 1.6), sc = 1.03 + sstep(0, 1, p) * PLX[1], aimX = Math.min(HB.x + (SUNP[0] - 0.5) * W * sc, innerWidth * 0.4), aimY = Math.min(scrollY * PLX[0] - (SUNP[1] - 0.5) * H * sc, innerHeight * 0.4); cx += (aimX - cx) * e; cy += (aimY - cy) * e; }
  SHP = { cx, cy, s, th: -SPR.vx * 0.0011 + Math.sin(t * 0.61 + 1.1) * 0.012 + ia * 0.12 + go * 0.08, fade: (1 - sstep(0.26, 0.38, p)) * Math.min(1, a * 2.5), thr: 1 + clamp(Math.hypot(SPR.vx, SPR.vy) / 240) * 0.5 + go * 1.8 + ia * 0.8, burn: Math.max(go * 1.1, a > 0 ? ia * 0.9 : 0), go };
}

function placeShip(L: Layer, W: number, H: number, tl: number) {
  const { cx, cy, s, th, fade, thr, burn } = SHP, co = Math.cos(th), si = Math.sin(th), rot = (x: number, y: number) => [x * co - y * si, x * si + y * co], sx = (SHIP.c[0] / 3200 - 0.5) * W, sy = -(SHIP.c[1] / 1800 - 0.5) * H;
  const at = (q: number[]) => { const v = rot(((q[0] / 3200 - 0.5) * W - sx) * s, (-(q[1] / 1800 - 0.5) * H - sy) * s); return [cx + v[0], cy + v[1]]; };
  if (L.k === 'ship') { const v = rot(-sx * s, -sy * s); L.m.position.set(cx + v[0], cy + v[1], 0); L.m.scale.set(W * s, H * s, 1); L.m.rotation.z = th; HLT.ship = [cx, -cy, s, th, fade]; L.u.uA.value = fade * orbK; }
  else if (L.k === 'jet') { const [x, y] = at(SHIP.e), z = W * 0.11 * s * (0.85 + 0.15 * thr); L.m.position.set(x, y, 0); L.m.scale.set(z, z, 1); L.u.uA.value = fade * orbK * (0.45 + 0.35 * thr); }
  else { const i = +L.k[5], [x, y] = at(SHIP.n[i]), d = rot(PLUME[0], PLUME[1]), len = W * s * (0.06 + 0.18 * burn) * (1 + 0.04 * Math.sin(tl * 29 + i * 2)), wd = W * s * 0.05 * (1 + 0.35 * burn);
    L.m.position.set(x + d[0] * len / 2, y + d[1] * len / 2, 0); L.m.scale.set(len, wd, 1); L.m.rotation.z = Math.atan2(d[1], d[0]); L.u.uA.value = fade * orbK * (0.6 + 0.4 * burn); }
  L.u.uT.value = tl; if (L.u.uG) L.u.uG.value = HS.g; }

function placeLayers(p: number, t: number, tl: number) { const W = HB.w, H = HB.h, ox = (S.smx - 0.5) * -2, oy = (S.smy - 0.5) * -2, f = 1 - sstep(0, 0.5, p), fz = 0.06 + 0.5 * sstep(0, 0.45, p);
  shipState(W, H, p, t);
  for (const L of LYR) { const b = LYB[L.k] || { s: 1, x: 0, y: 0 }, x = LYX[L.sun ? 'far' : L.k], z = x ? 0.5 + (L.z - 0.5) * 0.08 : L.z, ph = x ? 0.5 : L.z;
    let tx = ox * 12 * z * f + Math.sin(t / 9 + ph) * 3 * z * f, ty = oy * 7 * z * f + Math.sin(t / 7 + ph * 2) * 1.6 * z * f, sc = 1.03, fade;
    if (x) { ty -= scrollY * x[0]; sc += sstep(0, 1, p) * x[1]; fade = 1 - sstep(x[2], x[3], p); }
    else { ty -= scrollY * 0.35; fade = 1 - sstep(0.5, 1, p); }
    if (L.k === 'ship' || L.k === 'jet' || L.k.startsWith('plume')) { placeShip(L, W, H, tl); continue; }
    sc *= b.s * (reduce ? 1 : 1 + 0.035 * (1 - HI.planet)); if (L.k !== 'sky') ty += HS.y * H; L.u.uG.value = HS.g; L.u.uF.value = fz; if (L.k === 'far') HLT.far = [tx + b.x * W, ty + b.y * H, sc, fade];
    if (L.sun) { const s = W * (L.k === 'core' ? 0.8 : 0.5); L.m.position.set(HB.x + tx + (SUNP[0] - 0.5) * W * sc, -(ty + (SUNP[1] - 0.5) * H * sc), 0); L.m.scale.set(s, s, 1); }
    else { L.m.position.set(HB.x + tx + b.x * W, -(ty + b.y * H), 0); L.m.scale.set(W * sc, H * sc, 1); }
    L.u.uT.value = tl; L.u.uA.value = fade * orbK * (L.k === 'sky' ? 1 : HS.a) * (L.sun ? 1 + 0.32 * SHP.go : 1); }
  return 1 - sstep(0.5, 1, p); }

export function heroIn(now: number) {
  if (HI.done) return; const t = now - HI.t0, b = document.body.classList;
  if (!HI.pt && lyLeft <= 0) HI.pt = HI.skip ? now : Math.max(now, HI.t0 + 450);
  if (HI.skip) { HI.space = HI.cue = clamp(t / 400); HI.planet = HI.pt ? clamp((now - HI.pt) / 400) : 0; if (!HI.copy) { HI.copy = now; b.add('hv-in'); b.remove('hi-nav', 'hi-main'); } if (HI.space >= 1 && HI.planet >= 1) HI.done = true; return; }
  HI.space = reduce ? clamp(t / 500) : out(clamp(t / 800));
  HI.planet = HI.pt ? (reduce ? clamp((now - HI.pt) / 600) : out(clamp((now - HI.pt) / 1400))) : 0;
  if (!HI.ship && HI.pt && now >= HI.pt + 900) HI.ship = HI.pt + 900;
  if (!HI.copy) { b.remove('hi-main'); const at = HI.ff ? now : Math.min(HI.ship ? HI.ship + 1000 : Infinity, HI.t0 + 3500); if (now >= at - 200) b.remove('hi-nav'); if (now >= at) { HI.copy = now; b.add('hv-in'); } }
  if (HI.copy) HI.cue = reduce ? 1 : out(clamp((now - HI.copy - 900) / 700));
  if (HI.copy && HI.cue >= 1 && HI.planet >= 1 && HI.space >= 1) HI.done = true; }

export function heroCopyTick(hp: number) {
  const vis = (v: number) => `${v > 0.001 ? 'visible' : 'hidden'}`;
  const o1 = 1 - sstep(0.06, 0.32, hp), o3 = (1 - sstep(0, 0.08, hp)) * HI.cue, hv = $('hv');
  hv.style.opacity = String(o1); hv.style.visibility = S.zone === 'hero' ? 'visible' : vis(o1); if (hv.inert !== o1 < 0.05) hv.inert = o1 < 0.05; hv.style.setProperty('--hy', `${(-Math.min(scrollY, innerHeight * 1.2)).toFixed(1)}px`); { const so = 1 - sstep(0.32, 0.5, hp); STAGE.style.opacity = so.toFixed(3); STAGE.style.visibility = vis(so); }
  $('cue').style.opacity = String(o3); $('cue').style.visibility = vis(o3);
}

export function heroLayersTick(hp: number, now: number) {
  caseS = ez(caseS, $('case').classList.contains('on') ? 1 : 0, 5, 3);
  orbG = ez(orbG, S.zone === 'hero' ? clamp(1 - Math.max(dimS * 1.6, caseS)) : 0, 3, 6); orbK = orbG * HI.planet;
  $('orb').style.opacity = orbK.toFixed(3);
  if (orbK > 0.001) {
    const p = hp, t = reduce ? 0 : now / 1000;
    skyO = placeLayers(p, t, t);
    { const on = document.body.classList.contains('hv-in') ? orbK : 0, hud = 1 - sstep(0.03, 0.18, p), fv = HLT.far, el = hbox.querySelector<SVGElement>('.hl-far')!; el.style.transform = `translate3d(${fv[0].toFixed(1)}px, ${fv[1].toFixed(1)}px, 0) scale3d(${fv[2].toFixed(4)}, ${fv[2].toFixed(4)}, 1)`; el.style.opacity = (fv[3] * on * hud).toFixed(3);
      const sv = HLT.ship, se = hbox.querySelector<SVGElement>('.hl-ship')!, hb = hbox.getBoundingClientRect(), px = (SHIP.c[0] / 3200) * hb.width + hb.left, py = (SHIP.c[1] / 1800) * hb.height + hb.top; se.style.transform = `translate3d(${(innerWidth / 2 + sv[0] - px).toFixed(1)}px, ${(innerHeight / 2 + sv[1] - py).toFixed(1)}px, 0) rotate3d(0, 0, 1, ${(-sv[3]).toFixed(4)}rad) scale3d(${sv[2].toFixed(4)}, ${sv[2].toFixed(4)}, 1)`; se.style.opacity = (sv[4] * on * hud).toFixed(3); }
  }
}
