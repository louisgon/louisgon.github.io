import type { Browser } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { frames, launch, normalise, open, type Site } from './lib';
import { MASKS, SCENARIOS, type Mask, type Scenario, type Want } from './scenarios';
import { pixelDiff } from './pixels';

type Delta = Record<string, string | null>;


function snapshotDelta(mask: Mask | null) {
  const w = window as unknown as { __prev?: Record<string, string> };
  const cur: Record<string, string> = {};
  const kids = (el: Element) => [...el.children].filter((c) => !mask || !c.matches(mask.skip));
  const describe = (el: Element | null) => { const p: number[] = []; for (let e = el; e && e.parentElement; e = e.parentElement) { if (mask && e.matches(mask.skip)) return 'masked'; p.unshift(kids(e.parentElement).indexOf(e)); } return p.join('/'); };
  const walk = (el: Element, path: string) => {
    if (el.tagName === 'SCRIPT') return;
    const attrs = el.getAttributeNames().filter((n) => n !== 'style').sort().map((n) => `${n}=${mask && el === document.body && n === 'class' ? el.className.split(' ').filter((c) => !mask.classes.includes(c)).join(' ') : el.getAttribute(n)}`);
    let text = ''; el.childNodes.forEach((c) => { if (c.nodeType === 3) text += c.textContent; });
    cur[path] = `${el.tagName}|${attrs.join(' ')}|${(el as HTMLElement).style?.cssText ?? ''}|${text.replace(/\s+/g, ' ').trim()}`;
    kids(el).forEach((c, i) => walk(c, `${path}/${i}`));
  };
  walk(document.body, 'body');
  cur.html = `${document.documentElement.className}|${document.documentElement.style.cssText}`;
  cur.scroll = `${scrollX},${Math.round(scrollY * 100) / 100},${document.getElementById('case')?.scrollTop ?? 0}`;
  cur.focus = describe(document.activeElement);
  const prev = w.__prev ?? {}, delta: Record<string, string | null> = {};
  for (const k in cur) if (prev[k] !== cur[k]) delta[k] = cur[k];
  for (const k in prev) if (!(k in cur)) delta[k] = null;
  w.__prev = cur;
  return delta;
}

function routeState() {
  const c = document.getElementById('case')!, a = document.activeElement as HTMLElement | null, mid = innerHeight / 2, row = (el: Element) => (el as HTMLElement).dataset.i;
  const rows = [...document.querySelectorAll('.proj')].map((r) => { const b = r.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - mid); });
  const p = a?.closest('.proj'), focus = !a || a === document.body ? 'body' : a.id ? `#${a.id}` : a.matches('.proj') ? `.proj[${row(a)}]` : `${p ? `.proj[${row(p)}] ` : ''}${a.tagName.toLowerCase()}.${[...a.classList].join('.')}`;
  const dom = c.cloneNode(true) as HTMLElement; dom.querySelectorAll('.moon').forEach((m) => m.removeAttribute('style'));
  return { path: location.pathname, open: c.classList.contains('on') ? c.getAttribute('aria-label')!.replace(/ case study$/, '') : null, focus, row: rows.indexOf(Math.min(...rows)), history: history.length, title: document.title, canonical: new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).pathname, dom: dom.outerHTML };
}

async function record(browser: Browser, s: Site, sc: Scenario, dir: string, mask: Mask | null) {
  const { page, context, errors } = await open(browser, s, { profile: sc.profile, deterministic: true, path: sc.path, hash: sc.hash });
  const deltas: Delta[] = [], marks: string[] = [], checks: string[] = [], fails: string[] = [], doms: Record<string, string> = {}, base = new URL(s.url).pathname;
  const h0 = await page.evaluate(() => history.length);
  let n = 0;
  const sample = async () => { const d = await page.evaluate(snapshotDelta, mask); for (const k in d) if (d[k] !== null) d[k] = normalise(d[k]!); deltas.push(d); };
  await sample();
  await sc.run({
    page,
    wait: (count) => frames(page, count, async () => { if (++n % 2 === 0) await sample(); }),
    mark: async (label) => {
      await sample(); marks.push(label);
      await page.screenshot({ path: join(dir, `${s.name}-${label}.png`) });
      if (s.name === 'a') writeFileSync(join(dir, `a-${label}.html`), await page.evaluate(() => document.documentElement.outerHTML));
    },
    expect: async (label: string, want: Want) => {
      const got = await page.evaluate(routeState), bad: string[] = [];
      const meta = got.open ? `${got.open} case study · Louis Gonzalez` : 'Louis Gonzalez';
      if (want.path !== undefined && got.path !== base + want.path) bad.push(`path ${got.path}`);
      if (want.open !== undefined && got.open !== want.open) bad.push(`open ${got.open}`);
      if (want.focus !== undefined && got.focus !== want.focus) bad.push(`focus ${got.focus}`);
      if (want.row !== undefined && got.row !== want.row) bad.push(`row ${got.row}`);
      if (want.history !== undefined && got.history - h0 !== want.history) bad.push(`history ${got.history - h0}`);
      if (got.title !== meta) bad.push(`title ${got.title}`);
      if (got.canonical !== got.path) bad.push(`canonical ${got.canonical}`);
      if (want.dom) { if (doms[want.dom] === undefined) doms[want.dom] = got.dom; else if (doms[want.dom] !== got.dom) { bad.push(`dom differs from ${want.dom}`); writeFileSync(join(dir, `dom-${label}.html`), `${doms[want.dom]}\n\n${got.dom}`); } }
      checks.push(label); if (bad.length) fails.push(`${label}: ${bad.join(', ')}`);
    },
  });
  await context.close();
  return { deltas, marks, errors, checks, fails };
}

