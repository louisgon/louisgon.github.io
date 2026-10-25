import { reduce } from '../state';
import { $ } from '../util';
import { clamp, D, FAC, fmtT, G, input, maxW, pad2, sayT, ship, VP, type Kind, type Mode, type Option } from './core';
import { P } from './store';
import { bl, maxHull, WEAP } from './weapons';
import { options, cacheOptions } from './upgrades';
import { T } from './test';

const ICON: Record<string, string> = {
  pulse: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  wing: '<path d="M12 4.5l3 6H9z"/><path d="M5.5 14.5l2 4h-4zM18.5 14.5l2 4h-4z"/><path d="M4 10a8.5 8.5 0 0116 0" stroke-dasharray="1.5 2.5"/>',
  arc: '<path d="M13 2L5 13h6l-2 9 8-11h-6z"/>',
  missile: '<path d="M14.5 3.5h6v6l-8 8-6-6z"/><path d="M6.5 11.5L3 13l2.5 2.5M12.5 17.5L11 21l-2.5-2.5M9 15l-5 5"/>',
  nova: '<circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="9.6" stroke-dasharray="2 2.6"/>',
  railstorm: '<path d="M3 15L15 3M5 21L21 5M9 21l12-12"/><circle cx="17.5" cy="6.5" r="1.3"/>',
  halo: '<ellipse cx="12" cy="13" rx="9.5" ry="5"/><path d="M12 4l2.2 4.2H9.8z"/><circle cx="2.5" cy="13" r="1"/><circle cx="21.5" cy="13" r="1"/><circle cx="12" cy="18" r="1"/>',
  tempest: '<path d="M9 2L3 11h5l-2 7 7-9H8z"/><path d="M17 6l-4 6h4l-1.5 6L21 11h-4z"/>',
  hive: '<path d="M12 3l3.5 2v4L12 11 8.5 9V5zM7 11l3.5 2v4L7 19l-3.5-2v-4zM17 11l3.5 2v4L17 19l-3.5-2v-4z"/>',
  supernova: '<circle cx="12" cy="12" r="3.2"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4M4.6 4.6l2.8 2.8M16.6 16.6l2.8 2.8M4.6 19.4l2.8-2.8M16.6 7.4l2.8-2.8"/>',
  magnet: '<path d="M6 3h4v9a2 2 0 004 0V3h4v9a6 6 0 01-12 0z"/><path d="M6 7h4M14 7h4"/>',
  damage: '<path d="M12 3l7 9-7 9-7-9z"/><path d="M12 8l3 4-3 4-3-4z"/>',
  cooldown: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.8 1.8M9.5 2.5h5M19 6l1.5-1.5"/>',
  area: '<path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/><circle cx="12" cy="12" r="3.5"/>',
  thrust: '<path d="M6 12l6-6 6 6M6 18l6-6 6 6"/>',
  hull: '<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 8v8M8 12h8"/>',
  repair: '<path d="M14.5 5.5a4 4 0 00-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5L16 12l-4-4z"/>',
  salvage: '<path d="M12 4l5 8-5 8-5-8z"/><path d="M7 12h10"/>',
};
export const svg = (k: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

let armT = 0, clockT = 0, upT = 0;
const H = { sec: -1, kills: -1, lv: -1, xp: 0, xpSet: -1, msg: -1, vig: -1, boss: -1 };
export const resetHud = () => Object.assign(H, { sec: -1, kills: -1, lv: -1, xp: 0 });

export const msg = (b: string, s: string, hold = 1100, gold = false, f = '') => { $('msgB').textContent = b; $('msgS').textContent = s; D.msg.classList.toggle('gold', gold); D.msg.dataset.f = f; G.msgT = performance.now(); G.msgHold = hold; };
export const live = (t: string) => { $('live').textContent = ''; setTimeout(() => ($('live').textContent = t), 30); };
export const buzz = (ms: number) => { try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(ms); } catch {} };

