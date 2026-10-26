import { devices } from 'playwright';
import type { Ctx } from './lib';

export async function slow(c: Ctx) {
  const context = await c.browser.newContext({ ...devices['iPhone 15 Pro'] }), p = await context.newPage(), errors: string[] = [];
  p.on('pageerror', (e) => errors.push(e.message));
  const cdp = await context.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  const t0 = Date.now();
  void p.goto(c.url).catch(() => {});
  let at = -1;
  while (Date.now() - t0 < 12000) {
    await p.waitForTimeout(250);
    const shown = await p.evaluate(() => { const img = document.querySelector<HTMLImageElement>('#hero picture.bg img'); return !!img && img.complete && img.naturalWidth > 0 && +getComputedStyle(img).opacity > 0.9; }).catch(() => false);
    if (shown) { at = Date.now() - t0; break; }
  }
  c.ok('a throttled phone (150ms, 1.6Mbps) shows the painting within 6 seconds', at > 0 && at <= 6000, `${at}ms`);
  c.ok('throttled console clean', !errors.length, errors);
  await context.close();
}
