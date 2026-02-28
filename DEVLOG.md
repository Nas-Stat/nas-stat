# Developer Log

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