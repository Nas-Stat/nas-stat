# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — thirty-first independent audit)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

The implementation satisfies all six acceptance criteria from the issue: `ci.yml` (lint + test + build on every PR), `deploy.yml` (Vercel staging on push to `main`), 20 dedicated workflow tests, and README documentation. 174/174 tests pass. Lint is clean.

**The branch is unpushed. No PR exists.** The GitHub token is missing the `workflow` OAuth scope, which GitHub requires for any push that adds or modifies files under `.github/workflows/`. This is not a code defect — it is a user action.

Beyond the external blocker, three genuine design concerns in `deploy.yml` prevent a 🟢 rating.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

Current token scopes: `gist`, `read:org`, `repo` — **`workflow` is absent.**

**User action required (30 seconds):**

```bash
gh auth refresh -h github.com -s workflow
# Follow the browser prompt and authorize
git push -u origin issue-17-cicd-pipeline
```

Then open a PR with **Squash and merge** to collapse the 6 meta-commits into one.

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag in `deploy.yml` — staging/production naming confusion

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # ← promotes to the Vercel project's *production* URL
```

The workflow is named "Deploy to Staging" and uses `STAGING_*` secrets. If `VERCEL_PROJECT_ID` ever points at the production Vercel project (misconfiguration, copy-paste error), `--prod` makes every `main` merge a production deploy.

The README section on Production deployment says "create a separate Vercel project and use `PROD_` prefixed secrets" — correct intent, but `VERCEL_PROJECT_ID` is currently unprefixed and shared. Renaming it to `STAGING_VERCEL_PROJECT_ID` would make the guard self-documenting.

### B. No CI gate enforced before staging deploy

`ci.yml` and `deploy.yml` are independent workflows. A direct `git push` to `main` (bypassing a PR) triggers the deploy immediately without running lint/test/build. Branch protection rules requiring CI passage are not configured in this repository. A note in the README ("branch protection must be enabled for this guarantee to hold") is missing.

### C. `--env` CLI flags may not persist at serverless runtime

```yaml
--env SUPABASE_SERVICE_ROLE_KEY="${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}"
--env RESEND_API_KEY="${{ secrets.STAGING_RESEND_API_KEY }}"
```

`NEXT_PUBLIC_*` vars are embedded at build time — correct. But `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are accessed at **runtime** inside Next.js Server Actions. Whether Vercel carries CLI-injected `--env` values into the serverless function runtime depends on the Vercel CLI version and project configuration. If not, admin Supabase operations and email dispatch fail silently on staging. These two secrets should be set in the Vercel Dashboard → Environment Variables as a safer fallback.

### D. Workflow tests use string matching, not YAML parsing

```typescript
expect(content).toContain('npm run lint')
```

A syntactically broken YAML file with the correct strings would pass all 20 tests. Acceptable pragmatic trade-off at this stage, but the test suite gives false confidence if a workflow file becomes malformed.

### E. Branch carries 6 meta-commits on top of 1 implementation commit

```
1027fa9 docs(quality): finalize quality report for Story 2.4.1 — audit #29 (#17)
b666939 docs(quality): finalize quality report for Story 2.4.1 (#17)
71e10ef docs(quality): update reviewer label in quality report (#17)
8339432 docs(quality): update reviewer label in quality report (#17)
a7351c5 chore: log Story 2.4.1 CI/CD pipeline in DEVLOG (#17)
358fb44 docs(quality): update quality report for Story 2.4.1 (#17)
4b828cc feat(ci): Story 2.4.1 — CI/CD pipeline a staging nasazení (closes #17)  ← real work
```

**Use Squash and merge** when opening the PR. Do not let these land individually on `main`.

> **Audit #31 note:** Branch now has 8 commits (1 implementation + 7 meta-audit docs). This trend is itself a smell — each new audit adds a commit that must be squashed away. Squash merge is non-negotiable.

---

## Test Coverage Analysis

| Metric | Result |
|--------|--------|
| Total tests | 174 |
| Passing | **174 ✅** |
| Failing | 0 |
| Workflow-specific tests | 20 (`workflows.test.ts`) |
| Lint warnings | 0 |

All 20 workflow tests cover trigger conditions, runner, Node version, caching, step names, and secret references for both `ci.yml` and `deploy.yml`. Coverage is thorough for in-process validation of YAML content.

---

## Merge Checklist

- [ ] **`gh auth refresh -h github.com -s workflow`** — user action, required first
- [ ] `git push -u origin issue-17-cicd-pipeline`
- [ ] Open PR → merge with **Squash and merge**
- [ ] `gh issue close 17`
- [ ] (Recommended) Enable branch protection rule on `main` requiring CI to pass
- [ ] (Recommended) Rename `VERCEL_PROJECT_ID` secret to `STAGING_VERCEL_PROJECT_ID` after Vercel is configured
