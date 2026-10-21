import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

type Project = { id: string; title: string; team: string; blurb: string; stack: string[]; url: string; fact: string };

const review = process.env.REVIEW === 'on';
const projects: Project[] = JSON.parse(readFileSync('src/projects.json', 'utf8'));
const img = (f: string) => `img/${f}`;
const layers = ['sky', 'far', 'cloud', 'ship'];

const data = {
  PLANETS: projects.map((_, i) => img(`p${i + 1}.webp`)),
  PROJECTS: projects.map(({ fact, ...p }) => p),
  SHOTS: Object.fromEntries(projects.map((p) => [p.id, img(`shot-${p.id}.webp`)])),
  IMG: { pilot: img('pilot.webp'), ...Object.fromEntries(layers.map((k) => [k, img(`${k}.webp`)])) },
  AVIF: Object.fromEntries(layers.map((k) => [k, img(`${k}.avif`)])),
  AVIF_PROBE: readFileSync('src/avif-probe.txt', 'utf8').trim(),
  FACTS: Object.fromEntries(projects.map((p) => [p.id, p.fact])),
};

let html = readFileSync('src/index.html', 'utf8').replace('/*DATA*/', Object.entries(data).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`).join('\n'));
if (!review) {
  html = html
    .replace(/<!--review-->[\s\S]*?<!--\/review-->/g, '')
    .replace(/\/\*review\*\/[\s\S]*?\/\*\/review\*\/\n/g, '')
    .replace('<meta name="viewport"', '<meta name="robots" content="noindex">\n<meta name="viewport"');
} else html = html.replace(/<!--\/?review-->|\/\*\/?review\*\/\n/g, '');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
cpSync('assets', 'dist/img', { recursive: true });
cpSync('public', 'dist', { recursive: true });
writeFileSync('dist/index.html', html);
console.log(`dist/index.html ${Math.round(html.length / 1024)} KB${review ? ' with the Review tab' : ''}`);
