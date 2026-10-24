import { reduce } from '../state';
import { $, clamp } from '../util';

export { clamp, ease3 as eio, lerp, out as eout, sstep as sm } from '../util';

export type Kind = 'touch' | 'mouse' | 'key';
export type Mode = '' | 'level' | 'cache' | 'pause' | 'over';
export type WeapId = 'pulse' | 'wing' | 'arc' | 'missile' | 'nova';
export type BoostId = 'magnet' | 'damage' | 'cooldown' | 'area' | 'thrust' | 'hull';
export type Weapon = { id: WeapId; lv: number; evo: boolean; t: number; a: number; n: number; p: number; R: number; px: Float32Array; py: Float32Array };
export type Option = { kind: 'w' | 'b' | 'e' | 'x'; id: string; L: number; name: string; d: string; icon: string; pr: string };
export type Enemy = {
  t: number; id: number; x: number; y: number; vx: number; vy: number; kx: number; ky: number; hp: number; max: number; w: number; r: number; L: number; sp: number; flash: number; elite: number; ph: number;
  mode: number; st: number; dx: number; dy: number; fire: number; charge: number; sum: number; wingT: number; ringT: number; nova: number; arc: number; rot: number; alpha: number; age: number; dead: number;
};
export type Charge = { kind: Kind; t0: number; sx: number; sy: number; id: number; x: number; y: number };
type Meta = { sun: { x: number; y: number }; limb: number };

export const T_SW = 0, T_DA = 1, T_HV = 2, T_BS = 3;
export const TYPES = [
  { img: 'drone', w: 64, hp: 4.5, sp: 70, r: 0.36, xp: 1, mass: 1, turn: 7, sh: 13 },
  { img: 'dart', w: 58, hp: 3, sp: 340, r: 0.3, xp: 1, mass: 0.8, turn: 30, sh: 15 },
  { img: 'heavy', w: 90, hp: 30, sp: 40, r: 0.46, xp: 4, mass: 5, turn: 2.6, sh: 17 },
  { img: 'boss', w: 96, hp: 1100, sp: 34, r: 0.44, xp: 0, mass: 60, turn: 2.2, sh: 26 },
] as const;
export const TAU = Math.PI * 2, DIVE = 1.45, LAND = 1, TILE = 980, CLOUDT = 2400, GZ0 = 1.15, TURN = Math.PI * 3;
export const coarse = matchMedia('(pointer: coarse)').matches;
export const HOLD: Record<Kind, number> = { touch: 300, mouse: 230, key: 230 };
export const STICK = { r: 64, dz: 10, curve: 1.7, ease: 20, turn: 1.6, spin: 0.06 };

let seed = 0x0b17;
export const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const rnd = (a: number, b: number) => a + rand() * (b - a);
export const ein = (k: number) => k * k * k;
export const wrapA = (a: number) => a - TAU * Math.round(a / TAU);
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const fmtT = (s: number) => { s = Math.max(0, Math.floor(s)); return `${pad2(Math.floor(s / 60))}<i class="sep"></i>${pad2(s % 60)}`; };
export const sayT = (s: number) => { s = Math.floor(s); const m = Math.floor(s / 60), r = s % 60; return `${m ? `${m} minute${m === 1 ? '' : 's'} ` : ''}${r} second${r === 1 ? '' : 's'}`; };
export const mk = (w: number, h = w) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export const V = { W: 0, H: 0, DPR: 1, tall: false, U: 1, Z: 1, vw: 1, vh: 1, far: 600, dprCap: 1.5, vis: true };
export const A = { ready: false, base: false, bg: null as HTMLImageElement | null, ship: null as HTMLImageElement | null, shipTop: null as HTMLImageElement | null, drone: null as HTMLImageElement | null, dart: null as HTMLImageElement | null, heavy: null as HTMLImageElement | null, boss: null as HTMLImageElement | null, dunes: null as HTMLImageElement | null, meta: null as Meta | null, aspR: 0.38, aspT: 0.855, tsq0: 0.22 };
export const scene = { vp: { x: 0, y: 0 }, sun: { x: 0.6, y: 0.25 }, limb: 0.3 };
export const rs = { x: 0, y: 0, vx: 0, vy: 0, tx: 0.5, ty: 0.66, sc: 1, bank: 0, base: 300, restY: 0.66, noz: [[0.33, 0.62], [0.67, 0.62]] };
export const ship = { x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, h: 0, hv: 0, bank: 0, play: 160, kick: 0, muzzle: 0, tnoz: [[0.31, 0.9], [0.69, 0.9]] };
export const cam = { x: 0, y: 0 };
export const VP = { p: 0, dir: 0, rx: 0, ry: 0, rw: 1, rv: 0 };
export const DV = { k: 1, lift: 0, dark: 0, zb: 0, ga: 0, gz: 1, rx: 0, ry: 0, rw: 1, rsq: 1, ra: 1, tx: 0, ty: 0, tw: 1, tsq: 1, ta: 0, sho: 1 };
export const C = { ox: 0, oy: 0, wz: 1, dz: 1, x0: 0, x1: 1, y0: 0, y1: 1, sx: 0, sy: 0 };
export const input = { mx: 0.5, my: 0.5, gx: 0, gy: 0, follow: false, charge: null as Charge | null, tid: null as number | null, stick: null as { ox: number; oy: number; x: number; y: number } | null, keys: new Set<string>(), last: (coarse ? 'touch' : 'mouse') as Kind, moveAcc: 0, wheelAcc: 0, wheelT: 0, focusBack: null as HTMLElement | null, mlock: false, mlockAcc: 0 };
export const G = {
  on: false, run: 0, clock: 0, kills: 0, level: 1, xp: 0, need: 4, pend: 0, lvlT: 0, hull: 3, inv: 0, blinkT: 0, vig: 0, shake: 0, stop: 0, slow: 0, over: false, dead: false, card: false, mode: '' as Mode,
  W: [] as Weapon[], wm: {} as Partial<Record<WeapId, Weapon>>, B: [] as BoostId[], bm: {} as Partial<Record<BoostId, number>>, miss: {} as Partial<Record<WeapId, number>>, opts: [] as Option[],
  spawnAcc: 0, dartT: 26, nextBoss: 100, bossN: 0, boss: null as Enemy | null, cache: null as { x: number; y: number; t: number } | null, warned: false, regen: 0, killsF: 0, msgT: -1e9, msgHold: 1100,
  novaId: 0, arcId: 0, tips: {} as Record<string, number>, trailAcc: 0, newBest: false, px: 0, py: 0, ease: 0,
};
export const egg = { hover: 0, over: false, idleT: 0, whisper: -1, shown: 0 };
export const F = { now: 0, rdt: 0, dt: 0, t: 0, sy: 0, scroll: 0, fc: 0 };

