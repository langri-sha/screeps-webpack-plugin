#!/usr/bin/env python3
"""
Detect if the current branch is a stacked branch using Git Town.

A stacked branch is a branch that has a parent branch (other than main/master).
This script checks Git Town's parent configuration to determine if the current
branch is stacked.

Usage:
    python3 detect_stacked_branch.py

Returns:
    - Exit code 0 if branch is stacked (prints parent branch name)
    - Exit code 1 if branch is not stacked
    - Exit code 2 if Git Town is not available or configured
"""

import subprocess
import sys


def run_command(cmd: str) -> tuple[str, str, int]:
    """Run a command and return stdout, stderr, and return code."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timed out", 1


def get_current_branch() -> str | None:
    """Get the current branch name."""
    stdout, stderr, code = run_command("git rev-parse --abbrev-ref HEAD")
    if code != 0 or stdout == "HEAD":
        return None
    return stdout


def get_parent_branch() -> tuple[str | None, str | None]:
    """Get the parent branch using Git Town."""
    # First check if Git Town is available
    stdout, stderr, code = run_command("git town version 2>/dev/null")
    if code != 0:
        return None, "Git Town not available"

    # Get the parent branch configuration
    current_branch = get_current_branch()
    if not current_branch:
        return None, "Not on a named branch"

    # Try to get parent from Git Town config
    stdout, stderr, code = run_command(
        f"git config --get git-town.parent.{current_branch}"
    )
    if code == 0 and stdout:
        return stdout, None

    return None, "No parent branch configured"


def main() -> int:
    """Main function to detect stacked branch."""
    parent, error = get_parent_branch()

    if parent:
        print(parent)
        return 0
    elif error == "Git Town not available":
        print(f"Error: {error}", file=sys.stderr)
        return 2
    else:
        # Not a stacked branch
        return 1


if __name__ == "__main__":
    sys.exit(main())
