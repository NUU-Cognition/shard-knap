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
- Outside an Orbh session (no `ORBH_SESSION_ID`), give `--invocation <id>` to `flint shard step`. The hint after each write prints the id.
- When no invocation is open, follow the stages with no record.

# Input

- The shard source: its alias, its shorthand, or its folder (`Shards/(Source Remote) <Name>/` or `Shards/(Source Local) <Name>/`)
- (Optional) The commit subject that the caller wants, for example `[OR] wip: <Flint Name>/(Task) NNN Title`

# Rules

- **One source.** Change only the files of this source. Do not edit another shard: Stage 10 lists its references for the person.
- **Nothing lost.** Each instruction of a headless file goes into the normal text, into a callout, or into the `# Headless` section. An instruction that you drop is only one that named the headless file itself (`hwkfl-`, `hinit-`, `hstart`, `--headless`). Write each dropped line in the commit body.
- **The meaning stays.** Do not add `ready`, `make-ready`, `assumes`, `then`, or `done-when` in this migration: they change what the workflow does. Write each one that the workflow could use as a proposal in the result.
- **Current command forms.** Write the Orbh commands as the Orbh shard gives them now: `flint orbh session set <key> <value>` (no id), `flint orbh session return --finish "<result>"`, `flint orbh artifact "<path>"`, `flint orbh request "$ORBH_SESSION_ID" "<question>"`. Check a form with `--help` when you are not sure.
- **Shared workspace.** Other sessions can work in the same repository. Do not revert, stash, or commit their changes. Commit only your own paths.

# Actions

## Stage 1: Inventory

1. Load the source: `flint shard start-dev <alias>`. Read `shard.yaml` (the `version` and the `shorthand`) and `dev-init-<sh>.md`.
2. Run the check: `flint shard knap check-modes "<source folder>"`. It lists:
   - each headless file, with its partner `dev-wkfl-` file or `no partner`;
   - each line that names `hwkfl-`, `hinit-`, `hstart`, `hstart-dev`, or `--headless`;
   - each problem of the invocation files.
3. Run `git status --short` in the source. When a file that you must change has changes of another session, stop: tell the person (or put it in the result), and do not edit that file.
4. Write the plan: for each headless file, the stage of this workflow that handles it (Stage 2, 3, 4, or 5), and for each pair, the stages of the two Markdown files side by side.
5. Give the inventory and the plan to the person.

> [!headless]
> Do not wait for a person. Keep the inventory and the plan for the result. Set `flint orbh session set phase inventory` and `flint orbh session set progress "0/<N> files"`, where `<N>` is the count of headless files.

## Stage 2: Merge the Workflows

Do this for each `dev-hwkfl-<sh>-<name>.md` that has a partner `dev-wkfl-<sh>-<name>.md`.

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
9. In `# Invocation`, replace each line that names the headless file, `hstart`, or `--headless` with the mode line: "The mode comes from the Orbh session. A headless or subagent session runs in the headless mode and follows the `> [!headless]` callouts." Put the headless rules of the invocation (the defer, a refused script) in a callout at the end of `# Invocation`.
10. Remove `--headless` from each command. A headless child runs in the headless mode with the same command.
11. Check that nothing is lost: read the headless file from the top. Each line is in the base text, in a callout, in the `# Headless` section of the init (Stage 4), or on your list of dropped lines.
12. Delete the headless file: `git rm "workflows/dev-hwkfl-<sh>-<name>.md"`.

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

Do this for each `dev-hwkfl-<sh>-<name>.invocation.json`.

1. **The base.** When `dev-wkfl-<sh>-<name>.invocation.json` exists, it is the base. Else rename the headless file to it (`git mv`), and add the interactive texts from the Markdown.
2. **The format.** Set `"format": "shard-invocation/0.3"`. `workflow` is `wkfl-<sh>-<name>`.
3. **The steps.** Match each headless step to the step of the same stage of the merged Markdown.
   - When the two `next` texts differ, make `next` an object: `{ "interactive": "<the text of the base>", "headless": "<the headless text>" }`. Remove `--headless` from the headless text.
   - A step that a headless session must not do gets `"modes": ["interactive"]`. The invoke skips it at the open in the headless mode.
   - A headless step with no partner gets `"modes": ["headless"]`, at its place in the order. Its `stage` names a heading of the merged Markdown.
   - Keep the `id`, `evidence`, `calls`, and `repeat` of the base. When the headless step had `evidence: "required"` and the base step has `"optional"`, keep the base, and write it in the commit body.
