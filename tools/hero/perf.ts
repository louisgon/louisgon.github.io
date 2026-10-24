import { devices, type BrowserContextOptions, type Page } from 'playwright';
import { lg, page, shot, st, topDown, type Ctx } from './lib';

const q = (a: number[], f: number) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))];
const sample = (p: Page, n: number) => p.evaluate((n) => new Promise<{ ts: number[]; ns: number[]; work: number[] }>((res) => { const l = (window as unknown as { __lg: { st: () => { enemies: number }; work: () => number[] } }).__lg, ts: number[] = [], ns: number[] = []; const tick = (t: number) => { ts.push(t); ns.push(l.st().enemies); if (ts.length < n) requestAnimationFrame(tick); else res({ ts, ns, work: l.work() }); }; requestAnimationFrame(tick); }), n);

async function run(c: Ctx, opts: BrowserContextOptions, tag: string) {
  const { p, context, errors } = await page(c, opts);
  const gpu = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g?.getExtension('WEBGL_debug_renderer_info'); return g && e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)) : 'n/a'; });
  await lg(p, 'start()'); await topDown(p);
  await lg(p, "god(true); window.__lg.stress(true); window.__lg.autopilot(true); window.__lg.time(200); window.__lg.give('pulse', 5); window.__lg.give('wing', 5); window.__lg.give('missile', 4); window.__lg.give('nova', 3)");
  await p.waitForTimeout(6000);
  const r = await sample(p, 301), d = r.ts.slice(1).map((v, i) => v - r.ts[i]), s = await st(p);
  await shot(c, p, `perf-${tag}`);
  await context.close();
  return { gpu, enemies: [Math.min(...r.ns), Math.max(...r.ns)], dpr: s.dpr, median: +q(d, 0.5).toFixed(2), p95: +q(d, 0.95).toFixed(2), over20: d.filter((v) => v > 20).length, frames: d.length, work50: +q(r.work, 0.5).toFixed(2), work95: +q(r.work, 0.95).toFixed(2), errors };
}

async function rest(c: Ctx, opts: BrowserContextOptions, tag: string) {
  const { p, context, errors } = await page(c, opts);
  await p.waitForTimeout(3500);
  const r = await sample(p, 301), d = r.ts.slice(1).map((v, i) => v - r.ts[i]), s = await st(p);
  await shot(c, p, `perf-idle-${tag}`);
  await context.close();
  return { dpr: s.dpr, median: +q(d, 0.5).toFixed(2), p95: +q(d, 0.95).toFixed(2), over20: d.filter((v) => v > 20).length, frames: d.length, work50: +q(r.work, 0.5).toFixed(2), work95: +q(r.work, 0.95).toFixed(2), errors };
}

export async function perf(c: Ctx) {
  const di = await rest(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, 'desk'), pi = await rest(c, { ...devices['Pixel 7'] }, 'phone');
  console.log(`      idle desktop 1440x900 at 2x ${JSON.stringify(di)}\n      idle Pixel 7 profile ${JSON.stringify(pi)}`);
  c.ok('the idle hero holds 60fps on desktop with little main thread work', di.median <= 17.5 && di.p95 <= 20 && di.work50 <= 2.5, di);
  c.ok('the idle hero on phones keeps its 1.5 pixel ratio and little main thread work', pi.dpr <= 1.5 && pi.median <= 17.5 && pi.work50 <= 3, pi);

  const desk = await run(c, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, 'desk');
  console.log(`      desktop 1440x900 at 2x ${JSON.stringify(desk)}`);
  c.ok('desktop holds about 300 enemies at 60fps', desk.enemies[0] >= 280 && desk.median <= 17.5 && desk.p95 <= 20, desk);
  const phone = await run(c, { ...devices['Pixel 7'] }, 'phone');
  console.log(`      Pixel 7 profile ${JSON.stringify(phone)}`);
  c.ok('phones cap at 150 enemies and a pixel ratio of 1.5', phone.enemies[1] <= 150 && phone.enemies[0] >= 130 && phone.dpr <= 1.5, phone);
  c.ok('perf console clean', !di.errors.length && !pi.errors.length && !desk.errors.length && !phone.errors.length, [...di.errors, ...pi.errors, ...desk.errors, ...phone.errors]);
}
