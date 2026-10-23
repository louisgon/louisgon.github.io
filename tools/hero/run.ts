import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { arg, site } from '../parity/lib';
import { launch, type Ctx } from './lib';
import { egg } from './egg';
import { flow } from './flow';
import { rogue } from './rogue';
import { a11y } from './a11y';
import { swipe } from './swipe';
import { pause } from './pause';

const CHECKS = { egg, flow, rogue, a11y, swipe, pause };
const only = arg('only')?.split(','), out = resolve(arg('out', join(tmpdir(), `hero-${Date.now()}`))!);
let dist = arg('dist');
mkdirSync(out, { recursive: true });
if (!dist) {
  dist = join(out, 'dist');
  const build = Bun.spawnSync(['bunx', 'astro', 'build', '--mode', 'test', '--outDir', dist], { stdout: 'ignore', stderr: 'inherit' });
  if (build.exitCode) process.exit(build.exitCode);
}
const { url } = site('b', dist), browser = await launch(), fails: string[] = [];
const c: Ctx = { browser, url, out, ok: (name, pass, detail) => { console.log(`${pass ? 'pass' : 'FAIL'}  ${name}${detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`); if (!pass) fails.push(name); } };
console.log(`hero checks on ${url} (${dist}), screenshots in ${out}`);
for (const [name, check] of Object.entries(CHECKS)) if (!only || only.includes(name)) { console.log(`\n${name}`); await check(c); }
await browser.close();
console.log(fails.length ? `\n${fails.length} failed\n${fails.join('\n')}` : '\nall hero checks pass');
process.exit(fails.length ? 1 : 0);
