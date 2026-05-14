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
