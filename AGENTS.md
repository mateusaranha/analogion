# AGENTS.md

## Project purpose

Analogion is a small, static web application for contemplative YouTube listening. It provides a distraction-light player, queue, repeat controls, saved sets, local persistence, and a focused listening mode.

The project is intentionally simple: React + Vite on GitHub Pages, the YouTube IFrame Player API for playback, and `localStorage` for user data. There is no application backend.

## Core product principles

Preserve these principles when changing the project:

- keep the interface contemplative and visually quiet;
- do not turn Analogion into a YouTube clone, feed, discovery surface, or generic dashboard;
- avoid unnecessary thumbnails, recommendation surfaces, metrics, or attention-seeking UI;
- preserve the current static architecture and GitHub Pages compatibility unless a future requirement clearly justifies a change;
- do not introduce a backend, authentication, analytics, telemetry, or remote persistence without an explicit product need;
- treat local browser persistence as the current default;
- prefer small, understandable features over broad platform-like abstractions.

## Current architecture

- `main.tsx` — React entry point.
- `app/page.tsx` — main application composition, UI state, YouTube player lifecycle, queue/set actions, and dialogs.
- `app/globals.css` — global styling and visual identity.
- `lib/analogion.ts` — domain helpers for repeat behavior, YouTube URL parsing, and time formatting.
- `lib/utils.ts` — shared utility helpers.
- `components/ui/` — reusable interface primitives.
- `public/` — static assets.
- `.github/workflows/` — CI and GitHub Pages deployment.

`app/page.tsx` is currently the largest module. Future work should gradually extract cohesive responsibilities when changes naturally touch them, rather than performing a wholesale rewrite. Good candidates include persistence, YouTube player integration, and distinct UI sections.

## Code organization

Use proportional modularity.

- Avoid allowing one file to accumulate unrelated domains indefinitely.
- Extract a module when it gains a clear conceptual responsibility or when the same logic is needed in more than one place.
- Do not split code into many tiny files solely to reduce line counts.
- Keep YouTube player lifecycle logic centralized; do not duplicate competing player state in multiple components.
- Keep repeat/queue behavior deterministic and reuse the domain helpers in `lib/analogion.ts`.
- Keep persistence format/versioning explicit. Changes to stored data should account for existing browser data and exported backups.
- Prefer plain functions and React state before introducing additional state-management libraries.
- Reuse existing UI primitives before adding another component library.

## Before changing code

1. Read `README.md` and this file.
2. Inspect the modules directly related to the requested change.
3. Understand the existing player, queue, repeat, and persistence flow before modifying it.
4. Keep the change scoped to the request.
5. Avoid unrelated renames, formatting churn, dependency upgrades, or broad refactors.

## Validation

For relevant changes, run:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Also run CI checks when available.

When changing player behavior, verify:

- play/pause;
- current item selection;
- previous/next navigation;
- automatic advance after a video ends;
- current-item repeat;
- whole-queue repeat;
- 1 cycle, 3 cycles, and infinite repeat.

When changing persistence, verify:

- reload restores data;
- set creation/update/rename/delete still works;
- exported JSON can still be imported;
- invalid stored/imported data fails safely.

When changing UI, check both desktop and mobile and watch for horizontal overflow.

## GitHub Pages constraints

The production site is hosted under a repository subpath rather than necessarily at domain root. Keep these constraints in mind:

- Vite currently uses relative asset URLs (`base: "./"`).
- Do not introduce hard-coded root asset paths such as `/assets/...` without checking GitHub Pages behavior.
- Avoid routing changes that make direct refreshes return 404 unless an explicit Pages-compatible strategy is added.
- Test production builds, not only the dev server.

## Dependencies

- Do not add a package for a small problem that can be solved clearly with the current stack.
- Avoid major dependency upgrades as part of unrelated feature or bug-fix work.
- Do not replace React, Vite, Radix UI, Tailwind, or the current player integration merely for preference.

## Scope discipline

Do not use a small issue as an opportunity to:

- redesign unrelated areas;
- reorganize the whole repository;
- rename components in bulk;
- add speculative features;
- introduce backend services;
- add authentication;
- add analytics;
- add Docker or monorepo infrastructure;
- adopt enterprise architecture for hypothetical future scale.

Prefer the smallest change that solves the actual problem while preserving the product's calm, focused character.
