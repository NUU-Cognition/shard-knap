---
description: "Create or change a Flint module with review stages — from its purpose to a clean plan, working commands, and a clean flint doctor"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start knap` if you haven't already.

# Workflow: Knap Module

Create a new module in this Flint, or change an existing module, with the person. A module is a package whose code runs as a process: a plan at sync, commands, and an optional live process. The sibling workflow for a shard is [[dev-wkfl-knap-knap_shard]].

# Input

- The purpose of a new module, or the record name of an existing module (`flint module list`)
- (Optional) The runtime (`python` or `node`), the kind (`sync` or `live`), and the hooks that the person wants

# Actions

## Stage 1: Load

1. Read [[dev-knw-knap-module]] in full. It is the contract that every later stage follows.
2. Run `flint module list` and `flint module --help`. Note the modules of this Flint and the reserved verbs.
3. **A new module.** Look before you build: a first-party module (`crons` for schedules, `dms` for direct messages to a Flint) or a module of another Flint of this machine can already do the work. Run `flint shard browse <word>` and search the Flints of this machine for `Modules/`. A shard is the right package when the work is for an agent, not for the machine.
4. **An existing module.** Read its `module.yaml`, every file of its source (`Modules/(Source Local|Remote) <Name>/`), its settings file (`Modules/<Name>.settings.toml`), and the output of `flint module status <name>`. A module with no source here (from the CLI bundle, a path, Git, or the registry) has no source to edit: tell the person, and stop or plan a fork into a local source.
5. Read `flint.env.example` when it exists. Never read or print the values of `flint.env` and `flint.env.local` to the person.

Present a summary to the person: the purpose, what exists already, and for an existing module its package, version, kind, commands, settings keys, secrets, and the state of its plan.

Once the person has reviewed the summary, progress to the next stage.

## Stage 2: Design

Agree on the design with the person before you write a file. Write it as a short list:

- **Name.** The module name (the Display Name law), the slug, the package name `@<org>/<slug>` (the org of `flint.json#org`, or `@/<slug>`), and the record name. The record name is never a reserved verb of `flint module`.
- **Runtime.** `python` by default: one file, no build, and the SDK ships with the CLI. `node` when the module needs an npm library; then the build needs a checkout of the Flint repo for the SDK (`FLINT_REPO`).
- **Kind.** `sync`, or `live` when the module must run all the time (a bridge, a watcher, a service with its own actions).
- **Hooks.** For each one, the purpose and the safe default:
  - Desired cron schedules: the key, the expression, the prompt, the target, and the owner. **A schedule starts real agent sessions.** By default, ship no schedule or no owner, and say in the settings file how to turn it on. Never take the owner from the machine that runs the plan.
  - Desired stations: the key, the target, the mode, the duty.
  - Own actions: the state in the data folder that `apply` writes, and how the plan compares it, so that a second sync has no change.
  - Issues: only when a person must act. An issue or a report makes the row `Modules` of `flint doctor` fail.
  - Commands: the kebab names and what each prints. A change of a setting goes through `flint module settings <name> set`.
  - Live: the controller actions, the status text, and the work that the stop handler ends.
- **Settings.** Each key, its type, its default, and the comment that the settings file carries.
- **Secrets and env values.** Each name (never `FLINT_*`), and where its value comes from.

Ask the person to approve or change the design. Once the person approves the design, progress to the next stage.

## Stage 3: Build

1. Create the source folder `Modules/(Source Local) <Name>/` (or edit the existing source). A module source has no `dev-` prefix on its files.
2. Write `module.yaml` from [[dev-tmp-knap-module_yaml-v0.1]]. Make the id with `python3 -c "import uuid; print(uuid.uuid4())"` once; never change the id of an existing module.
3. Write the entry from [[dev-tmp-knap-module_python-v0.1]] or [[dev-tmp-knap-module_typescript-v0.1]]. Replace every placeholder, and remove the parts that the design does not use.
4. Write a short `README.md` in the source: what the module does, its commands, its settings, and how to turn on each hook that is off by default.
5. Write the settings file `Modules/<Name>.settings.toml`, with a comment above each key. For a new module, write the file by hand once. After that, change it only with `flint module settings <name> set <key> <value>`.
6. Add each secret and env name to `flint.env.example` (the names only). Ask the person to set the values in `flint.env.local` or `flint.env`; for a test, a value that is clearly not a secret is enough.
7. Run `flint module build <name>` (`FLINT_REPO=<checkout> flint module build <name>` for a TypeScript module). It copies the source to `Modules/<Name>/` and writes the record in `[modules]`.
8. Run `flint module status <name>`. It runs the plan and writes nothing. Fix each `module-plan-failed`, each manifest error, and each issue that the design did not expect, then build again.

Once `flint module status <name>` shows the plan that the design expects, progress to the next stage.

## Stage 4: Verify

1. Run `flint sync --dry-run`. Check that the module changes only what the design says, and that no other part of the Flint changes. When other changes show, tell the person before a real sync.
2. Run `flint sync`. Then run `flint module status <name>` again: the plan must be `current` (a second sync has no change).
3. Run each command: `flint module <name> <command> [args...]`. Check the output and the exit code.
4. For each desired object, read it: `flint orbh cron show <key>` and `flint orbh station show <key>`. Check the `managed:` line. Confirm that no schedule fires unless the person agreed.
5. For a live module: `flint module start <name>`, `flint module status <name>` (the state `running` and the heartbeat), `flint module control <name>` and one action, and `flint foundation list` (the record `flint-module/<name>`). Read `.flint/run/modules/<name>.log`.
6. Change one setting with `flint module settings <name> set <key> <value>`, run `flint sync`, and check the effect. Then set it back.
7. Run `flint doctor`. The row `Modules` must pass, unless the person agreed to an issue.

Present the results to the person: the commands that ran, their output, the objects on this machine, and anything that differs from the design.

Once the person confirms the module works, progress to the next stage.

## Stage 5: Finalize

1. Commit only your own paths: the source, the build `Modules/<Name>/`, the settings file, and `flint.env.example`. `flint.toml` and `flint.json` hold the record and the lock; commit them only when no other change of another person or session is in them, else tell the person. Never commit `flint.env` or `flint.env.local`.
2. Ask the person whether the module must reach other machines or other Flints:
   - The machines of this Flint get it through Git. Do not run `flint git sync` yourself: it stages and commits every change of the Flint, also the changes of other people and sessions. Tell the person to run it when the work of other sessions is committed, then to run `flint sync` on the other machine. The owner rule keeps each schedule on its owner machine; when two machines have the same slug, use the machine id as the owner.
   - Another Flint: `flint module install --from-path <dir>`, `--from-git <owner/repo[#ref]>`, or `@<org>/<slug>#<flint>`.
   - The registry: the source must be a Git repository with the remote `origin` on GitHub, and the registry must follow contract 1.2 or later. Run `flint module release <name>` only when the person asks; it tags, pushes, and registers.
3. Tell the person how to stop or remove the module: `flint module stop <name>` for a live module, and `flint module uninstall <name>` (the settings file and the data folder stay; the next sync pauses its objects).

# Output

- A module source in `Modules/(Source Local) <Name>/` with `module.yaml`, its entry, and a README
- The build in `Modules/<Name>/`, the record in `[modules]`, and a settings file with comments
- A plan that is `current` after one sync, working commands, and a clean row `Modules` in `flint doctor`
- For a live module: a running process with a heartbeat, a controller, and a Foundation record
