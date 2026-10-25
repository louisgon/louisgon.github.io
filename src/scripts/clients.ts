import { reduce, ez } from './state';
import { $, clamp, visible } from './util';

let mq: HTMLElement, mqX = 0, mqHold = false, mqStop = false, mqK = 1;
const still = matchMedia('(max-width: 600px)');

export function initMarquee() {
  mq = $('marquee');
  $('clients').addEventListener('pointerenter', () => (mqHold = true)); $('clients').addEventListener('pointerleave', () => (mqHold = false)); $('clients').addEventListener('focusin', () => (mqHold = true)); $('clients').addEventListener('focusout', () => (mqHold = false));
  $('mqp').addEventListener('click', () => { mqStop = !mqStop; $('mqp').setAttribute('aria-pressed', String(mqStop)); $('mqp').textContent = mqStop ? 'Play' : 'Pause'; });
}

export function marqueeTick(dt: number, vel: number) { if (still.matches) { if (mq.style.transform) mq.style.transform = ''; return; } if (visible($('clients'))) { mqK = ez(mqK, reduce || mqStop || mqHold ? 0 : 1, 4, 4); mqX -= (36 + clamp(vel / 20) * 360) * dt * mqK; const half = mq.scrollWidth / 2; if (-mqX > half) mqX += half; mq.style.transform = `translate3d(${mqX}px, 0, 0)`; } }
