import sharp from 'sharp';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TWO_D = /\b(translate[XYZ]?|scale[XYZ]?|rotate[XYZ]?|translate|scale|rotate)\(/g;
const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(dir, e.name)) : /\.(ts|astro|css)$/.test(e.name) ? [join(dir, e.name)] : []));

export async function output(dist: string, review: boolean) {
  const problems: string[] = [], html = readFileSync(join(dist, 'index.html'), 'utf8');
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  for (const m of css.matchAll(TWO_D)) problems.push(`2D transform in built CSS: ${m[0]}`);
  for (const file of sources('src')) for (const m of readFileSync(file, 'utf8').matchAll(/(?:transform|keyframes)[^;{}]*?\b(translate[XYZ]?|scale[XYZ]?|rotate[XYZ]?|translate|scale|rotate)\(/g)) problems.push(`2D transform in ${file}: ${m[1]}(`);
  if (review !== html.includes('id="rvw"')) problems.push(`Review tab ${review ? 'missing' : 'present'}`);
  if (!review && /space-review|\.rvw \.box/.test(html + readdirSync(join(dist, '_astro')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, '_astro', f), 'utf8')).join(''))) problems.push('Review code in the live build');
  if (review === html.includes('<meta name="robots" content="noindex">')) problems.push(`noindex meta ${review ? 'present' : 'missing'}`);
  if (!existsSync(join(dist, '_headers')) || !readFileSync(join(dist, '_headers'), 'utf8').includes('X-Robots-Tag: noindex')) problems.push('X-Robots-Tag header missing');
  for (const f of readdirSync(join(dist, '_astro')).filter((f) => /\.(webp|avif)$/.test(f))) {
    const name = f.split('.')[0], [out, src] = await Promise.all([sharp(join(dist, '_astro', f)).metadata(), sharp(join('src/assets', `${name}.webp`)).metadata()]);
    if (out.width !== src.width || out.height !== src.height) problems.push(`${f} is ${out.width}x${out.height}, source ${src.width}x${src.height}`);
  }
  console.log(problems.length ? problems.join('\n') : `output: clean (${review ? 'review' : 'live'} build)`);
  return problems;
}
