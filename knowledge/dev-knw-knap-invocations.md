---
description: "Complete reference for the invocation file of a workflow (shard-invocation/0.1 and 0.2) — when to add one, the name and the place, each field and its rule, the tokens and the quoting rules, behaviour scripts, nesting with calls and outputs, a complete example, and the common mistakes"
orbh-sessions:
  - "[[947c6566-a653-4887-8ff6-b3f35ac99628]]"
---

# Knowledge: Invocation Files

An **invocation** is the durable record of one use of a shard: `.flint/invocations/<id>/events.jsonl` in the Flint. A workflow can declare its machine contract in an **invocation file** beside its Markdown file. The file declares the inputs, the steps, the outputs, and the behaviours of the workflow. This file is the reference for the author of a shard. The agent that runs a workflow uses `flint shard invoke`, `flint shard step`, and `flint shard invocations` ([[dev-knw-knap-cli]] § Invocations). The Flint shard documents that use, and the Orbh shard documents `--with` and `--no-behaviours` on the session verbs.

An invocation is a function call of a shard:

| Function call | Invocation |
|---------------|------------|
| The arguments | The **inputs** (`inputs`) |
| The body | The **steps** (`steps`), in order |
| The return value | The **outputs** (`outputs`) |
| The caller | The **parent** invocation |

The open workflow invocations of one Orbh session are a **stack**. Each open workflow invocation is a **frame**. After each write, the CLI prints a **hint** for the frame: `now:`, `read:`, `next:`, and `part of:`. The Page of the session shows the stack, and the Orbh delivery sends that Page after a compaction. So the invocation file is also what keeps an agent with no memory on the correct step.

## When to Add an Invocation File

Add an invocation file to a workflow when the workflow has one or more of these:

| The workflow has | The file gives |
|------------------|----------------|
| Stages that an agent must do in order, and that must survive a compaction | `steps`, each with its `stage` and a `next` hint |
| An artifact or a text that the run is about | `inputs` (the `when` conditions read them) |
| A value that a caller or a person reads after the run (a report, a notepad) | `outputs` |
| A child workflow of another shard (a task makes a report) | `calls` on the step: the hint prints the exact child command |
| Edits that a script can do with no judgment, at the open, at a step, at the close, or at the return of the session | `behaviours` |
| Steps that must be settled before the turn finishes | `enforced: true` |

Do not add an invocation file:

- To a skill. An invocation file belongs only to a workflow (`wkfl-` or `hwkfl-`).
- To a short workflow with no inputs, no steps that need a record, and no reactions. `flint shard invoke <ref>` with no workflow, and `flint shard start <ref>`, already record a load of the shard.
- To move a judgment into a script. A behaviour is deterministic. Use `run` only for an edit that a script can do with no judgment (a status change, a log line, a pin).
- To prove that a person agreed. `"by": "person"` marks a behaviour, but the CLI does not check the actor.

The invocation file does not replace the Markdown workflow. The Markdown keeps the stages and the judgment. The workflow must also work with no invocation: then the agent does the edits of each stage by hand.

## The Name and the Place

The invocation file is beside the Markdown workflow, with the same stem and the suffix `.invocation.json`.

| Workflow | In the source | In the build |
|----------|---------------|--------------|
| Interactive | `workflows/dev-wkfl-<sh>-<name>.invocation.json` | `workflows/wkfl-<sh>-<name>.invocation.json` |
| Headless | `workflows/dev-hwkfl-<sh>-<name>.invocation.json` | `workflows/hwkfl-<sh>-<name>.invocation.json` |

- The build strips the `dev-` prefix, as for every source file ([[dev-knw-knap-architecture]] § Dev Prefix Rules).
- `workflow` in the file is the stem with no `dev-` prefix, for example `wkfl-proj-do_task`. It must equal the stem of the file name.
- The reader hashes the Markdown workflow beside the file (`dev-wkfl-<sh>-<name>.md` in the source). The hint line `read:` names that file. With no Markdown file, the hint has no `read:` line.
- A headless workflow needs its own invocation file. `flint shard invoke <sh> <name> --headless` reads `hwkfl-<sh>-<name>` first, then `wkfl-<sh>-<name>`.
- An invocation opened with `--dev` reads the file of the source. An invocation opened with no `--dev` reads the file of the build.
- `flint shard start <ref>` lists each workflow with an invocation file under `## Invocations`, with its command, for example `- wkfl-proj-do_task — flint shard invoke proj do_task`.
- `shard.yaml` declares nothing. Discovery is by the file name.

