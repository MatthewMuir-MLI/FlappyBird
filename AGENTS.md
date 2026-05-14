# AGENTS.md

You are an AI coding agent (Claude Code, GitHub Copilot Coding Agent, or similar). This file tells you how to work in this repo. Matthew Muir is the **game director** — he reviews and merges; he does not type gameplay code.

## Read first
1. [CLAUDE.md](CLAUDE.md) — project standards (vertical slices, TDD, branches, what "done" means). Authoritative.
2. The issue you've been assigned.
3. [ADR-001](https://github.com/MatthewMuir-MLI/FlappyBird/issues/21) if you wonder why this is Phaser+web and not Godot+Android.

## Stack
- Phaser 4 + TypeScript (strict). Vite. Vitest. Playwright. Biome. GitHub Pages.
- Node 22 LTS in CI; any recent Node locally is fine.
- `src/core/` is pure logic with no Phaser imports — unit-testable with Vitest.
- `src/scenes/` is the Phaser side. Each scene wires Core state to the rendered canvas.
- **CI runs unit tests only.** Playwright e2e runs locally (`npm run test:e2e`); agents must run it before pushing a slice PR.

## How tasks flow
- **Backlog lives in GitHub Issues.** Issues labeled `slice` are the queue. Pick the oldest open issue assigned to you, or the one explicitly named in your prompt.
- **Slice issues** carry a goal and acceptance criteria. If they're unclear, comment on the issue asking for clarification *before* writing code. Playbook: § How to ship a slice.
- **Bug issues** describe a reproduction. Write a failing test that captures the bug, then fix it.
- **`regen-asset` issues** request fresh AI-generated art variants. They are NOT slices — slice rules (TDD, vertical slice, Phaser scene changes) do not apply. Playbook: § Asset regeneration.

## How to ship a slice (the loop)
1. Branch from `main`. Name: `feat/slice-N-short-name`, `fix/short-name`, or `chore/short-name`.
2. **Write a failing test first.** Unit logic -> `tests/unit/*.test.ts` (Vitest). Anything that involves the rendered scene -> `tests/e2e/*.spec.ts` (Playwright).
3. Implement the smallest change that makes the test pass. Pure logic in `src/core/`, rendering / input wiring in `src/scenes/`.
4. Run locally before pushing — all three must pass:
   - `npm run lint` (Biome)
   - `npm run test` (Vitest)
   - `npm run test:e2e` (Playwright — builds, previews on port 4173). CI does not run e2e; this local pass is the only enforcement.
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/). Example: `feat(slice-4): bird falls under gravity`.
6. Open a **draft PR** targeting `main`. Use the PR template. Link the issue with `Closes #N`.
7. Wait for CI. If red, fix and push again — do not mark ready while red.
8. When CI is green, mark the PR **Ready for review** and request review from `@MatthewMuir-MLI`.
9. **Do not merge your own PR.** Matthew merges from his phone.

## Asset regeneration

This section applies ONLY to issues labeled `regen-asset` (or created via
the **Regenerate art asset** issue template). Slice rules do not apply:
no TDD, no vertical slice, no Phaser scene changes, no new tests.

### What a regen is and is not

A regen is a deterministic file swap. The Phaser scene already loads
`public/assets/<asset>.png` by a stable texture key (`bird`, `pipe`,
`cloud`, …). Replacing the PNG behind that key is the entire change —
the scene picks up the new pixels on next preload, with no code changes
required.

A regen IS:
- Editing `scripts/prompts/<asset>-<version>.txt` (creating it if new).
- Running `scripts/generate-sprite.mjs` to produce three variant PNGs.
- Opening a draft PR with the three variants.
- After the variant pick lands as a PR comment, renaming the chosen
  variant to `<asset>.png`, deleting the rejects, updating the prompt
  library entry, marking the PR ready.

A regen IS NOT:
- A TypeScript change.
- A test change.
- A Phaser scene change.
- A docs change outside `docs/AESTHETIC.md`.
- A dependency change.

If you find yourself wanting to touch any "is not" file, stop and
comment on the issue. The work has expanded past a regen and probably
needs a slice issue.

### Files you may modify

- `scripts/prompts/<asset>-<version>.txt` (the subject prompt for this round)
- `public/assets/<asset>-<version>-{a,b,c}.png` (the generated variants)
- `public/assets/<asset>.png` (only at the post-pick rename step)
- `docs/AESTHETIC.md` (prompt-library iteration log)

Any other file: out of scope.

### Step-by-step

1. **Read the issue template fields.** The structured form gives you
   asset, version label, "what to change," whether to use bird.png as a
   reference, quality, and notes. Read `docs/AESTHETIC.md` § Prompt
   library entry for that asset for prior-round context (what was
   tried, what was rejected, what shipped).

2. **Verify the secret is available.** The agent runtime needs
   `OPENAI_API_KEY` from the repo's Agents secret bucket. If it's not
   set, comment on the issue asking Matthew to configure it (Settings
   → Secrets and variables → **Agents**) and stop.

3. **Branch from `main`.** Name: `regen/<asset>-<version>` (e.g.
   `regen/pipe-v2`). Never operate on an existing slice branch.

4. **Update the subject prompt.** Edit `scripts/prompts/<asset>-<version>.txt`
   to reflect the "What to change" field from the issue. If the field
   is blank, copy the prior version's prompt verbatim (sampling alone
   produces different variants).

5. **Run the generation script.** Use the values from the issue:
   ```
   node scripts/generate-sprite.mjs \
     --asset <asset> \
     --version <version> \
     --count 3 \
     --quality <quality> \
     [--ref public/assets/bird.png]   # include when "Use bird as ref" = yes
   ```
   The script writes `public/assets/<asset>-<version>-{a,b,c}.png`.

