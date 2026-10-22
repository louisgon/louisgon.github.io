import { reduce } from './state';

const GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&+<>/';
const done = new WeakSet<Element>();

export const undecode = (el: Element) => done.delete(el);

export function decode(el: HTMLElement, delay = 0) {
  if (reduce || done.has(el)) return; done.add(el);
  const start = () => {
    const lab = el.textContent!.replace(/\s+/g, ' ').trim(), hadLab = el.hasAttribute('aria-label'); if (!hadLab) el.setAttribute('aria-label', lab);
    const box = el.getBoundingClientRect(), sx = box.width ? el.offsetWidth / box.width || 1 : 1, rg = document.createRange(), cells: [HTMLSpanElement, string][] = [], swaps: [HTMLSpanElement, Text][] = [];
    const texts: Text[] = []; const walk = (n: Node) => n.childNodes.forEach((c) => (c.nodeType === 3 ? c.textContent!.trim() && texts.push(c as Text) : walk(c))); walk(el);
    texts.forEach((node) => {
      const t = node.textContent!, ws: number[] = [];
      for (let i = 0; i < t.length; i++) { rg.setStart(node, i); rg.setEnd(node, i + 1); ws.push(rg.getBoundingClientRect().width * sx); }
      const wrap = document.createElement('span'); wrap.style.display = 'contents'; let word: HTMLSpanElement | null = null;
      for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        if (/\s/.test(ch)) { word = null; wrap.append(ch); continue; }
        if (!word) { word = document.createElement('span'); word.style.whiteSpace = 'nowrap'; wrap.append(word); }
        const c = document.createElement('span'); c.style.cssText = `display:inline-block;width:${ws[i]}px;text-align:center`; c.textContent = ch; word.append(c); cells.push([c, ch]);
      }
      swaps.push([wrap, node]);
    });
    swaps.forEach(([w, n]) => n.replaceWith(w));
    const total = cells.length, t0 = performance.now() + delay, dur = 520 + total * 14;
    (function tick(now: number) {
      const k = (now - t0) / dur;
      cells.forEach(([c, ch], j) => { const v = k * 1.35 - (j / total) * 0.9 > 0.45 ? ch : GLY[(Math.random() * GLY.length) | 0]; if (c.textContent !== v) c.textContent = v; });
      if (k < 1) requestAnimationFrame(tick); else { swaps.forEach(([w, n]) => w.replaceWith(n)); if (!hadLab) el.removeAttribute('aria-label'); }
    })(performance.now());
  };
  document.fonts && document.fonts.status !== 'loaded' ? document.fonts.ready.then(start) : start();
}