## The Two Formats

| Format | From | What it accepts |
|--------|------|-----------------|
| `shard-invocation/0.1` | NUU Orbh Task 743 | `format`, `workflow`, `title`, `inputs`, `steps` (`id`, `title`, `by`, `evidence`), `enforced`, `behaviours` on the places `invocation.open`, `session.close`, and `session.return` |
| `shard-invocation/0.2` | NUU Orbh Task 744 | All of 0.1, and `outputs`, the step fields `stage`, `next`, `calls`, and `repeat`, and the place `step.done:<step>` |

Use `shard-invocation/0.2` for a new file. A 0.2 field in a 0.1 file is a problem: `The field "stage" needs format 0.2: set "format" to "shard-invocation/0.2".` The file, each input, each output, each step, each call, and each behaviour have a closed set of fields: an unknown field is a problem that lists the valid fields.

## The Fields

### The File

| Field | Rule |
|-------|------|
| `format` | Required. `"shard-invocation/0.1"` or `"shard-invocation/0.2"`. |
| `workflow` | Required. The stem with no `dev-` prefix. It matches `^h?wkfl-[a-z0-9][a-z0-9-]*-[a-z0-9][a-z0-9_-]*$` and equals the stem of the file name. |
| `title` | Optional string. The invoke shows it. With no title, the invoke uses `<shard name>: <short name>`. |
| `inputs` | Optional. An object from an input name to an input. |
| `steps` | Optional. A list of steps, in order. |
| `outputs` | Optional, 0.2. An object from an output name to an output. |
| `enforced` | Optional, `true` or `false`. See [Enforced](#enforced). |
| `behaviours` | Optional. A list of behaviours, in file order. |

### Inputs

The key is the input name. It matches `^[a-z][a-z0-9_]{0,31}$`.

| Field | Rule |
|-------|------|
| `kind` | Required. `"text"` or `"artifact"`. A `when` key can read a field of an artifact input only. |
| `type` | Optional string, for `artifact`: the Mesh type, for example `"Task"`. Information only. |
| `required` | Optional, `true` or `false`. |
| `description` | Optional string. Say what the value is, with an example. |

The agent gives an input with `--input <name>=<value>`. An unknown name refuses (`input-unknown`), and a name given two times refuses (`input-repeated`). A missing required input does not refuse: the invoke prints `MISSING, required` and the command `flint shard invocations set-input <id> <name>='<…>'`. For an input that does not exist at the open (a task that Stage 1 creates), do not set `required`, and let its `description` tell the agent to set it later. `wkfl-proj-create_and_do_task` does this.

The value of an artifact input is a Mesh title (`(Task) 744 Name`), a wikilink (`[[(Task) 744 Name]]`), or a path under `Mesh/`.

### Outputs (0.2)

The key is the output name. It matches `^[a-z][a-z0-9_]{0,31}$`. The fields are the fields of an input: `kind` (required), `type`, `required`, and `description`.

- The agent or a script sets an output with `flint shard invocations set-output <id> <name>=<value>`. The name must be an output that the file declares. A second set of the same name replaces the value.
- `flint shard invocations close <id> --outcome done` refuses while a required output is not set. An empty value counts as not set.
- When a child closes, its parent record gets a copy of the outputs of the child. Declare an output for each value that a caller needs.

### Steps

| Field | Format | Rule |
|-------|--------|------|
| `id` | 0.1 | Required. Matches `^[a-z0-9][a-z0-9_-]{0,47}$`. Unique in the file. |
| `title` | 0.1 | Required. A string that is not empty. |
| `by` | 0.1 | Required. `"agent"`, `"script"`, or `"person"`. The CLI shows it; it does not check the actor. |
| `evidence` | 0.1 | Optional. `"required"` or `"optional"`. With `"required"`, `flint shard step done <id>` refuses with no `--evidence` (`evidence-required`). |
| `stage` | 0.2 | Optional. The exact text of the heading of the stage in the Markdown workflow, with no `#` marks, for example `"Stage 3: Task Review"`. The hint prints `read: <stage> of <markdown>`. |
| `next` | 0.2 | Optional. A short hint for the actor: one line, with tokens. See [Tokens and Quoting](#tokens-and-quoting). |
| `calls` | 0.2 | Optional. 1 to 4 child invocations that the step expects. See [Calls](#calls). |
| `repeat` | 0.2 | Optional, `true` or `false`. A loop with no fixed end, for example the conversation of a notepad. The step stays current until it is done, and the hint keeps each call. |

Steps settle in order. The first step that is not done or skipped is the **current** step. `flint shard step done <id>` and `flint shard step skip <id> --reason '<why>'` act only on the current step: another step refuses (`step-out-of-order`). A skip runs no behaviour.

The `opened` event of the record holds a snapshot of the steps, the outputs, and `enforced`. A change of the file after the open does not change the steps of an open invocation. The behaviours are different: the runner reads the file again at each place.

### Calls

Each call is an object:

| Field | Rule |
|-------|------|
| `shard` | Required. The shard of the child, as `flint shard invoke` accepts it: a shorthand, an alias, or an id. The invoke records the shorthand of the installed shard. |
| `workflow` | Required. The short name of the workflow of the child, as `flint shard invoke <shard> <workflow>` accepts it, for example `"create"`. |
| `inputs` | Optional. An object from an input name of the child to a string with tokens. |

A call does not open the child. It makes the hint print the exact command, and the actor runs it. See [Nesting from the Side of the Author](#nesting-from-the-side-of-the-author).

### Behaviours

A **behaviour** is a named reaction. It runs when a **place** fires for an invocation that is open in the session.

| Field | Rule |
|-------|------|
| `id` | Required. Matches `^[a-z0-9][a-z0-9-]{0,47}$`. Unique in the file. `--with <id>` names it. |
| `on` | Required. One place, or a list of places that is not empty, each one time. |
| `phase` | Optional. `"before"` or `"after"`. The default is `"after"`. |
| `opt-in` | Optional, `true` or `false`. An opt-in behaviour runs only when the verb gets `--with <id>`. |
| `by` | Optional. Only `"person"`: only a person may ask for the behaviour. The invoke shows it; the CLI does not check it. |
| `disposition` | Optional, only on `session.return`. A list of `"finish"` and `"await"` that is not empty. The default is both. |
| `when` | Optional. A condition on the inputs. See [Conditions](#conditions). |
| `run` | An action: the name of a script of the shard. See [Behaviour Scripts](#behaviour-scripts). |
| `say` | An action: a line for the actor. |
| `refuse` | An action: stop the verb with this reason. Only with `"phase": "before"`. |

A behaviour has exactly one action of `run`, `say`, and `refuse`.

**The places:**

| Place | It fires at | Phases | Notes |
|-------|-------------|--------|-------|
| `invocation.open` | `flint shard invoke <sh> <workflow>`, after the record is written | `after` only | A failure is a warning: the invoke does not refuse. |
| `session.close` | `flint orbh close` of the session | `before`, `after` | It reaches the open workflow invocations of the session, and the ones that `return --finish` closed, so a person can confirm the work of a headless agent after it finished. |
| `session.return` | `flint orbh session return --finish` or `--await` | `before`, `after` | It reaches the open workflow invocations of the session. `disposition` selects `finish`, `await`, or both. |
| `step.done:<step>` | `flint shard step done <step>` (0.2) | `before`, `after` | `<step>` must be a step of the file. A `before` behaviour can refuse the step. No verb passes `--with` to a step: a behaviour on this place cannot be opt-in and cannot have a disposition. |

After the `after` phase of `flint orbh close` and of `return --finish`, Flint closes each open frame of the session, from the top of the stack down, with the outcome `session-closed` or `session-returned`.

**The phases:**

- A `before` behaviour runs before the verb writes its fact. A `refuse`, or a `run` script that fails, stops the verb, and no later behaviour runs. A record or an invocation file that cannot be read, or a `when` that cannot be evaluated, also stops the verb.
- An `after` behaviour runs after the fact is durable. It cannot undo the verb. A failure is a warning.

**The match.** A behaviour runs when all of these are true: `on` includes the place, `phase` is the phase of the run, `disposition` includes the disposition (for `session.return`), the verb names it with `--with` (for an opt-in behaviour), and `when` is true. The behaviours run in file order. An opt-in behaviour that the verb names, but whose `when` is false, prints one line that ends with `Nothing done.`

**`--with` and `--no-behaviours`.** `flint orbh close` and `flint orbh session return` accept `--with <id>` and `--with <id>=<value>` (repeatable). The value goes to the behaviour (`{{with}}`, `FLINT_BEHAVIOUR_VALUE`). A name that no open invocation of the session declares as an opt-in behaviour of the place refuses (`unknown-with`) and lists the valid names. A name given two times refuses (`duplicate-with`). `--no-behaviours` runs no behaviour, and the record keeps that choice.

### Conditions

A `when` is an object from a key to a condition. Each key must be true.

| Key | It reads |
|-----|----------|
| `<input>` | The value of a text input (or of an artifact input). |
| `<input>.<field>` | The YAML frontmatter field `<field>` of the Mesh file that the artifact input names. A text input has no fields. |

| Condition | True when |
|-----------|-----------|
| A list of strings that is not empty, for example `["review", "reviewed"]` | The value equals one item. For a list field, one item of the field equals one item. |
| `"set"` | The value is present and not empty. |
| `"empty"` | The value is absent or empty. |

A missing input, or a missing Mesh file, makes the condition false. Two Mesh files with the title, or a frontmatter that cannot be parsed, is an error: in the phase `before`, the verb stops. Each key must name a declared input.

### Enforced

With `"enforced": true`, `flint orbh session return --finish` refuses (`enforced-steps-open`) while a step of an open invocation of the session is not done or skipped. A `repeat` step counts too. `--no-behaviours` passes the guard, and the record keeps that. The guard does not act on `return --await` or on `flint orbh close`. Use `enforced` only for a workflow whose turn must not finish with an open step.

## Tokens and Quoting

| Text | Tokens |
|------|--------|
| `next` of a step | `{{<input>}}`, `{{output.<name>}}`, `{{invocation}}` (the id of the invocation) |
| `inputs` of a call | `{{<input>}}`, `{{output.<name>}}`, `{{invocation}}` |
| `say` and `refuse` of a behaviour | `{{<input>}}`, `{{invocation}}`, `{{with}}` (the value of `--with <id>=<value>`, or empty) |

An unknown token stays as it is written.

**`next`.** The hint renders `next` as one line. It puts the value of each token in POSIX single quotes itself, so the shell expands nothing in a value. Thus:

- Write each token outside quotes: `set-input {{invocation}} task={{task}}`, not `task="{{task}}"` and not `task='{{task}}'`.
- The validator refuses a token inside `'…'`, `"…"`, or `$'…'`. An apostrophe before a token opens a quote too: `the person's {{note}}` is refused. Write `the note {{note}} of the person`.
- The validator refuses each token of a text that has `$(`, `${`, or a backquote at any place.
- A quoted placeholder with no token is correct: `--reason '<why>'`, `report='(Report) NNN Title'`.

For example, the `next` text `Implement {{task}}: tick each checkbox.` prints `Implement '(Task) 744 Name': tick each checkbox.`

When a `next` text runs `set-output <id> <name>=…`, and each output that it names is set already, the hint leaves the text out. So a `next` text can ask for an output, and the hint stops when the output is set.

**`inputs` of a call.** The value goes in raw, and the hint puts the whole argument in single quotes. Do not add quotes: write `"source": "{{task}}"`. A quote in the value becomes a character of the input of the child.

**`say` and `refuse`.** These are lines for the actor, not commands. The values go in as they are, with no quotes.

## Behaviour Scripts

A `run` behaviour runs a script of the shard. The script is a normal shard script ([[dev-tmp-knap-script-v0.1]]).

- **The name.** `run` is the command name, as `flint shard <sh> <script>` takes it: no `dev-` prefix, no extension, no folder. It matches `^[a-z0-9][a-z0-9_-]*$`. The validator checks that `scripts/` of the shard has the script. The runner looks for `scripts/dev-<name>.js`, `dev-<name>.mjs`, `<name>.js`, then `<name>.mjs`, in the shard folder of the invocation file: the source with `--dev`, else the build. The file must be a regular file, with no symbolic link.
- **The process.** The script runs as `node <script>`, in the Flint root, with no stdin, in its own process group.

**The environment.** The script gets the environment of the caller, with these changes:

| Variable | Value |
|----------|-------|
| `FLINT_ROOT` | The Flint root. |
| `FLINT_SHARD` | The name of the shard folder, for example `Projects` or `(Source Local) Demo Lab`. |
| `FLINT_OPERATOR_NAME` | The Name of this machine, or absent. |
| `FLINT_INVOCATION_ID` | The id of the invocation, for example `inv-9d4527f6aa03`. |
| `FLINT_BEHAVIOUR` | The id of the behaviour. |
| `FLINT_BEHAVIOUR_VALUE` | The value of `--with <id>=<value>`, or empty. |
| `FLINT_INVOCATION_INPUTS` | The inputs of the invocation as one JSON object, for example `{"task":"(Task) 744 Name"}`. |
| `ORBH_SESSION_ID` | The session of the verb, or absent (an invoke outside an Orbh session). |
| `ORBH_CWD`, `ORBH_ORB_ROOT_DIR` | The folder and the Orb store of the target session. |

The script never gets the run values of the caller (`ORBH_RUN_ID` and the manager sockets). It keeps `ORBH_CWD`, `ORBH_ORB_ROOT_DIR`, and `ORBH_FLEET_*` of the caller only when the caller is the target session.

**The exit code.**

| Exit | Outcome |
|------|---------|
| `0` | `ok`. Each line of stdout goes to the actor and into the record. |
| Any other code | `failed`. The reason is the first text of stderr, else of stdout. In the phase `before`, the verb stops (`behaviour-failed`). In the phase `after`, the reason is a warning. |

**Record before run.** The runner writes `behaviour.started` before the action and `behaviour.done` after it. The key of one run is `<behaviour>:<place>:<phase>:<fact>`. A second run of the same fact after an `ok` does nothing. A run that failed runs again at the next try of the verb. So write each script so that a second run changes nothing: for example, `task-open` of Projects changes nothing when the task is already `in-progress`.

**The limits.**

- The time limit is 60 s. Then the process group gets `SIGTERM`, and `SIGKILL` 1 s later. The outcome is `failed`.
- The runner keeps at most 1 MiB of stdout and of stderr. The record keeps at most 100 lines, each line at most 2000 characters, and at most 64 KiB in JSON. A cut adds the line `… <n> more lines not kept`.
- A `behaviour.started` with no `behaviour.done` after 90 s is stale. The next run closes it as `failed` (`interrupted`).

**After each script**, the runner reads the Mesh and the records again. So a script can change the task or set an input (`flint shard invocations set-input`), and the next behaviour reads the new value.

**A run by hand.** A person or an agent can also run the script with `flint shard <sh> <script>`. Then the `FLINT_INVOCATION_*` variables are absent. Accept an argument for that case: the Projects scripts take the task title as the first argument.

## Nesting from the Side of the Author

**The parent.** `flint shard invoke` chooses the parent of a new workflow invocation in this order: `--root` (no parent), `--parent <id>`, the top of the stack of the session, then the launch record of a child session (`FLINT_PARENT_INVOCATION`). A load has no parent. The depth cap is 8, so a chain has at most 9 frames. The author declares no parent: the stack gives it.

**`calls`.** A call makes the hint of its step print the exact command of the child:

```
next:    flint shard invoke rpt create --input source='(Task) 001 Demo Work'
```

- A headless frame (`hwkfl-`) adds `--headless` to the command.
- A frame that is not the top of the stack, or that has no session, adds `--parent <id>`. Its step commands get `--invocation <id>`.
- The hint leaves out a call when a child of the step covers it: the same shard, the same workflow, and the same rendered inputs. A `repeat` step keeps each call.
- The validator does not check that the shard or the workflow of a call exists. A Flint with no such shard refuses the command of the child. Say in the Markdown what the agent does then (for example, skip the step with a reason).

**The return.** When the child closes, the parent record gets `child.closed` with the outcome and the outputs of the child. The hint goes back to the parent (`back in:`). The outputs of the child do not set the outputs of the parent: the agent of the parent sets them.

**The close rules.**

- `flint shard invocations close <id> --outcome done` refuses while a step is not done or skipped (`steps-open`), or while a required output is not set (`outputs-missing`). `--outcome abandoned` closes with open steps.
- A parent cannot close while a child is open (`children-open`). The refusal lists the children. `--abandon-children '<why>'` closes each open child first, with the outcome `abandoned`.
- A close of the session closes its frames from the top down. A child in another session stays open, with a warning.

## The Markdown Workflow

- Write each `stage` as the exact heading text: `## Stage 2: Report` gives `"stage": "Stage 2: Report"`, and `## 3. Report` gives `"stage": "3. Report"`.
- Add a section `# Invocation` after the title. Say how to start the workflow (`flint shard invoke <sh> <name> --input <name>="<value>"`), which behaviours do which edits, the step ids, how to set each output, and that outside an Orbh session the agent gives `--invocation <id>` to `flint shard step`. End with: when no invocation is open, follow the stages with no record. The released Notepad, Projects, and Reports workflows have this section.
- Keep the stages complete. The invocation file adds a record; it does not remove a stage.

## Complete Example

This is `workflows/dev-wkfl-proj-do_task.invocation.json` of Projects 1.6.0. It has an artifact input, an optional output, four steps with stages and hints, a call to the Reports shard, and five behaviours.

```json
{
  "format": "shard-invocation/0.2",
  "workflow": "wkfl-proj-do_task",
  "title": "Do Task",
  "inputs": {
    "task": {
      "kind": "artifact",
      "type": "Task",
      "required": true,
      "description": "The title of the task, for example \"(Task) 743 Shard Invocations\"."
    }
  },
  "outputs": {
    "report": {
      "kind": "artifact",
      "type": "Report",
      "required": false,
      "description": "The report that the task made, for example \"(Report) 031 Title\". Set it in the report step."
    }
  },
  "steps": [
    {
      "id": "work",
      "title": "Task Work",
      "by": "agent",
      "evidence": "required",
      "stage": "Stage 1: Task Work",
      "next": "Implement {{task}}: tick each checkbox, write the Task Log, and commit the WIP of each repo in git-repos."
    },
    {
      "id": "report",
      "title": "Report",
      "by": "agent",
      "evidence": "optional",
      "stage": "Stage 2: Report",
      "next": "Make a report when {{task}} asks for one, or when the work found something to keep. Then set the output: flint shard invocations set-output {{invocation}} report='(Report) NNN Title'. Else skip this step: flint shard step skip report --invocation {{invocation}} --reason '<why>'.",
      "calls": [
        { "shard": "rpt", "workflow": "create", "inputs": { "source": "{{task}}" } }
      ]
    },
    {
      "id": "review",
      "title": "Task Review",
      "by": "agent",
      "evidence": "required",
      "stage": "Stage 3: Task Review",
      "next": "Set {{task}} to review, give the person a summary, and refine it until the person confirms."
    },
    {
      "id": "close",
      "title": "Close",
      "by": "agent",
      "evidence": "required",
      "stage": "Stage 4: Close",
      "next": "When the person confirms, run flint shard proj task-close {{task}}. When the session ends with the task, use flint orbh close --with task-confirm instead."
    }
  ],
  "behaviours": [
    { "id": "task-open", "on": "invocation.open", "when": { "task.status": ["todo"] }, "run": "task-open" },
    {
      "id": "task-confirm",
      "on": ["session.close", "session.return"],
      "phase": "before",
      "opt-in": true,
      "by": "person",
      "when": { "task.status": ["review", "reviewed", "done"] },
      "run": "task-close"
    },
    {
      "id": "task-defer",
      "on": ["session.close", "session.return"],
      "phase": "before",
      "opt-in": true,
      "when": { "task.status": ["in-progress", "blocked"] },
      "run": "task-defer"
    },
    {
      "id": "task-hint",
      "on": "session.close",
      "phase": "before",
      "when": { "task.status": ["review"] },
      "say": "{{task}} is in review. Close with --with task-confirm to move it to done, or keep it in review."
    },
    {
      "id": "task-return-check",
      "on": "session.return",
      "phase": "before",
      "disposition": ["finish"],
      "when": { "task.status": ["todo", "in-progress"] },
      "say": "{{task}} is still open: it is not in review. Move it to review when the work is done, or return with --with task-defer=\"<reason>\" to defer it."
    }
  ]
}
```

What each part does:

| Part | Effect |
|------|--------|
| `task-open` | At the invoke, when the task is `todo`, the script sets `in-progress`, adds the session to `orbh-sessions`, and pins the task. |
| `task-confirm` | `flint orbh close --with task-confirm` (or `return --with task-confirm`) runs `task-close` before the verb, when the task is `review`, `reviewed`, or `done`. A failure stops the verb. |
| `task-defer` | `--with task-defer="<reason>"` runs `task-defer`; the script reads the reason from `FLINT_BEHAVIOUR_VALUE`. |
| `task-hint`, `task-return-check` | Lines for the actor before a close or a `return --finish`. |
| `calls` of `report` | The hint of the step prints the command of the report as a child of the task. |
| `{{invocation}}` in `next` | The hint prints the id of this invocation in each command. |

The invoke and the first step, in a scratch Flint with no Orbh session (so each command names the frame):

```
$ flint shard invoke proj do_task --input task="(Task) 001 Demo Work"
…
(Task) 001 todo → in-progress

now:     step 1/4 work
read:    Stage 1: Task Work of Shards/Projects/workflows/wkfl-proj-do_task.md
next:    Implement '(Task) 001 Demo Work': tick each checkbox, write the Task Log, and commit the WIP of each repo in git-repos.
         flint shard step done work --evidence '<…>' --invocation inv-9d4527f6aa03

$ flint shard step done work --evidence "commit 3f2a1c9" --invocation inv-9d4527f6aa03
✓ proj do_task · (Task) 001 Demo Work · step 1/4 work done
now:     step 2/4 report
read:    Stage 2: Report of Shards/Projects/workflows/wkfl-proj-do_task.md
next:    flint shard invoke rpt create --parent inv-9d4527f6aa03 --input source='(Task) 001 Demo Work'
         Make a report when '(Task) 001 Demo Work' asks for one, … (this file cuts the long line)
         flint shard step done report --invocation inv-9d4527f6aa03
```

In an Orbh session, at the top of the stack, the commands have no `--parent` and no `--invocation`.

## Check a File

1. `flint shard build <alias>`, then `flint shard status <alias> --health`. The health check reads the build, and it gives one warning for each invocation file that is not valid, with up to five problems. Each problem has a JSON path, for example `$.behaviours[2].run`.
2. `flint shard invoke <sh> <name> --dev` refuses a file that is not valid (`invocation-file-invalid`) and lists each problem. `--json` gives the full list in `reason`.
3. `flint shard start-dev <alias>` lists the file under `## Invocations`.
4. Run the workflow one time in a scratch Flint: `flint shard invoke`, `flint shard step done` for each step, `flint shard invocations set-output`, and `flint shard invocations close <id> --outcome done`. Read each hint.

## Common Mistakes

| Mistake | What happens | Fix |
|---------|--------------|-----|
| A `stage` that is not the exact heading | No check finds it. The hint says `read: <stage>`, and the agent cannot find that heading after a compaction. | Copy the heading text with no `#` marks. Check it again when you rename a stage. |
| A token in quotes in `next`: `task="{{task}}"`, `'{{task}}'` | A problem: `The token {{task}} stands inside double quotes. …` | Write the token outside quotes: `task={{task}}`. |
| An apostrophe before a token: `the person's {{note}}` | A problem: the apostrophe opens a quote. | Change the words: `the note {{note}} of the person`. |
| `$(`, `${`, or a backquote in a `next` with a token | A problem for each token. | Remove the substitution. |
| Quotes in the `inputs` of a call: `"'{{task}}'"` | No problem, but the quotes become a part of the input of the child. | Write `"{{task}}"`. |
| `"opt-in": true` on `step.done:<step>` | A problem: no verb passes `--with` to a step. | Remove `opt-in`, or put the behaviour on a place of the session. |
| A 0.2 field (`stage`, `next`, `calls`, `repeat`, `outputs`, `step.done:`) in a 0.1 file | A problem that names the format 0.2. | Set `"format": "shard-invocation/0.2"`. |
| `workflow` with the `dev-` prefix, or another stem than the file name | A problem. | Write the stem of the build: `wkfl-<sh>-<name>`. |
| `refuse` with no `"phase": "before"` | A problem. | Add `"phase": "before"`. |
| `"phase": "before"` on `invocation.open` | A problem. | Remove the phase. |
| `disposition` on a place that is not `session.return` | A problem. | Put the behaviour on `session.return`, or remove `disposition`. |
| `run` with a path: `"scripts/task-open.js"` | A problem. | Write the command name: `"task-open"`. |
| `when` with a field of a text input: `note.status` | A problem. | Make the input an artifact input, or use the key `note`. |
| Two actions, or no action | A problem. | Keep exactly one of `run`, `say`, and `refuse`. |
| A script that is not safe to run two times | A run that failed runs again at the next try, and the edit is made two times. | Make a second run change nothing. |
| A file that is not valid while a session has the invocation open | Each `before` phase of `close` and `return` of that session stops (`behaviour-failed`). | Fix the file, and build the shard again. |
| An edit of the file in the build | The next build or install overwrites it. | Edit the source, then `flint shard build <alias>`. |
