import { getImage } from 'astro:assets';
import sharp from 'sharp';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import { WIDTHS } from './widths';

const WEBP = 85;
const AVIF = 60;

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.webp', { eager: true });

const source = (name: string) => {
  const file = files[`../assets/${name}.webp`];
  if (!file) throw new Error(`Missing image src/assets/${name}.webp`);
  return file.default;
};

export const webp = async (name: string, width?: number) => (await getImage({ src: source(name), format: 'webp', quality: WEBP, width })).src;
export const avif = async (name: string, width?: number) => (await getImage({ src: source(name), format: 'avif', quality: AVIF, width })).src;
export const small = (name: string) => WIDTHS[name.split('/').pop()!][0];
export const srcset = async (name: string) => { const full = source(name).width, w = small(name); return `${await webp(name, w)} ${w}w, ${await webp(name)} ${full}w`; };
export const haze = async (name: string, cols: number, rows: number) => {
  const px = await sharp(join(process.cwd(), 'src/assets', `${name}.webp`)).resize(cols, rows, { fit: 'fill', kernel: 'lanczos3' }).blur(0.5).removeAlpha().raw().toBuffer();
  const hex = (i: number) => `#${[...px.subarray(i, i + 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return Array.from({ length: cols }, (_, c) => `linear-gradient(${Array.from({ length: rows }, (_, r) => hex((r * cols + c) * 3)).join(',')})`);
};
