---
name: pr-create
description: Open a PR with a title and description derived from the commits that are on the head branch but not on the base. Use when the user wants to raise/create/open a pull request, or says "PR this branch into X".
argument-hint: "[--base <branch>] [--head <branch>] [--draft]"
allowed-tools: Bash(gh *) Bash(git *) Read
---

## Task

Create a pull request from `--head` into `--base`, with a title and body that summarize every commit on head that isn't already on base.

## Arguments (`$ARGUMENTS`)

- `--base <branch>` — target branch. Default: the repo default branch (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`).
- `--head <branch>` — source branch. Default: current branch (`git branch --show-current`).
- `--draft` — open as draft.

`--to` is accepted as an alias for `--head`.

## Steps

1. **Resolve branches.** Fill in defaults for anything not passed. If head == base, stop and say so.

2. **Check for an existing PR:** `gh pr view <head> --json number,url,state`. If one is open, do NOT create a second — update its title/body with `gh pr edit` instead and report the URL.

3. **Push head if needed:** `git push -u origin <head>` (skip if `git status -sb` shows it's already in sync with its upstream).

4. **Gather the delta** (fetch first so base is current — `git fetch origin <base>`):
   - `git log origin/<base>..<head> --format='%h %s%n%b'`
   - `git diff origin/<base>...<head> --stat`

   Read the actual diff for anything the commit subjects don't explain. Commit messages lie by omission.

5. **Write title and body.**
   - Title: one line, conventional-commit style matching the repo's history (`feat(scope): ...`). Describe the whole delta, not just the last commit.
   - Body: markdown, in this shape — drop any section that would be empty:

     ```
     ## What changed
     <2-4 sentences: what this does and why>

     ## Details
     - <bullet per meaningful change, grouped by area — not one per commit>

     ## Notes
     - <migrations, config/env changes, breaking changes, follow-ups>
     ```

   Every bullet must trace to a real commit or diff hunk. Do not invent testing sections or checklists that weren't done.

6. **Create it:** `gh pr create --base <base> --head <head> --title <title> --body-file <tmpfile>` (add `--draft` if asked). Write the body to a file in the scratchpad dir — heredocs in `--body` mangle backticks.

7. **Report** the PR URL and one line on what it covers.

## Rules

- Never force-push, rebase, amend, or otherwise rewrite history.
- If the head branch has commits already merged into base (stale branch), say so rather than describing them as new.
