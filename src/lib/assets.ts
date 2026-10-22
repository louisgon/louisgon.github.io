import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const WEBP = 85;
const AVIF = 60;

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/*.webp', { eager: true });

const source = (name: string) => {
  const file = files[`../assets/${name}.webp`];
  if (!file) throw new Error(`Missing image src/assets/${name}.webp`);
  return file.default;
};

export const webp = async (name: string) => (await getImage({ src: source(name), format: 'webp', quality: WEBP })).src;
export const avif = async (name: string) => (await getImage({ src: source(name), format: 'avif', quality: AVIF })).src;
