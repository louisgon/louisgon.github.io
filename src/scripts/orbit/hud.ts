import { $ } from '../util';
import { clamp, D, fmt, G, input, rand, type Kind, type Mode } from './core';
import { P, RANKS, rankOf, store } from './store';
import { has, lv, maxLives, REPAIR, RELICS, TRADES, UPS, svg, type OptKind, type Option } from './upgrades';

let popT = 0;

export const msg = (b: string, s: string, hold = 1100) => { $('msgB').textContent = b; $('msgS').textContent = s; G.msgT = performance.now(); G.msgHold = hold; };
export const live = (t: string) => { $('live').textContent = ''; setTimeout(() => ($('live').textContent = t), 30); };
export const bumpScore = () => { const el = $('score'); el.textContent = fmt(G.score); el.classList.add('pop'); clearTimeout(popT); popT = window.setTimeout(() => el.classList.remove('pop'), 60); };
export const buzz = (ms: number) => { try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(ms); } catch {} };

export const setLives = (lost: boolean) => document.querySelectorAll<HTMLElement>('#lv i').forEach((i, n) => { i.classList.toggle('off', n >= G.lives); if (lost && n === G.lives) { i.classList.remove('lost'); void i.offsetWidth; i.classList.add('lost'); } });
export function renderLives() { $('lv').innerHTML = '<i></i>'.repeat(maxLives()); setLives(false); }
export function renderMods() {
  const ups = [...UPS, ...TRADES].filter((u) => lv(u.id)).map((u) => `<span title="${u.name}">${svg(u.id)}${lv(u.id) > 1 ? lv(u.id) : ''}</span>`).join('');
  $('mods').innerHTML = ups + (G.relic ? `<span class="relic" title="${RELICS.find((r) => r.id === G.relic)!.name}">${svg(G.relic)}${G.relicLv > 1 ? 2 : ''}</span>` : '');
}

export function updateLabels() {
  const t = input.last === 'touch';
  $('land').innerHTML = t ? 'Land' : 'Land <kbd>Esc</kbd>';
  $('ctl').innerHTML = t ? 'Drag to steer · Land to exit' : 'Mouse or <kbd>WASD</kbd> to steer';
}
export const setLast = (k: Kind) => { if (input.last === k) return; const was = input.last === 'touch'; input.last = k; if (was !== (k === 'touch')) updateLabels(); };

export const showRank = () => ($('rank0').textContent = `Rank ${rankOf(P.xp)}`);
export function bank() { const add = G.score - G.banked; if (add <= 0) return; G.banked = G.score; P.xp += add; store.set('lg01-xp', P.xp); showRank(); }
function rankLine(prev: number) {
  const r = rankOf(P.xp), lo = RANKS[r - 1], hi = RANKS[r], unlock = UPS.find((u) => u.rank === r);
  $('rankT').textContent = r > prev && unlock ? `Rank ${r} · ${unlock.name} unlocked` : hi ? `Rank ${r} · ${(hi - P.xp).toLocaleString('en-US')} to Rank ${r + 1}` : `Rank ${r} · Max rank`;
  $('rankFill').style.transform = `scale3d(${hi ? clamp((P.xp - lo) / (hi - lo)).toFixed(3) : 1}, 1, 1)`;
}
export const saveBest = () => {
  if (G.score > P.best) { P.best = G.score; store.set('lg01-best', P.best); }
  $('best0').textContent = $('best1').textContent = fmt(P.best);
};

function pick<T>(list: T[], n: number) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
const optHTML = (o: Option, i: number, kind: OptKind) => {
  const L = kind === 'relic' ? (G.relic === o.id ? G.relicLv : 0) : lv(o.id), max = kind === 'up' ? o.max! : kind === 'relic' ? 2 : 1;
  const pips = max > 1 ? `<span class="pp">${Array.from({ length: max }, (_, k) => `<i class="${k < L ? 'on' : k === L ? 'nx' : ''}"></i>`).join('')}</span>` : '';
  const tag = kind === 'trade' ? '<span class="new tr">Trade-off</span>' : kind === 'up' && o.rank! > 1 && !L ? '<span class="new">New</span>' : kind === 'relic' && G.relic && G.relic !== o.id ? '<span class="new">Replace</span>' : '';
  const bad = kind === 'trade' ? `<span class="bad">${o.bad}</span>` : '';
  return `<button type="button" class="opt ${kind}" data-id="${o.id}" data-kind="${kind}">${tag}<kbd>${i + 1}</kbd>${svg(o.id)}<span class="tx"><span class="nm">${o.name}</span><span class="ds">${o.d(L)}</span>${bad}${pips}</span></button>`;
};

