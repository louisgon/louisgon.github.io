import type { SiteData } from '../lib/site';
import { $ } from './util';

export const DATA: SiteData = JSON.parse($('site-data').textContent || '{}');
export const PROJECTS = DATA.projects;
