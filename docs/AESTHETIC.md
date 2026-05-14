# Aesthetic direction

## What this doc is

This is not a mood board and Matthew is not an art director. This is a
**prompt library** — the prompts and parameters we use to generate the
game's assets, plus the consistency primitives (locked model, reusable
house style block, palette, and an image-reference chain) that keep
new assets visually coherent with old ones.

The doc exists because the only thing we can really control with image
generation is the prompt and the params. We can't art-direct the model
turn by turn; we can only commit to a recipe and iterate the recipe.

Every time we generate an asset we love, we save the prompt, the params,
and the output filename. From then on, new asset requests include the
approved asset's PNG as a reference image so the model maintains style.
That is how cohesion happens here — not from human taste, from
disciplined reuse of the recipe and a chain of style references.

## Working aesthetic direction

The dream end state (see `docs/DREAM.md`) is 1880s NYC. So the working
aesthetic hypothesis for Flappy Bird is:

> Late-19th-century European poster art — Mucha, Chéret,
> Toulouse-Lautrec. Bold black linework, flat color blocks, slight paper
> grain. Decorative but legible at small sizes on a phone. Warm period
> palette: cream, oxblood, olive, ivory, ink-black. Lively, not stuffy.

The gameplay is cartoony Flappy Bird; the *visual layer* is period
illustration applied to that cartoon shape.

This is the *current* hypothesis. The bird experiment (first
prompt-library entry below) proves or redirects it. Goal at this
stage is "recognizably consistent," not "beautiful."

## Tool

**OpenAI `gpt-image-1`** via the OpenAI Images API.

Why this choice (and why not the previously-named Google
`gemini-2.5-flash-image`):
- **First-class transparent backgrounds.** `gpt-image-1` accepts
  `background: "transparent"` and returns a real alpha channel. Gemini
  treats transparency as prompt-driven, which means an unreliable
  alpha-cut post-processing step on every asset. The OpenAI native
  alpha removes a whole class of failure modes for sprite work.
- **Image-reference inputs are first-class** via the `/v1/images/edits`
  endpoint. After the bird is approved, every later asset request
  passes the bird PNG as a reference image. This is the closest analog
  to Midjourney's `--sref` and is the load-bearing primitive for
  cohesion across our three sprites and beyond.
- The Gemini free tier turned out unusable for us in practice — a real
  429 from the live `gemini-2.5-flash-image` endpoint on a single
  generation call, even though Google AI Studio's docs advertise a
  generous free tier. We're done planning around a free tier we can't
  actually use.
- No SDK — plain `fetch` against the documented HTTP API.

Tradeoffs accepted:
- Paid. Roughly **$0.011 / low**, **$0.042 / medium**, **$0.167 / high**
  per 1024×1024 image (April 2026 pricing). A full slice with three
  bird variants at medium plus one iteration round is on the order of
  ~$0.75. Cheap enough that we stop optimizing and generate.
- Output is 1024×1024 (model default for square). Phaser scales down to
  display size. We trust the bilinear filter at this scale.
- The OpenAI Images API schema (endpoint, field names, response shape)
  evolves and `gpt-image-1` is currently marked deprecated in OpenAI's
  own model catalog (still serving). The agent should verify against
  https://developers.openai.com/api/docs/guides/image-generation
  before the first generation call of any new slice.

Get the API key: https://platform.openai.com/api-keys

Recraft remains the named Rung-4 successor candidate (one scripted
house, dozens of assets) when first-class style sets and
consistency-at-scale start mattering more than per-image cost.
Alternatives to weigh then:
- Recraft — API plus first-class style sets
- Midjourney via Chrome MCP — best `--sref`, no public API, manual loop
- FLUX via Replicate — cheapest API option, supports LoRAs for
  per-character identity

## API key storage

