# DrumKitzz Codebase Overview (for AI context)

This file is meant to be the single “tell me everything” reference for an AI/engineer. It describes what the app does, how it is wired, what’s real vs placeholder, where features live, and how data flows.

## Product In One Breath
DrumKitzz is a web app for producers to upload/record/rip audio, optionally AI-extract drums, slice/edit/export one‑shots, then publish kits to a marketplace with social features. Current build: UX is rich, but many data paths are mocked; AI extraction works when configured.

## Runtime / Stack
- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + shadcn/ui. Styling: `app/globals.css`.
- Auth/DB/Storage: Supabase (helpers in `lib/supabase-browser.ts`, `lib/supabase/server.ts`; middleware refreshes sessions + security headers).
- AI/Audio: Lalal.ai (preferred) or Replicate Demucs via `lib/audio-extraction.ts` + `app/api/extract-drums/route.ts`; client fallback “enhance”/demo mode; local Demucs planned but not implemented server-side.
- Uploads: UploadThing (`app/api/uploadthing/*`); validation helpers in `lib/secure-upload.ts`.
- Rate limiting: Upstash Redis helper in `lib/rate-limit.ts` (off until env vars set).
- Alt backend: `server/` Express service to hit Lalal.ai directly and mirror to Supabase (optional, separate from Next).
- Build/Deploy: Netlify config present; scripts in `package.json`. Mixed lockfiles (npm/pnpm/deno).

