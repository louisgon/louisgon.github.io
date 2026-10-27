import { reduce } from '../state';
import { $ } from '../util';
import { clamp, D, fmtT, G, input, pad2, T, VP, type Kind } from './core';
import { P } from './store';

let clockT = 0;
const H = { sec: -1, kills: -1, lv: -1, xp: 0, xpSet: -1, msg: -1, ma: 0, vig: -1, boss: -1 };
type Note = { b: string; s: string; hold: number; gold: boolean; f: string; pri: number; wait: (() => boolean) | null; age: number };
const MQ: Note[] = [], TIP = 4, WAIT = 6;
let note: Note | null = null, noteT = 0;
export const resetHud = () => { Object.assign(H, { sec: -1, kills: -1, lv: -1, xp: 0 }); MQ.length = 0; note = null; D.pick.classList.remove('on'); };

export const LANE = { top: 0, msg: 0, a: 0 };
export function measureLane() {
  const hud = D.hud.getBoundingClientRect(), top = hud.top - D.hero.getBoundingClientRect().top, half = D.msg.offsetWidth / 2 + 16, cx = hud.width / 2;
  let y = 40, all = 40;
  for (const el of [D.hud.querySelector('.clk'), D.hud.querySelector('.kc'), G.boss || D.hero.classList.contains('bossing') ? D.bossBar : null]) {
    if (!el) continue; const r = el.getBoundingClientRect(), b = r.bottom - hud.top + 16;
    all = Math.max(all, b); if (r.right - hud.left > cx - half && r.left - hud.left < cx + half) y = Math.max(y, b);
  }
  D.msg.style.top = `${Math.round(y)}px`;
  LANE.top = top + all; LANE.msg = top + y + D.msg.offsetHeight;
}
export const msg = (b: string, s: string, hold = 1100, gold = false, f = '', pri = 1, wait: (() => boolean) | null = null) => { MQ.push({ b, s, hold, gold, f, pri, wait, age: 0 }); };
function nextNote() {
  for (let i = MQ.length - 1; i >= 0; i--) if (!MQ[i].pri && MQ[i].age > TIP) MQ.splice(i, 1);
  let k = -1;
  for (let i = 0; i < MQ.length; i++) { const n = MQ[i]; if ((!n.wait || !n.wait() || n.age > WAIT) && (k < 0 || n.pri > MQ[k].pri)) k = i; }
  if (k < 0) return;
  note = MQ.splice(k, 1)[0]; noteT = 0;
  $('msgB').textContent = note.b; $('msgS').textContent = note.s; D.msg.classList.toggle('gold', note.gold); D.msg.dataset.f = note.f; measureLane();
  if (import.meta.env.MODE === 'test') T.notes.push(note.b);
}
export const live = (t: string) => { $('live').textContent = ''; setTimeout(() => ($('live').textContent = t), 30); };
export const buzz = (ms: number) => { try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(ms); } catch {} };

export function showBest() { $('best0').innerHTML = $('best1').innerHTML = fmtT(P.best); $('best1').parentElement!.hidden = !P.best; }
export function updateLabels() {
  const t = input.last === 'touch';
  $('land').innerHTML = t ? 'Land' : 'Land <kbd>Esc</kbd>';
  $('ctl').innerHTML = t ? 'Drag to steer · Land to exit' : '<kbd>WASD</kbd> or arrows to steer · <kbd>P</kbd> to pause';
}
export const setLast = (k: Kind) => { if (input.last === k) return; const was = input.last === 'touch'; input.last = k; if (was !== (k === 'touch')) updateLabels(); };

export function hudTick(rdt: number, now: number) {
  if (G.on) {
    const s = Math.floor(G.clock);
    if (s !== H.sec) { H.sec = s; D.clock.innerHTML = fmtT(s); if (s && s % 30 === 0 && !reduce) { D.clock.classList.add('pop'); clearTimeout(clockT); clockT = window.setTimeout(() => D.clock.classList.remove('pop'), 90); } }
    if (G.kills !== H.kills) { H.kills = G.kills; D.kills.textContent = String(G.kills); }
    if (G.level - G.pend !== H.lv) { H.lv = G.level - G.pend; D.lvN.textContent = `Level ${pad2(H.lv)}`; H.xp = 0; }
    const tgt = G.pend ? 1 : G.xp / G.need; H.xp += (tgt - H.xp) * (1 - Math.exp(-rdt * 14));
    if (Math.abs(H.xp - H.xpSet) > 0.002) { H.xpSet = H.xp; D.xpFill.style.transform = `scale3d(${clamp(H.xp).toFixed(3)}, 1, 1)`; }
    const bb = G.boss && !G.boss.dead ? clamp(G.boss.hp / G.boss.max) : -1;
    if (Math.abs(bb - H.boss) > 0.002) { if ((bb >= 0) !== (H.boss >= 0)) { D.bossBar.classList.toggle('on', bb >= 0); measureLane(); } if (bb >= 0) D.bossFill.style.transform = `scale3d(${bb.toFixed(3)}, 1, 1)`; H.boss = bb; }
  }
  const vis = G.on && !G.card && VP.p >= 1;
  if (vis) { for (const n of MQ) n.age += rdt; if (!note && H.ma < 0.02) nextNote(); if (note) noteT += rdt * 1000; }
  const want = vis && note ? clamp(1 - (noteT - note.hold) / 400) * clamp(noteT / 200) : 0;
  if (note && noteT >= note.hold + 400) note = null;
  H.ma += (want - H.ma) * (1 - Math.exp(-rdt * 18)); if (H.ma < 0.005) H.ma = 0;
  if (Math.abs(H.ma - H.msg) > 0.01 || (!H.ma && H.msg)) { H.msg = H.ma; D.msg.style.opacity = H.ma.toFixed(2); }
  LANE.a = H.ma;
  G.vig = Math.max(0, G.vig - rdt * 1.6);
  const va = G.on ? Math.max(G.vig, !G.over && G.hull === 1 ? 0.22 + (reduce ? 0.04 : 0.08 * Math.sin(now / 260)) : 0) * (reduce ? 0.6 : 1) : 0;
  if (Math.abs(va - H.vig) > 0.01) { H.vig = va; D.vig.style.opacity = va.toFixed(2); }
}
