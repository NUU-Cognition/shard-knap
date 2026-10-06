---
description: "Complete reference for the author of a Flint module — the package and its files, module.yaml, the process contract (plan, apply, command, live) with its JSON, desired objects and the owner rule, settings, env files and secrets, live modules, both SDKs, build, install, and release"
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
  "issues": [ { "code": "demo-placeholder-key", "message": "DEMO_API_KEY has the placeholder value.", "next": "Set DEMO_API_KEY in flint.env.local." } ] }
```

- `objects`: the desired objects. Flint applies them (see [Desired Objects](#desired-objects)).
- `actions`: the own actions of the module, each `{ id, kind, label, detail?, payload? }`. The kind is `create`, `update`, `pause`, `resume`, `remove`, or `report`. An id must not start with `flint:`.
- `issues`: each `{ code, message, next? }`. The sync report, `flint module status`, and `flint doctor` show them.

Rules of a plan:

- **A plan changes nothing.** It only says what it wants. Write files in `apply`, never in `plan`.
- **A plan is stable.** It gives the same answer when nothing changed, so a second sync has no change. Compare the wanted state with the state of the data folder, and give an action only when they differ.
- **A plan is fast.** The time limit is 30 seconds (`FLINT_MODULE_TIMEOUT_MS` sets a shorter limit in a test world).
- **A failure is safe.** A non-zero exit, the time limit, stdout that does not parse, or stdout with no full envelope is the issue `module-plan-failed`. Sync then does not reconcile the module, and it never reads the failure as a removal.
- Write logs to stderr. Stdout holds only the JSON (the SDKs move `print` and `console.log` of a plan to stderr).

### `apply`

For each own action that is not a `report`, a sync that is not a dry run runs `apply` once. Stdin is `{ "context": <the stdin of plan>, "action": <the action> }`. Stdout is `{ "ok": true, "detail": "…" }`. The time limit is 30 seconds. An SDK handler returns a detail text, `{ ok, detail }`, or nothing. Put the data that `apply` needs into `payload` of the action.

### `command`

`flint module <name> <command> [args...]` runs `<entry> command <command> [args...]`. The process gets the terminal of the person (stdin, stdout, stderr), and its exit code is the exit code of `flint module`. A command can run any Flint command through `FLINT_CLI` (the SDK tool `flint(...)`).

### `live`

A module with `kind: live` also runs `<entry> live` under the Flint server. See [Live Modules](#live-modules).

## Desired Objects

A module never writes an object of Orbh itself. Its plan returns desired objects, and Flint applies them:

| Object | Fields |
|--------|--------|
| Cron schedule | `{ key, expr, prompt, timezone?, description?, target?, misfire?, overlap?, machine? }` (`misfire`: `coalesce` or `skip`; `overlap`: `skip` or `allow`) |
| Station | `{ key, target?, mode?, prompt?, description? }` (`mode`: `oneshot` or `resident`) |

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

## The Settings File

`Modules/<Name>.settings.toml` holds the settings of the module in one Flint. The Flint owns it: a build, an install, and an update never change it, and an uninstall keeps it. The module gets it as JSON: `settings` of the stdin of `plan` and `apply`, and `FLINT_MODULE_SETTINGS_JSON` for every verb. With no file the value is `null`, and each SDK gives an empty object. A file that does not parse fails the plan.

**A module never writes its settings file.** It asks Flint: `flint module settings <name> set <key> <value>` (in the SDKs: `flint('module', 'settings', name, 'set', key, value)`). The key is a dotted path (`schedules.tick.machine`); the value is one TOML value, so a string needs quotes (`'"katana"'`); `--create` makes the table of a nested key. The write takes the lock of Flint, compares the bytes of the file, and keeps every comment of the person. `get <key>` reads one key. After a change, the person runs `flint sync`.

Write the settings file of a new module with a comment above each key. The comment says what the key does and what a change starts (for example, "with owner = katana, katana starts a real agent session").

## Env Files and Secrets

| File | Git | Holds |
|------|-----|-------|
| `flint.env` | Ignored | The env values of the Flint |
| `flint.env.local` | Ignored | The values of this machine. A value here wins |
| `flint.env.example` | Tracked | The names, with no values |

The syntax is dotenv: `KEY=VALUE`, `#` comment lines, an optional `export ` prefix, single quotes (literal), and double quotes (with `\n`, `\t`, `\"`, `\\`). A name that starts with `FLINT_` is refused. Every module process gets every value.

