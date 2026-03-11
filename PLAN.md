# Detailed Technical Roadmap: Náš stát (Our State)

Tento dokument slouží jako detailní architektonický plán pro vývojový tým (Oompa Loompas), odvozený z high-level vize.

## Phase 1: "The Instant Pulse MVP" (Zlatý Tiket)

**Architektonický cíl:** Plně funkční lokální vývojové prostředí v Dockeru, základní Next.js aplikace, bezpečná autentizace (Google, Email) přes Supabase a napojení na MapTiler.

### Epic 1.1: Základní infrastruktura a Setup (Foundation)

- [x] **Story 1.1.1: Inicializace Next.js a repozitáře**
  - [x] Vytvořit novou Next.js aplikaci (App Router, TypeScript, Tailwind CSS).

  - [x] Nastavit ESLint, Prettier.

- [x] **Story 1.1.2: Lokální vývojové prostředí (Docker)**
  - [x] Vytvořit `Dockerfile` a `docker-compose.yml` pro lokální běh Next.js aplikace.
  - [x] Zajistit, aby se změny v kódu okamžitě projevovaly i uvnitř kontejneru (hot-reloading).
- [x] **Story 1.1.3: Kostra dokumentace (README)**
  - [x] Vytvořit `README.md` s instrukcemi pro lokální spuštění přes Docker (hotovo, průběžně aktualizovat).
  - [x] Připravit sekce pro budoucí dokumentaci produkčního a testovacího nasazení.

### Epic 1.2: Databáze a Autentizace (Supabase)

- [x] **Story 1.2.1: Supabase Projekt & Schéma**
  - [x] Založit Supabase projekt.
  - [x] Vytvořit základní SQL tabulky: `users`, `reports` (s podporou PostGIS pro lokaci - lat, lng), `topics`, `votes`.
  - [x] Nastavit Row Level Security (RLS), aby data mohl číst každý, ale zapisovat jen přihlášený uživatel.
- [x] **Story 1.2.2: Autentizace uživatelů**
  - [x] Integrovat `@supabase/ssr` pro Next.js.
  - [x] Implementovat přihlášení pomocí Emailu/Hesla.
  - [x] Implementovat přihlášení pomocí Google OAuth.
  - [x] Vytvořit jednoduché UI pro login/registraci.

### Epic 1.3: Geografické hlášení (MapTiler)

- [x] **Story 1.3.1: Integrace mapy**
  - [x] Integrovat MapTiler pomocí maplibregl nebo react-map-gl.
  - [x] Zobrazit mapu s možností navigace (pan, zoom).
- [x] **Story 1.3.2: Vkládání "špendlíků" (Reports)**
  - [x] Umožnit uživateli kliknout do mapy a umístit špendlík.
  - [x] Vytvořit formulář (drawer/modal) pro přidání hodnocení (1-5 hvězd, text, kategorie) k dané lokaci.
  - [x] Uložit data do Supabase (vyžaduje přihlášení z Epicu 1.2).
- [x] **Story 1.3.3: Zobrazení existujících hlášení**
  - [x] Načíst hlášení ze Supabase a zobrazit je jako body na mapě (např. barevně odlišené podle hodnocení).

