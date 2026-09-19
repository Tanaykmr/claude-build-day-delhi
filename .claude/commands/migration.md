---
allowed-tools: Bash(git diff:*), Bash(git status:*)
description: Generate db:generate and db:migrate commands from schema changes
model: sonnet
---

# Generate Migration Commands

Analyze changes to the database schema and output two ready-to-paste commands.

## Context

- Git status: !`git status -- src/lib/db/schema.ts`
- Staged diff: !`git diff --cached -- src/lib/db/schema.ts`
- Unstaged diff: !`git diff -- src/lib/db/schema.ts`

## Instructions

1. **Determine the diff to analyze**:
   - If there is a **staged diff** (from `git diff --cached`), use that as the source of truth.
   - If there is **no staged diff**, use the unstaged diff instead.
   - If there is **no diff at all**, tell the user there are no schema changes to migrate and stop.

2. **Derive a migration name** from the diff:
   - Read the actual column/table/enum changes (additions, renames, drops, type changes)
   - Create a concise, kebab-case name summarizing the changes (e.g., `add-client-tier-column`, `rename-needs-approval-to-needs-tech-pack-approval`, `add-presentations-table`)
   - If multiple unrelated changes exist, pick the most significant one or combine briefly (e.g., `add-status-col-and-rename-entry-mode`)

3. **Output exactly two commands** in a fenced code block, nothing else:

```bash
npm run db:generate -- --name=<migration-name>
npm run db:migrate
```

## Rules

- Output ONLY the two commands in a code block. No explanation, no commentary.
- The migration name must be kebab-case, lowercase, and descriptive of the actual schema change.
- Never include generic names like `update-schema` or `migration-1`. Be specific.
