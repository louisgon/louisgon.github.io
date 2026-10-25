import type { BrowserContextOptions } from 'playwright';
import { lg, page, shot, st, topDown, type Ctx } from './lib';

const phone = (width: number, height: number, deviceScaleFactor: number): BrowserContextOptions => ({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
const overlap = (a: number[], b: number[]) => !(a[2] <= b[0] || a[0] >= b[2] || a[3] <= b[1] || a[1] >= b[3]);

export async function readout(c: Ctx) {
  for (const [name, opts] of [['iPhone SE', phone(375, 667, 2)], ['320 wide', phone(320, 568, 2)], ['desktop', { viewport: { width: 1440, height: 900 } }]] as [string, BrowserContextOptions][]) {
    const { p, context, errors } = await page(c, opts);
    await p.waitForTimeout(800); await lg(p, 'start()'); await topDown(p);
    await lg(p, "god(true); window.__lg.time(40); window.__lg.give('pulse', 3); window.__lg.give('missile', 2); window.__lg.give('arc', 2); window.__lg.give('nova', 1); window.__lg.give('cooldown', 2); window.__lg.give('magnet', 1); window.__lg.give('area', 1); window.__lg.give('hull', 1); window.__lg.boss()");
    await p.waitForTimeout(400); await lg(p, 'next()');
    let s = await st(p); for (let i = 0; i < 40 && !(s.bannerOn > 0.9 && /inbound|returns/.test(s.banner)); i++) { await p.waitForTimeout(100); s = await st(p); }
    const r = await p.evaluate(() => { const box = (q: string) => { const e = document.querySelector(q)!.getBoundingClientRect(); return [e.left, e.top, e.right, e.bottom].map(Math.round); }; const b = document.querySelector('#msg b')!; return { msg: box('#msg'), clk: box('#hero .hud .clk'), kc: box('#hero .hud .kc'), boss: box('#bossBar'), lines: Math.round(b.getBoundingClientRect().height / parseFloat(getComputedStyle(b).lineHeight)), font: parseFloat(getComputedStyle(b).fontSize), vw: innerWidth }; });
    await shot(c, p, `readout-lane-${name.replace(/ /g, '-')}`);
    c.ok(`${name} banner takes a lane clear of the clock, build row, kills and capital bar`, s.bannerOn > 0.9 && !overlap(r.msg, r.clk) && !overlap(r.msg, r.kc) && !overlap(r.msg, r.boss) && r.msg[0] >= 0 && r.msg[2] <= r.vw, r);
    if (name !== 'desktop') c.ok(`${name} banner holds two lines at 20 to 24px`, r.lines <= 2 && r.font >= 20 && r.font <= 24, { lines: r.lines, font: r.font });
    c.ok(`${name} readout console clean`, !errors.length, errors);
    await context.close();
  }
  const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
  await p.waitForTimeout(800); await lg(p, 'start()'); await topDown(p);
  const core = (await lg(p, 'boltCore()')) as { core: number; keyline: number; hit: number }[];
  c.ok('every fleet bullet has a solid core at least as large as its hit radius, with a dark keyline', core.every((b) => b.core >= b.hit && b.keyline >= 0.6), core);
  const hull = await p.evaluate(() => ({ label: document.querySelector('#hero .hud .hull .mono')!.textContent, size: parseFloat(getComputedStyle(document.querySelector('#lv i')!).borderBottomWidth) }));
  c.ok('the hull shows a quiet Hull label over larger triangles', hull.label === 'Hull' && hull.size >= 18, hull);
  await lg(p, "god(true); window.__lg.give('pulse', 5, true); window.__lg.give('missile', 2); window.__lg.give('cooldown', 1); window.__lg.give('thrust', 1)");
  await p.keyboard.press('KeyP'); await p.waitForTimeout(500);
  const inv = await p.evaluate(() => [...document.querySelectorAll('#cardInfo li')].map((li) => ({ nm: li.querySelector('.nm')!.childNodes[0].textContent, pips: li.querySelectorAll('.pp i.on, .pp i.ev').length, pr: li.querySelector('.pr')!.textContent })));
  const line = await p.evaluate(() => document.querySelector('#cardInfo .st')!.textContent + ' / ' + document.querySelector('#cardInfo .th')!.textContent);
  await shot(c, p, 'readout-pause');
  c.ok('the pause card lists every weapon and boost with its rank and pairing', inv.length === 4 && inv[0].nm === 'Railstorm' && inv[0].pips === 5 && /Evolved/.test(inv[0].pr!) && inv.some((r) => r.nm === 'Missiles' && r.pips === 2 && r.pr === 'Evolves with Magnet') && inv.some((r) => r.nm === 'Thrusters' && r.pr === 'No evolution pair'), inv);
  c.ok('the pause card states hull, level and the current threat', /^Hull \d of \d · Level \d\d \/ Fighting the Rival fleet$/.test(line), line);
  c.ok('readout pause console clean', !errors.length, errors);
  await context.close();
}
