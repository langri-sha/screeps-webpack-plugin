---
name: create-pr
description: >-
  Opens a GitHub pull request for the current branch with gh: picks the base,
  fills the repo's PR template in under 150 words, and refuses branches that
  belong to a native GitHub stack. Use when asked to create, open or update a
  PR. Not for splitting a change into a stack (split-pr-stack) or merging
  (wrap).
---

# Create PR

## Before writing anything

- **Native stack guard.** If `gh extension list` shows `gh-stack`, run
  `gh stack view --json`. Exit 0 means this branch is in a native stack: open no
  standalone PR, even when the user names a base; surface the conflict instead.
  Publish with `gh stack submit --auto`, which opens drafts, then set each
  layer's title and body with `gh pr edit`. The `split-pr-stack` skill builds
  such stacks.
- **Existing PR.** `gh pr list --head <branch> --json url,baseRefName`. If one
  exists, its base is the base, and offer `gh pr edit` instead of opening a
  duplicate.
- **Base.** The user's, if named. Otherwise, for a new PR:
  1. After `git fetch origin`, list other open PRs' branches with
     `gh pr list --limit 1000 --json headRefName`. Skip this branch and any head
     the default branch already contains
     (`git merge-base --is-ancestor origin/<head> origin/<default>`).
  2. Keep the heads this branch contains
     (`git merge-base --is-ancestor origin/<head> HEAD`), and base on the
     closest: the one with the fewest
     `git rev-list --count origin/<head>..HEAD`. Ask only on a tie. Basing on it
     makes the PR show only this layer.
  3. With no such head, use the default branch
     (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`), unless
     `git log origin/<default>..HEAD` lists commits that aren't part of this
     change, such as a parent rebased since; then ask for the base.
- **State.** Uncommitted changes won't be in the PR, so ask whether to commit
  them (`create-commit`), stash them, or leave them out. On a detached HEAD,
  create a short kebab-case branch named for the change, with no type prefix. An
  empty diff against `origin/<base>` means there is nothing to open; say so. If
  the branch is behind `origin/<base>`, suggest rebasing before pushing.

Compare against the remote base, since local refs go stale:
`git fetch origin <base>`, then `git log origin/<base>..HEAD` and
`git diff --stat origin/<base>...HEAD`. Read the full diff for the files that
matter, skipping lockfiles and generated output.

## Title

A plain sentence in sentence case, starting with an imperative verb, with no
trailing period. Describe what the change does; the branch name and commit
subjects are input, not output. Use a title the user gives verbatim. Drop type
prefixes (`feat:`, `fix(api):`) and markers like `[WIP]`, and keep acronyms
upper case. Mirror the issue title when the PR resolves one and it already reads
plainly. Backtick a package or symbol only when it helps: "Bump `eslint` to v9".

## Body

The whole body stays under 150 words, whatever the template asks for. Reviewers
skim, and the diff and commits already say what changed.

- Use the repo's template (`.github/pull_request_template.md` or a variant).
  Fill only its sections, skip any with nothing to say rather than writing N/A,
  add none of your own, and leave checkboxes unchecked.
- Summary: why the change exists, plus what the diff can't show, such as manual
  steps, risk or rollout. One to three sentences. Fold in anything the user
  asked to mention.
- Don't list the changes. Spend one sentence only on a decision a reviewer would
  otherwise miss.
- Test plan: one line naming what ran.
- Write as the author, in the first person or with no attribution. Never name
  the author or refer to them in the third person.
- `Closes #123` when the branch resolves an issue.
- In a stack, describe this layer only. GitHub renders the stack, so add no
  stack section, PR list or "builds on #123".

Without a template, write a short paragraph and the one-line test plan, with no
headings.

## Open it

Show the base, title and body and ask for a go, unless the user asked for a
non-interactive run or a composing skill such as `wrap` said to skip it. A skip
doesn't cover an inferred base other than the default branch: confirm that one
anyway, since merging the PR lands it there.

```bash
git push -u origin <branch>
gh pr create --base <base> --title "<title>" --body-file <file>
```

Write the body to a file from `mktemp`, outside the repository, and pass its
printed path literally: shell variables don't last between commands.

Add `--label` for the kind of change (`bug`, `enhancement`, `documentation`,
`dependencies`) only when `gh label list --limit 1000` shows it: `gh pr create`
refuses a label the repository doesn't have. Request reviewers only when the
user names them or CODEOWNERS clearly applies. Return the PR URL.
