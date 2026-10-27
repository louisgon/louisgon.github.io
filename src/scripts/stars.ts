import * as THREE from 'three';
import { S, TR, ez, lf } from './state';
import { $, clamp, lerp, mob, nextTask, sstep } from './util';
import { BLIT_FRAG, BLIT_VERT, NEBULA_FRAG, QUAD_VERT, STAR_LINE_FRAG, STAR_POINT_FRAG, STAR_VERT } from './shaders';
import { landY, lenis } from './scroll';
import { starVis } from './orbit';
import { secCur } from './nav';

export let warpS = 0, dimS = 0;
let renderer: THREE.WebGLRenderer, DPR: number, scene: THREE.Scene, camera: THREE.PerspectiveCamera;
let bgScene: THREE.Scene, bgCam: THREE.OrthographicCamera, bgRT: THREE.WebGLRenderTarget, blitScene: THREE.Scene;
let z = 0, blank = false, cruiseS = 0, velS = 0, flyS = 0, streamS = 1, fadeS = 0.6, blackS = 0, ftAvg = 16, appear0 = -1e9;
const DEPTH = 300, BGS = 0.34;
const U = { uTime: { value: 0 }, uZ: { value: 0 }, uStretch: { value: 0 }, uFade: { value: 0.6 }, uDepth: { value: DEPTH }, uPR: { value: 1 }, uDisc: { value: new THREE.Vector3(0, 0, 0) } };
const W = { hue: new THREE.Vector3(0.25, 0.45, 1.0), neb: 1 };
const bgU = { uRes: { value: new THREE.Vector2(1, 1) }, uT: { value: 0 }, uHue: { value: W.hue }, uNeb: { value: 1 }, uDim: { value: 0 } };
const blitU = { uTex: { value: null as THREE.Texture | null }, uA: { value: 1 }, uT: { value: 0 } };
const HUES: Record<string, number[]> = { hero: [0.25, 0.45, 1.0], intro: [0.22, 0.4, 0.95], stack: [0.18, 0.5, 1.0], work: [0.45, 0.32, 0.95], clients: [0.4, 0.35, 0.9], pilot: [0.85, 0.5, 0.35], contact: [0.2, 0.55, 0.95] };

export async function initStars() {
  const canvas = $<HTMLCanvasElement>('stars');
  await nextTask();
  canvas.getContext('webgl2', { alpha: true, depth: true, stencil: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
  await nextTask();
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  DPR = Math.min(devicePixelRatio, 1.5); renderer.setPixelRatio(DPR); renderer.setClearColor(0x03050b, 1); renderer.autoClear = false;
  await nextTask();
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  const N = mob() ? 1500 : 3000, sp = new Float32Array(N * 3), sz = new Float32Array(N), lp = new Float32Array(N * 6), tl = new Float32Array(N * 2), lsz = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const r = 4 + Math.pow(Math.random(), 0.7) * 90, a = Math.random() * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.62, z = -Math.random() * DEPTH; sp.set([x, y, z], i * 3); sz[i] = 0.6 + Math.random() * 1.6; lp.set([x, y, z, x, y, z], i * 6); tl[i * 2 + 1] = 1; lsz[i * 2] = lsz[i * 2 + 1] = sz[i]; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); pg.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  scene.add(new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: STAR_VERT.replace('attribute float aTail;', 'float aTail = 0.0;'), fragmentShader: STAR_POINT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lgeo.setAttribute('aTail', new THREE.BufferAttribute(tl, 1)); lgeo.setAttribute('aSize', new THREE.BufferAttribute(lsz, 1));
  scene.add(new THREE.LineSegments(lgeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: STAR_VERT, fragmentShader: STAR_LINE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  bgScene = new THREE.Scene(); bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: bgU, depthTest: false, depthWrite: false, blending: THREE.NoBlending, vertexShader: QUAD_VERT, fragmentShader: NEBULA_FRAG })));
  bgRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  blitU.uTex.value = bgRT.texture; blitScene = new THREE.Scene();
  blitScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: blitU, depthTest: false, depthWrite: false, blending: THREE.NoBlending, vertexShader: BLIT_VERT, fragmentShader: BLIT_FRAG })));
  renderer.compile(bgScene, bgCam); renderer.compile(blitScene, bgCam); renderer.compile(scene, camera);
  await nextTask();
  resize();
}

