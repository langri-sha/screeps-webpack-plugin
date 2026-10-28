# Commit Message Format

## Overview

A commit has a plain imperative subject, an optional body, and its issue and PR
references at the end of the body.

## Format Rules

Subject is a plain imperative sentence, around 50 characters, no trailing
period.

**Never use Conventional Commits or any type prefix** — no `feat:`, `fix:`,
`chore:`, `fix(scope):`, or similar. Bot commits in the history (Renovate,
dependabot, squash-merge titles) are not evidence that the repo uses the format.
The only exceptions: the repository mechanically enforces it (commitlint,
semantic-release, a commit-msg hook), or a project-level AGENTS.md/CLAUDE.md
explicitly requires it.

**Good:**

```
Add user authentication
Fix database connection pool
Implement caching strategy
Update test coverage
```

**Bad — type prefixes:**

```
feat(auth): add user authentication
fix: database connection pool
chore(deps): update test coverage
```

## Message Body (Optional)

Separate the subject from body with a blank line. The body should explain:

- **What** was changed
- **Why** it was changed
- Any relevant context or trade-offs

Keep body lines wrapped at 72 characters.

**Example:**

```
Add two-factor authentication

- Implement TOTP-based verification
- Add recovery codes for account access
- Update user settings to manage 2FA

This improves account security by requiring a second factor
during login. Users can manage their authentication methods
in account settings.

Fixes #1234
```

## Issue and PR References

Issue and PR references belong in the **body**, never in the subject line. Refs
in the subject clutter `git log --oneline`, look noisy in PR listings, and lose
meaning once a branch is forked or rebased.

**Rules:**

- **Disallowed in the subject** — no `(#123)`, no `Closes #123`, no `Fixes #45`,
  no bare `#123`
- **Allowed and encouraged in the body** — place each ref on its own line at the
  end (`Closes #123`, `Fixes #45`, `Refs #789`)
- A `fixup!` commit inherits the same rule through its referenced subject:
  because the original subject carries no ref, neither does the fixup

**Bad — ref in the subject:**

```
Add rate limiting to login endpoint (#123)
```

**Good — subject stays clean, ref moves to the body:**

```
Add rate limiting to login endpoint

Throttle repeated login attempts per IP to blunt credential-stuffing
runs. Failures now back off exponentially after the fifth attempt.

Closes #123
```

## Fixup Commits

When a commit should fix or amend a previous commit, indicate this clearly:

```
fixup! <previous commit subject>
```

This tells reviewers and tools (like `git rebase --autosquash`) that this commit
belongs with the previous one.

**Example:**

```
Previous commit: Add password validation
Current commit: fixup! Add password validation

(Fixes a bug or completes implementation from previous commit)
```

The text after `fixup!` must reproduce the target's subject verbatim, or
`--autosquash` will not match it.

When preparing for merge, fixup commits can be automatically squashed with their
target commit using:

```bash
git rebase -i --autosquash origin/main
```
