# Week 8 Information Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight public information module for Zucarlink that publishes curated news, blog posts, events, and price indicators, supports 20 initial content items, and drives users toward registration and forum participation without expanding beyond the MVP.

**Architecture:** Use a dedicated `content` feature that follows the existing repo pattern: public routes in `src/routes/AppRouter.tsx`, page shells in `src/pages`, domain logic in `src/features/content`, and Supabase as the single source of truth. Keep editorial operations manual through SQL seed data and a small seeding script instead of building a CMS or backoffice.

**Tech Stack:** React 19, TypeScript, React Router, Supabase Postgres/RPC-friendly queries, Vitest, Testing Library, Vite.

---

## Scope decisions locked for Week 8

- Module name: `Información`
- Public route family: `/informacion`
- Information architecture:
  - `/informacion`
  - `/informacion/noticias`
  - `/informacion/blog`
  - `/informacion/eventos`
  - `/informacion/precios`
  - `/informacion/:slug`
- Blog and news stay separated in navigation but share the same underlying `content_items` table.
- Events use card/list view, not calendar.
- Prices are a lightweight manually curated indicator block, not a live market feed.
- All content is public to read.
- The module must reinforce acquisition and engagement with visible CTAs to `/register` and `/forum`.
- Editorial workflow is manual for now: migration + seed script + optional SQL verification query.

## Files map

### Create

- `src/features/content/types.ts`
- `src/features/content/api.ts`
- `src/features/content/content-flows.test.tsx`
- `src/features/content/components/ContentCard.tsx`
- `src/features/content/components/EventCard.tsx`
- `src/features/content/components/PriceCard.tsx`
- `src/features/content/components/TagBadge.tsx`
- `src/features/content/components/SectionHeader.tsx`
- `src/features/content/components/ContentFilters.tsx`
- `src/features/content/components/FeaturedContent.tsx`
- `src/pages/InformationHubPage.tsx`
- `src/pages/NewsListPage.tsx`
- `src/pages/BlogListPage.tsx`
- `src/pages/EventsPage.tsx`
- `src/pages/PricesPage.tsx`
- `src/pages/ContentDetailPage.tsx`
- `supabase/migrations/20260416_000008_content_week8.sql`
- `scripts/seed-week8-content.mjs`
- `docs/week8-content-sources.md`
- `supabase/sql/verify_content_week8.sql`

### Modify

- `src/routes/AppRouter.tsx`
- `src/layouts/PublicLayout.tsx`
- `src/layouts/PrivateLayout.tsx`
- `src/pages/HomePage.tsx`
- `src/test/fakes/supabase.ts`
- `README.md`

### Reuse without major edits

- `src/lib/supabase.ts`
- `src/test/render-app.tsx`
- `package.json`

## Delivery sequence

1. Define the data model and route contract.
2. Add Supabase schema, policies, indexes, and read functions.
3. Seed 20 curated items.
4. Build the public UI and integrate CTAs.
5. Cover critical flows with tests.
6. Verify build, lint, typecheck, and tests.
7. Document editorial sources and operating procedure.

---

### Task 1: Lock data model and route contract

**Files:**
- Create: `src/features/content/types.ts`
- Modify: `src/routes/AppRouter.tsx`
- Test: `src/routes/AppRouter.test.tsx`

- [ ] **Step 1: Write the failing route test**

Add route coverage in `src/routes/AppRouter.test.tsx` for:
- anonymous user can render `/informacion`
- anonymous user can render `/informacion/noticias`
- anonymous user can render `/informacion/blog`
- anonymous user can render `/informacion/eventos`
- anonymous user can render `/informacion/precios`

- [ ] **Step 2: Run the route test to verify it fails**

Run: `npm test -- src/routes/AppRouter.test.tsx`
Expected: FAIL because the new routes and page components do not exist yet.

- [ ] **Step 3: Add content domain types**

Define in `src/features/content/types.ts`:
- `ContentType = 'news' | 'blog'`
- `ContentCategory`
- `ContentStatus = 'draft' | 'published'`
- `ContentItem`
- `EventItem`
- `PriceItem`
- `ContentListFilters`
- `FeaturedContentBlock`

Required field rules:
- `title`, `slug`, `summary`, `publishedAt`, `status`, `tags`
- `sourceName` and `sourceUrl` optional but strongly expected for curated content
- `body` required for detail pages on `news` and `blog`
- `isFeatured` optional default false

- [ ] **Step 4: Add route stubs in the router**

Wire these imports and routes in `src/routes/AppRouter.tsx`:
- `InformationHubPage`
- `NewsListPage`
- `BlogListPage`
- `EventsPage`
- `PricesPage`
- `ContentDetailPage`

Route decision:
- `path="informacion/:slug"` resolves only article/news content
- events remain only in `/informacion/eventos`

