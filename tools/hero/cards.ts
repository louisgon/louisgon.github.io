import { devices, type Page } from 'playwright';
import { clearCards, covers, hold, lg, noColons, page, shot, st, topDown, touch, type Ctx } from './lib';

async function toCache(p: Page, w: number, h: number) {
  let mode = '', opts: string[] = []; const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const s = await st(p);
    if (s.card && s.mode === 'cache') { mode = s.mode; opts = (await lg(p, 'opts()')) as string[]; break; }
    if (s.card && s.mode === 'level') { await p.keyboard.press('Digit1'); await p.waitForTimeout(500); continue; }
    if (s.cache) await p.mouse.move(Math.max(30, Math.min(w - 30, s.csx)), Math.max(90, Math.min(h - 30, s.csy)), { steps: 2 });
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
    await shot(c, p, 'cards-level');
    const cv = await covers(p);
    c.ok('the level card leaves the ship visible on desktop', !cv.over, cv);
    c.ok('no colons or dashes on the level card', !(await noColons(p)).length, await noColons(p));
    const s0 = await st(p), before = s0.W.join() + s0.B.join();
    await p.keyboard.press('Digit1'); await p.waitForTimeout(400);
    const s1 = await st(p);
    c.ok('choosing with 1 resumes and changes the build', !s1.card && s1.W.join() + s1.B.join() !== before, `${before} to ${s1.W.join()} ${s1.B.join()}`);
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
    c.ok('a cache with nothing to evolve offers a strong reward card', rw.mode === 'cache' && rw.opts.length === 3 && rw.opts.every((o) => o.startsWith('x:')), rw);
    await p.waitForTimeout(450); await p.keyboard.press('Digit1'); await clearCards(p); await lg(p, 'god(false)');
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
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1200);
    const T = await touch(context, p), r = await st(p);
    await T('touchStart', r.rx, r.ry); await p.waitForTimeout(450); await T('touchEnd'); await topDown(p);
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
