# Open Questions

## @TheSquirrel — GitHub push protection blocking issue #73 branch

**Status:** BLOCKED (manual action required)

**Branch:** `issue-73-maptiler-key` — commit `b17b86a` is ready but push is rejected.

**Reason:** GitHub push protection detected `SUPABASE_SERVICE_ROLE_KEY` in `.env.development:5`. This key was already committed on `issue-69-docs-env-seed` but GitHub is re-flagging it on this new branch.

**Options:**
1. **Bypass** the secret at: `https://github.com/Nas-Stat/nas-stat/security/secret-scanning/unblock-secret/3Akxpw9Egm3anf4eEZ90dciCCqU` — then run `git push -u origin issue-73-maptiler-key` again.
2. **Remove** `SUPABASE_SERVICE_ROLE_KEY` from `.env.development` (it can live in `.env.local` only) and amend the commit before pushing.

**Code is done.** All 17 tests pass. Awaiting push decision.

---

## @TheSquirrel — Workflow scope missing for push (Issue #17)

**Status:** BLOCKED (manual action required — 30 seconds)

**Problem:** The `gh` OAuth token is missing the `workflow` scope, which GitHub requires to push files under `.github/workflows/`. All code is committed locally on branch `issue-17-cicd-pipeline`.

**Fix — run this in your terminal:**

```bash
gh auth refresh -h github.com -s workflow
```

Then push and open the PR:

```bash
git push -u origin issue-17-cicd-pipeline
gh pr create \
  --title "feat(ci): Story 2.4.1 — CI/CD pipeline a staging nasazení" \
  --body "$(cat <<'EOF'
## Summary

- Add `.github/workflows/ci.yml`: runs lint + test + build on every PR to `main`
- Add `.github/workflows/deploy.yml`: deploys to Vercel staging on every push to `main`
- 20 new tests validating workflow file structure (174/174 total pass)
- README updated with CI/CD Pipeline section, secrets table, and Vercel setup guide

## Test plan

- [ ] All 174 tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Workflow files appear in `.github/workflows/` on GitHub
- [ ] PR triggers the CI workflow automatically

Closes #17

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
