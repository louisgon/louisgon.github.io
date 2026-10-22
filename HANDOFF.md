# Space portfolio prototype, handoff (2026-10-19)

## Locked direction
- Cockpit hero only, scroll warps to lightspeed (accelerate, solid blue tunnel over everything, decelerate out over the pinned intro), then a normal scroll-animated space-themed site.
- Hero is **Lock-on** (default). Pilot ID and Mission remain as options (?hero=pilot|mission, or ⚙ Upgrades).
- All four upgrades stay on: boot-up intro, targeting cursor, case-study warp, planet per project.
- Tagline: "Building for the web since 2013." Never "Most of what I build is still in production."
- No sound. Three worlds (western, cyberpunk) dropped for now, easter egg later.
- Finish the prototype fully before any Astro work.

## Files
- Source: `mock/space.html` (backups space-v1..v66.html). Build: `python3 build-space.py` → the `space/` folder (index.html plus img/).
- Publish: `artifact publish "$PWD/space" --id 8t5qjd6kq3na --title "Louis Gonzalez Space" --description "Cinematic dawn hero that flies into a scroll-animated space-themed portfolio"`
- Live: http://localhost:4747/a/8t5qjd6kq3na/ (wifi workbook.local). Local only, never promote or deploy.
- Art: art/flight (cockpit frames, cockpit-layer.webp), art/site (nebula, belt, warp, pilot), art/planets p1-p8 (alpha cutouts).
- Test helper in page: `window.__y(id, k)` scrolls to section progress k. The hero is one screen tall, so it always lands at the top for #hero. Use real wheel scrolling to test the hero exit.

## Just finished
- Warp touch-ups: FOV kick, glowing tunnel core, "HYPERSPACE JUMP · <destination>" readout (Pilot log, or project title on case warp).
- Lock-on polish: brackets snap in, callout lines draw, follows planet parallax, turns gold "ENGAGE" on scroll.

## Stack section redesign (done 2026-10-19, backup mock/space-v6.html is the pre-redesign copy)
- Cards are holographic glass panels with a SYS number, line icon, title, systems count, a one line description (hidden on narrow cards via `.table.tight`), and six items that light up in sequence after the flip. Gold corner brackets and scanlines; the upside-down label is gone.
- `sizeDeck()` fits cards to the space under the heading and picks whichever layout gives the biggest card, 4 across or 2x2. Below 200px wide it switches to a phone rail where cards slide across with eased stops and flip as each arrives.
- Verified at 1920, 1440, 1024, 820 portrait and 390 with no clipped text and no page overflow; 8.3ms median frame time.
- Next: Louis reviews the stack, then continue section by section from his Review panel notes.

## Stack flow change (2026-10-19, later)
- Louis liked the cards but not the pinned deal and flip flow ("too long, too pinned"). The stack is now a normal scrolling section. The cards sit in a CSS grid (4 across from 1000px, 2x2 below that, a swipeable scroll-snap row under 600px) and rise in face up, staggered, as the grid enters. Card sizing comes from container query units on `.slot`. Backup of the pinned version is mock/space-v7.html.
- The intro nebula no longer parallaxes, so its bottom fade shows instead of a hard edge.
- Verified at 1440 only before Louis asked to move on to polish. Phone swipe row not yet checked.
- Next: polish graphics and content, as Louis chooses.

## Graphics polish pass 1 (2026-10-19, backup mock/space-v8.html is before it)
- Louis chose graphics first, content later (projects still need role and outcome facts from him).
- Work section has soft nebula glows down its length; screenshots get a holo border and glow, gold corner brackets (shared `.hud` class), a scanline overlay, a solid DEST bar with the site name, and dim slightly until hover. Planets are bigger and straddle the screenshot's top outer corner so they read clearly.
- Pilot portrait uses the same `.hud` brackets.
- Phone stack row now has room for card glow, so no clipped edge.
- Verified at 1440 and 390, no page overflow. Stack phone row checked.
- Next graphics candidates: clients marquee, hero lock-on callouts, consistent section transitions.

## Graphics polish pass 2, whole site (2026-10-19, backup mock/space-v9.html is before the hero changes)
- Root cause of rough graphics was low resolution, heavily compressed art (crops of 1672px storyboard frames at q76). Codex image output caps at 1672x941, so art is now generated there and upscaled 4x with Upscayl (installed via `brew install --cask upscayl`, CLI at /Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin, model high-fidelity-4x).
- New HD art in art/flight/hero-hd.webp, cockpit-hd.webp, art/site/nebula-hd.webp, belt-hd.webp, warp-hd.webp (all 3000 to 3200px). Pilot portrait upscaled from /tmp/louis-portfolio-art/worlds/galaxy.png to 1100px. Planets re-exported at 1024px. Sources and prompts in /tmp/louis-portfolio-art/hd.
- Hero has a stronger left scrim and glass plates behind the lock-on callouts. Client marquee has a holo band, faded edges and glowing names. Case study dialog is solid with the project planet floating in the header and a HUD framed screenshot.
- Single file is now about 4.6MB. Verified 120fps at 1440 and no overflow at 390.

## Pass 3 (2026-10-19, backups space-v10 to v12 in mock/)
- Hyperdrive snap: Lenis idle detection. Stopping anywhere between 30 percent of the hero and the pilot log landing glides (locked, eased, 1.2 to 2.8s) forward to the landing, or back to the cockpit top if the last scroll was upward.
- Transmission finale rebuilt: new relay station art (art/site/relay-hd.webp, Codex plus Upscayl), placed by `placeRelay()` so the amber core is tracked; amber signal rings pulse from the core; left column holds a single family Syncopate heading, lead and a comms console (live waveform, Email Transmit, GitHub, LinkedIn, live Dallas time). Hovering Transmit draws a gold trace from the button to the relay core.
- Codex art director critique applied (in /tmp/louis-portfolio-art/crit4/out.txt): smaller hero, intro, work and pilot headings, quieter stats, nebula pushed off the intro text, clean work screenshots with equal widths, dimmer planets, client names at equal weight without the blue box, portrait scanlines removed, navy scrim behind the bio.
- Outline buttons now have a dark glass fill so they read over the hero planet on phones.
- Not yet applied from the critique: stack card restyle (Louis liked the cards), hero callouts consolidated into one instrument.

## Minimal and alive pass (2026-10-19, backups space-v13 to v15 in mock/)
- Louis set the art style: minimal, performant, well calculated, code-drawn graphics; keep the cockpit hero and planets and make everything come alive. Memory saved as portfolio-art-minimal.
- Painted section backdrops removed (nebula, belt, work glows); build no longer inlines them (about 4.4MB).
- Starfield twinkles per star (uTime in the vertex shader), drifts, and the camera follows the mouse slightly; brighter baseline.
- Hero: cloud drift layer (masked rotating copy of the planet), breathing atmosphere ring, pulsing sun flare and anamorphic streak, idle cockpit sway, live telemetry strip (ALT, VEL, T+) on the hero only. Layers follow the planet parallax via hLayers.
- Intro: SVG orbital diagram (career eras as orbits, radar sweep, live T+ readout). Stack: fine instrument grid with a scan line, cards float idly. Work: trajectory line on the left gutter fills with scroll and lights a node per project; planets rock slowly and a masked glint sweeps across them. Row alternation now uses nth-of-type.
- Transmission has a switcher (Upgrades panel or ?tx=signal|cockpit|relay). Signal (default, minimal): email as the headline over a live canvas oscilloscope that swells on hover. Cockpit: back in the hero cockpit with a dash projected Transmit control. Relay: the painted relay station console.
- Hyperdrive snap sped up (0.65s plus up to 0.85s).
- Verified 120fps across a full scroll at 1440 and no overflow at 390.

## Push it further pass (2026-10-19, backups space-v16 and v17 in mock/)
- Louis picked Signal as the finale; Cockpit and Relay finales and their code and art were removed.
- Real 3D hero planet: a second three.js renderer on canvas #hGlobe inside .hbox, orthographic camera in box pixels, sphere at (55.6%, 83.5%) radius 25% box width. Custom shader with painted surface map (art/flight/surface.webp), drifting cloud layer (clouds.webp, luminance as alpha), sun lighting with a night side, ocean specular, limb rim, plus a backside halo. Backdrop swapped to a planetless plate (hero-bg.webp). Sources and prompts in /tmp/louis-portfolio-art/p3d. Toggle "Living 3D planet" in Upgrades (UP.globe) falls back to the painted planet.
- Headings and project titles decode through HUD glyphs on reveal (decode()).
- Stars speed up, reverse and stretch with Lenis scroll velocity.
- Project screenshots tilt in 3D toward the cursor.
- 120fps median across a full scroll at 1440 (p99 18ms), no overflow at 390, no console errors. Single file about 5.7MB.

