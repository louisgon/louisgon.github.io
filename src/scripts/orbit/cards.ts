import { $ } from '../util';
import { D, FAC, fmtT, G, input, maxW, pad2, sayT, ship, T, V, VP, type Mode, type Option } from './core';
import { P } from './store';
import { bl, BOOST, EVO, maxHull, WEAP } from './weapons';
import { boostPr, cacheOptions, options } from './upgrades';
import { live, measureLane } from './hud';

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

let armT = 0, upT = 0, pickT = 0;
export function setHull(lost: boolean, gain = false) {
  const lv = D.lv; if (lv.children.length !== maxHull()) lv.innerHTML = '<i></i>'.repeat(maxHull());
  [...lv.children].forEach((i, n) => { i.classList.toggle('off', n >= G.hull); if (lost && n === G.hull) { i.classList.remove('lost'); void (i as HTMLElement).offsetWidth; i.classList.add('lost'); } if (gain && n === G.hull - 1) { i.classList.remove('gain'); void (i as HTMLElement).offsetWidth; i.classList.add('gain'); } });
}
export function renderHull() { D.lv.innerHTML = '<i></i>'.repeat(maxHull()); setHull(false); }
export function buildHTML(hit = '') {
  const k = (id: string, c: string) => `class="${c}${id === hit ? ' hit' : ''}" data-k="${id}"`;
  const w = G.W.map((x) => `<span ${k(x.id, x.evo ? 'evo' : '')}>${svg(x.evo ? WEAP[x.id].evo : x.id)}${x.evo ? '' : `<em>${x.lv}</em>`}</span>`).join('');
  const b = G.B.map((id) => `<span ${k(id, 'b')}>${svg(id)}<em>${bl(id)}</em></span>`).join('');
  return w + (b ? `<i class="gap"></i>${b}` : '');
}
export const renderBuild = (hit = '') => { D.build.innerHTML = buildHTML(hit); if (G.on) measureLane(); };
export function picked(label: string, key: string) {
  renderBuild(key);
  if (!label) return;
  D.pick.textContent = label; D.pick.classList.add('on'); clearTimeout(pickT); pickT = window.setTimeout(() => D.pick.classList.remove('on'), 1600);
  live(`${label}.`);
}
const optHTML = (o: Option, i: number) => {
  const max = o.kind === 'w' || o.kind === 'b';
  const pips = max ? `<span class="pp">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < o.L ? 'on' : k === o.L ? 'nx' : ''}"></i>`).join('')}</span>` : '';
  const tag = o.kind === 'e' ? '<span class="tg">Evolution</span>' : max && !o.L ? '<span class="tg">New</span>' : '';
  return `<button type="button" class="opt k${o.kind}" data-i="${i}">${tag}<kbd>${i + 1}</kbd>${svg(o.icon)}<span class="tx"><span class="nm">${o.name}</span><span class="ds">${o.d}</span>${pips}${o.pr ? `<span class="pr">${o.pr}</span>` : ''}</span></button>`;
};

const pips = (n: number, evo = false) => `<span class="pp" aria-hidden="true">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < n ? (evo ? 'ev' : 'on') : ''}"></i>`).join('')}</span>`;
const threat = () => { const F = FAC[G.fac], cap = G.lap ? `${F.cap} ${pad2(G.lap + 1)}` : F.cap; return G.boss ? `${cap} engaged` : G.cache ? 'Cache waiting' : G.warned ? `${cap} inbound` : `Fighting ${F.reach}`; };
export function status() {
  const w = G.W.map((x) => ({ k: x.evo ? WEAP[x.id].evo : x.id, name: x.evo ? EVO[WEAP[x.id].evo].name : WEAP[x.id].name, lv: x.evo ? 5 : x.lv, evo: x.evo, pr: x.evo ? `Evolved from ${WEAP[x.id].name}` : `Evolves with ${BOOST[WEAP[x.id].pair].name}` }));
  const b = G.B.map((id) => ({ k: id, name: BOOST[id].name, lv: bl(id), evo: false, pr: boostPr(id) || `Paired with ${EVO[WEAP[(Object.keys(WEAP) as (keyof typeof WEAP)[]).find((q) => WEAP[q].pair === id)!].evo].name}` }));
  const row = (r: (typeof w)[number], c: string) => `<li class="${r.evo ? 'evo' : c}">${svg(r.k)}<span class="nm">${r.name}<span class="sr">, ${r.evo ? 'evolved' : `level ${r.lv} of 5`}.</span>${pips(r.lv, r.evo)}</span><span class="pr">${r.pr}</span></li>`;
  const col = (h: string, rs: typeof w, c: string) => `<div><h3 class="mono">${h} ${rs.length} of ${maxW}</h3>${rs.length ? `<ul>${rs.map((r) => row(r, c)).join('')}</ul>` : '<p class="none">None yet</p>'}</div>`;
  const line = `Hull ${G.hull} of ${maxHull()} · Level ${pad2(G.level - G.pend)}`, th = threat();
  return { html: `<p class="st mono">${line}</p><p class="th mono">${th}</p><div class="cols">${col('Weapons', w, '')}${col('Boosts', b, 'b')}</div>`, say: `${line}. ${th}. Time ${sayT(G.clock)}. Weapons ${w.map((r) => `${r.name} ${r.evo ? 'evolved' : `level ${r.lv}`}`).join(', ') || 'none'}. Boosts ${b.map((r) => `${r.name} level ${r.lv}`).join(', ') || 'none'}.` };
}

