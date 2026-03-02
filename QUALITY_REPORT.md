# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — fresh independent audit, 2026-03-02)
**Branch:** `issue-17-cicd-pipeline` → PR #28
**Date:** 2026-03-02

---

## Status: 🟢 GOOD NUT

> Code is clean, tested, and CI passes. Ready to ship.

---

## Executive Summary

All six story acceptance criteria are delivered and production-ready.

- `ci.yml` — lint + test + build on every PR to `main` ✅
- `deploy.yml` — Vercel staging deploy on push to `main` ✅
- `workflows.test.ts` — 20 dedicated workflow tests, all passing ✅
- `README.md` — full CI/CD section in Czech with secrets table and Vercel setup guide ✅
- **174/174 tests pass. Lint: 0 warnings. Build: clean. CI check: ✅ success.**

---

## Critical Issues (Showstoppers)

None. CI passed on GitHub Actions. No blockers.

---

## Code Smells & Improvements (Non-Blocking, Pre-Activation)

### A. `--prod` flag is semantically misleading in a "staging" deploy

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # promotes to the Vercel project's *production* URL
```

Named "Deploy to Staging" but `--prod` promotes to whichever project `VERCEL_PROJECT_ID` targets.
Before activating Vercel integration: confirm `VERCEL_PROJECT_ID` references a dedicated staging
project, or rename the secret to `STAGING_VERCEL_PROJECT_ID` to make intent explicit.

### B. No enforced CI gate before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. A direct push to
`main` bypasses CI and deploys unvalidated code to staging. Fix: enable branch protection rules
(Settings → Branches → Require status checks to pass before merging).

### C. Runtime secrets via `--env` CLI flags may not reach Server Actions

`SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** in Next.js Server
Actions. Vercel CLI `--env` flags are build-time only and are not guaranteed to persist into
serverless function execution. Also set these in Vercel Dashboard → Environment Variables.

### D. Workflow tests rely on string-matching, not YAML parsing

A syntactically broken YAML file containing the expected strings would pass all 20 tests. Pragmatic
at this project stage, but provides false confidence against structural YAML errors.

---

## Test Coverage Analysis

| Metric | Result |
|--------|--------|
| Total tests | 174 |
| Passing | **174 ✅** |
| Failing | 0 |
| Workflow-specific tests | 20 (`workflows.test.ts`) |
| Lint warnings | 0 |
| Build errors | 0 |
| GitHub Actions CI | **✅ success** |

Workflow tests cover: trigger conditions, runner, Node version, npm caching, all three CI steps
(lint, test, build), Supabase env vars with placeholder fallbacks, and all Vercel/staging secrets.

---

## Verdict

**🟢 GOOD NUT. Squash and merge.**

All non-blocking items above are pre-activation ops concerns — none require code changes before
merging. Address them when configuring the live Vercel integration.
