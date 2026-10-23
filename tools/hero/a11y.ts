import { card, page, playing, shot, top, type Ctx } from './lib';

const focused = (p: import('playwright').Page) => p.evaluate(() => { const e = document.activeElement as HTMLElement; return { id: e.id, text: (e.textContent || e.tagName).trim().slice(0, 24), inHud: !!e.closest('.hud'), inHero: !!e.closest('#hero') }; });

export async function a11y(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await p.waitForTimeout(2500);
    const a = await p.screenshot(); await p.waitForTimeout(1500); const b = await p.screenshot();
    await shot(c, p, 'a11y-reduced');
    c.ok('reduced motion holds a still frame', Buffer.compare(a, b) === 0);
    await p.keyboard.down('Space'); await p.waitForTimeout(320); await p.keyboard.up('Space'); await p.waitForTimeout(600);
    c.ok('reduced motion still flies', await playing(p));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
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
    await p.mouse.move(150, 300); await p.keyboard.down('Space'); await p.waitForTimeout(450); await p.keyboard.up('Space'); await p.waitForTimeout(300);
    c.ok('a keyboard start moves focus to the flight HUD', (await focused(p)).id === 'hud', await focused(p));
    await p.keyboard.press('Tab');
    const land = await focused(p);
    c.ok('Tab while flying reaches Land with a visible ring', land.id === 'land' && (await p.evaluate(() => document.activeElement!.matches(':focus-visible'))), land);
    await p.keyboard.down('KeyA'); await p.waitForTimeout(300); await p.keyboard.up('KeyA');
    await p.keyboard.press('KeyP'); await p.waitForTimeout(500);
    const paused = await card(p), pf = await focused(p);
    await shot(c, p, 'a11y-paused');
    c.ok('P pauses and focuses Resume', paused.on && paused.mode === 'pause' && pf.id === 'cardMore', { paused, pf });
    await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    const resumed = await card(p);
    c.ok('Enter on Resume resumes', !resumed.on && (await playing(p)), resumed);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const after = await focused(p);
    c.ok('Escape lands and focus leaves the HUD', (await p.evaluate(() => scrollY)) === 0 && !(await playing(p)) && !after.inHud, after);
    c.ok('keyboard console clean', !errors.length, errors);
    await context.close();
  }
}
