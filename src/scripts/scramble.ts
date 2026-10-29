import { reduce } from './state';

const GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&+<>/', THIN = 'I1|!';
const done = new WeakSet<Element>(), fits = new Map<string, Map<string, string>>();
const ctx = document.createElement('canvas').getContext('2d')!;

function poolFor(font: string, up: boolean, ch: string) {
  let m = fits.get(font); if (!m) fits.set(font, (m = new Map()));
  const k = up ? ch.toUpperCase() : ch; let fit = m.get(k); if (fit) return fit;
  ctx.font = font; const w = ctx.measureText(k).width, gs = [...GLY + THIN].filter((g) => { const r = ctx.measureText(g).width / w; return r > 0.76 && r <= 1; });
  fit = gs.length ? gs.join('') : k;
  m.set(k, fit); return fit;
}

export const undecode = (el: Element) => done.delete(el);

export function decode(el: HTMLElement, delay = 0) {
  if (reduce || done.has(el)) return; done.add(el);
  const start = () => {
    const lab = el.textContent!.replace(/\s+/g, ' ').trim(), hadLab = el.hasAttribute('aria-label'); if (!hadLab) el.setAttribute('aria-label', lab);
    const cs = getComputedStyle(el), font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, up = cs.textTransform === 'uppercase';
    const box = el.getBoundingClientRect(), sx = box.width ? el.offsetWidth / box.width || 1 : 1, rg = document.createRange(), cells: [HTMLSpanElement, string, string][] = [], swaps: [HTMLSpanElement, Text][] = [];
    const texts: Text[] = []; const walk = (n: Node) => n.childNodes.forEach((c) => (c.nodeType === 3 ? c.textContent!.trim() && texts.push(c as Text) : walk(c))); walk(el);
    texts.forEach((node) => {
      const t = node.textContent!, ws: number[] = [];
      for (let i = 0; i < t.length; i++) { rg.setStart(node, i); rg.setEnd(node, i + 1); ws.push(rg.getBoundingClientRect().width * sx); }
      const wrap = document.createElement('span'); wrap.style.display = 'contents'; let word: HTMLSpanElement | null = null;
      for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        if (/\s/.test(ch)) { word = null; wrap.append(ch); continue; }
        if (!word) { word = document.createElement('span'); word.style.whiteSpace = 'nowrap'; wrap.append(word); }
        const c = document.createElement('span'), g = document.createElement('span'); c.style.cssText = `display:inline-block;width:${ws[i]}px;text-align:center`; g.style.display = 'inline-block'; g.textContent = ch; c.append(g); word.append(c); cells.push([g, ch, poolFor(font, up, ch)]);
      }
      swaps.push([wrap, node]);
    });
    swaps.forEach(([w, n]) => n.replaceWith(w));
    const total = cells.length, t0 = performance.now() + delay, dur = 520 + total * 14;
    (function tick(now: number) {
      const k = (now - t0) / dur;
      cells.forEach(([g, ch, pool], j) => {
        const real = k * 1.35 - (j / total) * 0.9 > 0.45, v = real ? ch : pool[(Math.random() * pool.length) | 0];
        if (g.textContent !== v) g.textContent = v;
      });
      if (k < 1) requestAnimationFrame(tick); else { swaps.forEach(([w, n]) => w.replaceWith(n)); if (!hadLab) el.removeAttribute('aria-label'); }
    })(performance.now());
  };
  document.fonts && document.fonts.status !== 'loaded' ? document.fonts.ready.then(start) : start();
}
