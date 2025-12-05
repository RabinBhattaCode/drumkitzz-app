# PRD: Audio Slicing v2

## 1) Problem
Slicing can feel manual, unclear, and slow. Producers need faster, clearer slice creation with better defaults.

Goal: reduce friction from raw loop → clean slices ready for export.

## 2) Objectives
1. Fewer manual edits to get good slices.  
2. Clear UI state: what slices exist/are selected/will export.  
3. QoL tools: snap, zoom presets, audition, heuristics for suggested slices.  
4. Stay compatible with existing `kit_projects` and `kit_slices` schema.

## 3) Scope (v2 Features)
### 3.1 Improved Slice UX
- Highlight active/selected slice in `waveform.tsx`; show labels/types (kick/snare/hat/etc. if tagged).  
- Keyboard shortcuts: add/delete slice, nudge left/right, audition slice.  
- Zoom/navigation presets: fit all, focus on selected; smooth scroll between slices.

### 3.2 Auto-Slicing (Heuristic)
- Client-side transient detection (amplitude + min distance).  
- “Suggest slices” button; review/accept markers.  
- Persist accepted markers to Supabase via `/api/projects`.

### 3.3 Export Clarity
- In `export-panel.tsx`: show count of slices to export, naming preview (e.g., `KIT_kick_01.wav`), basic duration/timing per slice.

## 4) Non-Goals (v2)
- No new backend tables.  
- No ML/advanced models.  
- No server-side rendering of exports (still client-side).

## 5) Success Criteria
- Fewer manual adjustments per project.  
- Shorter time from load → export.  
- Qualitative feedback: “I can slice loops quickly without thinking too much.”
