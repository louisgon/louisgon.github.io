import { atRest, hold, page, st, topDown, type Ctx } from './lib';

export async function release(c: Ctx) {
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
  await p.waitForTimeout(1000); await hold(p); await topDown(p);
  await p.keyboard.press('Escape');
  c.ok('the run lands', await atRest(p));
  c.ok('the game art is still ready right after landing', (await st(p)).ready);
  await p.waitForTimeout(21000);
  c.ok('the game art is released 20 seconds after landing', !(await st(p)).ready);
  await hold(p);
  c.ok('a run started after the release reloads its art and flies', await topDown(p, 10000).then(() => true, () => false));
  c.ok('release console clean', !errors.length, errors);
  await context.close();
}
