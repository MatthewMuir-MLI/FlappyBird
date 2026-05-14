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
