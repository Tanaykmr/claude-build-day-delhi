---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
description: Generate commit message from staged changes
model: sonnet
---

# Generate Commit Message

Analyze the staged files and git diffs to GENERATE THE BASH MESSAGE FOR THE COMMIT.
It should be an ESLint-compliant commit message with proper scope and description.

## Context

- Staged files: !`git status`
- Changes: !`git diff --cached`
- Recent commits: !`git log --oneline -5`

## Instructions

1. Analyze the changes to determine:
   - The primary scope (e.g., feat, fix, refactor, docs, style, test, chore, build, ci, perf)
   - The component or area affected (e.g., auth, database, api, ui)
   - A brief, imperative summary of the changes
   - Whether the changes need a body (see body guidelines below)

2. Generate a complete git commit command that can be copy-pasted:
   - For simple commits (single line):
     ```
     git commit -m "type(scope): subject"
     ```
   - For commits with a body (use heredoc format):
     ```bash
     git commit -m "$(cat <<'EOF'
     type(scope): subject
     ```

Body explaining what and why, wrapped at 72 characters.
Can span multiple lines if needed.
EOF
)"

````

- **CRITICAL**: The closing `EOF` and `)"` must have NO leading spaces/tabs

3. **When to SKIP a body** (title-only commits are the EXCEPTION, not the rule):
   A title-only commit is appropriate ONLY when ALL of the following are true:
   - The change touches ≤ 2 files
   - The diff is trivially small (e.g., rename, typo fix, version bump, single-line tweak)
   - The subject line fully captures both WHAT and WHY
   - There is no underlying design decision, tradeoff, or context behind the change

   **In ALL other cases, you MUST include a body.** Specifically, always add a body when:
   - The changes have an underlying story or rationale (why this approach?)
   - Multiple files changed, even if each change is small
   - Any logic change, even a one-liner, that has non-obvious motivation
   - New features, even small ones
   - Bug fixes (explain what was broken and why)
   - Refactors (explain the motivation)
   - Breaking changes or behavior modifications
   - Database migrations or schema changes
   - Changes that affect other parts of the system

   **Default to including a body. When in doubt, add one.**

4. **Output format**:
   - Provide ONLY the complete git commit command
   - User should be able to copy and paste it directly
   - No additional explanation or commentary needed
   - Use heredoc format for multi-line messages
   - **IMPORTANT**: When using heredoc, ensure closing `EOF` and `)"` have ZERO indentation (start at column 0)
   - Put the command in a code block with ```bash for proper formatting

## Rules

- **Type**: Must be one of: feat, fix, refactor, docs, style, test, chore, build, ci, perf
- **Scope**: **REQUIRED** — commitlint enforces `scope-empty` so every commit MUST have a scope in parentheses. Lowercase, represents the component/area (e.g., auth, db, api, ui, deps, docs, config). For documentation-only changes use `docs(project)`, `docs(schema)`, etc. — never omit the scope.
- **Subject**:
  - Imperative mood ("add" not "adds" or "added")
  - No period at the end
  - No more than 50 characters
  - Lowercase first letter
- **Body** (include by default — omit only for trivial changes):
  - Explain WHAT changed and WHY — the story behind the diff
  - Wrap at 72 characters
  - Separate from subject with blank line
  - Provide context that isn't obvious from the code diff
  - If the staged changes involve any decision-making, tradeoffs, or non-obvious reasoning, the body MUST capture that

## Example Output

Simple commit (single line):

````

git commit -m "feat(auth): add user session management"

````

Complex commit (with body):

```bash
git commit -m "$(cat <<'EOF'
feat(auth): add user session management

Implements Redis-backed session storage with automatic token
refresh. Sessions expire after 7 days of inactivity and support
concurrent login across multiple devices. This replaces the
previous JWT-only approach to enable better session control.
EOF
)"
````

Other examples:

- `git commit -m "fix(db): resolve schema migration issue"`
- `git commit -m "refactor(api): simplify request validation logic"`
- `git commit -m "docs(readme): update installation instructions"`
