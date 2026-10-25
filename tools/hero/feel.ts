import type { Page } from 'playwright';
import { hold, lg, page, shot, st, topDown, track, type Ctx } from './lib';

const rim = (p: Page) => p.evaluate(() => {
  const c = document.getElementById('orbit') as HTMLCanvasElement, x = c.getContext('2d')!, w = c.width, h = c.height;
  const red = (x0: number, y0: number, sw: number, sh: number) => { const d = x.getImageData(x0, y0, sw, sh).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] - d[i + 2]; return Math.round(s / (d.length / 4)); };
  return { right: red(w - 8, h * 0.4, 6, h * 0.2), left: red(2, h * 0.4, 6, h * 0.2), top: red(w * 0.4, 2, w * 0.2, 6), bottom: red(w * 0.4, h - 8, w * 0.2, 6) };
});

export async function feel(c: Ctx) {
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
  await p.waitForTimeout(800); await hold(p); await topDown(p); await p.mouse.move(720, 450);
  await lg(p, "god(true); window.__lg.give('pulse', 5); window.__lg.give('missile', 5); window.__lg.time(70)");
  await lg(p, 'clear()'); await lg(p, 'squad(2, 0, 4)'); await lg(p, 'squad(0, 1, 3)'); await p.waitForTimeout(100);
  const hv = await track(p, 6000, ['stop', 'hv']);
  c.ok('heavy and elite kills flash where they die without stopping the game', hv.hv[0] >= 4 && hv.hv[hv.hv.length - 1] < hv.hv[0] && hv.stop.every((v) => v <= 0), { gunships: [hv.hv[0], hv.hv[hv.hv.length - 1]], stop: Math.max(...hv.stop) });
  for (let i = 0; i < 8 && (await st(p)).card; i++) { await p.keyboard.press('Digit1'); await p.waitForTimeout(450); }
  await lg(p, 'boss()'); await p.waitForTimeout(300); await lg(p, 'killBoss()'); const bs = await track(p, 200, ['stop']);
  c.ok('a capital kill still holds the frame', bs.stop.some((v) => v > 0), Math.max(...bs.stop));
  let cardBeforeReveal = false, flew = false; const t0 = Date.now();
  while (Date.now() - t0 < 16000) {
    const s = await st(p);
    if (s.card) { if (s.reveal > 0) cardBeforeReveal = true; await p.waitForTimeout(450); await p.keyboard.press('Digit1'); }
    else if (s.cache && !flew && s.reveal <= 0) { flew = true; await lg(p, 'cache(0)'); }
    else if (flew && !s.cache && /inbound|returns/.test(s.banner) && s.bannerOn > 0.9) break;
    await p.waitForTimeout(100);
  }
  const all = (await lg(p, 'notes()')) as string[], notes = all.slice(all.findIndex((x) => / down$/.test(x))), at = (n: string | RegExp) => notes.findIndex((x) => (typeof n === 'string' ? x === n : n.test(x)));
  const down = at(/ down$/), cache = at('cache'), firstCard = at(/^card:/), reward = at('card:cache'), evo = at('Railstorm'), banner = at(/inbound|returns/);
  c.ok('a capital kill plays in order, the kill, the cache, the reward, then the new fleet banner', down === 0 && cache > down && firstCard > cache && reward > cache && evo > reward && banner > evo && !cardBeforeReveal, notes);
  await shot(c, p, 'feel-banner');
  await lg(p, 'next()'); for (let i = 0; i < 30 && (await st(p)).bannerOn < 0.9; i++) await p.waitForTimeout(100);
  const b0 = await st(p); await p.keyboard.press('KeyP'); await p.waitForTimeout(1500); const bp = await st(p);
  await p.click('#cardMore'); await p.waitForTimeout(500); const b1 = await st(p);
  c.ok('a banner waits under a card and resumes where it was', b0.bannerOn > 0.9 && bp.bannerOn < 0.05 && b1.banner === b0.banner && b1.bannerOn > 0.5, { before: [b0.banner, b0.bannerOn], paused: bp.bannerOn, after: [b1.banner, b1.bannerOn] });
  await lg(p, 'level()'); await p.waitForFunction(() => (window as unknown as { __lg: { st: () => { card: boolean } } }).__lg.st().card, null, { timeout: 5000 }); await p.waitForTimeout(450);
  await p.keyboard.press('Digit1'); await p.waitForTimeout(150);
  const pick = await p.evaluate(() => ({ text: document.getElementById('pick')!.textContent ?? '', on: document.getElementById('pick')!.classList.contains('on'), hit: document.querySelectorAll('#build span.hit').length }));
  await shot(c, p, 'feel-pick');
  c.ok('a pick highlights its build slot and names it', pick.on && /^[A-Z][\w ]+ level \d$|^(Field repair|Salvage)$/.test(pick.text) && pick.hit === 1, pick);
  for (let i = 0; i < 6 && (await st(p)).card; i++) { await p.keyboard.press('Digit1'); await p.waitForTimeout(450); }
  await lg(p, 'clear()'); await lg(p, 'god(false)'); await p.waitForTimeout(1600);
  await lg(p, 'hurtAt(300, 0)'); await p.waitForTimeout(40); const r1 = await st(p), px1 = await rim(p);
  await shot(c, p, 'feel-hit-right');
  c.ok('a hit from the right glows at the right rim', r1.hitA === 0 && r1.hitT > 0.1 && px1.right > px1.left + 20, { angle: r1.hitA, rim: px1 });
  await p.waitForTimeout(1600); await lg(p, 'hurtAt(0, -300)'); await p.waitForTimeout(40); const r2 = await st(p), px2 = await rim(p);
  c.ok('a hit from above glows at the top rim and fades within 300ms', r2.hitA === 270 && px2.top > px2.bottom + 20, { angle: r2.hitA, rim: px2 });
  await p.waitForTimeout(320);
  c.ok('the rim cue has faded', (await st(p)).hitT === 0);
  c.ok('feel console clean', !errors.length, errors);
  await context.close();
}
