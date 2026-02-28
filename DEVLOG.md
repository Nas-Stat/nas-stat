# Developer Log

## 2026-02-28 - Finalize Report Creation and Pinning (Issue #7 - Story 1.3.2)

### Changes

- Verified and polished the implementation of report creation and map pinning.
- Added comprehensive unit tests for `createReport` server action in `src/app/reports/actions.test.ts`.
- Expanded `ReportsClient.test.tsx` and `page.test.tsx` to include form submission and PostGIS data transformation verification.
- Confirmed that "Story 1.3.2: Vkládání špendlíků" is fully implemented and tested.
- Note: Previous logs mis-identified some stories with issue numbers; this entry correctly maps Story 1.3.2 to GitHub Issue #7.

### Verification

- Ran `npm test src/app/reports/`: PASS (10 tests).
- Verified validation logic and PostGIS `POINT` conversion.

## 2026-02-28 - Performance Polish and Refactoring (Issue #6 final)

### Changes

- Resolved critical performance regression in `Map` component where it was re-initialized on every user interaction.
- Split map `useEffect` logic: one for one-time initialization (on mount) and another for view updates (`center`, `zoom`).
- Used `useRef` to store latest `onMapClick` callback, removing it from `useEffect` dependency array.
- Memoized `handleMapClick` and `closeForm` in `ReportsClient` using `useCallback`.
- Extracted the report submission form into a separate, clean `ReportForm` component in `src/app/reports/ReportForm.tsx`.
- Added regression tests in `Map.test.tsx` to verify that `map.remove()` is not called unnecessarily when props change.
- Updated `QUALITY_REPORT.md` back to [🟢 GOOD NUT].

### Verification

- Ran `npm test`: PASS (34 tests).
- Verified map stability via unit tests.
- Verified TypeScript compilation: Clean.

## 2026-02-28 - Refactor and Polish Reports (Story 1.3.4 - Issue #6 cleanup)

### Changes

- Fixed linter failures by removing 'any' types in `ReportsClient.test.tsx` and `src/app/reports/page.tsx`.
- Replaced 'window.location.reload()' with 'router.refresh()' in `ReportsClient.tsx` for better Next.js integration.
- Implemented robust 'zod' validation in 'createReport' server action in `src/app/reports/actions.ts`.
- Mocked `next/navigation` in `ReportsClient.test.tsx` to fix tests after adding `useRouter`.
- Verified all tests pass (30 tests) and linting is clean.

## 2026-02-28 - Implement Report Creation and Visualization (Story 1.3.2 & 1.3.3 - Issue #6)

### Changes

- Updated `Map` component to support interactive marker placement, dragging, and display of existing reports.
- Implemented `ReportsClient` as a client-side wrapper for the reports page, handling map interactions and the report submission form.
- Created `createReport` Server Action in `src/app/reports/actions.ts` for secure report submission to Supabase.
- Updated `/reports` page to fetch the current user and existing reports from Supabase.
- Added color-coded markers for reports based on their rating (red for ≤ 2, blue otherwise).
- Implemented category selection (Infrastruktura, Doprava, Zeleň, etc.) and 5-star rating system.
- Added comprehensive unit tests for `ReportsClient` and updated `ReportsPage` and `Map` tests.
- Resolved GitHub issue #6 (Story 1.3.2 & 1.3.3).

### Verification

- Ran `npm test`: PASS (22 tests)
- Verified Server Action logic for PostGIS coordinate conversion.
- Verified RLS policies for `reports` table (authenticated users can insert, anyone can select).

## 2026-02-28 - Secure Auth Actions and Add Server-Side Validation (Issue #5)

### Changes

- Installed `zod` for robust server-side schema validation.
- Implemented `authSchema` in `src/app/login/actions.ts` to validate email (format) and password (length).
- Added comprehensive unit tests for `login`, `signup`, `signInWithGoogle`, and `logout` server actions in `src/app/login/actions.test.ts`.
- Fixed potential `TypeError` in `signInWithGoogle` by adding optional chaining to the `data` object.
- Ensured all auth actions now have 100% test coverage and perform proper input validation.
- Resolved "SUSPICIOUS NUT" findings from the Tech Lead's report for GitHub issue #5.

### Verification

- Ran `npm test src/app/login/actions.test.ts`: PASS (9 tests).
- Verified error redirection and message passing for both validation and Supabase errors.

## 2026-02-28 - Integrate MapTiler with MapLibre GL (Story 1.3.1 - Issue #5)

### Changes

- Installed `maplibre-gl` for map visualization.
- Created a reusable `Map` component in `src/components/Map.tsx`.
- Implemented `/reports` page in `src/app/reports/page.tsx` that displays the map.
- Added a "Zobrazit mapu" link on the Home page to navigate to the map.
- Added comprehensive unit tests for the `Map` component and the `Reports` page.
- Configured the map to use MapTiler style if `NEXT_PUBLIC_MAPTILER_KEY` is provided, otherwise falling back to a default MapLibre style.
- Resolved GitHub issue #5 (Story 1.3.1).

### Verification

