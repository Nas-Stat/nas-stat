# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — audit #33)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

The implementation delivers all six acceptance criteria from the issue: `ci.yml` (lint + test + build on every PR to `main`), `deploy.yml` (Vercel staging on push to `main`), 20 dedicated workflow tests, and full README documentation. **174/174 tests pass. Lint is clean.**

The branch is **unpushed**. No PR exists. The GitHub token is missing the `workflow` OAuth scope — a user-level blocker, not a code defect. Three genuine design concerns in `deploy.yml` prevent a 🟢 rating.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

**Confirmed:** Current token scopes are `gist`, `read:org`, `repo`. The `workflow` scope is absent and GitHub rejects pushes that add or modify files under `.github/workflows/`.

**User action required (one-time):**

```bash
gh auth refresh -h github.com -s workflow
# Authorize in the browser prompt that opens
git push -u origin issue-17-cicd-pipeline
# Open a PR and merge with Squash and merge
```

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag in `deploy.yml` is semantically misleading

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # promotes to the Vercel project's *production* URL
```

The workflow is named "Deploy to Staging" and uses `STAGING_*` secrets, yet `--prod` promotes whichever project `VERCEL_PROJECT_ID` points at. If that secret is ever misconfigured to the real production project, every `main` merge becomes a production deploy with no safeguard. Renaming `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` in both the secrets store and the workflow would make the boundary self-documenting.

### B. No CI gate enforced before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. These are fully independent. A direct push to `main` (bypassing a PR) deploys unvalidated code to staging. Branch protection rules requiring CI to pass before merge are not configured. The README claim "PR nelze sloučit, dokud všechny kroky neprojdou" is aspirational — it is not enforced at the repository level.

### C. Runtime secrets via CLI `--env` flags — reliability gap

```yaml
--env SUPABASE_SERVICE_ROLE_KEY="${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}"
--env RESEND_API_KEY="${{ secrets.STAGING_RESEND_API_KEY }}"
```

`NEXT_PUBLIC_*` vars are baked in at build time — correct. `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** inside Next.js Server Actions. Whether Vercel CLI `--env` flags persist into the serverless function execution environment is not guaranteed across CLI versions and project configurations. The safer approach: also set these two secrets in the Vercel Dashboard → Environment Variables → Preview/Staging environment.

### D. Workflow tests rely on string-matching, not YAML parsing

```typescript
expect(content).toContain('npm run lint')
```

A syntactically broken YAML file containing the expected strings would pass all 20 tests. Pragmatic trade-off for this project stage, but the test suite provides false confidence against structural YAML errors.

### E. Commit history bloat — squash merge is mandatory

The branch has 9 commits: 1 implementation + 8 quality report doc iterations. Do not let individual audit commits land on `main`. **Squash and merge is non-negotiable.**

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
- [ ] Open PR → merge with **Squash and merge** (9 commits → 1)
- [ ] `gh issue close 17`
- [ ] (Recommended) Enable branch protection on `main` requiring CI pass before merge
- [ ] (Recommended) Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` once Vercel is configured
- [ ] (Recommended) Set `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel Dashboard as staging env vars
