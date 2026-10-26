const art = document.querySelector<HTMLImageElement>('#hero .bg img')!;
const shown = art.decode().catch(() => {}).then(() => art.parentElement!.classList.add('in'));
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
  document.readyState === 'complete' ? later() : addEventListener('load', later, { once: true });
}
