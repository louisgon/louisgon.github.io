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
  mode: number; st: number; dx: number; dy: number; fire: number; charge: number; sum: number; pass: number; aim: number; wingT: number; ringT: number; arc: number; rot: number; alpha: number; age: number; dead: number; f: number; peel: number;
};
export type Charge = { kind: Kind; t0: number; sx: number; sy: number; id: number; x: number; y: number };
type Meta = { sun: { x: number; y: number }; limb: number; edge: number[] };

export const T_SW = 0, T_DA = 1, T_HV = 2, T_BS = 3;
export const TYPES = [
  { role: 'fighter', w: 64, dw: 1, hp: 4.5, sp: 70, r: 0.36, xp: 1, mass: 1, turn: 7, er: 0.075 },
  { role: 'interceptor', w: 58, dw: 1, hp: 3, sp: 340, r: 0.3, xp: 1, mass: 0.8, turn: 30, er: 0.055 },
  { role: 'gunship', w: 90, dw: 1.12, hp: 30, sp: 40, r: 0.46, xp: 4, mass: 5, turn: 2.6, er: 0.06 },
  { role: 'capital', w: 96, dw: 0, hp: 1100, sp: 34, r: 0.44, xp: 0, mass: 60, turn: 2.2, er: 0.05 },
] as const;
type Pt = readonly (readonly [number, number])[];
export type Faction = { id: string; cap: string; short: string; reach: string; banner: string; sub: string; glow: string; core: string; eng: readonly [Pt, Pt, Pt, Pt]; fire: number; jink: number; weave: number; speed: number; passes: number; dash: number; wide: number; brood: number };
export const FAC: readonly Faction[] = [
  { id: 'fleet', cap: 'Rival flagship', short: 'Flagship', reach: 'the Rival fleet', banner: 'Rival fleet returns', sub: '', glow: '255,176,74', core: '255,232,190', fire: 1, jink: 0, weave: 0, speed: 1, passes: 1, dash: 0.8, wide: 2, brood: 0,
    eng: [[[0.33, 0.93], [0.67, 0.93]], [[0.44, 0.83], [0.56, 0.83]], [[0.37, 0.93], [0.61, 0.93]], [[0.26, 0.92], [0.5, 0.93], [0.74, 0.92]]] },
  { id: 'pirate', cap: 'Pirate dreadnought', short: 'Dreadnought', reach: 'the Pirate raiders', banner: 'Pirate raiders inbound', sub: 'Their gunships fire faster', glow: '255,122,44', core: '255,226,170', fire: 1.25, jink: 1, weave: 0, speed: 1, passes: 2, dash: 0.4, wide: 1, brood: 0,
    eng: [[[0.38, 0.95], [0.63, 0.95]], [[0.41, 0.92], [0.6, 0.92]], [[0.22, 0.88], [0.5, 0.95], [0.78, 0.88]], [[0.28, 0.94], [0.5, 0.95], [0.72, 0.94]]] },
  { id: 'alien', cap: 'Hive mothership', short: 'Mothership', reach: 'the Alien swarm', banner: 'Alien swarm inbound', sub: 'Faster fighters that weave', glow: '255,84,226', core: '214,255,255', fire: 1, jink: 0, weave: 1, speed: 1.1, passes: 1, dash: 0.7, wide: 1, brood: 1,
    eng: [[[0.42, 0.9], [0.58, 0.9]], [[0.47, 0.82], [0.54, 0.82]], [[0.4, 0.88], [0.6, 0.88]], [[0.42, 0.87], [0.59, 0.87]]] },
];
export const TAU = Math.PI * 2, BOOST = 1.45, LAND = 1, CAPH = 300, GZ0 = 1.15, TURN = Math.PI * 3;
export const maxW = 4;
export const CAP = { first: 75, gap: 120, calm: 3, ramp: 5, track: 0.45, retrack: 0.25, lock: 0.6 };
export const coarse = matchMedia('(pointer: coarse)').matches;
export const HOLD: Record<Kind, number> = { touch: 300, mouse: 230, key: 230 };
export const STICK = { r: 64, dz: 10, curve: 1.7, ease: 9, turn: 1.6, spin: 0.06, speed: 0.9 };

