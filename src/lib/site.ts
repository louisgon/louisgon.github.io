import { getCollection } from 'astro:content';
import { webp } from './assets';

const SPRITES = ['ship', 'drone', 'dart', 'heavy', 'boss'] as const;

export async function getProjects() {
  const entries = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(entries.map(async ({ data }) => ({ ...data, planet: await webp(`p${data.order}`), shot: await webp(`shot-${data.id}`) })));
}

export async function getSiteData() {
  const sprites = await Promise.all(SPRITES.map(async (k) => [k, await webp(`hero/${k}`)] as const));
  return { projects: await getProjects(), sprites: Object.fromEntries(sprites) as Record<(typeof SPRITES)[number], string> };
}

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;
export type Project = SiteData['projects'][number];
