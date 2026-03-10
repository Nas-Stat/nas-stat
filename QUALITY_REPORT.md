# Quality Report — PR #76 (Issue #73)

**MapTiler API key for local development**

**Reviewer:** The Squirrel (re-audit #3)
**Branch:** `issue-73-maptiler-key`
**PR:** #76
**Date:** 2026-03-10
**Commits reviewed:** 4 (`e17ae58`..`10b1761`)

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

Third audit. **No commits since the last two reviews — all three showstoppers remain unfixed.** The core feature is solid: MapTiler key works, maps load, env strategy is clean, security is good. But CI is red, an empty test exists, and `parseLocation` has zero coverage. Cannot merge.

---

## Critical Issues (Showstoppers) — STILL OPEN

### 1. CI is RED — Lint fails

```
src/app/page.tsx:50:11 — <a> instead of <Link /> (@next/next/no-html-link-for-pages)
src/app/reports/actions.test.ts:192 — unused vars (warnings)
```

Pre-existing, but CI must be green to merge. Fix the `<a>` → `<Link>` in `page.tsx`.

### 2. Empty test — zero assertions (`Map.test.tsx:330-339`)

```ts
it('defaults to dataviz style when showHeatmap is true', () => {
  render(<Map showHeatmap={true} />);
  // 6 lines of comments explaining why it CAN'T assert anything
  // Zero expect() calls
});
```

A test without assertions is worse than no test. Either capture constructor args in the mock to assert dataviz was used, or delete it.

### 3. `parseLocation` — zero test coverage

`src/utils/geo.ts` is a new 36-line utility doing hex buffer parsing with hardcoded byte offsets (`buf.readDoubleLE(9)`, `buf.readDoubleLE(17)`). Imported by 3 pages (`dashboard/page.tsx`, `reports/page.tsx`, `reports/[id]/page.tsx`). No `geo.test.ts` exists.

Needs tests for: valid GeoJSON, valid WKB hex, null input, malformed hex, short buffer.

---

## Code Smells & Improvements (Non-blocking)

### 4. `schema.test.ts:280` — semantically wrong assertion

```ts
expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
```

This passes only because `.env.development` has a **comment** containing the string. The test was written when the key was present as an actual var. Meanwhile `env.test.ts:18-23` correctly strips comments before checking. The `schema.test.ts:280` assertion should be updated or removed to avoid false confidence.

### 5. `queueMicrotask` hack (`Map.tsx:138-143`)

```ts
setIsLoaded(false);
queueMicrotask(() => setIsLoaded(true));
```

Fragile approach to re-trigger the reports effect after style change. A `styleVersion` counter as a dependency would be more robust.

### 6. `as unknown as string` triple-cast (`Map.tsx:24-26`)

Acceptable workaround for MapTiler SDK types, but consider `String()` coercion to be more explicit.

### 7. PR bundles 4 issues (#67, #68, #69, #73)

Makes review harder. Future PRs should be 1:1 with issues.

---

## Test Coverage

| File | Tests | Status |
|------|-------|--------|
| `Map.test.tsx` | 21 (13 existing + 8 new) | Pass (1 empty — no assertions) |
| `env.test.ts` | 5 | Pass — well written |
| `schema.test.ts` | 30 | Pass (1 semantically wrong) |
| `geo.ts` | 0 | **No tests** |

**353/353 tests pass** locally. CI lint blocks the pipeline.

---

## What's Good

- **Env strategy** is well designed — `.env.development` for safe defaults, `.env.local` for secrets
- **Security test** in `env.test.ts:18-23` correctly strips comments before checking for service role key
- **XSS protection** in `Map.tsx:44-51` — `escapeHtml` on all user content in popups
- **Docker compose** changes are clean — `env_file` with optional `.env.local`, `host.docker.internal`
- **API key guard** (`Map.tsx:91-93`) correctly rejects `placeholder` and `your-maptiler-key-here`
- **MapTiler key** is free-tier, public — safe to commit as `NEXT_PUBLIC_`

---

## Final Verdict

**SUSPICIOUS NUT — Cannot merge yet.**

Three fixes required:

1. **Fix CI** — `<a>` → `<Link>` in `src/app/page.tsx:50`
2. **Fix or delete empty test** — `Map.test.tsx:330` needs assertions or removal
3. **Add `parseLocation` tests** — `src/utils/geo.ts` needs a `geo.test.ts`

Once fixed → merge and close #73.
