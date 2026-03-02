# Quality Report — Issue #36 / PR #46

**feat: optional location for reports**

**Reviewer:** The Squirrel
**PR:** #46 (`issue-36-optional-location` → `main`)
**Date:** 2026-03-02
**Scope:** 11 files changed (+145 / -48)

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

The implementation delivers the core ask: users can now create reports without geographic location. The DB migration, Zod schema, server action, and null-safe filtering are all correctly implemented. Tests pass (208/208), lint is clean. However, there are two issues that prevent a clean merge: (1) reports created without a location are invisible — they're filtered out before rendering on both the reports page and the dashboard, with no alternative list view, and (2) the Zod schema allows the inconsistent state of providing `lng` without `lat` (or vice versa) without validation error.

**208/208 tests pass. Lint clean.**

---

## Acceptance Criteria Checklist

| Criterion | Verdict |
|-----------|---------|
| DB migration: `location DROP NOT NULL` | PASS |
| Zod schema: `lng`/`lat` optional | PASS (with caveat — see Code Smells) |
| Insert: `POINT(lng lat)` when both present, `null` otherwise | PASS |
| `ReportsClient.tsx`: `openFormWithoutLocation` handler | PASS |
| `ReportsClient.tsx`: floating "Nahlásit podnět" button | PASS |
| `ReportForm.tsx`: `hasLocation` prop + info bar | PASS |
| `reports/page.tsx`: null-safe filter before `<Map>` | PASS |
| `dashboard/page.tsx`: null-safe filter before `<Map>` | PASS |
| Create report without location → saves with `location = null` | PASS |
| Create report with location → works as before | PASS |
| Dashboard and map don't crash on null location | PASS |
| `npm run test` passes | PASS (208/208) |
| `npm run lint` clean | PASS |

---

## Critical Issues (Showstoppers)

### 1. Location-less reports are invisible after creation

Reports without a location are filtered out in **both** `reports/page.tsx:53` and `dashboard/page.tsx:43` before being passed to the client. Since the only view is a map, these reports are created successfully but **never displayed anywhere**. A user creates a "celostátní téma" report and it vanishes.

The issue ticket says "Vytvořit podnět bez lokace → uloží se s `location = null`" — that works. But the ticket also implies these reports should be *usable*. Right now they're write-only.

**Recommendation:** Either add a list/card view alongside the map for location-less reports, or at minimum flag this as an intentional limitation (and open a follow-up ticket). This is a product-level decision, not a code bug — but it makes the feature incomplete.

---

## Code Smells & Improvements

### 1. Zod schema allows `lng` without `lat` (and vice versa)

```ts
lng: z.coerce.number().optional(),
lat: z.coerce.number().optional(),
```

These are independently optional. Providing `lng=14.4` without `lat` passes validation, then silently produces `location = null` (because the insert logic checks `lng != null && lat != null`). This should be enforced at the schema level with a `.refine()`:

```ts
.refine(
  (d) => (d.lng == null) === (d.lat == null),
  { message: 'Musíte zadat obě souřadnice, nebo žádnou.' }
)
```

**Severity:** Low (client always sends both or neither), but violates defense-in-depth.

### 2. Dead `?new=1` query parameter

The homepage links to `/reports?new=1` for logged-in users (`page.tsx:55`), but no code in `reports/page.tsx` or `ReportsClient.tsx` reads the `new` param. The form does not auto-open. The old code had a `<button>` (also non-functional), so this isn't a regression, but the `?new=1` is misleading dead code.

**Recommendation:** Either handle `new=1` to auto-open the form, or remove the param from the URL.

### 3. `Report` type doesn't reflect optional location

The `Report` interface in `Map.tsx` has `location: { lng: number; lat: number }` as required. The code works around this by filtering before type conversion, but this creates a hidden contract: "always filter null locations before creating Report objects". If someone forgets the filter, it'll crash at runtime. Consider making `location` optional in the type and handling it downstream.

---

## Security & Performance

- **No SQL injection risk**: location string is built from Zod-validated numbers (`z.coerce.number()`), so `POINT(${lng} ${lat})` is safe.
- **No XSS risk**: no user-generated content is rendered as raw HTML in the new code.
- **No N+1 queries**: single Supabase query with filter, same as before.
- **Performance note**: the `.filter()` before `.map()` on `reportsData` is O(n) and negligible. If location-less reports grow to a large fraction of total reports, the pagination count will be off (count includes filtered-out reports) — but this is minor for now.

---

## Test Coverage Analysis

- **New tests added:** 2 (report without location success + failure)
- **Updated tests:** 3 (homepage button→link, mock update)
- **Coverage is adequate** for the server action changes
- **Missing test:** No test verifies that the floating "Nahlásit podnět" button appears for logged-in users and calls `openFormWithoutLocation`. The existing `ReportsClient.test.tsx` doesn't test this new UI path.
- **Missing test:** No test for the `hasLocation` info bar rendering in `ReportForm`.

---

## Decision

**🟡 SUSPICIOUS NUT — Ship with caution.**

The code is functional and well-structured, but the feature is incomplete: users can create location-less reports that then disappear. This needs a product decision before merging.

**Required before merge:**
1. Decide on visibility of location-less reports (list view, or explicit follow-up ticket acknowledging the gap).
2. Add `.refine()` to Zod schema to prevent `lng` without `lat`.

**Nice-to-have:**
3. Handle `?new=1` or remove it.
4. Add tests for the new floating button and `hasLocation` info bar.
