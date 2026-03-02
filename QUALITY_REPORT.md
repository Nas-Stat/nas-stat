# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — audit #41)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

> Code quality is **🟢 GOOD NUT**. Rating is 🟡 solely because the branch cannot be delivered — blocked by a missing GitHub token scope. This is a user infrastructure action, not a code defect.

---

## Executive Summary

All six story acceptance criteria are delivered and code quality is **production-ready**.
`ci.yml` (lint + test + build on every PR), `deploy.yml` (Vercel staging on push to `main`), 20 dedicated workflow tests, README documentation — all present and correct. **174/174 tests pass. Lint is clean. Build is clean.**

**The branch has been confirmed blocked since audit #37.** Push fails because the `workflow` scope is absent from the GitHub OAuth token. This is a one-time user action. Once resolved, the PR can be opened and merged immediately.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

Confirmed on audit #41 (fresh attempt):

```
! [remote rejected] issue-17-cicd-pipeline -> issue-17-cicd-pipeline
  (refusing to allow an OAuth App to create or update workflow
   `.github/workflows/ci.yml` without `workflow` scope)
```

`gh auth status` confirms current scopes: `gist`, `read:org`, `repo`. The `workflow` scope is absent.

**User action required (one-time):**

```bash
gh auth refresh -h github.com -s workflow
# Authorize in the browser prompt — then:
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

The workflow is named "Deploy to Staging" and uses `STAGING_*` secrets, yet `--prod` promotes to whichever project `VERCEL_PROJECT_ID` targets. Consider renaming `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` to make the boundary self-documenting.

### B. No enforced CI gate before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. These are independent — a direct push to `main` deploys unvalidated code. Branch protection rules enforcing CI pass before merge are not configured.

### C. Runtime secrets via `--env` CLI flags may not reach Server Actions

`SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** inside Next.js Server Actions, but are passed only as Vercel CLI `--env` flags. These should also be set in Vercel Dashboard → Environment Variables → Preview/Staging.

### D. Workflow tests rely on string-matching, not YAML parsing

A syntactically broken YAML file containing the expected strings would pass all 20 tests. Pragmatic for this project stage, but provides false confidence against structural YAML errors.

### E. Squash merge is mandatory

The branch has many commits: 1 implementation + many quality report iterations. Do not let audit doc commits land on `main`. **Squash and merge only.**

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

Workflow tests cover: trigger conditions, runner, Node version, npm caching, all three CI steps, Supabase env vars with placeholder fallbacks, and all Vercel secrets.

---

## Merge Checklist

- [ ] **`gh auth refresh -h github.com -s workflow`** — **user action required first**
- [ ] `git push -u origin issue-17-cicd-pipeline`
- [ ] Open PR → merge with **Squash and merge** (many commits → 1)
- [ ] `gh issue close 17`
- [ ] (Recommended) Enable branch protection on `main` requiring CI pass before merge
- [ ] (Recommended) Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID`
- [ ] (Recommended) Set `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel Dashboard as staging env vars
