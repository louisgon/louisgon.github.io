import { atRest, box, hold, lg, monotone, page, playing, scrolled, shot, space, st, topDown, views, type Ctx } from './lib';

export async function land(c: Ctx) {
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.waitForTimeout(1000); await hold(p); await topDown(p);
  await p.mouse.move(720, 450); await p.waitForTimeout(2000);
  const tr = views(p, 1300); await p.keyboard.press('Escape'); const vs = await tr;
  const zeroAt = vs.findIndex((v) => v === 0);
  c.ok('Escape lands by playing the dive in reverse in about a second', vs[0] > 0.9 && zeroAt > 30 && zeroAt < 80 && monotone(vs, -1), `${vs.length} frames, zero at ${zeroAt}`);
  const rl = await st(p);
  c.ok('landing returns the orbit hero at rest', (await atRest(p)) && Math.abs(rl.rx - 720) < 30 && Math.abs(rl.ry - 594) < 30, `${rl.rx},${rl.ry}`);
  c.ok('the HUD is inert after landing', await p.evaluate(() => (document.getElementById('hud') as HTMLElement).inert));
  c.ok('landing shows the toast', await p.evaluate(() => document.getElementById('toast')!.classList.contains('on')));
  await shot(c, p, 'land-toast');
  await p.mouse.move(700, 300); await space(p);
  c.ok('a Space hold starts without scrolling', (await playing(p)) && (await scrolled(p)) === 0);
  await topDown(p);
  const [lx, ly] = await box(p, 'land'); await p.mouse.click(lx, ly);
  c.ok('the Land button lands', await atRest(p));
  await space(p); await topDown(p); await p.mouse.wheel(0, 300); await p.waitForTimeout(1300);
  c.ok('a wheel lands and scrolls the page', !(await st(p)).on && (await scrolled(p)) > 50, await scrolled(p));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1200);
  c.ok('scrolling away mid landing still settles back at rest', await atRest(p));
  await space(p); await topDown(p); await p.evaluate(() => scrollTo(0, 120)); await p.waitForTimeout(1300);
  c.ok('a scroll lands', !(await st(p)).on);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1200);
  await space(p); await p.waitForTimeout(500); const md = await st(p); await p.keyboard.press('Escape');
  c.ok('Escape mid dive reverses from where it was', md.view > 0 && md.view < 1 && (await atRest(p)), md.view);
  await space(p); await topDown(p);
  for (let i = 0; i < 3; i++) { await lg(p, 'hurt()'); await p.waitForTimeout(150); }
  await p.waitForTimeout(1700);
  const tr2 = views(p, 1300); await p.click('#cardBack'); const v2 = await tr2;
  c.ok('Land from results plays the reverse too', v2[0] === 1 && monotone(v2, -1) && v2.includes(0) && v2.some((v) => v > 0.2 && v < 0.8), `${v2.length} frames`);
  c.ok('the ship is back at rest after landing from results', await atRest(p));
  await shot(c, p, 'land-results-rest');
  await space(p); await p.waitForTimeout(300);
  await p.evaluate(() => (window as unknown as { __y: (id: string, k: number) => void }).__y('work', 0)); await p.waitForTimeout(800);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  c.ok('leaving the hero mid dive lands and settles at rest', await atRest(p));
  c.ok('landing console clean', !errors.length, errors);
  await context.close();
}
