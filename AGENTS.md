# AGENTS.md

## Project purpose

Analogion is a small, static web application for contemplative YouTube listening. It provides a distraction-light player, queue, repeat controls, saved sets, local persistence, a repository-backed curated library, and a focused listening mode.

The project is intentionally simple: React + Vite on GitHub Pages, the YouTube IFrame Player API for playback, `localStorage` for personal data, and versioned JSON files for public curated sets. There is no application backend.

## Core product principles

Preserve these principles when changing the project:

- keep the interface contemplative and visually quiet;
- do not turn Analogion into a YouTube clone, feed, discovery surface, or generic dashboard;
- avoid unnecessary thumbnails, recommendation surfaces, metrics, or attention-seeking UI;
- preserve the current static architecture and GitHub Pages compatibility unless a future requirement clearly justifies a change;
- do not introduce a backend, authentication, analytics, telemetry, or remote persistence without an explicit product need;
- treat local browser persistence as the default for personal user data;
- treat repository-backed curated sets as public, versioned content distributed with the site;
- prefer small, understandable features over broad platform-like abstractions.

## Current architecture

- `main.tsx` — React entry point and global stylesheet imports.
- `app/page.tsx` — main application composition, UI state, YouTube player lifecycle, queue/set actions, and dialogs.
- `app/globals.css` — global styling and visual identity.
- `app/repository-library.css` — styles for the local/curated library and publication preparation flow.
- `components/library-panel.tsx` — navigation and presentation for local and curated sets.
- `lib/analogion.ts` — domain helpers for repeat behavior, YouTube URL parsing, and time formatting.
- `lib/library.ts` — local persistence types and validation.
- `lib/curated-library.ts` — curated-set schema, build-time discovery, validation guard, slugging, and JSON draft generation.
- `catalog/sets/*.json` — repository-backed curated playlists distributed with the site.
- `scripts/validate-catalog.mjs` — CI/build validation for curated playlist files.
- `lib/utils.ts` — shared utility helpers.
- `components/ui/` — reusable interface primitives.
- `public/` — static assets.
- `.github/workflows/` — CI and GitHub Pages deployment.

`app/page.tsx` remains the largest module. Future work should gradually extract cohesive responsibilities when changes naturally touch them, rather than performing a wholesale rewrite. Good candidates include YouTube player integration and additional distinct UI sections.

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

## Curated library rules

The curated library is intentionally file-based and should stay simple.

- A published set is one file in `catalog/sets/<id>.json`.
- Do not add a separate hand-maintained index; `import.meta.glob` discovers set files at build time.
- Keep curated files read-only in the browser. Editing repository content from the app requires a separate, explicit future authentication design.
- Never place GitHub write tokens or credentials in frontend code, JSON files, build output, or browser storage.
- The no-auth publication helper may generate/download a valid JSON file and open GitHub, but the actual repository write remains an explicit GitHub/PR action.
- Keep local `SavedSet` data independent from curated data. Copying a curated set into **Meus conjuntos** creates a local editable copy rather than linking mutable state across both sources.
- Preserve schema versioning and update both runtime validation and `scripts/validate-catalog.mjs` together when the schema changes.
- Run `pnpm validate:catalog` for changes under `catalog/sets/` or `lib/curated-library.ts`.

## Before changing code

1. Read `README.md` and this file.
2. Inspect the modules directly related to the requested change.
3. Understand the existing player, queue, repeat, local persistence, and curated-library flow before modifying it.
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

When changing the curated library, verify:

- `pnpm validate:catalog` passes;
- local sets remain browser-only;
- curated sets remain repository-backed and read-only;
- copying a curated set creates a local independent set;
- publication drafts contain only the curated schema, not local-only IDs or URLs.

When changing UI, check both desktop and mobile and watch for horizontal overflow.

## GitHub Pages constraints

The production site is hosted under a repository subpath rather than necessarily at domain root. Keep these constraints in mind:

- Vite currently uses relative asset URLs (`base: "./"`).
- Do not introduce hard-coded root asset paths such as `/assets/...` without checking GitHub Pages behavior.
- Prefer build-time inclusion of curated JSON over runtime paths that can break under the Pages repository subpath.
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
