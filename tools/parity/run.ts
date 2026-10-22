import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { arg, site } from './lib';
import { trace } from './trace';
import { css } from './css';
import { video } from './video';
import { timing } from './timing';
import { health } from './health';
import { keys } from './keys';
import { output } from './output';

const check = process.argv[2] ?? 'trace';
const out = arg('out', join(tmpdir(), `parity-${Date.now()}`))!;
mkdirSync(out, { recursive: true });
const a = site('a', arg('a', 'https://next.louis.gg')!), b = site('b', arg('b', 'dist')!, arg('swap'), arg('base'));
console.log(`parity ${check} a=${a.url} b=${b.url}${b.swap ? ` swap=${b.swap}` : ''} out=${out}`);

if (check === 'trace') await trace(a, b, out, arg('only'));
if (check === 'css') await css(a, b, out, arg('snapshots', join(out, 'trace'))!);
if (check === 'video') await video(a, b, out, arg('only'));
if (check === 'timing') await timing(a, b, out, Number(arg('runs', '3')));
if (check === 'health') await health([a, b], out);
if (check === 'keys') await keys([a, b], out);
if (check === 'output') process.exit((await output(arg('b', 'dist')!, process.argv.includes('--review'))).length ? 1 : 0);
process.exit(0);
