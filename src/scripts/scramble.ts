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

const textsIn = (root: Node) => { const out: Text[] = []; const walk = (n: Node) => n.childNodes.forEach((c) => (c.nodeType === 3 ? c.textContent!.trim() && out.push(c as Text) : walk(c))); walk(root); return out; };

export const undecode = (el: Element) => done.delete(el);

export function decode(el: HTMLElement, delay = 0) {
  if (reduce || done.has(el)) return; done.add(el);
  const start = () => {
    const lab = el.textContent!.replace(/\s+/g, ' ').trim(), hadLab = el.hasAttribute('aria-label'); if (!hadLab) el.setAttribute('aria-label', lab);
    const cs = getComputedStyle(el), font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, up = cs.textTransform === 'uppercase', ls = parseFloat(cs.letterSpacing) || 0;
    const box = el.getBoundingClientRect(), sx = box.width ? el.offsetWidth / box.width || 1 : 1, cells: [HTMLSpanElement, string, string][] = [], swaps: [ChildNode, Node][] = [];
    // text with neighbours scrambles on a copy laid over the untouched original, so nothing beside it can move; masked heading lines keep their reveal by scrambling in place
    const float = !el.querySelector('.ln'), pos = el.style.position;
    let stage: HTMLElement = el;
    if (float) {
      stage = document.createElement('span'); stage.setAttribute('aria-hidden', 'true'); stage.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;padding:inherit;box-sizing:border-box;pointer-events:none';
      el.childNodes.forEach((n) => stage.append(n.cloneNode(true)));
      textsIn(el).forEach((n) => { const h = document.createElement('span'); h.style.cssText = 'color:transparent;-webkit-text-fill-color:transparent;text-shadow:none'; n.replaceWith(h); h.append(n); swaps.push([h, n]); });
      if (cs.position === 'static') el.style.position = 'relative';
      el.append(stage);
    }
    const words: [HTMLSpanElement, string][] = [];
    textsIn(stage).forEach((node) => {
      const wrap = document.createElement('span'); wrap.style.display = 'contents';
      node.textContent!.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { wrap.append(w); return; } const s = document.createElement('span'); s.style.whiteSpace = 'nowrap'; s.textContent = w; wrap.append(s); words.push([s, w]); });
      node.replaceWith(wrap); if (!float) swaps.push([wrap, node]);
    });
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
      if (k < 1) { requestAnimationFrame(tick); return; }
      if (float) { stage.remove(); el.style.position = pos; }
      swaps.forEach(([w, n]) => w.replaceWith(n));
      if (!hadLab) el.removeAttribute('aria-label');
    })(performance.now());
  };
  document.fonts && document.fonts.status !== 'loaded' ? document.fonts.ready.then(start) : start();
}
