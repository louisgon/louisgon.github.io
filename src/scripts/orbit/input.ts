import { $ } from '../util';
import { A, D, egg, G, input, rs, restW, STICK, V, VP } from './core';
import { cancelInput, land, pause, restart, start } from './flight';
import { focusables, hideCard, reveal, setLast } from './hud';
import { choose } from './upgrades';

const NEUTRAL = 5;
export const STEER: Record<string, number[]> = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };

const rel = (cx: number, cy: number) => { const r = D.hero.getBoundingClientRect(); return [(cx - r.left) / V.W, (cy - r.top) / V.H]; };
const local = (cx: number, cy: number) => { const r = D.hero.getBoundingClientRect(); return [cx - r.left, cy - r.top]; };
export const grab = (id: number, cx: number, cy: number) => { const [x, y] = local(cx, cy); input.tid = id; input.stick = { ox: x, oy: y, x, y }; input.follow = false; };
const onShip = (cx: number, cy: number, pad = 1) => { const [x, y] = rel(cx, cy), sw = restW(), sh = sw * A.aspR; return Math.abs(x * V.W - rs.x) < sw * 0.5 * pad && Math.abs(y * V.H - rs.y) < sh * 0.6 * pad; };
const interactive = (el: EventTarget | null) => el instanceof Element && !!el.closest('a, button, nav, .panel');
const heroInView = () => { const r = D.hero.getBoundingClientRect(); return r.bottom > V.H * 0.5 && r.top < V.H * 0.5; };
const findTouch = (list: TouchList) => { for (const t of list) if (t.identifier === input.tid) return t; return null; };
const onControl = () => !!(document.activeElement && document.activeElement.closest('a, button, input, textarea, select, [contenteditable]'));
const hover = (on: boolean) => { if (egg.over === on) return; egg.over = on; D.hero.style.cursor = on ? 'pointer' : ''; };
const armed = () => D.opts.classList.contains('arm');
const pointer = (e: PointerEvent) => e.pointerType === 'mouse' || e.pointerType === 'pen';
const stylus = (t: Touch) => (t as Touch & { touchType?: string }).touchType === 'stylus';
const inHero = (t: EventTarget | null) => t instanceof Node && D.hero.contains(t);
const WHEEL = [1, 16, 0];

