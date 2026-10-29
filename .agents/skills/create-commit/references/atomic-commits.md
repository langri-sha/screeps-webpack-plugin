# Atomic Commits Guide

An atomic commit holds one decision a reviewer weighs on its own and leaves the
codebase valid. It is too small only when it fails its checks alone, or
separates a change from the tests that cover it.

## Decision Tree

When deciding if changes should be split or combined:

```
Do the changes accomplish a single logical goal?
├─ YES → Continue to next question
└─ NO → SPLIT into separate commits

Are they all necessary to achieve that goal?
├─ YES → Continue to next question
└─ NO → SPLIT into separate commits

Is one part a fix/correction to another part?
├─ YES → Consider FIXUP instead of new commit
└─ NO → Continue to next question

Could a reviewer accept one part and question another?
├─ YES → Continue to next question
└─ NO → One commit ✓

Would splitting leave a commit failing its checks, or separate a change from
the tests that cover it?
├─ YES → Keep those parts in one commit ✓
└─ NO → SPLIT into separate commits
```

Size and touching the same files or component are never reasons to combine.

## Fixup or New Commit

Use a fixup when the change edits, corrects or completes work from an earlier
commit on the same unmerged branch: a bug it introduced, logic it missed, or
work it left unfinished. If the subject would read "Fix {previous subject}" or
"Complete {previous subject}", it is a fixup.

```
Previous: Add password strength validation
Current changes: Fix edge case in validation regex
→ Should be: fixup! Add password strength validation
```

Use a new commit when the change adds functionality or a distinct improvement,
even when it builds on earlier work:

```
Previous: Add password strength validation
Current: Add password breach checking via external API
→ New commit: Add password breach detection
```

Create a fixup with `git commit --fixup <commit>`, and fold fixups into their
targets without moving the branch onto a newer default branch:

```bash
GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash "$(git merge-base HEAD origin/<default>)"
```

## Examples

### A feature

A feature is a sequence of steps, and each step is a commit the reviewer can
accept or question on its own:

```
Commit 1: Track email verification on users
  - Add verification status to the user model (models/user.py)
  - Add tests (tests/models/test_user.py)

Commit 2: Generate email verification tokens
  - Add token generation (auth/tokens.py)
  - Add tests (tests/auth/test_tokens.py)

Commit 3: Send the verification email
  - Create the email sending service (services/email.py)
  - Add tests (tests/services/test_email.py)

Commit 4: Verify email addresses from the emailed link
  - Add the verification endpoint (routes/verify_email.py)
  - Add tests (tests/routes/test_verify_email.py)

Accomplishes: Users can verify their email address, built up one step at a time
```

### An infrastructure change

Bringing an existing PostHog project under Terraform takes seven decisions, so
seven commits:

```
Commit 1: Pin the PostHog Terraform provider
Commit 2: Keep the PostHog API key and organization ID in Secret Manager
Commit 3: Configure the PostHog provider from Secret Manager
Commit 4: Import the PostHog project
Commit 5: Take the PostHog project ID and token for GitHub from the project
Commit 6: Publish npm downloads with the token from the PostHog project
Commit 7: Drop the hand-maintained PostHog project token secret
```

A reviewer can accept the provider and question where its secrets live, or
accept the import and question dropping the old secret, so none of these share a
commit.

## Red Flags for Non-Atomic Commits

- **Multiple "and"s in the subject**: "Add auth AND create profile AND fix bug"
- **Unrelated file types**: Changes to completely different systems (auth +
  database schema + UI)
- **Large line count with mixed changes**: If you can't describe the commit in
  one sentence
- **Tests for old features mixed with new ones**: Tests should travel with their
  implementation
- **"Work in progress" feeling**: Incomplete implementations that need follow-up
  commits to finish