## Environment (must-haves vs optional)
- Required for core AI + auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REPLICATE_API_TOKEN` (or `LALAL_AI_LICENSE_KEY`).
- Uploads: `UPLOADTHING_TOKEN`, `UPLOADTHING_APP_ID`, `UPLOADTHING_SECRET`.
- Optional but recommended: `LALAL_AI_LICENSE_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN` (rate limit), `SECURITY_WEBHOOK_URL`.
- Optional/Phase 2: Stripe keys, Stable Horde key, etc. Full matrix lives in `README.md` and `project-architecture.json`.

## App Router (app/)
- `layout.tsx`: wraps all pages with `AuthProvider`, `LayoutShell` (navbar + overlay), toaster. Marketing routes skip sidebar.
- `globals.css`: brand theme (dark glass, gradients, CSS vars).
- **Marketing**: `marketing/page.tsx` (main landing), `page.tsx` re-exports. Sections: hero, features, workflow, pricing (`components/pricing/pricing-plans.tsx`), contact, affiliate, footer.
- **Auth pages**: `login/page.tsx`, `signup/page.tsx`, `signup/check-email/page.tsx`, `auth/confirm/page.tsx` use `AuthForms` (Supabase signIn/signUp/reset). Overlay can be triggered via custom events.
- **Creation workflow**: `create/page.tsx` mounts `components/create/drum-slicer-pro` (main editor). `create-2` and `extractor-experiment` are variants/experiments.
- **User areas**: `home/page.tsx` (hero + trending, gated sections), `dashboard/page.tsx` (auth-guarded; reads mock data from `lib/dashboard-data`), `profile/page.tsx`, `settings/page.tsx`, `my-library/page.tsx`, `my-projects/page.tsx`, `my-kits/page.tsx`, `my-kits/[id]/page.tsx`, `my-kits/layout.tsx` (scaffold).
- **Marketplace/Social**: `marketplace/page.tsx`, `/trending`, `/stats` (mock listings/analytics); `social/page.tsx` tabs across marketplace/profile/leaderboard/comments/auth components.
- **Admin/Utility**: `admin/security/page.tsx` (mock security view), `status/page.tsx` (status), `help`, `guide`, `about`, `pricing`, `charts` (recharts demo).
- **APIs (app/api)**:
  - `extract-drums/route.ts`: formData actions `upload`/`check`; chooses Lalal.ai if license, else Replicate, else demo; can mirror stems to Supabase storage (`SUPABASE_UPLOAD_RESULTS=true`); supports `stem` param (drum/bass/vocals/etc).
  - `youtube-extract/route.ts`: stub; returns success without real extraction.
  - `proxy-audio/route.ts`: server-side fetch/stream remote audio (avoids CORS).
  - `uploadthing/core.ts` + `route.ts`: UploadThing router for audio (MP3/WAV).
  - `library/route.ts`: upsert kit from project; copies project assets to kit scope; ensures profile exists and ownership.
  - `projects/route.ts`: upsert/delete kit projects + slices; Zod validation; ensures profile exists.

## Core Creation Components (app/components/*)
- Waveform & Slicing: `waveform.tsx` (canvas main waveform with zoom/scroll/slices), `slice-waveform.tsx`, `trim-waveform.tsx`, `circular-waveform.tsx`.
- Editing/Playback: `sample-editor.tsx`, `playback-controls.tsx`, `export-panel.tsx` (format/metadata UI), `extraction-progress-dialog.tsx`.
- Extractors: `youtube-extractor.tsx` (UI + calls stub API), `extraction-progress-dialog.tsx`.
- Misc: `knob.tsx`, `drum-sample.tsx`, `playback-controls.tsx`, comments and profile components, marketplace/leaderboard mocks.
- Auth UI: `auth/auth-forms.tsx` (login/signup/reset wired to Supabase auth helper, toasts, redirects).

## Shared Components (components/)
- Shell: `layout-shell.tsx` (decides marketing vs app shell), `navbar.tsx` (sidebar/mobile with mock cart/notifications and protected-route gating), `sign-in-overlay.tsx` (CTA + dialogs, listens for custom events).
- Creation stack: `create/drum-slicer-pro.tsx` (main editor), `create/drum-slicer-pro/state.ts` (FX presets, kit outputs), `create/drum-slicer-pro/fx-controls.tsx` (per-slice FX UI), `create/drum-slicer/state.ts` + `fx-controls.tsx` (older).
- Pricing: `pricing/pricing-plans.tsx`.
- UI library: `components/ui/*` shadcn primitives (button, card, dialog, sheet, accordion, badge, slider, tabs, dropdown, tooltip, progress, table, sidebar, carousel, resizable, empty states, etc.).

## Libraries (lib/)
- `audio-extraction.ts`: Client orchestrator for Lalal.ai/Replicate/local (planned) or mock. Handles upload → poll → proxy download → decode to `AudioBuffer`; includes client-side enhancement and mock extraction.
- `auth-context.tsx`: Supabase session wrapper; `useAuth()` returns typed user, auth flags, login/logout.
- `supabase-browser.ts`, `supabase/server.ts`: typed Supabase clients for client/server/route handlers.
- `rate-limit.ts`: Upstash Redis limiter + `withRateLimit` wrapper (no-op if env not set).
- `secure-upload.ts`: file validation (type/size), SHA-256 hash, filename sanitization/randomization.
- `uploadthing.ts`: UploadThing React helpers.
- `pricing.ts`: plan metadata and currency helpers.
- `dashboard-data.ts`: mock drum kits/friends/activity with localStorage persistence.
- `audit-logger.ts`: Supabase service-role audit logging + optional critical alert stub.
- `stable-horde.ts`: Stable Horde image generation helper (unused elsewhere).
- `types/kits.ts`: shared types for profiles/kits/projects/slices/purchases.
- `utils.ts`: `cn` Tailwind merge helper.

## Hooks (hooks/)
- `use-toast.ts`: toast helper.
- `use-mobile.tsx`: responsive detection.
- `use-kits.ts`: small mock data hook.

## Docs (docs/)
- `backend-phase0.md`: backend plan (entities, API patterns, middleware, deliverables; points to migrations).
- `project-architecture.json`: extremely detailed machine-readable map (flows, env, known issues, schema, data flow).
- `PRD.md` (root): product requirements; `drumkitzz-rebuild-prompts.md`, `reference-screenshots-labeled.md` for context.

## Supabase (supabase/)
- Config: `config.toml`, `.temp/*`, `.branches/_current_branch`.
- Migrations of note:
  - `20250219120000_phase0_schema.sql`: core enums (`kit_status`, `visibility_type`, `kit_asset_type`); tables `profiles`, `kit_projects`, `kits`, `kit_slices`, `kit_assets`; triggers for updated_at; RLS policies (owner-based), RPC `get_my_stats`.
  - `20250301000000_storage_buckets_and_policies.sql`: sets up storage buckets/policies (stems/chops/etc.).
  - `20250302000000_fix_projects_and_assets.sql`: schema tweaks.
  - `20250303000000_harden_storage_owner_function.sql`: security hardening.
  - `20251115*` migrations: future remote schema/follow/messaging placeholders.

## Server (server/)
- `index.js`: Express server with multer + CORS. Endpoint `/api/lalal/split-drums` uploads to Lalal.ai, triggers split, polls, and optionally uploads results to Supabase. Healthcheck at `/api/health`.
- `lalalService.js`: axios helpers for Lalal.ai upload/split/check/poll with enhanced processing toggle.
- `storageService.js`: mirrors Lalal.ai results to Supabase storage + inserts `kit_assets` (requires service role key).
- `supabaseClient.js`: service-role client factory. README explains usage.

## Styles & Assets
- `app/globals.css`: primary theming, gradients, glass effects, responsive helpers.
- `styles/globals.css`: legacy Tailwind globals (mostly unused).
- `public/`: logos, placeholders, marketing images.

## What’s Real vs Placeholder
- Real-ish: AI extraction when Lalal.ai or Replicate keys are set; Supabase auth wrapper; UploadThing wiring; rate-limit helper (needs env); middleware security headers.
- Placeholder/Mock: YouTube extraction; marketplace/social/admin data; dashboard stats; pricing/payments; many pages are UI stubs. Local Demucs server path not implemented. Stable Horde helper unused.
- Mixed package managers; pick one and clean lockfiles.

## End-to-End Audio Flow (as built)
1) **Input**: In `components/create/drum-slicer-pro`, user uploads/records audio or pastes YouTube URL (stub). File can be backed up via UploadThing.
2) **AI extraction (optional)**: `lib/audio-extraction.ts` posts to `/api/extract-drums` with `stem` and context (user/project/kit). Server selects Lalal.ai (license) → Replicate (token) → demo fallback; polls with `action=check`.
3) **Download/Decode**: Client uses `/api/proxy-audio` to fetch the stem URL, decodes to `AudioBuffer` in Web Audio API.
4) **Visualization & Slicing**: `waveform.tsx` renders canvas with zoom/scroll; users create/move slice markers; `slice-waveform.tsx` shows per-slice detail; FX presets from `create/drum-slicer-pro/state.ts`; knobs and sliders adjust fades/gain/EQ/comp/color.
5) **Export**: `export-panel.tsx` provides format options and metadata; export logic is client-side (no server export endpoint); ZIP packaging is implied but not wired server-side.
6) **Persist**: Projects and kits can be saved via `/api/projects` and `/api/library` into Supabase tables when authenticated; assets can be mirrored to storage (if enabled).

## Data Model (current migrations)
- `profiles` (id FK auth.users, username/display/bio/avatar/etc.).
- `kit_projects` (owner_id, title, source_audio_path, slice_settings, playback_config, fx_chains, notes, status, linked_kit_id).
- `kits` (owner_id, project_id, name, description, cover_image_path, bundle_path, price_cents, currency, visibility/status, download_count, like_count).
- `kit_slices` (project_id, kit_id, name/type/start/end/fades/metadata).
- `kit_assets` (kit_id, project_id, owner_id, asset_type enum, storage_path, duration_ms, size_bytes, checksum, metadata).
- Future placeholders: follows, messaging, notifications, etc. in later migrations.

## Security & Middleware
- `middleware.ts`: refreshes Supabase session, applies CSP (currently allows unsafe-inline/eval for legacy code), X-Content-Type-Options, X-Frame-Options=DENY, XSS protection, Referrer-Policy, Permissions-Policy; sets no-store on `/api/*`.
- `lib/rate-limit.ts`: Upstash Redis ZSET-based sliding window; adds rate limit headers; no-op if not configured.
- `lib/audit-logger.ts`: service-role Supabase insert into `audit_logs` (table assumed), optional critical alert hook.
- `lib/secure-upload.ts`: type/size whitelist, SHA-256 hashing, filename sanitization/randomization.

## Notable Files (grab-bag)
- `middleware.ts`: see above.
- `components/navbar.tsx`: protected route gating opens auth overlay via custom event; mock cart/notifications.
- `components/sign-in-overlay.tsx`: global CTA with auth/cart/notifications dialogs; listens to `open-auth-overlay`.
- `components/create/drum-slicer-pro.tsx`: main editor; manages audio context, extraction progress, slice state/history, FX chains, uploads to UploadThing, kit output presets, keyboard audition mapping.
- `lib/audio-extraction.ts`: resilient client orchestrator with progress callbacks and fallbacks.
- `app/api/projects/route.ts`: Zod-validated upsert for projects + slices; ensures profile exists.
- `app/api/library/route.ts`: upsert kit and copy project assets into kit scope; mirrors source audio if no assets.
- `server/index.js`: Express Lalal.ai pipeline; optional Supabase mirroring toggle `SUPABASE_UPLOAD_RESULTS`.

## Current Risks/Gaps
- AI extraction requires keys; otherwise demo mode only.
- YouTube extraction unimplemented; marketplace/social/admin/purchases are mock-only; Stripe absent.
- Local Demucs server path is unimplemented (`USE_LOCAL_DEMUCS` only checked, not executed).
- CSP still allows unsafe-inline/eval; should be hardened post-refactor.
- Mixed lockfiles; choose npm or pnpm to avoid drift.

## Quick Start (commands)
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build` → `npm start`
- Netlify deploys: `npm run deploy` / `deploy:prod`
- Lalal Express server: `npm run server` (uses `.env.local`; separate from Next)

