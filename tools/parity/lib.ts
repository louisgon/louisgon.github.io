import { chromium, type Browser, type BrowserContextOptions, type Page } from 'playwright';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type Profile = 'desktop' | 'phone';
export type Site = { name: 'a' | 'b'; url: string; swap?: string };

export const PROFILES: Record<Profile, BrowserContextOptions> = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const MIME: Record<string, string> = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', webp: 'image/webp', avif: 'image/avif', json: 'application/json', txt: 'text/plain' };

export function site(name: Site['name'], target: string, swap?: string, base = '/'): Site {
  if (!existsSync(target) || !statSync(target).isDirectory()) return { name, url: target.replace(/\/?$/, '/'), swap };
  const root = resolve(target);
  const server = Bun.serve({ port: 0, fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (!path.startsWith(base)) return new Response('Not found', { status: 404 });
    path = path.slice(base.length - 1);
    if (!path.endsWith('/') && !path.split('/').pop()!.includes('.') && existsSync(join(root, path, 'index.html'))) return new Response(null, { status: 307, headers: { location: `${base}${path.slice(1)}/` } });
    if (path.endsWith('/')) path += 'index.html';
    const file = Bun.file(join(root, path));
    return file.size ? new Response(file, { headers: { 'content-type': MIME[path.split('.').pop()!] ?? 'application/octet-stream' } }) : new Response('Not found', { status: 404 });
  } });
  return { name, url: `http://localhost:${server.port}${base}`, swap };
}

export const launch = (classicScrollbars = false) => chromium.launch({ ignoreDefaultArgs: classicScrollbars ? ['--hide-scrollbars'] : [] });

function fakeTime() {
  type Timer = { at: number; fn: (...a: unknown[]) => void; args: unknown[]; every?: number };
  const w = window as unknown as Record<string, unknown>, realTimeout = window.setTimeout.bind(window), timers = new Map<number, Timer>();
  let now = 0, id = 1, rafs: [number, FrameRequestCallback][] = [], seed = 0x5eed, ticking = false;
  w.__raf = window.requestAnimationFrame.bind(window);
  const decode = HTMLImageElement.prototype.decode;
  let decoding = 0;
  HTMLImageElement.prototype.decode = function (this: HTMLImageElement) { decoding++; return decode.call(this).finally(() => decoding--); };
  w.__busy = () => decoding;
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) { if (type.startsWith('webgl')) seed = 0x5eed; return (getContext as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest); } as typeof getContext;
  Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  performance.now = () => now;
  const add = (fn: Timer['fn'], ms = 0, args: unknown[] = [], every?: number) => { timers.set(id, { at: now + Math.max(0, ms), fn, args, every }); return id++; };
  w.setTimeout = (fn: Timer['fn'], ms?: number, ...args: unknown[]) => add(fn, ms, args);
  w.setInterval = (fn: Timer['fn'], ms = 0, ...args: unknown[]) => add(fn, ms, args, Math.max(1, ms));
  w.clearTimeout = w.clearInterval = (i: number) => timers.delete(i);
  w.requestAnimationFrame = (fn: FrameRequestCallback) => { rafs.push([id, fn]); return id++; };
  w.cancelAnimationFrame = (i: number) => (rafs = rafs.filter(([r]) => r !== i));
  w.requestIdleCallback = (fn: IdleRequestCallback) => add(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 1);
  const observed: (() => void)[] = [], RealIO = window.IntersectionObserver;
  w.IntersectionObserver = class extends RealIO { constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) { super((entries, io) => observed.push(() => cb(entries, io)), opts); } };
  const yieldReal = () => new Promise((r) => realTimeout(r, 0)), started = new WeakMap<Animation, number>();
  const drive = () => { for (const a of document.getAnimations()) { if (!started.has(a)) { started.set(a, now); a.playbackRate = 0; } const t = now - started.get(a)!, end = a.effect?.getComputedTiming().endTime; if (typeof end === 'number' && Number.isFinite(end) && t >= end) { a.playbackRate = 1; a.finish(); } else a.currentTime = t; } };
  w.__advance = async (ms: number) => {
    if (!ticking) { ticking = true; seed = 0x5eed; }
    const end = now + ms;
    for (const deliver of observed.splice(0)) deliver();
    drive();
    await yieldReal();
    for (;;) {
      let next: [number, Timer] | null = null;
      for (const e of timers) if (e[1].at <= end && (!next || e[1].at < next[1].at)) next = e;
      if (!next) break;
      const [i, t] = next; now = t.at;
      if (t.every) t.at += t.every; else timers.delete(i);
      t.fn(...t.args); await yieldReal();
    }
    now = end;
    const due = rafs; rafs = [];
    for (const [, fn] of due) fn(now);
    await yieldReal();
    drive();
  };
}

type Open = { profile: Profile; deterministic?: boolean; path?: string; hash?: string; video?: string; reducedMotion?: boolean; scale?: number };

export async function open(browser: Browser, s: Site, { profile, deterministic = false, path = '', hash = '', video, reducedMotion, scale }: Open) {
  const context = await browser.newContext({ ...PROFILES[profile], ...(scale ? { deviceScaleFactor: scale } : {}), reducedMotion: reducedMotion ? 'reduce' : 'no-preference', ...(video ? { recordVideo: { dir: video, size: PROFILES[profile].viewport! } } : {}) });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`failed ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  if (s.swap) await context.route(/\/_astro\/[^/]+\.(webp|avif)$/, (route) => { const file = new URL(route.request().url()).pathname.split('/').pop()!; const [name] = file.split('.'); const ext = file.split('.').pop()!; return route.fulfill({ path: join(s.swap!, `${name}.${ext}`), contentType: MIME[ext] }); });
  if (deterministic) {
    await page.addInitScript(fakeTime);
  }
  await page.goto(s.url + path + hash, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (deterministic) await settle(page, 1500);
  return { page, context, errors };
}

const realFrames = (page: Page, n: number) => page.evaluate((n) => new Promise<void>((r) => { const w = window as unknown as { __raf: typeof requestAnimationFrame; __busy: () => number }; let spare = 60; const f = (k: number) => (k || (w.__busy() && spare--) ? w.__raf(() => f(Math.max(0, k - 1))) : r()); f(n); }), n);

async function settle(page: Page, ms: number) {
  const until = Date.now() + ms;
  let last = -1;
  while (Date.now() < until || last !== (last = await page.evaluate(() => performance.getEntriesByType('resource').length))) await page.waitForTimeout(250);
  await realFrames(page, 3);
}

export async function frames(page: Page, n: number, each?: (i: number) => Promise<void>) {
  for (let i = 0; i < n; i++) {
    await realFrames(page, 2);
    await page.evaluate(() => (window as unknown as { __advance: (ms: number) => Promise<void> }).__advance(16));
    await realFrames(page, 2);
    if (each) await each(i);
  }
}

export const normalise = (s: string) => s.replace(/\bhref=(?:#case-|(?:\/[\w.-]+)*\/work\/)([\w-]+)\/?(?=[ |])/g, 'href=case:$1').replace(/(?:\/[\w./-]*)?\/_astro\/([\w-]+)\.[\w-]+\.(webp|avif)/g, 'img/$1.$2').replace(/(?:^|(?<=["'(]))(?:\.\/)?img\/([\w-]+)\.(webp|avif)/g, 'img/$1.$2');

export function arg(name: string, fallback?: string) { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; }
