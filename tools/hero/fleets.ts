import { devices, type Page } from 'playwright';
import { hold, lg, noColons, page, shot, st, topDown, waitFaction, type Ctx } from './lib';

const ORDER = [
  { id: 'fleet', cap: 'Rival flagship', banner: 'Rival fleet returns' },
  { id: 'pirate', cap: 'Pirate dreadnought', banner: 'Pirate raiders inbound' },
  { id: 'alien', cap: 'Hive mothership', banner: 'Alien swarm inbound' },
];

async function bannerUp(p: Page) {
  let s = await st(p);
  for (let i = 0; i < 20 && s.bannerOn < 0.9; i++) { if (s.card && (s.mode === 'level' || s.mode === 'cache')) await p.keyboard.press('Digit1'); await p.waitForTimeout(100); s = await st(p); }
  return s;
}
async function spawned(p: Page, ms: number) {
  await lg(p, 'mark()');
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await st(p); if (s.card && (s.mode === 'level' || s.mode === 'cache')) await p.keyboard.press('Digit1'); await p.waitForTimeout(150); }
  return st(p);
}

export async function fleets(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await p.waitForTimeout(800); await hold(p); await topDown(p);
    await lg(p, "god(true); window.__lg.time(40); window.__lg.give('pulse', 4)"); await p.mouse.move(720, 450);
    const s0 = await spawned(p, 3500);
    c.ok('the run starts with the Rival fleet', s0.faction === 'fleet' && s0.lap === 0 && s0.fresh.length > 0 && s0.fresh.every((k) => k.startsWith('fleet-')), s0.fresh);
    c.ok('every faction has its sprites ready before it is needed', s0.sprites.every(Boolean), s0.sprites);
    const seen: string[] = [], banners: string[] = [];
    let shotN = 0;
    for (let step = 1; step <= 3; step++) {
      const want = ORDER[step % 3], from = ORDER[(step - 1) % 3];
      await lg(p, 'boss()'); await p.waitForTimeout(300);
      const b = await st(p);
      c.ok(`the ${from.id} capital ship is named for its faction`, b.bossName === from.cap && b.boss > 0, b.bossName);
      await lg(p, 'bossAt(260, -60)'); await p.waitForTimeout(400); await shot(c, p, `fleets-capital-${from.id}`);
      const before = (await st(p)).fe[(step - 1) % 3];
      await lg(p, 'killBoss()'); await p.mouse.move(120, 450); await p.waitForTimeout(500);
      const k = await st(p);
      c.ok(`killing the ${from.id} capital ship drops the gold cache and queues the next faction`, k.boss === -1 && k.switching && k.faction === from.id, { boss: k.boss, switching: k.switching, faction: k.faction });
      const s = await waitFaction(p, step % 3); await p.mouse.move(720, 450);
      const on = await bannerUp(p);
      seen.push(s.faction); banners.push(on.banner);
      if (on.bannerOn >= 0.9) await shot(c, p, `fleets-banner-${shotN++}`);
      c.ok(`the ${want.id} take over after the ${from.id} capital ship falls`, s.faction === want.id && s.lap === (step === 3 ? 1 : 0), { faction: s.faction, lap: s.lap });
      c.ok(`a banner announces ${want.banner}`, on.banner === want.banner && on.bannerOn >= 0.9 && !/[:—–]/.test(on.banner + on.bannerSub), { banner: on.banner, sub: on.bannerSub, on: on.bannerOn });
      c.ok('no colons or dashes on the faction banner', !(await noColons(p)).length, await noColons(p));
      const after = await spawned(p, 4500);
      c.ok(`new spawns use the ${want.id} sprites`, after.fresh.length > 0 && after.fresh.every((x) => x.startsWith(`${want.id}-`)), after.fresh);
      c.ok(`ships of the ${from.id} peel away or finish their run`, after.fe[(step - 1) % 3] < Math.max(4, before * 0.5), { before, after: after.fe[(step - 1) % 3], all: after.fe });
      await shot(c, p, `fleets-play-${want.id}`);
    }
    c.ok('the order loops Rival fleet, pirates, aliens and back to the Rival fleet', seen.join() === 'pirate,alien,fleet', seen);
    await lg(p, 'boss()'); await p.waitForTimeout(300);
    const lap = await st(p);
    c.ok('the second lap numbers its capital ships', lap.bossName === 'Rival flagship 02', lap.bossName);
    await lg(p, 'god(false)'); for (let i = 0; i < 8; i++) { await lg(p, 'hurt()'); await p.waitForTimeout(150); }
    await p.waitForTimeout(1700);
    const far = await p.evaluate(() => document.getElementById('cardFar')!.textContent);
    await shot(c, p, 'fleets-results');
    c.ok('the results card says how far the run got', (await st(p)).mode === 'over' && far === 'Reached the Rival fleet on lap 02', far);
    c.ok('fleets console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1200); await lg(p, 'start()'); await topDown(p);
    await lg(p, 'god(true); window.__lg.time(40); window.__lg.boss()'); await p.waitForTimeout(300); await lg(p, 'killBoss()');
    await waitFaction(p, 1);
    const on = await bannerUp(p);
    await shot(c, p, 'fleets-phone-banner');
    const fit = await p.evaluate(() => { const r = document.getElementById('msg')!.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), innerWidth]; });
    c.ok('the faction banner fits a phone screen', on.faction === 'pirate' && on.bannerOn >= 0.9 && fit[0] >= 0 && fit[1] <= fit[2], { fit, banner: on.banner, on: on.bannerOn, card: on.mode });
    c.ok('phone fleets console clean', !errors.length, errors);
    await context.close();
  }
}
