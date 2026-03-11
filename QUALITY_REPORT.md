# Quality Report — Issue #80 / PR #87

**feat: reverzní geokódování + region sloupce na reports**

**Reviewer:** The Squirrel (audit #2 — post-fix)
**Branch:** `issue-80-reverse-geocoding`
**PR:** #87 (base: main)
**Date:** 2026-03-11
**Tests:** 394/394 pass | Lint: 0 errors (2 pre-existing warnings, unrelated) | TypeScript: clean

---

## Status: 🟢 GOOD NUT

---

## Executive Summary

All required actions from audit #1 have been resolved. The feature delivers working reverse geocoding via MapTiler API with `region_kraj`/`region_orp`/`region_obec` columns on reports. Schema tests added for the new migration, integration tests added for the geocoding path in `actions.ts`, misleading comment fixed, and error logging added for the update call. Ready to merge.

---

## Fixes Applied (vs. Audit #1)

| # | Issue | Resolution |
|---|-------|------------|
| 1 | No schema test for region columns migration | ✅ Added 3 tests in `supabase/schema.test.ts`: file exists, all 3 columns present, seed backfill verified |
| 2 | No integration test for geocoding in `createReport` | ✅ Added 3 tests in `actions.test.ts`: `reverseGeocode` called with correct coords, `.update()` called with region data, geocoding skipped when no location |
| 3 | Misleading "Non-blocking" comment | ✅ Changed to "Post-insert geocoding" |
| 4 | No error check on `.update()` result | ✅ Added `console.error` on update failure |

---

## Test Coverage Analysis

### `src/utils/geocode.test.ts` — 9 tests ✅
- Missing/placeholder API key → returns nulls, no fetch
- Correct URL construction with coordinates and key
- Parses `region.`, `county.`, `district.`, `locality.`, `place.` context IDs
- Fallback to feature name for `obec`
- Empty features array → nulls
- Network error (fetch throws) → nulls
- Non-OK HTTP status → nulls

### `src/app/reports/actions.test.ts` — 27 tests ✅ (+3 new)
- `reverseGeocode` called with correct `lng, lat`
- `.update()` called with region data when geocoding succeeds
- `reverseGeocode` NOT called when location is absent

### `supabase/schema.test.ts` — 38 tests ✅ (+3 new)
- Region columns migration file exists
- All 3 columns (`region_kraj`, `region_orp`, `region_obec`) in migration
- Seed backfills region data with known Czech region names

Full suite: **394/394 pass.**

---

## Security Review

- Migration uses `IF NOT EXISTS` — safe for re-runs ✅
- No new RLS policies needed (existing report policies cover new columns) ✅
- `reverseGeocode` catches all errors internally — no server crash risk ✅
- API key is `NEXT_PUBLIC_` (already exposed client-side for map tiles) — no secret leak ✅
- No SQL injection risk — Supabase client handles parameterization ✅

---

## What's Good

- **Clean geocode module** — single responsibility, well-typed interfaces, defensive error handling
- **Thorough geocode tests** — 9 tests covering all code paths including edge cases
- **Correct context parsing** — handles MapTiler's varying admin hierarchy (`county.` vs `district.`, `locality.` vs `place.`)
- **Smart fallback** — uses feature name as `obec` when context doesn't provide locality
- **Seed backfill** — all 10 cities get correct region data with proper kraj/ORP/obec mapping
- **Insert-then-update pattern** — report is saved first, geocoding can't block creation

---

## Final Verdict

**🟢 GOOD NUT — Ready to ship.**
