import { devices, type Page } from 'playwright';
import { box, hold, lg, page, st, topDown, touch, type Ctx, type St } from './lib';

const speed = async (p: Page, x: number, y: number) => { await p.mouse.move(x, y, { steps: 3 }); await p.waitForTimeout(600); const s = await st(p); return Math.round(Math.hypot(s.vx, s.vy)); };
const ring = (p: Page, x: number, y: number) => p.evaluate(([x, y]) => { const c = document.getElementById('orbit') as HTMLCanvasElement, k = c.width / innerWidth, g = c.getContext('2d')!; let m = 0; for (let a = 0; a < 8; a++) { const d = g.getImageData(Math.round((x + Math.cos(a * Math.PI / 4) * 6.5) * k), Math.round((y + Math.sin(a * Math.PI / 4) * 6.5) * k), 1, 1).data; m = Math.max(m, d[0] * 0.3 + d[1] * 0.59 + d[2] * 0.11); } return Math.round(m); }, [x, y] as const);

export async function controls(c: Ctx) {
  {
    const { p, context, errors } = await page(c, { viewport: { width: 1440, height: 900 } });
    await p.waitForTimeout(800); await hold(p); await topDown(p); await lg(p, 'god(true); window.__lg.freeze(false)');
    const s0 = await st(p); await p.mouse.move(s0.sx + 30, s0.sy + 30, { steps: 4 }); await p.waitForTimeout(200);
    const still = await speed(p, s0.sx + 6, s0.sy), part = await speed(p, s0.sx + 60, s0.sy), full = await speed(p, s0.sx + 230, s0.sy), edge = await speed(p, s0.sx + 115, s0.sy);
    c.ok('the mouse has a dead zone of about 10px around LG-01', still < 20, still);
    c.ok('throttle rises with pointer distance and reaches full speed by 110px', part > 150 && part < 450 && full > 600 && edge > full * 0.95, { at60: part, at115: edge, at230: full });
    await lg(p, 'clear()'); await p.waitForTimeout(60); const s1 = await st(p), mark = await ring(p, s0.sx + 115, s0.sy), off = await ring(p, s0.sx + 160, s0.sy + 120);
    c.ok('a small marker shows the pointer while flying by mouse', mark > off + 40, { marker: mark, sky: off });
    const [lx, ly] = await box(p, 'land'); await p.mouse.move(lx, ly, { steps: 6 }); await p.waitForTimeout(500);
    const onLand = await st(p);
    c.ok('steering lets go when the pointer reaches a control', !onLand.follow && Math.hypot(onLand.vx, onLand.vy) < 60, { follow: onLand.follow, v: Math.hypot(onLand.vx, onLand.vy) });
    await p.mouse.move(s0.sx + 200, s0.sy, { steps: 4 }); await p.waitForTimeout(300);
    await p.evaluate(() => document.body.dispatchEvent(new PointerEvent('pointerout', { pointerType: 'mouse', bubbles: true, relatedTarget: null })));
    await p.waitForTimeout(500); const out = await st(p);
    c.ok('steering lets go when the pointer leaves the window', !out.follow && Math.hypot(out.vx, out.vy) < 60, { follow: out.follow });
    await p.evaluate(() => dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1 })));
    await p.waitForTimeout(400);
    c.ok('a three line wheel step counts as 48px and lands', !(await st(p)).on);
    await p.waitForTimeout(1500);
    const r = await st(p), pen = (type: string) => p.evaluate(([type, x, y]) => document.getElementById('orbit')!.dispatchEvent(new PointerEvent(type as string, { pointerType: 'pen', button: 0, buttons: type === 'pointerdown' ? 1 : 0, clientX: x as number, clientY: y as number, bubbles: true, cancelable: true })), [type, r.rx, r.ry] as const);
    await pen('pointermove'); await pen('pointerdown'); await p.waitForTimeout(350); await pen('pointerup');
    c.ok('a pen hold on the ship starts through Pointer Events', (await st(p)).on);
    c.ok('mouse controls console clean', !errors.length, errors);
    await context.close();
  }
  {
    const { p, context, errors } = await page(c, { ...devices['Pixel 7'] });
    await p.waitForTimeout(1200);
    const T = await touch(context, p), r = await st(p);
    await T('touchStart', r.rx, r.ry); await p.waitForTimeout(450); await T('touchEnd'); await topDown(p);
    await T('touchStart', 200, 600); await T('touchMove', 290, 600); await p.waitForTimeout(300);
    await p.mouse.move(220, 400); await p.mouse.move(232, 410); await p.waitForTimeout(200);
    const s: St = await st(p); await T('touchEnd');
    c.ok('touch keeps the controls while a thumb is down even if the mouse twitches', s.last === 'touch' && !s.follow && s.vx > 100, { last: s.last, follow: s.follow, vx: s.vx });
    c.ok('touch controls console clean', !errors.length, errors);
    await context.close();
  }
}
