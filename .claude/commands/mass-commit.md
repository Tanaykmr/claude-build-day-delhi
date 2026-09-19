---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
description: Segregate staged changes into logical commits and write commit.md
model: sonnet
---

# Mass Commit

Analyze the STAGED changes, segregate them into logical commits **only where it makes sense**, and write ready-to-run `git commit` commands to `commit.md` at the repo root. This command NEVER commits — it only writes the file.

## Scope

- **Only staged files.** Ignore unstaged/untracked changes entirely.
- **Shell escaping**: paths may contain shell-special chars (Next.js routes like `[id]`, `[token]`). Wrap every path in single quotes in emitted commands: `git add 'src/app/api/quotes/[id]/route.ts'`.

## Context

- Staged files: !`git status --short`
- Staged diff: !`git diff --cached`
- Recent commits: !`git log --oneline -5`

## Flow

1. **Read the staged diff per file.** Understand what each change actually does.
2. **Segregate — by logic, not by count:**
   - **One commit** when all staged changes serve a single purpose (a feature and the endpoint that uses it, a fix and its test). Do NOT force a split.
   - **Multiple commits** ONLY when there are clearly separable concerns (e.g. an unrelated schema change + a bugfix + a doc update). Each split commit must be independently meaningful.
   - Order commits so earlier ones don't depend on later ones.
3. **Write `commit.md`** at the repo root with:
   - A **"Segregated commits"** section: for each logical group, the `git add '<path>'...` line(s) followed by the `git commit` command.
   - A **"Single joint commit"** section: one `git add` of all staged files + one `git commit` covering everything, so the user can pick either path.
   - If segregation isn't warranted, say so in one line and emit only the single-commit section.
4. **Report** in chat: the number of logical groups and a one-line rationale for the split (or for not splitting). Do not run any commit.

## Commit Format

**`type(scope): subject`** — conventional commits (commitlint-enforced).

- **Type**: feat, fix, refactor, docs, style, test, chore, build, ci, perf
- **Scope is REQUIRED** (`scope-empty` is enforced). Lowercase component/area (auth, db, api, ui). Docs: `docs(project)`, `docs(schema)`.
- **Subject**: imperative mood, lowercase start, no period, ≤50 chars.

Multi-line messages use heredoc — **closing `EOF` and `)"` must have ZERO leading whitespace**:

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

Body explaining what and why, wrapped at 72 characters.
EOF
)"
```

## When to include a body

Title-only is acceptable ONLY when ALL are true: ≤2 files, trivially small diff, subject fully captures WHAT and WHY, no underlying design decision. **Otherwise include a body** explaining WHAT changed and WHY. Default to a body when in doubt.

## commit.md shape

````markdown
# Commit Plan

## Segregated commits

### 1. feat(api): add turbine polling route

```bash
git add 'src/app/api/cron/sync-turbine-orders/route.ts'
git commit -m "feat(api): add turbine polling route"
```

### 2. refactor(turbine): extract status mapping helper

```bash
git add 'src/lib/services/turbine-status.ts' 'src/lib/services/turbine-service.ts'
git commit -m "$(cat <<'EOF'
refactor(turbine): extract status mapping helper
...
EOF
)"
```

## Single joint commit

```bash
git add <all staged paths>
git commit -m "$(cat <<'EOF'
feat(turbine): add order polling and status mapping
...
EOF
)"
```
````
