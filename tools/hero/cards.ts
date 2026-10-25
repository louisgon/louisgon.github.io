import { devices, type Page } from 'playwright';
import { clearCards, covers, hold, lg, noColons, page, shot, st, topDown, touch, track, type Ctx } from './lib';

const cardOn = (p: Page) => p.waitForFunction(() => (window as unknown as { __lg: { st: () => { card: boolean } } }).__lg.st().card, null, { timeout: 5000 });
const prs = (p: Page) => p.evaluate(() => [...document.querySelectorAll('#opts .opt')].map((o) => ({ k: o.className, tag: o.querySelector('.tg')?.textContent ?? '', d: o.querySelector('.ds')?.textContent ?? '', pr: o.querySelector('.pr')?.textContent ?? '' })));

async function toCache(p: Page, w: number, h: number) {
  let mode = '', opts: string[] = [], j = 8; const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    j = -j;
    const s = await st(p);
    if (s.card && s.mode === 'cache') { mode = s.mode; opts = (await lg(p, 'opts()')) as string[]; break; }
    if (s.card && s.mode === 'level') { await p.keyboard.press('Digit1'); await p.waitForTimeout(500); continue; }
    if (s.cache) await p.mouse.move(Math.max(30, Math.min(w - 30, s.csx)) + j, Math.max(90, Math.min(h - 30, s.csy)), { steps: 2 });
    await p.waitForTimeout(100);
  }
  return { mode, opts };
}

