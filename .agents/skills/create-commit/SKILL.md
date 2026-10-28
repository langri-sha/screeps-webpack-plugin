---
name: create-commit
description: Use this whenever creating Git commits.
---

# Create Commit

Create atomic commits with clear messages: analyze what changed, split it into
single-purpose commits, and write messages that explain what and why.

## Message Format

- **Subject**: imperative mood ("Add", "Fix", "Rework"), about 50 characters,
  capitalized, no trailing period. Plain English — never Conventional Commits or
  any type prefix (`feat:`, `chore:`, `fix(scope):`). Bot commits in the history
  (Renovate, dependabot, squash-merge titles) are not evidence that a repo uses
  the format. The only exceptions: the repo enforces it mechanically
  (commitlint, semantic-release, a commit-msg hook), or a project-level
  AGENTS.md/CLAUDE.md explicitly requires it.
- **Body**: explains **what** changed and **why** — not how; the diff shows how.
  Wrap at 72 characters. Trivial changes may omit the body.
- **Issue/PR refs go in the body**, each on its own line at the end
  (`Closes #123`, `Refs #45`) — never in the subject. Subjects with refs clutter
  `git log --oneline` and go stale across forks and rebases.
- **Fixups**: when the change corrects earlier unmerged work rather than adding
  something new, use `fixup! <exact subject of the target commit>` so
  `git rebase --autosquash` can fold it in.

## Atomicity

Each commit is one reviewable step and leaves the codebase in a valid state. Key
principles (full guidance with decision trees and red flags in
`references/atomic-commits.md`):

1. **One reviewable step per commit** — each commit is one decision a reviewer
   can accept or question on its own; a feature or fix is usually several.
2. **Tests travel with implementation** — a feature and its tests belong in the
   same commit.
3. **A step's changes stay together** — files that work together for one step
   are committed together; separate steps aren't, however related.
4. **Refactoring is separate** — never mix refactoring or reformatting with
   behavior changes.
5. **Prefer fixups for corrections** — changes that repair a previous unmerged
   commit get `fixup!`, not a fresh subject.

Split whenever a reviewer could accept one part and question another. Keep parts
together only when splitting would leave a commit failing its checks or separate
a change from the tests that cover it.

## Workflow

1. **Inspect the full working state** — `git status --porcelain` plus `git diff`
   and `git diff --staged`. Account for every modified and untracked file before
   deciding anything.
2. **Take commit boundaries from the plan** — follow the sequence of subjects
   planned before writing, not whatever happens to be staged. If unrelated
   changes are tangled in the working tree, plan multiple commits rather than
   one catch-all.
3. **Stage precisely** — add specific paths, or `git add -p` when a file mixes
   concerns. Never `git add -A` / `git add .` without having reviewed every
   entry in `git status` first; scratch files and unrelated edits must not ride
   along.
4. **Commit with the message passed via heredoc** so multi-line bodies survive
   quoting:

   ```bash
   git commit -m "$(cat <<'EOF'
   Subject line in imperative mood

   Body explaining what changed and why.

   Closes #123
   EOF
   )"
   ```

5. **Validate** — after committing, re-check `git status`: hooks may have
   reformatted files. If a hook modified something the commit should contain,
   amend before moving on (see Ground Rules for when amending is allowed).

## Ground Rules

- **Let hooks run; never `--no-verify`.** If pre-commit hooks (lint-staged,
  prettier) silently don't run in a fresh worktree, the worktree is probably
  missing its own installed dependencies — install them rather than bypassing
  the hooks.
- **Never amend or rewrite commits already pushed to a shared branch** without
  explicit approval. Amending unpushed local commits is fine.
- **Committing and pushing are separate decisions.** Do not push unless the user
  asked for it or a skill that composes this one (e.g. `/wrap`, `/create-pr`)
  drives the push.

## Resources

- **`references/atomic-commits.md`** — atomic commit principles, decision trees,
  and red flags
- **`references/commit-format.md`** — full message format specification
