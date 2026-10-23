import { chromium, type Browser, type BrowserContext, type BrowserContextOptions, type Page } from 'playwright';
import { join } from 'node:path';

export type Ctx = { browser: Browser; url: string; out: string; ok: (name: string, pass: boolean, detail?: unknown) => void };

export const launch = () => chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : [] });

export async function page(c: Ctx, opts: BrowserContextOptions, god = false) {
  const context = await c.browser.newContext(opts), errors: string[] = [];
  if (god) await context.addInitScript(() => { (window as unknown as { __god: boolean }).__god = true; });
  const p = await context.newPage();
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('requestfailed', (r) => errors.push(`failed ${r.url()}`)); p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(c.url, { waitUntil: 'networkidle' });
  return { p, context, errors };
}

export const shot = (c: Ctx, p: Page, name: string) => p.screenshot({ path: join(c.out, `${name}.png`) });
export const playing = (p: Page) => p.evaluate(() => document.getElementById('hero')!.classList.contains('playing'));
export const scrolled = (p: Page) => p.evaluate(() => Math.round(scrollY));
export const box = (p: Page, id: string) => p.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, id);
export const shipAt = (p: Page) => p.evaluate(() => [innerWidth / 2, innerHeight * (innerWidth / innerHeight < 0.85 ? 0.69 : 0.66)]);
export const stored = (p: Page, k: string) => p.evaluate((k) => localStorage.getItem(k), k);
export const card = (p: Page) => p.evaluate(() => { const c = document.getElementById('card')!; return { on: c.classList.contains('on'), mode: c.dataset.mode ?? '', title: document.getElementById('cardT')!.textContent ?? '', opts: [...document.querySelectorAll('#opts .opt .nm')].map((n) => n.textContent ?? ''), score: document.getElementById('score')!.textContent ?? '' }; });

export async function top(p: Page) {
  for (let i = 0; i < 30 && (await p.evaluate(() => scrollY)) > 0; i++) { await p.evaluate(() => (window as unknown as { __y: (id: string, k: number) => void }).__y('hero', 0)); await p.waitForTimeout(100); }
}

export async function touch(context: BrowserContext, p: Page) {
  const cdp = await context.newCDPSession(p);
  return (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: x === undefined ? [] : [{ x, y: y! }] });
}

export async function steer(p: Page, w: number, h: number, ms: number, until?: () => Promise<boolean>) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (until && (await until())) return true;
    const k = (Date.now() - t0) / 1000;
    await p.mouse.move(w * (0.5 + Math.sin(k * 0.9) * 0.3), h * (0.72 + Math.sin(k * 0.5) * 0.06), { steps: 4 });
    await p.waitForTimeout(220);
  }
  return false;
}
