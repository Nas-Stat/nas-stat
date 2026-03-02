# Open Questions

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
