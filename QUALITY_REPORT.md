# Quality Report — Story 2.4.2: Produkční nasazení (Issue #18)

**Reviewer:** The Squirrel
**PR:** #29 — `feat(deploy): production deployment pipeline — Story 2.4.2`
**Branch:** `issue-18-production-deployment`
**Date:** 2026-03-02
**Audit:** Fresh (no prior context)

---

## Status: ✅ GOOD NUT

---

## Executive Summary

The production deployment pipeline is well-documented and the test suite is clean (195/195). The production workflow (`deploy-production.yml`) is correctly structured: it gates on `v*` tags, runs full lint + test + build before deploying, and uses properly `PROD_`-prefixed secrets.

The critical defect identified in the previous audit has been resolved: `deploy.yml` no longer uses the `--prod` flag, meaning pushes to `main` create Vercel **preview deployments** (true staging), not production deployments. Additionally, `deploy.yml` now runs lint + test + build quality gates before deploying — matching the production workflow's safety standards.

---

## Issues Resolved

### ✅ A. `deploy.yml` — `--prod` flag removed (staging is now true preview)

**Was:** `npx vercel --token ... --prod --yes ...`
**Now:** `--prod` omitted — Vercel creates a preview deployment with a unique URL, leaving the production alias (`nasstat.cz`) untouched.

### ✅ B. `deploy.yml` — Quality gates added (lint + test + build)

Staging workflow now runs:
1. `npm run lint`
2. `npm run test`
3. `npm run build` (with STAGING_ env vars)
4. Deploy to Vercel preview

This matches the production workflow and prevents broken code from reaching even staging.

---

## Test Coverage Analysis

| Area | Status |
|------|--------|
| Total tests | 195/195 ✅ |
| Lint | Clean ✅ |
| Workflow structure tests | 41 tests ✅ |
| Staging: no `--prod` flag | Asserted by test ✅ |
| Staging: quality gates | Asserted by test ✅ |
| Production workflow | Correctly gated (lint → test → build → deploy) ✅ |
| Staging workflow | Quality gates present, preview deployment ✅ |

---

## Remaining Notes (Non-blocking)

### C. `RESEND_API_KEY` absent from production build step

`deploy-production.yml:42-48` sets 6 environment variables but omits `RESEND_API_KEY` and `EMAIL_FROM`. Both are passed via Vercel CLI `--env` flags at deploy time. At runtime this is fine (email sending is lazy-evaluated). Low priority — worth aligning if Next.js ever evaluates at build time.

### D. Commit noise in PR history

The PR contains 20+ commits for Story 2.4.1 quality audits unrelated to Story 2.4.2 implementation. Squash-merge recommended to keep main branch history clean.

---

## Decision

**GOOD NUT — Ready to merge** (squash recommended per note D).
