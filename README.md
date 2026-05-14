# FlappyBird

> A Flappy Bird-style web game built almost entirely by AI agents. Matthew Muir is the game director — he reviews and merges; agents do the typing.

**Live:** https://matthewmuir-mli.github.io/FlappyBird/
**Stack:** Phaser 4 · TypeScript (strict) · Vite · Vitest · Playwright · Biome · GitHub Pages
**License:** MIT

---

## Why this repo exists

Two parallel goals:

1. **Ship a fun Flappy Bird clone** that anyone can play in a browser without installing anything.
2. **Learn how to build software with AI agents doing the typing.** Matthew is a senior C# developer who wants to operate as a director, not a coder, for this project. Every workflow choice (vertical slices, TDD, local-only Playwright e2e, the issue/PR templates, AGENTS.md, the "no self-merge" rule) is in service of that goal.

If you're a human dev or an AI agent picking this up: **read [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) before reading any code.** They are short, specific, and authoritative.

---

## Quick start

```bash
npm install
npm run dev         # http://localhost:5173
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright (local-only): builds, previews, drives the canvas
npm run build       # production build into dist/
npm run lint        # Biome lint + format check
npm run format      # Biome auto-format
```

Node 22 LTS or newer. npm 10 or newer.

---

## The agent loop

This is how work gets done:

```
GitHub Issue (label: slice)
       │
       ▼
Matthew assigns the issue:
  - Claude Code (default) — via the Claude Code mobile app, prompts an agent session running on his Windows PC
  - GitHub Copilot Coding Agent (fallback) — by assigning the issue to @copilot in the GitHub UI
       │
       ▼
Agent reads AGENTS.md + CLAUDE.md + the issue
       │
       ▼
Agent branches from main, writes a failing test first,
implements the smallest change to make it pass, runs Playwright e2e locally,
pushes a draft PR
       │
       ▼
CI runs: lint → unit tests. (Playwright e2e is local-only.)
       │
       ▼
Agent waits for green CI, then marks PR Ready for review and tags @MatthewMuir-MLI
       │
       ▼
Matthew reviews on phone. Merges if satisfied or comments for iteration.
Agents NEVER merge their own PR.
       │
       ▼
Merge to main triggers auto-deploy to https://matthewmuir-mli.github.io/FlappyBird/
within ~30 seconds.
       │
       ▼
Matthew opens the URL on his phone to play. No sideload, no install, no Play Store.
```

Picking up a new session? Paste [docs/NEW_SESSION_PROMPT.md](docs/NEW_SESSION_PROMPT.md) into the new session as the first message.

---

## Project structure

```
FlappyBird/
├── index.html                    # Vite entry. Hosts the <div id="game-root">.
├── package.json                  # Scripts + deps.
├── tsconfig.json                 # TS strict; noUncheckedIndexedAccess on.
├── vite.config.ts                # base: '/FlappyBird/' in production for Pages.
├── vitest.config.ts              # tests/unit/**/*.test.ts only.
├── playwright.config.ts          # tests/e2e/**/*.spec.ts; webServer auto-runs preview.
├── biome.json                    # lint + format. LF EOL, single quotes, 2-space indent.
├── .gitattributes                # eol=lf on text files (Windows CRLF defense).
│
├── src/
│   ├── main.ts                   # Phaser bootstrap.
│   ├── core/                     # PURE LOGIC. No `import phaser`. Vitest-testable.
│   │   ├── gameInfo.ts
│   │   └── birdPhysics.ts
│   └── scenes/                   # Phaser scenes. Wire core state to the canvas.
│       └── MainScene.ts
│
├── tests/
│   ├── unit/                     # Vitest. Tests for src/core/. Runs on CI.
│   └── e2e/                      # Playwright. Drives the rendered game. Local-only.
│
├── public/                       # Static assets served as-is (sprites, audio in later slices).
│
├── docs/
│   ├── SLICES.md                 # Shipped log. Authoritative history.
│   ├── AESTHETIC.md              # Matthew's art direction (fill in before Slice 7).
│   └── NEW_SESSION_PROMPT.md     # Paste into a new Claude Code session to bootstrap it.
│
├── .github/
│   ├── workflows/ci.yml          # 3 jobs: test, build-pages, deploy-pages.
│   ├── pull_request_template.md  # Standards checklist auto-applied to new PRs.
│   └── ISSUE_TEMPLATE/
│       ├── slice.yml             # Forms-style intake for slice issues.
│       ├── bug.yml               # Forms-style intake for bug issues.
│       └── config.yml
│
├── CLAUDE.md                     # Standards (TDD, vertical slices, no self-merge). Authoritative.
├── AGENTS.md                     # Agent-facing playbook (Claude Code, Copilot).
└── README.md                     # You are here.
```

