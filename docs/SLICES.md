# Vertical Slice Log

Each entry: what we shipped, what we learned, what got deferred.

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

## Backlog (next slices, smallest first)

### Slice 1 — Hello Godot
**Goal:** Empty Godot 4 C# project that opens to a scene showing the text "FlappyBird" on a colored background.
**Done when:** `project.godot` opens cleanly in Godot 4, the scene runs locally on Windows, one trivial unit test passes.
**Why first:** proves the toolchain is installed and the test runner works. No game logic.

### Slice 2 — Local CI
**Goal:** GitHub Actions workflow that, on every push, runs the unit tests and a headless gameplay test that opens Slice 1's scene and screenshots it.
**Done when:** A PR shows a green check and the screenshot is attached as an artifact (or posted to the PR).
**Why second:** proves the agent loop's *feedback channel* before we add any gameplay.

### Slice 3 — Android build artifact
**Goal:** CI produces a downloadable `.aab` (unsigned debug) on every push to main.
**Done when:** The artifact downloads, installs on a real Android device via ADB-over-WiFi or sideload, and launches to Slice 1's scene.
**Why third:** proves the mobile path before any gameplay. We will *not* publish yet.

### Slice 4 — Bird falls
**Goal:** A bird (placeholder cube model) falls under gravity. No input yet.
**Done when:** Headless test confirms y-position decreases over time. Screenshot attached.

### Slice 5 — Tap to flap
**Goal:** Tap/click applies upward impulse to the bird.
**Done when:** Headless test simulates a tap and asserts upward velocity. Screenshot attached.

### Slice 6 — One pipe
**Goal:** A single pipe pair scrolls left. Bird can pass through the gap. Collision ends the game.
**Done when:** Headless test plays a scripted sequence that passes the pipe; another scripted sequence collides and triggers game-over state.

### Slice 7 — Score
**Goal:** Passing a pipe increments score, displayed on screen.
**Done when:** Headless test passes a pipe and asserts score = 1.

### Slice 8 — Endless pipes
**Goal:** Pipes spawn continuously with varying gap heights.

### Slice 9 — Three models, real art
**Goal:** Replace placeholder geometry with the three AI-generated models. Aesthetic must match `docs/AESTHETIC.md`.

### Slice 10 — Audio
**Goal:** Flap sound, score sound, hit sound.

### Slice 11 — Title screen and game-over screen
**Goal:** Tap-to-start, game-over with high score, tap-to-restart.

### Slice 12 — Push notification to phone
**Goal:** CI sends a notification to Matthew's phone (ntfy.sh or Pushover) with PR link and gameplay GIF on every successful build.

### Slice 13 — Play Store Internal Testing
**Goal:** Signed `.aab` uploaded to Internal Testing track via CI on every push to main.
**Prereq:** Matthew creates Google Play developer account ($25 one-time).

---

## Shipped

### Slice 2 — Local CI
**Goal:** GitHub Actions workflow that, on every push, runs the unit tests and a headless gameplay test that opens Slice 1's scene and screenshots it.
**Done when:** A PR shows a green check and the screenshot is attached as an artifact (or posted to the PR).
**Shipped:** 2026-05-13, branch `feat/slice-2-local-ci`, PR #2 (stacked on PR #1)
**What's in it:**
- `.github/workflows/ci.yml` with two jobs:
  - `test`: `dotnet test` on ubuntu-latest, 7/7 passing.
  - `screenshot`: installs Godot 4.6.2 mono on ubuntu-latest, imports the project, builds C#, runs `Main.tscn` under `xvfb` with `--rendering-driver vulkan`, captures the viewport, uploads PNG as `gameplay-screenshot` artifact.
- `src/FlappyBird.Core/CliArgs.cs` — pure C# parser for `--capture-screenshot <path>`. 5 unit tests.
- `scripts/Main.cs` — attached to `Main.tscn`. On `_ready`, checks `OS.GetCmdlineUserArgs()` via `CliArgs.GetScreenshotPath`; if present, waits two frames, calls `GetViewport().GetTexture().GetImage().SavePng(path)`, quits. Dev runs without the flag are unaffected.
- `docs/screenshots/slice-1-main-scene.png` — Windows local verification capture.
- `docs/screenshots/ci-slice-2-main-scene.png` — captured by ubuntu CI for visual comparison.

