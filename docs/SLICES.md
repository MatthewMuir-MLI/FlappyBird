# Vertical Slice Log

Each entry: what we shipped, what we learned, what got deferred.

The live backlog is GitHub Issues labeled `slice`. This file is the shipped log.

Slice format:
```
## Slice N — <short name>
**Goal:** one sentence
**Done when:** the verifiable acceptance criteria
**Shipped:** YYYY-MM-DD, PR #N
**Learned:** what surprised us, what we'd do differently
**Deferred:** anything we noticed but consciously did not build
```

---

## Shipped

### Slice 7 — Three sprites, real art
**Goal:** Replace placeholder rectangles with three AI-generated sprites (bird, pipe, background prop) matching the prompt library in `docs/AESTHETIC.md`.
**Shipped:** 2026-05-14, PR #55
**What's in it:**
- `scripts/generate-sprite.mjs` + `scripts/prompts/{house-style,negatives,bird-v1,pipe-v1,cloud-v1}.txt` — small Node script wraps the OpenAI Images API. Plain `fetch`, no SDK, no `sharp`. Two modes: `/v1/images/generations` for the first asset (bird) and `/v1/images/edits` with `image[]=public/assets/bird.png` for cohesion-via-style-reference on the pipe and cloud.
- `public/assets/{bird,pipe,cloud}.png` — three transparent PNGs, 1024×1024 source, native RGBA from `background: "transparent"` on the API. Bird v1-b, pipe v1-c, cloud v1-c selected from three variants each via in-PR preview commenting.
- `src/core/cloudParallax.ts` — pure logic for cloud x/y drift + wrap. No Phaser imports per the `src/core/` rule.
- `tests/unit/cloudParallax.test.ts` — 10 cases covering initial placement, drift, wrap-only-when-fully-off-screen, no-mutation purity.
- `src/scenes/MainScene.ts` — adds `preload()` that loads the three textures via `import.meta.env.BASE_URL` (works in dev and at `/FlappyBird/`). Rectangle bird/pipe become `Phaser.GameObjects.Image` with `setDisplaySize` preserving the existing 48-px bird and pipe-AABB dimensions; top pipe uses `setFlipY(true)` so the cap faces the gap. Three cloud sprites painted before everything else, drifting left at 30 px/s.
- `tests/e2e/main-scene.spec.ts` — new spec asserts `data-sprites-loaded="true"`, `data-cloud-count="3"`, and that the three asset URLs return 200 (catches 404s Phaser would otherwise mask with a fallback texture).
- `docs/AESTHETIC.md` + `docs/TOOL_DECISIONS.md` — rewritten Tool / Request shape / API key storage sections for `gpt-image-1`; prompt-library entries logged with chosen variants and rejection reasons; image-gen pick moved to TOOL_DECISIONS Exceptions table with the 429 evidence on Google's "free" tier so we don't bet on it again.

**Verified:**
- Local: `npm run lint` clean, `npm run build` (tsc + vite) clean, `npm test` 43/43 green, `npm run test:e2e` 5/5 green including the new sprite-presence spec.

**Learned:**
- **The advertised free tier on Gemini 2.5 flash image 429'd on the first real call.** Don't plan around free-tier claims without one cheap live verification call first. `feedback_verify_setup_recipes.md` in memory just earned its keep — same lesson, second sighting.
- **`/v1/images/edits` with `image[]` as a style reference (no mask) is the cohesion mechanism for assets 2+.** All three pipes shared the bird's palette, outline weight, and paper grain without per-asset palette restatement. Worth more than fiddly negative-prompt tuning.
- **Gameplay-driven constraints belong in the subject prompt, not the doc prose around it.** Pipe v1-a and v1-b had decorative pedestals that broke the off-screen-bottom illusion; cloud v1-a had a hollow ivory center that would have shown sky through during parallax. Both would have been one-shotted if "tile cleanly when stacked vertically" and "solid body, opaque fill" had been in the v1 prompt text.
- **`gpt-image-1` with `background: "transparent"` returns real RGBA.** No chroma-key step, no `sharp`, no ImageMagick. Saved a whole class of failure modes the Gemini plan would have eaten.
- **Cost was ~$0.40 for nine medium-quality variants + one low-quality probe.** Well inside the ~$0.75 budget anticipated in issue #28.

**Deferred:**
- Cap-and-stem tile mechanic for the pipe (single texture stretched, so the cap scales with the body; fine at current sizes, regenerate as `pipe-cap.png` + `pipe-body.png` if it starts to read wrong at extreme heights).
- Wing-flap animation — the bird PNG is static; Slice 8 / audio + feel may revisit.
- Sticker-edge artifact suppression in the negatives block — present on the bird, much weaker on pipe/cloud, not pursued.
- Multi-cloud-size variety / sky gradient — current parallax is three identical clouds, intentionally minimal.

