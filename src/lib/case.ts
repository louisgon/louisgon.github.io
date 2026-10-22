import { ic } from './icons';
import { moonsHTML } from './planets';
import { nn } from './sections';
import type { Project } from './site';

const STORY = (s: NonNullable<Project['story']>) => [['The brief', s.brief], ['What I did', s.did], ['The result', s.result]];

export function caseHTML(projects: Project[], i: number) {
  const p = projects[i], L = projects.length, pi = (i + L - 1) % L, ni = (i + 1) % L;
  return `<div class="chd" data-stage><div class="top st" style="--i:0"><button type="button" class="back" data-close>${ic('arrow-left')}Back to the fleet</button><span class="mono k">Destination ${nn(i + 1)} / ${nn(L)} <span class="kh" aria-hidden="true">· Arrow keys to travel</span></span></div>
    <div class="ttl"><div><div class="eyebrow mono k st" style="--i:1">${p.team}</div><h2 class="disp st" style="--i:2">${p.title}</h2></div><span class="vs st" style="--i:3"><a class="btn ghost" href="${p.url}" target="_blank" rel="noopener">Visit site<span class="sr"> (opens in a new tab)</span></a></span></div><p class="lead st" style="--i:4">${p.fact}</p></div>
    <div class="shotw"><div class="hero-shot cr"><img src="${p.shot}" alt="${p.title} website"><div class="hud"></div></div><div class="splanet" aria-hidden="true"><img src="${p.planet}" alt="">${moonsHTML(i)}</div></div>
    ${p.story ? `<div class="story">${STORY(p.story).map(([h, t]) => `<div class="cr"><h4>${h}</h4><p>${t}</p></div>`).join('')}</div>` : ''}
    <div class="cols"><div class="cr"><h4>Systems</h4><div class="stack">${p.stack.map((x) => `<span>${x}</span>`).join('')}</div></div></div>
    <div class="nav2 cr"><button type="button" data-go="${pi}" aria-label="Previous project, ${projects[pi].title}"><b>${ic('arrow-left')}Previous</b><span>${nn(pi + 1)} · ${projects[pi].title}</span></button><button type="button" data-go="${ni}" aria-label="Next project, ${projects[ni].title}"><b>Next${ic('arrow-right')}</b><span>${nn(ni + 1)} · ${projects[ni].title}</span></button></div>`;
}

export const planetHTML = (projects: Project[], i: number) => `<div class="cplanet"><img src="${projects[i].planet}" alt="">${moonsHTML(i)}</div>`;