## Refine pass (2026-10-19, backup mock/space-v18.html)
- Louis kept the 3D planet and said the site feels alive enough; keep refining.
- Globe shader: softer blurred clouds (clouds.webp re-exported with blur), cloud shadows on the surface, richer ocean tint, atmospheric haze toward the limb, cooler cloud shading on the night side.
- Pilot: timeline track fills with scroll, each role lights a node, slides in and decodes its title; portrait flickers like a holo feed, blinking comms dot, live Signal and Lag readout on a dark strip.
- Case studies: title decodes on open, screenshot tilts toward the cursor, sections reveal staggered inside the dialog (class "shown"; never use "in" inside #case, it collides with #case .in).
- Full scroll at 1440: 8.3ms median, p99 16.5ms, no errors, no overflow.

## Visual tweaks pass (2026-10-19, backup mock/space-v19.html)
- Louis picked: HUD nav and transitions, hero callouts, darker stack cards, clients and footer, plus a pilot timeline polish.
- Nav shows a live section readout (decodes on change) and a holo-to-gold page progress line; crossing into a new section fires a short star boost (boost in the starfield update). Sections stack, work, pilot and contact get a divider hairline with section number and coordinates that draws in.
- Hero lock-on callouts merged into one Target panel (Pilot, Class, Range, Status Available).
- Stack cards: near-black glass, thin blue top edge, dimmer gold corners, no scanlines or glows.
- Client strip: index numbers, hairline separators, ruler ticks top and bottom. Footer: HUD strip with ticks, coordinates and live time, outlined Back to the cockpit button.
- Pilot timeline: row hover, larger titles, gold "now" row with a pulsing ping.
- Full scroll at 1440: 8.3ms median, p99 17ms, no errors, no overflow.

## Bug and QA pass (2026-10-19, backups space-v20 and v21)
- decode() now locks the element's height, width and wrapping while it scrambles, so nothing reflows (fixed pilot rows jumping on phones).
- Case study planet lives in its own clipped layer (#cpw), case dialog is overflow-x hidden and the page behind gets overflow hidden while it is open (no double scrollbar, no sideways scroll).
- Targeting cursor adapts: text links and buttons get tight brackets (1px vertical pad, 6px arms) and no label; cards, screenshots, portrait and case shot get roomy brackets with LOCK inside the top-left corner.
- Codex QA fixes: phone timeline stacks year over title, screenshot parallax removed so mastheads are never cropped, phone hero frame corners hidden and copy raised, intro paragraph narrower beside the radar, radar labels hidden on phones, oscilloscope moved above the email, stack cards float in near unison, phone contact padding tightened.
- Content brief for Louis: http://localhost:4747/a/vr6hcurg2byy/ (brief.html). Waiting on his pasted answers.

## Louis critique round (2026-10-19, backup mock/space-v22.html)
- Keyboard a11y is a primary goal (memory portfolio-keyboard-a11y). Added skip link, global focus-visible rings, anchors move focus to their section, boot skips on any key, case study dialog makes nav, main and footer inert, focuses Back, Arrow keys travel between projects, Escape closes and returns focus to that project's Case study link. Decoding text keeps an aria-label of the real text. Duplicate marquee copy is aria-hidden.
- Native cursor always shows; HUD brackets appear only when locked on a target, and also follow keyboard focus.
- Nav z-index 60 so it stays above the warp, with the progress line always visible.
- Work rows are articles: screenshot and title open the case study, plus explicit Case study and Visit links; Visit opens the real site in a new tab.
- Hyperdrive snap shows a loader (ring, percent, destination) that scales out on arrival; the old jump readout hides while it runs.
- Intro words finish revealing by the snap landing; stats count up on first intersection and never sit at zero. Stat 3 is now 23k+ commits shipped (sum of commits in v5 projects.ts, needs Louis's OK).
- Client strip label is now "Brands and teams I’ve built for".
- Pilot portrait: tilt only on hover (crisp at rest), flicker removed, replaced with a smooth diagonal sheen, faint scanlines and a rim.
- Open: Louis dislikes the hero headline "Locked on your next launch." and wants something better.
- decode() rebuilt: each word becomes a nowrap group and each letter an inline-block cell fixed to the measured width of the real letter (Range per character), so scrambling can never reflow text; restores the original text nodes at the end and waits for fonts. Layout-shift observer over a full scroll measured 0 at 1440 and 0.00002 at 390.
- Hero copy is data driven (COPY array, applyCopy). Nine sets (0 is the original), switchable with ?copy=N or the Hero copy control in Upgrades. Comparison page with real hero captures and stat candidates: http://localhost:4747/a/3bgrsc3sg55n/ (copy-options.html). Louis rejected "I build the whole thing", "First pixel to production", "Built well. Kept running." and "Senior developer, end to end", and wants a different third stat than 23k+ commits.

## Ready for launch round (2026-10-19, backups space-v25 to v28)
- Hero copy fixed to Louis's pick: eyebrow "Pilot · Louis Gonzalez", "Ready / for launch.", subline about first commit to a calm stable launch, tagline "Building for the web since 2013." The copy switcher was removed; copy-options.html stays as reference.
- Stats generalized to three: 13 years on the web, 170+ projects shipped (150+ freelance plus 20 tracked builds), 6 yr longest client partnership. Memory portfolio-copy-general: totals over breakdowns.
- Hero to pilot log jump cleaned up: planet fades before the solid tunnel, shorter plateau, pilot log content waits for the tunnel to clear (no ghosted text), one shared loader (#snapLd ring, percent, destination) driven every frame for scroll warp, snap, nav jumps, Back to the cockpit and case studies. Old HYPERSPACE JUMP readout removed.
- jumpTo(): nav and anchor links to far sections run the warp (warpTo) and cut to the landing behind the solid, then focus the section; nearby targets glide.
- Cockpit cleaned toward the first version: painted cockpit overlay removed, replaced by a thin code-drawn canopy sill with a gold rim light and five pulsing status LEDs; stars stream past while on the hero like the first prototype.
- 3D planet: procedural domain-warped fbm clouds that swirl and drift (no texture), cloud shadows, warm city lights on the night side, ocean glint; an orbiting cratered moon; two satellites cross the hero; occasional shooting stars site-wide.
- window.__nosnap = true pauses the hyperdrive snap for testing.
- Verified: nav keyboard jump lands and focuses the section, no console errors, no overflow at 390, full scroll matches the display's idle frame time.
- Stack: a canvas "SYS BUS" under the cards (drawBus) with a node per card, traveling light pulses, and the hovered card's node and lead turn gold. Hidden on the phone rail.
- Work: each project planet has a faint tilted orbit ring and a small moon that orbits it in the frame loop, passing behind and in front of the planet.
- Backup before this: mock/space-v29.html.

## One World plan (2026-10-19, backups space-v30, v31)
- Louis wants a canvas or shader based hero and warp, and everything layered so every state change (hero to content, nav clicks, cards, case studies) feels interconnected. He asked for a strict evaluation and plan before implementing. Plan page: http://localhost:4747/a/9g3ddzc5524c/ (plan-src.html, plan.html). Phases: 1 one canvas core, 2 travel(to) state machine with a shader jump, 3 cockpit frame with parallax and glass HUD, 4 world persists through sections, 5 one HUD language, 6 performance, 7 content and Astro.
- Done this round: nav order Stack, Work, About, Contact with one sliding indicator (#navInd); ring loader replaced by a minimal horizontal bar; warp driven by one continuous progress T from 30 percent of the hero to the pilot log landing; reverse label says Cockpit; four throwaway jump screen tests switchable under Upgrades (UP.jump, ?jump=tunnel|black|white|shutter, Test jump button).
- New art in /tmp/louis-portfolio-art/r2: photoreal surf.png and lights.png (1774x887), canopy.png (1920x1080) and helmet.png (1672x941) with magenta keyable centers; clouds.png still rendering at handoff.

## One World Phases 1 and 2 (2026-10-19, backup mock/space-v32.html; rewrite script and pieces in the session scratchpad: oneworld.py, travel.js, render.js, frame_render.js)
- One WebGL canvas (#stars, z-index -1, body background transparent) renders three passes per frame: a full screen space shader (nebula fbm with per section hue, sun glow at the planet limb, vignette, grain), the starfield, and the hero planet scene. The second WebGL context, painted backdrop, hPlanet image, hatmo, hflare and #flash overlay are gone.
- Planet uses photoreal maps generated by Codex and upscaled: art/flight/earth-day.webp, earth-clouds.webp (4096x2048), earth-night.webp (2048x1024). Shader does day and night, ocean glint, drifting clouds with shadows, night city lights, atmosphere haze and rim, terminator warmth; orbiting moon kept. placePlanet() maps it to the hero box and parallax.
- travel({ y, label, action, focus }) is the single transition, strictly sequential per Louis's rule: content (#hero, main, footer, #case .in) fades out, then the minimal bar loader fades in, the move happens while hidden, the bar fills, the loader fades out, then content fades in and focus moves. Canvas warp and dim ramp with TR.warp and TR.dim (Black jump look). Used by the hero to pilot log scroll trigger (zone, heroTrig), scrolling back up to the cockpit, nav and anchor jumps (far ones), Back to the cockpit, case open, case prev and next (arrows), and case close. The scroll snap, warpTo, caseTick and jump variants are removed.
- Verified: six transition types with zero frames where content and loader overlap, correct labels and focus, scroll unlocked after; no console errors; idle and scroll frame time identical; no overflow at 390.
- Open: Louis answered "Something else" for the cockpit frame without saying what. Codex canopy.png and helmet.png (magenta keyable) are in /tmp/louis-portfolio-art/r2.

## Black warp and buttery pass (2026-10-19, backups space-v33, v34)
- Planet no longer leaves a black disc during jumps: planet and moon materials fade by alpha and the planet pass is skipped once fully dimmed.
- New warp per Louis: stars accelerate as content fades out, then black fades in fully (stars and background, TR.black and blackS), the bar loader runs on pure black, then black lifts and the stars arrive at full speed and decelerate over about a second while content fades in. All easing is now time based (exponential with separate up and down rates), not per frame.
- No-snap fixes: planet fades in only after its three textures load (readyK); boot cover stays up until fonts and textures are ready (READY), quiet cover when the boot intro is off; adaptive DPR resize now happens before rendering so the canvas never shows a cleared frame; LOCKED to ENGAGE text swap removed.
- Memory saved: portfolio-buttery (every element eases in and out, no snapping or flicker).
- Take-off hero exploration for Louis (not a decision): http://localhost:4747/a/b662ewk9gymo/ with canopy and helmet frame options, a five beat storyboard (/tmp/louis-portfolio-art/to/f1-f5.png: ridge at dusk, lift-off, cockpit ascent, atmosphere, orbit into warp) and four build options, hybrid 2.5D plus shared canvas recommended.

## Take-off prototype (2026-10-19, separate copy)
- Source mock/takeoff.html (space.html plus scratchpad takeoff.py patch), build with `python3 build-space.py mock/takeoff.html takeoff.html`, published as qs2k8faab32a: http://localhost:4747/a/qs2k8faab32a/. The main prototype 8t5qjd6kq3na is unchanged by this.
- Louis picked the ship canopy frame (art/flight/canopy.webp, keyed). New layers: plate.webp (valley without ship), ship.webp (keyed), giant.webp (alpha from luminance).
- Timeline (toFrame, TO.t seconds): copy fades out, lift-off 0.5 to 2.5 with thruster glow, dust burst and shake, black dip 2.2 to 3.25 cutting to first person, canopy fades in, altitude sstep 3.0 to 6.3 drives valley sliding away, shader sky from dusk to black, cloud wisps, plasma glow on the canopy, 3D Earth horizon rising, ringed giant appearing, stars fading in; warp builds at 6.8 and travel() to the pilot log at 7.4 with the orbit scene held (TO.hold) until it lands. Any key or click speeds it up 5x. Reduced motion skips straight to travel.
- Verified: no grounded-scene pop during handoff, focus lands on the pilot log, scrolling back up lands on the grounded ship with copy visible, no console errors.

## Take-off v2, first person and scroll driven (2026-10-19)
- Louis: first person the whole time, scroll based with snapping, and no loading content during warps; the warping stars are the loading. Keep it simple and clean.
- mock/takeoff.html is now rebuilt from mock/space.html with scratchpad takeoff2.py (v1 timed version kept as mock/takeoff-v1.html). Same artifact qs2k8faab32a.
- Hero is the cockpit from the start: canopy frame always on, valley plate through the glass, copy over it. Scroll progress across the 300vh hero (toF) drives lift (slight drop, shake, engine glow), altitude (plate slides away and shrinks, shader sky dusk to black, cloud wisps tied to altitude, plasma glow on the canopy), then the 3D Earth horizon, ringed giant and stars. Telemetry ALT and VEL follow altitude.
- Snapping: when scrolling stops inside the hero, Lenis glides to the end if you were going down (which triggers the warp into the pilot log) or back to the ground if going up. window.__nosnap pauses it for testing.
- travel() in this copy has no loader: content fades out while stars accelerate and the background dims, the move happens, stars hold at full warp about 0.9s, then decelerate as content fades in. Strict sequence kept.
- Verified: wheel scroll eases in, snaps to orbit, warps and lands on the pilot log with focus; scrolling up warps back to the grounded cockpit; no console errors; no overflow at 390.

## Take-off v3, stages and painterly polish (2026-10-19, backup mock/takeoff-v2.html)
- Louis asked for polish via Codex art, painterly cinematic look, snap to stages, and a slider for the glide speed. Built with scratchpad takeoff3.py plus direct fixes. Same artifact qs2k8faab32a.
- Three stages, STAGES = [0, 0.5, 1] (ground, above the clouds, orbit). goStage(dir) glides with ease3 over UP.glide seconds; wheel (momentum lock via quietAt), touch and keys (ArrowDown, PageDown, Space, ArrowUp, PageUp, Home) step one stage. Lenis is stopped in the hero zone. stageY clamps to heroEnd() minus 6 so orbit never triggers the warp; stepping past orbit calls travel() to the intro, and scrolling up from the intro lands back at orbit (ST.i = 2).
- Layers in #to: toOrbit, toSea, toPlate, toWisp (two luminance-alpha wisps), toCanopy, toGlow, toPlasma. Plasma only shows while moving between stages.
- New Codex art in art/flight: sea.webp (cloud sea), wisp.webp, orbitA.webp (alien world under the ringed giant), orbitB.webp (Earth at night with sunrise), orbitC.webp (giant fills the view). Sources in /tmp/louis-portfolio-art/to2.
- Upgrades panel gained Orbit view (A, B, C, also ?orbit=A|B|C) and a Stage glide slider (0.6 to 3s, default 1.5).
- Orbit options page for Louis, http://localhost:4747/a/ii5hmdt4gx3o/ (each composited with the canopy, See it live links). Option A recommended since it keeps the story continuous from the valley.
- Verified: stage stepping both ways (0, 900, 1794, then the intro and back), copy restores on the ground, no console errors.
- Open: Louis to pick the orbit view and react to the stages and slider; phone canopy crop still needs polish; promote into the main prototype once approved.

## Orbit hero and deep space glide (2026-10-19, backup mock/space-v35.html)
- Louis dropped the take-off. The hero stays in orbit, you glide further into space the deeper you go, and the hero to pilot log jump uses the standard warp. The take-off copy qs2k8faab32a is reference only.
- Main prototype 8t5qjd6kq3na now uses the loader-free travel (content out, stars accelerate and hold about 0.9s, content in as they decelerate). #snapLd, its CSS, the JUMPS labels and travel labels are gone.
- The planet persists after the warp instead of fading out. placeDeep(d) puts it below you as a horizon cap smaller than in the hero, and it falls away and shrinks through the pilot log (deepK runs from the pilot log landing to the Stack top), gone by Stack so it never fights the project planets. Shaded 50 percent in content (uShade), limb antialiased, hidden while a case study is open (caseS), not rendered once off screen. The nebula thins with depth across the whole site (depthK).
- Verified at 1440 and 390: warp both ways with focus and scroll unlock, nav jumps, no overflow, no console errors, about 8ms per frame.

## Alien orbit hero (2026-10-20, backup mock/space-v36.html is the 3D Earth only version)
- Louis picked the orbit option A image (alien world under the ringed giant, seen through the canopy) as the hero view.
- art/flight/worldA.webp is orbitA keyed below the horizon (circle center 1120,10380, top at y 846, blur 14) so the world moves on its own layer.
- Fixed #orb layer (z -1, above the canvas) holds #orbSky (orbitA), #orbWorld (worldA, side mask) and #orbSun (breathing screen glow). #hCanopy (canopy.webp) sits in the hbox and replaces the CSS sill. layoutHero sizes #orb children to the same 16:9 cover box (HB).
- Hero: sky, sun and world parallax at different depths with slow drift and breathing; the lock-on reticle aims at the giant. The whole layer fades out with dimS during warps.
- Content: Louis chose gone after the warp, so the whole #orb layer only shows in the hero zone; past the warp it is deep space, with the nebula thinning down the site (depthK).
- Upgrades has an Orbit view switch (Alien world, 3D Earth; also ?view=alien|earth). 3D Earth keeps the previous behaviour with the WebGL planet and sill.
- Verified at 1440 and 390: warp both ways, focus, no overflow, no console errors.

## Orbit fly-by (2026-10-20, backup mock/space-v37.html is before it)
- Louis said the hero felt static and wants to fly around the planet's orbit into dark space, with the warp starting once past the planet.
- Layers, bottom to top: #orbBack with #orbSky (art/flight/skyA.webp, orbitA with the world and sun cut out and its lower haze darkened toward space), the WebGL canvas (alpha true; the background pass is skipped by uA = 1 - orbK * skyO so live stars stream over the painted sky), #orb with #orbW (worldA.webp keyed with the horizon haze and sun glare, #orbRim breathing SVG atmosphere line, #orbSun glow). #hCanopy in the hbox bobs and shakes.
- Flight state FL (p 0 to 1, cosine eased, UP.fly seconds, Fly-by time slider in Upgrades 1.2 to 4s, default 2.4). One wheel, swipe or ArrowDown, PageDown or Space in the hero calls flyOut(): copy and lock-on fade, the view banks up to 9 degrees, the world sinks out of frame, the giant slides and zooms past, sky fades to the nebula, stars accelerate (flyS), then travel() warps to the pilot log. Lenis stays stopped in the hero.
- goHome() (scroll above the pilot log, the logo, any hero link) warps back with FL.p = 1, landing in dark space, then flies back into orbit. Nav jumps out of the hero still warp directly.
- Verified with timed frames at 1512 and 390: no ghost horizon, giant passes cleanly, return trip works, focus lands, no overflow, no console errors.

## Natural transitions pass (2026-10-20, backup mock/space-v38.html is before it)
- Fly-out now eases in (sine) so the ship keeps accelerating, and travel() starts at 86 percent of the flight, so the warp picks up the motion instead of following a stop.
- travel() takes a reveal callback fired when the dim lifts; goHome() uses it to start the flight home as the view is revealed (eases out, arriving at speed and settling into orbit).
- Star speed factors are eased (flyS, streamS, fadeS) so nothing steps at the hero to content switch; warp deceleration rate raised from 1.05 to 1.5 so streaks clear sooner behind text.
- Upgrades has Nav from the hero (Warp straight, Fly by first; also ?nav=warp|fly). Fly by first runs flyOut(target) and warps to the clicked section.
- Verified with a temporary state probe (removed): continuous star speed through fly-by, warp and landing, return flight starts on reveal, no frame over 26ms on a cold first flight, no console errors.

## Fly-by as one turn, performance pass (2026-10-20, backup mock/space-v39.html is before it)
- Louis said the fly-by looked unnatural, jumpy and not performant.
- The fly-by is now a single banking turn away from the planet (turnS = sstep(0, 0.8, p), bendS = sin(pi * turnS)): sky slides 1.15 box widths left with a soft masked edge, the world slides 1.3 widths left and drops (pitch up), both bank up to 6 degrees and level out; no zooms or dissolves. Stars follow with a temporary shift and a sideways trail on the streak tails (uShift, uSweep, uPitch in the star vertex shader) plus camera roll, so the warp vanishing point stays centred. Then stars accelerate into the warp. Wrapping stars was tried and dropped (pulled near stars on screen as long lines).
- Performance: removed every backdrop-filter in the hero and overlays (only nav.solid keeps one), removed the SVG rim with its blur and all mix-blend modes, #hv and .lockui are now will-change layers, the hero copy stays rendered (inert) while hidden in the hero zone, the background shader is skipped while the painted sky covers it, DPR never drops mid-flight or mid-warp, and a capture-phase wheel hush swallows trackpad momentum during and right after a flight or warp.
- Measured at 1512x720 (120Hz): p50 8.3ms, p95 9.3ms through fly-out, warp, landing and the trip home; before the pass the fade window ran at 25 to 33ms per frame.

## Straight flight, real Retina performance, pilot log entrance (2026-10-20, backup mock/space-v40.html is before it)
- Louis rejected the turn: the fly-by is now straight forward flight. Every painted layer scales about the screen centre (the star vanishing point): the world swells and sinks fastest (wk = 1.05 + 1.1p + 1.6p^4, drops 0.24 box heights), the sky and giant grow slower (sk = 1.04 + 0.45p + 0.35p^2); world fades 0.62 to 0.9, sky 0.62 to 0.97 into the nebula, stars stay radial, canopy only shakes under thrust. Mouse parallax and drift fade out as p rises. The star sweep uniforms and camera roll are gone.
- The headline follows the gesture, not flight progress (copyH eases to 1 the moment a flight out starts, back to 0 only once settled in orbit).
- The real bottleneck at Retina was the nebula shader: Playwright with deviceScaleFactor 2 on the M1 Pro showed 60 to 65 percent missed 120Hz frames in the warp and about 90 percent on content. The nebula now renders into a render target at 0.34 of canvas resolution (bgRT, BGS) and is blitted with grain and the uA alpha. Result at 2x: 0 percent missed frames through fly-out, warp, entrance, content scroll and the trip home; 0 at 390x844 3x.
- CSS side masks on the sky and world are baked into skyA.webp and worldA.webp; the permanent 0.999 headline opacity is reverted.
- The pilot log snapped in because its words reveal by scroll position (landing mid-section meant fully revealed) and all IntersectionObserver reveals fired during the hidden warp hold. Now revealAt is set when content fades in; IO reveals during a warp are queued (pend) and flushed then; the pilot log eyebrow, orbit graphic, word stagger and stats rise in from revealAt, stats count after; Stack cards are gated by revealAt too. Arriving content rises from 18px below (tr-low) instead of sliding down.

## Natural scrolling (2026-10-20, backup mock/space-v41.html is before it)
- Louis: no scroll hijack, no snapping, smooth natural scrolling; the warp only for nav clicks and similar jumps.
- Removed the flight controller (FL, fly, flyOut, goHome), the hero wheel, touch and key handlers, lenis.stop in the hero, both automatic warps between the hero and the pilot log, and the Nav from the hero and Fly-by time controls. The wheel hush now only applies during a warp.
- The straight flight is scrubbed by scroll: hero is 220vh, p = hero progress (hp). Headline fades over 0.06 to 0.3, the world and sky expand from the centre and fade as before, stars speed up gently (flyS weights 55 and 9, cruise not warp), the canopy fades out over 0.72 to 0.98 so only open space scrolls into the pilot log. zone is derived from scroll every frame outside a warp.
- jumpTo warps for far targets (nav, logo, anchors), smooth scroll for near ones; the logo at the top only moves focus. The pilot log entrance follows scroll (entering progress) as well as warps (revealAt).
- Verified at 1512x920 2x and 390x844 3x: steady scroll through hero into content with no warp, 0 to 1 percent missed frames, nav warp and logo warp land with focus, keyboard Page Down scrolls natively, no overflow, no errors.

## Stars and smoothing polish, nav jump modes (2026-10-20, backup mock/space-v42.html is before it)
- Star shader rebuilt: soft gaussian points instead of hard cones, size scaled by uPR (DPR / 1.5) so stars match across pixel ratios, a near-plane fade so stars no longer pop when they wrap past the camera, slower softer twinkle, a few warm stars (vC by seed), and warp streaks taper from bright head to clear tail.
- Every per-frame lerp is now time based (lf(k) uses DT so motion is identical at 60 and 120Hz): mouse parallax, nebula hue and density, card hover, holo hover, oscilloscope, cursor reticle; boost decay too. Star speed and stretch follow eased scroll velocity (velS, cruiseS) instead of raw Lenis velocity.
- Upgrades has Nav jumps (Warp far only, default; Always warp; Always glide; also ?jump=far|warp|glide). Glides use Lenis with ease3 and a distance based duration (0.9 to 2.6s).
- Verified: no shader or console errors, all three modes land exactly with focus. Frame timing could not be re-measured this round because the test browser was throttled to 30Hz by the system (a blank page ran at 33ms); the earlier Retina numbers stand and these shader changes are cheap.

## Staged section entrances (2026-10-20, backup mock/space-v43.html is before it)
- Louis picked Warp far only as the nav default (switch kept in Upgrades).
- One staged entrance system: containers get data-stage and are observed by the same IntersectionObserver (queued during warps, flushed on reveal). Children get .st with --i, rising 22px and fading in 110ms apart; the eyebrow line draws in; headings keep their line rise and decode.
- Applied to the Stack and Work heads (eyebrow, sub or lead), Clients (label, then the marquee by opacity only since script moves it), About (.pt text block replaces the old single .rv lump; roles keep their scroll stagger), Contact (eyebrow, lead, signal, email, links). Reduced motion shows everything static.
- Verified by warp to Stack and Contact and by scroll to About and Clients: full sequences play after landing, no errors.

## Warp envelope (2026-10-20, backup mock/space-v44.html is before it)
- warpS is no longer an exponential chase of TR.warp. travel() stamps TR.up when it starts and TR.down when the dim lifts; the frame computes warpS = sstep(0..750ms after up) * (1 - sstep(0..1500ms after down)), so the stars build smoothly, hold, and glide down while the new section enters, with no exponential tails.
- Phase timings tightened: content out 420ms, hold 680ms, 180ms before content in, content in 0.7s. Content is fully back about 2s after a nav click (was about 2.6s); stars come to rest about 2.6s.
- Traced: max per-frame warp change 0.07, lands with focus, no errors.

## One screen hero and case study polish (2026-10-20, backups mock/space-v45.html and v46)
- Louis: the pilot log should show right away and scroll in while the hero animates out, never locked; the helmet looked odd on phones.
- Hero is now 100vh. Its stage is position fixed and dissolves (opacity 1 to 0 over hp 0.1 to 0.62) so the cockpit stays around you instead of scrolling up as a band; hp = scrollY / (0.85 x hero height); the headline moves up with the page (0.9x) and fades; the world fades 0.3 to 0.72, the sky 0.45 to 0.95. The pilot log rises straight away. #intro pin shortened to 170vh.
- Phones and other portrait screens use the slim CSS console (#hCockpit) instead of the wide canopy art in the alien view.
- Case studies: the header (back, destination count, team, title, summary) is a staged block (.chd), and case reveals use the same queue as sections, so nothing plays behind the warp; the title decodes on reveal. While a case study is open the page, nav, footer and hero copy are hidden (body.case-open), removing the see-through double content and the inert nav. Paging with arrows and Escape to close verified, focus returns to the project's Case study button.

## Solid nav and phone pass (2026-10-20, backup mock/space-v47.html is before it)
- Nav turns solid the moment scrollY passes 1px (was at the end of the hero), fading background, border and blur over .35s.
- Phone and tablet menu: a Menu button (shown at 860px and below, matching where the nav links hide) opens a full screen .mnav with the four sections in large staged type. aria-expanded and label swap, focus moves to the first link, Escape closes and returns focus, choosing a link closes the menu (capture listener so the glide or warp runs after Lenis restarts) and travels there.
- Phones: the Review and Upgrades tabs become 40px icon buttons, project planets shrink to 36vw and sit at the top edge, pilot log stat labels tighten so they fit two lines.
- Fixed an old stylesheet bug: the v35 loader cleanup had cut the end off the reduced-motion block, leaving it unclosed (it swallowed any rule added after it). Restored from v34; braces now balance.

## Hero at rest comes alive (2026-10-20, backup mock/space-v48.html is before it)
- art/flight/rimA.webp (2560x340, placed at 52.74 percent of the box): a pre-rendered blurred atmosphere arc plus a thin bright line traced on the painted horizon (circle centre 1120, 9636 in its own coords, r 9520). #orbRim breathes opacity 0.18 to 0.62.
- #orbFlare: a 3px anamorphic sun streak with a warm core through the sunrise, breathing opacity and scaleX.
- Two CSS meteors in #orbBack (13s and 19s cycles, visible about 8 percent of each): one passes high above the headline, one dives into the planet and disappears behind the world layer. Disabled under reduced motion.
- World layer breathes scale by 0.7 percent on a 13s cycle on top of its drift.
- All opacity and transform only; no filters or blend modes.

## Living planet shader (2026-10-20, backup mock/space-v49.html is before it)
- Louis wants the alien world to feel layered, natural and alive. Chosen approach: keep the painting and animate it with a shader rather than flat 2D layers or a procedural planet.
- worldA is now rendered in the main canvas (wScene, wMesh quad in plCam CSS pixel space, transformed exactly like #orbW: drift, scroll expansion, fade), after the stars so they sit behind the planet; #orbWorld is hidden (body.living) while the rim, sun glow and flare stay as DOM overlays on top.
- Shader: discards transparent sky pixels; computes the curved horizon from the fitted circle; projects pixels onto a ground plane for perspective; painted clouds (bright, low saturation pixels) flow gently via a small noise UV offset while terrain stays still; procedural wisps drift on the wind with perspective plus offset cloud shadows; a soft sparkle on bright water near the sunrise, kept off the horizon line.
- Upgrades has Living planet (default on) to compare against the still painting. Frame timing at 2x matched with it on and off (browser capped at 60Hz during the test).

## Living giant and stronger world motion (2026-10-20, backup mock/space-v50.html is before it)
- Louis saw no animation on his phone (motion too faint at phone scale, or iOS Reduce Motion, which freezes ambient motion by design) and asked to animate the giant.
- The sky now also renders in the canvas (sScene, sMesh with skyA, same transform as #orbSky; #orbSky hidden under body.living). Order: background blit, sky, stars, world, planet pass.
- Giant (fitted disc centre 1578, 512, radius 484 in image px; bands and rings tilted about 24 degrees): band churn flows the texture along the band direction with differential noise per latitude, scaled by the sphere's depth so the limb stays still; a light glint travels around the rings (elliptical angle in the ring frame, masked to bright ring pixels).
- Stars discard inside the giant's disc (uDisc in device pixels from the sky transform), so they now pass behind it.
- Meteors moved into #orb above the canvas; m2 now crosses the top of the sky.
- World motion strengthened for phones: faster painted cloud flow, fuller drifting wisps, and broad slow cloud shadows. Phone crop shows about 1.8 percent of pixels changing over 4 seconds (was 0.65 over 3).

## Hero planets direction (2026-10-20)
- Louis asked for both planets as shaders with a new visual direction. Planet Style Lab (57ffbmbre4yy, mock/planet-styles.html) showed six live styles; he picked Cinematic and asked it to match the painting. The giant, rings, moon, sunrise and sky got close; the world read flat.
- A high-fidelity shader lab (suzq6vityf43, mock/hifi-lab.html: HDR, ACES, mip bloom, frame accumulation, physically based Rayleigh and Mie atmosphere) was started, then Louis judged the quality not what he had in mind.
- Decision: layered painted artwork, not shaders. New layers painted with Codex from the approved art (/tmp/louis-portfolio-art/lay: sky, giant with rings and moon, far world, mid mountains and clouds, near peaks and cumulus; keyed layers on magenta), stacked by depth with pointer parallax and a scroll-out separation, plus small per-layer motion. Two depth presets (Gentle, Strong) to compare in mock/layer-lab.html.
- Louis picked Gentle and asked for the life. Integrated into mock/space.html: the six layers (art/flight/layers, embedded by build-space.py) render in the site canvas as lyBack (sky, sun halo) then stars then lyFront (giant, far, rim, sun core, mid, near), placed by placeLayers(). Shader life per layer: giant bands churn along the ring direction and a glint travels the ring band; far clouds flow with the horizon perspective plus wisps and a sun sparkle; mid and near clouds flow; the rim breathes; the sun halo and core with a lens streak breathe. Phones downsample textures to 2048 and shift the crop right (HB.x) to keep the giant's lit limb in view. The old DOM orbSky, orbWorld, rim, flare and sun overlays are gone; meteors stay.
- Cockpit zoom exit done (canopy scales 1.02 to 2.42 and fades late, the phone sill sinks and grows, the stage fade moved to 0.55 to 0.95). Phone height uses 100lvh for the stage and canvas, measured by a #lvh probe through VH().
- Still pending from the same round: work planets clipping in, pilot timeline animation and hover, case study stars backdrop with generic Previous and Next and a Visit site button, then the card to case transition, then the accessibility audit.
- The nav soft overlay fix is now published with the layered hero.
- Known caveat: the upscaler left a slightly oily texture on the giant layer, more visible as it scales up during the scroll.

## Hero exit and polish round (2026-10-20)
- Hero to pilot log is now a forward climb (placeLayers with LYX). The canopy zooms out by hp 0.5. Near clouds, mid mountains and the far world fall away below in that order (gone by 0.42, 0.52, 0.66), so the bottom of the screen is clear before the log text arrives. The giant grows and slides off the top right (gone by 0.9). The milky way crossfades into the nebula last. Hero copy fades by 0.32, the stage by 0.6, and the cruise streaks are lighter.
- Work planets track continuously from 1.8 screens away, so they no longer jump into view. Opacity and scale ease in and out through the --po variable.
- The pilot timeline rail, dots and rows are tied to where the rail reaches each dot, in both directions, and the text scramble is gone. Hover slides the row 6px and lights the title and dot instead of a filled box.
- Case study changes.
  - The backdrop is a light vignette, so the stars show through and the page stays hidden.
  - Footer buttons read Previous and Next, with the project name in the aria label.
  - The live button reads Visit site ↗.
  - Card to case flight (flyCase and flyBack). The card screenshot flies into the hero shot while the page fades out, and it flies back on close. Previous and Next inside a case still use the warp. Reduced motion falls back to travel.
  - The case is pre-built on idle 4s after load (fillCase(0)), which cuts the first-open hitch from about 120ms to a single 23 to 35ms frame.
- Watch for a case study that opened by itself once during an automated page tour. It could not be reproduced in a fresh run.
- Second polish pass. Removing the decode text scramble was tried and reverted, because Louis enjoys it, so keep it. The only lasting change is a softer star streak burst on each section change (boost 0.4 instead of 1).

## Six-part polish with Codex (2026-10-20)
- Plan agreed with Codex (relay #669 and #670). Backups are space-v55 (before), v56 (before the hero shader) and v57 (before theme).
- Case study.
  - The real jump was #case .in also matching the .chd header once it revealed. Wrapper rules now target #caseIn.
  - scrollbar-gutter is stable on html.
  - The landing is measured after fonts and decode, and the header reveals after landing.
  - setBgInert locks every body child except #case, with a Tab loop inside the case.
  - Escape and paging are queued through TR.next and idle(). TR.casing lets Escape close mid-flight.
  - caseReturn restores the exact trigger.
  - Reduced motion is opacity only and live.
- Nav. jumpTo sets navIntent and setNav immediately. Scrollspy waits until the jump settles. The indicator fades in at the target when it was hidden, and links get aria-current.
- Pilot.
  - The portrait has a .holo-wrap reveal wrapper, with the tilt on the inner .holo.
  - The arrival is driven by observing #pilot: eyebrow, heading at 60ms, then lead.
  - On phones the order is bio, portrait, history, using display contents.
  - Rail and nodes are aligned and thresholds use node centers. Rows sit at 0.42 opacity before activation, and hover applies to fine pointers only.
  - Telemetry updates every 2.6s.
- Hero world.
  - FLOW now anchors alpha and only mixes cloud colour inside an opaque mask, slower, with shared horizon coordinates.
  - CURVE bends mid and near to the planet, and HAZE adds aerial perspective and desaturation.
  - World layers share one sway phase with compressed depth (0.5 ± 22%). The procedural wisps are gone.
- Theme.
  - Easing tokens --ease-out, --ease-io and --ease-pop.
  - Card reveal is now opacity on .pic plus a translate3d and scale3d settle on the img. The clip-path wipe is gone.
  - The marquee is time based, eases to a stop on hover and focus, and has a Pause button. The ping is quieter.
- Content.
  - The Pilot lead is now personal history.
  - The case mission column was removed as a duplicate.
  - STORY holds DRAFT brief, did and result copy for airmail, azul and perry-weather, for Louis to correct.

## Hero and loader variants (2026-10-20)
- Louis said the loader and hero don't match the site theme and the hero content doesn't help. He asked for configurable variants. The backup before this is mock/space-v58.html.
- Switches. UP.hs, UP.hc and UP.ld map to body data-hs, data-hc and data-ld. They are set from the Upgrades panel segs (.seg[data-key]) or the URL ?hs=&hc=&ld=. UP.hero is now always lock, and the old Hero layout seg is gone.
- Hero style (hs).
  - visor: a code-drawn .visor frame with corner brackets, a rim line, a tick ladder, a vignette and a bottom fade into --bg. It zooms out on scroll.
  - cockpit: the painted canopy, regraded with a CSS filter.
  - editorial: no frame, bigger type, and world layers pushed down 13% and dimmed to 0.82.
  - Every style grades the painted layers toward the palette through the uG uniform (0.3 for visor and cockpit, 0.42 for editorial), set by the HSTY table.
- Hero content (hc).
  - lean: kick, headline, lead and CTAs. The target card and telemetry are hidden.
  - status: lean plus the .now line ("Now · Senior developer at Goodfolks · Dallas, TX").
  - pilot: lean plus the target card and telemetry, without the reticle.
  - The kick dot is now holo cyan, not green.
- Loader (ld).
  - signal: the LG mark draws by stroke-dashoffset from --k, with a percentage caption and a progress line. leaveBoot flies the mark into the nav logo with WAAPI while the background fades.
  - orbit: rings and ticks with a progress arc driven by --k and a big percentage. The rings scale out and fade on exit.
  - The old terminal boot is gone. #boot.off fades its ::before, and .gone hides it after 1.3s. The hero arrives at t 2.75s, after the loader leaves.
- Hard edge fix. #hv no longer translates. The copy (#hv .wrap and .copy) moves through --hy, and the darkening ::before overlays stay fixed and fade with o1. Moving the whole #hv used to uncover a bright strip at the bottom while scrolling.
- The planet exits rigidly. One PLX curve is shared by near, mid and far (drop 0.8H between p 0.02 and 0.62, scale +0.12), and the world pointer depth residual is 8%.
- Louis picked Editorial, Lean and Signal lock, now the defaults. The UPK storage key was bumped to space-upg-2 so stale picks reset. The other variants stay switchable in Upgrades.
- The loader uses the real nav logo. During signal boot, body.booting raises nav above #boot, hides the other nav children and scales the logo svg to the centre. leaveBoot docks it with a 1s transition (.dock, then body.docking). Backup is space-v59.
- The pilot log word reveal is now tied to the paragraph's own position (lighting from 72% down to 27% of the viewport). The old 0.2 head start lit the first words early.
- The header progress line (#navProg) eases toward the scroll position, or straight toward navIntentY during a nav jump. It used to snap during warps.
- Nav jump rule. "Warp when skipping" (the far option) warps only when the target is more than one nav step from the current section (NAVPOS). Next or previous items glide with Lenis.
- Case flights are rAF-driven (flyTo with the bez easing) and track the target's live rect each frame, so mobile toolbar or viewport shifts can't cause a landing jump. Image tilt only follows a mouse pointer. Backup is space-v60.
- Hero visuals (UP.hv, ?hv=).
  - painted is the default.
  - night sets HS.g 0.96, HS.b 0.7 (uB uniform) and dims the sun to 0.45 through HS.s.
  - lines adds the .hl-far and .hl-giant SVG overlays in #hbox, in layer coordinates (3200 by 1800). Every frame they mirror the far and giant layer transforms through HLT.
  - both combines night and lines.
- Hero copy (UP.hx, ?hx=). The HXC table and applyCopy hold launch (default), name and outcome. The second CTA is now Get in touch.
- The comparison page is Hero Variants, rswgmd7fns4c (review/hero-variants.html).
- The occasional page that starts scrolled, or a case study that opens by itself, comes from the crashing Playwright test browser, not the site. Three monitored loads showed no scroll calls.

## New hero art (2026-10-20)
- Louis kept the painted treatment with HUD lines (UP.hv lines, the new default with key space-upg-3) and Ready for launch copy, but wanted new artwork. Six concepts were made (review/hero-art.html, artifact zkywjzsx5nba, sources in /tmp/louis-portfolio-art/art2). He picked 01, Cinematic realism in the new composition: a small distant giant, a dark planet with a glowing limb, dawn at the right and a quiet left side.
- Layers were painted with Codex from real-new.png (in /tmp/louis-portfolio-art/lay2: sky, giant, far on magenta), then upscaled 4x with Upscayl high-fidelity and keyed with lay2/key.sh into art/flight/layers2 (sky, giant, far, rim). The rim is drawn as circles on the fitted limb. mid and near are gone, and build-space.py now embeds layers2. The page is about 5.7MB.
- Geometry. The horizon circle is centred (1912, 11143) with r 10107 (top at y 1035). The giant is at (2676, 332) with r about 140, and SUNP is [0.936, 0.6]. The LAYF FLOW and HORIZON constants, the HUD SVG arcs and ticks, and the giant ring use these values. The giant has no shader effect now and LYB is empty. The phone crop is HB.x -0.3 bw, and HUD labels are hidden at 860px and below. Backups are space-v62.html and build-space-v1.py.

## Ship hero (2026-10-20)
- Louis rejected the cinematic art (generic, not alive). Round two concepts are on review/hero-art-2.html (artifact hc9xa7p92sua, sources /tmp/louis-portfolio-art/art3). He picked 02, Your ship.
- Layers were made in /tmp/louis-portfolio-art/lay3 and output to art/flight/layers3 (sky, far, rim, ship). build-space.py embeds layers3. Backups are space-v63.html and build-space-v2.py.
- Geometry. The planet edge fits a circle centred (3375, 5518) with r 5372, but the HUD line and rim are traced from the real mask edge (hud.json). SUNP is [0.878, 0.095]. SHIP is c [2278, 950] with the engine at [2077, 1031].
- Motion.
  - The far layer has FLOW and HAZE 0 plus CITY twinkle. HORIZON sparkle is off because it looked blocky.
  - placeShip moves the ship as its own body around its centre: parallax 1.4×, bob and sway, banking toward the pointer, and a boost to the lower right between p 0 and 0.42 before the planet sinks.
  - The jet additive bloom (SUNF JET) follows the engine, and ENGINE pulses the painted cyan cores.
  - On portrait screens the ship scales to 0.56 and centres under the CTAs, with HB.x -0.2 bw.
  - The HUD .hl-ship bracket and the "LG-01 · L. Gonzalez" label follow the ship through HLT.ship.
- The pilot log is no longer pinned. #intro has natural height and .pin is relative. Words reveal from their own position: a line starts at 90% of the viewport and sweeps left to right (wordGeo is cached from offsets). Backup is space-v64.html.
- Ship animation polish (backup space-v65.html).
  - SPR is a spring toward the raw pointer (k 26, damping 7.5) with slight overshoot, and the bank comes from spring velocity.
  - A layered sine figure-eight drift with roll synced to the bob.
  - Arrival glides in from the upper left over 2.2s when the hero copy comes in (body hv-in).
  - The boost does a small pull-back anticipation, then an arc to the lower right while rolling into the turn.
  - SHP.thr drives the jet bloom size and brightness from spring speed, boost and arrival, and the engine throb is slower (3.1 and 7.3).
- The pilot log reveal is slower. A word reaches full at (0.92vh minus top minus 0.6 line offset) divided by 0.28vh, minus 0.5 times x, with a 28px rise and a 0.08 floor. It completes as the paragraph reaches mid-screen.

## 3D hero lab (ship-lab, artifact qekic8ts7h6q)

- `mock/ship-lab.html` is built by `build-lab.py` into `ship-lab.html`, then published with `artifact publish "$PWD/ship-lab.html" --id qekic8ts7h6q`. Backups run from ship-lab-v1 to ship-lab-v7.
- The planet is ray traced per pixel in one fullscreen pass. It uses NASA Black Marble night lights (`art/flight/nasa/night-8k.webp`) and adds clouds, aurora, lightning, satellites and meteors, followed by bloom and a filmic grade.
- The ship is modelled in Blender by `blender/ship.py`, which runs headless.
  - `Blender -b --python ship.py -- render` writes prev-hero, prev-side and prev-top previews.
  - `-- export` bakes colour with AO, roughness and metal, and normal maps into `tex-*.png`, then writes `ship.glb` without images.
  - Convert the maps with `magick tex-col.png -quality 88 tex-col.webp` (same for rm and nrm), then compress with `bunx --bun @gltf-transform/cli meshopt ship.glb ship-opt.glb` (1.04 MB down to 244 KB).
  - The lab loads `ship-opt.glb` through GLTFLoader with MeshoptDecoder. The baked maps go in as data URIs, because the host CSP blocks the blob URLs that GLTFLoader uses for embedded textures.
- The heading is derived from the planet. The nose stays level with the surface, aims along the horizon toward the sun with FLY.side (0.6 desktop, 1.1 portrait), and climbs at FLY.climb. It never points at the planet, and the boost follows the same heading.
- A hold launches the ship from idle or while it glides back in. It is gone while held and glides back in after release. Scrolling never moves the ship.

## Cinematic dawn hero (2026-10-21, backups mock/space-v66.html and build-space-v3.py)
- Louis called the hybrid "terribly visually", explored six 2D directions, storyboarded three for the hero only and picked Cinematic dawn. The playable preview is artifact 8i3zsrzwq3g5 (review/dawn.src.html and review/build-dawn.py). The direction is for the hero only.
- Art. One Codex master plate was split into a cloud-free ground plate and a cloud deck with real alpha, and LG-01 was repainted in the same pose with real alpha. Everything was upscaled with Upscayl remacri-4x, because high-fidelity dims the city glow and ultrasharp or ultramix add a dithered texture. Sources are in art/dawn-final.
- `prep-dawn-site.py art/dawn-final art/flight/layers4` writes far (the ground with a 7% feathered top), cloud and a full-frame ship as WebP and AVIF, plus hud.json. The limb circle is (4300, 8863) r 8704, fitted to the blue rim with outlier rejection (2px residual).
- Layers, in order, are sky (layers3), halo, far, cloud, core, plume0, plume1, ship and jet. Far uses CITY, now gated by local contrast so only city points twinkle and the sunlit terrain stays still. Cloud uses DRIFT, a slow slide of about 1% over the ground. Far and cloud share the PLX rigid exit. FLOW, HAZE and the rim layer are gone from the hero.
- Geometry. SUNP is [0.8953, 0.1794]. SHIP c is [2218, 1143] and e is [2070, 1226], with nozzles n [1914, 1161] and [2225, 1292]. PLUME is [-0.902, -0.431] in three coordinates.
- Ship. shipState runs once a frame before the layer loop, so the plumes never lag the ship. The ship arrives from behind and below over 2.2s when hv-in lands, and keeps the pointer spring, bob and bank. Scroll launches it (Louis asked for this on 2026-10-21 and then dropped hold to boost, which is fully removed). Over hero progress 0.02 to 0.34 it dips, then climbs toward the sun's rest position (clamped to 40% of the viewport from centre so it never clips an edge), shrinks to 15%, burns its plumes, brightens the sun by up to 32% and fades at 0.24 to 0.36.
- The editorial grade is now y 0, g 0.06, a 1. The old 0.42 desaturation and 0.82 alpha were what made the hero look muddy. Portrait HB.x is -0.12 bw so the headline sits over darker sky.
- Build. build-space.py now writes a folder (index.html at 185KB plus img/) instead of one 5.9MB file. The four hero layers also ship as AVIF, chosen by a top-level await that decodes a 1px AVIF probe, with WebP as the fallback.
- Verified at 1440 and 390 with no console errors, AVIF chosen in Chromium, a 16.7ms median frame in the 60Hz test browser, a rigid exit with no hard edge, and the stacked phone cue.

## Hero to pilot log as a natural scroll (2026-10-21, backups mock/space-v67.html and v68.html)
- Louis asked to clean up the transition, then said a sequenced version still had too long an empty gap and did not feel smooth, seamless or natural. The cause was two motion systems. The hero sat on fixed layers that scroll only scrubbed (the planet dropped at about twice scroll speed while the page moved up), and the pilot log scrolled normally, so they moved in opposite directions with a wait between.
- The hero now behaves like part of the page.
  - PLX is [0.75, 0.04, 0.5, 1]. Far, cloud and the sun layers rise at 0.75x scrollY, grow 4% across the hero, and fade over hp 0.5 to 1. The sky backdrop rises at 0.35x and fades over 0.5 to 1.
  - FEATHER (sky, far, cloud) multiplies alpha by smoothstep(0, uF, vUv.y). uF grows from 0.06 at rest to 0.56 by hp 0.45, so each layer's lower edge dissolves into space as it rises and there is never a hard band.
  - The ship rides the same 0.75x rise and launches over hp 0.02 to 0.36 toward the rising sun (clamped 40% from centre), shrinking to 15% and fading 0.26 to 0.38.
  - The copy scrolls 1:1 (--hy is -scrollY) and fades over 0.06 to 0.32. The HUD powers down over 0.03 to 0.18.
  - The pilot log follows directly behind the dissolving planet, so there is no empty stretch. The scripted streak surge is down to 0.3 of its old peak, and the stars otherwise follow scroll velocity.
- Verified at 1440 and 390 frame by frame with no console errors.

## Pilot log to stack (2026-10-21, backup mock/space-v69.html)
- Already plain page scrolling, and the stack cards were already scroll-linked. They just entered too steeply and too late. Each card tilted 28 degrees, spun up to 4.5 degrees and started 120px back, and the stagger left the fourth card swinging in after the grid reached mid-screen.
- Card entrance is now k = out(clamp(base * 2 - i * 0.1)), with 110px rise, -80px depth, 16 degree tilt and 1.5 degree spin per column offset. All four settle as a gentle wave by the time the grid top reaches about 51% of the viewport. The phone rail is unchanged.
- The pilot log orbit graphic trails its section by 0.1x on screens above 860px (translate3d with calc(-50% + offset) to keep its centring). On phones it stays in flow with no transform.
- Verified at 1440 and 390 with no console errors.

## Stack to Selected Work (2026-10-21, backup mock/space-v70.html)
- On desktop this already flows naturally. The stack scrolls away, the heading decodes, and the project planets drift in at about 0.82x as background depth.
- On phones each planet rose up to about 160px ahead of its project, so the Air Mail planet slid across the Selected Work lead text. The planet drift is now c times -50px under 600px wide (still -160px above), so phone planets arrive below the copy and settle on the screenshot corner.
- Verified at 390 and 1440 with no console errors.

## Work to Clients to About, and About to Contact (2026-10-21)
- Checked frame by frame at 1440 and 390 and left unchanged. Both already scroll naturally. The last project hands straight to the client marquee, About's heading decodes as its portrait rises, and the transmission line, lead and email arrive together before the footer. There were no overlaps, dead gaps or console errors.

## Case study flicker fixes and polish (2026-10-21, backup mock/space-v71.html)
- How flicker was found. Playwright video at 25fps of nav to Work, open case, Next, then Back on desktop and phone, split with ffmpeg, scored per frame by regional brightness blips (a 4x4 tile differing from the average of its two neighbours). Fast motion of the bright screenshot gives false positives, so every peak was checked by eye.
- Back flight blank (the worst, a 94 blip). After Next, Back flew to a project that had never been revealed. Its reveal was queued in pend because TR.busy, and flyBack never flushed pend, so the card and its text stayed at opacity 0 after the ghost was removed. flyBack now reveals the row instantly with settle() (transitions off for one reflow) and flushes pend at the end.
- Page snap at the end of Back. body.fly-out only carried its transition while the class was on, so removing it snapped nav, main and footer back to full opacity in one frame. flyBack adds body.fly-back (opacity .42s) while removing fly-out.
- Open flight pop. The ghost is a bare screenshot, so the card's DEST tag, HUD, ring and bottom gradient vanished in one frame. The card now gets .lift, which fades those overlays in 0.18s while its tilt eases out, before the ghost takes over. The tilt handler ignores the pointer while TR.busy. On Back the card stays lifted until the ghost is removed, then its overlays fade in.
- Nav warp pop. When a warp jumps away from the hero, hero progress leapt past 1 and the planet layers' scroll fade cut to zero under a not yet full dim. hp is now frozen (heroP) while TR.dim is set, so the hero fades out with orbK.
- Result. The Back flash dropped from 94 to 13 on desktop and from 69 to 16 on phone, and the open blip from 31 to background. The remaining peaks are motion.
- Polish. Previous and Next show the destination number and project name under the label (mono, dim, holo on hover and focus). On phones under 600px the header planet is hidden and a .splanet straddles the hero shot's top-right corner like the Work cards, fading in when the shot is shown, so it never covers the title, lead or destination label.
- Not changed. The Review and Upgrades prototype buttons still float over case text on phones.

## Round 5 polish (2026-10-21, backups mock/space-v72.html and build-space-v4.py)
- Picks came from review pages 2vbu6qtaky4p and 8k755wesuntk. The before and after handoff is wpaa2j6y8y5i (review/round5-done).
- Hard-set. The Upgrades panel is gone along with the UP object, localStorage key, URL params and applyUP. The mission and pilot heroes, visor and cockpit frames, canopy, the 3D Earth (day, night and cloud textures, halo, moon, placePlanet and placeDeep), the bg sun glow, night grade, alternate copy, lockui, tele and spd are all removed. The fixed values are editorial, HUD lines, Ready for launch, lean, cursor on, case warp on, always glide, living planet on and real planets. The build no longer copies the earth or canopy art.
- Hero load-in replaces #boot. `HI` and `heroIn(now)` run each frame. HI.space fades the stars and nebula over 0.8s (U.uFade and blitU.uA). Once lyLeft hits 0 (and at least 450ms in), HI.planet fades the painted layers over 1.4s with a 3.5% scale settle, and orbK is orbG times HI.planet. The ship arrival (HI.ship) starts 900ms after the planet. The nav (body.hi-nav) shows 200ms before the copy (hv-in), which lands 1s after the ship starts or by 3.5s at the latest. Any wheel, key, touch or click during the intro brings the copy in at once. body.hi-nav and body.hi-main have an 8s CSS fail-safe.
- Landing part way down. history.scrollRestoration is manual, and scrollY is saved to sessionStorage on pagehide. On a reload or back/forward navigation, or with a #hash, a target past half a screen sets HI.skip. That scrolls there immediately (lenis.resize() first, since Lenis measured the page before the sections were built), marks the ship as arrived and fades nav and main in over 0.4s.
- Headline. The .ln mask is gone (it clipped the text-shadow). Lines fade up with translate3d. The wrap is min(1100px, 72vw) and the size is clamp(40px, 4.8vw, 92px), so it holds two lines and clears the HUD ship label.
- Buttons. .btn is the refined pill, solid fg or .ghost outline, labels only, with .sm for work rows. The magnetic pull stores b.mx and b.my so the cursor can subtract it.
- Header. Links are Log, Stack, Work, About and Contact (#intro added). #navMk holds four corner brackets moved with translate3d by placeMk(), snapping on first show. #navNum is a 00 to 05 readout via NAVN (clients counts as Work), scrambled on change. jumpTo always glides. On phones there is a round menu button with Lucide menu and x icons, and the mnav links carry 01 to 05.
- Work rows and planets. Case study and Visit site are pills. MOONS and TILT hold real moons per planet (size, orbit radius in half-widths, period in seconds, colour). orbit() moves them on 0.3-squashed ellipses and flips z-index by sin(angle). The rows, .cplanet and .splanet all use it. The CSS ring and the single grey moon are gone.
- Case study. Visit site is a ghost pill after the title (.ttl). html.case-lock sets scrollbar-gutter auto with overflow hidden, so #case is flush to the edge. travel({ fast }) uses 260, 300, 120 and 450ms with TR.f = 0.55 (shorter warp, 0.6x strength, faster dim), plus body.tr-fast CSS durations. openCase pages fast when a case is already open, and arrow keys ignore e.repeat. Azul, Rockit Apple and UMF shots are cropped in build-space.py from portfolio-v5/assets/work (1425x891 then 1200x750).
- Pilot log. The orbit SVG and its CSS are gone. Stats are a divided row with large Syncopate numbers, suffixes in small holo (yr in lowercase), and labels beneath. They stack on phones. statEls count the [data-n] spans.
- About timeline. `ol.roles` holds big years ("2024" with "to now" beneath, .now in gold). The rail and fill are ::before and ::after between --t and --b, set by fitRoles(), and the fill scales with --rp from scroll.
- Contact and footer. The time, reply line, coordinates and clock interval are gone. GitHub and LinkedIn have Lucide icons and screen reader new tab text. #top is a round arrow-up button. The .sg-mail colour transition no longer inherits the stage delay, and the oscilloscope draws once under reduced motion.
- Cursor. CUR holds a critically damped spring (w0 24, substeps at 120Hz) for x, y, w and h. The four #reticle corners move with translate3d only, rounded to device pixels, and are written only when changed. lockBox() measures .slot for cards, .holo-wrap for the portrait, and offset size around the rect centre minus the magnetic offset for everything else. A capture scroll listener rescans with elementFromPoint. Locks release on detached, hidden or inert targets (case open). Mouse pointers only, and body.cur tracks the (pointer: fine) and reduced motion queries live. #dot is removed.
- Icons. Lucide inline SVG at 1.5 stroke is used everywhere. There are no glyph arrows left, including the Review tab.
- Verified with no console errors at 1440 and 390, no phone overflow, #case right edge at 1440 of 1440, paging at about 1.1s, reload restore exact (6792 to 6792), #work landing, reduced motion, and the card lock holding still for 1s. Blip scoring on load-in, case open, paging and Back found only scroll motion.
- Hero lead. The live prototype's lead ("Senior developer in Dallas...") was kept. Review page two had shown an older markup lead by mistake.

## Phone case study fixes (2026-10-21, backup mock/space-v73.html)
- The flicker on opening a case on phones was the browser tap highlight. Mobile Chrome and Safari tint a tapped link blue for a frame or two, and that landed right before the flight started. html now sets -webkit-tap-highlight-color transparent. The keyboard focus ring is unchanged.
- Hover effects (.btn, .btn.ghost, the work card ring and image, nav Let's talk, the footer button) now apply only under (hover: hover), so a tap no longer leaves a button stuck in its hover colour after Back.
- On phones the case header planet (.splanet) sits behind the screenshot (z-index 0 under the shot's 1). It is now right -6vw, top -46px, 28vw wide, and the shot gets 52px top margin, so the planet peeks out of the top right corner clear of the lead text, like the Work rows.
- Verified with touch-emulated recordings at 390 opening Air Mail and Perry Weather. There are no tinted frames, and the only peaks are the flight motion.
- The top-left flicker on opening a case on phones (backup mock/space-v74.html) came from the title scramble. decode() swapped the text into cells, but while its start delay ran (260ms for the case title) it left the real letters showing. The title's fade-in (220ms stagger) started first, so "AIR MAIL" showed for a frame, flipped to glyphs, then resolved. decode now writes glyphs from the very first tick, so every scrambled heading (case titles, section headings, project names, the nav readout) starts as glyphs. A per-frame trace of three phone opens showed glyphs from the first visible frame and no plain text before the scramble.
- The real top-left flicker (found in Louis's iPhone recording, backup mock/space-v75.html). The .skip-link was parked above the viewport with translate3d(0, -160%, 0) and stayed fully opaque. His phone browser draws the page under the translucent status bar, so during case open and close the white "Skip to content" button showed through as a blurred pill behind the clock. It now sits at -220% with opacity 0 until :focus-visible, and Tab still reveals it at the top left. Anything parked off-screen above the top must also be transparent.
- In the same pass the flight ghosts (ghostAt) start hidden and only swap in once their image has decoded, so an iPhone never paints a blank ghost. Focus after a case opens or closes now goes to the Back button or the row's button only when the last input was the keyboard. After a tap it goes to #case (tabindex -1) or the project article, so no focus ring pops in.
- Card tag bar between states (backup mock/space-v76.html). When a case opens, .lift now slides the DEST tag down out of the card (translate3d to 100%, ease-in, .32s) and fades it, the HUD brackets, ring and bottom shade over .3s. flyCase waits 330ms (190 under reduced motion) so that finishes before the ghost takes over. After Back, when the ghost is removed, the tag slides up and fades back in (.55s ease-out). Reduced motion keeps the fade with no slide. A per-frame trace at 390 confirmed both directions.

## Moved to next.louis.gg (2026-10-21)
- The site now lives in branch `louis/portfolio-space` (worktree `~/Worktrees/louisgon/louisgon.github.io/portfolio-space`) and is deployed to https://next.louis.gg as the assets-only Worker `louisgg-next`. Wrangler created the custom domain and its DNS record. `main` still serves the 2021 site on louis.gg through GitHub Pages.
- `src/index.html` is the former `mock/space.html` (mock/space-v76.html plus the tag bar change). `assets/` holds the processed images from the old `space/img`, so the build no longer reaches into portfolio-v5 or the scratch folder. `src/projects.json` merges the PROJECTS list from town.html with the case fact lines, and `src/avif-probe.txt` is the 1x1 AVIF probe.
- `build.ts` replaces build-space.py and needs no ImageMagick. The live build strips the `review` blocks (the Review tab markup, CSS and JS) and adds a robots noindex meta. `public/_headers` adds `X-Robots-Tag: noindex` to every response.
- The local review link http://localhost:4747/a/8t5qjd6kq3na/ now shows `bun run build:review` from this project.
- Verified live at 1440 and 390 with no console errors or failed requests, no broken images and no sideways scroll, and a case opening on both.

## Astro move (2026-10-21)
- Stage 1 of the finishing plan. The one-file page is now a static Astro 7 project in plain strict TypeScript with bun and no UI framework, with no visual or behavioural change. `build.ts` and `src/index.html` are gone.
- Markup. `src/pages/index.astro` composes one component per section in `src/components/`. Content renders at build time, including the project rows, stack cards, marquee, section dividers, h2 line spans and the staged `data-stage` and `.st` classes. Decoration that behaviour creates stays runtime (intro word spans, scramble cells, trajectory nodes, planet glints, case study content, flight ghosts). The DOM after load is the same as before apart from whitespace text nodes between blocks.
- Data. `src/content/projects.json` is a content collection (`src/content.config.ts`) with id, order, title, team, url, stack, blurb, fact and the case story, which used to be the STORY object. `Base.astro` writes a `site-data` JSON island into the head with the projects and every image URL, read by `src/scripts/data.ts`.
- Images. `src/assets/` holds one WebP per image and `src/lib/assets.ts` runs each through `getImage` at its own size. Every WebP shares quality 85 and the four hero layers also get AVIF at quality 60, still chosen by the 1px probe. Both qualities were picked by an SSIM sweep against the old files. At WebP 85 the total is 3.59 MB against 3.79 MB before, and the worst image (p8) scores 0.984. At AVIF 60 every layer stays at least as close to its WebP source as the old AVIF did, at 922 KB against 932 KB.
- Scripts. `main.ts` runs setup in the old order and owns the one requestAnimationFrame loop. The top level await on the AVIF probe now also waits for `document.fonts.ready`. The old page only reached that point after three.js arrived from jsdelivr, so fonts had almost always loaded first. The bundle gets there sooner, and a reload restore or `#work` landing before fonts would land about 28px off on phones and snap when the text reflowed. The ticks run in the old order, which matters because many read values another wrote earlier in the frame. Shared state that several modules write lives in `state.ts` (TR, HI, pend, S). Expressions were ported verbatim. three 0.170.0 and lenis 1.1.13 come from npm at exact versions instead of jsdelivr.
- CSS. Global, split by section in `src/styles/` and imported in cascade order, with body state classes, focus and reduced motion last in `state.css`. Lightning CSS minification rewrote `translate3d`, `scale3d` and `rotate3d` into 2D forms, so `vite.build.cssMinify` is off and the CSS is inlined as before.
- Flags. `REVIEW=on` defines `__REVIEW__`. ReviewTab renders only then and the `#review` alias swaps `review.ts` (which brings `review.css`) for an empty module, so the live build has no review markup, script or styles. `BASE` sets Astro's base, used by `bun run review` to republish the review copy under `/a/8t5qjd6kq3na/`.
- Parity harness in `tools/parity/` (see AGENTS.md). The trace check replaces timers, rAF, `performance.now` and `Math.random` with a deterministic shim, so two builds can be compared frame by frame. Three things made it deterministic. Playwright's own clock froze at a slightly different time on each load, so the shim starts at exactly 0. Bundling tree-shakes five unused three.js helper objects whose IDs drew from `Math.random`, so the stream reseeds when the WebGL context is created. IntersectionObserver callbacks, image decodes and CSS transitions run in real time, so the shim queues observer callbacks to the start of each fake frame, waits for decodes, and drives every animation from `document.getAnimations()` on fake time.
- Parity results against the old build (byte identical to next.louis.gg), with the old images swapped in so pixels compare exactly.
  - Trace, 14 scenarios on desktop and phone (load-in, full scroll, every section, nav glides, `#work` link, reload part way down, case open, paging and Back by mouse, touch and keyboard, the phone menu). Eleven match on every sampled frame, and on every screenshot pixel apart from the eyebrow artifact below.
  - The `#work` link on desktop and phone differs only in Lenis state and star speed for its first 1.8s. The old page landed before fonts, then re-landed when they arrived, and Lenis read that jump as scroll velocity. The new build lands once after fonts at the same place.
  - In the keyboard case flow the page hidden behind an open case sits 5px apart until the flight back, because Chrome's scroll anchoring decides differently when `case-lock` changes the page height. Nothing behind an open case is visible, both land on the same row, and only the starfield keeps a small offset afterwards.
  - The Stack and Work eyebrow lines look soft in three harness screenshots. That is a raster artifact of driving a `scale3d(0, 1, 1)` entrance from fake time. Real time screenshots show both builds crisp.
  - Computed styles of every element, `::before` and `::after`, hover and focus, across 34 states at 1440, 1024, 820 and 390 with and without reduced motion are identical (136 comparisons).
  - Recordings with blip scoring of load-in, reload, `#work`, nav, case open, paging and Back on desktop and phone show the same peaks at the same sizes. The live site adds a white first frame while it loads over the network, and both builds pop the first hero texture in headless software WebGL.
  - No sideways scroll on phones, no console errors or failed requests, the case is flush to the right edge with classic scrollbars, and the keyboard flows match (tab order, focus rings, skip link, Enter, focus trap, arrows, Escape and focus return).
  - Frame timing at device scale 2 (headless Chrome, 60Hz, three alternating runs) is no worse. Missed frames for the new build against the old are scroll 22.9 against 24.9 percent, nav 24.0 against 26.0, case 15.3 against 15.5, phone menu 12.8 against 17.8 and phone case 8.5 against 8.7.
- Not changed in this stage. Dead CSS from earlier rounds (`#jump`, `.serif`, and the `spin` and `flick` keyframes) and the unused `TR.black` path are kept for parity, ready for the performance stage.

## Deploys from GitHub Actions (2026-10-21)
- The branch is now `next` (renamed from `louis/portfolio-space`) and the worktree moves to `~/Worktrees/louisgon/louisgon.github.io/next`. Stage work goes on short branches merged into `next`, and only on Louis's word, because every push to `next` deploys.
- `.github/workflows/deploy-next.yml` installs with the frozen lockfile, then runs `bun run check`, `bun run build` and the parity `output` check before `wrangler deploy`. It needs the `CLOUDFLARE_API_TOKEN` repository secret, and the account ID is in `wrangler.jsonc`. `bun run deploy` stays as a local fallback.
