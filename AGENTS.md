# louis.gg next

The Space portfolio for `louis.gg`, live at **https://next.louis.gg**. Branch `next` holds it, and every push to `next` deploys it. Work happens on short branches merged into `next` only when Louis says to ship. `main` still serves the 2021 site through GitHub Pages until a cutover, which happens only on Louis's word.

The site is a static Astro project in plain strict TypeScript with bun and no UI framework. One page holds a hero drawn on its own 2D canvas with a hidden game, a three.js starfield, Lenis scrolling and a single frame loop. three.js draws the starfield only.

## Layout

| Path | What it is |
|---|---|
| `src/pages/index.astro` | The home page, rendering `Site` |
| `src/pages/work/[slug].astro` | One page per project at `/work/<id>/`, rendering `Site` with that case already open |
| `src/layouts/Base.astro` | Head, noindex meta, fonts, the stylesheets in cascade order, the `site-data` JSON island and the script entry |
| `src/components/` | `Site.astro` composes the page. One component per section (Nav, MobileMenu, Hero, PilotLog, Stack, Work, Clients, About, Contact, Footer, CaseShell) plus Backdrop, Cursor, ReviewTab, Heading and Divider |
| `src/content/projects.json` | The eight projects in site order with their `fact` line and case `story`, validated by `src/content.config.ts` |
| `src/lib/` | Build time helpers. `assets.ts` runs every image through Astro's `getImage`, `site.ts` builds the project list and the data island, `planets.ts` holds the moons and `skills.ts` the stack cards. `case.ts` (the case study markup), `pages.ts` (base aware paths, titles and descriptions) and `icons.ts` run both at build time and in the browser |
| `src/scripts/` | Client code. `main.ts` runs setup in order and owns the one requestAnimationFrame loop, `state.ts` holds shared state, and each system has its own module |
| `src/scripts/orbit/` | The hero and its hidden game, hooked into `main.ts` as `initOrbit` and `orbitTick`. `index.ts` runs the frame, the boost and the camera, `core.ts` holds the shared state, the seeded random sources (one for the simulation, reseeded every run, and one for visuals), the enemy types, the three factions and the capital timing, `art.ts` the generated textures, the faction palettes, the star tiles, the sprite caches and the ship light layers, `backdrop.ts` the planet scene (its limb curve, drifting haze, moon parallax and breathing sun) and the space world, `world.ts` the pooled particles, the enemy list and the spatial grid, `enemies.ts` spawning, the capital ships, faction switches and heavy separation, `weapons.ts` the five weapons, six boosts and XP, `upgrades.ts` the level and cache choices, `hud.ts` the HUD and cards, `flight.ts` start, landing and hits, `input.ts` the controls, `render.ts` the ships, effects and the Easter egg cues, `store.ts` the best time, and `test.ts` the hooks only a test build compiles |
| `src/styles/` | Global CSS split by section, imported by `Base.astro` in cascade order |
| `src/assets/` | Source images, one WebP each, with the hero art in `hero/`. The build writes WebP at quality 85 everywhere and AVIF at quality 60 for the two hero backgrounds, which a `picture` in `Hero.astro` serves so each device loads only the one it needs |
| `public/_headers` | Copied to `dist`, sets `X-Robots-Tag: noindex` |
| `tools/parity/` | The parity harness (Playwright) |
| `tools/hero/` | Playwright checks for the hero and its game |
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
bun run hero           # hero and game checks on a test build, --only egg,boost,fleets,cards,combat,land,pause,a11y,swipe,world,idle,perf
```

## Parity harness

`bun run parity <check> --a <url or folder> --b <url or folder>` compares two builds. `--a` defaults to https://next.louis.gg and `--b` to `dist`, and a folder is served locally. `--swap <folder>` makes the `b` site load its images from that folder instead of `/_astro`, so pixel comparisons ignore image encoding. `--base` serves the `b` folder under a base path, such as the review build's `/a/8t5qjd6kq3na/`. Reports go to a temp folder unless `--out` names one, and `--only` filters scenarios by name. `--mask hero` makes `trace` and `css` set aside the hero, the old `#orb` layer and the intro body classes, and labels the marks where the hero is on screen, for comparing across the orbit hero change.

Scenarios marked `fresh` cover behaviour the baseline does not have (direct case URLs, browser back and forward, refresh with a case open, keyboard paging and a direct load of every slug). They run on `b` only, and their `expect` steps check the path, open case, focus, centred row, history length, title and canonical, and that a directly loaded case has the same DOM as one opened in the page.

| Check | What it does |
|---|---|
| `trace` | Runs every scenario in `scenarios.ts` on both sites under a fake clock that also drives CSS transitions and animations, with a seeded `Math.random`, samples every element's inline style, classes, attributes, text, scroll and focus every second frame, and screenshots each mark. Any difference is a behaviour change |
| `css` | Loads the `a` site's DOM snapshots from a trace under each site's stylesheet and compares every computed style, including `::before`, `::after`, hover and focus, at two widths with and without reduced motion |
| `video` | Real time recordings scored for brightness blips per 4x4 tile against the mean of the neighbouring frames, with a contact sheet of the peaks to check by eye |
| `timing` | Frame times at device scale 2 through scroll, nav, case and menu flows |
| `health` | Sideways scroll on phones, the case scrollbar with classic scrollbars, console errors and failed requests |
| `keys` | Tab order, focus rings, the skip link, and opening, paging and closing a case from the keyboard |
| `output` | Checks a build folder for 2D transforms, review code in the live build, noindex, image sizes, and that every `/work/` page exists with its title, description, canonical and server rendered case |

