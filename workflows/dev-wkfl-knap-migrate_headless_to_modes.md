---
description: "Merge the headless files of one shard source (hwkfl-, hinit-) into its normal files: > [!headless] callouts in each stage, one invocation file with modes and next objects, and a # Headless section of the init; then check, commit, bump the version, and list the references in other shards"
orbh-sessions:
  - "[[ec13c5bf-9eab-4982-b35a-cffc13d48950]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start knap` if you haven't already.

# Workflow: Migrate Headless Files to Modes

One workflow file serves both modes (NUU Orbh Task 748). The headless workflow (`dev-hwkfl-<sh>-<name>.md`), its invocation file, the headless init (`dev-hinit-<sh>.md`), and `flint shard hstart` are deprecated. This workflow merges the headless files of **one shard source** into its normal files, with no loss of an instruction:

- each `dev-hwkfl-` workflow goes into its `dev-wkfl-` workflow as `> [!headless]` callouts, inside the stages;
- the two invocation files become one file of format `shard-invocation/0.3`, with `modes` and `next` objects;
- `dev-hinit-<sh>.md` becomes the section `# Headless` of `dev-init-<sh>.md`.

Read these sections first: [[dev-knw-knap-architecture]] § Modes: One Workflow for Each Mode, and [[dev-knw-knap-invocations]] § Modes and § Tokens and Quoting. The models are the merges of Projects (commit `c09d60c` of its source) and Reports (commit `deddc47`): read `git show c09d60c` and `git show deddc47` in those sources when a case is not clear.

> [!headless]
> In a headless or subagent Orbh session, no person reviews the plan or the diff. Do each stage, and follow the `> [!headless]` callout in it.
> - Set `flint orbh session set phase <stage>` at each stage, and `flint orbh session set progress "<done>/<total> files"`.
> - Do not stop for a choice that this workflow gives. For a choice that it does not give, take the narrowest reading, and write it in the result.
> - End the turn with `flint orbh session return --finish "<result>"`. A subagent returns the blocker and the question to its dispatcher when it cannot go on.

# Invocation

You can run this workflow as a shard invocation. The invocation is a durable record of the migration: its steps and the commit. The stages below do not change.