---

## Architecture: the Core / Scene split

This is the single most important rule in this codebase.

- **`src/core/`** holds the entire game's simulation. Pure data types and pure functions. **It must not `import phaser`** under any circumstance. This is the layer the unit tests exercise.
- **`src/scenes/`** holds Phaser scenes. Scenes own input wiring, sprite creation, and the per-frame `update()` that calls into Core. Scenes are thin — they mirror Core state to visuals and nothing more.

Why: without this split, every test would need to boot Phaser. With it, gameplay logic is testable in milliseconds with Vitest and we use Playwright only for the integration layer.

Pattern:

```typescript
// src/core/birdPhysics.ts — pure
export function step(state: BirdState, dtSeconds: number, c: PhysicsConstants): BirdState { ... }

// src/scenes/MainScene.ts — wires to Phaser
override update(_time, deltaMs) {
  const dt = deltaMs / 1000;
  this.birdState = step(this.birdState, dt, PHYSICS_CONSTANTS);
  this.birdSprite.setPosition(this.birdState.position.x, this.birdState.position.y);
}
```

---

## Conventions

**Standards** (full list in [CLAUDE.md](CLAUDE.md)):

- **TDD non-negotiable.** Failing test first. Always.
- **Vertical slices, never horizontal.** One PR ships one thin end-to-end path.
- **No self-merge.** Matthew merges from his phone.
- **Playwright e2e runs locally before pushing.** CI does not run e2e.
- **No emoji** in code, commits, or PR titles unless Matthew asks for them.
- **No "AI generated" footers.**
- **No new dependencies** without justification in the PR description.
- **`src/core/` must not import `phaser`.**

**Branch naming:** `feat/slice-N-short-name`, `fix/short-name`, `chore/short-name`, `docs/short-name`.

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/). e.g. `feat(slice-3): tap to flap input`.

**Line endings:** LF everywhere, enforced by `.gitattributes`. Biome will fight CRLF.

---

## Testing strategy

| Layer | Tool | Where it runs | Speed | What it covers |
|---|---|---|---|---|
| Pure logic (`src/core/`) | Vitest | CI + local | <1s for full suite | Physics, scoring, state machines, collision math |
| Rendered game | Playwright (headless Chromium) | **Local only** (`npm run test:e2e`) | ~15s incl. build | Inputs reach scene, scene renders, state attrs publish correctly |

Agents must run `npm run test:e2e` locally before pushing a slice PR. CI does not run e2e — it would push every PR's wall-clock to >1 minute and the value didn't justify the wait. The local pass is the only enforcement.

**Exposing game state to Playwright:** scenes publish key state as `data-*` attributes on the canvas. Example: `MainScene` writes `data-bird-y` every frame. Playwright reads it via `page.locator('canvas').getAttribute('data-bird-y')`. This is the canonical pattern for new headless tests — avoid `window.__game` style leaks.

**Waiting for Phaser to render:** `MainScene.create()` sets `data-phaser-ready="true"` on the canvas. Specs wait on `canvas[data-phaser-ready="true"]` instead of arbitrary timeouts.

---

## CI / Deploy

Workflow file: [.github/workflows/ci.yml](.github/workflows/ci.yml). Three jobs:

| Job | Runs on | Purpose |
|---|---|---|
| `Unit tests` | every push + PR | Biome + Vitest |
| `Build for GitHub Pages` | `main` only, after unit tests pass | `npm run build` into `dist/`, upload Pages artifact |
| `Deploy to GitHub Pages` | `main` only, after build | `actions/deploy-pages@v5` |

Playwright e2e is intentionally not on CI — see Testing Strategy above.

GitHub Pages is configured with `build_type=workflow` (deployed by Actions, not from a `gh-pages` branch). The live URL is https://matthewmuir-mli.github.io/FlappyBird/.

All CI actions are pinned to majors that ship with Node.js 24 (`checkout@v6`, `setup-node@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`) so the workflow stays clean past the Sep 2026 Node 20 removal.

---

## Hard-won lessons (don't repeat these mistakes)

### Platform / engine
- **Godot 4 .NET does NOT export to web.** Only GDScript and GDExtension do. If you ever consider Godot + C# for a project that might ever go to web, decide now or you'll throw away all the C# code later. We did. See [ADR-001](https://github.com/MatthewMuir-MLI/FlappyBird/issues/21).
- **App stores create infrastructure tax** disproportionate to a solo project's value. Web ships faster, costs nothing, and the same phone reviews PRs and plays the game.
- **3D AI art is much less reliable than 2D AI art in 2026.** If you don't strictly need 3D, 2D is the agentic-friendly choice.

