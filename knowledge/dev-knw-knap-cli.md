---
name: Knap CLI Reference
description: Full flint shard CLI surface — the words, how a reference and a package spec resolve, each command (create, build, dev, clone, release, install, update, fork, rename, id, uninstall), the retired spellings, and the --json shapes
type: knowledge
---

# Knap CLI Reference

The `flint shard` command is the only supported way to change shard state. **Never** rename shard folders, edit `flint.json#shards`, edit `.flint/shards.json`, or scaffold a shard by hand. The CLI keeps the records, the folders, and the manifests in step. If a command in this file matches your need, run it.

## The Words

| Word | Meaning |
|------|---------|
| **source** | The files that a person edits. `Shards/(Source Local) <Name>/` has no repository. `Shards/(Source Remote) <Name>/` is a clone of a repository. A source file name has the `dev-` prefix. The source id is `shard.yaml#source.id`. |
| **shard** | The built package in `Shards/<Name>/`. The shard id is `shard.yaml#id`. Its address is `@org/shard/<name>`. |
| **build** | The verb that makes the shard from its source, and the state that it makes: `snapshot` (a clean Git source, with the sha) or `edited`. |
| **install** | A shard at `published` in this Flint, fetched at the tag of a version and proven by its hash. |
| **spec** | A reference to a package: `@org/name[@version][#place]`. |
| **lock** | `flint.json#shards[<shard id>]`: what is in this Flint, at which state, from where. |
| **registry** | The NUU Shard Registry. It gives the versions of a package, each with the sha of the source and the hash of the build. |
| **place** | A machine, or a Flint on this machine, that holds a source or a shard. |

`flint.toml` is the intent (one record per alias). `flint.json` is the lock (one record per shard id). `.flint/shards.json` holds the facts of this machine. The alias is the key of the record and nothing more.

## Shard References

A command that takes `<ref>` accepts any of these forms:

| Form | Example | Note |
|------|---------|------|
| Alias | `notepad` | The key of the record in `flint.toml`. The alias wins over every other form. |
| Shorthand | `ntpd` | The prefix of the file names. |
| Id | `76d64e3e-3c05-4391-a39e-22001fb2e20a` or `@76d64e3e-…` | The full shard id. |
| Package address | `@nuu-cognition/notepad` or `@nuu-cognition/shard/notepad` | The address of the lock record. |

When a reference names two shards, the command stops with the code `ambiguous`, names both shards with their ids, and gives one next command per shard in the id form (`flint shard status @<id>`). Nothing is written.

The source commands (`build`, `id`, `rename`, `push`, `pull`, `dev`, `release`) act on the source of the record. `start` and `hstart` load the shard. `start-dev` and `hstart-dev` load the source.

## The Package Spec

`install`, `clone`, `fork`, and `flint resolve` read a package spec: `@org/name[@version][#place]`.

| Part | Form | Absent |
|------|------|--------|
| `@org/name` | The short form of the address `@org/shard/name`. The full form is also valid. `@/name` is a package with no org. | Required |
| `@version` | An exact version `1.1.3`, a caret range `^1.1`, or a tilde range `~1.1.3`. Nothing else parses. | The latest published version |
| `#place` | A machine name, the slug of a Flint on this machine (`#nuu-orbh`), or a located address | The walk |

The short form `@org/name` is valid only in a shard context (`[shards]`, `dependencies`, `flint shard` commands). The lock and the registry store the full address.

**The walk.** Without `#place`, the CLI asks three places in order, and the first answer wins:

1. **This Flint**: a lock record with that address.
2. **This machine**: a Flint of the machine registry that holds the source or the shard.
3. **The registry**: the record of the package, and the highest version inside the range.

A copy outside the range is skipped with a note, and the walk goes on. With `#place`, a bare slug is a machine name first, then a Flint slug; the answer is the folder in that place. GitHub is not a place of the walk: the registry answers with the Git location of each version.

