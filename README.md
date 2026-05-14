# FlappyBird

A Flappy Bird-style game built almost entirely by AI agents, with Matthew as game director.

- **Engine:** Phaser 3 (TypeScript)
- **Build:** Vite
- **Tests:** Vitest (unit) + Playwright (headless gameplay screenshots)
- **Lint/format:** Biome
- **Hosting:** GitHub Pages -> https://matthewmuir-mli.github.io/FlappyBird/
- **License:** MIT

## Quick start (local)
```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run test:e2e   # Playwright headless run (builds + previews + screenshots)
npm run build      # production build into dist/
```

## Where to look
- [CLAUDE.md](CLAUDE.md) — project standards (TDD, vertical slices, branches, no self-merge).
- [AGENTS.md](AGENTS.md) — agent-facing playbook (used by Claude Code, GitHub Copilot Coding Agent, etc.).
- [docs/SLICES.md](docs/SLICES.md) — log of shipped slices.
- [docs/AESTHETIC.md](docs/AESTHETIC.md) — Matthew's art direction (fill in before Slice 9).
- GitHub Issues labeled `slice` — the backlog.
- [ADR-001](https://github.com/MatthewMuir-MLI/FlappyBird/issues/21) — why we pivoted from Godot+Android to Phaser+web.

## Layout
```
src/
  main.ts            # Phaser bootstrap
  core/              # pure logic, no Phaser imports — testable with Vitest
  scenes/            # Phaser scenes
tests/
  unit/              # Vitest
  e2e/               # Playwright
.github/workflows/   # CI + Pages deploy
docs/                # SLICES.md, AESTHETIC.md
```
