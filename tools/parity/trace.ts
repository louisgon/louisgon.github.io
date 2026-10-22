import type { Browser } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { frames, launch, normalise, open, type Site } from './lib';
import { SCENARIOS, type Scenario } from './scenarios';
import { pixelDiff } from './pixels';

type Delta = Record<string, string | null>;


function snapshotDelta() {
  const w = window as unknown as { __prev?: Record<string, string> };
  const cur: Record<string, string> = {};
  const describe = (el: Element | null) => { const p: number[] = []; for (let e = el; e && e.parentElement; e = e.parentElement) p.unshift([...e.parentElement.children].indexOf(e)); return p.join('/'); };
  const walk = (el: Element, path: string) => {
    if (el.tagName === 'SCRIPT') return;
    const attrs = el.getAttributeNames().filter((n) => n !== 'style').sort().map((n) => `${n}=${el.getAttribute(n)}`);
    let text = ''; el.childNodes.forEach((c) => { if (c.nodeType === 3) text += c.textContent; });
    cur[path] = `${el.tagName}|${attrs.join(' ')}|${(el as HTMLElement).style?.cssText ?? ''}|${text.replace(/\s+/g, ' ').trim()}`;
    [...el.children].forEach((c, i) => walk(c, `${path}/${i}`));
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

async function record(browser: Browser, s: Site, sc: Scenario, dir: string) {
  const { page, context, errors } = await open(browser, s, { profile: sc.profile, deterministic: true, hash: sc.hash });
  const deltas: Delta[] = [], marks: string[] = [];
  let n = 0;
  const sample = async () => { const d = await page.evaluate(snapshotDelta); for (const k in d) if (d[k] !== null) d[k] = normalise(d[k]!); deltas.push(d); };
  await sample();
  await sc.run({
    page,
    wait: (count) => frames(page, count, async () => { if (++n % 2 === 0) await sample(); }),
    mark: async (label) => {
      await sample(); marks.push(label);
      await page.screenshot({ path: join(dir, `${s.name}-${label}.png`) });
      if (s.name === 'a') writeFileSync(join(dir, `a-${label}.html`), await page.evaluate(() => document.documentElement.outerHTML));
    },
  });
  await context.close();
  return { deltas, marks, errors };
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

export async function trace(a: Site, b: Site, out: string, only?: string) {
  const browser = await launch(), summary: string[] = [], queue = SCENARIOS.filter((s) => !only || only.split(',').some((o) => s.name.includes(o)));
  const worker = async () => { for (let sc = queue.shift(); sc; sc = queue.shift()) await one(sc); };
  const one = async (sc: Scenario) => {
    const dir = join(out, 'trace', sc.name); mkdirSync(dir, { recursive: true });
    const [ra, rb] = await Promise.all([record(browser, a, sc, dir), record(browser, b, sc, dir)]), r = compare(ra.deltas, rb.deltas);
    const shots = await Promise.all(ra.marks.map(async (m) => ({ mark: m, ...(await pixelDiff(join(dir, `a-${m}.png`), join(dir, `b-${m}.png`), join(dir, `diff-${m}.png`))) })));
    writeFileSync(join(dir, 'report.json'), JSON.stringify({ ...r, shots, errors: { a: ra.errors, b: rb.errors } }, null, 1));
    summary.push(`${sc.name}: ${r.bad}/${r.samples} samples differ (${r.noise} random only)${r.ranges.length ? ` in ${r.ranges.map(([x, y]) => (x === y ? x : `${x}-${y}`)).join(' ')}` : ''}, lengths ${r.lengths.join('/')}, shots ${shots.map((s) => `${s.mark} ${s.changed}px`).join(', ')}, errors ${ra.errors.length}/${rb.errors.length}`);
    console.log(summary.at(-1));
  };
  await Promise.all(Array.from({ length: Number(process.env.PARITY_JOBS ?? 3) }, worker));
  await browser.close();
  writeFileSync(join(out, 'trace', 'summary.txt'), summary.join('\n') + '\n');
}