When the registry does not answer (offline, refused, or a bad answer), an install from Git or from a path goes on, and the lock says `registry: "unchecked"`. `flint sync` asks again and reports a changed answer as a notice. An install of a package that no local place holds stops:

```
$ flint shard install @nuu-cognition/nothing
✘ @nuu-cognition/shard/nothing is not on this machine, and the registry did not answer: the registry at http://127.0.0.1:9 is not reachable: fetch failed (bad port).
  flint resolve @nuu-cognition/shard/nothing
  flint shard install --from-git <owner/repo>
```

## Command Surface

### Inspect

| Command | Purpose |
|---------|---------|
| `flint shard list` (alias `ls`) `[--json]` | One row per shard: `ALIAS SHORTHAND STATE VERSION ADDRESS ID` (the id in 8 characters; a held id has the mark `(held)`). |
| `flint shard status <ref> [--json] [--health]` | The record, the state with its proof, the request, where the shard came from, the Git state of the source, the dependencies, and the pending migrations. `--health` also runs the health check and exits 1 on an error finding. |
| `flint shard info <ref> [--json]` | The detail of one shard: identity, state, folders, contents, dependencies. |
| `flint shard <ref>` | The same as `info`. |
| `flint shard scripts <ref>` | The `scripts/*.js` of the shard. |
| `flint shard versions <ref> [--json]` | The versions in the registry (tag and sha), else the Git tags of the location in the lock. |
| `flint shard published` | Your shards in the NUU Shard Registry. Needs `flint login`. |
| `flint resolve <spec> [--json]` | The answer of the walk: the place, the name, the id, the tag, the repo, the ref, the sha, the hash, the folder, and the registry answer. |

```
$ flint shard list
Shards
  ALIAS           SHORTHAND   STATE         VERSION     ADDRESS                              ID
  notepad         ntpd        published     1.1.3       @nuu-cognition/shard/notepad         76d64e3e
  plan            pln         published     0.4.0       @nuu-cognition/shard/plan            2a7f3c10
  sketchpad       skp         edited        1.0.0       @nuu-cognition/shard/sketchpad       35e92068 (held)
  notepad-nathan  ntpn        edited        1.2.0       @nuu-cognition/shard/notepad-nathan  7948fa19
  drafts          d           no build      0.1.0       @nuu-cognition/shard/drafts          5696b7b7

$ flint shard status notepad
Notepad
  Id       : 76d64e3e-3c05-4391-a39e-22001fb2e20a
  Alias    : notepad
  Address  : @nuu-cognition/shard/notepad
  State    : published 1.1.3
  Request  : @nuu-cognition/shard/notepad@^1.1
  From     : registry (registry: published)
  Shorthand: ntpd
  Folders  : Shards/Notepad
  ✓ No pending migrations
```

The `STATE` column is the state of the build in the lock: `published`, `snapshot`, `edited`, `no build` (a source with `use = "none"`), or `no record`.

### Start (loaded by the agent runtime)

| Command | Purpose |
|---------|---------|
| `flint shard start <ref> [--json] [--dump]` | The dynamic manifest of the shard (the build `Shards/<Name>/`, or the source folder of a reference record): header, `init-<sh>.md`, required reading, skills, workflows, templates, knowledge. |
| `flint shard start-dev <ref> [--json]` | The same for the source (`dev-init-<sh>.md`). |
| `flint shard hstart <ref> [--json] [--dump]` | The headless manifest: `hinit-<sh>.md` and the `hwkfl-*` workflows. A shard with no `hinit-<sh>.md` is refused with the next command `flint shard start <ref>`. |
| `flint shard hstart-dev <ref> [--json]` | The headless manifest of the source. |

The header of every start names the shard:

