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
const png = async (px: Buffer, width: number, height: number, channels: 3 | 4) => {
  const b = await sharp(px, { raw: { width, height, channels } }).png({ compressionLevel: 9 }).toBuffer(), keep = [b.subarray(0, 8)];
  for (let o = 8; o < b.length; o += b.readUInt32BE(o) + 12) if (['IHDR', 'IDAT', 'IEND'].includes(b.toString('ascii', o + 4, o + 8))) keep.push(b.subarray(o, o + b.readUInt32BE(o) + 12));
  return `url(data:image/png;base64,${Buffer.concat(keep).toString('base64')})`;
};
export const haze = async (name: string, cols: number, rows: number) => {
  const px = await sharp(join(process.cwd(), 'src/assets', `${name}.webp`)).resize(cols, rows, { fit: 'fill', kernel: 'lanczos3' }).blur(0.5).removeAlpha().raw().toBuffer();
  return `${await png(px, cols, rows, 3)} 50% 50% / ${+(cols / (cols - 1) * 100).toFixed(4)}% ${+(rows / (rows - 1) * 100).toFixed(4)}% no-repeat`;
};