- [ ] **Step 5: Run the route test to verify it passes**

Run: `npm test -- src/routes/AppRouter.test.tsx`
Expected: PASS for the new public routes once page shells exist.

- [ ] **Step 6: Commit**

```bash
git add src/features/content/types.ts src/routes/AppRouter.tsx src/routes/AppRouter.test.tsx
git commit -m "feat: add week 8 information routes and content types"
```

---

### Task 2: Add Supabase schema, policies, and read queries

**Files:**
- Create: `supabase/migrations/20260416_000008_content_week8.sql`
- Create: `supabase/sql/verify_content_week8.sql`
- Create: `src/features/content/api.ts`
- Modify: `src/test/fakes/supabase.ts`
- Test: `src/features/content/content-flows.test.tsx`

- [ ] **Step 1: Write the failing API tests**

Cover these cases in `src/features/content/content-flows.test.tsx`:
- list only published `news` items ordered by `published_at desc`
- list only published `blog` items ordered by `published_at desc`
- fetch content detail by slug
- list published events ordered by `start_date asc`
- list published price items ordered by `observed_at desc`
- hide drafts from public queries

- [ ] **Step 2: Run the API test to verify it fails**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: FAIL because tables, API helpers, and fake tables are missing.

- [ ] **Step 3: Create SQL schema**

In `supabase/migrations/20260416_000008_content_week8.sql`, create:

- `content_items`
  - `id uuid primary key default gen_random_uuid()`
  - `type text check in ('news','blog')`
  - `title text not null`
  - `slug text not null unique`
  - `summary text not null`
  - `body text not null`
  - `category text not null`
  - `country text null`
  - `source_name text null`
  - `source_url text null`
  - `cover_image_url text null`
  - `tags text[] not null default '{}'`
  - `is_featured boolean not null default false`
  - `status text not null default 'draft' check in ('draft','published')`
  - `published_at timestamptz not null`
  - `created_at timestamptz not null default timezone('utc', now())`
  - `updated_at timestamptz not null default timezone('utc', now())`

- `events`
  - `id uuid primary key default gen_random_uuid()`
  - `title text not null`
  - `slug text not null unique`
  - `summary text not null`
  - `start_date date not null`
  - `end_date date null`
  - `city text null`
  - `country text null`
  - `organizer text null`
  - `source_url text null`
  - `cover_image_url text null`
  - `tags text[] not null default '{}'`
  - `status text not null default 'draft' check in ('draft','published')`
  - `created_at timestamptz not null default timezone('utc', now())`
  - `updated_at timestamptz not null default timezone('utc', now())`

- `price_items`
  - `id uuid primary key default gen_random_uuid()`
  - `label text not null`
  - `value text not null`
  - `unit text null`
  - `observed_at date not null`
  - `source_name text null`
  - `source_url text null`
  - `notes text null`
  - `status text not null default 'draft' check in ('draft','published')`
  - `created_at timestamptz not null default timezone('utc', now())`
  - `updated_at timestamptz not null default timezone('utc', now())`

Required SQL rules:
- create indexes on content type, content status, published date, event start date, price observed date
- add update timestamp triggers if the repo already uses that pattern; otherwise inline `updated_at` updates only where needed
- enable RLS
- allow public `select` only for rows where `status = 'published'`
- reserve write access for service role / SQL migration / future admin path only

- [ ] **Step 4: Add verification SQL**

In `supabase/sql/verify_content_week8.sql`, add checks for:
- table existence
- RLS enabled
- policies present
- published rows selectable
- draft rows blocked from anon access

- [ ] **Step 5: Implement frontend API**

In `src/features/content/api.ts`, add:
- `listPublishedContent(type: 'news' | 'blog', filters?)`
- `getPublishedContentBySlug(slug: string)`
- `listPublishedEvents()`
- `listPublishedPrices()`
- `listFeaturedContent(limitCount?: number)`

Implementation rules:
- use `getSupabaseBrowserClient()` like existing `forum/api.ts`
- return stable typed objects
- order from the database query
- fail with readable errors

- [ ] **Step 6: Extend the Supabase fake**

Update `src/test/fakes/supabase.ts` with tables:
- `content_items`
- `events`
- `price_items`

Support:
- `select`
- `eq`
- `order`
- `in`
- `maybeSingle`

