# Atomic Commits Guide

## What is an Atomic Commit?

An atomic commit is a self-contained unit of work that:

- Accomplishes a single, well-defined goal
- Can stand alone and make sense to someone reviewing it
- Leaves the codebase in a valid, working state
- Holds one decision a reviewer weighs on its own. It is too small only when it
  fails its checks alone, or separates a change from the tests that cover it

## Core Principles

### 1. One Logical Feature or Fix Per Commit

Each commit should represent one discrete piece of functionality or bug fix. If
you find yourself using "and" in the commit message, consider splitting it.

**Good (two commits):**

```
Commit 1: Add user authentication module
Commit 2: Integrate authentication into login page
```

**Bad (one commit with mixed concerns):**

```
Add user authentication module and integrate it into login page
```

### 2. Tests and Implementation Go Together

Tests that verify a feature belong in the same commit as the feature itself.
This ensures:

- The commit is reviewable as a complete unit
- Tests pass at this point in history
- The feature and its test coverage move together

**Example:**

```
Commit: Add password strength validation
Changes:
  - Implement validation logic in auth/password.py
  - Add unit tests in tests/auth/test_password.py
  - Update validation rules in config
```

### 3. A Step's Files Stay Together

Files that work together to accomplish one step should be committed together.
Separate steps don't, however related they are. For example:

- Component file + CSS/styling file
- Database migration + model update
- API endpoint + corresponding test

**Example:**

```
Commit: Create user profile card component
Changes:
  - Add UserProfileCard.jsx (component)
  - Add UserProfileCard.css (styling)
  - Add UserProfileCard.test.jsx (tests)
```

### 4. Refactoring and Feature Work Are Separate

If you refactor while implementing a feature, those should be two commits. This
makes the feature changes clear and the refactoring easy to review separately.

**Example:**

```
Commit 1: Refactor user service to use dependency injection
Commit 2: Add two-factor authentication (uses refactored service)
```

## Identifying When to Fixup vs. New Commit

### Use Fixup When:

The current changes are **editing, correcting, or improving** work from a
previous commit in the same feature branch. The changes don't add new
functionality but rather:

- Fix a bug introduced in a previous commit
- Add missing code or logic from a previous commit
- Improve or clarify previous implementation
- Complete unfinished work

**Pattern to watch for:** If the subject line would essentially be "Fix
{previous commit subject}" or "Complete {previous commit subject}", it should be
a fixup.

**Examples:**

```
Previous: Add password strength validation
Current changes: Fix edge case in validation regex
→ Should be: fixup! Add password strength validation
```

```
Previous: Create user profile card component
Current changes: Add missing prop validation
→ Should be: fixup! Create user profile card component
```

```
Previous: Implement OAuth flow
Current changes: Add missing error handling
→ Should be: fixup! Implement OAuth flow
```

### Use New Commit When:

The changes introduce **new functionality or distinct improvements**, even if
they build on previous work. The changes are:

- A new feature that uses previous work
- An enhancement to a previous feature
- A separate concern that happens to touch the same files

**Examples:**

```
Previous: Add password strength validation
Current: Add password breach checking via external API
→ New commit: Add password breach detection

(Not a fixup because this is new functionality, not fixing the validation)
```

```
Previous: Create user profile card component
Current: Add avatar image display to card
→ New commit: Add avatar display to user profile

(New feature that builds on previous work, not a fix to it)
```

## How to Make Fixup Commits

If a commit should be a fixup, use git's fixup feature:

```bash
# Create a fixup commit for a specific commit
git commit --fixup <commit-hash-or-ref>

# Later, when squashing (interactive rebase)
git rebase -i --autosquash
```

Or manually with a fixup message:

```bash
git commit -m "fixup! Add password strength validation"
```

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

## Examples of Good Atomic Commits

### Example 1: Feature Implementation

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

### Example 2: Bug Fix

```
Commit: Fix race condition in session cleanup

Changes:
  - Add mutex to session cleanup routine (session.py)
  - Update session manager to use atomic operations (manager.py)
  - Add regression test (tests/test_session.py)

Accomplishes: Sessions are now cleaned up safely without data corruption
```

### Example 3: Refactoring + Feature

```
Commit 1: Extract database queries into repository pattern

Changes:
  - Create UserRepository class (repositories/user.py)
  - Move all user queries to repository (queries moved from models)
  - Update services to use repository (services/user_service.py)
  - Add tests (tests/repositories/)

Commit 2: Add user search by email

Changes:
  - Add search_by_email method to UserRepository
  - Create API endpoint (routes/users.py)
  - Add tests (tests/routes/)

Accomplishes: Code is refactored for testability, then new feature is added cleanly
```

### Example 4: Infrastructure Change

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
