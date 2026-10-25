import { devices, type BrowserContextOptions, type Page } from 'playwright';
import { atRest, box, hold, lg, page, shot, st, topDown, touch, type Ctx, type St } from './lib';

const phone = (width: number, height: number, deviceScaleFactor: number): BrowserContextOptions => ({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
const cardOn = (p: Page) => p.waitForFunction(() => (window as unknown as { __lg: { st: () => St } }).__lg.st().card, null, { timeout: 5000 });
const active = (p: Page) => p.evaluate(() => { const e = document.activeElement as HTMLElement; return { id: e.id, cls: e.className, inCard: !!e.closest('#card'), text: (e.textContent || '').trim().slice(0, 16) }; });

export async function modal(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(1000); await hold(p); await topDown(p); await lg(p, 'god(true)'); await p.mouse.move(720, 450);
    await lg(p, 'level()'); await cardOn(p); await p.waitForTimeout(500);
    const f0 = await active(p);
    c.ok('a level card opened during a mouse run moves focus to its first choice', f0.inCard && f0.cls.includes('opt'), f0);
    const inert = await p.evaluate(() => ({ main: (document.querySelector('main') as HTMLElement).inert, nav: (document.querySelector('nav') as HTMLElement).inert, land: !!document.getElementById('land')!.closest('[inert]'), card: !!document.getElementById('card')!.closest('[inert]'), modal: document.getElementById('card')!.getAttribute('aria-modal') }));
    c.ok('the rest of the page is inert while a card is open', inert.main && inert.nav && inert.land && !inert.card && inert.modal === 'true', inert);
    const seen: { inCard: boolean; text: string }[] = [];
    for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); seen.push(await active(p)); }
    await p.keyboard.press('Shift+Tab'); const back = await active(p);
    c.ok('Tab stays inside the card and reaches Land', seen.every((f) => f.inCard) && seen.some((f) => f.text === 'Land') && back.inCard, { seen: seen.map((f) => f.text), back: back.text });
    await p.click('#cardBack');
    c.ok('Land on a level card lands', await atRest(p, 4000));
    c.ok('closing the run frees the page again', await p.evaluate(() => !(document.querySelector('main') as HTMLElement).inert && !(document.querySelector('nav') as HTMLElement).inert));
    await p.focus('#hero .hc .btn.ghost'); await p.keyboard.press('Tab'); const fly = (await active(p)).id === 'fly';
    await p.waitForTimeout(400); const h = await st(p);
    await shot(c, p, 'modal-fly-focus');
    c.ok('the ship has a keyboard stop named Fly LG-01 that shows the hover brackets', fly && h.hover > 0.6 && (await p.evaluate(() => document.getElementById('fly')!.getAttribute('aria-label'))) === 'Fly LG-01', { reached: fly, hover: h.hover });
    await p.keyboard.press('Enter'); await topDown(p);
    c.ok('Enter on the ship starts the run', (await st(p)).on);
    c.ok('the control hint mentions P', /P to pause/.test(await p.evaluate(() => document.getElementById('ctl')!.textContent ?? '')));
    await p.keyboard.press('KeyP'); await p.waitForTimeout(300);
    c.ok('the pause summary is read out for assistive tech', /^Paused\. Hull \d of \d · Level \d\d\. .*Weapons Pulse cannon level 1\./.test(await p.evaluate(() => document.getElementById('live')!.textContent ?? '')), await p.evaluate(() => document.getElementById('live')!.textContent));
    await p.keyboard.press('Escape'); await atRest(p, 4000); await p.waitForTimeout(200);
    c.ok('focus returns to the ship once the landing ends', (await active(p)).id === 'fly', await active(p));
    c.ok('modal console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1200);
    const T = await touch(context, p), r = await st(p);
    await T('touchStart', r.rx, r.ry); await p.waitForTimeout(450); await T('touchEnd'); await topDown(p); await p.waitForTimeout(300);
    const [x, y] = await box(p, 'pz'); await p.touchscreen.tap(x, y); await p.waitForTimeout(300);
    const s = await st(p), f = await active(p);
    c.ok('a touch Pause button pauses and focus moves into the card', s.card && s.mode === 'pause' && f.inCard, { mode: s.mode, focus: f });
    c.ok('touch pause console clean', !errors.length, errors);
    await context.close();
  }
  for (const [name, opts] of [['320 wide', phone(320, 568, 2)], ['short landscape', phone(568, 320, 2)], ['200 percent zoom', { viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 }]] as [string, BrowserContextOptions][]) {
    const { p, context, errors } = await page(c, opts);
    await p.waitForTimeout(1000); await lg(p, 'start()'); await topDown(p);
    await lg(p, "god(true); window.__lg.give('missile', 2); window.__lg.give('arc', 1); window.__lg.give('nova', 1); window.__lg.give('cooldown', 1); window.__lg.give('area', 2); window.__lg.give('magnet', 1); window.__lg.give('hull', 1)");
    const res: Record<string, unknown> = {};
    let ok = true;
    for (const mode of ['level', 'pause']) {
      if (mode === 'level') await lg(p, 'level()'); else await p.keyboard.press('KeyP');
      await cardOn(p); await p.waitForTimeout(600);
      const n = await p.evaluate(() => [...document.querySelectorAll('#card button')].filter((b) => b.getClientRects().length).length), got: { h: number; seen: boolean }[] = [];
      for (let i = 0; i < n; i++) {
        got.push(await p.evaluate(() => { const b = document.activeElement as HTMLElement, q = b.getBoundingClientRect(), k = document.getElementById('card')!.getBoundingClientRect(); return { h: Math.round(q.height), seen: !!b.closest('#card') && q.top >= Math.max(0, k.top) - 1 && q.bottom <= Math.min(innerHeight, k.bottom) + 1 }; }));
        await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      }
      await shot(c, p, `modal-${mode}-${name.replace(/ /g, '-')}`);
      res[mode] = got; ok &&= got.length === n && got.every((g) => g.seen && g.h >= 44);
      if (mode === 'level') { for (let i = 0; i < 6 && (await st(p)).card; i++) { await p.keyboard.press('Digit1'); await p.waitForTimeout(500); } } else { await p.click('#cardMore'); await p.waitForTimeout(400); }
    }
    c.ok(`${name} keeps every card action reachable inside the screen at 44px or more`, ok, res);
    c.ok(`${name} fit console clean`, !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'], reducedMotion: 'reduce' });
    await p.waitForTimeout(1000); await lg(p, 'start()'); await topDown(p); await lg(p, 'god(true)');
    await lg(p, 'level()'); await cardOn(p); await p.waitForTimeout(900);
    const s = await st(p), H = await p.evaluate(() => innerHeight);
    c.ok('reduced motion keeps the camera still when a card opens', Math.abs(s.sy - H / 2) < 12, { sy: s.sy, mid: H / 2 });
    c.ok('reduced motion card console clean', !errors.length, errors);
    await context.close();
  }
}
