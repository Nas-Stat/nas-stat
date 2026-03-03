# Quality Report — Issue #38 / PR #49

**feat: civic-platform landing page (closes #38)**

**Reviewer:** The Squirrel
**PR:** #49 (`issue-38-redesign-landing` → `main`)
**Date:** 2026-03-03
**Scope:** 3 files changed (+87 / -47) + DEVLOG.md

---

## Status: 🟢 GOOD NUT

---

## Executive Summary

Clean, well-scoped PR. Replaces the Next.js boilerplate landing page with a proper civic-platform hero section + feature cards. The page now communicates what the platform does and provides clear CTAs for unauthenticated and authenticated users. Code is well-structured, semantic HTML is correct, dark mode and responsive design are handled. One minor issue found (duplicate test file) — fixed during review. 224/224 tests pass, lint clean, build clean.

---

## Acceptance Criteria Checklist

| Criterion | Verdict |
|-----------|---------|
| Next.js logo and boilerplate removed | PASS |
| Hero: "Náš stát" heading, platform description, gradient bg | PASS |
| 3 feature cards (lucide-react): Hlášení, Diskuze, Přehled | PASS |
| CTA: "Nahlásit podnět" (primary blue) | PASS |
| CTA: "Prozkoumat mapu" (secondary border) | PASS |
| CTA auth logic: `/login` (unauth) vs `/reports` (auth) | PASS |
| Header.tsx as page header (from #37 in layout.tsx) | PASS |
| Responsive on mobile (`sm:` breakpoints) | PASS |
| Dark mode support (dark: variants) | PASS |
| `npm run build` clean | PASS |
| `npm run test` passes | PASS (224/224) |
| `npm run lint` clean | PASS |

---

## Critical Issues (Showstoppers)

**None.**

---

## Issues Found & Fixed During Review

### 1. Duplicate test file `page_auth.test.tsx` (Minor — fixed)

The logged-in CTA test existed in both `page.test.tsx` (lines 33-48, added in this PR) and the older `page_auth.test.tsx`. Same scenario tested twice with different mock strategies. **Deleted `page_auth.test.tsx`** since `page.test.tsx` now covers all cases including authenticated state.

---

## Code Quality

- **`FEATURES` constant array** extracted cleanly — good pattern, avoids inline JSX bloat.
- **Semantic HTML**: proper `<section>` elements, `aria-label="Funkce platformy"`, correct heading hierarchy (`h1` → `h2`).
- **Dark mode**: consistent zinc/blue tokens matching the #37 color system.
- **No over-engineering**: no unnecessary abstractions, no unused code.

---

## Security & Performance

- No secrets exposed: session read via server-side `createClient()`.
- No XSS risk: no raw user content rendering.
- No performance concern: single `getUser()` call, static feature cards.

---

## Test Coverage

**5 tests** in `page.test.tsx`:
1. Hero `<h1>` renders "Náš stát"
2. "Nahlásit podnět" → `/login` when not logged in
3. "Nahlásit podnět" → `/reports` when logged in
4. "Prozkoumat mapu" → `/reports`
5. Three feature card `<h2>` headings (Hlášení, Diskuze, Přehled)

**224/224 tests pass. Lint clean. Build clean.**

---

## Final Verdict

**🟢 GOOD NUT — Ready to ship.**

One duplicate test file cleaned up during review. No other issues.
