# DrumKitzz Rebuild Prompts - Complete Reconstruction Guide

## Phase 1: Global Theme & Styling

**Prompt 1: Apply Prototype Theme Globally**
- Use the prototype page's glassy gradient theme on all website elements
- Keep all functionality and label names the same
- Remove "Prototype" from main navbar
- Add a small circular button under Sign In (no text) that opens prototype page

**Prompt 2: Add Prototype Fonts**
- Mix and match fonts used in prototype page across all pages
- Apply Inter and Space Grotesk throughout the site
- Use fonts on headings and body text consistently

**Prompt 3: Fix White Text Visibility**
- For sliced sounds section: play button and text are invisible on white background
- Use darker colors for text and buttons to show contrast
- Make controls visible throughout

**Prompt 4: Adjust Knob Positioning**
- Move fade in/out and trim left/right knobs lower inside sliced sound cards
- Add spacing so knobs don't touch zoom in/out buttons on right side
- Add spacing so knobs don't touch < and > buttons on left side

**Prompt 5: Darken Website Background**
- Make background darker on black to dark navy side
- Change from bluish gray to true black/navy

**Prompt 6: Apply Musicfy-Inspired Theme**
- Update entire site with dark purple/navy (#0e0c14, #1a1625) as base
- Use accent gradients: Pink to purple (#c597a9 → #704f66 → #463f62)
- Use bright pink/magenta for CTAs (#aa3779)
- Add gradient overlays on images and backgrounds
- Implement glassmorphism cards
- Add horizontal scrolling carousels (4-5 columns on desktop)
- Create image cards with dark gradient overlays

---

## Phase 2: Audio Processing & Waveform

**Prompt 7: Add Trim Preview Before Slicing**
- Don't let audio go straight into slicer after upload/record/YouTube
- Show preview with 3-60 second selection capability
- Let user drag handles to define window
- Show "Start Over" or "Save" options
- Only trimmed segment goes to slicing

**Prompt 8: Fix Recording Timer**
- Recording timer moving faster than real time
- Use real timestamps instead of artificial counting
- Match actual elapsed seconds

**Prompt 9: Add Waveform Visualization**
- Show waveform of uploaded/recorded audio
- Let user decide where to extract/slice from
- Display which part of waves are being played in real time

**Prompt 10: Add Playback Cursor & Selection**
- Show animated playing cursor moving along waveform in real time
- Allow users to click left-to-right to create highlighted selection
- Selection then goes for slicing/extracting

---

## Phase 3: Navigation & Page Restructuring

**Prompt 11: Reorganize Navbar**
- Change "Charts" to "Trending"
- Add "Home" above "Create"
- Add notifications panel
- Reorganize into groups:
  - My Kits (Library/Projects)
  - Market (Marketplace/Trending/Stats)
  - About (About/Pricing/Help/Guide)

**Prompt 12: Create New Pages**
- Create /home page with suggested creators, notifications, trending cards
- Create /my-kits page with 4-kit grid layout
- Create /trending page (marketplace-style grid)
- Create /charts page for analytics
- Ensure all use consistent marketplace styling (4 kits per row)

**Prompt 13: Clone Create Page**
- Create "Create 2.0" route (/create-2)
- Use same components but with modern variant styling
- Keep original /create as "classic" version
- Add sparkles icon for Create 2.0 access
- Make Create 2.0 hidden behind button under Sign Up (not in navbar)

---

## Phase 4: Marketplace & Product Features

**Prompt 14: Redesign Marketplace Layout**
- 4 kits/images per row
- Horizontal scrolling to see more kits
- Click on tile to expand with transparent background
- Show download/buy options
- Include kit details

**Prompt 15: Marketplace Categories**
- Create sections: Trending Kits, Drum Kits, One Shot Instruments
- Same layout as "Trending kits" in Create
- Ensure consistency across pages

**Prompt 16: Replace Live Preview**
- Replace with "Upload, Record, YouTube" capture section
- Show upload options with descriptions
- Add flow overview explaining: Capture → Sculpt → Drop

---

## Phase 5: Color Theme Migration

**Prompt 17: Change Color Palette**
- Migrate from purple/pink to yellow/grey/black theme
- Use charcoal background (#01030a to #1a1625 range)
- Use amber/gold accents instead of pink
- Update all components, buttons, cards

**Prompt 18: Fix Waveform Colors**
- Waveforms currently blue - change to match site palette
- Use different colors per slice type (kick, snare, hat, cymbal, perc)
- Add high contrast between types using yellow, grey, and other palette colors
- Change extraction loading circle from blue to yellow
- Change blue bar under main waveform to suitable UI color

---

## Phase 6: Audio Input & Upload Experience

**Prompt 19: Reorganize Create Page Layout**
- Move audio input to right side
- Move extraction/stem selection to left side
- Record and Upload side by side to save space
- YouTube full width below Record/Upload
- Auto-extract toggle and stem selection below

**Prompt 20: Create "Select Kit Output" Section**
- Replace "select voice" with "select kit output"
- Options: Drum Kit, Instrument One Shots, Vocal Chops, Bass One Shots
- Show message if AI doesn't detect chosen sound type
- Default to Drum Kit selected
- Move Auto-extract to top (default NOT selected)
- Gate stem selection: only enable when auto-extract is ON

**Prompt 21: Drag & Drop Audio**
- Add drag-and-drop zone under "Select audio file"
- Allow users to drag audio clips into the zone
- Highlight zone when file hovers over it

---

## Phase 7: Pricing & Monetization

**Prompt 22: Create Pricing Page**
- 3 plans: Free, Tier 2 ($8/month), Tier 3 ($15/month)
- Default highlight Tier 2 as "Popular"
- Auto-convert prices based on user location (USD/GBP/CAD/AUD)
- Show on /pricing route
- Show section below trending kits on Create page

**Prompt 23: Localized Pricing**
- Detect browser region
- Show prices in nearest whole numbers
- UK = GBP, USA = USD, Canada = CAD, Australia = AUD

---

## Phase 8: UI Polish & Refinement

**Prompt 24: Scale Navbar Logo**
- Reduce logo to 0.8x current size
- Free up more space in navbar

**Prompt 25: Add Hero Image to Homepage**
- Place image on right side of hero text
- Image URL: https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png
- Keep in rounded, glassy frame

**Prompt 26: Update Favicon**
- Change to: https://ik.imagekit.io/vv1coyjgq/drumkiitz%20favicon2.png
- 180x180 resolution

**Prompt 27: Create Modern Circular Waveform (Create 2.0 Only)**
- Design circular/pizza-style waveform
- Plays clockwise
- Map amplitudes around dial
- Support playback indicator and slice selection
- Keep linear waveform in original Create page

---

## Phase 9: Navigation & Authentication UI

**Prompt 28: Simplify Navigation Structure**
- Remove sub-pages from single-item sections
- Home = single link (no subs)
- Create = single link (no Create 2.0 in navbar)
- Pricing = separate main page under Market
- Only show icons for main pages, not subs

**Prompt 29: Streamline Sign In/Up**
- Remove Sign In and Sign Up from navbar
- Add floating Sign In button to top-right of all pages
- Button slightly transparent (background)
- Becomes more transparent on scroll but stays visible
- Opens dialog on click for auth form

**Prompt 30: Add Post-Login UI Elements**
- Show Notifications and Cart icons only when logged in
- Position where Sign In button was
- Show only icons
- Display name on hover (Notifications, Basket)

---

## Phase 10: Marketing & Landing Pages

**Prompt 31: Create Marketing Landing Page**
- New page at / (root) for unauthenticated users
- Marketing/promo page with Get Started CTA
- Include screenshot of Create page in builder showcase
- Flow section: "Drag. Slice. Publish. Repeat"
- Features section: Kit-ready output, Secure sharing, AI acceleration
- Testimonial section with quote
- Get Started button links to /home
- See the Builder button links to /create

**Prompt 32: Update Homepage for Logged-In Users**
- Hero with "Create an account to get started" and "Create your own drum kit" cards
- Click "Create an account" = signup popup
- Click "Create your kit" = goes to /create page
- Logo in navbar: 
  - If NOT logged in → links to /
  - If logged in → links to /create

**Prompt 33: Update Copy for Producers**
- Change all copy to target beat makers and sound designers
- Focus on drum kit workflows, samples, one-shots
- Not about "making songs"
- Emphasize: "creating the sound of tomorrow"
- Mention: extract from favorite songs, get drum kits, share kits
- Appeal to "producers creating the sound of tomorrow"

**Prompt 34: Improve Visual Hierarchy in Create**
- Color-code different input sections for clarity
- Make it easy to separate what needs to be selected
- Use yellow accents to highlight key areas
- Reduce visual noise/blending

---

## Phase 11: Backend & Data Structure Planning

**Prompt 35: Plan Database Schema**
Tables needed:
- `users` (id, username, avatar_url, created_at)
- `kits` (id, user_id, name, artwork_url, slices, status, visibility, created_at)
- `slices` (id, kit_id, start_ms, end_ms, type, metadata, created_at)
- `projects` (id, user_id, status, source_file_url, last_step, created_at)
- `kit_versions` (id, kit_id, revision_notes, stem_urls)
- `kit_assets` (id, kit_id, file_type, storage_path, duration, tags)
- Enable Row Level Security on sensitive tables

**Prompt 36: Implement Supabase**
- Set up Supabase project (Postgres + Auth)
- Add environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- Create client helpers (lib/supabase-client.ts, lib/supabase-admin.ts)
- Replace localStorage auth mock with Supabase Auth
- Create API routes for CRUD operations (/api/kits, etc.)

---

## Phase 12: Image Generation Integration

**Prompt 37: Integrate Stable Horde for Kit Artwork**
- Create lib/stable-horde.ts helper
- Create /api/kit-artwork POST endpoint
- Use STABLE_HORDE_KEY from .env.local
- Generate artwork for dummy kits
- Return Base64 data URLs
- Use prompts like: "futuristic drum kit cover" with varied descriptions

---

## Phase 13: Final Polish

**Prompt 38: Update Button Colors**
- "Get started it's free" button
- Change from pink to suit yellow/grey/black palette
- Use amber/gold theme

**Prompt 39: Add Create Page Screenshot to Marketing**
- Place screenshot below pricing section
- Position after workflow description
- Before testimonial section
- Image: https://ik.imagekit.io/vv1coyjgq/Screenshot%202025-11-14%20at%2013.26.56.png

**Prompt 40: Refine Create Page Layout**
- Auto-extract on left (full height)
- Upload/Record side-by-side on right (half height each)
- YouTube full-width below (double height)
- All inputs on right side, extraction on left

**Prompt 41: Fix Drag & Drop Upload**
- Unified select + drag-zone
- "Select audio file" header button
- Dashed "drag & drop" area below
- Drag events highlight the zone
- Drop calls existing handler

**Prompt 42: Remove Unnecessary Elements**
- Remove "Submit a kit" from marketplace
- Remove pricing from About page
- Remove "Showing GBP — amounts rounded..." from pricing pages
- Remove stats from Create page (move to About)
- Remove feature tiles from Create page (move to About)

**Prompt 43: Centralize Pricing Data**
- Create lib/pricing.ts with shared tier definitions
- Use same data on /pricing and /create
- Ensure consistency between pages
- Default Tier 2 ("Popular") selection

---

## Quick Reprompt Template

When you want to rebuild, you can use this condensed format:

```
Rebuild DrumKitzz with these phases:

1. Global: Apply yellow/grey/black theme, update waveform colors, scale navbar logo
2. Audio: Add trim preview, fix recording timer, add waveform cursor, click-select
3. Nav: Reorganize into groups (My Kits, Market, About), make Home/Create single links
4. Create: Reorganize layout (extraction left, inputs right), add kit output selector
5. Pricing: Add 3-tier pricing with localized currency conversion
6. Marketing: Create landing page with promo copy, add Create page screenshot
7. UI: Improve visual hierarchy, add drag-drop, refine styling
8. Backend: Plan Supabase schema (ready for integration, don't implement yet)
9. Images: Add Stable Horde integration for kit artwork
```

---

## Files Most Changed

- `components/navbar.tsx` - Navigation restructuring
- `components/create/drum-slicer-pro.tsx` - Create page layout & styling
- `app/page.tsx` - Marketing landing page
- `app/home/page.tsx` - Updated homepage
- `app/pricing/page.tsx` - Pricing page
- `app/layout.tsx` - Global layout with Sign In overlay
- `app/globals.css` - Theme variables & colors
- `lib/pricing.ts` - Centralized pricing data
- `lib/stable-horde.ts` - Image generation integration
- `app/api/kit-artwork/route.ts` - Artwork generation endpoint

---

## Next: Supabase Implementation

Once the UI is rebuilt, the follow-up prompts would be:
- Create database tables with migrations
- Implement real authentication
- Persist kits/projects to database
- Replace mock data with DB queries
- Add payment processing (Stripe integration)
