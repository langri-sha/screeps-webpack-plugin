# Pull Request Creation Workflow Reference

This document provides detailed guidance on creating pull requests using the
pr-creator skill.

## Core Workflow

### 1. Determine Base Branch

The base branch is the branch that the PR will be merged into. Determining the
correct base branch is critical:

**Standard Branch:**

- Most PRs target `main` or `master`
- Use `git remote show origin` to identify the default branch
- Common default branches: `main`, `master`, `develop`

**Stacked Branch:**

- A stacked branch has a parent branch (other than main/master)
- Stacked branches are used for incremental feature development
- The parent branch becomes the base branch for the PR

**Detection Methods:**

1. **Git Town** (preferred if available):
   - Git Town stores parent branch configuration
   - Use `scripts/detect_stacked_branch.py` to check
   - Command: `git config --get git-town.parent.<branch-name>`
   - Returns the parent branch name if configured

2. **User Input:**
   - User may explicitly specify this is a stacked branch
   - User may provide the parent branch name
   - Always prioritize explicit user input

3. **Fallback:**
   - If no Git Town config and no user input, assume main/master
   - Better to ask the user if uncertain

### 2. Branch Name Handling

**Named Branch:**

- If on a named branch, use it as-is for the branch name
- Treat the branch name as a hint for the PR title, not the title itself
- Example: `feature/user-auth` → title: "Add user authentication"

**Detached HEAD:**

- Common when checking out specific commits or tags
- Must create a branch before creating PR
- Use `scripts/generate_branch_name.py` to generate a meaningful name
- The script analyzes commits and changes to suggest a name
- Always create the branch with: `git checkout -b <generated-name>`

**Deriving the PR Title:**

- Describe the change in plain language; the branch name and commit subjects are
  input, not the output
- When the PR resolves a specific issue, mirror the issue title where it already
  reads as a plain description
- Strip conventional-commit type prefixes (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, etc., including scoped forms like `feat(api):`) and branch
  prefixes (`feature/`, `fix/`, `bugfix/`, `hotfix/`)
- Drop jargon and markers such as `{ check }` or `[WIP]`
- Use sentence case with a leading imperative verb; keep acronyms uppercase
- Example: `fix/authentication-bug` → "Fix authentication bug"
- Example: `feat: add pdf export` → "Add PDF export"

### 3. Analyze Changes

To build a comprehensive understanding of the changes:

**Git Diff Analysis:**

```bash
# Get the full diff between base branch and HEAD
git diff <base-branch>...HEAD

# For file-level changes
git diff --name-status <base-branch>...HEAD
```

**Commit History Analysis:**

```bash
# Get all commits between base branch and HEAD
git log <base-branch>..HEAD --pretty=format:"%h %s%n%b"

# Get commit subjects only
git log <base-branch>..HEAD --pretty=format:"%s"
```

**What to Extract:**

1. **Files changed:** What files were modified, added, or deleted?
2. **Commit subjects:** High-level summary of changes
3. **Commit bodies:** Detailed context and reasoning
4. **Patterns:** Are these bug fixes, new features, refactoring, tests, docs?
5. **Scope:** What parts of the codebase are affected?

### 4. GitHub PR Template

**Finding the Template:**

GitHub PR templates can be located in several places:

1. `.github/PULL_REQUEST_TEMPLATE.md`
2. `.github/pull_request_template.md`
3. `PULL_REQUEST_TEMPLATE.md` (root)
4. `docs/PULL_REQUEST_TEMPLATE.md`

If multiple templates exist, GitHub typically uses the one in `.github/`
directory.

**Reading the Template:**

- Read the template file from the repository
- The template usually contains sections with headers and checkboxes
- Common sections: Summary, Changes, Test Plan, Screenshots, Notes

**Filling the Template:**

Keep the whole body under 150 words, whatever the template asks for.

1. **Summary Section:**
   - Why the change exists, plus what the diff can't show: manual steps,
     risk, rollout (1-3 sentences)
   - Written as the author, with no attribution or in the first person
   - Example: "API endpoints were open to anyone. Requests now need a JWT;
     existing clients must log in once after deploy."

2. **Changes/Details Section:**
   - Never list the changes; the diff and the commits already do
   - Skip the section, or use one sentence for a decision a reviewer would
     miss

3. **Test Plan Section:**
   - One line naming what ran, e.g. "`npm test`, and a manual login at
     `/api/login`"
   - No checklists

4. **Checkboxes:**
   - Leave unchecked if the template has checkboxes
   - The user or reviewers will check them during review
   - Don't assume completion of checklist items

