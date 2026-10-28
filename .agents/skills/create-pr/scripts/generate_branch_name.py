#!/usr/bin/env python3
"""
Generate a meaningful branch name from git commits and changes.

This script analyzes recent commits and changes to generate a descriptive,
dasherized branch name suitable for pull requests.

Usage:
    python3 generate_branch_name.py [base_branch]

Arguments:
    base_branch: The base branch to compare against (default: main)

Returns:
    A dasherized branch name based on recent commits
"""

import re
import subprocess
import sys
from collections import Counter

CONVENTIONAL_COMMIT_PREFIX = re.compile(
    r"^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)"
    r"(\([^)]*\))?!?:\s*",
    re.IGNORECASE,
)


def run_command(cmd: str) -> str:
    """Run a command and return stdout."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""


def get_main_branch() -> str:
    """Detect the main branch (main, master, or develop)."""
    branches = run_command("git branch -r").split("\n")
    for branch in branches:
        branch = branch.strip()
        if "origin/main" in branch:
            return "main"
        elif "origin/master" in branch:
            return "master"
    return "main"


def get_commit_subjects(base_branch: str) -> list[str]:
    """Get commit subjects between base branch and HEAD."""
    cmd = f"git log --pretty=format:%s {base_branch}..HEAD"
    output = run_command(cmd)
    if not output:
        # Try getting last commit if no base branch diff
        output = run_command("git log -1 --pretty=format:%s")
    return [line.strip() for line in output.split("\n") if line.strip()]


def extract_keywords(subjects: list[str]) -> list[str]:
    """Extract meaningful keywords from commit subjects."""
    # Common words to ignore
    stop_words = {
        "add",
        "added",
        "adding",
        "update",
        "updated",
        "updating",
        "fix",
        "fixed",
        "fixing",
        "remove",
        "removed",
        "removing",
        "the",
        "a",
        "an",
        "and",
        "or",
        "for",
        "to",
        "of",
        "in",
        "on",
        "at",
        "from",
        "with",
        "by",
        "is",
        "was",
        "are",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "should",
        "could",
        "may",
        "might",
        "must",
        "can",
    }

    all_words: list[str] = []
    for subject in subjects:
        # Remove special characters and split into words
        words = re.sub(r"[^\w\s-]", "", subject.lower()).split()
        # Filter out stop words and very short words
        words = [w for w in words if len(w) > 2 and w not in stop_words]
        all_words.extend(words)

    # Get most common words
    if not all_words:
        return []

    word_counts = Counter(all_words)
    # Return top 3-4 most common words
    return [word for word, count in word_counts.most_common(4)]


def dasherize(text: str) -> str:
    """Convert text to dasherized format."""
    # Replace underscores and spaces with dashes
    text = re.sub(r"[_\s]+", "-", text)
    # Remove any non-alphanumeric characters except dashes
    text = re.sub(r"[^a-z0-9-]", "", text.lower())
    # Remove multiple consecutive dashes
    text = re.sub(r"-+", "-", text)
    # Remove leading/trailing dashes
    return text.strip("-")


def generate_branch_name(base_branch: str | None = None) -> str:
    """Generate a branch name based on commits."""
    if not base_branch:
        base_branch = get_main_branch()

    # Get commit subjects
    subjects = get_commit_subjects(base_branch)

    if not subjects:
        # Fallback: use timestamp
        import datetime

        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"feature-{timestamp}"

    # Try to use the most recent commit subject if it's descriptive enough
    first_subject = CONVENTIONAL_COMMIT_PREFIX.sub("", subjects[0]).strip()

    dasherized_subject = dasherize(first_subject)

    # If the first commit subject is descriptive enough (3-6 words), use it
    if 3 <= len(dasherized_subject.split("-")) <= 6:
        return dasherized_subject

    # Otherwise, extract keywords from all commits
    keywords = extract_keywords(subjects)
    if keywords:
        return "-".join(keywords[:4])

    # Fallback to dasherized first subject
    return dasherized_subject if dasherized_subject else f"feature-{subjects[0][:20]}"


def main() -> int:
    """Main function."""
    base_branch = sys.argv[1] if len(sys.argv) > 1 else None
    branch_name = generate_branch_name(base_branch)
    print(branch_name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
