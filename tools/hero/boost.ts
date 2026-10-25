import { devices, type Page } from 'playwright';
import { angErr, box, clearCards, lg, luma, monotone, page, playing, scrolled, shot, st, topDown, touch, track, type Ctx, type St } from './lib';

const key = async (p: Page, codes: string[], ms: number) => { for (const k of codes) await p.keyboard.down(k); await p.waitForTimeout(ms); const s = await st(p); for (const k of codes) await p.keyboard.up(k); return s; };

export async function boost(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await p.waitForTimeout(1200);
    const s0 = await st(p);
    await p.mouse.move(s0.rx, s0.ry, { steps: 6 }); await p.waitForTimeout(300);
    await p.mouse.down(); await p.waitForTimeout(100); await p.mouse.up();
    c.ok('a click on the ship does not start', !(await playing(p)));
    const top0 = await luma(p, 0.02, 0.2), low0 = await luma(p, 0.62, 0.78);
    const boostT = p.evaluate(() => new Promise<number>((res) => { const l = (window as unknown as { __lg: { st: () => St } }).__lg; let t1 = 0; const tick = (ts: number) => { const s = l.st(); if (!t1 && s.on) t1 = ts; if (t1 && s.top) res(ts - t1); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); setTimeout(() => res(-1), 6000); }));
    const tr = track(p, 1800, ['view', 'drop', 'punch', 'th', 'ba']);
    await p.mouse.down(); await p.waitForTimeout(340); await p.mouse.up();
    const ms = await boostT, k = await tr, on = k.view.map((v, i) => [v, i] as const).filter(([v]) => v > 0).map(([, i]) => i), drops = on.map((i) => k.drop[i]), ths = on.map((i) => k.th[i]);
    c.ok('the boost completes into the top down view in 1.3 to 1.6 seconds', ms >= 1300 && ms <= 1600 && (await st(p)).view === 1, `${Math.round(ms)}ms`);
    const d0 = await st(p); await p.waitForTimeout(1000); const d1 = await st(p);
    c.ok('a mouse launch holds still while the pointer rests below centre', Math.hypot(d1.x - d0.x, d1.y - d0.y) < 12 && !d1.card, { from: [d0.x, d0.y], to: [d1.x, d1.y], pointer: [s0.rx, s0.ry] });
    await p.mouse.move(s0.rx + 3, s0.ry); await p.waitForTimeout(300); const d2 = await st(p);
    await p.mouse.move(s0.rx + 40, s0.ry + 20, { steps: 4 }); await p.waitForTimeout(400); const d3 = await st(p);
    c.ok('the mouse takes over after a deliberate move of a few pixels', Math.hypot(d2.x - d1.x, d2.y - d1.y) < 12 && Math.hypot(d3.x - d2.x, d3.y - d2.y) > 40, { nudge: [d2.x - d1.x, d2.y - d1.y], move: [d3.x - d2.x, d3.y - d2.y] });
    const early = on.filter((i) => k.view[i] < 0.15), punch = Math.max(...early.map((i) => k.punch[i]));
    c.ok('the engines punch at the start of the boost before the planet moves far', punch > 0.6 && early.every((i) => k.drop[i] < 0.12), `peak ${punch}, drop by then ${Math.max(...early.map((i) => k.drop[i]))}`);
    c.ok('the planet slides down and out of frame in one continuous move', monotone(drops, 1) && drops[drops.length - 1] >= 1.2 && monotone(ths, 1) && ths[ths.length - 1] === 1, `drop ${drops[0]} to ${drops[drops.length - 1]} over ${drops.length} frames`);
    c.ok('the orbit backdrop has faded by the time the space view settles', on.filter((i) => k.view[i] > 0.6).every((i) => k.ba[i] === 0));
    await lg(p, 'hold(0.32)'); await p.waitForTimeout(120);
    const top1 = await luma(p, 0.02, 0.2), low1 = await luma(p, 0.62, 0.78); await shot(c, p, 'boost-32');
    c.ok('space fades in from above while the planet falls away', top1 < top0 * 0.6 && top1 < low1 * 0.5, { rest: [top0, low0], mid: [top1, low1] });
    await lg(p, 'hold(0.49)'); await p.waitForTimeout(80);
    const hand = await st(p); await shot(c, p, 'boost-49');
    c.ok('the rear view ship hands off to the top down sprite at matching size', hand.rw === hand.tw && Math.abs(hand.ra + hand.ta - 1) < 0.02 && hand.ra > 0.2 && hand.ta > 0.2, hand);
    await lg(p, 'hold(0.8)'); await p.waitForTimeout(120);
    const dark = await luma(p, 0, 1); await shot(c, p, 'boost-80');
    c.ok('the space view is dark enough for ships to read', dark < 40, dark);
    await lg(p, 'go(1)'); await topDown(p);
    c.ok('the HUD shows once the boost completes and is not inert', await p.evaluate(() => document.getElementById('hero')!.classList.contains('flying') && !(document.getElementById('hud') as HTMLElement).inert));
    await p.mouse.move(720, 450, { steps: 4 }); await p.waitForTimeout(300);
    const dirs: [string[], number][] = [[['KeyD'], 90], [['KeyS'], 180], [['KeyA'], 270], [['KeyW'], 0], [['KeyD', 'KeyS'], 135], [['ArrowLeft', 'ArrowUp'], 315], [['ArrowRight', 'ArrowUp'], 45], [['KeyA', 'KeyS'], 225]];
    const got: string[] = []; let worst = 0;
    for (const [k, want] of dirs) {
      let s = await key(p, k, 650);
      for (let i = 0; i < 2 && s.card; i++) { await clearCards(p); s = await key(p, k, 650); }
      const e = angErr(s.hd, want); worst = Math.max(worst, e); got.push(`${k.join('+')} ${s.hd} want ${want}`);
    }
    c.ok('the heading follows movement in all directions within 8 degrees', worst <= 8, got.join(', '));
    const h0 = (await st(p)).hd; await p.waitForTimeout(700); const h1 = (await st(p)).hd;
    c.ok('the heading holds when idle', angErr(h0, h1) <= 3, `${h0} then ${h1}`);
    const turn = await p.evaluate(() => new Promise<number>((res) => { const l = (window as unknown as { __lg: { st: () => St } }).__lg; let a = l.st().hd, pt = 0, max = 0; const t0 = performance.now(); const tick = (ts: number) => { const h = l.st().hd; if (pt) max = Math.max(max, Math.abs((((h - a) % 360) + 540) % 360 - 180) / ((ts - pt) / 1000)); a = h; pt = ts; if (performance.now() - t0 < 600) requestAnimationFrame(tick); else res(max); }; requestAnimationFrame(tick); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' })); setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' })), 550); }));
    c.ok('the turn rate stays capped near 540 degrees a second', turn <= 620, `peak ${Math.round(turn)}`);
    let a = await st(p), b = a, d = a, steered = false;
    for (let i = 0; i < 3 && !steered; i++) {
      await clearCards(p); await p.mouse.move(720, 450, { steps: 6 }); await p.waitForTimeout(400); a = await st(p);
      await p.mouse.move(1300, 450, { steps: 6 }); await p.waitForTimeout(900); b = await st(p);
      await p.mouse.move(720, 820, { steps: 6 }); await p.waitForTimeout(900); d = await st(p);
      steered = !b.card && !d.card && b.x > a.x + 300 && d.y > b.y + 200 && angErr(b.hd, 90) < 25;
    }
    c.ok('the mouse steers in world space and the ship faces where it flies', steered, `(${a.x},${a.y}) to (${b.x},${b.y}) ${b.hd}, then (${d.x},${d.y}) ${d.hd}`);
    c.ok('the camera keeps LG-01 centred on desktop', Math.abs(d.sx - 720) < 1440 * 0.04 && Math.abs(d.sy - 450) < 900 * 0.06, `ship at ${Math.round(d.sx)},${Math.round(d.sy)}`);
    c.ok('the camera keeps the ship near the centre', Math.abs(d.sx - 720) < 200 && Math.abs(d.sy - 450) < 200, `${d.sx},${d.sy}`);
    c.ok('steering never scrolls', (await scrolled(p)) === 0);
    await p.mouse.move(720, 450, { steps: 4 });
    let peak = 0; for (let i = 0; i < 24; i++) { const s = await st(p); peak = Math.max(peak, s.shots); if (s.card) await p.keyboard.press('Digit1'); await p.waitForTimeout(150); }
    const s1 = await st(p);
    c.ok('weapons fire on their own with no clicks', peak > 0 && s1.kills > 0, `peak shots ${peak}, kills ${s1.kills} at ${s1.clock}s`);
    await shot(c, p, 'boost-play');
    c.ok('desktop flight console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1200);
    const T = await touch(context, p), r = await st(p);
    await T('touchStart', r.rx, r.ry); await p.waitForTimeout(450);
    c.ok('phone hold on the ship starts', await playing(p));
    await topDown(p, 5000);
    c.ok('phone boost completes into the top down view', (await st(p)).view === 1);
    const a = await st(p);
    for (let i = 1; i <= 14; i++) { await T('touchMove', r.rx - i * 9, r.ry + i * 6); await p.waitForTimeout(30); }
    await p.waitForTimeout(500); const b = await st(p); await T('touchEnd');
    c.ok('the touch joystick moves the ship in both axes', b.x < a.x - 60 && b.y > a.y + 30, `(${a.x},${a.y}) to (${b.x},${b.y})`);
    await T('touchStart', 300, 700); for (let i = 1; i <= 8; i++) { await T('touchMove', 300, 700 - i * 12); await p.waitForTimeout(25); } await p.waitForTimeout(250); const d = await st(p); await T('touchEnd');
    c.ok('a new touch keeps steering and the ship turns to face up', d.y < b.y - 20 && angErr(d.hd, 0) < 30, `y ${b.y} to ${d.y}, heading ${d.hd}`);
    await T('touchStart', 200, 600); await T('touchMove', 290, 600); await p.waitForTimeout(150);
    const h0 = await st(p); await p.waitForTimeout(600); const h1 = await st(p);
    await T('touchMove', 256, 600); await p.waitForTimeout(250); const s0 = await st(p); await p.waitForTimeout(600); const s1 = await st(p);
    await T('touchEnd'); await p.waitForTimeout(350); const e0 = await st(p); await p.waitForTimeout(400); const e1 = await st(p);
    c.ok('a thumb held still at full push keeps the ship flying', h1.x - h0.x > 120, `x ${h0.x} to ${h1.x}`);
    c.ok('a small push flies slower than a full push', s1.x > s0.x && s1.x - s0.x < (h1.x - h0.x) * 0.6, `small ${s1.x - s0.x} full ${h1.x - h0.x}`);
    c.ok('lifting the thumb brakes the ship in place', Math.hypot(e1.x - e0.x, e1.y - e0.y) < 12, `(${e0.x},${e0.y}) to (${e1.x},${e1.y})`);
    await p.waitForTimeout(300); await T('touchStart', 200, 600); await T('touchMove', 290, 600); await p.waitForTimeout(600); const cx0 = await p.evaluate(() => (window as unknown as { __lg: { st: () => St } }).__lg.st().sx - innerWidth / 2);
    await T('touchMove', 120, 600); await p.waitForTimeout(350); const rv = await st(p); await T('touchEnd');
    c.ok('the ship faces a reversed thumb within 0.35s', angErr(rv.hd, 270) < 35, `heading ${rv.hd}`);
    const cx1 = rv.sx - (await p.evaluate(() => innerWidth / 2)), lim = (await p.evaluate(() => innerWidth)) * 0.06;
    c.ok('the camera keeps LG-01 centred while steering by thumb', Math.abs(cx0) < lim && Math.abs(cx1) < lim, `off centre ${Math.round(cx0)} then ${Math.round(cx1)} px, limit ${Math.round(lim)}`);
    await p.waitForTimeout(600); await T('touchStart', 200, 600); await T('touchMove', 290, 600); await p.waitForTimeout(120); const q = await st(p); await T('touchEnd');
    const full = (h1.x - h0.x) / 0.6;
    c.ok('a full push gets well on its way to top speed within 0.12s', q.vx > full * 0.4, `vx ${Math.round(q.vx)} of about ${Math.round(full)}`);
    c.ok('phone drags never scroll', (await scrolled(p)) === 0);
    c.ok('phone pixel ratio is capped at 1.5', d.dpr <= 1.5, d.dpr);
    await p.waitForTimeout(1500); await shot(c, p, 'boost-phone-play');
    await clearCards(p); const [lx, ly] = await box(p, 'land'); await p.touchscreen.tap(lx, ly);
    await p.waitForFunction(() => { const s = (window as unknown as { __lg: { st: () => St } }).__lg.st(); return !s.on && s.view === 0; }, null, { timeout: 4000 }).catch(() => {});
    c.ok('phone Land tap lands back at the orbit hero', !(await playing(p)) && (await st(p)).view === 0);
    c.ok('phone flight console clean', !errors.length, errors);
    await context.close();
  }
}
