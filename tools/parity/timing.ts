import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, open, type Site } from './lib';
import { SCENARIOS } from './scenarios';

const SET = ['desktop-scroll', 'desktop-nav', 'desktop-case', 'phone-menu', 'phone-case'];
const stats = (d: number[]) => { const s = [...d].sort((x, y) => x - y), q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; const p50 = q(0.5); return { n: s.length, p50: +p50.toFixed(2), p95: +q(0.95).toFixed(2), p99: +q(0.99).toFixed(2), missed: +((100 * s.filter((v) => v > p50 * 1.5).length) / s.length).toFixed(2) }; };

export async function timing(a: Site, b: Site, out: string, runs = 3) {
  const browser = await launch(), result: Record<string, Record<string, ReturnType<typeof stats>[]>> = {};
  for (const sc of SCENARIOS.filter((s) => SET.includes(s.name))) for (let r = 0; r < runs; r++) for (const s of r % 2 ? [b, a] : [a, b]) {
    const { page, context } = await open(browser, s, { profile: sc.profile, hash: sc.hash, scale: 2 });
    await page.evaluate(() => { const w = window as unknown as { __dt: number[] }; w.__dt = []; let last = 0; const f = (t: number) => { if (last) w.__dt.push(t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await sc.run({ page, wait: (n) => page.waitForTimeout(n * 16.7), mark: async () => {}, expect: async () => {} });
    const dt: number[] = await page.evaluate(() => (window as unknown as { __dt: number[] }).__dt);
    ((result[sc.name] ??= {})[s.name] ??= []).push(stats(dt));
    await context.close();
  }
  await browser.close();
  mkdirSync(join(out, 'timing'), { recursive: true });
  writeFileSync(join(out, 'timing', 'report.json'), JSON.stringify(result, null, 1));
  for (const [name, r] of Object.entries(result)) console.log(`${name}: ${['a', 'b'].map((k) => `${k} ${r[k].map((x) => `p50 ${x.p50} p95 ${x.p95} p99 ${x.p99} missed ${x.missed}%`).join(' / ')}`).join(' | ')}`);
}