```
# Shard: Notepad (ntpd) v1.1.3
Id: 76d64e3e-3c05-4391-a39e-22001fb2e20a
Alias: notepad
Address: @nuu-cognition/shard/notepad
State: published 1.1.3
Request: @nuu-cognition/shard/notepad
```

`start` of a record with `from = "source"` loads the build. When the source changed after the build, `start` prints a notice on stderr and loads the build anyway:

```
⚠ The build of notepad is stale: its source changed after the build. Next: flint shard build notepad
```

The start refuses and exits 1 when a setup layer is `required` (`FORCE SETUP`, the setup file, then `SETUP REQUIRED`), when shard migrations are pending, when the reference source is gone (`reference-missing`, next `flint sync`), and when the reference is `not-found` or `ambiguous`. With `--json` every end is one JSON value (see [--json Shapes](#--json-shapes)).

Skill and workflow files begin with the context line `Run \`flint shard start <sh>\` if you haven't already.` (`hstart` for `hwkfl-*`, and `start-dev` / `hstart-dev` in a source).

### Install and Update

`flint shard install` has four inputs:

| Input | What the install does |
|-------|-----------------------|
| `@org/name[@range][#place]` (or a bare word) | Resolves the spec through the walk. From the registry: fetches the tag of the chosen version, checks the shard id and the package hash against the version before any write, and locks the shard at `published`. From a place: copies the folder (`resolved.from = place`). The record is the spec as you wrote it. |
| `--from-git <owner/repo>[#ref]` | Fetches the ref (a tag, a branch, or a commit), computes the hash, and asks the registry by id, then by hash. Three answers: a published version (`published`), a known package at another commit (`snapshot` with the sha and a notice), or an unregistered package (a held id when the package has no id). The record keeps `git = "owner/repo"`. |
| `--from-path <dir>` | Copies a folder on this machine. The record is a path record, the lock is `edited` with `resolved.from = path`. |
| `--reference` | Binds the shard with no build under `Shards/` (`use = "reference"`). The loader reads the folder on this machine. |

A bare word is the package `@<org of the Flint>/<word>` (`@/<word>` in a Flint with no org); a word of the official alias table is `@nuu-cognition/<slug>`. A positional `owner/repo[@x.y.z]` still installs from GitHub with `registry: "unchecked"`; prefer `--from-git`.

```
$ flint shard install @nuu-cognition/notepad@^1.1
✓ Resolved @nuu-cognition/shard/notepad 1.1.0
✓ Installed Notepad 1.1.0
  Spec    : @nuu-cognition/notepad@^1.1
  Address : @nuu-cognition/shard/notepad
  State   : published 1.1.0
  Registry: published
  Alias   : notepad

$ flint shard install --from-git NUU-Cognition/shard-plan#v0.4.0
✓ Fetched NUU-Cognition/shard-plan#v0.4.0 at 47fa367
✓ Installed Plan from NUU-Cognition/shard-plan#v0.4.0
  ℹ The registry knows this build: @nuu-cognition/shard/plan 0.4.0 (published).
  State   : published 0.4.0
  Registry: published
```

The records that these two commands write:

```toml
[shards]
notepad = "@nuu-cognition/notepad@^1.1"
plan = { source = "@nuu-cognition/plan@0.4.0", git = "NUU-Cognition/shard-plan" }
```

| Command | Purpose |
|---------|---------|
| `flint shard install <input> --alias <alias>` | Install under another alias (kebab-case). Needed for a second shard with the same slug. The folder becomes `Shards/<Alias As Title>/`. |
| `flint shard install <input> --no-deps` | Install the shard alone. The missing dependencies are printed with their install commands. |
| `flint shard install --all-dev` | Build the shard of every source of this Flint. A record with `use = "none"` is skipped with one line. |
| `flint shard reinstall [<ref>]` | Install the shard again from its record. A `from = "source"` record calls `build`. |
| `flint shard update [<ref>] [--json]` | Resolve each spec again inside its range and move the lock to the highest version. A spec with an exact version does not move. A build of a source is skipped: `built from its source: run flint shard build <alias>`. |
| `flint shard uninstall <ref> [--json]` | Remove the build, the lock record, the local entry, and the unchanged payloads. A changed or shared payload stays. For a `from = "source"` record the source and the record stay, and the record gets `use = "none"`. |

```
$ flint shard update
  ✓ Notepad 1.1.0 → 1.1.3
  ● Oracle v0.1.0 — built from its source: run flint shard build oracle
```

The install refuses before any write, with the reason and a next command, when:

- the id or the hash of the fetched package differs from the registry record: `id-mismatch` or `hash-mismatch` ("Nothing was written").
- no version is inside the range: `no-version-in-range` (the reason names the published versions).
- the alias is the key of another shard. Next: `flint shard install <input> --alias <alias>`.
- the shorthand is taken: `the shorthand <sh> is used by <Name>`.
- the same shard id is already present: `shard <Name> is already present in this Flint as Shards/<folder> (alias <alias>)`.
- a present dependency is outside its range, a manifest does not parse (`manifest-error`), or the dependencies form a cycle.
- the lock holds a record of an older shape (`shard-record/0.1`, or the legacy shape of 0.6.0). Next: `flint migrate run`.

The transitive plan prints one line per missing package before any write, then installs in that order and the shard last:

```
→ will install Plan from @nuu-cognition/plan@^0.4 (needed by Tasks)
```

### Author

| Command | Purpose |
|---------|---------|
| `flint shard create "<Title>" [-s <sh>] [-d "<desc>"] [--setup [full\|flint\|local]] [--no-install] [--json]` | Make a local source `Shards/(Source Local) <Title>/` with `shard.yaml` (the shard id, the source id, the org of the Flint), `dev-init-<sh>.md`, `README.md`, and a setup file with `--setup`. Writes the record `<alias> = { source = "@org/name", from = "source" }` and builds the shard. `--no-install` writes `use = "none"` and builds nothing. **Always start here.** |
| `flint shard build <ref> [--force] [--json]` | Make `Shards/<Name>/` from the source of the record and write the lock state: `snapshot` with the sha (a clean Git source) or `edited`. A build of a `use = "none"` record removes `use = "none"`. |
| `flint shard dev <ref> <url>` | Promote a local source to a remote source: `git init`, set the remote, commit, push. The folder becomes `(Source Remote) <Name>`, the source id stays, and the record gets `git = "owner/repo"`. |
| `flint shard clone <spec> [--from-git <owner/repo>] [--alias <alias>] [--no-build] [--json]` | Clone the source of a published shard into `Shards/(Source Remote) <Name>/`. The registry says where the repository is. Writes `{ source = "@org/name", from = "source" }` (with `git` for a location that you gave) and builds the shard. |
| `flint shard fork <spec> --name "<Name>" [--shorthand <sh>] [--no-install] [--json]` | Make a new local source with a new shard id and a new source id, and `of` on each. The origin does not change. A fork in the same Flint needs a new shorthand. |
| `flint shard rename <ref> --title "<New Name>" [--json]` | Source only. Writes the new `name` and one `formerNames` line, renames the source folder and the build folder, moves the type files (they keep their ids), and changes the alias and the key when the alias was the old slug. The package address follows the new name; the id does not change. |
| `flint shard rename <ref> --shorthand <new> [--json]` | Source only. Renames the prefixed files, rewrites the references and the `#<old>/` tags, adds `formerShorthands`, bumps the major version, scaffolds `migrations/dev-mig-<new>-<from>-to-<to>.md`, and builds again (the migration is queued for the build). |
| `flint shard id <ref> [--dry-run] [--json]` | Fill an absent shard id, source id, and `org` (the org of the Flint) into a source. A shard that is only a build is refused with `not-a-source`. On a dirty source or a work branch it writes the values and prints the next command `flint shard push <ref>`. |
| `flint shard type add <Name> --shard <sh> [--description] [--folder] [--dashboard] [--obsidian]` | Add an artifact type to a source and build it. |
| `flint shard push <ref> [-m "<msg>"] [-b [patch\|minor\|major]]` | Commit and push the remote source. |
| `flint shard pull <ref>` | `git pull` the remote source. |
| `flint shard release <ref> [<version>] [--org <slug>] [--no-register] [--json]` | Release a version (below). |

```
$ flint shard create Oracle --shorthand orc
Created Oracle.
Path: Shards/(Source Local) Oracle
done: source: Shards/(Source Local) Oracle (shorthand orc, address @nuu-cognition/shard/oracle)
done: build: Shards/Oracle
Next: flint shard start-dev orc

$ flint shard clone @nuu-cognition/notepad
✓ Cloned Shards/(Source Remote) Notepad
  Record    : notepad = { source = "@nuu-cognition/notepad", from = "source" }
  Repository: NUU-Cognition/shard-notepad
  Shard     : Shards/Notepad (snapshot f413ac9)

$ flint shard fork @nuu-cognition/notepad --name 'Notepad Two'
✘ the shorthand ntpd is used by Notepad
  flint shard fork "@nuu-cognition/shard/notepad" --name "Notepad Two" --shorthand <free>
```

A rename in a shard that has no source here is refused. The old forms `rename title` and `rename shorthand` still work and print the new form.

### Release

`flint shard release <ref>` releases the version in `shard.yaml` (or the version argument):

1. It refuses a source that is not a Git repository, has no remote, lacks `id`, `source.id`, or (in a Flint with an org) `org` (next `flint shard id <alias>`), is dirty, or has commits that are not pushed.
2. It hashes a build of a clean export of `HEAD`.
3. It tags `v<version>` and pushes the tag.
4. It registers the version with the NUU Shard Registry: the shard id, the source id, the org, the name, the tag, the hash, the ref, and the sha. `--no-register` skips this step.
5. It builds the shard here and locks it at `published`.

```
$ flint shard release notepad
ℹ Releasing (Source Remote) Notepad v1.2.0…
  ✓ Created tag v1.2.0
  ✓ Pushed to origin
  ✓ Registered nuu-cognition/notepad
  ✓ Built notepad: published 1.2.0
✓ Released Notepad v1.2.0
```

A repeat after a failed register finds the tag at `HEAD` and goes on. The registry records a GitHub `owner/repo` for each version, because an install fetches the version from there. `flint shard unpublish <slug>` removes a shard from the registry (needs `flint login`).

### Retired and Legacy Spellings

Each input below is accepted for one release. Each one prints the new spelling.

| Old | New |
|-----|-----|
| `flint shard install <owner/repo> --edit` | `flint shard clone --from-git <owner/repo>` |
| `flint shard install --from-local "<Flint>/<shard>"` | `flint shard install @org/name#<flint slug>` |
| `flint://<Flint>/<shard>`, `@org/flint/<flint>/shard/<alias>` | `@org/name#<flint slug>` |
| `flint shard publish <ref>` | `flint shard release <ref>` (`publish` is an alias for one release) |
| `flint shard pin <ref> <version>` | An exact version in the spec: `flint shard install <alias>@<version>` |
| `flint shard unpin <ref>` | A spec with no version, or a range |
| `edit = true` in `flint.toml` | `from = "source"` |

```
$ flint shard pin notepad 1.1.3
pin is retired: the spec carries the version (flint shard install notepad@1.1.3)
```

`pin` and `unpin` are hidden from the help. They still rewrite the range of the spec, and the lock request follows.

> Old words: the "Dev Local" folder is now the local source `(Source Local)`, the "Dev Remote" folder or "checkout" is now the remote source `(Source Remote)`, a "dev shard" is a source, and the "installed copy" or "replica" is the shard (the build).

### Setup

When `shard.yaml` declares `setup: full|flint|local`, the shard ships a `dev-setup-<sh>.md` and the lock keeps the setup state per layer:

| Command | Purpose |
|---------|---------|
| `flint shard setup <ref>` | Show the state of the Flint layer (`flint.json#shards[<id>].setup`) and the local layer (`.flint/shards.json`). |
| `flint shard setup <ref> --complete` | Mark setup complete (the default scope comes from `manifest.setup`). |
| `flint shard setup <ref> --complete --scope flint\|local\|both` | Override the scope. |
| `flint shard setup <ref> --reset` | Set the layers back to `required`. |

Run `--complete` yourself when you have finished the actions of the setup file. Until then `flint shard start` refuses the shard and exits 1.

### Migrations

| Command | Purpose |
|---------|---------|
| `flint shard migrate list <ref>` | The migration steps of the shard with type and status. |
| `flint shard migrate show [<ref>]` | The migration state of one shard, or of every shard. |
| `flint shard migrate run <ref>` | Run the queued steps. Script steps run in a chain; the run stops at an agent or manual step. |
| `flint shard migrate finish <ref>` | Mark the current agent or manual step done and delete its file. |
| `flint shard migrate rerun <ref> <step>` | Run one step again. |

The ledger of a shard is in its lock record: `flint.json#shards[<id>].migrations` (done steps with their times) and `.pending` (queued steps).

### Scripts

Scripts live at `scripts/*.js` and are auto-discovered. Two invocation forms work; prefer the short form:

```bash
flint shard <sh> <script> [args...]        # short form (preferred)
flint shard <sh> exec <script> [args...]   # explicit exec form
```

Inside the script, the runtime exposes `FLINT_ROOT` (workspace root) and `FLINT_SHARD` (shard folder) as env vars. The shorthand is **not** in the filename — the file at `scripts/dev-prefix-shard.js` is invoked as `flint shard knap prefix-shard`.

### Workspace-Level

| Command | Purpose |
|---------|---------|
| `flint sync [--dry-run]` | Two reconciles. **The shard reconcile** makes `Shards/<Name>/` match the lock: it installs a missing shard, builds a stale build of a source again, fetches the locked version when the build differs from the lock, heals a rename (`moved`), and records a changed registry answer (with a notice). **The source reconcile** reports the Git state of each source (`draft, ahead by N`, `behind`, `dirty`) and records it; it never changes a source. A missing dependency or a dependency outside its range is not current, with the next command. |
| `flint resolve <spec> [--json]` | The answer of the walk (see [The Package Spec](#the-package-spec)). |
| `flint migrate run [--dry-run]` | Run the pending Flint migration steps. The steps `s5`, `s6`, and `l4` of `flint-0.6.0-to-0.7.0` upgrade a Flint to the package model (see [[dev-knw-knap-architecture]] § Upgrade of an Older Flint). `flint migrate rollback` undoes a run. |

```
$ flint sync --dry-run
Changes
  ● Would record the Git state of the source seer
  ● Would record the registry answer unregistered of sketchpad
Notices
  ● seer: dirty (1 file). Sync keeps the changes.
  ● The registry answer for sketchpad (@nuu-cognition/shard/sketchpad) is now unregistered; the lock said unchecked.
```

## --json Shapes

| Command | Output |
|---------|--------|
| `list --json` | `{ rows: ShardRow[] }` |
| `status --json`, `info --json` | `ShardRow` plus `details` (`dependencies`, `payloads`, `state` (the lock state with its proof), `source` (the Git state of the source), `reference`, `pending`, `installedAt`); with `--health` also `health[]` |
| `start --json` (and `hstart`, `start-dev`, `hstart-dev`) | `{ ok, status, shard: ShardRow, state, loads, stale, notice?, next?, manifest: { text, folder, initPath, hinitPath, requiredReading }, setup: { declared, flint, local }, pending }`; a refusal adds `code`, `reason`, `next` |
| `build --json` | `{ ok, id, alias, folder, path, state }` (`folder` is the source, `path` is the build) |
| `clone --json` | `{ ok, alias, folder, spec, repo, git?, build? }` |
| `release --json` | `{ ok, alias, version, tag, sha, hash, repo, registered, slug, state }` |
| `versions --json` | `{ ok, address, from, versions: [{ tag, sha?, hash? }], installed }` |
| `id --json` | `{ ok, id, sourceId, org, minted, filled, folder, notice? }` |
| `fork --json` | `{ ok, id, sourceId, source, org, of, name, shorthand, folder, installed }` |
| `rename --json` | `{ ok: true, kind: "title" \| "shorthand", … }` |
| Every refusal | `{ ok: false, code, reason, next? }` (no `next` when no command fixes it, e.g. `manifest-error`) |

`ShardRow`:

| Field | Value |
|-------|-------|
| `id` | The shard id (`null` on a Flint with the legacy record shape). |
| `held` | `true` for a client-held id. |
| `alias`, `shorthand`, `name` | The key, the prefix, the Title. |
| `address` | The package address `@org/shard/<name>`. |
| `request` | The spec of the record, in the full form. |
| `state` | The kind of the lock state: `published`, `snapshot`, `edited`, or `null` (no build here). |
| `version` | The version of the build. |
| `from` | Where the build came from: `registry`, `git`, `path`, `source`, or `place`. |
| `registry` | The registry answer: `published`, `snapshot`, `unregistered`, or `unchecked`. |
| `use` | `copy`, `reference`, or `none`. |
| `folders` | `{ shard?, source? }` |
| `setup` | `required`, `not-required`, `completed`, or `none`. |
| `pending` | The queued shard migration steps. |

## When to Use What — Authoring Flow

1. `flint shard create "<Title>" -s <sh>` — scaffold the source, mint the two ids, build the shard.
2. Edit `dev-init-<sh>.md`, write skills, workflows, templates, and knowledge by hand.
3. `flint shard type add <Name> --shard <sh>` for each artifact type.
4. `flint shard scripts <sh>` to confirm script discovery; `flint shard <sh> <script>` to run one.
5. `flint shard rename <alias> --title "<New>"` or `--shorthand <new>` if you change the name — never rename by hand.
6. `flint shard build <alias>` after you edit the source. `start` tells you when the build is stale.
7. `flint shard dev <alias> <github-url>` once the source is ready for a repository.
8. `flint shard release <alias>` to tag, push, and register a version.

To edit a published shard in another Flint: `flint shard clone @org/name`, edit, `flint shard build <alias>`, then `flint shard push <alias>` and `flint shard release <alias>`.

For a shard at `shard-spec: "0.2.0"`: set `"0.3.0"` and run `flint shard id <alias>`. For `0.1.0`, see [[dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] first.

## Anti-Patterns

- ❌ Editing `flint.json#shards` or `.flint/shards.json` by hand — the CLI owns them, and a record it does not understand stops every shard command.
- ❌ Writing `id`, `source.id`, `formerNames`, `formerShorthands`, or `of` by hand — use `create`, `id`, `rename`, and `fork`.
- ❌ Changing an id — the lock of every Flint and the registry find the shard by it.
- ❌ Writing an `id` into `flint.toml` — the id lives in the lock.
- ❌ Renaming shard folders or `dev-*` files by hand — use `flint shard rename` so references and records stay in step.
- ❌ Running `git mv`/`mv` to add or remove `dev-` prefixes — use the `prefix-shard` script (`flint shard knap prefix-shard <path>`).
- ❌ Editing files in `Shards/<Name>/` — the next build or install overwrites them. Edit the source, then `flint shard build <alias>`.
- ❌ Calling `flint shard heal` — the command does not exist; `flint sync` covers it.
