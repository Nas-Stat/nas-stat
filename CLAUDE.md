# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier (writes in place)
npm run test         # Run all tests (vitest run)

# Run a single test file
npx vitest run src/app/reports/actions.test.ts

# Docker (full local stack)
docker-compose up --build
```

## Environment Variables

Copy `.env.example` to `.env` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPTILER_KEY` (falls back to MapLibre demo tiles if missing/placeholder)

Local Supabase stack: `supabase start` (requires Supabase CLI).

## Architecture

**Náš stát** is a Czech civic platform for geo-tagged public space reports and topic-based discussions. Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + PostGIS + Auth), MapLibre GL, Zod, Vitest.

### Page pattern

Each feature follows a consistent three-file pattern:

- `page.tsx` — **Server Component**: fetches data from Supabase, passes it as props
- `*Client.tsx` — **Client Component**: handles interactivity, optimistic UI, form state
- `actions.ts` — **Server Actions** (`'use server'`): mutations with Zod validation, call `revalidatePath` after writes

### Supabase clients

Three separate clients for different contexts:
- `src/utils/supabase/server.ts` — Server Components and Server Actions (cookie-based SSR)
- `src/utils/supabase/client.ts` — Client Components (browser)
- `src/utils/supabase/proxy.ts` — Middleware session refresh

Middleware lives in `src/proxy.ts` and redirects unauthenticated users to `/login` for all routes except `/`, `/login`, and `/auth/*`.

### Database schema

Tables (all with RLS): `profiles`, `reports`, `topics`, `votes`, `comments`. Migrations in `supabase/migrations/`.

- **reports**: Geographic location stored as `GEOGRAPHY(POINT, 4326)`. Insert format: `POINT(lng lat)`. PostgREST returns this as a GeoJSON object — server components must destructure `location.coordinates[0]` (lng) and `[1]` (lat).
- **topics**: Non-geographic discussion threads; `created_by` references `profiles.id`.
- **votes**: Polymorphic — targets either `topic_id` or `report_id` (not both), one vote per user per target enforced by unique constraints.
- **profiles**: Auto-created on signup via `handle_new_user` trigger on `auth.users`.
- Report status values: `pending | in_review | resolved | rejected` (Czech labels: Čeká / V řešení / Vyřešeno / Zamítnuto).

### Map component (`src/components/Map.tsx`)

Client component wrapping MapLibre GL. Key behaviors:
- Map initializes once on mount; subsequent prop changes update via separate `useEffect` hooks (avoids re-initialization).
- Callbacks stored in refs to prevent stale closure issues.
- Supports two render modes: marker pins (default) or heatmap (`showHeatmap` prop).
- Selection marker is draggable and calls `onMapClick` on drag end.
- Default center: Prague `[14.4378, 50.0755]`.

### Optimistic UI

`TopicsClient.tsx` uses React 19's `useOptimistic` for votes and comments — immediate UI update before server confirmation, with `router.refresh()` to sync server state after the action resolves.

### Testing

Tests are colocated with source files (`*.test.ts` / `*.test.tsx`). Vitest + jsdom + `@testing-library/react`. The `supabase/schema.test.ts` file validates migration SQL structure (tables, RLS policies) by reading the file directly.
