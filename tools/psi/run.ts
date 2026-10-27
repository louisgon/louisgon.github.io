import { brotliCompressSync, constants } from 'node:zlib';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    runs: { type: 'string', default: '10' },
    form: { type: 'string', default: 'mobile,desktop' },
    out: { type: 'string', default: join(process.env.TMPDIR ?? '/tmp', 'psi') },
    cpus: { type: 'string', default: 'mobile=1,desktop=1.25' },
    period: { type: 'string', default: '5000' },
    trace: { type: 'boolean', default: false },
    flags: { type: 'string', default: '' },
    summary: { type: 'boolean', default: false },
  },
});

type Row = { arm: string; form: string; perf: number; fcp: number; lcp: number; tbt: number; si: number; fp: number; load: number; tasks: string };

const read = async (file: string): Promise<Row> => {
  const j = await Bun.file(file).json();
  const a = j.audits, n = (k: string) => Math.round(a[k].numericValue);
  const m = a.metrics.details.items[0];
  const [arm, form] = file.split('/').pop()!.split('-');
  const tasks = a['long-tasks'].details.items
    .filter((t: { duration: number }) => t.duration > 50)
    .map((t: { url: string; startTime: number; duration: number }) => `${t.url.split('/').pop()?.slice(0, 14)}@${Math.round(t.startTime)}:${Math.round(t.duration)}`)
    .join(' ');
  return { arm, form, perf: Math.round(j.categories.performance.score * 100), fcp: n('first-contentful-paint'), lcp: n('largest-contentful-paint'), tbt: n('total-blocking-time'), si: n('speed-index'), fp: m.observedFirstPaint, load: m.observedLoad, tasks };
};

const median = (xs: number[]) => {
  const s = [...xs].sort((x, y) => x - y), h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

const summarise = async (dir: string) => {
  const files = (await readdir(dir)).filter((f) => /^[\w]+-(mobile|desktop)-\d+\.json$/.test(f)).sort();
  const rows = await Promise.all(files.map((f) => read(join(dir, f))));
  const groups = Map.groupBy(rows, (r) => `${r.arm} ${r.form}`);
  console.log('arm form\tperf (runs)\tFCP\tLCP\tTBT\tSI\tfirstPaint (runs)\tload\tlong tasks over 50ms');
  for (const [key, rs] of [...groups].sort()) {
    const c = (k: keyof Row) => median(rs.map((r) => r[k] as number));
    const tasks = rs.filter((r) => r.tasks).length;
    console.log([key, `${c('perf')} (${rs.map((r) => r.perf).join(',')})`, c('fcp'), c('lcp'), c('tbt'), c('si'), `${c('fp')} (${rs.map((r) => r.fp).join(',')})`, c('load'), `${tasks}/${rs.length} runs`].join('\t'));
  }
  for (const r of rows) if (r.tasks) console.log(`  ${r.arm} ${r.form} ${r.tasks}`);
};

const out = resolve(values.out);
if (values.summary) {
  await summarise(out);
  process.exit(0);
}

const arms = positionals.map((p) => { const [name, dist] = p.split('='); return { name, dist: resolve(dist) }; });
if (!arms.length || arms.some((a) => !/^\w+$/.test(a.name))) throw new Error('usage: bun tools/psi/run.ts [--runs 10] [--form mobile,desktop] [--out dir] name=dist ...');

const here = import.meta.dir, sites = join(out, 'sites');
await rm(sites, { recursive: true, force: true });
await mkdir(sites, { recursive: true });
const walk = async (d: string): Promise<string[]> => (await Promise.all((await readdir(d, { withFileTypes: true })).map((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])))).flat();
for (const { name, dist } of arms) {
  await cp(dist, join(sites, name), { recursive: true });
  for (const f of await walk(join(sites, name)))
    if (/\.(html|js|css|json|svg)$/.test(f)) await Bun.write(`${f}.br`, brotliCompressSync(await Bun.file(f).bytes(), { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } }));
}
await Bun.write(join(out, 'Caddyfile'), `{\n  local_certs\n  skip_install_trust\n  auto_https disable_redirects\n  admin off\n}\n` + arms.map(({ name }) => `https://${name}.test {\n  tls internal\n  root * /sites/${name}\n  header X-Robots-Tag noindex\n  header Cache-Control "public, max-age=0, must-revalidate"\n  file_server {\n    precompressed br\n  }\n}\n`).join(''));

const sh = (cmd: string[]) => { const p = Bun.spawnSync(cmd, { stdout: 'pipe', stderr: 'pipe' }); if (p.exitCode) throw new Error(`${cmd.join(' ')}\n${p.stderr}`); return p.stdout.toString().trim(); };
sh(['docker', 'build', '-q', '-t', 'louisgg-psi', here]);
const cpus = (form: string) => Number(/=/.test(values.cpus) ? new URLSearchParams(values.cpus.replaceAll(',', '&')).get(form) : values.cpus);
const tag = `louisgg-psi-${process.pid}`;
sh(['docker', 'network', 'create', tag]);
await mkdir(join(out, 'pki'), { recursive: true });
const web = sh(['docker', 'run', '-d', '--rm', '--network', tag, '-e', 'XDG_DATA_HOME=/data', '-v', `${join(out, 'pki')}:/data`, '-v', `${sites}:/sites:ro`, '-v', `${join(out, 'Caddyfile')}:/etc/caddy/Caddyfile:ro`, 'louisgg-psi', 'caddy', 'run', '--config', '/etc/caddy/Caddyfile']);
const id = sh(['docker', 'run', '-d', '--rm', '--network', tag, `--cpu-period=${values.period}`, '--shm-size=1g', '-v', `${out}:/out`, '-v', `${join(out, 'pki')}:/pki:ro`, 'louisgg-psi', 'sleep', 'infinity']);
const ip = sh(['docker', 'inspect', '-f', '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}', web]);
const stop = () => { for (const c of [id, web]) Bun.spawnSync(['docker', 'rm', '-f', c], { stdout: 'ignore', stderr: 'ignore' }); Bun.spawnSync(['docker', 'network', 'rm', tag], { stdout: 'ignore', stderr: 'ignore' }); };
process.on('SIGINT', () => { stop(); process.exit(130); });
try {
  await Bun.sleep(1500);
  console.log(sh(['docker', 'exec', id, 'chromium', '--version']));
  const runs = Number(values.runs), forms = values.form.split(',');
  const env = [...(values.trace ? ['-e', 'TRACE=1', '-e', 'CATS=disabled-by-default-v8.cpu_profiler,blink,cc,gpu,viz,skia,disabled-by-default-devtools.timeline.stack'] : []), '-e', `FLAGS=${values.flags}`, '-e', `HOSTS=${ip}`];
  for (let i = 0; i < runs; i++)
    for (const form of forms) {
      sh(['docker', 'update', `--cpu-quota=${Math.round(cpus(form) * Number(values.period))}`, id]);
      for (const { name } of arms) {
        const file = `${name}-${form}-${String(i).padStart(2, '0')}`;
        sh(['docker', 'exec', ...env, id, 'bun', '/opt/psi/lh.ts', `https://${name}.test/`, `/out/${file}`, form]);
        const r = await read(join(out, `${file}.json`));
        console.log(`${file}\tperf ${r.perf}\tFCP ${r.fcp}\tLCP ${r.lcp}\tTBT ${r.tbt}\tSI ${r.si}\tfp ${r.fp}\tload ${r.load}\t${r.tasks}`);
      }
    }
  await summarise(out);
} finally {
  stop();
}
