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

**Google `gemini-2.5-flash-image`** (informally "Nano Banana") via the
Gemini API.

Why this choice:
- Free tier covers our usage at this scale (~500 images/day on the
  Google AI Studio free tier, no credit card). Three sprites × three
  variants × maybe two iteration rounds ≈ 18 images per slice. We're
  effectively unlimited.
- **Image-reference inputs are first-class.** After the bird is
  approved, every later asset request includes the bird PNG as a
  reference image. This is the closest analog to Midjourney's `--sref`
  we can get on a free API, and it is the load-bearing primitive for
  cohesion across our three sprites and beyond.
- Same HTTP-call shape we'd use for any image API. No SDK required.

Tradeoffs accepted:
- Transparent backgrounds are prompt-based, not a first-class request
  parameter. Usually works; may occasionally need an alpha-cut
  post-processing step (one ImageMagick call or a `sharp` invocation).
- Output is 1024×1024 (model default). Phaser scales down to display
  size. We trust the bilinear filter at this scale.
- The Gemini image API schema (exact endpoint, field names, response
  shape) evolves. The agent should verify against
  https://ai.google.dev/gemini-api/docs/image-generation before the
  first generation call of any new slice.

Get the API key (free): https://aistudio.google.com/apikey

Reconsider this pick at Rung 4 (one scripted house, dozens of assets)
when consistency-at-scale and per-character identity start mattering
more than cost. Alternatives to weigh then:
- Midjourney via Chrome MCP — best `--sref`, no public API, manual loop
- Recraft — API plus first-class style sets
- OpenAI gpt-image-1 — cleaner transparent backgrounds, paid (no
  free tier, ~$0.17 per high-quality 1024×1024)
- FLUX via Replicate — cheapest API option, supports LoRAs for
  per-character identity

## API key storage

For local agent runs (Claude Code on Matthew's desktop): the agent
reads the key from `$env:GEMINI_API_KEY`. Set it once as a User-scope
environment variable so child processes — including Claude Code's
tool shells — inherit it:

```powershell
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "<key from aistudio.google.com/apikey>", "User")
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
- **Actions secret** — `gh secret set GEMINI_API_KEY` from desktop,
  or repo Settings → Secrets and variables → Actions. Accessed in
  workflows as `${{ secrets.GEMINI_API_KEY }}`. Required for any
  PR-comment-triggered regen workflow we add later.

Both repo secrets and the local User env var hold the same value
(the same key string from AI Studio). Rotate together if/when needed.

## Consistency engine

We lock everything we can in the request itself:

- **Model.** `gemini-2.5-flash-image`. Don't switch mid-slice. A new
  model is a new prompt-library experiment.
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
Single subject only, output as a PNG with a fully transparent
background (no solid color behind the subject), no text, no
watermark, no signature, no busy background, no photorealism, no 3D
rendering, no modern visual style.
```

## Request shape

The agent calls the Gemini image API directly. Schema below is current
as of 2026-05; agent must verify against the live docs before each
slice's first call.

### First asset (no reference yet — the bird)

```jsonc
// POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
// Header: x-goog-api-key: $GEMINI_API_KEY
{
  "contents": [
    {
      "parts": [
        { "text": "<house style block> <subject prompt v1> <negative phrases block>" }
      ]
    }
  ]
}
```

The response contains a base64-encoded PNG inside
`candidates[0].content.parts[*].inline_data.data`. Decode and save.

### Subsequent assets (using the approved bird as a style reference)

```jsonc
{
  "contents": [
    {
      "parts": [
        { "inline_data": { "mime_type": "image/png", "data": "<base64 of public/assets/bird.png>" } },
        { "text": "Match the visual style of the reference image exactly: same linework weight, same paper grain, same palette, same level of stylization. <house style block> <subject prompt> <negative phrases block>" }
      ]
    }
  ]
}
```

The reference image is the entire cohesion mechanism for assets 2+.
Don't skip it.

### Generating variants

To get three variants, call the same request three times. Save the
results as `<asset>-v1-a.png`, `-b.png`, `-c.png` under
`public/assets/`.

### Transparent background fallback

If a returned PNG has a near-cream-not-actually-transparent background,
post-process with one of:
- `magick convert in.png -fuzz 5% -transparent "#f1e7d0" out.png`
- A `sharp` call that thresholds the alpha channel.

Don't ship an asset with a solid background. If post-processing keeps
failing on a given prompt, adjust the negative phrases block in this
doc (don't override per-prompt) so the change is durable.

## Prompt library

Each entry follows the same shape so we can compare across runs.

### 1. Bird (Slice 7 — first asset)

**Status:** prompt drafted, not yet generated.

**Target:** transparent PNG of the player bird, side profile, wings
mid-flap. Source 1024×1024; Phaser scales to ~96 px display.

**Subject prompt v1:**

```
A small plump cartoon bird, shown in side profile, wings spread
mid-flap, facing right. Round body, oversized head, small open beak,
visible eye. Body in oxblood red with a darker chest stripe and ivory
wing-tips. Heavy black outline. Reads as a friendly, lively character.
```

**Full prompt sent:** house style block + subject prompt v1 + negative
phrases block.

**Iteration log:**
- v1 — drafted, not yet run.

**Params recorded on first successful run:**
- Output files: TBD (`bird-v1-a.png`, `-b`, `-c`)
- Chosen variant: TBD
- Final filename: `public/assets/bird.png`
- Status: drafted / generated / approved / rejected

### 2. Pipe (Slice 7)

**Status:** awaits bird approval so it can be generated with the bird
PNG as a reference image.

**Target:** tall vertical obstacle, transparent PNG. Generate at
1024×1024 and either crop / tile to the in-game aspect, or generate
two sprites (pipe-body + pipe-cap) and tile vertically in Phaser.

**Subject prompt v0 (refine after bird ships):**

```
A tall vertical green obstacle column with a flared decorative cap at
one end, like the trunk of a stylized tree or a Belle-Époque pillar.
Olive green body with ivory highlights. Heavy black outline.
```

### 3. Background prop (Slice 7)

**Status:** awaits bird approval.

**Target:** repeating background element. Candidates: a stylized period
building silhouette, a Belle-Époque-style cloud, a tree.

**Subject prompt v0:**

_TBD after bird ships and the world tone is clearer._

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