- Start the workflow with `flint shard invoke knap migrate_headless_to_modes --input source="<alias, shorthand, or folder of the source>"`.
- The mode comes from the Orbh session. A headless or subagent session runs in the headless mode and follows the `> [!headless]` callouts. In the headless mode, the invocation skips the step `review` at the open: no person reviews the diff.
- Mark each step when it is done: `flint shard step done <step> --evidence "<…>"`. The steps are `inventory`, `workflows`, `invocation_files`, `init`, `alone`, `links`, `check`, `review`, `commit`, and `references`. A step that has no work in this source (for example `init` for a source with no `dev-hinit-` file) is skipped with a reason: `flint shard step skip <step> --reason "<why>"`.
- After the commit, set the output: `flint shard invocations set-output <id> commit="<sha>"`.
- At the end, close the invocation: `flint shard invocations close <id> --outcome done`.
- When a conflict stops the migration ([Rules](#rules): a conflict stops the whole migration), close the invocation with `flint shard invocations close <id> --outcome abandoned --reason "<the conflict>"`, and give the blocker.
- Outside an Orbh session (no `ORBH_SESSION_ID`), give `--invocation <id>` to `flint shard step`. The hint after each write prints the id.
- When no invocation is open, follow the stages with no record.

# Input

- The shard source: its alias, its shorthand, or its folder (`Shards/(Source Remote) <Name>/` or `Shards/(Source Local) <Name>/`)
- (Optional) The commit subject that the caller wants, for example `[OR] wip: <Flint Name>/(Task) NNN Title`

# Rules

- **One source.** Change only the files of this source. Do not edit another shard: Stage 10 lists its references for the person.
- **Nothing lost.** Each instruction of a headless file goes into the normal text, into a callout, or into the `# Headless` section.
- **Rewrite the old reference, keep the line.** A line that names `hwkfl-`, `hinit-`, `hstart`, `hstart-dev`, or `--headless` can also hold a rule, for example "Do not run [[dev-hwkfl-orba-wake]], do not load the agent mind, and never write to it". Replace only the old reference with the new one (`wkfl-`, `init-<sh>#Headless`, `start`, `start-dev`, or no flag). Keep each other instruction of the line. Drop only text that selects a headless file and has no other meaning (for example "Use these instead of the interactive counterparts", or the column `Replaces` of a table). Write each dropped text in the commit body.
- **The machine contract stays.** The merged invocation file must keep the contract of each mode: the steps, `calls`, `repeat`, `evidence`, the outputs and `required`, `enforced`, and the behaviours (Stage 3). When format 0.3 cannot keep both contracts, it is a conflict. A note in the commit body never replaces a guard.
- **A conflict stops the whole migration.** A conflict that is not resolved stops the migration of the whole source: a merge that format 0.3 cannot hold (Stage 3), an artifact input that a stage creates and that no option of Stage 1 can bind, or a difference that the guard shows. There is no partial migration. Then:
  1. Put back each path of the ledger as it is at BASE, but only a path whose content the guard shows as yours. Never restore or overwrite a path that another session changed. A path that was present at BASE: `git restore --source <BASE> --staged --worktree -- "<path>"`. A path that was `absent` at BASE: `git rm -q -f --ignore-unmatch -- "<path>"`.
  2. Do not delete the headless init, do not replace links, do not bump the version, and do not commit.
  3. Give the blocker: the conflict, the files, and the decision that the person must make (for example, "The headless step `report-headless` needs the output `report`, and the interactive step does not. Keep it required in both modes, or make it optional?"). In an interactive session, give it to the person and stop. In a headless session, return it as the blocker of the result.
- **The meaning stays.** Do not add `ready`, `make-ready`, `assumes`, `then`, or `done-when` in this migration: they change what the workflow does. Write each one that the workflow could use as a proposal in the result. The one change of a binding that this workflow makes is the creation input of Stage 1, step 7.
- **Current command forms.** Write the Orbh commands as the Orbh shard gives them now: `flint orbh session set <key> <value>` (no id), `flint orbh session return --finish "<result>"`, `flint orbh artifact "<path>"`, `flint orbh request "$ORBH_SESSION_ID" "<question>"`. Check a form with `--help` when you are not sure.
- **Shared workspace.** Other sessions can work in the same repository. Do not revert, stash, or commit their changes. Commit only your own paths.
- **The guard of your paths.** At the inventory, record the base commit and the content hash of each path that you plan to change, create, rename, or delete (the **ledger**). Before each write to a path, and before the commit, run the guard. After each of your own writes, put the new hash in the ledger. Run the commands in the source folder:

  ```bash
  git rev-parse HEAD                                    # BASE: write it in the plan
  # Record (at the inventory, and after each of your own writes; "absent" for a path that does not exist):
  for p in "<path>" …; do printf '%s %s\n' "$(git hash-object -- "$p" 2>/dev/null || echo absent)" "$p"; done > "<scratch>/ledger"
  # The guard (before each write, and before the commit):
  while read -r hash path; do now=$(git hash-object -- "$path" 2>/dev/null || echo absent); [ "$now" = "$hash" ] || echo "CHANGED $path"; done < "<scratch>/ledger"
  git diff --name-only <BASE> HEAD -- "<path>" …        # must print nothing: no commit since BASE touched your paths
  git diff --cached --name-only -- "<path>" …           # must list only the paths that you staged
  ```

  `<scratch>` is the scratch folder of your session, or a temporary folder. When the guard shows a difference: stop. Do not write, do not commit, and do not repair or overwrite the change of the other session. Report the conflict: the path, the hash in the ledger, the hash now, and `git log --oneline <BASE>..HEAD -- "<path>"`.

# Actions

## Stage 1: Inventory

1. Load the source: `flint shard start-dev <alias>`. Read `shard.yaml` (the `version` and the `shorthand`) and `dev-init-<sh>.md`.
2. Run the check: `flint shard knap check-modes "<source folder>"`. It lists:
   - each headless file, with its partner `dev-wkfl-` file or `no partner`;
   - each line that names `hwkfl-`, `hinit-`, `hstart`, `hstart-dev`, or `--headless`;
   - each problem of the invocation files.
3. Run `git status --short` in the source. When a file that you must change has changes of another session, stop: tell the person (or put it in the result), and do not edit that file.
4. Write the plan: for each headless file, the stage of this workflow that handles it (Stage 2, 3, 4, or 5), and for each pair, the stages of the two Markdown files side by side. List each path that you will change, create, rename, or delete: the files of each pair, the invocation files, the init, `README.md`, and `shard.yaml`.
5. Record the base commit and the ledger of these paths ([Rules](#rules): the guard of your paths).
6. For each workflow with two invocation files, compare their machine fields now (Stage 3, step 3).
7. **Find each creation input.** Look in each invocation file of the source (of both modes) for an artifact input whose artifact the workflow itself creates: a stage creates the file (for example "Create the task"), or a caller gives the value at the invoke before the file exists. Find the callers: `grep -rn "invoke <sh> <name>"` in this source, in the other sources and the Mesh of the Flints of this machine, and in the cron and station prompts. In format 0.3, `invoke` refuses such a value with `input-not-found` before the stage that creates the file. Choose one option for each such input, in this order:
   1. **Bind it as `create_and_do_task` does** (preferred). The input is not `required`, and no caller gives it at the invoke. The creation stage sets it after the file exists: `flint shard invocations set-input <id> <input>='<title>'`. Or the workflow declares an output for the new artifact. Update each caller in this source (the `# Invocation` section, the `next` texts, and each workflow that invokes it). List each caller in another shard for the person (Stage 10).
   2. **Keep the old format.** When a caller cannot change safely (for example, a caller in another shard, a script, or a cron or station prompt that gives the value at the invoke), keep the invocation file at its format (0.1 or 0.2): it has no readiness check. Then the differences of the modes go only into the Markdown callouts, because `modes`, `next` objects, and `session.mode` need format 0.3. This works only when the two invocation files differ only in their `next` texts: keep the `next` of the base, and say in the callout of each stage what the headless mode does. When they differ in another machine field, this option cannot keep both contracts.
   3. **Else it is a conflict.** It stops the whole migration ([Rules](#rules)).
8. When Stage 1 finds a conflict that is not resolved, the migration stops here, before any write. Give the blocker ([Rules](#rules)).
9. Give the inventory, the plan, the option of each creation input, and each conflict to the person.

> [!headless]
> Do not wait for a person. Keep the inventory, the plan, and the option of each creation input for the result. A conflict stops the migration: close the invocation `abandoned`, and return the blocker with `flint orbh session return --finish "<the blocker>"`. Set `flint orbh session set phase inventory` and `flint orbh session set progress "0/<N> files"`, where `<N>` is the count of headless files.

## Stage 2: Merge the Workflows

Do this for each `dev-hwkfl-<sh>-<name>.md` that has a partner `dev-wkfl-<sh>-<name>.md`. Run the guard before each write, and update the ledger after it.

1. Read both files fully. `diff "workflows/dev-wkfl-<sh>-<name>.md" "workflows/dev-hwkfl-<sh>-<name>.md"` shows the lines that differ.
2. The `dev-wkfl-` file is the base. Keep each stage heading as it is: the `stage` of the invocation file names it.
3. Match the stages by meaning, not by the heading. A headless file often has other headings (`## 1. Setup` and `## 2. Execute` for `## Stage 1: Task Work`).
4. For each stage, find each instruction of the headless file that the stage does not have, or does in another way. Put them in one `> [!headless]` callout at the end of the stage. The usual content:
   - the session keys (`flint orbh session set phase …`, `progress`) and the phase values of the init;
   - `flint orbh artifact "<path>"` for each artifact that the stage creates or changes;
   - the gate of the person and what replaces it: "Do not wait for a person";
   - the blocker: a deferred request for a root (`flint orbh request "$ORBH_SESSION_ID" "<question>"`), the blocker in the return for a subagent;
   - the return (`flint orbh session return --finish "<result>"`) in the stage that ends the turn;
   - a rule of a person gate, for example "Never pass `--with task-confirm`".
5. Make each callout complete for its stage. After a compaction, the hint line `read:` names one stage, and the agent reads only that stage again. A rule that the agent needs at a stage goes into the callout of that stage, also when another callout says it.
6. A stage of the `dev-wkfl-` file that a headless session must not do (the confirm of a person, the close of a task) gets a callout: `A headless session does not do this stage.` and the reason. Stage 3 gives its step `"modes": ["interactive"]`.
7. A stage of the headless file with no partner stage: put its instructions in a callout of the stage where they fit (setup goes into the first stage). Add a new stage only when the invocation file needs a step for it (Stage 3 gives that step `"modes": ["headless"]`).
8. Merge the other sections in the same way: a callout at the end of `# Input` and `# Output` for each difference. When the rules of all stages are the same (no person, the session keys, the return), you can also add one callout under the title. It does not replace the callouts of the stages.
9. In `# Invocation`, add the mode line: "The mode comes from the Orbh session. A headless or subagent session runs in the headless mode and follows the `> [!headless]` callouts." In each line that names the headless file, `hstart`, or `--headless`, rewrite only the old reference, and keep each other instruction of the line. Put the headless rules of the invocation (the defer, a refused script) in a callout at the end of `# Invocation`.
10. Remove `--headless` from each command. A headless child runs in the headless mode with the same command.
11. Check that nothing is lost: read the headless file from the top. Each line is in the base text, in a callout, in the `# Headless` section of the init (Stage 4), or on your list of dropped text. Only selection text with no other meaning can be on that list.
12. Run the guard, then delete the headless file: `git rm "workflows/dev-hwkfl-<sh>-<name>.md"`. Put `absent` in the ledger.

Example: the headless file says "Set `review`, write the summary into the result, and return. Never pass `--with task-confirm`." The interactive stage says "Give the person a summary, and refine until the person confirms." The merged stage:

```markdown
## Stage 3: Task Review

- Set status to `review`
- Give the person a summary, and refine until the person confirms

> [!headless]
> Do not wait for a person. Set `review`, write the summary into the result, and return
> with `flint orbh session return --finish "<result>"`. Never pass `--with task-confirm`.
```

> [!headless]
> Set `flint orbh session set phase workflows`. Update `progress` after each file.

## Stage 3: Merge the Invocation Files

Do this for each workflow that has a headless invocation file (`dev-hwkfl-<sh>-<name>.invocation.json`). This stage owns the name of each invocation file. Stage 5 renames only the Markdown. Run the guard before each write.

1. **The base.**
   - **Two files** (a `dev-wkfl-` and a `dev-hwkfl-` invocation file): the `dev-wkfl-` file is the base. Merge the headless file into it (steps 2 to 9). Then delete the headless file (step 10).
   - **One file** (only the `dev-hwkfl-` invocation file): `git mv` it to `dev-wkfl-<sh>-<name>.invocation.json`, and set `workflow` to `wkfl-<sh>-<name>`. It is the base, and nothing is deleted. When the Markdown has an interactive partner, the interactive mode gets this file for the first time: add the interactive side with steps 3 to 9. When the Markdown has no partner (Stage 5), keep each other field as it is, and keep the format.
2. **The format.** Set `"format": "shard-invocation/0.3"` when the merged file uses a 0.3 field (`modes`, a `next` object, or `session.mode`). Else keep the format of the base. Keep the old format for a creation input of option 2 of Stage 1, step 7. Format 0.3 also turns on the checks of each artifact input at the open: the file must exist, and its type must match. Each creation input must have its option from Stage 1, step 7. A creation input that you find only now is a conflict.
3. **Compare the machine fields.** Make a table of each field that differs between the two modes:
   - for each pair of steps of the same stage of the merged Markdown: `next`, `calls`, `repeat`, `evidence`, `title`, and `by`;
   - each step that only one file has;
   - for the file: each input and each output (`kind`, `type`, `required`), `enforced`, and each behaviour.

   Steps 4 to 7 give a rule for each row. A row with no rule is a conflict (step 8).
4. **The steps.**
   - Only `next` differs (or also `title` or `by`): keep one step. Make `next` an object: `{ "interactive": "<the text of the base>", "headless": "<the headless text>" }`. Remove `--headless` from the headless text. Keep the `title` and `by` of the base.
   - `calls`, `repeat`, or `evidence` differs: split the step into two steps, one for each mode. The step of the base keeps its id and its fields, and gets `"modes": ["interactive"]`. The headless step gets a distinct id (for example `<id>-headless`), the fields of the headless file, and `"modes": ["headless"]`. Each step has its `stage`. Put the two steps next to each other. In each mode, the invoke skips the step of the other mode at the open.
   - A step that only the base has, and that a headless session must not do: `"modes": ["interactive"]`.
   - A step that only the headless file has: `"modes": ["headless"]`, at its place in the order. Its `stage` names a heading of the merged Markdown.
5. **The inputs and outputs.** In format 0.3, `required` applies to both modes.
   - The same in both files: keep it.
   - Only one file declares it, or `required` differs: keep `"required": true` only when a run of the other mode also sets the output (or always gives the input). Else set `"required": false`. Then say in the stage that sets it, for its mode (in the callout for the headless mode): "Set the output `<name>`: this mode needs it." For an input, say it in its `description` too.
   - `kind` or `type` differs: a conflict (step 8).
6. **`enforced`.** It is one value for both modes. When only one file has `"enforced": true`, keep `true` only when a run of the other mode can also settle each step before `return --finish` (a step that the mode skips counts as settled). Else it is a conflict (step 8). Do not drop the guard.
7. **The behaviours.**
   - A behaviour that both files declare with the same content stays shared: no `session.mode` key.
   - A behaviour that only one file declares runs only in that mode. Add `"session.mode": ["interactive"]` (a behaviour of the base only) or `"session.mode": ["headless"]` (a behaviour of the headless file only) to its `when`. Without the key, a behaviour of the base starts to run in the headless mode. The key reads the mode that the invocation recorded.
   - The same `id` with other content: one behaviour for each mode. The behaviour of the base keeps the id and gets `"session.mode": ["interactive"]`. The headless one gets a new id (for example `<id>-headless`) and `"session.mode": ["headless"]`.
   - A behaviour on `step.done:<step>` of a step that step 4 split goes on the step of its mode.
   - **The id map.** Write each id that changed: the old id of a step or a behaviour of the headless file, and its new id. Then update each place that names an old id: the Markdown (`# Invocation`, the stages, the callouts), the `next` texts, each `--with <id>` command, each `flint shard step done|skip <id>` command, and each `step.done:<old step>` place. Put the id map in the commit body.
8. **A conflict.** When format 0.3 cannot keep the contract of both modes (`kind` or `type` differs, an `enforced` that the other mode cannot meet, or another row with no rule), the migration of the whole source stops ([Rules](#rules): a conflict stops the whole migration). Stage 1 finds most conflicts before any write. When you find one now, put back each path of the ledger that the guard shows as yours, as it is at BASE. Do not go on to Stage 4: do not delete the headless init, replace links, bump the version, or commit. Give the blocker: the workflow, the field, the value of each mode, why format 0.3 cannot hold both, and the decision that the person must make.
9. **The quoting rules.** Each text of a `next` object follows the rules of [[dev-knw-knap-invocations]] § Tokens and Quoting: each token outside quotes, no `$(`, `${`, or backquote in a text with a token.
10. **Delete only in a two-file merge.** Run the guard, then `git rm "workflows/dev-hwkfl-<sh>-<name>.invocation.json"`. Put `absent` in the ledger. In a one-file case, the `git mv` of step 1 already removed the old name.

> [!headless]
> Set `flint orbh session set phase invocation-files`.

## Stage 4: Merge the Init

Do this when the source has `dev-hinit-<sh>.md`, and only when no conflict is open: a conflict stops the migration before this stage. Ten sources have only this file.

1. Read `dev-hinit-<sh>.md` and `dev-init-<sh>.md` fully.
2. Add a section `# Headless` to `dev-init-<sh>.md`, after the sections on the workflows (before `# Dashboards` when the init has one). Start it with: "A headless or subagent Orbh session has no person at the terminal. It loads this init with `flint shard start <sh>`, as an interactive session does. Follow the `> [!headless]` callouts of the workflows."
3. Move the content of the headless init into the section:
   - `## Orbh Interface Keys`: the table of keys, `### Phase Values`, and `### Progress Format` (and the example of the session interface);
   - `## Result Delivery`: `flint orbh session return --finish "<result>"`, and what the result holds;
   - `## Interaction Model` (optional): the table Interactive | Headless;
   - `## Artifact Tracking` (optional): `flint orbh artifact "<path>"`;
   - each other rule of the shard for a headless session.
4. Rewrite each line that names `hwkfl-`, `hinit-`, `hstart`, or `--headless`: replace the old reference with the new one, and keep each other instruction of the line. For example, "Do not run [[dev-hwkfl-orba-wake]], do not load the agent mind, and never write to it" becomes "Do not run [[dev-wkfl-orba-wake]], do not load the agent mind, and never write to it". Drop only selection text with no other meaning: the sentence that the file replaces the init, and the column `Replaces` of the table of headless workflows. The table of headless workflows can hold rules (when to use a workflow, which session runs it, what it must never do, who closes a unit): keep each such rule, in the `# Headless` section or in the workflow table of the init. A rule that the init already has (the WIP commits, the lifecycle) stays one time, in its old place.
5. When the headless init has `required-reading` in its frontmatter, add each file that the init does not list.
6. In the workflow table of the init, remove the rows of the headless workflows. A merged workflow has one row.
7. Check that nothing is lost: read the headless init from the top. Each line is in the init, or it is selection text on your list. Then run the guard, and delete the headless init: `git rm dev-hinit-<sh>.md`. Put `absent` in the ledger.

> [!headless]
> Set `flint orbh session set phase init`.

## Stage 5: A Headless Workflow with No Partner

Do this for each `dev-hwkfl-<sh>-<name>.md` that has no `dev-wkfl-<sh>-<name>.md` (for example a worker loop of an Orb agent, or a step of a stream).

1. Run the guard, then rename the Markdown: `git mv "workflows/dev-hwkfl-<sh>-<name>.md" "workflows/dev-wkfl-<sh>-<name>.md"`. Update the ledger.
2. Check the invocation file: Stage 3 renamed it. When the workflow has one, `workflows/dev-wkfl-<sh>-<name>.invocation.json` exists, its `workflow` is `wkfl-<sh>-<name>`, and no `dev-hwkfl-<sh>-<name>.invocation.json` stays. Do not rename it again.
3. **Keep it as a normal workflow.** Keep its stages as normal text and normal headings. Do not put the whole text under `> [!headless]` callouts.
4. Change the title (`# Headless Workflow: X` to `# Workflow: X`), and add one line under it: "This workflow runs in a headless Orbh session." When an interactive session can run it too, say how in the same line (for example, "In an interactive session, give the result to the person in place of the return"). Such a workflow has no human checkpoint: it is the exception of the rule of [[dev-tmp-knap-workflow-v0.1]].
5. Change the context line from `hstart` or `hstart-dev` to `start` or `start-dev`. In each other line that names a headless file, rewrite only the old reference ([Rules](#rules)).

Why a normal workflow, and not one callout for the whole text:

- A callout marks a difference between two modes. A workflow for one mode has no difference.
- A heading inside a callout (`> ## Stage 1`) is not a heading. The `stage` of the invocation file and the hint line `read:` need a real heading, so the agent finds the stage after a compaction.
- With the whole text in callouts, the normal text is empty: an interactive reader reads that the workflow has nothing to do.

> [!headless]
> Set `flint orbh session set phase alone`.

## Stage 6: Update the Links

Do this only when no conflict is open. A conflict stops the migration before this stage.

1. In each file of the source, replace:
   - `[[dev-hwkfl-<sh>-<name>]]` and `[[hwkfl-<sh>-<name>]]` with the `wkfl-` name;
   - `[[dev-hinit-<sh>]]` and `[[hinit-<sh>]]` with `[[dev-init-<sh>#Headless]]` (or `[[init-<sh>#Headless]]`, in the same form as the old link);
   - `flint shard hstart <sh>` with `flint shard start <sh>`, and `hstart-dev` with `start-dev`;
   - `--headless` in each `flint shard invoke` command: remove it;
   - the old file names in the init, in `README.md`, and in the tree of the files.
2. Do not change the release history (`RELEASE.md`, `CHANGELOG.md`): an entry of an earlier version stays as it is. Add an entry for this version when the source keeps a history.
3. Run `flint shard knap check-modes "<source folder>"` again. It must show no headless file and no reference. A reference that stays on purpose (a line that explains the old form) needs a reason in the commit body.

> [!headless]
> Set `flint orbh session set phase links`.

## Stage 7: Check

1. `flint shard knap check-modes "<source folder>"`: no headless file, no reference, no problem. It checks that each invocation file is JSON, that each `stage` is a heading of its Markdown workflow, that no token of a `next` text stands inside quotes, and that no heading is inside a callout.
2. `flint shard status <alias> --health`. It checks the build when this Flint has one, else the source. Read each warning of the files that you changed. No `deprecated` warning and no invocation file warning may stay.
   - The live `flint` reads format 0.3 since deploy 1 of NUU Orbh Task 748. On a machine with an older CLI, use the CLI of the flint repository: `node "<flint repository>/apps/flint-cli/bin/flint-dev.js" shard status <alias> --health`.
   - When the health check reads the build, it shows your change only after `flint shard build <alias>`. Build only when the person or your prompt allows a build in this Flint. Else write "health: the build is older than the source" in the result.
3. **Check both modes.** The migration is complete only when each invocation file that you changed opens in both modes with the inputs that its callers give. Do it in a scratch Flint, not in a real Flint, because the behaviours of a workflow change the Mesh:
   - Make the scratch Flint in a temporary folder: `flint create "<name>"`, then `flint shard install --from-path "<source folder>"`.
   - For each artifact input that a caller gives at the invoke, create a test artifact of its type in the Mesh of the scratch Flint.
   - Run `flint shard invoke <sh> <name> --mode interactive` and `--mode headless`, with the inputs of the callers. Read the `Mode:` line and `Skipped (mode):` of each run. Read the steps that the mode skipped, and the hint of each step. Then close the invocation: `flint shard invocations close <id> --outcome abandoned --reason 'test'`.
   - For a creation input (Stage 1, step 7, option 1): invoke with no value, create the file, and run `flint shard invocations set-input <id> <input>='<title>'`. The set-input must pass.
   - When the check cannot run (for example, a dependency does not install in the scratch Flint), the migration stops: there is no bump, no commit, and no `done` close without both checks. Save your work as a patch for the person: `git diff --binary <BASE> -- "<path>" … > "<scratch>/<sh>-modes.patch"`. Then follow the rule "A conflict stops the whole migration" ([Rules](#rules)): put back the paths of the ledger that are yours, close the invocation `abandoned`, and give the blocker: why the check could not run, the patch, and the check that the person must run.

> [!headless]
> Set `flint orbh session set phase check`. A finding that you cannot fix is a blocker: write it in the result, with the file and the line. A check of a mode that fails is a conflict: it stops the whole migration.

## Stage 8: Review

- Give the person the summary: the files that you merged, renamed, and deleted; each dropped line and why; each choice; and the result of the check.
- Show the diff of one merged workflow, and refine until the person confirms.

> [!headless]
> A headless session does not do this stage. The invocation skips the step `review` at the open. Put the summary in the result.

## Stage 9: Commit and Version

Do this only when no conflict is open, and when the check of Stage 7 passed in both modes. When it did not pass, or it could not run, do not bump, commit, or close the invocation `done`: Stage 7 gives the blocker.

1. Run the guard. Then bump `version` in `shard.yaml`, and update the ledger:
   - a shard at `1.0.0` or above: a minor change (`1.6.0` to `1.7.0`);
   - a `0.x` shard: a patch change (`0.4.2` to `0.4.3`). A minor change of a `0.x` shard breaks the caret ranges of its dependents: `^0.4` does not accept `0.5.0`.
2. Run the guard again on each path of the ledger. On a difference, stop: do not commit. Follow the rule "A conflict stops the whole migration" ([Rules](#rules)), and give the blocker.
3. Stage the new and the renamed paths: `git add <path>…`. `git rm` and `git mv` stage the deletions and the renames.
4. Commit only your paths: `git commit -m "<subject>" -m "<body>" -- <path>…`. Name each path: the changed files, the deleted files, the renamed files (the old and the new path), and `shard.yaml`. Never use `git add -A`, `git add .`, or `git commit -a`.
   - The subject: the subject that the caller gave, else `Merge the headless files into one workflow for each mode`.
   - The body: what you merged, each dropped text and why, the id map, each conflict, each choice, and the new version.
5. Do not push, release, or build, unless the person or your prompt asks for it.
6. Set the output: `flint shard invocations set-output <id> commit="<sha>"`.

> [!headless]
> Set `flint orbh session set phase commit`.

## Stage 10: References in Other Shards

Other shards and the Mesh can name the files that you deleted. Do not edit them: each source has its owner.

1. Search the other sources and the Mesh of the Flints of this machine for the old names: `grep -rn -E "hwkfl-<sh>-|hinit-<sh>\b|hstart(-dev)? <sh>\b" <the Flint roots> --include='*.md' --include='*.json' --include='*.js' --include='*.ts' --include='*.yaml'`. Leave out `.git/`, `.flint/`, the builds (`Shards/<Name>/` of a source that you list already: the next build overwrites them), and the release history.
2. List each place for the person: the file, the line, and the new name (`wkfl-<sh>-<name>`, `init-<sh>#Headless`, or `flint shard start <sh>`).
3. Close the invocation: `flint shard invocations close <id> --outcome done`. Close it `done` only after the commit of Stage 9, which needs the check of both modes.

> [!headless]
> Put the list in the result. Then return: `flint orbh session return --finish "<result>"`. The result has the commit, the files, the new version, the dropped lines, the choices, the proposals (`ready`, `then`, and the other 0.3 fields), and the list of references.

# Output

- The source has no `dev-hwkfl-` file and no `dev-hinit-` file.
- Each merged workflow has `> [!headless]` callouts in the stages that differ, and one invocation file of format `shard-invocation/0.3`.
- The init has the section `# Headless` (when the source had a headless init).
- `flint shard knap check-modes` shows nothing, and the health check of the files shows no warning.
- One commit in the source, with the new version.
- The list of references in other shards, for the person.