type Els = 'hero' | 'hud' | 'card' | 'opts' | 'msg' | 'vig' | 'toast' | 'clock' | 'kills' | 'lvl' | 'lvN' | 'xpFill' | 'build' | 'lv' | 'bossBar' | 'bossFill' | 'bossName' | 'cardMore';
export const D = {} as Record<Els, HTMLElement> & { cv: HTMLCanvasElement; copy: HTMLElement };
export let ctx: CanvasRenderingContext2D;

export function initCore() {
  (['hero', 'hud', 'card', 'opts', 'msg', 'vig', 'toast', 'clock', 'kills', 'lvl', 'lvN', 'xpFill', 'build', 'lv', 'bossBar', 'bossFill', 'bossName', 'cardMore'] as const).forEach((id) => (D[id] = $(id)));
  D.cv = $<HTMLCanvasElement>('orbit'); D.copy = D.hero.querySelector<HTMLElement>('.copy')!; ctx = D.cv.getContext('2d')!;
}

export const sprite = (s: CanvasImageSource, x: number, y: number, r: number, a = 1) => { if (a <= 0) return; ctx.globalAlpha = Math.min(a, 1); ctx.drawImage(s, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };
export const at = (x: number, y: number, c: number, s: number) => ctx.setTransform(c * C.dz, s * C.dz, -s * C.dz, c * C.dz, (x * C.wz + C.ox) * V.DPR, (y * C.wz + C.oy) * V.DPR);
export const base = () => ctx.setTransform(C.dz, 0, 0, C.dz, C.ox * V.DPR, C.oy * V.DPR);
export const screen = () => ctx.setTransform(V.DPR, 0, 0, V.DPR, C.sx * V.DPR, C.sy * V.DPR);

export const onView = (x: number, y: number, m: number) => x > C.x0 - m && x < C.x1 + m && y > C.y0 - m && y < C.y1 + m;
export const shipW = () => ship.play, shipH = () => ship.play * A.aspT, shipR = () => shipW() * 0.16;
export const restW = () => rs.base * rs.sc, restH = () => restW() * A.aspR;
export const LP = { x: 0, y: 0 }, RP = { x: 0, y: 0 };
export const toWorld = (lx: number, ly: number) => { const c = Math.cos(ship.h), s = Math.sin(ship.h); LP.x = ship.x + lx * c - ly * s; LP.y = ship.y + lx * s + ly * c; return LP; };
export const capD = (e: Enemy, x: number, y: number) => { const dx = x - e.x, dy = y - e.y; if (!e.L) return Math.hypot(dx, dy); const ux = Math.sin(e.rot), uy = -Math.cos(e.rot), s = clamp(dx * ux + dy * uy, -e.L, e.L); return Math.hypot(dx - ux * s, dy - uy * s); };
export const ringPt = (m: number) => { const hw = V.vw / 2 + m, hh = V.vh / 2 + m, s = rand() < 0.5 ? -1 : 1; if (rand() * (hw + hh) < hw) { RP.x = cam.x + rnd(-hw, hw); RP.y = cam.y + s * hh; } else { RP.x = cam.x + s * hw; RP.y = cam.y + rnd(-hh, hh); } return RP; };
export const addShake = (a: number) => { if (!reduce) G.shake = Math.min(1, G.shake + a * (1 - G.shake * 0.6)); };
