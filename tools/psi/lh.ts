import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';

const [url, out, form = 'mobile'] = process.argv.slice(2);
const root = '/pki/caddy/pki/authorities/local/root.crt';
// Chrome never caches a response whose certificate it had to ignore, so trust Caddy's root instead
if (await Bun.file(root).exists()) Bun.spawnSync(['sh', '-c', `mkdir -p ~/.pki/nssdb && (certutil -d sql:$HOME/.pki/nssdb -L -n caddy >/dev/null 2>&1 || certutil -d sql:$HOME/.pki/nssdb -A -t C,, -n caddy -i ${root})`]);
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--headless=new', '--no-sandbox', `--host-resolver-rules=MAP *.test ${process.env.HOSTS ?? '127.0.0.1'}`, ...(process.env.FLAGS?.split(' ').filter(Boolean) ?? [])],
});
try {
  const flags = {
    port: chrome.port,
    output: 'json' as const,
    logLevel: 'error' as const,
    onlyCategories: ['performance'],
    ...(process.env.CATS ? { additionalTraceCategories: process.env.CATS } : {}),
  };
  const result = await lighthouse(url, flags, form === 'desktop' ? desktop : undefined);
  await Bun.write(`${out}.json`, result!.report as string);
  if (process.env.TRACE) await Bun.write(`${out}.trace.json`, JSON.stringify(result!.artifacts.Trace));
} finally {
  chrome.kill();
}
