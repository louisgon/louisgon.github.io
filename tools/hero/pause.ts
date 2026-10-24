import type { Page } from 'playwright';
import { clearCards, hold, lg, noColons, page, playing, shot, st, topDown, type Ctx, type St } from './lib';

async function pauseBy(p: Page, fn: () => Promise<unknown>) {
  let s: St = await st(p);
  for (let i = 0; i < 6; i++) { await clearCards(p); await fn(); await p.waitForTimeout(400); s = await st(p); if (s.mode === 'pause') return s; if (s.card && s.mode === 'level') await p.keyboard.press('Digit1'); }
  return s;
}

export async function pause(c: Ctx) {
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.waitForTimeout(1000); await hold(p); await topDown(p); await lg(p, 'god(true)'); await p.mouse.move(720, 450); await p.waitForTimeout(1500);
  c.ok('flying before the pause', (await st(p)).top);
  const paused = await pauseBy(p, () => p.evaluate(() => dispatchEvent(new Event('blur'))));
  await shot(c, p, 'pause');
  await p.waitForTimeout(1200); const still = await st(p);
  c.ok('losing focus pauses', paused.card && paused.mode === 'pause' && (await p.evaluate(() => document.getElementById('cardT')!.textContent)) === 'Paused', paused.mode);
  c.ok('the clock holds while paused', still.clock === paused.clock, `${paused.clock} then ${still.clock}`);
  c.ok('no colons or dashes on the pause card', !(await noColons(p)).length, await noColons(p));
  await p.click('#cardMore'); await p.waitForTimeout(600);
  const resumed = await st(p);
  c.ok('Resume flies on', (!resumed.card || resumed.mode === 'level') && (await playing(p)) && resumed.clock > still.clock, resumed.clock);
  c.ok('P pauses', (await pauseBy(p, () => p.keyboard.press('KeyP'))).mode === 'pause');
  await p.click('#cardMore'); await p.waitForTimeout(300);
  const hidden = await pauseBy(p, () => p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }));
  c.ok('hiding the tab pauses', hidden.mode === 'pause', hidden.mode);
  c.ok('pause console clean', !errors.length, errors);
  await context.close();
}
