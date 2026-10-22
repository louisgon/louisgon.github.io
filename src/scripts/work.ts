import { MOONS } from '../lib/planets';
import { PROJECTS } from './data';
import { reduce, TR } from './state';
import { $, clamp, sstep, visible } from './util';
import { orbit } from './planets';

let traj: HTMLElement, trajNodes: HTMLElement[], planetEls: HTMLElement[];

export function initWork() {
  traj = document.createElement('div'); traj.className = 'traj'; traj.innerHTML = '<div class="fill"></div>'; $('projects').prepend(traj);
  const projEls = [...document.querySelectorAll<HTMLElement>('.proj')]; trajNodes = projEls.map(() => { const n = document.createElement('i'); n.className = 'node'; traj.append(n); return n; });
  function placeNodes() { projEls.forEach((p, i) => (trajNodes[i].style.top = `${p.offsetTop + p.offsetHeight / 2 - 4}px`)); }
  placeNodes(); addEventListener('resize', placeNodes); document.fonts && document.fonts.ready.then(placeNodes); setTimeout(placeNodes, 400);
  document.querySelectorAll<HTMLElement>('.proj .planet').forEach((pl, i) => { const src = PROJECTS[i].planet; const g = document.createElement('i'); g.className = 'glint'; g.style.webkitMaskImage = g.style.maskImage = `url(${src})`; g.style.animationDelay = `${-i * 1.3}s`; pl.append(g); });
  document.querySelectorAll<HTMLElement>('.proj .pic').forEach((pic) => {
    pic.addEventListener('pointermove', (e) => { if (reduce || TR.busy || e.pointerType !== 'mouse') return; const r = pic.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; pic.style.transform = `perspective(1100px) rotate3d(1, 0, 0, ${-y * 7}deg) rotate3d(0, 1, 0, ${x * 9}deg) translate3d(0, 0, 0)`; });
    pic.addEventListener('pointerleave', () => (pic.style.transform = ''));
  });
  planetEls = [...document.querySelectorAll<HTMLElement>('.proj .planet')];
}

export function planetDriftTick(now: number) {
  planetEls.forEach((el, i) => { const r = el.parentElement!.getBoundingClientRect(); if (r.top > innerHeight * 1.8 || r.bottom < -innerHeight * 0.8) return; const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight, k = 1 - sstep(0.45, 1.05, Math.abs(c)), s = (0.9 + k * 0.1) * (1 + Math.sin(now / 4000 + i) * 0.015);
    el.style.setProperty('--po', k.toFixed(3)); el.style.transform = `translate3d(0, calc(-50% + ${c * (innerWidth < 600 ? -50 : -160)}px), 0) rotate3d(0, 0, 1, ${c * (i % 2 ? 6 : -6)}deg) scale3d(${s}, ${s}, 1)`; });
}

export function trajTick() { if (visible($('work'))) { const r = $('projects').getBoundingClientRect(), f = clamp((innerHeight * 0.55 - r.top) / r.height); (traj.firstElementChild as HTMLElement).style.transform = `scale3d(1, ${f}, 1)`; const fy = f * r.height; trajNodes.forEach((n) => n.classList.toggle('on', parseFloat(n.style.top) < fy)); } }

export function workMoonsTick(now: number) { planetEls.forEach((pl) => { if (MOONS[+pl.parentElement!.dataset.i!].length && visible(pl.parentElement!)) orbit(pl, +pl.parentElement!.dataset.i!, now); }); }
