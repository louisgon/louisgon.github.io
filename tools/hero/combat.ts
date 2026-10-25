import { hold, lg, page, st, topDown, type Ctx } from './lib';

type Hits = { hz: number; dealt?: number; want?: number; hits?: number; n?: number };

export async function combat(c: Ctx) {
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
  await p.waitForTimeout(800); await hold(p); await topDown(p); await lg(p, 'god(true)'); await p.mouse.move(720, 450);

  const nova: Hits[] = [];
  for (const hz of [20, 30, 60, 120, 144]) nova.push((await lg(p, `novaHits(${hz})`)) as Hits);
  c.ok('two overlapping Nova rings hit an enemy once each at every frame rate', nova.every((r) => r.dealt === r.want), nova);

  const bolts: Hits[] = [];
  for (const hz of [20, 30, 60]) bolts.push((await lg(p, `boltHits(${hz})`)) as Hits);
  c.ok('pulse bolts never tunnel through an interceptor at 20, 30 or 60 Hz', bolts.every((r) => r.hits === r.n), bolts);

  const line = (await lg(p, 'railLine()')) as number[];
  c.ok('a rail pierces the six nearest ships along its path in order', line.join() === '60,110,160,210,260,310', line);
  const par = (await lg(p, 'railCap(0, 80)')) as { hit: boolean }, perp = (await lg(p, `railCap(${Math.PI / 2}, 130)`)) as { hit: boolean };
  c.ok('a rail hits a capital only where its hull is', !par.hit && perp.hit, { parallel80: par, perpendicular130: perp });

  const pulse = (await lg(p, "dps('pulse', 5, false)")) as number, rail = (await lg(p, "dps('pulse', 5, true)")) as number;
  c.ok('Railstorm deals at least Pulse level 5 damage to a lone capital', rail >= pulse && pulse > 40, { pulse5: pulse, railstorm: rail });
  await lg(p, 'unfreeze()');

  await lg(p, 'level()'); await p.waitForFunction(() => (window as unknown as { __lg: { st: () => { card: boolean } } }).__lg.st().card, null, { timeout: 5000 });
  await lg(p, 'zap()'); const a = await st(p); await p.waitForTimeout(1500); const b = await st(p);
  c.ok('rendering and time on a card never draw from the simulation random stream', a.card && b.card && a.seed === b.seed, { before: a.seed, after: b.seed });
  for (let i = 0; i < 8 && (await st(p)).card; i++) { await p.keyboard.press('Digit1'); await p.waitForTimeout(450); }
  await lg(p, 'freeze(true)'); await p.waitForTimeout(100); await lg(p, 'zap()'); const f0 = await st(p); await p.waitForTimeout(800); const f1 = await st(p); await lg(p, 'freeze(false)');
  c.ok('a frozen frame loop leaves the simulation random stream alone', !f0.card && f0.seed === f1.seed, { before: f0.seed, after: f1.seed });
  c.ok('combat console clean', !errors.length, errors);
  await context.close();
}
