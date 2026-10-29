import type { Project, SiteData } from '../lib/site';
import { BASE, slugOf } from '../lib/pages';
import { $ } from './util';

export const DATA: SiteData = JSON.parse($('site-data').textContent || '{}');
export const PROJECTS = DATA.projects;
let stories: Promise<void> | null = null;
// stories stay out of the home document to keep it under the size where Lantern adds 300ms to LCP
export const loadStories = () => (stories ||= fetch(`${BASE}stories.json`).then((r) => r.json()).then((m: Record<string, Project['story']>) => PROJECTS.forEach((p) => { if (m[p.id]) p.story = m[p.id]; })).catch(() => {}));
export const caseAt = (path: string) => PROJECTS.findIndex((p) => p.id === slugOf(path));
