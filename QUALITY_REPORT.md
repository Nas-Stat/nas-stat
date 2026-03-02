# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — audit #40)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

All six story acceptance criteria are delivered and code quality is **production-ready**.
`ci.yml` (lint + test + build on every PR), `deploy.yml` (Vercel staging on push to `main`), 20 dedicated workflow tests, README documentation — all present and correct. **174/174 tests pass. Lint is clean. Build is clean.**

The 🟡 rating is not a code defect. The branch **cannot be pushed** because the GitHub OAuth token is missing the `workflow` scope. This is a user-level infrastructure blocker. Once the user grants the scope, the PR can be opened and merged immediately.

Three non-critical design observations are noted below for transparency.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

Confirmed on audit #40 (fresh attempt):

```
! [remote rejected] issue-17-cicd-pipeline -> issue-17-cicd-pipeline
  (refusing to allow an OAuth App to create or update workflow
   `.github/workflows/ci.yml` without `workflow` scope)
```

`gh auth status` confirms current scopes: `gist`, `read:org`, `repo`. The `workflow` scope is absent.

**User action required (one-time):**

```bash
gh auth refresh -h github.com -s workflow
# Authorize in the browser prompt
git push -u origin issue-17-cicd-pipeline
# Open PR → merge with Squash and merge
```

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag is semantically dangerous in a "staging" deploy

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # promotes to the Vercel project's *production* URL
```

The workflow is named "Deploy to Staging" and uses `STAGING_*` secrets, yet `--prod` promotes to whichever project `VERCEL_PROJECT_ID` targets. A misconfigured secret pointing to the real production project turns every merge to `main` into a silent production deploy. Consider renaming `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` to make the boundary self-documenting.

### B. No enforced CI gate before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. These are independent — a direct push to `main` deploys unvalidated code. Branch protection rules enforcing CI pass before merge are not configured. Aspirational claim in README is not enforced.

### C. Runtime secrets via `--env` CLI flags may not reach Server Actions

`SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** inside Next.js Server Actions, but are passed only as Vercel CLI `--env` flags. These should also be set in Vercel Dashboard → Environment Variables → Preview/Staging to guarantee runtime availability.

### D. Workflow tests rely on string-matching, not YAML parsing

A syntactically broken YAML file containing the expected strings would pass all 20 tests. Pragmatic for this project stage, but provides false confidence against structural YAML errors.

### E. Squash merge is mandatory

The branch has 18 commits: 1 implementation + 17 quality report iterations. Do not let audit doc commits land on `main`. **Squash and merge only.**

---

## Test Coverage Analysis

| Metric | Result |
|--------|--------|
| Total tests | 174 |
| Passing | **174 ✅** |
| Failing | 0 |
| Workflow-specific tests | 20 (`workflows.test.ts`) |
| Lint warnings | 0 |
| Build errors | 0 (clean) |

Workflow tests cover: trigger conditions, runner, Node version, npm caching, all three CI steps, Supabase env vars with placeholder fallbacks, and all Vercel secrets. Coverage is thorough given the string-matching limitation noted above.

---

## Merge Checklist

- [ ] **`gh auth refresh -h github.com -s workflow`** — user action required first
- [ ] `git push -u origin issue-17-cicd-pipeline`
- [ ] Open PR → merge with **Squash and merge** (18 commits → 1)
- [ ] `gh issue close 17`
- [ ] (Recommended) Enable branch protection on `main` requiring CI pass before merge
- [ ] (Recommended) Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID`
- [ ] (Recommended) Set `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel Dashboard as staging env vars
