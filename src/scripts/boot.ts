history.scrollRestoration = 'manual';

let started = false;
const start = () => { if (started) return; started = true; import('./main'); };

if (document.body.classList.contains('case-open') || document.visibilityState !== 'visible') start();
else if (PerformanceObserver.supportedEntryTypes?.includes('paint')) new PerformanceObserver((list, obs) => { if (!list.getEntriesByName('first-contentful-paint').length) return; obs.disconnect(); start(); }).observe({ type: 'paint', buffered: true });
else requestAnimationFrame(() => setTimeout(start));
