import type { BrowserContextOptions } from 'playwright';
import { lg, type Ctx } from './lib';

type Result = { paintings: { file: string; same: boolean; plate: { max: number; px: number; half: boolean } }[]; ship: { file: string; same: boolean } };
const PROFILES: [string, BrowserContextOptions][] = [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['phone 3x', { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
  ['low phone', { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true }],
];

export async function paint(c: Ctx) {
  for (const [name, opts] of PROFILES) {
    const context = await c.browser.newContext(opts);
    await context.addInitScript(() => { const g = CanvasRenderingContext2D.prototype.getImageData, w = window as unknown as { __reads: number[] }; w.__reads = []; CanvasRenderingContext2D.prototype.getImageData = function (this: CanvasRenderingContext2D, ...a: Parameters<typeof g>) { w.__reads.push(this.canvas.width); return g.apply(this, a); }; });
    const p = await context.newPage(), errors: string[] = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(c.url, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => (window as unknown as { __lg?: { st: () => { ready: boolean } } }).__lg?.st().ready, null, { timeout: 15000 });
    const reads = await p.evaluate(() => (window as unknown as { __reads: number[] }).__reads.slice());
    const r = await lg(p, 'paint()') as Result;
    c.ok(`${name} loads without reading the painting's pixels`, !reads.some((w) => w === 96 || w === 240 || w === 160), reads);
    for (const q of r.paintings) {
      c.ok(`${name} ${q.file} shipped analysis matches the runtime analysis exactly`, q.same);
      c.ok(`${name} ${q.file} moon plates match the pixel path`, q.plate.max <= 1 && !q.plate.half, q.plate);
    }
    c.ok(`${name} ${r.ship.file} shipped nozzles match the runtime analysis exactly`, r.ship.same);
    c.ok(`${name} console clean`, !errors.length, errors);
    await context.close();
  }
}
