---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
description: Headless commit — groups changes into logical commits without confirmation
model: sonnet
---

# Auto-Commit (Headless)

Stage and commit all changes without asking for confirmation. Designed for unattended scripts (`implement.sh`, `review.sh`).

## Context

- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

**Shell escaping**: File paths may contain shell-special characters (e.g., Next.js dynamic routes like `[id]`, `[token]`). When passing paths to git commands, wrap each path in single quotes to prevent glob expansion. For example: `git add 'src/app/api/quotes/[id]/route.ts'`

## Flow

1. **Survey changes**: Run `git status` (never use `-uall` flag) and `git diff --stat` to see all modified/untracked files.

2. **Group into logical commits**: Decide whether changes should be ONE commit or MULTIPLE:
   - **One commit** when: all changes serve a single purpose (e.g., "add turbine service", "rewrite stripe webhook")
   - **Split into multiple commits** when: changes have clearly separable concerns (e.g., a new service file + an endpoint that uses it + a schema change). Each commit should be independently meaningful.
   - When splitting, order commits so earlier ones don't depend on later ones.

3. **For each commit** (in order):
   a. Stage ONLY the files for this commit: `git add '<path1>' '<path2>'` — NEVER `git add -A` or `git add .`
   b. Generate a conventional commit message following the format below.
   c. Commit immediately — do NOT ask for confirmation:

   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): subject

   Body here.
   EOF
   )"
   ```

   d. Verify with `git status` that the commit succeeded before moving to the next one.

4. **Final verification**: Run `git log --oneline -5` to confirm all commits landed.

## Commit Format

**`type(scope): subject`** — conventional commits.

- **Type**: feat, fix, refactor, docs, style, test, chore, build, ci, perf
- **Scope is REQUIRED** (commitlint enforces `scope-empty`). Lowercase component/area (auth, db, api, ui). For docs: `docs(project)`, `docs(schema)`, etc.
- **Subject**: imperative mood, lowercase start, no period, ≤50 chars

**CRITICAL**: The closing `EOF` and `)"` must have NO leading spaces/tabs.

## When to include a body

A title-only commit is acceptable ONLY when ALL of the following are true:

- The change touches ≤ 2 files
- The diff is trivially small (e.g., rename, typo fix, version bump, single-line tweak)
- The subject line fully captures both WHAT and WHY

**In ALL other cases, include a body.** The body should explain WHAT changed and WHY.

## Rules

- NEVER ask for confirmation — this is headless mode. Just commit.
- NEVER use `git add -A` or `git add .` — always add specific files.
- NEVER commit files that likely contain secrets (.env, credentials, etc.).
- NEVER edit backend-revamp-plan.md or any tracking docs — those are maintained manually.
- If there are no changes to commit, state "Nothing to commit" and stop.
