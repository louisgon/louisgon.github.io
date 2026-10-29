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


export function decode(el: HTMLElement, delay = 0) {
  if (reduce || done.has(el)) return; done.add(el);
  const start = () => {
    const lab = el.textContent!.replace(/\s+/g, ' ').trim(), hadLab = el.hasAttribute('aria-label'); if (!hadLab) el.setAttribute('aria-label', lab);
    const cs = getComputedStyle(el), font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, up = cs.textTransform === 'uppercase';
    const box = el.getBoundingClientRect(), sx = box.width ? el.offsetWidth / box.width || 1 : 1, cells: [HTMLSpanElement, string, string][] = [], swaps: [HTMLSpanElement, Text][] = [];
    const texts: Text[] = []; const walk = (n: Node) => n.childNodes.forEach((c) => (c.nodeType === 3 ? c.textContent!.trim() && texts.push(c as Text) : walk(c))); walk(el);
    const words: [HTMLSpanElement, string][] = [], ls = parseFloat(cs.letterSpacing) || 0;
    texts.forEach((node) => {
      const wrap = document.createElement('span'); wrap.style.display = 'contents';
      node.textContent!.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { wrap.append(w); return; } const s = document.createElement('span'); s.style.whiteSpace = 'nowrap'; s.textContent = w; wrap.append(s); words.push([s, w]); });
      swaps.push([wrap, node]);
    });
    swaps.forEach(([w, n]) => n.replaceWith(w));
    // a laid out word includes all its letter spacing in every engine, so cells split that measured width by glyph widths
    ctx.font = font;
    words.forEach(([s, w]) => {
      const total = s.getBoundingClientRect().width * sx, ws = [...w].map((ch) => ctx.measureText(up ? ch.toUpperCase() : ch).width + ls), sum = ws.reduce((x, y) => x + y, 0);
      s.textContent = '';
      [...w].forEach((ch, i) => { const c = document.createElement('span'), g = document.createElement('span'); c.style.cssText = `display:inline-block;width:${(ws[i] * total / sum).toFixed(3)}px;text-align:center`; g.style.display = 'inline-block'; g.textContent = ch; c.append(g); s.append(c); cells.push([g, ch, poolFor(font, up, ch)]); });
    });
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
