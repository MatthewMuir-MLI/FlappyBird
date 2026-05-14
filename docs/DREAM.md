# Dream: Gilded Age

This document captures the end-state game this project is climbing toward,
and the seven-rung ladder of intermediate projects that gets us there.

Flappy Bird is rung one. Each subsequent rung is a separately shippable
mini-project that introduces exactly one new component of the Gilded Age
tech stack. By the time we reach the top, the dream game's hard parts
are individually validated.

## The game

**Gilded Age** is an observational simulation set in 1880s New York City.
The player does not "play" a character — they watch one. The closest
references are *The Sims* (life simulation), the show *The Gilded Age*
(period setting, social drama), and Wallpaper Engine or a desktop aquarium
(ambient, watchable, low-input).

The world is populated by LLM-driven NPCs with character sheets, daily
routines, and lives that unfold whether or not anyone is watching. The
player interacts by injecting *thoughts* into specific characters — short
text prompts that pass through a guardrail filter, enter the character's
thought queue, and may or may not be acted on depending on the character's
state and disposition.

The first deployment is one prominent household on one street: a single
family, their servants, their daily rhythm. We expand outward — a neighbor,
a corner store, a street — only after the single-house experience is
genuinely watchable.

Monetization is patronage, not microtransactions. The store page sells
one-of-a-kind handcrafted items — a tailored suit, a specific carriage,
a particular oil painting — each minted into the world with provenance
text, a named maker, and an ownership ledger. Items can be destroyed,
sold, or gifted in-world; their history follows them. There is no premium
currency, no loot box, no advertising.

## Design philosophy

**The magic is in the activity, not the substance.** A still painting of
a Gilded Age drawing room is fine on its own; what makes it feel like
Hogwarts is the maid walking through with a tray, the dog scratching at
the door, the curtains swaying. The art budget goes into small motion
loops and ambient activity, not flawless static beauty.

**Vibe is the product.** This is something a player leaves running while
they work or scroll. Quiet music, period detail, lives slowly unfolding.
We win or lose on atmosphere, not mechanics.

**One house before a city.** Small scope is the only way the project
stays falsifiable. With one house we can ask "is this fun to watch?" and
get an answer. With a whole city, the city itself does the work of being
interesting and we can't tell if the simulation is good or just busy.

**Patronage, not extraction.** The "buy a handcrafted item with provenance"
model fits people who want to support the work and own something specific
to the world they're watching. It does not work by manufacturing FOMO,
gating gameplay, or selling currency. Items take time to enter the world
because, in the fiction, they are being made.

**The platform is the open web.** No app stores, no native builds, no
backend the player has to trust with their identity beyond Google sign-in.
The game lives at a URL. The "install" is "Add to Home Screen."

## Architecture

End-state tech stack, the place we are climbing toward.

### Frontend
- Phaser 4 (TypeScript) for the game canvas.
- Vite for build.
- Multi-page site on GitHub Pages: `/play/`, `/store/`, `/blog/`, `/lore/`,
  each its own folder, each its own `index.html`. The store page is a
  Stripe Checkout button list, not a Phaser game; the blog is rendered
  Markdown.
- PWA manifest + service worker for Add-to-Home-Screen and offline-capable
  play.

### Backend
- Cloudflare Workers + Durable Objects. One Durable Object per active
  world; the DO owns world state, runs the simulation tick loop, and
  proxies all LLM calls so API keys never reach the client.
- The game page opens a websocket to its DO for live state updates.

### Persistent data
- Supabase Postgres for items, characters, ownership chains, and history
  logs. Postgres beats Firestore here because the data is heavily
  relational (item ↔ owner ↔ maker ↔ provenance events).
- Supabase Auth for Google sign-in plus anonymous accounts. Anonymous is
  the default; players can link a Google identity later to sync across
  devices.

### LLM
- Anthropic Haiku for per-NPC deliberation (cheap, fast).
- Anthropic Sonnet for *director* moments — single LLM calls that
  choreograph multi-character scenes (feuds, parties, conversations).
- Prompt caching on stable character sheets cuts input cost roughly 10x.
- All calls flow through the Worker. Keys never client-side.

### Payments
- Stripe Checkout for one-time item commissions. The Stripe webhook hits
  a Worker route, which queues a work order. An agent drafts the item
  card and provenance text. Matthew approves on phone. The Worker mints
  the item into the world.

### Art production
- gpt-image-1 with reference images for character and environment sprites.
- Skeletal 2D animation (Spine, DragonBones, or Phaser atlases) for
  reusable character motion.
- `tools/gen-art.ts` orchestrates generation.
- `docs/AESTHETIC.md` and a single reference image act as the style
  anchors.

### Audio production
- Suno for short ambient music loops.
- Stable Audio for sound effects.
- `tools/gen-audio.ts` orchestrates.

### Asset approval
- Agent opens a GitHub Issue or PR with generated variants attached.
- Matthew reviews on phone, comments "second one" or "redo with X."
- Agent commits the chosen asset, archives the rest.

### Build, deploy, and review
- GitHub Actions: lint + unit tests on every PR; build + Pages deploy on
  merge to `main`. Playwright runs locally only.
- Cloudflare Worker deployed separately via Wrangler from a CI step.
- Backlog source of truth: GitHub Issues, labeled by rung (`rung-1`,
  `rung-2`, ...) on top of the existing `slice`, `tech-debt`, `adr`
  labels.
