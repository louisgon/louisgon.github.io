import { $ } from '../util';
import { jumpTo } from '../scroll';
import { A, D, egg, G, input, ship, V } from './core';
import { cancelInput, choose, gxc, gyc, land, pause, start } from './flight';
import { hideCard, setLast } from './hud';
import type { OptKind } from './upgrades';

export const STEER: Record<string, number[]> = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };

const rel = (cx: number, cy: number) => { const r = D.hero.getBoundingClientRect(); return [(cx - r.left) / V.W, (cy - r.top) / V.H]; };
const onShip = (cx: number, cy: number, pad = 1) => { const [x, y] = rel(cx, cy), sw = ship.base * ship.sc, sh = sw * (A.ship ? A.ship.height / A.ship.width : 0.4); return Math.abs(x * V.W - ship.x) < sw * 0.5 * pad && Math.abs(y * V.H - ship.y) < sh * 0.6 * pad; };
const interactive = (el: EventTarget | null) => el instanceof Element && !!el.closest('a, button, nav, .panel');
const heroInView = () => { const r = D.hero.getBoundingClientRect(); return r.bottom > V.H * 0.5 && r.top < V.H * 0.5; };
const findTouch = (list: TouchList) => { for (const t of list) if (t.identifier === input.tid) return t; return null; };
const onControl = () => !!(document.activeElement && document.activeElement.closest('a, button, input, textarea, select, [contenteditable]'));
const hover = (on: boolean) => { if (egg.over === on) return; egg.over = on; D.hero.style.cursor = on ? 'pointer' : ''; };

export function initInput() {
  const hero = D.hero;
  hero.addEventListener('touchstart', (e) => {
    setLast('touch');
    if (interactive(e.target)) return;
    if (e.touches.length > 1) { input.charge = null; return; }
    const p = e.changedTouches[0];
    if (G.on) { if (input.tid === null) { input.tid = p.identifier; input.lx = p.clientX; input.ly = p.clientY; } return; }
    if (A.ready && onShip(p.clientX, p.clientY, 1.15)) input.charge = { kind: 'touch', t0: performance.now(), sx: p.clientX, sy: p.clientY, id: p.identifier, x: 0, y: 0 };
  }, { passive: true });
  hero.addEventListener('touchmove', (e) => {
    if (G.on) {
      const p = findTouch(e.changedTouches); if (!p) return;
      e.preventDefault();
      if (G.card) return;
      input.gx = gxc(input.gx + (p.clientX - input.lx) * 1.35 / V.W); input.gy = gyc(input.gy + (p.clientY - input.ly) * 1.35 / V.H);
      input.lx = p.clientX; input.ly = p.clientY; return;
    }
    const c = input.charge; if (!c || c.kind !== 'touch') return;
    const p = [...e.changedTouches].find((t) => t.identifier === c.id);
    if (e.touches.length > 1 || (p && Math.hypot(p.clientX - c.sx, p.clientY - c.sy) > 10)) input.charge = null;
  }, { passive: false });
  const touchEnd = (e: TouchEvent) => { if (input.charge && input.charge.kind === 'touch') input.charge = null; if (findTouch(e.changedTouches)) input.tid = null; };
  hero.addEventListener('touchend', touchEnd); hero.addEventListener('touchcancel', touchEnd);

  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || interactive(e.target)) return;
    setLast('mouse');
    const [x, y] = rel(e.clientX, e.clientY); input.mx = x; input.my = y;
    if (G.on) return;
    if (A.ready && onShip(e.clientX, e.clientY)) { input.charge = { kind: 'mouse', t0: performance.now(), sx: 0, sy: 0, id: 0, x, y }; e.preventDefault(); }
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!V.vis && !G.on) { hover(false); return; }
    const [x, y] = rel(e.clientX, e.clientY);
    input.moveAcc += Math.hypot((x - input.mx) * V.W, (y - input.my) * V.H); input.mx = x; input.my = y;
    if (input.charge && input.charge.kind === 'mouse') { input.charge.x = x; input.charge.y = y; }
    hover(!G.on && A.ready && onShip(e.clientX, e.clientY));
    if (G.on && !G.card && (input.last !== 'key' || input.moveAcc > 5)) { setLast('mouse'); input.gx = gxc(x); input.gy = gyc(y); }
  }, { passive: true });
  addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse' && input.charge && input.charge.kind === 'mouse') input.charge = null; });
  hero.addEventListener('contextmenu', (e) => { if (G.on || input.charge) e.preventDefault(); });

  addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (G.on) {
      if (e.code === 'Escape') { land(); return; }
      if (G.card) { const m = e.code.match(/^(?:Digit|Numpad)([1-3])$/); if (m) { const b = $('opts').children[Number(m[1]) - 1] as HTMLElement | undefined; if (b && !$('opts').hidden) { e.preventDefault(); setLast('key'); b.click(); } } return; }
      if (STEER[e.code]) { input.keys.add(e.code); setLast('key'); input.moveAcc = 0; e.preventDefault(); return; }
      if (e.code === 'KeyP') { pause(); return; }
      if (e.code === 'Space' && !onControl()) e.preventDefault();
      return;
    }
    if (e.code === 'Space' && !e.repeat && A.ready && heroInView() && !onControl()) { e.preventDefault(); input.charge = { kind: 'key', t0: performance.now(), sx: 0, sy: 0, id: 0, x: 0, y: 0 }; setLast('key'); }
  });
  addEventListener('keyup', (e) => { input.keys.delete(e.code); if (e.code === 'Space' && input.charge && input.charge.kind === 'key') input.charge = null; });
  addEventListener('blur', () => { cancelInput(); pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelInput(); pause(); } });

  $('land').addEventListener('click', (e) => { e.stopPropagation(); land(); });
  $('cardMore').addEventListener('click', (e) => {
    e.stopPropagation();
    if (G.mode === 'pause') { hideCard(); return; }
    if (G.mode === 'over') { const sx = ship.x, sy = ship.y; G.on = false; start(input.last); ship.x = sx; ship.y = sy; }
  });
  $('opts').addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('.opt'); if (!b || !G.card) return; e.stopPropagation(); choose(b.dataset.id!, b.dataset.kind as OptKind); });
  $('heat').addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('button'); if (!b) return; e.stopPropagation(); G.heat = Number(b.dataset.h); $('heat').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
  $('cardBack').addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); land(true); jumpTo($('work')); }, { capture: true });
  addEventListener('wheel', (e) => {
    if (!G.on) return;
    const now = performance.now(); if (now - input.wheelT > 120) input.wheelAcc = 0;
    input.wheelT = now; input.wheelAcc += e.deltaY;
    if (Math.abs(input.wheelAcc) > 40) land();
  }, { passive: true });
  addEventListener('scroll', () => { if (G.on && scrollY > 30) land(); }, { passive: true });
}
