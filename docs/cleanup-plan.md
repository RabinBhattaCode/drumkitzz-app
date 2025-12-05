# DrumKitzz Cleanup Plan

Goal: reduce tech debt and ambiguity so humans/AI can work safely and quickly.

## 1) Package Manager
- Choose npm or pnpm; delete unused lockfiles; align scripts in `package.json`.

## 2) App Router (app/)
- Group marketing routes under the marketing branch of the layout.  
- Ensure authenticated pages are gated (middleware + navbar overlay rules).  
- Move/retire experiments (`/create-2`, `/extractor-experiment`) or park them under `/experiments`.

## 3) Components
- `components/ui/*`: prune unused shadcn components or mark optional.  
- Clarify boundaries:  
  - `components/*` = shared primitives/composites.  
  - `app/components/*` = route-specific or feature-scoped.  
- Move files accordingly.

## 4) Lib / Utilities
- `lib/audio-extraction.ts`: separate vendor calls vs orchestration; ensure consistent typing across Lalal/Replicate/demo.  
- `lib/secure-upload.ts`, `lib/rate-limit.ts`: add clear JSDoc; remove dead code paths.

## 5) API Routes
- Standardize response shape: `{ status: 'success' | 'error', data?, error? }`.  
- Add error logging via `audit-logger` where relevant.  
- Enforce ownership checks via Supabase for mutating routes.

## 6) Server (/server)
- Document the Express path as optional and env-driven.  
- Decide to keep or sunset in favor of pure Next.js handlers; update docs accordingly.

## 7) Docs & Comments
- Keep `/docs` as source of truth: `architecture.md`, `roadmap-mocks-to-real.md`, `prd-audio-slicing-v2.md`, `codex-coding-rules.md`.  
- Remove stale/contradictory comments; prefer docs over inline narration.
