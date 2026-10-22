import sharp from 'sharp';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import projects from '../../src/content/projects.json';

const TWO_D = /\b(translate[XYZ]?|scale[XYZ]?|rotate[XYZ]?|translate|scale|rotate)\(/g;
const NOINDEX = '<meta name="robots" content="noindex">';
const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(dir, e.name)) : /\.(ts|astro|css)$/.test(e.name) ? [join(dir, e.name)] : []));

export async function output(dist: string, review: boolean) {
  const problems: string[] = [], html = readFileSync(join(dist, 'index.html'), 'utf8');
  const pages = [['index.html', html], ...projects.filter((p) => existsSync(join(dist, 'work', p.id, 'index.html'))).map((p) => [`work/${p.id}/index.html`, readFileSync(join(dist, 'work', p.id, 'index.html'), 'utf8')])];
  for (const [name, page] of pages) for (const m of [...page.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').matchAll(TWO_D)) problems.push(`2D transform in ${name} CSS: ${m[0]}`);
  for (const file of sources('src')) for (const m of readFileSync(file, 'utf8').matchAll(/(?:transform|keyframes)[^;{}]*?\b(translate[XYZ]?|scale[XYZ]?|rotate[XYZ]?|translate|scale|rotate)\(/g)) problems.push(`2D transform in ${file}: ${m[1]}(`);
  if (review !== html.includes('id="rvw"')) problems.push(`Review tab ${review ? 'missing' : 'present'}`);
  if (!review && /space-review|\.rvw \.box/.test(html + readdirSync(join(dist, '_astro')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, '_astro', f), 'utf8')).join(''))) problems.push('Review code in the live build');
  if (review === html.includes(NOINDEX)) problems.push(`noindex meta ${review ? 'present' : 'missing'}`);
  for (const p of projects) {
    const file = join(dist, 'work', p.id, 'index.html');
    if (!existsSync(file)) { problems.push(`work/${p.id}/index.html missing`); continue; }
    const page = readFileSync(file, 'utf8'), at = `work/${p.id}`;
    if (!page.includes(`<title>${p.title} case study · Louis Gonzalez</title>`)) problems.push(`${at} title`);
    if (!/<meta name="description" content="[^"]+">/.test(page)) problems.push(`${at} description`);
    if (!new RegExp(`<link rel="canonical" href="https://[^"]+/${at}/">`).test(page)) problems.push(`${at} canonical`);
    if (!page.includes(`aria-label="${p.title} case study"><div class="cpw" id="cpw" aria-hidden="true"><div class="cplanet">`) || !page.includes('<div class="chd" data-stage>')) problems.push(`${at} case not server rendered`);
    if (review === page.includes(NOINDEX)) problems.push(`${at} noindex meta ${review ? 'present' : 'missing'}`);
    if ((html.match(new RegExp(`href="[^"]*/${at}/"`, 'g')) ?? []).length !== 3) problems.push(`home links to ${at}`);
  }
  if (!existsSync(join(dist, '_headers')) || !readFileSync(join(dist, '_headers'), 'utf8').includes('X-Robots-Tag: noindex')) problems.push('X-Robots-Tag header missing');
  for (const f of readdirSync(join(dist, '_astro')).filter((f) => /\.(webp|avif)$/.test(f))) {
    const name = f.split('.')[0], [out, src] = await Promise.all([sharp(join(dist, '_astro', f)).metadata(), sharp(join('src/assets', `${name}.webp`)).metadata()]);
    if (out.width !== src.width || out.height !== src.height) problems.push(`${f} is ${out.width}x${out.height}, source ${src.width}x${src.height}`);
  }
  console.log(problems.length ? problems.join('\n') : `output: clean (${review ? 'review' : 'live'} build)`);
  return problems;
}
