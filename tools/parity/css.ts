import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser, Page } from 'playwright';
import { launch, type Profile, PROFILES, type Site } from './lib';
import { MASKS, type Mask } from './scenarios';

const VIEWS: Record<Profile, { width: number; height: number }[]> = { desktop: [{ width: 1440, height: 900 }, { width: 1024, height: 768 }], phone: [{ width: 390, height: 844 }, { width: 820, height: 1180 }] };
const FORCE = 'a, button, .proj, .card, #pilot .roles li, .sg-mail, #clients, nav .links a';

const styles = async (url: string) => [...(await (await fetch(url)).text()).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');

function page(snapshot: string, css: string, base: string) {
  return snapshot.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace('<head>', `<head><base href="${base}"><style>${css}</style>`);
}

function signatures([selector, mask]: [string | null, Mask | null]) {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }
  const roots = selector ? [...document.querySelectorAll(selector)] : [document.documentElement];
  const out: [string, string][] = [];
  const path = (el: Element) => { const p: number[] = []; for (let e: Element | null = el; e && e.parentElement; e = e.parentElement) p.unshift([...e.parentElement.children].indexOf(e)); return p.join('/'); };
  const read = (s: CSSStyleDeclaration) => { let t = ''; for (let i = 0; i < s.length; i++) t += `${s[i]}:${s.getPropertyValue(s[i])};`; return t; };
  for (const root of roots) for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'BASE' || (mask && el.closest(mask.skip))) continue;
    const p = path(el);
    out.push([p, read(getComputedStyle(el))], [`${p}::before`, read(getComputedStyle(el, '::before'))], [`${p}::after`, read(getComputedStyle(el, '::after'))]);
  }
  return out;
}

function diff(a: [string, string][], b: [string, string][]) {
  const B = new Map(b), out: { el: string; prop: string; a: string; b: string }[] = [];
  for (const [k, va] of a) {
    const vb = B.get(k) ?? '';
    if (va === vb) continue;
    const pa = new Map(va.split(';').map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)])), pb = new Map(vb.split(';').map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]));
    for (const p of new Set([...pa.keys(), ...pb.keys()])) if (pa.get(p) !== pb.get(p)) out.push({ el: k, prop: p, a: pa.get(p) ?? '', b: pb.get(p) ?? '' });
  }
  return out;
}

async function forced(pa: Page, pb: Page, mask: Mask | null) {
  const out: ReturnType<typeof diff> = [];
  const count = await pa.evaluate((sel) => { document.querySelectorAll(sel).forEach((e, i) => e.setAttribute('data-pq', String(i))); return document.querySelectorAll(sel).length; }, FORCE);
  await pb.evaluate((sel) => document.querySelectorAll(sel).forEach((e, i) => e.setAttribute('data-pq', String(i))), FORCE);
  const sessions = await Promise.all([pa, pb].map(async (p) => { const s = await p.context().newCDPSession(p); await s.send('DOM.enable'); await s.send('CSS.enable'); return s; }));
  const roots = await Promise.all(sessions.map((s) => s.send('DOM.getDocument', { depth: -1 })));
  for (const state of [['hover'], ['focus', 'focus-visible']]) for (let i = 0; i < count; i++) {
    const ids = await Promise.all(sessions.map((s, j) => s.send('DOM.querySelector', { nodeId: roots[j].root.nodeId, selector: `[data-pq="${i}"]` })));
    await Promise.all(sessions.map((s, j) => s.send('CSS.forcePseudoState', { nodeId: ids[j].nodeId, forcedPseudoClasses: state })));
    const [sa, sb] = await Promise.all([pa, pb].map((p) => p.evaluate(signatures, [`[data-pq="${i}"]`, mask] as [string, Mask | null])));
    out.push(...diff(sa, sb).map((d) => ({ ...d, el: `${state.join('+')} ${d.el}` })));
    await Promise.all(sessions.map((s, j) => s.send('CSS.forcePseudoState', { nodeId: ids[j].nodeId, forcedPseudoClasses: [] })));
  }
  return out;
}

export async function css(a: Site, b: Site, out: string, snapshots: string, masked?: string) {
  const mask = masked ? MASKS[masked] : null, browser: Browser = await launch(), [cssA, cssB] = await Promise.all([styles(a.url), styles(b.url)]), lines: string[] = [];
  mkdirSync(join(out, 'css'), { recursive: true });
  for (const scenario of readdirSync(snapshots, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
    const dir = join(snapshots, scenario);
    const profile: Profile = scenario.startsWith('phone') ? 'phone' : 'desktop';
    for (const file of readdirSync(dir).filter((f) => f.startsWith('a-') && f.endsWith('.html')).sort()) {
      const snap = readFileSync(join(dir, file), 'utf8');
      for (const viewport of VIEWS[profile]) for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        const ctx = await browser.newContext({ ...PROFILES[profile], viewport, reducedMotion });
        const [pa, pb] = await Promise.all([ctx.newPage(), ctx.newPage()]);
        await Promise.all([pa.setContent(page(snap, cssA, a.url), { waitUntil: 'load' }), pb.setContent(page(snap, cssB, a.url), { waitUntil: 'load' })]);
        await Promise.all([pa, pb].map((p) => p.evaluate(() => document.fonts.ready.then(() => undefined))));
        const d = diff(await pa.evaluate(signatures, [null, mask] as [null, Mask | null]), await pb.evaluate(signatures, [null, mask] as [null, Mask | null]));
        if (reducedMotion === 'no-preference' && viewport === VIEWS[profile][0] && /sections|case-open|menu/.test(scenario + file)) d.push(...(await forced(pa, pb, mask)));
        const label = `${scenario}/${file.slice(2, -5)} ${viewport.width}x${viewport.height} ${reducedMotion}`;
        lines.push(`${label}: ${d.length} differences`); console.log(lines.at(-1));
        if (d.length) writeFileSync(join(out, 'css', `${scenario}-${file.slice(2, -5)}-${viewport.width}-${reducedMotion}.json`), JSON.stringify(d.slice(0, 300), null, 1));
        await ctx.close();
      }
    }
  }
  await browser.close();
  writeFileSync(join(out, 'css', 'summary.txt'), lines.join('\n') + '\n');
}