export const reached = () => (G.fac || G.lap ? `Reached <em>${FAC[G.fac].reach}</em>${G.lap ? ` on lap ${pad2(G.lap + 1)}` : ''}` : `Fought <em>${FAC[0].reach}</em>`);
const held = new Map<HTMLElement, boolean>();
export function modal(on: boolean) {
  if (!on) { held.forEach((v, el) => (el.inert = v)); held.clear(); return; }
  for (let el: HTMLElement = D.card; el.parentElement && el !== document.body; el = el.parentElement) for (const s of el.parentElement.children) {
    if (!(s instanceof HTMLElement) || s === el || s.id === 'live' || s.tagName === 'SCRIPT' || held.has(s)) continue;
    held.set(s, s.inert); s.inert = true;
  }
}
export function reveal(el: HTMLElement) { const c = D.card.getBoundingClientRect(), r = el.getBoundingClientRect(); if (r.bottom > c.bottom - 8) D.card.scrollTop += r.bottom - c.bottom + 16; else if (r.top < c.top + 8) D.card.scrollTop -= c.top - r.top + 16; }
export const focusables = () => [...D.card.querySelectorAll<HTMLElement>('button')].filter((b) => b.getClientRects().length > 0);
const settle = () => { input.keys.clear(); const s = input.stick; if (s) { s.ox = s.x; s.oy = s.y; } };
export function showCard(mode: Mode, f = 0) {
  G.card = true; G.mode = mode; D.hero.classList.add('carded'); settle(); modal(true);
  if (VP.p < 1) D.hud.inert = false;
  const slots = `Weapons ${G.W.length} of ${maxW} · Boosts ${G.B.length} of ${maxW}`;
  const card = D.card, parts = { big: $('cardBig'), sub: $('cardSub'), rs: $('cardStats'), far: $('cardFar'), bld: $('cardBuild'), info: $('cardInfo'), opts: D.opts, act: $('cardActions') };
  const show = (on: string[]) => Object.entries(parts).forEach(([k, el]) => (el.hidden = !on.includes(k)));
  let opts: Option[] = [];
  if (import.meta.env.MODE === 'test') { T.botT = 0; T.notes.push(`card:${mode}`); }
  if (mode === 'level') {
    opts = options();
    $('cardT').textContent = `Level ${pad2(G.level - G.pend + 1)} · Choose one`;
    $('cardSub').textContent = slots; show(['sub', 'opts', 'act']);
  } else if (mode === 'cache') {
    opts = cacheOptions();
    $('cardT').textContent = `${FAC[f].short} cache · ${opts[0].kind === 'e' ? 'Evolve one' : 'Choose one'}`;
    $('cardSub').textContent = slots; show(['sub', 'opts', 'act']);
  } else if (mode === 'pause') {
    $('cardT').textContent = 'Paused'; D.cardMore.textContent = 'Resume'; $('cardInfo').innerHTML = status().html; show(['info', 'act']);
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
  card.dataset.mode = mode; card.dataset.n = String(opts.length); card.setAttribute('aria-describedby', mode === 'pause' ? 'cardInfo' : mode === 'over' ? 'cardSub cardFar' : 'cardSub'); D.opts.style.setProperty('--n', String(Math.max(1, opts.length))); card.classList.add('on');
  if (V.W < 861) { const r = card.getBoundingClientRect(), h0 = D.hero.getBoundingClientRect().top, top = (r.top + r.bottom) / 2 - card.offsetHeight / 2 - h0, half = ship.play * V.Z / 2, want = top - half - 12, sy = want >= D.hud.getBoundingClientRect().top - h0 + half ? Math.min(want, V.H * 0.38) : V.H * 0.38; G.camY = (V.H / 2 - sy) / V.Z; }
  else G.camY = -0.13 * V.vh;
  if (mode === 'level' || mode === 'cache') { D.opts.classList.add('arm'); clearTimeout(armT); armT = window.setTimeout(() => D.opts.classList.remove('arm'), 380); }
  live(mode === 'level' || mode === 'cache' ? `${$('cardT').textContent}. ${opts.map((o, i) => `${i + 1}, ${o.name}${o.kind === 'e' ? ', evolution' : o.L ? ` level ${o.L + 1}` : ', new'}`).join('. ')}` : mode === 'pause' ? `Paused. ${status().say}` : `Hull lost. Time ${sayT(G.clock)}. ${reached().replace(/<\/?em>/g, '')}. Fly again or land.`);
  card.scrollTop = 0;
  const run = G.run; setTimeout(() => { if (G.run !== run || !G.card || G.mode !== mode) return; const f = focusables()[0]; if (f) { f.focus({ preventScroll: true }); if (input.last === 'key') reveal(f); } }, 60);
}

export function hideCard() {
  G.card = false; G.mode = ''; D.hero.classList.remove('carded'); D.card.classList.remove('on'); modal(false);
  if (document.activeElement && D.card.contains(document.activeElement)) D.hud.focus({ preventScroll: true });
  if (VP.p < 1) D.hud.inert = true;
  input.gx = ship.x; input.gy = ship.y; settle();
  G.inv = Math.max(G.inv, 0.6);
}

export const lvlUp = () => { D.lvl.classList.add('up'); clearTimeout(upT); upT = window.setTimeout(() => D.lvl.classList.remove('up'), 700); };
