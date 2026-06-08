---
description: "Shard workflow file structure"
---

# Naming and Placement

| | Interactive | Headless |
|---|---|---|
| Dev source path | `workflows/dev-wkfl-<sh>-<name>.md` | `workflows/dev-hwkfl-<sh>-<name>.md` |
| Installed path | `workflows/wkfl-<sh>-<name>.md` | `workflows/hwkfl-<sh>-<name>.md` |
| Wikilink form | dev source `[[dev-wkfl-<sh>-<name>]]` → installs `[[wkfl-<sh>-<name>]]` | dev source `[[dev-hwkfl-<sh>-<name>]]` → installs `[[hwkfl-<sh>-<name>]]` |
| Context line (top) | `Run \`flint shard start <sh>\` if you haven't already.` | `Run \`flint shard hstart <sh>\` if you haven't already.` |
| `<name>` | snake_case noun phrase: `create_shard`, `migrate_spec`, `archive_completed` | same |

**When to author each variant:**

- **`wkfl-*` (interactive)** — multi-stage tasks where a human reviews or approves between stages. The default choice when authoring a workflow.
- **`hwkfl-*` (headless)** — same task running under Orbh / autonomous mode. No human checkpoints; progress reported via Orbh session keys. Author this when the workflow needs to run without a person in the loop.
- A workflow MAY ship both variants. When both exist, `flint shard start` shows only `wkfl-*`; `flint shard hstart` shows only `hwkfl-*`.
- If the task has no checkpoints at all and no need for staging, author it as a **skill** instead (`[[sk-<sh>-<name>]]`).

Each stage should have a clear completion condition. Canonical transition phrase: `"Once [condition], progress to the next stage."` Subfolder groupings under `workflows/` are allowed; the filename convention does not change.

```markdown
---
description: "[One-line description of what this workflow accomplishes]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start [shorthand]` if you haven't already.
/* For headless variants (hwkfl-*), use `flint shard hstart [shorthand]` instead. */

# Workflow: [Workflow Name]

[Brief description of what this workflow accomplishes — one sentence]

# Input

- [Required input 1]
- [Required input 2]
- (Optional) [Optional input]
- (continue)

# Actions

## Stage 1: [Stage Name]

- [Action or instruction]
- [Action or instruction]
- Once [completion condition], progress to the next stage

## Stage 2: [Stage Name]

- [Action or instruction]
- [Human checkpoint: describe what the user reviews or approves]
- Once you receive confirmation from the user, progress to the next stage

## Stage 3: [Final Stage Name]

- [Final actions]
- [Update any state/status]
- (continue)

/* Add more stages as needed. Each stage should have:
   1. Clear actions
   2. A completion condition
   3. At least one stage with a human checkpoint */

# Output

- [What the workflow produces]
- [Final state of artifacts]
```

## Design Guidelines

- Name stages descriptively: "Design", "Create", "Review", "Finalize".
- Interactive variants (`wkfl-*`) need at least one human checkpoint between stages. Headless variants (`hwkfl-*`) have none.
- Use "Once [condition], progress to the next stage" consistently.
- The `description:` frontmatter line is **required** — `flint shard start` reads it for the dynamic manifest.
- The **action banner** (`> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.`) is **required** as the first body line, immediately after the closing frontmatter `---`. Applies to both `wkfl-*` and `hwkfl-*`. Verbatim wording — `sk-knap-validate` checks for this exact line.
- Reference skills for sub-tasks: `[[dev-sk-<sh>-<name>]]`. Reference templates for artifact creation: `[[dev-tmp-<sh>-<name>-vX.Y]]`. In dev sources use the `dev-` prefix; the installer strips it to canonical (see [[dev-knw-knap-architecture]] § Cross-Reference Links).
- State transitions (status changes) happen at stage boundaries.
- Stages can invoke skills for atomic sub-tasks.
