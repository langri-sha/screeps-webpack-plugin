---
name: create-pr
description:
  Use this skill when the user says "create a PR", "open a pull request", or
  wants to create a GitHub pull request. Analyzes git changes, reads the PR
  template, generates descriptions, and handles stacked branches.
---

# Create PR

Create a GitHub pull request from the current branch: determine the base,
analyze commits and diff, fill the repo's PR template, and open the PR with
`gh`. Handles stacked branches (Git Town), detached HEAD, and custom bases.

Deep-dive material (stacked-branch details, template parsing, troubleshooting)
lives in `references/pr-workflow.md` — load it for complex scenarios, not on the
happy path.

## Workflow

### 1. Determine the Base Branch

**Native GitHub stack guard** — always check first. If the `gh-stack` extension
is installed (`gh extension list`), run `gh stack view --json`: exit 0 means the
current branch is part of a native GitHub stack; exit 2 means it is not. Never
create a standalone PR for a native stack branch — not even when the user
supplies a base branch; surface the conflict instead. Publish the stack's PRs
with `gh stack submit --auto` (creates drafts), then apply the generated title
and body with `gh pr edit`. See the `split-pr-stack` skill for building such
stacks and the official `gh-stack` skill for command semantics.

Otherwise, in priority order:

1. **User-specified** — "create a PR to develop" → `develop`.
2. **Git Town parent** — `python3 scripts/detect_stacked_branch.py`; exit 0
   prints the parent branch (stacked), 1 means not stacked, 2 means Git Town
   unavailable.
3. **Default branch** — `main`/`master` per `git remote show origin`.

### 2. Verify Workspace State

```bash
git status --porcelain
```

If there are uncommitted changes, ask whether to commit them (via
`/create-commit`), stash them, or proceed without them — they won't be in the PR
otherwise.

### 3. Resolve the Branch

- On a named branch: use it.
- On detached HEAD: generate a name with
  `python3 scripts/generate_branch_name.py [base]` and `git checkout -b` it.

### 4. Generate the PR Title

PR titles are for humans: plain, descriptive language that reads naturally — not
a reformatted branch name or commit subject.

- Describe what the change does, based on the commits and diff (step 5). The
  branch name is only a hint.
- When the PR resolves a specific issue, mirror the issue title if it already
  reads as a plain description; otherwise normalize it with these rules.
- Strip conventional-commit type prefixes (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`, `perf:`, `build:`, `ci:`), including scoped forms like
  `feat(api):`. Commits may keep the convention; the title must not.
- Drop jargon and markers that mean nothing outside the code, such as
  `{ check }` or `[WIP]`.
- Use sentence case with a leading imperative verb. Capitalize only the first
  word, proper nouns, and acronyms (PDF, API, JWT). No trailing period.
- A backticked `name` (package, tool, or symbol) is acceptable only when it
  genuinely aids clarity, e.g. "Bump `eslint` to v9".

Examples:

- `feat: add pdf export` → "Add PDF export"
- `fix/login-redirect-loop` → "Fix login redirect loop"
- `chore(deps): update eslint to v9` → "Bump `eslint` to v9"
- `add-user-authentication` → "Add user authentication"

### 5. Analyze Changes

Always compare against the **remote** base — local refs go stale:

```bash
git fetch origin <base>
git log origin/<base>..HEAD --pretty=format:"%h %s%n%b"
git diff --stat origin/<base>...HEAD
```

Read the full diff when it is manageable; for large diffs, prioritize source
files over lockfiles/assets and lean on commit messages. Synthesize **what**
changed, **why**, and **how to test it**.

### 6. Fill the PR Template

Locate the template (`.github/PULL_REQUEST_TEMPLATE.md`, then
`.github/pull_request_template.md`, then repo root, then `docs/`). Keep the
whole body under 150 words, whatever the template asks for:

- **Summary** — why the change exists, plus what the diff can't show:
  manual steps, risk, rollout. One to three sentences.
- **Changes** — never list them; the diff and the commits already do. Skip
  the section, or use one sentence for a decision a reviewer would miss.
- **Test plan** — one line naming what ran. No checklists.
- Skip sections with nothing to say instead of writing N/A, and add no
  sections of your own. Leave all checkboxes unchecked.
- Write as the author, in the first person or with no attribution. Never
  name the author or refer to them in the third person.
- Include `Closes #123` / `Fixes #123` when the branch resolves an issue.

If no template exists, write a short paragraph and a one-line test plan,
without headings.

### 7. Infer Metadata

- **Labels**: from the nature of the change — bug fixes → `bug`, features →
  `enhancement`, docs-only → `documentation`, dependency bumps → `dependencies`.
- **Reviewers**: only when the user names one, or CODEOWNERS clearly applies.

User input always overrides inference — explicit titles verbatim, explicit base
branches, extra context into the Summary.

### 8. Confirm, Push, Create

Check for an existing PR first:

```bash
gh pr list --head <branch> --json url
```

If one exists, share the URL and offer `gh pr edit` instead of creating.

**Confirmation gate:** show the generated title and body and ask "Does this look
good?" — unless the user asked for a non-interactive run or a composing skill
(e.g. `/wrap`) says to skip confirmation.

Write the body to a timestamped temp file and create:

```bash
git push -u origin <branch>
gh pr create \
  --base <base> \
  --title "<title>" \
  --label "<labels>" \
  --body-file /tmp/pr-body-<YYYYMMDDTHHMMSSZ>.md
```

Return the PR URL to the user.

## Stacked Branches

A stack splits a feature into dependent PRs, each based on its parent branch
rather than main. Git Town stacks are detected through
`scripts/detect_stacked_branch.py` (Git Town stores parent relationships in git
config); native GitHub stacks are caught by the guard in step 1. For a stacked
PR, the base is the parent branch, and the title and description cover this
layer only. GitHub renders the stack natively, so never add a stack section, PR
list, position marker, or "builds on #123" note — a hand-kept copy only goes
stale. Full details in `references/pr-workflow.md`.

## Helper Scripts

- **`scripts/detect_stacked_branch.py`** — prints the Git Town parent branch;
  exit codes 0 (stacked), 1 (not stacked), 2 (Git Town unavailable).
- **`scripts/generate_branch_name.py [base]`** — derives a dasherized branch
  name from commits/changes; used for detached HEAD.

## Edge Cases

- **Empty diff against base** — nothing to PR; say so instead of opening an
  empty PR.
- **PR already exists for the branch** — offer to update it, never open a
  duplicate.
- **Behind the base** — suggest `git rebase origin/<base>` before pushing.
- Anything else (auth failures, missing `gh`, template quirks):
  `references/pr-workflow.md` has the troubleshooting table.