export function showCard(mode: Mode) {
  G.card = true; G.mode = mode; D.hero.classList.add('carded'); saveBest();
  const parts = { score: $('cardScore'), sub: $('cardSub'), rank: $('cardRank'), lbl: $('optsT'), opts: $('opts'), heat: $('heat'), back: $('cardBack'), more: $('cardMore') };
  const show = (on: string[]) => Object.entries(parts).forEach(([k, el]) => (el.hidden = !on.includes(k)));
  let opts: [Option, OptKind][] = [];
  if (mode === 'draft') {
    $('cardT').textContent = `Wave ${String(G.wave).padStart(2, '0')} clear · Choose an upgrade`;
    const rank = rankOf(P.xp);
    const ups = UPS.filter((u) => u.rank! <= rank && lv(u.id) < u.max!).map((o): [Option, OptKind] => [o, 'up']);
    const trades = G.wave > 1 ? TRADES.filter((t) => !has(t.id)).map((o): [Option, OptKind] => [o, 'trade']) : [];
    opts = pick(ups, 3);
    if (trades.length && rand() < 0.4 && opts.length) opts[opts.length - 1] = pick(trades, 1)[0];
    if (G.lives < maxLives()) { if (opts.length >= 3) opts[2] = [REPAIR, 'repair']; else opts.push([REPAIR, 'repair']); }
    if (!opts.length) { G.card = false; D.hero.classList.remove('carded'); G.nextWave = performance.now() + 900; return; }
    show(['opts']);
  } else if (mode === 'pause') {
    $('cardT').textContent = 'Paused'; parts.more.textContent = 'Resume'; show(['back', 'more']);
  } else {
    const prev = rankOf(P.xp); bank(); rankLine(prev);
    $('cardScore').textContent = fmt(G.score);
    if (mode === 'relic') {
      $('cardT').textContent = G.sector > 1 ? `Sector ${G.sector} clear` : 'Sortie complete';
      $('cardSub').textContent = G.score >= P.best && G.score > 0 ? 'New best' : `Best ${fmt(P.best)}`;
      const cur = RELICS.find((r) => r.id === G.relic);
      opts = (cur ? [...(G.relicLv < 2 ? [cur] : []), ...RELICS.filter((r) => r.id !== G.relic)] : pick(RELICS, 3)).map((o): [Option, OptKind] => [o, 'relic']);
      $('optsT').textContent = G.relic ? 'Upgrade or replace your relic to keep flying' : 'Choose a relic to keep flying';
      parts.heat.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.h) === G.heat)));
      show(['score', 'sub', 'rank', 'lbl', 'opts', 'heat', 'back']);
    } else {
      $('cardT').textContent = 'Mission over';
      $('cardSub').textContent = G.score >= P.best && G.score > 0 ? 'New best' : `Best ${fmt(P.best)}`;
      parts.more.textContent = 'Fly again'; show(['score', 'sub', 'rank', 'back', 'more']);
    }
  }
  $('opts').innerHTML = opts.map(([o, kind], i) => optHTML(o, i, kind)).join('');
  D.card.dataset.mode = mode; D.card.classList.add('on');
  live(`${$('cardT').textContent}. ${opts.map(([o], i) => `${i + 1}, ${o.name}`).join('. ')}`);
  if (input.last === 'key') setTimeout(() => { const f = D.card.querySelector<HTMLElement>('.opt') || parts.more; if (f && !f.hidden) f.focus({ preventScroll: true }); }, 60);
}

export function hideCard() { G.card = false; G.mode = ''; D.hero.classList.remove('carded'); D.card.classList.remove('on'); if (document.activeElement && D.card.contains(document.activeElement)) D.hud.focus({ preventScroll: true }); }
