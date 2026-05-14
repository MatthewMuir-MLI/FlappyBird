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

(nothing yet)