### Workflow
- **Stacked PRs are a trap on GitHub.** When PR A merges, PR B (which targeted A's branch) does NOT auto-retarget to `main`. Tapping "Merge" on PR B will merge into A's branch (a feature branch), not into `main`, and your work goes nowhere visible. Either rebase manually after each merge, or just target `main` from the start and accept the messy intermediate diffs.
- **Agents hallucinate PR numbers and premature "Shipped" entries.** Copilot in particular will sometimes write `Shipped: PR #8` when the actual PR is #17 and CI is red. Always verify before merging.
- **AGENTS.md beats CLAUDE.md for cross-tool agent guidance** because more agents look for it. Keep them consistent.

### Physics
- **Semi-implicit Euler** (`v += a*dt; x += v*dt`) beats explicit Euler (`x += v*dt; v += a*dt`) for game physics. Explicit doesn't move position on the first frame from rest, which fails human intuition and breaks any "object starts falling immediately" test.

### Tooling
- **Biome 2.x defaults to LF.** Windows defaults to CRLF. Solve permanently with `.gitattributes`: `* text=auto eol=lf`. Don't fight it per-commit.
- **Vite's `base` config** must match the Pages subpath in production. Use the `({ mode })` callback form: `base: mode === 'production' ? '/FlappyBird/' : '/'`.
- **Playwright's `webServer` ≠ `use.baseURL`.** Set both. The webServer entry tells Playwright how to start the server; `use.baseURL` is what relative `page.goto('/path')` resolves against.

### Godot-specific (only relevant if you go back, but useful to log)
- **`--headless` skips rendering entirely.** Screenshots and any visual validation need `xvfb` + Vulkan software renderer on Linux CI.
- **Godot 4.6 expects `editor_settings-4.6.tres`**, not `-4.tres`. The filename includes the engine major.minor.
- **The "C#/.NET is experimental" warning on Android export is a red herring.** It's always appended to the error string for MODULE_MONO_ENABLED builds, regardless of whether anything's actually wrong. The real blocker is usually `ResourceImporterTextureSettings::should_import_etc2_astc()` returning false, which sets `valid = false` silently. Fix: `rendering/textures/vram_compression/import_etc2_astc=true` in `project.godot`.
- **winget portable installs of Godot 4.6.2 Mono fail** with `copy_file: Access is denied` on the directory-shaped zip (winget v1.28.240 bug). Workaround: copy from `%LOCALAPPDATA%\Temp\WinGet\...\extracted\` to a stable location yourself.

### Agents
- **Claude Code (Opus 4.7) produces noticeably better code than Copilot Coding Agent** for this kind of project. Sonnet-class is fine for routine; Opus-class is the right pick for design decisions.
- **Use the Claude Code mobile app to drive a desktop session** for the truly hands-off experience. Copilot Coding Agent runs in GitHub's cloud and is great for fully async work but harder to redirect mid-stream.

---

## Where to look for…

| Question | File |
|---|---|
| "What are the rules of this project?" | [CLAUDE.md](CLAUDE.md) |
| "How do I work as an agent in this repo?" | [AGENTS.md](AGENTS.md) |
| "What have we shipped?" | [docs/SLICES.md](docs/SLICES.md) |
| "What art are we going for?" | [docs/AESTHETIC.md](docs/AESTHETIC.md) |
| "What should I work on next?" | [Open issues labeled `slice`](https://github.com/MatthewMuir-MLI/FlappyBird/issues?q=is%3Aissue+is%3Aopen+label%3Aslice) |
| "Why is this Phaser+web and not Godot+Android?" | [ADR-001 issue #21](https://github.com/MatthewMuir-MLI/FlappyBird/issues/21) |
| "I'm starting a new Claude Code session, what's the bootstrap?" | [docs/NEW_SESSION_PROMPT.md](docs/NEW_SESSION_PROMPT.md) |

---

## Project status (at the time of writing)

Shipped: pivot + Slice 1 (Hello Phaser) + Slice 2 (Bird falls) + Slice 3 (Tap to flap) + Phaser 4 upgrade.

Backlog: Slices 4–10 are filed as open issues. Slice 4 (One pipe + collision) is next. Slice 7 (Real sprites) is blocked on [docs/AESTHETIC.md](docs/AESTHETIC.md) being filled in.

Tech debt: none currently tracked.