6. **Sanity-check the outputs before pushing.** Each PNG should be
   roughly 1–3 MB. A file under 100 KB is almost always an API error
   serialized as a tiny payload — DO NOT commit it. Re-run, or comment
   and stop if the failure is reproducible.

7. **Commit + push the variants.** Commit message:
   `feat(regen): <asset> <version> — three variants`. Include the
   short cost estimate in the body so Matthew sees it on phone.

8. **Open a draft PR** targeting `main`. Title: `chore(regen): <asset>
   <version>`. Body must render all three variants inline using raw
   GitHub URLs so the PR diff is the picker on phone:
   ```markdown
   | `a` | `b` | `c` |
   |---|---|---|
   | ![<asset>-<version>-a](../raw/regen/<asset>-<version>/public/assets/<asset>-<version>-a.png) | ... | ... |
   ```
   Link the issue with `Closes #N` and post the cost estimate.

9. **Wait for the pick.** Matthew comments with a one-line letter:
   `pipe: b`, `cloud: c`, etc. That's not a typo — that's the
   selection. The letter maps to the variant filename.

10. **Apply the pick:**
    - `git mv public/assets/<asset>-<version>-<letter>.png public/assets/<asset>.png`
    - `git rm` the other two variant files.
    - Edit `docs/AESTHETIC.md` § Prompt library entry for this asset:
      set status to approved, add the version's iteration-log entry
      (chosen variant + brief reason + rejection reasons for the
      others, mirroring the existing entries for bird/pipe/cloud).
    - Commit: `chore(regen): apply <asset> <version>-<letter> pick`.

11. **Mark the PR ready for review.** Matthew merges from phone. The
    Pages auto-deploy makes the new asset live within ~30 seconds. Do
    not self-merge.

### Cost discipline

`gpt-image-1` charges ~$0.011 / low, ~$0.042 / medium, ~$0.167 / high
per 1024×1024 image (April 2026 pricing). Three medium variants per
round ≈ $0.13. If a single issue ends up needing more than three regen
rounds, comment on the issue and ask Matthew whether to keep iterating
or pause — don't silently run up the bill.

### When something goes wrong

- **Generation fails with a billing error** → comment on the issue,
  link to https://platform.openai.com/settings/organization/limits,
  stop. Do not retry.
- **All three variants come back visually broken** (text artifacts,
  wrong subject, off-style) → edit the prompt fragments
  (`scripts/prompts/<asset>-<version>.txt`, `scripts/prompts/negatives.txt`,
  or `scripts/prompts/house-style.txt`) in the same branch and rerun
  before opening the PR. Don't ask Matthew to pick from three
  obviously-bad options.
- **Reference image (`bird.png`) doesn't exist yet** → if this is the
  bird's own regen, drop the `--ref` flag. Otherwise comment and stop;
  cohesion requires a reference and that order matters.

## Standards you cannot violate
- **TDD**: no gameplay code without a failing test first.
- **Vertical slices**: one PR ships a working thin path. Never split a feature across PRs by layer.
- **No emoji in code or commits.**
- **No "AI generated" footers.**
- **No self-merge.**
- **No force-pushing to `main`. Never.**
- **No `git push --force` to a shared branch without explicit instruction.**
- **No new dependencies without justification in the PR description.** Three lines of code beats a NuGet/npm package.
- **`src/core/` must not import `phaser`.** That's the rule that makes the unit tests possible.

## Iteration on feedback
- If Matthew comments on a PR, treat each comment as work to address in a new commit on the same branch.
- Do not resolve conversations — let Matthew resolve them when he's satisfied.
- If a comment changes the scope, ask whether to update the linked issue's acceptance criteria before implementing.

## When you get stuck
- If you can't reproduce a bug, write a test that *should* fail and surface what you found in a PR comment instead of pushing a guess.
- If a slice is too big, comment on the issue proposing how to split it. Wait for Matthew's call.
- If CI is failing for an environmental reason (not your code), say so explicitly — don't keep pushing.

## Tool-specific notes

### Claude Code — default agent
Runs on Matthew's Windows desktop. Matthew often drives it remotely from his phone via the Claude Code mobile app. Default agent for slice work on this project because it uses Opus 4.7 and produces noticeably stronger results than the Sonnet-class model behind GitHub Copilot Coding Agent.

If you are Claude Code working on a slice:
- Use Plan Mode (`Shift+Tab Shift+Tab`) before writing code on any non-trivial slice. Grill the plan with Matthew (or yourself, if running unattended) before exiting Plan Mode.
- Verify locally before pushing: `npm run lint && npm run test && npm run test:e2e`. CI is the second line of defense, not the first.

### GitHub Copilot Coding Agent — fallback
Works from issues assigned to `@copilot`. Runs in GitHub's cloud, fully async. Use it when Matthew specifically assigns an issue to `@copilot`, or for low-risk routine work where speed/asynchrony matters more than quality.

If you are Copilot working on a slice:
- Open a draft PR early so feedback can arrive while you iterate.
- When a reviewer (Matthew) leaves a comment, address every point in a new commit before re-requesting review.
- If the underlying repo state surprises you (e.g. expected files missing), comment on the PR and stop — don't push speculative fixes.

## What this repo is NOT
See the "What we are explicitly NOT doing (yet)" section in [CLAUDE.md](CLAUDE.md). Do not add ads, analytics, multiplayer, accounts, IAP, native mobile builds, or anything speculative. If you think the project needs one of those, file an issue — don't build it.
