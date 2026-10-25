import { addShake, G, maxW, ship, srand, V, type BoostId, type Option, type WeapId } from './core';
import { fx, sparks } from './world';
import { bl, BOOST, EVO, gainXP, maxHull, mkW, needFor, wdesc, WEAP } from './weapons';
import { hideCard, live, msg, renderBuild, renderHull, showCard } from './hud';

const WIDS: WeapId[] = ['pulse', 'wing', 'arc', 'missile', 'nova'], BIDS: BoostId[] = ['magnet', 'damage', 'cooldown', 'area', 'thrust', 'hull'];
const pairOf = (id: BoostId) => WIDS.find((k) => WEAP[k].pair === id);
const boostPr = (id: BoostId) => { const k = pairOf(id), w = k && G.wm[k]; return !k ? 'No evolution pair' : w && !w.evo ? `Evolves ${WEAP[k].name}` : w ? '' : `Pairs with ${WEAP[k].name}`; };
const repair = (): Option => ({ kind: 'x', id: 'repair', name: 'Field repair', d: 'Restore one hull', icon: 'repair', L: 0, pr: '' });

export function options() {
  const pool: { w: number; o: Option }[] = [];
  for (const id of WIDS) {
    const w = G.wm[id], P = WEAP[id], pr = `Evolves with ${BOOST[P.pair].name}`;
    if (w) {
      if (w.evo) continue;
      if (w.lv < 5) pool.push({ w: 3 + w.lv * 0.6, o: { kind: 'w', id, L: w.lv, name: P.name, d: wdesc(id, w.lv), icon: id, pr } });
    } else if (G.W.length < maxW) pool.push({ w: 1.4, o: { kind: 'w', id, L: 0, name: P.name, d: wdesc(id, 0), icon: id, pr } });
  }
  for (const id of BIDS) {
    const L = bl(id); if (L >= 5 || (!L && G.B.length >= maxW)) continue;
    const k = pairOf(id), pw = k && G.wm[k] && !G.wm[k]!.evo ? G.wm[k]!.lv : 0;
    pool.push({ w: pw >= 2 ? 3 : L ? 2 : 1, o: { kind: 'b', id, L, name: BOOST[id].name, d: BOOST[id].d(L), icon: id, pr: boostPr(id) } });
  }
  const out: Option[] = [];
  for (let k = pool.length - 1; k >= 0 && out.length < 3; k--) {
    const o = pool[k].o, w = o.kind === 'w' && G.wm[o.id as WeapId], need = o.kind === 'b' ? WIDS.find((q) => { const x = G.wm[q]; return WEAP[q].pair === o.id && x && x.lv >= 5 && !x.evo; }) : null;
    if ((w && (G.miss[o.id as WeapId] || 0) >= 2) || (need && !o.L)) out.push(pool.splice(k, 1)[0].o);
  }
  while (out.length < 3 && pool.length) {
    let s = 0; for (const p of pool) s += p.w;
    let r = srand() * s, k = 0; while (k < pool.length - 1 && (r -= pool[k].w) > 0) k++;
    out.push(pool.splice(k, 1)[0].o);
  }
  for (const w of G.W) if (!w.evo && w.lv < 5) G.miss[w.id] = out.some((o) => o.kind === 'w' && o.id === w.id) ? 0 : (G.miss[w.id] || 0) + 1;
  if (!out.length) { if (G.hull < maxHull()) out.push(repair()); out.push({ kind: 'x', id: 'salvage', name: 'Salvage', d: 'Half a level of shards', icon: 'salvage', L: 0, pr: '' }); }
  return out;
}
const tradeFor = (id: WeapId) => { if (bl(WEAP[id].pair) || G.B.length < maxW) return null; const held = new Set(G.W.map((w) => WEAP[w.id].pair)); return G.B.filter((b) => !held.has(b)).sort((a, b) => bl(a) - bl(b))[0] ?? null; };
export const eligible = () => WIDS.filter((id) => { const w = G.wm[id]; return w && !w.evo && w.lv >= 5 && (bl(WEAP[id].pair) || tradeFor(id)); });
export function cacheOptions(): Option[] {
  const ev = eligible().map((id): Option => { const P = WEAP[id], t = tradeFor(id); return { kind: 'e', id: P.evo, name: EVO[P.evo].name, d: EVO[P.evo].d, icon: P.evo, L: 0, pr: t ? `Trades ${BOOST[t].name} for ${BOOST[P.pair].name}` : `${P.name} with ${BOOST[P.pair].name}` }; });
  if (ev.length) return ev.slice(0, 3);
  const name = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0]);
  const lowW = G.W.filter((w) => !w.evo && w.lv < 5).map((w) => WEAP[w.id].name), lowB = G.B.filter((b) => bl(b) < 5).map((b) => BOOST[b].name), out: Option[] = [];
  if (lowW.length) out.push({ kind: 'x', id: 'overdrive', name: 'Overdrive', d: `${name(lowW)} gain${lowW.length > 1 ? '' : 's'} a level`, icon: 'damage', L: 0, pr: 'Cache reward' });
  else if (lowB.length) out.push({ kind: 'x', id: 'surge', name: 'Surge', d: `${name(lowB)} gain${lowB.length > 1 ? '' : 's'} a level`, icon: 'damage', L: 0, pr: 'Cache reward' });
  out.push({ kind: 'x', id: 'windfall', name: 'Windfall', d: 'Two levels of shards at once', icon: 'salvage', L: 0, pr: 'Cache reward' });
  if (G.hull < maxHull()) out.push({ kind: 'x', id: 'refit', name: 'Full refit', d: 'Every hull restored', icon: 'hull', L: 0, pr: 'Cache reward' });
  return out;
}
export function openCache() {
  const c = G.cache!, U = V.U; G.cache = null;
  fx(2, c.x, c.y, 360 * U, 0.8, 0); fx(0, c.x, c.y, 160 * U, 0.45, 1); sparks(c.x, c.y, 26, 420 * U, 1, 9); addShake(0.2);
  showCard('cache', c.f);
}
export function choose(i: number) {
  const o = G.opts[i], fromCache = G.mode === 'cache', U = V.U; if (!o || !G.card || (G.mode !== 'level' && !fromCache)) return;
  const before = maxHull();
  if (o.kind === 'w') { const id = o.id as WeapId; let w = G.wm[id]; if (!w) { w = mkW(id); G.W.push(w); G.wm[id] = w; } else w.lv++; }
  else if (o.kind === 'b') { const id = o.id as BoostId; G.bm[id] = bl(id) + 1; if (!G.B.includes(id)) G.B.push(id); }
  else if (o.kind === 'e') {
    const from = EVO[o.id].from, w = G.wm[from]!, t = tradeFor(from), pair = WEAP[from].pair;
    if (t) { G.B[G.B.indexOf(t)] = pair; delete G.bm[t]; G.bm[pair] = 1; }
    w.evo = true; w.t = 0.1; msg(o.name, 'Evolution online', 1700, true); fx(2, ship.x, ship.y, 420 * U, 0.9, 0); fx(0, ship.x, ship.y, 220 * U, 0.5, 1); addShake(0.3); live(`${o.name}. Evolution online.`);
  }
  else if (o.id === 'repair') G.hull = Math.min(maxHull(), G.hull + 1);
  else if (o.id === 'salvage') G.xp += G.need * 0.5;
  else if (o.id === 'overdrive') { for (const w of G.W) if (!w.evo && w.lv < 5) w.lv++; msg('Overdrive', 'Weapons up a level', 1500, true); }
  else if (o.id === 'surge') { for (const b of G.B) G.bm[b] = Math.min(5, bl(b) + 1); msg('Surge', 'Boosts up a level', 1500, true); }
  else if (o.id === 'refit') { G.hull = maxHull(); msg('Full refit', 'Hull restored', 1500, true); }
  const after = maxHull(); if (after > before) G.hull += after - before;
  G.hull = Math.min(G.hull, maxHull());
  renderHull(); renderBuild();
  if (!fromCache) G.pend--;
  if (o.id === 'windfall') gainXP(G.need - G.xp + needFor(G.level + 1));
  if (o.id === 'salvage') gainXP(0);
  if (G.pend > 0 && !G.over) showCard('level'); else hideCard();
}
