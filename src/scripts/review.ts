import '../styles/review.css';
import { $ } from './util';
import { lenis } from './scroll';

type Note = { v?: string; note?: string };

export function initReview() {
  const SECS = [['hero', 'Orbit hero'], ['intro', 'Pilot log intro'], ['stack', 'The whole stack'], ['work', 'Selected work'], ['clients', 'Client marquee'], ['pilot', 'The pilot'], ['contact', 'Contact']];
  const RVK = 'space-review'; let rs: Record<string, Note> = {}; try { rs = JSON.parse(localStorage.getItem(RVK) || '{}'); } catch {}
  const rsave = () => { try { localStorage.setItem(RVK, JSON.stringify(rs)); } catch {} };
  let rvCur = -1, rvHold = 0;
  function rvShow(i: number, typing?: boolean) { const moved = i !== rvCur; rvCur = i; const [id, n] = SECS[i], st = rs[id] || {}; $('rvName').textContent = n; $('rvNum').textContent = `${i + 1} of ${SECS.length}`; if (!typing) $<HTMLTextAreaElement>('rvNote').value = st.note || ''; if (moved && document.activeElement === $('rvNote')) $('rvNote').blur(); document.querySelectorAll<HTMLElement>('.rvw .rate button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === st.v))); $('rvCount').textContent = `${SECS.filter(([k]) => rs[k] && (rs[k].v || rs[k].note)).length} of ${SECS.length} reviewed`; }
  setInterval(() => { if (performance.now() < rvHold) return; let b = 0; SECS.forEach(([id], i) => { if ($(id).getBoundingClientRect().top <= innerHeight * 0.5) b = i; }); if (b !== rvCur) rvShow(b); }, 250);
  $('rvTab').addEventListener('click', () => $('rvw').classList.toggle('open'));
  document.querySelector('.rvw .rate')!.addEventListener('click', (e) => { const b = (e.target as Element).closest('button'); if (!b) return; const id = SECS[rvCur][0]; rs[id] = { ...(rs[id] || {}), v: rs[id]?.v === b.dataset.v ? undefined : b.dataset.v }; rsave(); rvShow(rvCur); });
  $('rvNote').addEventListener('input', (e) => { const id = SECS[rvCur][0]; rs[id] = { ...(rs[id] || {}), note: (e.target as HTMLTextAreaElement).value }; rsave(); rvShow(rvCur, true); });
  const rvGo = (i: number) => { rvHold = performance.now() + 2200; rvShow(i); const el = $(SECS[i][0]); lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView(); };
  $('rvPrev').addEventListener('click', () => rvGo(Math.max(0, rvCur - 1))); $('rvNext').addEventListener('click', () => rvGo(Math.min(SECS.length - 1, rvCur + 1)));
  $('rvCopy').addEventListener('click', async () => { const L: Record<string, string> = { keep: 'KEEP', tweak: 'TWEAK', rework: 'REWORK' }; const text = ['Space site review', '', ...SECS.map(([id, n], i) => `${i + 1}. ${n}  [${L[rs[id]?.v ?? ''] || 'no rating'}]\n${(rs[id]?.note || '').trim() || '(no notes)'}\n`)].join('\n'); try { await navigator.clipboard.writeText(text); $('rvCopy').textContent = 'Copied, paste to Claude'; } catch { prompt('Copy this and paste it to Claude', text); } });
  rvShow(0);
}
