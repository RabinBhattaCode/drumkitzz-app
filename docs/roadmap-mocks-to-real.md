# Roadmap: Turning Mocks into Real Features

Goal: replace mocked UI/data with minimal, reliable implementations that advance the core loop→kit→publish flow.

## Phase 1 – Creation Pipeline Solidification
1) Projects & Kits  
- Align `/api/projects` and `/api/library` fully with Supabase schema + ownership checks.  
- Strengthen validation/error handling/logging (use `audit-logger` where appropriate).  
- Verify RLS and storage policies end-to-end.

2) AI Extraction  
- Harden `/api/extract-drums` (timeouts, clear error codes, consistent payloads).  
- Expose granular progress to `drum-slicer-pro`.  
- Add minimal logging for failed jobs.

3) Export Flow  
- Ensure consistent client-side export for slices.  
- Provide a minimal downloadable kit (even a basic ZIP) in Phase 1.

## Phase 2 – Marketplace MVP
Current: `/marketplace`, `/trending`, `/stats` use mock listings.
- Query real `kits` where `visibility='public'` and `status='published'`.  
- Add basic search/sort/pagination via Supabase.  
- Surface lightweight stats (downloads/likes) from real columns.  
- Defer purchases/payments until Stripe is ready.

## Phase 3 – Social & Engagement
Current: `social/page.tsx` tabs + leaderboard are mock.
- Add follow relationships in Supabase.  
- Implement likes for kits.  
- Wire social UI to real queries: my kits, followed creators, trending (top downloads/likes).

## Phase 4 – YouTube Extraction & External Sources
Current: `/api/youtube-extract` is a stub.
- Define allowed sources; implement server-side extraction (likely external service).  
- Reuse `/api/extract-drums` + `lib/audio-extraction.ts` once audio is available.

## Phase 5 – Payments & Commercialization
- Add Stripe keys and minimal products/prices mapping to `kits`.  
- Add purchase records and enforce access rules.  
- Show real stats on `/stats`.
