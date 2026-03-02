# Quality Report — Issue #21: Extract shared status labels/colours constant (DRY)

**Reviewer:** The Squirrel
**PR:** `issue-21-report-status-constants` → `main`
**Date:** 2026-03-02
**Scope:** 8 files changed — full DRY sweep after initial SUSPICIOUS NUT audit

---

## Status: ✅ GOOD NUT

---

## Executive Summary

All four SUSPICIOUS NUT blockers resolved. The acceptance criterion "Single source of truth for status labels and colours" is now **fully met**. Every file that previously maintained its own copy of status labels or colours now imports from `src/lib/reportStatus.ts`.

**204/204 tests pass. Lint clean.**

---

## Changes Since Initial Audit

| File | Resolution |
|------|-----------|
| `src/app/admin/AdminClient.tsx` | Removed local `STATUS_LABELS` + `STATUS_COLORS`; imports `STATUS_LABELS` + `ADMIN_STATUS_COLORS` from `reportStatus.ts`. `<select>` options derived from entries. |
| `src/app/reports/ReportsClient.tsx` | `STATUS_OPTIONS` now derived from `STATUS_LABELS` — no hardcoded Czech strings. |
| `src/lib/email.ts` | Imports base `STATUS_LABELS`, spreads it, overrides only `pending` with email-context long form. Explicit and documented. |
| `src/components/Map.tsx` | Pointless `const statusColors = STATUS_COLORS` aliases removed; imports used directly with `??` fallback (consistent with dashboard). |
| `src/lib/reportStatus.ts` | Added `ADMIN_STATUS_COLORS` export (dark-mode + yellow pending). |
| `src/lib/reportStatus.test.ts` | 4 additional tests for `ADMIN_STATUS_COLORS`. Total: 9 tests. |

---

## Test Coverage Analysis

| Area | Status |
|------|--------|
| Total tests | **204/204 PASS** (19 test files) |
| ESLint | **Clean** (0 errors, 0 warnings) |
| `reportStatus.test.ts` | 9 tests — exhaustiveness, Czech strings, Tailwind format, key-set parity, ADMIN_STATUS_COLORS coverage |

---

## Decision

**GOOD NUT — Ready to merge.**

Single source of truth achieved. All five locations that previously duplicated status data now import from `reportStatus.ts`. Adding a sixth status requires editing exactly one file.
