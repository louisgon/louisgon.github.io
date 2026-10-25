import type { Page } from 'playwright';
import { clearCards, hold, lg, noColons, page, playing, shot, st, topDown, type Ctx, type St } from './lib';

const viewAt = (p: Page, v: number) => p.waitForFunction((v) => (window as unknown as { __lg: { st: () => St } }).__lg.st().view >= v, v, { timeout: 3000 });

async function pauseBy(p: Page, fn: () => Promise<unknown>) {
  let s: St = await st(p);
  for (let i = 0; i < 6; i++) { await clearCards(p); await fn(); await p.waitForTimeout(400); s = await st(p); if (s.mode === 'pause') return s; if (s.card && s.mode === 'level') await p.keyboard.press('Digit1'); }
  return s;
}

export async function pause(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(1000);
    const r = await st(p); await p.mouse.move(r.rx, r.ry, { steps: 5 }); await p.waitForTimeout(150); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up();
    await viewAt(p, 0.25); await p.evaluate(() => dispatchEvent(new Event('blur')));
    const a = await st(p); await p.waitForTimeout(900); const b = await st(p);
    await shot(c, p, 'pause-boost');
    c.ok('losing focus during the boost pauses it where it is', a.card && a.mode === 'pause' && b.card && b.view === a.view && a.view < 0.7 && !b.top, { at: a.view, later: b.view, mode: b.mode });
    c.ok('the pause card shows over the held boost', await p.evaluate(() => { const k = document.getElementById('card')!, cs = getComputedStyle(k); return cs.visibility === 'visible' && +getComputedStyle(document.getElementById('hud')!).opacity > 0.9 && !(document.getElementById('hud') as HTMLElement).inert; }));
    await p.click('#cardMore'); const r0 = await st(p);
    await topDown(p, 3000).catch(() => {}); const r1 = await st(p);
    c.ok('Resume finishes the boost into the run with 0.6 seconds of protection', r0.inv === 0.6 && !r0.card && r1.top && r1.clock < 1, { inv: r0.inv, top: r1.top, clock: r1.clock });
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    c.ok('hiding the tab in flight pauses', (await st(p)).mode === 'pause');
    c.ok('boost pause console clean', !errors.length, errors);
    await context.close();
  }
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.waitForTimeout(1000); await hold(p); await topDown(p); await lg(p, 'god(true)'); await p.mouse.move(720, 450); await p.waitForTimeout(1500);
  c.ok('flying before the pause', (await st(p)).top);
  const paused = await pauseBy(p, () => p.evaluate(() => dispatchEvent(new Event('blur'))));
  await shot(c, p, 'pause');
  await p.waitForTimeout(1200); const still = await st(p);
  c.ok('losing focus pauses', paused.card && paused.mode === 'pause' && (await p.evaluate(() => document.getElementById('cardT')!.textContent)) === 'Paused', paused.mode);
  c.ok('the clock holds while paused', still.clock === paused.clock, `${paused.clock} then ${still.clock}`);
  c.ok('no colons or dashes on the pause card', !(await noColons(p)).length, await noColons(p));
  await p.click('#cardMore'); const back = await st(p); await p.waitForTimeout(600);
  const resumed = await st(p);
  c.ok('Resume protects the ship for 0.6 seconds', back.inv >= 0.55 && !back.card, back.inv);
  c.ok('Resume flies on', (!resumed.card || resumed.mode === 'level') && (await playing(p)) && resumed.clock > still.clock, resumed.clock);
  c.ok('P pauses', (await pauseBy(p, () => p.keyboard.press('KeyP'))).mode === 'pause');
  await p.click('#cardMore'); await p.waitForTimeout(300);
  const hidden = await pauseBy(p, () => p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }));
  c.ok('hiding the tab pauses', hidden.mode === 'pause', hidden.mode);
  c.ok('pause console clean', !errors.length, errors);
  await context.close();
}
