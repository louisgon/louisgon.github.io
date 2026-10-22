import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright';
import { launch, open, type Site } from './lib';

const focus = (page: Page) => page.evaluate(() => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return 'body';
  const cs = getComputedStyle(el), label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ').join('.')}` : ''} "${label}" ring:${cs.outlineStyle !== 'none' ? cs.outlineWidth : 'none'} visible:${el.matches(':focus-visible')} opacity:${cs.opacity}`;
});

export async function keys(sites: Site[], out: string) {
  const report: Record<string, Record<string, unknown>> = {};
  for (const s of sites) {
    const browser = await launch(), { page, context, errors } = await open(browser, s, { profile: 'desktop' }), r: Record<string, unknown> = {};
    await page.waitForTimeout(5000);
    const order: string[] = [];
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(i ? 120 : 500); order.push(await focus(page)); }
    r.tabOrder = order;
    await page.keyboard.press('Shift+Tab'); await page.reload(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(5000);
    await page.keyboard.press('Tab'); await page.waitForTimeout(500); r.skip = await focus(page);
    await page.keyboard.press('Enter'); await page.waitForTimeout(2500); r.afterSkip = await focus(page);
    await page.evaluate(() => (window as unknown as { __y: (id: string, k: number) => void }).__y('work', 0)); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector<HTMLElement>('.proj[data-i="1"] h3 a')!.focus());
    await page.keyboard.press('Tab'); r.onCaseStudy = await focus(page);
    await page.keyboard.press('Enter'); await page.waitForTimeout(2500); r.afterOpen = await focus(page);
    r.title = await page.evaluate(() => document.querySelector('#case h2')?.getAttribute('aria-label') || document.querySelector('#case h2')?.textContent);
    const trap: string[] = []; for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(80); trap.push(await focus(page)); } r.trap = trap;
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(2200); r.afterNext = await focus(page);
    r.nextTitle = await page.evaluate(() => document.querySelector('#case h2')?.getAttribute('aria-label') || document.querySelector('#case h2')?.textContent);
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(2200);
    await page.keyboard.press('Escape'); await page.waitForTimeout(2800); r.afterEscape = await focus(page);
    r.caseOpen = await page.evaluate(() => document.getElementById('case')!.classList.contains('on'));
    r.errors = errors; report[s.name] = r;
    await context.close(); await browser.close();
  }
  mkdirSync(join(out, 'keys'), { recursive: true });
  writeFileSync(join(out, 'keys', 'report.json'), JSON.stringify(report, null, 1));
  const [a, b] = sites.map((s) => JSON.stringify(report[s.name], (k, v) => (k === 'errors' ? undefined : v)));
  console.log(a === b ? 'keys: identical' : 'keys: differ, see report.json');
  console.log(JSON.stringify(report[sites[1].name], null, 1));
}
