# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — twenty-seventh independent audit)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

The implementation delivers all six issue requirements: CI workflow (lint + test + build on every PR), staging deploy workflow (push to `main` → Vercel), 20 dedicated workflow tests, and full README documentation. Branch history is clean — one tightly-scoped commit. All 174 tests pass, lint is clean.

**The branch cannot be pushed without a `workflow` OAuth scope on the GitHub token.** This is a user action, not a code fix. Beyond that external blocker, three non-critical design concerns justify 🟡 over 🟢.

---

## Critical Issues (Showstoppers)

### 1. Push blocked — GitHub token missing `workflow` scope

GitHub refuses any push that adds or modifies files under `.github/workflows/` without the `workflow` OAuth scope.

Current scopes: `gist`, `read:org`, `repo` — **`workflow` is absent.**

**Required action (user only — cannot be automated):**

```bash
gh auth refresh -s workflow --hostname github.com
# Follow browser prompt → authorize
git push -u origin issue-17-cicd-pipeline
```

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag in `deploy.yml:46` — implicit production risk

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \          # promotes deployment to the Vercel project's production URL
```

The workflow is named "Deploy to Staging" and uses `STAGING_*` secrets, implying a dedicated staging Vercel project. If that project is correctly linked, `--prod` is needed to get a stable URL rather than a random preview hash — fine. **The risk:** one misconfigured `VERCEL_PROJECT_ID` pointing at the production project and every `main` merge deploys to production. The README should explicitly warn that `VERCEL_PROJECT_ID` must reference the staging project. Renaming the secret to `STAGING_VERCEL_PROJECT_ID` would make the intent self-documenting.

### B. No CI gate before staging deploy

The two workflows are independent. A direct `git push` to `main` (bypassing a PR) triggers `deploy.yml` immediately without running lint/test/build. Unless branch protection rules requiring CI passage are configured in repo settings, broken code can reach staging. Should be documented as a hard prerequisite.

### C. `--env` CLI flags may not provide runtime env vars for server-side functions

```yaml
--env SUPABASE_SERVICE_ROLE_KEY="${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}"
--env RESEND_API_KEY="${{ secrets.STAGING_RESEND_API_KEY }}"
```

Vercel CLI `--env` injects vars at build time for that specific deployment. `NEXT_PUBLIC_*` vars are embedded at build — correct. But `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are accessed at **runtime** inside Next.js server actions. Whether Vercel carries CLI-injected `--env` vars into serverless function runtime must be validated on the first real deploy. If not, admin Supabase calls and email sending fail silently on staging. Safer: configure these in the Vercel Dashboard under Environment Variables.

### D. Workflow tests use raw string matching

```typescript
expect(content).toContain('npm run lint')
```

A syntactically invalid YAML file with the right strings would still pass all 20 tests. Acceptable pragmatic trade-off at this scale, but worth noting.

---

## Test Coverage Analysis

| Metric | Result |
|--------|--------|
| Total tests | 174 |
| Passing | **174 ✅** |
| Failing | 0 |
| Workflow-specific tests | 20 (`workflows.test.ts`) |
| Lint warnings | 0 |

Workflow tests verify all required triggers, tooling, steps, and secret references. Coverage is thorough for what can be unit-tested in-process.

---

## Merge Checklist

- [ ] `gh auth refresh -s workflow --hostname github.com` **(user action — required first)**
- [ ] `git push -u origin issue-17-cicd-pipeline`
- [ ] Open PR → merge with **Squash and merge**
- [ ] `gh issue close 17`
- [ ] Configure branch protection rule requiring CI to pass before merge (recommended)