export const appear = (now: number) => { appear0 = now; };

const VH = () => Math.max(innerHeight, $('lvh').offsetHeight);
const depthK = () => { const a = landY($('intro')), b = document.documentElement.scrollHeight - innerHeight; return clamp((scrollY - a) / Math.max(1, b - a)); };

export function resize() { renderer.setPixelRatio(DPR); U.uPR.value = DPR / 1.5; const vh = VH(); renderer.setSize(innerWidth, vh, false); camera.aspect = innerWidth / vh; camera.updateProjectionMatrix(); bgU.uRes.value.set(Math.round(innerWidth * DPR * BGS), Math.round(vh * DPR * BGS)); bgRT.setSize(bgU.uRes.value.x, bgU.uRes.value.y); }

export function speedTick(hp: number, vel: number, now: number) {
  flyS = ez(flyS, S.zone === 'hero' ? sstep(0.1, 0.5, hp) * (1 - sstep(0.5, 0.9, hp)) * 0.3 : 0, 8, 1.6); streamS = ez(streamS, S.zone === 'hero' ? 1 : 0, 3, 1.6); fadeS = ez(fadeS, S.zone === 'hero' ? 0.6 + 0.4 * hp : 1, 4, 4);
  if (TR.up) { const u = sstep(0, 1, (now - TR.up) / (750 * TR.f)), d = TR.down ? sstep(0, 1, (now - TR.down) / (1500 * TR.f)) : 0; warpS = u * (1 - d) * (TR.f < 1 ? 0.6 : 1); if (d >= 1) TR.up = TR.down = 0; } else warpS = 0; dimS = ez(dimS, TR.dim, 7 / TR.f, 3.2 / TR.f); blackS = ez(blackS, TR.black, 6, 3.6);
  cruiseS = ez(cruiseS, clamp(vel / 60), 5, 2.2); velS = ez(velS, lenis ? clamp(lenis.velocity / 50, -1, 1) : 0, 6, 2.6);
}

export function fovTick() { const f = (innerWidth < innerHeight ? 70 : 60) + warpS * 22; if (Math.abs(camera.fov - f) > 0.05) { camera.fov = f; camera.updateProjectionMatrix(); } }

export function starsTick(dt: number, now: number) {
  const stream = streamS, cruise = cruiseS, vis = starVis * clamp((now - appear0) / 400);
  { z += dt * (2 + stream * 16 + flyS * 34 + warpS * 300 + velS * 95 + S.boost * 160); S.boost *= Math.pow(0.95, dt * 60); }
  U.uZ.value = z; U.uStretch.value = warpS * 56 + cruise * 16 + S.boost * 14 + stream * 5 + flyS * 6; U.uFade.value = (0.85 + warpS * 0.15) * (1 - blackS) * fadeS * vis; U.uTime.value = now / 1000; camera.rotation.set((S.smy - 0.5) * -0.05, (S.smx - 0.5) * -0.08, 0);
  { const sec = HUES[secCur] ? secCur : 'hero', hu = HUES[sec]; W.hue.x = lerp(W.hue.x, hu[0], lf(0.03)); W.hue.y = lerp(W.hue.y, hu[1], lf(0.03)); W.hue.z = lerp(W.hue.z, hu[2], lf(0.03));
    const inHero = S.zone === 'hero' && !$('case').classList.contains('on'); W.neb = lerp(W.neb, inHero ? 1 : 0.5 - depthK() * 0.22, lf(0.04)); }
  bgU.uT.value = now / 1000; bgU.uNeb.value = W.neb; blitU.uA.value = vis; blitU.uT.value = now / 1000; bgU.uDim.value = Math.max(dimS * 0.9, blackS);
  if (vis <= 0.003) { if (!blank) { renderer.setClearAlpha(0); renderer.clear(); blank = true; } return; }
  blank = false; renderer.setClearAlpha(0); renderer.clear();
  ftAvg = lerp(ftAvg, dt * 1000, 0.02); if (ftAvg > 24 && DPR > 0.75 && !TR.busy) { DPR = Math.max(0.75, DPR - 0.25); ftAvg = 16; resize(); }
  renderer.setRenderTarget(bgRT); renderer.render(bgScene, bgCam); renderer.setRenderTarget(null); renderer.render(blitScene, bgCam); renderer.render(scene, camera);
}