**Verified:**
- CI: both jobs green on first run (`gh run watch 25843465994`). Unit tests 25s, screenshot 54s.
- Artifact downloads and renders correctly — visually identical to the Windows local capture.

**Learned:**
- `--headless` skips rendering entirely. CI needs a real display: `xvfb-run -a -s "-screen 0 1080x1920x24"` plus `mesa-vulkan-drivers` + `libvulkan1` plus `--rendering-driver vulkan`. Software Vulkan works fine on the GitHub-hosted runner.
- User-args after `--` reach the running scene via `OS.GetCmdlineUserArgs()` in C#. Two `ProcessFrame` waits is enough for the scene to fully draw before capture; no need for `RenderingServer.FramePostDraw`.
- GitHub deprecation warnings on `actions/checkout@v4`, `actions/setup-dotnet@v4`, `actions/upload-artifact@v4` (Node.js 20 -> 24 forced June 2026). Not blocking now. Will revisit when updated major versions ship.
- Stacked PRs work: this PR targets `feat/slice-1-hello-godot`. When PR #1 merges to `main`, GitHub auto-retargets PR #2 to `main` and the diff stays clean.

**Deferred:**
- Inline screenshot embedding in PR comments. Artifact URLs require auth, so we can't `![](url)` directly. Options for later: commit to an orphan `screenshots` branch, upload to a gist, or push to ntfy.sh as part of Slice 12 (phone notifications).
- Sticky PR comment posting (e.g. `marocchino/sticky-pull-request-comment`). Deferred until inline embedding is solved.
- Branch protection rules requiring the `test` and `screenshot` checks before merge. Will enable after we confirm CI stays reliable across the next slice or two.
- Solution-wide `dotnet test` invocation. Currently scoped to the test project. Fine for now.

---

### Slice 1 — Hello Godot
**Goal:** Empty Godot 4 C# project that opens to a scene showing the text "FlappyBird" on a colored background.
**Done when:** `project.godot` opens cleanly in Godot 4, the scene runs locally on Windows, one trivial unit test passes.
**Shipped:** 2026-05-13, branch `feat/slice-1-hello-godot`
**What's in it:**
- Godot 4.6.2 (Mono) project at repo root: `project.godot`, `icon.svg`, `scenes/Main.tscn` (blue background + centered "FlappyBird" label).
- Three-project .NET solution (`FlappyBird.slnx`):
  - `FlappyBird.csproj` — Godot.NET.Sdk 4.6.2, net8.0. Glob-excludes `src/**` and `tests/**` so it doesn't try to compile sibling projects.
  - `src/FlappyBird.Core/FlappyBird.Core.csproj` — pure C# library. `GameInfo` constants live here.
  - `tests/FlappyBird.Tests/FlappyBird.Tests.csproj` — xUnit. Two passing tests against `GameInfo`.
- Verified: `dotnet test` → 2/2 pass. `dotnet build FlappyBird.csproj` → green. Godot `--import` → DONE. Godot scene boots with Vulkan, exits clean.

**Learned:**
- Godot.NET.Sdk auto-globs `**/*.cs` under the project dir — must exclude sibling projects with `<Compile Remove>` + `<DefaultItemExcludes>`. Otherwise duplicate AssemblyInfo + missing-reference errors.
- `--headless` mode skips rendering entirely, so `--screenshot` produces no file. Real screenshot capture needs a non-headless run plus a script that grabs the viewport. Deferred to Slice 2 (CI).
- winget's GodotEngine.GodotEngine.Mono v4.6.2 portable install fails with `copy_file: Access is denied` on the directory-shaped zip (winget bug v1.28.240). Workaround: copy from winget's temp extract dir to `%USERPROFILE%\Godot` and add to PATH manually.
- .NET 10 SDK creates `.slnx` (new XML solution format) by default instead of `.sln`. Modern tooling handles both.

**Deferred:**
- Screenshot capture in scene (moved to Slice 2 with CI).
- Godot scripts attached to `Main` scene (no game logic yet — slice 1 is text only).
- Solution-wide `dotnet test` (currently scoped to the test project; works fine for now).