- Ran `npm test`: PASS (17 tests)
- Verified map rendering with mocked `maplibre-gl` in tests.

## 2026-02-28 - Framework Upgrade and RLS Policy Hardening

### Changes

- Renamed `src/middleware.ts` to `src/proxy.ts` to address Next.js 16 deprecation warning.
- Renamed `src/utils/supabase/middleware.ts` to `src/utils/supabase/proxy.ts` for consistency.
- Updated the `middleware` function to `proxy` and all related imports.
- Replaced brittle string-matching tests in `supabase/schema.test.ts` with robust regex-based RLS verification for all tables.
- Added `auth.role() = 'authenticated'` check to the `profiles` table `INSERT` policy for consistency.
- Updated `QUALITY_REPORT.md` to reflect the fixed status [🟢 GOOD NUT].

### Verification

- Ran `npm run build`: SUCCESS (Clean build, no warnings).
- Ran `npm test`: PASS (14 tests).
- Verified RLS policies in `initial_schema.sql`.

## 2026-02-28 - Security Fix for topics Table RLS (Finalizing Issue #4)

### Changes

- Fixed security vulnerability in `topics` RLS policy where `created_by` was not being verified.
- Added `UPDATE` and `DELETE` policies for the `topics` table to allow only creators to modify or delete their own content.
- Resolved linter warning for unused variable `options` in `src/utils/supabase/middleware.ts`.
- Updated `supabase/schema.test.ts` to include more robust checks for the new security policies.
- Updated `QUALITY_REPORT.md` to reflect the fixed status [🟢 GOOD NUT].
- Fully resolved GitHub issue #4.

### Verification

- Ran `npm test`: PASS (14 tests)
- Manual inspection of SQL migration and middleware changes.

## 2026-02-28 - Implement Supabase Authentication (Story 1.2.2 - Issue #4)

### Changes

- Integrated `@supabase/ssr` into Next.js.
- Created Supabase client/server/middleware utilities in `src/utils/supabase/`.
- Implemented `middleware.ts` for session management and route protection.
- Created `src/app/login/page.tsx` with a clean UI for authentication.
- Implemented server actions for login, signup, logout, and Google OAuth in `src/app/login/actions.ts`.
- Added auth callback route in `src/app/auth/callback/route.ts`.
- Updated Home page to show current user and logout button.
- Added comprehensive unit tests for Home page (authenticated/unauthenticated states) and Login page.
- Configured Vitest path aliases to resolve `@/*` imports.
- Resolved GitHub issue #4 (Story 1.2.2).

### Verification

- Ran `npm test`: PASS (14 tests)
- Verified server actions and middleware structure.

## 2026-02-28 - Fix README.md and .gitignore (Story 1.1.3 - Issue #3)

### Changes

- Removed duplicate 'Running with Docker' sections from `README.md`.
- Added placeholder sections for future production and staging documentation to `README.md`.
- Cleaned up generic Next.js boilerplate text in `README.md`.
- Modified `.gitignore` to allow tracking of `.env.example`.
- Verified all existing tests pass.

### Verification

- Ran `npm test`: PASS (7 tests)
- Manual inspection of `README.md` and `.gitignore`.

## 2026-02-28 - Setup Supabase Schema and Configuration

### Changes

- Created initial SQL schema for Supabase in `supabase/migrations/20260228000000_initial_schema.sql`.
- Defined `profiles`, `reports`, `topics`, and `votes` tables with PostGIS and RLS.
- Added a trigger for automatic profile creation on user signup.
- Created `supabase/config.toml` for local Supabase configuration.
- Added `.env.example` for environment variable reference.
- Added tests for the database schema in `supabase/schema.test.ts`.
- Updated `README.md` with Supabase setup instructions.
- Resolved GitHub issue #3 (Story 1.2.1).

### Verification

- Ran `npm test`: PASS (7 tests)

## 2026-02-28 - Setup Docker Environment and Documentation

### Changes

- Created `Dockerfile` and `docker-compose.yml` for local development.
- Added `.dockerignore` to exclude unnecessary files from the Docker build.
- Updated `README.md` with instructions for running the application using Docker.
- Added more unit tests to `src/app/page.test.tsx` to verify page content.
- Resolved GitHub issue #2 (equivalent to Story 1.1.2 and Story 1.1.3).

### Verification

- Ran `npm test`: PASS
- Verified `docker-compose.yml` syntax.
- Updated `PLAN.md`.

## 2026-02-28 - Setup Prettier and Vitest

### Changes

- Installed `prettier`, `eslint-config-prettier`, `vitest`, and related testing libraries.
- Created `.prettierrc` for consistent code formatting.
- Integrated Prettier with ESLint in `eslint.config.mjs`.
- Added `format` and `test` scripts to `package.json`.
- Configured Vitest in `vitest.config.ts` and `vitest.setup.ts`.
- Added a baseline test in `src/app/page.test.tsx` to verify the setup.

### Verification

- Ran `npm test`: PASS
- Ran `npm run format`: SUCCESS
- Ran `npm run lint`: PASS