4. **The behaviours.** Keep each behaviour of the base. Add each behaviour that only the headless file has. When it must not run in the interactive mode, add `"session.mode": ["headless"]` to its `when`. When the two files have the same `id` with other content, keep one behaviour for each mode: two ids, each with a `session.mode` key.
5. **The inputs and outputs.** Take the union. When an input or an output differs (`required`, `description`), keep the form of the base, and say the difference of the headless mode in the `description` or in a callout of the Markdown.
6. **`enforced`.** When only one file has `"enforced": true`, keep it only when an interactive run must also settle each step before `return --finish`. Else leave it out, and write the reason in the commit body.
7. **The quoting rules.** Each text of a `next` object follows the rules of [[dev-knw-knap-invocations]] § Tokens and Quoting: each token outside quotes, no `$(`, `${`, or backquote in a text with a token.
8. Delete the headless invocation file: `git rm "workflows/dev-hwkfl-<sh>-<name>.invocation.json"`.

> [!headless]
> Set `flint orbh session set phase invocation-files`.

## Stage 4: Merge the Init

Do this when the source has `dev-hinit-<sh>.md`. Ten sources have only this file.

1. Read `dev-hinit-<sh>.md` and `dev-init-<sh>.md` fully.
2. Add a section `# Headless` to `dev-init-<sh>.md`, after the sections on the workflows (before `# Dashboards` when the init has one). Start it with: "A headless or subagent Orbh session has no person at the terminal. It loads this init with `flint shard start <sh>`, as an interactive session does. Follow the `> [!headless]` callouts of the workflows."
3. Move the content of the headless init into the section:
   - `## Orbh Interface Keys`: the table of keys, `### Phase Values`, and `### Progress Format` (and the example of the session interface);
   - `## Result Delivery`: `flint orbh session return --finish "<result>"`, and what the result holds;
   - `## Interaction Model` (optional): the table Interactive | Headless;
   - `## Artifact Tracking` (optional): `flint orbh artifact "<path>"`;
   - each other rule of the shard for a headless session.
4. Drop: the table of headless workflows (the callouts replace it), the sentence that the file replaces the init, and each line that names `hwkfl-` or `hstart`. A rule that the init already has (the WIP commits, the lifecycle) stays one time, in its old place.
5. When the headless init has `required-reading` in its frontmatter, add each file that the init does not list.
6. In the workflow table of the init, remove the rows of the headless workflows. A merged workflow has one row.
7. Delete the headless init: `git rm dev-hinit-<sh>.md`.

> [!headless]
> Set `flint orbh session set phase init`.

## Stage 5: A Headless Workflow with No Partner

Do this for each `dev-hwkfl-<sh>-<name>.md` that has no `dev-wkfl-<sh>-<name>.md` (for example a worker loop of an Orb agent, or a step of a stream).

1. Rename it: `git mv "workflows/dev-hwkfl-<sh>-<name>.md" "workflows/dev-wkfl-<sh>-<name>.md"`. Rename its invocation file too, and set `workflow` to `wkfl-<sh>-<name>` (Stage 3).
2. **Keep it as a normal workflow.** Keep its stages as normal text and normal headings. Do not put the whole text under `> [!headless]` callouts.
3. Change the title (`# Headless Workflow: X` to `# Workflow: X`), and add one line under it: "This workflow runs in a headless Orbh session." When an interactive session can run it too, say how in the same line (for example, "In an interactive session, give the result to the person in place of the return").
4. Change the context line from `hstart` or `hstart-dev` to `start` or `start-dev`.

Why a normal workflow, and not one callout for the whole text:

