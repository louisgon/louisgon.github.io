import { MOONS, SQUASH, TILT } from '../lib/planets';
import { reduce } from './state';

type Orbiting = HTMLElement & { moons?: HTMLElement[] };

export function orbit(el: Orbiting, i: number, now: number) { el.moons ||= [...el.querySelectorAll<HTMLElement>('.moon')]; const w = el.offsetWidth, tr = (TILT[i] * Math.PI) / 180, ct = Math.cos(tr), st = Math.sin(tr), t = reduce ? 0 : now / 1000;
  el.moons.forEach((m, j) => { const [, rr, per] = MOONS[i][j], a = t * (6.283 / per) + j * 1.9 + i, ex = Math.cos(a) * rr * w / 2, ey = Math.sin(a) * rr * w / 2 * SQUASH; m.style.transform = `translate3d(calc(-50% + ${(ex * ct - ey * st).toFixed(1)}px), calc(-50% + ${(ex * st + ey * ct).toFixed(1)}px), 0)`; m.style.zIndex = Math.sin(a) < 0 ? '0' : '2'; }); }
