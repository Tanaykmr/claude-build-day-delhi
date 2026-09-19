---
name: pr-review
description: Review comments on the current PR (both top-level and inline review comments) and assess each for validity. Use when the user wants to check PR feedback, review CodeRabbit comments, or triage PR discussions.
argument-hint: "[pr-number]"
allowed-tools: Bash(gh *) Read Grep Glob
---

## Task

Fetch and assess all comments on the current branch's pull request. If a PR number is provided as `$ARGUMENTS`, use that instead.

## Steps

1. **Identify the PR.** If `$ARGUMENTS` is provided, use that as the PR number. Otherwise, run `gh pr view --json number,url,title` to get the current branch's PR.

2. **Fetch both comment types in parallel:**
   - **Review comments** (inline, on specific lines): `gh api repos/{owner}/{repo}/pulls/{number}/comments`
   - **Top-level comments** (conversation): `gh api repos/{owner}/{repo}/issues/{number}/comments`

   Extract owner/repo from the PR URL or from `gh repo view --json nameWithOwner`.

3. **For each comment**, read the referenced file and surrounding code to understand context. Group comments by file.

4. **Assess each comment** for validity:
   - Is the suggestion correct? Does it apply to the current code?
   - Is it a real bug/risk, or a false positive?
   - Is it already fixed?
   - What's the severity? (critical, should-fix, nice-to-have, skip)

5. **Report findings** organized by file, with your verdict on each comment. Be concise — one or two sentences per comment explaining whether you agree/disagree and why.

## Notes

- Skip bot comments that are just PR summaries or changelogs (e.g., CodeRabbit's initial PR summary).
- Focus on actionable comments — suggestions, issues, questions.
- Always verify claims against the actual current code before agreeing or disagreeing.
- If a comment references an SDK version, env var behavior, or external API, verify the claim (check package.json, node_modules, etc.) rather than trusting it at face value.