- A callout marks a difference between two modes. A workflow for one mode has no difference.
- A heading inside a callout (`> ## Stage 1`) is not a heading. The `stage` of the invocation file and the hint line `read:` need a real heading, so the agent finds the stage after a compaction.
- With the whole text in callouts, the normal text is empty: an interactive reader reads that the workflow has nothing to do.

> [!headless]
> Set `flint orbh session set phase alone`.

## Stage 6: Update the Links

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
   - When the live `flint` does not know format 0.3 yet, use the CLI of the flint repository: `node "<flint repository>/apps/flint-cli/bin/flint-dev.js" shard status <alias> --health`.
   - When the health check reads the build, it shows your change only after `flint shard build <alias>`. Build only when the person or your prompt allows a build in this Flint. Else write "health: the build is older than the source" in the result.
3. (Optional) Run each merged workflow one time in a scratch Flint, in each mode: `flint shard invoke <sh> <name> --dev --mode interactive` and `--mode headless`. Read the steps that the mode skipped, and the hint of each step. Do not run a workflow with behaviours in a real Flint for a test: its scripts change the Mesh.

> [!headless]
> Set `flint orbh session set phase check`. A finding that you cannot fix is a blocker: write it in the result, with the file and the line.

## Stage 8: Review

- Give the person the summary: the files that you merged, renamed, and deleted; each dropped line and why; each choice; and the result of the check.
- Show the diff of one merged workflow, and refine until the person confirms.

> [!headless]
> A headless session does not do this stage. The invocation skips the step `review` at the open. Put the summary in the result.

## Stage 9: Commit and Version

1. Bump `version` in `shard.yaml`:
   - a shard at `1.0.0` or above: a minor change (`1.6.0` to `1.7.0`);
   - a `0.x` shard: a patch change (`0.4.2` to `0.4.3`). A minor change of a `0.x` shard breaks the caret ranges of its dependents: `^0.4` does not accept `0.5.0`.
2. Stage the new and the renamed paths: `git add <path>…`. `git rm` and `git mv` stage the deletions and the renames.
3. Commit only your paths: `git commit -m "<subject>" -m "<body>" -- <path>…`. Name each path: the changed files, the deleted files, the renamed files (the old and the new path), and `shard.yaml`. Never use `git add -A`, `git add .`, or `git commit -a`.
   - The subject: the subject that the caller gave, else `Merge the headless files into one workflow for each mode`.
   - The body: what you merged, each dropped line and why, each choice, and the new version.
4. Do not push, release, or build, unless the person or your prompt asks for it.
5. Set the output: `flint shard invocations set-output <id> commit="<sha>"`.

> [!headless]
> Set `flint orbh session set phase commit`.

## Stage 10: References in Other Shards

Other shards and the Mesh can name the files that you deleted. Do not edit them: each source has its owner.

1. Search the other sources and the Mesh of the Flints of this machine for the old names: `grep -rn -E "hwkfl-<sh>-|hinit-<sh>\b|hstart(-dev)? <sh>\b" <the Flint roots> --include='*.md' --include='*.json' --include='*.js' --include='*.ts' --include='*.yaml'`. Leave out `.git/`, `.flint/`, the builds (`Shards/<Name>/` of a source that you list already: the next build overwrites them), and the release history.
2. List each place for the person: the file, the line, and the new name (`wkfl-<sh>-<name>`, `init-<sh>#Headless`, or `flint shard start <sh>`).
3. Close the invocation: `flint shard invocations close <id> --outcome done`.

> [!headless]
> Put the list in the result. Then return: `flint orbh session return --finish "<result>"`. The result has the commit, the files, the new version, the dropped lines, the choices, the proposals (`ready`, `then`, and the other 0.3 fields), and the list of references.

# Output

- The source has no `dev-hwkfl-` file and no `dev-hinit-` file.
- Each merged workflow has `> [!headless]` callouts in the stages that differ, and one invocation file of format `shard-invocation/0.3`.
- The init has the section `# Headless` (when the source had a headless init).
- `flint shard knap check-modes` shows nothing, and the health check of the files shows no warning.
- One commit in the source, with the new version.
- The list of references in other shards, for the person.
