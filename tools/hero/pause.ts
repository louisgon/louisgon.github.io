import { card, page, playing, shot, type Ctx } from './lib';

export async function pause(c: Ctx) {
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, true);
  await p.waitForTimeout(1000);
  await p.mouse.move(720, 650); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up(); await p.waitForTimeout(2500);
  const before = await card(p);
  await p.evaluate(() => dispatchEvent(new Event('blur'))); await p.waitForTimeout(1500);
  const paused = await card(p); await shot(c, p, 'pause');
  await p.waitForTimeout(1500); const still = await card(p);
  await p.click('#cardMore'); await p.waitForTimeout(800); const resumed = await card(p);
  c.ok('flying before the pause', !before.on && (await playing(p)), before);
  c.ok('losing focus pauses', paused.on && paused.mode === 'pause' && paused.title === 'Paused', paused);
  c.ok('the score holds while paused', still.on && still.score === paused.score, { paused: paused.score, still: still.score });
  c.ok('Resume flies on', !resumed.on && (await playing(p)), resumed);
  c.ok('pause console clean', !errors.length, errors);
  await context.close();
}
