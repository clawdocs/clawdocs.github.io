---
sidebar_position: 10
title: Skill Workshop
description: Create and review skills through a governed proposal queue — with security scanning, versioning, and rollback
---

# Skill Workshop

Skill Workshop is OpenClaw's governed path for creating and updating workspace skills. Instead of agents writing directly to `SKILL.md` files, they propose skills through a review queue that requires human approval before activation.

Introduced in **v2026.6.1**, Skill Workshop adds audit trails, security scanning, hash binding, and rollback to the skill creation process.

:::info
Skill Workshop manages **workspace skills only**. It does not modify bundled skills, plugin skills, ClawHub-installed skills, or system skills.
:::

---

## Why Skill Workshop?

| | Before v2026.6.1 | With Skill Workshop |
|---|---|---|
| **Creation** | Agents write directly to `SKILL.md` | Agents propose via `skill_workshop` tool |
| **Review** | None — skills go live immediately | Mandatory review queue |
| **Audit trail** | Filesystem history only | Explicit versioning + metadata |
| **Safety** | Bad skills become permanent | Review gate blocks bad patterns |
| **Support files** | Manual management | Scanned, hashed, versioned with proposal |
| **Rollback** | Manual intervention | Metadata-backed recovery |
| **Governance** | None | Tracked approvals, rejections, quarantines |

---

## Quick Start

```bash
# 1. Create a proposal
openclaw skills workshop propose-create \
  --name "daily-standup" \
  --description "Run a daily standup: what I did, what I'll do, blockers" \
  --proposal ./PROPOSAL.md

# 2. Review it
openclaw skills workshop inspect daily-standup-001

# 3. Apply it (activates the skill)
openclaw skills workshop apply daily-standup-001
```

That's the core loop: **propose → review → apply**.

---

## Proposal Lifecycle

Every proposal moves through a defined set of states:

```
             ┌─→ applied (live skill)
             │
pending ─────┼─→ rejected
             │
             ├─→ quarantined (held for deeper review)
             │
             └─→ stale (live skill changed after proposal was created)
```

| State | Description | Terminal? |
|-------|-------------|-----------|
| **Pending** | Created or revised, ready for review | No — can revise, apply, reject, or quarantine |
| **Applied** | Approved and written to live skill files | Yes |
| **Rejected** | Declined by operator, with optional reason | Yes |
| **Quarantined** | Flagged for deeper review (security concerns, etc.) | Yes |
| **Stale** | Live skill was modified after the proposal was created — hash no longer matches | Yes |

Only **pending** proposals can be revised. Terminal states require creating a new proposal.

---

## CLI Commands

### Create a Proposal

```bash
openclaw skills workshop propose-create \
  --name "audit-log-parser" \
  --description "Parse and analyze audit logs for security events" \
  --proposal ./PROPOSAL.md
```

Creates a new skill proposal. Fails immediately if a skill with that name already exists (no-clobber protection).

### Update an Existing Skill

```bash
openclaw skills workshop propose-update <skill-name> \
  --proposal ./PROPOSAL.md
```

Creates a proposal to update a live skill. The proposal binds to the skill's current hash — if the skill changes before you apply, the proposal goes stale.

### Add Support Files

Proposals can include templates, scripts, examples, and references:

```bash
openclaw skills workshop propose-create \
  --name "config-validator" \
  --proposal ./my-proposal/PROPOSAL.md \
  --proposal-dir ./my-proposal
```

Expected directory structure:

```
my-proposal/
├── PROPOSAL.md          # Required: the skill content
├── assets/              # Media files, icons
├── examples/            # Usage examples, sample outputs
├── references/          # Documentation, links
├── scripts/             # Helper scripts
└── templates/           # Reusable templates
```

**Constraints:** max 64 files, 256 KB each, 2 MB total. No executables, no absolute paths, no path traversal, no null bytes.

### Revise a Pending Proposal

```bash
openclaw skills workshop revise <proposal-id> \
  --proposal ./PROPOSAL-v2.md
```

Revises in place — auto-increments the version number and preserves history.

### List Proposals

```bash
openclaw skills workshop list
openclaw skills workshop list_quarantine
```

### Inspect a Proposal

```bash
openclaw skills workshop inspect <proposal-id>
```

Shows the full proposal content, revision history, scanner verdicts, and metadata.

### Review Actions

```bash
# Approve and activate
openclaw skills workshop apply <proposal-id>

# Decline
openclaw skills workshop reject <proposal-id> \
  --reason "Duplicate functionality — use the existing deploy skill"

# Flag for deeper review
openclaw skills workshop quarantine <proposal-id> \
  --reason "Suspicious external API calls; needs manual security review"
```

---

## Scanner Gating

When you apply a proposal, OpenClaw reruns security scanning before writing the live skill. Three independent scanners check the skill:

| Scanner | What It Does |
|---------|-------------|
| **OpenClaw static analysis** | Built-in pattern matching for known bad patterns |
| **VirusTotal** | Threat detection against the VirusTotal database |
| **NVIDIA SkillSpector** | AI-assisted semantic analysis for hidden instructions and risky code paths |

### ClawScan Verdicts

The combined scan produces one of three verdicts:

| Verdict | Meaning | Action |
|---------|---------|--------|
| **Clean** | Passed all checks | Safe to apply |
| **Suspicious** | Unclear disclosure, overbroad authority, risky defaults, or high blast radius | Review carefully before applying |
| **Malicious** | Confirmed threat | Automatically quarantined |

