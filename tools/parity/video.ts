import { mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, open, type Site } from './lib';
import { SCENARIOS } from './scenarios';

const SET = ['desktop-load', 'desktop-reload', 'desktop-hash', 'desktop-nav', 'desktop-case', 'phone-load', 'phone-reload', 'phone-hash', 'phone-menu', 'phone-case', 'desktop-direct', 'desktop-history', 'desktop-refresh', 'phone-direct', 'phone-history', 'phone-refresh'];

export function blips(file: string) {
  const raw = Bun.spawnSync(['ffmpeg', '-v', 'error', '-i', file, '-vf', 'fps=25,scale=4:4:flags=area,format=gray', '-f', 'rawvideo', '-']).stdout;
  const frames = Array.from({ length: Math.floor(raw.length / 16) }, (_, i) => raw.subarray(i * 16, i * 16 + 16));
  return frames.map((f, i) => (i === 0 || i === frames.length - 1 ? 0 : Math.max(...Array.from(f, (v, t) => Math.abs(v - (frames[i - 1][t] + frames[i + 1][t]) / 2)))));
}

function sheet(file: string, at: number[], out: string) {
  if (!at.length) return;
  const select = at.flatMap((f) => [f - 1, f, f + 1]).map((f) => `eq(n\\,${f})`).join('+');
  Bun.spawnSync(['ffmpeg', '-v', 'error', '-y', '-i', file, '-vf', `fps=25,select='${select}',scale=480:-1,tile=3x${at.length}`, '-frames:v', '1', out]);
}

export async function video(a: Site, b: Site, out: string, only?: string) {
  const browser = await launch(), lines: string[] = [];
  for (const sc of SCENARIOS.filter((s) => SET.includes(s.name) && (!only || only.split(',').some((o) => s.name.includes(o))))) {
    const peaks: Record<string, number[][]> = {};
    for (const s of sc.fresh ? [b] : [a, b]) {
      const dir = join(out, 'video', sc.name, s.name); mkdirSync(dir, { recursive: true });
      const { page, context, errors } = await open(browser, s, { profile: sc.profile, path: sc.path, hash: sc.hash, video: dir });
      await sc.run({ page, wait: (n) => page.waitForTimeout(n * 16.7), mark: async () => {}, expect: async () => {} });
      await context.close();
      const file = join(dir, `${s.name}.webm`); renameSync(join(dir, readdirSync(dir).find((f) => f.endsWith('.webm'))!), file);
      const score = blips(file), top = score.map((v, i) => [i, Math.round(v)]).filter(([, v]) => v >= 12).sort((x, y) => y[1] - x[1]).slice(0, 12);
      peaks[s.name] = top;
      sheet(file, top.slice(0, 6).map(([i]) => i), join(out, 'video', sc.name, `${s.name}-peaks.png`));
      writeFileSync(join(dir, 'blips.json'), JSON.stringify({ score: score.map((v) => Math.round(v)), errors }));
    }
    const list = (k: 'a' | 'b') => (peaks[k] ? `${k} max ${peaks[k][0]?.[1] ?? 0} (${peaks[k].length} peaks) ${peaks[k].map(([i, v]) => `${(i / 25).toFixed(2)}s:${v}`).join(' ')}` : `${k} skipped`);
    lines.push(`${sc.name}: ${list('a')} | ${list('b')}`);
    console.log(lines.at(-1));
  }
  await browser.close();
  writeFileSync(join(out, 'video', 'summary.txt'), lines.join('\n') + '\n');
}
