import { getCollection } from 'astro:content';
import { avif, webp } from './assets';

const LAYERS = ['sky', 'far', 'cloud', 'ship'] as const;

export async function getProjects() {
  const entries = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(entries.map(async ({ data }) => ({ ...data, planet: await webp(`p${data.order}`), shot: await webp(`shot-${data.id}`) })));
}

export async function getSiteData() {
  const layers = await Promise.all(LAYERS.map(async (k) => [k, { webp: await webp(k), avif: await avif(k) }] as const));
  return { projects: await getProjects(), layers: Object.fromEntries(layers) as Record<(typeof LAYERS)[number], { webp: string; avif: string }> };
}

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;
export type Project = SiteData['projects'][number];