- [x] **Story 1.3.4: Refactor and Polish Reports (Issue #6 cleanup)**
  - [x] Fix linter failures by removing `any` types in `ReportsClient.test.tsx` and `reports/page.tsx`.
  - [x] Replace `window.location.reload()` with `useRouter().refresh()` in `ReportsClient.tsx`.
  - [x] Implement robust `zod` validation in `createReport` server action.

### Epic 1.4: Tématické hlášení a Dashboard

- [x] **Story 1.4.1: Feed témat**
  - [x] Vytvořit UI pro zobrazení seznamu aktuálních témat bez geografické vazby.
  - [x] Umožnit přihlášeným uživatelům hlasovat (palec nahoru/dolů) a přidat komentář.
- [x] **Story 1.4.2: Základní Pulse Dashboard**
  - [x] Jednoduchá analytická stránka zobrazující agregovaná data (např. nejnovější hlášení, nejvíce diskutovaná témata).

- [x] **Story 1.4.3: Refactor and Polish Topics (Issue #9 cleanup)**
  - [x] Implement toggleable voting (removing a vote when clicking the same type again).
  - [x] Implement Optimistic UI for voting and commenting.
  - [x] Replace `alert()` with better error feedback in the UI.
  - [x] Add comprehensive tests for Topics and Pulse Dashboard.

---

## Phase 2: "The Analytics Factory" (Pro Úředníky a Média)

### Epic 2.1: Přístupnost a veřejné čtení

- [x] **Story 2.1.1: Veřejné čtení bez přihlášení (Issue #12)**
  - [x] Upravit middleware (`src/utils/supabase/proxy.ts`), aby `/reports` a `/topics` (GET) byly veřejně přístupné.
  - [x] Ověřit, že RLS politiky v Supabase povolují SELECT bez autentizace (již bylo nastaveno).
  - [x] Na stránce `/topics` skrýt hlasovací tlačítka pro nepřihlášené — zobrazit read-only počty hlasů a odkaz na přihlášení.
  - [x] Napsat testy pro middleware (veřejné vs. chráněné routes) v `src/utils/supabase/proxy.test.ts`.

- [x] **Story 2.1.2: Stránkování a filtrování hlášení (Issue #13)**
  - [x] Implementovat stránkování (offset-based, PAGE_SIZE=20) v `src/app/reports/page.tsx`.
  - [x] Přidat URL parametry `?page=`, `?status=`, `?category=` pro filtrování.
  - [x] Upravit `ReportsClient.tsx` — přidat ovládací prvky pro filtry (status, kategorie) a navigaci stránek.
  - [x] Supabase dotaz omezit pomocí `.range()` a `.eq()` pro aktivní filtry.
  - [x] Zachovat kompatibilitu s mapovým pohledem (heatmapa/piny) — mapa zobrazuje aktuálně filtrované záznamy.
  - [x] Napsat testy pro logiku filtrování a stránkování.


### Epic 2.2: Admin panel

- [x] **Story 2.2.1: Admin panel — správa hlášení (Issue #14)**
  - [x] Navrhnout a přidat admin role — tabulka `admins` (supabase/migrations/20260301000000_add_admin_role.sql)
  - [x] Vytvořit migraci pro admin role
  - [x] Vytvořit `src/app/admin/page.tsx` — Server Component s přehledem hlášení
  - [x] Vytvořit `src/app/admin/AdminClient.tsx` — Client Component pro změnu statusu hlášení
  - [x] Vytvořit `src/app/admin/actions.ts` — Server Action pro update statusu s Zod validací
  - [x] Middleware ochrání `/admin` — pouze přihlášení uživatelé s admin rolí
  - [x] Napsat testy pro admin actions a middleware

- [x] **Story 2.2.2: Moderace obsahu (Issue #15)**
  - [x] Přidat tlačítko "Smazat" u každého tématu v admin panelu
  - [x] Přidat tlačítko "Smazat" u každého komentáře v admin panelu
  - [x] Vytvořit Server Actions `deleteTopic` a `deleteComment` v `src/app/admin/actions.ts`
  - [x] Implementovat potvrzovací dialog před smazáním (`window.confirm`)
  - [x] Zajistit kaskádové mazání (hlasy a komentáře tématu) v akci
  - [x] RLS: smazání povoleno pouze pro admin roli (migrace `20260301000001_admin_delete_policies.sql`)
  - [x] Napsat testy pro delete actions (12 nových testů)

### Epic 2.4: CI/CD Pipeline a Staging

- [x] **Story 2.4.1: CI/CD pipeline a staging nasazení (Issue #17)**
  - [x] Vytvořit `.github/workflows/ci.yml` — lint + test + build při každém PR
  - [x] Vytvořit `.github/workflows/deploy.yml` — deploy na staging při merge do `main`
  - [x] Napsat testy pro validaci struktury workflow souborů
  - [x] Zdokumentovat postup nasazení v README

- [x] **Story 2.4.2: Produkční nasazení (Issue #18)**
  - [x] Vytvořit `.github/workflows/deploy-production.yml` — deploy na produkci při tagu `v*` nebo manuálně
  - [x] Integrovat Vercel Analytics (`@vercel/analytics`) do `layout.tsx`
  - [x] Aktualizovat `.env.example` o `NEXT_PUBLIC_SENTRY_DSN` proměnnou pro monitoring
  - [x] Zdokumentovat produkční konfiguraci v README (doména, DNS, Supabase migrace, secrets)
  - [x] Napsat testy pro validaci struktury `deploy-production.yml` (16 nových testů)

## Phase 3: "The Omnipresent Pulse" (Rozšíření)

_(Detailní plánování bude následovat po dokončení Fáze 2)_

### Epic 3.1: UI Redesign

- [x] **Story 3.1.1: Redesign Reports page UI (Issue #39)**
  - [x] Header.tsx already in layout — no inline header to replace
  - [x] Filter bar: replaced `<select>` elements with pill/chip button groups
  - [x] FAB (floating action button): 56×56px circle at bottom-right, blue-600, Plus icon
  - [x] ReportForm sidebar: rounded-lg inputs, blue focus ring, blue submit button
  - [x] Updated tests: 29 tests in `ReportsClient.test.tsx` (226 total pass)
- [x] **Story 3.1.2: Redesign Topics page UI (Issue #40)**
  - [x] Header.tsx already in layout — page title moved to `page.tsx` as `<h1>`
  - [x] Cards: `shadow-sm hover:shadow-md transition-shadow` for hover depth
  - [x] Voting: pill-style buttons (`rounded-full px-3 py-1.5`)
  - [x] FAB: 56×56px circle, bottom-right, blue-600, Plus icon (`data-testid="new-topic-fab"`)
  - [x] Login CTA: fixed floating banner for logged-out users (`data-testid="login-cta"`)
  - [x] Comment input: pill-style (`rounded-full`)
  - [x] Updated tests: 19 tests in `TopicsClient.test.tsx` (233 total pass)
- [x] **Story 3.1.3: Redesign Dashboard page UI (Issue #41)**
  - [x] Removed inline `<header>` — page title moved to `<h1>` consistent with Topics/Reports pages
  - [x] Stat cards: colored icon backgrounds (`bg-blue-100`, `bg-yellow-100`, `bg-green-100`), `hover:shadow-md transition-shadow`, `data-testid` attributes
  - [x] Heatmap: card wrapper (`rounded-xl border bg-white p-6 shadow-sm`), `data-testid="heatmap-section"`
  - [x] Lists: `hover:bg-zinc-50 transition-colors` on each row for consistency with other pages
  - [x] Updated tests: 10 tests in `page.test.tsx` (219 total pass)

---

## Phase 4: Map Enhancements

### Epic 4.1: Layer Switcher

- [x] **Story 4.1.1: Map layer switcher — streets/hybrid/dataviz (Issue #74)**
  - [x] Add `MAP_STYLES` record mapping `streets | hybrid | dataviz` to MapTiler style enums with Czech labels.
  - [x] `getInitialStyle()` reads `localStorage` (key `nasstat-map-style`); defaults to `dataviz` when `showHeatmap=true`, else `streets`.
  - [x] `handleStyleChange()` calls `map.setStyle()`, persists to `localStorage`, re-triggers reports effect via `styledata` event + `isLoaded` toggle.
  - [x] Style switcher UI in bottom-left corner, visible after map loads; hidden in heatmap mode.
  - [x] 5 new tests in `Map.test.tsx` covering UI visibility, style switching, localStorage persistence, heatmap mode hiding.

## Phase 5: Data Model Extensions

### Epic 5.2: Reverzní geokódování (Issue #80)

- [x] **Story 5.2.1: Region columns + reverse geocoding (Issue #80)**
  - [x] `supabase/migrations/20260312000000_add_region_columns.sql` — `region_kraj`, `region_orp`, `region_obec` TEXT columns on `reports`
  - [x] `src/utils/geocode.ts` — `reverseGeocode(lng, lat)` using MapTiler Geocoding API; non-blocking, returns nulls on failure
  - [x] `src/app/reports/actions.ts` — call `reverseGeocode` after `createReport` insert; update region columns when data available
  - [x] `supabase/seed.sql` — backfill region data for 10 known Czech cities across all 120 seed reports
  - [x] `src/utils/geocode.test.ts` — 9 tests covering all paths (missing key, API parse, fallback, error handling)

### Epic 5.1: Categories and Territory Constants

- [x] **Story 5.1.1: Categories table in DB + territory constants (Issue #79)**
  - [x] `supabase/migrations/20260311000000_add_categories_table.sql` — `categories` table (id, slug, label, sort_order) with RLS: SELECT public, INSERT/UPDATE/DELETE admin only
  - [x] `supabase/seed.sql` — seed 8 categories with ON CONFLICT upsert
  - [x] `src/lib/territories.ts` — `TerritoryLevel` type, `KRAJE` (14 regions), `ORP_LIST` (206 static ORP entries)
  - [x] `src/app/reports/page.tsx` — fetch categories from DB, pass as `{ slug, label }[]` to client
  - [x] `src/app/reports/ReportsClient.tsx` — accepts `categories` prop, renders DB-sourced category filter pills
  - [x] `src/lib/territories.test.ts` — 11 tests for KRAJE/ORP_LIST
  - [x] `supabase/schema.test.ts` — 5 new tests: migration file, columns, RLS, seed slugs, idempotency

### Epic 5.3: User Preferences & Onboarding

- [x] **Story 5.3.1: Preferences na profilu + onboarding flow (Issue #81)**
  - [x] `supabase/migrations/20260313000000_add_preferences.sql` — `preferences JSONB DEFAULT '{}'` and `onboarding_completed BOOLEAN DEFAULT false` on `profiles`; existing users backfilled as `onboarding_completed = true`
  - [x] `src/components/PreferencesForm.tsx` — shared form: territory level selector (kraj/orp), territory multi-select, category checkboxes; reused in settings and onboarding
  - [x] `src/app/settings/page.tsx`, `SettingsClient.tsx`, `actions.ts` — settings page with `updatePreferences()` server action (Zod validation)
  - [x] `src/app/onboarding/page.tsx`, `OnboardingClient.tsx` — welcome + PreferencesForm + Skip button; redirects to /dashboard after saving
  - [x] `src/utils/supabase/proxy.ts` — onboarding redirect: authenticated users with `onboarding_completed = false` redirected to `/onboarding` (exempt: `/onboarding`, `/settings`, `/login`, `/auth/*`, `/logout`, `/`)
  - [x] `src/components/HeaderClient.tsx` — Settings link added for authenticated users (desktop + mobile)
  - [x] Tests: `PreferencesForm.test.tsx` (9), `settings/actions.test.ts` (6), `OnboardingClient.test.tsx` (4), `proxy.test.ts` (+5 onboarding tests), `schema.test.ts` (+4 migration tests) — 422 total pass

## Hotfixes / Perf Issues

- [x] **Issue #22: Consolidate double reports fetch in dashboard page**
  - [x] Add `created_at` to single `reportsResponse` select columns
  - [x] Remove `latestReportsResponse` query entirely
  - [x] Derive `latestReports` from `allReportsData` in JS (sort + slice)
  - [x] Update and extend tests (single-query mock, 2 new tests)
