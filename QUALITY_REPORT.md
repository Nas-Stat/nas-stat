# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — audit #38)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

All six story acceptance criteria are delivered: `ci.yml` (lint + test + build on every PR), `deploy.yml` (Vercel staging on push to `main`), 20 dedicated workflow tests, and README documentation. **174/174 tests pass. Lint is clean.**

The branch is **unpushed and no PR exists.** GitHub rejects the push because the OAuth token is missing the `workflow` scope — a user-level infrastructure blocker, not a code defect. Three design concerns in `deploy.yml` also prevent a 🟢 rating.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

Confirmed on this audit (#38): current token scopes are `gist`, `read:org`, `repo`. GitHub refuses to push any file under `.github/workflows/` without the `workflow` scope.

**User action required (one-time):**

```bash
gh auth refresh -h github.com -s workflow
# Authorize in the browser prompt that opens
git push -u origin issue-17-cicd-pipeline
# Open a PR and merge with Squash and merge
```

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag is semantically dangerous in a "staging" deploy

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # promotes to the Vercel project's *production* URL
```

The workflow is called "Deploy to Staging" and uses `STAGING_*` secrets, yet `--prod` promotes to whichever project `VERCEL_PROJECT_ID` targets. If that secret is ever misconfigured to the real production project, every merge to `main` becomes a silent production deploy. Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` (secret + workflow) to make the boundary self-documenting.

### B. No enforced CI gate before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. These are fully independent. A direct push to `main` (bypassing any PR) deploys unvalidated code to staging. The README claim "PR nelze sloučit, dokud všechny kroky neprojdou" is aspirational — branch protection rules are not configured.

### C. Runtime secrets via `--env` CLI flags may not reach Server Actions

```yaml
--env SUPABASE_SERVICE_ROLE_KEY="${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}"
--env RESEND_API_KEY="${{ secrets.STAGING_RESEND_API_KEY }}"
```

`NEXT_PUBLIC_*` vars are baked in at build time — correct. But `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** inside Next.js Server Actions. Whether Vercel CLI `--env` flags persist into serverless function execution is not guaranteed across CLI versions and project configurations. These two secrets should also be set in the Vercel Dashboard → Environment Variables → Preview/Staging.

### D. Workflow tests rely on string-matching, not YAML parsing

```typescript
expect(content).toContain('npm run lint')
```

A syntactically broken YAML file containing the expected strings would pass all 20 tests. Pragmatic for this project stage, but false confidence against structural YAML errors.

### E. Squash merge is mandatory

The branch has 15 commits: 1 implementation + 14 quality report iterations. Do not let audit doc commits land on `main`. **Squash and merge only.**

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
- [ ] Open PR → merge with **Squash and merge** (15 commits → 1)
- [ ] `gh issue close 17`
- [ ] (Recommended) Enable branch protection on `main` requiring CI pass before merge
- [ ] (Recommended) Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID`
- [ ] (Recommended) Set `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel Dashboard as staging env vars
