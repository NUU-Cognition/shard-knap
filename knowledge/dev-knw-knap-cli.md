---
name: Knap CLI Reference
description: Full flint shard CLI surface — the ref and its one resolver, the package spec and the walk, the row, each command (create, build, dev, clone, release, install, update, fork, rename, id, uninstall), the retired inputs, and the --json shapes
type: knowledge
---

# Knap CLI Reference

The `flint shard` command is the only supported way to change shard state. **Never** rename shard folders, edit `flint.json#shards`, edit `.flint/shards.json`, or scaffold a shard by hand. The CLI keeps the records, the folders, and the manifests in step. If a command in this file matches your need, run it.

The words (source, shard, build, install, spec, lock, registry, place, name, slug, alias, address, request, state) are the words of the glossary of the spec: [[(Spec) Flint Shards#Glossary]]. `flint.toml` is the intent (one record per alias). `flint.json` is the lock (one record per shard id). `.flint/shards.json` holds the facts of this machine.

## The Ref

A command that takes `<ref>` names one shard of this Flint. One resolver reads the ref, in this order; the first rule that matches wins:

| Order | Form | Example |
|-------|------|---------|
| 1 | The alias (the `flint.toml` key), in any case | `notepad` |
| 2 | The shorthand | `ntpd` |
| 3 | The address, full or short (a range and a place are cut off) | `@nuu-cognition/shard/notepad`, `@nuu-cognition/notepad@^1.1` |
| 4 | The id, `@<id>`, or an id prefix of eight or more characters | `76d64e3e` |
| 5 | A former name, slug, address, or shorthand | `scratchpad` after a rename to Notepad |

A former form prints `moved: <old> is now <new>` on stderr and goes on; `--json` carries `moved: { from, to }`.

**Not a ref:** the current name, a folder name, the kebab of the name of a shard with a custom alias, a camelCase split, and an `init-` stem. They give `not-found` with the next command `flint shard list`. Use the alias.

When a ref names two shards, the command stops with the code `ambiguous` and gives one next command per shard, each with its alias (`flint shard status <alias>`). Nothing is written.

The source commands (`build`, `id`, `rename`, `push`, `pull`, `dev`, `release`) act on the source of the record. `start` and `hstart` load the shard. `start-dev` and `hstart-dev` load the source.

## The Package Spec

`install`, `clone`, `fork`, and `flint resolve` read a package spec: `@org/name[@version][#place]`.

| Part | Form | Absent |
|------|------|--------|
| `@org/name` | The short form of the address `@org/shard/name`. The full form is also valid. `@/name` is a package with no org. | Required |
| `@version` | An exact version `1.1.3`, a caret range `^1.1`, or a tilde range `~1.1.3`. Nothing else parses. | The latest published version |
| `#place` | A machine name, or the slug of a Flint on this machine (`#nuu-orbh`) | The walk |

The short form `@org/name` is valid only in a shard context (`[shards]`, `dependencies`, `flint shard` commands). The lock and the registry store the full address.

**The walk.** Without `#place`, the CLI asks three places in order, and the first answer wins:

1. **This Flint**: a lock record with that address.
2. **This machine**: a Flint of the machine registry that holds the source or the shard.
3. **The registry**: the record of the package, and the highest version inside the range.

A copy outside the range is skipped with a note, and the walk goes on. With `#place`, a bare slug is a machine name first, then a Flint slug; the answer is the folder in that place. GitHub is not a place of the walk: the registry answers with the Git location of each version. An old address that the registry knows answers the record with a note (`<old> moved: the registry answers with the address <new>`).

When the registry does not answer (offline, refused, or a bad answer), an install from Git or from a path goes on, and the lock says `registry: "unchecked"`. `flint sync` asks again and reports a changed answer as a notice. An install of a package that no local place holds stops:

```
$ flint shard install @nuu-cognition/nothing
✘ @nuu-cognition/shard/nothing is not on this machine, and the registry did not answer: the registry at http://127.0.0.1:9 is not reachable: fetch failed (bad port).
  flint resolve @nuu-cognition/shard/nothing
  flint shard install --from-git <owner/repo>
```

## Command Surface

### Inspect

Every inspect surface prints one row with one set of labels in one order: `Id`, `Address`, `Alias`, `Shorthand`, `Name`, `Version`, `State`, `Request`, `From`, `Registry`, `Folders`. `Version` is the version of the build here; a source that moved past its build marks the row `stale`.

| Command | Purpose |
|---------|---------|
| `flint shard list` (alias `ls`) `[--json]` | One line per shard: `ID ADDRESS ALIAS SHORTHAND VERSION STATE` (the id in 8 characters). |
| `flint shard status <ref> [--json] [--health]` | The row, then the Git state of the source, the reference path, `stale`, the dependencies, and the pending migrations. `--health` also runs the health check and exits 1 on an error finding. |
| `flint shard info <ref>` | An alias of `status`: the same text and the same `--json`. |
| `flint shard <ref>` | Runs `status`. |
| `flint shard scripts <ref>` | The `scripts/*.js` of the shard. |
| `flint shard versions <ref> [--json]` | The versions in the registry (tag and sha), else the Git tags of the location in the lock. |
| `flint shard published` | Your shards in the NUU Shard Registry. Needs `flint login`. |
| `flint resolve <spec> [--json]` | The answer of the walk: the rung, the address, the name, the id, the tag, the repo, the ref, the sha, the hash, the folder, and the registry answer. |

```
$ flint shard list
Shards
  ID                ADDRESS                             ALIAS          SHORTHAND   VERSION     STATE
  4426ad5b          @nuu-cognition/shard/meeting-notes  meeting-notes  meet        0.1.0       edited

  1 shard, 1 declared

$ flint shard status meeting-notes
Meeting Notes
  Id       : 4426ad5b-e2a4-4046-b5ee-ebeee419a42f
  Address  : @nuu-cognition/shard/meeting-notes
  Alias    : meeting-notes
  Shorthand: meet
  Name     : Meeting Notes
  Version  : 0.1.0
  State    : edited
  Request  : @nuu-cognition/shard/meeting-notes
  From     : source
  Registry : unchecked
  Folders  : Shards/Meeting Notes, Shards/(Source Local) Meeting Notes
  ✓ No pending migrations
```

The `STATE` column is the state of the build in the lock: `published`, `snapshot`, `edited`, `no build` (a source with `use = "none"`), or `no record`. When the source moved past its build, `status` prints `stale    : the source is at <version> (<sha>)` and the next command `flint shard build <alias>`.

### Start (loaded by the agent runtime)

| Command | Purpose |
|---------|---------|
| `flint shard start <ref> [--json] [--dump]` | The dynamic manifest of the shard (the build, or the source folder of a reference record): header, `init-<sh>.md`, required reading, skills, workflows, templates, knowledge. |
| `flint shard start-dev <ref> [--json]` | The same for the source (`dev-init-<sh>.md`). |
| `flint shard hstart <ref> [--json] [--dump]` | The headless manifest: `hinit-<sh>.md` and the `hwkfl-*` workflows. A shard with no `hinit-<sh>.md` is refused with the next command `flint shard start <ref>`. |
| `flint shard hstart-dev <ref> [--json]` | The headless manifest of the source. |

The header of every start names the shard:

```
# Shard: Meeting Notes (meet) v0.1.0
Id: 4426ad5b-e2a4-4046-b5ee-ebeee419a42f
Address: @nuu-cognition/shard/meeting-notes
Alias: meeting-notes
State: edited
Request: @nuu-cognition/shard/meeting-notes
```

`start` of a record with `from = "source"` loads the build. When the source changed after the build, `start` prints a notice on stderr and loads the build anyway:

```
⚠ The build of meeting-notes is stale: its source changed after the build. Next: flint shard build meeting-notes
```

The start refuses and exits 1 when a setup layer is `required` (`FORCE SETUP`, the setup file, then `SETUP REQUIRED`), when shard migrations are pending, when the record has no build here, when the reference source is gone (`reference-missing`, next `flint sync`), and when the ref is `not-found` or `ambiguous`. With `--json` every end is one JSON value (see [--json Shapes](#--json-shapes)).

Skill and workflow files begin with the context line `Run \`flint shard start <sh>\` if you haven't already.` (`hstart` for `hwkfl-*`, and `start-dev` / `hstart-dev` in a source).

### Install and Update

`flint shard install` has four inputs:

| Input | What the install does |
|-------|-----------------------|
| `@org/name[@range][#place]` (or a bare word) | Resolves the spec through the walk. From the registry: fetches the tag of the chosen version, checks the shard id and the package hash against the version before any write, and locks the shard at `published`. From a place: copies the folder (`resolved.from = place`). The record is the spec as you wrote it. |
| `--from-git <owner/repo>[#ref]` | Fetches the ref (a tag, a branch, or a commit), computes the hash, and asks the registry by id, then by hash. Three answers: a published version (`published`), a known package at another commit (`snapshot` with the sha and a notice), or an unregistered package (a held id when the package has no id). The record keeps `git = "owner/repo"`. |
| `--from-path <dir>` | Copies a folder on this machine. The record is a path record, the lock is `edited` with `resolved.from = path`. |
| `--reference` | Binds the shard with no build under `Shards/` (`use = "reference"`). The loader reads the folder on this machine. |

A bare word is the package `@<org of the Flint>/<word>` (`@/<word>` in a Flint with no org); a word of the official alias table is `@nuu-cognition/<slug>`. A positional `owner/repo` still installs from GitHub (the record `{ source = "owner/repo" }`); prefer `--from-git`.

```
$ flint shard install @nuu-cognition/meeting-notes@^0.1
✓ Resolved @nuu-cognition/shard/meeting-notes 0.1.0
✓ Installed Meeting Notes 0.1.0
  Spec    : @nuu-cognition/meeting-notes@^0.1
  Address : @nuu-cognition/shard/meeting-notes
  State   : published 0.1.0
  Registry: published
  Alias   : meeting-notes

$ flint shard install --from-git nuu-cognition/shard-meeting-notes
✓ Fetched nuu-cognition/shard-meeting-notes at 118d56d
✓ Installed Meeting Notes from nuu-cognition/shard-meeting-notes
  ℹ The registry knows this build: @nuu-cognition/shard/meeting-notes 0.1.0 (published).
  State   : published 0.1.0
  Registry: published
```

The records that these two commands write:

```toml
[shards]
meeting-notes = "@nuu-cognition/meeting-notes@^0.1"
# or, for the second command:
meeting-notes = { source = "@nuu-cognition/meeting-notes@0.1.0", git = "nuu-cognition/shard-meeting-notes" }
```

| Command | Purpose |
|---------|---------|
| `flint shard install <input> --alias <alias>` | Install under another alias (kebab-case). Needed for a second shard with the same slug. The build folder is the alias as a Title. |
| `flint shard install <input> --no-deps` | Install the shard alone. The missing dependencies are printed with their install commands. |
| `flint shard install --all-dev` | Build the shard of every source of this Flint. A record with `use = "none"` is skipped with one line. |
| `flint shard reinstall [<ref>]` | Install the shard again from its record. A `from = "source"` record calls `build`. |
| `flint shard update [<ref>] [--json]` | Resolve each spec again inside its range and move the lock to the highest version. A spec with an exact version does not move. A build of a source is skipped: `built from its source: run flint shard build <alias>`. A rename that the new version carries heals at once (`moved: …`). |
| `flint shard uninstall <ref> [--json]` | Remove the build, the lock record, the local entry, and the unchanged payloads. A changed or shared payload stays. For a `from = "source"` record the source and the record stay, and the record gets `use = "none"`. |

To take a new major version that the range excludes (`^0.1` does not take `1.0.0`), install the new range with the same alias: `flint shard install '@org/name@^1' --alias <alias>`.

The install refuses before any write, with the reason and a next command, when:

- the id or the hash of the fetched package differs from the registry record: `id-mismatch` or `hash-mismatch` ("Nothing was written").
- no version is inside the range: `no-version-in-range` (the reason names the published versions).
- the alias is the key of another shard. Next: `flint shard install <input> --alias <alias>`.
- the shorthand is taken: `the shorthand <sh> is used by <Name>`.
- the same shard id is already present: `shard <Name> is already present in this Flint as Shards/<folder> (alias <alias>)`.
- a present dependency is outside its range, a manifest does not parse (`manifest-error`), or the dependencies form a cycle.
- the lock holds a record of an older shape (`shard-record/0.1`, or the lock of 0.6.0). Next: `flint migrate run`.

The transitive plan prints one line per missing package before any write, then installs in that order and the shard last:

```
→ will install Plan from @nuu-cognition/plan@^0.4 (needed by Tasks)
```

### Author

| Command | Purpose |
|---------|---------|
| `flint shard create "<Name>" [-s <sh>] [-d "<desc>"] [--setup [full\|flint\|local]] [--no-install] [--json]` | Make a local source `Shards/(Source Local) <Name>/` with `shard.yaml` (the shard id, the source id, the org of the Flint), `dev-init-<sh>.md`, `README.md`, and a setup file with `--setup`. Writes the record `<alias> = { source = "@org/<slug>", from = "source" }` and builds the shard. `--no-install` writes `use = "none"` and builds nothing. The name follows the Display Name law ([[dev-knw-knap-manifest]] § name). **Always start here.** |
| `flint shard build <ref> [--force] [--json]` | Make the build from the source of the record and write the lock state: `snapshot` with the sha (a clean Git source) or `edited`. A build of a `use = "none"` record removes `use = "none"`. |
| `flint shard dev <ref> <url>` | Promote a local source to a remote source: `git init`, set the remote, commit, push. The folder becomes `(Source Remote) <Name>`, the source id stays, and the record gets `git = "owner/repo"`. |
| `flint shard clone <spec> [--from-git <owner/repo>] [--alias <alias>] [--no-build] [--json]` | Clone the source of a published shard into `Shards/(Source Remote) <Name>/`. The registry says where the repository is. Writes `{ source = "@org/<slug>", from = "source" }` (with `git` for a location that you gave) and builds the shard. |
| `flint shard fork <spec> --name "<Name>" [--shorthand <sh>] [--no-install] [--json]` | Make a new local source with a new shard id and a new source id, and `of` on each. The origin does not change. A fork in the same Flint needs a new shorthand. |
| `flint shard rename <ref> --name "<New Name>" [--json]` | Source only. One manifest edit (`name` and one `formerNames` line) plus the reconcile of this Flint: the source folder, the build folder, the key, the request, the lock, the type files with their links, the dependency keys of dependents. Every consumer heals at `flint sync`. See [[dev-knw-knap-architecture]] § Renames. |
| `flint shard rename <ref> --shorthand <new> [--json]` | Source only. Renames the prefixed files, rewrites the tags, links, and commands of the source, adds `formerShorthands`, bumps the major version, scaffolds `migrations/dev-mig-<new>-<from>-to-<to>.md` (an agent step with a `rewrite` block), and builds again (the step is queued for the build). A failure restores every file. |
| `flint shard id <ref> [--dry-run] [--json]` | Fill an absent shard id, source id, and `org` (the org of the Flint) into a source. A shard that is only a build is refused with `not-a-source`. On a dirty source or a work branch it writes the values and prints the next command `flint shard push <ref>`. |
| `flint shard type add <Name> --shard <ref> [--description] [--folder] [--dashboard] [--obsidian]` | Add an artifact type to a source and build it. |
| `flint shard push <ref> [-m "<msg>"] [-b [patch\|minor\|major]]` | Commit and push the remote source. |
| `flint shard pull <ref>` | `git pull` the remote source. |
| `flint shard release <ref> [<version>] [--org <slug>] [--no-register] [--json]` | Release a version (below). |

```
$ flint shard create 'Meeting Notes' --shorthand meet -d 'Notes of meetings.'
Created Meeting Notes.
Path: Shards/(Source Local) Meeting Notes
done: source: Shards/(Source Local) Meeting Notes (shorthand meet, address @nuu-cognition/shard/meeting-notes)
done: build: Shards/Meeting Notes
Next: flint shard start-dev meeting-notes

$ flint shard rename meeting-notes --name 'Meeting Log'
✓ Renamed (Source Local) Meeting Notes → (Source Local) Meeting Log
  Id         : 4426ad5b-e2a4-4046-b5ee-ebeee419a42f
  Alias      : meeting-notes → meeting-log
  Former name: Meeting Notes (meeting-notes) at 2026-09-24T05:26:26.588Z
  Build      : Shards/Meeting Notes → Shards/Meeting Log

$ flint shard create 'A/B'
Creation failed: Invalid shard name: the name "A/B" is not valid: The character "/" is forbidden in a Display Name.
```

A rename in a shard that has no source here is refused with `not-a-source`. `--title` works for one release and prints `use --name`; the old form `rename title <ref> <New>` prints the new form and runs it.

### Release

`flint shard release <ref>` releases the version in `shard.yaml` (or the version argument):

1. It refuses a source that is not a Git repository, has no remote, lacks `id`, `source.id`, or (in a Flint with an org) `org` (next `flint shard id <alias>`), is dirty, or has commits that are not pushed.
2. It hashes a build of a clean export of `HEAD`.
3. It tags `v<version>` and pushes the tag.
4. It registers the version with the NUU Shard Registry: the shard id, the source id, the org, the name, `formerNames`, the tag, the hash, the ref, and the sha. `--no-register` skips this step. After a rename, the registry moves the slug and answers the old slug with `moved`.
5. It builds the shard here and locks it at `published`.

```
$ flint shard release meeting-log
ℹ Releasing (Source Remote) Meeting Log v0.1.1…
  ✓ Created tag v0.1.1
  ✓ Pushed to origin
  ✓ Registered nuu-cognition/meeting-log (moved from nuu-cognition/meeting-notes)
  ✓ Built meeting-log: published 0.1.1
✓ Released Meeting Log v0.1.1
```

A repeat after a failed register finds the tag at `HEAD` and goes on. The registry records a GitHub `owner/repo` for each version, because an install fetches the version from there. `flint shard publish` is an alias of `release`. `flint shard unpublish <slug>` removes a shard from the registry (needs `flint login`).

### Retired Inputs

The runtime does not read these inputs. Each one exits 1 with one refusal and the new spelling; with `--json` the refusal is `{ ok: false, code: "retired", reason, next }`. The full table is in [[(Spec) Flint Shards . Lifecycle]] § Retired Inputs.

| Retired input | Use |
|---------------|-----|
| `flint://<Flint>/<shard>`, `@org/flint/<flint>/shard/<alias>`, `install --from-local` | `flint shard install @org/<slug>#<flint slug>` |
| `install <owner/repo> --edit` | `flint shard clone --from-git <owner/repo>` |
| `install <owner/repo>@<x.y.z>` | `flint shard install --from-git <owner/repo>#v<x.y.z>` |
| `pin <ref> <version>`, `unpin <ref>` | `flint shard install @org/<slug>@<version>` (or no version) |
| `edit = true`, `version = "…"` in `flint.toml` | `flint migrate run` |

```
$ flint shard install flint://Producer/meeting-notes
✘ flint:// is retired. Use: flint shard install @nuu-cognition/meeting-notes#producer
  flint shard install @nuu-cognition/meeting-notes#producer
```

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
| `flint shard migrate run <ref> [--dry-run]` | Run the queued steps. Script steps run in a chain. A step with a `rewrite` block rewrites the Mesh as code first (one line per file). The run stops at an agent or manual step. `--dry-run` writes nothing. |
| `flint shard migrate finish <ref>` | Mark the current agent or manual step done. The file stays in the build. |
| `flint shard migrate rerun <ref> <step>` | Run one step again. |

The ledger of a shard is in its lock record: `flint.json#shards[<id>].migrations` (done steps with their times) and `.pending` (queued steps).

### Scripts

Scripts live at `scripts/*.js` and are auto-discovered. Two invocation forms work; prefer the short form:

```bash
flint shard <ref> <script> [args...]        # short form (preferred)
flint shard <ref> exec <script> [args...]   # explicit exec form
```

Inside the script, the runtime exposes `FLINT_ROOT` (workspace root) and `FLINT_SHARD` (shard folder) as env vars. The shorthand is **not** in the filename — the file at `scripts/dev-prefix-shard.js` is invoked as `flint shard knap prefix-shard`.

### Workspace-Level

| Command | Purpose |
|---------|---------|
| `flint sync [--dry-run]` | Two reconciles. **The shard reconcile** (feature `shards`) makes each build match the lock: it installs a missing shard, builds a stale build of a source again, fetches the locked version when the build differs from the lock, heals a rename (`moved: <Old> is now <New> …`), and records a changed registry answer (with a notice). **The source reconcile** (feature `shard-sources`) reports the Git state of each source (`draft, ahead by N`, `behind`, `dirty`) and records it; it never changes a source. A missing dependency or a dependency outside its range is not current, with the next command. |
| `flint resolve <spec> [--json]` | The answer of the walk (see [The Package Spec](#the-package-spec)). |
| `flint migrate run [--dry-run]` | Run the pending Flint migration steps. The steps `s5`, `s6`, and `l4` of `flint-0.6.0-to-0.7.0` take a 0.6.0 Flint to the package model in one run (see [[dev-knw-knap-architecture]] § Upgrade of an Older Flint). `flint migrate rollback <run>` undoes a run. |

```
$ flint sync --dry-run
Changes
  ● Would move the shard notes: Meeting Notes is now Meeting Log (@nuu-cognition/shard/meeting-log); the folder, the key, and the type files follow; the request becomes @nuu-cognition/shard/meeting-log@^0.1#author
  ● Would record the registry answer published of notes
Notices
  ● The registry answer for notes (@nuu-cognition/shard/meeting-notes) is now published 0.1.0; the lock said unchecked.
```

## --json Shapes

| Command | Output |
|---------|--------|
| `list --json` | `{ rows: <row>[] }` |
| `status --json`, `info --json` | `{ ...<row>, details, moved?, health? }`. `details` holds `path`, `recordedVersion`, `staleVersion?`, `dependencies`, `payloads`, `state` (the lock state with its proof), `gitState` (the Git state of the source), `reference`, and `installedAt` |
| `start --json` (and `hstart`, `start-dev`, `hstart-dev`) | `{ ok, status, shard: <row>, state, loads, stale, moved?, notice?, next?, manifest: { text, folder, initPath, hinitPath, requiredReading }, setup: { declared, flint, local }, pending }`; a refusal adds `code`, `reason`, `next` |
| `build --json` | `{ ok, id, alias, folder, path, state }` (`folder` is the source, `path` is the build) |
| `clone --json` | `{ ok, alias, folder, spec, repo, git?, build? }` |
| `release --json` | `{ ok, alias, version, tag, sha, hash, repo, registered, slug, state }` |
| `versions --json` | `{ ok, address, from, versions: [{ tag, sha?, hash? }], installed }` |
| `id --json` | `{ ok, id, sourceId, org, minted, filled, folder, notice? }` |
| `fork --json` | `{ ok, id, sourceId, source, org, of, name, shorthand, folder, installed }` |
| `rename --json` | `{ ok: true, kind: "name" \| "shorthand", … }` |
| Every refusal | `{ ok: false, code, reason, next? }` (no `next` when no command fixes it, e.g. `manifest-error`) |

The row:

| Field | Value |
|-------|-------|
| `id` | The shard id. |
| `held` | `true` for a held id. |
| `alias`, `shorthand`, `name` | The key, the prefix, the name. |
| `address` | The address `@org/shard/<slug>`. |
| `request` | The spec of the record, in the full form. |
| `state` | The kind of the lock state: `published`, `snapshot`, `edited`, or `null` (no build here). |
| `version` | The version of the build here. |
| `from` | Where the build came from: `registry`, `git`, `path`, `source`, or `place`. |
| `registry` | The registry answer: `published`, `snapshot`, `unregistered`, or `unchecked`. |
| `use` | `copy`, `reference`, or `none`. |
| `folders` | `{ shard?, source? }` |
| `setup` | `required`, `not-required`, `completed`, or `none`. |
| `pending` | The queued shard migration steps. |
| `stale` | `true` when the source moved past its build. |

## When to Use What — Authoring Flow

1. `flint shard create "<Name>" -s <sh>` — scaffold the source, mint the two ids, build the shard.
2. Edit `dev-init-<sh>.md`, write skills, workflows, templates, and knowledge by hand.
3. `flint shard type add <Name> --shard <alias>` for each artifact type.
4. `flint shard scripts <alias>` to confirm script discovery; `flint shard <alias> <script>` to run one.
5. `flint shard rename <alias> --name "<New>"` or `--shorthand <new>` if you change the name — never rename by hand.
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
- ❌ Editing files in the build — the next build or install overwrites them. Edit the source, then `flint shard build <alias>`.
- ❌ Calling `flint shard heal` or `flint shard check` — neither command exists; `flint sync` and `flint shard status <alias> --health` cover them.
