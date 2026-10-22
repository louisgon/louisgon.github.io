import type { SiteData } from '../lib/site';
import { slugOf } from '../lib/pages';
import { $ } from './util';

export const DATA: SiteData = JSON.parse($('site-data').textContent || '{}');
export const PROJECTS = DATA.projects;
export const caseAt = (path: string) => PROJECTS.findIndex((p) => p.id === slugOf(path));
