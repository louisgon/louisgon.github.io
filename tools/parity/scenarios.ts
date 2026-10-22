import type { Page } from 'playwright';
import type { Profile } from './lib';
import projects from '../../src/content/projects.json';

export type Want = { path?: string; open?: string | null; focus?: string; row?: number; history?: number; dom?: string };
export type Run = { page: Page; wait: (frames: number) => Promise<void>; mark: (label: string) => Promise<void>; expect: (label: string, want: Want) => Promise<void> };
export type Scenario = { name: string; profile: Profile; path?: string; hash?: string; fresh?: boolean; run: (r: Run) => Promise<void> };

const LOAD = 330;
const y = (page: Page, id: string, k = 0) => page.evaluate(([id, k]) => (window as unknown as { __y: (id: string, k: number) => void }).__y(id, k), [id, k] as const);
const press = async (page: Page, key: string, times = 1) => { for (let i = 0; i < times; i++) await page.keyboard.press(key); };
const tapOrClick = (page: Page, selector: string, touch: boolean) => (touch ? page.tap(selector) : page.click(selector));
const go = (page: Page, delta: number) => page.evaluate((d) => history.go(d), delta);
const PROJECTS = [...projects].sort((a, b) => a.order - b.order);

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

const direct = (touch: boolean) => async (r: Run) => {
  await r.wait(150); await r.mark('direct'); await r.expect('direct', { path: 'work/kioti/', open: 'Kioti', focus: '#case', row: 3, history: 0, dom: 'kioti' });
  await tapOrClick(r.page, '#case .back', touch); await r.wait(90); await r.mark('direct-back'); await r.expect('direct-back', { path: '', open: null, focus: '.proj[3]', row: 3, history: 1 });
  await go(r.page, -1); await r.wait(220); await r.mark('reopen'); await r.expect('reopen', { path: 'work/kioti/', open: 'Kioti', focus: '#case', history: 1, dom: 'kioti' });
  await go(r.page, 1); await r.wait(170); await r.mark('forward'); await r.expect('forward', { path: '', open: null, focus: '.proj[3]', row: 3, history: 1 });
};

const historyFlow = (touch: boolean) => async (r: Run) => {
  await r.wait(LOAD);
  await y(r.page, 'work', 0); await r.wait(90);
  await tapOrClick(r.page, '.proj[data-i="0"] .acts [data-case]', touch); await r.wait(170); await r.mark('open'); await r.expect('open', { path: 'work/airmail/', open: 'Air Mail', history: 1 });
  if (touch) await r.page.tap('#case .nav2 button:last-child'); else await press(r.page, 'ArrowRight');
  await r.wait(130); await r.mark('next'); await r.expect('next', { path: 'work/azul/', open: 'Azul', history: 1 });
  await go(r.page, -1); await r.wait(170); await r.mark('back'); await r.expect('back', { path: '', open: null, row: 1, history: 1 });
  await go(r.page, 1); await r.wait(220); await r.mark('forward'); await r.expect('forward', { path: 'work/azul/', open: 'Azul', history: 1 });
  await tapOrClick(r.page, '#case .back', touch); await r.wait(170); await r.mark('closed'); await r.expect('closed', { path: '', open: null, focus: '.proj[1]', row: 1, history: 1 });
};

const refresh = (touch: boolean) => async (r: Run) => {
  await r.wait(LOAD);
  await y(r.page, 'work', 0); await r.wait(90);
  await tapOrClick(r.page, '.proj[data-i="0"] .acts [data-case]', touch); await r.wait(170);
  if (touch) await r.page.tap('#case .nav2 button:last-child'); else await press(r.page, 'ArrowRight');
  await r.wait(130); await r.expect('paged', { path: 'work/azul/', open: 'Azul', history: 1 });
  await r.page.reload({ waitUntil: 'load' }); await r.page.waitForLoadState('networkidle'); await r.wait(150); await r.mark('reloaded');
  await r.expect('reloaded', { path: 'work/azul/', open: 'Azul', focus: '#case', row: 1, history: 1 });
  if (touch) await r.page.tap('#case .back'); else await press(r.page, 'Escape');
  await r.wait(90); await r.mark('closed'); await r.expect('closed', { path: '', open: null, focus: touch ? '.proj[1]' : '.proj[1] a.pic.rv.in', row: 1, history: 2 });
};

const ROUTES: Scenario[] = [
  { name: 'desktop-direct', profile: 'desktop', path: 'work/kioti/', fresh: true, run: direct(false) },
  { name: 'desktop-history', profile: 'desktop', fresh: true, run: historyFlow(false) },
  { name: 'desktop-refresh', profile: 'desktop', fresh: true, run: refresh(false) },
  { name: 'desktop-keys-route', profile: 'desktop', fresh: true, run: async (r) => {
    await r.wait(LOAD);
    await y(r.page, 'work', 0); await r.wait(90);
    await r.page.evaluate(() => document.querySelector<HTMLElement>('.proj[data-i="1"] h3 a')!.focus());
    await press(r.page, 'Tab'); await r.wait(10); await press(r.page, 'Enter'); await r.wait(170); await r.mark('keys-open'); await r.expect('keys-open', { path: 'work/azul/', open: 'Azul', focus: 'button.back', history: 1 });
    await press(r.page, 'ArrowRight'); await r.wait(130); await press(r.page, 'ArrowRight'); await r.wait(130); await r.mark('keys-paged'); await r.expect('keys-paged', { path: 'work/kioti/', open: 'Kioti', focus: 'button.back', history: 1 });
    await press(r.page, 'Escape'); await r.wait(170); await r.mark('keys-back'); await r.expect('keys-back', { path: '', open: null, focus: '.proj[3] a.pic.rv.in', row: 3, history: 1 });
  } },
  { name: 'desktop-keys-direct', profile: 'desktop', path: 'work/umf/', fresh: true, run: async (r) => {
    await r.wait(150); await press(r.page, 'Tab'); await r.wait(10); await r.mark('keys-direct'); await r.expect('keys-direct', { path: 'work/umf/', open: 'Unique Mānuka Factor', focus: 'button.back', row: 7 });
    await press(r.page, 'Enter'); await r.wait(90); await r.mark('keys-direct-back'); await r.expect('keys-direct-back', { path: '', open: null, focus: '.proj[7] a.pic.rv.in', row: 7, history: 1 });
  } },
  { name: 'phone-direct', profile: 'phone', path: 'work/kioti/', fresh: true, run: direct(true) },
  { name: 'phone-history', profile: 'phone', fresh: true, run: historyFlow(true) },
  { name: 'phone-refresh', profile: 'phone', fresh: true, run: refresh(true) },
  ...PROJECTS.flatMap(({ id, title }, i) => (['desktop', 'phone'] as const).map((profile): Scenario => ({ name: `${profile}-slug-${id}`, profile, path: `work/${id}/`, fresh: true, run: async (r) => { await r.wait(150); await r.mark('direct'); await r.expect('direct', { path: `work/${id}/`, open: title, focus: '#case', row: i, history: 0 }); } }))),
];

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
  ...ROUTES,
];