const random = (k: string, a = '', b = '') => { const [x, y] = [a, b].map((v) => v.split('|')); return x.length === 4 && y.length === 4 && x.slice(0, 3).join() === y.slice(0, 3).join() && (/^display: inline-block; width: [\d.]+px; text-align: center;$/.test(x[2]) || /id=sig[VL]/.test(x[1])); };

function compare(a: Delta[], b: Delta[]) {
  const A: Record<string, string> = {}, B: Record<string, string> = {}, diffs: { sample: number; key: string; a?: string; b?: string }[] = [];
  let bad = 0, noise = 0;
  const ranges: [number, number][] = [], byKey: Record<string, number> = {};
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    for (const [S, d] of [[A, a[i]], [B, b[i]]] as const) for (const k in d ?? {}) { const v = d[k]; if (v === null) delete S[k]; else S[k] = v; }
    const keys = new Set([...Object.keys(A), ...Object.keys(B)]); let any = false, rnd = false;
    for (const k of keys) if (A[k] !== B[k]) { if (random(k, A[k], B[k])) { rnd = true; continue; } any = true; byKey[k] = (byKey[k] ?? 0) + 1; if (diffs.length < 400) diffs.push({ sample: i, key: k, a: A[k], b: B[k] }); }
    if (any) { bad++; const r = ranges.at(-1); if (r && r[1] === i - 1) r[1] = i; else ranges.push([i, i]); } else if (rnd) noise++;
  }
  return { samples: Math.max(a.length, b.length), lengths: [a.length, b.length], bad, noise, ranges, byKey, diffs };
}

export async function trace(a: Site, b: Site, out: string, only?: string, masked?: string) {
  const mask = masked ? MASKS[masked] : null, browser = await launch(), summary: string[] = [], queue = SCENARIOS.filter((s) => !only || only.split(',').some((o) => s.name.includes(o)));
  const worker = async () => { for (let sc = queue.shift(); sc; sc = queue.shift()) await one(sc); };
  const one = async (sc: Scenario) => {
    const dir = join(out, 'trace', sc.name); mkdirSync(dir, { recursive: true });
    if (sc.fresh) {
      const rb = await record(browser, b, sc, dir, mask);
      writeFileSync(join(dir, 'report.json'), JSON.stringify({ marks: rb.marks, checks: rb.checks, fails: rb.fails, errors: rb.errors }, null, 1));
      summary.push(`${sc.name}: b only, ${rb.checks.length - rb.fails.length}/${rb.checks.length} checks pass${rb.fails.length ? ` (${rb.fails.join('; ')})` : ''}, errors ${rb.errors.length}`);
      console.log(summary.at(-1)); return;
    }
    const [ra, rb] = await Promise.all([record(browser, a, sc, dir, mask), record(browser, b, sc, dir, mask)]), r = compare(ra.deltas, rb.deltas);
    const shots = await Promise.all(ra.marks.map(async (m) => ({ mark: m, ...(await pixelDiff(join(dir, `a-${m}.png`), join(dir, `b-${m}.png`), join(dir, `diff-${m}.png`))) })));
    writeFileSync(join(dir, 'report.json'), JSON.stringify({ ...r, shots, errors: { a: ra.errors, b: rb.errors } }, null, 1));
    summary.push(`${sc.name}: ${r.bad}/${r.samples} samples differ (${r.noise} random only)${r.ranges.length ? ` in ${r.ranges.map(([x, y]) => (x === y ? x : `${x}-${y}`)).join(' ')}` : ''}, lengths ${r.lengths.join('/')}, shots ${shots.map((s) => `${s.mark} ${s.changed}px${mask?.marks.includes(`${sc.name}/${s.mark}`) ? ` (${masked} on screen)` : ''}`).join(', ')}, errors ${ra.errors.length}/${rb.errors.length}`);
    console.log(summary.at(-1));
  };
  await Promise.all(Array.from({ length: Number(process.env.PARITY_JOBS ?? 3) }, worker));
  await browser.close();
  writeFileSync(join(out, 'trace', 'summary.txt'), summary.join('\n') + '\n');
}
