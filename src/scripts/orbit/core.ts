import { reduce } from '../state';
import { $ } from '../util';

export { clamp, lerp } from '../util';

export type Kind = 'touch' | 'mouse' | 'key';
export type Mode = '' | 'draft' | 'pause' | 'relic' | 'over';
export type Point = { x: number; y: number };
export type Drone = {
  type: 'scout' | 'dart' | 'heavy' | 'boss'; wx: number; wy: number; z: number; sp: number; ph: number; wob: number; hp: number; pts: number; flash: number; dead: boolean; tilt: number;
  state: 'approach' | 'hold' | 'leave' | 'arrive' | 'gap' | 'tele'; zh: number; holdT: number; shooter: boolean; next: number; armour: number; elite: 'armour' | 'commander' | null; dir: number;
  interval: number; cross: boolean; dive: boolean; retreat: boolean; gone: boolean; fade: number; on: boolean; sx: number; sy: number; ss: number; hw: number; hh: number;
  boss: boolean; max: number; zt: number; sz: number; st: number; dur: number; atk: 'volley' | 'sweep'; nextAtk: 'volley' | 'sweep'; phase: number; escT: number; marks: Point[];
};
export type Hit = { dmg?: number; ox?: number; oy?: number; chain?: boolean };
export type Bolt = { x0: number; y0: number; t: number; tgt: Drone | null; ox: number; oy: number; dmg: number; ax: number; ay: number; dur: number; ax2?: number; ay2?: number; done?: boolean };
export type EnemyBolt = { x0: number; y0: number; tx: number; ty: number; t: number; dur: number; px: number; py: number; done?: boolean };
export type Part = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; c: string; debris?: boolean; ring?: boolean; done?: boolean };
export type Pop = { x: number; y: number; txt: string; life: number; done?: boolean };
export type Trail = { x: number; y: number; life: number; max: number; r: number; j: number; done?: boolean };
export type Arc = { x1: number; y1: number; x2: number; y2: number; life: number; done?: boolean };
export type Tele = { x: number; y: number; fx: number; fy: number; w: number; life: number; warn: number; dur: number; safe?: boolean };
export type Charge = { kind: Kind; t0: number; sx: number; sy: number; id: number; x: number; y: number };
type Meta = { sun: Point; limb: number };

export const coarse = matchMedia('(pointer: coarse)').matches;
export const HOLD: Record<Kind, number> = { touch: 300, mouse: 230, key: 230 };

let seed = 0x0b17;
export const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const rnd = (a: number, b: number) => a + rand() * (b - a);
export const fmt = (n: number) => String(Math.floor(n)).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1 $2');

export const V = { W: 0, H: 0, DPR: 1, tall: false, CAP: 400, dprCap: 1.5, barBottom: 0, vis: true };
export const A = { ready: false, base: false, bg: null as HTMLImageElement | null, ship: null as HTMLImageElement | null, drone: null as HTMLImageElement | null, dart: null as HTMLImageElement | null, heavy: null as HTMLImageElement | null, boss: null as HTMLImageElement | null, meta: null as Meta | null };
export const scene = { vp: { x: 0, y: 0 }, sun: { x: 0.6, y: 0.25 }, limb: 0.3 };
export const ship = { x: 0, y: 0, vx: 0, vy: 0, tx: 0.5, ty: 0.66, bank: 0, base: 300, play: 240, sc: 1, restY: 0.66, hit: 0, kick: 0, muzzle: 0, ease: 0, noz: [[0.33, 0.62], [0.67, 0.62]] as number[][] };
export const input = { mx: 0.5, my: 0.5, gx: 0.5, gy: 0.7, charge: null as Charge | null, tid: null as number | null, lx: 0, ly: 0, keys: new Set<string>(), last: (coarse ? 'touch' : 'mouse') as Kind, moveAcc: 0, wheelAcc: 0, wheelT: 0, focusBack: null as HTMLElement | null };
export const G = {
  on: false, run: 0, clock: 0, score: 0, banked: 0, combo: 1, comboT: -9, wave: 0, sector: 1, heat: 0, lives: 3, m: {} as Record<string, number>, relic: null as string | null, relicLv: 0, shield: 0,
  drones: [] as Drone[], bolts: [] as Bolt[], enemyBolts: [] as EnemyBolt[], parts: [] as Part[], pops: [] as Pop[], trail: [] as Trail[], arcs: [] as Arc[], tele: [] as Tele[], wings: [] as Point[],
  wingT: 0, trailAcc: 0, shake: 0, flash: 0, slow: 0, nextWave: 0, fireT: 0, over: false, card: false, mode: '' as Mode, msgT: -1e9, msgHold: 1100, waveDone: true, leaked: 0, waveHits: 0, cap: 4, bossDownAt: -1e9, lock: null as Drone | null, waveT: 0, warn: 0.6, travel: 1,
};
export const egg = { hover: 0, over: false, idleT: 0, whisper: -1, shown: 0 };
export const F = { now: 0, rdt: 0, dt: 0, t: 0, sy: 0, scroll: 0, px: 0, py: 0, sw: 0, sh: 0, fc: 0 };

