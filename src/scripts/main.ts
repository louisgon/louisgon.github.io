import { initReview } from '#review';
import { reduce, S, TR, lf } from './state';
import { $, clamp, lerp } from './util';
import { initAnchors, initLanding, initScroll, initWheelHush, lenis } from './scroll';
import { initMenu } from './menu';
import { heroEnd, initOrbit, orbitTick } from './orbit';
import { initMeteors } from './meteors';
import { initStats, initWords, introEntranceTick, introWordsTick, observeStats } from './intro';
import { holoTick, initRoles, rolesTick, telemetryTick } from './about';
import { initOsc, oscTick } from './contact';
import { busTick, initBus, initCards, stackTick } from './stack';
import { initMarquee, marqueeTick } from './clients';
import { initNav, navSolidTick, navTick } from './nav';
import { initDividers, initReveal } from './reveal';
import { cursorTick, initCursor, initCursorQuery, initMagnetic } from './cursor';
import { caseMoonsTick, initCases } from './cases';
import { initWork, planetDriftTick, trajTick, workMoonsTick } from './work';

const starfield = import('./stars');
initScroll();
initWheelHush();
initMenu();
initAnchors();
addEventListener('pointermove', (e) => { S.mx = e.clientX / innerWidth; S.my = e.clientY / innerHeight; });
initOrbit();

let stars: typeof import('./stars') | null = null, framed = false, last = 0, heroP = 0;
const lit = starfield.then(async (m) => { await m.initStars(); if (framed) m.appear(performance.now()); stars = m; addEventListener('resize', m.resize); });

async function init() {
  if (document.documentElement.classList.contains('landing') || document.body.classList.contains('case-open')) await lit.catch(() => {});
  await document.fonts.ready;
  initWords();
  initRoles();
  initOsc();
  initMeteors();
  initStats();
  initCards();
  initMarquee();
  initNav();
  initDividers();
  initMagnetic();
  initReveal();
  initCursorQuery();
  initLanding();
  initCursor();
  initCases();
  initBus();
  initWork();
  // lazy in the markup only to keep them off the first paint
  document.querySelectorAll('.proj .planet img, #pilotImg').forEach((img) => img.removeAttribute('loading'));
  last = performance.now();
  observeStats();
  initReview();
  requestAnimationFrame(frame);
}

function frame(now: number) {
  requestAnimationFrame(frame); framed = true;
  if (lenis) lenis.raf(now);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  S.DT = dt; S.smx = lerp(S.smx, S.mx, lf(0.05)); S.smy = lerp(S.smy, S.my, lf(0.05));
  const hpNow = clamp(scrollY / heroEnd()); if (!TR.dim) heroP = hpNow;
  const hp = TR.dim ? heroP : hpNow, vel = lenis ? Math.abs(lenis.velocity) : 0;
  if (!TR.busy) S.zone = scrollY < heroEnd() - 1 ? 'hero' : 'content';
  if (stars) stars.speedTick(hp, vel, now);
  navSolidTick();
  if (stars) stars.fovTick();
  introEntranceTick(now);
  cursorTick(dt);
  planetDriftTick(now);
  orbitTick(now, hp);
  if (stars) stars.starsTick(dt, now);
  introWordsTick(now);
  stackTick(now);
  trajTick();
  oscTick(now);
  busTick(reduce ? 0 : now);
  workMoonsTick(now);
  caseMoonsTick(now);
  rolesTick();
  telemetryTick(now);
  marqueeTick(dt, vel);
  navTick(now);
  holoTick();
}

init();
Object.assign(window, { __y: (id: string, k: number) => { const el = $(id), y = el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * k; lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); } });
