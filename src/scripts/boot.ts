const release = () => {
  document.getElementById('late')?.removeAttribute('media');
  document.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src!;
    img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
  });
};

let started = false;
const start = () => { if (started) return; started = true; release(); import('./main'); };
const landing = document.documentElement.classList.contains('landing');

if (landing && location.hash.length > 1) { release(); addEventListener('scroll', start, { once: true }); addEventListener('load', start, { once: true }); }
else if (landing || document.body.classList.contains('case-open') || document.visibilityState !== 'visible') start();
else if (PerformanceObserver.supportedEntryTypes?.includes('paint')) new PerformanceObserver((list, obs) => { if (!list.getEntriesByName('first-contentful-paint').length) return; obs.disconnect(); start(); }).observe({ type: 'paint', buffered: true });
else requestAnimationFrame(() => setTimeout(start));