export const D = {} as { hero: HTMLElement; cv: HTMLCanvasElement; hud: HTMLElement; copy: HTMLElement; card: HTMLElement; opts: HTMLElement; msg: HTMLElement; combo: HTMLElement; comboN: HTMLElement; comboFill: HTMLElement; bossBar: HTMLElement; bossFill: HTMLElement; toast: HTMLElement };
export let ctx: CanvasRenderingContext2D;

type Sprite = 'cyan' | 'trail' | 'amber' | 'core' | 'blast' | 'hit' | 'bolt';
export const SPR = {} as Record<Sprite, HTMLCanvasElement>;

function glow(stops: [number, string][], size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
}

function boltSprite() {
  const s = 64, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,120,79,0.55)'); g.addColorStop(1, 'rgba(255,90,50,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s);
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.2, 0, 6.28); x.fillStyle = '#4a1206'; x.fill();
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.15, 0, 6.28); x.fillStyle = '#ff784f'; x.fill();
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.07, 0, 6.28); x.fillStyle = '#fff1e0'; x.fill(); return c;
}

export function initCore() {
  const ids = ['hero', 'hud', 'card', 'opts', 'msg', 'combo', 'comboN', 'comboFill', 'bossBar', 'bossFill', 'toast'] as const;
  ids.forEach((id) => (D[id] = $(id)));
  D.cv = $<HTMLCanvasElement>('orbit'); D.copy = D.hero.querySelector<HTMLElement>('.copy')!; ctx = D.cv.getContext('2d')!;
  Object.assign(SPR, {
    cyan: glow([[0, 'rgba(235,252,255,0.95)'], [0.3, 'rgba(120,215,255,0.55)'], [1, 'rgba(60,150,255,0)']]),
    trail: glow([[0, 'rgba(140,220,255,0.5)'], [1, 'rgba(80,170,255,0)']]),
    amber: glow([[0, 'rgba(255,170,80,0.5)'], [1, 'rgba(255,150,60,0)']]),
    core: glow([[0, 'rgba(255,205,120,0.85)'], [0.35, 'rgba(255,140,50,0.35)'], [1, 'rgba(255,120,40,0)']]),
    blast: glow([[0, 'rgba(255,244,220,0.95)'], [0.4, 'rgba(255,200,120,0.4)'], [1, 'rgba(255,190,110,0)']]),
    hit: glow([[0, 'rgba(230,250,255,0.95)'], [0.5, 'rgba(150,225,255,0.35)'], [1, 'rgba(120,215,255,0)']]),
    bolt: boltSprite(),
  });
}

export const sprite = (s: HTMLCanvasElement, x: number, y: number, r: number, a = 1) => { if (a <= 0) return; ctx.globalAlpha = Math.min(a, 1); ctx.drawImage(s, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };

export function addPart(p: Part) { G.parts.push(p); if (G.parts.length > V.CAP) G.parts.splice(0, G.parts.length - V.CAP); }
export function burst(x: number, y: number, s: number, warm = true) {
  const n = reduce ? 10 : 28;
  for (let i = 0; i < n; i++) { const a = rand() * 6.28, v = (60 + rand() * 280) * s; addPart({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + rand() * 0.6, r: (1.5 + rand() * 3) * Math.max(s, 0.4), c: warm ? (rand() < 0.5 ? '255,190,110' : '255,236,200') : '150,220,255', debris: rand() < 0.25 }); }
  addPart({ x, y, vx: 0, vy: 0, life: 0, max: 0.35, r: 64 * Math.max(s, 0.3), c: '', ring: true });
}
