---
description: "Complete reference for the author of a Flint module — the package and its files, module.yaml, the process contract (plan, apply, command, live) with its JSON, the log lines and how sync shows them, desired objects and the owner rule, settings, env files and secrets, live modules, both SDKs, build, install, and release"
---

# Knowledge: Module Authoring

A **module** is a package of the kind `module`. A shard serves agents; a module serves the machine. Module code runs as a process (Node.js, Python, or any executable). This file is the contract for the author of a module: what Flint gives the process, what the process must answer, and the rules that keep a module safe. The commands of `flint module` and the rules for a person who installs a module are in [[knw-f-cli]] § Modules. To write a module, follow [[dev-wkfl-knap-knap_module]].

## Shard or Module

| | Shard | Module |
|---|---|---|
| Serves | Agents: init, skills, workflows, templates, knowledge, types | The machine: code that Flint runs |
| Read or run by | An agent that loads it | `flint sync`, `flint module <name> <command>`, the Flint server |
| Effect | What an agent knows and can do | Objects of this machine (cron schedules, stations), files of its data folder, a live process |
| Folder | `Shards/` | `Modules/` |
| Manifest | `shard.yaml` | `module.yaml` |
| Address | `@<org>/shard/<slug>` | `@<org>/module/<slug>` |

The split is by function. A shard can hold scripts that an agent runs (`flint shard <sh> <script>`). Code that must run with no agent (a reconcile at sync, a schedule, a long-running service) is a module. Both kinds use one package core: the spec `@org/name[@range][#place]`, the walk, the lock, Git sources, and the NUU Shard Registry.

## The Files

| Path | Git | Holds |
|------|-----|-------|
| `[modules]` of `flint.toml` | Tracked | One record for each module: `<name> = "<spec>"`, or `<name> = { source = "<spec>", git?, from = "source"?, use? }` |
| `flint.json#modules` | Tracked | The lock: the address, the version, the state, and the hash of each build |
| `Modules/(Source Local) <Name>/` | Tracked | A local source |
| `Modules/(Source Remote) <Name>/` | Ignored | A remote source (a clone of a repository) |
| `Modules/<Name>/` | Tracked | The build: `module.yaml` and the runnable files. Never edit it |
| `Modules/<Name>.settings.toml` | Tracked | The settings of the module in this Flint. The Flint owns it |
| `.flint/modules/<name>/` | Ignored | The data folder of the module on this machine |
| `flint.env`, `flint.env.local` | Ignored | The env values of the Flint and of this machine |
| `flint.env.example` | Tracked | The names of the env values, with no values |
| `.flint/run/modules/<name>.log` | Ignored | The output of a live process |

The **record name** is the key in `[modules]`. It is the first word of `flint module <name> <command>`, the name of the data folder, and `FLINT_MODULE_NAME`. It is kebab-case, and its default is the slug of the module name. A reserved verb of `flint module` cannot be a record name: `list`, `status`, `install`, `uninstall`, `build`, `update`, `release`, `start`, `stop`, `restart`, `control`, `settings`, `help`.

A source module has no `dev-` prefix on its files: the build copies the source folder as it is (with no `node_modules`).

## The Manifest (`module.yaml`)

```yaml
module-spec: "0.1.0"
module: "@nuucognition/dms"        # The package name @<org>/<slug>, or "@/<slug>" with no org. Always quoted
id: 6bf9b13c-f683-4da6-8699-ee3297b24bf0   # A uuid v4 or v7. Never change it
name: DMs                           # The Display Name law; the slug of the name is the slug of `module`
version: 0.1.0                      # semver
description: Direct messages to this Flint, served by the station dm
flint: "^0.7"                       # Optional: the Flint versions that the module supports. Install checks it
runtime: node                       # node | python | command
entry: dist/index.js                # A relative path inside the build, with no ".." segment
kind: sync                          # sync (default) | live. A live module also has the verbs of a sync module
commands:                           # Optional: the commands of `flint module <name> <command>`
  - name: send                      # A kebab word, unique in the list
    description: Send one DM to a Flint of this machine
secrets: [DISCORD_TOKEN]            # Optional: env names (A-Z, 0-9, _). A name that starts with FLINT_ is refused
settings:                           # Optional: the keys of the settings file. Each key has a type
  target: { type: string, description: The target of the serving session }
build: "node build.mjs"             # Optional: a command line, run in the source folder before the copy
dependencies: {}                    # Optional: Flint 0.7.0 reads it and installs nothing for it
```