- Matthew merges every PR. Agents never self-merge.

## The ladder

Seven rungs. Each rung is a shippable, standalone mini-project that adds
exactly one new piece of the stack, so we discover problems on small
scopes before they compound.

### Rung 1 — Flappy Bird *(current)*

Establishes the workflow: Phaser, Vite, TypeScript, TDD with Vitest +
Playwright, GitHub Actions, Pages deploy, agentic slice-based PRs,
phone-based review. No LLM, no backend, no persistence beyond
`localStorage`. The point is the workflow, not the game.

Open Flappy Bird slices: scoring (Slice 5), real sprites (Slice 7), audio
(Slice 8), title + game-over UI (Slice 9). Slice 7 is the highest leverage
of these for Gilded Age purposes, because it is the first real exercise
of the art pipeline.

### Rung 2 — A cloud-save game

A small game — likely a Tamagotchi-shaped pet, or a daily-puzzle high-score
game — that introduces:

- Supabase Auth (anonymous + Google sign-in).
- Supabase Postgres for per-user save data.
- A read/write pattern beyond `localStorage`.

No LLM yet. The point is that "the player has an identity, the server
remembers them" becomes a solved problem in our codebase before we layer
anything dynamic on top.

### Rung 3 — One LLM NPC in a room

A single-screen game with one talking character. Introduces:

- Cloudflare Workers as the LLM proxy.
- Anthropic Haiku for the dialogue.
- Prompt caching on the character's persona.
- An input guardrail that filters player-typed prompts before they reach
  the LLM.

The point is the LLM round-trip. How long does it take? How reliable is
the persona under stress? What does the guardrail need to catch? Costs
measured in dollars, not hundreds.

### Rung 4 — One house, no LLM

The Gilded Age petri dish, scripted. One house, four to six rooms, five
to eight characters, all running hand-authored daily routines and a small
set of scripted dramatic events. Rigged 2D animations for walk cycles and
common actions. Three or four ambient music loops by time of day.

The art pipeline gets its first real workout: a coherent visual world,
not just three sprites.

The point is the watchability question. Before we spend tokens animating
deliberation, we find out whether observational simulation is itself fun.
If the answer is no, this rung saves us from building the rest of the
dream on top of an empty assumption.

### Rung 5 — One house, one LLM character

Same house as Rung 4. Replace one character's scripted routine with the
deliberation loop from the Stanford "Generative Agents" pattern: thought
queue, periodic reflection, action selection. Introduce the *director*
pattern for any multi-character moment — one LLM call that choreographs
the scene and hands each agent its beats, rather than N agents arguing
for N turns.

The point is to feel whether LLM-driven life is meaningfully better than
a scripted routine, and to validate the cost model under realistic
gameplay.

### Rung 6 — Provenance items + Stripe

A small store page wired to Stripe Checkout, a webhook handler on the
Cloudflare Worker, and a `provenance` table in Postgres that records
every item's maker, owner history, and lore. The minting flow runs
end-to-end: someone buys, the agent drafts the item card, Matthew
approves, the item enters the world.

The point is the work-order pipeline. How quickly can we turn a purchase
into a unique, lore-coherent item? Is the approval bottleneck Matthew?
Can an agent draft well enough to make this 90% automated?

### Rung 7 — Expand outward

The house gets a neighbor. The neighbor gets a street. The asset pipeline
produces a new building or NPC at predictable cadence. This is Gilded Age
proper, growing organically from a working core.

By this rung the dream game is no longer a dream — it's an additive
sequence of "another house, another character, another item."

## What we are NOT doing

Mirroring the CLAUDE.md style: anything not on the current rung gets filed
and deferred.

- No native mobile builds. Web only, with PWA Add-to-Home-Screen as the
  install affordance.
- No ads. No in-game currency. No loot boxes. No microtransactions in
  the conventional sense — only one-time Stripe purchases of unique
  items with provenance.
- No public real-time multiplayer at MMO scale unless a rung later than
  seven is opened. The Durable Object architecture allows small shared
  worlds (handfuls of viewers per world), not a global lobby.
- No backend the player has to trust with credentials beyond Supabase
  Auth's Google sign-in.
- No third-party analytics. No tracking.
- No localization beyond English.
- Anything else a future rung wants gets filed as a GitHub Issue.
  Speculative architecture is the project's most expensive failure mode.

## Notes on the path from here

Flappy Bird is the workflow proof. The remaining Flappy Bird slices
(scoring, sprites, audio, title/game-over UI) are not just "finish the
game" — they each prove out one workflow component:

- Slice 5 (scoring) exercises `localStorage` persistence — the warmup
  before Rung 2's Supabase.
- Slice 7 (real sprites) is the first real exercise of the art pipeline:
  `tools/gen-art.ts`, `docs/AESTHETIC.md` filled in, GitHub-issue approval
  workflow. This is the highest-leverage remaining Flappy Bird slice for
  Gilded Age purposes.
- Slice 8 (audio) introduces Suno + Stable Audio in `tools/gen-audio.ts`.
- Slice 9 (title + game-over UI) closes the gameplay loop and earns Rung
  1 the "shipped" stamp.

After Slice 9, Flappy Bird is done and Rung 2 begins.
