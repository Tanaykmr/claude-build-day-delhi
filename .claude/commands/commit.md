---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*)
description: Generate commit message for referenced files and commit after confirmation
model: sonnet
---

# Commit Referenced Files

Generate a commit message for the referenced files, then offer to stage and commit.

## Scope

**Only consider files passed as `$ARGUMENTS`.** Ignore all other changed files — they are out of scope for this commit. The context below is provided only to help determine the state of the referenced files.

**Shell escaping**: File paths may contain shell-special characters (e.g., Next.js dynamic routes like `[id]`, `[token]`). When passing `$ARGUMENTS` to git commands, wrap each path in single quotes to prevent glob expansion. For example: `git diff -- 'src/app/api/quotes/[id]/route.ts'`

## Context

- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

Do NOT run `git status` — it shows all changed files and causes you to drift outside scope. Instead, for each file in `$ARGUMENTS`, run these two commands to determine its state:

- `git diff --cached -- '<path>'` (staged changes — empty means not staged)
- `git diff -- '<path>'` (unstaged changes — empty means no unstaged edits)

If both are empty, check if the file is untracked: `git ls-files --others --exclude-standard -- '<path>'`

## Flow

1. **Determine file state per file**: For each `$ARGUMENTS` file, determine its state:
   - **Staged (with or without additional unstaged changes)**: Use ONLY the staged diff (`git diff --cached -- <file>`). Ignore any unstaged changes on top — those are not part of this commit.
   - **Unstaged or untracked (not staged at all)**: Use the `@file` context / unstaged diff as the source of truth.
2. **Generate commit message**: Analyze ONLY the in-scope changes from step 1. Present the message **before** any staging questions.
3. **Stage if needed**: If any in-scope files aren't staged, list them and ask to stage. Adjust message if user declines some. Skip entirely if all already staged.
4. **Commit**: Ask to confirm, then execute.

## Commit Format

**`type(scope): subject`** — conventional commits.

- **Type**: feat, fix, refactor, docs, style, test, chore, build, ci, perf
- **Scope is REQUIRED** (commitlint enforces `scope-empty`). Lowercase component/area (auth, db, api, ui). For docs: `docs(project)`, `docs(schema)`, etc.
- **Subject**: imperative mood, lowercase start, no period, ≤50 chars

For commits with a body, use heredoc — **closing `EOF` and `)"` must have NO leading whitespace**:

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

Body explaining what and why, wrapped at 72 characters.
Can span multiple lines if needed.
EOF
)"
```

## When to include a body

The guiding principle: **small, atomic changes can be title-only; anything bigger should err on the side of adding a description.**

A title-only commit is acceptable ONLY when ALL of the following are true:

- The change touches ≤ 2 files
- The diff is trivially small (e.g., rename, typo fix, version bump, single-line tweak)
- The subject line fully captures both WHAT and WHY
- There is no underlying design decision, tradeoff, or context behind the change

**In ALL other cases, you MUST include a body.** Specifically, always add a body when:

- The changes have an underlying story or rationale (why this approach?)
- Multiple files changed, even if each change is small
- Any logic change, even a one-liner, that has non-obvious motivation
- New features, bug fixes, refactors (explain the motivation)
- Breaking changes, behavior modifications, schema changes
- Changes that affect other parts of the system

**Default to including a body. When in doubt, add one.**

The body should explain WHAT changed and WHY — the story behind the diff. Provide context that isn't obvious from the code. If the changes involve decision-making, tradeoffs, or non-obvious reasoning, the body MUST capture that.
