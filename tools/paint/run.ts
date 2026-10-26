import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { arg, launch, site } from '../parity/lib';

export const PAINTING = /^bg-(wide|tall)\..+\.(avif|webp)$/, SHIP = /^ship\.[^.]+\.webp$/;

const root = resolve(import.meta.dir, '../..'), out = mkdtempSync(join(tmpdir(), 'paint-'));
let dist = arg('dist');
if (!dist) {
  dist = join(out, 'dist');
  const build = Bun.spawnSync(['bunx', 'astro', 'build', '--outDir', dist], { cwd: root, stdout: 'ignore', stderr: 'inherit' });
  if (build.exitCode) process.exit(build.exitCode);
}
await Bun.write(join(out, 'entry.ts'), `import * as P from ${JSON.stringify(join(root, 'src/scripts/orbit/paint.ts'))};\n(window as unknown as { __paint: typeof P }).__paint = P;\n`);
const bundle = await Bun.build({ entrypoints: [join(out, 'entry.ts')], target: 'browser', format: 'esm' });
if (!bundle.success) { console.error(bundle.logs); process.exit(1); }
const code = await bundle.outputs[0].text(), files = readdirSync(join(dist, '_astro')), { url } = site('b', dist);
const browser = await launch(), page = await browser.newPage();
await page.goto(`${url}_astro/${files.find((f) => SHIP.test(f))}`);
await page.addScriptTag({ content: code, type: 'module' });
await page.waitForFunction(() => '__paint' in window);
const run = (src: string, ship: boolean) => page.evaluate(async ([src, ship]) => {
  const P = (window as unknown as { __paint: typeof import('../../src/scripts/orbit/paint') }).__paint, img = new Image();
  img.src = src; await img.decode();
  return ship ? P.nozzles(img, []) : P.scan(img);
}, [src, ship] as const);
const paintings: Record<string, unknown> = {}, ships: Record<string, unknown> = {};
for (const f of files.sort()) {
  if (PAINTING.test(f)) paintings[f] = await run(`/_astro/${f}`, false);
  else if (SHIP.test(f)) ships[f] = await run(`/_astro/${f}`, true);
}
await browser.close();
const target = join(root, 'src/lib/paint.json');
await Bun.write(target, `${JSON.stringify({ paintings, ships })}\n`);
console.log(`wrote ${Object.keys(paintings).length} paintings and ${Object.keys(ships).length} ship to ${target}`);
process.exit(0);
