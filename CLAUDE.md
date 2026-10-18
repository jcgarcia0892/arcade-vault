# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online platform for playing games and competing for the highest score. It is at an early stage: the code is still the Create Next App scaffold, so the README is the source of intent.

- **Workflow:** spec-driven design using the `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) (`npx skills@latest add Klerith/fernando-skills`). Write a spec before implementing a feature, and follow that repo's practices.
- The README is in Spanish.

## Skills Design

- Use always frontend-design skill when you need to create user interfaces.

## Stack and architecture

- **Next.js 16.4 (App Router only, `app/`) + React 19.3 + TypeScript (strict).** Before using any Next API, check the bundled docs in `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`). Don't rely on what you remember from older versions.
- **`next.config.ts` turns on non-default behavior** that affects how you write code:
  - `cacheComponents: true`: Cache Components, which makes Partial Prerendering the default. Caching follows the `"use cache"` / Suspense conventions, not the older route segment config exports. A `runtime` export isn't allowed (Node.js only). See `01-app/02-guides/migrating-to-cache-components.md` in the bundled docs.
  - `partialPrefetching: true` and `experimental.agentFeedback: true`.
  - Tailwind is wired through a Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`). There is no PostCSS config.
- **Tailwind CSS v4:** CSS-first config in `app/globals.css` (`@import "tailwindcss"` plus `@theme inline`). There is no `tailwind.config.js`. Theme tokens are CSS variables (`--background`, `--foreground`), with dark mode set by `prefers-color-scheme`.
- **Typed route helpers:** layouts and pages use the global `LayoutProps<"/route">` / `PageProps<"/route">` types that Next generates into `.next/types`.
- **Path alias:** `@/*` resolves to the repo root.
