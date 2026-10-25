import type { BrowserContextOptions, Page } from 'playwright';
import { page, shot, st, type Ctx } from './lib';

const phone = (width: number, height: number, deviceScaleFactor: number): BrowserContextOptions => ({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
const SIZES: [string, BrowserContextOptions][] = [
  ['iPhone SE', phone(375, 667, 2)], ['Galaxy S8', phone(360, 740, 3)], ['iPhone 15 Pro', phone(393, 852, 3)], ['Pixel 7', phone(412, 915, 2.625)], ['Pro Max', phone(430, 932, 3)],
  ['iPhone SE landscape', phone(667, 375, 2)], ['iPhone 15 Pro landscape', phone(852, 393, 3)], ['Pro Max landscape', phone(932, 430, 3)],
  ['desktop 1440', { viewport: { width: 1440, height: 900 } }], ['desktop 1920', { viewport: { width: 1920, height: 1080 } }],
];

const text = (p: Page) => p.evaluate(() => [...document.querySelectorAll('#hero .eyebrow, #hero .proof')].map((e) => {
  const r = document.createRange(); r.selectNodeContents(e); const q = [...r.getClientRects()], b = r.getBoundingClientRect();
  return { lines: new Set(q.map((x) => Math.round(x.top))).size, box: [b.left, b.top, b.right, b.bottom], vw: innerWidth };
}));

type Diff = { changed: number; mean: number };
const surface = (p: Page, ship: number[], ms: number) => p.evaluate(async ([ship, ms]) => {
  const c = document.getElementById('orbit') as HTMLCanvasElement, x = c.getContext('2d')!, k = c.width / innerWidth, grab = () => x.getImageData(0, 0, c.width, c.height).data;
  const a = grab(); await new Promise((r) => setTimeout(r, ms)); const b = grab();
  const W = c.width, H = c.height, B = Math.round(W / 60), pad = 40 * k, sx0 = ship[0] * k - pad, sy0 = ship[1] * k - pad, sx1 = ship[2] * k + pad, sy1 = ship[3] * k + pad;
  let n = 0, moved = 0, sum = 0;
  for (let by = Math.round(H * 0.45); by + B <= H * 0.85; by += B) for (let bx = 0; bx + B <= W; bx += B) {
    if (bx + B > sx0 && bx < sx1 && by + B > sy0 && by < sy1) continue;
    let sa = 0, sb = 0; for (let y = by; y < by + B; y += 2) for (let i = bx; i < bx + B; i += 2) { const j = (y * W + i) * 4; sa += a[j] * 0.3 + a[j + 1] * 0.59 + a[j + 2] * 0.11; sb += b[j] * 0.3 + b[j + 1] * 0.59 + b[j + 2] * 0.11; }
    const d = Math.abs(sa - sb) / (B / 2) ** 2; n++; sum += d; if (d > 1.5) moved++;
  }
  return { changed: +(moved / Math.max(1, n)).toFixed(3), mean: +(sum / Math.max(1, n)).toFixed(2) };
}, [ship, ms] as const) as Promise<Diff>;
const hash = (p: Page) => p.evaluate(() => { const c = document.getElementById('orbit') as HTMLCanvasElement, d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i++) h = (Math.imul(h, 31) + d[i]) | 0; return h; });
const shipBox = async (p: Page) => { const s = await st(p); return [s.rx - s.rw0 / 2, s.ry - s.rh0 / 2, s.rx + s.rw0 / 2, s.ry + s.rh0 / 2]; };

export async function idle(c: Ctx) {
  for (const [name, opts] of SIZES) {
    const { p, context, errors } = await page(c, opts);
    await p.waitForTimeout(2600);
    const t = await text(p);
    c.ok(`${name} eyebrow and stats each sit on one line inside the screen`, t.every((e) => e.lines === 1 && e.box[0] >= 0 && e.box[2] <= e.vw - 12), t.map((e) => `${e.lines} line, right ${Math.round(e.box[2])} of ${e.vw}`));
    let gap = Infinity;
    for (let i = 0; i < 8; i++) { gap = Math.min(gap, (await p.evaluate((r) => (window as unknown as { __lg: { shipGap: (r: number[][]) => number } }).__lg.shipGap(r), t.map((e) => e.box))) as number); await p.waitForTimeout(200); }
    c.ok(`${name} keeps the eyebrow and stats at least 32px clear of LG-01`, gap >= 32, `closest ${Math.round(gap)}px`);
    if (opts.isMobile && opts.viewport!.height > opts.viewport!.width) {
      const s = await st(p), W = opts.viewport!.width, H = opts.viewport!.height, cue = await p.evaluate(() => document.querySelector('#hero .hint')!.getBoundingClientRect().top);
      const bottom = Math.max(...t.map((e) => e.box[3])), mid = (bottom + H) / 2;
      c.ok(`${name} centres LG-01 between the copy and the bottom of the screen, clear of the cue`, Math.abs(s.ry - mid) <= 6 && s.rw0 / W >= 0.45 && s.rw0 / W <= 0.63 && cue - (s.ry + s.rh0 * 0.78) >= 8, { width: +(s.rw0 / W).toFixed(2), offCentre: Math.round(s.ry - mid), cueGap: Math.round(cue - s.ry - s.rh0 * 0.78) });
    }
    if (name.startsWith('iPhone SE')) await shot(c, p, `idle-${name.replace(/ /g, '-').toLowerCase()}`);
    c.ok(`${name} console clean`, !errors.length, errors);
    await context.close();
  }
  for (const [name, opts] of [SIZES[2], SIZES[8]]) {
    {
      const { p, context, errors } = await page(c, opts);
      await p.waitForTimeout(3000);
      const d = await surface(p, await shipBox(p), 1500);
      c.ok(`${name} idle surface drifts between frames`, d.changed >= 0.25, d);
      c.ok(`${name} idle motion stays subtle`, d.mean <= 12, d);
      const s = await st(p);
      c.ok(`${name} ship light layers are ready`, s.light && s.lit === 1, { light: s.light, lit: s.lit });
      c.ok(`${name} motion console clean`, !errors.length, errors);
      await context.close();
    }
    {
      const { p, context, errors } = await page(c, { ...opts, reducedMotion: 'reduce' });
      await p.waitForTimeout(3000);
      const hs: number[] = []; for (let i = 0; i < 3; i++) { hs.push(await hash(p)); await p.waitForTimeout(800); }
      c.ok(`${name} reduced motion idle frames stay identical`, hs.every((h) => h === hs[0]), hs);
      c.ok(`${name} reduced motion console clean`, !errors.length, errors);
      await context.close();
    }
  }
}
