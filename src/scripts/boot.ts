const art = document.querySelector<HTMLImageElement>('#hero .bg img')!;
const painted = new Promise((r) => { try { new PerformanceObserver((list, obs) => { if (list.getEntriesByName('first-contentful-paint').length) { obs.disconnect(); r(0); } }).observe({ type: 'paint', buffered: true }); } catch { r(0); } setTimeout(r, 3000); });
// a painting decoded before the first frame lands in its raster, which costs seconds without a GPU
const shown = Promise.all([art.decode().catch(() => {}), painted]).then(() => { const bg = art.parentElement!.classList; bg.toggle('q', performance.now() < 1500); bg.add('in'); });
const images = () => document.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
  if (img.dataset.srcset) img.srcset = img.dataset.srcset;
  img.src = img.dataset.src!;
  img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
});
const release = (deep = true) => {
  document.getElementById('late')?.removeAttribute('media');
  if (deep) images(); else shown.then(images);
};

let started = false;
const main = () => import('./main');
const start = (late = false) => {
  if (started) return; started = true; release(!late);
  if (!late) { main(); return; }
  Promise.race([shown, new Promise((r) => setTimeout(r, 4000))]).then(() => ('scheduler' in window ? scheduler.postTask(main, { priority: 'background' }) : main()));
};
const landing = document.documentElement.classList.contains('landing');

if (landing && location.hash.length > 1) { release(); addEventListener('scroll', () => start(), { once: true }); addEventListener('load', () => start(), { once: true }); }
else if (landing || document.body.classList.contains('case-open') || document.visibilityState !== 'visible') start();
else if (PerformanceObserver.supportedEntryTypes?.includes('paint')) new PerformanceObserver((list, obs) => { if (!list.getEntriesByName('first-contentful-paint').length) return; obs.disconnect(); start(true); }).observe({ type: 'paint', buffered: true });
else requestAnimationFrame(() => setTimeout(() => start(true)));

const beacon = () => {
  const s = document.createElement('script');
  s.defer = true; s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.dataset.cfBeacon = JSON.stringify({ token: '62a052be431a4b81bef6f0ab7f694012', spa: true });
  document.head.append(s);
};
if (import.meta.env.PROD && import.meta.env.MODE !== 'test' && !__REVIEW__) {
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(beacon, { timeout: 4000 }) : setTimeout(beacon, 2000));
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r(0) : addEventListener('load', r, { once: true })));
  Promise.all([loaded, painted]).then(later);
}