export function setHull(lost: boolean, gain = false) {
  const lv = D.lv; if (lv.children.length !== maxHull()) lv.innerHTML = '<i></i>'.repeat(maxHull());
  [...lv.children].forEach((i, n) => { i.classList.toggle('off', n >= G.hull); if (lost && n === G.hull) { i.classList.remove('lost'); void (i as HTMLElement).offsetWidth; i.classList.add('lost'); } if (gain && n === G.hull - 1) { i.classList.remove('gain'); void (i as HTMLElement).offsetWidth; i.classList.add('gain'); } });
}
export function renderHull() { D.lv.innerHTML = '<i></i>'.repeat(maxHull()); setHull(false); }
export function buildHTML() {
  const w = G.W.map((x) => `<span class="${x.evo ? 'evo' : ''}">${svg(x.evo ? WEAP[x.id].evo : x.id)}${x.evo ? '' : `<em>${x.lv}</em>`}</span>`).join('');
  const b = G.B.map((id) => `<span class="b">${svg(id)}<em>${bl(id)}</em></span>`).join('');
  return w + (b ? `<i class="gap"></i>${b}` : '');
}
export const renderBuild = () => (D.build.innerHTML = buildHTML());
export function showBest() { $('best0').innerHTML = $('best1').innerHTML = fmtT(P.best); $('best1').parentElement!.hidden = !P.best; }
export function updateLabels() {
  const t = input.last === 'touch';
  $('land').innerHTML = t ? 'Land' : 'Land <kbd>Esc</kbd>';
  $('ctl').innerHTML = t ? 'Drag to steer · Land to exit' : 'Mouse or <kbd>WASD</kbd> to steer';
}
export const anchor = () => { input.mlock = true; input.ax = input.mx; input.ay = input.my; };
export const setLast = (k: Kind) => { if (input.last === k) return; const was = input.last === 'touch'; input.last = k; if (was !== (k === 'touch')) updateLabels(); };

