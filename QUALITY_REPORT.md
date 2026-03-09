# Quality Report — Issue #55 / PR #61

**feat: DB migrace civic roles + report lifecycle rozšíření (closes #55)**

**Reviewer:** The Squirrel (independent audit)
**PR:** #61 (`issue-55-civic-roles` → `main`)
**Date:** 2026-03-09
**Scope:** 5 files changed, 218 lines added

---

## Status: 🟢 GOOD NUT — fixes applied 2026-03-09

---

## Executive Summary

The implementation is solid and well-structured. Migration SQL is clean, the trigger function properly validates roles, RLS policies are correctly scoped, and the `roles.ts` helper module is well-typed. All 258 tests pass, CI is green, the PR is mergeable. **However**, two issues prevent a clean 🟢: (1) `reportStatus.test.ts` was not updated — the `KNOWN_STATUSES` array still only has 4 statuses, so the new `escalated` status has no explicit test coverage for its label, color, or dark-mode classes; (2) a lint warning from an unused `Role` type import in `roles.test.ts`. Neither is a showstopper, but both should be fixed before merge.

---

## Acceptance Criteria vs Issue #55

| Criterion (from issue) | Status |
|-------------------------|--------|
| Migration: `role` + `role_verified` columns on `profiles` | PASS |
| Migration: backfill existing users as verified citizens | PASS |
| Migration: `assigned_to` + `escalated_to_role` columns on `reports` | PASS |
| Migration: extend status CHECK to include `escalated` | PASS |
| Migration: update `handle_new_user()` trigger | PASS — includes role validation, citizen auto-verify |
| Migration: RLS — verified officials can update reports | PASS |
| Migration: RLS — admins can update any profile | PASS — references existing `public.admins` table |
| `src/lib/roles.ts` — ROLES, LABELS, COLORS, HIERARCHY, helpers | PASS |
| `src/lib/reportStatus.ts` — add `escalated` status | PASS |
| `src/lib/roles.test.ts` — test helper functions | PASS — 10 tests |
| `supabase/schema.test.ts` — verify new migration | PASS — 7 new tests added |
| **`reportStatus.test.ts` — updated for `escalated`** | **MISSING** |

---

## Critical Issues (Showstoppers)

**None.** The code is functionally correct.

---

## Code Smells & Improvements

### 1. `reportStatus.test.ts` — `KNOWN_STATUSES` not updated (test gap)

**File:** `src/lib/reportStatus.test.ts:4`

The `KNOWN_STATUSES` array still reads:
```ts
const KNOWN_STATUSES = ['pending', 'in_review', 'resolved', 'rejected'] as const;
```

It should include `'escalated'`. Without it:
- The Czech label for `escalated` (`'Eskalováno'`) is not explicitly verified
- The dark-mode class check for `escalated` in `ADMIN_STATUS_COLORS` is not tested
- The iteration-based coverage checks skip `escalated` entirely

The key-set equality tests (lines 36–39, 56–59) provide *indirect* coverage — they'd catch if `escalated` were missing from one map but not another. But explicit per-status verification is missing.

**Fix:** Add `'escalated'` to `KNOWN_STATUSES` and add a specific Czech label assertion:
```ts
expect(STATUS_LABELS.escalated).toBe('Eskalováno');
```

### 2. Unused `Role` type import in `roles.test.ts` (lint warning)

**File:** `src/lib/roles.test.ts:9`

```
9:8  warning  'Role' is defined but never used  @typescript-eslint/no-unused-vars
```

Either use it (e.g., type a variable in tests) or remove the import.

---

## Security & Performance

- **Trigger function is secure:** validates role against allow-list, defaults to `citizen` for invalid values — prevents role injection via `raw_user_meta_data`
- **RLS policies are properly scoped:** officials must be `role_verified = true`, admin policy references the existing `public.admins` table
- **`SECURITY DEFINER` on trigger:** appropriate — the trigger runs on `auth.users` and inserts into `public.profiles`, which requires elevated privileges
- **No new API endpoints or client-facing mutations** — this is a foundation layer only
- **`DROP CONSTRAINT IF EXISTS`** before re-adding: safe migration pattern, avoids failure on re-run

---

## Test Coverage

| Metric | Value |
|--------|-------|
| Total test files | 20 |
| Total tests | 258 (all pass) |
| New: `roles.test.ts` | 10 tests |
| Extended: `schema.test.ts` | 11 tests (7 new for civic roles migration) |
| CI status | Green (Lint, Test & Build) |
| Lint | 0 errors, 1 warning |

### New/Changed test details:

| Test | What it verifies |
|------|-----------------|
| `roles.test.ts` (10 tests) | ROLES array, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_HIERARCHY order, getEscalationTarget (4 roles), isOfficialRole (citizen vs officials) |
| `schema.test.ts` (+7 tests) | Migration file exists, role columns, backfill, assignment/escalation columns, extended status CHECK, trigger update, RLS policies |

---

## Final Verdict

**🟡 SUSPICIOUS NUT — Ship with caution.**

The implementation quality is high. Migration SQL, TypeScript helpers, and new tests are all well-crafted. The two issues are minor and easy to fix:

1. Add `'escalated'` to `KNOWN_STATUSES` in `reportStatus.test.ts` + add explicit Czech label check
2. Remove unused `Role` import from `roles.test.ts`

**Recommendation:** Fix both nits, then this is a clean 🟢 merge. Do not merge as-is — the test gap means a future regression to `escalated` status rendering could slip through.
