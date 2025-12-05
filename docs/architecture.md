# DrumKitzz Architecture

## 1) Product Overview
DrumKitzz lets producers upload/record/rip audio, optionally run AI extraction (Lalal.ai or Replicate) to isolate stems, visualize and slice waveforms with FX, export one-shots, save projects/kits, and publish kits to a marketplace with social/analytics (phased rollout).

Primary goal: reduce time and friction from raw loop → playable/sellable kit.

## 2) High-Level System Map
- **Frontend (Next.js 15 App Router, React 19, TS, Tailwind, shadcn/ui)**  
  - Marketing pages  
  - Auth flow (Supabase)  
  - Creation workflow (`/create`)  
  - Library & kits views (`/my-kits`, `/my-projects`)  
  - Marketplace & social (mock → real)
- **APIs (app/api)**  
  - `/api/extract-drums` – AI extraction orchestration (Lalal.ai/Replicate/demo)  
  - `/api/proxy-audio` – server-side fetch/stream of remote audio  
  - `/api/projects` – save/load `kit_projects` + `kit_slices`  
  - `/api/library` – create/update `kits` + `kit_assets` from projects  
  - `/api/uploadthing/*` – audio uploads
- **Backend Services**  
  - Supabase (DB/auth/storage/RLS)  
  - Lalal.ai / Replicate Demucs for AI extraction  
  - Optional Express service in `/server` for Lalal.ai + Supabase mirroring  
  - Optional Upstash Redis for rate limiting

## 3) Data Model (Phase 0)
- `profiles`: id (FK auth.users), username/display/bio/avatar/etc.  
- `kit_projects`: owner_id, title, source_audio_path, slice_settings, playback_config, fx_chains, notes, status, linked_kit_id.  
- `kits`: owner_id, project_id, name, description, cover_image_path, bundle_path, price_cents, currency, visibility, status, download_count, like_count.  
- `kit_slices`: project_id, kit_id, name/type/start/end, fade_in_ms, fade_out_ms, metadata.  
- `kit_assets`: kit_id, project_id, owner_id, asset_type (enum), storage_path, duration_ms, size_bytes, checksum, metadata.  
- Storage buckets: stems, chops, bundles/archives, artwork (policies in migrations).  
- RLS: owner-based access; public visibility via `visibility` on kits.

## 4) Core Flows
### 4.1 Upload & AI Extraction
1. User uploads/records audio via `drum-slicer-pro` (UploadThing + `lib/secure-upload`).  
2. Client (`lib/audio-extraction.ts`) calls `/api/extract-drums` with desired stem.  
3. API chooses Lalal.ai (license) → Replicate (token) → demo fallback.  
4. Vendor processed stem URL optionally mirrored to Supabase storage.  
5. Client fetches via `/api/proxy-audio`, decodes to `AudioBuffer`.

### 4.2 Slicing & FX
1. `waveform.tsx` renders main canvas with zoom/scroll and slice markers.  
2. Users add/move/delete slices; per-slice FX presets in `create/drum-slicer-pro/state.ts`.  
3. Slice/project state persists via `/api/projects` (kit_projects + kit_slices).

### 4.3 Export & Kit Creation
1. `export-panel.tsx` sets format/naming/metadata (client-side export for now).  
2. `/api/library` upserts kits, copies project assets into kit scope, and records `kit_assets`.

## 5) Security & Middleware
- `middleware.ts`: Supabase session refresh; CSP/X-Frame/X-Content-Type/XSS/Permissions-Policy; no-store on `/api/*`.  
- `lib/secure-upload.ts`: type/size whitelist, SHA-256 hashing, filename sanitization/randomization.  
- `lib/rate-limit.ts`: optional Upstash sliding window; adds rate headers.  
- `lib/audit-logger.ts`: service-role audit logging (table assumed) + critical alert hook stub.

## 6) Future Extensions (migrations placeholders)
- Follows/social graph, messaging/collab, notifications.  
- Purchases/payouts (Stripe), marketplace analytics.  
- Additional stems/models and richer export automation.

Principle: reuse existing architecture; keep focus on loop→kit speed and reliability.
