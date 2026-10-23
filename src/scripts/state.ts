const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
export let reduce = RMQ.matches;
RMQ.addEventListener('change', (e) => (reduce = e.matches));
export { RMQ };

export const TR = { busy: false, casing: false, dim: 0, black: 0, up: 0, down: 0, next: null as (() => void) | null, f: 1 };
export const pend = new Set<Element>();
export const HI = { t0: 0, space: 0, planet: 0, cue: 0, pt: 0, copy: 0, skip: false, ff: false, moved: false, done: false };

export const S = {
  DT: 1 / 60,
  zone: 'hero' as 'hero' | 'content',
  boost: 0,
  mx: 0.5,
  my: 0.5,
  smx: 0.5,
  smy: 0.5,
  navIntent: null as string | null,
  navIntentT: 0,
  navIntentY: 0,
};

export const lf = (k: number) => 1 - Math.pow(1 - k, S.DT * 60);
export const ez = (v: number, t: number, up: number, dn: number) => v + (t - v) * (1 - Math.exp(-S.DT * (t > v ? up : dn)));
