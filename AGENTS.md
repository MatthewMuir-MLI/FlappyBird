# AGENTS.md

You are an AI coding agent (GitHub Copilot Coding Agent, Claude Code, or similar). This file tells you how to work in this repo. Matthew Muir is the **game director** — he reviews and merges; he does not type gameplay code.

## Read first
1. [CLAUDE.md](CLAUDE.md) — project standards (vertical slices, TDD, branches, what "done" means). Authoritative.
2. [docs/SLICES.md](docs/SLICES.md) — log of shipped slices, lessons learned, deferred items.
3. The issue you've been assigned.

## How tasks flow
- **Backlog lives in GitHub Issues**, not in `SLICES.md`. Issues labeled `slice` are the queue. Pick the oldest open issue assigned to you, or the one explicitly named in your prompt.
- **Slice issues** carry a goal and acceptance criteria. If they're unclear, comment on the issue asking for clarification *before* writing code.
- **Bug issues** describe a reproduction. Write a failing test that captures the bug, then fix it.

## How to ship a slice (the loop)
1. Branch from `main` (or stack on an open dependency PR if explicitly told). Branch name: `feat/slice-N-short-name`, `fix/short-name`, or `chore/short-name`.
2. **Write a failing test first** in `tests/FlappyBird.Tests/`. Pure logic goes in `src/FlappyBird.Core/` so it's testable without booting Godot.
3. Implement the smallest change that makes the test pass.
4. Run locally if you can: `dotnet test` and (when relevant) the Godot scene under `--capture-screenshot`.
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/). Example: `feat(slice-4): bird falls under gravity`.
6. Open a **draft PR** targeting `main`. Use the PR template. Link the issue with `Closes #N`.
7. Wait for CI. If red, fix and push again — do not mark ready while red.
8. When CI is green, mark the PR **Ready for review** and request review from `@MatthewMuir-MLI`.
9. Update `docs/SLICES.md` in a final commit on the same PR, moving the slice into the "Shipped" section with what was learned and what was deferred.
10. **Do not merge your own PR.** Matthew merges from his phone.

## Standards you cannot violate
- **TDD**: no gameplay code without a failing test first. This is non-negotiable per CLAUDE.md.
- **Vertical slices**: one PR ships a working thin path. Never split a feature across PRs by layer.
- **No emoji in code or commits.**
- **No "AI generated" footers.**
- **No self-merge.**
- **No force-pushing to `main`. Never.**
- **No `git push --force` to a shared branch without explicit instruction.**
- **No new dependencies without justification in the PR description.** Three lines of code beats a NuGet package.

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
Runs on Matthew's Windows desktop. Matthew often drives it remotely from his phone via the Claude Code mobile app. It's the **default agent for slice work** on this project because it uses Opus 4.7 and produces noticeably stronger results than the Sonnet-class model behind GitHub Copilot Coding Agent.

If you are Claude Code working on a slice:
- Use Plan Mode (`Shift+Tab Shift+Tab`) before writing code on any non-trivial slice. Grill the plan with Matthew (or yourself, if running unattended) before exiting Plan Mode.
- Verify locally before pushing: `dotnet test` and (when relevant) run the Godot scene under `--capture-screenshot`. CI is the second line of defense, not the first.

### GitHub Copilot Coding Agent — fallback
Works from issues assigned to `@copilot`. Runs in GitHub's cloud, fully async. Use it when Matthew specifically assigns an issue to `@copilot`, or for low-risk routine work where speed/asynchrony matters more than quality.

If you are Copilot working on a slice:
- Open a draft PR early so feedback can arrive while you iterate.
- When a reviewer (Matthew) leaves a comment, address every point in a new commit before re-requesting review.
- If the underlying repo state surprises you (e.g. expected files missing), comment on the PR and stop — don't push speculative fixes.

## What this repo is NOT
See the "What we are explicitly NOT doing (yet)" section in [CLAUDE.md](CLAUDE.md). Do not add ads, analytics, multiplayer, accounts, IAP, or anything speculative. If you think the project needs one of those, file an issue — don't build it.
