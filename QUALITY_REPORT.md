# Quality Report — Issue #74 / PR #78

**Map layer switcher (streets/hybrid/dataviz)**

**Reviewer:** The Squirrel (audit #3)
**Branch:** `issue-74-layer-switcher`
**PR:** #78 (base: main)
**Date:** 2026-03-11
**Tests:** 17/17 pass | Lint: 0 errors | CI: GREEN

---

## Status: 🔴 BAD NUT

---

## Executive Summary

Third audit. PR #77 (duplicate) was closed — that blocker is resolved. However, the two core blockers from audits #1 and #2 remain unfixed:

1. **PR #78 is still empty** — `gh pr diff 78 --name-only` returns only `DEVLOG.md` and `PLAN.md`. The actual implementation (Map.tsx +75 lines, Map.test.tsx +137 lines) exists on the branch but doesn't appear in the PR diff due to squash-merge history from #73/#76.

2. **Bug persists** — style switcher renders on the heatmap dashboard (`Map.tsx:319` has no `!showHeatmap` guard). The test passes as a false positive because it never fires the load event.

**Cannot merge. Cannot close ticket.**

---

## Critical Issues (Showstoppers)

### 1. PR #78 contains no implementation code

`gh pr diff 78 --name-only` → `DEVLOG.md`, `PLAN.md` only.

The layer switcher implementation was committed under `10b1761` and `016ef1a` (part of #73 scope). When PR #76 squash-merged those to main, the history diverged. The feature code is stranded — merging this PR would add zero functionality.

**Fix:** Re-commit the Map.tsx + Map.test.tsx changes as a new commit on this branch so they appear in the PR diff against main.

### 2. Bug: Style switcher visible in heatmap mode

`Map.tsx:319`:
```tsx
{isLoaded && (
  <div data-testid="style-switcher">
```

The spec says: "Heatmap mode (`showHeatmap=true`) locks to dataviz and hides the switcher." No `!showHeatmap` guard exists. The dashboard map will show all three style buttons.

**Fix:**
```tsx
{isLoaded && !showHeatmap && (
```

### 3. False-positive test masking the bug

`Map.test.tsx:330-335` — test "does not show style switcher when showHeatmap is true" never fires the map `load` event. `isLoaded` stays false, so the switcher is hidden for the wrong reason. This test would pass even without any showHeatmap logic.

**Fix:** Fire the load event before asserting, matching the pattern used in all other tests:
```tsx
it('does not show style switcher when showHeatmap is true', async () => {
  let onMapLoad: () => void = () => {};
  onMock.mockImplementation((event, callback) => {
    if (event === 'load') onMapLoad = callback;
  });

  render(<Map showHeatmap={true} />);

  await import('react').then((React) => {
    React.act(() => { onMapLoad(); });
  });

  expect(screen.queryByTestId('style-switcher')).toBeNull();
});
```

---

## Code Smells & Improvements (non-blocking)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | `queueMicrotask` hack to bounce `isLoaded` false→true for re-triggering effects after style change | Medium | Map.tsx:141-143 |
| 2 | `as unknown as string` double-cast on MapStyle enums | Low | Map.tsx:24-26 |
| 3 | Duplicate initial-style derivation (useState initializer + useEffect body both compute initial style) | Low | Map.tsx:78 vs 96 |
| 4 | No try/catch on `localStorage.setItem` (throws in Safari private browsing) | Low | Map.tsx:132 |

---

## Test Coverage Analysis

| Test | Verdict |
|------|---------|
| Shows style switcher after map loads | ✅ Correct |
| Calls setStyle when switching layers | ✅ Correct |
| Persists selected style to localStorage | ✅ Correct |
| Does not show switcher when showHeatmap=true | ❌ **FALSE POSITIVE** — never fires load |
| Reads saved style from localStorage on mount | ✅ Correct |
| API key tests (4 tests, #73 scope) | ✅ Correct |

**4/5 layer-switcher tests legitimate. 1 false positive masking a real bug.**

Full suite: 17/17 pass (Map.test.tsx). CI: green.

---

## Checklist vs. Issue #74 Spec

| Task | Status |
|---|---|
| Custom layer switcher UI in Map.tsx | ✅ Code exists, not in PR diff |
| `map.setStyle()` for 3 styles | ✅ Code exists, not in PR diff |
| Re-add markers/heatmap after style change | ✅ Code exists, not in PR diff |
| Dashboard default to DATAVIZ | ✅ Code exists, not in PR diff |
| Update tests in Map.test.tsx | ⚠️ 4/5 correct, 1 false positive |
| Persist to localStorage | ✅ Code exists, not in PR diff |
| **Switcher hidden when showHeatmap=true** | ❌ **BUG — guard missing** |

---

## Action Items (ordered)

1. ~~Close PR #77~~ ✅ Done
2. Fix `Map.tsx:319` — add `!showHeatmap` guard: `{isLoaded && !showHeatmap && (`
3. Fix `Map.test.tsx:330` — fire load event in "does not show switcher when showHeatmap" test
4. Re-commit Map.tsx + Map.test.tsx so changes appear in the PR #78 diff
5. Re-request Squirrel review

---

## Final Verdict

**🔴 BAD NUT — Do not merge.**

The underlying implementation is solid — clean types, localStorage persistence, proper style switching with layer re-initialization. Two fixes are needed: one 15-character code fix (`!showHeatmap &&`) and one test correction. Then the PR diff needs to actually contain the code. Fix these and this becomes a Good Nut.
