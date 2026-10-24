import { devices, type BrowserContextOptions } from 'playwright';
import { hold, lg, page, shot, st, topDown, type Ctx } from './lib';

async function swarm(c: Ctx, opts: BrowserContextOptions, tag: string) {
  const { p, context, errors } = await page(c, opts);
  await p.waitForTimeout(800); await hold(p); await topDown(p);
  await lg(p, "god(true); window.__lg.autopilot(true); window.__lg.time(60); window.__lg.give('wing', 2)");
  await p.waitForTimeout(6000);
  let on = 0, all = 0, n = 0;
  for (let i = 0; i < 40; i++) { const s = await st(p); if (!s.card) { on += s.onscreen; all += s.enemies; n++; } await p.waitForTimeout(250); }
  await lg(p, 'freeze(true)'); await p.waitForTimeout(60); await shot(c, p, `world-${tag}`); await lg(p, 'freeze(false)');
  const s = await st(p);
  await context.close();
  return { z: s.z, u: s.u, vw: s.vw, vh: s.vh, short: Math.round(Math.min(s.vw, s.vh) / s.u), onscreen: +(on / n).toFixed(1), enemies: +(all / n).toFixed(1), share: +(on / Math.max(1, all)).toFixed(2), errors };
}

export async function world(c: Ctx) {
  const desk = await swarm(c, { viewport: { width: 1440, height: 900 } }, 'desk');
  const phone = await swarm(c, { ...devices['Pixel 7'] }, 'phone');
  c.ok('desktop keeps the sketch camera', desk.z === 1 && desk.vw === 1440, desk);
  c.ok('narrow phones zoom out so the visible world is comparable to desktop', phone.z < 1 && phone.short >= desk.short * 0.9, { desk: desk.short, phone: phone.short, z: phone.z });
  c.ok('the phone swarm reaches the screen', phone.share >= desk.share * 0.85 && phone.onscreen >= 12, { desk, phone });
  c.ok('world console clean', !desk.errors.length && !phone.errors.length, [...desk.errors, ...phone.errors]);

  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
  await p.waitForTimeout(800); await hold(p); await topDown(p);
  await p.mouse.move(720, 450); await lg(p, 'god(true)'); await lg(p, 'stress(true)');
  await lg(p, 'heavies(6)'); await p.waitForTimeout(2500);
  const gaps: number[] = [];
  for (let i = 0; i < 16; i++) { gaps.push((await st(p)).gap); await p.waitForTimeout(250); }
  await shot(c, p, 'world-heavies');
  c.ok('heavies keep apart instead of stacking', Math.min(...gaps) >= 1.25, `closest pair ${Math.min(...gaps)} times their summed radius`);
  c.ok('heavies console clean', !errors.length, errors);
  await context.close();
}
