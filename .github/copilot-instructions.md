# Copilot Coding Agent — repo entry point

You are GitHub Copilot Coding Agent picking up work in this repo. This file
is what you read first. The full playbook is `AGENTS.md` — every section
referenced below lives there.

## Route by issue label

| Label | What this is | Playbook |
|---|---|---|
| `slice` | A vertical slice of gameplay or infrastructure | `AGENTS.md` § **How to ship a slice** |
| `bug` | A reproduction of a defect | `AGENTS.md` § **How tasks flow** (bugs subsection) |
| `regen-asset` | A request for fresh AI-generated art variants | `AGENTS.md` § **Asset regeneration** |

**Slice rules do NOT apply to `regen-asset` issues.** Regen is a
deterministic file swap — no TDD, no vertical slice, no Phaser scene
changes. Read the asset-regeneration section verbatim and stay in scope.

## Things that hold across every label

- **No self-merge.** Matthew (@MatthewMuir-MLI) merges from his phone.
- **No force-push to `main`.** Ever.
- **No `git push --force` to a shared branch** without explicit instruction
  in the issue or a Matthew comment.
- **No new dependencies** without justification in the PR description.
- **No emoji in code or commits.**
- **No "AI generated" footers.**
- **`src/core/` must not import `phaser`.** That rule makes the unit
  tests possible.

## Reviewer signals to expect

Matthew often comments with terse one-line picks like `pipe: b` or
`cloud: c`. That's a variant selection on a regen PR — it means "rename
`<asset>-<version>-b.png` to `<asset>.png` and delete the other two."
It is not a typo. The exact rename + cleanup procedure is in
`AGENTS.md` § **Asset regeneration**.

If a comment leaves you unsure of intent, ask before pushing speculation.

## Stack quick reference

Phaser 4 + TypeScript (strict) · Vite · Vitest · Playwright · Biome ·
GitHub Pages. Node 22 LTS in CI. CI runs lint + unit tests; Playwright
e2e is local-only. See `CLAUDE.md` for the full conventions.

## When you get stuck

Per `AGENTS.md`: comment on the issue or PR and stop. Don't push
speculative fixes. Don't keep retrying CI in a loop. Don't pretend an
environmental error is your code.