export function initInput() {
  const hero = D.hero;
  hero.addEventListener('touchstart', (e) => {
    const p = e.changedTouches[0];
    if (interactive(e.target) || stylus(p)) return;
    setLast('touch'); input.moveAcc = 0;
    if (e.touches.length > 1) { input.charge = null; return; }
    if (G.on) { if (input.tid === null) grab(p.identifier, p.clientX, p.clientY); return; }
    if (A.ready && !VP.p && onShip(p.clientX, p.clientY, 1.15)) input.charge = { kind: 'touch', t0: performance.now(), sx: p.clientX, sy: p.clientY, id: p.identifier, x: 0, y: 0 };
  }, { passive: true });
  hero.addEventListener('touchmove', (e) => {
    if (G.on) {
      const p = findTouch(e.changedTouches); if (!p) return;
      e.preventDefault();
      const [x, y] = local(p.clientX, p.clientY), s = input.stick;
      if (!s || G.card || VP.p < 1) { input.stick = { ox: x, oy: y, x, y }; return; }
      s.x = x; s.y = y;
      const dx = x - s.ox, dy = y - s.oy, d = Math.hypot(dx, dy);
      if (d > STICK.r) { s.ox = x - dx / d * STICK.r; s.oy = y - dy / d * STICK.r; }
      return;
    }
    const c = input.charge; if (!c || c.kind !== 'touch') return;
    const p = [...e.changedTouches].find((t) => t.identifier === c.id);
    if (e.touches.length > 1 || (p && Math.hypot(p.clientX - c.sx, p.clientY - c.sy) > 10)) input.charge = null;
  }, { passive: false });
  const touchEnd = (e: TouchEvent) => { if (input.charge && input.charge.kind === 'touch') input.charge = null; if (findTouch(e.changedTouches)) { input.tid = null; input.stick = null; } };
  hero.addEventListener('touchend', touchEnd); hero.addEventListener('touchcancel', touchEnd);

  hero.addEventListener('pointerdown', (e) => {
    if (!pointer(e) || e.button !== 0 || interactive(e.target)) return;
    setLast('mouse'); input.inside = true;
    const [x, y] = rel(e.clientX, e.clientY); input.mx = x; input.my = y;
    if (G.on) return;
    if (A.ready && !VP.p && onShip(e.clientX, e.clientY)) { input.charge = { kind: 'mouse', t0: performance.now(), sx: 0, sy: 0, id: 0, x, y }; e.preventDefault(); }
  });
  addEventListener('pointermove', (e) => {
    if (!pointer(e)) return;
    if (!V.vis && !G.on) { hover(false); return; }
    const [x, y] = rel(e.clientX, e.clientY), mv = Math.hypot((x - input.mx) * V.W, (y - input.my) * V.H);
    input.moveAcc += mv; input.mx = x; input.my = y; input.inside = inHero(e.target);
    if (input.charge && input.charge.kind === 'mouse') { input.charge.x = x; input.charge.y = y; }
    hover(!G.on && !VP.p && A.ready && onShip(e.clientX, e.clientY));
    if (!G.on || G.card) return;
    if (interactive(e.target) || !input.inside) { input.follow = false; return; }
    if (input.tid !== null || input.moveAcc <= (input.last === 'key' ? 5 : input.last === 'touch' ? 24 : 0)) return;
    if (input.mlock) { if (VP.p < 1 || Math.hypot((x - input.ax) * V.W, (y - input.ay) * V.H) < NEUTRAL) return; input.mlock = false; }
    setLast('mouse'); input.follow = true; if (input.guide < 0) input.guide = G.clock;
  }, { passive: true });
  addEventListener('pointerout', (e) => { if (pointer(e) && !e.relatedTarget) { input.inside = false; input.follow = false; } });
  addEventListener('pointerup', (e) => { if (pointer(e) && input.charge && input.charge.kind === 'mouse') input.charge = null; });
  hero.addEventListener('contextmenu', (e) => { if (G.on || input.charge) e.preventDefault(); });

  addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (G.on) {
      if (e.code === 'Escape') { land(); return; }
      if (e.key === 'Tab' && G.card) { const f = focusables(); if (!f.length) return; e.preventDefault(); const i = f.indexOf(document.activeElement as HTMLElement); const n = f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length]; n.focus({ preventScroll: true }); reveal(n); return; }
      if (G.card) { const m = e.code.match(/^(?:Digit|Numpad)([1-3])$/); if (m && (G.mode === 'level' || G.mode === 'cache')) { const b = D.opts.children[Number(m[1]) - 1]; if (b && !armed()) { e.preventDefault(); setLast('key'); choose(Number(m[1]) - 1); } } return; }
      if (STEER[e.code]) { e.preventDefault(); if (e.repeat && !input.keys.has(e.code)) return; input.keys.add(e.code); setLast('key'); input.moveAcc = 0; return; }
      if (e.code === 'KeyP') { pause(); return; }
      if (e.code === 'Space' && !onControl()) e.preventDefault();
      return;
    }
    if (e.code === 'Space' && !e.repeat && A.ready && !VP.p && heroInView() && !onControl()) { e.preventDefault(); input.charge = { kind: 'key', t0: performance.now(), sx: 0, sy: 0, id: 0, x: 0, y: 0 }; setLast('key'); }
  });
  addEventListener('keyup', (e) => { input.keys.delete(e.code); if (e.code === 'Space' && input.charge && input.charge.kind === 'key') input.charge = null; });
  addEventListener('blur', () => { cancelInput(); pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelInput(); pause(); } });

  $('land').addEventListener('click', (e) => { e.stopPropagation(); land(); });
  $('pz').addEventListener('click', (e) => { e.stopPropagation(); pause(); });
  D.fly.addEventListener('click', () => { if (!G.on && !VP.p && A.ready) start('key'); });
  D.fly.addEventListener('focus', () => (egg.focus = true));
  D.fly.addEventListener('blur', () => (egg.focus = false));
  D.cardMore.addEventListener('click', (e) => {
    e.stopPropagation();
    if (G.mode === 'pause') { hideCard(); return; }
    if (G.mode === 'over') restart();
  });
  $('cardBack').addEventListener('click', (e) => { e.stopPropagation(); land(); });
  D.opts.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('.opt'); if (!b || !G.card || armed()) return; e.stopPropagation(); choose(Number(b.dataset.i)); });
  addEventListener('wheel', (e) => {
    if (!G.on) return;
    const now = performance.now(); if (now - input.wheelT > 120) input.wheelAcc = 0;
    input.wheelT = now; input.wheelAcc += e.deltaY * (WHEEL[e.deltaMode] || innerHeight);
    if (Math.abs(input.wheelAcc) > 40) land();
  }, { passive: true });
  addEventListener('scroll', () => { if (G.on && scrollY > 30) land(); }, { passive: true });
}
