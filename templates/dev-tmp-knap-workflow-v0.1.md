---
description: "Shard workflow file structure"
---

# Naming and Placement

| | Value |
|---|---|
| Dev source path | `workflows/dev-wkfl-<sh>-<name>.md` |
| Installed path | `workflows/wkfl-<sh>-<name>.md` |
| Wikilink form | dev source `[[dev-wkfl-<sh>-<name>]]` → installs `[[wkfl-<sh>-<name>]]` |
| Context line (top) | `Run \`flint shard start <sh>\` if you haven't already.` (in both modes) |
| `<name>` | snake_case noun phrase: `create_shard`, `migrate_spec`, `archive_completed` |

**One file for both modes:**

- A workflow is a multi-stage task where a person reviews or approves between stages. One file serves the interactive mode and the headless mode. The mode comes from the Orbh session: a `headless`, `subagent`, or `ping` session is headless; an interactive session, or no session, is interactive.
- A stage that differs in a headless session gets a `> [!headless]` callout **inside that stage**, after the normal text of the stage. The callout replaces the person gates of the stage: the session keys (`flint orbh session set phase …`, `progress`), `flint orbh artifact "<path>"`, a deferred request (`flint orbh request "$ORBH_SESSION_ID" "<question>"`) in a root session or the blocker in the return of a subagent, and the return (`flint orbh session return --finish "<result>"`).
- Why inside the stage: after a compaction, the hint line `read:` names only one stage, and the agent reads only that stage again. So each callout is complete for its stage, also when a callout under the title says the same rule.
- A callout under the title MAY sum up the rules for all stages. A stage with no difference has no callout. A workflow with no difference has no callout.
- Do not write a separate `hwkfl-*` file: it is deprecated. Do not write `--headless` or `hstart` in a command: the mode comes from the session. See [[dev-knw-knap-architecture]] § Modes: One Workflow for Each Mode.
- If the task has no checkpoints at all and no need for staging, author it as a **skill** instead (`[[sk-<sh>-<name>]]`).

Each stage should have a clear completion condition. Canonical transition phrase: `"Once [condition], progress to the next stage."` Subfolder groupings under `workflows/` are allowed; the filename convention does not change.

```markdown
---
description: "[One-line description of what this workflow accomplishes]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start [shorthand]` if you haven't already.
/* The same context line in both modes. In a dev source, the line is `flint shard start-dev [shorthand]`. */

# Workflow: [Workflow Name]

[Brief description of what this workflow accomplishes — one sentence]

/* Optional: a callout under the title that sums up the headless rules for all stages. Only when the workflow runs in headless Orbh sessions. It does not replace the callouts of the stages. */
> [!headless]
> [In a headless or subagent Orbh session, no person is at the terminal. Do each stage, and follow the `> [!headless]` callout in it. Name the session keys, the artifact tracking, and the return.]

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

/* A stage that differs in a headless session gets a callout here, inside the stage, after its normal text. Keep the stage heading outside the callout. Make the callout complete for this stage: after a compaction, the agent reads only this stage. */
> [!headless]
> [What a headless session does in place of the human checkpoint of this stage: for example, check the work itself, set `flint orbh session set phase <phase>`, write the summary into the result, and return with `flint orbh session return --finish "<result>"`. Do not wait for a person.]

## Stage 3: [Final Stage Name]

- [Final actions]
- [Update any state/status]
- (continue)

/* Add more stages as needed. Each stage should have:
   1. Clear actions
   2. A completion condition
   3. At least one stage with a human checkpoint
   4. A `> [!headless]` callout when the stage differs in a headless session */

# Output

- [What the workflow produces]
- [Final state of artifacts]
```

## Design Guidelines

- Name stages descriptively: "Design", "Create", "Review", "Finalize".
- The normal text of a workflow needs at least one human checkpoint between stages. In a headless session, the `> [!headless]` callouts replace the checkpoints.
- Use "Once [condition], progress to the next stage" consistently.
- The `description:` frontmatter line is **required** — `flint shard start` reads it for the dynamic manifest.
- The **action banner** (`> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.`) is **required** as the first body line, immediately after the closing frontmatter `---`. Applies in both modes. Verbatim wording — `sk-knap-validate` checks for this exact line.
- Reference skills for sub-tasks: `[[dev-sk-<sh>-<name>]]`. Reference templates for artifact creation: `[[dev-tmp-<sh>-<name>-vX.Y]]`. In dev sources use the `dev-` prefix; the installer strips it to canonical (see [[dev-knw-knap-architecture]] § Cross-Reference Links).
- State transitions (status changes) happen at stage boundaries.
- Stages can invoke skills for atomic sub-tasks.
- A workflow with an invocation file (`dev-wkfl-<sh>-<name>.invocation.json`) uses one file for both modes: `"modes": ["interactive"]` on a step only for a person, and a `next` object for each mode on a step whose hint differs. See [[dev-knw-knap-invocations]].
