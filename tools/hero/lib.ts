import { chromium, type Browser, type BrowserContext, type BrowserContextOptions, type Page } from 'playwright';
import { join } from 'node:path';

export type Ctx = { browser: Browser; url: string; out: string; ok: (name: string, pass: boolean, detail?: unknown) => void };
export type St = {
  ready: boolean; on: boolean; clock: number; enemies: number; level: number; kills: number; hull: number; over: boolean; card: boolean; mode: string; W: string[]; B: string[]; evos: string[]; dpr: number; z: number; u: number; vw: number; vh: number;
  boss: number; x: number; y: number; vx: number; vy: number; shots: number; vig: number; shake: number; view: number; dir: number; top: boolean; hd: number; sx: number; sy: number; rx: number; ry: number; onscreen: number;
  bossMode: number; cache: boolean; csx: number; csy: number; eligible: string[]; nb: number; hv: number; gap: number; sw: number; sh: number;
  fac: number; faction: string; lap: number; switching: boolean; fe: number[]; peel: number; fresh: string[]; sprites: boolean[]; banner: string; bannerSub: string; bannerOn: number; bossName: string; bsx: number; bsy: number;
  drop: number; th: number; ba: number; punch: number; ra: number; ta: number; rw: number; tw: number;
  rw0: number; rh0: number; light: boolean; lit: number;
  hitA: number; hitT: number; reveal: number; stop: number; last: string; follow: boolean; hover: number; fade: boolean; base: boolean; shipReady: boolean; camY: number; brood: number;
  inv: number; sizeErr: number; bossMax: number; seed: number; draws: number; keys: number; calm: number; lines: number; bst: number; baim: number; bdx: number; bdy: number; bpass: number; hullMax: number;
};

export const launch = () => chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : [] });

export async function page(c: Ctx, opts: BrowserContextOptions) {
  const context = await c.browser.newContext(opts), errors: string[] = [];
  const p = await context.newPage();
  await (await context.newCDPSession(p)).send('Emulation.setFocusEmulationEnabled', { enabled: true });
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('requestfailed', (r) => errors.push(`failed ${r.url()}`)); p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(c.url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => (window as unknown as { __lg?: { st: () => { ready: boolean } } }).__lg?.st().ready, null, { timeout: 15000 });
  return { p, context, errors };
}

export const st = (p: Page): Promise<St> => p.evaluate(() => (window as unknown as { __lg: { st: () => St } }).__lg.st());
export const lg = (p: Page, js: string) => p.evaluate(`window.__lg.${js}`);
export const shot = (c: Ctx, p: Page, name: string) => p.screenshot({ path: join(c.out, `${name}.png`) });
export const playing = (p: Page) => p.evaluate(() => document.getElementById('hero')!.classList.contains('playing'));
export const scrolled = (p: Page) => p.evaluate(() => Math.round(scrollY));
export const box = (p: Page, id: string) => p.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, id);
export const stored = (p: Page, k: string) => p.evaluate((k) => localStorage.getItem(k), k);
export const angErr = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
export const topDown = (p: Page, timeout = 5000) => p.waitForFunction(() => (window as unknown as { __lg: { st: () => St } }).__lg.st().top, null, { timeout });
export const atRest = (p: Page, timeout = 3000) => p.waitForFunction(() => { const s = (window as unknown as { __lg: { st: () => St } }).__lg.st(); return s.view === 0 && s.dir === 0 && !s.on && !document.getElementById('hero')!.classList.contains('playing'); }, null, { timeout }).then(() => true, () => false);
export const views = (p: Page, ms: number) => p.evaluate((ms) => new Promise<number[]>((res) => { const l = (window as unknown as { __lg: { st: () => St } }).__lg, out: number[] = [], t0 = performance.now(); const tick = () => { out.push(l.st().view); if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out); }; tick(); }), ms);
export const track = (p: Page, ms: number, keys: (keyof St)[]) => p.evaluate(([ms, keys]) => new Promise<Record<string, number[]>>((res) => { const l = (window as unknown as { __lg: { st: () => Record<string, number> } }).__lg, out: Record<string, number[]> = {}, t0 = performance.now(); for (const k of keys) out[k] = []; const tick = () => { const s = l.st(); for (const k of keys) out[k].push(s[k]); if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out); }; tick(); }), [ms, keys] as const);
export const luma = (p: Page, y0: number, y1: number) => p.evaluate(([y0, y1]) => { const c = document.getElementById('orbit') as HTMLCanvasElement, x = c.getContext('2d')!, h = c.height, d = x.getImageData(0, Math.floor(h * y0), c.width, Math.max(1, Math.floor(h * (y1 - y0)))).data; let s = 0; for (let i = 0; i < d.length; i += 16) s += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; return Math.round(s / (d.length / 16)); }, [y0, y1] as const);
export async function waitFaction(p: Page, fac: number, ms = 9000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(p); if (s.card && (s.mode === 'level' || s.mode === 'cache')) await p.keyboard.press('Digit1'); else if (s.fac === fac && !s.switching) return s; await p.waitForTimeout(100); } return st(p); }
export const monotone = (a: number[], dir: number) => a.every((v, i) => !i || (v - a[i - 1]) * dir >= -1e-6);
export const covers = (p: Page) => p.evaluate(() => { const r = document.getElementById('card')!.getBoundingClientRect(), s = (window as unknown as { __lg: { st: () => St } }).__lg.st(), x0 = s.sx - s.sw / 2, x1 = s.sx + s.sw / 2, y0 = s.sy - s.sh / 2, y1 = s.sy + s.sh / 2; return { over: !(x1 < r.left || x0 > r.right || y1 < r.top || y0 > r.bottom), card: [r.left, r.top, r.right, r.bottom].map(Math.round), ship: [s.sx, s.sy] }; });
export const noColons = (p: Page) => p.evaluate(() => [...document.getElementById('hero')!.querySelectorAll<HTMLElement>('*')].filter((e) => e.offsetParent !== null && e.children.length === 0 && /[:—–]/.test(e.innerText)).map((e) => e.innerText).slice(0, 3));

export async function hold(p: Page) { const s = await st(p); await p.mouse.move(s.rx, s.ry, { steps: 5 }); await p.waitForTimeout(150); await p.mouse.down(); await p.waitForTimeout(340); await p.mouse.up(); }
export async function space(p: Page) { await p.keyboard.down('Space'); await p.waitForTimeout(350); await p.keyboard.up('Space'); await p.waitForTimeout(100); }
export async function clearCards(p: Page) { for (let i = 0; i < 16; i++) { await p.waitForTimeout(650); const s = await st(p); if (!s.card) { await p.waitForTimeout(500); if (!(await st(p)).card) return; } else if (s.mode === 'level' || s.mode === 'cache') await p.keyboard.press('Digit1'); } }

export async function top(p: Page) {
  for (let i = 0; i < 30 && (await p.evaluate(() => scrollY)) > 0; i++) { await p.evaluate(() => (window as unknown as { __y: (id: string, k: number) => void }).__y('hero', 0)); await p.waitForTimeout(100); }
}

export async function touch(context: BrowserContext, p: Page) {
  const cdp = await context.newCDPSession(p);
  return (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: x === undefined ? [] : [{ x, y: y! }] });
}