Name each secret in `secrets:` of the manifest, and add its name to `flint.env.example`. In the plan, `secret(name)` gives the value, or the issue `module-secret-missing` with the next step when no env file sets it. Never print a secret: print its state ("set, 19 characters").

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

The states are `starting`, `running`, `down`, and `stopped`. The server writes the Foundation record `flint-module/<name>` for each process (`flint foundation list`), and the output goes to `.flint/run/modules/<name>.log`. Before each signal, the server proves the process by its module token and its start identity; a process that it cannot prove is `unproved`, and its live starts are blocked until a person resolves it.

**The controller.** A live process can serve its own actions on a local HTTP controller. The server calls it with the module token: `GET /modules/<name>/actions` lists the actions, and `POST /modules/<name>/actions/<action>` runs one and answers `{ ok, result }` or `{ ok: false, error }` (409 when the module does not run or has no controller). The person runs `flint module control <name> [<action>] [--data <json>]`. The controller of an SDK accepts only a call with the module token.

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
| Live: register | `await m.register({ status?, controlUrl? })` | `m.register(status=None, control_url=None)` |
| Live: status (one heartbeat now) | `await m.status(status, detail?)` | `m.status(status, detail=None)` |
| Live: controller | `await m.controller({ action: handler })` | `m.controller({"action": handler})` |
| Live: on stop | `m.onStop(fn)` | `m.on_stop(fn)` |

A field with the value `undefined` or `None` is left out of a desired object or an action. When the `live` handler does not call `register`, the SDK registers after the handler returns. A controller handler gets `(body, m)` and returns a JSON value.

**The TypeScript SDK** is `@nuucognition/flint-module-sdk` (`packages/flint-module-sdk` of the Flint repo), with no runtime dependency. Bundle it into one ESM file with your module (`runtime: node`, `entry: dist/index.js`, `build: "node build.mjs"`): the module process has no `node_modules`. In Flint 0.7.0 the package is private and not on npm, so the build takes it from a checkout of the Flint repo. [[dev-tmp-knap-module_typescript-v0.1]] gives the source and the build script.

**The Python SDK** is one file, `flint_module.py`, standard library only. The CLI of Flint ships it and puts its folder first on `PYTHONPATH`, so `from flint_module import Module` works with no install and no build. [[dev-tmp-knap-module_python-v0.1]] gives a starter. A Python module is the easiest start: no build step and no dependency.

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

**Release.** The source must be a Git repository with the remote `origin` on GitHub. A registry version is the released tree with its build output, so the entry must be in the commit; an install from the registry runs no build step. The release needs a registry of contract 1.2 or later: a registry before 1.2 refuses before any write with `registry-no-modules`. A Flint with no org does not publish.

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
- ❌ Editing `Modules/<Name>/` — the next build overwrites it; edit the source.
- ❌ Editing `flint.json#modules` or `[modules]` by hand — use `flint module build`, `install`, and `uninstall`.
- ❌ A record name that is a reserved verb of `flint module`.
- ❌ A secret name that starts with `FLINT_`.
- ❌ Calling `flint sync` from inside a module process — it runs no module process.

## Examples

- `Modules/(Source Local) Demo/` of the NUU Flint Flint: one Python module with one hook for each feature (F1 to F15), and `flint module demo tour`.
- `examples/modules/showcase-ts` and `examples/modules/showcase-py` of the Flint repo: one module in each language with each API, and `run-showcase.sh`.
- `modules/crons` and `modules/dms` of the Flint repo: the first-party modules.
