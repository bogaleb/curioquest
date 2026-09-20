# CurioQuest Claude Code Instruction Pack

This folder contains the product and implementation instructions for upgrading CurioQuest with Claude Code.

## Recommended Setup

Copy these files into the root of your CurioQuest repository so the structure becomes:

```text
CurioQuest/
├── CLAUDE.md
├── docs/
│   └── product/
│       ├── COMMERCIAL-UPGRADE.md
│       ├── WAVE-01-FOUNDATION.md
│       ├── WAVE-02-ENTRY-EXPERIENCE.md
│       ├── WAVE-03-CHILD-HOME.md
│       ├── WAVE-04-ADAPTIVE-LEARNING.md
│       ├── WAVE-05-READING.md
│       ├── WAVE-06-MATH.md
│       ├── WAVE-07-SCIENCE.md
│       ├── WAVE-08-LOGIC.md
│       ├── WAVE-09-GAMES.md
│       ├── WAVE-10-CREATIVE-STUDIO.md
│       ├── WAVE-11-STORIES-VIDEO-DISCOVERY.md
│       ├── WAVE-12-REWARDS-PROGRESSION.md
│       ├── WAVE-13-PARENT-EXPERIENCE.md
│       ├── WAVE-14-COMMERCIAL-HARDENING.md
│       └── WAVE-15-CONTENT-SCALE-AND-ADMIN.md
```

## How to Use With Claude Pro

Do not paste the full master specification every time.

Use short prompts such as:

> Implement Wave 1. Read `docs/product/WAVE-01-FOUNDATION.md`. Inspect the current application before changing it. Complete the wave, test it, run the production build, and stop when Wave 1 is complete.

Then move to the next wave in a new session or after a clean checkpoint:

> Implement Wave 2. Read `docs/product/WAVE-02-ENTRY-EXPERIENCE.md`. Preserve completed Wave 1 work. Complete the wave, test it, run the production build, and stop.

## Recommended Git Workflow

Before each wave:

```bash
git status
git add .
git commit -m "Stable before Wave X"
git push
```

After Claude completes and tests the wave:

```bash
git add .
git commit -m "Complete Wave X"
git push
```

Use Vercel preview deployments for substantial feature branches when practical.

## Important

`CLAUDE.md` is intentionally concise. The detailed product vision and implementation requirements are split across separate files so Claude does not need to load the entire plan into context for every task.
