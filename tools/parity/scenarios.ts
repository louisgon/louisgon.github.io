import type { Page } from 'playwright';
import type { Profile } from './lib';

export type Run = { page: Page; wait: (frames: number) => Promise<void>; mark: (label: string) => Promise<void> };
export type Scenario = { name: string; profile: Profile; hash?: string; run: (r: Run) => Promise<void> };

const LOAD = 330;
const y = (page: Page, id: string, k = 0) => page.evaluate(([id, k]) => (window as unknown as { __y: (id: string, k: number) => void }).__y(id, k), [id, k] as const);
const press = async (page: Page, key: string, times = 1) => { for (let i = 0; i < times; i++) await page.keyboard.press(key); };
const tapOrClick = (page: Page, selector: string, touch: boolean) => (touch ? page.tap(selector) : page.click(selector));

async function wheel(r: Run, total: number, step = 360, frames = 14) {
  await r.page.mouse.move(720, 450);
  for (let d = 0; d < total; d += step) { await r.page.mouse.wheel(0, step); await r.wait(frames); }
}

const caseFlow = (touch: boolean) => async (r: Run) => {
  await r.wait(LOAD);
  await y(r.page, 'work', 0); await r.wait(90);
  if (!touch) { await r.page.hover('.proj[data-i="0"] .pic'); await r.wait(30); }
  await tapOrClick(r.page, '.proj[data-i="0"] .acts [data-case]', touch); await r.wait(170); await r.mark('case-open');
  if (touch) { await r.page.tap('#case .nav2 button:last-child'); await r.wait(130); await r.mark('case-next'); await r.page.tap('#case .back'); }
  else { await press(r.page, 'ArrowRight'); await r.wait(130); await r.mark('case-next'); await press(r.page, 'ArrowLeft'); await r.wait(130); await press(r.page, 'Escape'); }
  await r.wait(170); await r.mark('case-back');
};

export const SCENARIOS: Scenario[] = [
  { name: 'desktop-load', profile: 'desktop', run: async (r) => { await r.wait(LOAD); await r.mark('hero'); } },
  { name: 'desktop-scroll', profile: 'desktop', run: async (r) => { await r.wait(LOAD); await wheel(r, 12000); await r.wait(60); await r.mark('bottom'); } },
  { name: 'desktop-sections', profile: 'desktop', run: async (r) => { await r.wait(LOAD); for (const id of ['intro', 'stack', 'work', 'clients', 'pilot', 'contact']) { await y(r.page, id, 0); await r.wait(100); await r.mark(id); } } },
  { name: 'desktop-nav', profile: 'desktop', run: async (r) => { await r.wait(LOAD); for (const id of ['stack', 'contact', 'work', 'hero']) { await r.page.click(id === 'hero' ? 'nav .logo' : `nav .links a[href="#${id}"]`); await r.wait(200); await r.mark(`nav-${id}`); } } },
  { name: 'desktop-hash', profile: 'desktop', hash: '#work', run: async (r) => { await r.wait(200); await r.mark('work'); } },
  { name: 'desktop-reload', profile: 'desktop', run: async (r) => { await r.wait(LOAD); await wheel(r, 3600); await r.wait(60); await r.page.reload({ waitUntil: 'load' }); await r.page.waitForLoadState('networkidle'); await r.wait(200); await r.mark('reloaded'); } },
  { name: 'desktop-case', profile: 'desktop', run: caseFlow(false) },
  { name: 'desktop-keys', profile: 'desktop', run: async (r) => {
    await r.wait(LOAD); await press(r.page, 'Tab'); await r.wait(20); await r.mark('skip-link');
    await press(r.page, 'Tab', 7); await r.wait(20);
    await y(r.page, 'work', 0); await r.wait(90);
    await r.page.evaluate(() => (document.querySelector('.proj[data-i="1"] .num') as HTMLElement).closest('.proj')!.querySelector<HTMLElement>('h3 a')!.focus());
    await press(r.page, 'Tab'); await r.wait(10); await press(r.page, 'Enter'); await r.wait(170); await r.mark('keys-open');
    await press(r.page, 'Tab', 3); await press(r.page, 'ArrowRight'); await r.wait(130); await press(r.page, 'Escape'); await r.wait(170); await r.mark('keys-back');
  } },
  { name: 'phone-load', profile: 'phone', run: async (r) => { await r.wait(LOAD); await r.mark('hero'); } },
  { name: 'phone-sections', profile: 'phone', run: async (r) => { await r.wait(LOAD); for (const id of ['intro', 'stack', 'work', 'clients', 'pilot', 'contact']) { await y(r.page, id, 0); await r.wait(100); await r.mark(id); } } },
  { name: 'phone-menu', profile: 'phone', run: async (r) => { await r.wait(LOAD); await r.page.tap('#mbtn'); await r.wait(40); await r.mark('menu'); await r.page.tap('#mnav a[href="#work"]'); await r.wait(200); await r.mark('menu-work'); } },
  { name: 'phone-hash', profile: 'phone', hash: '#work', run: async (r) => { await r.wait(200); await r.mark('work'); } },
  { name: 'phone-reload', profile: 'phone', run: async (r) => { await r.wait(LOAD); await wheel(r, 3600, 360, 14); await r.wait(60); await r.page.reload({ waitUntil: 'load' }); await r.page.waitForLoadState('networkidle'); await r.wait(200); await r.mark('reloaded'); } },
  { name: 'phone-case', profile: 'phone', run: caseFlow(true) },
];
