# FlappyBird

Our take on Flappy Bird. Published to Google Play. No ads, no microtransactions. First step into fully agentic game programming.

## Engine and stack
- **Godot 4** with **C# (.NET)**. Picked for text-based scene files (clean diffs), free CI, and Matthew's C# background.
- Target platform: **Android** (Google Play Internal Testing track first).
- 3D scene with **3 models**. AI-generated art, art-directed by Matthew.

## Development model

**Matthew is the game director, not the coder.** Agents implement; Matthew reviews. The goal is a fully autonomous loop where work happens passively while Matthew is on his phone.

### Vertical slices, never horizontal
Every change ships a working, testable thin path through the stack — input → logic → render → test. No feature is split across multiple PRs by layer. If a slice is too big to ship in one PR, cut the slice smaller, not the layers thinner.

### TDD is non-negotiable
- No gameplay code without a failing test first.
- Tests live next to the system they exercise.
- Headless gameplay tests (our "Playwright") drive input, assert state, and capture frames. Frames get attached to the PR.

### Branches and PRs
- `main` is always shippable to Internal Testing.
- Feature branches only: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- Conventional Commits.
- **No agent merges its own PR.** Matthew merges from his phone.
- Every PR must include a captured gameplay GIF or screenshot from the headless test run.

### What "done" means for a slice
1. Failing test written first.
2. Test passes.
3. CI is green: unit tests + headless gameplay tests + Android build.
4. PR description includes a screenshot or GIF of the change running.
5. Matthew merged it.

## Project structure (target)
```
FlappyBird/
  project.godot
  scenes/        # *.tscn — text scene files
  scripts/       # *.cs — game logic
  tests/
    unit/        # GdUnit4-style unit tests
    gameplay/    # headless scripted scenes that act as integration tests
  assets/
    models/      # *.glb (3 of them)
    textures/
    audio/
  docs/
    AESTHETIC.md # Matthew's art direction
    SLICES.md    # log of completed vertical slices, what we learned
  .github/
    workflows/   # CI: test, build, post screenshots
```

## Standards
- No emoji in code or commits.
- No "AI generated" footers.
- C# 12+, file-scoped namespaces.
- One class per file unless trivially related.
- No abstractions until the second use. Three similar lines beat a premature interface.
- Comments only when the *why* is non-obvious.

## What we are explicitly NOT doing (yet)
- No ads, no IAP, no analytics SDK.
- No multiplayer, no leaderboards, no accounts.
- No localization beyond English.
- No iOS build. Android-only for v1.

If a future slice wants any of the above, it gets filed as a GitHub Issue — we don't build it speculatively.

## Build and review loop
1. Matthew picks an open GitHub Issue labeled `slice` and assigns it to an agent (default: `@copilot`; or runs Claude Code locally for harder tasks).
2. Agent branches from `main`, TDD-implements the slice, opens a draft PR linking the issue.
3. GitHub Actions runs unit tests + a headless gameplay test that captures a Main-scene PNG as an artifact.
4. When CI is green, the agent marks the PR ready and requests review from Matthew.
5. Matthew reviews on phone, comments, merges or sends feedback. Agents never self-merge.
6. The merging PR auto-closes the issue (via `Closes #N`) and the agent appends a "Shipped" entry to `docs/SLICES.md` in its final commit.
7. Merged PRs to `main` will (in a later slice) trigger upload to Google Play Internal Testing.

See [AGENTS.md](AGENTS.md) for the full agent-facing playbook.

## Where things live
- This repo: `C:\Users\mmuir\Forever\GitHubF\FlappyBird`
- **Backlog:** GitHub Issues, label `slice`. The next thing to work on is the oldest open `slice` issue.
- **Shipped log:** `docs/SLICES.md` — what we built, learned, deferred.
- **Deferred items / tech debt:** GitHub Issues, label `tech-debt`.
- Project management is NOT in Azure DevOps for this project.
