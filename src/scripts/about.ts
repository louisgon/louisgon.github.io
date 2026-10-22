import { reduce, lf } from './state';
import { $, clamp, lerp, out, visible } from './util';
import { CUR } from './cursor';

const DOT = 27.5;
let roleEls: HTMLElement[] = [], span = [0, 0], sigT = 0, holoK = 0;

function fitRoles() { const ro = $('roles'), tp = roleEls[0].offsetTop + DOT, bt = ro.offsetHeight - roleEls[roleEls.length - 1].offsetTop - DOT; ro.style.setProperty('--t', `${tp}px`); ro.style.setProperty('--b', `${bt}px`); span = [tp, ro.offsetHeight - tp - bt]; }

export function initRoles() {
  roleEls = [...document.querySelectorAll<HTMLElement>('#roles li')];
  fitRoles(); addEventListener('resize', fitRoles); document.fonts && document.fonts.ready.then(fitRoles);
}

export function rolesTick() {
  if (visible($('roles'))) { const ro = $('roles'), [tp, sp] = span, r = ro.getBoundingClientRect(), pr = reduce ? 1 : clamp((innerHeight * 0.78 - r.top - tp) / Math.max(1, sp)); ro.style.setProperty('--rp', pr.toFixed(4));
    roleEls.forEach((li) => { const at = (li.offsetTop + DOT - tp) / Math.max(1, sp), k = reduce ? 1 : out(clamp((pr - at + 0.14) / 0.18)); li.style.opacity = (0.42 + k * 0.58).toFixed(3); li.style.transform = `translate3d(${((1 - k) * -18).toFixed(2)}px, 0, 0)`; li.classList.toggle('on', pr >= at - 0.001); }); }
}

export function telemetryTick(now: number) { if (visible($('holo')) && now - sigT > 2600) { sigT = now; $('sigV').textContent = String(97 + Math.round(Math.random())); $('sigL').textContent = (0.41 + Math.random() * 0.02).toFixed(2); } }

export function holoTick() { if (visible($('holo'))) { const h = $('holo'), r = h.getBoundingClientRect(), on = !reduce && CUR.seen && CUR.px > r.left && CUR.px < r.right && CUR.py > r.top && CUR.py < r.bottom; holoK = lerp(holoK, on ? 1 : 0, lf(0.1)); if (holoK > 0.002) { const x = (CUR.px - r.left) / r.width - 0.5, y = (CUR.py - r.top) / r.height - 0.5; h.style.transform = `perspective(1200px) rotate3d(0, 1, 0, ${x * 7 * holoK}deg) rotate3d(1, 0, 0, ${-y * 6 * holoK}deg)`; } else if (h.style.transform) h.style.transform = ''; } }