| Rule | Detail |
|------|--------|
| Required | `module-spec`, `module`, `id`, `name`, `version`, `runtime`, `entry` |
| `module-spec` | `"0.1.0"` is the only spec |
| `module` | The slug MUST be the slug of `name` (`Hello TS` gives `hello-ts`). A mismatch is a manifest error |
| `id` | Make it once with a uuid v4. It is the identity of the module in every lock and in the registry |
| `commands` | Only a listed command runs. Flint refuses another name before the process starts |
| `settings` | The type is a text for people and agents (`string`, `boolean`, `table`). Flint does not check the values |
| Unknown keys | Stay in the manifest, and are not an error |

Use [[dev-tmp-knap-module_yaml-v0.1]] to write it.

## The Process Contract

Flint runs the entry with one verb, in the Flint root:

| Runtime | Command line |
|---------|--------------|
| `node` | `node <entry> <verb> [args...]` |
| `python` | `python3 <entry> <verb> [args...]` (Python 3.9 or later) |
| `command` | `<entry> <verb> [args...]` (an executable) |

The verbs are `plan`, `apply`, `command`, and `live`. Each SDK reads the verb and calls your handler; do not parse the verbs yourself.

### The Environment

Every module process gets the environment of the caller, with no value of the Flint server and of another module, and these values:

| Name | Value |
|------|-------|
| `FLINT_MODULE_PROTOCOL` | `1` |
| `FLINT_ROOT`, `FLINT_ID`, `FLINT_NAME` | The Flint |
| `FLINT_MODULE_NAME` | The record name |
| `FLINT_MODULE_ID`, `FLINT_MODULE_VERSION` | The module |
| `FLINT_MODULE_DIR` | The build folder |
| `FLINT_MODULE_SETTINGS` | The path of the settings file |
| `FLINT_MODULE_SETTINGS_JSON` | The settings file as JSON, or the text `null` (every verb; a module needs no TOML parser) |
| `FLINT_MODULE_DATA` | The data folder. Flint makes it, except in a dry run |
| `FLINT_MACHINE_SLUG`, `FLINT_MACHINE_ID` | This machine (empty when unknown) |
| `FLINT_CLI` | The absolute command of this Flint CLI |
| Every value of `flint.env` and `flint.env.local` | `flint.env.local` wins |
| `PYTHONPATH` | For a Python module: the folder of `flint_module.py` first |

The token of the Flint server never reaches a module. A process with `FLINT_MODULE_PROTOCOL` set runs no module process: a `flint sync` or a `flint module status` inside a module does not run a plan, so a module cannot recurse.

### `plan`

Sync, `flint module status`, `flint plan`, and `flint doctor` run `plan`. Stdin is one JSON object:

```json
{ "protocol": 1,
  "flint": { "root": "/path/to/Flint", "id": "591383f0-…", "name": "NUU Flint" },
  "machine": { "slug": "katana", "id": "…" },
  "module": { "name": "demo", "id": "…", "version": "0.1.0", "dir": "…/Modules/Demo",
              "data": "…/.flint/modules/demo", "settingsPath": "…/Modules/Demo.settings.toml" },
  "settings": { "greeting": "Hello" },
  "dryRun": false }
```

Stdout is one JSON object with the full envelope (the SDKs print it):

