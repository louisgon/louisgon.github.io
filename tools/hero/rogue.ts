import { card, page, shot, type Ctx } from './lib';

async function run(c: Ctx, vp: 'desk' | 'phone', xp?: number) {
  const [w, h] = vp === 'desk' ? [1440, 900] : [390, 844], tag = `rogue-${vp}${xp ? '-rank3' : ''}`;
  const { p, context, errors } = await page(c, { viewport: { width: w, height: h }, deviceScaleFactor: 2 }, true);
  if (xp) { await p.evaluate((xp) => localStorage.setItem('lg01-xp', String(xp)), xp); await p.reload({ waitUntil: 'networkidle' }); }
  await p.waitForTimeout(1200);
  await p.mouse.move(w * 0.5, h * 0.72); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up();
  const t0 = Date.now(), seen = { drafts: 0, boss: false, relic: false, upgraded: false, sector: '', mods: 0, offered: new Set<string>() };
  while (Date.now() - t0 < 150000) {
    const s = await card(p);
    if (s.on) {
      await p.waitForTimeout(450);
      await shot(c, p, `${tag}-${s.mode}-${seen.drafts}`);
      s.opts.forEach((o) => seen.offered.add(o));
      if (s.mode === 'relic') {
        seen.relic = true;
        await p.keyboard.press('Digit1'); await p.waitForTimeout(2500);
        seen.sector = await p.evaluate(() => `${document.getElementById('msgB')!.textContent} / ${document.getElementById('msgS')!.textContent}`);
        seen.mods = await p.evaluate(() => document.getElementById('mods')!.children.length);
        await shot(c, p, `${tag}-sector2`);
        break;
      }
      const want = s.opts.findIndex((o) => /Wingman|Triple shot/.test(o));
      await p.keyboard.press(`Digit${want >= 0 ? want + 1 : 1}`); seen.drafts++;
      await p.waitForTimeout(300);
      continue;
    }
    if (!seen.boss && (await p.evaluate(() => document.getElementById('hero')!.classList.contains('bossing')))) { seen.boss = true; await p.waitForTimeout(3000); await shot(c, p, `${tag}-boss`); }
    const k = (Date.now() - t0) / 1000;
    await p.mouse.move(w * (0.5 + Math.sin(k * 0.9) * 0.3), h * (0.72 + Math.sin(k * 0.5) * 0.06), { steps: 4 });
    await p.waitForTimeout(220);
    if (seen.drafts === 3 && !seen.upgraded) { await shot(c, p, `${tag}-upgraded`); seen.upgraded = true; }
  }
  c.ok(`${tag} drafts after three waves`, seen.drafts >= 3, seen.drafts);
  c.ok(`${tag} monolith arrives`, seen.boss);
  c.ok(`${tag} relic card after the monolith`, seen.relic);
  c.ok(`${tag} sector 2 begins with its twist`, /Sector 2.*Shielded drones/.test(seen.sector), seen.sector);
  c.ok(`${tag} upgrades and relic show in the HUD`, seen.mods >= 2, seen.mods);
  if (xp) c.ok(`${tag} rank unlocks reach the draft`, [...seen.offered].some((o) => /Wingman|Arc discharge/.test(o)), [...seen.offered]);
  c.ok(`${tag} console clean`, !errors.length, errors);
  await context.close();
}

export async function rogue(c: Ctx) {
  await run(c, 'desk');
  await run(c, 'phone');
  await run(c, 'desk', 16000);
}
