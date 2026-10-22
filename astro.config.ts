import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const review = process.env.REVIEW === 'on';

export default defineConfig({
  site: 'https://louis.gg',
  base: process.env.BASE ?? '/',
  build: { inlineStylesheets: 'always' },
  vite: {
    define: { __REVIEW__: JSON.stringify(review) },
    build: { cssMinify: false },
    resolve: { alias: { '#review': fileURLToPath(new URL(review ? './src/scripts/review.ts' : './src/scripts/no-review.ts', import.meta.url)) } },
  },
});