```json
{ "objects": { "cronSchedules": [], "stations": [] },
  "actions": [ { "id": "write-greeting", "kind": "create", "label": "write greeting.json", "detail": "Hello", "payload": { "greeting": "Hello" } } ],
  "issues": [ { "code": "demo-placeholder-key", "message": "DEMO_API_KEY has the placeholder value.", "next": "Set DEMO_API_KEY in flint.env.local." } ],
  "logs": [ { "message": "The greeting in the settings is Hello." }, { "message": "greeting.json is not current.", "level": "warn" } ] }
```

- `objects`: the desired objects. Flint applies them (see [Desired Objects](#desired-objects)).
- `actions`: the own actions of the module, each `{ id, kind, label, detail?, next?, payload? }`. The id is a non-empty text, unique in one plan, and it must not start with `flint:`. The label is a non-empty text; `detail` and `next` are texts. The kind is `create`, `update`, `pause`, `resume`, `remove`, or `report`. A repeated id, an empty label, or an unknown kind fails the whole plan.
- `issues`: each `{ code, message, next? }`. The sync report, `flint module status`, and `flint doctor` show them.
- `logs` (optional): the log lines of the plan, each `{ message, level? }`. See [Log Lines](#log-lines).

Rules of a plan:

- **A plan changes nothing.** It only says what it wants. Write files in `apply`, never in `plan`.
- **A plan is stable.** It gives the same answer when nothing changed, so a second sync has no change. Compare the wanted state with the state of the data folder, and give an action only when they differ.
- **A plan is fast.** The time limit is 30 seconds (`FLINT_MODULE_TIMEOUT_MS` sets a shorter limit in a test world).
- **A failure is safe.** A non-zero exit, the time limit, stdout that does not parse, or stdout with no full envelope is the issue `module-plan-failed`. Sync then does not reconcile the module, and it never reads the failure as a removal.
- **An issue does not stop the reconcile.** Flint applies the desired objects of a plan that has issues, and it pauses each managed object of the module that the plan does not list. So a plan that returns early with an issue pauses the objects that it did not list. When an input is not valid and the existing objects must stay as they are, fail the plan: raise an exception (Python) or throw (TypeScript). The SDK then exits non-zero, and the result is `module-plan-failed`, which pauses nothing.
- Stdout holds only the JSON. The SDKs move `print` and `console.log` of a plan to stderr, and Flint shows stderr only when the plan fails. For a line that a person sees at each sync, use the SDK tool `log` (see [Log Lines](#log-lines)).

### `apply`

For each own action that is not a `report`, a sync that is not a dry run runs `apply` once. Stdin is `{ "context": <the stdin of plan>, "action": <the action> }`. Stdout is `{ "ok": true, "detail": "…", "logs": [ … ] }` (`detail` and `logs` are optional). The time limit is 30 seconds. An SDK handler returns a detail text, `{ ok, detail }`, or nothing. Put the data that `apply` needs into `payload` of the action.

The sync report shows the detail after ` — ` on the change line of the action: `✓ (module) demo: Wrote greeting.json: Hello — wrote .flint/modules/demo/greeting.json`. Write the detail as a short result in lower case, for example the file that `apply` wrote.

### Log Lines

The stdout of `plan` and of `apply` may hold `logs`: a list of `{ message, level? }`. `message` is a text that is not empty. `level` is `info` (the default) or `warn`. Use a log line for information that a person reads at each sync: what the module saw, what it decided, or a small warning. The protocol stays `1`, and a module with no `logs` is valid. In the SDKs, call `m.log(message)` or `m.log(message, "warn")`.

| Rule | Detail |
|------|--------|
| A log is information | A log never fails a plan, never makes the module not current, and never changes `flint doctor`. When a person must act, give an issue, not a log |
| At most 50 lines | Flint shows the first 50 log lines of one process, and one line that says how many it did not show. The SDKs bound their logs before they print them: they drop each line that is not valid, keep the first valid lines, add one `warn` line for the valid lines that they did not send and one for the lines that they dropped (50 lines in all), and send at most 501 characters of a message, so a log never fills the stdout of a plan |
| At most 500 characters | Flint cuts a longer message and adds `… (cut after 500 characters)` |
| A bad entry is dropped | An entry with no message, an empty message, or another level is dropped. Flint shows one line that says how many it dropped |
| No secret | Never write a secret in a log line |

**How sync shows the lines of a module.** Each line of a module names the module first, in the form `(module) <name>: <message>`, where `<name>` is the record name in `[modules]`:

```
Changes
  ● (module) demo: Would write greeting.json: Hello                                      (flint sync --dry-run)
  ✓ (module) demo: Wrote greeting.json: Hello — wrote .flint/modules/demo/greeting.json  (flint sync)
  ✓ (module) demo: Created the station demo-desk: oneshot, target claude/o55h

Module logs
  · (module) demo: The greeting in the settings is Hello.
  ⚠ (module) demo: greeting.json is not current.

Not current
  ! (module) demo: DEMO_API_KEY has the placeholder value.
```

- `flint sync --dry-run` shows the logs of each `plan`. A real `flint sync` shows the logs of each `plan` and of each `apply`. The section `Module logs` comes after `Changes`: `·` marks an `info` line and `⚠` marks a `warn` line.
- `flint module status <name>` shows the lines of the plan with the same prefix, and the logs of the plan in the row `Logs` under the plan.
- `flint sync --json` carries each log in `moduleLogs` of the report: `{ module, source, action?, level, message, cut?, flint? }`. `source` is `plan` or `apply`, `action` is the action id of an `apply`, `cut: true` marks a cut message, and `flint: true` marks a line that Flint wrote about the logs. Each module change carries `module` (the record name) and, after a real apply, `detail` (the detail of `apply`). Each issue of a module carries `module`. `flint module status --json` carries the logs of the plan as `logs` of the plan of each module, in the same form.

### `command`

`flint module <name> <command> [args...]` runs `<entry> command <command> [args...]`. The process gets the terminal of the person (stdin, stdout, stderr), and its exit code is the exit code of `flint module`. A command can run any Flint command through `FLINT_CLI` (the SDK tool `flint(...)`; see [Run Flint from a Module](#run-flint-from-a-module)).

### `live`

A module with `kind: live` also runs `<entry> live` under the Flint server. See [Live Modules](#live-modules).

## Desired Objects

A module never writes an object of Orbh itself. Its plan returns desired objects, and Flint applies them:

| Object | Fields |
|--------|--------|
| Cron schedule | `{ key, expr, prompt, timezone?, description?, target?, misfire?, overlap?, machine? }` (`misfire`: `coalesce` or `skip`; `overlap`: `skip` or `allow`) |
| Station | `{ key, target?, mode?, prompt?, description? }` (`mode`: `oneshot` or `resident`) |

| Field | Rule |
|-------|------|
| `key` | Lower-case letters, digits, and hyphens; the first character is a letter or a digit (`^[a-z0-9][a-z0-9-]*$`) |
| `expr` | Exactly five fields: minute, hour, day of the month, month, day of the week. With `timezone`, an IANA name (`Australia/Sydney`); with none, the local time of the machine |
| `target` of a cron schedule | `<runtime>` or `<runtime>/<profile>` (`claude` or `claude/o55h`) |
| `target` of a station | `<runtime>/<profile>`: a station needs a profile |
| `machine` | Not empty when present |

An object with a key that is missing, empty, or not a text fails the whole plan (`module-plan-failed`): Flint applies none of its objects and actions. An object with a valid key that breaks another rule, or a key that the plan gives two times, is an issue of the plan: Flint keeps the existing object of that key as it is and applies the other objects.

- The key is the name of the object in the Orb store of the Flint (`.orb/`). Flint stamps each object with the managed marker `{ flintId, module: <record name>, key, declHash }` (a cron schedule also gets `machine`).
- Flint creates, updates, or resumes each desired object, and pauses each managed object of the module that the plan no longer desires. **Sync never deletes** an object of a module. After `flint module uninstall`, the next sync pauses each object of that module.
- A key that a local object (no marker), a deleted schedule, or an object of another module already uses is a report, never a take-over.
- A station with no `prompt` gets a generic duty, and with no `description` gets `The station <key> of the module <name>`. With no `target`, an object gets the Orbh default target of the machine.
- A cron schedule starts a headless agent session on its target at each fire. A station starts an agent session when an item is posted to it.

**The owner rule of a cron schedule.** `machine` is the owner machine: a machine slug or a machine id. Only the owner fires the schedule:

| `machine` | On the owner machine | On another machine |
|-----------|----------------------|--------------------|
| This machine | Sync creates the schedule, enabled. It fires | — |
| Another machine | — | Sync creates nothing, and pauses a schedule that exists |
| None | Sync creates nothing, and gives the report "choose the owner machine". No machine fires it | Same |

Every machine of the Flint runs `plan`. **Never** use the slug of the machine that runs the plan as the owner: then each machine fires the schedule. Take the owner from the settings file.

A slug owner is compared with the slug of each machine, and a UUID owner with the machine id. Two machines with the same slug both fire a schedule that names that slug. When exactly one machine must fire, give the machine id: the `id` of `machine.json` in the NUU home of that machine (`~/.nuucognition/machine.json`), which a module process on that machine also gets as `FLINT_MACHINE_ID`, or make sure that the slugs of the machines of the Flint differ.

## The Settings File

`Modules/<Name>.settings.toml` holds the settings of the module in one Flint. The Flint owns it: a build, an install, and an update never change it, and an uninstall keeps it. The module gets it as JSON: `settings` of the stdin of `plan` and `apply`, and `FLINT_MODULE_SETTINGS_JSON` for every verb. With no file the value is `null`, and each SDK gives an empty object. A file that does not parse fails the plan.

**A module never writes its settings file.** It asks Flint: `flint module settings <name> set <key> <value>` (in the SDKs: `flint('module', 'settings', name, 'set', key, value)`). The key is a dotted path (`schedules.tick.machine`); the value is one TOML value, so a string needs quotes (`'"katana"'`), and a table is an inline table (`'{ key = "value" }'`); `--create` makes the table of a nested key. The JSON of an object or of `null` is not a TOML value, and Flint refuses it. The write takes the lock of Flint, compares the bytes of the file, and keeps every comment of the person. `get <key>` reads one key. After a change, the person runs `flint sync`.

Write the settings file of a new module with a comment above each key. The comment says what the key does and what a change starts (for example, "with owner = katana, katana starts a real agent session").

## Env Files and Secrets

| File | Git | Holds |
|------|-----|-------|
| `flint.env` | Ignored | The env values of the Flint |
| `flint.env.local` | Ignored | The values of this machine. A value here wins |
| `flint.env.example` | Tracked | The names, with no values |

The syntax is dotenv: `KEY=VALUE`, `#` comment lines, an optional `export ` prefix, single quotes (literal), and double quotes (with `\n`, `\t`, `\"`, `\\`). A name that starts with `FLINT_` is refused. Every module process gets every value.

Name each secret in `secrets:` of the manifest, and add its name to `flint.env.example`. In the plan, `secret(name)` gives the value, or the issue `module-secret-missing` with the next step when the module process has no non-empty value of that name. The value can come from `flint.env.local`, `flint.env`, or the environment of the caller (a person who runs `flint sync` with `DISCORD_TOKEN=…` set gives it to the module). Never print a secret: print its state ("set, 19 characters").

## Live Modules

The Flint server starts `<entry> live` for each installed live module when the server starts, after a `flint sync`, and on `flint module start`. The process also gets `FLINT_SERVER_URL`, `FLINT_MODULE_TOKEN` (one token for each process), and `FLINT_MODULE_HEARTBEAT_MS` (default 10000).

| Event | What happens |
|-------|--------------|
| Register | The process calls `POST /modules/<name>/register` with `{ pid, version, status?, controlUrl? }`. The SDK does it, and starts the heartbeat |
| Heartbeat | `POST /modules/<name>/heartbeat` with `{ status?, detail? }`, every `FLINT_MODULE_HEARTBEAT_MS` |
| Three missed heartbeats | The state is `down` |
| The process exits | The server starts it again after a back-off: 1 s, doubling, at most 60 s (reset after 5 minutes of health) |
| `flint module stop` | SIGTERM, then SIGKILL after 5 s. The module stays stopped until `flint module start` or the next start of the server |
| A sync changed the build, the settings file, or an env file | The server starts the running module again |
| The server stops | It stops every live module |

The states are `starting`, `running`, `down`, and `stopped`. The server writes the Foundation record `flint-module/<name>` for each process (`flint foundation list`), and the output goes to `.flint/run/modules/<name>.log` (the tool `log` of the SDKs writes its line to stderr, so a log line of a live process goes there too). Before each signal, the server proves the process by its module token and its start identity; a process that it cannot prove is `unproved`, and its live starts are blocked until a person resolves it.

**The controller.** A live process can serve its own actions on a local HTTP controller, and registers its URL as `controlUrl`. The person runs `flint module control <name> [<action>] [--data <json>]`, which calls the Flint server: `GET /modules/<name>/actions` lists the actions, and `POST /modules/<name>/actions/<action>` runs one (409 when the module does not run or has no controller; 502 when the controller does not answer). The server then calls the controller with `Authorization: Bearer <FLINT_MODULE_TOKEN>`:

| Route of the controller | Answer |
|-------------------------|--------|
| `GET /` | HTTP 200 with `{ "actions": ["<action>", …] }` (a list of texts) |
| `POST /<action>` with one JSON object | `{ "ok": true, "result": <JSON value> }` or `{ "ok": false, "error": "<text>" }` |

A controller must refuse a call with no valid token (401). The controllers of both SDKs serve these routes and check the token; write your own controller only for the `command` runtime.

Keep a live process small: a heartbeat, a controller, and the work of the module. Write state to the data folder, not to the memory of the process: the process can start again at any time.

## The SDKs

Both SDKs give the same surface. A module defines its handlers and calls `run()`, which reads the verb from the arguments.

| Tool | TypeScript | Python |
|------|------------|--------|
| The context | `m.ctx` | `m.ctx` (a dict) |
| The settings (`{}` with no file) | `m.settings` | `m.settings` |
| The data folder | `m.dataDir` | `m.data_dir` |
| One env value | `m.env(name)` | `m.env(name, default=None)` |
| One secret (an issue when missing) | `m.secret(name, next?)` | `m.secret(name, next=None)` |
| Run the Flint CLI | `await m.flint(...args)` → `code`, `stdout`, `stderr`, `json()` | `m.flint(*args)` → `.code`, `.stdout`, `.stderr`, `.json()` |
| A desired cron schedule | `m.desired.cron({...})` | `m.desired.cron(**fields)` |
| A desired station | `m.desired.station({...})` | `m.desired.station(**fields)` |
| An own action | `m.action({...})` | `m.action(**fields)` |
| An issue (stderr outside `plan`) | `m.issue(code, message, next?)` | `m.issue(code, message, next=None)` |
| A log line (stderr in `command` and `live`) | `m.log(message, level?)` | `m.log(message, level="info")` |
| Live: register | `await m.register({ status?, controlUrl? })` | `m.register(status=None, control_url=None)` |
| Live: status (one heartbeat now) | `await m.status(status, detail?)` | `m.status(status, detail=None)` |
| Live: controller | `await m.controller({ action: handler })` | `m.controller({"action": handler})` |
| Live: on stop | `m.onStop(fn)` | `m.on_stop(fn)` |

A field with the value `undefined` or `None` is left out of a desired object or an action. When the `live` handler does not call `register`, the SDK registers after the handler returns. A controller handler gets `(body, m)` and returns a JSON value.

**The TypeScript SDK** is `@nuucognition/flint-module-sdk` (`packages/flint-module-sdk` of the Flint repo), with no runtime dependency. Bundle it into one ESM file with your module (`runtime: node`, `entry: dist/index.js`, `build: "node build.mjs"`): the module process has no `node_modules`. In Flint 0.7.0 the package is private and not on npm, so the build takes it from a checkout of the Flint repo. [[dev-tmp-knap-module_typescript-v0.1]] gives the source and the build script.

**The Python SDK** is one file, `flint_module.py`, standard library only. The CLI of Flint ships it and puts its folder first on `PYTHONPATH`, so `from flint_module import Module` works with no install and no build. [[dev-tmp-knap-module_python-v0.1]] gives a starter. A Python module is the easiest start: no build step and no dependency.

## Run Flint from a Module

A module process can run any Flint command: `flint sync`, `flint git sync`, `flint orbh …`, `flint module settings`, `flint ite`, and the others. The SDK tool `flint(...)` runs `FLINT_CLI` in the Flint root and returns the exit code, stdout, stderr, and `json()`. A module has no other API of Flint: the commands of the CLI are its API.

| Rule | Detail |
|------|--------|
| Where | In a command and in the live process: no time limit. `apply` can run a short command (its limit is 30 seconds). Never in `plan`: a plan changes nothing |
| No recursion | Every module process has `FLINT_MODULE_PROTOCOL=1`, the live process too. A `flint sync` from a module runs every step except the module step, and that step reports "This Flint CLI runs inside a module process, so it runs no module process." `flint git sync` works, and its local sync skips the modules for the same reason |
| No server API | A module gets no token of the Flint server. Its only routes of the server are its own register, heartbeat, and controller |
| `flint git sync` | It runs `git add -A`: it commits every change of the Flint, also the uncommitted work of people and of other sessions, then pushes. Run it from a module only when the person agrees, and say so in the settings file |
| Credentials | A live process has the environment of the Flint server: Git over HTTPS with the macOS keychain works; an SSH agent may not be there. A command has the environment of the person who runs it |
| Output | Check the exit code. Read structured output with `--json` and `json()`. Report the result with `status(...)` (live) or a short line on stderr. Never print a secret |

**Example: a live module that runs `flint git sync` on a timer** (Python; `kind: live`, and the setting `every_seconds` in `module.yaml`):

```python
import threading
from flint_module import Module

module = Module()


@module.live
def live(m):
    stop = threading.Event()
    every = int(m.settings.get("every_seconds", 900))

    def loop():
        while not stop.wait(every):
            result = m.flint("git", "sync")
            m.status("ready" if result.code == 0 else "failing", "last git sync exit %d" % result.code)

    threading.Thread(target=loop, daemon=True).start()
    m.on_stop(stop.set)
    m.status("ready", "first git sync in %d s" % every)


if __name__ == "__main__":
    module.run()
```

The handler returns after it starts the thread; the SDK keeps the process alive with the heartbeat until SIGTERM, and the stop handler ends the loop. A conflict halts `flint git sync`: the status shows `failing`, and a person runs `flint git sync --continue`.

## Build, Install, and Release

| Step | Command | What it does |
|------|---------|--------------|
| Build a source of this Flint | `flint module build <name> [--broadcast]` | Runs `build` of the manifest in `Modules/(Source …) <Name>/`, copies the result to `Modules/<Name>/`, and writes `<name> = { source = "@<org>/<slug>", from = "source" }`. `--broadcast` also updates each Flint of this machine that installs it from here |
| Check the plan | `flint module status <name>` | The package state, the liveness, and the plan. Writes nothing |
| Apply | `flint sync` | Runs the plan, applies the desired objects and the own actions. `flint sync --dry-run` writes nothing |
| Run a command | `flint module <name> <command> [args...]` | |
| A live module | `flint module start <name>`, `stop <name>`, `restart <name>` | `start` and `restart` start the Flint server when none runs |
| Install elsewhere | `flint module install --from-path <dir>`, `--from-git <owner/repo[#ref]>`, `@<org>/<slug>#<flint>` | A path or Git install runs the build of the manifest |
| Release | `flint module release <name> [<version>]` | Runs the build, refuses an uncommitted build output, tags `v<version>`, pushes, and registers the kind `module` |
| Remove | `flint module uninstall <name>` | Removes the build, the lock record, and the record. The settings file and the data folder stay; the next sync pauses the objects |

After an edit of the source: `flint module build <name>`, then `flint sync` (and `flint module restart <name>` for a live module when no sync runs). Sync also builds a `from = "source"` record again when its source changed.

**Release.** The source must be a Git repository with the remote `origin` on GitHub. A registry version is the released tree with its build output, so the entry must be in the commit; an install from the registry runs no build step. The release needs a registry of contract 1.2 or later: a registry before 1.2 refuses with `registry-no-modules` before any tag, push, or register. The build step runs before that check, so it can already have written files in the source. A Flint with no org does not publish.

## Safe Defaults

A module runs in the Flint of a person, often on several machines. Follow these rules:

- **No agent run by default.** A desired cron schedule with an owner starts real agent sessions. Ship a schedule with no `schedule` key or no owner, and say in the settings file how to turn it on.
- **A clean doctor by default.** An issue or a report of a plan makes the row `Modules` of `flint doctor` fail. Give an issue only when a person must act. Do not ship a permanent issue as a demonstration.
- **One owner.** Take the owner of a schedule from the settings, never from the machine that runs the plan.
- **No secret in output.** Print the state of a secret, never its value. Never write a value into the Mesh, a commit, or a message.
- **State on disk.** Write the state of the module to its data folder. A plan reads it; `apply` writes it.
- **Stop cleanly.** A live module stops its work in its stop handler. It must not leave child processes.

## Anti-Patterns

- ❌ Writing in `plan` — a plan changes nothing; use an own action and `apply`.
- ❌ Writing the settings file from the module — call `flint module settings <name> set`.
- ❌ Writing an Orb object (a cron schedule, a station) with `flint orbh cron create` or a direct write — return a desired object.
- ❌ `machine` from `FLINT_MACHINE_SLUG` — every machine runs the plan, so every machine fires.
- ❌ Printing to stdout in `plan` or `apply` with no SDK — stdout holds only the JSON.
- ❌ A log line for a problem that a person must fix — a log is information only; give an issue.
- ❌ Editing `Modules/<Name>/` — the next build overwrites it; edit the source.
- ❌ Editing `flint.json#modules` or `[modules]` by hand — use `flint module build`, `install`, and `uninstall`.
- ❌ A record name that is a reserved verb of `flint module`.
- ❌ A secret name that starts with `FLINT_`.
- ❌ Expecting a `flint sync` from a module process to reconcile modules — it runs every other step and skips the module step (see [Run Flint from a Module](#run-flint-from-a-module)).
- ❌ A timer that runs `flint git sync` with no agreement of the person — it commits every change of the Flint, also the work of other sessions.

## Examples

- `Modules/(Source Local) Demo/` of the NUU Flint Flint: one Python module with one hook for each feature (F1 to F15), and `flint module demo tour`.
- `examples/modules/showcase-ts` and `examples/modules/showcase-py` of the Flint repo: one module in each language with each API, and `run-showcase.sh`.
- `modules/crons` and `modules/dms` of the Flint repo: the first-party modules.
