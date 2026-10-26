import { reduce } from './state';

export function initMeteors() {
  if (!reduce) { const mt = document.querySelector('#meteors i')!; const fire = () => { const x = Math.random() * innerWidth * 0.8 + innerWidth * 0.1, y = Math.random() * innerHeight * 0.5, ang = 20 + Math.random() * 25, d = 260 + Math.random() * 260, r = (ang * Math.PI) / 180;
    mt.animate([{ transform: `translate3d(${x}px, ${y}px, 0) rotate3d(0, 0, 1, ${ang}deg) scale3d(.3, 1, 1)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate3d(${x + Math.cos(r) * d}px, ${y + Math.sin(r) * d}px, 0) rotate3d(0, 0, 1, ${ang}deg) scale3d(1, 1, 1)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.3, .1, .3, 1)' });
    setTimeout(fire, 6000 + Math.random() * 9000); }; setTimeout(fire, 4000); }
}