### 5. User Input Handling

**Types of User Input:**

1. **Explicit Title:**
   - User: "Create PR titled 'Add dashboard feature'"
   - Use the provided title verbatim

2. **Explicit Description:**
   - User: "The description should mention this is for the Q1 milestone"
   - Incorporate into the appropriate template section

3. **Explicit Base Branch:**
   - User: "This PR should target the develop branch"
   - Override any auto-detection with user's specification

4. **Additional Context:**
   - User: "Mention that this fixes issue #123"
   - Add to relevant sections and include in PR body
   - GitHub will auto-link issues with `Fixes #123` syntax

5. **No User Input:**
   - Do your best with available information
   - Analyze git history and changes thoroughly
   - Generate reasonable defaults

**Priority Order:**

1. Explicit user input (highest priority)
2. Git Town configuration
3. Branch and commit analysis
4. Sensible defaults (lowest priority)

### 6. Creating the PR

**Using GitHub CLI (`gh`):**

```bash
# Basic PR creation
gh pr create --title "PR Title" --body "PR Description"

# Specify base branch
gh pr create --base <base-branch> --title "PR Title" --body "PR Description"

# With heredoc for multi-line body
gh pr create --title "PR Title" --body "$(cat <<'EOF'
Multi-line
PR description
here
EOF
)"
```

**Steps:**

1. Ensure all changes are committed
2. Push branch to remote: `git push -u origin <branch-name>`
3. Create PR with `gh pr create`
4. Return PR URL to user

**Error Handling:**

- If `gh` is not installed, inform the user
- If authentication fails, guide user to run `gh auth login`
- If push fails, check network and permissions

## Stacked Branches Deep Dive

### What Are Stacked Branches?

Stacked branches are a development pattern where:

- Feature work is split into multiple smaller PRs
- Each PR builds on top of the previous one
- Creates a "stack" of dependent PRs

**Example Stack:**

```
main
  └─ feature/user-model (PR #1)
      └─ feature/user-auth (PR #2)
          └─ feature/user-profile (PR #3)
```

### Git Town Integration

Git Town is a Git extension that helps manage stacked branches:

**Key Commands:**

- `git town parent`: Show parent of current branch
- `git config --get git-town.parent.<branch>`: Get parent programmatically
- `git town sync`: Sync all branches in the stack

**Configuration:** Git Town stores parent relationships in git config:

```
[git-town "parent"]
    feature/user-auth = feature/user-model
    feature/user-profile = feature/user-auth
```

### Creating Stacked PRs

When creating a PR for a stacked branch:

1. **Base Branch:** Use the parent branch, not main
2. **Title:** Describe this layer only — no series markers ("part 2/3")
3. **Description:** Describe this layer only. GitHub renders the stack natively,
   so never add a stack section, PR list, position marker, or "builds on #123"
   dependency note — a hand-kept copy only goes stale
4. **Review:** Stack order matters - review parent PRs first

### Detection Logic

```python
# Pseudo-code for detection
if user_specified_parent:
    base_branch = user_specified_parent
elif git_town_available:
    base_branch = detect_stacked_branch()
else:
    base_branch = get_main_branch()
```

## Best Practices

### PR Title

- Keep it concise (50-70 characters)
- Start with a verb when possible
- Be descriptive but not overly detailed
- Use plain language: no conventional-commit prefixes (`feat:`, `fix:`,
  `chore:`) and no code markers like `{ check }` — commits may keep the
  convention, the title must not
- A backticked `name` (package, tool, or symbol) is acceptable only when it
  genuinely aids clarity
- Example: "Add user authentication with JWT"

### PR Description

- Under 150 words; skip template sections with nothing to say
- Say why, not what; the diff shows what
- Link related issues
- Assume the reviewer knows the codebase

### Commit Messages

- Good commit messages make PR descriptions shorter
- Pull the why from commit bodies; don't repeat the subjects

### Branch Naming

- Use descriptive names
- Follow team conventions (if any)
- Common patterns: `feature/`, `fix/`, `refactor/`

## Troubleshooting

### "Not a git repository"

- Ensure you're in a git repository
- Run `git status` to verify

### "No commits between base and HEAD"

- Verify you're on the correct branch
- Check if changes are committed
- Confirm base branch is correct

### "Permission denied (push)"

- Check git remote: `git remote -v`
- Verify you have push access
- Try `gh auth refresh`

### "Failed to create PR"

- Ensure branch is pushed to remote
- Check if PR already exists
- Verify base branch exists on remote
