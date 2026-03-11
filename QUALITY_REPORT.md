# Quality Report — Issue #79 / PR #85

**feat: categories table in DB + territory constants**

**Reviewer:** The Squirrel (re-audit #2)
**Branch:** `issue-79-categories-territories`
**PR:** #85 (base: main)
**Date:** 2026-03-11
**Tests:** 379/379 pass | Lint: 0 errors (2 pre-existing warnings, unrelated) | TypeScript: pre-existing errors in TopicsClient tests (not from this PR)

---

## Status: 🔴 BAD NUT

---

## Executive Summary

Second audit. The previous Squirrel review identified a **critical slug mismatch** — it was NOT fixed. Additionally, the PR branch is polluted with **14 unrelated commits** from issues #67, #68, #69, #73, #74, #75 that have already been merged to main separately. Only 2 of 16 commits are actually #79 work. This PR cannot be merged in its current state.

---

## Critical Issues (Showstoppers)

### 1. 🔴 Category slug mismatch (UNFIXED from previous audit)

**Files:** `supabase/seed.sql:9-18` (categories table) vs `supabase/seed.sql:141` (report generation)

The `categories` table seeds slugs: `zivotni-prostredi`, `skolstvi`, `zdravotnictvi`, `dopravni-infrastruktura`, `energetika`, `fungovani-uradu`, `bezpecnost`, `jine`

But report generation (line 141) still uses OLD hardcoded values:
```sql
categories TEXT[] := ARRAY['Infrastruktura', 'Doprava', 'Zeleň', 'Úřad', 'Bezpečnost', 'Jiné'];
```

**Impact:** After `supabase db reset`, all 120 seed reports have category values that don't match any slug in the `categories` table. Category filtering on `/reports` is broken — clicking any category pill returns zero results.

**Fix:** Update `seed.sql:141` to use slugs, update `schema.test.ts:168-176` which asserts old names.

### 2. 🔴 Dirty PR branch — 14 unrelated commits

```
git log --oneline main..issue-79-categories-territories
```
shows 16 commits, but only 2 are #79 work:
- `bb61b96 feat: categories table in DB + territory constants (closes #79)`
- `20566b2 test: add schema tests for categories migration and seed (closes #79)`

The other 14 commits are from issues #67, #68, #69, #73, #74, #75 — all already merged to main via their own PRs. Merging this PR would create duplicate/conflicting history.

**Fix:** Rebase onto current main: `git rebase main` — the unrelated commits should drop as already-applied.

---

## Code Smells & Improvements

| # | Issue | Severity | File | Detail |
|---|-------|----------|------|--------|
| 1 | **ORP count: 193 vs ~206** | Medium | `src/lib/territories.ts:33` | JSDoc says `206 ORP` but array has **193 entries**. Either complete the list or fix the comment to say `193`. |
| 2 | **Duplicated `Category` interface** | Low | `ReportsClient.tsx:12`, `ReportForm.tsx:6` | Same `{ slug: string; label: string }` defined in two files. Extract to shared type. |

---

## Test Coverage Analysis

- **Territories:** 11 tests — uniqueness, cross-references, spot checks. Solid.
- **ReportsClient:** 29 tests — slug-based category filtering, URL building, form rendering. Proper.
- **Schema tests:** 5 new tests for categories migration. Good coverage of migration structure and seed idempotency.
- **Gap:** No test verifies that `reports.category` values match `categories.slug` values. This is the exact gap that allows the slug mismatch to slip through undetected.

Full suite: **379/379 pass.** All pass because no test cross-validates the two data sets.

---

## Security Review

- RLS: 4 policies on `categories` — SELECT public, INSERT/UPDATE/DELETE admin-only via `admins` table. Correct.
- No hardcoded secrets. No injection vectors.
- `reports.category` remains TEXT without FK — intentional per spec for backwards compatibility.
- `ON CONFLICT (slug) DO UPDATE` in seed is idempotent. Good.

---

## What's Good

- Clean migration with proper RLS design
- DB-driven categories architecture (page.tsx fetches, passes as props) — correct pattern
- Territory data well-structured with NUTS 3 codes and ORP cross-references
- Comprehensive test suite (16 new tests added across 3 files)
- `ON CONFLICT` upsert for idempotent seeding

---

## Required Fixes Before Merge

1. **🔴 CRITICAL: Align seed report categories with `categories` table slugs** — update `seed.sql:141`
2. **🔴 CRITICAL: Rebase branch onto main** — remove 14 stale commits from unrelated issues
3. **Update `schema.test.ts:168-176`** — assert new slugs instead of old Czech names
4. **Fix ORP comment** — `territories.ts:33` says 206, actual is 193

---

## Final Verdict

**🔴 BAD NUT — Do NOT merge.** Two critical blockers: (1) the slug mismatch from the first audit remains unfixed — category filtering is broken with seed data; (2) the branch carries 14 unrelated commits. Rebase, fix the slugs, re-submit.
