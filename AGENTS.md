# louis.gg next

The Space portfolio for `louis.gg`, live at **https://next.louis.gg**. Branch `louis/portfolio-space` holds it. `main` still serves the 2021 site through GitHub Pages until a cutover, which happens only on Louis's word.

The whole site is one hand-written page with a three.js hero, Lenis scrolling and no framework.

## Layout

| Path | What it is |
|---|---|
| `src/index.html` | The page. `/*DATA*/` is replaced at build time with the project data and asset paths |
| `src/projects.json` | The eight projects in site order, with the case study `fact` line |
| `assets/` | Processed images copied to `dist/img` (hero layers in WebP and AVIF, planets `p1` to `p8`, screenshots, portrait) |
| `public/` | Copied to the root of `dist` (`_headers` sets `X-Robots-Tag: noindex`) |
| `build.ts` | Writes `dist/` |
| `HANDOFF.md` | The full design and engineering history of the Space prototype |

## Commands

```sh
bun run build          # dist/ for the live site, Review tab stripped, noindex meta added
bun run build:review   # dist/ with the Review tab, for local review
bun run dev            # build, then wrangler dev
bun run deploy         # build, then deploy the louisgg-next Worker (only when Louis asks)
```

## Notes

- Deploys go to an assets-only Worker named `louisgg-next` with the custom domain `next.louis.gg`. Cloudflare manages its DNS record.
- The live build stays unindexed until cutover, through both the `noindex` meta and the `X-Robots-Tag` header.
- Anything between `<!--review-->` and `<!--/review-->`, or `/*review*/` and `/*/review*/`, ships only in the review build.
- Icons are Lucide inline SVG at a 1.5 stroke. Pill buttons are label only.
