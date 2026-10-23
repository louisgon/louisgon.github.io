import { $ } from '../util';
import { clamp, D, egg, fmt, G, input, ship, V, type Kind } from './core';
import { P, rankOf, store } from './store';
import { lv, maxLives, TWISTS, UPS, type OptKind } from './upgrades';
import { bank, buzz, hideCard, live, msg, renderLives, renderMods, saveBest, setLast, setLives, showCard } from './hud';

let tipT = 0, toastT = 0;

export const limX = () => clamp(ship.play / 2 / V.W + 0.02, 0.06, 0.4);
export const gxc = (v: number) => clamp(v, limX(), 1 - limX()), gyc = (v: number) => clamp(v, 0.42, 0.88);
export const cancelInput = () => { input.charge = null; input.keys.clear(); input.tid = null; };

export function start(kind?: Kind) {
  G.run++; store.set('lg01-played', 1); egg.whisper = -1; egg.over = false; D.hero.style.cursor = '';
  Object.assign(G, { on: true, m: {}, relic: null, relicLv: 0, shield: 0, heat: 0, sector: 1, banked: 0, arcs: [], wings: [], wingT: 0, clock: 0, score: 0, combo: 1, comboT: -9, wave: 0, lives: 3, drones: [], bolts: [], enemyBolts: [], parts: [], pops: [], trail: [], tele: [], shake: 0, flash: 0, slow: 0, fireT: 0.15, over: false, card: false, mode: '', nextWave: performance.now() + 600, draftAt: 0, waveDone: true, bossDownAt: -1e9, msgT: -1e9, lock: null });
  ship.hit = 0; ship.ease = 0.22;
  renderLives(); renderMods(); $('score').textContent = fmt(0);
  $('best1').textContent = fmt(P.best);
  $('wave').textContent = 'Wave 01';
  D.hero.classList.add('playing'); D.hero.classList.remove('bossing', 'carded'); D.toast.classList.remove('on'); D.card.classList.remove('on');
  D.hud.inert = false; D.copy.inert = true;
  if (kind) setLast(kind);
  if (kind === 'mouse') { input.gx = gxc(input.mx); input.gy = gyc(input.my); } else { input.gx = gxc(ship.x / V.W || 0.5); input.gy = gyc(ship.y / V.H || 0.7); }
  if (kind === 'key') { input.focusBack = document.activeElement as HTMLElement | null; D.hud.focus({ preventScroll: true }); }
  if (kind === 'touch') { D.hero.classList.add('tip'); clearTimeout(tipT); tipT = window.setTimeout(() => D.hero.classList.remove('tip'), 3200); }
  buzz(8); live('Flight started. Steer to dodge, fire is automatic.');
}

export function land(toWork = false) {
  if (!G.on) return;
  G.on = false; G.card = false; D.hero.classList.remove('playing', 'bossing', 'carded', 'tip'); D.card.classList.remove('on');
  D.hud.inert = true; D.copy.inert = false;
  G.drones.forEach((d) => { if (!d.dead) d.retreat = true; }); G.enemyBolts = []; G.tele = [];
  saveBest(); const before = rankOf(P.xp); bank(); const ranked = rankOf(P.xp) > before;
  if (G.score > 0 && !toWork) {
    const unlock = UPS.find((u) => u.rank === rankOf(P.xp));
    $('toastB').textContent = fmt(G.score); $('toastS').textContent = ranked && unlock ? `Rank ${rankOf(P.xp)} · ${unlock.name} unlocked` : G.score >= P.best ? 'New best' : `Best ${fmt(P.best)}`;
    D.toast.classList.add('on'); clearTimeout(toastT); toastT = window.setTimeout(() => D.toast.classList.remove('on'), 2600);
  }
  if (input.focusBack && input.focusBack.focus) { try { input.focusBack.focus({ preventScroll: true }); } catch {} } input.focusBack = null;
  $('bestLine').hidden = false;
}

export function nextSector() {
  G.sector++; G.waveDone = true; G.nextWave = performance.now() + 1500; G.bossDownAt = -1e9;
  msg(`Sector ${G.sector}`, `${TWISTS[(G.sector - 2) % TWISTS.length].name}${G.heat ? ` · Heat ${G.heat}` : ''}`, 1400);
}

export function choose(id: string, kind: OptKind) {
  if (kind === 'relic') { if (G.relic === id) G.relicLv = 2; else { G.relic = id; G.relicLv = 1; } renderMods(); hideCard(); nextSector(); return; }
  if (kind === 'repair') { G.lives = Math.min(maxLives(), G.lives + 1); setLives(false); }
  else {
    G.m[id] = lv(id) + 1;
    if (id === 'hull') G.lives++;
    if (id === 'glass') G.lives = Math.min(G.lives, maxLives());
    if (id === 'shield') G.shield = 1;
    if (id === 'wing') G.wings = Array.from({ length: lv('wing') }, (_, i) => G.wings[i] || { x: ship.x, y: ship.y });
    renderLives();
  }
  renderMods(); hideCard(); G.nextWave = performance.now() + 700;
}

export const pause = () => { if (G.on && !G.card && !G.over) { cancelInput(); showCard('pause'); } };
