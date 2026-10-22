# louis.gg next

The Space portfolio for `louis.gg`, live at **https://next.louis.gg**. Branch `next` holds it, and every push to `next` deploys it. Work happens on short branches merged into `next` only when Louis says to ship. `main` still serves the 2021 site through GitHub Pages until a cutover, which happens only on Louis's word.

The site is a static Astro project in plain strict TypeScript with bun and no UI framework. One page holds a three.js hero, Lenis scrolling and a single frame loop.

## Layout

| Path | What it is |
|---|---|
| `src/pages/index.astro` | The page, composed from the section components |
| `src/layouts/Base.astro` | Head, noindex meta, fonts, the stylesheets in cascade order, the `site-data` JSON island and the script entry |
| `src/components/` | One component per section (Nav, MobileMenu, Hero, PilotLog, Stack, Work, Clients, About, Contact, Footer, CaseShell) plus Backdrop, Cursor, ReviewTab, Heading and Divider |
| `src/content/projects.json` | The eight projects in site order with their `fact` line and case `story`, validated by `src/content.config.ts` |
| `src/lib/` | Build time helpers. `assets.ts` runs every image through Astro's `getImage`, `site.ts` builds the project list and the data island, `planets.ts` holds the moons and `skills.ts` the stack cards |
| `src/scripts/` | Client code. `main.ts` runs setup in order and owns the one requestAnimationFrame loop, `state.ts` holds shared state, and each system has its own module |
| `src/styles/` | Global CSS split by section, imported by `Base.astro` in cascade order |
| `src/assets/` | Source images, one WebP each. The build writes WebP at quality 85 everywhere and AVIF at quality 60 for the four hero layers |
| `public/_headers` | Copied to `dist`, sets `X-Robots-Tag: noindex` |
| `tools/parity/` | The parity harness (Playwright) |
| `HANDOFF.md` | The full design and engineering history |

## Commands

```sh
bun run dev            # astro dev
bun run build          # dist/ for the live site, noindex meta added
bun run build:review   # dist/ with the Review tab
bun run check          # astro check, strict TypeScript
bun run preview        # build, then wrangler dev
bun run review         # review build with base /a/8t5qjd6kq3na/, republished to the local artifact host
bun run deploy         # build, then deploy from this machine (fallback when Actions is down, only when Louis asks)
bun run parity <check> # compare two builds, see below
```

## Parity harness

`bun run parity <check> --a <url or folder> --b <url or folder>` compares two builds. `--a` defaults to https://next.louis.gg and `--b` to `dist`, and a folder is served locally. `--swap <folder>` makes the `b` site load its images from that folder instead of `/_astro`, so pixel comparisons ignore image encoding. Reports go to a temp folder unless `--out` names one, and `--only` filters scenarios by name.

| Check | What it does |
|---|---|
| `trace` | Runs every scenario in `scenarios.ts` on both sites under a fake clock that also drives CSS transitions and animations, with a seeded `Math.random`, samples every element's inline style, classes, attributes, text, scroll and focus every second frame, and screenshots each mark. Any difference is a behaviour change |
| `css` | Loads the `a` site's DOM snapshots from a trace under each site's stylesheet and compares every computed style, including `::before`, `::after`, hover and focus, at two widths with and without reduced motion |
| `video` | Real time recordings scored for brightness blips per 4x4 tile against the mean of the neighbouring frames, with a contact sheet of the peaks to check by eye |
| `timing` | Frame times at device scale 2 through scroll, nav, case and menu flows |
| `health` | Sideways scroll on phones, the case scrollbar with classic scrollbars, console errors and failed requests |
| `keys` | Tab order, focus rings, the skip link, and opening, paging and closing a case from the keyboard |
| `output` | Checks a build folder for 2D transforms, review code in the live build, noindex and image sizes |

## Notes