- [ ] **Step 7: Run the API tests**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260416_000008_content_week8.sql supabase/sql/verify_content_week8.sql src/features/content/api.ts src/features/content/content-flows.test.tsx src/test/fakes/supabase.ts
git commit -m "feat: add week 8 content schema and public queries"
```

---

### Task 3: Seed 20 curated items and define editorial sources

**Files:**
- Create: `scripts/seed-week8-content.mjs`
- Create: `docs/week8-content-sources.md`
- Modify: `README.md`
- Test: `supabase/sql/verify_content_week8.sql`

- [ ] **Step 1: Prepare the editorial source document**

In `docs/week8-content-sources.md`, document:
- 8 to 10 priority sources
- editorial quality rules
- taxonomy rules
- distribution target:
  - 8 news
  - 4 blogs
  - 4 events
  - 4 prices

- [ ] **Step 2: Prepare the content seed script**

Create `scripts/seed-week8-content.mjs` using the same style as existing seed scripts.

Responsibilities:
- read Supabase credentials from env
- upsert 20 curated entries
- keep slugs stable
- mark 3 to 5 content items as featured
- seed `content_items`, `events`, and `price_items`

Editorial rules:
- do not copy full third-party content
- use summaries written by Zucarlink
- include `source_name` and `source_url`
- use tags from the Week 8 taxonomy

- [ ] **Step 3: Document execution in README**

Add a small Week 8 section to `README.md`:
- migration command
- seed command
- verify SQL file reference

- [ ] **Step 4: Run the seed and verification in a connected environment**

Run:
- migration apply command used by this repo
- `node scripts/seed-week8-content.mjs`
- execute `supabase/sql/verify_content_week8.sql`

Expected:
- 20 published rows distributed across the three tables
- featured content available
- no draft leakage

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-week8-content.mjs docs/week8-content-sources.md README.md
git commit -m "feat: add week 8 editorial seeds and source guide"
```

---

### Task 4: Build reusable content UI components

**Files:**
- Create: `src/features/content/components/ContentCard.tsx`
- Create: `src/features/content/components/EventCard.tsx`
- Create: `src/features/content/components/PriceCard.tsx`
- Create: `src/features/content/components/TagBadge.tsx`
- Create: `src/features/content/components/SectionHeader.tsx`
- Create: `src/features/content/components/ContentFilters.tsx`
- Create: `src/features/content/components/FeaturedContent.tsx`
- Modify: `src/styles/index.css`
- Test: `src/features/content/content-flows.test.tsx`

- [ ] **Step 1: Write the failing component expectations**

Add or extend tests to assert:
- content cards show title, summary, source, date, main tag, and CTA
- event cards show date range, city/country, organizer, and external link
- price cards show value, observed date, source, and note
- filters can switch between categories or search terms without crashing

- [ ] **Step 2: Run component tests to verify they fail**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement the UI primitives**

Design constraints:
- reuse the current site styling language
- avoid introducing a design system dependency
- keep cards readable and public-first
- make tags and metadata scan quickly on mobile
- include empty and loading states

- [ ] **Step 4: Add the required CSS**

In `src/styles/index.css`, add only the classes needed for:
- information hero
- card grids and list stacks
- filter row
- tag badges
- featured strip
- CTA banner
- responsive breakpoints

- [ ] **Step 5: Run tests**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: PASS for component rendering and interaction coverage.

- [ ] **Step 6: Commit**

```bash
git add src/features/content/components src/styles/index.css src/features/content/content-flows.test.tsx
git commit -m "feat: add reusable information module components"
```

---

### Task 5: Build public pages and connect content flows

**Files:**
- Create: `src/pages/InformationHubPage.tsx`
- Create: `src/pages/NewsListPage.tsx`
- Create: `src/pages/BlogListPage.tsx`
- Create: `src/pages/EventsPage.tsx`
- Create: `src/pages/PricesPage.tsx`
- Create: `src/pages/ContentDetailPage.tsx`
- Modify: `src/pages/HomePage.tsx`
- Test: `src/features/content/content-flows.test.tsx`

- [ ] **Step 1: Write the failing page-flow tests**

Cover:
- hub page renders featured content and links to all subsections
- news page lists only news content
- blog page lists only blog content
- detail page renders title, summary, body, source, tags, and CTAs
- events page renders upcoming and past labels
- prices page renders indicators with source and observation date
- home page shows a compact information preview

- [ ] **Step 2: Run the page-flow tests**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement the pages**

Behavior rules:
- `InformationHubPage` shows:
  - small hero
  - 3 to 5 featured pieces
  - cards linking to news, blog, events, prices
  - CTA to forum and register
- `NewsListPage` and `BlogListPage` show:
  - simple search input
  - optional category filter
  - pageless MVP list
- `ContentDetailPage` shows:
  - title
  - published date
  - source
  - optional image
  - Zucarlink summary/body
  - why it matters
  - tags
  - bottom CTA
- `EventsPage` shows simple grouped listing:
  - upcoming first
  - past below
- `PricesPage` shows:
  - 4 indicator cards
  - note that indicators are curated, not real-time

- [ ] **Step 4: Integrate a homepage preview**

