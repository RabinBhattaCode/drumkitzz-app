## Phase 0 Plan – Backend Foundation

### 1. Entities & Relationships
- **profiles** – wrapper around `auth.users`. Stores display info only.
- **kit_projects** – editable sessions (source audio, slice settings, etc.).
- **kits** – published/exported bundles. Links back to a project.
- **kit_slices** – normalized slice metadata for each project/kit.
- **kit_likes**, **purchases**, **notifications**, **audit_logs** – peripheral features for marketplace + logging.

> See `supabase/migrations/20250219120000_phase0_schema.sql` for SQL + RLS policies.

### 2. Storage Strategy
| Asset | Location | Notes |
|-------|----------|-------|
| Source uploads (trimmed WAV/MP3) | **UploadThing** bucket (`projects`) | Handles resumable uploads + size validation client-side. Store returned `key` in `kit_projects.source_audio_path`. |
| Slice exports / ZIP bundles | UploadThing bucket (`kits`) or Supabase Storage if cost is a concern. These paths populate `kits.bundle_path`. |
| Cover images / thumbnails | Supabase Storage bucket (`covers`). Public read, owner write policy. |

**Next steps**
- [ ] Configure UploadThing route handlers under `app/api/uploadthing`.
- [ ] Create Supabase Storage buckets (`covers`, `audit-dumps`).
- [ ] Add signed URL helper in `lib/secure-upload.ts`.

### 3. API Patterns
All API handlers live under `app/api/*/route.ts` with the following conventions:

1. **Auth Guard** – wrap handlers with a helper that reads the Supabase session (using `@supabase/auth-helpers-nextjs`). Reject unauthenticated requests by default.
2. **Validation** – define Zod schemas per route in `lib/validators/*`. Parse `json()` / `formData()` into typed payloads before hitting the database.
3. **Rate Limiting** – use `@upstash/ratelimit` via `lib/rate-limit.ts`. Keys combine `userId` + route name.
4. **Audit Logging** – call `logAuditEvent` for mutating routes (create/update/delete, purchases, payouts). Pass `req` + metadata.
5. **Error Surface** – respond with `{ error: { code, message } }` plus HTTP status; never leak raw Postgres errors to the client.

Example skeleton:

```ts
export async function POST(req: NextRequest) {
  const { user } = await requireAuth(req) // helper
  await throttle(user.id, "kits:create", 10, "1m")
  const input = CreateKitSchema.parse(await req.json())
  const { data, error } = await supabaseServer()
    .from("kits")
    .insert({ ... })
    .select()
  if (error) throw new ApiError("kit_create_failed", 500)
  await logAuditEvent({ event_type: "drumkit.create", user_id: user.id, resource_id: data[0].id })
  return NextResponse.json({ data: data[0] }, { status: 201 })
}
```

### 4. Middleware & Headers
`middleware.ts` already adds CSP/X-Frame/etc. Once backend endpoints are live:
- Remove `'unsafe-inline'/'unsafe-eval'` after refactoring inline styles.
- Add `Strict-Transport-Security` and `Cross-Origin-Opener-Policy`.
- Reject non-HTTPS origins in production.

### 5. Deliverables for this phase
- [x] Migration file with tables + policies.
- [x] Shared TypeScript models (`lib/types/kits.ts`).
- [ ] Supabase Storage + UploadThing config (pending credentials).
- [ ] API helper utilities (`requireAuth`, `supabaseServer`, `ApiError`) scaffolded.

When these boxes are checked we can start Phase 1 (integrating Supabase Auth) without reworking the schema again.