- Deploys go to an assets-only Worker named `louisgg-next` with the custom domain `next.louis.gg`. Cloudflare manages its DNS record.
- `.github/workflows/deploy-next.yml` runs on every push to `next` and from the Run workflow button. It installs with the frozen lockfile, then runs `check`, `build` and the parity `output` check before `wrangler deploy`, using the `CLOUDFLARE_API_TOKEN` repository secret. The account ID sits in `wrangler.jsonc`.
- The live build stays unindexed until cutover, through both the `noindex` meta and the `X-Robots-Tag` header.
- `REVIEW=on` sets `__REVIEW__`. The Review tab renders only then, and the `#review` alias points `main.ts` at `review.ts` (which brings `review.css`) or at an empty module, so the live build carries none of it.
- CSS minification is off because Lightning CSS rewrites `translate3d`, `scale3d` and `rotate3d` into 2D forms. The `output` check guards it.
- Keep the order of the ticks in `main.ts`. Many modules read values another module wrote earlier in the same frame.
- Icons are Lucide inline SVG at a 1.5 stroke. Pill buttons are label only.

## Design and build rules

### Direction
- The hero is the cockpit moment. You rest in orbit over a dawn planet with the LG-01 ship, and one scroll flies you out into the site. Everything past the hero is a normal, readable, scroll-animated site in the same space theme. Do not reopen other directions.
- Art direction applies to the hero only. Other sections stay minimal, with thin, exact, code-drawn graphics on near-black and no painted backdrops.
- The hero is layered painted art (sky, far world, clouds, ship) in the site's WebGL canvas with small life in each layer. Improve it by retouching or repainting layers, never by going back to procedural planets.
- The project planets are the real solar system in project order (Mercury Air Mail to Neptune UMF) with their real moons. Nothing is drawn behind a planet.

### Motion
- Everything is buttery. No flicker, no snapping, nothing pops in. Every show, hide, swap, image and texture eases in and out. Treat any instant change as a bug.
- The text scramble on headings, project titles, the case title and the nav readout stays. It must start as glyphs on its first visible frame.
- Scroll exits are natural parallax. Outgoing visuals move with the page at 0.35 to 0.75 speed with feathered edges, and the next section follows directly behind.
- Nav jumps always glide. Case study transitions run in strict sequence (content out, warp, content in) through the one travel function.
- Animate transforms with translate3d and scale3d, keep keyframes to transform and opacity, and give animated elements will-change transform, opacity and backface-visibility hidden.
- Never put backdrop-filter, mix-blend-mode or live blur over moving layers. Measure frame timing through the whole motion at device scale 2, not just at rest.
- Anything parked off screen (like the skip link) must also be transparent, because phone browsers draw the page under the status bar.

### Interface
- Header is HUD brackets around the active link, a 00 to 05 readout, the labels Log, Stack, Work, About and Contact, and a solid white Let's talk pill.
- Buttons are refined pills, solid white primary and outline secondary, with labels only. No icon on View the work, Get in touch, Case study or Visit site, and never a diagonal external arrow anywhere.
- Icons are Lucide inline SVG at a 1.5 stroke with round caps, used only for icon-only controls and small nav cues. Never use text glyph arrows.
- Pilot Log is Big numbers in a divided row. The About timeline is Big years. Hero is Ready for launch with no overline or tagline.
- The native cursor always shows. The targeting cursor is decoration for mouse pointers only.
- Hover effects apply only under (hover: hover). Tap highlight is off.

### Accessibility
- Every interaction works from the keyboard with visible focus. Dialogs trap and return focus, Escape closes, arrow keys page case studies, and links go where they say.
- Respect reduced motion with plain fades.

### Copy
- Keep copy general. Prefer totals (13 years on the web, 170+ projects shipped) over breakdowns by employer or type.
- Never write job-seeking lines such as open to roles or open to contract work. Contact copy invites people to talk about what they are building.
- In anything written for Louis (copy, docs, PRs, commits), avoid colons and dashes in prose.

### People and privacy
- Louis's likeness appears only in the approved illustrated portrait. His family never appears on the site or in anything published, and family photos are never sent anywhere uncropped.

### Process
- Verify visually and by recording. Record with Playwright video, extract frames with ffmpeg, score regional brightness blips (a 4x4 tile differing from the mean of its two neighbours), and check every peak by eye because fast motion gives false positives.
- Deploy to next.louis.gg only when Louis asks. Cut over louis.gg only on his word.