If the scanner finds critical issues during `apply`, the proposal is automatically moved to **quarantined** instead of being activated.

---

## Hash Binding

Update proposals bind to the target skill's current content hash. This prevents conflicts:

- If the live skill changes while a proposal is pending, the proposal becomes **stale**
- Stale proposals cannot be revised or applied
- The agent must create a fresh proposal against the new skill state

This guarantees you never accidentally overwrite changes made between proposal creation and review.

---

## Rollback

When a proposal is applied, rollback metadata is written **before** the live skill files are modified. If something goes wrong after apply:

1. The rollback record contains the previous skill content and hash
2. Recovery can restore the pre-apply state
3. All version history is preserved for audit

---

## The `skill_workshop` Agent Tool

Agents interact with Skill Workshop through a dedicated tool — they cannot modify proposals via direct filesystem operations.

```json5
{
  "tool": "skill_workshop",
  "action": "create",       // create, update, revise, list, inspect
  "name": "skill-name",
  "description": "Concise description (max 160 bytes)",
  "content": "Full skill content",
  "supportFiles": { }       // Optional
}
```

By default, agent-initiated `apply`, `reject`, and `quarantine` actions show an approval prompt. Configure this with `approvalPolicy`.

---

## Control UI

The dashboard provides two views for reviewing proposals:

### Board View

The full workshop interface:
- Searchable proposal list filtered by state (pending, applied, rejected, stale, quarantined)
- Inspectable support file previews
- Revision diffs showing what changed across versions
- Scanner verdict display

### Today View

A fast-pass for one-at-a-time decisions:
- Shows the next pending proposal
- Presents a focused question: "Should this become part of your skill set?"
- Accept, reject, or quarantine with one click
- Moves to the next proposal automatically

Both views support session routing — start a review, hand it off, pick it up later.

---

## Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "skills": {
    "workshop": {
      "approvalPolicy": "pending",    // "pending" (prompt) or "auto" (skip prompt)
      "maxPending": 50,               // Max pending + quarantined proposals
      "maxSkillBytes": 40000,         // Proposal body size limit (bytes)
      "autonomous": {
        "enabled": false              // Auto-create proposals from conversations
      }
    }
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `approvalPolicy` | `"pending"` | `"pending"` requires operator approval for agent-initiated apply/reject/quarantine. `"auto"` skips the prompt. |
| `maxPending` | `50` | Maximum number of pending + quarantined proposals per workspace. Prevents queue overflow. |
| `maxSkillBytes` | `40000` | Maximum size of the proposal body in bytes. |
| `autonomous.enabled` | `false` | When `true`, agents can auto-create proposals from successful conversation turns. Experimental — leave off for most setups. |

:::warning
Set `approvalPolicy: "pending"` in production. The `"auto"` setting should only be used in CI environments, isolated sandboxes, or fully trusted deployments.
:::

---

## Storage

Proposals live in `~/.openclaw/skill-workshop/`:

```
skill-workshop/
├── proposals.json                 # Fast listing index
└── proposals/
    └── <proposal-id>/
        ├── proposal.json          # Canonical proposal record
        ├── PROPOSAL.md            # Pending skill content
        ├── rollback.json          # Recovery metadata (written on apply)
        ├── assets/
        ├── examples/
        ├── references/
        ├── scripts/
        └── templates/
```

---

## Practical Examples

### Agent-Driven Skill Creation

Ask your bot to create a skill through chat:

```
Create a skill called "pr-review" that reviews GitHub pull requests.
It should check for: code style, security issues, test coverage,
and documentation. Output a structured review with severity levels.
```

The agent calls `skill_workshop` with `action: create` → you see it in the proposal queue → review and apply from the dashboard or CLI.

### Iterative Refinement

```bash
# Agent creates initial proposal
# You inspect it
openclaw skills workshop inspect pr-review-001

# Not quite right — ask the agent to revise
# "Revise the pr-review skill to also check for breaking API changes"

# Agent calls skill_workshop with action: revise
# Version auto-increments, full history preserved

# Happy with v3 — apply it
openclaw skills workshop apply pr-review-001
```

### Bulk Review with Today View

If your agents have been busy creating proposals:

1. Open the dashboard → **Skill Workshop** → **Today View**
2. Review each proposal one by one
3. Apply the good ones, reject duplicates, quarantine anything suspicious
4. Each decision takes seconds

### Security Audit of Existing Skills

```bash
# Verify a skill against ClawHub's security database
openclaw skills verify deploy-helper --card

# Review all quarantined proposals
openclaw skills workshop list_quarantine
```

---

## Best Practices

**For production setups:**
- Keep `approvalPolicy: "pending"` — always review before activating
- Leave `autonomous.enabled: false` unless you specifically need auto-proposals
- Review scanner verdicts before applying — don't ignore "Suspicious" findings
- Check support files for sensitive data or executables
- Keep skill descriptions clear and under 160 bytes
- Don't delete quarantined proposals without logging why

**For skill authors:**
- Write clear, single-purpose skills — one skill, one job
- Include examples in the `examples/` directory
- Test your skill as a proposal before applying to production
- Use the revision workflow instead of creating new proposals for the same skill

---

## See Also

- [Skill Development](/guides/skill-development) — Writing skills from scratch
- [ClawHub](/guides/clawhub) — Browsing and installing community skills
- [Skill Verification](/security/skill-verification) — Security review before installation
- [Security Overview](/security/overview) — The broader threat model
- [Workboard](/guides/workboard) — Orchestrating agent work with the Kanban board
