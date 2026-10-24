import { devices } from 'playwright';
import { atRest, page, playing, shot, st, stored, touch, type Ctx } from './lib';

export async function egg(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await p.waitForTimeout(1500);
    c.ok('best line hidden before the first sortie', await p.evaluate(() => document.getElementById('bestLine')!.hidden === true));
    const cue = await p.evaluate(() => document.querySelector('#hero .hint')!.textContent);
    c.ok('cue says Scroll to launch', cue === 'Scroll to launch', cue);
    c.ok('no copy points to the game', await p.evaluate(() => !/hold|fly|game/i.test(document.querySelector('#hero .copy')!.textContent ?? '')));
    await p.mouse.move(200, 700); await p.mouse.down(); await p.waitForTimeout(400); await p.mouse.up(); await p.waitForTimeout(200);
    c.ok('a hold off the ship does not start', !(await playing(p)) && (await st(p)).view === 0);
    await p.mouse.move(200, 700); await p.mouse.down(); await p.mouse.move(200, 400, { steps: 6 }); await p.mouse.up();
    c.ok('a drag off the ship does not start', !(await playing(p)));
    await p.mouse.move(150, 300); await p.waitForTimeout(9500);
    await shot(c, p, 'egg-whisper');
    c.ok('the whisper shows after eight idle seconds', (await stored(p, 'lg01-whisper')) === '1', await stored(p, 'lg01-whisper'));
    const s = await st(p);
    await p.mouse.move(s.rx, s.ry, { steps: 8 }); await p.waitForTimeout(900);
    await shot(c, p, 'egg-hover');
    const cursor = await p.evaluate(() => document.getElementById('hero')!.style.cursor);
    c.ok('hovering the ship shows a pointer', cursor === 'pointer', cursor);
    await p.mouse.down(); await p.waitForTimeout(120); await shot(c, p, 'egg-charge'); await p.waitForTimeout(250); await p.mouse.up();
    c.ok('a hold on the ship starts', await playing(p));
    await p.waitForTimeout(400); await p.keyboard.press('Escape');
    c.ok('Escape lands back at rest', await atRest(p));
    c.ok('best line shows after the first sortie', await p.evaluate(() => !document.getElementById('bestLine')!.hidden));
    await p.mouse.move(150, 300); await p.keyboard.down('Space'); await p.waitForTimeout(320); await p.keyboard.up('Space');
    c.ok('a held Space starts', await playing(p));
    await p.keyboard.press('Escape'); await atRest(p); await p.waitForTimeout(9500);
    c.ok('no whisper once played', (await stored(p, 'lg01-whisper')) === '1', await stored(p, 'lg01-whisper'));
    c.ok('a short Space tap does not start', await (async () => { await p.keyboard.press('Space'); await p.waitForTimeout(400); return !(await playing(p)); })());
    c.ok('desktop console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1500);
    const T = await touch(context, p);
    await T('touchStart', 200, 300); await p.waitForTimeout(450); await T('touchEnd'); await p.waitForTimeout(200);
    c.ok('phone hold on the sky does not start', !(await playing(p)));
    await p.waitForTimeout(8500); await shot(c, p, 'egg-phone-whisper');
    c.ok('phone whisper shows', (await stored(p, 'lg01-whisper')) === '1', await stored(p, 'lg01-whisper'));
    const s = await st(p);
    await T('touchStart', s.rx, s.ry); await p.waitForTimeout(450); await T('touchEnd'); await p.waitForTimeout(300);
    c.ok('phone hold on the ship starts', await playing(p));
    c.ok('phone console clean', !errors.length, errors);
    await context.close();
  }
}
