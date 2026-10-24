import { devices } from 'playwright';
import { atRest, box, page, playing, scrolled, st, topDown, touch, type Ctx } from './lib';

export async function swipe(c: Ctx) {
  const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
  await p.waitForTimeout(1200);
  const T = await touch(context, p), rounds: string[] = [];
  let ok = true;
  for (let r = 0; r < 4; r++) {
    const s = await st(p);
    await T('touchStart', s.rx, s.ry); await p.waitForTimeout(420); await T('touchEnd'); await p.waitForTimeout(200);
    const flew = await playing(p);
    if (r % 2) { await topDown(p); const [lx, ly] = await box(p, 'land'); await p.touchscreen.tap(lx, ly); } else await p.keyboard.press('Escape');
    const landed = await atRest(p);
    await T('touchStart', 200, 640); for (let i = 1; i <= 10; i++) { await T('touchMove', 200, 640 - i * 30); await p.waitForTimeout(16); } await T('touchEnd'); await p.waitForTimeout(900);
    const y = await scrolled(p); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
    rounds.push(`round ${r} flew ${flew} landed ${landed} swipe ${y}`); ok &&= flew && landed && y > 0;
  }
  c.ok('the phone swipe scrolls after every landing', ok, rounds);
  c.ok('swipe console clean', !errors.length, errors);
  await context.close();
}
