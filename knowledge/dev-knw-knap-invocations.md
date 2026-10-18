---
description: "Complete reference for the invocation file of a workflow (shard-invocation/0.1, 0.2, and 0.3) — when to add one and when to add each field, the name and the place, each field and its rule, conditions, readiness and make-ready, continuation with then and done-when, assumed states, modes, the tokens and the quoting rules, behaviour scripts, nesting with calls and outputs, a complete example, and the common mistakes"
orbh-sessions:
  - "[[947c6566-a653-4887-8ff6-b3f35ac99628]]"
  - "[[ec13c5bf-9eab-4982-b35a-cffc13d48950]]"
---

# Knowledge: Invocation Files

An **invocation** is the durable record of one use of a shard: `.flint/invocations/<id>/events.jsonl` in the Flint. A workflow can declare its machine contract in an **invocation file** beside its Markdown file. The file declares the inputs, the steps, the outputs, and the behaviours of the workflow. Format 0.3 adds the state that an artifact needs before the workflow starts, the workflows that come next, and the differences between the two modes. This file is the reference for the author of a shard. The agent that runs a workflow uses `flint shard invoke`, `flint shard step`, `flint shard invocations`, `flint shard ready`, and `flint shard assumed` ([[dev-knw-knap-cli]] § Invocations). The Flint shard documents that use ([[knw-f-invocations]]), and the Orbh shard documents `--with` and `--no-behaviours` on the session verbs.

An invocation is a function call of a shard:

| Function call | Invocation |
|---------------|------------|
| The arguments | The **inputs** (`inputs`) |
| The precondition | The **ready** condition of each artifact input (`ready`, 0.3) |
| The body | The **steps** (`steps`), in order |
| The return value | The **outputs** (`outputs`) |
| The caller | The **parent** invocation |
| The next call | The **then** workflows (`then`, 0.3) |

There are two axes:

- **The stack.** The open workflow invocations of one Orbh session are a **stack**. Each open workflow invocation is a **frame**. A parent calls a child, and the child returns. After each write, the CLI prints a **hint** for the frame: `now:`, `read:`, `next:`, and `part of:`. The Page of the session shows the stack, and the Orbh delivery sends that Page after a compaction. So the invocation file is also what keeps an agent with no memory on the correct step.
- **The sequence over time.** One invocation leaves an artifact in a state. That state makes the artifact ready for the next workflow, maybe in another session, days later. The artifact carries the link between the invocations: `ready`, `then`, `done-when`, `continues`, and the assumed states.

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

- To a skill. An invocation file belongs only to a workflow (`wkfl-`).
- To a short workflow with no inputs, no steps that need a record, and no reactions. `flint shard invoke <ref>` with no workflow, and `flint shard start <ref>`, already record a load of the shard.
- To move a judgment into a script. A behaviour is deterministic. Use `run` only for an edit that a script can do with no judgment (a status change, a log line, a pin).
- To prove that a person agreed. `"by": "person"` marks a behaviour, but the CLI does not check the actor.

The invocation file does not replace the Markdown workflow. The Markdown keeps the stages and the judgment. The workflow must also work with no invocation: then the agent does the edits of each stage by hand.

## When to Add Each Field of 0.3

Format 0.3 adds fields for the sequence over time and for the modes. Add a field only when the workflow has the need in the left column.

| The workflow | Add | Example |
|--------------|-----|---------|
| Must not start on an artifact in some states | `ready` on the artifact input | `do_task` refuses a task that is `done` |
| Has a known way out of each state that fails `ready` | `make-ready` on the same input | `review_task` gives `do_task` for a task that is `in-progress` |
| Leaves an artifact in a state that the frontmatter cannot show | `assumes` on the output (or the input) | `scope_task` assumes `scoped`: a scoped task and a stub are both `todo` |
| Is usually followed by another workflow on the same artifact | `then` | `scope_task` then `do_task` |
| Can start in the middle when the state proves that the first steps are done | `done-when` on the leading steps | `do_task` on a task in `review` starts at the step `review` |
| Has a step that only a person can do (a confirm) | `modes: ["interactive"]` on that step | the step `close` of `do_task` |
| Has a step whose hint differs between the two modes | `next` as an object | the step `review` of `do_task` |
| Has a reaction or a next workflow for one mode only | the key `session.mode` in `when` | `then: review_task` of `do_task`, headless only |

Do not add `ready` to repeat the type check: a 0.3 file checks `type` already. Do not add `assumes` for a state that the frontmatter already shows: use `ready` on the frontmatter field.

## The Name and the Place

The invocation file is beside the Markdown workflow, with the same stem and the suffix `.invocation.json`.

| In the source | In the build |
|---------------|--------------|
| `workflows/dev-wkfl-<sh>-<name>.invocation.json` | `workflows/wkfl-<sh>-<name>.invocation.json` |