export async function cards(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await p.waitForTimeout(1000); await hold(p); await topDown(p);
    let card = false; const t0 = Date.now();
    while (Date.now() - t0 < 30000) { const s = await st(p); if (s.card && s.mode === 'level') { card = true; break; } const k = (Date.now() - t0) / 1000; await p.mouse.move(720 + Math.sin(k) * 260, 450 + Math.cos(k) * 200, { steps: 2 }); await p.waitForTimeout(120); }
    if (card) await p.waitForFunction(() => document.querySelectorAll('#opts .opt').length === 3, null, { timeout: 3000 }).catch(() => {});
    const n = await p.evaluate(() => document.querySelectorAll('#opts .opt').length);
    c.ok('levelling pauses on a card with three choices', card && n === 3, `options ${n}, level ${(await st(p)).level}`);
    const sub = await p.evaluate(() => document.getElementById('cardSub')!.textContent), first = await prs(p);
    c.ok('the level card shows the four weapon and four boost slots', sub === 'Weapons 1 of 4 · Boosts 0 of 4', sub);
    c.ok('every weapon card names its paired boost, new ones included', first.filter((o) => o.k.includes('kw')).every((o) => /^Evolves with /.test(o.pr)), first);
    await shot(c, p, 'cards-level');
    const cv = await covers(p);
    c.ok('the level card leaves the ship visible on desktop', !cv.over, cv);
    c.ok('no colons or dashes on the level card', !(await noColons(p)).length, await noColons(p));
    const s0 = await st(p), before = s0.W.join() + s0.B.join();
    await p.keyboard.press('Digit1'); await p.waitForTimeout(400);
    const s1 = await st(p);
    c.ok('choosing with 1 resumes and changes the build', !s1.card && s1.W.join() + s1.B.join() !== before, `${before} to ${s1.W.join()} ${s1.B.join()}`);
    c.ok('a card exit protects the ship for 0.6 seconds', s1.inv > 0 && s1.inv <= 0.6, s1.inv);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(400); const kd = await st(p);
    await lg(p, 'level()'); await cardOn(p); await p.waitForTimeout(450);
    await p.keyboard.press('Digit1'); for (let i = 0; i < 6; i++) { await p.keyboard.down('KeyD'); await p.waitForTimeout(60); }
    const kh = await st(p); await p.keyboard.up('KeyD');
    c.ok('a key held through a card needs a fresh press before the ship flies again', kd.vx > 200 && !kh.card && kh.keys === 0 && Math.abs(kh.vx) < 40, { before: kd.vx, after: kh.vx, keys: kh.keys, card: kh.card });
    await lg(p, 'xp(400)'); await cardOn(p); await p.waitForTimeout(450);
    const q0 = await st(p), tq = track(p, 1600, ['card', 'clock']);
    await p.keyboard.press('Digit1'); await p.waitForTimeout(500); await p.keyboard.press('Digit1');
    const tk = await tq;
    c.ok('queued level cards hand straight to the next with no flight in between', tk.card.every(Boolean) && Math.max(...tk.clock) === Math.min(...tk.clock) && tk.card.length > 30, { frames: tk.card.length, closed: tk.card.filter((v) => !v).length, clock: [Math.min(...tk.clock), Math.max(...tk.clock)], level: q0.level });
    await clearCards(p);
    await lg(p, "god(true); window.__lg.give('pulse', 5); window.__lg.give('cooldown', 1); window.__lg.xp(120)");
    await p.waitForFunction(() => (window as unknown as { __lg: { st: () => { card: boolean } } }).__lg.st().card, null, { timeout: 5000 }); await p.waitForTimeout(450);
    const lo = (await lg(p, 'opts()')) as string[];
    c.ok('level cards never offer an evolution, even with a maxed weapon and its boost', lo.length > 0 && !lo.some((o) => o.startsWith('e:')), lo);
    await clearCards(p);
    c.ok('the first capital ship is scheduled 100 seconds in', (await st(p)).nb === 100, (await st(p)).nb);
    await lg(p, 'boss()'); await p.waitForTimeout(2500); await shot(c, p, 'cards-boss');
    c.ok('the capital ship shows its health bar', await p.evaluate(() => document.getElementById('bossBar')!.classList.contains('on')));
    await lg(p, 'killBoss()'); await p.waitForTimeout(1600);
    const cs = await st(p);
    c.ok('a capital ship kill drops a gold cache', cs.cache && cs.eligible.includes('pulse'), cs);
    await p.waitForTimeout(150); await shot(c, p, 'cards-cache');
    const ev = await toCache(p, 1440, 900);
    await p.waitForTimeout(450); await shot(c, p, 'cards-cache-card');
    c.ok('flying over the cache opens the evolution card', ev.mode === 'cache' && ev.opts.includes('e:railstorm'), ev);
    c.ok('no colons or dashes on the cache card', !(await noColons(p)).length, await noColons(p));
    await p.keyboard.press('Digit1'); await p.waitForTimeout(500);
    c.ok('choosing from the cache evolves the weapon', (await st(p)).evos.includes('railstorm'), (await st(p)).evos);
    await p.waitForTimeout(600); await shot(c, p, 'cards-evolved');
    await clearCards(p);
    await lg(p, 'cache(0)');
    const rw = await toCache(p, 1440, 900);
    const full = await st(p);
    c.ok('a cache with nothing to evolve offers only rewards that do something', rw.mode === 'cache' && rw.opts.length >= 2 && rw.opts.every((o) => o.startsWith('x:')) && rw.opts.includes('x:windfall') && (full.hull < full.hullMax || !rw.opts.includes('x:refit')), { ...rw, hull: full.hull });
    await p.waitForTimeout(450); await p.keyboard.press('Digit1'); await clearCards(p);
    await lg(p, 'exhaust()'); await lg(p, 'xp(200)'); await cardOn(p); await p.waitForTimeout(450);
    const ex = (await lg(p, 'opts()')) as string[], eh = await st(p);
    c.ok('an exhausted pool at full hull offers salvage and no repair it cannot make', eh.hull === eh.hullMax && ex.join() === 'x:salvage', { opts: ex, hull: eh.hull, max: eh.hullMax, W: eh.W, B: eh.B });
    await clearCards(p); await lg(p, 'god(false)');
    const hb = (await st(p)).hull;
    await lg(p, 'hurt()'); await p.waitForTimeout(80);
    const h = await st(p);
    c.ok('a hit costs hull, pulses the vignette and shakes', h.hull === hb - 1 && h.vig > 0.4 && h.shake > 0.1, `hull ${hb} to ${h.hull}, vig ${h.vig}, shake ${h.shake}`);
    for (let i = 0; i < 4; i++) { await lg(p, 'hurt()'); await p.waitForTimeout(150); }
    await p.waitForTimeout(1700);
    const ov = await st(p);
    c.ok('losing the hull ends the run with results over the top down view', ov.over && ov.card && ov.mode === 'over' && ov.view === 1, ov);
    await shot(c, p, 'cards-results');
    c.ok('results show time, kills, level, build and best', await p.evaluate(() => { const k = document.getElementById('card')!; return !!(k.querySelector('#cardBig')!.textContent && k.querySelector('#cardStats b') && k.querySelector('#cardBuild span') && /best/i.test(k.querySelector('#cardSub')!.textContent!)); }));
    c.ok('the best time is saved', await p.evaluate(() => localStorage.getItem('lg01-top-best') !== null));
    c.ok('no colons or dashes on the results', !(await noColons(p)).length, await noColons(p));
    await p.click('#cardMore'); await p.waitForTimeout(500);
    const fa = await st(p);
    c.ok('Fly again restarts in the top down view without diving again', fa.on && fa.clock < 1 && !fa.over && fa.top, fa);
    c.ok('desktop cards console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(800); await hold(p); await topDown(p); await p.mouse.move(720, 450);
    await lg(p, "god(true); window.__lg.give('pulse', 5); window.__lg.give('magnet', 3); window.__lg.give('damage', 3); window.__lg.give('area', 3); window.__lg.give('thrust', 1)");
    await lg(p, 'boss()'); await p.waitForTimeout(300); await lg(p, 'killBoss()'); await p.waitForTimeout(1600);
    const sw = await toCache(p, 1440, 900), card = await prs(p);
    c.ok('full boost slots never lock out an evolution, the cache trades a boost for the pair', sw.mode === 'cache' && sw.opts[0] === 'e:railstorm' && card[0]?.pr === 'Trades Thrusters for Cooldown', { ...sw, pr: card[0]?.pr });
    await p.waitForTimeout(450); await p.keyboard.press('Digit1'); await p.waitForTimeout(400);
    const tr = await st(p);
    c.ok('the trade swaps the boost and evolves the weapon', tr.evos.includes('railstorm') && tr.B.includes('cooldown1') && !tr.B.some((b) => b.startsWith('thrust')) && tr.B.length === 4, { B: tr.B, evos: tr.evos });
    const ds = (await lg(p, 'descs()')) as Record<string, string>;
    c.ok('card descriptions match the balance tables', ds['pulse1'] === 'Bolt damage up 25%, fires 7% faster' && ds['arc2'] === 'Arc damage up 38%, fires 8% faster' && ds['wing2'] === 'Orbit 22% wider and 8% faster, hits 43% harder' && ds['cooldown0'] === 'Reload time 100% to 94% for Pulse, Arc, Missiles and Nova', ds);
    c.ok('no description uses a colon or a dash', Object.values(ds).every((d) => !/[:—–]/.test(d)), Object.values(ds).filter((d) => /[:—–]/.test(d)));
    c.ok('slot cards console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1200);
    const T = await touch(context, p), r = await st(p);
    await T('touchStart', r.rx, r.ry); await p.waitForTimeout(450); await T('touchEnd'); await topDown(p);
    await T('touchStart', 200, 600); await T('touchMove', 290, 600); await p.waitForTimeout(400); const m0 = await st(p);
    await lg(p, 'level()'); await cardOn(p); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector<HTMLElement>('#opts .opt')!.click()); await p.waitForTimeout(150); const m1 = await st(p); await p.waitForTimeout(500); const m2 = await st(p);
    c.ok('a thumb held through a card waits for fresh movement', m0.vx > 100 && !m2.card && Math.hypot(m2.x - m1.x, m2.y - m1.y) < 12, { before: m0.vx, held: [m2.x - m1.x, m2.y - m1.y] });
    await T('touchMove', 330, 600); await p.waitForTimeout(400); const m3 = await st(p); await T('touchEnd');
    c.ok('moving the held thumb steers again', m3.x - m2.x > 30, m3.x - m2.x);
    await lg(p, 'xp(30)'); await p.waitForFunction(() => (window as unknown as { __lg: { st: () => { card: boolean } } }).__lg.st().card, null, { timeout: 5000 }); await p.waitForTimeout(900);
    const pc = await covers(p);
    await shot(c, p, 'cards-phone-level');
    c.ok('the level card leaves the ship visible on a phone', !pc.over, pc);
    for (let i = 0; i < 6 && (await st(p)).card; i++) { const o = await p.evaluate(() => { const b = document.querySelector<HTMLElement>('#opts .opt')!.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }); await p.touchscreen.tap(o[0], o[1]); await p.waitForTimeout(700); }
    c.ok('a phone tap chooses and resumes', !(await st(p)).card);
    c.ok('phone cards console clean', !errors.length, errors);
    await context.close();
  }
}
