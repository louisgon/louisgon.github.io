import { devices } from 'playwright';
import { box, page, playing, scrolled, shot, touch, type Ctx } from './lib';

export async function flow(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await p.waitForTimeout(1500);
    await p.mouse.move(900, 600); await p.mouse.down(); await p.waitForTimeout(100); await p.mouse.up();
    c.ok('a click on the ship does not start', !(await playing(p)));
    await p.mouse.down(); await p.waitForTimeout(120); await shot(c, p, 'flow-charge'); await p.waitForTimeout(250); await p.mouse.up();
    c.ok('hold then release keeps flying', await playing(p));
    for (const [x, y] of [[500, 650], [1000, 560], [720, 700], [400, 600]]) { await p.mouse.move(x, y, { steps: 14 }); await p.waitForTimeout(700); }
    await shot(c, p, 'flow-mouse');
    const sx0 = await p.evaluate(() => scrollX);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(700); await p.keyboard.up('KeyD');
    await p.keyboard.down('ArrowUp'); await p.waitForTimeout(400); await p.keyboard.up('ArrowUp');
    await p.waitForTimeout(1500); await shot(c, p, 'flow-keys');
    c.ok('steering keys never scroll', (await scrolled(p)) === 0 && (await p.evaluate(() => scrollX)) === sx0);
    c.ok('fire is automatic and scores', await p.evaluate(() => document.getElementById('score')!.textContent !== '000 000'), await p.evaluate(() => document.getElementById('score')!.textContent));
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    c.ok('Escape lands', !(await playing(p)));
    await shot(c, p, 'flow-landed');
    await p.mouse.move(700, 450); await p.keyboard.down('Space'); await p.waitForTimeout(350); await p.keyboard.up('Space');
    c.ok('Space hold starts without scrolling', (await playing(p)) && (await scrolled(p)) === 0);
    await p.waitForTimeout(500);
    const [lx, ly] = await box(p, 'land'); await p.mouse.move(lx, ly); await p.waitForTimeout(200); await p.mouse.click(lx, ly); await p.waitForTimeout(400);
    c.ok('the Land button lands', !(await playing(p)));
    await p.keyboard.down('Space'); await p.waitForTimeout(350); await p.keyboard.up('Space'); await p.waitForTimeout(300);
    await p.mouse.wheel(0, 300); await p.waitForTimeout(900);
    c.ok('a wheel lands and scrolls', !(await playing(p)) && (await scrolled(p)) > 0, await scrolled(p));
    await shot(c, p, 'flow-scroll');
    await p.mouse.wheel(0, 600); await p.waitForTimeout(1400); await shot(c, p, 'flow-log');
    c.ok('desktop console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1500);
    const T = await touch(context, p);
    await T('touchStart', 300, 560); await p.waitForTimeout(420); await T('touchEnd'); await p.waitForTimeout(300);
    c.ok('phone hold then lift keeps flying', await playing(p));
    await T('touchStart', 200, 700); for (let i = 1; i <= 12; i++) { await T('touchMove', 200 - i * 9, 700 - i * 4); await p.waitForTimeout(30); } await T('touchEnd');
    await p.waitForTimeout(1200);
    await T('touchStart', 120, 700); for (let i = 1; i <= 16; i++) { await T('touchMove', 120 + i * 12, 700); await p.waitForTimeout(30); } await T('touchEnd');
    await p.waitForTimeout(1600); await shot(c, p, 'flow-phone-play');
    c.ok('phone drags steer without scrolling', (await playing(p)) && (await scrolled(p)) === 0, await scrolled(p));
    const [lx, ly] = await box(p, 'land');
    await p.touchscreen.tap(lx, ly); await p.waitForTimeout(700);
    c.ok('phone Land tap lands', !(await playing(p)));
    await shot(c, p, 'flow-phone-landed');
    await T('touchStart', 200, 600); await T('touchMove', 200, 450); await T('touchMove', 200, 250); await T('touchEnd'); await p.waitForTimeout(800);
    c.ok('phone swipe scrolls the page', !(await playing(p)) && (await scrolled(p)) > 0, await scrolled(p));
    c.ok('phone console clean', !errors.length, errors);
    await context.close();
  }
}