const optHTML = (o: Option, i: number) => {
  const max = o.kind === 'w' || o.kind === 'b';
  const pips = max ? `<span class="pp">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < o.L ? 'on' : k === o.L ? 'nx' : ''}"></i>`).join('')}</span>` : '';
  const tag = o.kind === 'e' ? '<span class="tg">Evolution</span>' : max && !o.L ? '<span class="tg">New</span>' : '';
  return `<button type="button" class="opt k${o.kind}" data-i="${i}">${tag}<kbd>${i + 1}</kbd>${svg(o.icon)}<span class="tx"><span class="nm">${o.name}</span><span class="ds">${o.d}</span>${pips}${o.pr ? `<span class="pr">${o.pr}</span>` : ''}</span></button>`;
};

export const reached = () => (G.fac || G.lap ? `Reached <em>${FAC[G.fac].reach}</em>${G.lap ? ` on lap ${pad2(G.lap + 1)}` : ''}` : `Fought <em>${FAC[0].reach}</em>`);
const settle = () => { input.keys.clear(); const s = input.stick; if (s) { s.ox = s.x; s.oy = s.y; } };
export function showCard(mode: Mode, f = 0) {
  G.card = true; G.mode = mode; D.hero.classList.add('carded'); settle();
  if (VP.p < 1) D.hud.inert = false;
  const slots = `Weapons ${G.W.length} of ${maxW} · Boosts ${G.B.length} of ${maxW}`;
  const card = D.card, parts = { big: $('cardBig'), sub: $('cardSub'), rs: $('cardStats'), far: $('cardFar'), bld: $('cardBuild'), opts: D.opts, act: $('cardActions') };
  const show = (on: string[]) => Object.entries(parts).forEach(([k, el]) => (el.hidden = !on.includes(k)));
  let opts: Option[] = [];
  if (import.meta.env.MODE === 'test') T.botT = 0;
  if (mode === 'level') {
    opts = options();
    $('cardT').textContent = `Level ${pad2(G.level - G.pend + 1)} · Choose one`;
    $('cardSub').textContent = slots; show(['sub', 'opts']);
  } else if (mode === 'cache') {
    opts = cacheOptions();
    $('cardT').textContent = `${FAC[f].short} cache · ${opts[0].kind === 'e' ? 'Evolve one' : 'Choose one'}`;
    $('cardSub').textContent = slots; show(['sub', 'opts']);
  } else if (mode === 'pause') {
    $('cardT').textContent = 'Paused'; D.cardMore.textContent = 'Resume'; show(['act']);
  } else {
    $('cardT').textContent = 'Hull lost';
    $('cardBig').innerHTML = fmtT(G.clock);
    $('cardSub').innerHTML = G.newBest ? 'New best' : `Best <em>${fmtT(P.best)}</em>`;
    $('cardStats').innerHTML = `<div>Kills<b>${G.kills}</b></div><div>Level<b>${pad2(G.level)}</b></div>`;
    $('cardFar').innerHTML = reached();
    $('cardBuild').innerHTML = buildHTML();
    D.cardMore.textContent = 'Fly again'; show(['big', 'sub', 'rs', 'far', 'bld', 'act']);
  }
  G.opts = opts;
  D.opts.innerHTML = opts.map(optHTML).join('');
  card.dataset.mode = mode; card.dataset.n = String(opts.length); D.opts.style.setProperty('--n', String(Math.max(1, opts.length))); card.classList.add('on');
  if (mode === 'level' || mode === 'cache') { D.opts.classList.add('arm'); clearTimeout(armT); armT = window.setTimeout(() => D.opts.classList.remove('arm'), 380); }
  live(mode === 'level' || mode === 'cache' ? `${$('cardT').textContent}. ${opts.map((o, i) => `${i + 1}, ${o.name}${o.kind === 'e' ? ', evolution' : o.L ? ` level ${o.L + 1}` : ', new'}`).join('. ')}` : mode === 'pause' ? 'Paused.' : `Hull lost. Time ${sayT(G.clock)}. ${reached().replace(/<\/?em>/g, '')}. Fly again or land.`);
  if (input.last === 'key') setTimeout(() => { const f = card.querySelector<HTMLElement>('.opt') || D.cardMore; if (f && !f.hidden) f.focus({ preventScroll: true }); }, 60);
}

export function hideCard() {
  G.card = false; G.mode = ''; D.hero.classList.remove('carded'); D.card.classList.remove('on');
  if (document.activeElement && D.card.contains(document.activeElement)) D.hud.focus({ preventScroll: true });
  if (VP.p < 1) D.hud.inert = true;
  input.gx = ship.x; input.gy = ship.y; input.follow = false; anchor(); settle();
  G.inv = Math.max(G.inv, 0.6);
}

export function hudTick(rdt: number, now: number) {
  if (G.on) {
    const s = Math.floor(G.clock);
    if (s !== H.sec) { H.sec = s; D.clock.innerHTML = fmtT(s); if (s && s % 30 === 0) { D.clock.classList.add('pop'); clearTimeout(clockT); clockT = window.setTimeout(() => D.clock.classList.remove('pop'), 90); } }
    if (G.kills !== H.kills) { H.kills = G.kills; D.kills.textContent = String(G.kills); }
    if (G.level - G.pend !== H.lv) { H.lv = G.level - G.pend; D.lvN.textContent = `Level ${pad2(H.lv)}`; H.xp = 0; }
    const tgt = G.pend ? 1 : G.xp / G.need; H.xp += (tgt - H.xp) * (1 - Math.exp(-rdt * 14));
    if (Math.abs(H.xp - H.xpSet) > 0.002) { H.xpSet = H.xp; D.xpFill.style.transform = `scale3d(${clamp(H.xp).toFixed(3)}, 1, 1)`; }
    const bb = G.boss && !G.boss.dead ? clamp(G.boss.hp / G.boss.max) : -1;
    if (Math.abs(bb - H.boss) > 0.002) { D.bossBar.classList.toggle('on', bb >= 0); if (bb >= 0) D.bossFill.style.transform = `scale3d(${bb.toFixed(3)}, 1, 1)`; H.boss = bb; }
  }
  const ma = G.on && !G.card ? clamp(1 - (now - G.msgT - G.msgHold) / 400) * clamp((now - G.msgT) / 200) : 0;
  if (Math.abs(ma - H.msg) > 0.01) { H.msg = ma; D.msg.style.opacity = ma.toFixed(2); }
  G.vig = Math.max(0, G.vig - rdt * 1.6);
  const va = G.on ? Math.max(G.vig, !G.over && G.hull === 1 ? 0.22 + 0.08 * Math.sin(now / 260) : 0) * (reduce ? 0.6 : 1) : 0;
  if (Math.abs(va - H.vig) > 0.01) { H.vig = va; D.vig.style.opacity = va.toFixed(2); }
}

export const lvlUp = () => { D.lvl.classList.add('up'); clearTimeout(upT); upT = window.setTimeout(() => D.lvl.classList.remove('up'), 700); };
