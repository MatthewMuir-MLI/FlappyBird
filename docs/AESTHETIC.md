# Aesthetic direction

## What this doc is

This is not a mood board and Matthew is not an art director. This is a
**prompt library** — the prompts and parameters we use to generate the
game's assets, plus the consistency primitives (style references, locked
model versions, locked palettes) that keep new assets visually coherent
with old ones.

The doc exists because the only thing we can really control with image
generation is the prompt and the params. We can't art-direct the model
turn by turn; we can only commit to a recipe and iterate the recipe.

Every time we generate an asset we love, we save the prompt, the params,
the seed, and the output URL. From then on, new assets cite the saved
output as a style reference. That is how cohesion happens here — not
from human taste, from disciplined reuse of the seed crystal.

## Working aesthetic direction

The dream end state (see `docs/DREAM.md`) is 1880s NYC. So the working
aesthetic hypothesis for Flappy Bird is:

> Late-19th-century European poster art — Mucha, Chéret,
> Toulouse-Lautrec. Bold black linework, flat color blocks, slight paper
> grain. Decorative but legible at small sizes on a phone. Warm period
> palette: cream, oxblood, olive, ivory, ink-black. Lively, not stuffy.

The gameplay is cartoony Flappy Bird; the *visual layer* is period
illustration applied to that cartoon shape. Two tensions to manage:

1. Period-faithful lithographs are visually busy; mobile gameplay needs
   readable silhouettes at 48–96 px. Style favors silhouette clarity
   over period accuracy when they conflict.
2. The bird, the pipe, and the background prop need to feel like they
   came out of the same poster. That's what the style reference is for.

This direction is the *current* hypothesis. The bird experiment
(first prompt-library entry below) is what proves or redirects it.

## The consistency engine

Image generators are non-deterministic. To fight that we lock as much as
we can:

- **Model + version.** Pin a specific model version (e.g. `--v 7`), never
  use "latest." Re-running an old prompt on a new model version is a new
  experiment.
- **Style reference (`--sref`).** Once an asset is approved, its URL
  becomes the house style reference. Every later prompt ends with
  `--sref <house-style-url>`. This is the single highest-leverage knob.
- **Palette.** Hex codes are repeated in every prompt's color instructions
  so the model is reminded.
- **Aspect ratio + format.** Locked per asset class (sprites are square;
  backgrounds are 9:16).
- **Seed.** Stored alongside the prompt for re-rolls; not strictly
  deterministic on MJ but reduces variance.
- **Negative phrases.** A reusable list of "not this" terms (e.g.
  "no text, no watermark, no busy background").

## Tool (decision pending)

Working assumption: **Midjourney v7**.

Why: it's the only major generator with first-class `--sref` (style
reference) and `--cref` (character reference) primitives, which is the
load-bearing feature for cohesion across assets. DALL-E, Imagen, and
SDXL/FLUX do not have a real equivalent at the time of writing.

Caveat: Midjourney has no official public API. The workflow is "prompt
in MJ web or Discord, download the PNG, commit it to `public/assets/`."
That's fine through Rung 4. We revisit the tooling decision when we
need programmatic batch generation (likely Rung 5 or later).

Alternatives if MJ becomes a problem:
- **Recraft** — API, has style sets, free tier
- **Ideogram** — API
- **FLUX via Replicate** — API, supports LoRA-trained style models
- **OpenAI gpt-image-1** — API, weaker on cohesion

## The house style reference

_Empty until the first asset (the bird) is approved._

When approved:
- URL: `<MJ image URL>`
- Asset: `public/assets/<filename>.png`
- Local mirror: `docs/aesthetic-refs/sref-house.png`
- Use in every subsequent prompt as `--sref <URL>`.

## Prompt library

Each entry follows the same shape so we can compare across runs.

### 1. Bird (Slice 7 — first asset)

**Status:** prompt drafted, not yet generated.

**Target:** ~96 × 96 transparent PNG of the player bird, side profile,
wings mid-flap, readable at 48 px in-game.

**Prompt v1:**

```
A small plump cartoon bird, side profile, wings spread mid-flap. Style:
late-19th-century French lithograph poster, in the manner of Alphonse
Mucha and Jules Chéret — bold black linework, flat color fill, subtle
cream paper grain. Warm period palette: oxblood red body (#8b2a2a),
olive green accents (#6b7a3a), ivory wing-tips (#f1e7d0), ink-black
outline (#1a1614). Decorative but reads clearly at small size on a phone.
Single character, transparent background. No text, no watermark, no
busy background.
--ar 1:1 --style raw --v 7
```

**Params to record after generation:**
- Model + version: `--v 7`
- Seed: TBD
- Output URL: TBD
- Output file: `public/assets/bird.png`
- Status: drafted / approved / rejected

**Notes / iteration log:**
- v1 — drafted, not yet run.

### 2. Pipe (Slice 7)

**Status:** awaiting bird approval (so we have a `--sref` to cite).

**Target:** ~96 px wide × full-height transparent PNG of an obstacle
pipe, period-poster style.

**Prompt v0 (sketch — refine after bird ships):**

```
A tall vertical green obstacle column with a flared cap at one end,
in the same Mucha/Chéret late-19th-century lithograph style as the
bird — bold black linework, flat color fill, subtle paper grain. Olive
green body, ivory highlights, ink-black outline. Reads clearly at
small size on a phone. Single object, transparent background. No text,
no watermark.
--ar 1:3 --style raw --v 7 --sref <house-style-url>
```

### 3. Background prop (Slice 7)

**Status:** awaiting bird approval.

**Target:** ~120 px wide transparent PNG of a repeating background
element. Candidate: a stylized period building silhouette or a
Belle-Époque-style cloud.

**Prompt v0:**

_TBD after bird ships and the world tone is clearer._

## How to add a new asset (procedure)

When a new sprite or scene is needed:

1. Open this doc, find the closest existing entry.
2. Copy its prompt as the starting point.
3. Modify the *subject* phrase only — keep the style phrases, palette,
   negative phrases, and `--sref` line untouched.
4. Generate. Re-roll up to ~4 times if needed.
5. If nothing reads, the *style* line probably needs a tweak — adjust
   in this doc, not just in your prompt, so the change is durable.
6. When approved, commit the PNG to `public/assets/`, fill in the
   "Params to record" block above, mark Status: approved.
7. If this is the new highest-quality reference for its class, consider
   promoting its URL to the house style reference.

## Sprite specs

- Canvas reference resolution: 540 × 960 (portrait, 9:16). Bird is roughly
  48 × 48 px at this scale; pipes are ~96 px wide and full-height;
  background props are ~120 px wide.
- Final assets ideally ship at 2× the reference resolution (96 × 96 bird
  etc.) so they look sharp on high-DPI phones.
- Transparent PNG, alpha channel preserved.

## Reference images

We don't keep a mood board here. If a specific external image is
load-bearing for a prompt (something we want to literally cite as a
style reference), save it to `docs/aesthetic-refs/` and link from the
relevant prompt entry above. Otherwise, links to "vibe inspiration"
belong in someone's head, not this file.
