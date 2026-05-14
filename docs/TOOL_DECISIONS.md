# Tool decisions

A running record of which third-party tool we picked for each need, why,
and what's still open. New agents picking up rung work should check
here before reaching for any external API or service.

## Policy

**Pick the option that makes things easier — for the AI doing the work
and for the human reviewing on phone.** That's the same reason we
picked Phaser 4, Vite, and TypeScript: not because they're objectively
best, but because they're the most legible stack for an agent to work
in.

For backend services (auth, storage, image gen, voice, music), Google
is often the easier pick — generous free tiers, every user already has
a Google account, one billing relationship. So **Google is the default
when it makes things easier; named exceptions otherwise.** Don't treat
this as a hard rule — quality gaps justify exceptions (see below).

When picking a tool for new work:

1. Check this doc for an existing decision. If one exists, use it.
2. If no decision exists, evaluate the Google option first when one
   exists. Pick it unless there's a specific named reason not to.
3. If picking non-Google, add a row in "What's currently picked" or
   "Exceptions" below with the reason.
4. Don't pre-decide tools for future rungs. Decide when load-bearing.

## What's currently picked

| Need | Pick | Why | Where decided |
|---|---|---|---|
| Game engine | Phaser 4 | AI-friendly: 2D, TypeScript, MIT, ubiquitous docs | `CLAUDE.md` |
| Build | Vite | Fast, simple, default for modern TS web | `CLAUDE.md` |
| Lint / format | Biome | One binary for both, no plugin sprawl | `CLAUDE.md` |
| Hosting | GitHub Pages | Already wired; deploys on merge to `main` | `CLAUDE.md` |
| Unit tests | Vitest | Same authoring story as Vite | `CLAUDE.md` |
| E2E tests (local only) | Playwright | Real Chromium in headless mode | `CLAUDE.md` |
| LLM agent (build / review) | Anthropic Claude (via Claude Code) | The project IS the agentic Claude demo | `AGENTS.md` |
| Image generation | OpenAI `gpt-image-1` | First-class transparent backgrounds (no chroma-key step), first-class image-reference inputs via `/v1/images/edits`. Google's `gemini-2.5-flash-image` "free tier" actually 429'd on us — we're done planning around a free tier we can't use. | `docs/AESTHETIC.md` |
| Image cohesion strategy (Rung 1) | Single-anchor reference chain (bird → pipe + prop with bird as ref) | Simple; works for three sprites | `docs/AESTHETIC.md` |
| Payments | Stripe | No real Google alternative for our use case | Rung 6 issue |

## Exceptions to the Google-leaning default

Each row is a deliberate non-Google pick. Don't revisit without reading
the reason.

| Need | Pick | Why not Google |
|---|---|---|
| LLM agent (build / review) | Anthropic Claude | The project itself is the agentic Claude demo. Swapping to Gemini would muddy that story. |
| Image generation | OpenAI `gpt-image-1` | Native transparent alpha removes a whole class of failure modes for sprite work; image-reference via `/v1/images/edits`. Gemini's advertised free tier 429'd on a single live call — not a tier we can plan around. Recraft remains the named Rung-4 successor when style-set consistency-at-scale beats per-image cost. |
| LLM proxy (planned, Rung 3) | Cloudflare Workers | Better edge latency for a global mobile audience; simpler dev loop than Cloud Run. |
| Voice + SFX (planned, Slice 8) | 11 Labs | Quality gap vs. Google Chirp at the time of writing. |
| Music (planned, Slice 8) | Suno (+ Stable Audio for loops) | Quality gap vs. Google Lyria 2. |
| Payments | Stripe | Google doesn't ship a comparable payments product. |

## Open / pending decisions

Decide when the rung that needs the decision starts, not before.

| Rung | Decision | Notes |
|---|---|---|
| Rung 2 | Do users even need to sign in? | Anonymous-only (localStorage only, no cross-device save) vs. anonymous + optional Google sign-in vs. required login. Lean toward anonymous + optional Google sign-in: zero friction, but unlocks the cross-device demo for users who want it. |
| Rung 2 | Auth + DB: Firebase Auth + Firestore vs. Supabase | Rung 2 issue currently names Supabase. Firebase is the "easier" pick if we go Google-leaning — most users already have Google accounts, one less identity to manage. Lean Firebase; confirm before Rung 2 work starts. |
| Rung 3 | LLM model for in-game dialogue: keep Anthropic Haiku (currently in issue) or swap to Gemini 2.5 Flash | Defer until Rung 2 ships. Don't worry about it now — early prototype phase, cost is negligible either way. |
| Rung 4+ | Image reference chain strategy: single-anchor → per-class (one canonical reference per asset category) | Adopt at Rung 4 when there are multiple asset categories. |
| Rung 4+ | Per-character identity via Nano Banana image-to-image (the `--cref` equivalent) | Plan only. |
| Rung 4+ | Style drift detection: periodically regenerate an old asset against the current style chain, diff for drift | Future slice. |
| Generally | Automate generation from a PR comment trigger (move API keys from local PowerShell env → GitHub Actions secret) | Worth doing when manual triggering gets annoying. Likely Slice 8 (audio key faces the same situation) or Rung 2. |

## Why each subscription Matthew already has does or doesn't apply

Captured because future-Matthew or a future agent will ask. Verified
against current vendor docs as of 2026-05.

| Subscription | Image gen API? | Text LLM API? | Notes |
|---|---|---|---|
| Claude Pro/Max | No (Anthropic doesn't generate images) | No (Claude Code uses its own Anthropic billing; sub doesn't unlock API credits) | The sub powers Claude Code's interactive use |
| Google AI Pro | No (in-app only; API is separate) | No (in-app only; API is separate) | The advertised AI Studio free tier (~500 images/day Nano Banana) **429'd on a single live call** when we tried to use it for Slice 7. Lesson: verify free-tier claims against the live API before planning around them — vendor docs are aspirational, error responses are real. |
| ChatGPT Plus | No (Plus is in-app only; OpenAI API is separately billed) | No (same) | API is billed separately. Slice 7 uses `gpt-image-1` directly against the OpenAI API with `OPENAI_API_KEY`, paid per-image — the Plus sub doesn't reduce that cost or unlock API credits. |
| OpenCode Go | No (coding-model relay only) | Yes for build agents (Chinese open-source models) | Not used in this project; coding agent is Claude Code |

The pattern: **consumer subscriptions usually don't unlock API access,
and free tiers can be aspirational.** Free API tiers exist separately,
and where they exist their real-world reliability is often worse than
the docs imply. Verify before recommending paid services and before
betting a slice on a "free" tier.
