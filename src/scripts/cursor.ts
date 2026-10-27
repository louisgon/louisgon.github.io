export const CUR = { px: -100, py: -100, seen: false };

export function initCursor() {
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; CUR.px = e.clientX; CUR.py = e.clientY; CUR.seen = true; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => (CUR.seen = false));
}
