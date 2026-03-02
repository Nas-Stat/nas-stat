# Quality Report — Story 2.4.1: CI/CD Pipeline (#17)

**Reviewed by:** The Squirrel (Tabula Rasa — fresh independent audit, 2026-03-02)
**Branch:** `issue-17-cicd-pipeline`
**Date:** 2026-03-02

---

## Status: 🟡 SUSPICIOUS NUT

> Code quality is **🟢 GOOD NUT**. Rating is 🟡 solely because no PR exists and the branch cannot
> be pushed — blocked by a missing GitHub OAuth token scope. This is a user infrastructure action,
> not a code defect.

---

## Executive Summary

All six story acceptance criteria are delivered and code quality is **production-ready**.

- `ci.yml` — lint + test + build on every PR to `main` ✅
- `deploy.yml` — Vercel staging deploy on push to `main` ✅
- `workflows.test.ts` — 20 dedicated workflow tests, all passing ✅
- `README.md` — full CI/CD section in Czech with secrets table and Vercel setup guide ✅
- **174/174 tests pass. Lint: 0 warnings. Build: clean.**

**The branch has never been pushed to the remote.** No PR exists. Push fails because the `workflow`
scope is absent from the GitHub OAuth token. This is a one-time user action to unblock.

---

## Critical Issues (Showstoppers)

### 1. Branch cannot be pushed — GitHub token missing `workflow` scope

Confirmed this audit (`gh auth status` → current scopes: `gist`, `read:org`, `repo`).
GitHub refuses any push touching `.github/workflows/` without the `workflow` scope.

**User action required (one-time, ~30 seconds):**

```bash
gh auth refresh -h github.com -s workflow
# Authorize in the browser prompt — then:
git push -u origin issue-17-cicd-pipeline
# Open PR → merge with Squash and merge (many commits → 1 clean commit on main)
gh issue close 17
```

---

## Code Smells & Improvements (Non-Blocking)

### A. `--prod` flag is semantically misleading in a "staging" deploy

```yaml
npx vercel --token "${{ secrets.VERCEL_TOKEN }}" \
  --prod \   # promotes to the Vercel project's *production* URL
```

Named "Deploy to Staging" but `--prod` promotes to whichever project `VERCEL_PROJECT_ID` targets.
If that secret is ever misconfigured to the real production project, every `main` merge becomes a
silent production deploy. Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID` before the
Vercel integration is activated.

### B. No enforced CI gate before staging deploy

`ci.yml` triggers on `pull_request`. `deploy.yml` triggers on `push` to `main`. These are
independent — a direct push to `main` deploys unvalidated code to staging. Configure branch
protection rules (repo Settings → Branches → Require status checks) to enforce CI before merge.

### C. Runtime secrets via `--env` CLI flags may not reach Server Actions

`SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are consumed at **runtime** in Next.js Server
Actions. Vercel CLI `--env` flags are not guaranteed to persist into serverless function execution.
Also set these in Vercel Dashboard → Environment Variables → Staging/Preview.

### D. Workflow tests rely on string-matching, not YAML parsing

A syntactically broken YAML file containing the expected strings would pass all 20 tests. Pragmatic
at this project stage, but provides false confidence against structural YAML errors.

### E. Squash merge is mandatory

The branch has 20 commits ahead of `main`: 1 real implementation + 19 audit doc commits.
Do not let audit commits land on `main`. **Squash and merge only.**

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

Workflow tests cover: trigger conditions, runner, Node version, npm caching, all three CI steps
(lint, test, build), Supabase env vars with placeholder fallbacks, and all Vercel/staging secrets.

---

## Merge Checklist

- [ ] **`gh auth refresh -h github.com -s workflow`** — **USER ACTION REQUIRED FIRST**
- [ ] `git push -u origin issue-17-cicd-pipeline`
- [ ] Open PR → merge with **Squash and merge** (20 commits → 1)
- [ ] `gh issue close 17`
- [ ] (Recommended before Vercel activation) Rename `VERCEL_PROJECT_ID` → `STAGING_VERCEL_PROJECT_ID`
- [ ] (Recommended) Enable branch protection on `main` requiring CI pass before merge
- [ ] (Recommended) Set `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel Dashboard
