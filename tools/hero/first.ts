import type { BrowserContextOptions, Page } from 'playwright';
import { page, st, track, type Ctx, type St } from './lib';

const phone = (width: number, height: number, deviceScaleFactor: number): BrowserContextOptions => ({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
const lgSt = (p: Page) => p.evaluate(() => (window as unknown as { __lg: { st: () => St } }).__lg.st());
const gap = (m: { x: number; y: number; r: number }, rs: number[][]) => Math.min(...rs.map(([l, t, r, b]) => Math.hypot(Math.max(l - m.x, 0, m.x - r), Math.max(t - m.y, 0, m.y - b)) - m.r));

export async function first(c: Ctx) {
  for (const [name, opts] of [['phone', phone(393, 852, 3)], ['desktop', { viewport: { width: 1440, height: 900 } }]] as [string, BrowserContextOptions][]) {
    const context = await c.browser.newContext({ ...opts, javaScriptEnabled: false }), p = await context.newPage();
    await p.goto(c.url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1900);
    const v = await p.evaluate(() => { const img = document.querySelector('#hero .bg img') as HTMLImageElement, cs = getComputedStyle(img), op = (q: string) => +getComputedStyle(document.querySelector(q)!).opacity; return { pic: img.complete && img.naturalWidth > 0 && cs.visibility === 'visible' && img.getBoundingClientRect().width > 0, hl: op('#hero .hl .ln > span'), hs: op('#hero .hs'), hc: op('#hero .hc'), cue: op('#hero .hint') }; });
    c.ok(`${name} shows the painted picture, the copy and the cue with JavaScript off`, v.pic && v.hl === 1 && v.hs === 1 && v.hc === 1 && v.cue === 1, v);
    await context.close();
  }
  {
    const context = await c.browser.newContext({ viewport: { width: 1440, height: 900 } }), p = await context.newPage(), errors: string[] = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route(/\/ship\.[^/]*\.webp$/, async (r) => { await new Promise((s) => setTimeout(s, 2500)); await r.continue(); });
    await p.addInitScript(() => { const out: number[] = []; (window as unknown as { __hl: number[] }).__hl = out; const tick = () => { const h = document.querySelector('#hero .hl .ln > span'); if (h) out.push(+getComputedStyle(h).opacity); if (out.length < 30) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    await p.goto(c.url, { waitUntil: 'commit' });
    await p.waitForFunction(() => (window as unknown as { __lg?: unknown }).__lg && document.querySelector('#hero .bg')!.classList.contains('off'), null, { timeout: 8000, polling: 'raf' });
    const a = await lgSt(p), cv = await p.evaluate(() => +document.getElementById('orbit')!.style.opacity), hl = await p.evaluate(() => (window as unknown as { __hl: number[] }).__hl);
    c.ok('the copy is visible from the first frame', hl.length > 0 && hl.every((o) => o === 1), hl.slice(0, 5));
    c.ok('the planet takes over from the picture before a slow ship arrives', a.base && !a.shipReady && cv === 1, { base: a.base, ship: a.shipReady, canvas: cv });
    await p.waitForFunction(() => (window as unknown as { __lg: { st: () => St } }).__lg.st().shipReady, null, { timeout: 8000 });
    const rise = await track(p, 900, ['ry']);
    c.ok('a late ship rises into place on its own', rise.ry[0] > rise.ry[rise.ry.length - 1] + 20, { from: rise.ry[0], to: rise.ry[rise.ry.length - 1] });
    c.ok('slow ship console clean', !errors.length, errors);
    await context.close();
  }
  for (const [name, opts] of [['iPhone SE', phone(375, 667, 2)], ['iPhone 15 Pro', phone(393, 852, 3)], ['Pro Max', phone(430, 932, 3)], ['Pixel 7', phone(412, 915, 2.625)]] as [string, BrowserContextOptions][]) {
    const { p, context, errors } = await page(c, opts);
    await p.waitForTimeout(1500);
    const m = (await p.evaluate(() => (window as unknown as { __lg: { moons: () => unknown } }).__lg.moons())) as { moons: { x: number; y: number; r: number; moved: boolean; hide: boolean }[]; copy: number[][] };
    const shown = m.moons.filter((q) => !q.hide && q.x - q.r < opts.viewport!.width && q.x + q.r > 0), worst = Math.min(...shown.map((q) => gap(q, m.copy)));
    c.ok(`${name} keeps every moon at least 24px clear of the copy`, m.copy.length > 3 && shown.length > 0 && worst >= 24, { worst: Math.round(worst), moons: m.moons });
    c.ok(`${name} moon console clean`, !errors.length, errors);
    await context.close();
  }
  for (const [name, opts, want] of [['tablet 820 by 900', phone(820, 900, 2), 'tall'], ['tablet 820 by 1180', phone(820, 1180, 2), 'tall'], ['tablet 1024 by 1366', phone(1024, 1366, 2), 'wide'], ['landscape 667 by 375', phone(667, 375, 2), 'short'], ['short window 900 by 300', { viewport: { width: 900, height: 300 } }, 'short']] as [string, BrowserContextOptions, string][]) {
    const { p, context, errors } = await page(c, opts);
    await p.waitForTimeout(3000);
    const s = await st(p), H = opts.viewport!.height, l = await p.evaluate(() => { const r = document.createRange(), h = document.getElementById('hero')!.getBoundingClientRect(); let b = 0; document.querySelectorAll('#hero .copy .hl .ln > span, #hero .copy .hs, #hero .copy .hc').forEach((e) => { r.selectNodeContents(e); b = Math.max(b, r.getBoundingClientRect().bottom - h.top); }); return { lay: getComputedStyle(document.getElementById('hero')!).getPropertyValue('--lay').trim(), bottom: b }; });
    const centred = want !== 'tall' || Math.abs(s.ry - (l.bottom + H) / 2) <= 10;
    c.ok(`${name} uses one layout for copy and ship`, l.lay === want && centred && s.rw0 > 40, { lay: l.lay, ship: [s.rx, s.ry, s.rw0], copyBottom: Math.round(l.bottom) });
    c.ok(`${name} layout console clean`, !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, phone(393, 852, 3));
    await p.waitForTimeout(1500); await p.setViewportSize({ width: 852, height: 393 });
    let fade = false; for (let i = 0; i < 40 && !fade; i++) { fade = (await st(p)).fade; await p.waitForTimeout(50); }
    await p.waitForTimeout(600);
    c.ok('rotating swaps the painting with a crossfade', fade && !(await st(p)).fade, fade);
    c.ok('rotation console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(1000);
    const r = await st(p); await p.mouse.move(r.rx, r.ry, { steps: 5 }); await p.waitForTimeout(150); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up();
    await p.waitForFunction(() => (window as unknown as { __lg: { st: () => St } }).__lg.st().view >= 0.25, null, { timeout: 3000 });
    await p.evaluate(() => dispatchEvent(new Event('blur'))); await p.waitForTimeout(500);
    const paused = await p.evaluate(() => +getComputedStyle(document.getElementById('hud')!, '::before').opacity);
    await p.click('#cardMore'); await p.waitForFunction(() => (window as unknown as { __lg: { st: () => St } }).__lg.st().top, null, { timeout: 3000 }); await p.waitForTimeout(500);
    const flying = await p.evaluate(() => +getComputedStyle(document.getElementById('hud')!, '::before').opacity);
    c.ok('a pause during the boost hides the HUD corner brackets until the flight begins', paused === 0 && flying === 1, { paused, flying });
    c.ok('bracket console clean', !errors.length, errors);
    await context.close();
  }
}
