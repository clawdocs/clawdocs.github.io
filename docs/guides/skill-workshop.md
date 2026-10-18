---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Skill Workshop
description: How OpenClaw agents write and maintain their own skills — learning modes, proposals, review, storage and limits in v2026.10.4
keywords: [openclaw, openclaw skill workshop, learned skills, self-learning, skill proposals, /learn]
---

# Skill Workshop

Skill Workshop is where an agent keeps the skills it writes for itself. After hard multi-step work, or when you ask it with `/learn`, the agent can save the procedure as a skill so it does not have to work it out again next time. Depending on the learning mode, those changes either land directly or wait as **proposals** for you to apply.

Skills you write by hand (workspace, project, managed, ClawHub, plugin, bundled) are not Workshop skills. Edit those at their source; see [Skill Development](/guides/skill-development).

The official reference is [Skill Workshop](https://docs.openclaw.ai/tools/skill-workshop) and [Self-learning](https://docs.openclaw.ai/tools/self-learning).

:::warning Changing in 2026.10.10 (beta)
This page describes **v2026.10.4**, the current stable release. **2026.10.10-beta.1** (npm `beta`, published 2026-10-15; not in 2026.10.4) retires the proposal flow: `propose` mode, `approvalPolicy`, `maxPending`, `propose-create`/`propose-update` and the other proposal subcommands are gone. Learned changes apply immediately, each keeps the previous version, and you revert with **Undo** (the Learned notice, or say "undo"). The CLI becomes `openclaw skills workshop list | changes | show | archive | restore`.

On upgrade, `openclaw doctor --fix` rewrites `autonomous.mode: "propose"` to **`"off"`** (not `auto`), so self-learning is silently disabled, deletes `approvalPolicy` and `maxPending`, and exports pending or quarantined drafts to `<agentDir>/workshop-skills/.archive/.retired-proposals/` without installing them. If you use `propose` today, plan to check `openclaw config get skills.workshop.autonomous.mode` after upgrading and set it to `auto` or leave it `off` deliberately. Sources: [PR #161057](https://github.com/openclaw/openclaw/pull/161057), [PR #168577](https://github.com/openclaw/openclaw/pull/168577), [v2026.10.10-beta.1 notes](https://github.com/openclaw/openclaw/releases/tag/v2026.10.10-beta.1).
:::

---

## Where Workshop Skills Live

Since 2026.9.3, Workshop skills belong to an **agent**, not to a workspace. Each agent has one writable collection:

```
~/.openclaw/agents/<agentId>/agent/workshop-skills/<skill-name>/SKILL.md
```

If you set `agents.entries.<id>.agentDir`, it is `<agentDir>/workshop-skills` instead, and `OPENCLAW_STATE_DIR` moves the whole state directory. A skill one agent learns is not visible to another agent. To share it, copy it into `~/.openclaw/skills` (the managed tier).

Workshop skills load at priority 5, below workspace, project, personal-agent and managed skills and above bundled ones. A same-named skill in a higher root wins. See [Where Skills Live](/guides/skill-development#where-skills-live).

:::tip Review what the agent learns
In the default `auto` mode, the agent edits its Workshop skills without asking. Run `openclaw skills workshop list` or open **Plugins → Workshop** now and then to see what it has saved, especially for agents that handle shell, email or money.
:::

---

## Learning Modes

`skills.workshop.autonomous.mode` decides what the agent does on its own:

| Mode | What happens |
|---|---|
| `"auto"` (default) | After a substantial finished turn, a background review can create or edit Workshop skills **directly**, using normal file tools rooted in the Workshop directory. A weekly review maintains the collection. Direct edits do not create proposals or rollback snapshots. |
| `"propose"` | The background review can stage **one pending proposal** per review. Nothing goes live until it is applied. |
| `"off"` | No background learning. You can still create skills on request or with `/learn`. |

The default is `auto`, so learning is **on** on a fresh install. On 2026.10.4, if you want every change reviewed before it goes live, switch to `propose`. This setup does not survive the next release: 2026.10.10 removes it and `doctor --fix` turns learning **off** (see the warning above).

```json5 title="~/.openclaw/openclaw.json"
{
  skills: {
    workshop: {
      autonomous: { mode: "propose" },
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Setting | Default | Effect |
|---|---|---|
| `autonomous.mode` | `"auto"` | `off`, `propose` or `auto`, as above |
| `approvalPolicy` | `"auto"` | `"auto"` lets the agent apply, reject or quarantine a proposal without asking. `"pending"` requires your approval for those actions. |
| `maxPending` | `50` | Pending plus quarantined proposals per agent |
| `maxSkillBytes` | `40000` | Maximum proposal body size in bytes (1,024 to 200,000) |

```bash
openclaw config set skills.workshop.autonomous.mode propose
openclaw config set skills.workshop.approvalPolicy pending
openclaw config set skills.workshop.autonomous.mode off
```

:::note
`approvalPolicy: "pending"` only matters for proposals. In `auto` mode the background review edits skills directly and never asks. For a reviewed setup on 2026.10.4 you need both `mode: "propose"` and `approvalPolicy: "pending"`. Both keys are removed in 2026.10.10.
:::

The background review uses the same model and provider as the conversation, so it costs tokens. Incognito turns are never reviewed. The review keeps the source session's shell approvals; the Workshop file root is not a shell sandbox.

---

## Creating Skills From Chat

Ask the agent for the skill you want. It calls the `skill_workshop` tool and returns a proposal id:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
Update trip-planning to also check seat maps before booking.
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

`/learn` captures the current conversation, or sources you name, into a matching proposal or live skill:

```text
/learn
/learn docs/runbook.md; focus on recovery
```

`/learn` never applies its result. It stays `pending` until you or the agent apply it.

In the Control UI, **Plugins → Workshop** shows the agent's installed Workshop skills and a **Suggestions** list of pending proposals you can evaluate, revise, apply or reject. **Learn from past conversations** opens a normal session that reviews older work.

---

## Proposals

A proposal is a draft stored as `PROPOSAL.md`, plus any support files. Rules worth knowing:

- **Apply is the only live write.** Create, update and revise never touch the active skill.
- **No clobber.** Creating a skill that already exists in that agent's Workshop fails. Skills from other sources are never changed.
- **Hash bound.** An update proposal records the live skill's hash and goes `stale` if the skill changes before apply.
- **Scanned on apply.** Apply reruns the local security scanner. Critical findings, including literal credentials, block it; warnings are shown but do not.
- **Recoverable.** Apply writes rollback metadata before touching live files.

```text
create/update -> pending
revise        -> pending
evaluate      -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Only a `pending` proposal can be revised, applied, rejected or quarantined.

### Proposal content

```markdown title="PROPOSAL.md"
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-10-18T00:00:00.000Z"
---

# Morning catch-up

1. ...
```

On apply, Workshop writes `SKILL.md` and drops the proposal-only fields (`status`, `version`, `date`).

### Limits

| Limit | Value |
|---|---|
| Name | Lowercase letters, digits and hyphens |
| Description | 160 bytes |
| Proposal body | `maxSkillBytes` (default 40,000 bytes) |
| Autonomous proposal `SKILL.md` | 10,000 characters |
| Support files | 64 per proposal, 256 KiB each, 2 MiB in total |
| Support file folders | `assets/`, `examples/`, `references/`, `scripts/`, `templates/` |

Support files with absolute paths, hidden segments, `..` traversal, executable bits, non-UTF-8 text or null bytes are refused.

---

## CLI

```bash
# Create a proposal for a new skill (or an update to a Workshop skill)
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Review
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop evaluate <proposal-id>

# Close out
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Every subcommand takes `--agent <id>` and `--json`. `evaluate` runs installed plugin evaluators (the `skill_proposal_evaluate` hook) against the exact current draft.

`openclaw skills curator status` reports usage of live Workshop skills and the outcome of collection reviews.

---

## The `skill_workshop` Tool

`skill_workshop` is a built-in agent tool in `tools.profile: "coding"`. With a stricter policy, add it to `tools.allow` or `tools.alsoAllow`. To stop an agent from writing Workshop skills at all, deny it:

```json5 title="~/.openclaw/openclaw.json"
{
  tools: { deny: ["skill_workshop"] },
}
```

Sandboxed runs do not get the tool. Use a normal host-side session or the CLI to review proposals. `openclaw doctor` runs a `core/doctor/skill-workshop-tool-policy` check that names the setting hiding the tool.

---

## Storage

```
~/.openclaw/
  state/openclaw.sqlite                       # proposal records, usage, rollback metadata
  agents/<agentId>/agent/workshop-skills/     # live Workshop skills
  skill-workshop/proposals/<proposal-id>/
    generations/<generation-id>/PROPOSAL.md   # each revision, with its support files
```

Do not edit these directories by hand while the Gateway runs. Upgrades from releases before 2026.9.3 move workspace-owned Workshop skills into the agent collection on startup or with `openclaw doctor --fix`. Skills that were symlinked into a workspace stay where they are, and their proposals go stale.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Skill proposal description is too large` | Shorten `description` to 160 bytes or less |
| `Skill proposal content is too large` | Shorten the body, or raise `skills.workshop.maxSkillBytes` |
| `Target skill changed after proposal creation` | Revise the proposal against the current skill, or create a new one |
| `Proposal scan failed` | Inspect the scanner findings, then revise or quarantine |
| Proposal missing from `list` | Check `--agent` and `OPENCLAW_STATE_DIR` |
| Agent cannot call `skill_workshop` | Sandboxed run, or tool policy hides it; see above |
| Agent changes skills without asking | Mode is `auto`; on 2026.10.4 switch to `propose` and set `approvalPolicy: "pending"` (removed in 2026.10.10, where you use Undo or `mode: "off"`) |

---

## See Also

- [Skill Development](/guides/skill-development): writing skills by hand
- [ClawHub](/guides/clawhub): installing and publishing community skills
- [Security hardening](/security/hardening): tool policy, sandboxing, approvals
- Upstream: [Skill Workshop](https://docs.openclaw.ai/tools/skill-workshop), [Self-learning](https://docs.openclaw.ai/tools/self-learning), [`openclaw skills workshop`](https://docs.openclaw.ai/cli/skills)
