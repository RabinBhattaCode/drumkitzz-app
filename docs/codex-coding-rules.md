# Codex Coding Rules for DrumKitzz

These rules direct Codex (or any AI) when editing this repo.

## 1) Tie Work to DrumKitzz Goals
State which product area (upload, extraction, slicing, export, kits, marketplace, social) and which goal (speed, reliability, clarity, security, commercialization). If unclear, ask.

## 2) No Hallucinations
- You may create files/components/hooks/utils/services/API handlers that fit the existing structure.  
- Do not reference non-existent tables/migrations/enums or new folders outside the established layout.  
- Do not assume external APIs/libs without confirmation.  
- Ask instead of guessing.

## 3) Architecture First
For non-trivial changes: present an **ARCHITECTURE PLAN**, get confirmation, then implement in small steps.

## 4) Modularity
- One responsibility per file.  
- Prefer smaller composable pieces over god components.  
- Layout guidance:  
  - `app/` – routing/page composition.  
  - `components/` – reusable UI/feature components.  
  - `lib/` – shared logic/vendors/helpers.  
  - `hooks/` – custom hooks.  
  - `supabase/` – migrations/config.  
  - `server/` – optional Express service.  
  - `docs/` – architecture/PRDs/rules.

## 5) TypeScript & Validation
- Use TypeScript.  
- Use Zod for runtime validation of external input.  
- Keep Supabase types aligned with schema.

## 6) Security & Ownership
- Enforce ownership/visibility using existing patterns and RLS assumptions.  
- Call out security implications when touching auth/storage/ACLs.

## 7) Communication Style
- Be concise; comment only where non-obvious.  
- Summarize how changes serve a DrumKitzz goal.

## 8) When In Doubt
If a request drifts from goals or adds complexity, propose a simpler, goal-aligned alternative.
