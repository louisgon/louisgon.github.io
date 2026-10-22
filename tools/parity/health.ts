import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright';
import { launch, open, type Site } from './lib';

const SECTIONS = ['hero', 'intro', 'stack', 'work', 'clients', 'pilot', 'contact'];
const y = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __y: (id: string, k: number) => void }).__y(id, 0), id);
const overflow = (page: Page) => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);

export async function health(sites: Site[], out: string) {
  const report: Record<string, unknown> = {};
  for (const s of sites) {
    const browser = await launch(true), r: Record<string, unknown> = {};
    const phone = await open(browser, s, { profile: 'phone' });
    await phone.page.waitForTimeout(5000);
    const sideways: Record<string, number> = {};
    for (const id of SECTIONS) { await y(phone.page, id); await phone.page.waitForTimeout(1200); sideways[id] = await overflow(phone.page); }
    await phone.page.tap('.proj[data-i="0"] .acts [data-case]'); await phone.page.waitForTimeout(3000);
    sideways.case = await overflow(phone.page);
    sideways.caseInner = await phone.page.evaluate(() => { const c = document.getElementById('case')!; return c.scrollWidth - c.clientWidth; });
    r.phoneOverflow = sideways; r.phoneErrors = phone.errors;
    await phone.context.close();
    const desk = await open(browser, s, { profile: 'desktop' });
    await desk.page.waitForTimeout(5000);
    r.gutter = await desk.page.evaluate(() => innerWidth - document.documentElement.clientWidth);
    await y(desk.page, 'work'); await desk.page.waitForTimeout(1500);
    await desk.page.click('.proj[data-i="0"] .acts [data-case]'); await desk.page.waitForTimeout(3000);
    r.case = await desk.page.evaluate(() => { const c = document.getElementById('case')!, b = c.getBoundingClientRect(); return { right: b.right, innerWidth, pageGutter: innerWidth - document.documentElement.clientWidth, caseScrollbar: c.offsetWidth - c.clientWidth }; });
    r.desktopErrors = desk.errors;
    await desk.context.close(); await browser.close();
    report[s.name] = r; console.log(s.name, JSON.stringify(r));
  }
  mkdirSync(join(out, 'health'), { recursive: true });
  writeFileSync(join(out, 'health', 'report.json'), JSON.stringify(report, null, 1));
}
