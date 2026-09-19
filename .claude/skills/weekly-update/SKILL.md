---
name: weekly-update
description: Autonomously draft the Weekly Engineering Update from GitHub commits, in Tanay's #bulk-tripod voice, and print it in the terminal. NEVER send it to Slack. Use when the user asks for a weekly update, engineering update, or status update draft.
---

# Weekly Engineering Update Generator

Draft the weekly update exactly like the ones posted in #bulk-tripod. Output goes to the **terminal only — never send to Slack**, even if Slack tools are available.

## 1. Determine the window

- Default: the last 7 full days ending yesterday (updates are posted Mon/Sun for the prior Mon–Sun week).
- If the user passes a range as args (e.g. "Jun 29–Jul 5"), use that.

## 2. Gather the facts (commits are the source of truth)

Run from the repo root:

```bash
# What shipped (all branches, no merge noise)
git log --all --since="<start>" --until="<end>" --no-merges --date=short --pretty="%h %ad %an %s"

# What landed via PR (better titles than raw commits)
gh pr list --state merged --search "merged:>=<start-ISO>" --json title,mergedAt,body --limit 50

# What's still open = In Progress candidates
gh pr list --state open --json title,updatedAt --limit 20
```

Also read `progress.md` for revamp status and, if it exists, the previous update draft/notes. In-progress items from the previous week's update that don't appear in this week's merged work stay under **In Progress**.

Blockers cannot be derived from git. Infer candidates from commit messages / progress.md (e.g. "waiting on", "pending data"), list them, and mark any guess with `[VERIFY]` so the user can edit before posting.

## 3. Translate commits → business language

This is the core skill. Rules, derived from the real posted updates:

- **Lead with the business objective, garnish with one technical detail.** Not "Migrated GCS to R2" but: "Migrated all file and image uploads to Cloudflare R2, retiring the Google Cloud + Uppy stack and removing ~3,300 lines of legacy image-processing code."
- **Say who benefits and how**: "partners can now place orders with us and get automatic status updates back", "Partners see accurate shipping costs at quote time", "the team can now access and try it directly."
- **Quantify when the numbers are impressive** (~28,600 lines added / ~14,400 removed across 184 files), skip them when they're not.
- **Bugs are described by their customer impact, not their code**: "Fixed a pricing bug that double-charged for decoration color tiers" — never file paths, function names, or PR numbers.
- **Group many small commits into one outcome bullet.** 15 commits on one feature = 1 bullet. Aim for 5–8 Completed bullets total.
- **Verb tense**: Completed = past tense ("Deployed", "Built", "Fixed", "Hardened"). In Progress = bare infinitive ("Build the MoneyDolly API", "Split into development, staging and production environments").
- Allowed proper nouns: product/partner names (MoneyDolly, Turbine, Stripe, R2, PSRESTFUL), environments, URLs. Banned: route paths, table names, service file names, "refactor", "DTO", "endpoint" unless it's a partner-facing API endpoint.
- One line per bullet where possible; a second clause with an em dash for the "why it matters."

## 4. Output format (copy exactly)

```
Weekly Engineering Update — <Mon D>–<D>

:rocket: In Progress
• <bullet>
• <bullet>

:white_check_mark: Completed
• <bullet>
• <bullet>

:rotating_light: Blockers
• <bullet> [VERIFY if inferred]
```

- Date range like "Jun 22–28" (or "Jun 29–Jul 5" across months).
- Use the emoji shortcodes literally (`:rocket:` etc.) so the draft pastes cleanly into Slack.
- If there are follow-ups but no hard blockers, use `:warning: Open Items / Follow-ups` instead of Blockers.

## 5. Deliver

Print the draft as the final message in the terminal and stop. Do not post, schedule, or draft anything in Slack. The user copies it manually.