const mix = (s: number) => { let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
let seed = 0x0b17, sseed = 0x0b17;
export const rand = () => mix((seed = (seed + 0x6d2b79f5) | 0));
export const rnd = (a: number, b: number) => a + rand() * (b - a);
export const srand = () => mix((sseed = (sseed + 0x6d2b79f5) | 0));
export const srnd = (a: number, b: number) => a + srand() * (b - a);
export const reseed = (s: number) => { sseed = s | 0; };
export const simSeed = () => sseed;
export const ein = (k: number) => k * k * k;
export const wrapA = (a: number) => a - TAU * Math.round(a / TAU);
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const fmtT = (s: number) => { s = Math.max(0, Math.floor(s)); return `${pad2(Math.floor(s / 60))}<i class="sep"></i>${pad2(s % 60)}`; };
export const sayT = (s: number) => { s = Math.floor(s); const m = Math.floor(s / 60), r = s % 60; return `${m ? `${m} minute${m === 1 ? '' : 's'} ` : ''}${r} second${r === 1 ? '' : 's'}`; };
export const mk = (w: number, h = w) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export const V = { W: 0, H: 0, DPR: 1, tall: false, U: 1, Z: 1, vw: 1, vh: 1, far: 600, dprCap: 1.5, vis: true };
export const A = { ready: false, base: false, bg: null as HTMLImageElement | null, ship: null as HTMLImageElement | null, shipTop: null as HTMLImageElement | null, art: [] as HTMLImageElement[][], nebula: null as HTMLImageElement | null, meta: null as Meta | null, aspR: 0.38, aspT: 0.855, tsq0: 0.22 };
export const scene = { vp: { x: 0, y: 0 }, sun: { x: 0.6, y: 0.25 }, limb: 0.3, edge: [0.3, 0, 0], lit: 1, glow: 1 };
export const rs = { x: 0, y: 0, vx: 0, vy: 0, tx: 0.5, ty: 0.66, sc: 1, bank: 0, base: 300, restX: 0.5, restY: 0.66, noz: [[0.33, 0.62], [0.67, 0.62]] };
export const ship = { x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, h: 0, hv: 0, bank: 0, play: 160, kick: 0, muzzle: 0, tnoz: [[0.31, 0.9], [0.69, 0.9]] };
export const cam = { x: 0, y: 0 };
export const VP = { p: 0, dir: 0, rx: 0, ry: 0, rw: 1, rv: 0 };
export const DV = { th: 0, drop: 0, kx: 1, ky: 1, fk: 0, ba: 1, punch: 0, zb: 0, ga: 0, gz: 1, rx: 0, ry: 0, rw: 1, rsq: 1, ra: 1, tx: 0, ty: 0, tw: 1, tsq: 1, ta: 0 };
export const C = { ox: 0, oy: 0, wz: 1, dz: 1, x0: 0, x1: 1, y0: 0, y1: 1, sx: 0, sy: 0 };
export const input = { mx: 0.5, my: 0.5, gx: 0, gy: 0, follow: false, charge: null as Charge | null, tid: null as number | null, stick: null as { ox: number; oy: number; x: number; y: number } | null, keys: new Set<string>(), last: (coarse ? 'touch' : 'mouse') as Kind, moveAcc: 0, wheelAcc: 0, wheelT: 0, focusBack: null as HTMLElement | null, mlock: false, ax: 0.5, ay: 0.5 };
export const G = {
  on: false, run: 0, clock: 0, kills: 0, level: 1, xp: 0, need: 4, pend: 0, lvlT: 0, hull: 3, inv: 0, blinkT: 0, vig: 0, shake: 0, stop: 0, slow: 0, over: false, dead: false, card: false, mode: '' as Mode,
  W: [] as Weapon[], wm: {} as Partial<Record<WeapId, Weapon>>, B: [] as BoostId[], bm: {} as Partial<Record<BoostId, number>>, miss: {} as Partial<Record<WeapId, number>>, opts: [] as Option[],
  spawnAcc: 0, dartT: 26, nextBoss: CAP.first, bossN: 0, calmT: -1e9, boss: null as Enemy | null, cache: null as { x: number; y: number; t: number; f: number } | null, warned: false, regen: 0, killsF: 0, msgT: -1e9, msgHold: 1100,
  fac: 0, lap: 0, switching: false,
  arcId: 0, tips: {} as Record<string, number>, trailAcc: 0, newBest: false, px: 0, py: 0, ease: 0,
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
export const ringPt = (m: number) => { const hw = V.vw / 2 + m, hh = V.vh / 2 + m, s = srand() < 0.5 ? -1 : 1; if (srand() * (hw + hh) < hw) { RP.x = cam.x + srnd(-hw, hw); RP.y = cam.y + s * hh; } else { RP.x = cam.x + s * hw; RP.y = cam.y + srnd(-hh, hh); } return RP; };
export const addShake = (a: number) => { if (!reduce) G.shake = Math.min(1, G.shake + a * (1 - G.shake * 0.6)); };
