# New Session Bootstrap Prompt

When a Claude Code session has grown too long or you want to start fresh, open a new session in this repo and paste the block below as the first message. The new session will read the repo's canonical docs and confirm understanding before doing any work.

---

```
I'm Matthew Muir (MatthewMuir-MLI on GitHub). I'm the game director for FlappyBird, an agentic Flappy Bird clone in this repo. A prior Claude Code session worked on this project and got too long; I'm starting fresh with you.

You are the default coding agent for this project per AGENTS.md. I review and merge from my phone; you do all the typing. I do not type gameplay code.

Before doing anything else, please:

1. Read these files in this order: README.md, CLAUDE.md, AGENTS.md, docs/SLICES.md. They are short and authoritative. They tell you how we work, what we've shipped, and the standards that are non-negotiable.

2. Run `gh issue list --state open --label slice` and `gh pr list --state open` to see the live backlog and anything currently in flight.

3. Then tell me in a few sentences:
   - The current state (what's shipped, what's open).
   - The next slice that should be picked up.
   - Anything in the docs that looks ambiguous or that you'd push back on.

4. Do not start work on a slice until I explicitly say "go on #N". When I do, use Plan Mode (Shift+Tab Shift+Tab) for any non-trivial slice before writing code.

A few orientation points so you don't have to dig for them:
- Stack: Phaser 4 + TypeScript + Vite + Vitest + Playwright + Biome. Deploys to GitHub Pages.
- Live URL: https://matthewmuir-mli.github.io/FlappyBird/.
- Pure logic in src/core/ (no `import phaser`). Phaser scenes in src/scenes/ wire core state to the canvas.
- Test infrastructure pattern: scenes publish state to canvas `data-*` attributes; Playwright reads them.
- CI runs unit tests only. Playwright e2e is local-only — run it before pushing every slice PR.
- Branch naming: `feat/slice-N-short-name`. Open as draft PR. Mark ready when CI green. Never self-merge.

I drive you remotely from the Claude Code mobile app most of the time. Optimize for "Matthew can review this on a phone screen": tight commits, clear PR descriptions.
```

---

## Why this exists

Long Claude Code sessions accumulate context that becomes expensive to carry forward. Anthropic's prompt cache TTL is 5 minutes; a session that's been idle longer pays a cache miss on every tool call. Starting fresh restores a tight, fast loop — at the cost of the new session not knowing the project's history.

The fix is to make the repo itself carry the context (README.md, CLAUDE.md, AGENTS.md, docs/SLICES.md) and use this prompt to point a new session at them. The new session is productive within a minute.

## When to reset

Some signals that a session is overdue for a reset:
- Tool calls have gotten noticeably slower.
- The session has been working across multiple slices.
- You've made a major decision (like a platform pivot) that fundamentally changed the project; restart so the new session isn't carrying defunct context.
- You catch the session apologizing, hedging more than usual, or repeating things you already settled.

## What to do before resetting

- Make sure any in-flight PR has its description updated with the current state.
- Check that `docs/SLICES.md` "Shipped" section reflects everything that's actually shipped to `main`.
- Note any conversational decisions that weren't captured in code or docs. If something is only "in the session", commit it to a markdown file before you reset.