Update `src/pages/HomePage.tsx` with a public preview block:
- heading aligned to Week 8
- 2 or 3 latest pieces
- CTA to `/informacion`

- [ ] **Step 5: Run the page-flow tests**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/InformationHubPage.tsx src/pages/NewsListPage.tsx src/pages/BlogListPage.tsx src/pages/EventsPage.tsx src/pages/PricesPage.tsx src/pages/ContentDetailPage.tsx src/pages/HomePage.tsx src/features/content/content-flows.test.tsx
git commit -m "feat: add public information pages and homepage preview"
```

---

### Task 6: Integrate navigation, SEO basics, and CTA paths

**Files:**
- Modify: `src/layouts/PublicLayout.tsx`
- Modify: `src/layouts/PrivateLayout.tsx`
- Modify: `src/pages/InformationHubPage.tsx`
- Modify: `src/pages/NewsListPage.tsx`
- Modify: `src/pages/BlogListPage.tsx`
- Modify: `src/pages/ContentDetailPage.tsx`
- Test: `src/features/content/content-flows.test.tsx`

- [ ] **Step 1: Write the failing integration expectations**

Assert:
- public navbar includes `Información`
- private navbar includes a path back to public information or keeps the public discovery visible
- content pages include CTA links to `/register` and `/forum`
- headings hierarchy remains sensible

- [ ] **Step 2: Run the tests**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: FAIL until navigation and CTAs are wired.

- [ ] **Step 3: Update navigation**

Public nav:
- add `/informacion`

Private nav:
- add `/informacion` only if it does not overcrowd navigation; otherwise surface it from the app dashboard.

Preferred choice:
- add `/informacion` to public nav
- do not add it to private top nav unless there is clear room
- surface it in app home later if needed

- [ ] **Step 4: Add SEO basics without new dependencies**

For each page, set:
- stable `<h1>`
- descriptive intro copy
- internal links

If the repo already has a head/meta pattern by Week 8, use it.
If not, do not add a meta library; keep the plan limited to semantic structure, slugs, and internal linking.

- [ ] **Step 5: Run the tests**

Run: `npm test -- src/features/content/content-flows.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/PublicLayout.tsx src/layouts/PrivateLayout.tsx src/pages/InformationHubPage.tsx src/pages/NewsListPage.tsx src/pages/BlogListPage.tsx src/pages/ContentDetailPage.tsx src/features/content/content-flows.test.tsx
git commit -m "feat: integrate information module into navigation and ctas"
```

---

### Task 7: Full verification and release checklist

**Files:**
- Modify as needed based on failures found during verification

- [ ] **Step 1: Run targeted tests**

Run:
- `npm test -- src/routes/AppRouter.test.tsx`
- `npm test -- src/features/content/content-flows.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run full project verification**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

Expected: all PASS.

- [ ] **Step 3: Manual verification**

Check these flows:
- `/informacion` renders with featured items
- `/informacion/noticias` shows only news
- `/informacion/blog` shows only blog posts
- `/informacion/eventos` shows events
- `/informacion/precios` shows indicators
- `/informacion/:slug` resolves a published content item
- content routes work logged out
- register and forum CTAs work
- home page preview links correctly

- [ ] **Step 4: Release notes**

Document in the task closure:
- what shipped
- which 20 items were loaded
- known editorial limitations
- next-week dependencies

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: verify and finalize week 8 information module"
```

---

## Acceptance checklist

- [ ] Public `Información` module exists and is reachable from main navigation.
- [ ] News and blog listing pages are separate but share one content backend.
- [ ] Events and prices are visible publicly.
- [ ] Only published content is visible anonymously.
- [ ] 20 curated items are seeded.
- [ ] 3 to 5 items are featured.
- [ ] Content pages push users toward registration and forum participation.
- [ ] No CMS or editorial dashboard was introduced.
- [ ] Tests, lint, typecheck, and build pass.

## Risks and constraints

- The biggest delivery risk is editorial throughput, not frontend complexity. The 20-item target should be prepared in parallel with schema and UI work.
- Avoid live feeds or scraping during Week 8. They would dilute the week and create fragile dependencies.
- Do not create comments, reactions, or newsletter flows inside the content module yet.
- If metadata management is not already present in the repo, keep SEO work limited to semantic HTML, internal links, stable slugs, and discoverable public pages.

## Suggested execution split across the week

1. Day 1: Task 1 and Task 2
2. Day 2: Task 3
3. Day 3: Task 4
4. Day 4: Task 5
5. Day 5: Task 6 and Task 7

## Week 8 outcome definition

Week 8 is complete only if a public visitor can discover Zucarlink content, open a curated article, view events and indicators, and encounter working paths into registration and forum participation while the team can maintain the module manually with minimal operational overhead.
