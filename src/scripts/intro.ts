import { TR } from './state';
import { $, clamp, out, sstep, visible } from './util';
import { revealAt } from './travel';

let words: HTMLElement[][] = [], floors: number[][] = [], wordGeo: { p: HTMLElement; g: number[][] }[] = [], statEls: HTMLElement[] = [], statsDone = false, statsSeen = false;
let INTRO: { ey: HTMLElement; st: HTMLElement };

function measureWords() { wordGeo = words.map((ws) => { const p = ws[0].closest<HTMLElement>('[data-words]')!; return { p, g: ws.map((w) => [w.offsetTop - p.offsetTop + w.offsetHeight / 2, (w.offsetLeft - p.offsetLeft) / Math.max(1, p.offsetWidth)]) }; }); }

export function initWords() {
  words = [...document.querySelectorAll('[data-words]')].map((p) => { const walk = (n: Node) => [...n.childNodes].forEach((c) => { if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent!.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.append(w); else { const s = document.createElement('span'); s.className = 'w mv'; s.textContent = w; f.append(s); } }); (c as Text).replaceWith(f); } else walk(c); }); walk(p); return [...p.querySelectorAll<HTMLElement>('.w')]; });
  // the dimmest a word gets still reads at three to one on the page, and holo words need a higher floor
  floors = words.map((ws) => ws.map((w) => (w.closest('em') ? 0.45 : 0.38)));
  addEventListener('resize', () => (wordGeo = [])); document.fonts && document.fonts.ready.then(() => (wordGeo = []));
}

export function initStats() {
  statEls = [...$('stats').querySelectorAll<HTMLElement>('[data-n]')];
  INTRO = { ey: $('intro').querySelector<HTMLElement>('.eyebrow')!, st: $('stats') };
}

export const observeStats = () => new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) statsSeen = true; }), { threshold: 0.6 }).observe($('stats'));

export function introEntranceTick(now: number) {
  if (visible($('intro'))) { const sn = now - revealAt, en = clamp((innerHeight - $('intro').getBoundingClientRect().top) / innerHeight), a = Math.min(out(clamp(sn / 700)), sstep(0.25, 0.75, en)), c = Math.min(out(clamp((sn - 650) / 800)), sstep(0.55, 1, en));
    INTRO.ey.style.opacity = String(a); INTRO.ey.style.transform = `translate3d(0, ${(1 - a) * 14}px, 0)`; INTRO.st.style.opacity = String(c); INTRO.st.style.transform = `translate3d(0, ${(1 - c) * 20}px, 0)`; }
}

export function introWordsTick(now: number) {
  const ipT = out(clamp((now - revealAt - 150) / 1500)); let ipW = 0;
  if (!wordGeo.length) measureWords();
  wordGeo.forEach(({ p, g }, j) => { const top = p.getBoundingClientRect().top; words[j].forEach((w, i) => { const k = Math.min(out(clamp((innerHeight * 0.92 - top - g[i][0] * 0.6) / (innerHeight * 0.28) - g[i][1] * 0.5)), ipT); if (i === g.length - 1) ipW = Math.max(ipW, k); const lo = floors[j][i]; w.style.opacity = (lo + k * (1 - lo)).toFixed(3); w.style.transform = `translate3d(0, ${((1 - k) * 28).toFixed(2)}px, 0)`; }); });
  if (!statsDone && !TR.busy && now - revealAt > 700 && (ipW > 0.75 || statsSeen)) { statsDone = true; const t0 = performance.now(); (function tick(n: number) { const k = out(clamp((n - t0) / 1400)); statEls.forEach((b) => (b.textContent = String(Math.round(Number(b.dataset.n) * k)))); if (k < 1) requestAnimationFrame(tick); })(t0); }
}
