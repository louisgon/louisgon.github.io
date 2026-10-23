import { ic } from '../../lib/icons';
import { G, input, V } from './core';

export type OptKind = 'up' | 'trade' | 'repair' | 'relic';
export type Option = { id: string; name: string; d: (L: number) => string; max?: number; rank?: number; bad?: string };

const ICON: Record<string, string> = {
  rapid: '<path d="M4 7l5 5-5 5M11 7l5 5-5 5"/>', triple: '<path d="M12 4v16M6 7l2 13M18 7l-2 13"/>', heavy: '<path d="M12 3l7 9-7 9-7-9z"/><path d="M12 8l3 4-3 4-3-4z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', hull: '<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 8v8M8 12h8"/>', lock: '<circle cx="12" cy="12" r="6"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  wing: '<path d="M12 4l4 8H8z"/><path d="M5 14l2.5 5h-5zM19 14l2.5 5h-5z"/>', arc: '<path d="M13 2L5 13h6l-2 9 8-11h-6z"/>', stasis: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  salvage: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5H14a1.5 1.5 0 010 3h-4a1.5 1.5 0 000 3h4.5"/>', repair: '<path d="M14.5 5.5a4 4 0 00-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5L16 12l-4-4z"/>',
  glass: '<path d="M12 3l6 7-6 11-6-11z"/><path d="M9 10h6M12 3v18" stroke-dasharray="2 2"/>', focus: '<circle cx="12" cy="12" r="2.5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>', hot: '<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-11 3 2 7 6 7 11 0 3-2 6-5 6z"/>',
  core: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  overdrive: '<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>', phase: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" stroke-dasharray="2.5 2.5"/><path d="M9 12l2 2 4-4"/>',
};
export const svg = (k: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const to = (a: string, b: string) => `${a} ${ic('arrow-right')}<span class="sr"> to </span> ${b}`;

export const lv = (id: string) => G.m[id] || 0;
export const has = (id: string) => !!G.m[id];
export const maxLives = () => Math.max(1, 3 + lv('hull') - (has('glass') ? 1 : 0));

export const UPS: Option[] = [
  { id: 'rapid', name: 'Rapid fire', max: 3, rank: 1, d: (L) => `Fire rate ${to(pct(1 / Math.pow(0.9, L)), pct(1 / Math.pow(0.9, L + 1)))}` },
  { id: 'triple', name: 'Triple shot', max: 2, rank: 1, d: (L) => (L ? 'Adds two angled bolts at half damage' : 'Adds a centre bolt') },
  { id: 'heavy', name: 'Heavy rounds', max: 2, rank: 1, d: (L) => `Damage ${to(`${(1 + 0.25 * L).toFixed(2)}×`, `${(1.25 + 0.25 * L).toFixed(2)}×`)}` },
  { id: 'shield', name: 'Deflector', max: 1, rank: 1, d: () => 'Blocks one hit, recharges each wave' },
  { id: 'hull', name: 'Reinforced hull', max: 1, rank: 1, d: () => `Max hull ${to(String(maxLives()), String(maxLives() + 1))}, repairs one` },
  { id: 'lock', name: 'Wide lock', max: 2, rank: 1, d: (L) => `Lock width ${to(pct(1 + 0.2 * L), pct(1.2 + 0.2 * L))}` },
  { id: 'wing', name: 'Wingman', max: 2, rank: 2, d: (L) => (L ? 'A second escort joins' : 'An escort flies beside you and fires') },
  { id: 'arc', name: 'Arc discharge', max: 2, rank: 3, d: (L) => `Kills arc to ${L + 1} nearby ${L ? 'drones' : 'drone'}` },
  { id: 'stasis', name: 'Stasis field', max: 2, rank: 4, d: (L) => (L ? 'Enemy shots 25% slower' : 'Enemy shots 15% slower') },
  { id: 'salvage', name: 'Salvage', max: 1, rank: 5, d: () => '25% more score' },
];
export const TRADES: Option[] = [
  { id: 'glass', name: 'Glass reactor', d: () => '+35% damage', bad: '−1 max hull' },
  { id: 'focus', name: 'Focused beam', d: () => '+50% damage', bad: 'Lock width −35%' },
  { id: 'hot', name: 'Hot engines', d: () => '+25% score', bad: 'Enemies fire 20% more' },
];
export const REPAIR: Option = { id: 'repair', name: 'Field repair', d: () => 'Restore one hull instead of upgrading' };
export const RELICS: Option[] = [
  { id: 'core', name: 'Monolith core', d: (L) => (L ? 'Bigger bursts that hit harder' : 'Bolts burst on impact and hit nearby drones') },
  { id: 'overdrive', name: 'Overdrive', d: (L) => (L ? 'Overdrive lasts 3 seconds' : '+50% fire rate for 2 seconds out of every 8') },
  { id: 'phase', name: 'Phase hull', d: (L) => (L ? 'Untouchable for 2 seconds after a hit' : 'When hit, clear every enemy shot') },
];
export const TWISTS = [{ id: 'shielded', name: 'Shielded drones' }, { id: 'swift', name: 'Swift darts' }, { id: 'barrage', name: 'Barrage' }, { id: 'swarm', name: 'Swarm' }];

export const twist = () => (G.sector > 1 ? TWISTS[(G.sector - 2) % TWISTS.length].id : '');
export const dmgMul = () => (1 + 0.25 * lv('heavy')) * (has('glass') ? 1.35 : 1) * (has('focus') ? 1.5 : 1);
export const odLen = () => (G.relic === 'overdrive' ? (G.relicLv > 1 ? 3 : 2) : 0);
export const odOn = () => !!odLen() && G.clock % 8 > 8 - odLen();
export const gapBase = () => 0.13 * Math.pow(0.9, lv('rapid'));
export const fireGap = () => gapBase() / (odOn() ? 1.5 : 1);
export const lockRange = () => V.W * (input.last === 'touch' ? 0.12 : 0.08) * (1 + 0.2 * lv('lock')) * (has('focus') ? 0.65 : 1);
export const scoreMul = () => (1 + 0.25 * lv('salvage')) * (has('hot') ? 1.25 : 1) * (1 + 0.15 * G.heat);
export const fireMul = () => (has('hot') ? 1.2 : 1) * (1 + 0.1 * G.heat) * (1 + 0.1 * (G.sector - 1)) * (twist() === 'barrage' ? 1.3 : 1);
export const dps = () => ((2 + (lv('triple') >= 1 ? 1 : 0) + (lv('triple') >= 2 ? 1 : 0)) * 0.5 * dmgMul()) / gapBase() + (lv('wing') * 0.5 * dmgMul()) / 0.26;