---

### Slice 6 — Endless pipes
**Goal:** Pipes spawn continuously with varied gap heights; off-screen pipes are despawned; active pipe count stays bounded.
**Shipped:** 2026-05-14, PR #40
**What's in it:**
- `src/core/pipe.ts` — `Pipe` carries `id`. New `nextGapY(index, min, max)` is a pure deterministic gap-y selector: index 0 returns 240 (the bird's start y — onboarding pipe), index >= 1 uses a non-resonant sine over `[min, max]`.
- `src/core/gameState.ts` — single `pipe` becomes `pipes: Pipe[]`. State adds `pipesSpawned` and `pixelsUntilNextSpawn` to drive cadence. Constants add `pipeSpawnDistance` (280), `canvasWidth/Height`, `pipeWidth/GapHeight`, `pipeGapYMin/Max` (200/760). New `initialGameState(bird)` helper. `step` advances all pipes, decrements the spawn counter, spawns when it hits zero, despawns pipes off the left edge, and checks collision against every active pipe.
- `src/scenes/MainScene.ts` — sprite map keyed by pipe id (not array index) so despawning the front pipe doesn't reassign visuals. Publishes `data-pipe-count` on the canvas.
- `tests/unit/pipe.test.ts` — id-aware spawn/step tests + 3 cases for `nextGapY`.
- `tests/unit/gameState.test.ts` — rewritten for the new shape: initial state, first-tick spawn, multi-pipe spawn over time, off-screen despawn, bounded count over 10s, collision against any pipe, freeze on game-over.
- `tests/e2e/endless-pipes.spec.ts` — polls `data-pipe-count >= 2` within 4s while reactive-flapping.
- `tests/e2e/pipe-collision.spec.ts` — flap-survives spec shortened to `frame > 50` so it doesn't run into the second pipe (whose sine-driven gap would collide with a bird hovering at y=240).

**Verified:**
- CI green on PR #40 (Unit tests 28/28).
- Local: `npm run test:e2e` 5/5; `npm run build` clean.

**Learned:**
- **Sprite-to-state identity matters when arrays shrink from the front.** Tracking pipe sprites by `pipe.id` in a `Map` is cheap and avoids a class of "the wrong sprite moves" bugs that index-based sync would introduce as soon as a pipe despawns.
- **Onboarding bias > rewriting downstream tests.** Special-casing `nextGapY(0)` to the bird's start y kept slice 4's e2e specs alive without modification and produced better gameplay (free first pipe). The flap-stays-alive spec still needed a shorter window because the *second* pipe's sine-driven gap is hostile; that was a single-line fix.
- **Pure spawn-cadence math is testable in milliseconds.** The "active pipe count stays bounded over 10s" unit test runs 600 step iterations and asserts a bound. No e2e equivalent would have been worth its cost.

**Deferred:**
- Difficulty curve / pipe speed-up over time.
- Pipe visual variety — Slice 7 (sprites).
- Scoring on pipe pass — Slice 5.
- Tuning the sine multiplier for "feel" — wait for real gameplay sessions.

---

### Slice 4 — One pipe and collision
**Goal:** One pipe pair scrolls left, the bird collides with it via AABB overlap, and a `data-game-over` attribute on the canvas reflects the state. No visible game-over UI — Slice 9 owns that.
**Shipped:** 2026-05-14, PR #37
**What's in it:**
- `src/core/aabb.ts` — `AABB` type, `aabbsOverlap(a, b)` (inclusive — touching counts), `birdAABB(bird)` helper using `BIRD_SIZE = 48` to match the scene sprite.
- `src/core/pipe.ts` — `Pipe` type as `{ top, bottom }` AABBs framing a gap. `spawnPipe(opts)` constructs a pair from gap center/height and canvas height; `stepPipe(pipe, dt, speed)` translates both AABBs left.
- `src/core/gameState.ts` — orchestrator. `GameState = { bird, pipe, gameOver }`. `step(state, dt, c)` advances bird via existing `birdPhysics.step` and pipe via `stepPipe`, then checks `aabbsOverlap(birdAABB, pipe.top || pipe.bottom)`. Sets `gameOver: true` and freezes on collision.
- `src/scenes/MainScene.ts` — renders the pipe pair as two green rectangles, mirrors them to the AABBs each frame, and publishes `data-game-over` alongside `data-bird-y` / `data-bird-frame`. Flap input no-ops once `gameOver` is set.
- `tests/unit/aabb.test.ts` (5 cases), `tests/unit/pipe.test.ts` (3 cases), `tests/unit/gameState.test.ts` (4 cases) — unit suite grows from 10 to 22 tests.
- `tests/e2e/pipe-collision.spec.ts` — two specs: fall-into-pipe polls `data-game-over` → `"true"` within 3s (and captures `artifacts/pipe-approach.png` at 400ms for the PR); reactive-flap spec sends `Space` only when `y > 260` so timing jitter doesn't push the bird into the top pipe.

**Verified:**
- CI green on PR #37 (Unit tests 22/22 + Headless gameplay screenshot pass).
- `npm run build` clean.

**Learned:**
- **Reactive Playwright control beats fixed-interval flap loops.** A first attempt with `keyboard.press('Space')` every 120ms drove the bird into the top pipe because Playwright's actual press cadence drifts. Reading `data-bird-y` and flapping only when the bird crosses a threshold self-corrects against that jitter.
- **Pipe speed (400 px/s) had to outrun the bird's free-fall window.** With gravity 1500 the bird leaves the canvas in ~1s; pipe at the standard right-edge spawn (x=540) reaches the bird at t≈0.6s only if it moves at 400 px/s or faster. Slice 6 will retune speed + spawn cadence together.
- **Keeping the orchestrator in `src/core/gameState.ts` rather than inlining it into `birdPhysics`** keeps slice 9's upcoming title/game-over state machine a natural extension instead of a refactor.

**Deferred:**
- Multiple pipes — Slice 6.
- Score on pipe pass — Slice 5.
- Restart mechanic + game-over screen + title — Slice 9.
- Death animation / particles.
- Tuning `PIPE_SPEED` for feel rather than testability — wait for Slice 6 so cadence and speed land together.

---

### Slice 3 — Tap to flap
**Goal:** Tapping the canvas (or clicking, or pressing SPACE/Z) applies an upward impulse to the bird on top of the slice-2 falling physics.
**Shipped:** 2026-05-14, PR #32
**What's in it:**
- `src/core/flight.ts` — new pure module. `flap(state)` sets `state.velocity.y = -450` (px/sec, upward in canvas coords). No Phaser imports, fully Vitest-testable.
- `src/scenes/MainScene.ts` — one shared flap action wired to three inputs: `pointerdown`, `keydown-SPACE`, `keydown-Z`. Same code path serves touch, mouse, and keyboard so Playwright can drive flaps either way.
- `tests/unit/flight.test.ts` — 2 Vitest cases (flap sets upward velocity; flap then gravity ticks produces rise-then-fall).
- `tests/e2e/main-scene.spec.ts` — keeps the slice-2 gravity-fall assertion and adds a flap-vs-no-input comparison at equal frame count. Mid-flap screenshot captured.

**Verified:**
- CI green on PR #32 (Unit tests 10/10 + Headless gameplay screenshot pass).
- Matthew merged from phone; live site updated and flap works on iOS Safari and desktop Chromium.

**Learned:**
- **One physics model + flap-as-velocity-mutation** kept the rebase against slice 2 trivial when slice 2 landed first. Avoided introducing a parallel "flap state" path.
- **Unifying pointer + keyboard through one input action** is cleaner than two listeners that both call `flap()`. Same lesson as web HID work — one logical action, many physical bindings.

**Deferred:**
- Feel-tuning the gravity/impulse balance — done together with pipe difficulty in a later slice.
- Wing-flap visual animation — Slice 7 (real sprites).
- Flap sound — Slice 8 (audio).

---

### chore — Phaser 3.90 → 4.1 'Salusa'
**Shipped:** 2026-05-14, PR #35
**What:** Dependency bump only. Zero source code changes — our entire v3 API surface (`new Phaser.Game`, `Phaser.Scene`, `add.rectangle`, `add.text`, `Phaser.Scale.FIT`, `update(time, delta)`, `this.scale.width/height`) is unchanged in v4.
**Why:** The original pivot picked Phaser 3 on a stale assumption that v4 was still pre-release. v4.0 actually shipped in April 2026 and v4.1 followed shortly. Bumping now, while our Phaser surface area is tiny, beat migrating later after sprites/audio/input scope grew.
**Bundle impact:** ~10% larger gzipped (340 KB → 376 KB) from the renderer rewrite. Acceptable for the SpriteGPULayer + unified filter pipeline we'll lean on in Slice 7.

**Verified:** Lint, Vitest 10/10, Playwright pass, build all green locally and in CI. Live site unchanged visually.

---

### Slice 2 — Bird falls
**Goal:** A bird (placeholder geometry) falls under gravity in the Main scene. No input yet.
**Shipped:** 2026-05-14, PR #33
**What's in it:**
- `src/core/birdPhysics.ts` — pure semi-implicit Euler simulation. `step(state, dt, constants)` is the testable contract. No Phaser imports.
- `src/scenes/MainScene.ts` — replaces the slice-1 title text with a 48×48 white square bird starting at (270, 240). Steps the simulation each `update()` and mirrors `position` to the sprite. Publishes `data-bird-y` attribute on the canvas for deterministic Playwright assertions.
- `tests/unit/birdPhysics.test.ts` — 6 Vitest cases (gravity moves y, velocity grows, x untouched, zero-dt no-op, deterministic, accumulation over 60 steps).
- `tests/e2e/main-scene.spec.ts` — reads `data-bird-y` before/after 500ms wait, asserts fall ≥ 50px. Screenshot captured.
- `.gitattributes` — enforce LF EOL on text files so Biome formatting stays stable across Windows/Linux.

**Verified:**
- CI green on PR #33 (Unit tests 8/8 + Headless gameplay screenshot 1/1).
- CI-captured screenshot shows the bird mid-fall in the lower-middle of the canvas, matching local.

**Learned:**
- **Semi-implicit Euler is required for "instantly-responsive" feel.** Explicit Euler doesn't move position on the first step from rest (velocity is 0), which fails both the human intuition and any e2e test that expects the bird to start falling immediately. Switched after the first test attempt failed.
- **`data-bird-y` on the canvas** is a clean pattern for exposing game state to headless tests without leaking via `window`. Set in `_Ready` then on every frame.
- **Biome's default LF EOL** fights Windows CRLF on first commit. `.gitattributes` with `eol=lf` makes this a non-issue forever.

**Deferred:**
- Ground / floor collision — no game-over yet; bird falls off-screen. Picked up in Slice 4.
- Tuning gravity for feel — done together with flap impulse in Slice 3.
- A `Vec2` math library — three-line struct literals are enough for now.

---

### chore — Pivot from Godot+Android to Phaser+web
**Shipped:** 2026-05-14
**ADR:** #21
**What:** Replaced the entire Godot 4 + C# + Android stack with Phaser 3 + TypeScript + Vite + Vitest + Playwright + Biome + GitHub Pages. Deleted all Godot files. Re-wrote `AGENTS.md`, `CLAUDE.md`, `README.md`, the CI workflow, and the slice backlog. Same PR re-implements Slice 1 (Hello Phaser).
**Why:** Three iterations of the Android AAB slice revealed silent Godot 4 validation gates (notably `rendering/textures/vram_compression/import_etc2_astc`) masquerading as the visible "experimental" warning, plus the harder fact that Godot 4 .NET (C#) does not support web export at all — locking us to one platform. Web removes most of the infrastructure tax, costs $0 to host, deploys in ~30s, and lets Matthew play the game on the same device he reviews PRs from.

### Slice 1 — Hello Phaser
**Goal:** Empty Phaser scene shows "FlappyBird" on a blue background; one Vitest test passes; one Playwright test screenshots the scene.
**Done when:** `npm run lint && npm run test && npm run test:e2e` all green locally, CI green on the PR, screenshot artifact attached.
**Shipped:** with the pivot PR, 2026-05-14
**What's in it:**
- `src/main.ts` — Phaser game bootstrap.
- `src/scenes/MainScene.ts` — renders the title text and flips a `data-phaser-ready` attribute on the canvas so Playwright can wait deterministically.
- `src/core/gameInfo.ts` — `GameInfo.Title` and `GameInfo.Version` constants. Pure data, no Phaser imports, so unit tests don't need a browser.
- `tests/unit/gameInfo.test.ts` — Vitest, 2 tests.
- `tests/e2e/main-scene.spec.ts` — Playwright, captures `artifacts/main-scene.png`.

**Learned:**
- Vite's `base` config needs to match the GitHub Pages subpath (`/FlappyBird/`). The Playwright preview server picks up the same base, so the spec navigates to `/FlappyBird/` not `/`.
- `data-phaser-ready` on the canvas beats arbitrary timeouts for waiting in headless tests.

---

## Closed without shipping (Godot era — kept for history)
The Godot+Android-era slice 1 / 2 / 2.5 / 2.5b PRs (#1, #2, #5, #18, #19) merged into `main` and were then entirely replaced by the pivot PR. Their commits remain in git history; their assets (`.tscn`, `.cs`, `.csproj`, etc.) are gone.
