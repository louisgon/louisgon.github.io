import { getCollection } from 'astro:content';
import { webp } from './assets';

const FLEETS = ['fleet', 'pirate', 'alien'].flatMap((f) => ['fighter', 'interceptor', 'gunship', 'capital'].map((r) => `${f}-${r}`));
const SPRITES = ['ship', 'ship-top', 'nebula', ...FLEETS];

export async function getProjects() {
  const entries = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(entries.map(async ({ data }) => ({ ...data, planet: await webp(`p${data.order}`), shot: await webp(`shot-${data.id}`) })));
}

export async function getSiteData() {
  const sprites = await Promise.all(SPRITES.map(async (k) => [k, await webp(`hero/${k}`, k === 'nebula' ? 1024 : undefined)] as const));
  return { projects: await getProjects(), sprites: Object.fromEntries(sprites) as Record<string, string> };
}

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;
export type Project = SiteData['projects'][number];
