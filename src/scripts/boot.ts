const release = () => {
  document.getElementById('late')?.removeAttribute('media');
  document.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((el) => { el.srcset = el.dataset.srcset!; el.removeAttribute('data-srcset'); });
  document.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src!;
    img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
  });
  const art = document.querySelector<HTMLImageElement>('#hero .bg img');
  art?.decode().then(() => art.parentElement!.classList.add('in'), () => art.parentElement!.classList.add('in'));
};

let started = false;
const start = (late = false) => { if (started) return; started = true; release(); if (late && 'scheduler' in window) scheduler.postTask(() => import('./main'), { priority: 'background' }); else import('./main'); };
const landing = document.documentElement.classList.contains('landing');

if (landing && location.hash.length > 1) { release(); addEventListener('scroll', () => start(), { once: true }); addEventListener('load', () => start(), { once: true }); }
else if (landing || document.body.classList.contains('case-open') || document.visibilityState !== 'visible') start();
else if (PerformanceObserver.supportedEntryTypes?.includes('paint')) new PerformanceObserver((list, obs) => { if (!list.getEntriesByName('first-contentful-paint').length) return; obs.disconnect(); start(true); }).observe({ type: 'paint', buffered: true });
else requestAnimationFrame(() => setTimeout(() => start(true)));
