import { atRest, hold, lg, page, playing, shot, space, st, top, topDown, views, type Ctx } from './lib';

const focused = (p: import('playwright').Page) => p.evaluate(() => { const e = document.activeElement as HTMLElement; return { id: e.id, text: (e.textContent || e.tagName).trim().slice(0, 24), inHud: !!e.closest('.hud'), cls: e.className }; });

export async function a11y(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await p.waitForTimeout(2500);
    const a = await p.screenshot(); await p.waitForTimeout(1500); const b = await p.screenshot();
    c.ok('reduced motion keeps the resting hero still', Buffer.compare(a, b) === 0);
    const tr = views(p, 900); await space(p); const vs = await tr;
    const up = vs.findIndex((v) => v > 0), full = vs.findIndex((v) => v === 1), frames = full - up;
    c.ok('reduced motion replaces the dive with a 300ms crossfade', up >= 0 && full > up && frames >= 14 && frames <= 24 && vs.some((v) => v > 0.3 && v < 0.7), `${frames} frames`);
    await p.waitForTimeout(150); await shot(c, p, 'a11y-reduced-fade');
    await p.waitForTimeout(2000);
    await lg(p, 'hurt()'); await p.waitForTimeout(50);
    const s = await st(p);
    c.ok('a reduced motion run plays without shake', s.on && s.top && s.shake === 0, `shake ${s.shake}`);
    const tl = views(p, 700); await p.keyboard.press('Escape'); const vl = await tl, z = vl.findIndex((v) => v === 0);
    c.ok('reduced motion landing is a crossfade too', z > 10 && z < 26, `zero at frame ${z}`);
    c.ok('reduced motion console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(1500);
    const rest: Awaited<ReturnType<typeof focused>>[] = [];
    for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); rest.push(await focused(p)); }
    c.ok('tab order at rest reaches the hero links and skips the flight HUD', rest.some((f) => f.text === 'View the work') && rest.some((f) => f.text === 'Get in touch') && !rest.some((f) => f.inHud), rest.map((f) => f.id || f.text).join(' > '));
    await p.evaluate(() => (document.activeElement as HTMLElement).blur());
    await top(p); await p.waitForTimeout(600);
    await p.mouse.move(150, 300); await space(p);
    c.ok('the HUD stays inert during the dive', await p.evaluate(() => (document.getElementById('hud') as HTMLElement).inert));
    await topDown(p); await p.waitForTimeout(100);
    c.ok('a keyboard start moves focus to the flight HUD once the dive lands', (await focused(p)).id === 'hud', await focused(p));
    c.ok('the live region announces the flight', /Flight started/.test(await p.evaluate(() => document.getElementById('live')!.textContent ?? '')));
    await p.keyboard.press('Tab');
    const land = await focused(p);
    c.ok('Tab while flying reaches Land with a visible ring', land.id === 'land' && (await p.evaluate(() => document.activeElement!.matches(':focus-visible'))), land);
    await p.keyboard.down('KeyA'); await p.waitForTimeout(300); await p.keyboard.up('KeyA');
    await lg(p, 'xp(30)'); await p.waitForFunction(() => (window as unknown as { __lg: { st: () => { card: boolean } } }).__lg.st().card, null, { timeout: 5000 }); await p.waitForTimeout(500);
    const opt = await focused(p);
    c.ok('a level card from the keyboard focuses its first choice', opt.cls.includes('opt'), opt);
    c.ok('the live region reads out the choices', /Choose one\. 1, /.test(await p.evaluate(() => document.getElementById('live')!.textContent ?? '')));
    for (let i = 0; i < 6 && (await st(p)).card; i++) { await p.keyboard.press('Digit1'); await p.waitForTimeout(700); }
    c.ok('a choice returns focus to the HUD', (await focused(p)).id === 'hud', await focused(p));
    await p.keyboard.press('KeyP'); await p.waitForTimeout(500);
    const ps = await st(p), pf = await focused(p);
    await shot(c, p, 'a11y-paused');
    c.ok('P pauses and focuses Resume', ps.card && ps.mode === 'pause' && pf.id === 'cardMore', { mode: ps.mode, pf });
    await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    c.ok('Enter on Resume resumes', !(await st(p)).card && (await playing(p)));
    await p.keyboard.press('Escape');
    const rested = await atRest(p), after = await focused(p);
    c.ok('Escape lands and focus leaves the HUD', rested && (await p.evaluate(() => scrollY)) === 0 && !after.inHud, after);
    await hold(p); await topDown(p); await p.keyboard.press('Escape'); await atRest(p);
    c.ok('a mouse landing does not leave focus in the HUD', !(await focused(p)).inHud);
    c.ok('keyboard console clean', !errors.length, errors);
    await context.close();
  }
}
