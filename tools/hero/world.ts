import { devices, type BrowserContextOptions } from 'playwright';
import { atRest, hold, lg, page, shot, st, topDown, type Ctx } from './lib';

async function swarm(c: Ctx, opts: BrowserContextOptions, tag: string) {
  const { p, context, errors } = await page(c, opts);
  await p.waitForTimeout(800); await hold(p); await topDown(p);
  await lg(p, "god(true); window.__lg.autopilot(true); window.__lg.time(60); window.__lg.give('wing', 2)");
  await p.waitForTimeout(6000);
  let on = 0, all = 0, n = 0;
  for (let i = 0; i < 60; i++) { const s = await st(p); if (!s.card) { on += s.onscreen; all += s.enemies; n++; } await p.waitForTimeout(250); }
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
  c.ok('the phone swarm reaches the screen', phone.share >= desk.share * 0.6 && phone.onscreen >= 10, { desk, phone });
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

  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(800); await hold(p); await topDown(p); await p.mouse.move(720, 450);
    await lg(p, "god(true); window.__lg.time(60); window.__lg.give('missile', 3); window.__lg.give('nova', 3)"); await p.waitForTimeout(4000);
    for (let i = 0; i < 6 && (await st(p)).card; i++) { await p.keyboard.press('Digit1'); await p.waitForTimeout(450); }
    const s0 = await st(p);
    await p.setViewportSize({ width: 1000, height: 700 }); await p.waitForTimeout(500);
    const s1 = await st(p); await shot(c, p, 'world-resized');
    c.ok('a resize mid run rescales every ship to the new scale', s1.u !== s0.u && s1.enemies > 10 && s1.sizeErr < 0.001, { u: [s0.u, s1.u], enemies: s1.enemies, sizeErr: s1.sizeErr });
    c.ok('a width change mid run pauses', s1.card && s1.mode === 'pause', s1.mode);
    await p.click('#cardMore'); await p.waitForTimeout(1200); const s2 = await st(p);
    c.ok('the run flies on after a resize with the camera on LG-01', s2.clock > s1.clock && Math.abs(s2.sx - 500) < 30 && Math.abs(s2.sy - 350) < 30, { clock: [s1.clock, s2.clock], ship: [s2.sx, s2.sy] });
    await p.keyboard.press('Escape'); await p.waitForTimeout(250); await p.setViewportSize({ width: 1440, height: 900 });
    const rest = await atRest(p, 4000), r = await st(p);
    c.ok('a resize while landing still lands on the rest pose', rest && r.rx > 400 && r.rx < 1040 && r.ry > 300 && r.ry < 900, { rest, rx: r.rx, ry: r.ry });
    c.ok('resize console clean', !errors.length, errors);
    await context.close();
  }
}