- The build strips the `dev-` prefix, as for every source file ([[dev-knw-knap-architecture]] § Dev Prefix Rules).
- `workflow` in the file is the stem with no `dev-` prefix, for example `wkfl-proj-do_task`. It must equal the stem of the file name.
- The reader hashes the Markdown workflow beside the file (`dev-wkfl-<sh>-<name>.md` in the source). The hint line `read:` names that file. With no Markdown file, the hint has no `read:` line.
- One file serves both modes. The mode comes from the Orbh session ([Modes](#modes)).
- An invocation opened with `--dev` reads the file of the source. An invocation opened with no `--dev` reads the file of the build.
- `flint shard start <ref>` lists each workflow with an invocation file under `## Invocations`, with its command, for example `- wkfl-proj-do_task — flint shard invoke proj do_task`.
- `shard.yaml` declares nothing. Discovery is by the file name.

**Deprecated: the headless invocation file.** A source can still have `workflows/dev-hwkfl-<sh>-<name>.invocation.json` of the old headless workflow. Until the removal wave of NUU Orbh Task 748, `invoke --mode headless` reads the `hwkfl-` file first, with a notice, and the health check gives a warning (`deprecated: merge into …`). After the removal wave, the file is a problem. Merge it into the `wkfl-` file with [[dev-wkfl-knap-migrate_headless_to_modes]].

## The Formats

| Format | From | What it accepts |
|--------|------|-----------------|
| `shard-invocation/0.1` | NUU Orbh Task 743 | `format`, `workflow`, `title`, `inputs`, `steps` (`id`, `title`, `by`, `evidence`), `enforced`, `behaviours` on the places `invocation.open`, `session.close`, and `session.return` |
| `shard-invocation/0.2` | NUU Orbh Task 744 | All of 0.1, and `outputs`, the step fields `stage`, `next`, `calls`, and `repeat`, and the place `step.done:<step>` |
| `shard-invocation/0.3` | NUU Orbh Task 748 | All of 0.2, and the input fields `ready`, `make-ready`, and `assumes`, the output field `assumes`, the file field `then`, the step fields `done-when` and `modes`, `next` as an object for each mode, the operator `not`, and the reserved condition keys `assumed` and `session.mode` |

Use `shard-invocation/0.3` for a new file. A 0.3 file also turns on the checks of each artifact input at the open ([Readiness](#readiness)). A 0.1 and a 0.2 file keep their behaviour: no readiness check, no state entry, no next workflow.

A field of a later format in an earlier file is a problem that names the format, for example: `The field "stage" needs format 0.2: set "format" to "shard-invocation/0.2".` The file, each input, each output, each step, each call, each `make-ready` way, each `assumes` entry, and each behaviour have a closed set of fields: an unknown field is a problem that lists the valid fields.

## The Fields

### The File

| Field | Format | Rule |
|-------|--------|------|
| `format` | 0.1 | Required. `"shard-invocation/0.1"`, `"shard-invocation/0.2"`, or `"shard-invocation/0.3"`. |
| `workflow` | 0.1 | Required. The stem with no `dev-` prefix. It matches `^h?wkfl-[a-z0-9][a-z0-9-]*-[a-z0-9][a-z0-9_-]*$` and equals the stem of the file name. The `hwkfl-` form is deprecated. |
| `title` | 0.1 | Optional string. The invoke shows it. With no title, the invoke uses `<shard name>: <short name>`. |
| `inputs` | 0.1 | Optional. An object from an input name to an input. |
| `steps` | 0.1 | Optional. A list of steps, in order. |
| `outputs` | 0.2 | Optional. An object from an output name to an output. |
| `enforced` | 0.1 | Optional, `true` or `false`. See [Enforced](#enforced). |
| `behaviours` | 0.1 | Optional. A list of behaviours, in file order. |
| `then` | 0.3 | Optional. 1 to 4 calls: the workflows that usually come next. See [Then](#then). |

### Inputs

The key is the input name. It matches `^[a-z][a-z0-9_]{0,31}$`.

| Field | Format | Rule |
|-------|--------|------|
| `kind` | 0.1 | Required. `"text"` or `"artifact"`. A `when` key can read a field of an artifact input only. |
| `type` | 0.1 | Optional string, for `artifact`: the Mesh type, for example `"Task"`. In a 0.1 or 0.2 file, it is information only. In a 0.3 file, `invoke` and `set-input` check it: the `(Type)` prefix of the file name must equal it (`input-wrong-type`). |
| `required` | 0.1 | Optional, `true` or `false`. |
| `description` | 0.1 | Optional string. Say what the value is, with an example. |
| `ready` | 0.3 | Optional, for `artifact`. A condition map on this artifact: the state that the workflow needs before it starts. See [Readiness](#readiness). |
| `make-ready` | 0.3 | Optional, for `artifact`, with `ready`. 1 to 4 ways to make the artifact ready. See [Make-Ready Ways](#make-ready-ways). |
| `assumes` | 0.3 | Optional, for `artifact`. 1 to 4 assumed states that a `done` close gives to this artifact. See [Assumed States](#assumed-states). |

The agent gives an input with `--input <name>=<value>`. An unknown name refuses (`input-unknown`), and a name given two times refuses (`input-repeated`). A missing required input does not refuse: the invoke prints `MISSING, required` and the command `flint shard invocations set-input <id> <name>='<…>'`. For an input that does not exist at the open (a task that Stage 1 creates), do not set `required`, and let its `description` tell the agent to set it later. `wkfl-proj-create_and_do_task` does this.

The value of an artifact input is a Mesh title (`(Task) 744 Name`), a wikilink (`[[(Task) 744 Name]]`), or a path under `Mesh/`. In a 0.3 file, each artifact input that has a value must name one Mesh file at the open and at `set-input`: no file refuses (`input-not-found`), and two files refuse (`input-ambiguous`). So an input that names an artifact that a later stage creates gets no value at the open.

The record keeps the identity of each artifact input: the Mesh `id` of the frontmatter, the title, and the path (`opened.artifacts`, and `artifact` on `input.set`). A rename of the file does not break the link, because the Mesh `id` stays.

### Outputs (0.2)

The key is the output name. It matches `^[a-z][a-z0-9_]{0,31}$`. The fields are the fields of an input: `kind` (required), `type`, `required`, and `description`. In 0.3, an artifact output can also have `assumes`.

- The agent or a script sets an output with `flint shard invocations set-output <id> <name>=<value>`. The name must be an output that the file declares. A second set of the same name replaces the value.
- An artifact output gets its identity in the record too (`artifact` on `output.set`). Set the output again after a rename of the file.
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
| `next` | 0.2 | Optional. A short hint for the actor: one line, with tokens. See [Tokens and Quoting](#tokens-and-quoting). In 0.3, `next` can also be an object with one text for each mode: `{ "interactive": "…", "headless": "…" }`. See [Modes](#modes). |
| `calls` | 0.2 | Optional. 1 to 4 child invocations that the step expects. See [Calls](#calls). |
| `repeat` | 0.2 | Optional, `true` or `false`. A loop with no fixed end, for example the conversation of a notepad. The step stays current until it is done, and the hint keeps each call. |
| `done-when` | 0.3 | Optional. A condition map that proves that the work of the step is done. At the open, the invoke settles each leading step whose `done-when` is true. See [The State Entry](#the-state-entry-done-when). |
| `modes` | 0.3 | Optional. A list of `"interactive"` and `"headless"` that is not empty. A step whose list does not have the mode of the invocation is settled as skipped at the open. See [Modes](#modes). |

Steps settle in order. The first step that is not done or skipped is the **current** step. `flint shard step done <id>` and `flint shard step skip <id> --reason '<why>'` act only on the current step: another step refuses (`step-out-of-order`). A skip runs no behaviour.

At the open, three things can settle steps before the agent starts, in this order: the copy of a continuation (`via: continued`), the state entry (`via: state`), and the mode (`via: mode`). The record keeps `via` on each `step.done` and `step.skipped` event, and the output of `invoke` names each step that they settled.

The `opened` event of the record holds a snapshot of the steps, the outputs, and `enforced`. A change of the file after the open does not change the steps of an open invocation. The behaviours are different: the runner reads the file again at each place.

### Calls

Each call is an object:

| Field | Rule |
|-------|------|
| `shard` | Required. The shard of the child, as `flint shard invoke` accepts it: a shorthand, an alias, or an id. The invoke records the shorthand of the installed shard. |
| `workflow` | Required. The short name of the workflow of the child, as `flint shard invoke <shard> <workflow>` accepts it, for example `"create"`. |
| `inputs` | Optional. An object from an input name of the child to a string with tokens. |

A call does not open the child. It makes the hint print the exact command, and the actor runs it. See [Nesting from the Side of the Author](#nesting-from-the-side-of-the-author).

### Then

`then` (0.3, on the file) names the workflows that usually come next on the same artifact. A `then` entry is a sequence, not a child: the next workflow opens after this one closes, maybe in another session. A `calls` entry is a child: it opens inside a step of this workflow.

Each entry is a call, with one more field:

| Field | Rule |
|-------|------|
| `shard` | Required. As in a call. |
| `workflow` | Required. As in a call. |
| `inputs` | Optional. An object from an input name of the next workflow to a string with tokens: `{{<input>}}`, `{{output.<name>}}`, `{{invocation}}`. |
| `when` | Optional. A condition map, as the `when` of a behaviour. When it is false, the close leaves this entry out. Use it for a next workflow of one mode only: `{ "session.mode": ["headless"] }`. |

When a frame closes `done`, the close checks the readiness of each entry against the artifact as it is now, and adds lines to the hint:

```
$ flint shard invocations close --outcome done
✓ proj scope_task · Invocation Readiness closed (done) · outputs: task = (Task) 750 Invocation Readiness
ready:   (Task) 750 Invocation Readiness is todo. It qualifies for proj do_task.
next:    flint shard invoke proj do_task --input task='(Task) 750 Invocation Readiness'
```

- A target that qualifies gets `ready:` (the verdict) and `next:` (the `invoke` command).
- A target that does not qualify gets `not ready:` with the reason and its `make-ready` ways.
- The `toward` target of the frame comes first ([Toward](#toward)), then each `then` entry in file order.
- A frame with an open parent prints `back in:` first, as before, and the next-workflow lines after it.
- A close with another outcome (`abandoned`, `session-closed`, `session-returned`) prints no next workflow.

### Make-Ready Ways

`make-ready` (0.3, on an artifact input with `ready`) lists 1 to 4 ways out of a state that fails `ready`. Each way is an object:

| Field | Rule |
|-------|------|
| `from` | Optional. A condition map like `ready`. The way applies only when `from` is true for the artifact. A way with no `from` always applies. |
| `invoke` | An action: a call (`shard`, `workflow`, `inputs`) of the workflow that moves the artifact toward `ready`. The refusal prints its command with `--toward '<shard> <workflow>'` of this workflow. |
| `run` | An action: the name of a script of the shard, as for a behaviour. The refusal prints the command. The actor runs it by hand; the CLI never runs it. |
| `say` | An action: a line for the actor, with tokens. |

A way has exactly one action of `invoke`, `run`, and `say`. See [Readiness](#readiness) for the refusal that prints them.

### Assumes

`assumes` (0.3, on an artifact input or an artifact output) lists 1 to 4 entries:

| Field | Rule |
|-------|------|
| `state` | Required. The name of the assumed state. It matches `^[a-z][a-z0-9-]{0,31}$`, for example `"scoped"`. |
| `while` | Optional. A condition map on the frontmatter fields of the artifact (keys as in `ready`). The state holds only while it is true. |

See [Assumed States](#assumed-states).

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
| `when` | Optional. A condition on the inputs, and in 0.3 on `session.mode`. See [Conditions](#conditions). |
| `run` | An action: the name of a script of the shard. See [Behaviour Scripts](#behaviour-scripts). |
| `say` | An action: a line for the actor. |
| `refuse` | An action: stop the verb with this reason. Only with `"phase": "before"`. |

A behaviour has exactly one action of `run`, `say`, and `refuse`.

**The places:**

| Place | It fires at | Phases | Notes |
|-------|-------------|--------|-------|
| `invocation.open` | `flint shard invoke <sh> <workflow>`, after the record is written | `after` only | A failure is a warning: the invoke does not refuse. To refuse an open, use `ready` (0.3): it runs before the record is written. |
| `session.close` | `flint orbh close` of the session | `before`, `after` | It reaches the open workflow invocations of the session, and the ones that `return --finish` closed, so a person can confirm the work of a headless agent after it finished. It also reaches a frame that the same session closed `done` in its latest run. |
| `session.return` | `flint orbh session return --finish` or `--await` | `before`, `after` | It reaches the open workflow invocations of the session. `disposition` selects `finish`, `await`, or both. |
| `step.done:<step>` | `flint shard step done <step>` (0.2) | `before`, `after` | `<step>` must be a step of the file. A `before` behaviour can refuse the step. No verb passes `--with` to a step: a behaviour on this place cannot be opt-in and cannot have a disposition. |

After the `after` phase of `flint orbh close` and of `return --finish`, Flint closes each open frame of the session, from the top of the stack down, with the outcome `session-closed` or `session-returned`.

**The phases:**

- A `before` behaviour runs before the verb writes its fact. A `refuse`, or a `run` script that fails, stops the verb, and no later behaviour runs. A record or an invocation file that cannot be read, or a `when` that cannot be evaluated, also stops the verb.
- An `after` behaviour runs after the fact is durable. It cannot undo the verb. A failure is a warning.

**The match.** A behaviour runs when all of these are true: `on` includes the place, `phase` is the phase of the run, `disposition` includes the disposition (for `session.return`), the verb names it with `--with` (for an opt-in behaviour), and `when` is true. The behaviours run in file order. An opt-in behaviour that the verb names, but whose `when` is false, prints one line that ends with `Nothing done.`

**`--with` and `--no-behaviours`.** `flint orbh close` and `flint orbh session return` accept `--with <id>` and `--with <id>=<value>` (repeatable). The value goes to the behaviour (`{{with}}`, `FLINT_BEHAVIOUR_VALUE`). A name that no open invocation of the session declares as an opt-in behaviour of the place refuses (`unknown-with`) and lists the valid names. A name given two times refuses (`duplicate-with`). `--no-behaviours` runs no behaviour, and the record keeps that choice.

### Conditions

A **condition map** is an object from a key to a condition. Each key must be true. One grammar serves `when`, `ready`, `make-ready[].from`, `assumes[].while`, `done-when`, and `then[].when`. The keys differ:

| Map | Keys |
|-----|------|
| `when` of a behaviour, `when` of a `then` entry | `<input>` (the value of an input), `<input>.<field>` (a frontmatter field of the Mesh file of an artifact input), and `session.mode` (0.3) |
| `ready`, `from` of a `make-ready` way | `<field>` (a frontmatter field of this artifact: `status`, not `task.status`), `assumed`, and `session.mode` |
| `while` of an `assumes` entry | `<field>` (a frontmatter field of this artifact) |
| `done-when` of a step | `<input>.<field>` and `<input>.assumed` |

| Condition | True when |
|-----------|-----------|
| A list of strings that is not empty, for example `["review", "reviewed"]` | The value equals one item. For a list field, one item of the field equals one item. |
| `"set"` | The value is present and not empty. |
| `"empty"` | The value is absent or empty. |
| `{ "not": ["done", "deprecated"] }` (0.3) | The value is present and equals no item. A missing value is false. |

**The reserved keys (0.3):**

| Key | Value | True when |
|-----|-------|-----------|
| `assumed` (in `ready` and `from`), `<input>.assumed` (in `done-when`) | A list of state names, for example `["scoped", "specified"]` | One of the states holds for the artifact now ([Assumed States](#assumed-states)). |
| `session.mode` | A list of modes, for example `["headless"]` | The mode of the invocation is in the list ([Modes](#modes)). |

A missing input, or a missing Mesh file, makes a condition false. Two Mesh files with the title, or a frontmatter that cannot be parsed, is an error: in the phase `before`, the verb stops. Each `<input>` key must name a declared input.

### Enforced

With `"enforced": true`, `flint orbh session return --finish` refuses (`enforced-steps-open`) while a step of an open invocation of the session is not done or skipped. A `repeat` step counts too. `--no-behaviours` passes the guard, and the record keeps that. The guard does not act on `return --await` or on `flint orbh close`. Use `enforced` only for a workflow whose turn must not finish with an open step.

## Readiness

**Ready** is a condition that a workflow declares on an artifact input. An artifact **qualifies** for the workflow when its state meets that condition. In a 0.3 file, `flint shard invoke` checks each artifact input that has a value, and `flint shard invocations set-input` checks the input that it sets. The check runs before any write.

The checks, in order:

1. The value names one Mesh file. Else: `input-not-found`, or `input-ambiguous` for two files. A file that cannot be read gives `input-unreadable`.
2. When the input declares `type`, the `(Type)` prefix of the file name equals it. Else: `input-wrong-type`.
3. Each key of `ready` is true. Else: `input-not-ready`.

**The verdicts.** The output of `invoke` prints the verdict of each artifact input:

| Verdict | When |
|---------|------|
| `ready` | Each key passes, with no `assumed` key, or the input has no `ready`. |
| `ready (assumed)` | Each key passes, and an `assumed` key passes through an assumed state that holds. The line names the source: `<title> is assumed <state> by <shard> <workflow> <inv-id>, while <guard>`. |
| `not ready` | A key fails. `invoke` refuses with `input-not-ready`. |

**The refusal.** `input-not-ready` writes nothing. The reason is one line: `<title> is <field> <value>. <shard> <workflow> needs: <the condition in words>.` Then come the ways:

```
$ flint shard invoke proj review_task --input task='(Task) 746 Parallel Auth Refresh'
✘ (Task) 746 Parallel Auth Refresh is in-progress. proj review_task needs: status review.
  Next: flint shard invoke proj do_task --input task='(Task) 746 Parallel Auth Refresh' --toward 'proj review_task'
  Or:   flint shard invoke proj review_task --input task='(Task) 746 Parallel Auth Refresh' --not-ready '<why>'
  Tell the person what (Task) 746 Parallel Auth Refresh needs, and ask before you make it ready.
```

- Each `make-ready` way whose `from` is true applies, in file order. An `invoke` way gives a command with `--toward '<shard> <workflow>'`. A `run` way gives the command of the script. A `say` way gives a line after the reason.
- The last command is always the override: the same invoke with `--not-ready '<why>'`. It opens the invocation anyway, and the record keeps the reason (`opened.readiness.override`). The agent passes it only when the person asks for it.
- The last line depends on the mode. Interactive: `Tell the person what <title> needs, and ask before you make it ready.` Headless: `Do not choose. Return this refusal as the blocker, or use flint orbh approval request.`

**For the author:**

- **Write the smallest condition that the first stage needs.** `ready` is the state that the workflow cannot start without. It is not the best state. Prefer `not` for "any state except these": `{ "status": { "not": ["done", "deprecated", "superseded"] } }`.
- **Give a way for each state that fails.** The `from` conditions of the ways must cover the states that fail `ready`. A state with no way gives a refusal with only the override.
- **Each way must lead to a ready state.** An `invoke` way names a workflow whose `done` close leaves the artifact in a state that `ready` accepts, in each mode. Check it: run the way, close it `done`, and read the next-workflow lines of the close. If the way can end in a state that fails `ready` again, the agent goes round in a circle. Example: `review_task` needs `review`. Its way is `do_task`, and an interactive `do_task` ends in `done`, not in `review`. So `do_task` reads `--toward 'proj review_task'`: it skips its confirm and closes after the step `review`.
- **Use `say` when no workflow makes the artifact ready.** A `done` task needs a new task (`sk-proj-supersede_task`), not a `do_task`.
- **The ways are hints.** The CLI never runs a way. The agent explains them to the person, and the person picks one (see the doctrine in [[knw-f-invocations]]).
- **Say the rule in the Markdown.** The `# Invocation` section names the ready condition, each way, and the rule for a refusal: do not edit the artifact to pass the check; in an interactive session, ask the person; in a headless session, return the refusal as the blocker (in a `> [!headless]` callout).

## Continuation

Four mechanisms connect the invocations on one artifact. Two are in the file (`then`, `done-when`), and two are in the record (`toward`, `continues`).

### Toward

`flint shard invoke <ref> <workflow> --toward '<shard> <workflow>'` opens a workflow that makes an artifact ready for another workflow. The record keeps the target (`opened.toward`). While the frame is open, the hint and the Page show a `toward:` line. When the frame closes `done`, the close checks the target first: when the artifact now qualifies, `next:` is the target command. Thus "make it ready, then continue" is one chain, and the agent does not need to remember the goal.

An `invoke` way of `make-ready` adds `--toward` for you. When a workflow behaves differently toward a target (as `do_task` toward `review_task`), say it in the `# Invocation` section and in the `next` of the step: the agent sees the `toward:` line and follows it.

### The State Entry (`done-when`)

A step can declare `done-when`: the state that proves that the work of the step is done. At the open, after the copy of a continuation, the invoke settles each **leading** step whose `done-when` is true: the current step, then the next one, until a step whose `done-when` is false or absent. The record writes `step.done` with `via: state` and the evidence `<input>.<field> = <value>`. Thus `do_task` on a task in `review` opens at the step `review`, also when a person did the work by hand and no record exists.

- **Name a state that only the finished work gives.** `task.status: ["review", "reviewing", "reviewed", "done"]` proves the work of `do_task`. `task.status: "set"` does not prove that a task was created: a stub has a status too. A step with no state that proves it gets no `done-when`. Its settle comes only from the agent or from a continuation.
- **Only leading steps.** A `done-when` on a step after a step with no `done-when` never acts. Put `done-when` on each step from the first, or accept that the entry stops there.
- **The entry does not do the work.** It skips the instruction of the step. Make sure that the Markdown stage of the step has nothing else that the later stages need.
- **The entry runs before the mode skips.** The mode settles its steps after the entry ([Modes](#modes)).

### Continues and the Copy

At the open, `invoke` finds the newest invocation of any session (open or closed) that took or made the same artifact (by its Mesh `id`). The record links to it: `opened.continues` with its id, its workflow, its outcome, the input of the link, and the copied steps.

- **The copy.** When that invocation is of the same workflow and its outcome is not `done` (for example `session-closed`), `invoke` copies its settled steps (in order, from the first) and its outputs into the new record (`via: continued`). Then the state entry runs from the first step that is still current.
- **`continue-open`.** When that invocation is still open in a live session, `invoke` refuses: close it, or use `--fresh`.
- **`--fresh`.** It copies no settled step or output from the earlier invocation. The state entry and the mode skips still apply. The link stays.
- `flint shard invocations --artifact '<artifact>'` lists the chain of an artifact, oldest first: for example `scope_task` (session A), `do_task` (session B), `review_task` (session C).

For the author: a copied step is a step that an earlier session did. Write each stage so that a later session can continue after it: the work of a settled stage is in the artifact or in the outputs, not in the context of the earlier session.

### Then

See [Then](#then) under The Fields. Declare `then` for the usual path. For the other paths, `flint shard ready '<artifact>'` lists each workflow of the installed shards that takes the artifact, with its verdict and its start step after the state entry.

## Assumed States

An **assumed state** is a state that the record gives, not the frontmatter. The frontmatter cannot say everything: a task in `todo` can be a stub, or a task that `scope_task` researched and specified. The status is the same, but only the second task is ready for work. The `done` close of `scope_task` knows this, so the record keeps it.

**The producer declares it.** An artifact output (or input) gets `assumes`:

```json
"outputs": {
  "task": {
    "kind": "artifact", "type": "Task", "required": true,
    "assumes": [ { "state": "scoped", "while": { "status": ["todo"] } } ]
  }
}
```

At a `done` close, the record writes one `assumed` event for each entry whose artifact has a value: the artifact (with its Mesh `id`), the state, and the guard `while`. A close with another outcome writes none. So the Markdown must tell the agent to close the invocation `done` at the end of the workflow, before a session close or a return.

**It holds until otherwise.** An assumed state holds while all of these are true:

- The guard `while` is true on the frontmatter now. When `task-open` sets the task to `in-progress`, `scoped` stops by itself.
- No later `assumed` event for the same artifact and state replaces it.
- No later `assumption.withdrawn` event withdraws it.

**Consumers read it.** A `ready` condition (or a `from`) names assumed states with the key `assumed`: `"ready": { "status": ["todo"], "assumed": ["scoped", "specified"] }`. A `done-when` uses `<input>.assumed`. The verdict is then `ready (assumed)`, with the source.

**By hand.** `flint shard assumed '<artifact>'` lists the states and why each one holds or not. A person can set a state that no workflow gave: `flint shard assumed set '<artifact>' <state> --reason '<why>'`. `flint shard assumed withdraw '<artifact>' <state> --reason '<why>'` withdraws one. Each writes an `assumption` record.

For the author:

- **Give each state a `while`.** With no guard, the state holds until a later event replaces or withdraws it, also after the artifact moved on.
- **Name the state as an adjective of the artifact:** `scoped`, `specified`, `verified`. Use one name for one meaning in all your shards.
- **Do not require an assumed state that old artifacts never have**, unless you give a way. `do_task` does not require `scoped`, so the old tasks keep working; its hints name the state when it holds. When a workflow needs the state, add a `make-ready` way: the workflow that gives it, or a `say` way with `flint shard assumed set`.

## Modes

One workflow file serves two **modes**: `interactive` and `headless`. The mode of an invocation comes from the Orbh session of `ORBH_SESSION_ID`: an `interactive` session gives `interactive`; a `headless`, `subagent`, or `ping` session gives `headless`. With no session, the mode is `interactive`. `flint shard invoke --mode interactive|headless` sets it, for a test. The record keeps it in `opened.mode`, and a child command names the mode only when the mode of its frame differs from the mode of the session.

**In the Markdown.** A stage that differs in the headless mode has a `> [!headless]` callout in that stage. See [[dev-knw-knap-architecture]] § Modes: One Workflow for Each Mode.

**In the invocation file:**

- **`modes` on a step.** A step that only a person can do (a confirm) gets `"modes": ["interactive"]`. In the headless mode, the invoke settles it as skipped at the open (`via: mode`), and `flint shard step` shows the skip. A step for the headless mode only gets `"modes": ["headless"]`.
- **`next` as an object.** A step whose hint differs gets `{ "interactive": "<text>", "headless": "<text>" }`. The hint prints the text of the mode of the frame. Give both texts: a mode with no text prints no instruction for the step. The headless text says what replaces the person gate, and how the turn ends.
- **`session.mode` in conditions.** A behaviour, a `then` entry, `ready`, or a `from` can read it. `do_task` has `then: review_task` with `"when": { "session.mode": ["headless"] }`: a headless session hands the task to a reviewer, and an interactive session keeps the confirm of the person.
- **Close `done` before the return.** A headless session that must print a next workflow closes its frame with `--outcome done` before `flint orbh session return`. A return closes an open frame with `session-returned`, and that outcome prints no next workflow and writes no assumed state.

**Deprecated: `--headless`.** Until the removal wave of NUU Orbh Task 748, `invoke --headless` is an alias of `--mode headless`, with a notice. While a source still has an `hwkfl-` file, `--mode headless` reads it first, with a notice. After the removal wave, `--headless` is removed. Do not write `--headless` in a workflow or in a `next` text.

## Tokens and Quoting

| Text | Tokens |
|------|--------|
| `next` of a step (the string, or each text of the object) | `{{<input>}}`, `{{output.<name>}}`, `{{invocation}}` (the id of the invocation) |
| `inputs` of a call and of a `then` entry | `{{<input>}}`, `{{output.<name>}}`, `{{invocation}}` |
| `inputs` of an `invoke` way, `say` of a way | `{{<input>}}` |
| `say` and `refuse` of a behaviour | `{{<input>}}`, `{{invocation}}`, `{{with}}` (the value of `--with <id>=<value>`, or empty) |

An unknown token stays as it is written.

**`next`.** The hint renders `next` as one line. It puts the value of each token in POSIX single quotes itself, so the shell expands nothing in a value. The rules apply to each text of a `next` object too. Thus:

- Write each token outside quotes: `set-input {{invocation}} task={{task}}`, not `task="{{task}}"` and not `task='{{task}}'`.
- The validator refuses a token inside `'…'`, `"…"`, or `$'…'`. An apostrophe before a token opens a quote too: `the person's {{note}}` is refused. Write `the note {{note}} of the person`.
- The validator refuses each token of a text that has `$(`, `${`, or a backquote at any place.
- A quoted placeholder with no token is correct: `--reason '<why>'`, `report='(Report) NNN Title'`.

For example, the `next` text `Implement {{task}}: tick each checkbox.` prints `Implement '(Task) 744 Name': tick each checkbox.`

When a `next` text runs `set-output <id> <name>=…`, and each output that it names is set already, the hint leaves the text out. So a `next` text can ask for an output, and the hint stops when the output is set.

**`inputs` of a call, a `then` entry, and an `invoke` way.** The value goes in raw, and the hint puts the whole argument in single quotes. Do not add quotes: write `"source": "{{task}}"`. A quote in the value becomes a character of the input of the child.

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

**A run by hand.** A person or an agent can also run the script with `flint shard <sh> <script>`. Then the `FLINT_INVOCATION_*` variables are absent. Accept an argument for that case: the Projects scripts take the task title as the first argument. A `run` way of `make-ready` is always a run by hand.

## Nesting from the Side of the Author

**The parent.** `flint shard invoke` chooses the parent of a new workflow invocation in this order: `--root` (no parent), `--parent <id>`, the top of the stack of the session, then the launch record of a child session (`FLINT_PARENT_INVOCATION`). A load has no parent. The depth cap is 8, so a chain has at most 9 frames. The author declares no parent: the stack gives it.

**`calls`.** A call makes the hint of its step print the exact command of the child:

```
next:    flint shard invoke rpt create --input source='(Task) 001 Demo Work'
```

- The child takes the mode of the session. The command adds `--mode <mode>` only when the mode of the frame differs from the mode of the session (for example, a frame that a test opened with `--mode headless` in an interactive session).
- A frame that is not the top of the stack, or that has no session, adds `--parent <id>`. Its step commands get `--invocation <id>`.
- The hint leaves out a call when a child of the step covers it: the same shard, the same workflow, and the same rendered inputs. A `repeat` step keeps each call.
- The validator does not check that the shard or the workflow of a call exists. A Flint with no such shard refuses the command of the child. Say in the Markdown what the agent does then (for example, skip the step with a reason).
- In a 0.3 child, the readiness check runs on the inputs of the call too. A call whose child refuses stops the step. Make sure that the artifact is ready for the child at that step.

**The return.** When the child closes, the parent record gets `child.closed` with the outcome and the outputs of the child. The hint goes back to the parent (`back in:`). The outputs of the child do not set the outputs of the parent: the agent of the parent sets them.

**The close rules.**

- `flint shard invocations close <id> --outcome done` refuses while a step is not done or skipped (`steps-open`), or while a required output is not set (`outputs-missing`). `--outcome abandoned` closes with open steps.
- A parent cannot close while a child is open (`children-open`). The refusal lists the children. `--abandon-children '<why>'` closes each open child first, with the outcome `abandoned`.
- A close of the session closes its frames from the top down. A child in another session stays open, with a warning.

## The Markdown Workflow

- Write each `stage` as the exact heading text: `## Stage 2: Report` gives `"stage": "Stage 2: Report"`, and `## 3. Report` gives `"stage": "3. Report"`. A heading inside a callout (`> ## …`) is not a stage heading.
- Add a section `# Invocation` after the title. Say how to start the workflow (`flint shard invoke <sh> <name> --input <name>="<value>"`), which behaviours do which edits, the step ids, how to set each output, and that outside an Orbh session the agent gives `--invocation <id>` to `flint shard step`. End with: when no invocation is open, follow the stages with no record. The released Notepad, Projects, and Reports workflows have this section.
- For a 0.3 file, the `# Invocation` section also names: the ready condition and each way; the rule for a refusal (do not edit the artifact to pass the check; ask the person in an interactive session; return the refusal as the blocker in a headless session); the steps that the state entry can settle; what a continuation copies; the next workflow and `--toward`; and when to close `done`. `wkfl-proj-do_task` and `wkfl-proj-scope_task` of Projects are the models.
- Put the differences of the headless mode in `> [!headless]` callouts inside the stages ([[dev-knw-knap-architecture]] § Modes: One Workflow for Each Mode). A callout in `# Invocation` holds the headless rules of the invocation, for example "return the refusal as the blocker".
- Keep the stages complete. The invocation file adds a record; it does not remove a stage.

## Complete Example

This is `workflows/dev-wkfl-proj-do_task.invocation.json` of the Projects source (NUU Orbh Task 748). It has an artifact input with `ready` and three `make-ready` ways, an optional output, a `then` entry for the headless mode, four steps with stages, `done-when` on three leading steps, a step for the interactive mode only, `next` objects, a call to the Reports shard, and five behaviours.

```json
{
  "format": "shard-invocation/0.3",
  "workflow": "wkfl-proj-do_task",
  "title": "Do Task",
  "inputs": {
    "task": {
      "kind": "artifact",
      "type": "Task",
      "required": true,
      "description": "The title of the task, for example \"(Task) 743 Shard Invocations\".",
      "ready": {
        "status": { "not": ["done", "deprecated", "superseded", "reviewing"] }
      },
      "make-ready": [
        {
          "from": { "status": ["done"] },
          "say": "{{task}} is done. For more work, make a new task that continues it with sk-proj-supersede_task."
        },
        {
          "from": { "status": ["reviewing"] },
          "say": "{{task}} is reviewing: a review runs now. Wait for it to end, or ask the person."
        },
        {
          "from": { "status": ["deprecated", "superseded"] },
          "say": "{{task}} is closed. Work on the task in its superseded-by field, or make a new task."
        }
      ]
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
  "then": [
    {
      "shard": "proj",
      "workflow": "review_task",
      "inputs": { "task": "{{task}}" },
      "when": { "session.mode": ["headless"] }
    }
  ],
  "steps": [
    {
      "id": "work",
      "title": "Task Work",
      "by": "agent",
      "evidence": "required",
      "stage": "Stage 1: Task Work",
      "done-when": { "task.status": ["review", "reviewing", "reviewed", "done"] },
      "next": {
        "interactive": "Implement {{task}}: tick each checkbox, write the Task Log, and commit the WIP of each repo in git-repos.",
        "headless": "Read {{task}} fully and implement it: tick each checkbox, write the Task Log, commit the WIP of each repo in git-repos, and keep the phase and the progress of the session current. When blocked, use a deferred request."
      }
    },
    {
      "id": "report",
      "title": "Report",
      "by": "agent",
      "evidence": "optional",
      "stage": "Stage 2: Report",
      "done-when": { "task.status": ["review", "reviewing", "reviewed", "done"] },
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
      "done-when": { "task.status": ["reviewed", "done"] },
      "next": {
        "interactive": "Set {{task}} to review (never back from reviewing or reviewed), and give the person a summary. When the invocation goes toward proj review_task, do not ask for the confirm: mark this step done, and skip the step close. Else refine the task until the person confirms.",
        "headless": "Check each checkbox of {{task}}, set it to review (never back from reviewing or reviewed), and write the last Task Log line. Mark this step done, and close the invocation: flint shard invocations close {{invocation}} --outcome done. Put the review_task command of the close in the result, and return with flint orbh session return --finish. Never pass --with task-confirm."
      }
    },
    {
      "id": "close",
      "title": "Close",
      "by": "agent",
      "evidence": "required",
      "stage": "Stage 4: Close",
      "modes": ["interactive"],
      "next": "When the invocation goes toward proj review_task, skip this step: flint shard step skip close --invocation {{invocation}} --reason 'toward review_task'. Then close the invocation: flint shard invocations close {{invocation}} --outcome done. The close prints the review_task command. Else, when the person confirms, run flint shard proj task-close {{task}}. When the session ends with the task, use flint orbh close --with task-confirm instead."
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
| `ready` of `task` | The invoke refuses a task that is `done`, `deprecated`, `superseded`, or `reviewing` (`input-not-ready`), before any write. Each other state qualifies. |
| `make-ready` of `task` | Three `say` ways, one for each failing state. No workflow makes a `done` task ready, so the way is a line, not an `invoke`. |
| `then` | A `done` close in the headless mode checks `review_task` on the task and prints its command. An interactive close prints no next workflow: the person confirms the task. |
| `done-when` of `work`, `report`, `review` | A task in `review` opens at `review`; a task in `reviewed` opens at `close`. A task in `todo` or `in-progress` settles nothing. |
| `modes` of `close` | In the headless mode, the invoke skips `close` at the open: only a person confirms a task. |
| `next` objects | The hint of `work` and `review` differs for each mode. The headless text of `review` closes the frame `done` before the return, so that `then` prints. |
| `task-open` | At the invoke, when the task is `todo`, the script sets `in-progress`, adds the session to `orbh-sessions`, and pins the task. |
| `task-confirm` | `flint orbh close --with task-confirm` (or `return --with task-confirm`) runs `task-close` before the verb, when the task is `review`, `reviewed`, or `done`. A failure stops the verb. |
| `task-defer` | `--with task-defer="<reason>"` runs `task-defer`; the script reads the reason from `FLINT_BEHAVIOUR_VALUE`. |
| `task-hint`, `task-return-check` | Lines for the actor before a close or a `return --finish`. |
| `calls` of `report` | The hint of the step prints the command of the report as a child of the task. |
| `{{invocation}}` in `next` | The hint prints the id of this invocation in each command. |

The other Projects files give the other fields. `scope_task` and `create_task` have the output `task` with `assumes` (`scoped` and `specified`, each `while` the status is `todo`) and `then: do_task` with `"task": "{{output.task}}"`. `review_task` has `ready: { "status": ["review"] }` and an `invoke` way:

```json
"make-ready": [
  {
    "from": { "status": ["todo", "in-progress", "blocked", "deferred"] },
    "invoke": { "shard": "proj", "workflow": "do_task", "inputs": { "task": "{{task}}" } }
  },
  {
    "from": { "status": ["reviewing"] },
    "say": "{{task}} is reviewing: another review runs now. Wait until it ends. When that review stopped, open this review with the --not-ready command, and say why."
  }
]
```

The invoke on a task in `review`, in a scratch Flint with no Orbh session (so each command names the frame):

```
$ flint shard invoke proj do_task --input task="(Task) 001 Demo Work"
…
  settled by the state: work, report (task.status = review)
…
now:     step 3/4 review
read:    Stage 3: Task Review of Shards/Projects/workflows/wkfl-proj-do_task.md
next:    Set '(Task) 001 Demo Work' to review (never back from reviewing or reviewed), and give the person a summary. …
         flint shard step done review --evidence '<…>' --invocation inv-9d4527f6aa03
```

In an Orbh session, at the top of the stack, the commands have no `--parent` and no `--invocation`.

## Check a File

1. `flint shard knap check-modes <source folder>` checks the files of the source with no build: each invocation file parses as JSON, each `stage` is a heading of its Markdown workflow, no token stands inside quotes, and no `hwkfl-`, `hinit-`, `hstart`, or `--headless` reference stays.
2. `flint shard build <alias>`, then `flint shard status <alias> --health`. The health check reads the build, and it gives one warning for each invocation file that is not valid, with up to five problems. Each problem has a JSON path, for example `$.inputs.task['make-ready'][0]`. An `hwkfl-` or `hinit-` file gives a `deprecated` warning.
3. `flint shard invoke <sh> <name> --dev` refuses a file that is not valid (`invocation-file-invalid`) and lists each problem. `--json` gives the full list in `reason`.
4. `flint shard start-dev <alias>` lists the file under `## Invocations`.
5. Run the workflow in a scratch Flint, one time in each mode (`--mode interactive`, `--mode headless`): `flint shard invoke`, `flint shard step done` for each step, `flint shard invocations set-output`, and `flint shard invocations close <id> --outcome done`. Read each hint, the steps that the mode skipped, and the next-workflow lines of the close.
6. For `ready`: invoke on an artifact in each state that fails, and read the refusal and its ways. Run each `invoke` way, close it `done`, and check that the close prints the target as `ready:`. `flint shard ready '<artifact>'` shows the verdict of each workflow without an invoke.
7. For `assumes`: close `done`, then run `flint shard assumed '<artifact>'`. Change the frontmatter so that `while` is false, and run it again.

## Common Mistakes

| Mistake | What happens | Fix |
|---------|--------------|-----|
| A `stage` that is not the exact heading | No check of the CLI finds it (`check-modes` does). The hint says `read: <stage>`, and the agent cannot find that heading after a compaction. | Copy the heading text with no `#` marks. Check it again when you rename a stage. |
| A token in quotes in `next`: `task="{{task}}"`, `'{{task}}'` | A problem: `The token {{task}} stands inside double quotes. …` | Write the token outside quotes: `task={{task}}`. |
| An apostrophe before a token: `the person's {{note}}` | A problem: the apostrophe opens a quote. | Change the words: `the note {{note}} of the person`. |
| `$(`, `${`, or a backquote in a `next` with a token | A problem for each token. | Remove the substitution. |
| Quotes in the `inputs` of a call: `"'{{task}}'"` | No problem, but the quotes become a part of the input of the child. | Write `"{{task}}"`. |
| `"opt-in": true` on `step.done:<step>` | A problem: no verb passes `--with` to a step. | Remove `opt-in`, or put the behaviour on a place of the session. |
| A field of a later format in an earlier file (`stage` in 0.1, `ready` in 0.2) | A problem that names the format. | Set `"format"` to the format that the problem names. |
| `workflow` with the `dev-` prefix, or another stem than the file name | A problem. | Write the stem of the build: `wkfl-<sh>-<name>`. |
| `refuse` with no `"phase": "before"` | A problem. | Add `"phase": "before"`. |
| `"phase": "before"` on `invocation.open` | A problem. | Remove the phase. To refuse an open, use `ready`. |
| `disposition` on a place that is not `session.return` | A problem. | Put the behaviour on `session.return`, or remove `disposition`. |
| `run` with a path: `"scripts/task-open.js"` | A problem. | Write the command name: `"task-open"`. |
| `when` with a field of a text input: `note.status` | A problem. | Make the input an artifact input, or use the key `note`. |
| Two actions, or no action (a behaviour or a `make-ready` way) | A problem. | Keep exactly one action. |
| A script that is not safe to run two times | A run that failed runs again at the next try, and the edit is made two times. | Make a second run change nothing. |
| A file that is not valid while a session has the invocation open | Each `before` phase of `close` and `return` of that session stops (`behaviour-failed`). | Fix the file, and build the shard again. |
| An edit of the file in the build | The next build or install overwrites it. | Edit the source, then `flint shard build <alias>`. |
| `ready` with an input key: `{ "task.status": ["review"] }` | A problem: the keys of `ready` are frontmatter fields of this artifact. | Write `{ "status": ["review"] }`. |
| `done-when` with a frontmatter key: `{ "status": ["review"] }` | A problem: the keys of `done-when` are `<input>.<field>`. | Write `{ "task.status": ["review"] }`. |
| A `done-when` that a stub meets: `{ "task.status": "set" }` on the step `create` | The state entry settles the step for a stub or a half-made artifact, and the agent skips the work. | Name a state that only the finished work gives. When no state proves the step, give it no `done-when`: a continuation copies it. |
| A `done-when` on a step after a step with no `done-when` | It never acts: the state entry settles only leading steps. | Put `done-when` on each step from the first, or remove it. |
| A `make-ready` way that cannot lead to a ready state | The agent runs the way, and the artifact still does not qualify, or it moves past the ready state (an interactive `do_task` ends in `done`, and `review_task` needs `review`). | Make the target stop in a ready state when it runs with `--toward`. Run the way one time, and read the close. |
| A failing state with no way | The refusal gives only the override (`--not-ready`). | Add a way whose `from` covers the state: an `invoke` of the workflow that moves the artifact, or a `say`. |
| An artifact input with a value at the open, for an artifact that a later stage creates | A 0.3 file refuses: `input-not-found`. | Give no value at the open. Tell the agent to run `set-input` after the stage that creates it. |
| An `assumes` with no `while` | The state holds after the artifact moved on, until a later event replaces or withdraws it. | Add a `while` guard on the frontmatter. |
| A workflow with `assumes` that the agent does not close `done` | A return or a session close closes it with another outcome, and no assumed state is written. | Tell the agent, in the last stage, to close the invocation with `--outcome done`. |
| A `ready` that requires an assumed state that old artifacts never have | Each old artifact refuses. | Do not require it, or add a way that gives it. |
| `modes: []`, or a mode that is not `interactive` or `headless` (`"subagent"`) | A problem. | A subagent session runs in the `headless` mode: write `["headless"]`. |
| A `next` object with one mode only | The other mode prints no instruction for the step. | Give both texts. |
| `--headless` or `hstart` in a `next` text or in the Markdown | Deprecated now, removed after the removal wave. The mode comes from the session. | Remove the flag. Use `flint shard start <sh>`. |
| The headless instructions in one `# Headless` section at the end of the workflow | After a compaction, the agent reads only the stage that `read:` names, and it does not see them. | Put a `> [!headless]` callout in each stage that differs. |