For local agent runs (Claude Code on Matthew's desktop): the agent
reads the key from `$env:OPENAI_API_KEY`. Set it once as a User-scope
environment variable so child processes — including Claude Code's
tool shells — inherit it:

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "<key from platform.openai.com/api-keys>", "User")
```

Restart any running Claude Code session after setting it. Environment
variables are inherited at process start, so existing sessions won't
see the new value.

Do NOT use the PowerShell profile (`$PROFILE`) for this. Profile
scripts only run for interactive sessions, not for subprocess tool
shells, so the agent wouldn't see the var.

The key never gets committed. `.gitignore` already excludes `.env*`
files; do not introduce one for this.

For GitHub-side generation (Copilot cloud agents now, automated
Actions workflows later), the key is also stored as repo secrets:

- **Copilot Agents secret** — repo Settings → Secrets and variables
  → **Agents** → New repository secret. Required for the Copilot
  cloud agent to see it (the Agents bucket is separate from Actions
  and was added in May 2026). As of that release `gh secret set`
  does NOT support `--app agents`, so use the web UI.
- **Actions secret** — `gh secret set OPENAI_API_KEY` from desktop,
  or repo Settings → Secrets and variables → Actions. Accessed in
  workflows as `${{ secrets.OPENAI_API_KEY }}`. Required for any
  PR-comment-triggered regen workflow we add later.

Both repo secrets and the local User env var hold the same value
(the same key string from platform.openai.com). Rotate together if/when
needed.

## Consistency engine

We lock everything we can in the request itself:

- **Model.** `gpt-image-1`. Don't switch mid-slice. A new model is a
  new prompt-library experiment.
- **House style block.** Prepended verbatim to every prompt. Always.
- **Palette.** Hex codes repeated in every prompt.
- **Negative phrases block.** Appended verbatim to every prompt.
- **Image reference (our `--sref` equivalent).** Once the bird is
  approved, every subsequent asset request includes the bird PNG as a
  reference input. This is the primary cohesion mechanism for assets
  beyond the first.
- **Output size.** 1024×1024 (model default).

### House style block

Prepend this paragraph verbatim before any subject-specific instructions:

```
Style: a late-19th-century French lithograph poster, in the manner of
Alphonse Mucha and Jules Chéret. Bold black linework, flat color fill,
subtle cream paper grain texture. Warm period palette: cream
background (#f1e7d0), oxblood red (#8b2a2a), olive green (#6b7a3a),
ivory (#f7eedf), ink-black outline (#1a1614). Decorative but the
silhouette reads clearly at small size on a phone screen.
```

### Negative phrases block

Append this clause verbatim at the end of every prompt:

```
Single subject only, isolated on a transparent background, no text, no
watermark, no signature, no busy background, no photorealism, no 3D
rendering, no modern visual style.
```

(Transparency is enforced by the `background: "transparent"` request
parameter; the negative clause is belt-and-braces.)

## Request shape

The agent calls the OpenAI Images API directly via `fetch`. Schema
below is current as of 2026-05; agent must verify against the live
docs at https://developers.openai.com/api/docs/guides/image-generation
before each slice's first call.

### First asset (no reference yet — the bird)

```jsonc
// POST https://api.openai.com/v1/images/generations
// Headers:
//   Authorization: Bearer $OPENAI_API_KEY
//   Content-Type:  application/json
{
  "model": "gpt-image-1",
  "prompt": "<house style block> <subject prompt v1> <negative phrases block>",
  "size": "1024x1024",
  "quality": "medium",
  "background": "transparent",
  "output_format": "png",
  "n": 1
}
```

The response contains a base64-encoded PNG inside `data[0].b64_json`.
Decode and save. (`gpt-image-1` always returns base64 — there is no
URL-mode for this model.)

### Subsequent assets (using the approved bird as a style reference)

Switch to the `/v1/images/edits` endpoint and pass the approved bird
PNG as the `image[]` part. The request is `multipart/form-data`:

```
POST https://api.openai.com/v1/images/edits
Headers:
  Authorization: Bearer $OPENAI_API_KEY
  Content-Type:  multipart/form-data; boundary=...

Fields:
  model           = gpt-image-1
  image[]         = @public/assets/bird.png    (style/composition reference)
  prompt          = Match the visual style of the reference image
                    exactly: same linework weight, same paper grain,
                    same palette, same level of stylization.
                    <house style block> <subject prompt> <negative phrases block>
  size            = 1024x1024
  quality         = medium
  background      = transparent
  output_format   = png
  n               = 1
```

The reference image is the entire cohesion mechanism for assets 2+.
Don't skip it. (`/v1/images/edits` originally meant "inpaint with a
mask," but with no `mask` field and `gpt-image-1`, the model treats
`image[]` as a style/composition reference for a brand-new generation.)

### Generating variants

To get three variants, call the same request three times (with the
same prompt; the model samples differently each call). Save the
results as `<asset>-v1-a.png`, `-b.png`, `-c.png` under
`public/assets/`.

### Transparent background

`gpt-image-1` with `background: "transparent"` returns a real alpha
channel. No chroma-key post-processing, no `sharp`, no ImageMagick.

If a returned PNG still has a solid background, the most likely cause
is the `model` field accidentally being something other than
`gpt-image-1` (older models don't support `background: "transparent"`).
Fix the request, not the image.

## Prompt library

Each entry follows the same shape so we can compare across runs.

### 1. Bird (Slice 7 — first asset)

**Status:** approved (`v1-b`).

**Target:** transparent PNG of the player bird, side profile, wings
mid-flap. Source 1024×1024; Phaser scales to ~96 px display.

**Subject prompt v1 (the one that worked):**

```
A small plump cartoon bird, shown in side profile, wings spread
mid-flap, facing right. Round body, oversized head, small open beak,
visible eye. Body in oxblood red with a darker chest stripe and ivory
wing-tips. Heavy black outline. Reads as a friendly, lively character.
```

**Full prompt sent:** house style block + subject prompt v1 + negative
phrases block (840 chars total).

**Params on the approved run:**
- Endpoint: `POST /v1/images/generations`
- Model: `gpt-image-1`
- Size: 1024×1024
- Quality: `medium`
- Background: `transparent`
- Output: `png`
- n: 1 per call, called three times for variants

**Iteration log:**
- v1 — three medium-quality variants generated; `v1-b` chosen
  (two-tone oxblood back + cream belly with olive-yellow accents
  on wings and chest; reads most "period-illustrated" of the three,
  uses three of the four house palette colors). `v1-a` and `v1-c`
  rejected and removed in the rename commit.

**Output:** `public/assets/bird.png` (chosen). Reused as the style
reference for every later asset in this slice via
`/v1/images/edits`.

**Known v1 quirk to consider for future assets:** the model rendered
a faint secondary "sticker edge" around each bird outline, likely
from the negatives block phrase "isolated on a transparent
background." If it shows up on the pipe or prop and reads as
noise at display size, suppress with an explicit "no sticker
border, no die-cut edge, no double outline" addition to the
negatives block.

### 2. Pipe (Slice 7)

**Status:** approved (`v1-c`).

**Target:** tall vertical obstacle, transparent PNG. Generate at
1024×1024; Phaser scales / crops to the in-game aspect. We trust
the bird's chosen variant as the style reference via
`/v1/images/edits` instead of hand-tuning the prompt.

**Subject prompt v1 (the one that worked):**

```
A tall vertical green obstacle column with a flared decorative cap at
one end, like the trunk of a stylized tree or a Belle-Epoque pillar.
Olive green body with ivory highlights and an oxblood-red detail band
where the cap flares. Heavy black outline. The column should tile
cleanly when stacked vertically.
```

**Full request:** `/v1/images/edits` with `public/assets/bird.png`
passed as the `image[]` reference, plus the "match the visual style
of the reference image exactly" preamble. Same model / size / quality
/ background / output as the bird.

**Iteration log:**
- v1 — three medium-quality variants generated; `v1-c` chosen (tall
  flared cap with oxblood neck band, no pedestal base; the only one
  of the three that's tile-friendly for off-screen-bottom extension).
  `v1-a` and `v1-b` had decorative pedestals — read fine as ornaments
  but break the "infinite stem" illusion the game needs.

**Output:** `public/assets/pipe.png` (chosen). Lesson for future
asset prompts: when an asset has gameplay-driven tiling requirements,
state them in the subject prompt explicitly, not just in the doc
prose around it.

**Cohesion check:** the bird-as-reference mechanism held. All three
pipe variants kept the bird's olive-yellow body, oxblood accent,
ivory highlights, heavy black outline, and paper grain without
explicit per-asset re-statement of the palette. The faint "sticker
edge" artifact from the bird also did not propagate strongly to the
pipe — encouraging signal that we don't need to suppress it in the
negatives block yet.

### 3. Background prop — cloud (Slice 7)

**Status:** prompt drafted, awaiting generation.

**Target:** repeating background element. Picked cloud over building
or tree because clouds are the classic Flappy parallax element, the
shape reads instantly at small size, and a cloud locks the world tone
less aggressively than a building or tree would — leaving room for
ground props at later rungs.

**Subject prompt v1:**

```
A single decorative cloud rendered as a Belle-Epoque lithograph:
rounded puffy silhouette with a flat ivory fill and a subtle
olive-green shadow gradient on the underside. Heavy black outline
curving in soft ornamental arcs. Reads instantly as a cloud at small
size on a phone. Horizontally elongated so it tiles and parallax-
scrolls cleanly across the sky.
```

**Full request:** `/v1/images/edits` with `public/assets/bird.png`
passed as the `image[]` reference.

**Iteration log:**
- v1 — drafted, not yet run.

**Output (planned):** `public/assets/cloud.png` after variant
selection.

## How to add a new asset (procedure)

When a new sprite or scene is needed:

1. Open this doc, find the closest existing entry.
2. Copy its subject prompt as the starting point.
3. Modify the *subject* phrase only. Keep the house style block, the
   palette references, the negative phrases block, and the image
   reference (when applicable) exactly as written.
4. Construct the request body (see Request shape above). If any
   approved asset exists, include the most representative one as a
   reference image part.
5. Send three calls; save as `<asset>-v1-a.png` through `-c.png` under
   `public/assets/`.
6. Open a draft PR with the three variants committed. Matthew picks
   one from his phone via the PR diff.
7. On approval, rename the chosen file to `<asset>.png`, delete the
   rejects in the same commit, wire it into the Phaser scene, ship
   the PR.
8. Update the entry in this doc with the prompt that worked and a
   note on what was tried before it.
9. If the subject prompt drifted from the house style block (you had
   to override something to make the asset work), that's a signal
   the house style block itself needs an update. Edit it here — so
   the change is durable for the next asset, not buried in one
   prompt.

## Sprite specs

- Source generation resolution: 1024×1024 transparent PNG.
- Canvas reference resolution in-game: 540 × 960 (portrait, 9:16).
  Bird displays at roughly 48 × 48 px; pipes at ~96 px wide;
  background props at ~120 px wide.
- Phaser scales the 1024-source PNGs down to display size. We trust
  Phaser's bilinear filter at this scale.
- Transparent PNG, alpha channel preserved.

## Reference images

We don't keep a mood board here. The approved bird PNG functions as
our durable style reference for everything that comes after — it
lives at `public/assets/bird.png` and gets fed back into every later
request. If a *specific external* image is load-bearing for some
prompt (a one-off reference we want to literally cite), save it to
`docs/aesthetic-refs/` and link from the relevant prompt entry above.
Otherwise, links to "vibe inspiration" belong in someone's head, not
this file.
