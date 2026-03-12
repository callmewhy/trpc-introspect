Release this package: update docs, tag, and push. Publishing is handled by GitHub Actions.

## Steps

1. Run `pnpm test` to make sure all tests pass. If tests fail, stop and report the failures.
2. Run `pnpm build` to build the package. If the build fails, stop and report the error.
3. Run `pnpm lint` to check for lint errors. If lint fails, stop and report the errors.
4. Find the latest version tag via `git tag --sort=-v:refname | head -1`. If no tags exist, use the initial commit as the base.
5. Run `git diff <tag>..HEAD -- src/` to see all source code changes since the last release.
6. Read the current `README.md`. If there are meaningful changes (new exports, API changes, new options, behavior changes, bug fixes), update the relevant sections. Do not rewrite sections unaffected by changes. If there are no meaningful changes, skip the update.
7. Check the current version in `package.json` and the latest published version on npm via `npm view trpc-introspect version --json 2>/dev/null || echo "not published"`.
8. Ask the user what version bump they want (patch, minor, or major), showing the current version, the latest published version, and what each bump would produce. Include an "as-is" option if the current version is not yet published.
9. If a bump was selected, update the `version` field in `package.json` to the new version.
10. If there are staged or unstaged changes (check via `git status`), create a git commit with the message `release: vX.Y.Z`. If the working tree is clean, skip the commit.
11. Create a git tag `vX.Y.Z`.
12. Run `git push --follow-tags` to push the commit and tag to the remote. This triggers the GitHub Actions workflow to publish to npm and create a GitHub Release.
13. Report success with the version and a link to the GitHub Actions run.
