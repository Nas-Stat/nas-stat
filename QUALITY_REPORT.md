# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — audit #32)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

---

## Executive Summary

The implementation delivers all six acceptance criteria from the issue: `ci.yml` (lint + test + build on every PR to `main`), `deploy.yml` (Vercel staging on push to `main`), 20 dedicated workflow tests, and README documentation. 174/174 tests pass. Lint is clean.

**The branch is unpushed. No PR exists. The GitHub token is missing the `workflow` OAuth scope**, which GitHub requires for any push that adds or modifies files under `.github/workflows/`. This is not a code defect — it is a user-level blocker requiring a one-time token refresh.

Three genuine design concerns in `deploy.yml` prevent a 🟢 rating: semantic naming confusion with `--prod`, no guaranteed CI gate before staging deploy, and runtime secret delivery uncertainty.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

**Confirmed:** Current token scopes are `gist`, `read:org`, `repo` — `workflow` is absent.

**User action required:**

```bash
gh auth refresh -h github.com -s workflow
# Authorize in the browser prompt that opens
git push -u origin issue-17-cicd-pipeline
# Then open a PR and merge with Squash and merge
```

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag in `deploy.yml` is semantically misleading

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # ← promotes to the Vercel project's *production* URL
```

The workflow is called "Deploy to Staging" and uses `STAGING_*` secrets. `--prod` promotes to whichever Vercel project `VERCEL_PROJECT_ID` points at. If that secret ever points at the wrong project, every `main` merge becomes a production deploy with no safeguard. Renaming `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` in secrets and in the workflow would make the boundary self-documenting and reduce misconfiguration risk.

### B. No CI gate enforced before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. These are fully independent workflows. A direct `git push` to `main` (bypassing a PR) deploys unvalidated code to staging. Branch protection rules requiring CI to pass before merge are not configured in this repository. The README section "PR nelze sloučit, dokud všechny kroky neprojdou" is aspirational, not enforced. A note documenting this gap is absent.

### C. Runtime secrets delivered via CLI `--env` flags — reliability not guaranteed

```yaml
--env SUPABASE_SERVICE_ROLE_KEY="${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}"
--env RESEND_API_KEY="${{ secrets.STAGING_RESEND_API_KEY }}"
```

`NEXT_PUBLIC_*` vars are baked in at build time — correct. `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** inside Next.js Server Actions. Whether Vercel CLI `--env` flags persist into the serverless function execution environment depends on CLI version and project configuration. The safer approach is to also configure these two secrets in the Vercel Dashboard → Environment Variables → Preview/Staging. The README mentions Dashboard configuration for production but not for staging.

### D. Workflow tests rely on string-matching, not YAML parsing

```typescript
expect(content).toContain('npm run lint')
```

A syntactically invalid YAML file containing the expected strings would pass all 20 tests. This is a pragmatic trade-off and acceptable at this stage, but the test suite provides false confidence against structural YAML breakage.

### E. Commit history — 9 commits, 1 implementation + 8 meta-audit docs

**Squash and merge is non-negotiable** when the PR is opened. Do not let individual audit doc commits land on `main`.

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

Workflow tests cover: trigger conditions, runner, Node version, npm caching, all three CI steps, Supabase env vars with placeholder fallbacks, and all Vercel secrets. Coverage is thorough for YAML content validation given the string-matching limitation noted above.

---

## Merge Checklist

- [ ] **`gh auth refresh -h github.com -s workflow`** — user action, required first
- [ ] `git push -u origin issue-17-cicd-pipeline`
- [ ] Open PR → merge with **Squash and merge** (9 commits → 1)
- [ ] `gh issue close 17`
- [ ] (Recommended) Enable branch protection on `main` requiring CI to pass before merge
- [ ] (Recommended) Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` once Vercel is configured
- [ ] (Recommended) Add `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel Dashboard as staging env vars