## Notes

- Deploys go to an assets-only Worker named `louisgg-next` with the custom domain `next.louis.gg`. Cloudflare manages its DNS record.
- `.github/workflows/deploy-next.yml` runs on every push to `next` and from the Run workflow button. It installs with the frozen lockfile, then runs `check`, `build` and the parity `output` check before `wrangler deploy`, using the `CLOUDFLARE_API_TOKEN` repository secret. The account ID sits in `wrangler.jsonc`.
- The live build stays unindexed until cutover, through both the `noindex` meta and the `X-Robots-Tag` header.
- `REVIEW=on` sets `__REVIEW__`. The Review tab renders only then, and the `#review` alias points `main.ts` at `review.ts` (which brings `review.css`) or at an empty module, so the live build carries none of it.
- CSS minification is off because Lightning CSS rewrites `translate3d`, `scale3d` and `rotate3d` into 2D forms. The `output` check guards it.
- Keep the order of the ticks in `main.ts`. Many modules read values another module wrote earlier in the same frame.
- The game draws from its own seeded random sources and never from Math.random, so parity stays deterministic. Simulation code uses `srand` and `srnd`, and anything that only draws uses `rand` and `rnd`, so rendering and time on a card never change what happens next.
- The hidden game is a top down survivors run in deep space. Holding the ship or Space boosts LG-01 away from the planet in one camera move (the planet falls out of frame, stars streak and space fades in from above), and from there you only steer, the weapons fire on their own and swarms close in from every side. On a phone a floating joystick appears under the thumb, so holding it keeps flying and lifting it brakes, with a slightly slower and softer feel than the mouse. The camera stays locked on LG-01 for every input. XP shards bring level up cards (the first shards drift toward LG-01 so the first card comes about 10 seconds in), queued cards hand straight to the next, and every card exit and Resume gives 0.6 seconds of protection and waits for fresh input. Three factions take turns. The run opens on the Rival fleet, and the first capital ship arrives 75 seconds in. Each one has 1.6 times the hull of the one before and its own move (a broad charge for the Rival flagship, two short passes for the Pirate dreadnought, a summon phase for the Hive mothership), always with at least 0.5 seconds of locked aim before a charge. Destroying it drops the gold cache, which evolves a maxed weapon whose boost you hold (trading out a boost when all four slots are full), opens a 3 second breather with a quarter of the spawns and no interceptor lines, then ramps the next faction in over 5 seconds (Rival fleet, Space pirates, Alien swarm, then the Rival fleet again on the next lap) with a banner. The next capital ship comes 120 seconds after the cache reward resolves and never while a cache waits. Losing focus or hiding the tab pauses the run, during the boost too. Land, Escape, a wheel, a scroll or leaving the hero plays the boost in reverse back to the orbit hero, and reduced motion swaps the boost for a 300ms crossfade.
- `bun run hero` builds with `--mode test` into its own folder. Only that mode compiles `test.ts` and the `window.__lg` hooks (god, autopilot, stress, freeze, spawn, state readout and the fixed step combat labs) the game checks use, so the live build carries none of it.
- Case studies route through the History API in `cases.ts`, never a client router. Opening pushes `/work/<id>/`, paging replaces it, and Back or Escape goes back in history when this document pushed the entry. Otherwise it pushes the home URL. `popstate` runs `sync`, which brings the screen in line with the URL through the usual flights. A direct load adopts the server rendered case, lands the page beneath on that row through `HI.skip`, and its Back is a short fade with no flight.
- Icons are Lucide inline SVG at a 1.5 stroke. Pill buttons are label only.

## Design and build rules

### Direction
- The hero is the cockpit moment. You rest in orbit over a dawn planet with the LG-01 ship, and one scroll flies you out into the site. Everything past the hero is a normal, readable, scroll-animated site in the same space theme. Do not reopen other directions.
- Art direction applies to the hero only. Other sections stay minimal, with thin, exact, code-drawn graphics on near-black and no painted backdrops.
- The hero is painted planet art on the hero canvas with LG-01 drawn over it and small life in the scene. Improve it by retouching or repainting the art, never by going back to procedural planets.
- At rest the scene moves like real orbit and stays quiet behind the copy. Sunlit haze drifts toward the viewer across the surface in perspective, the sun breathes on a cycle of about 20 seconds, the moons drift on their own depth and a few stars glint. LG-01 takes its light from the scene, with a warm rim on the edges facing the sun, a cooler shaded underside, a touch of haze and engines that flicker and spill cyan light. Never change the ship's silhouette or soften it. There are no floating rocks.
- The game stays an Easter egg. No button, banner or copy points to it beyond the ship hover and the single idle whisper.
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
- Pilot Log is Big numbers in a divided row. The About timeline is Big years. Hero is Ready for launch, the subline, the two pills and the Scroll to launch cue, with no overline and no stats line. The stats belong to the Pilot log.
- The hero copy sits on soft shading anchored to it, never a box. Phones follow one type scale that matches the other sections. The headline holds two lines at 34 to 40px, the subline is 16px, and the pills are 12px. LG-01 rests at 62 percent of the width, centred between the last line of copy and the bottom of the screen, shrinking only to stay clear of the cue, and the hold hit area follows the drawn ship. On landscape phones it rests to the right of the copy.
- The native cursor always shows, except while flying the hero game, where the ship takes its place. The targeting cursor is decoration for mouse pointers only.
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
